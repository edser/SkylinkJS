/**
 * + Factory that handles the logging.
 */
var Log = (function () {
  var logger = {
    header: 'SkylinkJS',
    instances: {},
    storedLogs: {}
  };

  var eventManager = {
    listeners: {},
    emit: function (evt, params) {
      UtilsFactory.forEach(eventManager.listeners[evt] || [], function (fn) {
        fn(params);
      });
    }
  };

  /**
   * - Function that handles the log message.
   */
  var fn = function (instanceId, prop, message, obj) {
    var output = '';
    var printOutput = '';
    var timestamp = (new Date());

    if (Array.isArray(message)) {
      output += message[0] ? ' [' + message[0] + '] -' : ' -';
      output += message[1] ? ' <<' + message[1] + '>>' : '';
      output += message[2] ? '(' + message[2] + ')' : '';
      output += ' ' + message[3];
    } else {
      output += ' - ' + message;
    }

    if (!logger.instances[instanceId]) {
      logger.instances[instanceId] = {
        level: Skylink.prototype.LOG_LEVEL.ERROR,
        trace: false,
        storeLogs: false,
        printTimeStamp: false,
        printInstanceLabel: false
      };
    }

    // Output for printing is different from the output stored in the logs array
    printOutput = (logger.printTimeStamp ? '[' + timestamp.toISOString() + '] ' : '') +
      logger.header + (logger.instances[instanceId].printInstanceLabel ? ' :: ' +
      logger.instances[instanceId].instanceLabel : '') + output;
    output = logger.header + output;

    // Store the log message
    if (logger.instances[instanceId].storeLogs) {
      storedLogs[logger.instances[instanceId].instanceLabel] =
        storedLogs[logger.instances[instanceId].instanceLabel] || [];
      storedLogs[logger.instances[instanceId].instanceLabel].push(
        [timestamp, prop, output, obj || null, logger.instances[instanceId].instanceLabel]);
    }

    // Trigger the log message
    if (logger.instances[instanceId].pushLog) {
      eventManager.emit('log', {
        timestamp: timestamp,
        level: prop,
        message: output,
        object: obj,
        instanceLabel: logger.instances[instanceId].instanceLabel
      })
    }

    if (logger.instances[instanceId].level >= Skylink.prototype.LOG_LEVEL[prop.toUpperCase()]) {
      var useProp = typeof console[prop] === 'undefined' ? 'log' : prop;
      useProp = logger.instances[instanceId].trace && typeof console.trace !== 'undefined' ? 'trace' : useProp;

      console[useProp]((useProp === 'trace' ? '[' + prop.toUpperCase() + ']' : '') +
        printOutput, typeof obj !== 'undefined' ? obj : '');
    }
  };

  return {
    /**
     * + Function that subscribes to an event.
     */
    on: function (evt, fn) {
      eventManager.listeners[evt] = eventManager[evt] || [];
      eventManager.listeners[evt].push(fn);
    },

    /**
     * + Function that configures the instance settings.
     */
    configure: function (instanceId, options) {
      logger.instances[instanceId] = options;
    },

    /**
     * + Function that prints the console.debug() level.
     */
    debug: function (instanceId, message, obj) {
      fn(instanceId, 'debug', message, obj);
    },

    /**
     * + Function that prints the console.log() level.
     */
    log: function (instanceId, message, obj) {
      fn(instanceId, 'log', message, obj);
    },

    /**
     * + Function that prints the console.info() level.
     */
    info: function (instanceId, message, obj) {
      fn(instanceId, 'info', message, obj);
    },

    /**
     * + Function that prints the console.warn() level.
     */
    warn: function (instanceId, message, obj) {
      fn(instanceId, 'warn', message, obj);
    },

    /**
     * + Function that prints the console.error() level.
     */
    error: function (instanceId, message, obj) {
      fn(instanceId, 'error', message, obj);
    },

    /**
     * + Function loops for each logs.
     */
    loopLogs: function (instanceLabel, level) {
      var output = [];
      var prop = null;

      if (typeof level === 'number') {
        UtilsFactory.forEach(Skylink.prototype.LOG_LEVEL, function (opt, cprop) {
          if (opt === level) {
            prop = cprop;
          }
        });
      }

      UtilsFactory.forEach(logger.storedLogs, function (logs, clabel) {
        if (instanceLabel && typeof instanceLabel === 'string' ? instanceLabel === clabel : true) {
          UtilsFactory.forEach(logs, function (log) {
            if (prop ? (log[1] || '').toUpperCase() === prop : true) {
              output.push(log);
            }
          });
        }
      });

      return output;
    },

    /**
     * + Function that clears log.
     */
    clearLogs: function (instanceLabel, level) {
      var prop = null;
      var fn = function (instanceLabel) {
        if (!Array.isArray(logger.storedLogs[instanceLabel])) {
          return;
        }

        for (var i = 0; i < logger.storedLogs[instanceLabel].length; i++) {
          if (prop ? (logger.storedLogs[instanceLabel][i][1] || '').toUpperCase() === prop : true) {
            logger.storedLogs[instanceLabel].splice(i, 1);
            i--;
          }
        }
      };

      if (typeof level === 'number') {
        UtilsFactory.forEach(Skylink.prototype.LOG_LEVEL, function (opt, cprop) {
          if (opt === level) {
            prop = cprop;
          }
        });
      }

      if (instanceLabel && typeof instanceLabel === 'string') {
        fn(instanceLabel);
      } else {
        UtilsFactory.forEach(logger.storedLogs, function (logs, clabel) {
          fn(clabel);
        });
      }
    }
  };
})();