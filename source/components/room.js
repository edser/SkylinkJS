/**
 * Handles the client room connection session.
 * @class Temasys.Room
 * @constructor
 * @example
 * // Example: Create a room object
 * var room = new Temasys.Room();
 * room.connect({
 *   appKey: "MY_APP_KEY_ID_VALUE_HERE",
 *   name: "test"
 * });
 * @since 0.7.0
 */
Temasys.Room = function () {
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

  ref.on = ref._eventManager.on;
  ref.once = ref._eventManager.once;
  ref.off = ref._eventManager.off;

  /**
   * Event triggered when room connection session state has changed.
   * @event sessionStateChange
   * @param {String} state The connection session state.
   * - Reference [`SESSION_STATE_ENUM` constant](#docs+Temasys.Room+constants+SESSION_STATE_ENUM) for the list of available states.
   * @param {JSON} [errorContent] The error information if any.
   * @param {Error} errorContent.error The error object.
   * @param {String} errorContent.code The error code.
   * - Reference [`SESSION_ERROR_ENUM` constant](#docs+Temasys.Room+constants+SESSION_ERROR_ENUM) for the list of available codes.
   * @for Temasys.Room
   * @since 0.7.0
   */
};

/**
 * The enum of room connection session states.
 * @attribute SESSION_STATE_ENUM
 * @param {String} STARTING The state when attempting to start connection session.
 * - Value: `"starting"`
 * @param {String} STARTED The state when connection session has started.
 * - Value: `"started"`
 * @param {String} ENDING The state when connection session is ending soon, of which in about 5 minutes.
 * - Value: `"ending"`
 * - When `state` parameter is this value in [`sessionStateChange` event](#docs+Temasys.Room+events+sessionStateChange
 *   ), the `errorContent` parameter is defined.
 * @param {String} ENDED The state when connection session has ended.
 * - Value: `"ended"`
 * @param {String} ERROR The state when connection session failed to start.
 * - Value: `"error"`
 * - When `state` parameter is this value in [`sessionStateChange` event](#docs+Temasys.Room+events+sessionStateChange
 *   ), the `errorContent` parameter is defined.
 * @param {String} WARNING The state when connection session is potentially suspicious and
 *   signaling server might potentially terminate the client's connection session.
 * - Value: `"warning"`
 * - When `state` parameter is this value in [`sessionStateChange` event](#docs+Temasys.Room+events+sessionStateChange
 *   ), the `errorContent` parameter is defined.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Room
 * @since 0.7.0
 */
Temasys.Room.prototype.SESSION_STATE_ENUM = {
  STARTING: 'starting',
  STARTED: 'started',
  ENDING: 'ending',
  ENDED: 'ended',
  ERROR: 'error',
  WARNING: 'warning'
};

/**
 * The enum of room connection session error codes.
 * @attribute SESSION_ERROR_ENUM
 * @param {String} MISSING_SOCKETIO The code when socket.io-client dependency is not loaded.
 * - Value: `"missing_io"`
 * @param {String} MISSING_ADAPTERJS The code when AdapterJS dependency is not loaded.
 * - Value: `"missing_adapterjs"`
 * @param {String} NO_CORS_SUPPORT The code when support for cross-origin resource sharing (CORS) mechanism is not available when required.
 * - Value: `"no_cors"`
 * - Reference [CORS mechanism](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) for more information.
 * @param {String} NO_WEBRTC_SUPPORT The code when support for WebRTC connections is not available when required.
 * - Value: `"no_webrtc"`
 * - Reference [WebRTC capabilties](https://webrtc.org/) for more information.
 * - This error state should occur when WebRTC connections are required.
 * @param {String} REQUIRE_CODECS The code when there are no codecs available to start WebRTC connections, which
 *   may be a result of failing to parse the codecs.
 * - Value: `"require_codecs"`
 * - This error state should occur when WebRTC connections are required.
 * @param {String} REQUIRE_MIN_VERSION The code when minimum version of the browser is required but not used.
 * - Value: `"require_min_ver"`
 * - This error state should occur when strict version requirements are required.
 * @param {String} AUTH_FAILED The code when authentication of client's provided App key ID failed with auth server.
 * - Value: `"auth_failed"
 * @param {String} AUTH_TOKEN_EXPIRED The code when the token after aprovided from auth server has expired.
 * - Value: `"oldTimeStamp"`
 * @param {String} AUTH_TOKEN_INVALID The code when authentication token provided from auth server is invalid
 * - Value: `"credentialError"`
 * @param {String} AUTH_TOKEN_USED The code when authentication token provided from auth server has already been used.
 * - Value: `"duplicatedLogin"
 * @param {String} SESSION_NOT_STARTED The code when room connection session has not started yet.
 * - Value: `"notStart"`
 * @param {String} SESSION_EXPIRED The code when room connection session has already ended.
 * - Value: `"expired"`
 * @param {String} SESSION_LOCKED The code when room is locked, which prevent other clients from starting connection
 *   session, and connection session cannot start.
 * - Value: `"locked"`
 * @param {String} SESSION_ENDING The code when room connection session is ending.
 * - Value: `"toclose"`
 * @param {String} RETRIEVE_CONFIG_FAILED The code when signaling server fails to retrieve ICE servers details.
 * - Value: `"serverError"`
 * @param {String} RETRIEVE_APP_FAILED The code when signaling server fails to retrieve the App settings.
 * - Value: `"keyFailed"`
 * @param {String} MESSAGE_SPAM The code when signaling server detects a flood of messages from client.
 * - Value `"fastmsg"`
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Room
 * @since 0.7.0
 */
Temasys.Room.prototype.SESSION_ERROR_ENUM = {
  MISSING_SOCKETIO: 'missing_io',
  MISSING_ADAPTERJS: 'missing_adapterjs',
  NO_CORS_SUPPORT: 'no_cors',
  NO_WEBRTC_SUPPORT: 'no_webrtc',
  REQUIRE_CODECS: 'require_codecs',
  REQUIRE_MIN_VERSION: 'require_min_ver',
  AUTH_FAILED: 'auth_failed',
  AUTH_TOKEN_EXPIRED: 'oldTimeStamp',
  AUTH_TOKEN_INVALID: 'credentialError',
  AUTH_TOKEN_USED: 'duplicatedLogin',
  SESSION_NOT_STARTED: 'notStart',
  SESSION_EXPIRED: 'expired',
  SESSION_LOCKED: 'locked',
  SESSION_ENDING: 'toclose',
  // SESSION_ENDED: 'roomclose',
  RETRIEVE_CONFIG_FAILED: 'serverError',
  RETRIEVE_APP_FAILED: 'keyFailed',
  MESSAGE_SPAM: 'fastmsg'
};

/**
 * The room protocols implemented.
 * @attribute PROTOCOL_ENUM
 * @param {String} SM_VERSION The signaling messaging (SM) protocol version implemented.
 * - Value: `"0.1.2.4"`
 * @param {String} DT_VERSION The data transfer (DT) protocol version implemented.
 * - Value: `"0.1.3"`
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Room
 * @since 0.7.0
 */
Temasys.Room.prototype.PROTOCOL_ENUM = {
  SM_VERSION: '0.1.2.4',
  DT_VERSION: '0.1.3'
};

/**
 * Function to start connection session.
 * @method connect
 * @param {JSON} [options] The options.
 * @param {String} [options.protocol] The auth server protocol.
 * - Examples: `"https:"`, `"http:"`
 * - When not provided, the value of `window.location.protocol` is used.
 * @param {String} [options.server] The auth server domain.
 * - Examples: `"api.temasys.io"`
 * - When not provided, the default value is `"api.temasys.io"`.
 * @param {String} options.appKey The app key ID.
 * - Examples: `"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"`
 * @param {String} [options.name] The room name.
 * - Examples: `"a123"`, `"test"`, `Date.now().toString()`
 * - When not provided, the value of `.appKey` is used.
 * @param {JSON} [options.hash] The options for hash authentication.
 * - When not provided, the CORS authentication is used.
 * @param {String} options.hash.start The starting Date timestamp (ISO-8601 format) for connection session.
 * - Examples: `"2017-05-09T10:50:30.843Z"`
 * @param {String} options.hash.duration The starting Date timestamp (ISO-8601 format) for connection session.
 * - Range: above `0` - `24`
 * - Examples: `0.005`, `2`, `5`
 * @param {String} options.hash.output The output generated hash that is derived from provided `.duration` and `.start`.
 * - Examples: `encodeURIComponent(CryptoJS.HmacSHA1(options.room + '_' + options.hash.duration + '_' + options.hash.start, appKeySecret).toString(CryptoJS.enc.Base64));`
 * - Reference the [CryptoJS library](https://github.com/brix/crypto-js) (which is recommended) for more information.
 * - Note that it is required that provided values of `.start` and `.duration` matches the `.output` provided, and strongly recommended that
 *   generation of output hash should be done from an app server end.
 * @param {String|JSON} [options.data] The client custom data for identification.
 * - Examples: `"userA"`, `{ userId: "xxx", name: "xxx" }` 
 * @param {JSON} [options.socket] The socket connection options.
 * - Reference the `options` parameter in [`Temasys.Socket` constructor](#docs+Temasys.Socket+constructor+Temasys.Socket) for the detailed options.
 * @param {JSON} [options.peer] The peer connection options.
 * - Reference the `options` parameter in [`Temasys.Peer` constructor](#docs+Temasys.Peer+constructor+Temasys.Peer) for the detailed options.
 * @example
 * // Example 1: Connect with CORS authentication
 * room.connect({
 *   appKey: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
 *   name: "my_room_name"
 * });
 * 
 * // Example 2: Connect with hash authentication
 * var sessionStart = (new Date ()).toISOString(); // Start now
 * var sessionLen = 3; // 3 hours
 * var sessionRoom = "my_room_name_hash";
 * var appKeySecret = "xxxxxx"; // The app key secret
 * room.connect({
 *   appKey: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
 *   name: sessionRoom,
 *   hash: {
 *     start: sessionStart,
 *     duration: sessionLen,
 *     output: encodeURIComponent(CryptoJS.HmacSHA1(sessionRoom + "_" + sessionLen + "_" +
 *       sessionStart, appKeySecret).toString(CryptoJS.enc.Base64));
 *   }
 * });
 * 
 * // Example 3: Connect with custom user data
 * room.connect({
 *   appKey: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
 *   name: "my_room_name",
 *   data: {
 *     userId: "xxxxxxxxxx",
 *     timestamp: (new Date()).toISOString()
 *   }
 * });
 * @for Temasys.Room
 * @since 0.7.0
 */
Temasys.Room.prototype.connect = function (options, stream) {
  var ref = this;
};

/**
 * Function to lock or unlock room.
 * @method lock
 * @param {Boolean} [lock] The flag if room should be locked.
 * - When not provided, the default value is `false`.
 * @example
 * // Example 1: Lock the room
 * room.lock(true);
 * 
 * // Example 2: Unlock the room
 * room.lock();
 * room.lock(false);
 * @for Temasys.Room
 * @since 0.7.0
 */
Temasys.Room.prototype.lock = function (lock) {
  var ref = this;
};

/**
 * Function to stop connection session.
 * @method disconnect
 * @example
 * // Example 1: Disconnect
 * room.disconnect();
 * @for Temasys.Room
 * @since 0.7.0
 */
Temasys.Room.prototype.disconnect = function () {
  var ref = this;
};