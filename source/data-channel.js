/**
 * The list of Datachannel connection states.
 * @attribute DATA_CHANNEL_STATE
 * @param {String} CONNECTING          <small>Value <code>"connecting"</code></small>
 *   The value of the state when Datachannel is attempting to establish a connection.
 * @param {String} OPEN                <small>Value <code>"open"</code></small>
 *   The value of the state when Datachannel has established a connection.
 * @param {String} CLOSING             <small>Value <code>"closing"</code></small>
 *   The value of the state when Datachannel connection is closing.
 * @param {String} CLOSED              <small>Value <code>"closed"</code></small>
 *   The value of the state when Datachannel connection has closed.
 * @param {String} ERROR               <small>Value <code>"error"</code></small>
 *   The value of the state when Datachannel has encountered an exception during connection.
 * @param {String} CREATE_ERROR        <small>Value <code>"createError"</code></small>
 *   The value of the state when Datachannel has failed to establish a connection.
 * @param {String} BUFFERED_AMOUNT_LOW <small>Value <code>"bufferedAmountLow"</code></small>
 *   The value of the state when Datachannel when the amount of data buffered to be sent
 *   falls below the Datachannel threshold.
 *   <small>This state should occur only during after <a href="#method_sendBlobData">
 *   <code>sendBlobData()</code> method</a> or <a href="#method_sendURLData"><code>sendURLData()</code> method</a> or
 *   <a href="#method_sendP2PMessage"><code>sendP2PMessage()</code> method</a>.</small>
 * @param {String} SEND_MESSAGE_ERROR  <small>Value <code>"sendMessageError"</code></small>
 *   The value of the state when Datachannel when data transfer packets or P2P message fails to send.
 *   <small>This state should occur only during after <a href="#method_sendBlobData">
 *   <code>sendBlobData()</code> method</a> or <a href="#method_sendURLData"><code>sendURLData()</code> method</a> or
 *   <a href="#method_sendP2PMessage"><code>sendP2PMessage()</code> method</a>.</small>
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.1.0
 */
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

/**
 * The list of Datachannel types.
 * @attribute DATA_CHANNEL_TYPE
 * @param {String} MESSAGING <small>Value <code>"messaging"</code></small>
 *   The value of the Datachannel type that is used only for messaging in
 *   <a href="#method_sendP2PMessage"><code>sendP2PMessage()</code> method</a>.
 *   <small>However for Peers that do not support simultaneous data transfers, this Datachannel
 *   type will be used to do data transfers (1 at a time).</small>
 *   <small>Each Peer connections will only have one of this Datachannel type and the
 *   connection will only close when the Peer connection is closed (happens when <a href="#event_peerConnectionState">
 *   <code>peerConnectionState</code> event</a> triggers parameter payload <code>state</code> as
 *   <code>CLOSED</code> for Peer).</small>
 * @param {String} DATA <small>Value <code>"data"</code></small>
 *   The value of the Datachannel type that is used only for a data transfer in
 *   <a href="#method_sendURLData"><code>sendURLData()</code> method</a> and
 *   <a href="#method_sendBlobData"><code>sendBlobData()</code> method</a>.
 *   <small>The connection will close after the data transfer has been completed or terminated (happens when
 *   <a href="#event_dataTransferState"><code>dataTransferState</code> event</a> triggers parameter payload
 *   <code>state</code> as <code>DOWNLOAD_COMPLETED</code>, <code>UPLOAD_COMPLETED</code>,
 *   <code>REJECTED</code>, <code>CANCEL</code> or <code>ERROR</code> for Peer).</small>
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype.DATA_CHANNEL_TYPE = {
  MESSAGING: 'messaging',
  DATA: 'data'
};

/**
 * The list of Datachannel sending message error types.
 * @attribute DATA_CHANNEL_MESSAGE_ERROR
 * @param {String} MESSAGE  <small>Value <code>"message"</code></small>
 *   The value of the Datachannel sending message error type when encountered during
 *   sending P2P message from <a href="#method_sendP2PMessage"><code>sendP2PMessage()</code> method</a>.
 * @param {String} TRANSFER <small>Value <code>"transfer"</code></small>
 *   The value of the Datachannel sending message error type when encountered during
 *   data transfers from <a href="#method_sendURLData"><code>sendURLData()</code> method</a> or
 *   <a href="#method_sendBlobData"><code>sendBlobData()</code> method</a>.
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype.DATA_CHANNEL_MESSAGE_ERROR = {
  MESSAGE: 'message',
  TRANSFER: 'transfer'
};

/**
 * Function that starts a Datachannel connection with Peer.
 * @method _createDataChannel
 * @private
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._createDataChannel = function(peerId, dataChannel, bufferThreshold) {
  var self = this;

  // Invalid Room session state
  if (!(self._user || self._room)) {
    log.error([peerId, 'Datachannel', null, 'Invalid Room session state for initialising ->'], dataChannel);
    return;
  // Invalid Peer connection state
  } else if (!(self._peerConnections[peerId] &&
    self._peerConnections[peerId].signalingState !== self.PEER_CONNECTION_STATE.CLOSED)) {
    log.error([peerId, 'Datachannel', null, 'Invalid Peer connection state "' + ((self._peerConnections[peerId] &&
      self._peerConnections[peerId].signalingState) || 'null') + '" for initialising ->'], dataChannel);
    return;
  }

  var channelName = self._user.sid + '_' + peerId;
  var channelType = self.DATA_CHANNEL_TYPE.DATA;
  var channelProp = channelType === self.DATA_CHANNEL_TYPE.MESSAGING ? 'main' : channelName;

  if (dataChannel) {
    if (typeof dataChannel === 'object') {
      channelName = dataChannel.label;
    } else if (typeof dataChannel === 'string') {
      channelName = dataChannel;
      dataChannel = null;
    }
  }

  // Start as the "main" default messaging Datachannel if there isn't one or that
  //   default messaging Datachannel if channel ID matches the current "main"
  if (self._dataChannels[peerId] && self._dataChannels[peerId].main ?
    self._dataChannels[peerId].main.channel.label === channelName : true) {
    channelProp = 'main';
    channelType = self.DATA_CHANNEL_TYPE.MESSAGING;
  }

  if (!dataChannel) {
    var constraints = {
      reliable: true,
      ordered: true
    };

    log.debug([peerId, 'Datachannel', channelProp, 'Creating connection ->'], constraints);

    try {
      dataChannel = self._peerConnections[peerId].createDataChannel(channelName, constraints);
    } catch (error) {
      log.error([peerId, 'Datachannel', channelProp, 'Failed creating connection ->'], error);
      self._trigger('dataChannelState', self.DATA_CHANNEL_STATE.CREATE_ERROR, peerId, error, channelName,
        channelType, null, self._getDataChannelBuffer(dataChannel));
      return;
    }
  }

  log.debug([peerId, 'Datachannel', channelProp, 'Initialising connection ->'], dataChannel);

  /**
   * Handles the exception caught in the RTCDataChannel object.
   * RTCDataChannel.onerror event.
   */
  dataChannel.onerror = function (evt) {
    var error = evt.error || evt;
    log.error([peerId, 'Datachannel', channelProp, 'Encountered exception ->'], error);
    self._trigger('dataChannelState', self.DATA_CHANNEL_STATE.ERROR, peerId, error, channelName,
      channelType, null, self._getDataChannelBuffer(dataChannel));
  };

  /**
   * Handles the event when bufferedamountlow reaches the threshold level.
   * RTCDataChannel.onbufferedamountlow event.
   */
  dataChannel.onbufferedamountlow = function () {
    log.debug([peerId, 'Datachannel', channelProp, 'Datachannel buffering data transfer low']);
    self._trigger('dataChannelState', self.DATA_CHANNEL_STATE.BUFFERED_AMOUNT_LOW, peerId, null, channelName,
      channelType, null, self._getDataChannelBuffer(dataChannel));
  };

  dataChannel.onmessage = function(event) {
    self._processDataChannelData(event.data, peerId, channelName, channelType);
  };

  /**
   * Handles the event when RTCDataChannel has opened.
   * RTCDataChannel.onopen event.
   */
  (function () {
    var onOpenHandlerFn = function () {
      log.debug([peerId, 'Datachannel', channelProp, 'Connection has opened.']);
      dataChannel.bufferedAmountLowThreshold = bufferThreshold || 0;
      self._trigger('dataChannelState', self.DATA_CHANNEL_STATE.OPEN, peerId, null, channelName,
        channelType, null, self._getDataChannelBuffer(dataChannel));
    };

    // Set a necessary timeout so event handler would trigger the event after the _dataChannels[][] is defined
    if (dataChannel.readyState === self.DATA_CHANNEL_STATE.OPEN) {
      setTimeout(onOpenHandlerFn, 1);
    // Subscribe to the event if not opened yet
    } else {
      self._trigger('dataChannelState', dataChannel.readyState, peerId, null, channelName,
        channelType, null, self._getDataChannelBuffer(dataChannel));
      dataChannel.onopen = onOpenHandlerFn;
    }
  })();

  /**
   * Handles the event when RTCDataChannel has closed.
   * RTCDataChannel.onclose event.
   */
  (function () {
    var onCloseHandlerFn = function () {
      log.debug([peerId, 'Datachannel', channelProp, 'Connection has closed.']);
      self._trigger('dataChannelState', self.DATA_CHANNEL_STATE.CLOSED, peerId, null, channelName,
        channelType, null, self._getDataChannelBuffer(dataChannel));

      // Ignore if it's the m= line that has been rejected and hence the RTCDataChannel connection is being closed.
      if (self._peerConnections[peerId] && self._peerConnections[peerId].remoteDescription &&
        self._peerConnections[peerId].remoteDescription.sdp &&
        (self._peerConnections[peerId].remoteDescription.sdp.indexOf('m=application') === -1 ||
        self._peerConnections[peerId].remoteDescription.sdp.indexOf('m=application 0') > 0)) {
        return;
      }

      // Revive the connection if being closed for the "main" messaging channel
      if (channelType === self.DATA_CHANNEL_TYPE.MESSAGING) {
        // Set a timeout to ensure that it is not the RTCPeerConnection being closed hence it was closed.
        setTimeout(function () {
          if (self._peerConnections[peerId] &&
            self._peerConnections[peerId].signalingState !== self.PEER_CONNECTION_STATE.CLOSED &&
            (self._peerConnections[peerId].localDescription &&
            self._peerConnections[peerId].localDescription.type === self.HANDSHAKE_PROGRESS.OFFER)) {
            log.debug([peerId, 'Datachannel', channelProp, 'Reviving connection.']);
            self._createDataChannel(peerId, channelName, bufferThreshold);
          }
        }, 100);
      }
    };

    // Fixes for Firefox bug (49 is working) -> https://bugzilla.mozilla.org/show_bug.cgi?id=1118398
    if (window.webrtcDetectedBrowser === 'firefox') {
      var hasTriggeredClose = false;
      var timeBlockAfterClosing = 0;

      dataChannel.onclose = function () {
        if (!hasTriggeredClose) {
          hasTriggeredClose = true;
          onCloseHandlerFn();
        }
      };

      var onFFClosed = setInterval(function () {
        if (dataChannel.readyState === self.DATA_CHANNEL_STATE.CLOSED ||
          hasTriggeredClose || timeBlockAfterClosing === 5) {
          clearInterval(onFFClosed);

          if (!hasTriggeredClose) {
            hasTriggeredClose = true;
            onCloseHandlerFn();
          }
        // After 5 seconds from CLOSING state and Firefox is not rendering to close, we have to assume to close it.
        // It is dead! This fixes the case where if it's Firefox who closes the Datachannel, the connection will
        // still assume as CLOSING..
        } else if (dataChannel.readyState === self.DATA_CHANNEL_STATE.CLOSING) {
          timeBlockAfterClosing++;
        }
      }, 1000);

      log.debug([peerId, 'Datachannel', channelProp, 'Adding connection timer interval for Firefox browsers case.']);

    } else {
      dataChannel.onclose = onCloseHandlerFn;
    }
  })();

  self._dataChannels[peerId][channelType === self.DATA_CHANNEL_TYPE.MESSAGING ? 'main' : channelName] = {
    channelName: channelName,
    channelType: channelType,
    transferId: null,
    streamId: null,
    channel: dataChannel
  };
};

/**
 * Function that returns the Datachannel connection buffer threshold and amount.
 * @method _getDataChannelBuffer
 * @return {JSON} The buffered amount information.
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._getDataChannelBuffer = function (peerId, channelProp) {
  var dataChannel = typeof peerId === 'object' ? peerId : (this._dataChannels[peerId] &&
    this._dataChannels[peerId][channelProp] ? this._dataChannels[peerId][channelProp].channel || {} : {});

  return {
    bufferedAmountLow: typeof dataChannel.bufferedAmountLow === 'number' ?
      dataChannel.bufferedAmountLow : parseInt(dataChannel.bufferedAmountLow || '0', 10) || 0,
    bufferedAmountLowThreshold: typeof dataChannel.bufferedAmountLowThreshold === 'number' ?
      dataChannel.bufferedAmountLowThreshold : parseInt(dataChannel.bufferedAmountLowThreshold || '0', 10) || 0
  };
};

/**
 * Function that sends data over the Datachannel connection.
 * @method _sendMessageToDataChannel
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._sendMessageToDataChannel = function(peerId, data, channelProp, doNotConvert) {
  var self = this;

  // Define it as "main" messaging connection if not specified or matches the Peer ID.
  if (!channelProp || channelProp === peerId) {
    channelProp = 'main';
  }

  // Invalid data to send
  if (!(data && ['object', 'string'].indexOf(typeof data) > -1)) {
    log.error([peerId, 'Datachannel', channelProp, 'Invalid data for sending data ->'], data);
    return;
  // Invalid Room session state
  } else if (!(self._user || self._room)) {
    log.error([peerId, 'Datachannel', null, 'Invalid Room session state for sending data ->'], data);
    return;
  // Invalid Peer connection state
  } else if (!(self._peerConnections[peerId] &&
    self._peerConnections[peerId].signalingState !== self.PEER_CONNECTION_STATE.CLOSED)) {
    log.error([peerId, 'Datachannel', null, 'Invalid Peer connection state "' + ((self._peerConnections[peerId] &&
      self._peerConnections[peerId].signalingState) || 'null') + '" for sending data ->'], data);
    return;
  // Invalid Datachannel state
  } else if (!(self._dataChannels[peerId] && self._dataChannels[peerId][channelProp] &&
    self._dataChannels[peerId][channelProp].channel)) {
    log.error([peerId, 'Datachannel', channelProp, 'Invalid definition state for sending data ->'], data);
    return;
  }

  var channelName = self._dataChannels[peerId][channelProp].channelName;
  var channelType = self._dataChannels[peerId][channelProp].channelType;
  var readyState  = self._dataChannels[peerId][channelProp].channel.readyState;
  var messageType = !doNotConvert && typeof data === 'object' && data.type === self._DC_PROTOCOL_TYPE.MESSAGE ?
    self.DATA_CHANNEL_MESSAGE_ERROR.MESSAGE : self.DATA_CHANNEL_MESSAGE_ERROR.TRANSFER;

  if (readyState !== self.DATA_CHANNEL_STATE.OPEN) {
    var invalidStateError = new Error('Failed sending message as Datachannel connection state ' + 
      'is not opened. Current readyState is "' + readyState + '"');
    log.error([peerId, 'Datachannel', channelProp, 'Failed sending data ->'], invalidStateError);
    self._trigger('dataChannelState', self.DATA_CHANNEL_STATE.SEND_MESSAGE_ERROR, peerId, invalidStateError,
      channelName, channelType, messageType, self._getDataChannelBuffer(peerId, channelProp));
    return;
  }

  try {
    // Send protocol message
    if (!doNotConvert && typeof data === 'object') {
      log.debug([peerId, 'Datachannel', channelProp, '(' + data.type + ') Sending protocol message ->'], data);
      self._dataChannels[peerId][channelProp].channel.send(JSON.stringify(data));
    // Send data packet
    } else {
      log.debug([peerId, 'Datachannel', channelProp, '(DATA) Sending data size ->'], data.size || data.length || data.byteLength);
      self._dataChannels[peerId][channelProp].channel.send(data);
    }
  } catch (error) {
    log.error([peerId, 'Datachannel', channelProp, '(' + (!doNotConvert && typeof data === 'object' ?
      data.type : 'DATA') + ') Failed sending data / message ->'], error);
    self._trigger('dataChannelState', self.DATA_CHANNEL_STATE.SEND_MESSAGE_ERROR, peerId,
      error, channelName, channelType, messageType, self._getDataChannelBuffer(peerId, channelProp));
  }
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

  // Invalid Room session state
  if (!(self._user || self._room)) {
    log.error([peerId, 'Datachannel', null, 'Invalid Room session state for closing ->'], data);
    return;
  // Invalid Peer connection state
  } else if (!(self._peerConnections[peerId] &&
    self._peerConnections[peerId].signalingState !== self.PEER_CONNECTION_STATE.CLOSED)) {
    log.error([peerId, 'Datachannel', null, 'Invalid Peer connection state "' + ((self._peerConnections[peerId] &&
      self._peerConnections[peerId].signalingState) || 'null') + '" for closing ->'], data);
    return;
  }

  var closeFn = function (channelItemProp) {
    var channelName = self._dataChannels[peerId][channelItemProp].channelName;
    var channelType = self._dataChannels[peerId][channelItemProp].channelType;

    // Invalid Datachannel state
    if (!(self._dataChannels[peerId] && self._dataChannels[peerId][channelItemProp] &&
      self._dataChannels[peerId][channelItemProp].channel)) {
      log.error([peerId, 'Datachannel', channelItemProp, 'Invalid definition state for closing.']);
      return;
    } else if (self._dataChannels[peerId][channelItemProp].readyState === self.DATA_CHANNEL_STATE.CLOSED) {
      log.warn([peerId, 'Datachannel', channelItemProp, 'Invalid state "closed" for closing.']);
      return;
    }

    log.debug([peerId, 'Datachannel', channelItemProp, 'Closing connection.']);

    self._trigger('dataChannelState', self.DATA_CHANNEL_STATE.CLOSING, peerId, null, channelName, channelType,
      null, self._getDataChannelBuffer(peerId, channelItemProp));
    self._dataChannels[peerId][channelItemProp].channel.close();
    delete self._dataChannels[peerId][channelItemProp];
  };

  if (!channelProp) {
    for (var channelItemProp in self._dataChannels) {
      if (self._dataChannels[peerId].hasOwnProperty(channelItemProp)) {
        closeFn(channelItemProp);
      }
    }
  } else {
    closeFn(channelProp);
  }
};