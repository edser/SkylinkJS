/**
 * The list of <a href="#method_joinRoom"><code>joinRoom()</code> method</a> socket connection failure states.
 * @attribute SOCKET_ERROR
 * @param {Number} CONNECTION_FAILED    <small>Value <code>0</code></small>
 *   The value of the failure state when <code>joinRoom()</code> socket connection failed to establish with
 *   the Signaling server at the first attempt.
 * @param {Number} RECONNECTION_FAILED  <small>Value <code>-1</code></small>
 *   The value of the failure state when <code>joinRoom()</code> socket connection failed to establish
 *   the Signaling server after the first attempt.
 * @param {Number} CONNECTION_ABORTED   <small>Value <code>-2</code></small>
 *   The value of the failure state when <code>joinRoom()</code> socket connection will not attempt
 *   to reconnect after the failure of the first attempt in <code>CONNECTION_FAILED</code> as there
 *   are no more ports or transports to attempt for reconnection.
 * @param {Number} RECONNECTION_ABORTED <small>Value <code>-3</code></small>
 *   The value of the failure state when <code>joinRoom()</code> socket connection will not attempt
 *   to reconnect after the failure of several attempts in <code>RECONNECTION_FAILED</code> as there
 *   are no more ports or transports to attempt for reconnection.
 * @param {Number} RECONNECTION_ATTEMPT <small>Value <code>-4</code></small>
 *   The value of the failure state when <code>joinRoom()</code> socket connection is attempting
 *   to reconnect with a new port or transport after the failure of attempts in
 *   <code>CONNECTION_FAILED</code> or <code>RECONNECTED_FAILED</code>.
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype.SOCKET_ERROR = {
  CONNECTION_FAILED: 0,
  RECONNECTION_FAILED: -1,
  CONNECTION_ABORTED: -2,
  RECONNECTION_ABORTED: -3,
  RECONNECTION_ATTEMPT: -4
};

/**
 * The list of <a href="#method_joinRoom"><code>joinRoom()</code> method</a> socket connection reconnection states.
 * @attribute SOCKET_FALLBACK
 * @param {String} NON_FALLBACK      <small>Value <code>"nonfallback"</code></small>
 *   The value of the reconnection state when <code>joinRoom()</code> socket connection is at its initial state
 *   without transitioning to any new socket port or transports yet.
 * @param {String} FALLBACK_PORT     <small>Value <code>"fallbackPortNonSSL"</code></small>
 *   The value of the reconnection state when <code>joinRoom()</code> socket connection is reconnecting with
 *   another new HTTP port using WebSocket transports to attempt to establish connection with Signaling server.
 * @param {String} FALLBACK_PORT_SSL <small>Value <code>"fallbackPortSSL"</code></small>
 *   The value of the reconnection state when <code>joinRoom()</code> socket connection is reconnecting with
 *   another new HTTPS port using WebSocket transports to attempt to establish connection with Signaling server.
 * @param {String} LONG_POLLING      <small>Value <code>"fallbackLongPollingNonSSL"</code></small>
 *   The value of the reconnection state when <code>joinRoom()</code> socket connection is reconnecting with
 *   another new HTTP port using Polling transports to attempt to establish connection with Signaling server.
 * @param {String} LONG_POLLING_SSL  <small>Value <code>"fallbackLongPollingSSL"</code></small>
 *   The value of the reconnection state when <code>joinRoom()</code> socket connection is reconnecting with
 *   another new HTTPS port using Polling transports to attempt to establish connection with Signaling server.
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype.SOCKET_FALLBACK = {
  NON_FALLBACK: 'nonfallback',
  FALLBACK_PORT: 'fallbackPortNonSSL',
  FALLBACK_SSL_PORT: 'fallbackPortSSL',
  LONG_POLLING: 'fallbackLongPollingNonSSL',
  LONG_POLLING_SSL: 'fallbackLongPollingSSL'
};

/**
 * Function that sends Socket message to Signaling.
 * @method _socketSendMessage
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._socketSendMessage = function(message) {
  var self = this;

  // Check and prevent sending message if socket connection is not connected
  if (!self._socket.connected) {
    return log.warn([message.target || '(all)', 'Socket', message.type,
      'Dropping of message as Socket connection is not opened ->'], message);
  }

  // Check if message matches group list
  if (self._socket.queue.types.indexOf(message.type) > -1) {
    // "Queuing" mechanism just simply send if interval has reached.
    // It does go by order, it's kinda like UDP and messages may be sent in unordered manner
    // Whatever available broadcasted messages that can be sent, just be sent
    // Check if timestamp is within the specified interval
    if (!(self._socket.queue.timestamp && ((new Date ()).getTime() - self._socket.queue.timestamp) <= self._socket.queue.interval)) {
      // Clear existing timeout intervals since the current item is sent.
      // The rest of the queue items can wait. Sadz
      if (self._socket.queue.fn) {
        clearTimeout(self._socket.queue.fn);
      }
      self._socket.socket.send(JSON.stringify(message));
      // Trigger `incomingMessage` event if "public" type
      if (message.type === 'public') {
        self._trigger('incomingMessage', {
          content: message.data,
          isPrivate: false,
          targetPeerId: null,
          listOfPeers: Object.keys(self._peerInformations),
          isDataChannel: false,
          senderPeerId: self._user.id
        }, self._user.id, self.getPeerInfo(), true);
      // Update socket message timestamp event
      } else if (message.type !== 'stream') {
        self._user.timestamps[message.type] = message.stamp;
      }
      // Update socket messages queue timestamp
      self._socket.queue.timestamp = (new Date()).getTime();
      // Check if there is a current queue and start timing if so
      if (self._socket.queue.messages.length > 0) {
        self._socketSendMessageProcessNextQueue();
      }

    // Time to queue the socket messages
    } else {
      log.debug(['(all)', 'Socket', message.type, 'Queueing message ->'], message);
      self._socket.queue.messages.push(message);
      self._socketSendMessageProcessNextQueue();
    }
  // Send direct message without queuing.
  // Do note that the Signaling messages does throttling drops hence the queuing of broadcasted messages
  } else {
    log.debug([message.target || '(all)', 'Socket', message.type, 'Sending message ->'], message);
    self._socket.socket.send(JSON.stringify(message));
  }
};

/**
 * Function that sends Socket message to Signaling.
 * @method _socketSendMessage
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._socketSendMessageProcessNextQueue = function () {
  var self = this;

  // Append socket queue if it does exists
  if (!self._socket.queue.fn) {
    self._socket.queue.fn = setTimeout(function () {
      // Clear socket queue interval
      self._socket.queue.fn = null;
      // Check if socket connection is opened
      if (!self._socket.connected) {
        log.warn('Dropping queue stack of messages as socket connection is closed ->', self._socket.queue.messages);
        return;
      }
      // Check if there is any queue stack at all first
      if (self._socket.queue.messages.length === 0) {
        return;
      }

      var currentStack = [];

      // Remove outdated messages
      for (var i = 0; i < self._socket.queue.messages.length; i++) {
        var messageItem = self._socket.queue.messages[i];
        // Check if it is outdated before dropping them
        if (['muteAudioEvent', 'muteVideoEvent', 'updateUserEvent'].indexOf(messageItem.type) > -1 &&
          self._user.timestamps[messageItem.type] >= messageItem.stamp) {
          self._socket.queue.messages.splice(i, 1);
          i--;
        } else if (currentStack.length <= self._socket.queue.throughput) {
          if (['muteAudioEvent', 'muteVideoEvent', 'updateUserEvent'].indexOf(messageItem.type) > -1) {
            self._user.timestamps[messageItem.type] = messageItem.stamp;
          }
          self._socket.queue.messages.splice(i, 1);
          i--;
          currentStack.push(JSON.stringify(messageItem));
        }
      }

      // Send current queue of stack messages
      log.debug(['(all)', 'Socket', 'group', 'Sending queue stack ->'], currentStack);

      self._socket.socket.send(JSON.stringify({
        type: self._SIG_MESSAGE_TYPE.GROUP,
        lists: currentStack,
        mid: self._user.id,
        rid: self._user.room.session.rid
      }));
      self._socket.queue.timestamp = (new Date()).getTime();

      // Trigger `incomingMessage` events
      for (var j = 0; j < currentStack.length; j++) {
        if (currentStack[j].type === 'public') {
          self._trigger('incomingMessage', {
            content: currentStack[j].data,
            isPrivate: false,
            targetPeerId: null,
            listOfPeers: Object.keys(self._peerInformations),
            isDataChannel: false,
            senderPeerId: self._user.id
          }, self._user.id, self.getPeerInfo(), true);
        }
      }

      // Process next queue
      self._socketSendMessageProcessNextQueue();

    }, self._socket.queue.interval);
  }
};

/**
 * Function that establishes the Socket connection to Signaling.
 * @method _socketAttemptConnection
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._socketAttemptConnection = function (callback) {
  var self = this;
  var socketPorts = self._socket.ports[self._socket.session.protocol];
  // The `socketError` and `channelRetry` fallback state
  var fallbackState = null;

  // State when there is no existing current port
  if (self._socket.session.port === null) {
    self._socket.session.port = socketPorts[0];
    self._socket.session.finalAttempts = 0;
    self._socket.session.retries = 0;
    // Set the initial fallback state
    fallbackState = self.SOCKET_FALLBACK.NON_FALLBACK;

  // State when current port has reached the final last port
  } else if (ports.indexOf(self._signalingServerPort) === ports.length - 1) {
    // Let's attempt to use Polling transports from the first port
    if (self._socket.session.transportType === 'WebSocket') {
      self._socket.session.transportType = 'Polling';
      self._socket.session.port = socketPorts[0];
    // Let's attempt with another last 4 rounds
    } else {
      self._socket.session.finalAttempts++;
    }
  // State to go to the next port
  } else {
    self._socket.session.port = socketPorts[socketPorts.indexOf(self._socket.session.port) + 1];
  }

  // Socket.io-client options
  // Handle socket.io-client options for WebSocket transports (by default)
  self._socket.session.options = {
    forceNew: true,
    reconnection: true,
    timeout: self._options.socketTimeout,
    reconnectionAttempts: 2,
    reconnectionDelayMax: 5000,
    reconnectionDelay: 1000,
    transports: ['websocket']
  };

  // Handle socket.io-client options for Polling transports
  if (self._socket.session.transportType === 'Polling') {
    self._socket.session.options.reconnectionDelayMax = 1000;
    self._socket.session.options.reconnectionAttempts = 4;
    self._socket.session.options.transports = ['xhr-polling', 'jsonp-polling', 'polling'];
  }

  // Configure the non-initial fallback types
  if (fallbackState === null) {
    fallbackState = self._socket.session.protocol === 'http:' ?
    // Configure the HTTP protocol Polling or WebSocket type
      (self._socket.session.transportType === 'Polling' ? self.SOCKET_FALLBACK.LONG_POLLING :
      self.SOCKET_FALLBACK.FALLBACK_PORT) : (self._socket.session.transportType === 'Polling' ?
    // Configure the HTTPS protocol Polling or WebSocket type
      self.SOCKET_FALLBACK.LONG_POLLING_SSL : self.SOCKET_FALLBACK.FALLBACK_SSL_PORT);

    self._socket.session.retries++;

    // Trigger `socketError` event for RECONNECTION_ATTEMPT
    self._trigger('socketError', self.SOCKET_ERROR.RECONNECTION_ATTEMPT, null,
      fallbackState, self._socketGetSession());
    // Trigger `channelRetry` event for the first failure, not the reconnect attempts retries
    self._trigger('channelRetry', fallbackState, self._socket.session.retries, self._socketGetSession());
  }

  // Construct Signaling server path
  self._socket.session.path = self._socket.session.protocol + '//' + self._socket.server + ':' +
    self._socket.session.port; //'http://ec2-52-8-93-170.us-west-1.compute.amazonaws.com:6001';

  // Use the custom Signaling server url
  if (typeof self._options.socketServer === 'string') {
    self._socket.session.path = self._socket.session.protocol + '//' + self._options.socketServer + ':' +
      self._socket.session.port;
  }

  // Disconnect any existing socket connection
  if (self._socket.socket) {
    self._socket.removeAllListeners();
    self._socket.disconnect();
    self._socket = null;
  }

  self._socket.connected = false;

  log.log('Opening socket connection ->', self._socketGetSession());

  self._socket.socket = io.connect(self._socket.session.path, self._socket.session.options);

  // socket.io-client `reconnect_attempt` event
  // Triggered each time socket.io-client attempts to reconnect
  self._socket.socket.on('reconnect_attempt', function (attempt) {
    self._socket.session.retries++;
    // Trigger `channelRetry` event
    self._trigger('channelRetry', fallbackState, self._socket.session.retries, self._socketGetSession());
  });

  // socket.io-client `reconnect_attempt` event
  // Triggered each time socket.io-client fails to reconnect after all the maximum attempt configured
  self._socket.socket.on('reconnect_failed', function () {
    // Check if its the initial state, return as first connection failure
    if (fallbackState === self.SOCKET_FALLBACK.NON_FALLBACK) {
      // Trigger `socketError` event for CONNECTION FAILED
      self._trigger('socketError', self.SOCKET_ERROR.CONNECTION_FAILED,
        new Error('Failed connection with transport "' + self._socket.session.transportType +
        '" and port ' + self._socket.session.port + '.'), fallbackState, self._socketGetSession());
    // Else trigger as subsequent connection failure
    } else {
      // Trigger `socketError` event for RECONNECTION_FAILED
      self._trigger('socketError', self.SOCKET_ERROR.RECONNECTION_FAILED,
        new Error('Failed reconnection with transport "' + self._socket.session.transportType +
        '" and port ' + self._socket.session.port + '.'), fallbackState, self._socketGetSession());
    }
    // Check if it has reached the final attempt limit before fallbacking to the next available port / transport type
    if (self._socket.session.finalAttempts < 4) {
      self._socketAttemptConnection();
    // Check if it has reached the final attempt limit
    } else {
      // Trigger `socketError` event for RECONNECTION_ABORTED. Not more attempts to go on to retry.
      self._trigger('socketError', self.SOCKET_ERROR.RECONNECTION_ABORTED, new Error('Reconnection aborted as ' +
        'there no more available ports, transports and final attempts left.'), fallbackState, self._socketGetSession());
      callback(new Error('Reconnection aborted.'));
    }
  });

  // socket.io-client `reconnect_attempt` event
  // Triggered each time socket.io-client has connected
  self._socket.socket.on('connect', function () {
    if (!self._socket.connected) {
      log.log('Socket channel opened for port @' + self._socket.session.port + '.');
      self._socket.connected = true;
      // Trigger `channelOpen` event
      self._trigger('channelOpen', clone(self._socketSession));
      callback();
    }
  });

  // socket.io-client `reconnect` event
  // Triggered each time socket.io-client has connected after several reconnection attempts
  self._socket.socket.on('reconnect', function () {
    if (!self._socket.connected) {
      log.log('Socket channel opened after reconnection attempt (' + self._socket.session.retries +
        ') for port @' + self._socket.session.port + '.');
      self._socket.connected = true;
      // Trigger `channelOpen` event
      self._trigger('channelOpen', self._socketGetSession());
      callback();
    }
  });

  // socket.io-client `error` event
  // Triggered when socket.io-client event handler errors like `peerJoined` event from the call-stack.
  // Can be xhr-poll errors
  self._socket.socket.on('error', function(error) {
    // Disconnect Polling errors
    if (error.message.indexOf('xhr post error') > -1) {
      log.error('Socket channel Polling errors and connection is unstable. Disconnecting..');
      // Trigger `socketError` event
      self._trigger('socketError', self.SOCKET_ERROR.CONNECTION_ABORTED,
        new Error('Failed reconnection with transport "' + self._socket.session.transportType +
        '" and port ' + self._socket.session.port + '.'), fallbackState, self._socketGetSession());
      // Close socket connection
      self._socketClose();
      return;
    }
    log.error('App exception occurred. Please check your event handlers for code errors. ->', error);
    // Trigger `channelError` event
    self._trigger('channelError', error, self._socketGetSession());
  });

  // socket.io-client `error` event
  // Triggered when socket.io-client is disconnected abruptly
  self._socket.socket.on('disconnect', function() {
    if (self._socket.connected) {
      log.warn('Socket connection closed abruptly.');
      self._socket.connected = false;
      // Trigger `channelClose` event
      self._trigger('channelClose', self._socketGetSession());
      // Check if User is in Room and Socket connection was disconnected
      if (self._user.room.connected) {
        self.leaveRoom(false);
        self._trigger('sessionDisconnect', self._user.id, self.getPeerInfo());
      }
    }
  });

  // socket.io-client `message` event
  // Triggered when socket.io-client receives message from Peers
  self._socket.socket.on('message', function(messageStr) {
    var message = JSON.parse(messageStr);
    if (message.type === self._SIG_MESSAGE_TYPE.GROUP) {
      log.debug('Bundle of ' + message.lists.length + ' messages');
      for (var i = 0; i < message.lists.length; i++) {
        var indiMessage = JSON.parse(message.lists[i]);
        self._processSigMessage(indiMessage);
        self._trigger('channelMessage', indiMessage, self._socketGetSession());
      }
    } else {
      self._processSigMessage(message);
      self._trigger('channelMessage', message, clone(self._socketSession));
    }
  });
};

/**
 * Function that starts the Socket connection.
 * @method _socketOpen
 * @private
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._socketOpen = function (callback) {
  var self = this;

  if (self._socket.socket) {
    self._socketClose();
  }

  self._socket.session.port = null;
  self._socket.session.protocol = self._options.forceSSL ? 'https:' : window.location.protocol;
  // IE < 9 doesn't support WebSocket
  self._socket.session.transportType = !window.WebSocket ? 'Polling' : 'WebSocket';
  self._socket.session.retries = 0;
  self._socket.session.finalAttempts = 0;
  self._socket.session.fallbackState = null;

  // Begin with a websocket connection
  self._socketAttemptConnection(callback);
};

/**
 * Function that returns the Socket session information.
 * @method _socketGetSession
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._socketGetSession = function () {
  var self = this;
  return {
    finalAttempts: self._socket.session.finalAttempts,
    serverUrl: self._socket.session.path,
    socketOptions: clone(self._socket.session.options),
    attempts: self._socket.session.retries,
    transportType: self._socket.session.transportType
  };
};

/**
 * Function that stops the Socket connection.
 * @method _socketClose
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._socketClose = function() {
  var self = this;

  // Remove all current event listeners
  if (self._socket.socket) {
    self._socket.socket.removeAllListeners();
  }

  // Close connection or return as close if state is connected
  if (self._socket.connected) {
    if (self._socket.socket) {
      self._socket.socket.disconnect();
    }

    self._socket.connected = false;

    self._trigger('channelClose', self._socketGetSession());
  }

  self._socket.socket = null;
};