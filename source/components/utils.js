/**
 * Module that handles utility functionalities.
 * @class Temasys.Utils
 * @since 0.7.0
 */
var Utils = {
  /**
   * Function that loops through an Array or JSON object.
   * @method forEach
   * @param {Array|JSON} object The object.
   * @param {Function} The callback function.
   * @for Temasys.Utils
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
   * @for Temasys.Utils
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
       * @for Temasys.Utils
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
       * @for Temasys.Utils
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
       * @for Temasys.Utils
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
       * @for Temasys.Utils
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
       * @for Temasys.Utils
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