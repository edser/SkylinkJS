var Socket = function (options) {

  'use strict';

  var self = this;

  self._signalingServer = options.server || 'signaling.temasys.com.sg';

  self._socketPorts = {
    'http': options.httpPorts || [80, 3000],
    'https': options.httpsPorts || [443, 3443]
  };

  self._type = options.type || 'WebSocket'; // Default

  self._socketTimeout = options.socketTimeout || 20000;

  self._isSecure = options.secure || false;

  self._readyState = 'constructed';

  self._isXDR = false;

  self._signalingServerProtocol = window.location.protocol;

  self._socketMessageTimeout = null;

  self._socketMessageQueue = [];

  self.SOCKET_ERROR = {
    CONNECTION_FAILED: 0,
    RECONNECTION_FAILED: -1,
    CONNECTION_ABORTED: -2,
    RECONNECTION_ABORTED: -3,
    RECONNECTION_ATTEMPT: -4
  };

  self.SOCKET_FALLBACK = {
    NON_FALLBACK: 'nonfallback',
    FALLBACK_PORT: 'fallbackPortNonSSL',
    FALLBACK_SSL_PORT: 'fallbackPortSSL',
    LONG_POLLING: 'fallbackLongPollingNonSSL',
    LONG_POLLING_SSL: 'fallbackLongPollingSSL'
  };

  self._currentSignalingServerPort = null;

  self._channelOpen = false;

  self._objectRef = null; // The native socket.io client object

  // Append events settings in here
  Event._mixin(self);
};

Socket.prototype.connect = function(){
  var self = this;
  self._objectRef = io.connect(self._signalingServer, options);
  self.bindHandlers();
};

Socket.prototype.disconnect = function(){
  var self = this;
  if (!self._channelOpen){
    return;
  }
  if (self._objectRef){
    self._objectRef.removeAllListeners('connect');
    self._objectRef.removeAllListeners('disconnect');
    self._objectRef.removeAllListeners('reconnect');
    self._objectRef.removeAllListeners('reconnect_attempt');
    self._objectRef.removeAllListeners('reconnecting');
    self._objectRef.removeAllListeners('reconnect_error');
    self._objectRef.removeAllListeners('reconnect_failed');
    self._objectRef.removeAllListeners('connect_error');
    self._objectRef.removeAllListeners('connect_timeout');
    self._objectRef.removeAllListeners('message');
    self._channelOpen = false;
    self._objectRef.disconnect();
  }
  self._trigger('channelClose');
};

Socket.prototype.bindHandlers = function(){

  self._objectRef.on('connect', function(){
    self._readyState = 'connected';
    self._trigger('connected');
  });

  self._objectRef.on('error', function(){

  });

  self._objectRef.on('disconnect', function(){
    self._readyState = 'disconnected';
    self._trigger('disconnected');
  });

  self._objectRef.on('reconnect', function(attempt){

  });  

  self._objectRef.on('reconnect_attempt', function(){

  });  

  self._objectRef.on('reconnecting', function(attempt){

  });

  self._objectRef.on('reconnect_error', function(error){

  });  

  self._objectRef.on('reconnect_failed', function(){

  });

  self._objectRef.on('connect_error', function(error){

  });

  self._objectRef.on('connect_timeout', function(error){

  });

  self._objectRef.on('message', function(){

  });  

};






