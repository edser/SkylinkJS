/**
 * Handles the client room connection session.
 * @class Temasys.Room
 * @param {JSON} options The options.
 * @param {String} options.appKey The app key ID.
 * @param {String} [options.name] The room name.
 * - When not provided, the value of `.appKey` is used.
 * @constructor
 * @example
 * // Example: Create a room object
 * var room = new Temasys.Room({
 *   appKey: "MY_APP_KEY_ID_VALUE_HERE"
 * });
 * room.connect();
 * @since 0.7.0
 */
Temasys.Room = function (options) {
  var ref = this;
  // The event manager
  ref._eventManager = Temasys.Utils.createEventManager();
  // The component ID.
  ref._componentId = Temasys.Debugger(componentId || null, function (fn) {
    ref._eventManager.catch(fn);
  });
  // The session received from API server.
  ref._session = {};
  // The user information
  ref._user = {};
  // The peers
  ref._peers = {};
  // The config set.
  ref._config = {
    appKey: null,
    name: null,
    requireWebRTC: options && typeof options === 'object' && options.requireWebRTC !== false
  };
  // The supports.
  ref._supports = {};
  // The current states.
  ref._states = {};

  if (!(options && typeof options === 'object' && options.appKey && typeof options.appKey === 'string')) {
    return _log.throw(ref._componentId, new Error('Temasys.Room: options.appKey is not provided when required'));
  }

  ref._config.appKey = options.appKey;
  ref._config.name = options.name && typeof options.name === 'string' ? options.name : options.appKey;

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
   * 
   */
};

/**
 * The enum of room connection session states.
 * @attribute SESSION_STATE_ENUM
 * @param {Number} INIT The state when it is checking if client is eligible to start connection session.
 * @param {Number} STARTING The state when attempting to start connection session.
 * @param {Number} STARTED The state when session connection has started.
 * @param {Number} WARNING The state when session connection is alerted that it may end.
 * @param {Number} ENDING The state when session connection is going to end.
 * @param {Number} ENDED The state when session connection has ended.
 * @param {Number} REJECTED The state when session connection has been rejected.
 * @param {Number} TERMINATED The state when session connection has been terminated.
 * @param {Number} ERROR The state when session connection has failed to start due to failures.
 * - Value: `-1`
 */
Temasys.Room.prototype.SESSION_STATE_ENUM = {
  CHECKING: 0,
  STARTING: 1,
  STARTED: 2,
  WARNING: 3,
  ENDED: 4,
  ERROR: -1
};

/**
 * The enum of room connection session codes.
 * 
 * NO_SOCKET_IO: 1,
  NO_XMLHTTPREQUEST_SUPPORT: 2,
  NO_WEBRTC_SUPPORT: 3,
  PLUGIN_NOT_AVAILABLE: 4,
  ADAPTER_NO_LOADED: 7,
  PARSE_CODECS: 8,
  WEBRTC_MIN_SUPPORTS_ERROR: 9

  ????
  API_INVALID: 4001,
  API_DOMAIN_NOT_MATCH: 4002,
  API_CORS_DOMAIN_NOT_MATCH: 4003,
  API_CREDENTIALS_INVALID: 4004,
  API_CREDENTIALS_NOT_MATCH: 4005,
  API_INVALID_PARENT_KEY: 4006,
  API_NO_MEETING_RECORD_FOUND: 4010,
  API_OVER_SEAT_LIMIT: 4020,
  API_RETRIEVAL_FAILED: 4021,
  API_WRONG_ACCESS_DOMAIN: 5005,
  ????

  AUTH_FAILED

  AUTH_FAILED: 403,

 * CREDENTIALS_EXPIRED: 'oldTimeStamp',
  CREDENTIALS_ERROR: 'credentialError',
  DUPLICATED_LOGIN: 'duplicatedLogin',
  ROOM_NOT_STARTED: 'notStart',
  EXPIRED: 'expired',
  ROOM_LOCKED: 'locked',
  FAST_MESSAGE: 'fastmsg',
  ROOM_CLOSING: 'toclose',
  ROOM_CLOSED: 'roomclose',
  SERVER_ERROR: 'serverError',
  KEY_ERROR: 'keyFailed'
 */

/**
 * The enum of room connection session start errors.
 * @attribute SESSION_STATE_ENUM
 * @param {Number} CHECKING The state when it is checking if client is eligible to start connection session.
 * - Value: `0`
 * @param {Number} STARTING The state when attempting to start connection session.
 * - Value: `1`
 * @param {Number} STARTED The state when session connection has started.
 * - Value: `2`
 * @param {Number} WARNING The state when session connection is alerted that it may end.
 * - Value: `3`
 * @param {Number} ENDED The state when session connection has ended.
 * - Value: `4`
 * @param {Number} ERROR The state when session connection has failed to start due to failures.
 * - Value: `-1`
 */

/**
 * The enum of invoked `init()` method states.
 * @attribute INIT_STATE_ENUM
 * @param {Number} LOADING The state when starting dependencies and supports requirements checks.
 * @param {Number} COMPLETED The state when dependencies and supports requirements have been checked and initialised.
 * @param {Number} ERROR The state when required dependencies or supports is missing, or initialisation has errors.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Room
 * @since 0.7.0
 */
Temasys.Room.prototype.SESSION_STATE_ENUM = {
  // Brought over values from Skylink object READY_STATE_CHANGE
  LOADING: 0,
  COMPLETED: 1,
  ERROR: -1
};

/**
 * The enum of Room dependency initialising error codes.
 * @attribute INIT_ERROR_CODE_ENUM
 * @param {Number} MISSING_SOCKETIO The error code when required socket.io-client dependency is not loaded.
 * @param {Number} MISSING_ADAPTERJS The error code when required AdapterJS dependency is not loaded.
 * @param {Number} XMLHTTPREQUEST_NOT_AVAILABLE The error code when XMLHttpRequest (or
 *   XDomainRequest for IE 8-9) API is not available when required.
 * @param {Number} WEBRTC_NOT_AVAILABLE The error code when WebRTC is not supported for browser or device.
 * - This state should only happen if `options.requireWebRTC` is enabled when constructing `Temasys.Room` object.
 * @param {Number} PLUGIN_NOT_AVAILABLE The error code when WebRTC plugin is not available
 *   (or inactive) when required.
 * - This state should only happen if `options.requireWebRTC` is enabled when constructing `Temasys.Room` object.
 * @param {Number} PARSE_SUPPORTS_ERROR The error code when retrieving of WebRTC supports fails
 *   hence initialisation fails.
 * - This state should only happen if `options.requireWebRTC` is enabled when constructing `Temasys.Room` object.
 * @param {Number} WEBRTC_MIN_SUPPORTS_ERROR The error code when browser version is lower than required
 *   minimum support.
 * - This state should only happen if `options.requireWebRTC` is enabled when constructing `Temasys.Room` object.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Room
 * @since 0.7.0
 */
Temasys.Room.prototype.INIT_ERROR_CODE_ENUM = {
  // Brought over values from Skylink object READY_STATE_CHANGE_ERROR
  NO_SOCKET_IO: 1,
  NO_XMLHTTPREQUEST_SUPPORT: 2,
  NO_WEBRTC_SUPPORT: 3,
  PLUGIN_NOT_AVAILABLE: 4,
  ADAPTER_NO_LOADED: 7,
  PARSE_CODECS: 8,
  WEBRTC_MIN_SUPPORTS_ERROR: 9
};

/**
 * Function to initialise dependencies and check for supports.
 * @method init
 * @param {Number} [options.initTimeout=1000] The timeout to wait before `Temasys.Room.init()` method
 *   should be invoked when `Temasys.Room` object is constructed.
 * - When provided as `-1`, the `Temasys.Room.init()` method will not be invoked, and the method has
 *   to be invoked first by app first before invoking `Temasys.Room.connect()` method.
 * @param {Boolean} [options.requireWebRTC=true] The flag if client requires WebRTC to be supported in
 *   order to start a Room connection session.
 }
 * @param {Promise} return The promise for request completion.
 * @return {Promise}
 * @for Temasys.Room
 * @since 0.7.0
 */
Temasys.Room.prototype.init = function (options) {
  var ref = this;

  var fnEmitInitState = function (state, error) {
    log.debug(['Room', ref._config.name, null, null, 'Init state ->'], state, error || null);
    ref._states.init = state;
    ref._eventManager.emit('initStateChange', state, error || null);
    return error || null;
  };

  ref._supports = {
    webrtc: false,
    codecs: {
      audio: {},
      video: {}
    }
  };

  return new Promise(function (resolve, reject) {
    // Check for socket.io-client supports
    if (!(_globals.io || window.io)) {
      return reject(fnEmitInitState(ref.INIT_STATE_ENUM.ERROR, {
        error: new Error('init(): socket.io-client dependency is not loaded'),
        code: ref.INIT_ERROR_CODE_ENUM.MISSING_SOCKETIO
      }));
    }

    // Check for AdapterJS supports
    if (!(_globals.AdapterJS || window.AdapterJS)) {
      return reject(fnEmitInitState(ref.INIT_STATE_ENUM.ERROR, {
        error: new Error('init(): AdapterJS dependency is not loaded'),
        code: ref.INIT_ERROR_CODE_ENUM.MISSING_ADAPTERJS
      }));
    }

    // Check for XMLHttpRequest API supports
    if (!(window.webrtcDetectedBrowser === 'IE' && [8,9].indexOf(window.webrtcDetectedVersion) > -1 ?
      ['object', 'function'].indexOf(typeof window.XDomainRequest) > -1 :
      typeof window.XMLHttpRequest === 'function')) {
      return reject(fnEmitInitState(ref.INIT_STATE_ENUM.ERROR, {
        error: new Error('init(): XMLHttpRequest (or XDomainRequest for IE 8-9) API is not available'),
        code: ref.INIT_ERROR_CODE_ENUM.XMLHTTPREQUEST_NOT_AVAILABLE
      }));
    }

    (_globals.AdapterJS || window.AdapterJS).webRTCReady(function () {
      if (!window.RTCPeerConnection && ref._config.requireWebRTC) {
        return reject(fnEmitInitState(ref.INIT_STATE_ENUM.ERROR, {
          error: new Error('init(): WebRTC is not supported or available when requested'),
          code: ref.INIT_ERROR_CODE_ENUM.WEBRTC_NOT_AVAILABLE
        }));
      }

      if (window.RTCPeerConnection) {
        // Check if plugin is active and available
        if (['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1) {
          try {
            var pc = new window.RTCPeerConnection(null);
            // IE returns as typeof object
            ref._supports.webrtc = pc.createOffer !== null &&
              ['object', 'function'].indexOf(typeof pc.createOffer) > -1;

            if (ref._config.requireWebRTC) {
              return reject(fnEmitInitState(ref.INIT_STATE_ENUM.ERROR, {
                error: new Error('init(): WebRTC plugin is not available or active'),
                code: ref.INIT_ERROR_CODE_ENUM.PLUGIN_NOT_AVAILABLE
              }));
            }
          } catch (e) {}
        }
      }


    });
  });
};

  /**
   * The Room ID.
   * @attribute id
   * @type String
   * @readOnly
   * @for Room
   * @since 0.7.0
   */
  this.id = null;

  /**
   * The Room name.
   * @attribute name
   * @type String
   * @readOnly
   * @for Room
   * @since 0.7.0
   */
  this.name = null;

  /**
   * The App key ID.
   * @attribute appKey
   * @type String
   * @readOnly
   * @for Room
   * @since 0.7.0
   */
  this.appKey = null;

  



  /**
   * The Auth (API) server domain.
   * @attribute server
   * @type String
   * @readOnly
   * @for Room
   * @since 0.7.0
   */
  this.server = null;

  /**
   * The Auth (API) server protocol.
   * @attribute protocol
   * @type String
   * @readOnly
   * @for Room
   * @since 0.7.0
   */
  this.protocol = null;

  /**
   * The Room session start timestamp in ISO-8601 format.
   * @attribute start
   * @type String
   * @readOnly
   * @for Room
   * @since 0.7.0
   */
  this.start = null;

  /**
   * The Room session duration in hours.
   * @attribute duration
   * @type Number
   * @readOnly
   * @for Room
   * @since 0.7.0
   */
  this.duration = null;

  /**
   * The Room session hash used only for hash based authentication.
   * @attribute hash
   * @type String
   * @readOnly
   * @optional
   * @for Room
   * @since 0.7.0
   */
  this.hash = null;

  /**
   * The flag if Room session has auto-introduce enabled.
   * @attribute autoIntroduce
   * @type Boolean
   * @readOnly
   * @for Room
   * @since 0.7.0
   */
  this.autoIntroduce = true;

  /**
   * The Room session self Peer information.
   * @attribute peer
   * @param {String} id The session Peer ID.
   * @param {String} parentId The session parent Peer ID its linked to.
   * @param {Any} data The session custom data.
   * @param {Number} priorityWeight The session Peer priority weight.
   * @param {Boolean} isPrivileged The flag if session Peer has privileged access.
   * @param {JSON} agent The session Peer agent information.
   * @param {String} agent.name The session Peer agent name.
   * @param {String} agent.version The session Peer agent version.
   * @param {String} agent.os The session Peer agent platform.
   * @param {String} [agent.pluginVersion] The session Peer agent Temasys WebRTC version.
   * @param
   * @type JSON
   * @readOnly
   * @for Room
   * @since 0.7.0
   */
  this.peer = {
    id: null,
    peerId: null,
    data: null,
    priorityWeight: null,
    isPrivileged: false,
    agent: {
      name: window.webrtcDetectedBrowser,
      version: (window.webrtcDetectedVersion || 0).toString(),
      os: window.navigator.platform,
      pluginVersion: globals.AdapterJS && globals.AdapterJS.WebRTCPlugin &&
        globals.AdapterJS.WebRTCPlugin.plugin && globals.AdapterJS.WebRTCPlugin.plugin.VERSION
    }
  };

  /**
   * The WebRTC supports of the browser or device.
   * @attribute webrtcSupports
   * @param {Boolean} enabled The flag if WebRTC is enabled for this browser or device.
   * @param {JSON} audioCodecs The list of supported audio codecs.
   * @param {Array} audioCodecs.#codec The list of the sampling rate and its channels the audio codec supports.
   * @param {String} audioCodecs.#codec.#index The audio codec supported sampling rate and its channel item.
   *   Format is `samplingRate/channels`.
   * @param {JSON} videoCodecs The list of supported video codecs.
   * @param {Array} videoCodecs.#codec The list of the sampling rate the video codec supports.
   * @param {String} videoCodecs.#codec.#index The video codec supported sampling rate and its channel item.
   *   Format is `samplingRate`.
   * @param {Boolean} dataChannel The flag if Datachannel connections is supported for this browser or device.
   * @param {String} [dataChannelBinaryType] The Datachannel binary type interface it supports.
   * @type JSON
   * @readOnly
   * @for Room
   * @since 0.7.0
   */
  this.webrtcSupports = {
    enabled: false,
    audioCodecs: {},
    videoCodecs: {},
    dataChannel: false,
    dataChannelBinaryType: null,
    iceRestart: !(window.webrtcDetectedBrowser === 'firefox' && window.webrtcDetectedVersion < 48)
  };

  /**
   * The current Room session connection status.
   * @attribute current
   * @param {String} peerId The User Peer session ID.
   * @param {String} authState The Room authentication state.
   * @param {Boolean} connected The flag if User is connected to the Room.
   * @param {Boolean} locked The flag if Room is locked.
   * @param {Boolean} isMCUEnabled The flag if Room has MCU enabled for Peer connections.
   * @type JSON
   * @readOnly
   * @for Room
   * @since 0.7.0
   */
  this.current = {
    initState: null,
    authState: null,
    sessionState: null,
    connected: false,
    locked: false,
    isMCUEnabled: false
  };

  // Private variables
  this._session = null;
  this._peers = {};
  this._socket = null;
  this._defaultStream = null;
  this._config = {
    iceServers: [],
    requireWebRTC: options.requireWebRTC !== false,
    autoInit: options.autoInit !== false,
    priorityWeightScheme: null,
    defaultSettings: {
      enableIceTrickle: true,
      enableDataChannel: true,
      connection: {

      }
    }
  };


  // Events
  /**
   * Event triggered when Room authentication state has changed.
   * @event authState
   * @param {String} state The current authentication state.
   *   References the {{#crossLink "Socket/AUTH_STATE_ENUM:attribute"}}{{/crossLink}} enum attribute.
   * @param {JSON} error The error.
   *   This is defined when `state` value is `STATE_ENUM.ERROR`.
   * @param {Error} error.error The error object.
   * @param {Number} error.code The error code.
   *   References the {{#crossLink "Socket/AUTH_ERROR_CODE_ENUM:attribute"}}{{/crossLink}} enum attribute.
   * @param {Number} error.httpStatus The returned HTTP status.
   * @for Room
   * @since 0.7.0
   */
  /**
   * Event triggered when Room init state has changed.
   * @event initState
   * @param {String} state The current init state.
   *   References the {{#crossLink "Socket/INIT_STATE_ENUM:attribute"}}{{/crossLink}} enum attribute.
   * @param {JSON} error The error.
   * @param {Error} error.error The error object.
   * @param {Number} error.code The error code.
   *   References the {{#crossLink "Socket/INIT_ERROR_CODE_ENUM:attribute"}}{{/crossLink}} enum attribute.
   * @for Room
   * @since 0.7.0
   */
  /**
   * Event triggered when Room session state has changed.
   * @event sessionState
   * @param {String} state The current init state.
   *   References the {{#crossLink "Socket/INIT_STATE_ENUM:attribute"}}{{/crossLink}} enum attribute.
   * @param {JSON} error The error.
   * @param {Error} error.error The error object.
   * @param {Number} error.code The error code.
   *   References the {{#crossLink "Socket/INIT_ERROR_CODE_ENUM:attribute"}}{{/crossLink}} enum attribute.
   * @for Room
   * @since 0.7.0
   */
  /**
   * Event triggered when there are exceptions thrown in this event handlers.
   * @event domError
   * @param {Error} error The error object.
   * @for Socket
   * @since 0.7.0
   */
  (function (ref) {
    /**
     * Function to subscribe to an event.
     * @method on
     * @param {String} event The event to subscribe to once.
     * @param {Function} callback The callback listener function.
     * @for Room
     * @since 0.7.0
     */
    ref.on = ref._event.on;

    /**
     * Function to subscribe to an event once.
     * @method once
     * @param {String} event The event to subscribe to once.
     * @param {Function} callback The callback listener function.
     * @param {Function} [condition] The condition function that is called when
     *   event is triggered. If condition is met (when function returns `true`), the
     *   callback listener function is triggered.
     *   The default is `function () { return true; }`.
     * @param {Boolean} [fireAlways] The flag if callback listener function should always
     *   be triggered regardless as long as condition function is met.
     *   The default is `false`.
     * @for Room
     * @since 0.7.0
     */
    ref.once = ref._event.once;

    /**
     * Function to unsubscribe to events.
     * @method off
     * @param {String} [event] The specified event to unsubscribe.
     *   When not provided, it will unsubscribe all event callback listener functions.
     * @param {Function} [callback] The specified callback listener function based on
     *   the provided event to unsubscribe only.
     *   When not provided, it will unsubscribe all callback listener functions subscribed to the event.
     * @for Room
     * @since 0.7.0
     */
    ref.off = ref._event.off;

    // Catch errors to prevent issues for Room connection
    ref._event.catch(function (error) {
      ref._event.emit('domError', error);
    });

    if (ref._config.autoInit) {
      setTimeout(function () {
        ref.init();
      }, 1);
    }
  })(this);

  options = options && typeof options === 'object' ? options : {};

  //
  if (!(options.appKey && typeof options.appKey === 'string')) {
    throw new Error('')
  }
};

/**
 * The Room SM protocol version supports.
 * @attribute SM_PROTOCOL_VERSION
 * @type String
 * @readOnly
 * @final
 * @for Room
 * @since 0.7.0
 */
Temasys.Room.prototype.SM_PROTOCOL_VERSION = '0.1.2.3';

/**
 * The Room DT protocol version supports.
 * @attribute DT_PROTOCOL_VERSION
 * @type String
 * @readOnly
 * @final
 * @for Room
 * @since 0.7.0
 */
Room.prototype.DT_PROTOCOL_VERSION = '0.1.3';



/**
 * The enum of Room authentication states, in which is used to validate the App Key ID before starting a session.
 * @attribute AUTH_STATE_ENUM
 * @param {Number} LOADING The state when Room is authenticating.
 * @param {Number} COMPLETED The state when Room has been authenticated successfully.
 * @param {Number} ERROR The state when Room failed to authenticate.
 * @type JSON
 * @readOnly
 * @final
 * @for Room
 * @since 0.7.0
 */
Room.prototype.AUTH_STATE_ENUM = {
  LOADING: 1,
  COMPLETED: 2,
  ERROR: -1
};

/**
 * The enum of Room authentication error codes.
 * @attribute AUTH_ERROR_CODE_ENUM
 * @param {Number} API_INVALID The error code when configured App Key does not exists.
 * @param {Number} API_DOMAIN_NOT_MATCH The error code when App Key `"domainName"` setting does not
 *   match accessing server IP address.
 * @param {Number} API_CORS_DOMAIN_NOT_MATCH The error code when App Key `"corsurl"` setting does not
 *   match app accessing CORS.
 * @param {Number} API_CREDENTIALS_INVALID The error code when there is no CORS present in the
 *   HTTP headers when required.
 * @param {Number} API_CREDENTIALS_NOT_MATCH The error code when `.authCreds.hash` does not match
 *   the Auth (API) server generated hash as part of authentication.
 * @param {Number} API_INVALID_PARENT_KEY The error code when configured App Key does not belong to any active Apps.
 * @param {Number} API_NO_MEETING_RECORD_FOUND The error code when persistent Room enabled App Key does not
 *   have any matching scheduled meetings as matched from the `.authCreds` setting.
 * @param {Number} API_OVER_SEAT_LIMIT The error code when App Key has reached its concurrent users limit.
 * @param {Number} API_RETRIEVAL_FAILED The error code when App Key encounters server errors during retrieval.
 * @param {Number} API_WRONG_ACCESS_DOMAIN The error code when `.server` is using
 *  `"https://developer.temasys.com.sg"` domain to authenticate App Key.
 * @param {Number} XML_HTTP_REQUEST_ERROR The error code when HTTP request failed to receive expected response.
 * @param {Number} NOT_INIT The error code when {{#crossLink "Room/init:method"}}{{/crossLink}} is not called
 *   before attempting {{#crossLink "Room/connect:method"}}{{/crossLink}} method.
 * @type JSON
 * @readOnly
 * @final
 * @for Room
 * @since 0.7.0
 */
Room.prototype.AUTH_ERROR_CODE_ENUM = {
  API_INVALID: 4001,
  API_DOMAIN_NOT_MATCH: 4002,
  API_CORS_DOMAIN_NOT_MATCH: 4003,
  API_CREDENTIALS_INVALID: 4004,
  API_CREDENTIALS_NOT_MATCH: 4005,
  API_INVALID_PARENT_KEY: 4006,
  API_NO_MEETING_RECORD_FOUND: 4010,
  API_OVER_SEAT_LIMIT: 4020,
  API_RETRIEVAL_FAILED: 4021,
  API_WRONG_ACCESS_DOMAIN: 5005,
  XML_HTTP_REQUEST_ERROR: -1,
  NOT_INIT: -2
};

/**
 * The enum of Room connection session states.
 * @attribute SESSION_STATE_ENUM
 * @param {String} CONNECTING The state when Room connection session is attempting to start.
 * @param {String} CONNECT The state when Room connection session has started.
 * @param {String} REJECT The state when Room connection session was terminated from server.
 * @param {String} WARNING The state when Room connection session is warned which might result in
 *   `REJECT` state if not closely followed.
 * @param {String} DISCONNECT The state when Room connection session has ended.
 * @param {String} CONNECT_ERROR The state when Room connection session failed to start due
 *   to socket connection errors.
 * @type JSON
 * @readOnly
 * @final
 * @for Room
 * @since 0.7.0
 */
Room.prototype.SESSION_STATE_ENUM = {
  CONNECTING: 'connecting',
  CONNECT: 'connect',
  REJECT: 'reject',
  WARNING: 'warning',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connectError'
};

/**
 * The enum of Room connection session error codes.
 * @attribute SESSION_ERROR_ENUM
 * @param {String} CREDENTIALS_EXPIRED The error code when Room connection session failed to start
 *   because session credentials returned from Auth (API) has already expired.
 * @param {String} CREDENTIALS_ERROR The error code when Room connection session failed to start
 *   because session credentials returned from Auth (API) was invalid.
 * @param {String} DUPLICATED_LOGIN The error code when Room connection session failed to start
 *   because session credentials returned from Auth (API) has already been used.
 * @param {String} ROOM_NOT_STARTED The error code when Room connection session failed to start
 *   because session has not yet started based on the provided `.start`.
 * @param {String} EXPIRED The error code when Room connection session failed to start because it has already ended.
 * @param {String} ROOM_LOCKED The error code when Room connection session failed to start because the Room is locked.
 * @param {String} FAST_MESSAGE The error code that serves as a warning to current Room connection session
 *   as User is flooding the servers with lots of several socket messages. This might result in the User's Room
 *   connection session being terminated and messages sent to be dropped.
 * @param {String} ROOM_CLOSING The error code that serves as a warning to current Room connection session
 *   that the Room session is ending soon.
 * @param {String} ROOM_CLOSED The error code when current Room connection session has ended.
 * @param {String} SERVER_ERROR The error code when Room connection session failed to start
 *   because of internal server exceptions encountered while attempting to start.
 * @param {String} KEY_ERROR The error code when Room connection session failed to start
 *   because of some internal technical error pertaining to App Key initialisation.
 * @type JSON
 * @readOnly
 * @final
 * @for Room
 * @since 0.7.0
 */
Room.prototype.SESSION_ERROR_ENUM = {
  CREDENTIALS_EXPIRED: 'oldTimeStamp',
  CREDENTIALS_ERROR: 'credentialError',
  DUPLICATED_LOGIN: 'duplicatedLogin',
  ROOM_NOT_STARTED: 'notStart',
  EXPIRED: 'expired',
  ROOM_LOCKED: 'locked',
  FAST_MESSAGE: 'fastmsg',
  ROOM_CLOSING: 'toclose',
  ROOM_CLOSED: 'roomclose',
  SERVER_ERROR: 'serverError',
  KEY_ERROR: 'keyFailed'
};

/**
 * Function to get and check the connection availability.
 * @method getConnectionAvailability
 * @param {Function} callback 
 */
Room.prototype.getConnectionAvailability = function () {
  var ref = this;

  
};

/**
 * Function to start initialising Room dependencies.
 * @method init
 * @param {Function} callback The callback function for async code execution.
 *   Returns a format of: <code>function([error])</code>
 * @param {JSON} [callback.error] The error.
 *   This is only defined if there are errors in code execution.
 *   The object signature matches the {{#crossLink "Room/initState:event"}}{{/crossLink}}
 *   event `error` payload parameter.
 * @async
 * @for Room
 * @since 0.7.0
 */
Room.prototype.init = function (fn) {
  var ref = this;

  if (typeof fn === 'function') {
    ref.once('initState', function (state, error) {
      if (error) {
        return fn(error);
      }
      fn(null);
    }, function (state) {
      return [ref.INIT_STATE_ENUM.ERROR, ref.INIT_STATE_ENUM.COMPLETED].indexOf(state) > -1;
    });
  }

  var fnUpdate = function (state, error) {
    ref.current.initState = state;
    ref._event.emit('initState', state, error);
  };

  fnUpdate(ref.INIT_STATE_ENUM.LOADING);

  // Make sure AdapterJS is loaded
  if (!(globals.AdapterJS && typeof globals.AdapterJS === 'object' &&
    globals.AdapterJS.webRTCReady && typeof globals.AdapterJS.webRTCReady === 'function')) {
    return fnUpdate(ref.INIT_STATE_ENUM.ERROR, {
      error: new Error('AdapterJS version @@adapterjsVersion is required to be loaded first'),
      code: ref.INIT_ERROR_CODE_ENUM.ADAPTER_NO_LOADED
    });
  }

  // Make sure socket.io-client is loaded
  if (!(globals.io && typeof globals.io === 'object' && typeof globals.io.connect === 'function')) {
    return fnUpdate(ref.INIT_STATE_ENUM.ERROR, {
      error: new Error('socket.io-client version @@socketioVersion is required to be loaded first'),
      code: ref.INIT_ERROR_CODE_ENUM.NO_SOCKET_IO
    });
  }

  // Make sure XMLHttpRequest is loaded
  if (!window.XMLHttpRequest && ['object', 'function'].indexOf(typeof window.XDomainRequest) === -1) {
    return fnUpdate(ref.INIT_STATE_ENUM.ERROR, {
      error: new Error('socket.io-client version @@socketioVersion is required to be loaded first'),
      code: ref.INIT_ERROR_CODE_ENUM.NO_SOCKET_IO
    });
  }

  // Start initialising plugin WebRTC functionalities or screensharing overrides
  globals.AdapterJS.webRTCReady(function () {
    var isPluginUnavailableError = false;
    // Check if plugin is available first
    if (window.RTCPeerConnection) {
      if (['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1) {
        isPluginUnavailableError = true;
        try {
          var p = new window.RTCPeerConnection(null);
          // IE returns as typeof object
          ref.webrtcSupports.enabled = ['object', 'function'].indexOf(
            typeof p.createOffer) > -1 && p.createOffer !== null;
        } catch (e) {
          ref.webrtcSupports.enabled = false;
        }
      } else {
        ref.webrtcSupports.enabled = true;
      }
    } else {
      ref.webrtcSupports.enabled = true;
    }

    if (ref._config.requireWebRTC) {
      return fnUpdate(ref.INIT_STATE_ENUM.ERROR, {
        error: new Error(isPluginUnavailableError ? 'WebRTC plugin is inactive, please activate it' :
          'WebRTC is not supported on this browser or device when required'),
        code: ref.INIT_ERROR_CODE_ENUM[isPluginUnavailableError ? 'PLUGIN_NOT_AVAILABLE' : 'NO_WEBRTC_SUPPORT']
      });
    }

    // TODO: Retrieve and parse the codes available..
    if (ref.webrtcSupports.enabled) {
      ref._getCodecsSupport(function (error) {
        if (error) {
          return fnUpdate(ref.INIT_STATE_ENUM.ERROR, {
            error: error,
            code: ref.INIT_ERROR_CODE_ENUM.PARSE_CODECS
          });
        }
        fnUpdate(ref.INIT_STATE_ENUM.COMPLETED);
      });
    }
  });
};

/**
 * Function to start Room session connection.
 * @method connect
 * @param {JSON} [options] The options.
 * @param {String} [options.server] The Auth (API) server domain to connect to.
 *   The default is based on the preset server domain.
 * @param {String} [options.protocol] The Auth (API) server protocol to connect to.
 *   The default is the value of the current accessing `window.location.protocol`.
 * @param {JSON} [options.authCreds] The credentials for hash based authentication.
 *   If this is not provided, the Auth (API) server will authenticate by checking if the CORS url
 *   configuration from the App Key matches the CORS domain from accessing app.
 * @param {String} [options.authCreds.start] The starting DateTime stamp in ISO-8601 string for the Room session connection.
 * @param {Number} [options.authCreds.duration] The duration in hours for the Room session connection.
 *   The maximum duration is `24` hours.
 * @param {String} [options.authCreds.hash] The base64 encoded HMAC-SHA1 hash generated from the starting
 *   DateTime stamp, duration, Room name and App Key secret.
 *   Please ensure that the string encodes escape characters for URI ready strings.
 * @param {JSON} [options.socket] The socket connecton configuration.
 *   This references the Socket class constructor options.
 * @param {JSON} [options.peer] The Peer connecton configuration.
 *   This references the Peer class constructor options.
 * @param {Function} callback The callback function for async code execution.
 *   Returns a format of: <code>function([error])</code>
 * @param {JSON} [callback.error] The error.
 *   This is only defined if there are errors in code execution.
 * @param {String} callback.error.eventName The event name that caused the error.
 * @param {JSON} callback.error.error The error.
 *   The object signature matches the event based on the `error.eventName`
 *   `error` payload parameter or the socket connection error object.
 * @async
 * @for Room
 * @since 0.7.0
 */
Room.prototype.connect = function (stream, options, fn) {
  var ref = this;

  if (typeof options === 'function') {
    fn = options;
    options = null;
  }

  options = options || {};

  ref.server = options.server && typeof options.server === 'string' ? options.server : 'api.temasys.io';
  ref.protocol = options.protocol && typeof options.protocol === 'string' &&
    options.protocol.indexOf(':') === (options.protocol.length - 1) ? options.protocol : window.location.protocol;
  ref.hash = null;

  if (options.authCreds && typeof options.authCreds === 'object' && options.authCreds.hash &&
    typeof options.authCreds.hash === 'string' && typeof options.authCreds.duration === 'number' &&
    options.authCreds.start && typeof options.authCreds.start === 'string') {
    ref.hash = options.authCreds.hash;
    ref.start = options.authCreds.start;
    ref.duration = options.authCreds.duration;
  }

  /**
   * Internal function to update and trigger state.
   */
  var isFnTriggered = false;
  var fnUpdate = function (eventName, state, error) {
    ref.current[eventName] = state;
    ref._event.emit(eventName, state, error);
    // Trigger the callback
    if (typeof fn === 'function' && !isFnTriggered && ((eventName === 'sessionState' &&
      [ref.SESSION_STATE_ENUM.REJECT, ref.SESSION_STATE_ENUM.CONNECT_ERROR].indexOf(state) > -1) ||
      (eventName === 'authState' && state === ref.AUTH_STATE_ENUM.ERROR))) {
      isFnTriggered = true;
      fn({
        type: eventName,
        error: error
      });
    }
  };

  if (!ref.current.initState) {
    return fnUpdate('authState', ref.AUTH_STATE_ENUM.ERROR, {
      error: new Error('.init() must be called first before .connect()'),
      code: ref.AUTH_ERROR_CODE_ENUM.NOT_INIT
    });
  }

  var xhr = new XMLHttpRequest();

  /**
   * Internal function to load XHR response.
   */
  var fnParseResponse = function (evt) {
    var response = JSON.parse(xhr.response || xhr.responseText || '{}');

    if (!response.success) {
      return fnUpdate('authState', ref.READY_STATES.ERROR, {
        httpStatus: xhr.status || -1,
        error: evt.error && typeof evt.error === 'object' ? evt.error :
          new Error(response.info || 'HTTP request error timeout'),
        code: response.error || ref.AUTH_ERROR_CODE_ENUM.XML_HTTP_REQUEST_ERROR
      });
    }

    ref.start = response.start;
    ref.duration = response.len;
    ref.id = response.room_key;
    ref.isPrivileged = response.isPrivileged === true;
    ref.autoIntroduce = response.autoIntroduce !== false;
    ref._session = response;

    fnUpdate('authState', ref.AUTH_STATE_ENUM.COMPLETED);

    ref._socket = new Socket(options.socket || {}, {
      server: response.ipSigserver,
      httpsPorts: response.httpsPortList,
      httpPorts: response.httpPortList
    });

    ref._socket.on('message', function (message, error, isSelf) {
      if (!isSelf) {
        ref._handleSMProtocol(message, false);
      }
    });

    ref._event.emit('socket', ref._socket);
    ref._socket._connect(function (error) {
      if (error) {
        return fnUpdate('sessionState', ref.SESSION_STATE_ENUM.ERROR, {
          error: new Error('Failed starting socket connection'),
          code: ref.SESSION_ERROR_ENUM.CONNECT_ERROR
        });
      } else if (typeof fn === 'function') {
        ref.once('sessionState', function (state, error) {
          if (error) {
            return fn(error);
          }
          fn(null);
        }, function (state, error) {
          return [ref.SESSION_STATE_ENUM.CONNECT, ref.SESSION_STATE_ENUM.REJECT].indexOf(state) > -1;
        });
      }

      ref._handleSMProtocol({ type: 'joinRoom' }, function (error) {
        fnUpdate('sessionState', ref.SESSION_STATE_ENUM.ERROR, {
          error: new Error('Failed sending socket message to start'),
          code: ref.SESSION_ERROR_ENUM.CONNECT_ERROR
        });
      });
    });
  };

  if (['object', 'function'].indexOf(window.XDomainRequest) > -1) {
    xhr = new XDomainRequest();
  }

  xhr.onload = fnParseResponse;
  xhr.onerror = fnParseResponse;

  xhr.open('GET', ref.protocol + '//' + ref.server + '/api/' + ref.appKey + '/' + ref.name + (ref.hash ?
    '/' + ref.start + '/' + ref.duration + '?&cred=' + ref.hash + '&rand=' + Date.now() : '?&rand=' + Date.now()), true);
  xhr.send();
};

/**
 * Function to update the default stream or self Peer data.
 * @method update
 * @param 

/**
 * Function to parse and retrieve codecs support.
 */
Room.prototype._getCodecsSupport = function (fn) {
  var ref = this;

  ref.webrtcSupports.audioCodecs = {};
  ref.webrtcSupports.videoCodecs = {};
  ref.webrtcSupports.dataChannel = false;

  if (!ref.webrtcSupports.enabled) {
    if (ref._config.requireWebRTC) {
      return fn(new Error('WebRTC is not supported on this browser or device when required'));
    }
    return fn(null);
  }

  try {
    if (window.webrtcDetectedBrowser === 'edge') {
      Utils.forEach(window.RTCRtpSender.getCapabilities().codecs, function (codec) {
        if (['audio','video'].indexOf(codec.kind) > -1 && codec.name) {
          ref.webrtcSupports[codec.kind === 'audio' ? 'audioCodecs' : 'videoCodecs'][
            codec.name.toLowerCase()] = codec.clockRate + (codec.kind === 'audio' ?
            '/' + (codecs[i].numChannels > 1 ? codecs[i].numChannels : 1) : '');
        }
      });
      return fn(null);
    }

    var pc = new RTCPeerConnection(null);
    var channel = pc.createDataChannel('test');

    ref.webrtcSupports.dataChannel = true;
    ref.webrtcSupports.dataChannelBinaryType = channel.binaryType && typeof channel.binaryType === 'string' ?
      (channel.binaryType.indexOf('array') > -1 ? 'arraybuffer' : channel.binaryType) : null;

    pc.createOffer(function (offer) {
      var mediaType = '';
      Utils.forEach(offer.sdp.split('\r\n'), function (line) {
        if (line.indexOf('m=') === 0) {
          mediaType = (line.split('m=')[1] || '').split(' ')[0];
          return;
        } else if (mediaType && ['audio', 'video'].indexOf(mediaType) > -1 && line.indexOf('a=rtpmap:') === 0) {
          var parts = (line.split(' ')[1] || '').split('/');
          ref.webrtcSupports.audioCodecs[parts[0].toLowerCase()] = parts[1] + (mediaType === 'audio' ?
            (parts[2] ? '/' + parts[2] : 1) : '');
        }
      });
    }, fn, ['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1 ? {
      mandatory: { OfferToReceiveVideo: true, OfferToReceiveAudio: true }
    } : { offerToReceiveAudio: true, offerToReceiveVideo: true });

  } catch (error) {
    fn(error);
  }
};

/**
 * Function to handle SM protocol for sending direction.
 */
Room.prototype._constructProtocolMessage = function (params, fn) {
  var ref = this;
  var message = {
    type: params.type,
    rid: ref.id
  };

  /**
   * "joinRoom" - Connects to the Room.
   */
  if (params.type === 'joinRoom') {
    message.uid = ref._session.username;
    message.apiOwner = ref._session.apiOwner;
    message.cid = ref._session.cid;
    message.isPrivileged = ref.isPrivileged;
    message.autoIntroduce = ref.autoIntroduce;
    message.key = ref.appKey;
    message.len = ref._session.len;
    message.roomCred = ref._session.roomCred;
    message.start = ref._session.start;
    message.timeStamp = ref._session.timeStamp;
    message.userCred = ref._session.userCred;

  /**
   * "enter" - Broadcasts to existing Peers in the Room we exist.
   * "welcome" - Respond to Peer who sent "enter" about who we are.
   * "restart" - Re-negotiation request.
   */
  } else if (['enter', 'welcome', 'restart'].indexOf(params.type)) {
    message.mid = ref.user.id;
    message.
  }
};

/**
 * Function to handle SM protocol for receiving direction.
 */
Room.prototype._processProtocolMessage = function (message) {

};



  /**
   * SM protocol: "joinRoom"
   */
  if (params.type === 'joinRoom') {
    fnSend({
      type: 'joinRoom',

    });
  /**
   * SM protocol: "inRoom"
   */
  } else if (params.type === 'inRoom') {
    ref.current.peerId = params.sid;
    ref.current.peerPriorityWeight =
    ref._config.iceServers = params.pc_config.iceServers;
    // Broadcast "enter" if auto-introduce is enabled
    if (ref.autoIntroduce) {
      ref._handleSMProtocol({
        type: 'enter'
      });
    }
  /**
   * SM protocol: "enter"
   */
  } else if (['welcome', 'restart', 'enter'].indexOf(params.type) > -1) {
    if (fn) {
      fnSend({
        type: params.type,
        agent: window.webrtcDetectedBrowser,
        version: (window.webrtcDetectedVersion || 0).toString(),
        os: window.navigator.platform,
        userInfo: self._getUserInfo(),
        receiveOnly: !ref._stream,
        weight: self._peerPriorityWeight,
        temasysPluginVersion: AdapterJS.WebRTCPlugin.plugin ? AdapterJS.WebRTCPlugin.plugin.VERSION : null,
        enableIceTrickle: self._enableIceTrickle,
        enableDataChannel: self._enableDataChannel,
        enableIceRestart: self._enableIceRestart,
        SMProtocolVersion: self.SM_PROTOCOL_VERSION,
        DTProtocolVersion: self.DT_PROTOCOL_VERSION
      });
    } else {

    }
  }

  if (isSelf) {

  }

  if (isSend) {
    if (type === 'joinRoom' && ref._creds) {
      message.uid = ref._creds.username;
      message.apiOwner = ref._creds.apiOwner;
      message.cid = ref._creds.cid;
      message.isPrivileged = ref._creds.isPrivileged === true;
      message.autoIntroduce = ref._creds.autoIntroduce !== false;
      message.key = ref.appKey;
      message.len = ref._creds.len;
      message.roomCred = ref._creds.roomCred;
      message.start = ref._creds.start;
      message.timeStamp = ref._creds.timeStamp;
      message.userCred = ref._creds.userCred;
      message.rid = ref.id;
      message.type = type;
    } else if (type === 'welcome' || type === 'enter') {
      message.rid = ref.id;
      message.mid = ref.session.id;
      message.type = type;
    }
    console.info(type, message);
    if (ref._socket) {
      ref._socket._send(message);
    }
  } else {
    if (type === 'group') {
      message.lists.forEach(function (itemMsgStr) {
        ref._processSMProtocol(JSON.parse(itemMsgStr));
      });
    } else if (type === 'inRoom') {
      ref.session.id = message.sid;
      ref._processSMProtocol('enter', {}, true);
    } else if (type === 'enter') {
      ref._peers[message.mid] = message;
      ref._processSMProtocol('welcome', {
        target: message.mid
      }, true);
    } else if (type === 'welcome') {
      ref._peers[message.mid] = message;
    }
  }
};

globals.Room = Room;
