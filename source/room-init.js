/**
 * Function that handles `init()` async callbacks to proceed to the next step.
 * @method _initCallback
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._initCallback = function (result, callback) {
  var self = this;

  self._user.room.readyState = result.state;
  // Trigger `readyStateChange` event
  self._trigger('readyStateChange', result.state, result.state === self.READY_STATE_CHANGE.ERROR ? {
    content: result.content,
    status: result.status || null,
    errorCode: result.errorCode
  } : null, result.room);

  // init() result error
  if (result.state === self.READY_STATE_CHANGE.ERROR) {
    log.error('init() failed ->', result);

    if (typeof callback === 'function') {
      // Convert the parameters to suit the documented result
      callback({
        error: new Error(result.content),
        status: result.status || null,
        errorCode: result.errorCode
      }, null);
    }

  // init() result success
  } else if (result.state === self.READY_STATE_CHANGE.COMPLETED) {
    log.info('init() success ->', clone(self._options));

    if (typeof callback === 'function') {
      // Convert the parameters to suit the documented result
      callback(null, {
        serverUrl: self._user.room.path,
        readyState: self._user.room.readyState,
        appKey: self._options.appKey,
        roomServer: self._options.roomServer,
        defaultRoom: self._options.defaultRoom,
        selectedRoom: self._selectedRoom,
        enableDataChannel: self._options.enableDataChannel,
        enableIceTrickle: self._options.enableIceTrickle,
        enableTURNServer: self._options.enableTURNServer,
        enableSTUNServer: self._options.enableSTUNServer,
        TURNTransport: self._options.TURNServerTransport,
        audioFallback: self._options.audioFallback,
        forceSSL: self._options.forceSSL,
        socketTimeout: self._options.socketTimeout,
        forceTURNSSL: self._options.forceTURNSSL,
        audioCodec: self._options.audioCodec,
        videoCodec: self._options.videoCodec,
        forceTURN: self._options.forceTURN,
        usePublicSTUN: self._options.usePublicSTUN,
        disableVideoFecCodecs: self._options.disableVideoFecCodecs,
        disableComfortNoiseCodec: self._options.disableComfortNoiseCodec,
        disableREMB: self._options.disableREMB,
        filterCandidatesType: self._options.filterCandidatesType,
        throttleIntervals: self._options.throttleIntervals,
        throttleShouldThrowError: self._options.throttlingShouldThrowError,
        mcuUseRenegoRestart: self._options.mcuUseRenegoRestart,
        iceServer: self._options.turnServer,
        socketServer: self._options.socketServer
      });
    }
  }
};

/**
 * Function that handles `init()` fetching of API data.
 * @method _initFetchAPIData
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._initFetchAPIData = function (room, callback, isInit) {
  var self = this;
  var xhr = new XMLHttpRequest();
  var protocol = self._options.forceSSL ? 'https:' : window.location.protocol;

  // Fallback support for IE8/9
  if (['object', 'function'].indexOf(typeof window.XDomainRequest) > -1) {
    xhr = new XDomainRequest();
  }

  // Can only use default room due to credentials generated!
  self._user.room.name = self._options.credentials ? self._options.defaultRoom : room;
  self._user.room.protocol = protocol;

  self._initCallback({
    state: self.READY_STATE_CHANGE.INIT,
    room: self._user.room.name
  });

  // Construct API REST path
  self._user.room.path = self._options.roomServer + '/api/' + self._options.appKey + '/' + self._user.room.name;

  // Construct path with credentials authentication.
  if (self._options.credentials) {
    self._user.room.path += '/' + self._options.credentials.startDateTime + '/' +
      self._options.credentials.duration + '?&cred=' + self._options.credentials.credentials;
  }

  // Append random number to prevent network cache
  self._user.room.path += '&' + (!self._options.credentials ? '?' :'') + 'rand=' + (new Date ()).toISOString();

  // XMLHttpRequest success
  xhr.onload = function () {
    var response = JSON.parse(xhr.responseText || xhr.response || '{}') || {};
    var status = xhr.status || 200;

    log.debug('init() retrieved response ->', response);

    // Successful authentication
    if (response.success) {
      // Configure User session settings
      self._user.room.session = {
        uid: response.username,
        userCred: response.userCred,
        timeStamp: response.timeStamp,
        rid: response.room_key,
        roomCred: response.roomCred,
        len: response.len,
        start: response.start,
        cid: response.cid,
        apiOwner: response.apiOwner,
        isPrivileged: response.isPrivileged,
        autoIntroduce: response.autoIntroduce
      };

      // Configure Signaling settings
      self._socket.ports = {
        'https:': Array.isArray(response.httpsPortList) && response.httpsPortList.length > 0 ?
          response.httpsPortList : [443, 3443],
        'http:': Array.isArray(response.httpPortList) && response.httpPortList.length > 0 ?
          response.httpPortList : [80, 3000]
      };
      self._socket.server = response.ipSigserver;

      // Trigger `readyStateChange` event as COMPLETED
      self._initCallback({
        state: self.READY_STATE_CHANGE.COMPLETED,
        room: self._user.room.name
      }, callback);

    // Failed authentication
    } else {
      // Trigger `readyStateChange` event as ERROR
      self._initCallback({
        state: self.READY_STATE_CHANGE.ERROR,
        content: response.info,
        status: status,
        errorCode: response.error,
        room: self._user.room.name
      }, callback);
    }
  };

  // XMLHttpRequest error
  xhr.onerror = function () {
    log.error('init() failed retrieving response due to network timeout.');
    self._initCallback({
      state: self.READY_STATE_CHANGE.ERROR,
      status: xhr.status || null,
      content: 'Network error occurred. (Status: ' + xhr.status + ')',
      errorCode: self.READY_STATE_CHANGE_ERROR.XML_HTTP_REQUEST_ERROR,
      room: self._user.room.name
    }, callback);
  };

  // Trigger `readyStateChange` event as LOADING
  self._initCallback({
    state: self.READY_STATE_CHANGE.LOADING,
    room: self._user.room.name
  });

  xhr.open('GET', protocol + self._user.room.path, true);
  xhr.send();
};
