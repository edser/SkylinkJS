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
	 * Tests the `checkDependencies` method.
	 */
	it('checkDependencies()', function (done) {
		var fnCheckSupports = function (name, expectCurrentResult) {
			var result = Temasys.Utils.checkDependencies();
			expect(result.current.adapterjs, name + ': current.adapterjs should not be defined').to.equal(expectCurrentResult.adapterjs);
			expect(result.current.io, name + ': current.io to be true').to.equal(expectCurrentResult.io);
			expect(result.current.xmlhttprequest, name + ': current.io to be true').to.equal(expectCurrentResult.xmlhttprequest);
			assert.isDefined(result.recommended.adapterjs, name + ': recommended.adapterjs to be defined');
			assert.typeOf(result.recommended.adapterjs, 'string', name + ': recommended.adapterjs typeof string');
			assert.isDefined(result.recommended.io, name + ': recommended.io to be defined');
			assert.typeOf(result.recommended.io, 'string', name + ': recommended.io typeof string');
		};

		window._AdapterJS = window.AdapterJS;
		window.AdapterJS = null;
		fnCheckSupports('Missing AdapterJS', { adapterjs: null, io: true, xmlhttprequest: true });
		window.AdapterJS = window._AdapterJS;

		window._io = window.io;
		window.io = null;
		fnCheckSupports('Missing socket.io-client', { adapterjs: window.AdapterJS.VERSION, io: false, xmlhttprequest: true });
		window.io = window._io;

		window._XMLHttpRequest = window.XMLHttpRequest;
		window.XMLHttpRequest = null;
		fnCheckSupports('Missing XMLHttpRequest', { adapterjs: window.AdapterJS.VERSION, io: true, xmlhttprequest: false });
		window.XMLHttpRequest = window._XMLHttpRequest;

		fnCheckSupports('Everything loaded', { adapterjs: window.AdapterJS.VERSION, io: true, xmlhttprequest: true });

		done();
	});

	/**
	 * Tests the `getBrowserSupports` method.
	 */
	it('getBrowserSupports()', function (done) {
	  var queue = [];

		window._webrtcDetectedBrowser = window.webrtcDetectedBrowser;
		window._webrtcDetectedVersion = window._webrtcDetectedVersion;

		Temasys.Utils.forEach(['chrome', 'firefox', 'opera', 'safari', 'IE', 'bowser', 'edge'], function (browser) {
			Temasys.Utils.forEach([8,9,10], function (version) {
				queue.push([browser, version, browser + '+' + version + ' without AdapterJS', function () {
					window._AdapterJS = window.AdapterJS;
					window.AdapterJS = null;
				}, function () {
					window.AdapterJS = window._AdapterJS;
				}]);

				queue.push([browser, version, browser + '+' + version + ' without XMLHttpRequest', function () {
					window._XMLHttpRequest = window.XMLHttpRequest;
					window.XMLHttpRequest = null;
				}, function () {
					window.XMLHttpRequest = window._XMLHttpRequest;
				}]);

				queue.push([browser, version, browser + '+' + version + ' without XDomainRequest', function () {
					window._XDomainRequest = window.XDomainRequest;
					window.XDomainRequest = null;
				}, function () {
					window.XDomainRequest = window._XDomainRequest;
				}]);

				if (['IE', 'safari'].indexOf(browser) > -1) {
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
						queue.push([browser, version, browser + '+' + version + ' with plugin data (' + JSON.stringify(pluginStatus) + ')', function () {
							AdapterJS = window._AdapterJS || {};
							AdapterJS.WebRTCPlugin = AdapterJS.WebRTCPlugin || {};
							AdapterJS.WebRTCPlugin.plugin = pluginStatus;
						}, function () {
							AdapterJS = {};
						}]);
					});
				} else if (browser === 'edge') {
					var fnReturnCapabilities = function () {
						return [
							{ name: 'xx1', kind: 'audio', preferredPayload: 100, clockRate: 1000, numChannels: 1 },
							{ name: 'xx2', kind: 'video', preferredPayload: 101, clockRate: 2000, numChannels: 2 }];
					};

					queue.push([browser, version, browser + '+' + version + ' with ORTC RTCRtpSender', function () {
						window.RTCRtpSender = function () {};
						window.RTCRtpSender.getCapabilities = fnReturnCapabilities;
					}, function () {
						window.RTPSender = null;
					}]);

					queue.push([browser, version, browser + '+' + version + ' with ORTC RTCRtpSender and RTCRtpReceiver', function () {
						window.RTCRtpSender = function () {};
						window.RTCRtpSender.getCapabilities = fnReturnCapabilities;
						window.RTCRtpReceiver = function () {};
						window.RTCRtpReceiver.getCapabilities = fnReturnCapabilities;
					}, function () {
						window.RTPSender = null;
					}]);

					queue.push([browser, version, browser + '+' + version + ' with ORTC RTCRtpReceiver', function () {
						window.RTCRtpReceiver = function () {};
						window.RTCRtpReceiver.getCapabilities = fnReturnCapabilities;
					}, function () {
						window.RTPSender = null;
					}]);

					queue.push([browser, version, browser + '+' + version + ' without ORTC RTCRtpSender and RTCRtpReceiver', function () {}, function () {}]);
				}
			});
		});

		var fnProcessNextQueueItem = function () {
			if (queue.length > 0) {
				var item = queue[0];
				queue.splice(0, 1);
				var itemName = item[2];
				window.webrtcDetectedBrowser = item[0];
				window.webrtcDetectedVersion = item[1];
				item[3]();

				var promise = Temasys.Utils.getBrowserSupports();
				assert.instanceOf(promise, Promise, itemName + ': return is instanceof Promise');
				chaiPromised(promise, function (error, result) {
					if (error) {
						throw error;
					}

					// NOTE: Because there are too many properties to test, we need to test everything into an array instead of individual
					//   asserts or equals per item.
					// Tests result.current.browser.name
					expect(result.current.browser.name, itemName + ': result.current.browser.name matches expected'
						).to.equal(window.webrtcDetectedBrowser);
					// Tests result.current.browser.version
					expect(result.current.browser.version, itemName + ': result.current.browser.version matches expected'
						).to.equal(window.webrtcDetectedVersion.toString());
					// Tests result.current.browser.platform
					expect(result.current.browser.platform, itemName + ': result.current.browser.name matches expected'
						).to.equal(navigator.platform);
					// Tests result.current.browser.mobilePlatformVersion
					expect(result.current.browser.mobilePlatformVersion, itemName + ': result.current.browser.name matches expected'
						).to.equal(null);

					var pluginAvailable = AdapterJS && typeof AdapterJS === 'object' && AdapterJS.WebRTCPlugin &&
						typeof AdapterJS.WebRTCPlugin === 'object' && AdapterJS.WebRTCPlugin.plugin;

					// Tests result.current.webrtcPlugin.required
					expect(result.current.webrtcPlugin.required, itemName + ': result.current.webrtcPlugin.required matches expected'
						).to.equal(['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1);
					// Tests result.current.webrtcPlugin.active
					expect(result.current.webrtcPlugin.active, itemName + ': result.current.webrtcPlugin.active matches expected').to.equal(
						pluginAvailable ? !(
						// Whitelist checks
						(AdapterJS.WebRTCPlugin.plugin.HasWhiteListingFeature && !AdapterJS.WebRTCPlugin.plugin.isWebsiteWhitelisted) ||
						// Expiration date checks
						(AdapterJS.WebRTCPlugin.plugin.expirationDate &&
						(new Date (rAdapterJS.WebRTCPlugin.plugin.expirationDate)).getTime() <= (new Date()).getTime()) ||
						// Valid checks
						!AdapterJS.WebRTCPlugin.plugin.valid ||
						// Out of date checks
						AdapterJS.WebRTCPlugin.plugin.isOutOfDate) : false);
					// Tests result.current.webrtcPlugin.version
					expect(result.current.webrtcPlugin.version, itemName + ': result.current.webrtcPlugin.version matches expected'
						).to.equal(pluginAvailable ? (AdapterJS.WebRTCPlugin.plugin.VERSION || null) : null);
					// Tests result.current.webrtcPlugin.company
					expect(result.current.webrtcPlugin.company, itemName + ': result.current.webrtcPlugin.company matches expected'
						).to.equal(pluginAvailable ? AdapterJS.WebRTCPlugin.plugin.COMPANY : null);
					// Tests result.current.webrtcPlugin.expirationDate
					expect(result.current.webrtcPlugin.expirationDate, itemName + ': result.current.webrtcPlugin.expirationDate matches expected'
						).to.equal(pluginAvailable ? AdapterJS.WebRTCPlugin.plugin.expirationDate : null);
					// Tests result.current.webrtcPlugin.whiteListed
					expect(result.current.webrtcPlugin.whiteListed, itemName + ': result.current.webrtcPlugin.whiteListed matches expected'
						).to.equal(pluginAvailable ? (AdapterJS.WebRTCPlugin.plugin.HasWhiteListingFeature ?
						!!AdapterJS.WebRTCPlugin.plugin.isWebsiteWhitelisted : false) : false);
					// Tests result.current.webrtcPlugin.features.domainUsageRestrictions
					expect(result.current.webrtcPlugin.features.domainUsageRestrictions, itemName + ': result.current.webrtcPlugin.features.domainUsageRestrictions matches expected'
						).to.equal(pluginAvailable ? !!AdapterJS.WebRTCPlugin.plugin.HasUsageRestrictionToDomains : false);
					// Tests result.current.webrtcPlugin.features.domainFeaturesRestrictions
					expect(result.current.webrtcPlugin.features.domainFeaturesRestrictions, itemName + ': result.current.webrtcPlugin.features.domainFeaturesRestrictions matches expected'
						).to.equal(pluginAvailable ? !!AdapterJS.WebRTCPlugin.plugin.HasFeaturesRestrictedToDomains : false);
					// Tests result.current.webrtcPlugin.features.autoUpdate
					expect(result.current.webrtcPlugin.features.autoUpdate, itemName + ': result.current.webrtcPlugin.features.autoUpdate matches expected'
						).to.equal(pluginAvailable ? !!AdapterJS.WebRTCPlugin.plugin.HasAutoupdateFeature : false);
					// Tests result.current.webrtcPlugin.features.crashReporter
					expect(result.current.webrtcPlugin.features.crashReporter, itemName + ': result.current.webrtcPlugin.features.crashReporter matches expected'
						).to.equal(pluginAvailable ? !!AdapterJS.WebRTCPlugin.plugin.HasCrashReporterFeature : false);
					// Tests result.current.webrtcPlugin.features.permissionPopup
					expect(result.current.webrtcPlugin.features.permissionPopup, itemName + ': result.current.webrtcPlugin.features.permissionPopup matches expected'
						).to.equal(pluginAvailable ? !!AdapterJS.WebRTCPlugin.plugin.HasPopupFeature : false);
					// Tests result.current.webrtcPlugin.features.whiteListing
					expect(result.current.webrtcPlugin.features.whiteListing, itemName + ': result.current.webrtcPlugin.features.whiteListing matches expected'
						).to.equal(pluginAvailable ? !!AdapterJS.WebRTCPlugin.plugin.HasWhiteListingFeature : false);
					// Tests result.current.webrtcPlugin.features.screensharing
					expect(result.current.webrtcPlugin.features.screensharing, itemName + ': result.current.webrtcPlugin.features.screensharing matches expected'
						).to.equal(pluginAvailable ? !!(AdapterJS.WebRTCPlugin.plugin.HasScreensharingFeature &&
						AdapterJS.WebRTCPlugin.plugin.isScreensharingAvailable) : false);
					// Tests result.current.webrtcPlugin.features.whiteListing
					expect(result.current.webrtcPlugin.features.experimentalAEC, itemName + ': result.current.webrtcPlugin.features.experimentalAEC matches expected'
						).to.equal(pluginAvailable ? !!AdapterJS.WebRTCPlugin.plugin.HasExperimentalAEC : false);
					// Tests result.current.webrtcPlugin.features.h264
					expect(result.current.webrtcPlugin.features.h264, itemName + ': result.current.webrtcPlugin.features.h264 matches expected'
						).to.equal(pluginAvailable ? !!AdapterJS.WebRTCPlugin.plugin.HasH264Support : false);
					// Tests result.current.webrtcPlugin.features.httpProxy
					expect(result.current.webrtcPlugin.features.httpProxy, itemName + ': result.current.webrtcPlugin.features.httpProxy matches expected'
						).to.equal(pluginAvailable ? !!AdapterJS.WebRTCPlugin.plugin.HasHTTPProxyFeature : false);

					var fnAssertKeysLength = function (obj, shouldZero) {
						return shouldZero ? Object.keys(obj).length === 0 : Object.keys(obj).length >= 0;
					};

					// Tests result.current.supports.webrtc.connection
					expect([typeof result.current.supports.webrtc.connection, result.current.supports.webrtc.connection],
						itemName + ': result.current.supports.webrtc.connection matches expected').to.deep.equal(
						['boolean', result.current.webrtcPlugin.required ? result.current.webrtcPlugin.active : !!window.RTCPeerConnection]);
					// Tests result.current.supports.webrtc.datachannel
					expect([typeof result.current.supports.webrtc.datachannel, !result.current.supports.webrtc.connection ?
						result.current.supports.webrtc.datachannel : null],
						itemName + ': result.current.supports.webrtc.datachannel matches expected').to.deep.equal(
						['boolean', !result.current.supports.webrtc.connection ? false : null]);
					// Tests result.current.supports.webrtc.iceRestart
					expect([typeof result.current.supports.webrtc.iceRestart, !result.current.supports.webrtc.connection ?
						result.current.supports.webrtc.iceRestart : null],
						itemName + ': result.current.supports.webrtc.iceRestart matches expected').to.deep.equal(
						['boolean', !result.current.supports.webrtc.connection ? false : null]);
					// Tests result.current.supports.webrtc.screensharing
					expect([typeof result.current.supports.webrtc.screensharing, !result.current.supports.webrtc.connection ?
						result.current.supports.webrtc.screensharing : null,
						result.current.webrtcPlugin.required ? result.current.supports.webrtc.screensharing : null],
						itemName + ': result.current.supports.webrtc.screensharing matches expected').to.deep.equal(
						['boolean', !result.current.supports.webrtc.connection ? false : null,
						result.current.webrtcPlugin.required ? result.current.webrtcPlugin.features.screensharing : null]);
					// Tests result.current.supports.webrtc.maxBandwidth
					expect([typeof result.current.supports.webrtc.maxBandwidth, !result.current.supports.webrtc.connection ?
						result.current.supports.webrtc.maxBandwidth : null],
						itemName + ': result.current.supports.webrtc.maxBandwidth matches expected').to.deep.equal(
						['boolean', !result.current.supports.webrtc.connection ? false : null]);
					// Tests result.current.supports.webrtc.turns
					expect([typeof result.current.supports.webrtc.turns, !result.current.supports.webrtc.connection ?
						result.current.supports.webrtc.turns : null],
						itemName + ': result.current.supports.webrtc.turns matches expected').to.deep.equal(
						['boolean', !result.current.supports.webrtc.connection ? false : null]);
					// Tests result.current.supports.webrtc.codecs.send.audio
					expect([typeof result.current.supports.webrtc.codecs.send.audio, !!result.current.supports.webrtc.codecs.send.audio,
						fnAssertKeysLength(result.current.supports.webrtc.codecs.send.audio, !result.current.supports.webrtc.connection)],
						itemName + ': result.current.supports.webrtc.codecs.send.audio matches expected').to.deep.equal(['object', true, true]);
					// Tests result.current.supports.webrtc.codecs.recv.audio
					expect([typeof result.current.supports.webrtc.codecs.recv.audio, !!result.current.supports.webrtc.codecs.recv.audio,
						fnAssertKeysLength(result.current.supports.webrtc.codecs.recv.audio, !result.current.supports.webrtc.connection)],
						itemName + ': result.current.supports.webrtc.codecs.recv.audio matches expected').to.deep.equal(['object', true, true]);
					// Tests result.current.supports.webrtc.codecs.send.video
					expect([typeof result.current.supports.webrtc.codecs.send.video, !!result.current.supports.webrtc.codecs.send.video,
						fnAssertKeysLength(result.current.supports.webrtc.codecs.send.video, !result.current.supports.webrtc.connection)],
						itemName + ': result.current.supports.webrtc.codecs.send.video matches expected').to.deep.equal(['object', true, true]);
					// Tests result.current.supports.webrtc.codecs.recv.video
					expect([typeof result.current.supports.webrtc.codecs.recv.video, !!result.current.supports.webrtc.codecs.recv.video,
						fnAssertKeysLength(result.current.supports.webrtc.codecs.recv.video, !result.current.supports.webrtc.connection)],
						itemName + ': result.current.supports.webrtc.codecs.recv.video matches expected').to.deep.equal(['object', true, true]);
					// Tests result.current.supports.corsRequest
					expect([typeof result.current.supports.corsRequest, result.current.supports.corsRequest],
						itemName + ': result.current.supports.corsRequest matches expected').to.deep.equal(
						['boolean', window.webrtcDetectedBrowser === 'IE' && [8,9].indexOf(window.webrtcDetectedVersion) > -1 ?
						['object', 'function'].indexOf(typeof window.XDomainRequest) > -1 : typeof window.XMLHttpRequest === 'function']);

					var fnTestCodecsItem = function (kind, direction) {
						Temasys.Utils.forEach(result.current.supports.webrtc.codecs[direction][kind], function (codec, codecProp) {
							// Tests codecProp
							expect([typeof codecProp, !!codecProp], itemName + ': result.current.supports.webrtc.codecs.' +
								direction + '.' + kind + '.' + codecProp + ' matches expected for codecProp').to.deep.equal(['string', true]);
							// Tests codec.channels
							expect([typeof codec.channels, codec.channels > 0], itemName + ': result.current.supports.webrtc.codecs.' +
								direction + '.' + kind + '.' + codecProp + ' matches expected for codec.channels').to.deep.equal(['number', true]);
							// Tests codec.clockRate
							expect([typeof codec.clockRate, codec.clockRate > 0], itemName + ': result.current.supports.webrtc.codecs.' +
								direction + '.' + kind + '.' + codecProp + ' matches expected for codec.clockRate').to.deep.equal(['number', true]);
							// Tests codec.sdpFmtpLine
							expect([typeof codec.sdpFmtpLine, !!codec.sdpFmtpLine], itemName + ': result.current.supports.webrtc.codecs.' +
								direction + '.' + kind + '.' + codecProp + ' matches expected for codec.sdpFmtpLine').to.deep.equal(['string', true]);
						});
					};

					fnTestCodecsItem('audio', 'send');
					fnTestCodecsItem('audio', 'recv');
					fnTestCodecsItem('video', 'send');
					fnTestCodecsItem('video', 'recv');

					// Test recommended browsers
					Temasys.Utils.forEach(result.recommended.browers, function (browser, browserProp) {
						// Tests browserProp
						expect([typeof browserProp, !!browserProp], itemName + ': result.current.recommended.browsers.' + browserProp +
							' matches expected for browserProp').to.deep.equal(['string', true]);
						// Tests browser.minVersion
						expect([typeof browser.minVersion, browser.hasOwnProperty('minVersion'), !!browser.minVersion],
							itemName + ': result.current.recommended.browsers.' + browserProp +
							' matches expected for browser.minVersion').to.deep.equal(['string', true, true]);
						// Tests browser.maxVersion
						expect([typeof browser.maxVersion, browser.hasOwnProperty('maxVersion')],
							itemName + ': result.current.recommended.browsers.' + browserProp +
							' matches expected for browser.maxVersion').to.deep.equal([!!browser.maxVersion ? 'string' : 'object', true]);
						// Tests browser.minMobilePlatformVersion
						expect([typeof browser.minMobilePlatformVersion, browser.hasOwnProperty('minMobilePlatformVersion')],
							itemName + ': result.current.recommended.browsers.' + browserProp +
							' matches expected for browser.minMobilePlatformVersion').to.deep.equal([!!browser.minMobilePlatformVersion ? 'string' : 'object', true]);
						// Tests browser.maxMobilePlatformVersion
						expect([typeof browser.maxMobilePlatformVersion, browser.hasOwnProperty('maxMobilePlatformVersion')],
							itemName + ': result.current.recommended.browsers.' + browserProp +
							' matches expected for browser.maxMobilePlatformVersion').to.deep.equal([!!browser.maxMobilePlatformVersion ? 'string' : 'object', true]);
					});

					// Test result.recommended.webrtcPlugin.minVersion
					expect([typeof result.recommended.webrtcPlugin.minVersion, result.recommended.webrtcPlugin.hasOwnProperty('minVersion'),
						!!result.recommended.webrtcPlugin.minVersion], itemName + ': result.current.recommended.webrtcPlugin.minVersion' +
						' matches expected for browserProp').to.deep.equal(['string', true, true]);
					// Test result.recommended.webrtcPlugin.maxVersion
					expect([typeof result.recommended.webrtcPlugin.maxVersion, result.recommended.webrtcPlugin.hasOwnProperty('maxVersion')],
						itemName + ': result.current.recommended.webrtcPlugin.maxVersion' +
						' matches expected for browserProp').to.deep.equal([!!result.recommended.webrtcPlugin.maxVersion ? 'string' : 'object', true]);

					fnProcessNextQueueItem();
				});
			} else {
				window.webrtcDetectedBrowser = window._webrtcDetectedBrowser;
				window.webrtcDetectedVersion = window._webrtcDetectedVersion;
				done();
			}
		};

		fnProcessNextQueueItem();
	});
});