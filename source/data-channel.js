/**
 * Function that starts a Datachannel connection with Peer.
 * @method _createDataChannel
 * @private
 * @for Skylink
 * @since 0.5.5
 */
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