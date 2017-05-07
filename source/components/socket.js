/**
 * Handles the Socket connection to the Signaling server.
 * @class Temasys.Socket
 * @param {JSON} options The options.
 * - Note that configuring these settings may result in connection failures.
 *   Please configure them only for debugging purposes only.
 * @param {Array} [options.servers] The list of Signaling servers to attempt to connect to.
 * - When not provided, the default values returned from Auth server is used.
 * @param {JSON} [options.servers._index] The Signaling server.
 * @param {String} options.servers._index.server The Signaling server domain.
 * @param {Number} options.servers._index.port The Signaling server port.
 * @param {String} [options.servers._index.protocol] The Signaling server protocol.
 * - When not provided, the value is the current accessing `window.location.protocol`.
 * @param {String} [options.servers._index.path] The Signaling server path.
 * - When not provided, the value is `/socket.io`.
 * @param {Boolean} [options.servers._index.reconnection] The flag if socket connection should
 *   reconnect several attempts for the current transport or port used before switching to the next
 *   available transport or port available.
 * - When not provided, the value is `false` (`true` if `.transport` is `TRANSPORT_ENUM.POLLING`).
 * @param {Number} [options.servers._index.reconnectionAttempts] The reconnection attempts to take if
 *   `options.options.index.reconnection` is enabled.
 * - The maximum value that can be provided is `5`.
 * - When not provided, the value is `0` (`4` if `.transport` is `TRANSPORT_ENUM.POLLING`).
 * @param {Number} [options.servers._index.reconnectionDelay] The number of miliseconds to wait before
 *   starting the next reconnection attempt, which is affected by the `randomizationFactor` configured.
 * - When not provided, the value is `2000`.
 * @param {Number} [options.servers._index.reconnectionDelayMax] The maximum number of miliseconds to wait
 *   before starting the next reconnection attempt.
 * - When not provided, the value is `2000` (`1000` if `.transport` is `TRANSPORT_ENUM.POLLING`).
 * @param {Number} [options.servers._index.randomizationFactor] The randomization for each reconnection attempt.
 * - When not provided, the value is `0.5`, and the range is from `0` to `1`.
 * @param {Number} [options.servers._index.timeout] The timeout in miliseconds to consider
 *   that the inital connection has timed out.
 * - When not provided, the value is `20000`.
 * @param {String} [options.servers._index.transport] The transport type.
 * - This references the `TRANSPORT_ENUM` constant.
 * - When not provided, the value is `TRANSPORT_ENUM.WEBSOCKET` or `TRANSPORT_ENUM.POLLING` if
 *   [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) is not supported.
 * @param {JSON} [options.data] The data settings.
 * @param {Boolean} [options.data.compress] The flag if sending data should be compressed if feature
 *   is available on connected Signaling server.
 * - When not provided, the value is `false`.
 * @param {Number} [options.data.priorityInterval] The interval between each priority SM protocol messages sent in queue.
 * - When not provided, the value is `10`.
 * @constructor
 * @private
 * @since 0.7.0
 */
Temasys.Socket = function (options, defaultOptions) {
  var ref = this;

  // Set the event manager
  ref._eventManager = Temasys.Utils.createEventManager();
  // Set the component ID
  ref._componentId = _log.configure(null, function (fn) {
    ref._eventManager.catchExceptions(typeof fn === 'function' ? function (error) {
      fn(ref._componentId, error);
    } : null);
  });


  // Stores the socket data settings
  ref._data = {
    compress: false,
    queue: {
      buffer: [[],[]],
      timer: null,
      sentTimestamp: 0,
      priorityInterval: 10
    },
    status: {
      updateUserEvent: 0,
      muteAudioEvent: 0,
      muteVideoEvent: 0
    },
    session: {
      roomId: null,
      peerId: null
    }
  };

  // Stores the list of fallback options
  ref._servers = [];

  // Stores the socket current state
  ref._state = {
    serverIndex: -1,
    connectionState: '',
    activeState: '',
    connected: false,
    triggered: {},
    options: {
      url: null,
      settings: null
    }
  };

  // Stores the socket stats
  ref._stats = {
    messages: {
      send: { total: 0, errors: 0 },
      recv: { total: 0, errors: 0 }
    },
    connection: {
      reconnections: {
        total: 0,
        servers: []
      },
      pings: { total: 0 },
      pongs: {
        total: 0,
        latency: {
          total: null,
          highest: null,
          lowest: null
        }
      }
    }
  };

  // Stores the socket.io-client object
  ref._connection = null;
  ref._setConfig(options, defaultOptions);

  /**
   * Event triggered when connection state has been changed.
   * @event connectionStateChange
   * @param {String} state The current connection state.
   * - This references `CONNECTION_STATE_ENUM` constant.
   * @param {Error} error The error object.
   * - This is defined when `state` is `RECONNECT_FAILED`, `RECONNECT_END`, `CONNECT_ERROR`.
   * @param {JSON} current The current settings.
   * @param {Number} current.attempts The current reconnection attempt for server item.
   * @param {Number} current.serverIndex The server item index of the server items configured.
   * @param {String} current.url The socket.io-client url used.
   * @param {JSON} current.options The socket.io-client options used.
   * - References the [socket.io-client documentation for `options`](https://socket.io/docs/client-api/#new-manager-url-options).
   * @for Temasys.Socket
   * @since 0.7.0
   */
  /**
   * Event triggered when connection active state has been changed.
   * @event activeStateChange
   * @param {String} state The current active state.
   * - This references `STATE_ENUM` constant.
   * @param {Number} date The current date time in milliseconds.
   * @param {Number} [latency] The response time latency.
   * - This is defined only when `state` is `ACTIVE_STATE_ENUM.PONG`.
   * @for Temasys.Socket
   * @since 0.7.0
   */
  /**
   * Event triggered when message is sent or received.
   * @event message
   * @param {JSON|String} message The message object.
   * - When defined as type of `String`, it could indicate that received message has parsing errors.
   * @param {Error} [error] The error object.
   * - This is defined only when parsing of received message or when sending message has errors.
   * @param {Boolean} isSelf The flag if self is sending the message.
   * @for Temasys.Socket
   * @since 0.7.0
   */

   ref.on = ref._eventManager.on;
   ref.once = ref._eventManager.once;
   ref.off = ref._eventManager.off;
};

/**
 * The enum of transport types.
 * @attribute TRANSPORT_ENUM
 * @param {String} WEBSOCKET The transport type that uses the 
 *   [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API).
 * @param {String} POLLING The transport type that uses polling that uses the 
 *   [XMLHttpRequest API](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest).
 * @type JSON
 * @final
 * @readOnly
 * @for Temasys.Socket
 */
Temasys.Socket.prototype.TRANSPORT_ENUM = {
  WEBSOCKET: 'websocket',
  POLLING: 'polling'
};

/**
 * The enum of connection states.
 * @attribute CONNECTION_STATE_ENUM
 * @param {String} CONNECTING The state when attempting to start connection for a new server item.
 * @param {String} RECONNECT_FAILED The state when failed to reconnect after all reconnection attempts.
 * @param {String} RECONNECT_ERROR The state when a reconnection attempt failed.
 * @param {String} RECONNECT_ATTEMPT The state when starting a reconnection attempt.
 * @param {String} RECONNECT The state when connected after reconnection attempts.
 * @param {String} CONNECT_ERROR The state when attempt to start connection fails and reconnection may occur if enabled.
 * @param {String} CONNECT_START_ERROR The state when attempt to construct connection for starting failed.
 * @param {String} CONNECT The state when connected.
 * @param {String} DISCONNECT The state when disconnected.
 * @param {String} TERMINATE The state when there is no more new server items to start connection.
 * @param {String} ERROR The state when there are connection errors when connected.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Socket
 * @since 0.7.0
 */
Temasys.Socket.prototype.CONNECTION_STATE_ENUM = {
  RECONNECT_ATTEMPT: 'reconnect_attempt',
  RECONNECT_FAILED: 'reconnect_failed',
  RECONNECT_ERROR: 'reconnect_error',
  //RECONNECTING: 'reconnecting',
  RECONNECT: 'reconnect',
  //CONNECT_TIMEOUT: 'connect_timeout',
  CONNECT_ERROR: 'connect_error',
  CONNECT: 'connect',
  CONNECTING: 'connecting',
  DISCONNECT: 'disconnect',
  CONNECT_START_ERROR: 'connect_start_error',
  TERMINATE: 'terminate',
  ERROR: 'error'
};

/**
 * The enum of connection active state after connected.
 * @attribute ACTIVE_STATE_ENUM
 * @param {String} PING The state when "ping" packet is written out to the server.
 * @param {String} PONG The state when  "pong" packet is received from the server.
 * @type JSON
 * @final
 * @readOnly
 * @for Temasys.Socket
 */
Temasys.Socket.prototype.ACTIVE_STATE_ENUM = {
  PING: 'ping',
  PONG: 'pong'
};

/**
 * Function that returns the Socket configuration.
 * - These are data configured when constructing `new Temasys.Socket()` object.
 * @method getConfig
 * @param {JSON} return The result.
 * - Object signature matches `options` in `new Temasys.Socket()`.
 * @return {JSON}
 * @example
 *   var config = socket.getConfig();
 *   console.log("Configuration ->", config);
 * @for Temasys.Socket
 * @since 0.7.0
 */
Temasys.Socket.prototype.getConfig = function () {
  var ref = this;
  return {
    servers: (function () {
      var servers = [];
      Temasys.Utils.forEach(ref._servers, function (item,index) {
        servers[index] = Temasys.Utils.copy(item);
      });
      return servers;
    })(),
    data: {
      compress: ref._data.compress,
      priorityInterval: ref._data.queue.priorityInterval
    }
  };
};

/**
 * Function to retrieve Socket connection stats.
 * @method getStats
 * @param {JSON} return The result.
 * @param {JSON} return.messages The messages stats.
 * @param {JSON} return.messages.send The messages sent stats.
 * @param {Number} return.messages.send.total The total number of messages sent.
 * @param {Number} return.messages.send.errors The total number of messages sent with errors.
 * @param {JSON} return.messages.recv The messages received stats.
 * @param {Number} return.messages.recv.total The total number of messages received.
 * @param {Number} return.messages.recv.errors The total number of messages received with errors.
 * @param {JSON} return.connection The connection stats.
 * @param {JSON} return.connection.reconnections The reconnection stats.
 * @param {Number} return.connection.reconnections.total The total number of reconnections attempts.
 * @param {Array} return.connection.reconnections.servers The servers reconnections stats.
 * @param {Number} return.connection.reconnections.servers._serverIndex The total number of reconnection attempts
 *   made for the current server index.
 * @param {JSON} return.connection.pings The "ping" stats.
 * @param {Number} return.connection.pings.total The total number of "ping" messages received.
 * @param {JSON} return.connection.pongs The "pong" stats.
 * @param {Number} return.connection.pongs.total The total number of "pong" messages sent.
 * @param {JSON} return.connection.pongs.latency The "pong" latency stats.
 * @param {Number} return.connection.pongs.latency.lowest The lowest number of latency received.
 * @param {Number} return.connection.pongs.latency.average The average number of latency received.
 * @param {Number} return.connection.pongs.latency.highest The highest number of latency received.
 * @return {JSON}
 * @example
 *   var stats = socket.getStats();
 *   console.log("Received stats ->", stats);
 * @for Temasys.Socket
 * @since 0.7.0
 */
Temasys.Socket.prototype.getStats = function () {
  var ref = this;
  return {
    messages: {
      send: {
        total: ref._stats.messages.send.total,
        errors: ref._stats.messages.send.error
      },
      recv: {
        total: ref._stats.messages.recv.total,
        errors: ref._stats.messages.recv.error
      }
    },
    connection: {
      reconnections: {
        total: ref._stats.connection.attempts.total,
        servers: (function () {
          var servers = [];
          Temasys.Utils.forEach(ref._servers, function (item, index) {
            servers[index] = ref._stats.connection.attempts.servers[index] ? ref._stats.connection.attempts.servers[index] : 0;
          });
          return servers;
        })()
      },
      pings: {
        total: ref._stats.connection.pings.total,
      },
      pongs: {
        total: ref._stats.connection.pongs.total,
        latency: {
          lowest: ref._stats.connection.pongs.latency.lowest,
          highest: ref._stats.connection.pongs.latency.highest,
          average: parseFloat((ref._stats.connection.pongs.latency.total /
            ref._stats.connection.pongs.total).toFixed(2), 10)
        }
      }
    }
  };
};

/**
 * Function to set configuration.
 */
Temasys.Socket.prototype._setConfig = function (options, defaultOptions) {
  var ref = this;

  if (!(options && typeof options === 'object' && !Array.isArray(options))) {
    return _log.throw(ref._componentId, new Error('new Temasys.Socket(): options is not defined correctly'));
  }

  // NOTE: We should always define options as an object {}.
  // Use user's defined servers
  if (Array.isArray(options.servers) && options.servers.length > 0) {
    Temasys.Utils.forEach(options.servers, function (item) {
      if (item && typeof item === 'object' ?
        !(item.server && typeof item.server === 'string') ||
        !(typeof item.port === 'number' && item.port > 0) ||
        !(item.transport === 'Websocket' ? !window.WebSocket : true) : true) {
        return;
      }

      var useItem = {
        server: item.server,
        protocol: item.protocol && typeof item.protocol === 'string' && item.protocol.length > 1 &&
          item.protocol.indexOf(':') === (item.protocol.length - 1) ? item.protocol : window.location.protocol,
        port: item.port,
        path: item.path && typeof item.path === 'string' && item.path.length > 1 &&
          item.path.indexOf('/') === 0 ? item.path : '/socket.io',
        reconnectionDelay: typeof item.reconnectionDelay === 'number' && item.reconnectionDelay >= 0 ?
          item.reconnectionDelay : 2000,
        randomizationFactor: typeof item.randomizationFactor === 'number' && item.randomizationFactor >= 0 &&
          item.randomizationFactor <= 1 ? item.randomizationFactor : 0.5,
        timeout: typeof item.timeout === 'number' && item.timeout >= 0 ? item.timeout : 20000,
        transport: !window.WebSocket ? ref.TRANSPORT_ENUM.POLLING : ref.TRANSPORT_ENUM.WEBSOCKET
      };

      if (item.transport && typeof item.transport === 'string') {
        Temasys.Utils.forEach(ref.TRANSPORT_ENUM, function (transportItem) {
          if (transportItem === item.transport) {
            useItem.transport = item.transport;
            return true;
          }
        });
      }

      useItem.reconnection = typeof item.reconnection === 'boolean' ? item.reconnection :
        useItem.transport === ref.TRANSPORT_ENUM.POLLING;
      useItem.reconnectionAttempts = typeof item.reconnectionAttempts === 'number' &&
        item.reconnectionAttempts >= 0 && item.reconnectionAttempts <= 5 ?
        item.reconnectionAttempts : (useItem.transport === ref.TRANSPORT_ENUM.POLLING ? 4 : 0);
      useItem.reconnectionDelayMax = typeof item.reconnectionDelayMax === 'number' &&
        item.reconnectionDelayMax >= 0 ? item.reconnectionDelayMax :
        (useItem.transport === ref.TRANSPORT_ENUM.POLLING ? 1000 : 2000);
      ref._servers.push(useItem);
    });

  // Use API returned defined servers
  } else {
    if (!(defaultOptions && typeof defaultOptions === 'object')) {
      defaultOptions = {};
    }

    var ports = window.location.protocol === 'https:' ?
      (Array.isArray(defaultOptions.httpsPorts) && defaultOptions.httpsPorts.length > 0 ?
      defaultOptions.httpsPorts : [443, 3443]) :
      (Array.isArray(defaultOptions.httpPorts) && defaultOptions.httpPorts.length > 0 ?
      defaultOptions.httpPorts : [80, 3000]);

    Temasys.Utils.forEach(ports, function (portItem) {
      if (portItem < 1) {
        return;
      }
      var item = {
        server: defaultOptions.server && typeof defaultOptions.server === 'string' ?
          defaultOptions.server : 'signaling.temasys.io',
        protocol: window.location.protocol,
        port: portItem,
        path: '/socket.io',
        reconnection: false,
        reconnectionDelay: 2000,
        randomizationFactor: 0.5,
        timeout: 20000,
        transport: ref.TRANSPORT_ENUM.WEBSOCKET,
        reconnectionAttempts: 0,
        reconnectionDelayMax: 2000
      };

      if (window.WebSocket) {
        ref._servers.push(item);
      }
      item.reconnection = true;
      item.reconnectionDelayMax = 1000;
      item.reconnectionAttempts = 4;
      item.transport = ref.TRANSPORT_ENUM.POLLING;
      ref._servers.push(item);
    });
  }

  if (ref._servers.length === 0) {
    return _log.throw(ref._componentId, new Error('new Temasys.Socket(): There are no servers to connect to'));
  }

  if (options.data && typeof options.data === 'object') {
    ref._data.compress = options.data.compress === true;
    ref._data.queue.priorityInterval = typeof options.data.priorityInterval === 'number' &&
      options.data.priorityInterval >= 0 ? options.data.priorityInterval : 10;
  }
};

/**
 * Function to start socket connection.
 * - Returns a Promise (Error error) for failure, (String socketId) for success
 */
Temasys.Socket.prototype._connect = function () {
  var ref = this;
  ref._state.serverIndex = -1;
  ref._state.triggered = {
    response: false,
    fnResponse: function () {},
    reconnecting: false,
    connectError: false,
    connectFailed: false,
    reconnectAttempt: false
  };

  var fnConnect = function () {
    var terminated = false;
    var useSettings = {
      attempt: 0,
      serverIndex: -1,
      url: null,
      options: {
        path: '/socket.io',
        reconnection: false,
        reconnectionAttempts: 0,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 2000,
        randomizationFactor: 0.5,
        timeout: 20000,
        transports: [],
        autoConnect: false,
        forceNew: true
      }
    };

    // Function that returns the error
    var fnEmitState = function (state, error) {
      ref._state.connectionState = ref.CONNECTION_STATE_ENUM[state];
      ref._eventManager.emit('connectionStateChange', ref.CONNECTION_STATE_ENUM[state], error || null, useSettings);

      if (!ref._state.triggered.response && ['TERMINATE', 'CONNECT', 'RECONNECT'].indexOf(state) > -1) {
        terminated = true;
        ref._state.triggered.response = true;
        ref._state.triggered.fnResponse(state === 'TERMINATE' ? error : null);
        ref._state.triggered.fnResponse = null;
      } else if (['CONNECT_START_ERROR', 'RECONNECT_FAILED'].indexOf(state) > -1 ||
        (state === 'CONNECT_ERROR' && !(useSettings.options.reconnection && useSettings.options.reconnectionAttempts > 0))) {
        terminated = true;
        if (!ref._servers[ref._state.serverIndex + 1]) {
          return fnEmitState('TERMINATE', new Error('There are no more servers to continue starting of connection'));
        }
        fnConnect();
      }
    };

    if (ref._servers.length === 0) {
      return fnEmitState('TERMINATE', new Error('There are no servers to start connection'));
    }

    ref._disconnect();
    ref._state.serverIndex++;
    ref._state.triggered.timeout = false;
    ref._state.triggered.reconnecting = false;
    ref._state.triggered.reconnectAttempt = false;
    ref._state.triggered.connectError = false;
    ref._state.triggered.connectFailed = false;
    useSettings.attempt = 0;
    useSettings.serverIndex = ref._state.serverIndex;

    var serverItem = ref._servers[ref._state.serverIndex];
    useSettings.url = serverItem.protocol + '//' + serverItem.server + ':' + serverItem.port;
    useSettings.options.path = serverItem.path;
    useSettings.options.reconnection = serverItem.reconnection;
    useSettings.options.reconnectionAttempts = serverItem.reconnectionAttempts;
    useSettings.options.reconnectionDelay = serverItem.reconnectionDelay;
    useSettings.options.reconnectionDelayMax = serverItem.reconnectionDelayMax;
    useSettings.options.randomizationFactor = serverItem.randomizationFactor;
    useSettings.options.timeout = serverItem.timeout;
    useSettings.options.transports = [serverItem.transport];

    ref._state.options = useSettings.options;
    ref._state.url = useSettings.url;

    fnEmitState('CONNECTING');

    try {
      ref._connection = io.connect(useSettings.url, useSettings.options);
    } catch (error) {
      fnEmitState('CONNECT_START_ERROR', error);
      return;
    }

    ref._connection.on('connect', function () {
      ref._state.connected = true;
      fnEmitState('CONNECT');
    });

    ref._connection.on('reconnect', function () {
      ref._state.connected = true;
      fnEmitState('RECONNECT');
    });

    ref._state.triggered.fnEmitDisconnect = function () {
      if (ref._state.connected) {
        ref._state.connected = false;
        fnEmitState('DISCONNECT');
      }
    };

    ref._connection.on('disconnect', function () {
      ref._state.triggered.fnEmitDisconnect();
    });

    // "connect_timeout" is the same as "connect_error"
    // See: https://socket.io/docs/client-api
    ref._connection.on('connect_timeout', function () {
      if (terminated) {
        return;
      // Prevent triggering of CONNECT_ERROR again
      } else if (ref._state.triggered.connectError) {
        return;
      }
      ref._state.triggered.connectError = true;
      fnEmitState('CONNECT_ERROR', new Error('Connection timeout'));
    });

    ref._connection.on('connect_error', function (error) {
      if (terminated) {
        return;
      } else if (!ref._state.connected) {
        if (!ref._state.triggered.connectFailed) {
          ref._state.triggered.connectFailed = true;
          // Prevent triggering of CONNECT_ERROR again
          if (ref._state.triggered.connectError) {
            return;
          }
          ref._state.triggered.connectError = true;
          fnEmitState('CONNECT_ERROR', error instanceof Error ? error : new Error('Connection error'));
          return;
        }
        ref._state.triggered.reconnecting = true;
        // Prevent triggering of RECONNECT_ERROR again
        if (ref._state.triggered.reconnectAttempt) {
          return;
        }
        ref._state.triggered.reconnectAttempt = true;
        fnEmitState('RECONNECT_ERROR', error instanceof Error ? error : new Error('Reconection error'));
        return;
      }
      fnEmitState('ERROR', error || new Error('Connection session error'));
    });

    // Fired when successful reconnection. reconnect does the same thing
    /*ref._connection.on('reconnecting', function () {
      fnEmitState('RECONNECTING');
    });*/

    ref._connection.on('reconnect_error', function (error) {
      if (terminated) {
        return;
      // Prevent triggering of RECONNECT_ERROR again
      } else if (ref._state.triggered.reconnectAttempt) {
        return;
      }
      ref._state.triggered.reconnectAttempt = true;
      fnEmitState('RECONNECT_ERROR', error instanceof Error ? error : new Error('Reconnection error'));
    });

    ref._connection.on('reconnect_failed', function () {
      fnEmitState('RECONNECT_FAILED', new Error('Reconnection failed'));
    });

    ref._connection.on('reconnect_attempt', function () {
      if (terminated) {
        return;
      }
      useSettings.attempt++;
      ref._stats.connection.reconnections.total++;
      ref._stats.connection.reconnections.servers[useSettings.serverIndex]++;
      ref._state.triggered.reconnectAttempt = false;
      fnEmitState('RECONNECT_ATTEMPT');
    });

    // Deprecated socket.io-client 1.4.x
    ref._connection.on('error', function (error) {
      _log.throw(ref._componentId, error instanceof Error ? error : new Error(
        typeof error === 'string' ? error : 'DOM exception'));
    });

    ref._connection.on('ping', function () {
      ref._stats.connection.pings.total++;
      ref._eventManager.emit('activeStateChange', ref.ACTIVE_STATE_ENUM.PING, Date.now(), null);
    });

    ref._connection.on('pong', function (latency) {
      // Set the highest latency received
      if (ref._stats.connection.pongs.latency.highest === null || latency > ref._stats.connection.pongs.latency.highest) {
        ref._stats.connection.pongs.latency.highest = latency;
      }
      // Set the lowest latency received
      if (ref._stats.connection.pongs.latency.lowest === null || latency < ref._stats.connection.pongs.latency.lowest) {
        ref._stats.connection.pongs.latency.lowest = latency;
      }
      ref._stats.connection.pongs.latency.total += latency;
      ref._stats.connection.pongs.total++;
      ref._eventManager.emit('activeStateChange', ref.ACTIVE_STATE_ENUM.PONG, Date.now(), latency);
    });

    ref._connection.on('message', function (messageStr) {
      ref._stats.messages.recv.total++;
      try {
        var message = JSON.parse(messageStr);
        // Cache the room ID for group messages later
        if (message.type === 'inRoom') {
          ref._data.session.roomId = message.rid;
          ref._data.session.peerId = message.sid;
        }
        ref._eventManager.emit('message', message, null, false);
      } catch (error) {
        ref._stats.messages.recv.errors++;
        ref._eventManager.emit('message', messageStr, error, false);
      }
    });

    if (typeof ref._connection.connect === 'function') {
      // Catch any "http:" accessing errors on "https:" sites errors
      try {
        ref._connection.connect();
      } catch (error) {
        fnEmitState('CONNECT_START_ERROR', error);
      }
    }
  };

  setTimeout(function () {
    fnConnect();
  }, 10);

  return new Promise(function (resolve, reject) {
    ref._state.triggered.fnResponse = function (error) {
      if (error) {
        reject(error);
      } else {
        resolve(null);
      }
    };
  });
};

/**
 * Function to start socket connection.
 */
Temasys.Socket.prototype._disconnect = function () {
  var ref = this;
  if (ref._connection) {
    ref._connection.removeAllListeners();
    if (ref._state.connected) {
      ref._connection.disconnect();
      // Add precautionary checks
      if (typeof ref._state.triggered.fnEmitDisconnect === 'function') {
        ref._state.triggered.fnEmitDisconnect();
      }
    }
    ref._connection = null;
  }
};

/**
 * Function to send messages.
 */
Temasys.Socket.prototype._send = function (message, fn) {
  var ref = this;
  var fnSendNextbatch = function () {
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
        fnSendNextbatch(fnSend);
      }
    }, 1000);
  };

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