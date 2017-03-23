/**
 * Handles the native `MediaStream` object audio and video tracks.
 * @class Temasys.Stream
 * @param {JSON|MediaStream} options The options.
 * - When provided as a native `MediaStream` object, only `1` track each for audio and video is allowed or
 *   the object is rejected. Note that audio and video constraints will not be retrieved and be counted as `true`.
 * @param {JSON|Boolean} [options.audio] The audio track options.
 * - When provided as a `Boolean`, it simply passes it as `true` as the native `getUserMedia()` API audio constraint.
 * @param {Boolean} [options.audio.echoCancellation=true] The flag to enable echo cancellation (AEC) when supported.
 * @param {JSON|String} [options.audio.sourceId] The audio track source ID to request.
 * - When provided as a `JSON`, it follows the native `getUserMedia()` API constraints.
 *   E.g. `sourceId: { exact: ..., ideal: ... }`.
 * - The list of available audio track sources can be obtained from
 *   {{#crossLink "Utils/Utils.Stream.getSources:method"}}{{/crossLink}}.
 * @param {Array} [options.audio.optional] @[exp] The native `getUserMedia()` API audio optional constraints.
 *   E.g. `optional: [{ xxx, xxx }]
 * @param {JSON|Boolean} [options.video] The video track options.
 * - When provided as a `Boolean`, it simply passes it as `true` as the native `getUserMedia()` API video constraint.
 * @param {JSON|String} [options.video.sourceId] The video track source ID to request.
 * - When provided as a `JSON`, it follows the native `getUserMedia()` API constraints.
 *   E.g. `sourceId: { exact: ..., ideal: ... }`.
 * - The list of available video track sources can be obtained from
 *   {{#crossLink "Utils/Utils.Stream.getSources:method"}}{{/crossLink}}.
 * @param {JSON|Number} [options.video.width] @[exp] The video track expected video frame resolution width.
 * - When provided as a `JSON`, it follows the native `getUserMedia()` API constraints.
 *   E.g. `width: { exact: ..., ideal: ..., min: ..., max: ... }`.
 * @param {JSON|Number} [options.video.height] @[exp] The video track expected video frame resolution height.
 * - When provided as a `JSON`, it follows the native `getUserMedia()` API constraints.
 *   E.g. `height: { exact: ..., ideal: ..., min: ..., max: ... }`.
 * @param {JSON|Number} [options.video.frameRate] @[exp] The video track expected video framerate (fps).
 * - When provided as a `JSON`, it follows the native `getUserMedia()` API constraints.
 *   E.g. `frameRate: { exact: ..., ideal: ..., min: ..., max: ... }`.
 * @param {JSON|Number} [options.video.facingMode] @[exp] The video track expected video camera facing mode.
 * - When provided as a `JSON`, it follows the native `getUserMedia()` API constraints.
 *   E.g. `facingMode: { exact: ..., ideal: ..., min: ..., max: ... }`.
 * @param {Array|String|Boolean} [options.video.screenshare] @[exp] The flag if video track is screensharing source.
 * - When provided as an `Array` or a `String`, it follows the native `getUserMedia()` API `"mediaSource"` constraints.
 *   E.g. `mediaSource: options.video.screenshare`.
 * - If this is defined (not as `false`), the native `getUserMedia()` API might be executed twice for audio track and
 *   video track separately.
 * @param {JSON} [options.custom] @[exp] The custom native `getUserMedia()` API constraints to use.
 *   E.g. `custom: { audio: { ... }, video: { ... } }`.
 * - If this is defined, this will override all `options.audio` and `options.video` settings.
 * @constructor
 * @example
 *   // Example 1: Retrieve audio and video tracks
 *   var stream = new Temasys.Stream({ audio: true, video: true });
 *   stream.on("state", function (state) {
 *     if (state === stream.STATE_ENUM.START) {
 *       stream.attachElement(videoDOM);
 *     } else if (state === stream.STATE_ENUM.ERROR) {
 *       console.log("Failed retrieving stream ->", error);
 *     }
 *   });
 *
 *   // Example 2: Append the MediaStream object
 *   var stream = new Temasys.Stream(stream);
 *   stream.on("state", function (state) {
 *     if (state === stream.STATE_ENUM.START) {
 *       stream.attachElement(videoDOM);
 *     } else if (state === stream.STATE_ENUM.ERROR) {
 *       console.log("Failed retrieving stream ->", error);
 *     }
 *   });
 * @for Temasys
 * @since 0.7.0
 */
function Stream (options) {
	/**
	 * The Stream ID. 
	 * @attribute id
	 * @type String
	 * @readOnly
	 * @for Temasys.Stream
	 * @since 0.7.0
	 */
	this.id = null;

	/**
	 * The flag if Stream is from self or not.
	 * @attribute remote
	 * @type Boolean
	 * @readOnly
	 * @for Temasys.Stream
	 * @since 0.7.0
	 */
	this.remote = false;

	/**
	 * The Stream settings. 
	 * @attribute settings
	 * @param {JSON|Boolean} audio The audio track constraints settings.
	 * - The value follows the `options.audio` (or `options.custom.audio`) parameter passed in the constructor
	 *   except for the `.id`.
	 * @param {String} audio.id The audio track ID.
	 * @param {JSON|Boolean} video The video track constraints settings.
	 * - The value follows the `options.video` (or `options.custom.video`) parameter passed in the constructor
	 *   except for the `.id`.
	 * @param {String} video.id The video track ID.
	 * @type JSON
	 * @readOnly
	 * @for Temasys.Stream
	 * @since 0.7.0
	 */
	this.settings = {
		audio: false,
		video: false
	};

	/**
	 * The Stream current states.
	 * @attribute $current
	 * @type JSON
	 * @param {JSON} tracks The current Stream tracks states.
	 * @param {JSON} tracks.audio The current Stream audio track states.
	 * @param {Boolean} tracks.audio.muted The flag if Stream audio track is muted.
	 * @param {String} tracks.audio.state The current Stream audio track active state.
	 * - See {{#crossLink "Temasys.Stream/TRACK_STATE_ENUM:attribute"}}{{/crossLink}} for reference.
	 * @param {Boolean} tracks.audio.active The flag if Stream video track is active.
	 * @param {JSON} tracks.video The current Stream video track states.
	 * @param {Boolean} tracks.video.muted The flag if Stream video track is muted.
	 * @param {String} tracks.video.state The current Stream video track active state.
	 * - See {{#crossLink "Temasys.Stream/TRACK_STATE_ENUM:attribute"}}{{/crossLink}} for reference.
	 * @param {Boolean} tracks.video.active The flag if Stream video track is active.
	 * @param {String} state The current Stream active state.
	 * - See {{#crossLink "Temasys.Stream/STATE_ENUM:attribute"}}{{/crossLink}} for reference.
	 * @param {Boolean} active The flag if Stream is active.
	 * @for Temasys.Stream
	 * @since 0.7.0
	 */
	this.$current = {
		tracks: {
			audio: { active: false, muted: false, state: null },
			video: { active: false, muted: false, state: null }
		},
		state: null,
		active: false
	};

	/**
	 * Event triggered when Stream active state has been changed.
	 * @event stateChange
	 * @param {String} state The current Stream active state.
	 * - See {{#crossLink "Temasys.Stream/STATE_ENUM:attribute"}}{{/crossLink}} for reference.
	 * @for Temasys.Stream
	 * @since 0.7.0
	 */
	/**
	 * Event triggered when Stream track active state has been changed.
	 * @event trackStateChange
	 * @param {String} state The current Stream track active state.
	 * - See {{#crossLink "Temasys.Stream/TRACK_STATE_ENUM:attribute"}}{{/crossLink}} for reference.
	 * @param {String} type The Stream track type.
	 * - Available values for identification are: `"audio"` for audio track and `"video"` for video track.
	 * @param {String} trackId The Stream track ID.
	 * @for Temasys.Stream
	 * @since 0.7.0
	 */
	/**
	 * Event triggered when Stream track muted state has been changed.
	 * @event mutedStateChange
	 * @param {Boolean} muted The flag if Stream track is muted.
	 * @param {String} type The Stream track type.
	 * - Available values for identification are: `"audio"` for audio track and `"video"` for video track.
	 * @param {String} trackId The Stream track ID.
	 * @for Temasys.Stream
	 * @since 0.7.0
	 */
	/**
   * Event triggered when there are exceptions thrown in this event handlers.
   * @event domError
   * @param {Error} error The error object.
   * @for Temasys.Stream
   * @since 0.7.0
   */
}

/**
 * The enum of Stream active states.
 * @attribute STATE_ENUM
 * @param {String} START The state when Stream has been retrieved or initialised successfully and is active.
 * @param {String} STOP The state when Stream is not longer active.
 * @param {String} ERROR The state when Stream had failed to retrieve or initilaise successfully.
 * @readOnly
 * @final
 * @for Temasys.Stream
 * @since 0.7.0
 */
Stream.prototype.STATE_ENUM = {
	START: 'start',
	STOP: 'stop',
	ERROR: 'error'
};

/**
 * The enum of Stream track active states.
 * @attribute TRACK_STATE_ENUM
 * @param {String} START The state when Stream track has been initialiseda and is active.
 * @param {String} STOP The state when Stream track is not longer active.
 * @param {String} DEVICE_MUTED The state when Stream track streaming is muted by device not by client.
 * @param {String} DEVICE_UNMUTED The state when Stream track streaming is unmuted by device not by client.
 * @readOnly
 * @final
 * @for Temasys.Stream
 * @since 0.7.0
 */
Stream.prototype.TRACK_STATE_ENUM = {
	START: 'start',
	STOP: 'stop',
	DEVICE_MUTED: 'deviceMuted',
	DEVICE_UNMUTED: 'deviceUnmuted'
};

/**
 * Function to attach Stream audio and video tracks to the `<video>` or `<audio>` DOM elements.
 * @method attachElement
 * @param {DOM} element The `<video>` or `<audio>` DOM element.
 * @param {JSON} [options] The options.
 * @param {Boolean} [options.audio=true] The flag if the Stream audio track should be appended to the element.
 * @param {Boolean} [options.video=true] The flag if the Stream video track should be appended to the element. 
 * @example
 *   var stream = new Temasys.Stream({ audio: true, video: true });
 *   stream.on("stateChange", function (state) {
 *     if (state === stream.STATE_ENUM.START) {
 *       stream.attachElement(videoDOM);
 *     }
 *   });
 * @for Temasys.Stream
 * @since 0.7.0
 */
Stream.prototype.attachElement = function (element, options) {
};

/**
 * Function to mute Stream audio and video tracks.
 * @method muteTracks
 * @param {JSON} [options] The options.
 * @param {Boolean} [options.audio] The flag if the Stream audio track should be muted.
 * @param {Boolean} [options.video] The flag if the Stream video track should be muted.
 * @return {Promise} The Promise for function request completion.
 * @example
 *   var stream = new Temasys.Stream({ audio: true, video: true });
 *   stream.on("stateChange", function (state) {
 *     if (state === stream.STATE_ENUM.START) {
 *       stream.muteTracks().then(function (mutedStatus) {
 *         console.log("Audio muted ->", mutedStatus.audio);
 *         console.log("Video muted ->", mutedStatus.video);
 *       }).catch(function (error, mutedStatus) {
 *         console.error("Failed muting ->", error);
 *         console.error("Audio muted (current) ->", mutedStatus.audio);
 *         console.error("Video muted (current) ->", mutedStatus.video);
 *       });
 *     }
 *   });
 * @for Temasys.Stream
 * @since 0.7.0
 */
Stream.prototype.muteTracks = function (options) {
};

/**
 * Function to stop Stream audio and video tracks.
 * @method stopTracks
 * @param {JSON} [options] The options.
 * @param {Boolean} [options.audio=true] The flag if the Stream audio track should be stopped.
 * @param {Boolean} [options.audio=true] The flag if the Stream audio track should be stopped.
 * @return {Promise} The Promise for function request completion.
 * @example 
 *   stream.stopTracks().then(function (activeStatus) {
 *     console.log("Audio active ->", activeStatus.audio);
 *     console.log("Video active ->", activeStatus.video);
 *   }).catch(function (error, activeStatus) {
 *     console.error("Failed stopping tracks ->", error);
 *     console.error("Audio active (current) ->", activeStatus.audio);
 *     console.error("Video active (current) ->", activeStatus.video);
 *   });
 * @for Temasys.Stream
 * @since 0.7.0
 */
Stream.prototype.stopTracks = function (options) {
};