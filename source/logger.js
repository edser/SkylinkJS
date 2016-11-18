/**
 * Handles the debugging logs.
 * @class Debugger
 * @private
 * @since 0.7.0
 */
var Debugger = new (function () {

  /**
   * Stores the logs.
   * @attribute logs
   * @type Array
   * @for Debugger
   * @since 0.7.0
   */
  this.logs = [];

  /**
   * The current log level to allow displaying to the console.
   * @attribute level
   * @type Number
   * @for Debugger
   * @since 0.7.0
   */
  this.level = Skylink.prototype.LOG_LEVEL.ERROR;

  /**
   * The flag if all logs should trace if supported.
   * @attribute trace
   * @type Boolean
   * @for Debugger
   * @since 0.7.0
   */
  this.trace = false;

  /**
   * The flag if logs should be stored.
   * @attribute storeLogs
   * @type Boolean
   * @for Debugger
   * @since 0.7.0
   */
  this.storeLogs = false;

  /**
   * Function that returns a logging function.
   * @method configureLog
   * @return Function
   * @for Debugger
   * @since 0.7.0
   */
  this.configureLog = function (level) {
    var self = this;
    var consoleKeys = {
      WARN: 'warn',
      ERROR: 'error',
      LOG: 'log',
      DEBUG: 'debug',
      INFO: 'info'
    };

    return function (log, obj) {
      var outputLog = 'SkylinkJS ';

      if (Array.isArray(log)) {
        if (log[0]) {
          outputLog += '[' + log[0] + '] '
        }

        if (log[1]) {
          outputLog += '<<' + log[1] + '>> ';
        }

        if (log[2]) {
          outputLog += '(' + log[2] + ') '
        }

        outputLog += '- ' + (log[3] || '');

      } else {
        outputLog += '- ' + (log || '');
      }

      if (self.storeLogs) {
        self.logs.push([(new Date()), Skylink.prototype.LOG_LEVEL[level], outputLog]);
      };

      if (Skylink.prototype.LOG_LEVEL[level] <= self.level) {
        var trace = console[consoleKeys[level]];
        var formatOutputLog = outputLog;

        if (self.trace) {
          trace = console.trace;
        }

        if (typeof trace !== 'function') {
          trace = console.log;

          if (self.trace) {
            formatOutputLog = level + ' :: ' + outputLog;
          }
        }

        if (obj) {
          trace(formatOutputLog, obj);
        } else {
          trace(formatOutputLog);
        }
      }
    };
  };

  /**
   * Function that sets the log level.
   * @method setLevel
   * @for Debugger
   * @since 0.7.0
   */
  this.setLevel = function (level) {
    for (var prop in Skylink.prototype.LOG_LEVEL) {
      if (Skylink.prototype.LOG_LEVEL.hasOwnProperty(prop) && Skylink.prototype.LOG_LEVEL[prop] === level) {
        this.level = level;
      }
    }
  };

  /**
   * Function that sets debugging mode.
   * @method setMode
   * @for Debugger
   * @since 0.7.0
   */
  this.setMode = function (storeLogs, trace) {
    this.storeLogs = storeLogs === true;
    this.trace = trace === true;
  };

})();

/**
 * Export global logging functions.
 */
var log = {
  debug: Debugger.configureLog('DEBUG'),
  log: Debugger.configureLog('LOG'),
  info: Debugger.configureLog('INFO'),
  warn: Debugger.configureLog('WARN'),
  error: Debugger.configureLog('ERROR')
};

