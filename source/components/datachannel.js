/**
 * Handles the peer datachannel connection.
 * @class Temasys.Datachannel
 * @param {JSON} options The options.
 * @param {String} [options.mechanism] The data buffer mechanism if available.
 * - Examples: `"polling"`, `"threshold"`
 * - When not provided, the default value is `"threshold"`.
 * - Reference [`BUFFER_MECHANISM_ENUM` constant](#docs+Temasys.Datachannel+constants+BUFFER_MECHANISM_ENUM) for the list of available mechanisms.
 * @param {Number} [options.threshold] The buffer threshold limit in bytes.
 * - When not provided, the default value is `81920`.
 * @param {Number} [options.interval] The polling interval in miliseconds to check for the buffer length.
 * - When not provided, the default value is `250`.
 * @param {Number} [options.flushTimeout] The timeout in miliseconds to wait to consider that data has been sent.
 * - When not provided, the default value is `100`.
 * @param {Number} [options.completeFlushTimeout] The timeout in miliseconds to wait to consider that all the data
 *   in the current buffer has been sent before closing the datachannel connection.
 * - When not provided, the default value is `2000`.
 * @constructor
 * @private
 * @since 0.7.0
 */
Temasys.Datachannel = function (options, channel, propertyId, peerId) {
  var ref = this;

  /**
   * Event triggered when connection state has changed.
   * @event connectionStateChange
   * @param {String} state The connection state.
   * @for Temasys.Datachannel
   * @since 0.7.0
   */
  /**
   * Event triggered when data is received.
   * @event data
   * @param {JSON|String|ArrayBuffer|Blob} data The data chunk.
   * @param {Error} [error] The error object if there are errors.
   * @param {Boolean} isSelf The flag if client is the sender.
   * @for Temasys.Datachannel
   * @since 0.7.0
   */
  /**
   * Event triggered when data buffer amount threshold is low.
   * @event bufferedAmountLow
   * @param {JSON} buffer The data buffer session.
   * - Object signature matches returned `result.session` parameter in [`getCurrent()` method](#docs+Temasys.Datachannel+methods+getCurrent).
   * @for Temasys.Datachannel
   * @since 0.7.0
   */
};

/**
 * The datachannel DT protocol implemented.
 * - Value: `"0.1.3"`
 * @attribute DT_PROTOCOL_VERSION
 * @type String
 * @readOnly
 * @final
 * @for Temasys.Datachannel
 * @since 0.7.0
 */
Temasys.Datachannel.prototype.DT_PROTOCOL_VERSION = '0.1.3';

/**
 * The enum of datachannel connection states.
 * @attribute CONNECTION_STATE_ENUM
 * @param {String} CONNECTING The state when datachannel is attempting to establish connection.
 * - Value: `"connecting"`
 * @param {String} CONNECTED The state when datachannel is connected.
 * - Value: `"open"`
 * @param {String} DISCONNECTING The state when datachannel is disconnecting.
 * - Value: `"closing"`
 * @param {String} DISCONNECTED The state when datachannel has disconnected.
 * - Value: `"closed"`
 * @readOnly
 * @final
 * @for Temasys.Datachannel
 * @since 0.7.0
 */
Temasys.Datachannel.prototype.CONNECTION_STATE_ENUM = {
	CONNECTING: 'connecting',
  OPEN: 'open',
  CLOSING: 'closing',
  CLOSED: 'closed'
};

/**
 * The enum of datachannel data buffer mechanisms.
 * @attribute BUFFER_MECHANISM_ENUM
 * @param {String} THRESHOLD The mechanism that uses the datachannel native threshold amount low event to handle data buffer.
 * - Value: `"threshold"`
 * @param {String} POLLING The mechanism that uses the polling interval to check the buffer size to handle data buffer.
 * - Value: `"polling"`
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Datachannel
 * @since 0.7.0
 */
Temasys.Datachannel.prototype.BUFFER_MECHANISM_ENUM = {
	POLLING: 'polling',
  THRESHOLD: 'threshold'
};

/**
 * The enum of datachannel types.
 * @attribute TYPE_ENUM
 * @param {String} PERSISTENT The type that cannot be closed until peer connection closes, and is used primarily for sending messages.
 * - Value: `"messaging"`
 * @param {String} TEMPORARY The type that closes once data transfer is completed or terminated and is opened only to send data transfers.
 * - Value: `"data"`
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Datachannel
 * @since 0.7.0
 */
Temasys.Datachannel.prototype.TYPE_ENUM = {
  PERSISTENT: 'messaging',
  TEMPORARY: 'data'
};

/**
 * Function that returns the socket configuration.
 * @method getConfig
 * @param {JSON} return The configuration settings.
 * - Object signature matches `options` parameter in [`Temasys.Datachannel` constructor](#docs+Temasys.Datachannel+constructor+Temasys.Datachannel).
 * @return {JSON}
 * @example
 *   console.log("config ->", datachannel.getConfig());
 * @for Temasys.Socket
 * @since 0.7.0
 */
Temasys.Datachannel.prototype.getConfig = function () {
  var ref = this;
};

/**
 * Function that returns the datachannel information
 * @method getInfo
 * @param {JSON} return The datachannel information.
 * @param {String} return.name The datachannel ID.
 * @param {String} return.type The datachannel type.
 * - Reference [`TYPE_ENUM` constant](#docs+Temasys.Datachannel+constants+TYPE_ENUM) for the list of available types.
 * @return {JSON}  
 * @example
 *   console.log("info ->", datachannel.getInfo());
 * @for Temasys.Datachannel
 * @since 0.7.0
 */
Temasys.Datachannel.prototype.getInfo = function () {
  var ref = this;
};

/**
 * Function that returns the current datachannel states and connection session.
 * @method getCurrent
 * @param {JSON} return The current states and connection session.
 * @param {JSON} return.states The current states.
 * @param {String} return.states.connectionState The datachannel connection state.
 * - Reference [`CONNECTION_STATE_ENUM` constant](#docs+Temasys.Datachannel+constants+CONNECTION_STATE_ENUM) for the list of available states.
 * @param {Boolean} return.states.connected The flag if datachannel is connected.
 * @param {JSON} return.buffer The current data buffer session.
 * @param {String} return.buffer.mechanism The buffer mechanism used.
 * - Reference [`BUFFER_MECHANISM_ENUM` constant](#docs+Temasys.Datachannel+constants+BUFFER_MECHANISM_ENUM) for the list of available mechanisms.
 * @param {Number} return.buffer.bufferedAmount The buffered amount in bytes.
 * @param {Number} [return.buffer.bufferedAmountLowThreshold] The buffered amount threshold to consider as low in bytes.
 * @param {Boolean} return.buffer.flushed The flag if all data in the buffer has been considered as sent.
 * @param {JSON} return.session The current data transfers sesions.
 * @param {String} return.session.transferId The data transfer ID.
 * @param {String} return.session.streamId The data stream ID.
 * @return {JSON}  
 * @example
 *   console.log("current info ->", datachannel.getCurrent());
 * @for Temasys.Datachannel
 * @since 0.7.0
 */
Temasys.Datachannel.prototype.getCurrent = function () {
  var ref = this;
};

/**
 * Function that returns the datachannel connection stats.
 * @method getStats
 * @param {JSON} return The full stats.
 * @param {String} return.componentId The component ID.
 * @param {String} return.propertyId The peer datachannel property ID.
 * @param {Number} return.id The peer datachannel ID.
 * @param {String} return.label The peer datachannel label.
 * @param {String} return.binaryType The peer datachannel binary type.
 * @return {JSON}
 * @example
 *   console.log("stats ->", datachannel.getStats());
 * @for Temasys.Datachannel
 * @since 0.7.0
 */
Temasys.Datachannel.prototype.getStats = function () {
};

/**
 * Function to start initializing events.
 */
Temasys.Datachannel.prototype._init = function () {
  var self = this;

  // Handle RTCDataChannel.onopen event
  var onOpenFn = function () {
    self._emit('state', 'open');
  };

  if (self._connection.readyState === 'open') {
    // Set some time to append data before starting transfers
    setTimeout(onOpenFn, 1);
  } else {
    self._connection.onopen = onOpenFn;
    self._emit('state', self._connection.readyState);
  }

  // Handle RTCDataChannel.onclose event
  var onCloseFn = function () {
    self._emit('state', 'closed');
  };

  // Fixes for Firefox bug (49 is working) -> https://bugzilla.mozilla.org/show_bug.cgi?id=1118398
  if (window.webrtcDetectedBrowser === 'firefox') {
    var closed = false;
    var block = 0;

    self._connection.onclose = function () {
      if (!closed) {
        closed = true;
        onCloseFn();
      }
    };

    var closedChecker = setInterval(function () {
      if (self._connection.readyState === 'closed' || closed || block === 5) {
        clearInterval(closedChecker);
        if (!closed) {
          closed = true;
          onCloseFn();
        }
      // After 5 seconds when state is "closed", it's actually closed on Firefox's end.
      } else if (self._connection.readyState === 'closing') {
        block++;
      }
    }, 1000);
  } else {
    self._connection.onclose = onCloseFn;
  }

  // Handle RTCDataChannel.onmessage event
  self._connection.onmessage = function (evt) {
    self._stats.messages.recv++;
    self._stats.bytes.recv += typeof evt.data === 'string' ? Utils.getStringByteLength(evt.data) :
      (evt.data.byteLength || evt.data.size || 0);
    self._emit('data', evt.data);
  };

  // Handle RTCDataChannel.onbufferedamountlow event
  self._connection.onbufferedamountlow = function () {
    self._emit('bufferedamountlow');
  };

  // Handle RTCDataChannel.onerror event
  self._connection.onerror = function (evt) {
    self._emit('error', evt.error || new Error('Datachannel error occurred.'));
  };
};

/**
 * Function to send data.
 */
Temasys.Datachannel.prototype._send = function (data, useBufferControl) {
  var self = this;
  var dataSize = data.byteLength || data.length || data.size || 0;

  if (dataSize === 0) {
    self._emit('senderror', data, new Error('Data size is 0.'));
    return;
  }

  try {
    // For implementing reliable mode where direct data packets are sent without congestion control or ACKs control
    // For some reasons, RTCDataChannel.bufferedAmount returns 0 always in IE/Safari/Firefox.
    // See: https://jira.temasys.com.sg/browse/TWP-670
    if (useBufferControl) {
      var fullBufferThreshold = dataSize * (self._bufferControl.usePolling ?
        self._bufferControl.polling.blocks : self._bufferControl.bufferEvent.blocks);

      self._connection.bufferedAmountLowThreshold = fullBufferThreshold;

      // Fixes: https://jira.temasys.com.sg/browse/TWP-569
      if (parseInt(self._connection.bufferedAmount, 10) >= fullBufferThreshold) {
        // Wait for the next 250ms to check again
        if (self._bufferControl.usePolling) {
          setTimeout(function () {
            self.send(data, true);
          }, self._bufferControl.polling.interval);
        // Wait for RTCDataChannel.onbufferedamountlow event to triggered
        } else {
          self.once('bufferedamountlow', function () {
            self.send(data, true);
          });
        }
        return;
      }
    }

    self._connection.send(data);
    self._stats.messages.sent++;
    self._stats.bytes.recv += typeof data === 'string' ? Utils.getStringByteLength(data) :
      (data.byteLength || data.size || 0);

    if (useBufferControl) {
      self._bufferControl.messages.timestamp = Date.now();
      setTimeout(function () {
        self._emit('send', data);
      }, self._bufferControl.messages.flushTimeout);
      return;
    }

    self._emit('send', data);

  } catch (error) {
    self._emit('senderror', data, error);
  }
};

/**
 * Function to close connection.
 */
Temasys.Datachannel.prototype._close = function () {
  var self = this;

  if (['closed', 'closing'].indexOf(self._connection.readyState) === -1) {
    var now = Date.now();
    // Prevent the Datachannel from closing if there is an ongoing buffer sent
    // Use the polling interval here because the bufferedamountlow event is just an indication of
    // "ready" to send next packet because threshold is lower now
    // See Firefox case where it has to be really fast enough: https://bugzilla.mozilla.org/show_bug.cgi?id=933297
    // Fixes: https://jira.temasys.com.sg/browse/TWP-569
    if (parseInt(self._connection.bufferedAmount, 10) > 0) {
      setTimeout(function () {
        self.close();
      }, self._bufferControl.polling.interval);
      return;
    }

    // Prevent closing too fast if the packet has been sent within last than expected time interval
    if ((now - self._bufferControl.messages.timestamp) >= self._bufferControl.messages.finalFlushTimeout) {
      setTimeout(function () {
        self.close();
      }, (now - self._bufferControl.messages.timestamp) - self._bufferControl.messages.finalFlushTimeout);
      return;
    }

    self._emit('state', 'closing');
    self._connection.close();
  }
};