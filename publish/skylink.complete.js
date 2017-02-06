/*! skylinkjs - v0.6.17 - Sun Feb 05 2017 14:45:33 GMT+0800 (SGT) */
(function (globals) {
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.io = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){

/**
 * Module dependencies.
 */

var url = _dereq_('./url');
var parser = _dereq_('socket.io-parser');
var Manager = _dereq_('./manager');
var debug = _dereq_('debug')('socket.io-client');

/**
 * Module exports.
 */

module.exports = exports = lookup;

/**
 * Managers cache.
 */

var cache = exports.managers = {};

/**
 * Looks up an existing `Manager` for multiplexing.
 * If the user summons:
 *
 *   `io('http://localhost/a');`
 *   `io('http://localhost/b');`
 *
 * We reuse the existing instance based on same scheme/port/host,
 * and we initialize sockets for each namespace.
 *
 * @api public
 */

function lookup(uri, opts) {
  if (typeof uri == 'object') {
    opts = uri;
    uri = undefined;
  }

  opts = opts || {};

  var parsed = url(uri);
  var source = parsed.source;
  var id = parsed.id;
  var path = parsed.path;
  var sameNamespace = cache[id] && path in cache[id].nsps;
  var newConnection = opts.forceNew || opts['force new connection'] ||
                      false === opts.multiplex || sameNamespace;

  var io;

  if (newConnection) {
    debug('ignoring socket cache for %s', source);
    io = Manager(source, opts);
  } else {
    if (!cache[id]) {
      debug('new io instance for %s', source);
      cache[id] = Manager(source, opts);
    }
    io = cache[id];
  }

  return io.socket(parsed.path);
}

/**
 * Protocol version.
 *
 * @api public
 */

exports.protocol = parser.protocol;

/**
 * `connect`.
 *
 * @param {String} uri
 * @api public
 */

exports.connect = lookup;

/**
 * Expose constructors for standalone build.
 *
 * @api public
 */

exports.Manager = _dereq_('./manager');
exports.Socket = _dereq_('./socket');

},{"./manager":2,"./socket":4,"./url":5,"debug":14,"socket.io-parser":40}],2:[function(_dereq_,module,exports){

/**
 * Module dependencies.
 */

var eio = _dereq_('engine.io-client');
var Socket = _dereq_('./socket');
var Emitter = _dereq_('component-emitter');
var parser = _dereq_('socket.io-parser');
var on = _dereq_('./on');
var bind = _dereq_('component-bind');
var debug = _dereq_('debug')('socket.io-client:manager');
var indexOf = _dereq_('indexof');
var Backoff = _dereq_('backo2');

/**
 * IE6+ hasOwnProperty
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Module exports
 */

module.exports = Manager;

/**
 * `Manager` constructor.
 *
 * @param {String} engine instance or engine uri/opts
 * @param {Object} options
 * @api public
 */

function Manager(uri, opts){
  if (!(this instanceof Manager)) return new Manager(uri, opts);
  if (uri && ('object' == typeof uri)) {
    opts = uri;
    uri = undefined;
  }
  opts = opts || {};

  opts.path = opts.path || '/socket.io';
  this.nsps = {};
  this.subs = [];
  this.opts = opts;
  this.reconnection(opts.reconnection !== false);
  this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
  this.reconnectionDelay(opts.reconnectionDelay || 1000);
  this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
  this.randomizationFactor(opts.randomizationFactor || 0.5);
  this.backoff = new Backoff({
    min: this.reconnectionDelay(),
    max: this.reconnectionDelayMax(),
    jitter: this.randomizationFactor()
  });
  this.timeout(null == opts.timeout ? 20000 : opts.timeout);
  this.readyState = 'closed';
  this.uri = uri;
  this.connecting = [];
  this.lastPing = null;
  this.encoding = false;
  this.packetBuffer = [];
  this.encoder = new parser.Encoder();
  this.decoder = new parser.Decoder();
  this.autoConnect = opts.autoConnect !== false;
  if (this.autoConnect) this.open();
}

/**
 * Propagate given event to sockets and emit on `this`
 *
 * @api private
 */

Manager.prototype.emitAll = function() {
  this.emit.apply(this, arguments);
  for (var nsp in this.nsps) {
    if (has.call(this.nsps, nsp)) {
      this.nsps[nsp].emit.apply(this.nsps[nsp], arguments);
    }
  }
};

/**
 * Update `socket.id` of all sockets
 *
 * @api private
 */

Manager.prototype.updateSocketIds = function(){
  for (var nsp in this.nsps) {
    if (has.call(this.nsps, nsp)) {
      this.nsps[nsp].id = this.engine.id;
    }
  }
};

/**
 * Mix in `Emitter`.
 */

Emitter(Manager.prototype);

/**
 * Sets the `reconnection` config.
 *
 * @param {Boolean} true/false if it should automatically reconnect
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnection = function(v){
  if (!arguments.length) return this._reconnection;
  this._reconnection = !!v;
  return this;
};

/**
 * Sets the reconnection attempts config.
 *
 * @param {Number} max reconnection attempts before giving up
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnectionAttempts = function(v){
  if (!arguments.length) return this._reconnectionAttempts;
  this._reconnectionAttempts = v;
  return this;
};

/**
 * Sets the delay between reconnections.
 *
 * @param {Number} delay
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnectionDelay = function(v){
  if (!arguments.length) return this._reconnectionDelay;
  this._reconnectionDelay = v;
  this.backoff && this.backoff.setMin(v);
  return this;
};

Manager.prototype.randomizationFactor = function(v){
  if (!arguments.length) return this._randomizationFactor;
  this._randomizationFactor = v;
  this.backoff && this.backoff.setJitter(v);
  return this;
};

/**
 * Sets the maximum delay between reconnections.
 *
 * @param {Number} delay
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnectionDelayMax = function(v){
  if (!arguments.length) return this._reconnectionDelayMax;
  this._reconnectionDelayMax = v;
  this.backoff && this.backoff.setMax(v);
  return this;
};

/**
 * Sets the connection timeout. `false` to disable
 *
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.timeout = function(v){
  if (!arguments.length) return this._timeout;
  this._timeout = v;
  return this;
};

/**
 * Starts trying to reconnect if reconnection is enabled and we have not
 * started reconnecting yet
 *
 * @api private
 */

Manager.prototype.maybeReconnectOnOpen = function() {
  // Only try to reconnect if it's the first time we're connecting
  if (!this.reconnecting && this._reconnection && this.backoff.attempts === 0) {
    // keeps reconnection from firing twice for the same reconnection loop
    this.reconnect();
  }
};


/**
 * Sets the current transport `socket`.
 *
 * @param {Function} optional, callback
 * @return {Manager} self
 * @api public
 */

Manager.prototype.open =
Manager.prototype.connect = function(fn){
  debug('readyState %s', this.readyState);
  if (~this.readyState.indexOf('open')) return this;

  debug('opening %s', this.uri);
  this.engine = eio(this.uri, this.opts);
  var socket = this.engine;
  var self = this;
  this.readyState = 'opening';
  this.skipReconnect = false;

  // emit `open`
  var openSub = on(socket, 'open', function() {
    self.onopen();
    fn && fn();
  });

  // emit `connect_error`
  var errorSub = on(socket, 'error', function(data){
    debug('connect_error');
    self.cleanup();
    self.readyState = 'closed';
    self.emitAll('connect_error', data);
    if (fn) {
      var err = new Error('Connection error');
      err.data = data;
      fn(err);
    } else {
      // Only do this if there is no fn to handle the error
      self.maybeReconnectOnOpen();
    }
  });

  // emit `connect_timeout`
  if (false !== this._timeout) {
    var timeout = this._timeout;
    debug('connect attempt will timeout after %d', timeout);

    // set timer
    var timer = setTimeout(function(){
      debug('connect attempt timed out after %d', timeout);
      openSub.destroy();
      socket.close();
      socket.emit('error', 'timeout');
      self.emitAll('connect_timeout', timeout);
    }, timeout);

    this.subs.push({
      destroy: function(){
        clearTimeout(timer);
      }
    });
  }

  this.subs.push(openSub);
  this.subs.push(errorSub);

  return this;
};

/**
 * Called upon transport open.
 *
 * @api private
 */

Manager.prototype.onopen = function(){
  debug('open');

  // clear old subs
  this.cleanup();

  // mark as open
  this.readyState = 'open';
  this.emit('open');

  // add new subs
  var socket = this.engine;
  this.subs.push(on(socket, 'data', bind(this, 'ondata')));
  this.subs.push(on(socket, 'ping', bind(this, 'onping')));
  this.subs.push(on(socket, 'pong', bind(this, 'onpong')));
  this.subs.push(on(socket, 'error', bind(this, 'onerror')));
  this.subs.push(on(socket, 'close', bind(this, 'onclose')));
  this.subs.push(on(this.decoder, 'decoded', bind(this, 'ondecoded')));
};

/**
 * Called upon a ping.
 *
 * @api private
 */

Manager.prototype.onping = function(){
  this.lastPing = new Date;
  this.emitAll('ping');
};

/**
 * Called upon a packet.
 *
 * @api private
 */

Manager.prototype.onpong = function(){
  this.emitAll('pong', new Date - this.lastPing);
};

/**
 * Called with data.
 *
 * @api private
 */

Manager.prototype.ondata = function(data){
  this.decoder.add(data);
};

/**
 * Called when parser fully decodes a packet.
 *
 * @api private
 */

Manager.prototype.ondecoded = function(packet) {
  this.emit('packet', packet);
};

/**
 * Called upon socket error.
 *
 * @api private
 */

Manager.prototype.onerror = function(err){
  debug('error', err);
  this.emitAll('error', err);
};

/**
 * Creates a new socket for the given `nsp`.
 *
 * @return {Socket}
 * @api public
 */

Manager.prototype.socket = function(nsp){
  var socket = this.nsps[nsp];
  if (!socket) {
    socket = new Socket(this, nsp);
    this.nsps[nsp] = socket;
    var self = this;
    socket.on('connecting', onConnecting);
    socket.on('connect', function(){
      socket.id = self.engine.id;
    });

    if (this.autoConnect) {
      // manually call here since connecting evnet is fired before listening
      onConnecting();
    }
  }

  function onConnecting() {
    if (!~indexOf(self.connecting, socket)) {
      self.connecting.push(socket);
    }
  }

  return socket;
};

/**
 * Called upon a socket close.
 *
 * @param {Socket} socket
 */

Manager.prototype.destroy = function(socket){
  var index = indexOf(this.connecting, socket);
  if (~index) this.connecting.splice(index, 1);
  if (this.connecting.length) return;

  this.close();
};

/**
 * Writes a packet.
 *
 * @param {Object} packet
 * @api private
 */

Manager.prototype.packet = function(packet){
  debug('writing packet %j', packet);
  var self = this;

  if (!self.encoding) {
    // encode, then write to engine with result
    self.encoding = true;
    this.encoder.encode(packet, function(encodedPackets) {
      for (var i = 0; i < encodedPackets.length; i++) {
        self.engine.write(encodedPackets[i], packet.options);
      }
      self.encoding = false;
      self.processPacketQueue();
    });
  } else { // add packet to the queue
    self.packetBuffer.push(packet);
  }
};

/**
 * If packet buffer is non-empty, begins encoding the
 * next packet in line.
 *
 * @api private
 */

Manager.prototype.processPacketQueue = function() {
  if (this.packetBuffer.length > 0 && !this.encoding) {
    var pack = this.packetBuffer.shift();
    this.packet(pack);
  }
};

/**
 * Clean up transport subscriptions and packet buffer.
 *
 * @api private
 */

Manager.prototype.cleanup = function(){
  debug('cleanup');

  var sub;
  while (sub = this.subs.shift()) sub.destroy();

  this.packetBuffer = [];
  this.encoding = false;
  this.lastPing = null;

  this.decoder.destroy();
};

/**
 * Close the current socket.
 *
 * @api private
 */

Manager.prototype.close =
Manager.prototype.disconnect = function(){
  debug('disconnect');
  this.skipReconnect = true;
  this.reconnecting = false;
  if ('opening' == this.readyState) {
    // `onclose` will not fire because
    // an open event never happened
    this.cleanup();
  }
  this.backoff.reset();
  this.readyState = 'closed';
  if (this.engine) this.engine.close();
};

/**
 * Called upon engine close.
 *
 * @api private
 */

Manager.prototype.onclose = function(reason){
  debug('onclose');

  this.cleanup();
  this.backoff.reset();
  this.readyState = 'closed';
  this.emit('close', reason);

  if (this._reconnection && !this.skipReconnect) {
    this.reconnect();
  }
};

/**
 * Attempt a reconnection.
 *
 * @api private
 */

Manager.prototype.reconnect = function(){
  if (this.reconnecting || this.skipReconnect) return this;

  var self = this;

  if (this.backoff.attempts >= this._reconnectionAttempts) {
    debug('reconnect failed');
    this.backoff.reset();
    this.emitAll('reconnect_failed');
    this.reconnecting = false;
  } else {
    var delay = this.backoff.duration();
    debug('will wait %dms before reconnect attempt', delay);

    this.reconnecting = true;
    var timer = setTimeout(function(){
      if (self.skipReconnect) return;

      debug('attempting reconnect');
      self.emitAll('reconnect_attempt', self.backoff.attempts);
      self.emitAll('reconnecting', self.backoff.attempts);

      // check again for the case socket closed in above events
      if (self.skipReconnect) return;

      self.open(function(err){
        if (err) {
          debug('reconnect attempt error');
          self.reconnecting = false;
          self.reconnect();
          self.emitAll('reconnect_error', err.data);
        } else {
          debug('reconnect success');
          self.onreconnect();
        }
      });
    }, delay);

    this.subs.push({
      destroy: function(){
        clearTimeout(timer);
      }
    });
  }
};

/**
 * Called upon successful reconnect.
 *
 * @api private
 */

Manager.prototype.onreconnect = function(){
  var attempt = this.backoff.attempts;
  this.reconnecting = false;
  this.backoff.reset();
  this.updateSocketIds();
  this.emitAll('reconnect', attempt);
};

},{"./on":3,"./socket":4,"backo2":8,"component-bind":11,"component-emitter":12,"debug":14,"engine.io-client":16,"indexof":32,"socket.io-parser":40}],3:[function(_dereq_,module,exports){

/**
 * Module exports.
 */

module.exports = on;

/**
 * Helper for subscriptions.
 *
 * @param {Object|EventEmitter} obj with `Emitter` mixin or `EventEmitter`
 * @param {String} event name
 * @param {Function} callback
 * @api public
 */

function on(obj, ev, fn) {
  obj.on(ev, fn);
  return {
    destroy: function(){
      obj.removeListener(ev, fn);
    }
  };
}

},{}],4:[function(_dereq_,module,exports){

/**
 * Module dependencies.
 */

var parser = _dereq_('socket.io-parser');
var Emitter = _dereq_('component-emitter');
var toArray = _dereq_('to-array');
var on = _dereq_('./on');
var bind = _dereq_('component-bind');
var debug = _dereq_('debug')('socket.io-client:socket');
var hasBin = _dereq_('has-binary');

/**
 * Module exports.
 */

module.exports = exports = Socket;

/**
 * Internal events (blacklisted).
 * These events can't be emitted by the user.
 *
 * @api private
 */

var events = {
  connect: 1,
  connect_error: 1,
  connect_timeout: 1,
  connecting: 1,
  disconnect: 1,
  error: 1,
  reconnect: 1,
  reconnect_attempt: 1,
  reconnect_failed: 1,
  reconnect_error: 1,
  reconnecting: 1,
  ping: 1,
  pong: 1
};

/**
 * Shortcut to `Emitter#emit`.
 */

var emit = Emitter.prototype.emit;

/**
 * `Socket` constructor.
 *
 * @api public
 */

function Socket(io, nsp){
  this.io = io;
  this.nsp = nsp;
  this.json = this; // compat
  this.ids = 0;
  this.acks = {};
  this.receiveBuffer = [];
  this.sendBuffer = [];
  this.connected = false;
  this.disconnected = true;
  if (this.io.autoConnect) this.open();
}

/**
 * Mix in `Emitter`.
 */

Emitter(Socket.prototype);

/**
 * Subscribe to open, close and packet events
 *
 * @api private
 */

Socket.prototype.subEvents = function() {
  if (this.subs) return;

  var io = this.io;
  this.subs = [
    on(io, 'open', bind(this, 'onopen')),
    on(io, 'packet', bind(this, 'onpacket')),
    on(io, 'close', bind(this, 'onclose'))
  ];
};

/**
 * "Opens" the socket.
 *
 * @api public
 */

Socket.prototype.open =
Socket.prototype.connect = function(){
  if (this.connected) return this;

  this.subEvents();
  this.io.open(); // ensure open
  if ('open' == this.io.readyState) this.onopen();
  this.emit('connecting');
  return this;
};

/**
 * Sends a `message` event.
 *
 * @return {Socket} self
 * @api public
 */

Socket.prototype.send = function(){
  var args = toArray(arguments);
  args.unshift('message');
  this.emit.apply(this, args);
  return this;
};

/**
 * Override `emit`.
 * If the event is in `events`, it's emitted normally.
 *
 * @param {String} event name
 * @return {Socket} self
 * @api public
 */

Socket.prototype.emit = function(ev){
  if (events.hasOwnProperty(ev)) {
    emit.apply(this, arguments);
    return this;
  }

  var args = toArray(arguments);
  var parserType = parser.EVENT; // default
  if (hasBin(args)) { parserType = parser.BINARY_EVENT; } // binary
  var packet = { type: parserType, data: args };

  packet.options = {};
  packet.options.compress = !this.flags || false !== this.flags.compress;

  // event ack callback
  if ('function' == typeof args[args.length - 1]) {
    debug('emitting packet with ack id %d', this.ids);
    this.acks[this.ids] = args.pop();
    packet.id = this.ids++;
  }

  if (this.connected) {
    this.packet(packet);
  } else {
    this.sendBuffer.push(packet);
  }

  delete this.flags;

  return this;
};

/**
 * Sends a packet.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.packet = function(packet){
  packet.nsp = this.nsp;
  this.io.packet(packet);
};

/**
 * Called upon engine `open`.
 *
 * @api private
 */

Socket.prototype.onopen = function(){
  debug('transport is open - connecting');

  // write connect packet if necessary
  if ('/' != this.nsp) {
    this.packet({ type: parser.CONNECT });
  }
};

/**
 * Called upon engine `close`.
 *
 * @param {String} reason
 * @api private
 */

Socket.prototype.onclose = function(reason){
  debug('close (%s)', reason);
  this.connected = false;
  this.disconnected = true;
  delete this.id;
  this.emit('disconnect', reason);
};

/**
 * Called with socket packet.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.onpacket = function(packet){
  if (packet.nsp != this.nsp) return;

  switch (packet.type) {
    case parser.CONNECT:
      this.onconnect();
      break;

    case parser.EVENT:
      this.onevent(packet);
      break;

    case parser.BINARY_EVENT:
      this.onevent(packet);
      break;

    case parser.ACK:
      this.onack(packet);
      break;

    case parser.BINARY_ACK:
      this.onack(packet);
      break;

    case parser.DISCONNECT:
      this.ondisconnect();
      break;

    case parser.ERROR:
      this.emit('error', packet.data);
      break;
  }
};

/**
 * Called upon a server event.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.onevent = function(packet){
  var args = packet.data || [];
  debug('emitting event %j', args);

  if (null != packet.id) {
    debug('attaching ack callback to event');
    args.push(this.ack(packet.id));
  }

  if (this.connected) {
    emit.apply(this, args);
  } else {
    this.receiveBuffer.push(args);
  }
};

/**
 * Produces an ack callback to emit with an event.
 *
 * @api private
 */

Socket.prototype.ack = function(id){
  var self = this;
  var sent = false;
  return function(){
    // prevent double callbacks
    if (sent) return;
    sent = true;
    var args = toArray(arguments);
    debug('sending ack %j', args);

    var type = hasBin(args) ? parser.BINARY_ACK : parser.ACK;
    self.packet({
      type: type,
      id: id,
      data: args
    });
  };
};

/**
 * Called upon a server acknowlegement.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.onack = function(packet){
  var ack = this.acks[packet.id];
  if ('function' == typeof ack) {
    debug('calling ack %s with %j', packet.id, packet.data);
    ack.apply(this, packet.data);
    delete this.acks[packet.id];
  } else {
    debug('bad ack %s', packet.id);
  }
};

/**
 * Called upon server connect.
 *
 * @api private
 */

Socket.prototype.onconnect = function(){
  this.connected = true;
  this.disconnected = false;
  this.emit('connect');
  this.emitBuffered();
};

/**
 * Emit buffered events (received and emitted).
 *
 * @api private
 */

Socket.prototype.emitBuffered = function(){
  var i;
  for (i = 0; i < this.receiveBuffer.length; i++) {
    emit.apply(this, this.receiveBuffer[i]);
  }
  this.receiveBuffer = [];

  for (i = 0; i < this.sendBuffer.length; i++) {
    this.packet(this.sendBuffer[i]);
  }
  this.sendBuffer = [];
};

/**
 * Called upon server disconnect.
 *
 * @api private
 */

Socket.prototype.ondisconnect = function(){
  debug('server disconnect (%s)', this.nsp);
  this.destroy();
  this.onclose('io server disconnect');
};

/**
 * Called upon forced client/server side disconnections,
 * this method ensures the manager stops tracking us and
 * that reconnections don't get triggered for this.
 *
 * @api private.
 */

Socket.prototype.destroy = function(){
  if (this.subs) {
    // clean subscriptions to avoid reconnections
    for (var i = 0; i < this.subs.length; i++) {
      this.subs[i].destroy();
    }
    this.subs = null;
  }

  this.io.destroy(this);
};

/**
 * Disconnects the socket manually.
 *
 * @return {Socket} self
 * @api public
 */

Socket.prototype.close =
Socket.prototype.disconnect = function(){
  if (this.connected) {
    debug('performing disconnect (%s)', this.nsp);
    this.packet({ type: parser.DISCONNECT });
  }

  // remove socket from pool
  this.destroy();

  if (this.connected) {
    // fire events
    this.onclose('io client disconnect');
  }
  return this;
};

/**
 * Sets the compress flag.
 *
 * @param {Boolean} if `true`, compresses the sending data
 * @return {Socket} self
 * @api public
 */

Socket.prototype.compress = function(compress){
  this.flags = this.flags || {};
  this.flags.compress = compress;
  return this;
};

},{"./on":3,"component-bind":11,"component-emitter":12,"debug":14,"has-binary":30,"socket.io-parser":40,"to-array":43}],5:[function(_dereq_,module,exports){
(function (global){

/**
 * Module dependencies.
 */

var parseuri = _dereq_('parseuri');
var debug = _dereq_('debug')('socket.io-client:url');

/**
 * Module exports.
 */

module.exports = url;

/**
 * URL parser.
 *
 * @param {String} url
 * @param {Object} An object meant to mimic window.location.
 *                 Defaults to window.location.
 * @api public
 */

function url(uri, loc){
  var obj = uri;

  // default to window.location
  var loc = loc || global.location;
  if (null == uri) uri = loc.protocol + '//' + loc.host;

  // relative path support
  if ('string' == typeof uri) {
    if ('/' == uri.charAt(0)) {
      if ('/' == uri.charAt(1)) {
        uri = loc.protocol + uri;
      } else {
        uri = loc.host + uri;
      }
    }

    if (!/^(https?|wss?):\/\//.test(uri)) {
      debug('protocol-less url %s', uri);
      if ('undefined' != typeof loc) {
        uri = loc.protocol + '//' + uri;
      } else {
        uri = 'https://' + uri;
      }
    }

    // parse
    debug('parse %s', uri);
    obj = parseuri(uri);
  }

  // make sure we treat `localhost:80` and `localhost` equally
  if (!obj.port) {
    if (/^(http|ws)$/.test(obj.protocol)) {
      obj.port = '80';
    }
    else if (/^(http|ws)s$/.test(obj.protocol)) {
      obj.port = '443';
    }
  }

  obj.path = obj.path || '/';

  var ipv6 = obj.host.indexOf(':') !== -1;
  var host = ipv6 ? '[' + obj.host + ']' : obj.host;

  // define unique id
  obj.id = obj.protocol + '://' + host + ':' + obj.port;
  // define href
  obj.href = obj.protocol + '://' + host + (loc && loc.port == obj.port ? '' : (':' + obj.port));

  return obj;
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{"debug":14,"parseuri":38}],6:[function(_dereq_,module,exports){
module.exports = after

function after(count, callback, err_cb) {
    var bail = false
    err_cb = err_cb || noop
    proxy.count = count

    return (count === 0) ? callback() : proxy

    function proxy(err, result) {
        if (proxy.count <= 0) {
            throw new Error('after called too many times')
        }
        --proxy.count

        // after first error, rest are passed to err_cb
        if (err) {
            bail = true
            callback(err)
            // future error callbacks will go to error handler
            callback = err_cb
        } else if (proxy.count === 0 && !bail) {
            callback(null, result)
        }
    }
}

function noop() {}

},{}],7:[function(_dereq_,module,exports){
/**
 * An abstraction for slicing an arraybuffer even when
 * ArrayBuffer.prototype.slice is not supported
 *
 * @api public
 */

module.exports = function(arraybuffer, start, end) {
  var bytes = arraybuffer.byteLength;
  start = start || 0;
  end = end || bytes;

  if (arraybuffer.slice) { return arraybuffer.slice(start, end); }

  if (start < 0) { start += bytes; }
  if (end < 0) { end += bytes; }
  if (end > bytes) { end = bytes; }

  if (start >= bytes || start >= end || bytes === 0) {
    return new ArrayBuffer(0);
  }

  var abv = new Uint8Array(arraybuffer);
  var result = new Uint8Array(end - start);
  for (var i = start, ii = 0; i < end; i++, ii++) {
    result[ii] = abv[i];
  }
  return result.buffer;
};

},{}],8:[function(_dereq_,module,exports){

/**
 * Expose `Backoff`.
 */

module.exports = Backoff;

/**
 * Initialize backoff timer with `opts`.
 *
 * - `min` initial timeout in milliseconds [100]
 * - `max` max timeout [10000]
 * - `jitter` [0]
 * - `factor` [2]
 *
 * @param {Object} opts
 * @api public
 */

function Backoff(opts) {
  opts = opts || {};
  this.ms = opts.min || 100;
  this.max = opts.max || 10000;
  this.factor = opts.factor || 2;
  this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
  this.attempts = 0;
}

/**
 * Return the backoff duration.
 *
 * @return {Number}
 * @api public
 */

Backoff.prototype.duration = function(){
  var ms = this.ms * Math.pow(this.factor, this.attempts++);
  if (this.jitter) {
    var rand =  Math.random();
    var deviation = Math.floor(rand * this.jitter * ms);
    ms = (Math.floor(rand * 10) & 1) == 0  ? ms - deviation : ms + deviation;
  }
  return Math.min(ms, this.max) | 0;
};

/**
 * Reset the number of attempts.
 *
 * @api public
 */

Backoff.prototype.reset = function(){
  this.attempts = 0;
};

/**
 * Set the minimum duration
 *
 * @api public
 */

Backoff.prototype.setMin = function(min){
  this.ms = min;
};

/**
 * Set the maximum duration
 *
 * @api public
 */

Backoff.prototype.setMax = function(max){
  this.max = max;
};

/**
 * Set the jitter
 *
 * @api public
 */

Backoff.prototype.setJitter = function(jitter){
  this.jitter = jitter;
};


},{}],9:[function(_dereq_,module,exports){
/*
 * base64-arraybuffer
 * https://github.com/niklasvh/base64-arraybuffer
 *
 * Copyright (c) 2012 Niklas von Hertzen
 * Licensed under the MIT license.
 */
(function(){
  "use strict";

  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  // Use a lookup table to find the index.
  var lookup = new Uint8Array(256);
  for (var i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  exports.encode = function(arraybuffer) {
    var bytes = new Uint8Array(arraybuffer),
    i, len = bytes.length, base64 = "";

    for (i = 0; i < len; i+=3) {
      base64 += chars[bytes[i] >> 2];
      base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
      base64 += chars[bytes[i + 2] & 63];
    }

    if ((len % 3) === 2) {
      base64 = base64.substring(0, base64.length - 1) + "=";
    } else if (len % 3 === 1) {
      base64 = base64.substring(0, base64.length - 2) + "==";
    }

    return base64;
  };

  exports.decode =  function(base64) {
    var bufferLength = base64.length * 0.75,
    len = base64.length, i, p = 0,
    encoded1, encoded2, encoded3, encoded4;

    if (base64[base64.length - 1] === "=") {
      bufferLength--;
      if (base64[base64.length - 2] === "=") {
        bufferLength--;
      }
    }

    var arraybuffer = new ArrayBuffer(bufferLength),
    bytes = new Uint8Array(arraybuffer);

    for (i = 0; i < len; i+=4) {
      encoded1 = lookup[base64.charCodeAt(i)];
      encoded2 = lookup[base64.charCodeAt(i+1)];
      encoded3 = lookup[base64.charCodeAt(i+2)];
      encoded4 = lookup[base64.charCodeAt(i+3)];

      bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return arraybuffer;
  };
})();

},{}],10:[function(_dereq_,module,exports){
(function (global){
/**
 * Create a blob builder even when vendor prefixes exist
 */

var BlobBuilder = global.BlobBuilder
  || global.WebKitBlobBuilder
  || global.MSBlobBuilder
  || global.MozBlobBuilder;

/**
 * Check if Blob constructor is supported
 */

var blobSupported = (function() {
  try {
    var a = new Blob(['hi']);
    return a.size === 2;
  } catch(e) {
    return false;
  }
})();

/**
 * Check if Blob constructor supports ArrayBufferViews
 * Fails in Safari 6, so we need to map to ArrayBuffers there.
 */

var blobSupportsArrayBufferView = blobSupported && (function() {
  try {
    var b = new Blob([new Uint8Array([1,2])]);
    return b.size === 2;
  } catch(e) {
    return false;
  }
})();

/**
 * Check if BlobBuilder is supported
 */

var blobBuilderSupported = BlobBuilder
  && BlobBuilder.prototype.append
  && BlobBuilder.prototype.getBlob;

/**
 * Helper function that maps ArrayBufferViews to ArrayBuffers
 * Used by BlobBuilder constructor and old browsers that didn't
 * support it in the Blob constructor.
 */

function mapArrayBufferViews(ary) {
  for (var i = 0; i < ary.length; i++) {
    var chunk = ary[i];
    if (chunk.buffer instanceof ArrayBuffer) {
      var buf = chunk.buffer;

      // if this is a subarray, make a copy so we only
      // include the subarray region from the underlying buffer
      if (chunk.byteLength !== buf.byteLength) {
        var copy = new Uint8Array(chunk.byteLength);
        copy.set(new Uint8Array(buf, chunk.byteOffset, chunk.byteLength));
        buf = copy.buffer;
      }

      ary[i] = buf;
    }
  }
}

function BlobBuilderConstructor(ary, options) {
  options = options || {};

  var bb = new BlobBuilder();
  mapArrayBufferViews(ary);

  for (var i = 0; i < ary.length; i++) {
    bb.append(ary[i]);
  }

  return (options.type) ? bb.getBlob(options.type) : bb.getBlob();
};

function BlobConstructor(ary, options) {
  mapArrayBufferViews(ary);
  return new Blob(ary, options || {});
};

module.exports = (function() {
  if (blobSupported) {
    return blobSupportsArrayBufferView ? global.Blob : BlobConstructor;
  } else if (blobBuilderSupported) {
    return BlobBuilderConstructor;
  } else {
    return undefined;
  }
})();

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{}],11:[function(_dereq_,module,exports){
/**
 * Slice reference.
 */

var slice = [].slice;

/**
 * Bind `obj` to `fn`.
 *
 * @param {Object} obj
 * @param {Function|String} fn or string
 * @return {Function}
 * @api public
 */

module.exports = function(obj, fn){
  if ('string' == typeof fn) fn = obj[fn];
  if ('function' != typeof fn) throw new Error('bind() requires a function');
  var args = slice.call(arguments, 2);
  return function(){
    return fn.apply(obj, args.concat(slice.call(arguments)));
  }
};

},{}],12:[function(_dereq_,module,exports){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks['$' + event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],13:[function(_dereq_,module,exports){

module.exports = function(a, b){
  var fn = function(){};
  fn.prototype = b.prototype;
  a.prototype = new fn;
  a.prototype.constructor = a;
};
},{}],14:[function(_dereq_,module,exports){

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = _dereq_('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  return ('WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args;

  var c = 'color: ' + this.color;
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage(){
  try {
    return window.localStorage;
  } catch (e) {}
}

},{"./debug":15}],15:[function(_dereq_,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = _dereq_('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = Array.prototype.slice.call(arguments);

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    if ('function' === typeof exports.formatArgs) {
      args = exports.formatArgs.apply(self, args);
    }
    var logFn = enabled.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":35}],16:[function(_dereq_,module,exports){

module.exports =  _dereq_('./lib/');

},{"./lib/":17}],17:[function(_dereq_,module,exports){

module.exports = _dereq_('./socket');

/**
 * Exports parser
 *
 * @api public
 *
 */
module.exports.parser = _dereq_('engine.io-parser');

},{"./socket":18,"engine.io-parser":27}],18:[function(_dereq_,module,exports){
(function (global){
/**
 * Module dependencies.
 */

var transports = _dereq_('./transports');
var Emitter = _dereq_('component-emitter');
var debug = _dereq_('debug')('engine.io-client:socket');
var index = _dereq_('indexof');
var parser = _dereq_('engine.io-parser');
var parseuri = _dereq_('parseuri');
var parsejson = _dereq_('parsejson');
var parseqs = _dereq_('parseqs');

/**
 * Module exports.
 */

module.exports = Socket;

/**
 * Noop function.
 *
 * @api private
 */

function noop(){}

/**
 * Socket constructor.
 *
 * @param {String|Object} uri or options
 * @param {Object} options
 * @api public
 */

function Socket(uri, opts){
  if (!(this instanceof Socket)) return new Socket(uri, opts);

  opts = opts || {};

  if (uri && 'object' == typeof uri) {
    opts = uri;
    uri = null;
  }

  if (uri) {
    uri = parseuri(uri);
    opts.hostname = uri.host;
    opts.secure = uri.protocol == 'https' || uri.protocol == 'wss';
    opts.port = uri.port;
    if (uri.query) opts.query = uri.query;
  } else if (opts.host) {
    opts.hostname = parseuri(opts.host).host;
  }

  this.secure = null != opts.secure ? opts.secure :
    (global.location && 'https:' == location.protocol);

  if (opts.hostname && !opts.port) {
    // if no port is specified manually, use the protocol default
    opts.port = this.secure ? '443' : '80';
  }

  this.agent = opts.agent || false;
  this.hostname = opts.hostname ||
    (global.location ? location.hostname : 'localhost');
  this.port = opts.port || (global.location && location.port ?
       location.port :
       (this.secure ? 443 : 80));
  this.query = opts.query || {};
  if ('string' == typeof this.query) this.query = parseqs.decode(this.query);
  this.upgrade = false !== opts.upgrade;
  this.path = (opts.path || '/engine.io').replace(/\/$/, '') + '/';
  this.forceJSONP = !!opts.forceJSONP;
  this.jsonp = false !== opts.jsonp;
  this.forceBase64 = !!opts.forceBase64;
  this.enablesXDR = !!opts.enablesXDR;
  this.timestampParam = opts.timestampParam || 't';
  this.timestampRequests = opts.timestampRequests;
  this.transports = opts.transports || ['polling', 'websocket'];
  this.readyState = '';
  this.writeBuffer = [];
  this.policyPort = opts.policyPort || 843;
  this.rememberUpgrade = opts.rememberUpgrade || false;
  this.binaryType = null;
  this.onlyBinaryUpgrades = opts.onlyBinaryUpgrades;
  this.perMessageDeflate = false !== opts.perMessageDeflate ? (opts.perMessageDeflate || {}) : false;

  if (true === this.perMessageDeflate) this.perMessageDeflate = {};
  if (this.perMessageDeflate && null == this.perMessageDeflate.threshold) {
    this.perMessageDeflate.threshold = 1024;
  }

  // SSL options for Node.js client
  this.pfx = opts.pfx || null;
  this.key = opts.key || null;
  this.passphrase = opts.passphrase || null;
  this.cert = opts.cert || null;
  this.ca = opts.ca || null;
  this.ciphers = opts.ciphers || null;
  this.rejectUnauthorized = opts.rejectUnauthorized === undefined ? true : opts.rejectUnauthorized;

  // other options for Node.js client
  var freeGlobal = typeof global == 'object' && global;
  if (freeGlobal.global === freeGlobal) {
    if (opts.extraHeaders && Object.keys(opts.extraHeaders).length > 0) {
      this.extraHeaders = opts.extraHeaders;
    }
  }

  this.open();
}

Socket.priorWebsocketSuccess = false;

/**
 * Mix in `Emitter`.
 */

Emitter(Socket.prototype);

/**
 * Protocol version.
 *
 * @api public
 */

Socket.protocol = parser.protocol; // this is an int

/**
 * Expose deps for legacy compatibility
 * and standalone browser access.
 */

Socket.Socket = Socket;
Socket.Transport = _dereq_('./transport');
Socket.transports = _dereq_('./transports');
Socket.parser = _dereq_('engine.io-parser');

/**
 * Creates transport of the given type.
 *
 * @param {String} transport name
 * @return {Transport}
 * @api private
 */

Socket.prototype.createTransport = function (name) {
  debug('creating transport "%s"', name);
  var query = clone(this.query);

  // append engine.io protocol identifier
  query.EIO = parser.protocol;

  // transport name
  query.transport = name;

  // session id if we already have one
  if (this.id) query.sid = this.id;

  var transport = new transports[name]({
    agent: this.agent,
    hostname: this.hostname,
    port: this.port,
    secure: this.secure,
    path: this.path,
    query: query,
    forceJSONP: this.forceJSONP,
    jsonp: this.jsonp,
    forceBase64: this.forceBase64,
    enablesXDR: this.enablesXDR,
    timestampRequests: this.timestampRequests,
    timestampParam: this.timestampParam,
    policyPort: this.policyPort,
    socket: this,
    pfx: this.pfx,
    key: this.key,
    passphrase: this.passphrase,
    cert: this.cert,
    ca: this.ca,
    ciphers: this.ciphers,
    rejectUnauthorized: this.rejectUnauthorized,
    perMessageDeflate: this.perMessageDeflate,
    extraHeaders: this.extraHeaders
  });

  return transport;
};

function clone (obj) {
  var o = {};
  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      o[i] = obj[i];
    }
  }
  return o;
}

/**
 * Initializes transport to use and starts probe.
 *
 * @api private
 */
Socket.prototype.open = function () {
  var transport;
  if (this.rememberUpgrade && Socket.priorWebsocketSuccess && this.transports.indexOf('websocket') != -1) {
    transport = 'websocket';
  } else if (0 === this.transports.length) {
    // Emit error on next tick so it can be listened to
    var self = this;
    setTimeout(function() {
      self.emit('error', 'No transports available');
    }, 0);
    return;
  } else {
    transport = this.transports[0];
  }
  this.readyState = 'opening';

  // Retry with the next transport if the transport is disabled (jsonp: false)
  try {
    transport = this.createTransport(transport);
  } catch (e) {
    this.transports.shift();
    this.open();
    return;
  }

  transport.open();
  this.setTransport(transport);
};

/**
 * Sets the current transport. Disables the existing one (if any).
 *
 * @api private
 */

Socket.prototype.setTransport = function(transport){
  debug('setting transport %s', transport.name);
  var self = this;

  if (this.transport) {
    debug('clearing existing transport %s', this.transport.name);
    this.transport.removeAllListeners();
  }

  // set up transport
  this.transport = transport;

  // set up transport listeners
  transport
  .on('drain', function(){
    self.onDrain();
  })
  .on('packet', function(packet){
    self.onPacket(packet);
  })
  .on('error', function(e){
    self.onError(e);
  })
  .on('close', function(){
    self.onClose('transport close');
  });
};

/**
 * Probes a transport.
 *
 * @param {String} transport name
 * @api private
 */

Socket.prototype.probe = function (name) {
  debug('probing transport "%s"', name);
  var transport = this.createTransport(name, { probe: 1 })
    , failed = false
    , self = this;

  Socket.priorWebsocketSuccess = false;

  function onTransportOpen(){
    if (self.onlyBinaryUpgrades) {
      var upgradeLosesBinary = !this.supportsBinary && self.transport.supportsBinary;
      failed = failed || upgradeLosesBinary;
    }
    if (failed) return;

    debug('probe transport "%s" opened', name);
    transport.send([{ type: 'ping', data: 'probe' }]);
    transport.once('packet', function (msg) {
      if (failed) return;
      if ('pong' == msg.type && 'probe' == msg.data) {
        debug('probe transport "%s" pong', name);
        self.upgrading = true;
        self.emit('upgrading', transport);
        if (!transport) return;
        Socket.priorWebsocketSuccess = 'websocket' == transport.name;

        debug('pausing current transport "%s"', self.transport.name);
        self.transport.pause(function () {
          if (failed) return;
          if ('closed' == self.readyState) return;
          debug('changing transport and sending upgrade packet');

          cleanup();

          self.setTransport(transport);
          transport.send([{ type: 'upgrade' }]);
          self.emit('upgrade', transport);
          transport = null;
          self.upgrading = false;
          self.flush();
        });
      } else {
        debug('probe transport "%s" failed', name);
        var err = new Error('probe error');
        err.transport = transport.name;
        self.emit('upgradeError', err);
      }
    });
  }

  function freezeTransport() {
    if (failed) return;

    // Any callback called by transport should be ignored since now
    failed = true;

    cleanup();

    transport.close();
    transport = null;
  }

  //Handle any error that happens while probing
  function onerror(err) {
    var error = new Error('probe error: ' + err);
    error.transport = transport.name;

    freezeTransport();

    debug('probe transport "%s" failed because of error: %s', name, err);

    self.emit('upgradeError', error);
  }

  function onTransportClose(){
    onerror("transport closed");
  }

  //When the socket is closed while we're probing
  function onclose(){
    onerror("socket closed");
  }

  //When the socket is upgraded while we're probing
  function onupgrade(to){
    if (transport && to.name != transport.name) {
      debug('"%s" works - aborting "%s"', to.name, transport.name);
      freezeTransport();
    }
  }

  //Remove all listeners on the transport and on self
  function cleanup(){
    transport.removeListener('open', onTransportOpen);
    transport.removeListener('error', onerror);
    transport.removeListener('close', onTransportClose);
    self.removeListener('close', onclose);
    self.removeListener('upgrading', onupgrade);
  }

  transport.once('open', onTransportOpen);
  transport.once('error', onerror);
  transport.once('close', onTransportClose);

  this.once('close', onclose);
  this.once('upgrading', onupgrade);

  transport.open();

};

/**
 * Called when connection is deemed open.
 *
 * @api public
 */

Socket.prototype.onOpen = function () {
  debug('socket open');
  this.readyState = 'open';
  Socket.priorWebsocketSuccess = 'websocket' == this.transport.name;
  this.emit('open');
  this.flush();

  // we check for `readyState` in case an `open`
  // listener already closed the socket
  if ('open' == this.readyState && this.upgrade && this.transport.pause) {
    debug('starting upgrade probes');
    for (var i = 0, l = this.upgrades.length; i < l; i++) {
      this.probe(this.upgrades[i]);
    }
  }
};

/**
 * Handles a packet.
 *
 * @api private
 */

Socket.prototype.onPacket = function (packet) {
  if ('opening' == this.readyState || 'open' == this.readyState) {
    debug('socket receive: type "%s", data "%s"', packet.type, packet.data);

    this.emit('packet', packet);

    // Socket is live - any packet counts
    this.emit('heartbeat');

    switch (packet.type) {
      case 'open':
        this.onHandshake(parsejson(packet.data));
        break;

      case 'pong':
        this.setPing();
        this.emit('pong');
        break;

      case 'error':
        var err = new Error('server error');
        err.code = packet.data;
        this.onError(err);
        break;

      case 'message':
        this.emit('data', packet.data);
        this.emit('message', packet.data);
        break;
    }
  } else {
    debug('packet received with socket readyState "%s"', this.readyState);
  }
};

/**
 * Called upon handshake completion.
 *
 * @param {Object} handshake obj
 * @api private
 */

Socket.prototype.onHandshake = function (data) {
  this.emit('handshake', data);
  this.id = data.sid;
  this.transport.query.sid = data.sid;
  this.upgrades = this.filterUpgrades(data.upgrades);
  this.pingInterval = data.pingInterval;
  this.pingTimeout = data.pingTimeout;
  this.onOpen();
  // In case open handler closes socket
  if  ('closed' == this.readyState) return;
  this.setPing();

  // Prolong liveness of socket on heartbeat
  this.removeListener('heartbeat', this.onHeartbeat);
  this.on('heartbeat', this.onHeartbeat);
};

/**
 * Resets ping timeout.
 *
 * @api private
 */

Socket.prototype.onHeartbeat = function (timeout) {
  clearTimeout(this.pingTimeoutTimer);
  var self = this;
  self.pingTimeoutTimer = setTimeout(function () {
    if ('closed' == self.readyState) return;
    self.onClose('ping timeout');
  }, timeout || (self.pingInterval + self.pingTimeout));
};

/**
 * Pings server every `this.pingInterval` and expects response
 * within `this.pingTimeout` or closes connection.
 *
 * @api private
 */

Socket.prototype.setPing = function () {
  var self = this;
  clearTimeout(self.pingIntervalTimer);
  self.pingIntervalTimer = setTimeout(function () {
    debug('writing ping packet - expecting pong within %sms', self.pingTimeout);
    self.ping();
    self.onHeartbeat(self.pingTimeout);
  }, self.pingInterval);
};

/**
* Sends a ping packet.
*
* @api private
*/

Socket.prototype.ping = function () {
  var self = this;
  this.sendPacket('ping', function(){
    self.emit('ping');
  });
};

/**
 * Called on `drain` event
 *
 * @api private
 */

Socket.prototype.onDrain = function() {
  this.writeBuffer.splice(0, this.prevBufferLen);

  // setting prevBufferLen = 0 is very important
  // for example, when upgrading, upgrade packet is sent over,
  // and a nonzero prevBufferLen could cause problems on `drain`
  this.prevBufferLen = 0;

  if (0 === this.writeBuffer.length) {
    this.emit('drain');
  } else {
    this.flush();
  }
};

/**
 * Flush write buffers.
 *
 * @api private
 */

Socket.prototype.flush = function () {
  if ('closed' != this.readyState && this.transport.writable &&
    !this.upgrading && this.writeBuffer.length) {
    debug('flushing %d packets in socket', this.writeBuffer.length);
    this.transport.send(this.writeBuffer);
    // keep track of current length of writeBuffer
    // splice writeBuffer and callbackBuffer on `drain`
    this.prevBufferLen = this.writeBuffer.length;
    this.emit('flush');
  }
};

/**
 * Sends a message.
 *
 * @param {String} message.
 * @param {Function} callback function.
 * @param {Object} options.
 * @return {Socket} for chaining.
 * @api public
 */

Socket.prototype.write =
Socket.prototype.send = function (msg, options, fn) {
  this.sendPacket('message', msg, options, fn);
  return this;
};

/**
 * Sends a packet.
 *
 * @param {String} packet type.
 * @param {String} data.
 * @param {Object} options.
 * @param {Function} callback function.
 * @api private
 */

Socket.prototype.sendPacket = function (type, data, options, fn) {
  if('function' == typeof data) {
    fn = data;
    data = undefined;
  }

  if ('function' == typeof options) {
    fn = options;
    options = null;
  }

  if ('closing' == this.readyState || 'closed' == this.readyState) {
    return;
  }

  options = options || {};
  options.compress = false !== options.compress;

  var packet = {
    type: type,
    data: data,
    options: options
  };
  this.emit('packetCreate', packet);
  this.writeBuffer.push(packet);
  if (fn) this.once('flush', fn);
  this.flush();
};

/**
 * Closes the connection.
 *
 * @api private
 */

Socket.prototype.close = function () {
  if ('opening' == this.readyState || 'open' == this.readyState) {
    this.readyState = 'closing';

    var self = this;

    if (this.writeBuffer.length) {
      this.once('drain', function() {
        if (this.upgrading) {
          waitForUpgrade();
        } else {
          close();
        }
      });
    } else if (this.upgrading) {
      waitForUpgrade();
    } else {
      close();
    }
  }

  function close() {
    self.onClose('forced close');
    debug('socket closing - telling transport to close');
    self.transport.close();
  }

  function cleanupAndClose() {
    self.removeListener('upgrade', cleanupAndClose);
    self.removeListener('upgradeError', cleanupAndClose);
    close();
  }

  function waitForUpgrade() {
    // wait for upgrade to finish since we can't send packets while pausing a transport
    self.once('upgrade', cleanupAndClose);
    self.once('upgradeError', cleanupAndClose);
  }

  return this;
};

/**
 * Called upon transport error
 *
 * @api private
 */

Socket.prototype.onError = function (err) {
  debug('socket error %j', err);
  Socket.priorWebsocketSuccess = false;
  this.emit('error', err);
  this.onClose('transport error', err);
};

/**
 * Called upon transport close.
 *
 * @api private
 */

Socket.prototype.onClose = function (reason, desc) {
  if ('opening' == this.readyState || 'open' == this.readyState || 'closing' == this.readyState) {
    debug('socket close with reason: "%s"', reason);
    var self = this;

    // clear timers
    clearTimeout(this.pingIntervalTimer);
    clearTimeout(this.pingTimeoutTimer);

    // stop event from firing again for transport
    this.transport.removeAllListeners('close');

    // ensure transport won't stay open
    this.transport.close();

    // ignore further transport communication
    this.transport.removeAllListeners();

    // set ready state
    this.readyState = 'closed';

    // clear session id
    this.id = null;

    // emit close event
    this.emit('close', reason, desc);

    // clean buffers after, so users can still
    // grab the buffers on `close` event
    self.writeBuffer = [];
    self.prevBufferLen = 0;
  }
};

/**
 * Filters upgrades, returning only those matching client transports.
 *
 * @param {Array} server upgrades
 * @api private
 *
 */

Socket.prototype.filterUpgrades = function (upgrades) {
  var filteredUpgrades = [];
  for (var i = 0, j = upgrades.length; i<j; i++) {
    if (~index(this.transports, upgrades[i])) filteredUpgrades.push(upgrades[i]);
  }
  return filteredUpgrades;
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{"./transport":19,"./transports":20,"component-emitter":26,"debug":14,"engine.io-parser":27,"indexof":32,"parsejson":36,"parseqs":37,"parseuri":38}],19:[function(_dereq_,module,exports){
/**
 * Module dependencies.
 */

var parser = _dereq_('engine.io-parser');
var Emitter = _dereq_('component-emitter');

/**
 * Module exports.
 */

module.exports = Transport;

/**
 * Transport abstract constructor.
 *
 * @param {Object} options.
 * @api private
 */

function Transport (opts) {
  this.path = opts.path;
  this.hostname = opts.hostname;
  this.port = opts.port;
  this.secure = opts.secure;
  this.query = opts.query;
  this.timestampParam = opts.timestampParam;
  this.timestampRequests = opts.timestampRequests;
  this.readyState = '';
  this.agent = opts.agent || false;
  this.socket = opts.socket;
  this.enablesXDR = opts.enablesXDR;

  // SSL options for Node.js client
  this.pfx = opts.pfx;
  this.key = opts.key;
  this.passphrase = opts.passphrase;
  this.cert = opts.cert;
  this.ca = opts.ca;
  this.ciphers = opts.ciphers;
  this.rejectUnauthorized = opts.rejectUnauthorized;

  // other options for Node.js client
  this.extraHeaders = opts.extraHeaders;
}

/**
 * Mix in `Emitter`.
 */

Emitter(Transport.prototype);

/**
 * Emits an error.
 *
 * @param {String} str
 * @return {Transport} for chaining
 * @api public
 */

Transport.prototype.onError = function (msg, desc) {
  var err = new Error(msg);
  err.type = 'TransportError';
  err.description = desc;
  this.emit('error', err);
  return this;
};

/**
 * Opens the transport.
 *
 * @api public
 */

Transport.prototype.open = function () {
  if ('closed' == this.readyState || '' == this.readyState) {
    this.readyState = 'opening';
    this.doOpen();
  }

  return this;
};

/**
 * Closes the transport.
 *
 * @api private
 */

Transport.prototype.close = function () {
  if ('opening' == this.readyState || 'open' == this.readyState) {
    this.doClose();
    this.onClose();
  }

  return this;
};

/**
 * Sends multiple packets.
 *
 * @param {Array} packets
 * @api private
 */

Transport.prototype.send = function(packets){
  if ('open' == this.readyState) {
    this.write(packets);
  } else {
    throw new Error('Transport not open');
  }
};

/**
 * Called upon open
 *
 * @api private
 */

Transport.prototype.onOpen = function () {
  this.readyState = 'open';
  this.writable = true;
  this.emit('open');
};

/**
 * Called with data.
 *
 * @param {String} data
 * @api private
 */

Transport.prototype.onData = function(data){
  var packet = parser.decodePacket(data, this.socket.binaryType);
  this.onPacket(packet);
};

/**
 * Called with a decoded packet.
 */

Transport.prototype.onPacket = function (packet) {
  this.emit('packet', packet);
};

/**
 * Called upon close.
 *
 * @api private
 */

Transport.prototype.onClose = function () {
  this.readyState = 'closed';
  this.emit('close');
};

},{"component-emitter":26,"engine.io-parser":27}],20:[function(_dereq_,module,exports){
(function (global){
/**
 * Module dependencies
 */

var XMLHttpRequest = _dereq_('xmlhttprequest-ssl');
var XHR = _dereq_('./polling-xhr');
var JSONP = _dereq_('./polling-jsonp');
var websocket = _dereq_('./websocket');

/**
 * Export transports.
 */

exports.polling = polling;
exports.websocket = websocket;

/**
 * Polling transport polymorphic constructor.
 * Decides on xhr vs jsonp based on feature detection.
 *
 * @api private
 */

function polling(opts){
  var xhr;
  var xd = false;
  var xs = false;
  var jsonp = false !== opts.jsonp;

  if (global.location) {
    var isSSL = 'https:' == location.protocol;
    var port = location.port;

    // some user agents have empty `location.port`
    if (!port) {
      port = isSSL ? 443 : 80;
    }

    xd = opts.hostname != location.hostname || port != opts.port;
    xs = opts.secure != isSSL;
  }

  opts.xdomain = xd;
  opts.xscheme = xs;
  xhr = new XMLHttpRequest(opts);

  if ('open' in xhr && !opts.forceJSONP) {
    return new XHR(opts);
  } else {
    if (!jsonp) throw new Error('JSONP disabled');
    return new JSONP(opts);
  }
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{"./polling-jsonp":21,"./polling-xhr":22,"./websocket":24,"xmlhttprequest-ssl":25}],21:[function(_dereq_,module,exports){
(function (global){

/**
 * Module requirements.
 */

var Polling = _dereq_('./polling');
var inherit = _dereq_('component-inherit');

/**
 * Module exports.
 */

module.exports = JSONPPolling;

/**
 * Cached regular expressions.
 */

var rNewline = /\n/g;
var rEscapedNewline = /\\n/g;

/**
 * Global JSONP callbacks.
 */

var callbacks;

/**
 * Callbacks count.
 */

var index = 0;

/**
 * Noop.
 */

function empty () { }

/**
 * JSONP Polling constructor.
 *
 * @param {Object} opts.
 * @api public
 */

function JSONPPolling (opts) {
  Polling.call(this, opts);

  this.query = this.query || {};

  // define global callbacks array if not present
  // we do this here (lazily) to avoid unneeded global pollution
  if (!callbacks) {
    // we need to consider multiple engines in the same page
    if (!global.___eio) global.___eio = [];
    callbacks = global.___eio;
  }

  // callback identifier
  this.index = callbacks.length;

  // add callback to jsonp global
  var self = this;
  callbacks.push(function (msg) {
    self.onData(msg);
  });

  // append to query string
  this.query.j = this.index;

  // prevent spurious errors from being emitted when the window is unloaded
  if (global.document && global.addEventListener) {
    global.addEventListener('beforeunload', function () {
      if (self.script) self.script.onerror = empty;
    }, false);
  }
}

/**
 * Inherits from Polling.
 */

inherit(JSONPPolling, Polling);

/*
 * JSONP only supports binary as base64 encoded strings
 */

JSONPPolling.prototype.supportsBinary = false;

/**
 * Closes the socket.
 *
 * @api private
 */

JSONPPolling.prototype.doClose = function () {
  if (this.script) {
    this.script.parentNode.removeChild(this.script);
    this.script = null;
  }

  if (this.form) {
    this.form.parentNode.removeChild(this.form);
    this.form = null;
    this.iframe = null;
  }

  Polling.prototype.doClose.call(this);
};

/**
 * Starts a poll cycle.
 *
 * @api private
 */

JSONPPolling.prototype.doPoll = function () {
  var self = this;
  var script = document.createElement('script');

  if (this.script) {
    this.script.parentNode.removeChild(this.script);
    this.script = null;
  }

  script.async = true;
  script.src = this.uri();
  script.onerror = function(e){
    self.onError('jsonp poll error',e);
  };

  var insertAt = document.getElementsByTagName('script')[0];
  if (insertAt) {
    insertAt.parentNode.insertBefore(script, insertAt);
  }
  else {
    (document.head || document.body).appendChild(script);
  }
  this.script = script;

  var isUAgecko = 'undefined' != typeof navigator && /gecko/i.test(navigator.userAgent);
  
  if (isUAgecko) {
    setTimeout(function () {
      var iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      document.body.removeChild(iframe);
    }, 100);
  }
};

/**
 * Writes with a hidden iframe.
 *
 * @param {String} data to send
 * @param {Function} called upon flush.
 * @api private
 */

JSONPPolling.prototype.doWrite = function (data, fn) {
  var self = this;

  if (!this.form) {
    var form = document.createElement('form');
    var area = document.createElement('textarea');
    var id = this.iframeId = 'eio_iframe_' + this.index;
    var iframe;

    form.className = 'socketio';
    form.style.position = 'absolute';
    form.style.top = '-1000px';
    form.style.left = '-1000px';
    form.target = id;
    form.method = 'POST';
    form.setAttribute('accept-charset', 'utf-8');
    area.name = 'd';
    form.appendChild(area);
    document.body.appendChild(form);

    this.form = form;
    this.area = area;
  }

  this.form.action = this.uri();

  function complete () {
    initIframe();
    fn();
  }

  function initIframe () {
    if (self.iframe) {
      try {
        self.form.removeChild(self.iframe);
      } catch (e) {
        self.onError('jsonp polling iframe removal error', e);
      }
    }

    try {
      // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
      var html = '<iframe src="javascript:0" name="'+ self.iframeId +'">';
      iframe = document.createElement(html);
    } catch (e) {
      iframe = document.createElement('iframe');
      iframe.name = self.iframeId;
      iframe.src = 'javascript:0';
    }

    iframe.id = self.iframeId;

    self.form.appendChild(iframe);
    self.iframe = iframe;
  }

  initIframe();

  // escape \n to prevent it from being converted into \r\n by some UAs
  // double escaping is required for escaped new lines because unescaping of new lines can be done safely on server-side
  data = data.replace(rEscapedNewline, '\\\n');
  this.area.value = data.replace(rNewline, '\\n');

  try {
    this.form.submit();
  } catch(e) {}

  if (this.iframe.attachEvent) {
    this.iframe.onreadystatechange = function(){
      if (self.iframe.readyState == 'complete') {
        complete();
      }
    };
  } else {
    this.iframe.onload = complete;
  }
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{"./polling":23,"component-inherit":13}],22:[function(_dereq_,module,exports){
(function (global){
/**
 * Module requirements.
 */

var XMLHttpRequest = _dereq_('xmlhttprequest-ssl');
var Polling = _dereq_('./polling');
var Emitter = _dereq_('component-emitter');
var inherit = _dereq_('component-inherit');
var debug = _dereq_('debug')('engine.io-client:polling-xhr');

/**
 * Module exports.
 */

module.exports = XHR;
module.exports.Request = Request;

/**
 * Empty function
 */

function empty(){}

/**
 * XHR Polling constructor.
 *
 * @param {Object} opts
 * @api public
 */

function XHR(opts){
  Polling.call(this, opts);

  if (global.location) {
    var isSSL = 'https:' == location.protocol;
    var port = location.port;

    // some user agents have empty `location.port`
    if (!port) {
      port = isSSL ? 443 : 80;
    }

    this.xd = opts.hostname != global.location.hostname ||
      port != opts.port;
    this.xs = opts.secure != isSSL;
  } else {
    this.extraHeaders = opts.extraHeaders;
  }
}

/**
 * Inherits from Polling.
 */

inherit(XHR, Polling);

/**
 * XHR supports binary
 */

XHR.prototype.supportsBinary = true;

/**
 * Creates a request.
 *
 * @param {String} method
 * @api private
 */

XHR.prototype.request = function(opts){
  opts = opts || {};
  opts.uri = this.uri();
  opts.xd = this.xd;
  opts.xs = this.xs;
  opts.agent = this.agent || false;
  opts.supportsBinary = this.supportsBinary;
  opts.enablesXDR = this.enablesXDR;

  // SSL options for Node.js client
  opts.pfx = this.pfx;
  opts.key = this.key;
  opts.passphrase = this.passphrase;
  opts.cert = this.cert;
  opts.ca = this.ca;
  opts.ciphers = this.ciphers;
  opts.rejectUnauthorized = this.rejectUnauthorized;

  // other options for Node.js client
  opts.extraHeaders = this.extraHeaders;

  return new Request(opts);
};

/**
 * Sends data.
 *
 * @param {String} data to send.
 * @param {Function} called upon flush.
 * @api private
 */

XHR.prototype.doWrite = function(data, fn){
  var isBinary = typeof data !== 'string' && data !== undefined;
  var req = this.request({ method: 'POST', data: data, isBinary: isBinary });
  var self = this;
  req.on('success', fn);
  req.on('error', function(err){
    self.onError('xhr post error', err);
  });
  this.sendXhr = req;
};

/**
 * Starts a poll cycle.
 *
 * @api private
 */

XHR.prototype.doPoll = function(){
  debug('xhr poll');
  var req = this.request();
  var self = this;
  req.on('data', function(data){
    self.onData(data);
  });
  req.on('error', function(err){
    self.onError('xhr poll error', err);
  });
  this.pollXhr = req;
};

/**
 * Request constructor
 *
 * @param {Object} options
 * @api public
 */

function Request(opts){
  this.method = opts.method || 'GET';
  this.uri = opts.uri;
  this.xd = !!opts.xd;
  this.xs = !!opts.xs;
  this.async = false !== opts.async;
  this.data = undefined != opts.data ? opts.data : null;
  this.agent = opts.agent;
  this.isBinary = opts.isBinary;
  this.supportsBinary = opts.supportsBinary;
  this.enablesXDR = opts.enablesXDR;

  // SSL options for Node.js client
  this.pfx = opts.pfx;
  this.key = opts.key;
  this.passphrase = opts.passphrase;
  this.cert = opts.cert;
  this.ca = opts.ca;
  this.ciphers = opts.ciphers;
  this.rejectUnauthorized = opts.rejectUnauthorized;

  // other options for Node.js client
  this.extraHeaders = opts.extraHeaders;

  this.create();
}

/**
 * Mix in `Emitter`.
 */

Emitter(Request.prototype);

/**
 * Creates the XHR object and sends the request.
 *
 * @api private
 */

Request.prototype.create = function(){
  var opts = { agent: this.agent, xdomain: this.xd, xscheme: this.xs, enablesXDR: this.enablesXDR };

  // SSL options for Node.js client
  opts.pfx = this.pfx;
  opts.key = this.key;
  opts.passphrase = this.passphrase;
  opts.cert = this.cert;
  opts.ca = this.ca;
  opts.ciphers = this.ciphers;
  opts.rejectUnauthorized = this.rejectUnauthorized;

  var xhr = this.xhr = new XMLHttpRequest(opts);
  var self = this;

  try {
    debug('xhr open %s: %s', this.method, this.uri);
    xhr.open(this.method, this.uri, this.async);
    try {
      if (this.extraHeaders) {
        xhr.setDisableHeaderCheck(true);
        for (var i in this.extraHeaders) {
          if (this.extraHeaders.hasOwnProperty(i)) {
            xhr.setRequestHeader(i, this.extraHeaders[i]);
          }
        }
      }
    } catch (e) {}
    if (this.supportsBinary) {
      // This has to be done after open because Firefox is stupid
      // http://stackoverflow.com/questions/13216903/get-binary-data-with-xmlhttprequest-in-a-firefox-extension
      xhr.responseType = 'arraybuffer';
    }

    if ('POST' == this.method) {
      try {
        if (this.isBinary) {
          xhr.setRequestHeader('Content-type', 'application/octet-stream');
        } else {
          xhr.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
        }
      } catch (e) {}
    }

    // ie6 check
    if ('withCredentials' in xhr) {
      xhr.withCredentials = true;
    }

    if (this.hasXDR()) {
      xhr.onload = function(){
        self.onLoad();
      };
      xhr.onerror = function(){
        self.onError(xhr.responseText);
      };
    } else {
      xhr.onreadystatechange = function(){
        if (4 != xhr.readyState) return;
        if (200 == xhr.status || 1223 == xhr.status) {
          self.onLoad();
        } else {
          // make sure the `error` event handler that's user-set
          // does not throw in the same tick and gets caught here
          setTimeout(function(){
            self.onError(xhr.status);
          }, 0);
        }
      };
    }

    debug('xhr data %s', this.data);
    xhr.send(this.data);
  } catch (e) {
    // Need to defer since .create() is called directly fhrom the constructor
    // and thus the 'error' event can only be only bound *after* this exception
    // occurs.  Therefore, also, we cannot throw here at all.
    setTimeout(function() {
      self.onError(e);
    }, 0);
    return;
  }

  if (global.document) {
    this.index = Request.requestsCount++;
    Request.requests[this.index] = this;
  }
};

/**
 * Called upon successful response.
 *
 * @api private
 */

Request.prototype.onSuccess = function(){
  this.emit('success');
  this.cleanup();
};

/**
 * Called if we have data.
 *
 * @api private
 */

Request.prototype.onData = function(data){
  this.emit('data', data);
  this.onSuccess();
};

/**
 * Called upon error.
 *
 * @api private
 */

Request.prototype.onError = function(err){
  this.emit('error', err);
  this.cleanup(true);
};

/**
 * Cleans up house.
 *
 * @api private
 */

Request.prototype.cleanup = function(fromError){
  if ('undefined' == typeof this.xhr || null === this.xhr) {
    return;
  }
  // xmlhttprequest
  if (this.hasXDR()) {
    this.xhr.onload = this.xhr.onerror = empty;
  } else {
    this.xhr.onreadystatechange = empty;
  }

  if (fromError) {
    try {
      this.xhr.abort();
    } catch(e) {}
  }

  if (global.document) {
    delete Request.requests[this.index];
  }

  this.xhr = null;
};

/**
 * Called upon load.
 *
 * @api private
 */

Request.prototype.onLoad = function(){
  var data;
  try {
    var contentType;
    try {
      contentType = this.xhr.getResponseHeader('Content-Type').split(';')[0];
    } catch (e) {}
    if (contentType === 'application/octet-stream') {
      data = this.xhr.response;
    } else {
      if (!this.supportsBinary) {
        data = this.xhr.responseText;
      } else {
        try {
          data = String.fromCharCode.apply(null, new Uint8Array(this.xhr.response));
        } catch (e) {
          var ui8Arr = new Uint8Array(this.xhr.response);
          var dataArray = [];
          for (var idx = 0, length = ui8Arr.length; idx < length; idx++) {
            dataArray.push(ui8Arr[idx]);
          }

          data = String.fromCharCode.apply(null, dataArray);
        }
      }
    }
  } catch (e) {
    this.onError(e);
  }
  if (null != data) {
    this.onData(data);
  }
};

/**
 * Check if it has XDomainRequest.
 *
 * @api private
 */

Request.prototype.hasXDR = function(){
  return 'undefined' !== typeof global.XDomainRequest && !this.xs && this.enablesXDR;
};

/**
 * Aborts the request.
 *
 * @api public
 */

Request.prototype.abort = function(){
  this.cleanup();
};

/**
 * Aborts pending requests when unloading the window. This is needed to prevent
 * memory leaks (e.g. when using IE) and to ensure that no spurious error is
 * emitted.
 */

if (global.document) {
  Request.requestsCount = 0;
  Request.requests = {};
  if (global.attachEvent) {
    global.attachEvent('onunload', unloadHandler);
  } else if (global.addEventListener) {
    global.addEventListener('beforeunload', unloadHandler, false);
  }
}

function unloadHandler() {
  for (var i in Request.requests) {
    if (Request.requests.hasOwnProperty(i)) {
      Request.requests[i].abort();
    }
  }
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{"./polling":23,"component-emitter":26,"component-inherit":13,"debug":14,"xmlhttprequest-ssl":25}],23:[function(_dereq_,module,exports){
/**
 * Module dependencies.
 */

var Transport = _dereq_('../transport');
var parseqs = _dereq_('parseqs');
var parser = _dereq_('engine.io-parser');
var inherit = _dereq_('component-inherit');
var yeast = _dereq_('yeast');
var debug = _dereq_('debug')('engine.io-client:polling');

/**
 * Module exports.
 */

module.exports = Polling;

/**
 * Is XHR2 supported?
 */

var hasXHR2 = (function() {
  var XMLHttpRequest = _dereq_('xmlhttprequest-ssl');
  var xhr = new XMLHttpRequest({ xdomain: false });
  return null != xhr.responseType;
})();

/**
 * Polling interface.
 *
 * @param {Object} opts
 * @api private
 */

function Polling(opts){
  var forceBase64 = (opts && opts.forceBase64);
  if (!hasXHR2 || forceBase64) {
    this.supportsBinary = false;
  }
  Transport.call(this, opts);
}

/**
 * Inherits from Transport.
 */

inherit(Polling, Transport);

/**
 * Transport name.
 */

Polling.prototype.name = 'polling';

/**
 * Opens the socket (triggers polling). We write a PING message to determine
 * when the transport is open.
 *
 * @api private
 */

Polling.prototype.doOpen = function(){
  this.poll();
};

/**
 * Pauses polling.
 *
 * @param {Function} callback upon buffers are flushed and transport is paused
 * @api private
 */

Polling.prototype.pause = function(onPause){
  var pending = 0;
  var self = this;

  this.readyState = 'pausing';

  function pause(){
    debug('paused');
    self.readyState = 'paused';
    onPause();
  }

  if (this.polling || !this.writable) {
    var total = 0;

    if (this.polling) {
      debug('we are currently polling - waiting to pause');
      total++;
      this.once('pollComplete', function(){
        debug('pre-pause polling complete');
        --total || pause();
      });
    }

    if (!this.writable) {
      debug('we are currently writing - waiting to pause');
      total++;
      this.once('drain', function(){
        debug('pre-pause writing complete');
        --total || pause();
      });
    }
  } else {
    pause();
  }
};

/**
 * Starts polling cycle.
 *
 * @api public
 */

Polling.prototype.poll = function(){
  debug('polling');
  this.polling = true;
  this.doPoll();
  this.emit('poll');
};

/**
 * Overloads onData to detect payloads.
 *
 * @api private
 */

Polling.prototype.onData = function(data){
  var self = this;
  debug('polling got data %s', data);
  var callback = function(packet, index, total) {
    // if its the first message we consider the transport open
    if ('opening' == self.readyState) {
      self.onOpen();
    }

    // if its a close packet, we close the ongoing requests
    if ('close' == packet.type) {
      self.onClose();
      return false;
    }

    // otherwise bypass onData and handle the message
    self.onPacket(packet);
  };

  // decode payload
  parser.decodePayload(data, this.socket.binaryType, callback);

  // if an event did not trigger closing
  if ('closed' != this.readyState) {
    // if we got data we're not polling
    this.polling = false;
    this.emit('pollComplete');

    if ('open' == this.readyState) {
      this.poll();
    } else {
      debug('ignoring poll - transport state "%s"', this.readyState);
    }
  }
};

/**
 * For polling, send a close packet.
 *
 * @api private
 */

Polling.prototype.doClose = function(){
  var self = this;

  function close(){
    debug('writing close packet');
    self.write([{ type: 'close' }]);
  }

  if ('open' == this.readyState) {
    debug('transport open - closing');
    close();
  } else {
    // in case we're trying to close while
    // handshaking is in progress (GH-164)
    debug('transport not open - deferring close');
    this.once('open', close);
  }
};

/**
 * Writes a packets payload.
 *
 * @param {Array} data packets
 * @param {Function} drain callback
 * @api private
 */

Polling.prototype.write = function(packets){
  var self = this;
  this.writable = false;
  var callbackfn = function() {
    self.writable = true;
    self.emit('drain');
  };

  var self = this;
  parser.encodePayload(packets, this.supportsBinary, function(data) {
    self.doWrite(data, callbackfn);
  });
};

/**
 * Generates uri for connection.
 *
 * @api private
 */

Polling.prototype.uri = function(){
  var query = this.query || {};
  var schema = this.secure ? 'https' : 'http';
  var port = '';

  // cache busting is forced
  if (false !== this.timestampRequests) {
    query[this.timestampParam] = yeast();
  }

  if (!this.supportsBinary && !query.sid) {
    query.b64 = 1;
  }

  query = parseqs.encode(query);

  // avoid port if default for schema
  if (this.port && (('https' == schema && this.port != 443) ||
     ('http' == schema && this.port != 80))) {
    port = ':' + this.port;
  }

  // prepend ? to query
  if (query.length) {
    query = '?' + query;
  }

  var ipv6 = this.hostname.indexOf(':') !== -1;
  return schema + '://' + (ipv6 ? '[' + this.hostname + ']' : this.hostname) + port + this.path + query;
};

},{"../transport":19,"component-inherit":13,"debug":14,"engine.io-parser":27,"parseqs":37,"xmlhttprequest-ssl":25,"yeast":45}],24:[function(_dereq_,module,exports){
(function (global){
/**
 * Module dependencies.
 */

var Transport = _dereq_('../transport');
var parser = _dereq_('engine.io-parser');
var parseqs = _dereq_('parseqs');
var inherit = _dereq_('component-inherit');
var yeast = _dereq_('yeast');
var debug = _dereq_('debug')('engine.io-client:websocket');
var BrowserWebSocket = global.WebSocket || global.MozWebSocket;

/**
 * Get either the `WebSocket` or `MozWebSocket` globals
 * in the browser or try to resolve WebSocket-compatible
 * interface exposed by `ws` for Node-like environment.
 */

var WebSocket = BrowserWebSocket;
if (!WebSocket && typeof window === 'undefined') {
  try {
    WebSocket = _dereq_('ws');
  } catch (e) { }
}

/**
 * Module exports.
 */

module.exports = WS;

/**
 * WebSocket transport constructor.
 *
 * @api {Object} connection options
 * @api public
 */

function WS(opts){
  var forceBase64 = (opts && opts.forceBase64);
  if (forceBase64) {
    this.supportsBinary = false;
  }
  this.perMessageDeflate = opts.perMessageDeflate;
  Transport.call(this, opts);
}

/**
 * Inherits from Transport.
 */

inherit(WS, Transport);

/**
 * Transport name.
 *
 * @api public
 */

WS.prototype.name = 'websocket';

/*
 * WebSockets support binary
 */

WS.prototype.supportsBinary = true;

/**
 * Opens socket.
 *
 * @api private
 */

WS.prototype.doOpen = function(){
  if (!this.check()) {
    // let probe timeout
    return;
  }

  var self = this;
  var uri = this.uri();
  var protocols = void(0);
  var opts = {
    agent: this.agent,
    perMessageDeflate: this.perMessageDeflate
  };

  // SSL options for Node.js client
  opts.pfx = this.pfx;
  opts.key = this.key;
  opts.passphrase = this.passphrase;
  opts.cert = this.cert;
  opts.ca = this.ca;
  opts.ciphers = this.ciphers;
  opts.rejectUnauthorized = this.rejectUnauthorized;
  if (this.extraHeaders) {
    opts.headers = this.extraHeaders;
  }

  this.ws = BrowserWebSocket ? new WebSocket(uri) : new WebSocket(uri, protocols, opts);

  if (this.ws.binaryType === undefined) {
    this.supportsBinary = false;
  }

  if (this.ws.supports && this.ws.supports.binary) {
    this.supportsBinary = true;
    this.ws.binaryType = 'buffer';
  } else {
    this.ws.binaryType = 'arraybuffer';
  }

  this.addEventListeners();
};

/**
 * Adds event listeners to the socket
 *
 * @api private
 */

WS.prototype.addEventListeners = function(){
  var self = this;

  this.ws.onopen = function(){
    self.onOpen();
  };
  this.ws.onclose = function(){
    self.onClose();
  };
  this.ws.onmessage = function(ev){
    self.onData(ev.data);
  };
  this.ws.onerror = function(e){
    self.onError('websocket error', e);
  };
};

/**
 * Override `onData` to use a timer on iOS.
 * See: https://gist.github.com/mloughran/2052006
 *
 * @api private
 */

if ('undefined' != typeof navigator
  && /iPad|iPhone|iPod/i.test(navigator.userAgent)) {
  WS.prototype.onData = function(data){
    var self = this;
    setTimeout(function(){
      Transport.prototype.onData.call(self, data);
    }, 0);
  };
}

/**
 * Writes data to socket.
 *
 * @param {Array} array of packets.
 * @api private
 */

WS.prototype.write = function(packets){
  var self = this;
  this.writable = false;

  // encodePacket efficient as it uses WS framing
  // no need for encodePayload
  var total = packets.length;
  for (var i = 0, l = total; i < l; i++) {
    (function(packet) {
      parser.encodePacket(packet, self.supportsBinary, function(data) {
        if (!BrowserWebSocket) {
          // always create a new object (GH-437)
          var opts = {};
          if (packet.options) {
            opts.compress = packet.options.compress;
          }

          if (self.perMessageDeflate) {
            var len = 'string' == typeof data ? global.Buffer.byteLength(data) : data.length;
            if (len < self.perMessageDeflate.threshold) {
              opts.compress = false;
            }
          }
        }

        //Sometimes the websocket has already been closed but the browser didn't
        //have a chance of informing us about it yet, in that case send will
        //throw an error
        try {
          if (BrowserWebSocket) {
            // TypeError is thrown when passing the second argument on Safari
            self.ws.send(data);
          } else {
            self.ws.send(data, opts);
          }
        } catch (e){
          debug('websocket closed before onclose event');
        }

        --total || done();
      });
    })(packets[i]);
  }

  function done(){
    self.emit('flush');

    // fake drain
    // defer to next tick to allow Socket to clear writeBuffer
    setTimeout(function(){
      self.writable = true;
      self.emit('drain');
    }, 0);
  }
};

/**
 * Called upon close
 *
 * @api private
 */

WS.prototype.onClose = function(){
  Transport.prototype.onClose.call(this);
};

/**
 * Closes socket.
 *
 * @api private
 */

WS.prototype.doClose = function(){
  if (typeof this.ws !== 'undefined') {
    this.ws.close();
  }
};

/**
 * Generates uri for connection.
 *
 * @api private
 */

WS.prototype.uri = function(){
  var query = this.query || {};
  var schema = this.secure ? 'wss' : 'ws';
  var port = '';

  // avoid port if default for schema
  if (this.port && (('wss' == schema && this.port != 443)
    || ('ws' == schema && this.port != 80))) {
    port = ':' + this.port;
  }

  // append timestamp to URI
  if (this.timestampRequests) {
    query[this.timestampParam] = yeast();
  }

  // communicate binary support capabilities
  if (!this.supportsBinary) {
    query.b64 = 1;
  }

  query = parseqs.encode(query);

  // prepend ? to query
  if (query.length) {
    query = '?' + query;
  }

  var ipv6 = this.hostname.indexOf(':') !== -1;
  return schema + '://' + (ipv6 ? '[' + this.hostname + ']' : this.hostname) + port + this.path + query;
};

/**
 * Feature detection for WebSocket.
 *
 * @return {Boolean} whether this transport is available.
 * @api public
 */

WS.prototype.check = function(){
  return !!WebSocket && !('__initialize' in WebSocket && this.name === WS.prototype.name);
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{"../transport":19,"component-inherit":13,"debug":14,"engine.io-parser":27,"parseqs":37,"ws":undefined,"yeast":45}],25:[function(_dereq_,module,exports){
// browser shim for xmlhttprequest module
var hasCORS = _dereq_('has-cors');

module.exports = function(opts) {
  var xdomain = opts.xdomain;

  // scheme must be same when usign XDomainRequest
  // http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
  var xscheme = opts.xscheme;

  // XDomainRequest has a flow of not sending cookie, therefore it should be disabled as a default.
  // https://github.com/Automattic/engine.io-client/pull/217
  var enablesXDR = opts.enablesXDR;

  // XMLHttpRequest can be disabled on IE
  try {
    if ('undefined' != typeof XMLHttpRequest && (!xdomain || hasCORS)) {
      return new XMLHttpRequest();
    }
  } catch (e) { }

  // Use XDomainRequest for IE8 if enablesXDR is true
  // because loading bar keeps flashing when using jsonp-polling
  // https://github.com/yujiosaka/socke.io-ie8-loading-example
  try {
    if ('undefined' != typeof XDomainRequest && !xscheme && enablesXDR) {
      return new XDomainRequest();
    }
  } catch (e) { }

  if (!xdomain) {
    try {
      return new ActiveXObject('Microsoft.XMLHTTP');
    } catch(e) { }
  }
}

},{"has-cors":31}],26:[function(_dereq_,module,exports){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],27:[function(_dereq_,module,exports){
(function (global){
/**
 * Module dependencies.
 */

var keys = _dereq_('./keys');
var hasBinary = _dereq_('has-binary');
var sliceBuffer = _dereq_('arraybuffer.slice');
var base64encoder = _dereq_('base64-arraybuffer');
var after = _dereq_('after');
var utf8 = _dereq_('utf8');

/**
 * Check if we are running an android browser. That requires us to use
 * ArrayBuffer with polling transports...
 *
 * http://ghinda.net/jpeg-blob-ajax-android/
 */

var isAndroid = navigator.userAgent.match(/Android/i);

/**
 * Check if we are running in PhantomJS.
 * Uploading a Blob with PhantomJS does not work correctly, as reported here:
 * https://github.com/ariya/phantomjs/issues/11395
 * @type boolean
 */
var isPhantomJS = /PhantomJS/i.test(navigator.userAgent);

/**
 * When true, avoids using Blobs to encode payloads.
 * @type boolean
 */
var dontSendBlobs = isAndroid || isPhantomJS;

/**
 * Current protocol version.
 */

exports.protocol = 3;

/**
 * Packet types.
 */

var packets = exports.packets = {
    open:     0    // non-ws
  , close:    1    // non-ws
  , ping:     2
  , pong:     3
  , message:  4
  , upgrade:  5
  , noop:     6
};

var packetslist = keys(packets);

/**
 * Premade error packet.
 */

var err = { type: 'error', data: 'parser error' };

/**
 * Create a blob api even for blob builder when vendor prefixes exist
 */

var Blob = _dereq_('blob');

/**
 * Encodes a packet.
 *
 *     <packet type id> [ <data> ]
 *
 * Example:
 *
 *     5hello world
 *     3
 *     4
 *
 * Binary is encoded in an identical principle
 *
 * @api private
 */

exports.encodePacket = function (packet, supportsBinary, utf8encode, callback) {
  if ('function' == typeof supportsBinary) {
    callback = supportsBinary;
    supportsBinary = false;
  }

  if ('function' == typeof utf8encode) {
    callback = utf8encode;
    utf8encode = null;
  }

  var data = (packet.data === undefined)
    ? undefined
    : packet.data.buffer || packet.data;

  if (global.ArrayBuffer && data instanceof ArrayBuffer) {
    return encodeArrayBuffer(packet, supportsBinary, callback);
  } else if (Blob && data instanceof global.Blob) {
    return encodeBlob(packet, supportsBinary, callback);
  }

  // might be an object with { base64: true, data: dataAsBase64String }
  if (data && data.base64) {
    return encodeBase64Object(packet, callback);
  }

  // Sending data as a utf-8 string
  var encoded = packets[packet.type];

  // data fragment is optional
  if (undefined !== packet.data) {
    encoded += utf8encode ? utf8.encode(String(packet.data)) : String(packet.data);
  }

  return callback('' + encoded);

};

function encodeBase64Object(packet, callback) {
  // packet data is an object { base64: true, data: dataAsBase64String }
  var message = 'b' + exports.packets[packet.type] + packet.data.data;
  return callback(message);
}

/**
 * Encode packet helpers for binary types
 */

function encodeArrayBuffer(packet, supportsBinary, callback) {
  if (!supportsBinary) {
    return exports.encodeBase64Packet(packet, callback);
  }

  var data = packet.data;
  var contentArray = new Uint8Array(data);
  var resultBuffer = new Uint8Array(1 + data.byteLength);

  resultBuffer[0] = packets[packet.type];
  for (var i = 0; i < contentArray.length; i++) {
    resultBuffer[i+1] = contentArray[i];
  }

  return callback(resultBuffer.buffer);
}

function encodeBlobAsArrayBuffer(packet, supportsBinary, callback) {
  if (!supportsBinary) {
    return exports.encodeBase64Packet(packet, callback);
  }

  var fr = new FileReader();
  fr.onload = function() {
    packet.data = fr.result;
    exports.encodePacket(packet, supportsBinary, true, callback);
  };
  return fr.readAsArrayBuffer(packet.data);
}

function encodeBlob(packet, supportsBinary, callback) {
  if (!supportsBinary) {
    return exports.encodeBase64Packet(packet, callback);
  }

  if (dontSendBlobs) {
    return encodeBlobAsArrayBuffer(packet, supportsBinary, callback);
  }

  var length = new Uint8Array(1);
  length[0] = packets[packet.type];
  var blob = new Blob([length.buffer, packet.data]);

  return callback(blob);
}

/**
 * Encodes a packet with binary data in a base64 string
 *
 * @param {Object} packet, has `type` and `data`
 * @return {String} base64 encoded message
 */

exports.encodeBase64Packet = function(packet, callback) {
  var message = 'b' + exports.packets[packet.type];
  if (Blob && packet.data instanceof global.Blob) {
    var fr = new FileReader();
    fr.onload = function() {
      var b64 = fr.result.split(',')[1];
      callback(message + b64);
    };
    return fr.readAsDataURL(packet.data);
  }

  var b64data;
  try {
    b64data = String.fromCharCode.apply(null, new Uint8Array(packet.data));
  } catch (e) {
    // iPhone Safari doesn't let you apply with typed arrays
    var typed = new Uint8Array(packet.data);
    var basic = new Array(typed.length);
    for (var i = 0; i < typed.length; i++) {
      basic[i] = typed[i];
    }
    b64data = String.fromCharCode.apply(null, basic);
  }
  message += global.btoa(b64data);
  return callback(message);
};

/**
 * Decodes a packet. Changes format to Blob if requested.
 *
 * @return {Object} with `type` and `data` (if any)
 * @api private
 */

exports.decodePacket = function (data, binaryType, utf8decode) {
  // String data
  if (typeof data == 'string' || data === undefined) {
    if (data.charAt(0) == 'b') {
      return exports.decodeBase64Packet(data.substr(1), binaryType);
    }

    if (utf8decode) {
      try {
        data = utf8.decode(data);
      } catch (e) {
        return err;
      }
    }
    var type = data.charAt(0);

    if (Number(type) != type || !packetslist[type]) {
      return err;
    }

    if (data.length > 1) {
      return { type: packetslist[type], data: data.substring(1) };
    } else {
      return { type: packetslist[type] };
    }
  }

  var asArray = new Uint8Array(data);
  var type = asArray[0];
  var rest = sliceBuffer(data, 1);
  if (Blob && binaryType === 'blob') {
    rest = new Blob([rest]);
  }
  return { type: packetslist[type], data: rest };
};

/**
 * Decodes a packet encoded in a base64 string
 *
 * @param {String} base64 encoded message
 * @return {Object} with `type` and `data` (if any)
 */

exports.decodeBase64Packet = function(msg, binaryType) {
  var type = packetslist[msg.charAt(0)];
  if (!global.ArrayBuffer) {
    return { type: type, data: { base64: true, data: msg.substr(1) } };
  }

  var data = base64encoder.decode(msg.substr(1));

  if (binaryType === 'blob' && Blob) {
    data = new Blob([data]);
  }

  return { type: type, data: data };
};

/**
 * Encodes multiple messages (payload).
 *
 *     <length>:data
 *
 * Example:
 *
 *     11:hello world2:hi
 *
 * If any contents are binary, they will be encoded as base64 strings. Base64
 * encoded strings are marked with a b before the length specifier
 *
 * @param {Array} packets
 * @api private
 */

exports.encodePayload = function (packets, supportsBinary, callback) {
  if (typeof supportsBinary == 'function') {
    callback = supportsBinary;
    supportsBinary = null;
  }

  var isBinary = hasBinary(packets);

  if (supportsBinary && isBinary) {
    if (Blob && !dontSendBlobs) {
      return exports.encodePayloadAsBlob(packets, callback);
    }

    return exports.encodePayloadAsArrayBuffer(packets, callback);
  }

  if (!packets.length) {
    return callback('0:');
  }

  function setLengthHeader(message) {
    return message.length + ':' + message;
  }

  function encodeOne(packet, doneCallback) {
    exports.encodePacket(packet, !isBinary ? false : supportsBinary, true, function(message) {
      doneCallback(null, setLengthHeader(message));
    });
  }

  map(packets, encodeOne, function(err, results) {
    return callback(results.join(''));
  });
};

/**
 * Async array map using after
 */

function map(ary, each, done) {
  var result = new Array(ary.length);
  var next = after(ary.length, done);

  var eachWithIndex = function(i, el, cb) {
    each(el, function(error, msg) {
      result[i] = msg;
      cb(error, result);
    });
  };

  for (var i = 0; i < ary.length; i++) {
    eachWithIndex(i, ary[i], next);
  }
}

/*
 * Decodes data when a payload is maybe expected. Possible binary contents are
 * decoded from their base64 representation
 *
 * @param {String} data, callback method
 * @api public
 */

exports.decodePayload = function (data, binaryType, callback) {
  if (typeof data != 'string') {
    return exports.decodePayloadAsBinary(data, binaryType, callback);
  }

  if (typeof binaryType === 'function') {
    callback = binaryType;
    binaryType = null;
  }

  var packet;
  if (data == '') {
    // parser error - ignoring payload
    return callback(err, 0, 1);
  }

  var length = ''
    , n, msg;

  for (var i = 0, l = data.length; i < l; i++) {
    var chr = data.charAt(i);

    if (':' != chr) {
      length += chr;
    } else {
      if ('' == length || (length != (n = Number(length)))) {
        // parser error - ignoring payload
        return callback(err, 0, 1);
      }

      msg = data.substr(i + 1, n);

      if (length != msg.length) {
        // parser error - ignoring payload
        return callback(err, 0, 1);
      }

      if (msg.length) {
        packet = exports.decodePacket(msg, binaryType, true);

        if (err.type == packet.type && err.data == packet.data) {
          // parser error in individual packet - ignoring payload
          return callback(err, 0, 1);
        }

        var ret = callback(packet, i + n, l);
        if (false === ret) return;
      }

      // advance cursor
      i += n;
      length = '';
    }
  }

  if (length != '') {
    // parser error - ignoring payload
    return callback(err, 0, 1);
  }

};

/**
 * Encodes multiple messages (payload) as binary.
 *
 * <1 = binary, 0 = string><number from 0-9><number from 0-9>[...]<number
 * 255><data>
 *
 * Example:
 * 1 3 255 1 2 3, if the binary contents are interpreted as 8 bit integers
 *
 * @param {Array} packets
 * @return {ArrayBuffer} encoded payload
 * @api private
 */

exports.encodePayloadAsArrayBuffer = function(packets, callback) {
  if (!packets.length) {
    return callback(new ArrayBuffer(0));
  }

  function encodeOne(packet, doneCallback) {
    exports.encodePacket(packet, true, true, function(data) {
      return doneCallback(null, data);
    });
  }

  map(packets, encodeOne, function(err, encodedPackets) {
    var totalLength = encodedPackets.reduce(function(acc, p) {
      var len;
      if (typeof p === 'string'){
        len = p.length;
      } else {
        len = p.byteLength;
      }
      return acc + len.toString().length + len + 2; // string/binary identifier + separator = 2
    }, 0);

    var resultArray = new Uint8Array(totalLength);

    var bufferIndex = 0;
    encodedPackets.forEach(function(p) {
      var isString = typeof p === 'string';
      var ab = p;
      if (isString) {
        var view = new Uint8Array(p.length);
        for (var i = 0; i < p.length; i++) {
          view[i] = p.charCodeAt(i);
        }
        ab = view.buffer;
      }

      if (isString) { // not true binary
        resultArray[bufferIndex++] = 0;
      } else { // true binary
        resultArray[bufferIndex++] = 1;
      }

      var lenStr = ab.byteLength.toString();
      for (var i = 0; i < lenStr.length; i++) {
        resultArray[bufferIndex++] = parseInt(lenStr[i]);
      }
      resultArray[bufferIndex++] = 255;

      var view = new Uint8Array(ab);
      for (var i = 0; i < view.length; i++) {
        resultArray[bufferIndex++] = view[i];
      }
    });

    return callback(resultArray.buffer);
  });
};

/**
 * Encode as Blob
 */

exports.encodePayloadAsBlob = function(packets, callback) {
  function encodeOne(packet, doneCallback) {
    exports.encodePacket(packet, true, true, function(encoded) {
      var binaryIdentifier = new Uint8Array(1);
      binaryIdentifier[0] = 1;
      if (typeof encoded === 'string') {
        var view = new Uint8Array(encoded.length);
        for (var i = 0; i < encoded.length; i++) {
          view[i] = encoded.charCodeAt(i);
        }
        encoded = view.buffer;
        binaryIdentifier[0] = 0;
      }

      var len = (encoded instanceof ArrayBuffer)
        ? encoded.byteLength
        : encoded.size;

      var lenStr = len.toString();
      var lengthAry = new Uint8Array(lenStr.length + 1);
      for (var i = 0; i < lenStr.length; i++) {
        lengthAry[i] = parseInt(lenStr[i]);
      }
      lengthAry[lenStr.length] = 255;

      if (Blob) {
        var blob = new Blob([binaryIdentifier.buffer, lengthAry.buffer, encoded]);
        doneCallback(null, blob);
      }
    });
  }

  map(packets, encodeOne, function(err, results) {
    return callback(new Blob(results));
  });
};

/*
 * Decodes data when a payload is maybe expected. Strings are decoded by
 * interpreting each byte as a key code for entries marked to start with 0. See
 * description of encodePayloadAsBinary
 *
 * @param {ArrayBuffer} data, callback method
 * @api public
 */

exports.decodePayloadAsBinary = function (data, binaryType, callback) {
  if (typeof binaryType === 'function') {
    callback = binaryType;
    binaryType = null;
  }

  var bufferTail = data;
  var buffers = [];

  var numberTooLong = false;
  while (bufferTail.byteLength > 0) {
    var tailArray = new Uint8Array(bufferTail);
    var isString = tailArray[0] === 0;
    var msgLength = '';

    for (var i = 1; ; i++) {
      if (tailArray[i] == 255) break;

      if (msgLength.length > 310) {
        numberTooLong = true;
        break;
      }

      msgLength += tailArray[i];
    }

    if(numberTooLong) return callback(err, 0, 1);

    bufferTail = sliceBuffer(bufferTail, 2 + msgLength.length);
    msgLength = parseInt(msgLength);

    var msg = sliceBuffer(bufferTail, 0, msgLength);
    if (isString) {
      try {
        msg = String.fromCharCode.apply(null, new Uint8Array(msg));
      } catch (e) {
        // iPhone Safari doesn't let you apply to typed arrays
        var typed = new Uint8Array(msg);
        msg = '';
        for (var i = 0; i < typed.length; i++) {
          msg += String.fromCharCode(typed[i]);
        }
      }
    }

    buffers.push(msg);
    bufferTail = sliceBuffer(bufferTail, msgLength);
  }

  var total = buffers.length;
  buffers.forEach(function(buffer, i) {
    callback(exports.decodePacket(buffer, binaryType, true), i, total);
  });
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{"./keys":28,"after":6,"arraybuffer.slice":7,"base64-arraybuffer":9,"blob":10,"has-binary":29,"utf8":44}],28:[function(_dereq_,module,exports){

/**
 * Gets the keys for an object.
 *
 * @return {Array} keys
 * @api private
 */

module.exports = Object.keys || function keys (obj){
  var arr = [];
  var has = Object.prototype.hasOwnProperty;

  for (var i in obj) {
    if (has.call(obj, i)) {
      arr.push(i);
    }
  }
  return arr;
};

},{}],29:[function(_dereq_,module,exports){
(function (global){

/*
 * Module requirements.
 */

var isArray = _dereq_('isarray');

/**
 * Module exports.
 */

module.exports = hasBinary;

/**
 * Checks for binary data.
 *
 * Right now only Buffer and ArrayBuffer are supported..
 *
 * @param {Object} anything
 * @api public
 */

function hasBinary(data) {

  function _hasBinary(obj) {
    if (!obj) return false;

    if ( (global.Buffer && global.Buffer.isBuffer(obj)) ||
         (global.ArrayBuffer && obj instanceof ArrayBuffer) ||
         (global.Blob && obj instanceof Blob) ||
         (global.File && obj instanceof File)
        ) {
      return true;
    }

    if (isArray(obj)) {
      for (var i = 0; i < obj.length; i++) {
          if (_hasBinary(obj[i])) {
              return true;
          }
      }
    } else if (obj && 'object' == typeof obj) {
      if (obj.toJSON) {
        obj = obj.toJSON();
      }

      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && _hasBinary(obj[key])) {
          return true;
        }
      }
    }

    return false;
  }

  return _hasBinary(data);
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{"isarray":33}],30:[function(_dereq_,module,exports){
(function (global){

/*
 * Module requirements.
 */

var isArray = _dereq_('isarray');

/**
 * Module exports.
 */

module.exports = hasBinary;

/**
 * Checks for binary data.
 *
 * Right now only Buffer and ArrayBuffer are supported..
 *
 * @param {Object} anything
 * @api public
 */

function hasBinary(data) {

  function _hasBinary(obj) {
    if (!obj) return false;

    if ( (global.Buffer && global.Buffer.isBuffer && global.Buffer.isBuffer(obj)) ||
         (global.ArrayBuffer && obj instanceof ArrayBuffer) ||
         (global.Blob && obj instanceof Blob) ||
         (global.File && obj instanceof File)
        ) {
      return true;
    }

    if (isArray(obj)) {
      for (var i = 0; i < obj.length; i++) {
          if (_hasBinary(obj[i])) {
              return true;
          }
      }
    } else if (obj && 'object' == typeof obj) {
      // see: https://github.com/Automattic/has-binary/pull/4
      if (obj.toJSON && 'function' == typeof obj.toJSON) {
        obj = obj.toJSON();
      }

      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && _hasBinary(obj[key])) {
          return true;
        }
      }
    }

    return false;
  }

  return _hasBinary(data);
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{"isarray":33}],31:[function(_dereq_,module,exports){

/**
 * Module exports.
 *
 * Logic borrowed from Modernizr:
 *
 *   - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/cors.js
 */

try {
  module.exports = typeof XMLHttpRequest !== 'undefined' &&
    'withCredentials' in new XMLHttpRequest();
} catch (err) {
  // if XMLHttp support is disabled in IE then it will throw
  // when trying to create
  module.exports = false;
}

},{}],32:[function(_dereq_,module,exports){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
},{}],33:[function(_dereq_,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],34:[function(_dereq_,module,exports){
(function (global){
/*! JSON v3.3.2 | http://bestiejs.github.io/json3 | Copyright 2012-2014, Kit Cambridge | http://kit.mit-license.org */
;(function () {
  // Detect the `define` function exposed by asynchronous module loaders. The
  // strict `define` check is necessary for compatibility with `r.js`.
  var isLoader = typeof define === "function" && define.amd;

  // A set of types used to distinguish objects from primitives.
  var objectTypes = {
    "function": true,
    "object": true
  };

  // Detect the `exports` object exposed by CommonJS implementations.
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  // Use the `global` object exposed by Node (including Browserify via
  // `insert-module-globals`), Narwhal, and Ringo as the default context,
  // and the `window` object in browsers. Rhino exports a `global` function
  // instead.
  var root = objectTypes[typeof window] && window || this,
      freeGlobal = freeExports && objectTypes[typeof module] && module && !module.nodeType && typeof global == "object" && global;

  if (freeGlobal && (freeGlobal["global"] === freeGlobal || freeGlobal["window"] === freeGlobal || freeGlobal["self"] === freeGlobal)) {
    root = freeGlobal;
  }

  // Public: Initializes JSON 3 using the given `context` object, attaching the
  // `stringify` and `parse` functions to the specified `exports` object.
  function runInContext(context, exports) {
    context || (context = root["Object"]());
    exports || (exports = root["Object"]());

    // Native constructor aliases.
    var Number = context["Number"] || root["Number"],
        String = context["String"] || root["String"],
        Object = context["Object"] || root["Object"],
        Date = context["Date"] || root["Date"],
        SyntaxError = context["SyntaxError"] || root["SyntaxError"],
        TypeError = context["TypeError"] || root["TypeError"],
        Math = context["Math"] || root["Math"],
        nativeJSON = context["JSON"] || root["JSON"];

    // Delegate to the native `stringify` and `parse` implementations.
    if (typeof nativeJSON == "object" && nativeJSON) {
      exports.stringify = nativeJSON.stringify;
      exports.parse = nativeJSON.parse;
    }

    // Convenience aliases.
    var objectProto = Object.prototype,
        getClass = objectProto.toString,
        isProperty, forEach, undef;

    // Test the `Date#getUTC*` methods. Based on work by @Yaffle.
    var isExtended = new Date(-3509827334573292);
    try {
      // The `getUTCFullYear`, `Month`, and `Date` methods return nonsensical
      // results for certain dates in Opera >= 10.53.
      isExtended = isExtended.getUTCFullYear() == -109252 && isExtended.getUTCMonth() === 0 && isExtended.getUTCDate() === 1 &&
        // Safari < 2.0.2 stores the internal millisecond time value correctly,
        // but clips the values returned by the date methods to the range of
        // signed 32-bit integers ([-2 ** 31, 2 ** 31 - 1]).
        isExtended.getUTCHours() == 10 && isExtended.getUTCMinutes() == 37 && isExtended.getUTCSeconds() == 6 && isExtended.getUTCMilliseconds() == 708;
    } catch (exception) {}

    // Internal: Determines whether the native `JSON.stringify` and `parse`
    // implementations are spec-compliant. Based on work by Ken Snyder.
    function has(name) {
      if (has[name] !== undef) {
        // Return cached feature test result.
        return has[name];
      }
      var isSupported;
      if (name == "bug-string-char-index") {
        // IE <= 7 doesn't support accessing string characters using square
        // bracket notation. IE 8 only supports this for primitives.
        isSupported = "a"[0] != "a";
      } else if (name == "json") {
        // Indicates whether both `JSON.stringify` and `JSON.parse` are
        // supported.
        isSupported = has("json-stringify") && has("json-parse");
      } else {
        var value, serialized = '{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}';
        // Test `JSON.stringify`.
        if (name == "json-stringify") {
          var stringify = exports.stringify, stringifySupported = typeof stringify == "function" && isExtended;
          if (stringifySupported) {
            // A test function object with a custom `toJSON` method.
            (value = function () {
              return 1;
            }).toJSON = value;
            try {
              stringifySupported =
                // Firefox 3.1b1 and b2 serialize string, number, and boolean
                // primitives as object literals.
                stringify(0) === "0" &&
                // FF 3.1b1, b2, and JSON 2 serialize wrapped primitives as object
                // literals.
                stringify(new Number()) === "0" &&
                stringify(new String()) == '""' &&
                // FF 3.1b1, 2 throw an error if the value is `null`, `undefined`, or
                // does not define a canonical JSON representation (this applies to
                // objects with `toJSON` properties as well, *unless* they are nested
                // within an object or array).
                stringify(getClass) === undef &&
                // IE 8 serializes `undefined` as `"undefined"`. Safari <= 5.1.7 and
                // FF 3.1b3 pass this test.
                stringify(undef) === undef &&
                // Safari <= 5.1.7 and FF 3.1b3 throw `Error`s and `TypeError`s,
                // respectively, if the value is omitted entirely.
                stringify() === undef &&
                // FF 3.1b1, 2 throw an error if the given value is not a number,
                // string, array, object, Boolean, or `null` literal. This applies to
                // objects with custom `toJSON` methods as well, unless they are nested
                // inside object or array literals. YUI 3.0.0b1 ignores custom `toJSON`
                // methods entirely.
                stringify(value) === "1" &&
                stringify([value]) == "[1]" &&
                // Prototype <= 1.6.1 serializes `[undefined]` as `"[]"` instead of
                // `"[null]"`.
                stringify([undef]) == "[null]" &&
                // YUI 3.0.0b1 fails to serialize `null` literals.
                stringify(null) == "null" &&
                // FF 3.1b1, 2 halts serialization if an array contains a function:
                // `[1, true, getClass, 1]` serializes as "[1,true,],". FF 3.1b3
                // elides non-JSON values from objects and arrays, unless they
                // define custom `toJSON` methods.
                stringify([undef, getClass, null]) == "[null,null,null]" &&
                // Simple serialization test. FF 3.1b1 uses Unicode escape sequences
                // where character escape codes are expected (e.g., `\b` => `\u0008`).
                stringify({ "a": [value, true, false, null, "\x00\b\n\f\r\t"] }) == serialized &&
                // FF 3.1b1 and b2 ignore the `filter` and `width` arguments.
                stringify(null, value) === "1" &&
                stringify([1, 2], null, 1) == "[\n 1,\n 2\n]" &&
                // JSON 2, Prototype <= 1.7, and older WebKit builds incorrectly
                // serialize extended years.
                stringify(new Date(-8.64e15)) == '"-271821-04-20T00:00:00.000Z"' &&
                // The milliseconds are optional in ES 5, but required in 5.1.
                stringify(new Date(8.64e15)) == '"+275760-09-13T00:00:00.000Z"' &&
                // Firefox <= 11.0 incorrectly serializes years prior to 0 as negative
                // four-digit years instead of six-digit years. Credits: @Yaffle.
                stringify(new Date(-621987552e5)) == '"-000001-01-01T00:00:00.000Z"' &&
                // Safari <= 5.1.5 and Opera >= 10.53 incorrectly serialize millisecond
                // values less than 1000. Credits: @Yaffle.
                stringify(new Date(-1)) == '"1969-12-31T23:59:59.999Z"';
            } catch (exception) {
              stringifySupported = false;
            }
          }
          isSupported = stringifySupported;
        }
        // Test `JSON.parse`.
        if (name == "json-parse") {
          var parse = exports.parse;
          if (typeof parse == "function") {
            try {
              // FF 3.1b1, b2 will throw an exception if a bare literal is provided.
              // Conforming implementations should also coerce the initial argument to
              // a string prior to parsing.
              if (parse("0") === 0 && !parse(false)) {
                // Simple parsing test.
                value = parse(serialized);
                var parseSupported = value["a"].length == 5 && value["a"][0] === 1;
                if (parseSupported) {
                  try {
                    // Safari <= 5.1.2 and FF 3.1b1 allow unescaped tabs in strings.
                    parseSupported = !parse('"\t"');
                  } catch (exception) {}
                  if (parseSupported) {
                    try {
                      // FF 4.0 and 4.0.1 allow leading `+` signs and leading
                      // decimal points. FF 4.0, 4.0.1, and IE 9-10 also allow
                      // certain octal literals.
                      parseSupported = parse("01") !== 1;
                    } catch (exception) {}
                  }
                  if (parseSupported) {
                    try {
                      // FF 4.0, 4.0.1, and Rhino 1.7R3-R4 allow trailing decimal
                      // points. These environments, along with FF 3.1b1 and 2,
                      // also allow trailing commas in JSON objects and arrays.
                      parseSupported = parse("1.") !== 1;
                    } catch (exception) {}
                  }
                }
              }
            } catch (exception) {
              parseSupported = false;
            }
          }
          isSupported = parseSupported;
        }
      }
      return has[name] = !!isSupported;
    }

    if (!has("json")) {
      // Common `[[Class]]` name aliases.
      var functionClass = "[object Function]",
          dateClass = "[object Date]",
          numberClass = "[object Number]",
          stringClass = "[object String]",
          arrayClass = "[object Array]",
          booleanClass = "[object Boolean]";

      // Detect incomplete support for accessing string characters by index.
      var charIndexBuggy = has("bug-string-char-index");

      // Define additional utility methods if the `Date` methods are buggy.
      if (!isExtended) {
        var floor = Math.floor;
        // A mapping between the months of the year and the number of days between
        // January 1st and the first of the respective month.
        var Months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        // Internal: Calculates the number of days between the Unix epoch and the
        // first day of the given month.
        var getDay = function (year, month) {
          return Months[month] + 365 * (year - 1970) + floor((year - 1969 + (month = +(month > 1))) / 4) - floor((year - 1901 + month) / 100) + floor((year - 1601 + month) / 400);
        };
      }

      // Internal: Determines if a property is a direct property of the given
      // object. Delegates to the native `Object#hasOwnProperty` method.
      if (!(isProperty = objectProto.hasOwnProperty)) {
        isProperty = function (property) {
          var members = {}, constructor;
          if ((members.__proto__ = null, members.__proto__ = {
            // The *proto* property cannot be set multiple times in recent
            // versions of Firefox and SeaMonkey.
            "toString": 1
          }, members).toString != getClass) {
            // Safari <= 2.0.3 doesn't implement `Object#hasOwnProperty`, but
            // supports the mutable *proto* property.
            isProperty = function (property) {
              // Capture and break the object's prototype chain (see section 8.6.2
              // of the ES 5.1 spec). The parenthesized expression prevents an
              // unsafe transformation by the Closure Compiler.
              var original = this.__proto__, result = property in (this.__proto__ = null, this);
              // Restore the original prototype chain.
              this.__proto__ = original;
              return result;
            };
          } else {
            // Capture a reference to the top-level `Object` constructor.
            constructor = members.constructor;
            // Use the `constructor` property to simulate `Object#hasOwnProperty` in
            // other environments.
            isProperty = function (property) {
              var parent = (this.constructor || constructor).prototype;
              return property in this && !(property in parent && this[property] === parent[property]);
            };
          }
          members = null;
          return isProperty.call(this, property);
        };
      }

      // Internal: Normalizes the `for...in` iteration algorithm across
      // environments. Each enumerated key is yielded to a `callback` function.
      forEach = function (object, callback) {
        var size = 0, Properties, members, property;

        // Tests for bugs in the current environment's `for...in` algorithm. The
        // `valueOf` property inherits the non-enumerable flag from
        // `Object.prototype` in older versions of IE, Netscape, and Mozilla.
        (Properties = function () {
          this.valueOf = 0;
        }).prototype.valueOf = 0;

        // Iterate over a new instance of the `Properties` class.
        members = new Properties();
        for (property in members) {
          // Ignore all properties inherited from `Object.prototype`.
          if (isProperty.call(members, property)) {
            size++;
          }
        }
        Properties = members = null;

        // Normalize the iteration algorithm.
        if (!size) {
          // A list of non-enumerable properties inherited from `Object.prototype`.
          members = ["valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor"];
          // IE <= 8, Mozilla 1.0, and Netscape 6.2 ignore shadowed non-enumerable
          // properties.
          forEach = function (object, callback) {
            var isFunction = getClass.call(object) == functionClass, property, length;
            var hasProperty = !isFunction && typeof object.constructor != "function" && objectTypes[typeof object.hasOwnProperty] && object.hasOwnProperty || isProperty;
            for (property in object) {
              // Gecko <= 1.0 enumerates the `prototype` property of functions under
              // certain conditions; IE does not.
              if (!(isFunction && property == "prototype") && hasProperty.call(object, property)) {
                callback(property);
              }
            }
            // Manually invoke the callback for each non-enumerable property.
            for (length = members.length; property = members[--length]; hasProperty.call(object, property) && callback(property));
          };
        } else if (size == 2) {
          // Safari <= 2.0.4 enumerates shadowed properties twice.
          forEach = function (object, callback) {
            // Create a set of iterated properties.
            var members = {}, isFunction = getClass.call(object) == functionClass, property;
            for (property in object) {
              // Store each property name to prevent double enumeration. The
              // `prototype` property of functions is not enumerated due to cross-
              // environment inconsistencies.
              if (!(isFunction && property == "prototype") && !isProperty.call(members, property) && (members[property] = 1) && isProperty.call(object, property)) {
                callback(property);
              }
            }
          };
        } else {
          // No bugs detected; use the standard `for...in` algorithm.
          forEach = function (object, callback) {
            var isFunction = getClass.call(object) == functionClass, property, isConstructor;
            for (property in object) {
              if (!(isFunction && property == "prototype") && isProperty.call(object, property) && !(isConstructor = property === "constructor")) {
                callback(property);
              }
            }
            // Manually invoke the callback for the `constructor` property due to
            // cross-environment inconsistencies.
            if (isConstructor || isProperty.call(object, (property = "constructor"))) {
              callback(property);
            }
          };
        }
        return forEach(object, callback);
      };

      // Public: Serializes a JavaScript `value` as a JSON string. The optional
      // `filter` argument may specify either a function that alters how object and
      // array members are serialized, or an array of strings and numbers that
      // indicates which properties should be serialized. The optional `width`
      // argument may be either a string or number that specifies the indentation
      // level of the output.
      if (!has("json-stringify")) {
        // Internal: A map of control characters and their escaped equivalents.
        var Escapes = {
          92: "\\\\",
          34: '\\"',
          8: "\\b",
          12: "\\f",
          10: "\\n",
          13: "\\r",
          9: "\\t"
        };

        // Internal: Converts `value` into a zero-padded string such that its
        // length is at least equal to `width`. The `width` must be <= 6.
        var leadingZeroes = "000000";
        var toPaddedString = function (width, value) {
          // The `|| 0` expression is necessary to work around a bug in
          // Opera <= 7.54u2 where `0 == -0`, but `String(-0) !== "0"`.
          return (leadingZeroes + (value || 0)).slice(-width);
        };

        // Internal: Double-quotes a string `value`, replacing all ASCII control
        // characters (characters with code unit values between 0 and 31) with
        // their escaped equivalents. This is an implementation of the
        // `Quote(value)` operation defined in ES 5.1 section 15.12.3.
        var unicodePrefix = "\\u00";
        var quote = function (value) {
          var result = '"', index = 0, length = value.length, useCharIndex = !charIndexBuggy || length > 10;
          var symbols = useCharIndex && (charIndexBuggy ? value.split("") : value);
          for (; index < length; index++) {
            var charCode = value.charCodeAt(index);
            // If the character is a control character, append its Unicode or
            // shorthand escape sequence; otherwise, append the character as-is.
            switch (charCode) {
              case 8: case 9: case 10: case 12: case 13: case 34: case 92:
                result += Escapes[charCode];
                break;
              default:
                if (charCode < 32) {
                  result += unicodePrefix + toPaddedString(2, charCode.toString(16));
                  break;
                }
                result += useCharIndex ? symbols[index] : value.charAt(index);
            }
          }
          return result + '"';
        };

        // Internal: Recursively serializes an object. Implements the
        // `Str(key, holder)`, `JO(value)`, and `JA(value)` operations.
        var serialize = function (property, object, callback, properties, whitespace, indentation, stack) {
          var value, className, year, month, date, time, hours, minutes, seconds, milliseconds, results, element, index, length, prefix, result;
          try {
            // Necessary for host object support.
            value = object[property];
          } catch (exception) {}
          if (typeof value == "object" && value) {
            className = getClass.call(value);
            if (className == dateClass && !isProperty.call(value, "toJSON")) {
              if (value > -1 / 0 && value < 1 / 0) {
                // Dates are serialized according to the `Date#toJSON` method
                // specified in ES 5.1 section 15.9.5.44. See section 15.9.1.15
                // for the ISO 8601 date time string format.
                if (getDay) {
                  // Manually compute the year, month, date, hours, minutes,
                  // seconds, and milliseconds if the `getUTC*` methods are
                  // buggy. Adapted from @Yaffle's `date-shim` project.
                  date = floor(value / 864e5);
                  for (year = floor(date / 365.2425) + 1970 - 1; getDay(year + 1, 0) <= date; year++);
                  for (month = floor((date - getDay(year, 0)) / 30.42); getDay(year, month + 1) <= date; month++);
                  date = 1 + date - getDay(year, month);
                  // The `time` value specifies the time within the day (see ES
                  // 5.1 section 15.9.1.2). The formula `(A % B + B) % B` is used
                  // to compute `A modulo B`, as the `%` operator does not
                  // correspond to the `modulo` operation for negative numbers.
                  time = (value % 864e5 + 864e5) % 864e5;
                  // The hours, minutes, seconds, and milliseconds are obtained by
                  // decomposing the time within the day. See section 15.9.1.10.
                  hours = floor(time / 36e5) % 24;
                  minutes = floor(time / 6e4) % 60;
                  seconds = floor(time / 1e3) % 60;
                  milliseconds = time % 1e3;
                } else {
                  year = value.getUTCFullYear();
                  month = value.getUTCMonth();
                  date = value.getUTCDate();
                  hours = value.getUTCHours();
                  minutes = value.getUTCMinutes();
                  seconds = value.getUTCSeconds();
                  milliseconds = value.getUTCMilliseconds();
                }
                // Serialize extended years correctly.
                value = (year <= 0 || year >= 1e4 ? (year < 0 ? "-" : "+") + toPaddedString(6, year < 0 ? -year : year) : toPaddedString(4, year)) +
                  "-" + toPaddedString(2, month + 1) + "-" + toPaddedString(2, date) +
                  // Months, dates, hours, minutes, and seconds should have two
                  // digits; milliseconds should have three.
                  "T" + toPaddedString(2, hours) + ":" + toPaddedString(2, minutes) + ":" + toPaddedString(2, seconds) +
                  // Milliseconds are optional in ES 5.0, but required in 5.1.
                  "." + toPaddedString(3, milliseconds) + "Z";
              } else {
                value = null;
              }
            } else if (typeof value.toJSON == "function" && ((className != numberClass && className != stringClass && className != arrayClass) || isProperty.call(value, "toJSON"))) {
              // Prototype <= 1.6.1 adds non-standard `toJSON` methods to the
              // `Number`, `String`, `Date`, and `Array` prototypes. JSON 3
              // ignores all `toJSON` methods on these objects unless they are
              // defined directly on an instance.
              value = value.toJSON(property);
            }
          }
          if (callback) {
            // If a replacement function was provided, call it to obtain the value
            // for serialization.
            value = callback.call(object, property, value);
          }
          if (value === null) {
            return "null";
          }
          className = getClass.call(value);
          if (className == booleanClass) {
            // Booleans are represented literally.
            return "" + value;
          } else if (className == numberClass) {
            // JSON numbers must be finite. `Infinity` and `NaN` are serialized as
            // `"null"`.
            return value > -1 / 0 && value < 1 / 0 ? "" + value : "null";
          } else if (className == stringClass) {
            // Strings are double-quoted and escaped.
            return quote("" + value);
          }
          // Recursively serialize objects and arrays.
          if (typeof value == "object") {
            // Check for cyclic structures. This is a linear search; performance
            // is inversely proportional to the number of unique nested objects.
            for (length = stack.length; length--;) {
              if (stack[length] === value) {
                // Cyclic structures cannot be serialized by `JSON.stringify`.
                throw TypeError();
              }
            }
            // Add the object to the stack of traversed objects.
            stack.push(value);
            results = [];
            // Save the current indentation level and indent one additional level.
            prefix = indentation;
            indentation += whitespace;
            if (className == arrayClass) {
              // Recursively serialize array elements.
              for (index = 0, length = value.length; index < length; index++) {
                element = serialize(index, value, callback, properties, whitespace, indentation, stack);
                results.push(element === undef ? "null" : element);
              }
              result = results.length ? (whitespace ? "[\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "]" : ("[" + results.join(",") + "]")) : "[]";
            } else {
              // Recursively serialize object members. Members are selected from
              // either a user-specified list of property names, or the object
              // itself.
              forEach(properties || value, function (property) {
                var element = serialize(property, value, callback, properties, whitespace, indentation, stack);
                if (element !== undef) {
                  // According to ES 5.1 section 15.12.3: "If `gap` {whitespace}
                  // is not the empty string, let `member` {quote(property) + ":"}
                  // be the concatenation of `member` and the `space` character."
                  // The "`space` character" refers to the literal space
                  // character, not the `space` {width} argument provided to
                  // `JSON.stringify`.
                  results.push(quote(property) + ":" + (whitespace ? " " : "") + element);
                }
              });
              result = results.length ? (whitespace ? "{\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "}" : ("{" + results.join(",") + "}")) : "{}";
            }
            // Remove the object from the traversed object stack.
            stack.pop();
            return result;
          }
        };

        // Public: `JSON.stringify`. See ES 5.1 section 15.12.3.
        exports.stringify = function (source, filter, width) {
          var whitespace, callback, properties, className;
          if (objectTypes[typeof filter] && filter) {
            if ((className = getClass.call(filter)) == functionClass) {
              callback = filter;
            } else if (className == arrayClass) {
              // Convert the property names array into a makeshift set.
              properties = {};
              for (var index = 0, length = filter.length, value; index < length; value = filter[index++], ((className = getClass.call(value)), className == stringClass || className == numberClass) && (properties[value] = 1));
            }
          }
          if (width) {
            if ((className = getClass.call(width)) == numberClass) {
              // Convert the `width` to an integer and create a string containing
              // `width` number of space characters.
              if ((width -= width % 1) > 0) {
                for (whitespace = "", width > 10 && (width = 10); whitespace.length < width; whitespace += " ");
              }
            } else if (className == stringClass) {
              whitespace = width.length <= 10 ? width : width.slice(0, 10);
            }
          }
          // Opera <= 7.54u2 discards the values associated with empty string keys
          // (`""`) only if they are used directly within an object member list
          // (e.g., `!("" in { "": 1})`).
          return serialize("", (value = {}, value[""] = source, value), callback, properties, whitespace, "", []);
        };
      }

      // Public: Parses a JSON source string.
      if (!has("json-parse")) {
        var fromCharCode = String.fromCharCode;

        // Internal: A map of escaped control characters and their unescaped
        // equivalents.
        var Unescapes = {
          92: "\\",
          34: '"',
          47: "/",
          98: "\b",
          116: "\t",
          110: "\n",
          102: "\f",
          114: "\r"
        };

        // Internal: Stores the parser state.
        var Index, Source;

        // Internal: Resets the parser state and throws a `SyntaxError`.
        var abort = function () {
          Index = Source = null;
          throw SyntaxError();
        };

        // Internal: Returns the next token, or `"$"` if the parser has reached
        // the end of the source string. A token may be a string, number, `null`
        // literal, or Boolean literal.
        var lex = function () {
          var source = Source, length = source.length, value, begin, position, isSigned, charCode;
          while (Index < length) {
            charCode = source.charCodeAt(Index);
            switch (charCode) {
              case 9: case 10: case 13: case 32:
                // Skip whitespace tokens, including tabs, carriage returns, line
                // feeds, and space characters.
                Index++;
                break;
              case 123: case 125: case 91: case 93: case 58: case 44:
                // Parse a punctuator token (`{`, `}`, `[`, `]`, `:`, or `,`) at
                // the current position.
                value = charIndexBuggy ? source.charAt(Index) : source[Index];
                Index++;
                return value;
              case 34:
                // `"` delimits a JSON string; advance to the next character and
                // begin parsing the string. String tokens are prefixed with the
                // sentinel `@` character to distinguish them from punctuators and
                // end-of-string tokens.
                for (value = "@", Index++; Index < length;) {
                  charCode = source.charCodeAt(Index);
                  if (charCode < 32) {
                    // Unescaped ASCII control characters (those with a code unit
                    // less than the space character) are not permitted.
                    abort();
                  } else if (charCode == 92) {
                    // A reverse solidus (`\`) marks the beginning of an escaped
                    // control character (including `"`, `\`, and `/`) or Unicode
                    // escape sequence.
                    charCode = source.charCodeAt(++Index);
                    switch (charCode) {
                      case 92: case 34: case 47: case 98: case 116: case 110: case 102: case 114:
                        // Revive escaped control characters.
                        value += Unescapes[charCode];
                        Index++;
                        break;
                      case 117:
                        // `\u` marks the beginning of a Unicode escape sequence.
                        // Advance to the first character and validate the
                        // four-digit code point.
                        begin = ++Index;
                        for (position = Index + 4; Index < position; Index++) {
                          charCode = source.charCodeAt(Index);
                          // A valid sequence comprises four hexdigits (case-
                          // insensitive) that form a single hexadecimal value.
                          if (!(charCode >= 48 && charCode <= 57 || charCode >= 97 && charCode <= 102 || charCode >= 65 && charCode <= 70)) {
                            // Invalid Unicode escape sequence.
                            abort();
                          }
                        }
                        // Revive the escaped character.
                        value += fromCharCode("0x" + source.slice(begin, Index));
                        break;
                      default:
                        // Invalid escape sequence.
                        abort();
                    }
                  } else {
                    if (charCode == 34) {
                      // An unescaped double-quote character marks the end of the
                      // string.
                      break;
                    }
                    charCode = source.charCodeAt(Index);
                    begin = Index;
                    // Optimize for the common case where a string is valid.
                    while (charCode >= 32 && charCode != 92 && charCode != 34) {
                      charCode = source.charCodeAt(++Index);
                    }
                    // Append the string as-is.
                    value += source.slice(begin, Index);
                  }
                }
                if (source.charCodeAt(Index) == 34) {
                  // Advance to the next character and return the revived string.
                  Index++;
                  return value;
                }
                // Unterminated string.
                abort();
              default:
                // Parse numbers and literals.
                begin = Index;
                // Advance past the negative sign, if one is specified.
                if (charCode == 45) {
                  isSigned = true;
                  charCode = source.charCodeAt(++Index);
                }
                // Parse an integer or floating-point value.
                if (charCode >= 48 && charCode <= 57) {
                  // Leading zeroes are interpreted as octal literals.
                  if (charCode == 48 && ((charCode = source.charCodeAt(Index + 1)), charCode >= 48 && charCode <= 57)) {
                    // Illegal octal literal.
                    abort();
                  }
                  isSigned = false;
                  // Parse the integer component.
                  for (; Index < length && ((charCode = source.charCodeAt(Index)), charCode >= 48 && charCode <= 57); Index++);
                  // Floats cannot contain a leading decimal point; however, this
                  // case is already accounted for by the parser.
                  if (source.charCodeAt(Index) == 46) {
                    position = ++Index;
                    // Parse the decimal component.
                    for (; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
                    if (position == Index) {
                      // Illegal trailing decimal.
                      abort();
                    }
                    Index = position;
                  }
                  // Parse exponents. The `e` denoting the exponent is
                  // case-insensitive.
                  charCode = source.charCodeAt(Index);
                  if (charCode == 101 || charCode == 69) {
                    charCode = source.charCodeAt(++Index);
                    // Skip past the sign following the exponent, if one is
                    // specified.
                    if (charCode == 43 || charCode == 45) {
                      Index++;
                    }
                    // Parse the exponential component.
                    for (position = Index; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
                    if (position == Index) {
                      // Illegal empty exponent.
                      abort();
                    }
                    Index = position;
                  }
                  // Coerce the parsed value to a JavaScript number.
                  return +source.slice(begin, Index);
                }
                // A negative sign may only precede numbers.
                if (isSigned) {
                  abort();
                }
                // `true`, `false`, and `null` literals.
                if (source.slice(Index, Index + 4) == "true") {
                  Index += 4;
                  return true;
                } else if (source.slice(Index, Index + 5) == "false") {
                  Index += 5;
                  return false;
                } else if (source.slice(Index, Index + 4) == "null") {
                  Index += 4;
                  return null;
                }
                // Unrecognized token.
                abort();
            }
          }
          // Return the sentinel `$` character if the parser has reached the end
          // of the source string.
          return "$";
        };

        // Internal: Parses a JSON `value` token.
        var get = function (value) {
          var results, hasMembers;
          if (value == "$") {
            // Unexpected end of input.
            abort();
          }
          if (typeof value == "string") {
            if ((charIndexBuggy ? value.charAt(0) : value[0]) == "@") {
              // Remove the sentinel `@` character.
              return value.slice(1);
            }
            // Parse object and array literals.
            if (value == "[") {
              // Parses a JSON array, returning a new JavaScript array.
              results = [];
              for (;; hasMembers || (hasMembers = true)) {
                value = lex();
                // A closing square bracket marks the end of the array literal.
                if (value == "]") {
                  break;
                }
                // If the array literal contains elements, the current token
                // should be a comma separating the previous element from the
                // next.
                if (hasMembers) {
                  if (value == ",") {
                    value = lex();
                    if (value == "]") {
                      // Unexpected trailing `,` in array literal.
                      abort();
                    }
                  } else {
                    // A `,` must separate each array element.
                    abort();
                  }
                }
                // Elisions and leading commas are not permitted.
                if (value == ",") {
                  abort();
                }
                results.push(get(value));
              }
              return results;
            } else if (value == "{") {
              // Parses a JSON object, returning a new JavaScript object.
              results = {};
              for (;; hasMembers || (hasMembers = true)) {
                value = lex();
                // A closing curly brace marks the end of the object literal.
                if (value == "}") {
                  break;
                }
                // If the object literal contains members, the current token
                // should be a comma separator.
                if (hasMembers) {
                  if (value == ",") {
                    value = lex();
                    if (value == "}") {
                      // Unexpected trailing `,` in object literal.
                      abort();
                    }
                  } else {
                    // A `,` must separate each object member.
                    abort();
                  }
                }
                // Leading commas are not permitted, object property names must be
                // double-quoted strings, and a `:` must separate each property
                // name and value.
                if (value == "," || typeof value != "string" || (charIndexBuggy ? value.charAt(0) : value[0]) != "@" || lex() != ":") {
                  abort();
                }
                results[value.slice(1)] = get(lex());
              }
              return results;
            }
            // Unexpected token encountered.
            abort();
          }
          return value;
        };

        // Internal: Updates a traversed object member.
        var update = function (source, property, callback) {
          var element = walk(source, property, callback);
          if (element === undef) {
            delete source[property];
          } else {
            source[property] = element;
          }
        };

        // Internal: Recursively traverses a parsed JSON object, invoking the
        // `callback` function for each value. This is an implementation of the
        // `Walk(holder, name)` operation defined in ES 5.1 section 15.12.2.
        var walk = function (source, property, callback) {
          var value = source[property], length;
          if (typeof value == "object" && value) {
            // `forEach` can't be used to traverse an array in Opera <= 8.54
            // because its `Object#hasOwnProperty` implementation returns `false`
            // for array indices (e.g., `![1, 2, 3].hasOwnProperty("0")`).
            if (getClass.call(value) == arrayClass) {
              for (length = value.length; length--;) {
                update(value, length, callback);
              }
            } else {
              forEach(value, function (property) {
                update(value, property, callback);
              });
            }
          }
          return callback.call(source, property, value);
        };

        // Public: `JSON.parse`. See ES 5.1 section 15.12.2.
        exports.parse = function (source, callback) {
          var result, value;
          Index = 0;
          Source = "" + source;
          result = get(lex());
          // If a JSON string contains multiple tokens, it is invalid.
          if (lex() != "$") {
            abort();
          }
          // Reset the parser state.
          Index = Source = null;
          return callback && getClass.call(callback) == functionClass ? walk((value = {}, value[""] = result, value), "", callback) : result;
        };
      }
    }

    exports["runInContext"] = runInContext;
    return exports;
  }

  if (freeExports && !isLoader) {
    // Export for CommonJS environments.
    runInContext(root, freeExports);
  } else {
    // Export for web browsers and JavaScript engines.
    var nativeJSON = root.JSON,
        previousJSON = root["JSON3"],
        isRestored = false;

    var JSON3 = runInContext(root, (root["JSON3"] = {
      // Public: Restores the original value of the global `JSON` object and
      // returns a reference to the `JSON3` object.
      "noConflict": function () {
        if (!isRestored) {
          isRestored = true;
          root.JSON = nativeJSON;
          root["JSON3"] = previousJSON;
          nativeJSON = previousJSON = null;
        }
        return JSON3;
      }
    }));

    root.JSON = {
      "parse": JSON3.parse,
      "stringify": JSON3.stringify
    };
  }

  // Export for asynchronous module loaders.
  if (isLoader) {
    define(function () {
      return JSON3;
    });
  }
}).call(this);

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{}],35:[function(_dereq_,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options){
  options = options || {};
  if ('string' == typeof val) return parse(val);
  return options.long
    ? long(val)
    : short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = '' + str;
  if (str.length > 10000) return;
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
  if (!match) return;
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
  if (ms >= d) return Math.round(ms / d) + 'd';
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
  return plural(ms, d, 'day')
    || plural(ms, h, 'hour')
    || plural(ms, m, 'minute')
    || plural(ms, s, 'second')
    || ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) return;
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],36:[function(_dereq_,module,exports){
(function (global){
/**
 * JSON parse.
 *
 * @see Based on jQuery#parseJSON (MIT) and JSON2
 * @api private
 */

var rvalidchars = /^[\],:{}\s]*$/;
var rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
var rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
var rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g;
var rtrimLeft = /^\s+/;
var rtrimRight = /\s+$/;

module.exports = function parsejson(data) {
  if ('string' != typeof data || !data) {
    return null;
  }

  data = data.replace(rtrimLeft, '').replace(rtrimRight, '');

  // Attempt to parse using the native JSON parser first
  if (global.JSON && JSON.parse) {
    return JSON.parse(data);
  }

  if (rvalidchars.test(data.replace(rvalidescape, '@')
      .replace(rvalidtokens, ']')
      .replace(rvalidbraces, ''))) {
    return (new Function('return ' + data))();
  }
};
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{}],37:[function(_dereq_,module,exports){
/**
 * Compiles a querystring
 * Returns string representation of the object
 *
 * @param {Object}
 * @api private
 */

exports.encode = function (obj) {
  var str = '';

  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      if (str.length) str += '&';
      str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
    }
  }

  return str;
};

/**
 * Parses a simple querystring into an object
 *
 * @param {String} qs
 * @api private
 */

exports.decode = function(qs){
  var qry = {};
  var pairs = qs.split('&');
  for (var i = 0, l = pairs.length; i < l; i++) {
    var pair = pairs[i].split('=');
    qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }
  return qry;
};

},{}],38:[function(_dereq_,module,exports){
/**
 * Parses an URI
 *
 * @author Steven Levithan <stevenlevithan.com> (MIT license)
 * @api private
 */

var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

var parts = [
    'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
];

module.exports = function parseuri(str) {
    var src = str,
        b = str.indexOf('['),
        e = str.indexOf(']');

    if (b != -1 && e != -1) {
        str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
    }

    var m = re.exec(str || ''),
        uri = {},
        i = 14;

    while (i--) {
        uri[parts[i]] = m[i] || '';
    }

    if (b != -1 && e != -1) {
        uri.source = src;
        uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
        uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
        uri.ipv6uri = true;
    }

    return uri;
};

},{}],39:[function(_dereq_,module,exports){
(function (global){
/*global Blob,File*/

/**
 * Module requirements
 */

var isArray = _dereq_('isarray');
var isBuf = _dereq_('./is-buffer');

/**
 * Replaces every Buffer | ArrayBuffer in packet with a numbered placeholder.
 * Anything with blobs or files should be fed through removeBlobs before coming
 * here.
 *
 * @param {Object} packet - socket.io event packet
 * @return {Object} with deconstructed packet and list of buffers
 * @api public
 */

exports.deconstructPacket = function(packet){
  var buffers = [];
  var packetData = packet.data;

  function _deconstructPacket(data) {
    if (!data) return data;

    if (isBuf(data)) {
      var placeholder = { _placeholder: true, num: buffers.length };
      buffers.push(data);
      return placeholder;
    } else if (isArray(data)) {
      var newData = new Array(data.length);
      for (var i = 0; i < data.length; i++) {
        newData[i] = _deconstructPacket(data[i]);
      }
      return newData;
    } else if ('object' == typeof data && !(data instanceof Date)) {
      var newData = {};
      for (var key in data) {
        newData[key] = _deconstructPacket(data[key]);
      }
      return newData;
    }
    return data;
  }

  var pack = packet;
  pack.data = _deconstructPacket(packetData);
  pack.attachments = buffers.length; // number of binary 'attachments'
  return {packet: pack, buffers: buffers};
};

/**
 * Reconstructs a binary packet from its placeholder packet and buffers
 *
 * @param {Object} packet - event packet with placeholders
 * @param {Array} buffers - binary buffers to put in placeholder positions
 * @return {Object} reconstructed packet
 * @api public
 */

exports.reconstructPacket = function(packet, buffers) {
  var curPlaceHolder = 0;

  function _reconstructPacket(data) {
    if (data && data._placeholder) {
      var buf = buffers[data.num]; // appropriate buffer (should be natural order anyway)
      return buf;
    } else if (isArray(data)) {
      for (var i = 0; i < data.length; i++) {
        data[i] = _reconstructPacket(data[i]);
      }
      return data;
    } else if (data && 'object' == typeof data) {
      for (var key in data) {
        data[key] = _reconstructPacket(data[key]);
      }
      return data;
    }
    return data;
  }

  packet.data = _reconstructPacket(packet.data);
  packet.attachments = undefined; // no longer useful
  return packet;
};

/**
 * Asynchronously removes Blobs or Files from data via
 * FileReader's readAsArrayBuffer method. Used before encoding
 * data as msgpack. Calls callback with the blobless data.
 *
 * @param {Object} data
 * @param {Function} callback
 * @api private
 */

exports.removeBlobs = function(data, callback) {
  function _removeBlobs(obj, curKey, containingObject) {
    if (!obj) return obj;

    // convert any blob
    if ((global.Blob && obj instanceof Blob) ||
        (global.File && obj instanceof File)) {
      pendingBlobs++;

      // async filereader
      var fileReader = new FileReader();
      fileReader.onload = function() { // this.result == arraybuffer
        if (containingObject) {
          containingObject[curKey] = this.result;
        }
        else {
          bloblessData = this.result;
        }

        // if nothing pending its callback time
        if(! --pendingBlobs) {
          callback(bloblessData);
        }
      };

      fileReader.readAsArrayBuffer(obj); // blob -> arraybuffer
    } else if (isArray(obj)) { // handle array
      for (var i = 0; i < obj.length; i++) {
        _removeBlobs(obj[i], i, obj);
      }
    } else if (obj && 'object' == typeof obj && !isBuf(obj)) { // and object
      for (var key in obj) {
        _removeBlobs(obj[key], key, obj);
      }
    }
  }

  var pendingBlobs = 0;
  var bloblessData = data;
  _removeBlobs(bloblessData);
  if (!pendingBlobs) {
    callback(bloblessData);
  }
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{"./is-buffer":41,"isarray":33}],40:[function(_dereq_,module,exports){

/**
 * Module dependencies.
 */

var debug = _dereq_('debug')('socket.io-parser');
var json = _dereq_('json3');
var isArray = _dereq_('isarray');
var Emitter = _dereq_('component-emitter');
var binary = _dereq_('./binary');
var isBuf = _dereq_('./is-buffer');

/**
 * Protocol version.
 *
 * @api public
 */

exports.protocol = 4;

/**
 * Packet types.
 *
 * @api public
 */

exports.types = [
  'CONNECT',
  'DISCONNECT',
  'EVENT',
  'ACK',
  'ERROR',
  'BINARY_EVENT',
  'BINARY_ACK'
];

/**
 * Packet type `connect`.
 *
 * @api public
 */

exports.CONNECT = 0;

/**
 * Packet type `disconnect`.
 *
 * @api public
 */

exports.DISCONNECT = 1;

/**
 * Packet type `event`.
 *
 * @api public
 */

exports.EVENT = 2;

/**
 * Packet type `ack`.
 *
 * @api public
 */

exports.ACK = 3;

/**
 * Packet type `error`.
 *
 * @api public
 */

exports.ERROR = 4;

/**
 * Packet type 'binary event'
 *
 * @api public
 */

exports.BINARY_EVENT = 5;

/**
 * Packet type `binary ack`. For acks with binary arguments.
 *
 * @api public
 */

exports.BINARY_ACK = 6;

/**
 * Encoder constructor.
 *
 * @api public
 */

exports.Encoder = Encoder;

/**
 * Decoder constructor.
 *
 * @api public
 */

exports.Decoder = Decoder;

/**
 * A socket.io Encoder instance
 *
 * @api public
 */

function Encoder() {}

/**
 * Encode a packet as a single string if non-binary, or as a
 * buffer sequence, depending on packet type.
 *
 * @param {Object} obj - packet object
 * @param {Function} callback - function to handle encodings (likely engine.write)
 * @return Calls callback with Array of encodings
 * @api public
 */

Encoder.prototype.encode = function(obj, callback){
  debug('encoding packet %j', obj);

  if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) {
    encodeAsBinary(obj, callback);
  }
  else {
    var encoding = encodeAsString(obj);
    callback([encoding]);
  }
};

/**
 * Encode packet as string.
 *
 * @param {Object} packet
 * @return {String} encoded
 * @api private
 */

function encodeAsString(obj) {
  var str = '';
  var nsp = false;

  // first is type
  str += obj.type;

  // attachments if we have them
  if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) {
    str += obj.attachments;
    str += '-';
  }

  // if we have a namespace other than `/`
  // we append it followed by a comma `,`
  if (obj.nsp && '/' != obj.nsp) {
    nsp = true;
    str += obj.nsp;
  }

  // immediately followed by the id
  if (null != obj.id) {
    if (nsp) {
      str += ',';
      nsp = false;
    }
    str += obj.id;
  }

  // json data
  if (null != obj.data) {
    if (nsp) str += ',';
    str += json.stringify(obj.data);
  }

  debug('encoded %j as %s', obj, str);
  return str;
}

/**
 * Encode packet as 'buffer sequence' by removing blobs, and
 * deconstructing packet into object with placeholders and
 * a list of buffers.
 *
 * @param {Object} packet
 * @return {Buffer} encoded
 * @api private
 */

function encodeAsBinary(obj, callback) {

  function writeEncoding(bloblessData) {
    var deconstruction = binary.deconstructPacket(bloblessData);
    var pack = encodeAsString(deconstruction.packet);
    var buffers = deconstruction.buffers;

    buffers.unshift(pack); // add packet info to beginning of data list
    callback(buffers); // write all the buffers
  }

  binary.removeBlobs(obj, writeEncoding);
}

/**
 * A socket.io Decoder instance
 *
 * @return {Object} decoder
 * @api public
 */

function Decoder() {
  this.reconstructor = null;
}

/**
 * Mix in `Emitter` with Decoder.
 */

Emitter(Decoder.prototype);

/**
 * Decodes an ecoded packet string into packet JSON.
 *
 * @param {String} obj - encoded packet
 * @return {Object} packet
 * @api public
 */

Decoder.prototype.add = function(obj) {
  var packet;
  if ('string' == typeof obj) {
    packet = decodeString(obj);
    if (exports.BINARY_EVENT == packet.type || exports.BINARY_ACK == packet.type) { // binary packet's json
      this.reconstructor = new BinaryReconstructor(packet);

      // no attachments, labeled binary but no binary data to follow
      if (this.reconstructor.reconPack.attachments === 0) {
        this.emit('decoded', packet);
      }
    } else { // non-binary full packet
      this.emit('decoded', packet);
    }
  }
  else if (isBuf(obj) || obj.base64) { // raw binary data
    if (!this.reconstructor) {
      throw new Error('got binary data when not reconstructing a packet');
    } else {
      packet = this.reconstructor.takeBinaryData(obj);
      if (packet) { // received final buffer
        this.reconstructor = null;
        this.emit('decoded', packet);
      }
    }
  }
  else {
    throw new Error('Unknown type: ' + obj);
  }
};

/**
 * Decode a packet String (JSON data)
 *
 * @param {String} str
 * @return {Object} packet
 * @api private
 */

function decodeString(str) {
  var p = {};
  var i = 0;

  // look up type
  p.type = Number(str.charAt(0));
  if (null == exports.types[p.type]) return error();

  // look up attachments if type binary
  if (exports.BINARY_EVENT == p.type || exports.BINARY_ACK == p.type) {
    var buf = '';
    while (str.charAt(++i) != '-') {
      buf += str.charAt(i);
      if (i == str.length) break;
    }
    if (buf != Number(buf) || str.charAt(i) != '-') {
      throw new Error('Illegal attachments');
    }
    p.attachments = Number(buf);
  }

  // look up namespace (if any)
  if ('/' == str.charAt(i + 1)) {
    p.nsp = '';
    while (++i) {
      var c = str.charAt(i);
      if (',' == c) break;
      p.nsp += c;
      if (i == str.length) break;
    }
  } else {
    p.nsp = '/';
  }

  // look up id
  var next = str.charAt(i + 1);
  if ('' !== next && Number(next) == next) {
    p.id = '';
    while (++i) {
      var c = str.charAt(i);
      if (null == c || Number(c) != c) {
        --i;
        break;
      }
      p.id += str.charAt(i);
      if (i == str.length) break;
    }
    p.id = Number(p.id);
  }

  // look up json data
  if (str.charAt(++i)) {
    try {
      p.data = json.parse(str.substr(i));
    } catch(e){
      return error();
    }
  }

  debug('decoded %s as %j', str, p);
  return p;
}

/**
 * Deallocates a parser's resources
 *
 * @api public
 */

Decoder.prototype.destroy = function() {
  if (this.reconstructor) {
    this.reconstructor.finishedReconstruction();
  }
};

/**
 * A manager of a binary event's 'buffer sequence'. Should
 * be constructed whenever a packet of type BINARY_EVENT is
 * decoded.
 *
 * @param {Object} packet
 * @return {BinaryReconstructor} initialized reconstructor
 * @api private
 */

function BinaryReconstructor(packet) {
  this.reconPack = packet;
  this.buffers = [];
}

/**
 * Method to be called when binary data received from connection
 * after a BINARY_EVENT packet.
 *
 * @param {Buffer | ArrayBuffer} binData - the raw binary data received
 * @return {null | Object} returns null if more binary data is expected or
 *   a reconstructed packet object if all buffers have been received.
 * @api private
 */

BinaryReconstructor.prototype.takeBinaryData = function(binData) {
  this.buffers.push(binData);
  if (this.buffers.length == this.reconPack.attachments) { // done with buffer list
    var packet = binary.reconstructPacket(this.reconPack, this.buffers);
    this.finishedReconstruction();
    return packet;
  }
  return null;
};

/**
 * Cleans up binary packet reconstruction variables.
 *
 * @api private
 */

BinaryReconstructor.prototype.finishedReconstruction = function() {
  this.reconPack = null;
  this.buffers = [];
};

function error(data){
  return {
    type: exports.ERROR,
    data: 'parser error'
  };
}

},{"./binary":39,"./is-buffer":41,"component-emitter":42,"debug":14,"isarray":33,"json3":34}],41:[function(_dereq_,module,exports){
(function (global){

module.exports = isBuf;

/**
 * Returns true if obj is a buffer or an arraybuffer.
 *
 * @api private
 */

function isBuf(obj) {
  return (global.Buffer && global.Buffer.isBuffer(obj)) ||
         (global.ArrayBuffer && obj instanceof ArrayBuffer);
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{}],42:[function(_dereq_,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26}],43:[function(_dereq_,module,exports){
module.exports = toArray

function toArray(list, index) {
    var array = []

    index = index || 0

    for (var i = index || 0; i < list.length; i++) {
        array[i - index] = list[i]
    }

    return array
}

},{}],44:[function(_dereq_,module,exports){
(function (global){
/*! https://mths.be/utf8js v2.0.0 by @mathias */
;(function(root) {

	// Detect free variables `exports`
	var freeExports = typeof exports == 'object' && exports;

	// Detect free variable `module`
	var freeModule = typeof module == 'object' && module &&
		module.exports == freeExports && module;

	// Detect free variable `global`, from Node.js or Browserified code,
	// and use it as `root`
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/*--------------------------------------------------------------------------*/

	var stringFromCharCode = String.fromCharCode;

	// Taken from https://mths.be/punycode
	function ucs2decode(string) {
		var output = [];
		var counter = 0;
		var length = string.length;
		var value;
		var extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	// Taken from https://mths.be/punycode
	function ucs2encode(array) {
		var length = array.length;
		var index = -1;
		var value;
		var output = '';
		while (++index < length) {
			value = array[index];
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
		}
		return output;
	}

	function checkScalarValue(codePoint) {
		if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
			throw Error(
				'Lone surrogate U+' + codePoint.toString(16).toUpperCase() +
				' is not a scalar value'
			);
		}
	}
	/*--------------------------------------------------------------------------*/

	function createByte(codePoint, shift) {
		return stringFromCharCode(((codePoint >> shift) & 0x3F) | 0x80);
	}

	function encodeCodePoint(codePoint) {
		if ((codePoint & 0xFFFFFF80) == 0) { // 1-byte sequence
			return stringFromCharCode(codePoint);
		}
		var symbol = '';
		if ((codePoint & 0xFFFFF800) == 0) { // 2-byte sequence
			symbol = stringFromCharCode(((codePoint >> 6) & 0x1F) | 0xC0);
		}
		else if ((codePoint & 0xFFFF0000) == 0) { // 3-byte sequence
			checkScalarValue(codePoint);
			symbol = stringFromCharCode(((codePoint >> 12) & 0x0F) | 0xE0);
			symbol += createByte(codePoint, 6);
		}
		else if ((codePoint & 0xFFE00000) == 0) { // 4-byte sequence
			symbol = stringFromCharCode(((codePoint >> 18) & 0x07) | 0xF0);
			symbol += createByte(codePoint, 12);
			symbol += createByte(codePoint, 6);
		}
		symbol += stringFromCharCode((codePoint & 0x3F) | 0x80);
		return symbol;
	}

	function utf8encode(string) {
		var codePoints = ucs2decode(string);
		var length = codePoints.length;
		var index = -1;
		var codePoint;
		var byteString = '';
		while (++index < length) {
			codePoint = codePoints[index];
			byteString += encodeCodePoint(codePoint);
		}
		return byteString;
	}

	/*--------------------------------------------------------------------------*/

	function readContinuationByte() {
		if (byteIndex >= byteCount) {
			throw Error('Invalid byte index');
		}

		var continuationByte = byteArray[byteIndex] & 0xFF;
		byteIndex++;

		if ((continuationByte & 0xC0) == 0x80) {
			return continuationByte & 0x3F;
		}

		// If we end up here, it’s not a continuation byte
		throw Error('Invalid continuation byte');
	}

	function decodeSymbol() {
		var byte1;
		var byte2;
		var byte3;
		var byte4;
		var codePoint;

		if (byteIndex > byteCount) {
			throw Error('Invalid byte index');
		}

		if (byteIndex == byteCount) {
			return false;
		}

		// Read first byte
		byte1 = byteArray[byteIndex] & 0xFF;
		byteIndex++;

		// 1-byte sequence (no continuation bytes)
		if ((byte1 & 0x80) == 0) {
			return byte1;
		}

		// 2-byte sequence
		if ((byte1 & 0xE0) == 0xC0) {
			var byte2 = readContinuationByte();
			codePoint = ((byte1 & 0x1F) << 6) | byte2;
			if (codePoint >= 0x80) {
				return codePoint;
			} else {
				throw Error('Invalid continuation byte');
			}
		}

		// 3-byte sequence (may include unpaired surrogates)
		if ((byte1 & 0xF0) == 0xE0) {
			byte2 = readContinuationByte();
			byte3 = readContinuationByte();
			codePoint = ((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3;
			if (codePoint >= 0x0800) {
				checkScalarValue(codePoint);
				return codePoint;
			} else {
				throw Error('Invalid continuation byte');
			}
		}

		// 4-byte sequence
		if ((byte1 & 0xF8) == 0xF0) {
			byte2 = readContinuationByte();
			byte3 = readContinuationByte();
			byte4 = readContinuationByte();
			codePoint = ((byte1 & 0x0F) << 0x12) | (byte2 << 0x0C) |
				(byte3 << 0x06) | byte4;
			if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
				return codePoint;
			}
		}

		throw Error('Invalid UTF-8 detected');
	}

	var byteArray;
	var byteCount;
	var byteIndex;
	function utf8decode(byteString) {
		byteArray = ucs2decode(byteString);
		byteCount = byteArray.length;
		byteIndex = 0;
		var codePoints = [];
		var tmp;
		while ((tmp = decodeSymbol()) !== false) {
			codePoints.push(tmp);
		}
		return ucs2encode(codePoints);
	}

	/*--------------------------------------------------------------------------*/

	var utf8 = {
		'version': '2.0.0',
		'encode': utf8encode,
		'decode': utf8decode
	};

	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define(function() {
			return utf8;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = utf8;
		} else { // in Narwhal or RingoJS v0.7.0-
			var object = {};
			var hasOwnProperty = object.hasOwnProperty;
			for (var key in utf8) {
				hasOwnProperty.call(utf8, key) && (freeExports[key] = utf8[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.utf8 = utf8;
	}

}(this));

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {})
},{}],45:[function(_dereq_,module,exports){
'use strict';

var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split('')
  , length = 64
  , map = {}
  , seed = 0
  , i = 0
  , prev;

/**
 * Return a string representing the specified number.
 *
 * @param {Number} num The number to convert.
 * @returns {String} The string representation of the number.
 * @api public
 */
function encode(num) {
  var encoded = '';

  do {
    encoded = alphabet[num % length] + encoded;
    num = Math.floor(num / length);
  } while (num > 0);

  return encoded;
}

/**
 * Return the integer value specified by the given string.
 *
 * @param {String} str The string to convert.
 * @returns {Number} The integer value represented by the string.
 * @api public
 */
function decode(str) {
  var decoded = 0;

  for (i = 0; i < str.length; i++) {
    decoded = decoded * length + map[str.charAt(i)];
  }

  return decoded;
}

/**
 * Yeast: A tiny growing id generator.
 *
 * @returns {String} A unique id.
 * @api public
 */
function yeast() {
  var now = encode(+new Date());

  if (now !== prev) return seed = 0, prev = now;
  return now +'.'+ encode(seed++);
}

//
// Map each character to its index.
//
for (; i < length; i++) map[alphabet[i]] = i;

//
// Expose the `yeast`, `encode` and `decode` functions.
//
yeast.encode = encode;
yeast.decode = decode;
module.exports = yeast;

},{}]},{},[1])(1)
});

/*! adapterjs - v0.14.0 - 2016-10-03 */

// Adapter's interface.
var AdapterJS = AdapterJS || {};

// Browserify compatibility
if(typeof exports !== 'undefined') {
  module.exports = AdapterJS;
}

AdapterJS.options = AdapterJS.options || {};

// uncomment to get virtual webcams
// AdapterJS.options.getAllCams = true;

// uncomment to prevent the install prompt when the plugin in not yet installed
// AdapterJS.options.hidePluginInstallPrompt = true;

// AdapterJS version
AdapterJS.VERSION = '0.14.0';

// This function will be called when the WebRTC API is ready to be used
// Whether it is the native implementation (Chrome, Firefox, Opera) or
// the plugin
// You may Override this function to synchronise the start of your application
// with the WebRTC API being ready.
// If you decide not to override use this synchronisation, it may result in
// an extensive CPU usage on the plugin start (once per tab loaded)
// Params:
//    - isUsingPlugin: true is the WebRTC plugin is being used, false otherwise
//
AdapterJS.onwebrtcready = AdapterJS.onwebrtcready || function(isUsingPlugin) {
  // The WebRTC API is ready.
  // Override me and do whatever you want here
};

// New interface to store multiple callbacks, private
AdapterJS._onwebrtcreadies = [];

// Sets a callback function to be called when the WebRTC interface is ready.
// The first argument is the function to callback.\
// Throws an error if the first argument is not a function
AdapterJS.webRTCReady = function (callback) {
  if (typeof callback !== 'function') {
    throw new Error('Callback provided is not a function');
  }

  if (true === AdapterJS.onwebrtcreadyDone) {
    // All WebRTC interfaces are ready, just call the callback
    callback(null !== AdapterJS.WebRTCPlugin.plugin);
  } else {
    // will be triggered automatically when your browser/plugin is ready.
    AdapterJS._onwebrtcreadies.push(callback);
  }
};

// Plugin namespace
AdapterJS.WebRTCPlugin = AdapterJS.WebRTCPlugin || {};

// The object to store plugin information
/* jshint ignore:start */
AdapterJS.WebRTCPlugin.pluginInfo = AdapterJS.WebRTCPlugin.pluginInfo || {
  prefix : 'Tem',
  plugName : 'TemWebRTCPlugin',
  pluginId : 'plugin0',
  type : 'application/x-temwebrtcplugin',
  onload : '__TemWebRTCReady0',
  portalLink : 'http://skylink.io/plugin/',
  downloadLink : null, //set below
  companyName: 'Temasys',
  downloadLinks : {
    mac: 'http://bit.ly/webrtcpluginpkg',
    win: 'http://bit.ly/webrtcpluginmsi'
  }
};
if(typeof AdapterJS.WebRTCPlugin.pluginInfo.downloadLinks !== "undefined" && AdapterJS.WebRTCPlugin.pluginInfo.downloadLinks !== null) {
  if(!!navigator.platform.match(/^Mac/i)) {
    AdapterJS.WebRTCPlugin.pluginInfo.downloadLink = AdapterJS.WebRTCPlugin.pluginInfo.downloadLinks.mac;
  }
  else if(!!navigator.platform.match(/^Win/i)) {
    AdapterJS.WebRTCPlugin.pluginInfo.downloadLink = AdapterJS.WebRTCPlugin.pluginInfo.downloadLinks.win;
  }
}

/* jshint ignore:end */

AdapterJS.WebRTCPlugin.TAGS = {
  NONE  : 'none',
  AUDIO : 'audio',
  VIDEO : 'video'
};

// Unique identifier of each opened page
AdapterJS.WebRTCPlugin.pageId = Math.random().toString(36).slice(2);

// Use this whenever you want to call the plugin.
AdapterJS.WebRTCPlugin.plugin = null;

// Set log level for the plugin once it is ready.
// The different values are
// This is an asynchronous function that will run when the plugin is ready
AdapterJS.WebRTCPlugin.setLogLevel = null;

// Defines webrtc's JS interface according to the plugin's implementation.
// Define plugin Browsers as WebRTC Interface.
AdapterJS.WebRTCPlugin.defineWebRTCInterface = null;

// This function detects whether or not a plugin is installed.
// Checks if Not IE (firefox, for example), else if it's IE,
// we're running IE and do something. If not it is not supported.
AdapterJS.WebRTCPlugin.isPluginInstalled = null;

 // Lets adapter.js wait until the the document is ready before injecting the plugin
AdapterJS.WebRTCPlugin.pluginInjectionInterval = null;

// Inject the HTML DOM object element into the page.
AdapterJS.WebRTCPlugin.injectPlugin = null;

// States of readiness that the plugin goes through when
// being injected and stated
AdapterJS.WebRTCPlugin.PLUGIN_STATES = {
  NONE : 0,           // no plugin use
  INITIALIZING : 1,   // Detected need for plugin
  INJECTING : 2,      // Injecting plugin
  INJECTED: 3,        // Plugin element injected but not usable yet
  READY: 4            // Plugin ready to be used
};

// Current state of the plugin. You cannot use the plugin before this is
// equal to AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY
AdapterJS.WebRTCPlugin.pluginState = AdapterJS.WebRTCPlugin.PLUGIN_STATES.NONE;

// True is AdapterJS.onwebrtcready was already called, false otherwise
// Used to make sure AdapterJS.onwebrtcready is only called once
AdapterJS.onwebrtcreadyDone = false;

// Log levels for the plugin.
// To be set by calling AdapterJS.WebRTCPlugin.setLogLevel
/*
Log outputs are prefixed in some cases.
  INFO: Information reported by the plugin.
  ERROR: Errors originating from within the plugin.
  WEBRTC: Error originating from within the libWebRTC library
*/
// From the least verbose to the most verbose
AdapterJS.WebRTCPlugin.PLUGIN_LOG_LEVELS = {
  NONE : 'NONE',
  ERROR : 'ERROR',
  WARNING : 'WARNING',
  INFO: 'INFO',
  VERBOSE: 'VERBOSE',
  SENSITIVE: 'SENSITIVE'
};

// Does a waiting check before proceeding to load the plugin.
AdapterJS.WebRTCPlugin.WaitForPluginReady = null;

// This methid will use an interval to wait for the plugin to be ready.
AdapterJS.WebRTCPlugin.callWhenPluginReady = null;

// !!!! WARNING: DO NOT OVERRIDE THIS FUNCTION. !!!
// This function will be called when plugin is ready. It sends necessary
// details to the plugin.
// The function will wait for the document to be ready and the set the
// plugin state to AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY,
// indicating that it can start being requested.
// This function is not in the IE/Safari condition brackets so that
// TemPluginLoaded function might be called on Chrome/Firefox.
// This function is the only private function that is not encapsulated to
// allow the plugin method to be called.
__TemWebRTCReady0 = function () {
  if (document.readyState === 'complete') {
    AdapterJS.WebRTCPlugin.pluginState = AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY;
    AdapterJS.maybeThroughWebRTCReady();
  } else {
    var timer = setInterval(function () {
      if (document.readyState === 'complete') {
        // TODO: update comments, we wait for the document to be ready
        clearInterval(timer);
        AdapterJS.WebRTCPlugin.pluginState = AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY;
        AdapterJS.maybeThroughWebRTCReady();
      }
    }, 100);
  }
};

AdapterJS.maybeThroughWebRTCReady = function() {
  if (!AdapterJS.onwebrtcreadyDone) {
    AdapterJS.onwebrtcreadyDone = true;

    // If new interface for multiple callbacks used
    if (AdapterJS._onwebrtcreadies.length) {
      AdapterJS._onwebrtcreadies.forEach(function (callback) {
        if (typeof(callback) === 'function') {
          callback(AdapterJS.WebRTCPlugin.plugin !== null);
        }
      });
    // Else if no callbacks on new interface assuming user used old(deprecated) way to set callback through AdapterJS.onwebrtcready = ...
    } else if (typeof(AdapterJS.onwebrtcready) === 'function') {
      AdapterJS.onwebrtcready(AdapterJS.WebRTCPlugin.plugin !== null);
    }
  }
};

// Text namespace
AdapterJS.TEXT = {
  PLUGIN: {
    REQUIRE_INSTALLATION: 'This website requires you to install a WebRTC-enabling plugin ' +
      'to work on this browser.',
    NOT_SUPPORTED: 'Your browser does not support WebRTC.',
    BUTTON: 'Install Now'
  },
  REFRESH: {
    REQUIRE_REFRESH: 'Please refresh page',
    BUTTON: 'Refresh Page'
  }
};

// The result of ice connection states.
// - starting: Ice connection is starting.
// - checking: Ice connection is checking.
// - connected Ice connection is connected.
// - completed Ice connection is connected.
// - done Ice connection has been completed.
// - disconnected Ice connection has been disconnected.
// - failed Ice connection has failed.
// - closed Ice connection is closed.
AdapterJS._iceConnectionStates = {
  starting : 'starting',
  checking : 'checking',
  connected : 'connected',
  completed : 'connected',
  done : 'completed',
  disconnected : 'disconnected',
  failed : 'failed',
  closed : 'closed'
};

//The IceConnection states that has been fired for each peer.
AdapterJS._iceConnectionFiredStates = [];


// Check if WebRTC Interface is defined.
AdapterJS.isDefined = null;

// This function helps to retrieve the webrtc detected browser information.
// This sets:
// - webrtcDetectedBrowser: The browser agent name.
// - webrtcDetectedVersion: The browser version.
// - webrtcMinimumVersion: The minimum browser version still supported by AJS.
// - webrtcDetectedType: The types of webRTC support.
//   - 'moz': Mozilla implementation of webRTC.
//   - 'webkit': WebKit implementation of webRTC.
//   - 'plugin': Using the plugin implementation.
AdapterJS.parseWebrtcDetectedBrowser = function () {
  var hasMatch = null;

  // Detect Opera (8.0+)
  if ((!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0) {
    hasMatch = navigator.userAgent.match(/OPR\/(\d+)/i) || [];

    webrtcDetectedBrowser   = 'opera';
    webrtcDetectedVersion   = parseInt(hasMatch[1] || '0', 10);
    webrtcMinimumVersion    = 26;
    webrtcDetectedType      = 'webkit';
    webrtcDetectedDCSupport = 'SCTP'; // Opera 20+ uses Chrome 33

  // Detect Bowser on iOS
  } else if (navigator.userAgent.match(/Bowser\/[0-9.]*/g)) {
    hasMatch = navigator.userAgent.match(/Bowser\/[0-9.]*/g) || [];

    var chromiumVersion = parseInt((navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./i) || [])[2] || '0', 10);

    webrtcDetectedBrowser   = 'bowser';
    webrtcDetectedVersion   = parseFloat((hasMatch[0] || '0/0').split('/')[1], 10);
    webrtcMinimumVersion    = 0;
    webrtcDetectedType      = 'webkit';
    webrtcDetectedDCSupport = chromiumVersion > 30 ? 'SCTP' : 'RTP';


  // Detect Opera on iOS (does not support WebRTC yet)
  } else if (navigator.userAgent.indexOf('OPiOS') > 0) {
    hasMatch = navigator.userAgent.match(/OPiOS\/([0-9]+)\./);

    // Browser which do not support webrtc yet
    webrtcDetectedBrowser   = 'opera';
    webrtcDetectedVersion   = parseInt(hasMatch[1] || '0', 10);
    webrtcMinimumVersion    = 0;
    webrtcDetectedType      = null;
    webrtcDetectedDCSupport = null;

  // Detect Chrome on iOS (does not support WebRTC yet)
  } else if (navigator.userAgent.indexOf('CriOS') > 0) {
    hasMatch = navigator.userAgent.match(/CriOS\/([0-9]+)\./) || [];

    webrtcDetectedBrowser   = 'chrome';
    webrtcDetectedVersion   = parseInt(hasMatch[1] || '0', 10);
    webrtcMinimumVersion    = 0;
    webrtcDetectedType      = null;
    webrtcDetectedDCSupport = null;

  // Detect Firefox on iOS (does not support WebRTC yet)
  } else if (navigator.userAgent.indexOf('FxiOS') > 0) {
    hasMatch = navigator.userAgent.match(/FxiOS\/([0-9]+)\./) || [];

    // Browser which do not support webrtc yet
    webrtcDetectedBrowser   = 'firefox';
    webrtcDetectedVersion   = parseInt(hasMatch[1] || '0', 10);
    webrtcMinimumVersion    = 0;
    webrtcDetectedType      = null;
    webrtcDetectedDCSupport = null;

  // Detect IE (6-11)
  } else if (/*@cc_on!@*/false || !!document.documentMode) {
    hasMatch = /\brv[ :]+(\d+)/g.exec(navigator.userAgent) || [];

    webrtcDetectedBrowser   = 'IE';
    webrtcDetectedVersion   = parseInt(hasMatch[1], 10);
    webrtcMinimumVersion    = 9;
    webrtcDetectedType      = 'plugin';
    webrtcDetectedDCSupport = 'SCTP';

    if (!webrtcDetectedVersion) {
      hasMatch = /\bMSIE[ :]+(\d+)/g.exec(navigator.userAgent) || [];

      webrtcDetectedVersion = parseInt(hasMatch[1] || '0', 10);
    }

  // Detect Edge (20+)
  } else if (!!window.StyleMedia || navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) {
    hasMatch = navigator.userAgent.match(/Edge\/(\d+).(\d+)$/) || [];

    // Previous webrtc/adapter uses minimum version as 10547 but checking in the Edge release history,
    // It's close to 13.10547 and ObjectRTC API is fully supported in that version

    webrtcDetectedBrowser   = 'edge';
    webrtcDetectedVersion   = parseFloat((hasMatch[0] || '0/0').split('/')[1], 10);
    webrtcMinimumVersion    = 13.10547;
    webrtcDetectedType      = 'ms';
    webrtcDetectedDCSupport = null;

  // Detect Firefox (1.0+)
  // Placed before Safari check to ensure Firefox on Android is detected
  } else if (typeof InstallTrigger !== 'undefined' || navigator.userAgent.indexOf('irefox') > 0) {
    hasMatch = navigator.userAgent.match(/Firefox\/([0-9]+)\./) || [];

    webrtcDetectedBrowser   = 'firefox';
    webrtcDetectedVersion   = parseInt(hasMatch[1] || '0', 10);
    webrtcMinimumVersion    = 31;
    webrtcDetectedType      = 'moz';
    webrtcDetectedDCSupport = 'SCTP';

  // Detect Chrome (1+ and mobile)
  // Placed before Safari check to ensure Chrome on Android is detected
  } else if ((!!window.chrome && !!window.chrome.webstore) || navigator.userAgent.indexOf('Chrom') > 0) {
    hasMatch = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./i) || [];

    webrtcDetectedBrowser   = 'chrome';
    webrtcDetectedVersion   = parseInt(hasMatch[2] || '0', 10);
    webrtcMinimumVersion    = 38;
    webrtcDetectedType      = 'webkit';
    webrtcDetectedDCSupport = webrtcDetectedVersion > 30 ? 'SCTP' : 'RTP'; // Chrome 31+ supports SCTP without flags

  // Detect Safari
  } else if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
    hasMatch = navigator.userAgent.match(/version\/(\d+)/i) || [];

    var isMobile = navigator.userAgent.match(/(iPhone|iPad)/gi) || [];

    webrtcDetectedBrowser   = 'safari';
    webrtcDetectedVersion   = parseInt(hasMatch[1] || '0', 10);
    webrtcMinimumVersion    = 7;
    webrtcDetectedType      = isMobile.length === 0 ? 'plugin' : null;
    webrtcDetectedDCSupport = isMobile.length === 0 ? 'SCTP' : null;

  }

  window.webrtcDetectedBrowser   = webrtcDetectedBrowser;
  window.webrtcDetectedVersion   = webrtcDetectedVersion;
  window.webrtcMinimumVersion    = webrtcMinimumVersion;
  window.webrtcDetectedType      = webrtcDetectedType; // Scope it to window for better consistency
  window.webrtcDetectedDCSupport = webrtcDetectedDCSupport; // Scope it to window for better consistency
};

AdapterJS.addEvent = function(elem, evnt, func) {
  if (elem.addEventListener) { // W3C DOM
    elem.addEventListener(evnt, func, false);
  } else if (elem.attachEvent) {// OLD IE DOM
    elem.attachEvent('on'+evnt, func);
  } else { // No much to do
    elem[evnt] = func;
  }
};

AdapterJS.renderNotificationBar = function (text, buttonText, buttonLink, openNewTab, displayRefreshBar) {
  // only inject once the page is ready
  if (document.readyState !== 'complete') {
    return;
  }

  var w = window;
  var i = document.createElement('iframe');
  i.name = 'adapterjs-alert';
  i.style.position = 'fixed';
  i.style.top = '-41px';
  i.style.left = 0;
  i.style.right = 0;
  i.style.width = '100%';
  i.style.height = '40px';
  i.style.backgroundColor = '#ffffe1';
  i.style.border = 'none';
  i.style.borderBottom = '1px solid #888888';
  i.style.zIndex = '9999999';
  if(typeof i.style.webkitTransition === 'string') {
    i.style.webkitTransition = 'all .5s ease-out';
  } else if(typeof i.style.transition === 'string') {
    i.style.transition = 'all .5s ease-out';
  }
  document.body.appendChild(i);
  var c = (i.contentWindow) ? i.contentWindow :
    (i.contentDocument.document) ? i.contentDocument.document : i.contentDocument;
  c.document.open();
  c.document.write('<span style="display: inline-block; font-family: Helvetica, Arial,' +
    'sans-serif; font-size: .9rem; padding: 4px; vertical-align: ' +
    'middle; cursor: default;">' + text + '</span>');
  if(buttonText && buttonLink) {
    c.document.write('<button id="okay">' + buttonText + '</button><button id="cancel">Cancel</button>');
    c.document.close();

    // On click on okay
    AdapterJS.addEvent(c.document.getElementById('okay'), 'click', function(e) {
      if (!!displayRefreshBar) {
        AdapterJS.renderNotificationBar(AdapterJS.TEXT.EXTENSION ?
          AdapterJS.TEXT.EXTENSION.REQUIRE_REFRESH : AdapterJS.TEXT.REFRESH.REQUIRE_REFRESH,
          AdapterJS.TEXT.REFRESH.BUTTON, 'javascript:location.reload()'); // jshint ignore:line
      }
      window.open(buttonLink, !!openNewTab ? '_blank' : '_top');

      e.preventDefault();
      try {
        e.cancelBubble = true;
      } catch(error) { }

      var pluginInstallInterval = setInterval(function(){
        if(! isIE) {
          navigator.plugins.refresh(false);
        }
        AdapterJS.WebRTCPlugin.isPluginInstalled(
          AdapterJS.WebRTCPlugin.pluginInfo.prefix,
          AdapterJS.WebRTCPlugin.pluginInfo.plugName,
          AdapterJS.WebRTCPlugin.pluginInfo.type,
          function() { // plugin now installed
            clearInterval(pluginInstallInterval);
            AdapterJS.WebRTCPlugin.defineWebRTCInterface();
          },
          function() {
            // still no plugin detected, nothing to do
          });
      } , 500);
    });

    // On click on Cancel
    AdapterJS.addEvent(c.document.getElementById('cancel'), 'click', function(e) {
      w.document.body.removeChild(i);
    });
  } else {
    c.document.close();
  }
  setTimeout(function() {
    if(typeof i.style.webkitTransform === 'string') {
      i.style.webkitTransform = 'translateY(40px)';
    } else if(typeof i.style.transform === 'string') {
      i.style.transform = 'translateY(40px)';
    } else {
      i.style.top = '0px';
    }
  }, 300);
};

// -----------------------------------------------------------
// Detected webrtc implementation. Types are:
// - 'moz': Mozilla implementation of webRTC.
// - 'webkit': WebKit implementation of webRTC.
// - 'plugin': Using the plugin implementation.
webrtcDetectedType = null;

// Set the settings for creating DataChannels, MediaStream for
// Cross-browser compability.
// - This is only for SCTP based support browsers.
// the 'urls' attribute.
checkMediaDataChannelSettings =
  function (peerBrowserAgent, peerBrowserVersion, callback, constraints) {
  if (typeof callback !== 'function') {
    return;
  }
  var beOfferer = true;
  var isLocalFirefox = webrtcDetectedBrowser === 'firefox';
  // Nightly version does not require MozDontOfferDataChannel for interop
  var isLocalFirefoxInterop = webrtcDetectedType === 'moz' && webrtcDetectedVersion > 30;
  var isPeerFirefox = peerBrowserAgent === 'firefox';
  var isPeerFirefoxInterop = peerBrowserAgent === 'firefox' &&
    ((peerBrowserVersion) ? (peerBrowserVersion > 30) : false);

  // Resends an updated version of constraints for MozDataChannel to work
  // If other userAgent is firefox and user is firefox, remove MozDataChannel
  if ((isLocalFirefox && isPeerFirefox) || (isLocalFirefoxInterop)) {
    try {
      delete constraints.mandatory.MozDontOfferDataChannel;
    } catch (error) {
      console.error('Failed deleting MozDontOfferDataChannel');
      console.error(error);
    }
  } else if ((isLocalFirefox && !isPeerFirefox)) {
    constraints.mandatory.MozDontOfferDataChannel = true;
  }
  if (!isLocalFirefox) {
    // temporary measure to remove Moz* constraints in non Firefox browsers
    for (var prop in constraints.mandatory) {
      if (constraints.mandatory.hasOwnProperty(prop)) {
        if (prop.indexOf('Moz') !== -1) {
          delete constraints.mandatory[prop];
        }
      }
    }
  }
  // Firefox (not interopable) cannot offer DataChannel as it will cause problems to the
  // interopability of the media stream
  if (isLocalFirefox && !isPeerFirefox && !isLocalFirefoxInterop) {
    beOfferer = false;
  }
  callback(beOfferer, constraints);
};

// Handles the differences for all browsers ice connection state output.
// - Tested outcomes are:
//   - Chrome (offerer)  : 'checking' > 'completed' > 'completed'
//   - Chrome (answerer) : 'checking' > 'connected'
//   - Firefox (offerer) : 'checking' > 'connected'
//   - Firefox (answerer): 'checking' > 'connected'
checkIceConnectionState = function (peerId, iceConnectionState, callback) {
  if (typeof callback !== 'function') {
    console.warn('No callback specified in checkIceConnectionState. Aborted.');
    return;
  }
  peerId = (peerId) ? peerId : 'peer';

  if (!AdapterJS._iceConnectionFiredStates[peerId] ||
    iceConnectionState === AdapterJS._iceConnectionStates.disconnected ||
    iceConnectionState === AdapterJS._iceConnectionStates.failed ||
    iceConnectionState === AdapterJS._iceConnectionStates.closed) {
    AdapterJS._iceConnectionFiredStates[peerId] = [];
  }
  iceConnectionState = AdapterJS._iceConnectionStates[iceConnectionState];
  if (AdapterJS._iceConnectionFiredStates[peerId].indexOf(iceConnectionState) < 0) {
    AdapterJS._iceConnectionFiredStates[peerId].push(iceConnectionState);
    if (iceConnectionState === AdapterJS._iceConnectionStates.connected) {
      setTimeout(function () {
        AdapterJS._iceConnectionFiredStates[peerId]
          .push(AdapterJS._iceConnectionStates.done);
        callback(AdapterJS._iceConnectionStates.done);
      }, 1000);
    }
    callback(iceConnectionState);
  }
  return;
};

// Firefox:
// - Creates iceServer from the url for Firefox.
// - Create iceServer with stun url.
// - Create iceServer with turn url.
//   - Ignore the transport parameter from TURN url for FF version <=27.
//   - Return null for createIceServer if transport=tcp.
// - FF 27 and above supports transport parameters in TURN url,
// - So passing in the full url to create iceServer.
// Chrome:
// - Creates iceServer from the url for Chrome M33 and earlier.
//   - Create iceServer with stun url.
//   - Chrome M28 & above uses below TURN format.
// Plugin:
// - Creates Ice Server for Plugin Browsers
//   - If Stun - Create iceServer with stun url.
//   - Else - Create iceServer with turn url
//   - This is a WebRTC Function
createIceServer = null;

// Firefox:
// - Creates IceServers for Firefox
//   - Use .url for FireFox.
//   - Multiple Urls support
// Chrome:
// - Creates iceServers from the urls for Chrome M34 and above.
//   - .urls is supported since Chrome M34.
//   - Multiple Urls support
// Plugin:
// - Creates Ice Servers for Plugin Browsers
//   - Multiple Urls support
//   - This is a WebRTC Function
createIceServers = null;
//------------------------------------------------------------

//The RTCPeerConnection object.
RTCPeerConnection = null;

// Creates RTCSessionDescription object for Plugin Browsers
RTCSessionDescription = (typeof RTCSessionDescription === 'function') ?
  RTCSessionDescription : null;

// Creates RTCIceCandidate object for Plugin Browsers
RTCIceCandidate = (typeof RTCIceCandidate === 'function') ?
  RTCIceCandidate : null;

// Get UserMedia (only difference is the prefix).
// Code from Adam Barth.
getUserMedia = null;

// Attach a media stream to an element.
attachMediaStream = null;

// Re-attach a media stream to an element.
reattachMediaStream = null;


// Detected browser agent name. Types are:
// - 'firefox': Firefox browser.
// - 'chrome': Chrome browser.
// - 'opera': Opera browser.
// - 'safari': Safari browser.
// - 'IE' - Internet Explorer browser.
webrtcDetectedBrowser = null;

// Detected browser version.
webrtcDetectedVersion = null;

// The minimum browser version still supported by AJS.
webrtcMinimumVersion  = null;

// Check for browser types and react accordingly
if ( (navigator.mozGetUserMedia ||
      navigator.webkitGetUserMedia ||
      (navigator.mediaDevices &&
       navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)))
    && !((navigator.userAgent.match(/android/ig) || []).length === 0 &&
          (navigator.userAgent.match(/chrome/ig) || []).length === 0 && navigator.userAgent.indexOf('Safari/') > 0)) {

  ///////////////////////////////////////////////////////////////////
  // INJECTION OF GOOGLE'S ADAPTER.JS CONTENT

/* jshint ignore:start */
  (function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.adapter = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
   /* eslint-env node */
  'use strict';
  
  // SDP helpers.
  var SDPUtils = {};
  
  // Generate an alphanumeric identifier for cname or mids.
  // TODO: use UUIDs instead? https://gist.github.com/jed/982883
  SDPUtils.generateIdentifier = function() {
    return Math.random().toString(36).substr(2, 10);
  };
  
  // The RTCP CNAME used by all peerconnections from the same JS.
  SDPUtils.localCName = SDPUtils.generateIdentifier();
  
  // Splits SDP into lines, dealing with both CRLF and LF.
  SDPUtils.splitLines = function(blob) {
    return blob.trim().split('\n').map(function(line) {
      return line.trim();
    });
  };
  // Splits SDP into sessionpart and mediasections. Ensures CRLF.
  SDPUtils.splitSections = function(blob) {
    var parts = blob.split('\nm=');
    return parts.map(function(part, index) {
      return (index > 0 ? 'm=' + part : part).trim() + '\r\n';
    });
  };
  
  // Returns lines that start with a certain prefix.
  SDPUtils.matchPrefix = function(blob, prefix) {
    return SDPUtils.splitLines(blob).filter(function(line) {
      return line.indexOf(prefix) === 0;
    });
  };
  
  // Parses an ICE candidate line. Sample input:
  // candidate:702786350 2 udp 41819902 8.8.8.8 60769 typ relay raddr 8.8.8.8
  // rport 55996"
  SDPUtils.parseCandidate = function(line) {
    var parts;
    // Parse both variants.
    if (line.indexOf('a=candidate:') === 0) {
      parts = line.substring(12).split(' ');
    } else {
      parts = line.substring(10).split(' ');
    }
  
    var candidate = {
      foundation: parts[0],
      component: parts[1],
      protocol: parts[2].toLowerCase(),
      priority: parseInt(parts[3], 10),
      ip: parts[4],
      port: parseInt(parts[5], 10),
      // skip parts[6] == 'typ'
      type: parts[7]
    };
  
    for (var i = 8; i < parts.length; i += 2) {
      switch (parts[i]) {
        case 'raddr':
          candidate.relatedAddress = parts[i + 1];
          break;
        case 'rport':
          candidate.relatedPort = parseInt(parts[i + 1], 10);
          break;
        case 'tcptype':
          candidate.tcpType = parts[i + 1];
          break;
        default: // Unknown extensions are silently ignored.
          break;
      }
    }
    return candidate;
  };
  
  // Translates a candidate object into SDP candidate attribute.
  SDPUtils.writeCandidate = function(candidate) {
    var sdp = [];
    sdp.push(candidate.foundation);
    sdp.push(candidate.component);
    sdp.push(candidate.protocol.toUpperCase());
    sdp.push(candidate.priority);
    sdp.push(candidate.ip);
    sdp.push(candidate.port);
  
    var type = candidate.type;
    sdp.push('typ');
    sdp.push(type);
    if (type !== 'host' && candidate.relatedAddress &&
        candidate.relatedPort) {
      sdp.push('raddr');
      sdp.push(candidate.relatedAddress); // was: relAddr
      sdp.push('rport');
      sdp.push(candidate.relatedPort); // was: relPort
    }
    if (candidate.tcpType && candidate.protocol.toLowerCase() === 'tcp') {
      sdp.push('tcptype');
      sdp.push(candidate.tcpType);
    }
    return 'candidate:' + sdp.join(' ');
  };
  
  // Parses an rtpmap line, returns RTCRtpCoddecParameters. Sample input:
  // a=rtpmap:111 opus/48000/2
  SDPUtils.parseRtpMap = function(line) {
    var parts = line.substr(9).split(' ');
    var parsed = {
      payloadType: parseInt(parts.shift(), 10) // was: id
    };
  
    parts = parts[0].split('/');
  
    parsed.name = parts[0];
    parsed.clockRate = parseInt(parts[1], 10); // was: clockrate
    // was: channels
    parsed.numChannels = parts.length === 3 ? parseInt(parts[2], 10) : 1;
    return parsed;
  };
  
  // Generate an a=rtpmap line from RTCRtpCodecCapability or
  // RTCRtpCodecParameters.
  SDPUtils.writeRtpMap = function(codec) {
    var pt = codec.payloadType;
    if (codec.preferredPayloadType !== undefined) {
      pt = codec.preferredPayloadType;
    }
    return 'a=rtpmap:' + pt + ' ' + codec.name + '/' + codec.clockRate +
        (codec.numChannels !== 1 ? '/' + codec.numChannels : '') + '\r\n';
  };
  
  // Parses an a=extmap line (headerextension from RFC 5285). Sample input:
  // a=extmap:2 urn:ietf:params:rtp-hdrext:toffset
  SDPUtils.parseExtmap = function(line) {
    var parts = line.substr(9).split(' ');
    return {
      id: parseInt(parts[0], 10),
      uri: parts[1]
    };
  };
  
  // Generates a=extmap line from RTCRtpHeaderExtensionParameters or
  // RTCRtpHeaderExtension.
  SDPUtils.writeExtmap = function(headerExtension) {
    return 'a=extmap:' + (headerExtension.id || headerExtension.preferredId) +
         ' ' + headerExtension.uri + '\r\n';
  };
  
  // Parses an ftmp line, returns dictionary. Sample input:
  // a=fmtp:96 vbr=on;cng=on
  // Also deals with vbr=on; cng=on
  SDPUtils.parseFmtp = function(line) {
    var parsed = {};
    var kv;
    var parts = line.substr(line.indexOf(' ') + 1).split(';');
    for (var j = 0; j < parts.length; j++) {
      kv = parts[j].trim().split('=');
      parsed[kv[0].trim()] = kv[1];
    }
    return parsed;
  };
  
  // Generates an a=ftmp line from RTCRtpCodecCapability or RTCRtpCodecParameters.
  SDPUtils.writeFmtp = function(codec) {
    var line = '';
    var pt = codec.payloadType;
    if (codec.preferredPayloadType !== undefined) {
      pt = codec.preferredPayloadType;
    }
    if (codec.parameters && Object.keys(codec.parameters).length) {
      var params = [];
      Object.keys(codec.parameters).forEach(function(param) {
        params.push(param + '=' + codec.parameters[param]);
      });
      line += 'a=fmtp:' + pt + ' ' + params.join(';') + '\r\n';
    }
    return line;
  };
  
  // Parses an rtcp-fb line, returns RTCPRtcpFeedback object. Sample input:
  // a=rtcp-fb:98 nack rpsi
  SDPUtils.parseRtcpFb = function(line) {
    var parts = line.substr(line.indexOf(' ') + 1).split(' ');
    return {
      type: parts.shift(),
      parameter: parts.join(' ')
    };
  };
  // Generate a=rtcp-fb lines from RTCRtpCodecCapability or RTCRtpCodecParameters.
  SDPUtils.writeRtcpFb = function(codec) {
    var lines = '';
    var pt = codec.payloadType;
    if (codec.preferredPayloadType !== undefined) {
      pt = codec.preferredPayloadType;
    }
    if (codec.rtcpFeedback && codec.rtcpFeedback.length) {
      // FIXME: special handling for trr-int?
      codec.rtcpFeedback.forEach(function(fb) {
        lines += 'a=rtcp-fb:' + pt + ' ' + fb.type +
        (fb.parameter && fb.parameter.length ? ' ' + fb.parameter : '') +
            '\r\n';
      });
    }
    return lines;
  };
  
  // Parses an RFC 5576 ssrc media attribute. Sample input:
  // a=ssrc:3735928559 cname:something
  SDPUtils.parseSsrcMedia = function(line) {
    var sp = line.indexOf(' ');
    var parts = {
      ssrc: parseInt(line.substr(7, sp - 7), 10)
    };
    var colon = line.indexOf(':', sp);
    if (colon > -1) {
      parts.attribute = line.substr(sp + 1, colon - sp - 1);
      parts.value = line.substr(colon + 1);
    } else {
      parts.attribute = line.substr(sp + 1);
    }
    return parts;
  };
  
  // Extracts DTLS parameters from SDP media section or sessionpart.
  // FIXME: for consistency with other functions this should only
  //   get the fingerprint line as input. See also getIceParameters.
  SDPUtils.getDtlsParameters = function(mediaSection, sessionpart) {
    var lines = SDPUtils.splitLines(mediaSection);
    // Search in session part, too.
    lines = lines.concat(SDPUtils.splitLines(sessionpart));
    var fpLine = lines.filter(function(line) {
      return line.indexOf('a=fingerprint:') === 0;
    })[0].substr(14);
    // Note: a=setup line is ignored since we use the 'auto' role.
    var dtlsParameters = {
      role: 'auto',
      fingerprints: [{
        algorithm: fpLine.split(' ')[0],
        value: fpLine.split(' ')[1]
      }]
    };
    return dtlsParameters;
  };
  
  // Serializes DTLS parameters to SDP.
  SDPUtils.writeDtlsParameters = function(params, setupType) {
    var sdp = 'a=setup:' + setupType + '\r\n';
    params.fingerprints.forEach(function(fp) {
      sdp += 'a=fingerprint:' + fp.algorithm + ' ' + fp.value + '\r\n';
    });
    return sdp;
  };
  // Parses ICE information from SDP media section or sessionpart.
  // FIXME: for consistency with other functions this should only
  //   get the ice-ufrag and ice-pwd lines as input.
  SDPUtils.getIceParameters = function(mediaSection, sessionpart) {
    var lines = SDPUtils.splitLines(mediaSection);
    // Search in session part, too.
    lines = lines.concat(SDPUtils.splitLines(sessionpart));
    var iceParameters = {
      usernameFragment: lines.filter(function(line) {
        return line.indexOf('a=ice-ufrag:') === 0;
      })[0].substr(12),
      password: lines.filter(function(line) {
        return line.indexOf('a=ice-pwd:') === 0;
      })[0].substr(10)
    };
    return iceParameters;
  };
  
  // Serializes ICE parameters to SDP.
  SDPUtils.writeIceParameters = function(params) {
    return 'a=ice-ufrag:' + params.usernameFragment + '\r\n' +
        'a=ice-pwd:' + params.password + '\r\n';
  };
  
  // Parses the SDP media section and returns RTCRtpParameters.
  SDPUtils.parseRtpParameters = function(mediaSection) {
    var description = {
      codecs: [],
      headerExtensions: [],
      fecMechanisms: [],
      rtcp: []
    };
    var lines = SDPUtils.splitLines(mediaSection);
    var mline = lines[0].split(' ');
    for (var i = 3; i < mline.length; i++) { // find all codecs from mline[3..]
      var pt = mline[i];
      var rtpmapline = SDPUtils.matchPrefix(
          mediaSection, 'a=rtpmap:' + pt + ' ')[0];
      if (rtpmapline) {
        var codec = SDPUtils.parseRtpMap(rtpmapline);
        var fmtps = SDPUtils.matchPrefix(
            mediaSection, 'a=fmtp:' + pt + ' ');
        // Only the first a=fmtp:<pt> is considered.
        codec.parameters = fmtps.length ? SDPUtils.parseFmtp(fmtps[0]) : {};
        codec.rtcpFeedback = SDPUtils.matchPrefix(
            mediaSection, 'a=rtcp-fb:' + pt + ' ')
          .map(SDPUtils.parseRtcpFb);
        description.codecs.push(codec);
        // parse FEC mechanisms from rtpmap lines.
        switch (codec.name.toUpperCase()) {
          case 'RED':
          case 'ULPFEC':
            description.fecMechanisms.push(codec.name.toUpperCase());
            break;
          default: // only RED and ULPFEC are recognized as FEC mechanisms.
            break;
        }
      }
    }
    SDPUtils.matchPrefix(mediaSection, 'a=extmap:').forEach(function(line) {
      description.headerExtensions.push(SDPUtils.parseExtmap(line));
    });
    // FIXME: parse rtcp.
    return description;
  };
  
  // Generates parts of the SDP media section describing the capabilities /
  // parameters.
  SDPUtils.writeRtpDescription = function(kind, caps) {
    var sdp = '';
  
    // Build the mline.
    sdp += 'm=' + kind + ' ';
    sdp += caps.codecs.length > 0 ? '9' : '0'; // reject if no codecs.
    sdp += ' UDP/TLS/RTP/SAVPF ';
    sdp += caps.codecs.map(function(codec) {
      if (codec.preferredPayloadType !== undefined) {
        return codec.preferredPayloadType;
      }
      return codec.payloadType;
    }).join(' ') + '\r\n';
  
    sdp += 'c=IN IP4 0.0.0.0\r\n';
    sdp += 'a=rtcp:9 IN IP4 0.0.0.0\r\n';
  
    // Add a=rtpmap lines for each codec. Also fmtp and rtcp-fb.
    caps.codecs.forEach(function(codec) {
      sdp += SDPUtils.writeRtpMap(codec);
      sdp += SDPUtils.writeFmtp(codec);
      sdp += SDPUtils.writeRtcpFb(codec);
    });
    // FIXME: add headerExtensions, fecMechanismş and rtcp.
    sdp += 'a=rtcp-mux\r\n';
    return sdp;
  };
  
  // Parses the SDP media section and returns an array of
  // RTCRtpEncodingParameters.
  SDPUtils.parseRtpEncodingParameters = function(mediaSection) {
    var encodingParameters = [];
    var description = SDPUtils.parseRtpParameters(mediaSection);
    var hasRed = description.fecMechanisms.indexOf('RED') !== -1;
    var hasUlpfec = description.fecMechanisms.indexOf('ULPFEC') !== -1;
  
    // filter a=ssrc:... cname:, ignore PlanB-msid
    var ssrcs = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:')
    .map(function(line) {
      return SDPUtils.parseSsrcMedia(line);
    })
    .filter(function(parts) {
      return parts.attribute === 'cname';
    });
    var primarySsrc = ssrcs.length > 0 && ssrcs[0].ssrc;
    var secondarySsrc;
  
    var flows = SDPUtils.matchPrefix(mediaSection, 'a=ssrc-group:FID')
    .map(function(line) {
      var parts = line.split(' ');
      parts.shift();
      return parts.map(function(part) {
        return parseInt(part, 10);
      });
    });
    if (flows.length > 0 && flows[0].length > 1 && flows[0][0] === primarySsrc) {
      secondarySsrc = flows[0][1];
    }
  
    description.codecs.forEach(function(codec) {
      if (codec.name.toUpperCase() === 'RTX' && codec.parameters.apt) {
        var encParam = {
          ssrc: primarySsrc,
          codecPayloadType: parseInt(codec.parameters.apt, 10),
          rtx: {
            payloadType: codec.payloadType,
            ssrc: secondarySsrc
          }
        };
        encodingParameters.push(encParam);
        if (hasRed) {
          encParam = JSON.parse(JSON.stringify(encParam));
          encParam.fec = {
            ssrc: secondarySsrc,
            mechanism: hasUlpfec ? 'red+ulpfec' : 'red'
          };
          encodingParameters.push(encParam);
        }
      }
    });
    if (encodingParameters.length === 0 && primarySsrc) {
      encodingParameters.push({
        ssrc: primarySsrc
      });
    }
  
    // we support both b=AS and b=TIAS but interpret AS as TIAS.
    var bandwidth = SDPUtils.matchPrefix(mediaSection, 'b=');
    if (bandwidth.length) {
      if (bandwidth[0].indexOf('b=TIAS:') === 0) {
        bandwidth = parseInt(bandwidth[0].substr(7), 10);
      } else if (bandwidth[0].indexOf('b=AS:') === 0) {
        bandwidth = parseInt(bandwidth[0].substr(5), 10);
      }
      encodingParameters.forEach(function(params) {
        params.maxBitrate = bandwidth;
      });
    }
    return encodingParameters;
  };
  
  SDPUtils.writeSessionBoilerplate = function() {
    // FIXME: sess-id should be an NTP timestamp.
    return 'v=0\r\n' +
        'o=thisisadapterortc 8169639915646943137 2 IN IP4 127.0.0.1\r\n' +
        's=-\r\n' +
        't=0 0\r\n';
  };
  
  SDPUtils.writeMediaSection = function(transceiver, caps, type, stream) {
    var sdp = SDPUtils.writeRtpDescription(transceiver.kind, caps);
  
    // Map ICE parameters (ufrag, pwd) to SDP.
    sdp += SDPUtils.writeIceParameters(
        transceiver.iceGatherer.getLocalParameters());
  
    // Map DTLS parameters to SDP.
    sdp += SDPUtils.writeDtlsParameters(
        transceiver.dtlsTransport.getLocalParameters(),
        type === 'offer' ? 'actpass' : 'active');
  
    sdp += 'a=mid:' + transceiver.mid + '\r\n';
  
    if (transceiver.rtpSender && transceiver.rtpReceiver) {
      sdp += 'a=sendrecv\r\n';
    } else if (transceiver.rtpSender) {
      sdp += 'a=sendonly\r\n';
    } else if (transceiver.rtpReceiver) {
      sdp += 'a=recvonly\r\n';
    } else {
      sdp += 'a=inactive\r\n';
    }
  
    // FIXME: for RTX there might be multiple SSRCs. Not implemented in Edge yet.
    if (transceiver.rtpSender) {
      var msid = 'msid:' + stream.id + ' ' +
          transceiver.rtpSender.track.id + '\r\n';
      sdp += 'a=' + msid;
      sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc +
          ' ' + msid;
    }
    // FIXME: this should be written by writeRtpDescription.
    sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc +
        ' cname:' + SDPUtils.localCName + '\r\n';
    return sdp;
  };
  
  // Gets the direction from the mediaSection or the sessionpart.
  SDPUtils.getDirection = function(mediaSection, sessionpart) {
    // Look for sendrecv, sendonly, recvonly, inactive, default to sendrecv.
    var lines = SDPUtils.splitLines(mediaSection);
    for (var i = 0; i < lines.length; i++) {
      switch (lines[i]) {
        case 'a=sendrecv':
        case 'a=sendonly':
        case 'a=recvonly':
        case 'a=inactive':
          return lines[i].substr(2);
        default:
          // FIXME: What should happen here?
      }
    }
    if (sessionpart) {
      return SDPUtils.getDirection(sessionpart);
    }
    return 'sendrecv';
  };
  
  // Expose public methods.
  module.exports = SDPUtils;
  
  },{}],2:[function(require,module,exports){
  /*
   *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
   *
   *  Use of this source code is governed by a BSD-style license
   *  that can be found in the LICENSE file in the root of the source
   *  tree.
   */
   /* eslint-env node */
  
  'use strict';
  
  // Shimming starts here.
  (function() {
    // Utils.
    var logging = require('./utils').log;
    var browserDetails = require('./utils').browserDetails;
    // Export to the adapter global object visible in the browser.
    module.exports.browserDetails = browserDetails;
    module.exports.extractVersion = require('./utils').extractVersion;
    module.exports.disableLog = require('./utils').disableLog;
  
    // Uncomment the line below if you want logging to occur, including logging
    // for the switch statement below. Can also be turned on in the browser via
    // adapter.disableLog(false), but then logging from the switch statement below
    // will not appear.
    // require('./utils').disableLog(false);
  
    // Browser shims.
    var chromeShim = require('./chrome/chrome_shim') || null;
    var edgeShim = require('./edge/edge_shim') || null;
    var firefoxShim = require('./firefox/firefox_shim') || null;
    var safariShim = require('./safari/safari_shim') || null;
  
    // Shim browser if found.
    switch (browserDetails.browser) {
      case 'opera': // fallthrough as it uses chrome shims
      case 'chrome':
        if (!chromeShim || !chromeShim.shimPeerConnection) {
          logging('Chrome shim is not included in this adapter release.');
          return;
        }
        logging('adapter.js shimming chrome.');
        // Export to the adapter global object visible in the browser.
        module.exports.browserShim = chromeShim;
  
        chromeShim.shimGetUserMedia();
        chromeShim.shimMediaStream();
        chromeShim.shimSourceObject();
        chromeShim.shimPeerConnection();
        chromeShim.shimOnTrack();
        break;
      case 'firefox':
        if (!firefoxShim || !firefoxShim.shimPeerConnection) {
          logging('Firefox shim is not included in this adapter release.');
          return;
        }
        logging('adapter.js shimming firefox.');
        // Export to the adapter global object visible in the browser.
        module.exports.browserShim = firefoxShim;
  
        firefoxShim.shimGetUserMedia();
        firefoxShim.shimSourceObject();
        firefoxShim.shimPeerConnection();
        firefoxShim.shimOnTrack();
        break;
      case 'edge':
        if (!edgeShim || !edgeShim.shimPeerConnection) {
          logging('MS edge shim is not included in this adapter release.');
          return;
        }
        logging('adapter.js shimming edge.');
        // Export to the adapter global object visible in the browser.
        module.exports.browserShim = edgeShim;
  
        edgeShim.shimGetUserMedia();
        edgeShim.shimPeerConnection();
        break;
      case 'safari':
        if (!safariShim) {
          logging('Safari shim is not included in this adapter release.');
          return;
        }
        logging('adapter.js shimming safari.');
        // Export to the adapter global object visible in the browser.
        module.exports.browserShim = safariShim;
  
        safariShim.shimGetUserMedia();
        break;
      default:
        logging('Unsupported browser!');
    }
  })();
  
  },{"./chrome/chrome_shim":3,"./edge/edge_shim":5,"./firefox/firefox_shim":7,"./safari/safari_shim":9,"./utils":10}],3:[function(require,module,exports){
  
  /*
   *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
   *
   *  Use of this source code is governed by a BSD-style license
   *  that can be found in the LICENSE file in the root of the source
   *  tree.
   */
   /* eslint-env node */
  'use strict';
  var logging = require('../utils.js').log;
  var browserDetails = require('../utils.js').browserDetails;
  
  var chromeShim = {
    shimMediaStream: function() {
      window.MediaStream = window.MediaStream || window.webkitMediaStream;
    },
  
    shimOnTrack: function() {
      if (typeof window === 'object' && window.RTCPeerConnection && !('ontrack' in
          window.RTCPeerConnection.prototype)) {
        Object.defineProperty(window.RTCPeerConnection.prototype, 'ontrack', {
          get: function() {
            return this._ontrack;
          },
          set: function(f) {
            var self = this;
            if (this._ontrack) {
              this.removeEventListener('track', this._ontrack);
              this.removeEventListener('addstream', this._ontrackpoly);
            }
            this.addEventListener('track', this._ontrack = f);
            this.addEventListener('addstream', this._ontrackpoly = function(e) {
              // onaddstream does not fire when a track is added to an existing
              // stream. But stream.onaddtrack is implemented so we use that.
              e.stream.addEventListener('addtrack', function(te) {
                var event = new Event('track');
                event.track = te.track;
                event.receiver = {track: te.track};
                event.streams = [e.stream];
                self.dispatchEvent(event);
              });
              e.stream.getTracks().forEach(function(track) {
                var event = new Event('track');
                event.track = track;
                event.receiver = {track: track};
                event.streams = [e.stream];
                this.dispatchEvent(event);
              }.bind(this));
            }.bind(this));
          }
        });
      }
    },
  
    shimSourceObject: function() {
      if (typeof window === 'object') {
        if (window.HTMLMediaElement &&
          !('srcObject' in window.HTMLMediaElement.prototype)) {
          // Shim the srcObject property, once, when HTMLMediaElement is found.
          Object.defineProperty(window.HTMLMediaElement.prototype, 'srcObject', {
            get: function() {
              return this._srcObject;
            },
            set: function(stream) {
              var self = this;
              // Use _srcObject as a private property for this shim
              this._srcObject = stream;
              if (this.src) {
                URL.revokeObjectURL(this.src);
              }
  
              if (!stream) {
                this.src = '';
                return;
              }
              this.src = URL.createObjectURL(stream);
              // We need to recreate the blob url when a track is added or
              // removed. Doing it manually since we want to avoid a recursion.
              stream.addEventListener('addtrack', function() {
                if (self.src) {
                  URL.revokeObjectURL(self.src);
                }
                self.src = URL.createObjectURL(stream);
              });
              stream.addEventListener('removetrack', function() {
                if (self.src) {
                  URL.revokeObjectURL(self.src);
                }
                self.src = URL.createObjectURL(stream);
              });
            }
          });
        }
      }
    },
  
    shimPeerConnection: function() {
      // The RTCPeerConnection object.
      window.RTCPeerConnection = function(pcConfig, pcConstraints) {
        // Translate iceTransportPolicy to iceTransports,
        // see https://code.google.com/p/webrtc/issues/detail?id=4869
        logging('PeerConnection');
        if (pcConfig && pcConfig.iceTransportPolicy) {
          pcConfig.iceTransports = pcConfig.iceTransportPolicy;
        }
  
        var pc = new webkitRTCPeerConnection(pcConfig, pcConstraints);
        var origGetStats = pc.getStats.bind(pc);
        pc.getStats = function(selector, successCallback, errorCallback) {
          var self = this;
          var args = arguments;
  
          // If selector is a function then we are in the old style stats so just
          // pass back the original getStats format to avoid breaking old users.
          if (arguments.length > 0 && typeof selector === 'function') {
            return origGetStats(selector, successCallback);
          }
  
          var fixChromeStats_ = function(response) {
            var standardReport = {};
            var reports = response.result();
            reports.forEach(function(report) {
              var standardStats = {
                id: report.id,
                timestamp: report.timestamp,
                type: report.type
              };
              report.names().forEach(function(name) {
                standardStats[name] = report.stat(name);
              });
              standardReport[standardStats.id] = standardStats;
            });
  
            return standardReport;
          };
  
          // shim getStats with maplike support
          var makeMapStats = function(stats, legacyStats) {
            var map = new Map(Object.keys(stats).map(function(key) {
              return[key, stats[key]];
            }));
            legacyStats = legacyStats || stats;
            Object.keys(legacyStats).forEach(function(key) {
              map[key] = legacyStats[key];
            });
            return map;
          };
  
          if (arguments.length >= 2) {
            var successCallbackWrapper_ = function(response) {
              args[1](makeMapStats(fixChromeStats_(response)));
            };
  
            return origGetStats.apply(this, [successCallbackWrapper_,
                arguments[0]]);
          }
  
          // promise-support
          return new Promise(function(resolve, reject) {
            if (args.length === 1 && typeof selector === 'object') {
              origGetStats.apply(self, [
                function(response) {
                  resolve(makeMapStats(fixChromeStats_(response)));
                }, reject]);
            } else {
              // Preserve legacy chrome stats only on legacy access of stats obj
              origGetStats.apply(self, [
                function(response) {
                  resolve(makeMapStats(fixChromeStats_(response),
                      response.result()));
                }, reject]);
            }
          }).then(successCallback, errorCallback);
        };
  
        return pc;
      };
      window.RTCPeerConnection.prototype = webkitRTCPeerConnection.prototype;
  
      // wrap static methods. Currently just generateCertificate.
      if (webkitRTCPeerConnection.generateCertificate) {
        Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
          get: function() {
            return webkitRTCPeerConnection.generateCertificate;
          }
        });
      }
  
      ['createOffer', 'createAnswer'].forEach(function(method) {
        var nativeMethod = webkitRTCPeerConnection.prototype[method];
        webkitRTCPeerConnection.prototype[method] = function() {
          var self = this;
          if (arguments.length < 1 || (arguments.length === 1 &&
              typeof arguments[0] === 'object')) {
            var opts = arguments.length === 1 ? arguments[0] : undefined;
            return new Promise(function(resolve, reject) {
              nativeMethod.apply(self, [resolve, reject, opts]);
            });
          }
          return nativeMethod.apply(this, arguments);
        };
      });
  
      // add promise support -- natively available in Chrome 51
      if (browserDetails.version < 51) {
        ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
            .forEach(function(method) {
              var nativeMethod = webkitRTCPeerConnection.prototype[method];
              webkitRTCPeerConnection.prototype[method] = function() {
                var args = arguments;
                var self = this;
                var promise = new Promise(function(resolve, reject) {
                  nativeMethod.apply(self, [args[0], resolve, reject]);
                });
                if (args.length < 2) {
                  return promise;
                }
                return promise.then(function() {
                  args[1].apply(null, []);
                },
                function(err) {
                  if (args.length >= 3) {
                    args[2].apply(null, [err]);
                  }
                });
              };
            });
      }
  
      // shim implicit creation of RTCSessionDescription/RTCIceCandidate
      ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
          .forEach(function(method) {
            var nativeMethod = webkitRTCPeerConnection.prototype[method];
            webkitRTCPeerConnection.prototype[method] = function() {
              arguments[0] = new ((method === 'addIceCandidate') ?
                  RTCIceCandidate : RTCSessionDescription)(arguments[0]);
              return nativeMethod.apply(this, arguments);
            };
          });
  
      // support for addIceCandidate(null)
      var nativeAddIceCandidate =
          RTCPeerConnection.prototype.addIceCandidate;
      RTCPeerConnection.prototype.addIceCandidate = function() {
        return arguments[0] === null ? Promise.resolve()
            : nativeAddIceCandidate.apply(this, arguments);
      };
    }
  };
  
  
  // Expose public methods.
  module.exports = {
    shimMediaStream: chromeShim.shimMediaStream,
    shimOnTrack: chromeShim.shimOnTrack,
    shimSourceObject: chromeShim.shimSourceObject,
    shimPeerConnection: chromeShim.shimPeerConnection,
    shimGetUserMedia: require('./getusermedia')
  };
  
  },{"../utils.js":10,"./getusermedia":4}],4:[function(require,module,exports){
  /*
   *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
   *
   *  Use of this source code is governed by a BSD-style license
   *  that can be found in the LICENSE file in the root of the source
   *  tree.
   */
   /* eslint-env node */
  'use strict';
  var logging = require('../utils.js').log;
  
  // Expose public methods.
  module.exports = function() {
    var constraintsToChrome_ = function(c) {
      if (typeof c !== 'object' || c.mandatory || c.optional) {
        return c;
      }
      var cc = {};
      Object.keys(c).forEach(function(key) {
        if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
          return;
        }
        var r = (typeof c[key] === 'object') ? c[key] : {ideal: c[key]};
        if (r.exact !== undefined && typeof r.exact === 'number') {
          r.min = r.max = r.exact;
        }
        var oldname_ = function(prefix, name) {
          if (prefix) {
            return prefix + name.charAt(0).toUpperCase() + name.slice(1);
          }
          return (name === 'deviceId') ? 'sourceId' : name;
        };
        if (r.ideal !== undefined) {
          cc.optional = cc.optional || [];
          var oc = {};
          if (typeof r.ideal === 'number') {
            oc[oldname_('min', key)] = r.ideal;
            cc.optional.push(oc);
            oc = {};
            oc[oldname_('max', key)] = r.ideal;
            cc.optional.push(oc);
          } else {
            oc[oldname_('', key)] = r.ideal;
            cc.optional.push(oc);
          }
        }
        if (r.exact !== undefined && typeof r.exact !== 'number') {
          cc.mandatory = cc.mandatory || {};
          cc.mandatory[oldname_('', key)] = r.exact;
        } else {
          ['min', 'max'].forEach(function(mix) {
            if (r[mix] !== undefined) {
              cc.mandatory = cc.mandatory || {};
              cc.mandatory[oldname_(mix, key)] = r[mix];
            }
          });
        }
      });
      if (c.advanced) {
        cc.optional = (cc.optional || []).concat(c.advanced);
      }
      return cc;
    };
  
    var shimConstraints_ = function(constraints, func) {
      constraints = JSON.parse(JSON.stringify(constraints));
      if (constraints && constraints.audio) {
        constraints.audio = constraintsToChrome_(constraints.audio);
      }
      if (constraints && typeof constraints.video === 'object') {
        // Shim facingMode for mobile, where it defaults to "user".
        var face = constraints.video.facingMode;
        face = face && ((typeof face === 'object') ? face : {ideal: face});
  
        if ((face && (face.exact === 'user' || face.exact === 'environment' ||
                      face.ideal === 'user' || face.ideal === 'environment')) &&
            !(navigator.mediaDevices.getSupportedConstraints &&
              navigator.mediaDevices.getSupportedConstraints().facingMode)) {
          delete constraints.video.facingMode;
          if (face.exact === 'environment' || face.ideal === 'environment') {
            // Look for "back" in label, or use last cam (typically back cam).
            return navigator.mediaDevices.enumerateDevices()
            .then(function(devices) {
              devices = devices.filter(function(d) {
                return d.kind === 'videoinput';
              });
              var back = devices.find(function(d) {
                return d.label.toLowerCase().indexOf('back') !== -1;
              }) || (devices.length && devices[devices.length - 1]);
              if (back) {
                constraints.video.deviceId = face.exact ? {exact: back.deviceId} :
                                                          {ideal: back.deviceId};
              }
              constraints.video = constraintsToChrome_(constraints.video);
              logging('chrome: ' + JSON.stringify(constraints));
              return func(constraints);
            });
          }
        }
        constraints.video = constraintsToChrome_(constraints.video);
      }
      logging('chrome: ' + JSON.stringify(constraints));
      return func(constraints);
    };
  
    var shimError_ = function(e) {
      return {
        name: {
          PermissionDeniedError: 'NotAllowedError',
          ConstraintNotSatisfiedError: 'OverconstrainedError'
        }[e.name] || e.name,
        message: e.message,
        constraint: e.constraintName,
        toString: function() {
          return this.name + (this.message && ': ') + this.message;
        }
      };
    };
  
    var getUserMedia_ = function(constraints, onSuccess, onError) {
      shimConstraints_(constraints, function(c) {
        navigator.webkitGetUserMedia(c, onSuccess, function(e) {
          onError(shimError_(e));
        });
      });
    };
  
    navigator.getUserMedia = getUserMedia_;
  
    // Returns the result of getUserMedia as a Promise.
    var getUserMediaPromise_ = function(constraints) {
      return new Promise(function(resolve, reject) {
        navigator.getUserMedia(constraints, resolve, reject);
      });
    };
  
    if (!navigator.mediaDevices) {
      navigator.mediaDevices = {
        getUserMedia: getUserMediaPromise_,
        enumerateDevices: function() {
          return new Promise(function(resolve) {
            var kinds = {audio: 'audioinput', video: 'videoinput'};
            return MediaStreamTrack.getSources(function(devices) {
              resolve(devices.map(function(device) {
                return {label: device.label,
                        kind: kinds[device.kind],
                        deviceId: device.id,
                        groupId: ''};
              }));
            });
          });
        }
      };
    }
  
    // A shim for getUserMedia method on the mediaDevices object.
    // TODO(KaptenJansson) remove once implemented in Chrome stable.
    if (!navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia = function(constraints) {
        return getUserMediaPromise_(constraints);
      };
    } else {
      // Even though Chrome 45 has navigator.mediaDevices and a getUserMedia
      // function which returns a Promise, it does not accept spec-style
      // constraints.
      var origGetUserMedia = navigator.mediaDevices.getUserMedia.
          bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = function(cs) {
        return shimConstraints_(cs, function(c) {
          return origGetUserMedia(c).catch(function(e) {
            return Promise.reject(shimError_(e));
          });
        });
      };
    }
  
    // Dummy devicechange event methods.
    // TODO(KaptenJansson) remove once implemented in Chrome stable.
    if (typeof navigator.mediaDevices.addEventListener === 'undefined') {
      navigator.mediaDevices.addEventListener = function() {
        logging('Dummy mediaDevices.addEventListener called.');
      };
    }
    if (typeof navigator.mediaDevices.removeEventListener === 'undefined') {
      navigator.mediaDevices.removeEventListener = function() {
        logging('Dummy mediaDevices.removeEventListener called.');
      };
    }
  };
  
  },{"../utils.js":10}],5:[function(require,module,exports){
  /*
   *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
   *
   *  Use of this source code is governed by a BSD-style license
   *  that can be found in the LICENSE file in the root of the source
   *  tree.
   */
   /* eslint-env node */
  'use strict';
  
  var SDPUtils = require('sdp');
  var browserDetails = require('../utils').browserDetails;
  
  var edgeShim = {
    shimPeerConnection: function() {
      if (window.RTCIceGatherer) {
        // ORTC defines an RTCIceCandidate object but no constructor.
        // Not implemented in Edge.
        if (!window.RTCIceCandidate) {
          window.RTCIceCandidate = function(args) {
            return args;
          };
        }
        // ORTC does not have a session description object but
        // other browsers (i.e. Chrome) that will support both PC and ORTC
        // in the future might have this defined already.
        if (!window.RTCSessionDescription) {
          window.RTCSessionDescription = function(args) {
            return args;
          };
        }
      }
  
      window.RTCPeerConnection = function(config) {
        var self = this;
  
        var _eventTarget = document.createDocumentFragment();
        ['addEventListener', 'removeEventListener', 'dispatchEvent']
            .forEach(function(method) {
              self[method] = _eventTarget[method].bind(_eventTarget);
            });
  
        this.onicecandidate = null;
        this.onaddstream = null;
        this.ontrack = null;
        this.onremovestream = null;
        this.onsignalingstatechange = null;
        this.oniceconnectionstatechange = null;
        this.onnegotiationneeded = null;
        this.ondatachannel = null;
  
        this.localStreams = [];
        this.remoteStreams = [];
        this.getLocalStreams = function() {
          return self.localStreams;
        };
        this.getRemoteStreams = function() {
          return self.remoteStreams;
        };
  
        this.localDescription = new RTCSessionDescription({
          type: '',
          sdp: ''
        });
        this.remoteDescription = new RTCSessionDescription({
          type: '',
          sdp: ''
        });
        this.signalingState = 'stable';
        this.iceConnectionState = 'new';
        this.iceGatheringState = 'new';
  
        this.iceOptions = {
          gatherPolicy: 'all',
          iceServers: []
        };
        if (config && config.iceTransportPolicy) {
          switch (config.iceTransportPolicy) {
            case 'all':
            case 'relay':
              this.iceOptions.gatherPolicy = config.iceTransportPolicy;
              break;
            case 'none':
              // FIXME: remove once implementation and spec have added this.
              throw new TypeError('iceTransportPolicy "none" not supported');
            default:
              // don't set iceTransportPolicy.
              break;
          }
        }
        this.usingBundle = config && config.bundlePolicy === 'max-bundle';
  
        if (config && config.iceServers) {
          // Edge does not like
          // 1) stun:
          // 2) turn: that does not have all of turn:host:port?transport=udp
          // 3) turn: with ipv6 addresses
          var iceServers = JSON.parse(JSON.stringify(config.iceServers));
          this.iceOptions.iceServers = iceServers.filter(function(server) {
            if (server && server.urls) {
              var urls = server.urls;
              if (typeof urls === 'string') {
                urls = [urls];
              }
              urls = urls.filter(function(url) {
                return (url.indexOf('turn:') === 0 &&
                    url.indexOf('transport=udp') !== -1 &&
                    url.indexOf('turn:[') === -1) ||
                    (url.indexOf('stun:') === 0 &&
                      browserDetails.version >= 14393);
              })[0];
              return !!urls;
            }
            return false;
          });
        }
  
        // per-track iceGathers, iceTransports, dtlsTransports, rtpSenders, ...
        // everything that is needed to describe a SDP m-line.
        this.transceivers = [];
  
        // since the iceGatherer is currently created in createOffer but we
        // must not emit candidates until after setLocalDescription we buffer
        // them in this array.
        this._localIceCandidatesBuffer = [];
      };
  
      window.RTCPeerConnection.prototype._emitBufferedCandidates = function() {
        var self = this;
        var sections = SDPUtils.splitSections(self.localDescription.sdp);
        // FIXME: need to apply ice candidates in a way which is async but
        // in-order
        this._localIceCandidatesBuffer.forEach(function(event) {
          var end = !event.candidate || Object.keys(event.candidate).length === 0;
          if (end) {
            for (var j = 1; j < sections.length; j++) {
              if (sections[j].indexOf('\r\na=end-of-candidates\r\n') === -1) {
                sections[j] += 'a=end-of-candidates\r\n';
              }
            }
          } else if (event.candidate.candidate.indexOf('typ endOfCandidates')
              === -1) {
            sections[event.candidate.sdpMLineIndex + 1] +=
                'a=' + event.candidate.candidate + '\r\n';
          }
          self.localDescription.sdp = sections.join('');
          self.dispatchEvent(event);
          if (self.onicecandidate !== null) {
            self.onicecandidate(event);
          }
          if (!event.candidate && self.iceGatheringState !== 'complete') {
            var complete = self.transceivers.every(function(transceiver) {
              return transceiver.iceGatherer &&
                  transceiver.iceGatherer.state === 'completed';
            });
            if (complete) {
              self.iceGatheringState = 'complete';
            }
          }
        });
        this._localIceCandidatesBuffer = [];
      };
  
      window.RTCPeerConnection.prototype.addStream = function(stream) {
        // Clone is necessary for local demos mostly, attaching directly
        // to two different senders does not work (build 10547).
        this.localStreams.push(stream.clone());
        this._maybeFireNegotiationNeeded();
      };
  
      window.RTCPeerConnection.prototype.removeStream = function(stream) {
        var idx = this.localStreams.indexOf(stream);
        if (idx > -1) {
          this.localStreams.splice(idx, 1);
          this._maybeFireNegotiationNeeded();
        }
      };
  
      window.RTCPeerConnection.prototype.getSenders = function() {
        return this.transceivers.filter(function(transceiver) {
          return !!transceiver.rtpSender;
        })
        .map(function(transceiver) {
          return transceiver.rtpSender;
        });
      };
  
      window.RTCPeerConnection.prototype.getReceivers = function() {
        return this.transceivers.filter(function(transceiver) {
          return !!transceiver.rtpReceiver;
        })
        .map(function(transceiver) {
          return transceiver.rtpReceiver;
        });
      };
  
      // Determines the intersection of local and remote capabilities.
      window.RTCPeerConnection.prototype._getCommonCapabilities =
          function(localCapabilities, remoteCapabilities) {
            var commonCapabilities = {
              codecs: [],
              headerExtensions: [],
              fecMechanisms: []
            };
            localCapabilities.codecs.forEach(function(lCodec) {
              for (var i = 0; i < remoteCapabilities.codecs.length; i++) {
                var rCodec = remoteCapabilities.codecs[i];
                if (lCodec.name.toLowerCase() === rCodec.name.toLowerCase() &&
                    lCodec.clockRate === rCodec.clockRate &&
                    lCodec.numChannels === rCodec.numChannels) {
                  // push rCodec so we reply with offerer payload type
                  commonCapabilities.codecs.push(rCodec);
  
                  // determine common feedback mechanisms
                  rCodec.rtcpFeedback = rCodec.rtcpFeedback.filter(function(fb) {
                    for (var j = 0; j < lCodec.rtcpFeedback.length; j++) {
                      if (lCodec.rtcpFeedback[j].type === fb.type &&
                          lCodec.rtcpFeedback[j].parameter === fb.parameter) {
                        return true;
                      }
                    }
                    return false;
                  });
                  // FIXME: also need to determine .parameters
                  //  see https://github.com/openpeer/ortc/issues/569
                  break;
                }
              }
            });
  
            localCapabilities.headerExtensions
                .forEach(function(lHeaderExtension) {
                  for (var i = 0; i < remoteCapabilities.headerExtensions.length;
                       i++) {
                    var rHeaderExtension = remoteCapabilities.headerExtensions[i];
                    if (lHeaderExtension.uri === rHeaderExtension.uri) {
                      commonCapabilities.headerExtensions.push(rHeaderExtension);
                      break;
                    }
                  }
                });
  
            // FIXME: fecMechanisms
            return commonCapabilities;
          };
  
      // Create ICE gatherer, ICE transport and DTLS transport.
      window.RTCPeerConnection.prototype._createIceAndDtlsTransports =
          function(mid, sdpMLineIndex) {
            var self = this;
            var iceGatherer = new RTCIceGatherer(self.iceOptions);
            var iceTransport = new RTCIceTransport(iceGatherer);
            iceGatherer.onlocalcandidate = function(evt) {
              var event = new Event('icecandidate');
              event.candidate = {sdpMid: mid, sdpMLineIndex: sdpMLineIndex};
  
              var cand = evt.candidate;
              var end = !cand || Object.keys(cand).length === 0;
              // Edge emits an empty object for RTCIceCandidateComplete‥
              if (end) {
                // polyfill since RTCIceGatherer.state is not implemented in
                // Edge 10547 yet.
                if (iceGatherer.state === undefined) {
                  iceGatherer.state = 'completed';
                }
  
                // Emit a candidate with type endOfCandidates to make the samples
                // work. Edge requires addIceCandidate with this empty candidate
                // to start checking. The real solution is to signal
                // end-of-candidates to the other side when getting the null
                // candidate but some apps (like the samples) don't do that.
                event.candidate.candidate =
                    'candidate:1 1 udp 1 0.0.0.0 9 typ endOfCandidates';
              } else {
                // RTCIceCandidate doesn't have a component, needs to be added
                cand.component = iceTransport.component === 'RTCP' ? 2 : 1;
                event.candidate.candidate = SDPUtils.writeCandidate(cand);
              }
  
              // update local description.
              var sections = SDPUtils.splitSections(self.localDescription.sdp);
              if (event.candidate.candidate.indexOf('typ endOfCandidates')
                  === -1) {
                sections[event.candidate.sdpMLineIndex + 1] +=
                    'a=' + event.candidate.candidate + '\r\n';
              } else {
                sections[event.candidate.sdpMLineIndex + 1] +=
                    'a=end-of-candidates\r\n';
              }
              self.localDescription.sdp = sections.join('');
  
              var complete = self.transceivers.every(function(transceiver) {
                return transceiver.iceGatherer &&
                    transceiver.iceGatherer.state === 'completed';
              });
  
              // Emit candidate if localDescription is set.
              // Also emits null candidate when all gatherers are complete.
              switch (self.iceGatheringState) {
                case 'new':
                  self._localIceCandidatesBuffer.push(event);
                  if (end && complete) {
                    self._localIceCandidatesBuffer.push(
                        new Event('icecandidate'));
                  }
                  break;
                case 'gathering':
                  self._emitBufferedCandidates();
                  self.dispatchEvent(event);
                  if (self.onicecandidate !== null) {
                    self.onicecandidate(event);
                  }
                  if (complete) {
                    self.dispatchEvent(new Event('icecandidate'));
                    if (self.onicecandidate !== null) {
                      self.onicecandidate(new Event('icecandidate'));
                    }
                    self.iceGatheringState = 'complete';
                  }
                  break;
                case 'complete':
                  // should not happen... currently!
                  break;
                default: // no-op.
                  break;
              }
            };
            iceTransport.onicestatechange = function() {
              self._updateConnectionState();
            };
  
            var dtlsTransport = new RTCDtlsTransport(iceTransport);
            dtlsTransport.ondtlsstatechange = function() {
              self._updateConnectionState();
            };
            dtlsTransport.onerror = function() {
              // onerror does not set state to failed by itself.
              dtlsTransport.state = 'failed';
              self._updateConnectionState();
            };
  
            return {
              iceGatherer: iceGatherer,
              iceTransport: iceTransport,
              dtlsTransport: dtlsTransport
            };
          };
  
      // Start the RTP Sender and Receiver for a transceiver.
      window.RTCPeerConnection.prototype._transceive = function(transceiver,
          send, recv) {
        var params = this._getCommonCapabilities(transceiver.localCapabilities,
            transceiver.remoteCapabilities);
        if (send && transceiver.rtpSender) {
          params.encodings = transceiver.sendEncodingParameters;
          params.rtcp = {
            cname: SDPUtils.localCName
          };
          if (transceiver.recvEncodingParameters.length) {
            params.rtcp.ssrc = transceiver.recvEncodingParameters[0].ssrc;
          }
          transceiver.rtpSender.send(params);
        }
        if (recv && transceiver.rtpReceiver) {
          params.encodings = transceiver.recvEncodingParameters;
          params.rtcp = {
            cname: transceiver.cname
          };
          if (transceiver.sendEncodingParameters.length) {
            params.rtcp.ssrc = transceiver.sendEncodingParameters[0].ssrc;
          }
          transceiver.rtpReceiver.receive(params);
        }
      };
  
      window.RTCPeerConnection.prototype.setLocalDescription =
          function(description) {
            var self = this;
            var sections;
            var sessionpart;
            if (description.type === 'offer') {
              // FIXME: What was the purpose of this empty if statement?
              // if (!this._pendingOffer) {
              // } else {
              if (this._pendingOffer) {
                // VERY limited support for SDP munging. Limited to:
                // * changing the order of codecs
                sections = SDPUtils.splitSections(description.sdp);
                sessionpart = sections.shift();
                sections.forEach(function(mediaSection, sdpMLineIndex) {
                  var caps = SDPUtils.parseRtpParameters(mediaSection);
                  self._pendingOffer[sdpMLineIndex].localCapabilities = caps;
                });
                this.transceivers = this._pendingOffer;
                delete this._pendingOffer;
              }
            } else if (description.type === 'answer') {
              sections = SDPUtils.splitSections(self.remoteDescription.sdp);
              sessionpart = sections.shift();
              var isIceLite = SDPUtils.matchPrefix(sessionpart,
                  'a=ice-lite').length > 0;
              sections.forEach(function(mediaSection, sdpMLineIndex) {
                var transceiver = self.transceivers[sdpMLineIndex];
                var iceGatherer = transceiver.iceGatherer;
                var iceTransport = transceiver.iceTransport;
                var dtlsTransport = transceiver.dtlsTransport;
                var localCapabilities = transceiver.localCapabilities;
                var remoteCapabilities = transceiver.remoteCapabilities;
  
                var rejected = mediaSection.split('\n', 1)[0]
                    .split(' ', 2)[1] === '0';
  
                if (!rejected && !transceiver.isDatachannel) {
                  var remoteIceParameters = SDPUtils.getIceParameters(
                      mediaSection, sessionpart);
                  if (isIceLite) {
                    var cands = SDPUtils.matchPrefix(mediaSection, 'a=candidate:')
                    .map(function(cand) {
                      return SDPUtils.parseCandidate(cand);
                    })
                    .filter(function(cand) {
                      return cand.component === '1';
                    });
                    // ice-lite only includes host candidates in the SDP so we can
                    // use setRemoteCandidates (which implies an
                    // RTCIceCandidateComplete)
                    if (cands.length) {
                      iceTransport.setRemoteCandidates(cands);
                    }
                  }
                  var remoteDtlsParameters = SDPUtils.getDtlsParameters(
                      mediaSection, sessionpart);
                  if (isIceLite) {
                    remoteDtlsParameters.role = 'server';
                  }
  
                  if (!self.usingBundle || sdpMLineIndex === 0) {
                    iceTransport.start(iceGatherer, remoteIceParameters,
                        isIceLite ? 'controlling' : 'controlled');
                    dtlsTransport.start(remoteDtlsParameters);
                  }
  
                  // Calculate intersection of capabilities.
                  var params = self._getCommonCapabilities(localCapabilities,
                      remoteCapabilities);
  
                  // Start the RTCRtpSender. The RTCRtpReceiver for this
                  // transceiver has already been started in setRemoteDescription.
                  self._transceive(transceiver,
                      params.codecs.length > 0,
                      false);
                }
              });
            }
  
            this.localDescription = {
              type: description.type,
              sdp: description.sdp
            };
            switch (description.type) {
              case 'offer':
                this._updateSignalingState('have-local-offer');
                break;
              case 'answer':
                this._updateSignalingState('stable');
                break;
              default:
                throw new TypeError('unsupported type "' + description.type +
                    '"');
            }
  
            // If a success callback was provided, emit ICE candidates after it
            // has been executed. Otherwise, emit callback after the Promise is
            // resolved.
            var hasCallback = arguments.length > 1 &&
              typeof arguments[1] === 'function';
            if (hasCallback) {
              var cb = arguments[1];
              window.setTimeout(function() {
                cb();
                if (self.iceGatheringState === 'new') {
                  self.iceGatheringState = 'gathering';
                }
                self._emitBufferedCandidates();
              }, 0);
            }
            var p = Promise.resolve();
            p.then(function() {
              if (!hasCallback) {
                if (self.iceGatheringState === 'new') {
                  self.iceGatheringState = 'gathering';
                }
                // Usually candidates will be emitted earlier.
                window.setTimeout(self._emitBufferedCandidates.bind(self), 500);
              }
            });
            return p;
          };
  
      window.RTCPeerConnection.prototype.setRemoteDescription =
          function(description) {
            var self = this;
            var stream = new MediaStream();
            var receiverList = [];
            var sections = SDPUtils.splitSections(description.sdp);
            var sessionpart = sections.shift();
            var isIceLite = SDPUtils.matchPrefix(sessionpart,
                'a=ice-lite').length > 0;
            this.usingBundle = SDPUtils.matchPrefix(sessionpart,
                'a=group:BUNDLE ').length > 0;
            sections.forEach(function(mediaSection, sdpMLineIndex) {
              var lines = SDPUtils.splitLines(mediaSection);
              var mline = lines[0].substr(2).split(' ');
              var kind = mline[0];
              var rejected = mline[1] === '0';
              var direction = SDPUtils.getDirection(mediaSection, sessionpart);
  
              var mid = SDPUtils.matchPrefix(mediaSection, 'a=mid:');
              if (mid.length) {
                mid = mid[0].substr(6);
              } else {
                mid = SDPUtils.generateIdentifier();
              }
  
              // Reject datachannels which are not implemented yet.
              if (kind === 'application' && mline[2] === 'DTLS/SCTP') {
                self.transceivers[sdpMLineIndex] = {
                  mid: mid,
                  isDatachannel: true
                };
                return;
              }
  
              var transceiver;
              var iceGatherer;
              var iceTransport;
              var dtlsTransport;
              var rtpSender;
              var rtpReceiver;
              var sendEncodingParameters;
              var recvEncodingParameters;
              var localCapabilities;
  
              var track;
              // FIXME: ensure the mediaSection has rtcp-mux set.
              var remoteCapabilities = SDPUtils.parseRtpParameters(mediaSection);
              var remoteIceParameters;
              var remoteDtlsParameters;
              if (!rejected) {
                remoteIceParameters = SDPUtils.getIceParameters(mediaSection,
                    sessionpart);
                remoteDtlsParameters = SDPUtils.getDtlsParameters(mediaSection,
                    sessionpart);
                remoteDtlsParameters.role = 'client';
              }
              recvEncodingParameters =
                  SDPUtils.parseRtpEncodingParameters(mediaSection);
  
              var cname;
              // Gets the first SSRC. Note that with RTX there might be multiple
              // SSRCs.
              var remoteSsrc = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:')
                  .map(function(line) {
                    return SDPUtils.parseSsrcMedia(line);
                  })
                  .filter(function(obj) {
                    return obj.attribute === 'cname';
                  })[0];
              if (remoteSsrc) {
                cname = remoteSsrc.value;
              }
  
              var isComplete = SDPUtils.matchPrefix(mediaSection,
                  'a=end-of-candidates', sessionpart).length > 0;
              var cands = SDPUtils.matchPrefix(mediaSection, 'a=candidate:')
                  .map(function(cand) {
                    return SDPUtils.parseCandidate(cand);
                  })
                  .filter(function(cand) {
                    return cand.component === '1';
                  });
              if (description.type === 'offer' && !rejected) {
                var transports = self.usingBundle && sdpMLineIndex > 0 ? {
                  iceGatherer: self.transceivers[0].iceGatherer,
                  iceTransport: self.transceivers[0].iceTransport,
                  dtlsTransport: self.transceivers[0].dtlsTransport
                } : self._createIceAndDtlsTransports(mid, sdpMLineIndex);
  
                if (isComplete) {
                  transports.iceTransport.setRemoteCandidates(cands);
                }
  
                localCapabilities = RTCRtpReceiver.getCapabilities(kind);
                sendEncodingParameters = [{
                  ssrc: (2 * sdpMLineIndex + 2) * 1001
                }];
  
                rtpReceiver = new RTCRtpReceiver(transports.dtlsTransport, kind);
  
                track = rtpReceiver.track;
                receiverList.push([track, rtpReceiver]);
                // FIXME: not correct when there are multiple streams but that is
                // not currently supported in this shim.
                stream.addTrack(track);
  
                // FIXME: look at direction.
                if (self.localStreams.length > 0 &&
                    self.localStreams[0].getTracks().length >= sdpMLineIndex) {
                  var localTrack;
                  if (kind === 'audio') {
                    localTrack = self.localStreams[0].getAudioTracks()[0];
                  } else if (kind === 'video') {
                    localTrack = self.localStreams[0].getVideoTracks()[0];
                  }
                  if (localTrack) {
                    rtpSender = new RTCRtpSender(localTrack,
                        transports.dtlsTransport);
                  }
                }
  
                self.transceivers[sdpMLineIndex] = {
                  iceGatherer: transports.iceGatherer,
                  iceTransport: transports.iceTransport,
                  dtlsTransport: transports.dtlsTransport,
                  localCapabilities: localCapabilities,
                  remoteCapabilities: remoteCapabilities,
                  rtpSender: rtpSender,
                  rtpReceiver: rtpReceiver,
                  kind: kind,
                  mid: mid,
                  cname: cname,
                  sendEncodingParameters: sendEncodingParameters,
                  recvEncodingParameters: recvEncodingParameters
                };
                // Start the RTCRtpReceiver now. The RTPSender is started in
                // setLocalDescription.
                self._transceive(self.transceivers[sdpMLineIndex],
                    false,
                    direction === 'sendrecv' || direction === 'sendonly');
              } else if (description.type === 'answer' && !rejected) {
                transceiver = self.transceivers[sdpMLineIndex];
                iceGatherer = transceiver.iceGatherer;
                iceTransport = transceiver.iceTransport;
                dtlsTransport = transceiver.dtlsTransport;
                rtpSender = transceiver.rtpSender;
                rtpReceiver = transceiver.rtpReceiver;
                sendEncodingParameters = transceiver.sendEncodingParameters;
                localCapabilities = transceiver.localCapabilities;
  
                self.transceivers[sdpMLineIndex].recvEncodingParameters =
                    recvEncodingParameters;
                self.transceivers[sdpMLineIndex].remoteCapabilities =
                    remoteCapabilities;
                self.transceivers[sdpMLineIndex].cname = cname;
  
                if ((isIceLite || isComplete) && cands.length) {
                  iceTransport.setRemoteCandidates(cands);
                }
                if (!self.usingBundle || sdpMLineIndex === 0) {
                  iceTransport.start(iceGatherer, remoteIceParameters,
                      'controlling');
                  dtlsTransport.start(remoteDtlsParameters);
                }
  
                self._transceive(transceiver,
                    direction === 'sendrecv' || direction === 'recvonly',
                    direction === 'sendrecv' || direction === 'sendonly');
  
                if (rtpReceiver &&
                    (direction === 'sendrecv' || direction === 'sendonly')) {
                  track = rtpReceiver.track;
                  receiverList.push([track, rtpReceiver]);
                  stream.addTrack(track);
                } else {
                  // FIXME: actually the receiver should be created later.
                  delete transceiver.rtpReceiver;
                }
              }
            });
  
            this.remoteDescription = {
              type: description.type,
              sdp: description.sdp
            };
            switch (description.type) {
              case 'offer':
                this._updateSignalingState('have-remote-offer');
                break;
              case 'answer':
                this._updateSignalingState('stable');
                break;
              default:
                throw new TypeError('unsupported type "' + description.type +
                    '"');
            }
            if (stream.getTracks().length) {
              self.remoteStreams.push(stream);
              window.setTimeout(function() {
                var event = new Event('addstream');
                event.stream = stream;
                self.dispatchEvent(event);
                if (self.onaddstream !== null) {
                  window.setTimeout(function() {
                    self.onaddstream(event);
                  }, 0);
                }
  
                receiverList.forEach(function(item) {
                  var track = item[0];
                  var receiver = item[1];
                  var trackEvent = new Event('track');
                  trackEvent.track = track;
                  trackEvent.receiver = receiver;
                  trackEvent.streams = [stream];
                  self.dispatchEvent(event);
                  if (self.ontrack !== null) {
                    window.setTimeout(function() {
                      self.ontrack(trackEvent);
                    }, 0);
                  }
                });
              }, 0);
            }
            if (arguments.length > 1 && typeof arguments[1] === 'function') {
              window.setTimeout(arguments[1], 0);
            }
            return Promise.resolve();
          };
  
      window.RTCPeerConnection.prototype.close = function() {
        this.transceivers.forEach(function(transceiver) {
          /* not yet
          if (transceiver.iceGatherer) {
            transceiver.iceGatherer.close();
          }
          */
          if (transceiver.iceTransport) {
            transceiver.iceTransport.stop();
          }
          if (transceiver.dtlsTransport) {
            transceiver.dtlsTransport.stop();
          }
          if (transceiver.rtpSender) {
            transceiver.rtpSender.stop();
          }
          if (transceiver.rtpReceiver) {
            transceiver.rtpReceiver.stop();
          }
        });
        // FIXME: clean up tracks, local streams, remote streams, etc
        this._updateSignalingState('closed');
      };
  
      // Update the signaling state.
      window.RTCPeerConnection.prototype._updateSignalingState =
          function(newState) {
            this.signalingState = newState;
            var event = new Event('signalingstatechange');
            this.dispatchEvent(event);
            if (this.onsignalingstatechange !== null) {
              this.onsignalingstatechange(event);
            }
          };
  
      // Determine whether to fire the negotiationneeded event.
      window.RTCPeerConnection.prototype._maybeFireNegotiationNeeded =
          function() {
            // Fire away (for now).
            var event = new Event('negotiationneeded');
            this.dispatchEvent(event);
            if (this.onnegotiationneeded !== null) {
              this.onnegotiationneeded(event);
            }
          };
  
      // Update the connection state.
      window.RTCPeerConnection.prototype._updateConnectionState = function() {
        var self = this;
        var newState;
        var states = {
          'new': 0,
          closed: 0,
          connecting: 0,
          checking: 0,
          connected: 0,
          completed: 0,
          failed: 0
        };
        this.transceivers.forEach(function(transceiver) {
          states[transceiver.iceTransport.state]++;
          states[transceiver.dtlsTransport.state]++;
        });
        // ICETransport.completed and connected are the same for this purpose.
        states.connected += states.completed;
  
        newState = 'new';
        if (states.failed > 0) {
          newState = 'failed';
        } else if (states.connecting > 0 || states.checking > 0) {
          newState = 'connecting';
        } else if (states.disconnected > 0) {
          newState = 'disconnected';
        } else if (states.new > 0) {
          newState = 'new';
        } else if (states.connected > 0 || states.completed > 0) {
          newState = 'connected';
        }
  
        if (newState !== self.iceConnectionState) {
          self.iceConnectionState = newState;
          var event = new Event('iceconnectionstatechange');
          this.dispatchEvent(event);
          if (this.oniceconnectionstatechange !== null) {
            this.oniceconnectionstatechange(event);
          }
        }
      };
  
      window.RTCPeerConnection.prototype.createOffer = function() {
        var self = this;
        if (this._pendingOffer) {
          throw new Error('createOffer called while there is a pending offer.');
        }
        var offerOptions;
        if (arguments.length === 1 && typeof arguments[0] !== 'function') {
          offerOptions = arguments[0];
        } else if (arguments.length === 3) {
          offerOptions = arguments[2];
        }
  
        var tracks = [];
        var numAudioTracks = 0;
        var numVideoTracks = 0;
        // Default to sendrecv.
        if (this.localStreams.length) {
          numAudioTracks = this.localStreams[0].getAudioTracks().length;
          numVideoTracks = this.localStreams[0].getVideoTracks().length;
        }
        // Determine number of audio and video tracks we need to send/recv.
        if (offerOptions) {
          // Reject Chrome legacy constraints.
          if (offerOptions.mandatory || offerOptions.optional) {
            throw new TypeError(
                'Legacy mandatory/optional constraints not supported.');
          }
          if (offerOptions.offerToReceiveAudio !== undefined) {
            numAudioTracks = offerOptions.offerToReceiveAudio;
          }
          if (offerOptions.offerToReceiveVideo !== undefined) {
            numVideoTracks = offerOptions.offerToReceiveVideo;
          }
        }
        if (this.localStreams.length) {
          // Push local streams.
          this.localStreams[0].getTracks().forEach(function(track) {
            tracks.push({
              kind: track.kind,
              track: track,
              wantReceive: track.kind === 'audio' ?
                  numAudioTracks > 0 : numVideoTracks > 0
            });
            if (track.kind === 'audio') {
              numAudioTracks--;
            } else if (track.kind === 'video') {
              numVideoTracks--;
            }
          });
        }
        // Create M-lines for recvonly streams.
        while (numAudioTracks > 0 || numVideoTracks > 0) {
          if (numAudioTracks > 0) {
            tracks.push({
              kind: 'audio',
              wantReceive: true
            });
            numAudioTracks--;
          }
          if (numVideoTracks > 0) {
            tracks.push({
              kind: 'video',
              wantReceive: true
            });
            numVideoTracks--;
          }
        }
  
        var sdp = SDPUtils.writeSessionBoilerplate();
        var transceivers = [];
        tracks.forEach(function(mline, sdpMLineIndex) {
          // For each track, create an ice gatherer, ice transport,
          // dtls transport, potentially rtpsender and rtpreceiver.
          var track = mline.track;
          var kind = mline.kind;
          var mid = SDPUtils.generateIdentifier();
  
          var transports = self.usingBundle && sdpMLineIndex > 0 ? {
            iceGatherer: transceivers[0].iceGatherer,
            iceTransport: transceivers[0].iceTransport,
            dtlsTransport: transceivers[0].dtlsTransport
          } : self._createIceAndDtlsTransports(mid, sdpMLineIndex);
  
          var localCapabilities = RTCRtpSender.getCapabilities(kind);
          var rtpSender;
          var rtpReceiver;
  
          // generate an ssrc now, to be used later in rtpSender.send
          var sendEncodingParameters = [{
            ssrc: (2 * sdpMLineIndex + 1) * 1001
          }];
          if (track) {
            rtpSender = new RTCRtpSender(track, transports.dtlsTransport);
          }
  
          if (mline.wantReceive) {
            rtpReceiver = new RTCRtpReceiver(transports.dtlsTransport, kind);
          }
  
          transceivers[sdpMLineIndex] = {
            iceGatherer: transports.iceGatherer,
            iceTransport: transports.iceTransport,
            dtlsTransport: transports.dtlsTransport,
            localCapabilities: localCapabilities,
            remoteCapabilities: null,
            rtpSender: rtpSender,
            rtpReceiver: rtpReceiver,
            kind: kind,
            mid: mid,
            sendEncodingParameters: sendEncodingParameters,
            recvEncodingParameters: null
          };
        });
        if (this.usingBundle) {
          sdp += 'a=group:BUNDLE ' + transceivers.map(function(t) {
            return t.mid;
          }).join(' ') + '\r\n';
        }
        tracks.forEach(function(mline, sdpMLineIndex) {
          var transceiver = transceivers[sdpMLineIndex];
          sdp += SDPUtils.writeMediaSection(transceiver,
              transceiver.localCapabilities, 'offer', self.localStreams[0]);
        });
  
        this._pendingOffer = transceivers;
        var desc = new RTCSessionDescription({
          type: 'offer',
          sdp: sdp
        });
        if (arguments.length && typeof arguments[0] === 'function') {
          window.setTimeout(arguments[0], 0, desc);
        }
        return Promise.resolve(desc);
      };
  
      window.RTCPeerConnection.prototype.createAnswer = function() {
        var self = this;
  
        var sdp = SDPUtils.writeSessionBoilerplate();
        if (this.usingBundle) {
          sdp += 'a=group:BUNDLE ' + this.transceivers.map(function(t) {
            return t.mid;
          }).join(' ') + '\r\n';
        }
        this.transceivers.forEach(function(transceiver) {
          if (transceiver.isDatachannel) {
            sdp += 'm=application 0 DTLS/SCTP 5000\r\n' +
                'c=IN IP4 0.0.0.0\r\n' +
                'a=mid:' + transceiver.mid + '\r\n';
            return;
          }
          // Calculate intersection of capabilities.
          var commonCapabilities = self._getCommonCapabilities(
              transceiver.localCapabilities,
              transceiver.remoteCapabilities);
  
          sdp += SDPUtils.writeMediaSection(transceiver, commonCapabilities,
              'answer', self.localStreams[0]);
        });
  
        var desc = new RTCSessionDescription({
          type: 'answer',
          sdp: sdp
        });
        if (arguments.length && typeof arguments[0] === 'function') {
          window.setTimeout(arguments[0], 0, desc);
        }
        return Promise.resolve(desc);
      };
  
      window.RTCPeerConnection.prototype.addIceCandidate = function(candidate) {
        if (candidate === null) {
          this.transceivers.forEach(function(transceiver) {
            transceiver.iceTransport.addRemoteCandidate({});
          });
        } else {
          var mLineIndex = candidate.sdpMLineIndex;
          if (candidate.sdpMid) {
            for (var i = 0; i < this.transceivers.length; i++) {
              if (this.transceivers[i].mid === candidate.sdpMid) {
                mLineIndex = i;
                break;
              }
            }
          }
          var transceiver = this.transceivers[mLineIndex];
          if (transceiver) {
            var cand = Object.keys(candidate.candidate).length > 0 ?
                SDPUtils.parseCandidate(candidate.candidate) : {};
            // Ignore Chrome's invalid candidates since Edge does not like them.
            if (cand.protocol === 'tcp' && (cand.port === 0 || cand.port === 9)) {
              return;
            }
            // Ignore RTCP candidates, we assume RTCP-MUX.
            if (cand.component !== '1') {
              return;
            }
            // A dirty hack to make samples work.
            if (cand.type === 'endOfCandidates') {
              cand = {};
            }
            transceiver.iceTransport.addRemoteCandidate(cand);
  
            // update the remoteDescription.
            var sections = SDPUtils.splitSections(this.remoteDescription.sdp);
            sections[mLineIndex + 1] += (cand.type ? candidate.candidate.trim()
                : 'a=end-of-candidates') + '\r\n';
            this.remoteDescription.sdp = sections.join('');
          }
        }
        if (arguments.length > 1 && typeof arguments[1] === 'function') {
          window.setTimeout(arguments[1], 0);
        }
        return Promise.resolve();
      };
  
      window.RTCPeerConnection.prototype.getStats = function() {
        var promises = [];
        this.transceivers.forEach(function(transceiver) {
          ['rtpSender', 'rtpReceiver', 'iceGatherer', 'iceTransport',
              'dtlsTransport'].forEach(function(method) {
                if (transceiver[method]) {
                  promises.push(transceiver[method].getStats());
                }
              });
        });
        var cb = arguments.length > 1 && typeof arguments[1] === 'function' &&
            arguments[1];
        return new Promise(function(resolve) {
          // shim getStats with maplike support
          var results = new Map();
          Promise.all(promises).then(function(res) {
            res.forEach(function(result) {
              Object.keys(result).forEach(function(id) {
                results.set(id, result[id]);
                results[id] = result[id];
              });
            });
            if (cb) {
              window.setTimeout(cb, 0, results);
            }
            resolve(results);
          });
        });
      };
    }
  };
  
  // Expose public methods.
  module.exports = {
    shimPeerConnection: edgeShim.shimPeerConnection,
    shimGetUserMedia: require('./getusermedia')
  };
  
  },{"../utils":10,"./getusermedia":6,"sdp":1}],6:[function(require,module,exports){
  /*
   *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
   *
   *  Use of this source code is governed by a BSD-style license
   *  that can be found in the LICENSE file in the root of the source
   *  tree.
   */
   /* eslint-env node */
  'use strict';
  
  // Expose public methods.
  module.exports = function() {
    var shimError_ = function(e) {
      return {
        name: {PermissionDeniedError: 'NotAllowedError'}[e.name] || e.name,
        message: e.message,
        constraint: e.constraint,
        toString: function() {
          return this.name;
        }
      };
    };
  
    // getUserMedia error shim.
    var origGetUserMedia = navigator.mediaDevices.getUserMedia.
        bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function(c) {
      return origGetUserMedia(c).catch(function(e) {
        return Promise.reject(shimError_(e));
      });
    };
  };
  
  },{}],7:[function(require,module,exports){
  /*
   *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
   *
   *  Use of this source code is governed by a BSD-style license
   *  that can be found in the LICENSE file in the root of the source
   *  tree.
   */
   /* eslint-env node */
  'use strict';
  
  var browserDetails = require('../utils').browserDetails;
  
  var firefoxShim = {
    shimOnTrack: function() {
      if (typeof window === 'object' && window.RTCPeerConnection && !('ontrack' in
          window.RTCPeerConnection.prototype)) {
        Object.defineProperty(window.RTCPeerConnection.prototype, 'ontrack', {
          get: function() {
            return this._ontrack;
          },
          set: function(f) {
            if (this._ontrack) {
              this.removeEventListener('track', this._ontrack);
              this.removeEventListener('addstream', this._ontrackpoly);
            }
            this.addEventListener('track', this._ontrack = f);
            this.addEventListener('addstream', this._ontrackpoly = function(e) {
              e.stream.getTracks().forEach(function(track) {
                var event = new Event('track');
                event.track = track;
                event.receiver = {track: track};
                event.streams = [e.stream];
                this.dispatchEvent(event);
              }.bind(this));
            }.bind(this));
          }
        });
      }
    },
  
    shimSourceObject: function() {
      // Firefox has supported mozSrcObject since FF22, unprefixed in 42.
      if (typeof window === 'object') {
        if (window.HTMLMediaElement &&
          !('srcObject' in window.HTMLMediaElement.prototype)) {
          // Shim the srcObject property, once, when HTMLMediaElement is found.
          Object.defineProperty(window.HTMLMediaElement.prototype, 'srcObject', {
            get: function() {
              return this.mozSrcObject;
            },
            set: function(stream) {
              this.mozSrcObject = stream;
            }
          });
        }
      }
    },
  
    shimPeerConnection: function() {
      if (typeof window !== 'object' || !(window.RTCPeerConnection ||
          window.mozRTCPeerConnection)) {
        return; // probably media.peerconnection.enabled=false in about:config
      }
      // The RTCPeerConnection object.
      if (!window.RTCPeerConnection) {
        window.RTCPeerConnection = function(pcConfig, pcConstraints) {
          if (browserDetails.version < 38) {
            // .urls is not supported in FF < 38.
            // create RTCIceServers with a single url.
            if (pcConfig && pcConfig.iceServers) {
              var newIceServers = [];
              for (var i = 0; i < pcConfig.iceServers.length; i++) {
                var server = pcConfig.iceServers[i];
                if (server.hasOwnProperty('urls')) {
                  for (var j = 0; j < server.urls.length; j++) {
                    var newServer = {
                      url: server.urls[j]
                    };
                    if (server.urls[j].indexOf('turn') === 0) {
                      newServer.username = server.username;
                      newServer.credential = server.credential;
                    }
                    newIceServers.push(newServer);
                  }
                } else {
                  newIceServers.push(pcConfig.iceServers[i]);
                }
              }
              pcConfig.iceServers = newIceServers;
            }
          }
          return new mozRTCPeerConnection(pcConfig, pcConstraints);
        };
        window.RTCPeerConnection.prototype = mozRTCPeerConnection.prototype;
  
        // wrap static methods. Currently just generateCertificate.
        if (mozRTCPeerConnection.generateCertificate) {
          Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
            get: function() {
              return mozRTCPeerConnection.generateCertificate;
            }
          });
        }
  
        window.RTCSessionDescription = mozRTCSessionDescription;
        window.RTCIceCandidate = mozRTCIceCandidate;
      }
  
      // shim away need for obsolete RTCIceCandidate/RTCSessionDescription.
      ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
          .forEach(function(method) {
            var nativeMethod = RTCPeerConnection.prototype[method];
            RTCPeerConnection.prototype[method] = function() {
              arguments[0] = new ((method === 'addIceCandidate') ?
                  RTCIceCandidate : RTCSessionDescription)(arguments[0]);
              return nativeMethod.apply(this, arguments);
            };
          });
  
      // support for addIceCandidate(null)
      var nativeAddIceCandidate =
          RTCPeerConnection.prototype.addIceCandidate;
      RTCPeerConnection.prototype.addIceCandidate = function() {
        return arguments[0] === null ? Promise.resolve()
            : nativeAddIceCandidate.apply(this, arguments);
      };
  
      // shim getStats with maplike support
      var makeMapStats = function(stats) {
        var map = new Map();
        Object.keys(stats).forEach(function(key) {
          map.set(key, stats[key]);
          map[key] = stats[key];
        });
        return map;
      };
  
      var nativeGetStats = RTCPeerConnection.prototype.getStats;
      RTCPeerConnection.prototype.getStats = function(selector, onSucc, onErr) {
        return nativeGetStats.apply(this, [selector || null])
          .then(function(stats) {
            return makeMapStats(stats);
          })
          .then(onSucc, onErr);
      };
    }
  };
  
  // Expose public methods.
  module.exports = {
    shimOnTrack: firefoxShim.shimOnTrack,
    shimSourceObject: firefoxShim.shimSourceObject,
    shimPeerConnection: firefoxShim.shimPeerConnection,
    shimGetUserMedia: require('./getusermedia')
  };
  
  },{"../utils":10,"./getusermedia":8}],8:[function(require,module,exports){
  /*
   *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
   *
   *  Use of this source code is governed by a BSD-style license
   *  that can be found in the LICENSE file in the root of the source
   *  tree.
   */
   /* eslint-env node */
  'use strict';
  
  var logging = require('../utils').log;
  var browserDetails = require('../utils').browserDetails;
  
  // Expose public methods.
  module.exports = function() {
    var shimError_ = function(e) {
      return {
        name: {
          SecurityError: 'NotAllowedError',
          PermissionDeniedError: 'NotAllowedError'
        }[e.name] || e.name,
        message: {
          'The operation is insecure.': 'The request is not allowed by the ' +
          'user agent or the platform in the current context.'
        }[e.message] || e.message,
        constraint: e.constraint,
        toString: function() {
          return this.name + (this.message && ': ') + this.message;
        }
      };
    };
  
    // getUserMedia constraints shim.
    var getUserMedia_ = function(constraints, onSuccess, onError) {
      var constraintsToFF37_ = function(c) {
        if (typeof c !== 'object' || c.require) {
          return c;
        }
        var require = [];
        Object.keys(c).forEach(function(key) {
          if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
            return;
          }
          var r = c[key] = (typeof c[key] === 'object') ?
              c[key] : {ideal: c[key]};
          if (r.min !== undefined ||
              r.max !== undefined || r.exact !== undefined) {
            require.push(key);
          }
          if (r.exact !== undefined) {
            if (typeof r.exact === 'number') {
              r. min = r.max = r.exact;
            } else {
              c[key] = r.exact;
            }
            delete r.exact;
          }
          if (r.ideal !== undefined) {
            c.advanced = c.advanced || [];
            var oc = {};
            if (typeof r.ideal === 'number') {
              oc[key] = {min: r.ideal, max: r.ideal};
            } else {
              oc[key] = r.ideal;
            }
            c.advanced.push(oc);
            delete r.ideal;
            if (!Object.keys(r).length) {
              delete c[key];
            }
          }
        });
        if (require.length) {
          c.require = require;
        }
        return c;
      };
      constraints = JSON.parse(JSON.stringify(constraints));
      if (browserDetails.version < 38) {
        logging('spec: ' + JSON.stringify(constraints));
        if (constraints.audio) {
          constraints.audio = constraintsToFF37_(constraints.audio);
        }
        if (constraints.video) {
          constraints.video = constraintsToFF37_(constraints.video);
        }
        logging('ff37: ' + JSON.stringify(constraints));
      }
      return navigator.mozGetUserMedia(constraints, onSuccess, function(e) {
        onError(shimError_(e));
      });
    };
  
    // Returns the result of getUserMedia as a Promise.
    var getUserMediaPromise_ = function(constraints) {
      return new Promise(function(resolve, reject) {
        getUserMedia_(constraints, resolve, reject);
      });
    };
  
    // Shim for mediaDevices on older versions.
    if (!navigator.mediaDevices) {
      navigator.mediaDevices = {getUserMedia: getUserMediaPromise_,
        addEventListener: function() { },
        removeEventListener: function() { }
      };
    }
    navigator.mediaDevices.enumerateDevices =
        navigator.mediaDevices.enumerateDevices || function() {
          return new Promise(function(resolve) {
            var infos = [
              {kind: 'audioinput', deviceId: 'default', label: '', groupId: ''},
              {kind: 'videoinput', deviceId: 'default', label: '', groupId: ''}
            ];
            resolve(infos);
          });
        };
  
    if (browserDetails.version < 41) {
      // Work around http://bugzil.la/1169665
      var orgEnumerateDevices =
          navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
      navigator.mediaDevices.enumerateDevices = function() {
        return orgEnumerateDevices().then(undefined, function(e) {
          if (e.name === 'NotFoundError') {
            return [];
          }
          throw e;
        });
      };
    }
    if (browserDetails.version < 49) {
      var origGetUserMedia = navigator.mediaDevices.getUserMedia.
          bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = function(c) {
        return origGetUserMedia(c).catch(function(e) {
          return Promise.reject(shimError_(e));
        });
      };
    }
    navigator.getUserMedia = function(constraints, onSuccess, onError) {
      if (browserDetails.version < 44) {
        return getUserMedia_(constraints, onSuccess, onError);
      }
      // Replace Firefox 44+'s deprecation warning with unprefixed version.
      console.warn('navigator.getUserMedia has been replaced by ' +
                   'navigator.mediaDevices.getUserMedia');
      navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
    };
  };
  
  },{"../utils":10}],9:[function(require,module,exports){
  /*
   *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
   *
   *  Use of this source code is governed by a BSD-style license
   *  that can be found in the LICENSE file in the root of the source
   *  tree.
   */
  'use strict';
  var safariShim = {
    // TODO: DrAlex, should be here, double check against LayoutTests
    // shimOnTrack: function() { },
  
    // TODO: once the back-end for the mac port is done, add.
    // TODO: check for webkitGTK+
    // shimPeerConnection: function() { },
  
    shimGetUserMedia: function() {
      navigator.getUserMedia = navigator.webkitGetUserMedia;
    }
  };
  
  // Expose public methods.
  module.exports = {
    shimGetUserMedia: safariShim.shimGetUserMedia
    // TODO
    // shimOnTrack: safariShim.shimOnTrack,
    // shimPeerConnection: safariShim.shimPeerConnection
  };
  
  },{}],10:[function(require,module,exports){
  /*
   *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
   *
   *  Use of this source code is governed by a BSD-style license
   *  that can be found in the LICENSE file in the root of the source
   *  tree.
   */
   /* eslint-env node */
  'use strict';
  
  var logDisabled_ = true;
  
  // Utility methods.
  var utils = {
    disableLog: function(bool) {
      if (typeof bool !== 'boolean') {
        return new Error('Argument type: ' + typeof bool +
            '. Please use a boolean.');
      }
      logDisabled_ = bool;
      return (bool) ? 'adapter.js logging disabled' :
          'adapter.js logging enabled';
    },
  
    log: function() {
      if (typeof window === 'object') {
        if (logDisabled_) {
          return;
        }
        if (typeof console !== 'undefined' && typeof console.log === 'function') {
          console.log.apply(console, arguments);
        }
      }
    },
  
    /**
     * Extract browser version out of the provided user agent string.
     *
     * @param {!string} uastring userAgent string.
     * @param {!string} expr Regular expression used as match criteria.
     * @param {!number} pos position in the version string to be returned.
     * @return {!number} browser version.
     */
    extractVersion: function(uastring, expr, pos) {
      var match = uastring.match(expr);
      return match && match.length >= pos && parseInt(match[pos], 10);
    },
  
    /**
     * Browser detector.
     *
     * @return {object} result containing browser and version
     *     properties.
     */
    detectBrowser: function() {
      // Returned result object.
      var result = {};
      result.browser = null;
      result.version = null;
  
      // Fail early if it's not a browser
      if (typeof window === 'undefined' || !window.navigator) {
        result.browser = 'Not a browser.';
        return result;
      }
  
      // Firefox.
      if (navigator.mozGetUserMedia) {
        result.browser = 'firefox';
        result.version = this.extractVersion(navigator.userAgent,
            /Firefox\/([0-9]+)\./, 1);
  
      // all webkit-based browsers
      } else if (navigator.webkitGetUserMedia) {
        // Chrome, Chromium, Webview, Opera, all use the chrome shim for now
        if (window.webkitRTCPeerConnection) {
          result.browser = 'chrome';
          result.version = this.extractVersion(navigator.userAgent,
            /Chrom(e|ium)\/([0-9]+)\./, 2);
  
        // Safari or unknown webkit-based
        // for the time being Safari has support for MediaStreams but not webRTC
        } else {
          // Safari UA substrings of interest for reference:
          // - webkit version:           AppleWebKit/602.1.25 (also used in Op,Cr)
          // - safari UI version:        Version/9.0.3 (unique to Safari)
          // - safari UI webkit version: Safari/601.4.4 (also used in Op,Cr)
          //
          // if the webkit version and safari UI webkit versions are equals,
          // ... this is a stable version.
          //
          // only the internal webkit version is important today to know if
          // media streams are supported
          //
          if (navigator.userAgent.match(/Version\/(\d+).(\d+)/)) {
            result.browser = 'safari';
            result.version = this.extractVersion(navigator.userAgent,
              /AppleWebKit\/([0-9]+)\./, 1);
  
          // unknown webkit-based browser
          } else {
            result.browser = 'Unsupported webkit-based browser ' +
                'with GUM support but no WebRTC support.';
            return result;
          }
        }
  
      // Edge.
      } else if (navigator.mediaDevices &&
          navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) {
        result.browser = 'edge';
        result.version = this.extractVersion(navigator.userAgent,
            /Edge\/(\d+).(\d+)$/, 2);
  
      // Default fallthrough: not supported.
      } else {
        result.browser = 'Not a supported browser.';
        return result;
      }
  
      return result;
    }
  };
  
  // Export.
  module.exports = {
    log: utils.log,
    disableLog: utils.disableLog,
    browserDetails: utils.detectBrowser(),
    extractVersion: utils.extractVersion
  };
  
  },{}]},{},[2])(2)
});
/* jshint ignore:end */

  // END OF INJECTION OF GOOGLE'S ADAPTER.JS CONTENT
  ///////////////////////////////////////////////////////////////////

  AdapterJS.parseWebrtcDetectedBrowser();

  ///////////////////////////////////////////////////////////////////
  // EXTENSION FOR CHROME, FIREFOX AND EDGE
  // Includes legacy functions
  // -- createIceServer
  // -- createIceServers
  // -- MediaStreamTrack.getSources
  //
  // and additional shims
  // -- attachMediaStream
  // -- reattachMediaStream
  // -- requestUserMedia
  // -- a call to AdapterJS.maybeThroughWebRTCReady (notifies WebRTC is ready)

  // Add support for legacy functions createIceServer and createIceServers
  if ( navigator.mozGetUserMedia ) {
    // Shim for MediaStreamTrack.getSources.
    MediaStreamTrack.getSources = function(successCb) {
      setTimeout(function() {
        var infos = [
          { kind: 'audio', id: 'default', label:'', facing:'' },
          { kind: 'video', id: 'default', label:'', facing:'' }
        ];
        successCb(infos);
      }, 0);
    };

    // Attach a media stream to an element.
    attachMediaStream = function(element, stream) {
      element.srcObject = stream;
      return element;
    };

    reattachMediaStream = function(to, from) {
      to.srcObject = from.srcObject;
      return to;
    };

    createIceServer = function (url, username, password) {
      console.warn('createIceServer is deprecated. It should be replaced with an application level implementation.');
      // Note: Google's import of AJS will auto-reverse to 'url': '...' for FF < 38

      var iceServer = null;
      var urlParts = url.split(':');
      if (urlParts[0].indexOf('stun') === 0) {
        iceServer = { urls : [url] };
      } else if (urlParts[0].indexOf('turn') === 0) {
        if (webrtcDetectedVersion < 27) {
          var turnUrlParts = url.split('?');
          if (turnUrlParts.length === 1 ||
            turnUrlParts[1].indexOf('transport=udp') === 0) {
            iceServer = {
              urls : [turnUrlParts[0]],
              credential : password,
              username : username
            };
          }
        } else {
          iceServer = {
            urls : [url],
            credential : password,
            username : username
          };
        }
      }
      return iceServer;
    };

    createIceServers = function (urls, username, password) {
      console.warn('createIceServers is deprecated. It should be replaced with an application level implementation.');

      var iceServers = [];
      for (i = 0; i < urls.length; i++) {
        var iceServer = createIceServer(urls[i], username, password);
        if (iceServer !== null) {
          iceServers.push(iceServer);
        }
      }
      return iceServers;
    };
  } else if ( navigator.webkitGetUserMedia ) {
    // Attach a media stream to an element.
    attachMediaStream = function(element, stream) {
      if (webrtcDetectedVersion >= 43) {
        element.srcObject = stream;
      } else if (typeof element.src !== 'undefined') {
        element.src = URL.createObjectURL(stream);
      } else {
        console.error('Error attaching stream to element.');
        // logging('Error attaching stream to element.');
      }
      return element;
    };

    reattachMediaStream = function(to, from) {
      if (webrtcDetectedVersion >= 43) {
        to.srcObject = from.srcObject;
      } else {
        to.src = from.src;
      }
      return to;
    };

    createIceServer = function (url, username, password) {
      console.warn('createIceServer is deprecated. It should be replaced with an application level implementation.');

      var iceServer = null;
      var urlParts = url.split(':');
      if (urlParts[0].indexOf('stun') === 0) {
        iceServer = { 'url' : url };
      } else if (urlParts[0].indexOf('turn') === 0) {
        iceServer = {
          'url' : url,
          'credential' : password,
          'username' : username
        };
      }
      return iceServer;
    };

    createIceServers = function (urls, username, password) {
      console.warn('createIceServers is deprecated. It should be replaced with an application level implementation.');

      var iceServers = [];
      if (webrtcDetectedVersion >= 34) {
        iceServers = {
          'urls' : urls,
          'credential' : password,
          'username' : username
        };
      } else {
        for (i = 0; i < urls.length; i++) {
          var iceServer = createIceServer(urls[i], username, password);
          if (iceServer !== null) {
            iceServers.push(iceServer);
          }
        }
      }
      return iceServers;
    };
  } else if (navigator.mediaDevices && navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) {
    // Attach a media stream to an element.
    attachMediaStream = function(element, stream) {
      element.srcObject = stream;
      return element;
    };

    reattachMediaStream = function(to, from) {
      to.srcObject = from.srcObject;
      return to;
    };
  }

  // Need to override attachMediaStream and reattachMediaStream
  // to support the plugin's logic
  attachMediaStream_base = attachMediaStream;

  if (webrtcDetectedBrowser === 'opera') {
    attachMediaStream_base = function (element, stream) {
      if (webrtcDetectedVersion > 38) {
        element.srcObject = stream;
      } else if (typeof element.src !== 'undefined') {
        element.src = URL.createObjectURL(stream);
      }
      // Else it doesn't work
    };
  }

  attachMediaStream = function (element, stream) {
    if ((webrtcDetectedBrowser === 'chrome' ||
         webrtcDetectedBrowser === 'opera') &&
        !stream) {
      // Chrome does not support "src = null"
      element.src = '';
    } else {
      attachMediaStream_base(element, stream);
    }
    return element;
  };
  reattachMediaStream_base = reattachMediaStream;
  reattachMediaStream = function (to, from) {
    reattachMediaStream_base(to, from);
    return to;
  };

  // Propagate attachMediaStream and gUM in window and AdapterJS
  window.attachMediaStream      = attachMediaStream;
  window.reattachMediaStream    = reattachMediaStream;
  window.getUserMedia           = function(constraints, onSuccess, onFailure) {
    navigator.getUserMedia(constraints, onSuccess, onFailure);
  };
  AdapterJS.attachMediaStream   = attachMediaStream;
  AdapterJS.reattachMediaStream = reattachMediaStream;
  AdapterJS.getUserMedia        = getUserMedia;

  // Removed Google defined promises when promise is not defined
  if (typeof Promise === 'undefined') {
    requestUserMedia = null;
  }

  AdapterJS.maybeThroughWebRTCReady();

  // END OF EXTENSION OF CHROME, FIREFOX AND EDGE
  ///////////////////////////////////////////////////////////////////

} else { // TRY TO USE PLUGIN

  ///////////////////////////////////////////////////////////////////
  // WEBRTC PLUGIN SHIM
  // Will automatically check if the plugin is available and inject it
  // into the DOM if it is.
  // When the plugin is not available, will prompt a banner to suggest installing it
  // Use AdapterJS.options.hidePluginInstallPrompt to prevent this banner from popping
  //
  // Shims the follwing:
  // -- getUserMedia
  // -- MediaStreamTrack
  // -- MediaStreamTrack.getSources
  // -- RTCPeerConnection
  // -- RTCSessionDescription
  // -- RTCIceCandidate
  // -- createIceServer
  // -- createIceServers
  // -- attachMediaStream
  // -- reattachMediaStream
  // -- webrtcDetectedBrowser
  // -- webrtcDetectedVersion

  // IE 9 is not offering an implementation of console.log until you open a console
  if (typeof console !== 'object' || typeof console.log !== 'function') {
    /* jshint -W020 */
    console = {} || console;
    // Implemented based on console specs from MDN
    // You may override these functions
    console.log = function (arg) {};
    console.info = function (arg) {};
    console.error = function (arg) {};
    console.dir = function (arg) {};
    console.exception = function (arg) {};
    console.trace = function (arg) {};
    console.warn = function (arg) {};
    console.count = function (arg) {};
    console.debug = function (arg) {};
    console.count = function (arg) {};
    console.time = function (arg) {};
    console.timeEnd = function (arg) {};
    console.group = function (arg) {};
    console.groupCollapsed = function (arg) {};
    console.groupEnd = function (arg) {};
    /* jshint +W020 */
  }
  AdapterJS.parseWebrtcDetectedBrowser();
  isIE = webrtcDetectedBrowser === 'IE';

  /* jshint -W035 */
  AdapterJS.WebRTCPlugin.WaitForPluginReady = function() {
    while (AdapterJS.WebRTCPlugin.pluginState !== AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY) {
      /* empty because it needs to prevent the function from running. */
    }
  };
  /* jshint +W035 */

  AdapterJS.WebRTCPlugin.callWhenPluginReady = function (callback) {
    if (AdapterJS.WebRTCPlugin.pluginState === AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY) {
      // Call immediately if possible
      // Once the plugin is set, the code will always take this path
      callback();
    } else {
      // otherwise start a 100ms interval
      var checkPluginReadyState = setInterval(function () {
        if (AdapterJS.WebRTCPlugin.pluginState === AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY) {
          clearInterval(checkPluginReadyState);
          callback();
        }
      }, 100);
    }
  };

  AdapterJS.WebRTCPlugin.setLogLevel = function(logLevel) {
    AdapterJS.WebRTCPlugin.callWhenPluginReady(function() {
      AdapterJS.WebRTCPlugin.plugin.setLogLevel(logLevel);
    });
  };

  AdapterJS.WebRTCPlugin.injectPlugin = function () {
    // only inject once the page is ready
    if (document.readyState !== 'complete') {
      return;
    }

    // Prevent multiple injections
    if (AdapterJS.WebRTCPlugin.pluginState !== AdapterJS.WebRTCPlugin.PLUGIN_STATES.INITIALIZING) {
      return;
    }

    AdapterJS.WebRTCPlugin.pluginState = AdapterJS.WebRTCPlugin.PLUGIN_STATES.INJECTING;

    if (webrtcDetectedBrowser === 'IE' && webrtcDetectedVersion <= 10) {
      var frag = document.createDocumentFragment();
      AdapterJS.WebRTCPlugin.plugin = document.createElement('div');
      AdapterJS.WebRTCPlugin.plugin.innerHTML = '<object id="' +
        AdapterJS.WebRTCPlugin.pluginInfo.pluginId + '" type="' +
        AdapterJS.WebRTCPlugin.pluginInfo.type + '" ' + 'width="1" height="1">' +
        '<param name="pluginId" value="' +
        AdapterJS.WebRTCPlugin.pluginInfo.pluginId + '" /> ' +
        '<param name="windowless" value="false" /> ' +
        '<param name="pageId" value="' + AdapterJS.WebRTCPlugin.pageId + '" /> ' +
        '<param name="onload" value="' + AdapterJS.WebRTCPlugin.pluginInfo.onload + '" />' +
        '<param name="tag" value="' + AdapterJS.WebRTCPlugin.TAGS.NONE + '" />' +
        // uncomment to be able to use virtual cams
        (AdapterJS.options.getAllCams ? '<param name="forceGetAllCams" value="True" />':'') +

        '</object>';
      while (AdapterJS.WebRTCPlugin.plugin.firstChild) {
        frag.appendChild(AdapterJS.WebRTCPlugin.plugin.firstChild);
      }
      document.body.appendChild(frag);

      // Need to re-fetch the plugin
      AdapterJS.WebRTCPlugin.plugin =
        document.getElementById(AdapterJS.WebRTCPlugin.pluginInfo.pluginId);
    } else {
      // Load Plugin
      AdapterJS.WebRTCPlugin.plugin = document.createElement('object');
      AdapterJS.WebRTCPlugin.plugin.id =
        AdapterJS.WebRTCPlugin.pluginInfo.pluginId;
      // IE will only start the plugin if it's ACTUALLY visible
      if (isIE) {
        AdapterJS.WebRTCPlugin.plugin.width = '1px';
        AdapterJS.WebRTCPlugin.plugin.height = '1px';
      } else { // The size of the plugin on Safari should be 0x0px
              // so that the autorisation prompt is at the top
        AdapterJS.WebRTCPlugin.plugin.width = '0px';
        AdapterJS.WebRTCPlugin.plugin.height = '0px';
      }
      AdapterJS.WebRTCPlugin.plugin.type = AdapterJS.WebRTCPlugin.pluginInfo.type;
      AdapterJS.WebRTCPlugin.plugin.innerHTML = '<param name="onload" value="' +
        AdapterJS.WebRTCPlugin.pluginInfo.onload + '">' +
        '<param name="pluginId" value="' +
        AdapterJS.WebRTCPlugin.pluginInfo.pluginId + '">' +
        '<param name="windowless" value="false" /> ' +
        (AdapterJS.options.getAllCams ? '<param name="forceGetAllCams" value="True" />':'') +
        '<param name="pageId" value="' + AdapterJS.WebRTCPlugin.pageId + '">' +
        '<param name="tag" value="' + AdapterJS.WebRTCPlugin.TAGS.NONE + '" />';
      document.body.appendChild(AdapterJS.WebRTCPlugin.plugin);
    }


    AdapterJS.WebRTCPlugin.pluginState = AdapterJS.WebRTCPlugin.PLUGIN_STATES.INJECTED;
  };

  AdapterJS.WebRTCPlugin.isPluginInstalled =
    function (comName, plugName, plugType, installedCb, notInstalledCb) {
    if (!isIE) {
      var pluginArray = navigator.mimeTypes;
      for (var i = 0; i < pluginArray.length; i++) {
        if (pluginArray[i].type.indexOf(plugType) >= 0) {
          installedCb();
          return;
        }
      }
      notInstalledCb();
    } else {
      try {
        var axo = new ActiveXObject(comName + '.' + plugName);
      } catch (e) {
        notInstalledCb();
        return;
      }
      installedCb();
    }
  };

  AdapterJS.WebRTCPlugin.defineWebRTCInterface = function () {
    if (AdapterJS.WebRTCPlugin.pluginState ===
        AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY) {
      console.error('AdapterJS - WebRTC interface has already been defined');
      return;
    }

    AdapterJS.WebRTCPlugin.pluginState = AdapterJS.WebRTCPlugin.PLUGIN_STATES.INITIALIZING;

    AdapterJS.isDefined = function (variable) {
      return variable !== null && variable !== undefined;
    };

    createIceServer = function (url, username, password) {
      var iceServer = null;
      var urlParts = url.split(':');
      if (urlParts[0].indexOf('stun') === 0) {
        iceServer = {
          'url' : url,
          'hasCredentials' : false
        };
      } else if (urlParts[0].indexOf('turn') === 0) {
        iceServer = {
          'url' : url,
          'hasCredentials' : true,
          'credential' : password,
          'username' : username
        };
      }
      return iceServer;
    };

    createIceServers = function (urls, username, password) {
      var iceServers = [];
      for (var i = 0; i < urls.length; ++i) {
        iceServers.push(createIceServer(urls[i], username, password));
      }
      return iceServers;
    };

    RTCSessionDescription = function (info) {
      AdapterJS.WebRTCPlugin.WaitForPluginReady();
      return AdapterJS.WebRTCPlugin.plugin.
        ConstructSessionDescription(info.type, info.sdp);
    };

    RTCPeerConnection = function (servers, constraints) {
      // Validate server argumenr
      if (!(servers === undefined ||
            servers === null ||
            Array.isArray(servers.iceServers))) {
        throw new Error('Failed to construct \'RTCPeerConnection\': Malformed RTCConfiguration');
      }

      // Validate constraints argument
      if (typeof constraints !== 'undefined' && constraints !== null) {
        var invalidConstraits = false;
        invalidConstraits |= typeof constraints !== 'object';
        invalidConstraits |= constraints.hasOwnProperty('mandatory') &&
                              constraints.mandatory !== undefined &&
                              constraints.mandatory !== null &&
                              constraints.mandatory.constructor !== Object;
        invalidConstraits |= constraints.hasOwnProperty('optional') &&
                              constraints.optional !== undefined &&
                              constraints.optional !== null &&
                              !Array.isArray(constraints.optional);
        if (invalidConstraits) {
          throw new Error('Failed to construct \'RTCPeerConnection\': Malformed constraints object');
        }
      }

      // Call relevant PeerConnection constructor according to plugin version
      AdapterJS.WebRTCPlugin.WaitForPluginReady();

      // RTCPeerConnection prototype from the old spec
      var iceServers = null;
      if (servers && Array.isArray(servers.iceServers)) {
        iceServers = servers.iceServers;
        for (var i = 0; i < iceServers.length; i++) {
          // Legacy plugin versions compatibility
          if (iceServers[i].urls && !iceServers[i].url) {
            iceServers[i].url = iceServers[i].urls;
          }
          iceServers[i].hasCredentials = AdapterJS.
            isDefined(iceServers[i].username) &&
            AdapterJS.isDefined(iceServers[i].credential);
        }
      }

      if (AdapterJS.WebRTCPlugin.plugin.PEER_CONNECTION_VERSION &&
          AdapterJS.WebRTCPlugin.plugin.PEER_CONNECTION_VERSION > 1) {
        // RTCPeerConnection prototype from the new spec
        if (iceServers) {
          servers.iceServers = iceServers;
        }
        return AdapterJS.WebRTCPlugin.plugin.PeerConnection(servers);
      } else {
        var mandatory = (constraints && constraints.mandatory) ?
          constraints.mandatory : null;
        var optional = (constraints && constraints.optional) ?
          constraints.optional : null;
        return AdapterJS.WebRTCPlugin.plugin.
          PeerConnection(AdapterJS.WebRTCPlugin.pageId,
          iceServers, mandatory, optional);
      }
    };

    MediaStreamTrack = function(){};
    MediaStreamTrack.getSources = function (callback) {
      AdapterJS.WebRTCPlugin.callWhenPluginReady(function() {
        AdapterJS.WebRTCPlugin.plugin.GetSources(callback);
      });
    };

    // getUserMedia constraints shim.
    // Copied from Chrome
    var constraintsToPlugin = function(c) {
      if (typeof c !== 'object' || c.mandatory || c.optional) {
        return c;
      }
      var cc = {};
      Object.keys(c).forEach(function(key) {
        if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
          return;
        }
        var r = (typeof c[key] === 'object') ? c[key] : {ideal: c[key]};
        if (r.exact !== undefined && typeof r.exact === 'number') {
          r.min = r.max = r.exact;
        }
        var oldname = function(prefix, name) {
          if (prefix) {
            return prefix + name.charAt(0).toUpperCase() + name.slice(1);
          }
          return (name === 'deviceId') ? 'sourceId' : name;
        };
        if (r.ideal !== undefined) {
          cc.optional = cc.optional || [];
          var oc = {};
          if (typeof r.ideal === 'number') {
            oc[oldname('min', key)] = r.ideal;
            cc.optional.push(oc);
            oc = {};
            oc[oldname('max', key)] = r.ideal;
            cc.optional.push(oc);
          } else {
            oc[oldname('', key)] = r.ideal;
            cc.optional.push(oc);
          }
        }
        if (r.exact !== undefined && typeof r.exact !== 'number') {
          cc.mandatory = cc.mandatory || {};
          cc.mandatory[oldname('', key)] = r.exact;
        } else {
          ['min', 'max'].forEach(function(mix) {
            if (r[mix] !== undefined) {
              cc.mandatory = cc.mandatory || {};
              cc.mandatory[oldname(mix, key)] = r[mix];
            }
          });
        }
      });
      if (c.advanced) {
        cc.optional = (cc.optional || []).concat(c.advanced);
      }
      return cc;
    };

    getUserMedia = function (constraints, successCallback, failureCallback) {
      var cc = {};
      cc.audio = constraints.audio ?
        constraintsToPlugin(constraints.audio) : false;
      cc.video = constraints.video ?
        constraintsToPlugin(constraints.video) : false;

      AdapterJS.WebRTCPlugin.callWhenPluginReady(function() {
        AdapterJS.WebRTCPlugin.plugin.
          getUserMedia(cc, successCallback, failureCallback);
      });
    };
    window.navigator.getUserMedia = getUserMedia;

    // Defined mediaDevices when promises are available
    if ( !navigator.mediaDevices &&
      typeof Promise !== 'undefined') {
      requestUserMedia = function(constraints) {
        return new Promise(function(resolve, reject) {
          getUserMedia(constraints, resolve, reject);
        });
      };
      navigator.mediaDevices = {getUserMedia: requestUserMedia,
                                enumerateDevices: function() {
        return new Promise(function(resolve) {
          var kinds = {audio: 'audioinput', video: 'videoinput'};
          return MediaStreamTrack.getSources(function(devices) {
            resolve(devices.map(function(device) {
              return {label: device.label,
                      kind: kinds[device.kind],
                      id: device.id,
                      deviceId: device.id,
                      groupId: ''};
            }));
          });
        });
      }};
    }

    attachMediaStream = function (element, stream) {
      if (!element || !element.parentNode) {
        return;
      }

      var streamId;
      if (stream === null) {
        streamId = '';
      } else {
        if (typeof stream.enableSoundTracks !== 'undefined') {
          stream.enableSoundTracks(true);
        }
        streamId = stream.id;
      }

      var elementId = element.id.length === 0 ? Math.random().toString(36).slice(2) : element.id;
      var nodeName = element.nodeName.toLowerCase();
      if (nodeName !== 'object') { // not a plugin <object> tag yet
        var tag;
        switch(nodeName) {
          case 'audio':
            tag = AdapterJS.WebRTCPlugin.TAGS.AUDIO;
            break;
          case 'video':
            tag = AdapterJS.WebRTCPlugin.TAGS.VIDEO;
            break;
          default:
            tag = AdapterJS.WebRTCPlugin.TAGS.NONE;
          }

        var frag = document.createDocumentFragment();
        var temp = document.createElement('div');
        var classHTML = '';
        if (element.className) {
          classHTML = 'class="' + element.className + '" ';
        } else if (element.attributes && element.attributes['class']) {
          classHTML = 'class="' + element.attributes['class'].value + '" ';
        }

        temp.innerHTML = '<object id="' + elementId + '" ' + classHTML +
          'type="' + AdapterJS.WebRTCPlugin.pluginInfo.type + '">' +
          '<param name="pluginId" value="' + elementId + '" /> ' +
          '<param name="pageId" value="' + AdapterJS.WebRTCPlugin.pageId + '" /> ' +
          '<param name="windowless" value="true" /> ' +
          '<param name="streamId" value="' + streamId + '" /> ' +
          '<param name="tag" value="' + tag + '" /> ' +
          '</object>';
        while (temp.firstChild) {
          frag.appendChild(temp.firstChild);
        }

        var height = '';
        var width = '';
        if (element.clientWidth || element.clientHeight) {
          width = element.clientWidth;
          height = element.clientHeight;
        }
        else if (element.width || element.height) {
          width = element.width;
          height = element.height;
        }

        element.parentNode.insertBefore(frag, element);
        frag = document.getElementById(elementId);
        frag.width = width;
        frag.height = height;
        element.parentNode.removeChild(element);
      } else { // already an <object> tag, just change the stream id
        var children = element.children;
        for (var i = 0; i !== children.length; ++i) {
          if (children[i].name === 'streamId') {
            children[i].value = streamId;
            break;
          }
        }
        element.setStreamId(streamId);
      }
      var newElement = document.getElementById(elementId);
      AdapterJS.forwardEventHandlers(newElement, element, Object.getPrototypeOf(element));

      return newElement;
    };

    reattachMediaStream = function (to, from) {
      var stream = null;
      var children = from.children;
      for (var i = 0; i !== children.length; ++i) {
        if (children[i].name === 'streamId') {
          AdapterJS.WebRTCPlugin.WaitForPluginReady();
          stream = AdapterJS.WebRTCPlugin.plugin
            .getStreamWithId(AdapterJS.WebRTCPlugin.pageId, children[i].value);
          break;
        }
      }
      if (stream !== null) {
        return attachMediaStream(to, stream);
      } else {
        console.log('Could not find the stream associated with this element');
      }
    };

    // Propagate attachMediaStream and gUM in window and AdapterJS
    window.attachMediaStream      = attachMediaStream;
    window.reattachMediaStream    = reattachMediaStream;
    window.getUserMedia           = getUserMedia;
    AdapterJS.attachMediaStream   = attachMediaStream;
    AdapterJS.reattachMediaStream = reattachMediaStream;
    AdapterJS.getUserMedia        = getUserMedia;

    AdapterJS.forwardEventHandlers = function (destElem, srcElem, prototype) {
      properties = Object.getOwnPropertyNames( prototype );
      for(var prop in properties) {
        if (prop) {
          propName = properties[prop];

          if (typeof propName.slice === 'function' &&
              propName.slice(0,2) === 'on' &&
              typeof srcElem[propName] === 'function') {
              AdapterJS.addEvent(destElem, propName.slice(2), srcElem[propName]);
          }
        }
      }
      var subPrototype = Object.getPrototypeOf(prototype);
      if(!!subPrototype) {
        AdapterJS.forwardEventHandlers(destElem, srcElem, subPrototype);
      }
    };

    RTCIceCandidate = function (candidate) {
      if (!candidate.sdpMid) {
        candidate.sdpMid = '';
      }

      AdapterJS.WebRTCPlugin.WaitForPluginReady();
      return AdapterJS.WebRTCPlugin.plugin.ConstructIceCandidate(
        candidate.sdpMid, candidate.sdpMLineIndex, candidate.candidate
      );
    };

    // inject plugin
    AdapterJS.addEvent(document, 'readystatechange', AdapterJS.WebRTCPlugin.injectPlugin);
    AdapterJS.WebRTCPlugin.injectPlugin();
  };

  // This function will be called if the plugin is needed (browser different
  // from Chrome or Firefox), but the plugin is not installed.
  AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCb = AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCb ||
    function() {
      AdapterJS.addEvent(document,
                        'readystatechange',
                         AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCbPriv);
      AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCbPriv();
    };

  AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCbPriv = function () {
    if (AdapterJS.options.hidePluginInstallPrompt) {
      return;
    }

    var downloadLink = AdapterJS.WebRTCPlugin.pluginInfo.downloadLink;
    if(downloadLink) { // if download link
      var popupString;
      if (AdapterJS.WebRTCPlugin.pluginInfo.portalLink) { // is portal link
       popupString = 'This website requires you to install the ' +
        ' <a href="' + AdapterJS.WebRTCPlugin.pluginInfo.portalLink +
        '" target="_blank">' + AdapterJS.WebRTCPlugin.pluginInfo.companyName +
        ' WebRTC Plugin</a>' +
        ' to work on this browser.';
      } else { // no portal link, just print a generic explanation
       popupString = AdapterJS.TEXT.PLUGIN.REQUIRE_INSTALLATION;
      }

      AdapterJS.renderNotificationBar(popupString, AdapterJS.TEXT.PLUGIN.BUTTON, downloadLink);
    } else { // no download link, just print a generic explanation
      AdapterJS.renderNotificationBar(AdapterJS.TEXT.PLUGIN.NOT_SUPPORTED);
    }
  };


  // Try to detect the plugin and act accordingly
  AdapterJS.WebRTCPlugin.isPluginInstalled(
    AdapterJS.WebRTCPlugin.pluginInfo.prefix,
    AdapterJS.WebRTCPlugin.pluginInfo.plugName,
    AdapterJS.WebRTCPlugin.pluginInfo.type,
    AdapterJS.WebRTCPlugin.defineWebRTCInterface,
    AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCb);

  // END OF WEBRTC PLUGIN SHIM
  ///////////////////////////////////////////////////////////////////
}

(function () {

  'use strict';

  var baseGetUserMedia = null;

  AdapterJS.TEXT.EXTENSION = {
    REQUIRE_INSTALLATION_FF: 'To enable screensharing you need to install the Skylink WebRTC tools Firefox Add-on.',
    REQUIRE_INSTALLATION_CHROME: 'To enable screensharing you need to install the Skylink WebRTC tools Chrome Extension.',
    REQUIRE_REFRESH: 'Please refresh this page after the Skylink WebRTC tools extension has been installed.',
    BUTTON_FF: 'Install Now',
    BUTTON_CHROME: 'Go to Chrome Web Store'
  };

  var clone = function(obj) {
    if (null === obj || 'object' !== typeof obj) {
      return obj;
    }
    var copy = obj.constructor();
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) {
        copy[attr] = obj[attr];
      }
    }
    return copy;
  };

  if (window.navigator.mozGetUserMedia) {
    baseGetUserMedia = window.navigator.getUserMedia;

    navigator.getUserMedia = function (constraints, successCb, failureCb) {

      if (constraints && constraints.video && !!constraints.video.mediaSource) {
        // intercepting screensharing requests

        // Invalid mediaSource for firefox, only "screen" and "window" are supported
        if (constraints.video.mediaSource !== 'screen' && constraints.video.mediaSource !== 'window') {
          failureCb(new Error('GetUserMedia: Only "screen" and "window" are supported as mediaSource constraints'));
          return;
        }

        var updatedConstraints = clone(constraints);

        //constraints.video.mediaSource = constraints.video.mediaSource;
        updatedConstraints.video.mozMediaSource = updatedConstraints.video.mediaSource;

        // so generally, it requires for document.readyState to be completed before the getUserMedia could be invoked.
        // strange but this works anyway
        var checkIfReady = setInterval(function () {
          if (document.readyState === 'complete') {
            clearInterval(checkIfReady);

            baseGetUserMedia(updatedConstraints, successCb, function (error) {
              if (['PermissionDeniedError', 'SecurityError'].indexOf(error.name) > -1 && window.parent.location.protocol === 'https:') {
                AdapterJS.renderNotificationBar(AdapterJS.TEXT.EXTENSION.REQUIRE_INSTALLATION_FF,
                  AdapterJS.TEXT.EXTENSION.BUTTON_FF,
                  'https://addons.mozilla.org/en-US/firefox/addon/skylink-webrtc-tools/', true, true);
              } else {
                failureCb(error);
              }
            });
          }
        }, 1);

      } else { // regular GetUserMediaRequest
        baseGetUserMedia(constraints, successCb, failureCb);
      }
    };

    AdapterJS.getUserMedia = window.getUserMedia = navigator.getUserMedia;
    /* Comment out to prevent recursive errors
    navigator.mediaDevices.getUserMedia = function(constraints) {
      return new Promise(function(resolve, reject) {
        window.getUserMedia(constraints, resolve, reject);
      });
    };*/

  } else if (window.navigator.webkitGetUserMedia && window.webrtcDetectedBrowser !== 'safari') {
    baseGetUserMedia = window.navigator.getUserMedia;

    navigator.getUserMedia = function (constraints, successCb, failureCb) {
      if (constraints && constraints.video && !!constraints.video.mediaSource) {
        if (window.webrtcDetectedBrowser !== 'chrome') {
          // This is Opera, which does not support screensharing
          failureCb(new Error('Current browser does not support screensharing'));
          return;
        }

        // would be fine since no methods
        var updatedConstraints = clone(constraints);

        var chromeCallback = function(error, sourceId) {
          if(!error) {
            updatedConstraints.video.mandatory = updatedConstraints.video.mandatory || {};
            updatedConstraints.video.mandatory.chromeMediaSource = 'desktop';
            updatedConstraints.video.mandatory.maxWidth = window.screen.width > 1920 ? window.screen.width : 1920;
            updatedConstraints.video.mandatory.maxHeight = window.screen.height > 1080 ? window.screen.height : 1080;

            if (sourceId) {
              updatedConstraints.video.mandatory.chromeMediaSourceId = sourceId;
            }

            delete updatedConstraints.video.mediaSource;

            baseGetUserMedia(updatedConstraints, successCb, failureCb);

          } else { // GUM failed
            if (error === 'permission-denied') {
              failureCb(new Error('Permission denied for screen retrieval'));
            } else {
              // NOTE(J-O): I don't think we ever pass in here. 
              // A failure to capture the screen does not lead here.
              failureCb(new Error('Failed retrieving selected screen'));
            }
          }
        };

        var onIFrameCallback = function (event) {
          if (!event.data) {
            return;
          }

          if (event.data.chromeMediaSourceId) {
            if (event.data.chromeMediaSourceId === 'PermissionDeniedError') {
                chromeCallback('permission-denied');
            } else {
              chromeCallback(null, event.data.chromeMediaSourceId);
            }
          }

          if (event.data.chromeExtensionStatus) {
            if (event.data.chromeExtensionStatus === 'not-installed') {
              AdapterJS.renderNotificationBar(AdapterJS.TEXT.EXTENSION.REQUIRE_INSTALLATION_CHROME,
                AdapterJS.TEXT.EXTENSION.BUTTON_CHROME,
                event.data.data, true, true);
            } else {
              chromeCallback(event.data.chromeExtensionStatus, null);
            }
          }

          // this event listener is no more needed
          window.removeEventListener('message', onIFrameCallback);
        };

        window.addEventListener('message', onIFrameCallback);

        postFrameMessage({
          captureSourceId: true
        });

      } else {
        baseGetUserMedia(constraints, successCb, failureCb);
      }
    };

    AdapterJS.getUserMedia = window.getUserMedia = navigator.getUserMedia;
    navigator.mediaDevices.getUserMedia = function(constraints) {
      return new Promise(function(resolve, reject) {
        window.getUserMedia(constraints, resolve, reject);
      });
    };

  } else if (navigator.mediaDevices && navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) {
    // nothing here because edge does not support screensharing
    console.warn('Edge does not support screensharing feature in getUserMedia');

  } else {
    baseGetUserMedia = window.navigator.getUserMedia;

    navigator.getUserMedia = function (constraints, successCb, failureCb) {
      if (constraints && constraints.video && !!constraints.video.mediaSource) {
        // would be fine since no methods
        var updatedConstraints = clone(constraints);

        // wait for plugin to be ready
        AdapterJS.WebRTCPlugin.callWhenPluginReady(function() {
          // check if screensharing feature is available
          if (!!AdapterJS.WebRTCPlugin.plugin.HasScreensharingFeature &&
            !!AdapterJS.WebRTCPlugin.plugin.isScreensharingAvailable) {
            // set the constraints
            updatedConstraints.video.optional = updatedConstraints.video.optional || [];
            updatedConstraints.video.optional.push({
              sourceId: AdapterJS.WebRTCPlugin.plugin.screensharingKey || 'Screensharing'
            });

            delete updatedConstraints.video.mediaSource;
          } else {
            failureCb(new Error('Your version of the WebRTC plugin does not support screensharing'));
            return;
          }
          baseGetUserMedia(updatedConstraints, successCb, failureCb);
        });
      } else {
        baseGetUserMedia(constraints, successCb, failureCb);
      }
    };

    AdapterJS.getUserMedia = getUserMedia = 
       window.getUserMedia = navigator.getUserMedia;
    if ( navigator.mediaDevices &&
      typeof Promise !== 'undefined') {
      navigator.mediaDevices.getUserMedia = requestUserMedia;
    }
  }

  // For chrome, use an iframe to load the screensharing extension
  // in the correct domain.
  // Modify here for custom screensharing extension in chrome
  if (window.webrtcDetectedBrowser === 'chrome') {
    var iframe = document.createElement('iframe');

    iframe.onload = function() {
      iframe.isLoaded = true;
    };

    iframe.src = 'https://cdn.temasys.com.sg/skylink/extensions/detectRTC.html';
    iframe.style.display = 'none';

    (document.body || document.documentElement).appendChild(iframe);

    var postFrameMessage = function (object) { // jshint ignore:line
      object = object || {};

      if (!iframe.isLoaded) {
        setTimeout(function () {
          iframe.contentWindow.postMessage(object, '*');
        }, 100);
        return;
      }

      iframe.contentWindow.postMessage(object, '*');
    };
  } else if (window.webrtcDetectedBrowser === 'opera') {
    console.warn('Opera does not support screensharing feature in getUserMedia');
  }
})();

var DatachannelFactory = function (connection, options) {
  var channel = {
    // Datachannel connection
    connection: null,
    // Datachannel states
    states: {
      rejected: false,
      closing: false,
      isPlugin: AdapterJS && AdapterJS.WebRTCPlugin && AdapterJS.WebRTCPlugin.plugin &&
        AdapterJS.WebRTCPlugin.plugin.VERSION
    },
    // Datachannel relation info
    userId: options.userId,
    peerId: options.peerId,
    instanceId: options.instanceId,
    // Datachannel info
    label: options.label,
    prop: options.prop,
    type: options.prop === 'main' ? Skylink.prototype.DATA_CHANNEL_TYPE.MESSAGING :
      Skylink.prototype.DATA_CHANNEL_TYPE.DATA,
    custom: {},
    fr: new FileReader()
  };

  var eventManager = {
    listeners: {},
    emit: function (evt, params) {
      /* jshint ignore:start */
      if (evt === 'state') {
        params.type = channel.type;
        params.label = channel.label;
        params.bufferedAmount = channel.connection.bufferedAmount || 0;
        params.bufferedAmountLowThreshold = channel.connection.bufferedAmountLowThreshold || 0;
        // Polyfill for plugin that does not have this property
        params.binaryType =  channel.connection.binaryType || 'arraybuffer';
        params.messageErrorType = params.messageErrorType || null;
        params.error = params.error || null;
        logFn('log', 'State "' + params.state + '" ->', params);
      } else if (evt === 'data') {
        logFn('debug', 'Data ' + (params.type ? '"' + params.type + '" protocol ->' : 'chunk'),
          params.type ? params : '(Size: ' + (params.size || params.length || params.byteLength) + ')');
      }
      /* jshint ignore:end */
      UtilsFactory.forEach(eventManager.listeners[evt] || [], function (fn) {
        fn(params);
      });
    }
  };

  /**
   * - Function that logs the component internally.
   */
  var logFn = function (level, message, obj) {
    Log[level](channel.instanceId, [channel.peerId, 'Datachannel', channel.prop, message], obj);
  };

  /**
   * - Function that handles the RTCDataChannel.onopen event.
   */
  var onOpenEventFn = function () {
    var fn = function () {
      eventManager.emit('state', {
        state: Skylink.prototype.DATA_CHANNEL_STATE.OPEN
      });
    };

    if (channel.connection.readyState === Skylink.prototype.DATA_CHANNEL_STATE.OPEN) {
      // Prevent event handlers triggering before Datachannel object was defined
      setTimeout(fn, 1); // 500);
    } else {
      // Prevent event handlers triggering before Datachannel object was defined
      setTimeout(function () {
        eventManager.emit('state', {
          state: channel.connection.readyState
        });
      }, 1);
      channel.connection.onopen = function () {
        // Prevent timelapse where the other state is triggered before "open"
        setTimeout(fn, 1);
      };
    }
  };

  /**
   * - Function that handles the RTCDataChannel.onclose event.
   */
  var onCloseEventFn = function () {
    var fn = function () {
      if (!channel.states.closing) {
        channel.states.closing = true;
        eventManager.emit('state', {
          state: Skylink.prototype.DATA_CHANNEL_STATE.CLOSING
        });
      }

      setTimeout(function () {
        eventManager.emit('state', {
          state: Skylink.prototype.DATA_CHANNEL_STATE.CLOSED
        });

        if (channel.states.rejected) {
          return;
        }

        /* jshint ignore:start */
        // Set jshint to make it less ranty over called before defined (or empty block).. and if you look into
        // the call-steps, this won't be called only after the first openChannelFn is called
        // Revive only MESSAGING Datachannel connection for P2P messaging
        if (channel.type === Skylink.prototype.DATA_CHANNEL_TYPE.MESSAGING) {
          logFn('debug', 'Reviving "main" connection.');
          // This indicates the Peer is offerer, so we can revive the Datachannel connection
          // Ensure that Peer connection is correct and not closed
          // Checks happens in the function
          setTimeout(openChannelFn, 100);
        }
        /* jshint ignore:end */
      }, 1);
    };

    // Fixes for Firefox bug (49 is working) -> https://bugzilla.mozilla.org/show_bug.cgi?id=1118398
    if (window.webrtcDetectedBrowser === 'firefox') {
      var triggered = false;
      var block = 0;

      channel.connection.onclose = function () {
        if (!triggered) {
          triggered = true;
          fn();
        }
      };

      var intervalChecker = setInterval(function () {
        if (channel.connection.readyState === Skylink.prototype.DATA_CHANNEL_STATE.CLOSED || triggered || block === 5) {
          clearInterval(intervalChecker);

          if (!triggered) {
            triggered = true;
            fn();
          }
        // After 5 seconds from CLOSING state and Firefox is not rendering to close, we have to assume to close it.
        // It is dead! This fixes the case where if it's Firefox who closes the Datachannel, the connection will
        // still assume as CLOSING..
        } else if (channel.connection.readyState === Skylink.prototype.DATA_CHANNEL_STATE.CLOSING) {
          block++;
        }
      }, 1000);

    } else {
      channel.connection.onclose = fn;
    }
  };

  /**
   * - Function that handles the RTCDataChannel.onmessage event.
   */
  var onMessageEventFn = function () {
    channel.connection.onmessage = function (evt) {
      var data = evt.data || evt;

      if (data && typeof data === 'string') {
        try {
          var protocol = JSON.parse(data);
          eventManager.emit('data', protocol);
        } catch (error) {
          if (data.indexOf('{') > -1 && data.indexOf('}') === (data.length - 1)) {
            logFn('error', 'Dropping received data as due to incorrect JSON parsing ->', { data: data,
              size: data.length || data.size, error: error });
            eventManager.emit('state', {
              state: Skylink.prototype.DATA_CHANNEL_STATE.ERROR,
              error: error
            });
            return;
          }

          // Remove spaces if its binarystring file transfer data chunk for Android SDK bug case
          eventManager.emit('data', data);
        }
      // Convert data to Blob for now
      } else {
        if (data instanceof Blob) {
          eventManager.emit('data', data);
        } else {
          // Convert and re-prase for some browser for plugin case and ArrayBuffer to Blob
          var dataToBlob = new Blob([data.constructor && data.constructor.name === 'Array' ? new Int8Array(data) : data]);
          eventManager.emit('data', dataToBlob);
        }
      }
    };
  };

  /**
   * - Function that handles the RTCDataChannel.onbufferedamountlow event.
   */
  var onBufferedAmountLowEventFn = function () {
    channel.connection.onbufferedamountlow = function () {
      eventManager.emit('state', {
        state: Skylink.prototype.DATA_CHANNEL_STATE.BUFFERED_AMOUNT_LOW
      });
    };
  };

  /**
   * - Function that opens or initialises the RTCDataChannel connection.
   */
  var openChannelFn = function () {
    if (channel.states.rejected || !connection) {
      return;
    }

    if (!connection.label && connection.signalingState !== Skylink.prototype.PEER_CONNECTION_STATE.CLOSED) {
      try {
        logFn('debug', 'Opening connection.');
        channel.connection = connection.createDataChannel(channel.label, {
          reliable: true,
          ordered: true
        });
      } catch (error) {
        logFn('error', 'Failed opening connection ->', error);
        eventManager.emit('state', {
          state: Skylink.prototype.DATA_CHANNEL_STATE.CREATE_ERROR,
          error: error
        });
        return;
      }
    } else {
      logFn('debug', 'Initialising connection.');
      channel.connection = connection;
      channel.label = connection.label;
    }
    channel.states.closing = false;
    onOpenEventFn();
    onCloseEventFn();
    onMessageEventFn();
    onBufferedAmountLowEventFn();
  };

  openChannelFn();

  return {
    /**
     * + Function that subscribes to an event.
     */
    on: function (evt, fn) {
      eventManager.listeners[evt] = eventManager[evt] || [];
      eventManager.listeners[evt].push(fn);
    },

    /**
     * + Function that sends a data to Datachannel connection.
     *   Use [callback] function to indicate as success data sent.
     */
    send: function (data, sendAsRaw, fn) {
      if (!channel.connection) {
        return;
      }
      var messageErrorType = data && typeof data === 'object' && !sendAsRaw && data.type === 'MESSAGE' ?
        Skylink.prototype.DATA_CHANNEL_MESSAGE_ERROR.MESSAGE : Skylink.prototype.DATA_CHANNEL_MESSAGE_ERROR.TRANSFER;

      if (channel.connection.readyState !== Skylink.prototype.DATA_CHANNEL_STATE.OPEN) {
        logFn('warn', 'Dropping data as connection is not opened ->', { data: data,
          size: data.size || data.length || data.byteLength, error: error });
        eventManager.emit('state', {
          state: Skylink.prototype.DATA_CHANNEL_STATE.SEND_MESSAGE_ERROR,
          error: new Error('Failed sending message as Datachannel connection state is not opened. Current ' +
            'readyState is "' + channel.connection.readyState + '"'),
          messageType: messageErrorType
        });
        return;
      }

      try {
        if (sendAsRaw && data && typeof data === 'object') {
          var converted = data;
          // Blob data to be converted..
          // Plugin does not have binaryType but it uses arraybuffer by default (like chrome)
          if (data instanceof Blob && (channel.states.isPlugin || channel.connection.binaryType === 'arraybuffer')) {
            channel.fr.onload = function () {
              converted = channel.states.isPlugin ? new Int8Array(channel.fr.result) : channel.fr.result;
              channel.connection.send(converted);
              logFn('debug', 'Sending converted Blob to Arraybuffer ->' + '(Size: ' + converted.byteLength + ')');
              fn();
            };
            channel.fr.readAsArrayBuffer(data);
          // Arraybuffer data to be converted
          } else if (!(data instanceof Blob) && channel.connection.binaryType === 'blob') {
            converted = new Blob(data);
            channel.connection.send(new Blob(data));
            logFn('debug', 'Sending converted Arraybuffer to Blob ->' + '(Size: ' + converted.size + ')');
            fn();
          // No need conversion as it is supported
          } else {
            channel.connection.send(data);
            logFn('debug', 'Sending ' + (data.size ? 'Blob' : 'Arraybuffer') + ' ->' + '(Size: ' +
              (data.size || data.byteLength) + ')');
            fn();
          }
        } else {
          channel.connection.send(sendAsRaw ? data : JSON.stringify(data));
          logFn('debug', 'Sending ' + (sendAsRaw ? 'String' : '"' + data.type + '" protocol') + ' ->',
            sendAsRaw ? '(Size: ' + (data.length || data.size) + ')' : data);
          fn();
        }
      // RTCDataChannel could be closed (dead).
      } catch (error) {
        logFn('error', 'Failed sending data ->', { data: data,
          size: data.size || data.length || data.byteLength, error: error });

        eventManager.emit('state', {
          state: Skylink.prototype.DATA_CHANNEL_STATE.SEND_MESSAGE_ERROR,
          error: error,
          messageType: messageErrorType
        });
      }
    },

    /**
     * + Function that closes the Datachannel connection.
     */
    close: function () {
      if (!channel.connection) {
        return;
      }
      if (channel.connection.readyState !== Skylink.prototype.DATA_CHANNEL_STATE.CLOSED) {
        logFn('debug', 'Closing connection.');
        if (!channel.states.closing) {
          channel.states.closing = true;
          eventManager.emit('state', {
            state: Skylink.prototype.DATA_CHANNEL_STATE.CLOSING
          });
        }
        channel.connection.close();
      }
    },

    /**
     * + Function that returns the Datachannel connection session info.
     */
    getInfo: function () {
      return {
        readyState: channel.connection.readyState,
        label: channel.label,
        prop: channel.prop,
        type: channel.type,
        bufferedAmount:  channel.connection.bufferedAmount || 0,
        bufferedAmountLowThreshold: channel.connection.bufferedAmountLowThreshold || 0,
        binaryType: channel.connection.binaryType || 'arraybuffer',
        custom: channel.custom
      };
    },

    /**
     * + Function that sets the Datachannel connection custom info.
     */
    setCustom: function (prop, value) {
      channel.custom[prop] = value;
    }
  };
};

var Log = (function () {
  var logger = {
    header: 'SkylinkJS',
    instances: {},
    storedLogs: {}
  };

  var eventManager = {
    listeners: {},
    emit: function (evt, params) {
      UtilsFactory.forEach(eventManager.listeners[evt] || [], function (fn) {
        fn(params);
      });
    }
  };

  /**
   * - Function that handles the log message.
   */
  var fn = function (instanceId, prop, message, obj) {
    var output = '';
    var printOutput = '';
    var timestamp = (new Date());

    if (Array.isArray(message)) {
      output += message[0] ? ' [' + message[0] + '] -' : ' -';
      output += message[1] ? ' <<' + message[1] + '>>' : '';
      output += message[2] ? '(' + message[2] + ')' : '';
      output += ' ' + message[3];
    } else {
      output += ' - ' + message;
    }

    if (!logger.instances[instanceId]) {
      logger.instances[instanceId] = {
        level: Skylink.prototype.LOG_LEVEL.ERROR,
        trace: false,
        storeLogs: false,
        printTimeStamp: false,
        printInstanceLabel: false
      };
    }

    // Output for printing is different from the output stored in the logs array
    printOutput = (logger.printTimeStamp ? '[' + timestamp.toISOString() + '] ' : '') +
      logger.header + (logger.instances[instanceId].printInstanceLabel ? ' :: ' +
      logger.instances[instanceId].instanceLabel : '') + output;
    output = logger.header + output;

    // Store the log message
    if (logger.instances[instanceId].storeLogs) {
      storedLogs[logger.instances[instanceId].instanceLabel] =
        storedLogs[logger.instances[instanceId].instanceLabel] || [];
      storedLogs[logger.instances[instanceId].instanceLabel].push(
        [timestamp, prop, output, obj || null, logger.instances[instanceId].instanceLabel]);
    }

    // Trigger the log message
    if (logger.instances[instanceId].pushLog) {
      eventManager.emit('log', {
        timestamp: timestamp,
        level: prop,
        message: output,
        object: obj,
        instanceLabel: logger.instances[instanceId].instanceLabel
      })
    }

    if (logger.instances[instanceId].level >= Skylink.prototype.LOG_LEVEL[prop.toUpperCase()]) {
      var useProp = typeof console[prop] === 'undefined' ? 'log' : prop;
      useProp = logger.instances[instanceId].trace && typeof console.trace !== 'undefined' ? 'trace' : useProp;

      console[useProp]((useProp === 'trace' ? '[' + prop.toUpperCase() + ']' : '') +
        printOutput, typeof obj !== 'undefined' ? obj : '');
    }
  };

  return {
    /**
     * + Function that subscribes to an event.
     */
    on: function (evt, fn) {
      eventManager.listeners[evt] = eventManager[evt] || [];
      eventManager.listeners[evt].push(fn);
    },

    /**
     * + Function that configures the instance settings.
     */
    configure: function (instanceId, options) {
      logger.instances[instanceId] = options;
    },

    /**
     * + Function that prints the console.debug() level.
     */
    debug: function (instanceId, message, obj) {
      fn(instanceId, 'debug', message, obj);
    },

    /**
     * + Function that prints the console.log() level.
     */
    log: function (instanceId, message, obj) {
      fn(instanceId, 'log', message, obj);
    },

    /**
     * + Function that prints the console.info() level.
     */
    info: function (instanceId, message, obj) {
      fn(instanceId, 'info', message, obj);
    },

    /**
     * + Function that prints the console.warn() level.
     */
    warn: function (instanceId, message, obj) {
      fn(instanceId, 'warn', message, obj);
    },

    /**
     * + Function that prints the console.error() level.
     */
    error: function (instanceId, message, obj) {
      fn(instanceId, 'error', message, obj);
    },

    /**
     * + Function loops for each logs.
     */
    loopLogs: function (instanceLabel, level) {
      var output = [];
      var prop = null;

      if (typeof level === 'number') {
        UtilsFactory.forEach(Skylink.prototype.LOG_LEVEL, function (opt, cprop) {
          if (opt === level) {
            prop = cprop;
          }
        });
      }

      UtilsFactory.forEach(logger.storedLogs, function (logs, clabel) {
        if (instanceLabel && typeof instanceLabel === 'string' ? instanceLabel === clabel : true) {
          UtilsFactory.forEach(logs, function (log) {
            if (prop ? (log[1] || '').toUpperCase() === prop : true) {
              output.push(log);
            }
          });
        }
      });

      return output;
    },

    /**
     * + Function that clears log.
     */
    clearLogs: function (instanceLabel, level) {
      var prop = null;
      var fn = function (instanceLabel) {
        if (!Array.isArray(logger.storedLogs[instanceLabel])) {
          return;
        }

        for (var i = 0; i < logger.storedLogs[instanceLabel].length; i++) {
          if (prop ? (logger.storedLogs[instanceLabel][i][1] || '').toUpperCase() === prop : true) {
            logger.storedLogs[instanceLabel].splice(i, 1);
            i--;
          }
        }
      };

      if (typeof level === 'number') {
        UtilsFactory.forEach(Skylink.prototype.LOG_LEVEL, function (opt, cprop) {
          if (opt === level) {
            prop = cprop;
          }
        });
      }

      if (instanceLabel && typeof instanceLabel === 'string') {
        fn(instanceLabel);
      } else {
        UtilsFactory.forEach(logger.storedLogs, function (logs, clabel) {
          fn(clabel);
        });
      }
    }
  };
})();
var UtilsFactory = {
  /**
   * + Function that clones an object.
   */
  clone: function (obj) {
    if (!(obj && typeof obj === 'object')) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.concat([]);
    }

    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (e) {
      var fn = function (item) {
        if (Array.isArray(item)) {
          return item.concat([]);
        } else if (!(item && typeof item === 'object')) {
          return item;
        }
        var copy = {};
        UtilsFactory.forEach(item, function (opt, prop) {
          copy[prop] = fn(opt);
        });
        return copy;
      };
      return fn(obj);
    }
  },

  /**
   * + Function that loops an object.
   */
  forEach: function (obj, fn) {
    if (Array.isArray(obj)) {
      if (typeof obj.forEach === 'function') {
        obj.forEach(fn);
      } else {
        for (var i = 0; i < obj.length; i++) {
          fn(obj[i], i);
        }
      }
    } else if (obj && typeof obj === 'object') {
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          fn(obj[prop], prop);
        }
      }
    }
  }
};
function Skylink(instanceLabel) {
  /**
   * The Skylink object instance label ID.
   * @attribute INSTANCE_LABEL
   * @type String
   * @readOnly
   * @for Skylink
   * @since 0.6.18
   */
  this.INSTANCE_LABEL = typeof instanceLabel === 'string' && instanceLabel && instanceLabel !== '_' ?
    instanceLabel : 'in_' + Date.now() + Math.floor(Math.random() * 10000);

  /**
   * - Stores the logging function.
   */
  this._debugOptions = {
    level: this.LOG_LEVEL.ERROR,
    instanceId: Date.now() + '_' + Math.floor(Math.random() * 10000) + '_' + performance.now(),
    instanceLabel: this.INSTANCE_LABEL,
    trace: false,
    storeLogs: false,
    printInstanceLabel: false,
    printTimeStamp: false
  };

  /**
   * Stores the flag if Peers should have any Datachannel connections.
   * @attribute _enableDataChannel
   * @default true
   * @type Boolean
   * @private
   * @for Skylink
   * @since 0.3.0
   */
  this._enableDataChannel = true;

  /**
   * Stores the list of Peer Datachannel connections.
   * @attribute _dataChannels
   * @param {JSON} #peerId The list of Datachannels associated with Peer ID.
   * @param {RTCDataChannel} #peerId.#channelLabel The Datachannel connection.
   *   The property name <code>"main"</code> is reserved for messaging Datachannel type.
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.2.0
   */
  this._dataChannels = {};

  /**
   * Stores the list of data transfers from / to Peers.
   * @attribute _dataTransfers
   * @param {JSON} #transferId The data transfer session.
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.16
   */
  this._dataTransfers = {};

  /**
   * Stores the list of sending data streaming sessions to Peers.
   * @attribute _dataStreams
   * @param {JSON} #streamId The data stream session.
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.18
   */
  this._dataStreams = {};

  /**
   * Stores the list of buffered ICE candidates that is received before
   *   remote session description is received and set.
   * @attribute _peerCandidatesQueue
   * @param {Array} <#peerId> The list of the Peer connection buffered ICE candidates received.
   * @param {Object} <#peerId>.<#index> The Peer connection buffered ICE candidate received.
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.5.1
   */
  this._peerCandidatesQueue = {};

  /**
   * Stores the list of ICE candidates received before signaling end.
   * @attribute _peerEndOfCandidatesCounter
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.16
   */
  this._peerEndOfCandidatesCounter = {};

  /**
   * Stores the list of Peer connection ICE candidates.
   * @attribute _gatheredCandidates
   * @param {JSON} <#peerId> The list of the Peer connection ICE candidates.
   * @param {JSON} <#peerId>.sending The list of the Peer connection ICE candidates sent.
   * @param {JSON} <#peerId>.receiving The list of the Peer connection ICE candidates received.
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.14
   */
  this._gatheredCandidates = {};

  /**
   * Stores the flags for ICE candidate filtering.
   * @attribute _filterCandidatesType
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.16
   */
  this._filterCandidatesType = {
    host: false,
    srflx: false,
    relay: false
  };

  /**
   * Stores the flag that indicates if Peer connections should trickle ICE.
   * @attribute _enableIceTrickle
   * @type Boolean
   * @default true
   * @private
   * @for Skylink
   * @since 0.3.0
   */
  this._enableIceTrickle = true;

  /**
   * Stores the flag that indicates if STUN ICE servers should be used when constructing Peer connection.
   * @attribute _enableSTUN
   * @type Boolean
   * @default true
   * @private
   * @for Skylink
   * @since 0.5.4
   */
  this._enableSTUN = true;

  /**
   * Stores the flag that indicates if TURN ICE servers should be used when constructing Peer connection.
   * @attribute _enableTURN
   * @type Boolean
   * @default true
   * @private
   * @for Skylink
   * @since 0.5.4
   */
  this._enableTURN = true;

  /**
   * Stores the flag that indicates if public STUN ICE servers should be used when constructing Peer connection.
   * @attribute _usePublicSTUN
   * @type Boolean
   * @default true
   * @private
   * @for Skylink
   * @since 0.6.1
   */
  this._usePublicSTUN = true;

  /**
   * Stores the global number of Peer connection retries that would increase the wait-for-response timeout
   *   for the Peer connection health timer.
   * @attribute _retryCounters
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.5.10
   */
  this._retryCounters = {};

  /**
   * Stores the list of the Peer connections.
   * @attribute _peerConnections
   * @param {Object} <#peerId> The Peer connection.
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.1.0
   */
  this._peerConnections = {};

  /**
   * Stores the list of the Peer connections stats.
   * @attribute _peerStats
   * @param {Object} <#peerId> The Peer connection stats.
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.16
   */
  this._peerStats = {};

  /**
   * The flag if User is using plugin.
   * @attribute _isUsingPlugin
   * @type Boolean
   * @private
   * @for Skylink
   * @since 0.6.16
   */
  this._isUsingPlugin = false;

  /**
   * Stores the option for the TURN protocols to use.
   * This should configure the TURN ICE servers urls <code>?transport=protocol</code> flag.
   * @attribute _TURNTransport
   * @type String
   * @default "any"
   * @private
   * @required
   * @for Skylink
   * @since 0.5.4
   */
  this._TURNTransport = 'any';

  /**
   * Stores the list of Peers session information.
   * @attribute _peerInformations
   * @param {JSON} <#peerId> The Peer session information.
   * @param {JSON|String} <#peerId>.userData The Peer custom data.
   * @param {JSON} <#peerId>.settings The Peer streaming information.
   * @param {JSON} <#peerId>.mediaStatus The Peer streaming muted status.
   * @param {JSON} <#peerId>.agent The Peer agent information.
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.3.0
   */
  this._peerInformations = {};

  /**
   * Stores the Signaling user credentials from the API response required for connecting to the Signaling server.
   * @attribute _user
   * @param {String} uid The API result "username".
   * @param {String} token The API result "userCred".
   * @param {String} timeStamp The API result "timeStamp".
   * @param {String} sid The Signaling server receive user Peer ID.
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.5.6
   */
  this._user = null;

  /**
   * Stores the User custom data.
   * By default, if no custom user data is set, it is an empty string <code>""</code>.
   * @attribute _userData
   * @type JSON|String
   * @default ""
   * @private
   * @for Skylink
   * @since 0.5.6
   */
  this._userData = '';

  /**
   * Stores the User connection priority weight.
   * If Peer has a higher connection weight, it will do the offer from its Peer connection first.
   * @attribute _peerPriorityWeight
   * @type Number
   * @private
   * @for Skylink
   * @since 0.5.0
   */
  this._peerPriorityWeight = 0;

  /**
   * Stores the flag that indicates if "autoIntroduce" is enabled.
   * If enabled, the Peers connecting the same Room will receive each others "enter" message ping.
   * @attribute _autoIntroduce
   * @type Boolean
   * @default true
   * @private
   * @for Skylink
   * @since 0.6.1
   */
  this._autoIntroduce = true;

  /**
   * Stores the flag that indicates if "isPrivileged" is enabled.
   * If enabled, the User has Privileged features which has the ability to retrieve the list of
   *   Peers in the same App space with <code>getPeers()</code> method
   *   and introduce Peers to each other with <code>introducePeer</code> method.
   * @attribute isPrivileged
   * @type Boolean
   * @default false
   * @private
   * @for Skylink
   * @since 0.6.1
   */
  this._isPrivileged = false;

  /**
   * Stores the list of Peers retrieved from the Signaling from <code>getPeers()</code> method.
   * @attribute _peerList
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.1
   */
  this._peerList = null;

  /**
   * Stores the current Room name that User is connected to.
   * @attribute _selectedRoom
   * @type String
   * @private
   * @for Skylink
   * @since 0.3.0
   */
  this._selectedRoom = null;

  /**
   * Stores the flag that indicates if Room is locked.
   * @attribute _roomLocked
   * @type Boolean
   * @private
   * @for Skylink
   * @since 0.5.2
   */
  this._roomLocked = false;

  /**
   * Stores the flag that indicates if User is connected to the Room.
   * @attribute _inRoom
   * @type Boolean
   * @private
   * @for Skylink
   * @since 0.4.0
   */
  this._inRoom = false;

  /**
   * Stores the list of <code>on()</code> event handlers.
   * @attribute _EVENTS
   * @param {Array} <#event> The list of event handlers associated with the event.
   * @param {Function} <#event>.<#index> The event handler function.
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.5.2
   */
  this._EVENTS = {};

  /**
   * Stores the list of <code>once()</code> event handlers.
   * These events are only triggered once.
   * @attribute _onceEvents
   * @param {Array} <#event> The list of event handlers associated with the event.
   * @param {Array} <#event>.<#index> The array of event handler function and its condition function.
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.5.4
   */
  this._onceEvents = {};

  /**
   * Stores the timestamps data used for throttling.
   * @attribute _timestamp
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.5.8
   */
  this._timestamp = {
    socketMessage: null,
    shareScreen: null,
    refreshConnection: null,
    getUserMedia: null,
    lastRestart: null
  };

  /**
   * Stores the throttling interval timeout.
   * @attribute _throttlingTimeouts
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.16
   */
  this._throttlingTimeouts = {
    shareScreen: 10000,
    refreshConnection: 5000,
    getUserMedia: 0
  };

  /**
   * Stores the flag if throttling should throw when called less than the interval timeout.
   * @attribute _throttlingShouldThrowError
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.16
   */
  this._throttlingShouldThrowError = false;

  /**
   * Stores the current socket connection information.
   * @attribute _socketSession
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.13
   */
  this._socketSession = {};

  /**
   * Stores the queued socket messages.
   * This is to prevent too many sent over less than a second interval that might cause dropped messages
   *   or jams to the Signaling connection.
   * @attribute _socketMessageQueue
   * @type Array
   * @private
   * @for Skylink
   * @since 0.5.8
   */
  this._socketMessageQueue = [];

  /**
   * Stores the <code>setTimeout</code> to sent queued socket messages.
   * @attribute _socketMessageTimeout
   * @type Object
   * @private
   * @for Skylink
   * @since 0.5.8
   */
  this._socketMessageTimeout = null;

  /**
   * Stores the list of socket ports to use to connect to the Signaling.
   * These ports are defined by default which is commonly used currently by the Signaling.
   * Should re-evaluate this sometime.
   * @attribute _socketPorts
   * @param {Array} http: The list of HTTP socket ports.
   * @param {Array} https: The list of HTTPS socket ports.
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.5.8
   */
  this._socketPorts = {
    'http:': [80, 3000],
    'https:': [443, 3443]
  };

  /**
   * Stores the flag that indicates if socket connection to the Signaling has opened.
   * @attribute _channelOpen
   * @type Boolean
   * @private
   * @for Skylink
   * @since 0.5.2
   */
  this._channelOpen = false;

  /**
   * Stores the Signaling server url.
   * @attribute _signalingServer
   * @type String
   * @private
   * @for Skylink
   * @since 0.5.2
   */
  this._signalingServer = null;

  /**
   * Stores the Signaling server protocol.
   * @attribute _signalingServerProtocol
   * @type String
   * @private
   * @for Skylink
   * @since 0.5.4
   */
  this._signalingServerProtocol = window.location.protocol;

  /**
   * Stores the Signaling server port.
   * @attribute _signalingServerPort
   * @type Number
   * @private
   * @for Skylink
   * @since 0.5.4
   */
  this._signalingServerPort = null;

  /**
   * Stores the Signaling socket connection object.
   * @attribute _socket
   * @type io
   * @private
   * @for Skylink
   * @since 0.1.0
   */
  this._socket = null;

  /**
   * Stores the socket connection timeout when establishing connection to the Signaling.
   * @attribute _socketTimeout
   * @type Number
   * @private
   * @for Skylink
   * @since 0.5.4
   */
  this._socketTimeout = 20000;

  /**
   * Stores the flag that indicates if XDomainRequest is used for IE 8/9.
   * @attribute _socketUseXDR
   * @type Boolean
   * @private
   * @for Skylink
   * @since 0.5.4
   */
  this._socketUseXDR = false;

  /**
   * Stores the value if ICE restart is supported.
   * @attribute _enableIceRestart
   * @type String
   * @private
   * @for Skylink
   * @since 0.6.16
   */
  this._enableIceRestart = window.webrtcDetectedBrowser === 'firefox' ?
    window.webrtcDetectedVersion >= 48 : true;

  /**
   * Stores the flag if MCU environment is enabled.
   * @attribute _hasMCU
   * @type Boolean
   * @private
   * @for Skylink
   * @since 0.5.4
   */
  this._hasMCU = false;

  /**
   * Stores the flag if HTTPS connections should be enforced when connecting to
   *   the API or Signaling server if App is accessing from HTTP domain.
   * HTTPS connections are enforced if App is accessing from HTTPS domains.
   * @attribute _forceSSL
   * @type Boolean
   * @default false
   * @private
   * @for Skylink
   * @since 0.5.4
   */
  this._forceSSL = false;

  /**
   * Stores the flag if TURNS connections should be enforced when connecting to
   *   the TURN server if App is accessing from HTTP domain.
   * TURNS connections are enforced if App is accessing from HTTPS domains.
   * @attribute _forceTURNSSL
   * @type Boolean
   * @default false
   * @private
   * @for Skylink
   * @since 0.6.1
   */
  this._forceTURNSSL = false;

  /**
   * Stores the flag if TURN connections should be enforced when connecting to Peers.
   * This filters all non "relay" ICE candidates to enforce connections via the TURN server.
   * @attribute _forceTURN
   * @type Boolean
   * @default false
   * @private
   * @for Skylink
   * @since 0.6.1
   */
  this._forceTURN = false;

  /**
   * Stores the construct API REST path to obtain Room credentials.
   * @attribute _path
   * @type String
   * @private
   * @for Skylink
   * @since 0.1.0
   */
  this._path = null;

  /**
   * Stores the API server url.
   * @attribute _roomServer
   * @type String
   * @private
   * @for Skylink
   * @since 0.5.2
   */
  this._roomServer = '//api.temasys.io';

  /**
   * Stores the App Key configured in <code>init()</code>.
   * @attribute _appKey
   * @type String
   * @private
   * @for Skylink
   * @since 0.3.0
   */
  this._appKey = null;

  /**
   * Stores the default Room name to connect to when <code>joinRoom()</code> does not provide a Room name.
   * @attribute _defaultRoom
   * @type String
   * @private
   * @for Skylink
   * @since 0.3.0
   */
  this._defaultRoom = null;

  /**
   * Stores the <code>init()</code> credentials starting DateTime stamp in ISO 8601.
   * @attribute _roomStart
   * @type String
   * @private
   * @for Skylink
   * @since 0.3.0
   */
  this._roomStart = null;

  /**
   * Stores the <code>init()</code> credentials duration counted in hours.
   * @attribute _roomDuration
   * @type Number
   * @private
   * @for Skylink
   * @since 0.3.0
   */
  this._roomDuration = null;

  /**
   * Stores the <code>init()</code> generated credentials string.
   * @attribute _roomCredentials
   * @type String
   * @private
   * @for Skylink
   * @since 0.3.0
   */
  this._roomCredentials = null;

  /**
   * Stores the current <code>init()</code> readyState.
   * @attribute _readyState
   * @type Number
   * @private
   * @for Skylink
   * @since 0.1.0
   */
  this._readyState = 0;

  /**
   * Stores the "cid" used for <code>joinRoom()</code>.
   * @attribute _key
   * @type String
   * @private
   * @for Skylink
   * @since 0.1.0
   */
  this._key = null;

  /**
   * Stores the "apiOwner" used for <code>joinRoom()</code>.
   * @attribute _appKeyOwner
   * @type String
   * @private
   * @for Skylink
   * @since 0.5.2
   */
  this._appKeyOwner = null;

  /**
   * Stores the Room credentials information for <code>joinRoom()</code>.
   * @attribute _room
   * @param {String} id The "rid" for <code>joinRoom()</code>.
   * @param {String} token The "roomCred" for <code>joinRoom()</code>.
   * @param {String} startDateTime The "start" for <code>joinRoom()</code>.
   * @param {String} duration The "len" for <code>joinRoom()</code>.
   * @param {String} connection The RTCPeerConnection constraints and configuration. This is not used in the SDK
   *   except for the "mediaConstraints" property that sets the default <code>getUserMedia()</code> settings.
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.5.2
   */
  this._room = null;

  /**
   * Stores the list of Peer messages timestamp.
   * @attribute _peerMessagesStamps
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.15
   */
  this._peerMessagesStamps = {};

  /**
   * Stores the flag that indicates if <code>getUserMedia()</code> should fallback to retrieve
   *   audio only Stream after retrieval of audio and video Stream had failed.
   * @attribute _audioFallback
   * @type Boolean
   * @default false
   * @private
   * @for Skylink
   * @since 0.5.4
   */
  this._audioFallback = false;

  /**
   * Stores the Streams.
   * @attribute _streams
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.15
   */
  this._streams = {
    userMedia: null,
    screenshare: null
  };

  /**
   * Stores the default camera Stream settings.
   * @attribute _streamsDefaultSettings
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.15
   */
  this._streamsDefaultSettings = {
    userMedia: {
      audio: {
        stereo: false
      },
      video: {
        resolution: {
          width: 640,
          height: 480
        },
        frameRate: 50
      }
    },
    screenshare: {
      video: true
    }
  };

  /**
   * Stores all the Stream required muted settings.
   * @attribute _streamsMutedSettings
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.15
   */
  this._streamsMutedSettings = {
    audioMuted: false,
    videoMuted: false
  };

  /**
   * Stores all the Stream sending maximum bandwidth settings.
   * @attribute _streamsBandwidthSettings
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.15
   */
  this._streamsBandwidthSettings = {
    googleX: {},
    bAS: {}
  };

  /**
   * Stores all the Stream stopped callbacks.
   * @attribute _streamsStoppedCbs
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.15
   */
  this._streamsStoppedCbs = {};

  /**
   * Stores all the Stream sessions.
   * Defined as <code>false</code> when Stream has already ended.
   * @attribute _streamsSession
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.15
   */
  this._streamsSession = {};

  /**
   * Stores the preferred sending Peer connection streaming audio codec.
   * @attribute _selectedAudioCodec
   * @type String
   * @default "auto"
   * @private
   * @for Skylink
   * @since 0.5.10
   */
  this._selectedAudioCodec = 'auto';

  /**
   * Stores the preferred sending Peer connection streaming video codec.
   * @attribute _selectedVideoCodec
   * @type String
   * @default "auto"
   * @private
   * @for Skylink
   * @since 0.5.10
   */
  this._selectedVideoCodec = 'auto';

  /**
   * Stores the flag if ulpfec and red codecs should be removed.
   * @attribute _disableVideoFecCodecs
   * @type Boolean
   * @default false
   * @private
   * @for Skylink
   * @since 0.6.16
   */
  this._disableVideoFecCodecs = false;

  /**
   * Stores the flag if CN (Comfort Noise) codec should be removed.
   * @attribute _disableComfortNoiseCodec
   * @type Boolean
   * @default false
   * @private
   * @for Skylink
   * @since 0.6.16
   */
  this._disableComfortNoiseCodec = false;

  /**
   * Stores the flag if REMB feedback packets should be removed.
   * @attribute _disableREMB
   * @type Boolean
   * @default false
   * @private
   * @for Skylink
   * @since 0.6.16
   */
  this._disableREMB = false;

  /**
   * Stores the session description settings.
   * @attribute _sdpSettings
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.16
   */
  this._sdpSettings = {
    connection: {
      audio: true,
      video: true,
      data: true
    },
    direction: {
      audio: { send: true, receive: true },
      video: { send: true, receive: true }
    }
  };

  /**
   * Stores the publish only settings.
   * @attribute _publishOnly
   * @type Boolean
   * @private
   * @for Skylink
   * @since 0.6.16
   */
  this._publishOnly = false;

  /**
   * Stores the parent ID.
   * @attribute _parentId
   * @type String
   * @private
   * @for Skylink
   * @since 0.6.18
   */
  this._parentId = null;

  /**
   * Stores the list of recordings.
   * @attribute _recordings
   * @type JSON
   * @private
   * @beta
   * @for Skylink
   * @since 0.6.16
   */
  this._recordings = {};

  /**
   * Stores the current active recording session ID.
   * There can only be 1 recording session at a time in a Room
   * @attribute _currentRecordingId
   * @type JSON
   * @private
   * @beta
   * @for Skylink
   * @since 0.6.16
   */
  this._currentRecordingId = false;

  /**
   * Stores the recording session timeout to ensure 4 seconds has been recorded.
   * @attribute _recordingStartInterval
   * @type JSON
   * @private
   * @beta
   * @for Skylink
   * @since 0.6.16
   */
  this._recordingStartInterval = null;

  /**
   * Stores the flag if MCU should use renegotiation.
   * @attribute _mcuUseRenegoRestart
   * @type Boolean
   * @private
   * @for Skylink
   * @since 0.6.16
   */
  this._mcuUseRenegoRestart = false;

  /**
   * Stores the debugging TURN/STUN ICE server.
   * @attribute _turnServer
   * @type String
   * @private
   * @for Skylink
   * @since 0.6.18
   */
  this._turnServer = null;

  /**
   * Stores the debugging Signaling server.
   * @attribute _socketServer
   * @type String
   * @private
   * @for Skylink
   * @since 0.6.18
   */
  this._socketServer = null;

  /**
   * Stores the currently supported codecs.
   * @attribute _currentCodecSupport
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.18
   */
  this._currentCodecSupport = null;

  /**
   * Stores the session description orders and info.
   * @attribute _sdpSessions
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.18
   */
  this._sdpSessions = {};
}

/**
 * Stores the data chunk size for Blob transfers.
 * @attribute _CHUNK_FILE_SIZE
 * @type Number
 * @private
 * @readOnly
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._CHUNK_FILE_SIZE = 49152;

/**
 * Stores the data chunk size for Blob transfers transferring from/to
 *   Firefox browsers due to limitation tested in the past in some PCs (linx predominatly).
 * @attribute _MOZ_CHUNK_FILE_SIZE
 * @type Number
 * @private
 * @readOnly
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._MOZ_CHUNK_FILE_SIZE = 12288;

/**
 * Stores the data chunk size for binary Blob transfers.
 * @attribute _BINARY_FILE_SIZE
 * @type Number
 * @private
 * @readOnly
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._BINARY_FILE_SIZE = 65456;

/**
 * Stores the data chunk size for binary Blob transfers.
 * @attribute _MOZ_BINARY_FILE_SIZE
 * @type Number
 * @private
 * @readOnly
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._MOZ_BINARY_FILE_SIZE = 16384;

/**
 * Stores the data chunk size for data URI string transfers.
 * @attribute _CHUNK_DATAURL_SIZE
 * @type Number
 * @private
 * @readOnly
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._CHUNK_DATAURL_SIZE = 1212;

/**
 * Stores the list of data transfer protocols.
 * @attribute _DC_PROTOCOL_TYPE
 * @param {String} WRQ The protocol to initiate data transfer.
 * @param {String} ACK The protocol to request for data transfer chunk.
 *   Give <code>-1</code> to reject the request at the beginning and <code>0</code> to accept
 *   the data transfer request.
 * @param {String} CANCEL The protocol to terminate data transfer.
 * @param {String} ERROR The protocol when data transfer has errors and has to be terminated.
 * @param {String} MESSAGE The protocol that is used to send P2P messages.
 * @type JSON
 * @readOnly
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._DC_PROTOCOL_TYPE = {
  WRQ: 'WRQ',
  ACK: 'ACK',
  ERROR: 'ERROR',
  CANCEL: 'CANCEL',
  MESSAGE: 'MESSAGE'
};

/**
 * Stores the list of socket messaging protocol types.
 * See confluence docs for the list based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @attribute _SIG_MESSAGE_TYPE
 * @type JSON
 * @readOnly
 * @private
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype._SIG_MESSAGE_TYPE = {
  JOIN_ROOM: 'joinRoom',
  IN_ROOM: 'inRoom',
  ENTER: 'enter',
  WELCOME: 'welcome',
  RESTART: 'restart',
  OFFER: 'offer',
  ANSWER: 'answer',
  CANDIDATE: 'candidate',
  BYE: 'bye',
  REDIRECT: 'redirect',
  UPDATE_USER: 'updateUserEvent',
  ROOM_LOCK: 'roomLockEvent',
  MUTE_VIDEO: 'muteVideoEvent',
  MUTE_AUDIO: 'muteAudioEvent',
  PUBLIC_MESSAGE: 'public',
  PRIVATE_MESSAGE: 'private',
  STREAM: 'stream',
  GROUP: 'group',
  GET_PEERS: 'getPeers',
  PEER_LIST: 'peerList',
  INTRODUCE: 'introduce',
  INTRODUCE_ERROR: 'introduceError',
  APPROACH: 'approach',
  START_RECORDING: 'startRecordingRoom',
  STOP_RECORDING: 'stopRecordingRoom',
  RECORDING: 'recordingEvent',
  END_OF_CANDIDATES: 'endOfCandidates'
};

/**
 * Stores the list of socket messaging protocol types to queue when sent less than a second interval.
 * @attribute _groupMessageList
 * @type Array
 * @private
 * @for Skylink
 * @since 0.5.10
 */
Skylink.prototype._groupMessageList = [
  Skylink.prototype._SIG_MESSAGE_TYPE.STREAM,
  Skylink.prototype._SIG_MESSAGE_TYPE.UPDATE_USER,
  Skylink.prototype._SIG_MESSAGE_TYPE.MUTE_AUDIO,
  Skylink.prototype._SIG_MESSAGE_TYPE.MUTE_VIDEO,
  Skylink.prototype._SIG_MESSAGE_TYPE.PUBLIC_MESSAGE
];

var SkylinkLogs = {
  /**
   * Function that gets the current stored SDK <code>console</code> logs.
   * @property SkylinkLogs.getLogs
   * @param {Number} [logLevel] The specific log level of logs to return.
   * - When not provided or that the level does not exists, it will return all logs of all levels.
   *  [Rel: Skylink.LOG_LEVEL]
   * @return {Array} The array of stored logs.<ul>
   *   <li><code><#index></code><var><b>{</b>Array<b>}</b></var><p>The stored log item.</p><ul>
   *   <li><code>0</code><var><b>{</b>Date<b>}</b></var><p>The DateTime of when the log was stored.</p></li>
   *   <li><code>1</code><var><b>{</b>String<b>}</b></var><p>The log level. [Rel: Skylink.LOG_LEVEL]</p></li>
   *   <li><code>2</code><var><b>{</b>String<b>}</b></var><p>The log message.</p></li>
   *   <li><code>3</code><var><b>{</b>Any<b>}</b></var><span class="label">Optional</span><p>The log message object.</li>
   *   <li><code>4</code><var><b>{</b>String<b>}</b></var><span class="label">Optional</span><p>The Skylink object
   *   instance label.</li></p></li></ul></li></ul>
   * @example
   *  // Example 1: Get logs of specific level
   *  var debugLogs = SkylinkLogs.getLogs(skylinkDemo.LOG_LEVEL.DEBUG);
   *
   *  // Example 2: Get all the logs
   *  var allLogs = SkylinkLogs.getLogs();
   * @type Function
   * @global true
   * @triggerForPropHackNone true
   * @for Skylink
   * @since 0.5.5
   */
  getLogs: function (logLevel, instanceLabel) {
    if (logLevel && typeof logLevel === 'string') {
      instanceLabel = logLevel;
      logLevel = null;
    }

    return Log.loopLogs(instanceLabel, logLevel);
  },

  /**
   * Function that clears all the current stored SDK <code>console</code> logs.
   * @property SkylinkLogs.clearAllLogs
   * @type Function
   * @example
   *   // Example 1: Clear all the logs
   *   SkylinkLogs.clearAllLogs();
   * @global true
   * @triggerForPropHackNone true
   * @for Skylink
   * @since 0.5.5
   */
  clearAllLogs: function (instanceLabel, logLevel) {
    if (typeof instanceLabel === 'number') {
      logLevel = instanceLabel;
      instanceLabel = null;
    }

    Log.clearLogs(instanceLabel, logLevel);
  },

  /**
   * Function that prints all the current stored SDK <code>console</code> logs into the
   * <a href="https://developer.mozilla.org/en/docs/Web/API/console">Javascript Web Console</a>.
   * @property SkylinkLogs.printAllLogs
   * @type Function
   * @example
   *   // Example 1: Print all the logs
   *   SkylinkLogs.printAllLogs();
   * @global true
   * @triggerForPropHackNone true
   * @for Skylink
   * @since 0.5.5
   */
  printAllLogs: function (instanceLabel, logLevel) {
    if (typeof instanceLabel === 'number') {
      logLevel = instanceLabel;
      instanceLabel = null;
    }

    var logs = Log.loopLogs(instanceLabel, logLevel);
    UtilsFactory.forEach(logs, function (log) {
      console[log[1]].apply(log);
    });
  }
};
Skylink.prototype.AUDIO_CODEC = {
  AUTO: 'auto',
  ISAC: 'ISAC',
  OPUS: 'opus',
  //ILBC: 'ILBC',
  //G711: 'G711',
  G722: 'G722'
  //SILK: 'SILK'
};
Skylink.prototype.CANDIDATE_GENERATION_STATE = {
  NEW: 'new',
  GATHERING: 'gathering',
  COMPLETED: 'completed'
};
Skylink.prototype.CANDIDATE_PROCESSING_STATE = {
  RECEIVED: 'received',
  DROPPED: 'dropped',
  BUFFERED: 'buffered',
  PROCESSING: 'processing',
  PROCESS_SUCCESS: 'processSuccess',
  PROCESS_ERROR: 'processError'
};
Skylink.prototype.DATA_CHANNEL_MESSAGE_ERROR = {
  MESSAGE: 'message',
  TRANSFER: 'transfer'
};
Skylink.prototype.DATA_CHANNEL_STATE = {
  CONNECTING: 'connecting',
  OPEN: 'open',
  CLOSING: 'closing',
  CLOSED: 'closed',
  ERROR: 'error',
  CREATE_ERROR: 'createError',
  BUFFERED_AMOUNT_LOW: 'bufferedAmountLow',
  SEND_MESSAGE_ERROR: 'sendMessageError'
};
Skylink.prototype.DATA_CHANNEL_TYPE = {
  MESSAGING: 'messaging',
  DATA: 'data'
};
Skylink.prototype.DATA_STREAM_STATE = {
  SENDING_STARTED: 'sendStart',
  SENDING_STOPPED: 'sendStop',
  RECEIVING_STARTED: 'receiveStart',
  RECEIVING_STOPPED: 'receiveStop',
  RECEIVED: 'received',
  SENT: 'sent',
  ERROR: 'error',
  START_ERROR: 'startError'
};
Skylink.prototype.DATA_TRANSFER_DATA_TYPE = {
  BINARY_STRING: 'binaryString',
  ARRAY_BUFFER: 'arrayBuffer',
  BLOB: 'blob',
  STRING: 'string'
};
Skylink.prototype.DATA_TRANSFER_SESSION_TYPE = {
  BLOB: 'blob',
  DATA_URL: 'dataURL'
};
Skylink.prototype.DATA_TRANSFER_STATE = {
  UPLOAD_REQUEST: 'request',
  UPLOAD_STARTED: 'uploadStarted',
  DOWNLOAD_STARTED: 'downloadStarted',
  REJECTED: 'rejected',
  CANCEL: 'cancel',
  ERROR: 'error',
  UPLOADING: 'uploading',
  DOWNLOADING: 'downloading',
  UPLOAD_COMPLETED: 'uploadCompleted',
  DOWNLOAD_COMPLETED: 'downloadCompleted',
  USER_REJECTED: 'userRejected',
  USER_UPLOAD_REQUEST: 'userRequest',
  START_ERROR: 'startError'
};
Skylink.prototype.DATA_TRANSFER_TYPE = {
  UPLOAD: 'upload',
  DOWNLOAD: 'download'
};
Skylink.prototype.DT_PROTOCOL_VERSION = '0.1.3';
Skylink.prototype.GET_CONNECTION_STATUS_STATE = {
  RETRIEVING: 0,
  RETRIEVE_SUCCESS: 1,
  RETRIEVE_ERROR: -1
};
Skylink.prototype.GET_PEERS_STATE = {
  ENQUIRED: 'enquired',
  RECEIVED: 'received'
};
Skylink.prototype.HANDSHAKE_PROGRESS = {
  ENTER: 'enter',
  WELCOME: 'welcome',
  OFFER: 'offer',
  ANSWER: 'answer',
  ERROR: 'error'
};
Skylink.prototype.ICE_CONNECTION_STATE = {
  STARTING: 'starting',
  CHECKING: 'checking',
  CONNECTED: 'connected',
  COMPLETED: 'completed',
  CLOSED: 'closed',
  FAILED: 'failed',
  TRICKLE_FAILED: 'trickleFailed',
  DISCONNECTED: 'disconnected'
};
Skylink.prototype.INTRODUCE_STATE = {
  INTRODUCING: 'introducing',
  ERROR: 'error'
};
Skylink.prototype.LOG_LEVEL = {
  DEBUG: 4,
  LOG: 3,
  INFO: 2,
  WARN: 1,
  ERROR: 0,
  NONE: -1
};
Skylink.prototype.MEDIA_ACCESS_FALLBACK_STATE = {
  FALLBACKING: 0,
  FALLBACKED: 1,
  ERROR: -1
};
Skylink.prototype.PEER_CONNECTION_STATE = {
  STABLE: 'stable',
  HAVE_LOCAL_OFFER: 'have-local-offer',
  HAVE_REMOTE_OFFER: 'have-remote-offer',
  CLOSED: 'closed'
};
Skylink.prototype.READY_STATE_CHANGE = {
  INIT: 0,
  LOADING: 1,
  COMPLETED: 2,
  ERROR: -1
};
Skylink.prototype.READY_STATE_CHANGE_ERROR = {
  API_INVALID: 4001,
  API_DOMAIN_NOT_MATCH: 4002,
  API_CORS_DOMAIN_NOT_MATCH: 4003,
  API_CREDENTIALS_INVALID: 4004,
  API_CREDENTIALS_NOT_MATCH: 4005,
  API_INVALID_PARENT_KEY: 4006,
  API_NO_MEETING_RECORD_FOUND: 4010,
  API_OVER_SEAT_LIMIT: 4020,
  API_RETRIEVAL_FAILED: 4021,
  API_WRONG_ACCESS_DOMAIN: 5005,
  XML_HTTP_REQUEST_ERROR: -1,
  NO_SOCKET_IO: 1,
  NO_XMLHTTPREQUEST_SUPPORT: 2,
  NO_WEBRTC_SUPPORT: 3,
  NO_PATH: 4,
  ADAPTER_NO_LOADED: 7,
  PARSE_CODECS: 8
};
Skylink.prototype.RECORDING_STATE = {
  START: 0,
  STOP: 1,
  LINK: 2,
  ERROR: -1
};
Skylink.prototype.REGIONAL_SERVER = {
  APAC1: '',
  US1: ''
};
Skylink.prototype.SERVER_PEER_TYPE = {
  MCU: 'mcu'
  //SIP: 'sip'
};
Skylink.prototype.SM_PROTOCOL_VERSION = '0.1.2.3';
Skylink.prototype.SOCKET_ERROR = {
  CONNECTION_FAILED: 0,
  RECONNECTION_FAILED: -1,
  CONNECTION_ABORTED: -2,
  RECONNECTION_ABORTED: -3,
  RECONNECTION_ATTEMPT: -4
};
Skylink.prototype.SOCKET_FALLBACK = {
  NON_FALLBACK: 'nonfallback',
  FALLBACK_PORT: 'fallbackPortNonSSL',
  FALLBACK_SSL_PORT: 'fallbackPortSSL',
  LONG_POLLING: 'fallbackLongPollingNonSSL',
  LONG_POLLING_SSL: 'fallbackLongPollingSSL'
};
Skylink.prototype.SYSTEM_ACTION = {
  WARNING: 'warning',
  REJECT: 'reject'
};
Skylink.prototype.SYSTEM_ACTION_REASON = {
  CREDENTIALS_EXPIRED: 'oldTimeStamp',
  CREDENTIALS_ERROR: 'credentialError',
  DUPLICATED_LOGIN: 'duplicatedLogin',
  ROOM_NOT_STARTED: 'notStart',
  EXPIRED: 'expired',
  ROOM_LOCKED: 'locked',
  FAST_MESSAGE: 'fastmsg',
  ROOM_CLOSING: 'toclose',
  ROOM_CLOSED: 'roomclose',
  SERVER_ERROR: 'serverError',
  KEY_ERROR: 'keyFailed'
};
Skylink.prototype.TURN_TRANSPORT = {
  UDP: 'udp',
  TCP: 'tcp',
  ANY: 'any',
  NONE: 'none',
  ALL: 'all'
};
Skylink.prototype.VERSION = '0.6.17';
Skylink.prototype.VIDEO_CODEC = {
  AUTO: 'auto',
  VP8: 'VP8',
  H264: 'H264',
  VP9: 'VP9'
  //H264UC: 'H264UC'
};
Skylink.prototype.VIDEO_RESOLUTION = {
  QQVGA: { width: 160, height: 120 /*, aspectRatio: '4:3'*/ },
  HQVGA: { width: 240, height: 160 /*, aspectRatio: '3:2'*/ },
  QVGA: { width: 320, height: 240 /*, aspectRatio: '4:3'*/ },
  WQVGA: { width: 384, height: 240 /*, aspectRatio: '16:10'*/ },
  HVGA: { width: 480, height: 320 /*, aspectRatio: '3:2'*/ },
  VGA: { width: 640, height: 480 /*, aspectRatio: '4:3'*/ },
  WVGA: { width: 768, height: 480 /*, aspectRatio: '16:10'*/ },
  FWVGA: { width: 854, height: 480 /*, aspectRatio: '16:9'*/ },
  SVGA: { width: 800, height: 600 /*, aspectRatio: '4:3'*/ },
  DVGA: { width: 960, height: 640 /*, aspectRatio: '3:2'*/ },
  WSVGA: { width: 1024, height: 576 /*, aspectRatio: '16:9'*/ },
  HD: { width: 1280, height: 720 /*, aspectRatio: '16:9'*/ },
  HDPLUS: { width: 1600, height: 900 /*, aspectRatio: '16:9'*/ },
  FHD: { width: 1920, height: 1080 /*, aspectRatio: '16:9'*/ },
  QHD: { width: 2560, height: 1440 /*, aspectRatio: '16:9'*/ },
  WQXGAPLUS: { width: 3200, height: 1800 /*, aspectRatio: '16:9'*/ },
  UHD: { width: 3840, height: 2160 /*, aspectRatio: '16:9'*/ },
  UHDPLUS: { width: 5120, height: 2880 /*, aspectRatio: '16:9'*/ },
  FUHD: { width: 7680, height: 4320 /*, aspectRatio: '16:9'*/ },
  QUHD: { width: 15360, height: 8640 /*, aspectRatio: '16:9'*/ }
};
Skylink.prototype.respondBlobRequest =
Skylink.prototype.acceptDataTransfer = function (peerId, transferId, accept) {
  var self = this;

  if (typeof transferId !== 'string' && typeof peerId !== 'string') {
    Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', transferId, 'Aborting accept data transfer as ' +
      'data transfer ID or peer ID is not provided']);
    return;
  }

  if (!self._dataChannels[peerId]) {
    Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', transferId, 'Aborting accept data transfer as ' +
      'Peer does not have any Datachannel connections']);
    return;
  }

  if (!self._dataTransfers[transferId]) {
    Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', transferId, 'Aborting accept data transfer as ' +
      'invalid transfer ID is provided']);
    return;
  }

  // Check Datachannel property in _dataChannels[peerId] list
  var channelProp = 'main';

  if (self._dataChannels[peerId][transferId]) {
    channelProp = transferId;
  }

  if (accept) {
    Log.debug(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', transferId, 'Accepted data transfer and starting ...']);

    var dataChannelStateCbFn = function (state, evtPeerId, error, cN, cT) {
      self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.ERROR, transferId, peerId,
        self._getTransferInfo(transferId, peerId, true, false, false), {
        transferType: self.DATA_TRANSFER_TYPE.DOWNLOAD,
        message: new Error('Data transfer terminated as Peer Datachannel connection closed abruptly.')
      });
    };

    self.once('dataChannelState', dataChannelStateCbFn, function (state, evtPeerId, error, channelName, channelType) {
      if (!(self._dataTransfers[transferId] && self._dataTransfers[transferId].sessions[peerId])) {
        self.off('dataChannelState', dataChannelStateCbFn);
        return;
      }
      return evtPeerId === peerId && (channelProp === 'main' ? channelType === self.DATA_CHANNEL_STATE.MESSAGING :
        channelName === transferId) && [self.DATA_CHANNEL_STATE.CLOSING, self.DATA_CHANNEL_STATE.CLOSED,
        self.DATA_CHANNEL_STATE.ERROR].indexOf(state) > -1;
    });

    // From here we start detecting as completion for data transfer downloads
    self.once('dataTransferState', function () {
      if (dataChannelStateCbFn) {
        self.off('dataChannelState', dataChannelStateCbFn);
      }

      delete self._dataTransfers[transferId];

      if (self._dataChannels[peerId]) {
        if (channelProp === 'main' && self._dataChannels[peerId].main) {
          self._dataChannels[peerId].main.setCustom('transferId', null);
        }

        if (channelProp === transferId) {
          self._closeDataChannel(peerId, transferId);
        }
      }
    }, function (state, evtTransferId, evtPeerId) {
      return evtTransferId === transferId && evtPeerId === peerId &&
        [self.DATA_TRANSFER_STATE.ERROR, self.DATA_TRANSFER_STATE.CANCEL,
        self.DATA_TRANSFER_STATE.DOWNLOAD_COMPLETED].indexOf(state) > -1;
    });

    // Send ACK protocol to start data transfer
    // MCU sends the data transfer from the "P2P" Datachannel
    self._sendMessageToDataChannel(peerId, {
      type: self._DC_PROTOCOL_TYPE.ACK,
      sender: self._user.sid,
      ackN: 0
    }, channelProp);

    self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.DOWNLOAD_STARTED, transferId, peerId,
      self._getTransferInfo(transferId, peerId, true, false, false), null);

  } else {
    Log.warn(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', transferId, 'Rejected data transfer and data transfer request has been aborted']);

    // Send ACK protocol to terminate data transfer request
    // MCU sends the data transfer from the "P2P" Datachannel
    self._sendMessageToDataChannel(peerId, {
      type: self._DC_PROTOCOL_TYPE.ACK,
      sender: self._user.sid,
      ackN: -1
    }, channelProp);

    // Insanity check
    if (channelProp === 'main' && self._dataChannels[peerId].main) {
      self._dataChannels[peerId].main.setCustom('transferId', null);
    }

    self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.USER_REJECTED, transferId, peerId,
      self._getTransferInfo(transferId, peerId, true, false, false), {
      message: new Error('Data transfer terminated as User has rejected data transfer request.'),
      transferType: self.DATA_TRANSFER_TYPE.DOWNLOAD
    });

    delete self._dataTransfers[transferId];
  }
};
Skylink.prototype.cancelBlobTransfer =
Skylink.prototype.cancelDataTransfer = function (peerId, transferId) {
  var self = this;

  if (!(transferId && typeof transferId === 'string')) {
    Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', transferId, 'Aborting cancel data transfer as data transfer ID is not provided']);
    return;
  }

  if (!(peerId && typeof peerId === 'string')) {
    Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', transferId, 'Aborting cancel data transfer as peer ID is not provided']);
    return;
  }

  if (!self._dataTransfers[transferId]) {
    Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', transferId, 'Aborting cancel data transfer as ' +
      'data transfer session does not exists.']);
    return;
  }

  Log.debug(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', transferId, 'Canceling data transfer ...']);

  /**
   * Emit data state event function.
   */
  var emitEventFn = function (peers, transferInfoPeerId) {
    for (var i = 0; i < peers.length; i++) {
      self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.CANCEL, transferId, peers[i],
        self._getTransferInfo(transferId, transferInfoPeerId, false, false, false), {
        transferType: self._dataTransfers[transferId].direction,
        message: new Error('User cancelled download transfer')
      });
    }
  };

  // For uploading from Peer to MCU case of broadcast
  if (self._hasMCU && self._dataTransfers[transferId].direction === self.DATA_TRANSFER_TYPE.UPLOAD) {
    if (!self._dataChannels.MCU) {
      Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', transferId, 'Aborting cancel data transfer as ' +
        'Peer does not have any Datachannel connections']);
      return;
    }

    // We abort all data transfers to all Peers if uploading via MCU since it broadcasts to MCU
    Log.warn(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', transferId, 'Aborting all data transfers to Peers']);

    // If data transfer to MCU broadcast has interop Peers, send to MCU via the "main" Datachannel
    if (Object.keys(self._dataTransfers[transferId].peers.main).length > 0) {
      self._sendMessageToDataChannel('MCU', {
        type: self._DC_PROTOCOL_TYPE.CANCEL,
        sender: self._user.sid,
        content: 'Peer cancelled download transfer',
        name: self._dataTransfers[transferId].name,
        ackN: 0
      }, 'main');
    }

    // If data transfer to MCU broadcast has non-interop Peers, send to MCU via the new Datachanel
    if (Object.keys(self._dataTransfers[transferId].peers[transferId]).length > 0) {
      self._sendMessageToDataChannel('MCU', {
        type: self._DC_PROTOCOL_TYPE.CANCEL,
        sender: self._user.sid,
        content: 'Peer cancelled download transfer',
        name: self._dataTransfers[transferId].name,
        ackN: 0
      }, transferId);
    }

    emitEventFn(Object.keys(self._dataTransfers[transferId].peers.main).concat(
      Object.keys(self._dataTransfers[transferId].peers[transferId])));
  } else {
    var channelProp = 'main';

    if (!self._dataChannels[peerId]) {
      Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', transferId, 'Aborting cancel data transfer as ' +
        'Peer does not have any Datachannel connections']);
      return;
    }

    if (self._dataChannels[peerId][transferId]) {
      channelProp = transferId;
    }

    self._sendMessageToDataChannel(peerId, {
      type: self._DC_PROTOCOL_TYPE.CANCEL,
      sender: self._user.sid,
      content: 'Peer cancelled download transfer',
      name: self._dataTransfers[transferId].name,
      ackN: 0
    }, channelProp);

    emitEventFn([peerId], peerId);
  }
};
Skylink.prototype.disableAudio = function() {
  this.muteStream({
    audioMuted: true,
    videoMuted: this._streamsMutedSettings.videoMuted
  });
};
Skylink.prototype.disableVideo = function() {
  this.muteStream({
    videoMuted: true,
    audioMuted: this._streamsMutedSettings.audioMuted
  });
};
Skylink.prototype.enableAudio = function() {
  this.muteStream({
    audioMuted: false,
    videoMuted: this._streamsMutedSettings.videoMuted
  });
};
Skylink.prototype.enableVideo = function() {
  this.muteStream({
    videoMuted: false,
    audioMuted: this._streamsMutedSettings.audioMuted
  });
};
/* jshint ignore:start */
Skylink.prototype.generateUUID = function() {
  var d = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === 'x' ? r : (r && 0x7 | 0x8)).toString(16);
  });
  return uuid;
};
/* jshint ignore:end */
Skylink.prototype.getConnectionStatus = function (targetPeerId, callback) {
  var self = this;
  var listOfPeers = Object.keys(self._peerConnections);
  var listOfPeerStats = {};
  var listOfPeerErrors = {};

  // getConnectionStatus([])
  if (Array.isArray(targetPeerId)) {
    listOfPeers = targetPeerId;

  // getConnectionStatus('...')
  } else if (typeof targetPeerId === 'string' && !!targetPeerId) {
    listOfPeers = [targetPeerId];

  // getConnectionStatus(function () {})
  } else if (typeof targetPeerId === 'function') {
    callback = targetPeerId;
    targetPeerId = undefined;
  }

  // Check if Peers list is empty, in which we throw an Error if there isn't any
  if (listOfPeers.length === 0) {
    listOfPeerErrors.self = new Error('There is currently no peer connections to retrieve connection status');

    Log.error(self._debugOptions.instanceId, [null, 'RTCStatsReport', null, 'Retrieving request failure ->'], listOfPeerErrors.self);

    if (typeof callback === 'function') {
      callback({
        listOfPeers: listOfPeers,
        retrievalErrors: listOfPeerErrors,
        connectionStats: listOfPeerStats
      }, null);
    }
    return;
  }

  if (window.webrtcDetectedBrowser === 'edge') {
    Log.warn(self._debugOptions.instanceId, 'Edge browser does not have well support for stats.');
  }

  var completedTaskCounter = [];

  var checkCompletedFn = function (peerId) {
    if (completedTaskCounter.indexOf(peerId) === -1) {
      completedTaskCounter.push(peerId);
    }

    if (completedTaskCounter.length === listOfPeers.length) {
      if (typeof callback === 'function') {
        if (Object.keys(listOfPeerErrors).length > 0) {
          callback({
            listOfPeers: listOfPeers,
            retrievalErrors: listOfPeerErrors,
            connectionStats: listOfPeerStats
          }, null);

        } else {
          callback(null, {
            listOfPeers: listOfPeers,
            connectionStats: listOfPeerStats
          });
        }
      }
    }
  };

  var statsFn = function (peerId) {
    var retrieveFn = function (firstRetrieval, nextCb) {
      return function (err, result) {
        if (err) {
          Log.error(self._debugOptions.instanceId, [peerId, 'RTCStatsReport', null, 'Retrieval failure ->'], error);
          listOfPeerErrors[peerId] = error;
          self._trigger('getConnectionStatusStateChange', self.GET_CONNECTION_STATUS_STATE.RETRIEVE_ERROR,
            peerId, null, error);
          checkCompletedFn(peerId);
          if (firstRetrieval) {
            delete self._peerStats[peerId];
          }
          return;
        }

        if (firstRetrieval) {
          nextCb();
        } else {
          listOfPeerStats[peerId] = result;
          self._trigger('getConnectionStatusStateChange', self.GET_CONNECTION_STATUS_STATE.RETRIEVE_SUCCESS,
            peerId, listOfPeerStats[peerId], null);
          checkCompletedFn(peerId);
        }
      };
    };

    if (!self._peerStats[peerId]) {
      self._peerStats[peerId] = {};

      Log.debug(self._debugOptions.instanceId, [peerId, 'RTCStatsReport', null, 'Retrieving first report to tabulate results']);

      self._retrieveStats(peerId, retrieveFn(true, function () {
        self._retrieveStats(peerId, retrieveFn());
      }));
      return;
    }

    self._retrieveStats(peerId, retrieveFn());
  };

  // Loop through all the list of Peers selected to retrieve connection status
  for (var i = 0; i < listOfPeers.length; i++) {
    var peerId = listOfPeers[i];

    self._trigger('getConnectionStatusStateChange', self.GET_CONNECTION_STATUS_STATE.RETRIEVING,
      peerId, null, null);

    // Check if the Peer connection exists first
    if (self._peerConnections.hasOwnProperty(peerId) && self._peerConnections[peerId]) {
      statsFn(peerId);

    } else {
      listOfPeerErrors[peerId] = new Error('The peer connection object does not exists');

      Log.error(self._debugOptions.instanceId, [peerId, 'RTCStatsReport', null, 'Retrieval failure ->'], listOfPeerErrors[peerId]);

      self._trigger('getConnectionStatusStateChange', self.GET_CONNECTION_STATUS_STATE.RETRIEVE_ERROR,
        peerId, null, listOfPeerErrors[peerId]);

      checkCompletedFn(peerId);
    }
  }
};
Skylink.prototype.getCurrentDataTransfers = function() {
  var listOfDataTransfers = {};

  if (!(this._user && this._user.sid)) {
    return {};
  }

  for (var prop in this._dataTransfers) {
    if (this._dataTransfers.hasOwnProperty(prop) && this._dataTransfers[prop]) {
      listOfDataTransfers[prop] = {
        transferInfo: this._getTransferInfo(prop, this._user.sid, true, true, true),
        isSelf: this._dataTransfers[prop].senderPeerId === this._user.sid,
        peerId: this._dataTransfers[prop].senderPeerId || this._user.sid
      };
    }
  }

  return listOfDataTransfers;
};
Skylink.prototype.getPeerInfo = function(peerId) {
  var peerInfo = null;

  if (typeof peerId === 'string' && typeof this._peerInformations[peerId] === 'object') {
    peerInfo = UtilsFactory.clone(this._peerInformations[peerId]);
    peerInfo.room = UtilsFactory.clone(this._selectedRoom);
    peerInfo.settings.bandwidth = peerInfo.settings.bandwidth || {};
    peerInfo.settings.googleXBandwidth = peerInfo.settings.googleXBandwidth || {};

    if (!(typeof peerInfo.settings.video === 'boolean' || (peerInfo.settings.video &&
      typeof peerInfo.settings.video === 'object'))) {
      peerInfo.settings.video = false;
      peerInfo.mediaStatus.audioMuted = true;
    }

    if (!(typeof peerInfo.settings.audio === 'boolean' || (peerInfo.settings.audio &&
      typeof peerInfo.settings.audio === 'object'))) {
      peerInfo.settings.audio = false;
      peerInfo.mediaStatus.audioMuted = true;
    }

    if (typeof peerInfo.mediaStatus.audioMuted !== 'boolean') {
      peerInfo.mediaStatus.audioMuted = true;
    }

    if (typeof peerInfo.mediaStatus.videoMuted !== 'boolean') {
      peerInfo.mediaStatus.videoMuted = true;
    }

    if (peerInfo.settings.maxBandwidth) {
      peerInfo.settings.bandwidth = UtilsFactory.clone(peerInfo.settings.maxBandwidth);
      delete peerInfo.settings.maxBandwidth;
    }

    if (peerInfo.settings.video && typeof peerInfo.settings.video === 'object' &&
      peerInfo.settings.video.customSettings && typeof peerInfo.settings.video.customSettings === 'object') {
      if (peerInfo.settings.video.customSettings.frameRate) {
        peerInfo.settings.video.frameRate = UtilsFactory.clone(peerInfo.settings.video.customSettings.frameRate);
      }
      if (peerInfo.settings.video.customSettings.facingMode) {
        peerInfo.settings.video.facingMode = UtilsFactory.clone(peerInfo.settings.video.customSettings.facingMode);
      }
      if (peerInfo.settings.video.customSettings.width) {
        peerInfo.settings.video.resolution = peerInfo.settings.video.resolution || {};
        peerInfo.settings.video.resolution.width = UtilsFactory.clone(peerInfo.settings.video.customSettings.width);
      }
      if (peerInfo.settings.video.customSettings.height) {
        peerInfo.settings.video.resolution = peerInfo.settings.video.resolution || {};
        peerInfo.settings.video.resolution.height = UtilsFactory.clone(peerInfo.settings.video.customSettings.height);
      }
      if (peerInfo.settings.video.customSettings.facingMode) {
        peerInfo.settings.video.facingMode = UtilsFactory.clone(peerInfo.settings.video.customSettings.facingMode);
      }
    }

    if (peerInfo.settings.audio && typeof peerInfo.settings.audio === 'object') {
      peerInfo.settings.audio.stereo = peerInfo.settings.audio.stereo === true;
    }

    if (!(peerInfo.userData !== null && typeof peerInfo.userData !== 'undefined')) {
      peerInfo.userData = '';
    }

    peerInfo.parentId = peerInfo.parentId || null;

    if (peerId === 'MCU') {
      peerInfo.config.receiveOnly = true;
      peerInfo.config.publishOnly = false;
    } else if (this._hasMCU) {
      peerInfo.config.receiveOnly = false;
      peerInfo.config.publishOnly = true;
    }

    // If there is Peer ID (not broadcast ENTER message) and Peer is Edge browser and User is not
    if (window.webrtcDetectedBrowser !== 'edge' && peerInfo.agent.name === 'edge' ?
    // If User is IE/safari and does not have H264 support, remove video support
      ['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1 && !this._currentCodecSupport.video.h264 :
    // If User is Edge and Peer is not and no H264 support, remove video support
      window.webrtcDetectedBrowser === 'edge' && peerInfo.agent.name !== 'edge' && !this._currentCodecSupport.video.h264) {
      peerInfo.settings.video = false;
      peerInfo.mediaStatus.videoMuted = true;
    }

  } else {
    peerInfo = {
      userData: UtilsFactory.clone(this._userData),
      settings: {
        audio: false,
        video: false
      },
      mediaStatus: UtilsFactory.clone(this._streamsMutedSettings),
      agent: {
        name: window.webrtcDetectedBrowser,
        version: window.webrtcDetectedVersion,
        os: window.navigator.platform,
        pluginVersion: AdapterJS.WebRTCPlugin.plugin ? AdapterJS.WebRTCPlugin.plugin.VERSION : null,
        SMProtocolVersion: this.SMProtocolVersion,
        DTProtocolVersion: this.DTProtocolVersion
      },
      room: UtilsFactory.clone(this._selectedRoom),
      config: {
        enableDataChannel: this._enableDataChannel,
        enableIceTrickle: this._enableIceTrickle,
        enableIceRestart: this._enableIceRestart,
        priorityWeight: this._peerPriorityWeight,
        receiveOnly: false,
        publishOnly: !!this._publishOnly
      }
    };

    if (!(peerInfo.userData !== null && typeof peerInfo.userData !== 'undefined')) {
      peerInfo.userData = '';
    }

    if (this._streams.screenshare) {
      peerInfo.settings = UtilsFactory.clone(this._streams.screenshare.settings);
    } else if (this._streams.userMedia) {
      peerInfo.settings = UtilsFactory.clone(this._streams.userMedia.settings);
    }

    peerInfo.settings.bandwidth = UtilsFactory.clone(this._streamsBandwidthSettings.bAS);
    peerInfo.settings.googleXBandwidth = UtilsFactory.clone(this._streamsBandwidthSettings.googleX);
    peerInfo.parentId = this._parentId ? this._parentId : null;
    peerInfo.config.receiveOnly = !peerInfo.settings.video && !peerInfo.settings.audio;
  }

  if (!peerInfo.settings.audio) {
    peerInfo.mediaStatus.audioMuted = true;
  }

  if (!peerInfo.settings.video) {
    peerInfo.mediaStatus.videoMuted = true;
  }

  if (!peerInfo.settings.audio && !peerInfo.settings.video) {
    peerInfo.config.receiveOnly = true;
    peerInfo.config.publishOnly = false;
  }

  return peerInfo;
};
Skylink.prototype.getPeers = function(showAll, callback){
	var self = this;
	if (!self._isPrivileged){
		Log.warn(self._debugOptions.instanceId, 'Please upgrade your key to privileged to use this function');
		return;
	}
	if (!self._appKey){
		Log.warn(self._debugOptions.instanceId, 'App key is not defined. Please authenticate again.');
		return;
	}

	// Only callback is provided
	if (typeof showAll === 'function'){
		callback = showAll;
		showAll = false;
	}

	self._sendChannelMessage({
		type: self._SIG_MESSAGE_TYPE.GET_PEERS,
		showAll: showAll || false
	});

	self._trigger('getPeersStateChange',self.GET_PEERS_STATE.ENQUIRED, self._user.sid, null);

	Log.log(self._debugOptions.instanceId, 'Enquired server for peers within the realm');

	if (typeof callback === 'function'){
		self.once('getPeersStateChange', function(state, privilegedPeerId, peerList){
			callback(null, peerList);
		}, function(state, privilegedPeerId, peerList){
			return state === self.GET_PEERS_STATE.RECEIVED;
		});
	}

};
Skylink.prototype.getPeersInRoom = function() {
  var listOfPeersInfo = {};
  var listOfPeers = Object.keys(this._peerInformations);

  for (var i = 0; i < listOfPeers.length; i++) {
    listOfPeersInfo[listOfPeers[i]] = UtilsFactory.clone(this.getPeerInfo(listOfPeers[i]));
    listOfPeersInfo[listOfPeers[i]].isSelf = false;
  }

  if (this._user && this._user.sid) {
    listOfPeersInfo[this._user.sid] = UtilsFactory.clone(this.getPeerInfo());
    listOfPeersInfo[this._user.sid].isSelf = true;
  }

  return listOfPeersInfo;
};
Skylink.prototype.getPeersStream = function() {
  var listOfPeersStreams = {};
  var listOfPeers = Object.keys(this._peerConnections);

  for (var i = 0; i < listOfPeers.length; i++) {
    var stream = null;

    if (this._peerConnections[listOfPeers[i]] &&
      this._peerConnections[listOfPeers[i]].remoteDescription &&
      this._peerConnections[listOfPeers[i]].remoteDescription.sdp &&
      (this._sdpSettings.direction.audio.receive || this._sdpSettings.direction.video.receive)) {
      var streams = this._peerConnections[listOfPeers[i]].getRemoteStreams();

      for (var j = 0; j < streams.length; j++) {
        if (this._peerConnections[listOfPeers[i]].remoteDescription.sdp.indexOf(
          'msid:' + (streams[j].id || streams[j].label)) > 0) {
          stream = streams[j];
          break;
        }
      }
    }

    listOfPeersStreams[listOfPeers[i]] = {
      streamId: stream ? stream.id || stream.label || null : null,
      stream: stream,
      isSelf: false
    };
  }

  if (this._user && this._user.sid) {
    var selfStream = null;

    if (this._streams.screenshare && this._streams.screenshare.stream) {
      selfStream = this._streams.screenshare.stream;
    } else if (this._streams.userMedia && this._streams.userMedia.stream) {
      selfStream = this._streams.userMedia.stream;
    }

    listOfPeersStreams[this._user.sid] = {
      streamId: selfStream ? selfStream.id || selfStream.label || null : null,
      stream: selfStream,
      isSelf: true
    };
  }

  return listOfPeersStreams;
};
Skylink.prototype.getRecordings = function () {
  return UtilsFactory.clone(this._recordings);
};
Skylink.prototype.getUserData = function(peerId) {
  if (peerId && this._peerInformations[peerId]) {
    var userData = this._peerInformations[peerId].userData;
    if (!(userData !== null && typeof userData === 'undefined')) {
      userData = '';
    }
    return userData;
  }
  return this._userData;
};
Skylink.prototype.getUserMedia = function(options,callback) {
  var self = this;

  if (typeof options === 'function'){
    callback = options;
    options = {
      audio: true,
      video: true
    };

  } else if (typeof options !== 'object' || options === null) {
    if (typeof options === 'undefined') {
      options = {
        audio: true,
        video: true
      };

    } else {
      var invalidOptionsError = 'Please provide a valid options';
      Log.error(self._debugOptions.instanceId, invalidOptionsError, options);
      if (typeof callback === 'function') {
        callback(new Error(invalidOptionsError), null);
      }
      return;
    }

  } else if (!options.audio && !options.video) {
    var noConstraintOptionsSelectedError = 'Please select audio or video';
    Log.error(self._debugOptions.instanceId, noConstraintOptionsSelectedError, options);
    if (typeof callback === 'function') {
      callback(new Error(noConstraintOptionsSelectedError), null);
    }
    return;
  }

  /*if (window.location.protocol !== 'https:' && window.webrtcDetectedBrowser === 'chrome' &&
    window.webrtcDetectedVersion > 46) {
    errorMsg = 'getUserMedia() has to be called in https:// application';
    Log.error(errorMsg, options);
    if (typeof callback === 'function') {
      callback(new Error(errorMsg), null);
    }
    return;
  }*/

  self._throttle(function (runFn) {
    if (!runFn) {
      if (self._throttlingShouldThrowError) {
        var throttleLimitError = 'Unable to run as throttle interval has not reached (' + self._throttlingTimeouts.getUserMedia + 'ms).';
        Log.error(self._debugOptions.instanceId, throttleLimitError);

        if (typeof callback === 'function') {
          callback(new Error(throttleLimitError), null);
        }
      }
      return;
    }

    if (typeof callback === 'function') {
      var mediaAccessSuccessFn = function (stream) {
        self.off('mediaAccessError', mediaAccessErrorFn);
        callback(null, stream);
      };
      var mediaAccessErrorFn = function (error) {
        self.off('mediaAccessSuccess', mediaAccessSuccessFn);
        callback(error, null);
      };

      self.once('mediaAccessSuccess', mediaAccessSuccessFn, function (stream, isScreensharing) {
        return !isScreensharing;
      });

      self.once('mediaAccessError', mediaAccessErrorFn, function (error, isScreensharing) {
        return !isScreensharing;
      });
    }

    // Parse stream settings
    var settings = self._parseStreamSettings(options);

    navigator.getUserMedia(settings.getUserMediaSettings, function (stream) {
      if (settings.mutedSettings.shouldAudioMuted) {
        self._streamsMutedSettings.audioMuted = true;
      }

      if (settings.mutedSettings.shouldVideoMuted) {
        self._streamsMutedSettings.videoMuted = true;
      }

      self._onStreamAccessSuccess(stream, settings, false, false);

    }, function (error) {
      self._onStreamAccessError(error, settings, false, false);
    });
  }, 'getUserMedia', self._throttlingTimeouts.getUserMedia);
};
Skylink.prototype.init = function(options, callback) {
  var self = this;

  if (typeof options === 'function'){
    callback = options;
    options = undefined;
  }

  if (!options) {
    var error = 'No API key provided';
    Log.error(self._debugOptions.instanceId, error);
    if (typeof callback === 'function'){
      callback(error,null);
    }
    return;
  }

  var appKey, room, defaultRoom;
  var startDateTime, duration, credentials;
  var roomServer = self._roomServer;
  // NOTE: Should we get all the default values from the variables
  // rather than setting it?
  var enableIceTrickle = true;
  var enableDataChannel = true;
  var enableSTUNServer = true;
  var enableTURNServer = true;
  var TURNTransport = self.TURN_TRANSPORT.ANY;
  var audioFallback = false;
  var forceSSL = false;
  var socketTimeout = 20000;
  var forceTURNSSL = false;
  var audioCodec = self.AUDIO_CODEC.AUTO;
  var videoCodec = self.VIDEO_CODEC.AUTO;
  var forceTURN = false;
  var usePublicSTUN = true;
  var disableVideoFecCodecs = false;
  var disableComfortNoiseCodec = false;
  var disableREMB = false;
  var filterCandidatesType = {
    host: false,
    srflx: false,
    relay: false
  };
  var throttleIntervals = {
    shareScreen: 10000,
    refreshConnection: 5000,
    getUserMedia: 0
  };
  var throttleShouldThrowError = false;
  var mcuUseRenegoRestart = false;
  var iceServer = null;
  var socketServer = null;

  Log.log(self._debugOptions.instanceId, 'Provided init options:', options);

  if (typeof options === 'string') {
    // set all the default api key, default room and room
    appKey = options;
    defaultRoom = appKey;
    room = appKey;
  } else {
    // set the api key
    appKey = options.appKey || options.apiKey;
    // set the room server
    roomServer = (typeof options.roomServer === 'string') ?
      options.roomServer : roomServer;
    // check room server if it ends with /. Remove the extra /
    roomServer = (roomServer.lastIndexOf('/') ===
      (roomServer.length - 1)) ? roomServer.substring(0,
      roomServer.length - 1) : roomServer;
    // set the default room
    defaultRoom = (typeof options.defaultRoom === 'string' && options.defaultRoom) ?
      options.defaultRoom : appKey;
    // set the selected room
    room = defaultRoom;
    // set ice trickle option
    enableIceTrickle = (typeof options.enableIceTrickle === 'boolean') ?
      options.enableIceTrickle : enableIceTrickle;
    // set data channel option
    enableDataChannel = (typeof options.enableDataChannel === 'boolean') ?
      options.enableDataChannel : enableDataChannel;
    // set stun server option
    enableSTUNServer = (typeof options.enableSTUNServer === 'boolean') ?
      options.enableSTUNServer : enableSTUNServer;
    // set turn server option
    enableTURNServer = (typeof options.enableTURNServer === 'boolean') ?
      options.enableTURNServer : enableTURNServer;
    // set the force ssl always option
    forceSSL = (typeof options.forceSSL === 'boolean') ?
      options.forceSSL : forceSSL;
    // set the socket timeout option
    socketTimeout = (typeof options.socketTimeout === 'number') ?
      options.socketTimeout : socketTimeout;
    // set the socket timeout option to be above 5000
    socketTimeout = (socketTimeout < 5000) ? 5000 : socketTimeout;
    // set the force turn ssl always option
    forceTURNSSL = (typeof options.forceTURNSSL === 'boolean') ?
      options.forceTURNSSL : forceTURNSSL;
    // set the preferred audio codec
    audioCodec = typeof options.audioCodec === 'string' ?
      options.audioCodec : audioCodec;
    // set the preferred video codec
    videoCodec = typeof options.videoCodec === 'string' ?
      options.videoCodec : videoCodec;
    // set the force turn server option
    forceTURN = (typeof options.forceTURN === 'boolean') ?
      options.forceTURN : forceTURN;
    // set the use public stun option
    usePublicSTUN = (typeof options.usePublicSTUN === 'boolean') ?
      options.usePublicSTUN : usePublicSTUN;
    // set the use of disabling ulpfec and red codecs
    disableVideoFecCodecs = (typeof options.disableVideoFecCodecs === 'boolean') ?
      options.disableVideoFecCodecs : disableVideoFecCodecs;
    // set the use of disabling CN codecs
    disableComfortNoiseCodec = (typeof options.disableComfortNoiseCodec === 'boolean') ?
      options.disableComfortNoiseCodec : disableComfortNoiseCodec;
    // set the use of disabling REMB packets
    disableREMB = (typeof options.disableREMB === 'boolean') ?
      options.disableREMB : disableREMB;
    // set the flag if throttling should throw error when called less than the interval timeout configured
    throttleShouldThrowError = (typeof options.throttleShouldThrowError === 'boolean') ?
      options.throttleShouldThrowError : throttleShouldThrowError;
    // set the flag if MCU refreshConnection() should use renegotiation
    mcuUseRenegoRestart = (typeof options.mcuUseRenegoRestart === 'boolean') ?
      options.mcuUseRenegoRestart : mcuUseRenegoRestart;
    // set the TURN/STUN ICE server url for debugging purposes
    iceServer = (options.iceServer && typeof options.iceServer === 'string') ?
      options.iceServer : iceServer;
    // set the Signaling server url for debugging purposes
    socketServer = (options.socketServer && typeof options.socketServer === 'string') ?
      options.socketServer : socketServer;
    // set the flag if MCU refreshConnection() should use renegotiation
    mcuUseRenegoRestart = (typeof options.mcuUseRenegoRestart === 'boolean') ?
      options.mcuUseRenegoRestart : mcuUseRenegoRestart;
    // set the use of filtering ICE candidates
    if (typeof options.filterCandidatesType === 'object' && options.filterCandidatesType) {
      filterCandidatesType.host = (typeof options.filterCandidatesType.host === 'boolean') ?
        options.filterCandidatesType.host : filterCandidatesType.host;
      filterCandidatesType.srflx = (typeof options.filterCandidatesType.srflx === 'boolean') ?
        options.filterCandidatesType.srflx : filterCandidatesType.srflx;
      filterCandidatesType.relay = (typeof options.filterCandidatesType.relay === 'boolean') ?
        options.filterCandidatesType.relay : filterCandidatesType.relay;
    }
    // set the use of throttling interval timeouts
    if (typeof options.throttleIntervals === 'object' && options.throttleIntervals) {
      throttleIntervals.shareScreen = (typeof options.throttleIntervals.shareScreen === 'number') ?
        options.throttleIntervals.shareScreen : throttleIntervals.shareScreen;
      throttleIntervals.refreshConnection = (typeof options.throttleIntervals.refreshConnection === 'number') ?
        options.throttleIntervals.refreshConnection : throttleIntervals.refreshConnection;
      throttleIntervals.getUserMedia = (typeof options.throttleIntervals.getUserMedia === 'number') ?
        options.throttleIntervals.getUserMedia : throttleIntervals.getUserMedia;
    }

    // set turn transport option
    if (typeof options.TURNServerTransport === 'string') {
      // loop out for every transport option
      for (var type in self.TURN_TRANSPORT) {
        if (self.TURN_TRANSPORT.hasOwnProperty(type)) {
          // do a check if the transport option is valid
          if (self.TURN_TRANSPORT[type] === options.TURNServerTransport) {
            TURNTransport = options.TURNServerTransport;
            break;
          }
        }
      }
    }
    // set audio fallback option
    audioFallback = options.audioFallback || audioFallback;
    // Custom default meeting timing and duration
    // Fallback to default if no duration or startDateTime provided
    if (options.credentials &&
      typeof options.credentials.credentials === 'string' &&
      typeof options.credentials.duration === 'number' &&
      typeof options.credentials.startDateTime === 'string') {
      // set start data time
      startDateTime = options.credentials.startDateTime;
      // set the duration
      duration = options.credentials.duration;
      // set the credentials
      credentials = options.credentials.credentials;
    }

    // if force turn option is set to on
    if (forceTURN === true) {
      enableTURNServer = true;
      enableSTUNServer = false;
      filterCandidatesType.host = true;
      filterCandidatesType.srflx = true;
      filterCandidatesType.relay = false;
    }
  }

  if (window.webrtcDetectedBrowser === 'edge') {
    enableSTUNServer = false;
    forceTURNSSL = false;
    TURNTransport = self.TURN_TRANSPORT.UDP;
    audioCodec = self.AUDIO_CODEC.OPUS;
    videoCodec = self.VIDEO_CODEC.H264;
    enableDataChannel = false;
  }

  // api key path options
  self._appKey = appKey;
  self._roomServer = roomServer;
  self._defaultRoom = defaultRoom;
  self._selectedRoom = room;
  self._path = roomServer + '/api/' + appKey + '/' + room;
  // set credentials if there is
  if (credentials && startDateTime && duration) {
    self._roomStart = startDateTime;
    self._roomDuration = duration;
    self._roomCredentials = credentials;
    self._path += (credentials) ? ('/' + startDateTime + '/' +
      duration + '?&cred=' + credentials) : '';
  }

  self._path += ((credentials) ? '&' : '?') + 'rand=' + (new Date()).toISOString();

  // skylink functionality options
  self._enableIceTrickle = enableIceTrickle;
  self._enableDataChannel = enableDataChannel;
  self._enableSTUN = enableSTUNServer;
  self._enableTURN = enableTURNServer;
  self._TURNTransport = TURNTransport;
  self._audioFallback = audioFallback;
  self._forceSSL = forceSSL;
  self._socketTimeout = socketTimeout;
  self._forceTURNSSL = forceTURNSSL;
  self._selectedAudioCodec = audioCodec;
  self._selectedVideoCodec = videoCodec;
  self._forceTURN = forceTURN;
  self._usePublicSTUN = usePublicSTUN;
  self._disableVideoFecCodecs = disableVideoFecCodecs;
  self._disableComfortNoiseCodec = disableComfortNoiseCodec;
  self._filterCandidatesType = filterCandidatesType;
  self._throttlingTimeouts = throttleIntervals;
  self._throttlingShouldThrowError = throttleShouldThrowError;
  self._disableREMB = disableREMB;
  self._mcuUseRenegoRestart = mcuUseRenegoRestart;
  self._turnServer = iceServer;
  self._socketServer = socketServer;

  Log.log(self._debugOptions.instanceId, 'Init configuration:', {
    serverUrl: self._path,
    readyState: self._readyState,
    appKey: self._appKey,
    roomServer: self._roomServer,
    defaultRoom: self._defaultRoom,
    selectedRoom: self._selectedRoom,
    enableDataChannel: self._enableDataChannel,
    enableIceTrickle: self._enableIceTrickle,
    enableTURNServer: self._enableTURN,
    enableSTUNServer: self._enableSTUN,
    TURNTransport: self._TURNTransport,
    audioFallback: self._audioFallback,
    forceSSL: self._forceSSL,
    socketTimeout: self._socketTimeout,
    forceTURNSSL: self._forceTURNSSL,
    audioCodec: self._selectedAudioCodec,
    videoCodec: self._selectedVideoCodec,
    forceTURN: self._forceTURN,
    usePublicSTUN: self._usePublicSTUN,
    disableVideoFecCodecs: self._disableVideoFecCodecs,
    disableComfortNoiseCodec: self._disableComfortNoiseCodec,
    disableREMB: self._disableREMB,
    filterCandidatesType: self._filterCandidatesType,
    throttleIntervals: self._throttlingTimeouts,
    throttleShouldThrowError: self._throttlingShouldThrowError,
    mcuUseRenegoRestart: self._mcuUseRenegoRestart,
    iceServer: self._turnServer,
    socketServer: self._socketServer
  });
  // trigger the readystate
  self._readyState = 0;
  self._trigger('readyStateChange', self.READY_STATE_CHANGE.INIT, null, self._selectedRoom);

  if (typeof callback === 'function'){
    var hasTriggered = false;

    var readyStateChangeFn = function (readyState, error) {
      if (!hasTriggered) {
        if (readyState === self.READY_STATE_CHANGE.COMPLETED) {
          Log.log(self._debugOptions.instanceId, [null, 'Socket', null, 'Firing callback. ' +
          'Ready state change has met provided state ->'], readyState);
          hasTriggered = true;
          self.off('readyStateChange', readyStateChangeFn);
          callback(null,{
            serverUrl: self._path,
            readyState: self._readyState,
            appKey: self._appKey,
            roomServer: self._roomServer,
            defaultRoom: self._defaultRoom,
            selectedRoom: self._selectedRoom,
            enableDataChannel: self._enableDataChannel,
            enableIceTrickle: self._enableIceTrickle,
            enableTURNServer: self._enableTURN,
            enableSTUNServer: self._enableSTUN,
            TURNTransport: self._TURNTransport,
            audioFallback: self._audioFallback,
            forceSSL: self._forceSSL,
            socketTimeout: self._socketTimeout,
            forceTURNSSL: self._forceTURNSSL,
            audioCodec: self._selectedAudioCodec,
            videoCodec: self._selectedVideoCodec,
            forceTURN: self._forceTURN,
            usePublicSTUN: self._usePublicSTUN,
            disableVideoFecCodecs: self._disableVideoFecCodecs,
            disableComfortNoiseCodec: self._disableComfortNoiseCodec,
            disableREMB: self._disableREMB,
            filterCandidatesType: self._filterCandidatesType,
            throttleIntervals: self._throttlingTimeouts,
            throttleShouldThrowError: self._throttlingShouldThrowError,
            mcuUseRenegoRestart: self._mcuUseRenegoRestart,
            iceServer: self._turnServer,
            socketServer: self._socketServer
          });
        } else if (readyState === self.READY_STATE_CHANGE.ERROR) {
          Log.log(self._debugOptions.instanceId, [null, 'Socket', null, 'Firing callback. ' +
            'Ready state change has met provided state ->'], readyState);
          Log.debug(self._debugOptions.instanceId, [null, 'Socket', null, 'Ready state met failure'], error);
          hasTriggered = true;
          self.off('readyStateChange', readyStateChangeFn);
          callback({
            error: new Error(error),
            errorCode: error.errorCode,
            status: error.status
          },null);
        }
      }
    };

    self.on('readyStateChange', readyStateChangeFn);
  }

  self._loadInfo();
};
Skylink.prototype.introducePeer = function(sendingPeerId, receivingPeerId){
	var self = this;
	if (!self._isPrivileged){
		Log.warn(self._debugOptions.instanceId, 'Please upgrade your key to privileged to use this function');
		self._trigger('introduceStateChange', self.INTRODUCE_STATE.ERROR, self._user.sid, sendingPeerId, receivingPeerId, 'notPrivileged');
		return;
	}
	self._sendChannelMessage({
		type: self._SIG_MESSAGE_TYPE.INTRODUCE,
		sendingPeerId: sendingPeerId,
		receivingPeerId: receivingPeerId
	});
	self._trigger('introduceStateChange', self.INTRODUCE_STATE.INTRODUCING, self._user.sid, sendingPeerId, receivingPeerId, null);
	Log.log(self._debugOptions.instanceId, 'Introducing',sendingPeerId,'to',receivingPeerId);
};
Skylink.prototype.joinRoom = function(room, options, callback) {
  var self = this;
  var selectedRoom = self._defaultRoom;
  var previousRoom = self._selectedRoom;
  var mediaOptions = {};

  if (room && typeof room === 'string') {
    selectedRoom = room;
  } else if (room && typeof room === 'object') {
    mediaOptions = room;
  } else if (typeof room === 'function') {
    callback = room;
  }

  if (options && typeof options === 'object') {
    mediaOptions = options;
  } else if (typeof options === 'function') {
    callback = options;
  }

  var resolveAsErrorFn = function (error, tryRoom, readyState) {
    Log.error(self._debugOptions.instanceId, error);

    if (typeof callback === 'function') {
      callback({
        room: tryRoom,
        errorCode: readyState || null,
        error: typeof error === 'string' ? new Error(error) : error
      });
    }
  };

  var joinRoomFn = function () {
    self._initSelectedRoom(selectedRoom, function(initError, initSuccess) {
      if (initError) {
        resolveAsErrorFn(initError.error, self._selectedRoom, self._readyState);
        return;
      }

      self._waitForOpenChannel(mediaOptions, function (error, success) {
        if (error) {
          resolveAsErrorFn(error, self._selectedRoom, self._readyState);
          return;
        }

        self.once('peerJoined', function(peerId, peerInfo, isSelf) {
          if (typeof callback === 'function') {
            Log.info(self._debugOptions.instanceId, [null, 'Room', selectedRoom, 'Connected to Room ->'], peerInfo);

            callback(null, {
              room: self._selectedRoom,
              peerId: peerId,
              peerInfo: peerInfo
            });
          }
        }, function(peerId, peerInfo, isSelf) {
          return peerInfo.room === selectedRoom && isSelf;
        });

        self._sendChannelMessage({
          type: self._SIG_MESSAGE_TYPE.JOIN_ROOM,
          uid: self._user.uid,
          cid: self._key,
          rid: self._room.id,
          userCred: self._user.token,
          timeStamp: self._user.timeStamp,
          apiOwner: self._appKeyOwner,
          roomCred: self._room.token,
          start: self._room.startDateTime,
          len: self._room.duration,
          isPrivileged: self._isPrivileged === true, // Default to false if undefined
          autoIntroduce: self._autoIntroduce !== false, // Default to true if undefined
          key: self._appKey
        });
      });
    });
  };

  if (room === null || ['number', 'boolean'].indexOf(typeof room) > -1) {
    resolveAsErrorFn('Invalid room name is provided', room);
    return;
  }

  if (options === null || ['number', 'boolean'].indexOf(typeof options) > -1) {
    resolveAsErrorFn('Invalid mediaOptions is provided', selectedRoom);
    return;
  }

  if (self._inRoom) {
    var stopStream = mediaOptions.audio === false && mediaOptions.video === false;

    self.leaveRoom(stopStream, function (lRError, lRSuccess) {
      Log.debug(self._debugOptions.instanceId, [null, 'Room', previousRoom, 'Leave Room callback result ->'], [lRError, lRSuccess]);
      joinRoomFn();
    });
  } else {
    joinRoomFn();
  }
};
Skylink.prototype.leaveRoom = function(stopMediaOptions, callback) {
  var self = this;
  var stopUserMedia = true;
  var stopScreenshare = true;
  var previousRoom = self._selectedRoom;
  var previousUserPeerId = self._user ? self._user.sid : null;
  var peersThatLeft = [];
  var isNotInRoom = !self._inRoom;

  if (typeof stopMediaOptions === 'boolean') {
    if (stopMediaOptions === false) {
      stopUserMedia = false;
      stopScreenshare = false;
    }
  } else if (stopMediaOptions && typeof stopMediaOptions === 'object') {
    stopUserMedia = stopMediaOptions.userMedia !== false;
    stopScreenshare = stopMediaOptions.screenshare !== false;
  } else if (typeof stopMediaOptions === 'function') {
    callback = stopMediaOptions;
  }

  for (var infoPeerId in self._peerInformations) {
    if (self._peerInformations.hasOwnProperty(infoPeerId) && self._peerInformations[infoPeerId]) {
      peersThatLeft.push(infoPeerId);
      self._removePeer(infoPeerId);
    }
  }

  for (var connPeerId in self._peerConnections) {
    if (self._peerConnections.hasOwnProperty(connPeerId) && self._peerConnections[connPeerId]) {
      if (peersThatLeft.indexOf(connPeerId) === -1) {
        peersThatLeft.push(connPeerId);
        self._removePeer(connPeerId);
      }
    }
  }

  self._inRoom = false;
  self._closeChannel();

  if (isNotInRoom) {
    var notInRoomError = 'Unable to leave room as user is not in any room';
    Log.error(self._debugOptions.instanceId, [null, 'Room', previousRoom, notInRoomError]);

    if (typeof callback === 'function') {
      callback(new Error(notInRoomError), null);
    }
    return;
  }

  self._stopStreams({
    userMedia: stopUserMedia,
    screenshare: stopScreenshare
  });

  self._wait(function () {
    Log.log(self._debugOptions.instanceId, [null, 'Room', previousRoom, 'User left the room']);

    self._trigger('peerLeft', previousUserPeerId, self.getPeerInfo(), true);

    if (typeof callback === 'function') {
      callback(null, {
        peerId: previousUserPeerId,
        previousRoom: previousRoom
      });
    }
  }, function () {
    return !self._channelOpen;
  });
};
Skylink.prototype.lockRoom = function() {
  if (!(this._user && this._user.sid)) {
    return;
  }
  Log.log(this._debugOptions.instanceId, 'Update to isRoomLocked status ->', true);
  this._sendChannelMessage({
    type: this._SIG_MESSAGE_TYPE.ROOM_LOCK,
    mid: this._user.sid,
    rid: this._room.id,
    lock: true
  });
  this._roomLocked = true;
  this._trigger('roomLock', true, this._user.sid, this.getPeerInfo(), true);
};
Skylink.prototype.muteStream = function(options) {
  var self = this;

  if (typeof options !== 'object') {
    Log.error(self._debugOptions.instanceId, 'Provided settings is not an object');
    return;
  }

  if (!(self._streams.userMedia && self._streams.userMedia.stream) &&
    !(self._streams.screenshare && self._streams.screenshare.stream)) {
    Log.warn(self._debugOptions.instanceId, 'No streams are available to mute / unmute!');
    return;
  }

  var audioMuted = typeof options.audioMuted === 'boolean' ? options.audioMuted : true;
  var videoMuted = typeof options.videoMuted === 'boolean' ? options.videoMuted : true;
  var hasToggledAudio = false;
  var hasToggledVideo = false;

  if (self._streamsMutedSettings.audioMuted !== audioMuted) {
    self._streamsMutedSettings.audioMuted = audioMuted;
    hasToggledAudio = true;
  }

  if (self._streamsMutedSettings.videoMuted !== videoMuted) {
    self._streamsMutedSettings.videoMuted = videoMuted;
    hasToggledVideo = true;
  }

  if (hasToggledVideo || hasToggledAudio) {
    var streamTracksAvailability = self._muteStreams();

    if (hasToggledVideo && self._inRoom) {
      self._sendChannelMessage({
        type: self._SIG_MESSAGE_TYPE.MUTE_VIDEO,
        mid: self._user.sid,
        rid: self._room.id,
        muted: self._streamsMutedSettings.videoMuted,
        stamp: (new Date()).getTime()
      });
    }

    if (hasToggledAudio && self._inRoom) {
      setTimeout(function () {
        self._sendChannelMessage({
          type: self._SIG_MESSAGE_TYPE.MUTE_AUDIO,
          mid: self._user.sid,
          rid: self._room.id,
          muted: self._streamsMutedSettings.audioMuted,
          stamp: (new Date()).getTime()
        });
      }, hasToggledVideo ? 1050 : 0);
    }

    if ((streamTracksAvailability.hasVideo && hasToggledVideo) ||
      (streamTracksAvailability.hasAudio && hasToggledAudio)) {

      self._trigger('localMediaMuted', {
        audioMuted: streamTracksAvailability.hasAudio ? self._streamsMutedSettings.audioMuted : true,
        videoMuted: streamTracksAvailability.hasVideo ? self._streamsMutedSettings.videoMuted : true
      });

      if (self._inRoom) {
        self._trigger('streamMuted', self._user.sid, self.getPeerInfo(), true,
          self._streams.screenshare && self._streams.screenshare.stream);
        self._trigger('peerUpdated', self._user.sid, self.getPeerInfo(), true);
      }
    }
  }
};
Skylink.prototype.off = function(eventName, callback) {
  if (!(eventName && typeof eventName === 'string')) {
    this._EVENTS = {};
    this._onceEvents = {};
  } else {
    if (callback === undefined) {
      this._EVENTS[eventName] = [];
      this._onceEvents[eventName] = [];
      Log.log(this._debugOptions.instanceId, [null, 'Event', eventName, 'All events are unsubscribed']);
      return;
    }
    var arr = this._EVENTS[eventName];
    var once = this._onceEvents[eventName];

    // unsubscribe events that is triggered always
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] === callback) {
        Log.log(this._debugOptions.instanceId, [null, 'Event', eventName, 'Event is unsubscribed']);
        arr.splice(i, 1);
        break;
      }
    }
    // unsubscribe events fired only once
    if(once !== undefined) {
      for (var j = 0; j < once.length; j++) {
        if (once[j][0] === callback) {
          Log.log(this._debugOptions.instanceId, [null, 'Event', eventName, 'One-time Event is unsubscribed']);
          once.splice(j, 1);
          break;
        }
      }
    }
  }
};
Skylink.prototype.on = function(eventName, callback) {
  if ('function' === typeof callback) {
    this._EVENTS[eventName] = this._EVENTS[eventName] || [];
    this._EVENTS[eventName].push(callback);
    Log.log(this._debugOptions.instanceId, [null, 'Event', eventName, 'Event is subscribed']);
  } else {
    Log.error(this._debugOptions.instanceId, [null, 'Event', eventName, 'Provided parameter is not a function']);
  }
};
Skylink.prototype.once = function(eventName, callback, condition, fireAlways) {
  if (typeof condition === 'boolean') {
    fireAlways = condition;
    condition = null;
  }
  fireAlways = (typeof fireAlways === 'undefined' ? false : fireAlways);
  condition = (typeof condition !== 'function') ? function () {
    return true;
  } : condition;

  if (typeof callback === 'function') {
    this._onceEvents[eventName] = this._onceEvents[eventName] || [];
    this._onceEvents[eventName].push([callback, condition, fireAlways]);
    Log.log(this._debugOptions.instanceId, [null, 'Event', eventName, 'Event is subscribed on condition']);
  } else {
    Log.error(this._debugOptions.instanceId, [null, 'Event', eventName, 'Provided callback is not a function']);
  }
};
Skylink.prototype.refreshConnection = function(targetPeerId, iceRestart, callback) {
  var self = this;

  var listOfPeers = Object.keys(self._peerConnections);
  var doIceRestart = false;

  if(Array.isArray(targetPeerId)) {
    listOfPeers = targetPeerId;
  } else if (typeof targetPeerId === 'string') {
    listOfPeers = [targetPeerId];
  } else if (typeof targetPeerId === 'boolean') {
    doIceRestart = targetPeerId;
  } else if (typeof targetPeerId === 'function') {
    callback = targetPeerId;
  }

  if (typeof iceRestart === 'boolean') {
    doIceRestart = iceRestart;
  } else if (typeof iceRestart === 'function') {
    callback = iceRestart;
  }

  var emitErrorForPeersFn = function (error) {
    Log.error(self._debugOptions.instanceId, error);

    if (typeof callback === 'function') {
      var listOfPeerErrors = {};

      if (listOfPeers.length === 0) {
        listOfPeerErrors.self = new Error(error);
      } else {
        for (var i = 0; i < listOfPeers.length; i++) {
          listOfPeerErrors[listOfPeers[i]] = new Error(error);
        }
      }

      callback({
        refreshErrors: listOfPeerRestartErrors,
        listOfPeers: listOfPeers
      }, null);
    }
  };

  if (listOfPeers.length === 0 && !(self._hasMCU && !self._mcuUseRenegoRestart)) {
    emitErrorForPeersFn('There is currently no peer connections to restart');
    return;
  }

  if (window.webrtcDetectedBrowser === 'edge') {
    emitErrorForPeersFn('Edge browser currently does not support renegotiation.');
    return;
  }

  self._throttle(function (runFn) {
    if (!runFn && self._hasMCU && !self._mcuUseRenegoRestart) {
      if (self._throttlingShouldThrowError) {
        emitErrorForPeersFn('Unable to run as throttle interval has not reached (' + self._throttlingTimeouts.refreshConnection + 'ms).');
      }
      return;
    }
    self._refreshPeerConnection(listOfPeers, doIceRestart, callback);
  }, 'refreshConnection', self._throttlingTimeouts.refreshConnection);

};
Skylink.prototype.sendBlobData = function(data, timeout, targetPeerId, sendChunksAsBinary, callback) {
  this._startDataTransfer(data, timeout, targetPeerId, sendChunksAsBinary, callback, 'blob');
};
Skylink.prototype.sendMessage = function(message, targetPeerId) {
  var listOfPeers = Object.keys(this._peerInformations);
  var isPrivate = false;

  if (Array.isArray(targetPeerId)) {
    listOfPeers = targetPeerId;
    isPrivate = true;
  } else if (targetPeerId && typeof targetPeerId === 'string') {
    listOfPeers = [targetPeerId];
    isPrivate = true;
  }

  if (!this._inRoom || !this._socket || !this._user) {
    Log.error(this._debugOptions.instanceId, 'Unable to send message as User is not in Room. ->', message);
    return;
  }

  // Loop out unwanted Peers
  for (var i = 0; i < listOfPeers.length; i++) {
    var peerId = listOfPeers[i];

    if (!this._peerInformations[peerId]) {
      Log.error(this._debugOptions.instanceId, [peerId, 'Socket', null, 'Dropping of sending message to Peer as ' +
        'Peer session does not exists']);
      listOfPeers.splice(i, 1);
      i--;
    } else if (peerId === 'MCU') {
      listOfPeers.splice(i, 1);
      i--;
    } else if (isPrivate) {
      Log.debug(this._debugOptions.instanceId, [peerId, 'Socket', null, 'Sending private message to Peer']);

      this._sendChannelMessage({
        cid: this._key,
        data: message,
        mid: this._user.sid,
        rid: this._room.id,
        target: peerId,
        type: this._SIG_MESSAGE_TYPE.PRIVATE_MESSAGE
      });
    }
  }

  if (listOfPeers.length === 0) {
    Log.warn(this._debugOptions.instanceId, 'Currently there are no Peers to send message to (unless the message is queued and ' +
      'there are Peer connected by then).');
  }

  if (!isPrivate) {
    Log.debug(this._debugOptions.instanceId, [null, 'Socket', null, 'Broadcasting message to Peers']);

    this._sendChannelMessage({
      cid: this._key,
      data: message,
      mid: this._user.sid,
      rid: this._room.id,
      type: this._SIG_MESSAGE_TYPE.PUBLIC_MESSAGE
    });
  } else {
    this._trigger('incomingMessage', {
      content: message,
      isPrivate: isPrivate,
      targetPeerId: targetPeerId || null,
      listOfPeers: listOfPeers,
      isDataChannel: false,
      senderPeerId: this._user.sid
    }, this._user.sid, this.getPeerInfo(), true);
  }
};
Skylink.prototype.sendP2PMessage = function(message, targetPeerId) {
  var listOfPeers = Object.keys(this._dataChannels);
  var isPrivate = false;

  if (Array.isArray(targetPeerId)) {
    listOfPeers = targetPeerId;
    isPrivate = true;
  } else if (targetPeerId && typeof targetPeerId === 'string') {
    listOfPeers = [targetPeerId];
    isPrivate = true;
  }

  if (!this._inRoom || !(this._user && this._user.sid)) {
    Log.error(this._debugOptions.instanceId, 'Unable to send message as User is not in Room. ->', message);
    return;
  }

  if (!this._enableDataChannel) {
    Log.error(this._debugOptions.instanceId, 'Unable to send message as User does not have Datachannel enabled. ->', message);
    return;
  }

  // Loop out unwanted Peers
  for (var i = 0; i < listOfPeers.length; i++) {
    var peerId = listOfPeers[i];

    if (!this._dataChannels[peerId]) {
      Log.error(this._debugOptions.instanceId, [peerId, 'RTCDataChannel', null, 'Dropping of sending message to Peer as ' +
        'Datachannel connection does not exists']);
      listOfPeers.splice(i, 1);
      i--;
    } else if (peerId === 'MCU') {
      listOfPeers.splice(i, 1);
      i--;
    } else if (!this._hasMCU) {
      Log.debug(this._debugOptions.instanceId, [peerId, 'RTCDataChannel', null, 'Sending ' + (isPrivate ? 'private' : '') +
        ' P2P message to Peer']);

      this._sendMessageToDataChannel(peerId, {
        type: this._DC_PROTOCOL_TYPE.MESSAGE,
        isPrivate: isPrivate,
        sender: this._user.sid,
        target: peerId,
        data: message
      }, 'main');
    }
  }

  if (listOfPeers.length === 0) {
    Log.warn(this._debugOptions.instanceId, 'Currently there are no Peers to send P2P message to (unless the message is queued ' +
      'and there are Peer connected by then).');
  }

  if (this._hasMCU) {
    Log.debug(this._debugOptions.instanceId, ['MCU', 'RTCDataChannel', null, 'Broadcasting ' + (isPrivate ? 'private' : '') +
      ' P2P message to Peers']);

    this._sendMessageToDataChannel('MCU', {
      type: this._DC_PROTOCOL_TYPE.MESSAGE,
      isPrivate: isPrivate,
      sender: this._user.sid,
      target: listOfPeers,
      data: message
    }, 'main');
  }

  this._trigger('incomingMessage', {
    content: message,
    isPrivate: isPrivate,
    targetPeerId: targetPeerId || null,
    listOfPeers: listOfPeers,
    isDataChannel: true,
    senderPeerId: this._user.sid
  }, this._user.sid, this.getPeerInfo(), true);
};
Skylink.prototype.sendStream = function(options, callback) {
  var self = this;

  var restartFn = function (stream) {
    if (self._inRoom) {
      if (!self._streams.screenshare) {
        self._trigger('incomingStream', self._user.sid, stream, true, self.getPeerInfo(), false, stream.id || stream.label);
        self._trigger('peerUpdated', self._user.sid, self.getPeerInfo(), true);
      }

      if (Object.keys(self._peerConnections).length > 0 || self._hasMCU) {
        self._refreshPeerConnection(Object.keys(self._peerConnections), false, function (err, success) {
          if (err) {
            Log.error(self._debugOptions.instanceId, 'Failed refreshing connections for sendStream() ->', err);
            if (typeof callback === 'function') {
              callback(new Error('Failed refreshing connections.'), null);
            }
            return;
          }
          if (typeof callback === 'function') {
            callback(null, stream);
          }
        });
      } else if (typeof callback === 'function') {
        callback(null, stream);
      }
    } else {
      var notInRoomAgainError = 'Unable to send stream as user is not in the Room.';
      Log.error(self._debugOptions.instanceId, notInRoomAgainError, stream);
      if (typeof callback === 'function') {
        callback(new Error(notInRoomAgainError), null);
      }
    }
  };

  if (typeof options !== 'object' || options === null) {
    var invalidOptionsError = 'Provided stream settings is invalid';
    Log.error(self._debugOptions.instanceId, invalidOptionsError, options);
    if (typeof callback === 'function'){
      callback(new Error(invalidOptionsError),null);
    }
    return;
  }

  if (!self._inRoom) {
    var notInRoomError = 'Unable to send stream as user is not in the Room.';
    Log.error(self._debugOptions.instanceId, notInRoomError, options);
    if (typeof callback === 'function'){
      callback(new Error(notInRoomError),null);
    }
    return;
  }

  if (window.webrtcDetectedBrowser === 'edge') {
    var edgeNotSupportError = 'Edge browser currently does not support renegotiation.';
    Log.error(self._debugOptions.instanceId, edgeNotSupportError, options);
    if (typeof callback === 'function'){
      callback(new Error(edgeNotSupportError),null);
    }
    return;
  }

  if (typeof options.getAudioTracks === 'function' || typeof options.getVideoTracks === 'function') {
    var checkActiveTracksFn = function (tracks) {
      for (var t = 0; t < tracks.length; t++) {
        if (!(tracks[t].ended || (typeof tracks[t].readyState === 'string' ?
          tracks[t].readyState !== 'live' : false))) {
          return true;
        }
      }
      return false;
    };

    if (!checkActiveTracksFn( options.getAudioTracks() ) && !checkActiveTracksFn( options.getVideoTracks() )) {
      var invalidStreamError = 'Provided stream object does not have audio or video tracks.';
      Log.error(self._debugOptions.instanceId, invalidStreamError, options);
      if (typeof callback === 'function'){
        callback(new Error(invalidStreamError),null);
      }
      return;
    }

    self._onStreamAccessSuccess(options, {
      settings: {
        audio: true,
        video: true
      },
      getUserMediaSettings: {
        audio: true,
        video: true
      }
    }, false, false);

    restartFn(options);

  } else {
    self.getUserMedia(options, function (err, stream) {
      if (err) {
        if (typeof callback === 'function') {
          callback(err, null);
        }
        return;
      }
      restartFn(stream);
    });
  }
};
Skylink.prototype.sendURLData = function(data, timeout, targetPeerId, callback) {
  this._startDataTransfer(data, timeout, targetPeerId, callback, null, 'data');
};
Skylink.prototype.setDebugMode = function(options) {
  var self = this;

  if (options && typeof options === 'object') {
    self._debugOptions.trace = options.trace === true;
    self._debugOptions.storeLogs = options.storeLogs === true;
    self._debugOptions.printInstanceLabel = options.printInstanceLabel === true;
    self._debugOptions.printTimeStamp = options.printTimeStamp === true;
  } else if (options === true) {
    self._debugOptions.trace = true;
    self._debugOptions.storeLogs = true;
    self._debugOptions.printInstanceLabel = true;
    self._debugOptions.printTimeStamp = true;
  } else {
    self._debugOptions.trace = false;
    self._debugOptions.storeLogs = false;
    self._debugOptions.printInstanceLabel = false;
    self._debugOptions.printTimeStamp = false;
  }

  Log.configure(self._debugOptions.instanceId, self._debugOptions);
  Log.log(self._debugOptions.instanceId, 'setDebugMode(): Set debug options ->', UtilsFactory.clone(self._debugOptions));
};
Skylink.prototype.setLogLevel = function(logLevel) {
  var self = this;
  var hasSet = false;

  if (typeof logLevel === 'number') {
    UtilsFactory.forEach(self.LOG_LEVEL, function (opt, prop) {
      if (opt === logLevel) {
        self._debugOptions.level = logLevel;
        Log.configure(self._debugOptions.instanceId, self._debugOptions);
        Log.log(self._debugOptions.instanceId, 'setLogLevel(): Log level of "' + prop + '" set.');
        hasSet = true;
      }
    });
  }

  if (!hasSet) {
    Log.error(self._debugOptions.instanceId, 'setLogLevel(): Log level does not exist. Level is not set.');
  }
};
Skylink.prototype.setUserData = function(userData) {
  var self = this;
  var updatedUserData = '';

  if (!(typeof userData === 'undefined' || userData === null)) {
    updatedUserData = userData;
  }

  self._userData = updatedUserData;

  if (self._inRoom) {
    Log.log(self._debugOptions.instanceId, 'Updated userData -> ', updatedUserData);
    self._sendChannelMessage({
      type: self._SIG_MESSAGE_TYPE.UPDATE_USER,
      mid: self._user.sid,
      rid: self._room.id,
      userData: updatedUserData,
      stamp: (new Date()).getTime()
    });
    self._trigger('peerUpdated', self._user.sid, self.getPeerInfo(), true);
  } else {
    Log.warn(self._debugOptions.instanceId, 'User is not in the room. Broadcast of updated information will be dropped');
  }
};
Skylink.prototype.shareScreen = function (enableAudio, callback) {
  var self = this;
  var enableAudioSettings = {
    stereo: true
  };

  if (typeof enableAudio === 'function') {
    callback = enableAudio;
    enableAudio = true;

  } else if (enableAudio && typeof enableAudio === 'object') {
    enableAudioSettings.usedtx = typeof enableAudio.usedtx === 'boolean' ? enableAudio.usedtx : null;
    enableAudioSettings.useinbandfec = typeof enableAudio.useinbandfec === 'boolean' ? enableAudio.useinbandfec : null;
    enableAudioSettings.stereo = enableAudio.stereo === true;
    enableAudioSettings.echoCancellation = enableAudio.echoCancellation === true;
  }

  self._throttle(function (runFn) {
    if (!runFn) {
      if (self._throttlingShouldThrowError) {
        var throttleLimitError = 'Unable to run as throttle interval has not reached (' + self._throttlingTimeouts.shareScreen + 'ms).';
        Log.error(self._debugOptions.instanceId, throttleLimitError);

        if (typeof callback === 'function') {
          callback(new Error(throttleLimitError), null);
        }
      }
      return;
    }

    var settings = {
      settings: {
        audio: enableAudio === true || (enableAudio && typeof enableAudio === 'object') ? enableAudioSettings : false,
        video: {
          screenshare: true,
          exactConstraints: false
        }
      },
      getUserMediaSettings: {
        video: {
          mediaSource: 'window'
        }
      }
    };

    var mediaAccessSuccessFn = function (stream) {
      self.off('mediaAccessError', mediaAccessErrorFn);

      if (self._inRoom) {
        self._trigger('incomingStream', self._user.sid, stream, true, self.getPeerInfo(), true, stream.id || stream.label);
        self._trigger('peerUpdated', self._user.sid, self.getPeerInfo(), true);

        if (Object.keys(self._peerConnections).length > 0 || self._hasMCU) {
          self._refreshPeerConnection(Object.keys(self._peerConnections), false, function (err, success) {
            if (err) {
              Log.error('Failed refreshing connections for shareScreen() ->', err);
              if (typeof callback === 'function') {
                callback(new Error('Failed refreshing connections.'), null);
              }
              return;
            }
            if (typeof callback === 'function') {
              callback(null, stream);
            }
          });
        } else if (typeof callback === 'function') {
          callback(null, stream);
        }
      } else if (typeof callback === 'function') {
        callback(null, stream);
      }
    };

    var mediaAccessErrorFn = function (error) {
      self.off('mediaAccessSuccess', mediaAccessSuccessFn);

      if (typeof callback === 'function') {
        callback(error, null);
      }
    };

    self.once('mediaAccessSuccess', mediaAccessSuccessFn, function (stream, isScreensharing) {
      return isScreensharing;
    });

    self.once('mediaAccessError', mediaAccessErrorFn, function (error, isScreensharing) {
      return isScreensharing;
    });

    try {
      if (enableAudio && window.webrtcDetectedBrowser === 'firefox') {
        settings.getUserMediaSettings.audio = true;
      }

      navigator.getUserMedia(settings.getUserMediaSettings, function (stream) {
        if (window.webrtcDetectedBrowser === 'firefox' || !enableAudio) {
          self._onStreamAccessSuccess(stream, settings, true, false);
          return;
        }

        navigator.getUserMedia({
          audio: true

        }, function (audioStream) {
          try {
            audioStream.addTrack(stream.getVideoTracks()[0]);

            self.once('mediaAccessSuccess', function () {
              self._streams.screenshare.streamClone = stream;
            }, function (stream, isScreensharing) {
              return isScreensharing;
            });

            self._onStreamAccessSuccess(audioStream, settings, true, false);

          } catch (error) {
            Log.error(self._debugOptions.instanceId, 'Failed retrieving audio stream for screensharing stream', error);
            self._onStreamAccessSuccess(stream, settings, true, false);
          }
        }, function (error) {
          Log.error(self._debugOptions.instanceId, 'Failed retrieving audio stream for screensharing stream', error);
          self._onStreamAccessSuccess(stream, settings, true, false);
        });

      }, function (error) {
        self._onStreamAccessError(error, settings, true, false);
      });

    } catch (error) {
      self._onStreamAccessError(error, settings, true, false);
    }
  }, 'shareScreen', self._throttlingTimeouts.shareScreen);
};
Skylink.prototype.startRecording = function (callback) {
  var self = this;

  if (!self._hasMCU) {
    var noMCUError = 'Unable to start recording as MCU is not connected';
    Log.error(self._debugOptions.instanceId, noMCUError);
    if (typeof callback === 'function') {
      callback(new Error(noMCUError), null);
    }
    return;
  }

  if (self._currentRecordingId) {
    var hasRecordingSessionError = 'Unable to start recording as there is an existing recording in-progress';
    Log.error(self._debugOptions.instanceId, hasRecordingSessionError);
    if (typeof callback === 'function') {
      callback(new Error(hasRecordingSessionError), null);
    }
    return;
  }

  if (typeof callback === 'function') {
    self.once('recordingState', function (state, recordingId) {
      callback(null, recordingId);
    }, function (state) {
      return state === self.RECORDING_STATE.START;
    });
  }

  self._sendChannelMessage({
    type: self._SIG_MESSAGE_TYPE.START_RECORDING,
    rid: self._room.id,
    target: 'MCU'
  });

  Log.debug(self._debugOptions.instanceId, ['MCU', 'Recording', null, 'Starting recording']);
};
Skylink.prototype.startStreamingData = function(isStringStream, targetPeerId) {
  var self = this;
  var listOfPeers = Object.keys(self._dataChannels);
  var isPrivate = false;
  var sessionChunkType = 'binary';

  if (Array.isArray(targetPeerId)) {
    listOfPeers = targetPeerId;
    isPrivate = true;
  } else if (targetPeerId && typeof targetPeerId === 'string') {
    listOfPeers = [targetPeerId];
    isPrivate = true;
  }

  if (Array.isArray(isStringStream)) {
    listOfPeers = isStringStream;
    targetPeerId = isStringStream;
    isPrivate = true;
  } else if (isStringStream && typeof isStringStream === 'string') {
    listOfPeers = [isStringStream];
    targetPeerId = isStringStream;
    isPrivate = true;
  } else if (isStringStream && typeof isStringStream === 'boolean') {
    sessionChunkType = 'string';
  }

  var sessionInfo = {
    chunk: null,
    chunkSize: 0,
    chunkType: sessionChunkType === 'string' ? self.DATA_TRANSFER_DATA_TYPE.STRING :
      self.DATA_TRANSFER_DATA_TYPE.BLOB,
    isPrivate: isPrivate,
    isStringStream: sessionChunkType === 'string',
    senderPeerId: self._user && self._user.sid ? self._user.sid : null
  };

  // Remove MCU from list
  if (listOfPeers.indexOf('MCU') > -1) {
    listOfPeers.splice(listOfPeers.indexOf('MCU'), 1);
  }

  var emitErrorBeforeStreamingFn = function (error) {
    Log.error(self._debugOptions.instanceId, error);

    if (listOfPeers.length > 0) {
      for (var i = 0; i < listOfPeers.length; i++) {
        self._trigger('dataStreamState', self.DATA_STREAM_STATE.START_ERROR, null,
          listOfPeers[i], sessionInfo, new Error(error));
      }
    } else {
      self._trigger('dataStreamState', self.DATA_STREAM_STATE.START_ERROR, null,
        null, sessionInfo, new Error(error));
    }
  };

  if (!this._inRoom || !(this._user && this._user.sid)) {
    return emitErrorBeforeStreamingFn('Unable to start data streaming as User is not in Room.');
  }

  if (!this._enableDataChannel) {
    return emitErrorBeforeStreamingFn('Unable to start data streaming as User does not have Datachannel enabled.');
  }

  if (listOfPeers.length === 0) {
    return emitErrorBeforeStreamingFn('Unable to start data streaming as there are no Peers to start session with.');
  }

  var transferId = 'stream_' + (self._user && self._user.sid ? self._user.sid : '-') + '_' + (new Date()).getTime();
  var peersInterop = [];
  var peersNonInterop = [];
  var sessions = {};
  var listenToPeerFn = function (peerId, channelProp) {
    var hasStarted = false;
    sessions[peerId] = channelProp;

    self.once('dataStreamState', function () {}, function (state, evtTransferId, evtPeerId, evtSessionInfo) {
      if (!(evtTransferId === transferId && evtPeerId === peerId)) {
        return;
      }

      var dataChunk = evtSessionInfo.chunk;
      var updatedSessionInfo = UtilsFactory.clone(evtSessionInfo);
      delete updatedSessionInfo.chunk;

      if (state === self.DATA_STREAM_STATE.SENDING_STARTED) {
        hasStarted = true;
        return;
      }

      if (hasStarted && [self.DATA_STREAM_STATE.ERROR, self.DATA_STREAM_STATE.SENDING_STOPPED].indexOf(state) > -1) {
        if (channelProp === transferId) {
          self._closeDataChannel(peerId, transferId);
        }

        if (self._dataStreams[transferId] && self._dataStreams[transferId].sessions[peerId]) {
          delete self._dataStreams[transferId].sessions[peerId];

          if (Object.keys(self._dataStreams[transferId].sessions).length === 0) {
            delete self._dataStreams[transferId];
          }
        }
        return true;
      }
    });
  };

  // Loop out unwanted Peers
  for (var i = 0; i < listOfPeers.length; i++) {
    var peerId = listOfPeers[i];
    var error = null;
    var dtProtocolVersion = ((self._peerInformations[peerId] || {}).agent || {}).DTProtocolVersion || '';
    var channelProp = self._isLowerThanVersion(dtProtocolVersion, '0.1.2') ? 'main' : transferId;

    if (!(self._dataChannels[peerId] && self._dataChannels[peerId].main)) {
      error = 'Datachannel connection does not exists';
    } else if (self._hasMCU && !(self._dataChannels.MCU && self._dataChannels.MCU.main)) {
      error = 'MCU Datachannel connection does not exists';
    } else if (self._isLowerThanVersion(dtProtocolVersion, '0.1.3')) {
      error = 'Peer DTProtocolVersion does not support data streaming. (received: "' + dtProtocolVersion + '", expected: "0.1.3")';
    } else {
      if (channelProp === 'main') {
        var dataTransferId = self._hasMCU ? self._dataChannels.MCU.main.transferId : self._dataChannels[peerId].main.transferId;

        if (self._dataChannels[peerId].main.getInfo().custom.streamId) {
          error = 'Peer Datachannel currently has an active data transfer session.';
        } else if (self._hasMCU && self._dataChannels.MCU.main.getInfo().custom.streamId) {
          error = 'MCU Peer Datachannel currently has an active data transfer session.';
        } else if (self._dataTransfers[dataTransferId] && self._dataTransfers[dataTransferId].sessionChunkType === sessionChunkType) {
          error = (self._hasMCU ? 'MCU ' : '') + 'Peer Datachannel currently has an active ' + sessionChunkType + ' data transfer.';
        } else {
          peersInterop.push(peerId);
        }
      } else {
        peersNonInterop.push(peerId);
      }
    }

    if (error) {
      self._trigger('dataStreamState', self.DATA_STREAM_STATE.START_ERROR, transferId, peerId, sessionInfo, new Error(error));
      listOfPeers.splice(i, 1);
      i--;
    } else {
      listenToPeerFn(peerId, channelProp);
    }
  }

  if (listOfPeers.length === 0) {
    Log.warn(self._debugOptions.instanceId, 'There are no Peers to start data session with.');
    return;
  }

  self._dataStreams[transferId] = {
    sessions: sessions,
    chunkType: sessionChunkType === 'string' ? self.DATA_TRANSFER_DATA_TYPE.STRING :
      self.DATA_TRANSFER_DATA_TYPE.BLOB,
    sessionChunkType: sessionChunkType,
    isPrivate: isPrivate,
    isStringStream: sessionChunkType === 'string',
    senderPeerId: self._user && self._user.sid ? self._user.sid : null,
    isUpload: true
  };

  var startDataSessionFn = function (peerId, channelProp, targetPeers) {
    self.once('dataChannelState', function () {}, function (state, evtPeerId, channelName, channelType, error) {
      if (!self._dataStreams[transferId]) {
        return true;
      }

      if (!(evtPeerId === peerId && (channelProp === 'main' ? channelType === self.DATA_CHANNEL_TYPE.MESSAGING :
        channelName === transferId && channelType === self.DATA_CHANNEL_TYPE.DATA))) {
        return;
      }

      if ([self.DATA_CHANNEL_STATE.ERROR, self.DATA_CHANNEL_STATE.CLOSED].indexOf(state) > -1) {
        var updatedError = new Error(error && error.message ? error.message :
          'Failed data transfer as datachannel state is "' + state + '".');

        if (peerId === 'MCU') {
          for (var mp = 0; mp < targetPeers.length; mp++) {
            self._trigger('dataStreamState', self.DATA_STREAM_STATE.ERROR, transferId, targetPeers[mp], sessionInfo, updatedError);
          }
        } else {
          self._trigger('dataStreamState', self.DATA_STREAM_STATE.ERROR, transferId, peerId, sessionInfo, updatedError);
        }
        return true;
      }
    });

    if (!(self._dataChannels[peerId][channelProp] &&
      self._dataChannels[peerId][channelProp].getInfo().readyState === self.DATA_CHANNEL_STATE.OPEN)) {
      var notOpenError = new Error('Failed starting data streaming session as channel is not opened.');
      if (peerId === 'MCU') {
        for (i = 0; i < targetPeers.length; i++) {
          self._trigger('dataStreamState', self.DATA_STREAM_STATE.START_ERROR, transferId, targetPeers[i], sessionInfo, notOpenError);
        }
      } else {
        self._trigger('dataStreamState', self.DATA_STREAM_STATE.START_ERROR, transferId, peerId, sessionInfo, notOpenError);
      }
    }

    self._sendMessageToDataChannel(peerId, {
      type: self._DC_PROTOCOL_TYPE.WRQ,
      transferId: transferId,
      name: transferId,
      size: 0,
      originalSize: 0,
      dataType: 'fastBinaryStart',
      mimeType: null,
      chunkType: sessionChunkType,
      chunkSize: 0,
      timeout: 0,
      isPrivate: isPrivate,
      sender: self._user.sid,
      agent: window.webrtcDetectedBrowser,
      version: window.webrtcDetectedVersion,
      target: peerId === 'MCU' ? targetPeers : peerId
    }, channelProp, function (error) {

    });
    self._dataChannels[peerId][channelProp].setCustom('streamId', transferId);

    var updatedSessionInfo = UtilsFactory.clone(sessionInfo);
    delete updatedSessionInfo.chunk;

    if (peerId === 'MCU') {
      for (var tp = 0; tp < targetPeers.length; tp++) {
        self._trigger('dataStreamState', self.DATA_STREAM_STATE.SENDING_STARTED, transferId, targetPeers[tp], sessionInfo, null);
        self._trigger('incomingDataStreamStarted', transferId, targetPeers[tp], updatedSessionInfo, true);
      }
    } else {
      self._trigger('dataStreamState', self.DATA_STREAM_STATE.SENDING_STARTED, transferId, peerId, sessionInfo, null);
      self._trigger('incomingDataStreamStarted', transferId, peerId, updatedSessionInfo, true);
    }
  };

  var waitForChannelOpenFn = function (peerId, targetPeers) {
    self.once('dataChannelState', function (state, evtPeerId, error) {
      if (state === self.DATA_CHANNEL_STATE.CREATE_ERROR) {
        if (peerId === 'MCU') {
          for (var mp = 0; mp < targetPeers.length; mp++) {
            self._trigger('dataStreamState', self.DATA_STREAM_STATE.START_ERROR, transferId, targetPeers[mp], sessionInfo, error);
          }
        } else {
          self._trigger('dataStreamState', self.DATA_STREAM_STATE.START_ERROR, transferId, peerId, sessionInfo, error);
        }
        return;
      }
      startDataSessionFn(peerId, transferId, targetPeers);
    }, function (state, evtPeerId, error, channelName, channelType) {
      if (evtPeerId === peerId && channelName === transferId && channelType === self.DATA_CHANNEL_TYPE.DATA) {
        return [self.DATA_CHANNEL_STATE.CREATE_ERROR, self.DATA_CHANNEL_STATE.OPEN].indexOf(state) > -1;
      }
    });
    self._createDataChannel(peerId, transferId);
  };

  if (peersNonInterop.length > 0) {
    if (self._hasMCU) {
      waitForChannelOpenFn('MCU', peersNonInterop);
    } else {
      for (var pni = 0; pni < peersNonInterop.length; pni++) {
        waitForChannelOpenFn(peersNonInterop[pni], null);
      }
    }
  }

  if (peersInterop.length > 0) {
    if (self._hasMCU) {
      startDataSessionFn('MCU', 'main', peersInterop);
    } else {
      for (var pi = 0; pi < peersInterop.length; pi++) {
        startDataSessionFn(peersInterop[pi], 'main', null);
      }
    }
  }
};
Skylink.prototype.stopRecording = function (callback, callbackSuccessWhenLink) {
  var self = this;

  if (!self._hasMCU) {
    var noMCUError = 'Unable to stop recording as MCU is not connected';
    Log.error(self._debugOptions.instanceId, noMCUError);
    if (typeof callback === 'function') {
      callback(new Error(noMCUError), null);
    }
    return;
  }

  if (!self._currentRecordingId) {
    var noRecordingSessionError = 'Unable to stop recording as there is no recording in-progress';
    Log.error(self._debugOptions.instanceId, noRecordingSessionError);
    if (typeof callback === 'function') {
      callback(new Error(noRecordingSessionError), null);
    }
    return;
  }

  if (self._recordingStartInterval) {
    var recordingSecsRequiredError = 'Unable to stop recording as 4 seconds has not been recorded yet';
    Log.error(self._debugOptions.instanceId, recordingSecsRequiredError);
    if (typeof callback === 'function') {
      callback(new Error(recordingSecsRequiredError), null);
    }
    return;
  }

  if (typeof callback === 'function') {
    var expectedRecordingId = self._currentRecordingId;

    self.once('recordingState', function (state, recordingId, link, error) {
      if (callbackSuccessWhenLink) {
        if (error) {
          callback(error, null);
          return;
        }

        callback(null, {
          link: link,
          recordingId: recordingId
        });
        return;
      }

      callback(null, recordingId);

    }, function (state, recordingId) {
      if (expectedRecordingId === recordingId) {
        if (callbackSuccessWhenLink) {
          return [self.RECORDING_STATE.LINK, self.RECORDING_STATE.ERROR].indexOf(state) > -1;
        }
        return state === self.RECORDING_STATE.STOP;
      }
    });
  }

  self._sendChannelMessage({
    type: self._SIG_MESSAGE_TYPE.STOP_RECORDING,
    rid: self._room.id,
    target: 'MCU'
  });

  Log.debug(self._debugOptions.instanceId, ['MCU', 'Recording', null, 'Stopping recording']);
};
Skylink.prototype.stopScreen = function () {
  if (this._streams.screenshare) {
    this._stopStreams({
      screenshare: true
    });

    if (this._inRoom) {
      if (this._streams.userMedia && this._streams.userMedia.stream) {
        this._trigger('incomingStream', this._user.sid, this._streams.userMedia.stream, true, this.getPeerInfo(),
          false, this._streams.userMedia.stream.id || this._streams.userMedia.stream.label);
        this._trigger('peerUpdated', this._user.sid, this.getPeerInfo(), true);
      }
      this._refreshPeerConnection(Object.keys(this._peerConnections), false);
    }
  }
};
Skylink.prototype.stopStream = function () {
  if (this._streams.userMedia) {
    this._stopStreams({
      userMedia: true
    });
  }
};
Skylink.prototype.stopStreamingData = function(transferId) {
  var self = this;

  if (!(transferId && typeof transferId === 'string')) {
    Log.error(self._debugOptions.instanceId, 'Failed streaming data chunk as stream session ID is not provided.');
    return;
  }

  if (!(self._inRoom && self._user && self._user.sid)) {
    Log.error(self._debugOptions.instanceId, 'Failed streaming data chunk as User is not in the Room.');
    return;
  }

  if (!self._dataStreams[transferId]) {
    Log.error(self._debugOptions.instanceId, 'Failed stopping data streaming session as it does not exists.');
    return;
  }

  if (!self._dataStreams[transferId].isUpload) {
    Log.error(self._debugOptions.instanceId, 'Failed stopping data streaming session as it is not sending.');
    return;
  }

  var sessionInfo = {
    chunk: null,
    chunkSize: 0,
    chunkType: self._dataStreams[transferId].sessionChunkType === 'string' ? self.DATA_TRANSFER_DATA_TYPE.STRING :
      self.DATA_TRANSFER_DATA_TYPE.BLOB,
    isPrivate: self._dataStreams[transferId].sessionChunkType.isPrivate,
    isStringStream: self._dataStreams[transferId].sessionChunkType === 'string',
    senderPeerId: self._user && self._user.sid ? self._user.sid : null
  };

  var peersInterop = [];
  var peersNonInterop = [];
  var sendDataFn = function (peerId, channelProp, targetPeers) {
    self._sendMessageToDataChannel(peerId, {
      type: self._DC_PROTOCOL_TYPE.WRQ,
      transferId: transferId,
      name: transferId,
      size: 0,
      originalSize: 0,
      dataType: 'fastBinaryStop',
      mimeType: null,
      chunkType: self._dataStreams[transferId].sessionChunkType,
      chunkSize: 0,
      timeout: 0,
      isPrivate: self._dataStreams[transferId].isPrivate,
      sender: self._user.sid,
      agent: window.webrtcDetectedBrowser,
      version: window.webrtcDetectedVersion,
      target: targetPeers ? targetPeers : peerId
    }, channelProp);

    var updatedSessionInfo = UtilsFactory.clone(sessionInfo);
    delete updatedSessionInfo.chunk;

    if (targetPeers) {
      for (var i = 0; i < targetPeers.length; i++) {
        self._trigger('dataStreamState', self.DATA_STREAM_STATE.SENDING_STOPPED, transferId, targetPeers[i], sessionInfo, null);
        self._trigger('incomingDataStreamStopped', transferId, targetPeers[i], updatedSessionInfo, true);
      }
    } else {
      self._trigger('dataStreamState', self.DATA_STREAM_STATE.SENDING_STOPPED, transferId, peerId, sessionInfo, null);
      self._trigger('incomingDataStreamStopped', transferId, peerId, updatedSessionInfo, true);
    }
  };

  for (var peerId in self._dataStreams[transferId].sessions) {
    if (self._dataStreams[transferId].sessions.hasOwnProperty(peerId) && self._dataStreams[transferId].sessions[peerId]) {
      var channelProp = self._dataStreams[transferId].sessions[peerId];

      if (!(self._dataChannels[self._hasMCU ? 'MCU' : peerId] && self._dataChannels[self._hasMCU ? 'MCU' : peerId][channelProp] &&
        self._dataChannels[self._hasMCU ? 'MCU' : peerId][channelProp].getInfo().readyState === self.DATA_CHANNEL_STATE.OPEN &&
        self._dataChannels[self._hasMCU ? 'MCU' : peerId][channelProp].getInfo().custom.streamId === transferId)) {
        Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', transferId, 'Failed stopping data streaming session as channel is closed.']);
        self._trigger('dataStreamState', self.DATA_STREAM_STATE.ERROR, transferId, peerId, sessionInfo,
          new Error('Failed stopping data streaming session as Datachannel connection is not open or is active.'));
        return;
      }

      if (self._hasMCU) {
        if (self._dataStreams[transferId].sessions[peerId] === 'main') {
          peersInterop.push(peerId);
        } else {
          peersNonInterop.push(peerId);
        }
      } else {
        sendDataFn(peerId, channelProp);
      }
    }
  }

  if (self._hasMCU) {
    if (peersInterop.length > 0) {
      sendDataFn(peerId, 'main', peersInterop);
    }
    if (peersNonInterop.length > 0) {
      sendDataFn(peerId, transferId, peersNonInterop);
    }
  }
};
Skylink.prototype.streamData = function(transferId, dataChunk) {
  var self = this;

  if (!(transferId && typeof transferId === 'string')) {
    Log.error(self._debugOptions.instanceId, 'Failed streaming data chunk as stream session ID is not provided.');
    return;
  }

  if (!(dataChunk && typeof dataChunk === 'object' && (dataChunk instanceof Blob || dataChunk instanceof ArrayBuffer))) {
    Log.error(self._debugOptions.instanceId, 'Failed streaming data chunk as it is not provided.');
    return;
  }

  if (!(self._inRoom && self._user && self._user.sid)) {
    Log.error(self._debugOptions.instanceId, 'Failed streaming data chunk as User is not in the Room.');
    return;
  }

  if (!self._dataStreams[transferId]) {
    Log.error(self._debugOptions.instanceId, 'Failed streaming data chunk as session does not exists.');
    return;
  }

  if (!self._dataStreams[transferId].isUpload) {
    Log.error(self._debugOptions.instanceId, 'Failed streaming data chunk as session is not sending.');
    return;
  }

  if (self._dataStreams[transferId].sessionChunkType === 'string' ? typeof dataChunk !== 'string' :
    typeof dataChunk !== 'object') {
    Log.error(self._debugOptions.instanceId, 'Failed streaming data chunk as data chunk does not match expected data type.');
    return;
  }

  var updatedDataChunk = dataChunk instanceof ArrayBuffer ? new Blob(dataChunk) : dataChunk;

  if (self._dataStreams[transferId].sessionChunkType === 'string' ? updatedDataChunk.length > self._CHUNK_DATAURL_SIZE :
    updatedDataChunk.length > self._BINARY_FILE_SIZE) {
    Log.error(self._debugOptions.instanceId, 'Failed streaming data chunk as data chunk exceeds maximum chunk limit.');
    return;
  }

  var sessionInfo = {
    chunk: updatedDataChunk,
    chunkSize: updatedDataChunk.size || updatedDataChunk.length || updatedDataChunk.byteLength,
    chunkType: self._dataStreams[transferId].sessionChunkType === 'string' ? self.DATA_TRANSFER_DATA_TYPE.STRING :
      self.DATA_TRANSFER_DATA_TYPE.BLOB,
    isPrivate: self._dataStreams[transferId].sessionChunkType.isPrivate,
    isStringStream: self._dataStreams[transferId].sessionChunkType === 'string',
    senderPeerId: self._user && self._user.sid ? self._user.sid : null
  };

  var peersInterop = [];
  var peersNonInterop = [];
  var sendDataFn = function (peerId, channelProp, targetPeers) {
    var updatedSessionInfo = UtilsFactory.clone(sessionInfo);
    delete updatedSessionInfo.chunk;

    if (dataChunk instanceof Blob) {
      self._blobToArrayBuffer(dataChunk, function (buffer) {
        self._sendMessageToDataChannel(peerId, buffer, channelProp, true);
        if (targetPeers) {
          for (var i = 0; i < targetPeers.length; i++) {
            self._trigger('dataStreamState', self.DATA_STREAM_STATE.SENT, transferId, targetPeers[i], sessionInfo, null);
            self._trigger('incomingDataStream', dataChunk, transferId, targetPeers[i], updatedSessionInfo, true);
          }
        } else {
          self._trigger('dataStreamState', self.DATA_STREAM_STATE.SENT, transferId, peerId, sessionInfo, null);
          self._trigger('incomingDataStream', dataChunk, transferId, peerId, updatedSessionInfo, true);
        }
      });
    } else {
      self._sendMessageToDataChannel(peerId, dataChunk, channelProp, true);
      if (targetPeers) {
        for (var i = 0; i < targetPeers.length; i++) {
          self._trigger('dataStreamState', self.DATA_STREAM_STATE.SENT, transferId, targetPeers[i], sessionInfo, null);
          self._trigger('incomingDataStream', updatedDataChunk, transferId, targetPeers[i], updatedSessionInfo, true);
        }
      } else {
        self._trigger('dataStreamState', self.DATA_STREAM_STATE.SENT, transferId, peerId, sessionInfo, null);
        self._trigger('incomingDataStream', updatedDataChunk, transferId, peerId, updatedSessionInfo, true);
      }
    }
  };

  for (var peerId in self._dataStreams[transferId].sessions) {
    if (self._dataStreams[transferId].sessions.hasOwnProperty(peerId) && self._dataStreams[transferId].sessions[peerId]) {
      var channelProp = self._dataStreams[transferId].sessions[peerId];

      if (!(self._dataChannels[self._hasMCU ? 'MCU' : peerId] && self._dataChannels[self._hasMCU ? 'MCU' : peerId][channelProp] &&
        self._dataChannels[self._hasMCU ? 'MCU' : peerId][channelProp].getInfo().readyState === self.DATA_CHANNEL_STATE.OPEN &&
        self._dataChannels[self._hasMCU ? 'MCU' : peerId][channelProp].getInfo().custom.streamId === transferId)) {
        Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', transferId, 'Failed streaming data as it has not started or is ready.']);
        self._trigger('dataStreamState', self.DATA_STREAM_STATE.ERROR, transferId, peerId, sessionInfo,
          new Error('Streaming as it has not started or Datachannel connection is not open.'));
        return;
      }

      if (self._hasMCU) {
        if (channelProp === 'main') {
          peersInterop.push(peerId);
        } else {
          peersNonInterop.push(peerId);
        }
      } else {
        sendDataFn(peerId, channelProp);
      }
    }
  }

  if (self._hasMCU) {
    if (peersInterop.length > 0) {
      sendDataFn(peerId, 'main', peersInterop);
    }
    if (peersNonInterop.length > 0) {
      sendDataFn(peerId, transferId, peersNonInterop);
    }
  }
};
Skylink.prototype.unlockRoom = function() {
  if (!(this._user && this._user.sid)) {
    return;
  }
  Log.log(this._debugOptions.instanceId, 'Update to isRoomLocked status ->', false);
  this._sendChannelMessage({
    type: this._SIG_MESSAGE_TYPE.ROOM_LOCK,
    mid: this._user.sid,
    rid: this._room.id,
    lock: false
  });
  this._roomLocked = false;
  this._trigger('roomLock', false, this._user.sid, this.getPeerInfo(), true);
};
Skylink.prototype._createDataChannel = function(peerId, dataChannel, createAsMessagingChannel) {
  var self = this;
  var channelName = (self._user && self._user.sid ? self._user.sid : '-') + '_' + peerId;
  var channelProp = !self._dataChannels[peerId].main || createAsMessagingChannel ? 'main' : channelName;

  if (!self._user) {
    Log.error([peerId, 'RTCDataChannel', channelProp,
      'Aborting of creating or initializing Datachannel as User does not have Room session'], null, self._debugOptions);
    return;
  }

  if (!(self._peerConnections[peerId] &&
    self._peerConnections[peerId].signalingState !== self.PEER_CONNECTION_STATE.CLOSED)) {
    Log.error([peerId, 'RTCDataChannel', channelProp,
      'Aborting of creating or initializing Datachannel as Peer connection does not exists'], null, self._debugOptions);
    return;
  }

  if (dataChannel && typeof dataChannel === 'object') {
    channelName = dataChannel.label;
    channelProp = channelProp === 'main' ? 'main' : channelName;

  } else if (typeof dataChannel === 'string') {
    channelName = dataChannel;
    dataChannel = null;
    channelProp = channelProp === 'main' ? 'main' : channelName;
  }

  if (!dataChannel) {
    dataChannel = self._peerConnections[peerId];
  }

  self._dataChannels[peerId][channelProp] = DatachannelFactory(dataChannel, {
    options: self._user.sid,
    peerId: peerId,
    label: channelName,
    prop: channelProp,
    instanceId: self._debugOptions.instanceId
  });

  self._dataChannels[peerId][channelProp].on('state', function (params) {
    self._trigger('dataChannelState', params.state, peerId, params.error, params.label, params.type, params.messageErrorType);
  });

  self._dataChannels[peerId][channelProp].on('data', function (data) {
    var info = self._dataChannels[peerId][channelProp].getInfo();
    self._processDataChannelData(data, peerId, info.label, info.type,
      typeof data === 'string' || (data.type && !(data instanceof Blob)) ? 'string' : 'binary');
  });
};

/**
 * Function that sends data over the Datachannel connection.
 * @method _sendMessageToDataChannel
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._sendMessageToDataChannel = function(peerId, data, channelProp, doNotConvert, callback) {
  var self = this;

  // Set it as "main" (MESSAGING) Datachannel
  if (!channelProp || channelProp === peerId) {
    channelProp = 'main';
  }

  // TODO: What happens when we want to send binary data over or ArrayBuffers?
  if (!(typeof data === 'object' && data) && !(data && typeof data === 'string')) {
    Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', channelProp, 'Dropping invalid data ->'], data);
    return;
  }

  if (!(self._peerConnections[peerId] &&
    self._peerConnections[peerId].signalingState !== self.PEER_CONNECTION_STATE.CLOSED)) {
    Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', channelProp,
      'Dropping for sending message as Peer connection does not exists or is closed ->'], data);
    return;
  }

  if (!(self._dataChannels[peerId] && self._dataChannels[peerId][channelProp])) {
    Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', channelProp,
      'Dropping for sending message as Datachannel connection does not exists ->'], data);
    return;
  }

  self._dataChannels[peerId][channelProp].send(data, !!doNotConvert, typeof callback === 'function' ?
    callback : function () {});
};

/**
 * Function that stops the Datachannel connection and removes object references.
 * @method _closeDataChannel
 * @private
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype._closeDataChannel = function(peerId, channelProp) {
  var self = this;

  if (!self._dataChannels[peerId]) {
    Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', channelProp || null,
      'Aborting closing Datachannels as Peer connection does not have Datachannel sessions']);
    return;
  }

  if (!channelProp) {
    for (var channelNameProp in self._dataChannels) {
      if (self._dataChannels[peerId].hasOwnProperty(channelNameProp)) {
        if (self._dataChannels[peerId][channelNameProp]) {
          self._dataChannels[peerId][channelNameProp].close();
        }
      }
    }
  } else {
    if (!self._dataChannels[peerId][channelProp]) {
      Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', channelProp, 'Aborting closing Datachannel as it does not exists']);
      return;
    }

    self._dataChannels[peerId][channelProp].close();
  }
};
Skylink.prototype._base64ToBlob = function(dataURL) {
  var byteString = atob(dataURL);
  // write the bytes of the string to an ArrayBuffer
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (var j = 0; j < byteString.length; j++) {
    ia[j] = byteString.charCodeAt(j);
  }
  // write the ArrayBuffer to a blob, and you're done
  return new Blob([ab]);
};

/**
 * Function that converts a Blob object into Base64 string.
 * @method _blobToBase64
 * @private
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype._blobToBase64 = function(data, callback) {
  var fileReader = new FileReader();
  fileReader.onload = function() {
    // Load Blob as dataurl base64 string
    var base64BinaryString = fileReader.result.split(',')[1];
    callback(base64BinaryString);
  };
  fileReader.readAsDataURL(data);
};

/**
 * Function that converts a Blob object into ArrayBuffer object.
 * @method _blobToArrayBuffer
 * @private
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype._blobToArrayBuffer = function(data, callback) {
  var self = this;
  var fileReader = new FileReader();
  fileReader.onload = function() {
    // Load Blob as dataurl base64 string
    if (self._isUsingPlugin) {
      callback(new Int8Array(fileReader.result));
    } else {
      callback(fileReader.result);
    }
  };
  fileReader.readAsArrayBuffer(data);
};

/**
 * Function that chunks Blob object based on the data chunk size provided.
 * If provided Blob object size is lesser than or equals to the chunk size, it should return an array
 *   of length of <code>1</code>.
 * @method _chunkBlobData
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._chunkBlobData = function(blob, chunkSize) {
  var chunksArray = [];
  var startCount = 0;
  var endCount = 0;
  var blobByteSize = blob.size;

  if (blobByteSize > chunkSize) {
    // File Size greater than Chunk size
    while ((blobByteSize - 1) > endCount) {
      endCount = startCount + chunkSize;
      chunksArray.push(blob.slice(startCount, endCount));
      startCount += chunkSize;
    }
    if ((blobByteSize - (startCount + 1)) > 0) {
      chunksArray.push(blob.slice(startCount, blobByteSize - 1));
    }
  } else {
    // File Size below Chunk size
    chunksArray.push(blob);
  }
  return chunksArray;
};

/**
 * Function that chunks large string into string chunks based on the data chunk size provided.
 * If provided string length is lesser than or equals to the chunk size, it should return an array
 *   of length of <code>1</code>.
 * @method _chunkDataURL
 * @private
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype._chunkDataURL = function(dataURL, chunkSize) {
  var outputStr = dataURL; //encodeURIComponent(dataURL);
  var dataURLArray = [];
  var startCount = 0;
  var endCount = 0;
  var dataByteSize = dataURL.size || dataURL.length;

  if (dataByteSize > chunkSize) {
    // File Size greater than Chunk size
    while ((dataByteSize - 1) > endCount) {
      endCount = startCount + chunkSize;
      dataURLArray.push(outputStr.slice(startCount, endCount));
      startCount += chunkSize;
    }
    if ((dataByteSize - (startCount + 1)) > 0) {
      chunksArray.push(outputStr.slice(startCount, dataByteSize - 1));
    }
  } else {
    // File Size below Chunk size
    dataURLArray.push(outputStr);
  }

  return dataURLArray;
};
Skylink.prototype._startDataTransfer = function(data, timeout, targetPeerId, sendChunksAsBinary, callback, sessionType) {
  var self = this;
  var transferId = (self._user ? self._user.sid : '') + '_' + (new Date()).getTime();
  var transferErrors = {};
  var transferCompleted = [];
  var chunks = [];
  var listOfPeers = Object.keys(self._peerConnections);
  var sessionChunkType = 'string';
  var transferInfo = {
    name: null,
    size: null,
    chunkSize: null,
    chunkType: null,
    dataType: null,
    mimeType: null,
    direction: self.DATA_TRANSFER_TYPE.UPLOAD,
    timeout: 60,
    isPrivate: false,
    percentage: 0
  };

  // sendBlobData(.., timeout)
  if (typeof timeout === 'number') {
    transferInfo.timeout = timeout;
  } else if (Array.isArray(timeout)) {
    listOfPeers = timeout;
  } else if (timeout && typeof timeout === 'string') {
    listOfPeers = [timeout];
  } else if (timeout && typeof timeout === 'boolean') {
    sessionChunkType = 'binary';
  } else if (typeof timeout === 'function') {
    callback = timeout;
  }

  // sendBlobData(.., .., targetPeerId)
  if (Array.isArray(targetPeerId)) {
    listOfPeers = targetPeerId;
  } else if (targetPeerId && typeof targetPeerId === 'string') {
    listOfPeers = [targetPeerId];
  } else if (targetPeerId && typeof targetPeerId === 'boolean') {
    sessionChunkType = 'binary';
  } else if (typeof targetPeerId === 'function') {
    callback = targetPeerId;
  }

  // sendBlobData(.., .., .., sendChunksAsBinary)
  if (sendChunksAsBinary && typeof sendChunksAsBinary === 'boolean') {
    sessionChunkType = 'binary';
  } else if (typeof sendChunksAsBinary === 'function') {
    callback = sendChunksAsBinary;
  }

  // Remove MCU Peer as list of Peers
  if (listOfPeers.indexOf('MCU') > -1) {
    listOfPeers.splice(listOfPeers.indexOf('MCU'), 1);
  }

  // Function that returns the error emitted before data transfer has started
  var emitErrorBeforeDataTransferFn = function (error) {
    Log.error(self._debugOptions.instanceId, error);

    if (typeof callback === 'function') {
      var transferErrors = {};

      if (listOfPeers.length === 0) {
        transferErrors.self = new Error(error);
        self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.START_ERROR, null, null, transferInfo, {
          transferType: self.DATA_TRANSFER_TYPE.DOWNLOAD,
          message: new Error(error)
        });
      } else {
        for (var i = 0; i < listOfPeers.length; i++) {
          transferErrors[listOfPeers[i]] = new Error(error);
          self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.START_ERROR, null, listOfPeers[i], transferInfo, {
            transferType: self.DATA_TRANSFER_TYPE.DOWNLOAD,
            message: new Error(error)
          });
        }
      }

      callback({
        transferId: null,
        transferInfo: transferInfo,
        listOfPeers: listOfPeers,
        transferErrors: transferErrors
      }, null);
    }
  };

  if (sessionType === 'blob') {
    if (self._hasMCU && sessionChunkType === 'binary') {
      Log.error(self._debugOptions.instanceId, 'Binary data chunks transfer is not yet supported with MCU environment. ' +
        'Fallbacking to binary string data chunks transfer.');
      sessionChunkType = 'string';
    }

    var chunkSize = sessionChunkType === 'string' ? (window.webrtcDetectedBrowser === 'firefox' ?
      self._MOZ_CHUNK_FILE_SIZE : self._CHUNK_FILE_SIZE) : (window.webrtcDetectedBrowser === 'firefox' ?
      self._MOZ_BINARY_FILE_SIZE : self._BINARY_FILE_SIZE);

    transferInfo.dataType = self.DATA_TRANSFER_SESSION_TYPE.BLOB;
    transferInfo.chunkSize = sessionChunkType === 'string' ? 4 * Math.ceil(chunkSize / 3) : chunkSize;
    transferInfo.chunkType = sessionChunkType === 'binary' ? (window.webrtcDetectedBrowser === 'firefox' ?
      self.DATA_TRANSFER_DATA_TYPE.BLOB : self.DATA_TRANSFER_DATA_TYPE.ARRAY_BUFFER) :
      self.DATA_TRANSFER_DATA_TYPE.BINARY_STRING;

    // Start checking if data transfer can start
    if (!(data && typeof data === 'object' && data instanceof Blob)) {
      emitErrorBeforeDataTransferFn('Provided data is not a Blob data');
      return;
    }

    transferInfo.name = data.name || transferId;
    transferInfo.mimeType = data.type || null;

    if (data.size < 1) {
      emitErrorBeforeDataTransferFn('Provided data is not a valid Blob data.');
      return;
    }

    transferInfo.originalSize = data.size;
    transferInfo.size = sessionChunkType === 'string' ? 4 * Math.ceil(data.size / 3) : data.size;
    chunks = self._chunkBlobData(data, chunkSize);
  } else {
    transferInfo.dataType = self.DATA_TRANSFER_SESSION_TYPE.DATA_URL;
    transferInfo.chunkSize = self._CHUNK_DATAURL_SIZE;
    transferInfo.chunkType = self.DATA_TRANSFER_DATA_TYPE.STRING;

    // Start checking if data transfer can start
    if (!(data && typeof data === 'string')) {
      emitErrorBeforeDataTransferFn('Provided data is not a dataURL');
      return;
    }

    transferInfo.originalSize = transferInfo.size = data.length || data.size;
    chunks = self._chunkDataURL(data, transferInfo.chunkSize);
  }

  if (!(self._user && self._user.sid)) {
    emitErrorBeforeDataTransferFn('Unable to send any ' +
      sessionType.replace('data', 'dataURL') + ' data. User is not in Room.');
    return;
  }

  if (!self._enableDataChannel) {
    emitErrorBeforeDataTransferFn('Unable to send any ' +
      sessionType.replace('data', 'dataURL') + ' data. Datachannel is disabled');
    return;
  }

  if (listOfPeers.length === 0) {
    emitErrorBeforeDataTransferFn('Unable to send any ' +
      sessionType.replace('data', 'dataURL') + ' data. There are no Peers to start data transfer with');
    return;
  }

  self._dataTransfers[transferId] = UtilsFactory.clone(transferInfo);
  self._dataTransfers[transferId].peers = {};
  self._dataTransfers[transferId].peers.main = {};
  self._dataTransfers[transferId].peers[transferId] = {};
  self._dataTransfers[transferId].sessions = {};
  self._dataTransfers[transferId].chunks = chunks;
  self._dataTransfers[transferId].enforceBSPeers = [];
  self._dataTransfers[transferId].enforcedBSInfo = {};
  self._dataTransfers[transferId].sessionType = sessionType;
  self._dataTransfers[transferId].sessionChunkType = sessionChunkType;
  self._dataTransfers[transferId].senderPeerId = self._user.sid;

  // Check if fallback chunks is required
  if (sessionType === 'blob' && sessionChunkType === 'binary') {
    for (var p = 0; p < listOfPeers.length; p++) {
      var protocolVer = (((self._peerInformations[listOfPeers[p]]) || {}).agent || {}).DTProtocolVersion || '0.1.0';

      // C++ SDK does not support binary file transfer for now
      if (self._isLowerThanVersion(protocolVer, '0.1.3')) {
        self._dataTransfers[transferId].enforceBSPeers.push(listOfPeers[p]);
      }
    }

    if (self._dataTransfers[transferId].enforceBSPeers.length > 0) {
      var bsChunkSize = window.webrtcDetectedBrowser === 'firefox' ? self._MOZ_CHUNK_FILE_SIZE : self._CHUNK_FILE_SIZE;
      var bsChunks = self._chunkBlobData(new Blob(chunks), bsChunkSize);

      self._dataTransfers[transferId].enforceBSInfo = {
        chunkSize: 4 * Math.ceil(bsChunkSize / 3),
        chunkType: self.DATA_TRANSFER_DATA_TYPE.BINARY_STRING,
        size: 4 * Math.ceil(transferInfo.originalSize / 3),
        chunks: bsChunks
      };
    }
  }

  /**
   * Complete Peer function.
   */
  var completeFn = function (peerId, error) {
    // Ignore if already added.
    if (transferCompleted.indexOf(peerId) > -1) {
      return;
    }

    Log.debug(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', transferId, 'Data transfer result. Is errors present? ->'], error);

    transferCompleted.push(peerId);

    if (error) {
      transferErrors[peerId] = new Error(error);
    }

    if (listOfPeers.length === transferCompleted.length) {
      Log.log(self._debugOptions.instanceId, [null, 'RTCDataChannel', transferId, 'Data transfer request completed']);

      if (typeof callback === 'function') {
        if (Object.keys(transferErrors).length > 0) {
          callback({
            transferId: transferId,
            transferInfo: self._getTransferInfo(transferId, peerId, false, true, false),
            transferErrors: transferErrors,
            listOfPeers: listOfPeers
          }, null);
        } else {
          callback(null, {
            transferId: transferId,
            transferInfo: self._getTransferInfo(transferId, peerId, false, true, false),
            listOfPeers: listOfPeers
          });
        }
      }
    }
  };

  for (var i = 0; i < listOfPeers.length; i++) {
    var MCUInteropStatus = self._startDataTransferToPeer(transferId, listOfPeers[i], completeFn, null, null);

    if (typeof MCUInteropStatus === 'boolean') {
      if (MCUInteropStatus === true) {
        self._dataTransfers[transferId].peers.main[listOfPeers[i]] = true;
      } else {
        self._dataTransfers[transferId].peers[transferId][listOfPeers[i]] = true;
      }
    }
  }

  if (self._hasMCU) {
    if (Object.keys(self._dataTransfers[transferId].peers.main).length > 0) {
      self._startDataTransferToPeer(transferId, 'MCU', completeFn, 'main',
        Object.keys(self._dataTransfers[transferId].peers.main));
    }

    if (Object.keys(self._dataTransfers[transferId].peers[transferId]).length > 0) {
      self._startDataTransferToPeer(transferId, 'MCU', completeFn, transferId,
        Object.keys(self._dataTransfers[transferId].peers[transferId]));
    }
  }
};

/**
 * Function that starts or listens the data transfer status to Peer.
 * This reacts differently during MCU environment.
 * @method _startDataTransferToPeer
 * @return {Boolean} Returns a Boolean only during MCU environment which flag indicates if Peer requires interop
 *   (Use messaging Datachannel connection instead).
 * @private
 * @since 0.6.16
 */
Skylink.prototype._startDataTransferToPeer = function (transferId, peerId, callback, channelProp, targetPeers) {
  var self = this;

  var peerConnectionStateCbFn = null;
  var dataChannelStateCbFn = null;

  /**
   * Emit event for Peers function.
   */
  var emitEventFn = function (cb) {
    var peers = targetPeers || [peerId];
    for (var i = 0; i < peers.length; i++) {
      cb(peers[i]);
    }
  };

  /**
   * Return error and trigger them if failed before or during data transfers function.
   */
  var returnErrorBeforeTransferFn = function (error) {
    // Replace if it is a MCU Peer errors for clear indication in error message
    var updatedError = peerId === 'MCU' ? error.replace(/Peer/g, 'MCU Peer') : error;

    emitEventFn(function (evtPeerId) {
      self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.ERROR, transferId, evtPeerId,
        self._getTransferInfo(transferId, peerId, true, true, false), {
        message: new Error(updatedError),
        transferType: self.DATA_TRANSFER_TYPE.UPLOAD
      });
    });
  };

  /**
   * Send WRQ protocol to start data transfers.
   */
  var sendWRQFn = function () {
    var size = self._dataTransfers[transferId].size;
    var chunkSize = self._dataTransfers[transferId].chunkSize;
    var chunkType = self._dataTransfers[transferId].sessionChunkType;

    if (self._dataTransfers[transferId].enforceBSPeers.indexOf(peerId) > -1) {
      Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', transferId,
        'Binary data chunks transfer is not yet supported with Peer connecting from ' +
        'Android, iOS and C++ SDK. Fallbacking to binary string data chunks transfer.']);

      size = self._dataTransfers[transferId].enforceBSInfo.size;
      chunkSize = self._dataTransfers[transferId].enforceBSInfo.chunkSize;
      chunkType = 'string';
    }

    self._sendMessageToDataChannel(peerId, {
      type: self._DC_PROTOCOL_TYPE.WRQ,
      transferId: transferId,
      name: self._dataTransfers[transferId].name,
      size: size,
      originalSize: self._dataTransfers[transferId].originalSize,
      dataType: self._dataTransfers[transferId].sessionType,
      mimeType: self._dataTransfers[transferId].mimeType,
      chunkType: chunkType,
      chunkSize: chunkSize,
      timeout: self._dataTransfers[transferId].timeout,
      isPrivate: self._dataTransfers[transferId].isPrivate,
      sender: self._user.sid,
      agent: window.webrtcDetectedBrowser,
      version: window.webrtcDetectedVersion,
      target: targetPeers ? targetPeers : peerId
    }, channelProp);

    emitEventFn(function (evtPeerId) {
      self._trigger('incomingDataRequest', transferId, evtPeerId,
        self._getTransferInfo(transferId, peerId, false, false, false), true);

      self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.USER_UPLOAD_REQUEST, transferId, evtPeerId,
        self._getTransferInfo(transferId, peerId, true, false, false), null);
    });
  };

  // Listen to data transfer state
  if (peerId !== 'MCU') {
    var dataTransferStateCbFn = function (state, evtTransferId, evtPeerId, transferInfo, error) {
      if (peerConnectionStateCbFn) {
        self.off('peerConnectionState', peerConnectionStateCbFn);
      }

      if (dataChannelStateCbFn) {
        self.off('dataChannelState', dataChannelStateCbFn);
      }

      if (channelProp) {
        delete self._dataTransfers[transferId].peers[channelProp][peerId];
      }

      if (state === self.DATA_TRANSFER_STATE.UPLOAD_COMPLETED) {
        callback(peerId, null);
      } else {
        callback(peerId, error.message.message || error.message.toString());
      }

      // Handle Peer uploading to MCU case
      if (self._hasMCU && self._dataTransfers[transferId].direction === self.DATA_TRANSFER_TYPE.UPLOAD) {
        if (!(Object.keys(self._dataTransfers[transferId].peers.main).length === 0 &&
          Object.keys(self._dataTransfers[transferId].peers[transferId]).length === 0)) {
          return;
        }

        delete self._dataTransfers[transferId];

      } else {
        delete self._dataTransfers[transferId].sessions[peerId];

        if (Object.keys(self._dataTransfers[transferId].sessions).length === 0) {
          delete self._dataTransfers[transferId];
        }
      }
    };

    self.once('dataTransferState', dataTransferStateCbFn, function (state, evtTransferId, evtPeerId) {
      if (!(self._dataTransfers[transferId] && (self._hasMCU ? (self._dataTransfers[transferId].peers.main[peerId] ||
        self._dataTransfers[transferId].peers[transferId][peerId]) : self._dataTransfers[transferId].sessions[peerId]))) {
        if (dataTransferStateCbFn) {
          self.off('dataTransferState', dataTransferStateCbFn);
        }
        if (peerConnectionStateCbFn) {
          self.off('peerConnectionState', peerConnectionStateCbFn);
        }
        if (dataChannelStateCbFn) {
          self.off('dataChannelState', dataChannelStateCbFn);
        }
        return;
      }
      return evtTransferId === transferId && evtPeerId === peerId &&
        [self.DATA_TRANSFER_STATE.UPLOAD_COMPLETED, self.DATA_TRANSFER_STATE.ERROR,
        self.DATA_TRANSFER_STATE.CANCEL, self.DATA_TRANSFER_STATE.REJECTED].indexOf(state) > -1;
    });
  }

  // When Peer connection does not exists
  if (!self._peerConnections[peerId]) {
    returnErrorBeforeTransferFn('Unable to start data transfer as Peer connection does not exists.');
    return;
  }

  // When Peer session does not exists
  if (!self._peerInformations[peerId]) {
    returnErrorBeforeTransferFn('Unable to start data transfer as Peer connection does not exists.');
    return;
  }

  // When Peer connection is not STABLE
  if (self._peerConnections[peerId].signalingState !== self.PEER_CONNECTION_STATE.STABLE) {
    returnErrorBeforeTransferFn('Unable to start data transfer as Peer connection is not stable.');
    return;
  }

  if (!self._dataTransfers[transferId]) {
    returnErrorBeforeTransferFn('Unable to start data transfer as data transfer session is not in order.');
    return;
  }

  if (!(self._dataChannels[peerId] && self._dataChannels[peerId].main)) {
    returnErrorBeforeTransferFn('Unable to start data transfer as Peer Datachannel connection does not exists.');
    return;
  }

  var streamId = self._dataChannels[peerId].main.streamId;

  if (streamId && channelProp === 'main' && self._dataStreams[streamId] &&
  // Check if session chunk streaming is string and sending is string for Peer
    ((self._dataStreams[streamId].sessionChunkType === 'string' &&
    (self._dataTransfers[transferId].sessionChunkType === 'string' ||
    self._dataTransfers[transferId].enforceBSPeers.indexOf(peerId) > -1)) ||
  // Check if session chunk streaming is binary and sending is binary for Peer
    (self._dataStreams[streamId].sessionChunkType === 'binary' &&
    self._dataStreams[streamId].sessionChunkType === 'binary' &&
    self._dataTransfers[transferId].enforceBSPeers.indexOf(peerId) === -1))) {
    returnErrorBeforeTransferFn('Unable to start data transfer as Peer Datachannel currently has an active ' +
      self._dataStreams[streamId].sessionChunkType + ' data streaming session.');
    return;
  }

  var protocolVer = (self._peerInformations[peerId].agent || {}).DTProtocolVersion || '0.1.0';
  var requireInterop = self._isLowerThanVersion(protocolVer, '0.1.2');

  // Prevent DATA_URL (or "string" dataType transfers) with Android / iOS / C++ SDKs
  if (self._isLowerThanVersion(protocolVer, '0.1.2') && self._dataTransfers[transferId].sessionType === 'data' &&
    self._dataTransfers[transferId].sessionChunkType === 'string') {
    returnErrorBeforeTransferFn('Unable to start data transfer as Peer do not support DATA_URL type of data transfers');
    return;
  }

  // Listen to Peer connection state for MCU Peer
  if (peerId !== 'MCU' && self._hasMCU) {
    channelProp = requireInterop ? 'main' : transferId;

    peerConnectionStateCbFn = function () {
      returnErrorBeforeTransferFn('Data transfer terminated as Peer connection is not stable.');
    };

    self.once('peerConnectionState', peerConnectionStateCbFn, function (state, evtPeerId) {
      if (!self._dataTransfers[transferId]) {
        self.off('peerConnectionState', peerConnectionStateCbFn);
        return;
      }
      return state !== self.PEER_CONNECTION_STATE.STABLE && evtPeerId === peerId;
    });
    return requireInterop;
  }

  if (requireInterop || channelProp === 'main') {
    // When MCU Datachannel connection has a transfer in-progress
    if (self._dataChannels[peerId].main.getInfo().custom.transferId) {
      returnErrorBeforeTransferFn('Unable to start data transfer as Peer Datachannel has a data transfer in-progress.');
      return;
    }
  }

  self._dataTransfers[transferId].sessions[peerId] = {
    timer: null,
    ackN: 0
  };

  dataChannelStateCbFn = function (state, evtPeerId, error) {
    // Prevent from triggering in instances where the ackN === chunks.length
    if (self._dataTransfers[transferId].sessions[peerId].ackN >= (self._dataTransfers[transferId].chunks.length - 1)) {
      return;
    }

    if (error) {
      returnErrorBeforeTransferFn(error.message || error.toString());
    } else {
      returnErrorBeforeTransferFn('Data transfer terminated as Peer Datachannel connection closed abruptly.');
    }
  };

  self.once('dataChannelState', dataChannelStateCbFn, function (state, evtPeerId, error, channelName, channelType) {
    if (!(self._dataTransfers[transferId] && self._dataTransfers[transferId].sessions[peerId])) {
      self.off('dataChannelState', dataChannelStateCbFn);
      return;
    }

    if (evtPeerId === peerId && (channelType === self.DATA_CHANNEL_TYPE.DATA ? channelName === transferId : true)) {
      if (state === self.DATA_CHANNEL_STATE.OPEN && channelType === self.DATA_CHANNEL_TYPE.DATA &&
        channelName === transferId) {
        self._dataChannels[peerId][channelProp].setCustom('transferId', transferId);
        sendWRQFn();
        return false;
      }
      return [self.DATA_CHANNEL_STATE.CREATE_ERROR, self.DATA_CHANNEL_STATE.ERROR,
        self.DATA_CHANNEL_STATE.CLOSING, self.DATA_CHANNEL_STATE.CLOSED].indexOf(state) > -1;
    }
  });

  // Create new Datachannel for Peer to start data transfer
  if (!((requireInterop && peerId !== 'MCU') || channelProp === 'main')) {
    channelProp = transferId;
    self._createDataChannel(peerId, transferId);
  } else {
    self._dataChannels[peerId].main.setCustom('transferId', transferId);
    sendWRQFn();
  }
};

/**
 * Function that returns the data transfer session.
 * @method _getTransferInfo
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._getTransferInfo = function (transferId, peerId, returnDataProp, hidePercentage, returnDataAtStart) {
  if (!this._dataTransfers[transferId]) {
    return {};
  }

  var transferInfo = {
    name: this._dataTransfers[transferId].name,
    size: this._dataTransfers[transferId].size,
    dataType: this._dataTransfers[transferId].dataType || this.DATA_TRANSFER_SESSION_TYPE.BLOB,
    mimeType: this._dataTransfers[transferId].mimeType || null,
    chunkSize: this._dataTransfers[transferId].chunkSize,
    chunkType: this._dataTransfers[transferId].chunkType,
    timeout: this._dataTransfers[transferId].timeout,
    isPrivate: this._dataTransfers[transferId].isPrivate,
    direction: this._dataTransfers[transferId].direction
  };

  if (this._dataTransfers[transferId].originalSize) {
    transferInfo.size = this._dataTransfers[transferId].originalSize;

  } else if (this._dataTransfers[transferId].chunkType === this.DATA_TRANSFER_DATA_TYPE.BINARY_STRING) {
    transferInfo.size = Math.ceil(transferInfo.size * 3 / 4);
  }

  if (!hidePercentage) {
    transferInfo.percentage = 0;

    if (!this._dataTransfers[transferId].sessions[peerId]) {
      if (returnDataProp) {
        transferInfo.data = null;
      }
      return transferInfo;
    }

    if (this._dataTransfers[transferId].direction === this.DATA_TRANSFER_TYPE.DOWNLOAD) {
      if (this._dataTransfers[transferId].sessions[peerId].receivedSize === this._dataTransfers[transferId].sessions[peerId].size) {
        transferInfo.percentage = 100;

      } else {
        transferInfo.percentage = parseFloat(((this._dataTransfers[transferId].sessions[peerId].receivedSize /
          this._dataTransfers[transferId].size) * 100).toFixed(2), 10);
      }
    } else {
      var chunksLength = (this._dataTransfers[transferId].enforceBSPeers.indexOf(peerId) > -1 ?
        this._dataTransfers[transferId].enforceBSInfo.chunks.length : this._dataTransfers[transferId].chunks.length);

      if (this._dataTransfers[transferId].sessions[peerId].ackN === chunksLength) {
        transferInfo.percentage = 100;

      } else {
        transferInfo.percentage = parseFloat(((this._dataTransfers[transferId].sessions[peerId].ackN /
          chunksLength) * 100).toFixed(2), 10);
      }
    }

    if (returnDataProp) {
      if (typeof returnDataAtStart !== 'number') {
        if (transferInfo.percentage === 100) {
          transferInfo.data = this._getTransferData(transferId);
        } else {
          transferInfo.data = null;
        }
      } else {
        transferInfo.percentage = returnDataAtStart;

        if (returnDataAtStart === 0) {
          transferInfo.data = this._getTransferData(transferId);
        }
      }
    }
  }

  return transferInfo;
};

/**
 * Function that returns the compiled data transfer data.
 * @method _getTransferData
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._getTransferData = function (transferId) {
  if (!this._dataTransfers[transferId]) {
    return null;
  }

  if (this._dataTransfers[transferId].dataType === this.DATA_TRANSFER_SESSION_TYPE.BLOB) {
    var mimeType = {
      name: this._dataTransfers[transferId].name
    };

    if (this._dataTransfers[transferId].mimeType) {
      mimeType.type = this._dataTransfers[transferId].mimeType;
    }

    return new Blob(this._dataTransfers[transferId].chunks, mimeType);
  }

  return this._dataTransfers[transferId].chunks.join('');
};

/**
 * Function that handles the data transfers sessions timeouts.
 * @method _handleDataTransferTimeoutForPeer
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._handleDataTransferTimeoutForPeer = function (transferId, peerId, setPeerTO) {
  var self = this;

  if (!(self._dataTransfers[transferId] && self._dataTransfers[transferId].sessions[peerId])) {
    Log.debug(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', transferId, 'Data transfer does not exists for Peer. Ignoring timeout.']);
    return;
  }

  Log.debug(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', transferId, 'Clearing data transfer timer for Peer.']);

  if (self._dataTransfers[transferId].sessions[peerId].timer) {
    clearTimeout(self._dataTransfers[transferId].sessions[peerId].timer);
  }

  self._dataTransfers[transferId].sessions[peerId].timer = null;

  if (setPeerTO) {
    Log.debug(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', transferId, 'Setting data transfer timer for Peer.']);

    self._dataTransfers[transferId].sessions[peerId].timer = setTimeout(function () {
      if (!(self._dataTransfers[transferId] && self._dataTransfers[transferId].sessions[peerId])) {
        Log.debug(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', transferId,
          'Data transfer already ended for Peer. Ignoring expired timeout.']);
        return;
      }

      if (!(self._user && self._user.sid)) {
        Log.debug(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', transferId, 'User is not in Room. Ignoring expired timeout.']);
        return;
      }

      if (!self._dataChannels[peerId]) {
        Log.debug(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', transferId,
          'Datachannel connection does not exists. Ignoring expired timeout.']);
        return;
      }

      Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', transferId, 'Data transfer response has timed out.']);

      /**
       * Emit event for Peers function.
       */
      var emitEventFn = function (cb) {
        if (peerId === 'MCU') {
          var broadcastedPeers = [self._dataTransfers[transferId].peers.main,
            self._dataTransfers[transferId].peers[transferId]];

          for (var i = 0; i < broadcastedPeers.length; i++) {
            // Should not happen but insanity check
            if (!broadcastedPeers[i]) {
              continue;
            }

            for (var bcPeerId in broadcastedPeers[i]) {
              if (broadcastedPeers[i].hasOwnProperty(bcPeerId) && broadcastedPeers[i][bcPeerId]) {
                cb(bcPeerId);
              }
            }
          }
        } else {
          cb(peerId);
        }
      };

      var errorMsg = 'Connection Timeout. Longer than ' + self._dataTransfers[transferId].timeout +
        ' seconds. Connection is abolished.';

      self._sendMessageToDataChannel(peerId, {
        type: self._DC_PROTOCOL_TYPE.ERROR,
        content: errorMsg,
        isUploadError: self._dataTransfers[transferId].direction === self.DATA_TRANSFER_TYPE.UPLOAD,
        sender: self._user.sid,
        name: self._dataTransfers[transferId].name
      }, self._dataChannels[peerId][transferId] ? transferId : 'main');

      emitEventFn(function (evtPeerId) {
        self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.ERROR, transferId, peerId,
          self._getTransferInfo(transferId, peerId, true, false, false), {
          transferType: self.DATA_TRANSFER_TYPE.DOWNLOAD,
          message: new Error(errorMsg)
        });
      });
    }, self._dataTransfers[transferId].timeout * 1000);
  }
};

/**
 * Function that handles the data received from Datachannel and
 * routes to the relevant data transfer protocol handler.
 * @method _processDataChannelData
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._processDataChannelData = function(data, peerId, channelName, channelType, binaryType) {
  var self = this;

  var channelProp = channelType === self.DATA_CHANNEL_TYPE.MESSAGING ? 'main' : channelName;
  var transferId = self._dataChannels[peerId][channelProp].getInfo().custom.transferId || null;
  var streamId = self._dataChannels[peerId][channelProp].streamId || null;
  var isStreamChunk = false;

  if (streamId && self._dataStreams[streamId]) {
    isStreamChunk = self._dataStreams[streamId].sessionChunkType === 'string' ? binaryType === 'string' : binaryType === 'binary';
  }

  if (!self._peerConnections[peerId]) {
    Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', channelProp, 'Dropping data received from Peer ' +
      'as connection is not present ->'], data);
    return;
  }

  if (!(self._dataChannels[peerId] && self._dataChannels[peerId][channelProp])) {
    Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', channelProp, 'Dropping data received from Peer ' +
      'as Datachannel connection is not present ->'], data);
    return;
  }

  if (data.type && binaryType === 'string') {
    Log.debug(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', channelProp,
      'Received protocol "' + data.type + '" message ->'], data);

    isStreamChunk = false;

    // Ignore ACK, ERROR and CANCEL if there is no data transfer session in-progress
    if ([self._DC_PROTOCOL_TYPE.ACK, self._DC_PROTOCOL_TYPE.ERROR, self._DC_PROTOCOL_TYPE.CANCEL].indexOf(data.type) > -1 &&
      !(transferId && self._dataTransfers[transferId] && self._dataTransfers[transferId].sessions[peerId])) {
        Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', channelProp, 'Discarded protocol message as data transfer session ' +
          'is not present ->'], data);
        return;
    }

    switch (data.type) {
      case self._DC_PROTOCOL_TYPE.WRQ:
        // Discard iOS bidirectional upload when Datachannel is in-progress for data transfers
        if (transferId && self._dataTransfers[transferId] && self._dataTransfers[transferId].sessions[peerId]) {
          Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', channelProp, 'Rejecting bidirectional data transfer request as ' +
            'it is currently not supported in the SDK ->'], data);

          self._sendMessageToDataChannel(peerId, {
            type: self._DC_PROTOCOL_TYPE.ACK,
            ackN: -1,
            sender: self._user.sid
          }, channelProp);
          return;
        }
        self._WRQProtocolHandler(peerId, data, channelProp);
        break;
      case self._DC_PROTOCOL_TYPE.ACK:
        self._ACKProtocolHandler(peerId, data, channelProp);
        break;
      case self._DC_PROTOCOL_TYPE.ERROR:
        self._ERRORProtocolHandler(peerId, data, channelProp);
        break;
      case self._DC_PROTOCOL_TYPE.CANCEL:
        self._CANCELProtocolHandler(peerId, data, channelProp);
        break;
      case self._DC_PROTOCOL_TYPE.MESSAGE:
        self._MESSAGEProtocolHandler(peerId, data, channelProp);
        break;
      default:
        Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', channelProp,
          'Discarded unknown "' + data.type + '" message ->'], data);
    }
  } else {
    if (!isStreamChunk && !(transferId && self._dataTransfers[transferId] && self._dataTransfers[transferId].sessions[peerId])) {
      Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', channelProp, 'Discarded data chunk without session ->'], data);
      return;
    }

    if (!isStreamChunk ? self._dataTransfers[transferId].dataType === self.DATA_TRANSFER_SESSION_TYPE.DATA_URL : true) {
      Log.debug(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', channelProp, 'Received string data chunk ' + (!isStreamChunk ? '@' +
        self._dataTransfers[transferId].sessions[peerId].ackN : '') + ' with size ->'], data.length || data.size);

      self._DATAProtocolHandler(peerId, data, self.DATA_TRANSFER_DATA_TYPE.STRING, data.length || data.size, channelProp);

    } else if (binaryType === 'string') {
      var dataNS = data.replace(/\s|\r|\n/g, '');

      Log.debug(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', channelProp, 'Received binary string data chunk @' +
        self._dataTransfers[transferId].sessions[peerId].ackN + ' with size ->'], dataNS.length || dataNS.size);
      self._DATAProtocolHandler(peerId, self._base64ToBlob(dataNS),
        self.DATA_TRANSFER_DATA_TYPE.BINARY_STRING, dataNS.length || dataNS.size, channelProp);

    } else {
      Log.debug(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', channelProp, 'Received Blob data chunk ' + (isStreamChunk ? '' : '@' +
        self._dataTransfers[transferId].sessions[peerId].ackN) + ' with size ->'], data.size);

      self._DATAProtocolHandler(peerId, data, binaryType, data.size, channelProp);
    }
  }
};

/**
 * Function that handles the "WRQ" data transfer protocol.
 * @method _WRQProtocolHandler
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._WRQProtocolHandler = function(peerId, data, channelProp) {
  var self = this;
  var transferId = channelProp === 'main' ? data.transferId || null : channelProp;
  var senderPeerId = data.sender || peerId;

  if (['fastBinaryStart', 'fastBinaryStop'].indexOf(data.dataType) > -1) {
    if (data.dataType === 'fastBinaryStart') {
      if (!transferId) {
        transferId = 'stream_' + peerId + '_' + (new Date()).getTime();
      }
      self._dataStreams[transferId] = {
        chunkSize: 0,
        chunkType: data.chunkType === 'string' ? self.DATA_TRANSFER_DATA_TYPE.STRING : self.DATA_TRANSFER_DATA_TYPE.BLOB,
        sessionChunkType: data.chunkType,
        isPrivate: !!data.isPrivate,
        isStringStream: data.chunkType === 'string',
        senderPeerId: senderPeerId,
        isUpload: false
      };
      self._dataChannels[peerId][channelProp].setCustom('streamId', transferId);
      var hasStarted = false;
      self.once('dataChannelState', function () {}, function (state, evtPeerId, channelName, channelType, error) {
        if (!self._dataStreams[transferId]) {
          return true;
        }

        if (!(evtPeerId === peerId && (channelProp === 'main' ? channelType === self.DATA_CHANNEL_TYPE.MESSAGING :
          channelName === transferId && channelType === self.DATA_CHANNEL_TYPE.DATA))) {
          return;
        }

        if ([self.DATA_CHANNEL_STATE.ERROR, self.DATA_CHANNEL_STATE.CLOSED].indexOf(state) > -1) {
          var updatedError = new Error(error && error.message ? error.message :
            'Failed data transfer as datachannel state is "' + state + '".');

          self._trigger('dataStreamState', self.DATA_STREAM_STATE.ERROR, transferId, senderPeerId, {
            chunk: null,
            chunkSize: 0,
            chunkType: self._dataStreams[transferId].chunkType,
            isPrivate: self._dataStreams[transferId].isPrivate,
            isStringStream: self._dataStreams[transferId].sessionChunkType === 'string',
            senderPeerId: senderPeerId
          }, updatedError);
          return true;
        }
      });

      self._trigger('dataStreamState', self.DATA_STREAM_STATE.RECEIVING_STARTED, transferId, senderPeerId, {
        chunk: null,
        chunkSize: 0,
        chunkType: self._dataStreams[transferId].chunkType,
        isPrivate: self._dataStreams[transferId].isPrivate,
        isStringStream: self._dataStreams[transferId].sessionChunkType === 'string',
        senderPeerId: senderPeerId
      }, null);
      self._trigger('incomingDataStreamStarted', transferId, senderPeerId, {
        chunkSize: 0,
        chunkType: self._dataStreams[transferId].chunkType,
        isPrivate: self._dataStreams[transferId].isPrivate,
        isStringStream: self._dataStreams[transferId].sessionChunkType === 'string',
        senderPeerId: senderPeerId
      }, false);

    } else {
      transferId = self._dataChannels[peerId][channelProp].streamId;
      if (self._dataStreams[transferId] && !self._dataStreams[transferId].isUpload) {
        self._trigger('dataStreamState', self.DATA_STREAM_STATE.RECEIVING_STOPPED, transferId, senderPeerId, {
          chunk: null,
          chunkSize: 0,
          chunkType: self._dataStreams[transferId].chunkType,
          isPrivate: self._dataStreams[transferId].isPrivate,
          isStringStream: self._dataStreams[transferId].sessionChunkType === 'string',
          senderPeerId: senderPeerId
        }, null);
        self._trigger('incomingDataStreamStopped', transferId, senderPeerId, {
          chunkSize: 0,
          chunkType: self._dataStreams[transferId].chunkType,
          isPrivate: self._dataStreams[transferId].isPrivate,
          isStringStream: self._dataStreams[transferId].sessionChunkType === 'string',
          senderPeerId: senderPeerId
        }, false);
        self._dataChannels[peerId][channelProp].setCustom('streamId', null);
        if (channelProp !== 'main') {
          self._closeDataChannel(peerId, channelProp);
        }

        delete self._dataStreams[transferId];
      }
    }
  } else {
    if (!transferId) {
      transferId = 'transfer_' + peerId + '_' + (new Date()).getTime();
    }

    self._dataTransfers[transferId] = {
      name: data.name || transferId,
      size: data.size || 0,
      chunkSize: data.chunkSize,
      originalSize: data.originalSize || 0,
      timeout: data.timeout || 60,
      isPrivate: !!data.isPrivate,
      senderPeerId: data.sender || peerId,
      dataType: self.DATA_TRANSFER_SESSION_TYPE.BLOB,
      mimeType: data.mimeType || null,
      chunkType: self.DATA_TRANSFER_DATA_TYPE.BINARY_STRING,
      direction: self.DATA_TRANSFER_TYPE.DOWNLOAD,
      chunks: [],
      sessions: {},
      sessionType: data.dataType || 'blob',
      sessionChunkType: data.chunkType || 'string'
    };

    if (self._dataTransfers[transferId].sessionType === 'data' &&
      self._dataTransfers[transferId].sessionChunkType === 'string') {
      self._dataTransfers[transferId].dataType = self.DATA_TRANSFER_SESSION_TYPE.DATA_URL;
      self._dataTransfers[transferId].chunkType = self.DATA_TRANSFER_DATA_TYPE.STRING;
    } else if (self._dataTransfers[transferId].sessionType === 'blob' &&
      self._dataTransfers[transferId].sessionChunkType === 'binary') {
      self._dataTransfers[transferId].chunkType = self.DATA_TRANSFER_DATA_TYPE.ARRAY_BUFFER;
    }

    self._dataChannels[peerId][channelProp].setCustom('transferId', transferId);
    self._dataTransfers[transferId].sessions[peerId] = {
      timer: null,
      ackN: 0,
      receivedSize: 0
    };

    self._trigger('incomingDataRequest', transferId, senderPeerId,
      self._getTransferInfo(transferId, peerId, false, false, false), false);

    self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.UPLOAD_REQUEST, transferId, senderPeerId,
      self._getTransferInfo(transferId, peerId, true, false, false), null);
  }
};

/**
 * Function that handles the "ACK" data transfer protocol.
 * @method _ACKProtocolHandler
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._ACKProtocolHandler = function(peerId, data, channelProp) {
  var self = this;

  var transferId = channelProp;
  var senderPeerId = data.sender || peerId;

  if (channelProp === 'main') {
    transferId = self._dataChannels[peerId].main.getInfo().custom.transferId;
  }

  self._handleDataTransferTimeoutForPeer(transferId, peerId, false);

  /**
   * Emit event for Peers function.
   */
  var emitEventFn = function (cb) {
    if (peerId === 'MCU') {
      if (!self._dataTransfers[transferId].peers[channelProp]) {
        Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', channelProp, 'Dropping triggering of ACK event as ' +
          'Peers list does not exists']);
        return;
      }
      for (var evtPeerId in self._dataTransfers[transferId].peers[channelProp]) {
        if (self._dataTransfers[transferId].peers[channelProp].hasOwnProperty(evtPeerId) &&
          self._dataTransfers[transferId].peers[channelProp][evtPeerId]) {
          cb(evtPeerId);
        }
      }
    } else {
      cb(senderPeerId);
    }
  };

  if (data.ackN > -1) {
    if (data.ackN === 0) {
      emitEventFn(function (evtPeerId) {
        self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.UPLOAD_STARTED, transferId, evtPeerId,
          self._getTransferInfo(transferId, peerId, true, false, 0), null);
      });
    } else if (self._dataTransfers[transferId].enforceBSPeers.indexOf(peerId) > -1 ?
      data.ackN === self._dataTransfers[transferId].enforceBSInfo.chunks.length :
      data.ackN === self._dataTransfers[transferId].chunks.length) {
      self._dataTransfers[transferId].sessions[peerId].ackN = data.ackN;

      emitEventFn(function (evtPeerId) {
        self._trigger('incomingData', self._getTransferData(transferId), transferId, evtPeerId,
          self._getTransferInfo(transferId, peerId, false, false, false), true);

        self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.UPLOAD_COMPLETED, transferId, evtPeerId,
          self._getTransferInfo(transferId, peerId, true, false, 100), null);
      });

      if (self._dataChannels[peerId][channelProp]) {
        self._dataChannels[peerId][channelProp].setCustom('transferId', null);

        if (channelProp !== 'main') {
          self._closeDataChannel(peerId, channelProp);
        }
      }
      return;
    }

    var uploadFn = function (chunk) {
      self._sendMessageToDataChannel(peerId, chunk, channelProp, true, function (error) {
        if (data.ackN < self._dataTransfers[transferId].chunks.length) {
          emitEventFn(function (evtPeerId) {
            self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.UPLOADING, transferId, evtPeerId,
              self._getTransferInfo(transferId, peerId, true, false, false), null);
          });
        }

        self._handleDataTransferTimeoutForPeer(transferId, peerId, true);
      });
    };

    self._dataTransfers[transferId].sessions[peerId].ackN = data.ackN;

    if (self._dataTransfers[transferId].enforceBSPeers.indexOf(peerId) > -1) {
      self._blobToBase64(self._dataTransfers[transferId].enforceBSInfo.chunks[data.ackN], uploadFn);
    } else if (self._dataTransfers[transferId].chunkType === self.DATA_TRANSFER_DATA_TYPE.BINARY_STRING) {
      self._blobToBase64(self._dataTransfers[transferId].chunks[data.ackN], uploadFn);
    } else {
      uploadFn(self._dataTransfers[transferId].chunks[data.ackN]);
    }
  } else {
    self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.REJECTED, transferId, senderPeerId,
      self._getTransferInfo(transferId, peerId, true, false, false), {
      message: new Error('Data transfer terminated as Peer has rejected data transfer request'),
      transferType: self.DATA_TRANSFER_TYPE.UPLOAD
    });
  }
};

/**
 * Function that handles the "MESSAGE" data transfer protocol.
 * @method _MESSAGEProtocolHandler
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._MESSAGEProtocolHandler = function(peerId, data, channelProp) {
  var senderPeerId = data.sender || peerId;

  Log.log(self._debugOptions.instanceId, [senderPeerId, 'RTCDataChannel', channelProp, 'Received P2P message from peer:'], data);

  this._trigger('incomingMessage', {
    content: data.data,
    isPrivate: data.isPrivate,
    isDataChannel: true,
    targetPeerId: this._user.sid,
    senderPeerId: senderPeerId
  }, senderPeerId, this.getPeerInfo(senderPeerId), false);
};

/**
 * Function that handles the "ERROR" data transfer protocol.
 * @method _ERRORProtocolHandler
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._ERRORProtocolHandler = function(peerId, data, channelProp) {
  var self = this;

  var transferId = channelProp;
  var senderPeerId = data.sender || peerId;

  if (channelProp === 'main') {
    transferId = self._dataChannels[peerId].main.getInfo().custom.transferId;
  }

  self._handleDataTransferTimeoutForPeer(transferId, peerId, false);

  /**
   * Emit event for Peers function.
   */
  var emitEventFn = function (cb) {
    if (peerId === 'MCU') {
      if (!self._dataTransfers[transferId].peers[channelProp]) {
        Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', channelProp, 'Dropping triggering of ERROR event as ' +
          'Peers list does not exists']);
        return;
      }
      for (var evtPeerId in self._dataTransfers[transferId].peers[channelProp]) {
        if (self._dataTransfers[transferId].peers[channelProp].hasOwnProperty(evtPeerId) &&
          self._dataTransfers[transferId].peers[channelProp][evtPeerId]) {
          cb(evtPeerId);
        }
      }
    } else {
      cb(senderPeerId);
    }
  };

  Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', channelProp, 'Received an error from peer ->'], data);

  emitEventFn(function (evtPeerId) {
    self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.ERROR, transferId, evtPeerId,
      self._getTransferInfo(transferId, peerID, true, false, false), {
      message: new Error(data.content),
      transferType: self._dataTransfers[transferId].direction
    });
  });
};

/**
 * Function that handles the "CANCEL" data transfer protocol.
 * @method _CANCELProtocolHandler
 * @private
 * @for Skylink
 * @since 0.5.0
 */
Skylink.prototype._CANCELProtocolHandler = function(peerId, data, channelProp) {
  var self = this;
  var transferId = channelProp;

  if (channelProp === 'main') {
    transferId = self._dataChannels[peerId].main.getInfo().custom.transferId;
  }

  self._handleDataTransferTimeoutForPeer(transferId, peerId, false);

  /**
   * Emit event for Peers function.
   */
  var emitEventFn = function (cb) {
    if (peerId === 'MCU') {
      if (!self._dataTransfers[transferId].peers[channelProp]) {
        Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', channelProp, 'Dropping triggering of CANCEL event as ' +
          'Peers list does not exists']);
        return;
      }
      for (var evtPeerId in self._dataTransfers[transferId].peers[channelProp]) {
        if (self._dataTransfers[transferId].peers[channelProp].hasOwnProperty(evtPeerId) &&
          self._dataTransfers[transferId].peers[channelProp][evtPeerId]) {
          cb(evtPeerId);
        }
      }
    } else {
      cb(peerId);
    }
  };

  Log.error(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', channelProp, 'Received data transfer termination from peer ->'], data);

  emitEventFn(function (evtPeerId) {
    self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.CANCEL, transferId, evtPeerId,
      self._getTransferInfo(transferId, peerId, true, false, false), {
      message: new Error(data.content || 'Peer has terminated data transfer.'),
      transferType: self._dataTransfers[transferId].direction
    });
  });
};

/**
 * Function that handles the data transfer chunk received.
 * @method _DATAProtocolHandler
 * @private
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._DATAProtocolHandler = function(peerId, chunk, chunkType, chunkSize, channelProp) {
  var self = this;
  var transferId = channelProp;
  var senderPeerId = peerId;

  if (!(self._dataChannels[peerId] && self._dataChannels[peerId][channelProp])) {
    return;
  }

  var streamId = self._dataChannels[peerId][channelProp].streamId;

  if (streamId && self._dataStreams[streamId] && ((typeof chunk === 'string' &&
    self._dataStreams[streamId].sessionChunkType === 'string') || (chunk instanceof Blob &&
    self._dataStreams[streamId].sessionChunkType === 'binary'))) {
    senderPeerId = self._dataStreams[streamId].senderPeerId || peerId;
    self._trigger('dataStreamState', self.DATA_STREAM_STATE.RECEIVED, streamId, senderPeerId, {
      chunk: chunk,
      chunkSize: chunkSize,
      chunkType: chunkType,
      isPrivate: self._dataStreams[streamId].sessionChunkType.isPrivate,
      isStringStream: self._dataStreams[streamId].sessionChunkType === 'string',
      senderPeerId: senderPeerId
    }, null);
    self._trigger('incomingDataStream', chunk, transferId, senderPeerId, {
      chunkSize: chunkSize,
      chunkType: chunkType,
      isPrivate: self._dataStreams[streamId].sessionChunkType.isPrivate,
      isStringStream: self._dataStreams[streamId].sessionChunkType === 'string',
      senderPeerId: senderPeerId
    }, false);
    return;
  }

  if (channelProp === 'main') {
    transferId = self._dataChannels[peerId].main.getInfo().custom.transferId;
  }

  if (self._dataTransfers[transferId].senderPeerId) {
    senderPeerId = self._dataTransfers[transferId].senderPeerId;
  }

  self._handleDataTransferTimeoutForPeer(transferId, peerId, false);

  self._dataTransfers[transferId].chunkType = chunkType;
  self._dataTransfers[transferId].sessions[peerId].receivedSize += chunkSize;
  self._dataTransfers[transferId].chunks[self._dataTransfers[transferId].sessions[peerId].ackN] = chunk;

  if (self._dataTransfers[transferId].sessions[peerId].receivedSize >= self._dataTransfers[transferId].size) {
    Log.log(self._debugOptions.instanceId, [peerId, 'RTCDataChannel', channelProp, 'Data transfer has been completed. Computed size ->'],
      self._dataTransfers[transferId].sessions[peerId].receivedSize);

    // Send last ACK to Peer to indicate completion of data transfers
    self._sendMessageToDataChannel(peerId, {
      type: self._DC_PROTOCOL_TYPE.ACK,
      sender: self._user.sid,
      ackN: self._dataTransfers[transferId].sessions[peerId].ackN + 1
    }, channelProp);

    self._trigger('incomingData', self._getTransferData(transferId), transferId, senderPeerId,
      self._getTransferInfo(transferId, peerId, false, false, false), null);

    self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.DOWNLOAD_COMPLETED, transferId, senderPeerId,
      self._getTransferInfo(transferId, peerId, true, false, false), null);
    return;
  }

  self._dataTransfers[transferId].sessions[peerId].ackN += 1;

  self._sendMessageToDataChannel(peerId, {
    type: self._DC_PROTOCOL_TYPE.ACK,
    sender: self._user.sid,
    ackN: self._dataTransfers[transferId].sessions[peerId].ackN
  }, channelProp);

  self._handleDataTransferTimeoutForPeer(transferId, peerId, true);

  self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.DOWNLOADING, transferId, senderPeerId,
    self._getTransferInfo(transferId, peerId, true, false, false), null);
};

var SkylinkEvents = {
  /**
   * Event triggered when socket connection to Signaling server has opened.
   * @event channelOpen
   * @param {JSON} session The socket connection session information.
   * @param {String} session.serverUrl The socket connection Signaling url used.
   * @param {String} session.transportType The socket connection transport type used.
   * @param {JSON} session.socketOptions The socket connection options.
   * @param {Number} session.attempts The socket connection current reconnection attempts.
   * @param {Number} session.finalAttempts The socket connection current last attempts
   *   for the last available transports and port.
   * @for Skylink
   * @since 0.1.0
   */
  channelOpen: [],

  /**
   * Event triggered when socket connection to Signaling server has closed.
   * @event channelClose
   * @param {JSON} session The socket connection session information.
   *   <small>Object signature matches the <code>session</code> parameter payload received in the
   *   <a href="#event_channelOpen"><code>channelOpen</code> event</a>.</small>
   * @for Skylink
   * @since 0.1.0
   */
  channelClose: [],

  /**
   * <blockquote class="info">
   *   Note that this is used only for SDK developer purposes.
   * </blockquote>
   * Event triggered when receiving socket message from the Signaling server.
   * @event channelMessage
   * @param {JSON} message The socket message object.
   * @param {JSON} session The socket connection session information.
   *   <small>Object signature matches the <code>session</code> parameter payload received in the
   *   <a href="#event_channelOpen"><code>channelOpen</code> event</a>.</small>
   * @for Skylink
   * @since 0.1.0
   */
  channelMessage: [],

  /**
   * <blockquote class="info">
   *   This may be caused by Javascript errors in the event listener when subscribing to events.<br>
   *   It may be resolved by checking for code errors in your Web App in the event subscribing listener.<br>
   *   <code>skylinkDemo.on("eventName", function () { // Errors here });</code>
   * </blockquote>
   * Event triggered when socket connection encountered exception.
   * @event channelError
   * @param {Error|String} error The error object.
   * @param {JSON} session The socket connection session information.
   *   <small>Object signature matches the <code>session</code> parameter payload received in the
   *   <a href="#event_channelOpen"><code>channelOpen</code> event</a>.</small>
   * @for Skylink
   * @since 0.1.0
   */
  channelError: [],

  /**
   * Event triggered when attempting to establish socket connection to Signaling server when failed.
   * @event channelRetry
   * @param {String} fallbackType The current fallback state.
   *   [Rel: Skylink.SOCKET_FALLBACK]
   * @param {Number} currentAttempt The current socket reconnection attempt.
   * @param {JSON} session The socket connection session information.
   *   <small>Object signature matches the <code>session</code> parameter payload received in the
   *   <a href="#event_channelOpen"><code>channelOpen</code> event</a>.</small>
   * @for Skylink
   * @since 0.5.6
   */
  channelRetry: [],

  /**
   * Event triggered when attempt to establish socket connection to Signaling server has failed.
   * @event socketError
   * @param {Number} errorCode The socket connection error code.
   *   [Rel: Skylink.SOCKET_ERROR]
   * @param {Error|String|Number} error The error object.
   * @param {String} type The fallback state of the socket connection attempt.
   *   [Rel: Skylink.SOCKET_FALLBACK]
   * @param {JSON} session The socket connection session information.
   *   <small>Object signature matches the <code>session</code> parameter payload received in the
   *   <a href="#event_channelOpen"><code>channelOpen</code> event</a>.</small>
   * @for Skylink
   * @since 0.5.5
   */
  socketError: [],

  /**
   * Event triggered when <a href="#method_init"><code>init()</code> method</a> ready state changes.
   * @event readyStateChange
   * @param {Number} readyState The current <code>init()</code> ready state.
   *   [Rel: Skylink.READY_STATE_CHANGE]
   * @param {JSON} [error] The error result.
   *   <small>Defined only when <code>state</code> is <code>ERROR</code>.</small>
   * @param {Number} error.status The HTTP status code when failed.
   * @param {Number} error.errorCode The ready state change failure code.
   *   [Rel: Skylink.READY_STATE_CHANGE_ERROR]
   * @param {Error} error.content The error object.
   * @param {String} room The Room to The Room to retrieve session token for.
   * @for Skylink
   * @since 0.4.0
   */
  readyStateChange: [],

  /**
   * Event triggered when a Peer connection establishment state has changed.
   * @event handshakeProgress
   * @param {String} state The current Peer connection establishment state.
   *   [Rel: Skylink.HANDSHAKE_PROGRESS]
   * @param {String} peerId The Peer ID.
   * @param {Error|String} [error] The error object.
   *   <small>Defined only when <code>state</code> is <code>ERROR</code>.</small>
   * @for Skylink
   * @since 0.3.0
   */
  handshakeProgress: [],

  /**
   * <blockquote class="info">
   *   Learn more about how ICE works in this
   *   <a href="https://temasys.com.sg/ice-what-is-this-sorcery/">article here</a>.
   * </blockquote>
   * Event triggered when a Peer connection ICE gathering state has changed.
   * @event candidateGenerationState
   * @param {String} state The current Peer connection ICE gathering state.
   *   [Rel: Skylink.CANDIDATE_GENERATION_STATE]
   * @param {String} peerId The Peer ID.
   * @for Skylink
   * @since 0.1.0
   */
  candidateGenerationState: [],

  /**
   * <blockquote class="info">
   *   Learn more about how ICE works in this
   *   <a href="https://temasys.com.sg/ice-what-is-this-sorcery/">article here</a>.
   * </blockquote>
   * Event triggered when a Peer connection session description exchanging state has changed.
   * @event peerConnectionState
   * @param {String} state The current Peer connection session description exchanging state.
   *   [Rel: Skylink.PEER_CONNECTION_STATE]
   * @param {String} peerId The Peer ID.
   * @for Skylink
   * @since 0.1.0
   */
  peerConnectionState: [],

  /**
   * <blockquote class="info">
   *   Learn more about how ICE works in this
   *   <a href="https://temasys.com.sg/ice-what-is-this-sorcery/">article here</a>.
   * </blockquote>
   * Event triggered when a Peer connection ICE connection state has changed.
   * @event iceConnectionState
   * @param {String} state The current Peer connection ICE connection state.
   *   [Rel: Skylink.ICE_CONNECTION_STATE]
   * @param {String} peerId The Peer ID.
   * @for Skylink
   * @since 0.1.0
   */
  iceConnectionState: [],

  /**
   * Event triggered when retrieval of Stream failed.
   * @event mediaAccessError
   * @param {Error|String} error The error object.
   * @param {Boolean} isScreensharing The flag if event occurred during
   *   <a href="#method_shareScreen"><code>shareScreen()</code> method</a> and not
   *   <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a>.
   * @param {Boolean} isAudioFallbackError The flag if event occurred during
   *   retrieval of audio tracks only when <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a>
   *   had failed to retrieve both audio and video tracks.
   * @for Skylink
   * @since 0.1.0
   */
  mediaAccessError: [],

  /**
   * Event triggered when Stream retrieval fallback state has changed.
   * @event mediaAccessFallback
   * @param {JSON} error The error result.
   * @param {Error|String} error.error The error object.
   * @param {JSON} [error.diff=null] The list of excepted but received audio and video tracks in Stream.
   *   <small>Defined only when <code>state</code> payload is <code>FALLBACKED</code>.</small>
   * @param {JSON} error.diff.video The expected and received video tracks.
   * @param {Number} error.diff.video.expected The expected video tracks.
   * @param {Number} error.diff.video.received The received video tracks.
   * @param {JSON} error.diff.audio The expected and received audio tracks.
   * @param {Number} error.diff.audio.expected The expected audio tracks.
   * @param {Number} error.diff.audio.received The received audio tracks.
   * @param {Number} state The fallback state.
   *   [Rel: Skylink.MEDIA_ACCESS_FALLBACK_STATE]
   * @param {Boolean} isScreensharing The flag if event occurred during
   *   <a href="#method_shareScreen"><code>shareScreen()</code> method</a> and not
   *   <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a>.
   * @param {Boolean} isAudioFallback The flag if event occurred during
   *   retrieval of audio tracks only when <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a>
   *   had failed to retrieve both audio and video tracks.
   * @param {String} streamId The Stream ID.
   *   <small>Defined only when <code>state</code> payload is <code>FALLBACKED</code>.</small>
   * @for Skylink
   * @since 0.6.3
   */
  mediaAccessFallback: [],

  /**
   * Event triggered when retrieval of Stream is successful.
   * @event mediaAccessSuccess
   * @param {MediaStream} stream The Stream object.
   *   <small>To attach it to an element: <code>attachMediaStream(videoElement, stream);</code>.</small>
   * @param {Boolean} isScreensharing The flag if event occurred during
   *   <a href="#method_shareScreen"><code>shareScreen()</code> method</a> and not
   *   <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a>.
   * @param {Boolean} isAudioFallback The flag if event occurred during
   *   retrieval of audio tracks only when <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a>
   *   had failed to retrieve both audio and video tracks.
   * @param {String} streamId The Stream ID.
   * @for Skylink
   * @since 0.1.0
   */
  mediaAccessSuccess: [],

  /**
   * Event triggered when retrieval of Stream is required to complete <a href="#method_joinRoom">
   * <code>joinRoom()</code> method</a> request.
   * @event mediaAccessRequired
   * @for Skylink
   * @since 0.5.5
   */
  mediaAccessRequired: [],

  /**
   * Event triggered when Stream has stopped streaming.
   * @event mediaAccessStopped
   * @param {Boolean} isScreensharing The flag if event occurred during
   *   <a href="#method_shareScreen"><code>shareScreen()</code> method</a> and not
   *   <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a>.
   * @param {Boolean} isAudioFallback The flag if event occurred during
   *   retrieval of audio tracks only when <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a>
   *   had failed to retrieve both audio and video tracks.
   * @param {String} streamId The Stream ID.
   * @for Skylink
   * @since 0.5.6
   */
  mediaAccessStopped: [],

  /**
   * Event triggered when a Peer joins the room.
   * @event peerJoined
   * @param {String} peerId The Peer ID.
   * @param {JSON} peerInfo The Peer session information.
   * @param {JSON|String} peerInfo.userData The Peer current custom data.
   * @param {JSON} peerInfo.settings The Peer sending Stream settings.
   * @param {Boolean|JSON} peerInfo.settings.audio The Peer Stream audio settings.
   *   <small>When defined as <code>false</code>, it means there is no audio being sent from Peer.</small>
   *   <small>When defined as <code>true</code>, the <code>peerInfo.settings.audio.stereo</code> value is
   *   considered as <code>false</code> and the <code>peerInfo.settings.audio.exactConstraints</code>
   *   value is considered as <code>false</code>.</small>
   * @param {Boolean} peerInfo.settings.audio.stereo The flag if stereo band is configured
   *   when encoding audio codec is <a href="#attr_AUDIO_CODEC"><code>OPUS</code></a> for receiving audio data.
   * @param {Boolean} [peerInfo.settings.audio.usedtx] <blockquote class="info">
   *   Note that this feature might not work depending on the browser support and implementation.</blockquote>
   *   The flag if DTX (Discontinuous Transmission) is configured when encoding audio codec
   *   is <a href="#attr_AUDIO_CODEC"><code>OPUS</code></a> for sending audio data.
   *   <small>This might help to reduce bandwidth it reduces the bitrate during silence or background noise.</small>
   *   <small>When not defined, the default browser configuration is used.</small>
   * @param {Boolean} [peerInfo.settings.audio.useinbandfec] <blockquote class="info">
   *   Note that this feature might not work depending on the browser support and implementation.</blockquote>
   *   The flag if capability to take advantage of in-band FEC (Forward Error Correction) is
   *   configured when encoding audio codec is <a href="#attr_AUDIO_CODEC"><code>OPUS</code></a> for sending audio data.
   *   <small>This might help to reduce the harm of packet loss by encoding information about the previous packet.</small>
   *   <small>When not defined, the default browser configuration is used.</small>
   * @param {Number} [peerInfo.settings.audio.maxplaybackrate] <blockquote class="info">
   *   Note that this feature might not work depending on the browser support and implementation.</blockquote>
   *   The maximum output sampling rate rendered in Hertz (Hz) when encoding audio codec is
   *   <a href="#attr_AUDIO_CODEC"><code>OPUS</code></a> for sending audio data.
   *   <small>This value must be between <code>8000</code> to <code>48000</code>.</small>
   *   <small>When not defined, the default browser configuration is used.</small>
   * @param {Boolean} peerInfo.settings.audio.echoCancellation The flag if echo cancellation is enabled for audio tracks.
   * @param {Array} [peerInfo.settings.audio.optional] The Peer Stream <code>navigator.getUserMedia()</code> API
   *   <code>audio: { optional [..] }</code> property.
   * @param {String} [peerInfo.settings.audio.deviceId] The Peer Stream audio track source ID of the device used.
   * @param {Boolean} peerInfo.settings.audio.exactConstraints The flag if Peer Stream audio track is sending exact
   *   requested values of <code>peerInfo.settings.audio.deviceId</code> when provided.
   * @param {Boolean|JSON} peerInfo.settings.video The Peer Stream video settings.
   *   <small>When defined as <code>false</code>, it means there is no video being sent from Peer.</small>
   *   <small>When defined as <code>true</code>, the <code>peerInfo.settings.video.screenshare</code> value is
   *   considered as <code>false</code>  and the <code>peerInfo.settings.video.exactConstraints</code>
   *   value is considered as <code>false</code>.</small>
   * @param {JSON} [peerInfo.settings.video.resolution] The Peer Stream video resolution.
   *   [Rel: Skylink.VIDEO_RESOLUTION]
   * @param {Number|JSON} peerInfo.settings.video.resolution.width The Peer Stream video resolution width or
   *   video resolution width settings.
   *   <small>When defined as a JSON object, it is the user set resolution width settings with (<code>"min"</code> or
   *   <code>"max"</code> or <code>"ideal"</code> or <code>"exact"</code> etc configurations).</small>
   * @param {Number|JSON} peerInfo.settings.video.resolution.height The Peer Stream video resolution height or
   *   video resolution height settings.
   *   <small>When defined as a JSON object, it is the user set resolution height settings with (<code>"min"</code> or
   *   <code>"max"</code> or <code>"ideal"</code> or <code>"exact"</code> etc configurations).</small>
   * @param {Number|JSON} [peerInfo.settings.video.frameRate] The Peer Stream video
   *   <a href="https://en.wikipedia.org/wiki/Frame_rate">frameRate</a> per second (fps) or video frameRate settings.
   *   <small>When defined as a JSON object, it is the user set frameRate settings with (<code>"min"</code> or
   *   <code>"max"</code> or <code>"ideal"</code> or <code>"exact"</code> etc configurations).</small>
   * @param {Boolean} peerInfo.settings.video.screenshare The flag if Peer Stream is a screensharing Stream.
   * @param {Array} [peerInfo.settings.video.optional] The Peer Stream <code>navigator.getUserMedia()</code> API
   *   <code>video: { optional [..] }</code> property.
   * @param {String} [peerInfo.settings.video.deviceId] The Peer Stream video track source ID of the device used.
   * @param {Boolean} peerInfo.settings.video.exactConstraints The flag if Peer Stream video track is sending exact
   *   requested values of <code>peerInfo.settings.video.resolution</code>,
   *   <code>peerInfo.settings.video.frameRate</code> and <code>peerInfo.settings.video.deviceId</code>
   *   when provided.
   * @param {String|JSON} [peerInfo.settings.video.facingMode] The Peer Stream video camera facing mode.
   *   <small>When defined as a JSON object, it is the user set facingMode settings with (<code>"min"</code> or
   *   <code>"max"</code> or <code>"ideal"</code> or <code>"exact"</code> etc configurations).</small>
   * @param {JSON} peerInfo.settings.bandwidth The maximum streaming bandwidth sent from Peer.
   * @param {Number} [peerInfo.settings.bandwidth.audio] The maximum audio streaming bandwidth sent from Peer.
   * @param {Number} [peerInfo.settings.bandwidth.video] The maximum video streaming bandwidth sent from Peer.
   * @param {Number} [peerInfo.settings.bandwidth.data] The maximum data streaming bandwidth sent from Peer.
   * @param {JSON} peerInfo.settings.googleXBandwidth <blockquote class="info">
   *   Note that this feature might not work depending on the browser support and implementation,
   *   and its properties and values are only defined for User's end and cannot be viewed
   *   from Peer's end (when <code>isSelf</code> value is <code>false</code>).</blockquote>
   *   The experimental google video streaming bandwidth sent to Peers.
   * @param {Number} [peerInfo.settings.googleXBandwidth.min] The minimum experimental google video streaming bandwidth sent to Peers.
   * @param {Number} [peerInfo.settings.googleXBandwidth.max] The maximum experimental google video streaming bandwidth sent to Peers.
   * @param {JSON} peerInfo.mediaStatus The Peer Stream muted settings.
   * @param {Boolean} peerInfo.mediaStatus.audioMuted The flag if Peer Stream audio tracks is muted or not.
   *   <small>If Peer <code>peerInfo.settings.audio</code> is false, this will be defined as <code>true</code>.</small>
   * @param {Boolean} peerInfo.mediaStatus.videoMuted The flag if Peer Stream video tracks is muted or not.
   *   <small>If Peer <code>peerInfo.settings.video</code> is false, this will be defined as <code>true</code>.</small>
   * @param {JSON} peerInfo.agent The Peer agent information.
   * @param {String} peerInfo.agent.name The Peer agent name.
   *   <small>Data may be accessing browser or non-Web SDK name.</small>
   * @param {Number} peerInfo.agent.version The Peer agent version.
   *   <small>Data may be accessing browser or non-Web SDK version. If the original value is <code>"0.9.6.1"</code>,
   *   it will be interpreted as <code>0.90601</code> where <code>0</code> helps to seperate the minor dots.</small>
   * @param {String} [peerInfo.agent.os] The Peer platform name.
   *  <small>Data may be accessing OS platform version from Web SDK.</small>
   * @param {String} [peerInfo.agent.pluginVersion] The Peer Temasys Plugin version.
   *  <small>Defined only when Peer is using the Temasys Plugin (IE / Safari).</small>
   * @param {String} peerInfo.agent.DTProtocolVersion The Peer data transfer (DT) protocol version.
   * @param {String} peerInfo.agent.SMProtocolVersion The Peer signaling message (SM) protocol version.
   * @param {String} peerInfo.room The Room Peer is from.
   * @param {JSON} peerInfo.config The Peer connection configuration.
   * @param {Boolean} peerInfo.config.enableIceTrickle The flag if Peer connection has
   *   trickle ICE enabled or faster connectivity.
   * @param {Boolean} peerInfo.config.enableDataChannel The flag if Datachannel connections would be enabled for Peer.
   * @param {Boolean} peerInfo.config.enableIceRestart The flag if Peer connection has ICE connection restart support.
   *   <small>Note that ICE connection restart support is not honoured for MCU enabled Peer connection.</small>
   * @param {Number} peerInfo.config.priorityWeight The flag if Peer or User should be the offerer.
   *   <small>If User's <code>priorityWeight</code> is higher than Peer's, User is the offerer, else Peer is.
   *   However for the case where the MCU is connected, User will always be the offerer.</small>
   * @param {Boolean} peerInfo.config.publishOnly The flag if Peer is publishing only stream but not receiving streams.
   * @param {Boolean} peerInfo.config.receiveOnly The flag if Peer is receiving only streams but not publishing stream.
   * @param {String} [peerInfo.parentId] The parent Peer ID that it is matched to for multi-streaming connections.
   * @param {Boolean} isSelf The flag if Peer is User.
   * @for Skylink
   * @since 0.5.2
   */
  peerJoined: [],

  /**
   * Event triggered when a Peer connection has been refreshed.
   * @event peerRestart
   * @param {String} peerId The Peer ID.
   * @param {JSON} peerInfo The Peer session information.
   *   <small>Object signature matches the <code>peerInfo</code> parameter payload received in the
   *   <a href="#event_peerJoined"><code>peerJoined</code> event</a>.</small>
   * @param {Boolean} isSelfInitiateRestart The flag if User is initiating the Peer connection refresh.
   * @param {Boolean} isIceRestart The flag if Peer connection ICE connection will restart.
   * @for Skylink
   * @since 0.5.5
   */
  peerRestart: [],

  /**
   * Event triggered when a Peer session information has been updated.
   * @event peerUpdated
   * @param {String} peerId The Peer ID.
   * @param {JSON} peerInfo The Peer session information.
   *   <small>Object signature matches the <code>peerInfo</code> parameter payload received in the
   *   <a href="#event_peerJoined"><code>peerJoined</code> event</a>.</small>
   * @param {Boolean} isSelf The flag if Peer is User.
   * @for Skylink
   * @since 0.5.2
   */
  peerUpdated: [],

  /**
   * Event triggered when a Peer leaves the room.
   * @event peerLeft
   * @param {String} peerId The Peer ID.
   * @param {JSON} peerInfo The Peer session information.
   *   <small>Object signature matches the <code>peerInfo</code> parameter payload received in the
   *   <a href="#event_peerJoined"><code>peerJoined</code> event</a>.</small>
   * @param {Boolean} isSelf The flag if Peer is User.
   * @for Skylink
   * @since 0.5.2
   */
  peerLeft: [],

  /**
   * Event triggered when Room session has ended abruptly due to network disconnections.
   * @event sessionDisconnect
   * @param {String} peerId The User's Room session Peer ID.
   * @param {JSON} peerInfo The User's Room session information.
   *   <small>Object signature matches the <code>peerInfo</code> parameter payload received in the
   *   <a href="#event_peerJoined"><code>peerJoined</code> event</a>.</small>
   * @for Skylink
   * @since 0.6.10
   */
  sessionDisconnect: [],

  /**
   * Event triggered when receiving Peer Stream.
   * @event incomingStream
   * @param {String} peerId The Peer ID.
   * @param {MediaStream} stream The Stream object.
   *   <small>To attach it to an element: <code>attachMediaStream(videoElement, stream);</code>.</small>
   * @param {Boolean} isSelf The flag if Peer is User.
   * @param {JSON} peerInfo The Peer session information.
   *   <small>Object signature matches the <code>peerInfo</code> parameter payload received in the
   *   <a href="#event_peerJoined"><code>peerJoined</code> event</a>.</small>
   * @param {Boolean} isScreensharing The flag if Peer Stream is a screensharing Stream.
   * @param {String} streamId The Stream ID.
   * @for Skylink
   * @since 0.5.5
   */
  incomingStream: [],

  /**
   * Event triggered when receiving message from Peer.
   * @event incomingMessage
   * @param {JSON} message The message result.
   * @param {JSON|String} message.content The message object.
   * @param {String} message.senderPeerId The sender Peer ID.
   * @param {String|Array} [message.targetPeerId] The value of the <code>targetPeerId</code>
   *   defined in <a href="#method_sendP2PMessage"><code>sendP2PMessage()</code> method</a> or
   *   <a href="#method_sendMessage"><code>sendMessage()</code> method</a>.
   *   <small>Defined as User's Peer ID when <code>isSelf</code> payload value is <code>false</code>.</small>
   *   <small>Defined as <code>null</code> when provided <code>targetPeerId</code> in
   *   <a href="#method_sendP2PMessage"><code>sendP2PMessage()</code> method</a> or
   *   <a href="#method_sendMessage"><code>sendMessage()</code> method</a> is not defined.</small>
   * @param {Array} [message.listOfPeers] The list of Peers that the message has been sent to.
   *  <small>Defined only when <code>isSelf</code> payload value is <code>true</code>.</small>
   * @param {Boolean} message.isPrivate The flag if message is targeted or not, basing
   *   off the <code>targetPeerId</code> parameter being defined in
   *   <a href="#method_sendP2PMessage"><code>sendP2PMessage()</code> method</a> or
   *   <a href="#method_sendMessage"><code>sendMessage()</code> method</a>.
   * @param {Boolean} message.isDataChannel The flag if message is sent from
   *   <a href="#method_sendP2PMessage"><code>sendP2PMessage()</code> method</a>.
   * @param {String} peerId The Peer ID.
   * @param {JSON} peerInfo The Peer session information.
   *   <small>Object signature matches the <code>peerInfo</code> parameter payload received in the
   *   <a href="#event_peerJoined"><code>peerJoined</code> event</a>.</small>
   * @param {Boolean} isSelf The flag if Peer is User.
   * @for Skylink
   * @since 0.5.2
   */
  incomingMessage: [],

  /**
   * Event triggered when receiving completed data transfer from Peer.
   * @event incomingData
   * @param {Blob|String} data The data.
   * @param {String} transferId The data transfer ID.
   * @param {String} peerId The Peer ID.
   * @param {JSON} transferInfo The data transfer information.
   *   <small>Object signature matches the <code>transferInfo</code> parameter payload received in the
   *   <a href="#event_dataTransferState"><code>dataTransferState</code> event</a>
   *   except without the <code>data</code> property.</small>
   * @param {Boolean} isSelf The flag if Peer is User.
   * @for Skylink
   * @since 0.6.1
   */
  incomingData: [],

  /**
   * Event triggered when receiving upload data transfer from Peer.
   * @event incomingDataRequest
   * @param {String} transferId The transfer ID.
   * @param {String} peerId The Peer ID.
   * @param {String} transferInfo The data transfer information.
   *   <small>Object signature matches the <code>transferInfo</code> parameter payload received in the
   *   <a href="#event_dataTransferState"><code>dataTransferState</code> event</a>
   *   except without the <code>data</code> property.</small>
   * @param {Boolean} isSelf The flag if Peer is User.
   * @for Skylink
   * @since 0.6.1
   */
  incomingDataRequest: [],

  /**
   * Event triggered when data streaming session has been started from Peer to User.
   * @event incomingDataStreamStarted
   * @param {String} streamId The data streaming session ID.
   * @param {String} peerId The Peer ID.
   * @param {JSON} streamInfo The data streaming session information.
   *   <small>Object signature matches the <code>streamInfo</code> parameter payload received in the
   *   <a href="#event_dataStreamState"><code>dataStreamState</code> event</a>
   *   except without the <code>chunk</code> property.</small>
   * @param {Boolean} isSelf The flag if Peer is User.
   * @for Skylink
   * @since 0.6.18
   */
  incomingDataStreamStarted: [],

  /**
   * Event triggered when data streaming session has been stopped from Peer to User.
   * @event incomingDataStreamStopped
   * @param {String} streamId The data streaming session ID.
   * @param {String} peerId The Peer ID.
   * @param {JSON} streamInfo The data streaming session information.
   *   <small>Object signature matches the <code>streamInfo</code> parameter payload received in the
   *   <a href="#event_dataStreamState"><code>dataStreamState</code> event</a>
   *   except without the <code>chunk</code> property.</small>
   * @param {Boolean} isSelf The flag if Peer is User.
   * @for Skylink
   * @since 0.6.18
   */
  incomingDataStreamStopped: [],

  /**
   * Event triggered when data streaming session has been stopped from Peer to User.
   * @event incomingDataStream
   * @param {Blob|String} chunk The data chunk received.
   * @param {String} streamId The data streaming session ID.
   * @param {String} peerId The Peer ID.
   * @param {JSON} streamInfo The data streaming session information.
   *   <small>Object signature matches the <code>streamInfo</code> parameter payload received in the
   *   <a href="#event_dataStreamState"><code>dataStreamState</code> event</a>
   *   except without the <code>chunk</code> property.</small>
   * @param {Boolean} isSelf The flag if Peer is User.
   * @for Skylink
   * @since 0.6.18
   */
  incomingDataStream: [],

  /**
   * Event triggered when Room locked status has changed.
   * @event roomLock
   * @param {Boolean} isLocked The flag if Room is locked.
   * @param {String} peerId The Peer ID.
   * @param {JSON} peerInfo The Peer session information.
   *   <small>Object signature matches the <code>peerInfo</code> parameter payload received in the
   *   <a href="#event_peerJoined"><code>peerJoined</code> event</a>.</small>
   * @param {Boolean} isSelf The flag if User changed the Room locked status.
   * @for Skylink
   * @since 0.5.2
   */
  roomLock: [],

  /**
   * Event triggered when a Datachannel connection state has changed.
   * @event dataChannelState
   * @param {String} state The current Datachannel connection state.
   *   [Rel: Skylink.DATA_CHANNEL_STATE]
   * @param {String} peerId The Peer ID.
   * @param {Error} [error] The error object.
   *   <small>Defined only when <code>state</code> payload is <code>ERROR</code> or <code>SEND_MESSAGE_ERROR</code>.</small>
   * @param {String} channelName The Datachannel ID.
   * @param {String} channelType The Datachannel type.
   *   [Rel: Skylink.DATA_CHANNEL_TYPE]
   * @param {String} messageType The Datachannel sending Datachannel message error type.
   *   <small>Defined only when <cod>state</code> payload is <code>SEND_MESSAGE_ERROR</code>.</small>
   *   [Rel: Skylink.DATA_CHANNEL_MESSAGE_ERROR]
   * @for Skylink
   * @since 0.1.0
   */
  dataChannelState: [],

  /**
   * Event triggered when a data transfer state has changed.
   * @event dataTransferState
   * @param {String} state The current data transfer state.
   *   [Rel: Skylink.DATA_TRANSFER_STATE]
   * @param {String} transferId The data transfer ID.
   *   <small>Note that this is defined as <code>null</code> when <code>state</code> payload is <code>START_ERROR</code>.</small>
   * @param {String} peerId The Peer ID.
   *   <small>Note that this could be defined as <code>null</code> when <code>state</code> payload is
   *   <code>START_ERROR</code> and there is no Peers to start data transfer with.</small>
   * @param {JSON} transferInfo The data transfer information.
   * @param {Blob|String} [transferInfo.data] The data object.
   *   <small>Defined only when <code>state</code> payload is <code>UPLOAD_STARTED</code> or
   *   <code>DOWNLOAD_COMPLETED</code>.</small>
   * @param {String} transferInfo.name The data transfer name.
   * @param {Number} transferInfo.size The data transfer data object size.
   * @param {String} transferInfo.dataType The data transfer session type.
   *   [Rel: Skylink.DATA_TRANSFER_SESSION_TYPE]
   * @param {String} transferInfo.chunkType The data transfer type of data chunk being used to send to Peer for transfers.
   *   <small>For <a href="#method_sendBlobData"><code>sendBlobData()</code> method</a> data transfers, the
   *   initial data chunks value may change depending on the currently received data chunk type or the
   *   agent supported sending type of data chunks.</small>
   *   <small>For <a href="#method_sendURLData"><code>sendURLData()</code> method</a> data transfers, it is
   *   <code>STRING</code> always.</small>
   *   [Rel: Skylink.DATA_TRANSFER_DATA_TYPE]
   * @param {String} [transferInfo.mimeType] The data transfer data object MIME type.
   *   <small>Defined only when <a href="#method_sendBlobData"><code>sendBlobData()</code> method</a>
   *   data object sent MIME type information is defined.</small>
   * @param {Number} transferInfo.chunkSize The data transfer data chunk size.
   * @param {Number} transferInfo.percentage The data transfer percentage of completion progress.
   * @param {Number} transferInfo.timeout The flag if data transfer is targeted or not, basing
   *   off the <code>targetPeerId</code> parameter being defined in
   *   <a href="#method_sendURLData"><code>sendURLData()</code> method</a> or
   *   <a href="#method_sendBlobData"><code>sendBlobData()</code> method</a>.
   * @param {Boolean} transferInfo.isPrivate The flag if message is targeted or not, basing
   *   off the <code>targetPeerId</code> parameter being defined in
   *   <a href="#method_sendBlobData"><code>sendBlobData()</code> method</a> or
   *   <a href="#method_sendURLData"><code>sendURLData()</code> method</a>.
   * @param {String} transferInfo.direction The data transfer direction.
   *   [Rel: Skylink.DATA_TRANSFER_TYPE]
   * @param {JSON} [error] The error result.
   *   <small>Defined only when <code>state</code> payload is <code>ERROR</code>, <code>CANCEL</code>,
   *   <code>REJECTED</code>, <code>START_ERROR</code> or <code>USER_REJECTED</code>.</small>
   * @param {Error|String} error.message The error object.
   * @param {String} error.transferType The data transfer direction from where the error occurred.
   *   [Rel: Skylink.DATA_TRANSFER_TYPE]
   * @for Skylink
   * @since 0.4.1
   */
  dataTransferState: [],

  /**
   * Event triggered when a data streaming state has changed.
   * @event dataStreamState
   * @param {String} state The current data streaming state.
   *   [Rel: Skylink.DATA_STREAM_STATE]
   * @param {String} streamId The data streaming session ID.
   *   <small>Note that this is defined as <code>null</code> when <code>state</code> payload is <code>START_ERROR</code>.</small>
   * @param {String} peerId The Peer ID.
   *   <small>Note that this could be defined as <code>null</code> when <code>state</code> payload is
   *   <code>START_ERROR</code> and there is no Peers to start data streaming with.</small>
   * @param {JSON} streamInfo The data streaming information.
   * @param {Blob|String} [streamInfo.chunk] The data chunk received.
   *   <small>Defined only when <code>state</code> payload is <code>RECEIVED</code> or <code>SENT</code>.</small>
   * @param {Number} streamInfo.chunkSize The data streaming data chunk size received.
   * @param {String} streamInfo.chunkType The data streaming data chunk type received.
   *   <small>The initial data chunks value may change depending on the currently received data chunk type or the
   *   agent supported sending type of data chunks.</small>
   *   [Rel: Skylink.DATA_TRANSFER_DATA_TYPE]
   * @param {String} streamInfo.isStringStream The flag if data streaming data chunks are strings.
   * @param {Boolean} streamInfo.isPrivate The flag if data streaming is targeted or not, basing
   *   off the <code>targetPeerId</code> parameter being defined in
   *   <a href="#method_startStreamingData"><code>startStreamingData()</code> method</a>.
   * @param {String} streamInfo.senderPeerId The sender Peer ID.
   * @param {Error} [error] The error object.
   *   <small>Defined only when <code>state</code> payload is <code>ERROR</code> or <code>START_ERROR</code>,.</small>
   * @for Skylink
   * @since 0.6.18
   */
  dataStreamState: [],

  /**
   * Event triggered when Signaling server reaction state has changed.
   * @event systemAction
   * @param {String} action The current Signaling server reaction state.
   *   [Rel: Skylink.SYSTEM_ACTION]
   * @param {String} message The message.
   * @param {String} reason The Signaling server reaction state reason of action code.
   *   [Rel: Skylink.SYSTEM_ACTION_REASON]
   * @for Skylink
   * @since 0.5.1
   */
  systemAction: [],

  /**
   * Event triggered when a server Peer joins the room.
   * @event serverPeerJoined
   * @param {String} peerId The Peer ID.
   * @param {String} serverPeerType The server Peer type
   *   [Rel: Skylink.SERVER_PEER_TYPE]
   * @for Skylink
   * @since 0.6.1
   */
  serverPeerJoined: [],

  /**
   * Event triggered when a server Peer leaves the room.
   * @event serverPeerLeft
   * @param {String} peerId The Peer ID.
   * @param {String} serverPeerType The server Peer type
   *   [Rel: Skylink.SERVER_PEER_TYPE]
   * @for Skylink
   * @since 0.6.1
   */
  serverPeerLeft: [],

  /**
   * Event triggered when a server Peer connection has been refreshed.
   * @event serverPeerRestart
   * @param {String} peerId The Peer ID.
   * @param {String} serverPeerType The server Peer type
   *   [Rel: Skylink.SERVER_PEER_TYPE]
   * @for Skylink
   * @since 0.6.1
   */
  serverPeerRestart: [],

  /**
   * Event triggered when a Peer Stream streaming has stopped.
   * <small>Note that it may not be the currently sent Stream to User, and it also triggers
   * when User leaves the Room for any currently sent Stream to User from Peer.</small>
   * @event streamEnded
   * @param {String} peerId The Peer ID.
   * @param {JSON} peerInfo The Peer session information.
   *   <small>Object signature matches the <code>peerInfo</code> parameter payload received in the
   *   <a href="#event_peerJoined"><code>peerJoined</code> event</a>.</small>
   * @param {Boolean} isSelf The flag if Peer is User.
   * @param {Boolean} isScreensharing The flag if Peer Stream is a screensharing Stream.
   * @param {String} streamId The Stream ID.
   * @for Skylink
   * @since 0.5.10
   */
  streamEnded: [],

  /**
   * Event triggered when Peer Stream audio or video tracks has been muted / unmuted.
   * @event streamMuted
   * @param {String} peerId The Peer ID.
   * @param {JSON} peerInfo The Peer session information.
   *   <small>Object signature matches the <code>peerInfo</code> parameter payload received in the
   *   <a href="#event_peerJoined"><code>peerJoined</code> event</a>.</small>
   * @param {Boolean} isSelf The flag if Peer is User.
   * @param {Boolean} isScreensharing The flag if Peer Stream is a screensharing Stream.
   * @for Skylink
   * @since 0.6.1
   */
  streamMuted: [],

  /**
   * Event triggered when <a href="#method_getPeers"><code>getPeers()</code> method</a> retrieval state changes.
   * @event getPeersStateChange
   * @param {String} state The current <code>getPeers()</code> retrieval state.
   *   [Rel: Skylink.GET_PEERS_STATE]
   * @param {String} privilegedPeerId The User's privileged Peer ID.
   * @param {JSON} peerList The list of Peer IDs Rooms within the same App space.
   * @param {Array} peerList.#room The list of Peer IDs associated with the Room defined in <code>#room</code> property.
   * @for Skylink
   * @since 0.6.1
   */
  getPeersStateChange: [],

  /**
   * Event triggered when <a href="#method_introducePeer"><code>introducePeer()</code> method</a>
   * introduction request state changes.
   * @event introduceStateChange
   * @param {String} state The current <code>introducePeer()</code> introduction request state.
   *   [Rel: Skylink.INTRODUCE_STATE]
   * @param {String} privilegedPeerId The User's privileged Peer ID.
   * @param {String} sendingPeerId The Peer ID to be connected with <code>receivingPeerId</code>.
   * @param {String} receivingPeerId The Peer ID to be connected with <code>sendingPeerId</code>.
   * @param {String} [reason] The error object.
   *   <small>Defined only when <code>state</code> payload is <code>ERROR</code>.</small>
   * @for Skylink
   * @since 0.6.1
   */
  introduceStateChange: [],

  /**
   * Event triggered when recording session state has changed.
   * @event recordingState
   * @param {Number} state The current recording session state.
   *   [Rel: Skylink.RECORDING_STATE]
   * @param {String} recordingId The recording session ID.
   * @param {JSON} link The recording session mixin videos link in
   *   <a href="https://en.wikipedia.org/wiki/MPEG-4_Part_14">MP4</a> format.
   *   <small>Defined only when <code>state</code> payload is <code>LINK</code>.</small>
   * @param {String} link.#peerId The recording session recorded Peer only video associated
   *   with the Peer ID defined in <code>#peerId</code> property.
   *   <small>If <code>#peerId</code> value is <code>"mixin"</code>, it means that is the mixin
   *   video of all Peers in the Room.</small>
   * @param {Error|String} error The error object.
   *   <small>Defined only when <code>state</code> payload is <code>ERROR</code>.</small>
   * @beta
   * @for Skylink
   * @since 0.6.16
   */
  recordingState: [],

  /**
   * Event triggered when <a href="#method_getConnectionStatus"><code>getConnectionStatus()</code> method</a>
   * retrieval state changes.
   * @event getConnectionStatusStateChange
   * @param {Number} state The current <code>getConnectionStatus()</code> retrieval state.
   *   [Rel: Skylink.GET_CONNECTION_STATUS_STATE]
   * @param {String} peerId The Peer ID.
   * @param {JSON} [stats] The Peer connection current stats.
   *   <small>Defined only when <code>state</code> payload is <code>RETRIEVE_SUCCESS</code>.</small>
   * @param {JSON} stats.raw The Peer connection raw stats before parsing.
   * @param {JSON} stats.audio The Peer connection audio streaming stats.
   * @param {JSON} stats.audio.sending The Peer connection sending audio streaming stats.
   * @param {Number} stats.audio.sending.bytes The Peer connection current sending audio streaming bytes.
   *   <small>Note that value is in bytes so you have to convert that to bits for displaying for an example kbps.</small>
   * @param {Number} stats.audio.sending.totalBytes The Peer connection total sending audio streaming bytes.
   *   <small>Note that value is in bytes so you have to convert that to bits for displaying for an example kbps.</small>
   * @param {Number} stats.audio.sending.packets The Peer connection current sending audio streaming packets.
   * @param {Number} stats.audio.sending.totalPackets The Peer connection total sending audio streaming packets.
   * @param {Number} stats.audio.sending.packetsLost <blockquote class="info">
   *   This property has been deprecated and would be removed in future releases
   *   as it should not be in <code>sending</code> property.
   *   </blockquote> The Peer connection current sending audio streaming packets lost.
   * @param {Number} stats.audio.sending.totalPacketsLost <blockquote class="info">
   *   This property has been deprecated and would be removed in future releases
   *   as it should not be in <code>sending</code> property.
   *   </blockquote> The Peer connection total sending audio streaming packets lost.
   * @param {Number} stats.audio.sending.ssrc The Peer connection sending audio streaming RTP packets SSRC.
   * @param {Number} stats.audio.sending.rtt The Peer connection sending audio streaming RTT (Round-trip delay time).
   *   <small>Defined as <code>0</code> if it's not present in original raw stats before parsing.</small>
   * @param {Number} stats.audio.sending.jitter <blockquote class="info">
   *   This property has been deprecated and would be removed in future releases
   *   as it should not be in <code>sending</code> property.
   *   </blockquote> The Peer connection sending audio streaming RTP packets jitter in seconds.
   *   <small>Defined as <code>0</code> if it's not present in original raw stats before parsing.</small>
   * @param {Number} [stats.audio.sending.jitterBufferMs] <blockquote class="info">
   *   This property has been deprecated and would be removed in future releases
   *   as it should not be in <code>sending</code> property.
   *   </blockquote> The Peer connection sending audio streaming
   *   RTP packets jitter buffer in miliseconds.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} [stats.audio.sending.codec] The Peer connection sending audio streaming selected codec information.
   *   <small>Defined as <code>null</code> if local session description is not available before parsing.</small>
   * @param {String} stats.audio.sending.codec.name The Peer connection sending audio streaming selected codec name.
   * @param {Number} stats.audio.sending.codec.payloadType The Peer connection sending audio streaming selected codec payload type.
   * @param {String} [stats.audio.sending.codec.implementation] The Peer connection sending audio streaming selected codec implementation.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.audio.sending.codec.channels] The Peer connection sending audio streaming selected codec channels (2 for stereo).
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing,
   *   and this is usually present in <code>stats.audio</code> property.</small>
   * @param {Number} [stats.audio.sending.codec.clockRate] The Peer connection sending audio streaming selected codec media sampling rate.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.audio.sending.codec.params] The Peer connection sending audio streaming selected codec parameters.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.audio.sending.inputLevel] The Peer connection sending audio streaming input level.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.audio.sending.echoReturnLoss] The Peer connection sending audio streaming echo return loss in db (decibels).
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.audio.sending.echoReturnLossEnhancement] The Peer connection sending audio streaming
   *   echo return loss enhancement db (decibels).
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} stats.audio.receiving The Peer connection receiving audio streaming stats.
   * @param {Number} stats.audio.receiving.bytes The Peer connection current sending audio streaming bytes.
   *   <small>Note that value is in bytes so you have to convert that to bits for displaying for an example kbps.</small>
   * @param {Number} stats.audio.receiving.totalBytes The Peer connection total sending audio streaming bytes.
   *   <small>Note that value is in bytes so you have to convert that to bits for displaying for an example kbps.</small>
   * @param {Number} stats.audio.receiving.packets The Peer connection current receiving audio streaming packets.
   * @param {Number} stats.audio.receiving.totalPackets The Peer connection total receiving audio streaming packets.
   * @param {Number} stats.audio.receiving.packetsLost The Peer connection current receiving audio streaming packets lost.
   * @param {Number} stats.audio.receiving.fractionLost The Peer connection current receiving audio streaming fraction packets lost.
   * @param {Number} stats.audio.receiving.packetsDiscarded The Peer connection current receiving audio streaming packets discarded.
   * @param {Number} stats.audio.receiving.totalPacketsLost The Peer connection total receiving audio streaming packets lost.
   * @param {Number} stats.audio.receiving.totalPacketsDiscarded The Peer connection total receiving audio streaming packets discarded.
   * @param {Number} stats.audio.receiving.ssrc The Peer connection receiving audio streaming RTP packets SSRC.
   * @param {Number} stats.audio.receiving.jitter The Peer connection receiving audio streaming RTP packets jitter in seconds.
   *   <small>Defined as <code>0</code> if it's not present in original raw stats before parsing.</small>
   * @param {Number} [stats.audio.receiving.jitterBufferMs] The Peer connection receiving audio streaming
   *   RTP packets jitter buffer in miliseconds.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} [stats.audio.receiving.codec] The Peer connection receiving audio streaming selected codec information.
   *   <small>Defined as <code>null</code> if remote session description is not available before parsing.</small>
   *   <small>Note that if the value is polyfilled, the value may not be accurate since the remote Peer can override the selected codec.
   *   The value is derived from the remote session description.</small>
   * @param {String} stats.audio.receiving.codec.name The Peer connection receiving audio streaming selected codec name.
   * @param {Number} stats.audio.receiving.codec.payloadType The Peer connection receiving audio streaming selected codec payload type.
   * @param {String} [stats.audio.receiving.codec.implementation] The Peer connection receiving audio streaming selected codec implementation.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.audio.receiving.codec.channels] The Peer connection receiving audio streaming selected codec channels (2 for stereo).
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing,
   *   and this is usually present in <code>stats.audio</code> property.</small>
   * @param {Number} [stats.audio.receiving.codec.clockRate] The Peer connection receiving audio streaming selected codec media sampling rate.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.audio.receiving.codec.params] The Peer connection receiving audio streaming selected codec parameters.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.audio.receiving.outputLevel] The Peer connection receiving audio streaming output level.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} stats.video The Peer connection video streaming stats.
   * @param {JSON} stats.video.sending The Peer connection sending video streaming stats.
   * @param {Number} stats.video.sending.bytes The Peer connection current sending video streaming bytes.
   *   <small>Note that value is in bytes so you have to convert that to bits for displaying for an example kbps.</small>
   * @param {Number} stats.video.sending.totalBytes The Peer connection total sending video streaming bytes.
   *   <small>Note that value is in bytes so you have to convert that to bits for displaying for an example kbps.</small>
   * @param {Number} stats.video.sending.packets The Peer connection current sending video streaming packets.
   * @param {Number} stats.video.sending.totalPackets The Peer connection total sending video streaming packets.
   * @param {Number} stats.video.sending.packetsLost <blockquote class="info">
   *   This property has been deprecated and would be removed in future releases
   *   as it should not be in <code>sending</code> property.
   *   </blockquote> The Peer connection current sending video streaming packets lost.
   * @param {Number} stats.video.sending.totalPacketsLost <blockquote class="info">
   *   This property has been deprecated and would be removed in future releases
   *   as it should not be in <code>sending</code> property.
   *   </blockquote> The Peer connection total sending video streaming packets lost.
   * @param {Number} stats.video.sending.ssrc The Peer connection sending video streaming RTP packets SSRC.
   * @param {Number} stats.video.sending.rtt The Peer connection sending video streaming RTT (Round-trip delay time).
   *   <small>Defined as <code>0</code> if it's not present in original raw stats before parsing.</small>
   * @param {Number} stats.video.sending.jitter <blockquote class="info">
   *   This property has been deprecated and would be removed in future releases
   *   as it should not be in <code>sending</code> property.
   *   </blockquote> The Peer connection sending video streaming RTP packets jitter in seconds.
   *   <small>Defined as <code>0</code> if it's not present in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.jitterBufferMs] <blockquote class="info">
   *   This property has been deprecated and would be removed in future releases
   *   as it should not be in <code>sending</code> property.
   *   </blockquote> The Peer connection sending video streaming RTP packets jitter buffer in miliseconds.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.qpSum] The Peer connection sending video streaming sum of the QP values of frames passed.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} [stats.video.sending.codec] The Peer connection sending video streaming selected codec information.
   *   <small>Defined as <code>null</code> if local session description is not available before parsing.</small>
   * @param {String} stats.video.sending.codec.name The Peer connection sending video streaming selected codec name.
   * @param {Number} stats.video.sending.codec.payloadType The Peer connection sending video streaming selected codec payload type.
   * @param {String} [stats.video.sending.codec.implementation] The Peer connection sending video streaming selected codec implementation.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.codec.channels] The Peer connection sending video streaming selected codec channels (2 for stereo).
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing,
   *   and this is usually present in <code>stats.audio</code> property.</small>
   * @param {Number} [stats.video.sending.codec.clockRate] The Peer connection sending video streaming selected codec media sampling rate.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.video.sending.codec.params] The Peer connection sending video streaming selected codec parameters.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.frames] The Peer connection sending video streaming frames.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.frameRateInput] The Peer connection sending video streaming fps input.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.frameRateInput] The Peer connection sending video streaming fps input.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.framesDropped] The Peer connection sending video streaming frames dropped.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.frameRateMean] The Peer connection sending video streaming fps mean.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.frameRateStdDev] The Peer connection sending video streaming fps standard deviation.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.framesPerSecond] The Peer connection sending video streaming fps.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.framesDecoded] The Peer connection sending video streaming frames decoded.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.framesCorrupted] The Peer connection sending video streaming frames corrupted.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.totalFrames] The Peer connection total sending video streaming frames.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.nacks] The Peer connection current sending video streaming nacks.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.totalNacks] The Peer connection total sending video streaming nacks.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.plis] The Peer connection current sending video streaming plis.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.totalPlis] The Peer connection total sending video streaming plis.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.firs] The Peer connection current sending video streaming firs.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.totalFirs] The Peer connection total sending video streaming firs.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.slis] The Peer connection current sending video streaming slis.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.totalSlis] The Peer connection total sending video streaming slis.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} stats.video.receiving The Peer connection receiving video streaming stats.
   * @param {Number} stats.video.receiving.bytes The Peer connection current receiving video streaming bytes.
   *   <small>Note that value is in bytes so you have to convert that to bits for displaying for an example kbps.</small>
   * @param {Number} stats.video.receiving.totalBytes The Peer connection total receiving video streaming bytes.
   *   <small>Note that value is in bytes so you have to convert that to bits for displaying for an example kbps.</small>
   * @param {Number} stats.video.receiving.packets The Peer connection current receiving video streaming packets.
   * @param {Number} stats.video.receiving.totalPackets The Peer connection total receiving video streaming packets.
   * @param {Number} stats.video.receiving.packetsLost The Peer connection current receiving video streaming packets lost.
   * @param {Number} stats.video.receiving.fractionLost The Peer connection current receiving video streaming fraction packets lost.
   * @param {Number} stats.video.receiving.packetsDiscarded The Peer connection current receiving video streaming packets discarded.
   * @param {Number} stats.video.receiving.totalPacketsLost The Peer connection total receiving video streaming packets lost.
   * @param {Number} stats.video.receiving.totalPacketsDiscarded The Peer connection total receiving video streaming packets discarded.
   * @param {Number} stats.video.receiving.ssrc The Peer connection receiving video streaming RTP packets SSRC.
   * @param {Number} [stats.video.receiving.e2eDelay] The Peer connection receiving video streaming e2e delay.
   *   <small>Defined as <code>null</code> if it's not present in original raw stats before parsing, and that
   *   it finds any existing audio, video or object (plugin) DOM elements that has set with the
   *   Peer remote stream object to parse current time. Note that <code>document.getElementsByTagName</code> function
   *   and DOM <code>.currentTime</code> has to be supported inorder for data to be parsed correctly.</small>
   * @param {Number} stats.video.receiving.jitter The Peer connection receiving video streaming RTP packets jitter in seconds.
   *   <small>Defined as <code>0</code> if it's not present in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.jitterBufferMs] The Peer connection receiving video streaming
   *   RTP packets jitter buffer in miliseconds.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} [stats.video.receiving.codec] The Peer connection receiving video streaming selected codec information.
   *   <small>Defined as <code>null</code> if remote session description is not available before parsing.</small>
   *   <small>Note that if the value is polyfilled, the value may not be accurate since the remote Peer can override the selected codec.
   *   The value is derived from the remote session description.</small>
   * @param {String} stats.video.receiving.codec.name The Peer connection receiving video streaming selected codec name.
   * @param {Number} stats.video.receiving.codec.payloadType The Peer connection receiving video streaming selected codec payload type.
   * @param {String} [stats.video.receiving.codec.implementation] The Peer connection receiving video streaming selected codec implementation.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.codec.channels] The Peer connection receiving video streaming selected codec channels (2 for stereo).
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing,
   *   and this is usually present in <code>stats.audio</code> property.</small>
   * @param {Number} [stats.video.receiving.codec.clockRate] The Peer connection receiving video streaming selected codec media sampling rate.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.video.receiving.codec.params] The Peer connection receiving video streaming selected codec parameters.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.frames] The Peer connection receiving video streaming frames.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.framesOutput] The Peer connection receiving video streaming fps output.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.framesDecoded] The Peer connection receiving video streaming frames decoded.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.frameRateMean] The Peer connection receiving video streaming fps mean.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.frameRateStdDev] The Peer connection receiving video streaming fps standard deviation.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.framesPerSecond] The Peer connection receiving video streaming fps.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.framesDecoded] The Peer connection receiving video streaming frames decoded.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.framesCorrupted] The Peer connection receiving video streaming frames corrupted.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.totalFrames] The Peer connection total receiving video streaming frames.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.nacks] The Peer connection current receiving video streaming nacks.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.totalNacks] The Peer connection total receiving video streaming nacks.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.plis] The Peer connection current receiving video streaming plis.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.totalPlis] The Peer connection total receiving video streaming plis.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.firs] The Peer connection current receiving video streaming firs.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.totalFirs] The Peer connection total receiving video streaming firs.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.slis] The Peer connection current receiving video streaming slis.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.totalPlis] The Peer connection total receiving video streaming slis.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} stats.selectedCandidate The Peer connection selected ICE candidate pair stats.
   * @param {JSON} stats.selectedCandidate.local The Peer connection selected local ICE candidate.
   * @param {String} stats.selectedCandidate.local.ipAddress The Peer connection selected
   *   local ICE candidate IP address.
   * @param {Number} stats.selectedCandidate.local.portNumber The Peer connection selected
   *   local ICE candidate port number.
   * @param {String} stats.selectedCandidate.local.transport The Peer connection selected
   *   local ICE candidate IP transport type.
   * @param {String} stats.selectedCandidate.local.candidateType The Peer connection selected
   *   local ICE candidate type.
   * @param {String} [stats.selectedCandidate.local.turnMediaTransport] The Peer connection possible
   *   transport used when relaying local media to TURN server.
   *   <small>Types are <code>"UDP"</code> (UDP connections), <code>"TCP"</code> (TCP connections) and
   *   <code>"TCP/TLS"</code> (TCP over TLS connections).</small>
   * @param {JSON} stats.selectedCandidate.remote The Peer connection selected remote ICE candidate.
   * @param {String} stats.selectedCandidate.remote.ipAddress The Peer connection selected
   *   remote ICE candidate IP address.
   * @param {Number} stats.selectedCandidate.remote.portNumber The Peer connection selected
   *   remote ICE candidate port number.
   * @param {String} stats.selectedCandidate.remote.transport The Peer connection selected
   *   remote ICE candidate IP transport type.
   * @param {String} stats.selectedCandidate.remote.candidateType The Peer connection selected
   *   remote ICE candidate type.
   * @param {Boolean} [stats.selectedCandidate.writable] The flag if Peer has gotten ACK to an ICE request.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Boolean} [stats.selectedCandidate.readable] The flag if Peer has gotten a valid incoming ICE request.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.rtt] The current STUN connectivity checks RTT (Round-trip delay time).
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.totalRtt] The total STUN connectivity checks RTT (Round-trip delay time).
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} stats.selectedCandidate.requests The ICE connectivity check requests.
   * @param {String} [stats.selectedCandidate.requests.received] The current ICE connectivity check requests received.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.requests.sent] The current ICE connectivity check requests sent.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.requests.totalReceived] The total ICE connectivity check requests received.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.requests.totalSent] The total ICE connectivity check requests sent.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} stats.selectedCandidate.responses The ICE connectivity check responses.
   * @param {String} [stats.selectedCandidate.responses.received] The current ICE connectivity check responses received.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.responses.sent] The current ICE connectivity check responses sent.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.responses.totalReceived] The total ICE connectivity check responses received.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.responses.totalSent] The total ICE connectivity check responses sent.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} stats.selectedCandidate.consentRequests The current ICE consent requests.
   * @param {String} [stats.selectedCandidate.consentRequests.received] The current ICE consent requests received.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.consentRequests.sent] The current ICE consent requests sent.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.consentRequests.totalReceived] The total ICE consent requests received.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.consentRequests.totalSent] The total ICE consent requests sent.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} stats.selectedCandidate.consentResponses The current ICE consent responses.
   * @param {String} [stats.selectedCandidate.consentResponses.received] The current ICE consent responses received.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.consentResponses.sent] The current ICE consent responses sent.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.consentResponses.totalReceived] The total ICE consent responses received.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.consentResponses.totalSent] The total ICE consent responses sent.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} stats.certificate The Peer connection DTLS/SRTP exchanged certificates information.
   * @param {JSON} stats.certificate.local The Peer connection local certificate information.
   * @param {String} [stats.certificate.local.fingerprint] The Peer connection local certificate fingerprint.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.certificate.local.fingerprintAlgorithm] The Peer connection local
   *   certificate fingerprint algorithm.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.certificate.local.derBase64] The Peer connection local
   *   base64 certificate in binary DER format encoded in base64.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} stats.certificate.remote The Peer connection remote certificate information.
   * @param {String} [stats.certificate.remote.fingerprint] The Peer connection remote certificate fingerprint.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.certificate.remote.fingerprintAlgorithm] The Peer connection remote
   *   certificate fingerprint algorithm.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.certificate.remote.derBase64] The Peer connection remote
   *   base64 certificate in binary DER format encoded in base64.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.certificate.srtpCipher] The certificates SRTP cipher.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.certificate.dtlsCipher] The certificates DTLS cipher.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} stats.connection The Peer connection object stats.
   * @param {String} stats.connection.iceConnectionState The Peer connection ICE connection state.
   * @param {String} stats.connection.iceGatheringState The Peer connection ICE gathering state.
   * @param {String} stats.connection.signalingState The Peer connection signaling state.
   * @param {JSON} stats.connection.localDescription The Peer connection local session description.
   * @param {String} stats.connection.localDescription.type The Peer connection local session description type.
   *   <small>Defined as <code>null</code> when local session description is not available.</small>
   * @param {String} stats.connection.localDescription.sdp The Peer connection local session description SDP.
   *   <small>Defined as <code>null</code> when local session description is not available.</small>
   * @param {JSON} stats.connection.remoteDescription The Peer connection remote session description.
   * @param {String} stats.connection.remoteDescription.type The Peer connection remote session description type.
   *   <small>Defined as <code>null</code> when remote session description is not available.</small>
   * @param {String} stats.connection.remoteDescription.sdp The Peer connection remote session description sdp.
   *   <small>Defined as <code>null</code> when remote session description is not available.</small>
   * @param {JSON} stats.connection.candidates The Peer connection list of ICE candidates sent or received.
   * @param {JSON} stats.connection.candidates.sending The Peer connection list of local ICE candidates sent.
   * @param {Array} stats.connection.candidates.sending.host The Peer connection list of local
   *   <code>"host"</code> (local network) ICE candidates sent.
   * @param {JSON} stats.connection.candidates.sending.host.#index The Peer connection local
   *   <code>"host"</code> (local network) ICE candidate.
   * @param {String} stats.connection.candidates.sending.host.#index.candidate The Peer connection local
   *   <code>"host"</code> (local network) ICE candidate connection description.
   * @param {String} stats.connection.candidates.sending.host.#index.sdpMid The Peer connection local
   *   <code>"host"</code> (local network) ICE candidate identifier based on the local session description.
   * @param {Number} stats.connection.candidates.sending.host.#index.sdpMLineIndex The Peer connection local
   *   <code>"host"</code> (local network) ICE candidate media description index (starting from <code>0</code>)
   *   based on the local session description.
   * @param {Array} stats.connection.candidates.sending.srflx The Peer connection list of local
   *   <code>"srflx"</code> (STUN) ICE candidates sent.
   * @param {JSON} stats.connection.candidates.sending.srflx.#index The Peer connection local
   *   <code>"srflx"</code> (STUN) ICE candidate.
   * @param {String} stats.connection.candidates.sending.srflx.#index.candidate The Peer connection local
   *   <code>"srflx"</code> (STUN) ICE candidate connection description.
   * @param {String} stats.connection.candidates.sending.srflx.#index.sdpMid The Peer connection local
   *   <code>"srflx"</code> (STUN) ICE candidate identifier based on the local session description.
   * @param {Number} stats.connection.candidates.sending.srflx.#index.sdpMLineIndex The Peer connection local
   *   <code>"srflx"</code> (STUN) ICE candidate media description index (starting from <code>0</code>)
   *   based on the local session description.
   * @param {Array} stats.connection.candidates.sending.relay The Peer connection list of local
   *   <code>"relay"</code> (TURN) candidates sent.
   * @param {JSON} stats.connection.candidates.sending.relay.#index The Peer connection local
   *   <code>"relay"</code> (TURN) ICE candidate.
   * @param {String} stats.connection.candidates.sending.relay.#index.candidate The Peer connection local
   *   <code>"relay"</code> (TURN) ICE candidate connection description.
   * @param {String} stats.connection.candidates.sending.relay.#index.sdpMid The Peer connection local
   *   <code>"relay"</code> (TURN) ICE candidate identifier based on the local session description.
   * @param {Number} stats.connection.candidates.sending.relay.#index.sdpMLineIndex The Peer connection local
   *   <code>"relay"</code> (TURN) ICE candidate media description index (starting from <code>0</code>)
   *   based on the local session description.
   * @param {JSON} stats.connection.candidates.receiving The Peer connection list of remote ICE candidates received.
   * @param {Array} stats.connection.candidates.receiving.host The Peer connection list of remote
   *   <code>"host"</code> (local network) ICE candidates received.
   * @param {JSON} stats.connection.candidates.receiving.host.#index The Peer connection remote
   *   <code>"host"</code> (local network) ICE candidate.
   * @param {String} stats.connection.candidates.receiving.host.#index.candidate The Peer connection remote
   *   <code>"host"</code> (local network) ICE candidate connection description.
   * @param {String} stats.connection.candidates.receiving.host.#index.sdpMid The Peer connection remote
   *   <code>"host"</code> (local network) ICE candidate identifier based on the remote session description.
   * @param {Number} stats.connection.candidates.receiving.host.#index.sdpMLineIndex The Peer connection remote
   *   <code>"host"</code> (local network) ICE candidate media description index (starting from <code>0</code>)
   *   based on the remote session description.
   * @param {Array} stats.connection.candidates.receiving.srflx The Peer connection list of remote
   *   <code>"srflx"</code> (STUN) ICE candidates received.
   * @param {JSON} stats.connection.candidates.receiving.srflx.#index The Peer connection remote
   *   <code>"srflx"</code> (STUN) ICE candidate.
   * @param {String} stats.connection.candidates.receiving.srflx.#index.candidate The Peer connection remote
   *   <code>"srflx"</code> (STUN) ICE candidate connection description.
   * @param {String} stats.connection.candidates.receiving.srflx.#index.sdpMid The Peer connection remote
   *   <code>"srflx"</code> (STUN) ICE candidate identifier based on the remote session description.
   * @param {Number} stats.connection.candidates.receiving.srflx.#index.sdpMLineIndex The Peer connection remote
   *   <code>"srflx"</code> (STUN) ICE candidate media description index (starting from <code>0</code>)
   *   based on the remote session description.
   * @param {Array} stats.connection.candidates.receiving.relay The Peer connection list of remote
   *   <code>"relay"</code> (TURN) ICE candidates received.
   * @param {JSON} stats.connection.candidates.receiving.relay.#index The Peer connection remote
   *   <code>"relay"</code> (TURN) ICE candidate.
   * @param {String} stats.connection.candidates.receiving.relay.#index.candidate The Peer connection remote
   *   <code>"relay"</code> (TURN) ICE candidate connection description.
   * @param {String} stats.connection.candidates.receiving.relay.#index.sdpMid The Peer connection remote
   *   <code>"relay"</code> (TURN) ICE candidate identifier based on the remote session description.
   * @param {Number} stats.connection.candidates.receiving.relay.#index.sdpMLineIndex The Peer connection remote
   *   <code>"relay"</code> (TURN) ICE candidate media description index (starting from <code>0</code>)
   *   based on the remote session description.
   * @param {JSON} stats.connection.dataChannels The Peer connection list of Datachannel connections.
   * @param {JSON} stats.connection.dataChannels.#channelName The Peer connection Datachannel connection stats.
   * @param {String} stats.connection.dataChannels.#channelName.label The Peer connection Datachannel connection ID.
   * @param {String} stats.connection.dataChannels.#channelName.readyState The Peer connection Datachannel connection readyState.
   *   [Rel: Skylink.DATA_CHANNEL_STATE]
   * @param {String} stats.connection.dataChannels.#channelName.type The Peer connection Datachannel connection type.
   *   [Rel: Skylink.DATA_CHANNEL_TYPE]
   * @param {String} stats.connection.dataChannels.#channelName.currentTransferId The Peer connection
   *   Datachannel connection current progressing transfer session ID.
   *   <small>Defined as <code>null</code> when there is currently no transfer session progressing on the Datachannel connection.</small>
   * @param {Error} error The error object received.
   *   <small>Defined only when <code>state</code> payload is <code>RETRIEVE_ERROR</code>.</small>
   * @for Skylink
   * @since 0.6.14
   */
  getConnectionStatusStateChange: [],

  /**
   * Event triggered when <a href="#method_muteStream"><code>muteStream()</code> method</a> changes
   * User Streams audio and video tracks muted status.
   * @event localMediaMuted
   * @param {JSON} mediaStatus The Streams muted settings.
   *   <small>This indicates the muted settings for both
   *   <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a> and
   *   <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a>.</small>
   * @param {Boolean} mediaStatus.audioMuted The flag if all Streams audio tracks is muted or not.
   *   <small>If User's <code>peerInfo.settings.audio</code> is false, this will be defined as <code>true</code>.</small>
   * @param {Boolean} mediaStatus.videoMuted The flag if all Streams video tracks is muted or not.
   *   <small>If User's <code>peerInfo.settings.video</code> is false, this will be defined as <code>true</code>.</small>
   * @for Skylink
   * @since 0.6.15
   */
  localMediaMuted: [],

  /**
   * <blockquote class="info">
   *   Learn more about how ICE works in this
   *   <a href="https://temasys.com.sg/ice-what-is-this-sorcery/">article here</a>.<br>
   *   Note that this event may not be triggered for MCU enabled Peer connections as ICE candidates
   *   may be received in the session description instead.
   * </blockquote>
   * Event triggered when remote ICE candidate processing state has changed when Peer is using trickle ICE.
   * @event candidateProcessingState
   * @param {String} state The ICE candidate processing state.
   *   [Rel: Skylink.CANDIDATE_PROCESSING_STATE]
   * @param {String} peerId The Peer ID.
   * @param {String} candidateId The remote ICE candidate session ID.
   *   <small>Note that this value is not related to WebRTC API but for identification of remote ICE candidate received.</small>
   * @param {String} candidateType The remote ICE candidate type.
   *   <small>Expected values are <code>"host"</code> (local network), <code>"srflx"</code> (STUN) and <code>"relay"</code> (TURN).</small>
   * @param {JSON} candidate The remote ICE candidate.
   * @param {String} candidate.candidate The remote ICE candidate connection description.
   * @param {String} candidate.sdpMid The remote ICE candidate identifier based on the remote session description.
   * @param {Number} candidate.sdpMLineIndex The remote ICE candidate media description index
   *   (starting from <code>0</code>) based on the remote session description.
   * @param {Error} [error] The error object.
   *   <small>Defined only when <code>state</code> is <code>DROPPED</code> or <code>PROCESS_ERROR</code>.</small>
   * @for Skylink
   * @since 0.6.16
   */
  candidateProcessingState: [],

  /**
   * <blockquote class="info">
   *   Learn more about how ICE works in this
   *   <a href="https://temasys.com.sg/ice-what-is-this-sorcery/">article here</a>.<br>
   *   Note that this event may not be triggered for MCU enabled Peer connections as ICE candidates
   *   may be received in the session description instead.
   * </blockquote>
   * Event triggered when all remote ICE candidates gathering has completed and been processed.
   * @event candidatesGathered
   * @param {String} peerId The Peer ID.
   * @param {JSON} length The remote ICE candidates length.
   * @param {Number} length.expected The expected total number of remote ICE candidates to be received.
   * @param {Number} length.received The actual total number of remote ICE candidates received.
   * @param {Number} length.processed The total number of remote ICE candidates processed.
   * @for Skylink
   * @since 0.6.18
   */
  candidatesGathered: []
};
// Object.keys() polyfill - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
!function(){Object.keys||(Object.keys=function(){var t=Object.prototype.hasOwnProperty,r=!{toString:null}.propertyIsEnumerable("toString"),e=["toString","toLocaleString","valueOf","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","constructor"],o=e.length;return function(n){if("object"!=typeof n&&"function"!=typeof n||null===n)throw new TypeError("Object.keys called on non-object");var c=[];for(var l in n)t.call(n,l)&&c.push(l);if(r)for(var p=0;o>p;p++)t.call(n,e[p])&&c.push(e[p]);return c}}())}();
// Date.getISOString() polyfill - https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
!function(){function t(t){return 10>t?"0"+t:t}Date.prototype.toISOString=function(){return this.getUTCFullYear()+"-"+t(this.getUTCMonth()+1)+"-"+t(this.getUTCDate())+"T"+t(this.getUTCHours())+":"+t(this.getUTCMinutes())+":"+t(this.getUTCSeconds())+"."+(this.getUTCMilliseconds()/1e3).toFixed(3).slice(2,5)+"Z"}}();
// Date.now() polyfill
!function(){"function"!=typeof Date.now&&(Date.now=function(){return(new Date).getTime()})}();
// addEventListener() polyfill - https://gist.github.com/eirikbacker/2864711
!function(e,t){function n(e){var n=t[e];t[e]=function(e){return o(n(e))}}function a(t,n,a){return(a=this).attachEvent("on"+t,function(t){var t=t||e.event;t.preventDefault=t.preventDefault||function(){t.returnValue=!1},t.stopPropagation=t.stopPropagation||function(){t.cancelBubble=!0},n.call(a,t)})}function o(e,t){if(t=e.length)for(;t--;)e[t].addEventListener=a;else e.addEventListener=a;return e}e.addEventListener||(o([t,e]),"Element"in e?e.Element.prototype.addEventListener=a:(t.attachEvent("onreadystatechange",function(){o(t.all)}),n("getElementsByTagName"),n("getElementById"),n("createElement"),o(t.all)))}(window,document);
// Promise polyfill - https://github.com/stefanpenner/es6-promise
!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):t.ES6Promise=e()}(this,function(){"use strict";function t(t){return"function"==typeof t||"object"==typeof t&&null!==t}function e(t){return"function"==typeof t}function n(t){I=t}function r(t){J=t}function o(){return function(){return process.nextTick(a)}}function i(){return"undefined"!=typeof H?function(){H(a)}:c()}function s(){var t=0,e=new V(a),n=document.createTextNode("");return e.observe(n,{characterData:!0}),function(){n.data=t=++t%2}}function u(){var t=new MessageChannel;return t.port1.onmessage=a,function(){return t.port2.postMessage(0)}}function c(){var t=setTimeout;return function(){return t(a,1)}}function a(){for(var t=0;t<G;t+=2){var e=$[t],n=$[t+1];e(n),$[t]=void 0,$[t+1]=void 0}G=0}function f(){try{var t=require,e=t("vertx");return H=e.runOnLoop||e.runOnContext,i()}catch(n){return c()}}function l(t,e){var n=arguments,r=this,o=new this.constructor(p);void 0===o[et]&&k(o);var i=r._state;return i?!function(){var t=n[i-1];J(function(){return x(i,o,t,r._result)})}():E(r,o,t,e),o}function h(t){var e=this;if(t&&"object"==typeof t&&t.constructor===e)return t;var n=new e(p);return g(n,t),n}function p(){}function v(){return new TypeError("You cannot resolve a promise with itself")}function d(){return new TypeError("A promises callback cannot return that same promise.")}function _(t){try{return t.then}catch(e){return it.error=e,it}}function y(t,e,n,r){try{t.call(e,n,r)}catch(o){return o}}function m(t,e,n){J(function(t){var r=!1,o=y(n,e,function(n){r||(r=!0,e!==n?g(t,n):S(t,n))},function(e){r||(r=!0,j(t,e))},"Settle: "+(t._label||" unknown promise"));!r&&o&&(r=!0,j(t,o))},t)}function b(t,e){e._state===rt?S(t,e._result):e._state===ot?j(t,e._result):E(e,void 0,function(e){return g(t,e)},function(e){return j(t,e)})}function w(t,n,r){n.constructor===t.constructor&&r===l&&n.constructor.resolve===h?b(t,n):r===it?j(t,it.error):void 0===r?S(t,n):e(r)?m(t,n,r):S(t,n)}function g(e,n){e===n?j(e,v()):t(n)?w(e,n,_(n)):S(e,n)}function A(t){t._onerror&&t._onerror(t._result),T(t)}function S(t,e){t._state===nt&&(t._result=e,t._state=rt,0!==t._subscribers.length&&J(T,t))}function j(t,e){t._state===nt&&(t._state=ot,t._result=e,J(A,t))}function E(t,e,n,r){var o=t._subscribers,i=o.length;t._onerror=null,o[i]=e,o[i+rt]=n,o[i+ot]=r,0===i&&t._state&&J(T,t)}function T(t){var e=t._subscribers,n=t._state;if(0!==e.length){for(var r=void 0,o=void 0,i=t._result,s=0;s<e.length;s+=3)r=e[s],o=e[s+n],r?x(n,r,o,i):o(i);t._subscribers.length=0}}function M(){this.error=null}function P(t,e){try{return t(e)}catch(n){return st.error=n,st}}function x(t,n,r,o){var i=e(r),s=void 0,u=void 0,c=void 0,a=void 0;if(i){if(s=P(r,o),s===st?(a=!0,u=s.error,s=null):c=!0,n===s)return void j(n,d())}else s=o,c=!0;n._state!==nt||(i&&c?g(n,s):a?j(n,u):t===rt?S(n,s):t===ot&&j(n,s))}function C(t,e){try{e(function(e){g(t,e)},function(e){j(t,e)})}catch(n){j(t,n)}}function O(){return ut++}function k(t){t[et]=ut++,t._state=void 0,t._result=void 0,t._subscribers=[]}function Y(t,e){this._instanceConstructor=t,this.promise=new t(p),this.promise[et]||k(this.promise),B(e)?(this._input=e,this.length=e.length,this._remaining=e.length,this._result=new Array(this.length),0===this.length?S(this.promise,this._result):(this.length=this.length||0,this._enumerate(),0===this._remaining&&S(this.promise,this._result))):j(this.promise,q())}function q(){return new Error("Array Methods must be provided an Array")}function F(t){return new Y(this,t).promise}function D(t){var e=this;return new e(B(t)?function(n,r){for(var o=t.length,i=0;i<o;i++)e.resolve(t[i]).then(n,r)}:function(t,e){return e(new TypeError("You must pass an array to race."))})}function K(t){var e=this,n=new e(p);return j(n,t),n}function L(){throw new TypeError("You must pass a resolver function as the first argument to the promise constructor")}function N(){throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.")}function U(t){this[et]=O(),this._result=this._state=void 0,this._subscribers=[],p!==t&&("function"!=typeof t&&L(),this instanceof U?C(this,t):N())}function W(){var t=void 0;if("undefined"!=typeof global)t=global;else if("undefined"!=typeof self)t=self;else try{t=Function("return this")()}catch(e){throw new Error("polyfill failed because global object is unavailable in this environment")}var n=t.Promise;if(n){var r=null;try{r=Object.prototype.toString.call(n.resolve())}catch(e){}if("[object Promise]"===r&&!n.cast)return}t.Promise=U}var z=void 0;z=Array.isArray?Array.isArray:function(t){return"[object Array]"===Object.prototype.toString.call(t)};var B=z,G=0,H=void 0,I=void 0,J=function(t,e){$[G]=t,$[G+1]=e,G+=2,2===G&&(I?I(a):tt())},Q="undefined"!=typeof window?window:void 0,R=Q||{},V=R.MutationObserver||R.WebKitMutationObserver,X="undefined"==typeof self&&"undefined"!=typeof process&&"[object process]"==={}.toString.call(process),Z="undefined"!=typeof Uint8ClampedArray&&"undefined"!=typeof importScripts&&"undefined"!=typeof MessageChannel,$=new Array(1e3),tt=void 0;tt=X?o():V?s():Z?u():void 0===Q&&"function"==typeof require?f():c();var et=Math.random().toString(36).substring(16),nt=void 0,rt=1,ot=2,it=new M,st=new M,ut=0;return Y.prototype._enumerate=function(){for(var t=this.length,e=this._input,n=0;this._state===nt&&n<t;n++)this._eachEntry(e[n],n)},Y.prototype._eachEntry=function(t,e){var n=this._instanceConstructor,r=n.resolve;if(r===h){var o=_(t);if(o===l&&t._state!==nt)this._settledAt(t._state,e,t._result);else if("function"!=typeof o)this._remaining--,this._result[e]=t;else if(n===U){var i=new n(p);w(i,t,o),this._willSettleAt(i,e)}else this._willSettleAt(new n(function(e){return e(t)}),e)}else this._willSettleAt(r(t),e)},Y.prototype._settledAt=function(t,e,n){var r=this.promise;r._state===nt&&(this._remaining--,t===ot?j(r,n):this._result[e]=n),0===this._remaining&&S(r,this._result)},Y.prototype._willSettleAt=function(t,e){var n=this;E(t,void 0,function(t){return n._settledAt(rt,e,t)},function(t){return n._settledAt(ot,e,t)})},U.all=F,U.race=D,U.resolve=h,U.reject=K,U._setScheduler=n,U._setAsap=r,U._asap=J,U.prototype={constructor:U,then:l,"catch":function(t){return this.then(null,t)}},U.polyfill=W,U.Promise=U,U});
// performance.now() polyfill - https://gist.github.com/paulirish/5438650
!function(){if("performance"in window==0&&(window.performance={}),Date.now=Date.now||function(){return(new Date).getTime()},"now"in window.performance==0){var a=Date.now();performance.timing&&performance.timing.navigationStart&&(a=performance.timing.navigationStart),window.performance.now=function(){return Date.now()-a}}}();
/* jshint ignore:end */

// Exports Skylink & SkylinkLogs object
if(typeof exports !== 'undefined') {
  module.exports = {
  	Skylink: Skylink,
  	SkylinkLogs: SkylinkLogs
  };
} else if (globals) {
  globals.Skylink = Skylink;
  globals.SkylinkLogs = SkylinkLogs;
} else if (window) {
  window.Skylink = Skylink;
  window.SkylinkLogs = SkylinkLogs;
}
Skylink.prototype._onIceCandidate = function(targetMid, candidate) {
  var self = this;
  var pc = self._peerConnections[targetMid];

  if (!pc) {
    Log.error(self._debugOptions.instanceId, [targetMid, 'RTCIceCandidate', null, 'Ignoring of ICE candidate event as ' +
      'Peer connection does not exists ->'], candidate);
    return;
  }

  if (candidate.candidate) {
    if (!pc.gathering) {
      Log.log(self._debugOptions.instanceId, [targetMid, 'RTCIceCandidate', null, 'ICE gathering has started.']);

      pc.gathering = true;
      pc.gathered = false;

      self._trigger('candidateGenerationState', self.CANDIDATE_GENERATION_STATE.GATHERING, targetMid);
    }

    var candidateType = candidate.candidate.split(' ')[7];

    Log.debug(self._debugOptions.instanceId, [targetMid, 'RTCIceCandidate', candidateType, 'Generated ICE candidate ->'], candidate);

    if (candidateType === 'endOfCandidates') {
      Log.error(self._debugOptions.instanceId, [targetMid, 'RTCIceCandidate', candidateType, 'Dropping of sending ICE candidate ' +
        'end-of-candidates signal to prevent errors ->'], candidate);
      return;
    }

    if (self._filterCandidatesType[candidateType]) {
      if (!(self._hasMCU && self._forceTURN)) {
        Log.error(self._debugOptions.instanceId, [targetMid, 'RTCIceCandidate', candidateType, 'Dropping of sending ICE candidate as ' +
          'it matches ICE candidate filtering flag ->'], candidate);
        return;
      }

      Log.error(self._debugOptions.instanceId, [targetMid, 'RTCIceCandidate', candidateType, 'Not dropping of sending ICE candidate as ' +
        'TURN connections are enforced as MCU is present (and act as a TURN itself) so filtering of ICE candidate ' +
        'flags are not honoured ->'], candidate);
    }

    if (!self._gatheredCandidates[targetMid]) {
      self._gatheredCandidates[targetMid] = {
        sending: { host: [], srflx: [], relay: [] },
        receiving: { host: [], srflx: [], relay: [] }
      };
    }

    self._gatheredCandidates[targetMid].sending[candidateType].push({
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex,
      candidate: candidate.candidate
    });

    if (!self._enableIceTrickle) {
      Log.error(self._debugOptions.instanceId, [targetMid, 'RTCIceCandidate', candidateType, 'Dropping of sending ICE candidate as ' +
        'trickle ICE is disabled ->'], candidate);
      return;
    }

    Log.debug(self._debugOptions.instanceId, [targetMid, 'RTCIceCandidate', candidateType, 'Sending ICE candidate ->'], candidate);

    self._sendChannelMessage({
      type: self._SIG_MESSAGE_TYPE.CANDIDATE,
      label: candidate.sdpMLineIndex,
      id: candidate.sdpMid,
      candidate: candidate.candidate,
      mid: self._user.sid,
      target: targetMid,
      rid: self._room.id
    });

  } else {
    Log.log(self._debugOptions.instanceId, [targetMid, 'RTCIceCandidate', null, 'ICE gathering has completed.']);

    pc.gathering = false;
    pc.gathered = true;

    self._trigger('candidateGenerationState', self.CANDIDATE_GENERATION_STATE.COMPLETED, targetMid);

    // Disable Ice trickle option
    if (!self._enableIceTrickle) {
      var sessionDescription = self._peerConnections[targetMid].localDescription;

      if (!(sessionDescription && sessionDescription.type && sessionDescription.sdp)) {
        Log.error(self._debugOptions.instanceId, [targetMid, 'RTCSessionDescription', null, 'Not sending any session description after ' +
          'ICE gathering completed as it is not present.']);
        return;
      }

      // a=end-of-candidates should present in non-trickle ICE connections so no need to send endOfCandidates message
      self._sendChannelMessage({
        type: sessionDescription.type,
        sdp: self._addSDPMediaStreamTrackIDs(targetMid, sessionDescription),
        mid: self._user.sid,
        userInfo: self._getUserInfo(),
        target: targetMid,
        rid: self._room.id
      });
    } else if (self._gatheredCandidates[targetMid]) {
      self._sendChannelMessage({
        type: self._SIG_MESSAGE_TYPE.END_OF_CANDIDATES,
        noOfExpectedCandidates: self._gatheredCandidates[targetMid].sending.srflx.length +
          self._gatheredCandidates[targetMid].sending.host.length +
          self._gatheredCandidates[targetMid].sending.relay.length,
        mid: self._user.sid,
        target: targetMid,
        rid: self._room.id
      });
    }
  }
};

/**
 * Function that buffers the Peer connection ICE candidate when received
 *   before remote session description is received and set.
 * @method _addIceCandidateToQueue
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._addIceCandidateToQueue = function(targetMid, canId, candidate) {
  var candidateType = candidate.candidate.split(' ')[7];

  Log.debug(this._debugOptions.instanceId, [targetMid, 'RTCIceCandidate', canId + ':' + candidateType, 'Buffering ICE candidate.']);

  this._trigger('candidateProcessingState', this.CANDIDATE_PROCESSING_STATE.BUFFERED,
    targetMid, canId, candidateType, {
    candidate: candidate.candidate,
    sdpMid: candidate.sdpMid,
    sdpMLineIndex: candidate.sdpMLineIndex
  }, null);

  this._peerCandidatesQueue[targetMid] = this._peerCandidatesQueue[targetMid] || [];
  this._peerCandidatesQueue[targetMid].push([canId, candidate]);
};

/**
 * Function that adds all the Peer connection buffered ICE candidates received.
 * This should be called only after the remote session description is received and set.
 * @method _addIceCandidateFromQueue
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._addIceCandidateFromQueue = function(targetMid) {
  this._peerCandidatesQueue[targetMid] = this._peerCandidatesQueue[targetMid] || [];

  for (var i = 0; i < this._peerCandidatesQueue[targetMid].length; i++) {
    var canArray = this._peerCandidatesQueue[targetMid][i];

    if (canArray) {
      var candidateType = canArray[1].candidate.split(' ')[7];

      Log.debug(this._debugOptions.instanceId, [targetMid, 'RTCIceCandidate', canArray[0] + ':' + candidateType, 'Adding buffered ICE candidate.']);

      this._addIceCandidate(targetMid, canArray[0], canArray[1]);
    } else if (this._peerConnections[targetMid] &&
      this._peerConnections[targetMid].signalingState !== this.PEER_CONNECTION_STATE.CLOSED) {
      Log.debug(this._debugOptions.instanceId, [targetMid, 'RTCPeerConnection', null, 'Signaling of end-of-candidates remote ICE gathering.']);
      this._peerConnections[targetMid].addIceCandidate(null);
    }
  }

  delete this._peerCandidatesQueue[targetMid];

  this._signalingEndOfCandidates(targetMid);
};

/**
 * Function that adds the ICE candidate to Peer connection.
 * @method _addIceCandidate
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._addIceCandidate = function (targetMid, canId, candidate) {
  var self = this;
  var candidateType = candidate.candidate.split(' ')[7];

  var onSuccessCbFn = function () {
    Log.log(self._debugOptions.instanceId, [targetMid, 'RTCIceCandidate', canId + ':' + candidateType,
      'Added ICE candidate successfully.']);
    self._trigger('candidateProcessingState', self.CANDIDATE_PROCESSING_STATE.PROCESS_SUCCESS,
      targetMid, canId, candidateType, {
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex
    }, null);
  };

  var onErrorCbFn = function (error) {
    Log.error(self._debugOptions.instanceId, [targetMid, 'RTCIceCandidate', canId + ':' + candidateType,
      'Failed adding ICE candidate ->'], error);
    self._trigger('candidateProcessingState', self.CANDIDATE_PROCESSING_STATE.PROCESS_ERROR,
      targetMid, canId, candidateType, {
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex
    }, error);
  };

  Log.debug(self._debugOptions.instanceId, [targetMid, 'RTCIceCandidate', canId + ':' + candidateType, 'Adding ICE candidate.']);

  self._trigger('candidateProcessingState', self.CANDIDATE_PROCESSING_STATE.PROCESSING,
    targetMid, canId, candidateType, {
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex
    }, null);

  if (!(self._peerConnections[targetMid] &&
    self._peerConnections[targetMid].signalingState !== self.PEER_CONNECTION_STATE.CLOSED)) {
    Log.error(self._debugOptions.instanceId, [targetMid, 'RTCIceCandidate', canId + ':' + candidateType, 'Dropping ICE candidate ' +
      'as Peer connection does not exists or is closed']);
    self._trigger('candidateProcessingState', self.CANDIDATE_PROCESSING_STATE.DROPPED,
      targetMid, canId, candidateType, {
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex
    }, new Error('Failed processing ICE candidate as Peer connection does not exists or is closed.'));
    return;
  }

  self._peerConnections[targetMid].addIceCandidate(candidate, onSuccessCbFn, onErrorCbFn);
};
Skylink.prototype._setIceServers = function(givenConfig) {
  var self = this;
  var givenIceServers = UtilsFactory.clone(givenConfig.iceServers);
  var iceServersList = {};
  var newIceServers = [];
  // TURN SSL config
  var useTURNSSLProtocol = false;
  var useTURNSSLPort = false;



  if (self._forceTURNSSL) {
    if (window.webrtcDetectedBrowser === 'chrome' ||
      window.webrtcDetectedBrowser === 'safari' ||
      window.webrtcDetectedBrowser === 'IE') {
      useTURNSSLProtocol = true;
    } else {
      useTURNSSLPort = true;
    }
  }

  Log.log(self._debugOptions.instanceId, 'TURN server connections SSL configuration', {
    useTURNSSLProtocol: useTURNSSLProtocol,
    useTURNSSLPort: useTURNSSLPort
  });

  var pushIceServer = function (username, credential, url, index) {
    if (!iceServersList[username]) {
      iceServersList[username] = {};
    }

    if (!iceServersList[username][credential]) {
      iceServersList[username][credential] = [];
    }

    if (self._turnServer && url.indexOf('temasys') > 0) {
      var parts = url.split(':');
      var subparts = (parts[1] || '').split('?');
      subparts[0] = self._turnServer;
      parts[1] = subparts.join('?');
      url = parts.join(':');
    }

    if (iceServersList[username][credential].indexOf(url) === -1) {
      if (typeof index === 'number') {
        iceServersList[username][credential].splice(index, 0, url);
      } else {
        iceServersList[username][credential].push(url);
      }
    }
  };

  var i, serverItem;

  for (i = 0; i < givenIceServers.length; i++) {
    var server = givenIceServers[i];

    if (typeof server.url !== 'string') {
      Log.warn(self._debugOptions.instanceId, 'Ignoring ICE server provided at index ' + i, UtilsFactory.clone(server));
      continue;
    }

    if (server.url.indexOf('stun') === 0) {
      if (!self._enableSTUN) {
        Log.warn(self._debugOptions.instanceId, 'Ignoring STUN server provided at index ' + i, UtilsFactory.clone(server));
        continue;
      }

      if (!self._usePublicSTUN && server.url.indexOf('temasys') === -1) {
        Log.warn(self._debugOptions.instanceId, 'Ignoring public STUN server provided at index ' + i, UtilsFactory.clone(server));
        continue;
      }

    } else if (server.url.indexOf('turn') === 0) {
      if (!self._enableTURN) {
        Log.warn(self._debugOptions.instanceId, 'Ignoring TURN server provided at index ' + i, UtilsFactory.clone(server));
        continue;
      }

      if (server.url.indexOf(':443') === -1 && useTURNSSLPort) {
        Log.log(self._debugOptions.instanceId, 'Ignoring TURN Server (non-SSL port) provided at index ' + i, UtilsFactory.clone(server));
        continue;
      }

      if (useTURNSSLProtocol) {
        var parts = server.url.split(':');
        parts[0] = 'turns';
        server.url = parts.join(':');
      }
    }

    // parse "@" settings
    if (server.url.indexOf('@') > 0) {
      var protocolParts = server.url.split(':');
      var urlParts = protocolParts[1].split('@');
      server.username = urlParts[0];
      server.url = protocolParts[0] + ':' + urlParts[1];

      // add the ICE server port
      // Edge uses 3478 with ?transport=udp for now
      if (window.webrtcDetectedBrowser === 'edge') {
        server.url += ':3478';
      } else if (protocolParts[2]) {
        server.url += ':' + protocolParts[2];
      }
    }

    var username = typeof server.username === 'string' ? server.username : 'none';
    var credential = typeof server.credential === 'string' ? server.credential : 'none';

    if (server.url.indexOf('turn') === 0) {
      if (self._TURNTransport === self.TURN_TRANSPORT.ANY) {
        pushIceServer(username, credential, server.url);

      } else {
        var rawUrl = server.url;

        if (rawUrl.indexOf('?transport=') > 0) {
          rawUrl = rawUrl.split('?transport=')[0];
        }

        if (self._TURNTransport === self.TURN_TRANSPORT.NONE) {
          pushIceServer(username, credential, rawUrl);
        } else if (self._TURNTransport === self.TURN_TRANSPORT.UDP) {
          pushIceServer(username, credential, rawUrl + '?transport=udp');
        } else if (self._TURNTransport === self.TURN_TRANSPORT.TCP) {
          pushIceServer(username, credential, rawUrl + '?transport=tcp');
        } else if (self._TURNTransport === self.TURN_TRANSPORT.ALL) {
          pushIceServer(username, credential, rawUrl + '?transport=tcp');
          pushIceServer(username, credential, rawUrl + '?transport=udp');
        } else {
          Log.warn(self._debugOptions.instanceId, 'Invalid TURN transport option "' + self._TURNTransport +
            '". Ignoring TURN server at index' + i, UtilsFactory.clone(server));
          continue;
        }
      }
    } else {
      pushIceServer(username, credential, server.url);
    }
  }

  // add mozilla STUN for firefox
  if (self._enableSTUN && self._usePublicSTUN && window.webrtcDetectedBrowser === 'firefox') {
    pushIceServer('none', 'none', 'stun:stun.services.mozilla.com', 0);
  }

  var hasUrlsSupport = false;

  if (window.webrtcDetectedBrowser === 'chrome' && window.webrtcDetectedVersion > 34) {
    hasUrlsSupport = true;
  }

  if (window.webrtcDetectedBrowser === 'firefox' && window.webrtcDetectedVersion > 38) {
    hasUrlsSupport = true;
  }

  if (window.webrtcDetectedBrowser === 'opera' && window.webrtcDetectedVersion > 31) {
    hasUrlsSupport = true;
  }

  // plugin supports .urls
  if (window.webrtcDetectedBrowser === 'safari' || window.webrtcDetectedBrowser === 'IE') {
    hasUrlsSupport = true;
  }

  // bowser / edge
  if (['bowser', 'edge'].indexOf(window.webrtcDetectedBrowser) > -1) {
    hasUrlsSupport = true;
  }

  for (var serverUsername in iceServersList) {
    if (iceServersList.hasOwnProperty(serverUsername)) {
      for (var serverCred in iceServersList[serverUsername]) {
        if (iceServersList[serverUsername].hasOwnProperty(serverCred)) {
          if (hasUrlsSupport) {
            var urlsItem = {
              urls: iceServersList[serverUsername][serverCred]
            };
            if (serverUsername !== 'none') {
              urlsItem.username = serverUsername;
            }
            if (serverCred !== 'none') {
              urlsItem.credential = serverCred;
            }

            // Edge uses 1 url only for now
            if (window.webrtcDetectedBrowser === 'edge') {
              if (urlsItem.username && urlsItem.credential) {
                urlsItem.urls = [urlsItem.urls[0]];
                newIceServers.push(urlsItem);
                break;
              }
            } else {
              newIceServers.push(urlsItem);
            }
          } else {
            for (var j = 0; j < iceServersList[serverUsername][serverCred].length; j++) {
              var urlItem = {
                url: iceServersList[serverUsername][serverCred][j]
              };
              if (serverUsername !== 'none') {
                urlItem.username = serverUsername;
              }
              if (serverCred !== 'none') {
                urlItem.credential = serverCred;
              }
              newIceServers.push(urlItem);
            }
          }
        }
      }
    }
  }

  Log.log(self._debugOptions.instanceId, 'Output iceServers configuration:', newIceServers);

  return {
    iceServers: newIceServers
  };
};
Skylink.prototype._refreshPeerConnection = function(listOfPeers, doIceRestart, callback) {
  var self = this;
  var listOfPeerRestarts = [];
  var error = '';
  var listOfPeerRestartErrors = {};

  // To fix jshint dont put functions within a loop
  var refreshSinglePeerCallback = function (peerId) {
    return function (error) {
      if (listOfPeerRestarts.indexOf(peerId) === -1) {
        if (error) {
          Log.error(self._debugOptions.instanceId, [peerId, 'RTCPeerConnection', null, 'Failed restarting for peer'], error);
          listOfPeerRestartErrors[peerId] = error;
        }
        listOfPeerRestarts.push(peerId);
      }

      if (listOfPeerRestarts.length === listOfPeers.length) {
        if (typeof callback === 'function') {
          Log.log(self._debugOptions.instanceId, [null, 'PeerConnection', null, 'Invoked all peers to restart. Firing callback']);

          if (Object.keys(listOfPeerRestartErrors).length > 0) {
            callback({
              refreshErrors: listOfPeerRestartErrors,
              listOfPeers: listOfPeers
            }, null);
          } else {
            callback(null, {
              listOfPeers: listOfPeers
            });
          }
        }
      }
    };
  };

  var refreshSinglePeer = function(peerId, peerCallback){
    if (!self._peerConnections[peerId]) {
      error = 'There is currently no existing peer connection made ' +
        'with the peer. Unable to restart connection';
      Log.error(self._debugOptions.instanceId, [peerId, null, null, error]);
      peerCallback(error);
      return;
    }

    Log.log(self._debugOptions.instanceId, [peerId, 'PeerConnection', null, 'Restarting peer connection']);

    // do a hard reset on variable object
    self._restartPeerConnection(peerId, doIceRestart, peerCallback);
  };

  if(!self._hasMCU) {
    var i;

    for (i = 0; i < listOfPeers.length; i++) {
      var peerId = listOfPeers[i];

      if (Object.keys(self._peerConnections).indexOf(peerId) > -1) {
        refreshSinglePeer(peerId, refreshSinglePeerCallback(peerId));
      } else {
        error = 'Peer connection with peer does not exists. Unable to restart';
        Log.error(self._debugOptions.instanceId, [peerId, 'PeerConnection', null, error]);
        refreshSinglePeerCallback(peerId)(error);
      }
    }
  } else {
    self._restartMCUConnection(callback, doIceRestart);
  }
};

/**
 * Function that retrieves Peer connection stats.
 * @method _retrieveStats
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._retrieveStats = function (peerId, callback) {
  var self = this;

  Log.debug(self._debugOptions.instanceId, [peerId, 'RTCStatsReport', null, 'Retrieivng connection status']);

  var pc = self._peerConnections[peerId];
  var result = {
    raw: null,
    connection: {
      iceConnectionState: pc.iceConnectionState,
      iceGatheringState: pc.iceGatheringState,
      signalingState: pc.signalingState,
      remoteDescription: {
        type: pc.remoteDescription ? pc.remoteDescription.type || null : null,
        sdp : pc.remoteDescription ? pc.remoteDescription.sdp || null : null
      },
      localDescription: {
        type: pc.localDescription ? pc.localDescription.type || null : null,
        sdp : pc.localDescription ? pc.localDescription.sdp || null : null
      },
      candidates: UtilsFactory.clone(self._gatheredCandidates[peerId] || {
        sending: { host: [], srflx: [], relay: [] },
        receiving: { host: [], srflx: [], relay: [] }
      }),
      dataChannels: {}
    },
    audio: {
      sending: {
        ssrc: null,
        bytes: 0,
        packets: 0,
        // Should not be for sending?
        packetsLost: 0,
        rtt: 0,
        // Should not be for sending?
        jitter: 0,
        // Should not be for sending?
        jitterBufferMs: null,
        codec: self._getSDPSelectedCodec(peerId, pc.remoteDescription, 'audio'),
        nacks: null,
        inputLevel: null,
        echoReturnLoss: null,
        echoReturnLossEnhancement: null,
        totalBytes: 0,
        totalPackets: 0,
        totalPacketsLost: 0,
        totalNacks: null
      },
      receiving: {
        ssrc: null,
        bytes: 0,
        packets: 0,
        packetsLost: 0,
        packetsDiscarded: 0,
        fractionLost: 0,
        nacks: null,
        jitter: 0,
        jitterBufferMs: null,
        codec: self._getSDPSelectedCodec(peerId, pc.remoteDescription, 'audio'),
        outputLevel: null,
        totalBytes: 0,
        totalPackets: 0,
        totalPacketsLost: 0,
        totalNacks: null
      }
    },
    video: {
      sending: {
        ssrc: null,
        bytes: 0,
        packets: 0,
        // Should not be for sending?
        packetsLost: 0,
        rtt: 0,
        // Should not be for sending?
        jitter: 0,
        // Should not be for sending?
        jitterBufferMs: null,
        codec: self._getSDPSelectedCodec(peerId, pc.remoteDescription, 'video'),
        frameWidth: null,
        frameHeight: null,
        framesDecoded: null,
        framesCorrupted: null,
        framesDropped: null,
        framesPerSecond: null,
        framesInput: null,
        frames: null,
        frameRateEncoded: null,
        frameRate: null,
        frameRateInput: null,
        frameRateMean: null,
        frameRateStdDev: null,
        nacks: null,
        plis: null,
        firs: null,
        slis: null,
        qpSum: null,
        totalBytes: 0,
        totalPackets: 0,
        totalPacketsLost: 0,
        totalNacks: null,
        totalPlis: null,
        totalFirs: null,
        totalSlis: null,
        totalFrames: null
      },
      receiving: {
        ssrc: null,
        bytes: 0,
        packets: 0,
        packetsDiscarded: 0,
        packetsLost: 0,
        fractionLost: 0,
        jitter: 0,
        jitterBufferMs: null,
        codec: self._getSDPSelectedCodec(peerId, pc.remoteDescription, 'video'),
        frameWidth: null,
        frameHeight: null,
        framesDecoded: null,
        framesCorrupted: null,
        framesPerSecond: null,
        framesDropped: null,
        framesOutput: null,
        frames: null,
        frameRateMean: null,
        frameRateStdDev: null,
        nacks: null,
        plis: null,
        firs: null,
        slis: null,
        e2eDelay: null,
        totalBytes: 0,
        totalPackets: 0,
        totalPacketsLost: 0,
        totalNacks: null,
        totalPlis: null,
        totalFirs: null,
        totalSlis: null,
        totalFrames: null
      }
    },
    selectedCandidate: {
      local: {
        ipAddress: null,
        candidateType: null,
        portNumber: null,
        transport: null, 
        turnMediaTransport: null
      },
      remote: {
        ipAddress: null,
        candidateType: null,
        portNumber: null,
        transport: null
      },
      consentResponses: {
        received: null,
        sent: null,
        totalReceived: null,
        totalSent: null
      },
      consentRequests: {
        received: null,
        sent: null,
        totalReceived: null,
        totalSent: null
      },
      responses: {
        received: null,
        sent: null,
        totalReceived: null,
        totalSent: null
      },
      requests: {
        received: null,
        sent: null,
        totalReceived: null,
        totalSent: null
      }
    },
    certificate: {
      local: self._getSDPFingerprint(peerId, pc.localDescription),
      remote: self._getSDPFingerprint(peerId, pc.remoteDescription),
      dtlsCipher: null,
      srtpCipher: null
    }
  };

  for (var channelProp in self._dataChannels[peerId]) {
    if (self._dataChannels[peerId].hasOwnProperty(channelProp) && self._dataChannels[peerId][channelProp]) {
      result.connection.dataChannels[self._dataChannels[peerId][channelProp].getInfo().label] = {
        label: self._dataChannels[peerId][channelProp].getInfo().label,
        readyState: self._dataChannels[peerId][channelProp].getInfo().readyState,
        channelType: channelProp === 'main' ? self.DATA_CHANNEL_TYPE.MESSAGING : self.DATA_CHANNEL_TYPE.DATA,
        currentTransferId: self._dataChannels[peerId][channelProp].transferId || null
      };
    }
  }

  var loopFn = function (obj, fn) {
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop) && obj[prop]) {
        fn(obj[prop], prop);
      }
    }
  };

  var formatCandidateFn = function (candidateDirType, candidate) {
    result.selectedCandidate[candidateDirType].ipAddress = candidate.ipAddress;
    result.selectedCandidate[candidateDirType].candidateType = candidate.candidateType;
    result.selectedCandidate[candidateDirType].portNumber = typeof candidate.portNumber !== 'number' ?
      parseInt(candidate.portNumber, 10) || null : candidate.portNumber;
    result.selectedCandidate[candidateDirType].transport = candidate.transport;
  };

  pc.getStats(null, function (stats) {
    Log.debug(self._debugOptions.instanceId, [peerId, 'RTCStatsReport', null, 'Retrieval success ->'], stats);

    result.raw = stats;

    if (window.webrtcDetectedBrowser === 'firefox') {
      loopFn(stats, function (obj, prop) {
        var dirType = '';

        // Receiving/Sending RTP packets
        if (prop.indexOf('inbound_rtp') === 0 || prop.indexOf('outbound_rtp') === 0) {
          dirType = prop.indexOf('inbound_rtp') === 0 ? 'receiving' : 'sending';

          if (!self._peerStats[peerId][prop]) {
            self._peerStats[peerId][prop] = obj;
          }

          result[obj.mediaType][dirType].bytes = self._parseConnectionStats(self._peerStats[peerId][prop],
            obj, dirType === 'receiving' ? 'bytesReceived' : 'bytesSent');
          result[obj.mediaType][dirType].totalBytes = parseInt(
            (dirType === 'receiving' ? obj.bytesReceived : obj.bytesSent) || '0', 10);
          result[obj.mediaType][dirType].packets = self._parseConnectionStats(self._peerStats[peerId][prop],
            obj, dirType === 'receiving' ? 'packetsReceived' : 'packetsSent');
          result[obj.mediaType][dirType].totalPackets = parseInt(
            (dirType === 'receiving' ? obj.packetsReceived : obj.packetsSent) || '0', 10);
          result[obj.mediaType][dirType].ssrc = obj.ssrc;
          
          if (obj.mediaType === 'video') {
            result.video[dirType].frameRateMean = obj.framerateMean || 0;
            result.video[dirType].frameRateStdDev = obj.framerateStdDev || 0;
            result.video[dirType].framesDropped = typeof obj.framesDropped === 'number' ? obj.framesDropped :
              (typeof obj.droppedFrames === 'number' ? obj.droppedFrames : null);
            result.video[dirType].framesCorrupted = typeof obj.framesCorrupted === 'number' ? obj.framesCorrupted : null;
            result.video[dirType].framesPerSecond = typeof obj.framesPerSecond === 'number' ? obj.framesPerSecond : null;

            if (dirType === 'sending') {
              result.video[dirType].framesEncoded = typeof obj.framesEncoded === 'number' ? obj.framesEncoded : null;
              result.video[dirType].frames = typeof obj.framesSent === 'number' ? obj.framesSent : null;
            } else {
              result.video[dirType].framesDecoded = typeof obj.framesDecoded === 'number' ? obj.framesDecoded : null;
              result.video[dirType].frames = typeof obj.framesReceived === 'number' ? obj.framesReceived : null;
            }
          }

          if (dirType === 'receiving') {
            obj.packetsDiscarded = (typeof obj.packetsDiscarded === 'number' ? obj.packetsDiscarded :
              obj.discardedPackets) || 0;
            obj.packetsLost = typeof obj.packetsLost === 'number' ? obj.packetsLost : 0;

            result[obj.mediaType].receiving.packetsLost = self._parseConnectionStats(self._peerStats[peerId][prop],
              obj, 'packetsLost');
            result[obj.mediaType].receiving.packetsDiscarded = self._parseConnectionStats(self._peerStats[peerId][prop],
              obj, 'packetsDiscarded');
            result[obj.mediaType].receiving.totalPacketsDiscarded = obj.packetsDiscarded;
            result[obj.mediaType].receiving.totalPacketsLost = obj.packetsLost;
          }

          self._peerStats[peerId][prop] = obj;

        // Sending RTP packets lost
        } else if (prop.indexOf('inbound_rtcp') === 0 || prop.indexOf('outbound_rtcp') === 0) {
          dirType = prop.indexOf('inbound_rtp') === 0 ? 'receiving' : 'sending';

          if (!self._peerStats[peerId][prop]) {
            self._peerStats[peerId][prop] = obj;
          }

          if (dirType === 'sending') {
            result[obj.mediaType].sending.rtt = obj.mozRtt || 0;
            result[obj.mediaType].sending.targetBitrate = typeof obj.targetBitrate === 'number' ? obj.targetBitrate : 0;
          } else {
            result[obj.mediaType].receiving.jitter = obj.jitter || 0;
          }

          self._peerStats[peerId][prop] = obj;

        // Candidates
        } else if (obj.nominated && obj.selected) {
          formatCandidateFn('remote', stats[obj.remoteCandidateId]);
          formatCandidateFn('local', stats[obj.localCandidateId]);
        }
      });

    } else if (window.webrtcDetectedBrowser === 'edge') {
      var tracks = [];

      if (pc.getRemoteStreams().length > 0) {
        tracks = tracks.concat(pc.getRemoteStreams()[0].getTracks());
      }

      if (pc.getLocalStreams().length > 0) {
        tracks = tracks.concat(pc.getLocalStreams()[0].getTracks());
      }

      loopFn(tracks, function (track) {
        loopFn(stats, function (obj, prop) {
          if (obj.type === 'track' && obj.trackIdentifier === track.id) {
            var dirType = obj.remoteSource ? 'receiving' : 'sending';
            var mediaType = track.kind;

            if (mediaType === 'audio') {
              result[mediaType][dirType][dirType === 'sending' ? 'inputLevel' : 'outputLevel'] = obj.audioLevel;
              if (dirType === 'sending') {
                result[mediaType][dirType].echoReturnLoss = obj.echoReturnLoss;
                result[mediaType][dirType].echoReturnLossEnhancement = obj.echoReturnLossEnhancement;
              }
            } else {
              result[mediaType][dirType].frames = self._parseConnectionStats(self._peerStats[peerId][subprop],
                streamObj,dirType === 'sending' ? obj.framesSent : obj.framesReceived);
              result[mediaType][dirType].framesDropped = obj.framesDropped;
              result[mediaType][dirType].framesDecoded = obj.framesDecoded;
              result[mediaType][dirType].framesCorrupted = obj.framesCorrupted;
              result[mediaType][dirType].framesPerSecond = obj.framesPerSecond;
              result[mediaType][dirType].frameHeight = obj.frameHeight || null;
              result[mediaType][dirType].frameWidth = obj.frameWidth || null;
              result[mediaType][dirType].totalFrames = dirType === 'sending' ? obj.framesSent : obj.framesReceived;
            }

            loopFn(stats, function (streamObj, subprop) {
              if (streamObj.mediaTrackId === obj.id && ['outboundrtp', 'inboundrtp'].indexOf(streamObj.type) > -1) {
                if (!self._peerStats[peerId][subprop]) {
                  self._peerStats[peerId][subprop] = streamObj;
                }

                result[mediaType][dirType].ssrc = parseInt(streamObj.ssrc || '0', 10);
                result[mediaType][dirType].nacks = self._parseConnectionStats(self._peerStats[peerId][subprop],
                  streamObj, 'nackCount');
                result[mediaType][dirType].totalNacks = streamObj.nackCount;

                if (mediaType === 'video') {
                  result[mediaType][dirType].firs = self._parseConnectionStats(self._peerStats[peerId][subprop],
                    streamObj, 'firCount');
                  result[mediaType][dirType].plis = self._parseConnectionStats(self._peerStats[peerId][subprop],
                    streamObj, 'pliCount');
                  result[mediaType][dirType].slis = self._parseConnectionStats(self._peerStats[peerId][subprop],
                    streamObj, 'sliCount');
                  result[mediaType][dirType].totalFirs = streamObj.firCount;
                  result[mediaType][dirType].totalPlis = streamObj.plisCount;
                  result[mediaType][dirType].totalSlis = streamObj.sliCount;
                }

                result[mediaType][dirType].bytes = self._parseConnectionStats(self._peerStats[peerId][subprop],
                  streamObj, dirType === 'receiving' ? 'bytesReceived' : 'bytesSent');
                result[mediaType][dirType].packets = self._parseConnectionStats(self._peerStats[peerId][subprop],
                  streamObj, dirType === 'receiving' ? 'packetsReceived' : 'packetsSent');

                result[mediaType][dirType].totalBytes = dirType === 'receiving' ? streamObj.bytesReceived : streamObj.bytesSent;
                result[mediaType][dirType].totalPackets = dirType === 'receiving' ? streamObj.packetsReceived : streamObj.packetsSent;

                if (dirType === 'receiving') {
                  result[mediaType][dirType].jitter = streamObj.jitter || 0;
                  result[mediaType].receiving.fractionLost = streamObj.fractionLost;
                  result[mediaType][dirType].packetsLost = self._parseConnectionStats(self._peerStats[peerId][subprop],
                    streamObj, 'packetsLost');
                  result[mediaType][dirType].packetsDiscarded = self._parseConnectionStats(self._peerStats[peerId][subprop],
                    streamObj, 'packetsDiscarded');
                  result[mediaType][dirType].totalPacketsLost = streamObj.packetsLost;
                  result[mediaType][dirType].totalPacketsDiscarded = streamObj.packetsDiscarded || 0;
                } else {
                  result[mediaType].sending.rtt = streamObj.roundTripTime || 0;
                  result[mediaType].sending.targetBitrate = streamObj.targetBitrate || 0;
                }

                if (result[mediaType][dirType].codec && streamObj.codecId) {
                  result[mediaType][dirType].codec.name = streamObj.codecId;
                }
              }
            });
          }
        });
      });

    } else {
      var reportedCandidate = false;
      var reportedCertificate = false;

      loopFn(stats, function (obj, prop) {
        if (prop.indexOf('ssrc_') === 0) {
          var dirType = prop.indexOf('_recv') > 0 ? 'receiving' : 'sending';

          // Polyfill fix for plugin. Plugin should fix this though
          if (!obj.mediaType) {
            obj.mediaType = obj.hasOwnProperty('audioOutputLevel') || obj.hasOwnProperty('audioInputLevel') ||
              obj.hasOwnProperty('googEchoCancellationReturnLoss') || obj.hasOwnProperty('googEchoCancellation') ?
              'audio' : 'video';
          }

          if (!self._peerStats[peerId][prop]) {
            self._peerStats[peerId][prop] = obj;
          }

          // Capture e2e delay
          try {
            if (obj.mediaType === 'video' && dirType === 'receiving') {
              var captureStartNtpTimeMs = parseInt(obj.googCaptureStartNtpTimeMs || '0', 10);

              if (captureStartNtpTimeMs > 0 && pc.getRemoteStreams().length > 0 && document &&
                typeof document.getElementsByTagName === 'function') {
                var streamId = pc.getRemoteStreams()[0].id || pc.getRemoteStreams()[0].label;
                var elements = [];

                if (self._isUsingPlugin) {
                  elements = document.getElementsByTagName('object');
                } else {
                  elements = document.getElementsByTagName('video');

                  if (elements.length === 0) {
                    elements = document.getElementsByTagName('audio');
                  }
                }

                for (var e = 0; e < elements.length; e++) {
                  var videoElmStreamId = null;

                  if (self._isUsingPlugin) {
                    if (!(elements[e].children && typeof elements[e].children === 'object' &&
                      typeof elements[e].children.length === 'number' && elements[e].children.length > 0)) {
                      break;
                    }

                    for (var ec = 0; ec < elements[e].children.length; ec++) {
                      if (elements[e].children[ec].name === 'streamId') {
                        videoElmStreamId = elements[e].children[ec].value || null;
                        break;
                      }
                    }

                  } else {
                    videoElmStreamId = elements[e].srcObject ? elements[e].srcObject.id ||
                      elements[e].srcObject.label : null;
                  }

                  if (videoElmStreamId && videoElmStreamId === streamId) {
                    result[obj.mediaType][dirType].e2eDelay = ((new Date()).getTime() + 2208988800000) -
                      captureStartNtpTimeMs - elements[e].currentTime * 1000;
                    break;
                  }
                }
              }
            }
          } catch (error) {
            Log.error(self._debugOptions.instanceId, [peerId, 'RTCStatsReport', null, 'Failed retrieving e2e delay ->'], error);
          }

          // Receiving/Sending RTP packets
          result[obj.mediaType][dirType].ssrc = parseInt(obj.ssrc || '0', 10);
          result[obj.mediaType][dirType].bytes = self._parseConnectionStats(self._peerStats[peerId][prop],
            obj, dirType === 'receiving' ? 'bytesReceived' : 'bytesSent');
          result[obj.mediaType][dirType].packets = self._parseConnectionStats(self._peerStats[peerId][prop],
            obj, dirType === 'receiving' ? 'packetsReceived' : 'packetsSent');
          result[obj.mediaType][dirType].nacks = self._parseConnectionStats(self._peerStats[peerId][prop],
            obj, dirType === 'receiving' ? 'googNacksReceived' : 'googNacksSent');
          result[obj.mediaType][dirType].totalPackets = parseInt((dirType === 'receiving' ? obj.packetsReceived :
            obj.packetsSent) || '0', 10);
          result[obj.mediaType][dirType].totalBytes = parseInt((dirType === 'receiving' ? obj.bytesReceived :
            obj.bytesSent) || '0', 10);
          result[obj.mediaType][dirType].totalNacks = parseInt((dirType === 'receiving' ? obj.googNacksReceived :
            obj.googNacksSent) || '0', 10);

          if (result[obj.mediaType][dirType].codec) {
            if (obj.googCodecName && obj.googCodecName !== 'unknown') {
              result[obj.mediaType][dirType].codec.name = obj.googCodecName;
            }
            if (obj.codecImplementationName && obj.codecImplementationName !== 'unknown') {
              result[obj.mediaType][dirType].codec.implementation = obj.codecImplementationName;
            }
          }

          if (dirType === 'sending') {
            // NOTE: Chrome sending audio does have it but plugin has..
            result[obj.mediaType].sending.rtt = parseFloat(obj.googRtt || '0', 10);
            result[obj.mediaType].sending.targetBitrate = obj.targetBitrate ? parseInt(obj.targetBitrate, 10) : null;
          } else {
            result[obj.mediaType].receiving.packetsLost = self._parseConnectionStats(self._peerStats[peerId][prop],
              obj, 'packetsLost');
            result[obj.mediaType].receiving.packetsDiscarded = self._parseConnectionStats(self._peerStats[peerId][prop],
              obj, 'packetsDiscarded');
            result[obj.mediaType].receiving.jitter = parseFloat(obj.googJitterReceived || '0', 10);
            result[obj.mediaType].receiving.jitterBufferMs = obj.googJitterBufferMs ? parseFloat(obj.googJitterBufferMs || '0', 10) : null;
            result[obj.mediaType].receiving.totalPacketsLost = parseInt(obj.packetsLost || '0', 10);
            result[obj.mediaType].receiving.totalPacketsDiscarded = parseInt(obj.packetsDiscarded || '0', 10);
          }

          if (obj.mediaType === 'video') {
            result.video[dirType].framesCorrupted = obj.framesCorrupted ? parseInt(obj.framesCorrupted, 10) : null;
            result.video[dirType].framesPerSecond = obj.framesPerSecond ? parseFloat(obj.framesPerSecond, 10) : null;
            result.video[dirType].framesDropped = obj.framesDropped ? parseInt(obj.framesDropped, 10) : null;
            
            if (dirType === 'sending') {
              result.video[dirType].frameWidth = obj.googFrameWidthSent ?
                parseInt(obj.googFrameWidthSent, 10) : null;
              result.video[dirType].frameHeight = obj.googFrameHeightSent ?
                parseInt(obj.googFrameHeightSent, 10) : null;
              result.video[dirType].plis = obj.googPlisSent ?
                self._parseConnectionStats(self._peerStats[peerId][prop], obj, 'googPlisSent') : null;
              result.video[dirType].firs = obj.googFirsSent ?
                self._parseConnectionStats(self._peerStats[peerId][prop], obj, 'googFirsSent') : null;
              result[obj.mediaType][dirType].totalPlis = obj.googPlisSent ? parseInt(obj.googPlisSent, 10) : null;
              result[obj.mediaType][dirType].totalFirs = obj.googFirsSent ? parseInt(obj.googFirsSent, 10) : null;
              result.video[dirType].framesEncoded = obj.framesEncoded ? parseInt(obj.framesEncoded, 10) : null;
              result.video[dirType].frameRateEncoded = obj.googFrameRateEncoded ?
                parseInt(obj.googFrameRateEncoded, 10) : null;
              result.video[dirType].frameRateInput = obj.googFrameRateInput ?
                parseInt(obj.googFrameRateInput, 10) : null;
              result.video[dirType].frameRate = obj.googFrameRateSent ?
                parseInt(obj.googFrameRateSent, 10) : null;
              result.video[dirType].qpSum = obj.qpSum ? parseInt(obj.qpSum, 10) : null;
              result.video[dirType].frames = obj.framesSent ?
                self._parseConnectionStats(self._peerStats[peerId][prop], obj, 'framesSent') : null;
              result.video[dirType].totalFrames = obj.framesSent ? parseInt(obj.framesSent, 10) : null;
            } else {
              result.video[dirType].frameWidth = obj.googFrameWidthReceived ?
                parseInt(obj.googFrameWidthReceived, 10) : null;
              result.video[dirType].frameHeight = obj.googFrameHeightReceived ?
                parseInt(obj.googFrameHeightReceived, 10) : null;
              result.video[dirType].plis = obj.googPlisReceived ?
                self._parseConnectionStats(self._peerStats[peerId][prop], obj, 'googPlisReceived') : null;
              result.video[dirType].firs = obj.googFirsReceived ?
                self._parseConnectionStats(self._peerStats[peerId][prop], obj, 'googFirsReceived') : null;
              result[obj.mediaType][dirType].totalPlis = obj.googPlisReceived ? parseInt(obj.googPlisReceived, 10) : null;
              result[obj.mediaType][dirType].totalFirs = obj.googFirsReceived ? parseInt(obj.googFirsReceived, 10) : null;
              result.video[dirType].framesDecoded = obj.framesDecoded ? parseInt(obj.framesDecoded, 10) : null;
              result.video[dirType].frameRateDecoded = obj.googFrameRateDecoded ?
                parseInt(obj.googFrameRateDecoded, 10) : null;
              result.video[dirType].frameRateOutput = obj.googFrameRateOutput ?
                parseInt(obj.googFrameRateOutput, 10) : null;
              result.video[dirType].frameRate = obj.googFrameRateReceived ?
                parseInt(obj.googFrameRateReceived, 10) : null;
              result.video[dirType].frames = obj.framesReceived ?
                self._parseConnectionStats(self._peerStats[peerId][prop], obj, 'framesReceived') : null;
              result.video[dirType].totalFrames = obj.framesReceived ? parseInt(obj.framesReceived, 10) : null;
            }
          } else {
            if (dirType === 'receiving') {
              result.audio[dirType].outputLevel = parseFloat(obj.audioOutputLevel || '0', 10);
            } else {
              result.audio[dirType].inputLevel = parseFloat(obj.audioInputLevel || '0', 10);
              result.audio[dirType].echoReturnLoss = parseFloat(obj.googEchoCancellationReturnLoss || '0', 10);
              result.audio[dirType].echoReturnLossEnhancement = parseFloat(obj.googEchoCancellationReturnLossEnhancement || '0', 10);
            }
          }

          self._peerStats[peerId][prop] = obj;

          if (!reportedCandidate) {
            loopFn(stats, function (canObj, canProp) {
              if (!reportedCandidate && canProp.indexOf('Conn-') === 0) {
                if (obj.transportId === canObj.googChannelId) {
                  if (!self._peerStats[peerId][canProp]) {
                    self._peerStats[peerId][canProp] = canObj;
                  }
                  formatCandidateFn('local', stats[canObj.localCandidateId]);
                  formatCandidateFn('remote', stats[canObj.remoteCandidateId]);
                  result.selectedCandidate.writable = canObj.googWritable ? canObj.googWritable === 'true' : null;
                  result.selectedCandidate.readable = canObj.googReadable ? canObj.googReadable === 'true' : null;
                  result.selectedCandidate.rtt = canObj.googRtt ?
                    self._parseConnectionStats(self._peerStats[peerId][canProp], canObj, 'googRtt') : null;
                  result.selectedCandidate.totalRtt = canObj.googRtt ? parseInt(canObj.googRtt, 10) : null;
                  result.selectedCandidate.requests = {
                    received: canObj.requestsReceived ?
                      self._parseConnectionStats(self._peerStats[peerId][canProp], canObj, 'requestsReceived') : null,
                    sent: canObj.requestsSent ?
                      self._parseConnectionStats(self._peerStats[peerId][canProp], canObj, 'requestsSent') : null,
                    totalReceived: canObj.requestsReceived ? parseInt(canObj.requestsReceived, 10) : null,
                    totalSent: canObj.requestsSent ? parseInt(canObj.requestsSent, 10) : null
                  };
                  result.selectedCandidate.responses = {
                    received: canObj.responsesReceived ?
                      self._parseConnectionStats(self._peerStats[peerId][canProp], canObj, 'responsesReceived') : null,
                    sent: canObj.responsesSent ?
                      self._parseConnectionStats(self._peerStats[peerId][canProp], canObj, 'responsesSent') : null,
                    totalReceived: canObj.responsesReceived ? parseInt(canObj.responsesReceived, 10) : null,
                    totalSent: canObj.responsesSent ? parseInt(canObj.responsesSent, 10) : null
                  };
                  result.selectedCandidate.consentRequests = {
                    received: canObj.consentRequestsReceived ?
                      self._parseConnectionStats(self._peerStats[peerId][canProp], canObj, 'consentRequestsReceived') : null,
                    sent: canObj.consentRequestsSent ?
                      self._parseConnectionStats(self._peerStats[peerId][canProp], canObj, 'consentRequestsSent') : null,
                    totalReceived: canObj.consentRequestsReceived ? parseInt(canObj.consentRequestsReceived, 10) : null,
                    totalSent: canObj.consentRequestsSent ? parseInt(canObj.consentRequestsSent, 10) : null
                  };
                  result.selectedCandidate.consentResponses = {
                    received: canObj.consentResponsesReceived ?
                      self._parseConnectionStats(self._peerStats[peerId][canProp], canObj, 'consentResponsesReceived') : null,
                    sent: canObj.consentResponsesSent ?
                      self._parseConnectionStats(self._peerStats[peerId][canProp], canObj, 'consentResponsesSent') : null,
                    totalReceived: canObj.consentResponsesReceived ? parseInt(canObj.consentResponsesReceived, 10) : null,
                    totalSent: canObj.consentResponsesSent ? parseInt(canObj.consentResponsesSent, 10) : null
                  };
  
                  self._peerStats[peerId][canProp] = canObj;
                  reportedCandidate = true;
                }
              }
            });
          }

          if (!reportedCertificate && stats[obj.transportId]) {
            result.certificate.srtpCipher = stats[obj.transportId].srtpCipher || null;
            result.certificate.dtlsCipher = stats[obj.transportId].dtlsCipher || null;

            var localCertId = stats[obj.transportId].localCertificateId;
            var remoteCertId = stats[obj.transportId].remoteCertificateId;

            if (localCertId && stats[localCertId]) {
              result.certificate.local.derBase64 = stats[localCertId].googDerBase64 || null;
              if (stats[localCertId].googFingerprint) {
                result.certificate.local.fingerprint = stats[localCertId].googFingerprint;
              }
              if (stats[localCertId].googFingerprintAlgorithm) {
                result.certificate.local.fingerprintAlgorithm = stats[localCertId].googFingerprintAlgorithm;
              }
            }

            if (remoteCertId && stats[remoteCertId]) {
              result.certificate.remote.derBase64 = stats[remoteCertId].googDerBase64 || null;
              if (stats[remoteCertId].googFingerprint) {
                result.certificate.remote.fingerprint = stats[remoteCertId].googFingerprint;
              }
              if (stats[remoteCertId].googFingerprintAlgorithm) {
                result.certificate.remote.fingerprintAlgorithm = stats[remoteCertId].googFingerprintAlgorithm;
              }
            }
            reportedCertificate = true;
          }
        }
      });
    }

    if ((result.selectedCandidate.local.candidateType || '').indexOf('relay') === 0) {
      result.selectedCandidate.local.turnMediaTransport = 'UDP';
      if (self._forceTURNSSL && window.webrtcDetectedBrowser !== 'firefox') {
        result.selectedCandidate.local.turnMediaTransport = 'TCP/TLS';
      } else if ((self._TURNTransport === self.TURN_TRANSPORT.TCP || self._forceTURNSSL) &&
        self._room && self._room.connection && self._room.connection.peerConfig &&
        Array.isArray(self._room.connection.peerConfig.iceServers) &&
        self._room.connection.peerConfig.iceServers[0] &&
        self._room.connection.peerConfig.iceServers[0].urls[0] &&
        self._room.connection.peerConfig.iceServers[0].urls[0].indexOf('?transport=tcp') > 0) {
        result.selectedCandidate.local.turnMediaTransport = 'TCP';
      }
    } else {
      result.selectedCandidate.local.turnMediaTransport = null;
    }

    callback(null, result);

  }, function (error) {
    callback(error, null);
  });
};

/**
 * Function that starts the Peer connection session.
 * Remember to remove previous method of reconnection (re-creating the Peer connection - destroy and create connection).
 * @method _addPeer
 * @private
 * @for Skylink
 * @since 0.5.4
 */
Skylink.prototype._addPeer = function(targetMid, peerBrowser, toOffer, restartConn, receiveOnly, isSS) {
  var self = this;
  if (self._peerConnections[targetMid] && !restartConn) {
    Log.error(self._debugOptions.instanceId, [targetMid, null, null, 'Connection to peer has already been made']);
    return;
  }
  Log.log(self._debugOptions.instanceId, [targetMid, null, null, 'Starting the connection to peer. Options provided:'], {
    peerBrowser: peerBrowser,
    toOffer: toOffer,
    receiveOnly: receiveOnly,
    enableDataChannel: self._enableDataChannel
  });

  Log.info(self._debugOptions.instanceId, 'Adding peer', isSS);

  if (!restartConn) {
    self._peerConnections[targetMid] = self._createPeerConnection(targetMid, !!isSS);
  }

  if (!self._peerConnections[targetMid]) {
    Log.error(self._debugOptions.instanceId, [targetMid, null, null, 'Failed creating the connection to peer']);
    return;
  }

  self._peerConnections[targetMid].hasScreen = !!isSS;
};

/**
 * Function that re-negotiates a Peer connection.
 * Remember to remove previous method of reconnection (re-creating the Peer connection - destroy and create connection).
 * @method _restartPeerConnection
 * @private
 * @for Skylink
 * @since 0.5.8
 */
Skylink.prototype._restartPeerConnection = function (peerId, doIceRestart, callback) {
  var self = this;

  if (!self._peerConnections[peerId]) {
    Log.error(self._debugOptions.instanceId, [peerId, null, null, 'Peer does not have an existing ' +
      'connection. Unable to restart']);
    return;
  }

  var pc = self._peerConnections[peerId];
  var agent = (self.getPeerInfo(peerId) || {}).agent || {};

  // prevent restarts for other SDK clients
  if (self._isLowerThanVersion(agent.SMProtocolVersion || '', '0.1.2')) {
    var notSupportedError = new Error('Failed restarting with other agents connecting from other SDKs as ' +
      're-negotiation is not supported by other SDKs');

    Log.error(self._debugOptions.instanceId, [peerId, 'RTCPeerConnection', null, 'Ignoring restart request as agent\'s SDK does not support it'],
        notSupportedError);

    if (typeof callback === 'function') {
      Log.debug(self._debugOptions.instanceId, [peerId, 'RTCPeerConnection', null, 'Firing restart failure callback']);
      callback(notSupportedError);
    }
    return;
  }

  // This is when the state is stable and re-handshaking is possible
  // This could be due to previous connection handshaking that is already done
  if (pc.signalingState === self.PEER_CONNECTION_STATE.STABLE && self._peerConnections[peerId]) {
    Log.log(self._debugOptions.instanceId, [peerId, null, null, 'Sending restart message to signaling server']);

    var restartMsg = {
      type: self._SIG_MESSAGE_TYPE.RESTART,
      mid: self._user.sid,
      rid: self._room.id,
      agent: window.webrtcDetectedBrowser,
      version: (window.webrtcDetectedVersion || 0).toString(),
      os: window.navigator.platform,
      userInfo: self._getUserInfo(),
      target: peerId,
      weight: self._peerPriorityWeight,
      receiveOnly: self.getPeerInfo().config.receiveOnly,
      enableIceTrickle: self._enableIceTrickle,
      enableDataChannel: self._enableDataChannel,
      enableIceRestart: self._enableIceRestart,
      doIceRestart: doIceRestart === true && self._enableIceRestart && self._peerInformations[peerId] &&
        self._peerInformations[peerId].config.enableIceRestart,
      isRestartResend: false,
      temasysPluginVersion: AdapterJS.WebRTCPlugin.plugin ? AdapterJS.WebRTCPlugin.plugin.VERSION : null,
      SMProtocolVersion: self.SM_PROTOCOL_VERSION,
      DTProtocolVersion: self.DT_PROTOCOL_VERSION
    };

    if (self._publishOnly) {
      restartMsg.publishOnly = {
        type: self._streams.screenshare && self._streams.screenshare.stream ? 'screenshare' : 'video'
      };
    }

    if (self._parentId) {
      restartMsg.parentId = self._parentId;
    }

    self._peerEndOfCandidatesCounter[peerId] = self._peerEndOfCandidatesCounter[peerId] || {};
    self._peerEndOfCandidatesCounter[peerId].len = 0;
    self._sendChannelMessage(restartMsg);
    self._trigger('peerRestart', peerId, self.getPeerInfo(peerId), true, doIceRestart === true);

    if (typeof callback === 'function') {
      Log.debug(self._debugOptions.instanceId, [peerId, 'RTCPeerConnection', null, 'Firing restart callback']);
      callback(null);
    }

  } else {
    // Let's check if the signalingState is stable first.
    // In another galaxy or universe, where the local description gets dropped..
    // In the offerHandler or answerHandler, do the appropriate flags to ignore or drop "extra" descriptions
    if (pc.signalingState === self.PEER_CONNECTION_STATE.HAVE_LOCAL_OFFER) {
      // Checks if the local description is defined first
      var hasLocalDescription = pc.localDescription && pc.localDescription.sdp;
      // By then it should have at least the local description..
      if (hasLocalDescription) {
        self._sendChannelMessage({
          type: pc.localDescription.type,
          sdp: pc.localDescription.sdp,
          mid: self._user.sid,
          target: peerId,
          rid: self._room.id,
          restart: true
        });
      } else {
        var noLocalDescriptionError = 'Failed re-sending localDescription as there is ' +
          'no localDescription set to connection. There could be a handshaking step error';
        Log.error(self._debugOptions.instanceId, [peerId, 'RTCPeerConnection', null, noLocalDescriptionError], {
            localDescription: pc.localDescription,
            remoteDescription: pc.remoteDescription
        });
        if (typeof callback === 'function') {
          Log.debug(self._debugOptions.instanceId, [peerId, 'RTCPeerConnection', null, 'Firing restart failure callback']);
          callback(new Error(noLocalDescriptionError));
        }
      }
    // It could have connection state closed
    } else {
      var unableToRestartError = 'Failed restarting as peer connection state is ' + pc.signalingState;
      Log.error(self._debugOptions.instanceId, [peerId, 'RTCPeerConnection', null, unableToRestartError]);
      if (typeof callback === 'function') {
        Log.debug(self._debugOptions.instanceId, [peerId, 'RTCPeerConnection', null, 'Firing restart failure callback']);
        callback(new Error(unableToRestartError));
      }
    }
  }
};

/**
 * Function that ends the Peer connection session.
 * @method _removePeer
 * @private
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._removePeer = function(peerId) {
  if (!this._peerConnections[peerId] && !this._peerInformations[peerId]) {
    Log.debug(this._debugOptions.instanceId, [peerId, 'RTCPeerConnection', null, 'Dropping the hangup from Peer as not connected to Peer at all.']);
    return;
  }

  var peerInfo = UtilsFactory.clone(this.getPeerInfo(peerId)) || {
    userData: '',
    settings: {},
    mediaStatus: {},
    agent: {},
    config: {},
    room: UtilsFactory.clone(this._selectedRoom)
  };

  if (peerId !== 'MCU') {
    this._trigger('peerLeft', peerId, peerInfo, false);
  } else {
    this._hasMCU = false;
    Log.log(this._debugOptions.instanceId, [peerId, null, null, 'MCU has stopped listening and left']);
    this._trigger('serverPeerLeft', peerId, this.SERVER_PEER_TYPE.MCU);
  }

  // check if health timer exists
  if (this._peerConnections[peerId]) {
    if (this._peerConnections[peerId].signalingState !== this.PEER_CONNECTION_STATE.CLOSED) {
      this._peerConnections[peerId].close();
    }

    if (peerId !== 'MCU') {
      this._handleEndedStreams(peerId);
    }

    delete this._peerConnections[peerId];
  }
  // remove peer informations session
  if (this._peerInformations[peerId]) {
    delete this._peerInformations[peerId];
  }
  // remove peer messages stamps session
  if (this._peerMessagesStamps[peerId]) {
    delete this._peerMessagesStamps[peerId];
  }
  // remove peer streams session
  if (this._streamsSession[peerId]) {
    delete this._streamsSession[peerId];
  }
  // remove peer streams session
  if (this._peerEndOfCandidatesCounter[peerId]) {
    delete this._peerEndOfCandidatesCounter[peerId];
  }
  // remove peer sdp session
  if (this._sdpSessions[peerId]) {
    delete this._sdpSessions[peerId];
  }

  // close datachannel connection
  if (this._dataChannels[peerId]) {
    this._closeDataChannel(peerId);
  }

  Log.log(this._debugOptions.instanceId, [peerId, null, null, 'Successfully removed peer']);
};

/**
 * Function that creates the Peer connection.
 * @method _createPeerConnection
 * @private
 * @for Skylink
 * @since 0.5.1
 */
Skylink.prototype._createPeerConnection = function(targetMid, isScreenSharing) {
  var pc, self = this;
  if (!self._inRoom || !(self._room && self._room.connection &&
    self._room.connection.peerConfig && Array.isArray(self._room.connection.peerConfig.iceServers))) {
    return;
  }
  // currently the AdapterJS 0.12.1-2 causes an issue to prevent firefox from
  // using .urls feature
  try {
    pc = new RTCPeerConnection({
      iceServers: self._room.connection.peerConfig.iceServers,
      iceTransportPolicy: self._filterCandidatesType.host && self._filterCandidatesType.srflx &&
        !self._filterCandidatesType.relay ? 'relay' : 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    }, {
      optional: [
        { DtlsSrtpKeyAgreement: true },
        { googIPv6: true }
      ]
    });
    Log.info(self._debugOptions.instanceId, [targetMid, null, null, 'Created peer connection']);
    Log.debug(self._debugOptions.instanceId, [targetMid, null, null, 'Peer connection config:'], self._room.connection.peerConfig);
    Log.debug(self._debugOptions.instanceId, [targetMid, null, null, 'Peer connection constraints:'], self._room.connection.peerConstraints);
  } catch (error) {
    Log.error(self._debugOptions.instanceId, [targetMid, null, null, 'Failed creating peer connection:'], error);
    return null;
  }
  // attributes (added on by Temasys)
  pc.setOffer = '';
  pc.setAnswer = '';
  pc.hasStream = false;
  pc.hasScreen = !!isScreenSharing;
  pc.hasMainChannel = false;
  pc.firefoxStreamId = '';
  pc.processingLocalSDP = false;
  pc.processingRemoteSDP = false;
  pc.gathered = false;
  pc.gathering = false;

  // candidates
  self._gatheredCandidates[targetMid] = {
    sending: { host: [], srflx: [], relay: [] },
    receiving: { host: [], srflx: [], relay: [] }
  };

  self._streamsSession[targetMid] = self._streamsSession[targetMid] || {};
  self._peerEndOfCandidatesCounter[targetMid] = self._peerEndOfCandidatesCounter[targetMid] || {};
  self._sdpSessions[targetMid] = { local: {}, remote: {} };
  self._dataChannels[targetMid] = {};

  // callbacks
  // standard not implemented: onnegotiationneeded,
  pc.ondatachannel = function(event) {
    var dc = event.channel || event;
    Log.debug(self._debugOptions.instanceId, [targetMid, 'RTCDataChannel', dc.label, 'Received datachannel ->'], dc);
    if (self._enableDataChannel && self._peerInformations[targetMid] &&
      self._peerInformations[targetMid].config.enableDataChannel) {
      var channelType = self.DATA_CHANNEL_TYPE.DATA;
      var channelKey = dc.label;

      // if peer does not have main channel, the first item is main
      if (!pc.hasMainChannel) {
        channelType = self.DATA_CHANNEL_TYPE.MESSAGING;
        channelKey = 'main';
        pc.hasMainChannel = true;
      }

      self._createDataChannel(targetMid, dc);

    } else {
      Log.error(self._debugOptions.instanceId, [targetMid, 'RTCDataChannel', dc.label, 'Not adding datachannel as enable datachannel ' +
        'is set to false']);
    }
  };

  pc.onaddstream = function(event) {
    if (!self._peerConnections[targetMid]) {
      return;
    }

    var stream = event.stream || event;
    var streamId = stream.id || stream.label;

    if (targetMid === 'MCU') {
      Log.error(self._debugOptions.instanceId, [targetMid, 'MediaStream', streamId, 'Ignoring received remote stream from MCU ->'], stream);
      return;
    } else if (!self._sdpSettings.direction.audio.receive && !self._sdpSettings.direction.video.receive) {
      Log.error(self._debugOptions.instanceId, [targetMid, 'MediaStream', streamId, 'Ignoring received empty remote stream ->'], stream);
      return;
    }

    // Fixes for the dirty-hack for Chrome offer to Firefox (inactive)
    // See: ESS-680
    if (!self._hasMCU && window.webrtcDetectedBrowser === 'firefox' &&
      pc.getRemoteStreams().length > 1 && pc.remoteDescription && pc.remoteDescription.sdp) {

      if (pc.remoteDescription.sdp.indexOf(' msid:' + streamId + ' ') === -1) {
        Log.error(self._debugOptions.instanceId, [targetMid, 'MediaStream', streamId, 'Ignoring received empty remote stream ->'], stream);
        return;
      }
    }

    var peerSettings = UtilsFactory.clone(self.getPeerInfo(targetMid).settings);
    var hasScreenshare = peerSettings.video && typeof peerSettings.video === 'object' && !!peerSettings.video.screenshare;

    pc.hasStream = true;
    pc.hasScreen = !!hasScreenshare;

    self._streamsSession[targetMid][streamId] = peerSettings;
    self._onRemoteStreamAdded(targetMid, stream, !!hasScreenshare);
  };

  pc.onicecandidate = function(event) {
    self._onIceCandidate(targetMid, event.candidate || event);
  };

  pc.oniceconnectionstatechange = function(evt) {
    var iceConnectionState = pc.iceConnectionState;

    Log.debug(self._debugOptions.instanceId, [targetMid, 'RTCIceConnectionState', null, 'Ice connection state changed ->'], iceConnectionState);

    if (window.webrtcDetectedBrowser === 'edge') {
      if (iceConnectionState === 'connecting') {
        iceConnectionState = self.ICE_CONNECTION_STATE.CHECKING;
      } else if (iceConnectionState === 'new') {
        iceConnectionState = self.ICE_CONNECTION_STATE.FAILED;
      }
    }

    self._trigger('iceConnectionState', iceConnectionState, targetMid);

    if (pc.iceConnectionState === self.ICE_CONNECTION_STATE.FAILED && self._enableIceTrickle) {
      self._trigger('iceConnectionState', self.ICE_CONNECTION_STATE.TRICKLE_FAILED, targetMid);
    }
  };

  pc.onsignalingstatechange = function() {
    Log.debug(self._debugOptions.instanceId, [targetMid, 'RTCSignalingState', null, 'Peer connection state changed ->'], pc.signalingState);
    self._trigger('peerConnectionState', pc.signalingState, targetMid);
  };
  pc.onicegatheringstatechange = function() {
    Log.log(self._debugOptions.instanceId, [targetMid, 'RTCIceGatheringState', null, 'Ice gathering state changed ->'], pc.iceGatheringState);
    self._trigger('candidateGenerationState', pc.iceGatheringState, targetMid);
  };

  if (window.webrtcDetectedBrowser === 'firefox') {
    pc.removeStream = function (stream) {
      var senders = pc.getSenders();
      for (var s = 0; s < senders.length; s++) {
        var tracks = stream.getTracks();
        for (var t = 0; t < tracks.length; t++) {
          if (tracks[t] === senders[s].track) {
            pc.removeTrack(senders[s]);
          }
        }
      }
    };
  }

  return pc;
};

/**
 * Function that handles the <code>_restartPeerConnection</code> scenario
 *   for MCU enabled Peer connections.
 * This is implemented currently by making the user leave and join the Room again.
 * The Peer ID will not stay the same though.
 * @method _restartMCUConnection
 * @private
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype._restartMCUConnection = function(callback, doIceRestart) {
  var self = this;
  var listOfPeers = Object.keys(self._peerConnections);
  var listOfPeerRestartErrors = {};
  var sendRestartMsgFn = function (peerId) {
    var restartMsg = {
      type: self._SIG_MESSAGE_TYPE.RESTART,
      mid: self._user.sid,
      rid: self._room.id,
      agent: window.webrtcDetectedBrowser,
      version: (window.webrtcDetectedVersion || 0).toString(),
      os: window.navigator.platform,
      userInfo: self._getUserInfo(),
      target: peerId,
      weight: self._peerPriorityWeight,
      receiveOnly: self.getPeerInfo().config.receiveOnly,
      enableIceTrickle: self._enableIceTrickle,
      enableDataChannel: self._enableDataChannel,
      enableIceRestart: self._enableIceRestart,
      doIceRestart: self._mcuUseRenegoRestart && doIceRestart === true &&
        self._enableIceRestart && self._peerInformations[peerId] &&
        self._peerInformations[peerId].config.enableIceRestart,
      isRestartResend: false,
      temasysPluginVersion: AdapterJS.WebRTCPlugin.plugin ? AdapterJS.WebRTCPlugin.plugin.VERSION : null,
      SMProtocolVersion: self.SM_PROTOCOL_VERSION,
      DTProtocolVersion: self.DT_PROTOCOL_VERSION
    };

    if (self._publishOnly) {
      restartMsg.publishOnly = {
        type: self._streams.screenshare && self._streams.screenshare.stream ? 'screenshare' : 'video'
      };
    }

    if (self._parentId) {
      restartMsg.parentId = self._parentId;
    }

    Log.log(self._debugOptions.instanceId, [peerId, 'RTCPeerConnection', null, 'Sending restart message to signaling server ->'], restartMsg);

    self._sendChannelMessage(restartMsg);
  };

  for (var i = 0; i < listOfPeers.length; i++) {
    if (!self._peerConnections[listOfPeers[i]]) {
      var error = 'Peer connection with peer does not exists. Unable to restart';
      Log.error(self._debugOptions.instanceId, [listOfPeers[i], 'PeerConnection', null, error]);
      listOfPeerRestartErrors[listOfPeers[i]] = new Error(error);
      continue;
    }

    if (listOfPeers[i] !== 'MCU') {
      self._trigger('peerRestart', listOfPeers[i], self.getPeerInfo(listOfPeers[i]), true, false);

      if (!self._mcuUseRenegoRestart) {
        sendRestartMsgFn(listOfPeers[i]);
      }
    }
  }

  self._trigger('serverPeerRestart', 'MCU', self.SERVER_PEER_TYPE.MCU);

  if (self._mcuUseRenegoRestart) {
    self._peerEndOfCandidatesCounter.MCU = self._peerEndOfCandidatesCounter.MCU || {};
    self._peerEndOfCandidatesCounter.MCU.len = 0;
    sendRestartMsgFn('MCU');
  } else {
    // Restart with MCU = peer leaves then rejoins room
    var peerJoinedFn = function (peerId, peerInfo, isSelf) {
      Log.log(self._debugOptions.instanceId, [null, 'PeerConnection', null, 'Invoked all peers to restart with MCU. Firing callback']);

      if (typeof callback === 'function') {
        if (Object.keys(listOfPeerRestartErrors).length > 0) {
          callback({
            refreshErrors: listOfPeerRestartErrors,
            listOfPeers: listOfPeers
          }, null);
        } else {
          callback(null, {
            listOfPeers: listOfPeers
          });
        }
      }
    };

    self.once('peerJoined', peerJoinedFn, function (peerId, peerInfo, isSelf) {
      return isSelf;
    });

    self.leaveRoom(false, function (error, success) {
      if (error) {
        if (typeof callback === 'function') {
          for (var i = 0; i < listOfPeers.length; i++) {
            listOfPeerRestartErrors[listOfPeers[i]] = error;
          }
          callback({
            refreshErrors: listOfPeerRestartErrors,
            listOfPeers: listOfPeers
          }, null);
        }
      } else {
        //self._trigger('serverPeerLeft', 'MCU', self.SERVER_PEER_TYPE.MCU);
        self.joinRoom(self._selectedRoom);
      }
    });
  }
};

/**
 * Function that handles the stats tabulation.
 * @method _parseConnectionStats
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._parseConnectionStats = function(prevStats, stats, prop) {
  var nTime = stats.timestamp;
  var oTime = prevStats.timestamp;
  var nVal = parseFloat(stats[prop] || '0', 10);
  var oVal = parseFloat(prevStats[prop] || '0', 10);

  if ((new Date(nTime).getTime()) === (new Date(oTime).getTime())) {
    return nVal;
  }

  return parseFloat(((nVal - oVal) / (nTime - oTime) * 1000).toFixed(3) || '0', 10);
};

/**
 * Function that signals the end-of-candidates flag.
 * @method _signalingEndOfCandidates
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._signalingEndOfCandidates = function(targetMid) {
  var self = this;

  if (!self._peerEndOfCandidatesCounter[targetMid]) {
    return;
  }

  // If remote description is set
  if (self._peerConnections[targetMid].remoteDescription && self._peerConnections[targetMid].remoteDescription.sdp &&
  // If end-of-candidates signal is received
    typeof self._peerEndOfCandidatesCounter[targetMid].expectedLen === 'number' &&
  // If all ICE candidates are received
    self._peerEndOfCandidatesCounter[targetMid].len >= self._peerEndOfCandidatesCounter[targetMid].expectedLen &&
  // If there is no ICE candidates queue
    (self._peerCandidatesQueue[targetMid] ? self._peerCandidatesQueue[targetMid].length === 0 : true) &&
  // If it has not been set yet
    !self._peerEndOfCandidatesCounter[targetMid].hasSet) {
    Log.debug(self._debugOptions.instanceId, [targetMid, 'RTCPeerConnection', null, 'Signaling of end-of-candidates remote ICE gathering.']);
    self._peerEndOfCandidatesCounter[targetMid].hasSet = true;
    try {
      if (window.webrtcDetectedBrowser === 'edge') {
        var mLineCounter = -1;
        var addedMids = [];
        var sdpLines = self._peerConnections[targetMid].remoteDescription.sdp.split('\r\n');

        for (var i = 0; i < sdpLines.length; i++) {
          if (sdpLines[i].indexOf('m=') === 0) {
            mLineCounter++;
          } else if (sdpLines[i].indexOf('a=mid:') === 0) {
            var mid = sdpLines[i].split('a=mid:')[1] || '';
            if (mid && addedMids.indexOf(mid) === -1) {
              addedMids.push(mid);
              self._addIceCandidate(targetMid, 'endofcan-' + (new Date()).getTime(), new RTCIceCandidate({
                sdpMid: mid,
                sdpMLineIndex: mLineCounter,
                candidate: 'candidate:1 1 udp 1 0.0.0.0 9 typ endOfCandidates'
              }));
            }
          }
        }

      } else {
        self._peerConnections[targetMid].addIceCandidate(null);
      }

      if (self._gatheredCandidates[targetMid]) {
        self._trigger('candidatesGathered', targetMid, {
          expected: self._peerEndOfCandidatesCounter[targetMid].expectedLen || 0,
          received: self._peerEndOfCandidatesCounter[targetMid].len || 0,
          processed: self._gatheredCandidates[targetMid].receiving.srflx.length +
            self._gatheredCandidates[targetMid].receiving.relay.length +
            self._gatheredCandidates[targetMid].receiving.host.length
        });
      }

    } catch (error) {
      Log.error(self._debugOptions.instanceId, [targetMid, 'RTCPeerConnection', null, 'Failed signaling end-of-candidates ->'], error);
    }
  }
};



Skylink.prototype._getUserInfo = function(peerId) {
  var userInfo = UtilsFactory.clone(this.getPeerInfo());
  var peerInfo = UtilsFactory.clone(this.getPeerInfo(peerId));

  // Adhere to SM protocol without breaking the other SDKs.
  if (userInfo.settings.video && typeof userInfo.settings.video === 'object') {
    userInfo.settings.video.customSettings = {};

    if (userInfo.settings.video.frameRate && typeof userInfo.settings.video.frameRate === 'object') {
      userInfo.settings.video.customSettings.frameRate = UtilsFactory.clone(userInfo.settings.video.frameRate);
      userInfo.settings.video.frameRate = -1;
    }

    if (userInfo.settings.video.facingMode && typeof userInfo.settings.video.facingMode === 'object') {
      userInfo.settings.video.customSettings.facingMode = UtilsFactory.clone(userInfo.settings.video.facingMode);
      userInfo.settings.video.facingMode = '-1';
    }

    if (userInfo.settings.video.resolution && typeof userInfo.settings.video.resolution === 'object') {
      if (userInfo.settings.video.resolution.width && typeof userInfo.settings.video.resolution.width === 'object') {
        userInfo.settings.video.customSettings.width = UtilsFactory.clone(userInfo.settings.video.width);
        userInfo.settings.video.resolution.width = -1;
      }

      if (userInfo.settings.video.resolution.height && typeof userInfo.settings.video.resolution.height === 'object') {
        userInfo.settings.video.customSettings.height = UtilsFactory.clone(userInfo.settings.video.height);
        userInfo.settings.video.resolution.height = -1;
      }
    }
  }

  if (userInfo.settings.bandwidth) {
    userInfo.settings.maxBandwidth = UtilsFactory.clone(userInfo.settings.bandwidth);
    delete userInfo.settings.bandwidth;
  }

  // If there is Peer ID (not broadcast ENTER message) and Peer is Edge browser and User is not
  if (peerId ? (window.webrtcDetectedBrowser !== 'edge' && peerInfo.agent.name === 'edge' ?
  // If User is IE/safari and does not have H264 support, remove video support
    ['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1 && !this._currentCodecSupport.video.h264 :
  // If User is Edge and Peer is not and no H264 support, remove video support
    window.webrtcDetectedBrowser === 'edge' && peerInfo.agent.name !== 'edge' && !this._currentCodecSupport.video.h264) :
  // If broadcast ENTER message and User is Edge and has no H264 support
    window.webrtcDetectedBrowser === 'edge' && !this._currentCodecSupport.video.h264) {
    userInfo.settings.video = false;
    userInfo.mediaStatus.videoMuted = true;
  }

  delete userInfo.agent;
  delete userInfo.room;
  delete userInfo.config;
  delete userInfo.parentId;
  return userInfo;
};

Skylink.prototype._doOffer = function(targetMid, iceRestart, peerBrowser) {
  var self = this;
  var pc = self._peerConnections[targetMid] || self._addPeer(targetMid, peerBrowser);

  Log.log(self._debugOptions.instanceId, [targetMid, null, null, 'Checking caller status'], peerBrowser);

  // Added checks to ensure that connection object is defined first
  if (!pc) {
    Log.error(self._debugOptions.instanceId, [targetMid, 'RTCSessionDescription', 'offer', 'Dropping of creating of offer ' +
      'as connection does not exists']);
    return;
  }

  // Added checks to ensure that state is "stable" if setting local "offer"
  if (pc.signalingState !== self.PEER_CONNECTION_STATE.STABLE) {
    Log.error(self._debugOptions.instanceId, [targetMid, 'RTCSessionDescription', 'offer',
      'Dropping of creating of offer as signalingState is not "' +
      self.PEER_CONNECTION_STATE.STABLE + '" ->'], pc.signalingState);
    return;
  }

  var peerAgent = ((self._peerInformations[targetMid] || {}).agent || {}).name || '';
  var doIceRestart = !!((self._peerInformations[targetMid] || {}).config || {}).enableIceRestart &&
    iceRestart && self._enableIceRestart;
  var offerToReceiveAudio = !(!self._sdpSettings.connection.audio && targetMid !== 'MCU');
  var offerToReceiveVideo = !(!self._sdpSettings.connection.video && targetMid !== 'MCU') &&
    ((window.webrtcDetectedBrowser === 'edge' && peerAgent !== 'edge') ||
    (['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1 && peerAgent === 'edge') ?
    !!self._currentCodecSupport.video.h264 : true);

  var offerConstraints = {
    offerToReceiveAudio: offerToReceiveAudio,
    offerToReceiveVideo: offerToReceiveVideo,
    iceRestart: doIceRestart
  };

  // Prevent undefined OS errors
  peerBrowser.os = peerBrowser.os || '';

  // Fallback to use mandatory constraints for plugin based browsers
  if (['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1) {
    offerConstraints = {
      mandatory: {
        OfferToReceiveAudio: offerToReceiveAudio,
        OfferToReceiveVideo: offerToReceiveVideo,
        iceRestart: doIceRestart
      }
    };
  }

  // Add stream only at offer/answer end
  if (!self._hasMCU || targetMid === 'MCU') {
    self._addLocalMediaStreams(targetMid);
  }

  if (self._enableDataChannel && self._peerInformations[targetMid] &&
    self._peerInformations[targetMid].config.enableDataChannel &&
    !(!self._sdpSettings.connection.data && targetMid !== 'MCU')) {
    // Edge doesn't support datachannels yet
    if (!(self._dataChannels[targetMid] && self._dataChannels[targetMid].main)) {
      self._createDataChannel(targetMid);
      self._peerConnections[targetMid].hasMainChannel = true;
    }
  }

  Log.debug(self._debugOptions.instanceId, [targetMid, null, null, 'Creating offer with config:'], offerConstraints);

  pc.endOfCandidates = false;

  pc.createOffer(function(offer) {
    Log.debug(self._debugOptions.instanceId, [targetMid, null, null, 'Created offer'], offer);

    self._setLocalAndSendMessage(targetMid, offer);

  }, function(error) {
    self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.ERROR, targetMid, error);

    Log.error(self._debugOptions.instanceId, [targetMid, null, null, 'Failed creating an offer:'], error);

  }, offerConstraints);
};

/**
 * Function that creates the Peer connection answer session description.
 * This comes after receiving and setting the offer session description.
 * @method _doAnswer
 * @private
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype._doAnswer = function(targetMid) {
  var self = this;
  Log.log(self._debugOptions.instanceId, [targetMid, null, null, 'Creating answer with config:'],
    self._room.connection.sdpConstraints);
  var pc = self._peerConnections[targetMid];

  // Added checks to ensure that connection object is defined first
  if (!pc) {
    Log.error(self._debugOptions.instanceId, [targetMid, 'RTCSessionDescription', 'answer', 'Dropping of creating of answer ' +
      'as connection does not exists']);
    return;
  }

  // Added checks to ensure that state is "have-remote-offer" if setting local "answer"
  if (pc.signalingState !== self.PEER_CONNECTION_STATE.HAVE_REMOTE_OFFER) {
    Log.error(self._debugOptions.instanceId, [targetMid, 'RTCSessionDescription', 'answer',
      'Dropping of creating of answer as signalingState is not "' +
      self.PEER_CONNECTION_STATE.HAVE_REMOTE_OFFER + '" ->'], pc.signalingState);
    return;
  }

  // Add stream only at offer/answer end
  if (!self._hasMCU || targetMid === 'MCU') {
    self._addLocalMediaStreams(targetMid);
  }

  // No ICE restart constraints for createAnswer as it fails in chrome 48
  // { iceRestart: true }
  pc.createAnswer(function(answer) {
    Log.debug(self._debugOptions.instanceId, [targetMid, null, null, 'Created answer'], answer);
    self._setLocalAndSendMessage(targetMid, answer);
  }, function(error) {
    Log.error(self._debugOptions.instanceId, [targetMid, null, null, 'Failed creating an answer:'], error);
    self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.ERROR, targetMid, error);
  });
};

/**
 * Function that sets the local session description and sends to Peer.
 * If trickle ICE is disabled, the local session description will be sent after
 *   ICE gathering has been completed.
 * @method _setLocalAndSendMessage
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._setLocalAndSendMessage = function(targetMid, sessionDescription) {
  var self = this;
  var pc = self._peerConnections[targetMid];

  // Added checks to ensure that sessionDescription is defined first
  if (!(!!sessionDescription && !!sessionDescription.sdp)) {
    Log.error(self._debugOptions.instanceId, [targetMid, 'RTCSessionDescription', null,
      'Local session description is undefined ->'], sessionDescription);
    return;
  }

  // Added checks to ensure that connection object is defined first
  if (!pc) {
    Log.error(self._debugOptions.instanceId, [targetMid, 'RTCSessionDescription', sessionDescription.type,
      'Local session description will not be set as connection does not exists ->'], sessionDescription);
    return;

  } else if (sessionDescription.type === self.HANDSHAKE_PROGRESS.OFFER &&
    pc.signalingState !== self.PEER_CONNECTION_STATE.STABLE) {
    Log.error(self._debugOptions.instanceId, [targetMid, 'RTCSessionDescription', sessionDescription.type, 'Local session description ' +
      'will not be set as signaling state is "' + pc.signalingState + '" ->'], sessionDescription);
    return;

  // Added checks to ensure that state is "have-remote-offer" if setting local "answer"
  } else if (sessionDescription.type === self.HANDSHAKE_PROGRESS.ANSWER &&
    pc.signalingState !== self.PEER_CONNECTION_STATE.HAVE_REMOTE_OFFER) {
    Log.error(self._debugOptions.instanceId, [targetMid, 'RTCSessionDescription', sessionDescription.type, 'Local session description ' +
      'will not be set as signaling state is "' + pc.signalingState + '" ->'], sessionDescription);
    return;

  // Added checks if there is a current local sessionDescription being processing before processing this one
  } else if (pc.processingLocalSDP) {
    Log.error(self._debugOptions.instanceId, [targetMid, 'RTCSessionDescription', sessionDescription.type,
      'Local session description will not be set as another is being processed ->'], sessionDescription);
    return;
  }

  pc.processingLocalSDP = true;

  // Sets and expected receiving codecs etc.
  //sessionDescription.sdp = self._setSDPOpusConfig(targetMid, sessionDescription);
  //sessionDescription.sdp = self._setSDPCodec(targetMid, sessionDescription);
  sessionDescription.sdp = self._removeSDPFirefoxH264Pref(targetMid, sessionDescription);
  sessionDescription.sdp = self._removeSDPH264VP9AptRtxForOlderPlugin(targetMid, sessionDescription);
  sessionDescription.sdp = self._removeSDPCodecs(targetMid, sessionDescription);
  sessionDescription.sdp = self._handleSDPConnectionSettings(targetMid, sessionDescription, 'local');
  //sessionDescription.sdp = self._setSDPBitrate(targetMid, sessionDescription);
  sessionDescription.sdp = self._removeSDPREMBPackets(targetMid, sessionDescription);

  Log.log(self._debugOptions.instanceId, [targetMid, 'RTCSessionDescription', sessionDescription.type,
    'Local session description updated ->'], sessionDescription.sdp);

  pc.setLocalDescription(sessionDescription, function() {
    Log.debug(self._debugOptions.instanceId, [targetMid, 'RTCSessionDescription', sessionDescription.type,
      'Local session description has been set ->'], sessionDescription);

    pc.processingLocalSDP = false;

    self._trigger('handshakeProgress', sessionDescription.type, targetMid);

    if (sessionDescription.type === self.HANDSHAKE_PROGRESS.ANSWER) {
      pc.setAnswer = 'local';
    } else {
      pc.setOffer = 'local';
    }

    if (!self._enableIceTrickle && !pc.gathered) {
      Log.log(self._debugOptions.instanceId, [targetMid, 'RTCSessionDescription', sessionDescription.type,
        'Local session description sending is halted to complete ICE gathering.']);
      return;
    }

    self._sendChannelMessage({
      type: sessionDescription.type,
      sdp: self._addSDPMediaStreamTrackIDs(targetMid, sessionDescription),
      mid: self._user.sid,
      target: targetMid,
      rid: self._room.id,
      userInfo: self._getUserInfo()
    });

  }, function(error) {
    Log.error(self._debugOptions.instanceId, [targetMid, 'RTCSessionDescription',
      sessionDescription.type, 'Local description failed setting ->'], error);

    pc.processingLocalSDP = false;

    self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.ERROR, targetMid, error);
  });
};

Skylink.prototype._waitForOpenChannel = function(mediaOptions, callback) {
  var self = this;
  // when reopening room, it should stay as 0
  self._socketCurrentReconnectionAttempt = 0;

  // wait for ready state before opening
  self._wait(function() {
    self._condition('channelOpen', function() {
      mediaOptions = mediaOptions || {};

      self._userData = mediaOptions.userData || self._userData || '';
      self._streamsBandwidthSettings = {
        googleX: {},
        bAS: {}
      };
      self._publishOnly = false;
      self._sdpSettings = {
        connection: {
          audio: true,
          video: true,
          data: true
        },
        direction: {
          audio: { send: true, receive: true },
          video: { send: true, receive: true }
        }
      };

      if (mediaOptions.bandwidth) {
        if (typeof mediaOptions.bandwidth.audio === 'number') {
          self._streamsBandwidthSettings.bAS.audio = mediaOptions.bandwidth.audio;
        }

        if (typeof mediaOptions.bandwidth.video === 'number') {
          self._streamsBandwidthSettings.bAS.video = mediaOptions.bandwidth.video;
        }

        if (typeof mediaOptions.bandwidth.data === 'number') {
          self._streamsBandwidthSettings.bAS.data = mediaOptions.bandwidth.data;
        }
      }

      if (mediaOptions.googleXBandwidth) {
        if (typeof mediaOptions.googleXBandwidth.min === 'number') {
          self._streamsBandwidthSettings.googleX.min = mediaOptions.googleXBandwidth.min;
        }

        if (typeof mediaOptions.googleXBandwidth.max === 'number') {
          self._streamsBandwidthSettings.googleX.max = mediaOptions.googleXBandwidth.max;
        }
      }

      if (mediaOptions.sdpSettings) {
        if (mediaOptions.sdpSettings.direction) {
          if (mediaOptions.sdpSettings.direction.audio) {
            self._sdpSettings.direction.audio.receive = typeof mediaOptions.sdpSettings.direction.audio.receive === 'boolean' ?
              mediaOptions.sdpSettings.direction.audio.receive : true;
            self._sdpSettings.direction.audio.send = typeof mediaOptions.sdpSettings.direction.audio.send === 'boolean' ?
              mediaOptions.sdpSettings.direction.audio.send : true;
          }

          if (mediaOptions.sdpSettings.direction.video) {
            self._sdpSettings.direction.video.receive = typeof mediaOptions.sdpSettings.direction.video.receive === 'boolean' ?
              mediaOptions.sdpSettings.direction.video.receive : true;
            self._sdpSettings.direction.video.send = typeof mediaOptions.sdpSettings.direction.video.send === 'boolean' ?
              mediaOptions.sdpSettings.direction.video.send : true;
          }
        }
        if (mediaOptions.sdpSettings.connection) {
          self._sdpSettings.connection.audio = typeof mediaOptions.sdpSettings.connection.audio === 'boolean' ?
            mediaOptions.sdpSettings.connection.audio : true;
          self._sdpSettings.connection.video = typeof mediaOptions.sdpSettings.connection.video === 'boolean' ?
            mediaOptions.sdpSettings.connection.video : true;
          self._sdpSettings.connection.data = typeof mediaOptions.sdpSettings.connection.data === 'boolean' ?
            mediaOptions.sdpSettings.connection.data : true;
        }
      }

      if (mediaOptions.publishOnly) {
        self._sdpSettings.direction.audio.send = true;
        self._sdpSettings.direction.audio.receive = false;
        self._sdpSettings.direction.video.send = true;
        self._sdpSettings.direction.video.receive = false;
        self._publishOnly = true;

        if (typeof mediaOptions.publishOnly === 'object' && mediaOptions.publishOnly.parentId &&
          typeof mediaOptions.publishOnly.parentId === 'string') {
          self._parentId = mediaOptions.publishOnly.parentId;
        }
      }

      if (mediaOptions.parentId) {
        self._parentId = mediaOptions.parentId;
      }

      // get the stream
      if (mediaOptions.manualGetUserMedia === true) {
        self._trigger('mediaAccessRequired');

        var current50Block = 0;
        var mediaAccessRequiredFailure = false;
        // wait for available audio or video stream
        self._wait(function () {
          if (mediaAccessRequiredFailure === true) {
            self._onUserMediaError(new Error('Waiting for stream timeout'), false, false);
          } else {
            callback(null, self._streams.userMedia.stream);
          }
        }, function () {
          current50Block += 1;
          if (current50Block === 600) {
            mediaAccessRequiredFailure = true;
            return true;
          }

          if (self._streams.userMedia && self._streams.userMedia.stream) {
            return true;
          }
        }, 50);
        return;
      }

      if (mediaOptions.audio || mediaOptions.video) {
        self.getUserMedia({
          useExactConstraints: !!mediaOptions.useExactConstraints,
          audio: mediaOptions.audio,
          video: mediaOptions.video

        }, function (error, success) {
          if (error) {
            callback(error, null);
          } else {
            callback(null, success);
          }
        });
        return;
      }

      callback(null, null);

    }, function() { // open channel first if it's not opened

      if (!self._channelOpen) {
        self._openChannel();
      }
      return self._channelOpen;
    }, function(state) {
      return true;
    });
  }, function() {
    return self._readyState === self.READY_STATE_CHANGE.COMPLETED;
  });

};

Skylink.prototype._requestServerInfo = function(method, url, callback, params) {
  var self = this;
  // XDomainRequest is supported in IE8 - 9
  var useXDomainRequest = typeof window.XDomainRequest === 'function' ||
    typeof window.XDomainRequest === 'object';

  self._socketUseXDR = useXDomainRequest;
  var xhr;

  // set force SSL option
  url = (self._forceSSL) ? 'https:' + url : url;

  if (useXDomainRequest) {
    Log.debug(self._debugOptions.instanceId, [null, 'XMLHttpRequest', method, 'Using XDomainRequest. ' +
      'XMLHttpRequest is now XDomainRequest'], {
      agent: window.webrtcDetectedBrowser,
      version: window.webrtcDetectedVersion
    });
    xhr = new XDomainRequest();
    xhr.setContentType = function (contentType) {
      xhr.contentType = contentType;
    };
  } else {
    Log.debug(self._debugOptions.instanceId, [null, 'XMLHttpRequest', method, 'Using XMLHttpRequest'], {
      agent: window.webrtcDetectedBrowser,
      version: window.webrtcDetectedVersion
    });
    xhr = new window.XMLHttpRequest();
    xhr.setContentType = function (contentType) {
      xhr.setRequestHeader('Content-type', contentType);
    };
  }

  xhr.onload = function () {
    var response = xhr.responseText || xhr.response;
    var status = xhr.status || 200;
    Log.debug(self._debugOptions.instanceId, [null, 'XMLHttpRequest', method, 'Received sessions parameters'],
      JSON.parse(response || '{}'));
    callback(status, JSON.parse(response || '{}'));
  };

  xhr.onerror = function (error) {
    Log.error(self._debugOptions.instanceId, [null, 'XMLHttpRequest', method, 'Failed retrieving information:'],
      { status: xhr.status });
    self._readyState = -1;
    self._trigger('readyStateChange', self.READY_STATE_CHANGE.ERROR, {
      status: xhr.status || null,
      content: 'Network error occurred. (Status: ' + xhr.status + ')',
      errorCode: self.READY_STATE_CHANGE_ERROR.XML_HTTP_REQUEST_ERROR
    }, self._selectedRoom);
  };

  xhr.onprogress = function () {
    Log.debug(self._debugOptions.instanceId, [null, 'XMLHttpRequest', method,
      'Retrieving information and config from webserver. Url:'], url);
    Log.debug(self._debugOptions.instanceId, [null, 'XMLHttpRequest', method, 'Provided parameters:'], params);
  };

  xhr.open(method, url, true);
  if (params) {
    xhr.setContentType('application/json;charset=UTF-8');
    xhr.send(JSON.stringify(params));
  } else {
    xhr.send();
  }
};

/**
 * Parses the Room credentials information retrieved from API server.
 * @method _parseInfo
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._parseInfo = function(info) {
  Log.log(this._debugOptions.instanceId, 'Parsing parameter from server', info);
  if (!info.pc_constraints && !info.offer_constraints) {
    this._trigger('readyStateChange', this.READY_STATE_CHANGE.ERROR, {
      status: 200,
      content: info.info,
      errorCode: info.error
    }, self._selectedRoom);
    return;
  }

  Log.debug(this._debugOptions.instanceId, 'Peer connection constraints:', info.pc_constraints);
  Log.debug(this._debugOptions.instanceId, 'Offer constraints:', info.offer_constraints);

  this._key = info.cid;
  this._appKeyOwner = info.apiOwner;

  this._signalingServer = info.ipSigserver;
  this._signalingServerPort = null;

  this._isPrivileged = info.isPrivileged;
  this._autoIntroduce = info.autoIntroduce;

  this._user = {
    uid: info.username,
    token: info.userCred,
    timeStamp: info.timeStamp,
    streams: [],
    info: {}
  };
  this._room = {
    id: info.room_key,
    token: info.roomCred,
    startDateTime: info.start,
    duration: info.len,
    connection: {
      peerConstraints: JSON.parse(info.pc_constraints),
      peerConfig: null,
      offerConstraints: JSON.parse(info.offer_constraints),
      sdpConstraints: {
        mandatory: {
          OfferToReceiveAudio: true,
          OfferToReceiveVideo: true
        }
      },
      mediaConstraints: JSON.parse(info.media_constraints)
    }
  };
  //this._parseDefaultMediaStreamSettings(this._room.connection.mediaConstraints);

  // set the socket ports
  this._socketPorts = {
    'http:': info.httpPortList,
    'https:': info.httpsPortList
  };

  // use default bandwidth and media resolution provided by server
  //this._streamSettings.bandwidth = info.bandwidth;
  //this._streamSettings.video = info.video;
  this._readyState = 2;
  this._trigger('readyStateChange', this.READY_STATE_CHANGE.COMPLETED, null, this._selectedRoom);
  Log.info(this._debugOptions.instanceId, 'Parsed parameters from webserver. ' +
    'Ready for web-realtime communication');

};

/**
 * Loads and checks the dependencies if they are loaded correctly.
 * @method _loadInfo
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._loadInfo = function() {
  var self = this;

  // check if adapterjs has been loaded already first or not
  var adapter = (function () {
    try {
      return window.AdapterJS || AdapterJS;
    } catch (error) {
      return false;
    }
  })();

  if (!(!!adapter ? typeof adapter.webRTCReady === 'function' : false)) {
    var noAdapterErrorMsg = 'AdapterJS dependency is not loaded or incorrect AdapterJS dependency is used';
    self._trigger('readyStateChange', self.READY_STATE_CHANGE.ERROR, {
      status: null,
      content: noAdapterErrorMsg,
      errorCode: self.READY_STATE_CHANGE_ERROR.ADAPTER_NO_LOADED
    }, self._selectedRoom);
    return;
  }
  if (!window.io) {
    Log.error(self._debugOptions.instanceId, 'Socket.io not loaded. Please load socket.io');
    self._readyState = -1;
    self._trigger('readyStateChange', self.READY_STATE_CHANGE.ERROR, {
      status: null,
      content: 'Socket.io not found',
      errorCode: self.READY_STATE_CHANGE_ERROR.NO_SOCKET_IO
    }, self._selectedRoom);
    return;
  }
  if (!window.XMLHttpRequest) {
    Log.error(self._debugOptions.instanceId, 'XMLHttpRequest not supported. Please upgrade your browser');
    self._readyState = -1;
    self._trigger('readyStateChange', self.READY_STATE_CHANGE.ERROR, {
      status: null,
      content: 'XMLHttpRequest not available',
      errorCode: self.READY_STATE_CHANGE_ERROR.NO_XMLHTTPREQUEST_SUPPORT
    }, self._selectedRoom);
    return;
  }
  if (!self._path) {
    Log.error(self._debugOptions.instanceId, 'Skylink is not initialised. Please call init() first');
    self._readyState = -1;
    self._trigger('readyStateChange', self.READY_STATE_CHANGE.ERROR, {
      status: null,
      content: 'No API Path is found',
      errorCode: self.READY_STATE_CHANGE_ERROR.NO_PATH
    }, self._selectedRoom);
    return;
  }
  adapter.webRTCReady(function () {
    self._isUsingPlugin = !!adapter.WebRTCPlugin.plugin && !!adapter.WebRTCPlugin.plugin.VERSION;

    if (!window.RTCPeerConnection) {
      Log.error(self._debugOptions.instanceId, 'WebRTC not supported. Please upgrade your browser');
      self._readyState = -1;
      self._trigger('readyStateChange', self.READY_STATE_CHANGE.ERROR, {
        status: null,
        content: 'WebRTC not available',
        errorCode: self.READY_STATE_CHANGE_ERROR.NO_WEBRTC_SUPPORT
      }, self._selectedRoom);
      return;
    }

    self._getCodecsSupport(function (error) {
      if (error) {
        Log.error(self._debugOptions.instanceId, error);
        self._readyState = -1;
        self._trigger('readyStateChange', self.READY_STATE_CHANGE.ERROR, {
          status: null,
          content: error.message || error.toString(),
          errorCode: self.READY_STATE_CHANGE_ERROR.PARSE_CODECS
        }, self._selectedRoom);
        return;
      }

      if (Object.keys(self._currentCodecSupport.audio).length === 0 && Object.keys(self._currentCodecSupport.video).length === 0) {
        Log.error(self._debugOptions.instanceId, 'No audio/video codecs available to start connection.');
        self._readyState = -1;
        self._trigger('readyStateChange', self.READY_STATE_CHANGE.ERROR, {
          status: null,
          content: 'No audio/video codecs available to start connection',
          errorCode: self.READY_STATE_CHANGE_ERROR.PARSE_CODECS
        }, self._selectedRoom);
        return;
      }

      self._readyState = 1;
      self._trigger('readyStateChange', self.READY_STATE_CHANGE.LOADING, null, self._selectedRoom);
      self._requestServerInfo('GET', self._path, function(status, response) {
        if (status !== 200) {
          // 403 - Room is locked
          // 401 - API Not authorized
          // 402 - run out of credits
          var errorMessage = 'XMLHttpRequest status not OK\nStatus was: ' + status;
          self._readyState = 0;
          self._trigger('readyStateChange', self.READY_STATE_CHANGE.ERROR, {
            status: status,
            content: (response) ? (response.info || errorMessage) : errorMessage,
            errorCode: response.error ||
              self.READY_STATE_CHANGE_ERROR.INVALID_XMLHTTPREQUEST_STATUS
          }, self._selectedRoom);
          return;
        }
        self._parseInfo(response);
      });
    });
  });
};

/**
 * Starts initialising for Room credentials for room name provided in <code>joinRoom()</code> method.
 * @method _initSelectedRoom
 * @private
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._initSelectedRoom = function(room, callback) {
  var self = this;
  if (typeof room === 'function' || typeof room === 'undefined') {
    Log.error(self._debugOptions.instanceId, 'Invalid room provided. Room:', room);
    return;
  }
  var defaultRoom = self._defaultRoom;
  var initOptions = {
    appKey: self._appKey,
    roomServer: self._roomServer,
    defaultRoom: room,
    enableDataChannel: self._enableDataChannel,
    enableIceTrickle: self._enableIceTrickle,
    enableTURNServer: self._enableTURN,
    enableSTUNServer: self._enableSTUN,
    TURNServerTransport: self._TURNTransport,
    audioFallback: self._audioFallback,
    forceSSL: self._forceSSL,
    socketTimeout: self._socketTimeout,
    forceTURNSSL: self._forceTURNSSL,
    audioCodec: self._selectedAudioCodec,
    videoCodec: self._selectedVideoCodec,
    forceTURN: self._forceTURN,
    usePublicSTUN: self._usePublicSTUN,
    disableVideoFecCodecs: self._disableVideoFecCodecs,
    disableComfortNoiseCodec: self._disableComfortNoiseCodec,
    disableREMB: self._disableREMB,
    filterCandidatesType: self._filterCandidatesType,
    throttleIntervals: self._throttlingTimeouts,
    throttleShouldThrowError: self._throttlingShouldThrowError,
    mcuUseRenegoRestart: self._mcuUseRenegoRestart,
    iceServer: self._turnServer,
    socketServer: self._socketServer
  };
  if (self._roomCredentials) {
    initOptions.credentials = {
      credentials: self._roomCredentials,
      duration: self._roomDuration,
      startDateTime: self._roomStart
    };
  }
  self.init(initOptions, function (error, success) {
    self._defaultRoom = defaultRoom;
    if (error) {
      callback(error, null);
    } else {
      callback(null, success);
    }
  });
};


Skylink.prototype._trigger = function(eventName) {
  //convert the arguments into an array
  var args = Array.prototype.slice.call(arguments);
  var arr = this._EVENTS[eventName];
  var once = this._onceEvents[eventName] || null;
  args.shift(); //Omit the first argument since it's the event name
  if (arr) {
    // for events subscribed forever
    for (var i = 0; i < arr.length; i++) {
      try {
        Log.log(this._debugOptions.instanceId, [null, 'Event', eventName, 'Event is fired']);
        if(arr[i].apply(this, args) === false) {
          break;
        }
      } catch(error) {
        Log.error(this._debugOptions.instanceId, [null, 'Event', eventName, 'Exception occurred in event:'], error);
        throw error;
      }
    }
  }
  if (once){
    // for events subscribed on once
    for (var j = 0; j < once.length; j++) {
      if (once[j][1].apply(this, args) === true) {
        Log.log(this._debugOptions.instanceId, [null, 'Event', eventName, 'Condition is met. Firing event']);
        if(once[j][0].apply(this, args) === false) {
          break;
        }
        if (once[j] && !once[j][2]) {
          Log.log(this._debugOptions.instanceId, [null, 'Event', eventName, 'Removing event after firing once']);
          once.splice(j, 1);
          //After removing current element, the next element should be element of the same index
          j--;
        }
      } else {
        Log.log(this._debugOptions.instanceId, [null, 'Event', eventName, 'Condition is still not met. ' +
          'Holding event from being fired']);
      }
    }
  }
  Log.log(this._debugOptions.instanceId, [null, 'Event', eventName, 'Event is triggered']);
};



/**
 * Function that checks if the current state condition is met before subscribing
 *   event handler to wait for condition to be fulfilled.
 * @method _condition
 * @private
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._condition = function(eventName, callback, checkFirst, condition, fireAlways) {
  if (typeof condition === 'boolean') {
    fireAlways = condition;
    condition = null;
  }
  if (typeof callback === 'function' && typeof checkFirst === 'function') {
    if (checkFirst()) {
      Log.log(this._debugOptions.instanceId, [null, 'Event', eventName, 'First condition is met. Firing callback']);
      callback();
      return;
    }
    Log.log(this._debugOptions.instanceId, [null, 'Event', eventName, 'First condition is not met. Subscribing to event']);
    this.once(eventName, callback, condition, fireAlways);
  } else {
    Log.error(this._debugOptions.instanceId, [null, 'Event', eventName, 'Provided callback or checkFirst is not a function']);
  }
};

/**
 * Function that starts an interval check to wait for a condition to be resolved.
 * @method _wait
 * @private
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._wait = function(callback, condition, intervalTime, fireAlways) {
  fireAlways = (typeof fireAlways === 'undefined' ? false : fireAlways);
  if (typeof callback === 'function' && typeof condition === 'function') {
    if (condition()) {
      Log.log(this._debugOptions.instanceId, [null, 'Event', null, 'Condition is met. Firing callback']);
      callback();
      return;
    }
    Log.log(this._debugOptions.instanceId, [null, 'Event', null, 'Condition is not met. Doing a check.']);

    intervalTime = (typeof intervalTime === 'number') ? intervalTime : 50;

    var doWait = setInterval(function () {
      if (condition()) {
        Log.log(this._debugOptions.instanceId, [null, 'Event', null, 'Condition is met after waiting. Firing callback']);
        if (!fireAlways){
          clearInterval(doWait);
        }
        callback();
      }
    }, intervalTime);
  } else {
    if (typeof callback !== 'function'){
      Log.error(this._debugOptions.instanceId, [null, 'Event', null, 'Provided callback is not a function']);
    }
    if (typeof condition !== 'function'){
      Log.error(this._debugOptions.instanceId, [null, 'Event', null, 'Provided condition is not a function']);
    }
  }
};

/**
 * Function that throttles a method function to prevent multiple invokes over a specified amount of time.
 * Returns a function to be invoked <code>._throttle(fn, 1000)()</code> to make throttling functionality work.
 * @method _throttle
 * @private
 * @for Skylink
 * @since 0.5.8
 */
Skylink.prototype._throttle = function(func, prop, wait){
  var self = this;
  var now = (new Date()).getTime();

  if (!(self._timestamp[prop] && ((now - self._timestamp[prop]) < wait))) {
    func(true);
    self._timestamp[prop] = now;
  } else {
    func(false);
  }
};
Skylink.prototype._sendChannelMessage = function(message) {
  var self = this;
  var interval = 1000;
  var throughput = 16;

  if (!self._channelOpen || !self._user || !self._socket) {
    Log.error(self._debugOptions.instanceId, [message.target || 'Server', 'Socket', message.type,
      'Dropping of message as Socket connection is not opened or is at incorrect step ->'], message);
    return;
  }

  if (self._user.sid && !self._peerMessagesStamps[self._user.sid]) {
    self._peerMessagesStamps[self._user.sid] = {
      userData: 0,
      audioMuted: 0,
      videoMuted: 0
    };
  }

  var checkStampFn = function (statusMessage) {
    if (statusMessage.type === self._SIG_MESSAGE_TYPE.UPDATE_USER) {
      if (!self._user.sid) {
        return false;
      }
      return statusMessage.stamp > self._peerMessagesStamps[self._user.sid].userData;
    } else if (statusMessage.type === self._SIG_MESSAGE_TYPE.MUTE_VIDEO) {
      if (!self._user.sid) {
        return false;
      }
      return statusMessage.stamp > self._peerMessagesStamps[self._user.sid].videoMuted;
    } else if (statusMessage.type === self._SIG_MESSAGE_TYPE.MUTE_AUDIO) {
      if (!self._user.sid) {
        return false;
      }
      return statusMessage.stamp > self._peerMessagesStamps[self._user.sid].audioMuted;
    }
    return true;
  };

  var setStampFn = function (statusMessage) {
    if (statusMessage.type === self._SIG_MESSAGE_TYPE.UPDATE_USER) {
      self._peerMessagesStamps[self._user.sid].userData = statusMessage.stamp;
    } else if (statusMessage.type === self._SIG_MESSAGE_TYPE.MUTE_VIDEO) {
      self._peerMessagesStamps[self._user.sid].videoMuted = statusMessage.stamp;
    } else if (statusMessage.type === self._SIG_MESSAGE_TYPE.MUTE_AUDIO) {
      self._peerMessagesStamps[self._user.sid].audioMuted = statusMessage.stamp;
    }
  };

  var setQueueFn = function () {
    Log.debug(self._debugOptions.instanceId, [null, 'Socket', null, 'Starting queue timeout']);

    self._socketMessageTimeout = setTimeout(function () {
      if (((new Date ()).getTime() - self._timestamp.socketMessage) <= interval) {
        Log.debug(self._debugOptions.instanceId, [null, 'Socket', null, 'Restarting queue timeout']);
        setQueueFn();
        return;
      }
      startSendingQueuedMessageFn();
    }, interval - ((new Date ()).getTime() - self._timestamp.socketMessage));
  };

  var triggerEventFn = function (eventMessage) {
    if (eventMessage.type === self._SIG_MESSAGE_TYPE.PUBLIC_MESSAGE) {
      self._trigger('incomingMessage', {
        content: eventMessage.data,
        isPrivate: false,
        targetPeerId: null,
        listOfPeers: Object.keys(self._peerInformations),
        isDataChannel: false,
        senderPeerId: self._user.sid
      }, self._user.sid, self.getPeerInfo(), true);
    }
  };

  var sendGroupMessageFn = function (groupMessageList) {
    self._socketMessageTimeout = null;

    if (!self._channelOpen || !(self._user && self._user.sid) || !self._socket) {
      Log.error(self._debugOptions.instanceId, [message.target || 'Server', 'Socket', null,
        'Dropping of group messages as Socket connection is not opened or is at incorrect step ->'], groupMessageList);
      return;
    }

    var strGroupMessageList = [];
    var stamps = {
      userData: 0,
      audioMuted: 0,
      videoMuted: 0
    };

    for (var k = 0; k < groupMessageList.length; k++) {
      if (checkStampFn(groupMessageList[k])) {
        if (groupMessageList[k].type === self._SIG_MESSAGE_TYPE.UPDATE_USER &&
          groupMessageList[k].stamp > self._peerMessagesStamps[self._user.sid].userData &&
          groupMessageList[k].stamp > stamps.userData) {
          stamps.userData = groupMessageList[k].stamp;
        } else if (groupMessageList[k].type === self._SIG_MESSAGE_TYPE.MUTE_AUDIO &&
          groupMessageList[k].stamp > self._peerMessagesStamps[self._user.sid].audioMuted &&
          groupMessageList[k].stamp > stamps.audioMuted) {
          stamps.audioMuted = groupMessageList[k].stamp;
        } else if (groupMessageList[k].type === self._SIG_MESSAGE_TYPE.MUTE_VIDEO &&
          groupMessageList[k].stamp > self._peerMessagesStamps[self._user.sid].videoMuted &&
          groupMessageList[k].stamp > stamps.videoMuted) {
          stamps.videoMuted = groupMessageList[k].stamp;
        }
      }
    }

    for (var i = 0; i < groupMessageList.length; i++) {
      if ((groupMessageList[i].type === self._SIG_MESSAGE_TYPE.UPDATE_USER &&
          groupMessageList[i].stamp < stamps.userData) ||
          (groupMessageList[i].type === self._SIG_MESSAGE_TYPE.MUTE_AUDIO &&
          groupMessageList[i].stamp < stamps.audioMuted) ||
          (groupMessageList[i].type === self._SIG_MESSAGE_TYPE.MUTE_VIDEO &&
          groupMessageList[i].stamp < stamps.videoMuted)) {
        Log.error(self._debugOptions.instanceId, [message.target || 'Server', 'Socket', groupMessageList[i],
          'Dropping of outdated status message ->'], UtilsFactory.clone(groupMessageList[i]));
        groupMessageList.splice(i, 1);
        i--;
        continue;
      }
      strGroupMessageList.push(JSON.stringify(groupMessageList[i]));
    }

    if (strGroupMessageList.length > 0) {
      var groupMessage = {
        type: self._SIG_MESSAGE_TYPE.GROUP,
        lists: strGroupMessageList,
        mid: self._user.sid,
        rid: self._room.id
      };

      Log.debug(self._debugOptions.instanceId, [message.target || 'Server', 'Socket', groupMessage.type,
        'Sending queued grouped message (max: 16 per group) ->'], UtilsFactory.clone(groupMessage));

      self._socket.send(JSON.stringify(groupMessage));
      self._timestamp.socketMessage = (new Date()).getTime();

      for (var j = 0; j < groupMessageList.length; j++) {
        setStampFn(groupMessageList[j]);
        triggerEventFn(groupMessageList[j]);
      }
    }
  };

  var startSendingQueuedMessageFn = function(){
    if (self._socketMessageQueue.length > 0){
      if (self._socketMessageQueue.length < throughput){
        sendGroupMessageFn(self._socketMessageQueue.splice(0, self._socketMessageQueue.length));
      } else {
        sendGroupMessageFn(self._socketMessageQueue.splice(0, throughput));
        setQueueFn();
      }
    }
  };

  if (self._groupMessageList.indexOf(message.type) > -1) {
    if (!(self._timestamp.socketMessage && ((new Date ()).getTime() - self._timestamp.socketMessage) <= interval)) {
      if (!checkStampFn(message)) {
        Log.error(self._debugOptions.instanceId, [message.target || 'Server', 'Socket', message.type,
          'Dropping of outdated status message ->'], UtilsFactory.clone(message));
        return;
      }
      if (self._socketMessageTimeout) {
        clearTimeout(self._socketMessageTimeout);
      }
      Log.error(self._debugOptions.instanceId, [message.target || 'Server', 'Socket', message.type,
        'Sending message ->'], UtilsFactory.clone(message));
      self._socket.send(JSON.stringify(message));
      setStampFn(message);
      triggerEventFn(message);

      self._timestamp.socketMessage = (new Date()).getTime();

    } else {
      Log.error(self._debugOptions.instanceId, [message.target || 'Server', 'Socket', message.type,
        'Queueing socket message to prevent message drop ->'], UtilsFactory.clone(message));

      self._socketMessageQueue.push(message);

      if (!self._socketMessageTimeout) {
        setQueueFn();
      }
    }
  } else {
    Log.debug(self._debugOptions.instanceId, [message.target || 'Server', 'Socket', message.type, 'Sending message ->'], UtilsFactory.clone(message));
    self._socket.send(JSON.stringify(message));

    // If Peer sends "bye" on its own, we trigger it as session disconnected abruptly
    if (message.type === self._SIG_MESSAGE_TYPE.BYE && self._inRoom &&
      self._user && self._user.sid && message.mid === self._user.sid) {
      self.leaveRoom(false);
      self._trigger('sessionDisconnect', self._user.sid, self.getPeerInfo());
    }
  }
};

/**
 * Function that creates and opens a socket connection to the Signaling.
 * @method _createSocket
 * @private
 * @for Skylink
 * @since 0.5.10
 */
Skylink.prototype._createSocket = function (type) {
  var self = this;
  var options = {
    forceNew: true,
    reconnection: true,
    timeout: self._socketTimeout,
    reconnectionAttempts: 2,
    reconnectionDelayMax: 5000,
    reconnectionDelay: 1000,
    transports: ['websocket']
  };
  var ports = self._socketPorts[self._signalingServerProtocol];
  var fallbackType = null;

  // just beginning
  if (self._signalingServerPort === null) {
    self._signalingServerPort = ports[0];
    self._socketSession.finalAttempts = 0;
    self._socketSession.attempts = 0;
    fallbackType = self.SOCKET_FALLBACK.NON_FALLBACK;

  // reached the end of the last port for the protocol type
  } else if (ports.indexOf(self._signalingServerPort) === ports.length - 1) {
    // re-refresh to long-polling port
    if (type === 'WebSocket') {
      type = 'Polling';
      self._signalingServerPort = ports[0];
    } else {
      self._socketSession.finalAttempts++;
    }
  // move to the next port
  } else {
    self._signalingServerPort = ports[ ports.indexOf(self._signalingServerPort) + 1 ];
  }

  if (type === 'Polling') {
    options.reconnectionDelayMax = 1000;
    options.reconnectionAttempts = 4;
    options.transports = ['xhr-polling', 'jsonp-polling', 'polling'];
  }

  var url = self._signalingServerProtocol + '//' + (self._socketServer || self._signalingServer) + ':' + self._signalingServerPort;
    //'http://ec2-52-8-93-170.us-west-1.compute.amazonaws.com:6001';

  self._socketSession.transportType = type;
  self._socketSession.socketOptions = options;
  self._socketSession.socketServer = url;

  if (fallbackType === null) {
    fallbackType = self._signalingServerProtocol === 'http:' ?
      (type === 'Polling' ? self.SOCKET_FALLBACK.LONG_POLLING : self.SOCKET_FALLBACK.FALLBACK_PORT) :
      (type === 'Polling' ? self.SOCKET_FALLBACK.LONG_POLLING_SSL : self.SOCKET_FALLBACK.FALLBACK_SSL_PORT);

    self._socketSession.attempts++;
    self._trigger('socketError', self.SOCKET_ERROR.RECONNECTION_ATTEMPT, null, fallbackType, UtilsFactory.clone(self._socketSession));
    self._trigger('channelRetry', fallbackType, self._socketSession.attempts, UtilsFactory.clone(self._socketSession));
  }

  // if socket instance already exists, exit
  if (self._socket) {
    self._socket.removeAllListeners('connect_error');
    self._socket.removeAllListeners('reconnect_attempt');
    self._socket.removeAllListeners('reconnect_error');
    self._socket.removeAllListeners('reconnect_failed');
    self._socket.removeAllListeners('connect');
    self._socket.removeAllListeners('reconnect');
    self._socket.removeAllListeners('error');
    self._socket.removeAllListeners('disconnect');
    self._socket.removeAllListeners('message');
    self._socket.disconnect();
    self._socket = null;
  }

  self._channelOpen = false;

  Log.log(self._debugOptions.instanceId, 'Opening channel with signaling server url:', UtilsFactory.clone(self._socketSession));

  self._socket = io.connect(url, options);

  self._socket.on('reconnect_attempt', function (attempt) {
    self._socketSession.attempts++;
    self._trigger('channelRetry', fallbackType, self._socketSession.attempts, UtilsFactory.clone(self._socketSession));
  });

  self._socket.on('reconnect_failed', function () {
    if (fallbackType === self.SOCKET_FALLBACK.NON_FALLBACK) {
      self._trigger('socketError', self.SOCKET_ERROR.CONNECTION_FAILED, new Error('Failed connection with transport "' +
        type + '" and port ' + self._signalingServerPort + '.'), fallbackType, UtilsFactory.clone(self._socketSession));
    } else {
      self._trigger('socketError', self.SOCKET_ERROR.RECONNECTION_FAILED, new Error('Failed reconnection with transport "' +
        type + '" and port ' + self._signalingServerPort + '.'), fallbackType, UtilsFactory.clone(self._socketSession));
    }

    if (self._socketSession.finalAttempts < 4) {
      self._createSocket(type);
    } else {
      self._trigger('socketError', self.SOCKET_ERROR.RECONNECTION_ABORTED, new Error('Reconnection aborted as ' +
        'there no more available ports, transports and final attempts left.'), fallbackType, UtilsFactory.clone(self._socketSession));
    }
  });

  self._socket.on('connect', function () {
    if (!self._channelOpen) {
      Log.log(self._debugOptions.instanceId, [null, 'Socket', null, 'Channel opened']);
      self._channelOpen = true;
      self._trigger('channelOpen', UtilsFactory.clone(self._socketSession));
    }
  });

  self._socket.on('reconnect', function () {
    if (!self._channelOpen) {
      Log.log(self._debugOptions.instanceId, [null, 'Socket', null, 'Channel opened']);
      self._channelOpen = true;
      self._trigger('channelOpen', UtilsFactory.clone(self._socketSession));
    }
  });

  self._socket.on('error', function(error) {
    Log.error(self._debugOptions.instanceId, [null, 'Socket', null, 'Exception occurred ->'], error);
    self._trigger('channelError', error, UtilsFactory.clone(self._socketSession));
  });

  self._socket.on('disconnect', function() {
    self._channelOpen = false;
    self._trigger('channelClose', UtilsFactory.clone(self._socketSession));
    Log.log(self._debugOptions.instanceId, [null, 'Socket', null, 'Channel closed']);

    if (self._inRoom && self._user && self._user.sid) {
      self.leaveRoom(false);
      self._trigger('sessionDisconnect', self._user.sid, self.getPeerInfo());
    }
  });

  self._socket.on('message', function(messageStr) {
    var message = JSON.parse(messageStr);

    Log.log(self._debugOptions.instanceId, [null, 'Socket', null, 'Received message ->'], message);

    if (message.type === self._SIG_MESSAGE_TYPE.GROUP) {
      Log.debug(self._debugOptions.instanceId, 'Bundle of ' + message.lists.length + ' messages');
      for (var i = 0; i < message.lists.length; i++) {
        var indiMessage = JSON.parse(message.lists[i]);
        self._processSigMessage(indiMessage);
        self._trigger('channelMessage', indiMessage, UtilsFactory.clone(self._socketSession));
      }
    } else {
      self._processSigMessage(message);
      self._trigger('channelMessage', message, UtilsFactory.clone(self._socketSession));
    }
  });
};

/**
 * Function that starts the socket connection to the Signaling.
 * This starts creating the socket connection and called at first not when requiring to fallback.
 * @method _openChannel
 * @private
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._openChannel = function() {
  var self = this;
  if (self._channelOpen) {
    Log.error(self._debugOptions.instanceId, [null, 'Socket', null, 'Unable to instantiate a new channel connection ' +
      'as there is already an ongoing channel connection']);
    return;
  }

  if (self._readyState !== self.READY_STATE_CHANGE.COMPLETED) {
    Log.error(self._debugOptions.instanceId, [null, 'Socket', null, 'Unable to instantiate a new channel connection ' +
      'as readyState is not ready']);
    return;
  }

  // set if forceSSL
  if (self._forceSSL) {
    self._signalingServerProtocol = 'https:';
  } else {
    self._signalingServerProtocol = window.location.protocol;
  }

  var socketType = 'WebSocket';

  // For IE < 9 that doesn't support WebSocket
  if (!window.WebSocket) {
    socketType = 'Polling';
  }

  self._signalingServerPort = null;

  // Begin with a websocket connection
  self._createSocket(socketType);
};

/**
 * Function that stops the socket connection to the Signaling.
 * @method _closeChannel
 * @private
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._closeChannel = function() {
  if (this._socket) {
    this._socket.removeAllListeners('connect_error');
    this._socket.removeAllListeners('reconnect_attempt');
    this._socket.removeAllListeners('reconnect_error');
    this._socket.removeAllListeners('reconnect_failed');
    this._socket.removeAllListeners('connect');
    this._socket.removeAllListeners('reconnect');
    this._socket.removeAllListeners('error');
    this._socket.removeAllListeners('disconnect');
    this._socket.removeAllListeners('message');
  }

  if (this._channelOpen) {
    if (this._socket) {
      this._socket.disconnect();
    }

    Log.log(this._debugOptions.instanceId, [null, 'Socket', null, 'Channel closed']);

    this._channelOpen = false;
    this._trigger('channelClose', UtilsFactory.clone(this._socketSession));
  }

  this._socket = null;
};
Skylink.prototype._processSigMessage = function(message, session) {
  var origin = message.mid;
  if (!origin || origin === this._user.sid) {
    origin = 'Server';
  }
  Log.debug(this._debugOptions.instanceId, [origin, 'Socket', message.type, 'Received from peer ->'], UtilsFactory.clone(message));
  if (message.mid === this._user.sid &&
    message.type !== this._SIG_MESSAGE_TYPE.REDIRECT &&
    message.type !== this._SIG_MESSAGE_TYPE.IN_ROOM) {
    Log.debug(this._debugOptions.instanceId, [origin, 'Socket', message.type, 'Ignoring message ->'], UtilsFactory.clone(message));
    return;
  }
  switch (message.type) {
  //--- BASIC API Messages ----
  case this._SIG_MESSAGE_TYPE.PUBLIC_MESSAGE:
    this._publicMessageHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.PRIVATE_MESSAGE:
    this._privateMessageHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.IN_ROOM:
    this._inRoomHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.ENTER:
    this._enterHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.WELCOME:
    this._welcomeHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.RESTART:
    this._restartHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.OFFER:
    this._offerHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.ANSWER:
    this._answerHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.CANDIDATE:
    this._candidateHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.BYE:
    this._byeHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.REDIRECT:
    this._redirectHandler(message);
    break;
    //--- ADVANCED API Messages ----
  case this._SIG_MESSAGE_TYPE.UPDATE_USER:
    this._updateUserEventHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.MUTE_VIDEO:
    this._muteVideoEventHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.MUTE_AUDIO:
    this._muteAudioEventHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.STREAM:
    this._streamEventHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.ROOM_LOCK:
    this._roomLockEventHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.PEER_LIST:
    this._peerListEventHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.INTRODUCE_ERROR:
    this._introduceErrorEventHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.APPROACH:
    this._approachEventHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.RECORDING:
    this._recordingEventHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.END_OF_CANDIDATES:
    this._endOfCandidatesHandler(message);
    break;
  default:
    Log.error(this._debugOptions.instanceId, [message.mid, 'Socket', message.type, 'Unsupported message ->'], UtilsFactory.clone(message));
    break;
  }
};

/**
 * Function that handles the "peerList" socket message received.
 * See confluence docs for the "peerList" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _peerListEventHandler
 * @private
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype._peerListEventHandler = function(message){
  var self = this;
  self._peerList = message.result;
  Log.log(self._debugOptions.instanceId, ['Server', null, message.type, 'Received list of peers'], self._peerList);
  self._trigger('getPeersStateChange',self.GET_PEERS_STATE.RECEIVED, self._user.sid, self._peerList);
};

/**
 * Function that handles the "endOfCandidates" socket message received.
 * See confluence docs for the "endOfCandidates" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _endOfCandidatesHandler
 * @private
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype._endOfCandidatesHandler = function(message){
  var self = this;
  var targetMid = message.mid;

  if (!(self._peerConnections[targetMid] &&
    self._peerConnections[targetMid].signalingState !== self.PEER_CONNECTION_STATE.CLOSED)) {
    return;
  }

  self._peerEndOfCandidatesCounter[targetMid].expectedLen = message.noOfExpectedCandidates || 0;
  self._signalingEndOfCandidates(targetMid);
};

/**
 * Function that handles the "introduceError" socket message received.
 * See confluence docs for the "introduceError" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _introduceErrorEventHandler
 * @private
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype._introduceErrorEventHandler = function(message){
  var self = this;
  Log.log(self._debugOptions.instanceId, ['Server', null, message.type, 'Introduce failed. Reason: '+message.reason]);
  self._trigger('introduceStateChange',self.INTRODUCE_STATE.ERROR, self._user.sid,
    message.sendingPeerId, message.receivingPeerId, message.reason);
};

/**
 * Function that handles the "approach" socket message received.
 * See confluence docs for the "approach" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _approachEventHandler
 * @private
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype._approachEventHandler = function(message){
  var self = this;
  Log.log(self._debugOptions.instanceId, ['Server', null, message.type, 'Approaching peer'], message.target);
  // self._room.connection.peerConfig = self._setIceServers(message.pc_config);
  // self._inRoom = true;
  self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.ENTER, self._user.sid);

  var enterMsg = {
    type: self._SIG_MESSAGE_TYPE.ENTER,
    mid: self._user.sid,
    rid: self._room.id,
    agent: window.webrtcDetectedBrowser,
    version: (window.webrtcDetectedVersion || 0).toString(),
    os: window.navigator.platform,
    userInfo: self._getUserInfo(),
    receiveOnly: self.getPeerInfo().config.receiveOnly,
    target: message.target,
    weight: self._peerPriorityWeight,
    temasysPluginVersion: AdapterJS.WebRTCPlugin.plugin ? AdapterJS.WebRTCPlugin.plugin.VERSION : null,
    enableIceTrickle: self._enableIceTrickle,
    enableDataChannel: self._enableDataChannel,
    enableIceRestart: self._enableIceRestart,
    SMProtocolVersion: self.SM_PROTOCOL_VERSION,
    DTProtocolVersion: self.DT_PROTOCOL_VERSION
  };

  if (self._publishOnly) {
    enterMsg.publishOnly = {
      type: self._streams.screenshare && self._streams.screenshare.stream ? 'screenshare' : 'video'
    };
  }

  if (self._parentId) {
    enterMsg.parentId = self._parentId;
  }

  self._sendChannelMessage(enterMsg);
};

/**
 * Function that handles the "redirect" socket message received.
 * See confluence docs for the "redirect" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _redirectHandler
 * @private
 * @for Skylink
 * @since 0.5.1
 */
Skylink.prototype._redirectHandler = function(message) {
  Log.log(this._debugOptions.instanceId, ['Server', null, message.type, 'System action warning:'], {
    message: message.info,
    reason: message.reason,
    action: message.action
  });

  if (message.action === this.SYSTEM_ACTION.REJECT) {
  	for (var key in this._peerConnections) {
  		if (this._peerConnections.hasOwnProperty(key)) {
  			this._removePeer(key);
  		}
  	}
  }

  // Handle the differences provided in Signaling server
  if (message.reason === 'toClose') {
    message.reason = 'toclose';
  }

  this._trigger('systemAction', message.action, message.info, message.reason);
};

/**
 * Function that handles the "updateUserEvent" socket message received.
 * See confluence docs for the "updateUserEvent" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _updateUserEventHandler
 * @private
 * @for Skylink
 * @since 0.2.0
 */
Skylink.prototype._updateUserEventHandler = function(message) {
  var targetMid = message.mid;
  Log.log(this._debugOptions.instanceId, [targetMid, null, message.type, 'Peer updated userData:'], message.userData);
  if (this._peerInformations[targetMid]) {
    if (this._peerMessagesStamps[targetMid] && typeof message.stamp === 'number') {
      if (message.stamp < this._peerMessagesStamps[targetMid].userData) {
        Log.warn(this._debugOptions.instanceId, [targetMid, null, message.type, 'Dropping outdated status ->'], message);
        return;
      }
      this._peerMessagesStamps[targetMid].userData = message.stamp;
    }
    this._peerInformations[targetMid].userData = message.userData || {};
    this._trigger('peerUpdated', targetMid, this.getPeerInfo(targetMid), false);
  } else {
    Log.log(this._debugOptions.instanceId, [targetMid, null, message.type, 'Peer does not have any user information']);
  }
};

/**
 * Function that handles the "roomLockEvent" socket message received.
 * See confluence docs for the "roomLockEvent" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _roomLockEventHandler
 * @private
 * @for Skylink
 * @since 0.2.0
 */
Skylink.prototype._roomLockEventHandler = function(message) {
  var targetMid = message.mid;
  Log.log(this._debugOptions.instanceId, [targetMid, message.type, 'Room lock status:'], message.lock);
  this._trigger('roomLock', message.lock, targetMid, this.getPeerInfo(targetMid), false);
};

/**
 * Function that handles the "muteAudioEvent" socket message received.
 * See confluence docs for the "muteAudioEvent" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _muteAudioEventHandler
 * @private
 * @for Skylink
 * @since 0.2.0
 */
Skylink.prototype._muteAudioEventHandler = function(message) {
  var targetMid = message.mid;
  Log.log(this._debugOptions.instanceId, [targetMid, null, message.type, 'Peer\'s audio muted:'], message.muted);
  if (this._peerInformations[targetMid]) {
    if (this._peerMessagesStamps[targetMid] && typeof message.stamp === 'number') {
      if (message.stamp < this._peerMessagesStamps[targetMid].audioMuted) {
        Log.warn(this._debugOptions.instanceId, [targetMid, null, message.type, 'Dropping outdated status ->'], message);
        return;
      }
      this._peerMessagesStamps[targetMid].audioMuted = message.stamp;
    }
    this._peerInformations[targetMid].mediaStatus.audioMuted = message.muted;
    this._trigger('streamMuted', targetMid, this.getPeerInfo(targetMid), false,
      this._peerInformations[targetMid].settings.video &&
      this._peerInformations[targetMid].settings.video.screenshare);
    this._trigger('peerUpdated', targetMid, this.getPeerInfo(targetMid), false);
  } else {
    Log.log(this._debugOptions.instanceId, [targetMid, message.type, 'Peer does not have any user information']);
  }
};

/**
 * Function that handles the "muteVideoEvent" socket message received.
 * See confluence docs for the "muteVideoEvent" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _muteVideoEventHandler
 * @private
 * @for Skylink
 * @since 0.2.0
 */
Skylink.prototype._muteVideoEventHandler = function(message) {
  var targetMid = message.mid;
  Log.log(this._debugOptions.instanceId, [targetMid, null, message.type, 'Peer\'s video muted:'], message.muted);
  if (this._peerInformations[targetMid]) {
    if (this._peerMessagesStamps[targetMid] && typeof message.stamp === 'number') {
      if (message.stamp < this._peerMessagesStamps[targetMid].videoMuted) {
        Log.warn(this._debugOptions.instanceId, [targetMid, null, message.type, 'Dropping outdated status ->'], message);
        return;
      }
      this._peerMessagesStamps[targetMid].videoMuted = message.stamp;
    }
    this._peerInformations[targetMid].mediaStatus.videoMuted = message.muted;
    this._trigger('streamMuted', targetMid, this.getPeerInfo(targetMid), false,
      this._peerInformations[targetMid].settings.video &&
      this._peerInformations[targetMid].settings.video.screenshare);
    this._trigger('peerUpdated', targetMid, this.getPeerInfo(targetMid), false);
  } else {
    Log.log(this._debugOptions.instanceId, [targetMid, null, message.type, 'Peer does not have any user information']);
  }
};

/**
 * Function that handles the "stream" socket message received.
 * See confluence docs for the "stream" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _streamEventHandler
 * @private
 * @for Skylink
 * @since 0.2.0
 */
Skylink.prototype._streamEventHandler = function(message) {
  var targetMid = message.mid;
  Log.log(this._debugOptions.instanceId, [targetMid, null, message.type, 'Peer\'s stream status:'], message.status);

  if (this._peerInformations[targetMid] && message.streamId) {
    this._streamsSession[targetMid] = this._streamsSession[targetMid] || {};
    if (message.status === 'ended') {
      if (message.settings && typeof message.settings === 'object' &&
        typeof this._streamsSession[targetMid][message.streamId] === 'undefined') {
        this._streamsSession[targetMid][message.streamId] = {
          audio: message.settings.audio,
          video: message.settings.video
        };
      }

      this._handleEndedStreams(targetMid, message.streamId);
  	}
  } else {
    // Probably left the room already
    Log.log(this._debugOptions.instanceId, [targetMid, null, message.type, 'Peer does not have any user information']);
  }
};

/**
 * Function that handles the "bye" socket message received.
 * See confluence docs for the "bye" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _byeHandler
 * @private
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype._byeHandler = function(message) {
  var targetMid = message.mid;
  var selfId = (this._user || {}).sid;

  if (selfId !== targetMid){
    Log.log(this._debugOptions.instanceId, [targetMid, null, message.type, 'Peer has left the room']);
    this._removePeer(targetMid);
  } else {
    Log.log(this._debugOptions.instanceId, [targetMid, null, message.type, 'Self has left the room']);
  }
};

/**
 * Function that handles the "private" socket message received.
 * See confluence docs for the "private" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _privateMessageHandler
 * @private
 * @for Skylink
 * @since 0.4.0
 */
Skylink.prototype._privateMessageHandler = function(message) {
  var targetMid = message.mid;
  Log.log(this._debugOptions.instanceId, [targetMid, null, message.type,
    'Received private message from peer:'], message.data);
  this._trigger('incomingMessage', {
    content: message.data,
    isPrivate: true,
    targetPeerId: message.target, // is not null if there's user
    isDataChannel: false,
    senderPeerId: targetMid
  }, targetMid, this.getPeerInfo(targetMid), false);
};

/**
 * Function that handles the "public" socket message received.
 * See confluence docs for the "public" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _publicMessageHandler
 * @private
 * @for Skylink
 * @since 0.4.0
 */
Skylink.prototype._publicMessageHandler = function(message) {
  var targetMid = message.mid;
  Log.log(this._debugOptions.instanceId, [targetMid, null, message.type,
    'Received public message from peer:'], message.data);
  this._trigger('incomingMessage', {
    content: message.data,
    isPrivate: false,
    targetPeerId: null, // is not null if there's user
    isDataChannel: false,
    senderPeerId: targetMid
  }, targetMid, this.getPeerInfo(targetMid), false);
};

/**
 * Handles the RECORDING Protocol message event received from the platform signaling.
 * @method _recordingEventHandler
 * @param {JSON} message The message object received from platform signaling.
 *    This should contain the <code>RECORDING</code> payload.
 * @param {String} message.url The recording URL if mixing has completed.
 * @param {String} message.action The recording action received.
 * @param {String} message.error The recording error exception received.
 * @private
 * @beta
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._recordingEventHandler = function (message) {
  var self = this;

  Log.debug(self._debugOptions.instanceId, ['MCU', 'Recording', null, 'Received recording message ->'], message);

  if (message.action === 'on') {
    if (!self._recordings[message.recordingId]) {
      Log.debug(self._debugOptions.instanceId, ['MCU', 'Recording', message.recordingId, 'Started recording']);

      self._currentRecordingId = message.recordingId;
      self._recordings[message.recordingId] = {
        active: true,
        state: self.RECORDING_STATE.START,
        startedDateTime: (new Date()).toISOString(),
        endedDateTime: null,
        mixingDateTime: null,
        links: null,
        error: null
      };
      self._recordingStartInterval = setTimeout(function () {
        Log.log(self._debugOptions.instanceId, ['MCU', 'Recording',
          message.recordingId, '4 seconds has been recorded. Recording can be stopped now']);
        self._recordingStartInterval = null;
      }, 4000);
      self._trigger('recordingState', self.RECORDING_STATE.START, message.recordingId, null, null);
    }

  } else if (message.action === 'off') {
    if (!self._recordings[message.recordingId]) {
      Log.error(self._debugOptions.instanceId, ['MCU', 'Recording', message.recordingId, 'Received request of "off" but the session is empty']);
      return;
    }

    self._currentRecordingId = null;

    if (self._recordingStartInterval) {
      clearTimeout(self._recordingStartInterval);
      Log.error(self._debugOptions.instanceId, ['MCU', 'Recording', message.recordingId, 'Recording stopped abruptly before 4 seconds']);
      self._recordingStartInterval = null;
    }

    Log.debug(self._debugOptions.instanceId, ['MCU', 'Recording', message.recordingId, 'Stopped recording']);

    self._recordings[message.recordingId].active = false;
    self._recordings[message.recordingId].state = self.RECORDING_STATE.STOP;
    self._recordings[message.recordingId].endedDateTime = (new Date()).toISOString();
    self._trigger('recordingState', self.RECORDING_STATE.STOP, message.recordingId, null, null);

  } else if (message.action === 'url') {
    if (!self._recordings[message.recordingId]) {
      Log.error(self._debugOptions.instanceId, ['MCU', 'Recording', message.recordingId, 'Received URL but the session is empty']);
      return;
    }

    var links = {};

    if (Array.isArray(message.urls)) {
      for (var i = 0; i < message.urls.length; i++) {
        links[messages.urls[i].id || ''] = messages.urls[i].url || '';
      }
    } else if (typeof message.url === 'string') {
      links.mixin = message.url;
    }

    self._recordings[message.recordingId].links = links;
    self._recordings[message.recordingId].state = self.RECORDING_STATE.LINK;
    self._recordings[message.recordingId].mixingDateTime = (new Date()).toISOString();
    self._trigger('recordingState', self.RECORDING_STATE.LINK, message.recordingId, links, null);

  } else {
    var recordingError = new Error(message.error || 'Unknown error');
    if (!self._recordings[message.recordingId]) {
      Log.error(self._debugOptions.instanceId, ['MCU', 'Recording',
        message.recordingId, 'Received error but the session is empty ->'], recordingError);
      return;
    }

    Log.error(self._debugOptions.instanceId, ['MCU', 'Recording', message.recordingId, 'Recording failure ->'], recordingError);

    self._recordings[message.recordingId].state = self.RECORDING_STATE.ERROR;
    self._recordings[message.recordingId].error = recordingError;

    if (self._recordings[message.recordingId].active) {
      Log.debug(self._debugOptions.instanceId, ['MCU', 'Recording', message.recordingId, 'Stopped recording abruptly']);
      self._recordings[message.recordingId].active = false;
      //self._trigger('recordingState', self.RECORDING_STATE.STOP, message.recordingId, null, recordingError);
    }

    self._trigger('recordingState', self.RECORDING_STATE.ERROR, message.recordingId, null, recordingError);
  }
};

/**
 * Function that handles the "inRoom" socket message received.
 * See confluence docs for the "inRoom" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _inRoomHandler
 * @private
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype._inRoomHandler = function(message) {
  var self = this;
  Log.log(self._debugOptions.instanceId, ['Server', null, message.type, 'User is now in the room and ' +
    'functionalities are now available. Config received:'], message.pc_config);
  self._room.connection.peerConfig = self._setIceServers(message.pc_config);
  self._inRoom = true;
  self._user.sid = message.sid;
  self._peerPriorityWeight = message.tieBreaker;

  self._trigger('peerJoined', self._user.sid, self.getPeerInfo(), true);
  self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.ENTER, self._user.sid);

  var streamId = null;

  if (self._streams.screenshare && self._streams.screenshare.stream) {
    streamId = self._streams.screenshare.stream.id || self._streams.screenshare.stream.label;
    self._trigger('incomingStream', self._user.sid, self._streams.screenshare.stream, true, self.getPeerInfo(), true, streamId);
  } else if (self._streams.userMedia && self._streams.userMedia.stream) {
    streamId = self._streams.userMedia.stream.id || self._streams.userMedia.stream.label;
    self._trigger('incomingStream', self._user.sid, self._streams.userMedia.stream, true, self.getPeerInfo(), false, streamId);
  }
  // NOTE ALEX: should we wait for local streams?
  // or just go with what we have (if no stream, then one way?)
  // do we hardcode the logic here, or give the flexibility?
  // It would be better to separate, do we could choose with whom
  // we want to communicate, instead of connecting automatically to all.
  var enterMsg = {
    type: self._SIG_MESSAGE_TYPE.ENTER,
    mid: self._user.sid,
    rid: self._room.id,
    agent: window.webrtcDetectedBrowser,
    version: (window.webrtcDetectedVersion || 0).toString(),
    os: window.navigator.platform,
    userInfo: self._getUserInfo(),
    receiveOnly: self.getPeerInfo().config.receiveOnly,
    weight: self._peerPriorityWeight,
    temasysPluginVersion: AdapterJS.WebRTCPlugin.plugin ? AdapterJS.WebRTCPlugin.plugin.VERSION : null,
    enableIceTrickle: self._enableIceTrickle,
    enableDataChannel: self._enableDataChannel,
    enableIceRestart: self._enableIceRestart,
    SMProtocolVersion: self.SM_PROTOCOL_VERSION,
    DTProtocolVersion: self.DT_PROTOCOL_VERSION
  };

  if (self._publishOnly) {
    enterMsg.publishOnly = {
      type: self._streams.screenshare && self._streams.screenshare.stream ? 'screenshare' : 'video'
    };
  }

  if (self._parentId) {
    enterMsg.parentId = self._parentId;
  }

  self._sendChannelMessage(enterMsg);
};

/**
 * Function that handles the "enter" socket message received.
 * See confluence docs for the "enter" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _enterHandler
 * @private
 * @for Skylink
 * @since 0.5.1
 */
Skylink.prototype._enterHandler = function(message) {
  var self = this;
  var targetMid = message.mid;
  var isNewPeer = false;
  var userInfo = message.userInfo || {};
  userInfo.settings = userInfo.settings || {};
  userInfo.mediaStatus = userInfo.mediaStatus || {};
  userInfo.config = {
    enableIceTrickle: typeof message.enableIceTrickle === 'boolean' ? message.enableIceTrickle : true,
    enableIceRestart: typeof message.enableIceRestart === 'boolean' ? message.enableIceRestart : false,
    enableDataChannel: typeof message.enableDataChannel === 'boolean' ? message.enableDataChannel : true,
    priorityWeight: typeof message.weight === 'number' ? message.weight : 0,
    receiveOnly: message.receiveOnly === true,
    publishOnly: !!message.publishOnly
  };
  userInfo.parentId = message.parentId || null;
  userInfo.agent = {
    name: typeof message.agent === 'string' && message.agent ? message.agent : 'other',
    version: (function () {
      if (!(message.version && typeof message.version === 'string')) {
        return 0;
      }
      // E.g. 0.9.6, replace minor "." with 0
      if (message.version.indexOf('.') > -1) {
        var parts = message.version.split('.');
        if (parts.length > 2) {
          var majorVer = parts[0] || '0';
          parts.splice(0, 1);
          return parseFloat(majorVer + '.' + parts.join('0'), 10);
        }
        return parseFloat(message.version || '0', 10);
      }
      return parseInt(message.version || '0', 10);
    })(),
    os: typeof message.os === 'string' && message.os ? message.os : '',
    pluginVersion: typeof message.temasysPluginVersion === 'string' && message.temasysPluginVersion ?
      message.temasysPluginVersion : null,
    SMProtocolVersion: message.SMProtocolVersion && typeof message.SMProtocolVersion === 'string' ?
      message.SMProtocolVersion : '0.1.1',
    DTProtocolVersion: message.DTProtocolVersion && typeof message.DTProtocolVersion === 'string' ?
      message.DTProtocolVersion : (self._hasMCU || targetMid === 'MCU' ? '0.1.2' : '0.1.0')
  };

  Log.log(self._debugOptions.instanceId, [targetMid, 'RTCPeerConnection', null, 'Peer "enter" received ->'], message);

  if (targetMid !== 'MCU' && self._parentId && self._parentId === targetMid) {
    Log.error(self._debugOptions.instanceId, [targetMid, 'RTCPeerConnection', null, 'Discarding "enter" for parentId case ->'], message);
    return;
  }

  if (!self._peerInformations[targetMid]) {
    isNewPeer = true;

    self._peerInformations[targetMid] = userInfo;

    var hasScreenshare = userInfo.settings.video && typeof userInfo.settings.video === 'object' &&
      !!userInfo.settings.video.screenshare;

    self._addPeer(targetMid, {
      agent: userInfo.agent.name,
      version: userInfo.agent.version,
      os: userInfo.agent.os
    }, false, false, message.receiveOnly, hasScreenshare);

    if (targetMid === 'MCU') {
      Log.info(self._debugOptions.instanceId, [targetMid, 'RTCPeerConnection', null, 'MCU feature has been enabled']);

      self._hasMCU = true;
      self._trigger('serverPeerJoined', targetMid, self.SERVER_PEER_TYPE.MCU);

    } else {
      self._trigger('peerJoined', targetMid, self.getPeerInfo(targetMid), false);
    }

    self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.ENTER, targetMid);
  }

  self._peerMessagesStamps[targetMid] = self._peerMessagesStamps[targetMid] || {
    userData: 0,
    audioMuted: 0,
    videoMuted: 0
  };

  var welcomeMsg = {
    type: self._SIG_MESSAGE_TYPE.WELCOME,
    mid: self._user.sid,
    rid: self._room.id,
    enableIceTrickle: self._enableIceTrickle,
    enableDataChannel: self._enableDataChannel,
    enableIceRestart: self._enableIceRestart,
    agent: window.webrtcDetectedBrowser,
    version: (window.webrtcDetectedVersion || 0).toString(),
    receiveOnly: self.getPeerInfo().config.receiveOnly,
    os: window.navigator.platform,
    userInfo: self._getUserInfo(),
    target: targetMid,
    weight: self._peerPriorityWeight,
    temasysPluginVersion: AdapterJS.WebRTCPlugin.plugin ? AdapterJS.WebRTCPlugin.plugin.VERSION : null,
    SMProtocolVersion: self.SM_PROTOCOL_VERSION,
    DTProtocolVersion: self.DT_PROTOCOL_VERSION
  };

  if (self._publishOnly) {
    welcomeMsg.publishOnly = {
      type: self._streams.screenshare && self._streams.screenshare.stream ? 'screenshare' : 'video'
    };
  }

  if (self._parentId) {
    welcomeMsg.parentId = self._parentId;
  }

  self._sendChannelMessage(welcomeMsg);

  if (isNewPeer) {
    self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.WELCOME, targetMid);
  }
};

/**
 * Function that handles the "restart" socket message received.
 * See confluence docs for the "restart" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _restartHandler
 * @private
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype._restartHandler = function(message){
  var self = this;
  var targetMid = message.mid;
  var userInfo = message.userInfo || {};
  userInfo.settings = userInfo.settings || {};
  userInfo.mediaStatus = userInfo.mediaStatus || {};
  userInfo.config = {
    enableIceTrickle: typeof message.enableIceTrickle === 'boolean' ? message.enableIceTrickle : true,
    enableIceRestart: typeof message.enableIceRestart === 'boolean' ? message.enableIceRestart : false,
    enableDataChannel: typeof message.enableDataChannel === 'boolean' ? message.enableDataChannel : true,
    priorityWeight: typeof message.weight === 'number' ? message.weight : 0,
    receiveOnly: message.receiveOnly === true,
    publishOnly: !!message.publishOnly
  };
  userInfo.parentId = message.parentId || null;
  userInfo.agent = {
    name: typeof message.agent === 'string' && message.agent ? message.agent : 'other',
    version: (function () {
      if (!(message.version && typeof message.version === 'string')) {
        return 0;
      }
      // E.g. 0.9.6, replace minor "." with 0
      if (message.version.indexOf('.') > -1) {
        var parts = message.version.split('.');
        if (parts.length > 2) {
          var majorVer = parts[0] || '0';
          parts.splice(0, 1);
          return parseFloat(majorVer + '.' + parts.join('0'), 10);
        }
        return parseFloat(message.version || '0', 10);
      }
      return parseInt(message.version || '0', 10);
    })(),
    os: typeof message.os === 'string' && message.os ? message.os : '',
    pluginVersion: typeof message.temasysPluginVersion === 'string' && message.temasysPluginVersion ?
      message.temasysPluginVersion : null,
    SMProtocolVersion: message.SMProtocolVersion && typeof message.SMProtocolVersion === 'string' ?
      message.SMProtocolVersion : '0.1.1',
    DTProtocolVersion: message.DTProtocolVersion && typeof message.DTProtocolVersion === 'string' ?
      message.DTProtocolVersion : (self._hasMCU || targetMid === 'MCU' ? '0.1.2' : '0.1.0')
  };

  Log.log(self._debugOptions.instanceId, [targetMid, 'RTCPeerConnection', null, 'Peer "restart" received ->'], message);

  if (!self._peerInformations[targetMid]) {
    Log.error(self._debugOptions.instanceId, [targetMid, 'RTCPeerConnection', null,
      'Peer does not have an existing session. Ignoring restart process.']);
    return;
  }

  if (targetMid !== 'MCU' && self._parentId && self._parentId === targetMid) {
    Log.error(self._debugOptions.instanceId, [targetMid, 'RTCPeerConnection', null, 'Discarding "restart" for parentId case ->'], message);
    return;
  }

  if (self._hasMCU && !self._mcuUseRenegoRestart) {
    Log.error(self._debugOptions.instanceId, [targetMid, 'RTCPeerConnection', null,
      'Dropping restart request as MCU does not support re-negotiation. ' +
      'Restart workaround is to re-join Room for Peer.']);
    self._trigger('peerRestart', targetMid, self.getPeerInfo(targetMid), false, false);
    return;
  }

  self._peerInformations[targetMid] = userInfo;
  self._peerMessagesStamps[targetMid] = self._peerMessagesStamps[targetMid] || {
    userData: 0,
    audioMuted: 0,
    videoMuted: 0
  };
  self._peerEndOfCandidatesCounter[targetMid] = self._peerEndOfCandidatesCounter[targetMid] || {};
  self._peerEndOfCandidatesCounter[targetMid].len = 0;

  // Make peer with highest weight do the offer
  if (self._peerPriorityWeight > message.weight) {
    Log.debug(self._debugOptions.instanceId, [targetMid, 'RTCPeerConnection', null, 'Re-negotiating new offer/answer.']);

    if (self._peerMessagesStamps[targetMid].hasRestart) {
      Log.error(self._debugOptions.instanceId, [targetMid, 'RTCPeerConnection', null, 'Discarding extra "restart" received.']);
      return;
    }

    self._peerMessagesStamps[targetMid].hasRestart = true;
    self._doOffer(targetMid, message.doIceRestart === true, {
      agent: userInfo.agent.name,
      version: userInfo.agent.version,
      os: userInfo.agent.os
    }, true);

  } else {
    Log.debug(self._debugOptions.instanceId, [targetMid, 'RTCPeerConnection', null, 'Waiting for peer to start re-negotiation.']);

    var restartMsg = {
      type: self._SIG_MESSAGE_TYPE.RESTART,
      mid: self._user.sid,
      rid: self._room.id,
      agent: window.webrtcDetectedBrowser,
      version: (window.webrtcDetectedVersion || 0).toString(),
      os: window.navigator.platform,
      userInfo: self._getUserInfo(),
      target: targetMid,
      weight: self._peerPriorityWeight,
      enableIceTrickle: self._enableIceTrickle,
      enableDataChannel: self._enableDataChannel,
      enableIceRestart: self._enableIceRestart,
      doIceRestart: message.doIceRestart === true,
      receiveOnly: self.getPeerInfo().config.receiveOnly,
      isRestartResend: true,
      temasysPluginVersion: AdapterJS.WebRTCPlugin.plugin ? AdapterJS.WebRTCPlugin.plugin.VERSION : null,
      SMProtocolVersion: self.SM_PROTOCOL_VERSION,
      DTProtocolVersion: self.DT_PROTOCOL_VERSION,
    };

    if (self._publishOnly) {
      restartMsg.publishOnly = {
        type: self._streams.screenshare && self._streams.screenshare.stream ? 'screenshare' : 'video'
      };
    }

    if (self._parentId) {
      restartMsg.parentId = self._parentId;
    }

    self._sendChannelMessage(restartMsg);
  }

  self._trigger('peerRestart', targetMid, self.getPeerInfo(targetMid), false, message.doIceRestart === true);
};

/**
 * Function that handles the "welcome" socket message received.
 * See confluence docs for the "welcome" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _welcomeHandler
 * @private
 * @for Skylink
 * @since 0.5.4
 */
Skylink.prototype._welcomeHandler = function(message) {
  var self = this;
  var targetMid = message.mid;
  var isNewPeer = false;
  var userInfo = message.userInfo || {};
  userInfo.settings = userInfo.settings || {};
  userInfo.mediaStatus = userInfo.mediaStatus || {};
  userInfo.config = {
    enableIceTrickle: typeof message.enableIceTrickle === 'boolean' ? message.enableIceTrickle : true,
    enableIceRestart: typeof message.enableIceRestart === 'boolean' ? message.enableIceRestart : false,
    enableDataChannel: typeof message.enableDataChannel === 'boolean' ? message.enableDataChannel : true,
    priorityWeight: typeof message.weight === 'number' ? message.weight : 0,
    receiveOnly: message.receiveOnly === true,
    publishOnly: !!message.publishOnly
  };
  userInfo.parentId = message.parentId || null;
  userInfo.agent = {
    name: typeof message.agent === 'string' && message.agent ? message.agent : 'other',
    version: (function () {
      if (!(message.version && typeof message.version === 'string')) {
        return 0;
      }
      // E.g. 0.9.6, replace minor "." with 0
      if (message.version.indexOf('.') > -1) {
        var parts = message.version.split('.');
        if (parts.length > 2) {
          var majorVer = parts[0] || '0';
          parts.splice(0, 1);
          return parseFloat(majorVer + '.' + parts.join('0'), 10);
        }
        return parseFloat(message.version || '0', 10);
      }
      return parseInt(message.version || '0', 10);
    })(),
    os: typeof message.os === 'string' && message.os ? message.os : '',
    pluginVersion: typeof message.temasysPluginVersion === 'string' && message.temasysPluginVersion ?
      message.temasysPluginVersion : null,
    SMProtocolVersion: message.SMProtocolVersion && typeof message.SMProtocolVersion === 'string' ?
      message.SMProtocolVersion : '0.1.1',
    DTProtocolVersion: message.DTProtocolVersion && typeof message.DTProtocolVersion === 'string' ?
      message.DTProtocolVersion : (self._hasMCU || targetMid === 'MCU' ? '0.1.2' : '0.1.0')
  };

  Log.log(self._debugOptions.instanceId, [targetMid, 'RTCPeerConnection', null, 'Peer "welcome" received ->'], message);

  if (targetMid !== 'MCU' && self._parentId && self._parentId === targetMid) {
    Log.error(self._debugOptions.instanceId, [targetMid, 'RTCPeerConnection', null, 'Discarding "welcome" for parentId case ->'], message);
    return;
  }

  if (!self._peerInformations[targetMid]) {
    isNewPeer = true;

    self._peerInformations[targetMid] = userInfo;

    var hasScreenshare = userInfo.settings.video && typeof userInfo.settings.video === 'object' &&
      !!userInfo.settings.video.screenshare;

    self._addPeer(targetMid, {
      agent: userInfo.agent.name,
      version: userInfo.agent.version,
      os: userInfo.agent.os
    }, false, false, message.receiveOnly, hasScreenshare);

    if (targetMid === 'MCU') {
      Log.info(self._debugOptions.instanceId, [targetMid, 'RTCPeerConnection', null, 'MCU feature has been enabled']);

      self._hasMCU = true;
      self._trigger('serverPeerJoined', targetMid, self.SERVER_PEER_TYPE.MCU);

    } else {
      self._trigger('peerJoined', targetMid, self.getPeerInfo(targetMid), false);
    }

    self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.ENTER, targetMid);
    self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.WELCOME, targetMid);
  }

  self._peerMessagesStamps[targetMid] = self._peerMessagesStamps[targetMid] || {
    userData: 0,
    audioMuted: 0,
    videoMuted: 0,
    hasWelcome: false
  };

  if (self._hasMCU || self._peerPriorityWeight > message.weight) {
    if (self._peerMessagesStamps[targetMid].hasWelcome) {
      Log.error(self._debugOptions.instanceId, [targetMid, 'RTCPeerConnection', null, 'Discarding extra "welcome" received.']);
      return;
    }

    Log.debug(self._debugOptions.instanceId, [targetMid, 'RTCPeerConnection', null, 'Starting negotiation']);

    self._peerMessagesStamps[targetMid].hasWelcome = true;
    self._doOffer(targetMid, false, {
      agent: userInfo.agent.name,
      version: userInfo.agent.version,
      os: userInfo.agent.os
    }, true);

  } else {
    Log.debug(self._debugOptions.instanceId, [targetMid, 'RTCPeerConnection', null, 'Waiting for peer to start negotiation.']);

    var welcomeMsg = {
      type: self._SIG_MESSAGE_TYPE.WELCOME,
      mid: self._user.sid,
      rid: self._room.id,
      enableIceTrickle: self._enableIceTrickle,
      enableDataChannel: self._enableDataChannel,
      enableIceRestart: self._enableIceRestart,
      receiveOnly: self.getPeerInfo().config.receiveOnly,
      agent: window.webrtcDetectedBrowser,
      version: (window.webrtcDetectedVersion || 0).toString(),
      os: window.navigator.platform,
      userInfo: self._getUserInfo(),
      target: targetMid,
      weight: self._peerPriorityWeight,
      temasysPluginVersion: AdapterJS.WebRTCPlugin.plugin ? AdapterJS.WebRTCPlugin.plugin.VERSION : null,
      SMProtocolVersion: self.SM_PROTOCOL_VERSION,
      DTProtocolVersion: self.DT_PROTOCOL_VERSION
    };

    if (self._publishOnly) {
      welcomeMsg.publishOnly = {
        type: self._streams.screenshare && self._streams.screenshare.stream ? 'screenshare' : 'video'
      };
    }

    if (self._parentId) {
      welcomeMsg.parentId = self._parentId;
    }

    self._sendChannelMessage(welcomeMsg);
  }
};

/**
 * Function that handles the "offer" socket message received.
 * See confluence docs for the "offer" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _offerHandler
 * @private
 * @for Skylink
 * @since 0.5.1
 */
Skylink.prototype._offerHandler = function(message) {
  var self = this;
  var targetMid = message.mid;
  var pc = self._peerConnections[targetMid];

  if (!pc) {
    Log.error(self._debugOptions.instanceId, [targetMid, null, message.type, 'Peer connection object ' +
      'not found. Unable to setRemoteDescription for offer']);
    return;
  }

  /*if (pc.localDescription ? !!pc.localDescription.sdp : false) {
    Log.warn([targetMid, null, message.type, 'Peer has an existing connection'],
      pc.localDescription);
    return;
  }*/

  // Add-on by Web SDK fixes
  if (message.userInfo && typeof message.userInfo === 'object') {
    var userInfo = message.userInfo || {};

    self._peerInformations[targetMid].settings = userInfo.settings || {};
    self._peerInformations[targetMid].mediaStatus = userInfo.mediaStatus || {};
    self._peerInformations[targetMid].userData = userInfo.userData;
  }

  Log.log(self._debugOptions.instanceId, [targetMid, null, message.type, 'Received offer from peer. ' +
    'Session description:'], UtilsFactory.clone(message));

  var offer = new RTCSessionDescription({
    type: message.type,
    sdp: self._hasMCU ? message.sdp.split('\n').join('\r\n') : message.sdp
  });
  Log.log(self._debugOptions.instanceId, [targetMid, 'RTCSessionDescription', message.type,
    'Session description object created'], offer);

  offer.sdp = self._removeSDPFilteredCandidates(targetMid, offer);
  offer.sdp = self._setSDPCodec(targetMid, offer);
  offer.sdp = self._setSDPBitrate(targetMid, offer);
  offer.sdp = self._setSDPOpusConfig(targetMid, offer);
  offer.sdp = self._removeSDPCodecs(targetMid, offer);
  offer.sdp = self._removeSDPREMBPackets(targetMid, offer);
  offer.sdp = self._handleSDPConnectionSettings(targetMid, offer, 'remote');

  Log.log(self._debugOptions.instanceId, [targetMid, 'RTCSessionDescription', message.type, 'Updated remote offer ->'], offer.sdp);

  // This is always the initial state. or even after negotiation is successful
  if (pc.signalingState !== self.PEER_CONNECTION_STATE.STABLE) {
    Log.error(self._debugOptions.instanceId, [targetMid, null, message.type, 'Peer connection state is not in ' +
      '"stable" state for re-negotiation. Dropping message.'], {
        signalingState: pc.signalingState,
        isRestart: !!message.resend
      });
    return;
  }

  // Added checks if there is a current remote sessionDescription being processing before processing this one
  if (pc.processingRemoteSDP) {
    Log.error(self._debugOptions.instanceId, [targetMid, 'RTCSessionDescription', 'offer',
      'Dropping of setting local offer as there is another ' +
      'sessionDescription being processed ->'], offer);
    return;
  }

  pc.processingRemoteSDP = true;

  // Edge FIXME problem: Add stream only at offer/answer end
  if (window.webrtcDetectedBrowser === 'edge' && (!self._hasMCU || targetMid === 'MCU')) {
    self._addLocalMediaStreams(targetMid);
  }

  pc.setRemoteDescription(offer, function() {
    Log.debug(self._debugOptions.instanceId, [targetMid, 'RTCSessionDescription', message.type, 'Remote description set']);
    pc.setOffer = 'remote';
    pc.processingRemoteSDP = false;
    self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.OFFER, targetMid);
    self._addIceCandidateFromQueue(targetMid);
    self._doAnswer(targetMid);
  }, function(error) {
    self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.ERROR, targetMid, error);

    pc.processingRemoteSDP = false;

    Log.error(self._debugOptions.instanceId, [targetMid, null, message.type, 'Failed setting remote description:'], error);
  });
};


/**
 * Function that handles the "candidate" socket message received.
 * See confluence docs for the "candidate" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _candidateHandler
 * @private
 * @for Skylink
 * @since 0.5.1
 */
Skylink.prototype._candidateHandler = function(message) {
  var targetMid = message.mid;

  if (!message.candidate && !message.id) {
    Log.warn(this._debugOptions.instanceId, [targetMid, 'RTCIceCandidate', null, 'Received invalid ICE candidate message ->'], message);
    return;
  }

  var canId = 'can-' + (new Date()).getTime();
  var candidateType = message.candidate.split(' ')[7] || '';
  var candidate = new RTCIceCandidate({
    sdpMLineIndex: message.label,
    candidate: message.candidate,
    sdpMid: message.id
  });

  Log.debug(this._debugOptions.instanceId, [targetMid, 'RTCIceCandidate', canId + ':' + candidateType, 'Received ICE candidate ->'], candidate);

  this._peerEndOfCandidatesCounter[targetMid] = this._peerEndOfCandidatesCounter[targetMid] || {};
  this._peerEndOfCandidatesCounter[targetMid].len = this._peerEndOfCandidatesCounter[targetMid].len || 0;
  this._peerEndOfCandidatesCounter[targetMid].hasSet = false;
  this._peerEndOfCandidatesCounter[targetMid].len++;

  this._trigger('candidateProcessingState', this.CANDIDATE_PROCESSING_STATE.RECEIVED,
    targetMid, canId, candidateType, {
    candidate: candidate.candidate,
    sdpMid: candidate.sdpMid,
    sdpMLineIndex: candidate.sdpMLineIndex
  }, null);

  if (!(this._peerConnections[targetMid] &&
    this._peerConnections[targetMid].signalingState !== this.PEER_CONNECTION_STATE.CLOSED)) {
    Log.warn(this._debugOptions.instanceId, [targetMid, 'RTCIceCandidate', canId + ':' + candidateType, 'Dropping ICE candidate ' +
      'as Peer connection does not exists or is closed']);
    this._trigger('candidateProcessingState', this.CANDIDATE_PROCESSING_STATE.DROPPED,
      targetMid, canId, candidateType, {
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex
    }, new Error('Failed processing ICE candidate as Peer connection does not exists or is closed.'));
    this._signalingEndOfCandidates(targetMid);
    return;
  }

  if (this._filterCandidatesType[candidateType]) {
    if (!(this._hasMCU && this._forceTURN)) {
      Log.warn(this._debugOptions.instanceId, [targetMid, 'RTCIceCandidate', canId + ':' + candidateType, 'Dropping received ICE candidate as ' +
        'it matches ICE candidate filtering flag ->'], candidate);
      this._trigger('candidateProcessingState', this.CANDIDATE_PROCESSING_STATE.DROPPED,
        targetMid, canId, candidateType, {
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex
      }, new Error('Dropping of processing ICE candidate as it matches ICE candidate filtering flag.'));
      this._signalingEndOfCandidates(targetMid);
      return;
    }

    Log.warn(this._debugOptions.instanceId, [targetMid, 'RTCIceCandidate', canId + ':' + candidateType, 'Not dropping received ICE candidate as ' +
      'TURN connections are enforced as MCU is present (and act as a TURN itself) so filtering of ICE candidate ' +
      'flags are not honoured ->'], candidate);
  }

  if (this._peerConnections[targetMid].remoteDescription && this._peerConnections[targetMid].remoteDescription.sdp &&
    this._peerConnections[targetMid].localDescription && this._peerConnections[targetMid].localDescription.sdp) {
    this._addIceCandidate(targetMid, canId, candidate);
  } else {
    this._addIceCandidateToQueue(targetMid, canId, candidate);
  }

  this._signalingEndOfCandidates(targetMid);

  if (!this._gatheredCandidates[targetMid]) {
    this._gatheredCandidates[targetMid] = {
      sending: { host: [], srflx: [], relay: [] },
      receiving: { host: [], srflx: [], relay: [] }
    };
  }

  this._gatheredCandidates[targetMid].receiving[candidateType].push({
    sdpMid: candidate.sdpMid,
    sdpMLineIndex: candidate.sdpMLineIndex,
    candidate: candidate.candidate
  });
};

/**
 * Function that handles the "answer" socket message received.
 * See confluence docs for the "answer" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _answerHandler
 * @private
 * @for Skylink
 * @since 0.5.1
 */
Skylink.prototype._answerHandler = function(message) {
  var self = this;
  var targetMid = message.mid;

  Log.log(self._debugOptions.instanceId, [targetMid, null, message.type,
    'Received answer from peer. Session description:'], UtilsFactory.clone(message));

  var pc = self._peerConnections[targetMid];

  if (!pc) {
    Log.error(self._debugOptions.instanceId, [targetMid, null, message.type, 'Peer connection object ' +
      'not found. Unable to setRemoteDescription for answer']);
    return;
  }

  // Add-on by Web SDK fixes
  if (message.userInfo && typeof message.userInfo === 'object') {
    var userInfo = message.userInfo || {};

    self._peerInformations[targetMid].settings = userInfo.settings || {};
    self._peerInformations[targetMid].mediaStatus = userInfo.mediaStatus || {};
    self._peerInformations[targetMid].userData = userInfo.userData;
  }

  var answer = new RTCSessionDescription({
    type: message.type,
    sdp: self._hasMCU ? message.sdp.split('\n').join('\r\n') : message.sdp
  });

  Log.log(self._debugOptions.instanceId, [targetMid, 'RTCSessionDescription', message.type,
    'Session description object created'], answer);

  /*if (pc.remoteDescription ? !!pc.remoteDescription.sdp : false) {
    Log.warn([targetMid, null, message.type, 'Peer has an existing connection'],
      pc.remoteDescription);
    return;
  }

  if (pc.signalingState === self.PEER_CONNECTION_STATE.STABLE) {
    Log.error([targetMid, null, message.type, 'Unable to set peer connection ' +
      'at signalingState "stable". Ignoring remote answer'], pc.signalingState);
    return;
  }*/

  answer.sdp = self._removeSDPFilteredCandidates(targetMid, answer);
  answer.sdp = self._setSDPCodec(targetMid, answer);
  answer.sdp = self._setSDPBitrate(targetMid, answer);
  answer.sdp = self._setSDPOpusConfig(targetMid, answer);
  answer.sdp = self._removeSDPCodecs(targetMid, answer);
  answer.sdp = self._removeSDPREMBPackets(targetMid, answer);
  answer.sdp = self._handleSDPConnectionSettings(targetMid, answer, 'remote');

  Log.log(self._debugOptions.instanceId, [targetMid, 'RTCSessionDescription', message.type, 'Updated remote answer ->'], answer.sdp);


  // This should be the state after offer is received. or even after negotiation is successful
  if (pc.signalingState !== self.PEER_CONNECTION_STATE.HAVE_LOCAL_OFFER) {
    Log.error(self._debugOptions.instanceId, [targetMid, null, message.type, 'Peer connection state is not in ' +
      '"have-local-offer" state for re-negotiation. Dropping message.'], {
        signalingState: pc.signalingState,
        isRestart: !!message.restart
      });
    return;
  }

  // Added checks if there is a current remote sessionDescription being processing before processing this one
  if (pc.processingRemoteSDP) {
    Log.error(self._debugOptions.instanceId, [targetMid, 'RTCSessionDescription', 'answer',
      'Dropping of setting local answer as there is another ' +
      'sessionDescription being processed ->'], answer);
    return;
  }

  pc.processingRemoteSDP = true;

  pc.setRemoteDescription(answer, function() {
    Log.debug(self._debugOptions.instanceId, [targetMid, null, message.type, 'Remote description set']);
    pc.setAnswer = 'remote';
    pc.processingRemoteSDP = false;
    self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.ANSWER, targetMid);
    self._addIceCandidateFromQueue(targetMid);

    if (self._peerMessagesStamps[targetMid]) {
      self._peerMessagesStamps[targetMid].hasRestart = false;
    }

    if (self._dataChannels[targetMid] && (pc.remoteDescription.sdp.indexOf('m=application') === -1 ||
      pc.remoteDescription.sdp.indexOf('m=application 0') > 0)) {
      Log.error(self._debugOptions.instanceId, [targetMid, 'RTCPeerConnection', null, 'Closing all datachannels as they were rejected.']);
      self._closeDataChannel(targetMid);
    }

  }, function(error) {
    self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.ERROR, targetMid, error);

    pc.processingRemoteSDP = false;

    Log.error(self._debugOptions.instanceId, [targetMid, null, message.type, 'Failed setting remote description:'], {
      error: error,
      state: pc.signalingState
    });
  });
};

/**
 * Function that compares the SM / DT protocol versions to see if it in the version.
 * @method _isLowerThanVersion
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._isLowerThanVersion = function (agentVer, requiredVer) {
  var partsA = agentVer.split('.');
  var partsB = requiredVer.split('.');

  for (var i = 0; i < partsB.length; i++) {
    if (parseInt(partsA[i] || '0', 10) < parseInt(partsB[i] || '0', 10)) {
      return true;
    }
  }

  return false;
};

Skylink.prototype._muteStreams = function () {
  var self = this;
  var hasVideo = false;
  var hasAudio = false;

  var muteFn = function (stream) {
    var audioTracks = stream.getAudioTracks();
    var videoTracks = stream.getVideoTracks();

    for (var a = 0; a < audioTracks.length; a++) {
      audioTracks[a].enabled = !self._streamsMutedSettings.audioMuted;
      hasAudio = true;
    }

    for (var v = 0; v < videoTracks.length; v++) {
      videoTracks[v].enabled = !self._streamsMutedSettings.videoMuted;
      hasVideo = true;
    }
  };

  if (self._streams.userMedia && self._streams.userMedia.stream) {
    muteFn(self._streams.userMedia.stream);
  }

  if (self._streams.screenshare && self._streams.screenshare.stream) {
    muteFn(self._streams.screenshare.stream);
  }

  if (self._streams.screenshare && self._streams.screenshare.streamClone) {
    muteFn(self._streams.screenshare.streamClone);
  }

  Log.debug(self._debugOptions.instanceId, 'Updated Streams muted status ->', self._streamsMutedSettings);

  return {
    hasVideo: hasVideo,
    hasAudio: hasAudio
  };
};

/**
 * Function that handles stopping the Stream streaming.
 * @method _stopStreams
 * @private
 * @for Skylink
 * @since 0.6.15
 */
Skylink.prototype._stopStreams = function (options) {
  var self = this;
  var stopFn = function (stream) {
    var streamId = stream.id || stream.label;
    Log.debug(self._debugOptions.instanceId, [null, 'MediaStream', streamId, 'Stopping Stream ->'], stream);

    try {
      var audioTracks = stream.getAudioTracks();
      var videoTracks = stream.getVideoTracks();

      for (var a = 0; a < audioTracks.length; a++) {
        audioTracks[a].stop();
      }

      for (var v = 0; v < videoTracks.length; v++) {
        videoTracks[v].stop();
      }

    } catch (error) {
      stream.stop();
    }

    if (self._streamsStoppedCbs[streamId]) {
      self._streamsStoppedCbs[streamId]();
      delete self._streamsStoppedCbs[streamId];
    }
  };

  var stopUserMedia = false;
  var stopScreenshare = false;
  var hasStoppedMedia = false;

  if (typeof options === 'object') {
    stopUserMedia = options.userMedia === true;
    stopScreenshare = options.screenshare === true;
  }

  if (stopUserMedia && self._streams.userMedia) {
    if (self._streams.userMedia.stream) {
      stopFn(self._streams.userMedia.stream);
    }

    self._streams.userMedia = null;
    hasStoppedMedia = true;
  }

  if (stopScreenshare && self._streams.screenshare) {
    if (self._streams.screenshare.streamClone) {
      stopFn(self._streams.screenshare.streamClone);
    }

    if (self._streams.screenshare.stream) {
      stopFn(self._streams.screenshare.stream);
    }

    self._streams.screenshare = null;
    hasStoppedMedia = true;
  }

  if (self._inRoom && hasStoppedMedia) {
    self._trigger('peerUpdated', self._user.sid, self.getPeerInfo(), true);
  }

  Log.log(self._debugOptions.instanceId, 'Stopping Streams with settings ->', options);
};

/**
 * Function that parses the <code>getUserMedia()</code> settings provided.
 * @method _parseStreamSettings
 * @private
 * @for Skylink
 * @since 0.6.15
 */
Skylink.prototype._parseStreamSettings = function(options) {
  var settings = {
    settings: { audio: false, video: false },
    mutedSettings: { shouldAudioMuted: false, shouldVideoMuted: false },
    getUserMediaSettings: { audio: false, video: false }
  };

  if (options.audio) {
    // For Edge to work since they do not support the advanced constraints yet
    settings.settings.audio = {
      stereo: false,
      exactConstraints: !!options.useExactConstraints,
      echoCancellation: false
    };
    settings.getUserMediaSettings.audio = {
      echoCancellation: false
    };

    if (typeof options.audio === 'object') {
      if (typeof options.audio.stereo === 'boolean') {
        settings.settings.audio.stereo = options.audio.stereo;
      }

      if (typeof options.audio.useinbandfec === 'boolean') {
        settings.settings.audio.useinbandfec = options.audio.useinbandfec;
      }

      if (typeof options.audio.usedtx === 'boolean') {
        settings.settings.audio.usedtx = options.audio.usedtx;
      }

      if (typeof options.audio.maxplaybackrate === 'number' &&
        options.audio.maxplaybackrate >= 8000 && options.audio.maxplaybackrate <= 48000) {
        settings.settings.audio.maxplaybackrate = options.audio.maxplaybackrate;
      }

      if (typeof options.audio.mute === 'boolean') {
        settings.mutedSettings.shouldAudioMuted = options.audio.mute;
      }

      // Not supported in Edge browser features
      if (window.webrtcDetectedBrowser !== 'edge') {
        if (typeof options.audio.echoCancellation === 'boolean') {
          settings.settings.audio.echoCancellation = options.audio.echoCancellation;
          settings.getUserMediaSettings.audio.echoCancellation = options.audio.echoCancellation;
        }

        if (Array.isArray(options.audio.optional)) {
          settings.settings.audio.optional = UtilsFactory.clone(options.audio.optional);
          settings.getUserMediaSettings.audio.optional = UtilsFactory.clone(options.audio.optional);
        }

        if (options.audio.deviceId && typeof options.audio.deviceId === 'string' &&
          window.webrtcDetectedBrowser !== 'firefox') {
          settings.settings.audio.deviceId = options.audio.deviceId;

          if (options.useExactConstraints) {
            settings.getUserMediaSettings.audio.deviceId = { exact: options.audio.deviceId };

          } else {
            if (!Array.isArray(settings.getUserMediaSettings.audio.optional)) {
              settings.getUserMediaSettings.audio.optional = [];
            }

            settings.getUserMediaSettings.audio.optional.push({
              sourceId: options.audio.deviceId
            });
          }
        }
      }
    }

    if (window.webrtcDetectedBrowser === 'edge') {
      settings.getUserMediaSettings.audio = true;
    }
  }

  if (options.video) {
    // For Edge to work since they do not support the advanced constraints yet
    settings.settings.video = {
      resolution: UtilsFactory.clone(this.VIDEO_RESOLUTION.VGA),
      screenshare: false,
      exactConstraints: !!options.useExactConstraints
    };
    settings.getUserMediaSettings.video = {};

    if (typeof options.video === 'object') {
      if (typeof options.video.mute === 'boolean') {
        settings.mutedSettings.shouldVideoMuted = options.video.mute;
      }

      if (Array.isArray(options.video.optional)) {
        settings.settings.video.optional = UtilsFactory.clone(options.video.optional);
        settings.getUserMediaSettings.video.optional = UtilsFactory.clone(options.video.optional);
      }

      if (options.video.deviceId && typeof options.video.deviceId === 'string' &&
        window.webrtcDetectedBrowser !== 'firefox') {
        settings.settings.video.deviceId = options.video.deviceId;

        if (options.useExactConstraints) {
          settings.getUserMediaSettings.video.deviceId = { exact: options.video.deviceId };

        } else {
          if (!Array.isArray(settings.getUserMediaSettings.video.optional)) {
            settings.getUserMediaSettings.video.optional = [];
          }

          settings.getUserMediaSettings.video.optional.push({
            sourceId: options.video.deviceId
          });
        }
      }

      if (options.video.resolution && typeof options.video.resolution === 'object') {
        if ((options.video.resolution.width && typeof options.video.resolution.width === 'object') ||
          typeof options.video.resolution.width === 'number') {
          settings.settings.video.resolution.width = options.video.resolution.width;
        }
        if ((options.video.resolution.height && typeof options.video.resolution.height === 'object') ||
          typeof options.video.resolution.height === 'number') {
          settings.settings.video.resolution.height = options.video.resolution.height;
        }
      }

      settings.getUserMediaSettings.video.width = typeof settings.settings.video.resolution.width === 'object' ?
        settings.settings.video.resolution.width : (options.useExactConstraints ?
        { exact: settings.settings.video.resolution.width } : { max: settings.settings.video.resolution.width });

      settings.getUserMediaSettings.video.height = typeof settings.settings.video.resolution.height === 'object' ?
        settings.settings.video.resolution.height : (options.useExactConstraints ?
        { exact: settings.settings.video.resolution.height } : { max: settings.settings.video.resolution.height });

      if ((options.video.frameRate && typeof options.video.frameRate === 'object') ||
        typeof options.video.frameRate === 'number' && !self._isUsingPlugin) {
        settings.settings.video.frameRate = options.video.frameRate;
        settings.getUserMediaSettings.video.frameRate = typeof settings.settings.video.frameRate === 'object' ?
          settings.settings.video.frameRate : (options.useExactConstraints ?
          { exact: settings.settings.video.frameRate } : { max: settings.settings.video.frameRate });
      }

      if (options.video.facingMode && ['string', 'object'].indexOf(typeof options.video.facingMode) > -1 && self._isUsingPlugin) {
        settings.settings.video.facingMode = options.video.facingMode;
        settings.getUserMediaSettings.video.facingMode = typeof settings.settings.video.facingMode === 'object' ?
          settings.settings.video.facingMode : (options.useExactConstraints ?
          { exact: settings.settings.video.facingMode } : { max: settings.settings.video.facingMode });
      }
    } else if (options.useExactConstraints) {
      settings.getUserMediaSettings.video = {
        width: { exact: settings.settings.video.resolution.width },
        height: { exact: settings.settings.video.resolution.height }
      };

    } else {
      settings.getUserMediaSettings.video.mandatory = {
        maxWidth: settings.settings.video.resolution.width,
        maxHeight: settings.settings.video.resolution.height
      };
    }

    if (window.webrtcDetectedBrowser === 'edge') {
      settings.settings.video = {
        screenshare: false,
        exactConstraints: !!options.useExactConstraints
      };
      settings.getUserMediaSettings.video = true;
    }
  }

  return settings;
};

/**
 * Function that handles the native <code>navigator.getUserMedia()</code> API success callback result.
 * @method _onStreamAccessSuccess
 * @private
 * @for Skylink
 * @since 0.3.0
 */
Skylink.prototype._onStreamAccessSuccess = function(stream, settings, isScreenSharing, isAudioFallback) {
  var self = this;
  var streamId = stream.id || stream.label;

  Log.log(self._debugOptions.instanceId, [null, 'MediaStream', streamId, 'Has access to stream ->'], stream);

  // Stop previous stream
  if (!isScreenSharing && self._streams.userMedia) {
    self._stopStreams({
      userMedia: true,
      screenshare: false
    });

  } else if (isScreenSharing && self._streams.screenshare) {
    self._stopStreams({
      userMedia: false,
      screenshare: true
    });
  }

  self._streamsStoppedCbs[streamId] = function () {
    Log.log(self._debugOptions.instanceId, [null, 'MediaStream', streamId, 'Stream has ended']);

    self._trigger('mediaAccessStopped', !!isScreenSharing, !!isAudioFallback, streamId);

    if (self._inRoom) {
      Log.debug(self._debugOptions.instanceId, [null, 'MediaStream', streamId, 'Sending Stream ended status to Peers']);

      self._sendChannelMessage({
        type: self._SIG_MESSAGE_TYPE.STREAM,
        mid: self._user.sid,
        rid: self._room.id,
        cid: self._key,
        streamId: streamId,
        settings: settings.settings,
        status: 'ended'
      });

      self._trigger('streamEnded', self._user.sid, self.getPeerInfo(), true, !!isScreenSharing, streamId);

      if (isScreenSharing && self._streams.screenshare && self._streams.screenshare.stream &&
        (self._streams.screenshare.stream.id || self._streams.screenshare.stream.label) === streamId) {
        self._streams.screenshare = null;

      } else if (!isScreenSharing && self._streams.userMedia && self._streams.userMedia.stream &&
        (self._streams.userMedia.stream.id || self._streams.userMedia.stream.label) === streamId) {
        self._streams.userMedia = null;
      }
    }
  };

  // Handle event for Chrome / Opera
  if (['chrome', 'opera'].indexOf(window.webrtcDetectedBrowser) > -1) {
    stream.oninactive = function () {
      if (self._streamsStoppedCbs[streamId]) {
        self._streamsStoppedCbs[streamId]();
        delete self._streamsStoppedCbs[streamId];
      }
    };

  // Handle event for Firefox (use an interval)
  } else if (window.webrtcDetectedBrowser === 'firefox') {
    stream.endedInterval = setInterval(function () {
      if (typeof stream.recordedTime === 'undefined') {
        stream.recordedTime = 0;
      }
      if (stream.recordedTime === stream.currentTime) {
        clearInterval(stream.endedInterval);

        if (self._streamsStoppedCbs[streamId]) {
          self._streamsStoppedCbs[streamId]();
          delete self._streamsStoppedCbs[streamId];
        }

      } else {
        stream.recordedTime = stream.currentTime;
      }
    }, 1000);

  } else {
    stream.onended = function () {
      if (self._streamsStoppedCbs[streamId]) {
        self._streamsStoppedCbs[streamId]();
        delete self._streamsStoppedCbs[streamId];
      }
    };
  }

  if ((settings.settings.audio && stream.getAudioTracks().length === 0) ||
    (settings.settings.video && stream.getVideoTracks().length === 0)) {

    var tracksNotSameError = 'Expected audio tracks length with ' +
      (settings.settings.audio ? '1' : '0') + ' and video tracks length with ' +
      (settings.settings.video ? '1' : '0') + ' but received audio tracks length ' +
      'with ' + stream.getAudioTracks().length + ' and video ' +
      'tracks length with ' + stream.getVideoTracks().length;

    Log.error(self._debugOptions.instanceId, [null, 'MediaStream', streamId, tracksNotSameError]);

    var requireAudio = !!settings.settings.audio;
    var requireVideo = !!settings.settings.video;

    if (settings.settings.audio && stream.getAudioTracks().length === 0) {
      settings.settings.audio = false;
    }

    if (settings.settings.video && stream.getVideoTracks().length === 0) {
      settings.settings.video = false;
    }

    self._trigger('mediaAccessFallback', {
      error: new Error(tracksNotSameError),
      diff: {
        video: { expected: requireVideo ? 1 : 0, received: stream.getVideoTracks().length },
        audio: { expected: requireAudio ? 1 : 0, received: stream.getAudioTracks().length }
      }
    }, self.MEDIA_ACCESS_FALLBACK_STATE.FALLBACKED, !!isScreenSharing, !!isAudioFallback, streamId);
  }

  self._streams[ isScreenSharing ? 'screenshare' : 'userMedia' ] = {
    stream: stream,
    settings: settings.settings,
    constraints: settings.getUserMediaSettings
  };
  self._muteStreams();
  self._trigger('mediaAccessSuccess', stream, !!isScreenSharing, !!isAudioFallback, streamId);
};

/**
 * Function that handles the native <code>navigator.getUserMedia()</code> API failure callback result.
 * @method _onStreamAccessError
 * @private
 * @for Skylink
 * @since 0.6.15
 */
Skylink.prototype._onStreamAccessError = function(error, settings, isScreenSharing) {
  var self = this;

  if (!isScreenSharing && settings.settings.audio && settings.settings.video && self._audioFallback) {
    Log.debug(self._debugOptions.instanceId, 'Fallbacking to retrieve audio only Stream');

    self._trigger('mediaAccessFallback', {
      error: error,
      diff: null
    }, self.MEDIA_ACCESS_FALLBACK_STATE.FALLBACKING, false, true);

    navigator.getUserMedia({
      audio: true
    }, function (stream) {
      self._onStreamAccessSuccess(stream, settings, false, true);

    }, function (error) {
      Log.error(self._debugOptions.instanceId, 'Failed fallbacking to retrieve audio only Stream ->', error);

      self._trigger('mediaAccessError', error, false, true);
      self._trigger('mediaAccessFallback', {
        error: error,
        diff: null
      }, self.MEDIA_ACCESS_FALLBACK_STATE.ERROR, false, true);
    });
    return;
  }

  Log.error(self._debugOptions.instanceId, 'Failed retrieving ' + (isScreenSharing ? 'screensharing' : 'camera') + ' Stream ->', error);

  self._trigger('mediaAccessError', error, !!isScreenSharing, false);
};

/**
 * Function that handles the <code>RTCPeerConnection.onaddstream</code> remote MediaStream received.
 * @method _onRemoteStreamAdded
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._onRemoteStreamAdded = function(targetMid, stream, isScreenSharing) {
  var self = this;

  if (!self._peerInformations[targetMid]) {
    Log.error(self._debugOptions.instanceId, [targetMid, 'MediaStream', stream.id,
      'Received remote stream when peer is not connected. ' +
      'Ignoring stream ->'], stream);
    return;
  }

  /*if (!self._peerInformations[targetMid].settings.audio &&
    !self._peerInformations[targetMid].settings.video && !isScreenSharing) {
    Log.log([targetMid, 'MediaStream', stream.id,
      'Receive remote stream but ignoring stream as it is empty ->'
      ], stream);
    return;
  }*/
  Log.log(self._debugOptions.instanceId, [targetMid, 'MediaStream', stream.id, 'Received remote stream ->'], stream);

  if (isScreenSharing) {
    Log.log(self._debugOptions.instanceId, [targetMid, 'MediaStream', stream.id, 'Peer is having a screensharing session with user']);
  }

  self._trigger('incomingStream', targetMid, stream, false, self.getPeerInfo(targetMid), isScreenSharing, stream.id || stream.label);
  self._trigger('peerUpdated', targetMid, self.getPeerInfo(targetMid), false);
};

/**
 * Function that sets User's Stream to send to Peer connection.
 * Priority for <code>shareScreen()</code> Stream over <code>getUserMedia()</code> Stream.
 * @method _addLocalMediaStreams
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._addLocalMediaStreams = function(peerId) {
  var self = this;

  // NOTE ALEX: here we could do something smarter
  // a mediastream is mainly a container, most of the info
  // are attached to the tracks. We should iterates over track and print
  try {
    Log.log(self._debugOptions.instanceId, [peerId, null, null, 'Adding local stream']);

    var pc = self._peerConnections[peerId];

    if (pc) {
      if (pc.signalingState !== self.PEER_CONNECTION_STATE.CLOSED) {
        // Updates the streams accordingly
        var updateStreamFn = function (updatedStream) {
          var hasStream = false;

          // remove streams
          var streams = pc.getLocalStreams();
          for (var i = 0; i < streams.length; i++) {
            if (updatedStream !== null && streams[i].id === updatedStream.id) {
              hasStream = true;
              continue;
            }
            // try removeStream
            pc.removeStream(streams[i]);
          }

          if (updatedStream !== null && !hasStream) {
            pc.addStream(updatedStream);
          }
        };

        if (self._streams.screenshare && self._streams.screenshare.stream) {
          Log.debug(self._debugOptions.instanceId, [peerId, 'MediaStream', null, 'Sending screen'], self._streams.screenshare.stream);

          updateStreamFn(self._streams.screenshare.stream);

        } else if (self._streams.userMedia && self._streams.userMedia.stream) {
          Log.debug(self._debugOptions.instanceId, [peerId, 'MediaStream', null, 'Sending stream'], self._streams.userMedia.stream);

          updateStreamFn(self._streams.userMedia.stream);

        } else {
          Log.error(self._debugOptions.instanceId, [peerId, 'MediaStream', null, 'No media to send. Will be only receiving']);

          updateStreamFn(null);
        }

      } else {
        Log.error(self._debugOptions.instanceId, [peerId, 'MediaStream', null,
          'Not adding any stream as signalingState is closed']);
      }
    } else {
      Log.error(self._debugOptions.instanceId, [peerId, 'MediaStream', self._mediaStream,
        'Not adding stream as peerconnection object does not exists']);
    }
  } catch (error) {
    if ((error.message || '').indexOf('already added') > -1) {
      Log.error(self._debugOptions.instanceId, [peerId, null, null, 'Not re-adding stream as LocalMediaStream is already added'], error);
    } else {
      // Fix errors thrown like NS_ERROR_UNEXPECTED
      Log.error(self._debugOptions.instanceId, [peerId, null, null, 'Failed adding local stream'], error);
    }
  }
};

/**
 * Function that handles ended streams.
 * @method _handleEndedStreams
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._handleEndedStreams = function (peerId, checkStreamId) {
  var self = this;
  self._streamsSession[peerId] = self._streamsSession[peerId] || {};

  var renderEndedFn = function (streamId) {
    var shouldTrigger = !!self._streamsSession[peerId][streamId];

    if (!checkStreamId && self._peerConnections[peerId] &&
      self._peerConnections[peerId].signalingState !== self.PEER_CONNECTION_STATE.CLOSED) {
      var streams = self._peerConnections[peerId].getRemoteStreams();

      for (var i = 0; i < streams.length; i++) {
        if (streamId === (streams[i].id || streams[i].label)) {
          shouldTrigger = false;
          break;
        }
      }
    }

    if (shouldTrigger) {
      var peerInfo = UtilsFactory.clone(self.getPeerInfo(peerId));
      peerInfo.settings.audio = UtilsFactory.clone(self._streamsSession[peerId][streamId].audio);
      peerInfo.settings.video = UtilsFactory.clone(self._streamsSession[peerId][streamId].video);
      var hasScreenshare = peerInfo.settings.video && typeof peerInfo.settings.video === 'object' &&
        !!peerInfo.settings.video.screenshare;
      self._streamsSession[peerId][streamId] = false;
      self._trigger('streamEnded', peerId, peerInfo, false, hasScreenshare, streamId);
    }
  };

  if (checkStreamId) {
    renderEndedFn(checkStreamId);
  } else {
    for (var prop in self._streamsSession[peerId]) {
      if (self._streamsSession[peerId].hasOwnProperty(prop) && self._streamsSession[peerId][prop]) {
        renderEndedFn(prop);
      }
    }
  }
};
Skylink.prototype._setSDPOpusConfig = function(targetMid, sessionDescription) {
  var sdpLines = sessionDescription.sdp.split('\r\n');
  var payload = null;
  var appendFmtpLineAtIndex = -1;
  var userAudioSettings = this.getPeerInfo().settings.audio;
  var opusSettings = {
    useinbandfec: null,
    usedtx: null,
    maxplaybackrate: null,
    stereo: false
  };

  if (userAudioSettings && typeof userAudioSettings === 'object') {
    opusSettings.stereo = userAudioSettings.stereo === true;
    opusSettings.useinbandfec = typeof userAudioSettings.useinbandfec === 'boolean' ? userAudioSettings.useinbandfec : null;
    opusSettings.usedtx = typeof userAudioSettings.usedtx === 'boolean' ? userAudioSettings.usedtx : null;
    opusSettings.maxplaybackrate = typeof userAudioSettings.maxplaybackrate === 'number' ? userAudioSettings.maxplaybackrate : null;
  }


  // Find OPUS RTPMAP line
  for (var i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].indexOf('a=rtpmap:') === 0 && (sdpLines[i].toLowerCase()).indexOf('opus/48000') > 0) {
      payload = (sdpLines[i].split(' ')[0] || '').split(':')[1] || null;
      appendFmtpLineAtIndex = i;
      break;
    }
  }

  if (!payload) {
    Log.warn(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
      'Failed to find OPUS payload. Not configuring options.']);
    return sessionDescription.sdp;
  }

  // Set OPUS FMTP line
  for (var j = 0; j < sdpLines.length; j++) {
    if (sdpLines[j].indexOf('a=fmtp:' + payload) === 0) {
      var opusConfigs = (sdpLines[j].split('a=fmtp:' + payload)[1] || '').replace(/\s/g, '').split(';');
      var updatedOpusParams = '';

      for (var k = 0; k < opusConfigs.length; k++) {
        if (!(opusConfigs[k] && opusConfigs[k].indexOf('=') > 0)) {
          continue;
        }

        var params = opusConfigs[k].split('=');

        if (['useinbandfec', 'usedtx', 'sprop-stereo', 'stereo', 'maxplaybackrate'].indexOf(params[0]) > -1) {
          // Get default OPUS useinbandfec
          if (params[0] === 'useinbandfec' && params[1] === '1' && opusSettings.useinbandfec === null) {
            Log.log(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
              'Received OPUS useinbandfec as true by default.']);
            opusSettings.useinbandfec = true;

          // Get default OPUS usedtx
          } else if (params[0] === 'usedtx' && params[1] === '1' && opusSettings.usedtx === null) {
            Log.log(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
              'Received OPUS usedtx as true by default.']);
            opusSettings.usedtx = true;

          // Get default OPUS maxplaybackrate
          } else if (params[0] === 'maxplaybackrate' && parseInt(params[1] || '0', 10) > 0 && opusSettings.maxplaybackrate === null) {
            Log.log(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
              'Received OPUS maxplaybackrate as ' + params[1] + ' by default.']);
            opusSettings.maxplaybackrate = params[1];
          }
        } else {
          updatedOpusParams += opusConfigs[k] + ';';
        }
      }

      if (opusSettings.stereo === true) {
        updatedOpusParams += 'stereo=1;';
      }

      if (opusSettings.useinbandfec === true) {
        updatedOpusParams += 'useinbandfec=1;';
      }

      if (opusSettings.usedtx === true) {
        updatedOpusParams += 'usedtx=1;';
      }

      if (opusSettings.maxplaybackrate) {
        updatedOpusParams += 'maxplaybackrate=' + opusSettings.maxplaybackrate + ';';
      }

      Log.log(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
        'Updated OPUS parameters ->'], updatedOpusParams);

      sdpLines[j] = 'a=fmtp:' + payload + ' ' + updatedOpusParams;
      appendFmtpLineAtIndex = -1;
      break;
    }
  }

  if (appendFmtpLineAtIndex > 0) {
    var newFmtpLine = 'a=fmtp:' + payload + ' ';

    if (opusSettings.stereo === true) {
      newFmtpLine += 'stereo=1;';
    }

    if (opusSettings.useinbandfec === true) {
      newFmtpLine += 'useinbandfec=1;';
    }

    if (opusSettings.usedtx === true) {
      newFmtpLine += 'usedtx=1;';
    }

    if (opusSettings.maxplaybackrate) {
      newFmtpLine += 'maxplaybackrate=' + opusSettings.maxplaybackrate + ';';
    }

    Log.info(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
      'Created OPUS parameters ->'], newFmtpLine);

    sdpLines.splice(appendFmtpLineAtIndex + 1, 0, newFmtpLine);
  }

  return sdpLines.join('\r\n');
};

/**
 * Function that modifies the session description to limit the maximum sending bandwidth.
 * Setting this may not necessarily work in Firefox.
 * @method _setSDPBitrate
 * @private
 * @for Skylink
 * @since 0.5.10
 */
Skylink.prototype._setSDPBitrate = function(targetMid, sessionDescription) {
  var self = this;
  var sdpLines = sessionDescription.sdp.split('\r\n');
  var parseFn = function (type, bw) {
    var mLineType = type;
    var mLineIndex = -1;
    var cLineIndex = -1;

    if (type === 'data') {
      mLineType = 'application';
    }

    for (var i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].indexOf('m=' + mLineType) === 0) {
        mLineIndex = i;
      } else if (mLineIndex > 0) {
        if (sdpLines[i].indexOf('m=') === 0) {
          break;
        }

        if (sdpLines[i].indexOf('c=') === 0) {
          cLineIndex = i;
        // Remove previous b:AS settings
        } else if (sdpLines[i].indexOf('b=AS:') === 0 || sdpLines[i].indexOf('b:TIAS:') === 0) {
          sdpLines.splice(i, 1);
          i--;
        }
      }
    }

    if (!(typeof bw === 'number' && bw > 0)) {
      Log.warn(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type, 'Not limiting "' + type + '" bandwidth']);
      return;
    }

    if (cLineIndex === -1) {
      Log.warn(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type, 'Failed setting "' +
        type + '" bandwidth as c-line is missing.']);
      return;
    }

    // Follow RFC 4566, that the b-line should follow after c-line.
    Log.info(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
      'Limiting maximum sending "' + type + '" bandwidth ->'], bw);
    sdpLines.splice(cLineIndex + 1, 0, window.webrtcDetectedBrowser === 'firefox' ? 'b=TIAS:' + (bw * 1024) : 'b=AS:' + bw);
  };

  parseFn('audio', this._streamsBandwidthSettings.bAS.audio);
  parseFn('video', this._streamsBandwidthSettings.bAS.video);
  parseFn('data', this._streamsBandwidthSettings.bAS.data);

  // Sets the experimental google bandwidth
  if ((typeof this._streamsBandwidthSettings.googleX.min === 'number') || (typeof this._streamsBandwidthSettings.googleX.max === 'number')) {
    var codec = null;
    var codecRtpMapLineIndex = -1;
    var codecFmtpLineIndex = -1;

    for (var j = 0; j < sdpLines.length; j++) {
      if (sdpLines[j].indexOf('m=video') === 0) {
        codec = sdpLines[j].split(' ')[3];
      } else if (codec) {
        if (sdpLines[j].indexOf('m=') === 0) {
          break;
        }

        if (sdpLines[j].indexOf('a=rtpmap:' + codec + ' ') === 0) {
          codecRtpMapLineIndex = j;
        } else if (sdpLines[j].indexOf('a=fmtp:' + codec + ' ') === 0) {
          sdpLines[j] = sdpLines[j].replace(/x-google-(min|max)-bitrate=[0-9]*[;]*/gi, '');
          codecFmtpLineIndex = j;
          break;
        }
      }
    }

    if (codecRtpMapLineIndex > -1) {
      var xGoogleParams = '';

      if (typeof this._streamsBandwidthSettings.googleX.min === 'number') {
        xGoogleParams += 'x-google-min-bitrate=' + this._streamsBandwidthSettings.googleX.min + ';';
      }

      if (typeof this._streamsBandwidthSettings.googleX.max === 'number') {
        xGoogleParams += 'x-google-max-bitrate=' + this._streamsBandwidthSettings.googleX.max + ';';
      }

      Log.info(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription',
        sessionDescription.type, 'Limiting x-google-bitrate ->'], xGoogleParams);

      if (codecFmtpLineIndex > -1) {
        sdpLines[codecFmtpLineIndex] += (sdpLines[codecFmtpLineIndex].split(' ')[1] ? ';' : '') + xGoogleParams;
      } else {
        sdpLines.splice(codecRtpMapLineIndex + 1, 0, 'a=fmtp:' + codec + ' ' + xGoogleParams);
      }
    }
  }

  return sdpLines.join('\r\n');
};

/**
 * Function that modifies the session description to set the preferred audio/video codec.
 * @method _setSDPCodec
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._setSDPCodec = function(targetMid, sessionDescription) {
  var self = this;
  var sdpLines = sessionDescription.sdp.split('\r\n');
  var parseFn = function (type, codec) {
    if (codec === 'auto') {
      Log.warn(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
        'Not preferring any codec for "' + type + '" streaming. Using browser selection.']);
      return;
    }

    // Find the codec first
    for (var i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].indexOf('a=rtpmap:') === 0 && (sdpLines[i].toLowerCase()).indexOf(codec.toLowerCase()) > 0) {
        var payload = sdpLines[i].split(':')[1].split(' ')[0] || null;

        if (!payload) {
          Log.warn(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type, 'Not preferring "' +
            codec + '" for "' + type + '" streaming as payload is not found.']);
          return;
        }

        for (var j = 0; j < sdpLines.length; j++) {
          if (sdpLines[j].indexOf('m=' + type) === 0) {
            Log.info(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type, 'Preferring "' +
              codec + '" for "' + type + '" streaming.']);

            var parts = sdpLines[j].split(' ');

            if (parts.indexOf(payload) >= 3) {
              parts.splice(parts.indexOf(payload), 1);
            }

            // Example: m=audio 9 UDP/TLS/RTP/SAVPF 111
            parts.splice(3, 0, payload);
            sdpLines[j] = parts.join(' ');
            break;
          }
        }
      }
    }
  };

  parseFn('audio', this._selectedAudioCodec);
  parseFn('video', this._selectedVideoCodec);

  return sdpLines.join('\r\n');
};

/**
 * Function that modifies the session description to remove the previous experimental H264
 * codec that is apparently breaking connections.
 * NOTE: We should perhaps not remove it since H264 is supported?
 * @method _removeSDPFirefoxH264Pref
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._removeSDPFirefoxH264Pref = function(targetMid, sessionDescription) {
  Log.info(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
    'Removing Firefox experimental H264 flag to ensure interopability reliability']);

  return sessionDescription.sdp.replace(/a=fmtp:0 profile-level-id=0x42e00c;packetization-mode=1\r\n/g, '');
};

/**
 * Function that modifies the session description to append the MediaStream and MediaStreamTrack IDs that seems
 * to be missing from Firefox answer session description to Chrome connection causing freezes in re-negotiation.
 * @method _addSDPMediaStreamTrackIDs
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._addSDPMediaStreamTrackIDs = function (targetMid, sessionDescription) {
  var self = this;
  if (!(this._peerConnections[targetMid] && this._peerConnections[targetMid].getLocalStreams().length > 0)) {
    Log.log(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
      'Not enforcing MediaStream IDs as no Streams is sent.']);
    return sessionDescription.sdp;
  }

  var sessionDescriptionStr = sessionDescription.sdp;

  if (!this._enableIceTrickle) {
    sessionDescriptionStr = sessionDescriptionStr.replace(/a=end-of-candidates\r\n/g, '');
  }

  var sdpLines = sessionDescriptionStr.split('\r\n');
  var agent = ((this._peerInformations[targetMid] || {}).agent || {}).name || '';
  var localStream = this._peerConnections[targetMid].getLocalStreams()[0];
  var localStreamId = localStream.id || localStream.label;

  var parseFn = function (type, tracks) {
    if (tracks.length === 0) {
      Log.log(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
        'Not enforcing "' + type + '" MediaStreamTrack IDs as no Stream "' + type + '" tracks is sent.']);
      return;
    }

    var trackId = tracks[0].id || tracks[0].label;
    var trackLabel = tracks[0].label || 'Default';
    var ssrcId = null;
    var hasReachedType = false;

    // Get SSRC ID
    for (var i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].indexOf('m=' + type) === 0) {
        if (!hasReachedType) {
          hasReachedType = true;
          continue;
        } else {
          break;
        }
      }

      if (hasReachedType && sdpLines[i].indexOf('a=ssrc:') === 0) {
        ssrcId = (sdpLines[i].split(':')[1] || '').split(' ')[0] || null;

        var msidLine = 'a=ssrc:' + ssrcId + ' msid:' + localStreamId + ' ' + trackId;
        var mslabelLine = 'a=ssrc:' + ssrcId + ' mslabel:' + trackLabel;
        var labelLine = 'a=ssrc:' + ssrcId + ' label:' + trackLabel;

        if (sdpLines.indexOf(msidLine) === -1) {
          sdpLines.splice(i + 1, 0, msidLine);
          i++;
        }

        if (sdpLines.indexOf(mslabelLine) === -1) {
          sdpLines.splice(i + 1, 0, mslabelLine);
          i++;
        }

        if (sdpLines.indexOf(labelLine) === -1) {
          sdpLines.splice(i + 1, 0, labelLine);
          i++;
        }

        Log.info(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type, 'Updating MediaStreamTrack ssrc (' +
          ssrcId + ') for "' + localStreamId + '" stream and "' + trackId + '" (label:"' + trackLabel + '")']);

        break;
      }
    }
  };

  parseFn('audio', localStream.getAudioTracks());
  parseFn('video', localStream.getVideoTracks());

  // Append signaling of end-of-candidates
  if (!this._enableIceTrickle){
    Log.info(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
      'Appending end-of-candidates signal for non-trickle ICE connection.']);
    for (var i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].indexOf('a=candidate:') === 0) {
        if (sdpLines[i + 1] ? !(sdpLines[i + 1].indexOf('a=candidate:') === 0 ||
          sdpLines[i + 1].indexOf('a=end-of-candidates') === 0) : true) {
          sdpLines.splice(i + 1, 0, 'a=end-of-candidates');
          i++;
        }
      }
    }
  }

  if (sessionDescription.type === this.HANDSHAKE_PROGRESS.ANSWER && this._sdpSessions[targetMid]) {
    var bundleLineIndex = -1;
    var mLineIndex = -1;

    for (var j = 0; j < sdpLines.length; j++) {
      if (sdpLines[j].indexOf('a=group:BUNDLE') === 0 && this._sdpSessions[targetMid].remote.bundleLine) {
        sdpLines[j] = this._sdpSessions[targetMid].remote.bundleLine;
      } else if (sdpLines[j].indexOf('m=') === 0) {
        mLineIndex++;
        var compareA = sdpLines[j].split(' ');
        var compareB = (this._sdpSessions[targetMid].remote.mLines[mLineIndex] || '').split(' ');

        if (compareA[0] && compareB[0] && compareA[0] !== compareB[0]) {
          compareB[1] = 0;
          Log.info(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
            'Appending middle rejected m= line ->'], compareB.join(' '));
          sdpLines.splice(j, 0, compareB.join(' '));
          j++;
          mLineIndex++;
        }
      }
    }

    while (this._sdpSessions[targetMid].remote.mLines[mLineIndex + 1]) {
      mLineIndex++;
      var appendIndex = sdpLines.length;
      if (!sdpLines[appendIndex - 1].replace(/\s/gi, '')) {
        appendIndex -= 1;
      }
      var parts = (this._sdpSessions[targetMid].remote.mLines[mLineIndex] || '').split(' ');
      parts[1] = 0;
      Log.info(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
        'Appending later rejected m= line ->'], parts.join(' '));
      sdpLines.splice(appendIndex, 0, parts.join(' '));
    }
  }

  if (window.webrtcDetectedBrowser === 'edge' && sessionDescription.type === this.HANDSHAKE_PROGRESS.OFFER &&
    !sdpLines[sdpLines.length - 1].replace(/\s/gi, '')) {
    Log.info(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription',
      sessionDescription.type, 'Removing last empty space for Edge browsers']);
    sdpLines.splice(sdpLines.length - 1, 1);
  }

  return sdpLines.join('\r\n');
};

/**
 * Function that modifies the session description to remove VP9 and H264 apt/rtx lines to prevent plugin connection breaks.
 * @method _removeSDPH264VP9AptRtxForOlderPlugin
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._removeSDPH264VP9AptRtxForOlderPlugin = function (targetMid, sessionDescription) {
  var removeVP9AptRtxPayload = false;
  var agent = (this._peerInformations[targetMid] || {}).agent || {};

  if (agent.pluginVersion) {
    // 0.8.870 supports
    var parts = agent.pluginVersion.split('.');
    removeVP9AptRtxPayload = parseInt(parts[0], 10) >= 0 && parseInt(parts[1], 10) >= 8 &&
      parseInt(parts[2], 10) >= 870;
  }

  // Remove rtx or apt= lines that prevent connections for browsers without VP8 or VP9 support
  // See: https://bugs.chromium.org/p/webrtc/issues/detail?id=3962
  if (['chrome', 'opera'].indexOf(window.webrtcDetectedBrowser) > -1 && removeVP9AptRtxPayload) {
    Log.info(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
      'Removing VP9/H264 apt= and rtx payload lines causing connectivity issues']);

    sessionDescription.sdp = sessionDescription.sdp.replace(/a=rtpmap:\d+ rtx\/\d+\r\na=fmtp:\d+ apt=101\r\n/g, '');
    sessionDescription.sdp = sessionDescription.sdp.replace(/a=rtpmap:\d+ rtx\/\d+\r\na=fmtp:\d+ apt=107\r\n/g, '');
  }

  return sessionDescription.sdp;
};

/**
 * Function that modifies the session description to remove codecs.
 * @method _removeSDPCodecs
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._removeSDPCodecs = function (targetMid, sessionDescription) {
  var self = this;
  var audioSettings = this.getPeerInfo().settings.audio;

  var parseFn = function (type, codec) {
    var payloadList = sessionDescription.sdp.match(new RegExp('a=rtpmap:(\\d*)\\ ' + codec + '.*', 'gi'));

    if (!(Array.isArray(payloadList) && payloadList.length > 0)) {
      Log.warn(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
        'Not removing "' + codec + '" as it does not exists.']);
      return;
    }

    for (var i = 0; i < payloadList.length; i++) {
      var payload = payloadList[i].split(' ')[0].split(':')[1];

      Log.info(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
        'Removing "' + codec + '" payload ->'], payload);

      sessionDescription.sdp = sessionDescription.sdp.replace(
        new RegExp('a=rtpmap:' + payload + '\\ .*\\r\\n', 'g'), '');
      sessionDescription.sdp = sessionDescription.sdp.replace(
        new RegExp('a=fmtp:' + payload + '\\ .*\\r\\n', 'g'), '');
      sessionDescription.sdp = sessionDescription.sdp.replace(
        new RegExp('a=rtpmap:\\d+ rtx\\/\\d+\\r\\na=fmtp:\\d+ apt=' + payload + '\\r\\n', 'g'), '');

      // Remove the m-line codec
      var sdpLines = sessionDescription.sdp.split('\r\n');

      for (var j = 0; j < sdpLines.length; j++) {
        if (sdpLines[j].indexOf('m=' + type) === 0) {
          var parts = sdpLines[j].split(' ');

          if (parts.indexOf(payload) >= 3) {
            parts.splice(parts.indexOf(payload), 1);
          }

          sdpLines[j] = parts.join(' ');
          break;
        }
      }

      sessionDescription.sdp = sdpLines.join('\r\n');
    }
  };

  if (this._disableVideoFecCodecs) {
    if (this._hasMCU) {
      Log.warn(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
        'Not removing "ulpfec" or "red" codecs as connected to MCU to prevent connectivity issues.']);
    } else {
      parseFn('video', 'red');
      parseFn('video', 'ulpfec');
    }
  }

  if (this._disableComfortNoiseCodec && audioSettings && typeof audioSettings === 'object' && audioSettings.stereo) {
    parseFn('audio', 'CN');
  }

  return sessionDescription.sdp;
};

/**
 * Function that modifies the session description to remove REMB packets fb.
 * @method _removeSDPREMBPackets
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._removeSDPREMBPackets = function (targetMid, sessionDescription) {
  if (!this._disableREMB) {
    return sessionDescription.sdp;
  }

  Log.info(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type, 'Removing REMB packets.']);
  return sessionDescription.sdp.replace(/a=rtcp-fb:\d+ goog-remb\r\n/g, '');
};

/**
 * Function that retrieves the session description selected codec.
 * @method _getSDPSelectedCodec
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._getSDPSelectedCodec = function (targetMid, sessionDescription, type) {
  if (!(sessionDescription && sessionDescription.sdp)) {
    return null;
  }

  var sdpLines = sessionDescription.sdp.split('\r\n');
  var selectedCodecInfo = {
    name: null,
    implementation: null,
    clockRate: null,
    channels: null,
    payloadType: null,
    params: null
  };

  for (var i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].indexOf('m=' + type) === 0) {
      var parts = sdpLines[i].split(' ');

      if (parts.length < 4) {
        break;
      }

      selectedCodecInfo.payloadType = parseInt(parts[3], 10);

    } else if (selectedCodecInfo.payloadType !== null) {
      if (sdpLines[i].indexOf('m=') === 0) {
        break;
      }

      if (sdpLines[i].indexOf('a=rtpmap:' + selectedCodecInfo.payloadType + ' ') === 0) {
        var params = (sdpLines[i].split(' ')[1] || '').split('/');
        selectedCodecInfo.name = params[0] || '';
        selectedCodecInfo.clockRate = params[1] ? parseInt(params[1], 10) : null;
        selectedCodecInfo.channels = params[2] ? parseInt(params[2], 10) : null;

      } else if (sdpLines[i].indexOf('a=fmtp:' + selectedCodecInfo.payloadType + ' ') === 0) {
        selectedCodecInfo.params = sdpLines[i].split('a=fmtp:' + selectedCodecInfo.payloadType + ' ')[1] || null;
      }
    }
  }

  Log.debug(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
    'Parsing session description "' + type + '" codecs ->'], selectedCodecInfo);

  return selectedCodecInfo;
};

/**
 * Function that modifies the session description to remove non-relay ICE candidates.
 * @method _removeSDPFilteredCandidates
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._removeSDPFilteredCandidates = function (targetMid, sessionDescription) {
  // Handle Firefox MCU Peer ICE candidates
  if (targetMid === 'MCU' && sessionDescription.type === this.HANDSHAKE_PROGRESS.ANSWER &&
    window.webrtcDetectedBrowser === 'firefox') {
    sessionDescription.sdp = sessionDescription.sdp.replace(/ generation 0/g, '');
    sessionDescription.sdp = sessionDescription.sdp.replace(/ udp /g, ' UDP ');
  }

  if (this._forceTURN && this._hasMCU) {
    Log.warn(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type, 'Not filtering ICE candidates as ' +
      'TURN connections are enforced as MCU is present (and act as a TURN itself) so filtering of ICE candidate ' +
      'flags are not honoured']);
    return sessionDescription.sdp;
  }

  if (this._filterCandidatesType.host) {
    Log.info(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type, 'Removing "host" ICE candidates.']);
    sessionDescription.sdp = sessionDescription.sdp.replace(/a=candidate:.*host.*\r\n/g, '');
  }

  if (this._filterCandidatesType.srflx) {
    Log.info(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type, 'Removing "srflx" ICE candidates.']);
    sessionDescription.sdp = sessionDescription.sdp.replace(/a=candidate:.*srflx.*\r\n/g, '');
  }

  if (this._filterCandidatesType.relay) {
    Log.info(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type, 'Removing "relay" ICE candidates.']);
    sessionDescription.sdp = sessionDescription.sdp.replace(/a=candidate:.*relay.*\r\n/g, '');
  }

  // sessionDescription.sdp = sessionDescription.sdp.replace(/a=candidate:(?!.*relay.*).*\r\n/g, '');

  return sessionDescription.sdp;
};

/**
 * Function that retrieves the current list of support codecs.
 * @method _getCodecsSupport
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._getCodecsSupport = function (callback) {
  var self = this;

  if (self._currentCodecSupport) {
    callback(null);
  }

  self._currentCodecSupport = { audio: {}, video: {} };

  try {
    if (window.webrtcDetectedBrowser === 'edge') {
      var codecs = RTCRtpSender.getCapabilities().codecs;

      for (var i = 0; i < codecs.length; i++) {
        if (['audio','video'].indexOf(codecs[i].kind) > -1 && codecs[i].name) {
          var codec = codecs[i].name.toLowerCase();
          self._currentCodecSupport[codecs[i].kind][codec] = codecs[i].clockRate +
            (codecs[i].numChannels > 1 ? '/' + codecs[i].numChannels : '');
        }
      }
      // Ignore .fecMechanisms for now
      callback(null);

    } else {
      var pc = new RTCPeerConnection(null);
      var offerConstraints = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      };

      if (['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1) {
        offerConstraints = {
          mandatory: {
            OfferToReceiveVideo: true,
            OfferToReceiveAudio: true
          }
        };
      }

      pc.createOffer(function (offer) {
        var sdpLines = offer.sdp.split('\r\n');
        var mediaType = '';

        for (var i = 0; i < sdpLines.length; i++) {
          if (sdpLines[i].indexOf('m=') === 0) {
            mediaType = (sdpLines[i].split('m=')[1] || '').split(' ')[0];
          } else if (sdpLines[i].indexOf('a=rtpmap:') === 0) {
            if (['audio', 'video'].indexOf(mediaType) === -1) {
              continue;
            }
            var parts = (sdpLines[i].split(' ')[1] || '').split('/');
            var codec = (parts[0] || '').toLowerCase();
            var info = parts[1] + (parts[2] ? '/' + parts[2] : '');

            self._currentCodecSupport[mediaType][codec] = info;
          }
        }

        callback(null);

      }, function (error) {
        callback(error);
      }, offerConstraints);
    }
  } catch (error) {
    callback(error);
  }
};

/**
 * Function that modifies the session description to handle the connection settings.
 * This is experimental and never recommended to end-users.
 * @method _handleSDPConnectionSettings
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._handleSDPConnectionSettings = function (targetMid, sessionDescription, direction) {
  var self = this;

  if (!self._sdpSessions[targetMid]) {
    return sessionDescription.sdp;
  }

  var sessionDescriptionStr = sessionDescription.sdp;

  if (direction === 'remote' && !self.getPeerInfo(targetMid).config.enableIceTrickle) {
    sessionDescriptionStr = sessionDescriptionStr.replace(/a=end-of-candidates\r\n/g, '');
  }

  var sdpLines = sessionDescriptionStr.split('\r\n');
  var peerAgent = ((self._peerInformations[targetMid] || {}).agent || {}).name || '';
  var mediaType = '';
  var bundleLineIndex = -1;
  var bundleLineMids = [];
  var mLineIndex = -1;
  var settings = UtilsFactory.clone(self._sdpSettings);

  if (targetMid === 'MCU') {
    settings.connection.audio = true;
    settings.connection.video = true;
    settings.connection.data = true;
  }

  if (settings.video) {
    settings.connection.video = (window.webrtcDetectedBrowser === 'edge' && peerAgent !== 'edge') ||
      (['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1 && peerAgent === 'edge' ?
      !!self._currentCodecSupport.video.h264 : true);
  }

  if (self._hasMCU) {
    settings.direction.audio.receive = targetMid === 'MCU' ? false : true;
    settings.direction.audio.send = targetMid === 'MCU' ? true : false;
    settings.direction.video.receive = targetMid === 'MCU' ? false : true;
    settings.direction.video.send = targetMid === 'MCU' ? true : false;
  }

  // ANSWERER: Reject only the m= lines. Returned rejected m= lines as well.
  // OFFERER: Remove m= lines

  self._sdpSessions[targetMid][direction].mLines = [];
  self._sdpSessions[targetMid][direction].bundleLine = '';

  for (var i = 0; i < sdpLines.length; i++) {
    // Cache the a=group:BUNDLE line used for remote answer from Edge later
    if (sdpLines[i].indexOf('a=group:BUNDLE') === 0) {
      self._sdpSessions[targetMid][direction].bundleLine = sdpLines[i];
      bundleLineIndex = i;

    // Check if there's a need to reject m= line
    } else if (sdpLines[i].indexOf('m=') === 0) {
      mediaType = (sdpLines[i].split('m=')[1] || '').split(' ')[0] || '';
      mediaType = mediaType === 'application' ? 'data' : mediaType;
      mLineIndex++;

      self._sdpSessions[targetMid][direction].mLines[mLineIndex] = sdpLines[i];

      // Check if there is missing unsupported video codecs support and reject it regardles of MCU Peer or not
      if (!settings.connection[mediaType]) {
        Log.log(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
          'Removing rejected m=' + mediaType + ' line ->'], sdpLines[i]);

        // Check if answerer and we do not have the power to remove the m line if index is 0
        // Set as a=inactive because we do not have that power to reject it somehow..
        // first m= line cannot be rejected for BUNDLE
        if (bundleLineIndex > -1 && mLineIndex === 0 && (direction === 'remote' ?
          sessionDescription.type === this.HANDSHAKE_PROGRESS.OFFER :
          sessionDescription.type === this.HANDSHAKE_PROGRESS.ANSWER)) {
          Log.warn(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
            'Not removing rejected m=' + mediaType + ' line ->'], sdpLines[i]);
          settings.connection[mediaType] = true;
          if (['audio', 'video'].indexOf(mediaType) > -1) {
            settings.direction[mediaType].send = false;
            settings.direction[mediaType].receive = false;
          }
          continue;
        }

        if (direction === 'remote' || sessionDescription.type === this.HANDSHAKE_PROGRESS.ANSWER) {
          var parts = sdpLines[i].split(' ');
          parts[1] = 0;
          sdpLines[i] = parts.join(' ');
          continue;
        }
      }
    }

    if (direction === 'remote' && sdpLines[i].indexOf('a=candidate:') === 0 &&
      !self.getPeerInfo(targetMid).config.enableIceTrickle) {
      if (sdpLines[i + 1] ? !(sdpLines[i + 1].indexOf('a=candidate:') === 0 ||
        sdpLines[i + 1].indexOf('a=end-of-candidates') === 0) : true) {
        Log.info(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
          'Appending end-of-candidates signal for non-trickle ICE connection.']);
        sdpLines.splice(i + 1, 0, 'a=end-of-candidates');
        i++;
      }
    }

    if (mediaType) {
      // Remove lines if we are rejecting the media and ensure unless (rejectVideoMedia is true), MCU has to enable those m= lines
      if (!settings.connection[mediaType]) {
        sdpLines.splice(i, 1);
        i--;

      // Store the mids session description
      } else if (sdpLines[i].indexOf('a=mid:') === 0) {
        bundleLineMids.push(sdpLines[i].split('a=mid:')[1] || '');

      // Configure direction a=sendonly etc for local sessiondescription
      }  else if (direction === 'local' && mediaType && ['audio', 'video'].indexOf(mediaType) > -1 &&
        ['a=sendrecv', 'a=sendonly', 'a=recvonly'].indexOf(sdpLines[i]) > -1) {

        if (settings.direction[mediaType].send && !settings.direction[mediaType].receive) {
          sdpLines[i] = sdpLines[i].indexOf('send') > -1 ? 'a=sendonly' : 'a=inactive';
        } else if (!settings.direction[mediaType].send && settings.direction[mediaType].receive) {
          sdpLines[i] = sdpLines[i].indexOf('recv') > -1 ? 'a=recvonly' : 'a=inactive';
        } else if (!settings.direction[mediaType].send && !settings.direction[mediaType].receive) {
        // MCU currently does not support a=inactive flag.. what do we do here?
          sdpLines[i] = 'a=inactive';
        }

        // Handle Chrome bundle bug. - See: https://bugs.chromium.org/p/webrtc/issues/detail?id=6280
        if (!self._hasMCU && window.webrtcDetectedBrowser !== 'firefox' && peerAgent === 'firefox' &&
          sessionDescription.type === self.HANDSHAKE_PROGRESS.OFFER && sdpLines[i] === 'a=recvonly') {
          Log.warn(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type, 'Overriding any original settings ' +
            'to receive only to send and receive to resolve chrome BUNDLE errors.']);
          sdpLines[i] = 'a=sendrecv';
          settings.direction[mediaType].send = true;
          settings.direction[mediaType].receive = true;
        }
      }
    }

    // Remove weird empty characters for Edge case.. :(
    if (!(sdpLines[i] || '').replace(/\n|\r|\s|\ /gi, '')) {
      sdpLines.splice(i, 1);
      i--;
    }
  }

  // Fix chrome "offerToReceiveAudio" local offer not removing audio BUNDLE
  if (bundleLineIndex > -1) {
    sdpLines[bundleLineIndex] = 'a=group:BUNDLE ' + bundleLineMids.join(' ');
  }

  // Append empty space below
  if (window.webrtcDetectedBrowser !== 'edge') {
    if (!sdpLines[sdpLines.length - 1].replace(/\n|\r|\s/gi, '')) {
      sdpLines[sdpLines.length - 1] = '';
    } else {
      sdpLines.push('');
    }
  }

  Log.info(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription',
    sessionDescription.type, 'Handling connection lines and direction ->'], settings);

  return sdpLines.join('\r\n');
};

/**
 * Function that parses and retrieves the session description fingerprint.
 * @method _getSDPFingerprint
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._getSDPFingerprint = function (targetMid, sessionDescription) {
  var fingerprint = {
    fingerprint: null,
    fingerprintAlgorithm: null,
    derBase64: null
  };

  if (!(sessionDescription && sessionDescription.sdp)) {
    return fingerprint;
  }

  var sdpLines = sessionDescription.sdp.split('\r\n');

  for (var i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].indexOf('a=fingerprint') === 0) {
      var parts = sdpLines[i].replace('a=fingerprint:', '').split(' ');
      fingerprint.fingerprint = parts[1];
      fingerprint.fingerprintAlgorithm = parts[0];
      break;
    }
  }

  return fingerprint;
};

})(this);