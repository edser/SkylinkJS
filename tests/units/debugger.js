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
    assert.typeOf(_log.throw, 'function', 'typeof .throw is function');

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

    done();
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
        _log[method](componentId, 'test');

        // Test traceLogs setting
        Temasys.Debugger.setConfig({ level: level, traceLogs: true });
        console.trace = function () {
          messagesCounter.trace.push(Array.prototype.slice.call(arguments)[0].indexOf('[' + method.toUpperCase() + '] '));
        };
        _log[method](componentId, 'test2');

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
        _log[method].apply(this, [componentId, 'test_' + method].concat(args || []));
      });
    });

    var cachedLogs = Temasys.Debugger.getCachedLogs();

    expect(cachedLogs, 'Correct length').to.have.lengthOf(output.length);

    Temasys.Utils.forEach(cachedLogs, function (item, index) {
      expect(item[1], item[0] + '(' + JSON.stringify(item[4]) + '): have correct componentId').to.equal(componentId);
      assert.typeOf((new Date(item[2])).getTime(), 'number',
        item[0] + '(' + JSON.stringify(item[4]) + '): have valid timestamp');
      expect(output[index], item[0] + '(' + JSON.stringify(item[4]) + '): matches'
        ).to.deep.equal([item[0], typeof item[3], item[4]]);
      expect(item[5], item[0] + '(' + JSON.stringify(item[4]) + '): have valid performance timestamp').to.be.above(0);
    });

    done();
  });

  // Test printed messages
  it('_log -> Prints message format based on settings', function (done) {
    var componentId = _log.configure(null, function () {});

    Temasys.Debugger.setConfig({ level: Temasys.Debugger.LOG_LEVEL_ENUM.DEBUG });
    Temasys.Utils.forEach([
      ['test', 'test'],
      [[null, null, null, null, 'test'], 'test'],
      [['a', null, null, null, 'test'], 'a - test'],
      [[null, 'a', null, null, 'test'], '[RID: a] - test'],
      [[null, null, 'a', null, 'test'], '[PID: a] - test'],
      [[null, null, null, 'a', 'test'], '[CID: a] - test'],
      [['a', 'b', null, null, 'test'], 'a [RID: b] - test'],
      [['a', 'b', 'c', null, 'test'], 'a [RID: b][PID: c] - test'],
      [['a', 'b', 'c', 'd', 'test'], 'a [RID: b][PID: c][CID: d] - test']
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
      expect(output, JSON.stringify(item) + ': component ID is printed').to.contain(':: ' + componentId);
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
        output = Array.prototype.slice.call(arguments);
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
    var statsCounter = {
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
    var fnPushStats = function (componentId, method) {
      _log[method](componentId, 'test');
      statsCounter.total[method]++;
      statsCounter.components[componentId][method]++; 
    };
    var index = 0;

    while (index < 5) {
      var fnCatcher = null;
      var componentId = _log.configure(null, function (fn) {
        fnCatcher = fn;
      });
      var expectExceptions = [];

      statsCounter.components[componentId] = {
        debug: 0,
        log: 0,
        info: 0,
        warn: 0,
        error: 0,
        exceptions: []
      };

      fnPushStats(componentId, 'debug');
      fnPushStats(componentId, 'debug');
      fnPushStats(componentId, 'log');
      fnPushStats(componentId, 'log');
      fnPushStats(componentId, 'log');
      fnPushStats(componentId, 'info');
      fnPushStats(componentId, 'info');
      fnPushStats(componentId, 'warn');
      fnPushStats(componentId, 'warn');
      fnPushStats(componentId, 'warn');
      fnPushStats(componentId, 'error');
      fnPushStats(componentId, 'error');

      Temasys.Debugger.catchExceptions(function (error, _componentId) {
        expectExceptions.push([error, _componentId]);
      });

      assert.typeOf(fnCatcher, 'function', index + ': catchExceptions(fn) is typeof function');

      var error1 = new Error('test1');
      var error2 = new Error('test2');
      var error3 = new Error('test3');
      var error4 = new Error('test4');
      var error5 = new Error('test5');
      var throwError1 = new Error('test6');
      var throwError2 = new Error('test7');

      expect(function () {
        fnCatcher(componentId, error1);
        fnCatcher(componentId, error2);
        statsCounter.total.exceptions.push(error1);
        statsCounter.total.exceptions.push(error2);
        statsCounter.components[componentId].exceptions.push(error1);
        statsCounter.components[componentId].exceptions.push(error2);
        _log.throw(componentId, throwError1);
        statsCounter.total.exceptions.push(throwError1);
        statsCounter.components[componentId].exceptions.push(throwError1);

      }, index + ': catchExceptions(fn) should not throw errors').to.not.throw(Error);

      Temasys.Debugger.catchExceptions(null);
      assert.isNull(fnCatcher, index + ': catchExceptions(fn) is null');

      expect(function () {
        fnCatcher(componentId, error3);
        fnCatcher(componentId, error4);
        fnCatcher(componentId, error5);
        _log.throw(componentId, throwError2);
      }, index + ': catchExceptions() should throw errors on event handlers errors').to.throw(Error);

      expect(function () {
        _log.throw(componentId, throwError2);
      }, index + ': catchExceptions() should throw errors on _log.throw()').to.throw(Error);

      expect(expectExceptions, index + ': trigger correct exceptions').to.deep.equal([
        [error1, componentId], [error2, componentId], [throwError1, componentId]]);
      expect(Temasys.Debugger.getStats(componentId), index + ': tabulate correct component stats'
        ).to.deep.equal(statsCounter.components[componentId]);

      index++;
    }

    expect(Temasys.Debugger.getStats(), 'Tabulate correct total stats').to.deep.equal(statsCounter.total);

    done();
  });

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
  it('setConfig() and getConfig()', function (done) {
    var componentIdA = _log.configure(null, function () {});
    var componentIdB = _log.configure(null, function () {});
    var fnExpectOptions = function (options) {
      return ;
    };

    Temasys.Utils.forEach([undefined, null, true, 1, 'test', [], { printComponentId: true },
      { printTimestamp: true }, { cacheLogs: true }, { traceLogs: true },
      { level: Temasys.Debugger.LOG_LEVEL_ENUM.DEBUG },
      { level: Temasys.Debugger.LOG_LEVEL_ENUM.NONE },
      { level: Temasys.Debugger.LOG_LEVEL_ENUM.ERROR },
      { level: Temasys.Debugger.LOG_LEVEL_ENUM.INFO },
      { level: Temasys.Debugger.LOG_LEVEL_ENUM.WARN },
      { level: Temasys.Debugger.LOG_LEVEL_ENUM.LOG }
    ], function (item) {
      Temasys.Utils.forEach([undefined, componentIdA, componentIdB], function (_componentId) {
        Temasys.Debugger.setConfig(item, _componentId);
        expect(Temasys.Debugger.getConfig(_componentId), '(' + JSON.stringify(item) + ', ' +
          _componentId + '): sets config correctly').to.deep.equal( Temasys.Utils.extend({
            level: Temasys.Debugger.LOG_LEVEL_ENUM.ERROR,
            printTimestamp: false,
            printComponentId: false,
            cacheLogs: false,
            traceLogs: false
        }, item) );
      });
    });

    // Test component unset configuration is working : setConfig(null, componentId)
    var expectUnsetComponents = { a: [], b: [], global: [] };
    var fnUpdateConfig = function () {
      var aConfig = Temasys.Debugger.getConfig(componentIdA);
      var bConfig = Temasys.Debugger.getConfig(componentIdB);
      var globalConfig = Temasys.Debugger.getConfig();
      expectUnsetComponents.a.push([aConfig.printComponentId, aConfig.printTimestamp]);
      expectUnsetComponents.b.push([bConfig.printComponentId, bConfig.printTimestamp]);
      expectUnsetComponents.global.push([globalConfig.printComponentId, globalConfig.printTimestamp]);
    };

    Temasys.Debugger.setConfig({}, componentIdA);
    Temasys.Debugger.setConfig({}, componentIdB);
    Temasys.Debugger.setConfig({ printComponentId: true });
    fnUpdateConfig();

    Temasys.Debugger.setConfig({ printTimestamp: true }, componentIdB);
    fnUpdateConfig();

    Temasys.Debugger.setConfig(null, componentIdA);
    fnUpdateConfig();

    Temasys.Debugger.setConfig(null, componentIdB);
    fnUpdateConfig();

    Temasys.Debugger.setConfig({ printTimestamp: true, printComponentId: false });
    fnUpdateConfig();

    expect(expectUnsetComponents.a, 'A: should unset and return correct config correctly').to.deep.equal(
      [[false, false], [false, false], [true, false], [true, false], [false, true]]);
    expect(expectUnsetComponents.b, 'B: should unset and return correct config correctly').to.deep.equal(
      [[false, false], [false, true], [false, true], [true, false], [false, true]]);
    expect(expectUnsetComponents.global, 'Global: should unset and return correct config correctly').to.deep.equal(
      [[true, false], [true, false], [true, false], [true, false], [false, true]]);

    done();
  });

  /**
   * Tests the `getCachedLogs` method.
   */
  it('getCachedLogs()', function (done) {
    var statsCounter = {};
    var componentIdA = _log.configure(null, function () {});
    var componentIdB = _log.configure(null, function () {});

    statsCounter[componentIdA] = { debug: 0, log: 0, info: 0, warn: 0, error: 0 };
    statsCounter[componentIdB] = { debug: 0, log: 0, info: 0, warn: 0, error: 0 };

    Temasys.Debugger.setConfig({ cacheLogs: true });

    var fnTabulateLogs = function (_componentId, method) {
      var length = parseInt((Math.random() * 100).toFixed(0), 10);
      var index = 0;
      statsCounter[_componentId][method] += length;
      while (index < length) {
        _log[method](_componentId, 'test' + (index + 1));
        index++;
      }
    };

    fnTabulateLogs(componentIdA, 'debug');
    fnTabulateLogs(componentIdA, 'log');
    fnTabulateLogs(componentIdA, 'info');
    fnTabulateLogs(componentIdA, 'warn');
    fnTabulateLogs(componentIdA, 'error');
    fnTabulateLogs(componentIdB, 'debug');
    fnTabulateLogs(componentIdB, 'log');
    fnTabulateLogs(componentIdB, 'info');
    fnTabulateLogs(componentIdB, 'warn');
    fnTabulateLogs(componentIdB, 'error');

    Temasys.Utils.forEach([componentIdA, componentIdB, undefined], function (_componentId) {
      Temasys.Utils.forEach(['DEBUG', 'LOG', 'INFO', 'WARN', 'ERROR', undefined], function (levelProp) {
        var outputContainsIncorrect = false;
        var outputLogs = Temasys.Debugger.getCachedLogs({
          level: levelProp ? Temasys.Debugger.LOG_LEVEL_ENUM[levelProp] : levelProp,
          componentId: _componentId
        });

        if (levelProp || _componentId) {
          Temasys.Utils.forEach(outputLogs, function (logItem) {
            if (levelProp ? logItem[0] !== levelProp : (_componentId ? logItem[1] !== _componentId : false)) {
              outputContainsIncorrect = true;
              return true;
            }
          });
        }

        var expectLength = statsCounter[componentIdA].debug + statsCounter[componentIdA].log +
          statsCounter[componentIdA].info + statsCounter[componentIdA].warn + statsCounter[componentIdA].error +
          statsCounter[componentIdB].debug + statsCounter[componentIdB].log + statsCounter[componentIdB].info +
          statsCounter[componentIdB].warn + statsCounter[componentIdB].error;

        if (_componentId && levelProp) {
          expectLength = statsCounter[_componentId][levelProp.toLowerCase()];
        } else if (_componentId) {
          expectLength = statsCounter[_componentId].debug + statsCounter[_componentId].log +
            statsCounter[_componentId].info + statsCounter[_componentId].warn + statsCounter[_componentId].error;
        } else if (levelProp) {
          expectLength = statsCounter[componentIdA][levelProp.toLowerCase()] +
            statsCounter[componentIdB][levelProp.toLowerCase()];
        }

        expect(outputContainsIncorrect, '(' + _componentId + ',' + levelProp + '): should be filtered correctly').to.equal(false);
        expect(outputLogs.length, '(' + _componentId + ',' + levelProp + '): have correct length').to.equal(expectLength);
      });
    });

    done();
  });

  /**
   * Tests the `clearCachedLogs` method.
   */
  it('clearCachedLogs()', function (done) {
    var componentIdA = _log.configure(null, function () {});
    var componentIdB = _log.configure(null, function () {});
    var fnTabulateLogs = function (_componentId, method) {
      var length = parseInt((Math.random() * 10).toFixed(0), 10);
      var index = 0;
      while (index < length) {
        _log[method](_componentId, 'test' + (index + 1));
        index++;
      }
    };

    Temasys.Debugger.setConfig({ cacheLogs: true });
    Temasys.Utils.forEach([componentIdA, componentIdB, undefined], function (_componentId) {
      Temasys.Utils.forEach(['DEBUG', 'LOG', 'INFO', 'WARN', 'ERROR', undefined], function (levelProp) {
        fnTabulateLogs(componentIdA, 'debug');
        fnTabulateLogs(componentIdA, 'log');
        fnTabulateLogs(componentIdA, 'info');
        fnTabulateLogs(componentIdA, 'warn');
        fnTabulateLogs(componentIdA, 'error');
        fnTabulateLogs(componentIdB, 'debug');
        fnTabulateLogs(componentIdB, 'log');
        fnTabulateLogs(componentIdB, 'info');
        fnTabulateLogs(componentIdB, 'warn');
        fnTabulateLogs(componentIdB, 'error');

        var options = {
          componentId: _componentId,
          level: levelProp ? Temasys.Debugger.LOG_LEVEL_ENUM[levelProp] : undefined
        };

        expect(Temasys.Debugger.getCachedLogs(options), '(' + _componentId + ',' + levelProp + '): to have length first').to.have.length.above(0);

        Temasys.Debugger.clearCachedLogs(options);

        expect(Temasys.Debugger.getCachedLogs(options), '(' + _componentId + ',' + levelProp + '): to not have length').to.have.lengthOf(0);
      });
    });

    done();
  });

  /**
   * Tests the `printCachedLogs` method.
   */
  it('printCachedLogs()', function (done) {
    var statsCounter = {};
    var componentIdA = _log.configure(null, function () {});
    var componentIdB = _log.configure(null, function () {});

    statsCounter[componentIdA] = { debug: [], log: [], info: [], warn: [], error: [] };
    statsCounter[componentIdB] = { debug: [], log: [], info: [], warn: [], error: [] };

    var fnTabulateLogs = function (_componentId, method) {
      var length = parseInt((Math.random() * 10).toFixed(0), 10);
      var index = 0;
      statsCounter[_componentId][method] += length;
      while (index < length) {
        _log[method](_componentId, 'test' + (index + 1));
        index++;
      }
    };

    fnTabulateLogs(componentIdA, 'debug');
    fnTabulateLogs(componentIdA, 'log');
    fnTabulateLogs(componentIdA, 'info');
    fnTabulateLogs(componentIdA, 'warn');
    fnTabulateLogs(componentIdA, 'error');
    fnTabulateLogs(componentIdB, 'debug');
    fnTabulateLogs(componentIdB, 'log');
    fnTabulateLogs(componentIdB, 'info');
    fnTabulateLogs(componentIdB, 'warn');
    fnTabulateLogs(componentIdB, 'error');

    Temasys.Utils.forEach([componentIdA, componentIdB, undefined], function (_componentId) {
      Temasys.Utils.forEach(['DEBUG', 'LOG', 'INFO', 'WARN', 'ERROR', undefined], function (levelProp) {
        var outputStats = {
          debug: [],
          log: [],
          info: [],
          warn: [],
          error: []
        };
        var expectStats = {
          debug: [],
          log: [],
          info: [],
          warn: [],
          error: []
        };
        console.debug = function () {
          outputStats.debug.push(Array.prototype.slice.call(arguments)[0]);
        };
        console.log = function () {
          outputStats.log.push(Array.prototype.slice.call(arguments)[0]);
        };
        console.info = function () {
          outputStats.info.push(Array.prototype.slice.call(arguments)[0]);
        };
        console.warn = function () {
          outputStats.warn.push(Array.prototype.slice.call(arguments)[0]);
        };
        console.error = function () {
          outputStats.error.push(Array.prototype.slice.call(arguments)[0]);
        };

        if (_componentId && levelProp) {
          expectStats[levelProp.toLowerCase()].concat(statsCounter[_componentId][levelProp.toLowerCase()]);
        } else if (_componentId) {
          expectStats.debug.concat(statsCounter[_componentId].debug);
          expectStats.log.concat(statsCounter[_componentId].log);
          expectStats.info.concat(statsCounter[_componentId].info);
          expectStats.warn.concat(statsCounter[_componentId].warn);
          expectStats.error.concat(statsCounter[_componentId].error);
        } else if (levelProp) {
          expectStats[levelProp.toLowerCase()].concat(statsCounter[componentIdA][levelProp.toLowerCase()]);
          expectStats[levelProp.toLowerCase()].concat(statsCounter[componentIdB][levelProp.toLowerCase()]);
        } else {
          expectStats.debug.concat(statsCounter[componentIdA].debug);
          expectStats.log.concat(statsCounter[componentIdA].log);
          expectStats.info.concat(statsCounter[componentIdA].info);
          expectStats.warn.concat(statsCounter[componentIdA].warn);
          expectStats.error.concat(statsCounter[componentIdA].error);
          expectStats.debug.concat(statsCounter[componentIdB].debug);
          expectStats.log.concat(statsCounter[componentIdB].log);
          expectStats.info.concat(statsCounter[componentIdB].info);
          expectStats.warn.concat(statsCounter[componentIdB].warn);
          expectStats.error.concat(statsCounter[componentIdB].error); 
        }

        expect(outputStats, '(' + _componentId + ',' + levelProp + '): should be printed correctly').to.deep.equal(expectStats);
      });
    });

    done();
  });

  /**
   * Tests the `catchExceptions` method.
   */
  it('catchExceptions()', function (done) {
    var listeners = { a: null, b: null };
    var output = [];
    var componentIdA = _log.configure(null, function (fn) {
      listeners.a = fn;
    });
    var componentIdB = _log.configure(null, function (fn) {
      listeners.b = fn;
    });

    Temasys.Debugger.catchExceptions(function (error, _componentId) {
      output.push([error, _componentId]);
    });

    var error1 = new Error('testA');
    var error2 = new Error('testB');
    var error3 = new Error('testB3');
    var error4 = new Error('testC');
    var error5 = new Error('testD');
    var error6 = new Error('testD4');

    listeners.a(componentIdA, error1);
    listeners.b(componentIdB, error2);
    listeners.b(componentIdB, error3);

    Temasys.Debugger.catchExceptions(null);

    expect(function () {
      listeners.a(componentIdA, error4);
      listeners.b(componentIdA, error5);
      listeners.b(componentIdA, error6);
    }, '() should throw errors').to.throw(Error);
    expect(output, 'Should match output as expected').to.deep.equal([
      [error1, componentIdA], [error2, componentIdB], [error3, componentIdB]]);

    done();
  });

  /**
   * Tests the `watchForLogs` method.
   */
  it('watchForLogs()', function (done) {
    var expectLogs = [];
    var logs = [];

    var fnTabulateLogs = function (_componentId, method) {
      var length = parseInt((Math.random() * 5).toFixed(0), 10);
      var index = 0;
      while (index < length) {
        _log[method.toLowerCase()](_componentId, _componentId + '_' + index);
        logs.push([method, _componentId + '_' + index]);
        index++;
      }
    };

    Temasys.Debugger.watchForLogs(function (logItem) {
      expectLogs.push([logItem[0], logItem[3]]);
    });

    var cindex = 0;
    while (cindex < 3) {
      var componentId = _log.configure(null, function () {});
      fnTabulateLogs(componentId, 'DEBUG');
      fnTabulateLogs(componentId, 'LOG');
      fnTabulateLogs(componentId, 'INFO');
      fnTabulateLogs(componentId, 'WARN');
      fnTabulateLogs(componentId, 'ERROR');
      cindex++;
    }

    expect(expectLogs, 'Matches expected length').to.have.lengthOf(logs.length);
    expect(expectLogs, 'Matches expected').to.deep.equal(logs);

    done();
  });

  /**
   * Tests the `getComponents` method.
   */
  it('getComponents()', function (done) {
    var componentIdA = _log.configure(null, function () {});
    expect(Temasys.Debugger.getComponents(), 'A returns correctly').to.deep.equal([componentIdA]);

    var componentIdB = _log.configure(null, function () {});
    expect(Temasys.Debugger.getComponents(), 'A + B returns correctly').to.deep.equal([componentIdA, componentIdB]);

    var componentIdC = _log.configure(null, function () {});
    expect(Temasys.Debugger.getComponents(), 'A + B + C returns correctly').to.deep.equal([componentIdA, componentIdB, componentIdC]);

    done();
  });

  /**
   * Tests the `getStats` method.
   */
  it('getStats()', function (done) {
    var statsCounter = {
      global: { debug: 0, log: 0, info: 0, warn: 0, error: 0, exceptions: [] },
      components: {}
    };
    var listeners = { a: null, b: null };
    var componentIdA = _log.configure(null, function (fn) {
      listeners.a = fn;
    });
    var componentIdB = _log.configure(null, function (fn) {
      listeners.b = fn;
    });

    statsCounter.components[componentIdA] = { debug: 0, log: 0, info: 0, warn: 0, error: 0, exceptions: [] };
    statsCounter.components[componentIdB] = { debug: 0, log: 0, info: 0, warn: 0, error: 0, exceptions: [] };

    var fnTabulateLogs = function (_componentId, method) {
      var length = parseInt((Math.random() * 100).toFixed(0), 10);
      var index = 0;
      statsCounter.global[method] += length;
      statsCounter.components[_componentId][method] += length;
      while (index < length) {
        _log[method](_componentId, 'test' + (index + 1));
        index++;
      }
    };

    fnTabulateLogs(componentIdA, 'debug');
    fnTabulateLogs(componentIdA, 'log');
    fnTabulateLogs(componentIdA, 'info');
    fnTabulateLogs(componentIdA, 'warn');
    fnTabulateLogs(componentIdA, 'error');
    fnTabulateLogs(componentIdB, 'debug');
    fnTabulateLogs(componentIdB, 'log');
    fnTabulateLogs(componentIdB, 'info');
    fnTabulateLogs(componentIdB, 'warn');
    fnTabulateLogs(componentIdB, 'error');

    Temasys.Debugger.catchExceptions(function () {});
    var error1 = new Error('testa');
    var error2 = new Error('testb');
    var error3 = new Error('testc');
    listeners.a(componentIdA, error1);
    statsCounter.global.exceptions.push(error1);
    statsCounter.components[componentIdA].exceptions.push(error1);
    listeners.b(componentIdB, error2);
    statsCounter.global.exceptions.push(error2);
    statsCounter.components[componentIdB].exceptions.push(error2);
    listeners.b(componentIdB, error3);
    statsCounter.global.exceptions.push(error3);
    statsCounter.components[componentIdB].exceptions.push(error3);

    Temasys.Utils.forEach([componentIdA, componentIdB, undefined], function (_componentId) {
      var output = Temasys.Debugger.getStats(_componentId);
      expect(output.debug, '(' + _componentId + ',DEBUG): returns correctly').to.equal(
        _componentId ? statsCounter.components[_componentId].debug :
        statsCounter.components[componentIdA].debug + statsCounter.components[componentIdB].debug);
      expect(output.log, '(' + _componentId + ',LOG): returns correctly').to.equal(
        _componentId ? statsCounter.components[_componentId].log :
        statsCounter.components[componentIdA].log + statsCounter.components[componentIdB].log);
      expect(output.info, '(' + _componentId + ',INFO): returns correctly').to.equal(
        _componentId ? statsCounter.components[_componentId].info :
        statsCounter.components[componentIdA].info + statsCounter.components[componentIdB].info);
      expect(output.warn, '(' + _componentId + ',WARN): returns correctly').to.equal(
        _componentId ? statsCounter.components[_componentId].warn :
        statsCounter.components[componentIdA].warn + statsCounter.components[componentIdB].warn);
      expect(output.error, '(' + _componentId + ',ERROR): returns correctly').to.equal(
        _componentId ? statsCounter.components[_componentId].error :
        statsCounter.components[componentIdA].error + statsCounter.components[componentIdB].error);
      expect(output.exceptions, '(' + _componentId + ',exceptions): returns correctly').to.deep.equal(
        _componentId ? statsCounter.components[_componentId].exceptions :
        statsCounter.components[componentIdA].exceptions.concat(statsCounter.components[componentIdB].exceptions));
    });

    done();
  });
});