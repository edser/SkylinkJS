describe('Temasys.Utils', function() {
	// Load the script first
	before(function (done) {
		loadScript('base/source/components/utils.js', function (err) {
			if (err) {
				throw err;
			}
			done();
		});
	});

	/**
	 * Tests the `forEach` method.
	 */
	it('forEach()', function (done) {
		// Test Arrays
		var expectedArr = ['x', 'y', 'z'];
		var expectedArrIndex = 0;

		Temasys.Utils.forEach(expectedArr, function (item, index) {
			expect(index, 'Loop Array index').to.equal(expectedArrIndex);
			expect(item, 'Loop Array value').to.equal(expectedArr[expectedArrIndex]);
			expectedArrIndex++;
		});

		// Test JSON objects
		var expectedObj = { x: 1, y: '2', z: false };

		Temasys.Utils.forEach(expectedObj, function (item, prop) {
			expect(expectedObj, 'Loop JSON object prop').to.have.property(prop);
			expect(expectedObj[prop], 'Loop JSON object value').to.equal(item);
		});

		// Test expected exceptions
		expect(function () {
			Temasys.Utils.forEach(['test']);
		}, 'Providing (array) to throw Error').to.throw(Error);

		expect(function () {
			Temasys.Utils.forEach(function () {});
		}, 'Providing (fn) to not throw Error').to.not.throw(Error);

		expect(function () {
			Temasys.Utils.forEach();
		}, 'Providing () to not throw Error').to.not.throw(Error);

		// Test return values
		var returnArr = ['x', 'y', 'z'];
		var returnArrIndex = 0;
		var outputBreakArr = [];

		Temasys.Utils.forEach(returnArr, function (item, index) {
			outputBreakArr[index] = item;
			return item === 'y'; 
		});

		expect(outputBreakArr.length, 'Break at correct length').to.equal(2);
		expect(outputBreakArr, 'Break with correct values').to.deep.equal(['x','y']);

		Temasys.Utils.forEach(returnArr, function (item, index) {
			if (item !== 'x') {
				returnArr.splice(index, 1);
				return 0;
			}
		});
		
		expect(returnArr.length, 'Decrement with correct length').to.equal(1);
		expect(returnArr, 'Decrement with correct values').to.deep.equal(['x']);

		Temasys.Utils.forEach(returnArr, function (item, index) {
			if (returnArr[index] === 'x') {
				returnArr.push('x');
				// Fast-forward the loop
				if (returnArr.length === 5) {
					returnArr.push('c', 'y', 'e');
					return 2;
				}
			}
		});

		expect(returnArr.length, 'Increment with correct length').to.equal(8);
		expect(returnArr, 'Increment with correct length').to.deep.equal(['x','x','x','x','x','c','y','e']);

		done();
	});

	/**
	 * Tests the `createEventManager` method.
	 */
	(function () {
		var manager = null;

		// Ensure that the return is defined correctly
		it('createEventManager()', function (done) {
			manager = Temasys.Utils.createEventManager();

			assert.typeOf(manager.on, 'function', 'typeof .on is function');
			assert.typeOf(manager.once, 'function', 'typeof .once is function');
			assert.typeOf(manager.off, 'function', 'typeof .off is function');
			assert.typeOf(manager.emit, 'function', 'typeof .emit is function');
			assert.typeOf(manager.catchExceptions, 'function', 'typeof .catchExceptions is function');

			done();
		});

		// Ensure that `.on()` is functioning correctly
		it('createEventManager() -> .on()', function (done) {
			manager.on('test', function () {
				assert.isOk('on() is triggered');
				done();
			});

			manager.emit('test');
		});

		// Ensure that `.once()` is functioning correctly
		it('createEventManager() -> .once()', function (done) {
			var counters = {
				onceOnly:0,
				onceOnCondition: 0,
				onceAlwaysOnCondition: 0,
				onceAlways: 0
			};

			manager.once('test', function () {
				counters.onceOnly++;
			});

			manager.once('test', function () {
				counters.onceOnCondition++;
			}, function (state) {
				return state === true;
			});

			manager.once('test', function () {
				counters.onceAlwaysOnCondition++;
			}, function (state) {
				return state === true;
			}, true);

			manager.once('test', function () {
				counters.onceAlways++;
			}, true);

			manager.emit('test');
			expect(counters.onceOnly, 'Round 1: ()').to.equal(1);
			expect(counters.onceOnCondition, 'Round 1: (conditionFn)').to.equal(0);
			expect(counters.onceAlwaysOnCondition, 'Round 1: (conditionFn, true)').to.equal(0);
			expect(counters.onceAlways, 'Round 1: (true)').to.equal(1);

			manager.emit('test');
			expect(counters.onceOnly, 'Round 2: ()').to.equal(1);
			expect(counters.onceOnCondition, 'Round 2: (conditionFn)').to.equal(0);
			expect(counters.onceAlwaysOnCondition, 'Round 2: (conditionFn, true)').to.equal(0);
			expect(counters.onceAlways, 'Round 2: (true)').to.equal(2);

			manager.emit('test', true);
			expect(counters.onceOnly, 'Round 3: ()').to.equal(1);
			expect(counters.onceOnCondition, 'Round 3: (conditionFn)').to.equal(1);
			expect(counters.onceAlwaysOnCondition, 'Round 3: (conditionFn, true)').to.equal(1);
			expect(counters.onceAlways, 'Round 3: (true)').to.equal(3);

			manager.emit('test', true);
			expect(counters.onceOnly, 'Round 4: ()').to.equal(1);
			expect(counters.onceOnCondition, 'Round 4: (conditionFn)').to.equal(1);
			expect(counters.onceAlwaysOnCondition, 'Round 4: (conditionFn, true)').to.equal(2);
			expect(counters.onceAlways, 'Round 4: (true)').to.equal(4);

			done();
		});

		// Ensure that `.off()` is functioning correctly
		it('createEventManager() -> .off()', function (done) {
			var counters = {
				a: 0,
				b: 0,
				c: 0
			};
			var offFn = function () {
				counters.a++;
			};

			manager.on('a', offFn);
			manager.once('a', function () { counters.a++; }, true);
			manager.on('b', function () { counters.b++; });
			manager.once('b', function () { counters.b++; }, true);
			manager.on('c', function () { counters.c++; });
			manager.once('c', function () { counters.c++; }, true);

			manager.emit('a');
			manager.emit('b');
			manager.emit('c');
			expect(counters.a, 'Round 1: ("a") None').to.equal(2);
			expect(counters.b, 'Round 1: ("b") None').to.equal(2);
			expect(counters.c, 'Round 1: ("c") None').to.equal(2);

			manager.off('a', offFn);
			manager.emit('a');
			manager.emit('b');
			manager.emit('c');
			expect(counters.a, 'Round 2: ("a") off("a", fn)').to.equal(3);
			expect(counters.b, 'Round 2: ("b") off("a", fn)').to.equal(4);
			expect(counters.c, 'Round 2: ("c") off("a", fn)').to.equal(4);

			manager.off('a');
			manager.emit('a');
			manager.emit('b');
			manager.emit('c');
			expect(counters.a, 'Round 3: ("a") off("a")').to.equal(3);
			expect(counters.b, 'Round 3: ("b") off("a")').to.equal(6);
			expect(counters.c, 'Round 3: ("c") off("a")').to.equal(6);

			manager.off();
			manager.emit('a');
			manager.emit('b');
			manager.emit('c');
			expect(counters.a, 'Round 3: ("a") off()').to.equal(3);
			expect(counters.b, 'Round 3: ("b") off()').to.equal(6);
			expect(counters.c, 'Round 3: ("c") off()').to.equal(6);

			done();
		});

		// Ensure that `.emit()` is functioning correctly
		it('createEventManager() -> .emit()', function (done) {
			var fnEmitTest = function () {
				var args1 = Array.prototype.slice.call(arguments);
				var expectArgs = args1.concat([]);
				expectArgs.shift();
				manager.on(args1[0], function () {
					var args2 = Array.prototype.slice.call(arguments)
					expect(expectArgs, 'Arguments matches for (' + args1.join(',') + ')').to.deep.equal(args2);
				});
				manager.emit.apply(args1);
			};

			fnEmitTest('test', true, 1, null);
			fnEmitTest('test2', { x: 1, y: 2 }, 'test123213', -123123);
			fnEmitTest('test3', { x: 1, y: 2 }, ['ok',1,2]);

			done();
		});

		// Ensure that `.catchExceptions()` is functioning correctly
		it('createEventManager() -> .catchExceptions()', function (done) {
			manager.catchExceptions(function (error) {
				assert.instanceOf(error, Error, 'Error object is returned');
				assert.isString(error.message, 'Error object has message');
			});

			expect(function () {
				manager.once('test', function () {
					throw new Error('test');
				});
				manager.emit('test');
			}, 'Error should be caught').to.not.throw(Error);

			manager.catchExceptions(null);

			expect(function () {
				manager.once('test', function () {
					throw new Error('test');
				});
				manager.emit('test');
			}, 'Error should not be caught').to.throw(Error);

			done();
		});
	})();

	/**
	 * Tests the `copy` method.
	 */
	it('copy()', function (done) {
		var fnCopyTest = function (item) {
			expect(Temasys.Utils.copy(item), JSON.stringify(item) + ' should be copied correctly').to.deep.equal(item);
		};

		fnCopyTest('Test');
		fnCopyTest([0,1,2,'4',true,'test', {a:1, b:2}]);
		fnCopyTest({ x:1, y:'erer' });
		fnCopyTest(12321489140123);
		fnCopyTest(true);
		fnCopyTest(false);
		fnCopyTest(null);

		done();
	});

	/**
	 * Tests the `generateUUID` method.
	 */
	it('generateUUID()', function (done) {
		var uuid = Temasys.Utils.generateUUID();

		assert.typeOf(uuid, 'string', 'return(): typeof is string');
		expect(uuid, 'Matches RFC 4122').match(/^[0-9|a-z]{8}\-[0-9|a-z]{4}\-[0-9|a-z]{4}\-[0-9|a-z]{4}\-[0-9|a-z]{12}$/gi);

		done();
	});

	/**
	 * Tests the `extend` method.
	 */
	it('extend()', function (done) {
		Temasys.Utils.forEach([
			[[null], {}],
			[[{}], {}],
			[[true], {}],
			[[1], {}],
			[[undefined], {}],
			[[{}, {}], {}],
			[[{a:1}], {a:1}],
			[[{a:1, b:'test',x:true, y: {t:1,y:23}}, {}], {a:1, b:'test',x:true, y: {t:1,y:23}}],
			[[{x:true, y: {t:1,y:23}}, { test: ['a',1,2]}], {x:true, y: {t:1,y:23}, test: ['a',1,2] }],
			[[{x:true, y: {t:1,y:23}}, { x: 1 }], {x:1, y: {t:1,y:23} }],
			[[{a:1, b: 2}, { a: 'test'}], {a:'test', b: 2}]
		], function (item, itemProp) {
			expect(Temasys.Utils.extend.apply(this, item[0]), JSON.stringify(item[0]) + ': extends').to.deep.equal(item[1]);
		});

		done();
	});

	/**
	 * Tests the `getClientSupports()` method.
	 */
	it('getClientSupports()', function (done) {
		var queue = [];
		window._webrtcDetectedBrowser = window.webrtcDetectedBrowser;
		window._webrtcDetectedVersion = window.webrtcDetectedVersion;

		Temasys.Utils.forEach(['chrome', 'firefox', 'opera', 'safari', 'IE', 'bowser', 'edge'], function (browser) {
			Temasys.Utils.forEach([8,9,42,55], function (version) {
				var testCases = [
					['without AdapterJS', function () {
						window._AdapterJS = window.AdapterJS;
						window.AdapterJS = null;
					}, function () {
						window.AdapterJS = window._AdapterJS;
					}],
					['without XMLHttpRequest', function () {
						window._XMLHttpRequest = window.XMLHttpRequest;
						window.XMLHttpRequest = null;
					}, function () {
						window.XMLHttpRequest = window._XMLHttpRequest;
					}],
					['without XDomainRequest', function () {
						window._XDomainRequest = window.XDomainRequest;
						window.XDomainRequest = null;
					}, function () {
						window.XDomainRequest = window._XDomainRequest;
					}]
				];

				if (window.webrtcDetectedBrowser === 'edge') {
					var fnReturnCapabilities = function () {
						return [
							{ name: 'xx1', kind: 'audio', preferredPayload: 100, clockRate: 1000, numChannels: 1 },
							{ name: 'xx2', kind: 'video', preferredPayload: 101, clockRate: 2000, numChannels: 2 }
						];
					};

					testCases.splice(testCases.length - 1, 0, ['with ORTC RTCRtpSender', function () {
							window.RTCRtpSender = function () {};
							window.RTCRtpSender.getCapabilities = fnReturnCapabilities;
						}, function () {
							window.RTPSender = null;
						}],
						['with ORTC RTCRtpReceiver', function () {
							window.RTCRtpReceiver = function () {};
							window.RTCRtpReceiver.getCapabilities = fnReturnCapabilities;
						}, function () {
							window.RTPSender = null;
						}],
						['with ORTC RTCRtpSender and RTCRtpReceiver', function () {
							window.RTCRtpSender = function () {};
							window.RTCRtpSender.getCapabilities = fnReturnCapabilities;
							window.RTCRtpReceiver = function () {};
							window.RTCRtpReceiver.getCapabilities = fnReturnCapabilities;
						}, function () {
							window.RTPSender = null;
						}]
						['without ORTC RTCRtpSender and RTCRtpReceiver', function () {}, function () {}]
					);
				} else if (['IE', 'safari'].indexOf(browser) > -1) {
					Temasys.Utils.forEach([
						{ valid: false },
						{ VERSION: '1.3.4' },
						{ COMPANY: 'test' },
						{ HasUsageRestrictionToDomains: true },
						{ HasFeaturesRestrictedToDomains: true },
						{ HasAutoupdateFeature: true },
						{ HasCrashReporterFeature: true },
						{ HasPopupFeature: true },
						{ HasWhiteListingFeature: true, isWebsiteWhitelisted: false },
						{ HasWhiteListingFeature: false, isWebsiteWhitelisted: true },
						{ HasWhiteListingFeature: false, isWebsiteWhitelisted: false },
						{ HasWhiteListingFeature: true, isWebsiteWhitelisted: true },
						{ HasScreensharingFeature: true, isScreensharingAvailable: false },
						{ HasScreensharingFeature: false, isScreensharingAvailable: true },
						{ HasScreensharingFeature: true, isScreensharingAvailable: true },
						{ HasScreensharingFeature: false, isScreensharingAvailable: false },
						{ HasHTTPProxyFeature: true },
						{ HasH264Support: true },
						{ HasExperimentalAEC: true },
						{ expirationDate: '2012-08-01' },
						{ expirationDate: '2199-08-01' },
						{ isOutOfDate: true },
						{}
					], function (pluginStatus) {
						testCases.push(['with plugin data (' + JSON.stringify(pluginStatus) + ')', function () {
							AdapterJS = window._AdapterJS || {};
							AdapterJS.WebRTCPlugin = AdapterJS.WebRTCPlugin || {};
							AdapterJS.WebRTCPlugin.plugin = pluginStatus;
							AdapterJS.WebRTCPlugin.pluginInfo = {
								pluginId : 'test',
							};
							var pluginDOM = document.createElement('object');
							pluginDOM.id = AdapterJS.WebRTCPlugin.pluginInfo.pluginId;
							pluginDOM.style.visibility = 'hidden';
							pluginDOM.style.width = 0;
							pluginDOM.style.height = 0;
							document.body.appendChild(pluginDOM);
						}, function () {
							AdapterJS = {};
						}]);
					});

					testCases.push(['with plugin object not displayed', function () {
						AdapterJS = window._AdapterJS || {};
						AdapterJS.WebRTCPlugin = AdapterJS.WebRTCPlugin || {};
						AdapterJS.WebRTCPlugin.plugin = {};
						AdapterJS.WebRTCPlugin.pluginInfo = {
							pluginId : 'test',
						};
						var pluginDOM = document.createElement('object');
						pluginDOM.id = AdapterJS.WebRTCPlugin.pluginInfo.pluginId;
						pluginDOM.style.display = 'none';
						document.body.appendChild(pluginDOM);
					}, function () {
						AdapterJS = {};
					}]);
				}

				Temasys.Utils.forEach(testCases, function(item) {
					queue.push([browser, version, browser + '+' + version + ' ' + item[0], item[1], item[2]]);
				});
			});
		});

		(function fnNext (fnProcessItem) {
			if (queue.length > 0) {
				var testItem = queue.splice(0, 1)[0];
				testItem[3]();
				window.webrtcDetectedBrowser = testItem[0];
				window.webrtcDetectedVersion = testItem[1];
			  fnProcessItem(testItem[2], function () {
					testItem[4]();
					fnNext();
				});
			} else {
				window.webrtcDetectedBrowser = window._webrtcDetectedBrowser;
				window.webrtcDetectedVersion = window._webrtcDetectedVersion;
				done();
			}
		})(function (testName, fnItemDone) {
			var promise = Temasys.Utils.getClientSupports();
			assert.instanceOf(promise, Promise, testName + ': return is instanceof Promise');

			chaiPromised(promise, function (error, result) {
				var hasAdapterJS = !!AdapterJS && typeof AdapterJS === 'object' && typeof AdapterJS.webRTCReady === 'function';
				
				if (error) {
					throw error;
				}

				expect(result.current.browser.name,
					testName + ': result.current.browser.name is correct').to.equal(window.webrtcDetectedBrowser);
				expect(result.current.browser.name,
					testName + ': result.current.browser.version is correct').to.equal(window.webrtcDetectedVersion);
				expect(result.current.browser.platform,
					testName + ': result.current.browser.platform is correct').to.equal(navigator.platform);
				expect(result.current.browser.mobilePlatformVersion,
					testName + ': result.current.browser.mobilePlatformVersion is correct').to.equal(null);

				expect(result.current.dependencies.adapterjs,
					testName + ': result.current.dependencies.adapterjs is correct').to.equal(hasAdapterJS ? AdapterJS.VERSION : null);
				expect(result.current.dependencies.io,
					testName + ': result.current.dependencies.io is correct').to.equal(!!window.io);

				if (['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1 && hasAdapterJS) {
					expect(result.current.webrtcPlugin.version,
						testName + ': result.current.webrtcPlugin.version is correct').to.equal(AdapterJS.WebRTCPlugin.plugin.VERSION);
					expect(result.current.webrtcPlugin.company,
						testName + ': result.current.webrtcPlugin.company is correct').to.equal(AdapterJS.WebRTCPlugin.plugin.COMPANY);
					expect(result.current.webrtcPlugin.expirationDate,
						testName + ': result.current.webrtcPlugin.expirationDate is correct').to.equal(
						AdapterJS.WebRTCPlugin.plugin.expirationDate || null);

					if (!!AdapterJS.WebRTCPlugin.plugin.HasWhiteListingFeature) {
						expect(result.current.webrtcPlugin.whiteList.enabled,
							testName + ': result.current.webrtcPlugin.whiteList.enabled is correct').to.equal(
							!!AdapterJS.WebRTCPlugin.plugin.isWebsiteWhitelisted);
						expect(result.current.webrtcPlugin.whiteList.restrictsUsage,
							testName + ': result.current.webrtcPlugin.whiteList.restrictsUsage is correct').to.equal(
							!!AdapterJS.WebRTCPlugin.plugin.HasUsageRestrictionToDomains);
						expect(result.current.webrtcPlugin.whiteList.restrictsFeatures,
							testName + ': result.current.webrtcPlugin.whiteList.restrictsFeatures is correct').to.equal(
							!!AdapterJS.WebRTCPlugin.plugin.HasFeaturesRestrictedToDomains);
					} else {
						expect(result.current.webrtcPlugin.whiteList,
							testName + ': result.current.webrtcPlugin.whiteList is correct').to.equal(null);
					}

					var pluginDOM = document.getElementById(AdapterJS.WebRTCPlugin.pluginInfo.pluginId);
					var isInactiveFeatures = result.current.webrtcPlugin.active && !(result.current.webrtcPlugin.whiteList &&
						!result.current.webrtcPlugin.whiteList.enabled && result.current.webrtcPlugin.whiteList.restrictsFeatures);
					
					if (AdapterJS.WebRTCPlugin.plugin.isOutOfDate || (result.current.webrtcPlugin.whiteList &&
						!result.current.webrtcPlugin.whiteList.enabled && result.current.webrtcPlugin.whiteList.restrictsUsage) ||
						!(pluginDOM && pluginDOM.style.display !== 'none')) {
						expect(result.current.webrtcPlugin.active,
							testName + ': result.current.webrtcPlugin.active is correct').to.equal(false);
					}

					assert.typeOf(result.current.webrtcPlugin.active, 'boolean',
						testName + ': result.current.webrtcPlugin.active typeof boolean');

					expect(result.current.webrtcPlugin.features.autoUpdate,
						testName + ': result.current.webrtcPlugin.features.autoUpdate is correct').to.equal(
						!isInactiveFeatures ? !!AdapterJS.WebRTCPlugin.plugin.HasAutoupdateFeature : false);
					expect(result.current.webrtcPlugin.features.crashReporter,
						testName + ': result.current.webrtcPlugin.features.crashReporter is correct').to.equal(
						!isInactiveFeatures ? !!AdapterJS.WebRTCPlugin.plugin.HasCrashReporterFeature : false);
					expect(result.current.webrtcPlugin.features.noPermissionPopup,
						testName + ': result.current.webrtcPlugin.features.noPermissionPopup is correct').to.equal(
						!isInactiveFeatures ? !!AdapterJS.WebRTCPlugin.plugin.HasPopupFeature : false);
					expect(result.current.webrtcPlugin.features.screensharing,
						testName + ': result.current.webrtcPlugin.features.screensharing is correct').to.equal(
						!isInactiveFeatures ? !!(AdapterJS.WebRTCPlugin.plugin.HasScreensharingFeature &&
						AdapterJS.WebRTCPlugin.plugin.isScreensharingAvailable) : false);
					expect(result.current.webrtcPlugin.features.experimentalAEC,
						testName + ': result.current.webrtcPlugin.features.experimentalAEC is correct').to.equal(
						!isInactiveFeatures ? !!AdapterJS.WebRTCPlugin.plugin.HasExperimentalAEC : false);
					expect(result.current.webrtcPlugin.features.h264,
						testName + ': result.current.webrtcPlugin.features.h264 is correct').to.equal(
						!isInactiveFeatures ? !!AdapterJS.WebRTCPlugin.plugin.HasH264Support : false);
					expect(result.current.webrtcPlugin.features.httpProxy,
						testName + ': result.current.webrtcPlugin.features.httpProxy is correct').to.equal(
						!isInactiveFeatures ? !!AdapterJS.WebRTCPlugin.plugin.HasHTTPProxyFeature : false);
				}

				expect(result.current.supports.webrtc.connection,
					testName + ': result.current.supports.webrtc.connection is correct').to.equal(
					!(result.current.webrtcPlugin && !result.current.webrtcPlugin.active) || !window.RTCPeerConnection ||
					(Object.keys(result.current.supports.webrtc.codecs.send.audio).length === 0 &&
					Object.keys(result.current.supports.webrtc.codecs.send.video).length === 0 &&
					Object.keys(result.current.supports.webrtc.codecs.recv.audio).length === 0 &&
					Object.keys(result.current.supports.webrtc.codecs.rec.video).length === 0));

				expect(result.current.supports.webrtc.datachannel,
					testName + ': result.current.supports.webrtc.datachannel is correct').to.equal(
					

				console.info('parse->',{
					datachannel: result.current.supports.webrtc.datachannel,
					dtmfsender: result.current.supports.webrtc.dtmfsender,
					generateCertificate: result.current.supports.webrtc.generateCertificate,
					iceRestart: result.current.supports.webrtc.iceRestart,
					screensharing: result.current.supports.webrtc.screensharing,
					maxBandwidth: result.current.supports.webrtc.maxBandwidth,
					turns: result.current.supports.webrtc.turns,
					stun: result.current.supports.webrtc.stun,
					turn: result.current.supports.webrtc.turn,
					turnOverTcp: result.current.supports.webrtc.turnOverTcp
				}, (function () {
					var output = {
						datachannel: false,
						dtmfsender: false,
						generateCertificate: false,
						iceRestart: false,
						screensharing: false,
						maxBandwidth: false,
						turns: false,
						stun: false,
						turn: false,
						turnOverTcp: false
					};
					if (result.current.supports.webrtc.connection) {
						if (window.webrtcDetectedBrowser === 'chrome') {
							output.datachannel = window.webrtcDetectedVersion > 30;
							output.dtmfsender = window.webrtcDetectedVersion >= 45;
							output.generateCertificate = window.webrtcDetectedVersion > 52;
							output.iceRestart = window.webrtcDetectedVersion >= 45;
							output.turns = window.webrtcDetectedBrowser >= 30;
							output.turnOverTcp = window.webrtcDetectedVersion >= 45;
							output.maxBandwidth = window.webrtcDetectedVersion >= 45;
							output.screensharing = window.webrtcDetectedVersion >= 45;
							output.stun = window.webrtcDetectedVersion >= 45;
						} else if (window.webrtcDetectedBrowser === 'firefox') {
							output.datachannel = window.webrtcDetectedVersion >= 38;
							output.dtmfsender = window.webrtcDetectedVersion >= 52;
							output.generateCertificate = window.webrtcDetectedVersion >= 42;
							output.iceRestart = window.webrtcDetectedVersion >= 48;
							output.turns = window.webrtcDetectedVersion >= 52;
							output.turnOverTcp = window.webrtcDetectedVersion >= 38;
							output.maxBandwidth = window.webrtcDetectedVersion >= 49;
							output.screensharing = window.webrtcDetectedVersion >= 38;
							output.stun = window.webrtcDetectedVersion >= 38;
						} else if (window.webrtcDetectedBrowser === 'opera') {
							output.datachannel = window.webrtcDetectedVersion >= 22;
							output.dtmfsender = window.webrtcDetectedVersion >= 52;
							output.generateCertificate = window.webrtcDetectedVersion >= 42;
							output.iceRestart = window.webrtcDetectedVersion >= 48;
							output.turns = window.webrtcDetectedVersion >= 52;
							output.turnOverTcp = window.webrtcDetectedVersion >= 22;
							output.maxBandwidth = window.webrtcDetectedVersion >= 49;
							output.screensharing = window.webrtcDetectedVersion >= 34;
							output.stun = window.webrtcDetectedVersion >= 22;
						}
					}
					return output;
				})());

				expect({
					datachannel: result.current.supports.webrtc.datachannel,
					dtmfsender: result.current.supports.webrtc.dtmfsender,
					generateCertificate: result.current.supports.webrtc.generateCertificate,
					iceRestart: result.current.supports.webrtc.iceRestart,
					screensharing: result.current.supports.webrtc.screensharing,
					maxBandwidth: result.current.supports.webrtc.maxBandwidth,
					turns: result.current.supports.webrtc.turns,
					stun: result.current.supports.webrtc.stun,
					turn: result.current.supports.webrtc.turn,
					turnOverTcp: result.current.supports.webrtc.turnOverTcp
				}, testName + ': result.current.supports.webrtc settings matches expected').to.deep.equal((function () {
					var output = {
						datachannel: false,
						dtmfsender: false,
						generateCertificate: false,
						iceRestart: false,
						screensharing: false,
						maxBandwidth: false,
						turns: false,
						stun: false,
						turn: false,
						turnOverTcp: false
					};
					if (result.current.supports.webrtc.connection) {
						if (window.webrtcDetectedBrowser === 'chrome') {
							output.datachannel = window.webrtcDetectedVersion > 30;
							output.dtmfsender = window.webrtcDetectedVersion >= 45;
							output.generateCertificate = window.webrtcDetectedVersion > 52;
							output.iceRestart = window.webrtcDetectedVersion >= 45;
							output.turns = window.webrtcDetectedBrowser >= 30;
							output.turnOverTcp = window.webrtcDetectedVersion >= 45;
							output.maxBandwidth = window.webrtcDetectedVersion >= 45;
							output.screensharing = window.webrtcDetectedVersion >= 45;
							output.stun = window.webrtcDetectedVersion >= 45;
						} else if (window.webrtcDetectedBrowser === 'firefox') {
							output.datachannel = window.webrtcDetectedVersion >= 38;
							output.dtmfsender = window.webrtcDetectedVersion >= 52;
							output.generateCertificate = window.webrtcDetectedVersion >= 42;
							output.iceRestart = window.webrtcDetectedVersion >= 48;
							output.turns = window.webrtcDetectedVersion >= 52;
							output.turnOverTcp = window.webrtcDetectedVersion >= 38;
							output.maxBandwidth = window.webrtcDetectedVersion >= 49;
							output.screensharing = window.webrtcDetectedVersion >= 38;
							output.stun = window.webrtcDetectedVersion >= 38;
						} else if (window.webrtcDetectedBrowser === 'opera') {
							output.datachannel = window.webrtcDetectedVersion >= 22;
							output.dtmfsender = window.webrtcDetectedVersion >= 52;
							output.generateCertificate = window.webrtcDetectedVersion >= 42;
							output.iceRestart = window.webrtcDetectedVersion >= 48;
							output.turns = window.webrtcDetectedVersion >= 52;
							output.turnOverTcp = window.webrtcDetectedVersion >= 22;
							output.maxBandwidth = window.webrtcDetectedVersion >= 49;
							output.screensharing = window.webrtcDetectedVersion >= 34;
							output.stun = window.webrtcDetectedVersion >= 22;
						}
					}
					return output;
				})());

				Temasys.forEach(['audio', 'video'], function (kind) {
					Temasys.forEach(['send', 'recv'], function (direction) {
						Temasys.Utils.forEach(result.current.supports.webrtc.codecs[direction][kind], function (codec, codecProp) {
							expect({
								codecName: { matches: !!codecProp, typeof: typeof codec.codecName },
								channels: { matches: codec.channels > 0, typeof: typeof codec.channels },
								clockRate: { matches: codec.clockRate > 0, typeof: typeof codec.clockRate },
								sdpFmtpLine: { matches: !!codec.sdpFmtpLine, typeof: typeof codec.sdpFmtpLine },
								payloadType: { matches: codec.payloadType > 0, typeof: typeof codec.payloadType }
							}).to.deep.equal({
								codecName: { matches: true, typeof: 'string' },
								channels: { matches: true, typeof: 'number' },
								clockRate: { matches: true, typeof: 'number' },
								sdpFmtpLine: { matches: true, typeof: 'string' },
								payloadType: { matches: true, typeof: 'number' }
							});
						});
					});
				});
				fnItemDone();
			});
		});
	});
});