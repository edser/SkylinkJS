// Mocha specs
var expect = chai.expect;
var assert = chai.assert;
var should = chai.should;
// Part of test
var Temasys = {};
var _log = null;

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
		it('createEventManager()', function () {
			manager = Temasys.Utils.createEventManager();
			assert.typeOf(manager.on, 'function', 'typeof on()');
			assert.typeOf(manager.once, 'function', 'typeof once()');
			assert.typeOf(manager.off, 'function', 'typeof off()');
			assert.typeOf(manager.emit, 'function', 'typeof emit()');
			assert.typeOf(manager.catch, 'function', 'typeof catch()');
		});

		// Ensure that `.on()` is functioning correctly
		it('createEventManager() -> .on()', function (done) {
			manager.on('test', function () {
				assert.isOk('on() is triggered.');
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
			var fn = function () {
				var args1 = Array.prototype.slice.call(arguments);
				var expectArgs = args1.concat([]);
				expectArgs.shift();
				manager.on(args1[0], function () {
					var args2 = Array.prototype.slice.call(arguments)
					expect(expectArgs, 'Arguments matches for (' + args1.join(',') + ')').to.deep.equal(args2);
				});
				manager.emit.apply(args1);
			};

			fn('test', true, 1, null);
			fn('test2', { x: 1, y: 2 }, 'test123213', -123123);
			fn('test3', { x: 1, y: 2 }, ['ok',1,2]);

			done();
		});

		// Ensure that `.catch()` is functioning correctly
		it('createEventManager() -> .catch()', function (done) {
			manager.catch(function (error) {
				assert.instanceOf(error, Error, 'Error object is returned.');
				assert.isDefined(error.message, 'Error object has message.');
			});

			expect(function () {
				manager.once('test', function () {
					throw new Error('test');
				});
				manager.emit('test');
			}, 'Error should be caught.').to.not.throw(Error);

			manager.catch(null);

			expect(function () {
				manager.once('test', function () {
					throw new Error('test');
				});
				manager.emit('test');
			}, 'Error should not be caught.').to.throw(Error);

			done();
		});
	})();

});