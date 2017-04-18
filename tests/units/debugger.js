// Mocha specs
var expect = chai.expect;
var assert = chai.assert;
var should = chai.should;
// Part of test
var Temasys = {};
var _log = null;

describe('Temasys.Debugger', function() {
  var cachedConsole = {
    debug: console.debug,
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    trace: console.trace
  };

	// Load the scripts first for each test item to refresh state
	beforeEach(function (done) {
    loadScript([
      'base/source/components/utils.js',
      'base/source/components/debugger.js'
    ], function (err) {
			if (err) {
				throw err;
			}
      done();
		});
	});

  after(function (done) {
    console.debug = cachedConsole.debug;
    console.log = cachedConsole.log;
    console.info = cachedConsole.info;
    console.warn = cachedConsole.warn;
    console.error = cachedConsole.error;
    console.trace = cachedConsole.trace;

    done();
  });

  /**
   * Tests the global `_log` module.
   */
  it('_log', function (done) {
    assert.typeOf(_log.debug, 'function', 'typeof .debug is function');
    assert.typeOf(_log.log, 'function', 'typeof .log is function');
    assert.typeOf(_log.info, 'function', 'typeof .info is function');
    assert.typeOf(_log.warn, 'function', 'typeof .warn is function');
    assert.typeOf(_log.error, 'function', 'typeof .error is function');
    assert.typeOf(_log.configure, 'function', 'typeof .configure is function');
    assert.typeOf(_log.stat, 'function', 'typeof .stat is function');

    done();
  });

  it('_log -> .configure()', function (done) {
    var componentIdA = _log.configure(null, function () {});
    var componentIdBLabel = 'test';
    var componentIdB = _log.configure(componentIdBLabel, function () {});

    assert.typeOf(componentIdA, 'string', 'A: typeof string');
    assert.typeOf(componentIdB, 'string', 'B: typeof string');
    expect(componentIdB).to.equal(componentIdBLabel, 'B: matches defined label');

    // Test if configured callback function matches
    var catchFnArr = [];
    var catchFn = function () {};

    _log.configure(null, function (fn) {
      catchFnArr.push(fn ? typeof fn : fn);
    });

    Temasys.Debugger.catchExceptions(catchFn);

    _log.configure(null, function (fn) {
      catchFnArr.push(fn ? typeof fn : fn);
    });

    Temasys.Debugger.catchExceptions(null);

    _log.configure(null, function (fn) {
      catchFnArr.push(fn ? typeof fn : fn);
    });

    expect(catchFnArr, 'catchExceptions() function is updated').to.deep.equal(
      [null, 'function', 'function', null, null, null]);

    done();
  });

  // Test if the console exists or not
  it('_log -> Fallback when console method is not available', function (done) {
    var componentId = _log.configure(null, function () {});

    Temasys.Debugger.setConfig({ level: Temasys.Debugger.LOG_LEVEL_ENUM.DEBUG });
    Temasys.Utils.forEach(['debug', 'info', 'warn', 'error', 'trace'], function (method) {
      var expectMessage = [null, null];
      console[method] = function () {
        expectMessage[0] = typeof Array.prototype.slice.call(arguments)[0];
      };
      console.log = function () {
        expectMessage[1] = typeof Array.prototype.slice.call(arguments)[0];
      };
      console[method] = null;
      _log[method === 'trace' ? 'debug' : method](componentId, 'test');
      expect(expectMessage, method + ': fallbacks to .log()').to.deep.equal([null, 'string']);
    });
  });

  // Test log levels to not print when not requested
  it('_log -> Prints based on set level', function (done) {
    var componentId = _log.configure(null, function () {});

    Temasys.Utils.forEach(Temasys.Debugger.LOG_LEVEL_ENUM, function (level, levelProp) {
      var messagesCounter = {
        debug: [],
        log: [],
        info: [],
        warn: [],
        error: [],
        trace: []
      };
      var expectMessagesCounter = {
        debug: [],
        log: [],
        info: [],
        warn: [],
        error: [],
        trace: []
      };

      Temasys.Utils.forEach(['debug', 'log', 'info', 'warn', 'error'], function (method) {
        Temasys.Debugger.setConfig({ level: level });
        console[method] = function () {
          messagesCounter[method].push(typeof Array.prototype.slice.call(arguments)[0]);
        };
        _log[method]('test');

        // Test traceLogs setting
        Temasys.Debugger.setConfig({ level: level, traceLogs: true });
        console.trace = function () {
          messagesCounter.trace.push(Array.prototype.slice.call(arguments)[0].indexOf('[' + method.toUpperCase() + '] '));
        };
        _log[method]('test2');

        if (level >= Temasys.Debugger.LOG_LEVEL_ENUM[method.toUpperCase()]) {
          expectMessagesCounter[method].push('string');
          expectMessagesCounter.trace.push(0);
        }
      });

      expect(messagesCounter, levelProp + ': prints when set').to.deep.equal(expectMessagesCounter);
    });

    done();
  });
  
  // Test caching of logs
  it('_log -> Caches log when required', function (done) {
    var componentId = _log.configure(null, function () {});
    var output = [];

    Temasys.Debugger.setConfig({ cacheLogs: true });
    Temasys.Utils.forEach(['debug', 'log', 'info', 'warn', 'error'], function (method) {
      Temasys.Utils.forEach([
        undefined, [1,2], [{ x: 1, y: 3}], [true, 'test'], [['1','2'],[0,1,true]]
      ], function (args) {
        output.push([method.toUpperCase(), 'string', args || []]);
        _log[method]([componentId, 'test_' + method].concat(args || []));
      });
    });

    var cachedLogs = Temasys.Debugger.getCachedLogs();

    expect(cachedLogs, 'Correct length').to.have.lengthOf(output.length);

    Temasys.Utils.forEach(cachedLogs, function (item, index) {
      expect(item[1], item[0] + '(' + JSON.stringify(item[4]) + '): have correct componentId').to.equal(componentId);
      assert.typeOf(typeof (new Date(item[2])).getTime(), 'number',
        item[0] + '(' + JSON.stringify(item[4]) + '): have valid timestamp');
      expect(output[index], item[0] + '(' + JSON.stringify(item[4]) + '): matches'
        ).to.deep.equal([item[0], typeof item[3], item[4]]);
    });

    done();
  });

  // Test printed messages
  it('_log -> Prints message format based on settings', function (done) {
    var componentId = _log.configure(null, function () {});

    Temasys.Debugger.setConfig({ level: Temasys.Debugger.LOG_LEVEL_ENUM.DEBUG });
    Temasys.Utils.forEach([
      ['test', ' - test'],
      [[null, null, null, null, 'test'], ' - test'],
      [['a', null, null, null, 'test'], 'a - test'],
      [[null, 'a', null, null, 'test'], '[RID: a] - test'],
      [[null, null, 'a', null, 'test'], '[PID: a] - test'],
      [[null, null, null, 'a', 'test'], '[CID: a] - test'],
      [['a', 'b', null, null, 'test'], 'a [RID: b] - test'],
      [['a', 'b', 'c', null, 'test'], 'a [RID: a][PID: c] - test'],
      [['a', 'b', 'c', 'd', 'test'], 'a [RID: a][PID: c][CID: d] - test']
    ], function (item) {
      var output = null;
      console.debug = function () {
        output = Array.prototype.slice.call(arguments)[0];
      };
      _log.debug(componentId, item[0]);
      expect(output, JSON.stringify(item[0]) + ': matches string').to.equal(item[1]);
    });

    Temasys.Debugger.setConfig({ level: Temasys.Debugger.LOG_LEVEL_ENUM.DEBUG, printComponentId: true });
    Temasys.Utils.forEach(['test', ['a', null, null, null, 'test']], function (item) {
      var output = null;
      console.debug = function () {
        output = Array.prototype.slice.call(arguments)[0];
      };
      _log.debug(componentId, item);
      expect(output, JSON.stringify(item) + ': component ID is printed').to.contain(' :: ' + componentId);
    });

    Temasys.Debugger.setConfig({ level: Temasys.Debugger.LOG_LEVEL_ENUM.DEBUG, printTimestamp: true });
    Temasys.Utils.forEach(['test', ['a', null, null, null, 'test']], function (item) {
      var output = null;
      console.debug = function () {
        output = Array.prototype.slice.call(arguments)[0];
      };
      _log.debug(componentId, item);
      expect(output, JSON.stringify(item) + ': timestamp is printed').match(
        /\|\ [0-9]{4}\-[0-9]{2}\-[0-9]{2}\T[0-9]{2}\:[0-9]{2}\:[0-9]{2}\.[0-9]{1,4}[A-Za-z]{1}\ /gi);
    });

    Temasys.Debugger.setConfig({ level: Temasys.Debugger.LOG_LEVEL_ENUM.DEBUG });
    Temasys.Utils.forEach([undefined, [1, 2], [{x:1,y:2}], ['test'], [true, true], [[1,2], '1']], function (item) {
      var output = null;
      console.debug = function () {
        output = Array.prototype.slice.call(arguments)[0];
        output.shift();
      };
      _log.debug.apply(this, [componentId, 'test'].concat(item || []));
      expect(output, JSON.stringify(item) + ': parameters are printed').to.deep.equal(item || []);
    });

    done();
  });

  // Test different component settings being used
  it('_log -> Honors different component settings being used', function (done) {
    var componentIdA = _log.configure(null, function () {});
    var componentIdB = _log.configure(null, function () {});
    var componentIdC = _log.configure(null, function () {});
    var expectOutput = {
      a: [0,0,0],
      b: [0,0,0],
      c: [0,0,0]
    };
    console.debug = function () {
      if (Array.prototype.slice.call(arguments)[0].indexOf('a') > -1) {
        expectOutput.a[0]++;
      } else if (Array.prototype.slice.call(arguments)[0].indexOf('b') > -1) {
        expectOutput.b[0]++;
      } else {
        expectOutput.c[0]++;
      }
    };
    console.error = function () {
      if (Array.prototype.slice.call(arguments)[0].indexOf('a') > -1) {
        expectOutput.a[1]++;
      } else if (Array.prototype.slice.call(arguments)[0].indexOf('b') > -1) {
        expectOutput.b[1]++;
      } else {
        expectOutput.c[1]++;
      }
    };
    console.info = function () {
      if (Array.prototype.slice.call(arguments)[0].indexOf('a') > -1) {
        expectOutput.a[2]++;
      } else if (Array.prototype.slice.call(arguments)[0].indexOf('b') > -1) {
        expectOutput.b[2]++;
      } else {
        expectOutput.c[2]++;
      }
    };

    Temasys.Debugger.setConfig({ level: Temasys.Debugger.LOG_LEVEL_ENUM.ERROR }, componentIdA);
    Temasys.Debugger.setConfig({ level: Temasys.Debugger.LOG_LEVEL_ENUM.INFO }, componentIdB);
    Temasys.Debugger.setConfig({ level: Temasys.Debugger.LOG_LEVEL_ENUM.DEBUG });

    _log.debug(componentIdA, 'a');
    _log.debug(componentIdB, 'b');
    _log.debug(componentIdC, 'c');
    _log.error(componentIdA, 'a');
    _log.error(componentIdB, 'b');
    _log.error(componentIdC, 'c');
    _log.info(componentIdA, 'a');
    _log.info(componentIdB, 'b');
    _log.info(componentIdC, 'c');

    expect(expectOutput.a, 'A: Expected configuration').to.deep.equal([0,1,0]);
    expect(expectOutput.b, 'B: Expected configuration').to.deep.equal([0,1,1]);
    expect(expectOutput.c, 'C: Expected configuration').to.deep.equal([1,1,1]);

    done();
  });

  // Test the stats tabulated
  it('_log -> Tabulate stats', function (done) {
    var componentIdB = _log.configure(null, function () {});
    var componentIdC = _log.configure(null, function () {});
    var statsCounter = {
      total: { debug: 0, log: 0, info: 0, warn: 0, error: 0 },
      components: {}
    };
    var fnPushStats = function (componentId, method) {
      _log[method](componentId, 'test');
      statsCounter[method]++;
      statsCounter.components[componentId] = statsCounter.components[componentId] ||
        { debug: 0, log: 0, info: 0, warn: 0, error: 0 };
    };
    var index = 0;

    while (index < 5) {
      var componentId = _log.configure(null, function () {});

      _log.debug(componentId, 'test');
      _log.debug(componentId, 'test');
      _log.debug(componentId, 'test');
      _log.debug(componentId, 'test');
      _log.debug(componentId, 'test');
    }

    Temasys.Utils.forEach(['a','b','c'], function () {

    })
    var fnLog = function (method, args) {
      _log[method].apply(this, [componentId].concat(args));
      statsCounter.components[componentId][method]++;
      statsCounter.total[method]++;
    };

    statsCounter.components[componentId] = { debug: 0, log: 0, info: 0, warn: 0, error: 0 };*/
  })

  /**
   * Tests the `LOG_LEVEL_ENUM` constant.
   */
  it('LOG_LEVEL_ENUM', function (done) {
    assert.typeOf(Temasys.Debugger.LOG_LEVEL_ENUM, 'object', 'typeof is object');
    assert.isNotNull(Temasys.Debugger.LOG_LEVEL_ENUM, 'Is not null');
    
    Temasys.Utils.forEach(Temasys.Debugger.LOG_LEVEL_ENUM, function (item, itemProp) {
      assert.typeOf(item, 'number', itemProp + ': typeof is number');
    });

    done();
  });

	/**
   * Tests the `setConfig()` and `getConfig()` method.
   */
  it('setConfig(), getConfig()', function (done) {
    // Check the config settings
    var fnConfigTest = function (config, componentId) {
      var expectConfig = {
        level: (function () {
          var found = null;
          if (config && typeof config === 'object' && typeof config.level === 'number') {
            Temasys.Utils.forEach(Temasys.Debugger.LOG_LEVEL_ENUM, function (item) {
              if (item === config.level) {
                found = item;
                return true;
              }
            });
          }
          return found ? found : Temasys.Debugger.LOG_LEVEL_ENUM.ERROR;
        })(),
        printTimestamp: config && typeof config === 'object' &&
          typeof config.printTimestamp === 'boolean' ? config.printTimestamp : false,
        printComponentId: config && typeof config === 'object' &&
          typeof config.printComponentId === 'boolean' ? config.printComponentId : false,
        cacheLogs: config &&
          typeof config === 'object' && typeof config.cacheLogs === 'boolean' ? config.cacheLogs : false,
        traceLogs: config && typeof config === 'object' &&
          typeof config.traceLogs === 'boolean' ? config.traceLogs : false
      };

      Temasys.Debugger.setConfig(expectConfig, componentId || undefined);
      expect(Temasys.Debugger.getConfig(componentId || undefined), '(' +
        (config === undefined ? '' : JSON.stringify(config)) +
        (componentId ? ', ' + componentId : '') + ') to be equal').to.deep.equal(expectConfig);
    };

    // Test global configuration : setConfig(options)
    fnConfigTest();
    fnConfigTest(null);
    fnConfigTest(false);
    fnConfigTest(true);
    fnConfigTest(1);
    fnConfigTest('test');
    fnConfigTest([]);
    fnConfigTest({ printComponentId: true, printTimestamp: false });
    fnConfigTest({ printComponentId: true, printTimestamp: true });
    fnConfigTest({ traceLogs: true, cacheLogs: false });
    fnConfigTest({ traceLogs: false, cacheLogs: true });
    fnConfigTest({ traceLogs: true, cacheLogs: true });
    fnConfigTest({ level: Temasys.Debugger.LOG_LEVEL_ENUM.DEBUG });
    fnConfigTest({ level: Temasys.Debugger.LOG_LEVEL_ENUM.NONE });
    fnConfigTest({ level: Temasys.Debugger.LOG_LEVEL_ENUM.ERROR });
    fnConfigTest({ level: Temasys.Debugger.LOG_LEVEL_ENUM.INFO });
    fnConfigTest({ level: Temasys.Debugger.LOG_LEVEL_ENUM.WARN });
    fnConfigTest({ level: Temasys.Debugger.LOG_LEVEL_ENUM.LOG });

    // Test component configuration : setConfig(options, componentId)
    var testComponentId = _log.configure(null, function () {});

    fnConfigTest({ printComponentId: true, printTimestamp: false }, testComponentId);
    fnConfigTest({ printComponentId: true, printTimestamp: true }, testComponentId);
    fnConfigTest({ traceLogs: true, cacheLogs: false }, testComponentId);
    fnConfigTest({ traceLogs: false, cacheLogs: true }, testComponentId);
    fnConfigTest({ traceLogs: true, cacheLogs: true }, testComponentId);
    fnConfigTest({ level: Temasys.Debugger.LOG_LEVEL_ENUM.DEBUG }, testComponentId);
    fnConfigTest({ level: Temasys.Debugger.LOG_LEVEL_ENUM.NONE }, testComponentId);
    fnConfigTest({ level: Temasys.Debugger.LOG_LEVEL_ENUM.ERROR }, testComponentId);
    fnConfigTest({ level: Temasys.Debugger.LOG_LEVEL_ENUM.INFO }, testComponentId);
    fnConfigTest({ level: Temasys.Debugger.LOG_LEVEL_ENUM.WARN }, testComponentId);
    fnConfigTest({ level: Temasys.Debugger.LOG_LEVEL_ENUM.LOG }, testComponentId);
    fnConfigTest('', testComponentId);
    fnConfigTest([], testComponentId);
    fnConfigTest(true, testComponentId);
    fnConfigTest(12, testComponentId);

    // Test component unset configuration is working : setConfig(null, componentId)
    Temasys.Debugger.setConfig({ printComponentId: true, printTimestamp: true }, testComponentId);
    Temasys.Debugger.setConfig(null, testComponentId);

    expect(Temasys.Debugger.getConfig(testComponentId).printComponentId, 'Unsets "printComponentId" to global').to.equal(false);
    expect(Temasys.Debugger.getConfig(testComponentId).printTimestamp, 'Unsets "printTimestamp" to global').to.equal(false);

    // Test the setConfig({ cacheLogs: .. }) option to ensure it is correct
    Temasys.Debugger.setConfig({ cacheLogs: true });

    _log.debug(testComponentId, 'Test A');
    _log.log(testComponentId, ['A', 'B', 'C', 'D', 'E']);

    expect(Temasys.Debugger.getCachedLogs()).to.have.lengthOf(2);

    // Test the setConfig({ printTimestamp: .. }) option to ensure it is correct
    Temasys.Debugger.clearCachedLogs();
    Temasys.Debugger.setConfig({ cacheLogs: true, printTimestamp: true });

    _log.debug(testComponentId, 'Test B');

    expect(Temasys.Debugger.getCachedLogs()[0][3], 'Contain timestamp').to.have.string('| ' + Temasys.Debugger.getCachedLogs()[0][2]);

    // Test the setConfig({ printComponentId: .. }) option to ensure it is correct
    Temasys.Debugger.clearCachedLogs();
    Temasys.Debugger.setConfig({ cacheLogs: true, printComponentId: true });

    _log.debug(testComponentId, ['A', 'B', 'C', 'ok', 'Test B']);

    expect(Temasys.Debugger.getCachedLogs()[0][3], 'Contain timestamp').to.have.string(':: ' + testComponentId);

    var cachedConsole = {
      log: console.log,
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error,
      trace: console.trace
    };

    // Test the setConfig({ traceLogs: .. }) option to ensure it is correct
    (function () {
      Temasys.Debugger.setConfig({ traceLogs: true, level: Temasys.Debugger.LOG_LEVEL_ENUM.DEBUG });

      var traceArgs = [];
      var fnTraceLogsTest = function (level, message, args) {
        _log[level].apply(this, [testComponentId, message].concat(args ? args : []));

        expect(traceArgs).to.have.lengthOf(1 + (args ? args.length : 0));
        expect(traceArgs[0]).to.have.string('[' + level.toUpperCase() + ']');
      };

      console.trace = function () {
        traceArgs = Array.prototype.slice.call(arguments);
      };
 
      fnTraceLogsTest('debug', 'TestA');
      fnTraceLogsTest('log', 'TestB', [1, 2]);
      fnTraceLogsTest('info', 'TestC', [{ a: 1, b: 0}]);
      fnTraceLogsTest('warn', 'TestD', [true]);
      fnTraceLogsTest('error', 'TestE', ['ok', 1, 2, { a: 1, b: 0}, [1,2]]);
    })();

    // Test the setConfig({ level: .. }) option to ensure it is correct
    (function () {
      var fnLevelTest = function (level) {
        var counters = {
          debug: 0,
          log: 0,
          info: 0,
          warn: 0,
          error: 0
        };

        Temasys.Debugger.setConfig({ level: level });

        console.debug = function () { counters.debug++; };
        console.log = function () { counters.log++; };
        console.info = function () { counters.info++; };
        console.warn = function () { counters.warn++; };
        console.error = function () { counters.error++; };

        _log.debug(testComponentId, 'test');
        _log.log(testComponentId, 'test');
        _log.info(testComponentId, 'test');
        _log.warn(testComponentId, 'test');
        _log.error(testComponentId, 'test');

        expect(counters.debug, 'Prints correct debug logs').to.equal(level >= Temasys.Debugger.LOG_LEVEL_ENUM.DEBUG ? 1 : 0);
        expect(counters.log, 'Prints correct log logs').to.equal(level >= Temasys.Debugger.LOG_LEVEL_ENUM.LOG ? 1 : 0);
        expect(counters.info, 'Prints correct info logs').to.equal(level >= Temasys.Debugger.LOG_LEVEL_ENUM.INFO ? 1 : 0);
        expect(counters.warn, 'Prints correct warn logs').to.equal(level >= Temasys.Debugger.LOG_LEVEL_ENUM.WARN ? 1 : 0);
        expect(counters.error, 'Prints correct error logs').to.equal(level >= Temasys.Debugger.LOG_LEVEL_ENUM.ERROR ? 1 : 0);
      };

      Temasys.Utils.forEach(Temasys.Debugger.LOG_LEVEL_ENUM, fnLevelTest);
    })();

    console.trace = cachedConsole.trace;
    console.debug = cachedConsole.debug;
    console.log = cachedConsole.log;
    console.info = cachedConsole.info;
    console.warn = cachedConsole.warn;
    console.error = cachedConsole.error;

    done();
  });

  /**
   * Tests the `getCachedLogs` method.
   */
  it('getCachedLogs()', function (done) {
    // TODO
    done();
  });

  /**
   * Tests the `clearCachedLogs` method.
   */
  it('clearCachedLogs()', function (done) {
    // TODO
    done();
  });

  /**
   * Tests the `printCachedLogs` method.
   */
  it('printCachedLogs()', function (done) {
    // TODO
    done();
  });

  /**
   * Tests the `catchExceptions` method.
   */
  it('catchExceptions()', function (done) {
    // TODO
    done();
  });

  /**
   * Tests the `watchForLogs` method.
   */
  it('watchForLogs()', function (done) {
    // TODO
    done();
  });

  /**
   * Tests the `getComponents` method.
   */
  it('getComponents()', function (done) {
    // TODO
    done();
  });

  /**
   * Tests the `getStats` method.
   */
  it('getStats()', function (done) {
    // TODO
    done();
  });

  /**
   * Tests the `catchExceptions` method.
   */
  it('catchExceptions()', function (done) {
    // TODO
    done();
  });
});