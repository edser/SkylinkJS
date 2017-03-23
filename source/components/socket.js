/**
 * Handles the Room socket.io-client connection to the Signling server.
 * @class Temasys.Socket
 * @param {JSON} [options] The options.
 * @param {String} [options.server] @[exp] The custom Signaling server domain to use.
 * @param {Array} [options.ports] @[exp] The custom list of Signaling server ports (`Number`) to use.
 * - The priority of port used is based on first index order starting from `0`.
 * @param {String} [options.path] @[exp] The custom Signaling server path to use.
 * @param {String} [options.protocol] The protocol to use to connect to the Signaling server.
 * - When not provided, the current accessing `window.location.protocol` will be used.
 * @param {Array} [options.transports] The list of socket.io-client transports to use.
 * - Available transports are: `"websocket"` (Websocket) and `"polling"` (Polling).
 * - The priority of transport to use are based on first index order starting from `0`.
 * - When not provided, `("websocket", "polling")` will be used.
 * - If the browser does not support `WebSocket` API, `"websocket"` transports will be ignored.
 * @param {Boolean} [options.compressData=false] The flag if data sent should be compressed.
 * @param {JSON} options.options The socket.io-client options configured for each socket.io-client transport type.
 * - The current default is `{ websocket: { reconnection: true, reconnectionAttempts: 2,
 *   reconnectionDelay: 5000, reconnectionDelayMax: 2000, randomizationFactor: 0.5, timeout: 20000 },
 *   polling: { reconnection: true, reconnectionAttempts: 4, reconnectionDelay: 2000,
 *   reconnectionDelayMax: 1000, randomizationFactor: 0.5, timeout: 20000 } }`
 * @param {JSON} options.options.index @[exp] The socket options for the `"index"` socket.io-client transport type.
 * - `"index"` can be identified as: `"websocket"` (Websocket) or `"polling"` (Polling).
 * @param {Boolean} [options.options.index.reconnection=true] The flag if socket connection should
 *   reconnect several attempts for the current transport or port used before switching to the next
 *   available transport or port available.
 * @param {Number} [options.options.index.reconnectionAttempts] The reconnection attempts to take if
 *   `options.options.index.reconnection` is enabled.
 * - The maximum value that can be provided is `5`.
 * @param {Number} [options.options.index.reconnectionDelay] The number of miliseconds to wait before
 *   starting the next reconnection attempt, which is affected by the `randomizationFactor` configured.
 * @param {Number} [options.options.index.reconnectionDelayMax] The maximum number of miliseconds to wait
 *   before starting the next reconnection attempt.
 * @param {Number} [options.options.index.randomizationFactor] The randomization for each reconnection attempt.
 * - The range is from `0` to `1`.
 * @param {Number} [options.options.index.timeout] The timeout in miliseconds to consider
 *   that the inital connection has timed out.
 * @constructor
 * @private
 * @for Temasys
 * @since 0.7.0
 */
function Socket (options, defaultOptions) {
  options = options && typeof options === 'object' ? options : {};

  /**
   * The Socket server domain.
   * @attribute server
   * @type String
   * @readOnly
   * @for Temasys.Socket
   * @since 0.7.0
   */
  this.server = options.server && typeof options.server === 'string' ? options.server :
    (defaultOptions.server && typeof defaultOptions.server === 'string' ?
    defaultOptions.server : 'signaling.temasys.io');

  /**
   * The Socket path.
   * @attribute path
   * @type String
   * @readOnly
   * @for Temasys.Socket
   * @since 0.7.0
   */
  this.path = options.path && typeof options.path === 'string' ? options.path : '/socket.io';

  /**
   * The Socket protocol.
   * @attribute protocol
   * @type String
   * @readOnly
   * @for Temasys.Socket
   * @since 0.7.0
   */
  this.protocol = options.protocol && typeof options.protocol === 'string' && options.protocol.length > 2 &&
    options.protocol.indexOf(':') === (options.protocol.length - 1) ? options.protocol : window.location.protocol;

  /**
   * The flag if Socket data sent is compressed.
   * @attribute compressed
   * @type Boolean
   * @readOnly
   * @for Temasys.Socket
   * @since 0.7.0
   */
  this.compressed = options.compressData === true;

  /**
   * The Socket current states.
   * @attribute $current
   * @type JSON
   * @param {String} state The current Socket connection state.
   * - See {{#crossLink "Temasys.Socket/STATE_ENUM:attribute"}}{{/crossLink}} for reference.
   * @param {Boolean} connected The flag if Socket is connected.
   * @param {Number} reconnectionAttempts The current total number of reconnection attempts
   *   made for the current port and socket.io-client transport used.
   * @param {Number} fallbackAttempts The current total number of fallback attempts made.
   * @param {Number} port The current port used.
   * @param {String} transport The current socket.io-client transport used.
   * @param {JSON} options The current socket.io-client options used.
   * @readOnly
   * @for Temasys.Socket
   * @since 0.7.0
   */
  this.$current = {
    state: null,
    connected: false,
    reconnectionAttempts: 0,
    fallbackAttempts: 0,
    port: null,
    transport: null,
    options: null
  };

  // Private variables
  // Event manager
  this._event = Utils.createEventManager();
  // Socket.io-client connection
  this._connection = null;
  // The cached config
  this._config = {
    // Configure user defined ports
    ports: Array.isArray(options.ports) && options.ports.length > 0 ? {
      'https:': options.ports,
      'http:': options.ports
    // Configure API given ports, if not fallback
    } : {
      'https:': Array.isArray(defaultOptions.httpsPorts) && defaultOptions.httpsPorts.length > 0 ?
        defaultOptions.httpsPorts : [443, 3443],
      'http:': Array.isArray(defaultOptions.httpPorts) && defaultOptions.httpPorts.length > 0 ?
        defaultOptions.httpPorts : [80, 3000]
    },
    // Configure user defined transports, if not fallback
    transports: Array.isArray(options.transports) && options.transports.length > 0 ?
      options.transports : (window.WebSocket ? ['websocket', 'polling'] : ['polling']),
    options: options.options && typeof options.options === 'object' ? options.options : {}
  };
  // The socket messages grouping and queue. Follows SM 0.1.2 protocol except for "roomLockEvent" being queued.
  this._buffer = {
    // 0: Stringified messages, 1: Callbacks
    queue: [[], []],
    timer: false,
    timestamp: 0,
    status: {
      updateUserEvent: 0,
      muteAudioEvent: 0,
      muteVideoEvent: 0
    },
    cached: {
      room: null,
      user: null
    }
  };

  // Events
  /**
   * Event triggered when Socket connection state has been changed.
   * @event stateChange
   * @param {String} state The current Socket connection state.
   * - See {{#crossLink "Temasys.Socket/STATE_ENUM:attribute"}}{{/crossLink}} for reference.
   * @param {Error} error The error object.
   * - This is defined when `state` is `STATE_ENUM.RECONNECT_FAILED`,
   *   `STATE_ENUM.CONNECT_ERROR` and `STATE_ENUM.CONNECT_TIMEOUT`.
   * @param {Number} attempt The reconnection attempt.
   * @param {Number} port The port used for the reconnection attempt.
   * @param {Number} transport The transport used for the reconnection attempt.
   * @for Temasys.Socket
   * @since 0.7.0
   */
  /**
   * Event triggered when Socket connection sends or receives Signaling server keep-alive responses.
   * @event response
   * @param {Number} timestamp The timestamp in miliseconds when response is sent or received.
   * @param {Boolean} isSelf The flag if response is from self.
   * @param {Number} [latency] The current latency in miliseconds from receiving "pong"
   *   response from Signaling server after sending a "ping".
   * - This is defined when `isSelf` is `false`.
   * @for Temasys.Socket
   * @since 0.7.0
   */
  /**
   * Event triggered when Socket connection sends or receives a message.
   * @event message
   * @param {JSON} message The message.
   * @param {Boolean} isSelf The flag if message is from self.
   * @param {Error} [error] The error object.
   * - This is defined when message failed to send or parse received message.
   * @for Temasys.Socket
   * @since 0.7.0
   */
  /**
   * Event triggered when stats retrieval state has changed.
   * @event getStatsStateChange
   * @param {String} state The current stats retrieval state.
   * - See {{#crossLink "Temasys.Socket/GET_STATS_STATE_ENUM:attribute"}}{{/crossLink}} for reference.
   * @param {JSON} [stats] The stats.
   * - This is defined when `state` is `SUCCESS`.
   * @param {String} stats.id The Socket connection socket.io-client ID.
   * @param {JSON} stats.messages The messages stats.
   * @param {Number} stats.messages.sent The number of messages sent from this Socket connection.
   * @param {Number} stats.messages.received The number of messages received from this Socket connection.
   * @param {Number} stats.messages.buffered The current number of messages buffered for this Socket connection to be sent.
   * @param {JSON} stats.responses The responses stats.
   * @param {JSON} stats.responses.ping The responses stats for "ping" response.
   * @param {Number} stats.responses.ping.sent The total number of "ping" response sent from this Socket connection.
   * @param {String} stats.responses.ping.timestamp The latest timestamp of the "ping" response sent.
   * @param {JSON} stats.responses.pong The response stats for "pong" response.
   * @param {Number} stats.responses.pong.received The total number of "pong" response received from this Socket connection.
   * @param {String} stats.responses.pong.timestamp The latest timestamp of the "pong" response received.
   * @param {JSON} stats.responses.latency The response latency.
   * @param {Number} stats.responses.latency.average The average response latency in miliseconds.
   * @param {Number} stats.responses.latency.lowest The lowest response latency in miliseconds.
   * @param {Number} stats.responses.latency.highest The highest response latency in miliseconds.
   * @param {Error} [error] The error object.
   * - This is defined when `state` is `FAILED`.
   * @for Temasys.Socket
   * @since 0.7.0
   */
  /**
   * Event triggered when there are exceptions thrown in this event handlers.
   * @event domError
   * @param {Error} error The error object.
   * @for Temasys.Socket
   * @since 0.7.0
   */
  (function (ref) {
    ref.on = ref._event.on;
    ref.once = ref._event.once;
    ref.off = ref._event.off;
    // Catch errors to prevent issues for socket connection
    ref._event.catch(function (error) {
      ref._event.emit('domError', error);
    });
  })(this);
}

/**
 * The enum of Socket connection states.
 * @attribute STATE_ENUM
 * @param {String} RECONNECT_FAILED The state when Socket connection failed to reconnect after
 *   the several specified attempts configured for the current port and transport used.
 *   At this state, the Socket connection will fallback to the next available port or transport.
 * @param {String} RECONNECT_ERROR The state when Socket connection failed to reconnect for the
 *   current attempt.
 * @param {String} RECONNECT_ATTEMPT The state when Socket connection is attempting to reconnect.
 * @param {String} RECONNECTING The state when Socket connection is reconnecting.
 * @param {String} RECONNECT The state when Socket connection has reconnected successfully.
 * @param {String} CONNECT_TIMEOUT The state when Socket connection has failed to connect after
 *   the specified timeout configured for the current port and transport.
 *   At this state, the socket connection will attempt to reconnect a few more times if reconnection is enabled.
 * @param {String} CONNECT_ERROR The state when Socket connection has errors and disconnects.
 * @param {String} CONNECT The state when Socket connection has connected successfully.
 * @param {String} DISCONNECT The state when Socket connection has been disconnected.
 * @param {String} ABORT The state when Socket connection has aborted from attempting any available
 *   ports or transports or reconnection as there is none left to reconnect or fallback with.
 * @param {String} CONSTRUCT_ERROR The state when Socket connection failed to construct.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Socket
 * @since 0.7.0
 */
Socket.prototype.STATE_ENUM = {
  RECONNECT_ATTEMPT: 'reconnect_attempt',
  RECONNECT_FAILED: 'reconnect_failed',
  RECONNECT_ERROR: 'reconnect_error',
  RECONNECTING: 'reconnecting',
  RECONNECT: 'reconnect',
  CONNECT_TIMEOUT: 'connect_timeout',
  CONNECT_ERROR: 'connect_error',
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ABORT: 'abort',
  CONSTRUCT_ERROR: 'construct_error'
};

/**
 * The enum of {{#crossLink "Temasys.Socket/getStats:method"}}{{/crossLink}} states.
 * @attribute GET_STATS_STATE_ENUM
 * @param {String} LOADING The state when `getStats()` is retrieving stats.
 * @param {String} SUCCESS The state when `getStats()` has retrieved stats successfully.
 * @param {String} FAILED The state when `getStats()` has failed to retrieve stats.
 * @readOnly
 * @final
 * @for Temasys.Socket
 * @since 0.7.0
 */
Socket.prototype.GET_STATS_STATE_ENUM = {
	LOADING: 'loading',
  SUCCESS: 'success',
  FAILED: 'failed'
};

/**
 * Function to retrieve Socket connection stats.
 * @method getStats
 * @return {Promise} The Promise for function request completion.
 * @example
 *   socket.getStats().then(function (stats) {
 *     console.log("Received stats ->", stats);
 *   }).catch(function (error) {
 *     console.error("Received error ->", error);
 *   });
 * @for Temasys.Socket
 * @since 0.7.0
 */
Socket.prototype.getStats = function () {
};

/**
 * Function to start socket connection.
 */
Socket.prototype._connect = function (fn) {
  var ref = this;
  // These are stored states since sometimes the event is triggered after the restart
  var eventAttempts = 0, eventPort = null, eventTransport = null, isFnTriggered = false;
  var usePorts = ref._config.ports[ref.protocol];
  var useTransports = ref._config.transports;

  /**
   * Internal function to update "state" event.
   */
  var fnUpdate = function (state, error) {
    // Check if state is reconnect_attempt
    if (state === ref.STATE_ENUM.RECONNECT_ATTEMPT) {
      eventAttempts++;
    }

    ref.current.state = state;

    ref._event.emit('state', state, error || null, {
      reconnectionAttempts: eventAttempts,
      transport: eventTransport,
      port: eventPort
    });

    // Check state to fallback next available port or transport
    if ((state === ref.STATE_ENUM.CONNECT_TIMEOUT && !ref.current.options.reconnection) ||
      state === ref.STATE_ENUM.RECONNECT_FAILED) {
      ref._disconnect();
      ref._connect(fn);

    // Res callback as it is successful
    } else if ([ref.STATE_ENUM.RECONNECT, ref.STATE_ENUM.CONNECT].indexOf(state) > -1 && !ref.current.connected) {
      ref.current.connected = true;
      if (!isFnTriggered) {
        isFnTriggered = true;
        fn(null);
      }

    // Res that disconnect has been made
    } else if (state === ref.STATE_ENUM.DISCONNECT) {
      if (!ref.current.connected) {
        return;
      }
      ref.current.connected = true;

    // Res callback has failed
    } else if ([ref.STATE_ENUM.ABORT, ref.STATE_ENUM.CONSTRUCT_ERROR].indexOf(state) > -1 && !isFnTriggered) {
      isFnTriggered = true;
      fn(new Error('Failed to connect'));
    }
  };

  // Initial connection
  if (ref.current.port === null) {
    ref.current.port = usePorts[0];
    ref.current.transport = useTransports[0];
    ref.current.fallbackAttempts = 0;

  // Fallback to next available transport
  } else if (ref.current.port === usePorts[usePorts.length - 1]) {
    // Last available transport, aborted
    if (ref.current.transport === useTransports[useTransports.length - 1]) {
      return fnUpdate(ref.STATE_ENUM.ABORT);
    }

    ref.current.transport = useTransports[useTransports.indexOf(ref.current.transport) + 1];
    ref.current.port = usePorts[0];
    ref.current.fallbackAttempts++;

  // Fallback to next available port
  } else {
    ref.current.port = usePorts[usePorts.indexOf(ref.current.port) + 1];
    ref.current.fallbackAttempts++;
  }

  // Configure the socket.io-client options
  var useOptions = ref._config.options[ref.current.transport];

  useOptions = useOptions && typeof useOptions === 'object' ? useOptions : {};
  eventPort = ref.current.port;
  eventTransport = ref.current.transport;

  ref.current.attempts = 0;
  ref.current.options = {
    // Configure socket.io-client /path
    path: ref.path,
    // Configure socket.io-client reconnection option
    reconnection: useOptions.reconnection !== false,
    // Configure socket.io-client reconnection attempts. Must be less or equals to 5
    reconnectionAttempts: typeof useOptions.reconnectionAttempts === 'number' &&
      useOptions.reconnectionAttempts <= 5 ? useOptions.reconnectionAttempts :
      (ref.current.transport === 'websocket' ? 2 : 4),
    // Configure socket.io-client reconnection delay
    reconnectionDelay: typeof useOptions.reconnectionDelay === 'number' ? useOptions.reconnectionDelay :
      (ref.current.transport === 'websocket' ? 5000 : 2000),
    // Configure socket.io-client reconnection delay max
    reconnectionDelayMax: typeof useOptions.reconnectionDelayMax === 'number' ? useOptions.reconnectionDelayMax :
      (ref.current.transport === 'websocket' ? 2000 : 1000),
    // Configure socket.io-client randomization factor
    randomizationFactor: typeof useOptions.randomizationFactor === 'number' &&
      useOptions.randomizationFactor >= 0 && useOptions.randomizationFactor <= 1 ?
      useOptions.randomizationFactor : 0.5,
    // Configure socket.io-client timeout first to consider failure
    timeout: typeof useOptions.timeout === 'number' ? useOptions.timeout : 20000,
    // Configure socket.io-client transports
    transports: [ref.current.transport],
    // Let us call `.open()` manually later
    autoConnect: false,
    // Deprecated socket.io-client 1.4.x
    forceNew: true
  };

  var socket = null;

  // Catch any "http:" accessing errors on "https:" sites errors
  // Deprecated socket.io-client 1.4.x
  try {
    socket = io.connect(ref.protocol + '//' + ref.server + ':' + ref.current.port, ref.current.options);
  } catch (error) {
    return fnUpdate(ref.STATE_ENUM.CONSTRUCT_ERROR, error);
  }

  /**
   * Socket.io-client "connect" state.
   */
  socket.on('connect', function () {
    fnUpdate(ref.STATE_ENUM.CONNECT);
  });

  /**
   * Socket.io-client "reconnect" state.
   */
  socket.on('reconnect', function () {
    fnUpdate(ref.STATE_ENUM.RECONNECT);
  });

  /**
   * Socket.io-client "disconnect" state.
   */
  socket.on('disconnect', function () {
    fnUpdate(ref.STATE_ENUM.DISCONNECT);
  });

  /**
   * Socket.io-client "connect_timeout" state.
   */
  socket.on('connect_timeout', function () {
    fnUpdate(ref.STATE_ENUM.CONNECT_TIMEOUT);
  });

  /**
   * Socket.io-client "connect_error" state.
   */
  socket.on('connect_error', function (error) {
    fnUpdate(ref.STATE_ENUM.CONNECT_ERROR, error && typeof error === 'object' ?
      error : new Error(error || 'Connect error'));
  });

  /**
   * Socket.io-client "reconnecting" state.
   */
  socket.on('reconnecting', function () {
    fnUpdate(ref.STATE_ENUM.RECONNECTING);
  });

  /**
   * Socket.io-client "reconnect_error" state.
   */
  socket.on('reconnect_error', function (error) {
    fnUpdate(ref.STATE_ENUM.RECONNECT_ERROR, error && typeof error === 'object' ?
      error : new Error(error || 'Reconnect error'));
  });

  /**
   * Socket.io-client "reconnect_failed" state.
   */
  socket.on('reconnect_failed', function () {
    fnUpdate(ref.STATE_ENUM.RECONNECT_FAILED);
  });

  /**
   * Socket.io-client "reconnect_failed" state.
   */
  socket.on('reconnect_attempt', function () {
    fnUpdate(ref.STATE_ENUM.RECONNECT_ATTEMPT);
  });

  /**
   * Socket.io-client "error" state.
   * Deprecated socket.io-client 1.4.x
   */
  socket.on('error', function (error) {
    ref._event.emit('domError', error && typeof error === 'object' ?
      error : new Error(error || 'DOM exception'));
  });

  /**
   * Socket.io-client "ping" state.
   */
  socket.on('ping', function () {
    ref._event.emit('response', ref.RESPONSE_ENUM.PING, Date.now(), null);
  });

  /**
   * Socket.io-client "pong" state.
   */
  socket.on('pong', function (latency) {
    ref._event.emit('response', ref.RESPONSE_ENUM.PONG, Date.now(), latency);
  });

  /**
   * Socket.io-client "message" state.
   */
  socket.on('message', function (messageStr) {
    var message = JSON.parse(messageStr);
    // Cache the room ID for group messages later
    if (message.type === 'inRoom') {
      ref._buffer.cached.room = message.rid;
      ref._buffer.cached.user = message.sid;
    }
    ref._event.emit('message', message, null, false);
  });

  ref._connection = socket;

  if (typeof socket.connect === 'function') {
    // Catch any "http:" accessing errors on "https:" sites errors
    try {
      socket.connect();
    } catch (error) {
      fnUpdate(ref.STATE_ENUM.CONSTRUCT_ERROR, error);
    }
  }
};

/**
 * Function to stop socket connection.
 */
Socket.prototype._disconnect = function () {
  var ref = this;

  if (ref._connection) {
    if (ref.current.connected) {
      ref._connection.disconnect();
    }
    ref._connection = null;
  }
};

/**
 * Function to send the next batch of queued messages.
 */
Socket.prototype._sendNextQueue = function (fnSend) {
  var ref = this;

  if (ref._buffer.timer) {
    clearTimeout(ref._buffer.timer);
  }

  ref._buffer.timer = setTimeout(function () {
    // Ignore if there is no queue to send
    if (ref._buffer.queue[0].length === 0) {
      return;
    }

    var now = Date.now();

    if ((now - ref._buffer.timestamp) > 1000) {
      Utils.forEach(ref._buffer.queue[0], function (qMessageStr, i) {
        var qMessage = JSON.parse(qMessageStr);
        // Drop outdated messages
        if (['muteVideoEvent', 'muteAudioEvent', 'updateUserEvent'].indexOf(qMessage.type) > -1 &&
          ref._buffer.status[qMessage.type] >= qMessage.stamp) {
          ref._buffer.queue[0].splice(i, 1);
          // Trigger callback because status is outdated so it's technically updated
          ref._buffer.queue[1].splice(i, 1)[0](null);
          return -1;
        }
      });

      var messageList = ref._buffer.queue[0].splice(0, 16);
      var fnList = ref._buffer.queue[1].splice(0, 16);

      // Send the next batch
      fnSend([{
        type: 'group',
        mid: ref._buffer.cached.user,
        rid: ref._buffer.cached.room,
        list: messageList

      }, function (error) {
        Utils.forEach(fnList, function (fnItem, i) {
          ref._event.emit('message', JSON.parse(messageList[i]), error || null, true);
          fnItem(error || null);
        });
      }]);
      ref._buffer.timestamp = now;
      ref._sendNextQueue(fnSend);
    }
  }, 1000);
};

/**
 * Function to send messages.
 */
Socket.prototype._send = function (message, fn) {
  var ref = this;

  /**
   * Internal function to send message.
   */
  var fnSend = function (item) {
    if (!(ref._connection && ref.current.connected)) {
      var notOpenError = new Error('Failed to send message as socket is not connected');
      ref._event.emit('message', item[0], notOpenError, true);
      return item[1](notOpenError);
    }

    // "compress" functionality may not work until server has implemented it
    ref._connection.compress(ref.compressData).send(item[0], function () {
      // TODO: Server to send ack? Not documenting this as it might not be available yet
      ref._event.emit('messageAck', item[0]);
    });

    ref._event.emit('message', item[0], null, true);
    item[1](null);
  };

  // Priority channel which should not be buffered in which server should queue that.
  if (['joinRoom', 'enter', 'restart', 'welcome', 'endOfCandidates'].indexOf(message.type) > -1) {
    fnSend([message, typeof fn === 'function' ? fn : function () {}]);

  // Messaging channel for broadcast or info messages to buffer which server would drop
  } else if (['private', 'roomLockEvent', 'stream', 'public', 'updateUserEvent',
    'muteAudioEvent', 'muteVideoEvent'].indexOf(message.type) > -1) {

    setTimeout(function () {
      var now = Date.now();

      // Set the stamp value
      if (['muteVideoEvent', 'muteAudioEvent', 'updateUserEvent'].indexOf(message.type) > -1) {
        ref._buffer.status[message.type] = now;
        message.stamp = now;
      }

      if ((now - ref._buffer.timestamp) > (message.type === 'private' ? 120 : 1000)) {
        fnSend([message, typeof fn === 'function' ? fn : function () {}]);
        ref._buffer.timestamp = now;
        ref._sendNextQueue(fnSend);
        return;
      }

      // Prevent delayed Room locks
      if (message.type === 'roomLockEvent') {
        var droppedError = new Error('Unable to send command to lock Room due to messages buffer');
        ref._emit('message', message, droppedError, true);
        (typeof fn === 'function' ? fn : function () {})(droppedError);
        return;
      }

      ref._buffer.queue[0].push(JSON.stringify(message));
      ref._buffer.queue[1].push(typeof fn === 'function' ? fn : function () {});
      ref._sendNextQueue(fnSend);
    }, 0);

  // Invalid messages which is not part of the SM protocol
  } else {
    var invalidError = new Error('Invalid message type provided');
    ref._event.emit('message', message, invalidError, true);
    if (typeof fn === 'function') {
      fn(invalidError);
    }
  }
};