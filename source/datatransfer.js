/**
 * Handles the data transfer session.
 * @class SkylinkDataTransfer
 * @for Skylink
 * @since 0.7.0
 */
function SkylinkDataTransfer (transferId, sessionInfo) {
	/**
   * Event triggered when data transfer state has changed.
   * @event state
   * @param {String} state The current data transfer state.
   *   [Rel: SkylinkDataTransfer.STATES]
   * @for SkylinkDataTransfer
   * @since 0.7.0
   */
  /**
   * Event triggered when start data transfer request is received / sent.
   * @event request
   * @for SkylinkDataTransfer
   * @since 0.7.0
   */
  /**
   * Event triggered when data transfer has completed.
   * @event complete
   * @param {Blob|String} [data] The data received only for downloading data transfers.
   * @for SkylinkDataTransfer
   * @since 0.7.0
   */
  /**
   * Event triggered when data transfer has terminated.
   * @event terminate
   * @param {Error} [error] The error received that caused the termination.
   * @for SkylinkDataTransfer
   * @since 0.7.0
   */
  EventMixin(this);

  /**
   * Stores the data transfer session ID.
   * @attribute id
   * @type String
   * @readOnly
   * @for SkylinkDataTransfer
   * @since 0.7.0
   */
  this.id = transferId;

  /**
   * Stores the data transfer session data name.
   * @attribute name
   * @type String
   * @readOnly
   * @for SkylinkDataTransfer
   * @since 0.7.0
   */
  this.name = sessionInfo.name;

  /**
   * Stores the data transfer session type.
   * @attribute type
   * @type String
   * @readOnly
   * @for SkylinkDataTransfer
   * @since 0.7.0
   */
  this.type = sessionInfo.type;

  /**
   * Stores the data transfer session chunk size.
   * @attribute chunkSize
   * @type Number
   * @readOnly
   * @for SkylinkDataTransfer
   * @since 0.7.0
   */
  this.chunkSize = sessionInfo.chunkSize;

  /**
   * Stores the data transfer session expected complete size.
   * @attribute size
   * @type Number
   * @readOnly
   * @for SkylinkDataTransfer
   * @since 0.7.0
   */
  this.size = sessionInfo.size;

  /**
   * Stores the data transfer session chunk type.
   * @attribute chunkType
   * @type String
   * @readOnly
   * @for SkylinkDataTransfer
   * @since 0.7.0
   */
  this.chunkType = sessionInfo.chunkType;

  /**
   * Stores the data transfer session MIME type for Blob objects.
   * @attribute mimeType
   * @type String
   * @optional
   * @readOnly
   * @for SkylinkDataTransfer
   * @since 0.7.0
   */
  this.mimeType = sessionInfo.mimeType || null;

  /**
   * Stores the data transfer sender Peer ID.
   * @attribute senderPeerId
   * @type String
   * @readOnly
   * @for SkylinkDataChannel
   * @since 0.7.0
   */
  this.senderPeerId = sessionInfo.senderPeerId;

  /**
   * Stores the data transfer target Peer ID.
   * - This is defined as an Array for MCU-enabled Peer data transfers.
   * @attribute targetPeerId
   * @type String|Array
   * @readOnly
   * @for SkylinkDataTransfer
   * @since 0.7.0
   */
  this.targetPeerId = sessionInfo.targetPeerId;

  /**
   * Stores the flag if data transfer started from User to Peer.
   * @attribute isUpload
   * @type Boolean
   * @readOnly
   * @for SkylinkDataTransfer
   * @since 0.7.0
   */
  this.isUpload = sessionInfo.isUpload;

  // Private variables
  this._progressSize = 0;
  this._state = null;
  this._chunks = [];
}

/**
 * The enum of data transfer session states.
 * @attribute STATES
 * @param {String} UPLOAD_REQUEST     <small>Value <code>"request"</code></small>
 *   The value of the state when receiving an upload data transfer request from Peer to User.
 *   <small>At this stage, the upload data transfer request from Peer may be accepted or rejected with the
 *   <a href="#method_acceptDataTransfer"><code>acceptDataTransfer()</code> method</a> invoked by User.</small>
 * @parma {String} USER_UPLOAD_REQUEST <small>Value <code>"userRequest"</code></small>
 *   The value of the state when User sent an upload data transfer request to Peer.
 *   <small>At this stage, the upload data transfer request to Peer may be accepted or rejected with the
 *   <a href="#method_acceptDataTransfer"><code>acceptDataTransfer()</code> method</a> invoked by Peer.</small>
 * @param {String} UPLOAD_STARTED     <small>Value <code>"uploadStarted"</code></small>
 *   The value of the state when the data transfer request has been accepted
 *   and data transfer will start uploading data to Peer.
 *   <small>At this stage, the data transfer may be terminated with the
 *   <a href="#method_cancelDataTransfer"><code>cancelDataTransfer()</code> method</a>.</small>
 * @param {String} DOWNLOAD_STARTED   <small>Value <code>"downloadStarted"</code></small>
 *   The value of the state when the data transfer request has been accepted
 *   and data transfer will start downloading data from Peer.
 *   <small>At this stage, the data transfer may be terminated with the
 *   <a href="#method_cancelDataTransfer"><code>cancelDataTransfer()</code> method</a>.</small>
 * @param {String} REJECTED           <small>Value <code>"rejected"</code></small>
 *   The value of the state when upload data transfer request to Peer has been rejected and terminated.
 * @param {String} USER_REJECTED      <small>Value <code>"userRejected"</code></small>
 *   The value of the state when User rejected and terminated upload data transfer request from Peer.
 * @param {String} UPLOADING          <small>Value <code>"uploading"</code></small>
 *   The value of the state when data transfer is uploading data to Peer.
 * @param {String} DOWNLOADING        <small>Value <code>"downloading"</code></small>
 *   The value of the state when data transfer is downloading data from Peer.
 * @param {String} UPLOAD_COMPLETED   <small>Value <code>"uploadCompleted"</code></small>
 *   The value of the state when data transfer has uploaded successfully to Peer.
 * @param {String} DOWNLOAD_COMPLETED <small>Value <code>"downloadCompleted"</code></small>
 *   The value of the state when data transfer has downloaded successfully from Peer.
 * @param {String} CANCEL             <small>Value <code>"cancel"</code></small>
 *   The value of the state when data transfer has been terminated from / to Peer.
 * @param {String} ERROR              <small>Value <code>"error"</code></small>
 *   The value of the state when data transfer has errors and has been terminated from / to Peer.
 * @type JSON
 * @readOnly
 * @for SkylinkDataTransfer
 * @since 0.7.0
 */
SkylinkDataTransfer.prototype.STATES = {
  UPLOAD_REQUEST: 'request',
  UPLOAD_STARTED: 'uploadStarted',
  DOWNLOAD_STARTED: 'downloadStarted',
  REJECTED: 'rejected',
  CANCEL: 'cancel',
  ERROR: 'error',
  UPLOADING: 'uploading',
  DOWNLOADING: 'downloading',
  UPLOAD_COMPLETED: 'uploadCompleted',
  DOWNLOAD_COMPLETED: 'downloadCompleted',
  USER_REJECTED: 'userRejected',
  USER_UPLOAD_REQUEST: 'userRequest',
  START_ERROR: 'startError'
};

/**
 * Function to get the current stats.
 * @method getStats
 * @for SkylinkDataTransfer
 * @return {JSON} The data transfer stats.
 * @since 0.7.0
 */
SkylinkDataTransfer.prototype.getStats = function () {
	var ref = this;
	return {
		state: ref._state,
		progressSize: ref._progressSize
	};
};

/**
 * Function to respond to downloading data transfer request.
 * @method respondToRequest
 * @param {Boolean} [accept] The flag if User should accept the data transfer request.
 * @for SkylinkDataTransfer
 * @since 0.7.0
 */
SkylinkDataTransfer.prototype.respondToRequest = function (accept) {
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