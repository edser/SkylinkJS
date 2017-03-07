/**
 * Factory that handles event listeners and subscription.
 */
function SkylinkEventEmitter (listeners) {
  return {
    on: function (eventName, fn) {
      if (!Array.isArray(listeners.on[eventName])) {
        listeners.on[eventName] = [];
      }
      listeners.on[eventName].push(fn);
    },

    once: function (eventName, fn, conditionFn, fireAlways) {
      if (!Array.isArray(listeners.once[eventName])) {
        listeners.once[eventName] = [];
      }
      listeners.once[eventName].push([fn, conditionFn || function () { return true; }, fireAlways]);
    },

    off: function (eventName, fn) {
      if (typeof eventName === 'string') {
        if (typeof fn === 'function') {
          // Unsubscribe .on() events
          if (Array.isArray(listeners.on[eventName])) {
            var onIndex = 0;
            while (onIndex < listeners.on[eventName].length) {
              if (listeners.on[eventName][onIndex] === fn) {
                listeners.on[eventName].splice(onIndex, 1);
                onIndex--;
              }
              onIndex++;
            }
          }
          // Unsubscribe .once() events
          if (Array.isArray(listeners.once[eventName])) {
            var onceIndex = 0;
            while (onceIndex < listeners.once[eventName].length) {
              if (listeners.once[eventName][onceIndex][0] === fn) {
                listeners.once[eventName].splice(onceIndex, 1);
                onceIndex--;
              }
              onceIndex++;
            }
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

    emit: function (eventName) {
      var params = Array.prototype.slice.call(arguments);
      // Remove the eventName parameter
      params.shift();

      // Trigger .on() event listeners
      if (Array.isArray(listeners.on[eventName])) {
        var onIndex = 0;
        while (onIndex < listeners.on[eventName].length) {
          listeners.on[eventName][onIndex].apply(obj, params);
          onIndex++;
        }
      }

      // Trigger .once() event listeners
      if (Array.isArray(listeners.once[eventName])) {
        var onceIndex = 0;
        while (onceIndex < listeners.once[eventName].length) {
          if (listeners.once[eventName][onceIndex][1].apply(obj, params)) {
            listeners.once[eventName][onceIndex][0].apply(obj, params);
            // Remove event listener if met condition and not "fire always"
            if (listeners.once[eventName][onceIndex][0][2] !== true) {
              listeners.once[eventName].splice(onceIndex, 1);
              onceIndex--;
            }
          }
          onceIndex++;
        }
      }
    }
  };
}