/**
 * Handles the Socket connection.
 * @class Socket
 * @param {String} url The server url.
 * @param {JSON} ports The list of ports to connect.
 * @private
 * @since 0.7.0
 */
function Socket (serverUrl, ports) {
  /**
   * The Signaling server url.
   * @attribute serverUrl
   * @type String
   * @for Socket
   * @since 0.7.0
   */
  this.serverUrl = serverUrl;

  /**
   * The list of ports to connect with server.
   * @attribute ports
   * @type JSON
   * @for Socket
   * @since 0.7.0
   */
  this.ports = {
    'http:': Array.isArray(ports.http) && ports.http.length > 0 ? ports.http : [80, 3000],
    'https:': Array.isArray(ports.https) && ports.https.length > 0 ? ports.https : [443, 3443]
  };

  /**
   * The list of transports to communicate with server.
   * @attribute transports
   * @type JSON
   * @for Socket
   * @since 0.7.0
   */
  this.transports = {
    websocket: ['websocket'],
    polling: ['xhr-polling', 'jsonp-polling', 'polling']
  };

  /**
   * The socket.io-client object.
   * @attribute io
   * @type Object
   * @for Socket
   * @since 0.7.0
   */
  this.io = null;

  /**
   * The flag if connection is open.
   * @attribute opened
   * @type Boolean
   * @for Socket
   * @since 0.7.0
   */
  this.opened = false;

  /**
   * The current reconnection index.
   * @attribute connectionIndex
   * @type JSON
   * @for Sokcet
   * @since 0.7.0
   */
  this.connectionIndex = {
    port: 0,
    retries: 0,
    transport: 'websocket'
  };

  if (!window.WebSocket) {
    this.connectionIndex.transport = 'polling';
  }
}

/**
 * Function that connects to the Signaling server.
 * @method connect
 * @for Socket
 * @since 0.7.0
 */
Socket.prototype.connect = function (forceSSL) {
  var self = this;
  var protocol = forceSSL ? 'https:' : window.location.protocol;
  var url = protocol + '//' + self.serverUrl + ':' + self.ports[protocol][self.connectionIndex.port];
  var options = {
    reconnection: true,
    reconnectionAttempts: 2,
    forceNew: true,
    transports: self.transports[self.connectionIndex.transport]
  };
  var isLastAttempt = self.connectionIndex.transport === 'polling' &&
    self.connectionIndex.port === (self.ports[protocol].length - 1);

  if (isLastAttempt) {
    options.reconnectionAttempts = 4;
    options.reconectionDelayMax = 1000;
  }

  if (self.io) {
    self.disconnect();
  }

  console.debug([null, 'Socket', null, 'Connecting with options ->'], [url, JSON.stringify(options)]);

  self.io = io.connect(url, options);

  self.io.on('connect_error', function (error) {
    console.error([null, 'Socket', null, 'Failed connecting to server ->'], error);
  });

  self.io.on('reconnect_attempt', function (attempt) {
    console.debug([null, 'Socket', null, 'Attempting to reconnect to server ->'], attempt);
  });

  self.io.on('reconnect_error', function (error) {
    console.error([null, 'Socket', null, 'Reconnection attempt failed ->'], error);
  });

  self.io.on('reconnect_failed', function (error) {
    console.error([null, 'Socket', null, 'Reconnection failed ->'], error);

    if (isLastAttempt) {
      console.error([null, 'Socket', null, 'Reconnection attempts have all been used up and aborted.']);
      return;
    }

    if (self.connectionIndex.port === (self.ports[protocol].length - 1)) {
      if (self.connectionIndex.transport === 'websocket') {
        self.connectionIndex.transport = 'polling';
        self.connectionIndex.port = 0;
      }
    } else {
      self.connectionIndex.port += 1;
    }
    self.connect(!!forceSSL);
  });

  self.io.on('connect', function () {
    console.log([null, 'Socket', null, 'Connected.']);
    self.opened = true;
  });

  self.io.on('reconnect', function () {
    console.log([null, 'Socket', null, 'Reconnected.']);
    self.opened = true;
  });

  self.io.on('error', function (error) {
    console.error([null, 'Socket', null, 'Caught exception ->'], error);
  });

  self.io.on('disconnect', function () {
    console.log([null, 'Socket', null, 'Disconnected.']);
    self.opened = false;
  });

  self.io.on('message', function(messageStr) {
    var message = JSON.parse(messageStr || '{}');
    console.debug([null, 'Socket', null, 'Received message from server ->'], message);
  });

};

/**
 * Function that disconnects to the Signaling server.
 * @method disconnect
 * @for Socket
 * @since 0.7.0
 */
Socket.prototype.disconnect = function () {
  var self = this;

  console.debug([null, 'Socket', null, 'Disconnecting..']);

  if (self.io) {
    // Note that this was necessary was the older socket.io-clients versions.
    // Putting it here just in case.
    self.io.removeAllListeners('connect_error');
    self.io.removeAllListeners('reconnect_attempt');
    self.io.removeAllListeners('reconnect_error');
    self.io.removeAllListeners('reconnect_failed');
    self.io.removeAllListeners('connect');
    self.io.removeAllListeners('reconnect');
    self.io.removeAllListeners('error');
    self.io.removeAllListeners('disconnect');
    self.io.removeAllListeners('message');
    self.io.disconnect();
    self.io = null;
  }
};

/**
 * Function that sends message to the Signaling server.
 * @method message
 * @for Socket
 * @since 0.7.0
 */
Socket.prototype.message = function (message) {
  var self = this;

  if (!self.io || !self.opened) {
    console.warn([null, 'Socket', null, 'Dropping message as connection is not opened ->'], message);
    return;
  }

  console.debug([message.target ? message.target : 'server', 'Socket', null, 'Sending message ->'], message);

  self.io.send(JSON.stringify(message));
};
