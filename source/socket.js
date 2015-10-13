var Socket = function (options) {

  'use strict';

  var self = this;

  self.type = 'WebSocket'; // Default

  self.readyState = 'constructed';

  self.options = options;

  self.isSecure = false;

  self._isXDR = false;

  self._socketPorts = {
    'http': [80, 3000],
    'https': [443, 3443]
  };

  self._socketTimeout = 20000;

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

  self._objectRef = null; // The native socket.io client object

  // Append events settings in here
  Event._mixin(self);
};