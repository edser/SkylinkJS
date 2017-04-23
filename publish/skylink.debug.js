/*! skylinkjs - v0.6.19 - Mon Apr 24 2017 00:52:31 GMT+0800 (SGT) */
(function (_globals) {

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

  var Temasys = {};

  /**
 * Handles the Peer Datachannel connection.
 * @class Temasys.Datachannel
 * @constructor
 * @private
 * @for Temasys
 * @since 0.7.0
 */
function Datachannel (channel, peerId, propertyId) {
  
  /**
   * The Datachannel ID.
   * @attribute id
   * @type String
   * @readOnly
   * @for Temasys.Datachannel
   * @since 0.7.0
   */
  this.id = channel.label;

  /**
   * The Datachannel type.
   * - See {{#crossLink "Temasys.Datachannel/TYPE_ENUM:attribute"}}{{/crossLink}} for reference.
   * @attribute type
   * @type String
   * @readOnly
   * @for Temasys.Datachannel
   * @since 0.7.0
   */
  this.type = propertyId === 'main' ? this.TYPE_ENUM.MESSAGING : this.TYPE_ENUM.DATA;

  /**
   * The Datachannel current states.
   * @attribute $current
   * @param {String} state The current Datachannel connection state.
   * @param {Boolean} connected The flag if Datachannel is connected.
   * @param {String} streamId The current Datatransfer streaming session ID.
   * @param {String} transferId The current Datatransfer transfer session ID.
   * @type JSON
   * @readOnly
   * @for Temasys.Datachannel
   * @since 0.7.0
   */
  this.$current = {
    state: null,
    connected: false,
    streamId: null,
    transferId: null
  };
  
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

  /**
   * Event triggered when Datachannel connection state has been changed.
   * @event stateChange
   * @param {String} state The current Datachannel connection state.
   * - See {{#crossLink "Temasys.Datachannel/STATE_ENUM:attribute"}}{{/crossLink}} for reference.
   * @for Temasys.Datachannel
   * @since 0.7.0
   */
  /**
   * Event triggered when Datachannel connection has encountered errors.
   * @event error
   * @param {Error} error The error object.
   * @for Temasys.Datachannel
   * @since 0.7.0
   */
  /**
   * Event triggered when Datachannel connection buffered amount threshold is low.
   * @event bufferedAmountLow
   * @param {Number} bufferedAmount The current buffered amount in bytes.
   * @param {Number} bufferedAmountLowThreshold The current buffered amount threshold set in bytes.
   * @for Temasys.Datachannel
   * @since 0.7.0
   */
  /**
   * Event triggered when Datachannel connection sends or receives data.
   * @event data
   * @param {JSON|Blob} data The data.
   * @param {Boolean} isSelf The flag if data is sent from self.
   * @param {Error} [error] The error object.
   * - This is defined when data failed to send or parse received data.
   * @for Temasys.Datachannel
   * @since 0.7.0
   */
  /**
   * Event triggered when there are exceptions thrown in this event handlers.
   * @event domError
   * @param {Error} error The error object.
   * @for Temasys.Datachannel
   * @since 0.7.0
   */
  /**
   * Event triggered when {{#crossLink "Temasys.Datachannel/getStats:method"}}{{/crossLink}} state has changed.
   * @event getStatsStateChange
   * @param {String} state The current stats retrieval state.
   * - See {{#crossLink "Temasys.Datachannel/GET_STATS_STATE_ENUM:attribute"}}{{/crossLink}} for reference.
   * @param {JSON} [stats] The stats.
   * - This is defined when `state` is `SUCCESS`.
   * @param {String} stats.id The native `RTCDataChannel` object `.id` property.
   * @param {String} stats.label The native `RTCDataChannel` object `.label` property.
   * @param {String} stats.binaryType The native `RTCDataChannel` object `.binaryType` property.
   * - This indicates the type of native object type it uses to send and pack received binary data.
   * @param {Number} stats.bufferedAmount The current Datachannel connection buffered amount in bytes.
   * @param {Number} stats.bufferedAmountLowThreshold The current Datachannel connection
   *   buffered amount low threshold in bytes.
   * @param {JSON} stats.messages The messages stats.
   * @param {Number} stats.messages.sent The number of messages sent from this Datachannel connection.
   * @param {Number} stats.messages.received The number of messages received from this Datachannel connection.
   * @param {JSON} stats.bytes The bytes stats.
   * @param {Number} stats.bytes.sent The number of bytes sent from this Datachannel connection.
   * @param {Number} stats.bytes.received The number of bytes received from this Datachannel connection.
   * @param {JSON} stats.bufferControlOptions The current Datachannel connection buffer control settings.
   * @param {String} stats.bufferControlOptions.method The current Datachannel connection buffer control method.
   * - Available methods are: `"polling"` (Polling) and `"bufferedAmount"` (Buffer amount threshold).
   * @param {Number} stats.bufferControlOptions.block The current Datachannel connection buffer control full threshold block.
   * @param {Number} [stats.bufferControlOptions.interval] The current Datachannel connection buffer control polling interval.
   * - This is defined only for Polling method.
   * @param {Number} stats.bufferControlOptions.flushTimeout The current Datachannel connection timeout to consider that
   *   the packet has been sent.
   * @param {Number} stats.bufferControlOptions.finalFlushTimeout The current Datachannel connection timeout
   *   to consider that all the packets has been sent before the Datachannel connection closes explicitly.
   * @param {Error} [error] The error object.
   * - This is defined when `state` is `FAILED`.
   * @for Temasys.Datachannel
   * @since 0.7.0
   */
  /**
   * Event triggered when there are exceptions thrown in this event handlers.
   * @event domError
   * @param {Error} error The error object.
   * @for Temasys.Datachannel
   * @since 0.7.0
   */
}

/**
 * The enum of Datachannel connection states.
 * @attribute STATE_ENUM
 * @param {String} CONNECTING The state when Datachannel connection is connecting.
 * @param {String} OPEN The state when Datachannel connection has opened.
 * @param {String} CLOSING The state when Datachannel connection is closing.
 * @param {String} CLOSED The state when Datachannel connection has closed.
 * @readOnly
 * @final
 * @for Temasys.Datachannel
 * @since 0.7.0
 */
Datachannel.prototype.STATE_ENUM = {
	CONNECTING: 'connecting',
  OPEN: 'open',
  CLOSING: 'closing',
  CLOSED: 'closed'
};

/**
 * The enum of {{#crossLink "Temasys.Datachannel/getStats:method"}}{{/crossLink}} states.
 * @attribute GET_STATS_STATE_ENUM
 * @param {String} LOADING The state when `getStats()` is retrieving stats.
 * @param {String} SUCCESS The state when `getStats()` has retrieved stats successfully.
 * @param {String} FAILED The state when `getStats()` has failed to retrieve stats.
 * @readOnly
 * @final
 * @for Temasys.Datachannel
 * @since 0.7.0
 */
Datachannel.prototype.GET_STATS_STATE_ENUM = {
	LOADING: 'loading',
  SUCCESS: 'success',
  FAILED: 'failed'
};

/**
 * Function to retrieve Datachannel connection stats.
 * @method getStats
 * @return {Promise} The Promise for function request completion.
 * @example
 *   channel.getStats().then(function (stats) {
 *     console.log("Received stats ->", stats);
 *   }).catch(function (error) {
 *     console.error("Received error ->", error);
 *   });
 * @for Temasys.Datachannel
 * @since 0.7.0
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
 * Handles the Datatransfer session.
 * @class Temasys.Datatransfer
 * 
 */
Temasys.Datatransfer = function () {
};


/**
 * Handles the SDK debugger.
 * @class Temasys.Debugger
 * @since 0.7.0
 * @typedef module
 */
var _log;

Temasys.Debugger = new (function () {
  var ref = this;
  var refLogs = [];

  /**
   * The enum of debugger log levels.
   * @attribute LOG_LEVEL_ENUM
   * @param {Number} NONE The level to print no logs.
   * @param {Number} ERROR The level to print Web `console.error()` logs.
   * @param {Number} WARN The level to print Web `console.error()`, `console.warn()` logs.
   * @param {Number} INFO The level to print Web `console.error()`, `console.warn()`, `console.info()` logs.
   * @param {Number} LOG The level to print Web `console.error()`, `console.warn()`,
   *   `console.info()`, `console.log()` logs.
   * @param {Number} DEBUG The level to print Web `console.error()`, `console.warn()`
   *   `console.info()`, `console.log()`, `console.debug()` logs.
   * @type JSON
   * @final
   * @readOnly
   * @for Temasys.Debugger
   * @since 0.7.0
   */
  ref.LOG_LEVEL_ENUM = {
    // Brought over values from Skylink object LOG_LEVEL
    NONE: -1,
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    LOG: 3,
    DEBUG: 4
  };

  // Stores the debugger settings.
  ref._settings = {
    global: {
      level: ref.LOG_LEVEL_ENUM.ERROR,
      traceLogs: false,
      cacheLogs: false,
      printTimestamp: false,
      printComponentId: false
    },
    components: {}
  };

  // Stores the stats.
  ref._stats = {
    total: {
      debug: 0,
      log: 0,
      info: 0,
      warn: 0,
      error: 0,
      exceptions: []
    },
    components: {}
  };

  // Stores the listener functions.
  ref._listeners = {
    catch: null,
    watch: null,
    components: []
  };

  /**
   * Function that sets the debugger configuration.
   * @method setConfig
   * @param {JSON} options The options.
   * - When provided as `null` with `componentId` provided, it unsets the specific component
   *   configuration to use the global configuration.
   * @param {Number} [options.level] The log level.
   * - When not provided, the value is set to `LOG_LEVEL_ENUM.ERROR`.
   * - This references the `LOG_LEVEL_ENUM` constant.
   * @param {Boolean} [options.traceLogs=false] The flag if Web console logs should be traced.
   * - This uses the `console.trace` function when available.
   * @param {Boolean} [options.cacheLogs=false] The flag if Web console logs should be cached for
   *   fetching in `getCachedLogs()` method.
   * @param {Boolean} [options.printTimestamp=false] The flag if timestamps (ISO-8601) should be
   *   printed on Web console logs.
   * @param {Boolean} [options.printComponentId=false] The flag if component ID should be
   *   printed on Web console logs.
   * @param {String} [componentId] The component ID.
   * - When provided, it configures the configuration for the specific component.
   * @example
   * // Example 1: Set global configuration
   * Temasys.Debugger.setConfig({
   *   level: Temasys.Debugger.LOG_LEVEL_ENUM.DEBUG
   * });
   * 
   * // Example 2: Set component configuration
   * Temasys.Debugger.setConfig({
   *   level: Temasys.Debugger.LOG_LEVEL_ENUM.LOG
   * }, componentId);
   * 
   * // Example 3: Unset component configuration and use global configuration instead for component
   * Temasys.Debugger.setConfig(null, componentId);
   * @for Temasys.Debugger
   * @since 0.7.0
   */
  ref.setConfig = function (options, componentId) {
    var useSettings = {
      level: ref.LOG_LEVEL_ENUM.ERROR,
      traceLogs: false,
      cacheLogs: false,
      printTimestamp: false,
      printComponentId: false
    };

    if (options && typeof options === 'object') {
      useSettings.level = typeof options.level === 'number' && options.level <= 4 &&
        options.level >= -1 ? options.level : useSettings.level;
      useSettings.traceLogs = typeof options.traceLogs === 'boolean' ?
        options.traceLogs : useSettings.traceLogs;
      useSettings.cacheLogs = typeof options.cacheLogs === 'boolean' ?
        options.cacheLogs : useSettings.cacheLogs;
      useSettings.printTimestamp = typeof options.printTimestamp === 'boolean' ?
        options.printTimestamp : useSettings.printTimestamp;
      useSettings.printComponentId = typeof options.printComponentId === 'boolean' ?
        options.printComponentId : useSettings.printComponentId;
    }

    // Set the component configuration : config(options, componentId)
    if (componentId && typeof componentId === 'string') {
      // Unset the component configuration : config(null, componentId)
      if (options === null) {
        delete ref._settings.components[componentId];
      } else {
        ref._settings.components[componentId] = useSettings;
      }
    // Set the global configuration : config(options)
    } else {
      ref._settings.global = useSettings;
    }
  };

  /**
   * Function that returns the debugger configuration.
   * @method getConfig
   * @param {String} [componentId] The component ID.
   * - When provided, it returns the configuration only for the specific component.
   * @param {JSON} return The configured options.
   * - Object signature matches the `options` parameter in `setConfig()` method.
   * @return {JSON}
   * @example
   * // Example 1: Get global configuration
   * var config = Temasys.Debugger.getConfig();
   * 
   * // Example 2: Get only component configuration
   * var config = Temasys.Debugger.getConfig(componentId);
   * @for Temasys.Debugger
   * @since 0.7.0
   */
  ref.getConfig = function (componentId) {
    var useSettings = componentId && typeof componentId === 'string' && ref._settings.components[componentId] ?
      ref._settings.components[componentId] : ref._settings.global;
    return {
      level: useSettings.level,
      traceLogs: useSettings.traceLogs,
      cacheLogs: useSettings.cacheLogs,
      printTimestamp: useSettings.printTimestamp,
      printComponentId: useSettings.printComponentId
    };
  };

  /**
   * Function that returns the total debugger stats.
   * @method getStats
   * @param {String} [componentId] The component ID.
   * - When provided, it returns the stats only for the specific component.
   * @param {JSON} return The stats.
   * @param {Number} return.debug The total "debug" logs received.
   * @param {Number} return.log The total number of "log" logs received.
   * @param {Number} return.info The total number of "info" logs received.
   * @param {Number} return.warn The total number of "warn" logs received.
   * @param {Number} return.error The total number of "error" logs received.
   * @param {Array} return.exceptions The total exceptions caught.
   * - Note that for tabulation for this, it this requires `catchExceptions()` to be configured.
   * - Each array item is an `Error` object.
   * @return {JSON}
   * @example
   * // Example 1: Get total stats
   * var stats = Temasys.Debugger.getStats();
   * 
   * // Example 2: Get only component total stats
   * var stats = Temasys.Debugger.getStats(componentId);
   * @for Temasys.Debugger
   * @since 0.7.0
   */
  ref.getStats = function (componentId) {
    return componentId && typeof componentId === 'string' && ref._stats.components[componentId] ?
      ref._stats.components[componentId] : ref._stats.total;
  };

  /**
   * Function that returns the list of components.
   * @method getComponents
   * @param {Array} return The list of components.
   * @return {Array}
   * @example
   * // Example: Get the list of components
   * var components = Temasys.Debugger.getComponents();
   * @for Temasys.Debugger
   * @since 0.7.0
   */
  ref.getComponents = function () {
    return Object.keys(ref._stats.components);
  };

  /**
   * Function that watches for logs logged.
   * @method watchForLogs
   * @param {Function} [fn] The callback function.
   * - When not provided as `Function`, it unsubscribes any existing configured callback function.
   * @param {Array} fn.log The log item.
   * - Object signature matches the returned log item in `getCachedLogs()` method.
   * @param {String} fn.componentId The component ID.
   * @example
   * // Example 1: Watch for logs
   * Temasys.Debugger.watchForLogs(function (log, componentId) {
   *   ..
   * });
   * 
   * // Example 2: Unwatch for logs
   * Temasys.Debugger.watchForLogs();
   * @for Temasys.Debugger
   * @since 0.7.0
   */
  ref.watchForLogs = function (fn) {
    ref._listeners.watch = typeof fn === 'function' ? fn : null;
  };

  /**
   * Function that catches the SDK exceptions.
   * @method catchExceptions
   * @param {Function} [fn] The callback function.
   * - When not provided as `Function`, it unsubscribes any existing configured callback function.
   * @param {Error} fn.error The error object caught.
   * @param {String} fn.componentId The component ID.
   * @example
   * // Example 1: Catch SDK exceptions
   * Temasys.Debugger.catchExceptions(function (error, componentId) {
   *   ..
   * });
   * 
   * // Example 2: Uncatch SDK exceptions
   * Temasys.Debugger.catchExceptions();
   * @for Temasys.Debugger
   * @since 0.7.0
   */
  ref.catchExceptions = function (fn) {
    ref._listeners.catch = typeof fn === 'function' ? function (componentId, error) {
      ref._stats.components[componentId].exceptions.push(error);
      ref._stats.total.exceptions.push(error);
      fn(error, componentId);
    } : null;

    Temasys.Utils.forEach(ref._listeners.components, function (fnComponentItem) {
      fnComponentItem(ref._listeners.catch);
    });
  };

  /**
   * Function that gets the cached logs.
   * @method getCachedLogs
   * @param {JSON} [options] The options.
   * - When provided, this may cause performance issues when cached logs size is huge.
   * @param {String} [options.componentId] The component ID of logs to return only.
   * @param {Number} [options.level] The specific level of logs to return only.
   * - This references the `LOG_LEVEL_ENUM` constant.
   * @param {Array} return The array of log items.
   * @param {Array} return._index The log item.
   * @param {String} return._index._0 The log item level property key.
   * - This references the `LOG_LEVEL_ENUM` constant.
   * @param {String} return._index._1 The log item component ID.
   * @param {String} return._index._2 The log item timestamp (in ISO-8601 format).
   * @param {String} return._index._3 The log item message.
   * @param {Array} [return._index._4] The log item meta data.
   * @param {Number} return._index._5 The log item performance timestamp.
   * - This is formed with `performance.now()` API.
   * @return {Array}
   * @example
   * // Example 1: Get cached logs for specific component and log level
   * var debugLogsForComponentA = Temasys.Debugger.getCachedLogs({
   *   level: Temasys.Debugger.LOG_LEVEL.DEBUG,
   *   componentId: "A"
   * });
   * 
   * // Example 2: Get cached logs for specific log level only
   * var debugLogsForLogError = Temasys.Debugger.getCachedLogs({
   *   level: Temasys.Debugger.LOG_LEVEL.ERROR
   * });
   *
   * // Example 3: Get cached logs for specific component only
   * var debugLogsForComponentB = Temasys.Debugger.getCachedLogs({
   *   componentId: "B"
   * });
   *
   * // Example 4: Get cached logs for all
   * var debugLogsForAll = Temasys.Debugger.getCachedLogs();
   * @for Temasys.Debugger
   * @since 0.7.0
   */
  ref.getCachedLogs = function (options) {
    var result = [];

    if (ref._fnLoop(options, function (logItem, index) {
      result.push(logItem);
    })) {
      return refLogs;
    }

    return result;
  };

  /**
   * Function that clears the cached logs.
   * @method clearCachedLogs
   * @param {JSON} [options] The options.
   * - When `options.componentId` and `options.level` is not provided, it clears all the cached logs.
   * @param {String} [options.componentId] The component ID of logs to clear only.
   * @param {Number} [options.level] The specific level of logs to clear only.
   * - This references the `LOG_LEVEL_ENUM` constant.
   * @example
   * // Example 1: Clear cached logs for specific component and log level
   * Temasys.Debugger.clearCachedLogs({
   *   level: Temasys.Debugger.LOG_LEVEL.LOG,
   *   componentId: "A"
   * });
   * 
   * // Example 2: Clear cached logs for specific log level only
   * Temasys.Debugger.clearCachedLogs({
   *   level: Temasys.Debugger.LOG_LEVEL.DEBUG
   * });
   *
   * // Example 3: Clear cached logs for specific component only
   * Temasys.Debugger.clearCachedLogs({
   *   componentId: "B"
   * });
   *
   * // Example 4: Clear cached logs for all
   * Temasys.Debugger.clearCachedLogs();
   * @for Temasys.Debugger
   * @since 0.7.0
   */
  ref.clearCachedLogs = function (options) {
    if (ref._fnLoop(options, function (logItem, index) {
      refLogs.splice(index, 1);
      return 0;
    })) {
      refLogs = [];
    }
  };

  /**
   * Function that prints the cached logs.
   * @method printCachedLogs
   * @param {JSON} [options] The options.
   * @param {String} [options.componentId] The component ID of logs to print only.
   * @param {Number} [options.level] The specific level of logs to print only.
   * - This references the `LOG_LEVEL_ENUM` constant.
   * @example
   * // Example 1: Print cached logs for specific component and log level
   * Temasys.Debugger.printCachedLogs({
   *   level: Temasys.Debugger.LOG_LEVEL.ERROR,
   *   componentId: "A"
   * });
   * 
   * // Example 2: Print cached logs for specific log level only
   * Temasys.Debugger.printCachedLogs({
   *   level: Temasys.Debugger.LOG_LEVEL.DEBUG
   * });
   *
   * // Example 3: Print cached logs for specific component only
   * Temasys.Debugger.printCachedLogs({
   *   componentId: "B"
   * });
   *
   * // Example 4: Print cached logs for all
   * Temasys.Debugger.printCachedLogs();
   * @for Temasys.Debugger
   * @since 0.7.0
   */
  ref.printCachedLogs = function (options) {
    var fn = function (logItem, index) {
      var method = typeof console[logItem[0].toLowerCase()] !== 'function' ? 'log' : logItem[0].toLowerCase();
      console[method].apply(console, [logItem[3]].concat(logItem[4]));
    };

    if (ref._fnLoop(options, fn)) {
      Temasys.Utils.forEach(refLogs, fn);
    }
  };

  /**
   * Function that checks the `options` provided and loops the log items. 
   * - Returns `true` if there's not a need to loop.
   */
  ref._fnLoop = function (options, fn) {
    // Check if `options` is defined, and return is following checks fails
    if (!(options && typeof options === 'object' &&
    // Check also if `options.componentId` is defined
      ((options.componentId && typeof options.componentId === 'string') ||
    // Check also if `options.level` is defined
      (typeof options.level === 'number' && options.level <= 4 && options.level >= -1)))) {
      return true;
    }

    Temasys.Utils.forEach(refLogs, function (logItem, index) {
      // Check if `options.level` is defined, valid and matches.
      if ((typeof options.level === 'number' ? ref.LOG_LEVEL_ENUM[logItem[0]] === options.level : true) &&
      // Check if `options.componentId` is defined, valid and matches.
        (options.componentId && typeof options.componentId ? options.componentId === logItem[1] : true)) {
        return fn(logItem, index);
      }
    });
  };

  /**
   * Handles the global log methods for all components.
   */
  _log = (function (fnLog) {
    return {
      /**
       * Function to log "debug" level message.
       */
      debug: function (componentId, message) {
        fnLog('DEBUG', Array.prototype.slice.call(arguments));
      },

      /**
       * Function to log "log" level message.
       */
      log: function (componentId, message) {
        fnLog('LOG', Array.prototype.slice.call(arguments));
      },

      /**
       * Function to log "info" level message.
       */
      info: function (componentId, message) {
        fnLog('INFO', Array.prototype.slice.call(arguments));
      },

      /**
       * Function to log "warn" level message.
       */
      warn: function (componentId, message) {
        fnLog('WARN', Array.prototype.slice.call(arguments));
      },

      /**
       * Function to log "error" level message.
       */
      error: function (componentId, message) {
        fnLog('ERROR', Array.prototype.slice.call(arguments));
      },

      /**
       * Function to configure component.
       * - Returns the component ID.
       */
      configure: function (componentId, fn) {
        componentId = componentId && typeof componentId === 'string' ? componentId : Temasys.Utils.generateUUID();
        ref._stats.components[componentId] = {
          debug: 0,
          log: 0,
          info: 0,
          warn: 0,
          error: 0,
          exceptions: []
        };
        ref._listeners.components.push(fn);
        // Configure the current `catch` listener
        fn(ref._listeners.catch);
        // For listeners.catch, invoke it as (componentId, error)
        return componentId;
      },

      /**
       * Function to push stats to API.
       */
      stat: function (appKey, roomId, peerId, type, data) {
      },

      /**
       * Function to catch custom errors to be thrown. 
       */
      throw: function (componentId, error) {
        if (typeof ref._listeners.catch === 'function') {
          ref._listeners.catch(componentId, error);
        } else {
          throw error;
        }
      }
    }
  })(function (level, args) {
    // 0: Component ID
    // 1: Message
    // 2+: Meta data
    var componentId = args[0];
    var timestamp = (new Date()).toISOString();
    var useSettings = ref._settings.components[componentId] ?
      ref._settings.components[componentId] : ref._settings.global;

    // E.g. Peer :: 34234234234 | 2017-04-12T12:41:55.563Z [RID: werwer][PID: xxx-werwer-][CID: test] - Test log is here -> null
    var message = '';
    
    // message: array - [component,roomId,peerId,anyId,message]
    if (Array.isArray(args[1])) {
      message += args[1][0] ? args[1][0] + ' ' : '';
      message += useSettings.printComponentId ? ':: ' + componentId + ' ' : '';
      message += useSettings.printTimestamp ? '| ' + timestamp + ' ' : '';
      message += args[1][1] ? '[RID: ' + args[1][1] + ']' : '';
      message += args[1][2] ? '[PID: ' + args[1][2] + ']' : '';
      message += args[1][3] ? '[CID: ' + args[1][3] + ']' : '';
      message += (message[message.length - 1] === ' ' ? '- ' : (message ? ' - ' : '')) + args[1][4];
    // message: string - message
    } else {
      message += useSettings.printComponentId ? ':: ' + componentId + ' ' : '';
      message += useSettings.printTimestamp ? '| ' + timestamp + ' ' : '';
      message += (message[message.length - 1] === ' ' ? ' - ' : '') + args[1];
    }

    // Remove the first 2 arguments and leave the meta data
    args.splice(0, 2);

    var logItem = [level, componentId, timestamp, message, args.concat([]), performance.now()];

    if (useSettings.cacheLogs) {
      refLogs.push(logItem);
    }

    if (typeof ref._listeners.watch === 'function') {
      ref._listeners.watch(logItem, componentId);
    }

    args.splice(0, 0, (useSettings.traceLogs ? '[' + level + '] ' : '') + message);

    if (ref.LOG_LEVEL_ENUM[level] <= useSettings.level) {
      var method = useSettings.traceLogs ? 'trace' : level.toLowerCase();
      method = typeof console[method] !== 'function' ? 'log' : method;
      console[method].apply(console, args);
    }

    ref._stats.total[level.toLowerCase()]++;
    ref._stats.components[componentId][level.toLowerCase()]++;

    // TODO: Push logs to remote server when requested.
  });
})();



/**
 * Handles the native `RTCPeerConnection` object connection.
 * @class Temasys.Peer
 * @param {JSON} options The options.
 * @param {JSON} [options.constraints] @(exp) The native `RTCPeerConnection` object constraints settings.
 * @param {String} [options.constraints.iceTransportPolicy=ALL] The ICE transport policy for gathering ICE candidates.
 * - See {{#crossLink "Temasys.Peer/ICE_TRANSPORT_POLICY_ENUM:attribute"}}{{/crossLink}} for reference.
 * @param {String} [options.constraints.rtcpMuxPolicy=REQUIRE] The RTP and RTCP multiplex policy for gathering ICE candidates.
 * - See {{#crossLink "Temasys.Peer/RTCP_MUX_POLICY_ENUM:attribute"}}{{/crossLink}} for reference.
 * @param {String} [options.constraints.bundlePolicy=BALANCED] The bundle policy for gathering ICE candidates.
 * - See {{#crossLink "Temasys.Peer/BUNDLE_POLICY_ENUM:attribute"}}{{/crossLink}} for reference.
 * @param {Number} [options.constraints.iceCandidatePoolSize=0] The ICE candidate pool size to limit
 *   for gathering ICE candidates.
 * - Set it as `0` to remove limits.
 * @param {String|RTCCertificate} [options.constraints.certificate] The certificate algorithm to use for
 *   the ICE connection media streaming encryption.
 * - When provided as `String`, see {{#crossLink "Temasys.Peer/CERTIFICATE_ENUM:attribute"}}{{/crossLink}} for reference.
 * @param {JSON} [options.constraints.iceServers] The ICE servers settings.
 * @param {JSON|Boolean} [options.constraints.iceServers.turn] The TURN ICE servers settings.
 * - When provided as a `Boolean`, it determines if TURN ICE servers should be used.
 * @param {Boolean} [options.constraints.iceServers.turn.secure=false] The flag if TURN servers with TLS only should be used.
 * @param {String} [options.constraints.iceServers.turn.transport=AUTO] The TURN server transport to use.
 * - See {{#crossLink "Temasys.Peer/TURN_TRANSPORT_ENUM:attribute"}}{{/crossLink}} for reference.
 * @param {Array|String} [options.constraints.iceServers.turn.urls] The list of TURN servers urls to use.
 *  E.g. `("turn.temasys.io:3478", "turn.temasys.io:19305")` or `"turn.temasys.io"`
 * @param {JSON|Boolean} [options.constraints.iceServers.stun] The STUN ICE servers settings.
 * - When provided as a `Boolean`, it determines if STUN ICE servers should be used.
 * @param {Boolean} [options.constraints.iceServers.stun.public] The flag if public STUN ICE servers should be used.
 * @param {Array|String} [options.constraints.iceServers.stun.urls] The list of STUN servers urls to use.
 *  E.g. `("turn.temasys.io:3478", "turn.temasys.io:19305")` or `"turn.temasys.io"`
 * @param {JSON} [options.candidates] @(exp) The ICE candidates settings.
 * @param {Boolean} [options.candidates.host=true] The flag if "host" ICE candidates should be used.
 * @param {Boolean} [options.candidates.srflx=true] The flag if "srflx" ICE candidates should be used.
 * @param {Boolean} [options.candidates.relay=true] The flag if "relay" ICE candidates should be used.
 * @param {JSON} [options.codecs] @(exp) The codecs settings.
 * - This configures the Peer connection native `RTCSessionDescription` object string.
 * @param {JSON} [options.codecs.params] The media connection codecs parameters settings.
 * - When settings are not provided, the default browser configuration is used.
 * @param {JSON} [options.codecs.params.audio] The media connection audio codecs settings.
 * @param {JSON|String} [options.codecs.params.audio.opus] The media connection OPUS audio codec settings.
 * - When provided as a `String`, it sets as the full parameter settings. E.g. `minptime=1;stereo=1`
 * @param {Boolean} [options.codecs.params.audio.opus.stereo] The flag if OPUS audio codec stereo band
 *   should be configured for sending audio packets.
 * @param {Boolean} [options.codecs.params.audio.opus.usedtx] The flag if OPUS audio codec should enable
 *   DTX (Discontinuous Transmission) for sending audio packets. This might help to reduce bandwidth
 *   as it reduces the bitrate during silence or background noise, and goes hand-in-hand with the
 *   `options.media.audio.voiceActivityDetection` flag.
 * @param {Boolean} [options.codecs.params.audio.opus.useinbandfec] The flag if OPUS audio codec has the
 *   capability to take advantage of the in-band FEC (Forward Error Correction) when sending audio packets.
 *   This helps to reduce the harm of packet loss by encoding information about the previous packet loss.
 * @param {Number} [options.codecs.params.audio.opus.maxplaybackrate] The OPUS audio codec
 *   maximum output sampling rate in Hz (hertz) that is is capable of receiving audio packets,
 *   to adjust to the hardware limitations and ensure that any sending audio packets
 *   would not encode at a higher sampling rate specified by this.
 * - This value must be between `8000` to `48000`.
 * @param {Number} [options.codecs.params.audio.opus.minptime] The OPUS audio codec encoder
 *   minimum length of time in milleseconds should be encapsulated for a single audio data packet.
 * @param {JSON|String} [options.codecs.params.audio.telephoneEvent] The media connection DTMF audio codec settings.
 * - When provided as a `String`, it sets as the full parameter settings. E.g. `0-5`
 * @param {JSON|String} [options.codecs.params.audio.pcma] The media connection PCMA (G711a) audio codec settings.
 * - When provided as a `String`, it sets as the full parameter settings.
 * @param {JSON|String} [options.codecs.params.audio.pcmu] The media connection PCMU (G711u) audio codec settings.
 * - When provided as a `String`, it sets as the full parameter settings.
 * @param {JSON|String} [options.codecs.params.audio.g722] The media connection G722 audio codec settings.
 * - When provided as a `String`, it sets as the full parameter settings.
 * @param {JSON|String} [options.codecs.params.audio.isac] The media connection ISAC audio codec settings.
 * - When provided as a `String`, it sets as the full parameter settings.
 * @param {JSON|String} [options.codecs.params.audio.ilbc] The media connection iLBC audio codec settings.
 * - When provided as a `String`, it sets as the full parameter settings.
 * @param {JSON} [options.codecs.params.video] The media connection video codecs settings.
 * @param {JSON|String} [options.codecs.params.video.h264] The media connection H264 video codec settings.
 * - When provided as a `String`, it sets as the full parameter settings. E.g. `levelAsymmetryAllowed=1;packetizationMode=1`
 * @param {String} [options.codecs.params.video.h264.profileLevelId] The H264 video codec base16 encoded
 *   string which indicates the H264 baseline, main, or the extended profiles.
 * @param {Boolean} [options.codecs.params.video.h264.levelAsymmetryAllowed] The flag if H264 video codec
 *   encoder of video packets should be at a different level from decoder of video packets.
 * @param {Boolean} [options.codecs.params.video.h264.packetizationMode] The flag if H264 video codec
 *   packetization mode should be enabled where it splits video frames that are larger for a RTP packet into RTP packet chunks.
 * @param {JSON|String} [options.codecs.params.video.vp8] The media connection VP8 video codec settings.
 * - When provided as a `String`, it sets as the full parameter settings.
 * @param {Number} [options.codecs.params.video.vp8.maxFr] The maximum number of frames per second (fps) the
 *   VP8 video decoder is capable of decoding video packets.
 * @param {Number} [options.codecs.params.video.vp8.maxFs] The maximum number of frame size macroblocks
 *   that the VP8 video decoder is capable of decoding video packets.
 * - The value has to have the width and height of the frame in macroblocks less than the value of
 *   `parseInt(Math.sqrt(maxFs * 8))`. For example, if the value is `1200`, it is capable of the
 *   support of `640x480` frame width and height, which heights up to `1552px` (`97` macroblocks value.
 * @param {JSON|String} [options.codecs.params.video.vp9] The media connection VP9 video codec settings.
 * - When provided as a `String`, it sets as the full parameter settings.
 * @param {Number} [options.codecs.params.video.vp9.maxFr] The maximum number of frames per second (fps) the
 *   VP9 video decoder is capable of decoding video packets.
 * @param {Number} [options.codecs.params.video.vp9.maxFs] The maximum number of frame size macroblocks
 *   that the VP9 video decoder is capable of decoding video packets.
 * - The value has to have the width and height of the frame in macroblocks less than the value of
 *   `parseInt(Math.sqrt(maxFs * 8))`. For example, if the value is `1200`, it is capable of the
 *   support of `640x480` frame width and height, which heights up to `1552px` (`97` macroblocks value.
 * @param {JSON} [options.codecs.prefer] The media connection codec preference settings.
 * @param {String|JSON} [options.codecs.prefer.audio=AUTO] The preferred audio codec settings.
 * - When provided as a `String`, it is the preferred audio codec name.
 * - See {{#crossLink "Temasys.Peer/AUDIO_CODEC_ENUM:attribute"}}{{/crossLink}} for reference.
 * @param {String} options.codecs.prefer.audio.codec The preferred audio codec name.
 * - Note that value cannot be `AUDIO_CODEC_ENUM.AUTO`.
 * - See {{#crossLink "Temasys.Peer/AUDIO_CODEC_ENUM:attribute"}}{{/crossLink}} for reference.
 * @param {Number} [options.codecs.prefer.audio.codec.samplingRate] The preferred audio codec sampling rate
 *   if available for the preferred audio codec name.
 * @param {Number} [options.codecs.prefer.audio.codec.channels] The preferred audio codec channels
 *   if available for the preferred audio codec name.
 * @param {String|JSON} [options.codecs.prefer.video=AUTO] The preferred audio codec settings.
 * - When provided as a `String`, it is the preferred video codec name.
 * - See {{#crossLink "Temasys.Peer/VIDEO_CODEC_ENUM:attribute"}}{{/crossLink}} for reference.
 * @param {String} options.codecs.prefer.video.codec The preferred video codec name.
 * - Note that value cannot be `VIDEO_CODEC_ENUM.AUTO`.
 * - See {{#crossLink "Temasys.Peer/VIDEO_CODEC_ENUM:attribute"}}{{/crossLink}} for reference.
 * @param {Number} [options.codecs.prefer.video.codec.samplingRate] The preferred video codec sampling rate
 *   if available for the preferred video codec name.
 * @param {JSON} [options.codecs.mechanism] The codecs RTCP or FECs settings.
 * @param {Boolean} [options.codecs.mechanism.ulpfec=true] The flag to enable ULPFEC codec
 *   (generic forward error correction) mechanism when available.
 * @param {Boolean} [options.codecs.mechanism.red=true] The flag to enable RED codec
 *   (generic forward error correction) mechanism when available.
 * @param {Boolean} [options.codecs.mechanism.rtx=true] The flag to enable RTX (re-transmission) mechanism when available.
 * @param {Boolean} [options.codecs.mechanism.remb=true] The flag to enable REMB
 *   (receiver estimated maximum bitrate) mechanism when available.
 * @param {Boolean} [options.codecs.mechanism.nack=true] The flag to enable NACK
 *   (negative acknowledgement) mechanism when available.
 * @param {Boolean} [options.codecs.mechanism.ccm=true] The flag to enable CCM
 *   (codec control messages) mechanism when available.
 * @param {Boolean} [options.codecs.mechanism.transportcc=true] The flag to enable transport-cc
 *   (transport-wide congestion control) mechanism when available.
 * @param {JSON} [options.media] The Peer connection media connection settings.
 * - This configures the Peer connection native `RTCSessionDescription` object string.
 * @param {JSON|Boolean} [options.media.audio] The media audio streaming settings.
 * - When provided as `false`, this disables the audio streaming connection entirely. 
 * @param {Boolean} [options.media.audio.send=true] The flag if audio packets should be sent to Peer connection.
 * - When provided as `false`, this prevents sending audio packets to Peer despite audio tracks being added.
 * @param {Boolean} [options.media.audio.receive=true] The flag if audio packets should be sent to Peer connection.
 * - When provided as `false`, this prevents receiving audio packets from Peer despite audio tracks being added remotely.
 * @param {Boolean} [options.media.audio.voiceActivityDetection=true] The flag if voice activity detection
 *   (VAD) should be enabled.
 * @param {Boolean} [options.media.audio.dtmf=false] The flag if DTMF should be created if supported.
 * @param {Number} [options.media.audio.maxBandwidth=20] The maximum range limit of sending audio bandwidth in kbps.
 * - The bandwidth might be lower or higher by a few kbps than the specified range at times.
 * - Set it as `0` to remove limits.
 * @param {JSON|Boolean} [options.media.video] The media video streaming settings.
 * - When provided as `false`, this disables the video streaming connection entirely. 
 * @param {Boolean} [options.media.video.send=true] The flag if video packets should be sent to Peer connection.
 * - When provided as `false`, this prevents sending video packets to Peer despite video tracks being added.
 * @param {Boolean} [options.media.video.receive=true] The flag if video packets should be sent to Peer connection.
 * - When provided as `false`, this prevents receiving video packets from Peer despite video tracks being added remotely.
 * @param {Number} [options.media.video.maxBandwidth=512] The maximum range limit of sending video bandwidth in kbps.
 * - The bandwidth might be lower or higher by a few kbps than the specified range at times.
 * - Set it as `0` to remove limits.
 * @param {JSON} [options.media.video.xGoogleBandwidth] @(exp) The bitrate configuration for video codec bandwidth.
 * - When settings are not provided, the default browser configuration is used.
 * @param {Number} [options.media.video.xGoogleBandwidth.min] The `"x-google-min-bitrate"` configuration.
 * @param {Number} [options.media.video.xGoogleBandwidth.max] The `"x-google-max-bitrate"` configuration.
 * @param {JSON|Boolean} [options.media.datachannel=true] The media datachannel connection settings.
 * - When provided as `false`, this disables the datachannel connection entirely. 
 * @param {Number} [options.media.datachannel.maxBandwidth=30] The maximum range limit of sending datachannel bandwidth in kbps.
 * - The bandwidth might be lower or higher by a few kbps than the specified range at times.
 * - Set it as `0` to remove limits.
 * @param {Number} [options.trickleICE=true] The flag if trickle ICE handshake should be enabled.
 * @constructor
 * @private
 * @for Temasys
 * @since 0.7.0
 */
function Peer (options, defaultOptions) {
  /**
   * The Peer ID.
   * @attribute id
   * @type String
   * @readOnly
   * @for Temasys.Peer
   * @since 0.7.0
   */
  this.id = null;

  /**
   * The Peer parent ID.
   * @attribute parentId
   * @type String
   * @readOnly
   * @for Temasys.Peer
   * @since 0.7.0
   */
  this.parentId = null;

  /**
   * The Peer connection type.
   * - See {{#crossLink "Temasys.Peer/TYPE_ENUM:attribute"}}{{/crossLink}} for reference.
   * @attribute type
   * @type String
   * @readOnly
   * @for Temasys.Peer
   * @since 0.7.0
   */
  this.type = null;

  /**
   * The Peer custom data.
   * @attribute data
   * @type Any
   * @readOnly
   * @for Temasys.Peer
   * @since 0.7.0
   */
  this.data = null;

  /**
   * The Peer client agent.
   * @attribute agent
   * @param {String} name The client agent name.
   * @param {String} version The client agent version.
   * @param {String} [platform] The client agent platform when available.
   * @param {String} [pluginVersion] The client WebRTC plugin version when available.
   * @type JSON
   * @readOnly
   * @for Temasys.Peer
   * @since 0.7.0
   */
  this.agent = {
    name: '',
    version: '',
    platform: '',
    pluginVersion: ''
  };

  /**
   * The Peer protocol versions.
   * @attribute protocol
   * @param {String} DTProtocolVersion The DT protocol version.
   * @param {String} SMProtocolVersion The SM protocol version.
   * @type JSON
   * @readOnly
   * @for Temasys.Peer
   * @since 0.7.0
   */
  this.protocol = {
    DTProtocolVersion: '',
    SMProtocolVersion: ''
  };

  /**
   * The Peer session settings.
   * @attribute session
   * @param {Boolean} publishOnly The flag if Peer is sending Stream only and not receiving.
   * @param {Boolean} receiveOnly The flag if Peer is receiving Stream only and not sending.
   * @param {Boolean} datachannel The flag if Peer chooses to have Datachannel connection enabled.
   * @param {Boolean} trickleICE The flag if Peer chooses to have trickle ICE handshake.
   * @param {Boolean} iceRestart The flag if Peer has ICE restart capability.
   * @param {Number} weight The Peer weight to determine if Peer should be start offer first
   *   or not depending on whose weight is higher.
   * @type JSON
   * @readOnly
   * @for Temasys.Peer
   * @since 0.7.0
   */
  this.session = {
    publishOnly: false,
    receiveOnly: false,
    datachannel: true,
    trickleICE: true,
    iceRestart: !(window.webrtcDetectedBrowser === 'firefox' && window.webrtcDetectedVersion < 48),
    weight: 0
  };

  /**
   * The Peer current states.
   * @attribute $current
   * @param {String} handshakeState The Peer handshake state.
   * @param {String} iceConnectionState The Peer ICE connection state.
   * @param {String} iceGatheringState The Peer ICE gathering state.
   * @param {String} signalingState The Peer signaling state.
   * @param {JSON} candidates The Peer ICE candidates states.
   * @param {JSON} candidates.local The local ICE candidates sending states.
   * - `"index"` can be identified as the local ICE candidate ID, which value is the state of the ICE candidate.
   * @param {String} candidates.local.index The local ICE candidate sending state.
   * @param {JSON} candidates.remote The remote ICE candidates processing states.
   * - `"index"` can be identified as the remote ICE candidate ID, which value is the state of the ICE candidate.
   * @param {String} candidates.remote.index The local ICE candidate processing state.
   * @param {Boolean} connected The flag if Peer ICE is connected.
   * @type JSON
   * @readOnly
   * @for Temasys.Peer
   * @since 0.7.0
   */
  this.$current = {
    handshakeState: null,
    iceConnectionState: null,
    iceGatheringState: null,
    signalingState: null,
    candidates: { remote: {}, local: {} },
    connected: false
  };

  /**
   * Event triggered when Peer handshake state has changed.
   * @event handshakeStateChange
   * @param {String} state The current handshake state.
   * - See {{#crossLink "Temasys.Peer/HANDSHAKE_STATE_ENUM:attribute"}}{{/crossLink}} for reference.
   * @param {JSON} [error] The error.
   * - This is defined when `state` is `ERROR`.
   * @param {Error} [error.error] The error object.
   * @param {String} [error.type] The error type.
   * - See {{#crossLink "Temasys.Peer/HANDSHAKE_ERROR_TYPE_ENUM:attribute"}}{{/crossLink}} for reference.
   * @for Temasys.Peer
   * @since 0.7.0
   */
  /**
   * Event triggered when Peer signaling state has changed.
   * @event signalingStateChange
   * @param {String} state The current signaling state.
   * - See {{#crossLink "Temasys.Peer/SIGNALING_STATE_ENUM:attribute"}}{{/crossLink}} for reference.
   * @for Temasys.Peer
   * @since 0.7.0
   */
  /**
   * Event triggered when Peer ICE connection state has changed.
   * @event iceConnectionStateChange
   * @param {String} state The current ICE connection state.
   * - See {{#crossLink "Temasys.Peer/ICE_CONNECTION_STATE_ENUM:attribute"}}{{/crossLink}} for reference.
   * @for Temasys.Peer
   * @since 0.7.0
   */
  /**
   * Event triggered when Peer ICE gathering state has changed.
   * @event iceGatheringStateChange
   * @param {String} state The current ICE gathering state.
   * - See {{#crossLink "Temasys.Peer/ICE_GATHERING_STATE_ENUM:attribute"}}{{/crossLink}} for reference.
   * @for Temasys.Peer
   * @since 0.7.0
   */
  /**
   * Event triggered when Peer local ICE candidate sending state has changed.
   * @event candidateSentStateChange
   * @param {String} state The current local ICE candidate sending state.
   * - See {{#crossLink "Temasys.Peer/CANDIDATE_SENT_STATE_ENUM:attribute"}}{{/crossLink}} for reference.
   * @param {String} candidateId The local ICE candidate ID.
   * @for Temasys.Peer
   * @since 0.7.0
   */
  /**
   * Event triggered when Peer remote ICE candidate processing state has changed.
   * @event candidateProcessingStateChange
   * @param {String} state The current remote ICE candidate processing state.
   * - See {{#crossLink "Temasys.Peer/CANDIDATE_PROCESSING_STATE_ENUM:attribute"}}{{/crossLink}} for reference.
   * @param {String} candidateId The remote ICE candidate ID.
   * @param {Error} [error] The error object.
   * - This is defined when `state` is `FAILED`.
   * @for Temasys.Peer
   * @since 0.7.0
   */
  /**
   * Event triggered when {{#crossLink "Temasys.Peer/getStats:method"}}{{/crossLink}} state has changed.
   * @event getStatsStateChange
   * @param {String} state The current stats retrieval state.
   * - See {{#crossLink "Temasys.Peer/GET_STATS_STATE_ENUM:attribute"}}{{/crossLink}} for reference.
   * @param {JSON} [stats] The stats.
   * - This is defined when `state` is `SUCCESS`.
   * - The below `stats` parameters will not be the same if `isRaw` parameter is set to `true` in the 
   * @param {JSON} stats.audio The Peer connection audio stats.
   * @param {JSON} stats.audio.sent The audio stats sent.
   * @param {JSON} stats.audio.sent.bytes The audio bytes sent information.
   * @param {Number} stats.audio.sent.bytes.current The current audio bytes sent.
   * @param {Number} stats.audio.sent.bytes.total The total audio bytes sent.
   * @param {JSON} stats.audio.sent.packets The audio packets sent information.
   * @param {Number} stats.audio.sent.packets.current The current audio packets sent.
   * @param {Number} stats.audio.sent.packets.total The total audio packets sent.
   * @param {JSON} stats.audio.sent.nackCount The audio nacks sent.
   * @param {Number} [stats.audio.sent.nackCount.current] The current audio nacks sent.
   * @param {Number} [stats.audio.sent.nackCount.total] The total audio nacks sent.
   * @param {String} stats.audio.sent.ssrc The audio sending direction RTP packets synchronization source (SSRC) ID.
   * @param {JSON} stats.audio.sent.rtt The audio sending direction round-trip time (RTT) taken.
   * @param {Number} [stats.audio.sent.rtt.current] The current audio sending direction RTT in seconds.
   * @param {JSON} stats.audio.sent.codec The selected audio sending direction codec information.
   * @param {String} stats.audio.sent.codec.name The audio sending direction codec name.
   * @param {String} stats.audio.sent.codec.payloadType The audio sending direction codec payload number.
   * @param {String} [stats.audio.sent.codec.implementation] The audio sending direction codec implementation.
   * @param {Number} stats.audio.sent.codec.channels The audio sending direction codec channels.
   * @param {Number} stats.audio.sent.codec.clockRate The audio sending direction codec sampling rate in hertz (Hz).
   * @param {String} stats.audio.sent.codec.params The audio sending direction codec parameters.
   * @param {Number} [stats.audio.sent.level] The current audio sending stream input level.
   * @param {Number} [stats.audio.sent.echoReturnLoss] The current audio sending stream echo return loss in decibels (db).
   * @param {Number} [stats.audio.sent.echoReturnLossEnhancement] The current audio sending stream echo return loss
   *   enhancement in decibels (db).
   * @param {JSON} stats.audio.received The audio stats received.
   * @param {JSON} stats.audio.received.bytes The audio bytes received information.
   * @param {Number} stats.audio.received.bytes.current The current audio bytes received.
   * @param {Number} stats.audio.received.bytes.total The total audio bytes received.
   * @param {JSON} stats.audio.received.packets The audio packets received information.
   * @param {Number} stats.audio.received.packets.current The current audio packets received.
   * @param {Number} stats.audio.received.packets.total The total audio packets received.
   * @param {JSON} stats.audio.received.packetsLost The audio packets lost information.
   * @param {Number} [stats.audio.received.packetsLost.current] The current audio packets lost.
   * @param {Number} [stats.audio.received.packetsLost.total] The total audio packets lost.
   * @param {JSON} stats.audio.received.packetsDiscarded The audio packets discarded information.
   * @param {Number} [stats.audio.received.packetsDiscarded.current] The current audio packets discarded.
   * @param {Number} [stats.audio.received.packetsDiscarded.total] The total audio packets discarded.
   * @param {JSON} stats.audio.received.packetsRepaired The audio packets repaired information.
   * @param {Number} [stats.audio.received.packetsRepaired.current] The current audio packets repaired.
   * @param {Number} [stats.audio.received.packetsRepaired.total] The total audio packets repaired.
   * @param {JSON} stats.audio.received.fractionLost The audio packets fraction loss information.
   * @param {Number} [stats.audio.received.fractionLost.current] The current audio packets fraction loss.
   * @param {JSON} stats.audio.received.jitter The audio packets jitter information.
   * @param {Number} [stats.audio.received.jitter.current] The current audio packets jitter in seconds.
   * @param {Number} [stats.audio.received.jitter.currentMs] The current audio packets jitter in miliseconds.
   * @param {JSON} stats.audio.received.nackCount The audio nacks received.
   * @param {Number} [stats.audio.received.nackCount.current] The current audio nacks received.
   * @param {Number} [stats.audio.received.nackCount.total] The total audio nacks received.
   * @param {String} stats.audio.received.ssrc The audio receiving direction RTP packets synchronization source (SSRC) ID.
   * @param {JSON} [stats.audio.received.codec] The selected audio receiving direction codec information.
   * @param {String} [stats.audio.received.codec.name] The audio receiving direction codec name.
   * @param {String} [stats.audio.received.codec.payloadType] The audio receiving direction codec payload number.
   * @param {String} [stats.audio.received.codec.implementation] The audio receiving direction codec implementation.
   * @param {Number} [stats.audio.received.codec.channels] The audio receiving direction codec channels.
   * @param {Number} [stats.audio.received.codec.clockRate] The audio receiving direction codec sampling rate in hertz (Hz).
   * @param {String} [stats.audio.received.codec.params] The audio receiving direction codec parameters.
   * @param {Number} [stats.audio.received.level] The current audio receiving stream output level.
   * @param {JSON} stats.video The Peer connection video stats.
   * @param {JSON} stats.video.sent The video stats sent.
   * @param {JSON} stats.video.sent.bytes The video bytes sent information.
   * @param {Number} stats.video.sent.bytes.current The current video bytes sent.
   * @param {Number} stats.video.sent.bytes.total The total video bytes sent.
   * @param {JSON} stats.video.sent.packets The video packets sent information.
   * @param {Number} stats.video.sent.packets.current The current video packets sent.
   * @param {Number} stats.video.sent.packets.total The total video packets sent.
   * @param {String} stats.video.sent.ssrc The video sending direction RTP packets synchronization source (SSRC) ID.
   * @param {JSON} stats.video.sent.rtt The video sending direction round-trip time (RTT) taken.
   * @param {Number} [stats.video.sent.rtt.current] The current video sending direction RTT in seconds.
   * @param {JSON} stats.video.sent.nackCount The video nacks sent.
   * @param {Number} [stats.video.sent.nackCount.current] The current video nacks sent.
   * @param {Number} [stats.video.sent.nackCount.total] The total video nacks sent.
   * @param {JSON} stats.video.sent.sliCount The video slis sent.
   * @param {Number} [stats.video.sent.sliCount.current] The current video slis sent.
   * @param {Number} [stats.video.sent.sliCount.total] The total video slis sent.
   * @param {JSON} stats.video.sent.pliCount The video plis sent.
   * @param {Number} [stats.video.sent.pliCount.current] The current video plis sent.
   * @param {Number} [stats.video.sent.pliCount.total] The total video plis sent.
   * @param {JSON} stats.video.sent.firCount The video firs sent.
   * @param {Number} [stats.video.sent.firCount.current] The current video firs sent.
   * @param {Number} [stats.video.sent.firCount.total] The total video firs sent.
   * @param {JSON} stats.video.sent.codec The selected video sending direction codec information.
   * @param {String} stats.video.sent.codec.name The selected video sending direction codec name.
   * @param {String} stats.video.sent.codec.payloadType The selected video sending direction codec payload number.
   * @param {String} [stats.video.sent.codec.implementation] The selected video sending direction codec implementation.
   * @param {Number} stats.video.sent.codec.clockRate The selected video sending direction
   *   codec sampling rate in hertz (Hz).
   * @param {String} stats.video.sent.codec.params The selected video sending direction codec parameters.
   * @param {JSON} stats.video.sent.frames The video frames sent information.
   * @param {Number} [stats.video.sent.frames.current] The current number of video frames sent.
   * @param {Number} [stats.video.sent.frames.total] The total number of video frames sent.
   * @param {JSON} stats.video.sent.frameRate The video frames per second (fps) sent information.
   * @param {Number} [stats.video.sent.frameRate.current] The current video frames per second (fps) sent.
   * @param {Number} [stats.video.sent.frameRate.mean] The current mean of the current video frames per second (fps) sent.
   * @param {Number} [stats.video.sent.frameRate.stdDev] The current standard deviation
   *   of the current video frames per second (fps) sent.
   * @param {Number} [stats.video.sent.frameRate.input] The current sending video stream frames per second (fps) input.
   * @param {JSON} stats.video.sent.framesDropped The video frames dropped information.
   * @param {Number} [stats.video.sent.framesDropped.current] The current number of video frames dropped.
   * @param {Number} [stats.video.sent.framesDropped.total] The total number of video frames dropped.
   * @param {JSON} stats.video.sent.framesCorrupted The video frames corrupted information.
   * @param {Number} [stats.video.sent.framesCorrupted.current] The current number of video frames corrupted.
   * @param {Number} [stats.video.sent.framesCorrupted.total] The total number of video frames corrupted.
   * @param {JSON} stats.video.sent.framesEncoded The video frames encoded information.
   * @param {Number} [stats.video.sent.framesEncoded.current] The current number of video frames encoded.
   * @param {Number} [stats.video.sent.framesEncoded.total] The total number of video frames encoded.
   * @param {JSON} stats.video.sent.frameSize The current video frame size sent information.
   * @param {Number} [stats.video.sent.frameSize.width] The current video frame width in pixels (px) sent.
   * @param {Number} [stats.video.sent.frameSize.height] The current video frame height in pixels (px) sent.
   * @param {Number} [stats.video.sent.qpSum] The sum of the QP values of frames passed.
   * @param {JSON} stats.video.received The video stats received.
   * @param {JSON} stats.video.received.bytes The video bytes received information.
   * @param {Number} stats.video.received.bytes.current The current video bytes received.
   * @param {Number} stats.video.received.bytes.total The total video bytes received.
   * @param {JSON} stats.video.received.packets The video packets received information.
   * @param {Number} stats.video.received.packets.current The current video packets received.
   * @param {Number} stats.video.received.packets.total The total video packets received.
   * @param {String} stats.video.received.ssrc The video sending direction RTP packets synchronization source (SSRC) ID.
   * @param {JSON} stats.video.received.jitter The video packets jitter information.
   * @param {Number} [stats.video.received.jitter.current] The current video packets jitter in seconds.
   * @param {Number} [stats.video.received.jitter.currentMs] The current video packets jitter in miliseconds.
   * @param {JSON} stats.video.received.nackCount The video nacks received.
   * @param {Number} [stats.video.received.nackCount.current] The current video nacks received.
   * @param {Number} [stats.video.received.nackCount.total] The total video nacks received.
   * @param {JSON} stats.video.received.sliCount The video slis received.
   * @param {Number} [stats.video.received.sliCount.current] The current video slis received.
   * @param {Number} [stats.video.received.sliCount.total] The total video slis received.
   * @param {JSON} stats.video.received.pliCount The video plis received.
   * @param {Number} [stats.video.received.pliCount.current] The current video plis received.
   * @param {Number} [stats.video.received.pliCount.total] The total video plis received.
   * @param {JSON} stats.video.received.firCount The video firs received.
   * @param {Number} [stats.video.received.firCount.current] The current video firs received.
   * @param {Number} [stats.video.received.firCount.total] The total video firs received.
   * @param {JSON} stats.video.received.codec The selected video sending direction codec information.
   * @param {String} [stats.video.received.codec.name] The selected video sending direction codec name.
   * @param {String} [stats.video.received.codec.payloadType] The selected video sending direction codec payload number.
   * @param {String} [stats.video.received.codec.implementation] The selected video sending direction codec implementation.
   * @param {Number} [stats.video.received.codec.clockRate] The selected video sending direction
   *   codec sampling rate in hertz (Hz).
   * @param {String} [stats.video.received.codec.params] The selected video sending direction codec parameters.
   * @param {JSON} stats.video.received.frames The video frames received information.
   * @param {Number} [stats.video.received.frames.current] The current number of video frames received.
   * @param {Number} [stats.video.received.frames.total] The total number of video frames received.
   * @param {JSON} stats.video.received.frameRate The video frames per second (fps) received information.
   * @param {Number} [stats.video.received.frameRate.current] The current video frames per second (fps) received.
   * @param {Number} [stats.video.received.frameRate.mean] The current mean of the current video frames per second (fps) received.
   * @param {Number} [stats.video.received.frameRate.stdDev] The current standard deviation
   *   of the current video frames per second (fps) received.
   * @param {Number} [stats.video.received.frameRate.output] The current sending video stream frames per second (fps) output.
   * @param {JSON} stats.video.received.framesDropped The video frames dropped information.
   * @param {Number} [stats.video.received.framesDropped.current] The current number of video frames dropped.
   * @param {Number} [stats.video.received.framesDropped.total] The total number of video frames dropped.
   * @param {JSON} stats.video.received.framesCorrupted The video frames corrupted information.
   * @param {Number} [stats.video.received.framesCorrupted.current] The current number of video frames corrupted.
   * @param {Number} [stats.video.received.framesCorrupted.total] The total number of video frames corrupted.
   * @param {JSON} stats.video.received.framesEncoded The video frames decoded information.
   * @param {Number} [stats.video.received.framesDecoded.current] The current number of video frames decoded.
   * @param {Number} [stats.video.received.framesDecoded.total] The total number of video frames decoded.
   * @param {JSON} stats.video.received.frameSize The current video frame size received information.
   * @param {Number} [stats.video.received.frameSize.width] The current video frame width in pixels (px) received.
   * @param {Number} [stats.video.received.frameSize.height] The current video frame height in pixels (px) received.
   * @param {Number} [stats.video.received.e2eDelay] The current video e2e delay.
   * - This requires a {{#crossLink "Temasys.Stream"}}{{/crossLink}} attached to a video element.
   * @param {JSON} stats.candidates The Peer connection ICE candidates information.
   * @param {Array} stats.candidates.local The array of local ICE candidates stats information.
   * - `"index"` can be identified as the index item of each local ICE candidate stats object.
   * @param {String} [stats.candidates.local.index] The local ICE candidate stats.
   * @param {String} [stats.candidates.local.index.ip] The local ICE candidate IP address.
   * @param {Number} [stats.candidates.local.index.port] The local ICE candidate port.
   * @param {String} [stats.candidates.local.index.protocol] The local ICE candidate protocol.
   * @param {String} [stats.candidates.local.index.turnProtocol] The local ICE candidate protocol used to
   *   communicate with TURN server.
   * @param {String} [stats.candidates.local.index.candidateType] The local ICE candidate type.
   * - Available values are: `"host"` (local network area), `"srflx"` (STUN) and `"relay"` (TURN)
   * @param {Number} [stats.candidates.local.index.priority] The local ICE candidate priority.
   * @param {Number} [stats.candidates.local.index.selected] The flag if the local ICE candidate is selected.
   * @param {Array} stats.candidates.remote The array of remote ICE candidates stats information.
   * - `"index"` can be identified as the index item of each remote ICE candidate stats object.
   * @param {String} [stats.candidates.remote.index] The remote ICE candidate stats.
   * @param {String} [stats.candidates.remote.index.ip] The remote ICE candidate IP address.
   * @param {Number} [stats.candidates.remote.index.port] The remote ICE candidate port.
   * @param {String} [stats.candidates.remote.index.protocol] The remote ICE candidate protocol.
   * @param {String} [stats.candidates.remote.index.turnProtocol] The remote ICE candidate protocol used to
   *   communicate with TURN server.
   * @param {String} [stats.candidates.remote.index.candidateType] The remote ICE candidate type.
   * - Available values are: `"host"` (local network area), `"srflx"` (STUN) and `"relay"` (TURN)
   * @param {Number} [stats.candidates.remote.index.priority] The remote ICE candidate priority.
   * @param {Number} [stats.candidates.remote.index.selected] The flag if the remote ICE candidate is selected.
   * @param {Boolean} [stats.candidates.writable] The flag if Peer has gotten ACK to an ICE request.
   * @param {Boolean} [stats.candidates.readable] The flag if Peer has gotten a valid incoming ICE request.
   * @param {JSON} stats.candidates.rtt The current STUN connectivity checks round-trip delay (RTT) information.
   * @param {Number} [stats.candidates.current] The current rtt in seconds.
   * @param {Number} [stats.candidates.total] The total rtt in seconds.
   * @param {JSON} stats.candidates.requests The ICE connectivity check requests.
   * @param {JSON} stats.candidates.requests.received The ICE connectivity check requests received.
   * @param {Number} [stats.candidates.requests.received.current] The current number of
   *   ICE connectivity check requests received.
   * @param {Number} [stats.candidates.requests.received.total] The total number of
   *   ICE connectivity check requests received.
   * @param {JSON} stats.candidates.requests.sent The ICE connectivity check requests sent.
   * @param {Number} [stats.candidates.requests.sent.current] The current number of
   *   ICE connectivity check requests sent.
   * @param {Number} [stats.candidates.requests.sent.total] The total number of
   *   ICE connectivity check requests sent.
   * @param {JSON} stats.candidates.responses The ICE connectivity check responses.
   * @param {JSON} stats.candidates.responses.received The ICE connectivity check responses received.
   * @param {Number} [stats.candidates.responses.received.current] The current number of
   *   ICE connectivity check responses received.
   * @param {Number} [stats.candidates.responses.received.total] The total number of
   *   ICE connectivity check responses received.
   * @param {JSON} stats.candidates.responses.sent The ICE connectivity check responses sent.
   * @param {Number} [stats.candidates.responses.sent.current] The current number of
   *   ICE connectivity check responses sent.
   * @param {Number} [stats.candidates.responses.sent.total] The total number of
   *   ICE connectivity check responses sent.
   * @param {JSON} stats.candidates.consentRequests The ICE connectivity consent requests.
   * @param {JSON} stats.candidates.consentRequests.received The ICE connectivity check consent requests received.
   * @param {Number} [stats.candidates.consentRequests.received.current] The current number of
   *   ICE connectivity consent requests received.
   * @param {Number} [stats.candidates.consentRequests.received.total] The total number of
   *   ICE connectivity consent requests received.
   * @param {JSON} stats.candidates.consentRequests.sent The ICE connectivity consent requests sent.
   * @param {Number} [stats.candidates.consentRequests.sent.current] The current number of
   *   ICE connectivity consent requests sent.
   * @param {Number} [stats.candidates.consentRequests.sent.total] The total number of
   *   ICE connectivity consent requests sent.
   * @param {JSON} stats.candidates.consentResponses The ICE connectivity consent responses.
   * @param {JSON} stats.candidates.consentResponses.received The ICE connectivity check consent responses received.
   * @param {Number} [stats.candidates.consentResponses.received.current] The current number of
   *   ICE connectivity consent responses received.
   * @param {Number} [stats.candidates.consentResponses.received.total] The total number of
   *   ICE connectivity consent responses received.
   * @param {JSON} stats.candidates.consentResponses.sent The ICE connectivity consent responses sent.
   * @param {Number} [stats.candidates.consentResponses.sent.current] The current number of
   *   ICE connectivity consent responses sent.
   * @param {Number} [stats.candidates.consentResponses.sent.total] The total number of
   *   ICE connectivity consent responses sent.
   * @param {JSON} stats.certificate The Peer connection DTLS/SRTP exchanged certificates information.
   * @param {JSON} stats.certificate.local The local certificate information.
   * @param {String} [stats.certificate.local.fingerprint] The local certificate fingerprint.
   * @param {String} [stats.certificate.local.fingerprintAlgorithm] The local certificate fingerprint algorithm.
   * @param {String} [stats.certificate.local.derBase64] The local
   *   base64 certificate in binary DER format encoded in base64.
   * @param {JSON} stats.certificate.remote The remote certificate information.
   * @param {String} [stats.certificate.remote.fingerprint] The remote certificate fingerprint.
   * @param {String} [stats.certificate.remote.fingerprintAlgorithm] The remote certificate fingerprint algorithm.
   * @param {String} [stats.certificate.remote.derBase64] The remote
   *   base64 certificate in binary DER format encoded in base64.
   * @param {String} [stats.certificate.srtpCipher] The certificates SRTP cipher.
   * @param {String} [stats.certificate.dtlsCipher] The certificates DTLS cipher.
   * @param {Error} [error] The error object.
   * - This is defined when `state` is `FAILED`.
   * @for Temasys.Peer
   * @since 0.7.0
   */
  /**
   * Event triggered when sending or receiving Stream object.
   * @event stream
   * @param {Temasys.Stream} stream The Stream object.
   * @param {String} streamId The Stream ID.
   * @param {Boolean} isSelf The flag if Stream object is sent from self.
   * @for Temasys.Peer
   * @since 0.7.0
   */
  /**
   * Event triggered when receiving Datachannel object.
   * @event datachannel
   * @param {Temasys.Datachannel} channel The Datachannel object.
   * @param {String} channelId The Datachannel ID.
   * @param {Boolean} isSelf The flag if Datachannel object has started from self.
   * @for Temasys.Peer
   * @since 0.7.0
   */
  /**
   * Event triggered when sending or receiving message.
   * @event message
   * @param {JSON} message The message.
   * @param {Any} message.data The message object.
   * @param {Boolean} message.isPrivate The flag if message is targeted or not.
   * @param {Boolean} message.isDatachannel the flag if message is sent from
   *   {{#crossLink "Temasys.Datachannel"}}{{/crossLink}} connections.
   * @param {Boolean} isSelf The flag if sent from self.
   * @for Temasys.Peer
   * @since 0.7.0
   */
  /**
   * Event triggered when sending or receiving data transfers.
   * @event transfer
   * @param {Temasys.Datatransfer} transfer The data transfer object.
   * @param {String} transferId The data transfer ID.
   * @param {Boolean} isSelf The flag if transfer started from self.
   * @for Temasys.Peer
   * @since 0.7.0
   */
  /**
   * Event triggered when sending DTMF.
   * @event dtmf
   * @param {Temasys.DTMF} dtmf The DTMF object.
   */
  /**
   * Event triggered when there are exceptions thrown in this event handlers.
   * @event domError
   * @param {Error} error The error object.
   * @for Temasys.Peer
   * @since 0.7.0
   */
}

/**
 * The enum of ICE transport policies.
 * @attribute ICE_TRANSPORT_POLICY_ENUM
 * @param {String} ALL The policy to gathering all types ("host", "srflx", "relay") of ICE candidates.
 * @param {String} RELAY The policy to gathering only "relay" ICE candidates.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.ICE_TRANSPORT_POLICY_ENUM = {
  ALL: 'all',
  RELAY: 'relay'
};

/**
 * The enum of RTP and RTCP multiplex policies.
 * @attribute RTCP_MUX_POLICY_ENUM
 * @param {String} NEGOTIATE The policy to gather ICE candidates for both RTP and RTCP.
 * @param {String} REQUIRE The policy to gather ICE candidates for only RTP, which RTCP would share.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.RTCP_MUX_POLICY_ENUM = {
  NEGOTIATE: 'negotiate',
  REQUIRE: 'require'
};

/**
 * The enum of media bundle policies.
 * @attribute BUNDLE_POLICY_ENUM
 * @param {String} BALANCED The policy to switch to `MAX_COMPAT` or `MAX_BUNDLE` depending on remote Peer supports.
 * @param {String} MAX_COMPAT The policy to gather ICE candidates for each media type and media streams will flow in
 *   each individual ICE candidate connections.
 * @param {String} MAX_BUNDLE The policy to gather ICE candidates for one media type and media streams will flow in
 *   one ICE candidate connection.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.BUNDLE_POLICY_ENUM = {
  BALANCED: 'balanced',
  MAX_COMPAT: 'max-compat',
  MAX_BUNDLE: 'max-bundle'
};

/**
 * The enum of certificate algorithms.
 * @attribute CERTIFICATE_ENUM
 * @param {String} RSA The option to generate certificate with RSA-1024 algorithm.
 * @param {String} ECDSA The option to generate certificate with ECDSA algorithm.
 * @param {String} AUTO The option to use browser specified algorithm.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.CERTIFICATE_ENUM = {
  RSA: 'RSA',
  ECDSA: 'ECDSA',
  AUTO: 'auto'
};

/**
 * The enum of TURN transport types.
 * @attribute TURN_TRANSPORT_ENUM
 * @param {String} UDP The option to use UDP transport type.
 * @param {String} TCP The option to use TCP transport type.
 * @param {String} AUTO The option to use default transport type.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.TURN_TRANSPORT_ENUM = {
  UDP: 'udp',
  TCP: 'tcp',
  AUTO: 'auto'
};

/**
 * The enum of audio codecs.
 * @attribute AUDIO_CODEC_ENUM
 * @param {String} OPUS The option to prefer OPUS audio codec.
 * @param {String} ISAC The option to prefer ISAC audio codec.
 * @param {String} ILBC The option to prefer iLBC audio codec.
 * @param {String} G722 The option to prefer the G722 audio codec.
 * @param {String} PCMA The option to prefer the G711u audio codec.
 * @param {String} PCMU The option to prefer the G711a audio codec.
 * @param {String} AUTO The option to use browser specified audio codec.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.AUDIO_CODEC_ENUM = {
  ISAC: 'ISAC',
  OPUS: 'opus',
  ILBC: 'ILBC',
  G722: 'G722',
  PCMU: 'PCMU',
  PCMA: 'PCMA',
  AUTO: 'auto'
  //SILK: 'SILK'
};

/**
 * The enum of video codecs.
 * @attribute VIDEO_CODEC_ENUM
 * @param {String} VP8 The option to prefer the VP8 video codec.
 * @param {String} VP9 The option to prefer the VP9 video codec.
 * @param {String} H264 The option to prefer the H264 video codec.
 * @param {String} AUTO The option to use browser specified audio codec.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.VIDEO_CODEC_ENUM = {
  VP8: 'VP8',
  H264: 'H264',
  VP9: 'VP9',
  AUTO: 'auto'
  //H264UC: 'H264UC'
};

/**
 * The enum of Peer handshake states.
 * @attribute HANDSHAKE_STATE_ENUM
 * @param {String} ENTER The state when Peer has joined the Room.
 * @param {String} WELCOME The state when Peer acknowledges self has joined the Room.
 * @param {String} RESTART The state after `ENTER` or `WELCOME` when Peer wants to resend another offer
 *   to switch Stream object or restart ICE connection.
 * @param {String} OFFER The state when Peer sends an offer to start ICE connection.
 * @param {String} ANSWER The state when Peer responses an answer to self offer.
 * @param {String} ERROR The state when Peer connection fails to start, or set offer or answer.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.HANDSHAKE_STATE_ENUM = {
  ENTER: 'enter',
  WELCOME: 'welcome',
  RESTART: 'restart',
  OFFER: 'offer',
  ANSWER: 'answer',
  ERROR: 'error'
};

/**
 * The enum of Peer handshake error types.
 * @attribute HANDSHAKE_STATE_ERROR_TYPE_ENUM
 * @param {String} CREATE_PEER The error type when Peer fails to create connection.
 * @param {String} CREATE_OFFER The error type when Peer fails to create local offer.
 * @param {String} SET_LOCAL_OFFER The error type when Peer fails to set local offer.
 * @param {String} SET_REMOTE_OFFER The error type when Peer fails to set remote offer.
 * @param {String} CREATE_ANSWER The error type when Peer fails to create local answer.
 * @param {String} SET_LOCAL_ANSWER The error type when Peer fails to set local answer.
 * @param {String} SET_REMOTE_ANSWER The error type when Peer fails to set remote answer.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.HANDSHAKE_ERROR_TYPE_ENUM = {
  CREATE_PEER: 'createPeer',
  CREATE_OFFER: 'createOffer',
  SET_LOCAL_OFFER: 'setLocalOffer',
  SET_REMOTE_OFFER: 'setRemoteOffer',
  CREATE_ANSWER: 'createAnswer',
  SET_LOCAL_ANSWER: 'setLocalAnswer',
  SET_REMOTE_ANSWER: 'setRemoteAnswer'
};

/**
 * The enum of Peer ICE connection states.
 * @attribute ICE_CONNECTION_STATE_ENUM
 * @param {String} CONNECTING The state when ICE is connecting.
 * @param {String} CONNECTED The state when ICE has connected but is still finding for a better ICE candidate pairing.
 * @param {String} COMPLETED The state when ICE has connected and has already paired the best ICE candidate.
 * @param {String} FAILED The state when ICE has failed to connect.
 * @param {String} DISCONNECTED The state when ICE connection has been disconnected.
 * @param {String} CLOSED The state when ICE connection has closed.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.ICE_CONNECTION_STATE_ENUM = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  COMPLETED: 'completed',
  FAILED: 'failed',
  DISCONNECTED: 'disconnected',
  CLOSED: 'closed'
};

/**
 * The enum of Peer ICE gathering states.
 * @attribute ICE_GATHERING_STATE_ENUM
 * @param {String} GATHERING The state when ICE is still gathering.
 * @param {String} COMPLETD The state when ICE has completed gathering.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.ICE_GATHERING_STATE_ENUM = {
  GATHERING: 'gathering',
  COMPLETED: 'completed'
};

/**
 * The enum of Peer ICE gathering states.
 * @attribute SIGNALING_STATE_ENUM
 * @param {String} STABLE The state when no local or remote, offer or answer is expected.
 * @param {String} HAVE_LOCAL_OFFER The state when Peer has local offer and is expecting a remote answer to be set.
 * @param {String} HAVE_REMOTE_OFFER The state when Peer has remote offer and is expecting a local answer to be set.
 * @param {String} CLOSED The state when Peer exchanging of offer or answer has closed.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.SIGNALING_STATE_ENUM = {
  STABLE: 'stable',
  HAVE_LOCAL_OFFER: 'have-local-offer',
  HAVE_REMOTE_OFFER: 'have-remote-offer',
  CLOSED: 'closed'
  // HAVE_LOCAL_PRANSWER: 'have-local-pranswer
  // HAVE_REMOTE_PRANSWER: 'have-remote-pranswer
};

/**
 * The enum of {{#crossLink "Temasys.Peer/getStats:method"}}{{/crossLink}} states.
 * @attribute GET_STATS_STATE_ENUM
 * @param {String} LOADING The state when `getStats()` is retrieving stats.
 * @param {String} SUCCESS The state when `getStats()` has retrieved stats successfully.
 * @param {String} FAILED The state when `getStats()` has failed to retrieve stats.
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.GET_STATS_STATE_ENUM = {
	LOADING: 'loading',
  SUCCESS: 'success',
  FAILED: 'failed'
};

/**
 * The enum of Peer types.
 * @attribute TYPE_ENUM
 * @param {String} MCU The type when Peer is MCU Peer.
 * @param {String} P2P The type when Peer is MCU disabled Peer.
 * @param {String} MCU_RELAYED The type when Peer is MCU relayed Peer.
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.TYPE_ENUM = {
  MCU: 'MCU',
  // SIP: 'SIP',
  P2P: 'p2p',
  MCU_RELAYED: 'MCURelayed'
};

/**
 * The enum of Peer local ICE candidate (native `RTCIceCandidate` object) sending states.
 * @attribute CANDIDATE_SENT_STATE_ENUM
 * @param {String} GATHERED The state when the ICE candidate is gathered.
 * @param {String} DROPPED The state when the ICE candidate is dropped from sending.
 * @param {String} SENT The state when the ICE candidate is sent.
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.CANDIDATE_SENT_STATE_ENUM = {
  GATHERED: 'gathered',
  DROPPED: 'dropped',
  SENT: 'sent'
};

/**
 * The enum of Peer remote ICE candidate (native `RTCIceCandidate` object) processing states.
 * @attribute CANDIDATE_PROCESSING_STATE_ENUM
 * @param {String} Received The state when the ICE candidate is received.
 * @param {String} DROPPED The state when the ICE candidate is dropped from processing.
 * @param {String} PROCESSING The state when the ICE candidate is processing.
 * @param {String} PROCESSED The state when the ICE candidate has been processed
 *   and added to Peer connection successfully.
 * @param {String} FAILED The state when the ICE candidate has failed to process
 *   and add to Peer connection.
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.CANDIDATE_PROCESSING_STATE_ENUM = {
  RECEIVED: 'received',
  DROPPED: 'dropped',
  PROCESSING: 'processing',
  PROCESSED: 'processed',
  FAILED: 'failed'
};

/**
 * Function to retrieve Peer ICE candidates.
 * @method getCandidates
 * @return {JSON} [test] rere
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.getCandidates = function () {
};

/**
 * Function to retrieve Peer {{#crossLink "Temasys.Stream"}}Streams{{/crossLink}}.
 * @param getStreams
 * @return {JSON} [test] rere
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.getStreams = function () {
};

/**
 * Function to retrieve Datachannel connections.
 * @param getDatachannels
 * @return {JSON} [test] rere
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.getDatachannels = function () {
};

/**
 * Function to retrieve DTMF sender.
 * @param getDTMFSender
 * @return {JSON} [test] rere
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.getDTMFSender = function () {
};

/**
 * Function to retrieve Peer connection stats.
 * @method getStats
 * @param {Boolean} [isRaw=false] The flag to return native stats object instead of parsed stats.
 * @return {Promise} The Promise for function request completion.
 * @example
 *   peer.getStats().then(function (stats) {
 *     console.log("Received stats ->", stats);
 *   }).catch(function (error) {
 *     console.error("Received error ->", error);
 *   });
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.getStats = function (isRaw) {
};

/**
 * Function to set the {{#crossLink "Temasys.Stream"}}{{/crossLink}} object for this Peer.
 * @method setStream
 * @param {Temasys.Stream} [stream] The Stream object.
 * - To not send any Stream to this Peer, set the value to `null`.
 * @return {Promise} The Promise for function request completion.
 * @example
 *   peer.setStream(stream).then(function () {
 *     console.log("Set stream success.");
 *   }).catch(function (error) {
 *     console.error("Set stream error ->", error);
 *   });
 * @for Temasys.Peer
 * @since 0.7.0  
 */
Peer.prototype.setStream = function (stream) {
};

/**
 * Function to refresh Peer connection.
 * @method refresh
 * @param {Temasys.Stream} stream The stream object.
 * @param {Promise} _return Test.
 * @return {Promise} The Promise for function request completion.
 * @example
 *   peer.stream(options).then(function () {
 *     console.log("Send stream success ->");
 *   }).catch(function (error) {
 *     console.error("Received error ->", error);
 *   });
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.refresh = function (stream, options) {
};


/**
 * Function to send message to Peer.
 * 
 */
Peer.prototype.send = function (message, isP2P, fn) {
  var ref = this;
};
/**
 * Handles the client Room connection session in App space.
 * @class Temasys.Room
 * @param {JSON} options The options.
 * @param {String} options.appKey The App key ID.
 * @param {String} [options.name] The Room name in App space.
 * - When not provided, the value of the App key ID is used.
 * @param {Number} [options.initTimeout=1000] The timeout to wait before `Temasys.Room.init()` method
 *   should be invoked when `Temasys.Room` object is constructed.
 * - When provided as `-1`, the `Temasys.Room.init()` method will not be invoked, and the method has
 *   to be invoked first by app first before invoking `Temasys.Room.connect()` method.
 * @param {Boolean} [options.requireWebRTC=true] The flag if client requires WebRTC to be supported in
 *   order to start a Room connection session.
 * @param {String} [componentId] The unique component ID to use for `Temasys.Debugger` module or as
 *   for object identification.
 * - Please ensure that this value is unique from other class objects.
 * @constructor
 * @example
 * // Example 1: Create a Room object
 * var room = new Temasys.Room({
 *   appKey: myAppKey
 * });
 * room.on("initStateChange", function (state) {
 *   console.log("init() state ->", state);
 * });
 * 
 * // Example 2: Create a Room object but invoke `init()` manually.
 * var room = new Temasys.Room({
 *   appKey: myAppKey,
 *   initTimeout: -1
 * });
 * room.on("initStateChange", function (state) {
 *   console.log("init() state ->", state);
 * });
 * room.init();
 * @since 0.7.0
 */
Temasys.Room = function (options, componentId) {
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
   * Function to subscribe a callback function to an event once.
   * - Parameters follows `.once()` method in returned object of `Temasys.Utils.createEventManager()` method.
   * @method once
   * @for Temasys.Room
   * @since 0.7.0
   */
  ref.once = ref._eventManager.once;

  /**
   * Function to subscribe a callback function to an event.
   * - Parameters follows `.on()` method in returned object of `Temasys.Utils.createEventManager()` method.
   * @method on
   * @for Temasys.Room
   * @since 0.7.0
   */
  ref.on = ref._eventManager.on;

  /**
   * Function to unsubscribe a callback function to an event.
   * - Parameters follows `.off()` method in returned object of `Temasys.Utils.createEventManager()` method.
   * @method off
   * @for Temasys.Room
   * @since 0.7.0
   */
  ref.off = ref._eventManager.off;

  if (!(typeof options.initTimeout === 'number' && options.initTimeout === -1)) {
    setTimeout(function () {
      ref.init();
    }, typeof options.initTimeout === 'number' ? options.initTimeout : 1000);
  }

  /**
   * Event triggered when invoked `init()` method state has changed.
   * @event initStateChange
   * @param {Number} state The current state.
   * - This references the `INIT_STATE_ENUM` constant.
   * @param {JSON} [error] The error result.
   * - This is only defined when `state` is `INIT_STATE_ENUM.ERROR`.
   * @param {Error} [error.error] The error object.
   * @param {Number} [error.code] The error code.
   * - This references the `INIT_ERROR_CODE_ENUM` constant.
   * @for Temasys.Room
   * @since 0.7.0
   */
};

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
 * @param {Promise} return The promise for request completion.
 * @return {Promise}
 * @for Temasys.Room
 * @since 0.7.0
 */
Temasys.Room.prototype.init = function () {
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

/**
 * Handles the Room socket.io-client connection to the Signling server.
 * @class Temasys.Socket
 * @param {JSON} [options] The options.
 * @param {String} [options.server] @(exp) The custom Signaling server domain to use.
 * @param {Array} [options.ports] @(exp) The custom list of Signaling server ports (`Number`) to use.
 * - The priority of port used is based on first index order starting from `0`.
 * @param {String} [options.path] @(exp) The custom Signaling server path to use.
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
 * @param {JSON} options.options.index @(exp) The socket options for the `"index"` socket.io-client transport type.
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
   * Event triggered when {{#crossLink "Temasys.Socket/getStats:method"}}{{/crossLink}} state has changed.
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
/**
 * Handles the native `MediaStream` object audio and video tracks.
 * @class Temasys.Stream
 * @param {JSON|MediaStream} options The options.
 * - When provided as a native `MediaStream` object, only `1` track each for audio and video is allowed or
 *   the object is rejected. Note that audio and video constraints will not be retrieved and be counted as `true`.
 * @param {JSON|Boolean} [options.audio] The audio track options.
 * - When provided as a `Boolean`, it simply passes it as `true` as the native `getUserMedia()` API audio constraint.
 * @param {Boolean} [options.audio.echoCancellation=true] The flag to enable echo cancellation (AEC) when supported.
 * @param {JSON|String} [options.audio.sourceId] The audio track source ID to request.
 * - When provided as a `JSON`, it follows the native `getUserMedia()` API constraints.
 *   E.g. `sourceId: { exact: ..., ideal: ... }`.
 * - The list of available audio track sources can be obtained from
 *   {{#crossLink "Utils/Utils.Stream.getSources:method"}}{{/crossLink}}.
 * @param {Array} [options.audio.optional] @(exp) The native `getUserMedia()` API audio optional constraints.
 *   E.g. `optional: ({ xxx, xxx })`
 * @param {JSON|Boolean} [options.video] The video track options.
 * - When provided as a `Boolean`, it simply passes it as `true` as the native `getUserMedia()` API video constraint.
 * @param {JSON|String} [options.video.sourceId] The video track source ID to request.
 * - When provided as a `JSON`, it follows the native `getUserMedia()` API constraints.
 *   E.g. `sourceId: { exact: ..., ideal: ... }`.
 * - The list of available video track sources can be obtained from
 *   {{#crossLink "Utils/Utils.Stream.getSources:method"}}{{/crossLink}}.
 * @param {JSON|Number} [options.video.width] @(exp) The video track expected video frame resolution width.
 * - When provided as a `JSON`, it follows the native `getUserMedia()` API constraints.
 *   E.g. `width: { exact: ..., ideal: ..., min: ..., max: ... }`.
 * @param {JSON|Number} [options.video.height] @(exp) The video track expected video frame resolution height.
 * - When provided as a `JSON`, it follows the native `getUserMedia()` API constraints.
 *   E.g. `height: { exact: ..., ideal: ..., min: ..., max: ... }`.
 * @param {JSON|Number} [options.video.frameRate] @(exp) The video track expected video framerate (fps).
 * - When provided as a `JSON`, it follows the native `getUserMedia()` API constraints.
 *   E.g. `frameRate: { exact: ..., ideal: ..., min: ..., max: ... }`.
 * @param {JSON|Number} [options.video.facingMode] @(exp) The video track expected video camera facing mode.
 * - When provided as a `JSON`, it follows the native `getUserMedia()` API constraints.
 *   E.g. `facingMode: { exact: ..., ideal: ..., min: ..., max: ... }`.
 * @param {Array|String|Boolean} [options.video.screenshare] @(exp) The flag if video track is screensharing source.
 * - When provided as an `Array` or a `String`, it follows the native `getUserMedia()` API `"mediaSource"` constraints.
 *   E.g. `mediaSource: options.video.screenshare`.
 * - If this is defined (not as `false`), the native `getUserMedia()` API might be executed twice for audio track and
 *   video track separately.
 * @param {JSON} [options.custom] @(exp) The custom native `getUserMedia()` API constraints to use.
 *   E.g. `custom: { audio: { ... }, video: { ... } }`.
 * - If this is defined, this will override all `options.audio` and `options.video` settings.
 * @constructor
 * @example
 *   // Example 1: Retrieve audio and video tracks
 *   var stream = new Temasys.Stream({ audio: true, video: true });
 *   stream.on("state", function (state) {
 *     if (state === stream.STATE_ENUM.START) {
 *       stream.attachElement(videoDOM);
 *     } else if (state === stream.STATE_ENUM.ERROR) {
 *       console.log("Failed retrieving stream ->", error);
 *     }
 *   });
 *
 *   // Example 2: Append the MediaStream object
 *   var stream = new Temasys.Stream(stream);
 *   stream.on("state", function (state) {
 *     if (state === stream.STATE_ENUM.START) {
 *       stream.attachElement(videoDOM);
 *     } else if (state === stream.STATE_ENUM.ERROR) {
 *       console.log("Failed retrieving stream ->", error);
 *     }
 *   });
 * @for Temasys
 * @since 0.7.0
 */
function Stream (options) {
	/**
	 * The Stream ID. 
	 * @attribute id
	 * @type String
	 * @readOnly
	 * @for Temasys.Stream
	 * @since 0.7.0
	 */
	this.id = null;

	/**
	 * The flag if Stream is from self or not.
	 * @attribute remote
	 * @type Boolean
	 * @readOnly
	 * @for Temasys.Stream
	 * @since 0.7.0
	 */
	this.remote = false;

	/**
	 * The Stream settings. 
	 * @attribute settings
	 * @param {JSON|Boolean} audio The audio track constraints settings.
	 * - The value follows the `options.audio` (or `options.custom.audio`) parameter passed in the constructor
	 *   except for the `.id`.
	 * @param {String} audio.id The audio track ID.
	 * @param {JSON|Boolean} video The video track constraints settings.
	 * - The value follows the `options.video` (or `options.custom.video`) parameter passed in the constructor
	 *   except for the `.id`.
	 * @param {String} video.id The video track ID.
	 * @type JSON
	 * @readOnly
	 * @for Temasys.Stream
	 * @since 0.7.0
	 */
	this.settings = {
		audio: false,
		video: false
	};

	/**
	 * The Stream current states.
	 * @attribute $current
	 * @type JSON
	 * @param {JSON} tracks The current Stream tracks states.
	 * @param {JSON} tracks.audio The current Stream audio track states.
	 * @param {Boolean} tracks.audio.muted The flag if Stream audio track is muted.
	 * @param {String} tracks.audio.state The current Stream audio track active state.
	 * - See {{#crossLink "Temasys.Stream/TRACK_STATE_ENUM:attribute"}}{{/crossLink}} for reference.
	 * @param {Boolean} tracks.audio.active The flag if Stream video track is active.
	 * @param {JSON} tracks.video The current Stream video track states.
	 * @param {Boolean} tracks.video.muted The flag if Stream video track is muted.
	 * @param {String} tracks.video.state The current Stream video track active state.
	 * - See {{#crossLink "Temasys.Stream/TRACK_STATE_ENUM:attribute"}}{{/crossLink}} for reference.
	 * @param {Boolean} tracks.video.active The flag if Stream video track is active.
	 * @param {String} state The current Stream active state.
	 * - See {{#crossLink "Temasys.Stream/STATE_ENUM:attribute"}}{{/crossLink}} for reference.
	 * @param {Boolean} active The flag if Stream is active.
	 * @for Temasys.Stream
	 * @since 0.7.0
	 */
	this.$current = {
		tracks: {
			audio: { active: false, muted: false, state: null },
			video: { active: false, muted: false, state: null }
		},
		state: null,
		active: false
	};

	/**
	 * Event triggered when Stream active state has been changed.
	 * @event stateChange
	 * @param {String} state The current Stream active state.
	 * - See {{#crossLink "Temasys.Stream/STATE_ENUM:attribute"}}{{/crossLink}} for reference.
	 * @for Temasys.Stream
	 * @since 0.7.0
	 */
	/**
	 * Event triggered when Stream track active state has been changed.
	 * @event trackStateChange
	 * @param {String} state The current Stream track active state.
	 * - See {{#crossLink "Temasys.Stream/TRACK_STATE_ENUM:attribute"}}{{/crossLink}} for reference.
	 * @param {String} type The Stream track type.
	 * - Available values for identification are: `"audio"` for audio track and `"video"` for video track.
	 * @param {String} trackId The Stream track ID.
	 * @for Temasys.Stream
	 * @since 0.7.0
	 */
	/**
	 * Event triggered when Stream track muted state has been changed.
	 * @event mutedStateChange
	 * @param {Boolean} muted The flag if Stream track is muted.
	 * @param {String} type The Stream track type.
	 * - Available values for identification are: `"audio"` for audio track and `"video"` for video track.
	 * @param {String} trackId The Stream track ID.
	 * @for Temasys.Stream
	 * @since 0.7.0
	 */
	/**
   * Event triggered when there are exceptions thrown in this event handlers.
   * @event domError
   * @param {Error} error The error object.
   * @for Temasys.Stream
   * @since 0.7.0
   */
}

/**
 * The enum of Stream active states.
 * @attribute STATE_ENUM
 * @param {String} START The state when Stream has been retrieved or initialised successfully and is active.
 * @param {String} STOP The state when Stream is not longer active.
 * @param {String} ERROR The state when Stream had failed to retrieve or initilaise successfully.
 * @readOnly
 * @final
 * @for Temasys.Stream
 * @since 0.7.0
 */
Stream.prototype.STATE_ENUM = {
	START: 'start',
	STOP: 'stop',
	ERROR: 'error'
};

/**
 * The enum of Stream track active states.
 * @attribute TRACK_STATE_ENUM
 * @param {String} START The state when Stream track has been initialiseda and is active.
 * @param {String} STOP The state when Stream track is not longer active.
 * @param {String} DEVICE_MUTED The state when Stream track streaming is muted by device not by client.
 * @param {String} DEVICE_UNMUTED The state when Stream track streaming is unmuted by device not by client.
 * @readOnly
 * @final
 * @for Temasys.Stream
 * @since 0.7.0
 */
Stream.prototype.TRACK_STATE_ENUM = {
	START: 'start',
	STOP: 'stop',
	DEVICE_MUTED: 'deviceMuted',
	DEVICE_UNMUTED: 'deviceUnmuted'
};

/**
 * Function to attach Stream audio and video tracks to the `<video>` or `<audio>` DOM elements.
 * @method attachElement
 * @param {DOM} element The `<video>` or `<audio>` DOM element.
 * @param {JSON} [options] The options.
 * @param {Boolean} [options.audio=true] The flag if the Stream audio track should be appended to the element.
 * @param {Boolean} [options.video=true] The flag if the Stream video track should be appended to the element. 
 * @example
 *   var stream = new Temasys.Stream({ audio: true, video: true });
 *   stream.on("stateChange", function (state) {
 *     if (state === stream.STATE_ENUM.START) {
 *       stream.attachElement(videoDOM);
 *     }
 *   });
 * @for Temasys.Stream
 * @since 0.7.0
 */
Stream.prototype.attachElement = function (element, options) {
};

/**
 * Function to mute Stream audio and video tracks.
 * @method muteTracks
 * @param {JSON} [options] The options.
 * @param {Boolean} [options.audio] The flag if the Stream audio track should be muted.
 * @param {Boolean} [options.video] The flag if the Stream video track should be muted.
 * @return {Promise} The Promise for function request completion.
 * @example
 *   var stream = new Temasys.Stream({ audio: true, video: true });
 *   stream.on("stateChange", function (state) {
 *     if (state === stream.STATE_ENUM.START) {
 *       stream.muteTracks().then(function (mutedStatus) {
 *         console.log("Audio muted ->", mutedStatus.audio);
 *         console.log("Video muted ->", mutedStatus.video);
 *       }).catch(function (error, mutedStatus) {
 *         console.error("Failed muting ->", error);
 *         console.error("Audio muted (current) ->", mutedStatus.audio);
 *         console.error("Video muted (current) ->", mutedStatus.video);
 *       });
 *     }
 *   });
 * @for Temasys.Stream
 * @since 0.7.0
 */
Stream.prototype.muteTracks = function (options) {
};

/**
 * Function to stop Stream audio and video tracks.
 * @method stopTracks
 * @param {JSON} [options] The options.
 * @param {Boolean} [options.audio=true] The flag if the Stream audio track should be stopped.
 * @param {Boolean} [options.audio=true] The flag if the Stream audio track should be stopped.
 * @return {Promise} The Promise for function request completion.
 * @example 
 *   stream.stopTracks().then(function (activeStatus) {
 *     console.log("Audio active ->", activeStatus.audio);
 *     console.log("Video active ->", activeStatus.video);
 *   }).catch(function (error, activeStatus) {
 *     console.error("Failed stopping tracks ->", error);
 *     console.error("Audio active (current) ->", activeStatus.audio);
 *     console.error("Video active (current) ->", activeStatus.video);
 *   });
 * @for Temasys.Stream
 * @since 0.7.0
 */
Stream.prototype.stopTracks = function (options) {
};
/**
 * Handles the utility functionalities used internally.
 * @class Temasys.Utils
 * @since 0.7.0
 * @typedef module
 */
Temasys.Utils = {
  /**
   * Function that creates an event emitter manager.
   * @method createEventManager
   * @param {JSON} return The event manager functions.
   * @param {Function} return.once Function to subscribe a callback function to an event once.
   * @param {String} return.once.eventName The event name.
   * @param {Function} return.once.fn The callback function.
   * @param {Function} [return.once.fnCondition] The condition function that is invoked
   *   each time event is emitted, and once the condition function returns `true`, the callback function is invoked.
   * - When not provided, the value is `function () { return true; }`.
   * @param {Boolean} [return.once.persistent=false] The flag if callback function should be invoked
   *   each time the condition function is met.
   * - When not provided as `true`, the callback function will only be invoked once the condition is met.
   * @param {Function} return.on Function to subscribe a callback function to an event.
   * @param {String} return.on.eventName The event name.
   * @param {Function} return.on.fn The callback function.
   * @param {Function} return.off Function to unsubscribe a callback function to an event.
   * @param {String} [return.off.eventName] The event name.
   * - When not provided, every callback functions will be unsubscribe to every events.
   * @param {Function} [return.off.fn] The callback function.
   * - When not provided, every callback functions related to the event will be unsubscribed.
   * @param {Function} [return.catchExceptions] Function to catch any errors thrown in callback functions.
   * @param {Function} [return.catchExceptions.fn]  The exception function that is invoked
   *   each time an exception is caught.
   * - When not provided as a type of `Function`, any exceptions will be thrown in the callback functions
   *   and not be caught.
   * @param {Function} return.emit Function to emit an event.
   * @param {String} return.emit.eventName The event name.
   * - Parameters after it would be considered the event callback function parameter payloads.
   *   E.g. `.emit("test", a, b, c)` would result in `.on("test", function (a, b, c) { .. })`
   * @return {JSON}
   * @example
   * // Create the event manager
   * var manager = Temasys.Utils.createEventManager;
   * var offCbFn = function () {
   *   console.log("D");
   * };
   *
   * // Subscribe to an event
   * manager.on("test", function () {
   *   console.log("A");
   * });
   * manager.once("test", function () {
   *   console.log("B");
   * });
   * manager.on("test", function () {
   *   console.log("C");
   * });
   * manager.on("test", offCbFn);
   *
   * // Emit the event - Results: A, B, C, D
   * manager.emit("test");
   *
   * // Emit the event (2) - Results: A, C, D
   * manager.emit("test");
   *
   * // Unsubscribe to an event for a specific callback function
   * manager.on("test", offCbFn);
   *
   * // Emit the event - Results: A, C
   * manager.emit("test");
   * 
   * // Subscribe to various events
   * manager.on("test2", function () {
   *   console.log("E");
   * });
   * manager.on("test2", function () {
   *   console.log("F");
   * });
   * manager.on("test3", function () {
   *   console.log("G");
   * });
   * manager.on("test4", function () {
   *   console.log("H");
   * });
   *
   * // Emit the events - Results: A, C, E, F, G, H
   * manager.emit("test");
   * manager.emit("test2");
   * manager.emit("test3");
   * manager.emit("test4");
   *
   * // Unsubscribe to an event
   * manager.off("test");
   *
   * // Emit the events - Results: E, F, G, H
   * manager.emit("test");
   * manager.emit("test2");
   * manager.emit("test3");
   * manager.emit("test4");
   *
   * // Unsubscribe to all events
   * manager.off();
   *
   * // Emit the events - Results: None
   * manager.emit("test");
   * manager.emit("test2");
   * manager.emit("test3");
   * manager.emit("test4");
   *
   * // Catch exceptions in event handlers
   * manager.on("error", function () {
   *   throw new Error("test");
   * });
   * manager.catchExceptions(function (error) {
   *   console.log(error);
   * });
   *
   * // Emit the event - Results: "test"
   * manager.emit("error");
   *
   * // Subscribe with condition that invokes once condition is met
   * manager.once("test", function () {
   *   console.log("I");
   * }, function (current) {
   *   return current > 3;
   * });
   *
   * // Subscribe with condition that invokes every time condition is met
   * manager.once("test", function () {
   *   console.log("J");
   * }, function (current) {
   *   return current > 2;
   * }, true);
   *
   * // Emit the event > current: 0 - Results: None
   * manager.emit("test", 0);
   *
   * // Emit the event > current: 3 - Results: J
   * manager.emit("test", 3);
   *
   * // Emit the event > current: 4 - Results: I, J
   * manager.emit("test", 4);
   *
   * // Emit the event > current: 5 - Results: J
   * manager.emit("test", 5);
   * @for Temasys.Utils
   * @since 0.7.0
   */
  createEventManager: function () {
    // Listeners
    var listeners = { once: [], on: [], catch: null };

    /**
     * Function that handles caught errors.
     */
    var fnCatch = function (error) {
      if (typeof listeners.catch === 'function') {
        return listeners.catch(error);
      }
      throw error;
    };

    return {
      /**
       * Function that returns the documented `.on()` method.
       */
      on: function (eventName, fn) {
        if (typeof fn !== 'function') {
          return fnCatch(new Error('Please provide a valid callback'));
        }

        if (!Array.isArray(listeners.on[eventName])) {
          listeners.on[eventName] = [];
        }

        listeners.on[eventName].push(fn);
      },

      /**
       * Function that returns the documented `.once()` method.
       */
      once: function (eventName, fn, fnCondition, persistent) {
        if (typeof fn !== 'function') {
          return fnCatch(new Error('Please provide a valid callback'));
        }

        if (typeof fnCondition === 'boolean') {
          persistent = fnCondition;
        }

        if (!Array.isArray(listeners.once[eventName])) {
          listeners.once[eventName] = [];
        }

        listeners.once[eventName].push([fn, typeof fnCondition === 'function' ?
          fnCondition : function () { return true; }, persistent === true]);
      },

      /**
       * Function that returns the documented `.off()` method.
       */
      off: function (eventName, fn) {
        if (typeof eventName === 'string') {
          // Unsubscribe single callback listener
          if (typeof fn === 'function') {
            if (Array.isArray(listeners.on[eventName])) {
              Temasys.Utils.forEach(listeners.on[eventName], function (fnItem, i) {
                if (fnItem === fn) {
                  listeners.on[eventName].splice(i, 1);
                  return -1;
                }
              });
            }

            if (Array.isArray(listeners.once[eventName])) {
              Temasys.Utils.forEach(listeners.once[eventName], function (fnItem, i) {
                if (fnItem[0] === fn) {
                  listeners.once[eventName].splice(i, 1);
                  return -1;
                }
              });
            }
          // Unsubscribe all callback listeners tied to event
          } else {
            listeners.on[eventName] = [];
            listeners.once[eventName] = [];
          }
        // Unsubscribe all callback listeners from all events
        } else {
          listeners.on = {};
          listeners.once = {};
        }
      },

      /**
       * Function that returns the documented `.catch()` method.
       */
      catchExceptions: function (fn) {
        listeners.catch = typeof fn === 'function' ? fn : null;
      },

      /**
       * Function that returns the documented `.emit()` method.
       */
      emit: function (eventName) {
        try {
          var params = Array.prototype.slice.call(arguments);
          params.shift();

          // Trigger `on()` event handler
          if (Array.isArray(listeners.on[eventName])) {
            Temasys.Utils.forEach(listeners.on[eventName], function (fnItem) {
              fnItem.apply(this, params);
            });
          }
          // Trigger `once()` event handler
          if (Array.isArray(listeners.once[eventName])) {
            Temasys.Utils.forEach(listeners.once[eventName], function (fnItem, i) {
              if (fnItem[1].apply(this, params)) {
                fnItem[0].apply(this, params);
                // Check if `persistent`
                if (fnItem[2] !== true) {
                  listeners.once[eventName].splice(i, 1);
                  return 0;
                }
              }
            });
          }
        } catch (error) {
          fnCatch(error);
        }
      }
    };
  },

  /**
   * Function that loops an object.
   * @method forEach
   * @param {Array|JSON} object The object.
   * @param {Function} fn The callback function invoked for each object item looped.
   * - To break the function loop, return `true`.
   * - To increment or decrement loop, return the `Number`, and be careful of using it to prevent infinite loops.
   * @param {Any} fn.item The object item.
   * @param {Number|String} fn.index The object item index or property key.
   * @example
   * // Example 1: Loop Array - Results: a 1, b 2, c 3
   * Temasys.Utils.forEach(["a", "b", "c"], function (item, index) {
   *   console.log(item, index);
   * });
   *
   * // Example 2: Loop JSON - Results: 1 a, 2 b, 3 c
   * Temasys.Utils.forEach({ a: 1, b: 2, c: 3 }, function (item, prop) {
   *   console.log(item, prop);
   * });
   * @for Temasys.Utils
   * @since 0.7.0
   */
  forEach: function (object, fn) {
    if (Array.isArray(object)) {
      var index = 0;
      while (index < object.length) {
        var res = fn(object[index], index);
        if (res === true) {
          break;
        } else if (typeof res === 'number') {
          index += res;
        } else {
          index++;
        }
      }
    } else if (object && typeof object === 'object') {
      for (var prop in object) {
        if (object.hasOwnProperty(prop)) {
          if (fn(object[prop], prop) === true) {
            break;
          }
        }
      }
    }
  },

  /**
   * Function that copies an object to remove pointer reference.
   * @method copy
   * @param {Array|JSON} object The object.
   * @param {Array|JSON} return The copied object.
   * @return {Array|JSON}
   * @example
   * // Example 1: Copy an Array - Results: [1, 2, 3]
   * var copyArray = Temasys.Utils.copy([1,2,3]);
   *
   * // Example 2: Copy a JSON - Results: { a: "0", b: "1", c: "2" }
   * var copyJSON = Temasys.Utils.copy({
   *   a: "0",
   *   b: "1",
   *   c: "2"
   * });
   * @for Temasys.Utils
   * @since 0.7.0
   */
  copy: function (object) {
    if (typeof object === 'object' && object !== null) {
      try {
        if (Array.isArray(object)) {
          return object.concat([]);
        } else {
          // Not the best performant but "fastest"
          return JSON.parse(JSON.stringify(object));
        }
      } catch (error) {
        return object;
      }
    }
    return object;
  },

  /**
   * Function that extends an object to another object.
   * - Note that conflicting properties will be overwritten.
   * @method extend
   * @param {JSON} object The object.
   * @param {JSON} extendObject The object to extend.
   * @param {JSON} return The extended object.
   * @return {JSON}
   * @example
   * // Example: Extend a JSON - Results: { a: 1, b: 2, c: 3 }
   * var extended = Temasys.Utils.extend({
   *   a: 1,
   *   b: 2
   * }, {
   *   c: 3
   * });
   * @for Temasys.Utils
   * @since 0.7.0
   */
  extend: function (object, extendObject) {
    if (typeof object === 'object' && object !== null) {
      var result = Temasys.Utils.copy(object);
      if (typeof extendObject === 'object' && extendObject !== null) {
        Temasys.Utils.forEach(Temasys.Utils.copy(extendObject), function (item, prop) {
          result[prop] = item;
        });
      }
      return result;
    }
    return {};
  },

  /**
   * Function that generates an unique identifier (UUID).
   * @method generateUUID
   * @example
   * // Example: Generate an UUID
   * var uuid = Temasys.Utils.generateUUID();
   * @for Temasys.Utils
   * @since 0.7.0
   */
  /* jshint ignore:start */
  generateUUID: function () {
    var d = new Date().getTime();

    if (performance && typeof performance.now === 'function'){
      d += performance.now(); //use high-precision timer if available
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  },
  /* jshint ignore:end */

  /**
   * Function that checks if the required dependencies or API is loaded.
   * @method checkDependencies
   * @param {JSON} return The result.
   * @param {JSON} return.current The current supports.
   * @param {String} [return.current.adapterjs] The AdapterJS dependency version.
   * - When AdapterJS dependency is not loaded, the value returned is `null`.
   * - Note that only `0.13.0` versions and above will be detected.
   * @param {Boolean} [return.current.io] The flag if socket.io-client dependency is loaded.
   * @param {Boolean} [return.current.xmlhttprequest] The flag if XMLHttpRequest API is available.
   * @param {JSON} return.recommended The recommended dependencies versions.
   * @param {String} return.recommended.adapterjs The recommended AdapterJS dependency version.
   * @param {String} return.recommended.io The recommended socket.io-client dependency version.
   * @return {JSON}
   * @example
   * // Example: Get the current dependencies and recommended versions
   * var result = Temasys.Utils.checkDependencies();
   * console.log("Current ->", result.current);
   * console.log("Recommended ->", result.recommended);
   * @for Temasys.Utils
   * @since 0.7.0
   */
  checkDependencies: function () {
    return {
      current: {
        adapterjs: _globals.AdapterJS && typeof _globals.AdapterJS === 'object' &&
          typeof _globals.AdapterJS.webRTCReady === 'function' ? _globals.AdapterJS.VERSION :
          (window.AdapterJS && typeof window.AdapterJS === 'object' &&
          typeof window.AdapterJS.webRTCReady === 'function' ? window.AdapterJS.VERSION : null),
        io: !!((_globals.io && typeof _globals.io === 'function') || (window.io && typeof window.io === 'function')),
        xmlhttprequest: typeof window.XMLHttpRequest === 'function'
      },
      recommended: {
        adapterjs: '@@adapterjsVersion',
        io: '@@socketIoVersion'
      }
    };
  },

  /**
   * Function that gets the client browser supports.
   * @method getBrowserSupports
   * @param {Promise} return The Promise for the request result.
   * @param {Function} return.then Function to subscribe to when request result is successful.
   * @param {Function} return.then.fn The callback function.
   * @param {JSON} return.then.fn.supports The supports.
   * @param {Boolean} 
   * @param {Function} return.catch Function to subscribe to when request result had failed.
   * @param {Function} return.catch.fn The callback function.
   * @param {Error} return.catch.fn.error The error object.
   * @example
   * // Example: Get the supports
   * Temasys.Utils.getBrowserSupports().then(function (supports) {
   *   console.log("Browser supports ->", supports);
   * }).catch(function (error) {
   *   console.log("Browser supports retrieval error ->", error);
   * });
   * @for Temasys.Utils
   * @since 0.7.0
   */
  getBrowserSupports: function () {
    /*return new Promise(function (resolve, reject) {
      if (!Temasys.Utils.checkDependencies().current.adapterjs) {
        return reject(new Error('Unable to retrieve WebRTC supports as AdapterJS dependency is not loaded'));
      }

      (_globals.AdapterJS || window.AdapterJS).webRTCReady(function () {
        var result = {
          current: {},
          recommended: {}
        };

        // Set the browser information
        result.current.browser = {
          name: window.webrtcDetectedBrowser,
          version: (window.webrtcDetectedVersion || 0).toString(),
          platform: navigator.platform,
          mobilePlatformVersion: null
        };

        // Set the WebRTC plugin information later..
        result.current.webrtcPlugin = {
          required: false,
          active: false,
          version: null,
          company: null,
          expirationDate: null,
          screensharing: false
        };

        

          current: {
            browser: {
              
            },
            webrtcPlugin: {
              
            },
            supports: {
              webrtc: {
                connection: false,
                datachannel: window.webrtcDetectedBrowser !== 'edge',
                iceRestart: !((window.webrtcDetectedBrowser === 'firefox' && window.webrtcDetectedVersion < 48) ||
                  window.webrtcDetectedBrowser === 'edge'),
                screensharing: ['chrome', 'firefox'].indexOf(window.webrtcDetectedBrowser) > -1,
                maxBandwidth: !((window.webrtcDetectedBrowser === 'firefox' && window.webrtcDetectedVersion < 49) ||
                  window.webrtcDetectedBrowser === 'edge'),
                turns: ['IE', 'safari', 'chrome', 'opera'].indexOf(window.webrtcDetectedBrowser) > -1,
                codecs: {
                  send: { audio: {}, video: {} },
                  recv: { audio: {}, video: {} }
                }
              },
              corsRequest: window.webrtcDetectedBrowser === 'IE' && [8,9].indexOf(window.webrtcDetectedVersion) > -1 ?
                ['object', 'function'].indexOf(typeof window.XDomainRequest) > -1 :
                typeof window.XMLHttpRequest === 'function'
            }
          },
          requirements: {
            browsers: {
              chrome: {
                minVersion: '52',
                maxVersion: null,
                minMobilePlatformVersion: null,
                maxMobilePlatformVersion: null
              },
              firefox: {
                minVersion: '48',
                maxVersion: null,
                minMobilePlatformVersion: null,
                maxMobilePlatformVersion: null
              },
              opera: {
                minVersion: '38',
                maxVersion: null,
                minMobilePlatformVersion: null,
                maxMobilePlatformVersion: null
              },
              IE: {
                minVersion: '9',
                maxVersion: null,
                minMobilePlatformVersion: null,
                maxMobilePlatformVersion: null
              },
              safari: {
                minVersion: '7',
                maxVersion: null,
                minMobilePlatformVersion: null,
                maxMobilePlatformVersion: null
              },
              edge: {
                minVersion: '14.14352',
                maxVersion: null,
                minMobilePlatformVersion: null,
                maxMobilePlatformVersion: null
              },
              bowser: {
                minVersion: '0.6.1',
                maxVersion: null,
                minMobilePlatformVersion: null,
                maxMobilePlatformVersion: '0.9'
              }
            },
            webrtcPlugin: {
              minVersion: '0.8.869',
              maxVersion: null
            }
          }
        }
      });
    });*/
  }
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
    _globals.Skylink = Skylink;
    _globals.SkylinkLogs = SkylinkLogs;
    _globals.Temasys = {
      Room: Room,
      Utils: Utils
    };
  }

})(this);