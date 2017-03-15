/*! skylinkjs - v0.6.19 - Wed Mar 15 2017 20:04:03 GMT+0800 (SGT) */
(function (globals) {

  'use strict';

  /* jshint ignore:start */
  // Object.keys() polyfill - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
  !function(){Object.keys||(Object.keys=function(){var t=Object.prototype.hasOwnProperty,r=!{toString:null}.propertyIsEnumerable("toString"),e=["toString","toLocaleString","valueOf","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","constructor"],o=e.length;return function(n){if("object"!=typeof n&&"function"!=typeof n||null===n)throw new TypeError("Object.keys called on non-object");var c=[];for(var l in n)t.call(n,l)&&c.push(l);if(r)for(var p=0;o>p;p++)t.call(n,e[p])&&c.push(e[p]);return c}}())}();
  // Date.getISOString() polyfill - https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
  !function(){function t(t){return 10>t?"0"+t:t}Date.prototype.toISOString=function(){return this.getUTCFullYear()+"-"+t(this.getUTCMonth()+1)+"-"+t(this.getUTCDate())+"T"+t(this.getUTCHours())+":"+t(this.getUTCMinutes())+":"+t(this.getUTCSeconds())+"."+(this.getUTCMilliseconds()/1e3).toFixed(3).slice(2,5)+"Z"}}();
  // Date.now() polyfill
  !function(){"function"!=typeof Date.now&&(Date.now=function(){return(new Date).getTime()})}();
  // addEventListener() polyfill - https://gist.github.com/eirikbacker/2864711
  !function(e,t){function n(e){var n=t[e];t[e]=function(e){return o(n(e))}}function a(t,n,a){return(a=this).attachEvent("on"+t,function(t){var t=t||e.event;t.preventDefault=t.preventDefault||function(){t.returnValue=!1},t.stopPropagation=t.stopPropagation||function(){t.cancelBubble=!0},n.call(a,t)})}function o(e,t){if(t=e.length)for(;t--;)e[t].addEventListener=a;else e.addEventListener=a;return e}e.addEventListener||(o([t,e]),"Element"in e?e.Element.prototype.addEventListener=a:(t.attachEvent("onreadystatechange",function(){o(t.all)}),n("getElementsByTagName"),n("getElementById"),n("createElement"),o(t.all)))}(window,document);
  // performance.now() polyfill - https://gist.github.com/paulirish/5438650
  !function(){if("performance"in window==0&&(window.performance={}),Date.now=Date.now||function(){return(new Date).getTime()},"now"in window.performance==0){var a=Date.now();performance.timing&&performance.timing.navigationStart&&(a=performance.timing.navigationStart),window.performance.now=function(){return Date.now()-a}}}();
  // BlobBuilder polyfill
  window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
  /* jshint ignore:end */

  /**
 * Class that handles the RTCDataChannel connection.
 */
function Datachannel (channel, peerId, propertyId) {
  // Inherit events functionalities
  EventMixin(this);
  // Public properties
  this.name = channel.label;
  this.peerId = peerId;
  this.propertyId = propertyId;
  // Private properties
  this._connection = channel;
  this._bufferControl = {
    usePolling: typeof this._connection.bufferedAmountLowThreshold !== 'number',
    bufferEvent: { block: 0.5 },
    polling: { blocks: 8, interval: 250 },
    messages: { timestamp: 0, flushTimeout: 100, finalFlushTimeout: 2000 }
  };
  this._stats = {
    messages: { sent: 0, recv: 0 },
    bytes: { sent: 0, recv: 0 }
  };
}

/**
 * Function to start initializing events.
 */
Datachannel.prototype.init = function () {
  var self = this;

  // Handle RTCDataChannel.onopen event
  var onOpenFn = function () {
    self._emit('state', 'open');
  };

  if (self._connection.readyState === 'open') {
    // Set some time to append data before starting transfers
    setTimeout(onOpenFn, 1);
  } else {
    self._connection.onopen = onOpenFn;
    self._emit('state', self._connection.readyState);
  }

  // Handle RTCDataChannel.onclose event
  var onCloseFn = function () {
    self._emit('state', 'closed');
  };

  // Fixes for Firefox bug (49 is working) -> https://bugzilla.mozilla.org/show_bug.cgi?id=1118398
  if (window.webrtcDetectedBrowser === 'firefox') {
    var closed = false;
    var block = 0;

    self._connection.onclose = function () {
      if (!closed) {
        closed = true;
        onCloseFn();
      }
    };

    var closedChecker = setInterval(function () {
      if (self._connection.readyState === 'closed' || closed || block === 5) {
        clearInterval(closedChecker);
        if (!closed) {
          closed = true;
          onCloseFn();
        }
      // After 5 seconds when state is "closed", it's actually closed on Firefox's end.
      } else if (self._connection.readyState === 'closing') {
        block++;
      }
    }, 1000);
  } else {
    self._connection.onclose = onCloseFn;
  }

  // Handle RTCDataChannel.onmessage event
  self._connection.onmessage = function (evt) {
    self._stats.messages.recv++;
    self._stats.bytes.recv += typeof evt.data === 'string' ? Utils.getStringByteLength(evt.data) :
      (evt.data.byteLength || evt.data.size || 0);
    self._emit('data', evt.data);
  };

  // Handle RTCDataChannel.onbufferedamountlow event
  self._connection.onbufferedamountlow = function () {
    self._emit('bufferedamountlow');
  };

  // Handle RTCDataChannel.onerror event
  self._connection.onerror = function (evt) {
    self._emit('error', evt.error || new Error('Datachannel error occurred.'));
  };
};

/**
 * Function to send data.
 */
Datachannel.prototype.send = function (data, useBufferControl) {
  var self = this;
  var dataSize = data.byteLength || data.length || data.size || 0;

  if (dataSize === 0) {
    self._emit('senderror', data, new Error('Data size is 0.'));
    return;
  }

  try {
    // For implementing reliable mode where direct data packets are sent without congestion control or ACKs control
    // For some reasons, RTCDataChannel.bufferedAmount returns 0 always in IE/Safari/Firefox.
    // See: https://jira.temasys.com.sg/browse/TWP-670
    if (useBufferControl) {
      var fullBufferThreshold = dataSize * (self._bufferControl.usePolling ?
        self._bufferControl.polling.blocks : self._bufferControl.bufferEvent.blocks);

      self._connection.bufferedAmountLowThreshold = fullBufferThreshold;

      // Fixes: https://jira.temasys.com.sg/browse/TWP-569
      if (parseInt(self._connection.bufferedAmount, 10) >= fullBufferThreshold) {
        // Wait for the next 250ms to check again
        if (self._bufferControl.usePolling) {
          setTimeout(function () {
            self.send(data, true);
          }, self._bufferControl.polling.interval);
        // Wait for RTCDataChannel.onbufferedamountlow event to triggered
        } else {
          self.once('bufferedamountlow', function () {
            self.send(data, true);
          });
        }
        return;
      }
    }

    self._connection.send(data);
    self._stats.messages.sent++;
    self._stats.bytes.recv += typeof data === 'string' ? Utils.getStringByteLength(data) :
      (data.byteLength || data.size || 0);

    if (useBufferControl) {
      self._bufferControl.messages.timestamp = Date.now();
      setTimeout(function () {
        self._emit('send', data);
      }, self._bufferControl.messages.flushTimeout);
      return;
    }

    self._emit('send', data);

  } catch (error) {
    self._emit('senderror', data, error);
  }
};

/**
 * Function to get current stats.
 */
Datachannel.prototype.getStats = function () {
  var self = this;

  return {
    readyState: self._connection.readyState,
    id: self._connection.id,
    label: self._connection.label,
    binaryType: self._connection.binaryType,
    bufferedAmount: parseInt(self._connection.bufferedAmount, 10) || 0,
    bufferedAmountLowThreshold: self._connection.bufferedAmountLowThreshold || 0,
    messagesSent: self._stats.messages.sent,
    messagesReceived: self._stats.messages.recv,
    bytesSent: self._stats.bytes.sent,
    bytesReceived: self._stats.bytes.recv
  };
};

/**
 * Function to close connection.
 */
Datachannel.prototype.close = function () {
  var self = this;

  if (['closed', 'closing'].indexOf(self._connection.readyState) === -1) {
    var now = Date.now();
    // Prevent the Datachannel from closing if there is an ongoing buffer sent
    // Use the polling interval here because the bufferedamountlow event is just an indication of
    // "ready" to send next packet because threshold is lower now
    // See Firefox case where it has to be really fast enough: https://bugzilla.mozilla.org/show_bug.cgi?id=933297
    // Fixes: https://jira.temasys.com.sg/browse/TWP-569
    if (parseInt(self._connection.bufferedAmount, 10) > 0) {
      setTimeout(function () {
        self.close();
      }, self._bufferControl.polling.interval);
      return;
    }

    // Prevent closing too fast if the packet has been sent within last than expected time interval
    if ((now - self._bufferControl.messages.timestamp) >= self._bufferControl.messages.finalFlushTimeout) {
      setTimeout(function () {
        self.close();
      }, (now - self._bufferControl.messages.timestamp) - self._bufferControl.messages.finalFlushTimeout);
      return;
    }

    self._emit('state', 'closing');
    self._connection.close();
  }
};
/**
 * Mixin that handles event listeners and subscription.
 */
function EventMixin (obj) {
  // Private properties
  obj._listeners = {
    once: [],
    on: []
  };

  /**
   * Function to subscribe to an event.
   */
  obj.on = function (eventName, fn) {
    if (!Array.isArray(obj._listeners.on[eventName])) {
      obj._listeners.on[eventName] = [];
    }

    obj._listeners.on[eventName].push(fn);
  };

  /**
   * Function to subscribe to an event once.
   */
  obj.once = function (eventName, fn, conditionFn, fireAlways) {
    if (!Array.isArray(obj._listeners.once[eventName])) {
      obj._listeners.once[eventName] = [];
    }

    obj._listeners.once[eventName].push([fn, conditionFn || function () { return true; }, fireAlways]);
  };

  /**
   * Function to subscribe to an event once.
   */
  obj.off = function (eventName, fn) {
    if (typeof eventName === 'string') {
      if (typeof fn === 'function') {
        // Unsubscribe .on() events
        if (Array.isArray(obj._listeners.on[eventName])) {
          var onIndex = 0;
          while (onIndex < obj._listeners.on[eventName].length) {
            if (obj._listeners.on[eventName][onIndex] === fn) {
              obj._listeners.on[eventName].splice(onIndex, 1);
              onIndex--;
            }
            onIndex++;
          }
        }
        // Unsubscribe .once() events
        if (Array.isArray(obj._listeners.once[eventName])) {
          var onceIndex = 0;
          while (onceIndex < obj._listeners.once[eventName].length) {
            if (obj._listeners.once[eventName][onceIndex][0] === fn) {
              obj._listeners.once[eventName].splice(onceIndex, 1);
              onceIndex--;
            }
            onceIndex++;
          }
        }
      } else {
        obj._listeners.on[eventName] = [];
        obj._listeners.once[eventName] = [];
      }
    } else {
      obj._listeners.on = {};
      obj._listeners.once = {};
    }
  };

  /**
   * Function to emit events.
   */
  obj._emit = function (eventName) {
    var params = Array.prototype.slice.call(arguments);
    // Remove the eventName parameter
    params.shift();

    // Trigger .on() event listeners
    if (Array.isArray(obj._listeners.on[eventName])) {
      var onIndex = 0;
      while (onIndex < obj._listeners.on[eventName].length) {
        obj._listeners.on[eventName][onIndex].apply(obj, params);
        onIndex++;
      }
    }

    // Trigger .once() event listeners
    if (Array.isArray(obj._listeners.once[eventName])) {
      var onceIndex = 0;
      while (onceIndex < obj._listeners.once[eventName].length) {
        if (obj._listeners.once[eventName][onceIndex][1].apply(obj, params)) {
          obj._listeners.once[eventName][onceIndex][0].apply(obj, params);
          // Remove event listener if met condition and not "fire always"
          if (obj._listeners.once[eventName][onceIndex][0][2] !== true) {
            obj._listeners.once[eventName].splice(onceIndex, 1);
            onceIndex--;
          }
        }
        onceIndex++;
      }
    }
  };
}
/**
 * Handles the Peer connection.
 * @class Peer
 * @param {JSON} options The options.
 * @param {}
 * @constructor
 * @for Skylink
 * @since 0.7.0
 */
function Peer (options, defaultOptions) {
}

/**
 * Function to send message to Peer.
 * 
 */
Peer.prototype.send = function (message, isP2P, fn) {
  var ref = this;
};

/**
 * Function to send message to P
 */

/**
 * Function to start Peer connection.
 */
Peer.prototype._connect = function () {

};

/**
 * Function to stop Peer connection.
 */
Peer.prototype._disconnect = function () {

};
/**
 * Handles the Room connection session.
 * @class Room
 * @param {JSON} options The options.
 * @param {String} options.appKey The App Key ID to connect to the App space to.
 * @param {String} [options.name] The Room name to connect to.
 *   The default is the App Key ID value.
 * @param {Boolean} [options.autoInit=true] The flag if {{#crossLink "Room/init:method"}}{{/crossLink}}
 *   should be automatically called the moment the Room class object is constructed.
 * @param {Boolean} [options.requireWebRTC=true] The flag if WebRTC functionalities are required mandatorily.
 *   If the browser or device does not support WebRTC functionalities, a normal Signaling server connection commences.
 * @constructor
 * @for Skylink
 * @since 0.7.0
 */
function Room (options) {
  options = options && typeof options === 'object' ? options : {};

  /**
   * The Auth (API) server domain.
   * @attribute server
   * @type String
   * @readOnly
   * @for Room
   * @since 0.7.0
   */
  this.server = 'api.temasys.io';

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
   * The Auth (API) server domain.
   * @attribute server
   * @type String
   * @readOnly
   * @for Room
   * @since 0.7.0
   */
  this.appKey = options.appKey && typeof options.appKey === 'string' ? options.appKey : null;

  /**
   * The Room name.
   * @attribute name
   * @type String
   * @readOnly
   * @for Room
   * @since 0.7.0
   */
  this.name = options.name && typeof options.name === 'string' ? options.name : this.appKey;

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
}

/**
 * The Room SM protocol version supports.
 * @attribute SM_PROTOCOL_VERSION
 * @type String
 * @readOnly
 * @final
 * @for Room
 * @since 0.7.0
 */
Room.prototype.SM_PROTOCOL_VERSION = '0.1.2.3';

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
 * The enum of Room dependency initialising states.
 * @attribute INIT_STATE_ENUM
 * @param {Number} LOADING The state when Room is initialising.
 * @param {Number} COMPLETED The state when Room has initialised.
 * @param {Number} ERROR The state when Room failed to initialise.
 * @type JSON
 * @readOnly
 * @final
 * @for Room
 * @since 0.7.0
 */
Room.prototype.INIT_STATE_ENUM = {
  LOADING: 0,
  COMPLETED: 1,
  ERROR: -1
};

/**
 * The enum of Room dependency initialising error codes.
 * @attribute INIT_ERROR_CODE_ENUM
 * @param {Number} NO_SOCKET_IO The error code when the required socket.io-client dependency is not loaded.
 * @param {Number} ADAPTER_NO_LOADED The error code when the required AdapterJS dependency is not loaded.
 * @param {Number} NO_XMLHTTPREQUEST_SUPPORT The error code when XMLHttpRequest or XDomainRequest API is not supported.
 * @param {Number} PLUGIN_NOT_AVAILABLE The error code when WebRTC plugin is not active.
 * @param {Number} NO_WEBRTC_SUPPORT The error code when WebRTC is not supported for browser or device.
 * @param {Number} PARSE_CODECS The error code when parsing of WebRTC supports fails.
 * @type JSON
 * @readOnly
 * @final
 * @for Room
 * @since 0.7.0
 */
Room.prototype.INIT_ERROR_CODE_ENUM = {
  NO_SOCKET_IO: 1,
  NO_XMLHTTPREQUEST_SUPPORT: 2,
  NO_WEBRTC_SUPPORT: 3,
  PLUGIN_NOT_AVAILABLE: 4,
  //NO_PATH: 4,
  ADAPTER_NO_LOADED: 7,
  PARSE_CODECS: 8
};

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

/**
 * Handles the socket connection to the Signaling server.
 * This class is only to be initialised from {{#crossLink "Room"}}{{/crossLink}} class.
 * @class Socket
 * @param {JSON} [options] The options.
 * @param {String} [options.server] The Signaling server domain to connect to.
 *   The default is based on the server domain provided by the Auth (API) server.
 * @param {Array} [options.ports] The list of Signaling server ports to connect to.
 *   Priority of port to use are based on first index order starting from `0`.
 *   The default is based on the list of ports provided by the Auth (API) server.
 * @param {Number} options.ports.#index The port number to use.
 * @param {String} [options.path] The Signaling server path to connect to.
 *   The default is `/socket.io`.
 * @param {String} [options.protocol] The Signaling server protocol to connect to.
 *   The default is the value of the current accessing `window.location.protocol`.
 * @param {Array} [options.transports] The list of socket transports to use.
 *   Priority of transport to use are based on first index order starting from `0`.
 *   The default is `("websocket", "polling")`, or `("polling")` only if Websocket transport is not supported.
 * @param {String} options.transports.#index The transport item to use.
 *   Available options are: `"websocket"` (Websocket) and `"polling"` (Polling).
 * @param {Boolean} [options.compressData] The flag if data sent to Signaling server should be compressed.
 *   The default is `false`.
 * @param {JSON} options.options The socket options for each transport type.
 * @param {JSON} options.options.#transport The socket options for transport type.
 *   The `#transport` key is either `"websocket"` (Websocket) or `"polling"` (Polling).
 * @param {Boolean} [options.options.#transport.reconnection] The flag if socket should attempt
 *   reconnection for each port and transport type.
 *   The default is `true`.
 * @param {Number} [options.options.#transport.reconnection] The flag if socket should attempt at least several
 *   reconnections for current port and transport type before switching to the next available port or transport.
 *   The defaults are `true` for both Websocket and Polling.
 * @param {Number} [options.options.#transport.reconnectionAttempts] The reconnection attempts to
 *   take if reconnection is enabled for each port and transport type.
 *   The defaults are `2` for Websocket and `4` for Polling. The maximum is `5`.
 * @param {Number} [options.options.#transport.reconnectionDelay] The number of miliseconds to initially
 *   wait before attempting a new reconnection. This is affected by the randomization factor range.
 *   The defaults are `5000` for Websocket and `2000` for Polling.
 * @param {Number} [options.options.#transport.reconnectionDelayMax] The maximum number of miliseconds to
 *   wait between reconnections. This increases the reconnection delay for randomization factor range
 *   before waiting to start a reconnection.
 *   The defaults are `2000` for Websocket and `1000` for Polling.
 * @param {Number} [options.options.#transport.randomizationFactor] The randomization
 *   factor range from `0` to `1`.
 *   The defaults are `0.5` for both Websocket and Polling.
 * @param {Number} [options.options.#transport.timeout] The timeout in miliseconds to consider
 *   that the connection timed out.
 *   The defaults are `20000` for both Websocket and Polling.
 * @constructor
 * @for Skylink
 * @since 0.7.0
 */
function Socket (options, defaultOptions) {
  options = options && typeof options === 'object' ? options : {};

  /**
   * The Signaling server domain.
   * @attribute server
   * @type String
   * @readOnly
   * @for Socket
   * @since 0.7.0
   */
  this.server = options.server && typeof options.server === 'string' ? options.server :
    (defaultOptions.server && typeof defaultOptions.server === 'string' ?
    defaultOptions.server : 'signaling.temasys.io');

  /**
   * The Signaling server path.
   * @attribute path
   * @type String
   * @readOnly
   * @for Socket
   * @since 0.7.0
   */
  this.path = options.path && typeof options.path === 'string' ? options.path : '/socket.io';

  /**
   * The Signaling server protocol.
   * @attribute protocol
   * @type String
   * @readOnly
   * @for Socket
   * @since 0.7.0
   */
  this.protocol = options.protocol && typeof options.protocol === 'string' && options.protocol.length > 2 &&
    options.protocol.indexOf(':') === (options.protocol.length - 1) ? options.protocol : window.location.protocol;

  /**
   * The flag if messages sent to the Signaling server are compressed.
   * @attribute compressed
   * @type Boolean
   * @readOnly
   * @for Socket
   * @since 0.7.0
   */
  this.compressed = options.compressData === true;

  /**
   * The current socket connection status.
   * @attribute current
   * @type JSON
   * @param {String} state The current socket connection state.
   *   References the `STATES` enum attribute.
   * @param {Boolean} connected The flag if socket connection is connected.
   * @param {Number} reconnectionAttempts The current number of reconnection attempts
   *   made for the current port and transport used.
   * @param {Number} fallbackAttempts The current number of fallback attempts
   *   made for each available ports and transports.
   * @param {Number} port The current port to connect used.
   * @param {String} transport The current socket transport used.
   * @param {JSON} options The current socket.io-client options used.
   * @readOnly
   * @for Socket
   * @since 0.7.0
   */
  this.current = {
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
   * Event triggered when socket connection state has changed.
   * @event state
   * @param {String} state The current socket connection state.
   *   References the {{#crossLink "Socket/STATE_ENUM:attribute"}}{{/crossLink}} enum attribute.
   * @param {Error} error The error object.
   *   This is defined when `state` value is `STATE_ENUM.RECONNECT_FAILED`,
   *   `STATE_ENUM.CONNECT_ERROR` and `STATE_ENUM.CONNECT_TIMEOUT`.
   * @param {JSON} current The current socket connection status.
   * @param {Number} current.reconnectionAttempts The current reconnection attempts for the current port and transport used.
   * @param {Number} current.port The current port used.
   * @param {String} current.transport The current transport used.
   * @for Socket
   * @since 0.7.0
   */
  /**
   * Event triggered when socket connection sends or receives a message.
   * @event message
   * @param {JSON} message The socket message received or sent.
   * @param {Error} [error] The error object.
   *   This is defined when message failed to send or parse when received.
   * @param {Boolean} isSelf The flag if message is sent from self or not.
   * @for Socket
   * @since 0.7.0
   */
  /**
   * Event triggered when there are exceptions thrown in this event handlers.
   * @event domError
   * @param {Error} error The error object.
   * @for Socket
   * @since 0.7.0
   */
  /**
   * Event triggered when socket connection receives and sends responses to Signaling server for keep-alive.
   * @event response
   * @param {String} state The current socket connection response state.
   *   References the {{#crossLink "Socket/RESPONSE_ENUM:attribute"}}{{/crossLink}} enum attribute.
   * @param {Number} timestamp The current timestamp in miliseconds.
   * @param {Number} [latency] The current latency in miliseconds from receiving
   *   the `RESPONSE.PONG` after sending out a `RESPONSE_ENUM.PING`.
   * @for Socket
   * @since 0.7.0
   */
  (function (ref) {
    /**
     * Function to subscribe to an event.
     * @method on
     * @param {String} event The event to subscribe to once.
     * @param {Function} callback The callback listener function.
     * @for Socket
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
     * @for Socket
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
     * @for Socket
     * @since 0.7.0
     */
    ref.off = ref._event.off;

    // Catch errors to prevent issues for socket connection
    ref._event.catch(function (error) {
      ref._event.emit('domError', error);
    });
  })(this);
}

/**
 * The enum of socket connection states.
 * @attribute STATE_ENUM
 * @param {String} RECONNECT_FAILED The state when socket connection failed to reconnect after
 *   the several specified attempts configured for the current port and transport used.
 *   At this state, the socket connection will fallback to the next available port or transport.
 * @param {String} RECONNECT_ERROR The state when socket connection failed to reconnect for the
 *   current attempt.
 * @param {String} RECONNECT_ATTEMPT The state when socket connection is attempting to reconnect.
 * @param {String} RECONNECTING The state when socket connection is reconnecting.
 * @param {String} RECONNECT The state when socket connection has reconnected successfully.
 * @param {String} CONNECT_TIMEOUT The state when socket connection has failed to connect after
 *   the specified timeout configured for the current port and transport.
 *   At this state, the socket connection will attempt to reconnect a few more times if reconnection is enabled.
 * @param {String} CONNECT_ERROR The state when socket connection has errors and disconnects.
 * @param {String} CONNECT The state when socket connection has connected successfully.
 * @param {String} DISCONNECT The state when socket connection has been disconnected.
 * @param {String} ABORT The state when socket connection has aborted from attempting any available
 *   ports or transports or reconnection as there is none left to reconnect or fallback with.
 * @param {String} CONSTRUCT_ERROR The state when socket connection failed to construct.
 * @type JSON
 * @for Socket
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
 * The enum of socket response states.
 * @attribute RESPONSE_ENUM
 * @param {String} PING The state when ping packet is written out to Signaling server.
 * @param {String} PONG The state when pong packet response is received from Signaling server.
 * @type JSON
 * @for Socket
 * @since 0.7.0
 */
Socket.prototype.RESPONSE_ENUM = {
  PING: 'ping',
  PONG: 'pong'
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
/**
 * Module that handles utility functionalities.
 * @class Utils
 * @for Skylink
 * @since 0.7.0
 */
var Utils = {
  /**
   * Function that loops through an Array or JSON object.
   * @method forEach
   * @param {Array|JSON} object The object.
   * @param {Function} The callback function.
   * @for Utils
   * @since 0.7.0
   */
  forEach: function (obj, fn) {
    if (Array.isArray(obj)) {
      var index = 0;
      while (index < obj.length) {
        var res = fn(obj[index]);
        if (res === true) {
          break;
        } else if (typeof res === 'number') {
          index += res;
        }
        index++;
      }
    } else if (obj && typeof obj === 'object') {
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          var res = fn(obj[index]);
          if (res === true) {
            break;
          }
        }
      }
    }
  },

  /**
   * Function that creates an event emitter manager to handle event triggers and subscription.
   * @method createEventManager
   * @return {JSON} Returns a list of event tools.
   * @for Utils
   * @since 0.7.0
   */
  createEventManager: function () {
    var listeners = {
      once: [],
      on: []
    };
    var catcher = {
      fn: null,
      fnHandle: function (error) {
        if (typeof catcher.fn === 'function') {
          return catcher.fn(error);
        }
        throw error;
      }
    };

    return {
      /**
       * Function to subscribe to an event.
       * @method createEventManager.on
       * @param {String} event The event to subscribe to.
       * @param {Function} callback The callback listener function.
       * @for Utils
       * @since 0.7.0
       */
      on: function (eventName, fn) {
        if (typeof fn !== 'function') {
          return catcher.fnHandle(new Error('Please provide a valid callback'));
        }

        if (!Array.isArray(listeners.on[eventName])) {
          listeners.on[eventName] = [];
        }

        listeners.on[eventName].push(fn);
      },

      /**
       * Function to subscribe to an event once.
       * @method createEventManager.once
       * @param {String} event The event to subscribe to once.
       * @param {Function} callback The callback listener function.
       * @param {Function} [condition] The condition function that is called when
       *   event is triggered. If condition is met (when function returns `true`), the
       *   callback listener function is triggered.
       *   The defaults is `function () { return true; }`.
       * @param {Boolean} [fireAlways] The flag if callback listener function should always
       *   be triggered regardless as long as condition function is met.
       *   The defaults is `false`.
       * @for Utils
       * @since 0.7.0
       */
      once: function (eventName, fn, conditionFn, fireAlways) {
        if (typeof fn !== 'function') {
          return catcher.fnHandle(new Error('Please provide a valid callback'));
        }

        if (!Array.isArray(listeners.once[eventName])) {
          listeners.once[eventName] = [];
        }

        listeners.once[eventName].push([fn, typeof conditionFn === 'function' ?
          conditionFn : function () { return true; }, fireAlways === true]);
      },

      /**
       * Function to unsubscribe to an event.
       * @method createEventManager.off
       * @param {String} [event] The event to unsubscribe.
       *   When not provided, it will unsubscribe all event callback listener functions.
       * @param {Function} [callback] The callback listener function to unsubscribe only.
       *   When not provided, it will unsubscribe all callback listener functions subscribed to the event.
       * @for Utils
       * @since 0.7.0
       */
      off: function (eventName, fn) {
        if (typeof eventName === 'string') {
          if (typeof fn === 'function') {
            // Unsubscribe `on()` event handlers
            if (Array.isArray(listeners.on[eventName])) {
              Utils.forEach(listeners.on[eventName], function (fnItem, i) {
                if (fnItem === fn) {
                  listeners.on[eventName].splice(i, 1);
                  return -1;
                }
              });
            }
            // Unsubscribe `once()` event handlers
            if (Array.isArray(listeners.once[eventName])) {
              Utils.forEach(listeners.once[eventName], function (fnItem, i) {
                if (fnItem[0] === fn) {
                  listeners.once[eventName].splice(i, 1);
                  return -1;
                }
              });
            }
          } else {
            listeners.on[eventName] = [];
            listeners.once[eventName] = [];
          }
        } else {
          listeners.on = {};
          listeners.once = {};
        }
      },

      /**
       * Function that when provided catches errors instead of throwing them during event subscription or triggers.
       * @method createEventManager.catch
       * @param {Function} fn The listener to errors during trigger.
       * @param {Error} fn.error The error object caught.
       * @for Utils
       * @since 0.7.0
       */
      catch: function (fn) {
        catcher.fn = typeof fn === 'function' ? fn : null;
      },

      /**
       * Function to trigger an event.
       * @method createEventManager.emit
       * @param {String} event The event to trigger.
       *   The subsequent parameters are the event payload parameters.
       * @for Utils
       * @since 0.7.0
       */
      emit: function (eventName) {
        try {
          var params = Array.prototype.slice.call(arguments);
          params.shift();

          // Trigger `on()` event handler
          if (Array.isArray(listeners.on[eventName])) {
            Utils.forEach(listeners.on[eventName], function (fnItem) {
              fnItem.apply(this, params);
            });
          }
          // Trigger `once()` event handler
          if (Array.isArray(listeners.once[eventName])) {
            Utils.forEach(listeners.once[eventName], function (fnItem, i) {
              if (fnItem[1].apply(this, params)) {
                fnItem[0].apply(this, params);
                // Check if `fireAlways`
                if (fnItem[2] !== true) {
                  listeners.once[eventName].splice(i, 1);
                  return -1;
                }
              }
            });
          }
        } catch (error) {
          catcher.fnHandle(error);
        }
      }
    };
  },

  /**
   * Function that gets byte length of string.
   */
  getStringByteLength: function (str) {
    // Follow RFC3629 (where UTF-8 characters are at most 4-bytes long)
    var s = str.length;
    for (var i = str.length - 1; i >= 0; i--) {
      var code = str.charCodeAt(i);
      if (code > 0x7f && code <= 0x7ff) {
        s++;
      } else if (code > 0x7ff && code <= 0xffff) {
        s+=2;
      }
      if (code >= 0xDC00 && code <= 0xDFFF) {
        i--;
      }
    }
    return s;
  },


};
  
  

  if(typeof exports !== 'undefined') {
    module.exports = {
      Skylink: Skylink,
      SkylinkLogs: SkylinkLogs,
      Temasys: {
        Room: Room,
        Utils: Utils
      }
    };
  } else {
    globals.Skylink = Skylink;
    globals.SkylinkLogs = SkylinkLogs;
    globals.Temasys = {
      Room: Room,
      Utils: Utils
    };
  }

})(this);