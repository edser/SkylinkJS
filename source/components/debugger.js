/**
 * Handles the SDK debugger.
 * @class Temasys.Debugger
 * @since 0.7.0
 * @typedef module
 */
Temasys.Debugger = (function () {
  // Enum for LOG_LEVEL_ENUM.
  var LOG_LEVEL_ENUM = {
    NONE: -1,
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    LOG: 3,
    DEBUG: 4
  };

  // Stores the debugger settings.
  var settings = {
    global: {
      level: LOG_LEVEL_ENUM.ERROR,
      traceLogs: false,
      cacheLogs: false,
      printTimestamp: false,
      printComponentId: false
    },
    components: {}
  };

  // Stores the stats.
  var stats = {
    global: {
      debug: 0,
      log: 0,
      info: 0,
      warn: 0,
      error: 0,
      exceptions: []
    },
    components: {}
  };

  // Stores the logs.
  var logs = [];

  // Stores the listener functions.
  var listeners = { catch: null, watch: null, components: [] };

  /**
   * Function that logs message to Web console.
   */
  var fnLog = function (level, args) {
    // 0: Component ID
    // 1: Message
    // 2+: Meta data
    var componentId = args[0];
    var timestamp = (new Date()).toISOString();
    var useSettings = settings.components[componentId] ? settings.components[componentId] : settings.global;

    // E.g. Peer :: 34234234234 | 2017-04-12T12:41:55.563Z [RID: werwer][PID: xxx-werwer-][CID: test] - Test log is here -> null
    var message = (Array.isArray(args[1]) && args[1][0] ? args[1][0] + ' ' : '') +
      (useSettings.printComponentId ? ':: ' + componentId + ' ' : '') +
      (useSettings.printTimestamp ? '| ' + timestamp + ' ' : '') +
      (Array.isArray(args[1]) && args[1][1] ? '[RID: ' + args[1][1] + ']' : '') +
      (Array.isArray(args[1]) && args[1][2] ? '[PID: ' + args[1][2] + ']' : '') +
      (Array.isArray(args[1]) && args[1][3] ? '[CID: ' + args[1][3] + ']' : '') + ' - ' +
      (Array.isArray(args[1]) ? args[1][4] : args[1]);

    // Remove the first 2 arguments and leave the meta data
    args.splice(0, 2);

    var logItem = [level, componentId, timestamp, message, args.concat([])];

    if (useSettings.cacheLogs) {
      logs.push(logItem);
    }

    if (typeof listeners.watch === 'function') {
      listeners.watch(logItem, componentId);
    }

    args.splice(0, 0, (useSettings.traceLogs ? '[' + level + '] ' : '') + message);

    if (LOG_LEVEL_ENUM[level] <= useSettings.level) {
      var method = useSettings.traceLogs ? 'trace' : level.toLowerCase();
      method = typeof console[method] !== 'function' ? 'log' : method;
      console[method].apply(console, args);
    }

    stats.global[level.toLowerCase()]++;
    stats.components[componentId][level.toLowerCase()]++;

    // TODO: Push logs to remote server when requested.
  };

  /**
   * Function that checks the `options` provided and loops the log items. 
   * - Returns `true` if there's not a need to loop.
   */
  var fnLoop = function (options, fn) {
    // Check if `options` is defined, and return is following checks fails
    if (!(options && typeof options === 'object' &&
    // Check also if `options.componentId` is defined
      ((options.componentId && typeof options.componentId === 'string') ||
    // Check also if `options.level` is defined
      (typeof options.level === 'number' && options.level <= 4 && options.level >= -1)))) {
      return true;
    }

    Temasys.Utils.forEach(logs, function (logItem, index) {
      // Check if `options.level` is defined, valid and matches.
      if ((typeof options.level === 'number' ? LOG_LEVEL_ENUM[logItem[0]] === options.level : true) &&
      // Check if `options.componentId` is defined, valid and matches.
        (options.componentId && typeof options.componentId ? options.componentId === logItem[1] : true)) {
        return fn(logItem, index);
      }
    });
  };

  /**
   * Overrides the global _log function.
   */
  _log = {
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
      stats.components[componentId] = {
        debug: 0,
        log: 0,
        info: 0,
        warn: 0,
        error: 0,
        exceptions: []
      };
      listeners.components.push(fn);
      // Configure the current `catch` listener
      fn(listeners.catch);
      return componentId;
    },

    /**
     * Function to push stats to API.
     */
    stat: function (appKey, roomId, peerId, type, data) {
    }
  };

  return {
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
    LOG_LEVEL_ENUM: LOG_LEVEL_ENUM,

    /**
     * Function that sets the debugger configuration.
     * @method setConfig
     * @param {JSON} options The options.
     * - When provided as `null` with `componentId` provided, it unsets the specific component
     *   configuration to use the global configuration.
     * @param {Number} [options.level] The log level.
     * - When not provided, the value is set to `LOG_LEVEL_ENUM.ERROR`.
     * - This references the @(link=Temasys.Debugger:LOG_LEVEL_ENUM:constant).
     * @param {Boolean} [options.traceLogs=false] The flag if Web console logs should be traced.
     * - This uses the `console.trace` function when available.
     * @param {Boolean} [options.cacheLogs=false] The flag if Web console logs should be cached for
     *   fetching in @(link=Temasys.Debugger:getCachedLogs:method).
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
    setConfig: function (options, componentId) {
      var useSettings = {
        level: LOG_LEVEL_ENUM.ERROR,
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
          delete settings.components[componentId];
        } else {
          settings.components[componentId] = useSettings;
        }
      // Set the global configuration : config(options)
      } else {
        settings.global = useSettings;
      }
    },

    /**
     * Function that returns the debugger configuration.
     * @method getConfig
     * @param {String} [componentId] The component ID.
     * - When provided, it returns the configuration only for the specific component.
     * @param {JSON} return The configured options.
     * - Object signature matches the `options` parameter in @(link=Temasys.Debugger:setConfig:method).
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
    getConfig: function (componentId) {
      var useSettings = componentId && typeof componentId === 'string' && settings.components[componentId] ?
        settings.components[componentId] : settings.global;
      return {
        level: useSettings.level,
        traceLogs: useSettings.traceLogs,
        cacheLogs: useSettings.cacheLogs,
        printTimestamp: useSettings.printTimestamp,
        printComponentId: useSettings.printComponentId
      };
    },

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
     * - Note that for tabulation for this, it this requires
     *   @(link=Temasys.Debugger:catchExceptions:method) to be configured.
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
    getStats: function (componentId) {
      return componentId && typeof componentId === 'string' && stats.components[componentId] ?
        stats.components[componentId] : stats.global;
    },

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
    getComponents: function () {
      return Object.keys(stats.components);
    },

    /**
     * Function that watches for logs logged.
     * @method watchForLogs
     * @param {Function} [fn] The callback function.
     * - When not provided as `Function`, it unsubscribes any existing configured callback function.
     * @param {Array} fn.log The log item.
     * - Object signature matches the returned log item in @(link=Temasys.Debugger:logs:method).
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
    watchForLogs: function (fn) {
      listeners.watch = typeof fn === 'function' ? fn : null;
    },

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
    catchExceptions: function (fn) {
      listeners.catch = typeof fn === 'function' ? function (componentId, error) {
        stats[componentId].exceptions.push(error);
        fn(error, componentId);
      } : null;

      Temasys.Utils.forEach(listeners.components, function (fnComponentItem) {
        fnComponentItem(listeners.catch);
      });
    },

    /**
     * Function that gets the cached logs.
     * @method getCachedLogs
     * @param {JSON} [options] The options.
     * - When provided, this may cause performance issues when cached logs size is huge.
     * @param {String} [options.componentId] The component ID of logs to return only.
     * @param {Number} [options.level] The specific level of logs to return only.
     * - This references the @(link=Temasys.Debugger:LOG_LEVEL_ENUM:constant).
     * @param {Array} return The array of log items.
     * @param {Array} return._index The log item.
     * @param {String} return._index._0 The log item level property key.
     * - This references the @(link=Temasys.Debugger:LOG_LEVEL_ENUM:constant).
     * @param {String} return._index._1 The log item component ID.
     * @param {String} return._index._2 The log item timestamp (in ISO-8601 format).
     * @param {String} return._index._3 The log item message.
     * @param {Array} [return._index._4] The log item meta data.
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
    getCachedLogs: function (options) {
      var result = [];

      if (fnLoop(options, function (logItem, index) {
        result.push(logItem);
      })) {
        return logs;
      }

      return result;
    },

    /**
     * Function that clears the cached logs.
     * @method clearCachedLogs
     * @param {JSON} [options] The options.
     * - When `options.componentId` and `options.level` is not provided, it clears all the cached logs.
     * @param {String} [options.componentId] The component ID of logs to clear only.
     * @param {Number} [options.level] The specific level of logs to clear only.
     * - This references the @(link=Temasys.Debugger:LOG_LEVEL_ENUM:constant).
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
    clearCachedLogs: function (options) {
      if (fnLoop(options, function (logItem, index) {
        logs.splice(index, 1);
        return 0;
      })) {
        logs = [];
      }
    },
     
    /**
     * Function that prints the cached logs.
     * @method printCachedLogs
     * @param {JSON} [options] The options.
     * @param {String} [options.componentId] The component ID of logs to print only.
     * @param {Number} [options.level] The specific level of logs to print only.
     * - This references the @(link=Temasys.Debugger:LOG_LEVEL_ENUM:constant).
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
    printCachedLogs: function (options) {
      var fn = function (logItem, index) {
        var method = typeof console[logItem[0].toLowerCase()] !== 'function' ? 'log' : logItem[0].toLowerCase();
        console[method].apply(console, [logItem[3]].concat(logItem[4]));
      };

      if (fnLoop(options, fn)) {
        Temasys.Utils.forEach(logs, fn);
      }
    }
  };
})();

