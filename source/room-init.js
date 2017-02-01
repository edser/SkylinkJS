/**
 * Contains the current version of Skylink Web SDK.
 * @attribute VERSION
 * @type String
 * @readOnly
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype.VERSION = '@@version';

/**
 * The list of <a href="#method_init"><code>init()</code> method</a> ready states.
 * @attribute READY_STATE_CHANGE
 * @param {Number} INIT      <small>Value <code>0</code></small>
 *   The value of the state when <code>init()</code> has just started.
 * @param {Number} LOADING   <small>Value <code>1</code></small>
 *   The value of the state when <code>init()</code> is authenticating App Key provided
 *   (and with credentials if provided as well) with the Auth server.
 * @param {Number} COMPLETED <small>Value <code>2</code></small>
 *   The value of the state when <code>init()</code> has successfully authenticated with the Auth server.
 *   Room session token is generated for joining the <code>defaultRoom</code> provided in <code>init()</code>.
 *   <small>Room session token has to be generated each time User switches to a different Room
 *   in <a href="#method_joinRoom"><code>joinRoom()</code> method</a>.</small>
 * @param {Number} ERROR     <small>Value <code>-1</code></small>
 *   The value of the state when <code>init()</code> has failed authenticating with the Auth server.
 *   [Rel: Skylink.READY_STATE_CHANGE_ERROR]
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype.READY_STATE_CHANGE = {
  INIT: 0,
  LOADING: 1,
  COMPLETED: 2,
  ERROR: -1
};

/**
 * The list of <a href="#method_init"><code>init()</code> method</a> ready state failure codes.
 * @attribute READY_STATE_CHANGE_ERROR
 * @param {Number} API_INVALID                 <small>Value <code>4001</code></small>
 *   The value of the failure code when provided App Key in <code>init()</code> does not exists.
 *   <small>To resolve this, check that the provided App Key exists in
 *   <a href="https://console.temasys.io">the Temasys Console</a>.</small>
 * @param {Number} API_DOMAIN_NOT_MATCH        <small>Value <code>4002</code></small>
 *   The value of the failure code when <code>"domainName"</code> property in the App Key does not
 *   match the accessing server IP address.
 *   <small>To resolve this, contact our <a href="http://support.temasys.io">support portal</a>.</small>
 * @param {Number} API_CORS_DOMAIN_NOT_MATCH   <small>Value <code>4003</code></small>
 *   The value of the failure code when <code>"corsurl"</code> property in the App Key does not match accessing CORS.
 *   <small>To resolve this, configure the App Key CORS in
 *   <a href="https://console.temasys.io">the Temasys Console</a>.</small>
 * @param {Number} API_CREDENTIALS_INVALID     <small>Value <code>4004</code></small>
 *   The value of the failure code when there is no [CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
 *   present in the HTTP headers during the request to the Auth server present nor
 *   <code>options.credentials.credentials</code> configuration provided in the <code>init()</code>.
 *   <small>To resolve this, ensure that CORS are present in the HTTP headers during the request to the Auth server.</small>
 * @param {Number} API_CREDENTIALS_NOT_MATCH   <small>Value <code>4005</code></small>
 *   The value of the failure code when the <code>options.credentials.credentials</code> configuration provided in the
 *   <code>init()</code> does not match up with the <code>options.credentials.startDateTime</code>,
 *   <code>options.credentials.duration</code> or that the <code>"secret"</code> used to generate
 *   <code>options.credentials.credentials</code> does not match the App Key's <code>"secret</code> property provided.
 *   <small>To resolve this, check that the <code>options.credentials.credentials</code> is generated correctly and
 *   that the <code>"secret"</code> used to generate it is from the App Key provided in the <code>init()</code>.</small>
 * @param {Number} API_INVALID_PARENT_KEY      <small>Value <code>4006</code></small>
 *   The value of the failure code when the App Key provided does not belong to any existing App.
 *   <small>To resolve this, check that the provided App Key exists in
 *   <a href="https://console.temasys.io">the Developer Console</a>.</small>
 * @param {Number} API_NO_MEETING_RECORD_FOUND <small>Value <code>4010</code></small>
 *   The value of the failure code when provided <code>options.credentials</code>
 *   does not match any scheduled meetings available for the "Persistent Room" enabled App Key provided.
 *   <small>See the <a href="http://support.temasys.io/support/solutions/articles/
 * 12000002811-using-the-persistent-room-feature-to-configure-meetings">Persistent Room article</a> to learn more.</small>
 * @param {Number} API_OVER_SEAT_LIMIT         <small>Value <code>4020</code></small>
 *   The value of the failure code when App Key has reached its current concurrent users limit.
 *   <small>To resolve this, use another App Key. To create App Keys dynamically, see the
 *   <a href="https://temasys.atlassian.net/wiki/display/TPD/SkylinkAPI+-+Application+Resources">Application REST API
 *   docs</a> for more information.</small>
 * @param {Number} API_RETRIEVAL_FAILED        <small>Value <code>4021</code></small>
 *   The value of the failure code when App Key retrieval of authentication token fails.
 *   <small>If this happens frequently, contact our <a href="http://support.temasys.io">support portal</a>.</small>
 * @param {Number} API_WRONG_ACCESS_DOMAIN     <small>Value <code>5005</code></small>
 *   The value of the failure code when App Key makes request to the incorrect Auth server.
 *   <small>To resolve this, ensure that the <code>roomServer</code> is not configured. If this persists even without
 *   <code>roomServer</code> configuration, contact our <a href="http://support.temasys.io">support portal</a>.</small>
 * @param {Number} XML_HTTP_REQUEST_ERROR      <small>Value <code>-1</code></small>
 *   The value of the failure code when requesting to Auth server has timed out.
 * @param {Number} NO_SOCKET_IO                <small>Value <code>1</code></small>
 *   The value of the failure code when dependency <a href="http://socket.io/download/">Socket.IO client</a> is not loaded.
 *   <small>To resolve this, ensure that the Socket.IO client dependency is loaded before the Skylink SDK.
 *   You may use the provided Socket.IO client <a href="http://socket.io/download/">CDN here</a>.</small>
 * @param {Number} NO_XMLHTTPREQUEST_SUPPORT   <small>Value <code>2</code></small>
 *   The value of the failure code when <a href="https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest">
 *   XMLHttpRequest API</a> required to make request to Auth server is not supported.
 *   <small>To resolve this, display in the Web UI to ask clients to switch to the list of supported browser
 *   as <a href="https://github.com/Temasys/SkylinkJS/tree/0.6.14#supported-browsers">listed in here</a>.</small>
 * @param {Number} NO_WEBRTC_SUPPORT           <small>Value <code>3</code></small>
 *   The value of the failure code when <a href="https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/">
 *   RTCPeerConnection API</a> required for Peer connections is not supported.
 *   <small>To resolve this, display in the Web UI to ask clients to switch to the list of supported browser
 *   as <a href="https://github.com/Temasys/SkylinkJS/tree/0.6.14#supported-browsers">listed in here</a>.
 *   For <a href="http://confluence.temasys.com.sg/display/TWPP">plugin supported browsers</a>, if the clients
 *   does not have the plugin installed, there will be an installation toolbar that will prompt for installation
 *   to support the RTCPeerConnection API.</small>
 * @param {Number} NO_PATH                     <small>Value <code>4</code></small>
 *   The value of the failure code when provided <code>init()</code> configuration has errors.
 * @param {Number} ADAPTER_NO_LOADED           <small>Value <code>7</code></small>
 *   The value of the failure code when dependency <a href="https://github.com/Temasys/AdapterJS/">AdapterJS</a>
 *   is not loaded.
 *   <small>To resolve this, ensure that the AdapterJS dependency is loaded before the Skylink dependency.
 *   You may use the provided AdapterJS <a href="https://github.com/Temasys/AdapterJS/">CDN here</a>.</small>
 * @param {Number} PARSE_CODECS                <small>Value <code>8</code></small>
 *   The value of the failure code when codecs support cannot be parsed and retrieved.
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.4.0
 */
Skylink.prototype.READY_STATE_CHANGE_ERROR = {
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
  NO_SOCKET_IO: 1,
  NO_XMLHTTPREQUEST_SUPPORT: 2,
  NO_WEBRTC_SUPPORT: 3,
  NO_PATH: 4,
  ADAPTER_NO_LOADED: 7,
  PARSE_CODECS: 8
};

/**
 * Spoofs the REGIONAL_SERVER to prevent errors on deployed apps except the fact this no longer works.
 * Automatic regional selection has already been implemented hence REGIONAL_SERVER is no longer useful.
 * @attribute REGIONAL_SERVER
 * @type JSON
 * @readOnly
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype.REGIONAL_SERVER = {
  APAC1: '',
  US1: ''
};

/**
 * Function that generates an <a href="https://en.wikipedia.org/wiki/Universally_unique_identifier">UUID</a> (Unique ID).
 * @method generateUUID
 * @return {String} Returns a generated UUID (Unique ID).
 * @for Skylink
 * @since 0.5.9
 */
/* jshint ignore:start */
Skylink.prototype.generateUUID = function() {
  var d = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === 'x' ? r : (r && 0x7 | 0x8)).toString(16);
  });
  return uuid;
};
/* jshint ignore:end */

/**
 * Function that authenticates and initialises App Key used for Room connections.
 * @method init
 * @param {JSON|String} options The configuration options.
 * - When provided as a string, it's configured as <code>options.appKey</code>.
 * @param {String} options.appKey The App Key.
 *   <small>By default, <code>init()</code> uses [HTTP CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
 *   authentication. For credentials based authentication, see the <code>options.credentials</code> configuration
 *   below. You can know more about the <a href="http://support.temasys.io/support/solutions/articles/
 * 12000002712-authenticating-your-application-key-to-start-a-connection">in the authentication methods article here</a>
 *   for more details on the various authentication methods.</small>
 *   <small>If you are using the Persistent Room feature for scheduled meetings, you will require to
 *   use the credential based authentication. See the <a href="http://support.temasys.io/support
 * /solutions/articles/12000002811-using-the-persistent-room-feature-to-configure-meetings">Persistent Room article here
 *   </a> for more information.</small>
 * @param {String} [options.defaultRoom] The default Room to connect to when no <code>room</code> parameter
 *    is provided in  <a href="#method_joinRoom"><code>joinRoom()</code> method</a>.
 * - When not provided or is provided as an empty string, its value is <code>options.appKey</code>.
 *   <small>Note that switching Rooms is not available when using <code>options.credentials</code> based authentication.
 *   The Room that User will be connected to is the <code>defaultRoom</code> provided.</small>
 * @param {String} [options.roomServer] The Auth server.
 * <small>Note that this is a debugging feature and is only used when instructed for debugging purposes.</small>
 * @param {Boolean} [options.enableIceTrickle=true] The flag if Peer connections should
 *   trickle ICE for faster connectivity.
 * @param {Boolean} [options.enableDataChannel=true] <blockquote class="info">
 *   Note that for Edge browsers, this value is overriden as <code>false</code> due to its supports.
 *   </blockquote> The flag if Datachannel connections should be enabled.
 *   <small>This is required to be enabled for <a href="#method_sendBlobData"><code>sendBlobData()</code> method</a>,
 *   <a href="#method_sendURLData"><code>sendURLData()</code> method</a> and
 *   <a href="#method_sendP2PMessage"><code>sendP2PMessage()</code> method</a>.</small>
 * @param {Boolean} [options.enableTURNServer=true] The flag if TURN ICE servers should
 *   be used when constructing Peer connections to allow TURN connections when required and enabled for the App Key.
 * @param {Boolean} [options.enableSTUNServer=true] <blockquote class="info">
 *   Note that for Edge browsers, this value is overriden as <code>false</code> due to its supports.
 *   </blockquote> The flag if STUN ICE servers should
 *   be used when constructing Peer connections to allow TURN connections when required.
 * @param {Boolean} [options.forceTURN=false] The flag if Peer connections should enforce
 *   connections over the TURN server.
 *   <small>This overrides <code>options.enableTURNServer</code> value to <code>true</code> and
 *   <code>options.enableSTUNServer</code> value to <code>false</code>, <code>options.filterCandidatesType.host</code>
 *   value to <code>true</code>, <code>options.filterCandidatesType.srflx</code> value to <code>true</code> and
 *   <code>options.filterCandidatesType.relay</code> value to <code>false</code>.</small>
 *   <small>Note that currently for MCU enabled Peer connections, the <code>options.filterCandidatesType</code>
 *   configuration is not honoured as Peers connected with MCU is similar as a forced TURN connection. The flags
 *   will act as if the value is <code>false</code> and ICE candidates will never be filtered regardless of the
 *   <code>options.filterCandidatesType</code> configuration.</small>
 * @param {Boolean} [options.usePublicSTUN=true] The flag if publicly available STUN ICE servers should
 *   be used if <code>options.enableSTUNServer</code> is enabled.
 * @param {Boolean} [options.TURNServerTransport] <blockquote class="info">
 *   Note that configuring the protocol may not necessarily result in the desired network transports protocol
 *   used in the actual TURN network traffic as it depends which protocol the browser selects and connects with.
 *   This simply configures the TURN ICE server urls <code?transport=(protocol)</code> query option when constructing
 *   the Peer connection. When all protocols are selected, the ICE servers urls are duplicated with all protocols.<br>
 *   Note that for Edge browsers, this value is overriden as <code>UDP</code> due to its supports.
 *   </blockquote> The option to configure the <code>?transport=</code>
 *   query parameter in TURN ICE servers when constructing a Peer connections.
 * - When not provided, its value is <code>ANY</code>.
 *   [Rel: Skylink.TURN_TRANSPORT]
 * @param {Boolean} [options.disableVideoFecCodecs=false] <blockquote class="info">
 *   Note that this is an experimental flag and may cause disruptions in connections or connectivity issues when toggled,
 *   and to prevent connectivity issues, these codecs will not be removed for MCU enabled Peer connections.
 *   </blockquote> The flag if video FEC (Forward Error Correction)
 *   codecs like ulpfec and red should be removed in sending session descriptions.
 *   <small>This can be useful for debugging purposes to prevent redundancy and overheads in RTP encoding.</small>
 * @param {Boolean} [options.disableComfortNoiseCodec=false] <blockquote class="info">
 *   Note that this is an experimental flag and may cause disruptions in connections or connectivity issues when toggled.
 *   </blockquote> The flag if audio
 *   <a href="https://en.wikipedia.org/wiki/Comfort_noise">Comfort Noise (CN)</a> codec should be removed
 *   in sending session descriptions.
 *   <small>This can be useful for debugging purposes to test preferred audio quality and feedback.</small>
 * @param {Boolean} [options.disableREMB=false] <blockquote class="info">
 *   Note that this is mainly used for debugging purposes and that it is an experimental flag, so
 *   it may cause disruptions in connections or connectivity issues when toggled. </blockquote>
 *   The flag if video REMB feedback packets should be disabled in sending session descriptions.
 * @param {JSON} [options.credentials] The credentials used for authenticating App Key with
 *   credentials to retrieve the Room session token used for connection in <a href="#method_joinRoom">
 *   <code>joinRoom()</code> method</a>.
 *   <small>Note that switching of Rooms is not allowed when using credentials based authentication, unless
 *   <code>init()</code> is invoked again with a different set of credentials followed by invoking
 *   the <a href="#method_joinRoom"><code>joinRoom()</code> method</a>.</small>
 * @param {String} options.credentials.startDateTime The credentials User session in Room starting DateTime
 *   in <a href="https://en.wikipedia.org/wiki/ISO_8601">ISO 8601 format</a>.
 * @param {Number} options.credentials.duration The credentials User session in Room duration in hours.
 * @param {String} options.credentials.credentials The generated credentials used to authenticate
 *   the provided App Key with its <code>"secret"</code> property.
 *   <blockquote class="details"><h5>To generate the credentials:</h5><ol>
 *   <li>Concatenate a string that consists of the Room name you provide in the <code>options.defaultRoom</code>,
 *   the <code>options.credentials.duration</code> and the <code>options.credentials.startDateTime</code>.
 *   <small>Example: <code>var concatStr = defaultRoom + "_" + duration + "_" + startDateTime;</code></small></li>
 *   <li>Hash the concatenated string with the App Key <code>"secret"</code> property using
 *   <a href="https://en.wikipedia.org/wiki/SHA-1">SHA-1</a>.
 *   <small>Example: <code>var hash = CryptoJS.HmacSHA1(concatStr, appKeySecret);</code></small>
 *   <small>See the <a href="https://code.google.com/p/crypto-js/#HMAC"><code>CryptoJS.HmacSHA1</code> library</a>.</small></li>
 *   <li>Encode the hashed string using <a href="https://en.wikipedia.org/wiki/Base64">base64</a>
 *   <small>Example: <code>var b64Str = hash.toString(CryptoJS.enc.Base64);</code></small>
 *   <small>See the <a href="https://code.google.com/p/crypto-js/#The_Cipher_Output">CryptoJS.enc.Base64</a> library</a>.</small></li>
 *   <li>Encode the base64 encoded string to replace special characters using UTF-8 encoding.
 *   <small>Example: <code>var credentials = encodeURIComponent(base64String);</code></small>
 *   <small>See <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/
 * Global_Objects/encodeURIComponent">encodeURIComponent() API</a>.</small></li></ol></blockquote>
 * @param {Boolean} [options.audioFallback=false] The flag if <a href="#method_getUserMedia">
 *   <code>getUserMedia()</code> method</a> should fallback to retrieve only audio Stream when
 *   retrieving audio and video Stream fails.
 * @param {Boolean} [options.forceSSL=false] The flag if HTTPS connections should be enforced
 *   during request to Auth server and socket connections to Signaling server
 *   when accessing <code>window.location.protocol</code> value is <code>"http:"</code>.
 *   <small>By default, <code>"https:"</code> protocol connections uses HTTPS connections.</small>
 * @param {String} [options.audioCodec] <blockquote class="info">
 *   Note that if the audio codec is not supported, the SDK will not configure the local <code>"offer"</code> or
 *   <code>"answer"</code> session description to prefer the codec.<br>
 *   Note that for Edge browsers, this value is set as <code>OPUS</code> due to its supports.</blockquote>
 *   The option to configure the preferred audio codec to use to encode sending audio data when available for Peer connection.
 * - When not provided, its value is <code>AUTO</code>.
 *   [Rel: Skylink.AUDIO_CODEC]
 * @param {String} [options.videoCodec] <blockquote class="info">
 *   Note that if the video codec is not supported, the SDK will not configure the local <code>"offer"</code> or
 *   <code>"answer"</code> session description to prefer the codec.<br>
 *   Note that for Edge browsers, this value is set as <code>H264</code> due to its supports.</blockquote>
 *   The option to configure the preferred video codec to use to encode sending video data when available for Peer connection.
 * - When not provided, its value is <code>AUTO</code>.
 *   [Rel: Skylink.VIDEO_CODEC]
 * @param {Number} [options.socketTimeout=20000] The timeout for each attempts for socket connection
 *   with the Signaling server to indicate that connection has timed out and has failed to establish.
 *   <small>Note that the mininum timeout value is <code>5000</code>. If less, this value will be <code>5000</code>.</small>
 *   <small>Note that it is recommended to use <code>12000</code> as the lowest timeout value if Peers are connecting
 *   using Polling transports to prevent connection errors.</small>
 * @param {Boolean} [options.forceTURNSSL=false] <blockquote class="info">
 *   Note that currently Firefox does not support the TURNS protocol, and that if TURNS is required,
 *   TURN ICE servers using port <code>443</code> will be used instead.<br>
 *   Note that for Edge browsers, this value is overriden as <code>false</code> due to its supports and
 *   only port <code>3478</code> is used.</blockquote>
 *   The flag if TURNS protocol should be used when <code>options.enableTURNServer</code> is enabled.
 * @param {JSON} [options.filterCandidatesType] <blockquote class="info">
 *   Note that this a debugging feature and there might be connectivity issues when toggling these flags.
 *   </blockquote> The configuration options to filter the type of ICE candidates sent and received.
 * @param {Boolean} [options.filterCandidatesType.host=false] The flag if local network ICE candidates should be filtered out.
 * @param {Boolean} [options.filterCandidatesType.srflx=false] The flag if STUN ICE candidates should be filtered out.
 * @param {Boolean} [options.filterCandidatesType.relay=false] The flag if TURN ICE candidates should be filtered out.
 * @param {JSON} [options.throttleIntervals] The configuration options to configure the throttling method timeouts.
 * @param {Number} [options.throttleIntervals.shareScreen=10000] The interval timeout for
 *   <a href="#method_shareScreen"><code>shareScreen()</code> method</a> throttling in milliseconds.
 * @param {Number} [options.throttleIntervals.getUserMedia=0] The interval timeout for
 *   <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a> throttling in milliseconds.
 * @param {Number} [options.throttleIntervals.refreshConnection=5000] <blockquote class="info">
 *   Note that this throttling is only done for MCU enabled Peer connections with the
 *   <code>options.mcuUseRenegoRestart</code> being set to <code>false</code>.
 *   </blockquote> The interval timeout for <a href="#method_refreshConnection">
 *   <code>refreshConnection()</code> method</a> throttling in milliseconds.
 *   <small>Note that there will be no throttling when <a href="#method_refreshConnection">
 *   <code>refreshConnection()</code> method</a> is called internally.</small>
 * @param {Boolean} [options.throttleShouldThrowError=false] The flag if throttled methods should throw errors when
 *   method is invoked less than the interval timeout value configured in <code>options.throttleIntervals</code>.
 * @param {Boolean} [options.mcuUseRenegoRestart=false] <blockquote class="info">
 *   Note that this feature is currently is beta and for any enquiries on enabling and its support, please
 *   contact <a href="http://support.temasys.io">our support portal</a>.</blockquote>
 *   The flag if <a href="#method_refreshConnection"><code>
 *   refreshConnection()</code> method</a> should renegotiate like non-MCU enabled Peer connection for MCU
 *   enabled Peer connections instead of invoking <a href="#method_joinRoom"><code>joinRoom()</code> method</a> again.
 * @param {String} [options.iceServer] The ICE server.
 *   <small>Note that this is a debugging feature and is only used when instructed for debugging purposes.</small>
 * @param {String} [options.socketServer] The Signaling server.
 *   <small>Note that this is a debugging feature and is only used when instructed for debugging purposes.</small>
 * @param {Function} [callback] The callback function fired when request has completed.
 *   <small>Function parameters signature is <code>function (error, success)</code></small>
 *   <small>Function request completion is determined by the <a href="#event_readyStateChange">
 *   <code>readyStateChange</code> event</a> <code>state</code> parameter payload value
 *   as <code>COMPLETED</code> for request success.</small>
 *   [Rel: Skylink.READY_STATE_CHANGE]
 * @param {JSON|String} callback.error The error result in request.
 * - When defined as string, it's the error when required App Key is not provided.
 *   <small>Defined as <code>null</code> when there are no errors in request</small>
 * @param {Number} callback.error.errorCode The <a href="#event_readyStateChange"><code>readyStateChange</code>
 *   event</a> <code>error.errorCode</code> parameter payload value.
 *   [Rel: Skylink.READY_STATE_CHANGE_ERROR]
 * @param {Error} callback.error.error The <a href="#event_readyStateChange"><code>readyStateChange</code>
 *   event</a> <code>error.content</code> parameter payload value.
 * @param {Number} callback.error.status The <a href="#event_readyStateChange"><code>readyStateChange</code>
 *   event</a> <code>error.status</code> parameter payload value.
 * @param {JSON} callback.success The success result in request.
 *   <small>Defined as <code>null</code> when there are errors in request</small>
 * @param {String} callback.success.serverUrl The constructed REST URL requested to Auth server.
 * @param {String} callback.success.readyState The current ready state.
 *   [Rel: Skylink.READY_STATE_CHANGE]
 * @param {String} callback.success.selectedRoom The Room based on the current Room session token retrieved for.
 * @param {String} callback.success.appKey The configured value of the <code>options.appKey</code>.
 * @param {String} callback.success.defaultRoom The configured value of the <code>options.defaultRoom</code>.
 * @param {String} callback.success.roomServer The configured value of the <code>options.roomServer</code>.
 * @param {Boolean} callback.success.enableIceTrickle The configured value of the <code>options.enableIceTrickle</code>.
 * @param {Boolean} callback.success.enableDataChannel The configured value of the <code>options.enableDataChannel</code>.
 * @param {Boolean} callback.success.enableTURNServer The configured value of the <code>options.enableTURNServer</code>.
 * @param {Boolean} callback.success.enableSTUNServer The configured value of the <code>options.enableSTUNServer</code>.
 * @param {Boolean} callback.success.TURNTransport The configured value of the <code>options.TURNServerTransport</code>.
 * @param {Boolean} callback.success.audioFallback The configured value of the <code>options.audioFallback</code>.
 * @param {Boolean} callback.success.forceSSL The configured value of the <code>options.forceSSL</code>.
 * @param {String} callback.success.audioCodec The configured value of the <code>options.audioCodec</code>.
 * @param {String} callback.success.videoCodec The configured value of the <code>options.videoCodec</code>.
 * @param {Number} callback.success.socketTimeout The configured value of the <code>options.socketTimeout</code>.
 * @param {Boolean} callback.success.forceTURNSSL The configured value of the <code>options.forceTURNSSL</code>.
 * @param {Boolean} callback.success.forceTURN The configured value of the <code>options.forceTURN</code>.
 * @param {Boolean} callback.success.usePublicSTUN The configured value of the <code>options.usePublicSTUN</code>.
 * @param {Boolean} callback.success.disableVideoFecCodecs The configured value of the <code>options.disableVideoFecCodecs</code>.
 * @param {Boolean} callback.success.disableComfortNoiseCodec The configured value of the <code>options.disableComfortNoiseCodec</code>.
 * @param {Boolean} callback.success.disableREMB The configured value of the <code>options.disableREMB</code>.
 * @param {JSON} callback.success.filterCandidatesType The configured value of the <code>options.filterCandidatesType</code>.
 * @param {Number} callback.success.throttleIntervals The configured value of the <code>options.throttleIntervals</code>.
 * @param {Number} callback.success.throttleShouldThrowError The configured value of the <code>options.throttleShouldThrowError</code>.
 * @param {Number} callback.success.mcuUseRenegoRestart The configured value of the <code>options.mcuUseRenegoRestart</code>.
 * @param {Number} callback.success.iceServer The configured value of the <code>options.iceServer</code>.
 * @param {Number} callback.success.socketServer The configured value of the <code>options.socketServer</code>.
 * @example
 *   // Example 1: Using CORS authentication and connection to default Room
 *   skylinkDemo(appKey, function (error, success) {
 *     if (error) return;
 *     skylinkDemo.joinRoom(); // Goes to default Room
 *   });
 *
 *   // Example 2: Using CORS authentication and connection to a different Room
 *   skylinkDemo(appKey, function (error, success) {
 *     skylinkDemo.joinRoom("testxx"); // Goes to "testxx" Room
 *   });
 *
 *   // Example 3: Using credentials authentication and connection to only default Room
 *   var defaultRoom   = "test",
 *       startDateTime = (new Date()).toISOString(),
 *       duration      = 1, // Allows only User session to stay for 1 hour
 *       appKeySecret  = "xxxxxxx",
 *       hash          = CryptoJS.HmacSHA1(defaultRoom + "_" + duration + "_" + startDateTime, appKeySecret);
 *       credentials   = encodeURIComponent(hash.toString(CryptoJS.enc.Base64));
 *
 *   skylinkDemo({
 *     defaultRoom: defaultRoom,
 *     appKey: appKey,
 *     credentials: {
 *       duration: duration,
 *       startDateTime: startDateTime,
 *       credentials: credentials
 *     }
 *   }, function (error, success) {
 *     if (error) return;
 *     skylinkDemo.joinRoom(); // Goes to default Room (switching to different Room is not allowed for credentials authentication)
 *   });
 * @trigger <ol class="desc-seq">
 *   <li>If parameter <code>options</code> is not provided: <ol><li><b>ABORT</b> and return error.</li></ol></li>
 *   <li>Checks if dependecies and browser APIs are available. <ol><li>If AdapterJS is not loaded: <ol>
 *   <li><a href="#event_readyStateChange"><code>readyStateChange</code> event</a> triggers
 *   parameter payload <code>state</code> as <code>ERROR</code> and <code>error.errorCode</code> as
 *   <code>ADAPTER_NO_LOADED</code>.</li><li><b>ABORT</b> and return error.</li></ol></li>
 *   <li>If socket.io-client is not loaded: <ol><li><a href="#event_readyStateChange">
 *   <code>readyStateChange</code> event</a> triggers parameter payload <code>state</code>
 *   as <code>ERROR</code> and <code>error.errorCode</code> as <code>NO_SOCKET_IO</code>.</li>
 *   <li><b>ABORT</b> and return error. </li></ol></li>
 *   <li>If XMLHttpRequest API is not available: <ol><li><a href="#event_readyStateChange">
 *   <code>readyStateChange</code> event</a> triggers parameter payload <code>state</code>
 *   as <code>ERROR</code> and <code>error.errorCode</code> as <code>NO_XMLHTTPREQUEST_SUPPORT</code>.</li>
 *   <li><b>ABORT</b> and return error.</li></ol></li><li>If WebRTC is not supported by device: <ol>
 *   <li><a href="#event_readyStateChange"><code>readyStateChange</code> event</a> triggers parameter
 *   payload <code>state</code> as <code>ERROR</code> and <code>error.errorCode</code> as
 *   <code>NO_WEBRTC_SUPPORT</code>.</li><li><b>ABORT</b> and return error.</li></ol></li></ol></li>
 *   <li>Retrieves Room session token from Auth server. <ol>
 *   <li><a href="#event_readyStateChange"><code>readyStateChange</code> event</a> triggers
 *   parameter payload <code>state</code> as <code>LOADING</code>.</li>
 *   <li>If retrieval was successful: <ol><li><a href="#event_readyStateChange"><code>readyStateChange</code> event</a>
 *   triggers parameter payload <code>state</code> as <code>COMPLETED</code>.</li></ol></li><li>Else: <ol>
 *   <li><a href="#event_readyStateChange"><code>readyStateChange</code> event</a> triggers parameter
 *   payload <code>state</code> as <code>ERROR</code>.</li><li><b>ABORT</b> and return error.</li></ol></li></ol></li></ol>
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.init = function(options, callback) {
  var self = this;

  // Default init() options
  self._options = {
    appKey: null,
    defaultRoom: null,
    credentials: null,
    roomServer: '//api.temasys.io',
    iceServer: null,
    socketServer: null,
    enableSTUNServer: true,
    enableTURNServer: true,
    enableDataChannel: true,
    enableIceTrickle: true,
    usePublicSTUN: true,
    TURNServerTransport: self.TURN_TRANSPORT.ANY,
    videoCodec: self.AUDIO_CODEC.AUTO,
    audioCodec: self.VIDEO_CODEC.AUTO,
    forceSSL: false,
    forceTURN: false,
    forceTURNSSL: false,
    audioFallback: false,
    throttleShouldThrowError: false,
    mcuUseRenegoRestart: false,
    disableREMB: false,
    disableVideoFecCodecs: false,
    disableComfortNoiseCodec: false,
    socketTimeout: 20000,
    filterCandidatesType: {
      host: false,
      srflx: false,
      relay: false
    },
    throttleIntervals: {
      shareScreen: 10000,
      refreshConnection: 5000,
      getUserMedia: 0
    }
  };

  // Parse init() options
  // --> init (function () {})
  if (typeof options === 'function'){
    callback = options;
    options = undefined;

  // --> init ("xxxxx-xxxxx-xxxxx-xxxxx", ..)
  } else if (options && typeof options === 'string') {
    self._options.appKey = options;
    self._options.defaultRoom = options;

  // --> init ({}, ..)
  } else if (options && typeof options === 'object') {
    // Parse options.appKey
    if (options.appKey && typeof options.appKey === 'string') {
      self._options.appKey = options.appKey;
      self._options.defaultRoom = options.appKey;

    // Parse options.apiKey (deprecated)
    } else if (options.apiKey && typeof options.apiKey === 'string') {
      self._options.appKey = options.apiKey;
      self._options.defaultRoom = options.apiKey;
    }

    // Parse options.defaultRoom
    if (options.defaultRoom && typeof options.defaultRoom === 'string') {
      self._options.defaultRoom = options.defaultRoom;
    }

    // Parse options.roomServer
    if (options.roomServer && typeof options.roomServer === 'string' &&
      options.roomServer.indexOf('temasys') > -1 && options.roomServer.indexOf('//') === 0) {
      self._options.roomServer = options.roomServer.lastIndexOf('/') === (options.roomServer.length - 1) ?
        options.roomServer.substring(0, options.roomServer.length - 1) : options.roomServer;
    }

    // Parse options.iceServer
    if (options.iceServer && typeof options.iceServer === 'string' && options.iceServer.indexOf('temasys') > -1) {
      self._options.iceServer = options.iceServer;
    }

    // Parse options.socketServer
    if (options.socketServer && typeof options.socketServer === 'string' && options.socketServer.indexOf('temasys') > -1) {
      self._options.socketServer = options.socketServer;
    }

    // Parse options.credentials
    // Ensure that values are all passed in correctly
    if (options.credentials && typeof options.credentials === 'object' && options.credentials.credentials &&
      typeof options.credentials.credentials === 'string' && typeof options.credentials.duration === 'number' &&
      options.credentials.startDateTime && typeof options.credentials.startDateTime === 'string') {
      self._options.credentials = {
        startDateTime: options.credentials.startDateTime,
        duration: options.credentials.duration,
        credentials: options.credentials.credentials
      };
    }

    // Parse options.socketTimeout
    if (typeof options.socketTimeout === 'number' && options.socketTimeout >= 5000) {
      self._options.socketTimeout = options.socketTimeout;
    }

    // Parse options.audioCodec
    if (options.audioCodec && typeof options.audioCodec === 'string') {
      for (var aprop in self.AUDIO_CODEC) {
        if (self.AUDIO_CODEC.hasOwnProperty(aprop) && self.AUDIO_CODEC[aprop] === options.audioCodec) {
          self._options.audioCodec = options.audioCodec;
        }
      }
    }

    // Parse options.videoCodec
    if (options.videoCodec && typeof options.videoCodec === 'string') {
      for (var vprop in self.VIDEO_CODEC) {
        if (self.VIDEO_CODEC.hasOwnProperty(vprop) && self.VIDEO_CODEC[vprop] === options.videoCodec) {
          self._options.videoCodec = options.videoCodec;
        }
      }
    }

    // Parse options.TURNServerTransport
    if (options.TURNServerTransport && typeof options.TURNServerTransport === 'string') {
      for (var tprop in self.TURN_TRANSPORT) {
        if (self.TURN_TRANSPORT.hasOwnProperty(tprop) && self.TURN_TRANSPORT[tprop] === options.TURNServerTransport) {
          self._options.TURNServerTransport = options.TURNServerTransport;
        }
      }
    }

    // Parse options.filterCandidatesType
    if (options.filterCandidatesType && typeof options.filterCandidatesType === 'object') {
      // Parse options.filterCandidatesType.host
      self._options.filterCandidatesType.host = options.filterCandidatesType.host === true;
      // Parse options.filterCandidatesType.srflx
      self._options.filterCandidatesType.srflx = options.filterCandidatesType.srflx === true;
      // Parse options.filterCandidatesType.relay
      self._options.filterCandidatesType.relay = options.filterCandidatesType.relay === true;
    }

    // Parse options.throttleIntervals
    if (options.throttleIntervals && typeof options.throttleIntervals === 'object') {
      // Parse options.throttleIntervals.getUserMedia
      if (typeof options.throttleIntervals.getUserMedia === 'number') {
        self._options.throttleIntervals.getUserMedia = options.throttleIntervals.getUserMedia;
      }
      // Parse options.throttleIntervals.refreshConnection
      if (typeof options.throttleIntervals.refreshConnection === 'number') {
        self._options.throttleIntervals.refreshConnection = options.throttleIntervals.refreshConnection;
      }
      // Parse options.throttleIntervals.shareScreen
      if (typeof options.throttleIntervals.shareScreen === 'number') {
        self._options.throttleIntervals.shareScreen = options.throttleIntervals.shareScreen;
      }
    }

    // Parse options.enableSTUNServer
    self._options.enableSTUNServer = options.enableSTUNServer !== false;
    // Parse options.enableTURNServer
    self._options.enableTURNServer = options.enableTURNServer !== false;
    // Parse options.enableIceTrickle
    self._options.enableIceTrickle = options.enableIceTrickle !== false;
    // Parse options.enableDataChannel
    self._options.enableDataChannel = options.enableDataChannel !== false;
    // Parse options.usePublicSTUN
    self._options.usePublicSTUN = options.usePublicSTUN !== false;
    // Parse options.forceSSL
    self._options.forceSSL = options.forceSSL === true;
    // Parse options.forceTURNSSL
    self._options.forceTURNSSL = options.forceTURNSSL === true;
    // Parse options.audioFallback
    self._options.audioFallback = options.audioFallback === true;
    // Parse options.disableVideoFecCodecs
    self._options.disableVideoFecCodecs = options.disableVideoFecCodecs === true;
    // Parse options.disableComfortNoiseCodec
    self._options.disableComfortNoiseCodec = options.disableComfortNoiseCodec === true;
    // Parse options.disableREMB
    self._options.disableREMB = options.disableREMB === true;
    // Parse options.mcuUseRenegoRestart
    self._options.mcuUseRenegoRestart = options.mcuUseRenegoRestart === true;
    // Parse options.throttleShouldThrowError
    self._options.throttleShouldThrowError = options.throttleShouldThrowError === true;

    // Parse options.forceTURN
    // Override any configuration for force TURN case
    if (options.forceTURN === true) {
      self._options.filterCandidatesType.host = true;
      self._options.filterCandidatesType.srflx = true;
      self._options.filterCandidatesType.relay = false;
      self._options.enableTURNServer = true;
      self._options.enableSTUNServer = false;
      self._options.usePublicSTUN = false;
      self._options.forceTURN = true;
    }
  }

  // Edge does not support Datachannel, STUN server connections, TURN transports of UDP..
  if (window.webrtcDetectedBrowser === 'edge') {
    log.warn('init() overriding any configuration for Edge connection case.');

    self._options.filterCandidatesType.host = true;
    self._options.filterCandidatesType.srflx = true;
    self._options.filterCandidatesType.relay = false;
    self._options.enableTURNServer = true;
    self._options.enableSTUNServer = false;
    self._options.usePublicSTUN = false;
    // Force Edge to prefer OPUS
    self._options.audioCodec = self.AUDIO_CODEC.OPUS;
    // Force Edge to prefer H264
    self._options.videoCodec = self.AUDIO_CODEC.H264;
    self._options.TURNServerTransport = self.TURN_TRANSPORT.UDP;
  }

  // Check if App Key is provided
  if (!self._options.appKey) {
    return self._initCallback({
      state: self.READY_STATE_CHANGE.ERROR,
      content: 'No API key provided.',
      errorCode: self.READY_STATE_CHANGE_ERROR.NO_PATH,
      room: self._options.defaultRoom
    }, callback);
  }

  // Check if XMLHttpRequest is supported
  if (!(window.XMLHttpRequest || window.XDomainRequest)) {
    return self._initCallback({
      state: self.READY_STATE_CHANGE.ERROR,
      content: 'XMLHttpRequest not available',
      errorCode: self.READY_STATE_CHANGE_ERROR.NO_XMLHTTPREQUEST_SUPPORT,
      room: self._options.defaultRoom
    }, callback);
  }

  // Check if socket.io-client has been loaded
  if (!(window.io || io)) {
    return self._initCallback({
      state: self.READY_STATE_CHANGE.ERROR,
      content: 'Socket.io not found',
      errorCode: self.READY_STATE_CHANGE_ERROR.NO_SOCKET_IO,
      room: self._options.defaultRoom
    }, callback);
  }

  // Check if AdapterJS has been loaded
  if (!((window.AdapterJS || AdapterJS) && typeof AdapterJS.webRTCReady === 'function')) {
    return self._initCallback({
      state: self.READY_STATE_CHANGE.ERROR,
      content: 'AdapterJS dependency is not loaded or incorrect AdapterJS dependency is used',
      errorCode: self.READY_STATE_CHANGE_ERROR.ADAPTER_NO_LOADED,
      room: self._options.defaultRoom
    }, callback);
  }

  AdapterJS.webRTCReady(function () {
    // Check if RTCPeerConnection is available
    if (!window.RTCPeerConnection) {
      return self._initCallback({
        state: self.READY_STATE_CHANGE.ERROR,
        content: 'WebRTC not available',
        errorCode: self.READY_STATE_CHANGE_ERROR.NO_WEBRTC_SUPPORT,
        room: self._options.defaultRoom
      }, callback);
    }

    // Check and get codecs support
    self._getCodecsSupport(function (error) {
      if (error) {
        return self._initCallback({
          state: self.READY_STATE_CHANGE.ERROR,
          content: error.message || error.toString(),
          errorCode: self.READY_STATE_CHANGE_ERROR.PARSE_CODECS,
          room: self._options.defaultRoom
        }, callback);
      }

      // Check if there is any codecs retrieved to start connection
      if (Object.keys(self._currentCodecSupport.audio).length === 0 &&
        Object.keys(self._currentCodecSupport.video).length === 0) {
        return self._initCallback({
          state: self.READY_STATE_CHANGE.ERROR,
          content: 'No audio/video codecs available to start connection',
          errorCode: self.READY_STATE_CHANGE_ERROR.PARSE_CODECS,
          room: self._options.defaultRoom
        }, callback);
      }

      // Fetch API data
      self._initFetchAPIData(self._options.defaultRoom, callback);
    });
  });
};

/**
 * Function that handles `init()` async callbacks to proceed to the next step.
 * @method _initCallback
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._initCallback = function (result, callback) {
  var self = this;

  self._user.room.readyState = result.state;
  // Trigger `readyStateChange` event
  self._trigger('readyStateChange', result.state, result.state === self.READY_STATE_CHANGE.ERROR ? {
    content: result.content,
    status: result.status || null,
    errorCode: result.errorCode
  } : null, result.room);

  // init() result error
  if (result.state === self.READY_STATE_CHANGE.ERROR) {
    log.error('init() failed ->', result);

    if (typeof callback === 'function') {
      // Convert the parameters to suit the documented result
      callback({
        error: new Error(result.content),
        status: result.status || null,
        errorCode: result.errorCode
      }, null);
    }

  // init() result success
  } else if (result.state === self.READY_STATE_CHANGE.COMPLETED) {
    log.info('init() success ->', clone(self._options));

    if (typeof callback === 'function') {
      // Convert the parameters to suit the documented result
      callback(null, {
        serverUrl: self._user.room.path,
        readyState: self._user.room.readyState,
        appKey: self._options.appKey,
        roomServer: self._options.roomServer,
        defaultRoom: self._options.defaultRoom,
        selectedRoom: self._selectedRoom,
        enableDataChannel: self._options.enableDataChannel,
        enableIceTrickle: self._options.enableIceTrickle,
        enableTURNServer: self._options.enableTURNServer,
        enableSTUNServer: self._options.enableSTUNServer,
        TURNTransport: self._options.TURNServerTransport,
        audioFallback: self._options.audioFallback,
        forceSSL: self._options.forceSSL,
        socketTimeout: self._options.socketTimeout,
        forceTURNSSL: self._options.forceTURNSSL,
        audioCodec: self._options.audioCodec,
        videoCodec: self._options.videoCodec,
        forceTURN: self._options.forceTURN,
        usePublicSTUN: self._options.usePublicSTUN,
        disableVideoFecCodecs: self._options.disableVideoFecCodecs,
        disableComfortNoiseCodec: self._options.disableComfortNoiseCodec,
        disableREMB: self._options.disableREMB,
        filterCandidatesType: self._options.filterCandidatesType,
        throttleIntervals: self._options.throttleIntervals,
        throttleShouldThrowError: self._options.throttlingShouldThrowError,
        mcuUseRenegoRestart: self._options.mcuUseRenegoRestart,
        iceServer: self._options.turnServer,
        socketServer: self._options.socketServer
      });
    }
  }
};

/**
 * Function that handles `init()` fetching of API data.
 * @method _initFetchAPIData
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._initFetchAPIData = function (room, callback, isInit) {
  var self = this;
  var xhr = new XMLHttpRequest();
  var protocol = self._options.forceSSL ? 'https:' : window.location.protocol;

  // Fallback support for IE8/9
  if (['object', 'function'].indexOf(typeof window.XDomainRequest) > -1) {
    xhr = new XDomainRequest();
  }

  // Can only use default room due to credentials generated!
  self._user.room.name = self._options.credentials ? self._options.defaultRoom : room;
  self._user.room.protocol = protocol;

  self._initCallback({
    state: self.READY_STATE_CHANGE.INIT,
    room: self._user.room.name
  });

  // Construct API REST path
  self._user.room.path = self._options.roomServer + '/api/' + self._options.appKey + '/' + self._user.room.name;

  // Construct path with credentials authentication.
  if (self._options.credentials) {
    self._user.room.path += '/' + self._options.credentials.startDateTime + '/' +
      self._options.credentials.duration + '?&cred=' + self._options.credentials.credentials;
  }

  // Append random number to prevent network cache
  self._user.room.path += '&' + (!self._options.credentials ? '?' :'') + 'rand=' + (new Date ()).toISOString();

  // XMLHttpRequest success
  xhr.onload = function () {
    var response = JSON.parse(xhr.responseText || xhr.response || '{}') || {};
    var status = xhr.status || 200;

    log.debug('init() retrieved response ->', response);

    // Successful authentication
    if (response.success) {
      // Configure User session settings
      self._user.room.session = {
        uid: response.username,
        userCred: response.userCred,
        timeStamp: response.timeStamp,
        rid: response.room_key,
        roomCred: response.roomCred,
        len: response.len,
        start: response.start,
        cid: response.cid,
        apiOwner: response.apiOwner,
        isPrivileged: response.isPrivileged,
        autoIntroduce: response.autoIntroduce
      };

      // Configure Signaling settings
      self._socket.ports = {
        'https:': Array.isArray(response.httpsPortList) && response.httpsPortList.length > 0 ?
          response.httpsPortList : [443, 3443],
        'http:': Array.isArray(response.httpPortList) && response.httpPortList.length > 0 ?
          response.httpPortList : [80, 3000]
      };
      self._socket.server = response.ipSigserver;

      // Trigger `readyStateChange` event as COMPLETED
      self._initCallback({
        state: self.READY_STATE_CHANGE.COMPLETED,
        room: self._user.room.name
      }, callback);

    // Failed authentication
    } else {
      // Trigger `readyStateChange` event as ERROR
      self._initCallback({
        state: self.READY_STATE_CHANGE.ERROR,
        content: response.info,
        status: status,
        errorCode: response.error,
        room: self._user.room.name
      }, callback);
    }
  };

  // XMLHttpRequest error
  xhr.onerror = function () {
    log.error('init() failed retrieving response due to network timeout.');
    self._initCallback({
      state: self.READY_STATE_CHANGE.ERROR,
      status: xhr.status || null,
      content: 'Network error occurred. (Status: ' + xhr.status + ')',
      errorCode: self.READY_STATE_CHANGE_ERROR.XML_HTTP_REQUEST_ERROR,
      room: self._user.room.name
    }, callback);
  };

  // Trigger `readyStateChange` event as LOADING
  self._initCallback({
    state: self.READY_STATE_CHANGE.LOADING,
    room: self._user.room.name
  });

  xhr.open('GET', protocol + self._user.room.path, true);
  xhr.send();
};
