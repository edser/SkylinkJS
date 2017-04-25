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
   * Function that gets the client browser current and recommended version supports.
   * @method getClientSupports
   * @param {Promise} return The Promise for the request result.
   * @param {Function} return.then Function to subscribe to when request result is successful.
   * @param {Function} return.then.fn The callback function.
   * @param {JSON} return.then.fn.result The result.
   * @param {JSON} return.then.fn.result.current The current versions and supports.
   * @param {JSON} return.then.fn.result.current.browser The browser information.
   * @param {String} return.then.fn.result.current.browser.name The browser name.
   * @param {String} return.then.fn.result.current.browser.version The browser version.
   * @param {String} return.then.fn.result.current.browser.platform The browser platform.
   * @param {String} [return.then.fn.result.current.browser.mobilePlatformVersion] The browser mobile platform version
   *   if the client is accessing from Android and iOS mobile devices.
   * @param {JSON} [return.then.fn.result.current.dependencies] The dependencies loaded.
   * @param {String} [return.then.fn.result.current.dependencies.adapterjs] The loaded AdapterJS dependency version.
   * - This is defined only for when the AdapterJS dependency versions `0.13.0` and above is loaded.
   * - Note that this is required for starting `Temasys.Room` session connections.
   * @param {Boolean} [return.then.fn.result.current.dependencies.io] The flag if the socket.io-client dependency is loaded.
   * - Note that this is required for starting `Temasys.Room` session connections.
   * @param {JSON} [return.then.fn.result.current.webrtcPlugin] The WebRTC plugin information.
   * - This is defined only when the WebRTC plugin is loaded for the current accessing webpage, which is loaded from
   *   the AdapterJS dependency.
   * - For more advanced usage of the WebRTC plugin, see https://confluence.temasys.com.sg/display/TWT/Useful+debug+APIs.
   * @param {Boolean} return.then.fn.result.current.webrtcPlugin.active The flag if the WebRTC plugin is active.
   * - This determines if the WebRTC and `getUserMedia()` API functionalities is enabled.
   * - It is also advisable to check if the plugin `<object>` element css `display` is set to `"none"` as the
   *   `display` property must be displayed in order for the plugin to load, which is some cases the WebRTC plugin is active
   *   but disabled (hence made inactive) because of the `display` css settings. To prevent displaying the plugin
   *   `<object>` element, you may set the css `visibility` to `"hidden"` and use `z-index` properties to cover it.
   * @param {String} return.then.fn.result.current.webrtcPlugin.version The WebRTC plugin version.
   * @param {String} return.then.fn.result.current.webrtcPlugin.company The WebRTC plugin company name it is built for.
   * @param {String} [return.then.fn.result.current.webrtcPlugin.expirationDate] The WebRTC plugin expiration date if any.
   * @param {JSON} [return.then.fn.result.current.webrtcPlugin.whiteList] The WebRTC plugin whitelist settings.
   * - This is defined only when whitelisting is configured for the WebRTC plugin.
   * @param {JSON} return.then.fn.result.current.webrtcPlugin.whiteList.enabled The flag if current accessing domain
   *   is configured in the list of whitelisted domains for the WebRTC plugin.
   * @param {Boolean} return.then.fn.result.current.webrtcPlugin.whiteList.restrictsUsage The flag that disables the
   *   WebRTC and `getUserMedia()` API for the WebRTC plugin unless current accessing domain is configured
   *   in the list of whitelisted domains.
   * @param {Boolean} return.then.fn.result.current.webrtcPlugin.whiteList.restrictsFeatures The flag that disables the
   *   `webrtcPlugin.features` for the WebRTC plugin unless current accessing domain is configured in the
   *   list of whitelisted domains.
   * @param {JSON} return.then.fn.result.current.webrtcPlugin.features The WebRTC plugin features supports.
   * - The enabling of these features are determined based on the WebRTC plugin pricing plan selected.
   * @param {Boolean} return.then.fn.result.current.webrtcPlugin.features.crashReporter The flag if
   *   the crash reporter is enabled for the WebRTC plugin.
   * @param {Boolean} return.then.fn.result.current.webrtcPlugin.features.autoUpdate The flag if
   *   auto updating of the plugin is enabled for the WebRTC plugin.
   * @param {Boolean} return.then.fn.result.current.webrtcPlugin.features.screensharing The flag if
   *   screensharing functionalities is enabled for the WebRTC plugin.
   * @param {Boolean} return.then.fn.result.current.webrtcPlugin.features.h264 The flag if
   *   H264 video codec is enabled for the WebRTC plugin.
   * @param {Boolean} return.then.fn.result.current.webrtcPlugin.features.httpProxy The flag if
   *   connections behind HTTP proxy is enabled for the WebRTC plugin.
   * @param {Boolean} return.then.fn.result.current.webrtcPlugin.features.noPermissionPopup The flag if
   *   permission popup is disabled for the WebRTC plugin when invoking `getUserMedia()` API method.
   * @param {Boolean} return.then.fn.result.current.webrtcPlugin.features.experimentalAEC The flag if
   *   experimental AEC (acoustic echo cancellation) is enabled for the WebRTC plugin.
   * @param {JSON} return.then.fn.result.current.supports The browser supports.
   * @param {JSON} return.then.fn.result.current.supports.webrtc The WebRTC and `getUserMedia()` API supports.
   * @param {Boolean} return.then.fn.result.current.supports.webrtc.connection The flag if `RTCPeerConnection` API is supported.
   * @param {Boolean} return.then.fn.result.current.supports.webrtc.datachannel The flag if `RTCDataChannel` API is supported.
   * @param {Boolean} return.then.fn.result.current.supports.webrtc.dtmfsender The flag if `RTCDTMFSender` API is supported.
   * @param {Boolean} return.then.fn.result.current.supports.webrtc.generateCertificate The flag if
   *   `RTCPeerConnection.generateCertificate` API is supported.
   * @param {Boolean} return.then.fn.result.current.supports.webrtc.iceRestart The flag if ICE credentials restart is supported.
   * @param {Boolean} return.then.fn.result.current.supports.webrtc.maxBandwidth The flag if maximum sending bandwidth
   *   limitations (`b=AS` or `b=TIAS` flags) is supported.
   * @param {Boolean} return.then.fn.result.current.supports.webrtc.turns The flag if TURN over TLS protocol is supported
   *   when connecting to TURN server.
   * @param {Boolean} return.then.fn.result.current.supports.webrtc.stun The flag if STUN connections is supported.
   * @param {Boolean} return.then.fn.result.current.supports.webrtc.turn The flag if TURN connections is supported.
   * @param {Boolean} return.then.fn.result.current.supports.webrtc.turnOverTcp The flag if TURN connections over TCP IP
   *   protocol is supported.
   * @param {Boolean} return.then.fn.result.current.supports.webrtc.turnOverUdp The flag if TURN connections over UDP IP
   *   protocol is supported.
   * @param {Boolean} return.then.fn.result.current.supports.webrtc.screensharing The flag if screensharing functionalities
   *   is supported.
   * @param {JSON} return.then.fn.result.current.supports.webrtc.codecs The list of codecs supported.
   * @param {JSON} return.then.fn.result.current.supports.webrtc.codecs.send The sending codecs.
   * @param {JSON} return.then.fn.result.current.supports.webrtc.codecs.send.audio The sending audio codecs.
   * @param {JSON} return.then.fn.result.current.supports.webrtc.codecs.send.audio._codecName The codec information.
   * - The property key (`#codeName`) value is the codec name.
   * @param {Number} return.then.fn.result.current.supports.webrtc.codecs.send.audio._codecName.payloadType The
   *   codec payload number.
   * @param {Number} return.then.fn.result.current.supports.webrtc.codecs.send.audio._codecName.clockRate The
   *   codec clock rate in Hz (hertz).
   * @param {Number} return.then.fn.result.current.supports.webrtc.codecs.send.audio._codecName.payloadType The
   *   number of channels, where mono is represented as `1`, and stereo as `2`.
   * @param {String} [return.then.fn.result.current.supports.webrtc.codecs.send.audio._codecName.sdpFmtpLine] The
   *   codec parameters configured as its corresponding `a=fmtp` SDP line.
   * @param {JSON} return.then.fn.result.current.supports.webrtc.codecs.send.video The sending video codecs.
   * - Object signature matches `current.supports.webrtc.codecs.send.audio`.
   * @param {JSON} return.then.fn.result.current.supports.webrtc.codecs.recv The receiving codecs.
   * - Object signature matches `current.supports.webrtc.codecs.send.audio`.
   * @param {JSON} return.then.fn.result.current.supports.webrtc.codecs.recv.audio The receiving audio codecs.
   * @param {JSON} return.then.fn.result.current.supports.webrtc.codecs.recv.video The receiving video codecs.
   * - Object signature matches `current.supports.webrtc.codecs.send.audio`.
   * @param {Boolean} return.then.fn.result.current.supports.xhr The flag if `XMLHttpRequest` API is supported.
   * - Note that this is required for starting `Temasys.Room` session connections.
   * @param {Boolean} return.then.fn.result.current.supports.corsRequest The flag if CORS (cross origin resource sharing)
   *   domain requests is supported, in which the CORS domain is determined from current accessing domain request.
   * - Note that this is required for CORS authentication when starting `Temasys.Room` session connections.
   * @param {JSON} return.then.fn.result.recommended The recommended dependencies, browsers and WebRTC plugin versions.
   * @param {JSON} return.then.fn.result.recommended.browsers The browsers.
   * @param {JSON} return.then.fn.result.recommended.browsers.chrome The chrome browser recommended versions.
   * @param {String} return.then.fn.result.recommended.browser.chrome.minVersion The recommended minimum version.
   * @param {String} [return.then.fn.result.recommended.browser.chrome.maxVersion] The recommended maximum version if any.
   * @param {String} [return.then.fn.result.recommended.browser.chrome.minMobilePlatformVersion] The recommended
   *   minimum version of the mobile platform if any.
   * @param {String} [return.then.fn.result.recommended.browser.chrome.maxMobilePlatformVersion] The recommended
   *   maximum version of the mobile platform if any.
   * @param {String} return.then.fn.result.recommended.browser.opera The opera browser recommended versions.
   * - Object signature matches `recommended.browser.chrome`.
   * @param {String} return.then.fn.result.recommended.browser.firefox The firefox browser recommended versions.
   * - Object signature matches `recommended.browser.chrome`.
   * @param {String} return.then.fn.result.recommended.browser.IE The IE browser recommended versions.
   * - Object signature matches `recommended.browser.chrome`.
   * @param {String} return.then.fn.result.recommended.browser.safari The safari browser recommended versions.
   * - Object signature matches `recommended.browser.chrome`.
   * @param {String} return.then.fn.result.recommended.browser.edge The Edge browser recommended versions.
   * - Object signature matches `recommended.browser.chrome`.
   * @param {String} return.then.fn.result.recommended.browser.bowser The Bowser browser recommended versions.
   * - Object signature matches `recommended.browser.chrome`.
   * @param {JSON} return.then.fn.result.recommended.webrtcPlugin The WebRTC plugin versions recommended.
   * @param {String} return.then.fn.result.recommended.webrtcPlugin.minVersion The recommended WebRTC plugin minimum version.
   * @param {String} [return.then.fn.result.recommended.webrtcPlugin.maxVersion] The recommended WebRTC
   *  plugin maxmimum version if any.
   * @param {JSON} return.then.fn.result.recommended.dependencies The dependencies.
   * @param {String} return.then.fn.result.recommended.dependencies.adapterjs The recommended AdapterJS dependency version.
   * @param {String} return.then.fn.result.recommended.dependencies.io The recommended socket.io-client dependency version.
   * @param {Function} return.catch Function to subscribe to when request result has errors.
   * @param {Function} return.catch.fn The callback function.
   * @param {Error} return.catch.fn.error The error object.
   * @example
   * // Example: Get the supports
   * Temasys.Utils.getClientSupports().then(function (result) {
   *   console.info("==== Current browser information ====");
   *   console.log("- Name: " + result.current.browser.name);
   *   console.log("- Version: " + result.current.browser.version);
   *   console.log("- Platform: " + result.current.browser.platform +
   *     (result.current.browser.platform.version ? " / " + result.current.browser.platform.version : "");
   * 
   *   if (result.current.webrtcPlugin) {
   *     console.info("==== Current WebRTC plugin information ====");
   *     console.log("- Is active: " + result.current.webrtcPlugin.active);
   *     console.log("- Company: " + result.current.webrtcPlugin.company);
   *     console.log("- Version: " + result.current.webrtcPlugin.version);
   *     console.log("- Expiration Date: " + (result.current.webrtcPlugin.expirationDate || 'N/A'));
   *
   *     if (result.current.webrtcPlugin.whiteList) {
   *       console.log("- Is domain whitelisted")
   *     }
   *   }
   * }).catch(function (error) {
   *   console.error("Browser supports retrieval error ->", error);
   * });
   * @for Temasys.Utils
   * @since 0.7.0
   */
  getClientSupports: function () {
    return new Promise(function (resolve, reject) {
      var refAdapterJS = (_globals.AdapterJS || window.AdapterJS);
      refAdapterJS = typeof refAdapterJS.webRTCReady === 'function' ? refAdapterJS : null;
      var result = {
        current: {
          browser: {
            name: window.webrtcDetectedBrowser,
            version: (window.webrtcDetectedVersion || 0).toString(),
            platform: navigator.platform,
            mobilePlatformVersion: null
          },
          dependencies: {
            io: !!(_globals.io || window.io),
            adapterjs: refAdapterJS ? refAdapterJS.VERSION : null
          },
          webrtcPlugin: null,
          supports: {}
        },
        recommended: {
          browers: {
            chrome: {
              minVersion: '@@chromeMinVersion' || null,
              maxVersion: '@@chromeMaxVersion' || null,
              mobilePlatformMinVersion: '@@chromeMobilePlatformMinVersion' || null,
              mobilePlatformMaxVersion: '@@chromeMobilePlatformMaxVersion' || null
            },
            firefox: {
              minVersion: '@@firefoxMinVersion' || null,
              maxVersion: '@@firefoxMaxVersion' || null,
              mobilePlatformMinVersion: '@@firefoxMobilePlatformMinVersion' || null,
              mobilePlatformMaxVersion: '@@firefoxMobilePlatformMaxVersion' || null
            },
            opera: {
              minVersion: '@@chromeMinVersion' || null,
              maxVersion: '@@chromeMaxVersion' || null,
              mobilePlatformMinVersion: '@@chromeMobilePlatformMinVersion' || null,
              mobilePlatformMaxVersion: '@@chromeMobilePlatformMaxVersion' || null
            },
            IE: {
              minVersion: '@@ieMinVersion' || null,
              maxVersion: '@@ieMaxVersion' || null,
              mobilePlatformMinVersion: '@@ieMobilePlatformMinVersion' || null,
              mobilePlatformMaxVersion: '@@ieMobilePlatformMaxVersion' || null
            },
            safari: {
              minVersion: '@@safariMinVersion' || null,
              maxVersion: '@@safariMaxVersion' || null,
              mobilePlatformMinVersion: '@@safariMobilePlatformMinVersion' || null,
              mobilePlatformMaxVersion: '@@safariMobilePlatformMaxVersion' || null
            },
            edge: {
              minVersion: '@@edgeMinVersion' || null,
              maxVersion: '@@edgeMaxVersion' || null,
              mobilePlatformMinVersion: '@@edgeMobilePlatformMinVersion' || null,
              mobilePlatformMaxVersion: '@@edgeMobilePlatformMaxVersion' || null
            },
            bowser: {
              minVersion: '@@bowserMinVersion' || null,
              maxVersion: '@@bowserMaxVersion' || null,
              mobilePlatformMinVersion: '@@bowserMobilePlatformMinVersion' || null,
              mobilePlatformMaxVersion: '@@bowserMobilePlatformMaxVersion' || null
            }
          },
          webrtcPlugin: {
            minVersion: '@@pluginMinVersion' || null,
            maxVersion: '@@pluginMaxVersion' || null
          }
        }
      };

      (refAdapterJS ? refAdapterJS : {
        webRTCReady: function (fn) { fn(); }
      }).webRTCReady(function () {
        
      });

      // Set the current WebRTC plugin information
      // References: 
      result.current.webrtcPlugin = {
        required: ['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1,
        active: false,
        version: null,
        company: null,
        expirationDate: null,
        whiteListed: false,
        features: {
          domainUsageRestrictions: false,
          domainFeaturesRestrictions: false,
          crashReporter: false,
          autoUpdate: false,
          whiteListing: false,
          screensharing: false,
          httpProxy: false,
          h264: false,
          permissionPopup: false,
          experimentalAEC: false
        }
      };

      // Set the recommended browser information
      result.recommended.

      // Set the recommended WebRTC plugin information
      result.recommended.webrtcPlugin = {
        minVersion: '0.8.869',
        maxVersion: null
      };

      // Set the WebRTC and CORS supports
      result.current.supports = {
        webrtc: {
          connection: false,
          datachannel: false,
          iceRestart: false,
          screensharing: false,
          maxBandwidth: false,
          turns: false,
          codecs: {
            send: { audio: {}, video: {} },
            recv: { audio: {}, video: {} }
          }
        },
        corsRequest: window.webrtcDetectedBrowser === 'IE' && [8,9].indexOf(window.webrtcDetectedVersion) > -1 ?
          ['object', 'function'].indexOf(typeof window.XDomainRequest) > -1 :
          typeof window.XMLHttpRequest === 'function'
      };

      var refAdapterJS = _globals.AdapterJS || window.AdapterJS;

      (function (fnParseSupports) {
        if (['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1 && refAdapterJS &&
          typeof refAdapterJS === 'object' && typeof refAdapterJS.webRTCReady === 'function') {
          refAdapterJS.webRTCReady(fnParseCodecsSupports);
        } else {
          fnParseSupports();
        }
      })(function () {
        if (!window.RTCPeerConnection) {
          return resolve(result);
        }

        if (['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1) {
          try {
            // IE returns as typeof object
            var pc = new window.RTCPeerConnection(null);
            result.current.webrtcPlugin = {
              required: ['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1,
              // Check if RTCPeerConnection.createOffer is still valid
              active: !!((pc.createOffer !== null && ['object', 'function'].indexOf(typeof pc.createOffer) > -1) &&
                // Check plugin flags "valid" is true, and then check if expiration date exists
                refAdapterJS.WebRTCPlugin.plugin.valid && !!(result.current.webrtcPlugin.expirationDate &&
                // If expiration date is defined, check if plugin has expired
                (new Date(result.current.webrtcPlugin.expirationDate)).getTime() > (new Date()).getTime()) &&
                // If whitelisted and domain is not in it
                (result.current.webrtcPlugin.supports.whitelisting ? result.current.webrtcPlugin.whitelisted : true)),
              version: refAdapterJS.WebRTCPlugin.plugin.VERSION || null,
              company: refAdapterJS.WebRTCPlugin.plugin.COMPANY || null,
              expirationDate: refAdapterJS.WebRTCPlugin.plugin.expirationDate || null,
              whiteListed: !!(refAdapterJS.WebRTCPlugin.plugin.HasWhiteListingFeature &&
						    refAdapterJS.WebRTCPlugin.plugin.isWebsiteWhitelisted),
              features: {
                domainUsageRestrictions: !!refAdapterJS.WebRTCPlugin.plugin.HasUsageRestrictionToDomains,
                domainFeaturesRestrictions: !!refAdapterJS.WebRTCPlugin.plugin.HasFeaturesRestrictedToDomains,
                autoUpdate: !!refAdapterJS.WebRTCPlugin.plugin.HasAutoupdateFeature,
                crashReporter: !!refAdapterJS.WebRTCPlugin.plugin.HasCrashReporterFeature,
                permissionPopup: !!refAdapterJS.WebRTCPlugin.plugin.HasPopupFeature,
                whiteListing: !!refAdapterJS.WebRTCPlugin.plugin.HasWhiteListingFeature,
                screensharing: !!(refAdapterJS.WebRTCPlugin.plugin.HasScreensharingFeature &&
                  refAdapterJS.WebRTCPlugin.plugin.isScreensharingAvailable),
                experimentalAEC: !!refAdapterJS.WebRTCPlugin.plugin.HasExperimentalAEC,
                h264: !!refAdapterJS.WebRTCPlugin.plugin.HasH264Support,
                httpProxy: !!refAdapterJS.WebRTCPlugin.plugin.HasHTTPProxyFeature
              }
            };
            // Need not parse WebRTC supports if plugin is not active
            if (result.current.webrtcPlugin.active) {

            }
          } catch (e) {}
          resolve(result);
        }

        result.current.supports.webrtc = {
          connection: true,
          datachannel: window.webrtcDetectedBrowser !== 'edge',
          iceRestart: !((window.webrtcDetectedBrowser === 'firefox' && window.webrtcDetectedVersion < 48) ||
            window.webrtcDetectedBrowser === 'edge'),
          screensharing: ['chrome', 'firefox'].indexOf(window.webrtcDetectedBrowser) > -1 ||
            (['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1 && result.current.webrtcPlugin.supports.screensharing),
          maxBandwidth: !((window.webrtcDetectedBrowser === 'firefox' && window.webrtcDetectedVersion < 49) ||
            window.webrtcDetectedBrowser === 'edge'),
          turns: ['IE', 'safari', 'chrome', 'opera'].indexOf(window.webrtcDetectedBrowser) > -1,
          codecs: {
            send: { audio: {}, video: {} },
            recv: { audio: {}, video: {} }
          }
        };

        if (window.webrtcDetectedBrowser === 'edge' &&
          typeof window.RTCRtpSender === 'function' && typeof window.RTCRtpSender.getCapabilities === 'function' &&
          typeof window.RTCRtpReceiver === 'function' && typeof window.RTCRtpReceiver.getCapabilities === 'function') {
          // Parse sending codecs
          var sendCodecs = RTCRtpSender.getCapabilities();
          Temasys.Utils.forEach(sendCodecs, function (codec) {
            if (!codec.name) {
              return;
            } else if (['audio', 'video'].indexOf(codec.kind) > -1) {
              result.current.supports.webrtc.codecs.send[codec.kind][codec.name.toLowerCase()] = {
                channels: codec.numChannels || 1,
                clockRate: codec.clockRate,
                payloadType: (codec.preferredPayload || '').toString()
              };
            }
          });
          // Parse receiving codecs
          var recvCodecs = RTCRtpReceiver.getCapabilities();
          Temasys.Utils.forEach(recvCodecs, function (codec) {
            if (!codec.name) {
              return;
            } else if (['audio', 'video'].indexOf(codec.kind) > -1) {
              result.current.supports.webrtc.codecs.recv[codec.kind][codec.name.toLowerCase()] = {
                channels: codec.numChannels || 1,
                clockRate: codec.clockRate,
                sdpFmtpLine: (codec.preferredPayload || '').toString()
              };
            }
          });
          resolve(result);
        } else {
          var pc = new RTCPeerConnection(null);
          pc.createOffer(function (offer) {
            var sdpLines = offer.sdp.split('\r\n');
            var mediaType = '';
            Temasys.Utils.forEach(sdpLines, function (line) {
              if (line.indexOf('m=') === 0) {
                mediaType = (line.split('m=')[1] || '').split(' ')[0];
              } else if (['audio', 'video'].indexOf(mediaType) > -1 && line.indexOf('a=rtpmap:') === 0) {
                var parts = (line.split('a=rtpmap:')[1] || '').split(' ');
                var codecParts = (parts[1] || '').split('/');
                var codecResult = {
                  channels: parseInt(codecParts[2] || '1', 10) || 1,
                  clockRate: parseInt(codecParts[1] || '0', 10) || 0,
                  sdpFmtpLine: parts[0]
                };
                result.current.supports.webrtc.codecs.recv[mediaType][codecParts[0].toLowerCase()] = codecResult;
                result.current.supports.webrtc.codecs.send[mediaType][codecParts[0].toLowerCase()] = codecResult;
              }
            });
            resolve(result);
          }, function (e) {
            result.current.supports.webrtc.connection = false;
            resolve(result);
          }, ['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1 ? {
            mandatory: {
              OfferToReceiveAudio: 1,
              OfferToReceiveVideo: 1
            }
          } : {
            offerToReceiveVideo: 1,
            offerToReceiveAudio: 1
          });
        }
      });
    });
  }
};