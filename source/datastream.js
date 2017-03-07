/**
 * Handles the data streaming session.
 * @class SkylinkDataStream
 * @for Skylink
 * @since 0.7.0
 */
function SkylinkDataStream (streamId, sessionInfo) {
	/**
   * Event triggered when data transfer state has changed.
   * @event state
   * @param {String} state The current data transfer state.
   *   [Rel: SkylinkDataStream.STATES]
   * @for SkylinkDataStream
   * @since 0.7.0
   */
  /**
   * Event triggered when uploading data stream session has started.
   * @event start
   * @for SkylinkDataStream
   * @since 0.7.0
   */
  /**
   * Event triggered when uploading data stream session has stopped.
   * @event stop
   * @for SkylinkDataStream
   * @since 0.7.0
   */
  /**
   * Event triggered when data stream data chunk has been sent / received.
   * @event data
   * @param {String|Blob} data The data stream chunk sent / received.
   * @for SkylinkDataStream
   * @since 0.7.0
   */
  EventMixin(this);

  /**
   * Stores the data stream session ID.
   * @attribute id
   * @type String
   * @readOnly
   * @for SkylinkDataStream
   * @since 0.7.0
   */
  this.id = streamId;

  /**
   * Stores the data stream session maximum chunk size.
   * @attribute maxChunkSize
   * @type Number
   * @readOnly
   * @for SkylinkDataStream
   * @since 0.7.0
   */
  this.maxChunkSize = sessionInfo.chunkSize;

  /**
   * Stores the data stream session chunk type.
   * @attribute chunkType
   * @type String
   * @readOnly
   * @for SkylinkDataStream
   * @since 0.7.0
   */
  this.chunkType = sessionInfo.chunkType;

  /**
   * Stores the data stream sender Peer ID.
   * @attribute senderPeerId
   * @type String
   * @readOnly
   * @for SkylinkDataStream
   * @since 0.7.0
   */
  this.senderPeerId = sessionInfo.senderPeerId;

  /**
   * Stores the data stream target Peer ID.
   * @attribute targetPeerId
   * @type String|Array
   * @readOnly
   * @for SkylinkDataStream
   * @since 0.7.0
   */
  this.targetPeerId = sessionInfo.targetPeerId;

  /**
   * Stores the flag if data stream started from User to Peer.
   * @attribute isUpload
   * @type Boolean
   * @readOnly
   * @for SkylinkDataStream
   * @since 0.7.0
   */
  this.isUpload = sessionInfo.isUpload;

  // Private variables
  this._totalSize = 0;
  this._totalChunks = 0;
  this._active = false;
}

/**
 * The enum of data streaming states.
 * @attribute STATES
 * @param {String} SENDING_STARTED   <small>Value <code>"sendStart"</code></small>
 *   The value of the state when data streaming session has started from User to Peer.
 * @param {String} RECEIVING_STARTED <small>Value <code>"receiveStart"</code></small>
 *   The value of the state when data streaming session has started from Peer to Peer.
 * @param {String} RECEIVED          <small>Value <code>"received"</code></small>
 *   The value of the state when data streaming session data chunk has been received from Peer to User.
 * @param {String} SENT              <small>Value <code>"sent"</code></small>
 *   The value of the state when data streaming session data chunk has been sent from User to Peer.
 * @param {String} SENDING_STOPPED   <small>Value <code>"sendStop"</code></small>
 *   The value of the state when data streaming session has stopped from User to Peer.
 * @param {String} RECEIVING_STOPPED <small>Value <code>"receivingStop"</code></small>
 *   The value of the state when data streaming session has stopped from Peer to User.
 * @param {String} ERROR             <small>Value <code>"error"</code></small>
 *   The value of the state when data streaming session has errors.
 *   <small>At this stage, the data streaming state is considered <code>SENDING_STOPPED</code> or
 *   <code>RECEIVING_STOPPED</code>.</small>
 * @param {String} START_ERROR       <small>Value <code>"startError"</code></small>
 *   The value of the state when data streaming session failed to start from User to Peer.
 * @type JSON
 * @final
 * @readOnly
 * @for SkylinkDataStream
 * @since 0.7.0
 */
SkylinkDataStream.prototype.STATES = {
  SENDING_STARTED: 'sendStart',
  SENDING_STOPPED: 'sendStop',
  RECEIVING_STARTED: 'receiveStart',
  RECEIVING_STOPPED: 'receiveStop',
  RECEIVED: 'received',
  SENT: 'sent',
  ERROR: 'error',
  START_ERROR: 'startError'
};

/**
 * Function to get the current stats.
 * @method getStats
 * @for SkylinkDataStream
 * @since 0.7.0
 */
SkylinkDataStream.prototype.getStats = function () {
	var ref = this;
	return {
		active: ref._active,
		totalSize: ref._totalSize,
    totalChunks: ref._totalChunks
	};
};

/**
 * Function to stream data chunk.
 * @method stream
 * @param {Blob|String} The data chunk to stream to Peer.
 * @for SkylinkDataStream
 * @since 0.7.0
 */
SkylinkDataTransfer.prototype.stream = function (chunk) {
  var ref = this;

};

/**
 * Function to stop data streaming session.
 * @method stop
 * @for SkylinkDataStream
 * @since 0.7.0
 */
SkylinkDataTransfer.prototype.stop = function () {
	var ref = this;

	if (ref.isUpload) {
		throw new Error('Data transfer cannot be accepted or rejected for uploading data transfer.');
	}

	ref._setState(accept ? ref.STATES.DOWNLOAD_STARTED : ref.STATES.REJECTED,
		'User has rejected downloading data transfer request.');
};

/**
 * Function to terminate the current data transfer session.
 * - Note that if this is terminated from MCU Peer end, it will terminate for all Peers.
 * @method terminate
 * @for SkylinkDataTransfer
 * @since 0.7.0
 */
SkylinkDataTransfer.prototype.terminate = function () {
	var ref = this;
	ref._setState(ref.STATES.CANCEL, 'User has terminated ' + (ref.isUpload ? 'uploading' :
		'downloading') + ' data transfer.');
};

/**
 * Private function that sets the data transfer session state.
 */
SkylinkDataTransfer.prototype._setState = function (state, content) {
	var ref = this;

	if (state === ref.STATES.DOWNLOADING) {
		ref._chunks.push(content);
		ref._progressSize += content.byteLength || content.length || content.size || 0;
	} else if (state === ref.STATES.UPLOADING) {
		ref._progressSize += content.byteLength || content.length || content.size || 0;
	} else if (state === ref.STATES.UPLOADING) {

	}
};