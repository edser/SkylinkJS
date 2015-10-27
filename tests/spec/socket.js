//-------------------CONSTRUCTOR-------------------
var successCase = function (options) {

  describe('new Socket(' + printJSON(options) + ')', function () {

    var socket = null;

    it('does not throw an error', function (done) {
      this.timeout(testItemTimeout);

      expect(function () {
        socket = new Socket(options);
      }).to.not.throw(Error);

      done();
    });

    it('returns a new Socket object', function (done) {
      this.timeout(testItemTimeout);

      (typeof socket).should.be.eql('object');

      assert.instanceOf(socket, Socket);

      done();
    });

    it('#_httpsPorts equals the httpsPorts passed in', function (done) {
      this.timeout(testItemTimeout);

      expect(socket._httpsPorts).to.deep.equal(options.httpsPorts);

      done();
    });

    it('#_httpPorts equals the httpPorts passed in', function (done) {
      this.timeout(testItemTimeout);

      expect(socket._httpPorts).to.deep.equal(options.httpPorts);

      done();
    });

    if (options.hasOwnProperty('secure')) {
      it('#secure value is ' + options.secure, function (done) {
        this.timeout(testItemTimeout);

        expect(socket.secure).to.equal(options.secure);

        done();
      });
    } else {
      var requestSecureDefault = (window.location.protocol === 'https:' ? 'true (https)' : 'false (http)');

      it('#secure default value is ' + requestSecureDefault, function (done) {
        this.timeout(testItemTimeout);

        expect(socket.secure).to.equal(window.location.protocol === 'https:');

        done();
      });
    }

    if (options.hasOwnProperty('type')) {
      it('#type value is "' + options.type + '"', function (done) {
        this.timeout(testItemTimeout);

        expect(socket.type).to.equal(options.type);

        done();
      });
    } else {
      it('#type default value is "webSocket"', function (done) {
        this.timeout(testItemTimeout);

        expect(socket.type).to.equal('webSocket');

        done();
      });
    }

    if (options.hasOwnProperty('timeout')) {
      it('#_timeout value is ' + options.timeout, function (done) {
        this.timeout(testItemTimeout);

        expect(socket._timeout).to.equal(options.timeout);

        done();
      });
    } else {
      it('#secure default value is 20000', function (done) {
        this.timeout(testItemTimeout);

        expect(socket._timeout).to.equal(20000);

        done();
      });
    }

  });
};

var failureCase = function (options) {
  describe('new Socket(' + printJSON(options) + ')', function () {

    var socket = null;

    it('does throw an error', function (done) {
      this.timeout(testItemTimeout);

      expect(function () {
        socket = new Socket(options);
      }).to.throw(Error);

      done();
    });

    it('does not return a new Socket object', function (done) {
      this.timeout(testItemTimeout);

      expect(socket).to.equal(null);

      done();
    });

  });
};

/*
// new Socket();
failureCase();

// new Socket({ type: 'webSocket' });
failureCase({ type: 'webSocket' });

// new Socket({ httpPorts: [80, 3000] });
failureCase({ httpPorts: [80, 3000] });

// new Socket({ httpsPorts: [443, 3443] });
failureCase({ httpsPorts: [443, 3443] });

// new Socket({ httpPorts: [443, 3443], httpsPorts: [443, 3443] });
successCase({ httpPorts: [443, 3443], httpsPorts: [443, 3443] });

// new Socket({ httpPorts: [443, 3443], httpsPorts: [443, 3443], type: 'polling' });
successCase({ httpPorts: [443, 3443], httpsPorts: [443, 3443], type: 'polling' });

// new Socket({ httpPorts: [443, 3443], httpsPorts: [443, 3443], type: 'webSocket' });
successCase({ httpPorts: [443, 3443], httpsPorts: [443, 3443], type: 'webSocket' });

// new Socket({ httpPorts: [443, 3443], httpsPorts: [443, 3443], type: 'unknown' });
failureCase({ httpPorts: [443, 3443], httpsPorts: [443, 3443], type: 'unknown' });

// new Socket({ httpPorts: [443, 3443], httpsPorts: [443, 3443], secure: true });
successCase({ httpPorts: [443, 3443], httpsPorts: [443, 3443], secure: true });

// new Socket({ httpPorts: [443, 3443], httpsPorts: [443, 3443], timeout: 2500 })
successCase({ httpPorts: [443, 3443], httpsPorts: [443, 3443], timeout: 2500 });*/

//-------------------CONSTRUCTOR-------------------

//-------------------ATTRIBUTES-------------------
var socket = null;

var options = {
  httpPorts: [80, 3000],
  httpsPorts: [443, 3443]
};

before(function ()  {
  socket = new Socket({});
  done();
});

describe('#ATTRIBUTES', function(){

  describe('#_type', function () {

    it('has a default value of "WebSocket"', function () {
      this.timeout(testItemTimeout);

      assert.typeOf(socket._type, 'string');
      expect(socket._type).to.equal('WebSocket');

    });

  });

  describe('#_readyState', function () {

    it('has a default value of \'constructed\'', function () {
      this.timeout(testItemTimeout);

      assert.typeOf(socket._readyState, 'string');
      expect(socket._readyState).to.equal('constructed');

    });

  });

  describe('#_isSecure', function () {

    it('has a default value of false', function () {
      this.timeout(testItemTimeout);

      assert.typeOf(socket._isSecure, 'boolean');
      expect(socket._isSecure).to.equal(false);

    });

  });

  describe('#_socketTimeout', function () {

    it('has a default value of 20000', function () {
      this.timeout(testItemTimeout);

      assert.typeOf(socket._socketTimeout, 'number');
      expect(socket._socketTimeout).to.equal(20000);

    });

  });

  describe('#_socketMessageQueue', function () {

    it('is an empty array by default', function () {
      this.timeout(testItemTimeout);

      assert.instanceOf(socket._socketMessageQueue, Array);
      expect(socket._socketMessageQueue).to.deep.equal([]);

    });

  });

  describe('#_isXDR', function () {

    it('is typeof "boolean"', function (done) {
      this.timeout(testItemTimeout);

      assert.typeOf(socket._isXDR, 'boolean');

      done();
    });

    it('has a value of false', function () {
      this.timeout(testItemTimeout);

      assert.typeOf(socket._isXDR, 'boolean');
      expect(socket._isXDR).to.equal(false);

    });

  });

  describe('#_objectRef', function () {

    it('has a value of null in the beginning', function (done) {
      this.timeout(testItemTimeout);

      expect(socket._objectRef).to.equal(null);

      done();
    });

  });

});

//-------------------ATTRIBUTES-------------------

//-------------------EVENTS-------------------
socket = null;

var successOptions = {
  httpPorts: [80, 3000],
  httpsPorts: [443, 3443]
};

var failureOptions = {
  httpPorts: [34, 5445],
  httpsPorts: [243, 4443]
};

describe('#EVENTS', function(){

  describe('#on connected', function () {

    it('has the correct payload and readyState equals to \'connected\'', function (done) {
      this.timeout(testItemTimeout);

      socket = new Socket(successOptions);

      socket.once('connected', function (payload) {
        expect(socket.readyState).to.equal('connected');
        expect(payload).to.deep.equal({ socketType: 'webSocket' });
        done();
      });

      socket.connect();
    });

  });

  describe('#on disconnected', function () {

    it('has the correct payload', function (done) {
      this.timeout(testItemTimeout);

      socket.once('disconnected', function (payload) {
        expect(payload).to.deep.equal({ socketType: 'webSocket' });
        done();
      });

      socket.disconnect();
    });

    it('#readyState has a value is "disconnected"', function (done) {
      this.timeout(testItemTimeout);

      expect(socket.readyState).to.equal('disconnected');

      done();

    });
  });

  // No available test scenario to test a solo messaging connection
  describe.skip('#on("message | No available test scenerio"', function () { });

  describe('#on error', function () {

    before(function () {
      socket = new Socket(failureOptions);
      done();
    });

    it('has the correct payload', function (done) {
      this.timeout(testItemTimeout);

      socket.once('error', function (payload) {
        expect(payload).to.have.all.keys({'errorType': 1, 'error': 1});
        assert.typeOf(payload.errorType, 'string');
        assert.instanceOf(payload.error, Error);
      });

      socket.connect();

    });

    /* Beginning of Scenario: When reconnection fails */
    describe('Scenario: When reconnection fails till connection timeout', function () {

      before(function () {
        socket.disconnect();
      });

      it('triggers "error" as many times as failed reconnection attempts', function (done) {
        this.timeout(testItemTimeout);

        socket.once('error', function (payload) {
          expect(payload).to.have.all.keys({'errorType': 1, 'error': 1});
          assert.typeOf(payload.errorType, 'string');
          assert.instanceOf(payload.error, Error);
        });
      });
    });

    it('triggers ', function (done) {
      this.timeout(testItemTimeout);

      socket.once('error', function (payload) {
        expect(payload).to.have.all.keys({'errorType': 1, 'error': 1});
        assert.typeOf(payload.errorType, 'string');
        assert.instanceOf(payload.error, Error);
      });
    });

    /* End of Scenario: When reconnection fails */

  });

});

//-------------------EVENTS-------------------

//-------------------METHODS-------------------
socket = null;

before(function (done)  {
  socket = new Socket({});

  done();
});

describe('#METHODS', function(){

  /* Beginning of #connect() */
  describe('#connect()', function () {

    it('is typeof "function"', function (done) {
      this.timeout(testItemTimeout);

      assert.typeOf(socket.connect, 'function');

      done();
    });

    it('triggers "connected" event', function (done) {
      this.timeout(testItemTimeout);

      socket.once('connected', function () {
        done();
      });
    });

    it('#readyState has a value of "connected"', function (done) {
      this.timeout(testItemTimeout);

      expect(socket.readyState).to.equal('connected');

      done();
    });

    it('#_objectRef is typeof "object"', function (done) {
      this.timeout(testItemTimeout);

      (typeof socket._objectRef).should.be.eql('object');

      done();
    });

  });
  /* End of #connect() */

  /* Beginning of #message() */
  describe('#message()', function () {

    it('is typeof "function"', function (done) {
      this.timeout(testItemTimeout);

      assert.typeOf(socket.message, 'function');

      done();
    });

  });
  /* End of #message() */

  /* Beginning of #disconnect() */
  describe('#disconnect()', function () {

    it('is typeof "function"', function (done) {
      this.timeout(testItemTimeout);

      assert.typeOf(socket.disconnect, 'function');

      done();
    });

    it('triggers "disconnected" event', function (done) {
      this.timeout(testItemTimeout);

      audioTrack.once('disconnected', function () {
        done();
      });
    });

    it('#readyState has a value of "disconnected"', function (done) {
      this.timeout(testItemTimeout);

      expect(socket.readyState).to.equal('disconnected');

      done();
    });

  });
  /* End of #disconnect() */

});
//-------------------METHODS-------------------
