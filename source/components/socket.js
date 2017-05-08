/**
 * Handles the socket connection to the signaling server.
 * @class Temasys.Socket
 * @param {JSON} options The options.
 * @param {String} [options.protocol] The signaling server protocol.
 * - Examples: `"https:"`, `"http:"`
 * - When not provided, the value of `window.location.protocol` is used.
 * @param {String} [options.server] The signaling server domain.
 * - Examples: `"signaling.temasys.io"`
 * - When not provided, the default value returned from Auth server is used.
 * @param {String} [options.path] The signaling server path if required.
 * - Examples: `"/"`, `"/socket.io"`
 * - When not provided, the default value is `"/socket.io"`.
 * @param {Array} [options.ports] The list of signaling ports - where each item is a _Number_.
 * - Examples: `new Array(80, 3000)`, `new Array(443, 3443)`
 * - When not provided, the default value returned from Auth server is used.
 * @param {Number} [options.reconnectionAttempts] The number of reconnection attempts for each port and transport pair.
 * - Range: `0` - `5`
 * - When not provided, the default value is `0`, which means no reconnection attempts should be made.
 * @param {Number} [options.reconnectionDelay] The number of miliseconds to wait before starting the
 *   next reconnection attempt. This is tampered with the `.randomizationFactor` configured.
 * - Range: `1` and above
 * - When not provided, the default value is `1000`.
 * @param {Number} [options.reconnectionDelayMax] The maximum number of miliseconds to wait before starting the
 *   next reconnection attempt.
 * - Range: `1` and above
 * - When not provided, the default value is `5000`.
 * @param {Number} [options.randomizationFactor] The randominzation factor (+/-) for each reconnection attempts.
 * - Range: `0` - `1`
 * - Output reconnection delay would be `800` or `1200` if value is `0.2` with `.reconnectionDelay` set to `1000`.
 * - Output reconnection delay would be `500` or `1500` if value is `0.5` with `.reconnectionDelay` set to `1000`.
 * @param {Number} [options.timeout] The number of miliseconds to wait without response before considering that
 *   connection attempt has timed out and should consider reconnecting.
 * - Range: `0` and above
 * - When not provided, the default value is `20000`.
 * @param {Array} [options.transports] The list of signaling transports - where each item is a _String_.
 * - Examples: `new Array("polling")`, `new Array("websocket", "polling")`
 * - When not provided, the default value is `new Array("websocket", "polling")`.
 * - Reference [`TRANSPORT_ENUM`](#docs+Temasys.Socket+constants+TRANSPORT_ENUM) for the list of available transports.
 * @param {Boolean} [options.compression] The flag if data compression should be enabled when sending messages.
 * - When not provided, the default value is `false`.
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
    * Function to subscribe to an event.
    * @method on
    * @param {String} eventName The event name.
    * @param {Function} fn The callback function called when event is emitted.
    * @example
    * // Example: Subscribe to an event
    * socket.on("activeStateChange", function (state, latency) {
    *   console.log("active state ->", state);
    * });
    * @for Temasys.Socket
    * @since 0.7.0
    */
   ref.on = ref._eventManager.on;

   /**
    * Function to subscribe to an event once.
    * @method once
    * @param {String} eventName The event name.
    * @param {Function} fn The callback function called once when event is emitted, or after when condition is met.
    * @param {Function} [fnCondition] The conditional function called each time event is emitted.
    * - Return `true` to satisfy condition.
    * - When not provided, the default value is `function () { return true; }`.
    * @param {Boolean} [forever] The flag if callback function should not be called only once but each time
    *   condition is met.
    * - When not provided, the default value is `false`.
    * @example
    * // Example 1: Subscribe to an event once when emitted
    * socket.once("activeStateChange", function (state, latency) {
    *   console.log("active state ->", state);
    * });
    *
    * // Example 2: Subscribe to an event that is emited once the condition is met
    * socket.once("connectionStateChange", function (state) {
    *   console.info("connected"); 
    * }, function (state) {
    *   return ["connect", "reconnect"].indexOf(state) > -1;
    * });
    *
    * // Example 3: Subscribe to an event that is emited always once the condition is met
    * socket.once("activeStateChange", function (state, latency) {
    *   console.info("pong latency ->", latency); 
    * }, function (state) {
    *   return state === 'pong';
    * }, true);
    * @for Temasys.Socket
    * @since 0.7.0
    */
   ref.once = ref._eventManager.once;

   /**
    * Function to unsubscribe to an event.
    * @method off
    * @param {String} [eventName] The event name to unsubscribe to.
    * - When not provided, all events callback functions.
    * @param {Function} [fn] The callback function to unsubscribe.
    * - When not provided, all the event callback functions.
    * @example
    * // Example 1: Unsubscribe to all events
    * socket.off();
    *
    * // Example 2: Unsubscribe "activeStateChange" event
    * socket.once("activeStateChange");
    *
    * // Example 3: Unsubscribe to a single callback function for "activeStateChange" event
    * var fn = function () {};
    * socket.on("activeStateChange", fn);
    * socket.off("activeStateChange", fn);
    * @for Temasys.Socket
    * @since 0.7.0
    */
   ref.off = ref._eventManager.off;

   /**
   * Event triggered when socket connection state has changed.
   * @param connectionStateChange
   * @param {String} state The connection state.
   * - Reference [`CONNECTION_STATE_ENUM`](#docs+Temasys.Socket+constants+CONNECTION_STATE_ENUM) for the list of available states.
   * @param {Error} [error] The error object if there are errors.
   * @param {JSON} session The state session.
   * @param {Number} session.attempts The total number of reconnection attempts made for the current fallback attempt.
   * @param {Number} session.fallbacks The total number of port and transport pairs tried.
   * @param {Number} settings.port The port number.
   * @param {String} settings.transport The transport used.
   * - Reference [`TRANSPORT_ENUM`](#docs+Temasys.Socket+constants+TRANSPORT_ENUM) for the list of available transports.
   * @for Temasys.Socket
   * @since 0.7.0
   */
  /**
   * Event triggered when socket connection "activeness" or keep-alive state has changed.
   * @event activeStateChange
   * @param {String} state The active state.
   * - Reference [`ACTIVE_STATE_ENUM`](#docs+Temasys.Socket+constants+ACTIVE_STATE_ENUM) for the list of available states.
   * @param {Number} [latency] The number of miliseconds of response time latency when receiving `PONG` response packet.
   * @for Temasys.Socket
   * @since 0.7.0
   */
  /**
   * Event triggered when message is sent or received.
   * @event message
   * @param {JSON|String} message The message object.
   * - When defined as type of _String_, this indicates that received message has parsing errors.
   * @param {Error} [error] The error object if there are errors.
   * @param {Boolean} isSelf The flag if self is sending the message.
   * @for Temasys.Socket
   * @since 0.7.0
   */
};

/**
 * The enum of transport types.
 * @attribute TRANSPORT_ENUM
 * @param {String} WEBSOCKET The transport type to use WebSocket connections.
 * - Value: `"websocket"`
 * - Reference [WebSocket protocol](https://en.wikipedia.org/wiki/WebSocket) for more information.
 * @param {String} POLLING The transport type to use polling.
 * - Value: `"polling"`
 * - Reference [Polling concept](https://en.wikipedia.org/wiki/Polling_%28computer_science%29) for more information.
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
 * The enum of socket connection states.
 * @attribute CONNECTION_STATE_ENUM
 * @param {String} NEW The state when starting with a new port and transport pair to start connection.
 * - Value: `"new"`
 * - Output port and transport pairs available would be `a+1`, `a+2`, `b+1` and `b+2`, if transports given are `a` and `b`,
 *   and ports give are `1` and `2`.
 * @param {String} CONNECT The state when connected.
 * - Value: `"connect"`
 * @param {String} CONNECT_ERROR The state when connection failed or timed out for current port and transport pair.
 * - Value: `"connect_error"`
 * - Reconnections will be attempted if configured, else it would switch to the next available pair.
 * @param {String} CONNECT_START_ERROR The state when constructing connection has errors for the current port and transport pair.
 * - Value: `"connect_start_error"`
 * - Reconnections will not be attempted even if configured, and it would switch to the next available pair.
 * @param {String} RECONNECT_ATTEMPT The state when starting a reconnection attempt for the current port and transport pair.
 * - Value: `"reconnect_attempt"`
 * @param {String} RECONNECT_ERROR The state when a reconnection attempt failed.
 * - Value: `"reconnect_error"`
 * @param {String} RECONNECT The state when reconnected after some reconnection attempts.
 * - Value: `"reconnect"`
 * @param {String} RECONNECT_FAILED The state when all reconnection attempts failed for the current port and transport pair.
 * - Value: `"reconnect_failed"`
 * @param {String} DISCONNECT The state when disconnected.
 * - Value: `"disconnect"`
 * @param {String} TERMINATE The state when there is no more port and transport pairs to start connection and
 *   fallback for the next available pair attempts are aborted.
 * - Value: `"terminate"`
 * @param {String} ERROR The state when there are errors in connection after being connected.
 * - Value: `"error"`
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Socket
 * @since 0.7.0
 */
Temasys.Socket.prototype.CONNECTION_STATE_ENUM = {
  NEW: 'new',
  CONNECT: 'connect',
  CONNECT_ERROR: 'connect_error',
  CONNECT_START_ERROR: 'connect_start_error',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
  RECONNECT: 'reconnect',
  RECONNECT_ERROR: 'reconnect_error',
  RECONNECT_FAILED: 'reconnect_failed',
  DISCONNECT: 'disconnect',
  TERMINATE: 'terminate',
  ERROR: 'error'
};

/**
 * The enum of socket connection "activeness" or keep-alive states.
 * @attribute ACTIVE_STATE_ENUM
 * @param {String} PING The state when "ping" packet is written out to the signaling server
 *   to obtain response from server to check if server-end connection is still active.
 * - Value: `"ping"`
 * @param {String} PONG The state when "pong" packet is received from the signaling server,
 *   which indicates that server-end connection is still active.
 * - Value: `"pong"`
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
 * Function that returns the socket configuration.
 * @method getConfig
 * @param {JSON} return The configuration settings.
 * - Object signature matches `options` parameter in [`Temasys.Socket` constructor](#docs+Temasys.Socket+constructor+Temasys.Socket).
 * @return {JSON}
 * @example
 *   console.log("config ->", socket.getConfig());
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
 * Function that returns the current socket states and connection session.
 * @method getCurrent
 * @param {JSON} return The current states and connection session.
 * @param {JSON} return.states The current states.
 * @param {String} return.states.connectionState The socket connection state.
 * - Reference [`CONNECTION_STATE_ENUM`](#docs+Temasys.Socket+constants+CONNECTION_STATE_ENUM) for the list of available states.
 * @param {String} return.states.activeState The socket "activeness" or keep-alive state.
 * - Reference [`ACTIVE_STATE_ENUM`](#docs+Temasys.Socket+constants+ACTIVE_STATE_ENUM) for the list of available states.
 * @param {Boolean} return.states.connected The flag if socket is connected to signaling server.
 * @param {JSON} return.session The current connection session.
 * @param {Number} return.session.port The port number.
 * @param {String} return.session.transport The transport type.
 * - Reference [`TRANSPORT_ENUM`](#docs+Temasys.Socket+constants+TRANSPORT_ENUM) for the list of available transports.
 * @param {Number} return.session.attempt The total number of attempts made for the current port and transport pair.
 * @param {Number} return.session.fallbacks The total number of port and transport pairs tried.
 * @return {JSON}  
 * @example
 *   console.log("current info ->", socket.getCurrent());
 * @for Temasys.Socket
 * @since 0.7.0
 */
Temasys.Socket.prototype.getCurrent = function () {
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
 * Function that returns the socket connection stats.
 * @method getStats
 * @param {JSON} return The full stats.
 * @param {String} return.componentId The component ID.
 * @param {JSON} return.session The socket connection session stats.
 * @param {String} [return.session.id] The socket connection session ID when connected.
 * @param {Number} return.session.protocol The socket connection socket.io protocol revision number.
 * @param {Array} return.session.fallbacks The list of port and transport pair attempts made - where each item is a _JSON_.
 * - Property `#index` will be used to identify the array index and the fallback for the next available pair attempt number.
 * @param {JSON} return.session.fallbacks.#index The port and transport pair.
 * @param {Number} return.session.fallbacks.#index.attempts The total number of reconnection attempts made for this pair.
 * @param {Number} return.session.fallbacks.#index.port The port number.
 * @param {String} return.session.fallbacks.#index.transport The transport type.
 * - Reference [`TRANSPORT_ENUM`](#docs+Temasys.Socket+constants+TRANSPORT_ENUM) for the list of available transports.
 * @param {JSON} return.active The "activeness" or keep-alive connection stats.
 * @param {JSON} return.active.pings The "ping" stats.
 * @param {Number} return.active.pings.total The total number of "ping" packets sent to signaling server.
 * @param {JSON} return.active.pongs The "pong" stats.
 * @param {Number} return.active.pongs.total The total number of "pong" packets received from signaling server.
 * @param {JSON} return.active.pongs.latency The "pong" latency stats.
 * @param {Number} return.active.pongs.latency.lowest The lowest number of miliseconds of latency received.
 * @param {Number} return.active.pongs.latency.average The average number of miliseconds of latency received.
 * @param {Number} return.active.pongs.latency.highest The highest number of miliseconds of latency received.
 * @return {JSON}
 * @example
 *   console.log("stats ->", socket.getStats());
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