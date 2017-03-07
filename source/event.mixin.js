/**
 * Mixin that handles event listeners and subscription.
 */
function EventMixin (extendref) {
  // Private properties
  extendref._listeners = {
    once: [],
    on: []
  };

  /**
   * Function to subscribe to an event.
   */
  extendref.on = function (eventName, fn) {
    if (!Array.isArray(extendref._listeners.on[eventName])) {
      extendref._listeners.on[eventName] = [];
    }

    extendref._listeners.on[eventName].push(fn);
  };

  /**
   * Function to subscribe to an event once.
   */
  extendref.once = function (eventName, fn, conditionFn, fireAlways) {
    if (!Array.isArray(extendref._listeners.once[eventName])) {
      extendref._listeners.once[eventName] = [];
    }

    extendref._listeners.once[eventName].push([fn, conditionFn || function () { return true; }, fireAlways]);
  };

  /**
   * Function to subscribe to an event once.
   */
  extendref.off = function (eventName, fn) {
    if (typeof eventName === 'string') {
      if (typeof fn === 'function') {
        // Unsubscribe .on() events
        if (Array.isArray(extendref._listeners.on[eventName])) {
          var onIndex = 0;
          while (onIndex < extendref._listeners.on[eventName].length) {
            if (extendref._listeners.on[eventName][onIndex] === fn) {
              extendref._listeners.on[eventName].splice(onIndex, 1);
              onIndex--;
            }
            onIndex++;
          }
        }
        // Unsubscribe .once() events
        if (Array.isArray(extendref._listeners.once[eventName])) {
          var onceIndex = 0;
          while (onceIndex < extendref._listeners.once[eventName].length) {
            if (extendref._listeners.once[eventName][onceIndex][0] === fn) {
              extendref._listeners.once[eventName].splice(onceIndex, 1);
              onceIndex--;
            }
            onceIndex++;
          }
        }
      } else {
        extendref._listeners.on[eventName] = [];
        extendref._listeners.once[eventName] = [];
      }
    } else {
      extendref._listeners.on = {};
      extendref._listeners.once = {};
    }
  };

  /**
   * Function to emit events.
   */
  extendref._emit = function (eventName) {
    var params = Array.prototype.slice.call(arguments);
    // Remove the eventName parameter
    params.shift();

    // Trigger .on() event listeners
    if (Array.isArray(extendref._listeners.on[eventName])) {
      var onIndex = 0;
      while (onIndex < extendref._listeners.on[eventName].length) {
        extendref._listeners.on[eventName][onIndex].apply(obj, params);
        onIndex++;
      }
    }

    // Trigger .once() event listeners
    if (Array.isArray(extendref._listeners.once[eventName])) {
      var onceIndex = 0;
      while (onceIndex < extendref._listeners.once[eventName].length) {
        if (extendref._listeners.once[eventName][onceIndex][1].apply(obj, params)) {
          extendref._listeners.once[eventName][onceIndex][0].apply(obj, params);
          // Remove event listener if met condition and not "fire always"
          if (extendref._listeners.once[eventName][onceIndex][0][2] !== true) {
            extendref._listeners.once[eventName].splice(onceIndex, 1);
            onceIndex--;
          }
        }
        onceIndex++;
      }
    }
  };
}