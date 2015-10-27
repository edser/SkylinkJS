var Socket = function (options) {

  'use strict';

  var self = this;

  if (!options){
    options = {};
  }

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

  self._signalingServerProtocol = window.location.protocol.substring(0,window.location.protocol.length-1);

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

  self._firstConnect = false;

  self._socketOptions = {
    reconnection: true,
    reconnectionAttempts: 2,
    forceNew: true
  };

  // Append events settings in here
  SkylinkEvent._mixin(self);
};

Socket.prototype._assignPort = function(){

  var self = this;

  var ports = self._socketPorts[self._signalingServerProtocol];

  var currentPortIndex = ports.indexOf(self._currentSignalingServerPort);

  // First time connecting. Trying first port
  if (currentPortIndex === -1){
    console.log('first try',currentPortIndex);
    self._currentSignalingServerPort = ports[0];
  }
  // Trying next port
  else if (currentPortIndex > -1 && currentPortIndex < ports.length-1){
    console.log('second try',currentPortIndex);
    self._currentSignalingServerPort = ports[currentPortIndex+1];
  }
  // Reached the last port. Try polling next time
  else{
    console.log('last try',currentPortIndex);
    // Fallback to long polling and restart port index
    if (self._type === 'WebSocket'){
      console.log('falling back',currentPortIndex);
      self._type = 'Polling';
      self._currentSignalingServerPort = ports[0];
    }
    // Long polling already. Keep retrying
    else if (self._type === 'Polling'){
      console.log('desperate',currentPortIndex);
      self._socketOptions.reconnectionAttempts = 4;
      self._socketOptions.reconectionDelayMax = 1000;
    }

  }

};

Socket.prototype.connect = function(){
  var self = this;

  self.disconnect();

  self._assignPort();

  var url = self._signalingServerProtocol + '://' + self._signalingServer + ':' + self._currentSignalingServerPort;

  if (self._type === 'WebSocket') {
    console.log('setting WebSocket');
    self._socketOptions.transports = ['websocket'];
  } else if (self._type === 'Polling') {
    console.log('setting Polling');
    self._socketOptions.transports = ['xhr-polling', 'jsonp-polling', 'polling'];
    // self._socketOptions.transports = ['polling'];
  }

  console.log(url,self._socketOptions);

  self._objectRef = io.connect(url, self._socketOptions);

  if (!self._firstConnect){
    self._bindHandlers();
  }

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

Socket.prototype._bindHandlers = function(){

  var self = this;

  self._firstConnect = false; // No need to bind handlers next time

  // Fired upon connecting
  self._objectRef.on('connect', function(){
    self._channelOpen = true;
    self._readyState = 'connected';
    self._trigger('connected');
  });

  // Fired upon a connection error
  self._objectRef.on('error', function(error){
    self._channelOpen = false;
    self._readyState = 'error';
    self._trigger('error',error);
  });

  // Fired upon a disconnection
  self._objectRef.on('disconnect', function(){
    self._channelOpen = false;
    self._readyState = 'disconnected';
    self._trigger('disconnected');
  });

  // Fired upon a successful reconnection
  self._objectRef.on('reconnect', function(attempt){
    self._channelOpen = true;
    self._readyState = 'reconnect';
    self._trigger('reconnect',attempt);
  });  

  // Fired upon an attempt to reconnect
  self._objectRef.on('reconnect_attempt', function(){
    self._channelOpen = false;
    self._readyState = 'reconnect_attempt';
    self._trigger('reconnect_attempt');
  });  

  // Fired upon an attempt to reconnect
  // attempt: reconnection attempt count
  self._objectRef.on('reconnecting', function(attempt){
    self._readyState = 'reconnecting';
    self._trigger('reconnecting', attempt);
  });

  // Fired upon a reconnection attempt error
  self._objectRef.on('reconnect_error', function(error){
    self._channelOpen = false;
    self._readyState = 'reconnect_error';
    self._trigger('reconnect_error', error);
  });  

  // Fired when couldn't reconnect within reconnectionAttempts
  self._objectRef.on('reconnect_failed', function(){
    self._channelOpen = false;
    self._readyState = 'reconnect_failed';
    self._trigger('reconnect_failed');
    self.connect();
  });

  // Fired upon a connection error
  self._objectRef.on('connect_error', function(error){
    self._channelOpen = false;
    self._readyState = 'connect_error';
    self._trigger('connect_error', error);
  });

  // Fired upon a connection timeout
  self._objectRef.on('connect_timeout', function(error){
    self._channelOpen = false;
    self._readyState = 'connect_timeout';
    self._trigger('connect_timeout', error);
  });

  self._objectRef.on('message', function(){

  });  

};
