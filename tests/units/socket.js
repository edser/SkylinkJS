describe('Temasys.Socket', function() {
	// Load the script first
	before(function (done) {
		loadScript([
      'base/source/components/utils.js',
      'base/source/components/debugger.js',
      'base/source/components/socket.js'
    ], function (err) {
			if (err) {
				throw err;
			}
			done();
		});
	});

  /**
   * Tests the `new Temasys.Socket()` constructor.
   */
	it('new Temasys.Socket() construction', function (done) {
		var fnShowThrowError = function (params1, params2) {
			expect(function () {
				new Temasys.Socket(params1, params2);
			}, 'new Socket(' + (params1 ? JSON.stringify(params1) : params1) + ', ' +
			(params2 ? JSON.stringify(params2) : params2) + ') should throw error').to.throw(Error);
		};

		fnShowThrowError(null, null);
		fnShowThrowError('test1', null);
		fnShowThrowError(1, null);
		fnShowThrowError(true, null);
		fnShowThrowError(undefined, null);
		fnShowThrowError([], null);
		fnShowThrowError({ servers: [null] }, {});
		fnShowThrowError({ servers: [{ server: null }] }, {});
		fnShowThrowError({ servers: [{ server: 'test.com', port: null }] }, {});
		fnShowThrowError({ servers: [{ server: 'test.com', port: -1 }] }, {});
		fnShowThrowError({ servers: [{ server: 'test.com', port: true }] }, {});
		fnShowThrowError({ servers: [{ server: 'test.com', port: 'test1' }] }, {});

		expect(function () {
			var socket = new Temasys.Socket({
				servers: [{
					server: 'test.com',
					port: 123
				}]
			}, {});
			assert.typeOf(socket.TRANSPORT_ENUM, 'object', 'TRANSPORT_ENUM is typeof object');
			assert.typeOf(socket.getConfig, 'function', 'getConfig() is typeof function');
			assert.typeOf(socket._connect, 'function', '_connect() is typeof function');
			assert.typeOf(socket._disconnect, 'function', '_disconnect() is typeof function');
			assert.typeOf(socket._send, 'function', '_send() is typeof function');
		}, 'new Socket() with correct config should not throw error').to.not.throw(Error);

		done();
	});

	/**
	 * Tests the `TRANSPORT_ENUM` constant.
	 */
	it('TRANSPORT_ENUM', function (done) {
		var socket = new Temasys.Socket({ servers: [{ server: 'test', port: 23 }]});
		assert.typeOf(socket.TRANSPORT_ENUM, 'object', 'typeof is object');
    assert.isNotNull(socket.TRANSPORT_ENUM, 'Is not null');
    
    Temasys.Utils.forEach(socket.TRANSPORT_ENUM, function (item, itemProp) {
      assert.typeOf(item, 'string', itemProp + ': typeof is string');
			assert.isDefined(item, 'string', itemProp + ': typeof is defined');
    });

    done();
	});

	/**
	 * Tests the `STATE_ENUM` constant.
	 */
	it('STATE_ENUM', function (done) {
		var socket = new Temasys.Socket({ servers: [{ server: 'test', port: 23 }]});
		assert.typeOf(socket.STATE_ENUM, 'object', 'typeof is object');
    assert.isNotNull(socket.STATE_ENUM, 'Is not null');
    
    Temasys.Utils.forEach(socket.STATE_ENUM, function (item, itemProp) {
      assert.typeOf(item, 'string', itemProp + ': typeof is string');
			assert.isDefined(item, 'string', itemProp + ': typeof is defined');
    });

    done();
	});

	/**
	 * Tests the `ACTIVE_STATE_ENUM` constant.
	 */
	it('ACTIVE_STATE_ENUM', function (done) {
		var socket = new Temasys.Socket({ servers: [{ server: 'test', port: 23 }]});
		assert.typeOf(socket.ACTIVE_STATE_ENUM, 'object', 'typeof is object');
    assert.isNotNull(socket.ACTIVE_STATE_ENUM, 'Is not null');
    
    Temasys.Utils.forEach(socket.ACTIVE_STATE_ENUM, function (item, itemProp) {
      assert.typeOf(item, 'string', itemProp + ': typeof is string');
			assert.isDefined(item, 'string', itemProp + ': typeof is defined');
    });

    done();
	});

	/**
	 * Tests the `getConfig()` method for new Temasys.Socket(options,..).
	 */
	it('getConfig() for new Temasys.Socket(options,..) construction', function (done) {
		this.timeout(7000);
		var fnTestConfig = function (options) {
			var socket = new Temasys.Socket(options, {});
			var outputOptions = socket.getConfig();
			var testName = '(' + JSON.stringify(options) + '): ';
			if (Array.isArray(options.servers)) {
				var index = -1;
				Temasys.Utils.forEach(options.server, function (item) {
					if (item && typeof item === 'object' ?
						!(item.server && typeof item.server === 'string') ||
						!(typeof item.port === 'number' && item.port > 0) ||
						!(item.transport === 'Websocket' ? !window.WebSocket : true) : true) {
						return;
					}
					index++;
					var _testName = testName + 'result[' + index + '].';
					expect(outputOptions.servers[index].server, _testName + 'server matches as expected').to.equal(item.server);
					assert.typeOf(outputOptions.servers[index].server, 'string', _testName + 'server typeof string');
					expect(outputOptions.servers[index].port, _testName + 'port matches as expected').to.equal(item.port);
					assert.typeOf(outputOptions.servers[index].port, 'number', _testName + 'server typeof number');
					expect(outputOptions.servers[index].protocol, _testName + 'protocol matches as expected').to.equal(
						typeof item.protocol === 'string' && item.protocol.indexOf(':') === (item.protocol.length - 1) &&
						item.protocol.length > 1 ? item.protocol : window.location.protocol);
					assert.typeOf(outputOptions.servers[index].protocol, 'string', _testName + 'protocol typeof string');
					expect(outputOptions.servers[index].path, _testName + 'path matches as expected').to.equal(
						typeof item.path === 'string' && item.path.indexOf('/') === 0 &&
						item.path.length > 1 ? item.path : '/socket.io');
					assert.typeOf(outputOptions.servers[index].path, 'string', _testName + 'path typeof string');
					expect(outputOptions.servers[index].reconnection, _testName + 'reconnection matches as expected').to.equal(
						typeof item.reconnection === 'boolean' ? item.reconnection :
						outputOptions.servers[index].transport === socket.TRANSPORT_ENUM.POLLING);
					assert.typeOf(outputOptions.servers[index].reconnection, 'boolean',	_testName + 'reconnection typeof boolean');
					expect(outputOptions.servers[index].reconnectionAttempts, _testName + 'reconnectionAttempts matches as expected').to.equal(
						typeof item.reconnectionAttempts === 'number' && item.reconnectionAttempts <= 5 &&
						item.reconnectionAttempts >= 0 ? item.reconnectionAttempts :
						(outputOptions.servers[index].transport === socket.TRANSPORT_ENUM.POLLING ? 4 : 0));
					assert.typeOf(outputOptions.servers[index].reconnectionAttempts, 'number', _testName + 'reconnectionAttempts typeof number');
					expect(outputOptions.servers[index].reconnectionDelay, _testName + 'reconnectionDelay matches as expected').to.equal(
						typeof item.reconnectionDelay === 'number' && item.reconnectionDelay >= 0 ?
						item.reconnectionDelay : 2000);
					assert.typeOf(outputOptions.servers[index].reconnectionDelay, 'number',	_testName + 'reconnectionDelay typeof number');
					expect(outputOptions.servers[index].reconnectionDelayMax, _testName + 'reconnectionDelayMax matches as expected').to.equal(
						typeof item.reconnectionDelayMax === 'number' && item.reconnectionDelayMax >= 0 ?
						item.reconnectionDelayMax :
						(outputOptions.servers[index].transport === socket.TRANSPORT_ENUM.POLLING ? 1000 : 2000));
					assert.typeOf(outputOptions.servers[index].reconnectionDelayMax, 'number', _testName + 'reconnectionDelayMax typeof number');
					expect(outputOptions.servers[index].randomizationFactor, _testName + 'randomizationFactor matches as expected').to.equal(
						typeof item.randomizationFactor === 'number' && item.randomizationFactor >= 0 &&
						item.randomizationFactor <= 1 ? item.randomizationFactor : 0.5);
					assert.typeOf(outputOptions.servers[index].randomizationFactor, 'number', _testName + 'randomizationFactor typeof number');
					expect(outputOptions.servers[index].timeout, _testName + 'timeout matches as expected').to.equal(
						typeof item.timeout === 'number' && item.timeout >= 0 ? item.timeout : 20000);
					assert.typeOf(outputOptions.servers[index].timeout, 'number', _testName + '.timeout typeof number');
					expect(outputOptions.servers[index].transport, _testName + 'transport matches as expected').to.equal(
						(item.transport === socket.TRANSPORT_ENUM.WEBSOCKET || !(function () {
							var exists = false;
							Temasys.Utils.forEach(socket.TRANSPORT_ENUM, function (transportItem) {
								if (transportItem === item.transport) {
									exists = true;
									return true;
								}
							});
							return exists;
						})()) && !window.WebSocket ? ref.TRANSPORT_ENUM.POLLING : item.transport);
					assert.typeOf(outputOptions.servers[index].transport, 'string', _testName + 'transport typeof string');
				});
			}
			expect(outputOptions.data.compress, testName + 'result.data.compress matches as expected').to.equal(
				options.data && typeof options.data === 'object' && typeof options.data.compress === 'boolean' ?
				options.data.compress : false);
			assert.typeOf(outputOptions.data.compress, 'boolean', testName + 'result.data.compress typeof boolean');
			expect(outputOptions.data.priorityInterval, testName + 'result.data.priorityInterval matches as expected').to.equal(
				options.data && typeof options.data === 'object' &&
				typeof options.data.priorityInterval === 'number' && options.data.priorityInterval >= 0 ?
				options.data.priorityInterval : 10);
			assert.typeOf(outputOptions.data.priorityInterval, 'number', testName + 'result.data.priorityInterval typeof number');
		};

		window._WebSocket = window.WebSocket;

		Temasys.Utils.forEach([
			{ servers: [{ server: 'test1', port: 23 }] },
			{ servers: [{ server: 'test01', port: 25 }, { server: 'test31', port: 1000 }] },
			{ servers: [{ server: 'test2', port: 2 }, { server: null, port: 100 }] },
			{ servers: [{ server: 'test3', port: 21 }, { server: 'test1.com', port: null }] },
			{ servers: [{ server: 'test1', port: 23, protocol: 'http:' }] },
			{ servers: [{ server: 'test1', port: 23, protocol: 'https:' }] },
			{ servers: [{ server: 'test1', port: 23, protocol: null }] },
			{ servers: [{ server: 'test1', port: 23, path: '/pathtest' }] },
			{ servers: [{ server: 'test1', port: 23, path: '/' }] },
			{ servers: [{ server: 'test1', port: 23, path: null }] },
			{ servers: [{ server: 'test1', port: 23, reconnection: true }] },
			{ servers: [{ server: 'test1', port: 23, reconnection: false }] },
			{ servers: [{ server: 'test1', port: 23, reconnection: null }] },
			{ servers: [{ server: 'test1', port: 23, reconnectionAttempts: 6 }] },
			{ servers: [{ server: 'test1', port: 23, reconnectionAttempts: 0 }] },
			{ servers: [{ server: 'test1', port: 23, reconnectionAttempts: 5 }] },
			{ servers: [{ server: 'test1', port: 23, reconnectionAttempts: 3 }] },
			{ servers: [{ server: 'test1', port: 23, reconnectionAttempts: null }] },
			{ servers: [{ server: 'test1', port: 23, reconnectionDelay: -1 }] },
			{ servers: [{ server: 'test1', port: 23, reconnectionDelay: 0 }] },
			{ servers: [{ server: 'test1', port: 23, reconnectionDelay: 5000 }] },
			{ servers: [{ server: 'test1', port: 23, reconnectionDelay: null }] },
			{ servers: [{ server: 'test1', port: 23, reconnectionDelayMax: -1 }] },
			{ servers: [{ server: 'test1', port: 23, reconnectionDelayMax: 0 }] },
			{ servers: [{ server: 'test1', port: 23, reconnectionDelayMax: 7000 }] },
			{ servers: [{ server: 'test1', port: 23, reconnectionDelayMax: null }] },
			{ servers: [{ server: 'test1', port: 23, randomizationFactor: -1 }] },
			{ servers: [{ server: 'test1', port: 23, randomizationFactor: 0 }] },
			{ servers: [{ server: 'test1', port: 23, randomizationFactor: 2 }] },
			{ servers: [{ server: 'test1', port: 23, randomizationFactor: 0.75 }] },
			{ servers: [{ server: 'test1', port: 23, randomizationFactor: null }] },
			{ servers: [{ server: 'test1', port: 23, timeout: -1 }] },
			{ servers: [{ server: 'test1', port: 23, timeout: 0 }] },
			{ servers: [{ server: 'test1', port: 23, timeout: 10000 }] },
			{ servers: [{ server: 'test1', port: 23, timeout: null }] },
			{ servers: [{ server: 'test1', port: 23, transport: 'WebSocket' }] },
			{ servers: [{ server: 'test1', port: 23, transport: 'Polling' }] },
			{ servers: [{ server: 'test1', port: 23, transport: null }] },
			{ servers: [{ server: 'test1', port: 23 }], data: {} },
			{ servers: [{ server: 'test1', port: 23 }], data: { compress: true } },
			{ servers: [{ server: 'test1', port: 23 }], data: { compress: 1 } },
			{ servers: [{ server: 'test1', port: 23 }], data: { compress: null } },
			{ servers: [{ server: 'test1', port: 23 }], data: { priorityInterval: -1 } },
			{ servers: [{ server: 'test1', port: 23 }], data: { priorityInterval: 0 } },
			{ servers: [{ server: 'test1', port: 23 }], data: { priorityInterval: 100 } },
			{ servers: [{ server: 'test1', port: 23 }], data: { priorityInterval: null } }
		], function (testItem) {
			if (testItem.servers[0].hasOwnProperty('transport')) {
				window.WebSocket = null;
				fnTestConfig(testItem);
				window.WebSocket = window._WebSocket;
				fnTestConfig(testItem);
			} else {
				fnTestConfig(testItem);
			}
		});

		window.WebSocket = window._WebSocket;

		done();
	});

	/**
	 * Tests the `getConfig()` method for new Temasys.Socket(.., defaultOptions).
	 */
	it('getConfig() for new Temasys.Socket(..,defaultOptions) construction', function (done) {
		var fnTestConfig = function (defaultOptions) {
			var socket = new Temasys.Socket({}, defaultOptions);
			var outputOptions = socket.getConfig();
			var outputPorts = [];
			var testName = '(' + JSON.stringify(defaultOptions) + '): ';
			Temasys.Utils.forEach(outputOptions.servers, function (item, index) {
				var _testName = testName + 'result[' + index + '].';
				assert.typeOf(item.server, 'string', _testName + 'server typeof string');
				if (defaultOptions.server && typeof defaultOptions.server === 'string') {
					expect(item.server,	_testName + 'server matches as expected').to.equal(defaultOptions.server);
				} else {
					assert.isDefined(item.server, _testName + 'server matches is defined');
				}
				assert.typeOf(item.port, 'number', _testName + 'port typeof number');
				if (window.location.protocol === 'https:' ? Array.isArray(defaultOptions.httpsPorts) &&
					defaultOptions.httpsPorts.length > 0 : Array.isArray(defaultOptions.httpPorts) &&
					defaultOptions.httpPorts.length > 0) {
					expect(window.location.protocol === 'https:' ? defaultOptions.httpsPorts : defaultOptions.httpPorts,
						_testName + 'port matches as expected').to.contain(item.port);
				} else { item.port
					expect(item.port, _testName + 'port is defined correctly').to.be.above(0);
				}
				outputPorts.push(item.port);
				assert.typeOf(item.protocol, 'string', _testName + 'protocol typeof string');
				expect(item.protocol,	_testName + 'protocol matches as expected').to.equal(window.location.protocol);
				assert.typeOf(item.path, 'string', _testName + 'path typeof string');
				expect(item.path,	_testName + 'path matches as expected').to.equal('/socket.io');
				assert.typeOf(item.reconnection, 'boolean', _testName + 'reconnection typeof boolean');
				expect(item.reconnection,	_testName + 'reconnection matches as expected').to.equal(
					item.transport === socket.TRANSPORT_ENUM.POLLING);
				assert.typeOf(item.reconnectionAttempts, 'number', _testName + 'reconnectionAttempts typeof number');
				expect(item.reconnectionAttempts,	_testName + 'reconnectionAttempts matches as expected').to.equal(
					item.transport === socket.TRANSPORT_ENUM.POLLING ? 4 : 0);
				assert.typeOf(item.reconnectionDelay, 'number', _testName + 'reconnectionDelay typeof number');
				expect(item.reconnectionDelay,	_testName + 'reconnectionDelay matches as expected').to.equal(2000);
				assert.typeOf(item.reconnectionDelayMax, 'number', _testName + 'reconnectionDelayMax typeof number');
				expect(item.reconnectionDelayMax,	_testName + 'reconnectionDelayMax matches as expected').to.equal(
					item.transport === socket.TRANSPORT_ENUM.POLLING ? 1000 : 2000);
				assert.typeOf(item.randomizationFactor, 'number', _testName + 'randomizationFactor typeof number');
				expect(item.randomizationFactor,	_testName + 'randomizationFactor matches as expected').to.equal(0.5);
				assert.typeOf(item.timeout, 'number', _testName + 'timeout typeof number');
				expect(item.timeout, _testName + 'timeout matches as expected').to.equal(20000);
				assert.typeOf(item.transport, 'string', _testName + 'transport typeof string');
				expect(item.transport, _testName + 'transport matches as expected').to.to.be.oneOf((function () {
					var transportItems = [];
					Temasys.Utils.forEach(socket.TRANSPORT_ENUM, function (transportItem) {
						transportItems.push(transportItem);
					});
					return transportItems;
				})());
			});

			if (window.location.protocol === 'https:' ? Array.isArray(defaultOptions.httpsPorts) &&
				defaultOptions.httpsPorts.length > 0 : Array.isArray(defaultOptions.httpPorts) &&
				defaultOptions.httpPorts.length > 0) {
				var expectPorts = window.location.protocol === 'https:' ? defaultOptions.httpsPorts : defaultOptions.httpPorts;
				expectPorts = window.WebSocket ? expectPorts.concat(expectPorts) : expectPorts;
				Temasys.Utils.forEach(expectPorts, function (port, index) {
					if (port < 1) {
						expectPorts.splice(index, 1);
						return 0;
					}
				});
				expect(outputPorts.sort(), testName + 'Ports are populated correctly').to.deep.equal(expectPorts.sort());
			}
		};

		window._WebSocket = window.WebSocket;

		Temasys.Utils.forEach([
			{ server: 'test1' },
			{ server: null },
			{ server: -1 },
			{ server: 'test1', httpsPorts: [80,34,0] },
			{ server: 'test1', httpsPorts: [] },
			{ server: 'test1', httpsPorts: null },
			{ server: 'test1', httpPorts: [180,134,0] },
			{ server: 'test1', httpPorts: [] },
			{ server: 'test1', httpPorts: null }
		], function (testItem) {
			window.WebSocket = null;
			fnTestConfig(testItem);
			window.WebSocket = window._WebSocket;
			fnTestConfig(testItem);
		});

		window.WebSocket = window._WebSocket;

		done();
	});

	/**
	 * Tests the `_connect()` method.
	 */
	it('_connect()', function (done) {
		this.timeout(70000);
		var queue = (function (fnGetExpect) {
			return [
				fnGetExpect([
					{ server: 'test1.com', port: 23 },
					{ server: 'test2.com', port: 24 },
					{ server: 'test3.com', port: 25 }]),
				fnGetExpect([
					{ server: 'test1.com', port: 23, reconnection: true, reconnectionAttempts: 2 }]),
				fnGetExpect([
					{ server: 'test1.com', port: 23, reconnection: false, reconnectionAttempts: 2 }]),
				fnGetExpect([
					{ server: 'test1.com', port: 23, reconnectionAttempts: 4 },
					{ server: 'signaling.temasys.io', port: 3000 }]),
				fnGetExpect([
					{ server: 'signaling.temasys.io', port: 80 }]),
				fnGetExpect([
					{ server: 'signaling.temasys.io', port: 443, protocol: 'https:' }]),
				fnGetExpect([
					{ server: 'test1.io', port: 443, protocol: 'https:' }]),
				fnGetExpect([
					{ server: 'signaling.temasys.io', port: 443, protocol: 'httpss:' }])
			];
		})(function (servers) {
			var result = {
				servers: [],
				states: [],
				errors: [],
				attempts: [],
				shouldFail: true
			};

			Temasys.Utils.forEach(servers, function (serverItem, serverIndex) {
				result.servers[serverIndex] = serverItem;
				result.servers[serverIndex].timeout = 5000;

				var fnAppendState = function (state, hasErrors, attempt) {
					result.states.push(Temasys.Socket.prototype.STATE_ENUM[state]);
					result.errors.push([!!hasErrors, !!hasErrors]);
					result.attempts.push(attempt || 0);
					result.shouldFail = state !== 'CONNECT';
				};

				fnAppendState('CONNECTING');
				if (serverItem.protocol && ['http:', 'https:'].indexOf(serverItem.protocol) === -1) {
					fnAppendState('CONNECT_START_ERROR', true);
				} else if (serverItem.server !== 'signaling.temasys.io') {
					if (serverItem.reconnection && typeof serverItem.reconnectionAttempts === 'number' &&
						serverItem.reconnectionAttempts > 0) {
						fnAppendState('CONNECT_TIMEOUT', true);
						var index = 0;
						while (index < serverItem.reconnectionAttempts) {
							fnAppendState('RECONNECT_ATTEMPT', true, index + 1);
							fnAppendState('RECONNECT_ERROR', true, index + 1);
							index++;
						}
						fnAppendState('RECONNECT_FAILED', true);
					} else {
						fnAppendState('CONNECT_ERROR', true);
					}
				} else {
					fnAppendState('CONNECT');
				}
				if (result.shouldFail && serverIndex === (servers.length - 1)) {
					fnAppendState('RECONNECT_END', true);
				}
			});
			return result;
		});

		(function fnProcessNext () {
			if (queue.length > 0) {
				var expectResult = queue.splice(0, 1)[0];
				var outputResult = {
					promise: { error: null, success: null, timeout: null },
					stateIndex: -1
				};
				window.socket = new Temasys.Socket({ servers: expectResult.servers }, {});
				var fnConfigureTimeout = function () {
					if (outputResult.promise.output) {
						return;
					}
					outputResult.promise.output = setTimeout(function () {
						if (expectResult.shouldFail) {
							assert.instanceOf(outputResult.promise.error, Error, JSON.stringify(expectResult.servers) + ': catch() is triggered');
							assert.isDefined(outputResult.promise.error.message, JSON.stringify(expectResult.servers) + ': catch() message is defined');
							expect(outputResult.promise.success, JSON.stringify(expectResult.server) + ': then() is not triggered').to.equal(null);
						} else {
							console.info(expectResult.shouldFail);
							expect(outputResult.promise.success, JSON.stringify(expectResult.servers) + ': then() is triggered').to.equal(true);
							expect(outputResult.promise.error, JSON.stringify(expectResult.servers) + ': catch() is not triggered').to.equal(null);
						}
						expect(outputResult.stateIndex, JSON.stringify(expectResult.servers) + ': triggers all expected states').to.equal(expectResult.states.length);
						fnProcessNext();
					}, 1000);
				};

				socket.on('stateChange', function (state, error, current) {
					outputResult.stateIndex++;
					console.info(state, outputResult.stateIndex, current.settings);
					var settings = socket.getConfig().servers[current.serverIndex];
					expect(state, JSON.stringify(expectResult.servers) +
						': state is triggered correctly').to.equal(expectResult.states[output.stateIndex]);
				  expect([error instanceof Error, !!(error && error.message)], JSON.stringify(expect.servers) +
						': error is triggered correctly').to.equal(expectResult.states[output.stateIndex]);
				  expect(current.attempts, JSON.stringify(expectResult.servers) +
						': current.attempts is triggered correctly').to.equal(expectResult.attempts[output.stateIndex]);
					expect(current.url, JSON.stringify(expectResult.servers) +
						': current.url is triggered correctly').to.equal(settings.protocol + '//' + settings.server + ':' + settings.port);
					expect(current.settings.reconnection, JSON.stringify(expectResult.servers) +
						': current.settings.reconnection is triggered correctly').to.equal(settings.reconnection);
					expect(current.settings.reconnectionAttempts, JSON.stringify(expectResult.servers) +
						': current.settings.reconnectionAttempts is triggered correctly').to.equal(settings.reconnectionAttempts);
					expect(current.settings.reconnectionDelay, JSON.stringify(expectResult.servers) +
						': current.settings.reconnectionDelay is triggered correctly').to.equal(settings.reconnectionDelay);
					expect(current.settings.reconnectionDelayMax, JSON.stringify(expectResult.servers) +
						': current.settings.reconnectionDelayMax is triggered correctly').to.equal(settings.reconnectionDelayMax);
					expect(current.settings.timeout, JSON.stringify(expectResult.servers) +
						': current.settings.timeout is triggered correctly').to.equal(settings.timeout);
					expect(current.settings.randomizationFactor, JSON.stringify(expectResult.servers) +
						': current.settings.randomizationFactor is triggered correctly').to.equal(settings.randomizationFactor);
					expect(current.settings.path, JSON.stringify(expectResult.servers) +
						': current.settings.path is triggered correctly').to.equal(settings.path);
					expect(current.settings.transport, JSON.stringify(expectResult.servers) +
						': current.settings.transport is triggered correctly').to.deep.equal([settings.transport]);
					assert.typeOf(current.settings.forceNew, 'boolean', JSON.stringify(expectResult.servers) + ': current.settings.forceNew typeof boolean');
					assert.typeOf(current.settings.autoConnect, 'boolean', JSON.stringify(expectResult.servers) + ': current.settings.autoConnect typeof boolean');
				});

				var p = socket._connect();
				assert.instanceOf(p, Promise, JSON.stringify(expectResult.servers) + ': returns a Promise');
				p.then(function (result) {
					outputResult.promise.success = result || true;
					fnConfigureTimeout();
				}).catch(function (error) {
					outputResult.promise.error = error || true;
					fnConfigureTimeout();
				});
			} else {
				done();
			}
		})();
	});
})