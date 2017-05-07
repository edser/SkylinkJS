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
	 * Tests the `CONNECTION_STATE_ENUM` constant.
	 */
	it('CONNECTION_STATE_ENUM', function (done) {
		var socket = new Temasys.Socket({ servers: [{ server: 'test', port: 23 }]});
		assert.typeOf(socket.CONNECTION_STATE_ENUM, 'object', 'typeof is object');
    assert.isNotNull(socket.CONNECTION_STATE_ENUM, 'Is not null');
    
    Temasys.Utils.forEach(socket.CONNECTION_STATE_ENUM, function (item, itemProp) {
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
						typeof item.path === 'string' && item.path.indexOf('/') === 0 && item.path.length > 1 ? item.path : '/socket.io');
					assert.typeOf(outputOptions.servers[index].path, 'string', _testName + 'path typeof string');
					expect(outputOptions.servers[index].reconnection, _testName + 'reconnection matches as expected').to.equal(
						typeof item.reconnection === 'boolean' ? item.reconnection :
						outputOptions.servers[index].transport === socket.TRANSPORT_ENUM.POLLING);
					assert.typeOf(outputOptions.servers[index].reconnection, 'boolean',	_testName + 'reconnection typeof boolean');
					expect(outputOptions.servers[index].reconnectionAttempts, _testName + 'reconnectionAttempts matches as expected').to.equal(
						typeof item.reconnectionAttempts === 'number' && item.reconnectionAttempts <= 5 &&
						item.reconnectionAttempts >= 0 ? item.reconnectionAttempts : (outputOptions.servers[index].transport === socket.TRANSPORT_ENUM.POLLING ? 4 : 0));
					assert.typeOf(outputOptions.servers[index].reconnectionAttempts, 'number', _testName + 'reconnectionAttempts typeof number');
					expect(outputOptions.servers[index].reconnectionDelay, _testName + 'reconnectionDelay matches as expected').to.equal(
						typeof item.reconnectionDelay === 'number' && item.reconnectionDelay >= 0 ? item.reconnectionDelay : 2000);
					assert.typeOf(outputOptions.servers[index].reconnectionDelay, 'number',	_testName + 'reconnectionDelay typeof number');
					expect(outputOptions.servers[index].reconnectionDelayMax, _testName + 'reconnectionDelayMax matches as expected').to.equal(
						typeof item.reconnectionDelayMax === 'number' && item.reconnectionDelayMax >= 0 ?
						item.reconnectionDelayMax : (outputOptions.servers[index].transport === socket.TRANSPORT_ENUM.POLLING ? 1000 : 2000));
					assert.typeOf(outputOptions.servers[index].reconnectionDelayMax, 'number', _testName + 'reconnectionDelayMax typeof number');
					expect(outputOptions.servers[index].randomizationFactor, _testName + 'randomizationFactor matches as expected').to.equal(
						typeof item.randomizationFactor === 'number' && item.randomizationFactor >= 0 && item.randomizationFactor <= 1 ? item.randomizationFactor : 0.5);
					assert.typeOf(outputOptions.servers[index].randomizationFactor, 'number', _testName + 'randomizationFactor typeof number');
					expect(outputOptions.servers[index].timeout, _testName + 'timeout matches as expected').to.equal(typeof item.timeout === 'number' && item.timeout >= 0 ? item.timeout : 20000);
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
				options.data && typeof options.data === 'object' && typeof options.data.compress === 'boolean' ? options.data.compress : false);
			assert.typeOf(outputOptions.data.compress, 'boolean', testName + 'result.data.compress typeof boolean');
			expect(outputOptions.data.priorityInterval, testName + 'result.data.priorityInterval matches as expected').to.equal(
				options.data && typeof options.data === 'object' && typeof options.data.priorityInterval === 'number' && options.data.priorityInterval >= 0 ? options.data.priorityInterval : 10);
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
					expect(window.location.protocol === 'https:' ? defaultOptions.httpsPorts : defaultOptions.httpPorts,_testName + 'port matches as expected').to.contain(item.port);
				} else { item.port
					expect(item.port, _testName + 'port is defined correctly').to.be.above(0);
				}
				outputPorts.push(item.port);
				assert.typeOf(item.protocol, 'string', _testName + 'protocol typeof string');
				expect(item.protocol,	_testName + 'protocol matches as expected').to.equal(window.location.protocol);
				assert.typeOf(item.path, 'string', _testName + 'path typeof string');
				expect(item.path,	_testName + 'path matches as expected').to.equal('/socket.io');
				assert.typeOf(item.reconnection, 'boolean', _testName + 'reconnection typeof boolean');
				expect(item.reconnection,	_testName + 'reconnection matches as expected').to.equal(item.transport === socket.TRANSPORT_ENUM.POLLING);
				assert.typeOf(item.reconnectionAttempts, 'number', _testName + 'reconnectionAttempts typeof number');
				expect(item.reconnectionAttempts,	_testName + 'reconnectionAttempts matches as expected').to.equal(item.transport === socket.TRANSPORT_ENUM.POLLING ? 4 : 0);
				assert.typeOf(item.reconnectionDelay, 'number', _testName + 'reconnectionDelay typeof number');
				expect(item.reconnectionDelay,	_testName + 'reconnectionDelay matches as expected').to.equal(2000);
				assert.typeOf(item.reconnectionDelayMax, 'number', _testName + 'reconnectionDelayMax typeof number');
				expect(item.reconnectionDelayMax,	_testName + 'reconnectionDelayMax matches as expected').to.equal(item.transport === socket.TRANSPORT_ENUM.POLLING ? 1000 : 2000);
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
	it.skip('_connect()', function (done) {
		this.timeout(170000);
		var queue = [
			[{ server: 'test1.com', port: 80 }, { server: 'test2.com', port: 81 }, { server: 'test3.com', port: 82 }],
			[{ server: 'test1.com', port: 83, reconnection: true, reconnectionAttempts: 2 }],
			[{ server: 'test1.com', port: 84, reconnection: false, reconnectionAttempts: 2 }],
			[{ server: 'test1.com', port: 85, reconnectionAttempts: 4 }, { server: 'signaling.temasys.io', port: 3000 }],
			[{ server: 'signaling.temasys.io', port: 80 }],
			[{ server: 'signaling.temasys.io', port: 443, protocol: 'https:' }],
			[{ server: 'signaling-legacy.temasys.com.sg', port: 800, reconnectionAttempts: 0, reconnection: true }],
			[{ server: 'test1.io', port: 443, protocol: 'https:' }],
			[{ server: 'test1.com', port: 443, protocol: 'https:', transport: 'polling' }],
			[{ server: 'throwerror.com', port: 23 }],
			[{ server: 'throwerror.com', port: 23 }, { server: 'signaling.temasys.io', port: 80 }]
		];

		(function fnProcessNext () {
			if (queue.length > 0) {
				var servers = queue.splice(0, 1)[0];
				var expectResult = {
					shouldFail: true,
					attempts: 0,
					states: []
				};
				var stateIndex = -1;

				Temasys.Utils.forEach(servers, function (serverItem, serverIndex) {
					servers[serverIndex].timeout = 5000;
					if (!serverItem.server || !serverItem.port) {
						return;
					}

					expectResult.states.push({
						state: 'CONNECTING',
						error: [false, false],
						attempt: 0
					});

					if (serverItem.server === 'throwerror.com') {
						expectResult.states.push({
							state: 'CONNECT_START_ERROR',
							error: [true, true],
							attempt: 0
						});
						window._connect = window.io.connect;
					} else if (serverItem.server === 'signaling.temasys.io') {
						expectResult.states.push({
							state: 'CONNECT',
							error: [false, false],
							attempt: 0
						});
						expectResult.shouldFail = false;
					} else {
						expectResult.states.push({
							state: 'CONNECT_ERROR',
							error: [true, true],
							attempt: 0
						});

						if (serverItem.reconnection === true || (serverItem.reconnection !== false && serverItem.transport === 'polling')) {
							var index = 0;
							var len = typeof serverItem.reconnectionAttempts === 'number' ? serverItem.reconnectionAttempts :
								(serverItem.transport === 'polling' ? 4 : 0);
							if (len > 0) {
								while (index < len) {
									expectResult.states.push({
										state: 'RECONNECT_ATTEMPT',
										error: [false, false],
										attempt: index + 1
									});
									expectResult.states.push({
										state: 'RECONNECT_ERROR',
										error: [true, true],
										attempt: index + 1
									});
									index++;
								}
								expectResult.states.push({
									state: 'RECONNECT_FAILED',
									error: [true, true],
									attempt: len
								});

								expectResult.attempts = len;
							}
						}
					}
				});

				if (expectResult.shouldFail) {
					expectResult.states.push({
						state: 'TERMINATE',
						error: [true, true],
						attempt: expectResult.attempts
					});
				}

				if (window._connect) {
					window.io.connect = function (url, options) {
						throw new Error('Test');
					};
				}

				var socket = new Temasys.Socket({ servers: servers }, {});
				socket.on('connectionStateChange', function (state, error, current) {
					stateIndex++;
					var settings = socket.getConfig().servers[current.serverIndex];
					var expectState = expectResult.states[stateIndex];
					expect(state, JSON.stringify(servers) +	': state is triggered correctly').to.equal(socket.CONNECTION_STATE_ENUM[expectState.state]);
				  expect([error instanceof Error, !!(error && error.message)], JSON.stringify(servers) + ': error is triggered correctly').to.deep.equal(expectState.error);
				  expect(current.attempt, JSON.stringify(servers) + ': current.attempt is triggered correctly').to.equal(expectState.attempt);
					expect(current.url, JSON.stringify(servers) +	': current.url is triggered correctly').to.equal(settings.protocol + '//' + settings.server + ':' + settings.port);
					expect(current.options.reconnection, JSON.stringify(servers) + ': current.options.reconnection is triggered correctly').to.equal(settings.reconnection);
					expect(current.options.reconnectionAttempts, JSON.stringify(servers) + ': current.options.reconnectionAttempts is triggered correctly').to.equal(settings.reconnectionAttempts);
					expect(current.options.reconnectionDelay, JSON.stringify(servers) + ': current.options.reconnectionDelay is triggered correctly').to.equal(settings.reconnectionDelay);
					expect(current.options.reconnectionDelayMax, JSON.stringify(servers) + ': current.options.reconnectionDelayMax is triggered correctly').to.equal(settings.reconnectionDelayMax);
					expect(current.options.timeout, JSON.stringify(servers) + ': current.options.timeout is triggered correctly').to.equal(settings.timeout);
					expect(current.options.randomizationFactor, JSON.stringify(servers) + ': current.options.randomizationFactor is triggered correctly').to.equal(settings.randomizationFactor);
					expect(current.options.path, JSON.stringify(servers) +	': current.options.path is triggered correctly').to.equal(settings.path);
					expect(current.options.transports, JSON.stringify(servers) + ': current.options.transports is triggered correctly').to.deep.equal([settings.transport]);
					assert.typeOf(current.options.forceNew, 'boolean', JSON.stringify(servers) + ': current.options.forceNew typeof boolean');
					assert.typeOf(current.options.autoConnect, 'boolean', JSON.stringify(servers) + ': current.options.autoConnect typeof boolean');
					if (state === socket.CONNECTION_STATE_ENUM.CONNECT_START_ERROR && window._connect) {
						window.io.connect = window._connect;
						window._connect = null;
					}
				});

				var promise = socket._connect();
				assert.instanceOf(promise, Promise, JSON.stringify(expectResult.servers) + ': returns a Promise');
				chaiPromised(promise, function (error, result) {
					setTimeout(function () {
						if (expectResult.shouldFail) {
							assert.instanceOf(error, Error, JSON.stringify(servers) + ': catch() is triggered');
							assert.isDefined(error.message, JSON.stringify(servers) + ': catch() message is defined');
							expect(result, JSON.stringify(servers) + ': then() is not triggered').to.equal(null);
						} else {
							expect(result, JSON.stringify(servers) + ': then() is triggered').to.equal(null);
							expect(error, JSON.stringify(servers) + ': catch() is not triggered').to.equal(null);
						}
						expect(stateIndex + 1, JSON.stringify(servers) + ': triggers all expected states').to.equal(expectResult.states.length);
						fnProcessNext();
					}, 2000);
				});
			} else {
				done();
			}
		})();
	});

	/**
	 * Tests the `_disconnect()` method.
	 */
	it.skip('_disconnect()', function (done) {
		this.timeout(35000);
		var queue = [
			// Test for disconnect to not trigger error when _connect has not yet been called
			function (fnDone) {
				expect(function () {
				var socket = new Temasys.Socket({ servers: [{ server:'xxx', port: 80 }]});
					socket._disconnect();
				}, 'Should not throw error when connect has not started').to.not.throw(Error);
				fnDone();
			},
			// Test for disconnect not triggering when failed to connect.
			function (fnDone) {
				var socket = new Temasys.Socket({ servers: [{ server:'xxx', port: 80, reconnection: true, reconnectionAttempts: 4, timeout: 1000 }]});
				var disconnectTriggered = false;
				var hasDisconnect = false;
				socket.on('connectionStateChange', function (state) {
					if (state === socket.CONNECTION_STATE_ENUM.RECONNECT_ERROR) {
						socket._disconnect();
						hasDisconnect = true;
					} else if (state === socket.CONNECTION_STATE_ENUM.DISCONNECT) {
						disconnectTriggered = true;
					}
				});
				socket._connect();
				setTimeout(function () {
					expect([hasDisconnect, disconnectTriggered], 'Should not trigger DISCONNECT state when not connected').to.deep.equal([true, false]);
					fnDone();
				}, 4000);
			},
			// Test for disconnect to trigger when connected.
			function (fnDone) {
				var socket = new Temasys.Socket({ servers: [{ server:'signaling.temasys.io', port: 443, protocol: 'https:' }]});
				var disconnectTriggered = false;
				var hasDisconnect = false;
				socket.on('connectionStateChange', function (state) {
					if (state === socket.CONNECTION_STATE_ENUM.CONNECT) {
						socket._disconnect();
						hasDisconnect = true;
					} else if (state === socket.CONNECTION_STATE_ENUM.DISCONNECT) {
						disconnectTriggered = true;
					}
				});
				socket._connect();
				setTimeout(function () {
					expect([hasDisconnect, disconnectTriggered], 'Should trigger DISCONNECT state when connected').to.deep.equal([true, true]);
					fnDone();
				}, 2000);
			},
			// Test for disconnect to trigger when reconnected.
			function (fnDone) {
				var initTs = Date.now();
				window.XMLHttpRequest.prototype._open = window.XMLHttpRequest.prototype.open;
				window.XMLHttpRequest.prototype.open = function (method, url, isCredentials) {
					this._open('GET', 'https://fake.com', true);
				};
				var socket = new Temasys.Socket({ server:'signaling.temasys.io', port: 443, protocol: 'https:', transport: 'polling', timeout: 1500 });
				var disconnectTriggered = false;
				var hasDisconnect = false;
				socket.on('connectionStateChange', function (state) {
					if (state === socket.CONNECTION_STATE_ENUM.RECONNECT) {
						socket._disconnect();
						hasDisconnect = true;
					} else if (state === socket.CONNECTION_STATE_ENUM.CONNECT_ERROR) {
						window.XMLHttpRequest.prototype.open = window.XMLHttpRequest.prototype._open;
						delete window.XMLHttpRequest.prototype._open;
					} else if (state === socket.CONNECTION_STATE_ENUM.DISCONNECT) {
						disconnectTriggered = true;
					}
				});
				socket._connect();
				setTimeout(function () {
					expect([hasDisconnect, disconnectTriggered], 'Should trigger DISCONNECT state when reconnected').to.deep.equal([true, true]);
					fnDone();
				}, 22000);
			}
		];

		(function fnProcessNext () {
			if (queue.length > 0) {
				queue.splice(0, 1)[0](function () {
					fnProcessNext();
				});
			} else {
				done();
			}
		})();
	});

	/**
	 * Tests the `_send()` method.
	 */
	it('_send()', function (done) {
		this.timeout(15000);
	});
})