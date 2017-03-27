/**
 * Handles the native `RTCDataChannel` object connection.
 * @class Temasys.Datachannel
 * @constructor
 * @private
 * @for Temasys
 * @since 0.7.0
 */
function Datachannel (channel, peerId, propertyId) {
  
  /**
   * The Datachannel ID.
   * @attribute id
   * @type String
   * @readOnly
   * @for Temasys.Datachannel
   * @since 0.7.0
   */
  this.id = channel.label;

  /**
   * The Datachannel type.
   * - See {{#crossLink "Temasys.Datachannel/TYPE_ENUM:attribute"}}{{/crossLink}} for reference.
   * @attribute type
   * @type String
   * @readOnly
   * @for Temasys.Datachannel
   * @since 0.7.0
   */
  this.type = propertyId === 'main' ? this.TYPE_ENUM.MESSAGING : this.TYPE_ENUM.DATA;

  /**
   * The Datachannel current states.
   * @attribute $current
   * @param {String} state The current Datachannel connection state.
   * @param {Boolean} connected The flag if Datachannel is connected.
   * @param {String} streamId The current Datatransfer streaming session ID.
   * @param {String} transferId The current Datatransfer transfer session ID.
   * @type JSON
   * @readOnly
   * @for Temasys.Datachannel
   * @since 0.7.0
   */
  this.$current = {
    state: null,
    connected: false,
    streamId: null,
    transferId: null
  };
  
  // Public properties
  this.name = channel.label;
  this.peerId = peerId;
  this.propertyId = propertyId;
  // Private properties
  this._connection = channel;
  this._bufferControl = {
    usePolling: typeof this._connection.bufferedAmountLowThreshold !== 'number',
    bufferEvent: { block: 0.5 },
    polling: { blocks: 8, interval: 250 },
    messages: { timestamp: 0, flushTimeout: 100, finalFlushTimeout: 2000 }
  };
  this._stats = {
    messages: { sent: 0, recv: 0 },
    bytes: { sent: 0, recv: 0 }
  };

  /**
   * Event triggered when Datachannel connection state has been changed.
   * @event stateChange
   * @param {String} state The current Datachannel connection state.
   * - See {{#crossLink "Temasys.Datachannel/STATE_ENUM:attribute"}}{{/crossLink}} for reference.
   * @for Temasys.Datachannel
   * @since 0.7.0
   */
  /**
   * Event triggered when Datachannel connection has encountered errors.
   * @event error
   * @param {Error} error The error object.
   * @for Temasys.Datachannel
   * @since 0.7.0
   */
  /**
   * Event triggered when Datachannel connection buffered amount threshold is low.
   * @event bufferedAmountLow
   * @param {Number} bufferedAmount The current buffered amount in bytes.
   * @param {Number} bufferedAmountLowThreshold The current buffered amount threshold set in bytes.
   * @for Temasys.Datachannel
   * @since 0.7.0
   */
  /**
   * Event triggered when Datachannel connection sends or receives data.
   * @event data
   * @param {JSON|Blob} data The data.
   * @param {Boolean} isSelf The flag if data is sent from self.
   * @param {Error} [error] The error object.
   * - This is defined when data failed to send or parse received data.
   * @for Temasys.Datachannel
   * @since 0.7.0
   */
  /**
   * Event triggered when there are exceptions thrown in this event handlers.
   * @event domError
   * @param {Error} error The error object.
   * @for Temasys.Datachannel
   * @since 0.7.0
   */
  /**
   * Event triggered when {{#crossLink "Temasys.Datachannel/getStats:method"}}{{/crossLink}} state has changed.
   * @event getStatsStateChange
   * @param {String} state The current stats retrieval state.
   * - See {{#crossLink "Temasys.Datachannel/GET_STATS_STATE_ENUM:attribute"}}{{/crossLink}} for reference.
   * @param {JSON} [stats] The stats.
   * - This is defined when `state` is `SUCCESS`.
   * @param {String} stats.id The native `RTCDataChannel` object `.id` property.
   * @param {String} stats.label The native `RTCDataChannel` object `.label` property.
   * @param {String} stats.binaryType The native `RTCDataChannel` object `.binaryType` property.
   * - This indicates the type of native object type it uses to send and pack received binary data.
   * @param {Number} stats.bufferedAmount The current Datachannel connection buffered amount in bytes.
   * @param {Number} stats.bufferedAmountLowThreshold The current Datachannel connection
   *   buffered amount low threshold in bytes.
   * @param {JSON} stats.messages The messages stats.
   * @param {Number} stats.messages.sent The number of messages sent from this Datachannel connection.
   * @param {Number} stats.messages.received The number of messages received from this Datachannel connection.
   * @param {JSON} stats.bytes The bytes stats.
   * @param {Number} stats.bytes.sent The number of bytes sent from this Datachannel connection.
   * @param {Number} stats.bytes.received The number of bytes received from this Datachannel connection.
   * @param {JSON} stats.bufferControlOptions The current Datachannel connection buffer control settings.
   * @param {String} stats.bufferControlOptions.method The current Datachannel connection buffer control method.
   * - Available methods are: `"polling"` (Polling) and `"bufferedAmount"` (Buffer amount threshold).
   * @param {Number} stats.bufferControlOptions.block The current Datachannel connection buffer control full threshold block.
   * @param {Number} [stats.bufferControlOptions.interval] The current Datachannel connection buffer control polling interval.
   * - This is defined only for Polling method.
   * @param {Number} stats.bufferControlOptions.flushTimeout The current Datachannel connection timeout to consider that
   *   the packet has been sent.
   * @param {Number} stats.bufferControlOptions.finalFlushTimeout The current Datachannel connection timeout
   *   to consider that all the packets has been sent before the Datachannel connection closes explicitly.
   * @param {Error} [error] The error object.
   * - This is defined when `state` is `FAILED`.
   * @for Temasys.Datachannel
   * @since 0.7.0
   */
  /**
   * Event triggered when there are exceptions thrown in this event handlers.
   * @event domError
   * @param {Error} error The error object.
   * @for Temasys.Datachannel
   * @since 0.7.0
   */
}

/**
 * The enum of Datachannel connection states.
 * @attribute STATE_ENUM
 * @param {String} CONNECTING The state when Datachannel connection is connecting.
 * @param {String} OPEN The state when Datachannel connection has opened.
 * @param {String} CLOSING The state when Datachannel connection is closing.
 * @param {String} CLOSED The state when Datachannel connection has closed.
 * @readOnly
 * @final
 * @for Temasys.Datachannel
 * @since 0.7.0
 */
Datachannel.prototype.STATE_ENUM = {
	CONNECTING: 'connecting',
  OPEN: 'open',
  CLOSING: 'closing',
  CLOSED: 'closed'
};

/**
 * The enum of {{#crossLink "Temasys.Datachannel/getStats:method"}}{{/crossLink}} states.
 * @attribute GET_STATS_STATE_ENUM
 * @param {String} LOADING The state when `getStats()` is retrieving stats.
 * @param {String} SUCCESS The state when `getStats()` has retrieved stats successfully.
 * @param {String} FAILED The state when `getStats()` has failed to retrieve stats.
 * @readOnly
 * @final
 * @for Temasys.Datachannel
 * @since 0.7.0
 */
Datachannel.prototype.GET_STATS_STATE_ENUM = {
	LOADING: 'loading',
  SUCCESS: 'success',
  FAILED: 'failed'
};

/**
 * Function to retrieve Datachannel connection stats.
 * @method getStats
 * @return {Promise} The Promise for function request completion.
 * @example
 *   channel.getStats().then(function (stats) {
 *     console.log("Received stats ->", stats);
 *   }).catch(function (error) {
 *     console.error("Received error ->", error);
 *   });
 * @for Temasys.Datachannel
 * @since 0.7.0
 */
Datachannel.prototype.getStats = function () {
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
 * Function to start initializing events.
 */
Datachannel.prototype.init = function () {
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