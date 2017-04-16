// Mocha specs
var expect = chai.expect;
var assert = chai.assert;
var should = chai.should;
// Part of test
var Temasys = {};
var _log = null;

describe('Temasys.Debugger', function() {
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

  /**
   * Tests the global `_log` module.
   */
  it('_log', function (done) {
    var componentIdA = _log.configure(null, function () {});
    var componentIdB = _log.configure('test', function () {});

    assert.typeOf(componentIdA, 'string', 'typeof string');
    assert.isDefined(componentIdA, 'Is defined');
    expect(componentIdB, 'To match as specified').to.equal('test');

    // TODO: _log tests

    done();
  });

  /**
   * Tests the `LOG_LEVEL_ENUM` constant.
   */
  it('LOG_LEVEL_ENUM', function (done) {
    assert.typeOf(Temasys.Debugger.LOG_LEVEL_ENUM, 'object', 'typeof');
    assert.isNotNull(Temasys.Debugger.LOG_LEVEL_ENUM, 'Is not null');
    expect(Temasys.Debugger.LOG_LEVEL_ENUM).to.deep.equal({
      DEBUG: 4,
      LOG: 3,
      INFO: 2,
      WARN: 1,
      ERROR: 0,
      NONE: -1
    });

    done();
  });

	/**
   * Tests the `setConfig()` and `getConfig()` method.
   */
  it('setConfig() + getConfig()', function (done) {
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