// Mocha specs
var expect = chai.expect;
var assert = chai.assert;
var should = chai.should;
var chaiPromised = function (promise, fn) {
	var resultOutput = null;
	var resultError = null;
	promise.should.be.fulfilled.then(function (output) {
		resultOutput = output;
	}).catch(function (error) {
		resultError = error;
	}).should.notify(function () {
		setTimeout(function () {
			fn(resultError, resultOutput);
		}, 1);
	});
};

// Part of test
var Temasys = {};
var _log = null;
var _globals = this;