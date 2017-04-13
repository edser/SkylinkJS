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
    level: LOG_LEVEL_ENUM.ERROR,
    traceLogs: false,
    cacheLogs: false,
    printTimestamp: false,
    printComponentId: false
  };

  // Stores the logs stats.
  var stats = {};

  // Stores the logs.
  var logs = [];

  // Stores the listener functions.
  window.listeners = { catch: null, watch: null, components: [] };

  /**
   * Function that logs message to Web console.
   */
  var fnLog = function (level, args) {
    // 0: Component ID
    // 1: Message
    // 2+: Meta data
    var componentId = args[0];
    var timestamp = (new Date()).toISOString();
    // E.g. Peer :: 34234234234 | 2017-04-12T12:41:55.563Z [RID: werwer][PID: xxx-werwer-][CID: test] - Test log is here -> null
    var message = Array.isArray(args[1]) ? args[1][0] + ' ' + (settings.printComponentId ? ':: ' + componentId + ' ' : '') +
      (settings.printTimestamp ? '| ' + timestamp + ' ' : '') +
      (args[1][1] ? '[RID: ' + args[1][1] + ']' : '') +
      (args[1][2] ? '[PID: ' + args[1][2] + ']' : '') +
      (args[1][3] ? '[CID: ' + args[1][3] + ']' : '') + ' - ' + args[1][4] : args[1];
    // Remove the first 2 arguments and leave the meta data
    args.splice(0, 2);

    var logItem = [level, componentId, timestamp, message, args.concat([])];

    if (settings.cacheLogs) {
      logs.push(logItem);
    }

    if (typeof listeners.watch === 'function') {
      listeners.watch(logItem, componentId);
    }

    args.splice(0, 0, (settings.traceLogs ? '[' + level + '] ' : '') + message);

    if (LOG_LEVEL_ENUM[level] <= settings.level) {
      var method = settings.traceLogs ? 'trace' : level.toLowerCase();
      method = typeof console[method] !== 'function' ? 'log' : method;
      console[method].apply(console, args);
    }
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
    configure: function (fn) {
      var componentId = Date.now() + '-' + performance.now();
      stats[componentId] = {
        debug: 0,
        log: 0,
        info: 0,
        warn: 0,
        error: 0,
        exceptions: []
      };
      listeners.components.push(fn);
      fn(listeners.catch);
      return componentId;
    }
  };

  return {
    /**
     * The enum of debugger log levels.
     * @attribute LOG_LEVEL_ENUM
     * @param {Number} NONE The level to print no logs.
     * @param {Number} ERROR The level to print "error" logs.
     * @param {Number} WARN The level to print "error", "warn" logs.
     * @param {Number} INFO The level to print "error", "warn", "info" logs.
     * @param {Number} LOG The level to print "error", "warn", "info", "log" logs.
     * @param {Number} DEBUG The level to print "error", "warn", "info", "log", "debug" logs.
     * @type JSON
     * @final
     * @readOnly
     * @for Temasys.Debugger
     * @since 0.7.0
     */
    LOG_LEVEL_ENUM: LOG_LEVEL_ENUM,

    /**
     * Function that sets or returns the debugger configuration.
     * @method config
     * @param {JSON} [options] The options.
     * - When not provided, the current configured options is returned.
     * @param {Number} [options.level] The log level.
     * - When not provided, the value is set to `LOG_LEVEL_ENUM.ERROR`.
     * - This references the @(link=Temasys.Debugger:LOG_LEVEL:constant).
     * @param {Boolean} [options.traceLogs=false] The flag if Web console logs should be traced.
     * - This uses the `console.trace` function when available.
     * @param {Boolean} [options.cacheLogs=false] The flag if Web console logs should be cached for
     *   fetching in @(link=Temasys.Debugger:getCachedLogs:method) or @(link=Temasys.Debugger:printCachedLogs:method).
     * @param {Boolean} [options.printTimestamp=false] The flag if timestamps (ISO-8601) should be
     *   printed on Web console logs.
     * @param {Boolean} [options.printComponentId=false] The flag if component ID should be
     *   printed on Web console logs.
     * @param {JSON} return The configured options.
     * - This is only returned when `options` parameter is not provided.
     * - Object signature matches the `options` parameter provided.
     * @return {JSON}
     * @for Temasys.Debugger
     * @since 0.7.0
     */
    config: function (options) {
      // Return the currently configured options
      if (typeof options === 'undefined') {
        return {
          level: settings.level,
          traceLogs: settings.traceLogs,
          cacheLogs: settings.cacheLogs,
          printTimestamp: settings.printTimestamp,
          printComponentId: settings.printComponentId
        };
      // Set the new options
      } else {
        settings.level = LOG_LEVEL_ENUM.ERROR;
        settings.traceLogs = false;
        settings.cacheLogs = false;
        settings.printTimestamp = false;
        settings.printComponentId = false;

        if (options && typeof options === 'object') {
          settings.level = typeof options.level === 'number' && options.level <= 4 && options.level >= -1 ? options.level : settings.level;
          settings.traceLogs = typeof options.traceLogs === 'boolean' ? options.traceLogs : settings.traceLogs;
          settings.cacheLogs = typeof options.cacheLogs === 'boolean' ? options.cacheLogs : settings.cacheLogs;
          settings.printTimestamp = typeof options.printTimestamp === 'boolean' ? options.printTimestamp : settings.printTimestamp;
          settings.printComponentId = typeof options.printComponentId === 'boolean' ? options.printComponentId : settings.printComponentId;
        }
      }
    },

    /**
     * Function that returns the debugger stats.
     * @method stats
     * @param {JSON} return The stats.
     * @param {JSON} return.total The total stats.
     * @param {Number} return.total.debug The total "debug" logs received.
     * @param {Number} return.total.log The total number of "log" logs received.
     * @param {Number} return.total.info The total number of "info" logs received.
     * @param {Number} return.total.warn The total number of "warn" logs received.
     * @param {Number} return.total.error The total number of "error" logs received.
     * @param {Array} return.total.exceptions The total exceptions caught.
     * - Each array item is an `Error` object.
     * @param {JSON} return.components The total stats for each component.
     * @param {JSON} return.components._componentId The total stats for the component.
     * - `"componentId"` property key can be identified as the component ID.
     * - Object signature matches returned object `total`.
     * @for Temasys.Debugger
     * @since 0.7.0
     */
    stats: function () {
      var result = {
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

      Temasys.Utils.forEach(stats, function (statsItem, statsItemProp) {
        result.components[statsItemProp] = statsItem;
        result.total.debug += statsItem.debug;
        result.total.log += statsItem.log;
        result.total.info += statsItem.info;
        result.total.warn += statsItem.warn;
        result.total.error += statsItem.error;
        result.total.exceptions.concat(statsItem.exceptions);
      });

      return result;
    },

    /**
     * Function that watches for any logs.
     * @method watch
     * @param {Function} [fn] The callback function.
     * - When not provided, it unsubscribes any existing callback function watching for logs.
     * @param {Array} fn.log The log item.
     * - Object signature matches the returned log item in @(link=Temasys.Debugger:logs:method).
     * @param {String} fn.componentId The component ID.
     * @for Temasys.Debugger
     * @since 0.7.0
     */
    watch: function (fn) {
      listeners.watch = typeof fn === 'function' ? fn : null;
    },

    /**
     * Function that catches any exceptions in event callback function handlers.
     * @method catch
     * @param {Function} [fn] The callback function.
     * - When not provided, it unsubscribes any existing callback function watching for logs.
     * @param {Error} fn.error The error object caught.
     * @param {String} fn.componentId The component ID.
     * @for Temasys.Debugger
     * @since 0.7.0
     */
    catch: function (fn) {
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
     * @method logs
     * @param {JSON} [options] The options.
     * - When provided, this may cause performance issues when cached logs size is huge.
     * @param {String} [options.componentId] The component ID of logs to return only.
     * @param {Number} [options.level] The level  of logs to return only.
     * - This references the @(link=Temasys.Debugger:LOG_LEVEL:constant).
     * @param {Array} return The array of log items.
     * @param {Array} return._index The log item.
     * @param {String} return._index._0 The log item level property key.
     * - This references the @(link=Temasys.Debugger:LOG_LEVEL:constant).
     * @param {String} return._index._1 The log item component ID.
     * @param {String} return._index._2 The log item timestamp (in ISO-8601 format).
     * @param {String} return._index._3 The log item message.
     * @param {Array} [return._index._4] The log item meta data.
     * @return {Array}
     * @for Temasys.Debugger
     * @since 0.7.0
     */
    logs: function (options) {
      // Check if `options` is defined, and return is following checks fails
      if (!(options && typeof options === 'object' &&
      // Check also if `options.componentId` is defined
        ((options.componentId && typeof options.componentId === 'string') ||
      // Check also if `options.level` is defined
        (typeof options.level === 'number' && options.level <= 4 && options.level >= -1)))) {
        return logs;
      }

      var result = [];

      Temasys.Utils.forEach(logs, function (logItem) {
        // Check if `options.level` is defined, valid and matches.
        if ((typeof options.level === 'number' && options.level <= 4 && options.level >= -1 ?
          LOG_LEVEL_ENUM[logItem[0]] <= options.level : true) &&
        // Check if `options.componentId` is defined, valid and matches.
          (options.componentId && typeof options.componentId ? options.componentId === logItem[1] : true)) {
          result.push(logItem);
        }
      });

      return result;
    },

    /**
     * Function that prints the cached logs.
     * @method print
     * @param {JSON} [options] The options.
     * @param {String} [options.componentId] The component ID of logs to print only.
     * @param {Number} [options.level] The level  of logs to print only.
     * - This references the @(link=Temasys.Debugger:LOG_LEVEL:constant).
     * @for Temasys.Debugger
     * @since 0.7.0
     */
    print: function (options) {
      Temasys.Utils.forEach(logs, function (logItem) {
        // Check if `options` is defined first if not print all.
        if (options && typeof options === 'object' ?
        // Check if `options.level` is defined, valid and matches.
          (typeof options.level === 'number' && options.level <= 4 && options.level >= -1 ?
          LOG_LEVEL_ENUM[logItem[0]] <= options.level : true) &&
        // Check if `options.componentId` is defined and matches.
          (options.componentId && typeof options.componentId ? options.componentId === logItem[1] : true) : true) {
          var method = typeof console[logItem[0].toLowerCase()] !== 'function' ? 'log' : logItem[0].toLowerCase();
          console[method].apply(console, [logItem[3]].concat(logItem[4]));
        }
      });
    }
  }
})();

