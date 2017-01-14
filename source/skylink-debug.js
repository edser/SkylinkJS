/**
 * The list of the SDK <code>console</code> API log levels.
 * @attribute LOG_LEVEL
 * @param {Number} DEBUG <small>Value <code>4</code></small>
 *   The value of the log level that displays <code>console</code> <code>debug</code>,
 *   <code>log</code>, <code>info</code>, <code>warn</code> and <code>error</code> logs.
 * @param {Number} LOG   <small>Value <code>3</code></small>
 *   The value of the log level that displays only <code>console</code> <code>log</code>,
 *   <code>info</code>, <code>warn</code> and <code>error</code> logs.
 * @param {Number} INFO  <small>Value <code>2</code></small>
 *   The value of the log level that displays only <code>console</code> <code>info</code>,
 *   <code>warn</code> and <code>error</code> logs.
 * @param {Number} WARN  <small>Value <code>1</code></small>
 *   The value of the log level that displays only <code>console</code> <code>warn</code>
 *   and <code>error</code> logs.
 * @param {Number} ERROR <small>Value <code>0</code></small>
 *   The value of the log level that displays only <code>console</code> <code>error</code> logs.
 * @param {Number} NONE <small>Value <code>-1</code></small>
 *   The value of the log level that displays no logs.
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.5.4
 */
Skylink.prototype.LOG_LEVEL = {
  DEBUG: 4,
  LOG: 3,
  INFO: 2,
  WARN: 1,
  ERROR: 0,
  NONE: -1
};

/**
 * Stores the logs used for SkylinkLogs object.
 * @attribute storedLogs
 * @type JSON
 * @private
 * @scoped true
 * @for Skylink
 * @since 0.5.5
 */
var storedLogs = {};

/**
 * <blockquote class="info">
 *   To utilise and enable the <code>SkylinkLogs</code> API functionalities, the
 *   <a href="#method_setDebugMode"><code>setDebugMode()</code> method</a>
 *   <code>options.storedLogs</code> parameter has to be enabled.
 * </blockquote>
 * The object interface to manage the SDK <a href="https://developer.mozilla.org/en/docs/Web/API/console">
 * Javascript Web Console</a> logs.
 * @property SkylinkLogs
 * @type JSON
 * @global true
 * @for Skylink
 * @since 0.5.5
 */
window.SkylinkLogs = {
  /**
   * Function that gets the current stored SDK <code>console</code> logs.
   * @property SkylinkLogs.getLogs
   * @param {Number} [logLevel] The specific log level of logs to return.
   * - When not provided or that the level does not exists, it will return all logs of all levels.
   *  [Rel: Skylink.LOG_LEVEL]
   * @return {Array} The array of stored logs.<ul>
   *   <li><code><#index></code><var><b>{</b>Array<b>}</b></var><p>The stored log item.</p><ul>
   *   <li><code>0</code><var><b>{</b>Date<b>}</b></var><p>The DateTime of when the log was stored.</p></li>
   *   <li><code>1</code><var><b>{</b>String<b>}</b></var><p>The log level. [Rel: Skylink.LOG_LEVEL]</p></li>
   *   <li><code>2</code><var><b>{</b>String<b>}</b></var><p>The log message.</p></li>
   *   <li><code>3</code><var><b>{</b>Any<b>}</b></var><span class="label">Optional</span><p>The log message object.</li>
   *   <li><code>4</code><var><b>{</b>String<b>}</b></var><span class="label">Optional</span><p>The Skylink object
   *   instance label.</li></p></li></ul></li></ul>
   * @example
   *  // Example 1: Get logs of specific level
   *  var debugLogs = SkylinkLogs.getLogs(skylinkDemo.LOG_LEVEL.DEBUG);
   *
   *  // Example 2: Get all the logs
   *  var allLogs = SkylinkLogs.getLogs();
   * @type Function
   * @global true
   * @triggerForPropHackNone true
   * @for Skylink
   * @since 0.5.5
   */
  getLogs: function (logLevel, instanceLabel) {
    var returnLogs = [];
    var logProp = null;

    if (typeof logLevel === 'string' && logLevel) {
      instanceLabel = logLevel;
      logLevel = null;
    }

    if (typeof logLevel === 'number') {
      for (var l in Skylink.prototype.LOG_LEVEL) {
        if (Skylink.prototype.LOG_LEVEL.hasOwnProperty(l) && Skylink.prototype.LOG_LEVEL[l] === logLevel) {
          logProp = l;
          break;
        }
      }
    }

    for (var prop in storedLogs) {
      if (storedLogs.hasOwnProperty(prop) && storedLogs[prop]) {
        if (instanceLabel && typeof instanceLabel === 'string' ? instanceLabel === prop : true) {
          for (var i = 0; i < storedLogs[prop].length; i++) {
            if (logProp ? (storedLogs[prop][i][1] || '').toUpperCase() === logProp : true) {
              returnLogs.push(storedLogs[prop][i]);
            }
          }
        }
      }
    }

    return returnLogs;
  },

  /**
   * Function that clears all the current stored SDK <code>console</code> logs.
   * @property SkylinkLogs.clearAllLogs
   * @type Function
   * @example
   *   // Example 1: Clear all the logs
   *   SkylinkLogs.clearAllLogs();
   * @global true
   * @triggerForPropHackNone true
   * @for Skylink
   * @since 0.5.5
   */
  clearAllLogs: function (instanceLabel, logLevel) {
    var logProp = null;

    if (typeof instanceLabel === 'number') {
      logLevel = instanceLabel;
      instanceLabel = null;
    }

    if (typeof logLevel === 'number') {
      for (var l in Skylink.prototype.LOG_LEVEL) {
        if (Skylink.prototype.LOG_LEVEL.hasOwnProperty(l) && Skylink.prototype.LOG_LEVEL[l] === logLevel) {
          logProp = l;
          break;
        }
      }
    }

    for (var prop in storedLogs) {
      if (storedLogs.hasOwnProperty(prop) && storedLogs[prop]) {
        if (instanceLabel && typeof instanceLabel === 'string' ? instanceLabel === prop : true) {
          if (logProp) {
            for (var i = 0; i < storedLogs[prop].length; i++) {
              if (logProp ? (storedLogs[prop][i][1] || '').toUpperCase() === logProp : true) {
                storedLogs[prop].splice(i, 1);
                i--;
              }
            }
          } else {
            delete storedLogs[prop];
          }
        }
      }
    }
  },

  /**
   * Function that prints all the current stored SDK <code>console</code> logs into the
   * <a href="https://developer.mozilla.org/en/docs/Web/API/console">Javascript Web Console</a>.
   * @property SkylinkLogs.printAllLogs
   * @type Function
   * @example
   *   // Example 1: Print all the logs
   *   SkylinkLogs.printAllLogs();
   * @global true
   * @triggerForPropHackNone true
   * @for Skylink
   * @since 0.5.5
   */
  printAllLogs: function (instanceLabel, logLevel) {
    var logProp = null;

    if (typeof instanceLabel === 'number') {
      logLevel = instanceLabel;
      instanceLabel = null;
    }

    if (typeof logLevel === 'number') {
      for (var l in Skylink.prototype.LOG_LEVEL) {
        if (Skylink.prototype.LOG_LEVEL.hasOwnProperty(l) && Skylink.prototype.LOG_LEVEL[l] === logLevel) {
          logProp = l;
          break;
        }
      }
    }

    for (var prop in storedLogs) {
      if (storedLogs.hasOwnProperty(prop) && storedLogs[prop]) {
        if (instanceLabel && typeof instanceLabel === 'string' ? instanceLabel === prop : true) {
          for (var i = 0; i < storedLogs[prop].length; i++) {
            if (logProp ? (storedLogs[prop][i][1] || '').toUpperCase() === logProp : true) {
              var timestamp = storedLogs[prop][i][0];
              var log = (console[storedLogs[prop][i][1]] !== 'undefined') ? storedLogs[prop][i][1] : 'log';
              var message = storedLogs[prop][i][2];
              var debugObject = storedLogs[prop][i][3];
              var instanceId = storedLogs[prop][i][4];

              if (typeof debugObject !== 'undefined') {
                console[log].apply(window.console, [message, debugObject]);
              } else {
                console[log].apply(window.console, [message]);
              }
            }
          }
        }
      }
    }
  }
};

/**
 * Function that handles the logs received and prints in the Web Console interface according to the log level set.
 * @method _log
 * @private
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._log = function(logProp, message, debugObject) {
  var outputLog = '';
  var printOutputLog = '';
  var timestamp = (new Date ());

  if (Array.isArray(message)) {
    outputLog += (message[0]) ? ' [' + message[0] + '] -' : ' -';
    outputLog += (message[1]) ? ' <<' + message[1] + '>>' : '';
    if (message[2]) {
      outputLog += ' ';
      if (typeof message[2] === 'object') {
        for (var i = 0; i < message[2].length; i++) {
          outputLog += '(' + message[2][i] + ')';
        }
      } else {
        outputLog += '(' + message[2] + ')';
      }
    }
    outputLog += ' ' + message[3];
  } else {
    outputLog += ' - ' + message;
  }

  printOutputLog = (this._enableDebugPrintTimeStamp ? '[' + timestamp.toISOString() + '] ' : '') +
    'SkylinkJS' + (this._enableDebugPrintInstanceLabel ? ' :: ' + this.INSTANCE_LABEL : '') + outputLog;
  outputLog = 'SkylinkJS' + outputLog;

  if (this._enableDebugMode && this._enableDebugStack) {
    // store the logs
    storedLogs[this.INSTANCE_LABEL] = storedLogs[this.INSTANCE_LABEL] || [];
    storedLogs[this.INSTANCE_LABEL].push([(new Date()), logProp, outputLog, debugObject || null, this.INSTANCE_LABEL]);
  }

  if (this._logLevel >= this.LOG_LEVEL[logProp.toUpperCase()]) {
    // Fallback to log if failure
    var newLogProp = (typeof console[logProp] === 'undefined') ? 'log' : logProp;

    if (this._enableDebugMode && this._enableDebugTrace) {
      var logConsole = (typeof console.trace === 'undefined') ? logLevel[3] : 'trace';
      if (typeof debugObject !== 'undefined') {
        // output if supported
        if (typeof console.trace !== 'undefined') {
          console.trace('[' + logProp.toUpperCase() + ']', printOutputLog, debugObject);
        } else {
          console[newLogProp](printOutputLog, debugObject);
        }
      } else {
        // output if supported
        if (typeof console.trace !== 'undefined') {
          console.trace('[' + logProp.toUpperCase() + ']', printOutputLog);
        } else {
          console[newLogProp](printOutputLog);
        }
      }
    } else {
      if (typeof debugObject !== 'undefined') {
        console[newLogProp](printOutputLog, debugObject);
      } else {
        console[newLogProp](printOutputLog);
      }
    }
  }
};

/**
 * Function that configures the level of <code>console</code> API logs to be printed in the
 * <a href="https://developer.mozilla.org/en/docs/Web/API/console">Javascript Web Console</a>.
 * @method setLogLevel
 * @param {Number} [logLevel] The specific log level of logs to return.
 * - When not provided or that the level does not exists, it will not overwrite the current log level.
 *   <small>By default, the initial log level is <code>ERROR</code>.</small>
 *   [Rel: Skylink.LOG_LEVEL]
 * @example
 *   // Example 1: Print all of the console.debug, console.log, console.info, console.warn and console.error logs.
 *   skylinkDemo.setLogLevel(skylinkDemo.LOG_LEVEL.DEBUG);
 *
 *   // Example 2: Print only the console.log, console.info, console.warn and console.error logs.
 *   skylinkDemo.setLogLevel(skylinkDemo.LOG_LEVEL.LOG);
 *
 *   // Example 3: Print only the console.info, console.warn and console.error logs.
 *   skylinkDemo.setLogLevel(skylinkDemo.LOG_LEVEL.INFO);
 *
 *   // Example 4: Print only the console.warn and console.error logs.
 *   skylinkDemo.setLogLevel(skylinkDemo.LOG_LEVEL.WARN);
 *
 *   // Example 5: Print only the console.error logs. This is done by default.
 *   skylinkDemo.setLogLevel(skylinkDemo.LOG_LEVEL.ERROR);
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.setLogLevel = function(logLevel) {
  if(logLevel === undefined) {
    logLevel = Skylink.LOG_LEVEL.WARN;
  }
  for (var level in this.LOG_LEVEL) {
    if (this.LOG_LEVEL[level] === logLevel) {
      this._logLevel = logLevel;
      this._log('log', [null, 'Log', level, 'Log level exists. Level is set']);
      return;
    }
  }
  this._log('error', [null, 'Log', level, 'Log level does not exist. Level is not set']);
};

/**
 * Function that configures the debugging mode of the SDK.
 * @method setDebugMode
 * @param {Boolean|JSON} [options=false] The debugging options.
 * - When provided as a boolean, this sets both <code>options.trace</code>
 *   and <code>options.storedLogs</code> to its boolean value.
 * @param {Boolean} [options.trace=false] The flag if SDK <code>console</code> logs
 *   should output as <code>console.trace()</code> logs for tracing the <code>Function</code> call stack.
 *   <small>Note that the <code>console.trace()</code> output logs is determined by the log level set
 *   <a href="#method_setLogLevel"><code>setLogLevel()</code> method</a>.</small>
 *   <small>If <code>console.trace()</code> API is not supported, <code>setDebugMode()</code>
 *   will fallback to use <code>console.log()</code> API.</small>
 * @param {Boolean} [options.storedLogs=false] The flag if SDK should store the <code>console</code> logs.
 *   <small>This is required to be enabled for <a href="#prop_SkylinkLogs"><code>SkylinkLogs</code> API</a>.</small>
 * @param {Boolean} [options.printInstanceLabel=false] The flag if SDK should print the Skylink object
 *   instance label with the related log.
 * @param {Boolean} [options.printTimeStamp=false] The flag if SDK should print the DateTime stamp
 *   with the related log.
 * @example
 *   // Example 1: Enable both options.storedLogs and options.trace
 *   skylinkDemo.setDebugMode(true);
 *
 *   // Example 2: Enable only options.storedLogs
 *   skylinkDemo.setDebugMode({ storedLogs: true });
 *
 *   // Example 3: Disable debugging mode
 *   skylinkDemo.setDebugMode();
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype.setDebugMode = function(isDebugMode) {
  if (isDebugMode && typeof isDebugMode === 'object') {
    this._enableDebugTrace = typeof isDebugMode.trace === 'boolean' ? isDebugMode.trace : false;
    this._enableDebugStack = typeof isDebugMode.storedLogs === 'boolean' ? isDebugMode.storedLogs : false;
    this._enableDebugPrintTimeStamp = typeof isDebugMode.printTimeStamp === 'boolean' ?
      isDebugMode.printTimeStamp : false;
    this._enableDebugPrintInstanceLabel = typeof isDebugMode.printInstanceLabel === 'boolean' ?
      isDebugMode.printInstanceLabel : false;
    this._enableDebugMode = true;
  } else {
    this._enableDebugMode = isDebugMode === true;
    this._enableDebugTrace = isDebugMode === true;
    this._enableDebugStack = isDebugMode === true;
    this._enableDebugPrintTimeStamp = false;
    this._enableDebugPrintInstanceLabel = false;
  }
};