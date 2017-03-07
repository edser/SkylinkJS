/**
 * Handles the Peer Datachannel connection.
 * @class SkylinkDataChannel
 * @for Skylink
 * @since 0.7.0
 */
function SkylinkDataChannel (channel, userId, peerId, propertyId) {
  /**
   * Event triggered when Datachannel connection state has changed.
   * @event state
   * @param {String} state The current Datachannel connection state.
   *   [Rel: SkylinkDataChannel.STATES]
   * @for SkylinkDataChannel
   * @since 0.7.0
   */
  /**
   * Event triggered when Datachannel connection buffered amount threshold is low.
   * @event bufferedamountlow
   * @param {Number} bufferedAmount The current buffered amount in bytes.
   * @param {Number} bufferedAmountLowThreshold The current buffered amount low threshold set in bytes.
   * @for SkylinkDataChannel
   * @since 0.7.0
   */
  /**
   * Event triggered when Datachannel connection sends message.
   * - This is used mostly for debugging purposes.
   * @event message
   * @param {JSON|String|ArrayBuffer|Blob} message The sent or received message.
   * @param {Boolean} isSelf The flag if the message is sent from User.
   * @param {Boolean} isProtocol The flag if message sent is part of the DT Protocol.
   * @param {Error} [error] The error received if message failed to process or send.
   * @for SkylinkDataChannel
   * @since 0.7.0
   */
  /**
   * Event triggered when Datachannel connection has started a data transfer.
   * @event transfer
   * @param {SkylinkDataTransfer} transfer The data transfer object.
   * @param {Boolean} isSelf The flag if data transfer is started from User.
   * @for SkylinkDataChannel
   * @since 0.7.0
   */
  /**
   * Event triggered when Datachannel connection has started a data streaming session.
   * @event transfer
   * @param {SkylinkDataStream} transfer The data streaming session object.
   * @param {Boolean} isSelf The flag if data streaming session is started from User.
   * @for SkylinkDataChannel
   * @since 0.7.0
   */
  EventMixin(this);

  /**
   * Stores the Datachannel name.
   * @attribute name
   * @type String
   * @readOnly
   * @for SkylinkDataChannel
   * @since 0.7.0
   */
  this.name = channel.label;

  /**
   * Stores the Datachannel type.
   * @attribute type
   * @type String
   * @readOnly
   * @for SkylinkDataChannel
   * @since 0.7.0
   */
  this.type = propertyId === 'main' ? this.TYPES.MESSAGING : this.TYPES.DATA;

  /**
   * Stores the Datachannel property ID in Peer list of Datachannels.
   * @attribute propertyId
   * @type String
   * @readOnly
   * @for SkylinkDataChannel
   * @since 0.7.0
   */
  this.propertyId = propertyId;

  /**
   * Stores the Datachannel binary type interface it supports.
   * @attribute binaryType
   * @type String
   * @readOnly
   * @for SkylinkDataChannel
   * @since 0.7.0
   */
  this.binaryType = channel.binaryType;

  /**
   * Stores the Datachannel Peer ID in relation to.
   * @attribute peerId
   * @type String
   * @readOnly
   * @for SkylinkDataChannel
   * @since 0.7.0
   */
  this.peerId = peerId;

  /**
   * Stores the Datachannel buffer control mechanism configuration.
   * - The rest of the values follows the configured settings set in the
   *   <code>setBufferSettings()</code> method <code>settings</code> parameter.
   * @attribute bufferSettings
   * @param {String} mode The mode for buffer control mechanism to be used.
   * - If value is <code>"polling"</code>, it means that polling interval is used
   *   to check if threshold is low.
   * - If value is <code>"bufferEvent"</code>, it means that <code>RTCDataChannel.onbufferamountlow</code>
   *   event is listened to check if threshold is low.
   * @type JSON
   * @readOnly
   * @for SkylinkDataChannel
   * @since 0.7.0
   */
  this.bufferSettings = {};

  // Private variables
  this._connection = connection;
  this._userId = userId;
  this._lastPacketTimestampMS = 0;
  this._stats = {
    messages: { send: 0, recv: 0 },
    bytes: { sent: 0, recv: 0 }
  };

  this.setBufferSettings();
  this._init();
}

/**
 * The enum of Peer Datachannel connection states.
 * @attribute STATES
 * @param {String} CONNECTING <small>Value <code>"connecting"</code></small>
 *   The value of the state when Datachannel is attempting to establish a connection.
 * @param {String} OPEN       <small>Value <code>"open"</code></small>
 *   The value of the state when Datachannel has established a connection.
 * @param {String} CLOSING    <small>Value <code>"closing"</code></small>
 *   The value of the state when Datachannel connection is closing.
 * @param {String} CLOSED     <small>Value <code>"closed"</code></small>
 *   The value of the state when Datachannel connection has closed.
 * @param {String} ERROR      <small>Value <code>"error"</code></small>
 *   The value of the state when Datachannel has encountered an exception during connection.
 * @type JSON
 * @readOnly
 * @final
 * @for SkylinkDataChannel
 * @since 0.7.0
 */
SkylinkDataChannel.prototype.STATES = {
  CONNECTING: 'connecting',
  OPEN: 'open',
  CLOSING: 'closing',
  CLOSED: 'closed',
  ERROR: 'error'
};

/**
 * The enum of Peer Datachannel connection types.
 * @attribute DATA_CHANNEL_TYPE
 * @param {String} MESSAGING <small>Value <code>"messaging"</code></small>
 *   The value of the Datachannel type that is primarily used for P2P messaging. This connection will not
 *   be closed until the Peer connection has closed.
 * @param {String} DATA <small>Value <code>"data"</code></small>
 *   The value of the Datachannel type that is primarily used for data transfers or streaming. This connection
 *   may be closed once the data transfer has completed or data streaming session has ended.
 * @type JSON
 * @readOnly
 * @final
 * @for SkylinkDataChannel
 * @since 0.7.0
 */
SkylinkDataChannel.prototype.TYPES = {
  MESSAGING: 'messaging',
  DATA: 'data'
};

/**
 * Function that configures and gets Datachannel connection stats.
 * @method getStats
 * @return {JSON} The Datachannel connection stats.
 * @for SkylinkDataChannel
 * @since 0.7.0
 */
SkylinkDataChannel.prototype.getStats = function () {
  var self = this;

  return {
    readyState: self._connection.readyState,
    id: self._connection.id,
    label: self._connection.label,
    binaryType: self._connection.binaryType,
    bufferedAmount: parseInt(self._connection.bufferedAmount, 10) || 0,
    bufferedAmountLowThreshold: self._connection.bufferedAmountLowThreshold || 0,
    messagesSent: self._stats.messages.sent,
    messagesReceived: self._stats.messages.recv,
    bytesSent: self._stats.bytes.sent,
    bytesReceived: self._stats.bytes.recv
  };
};

/**
 * Function that configures and sets the buffer control mechanism.
 * - This is only applied for data streaming sessions.
 * @method setBufferSettings
 * @param {Boolean} [usePolling=false] The flag if polling buffer control mechanism should be used.
 * @param {JSON} [settings] The buffer control mechanism settings.
 * @param {JSON} [settings.bufferEvent] The buffer control mechanism mode based on listening to the
 *   <code>RTCDataChannel.onbufferamountlow</code> event to check if threshold is low.
 * @param {Number} [settings.bufferEvent.thresholdBlocks=0.5] The threshold blocks.
 * @param {JSON} [settings.polling] The buffer control mechanism mode based on polling on each
 *   interval to check if threshold is low.
 * @param {Number} [settings.polling.interval=250] The polling interval in milliseconds (ms).
 * @param {Number} [settings.polling.thresholdBlocks=8] The threshold blocks.
 * @param {JSON} [settings.flushInterval] The sending interval.
 * @param {Number} [settings.flushInterval.timeout=100] The interval in milliseconds (ms) to consider
 *   that the packet data has been sent.
 * @param {Number} [settings.flushInterval.finalTimeout=2000] The interval in milliseconds (ms) to consider
 *   that the last packet data has been sent before closing. 
 * @for SkylinkDataChannel
 * @since 0.7.0
 */
SkylinkDataChannel.prototype.setBufferSettings = function (usePolling, settings) {
  var ref = this;

  // Reset to defaults
  ref.bufferSettings.usePolling = typeof ref._connection.bufferedAmountLowThreshold !== 'number';
  ref.bufferSettings.settings = {
    bufferEvent: { thresholdBlocks: 0.5 },
    polling: { thresholdBlocks: 8, interval: 250 }
    flushInterval: { flushTimeout: 100, finalFlushTimeout: 2000 }
  };

  // setBufferSettings(usePolling, ..);
  if (typeof usePolling === 'boolean') {
    ref.bufferSettings.usePolling = usePolling === true || ref.bufferSettings.usePolling;
  // setBufferSettings(settings, ..);
  } else if (usePolling && typeof usePolling === 'object') {
    settings = usePolling;
  }

  // setBufferSettings(.., settings);
  if (settings && typeof settings === 'object') {
    // setBufferSettings(.., settings.bufferEvent.thresholdBlocks);
    if (settings.bufferEvent && typeof settings.bufferEvent === 'object' &&
      typeof settings.bufferEvent.thresholdBlocks === 'number' && settings.bufferEvent.thresholdBlocks >= 0) {
      ref.bufferSettings.bufferEvent.thresholdBlocks = settings.bufferEvent.thresholdBlocks;
    }
    // setBufferSettings(.., settings.polling);
    if (settings.polling && typeof settings.polling === 'object') {
      // setBufferSettings(.., settings.polling.thresholdBlocks);
      if (typeof settings.polling.thresholdBlocks === 'number' && settings.polling.thresholdBlocks >= 0) {
        ref.bufferSettings.polling.thresholdBlocks = settings.polling.thresholdBlocks;
      }
      // setBufferSettings(.., settings.polling.interval);
      if (typeof settings.polling.interval === 'number' && settings.polling.interval >= 0) {
        ref.bufferSettings.polling.interval = settings.polling.interval;
      }
    }
    // setBufferSettings(.., settings.flushInterval);
    if (settings.flushInterval && typeof settings.flushInterval === 'object') {
      // setBufferSettings(.., settings.flushInterval.timeout);
      if (typeof settings.flushInterval.timeout === 'number' && settings.polling.timeout >= 0) {
        ref.bufferSettings.flushInterval.timeout = settings.flushInterval.timeout;
      }
      // setBufferSettings(.., settings.flushInterval.finalTimeout);
      if (typeof settings.flushInterval.finalTimeout === 'number' && settings.flushInterval.finalTimeout >= 0) {
        ref.bufferSettings.flushInterval.finalTimeout = settings.flushInterval.finalTimeout;
      }
    }
  }
};

/**
 * Function that starts a data transfer.
 * @method transfer
 * @param 


  var self = this;

  EventMixin(self);
  // Public properties
  self.name = channel.label;
  self.peerId = peerId;
  self.propertyId = propertyId;
  // Private properties
  self._connection = channel;
  self._bufferControl = {
    usePolling: typeof self._connection.bufferedAmountLowThreshold !== 'number',
    bufferEvent: { block: 0.5 },
    polling: { blocks: 8, interval: 250 },
    messages: { timestamp: 0, flushTimeout: 100, finalFlushTimeout: 2000 }
  };
  self._stats = {
    messages: { sent: 0, recv: 0 },
    bytes: { sent: 0, recv: 0 }
  };

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
}

/**
 * Function to send data.
 */
Datachannel.prototype.send = function (data, useBufferControl) {
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
Datachannel.prototype.close = function () {
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

