/**
 * Handles the native `RTCPeerConnection` object connection.
 * @class Temasys.Peer
 * @param {JSON} options The options.
 * @param {JSON} [options.constraints] @[exp] The native `RTCPeerConnection` object constraints settings.
 * @param {String} [options.constraints.iceTransportPolicy=ALL] The ICE transport policy for gathering ICE candidates.
 * - See {{#crossLink "Temasys.Peer/ICE_TRANSPORT_POLICY_ENUM:attribute"}}{{/crossLink}} for reference.
 * @param {String} [options.constraints.rtcpMuxPolicy=REQUIRE] The RTP and RTCP multiplex policy for gathering ICE candidates.
 * - See {{#crossLink "Temasys.Peer/RTCP_MUX_POLICY_ENUM:attribute"}}{{/crossLink}} for reference.
 * @param {String} [options.constraints.bundlePolicy=BALANCED] The bundle policy for gathering ICE candidates.
 * - See {{#crossLink "Temasys.Peer/BUNDLE_POLICY_ENUM:attribute"}}{{/crossLink}} for reference.
 * @param {Number} [options.constraints.iceCandidatePoolSize=0] The ICE candidate pool size to limit
 *   for gathering ICE candidates.
 * - Set it as `0` to remove limits.
 * @param {String|RTCCertificate} [options.constraints.certificate] The certificate algorithm to use for
 *   the ICE connection media streaming encryption.
 * - When provided as `String`, see {{#crossLink "Temasys.Peer/CERTIFICATE_ENUM:attribute"}}{{/crossLink}} for reference.
 * @param {JSON} [options.constraints.iceServers] The ICE servers settings.
 * @param {JSON|Boolean} [options.constraints.iceServers.turn] The TURN ICE servers settings.
 * - When provided as a `Boolean`, it determines if TURN ICE servers should be used.
 * @param {Boolean} [options.constraints.iceServers.turn.secure=false] The flag if TURN servers with TLS only should be used.
 * @param {String} [options.constraints.iceServers.turn.transport=AUTO] The TURN server transport to use.
 * - See {{#crossLink "Temasys.Peer/TURN_TRANSPORT_ENUM:attribute"}}{{/crossLink}} for reference.
 * @param {Array|String} [options.constraints.iceServers.turn.urls] The list of TURN servers urls to use.
 *  E.g. `("turn.temasys.io:3478", "turn.temasys.io:19305")` or `"turn.temasys.io"`
 * @param {JSON|Boolean} [options.constraints.iceServers.stun] The STUN ICE servers settings.
 * - When provided as a `Boolean`, it determines if STUN ICE servers should be used.
 * @param {Boolean} [options.constraints.iceServers.stun.public] The flag if public STUN ICE servers should be used.
 * @param {Array|String} [options.constraints.iceServers.stun.urls] The list of STUN servers urls to use.
 *  E.g. `("turn.temasys.io:3478", "turn.temasys.io:19305")` or `"turn.temasys.io"`
 * @param {JSON} [options.candidates] @[exp] The ICE candidates settings.
 * @param {Boolean} [options.candidates.host=true] The flag if "host" ICE candidates should be used.
 * @param {Boolean} [options.candidates.srflx=true] The flag if "srflx" ICE candidates should be used.
 * @param {Boolean} [options.candidates.relay=true] The flag if "relay" ICE candidates should be used.
 * @param {JSON} [options.codecs] @[exp] The codecs settings.
 * - This configures the Peer connection native `RTCSessionDescription` object string.
 * @param {JSON} [options.codecs.params] The media connection codecs parameters settings.
 * - When settings are not provided, the default browser configuration is used.
 * @param {JSON} [options.codecs.params.audio] The media connection audio codecs settings.
 * @param {JSON|String} [options.codecs.params.audio.opus] The media connection OPUS audio codec settings.
 * - When provided as a `String`, it sets as the full parameter settings. E.g. `minptime=1;stereo=1`
 * @param {Boolean} [options.codecs.params.audio.opus.stereo] The flag if OPUS audio codec stereo band
 *   should be configured for sending audio packets.
 * @param {Boolean} [options.codecs.params.audio.opus.usedtx] The flag if OPUS audio codec should enable
 *   DTX (Discontinuous Transmission) for sending audio packets. This might help to reduce bandwidth
 *   as it reduces the bitrate during silence or background noise, and goes hand-in-hand with the
 *   `options.media.audio.voiceActivityDetection` flag.
 * @param {Boolean} [options.codecs.params.audio.opus.useinbandfec] The flag if OPUS audio codec has the
 *   capability to take advantage of the in-band FEC (Forward Error Correction) when sending audio packets.
 *   This helps to reduce the harm of packet loss by encoding information about the previous packet loss.
 * @param {Number} [options.codecs.params.audio.opus.maxplaybackrate] The OPUS audio codec
 *   maximum output sampling rate in Hz (hertz) that is is capable of receiving audio packets,
 *   to adjust to the hardware limitations and ensure that any sending audio packets
 *   would not encode at a higher sampling rate specified by this.
 * - This value must be between `8000` to `48000`.
 * @param {Number} [options.codecs.params.audio.opus.minptime] The OPUS audio codec encoder
 *   minimum length of time in milleseconds should be encapsulated for a single audio data packet.
 * @param {JSON|String} [options.codecs.params.audio.telephoneEvent] The media connection DTMF audio codec settings.
 * - When provided as a `String`, it sets as the full parameter settings. E.g. `0-5`
 * @param {JSON|String} [options.codecs.params.audio.pcma] The media connection PCMA (G711a) audio codec settings.
 * - When provided as a `String`, it sets as the full parameter settings.
 * @param {JSON|String} [options.codecs.params.audio.pcmu] The media connection PCMU (G711u) audio codec settings.
 * - When provided as a `String`, it sets as the full parameter settings.
 * @param {JSON|String} [options.codecs.params.audio.g722] The media connection G722 audio codec settings.
 * - When provided as a `String`, it sets as the full parameter settings.
 * @param {JSON|String} [options.codecs.params.audio.isac] The media connection ISAC audio codec settings.
 * - When provided as a `String`, it sets as the full parameter settings.
 * @param {JSON|String} [options.codecs.params.audio.ilbc] The media connection iLBC audio codec settings.
 * - When provided as a `String`, it sets as the full parameter settings.
 * @param {JSON} [options.codecs.params.video] The media connection video codecs settings.
 * @param {JSON|String} [options.codecs.params.video.h264] The media connection H264 video codec settings.
 * - When provided as a `String`, it sets as the full parameter settings. E.g. `levelAsymmetryAllowed=1;packetizationMode=1`
 * @param {String} [options.codecs.params.video.h264.profileLevelId] The H264 video codec base16 encoded
 *   string which indicates the H264 baseline, main, or the extended profiles.
 * @param {Boolean} [options.codecs.params.video.h264.levelAsymmetryAllowed] The flag if H264 video codec
 *   encoder of video packets should be at a different level from decoder of video packets.
 * @param {Boolean} [options.codecs.params.video.h264.packetizationMode] The flag if H264 video codec
 *   packetization mode should be enabled where it splits video frames that are larger for a RTP packet into RTP packet chunks.
 * @param {JSON|String} [options.codecs.params.video.vp8] The media connection VP8 video codec settings.
 * - When provided as a `String`, it sets as the full parameter settings.
 * @param {Number} [options.codecs.params.video.vp8.maxFr] The maximum number of frames per second (fps) the
 *   VP8 video decoder is capable of decoding video packets.
 * @param {Number} [options.codecs.params.video.vp8.maxFs] The maximum number of frame size macroblocks
 *   that the VP8 video decoder is capable of decoding video packets.
 * - The value has to have the width and height of the frame in macroblocks less than the value of
 *   `parseInt(Math.sqrt(maxFs * 8))`. For example, if the value is `1200`, it is capable of the
 *   support of `640x480` frame width and height, which heights up to `1552px` (`97` macroblocks value.
 * @param {JSON|String} [options.codecs.params.video.vp9] The media connection VP9 video codec settings.
 * - When provided as a `String`, it sets as the full parameter settings.
 * @param {Number} [options.codecs.params.video.vp9.maxFr] The maximum number of frames per second (fps) the
 *   VP9 video decoder is capable of decoding video packets.
 * @param {Number} [options.codecs.params.video.vp9.maxFs] The maximum number of frame size macroblocks
 *   that the VP9 video decoder is capable of decoding video packets.
 * - The value has to have the width and height of the frame in macroblocks less than the value of
 *   `parseInt(Math.sqrt(maxFs * 8))`. For example, if the value is `1200`, it is capable of the
 *   support of `640x480` frame width and height, which heights up to `1552px` (`97` macroblocks value.
 * @param {JSON} [options.codecs.prefer] The media connection codec preference settings.
 * @param {String|JSON} [options.codecs.prefer.audio=AUTO] The preferred audio codec settings.
 * - When provided as a `String`, it is the preferred audio codec name.
 * - See {{#crossLink "Temasys.Peer/AUDIO_CODEC_ENUM:attribute"}}{{/crossLink}} for reference.
 * @param {String} options.codecs.prefer.audio.codec The preferred audio codec name.
 * - Note that value cannot be `AUDIO_CODEC_ENUM.AUTO`.
 * - See {{#crossLink "Temasys.Peer/AUDIO_CODEC_ENUM:attribute"}}{{/crossLink}} for reference.
 * @param {Number} [options.codecs.prefer.audio.codec.samplingRate] The preferred audio codec sampling rate
 *   if available for the preferred audio codec name.
 * @param {Number} [options.codecs.prefer.audio.codec.channels] The preferred audio codec channels
 *   if available for the preferred audio codec name.
 * @param {String|JSON} [options.codecs.prefer.video=AUTO] The preferred audio codec settings.
 * - When provided as a `String`, it is the preferred video codec name.
 * - See {{#crossLink "Temasys.Peer/VIDEO_CODEC_ENUM:attribute"}}{{/crossLink}} for reference.
 * @param {String} options.codecs.prefer.video.codec The preferred video codec name.
 * - Note that value cannot be `VIDEO_CODEC_ENUM.AUTO`.
 * - See {{#crossLink "Temasys.Peer/VIDEO_CODEC_ENUM:attribute"}}{{/crossLink}} for reference.
 * @param {Number} [options.codecs.prefer.video.codec.samplingRate] The preferred video codec sampling rate
 *   if available for the preferred video codec name.
 * @param {JSON} [options.codecs.mechanism] The codecs RTCP or FECs settings.
 * @param {Boolean} [options.codecs.mechanism.ulpfec=true] The flag to enable ULPFEC codec
 *   (generic forward error correction) mechanism when available.
 * @param {Boolean} [options.codecs.mechanism.red=true] The flag to enable RED codec
 *   (generic forward error correction) mechanism when available.
 * @param {Boolean} [options.codecs.mechanism.rtx=true] The flag to enable RTX (re-transmission) mechanism when available.
 * @param {Boolean} [options.codecs.mechanism.remb=true] The flag to enable REMB
 *   (receiver estimated maximum bitrate) mechanism when available.
 * @param {Boolean} [options.codecs.mechanism.nack=true] The flag to enable NACK
 *   (negative acknowledgement) mechanism when available.
 * @param {Boolean} [options.codecs.mechanism.ccm=true] The flag to enable CCM
 *   (codec control messages) mechanism when available.
 * @param {Boolean} [options.codecs.mechanism.transportcc=true] The flag to enable transport-cc
 *   (transport-wide congestion control) mechanism when available.
 * @param {JSON} [options.media] The Peer connection media connection settings.
 * - This configures the Peer connection native `RTCSessionDescription` object string.
 * @param {JSON|Boolean} [options.media.audio] The media audio streaming settings.
 * - When provided as `false`, this disables the audio streaming connection entirely. 
 * @param {Boolean} [options.media.audio.send=true] The flag if audio packets should be sent to Peer connection.
 * - When provided as `false`, this prevents sending audio packets to Peer despite audio tracks being added.
 * @param {Boolean} [options.media.audio.receive=true] The flag if audio packets should be sent to Peer connection.
 * - When provided as `false`, this prevents receiving audio packets from Peer despite audio tracks being added remotely.
 * @param {Boolean} [options.media.audio.voiceActivityDetection=true] The flag if voice activity detection
 *   (VAD) should be enabled.
 * @param {Boolean} [options.media.audio.dtmf=false] The flag if DTMF should be created if supported.
 * @param {Number} [options.media.audio.maxBandwidth=20] The maximum range limit of sending audio bandwidth in kbps.
 * - The bandwidth might be lower or higher by a few kbps than the specified range at times.
 * - Set it as `0` to remove limits.
 * @param {JSON|Boolean} [options.media.video] The media video streaming settings.
 * - When provided as `false`, this disables the video streaming connection entirely. 
 * @param {Boolean} [options.media.video.send=true] The flag if video packets should be sent to Peer connection.
 * - When provided as `false`, this prevents sending video packets to Peer despite video tracks being added.
 * @param {Boolean} [options.media.video.receive=true] The flag if video packets should be sent to Peer connection.
 * - When provided as `false`, this prevents receiving video packets from Peer despite video tracks being added remotely.
 * @param {Number} [options.media.video.maxBandwidth=512] The maximum range limit of sending video bandwidth in kbps.
 * - The bandwidth might be lower or higher by a few kbps than the specified range at times.
 * - Set it as `0` to remove limits.
 * @param {JSON} [options.media.video.xGoogleBandwidth] @[exp] The bitrate configuration for video codec bandwidth.
 * - When settings are not provided, the default browser configuration is used.
 * @param {Number} [options.media.video.xGoogleBandwidth.min] The `"x-google-min-bitrate"` configuration.
 * @param {Number} [options.media.video.xGoogleBandwidth.max] The `"x-google-max-bitrate"` configuration.
 * @param {JSON|Boolean} [options.media.datachannel=true] The media datachannel connection settings.
 * - When provided as `false`, this disables the datachannel connection entirely. 
 * @param {Number} [options.media.datachannel.maxBandwidth=30] The maximum range limit of sending datachannel bandwidth in kbps.
 * - The bandwidth might be lower or higher by a few kbps than the specified range at times.
 * - Set it as `0` to remove limits.
 * @param {Number} [options.trickleICE=true] The flag if trickle ICE handshake should be enabled.
 * @constructor
 * @private
 * @for Temasys
 * @since 0.7.0
 */
function Peer (options, defaultOptions) {
  /**
   * The Peer ID.
   * @attribute id
   * @type String
   * @readOnly
   * @for Temasys.Peer
   * @since 0.7.0
   */
  this.id = null;

  /**
   * The Peer parent ID.
   * @attribute parentId
   * @type String
   * @readOnly
   * @for Temasys.Peer
   * @since 0.7.0
   */
  this.parentId = null;

  /**
   * The Peer connection type.
   * - See {{#crossLink "Temasys.Peer/TYPE_ENUM:attribute"}}{{/crossLink}} for reference.
   * @attribute type
   * @type String
   * @readOnly
   * @for Temasys.Peer
   * @since 0.7.0
   */
  this.type = null;

  /**
   * The Peer custom data.
   * @attribute data
   * @type Any
   * @readOnly
   * @for Temasys.Peer
   * @since 0.7.0
   */
  this.data = null;

  /**
   * The Peer client agent.
   * @attribute agent
   * @param {String} name The client agent name.
   * @param {String} version The client agent version.
   * @param {String} [platform] The client agent platform when available.
   * @param {String} [pluginVersion] The client WebRTC plugin version when available.
   * @type JSON
   * @readOnly
   * @for Temasys.Peer
   * @since 0.7.0
   */
  this.agent = {
    name: '',
    version: '',
    platform: '',
    pluginVersion: ''
  };

  /**
   * The Peer protocol versions.
   * @attribute protocol
   * @param {String} DTProtocolVersion The DT protocol version.
   * @param {String} SMProtocolVersion The SM protocol version.
   * @type JSON
   * @readOnly
   * @for Temasys.Peer
   * @since 0.7.0
   */
  this.protocol = {
    DTProtocolVersion: '',
    SMProtocolVersion: ''
  };

  /**
   * The Peer session settings.
   * @attribute session
   * @param {Boolean} publishOnly The flag if Peer is sending Stream only and not receiving.
   * @param {Boolean} receiveOnly The flag if Peer is receiving Stream only and not sending.
   * @param {Boolean} datachannel The flag if Peer chooses to have Datachannel connection enabled.
   * @param {Boolean} trickleICE The flag if Peer chooses to have trickle ICE handshake.
   * @param {Boolean} iceRestart The flag if Peer has ICE restart capability.
   * @param {Number} weight The Peer weight to determine if Peer should be start offer first
   *   or not depending on whose weight is higher.
   * @type JSON
   * @readOnly
   * @for Temasys.Peer
   * @since 0.7.0
   */
  this.session = {
    publishOnly: false,
    receiveOnly: false,
    datachannel: true,
    trickleICE: true,
    iceRestart: !(window.webrtcDetectedBrowser === 'firefox' && window.webrtcDetectedVersion < 48),
    weight: 0
  };

  /**
   * The Peer current states.
   * @attribute $current
   * @param {String} handshakeState The Peer handshake state.
   * @param {String} iceConnectionState The Peer ICE connection state.
   * @param {String} iceGatheringState The Peer ICE gathering state.
   * @param {String} signalingState The Peer signaling state.
   * @param {JSON} candidates The Peer ICE candidates states.
   * @param {JSON} candidates.local The local ICE candidates sending states.
   * - `"index"` can be identified as the local ICE candidate ID, which value is the state of the ICE candidate.
   * @param {String} candidates.local.index The local ICE candidate sending state.
   * @param {JSON} candidates.remote The remote ICE candidates processing states.
   * - `"index"` can be identified as the remote ICE candidate ID, which value is the state of the ICE candidate.
   * @param {String} candidates.remote.index The local ICE candidate processing state.
   * @param {Boolean} connected The flag if Peer ICE is connected.
   * @type JSON
   * @readOnly
   * @for Temasys.Peer
   * @since 0.7.0
   */
  this.$current = {
    handshakeState: null,
    iceConnectionState: null,
    iceGatheringState: null,
    signalingState: null,
    candidates: { remote: {}, local: {} },
    connected: false
  };

  /**
   * Event triggered when Peer handshake state has changed.
   * @event handshakeStateChange
   * @param {String} state The current handshake state.
   * - See {{#crossLink "Temasys.Peer/HANDSHAKE_STATE_ENUM:attribute"}}{{/crossLink}} for reference.
   * @param {JSON} [error] The error.
   * - This is defined when `state` is `ERROR`.
   * @param {Error} [error.error] The error object.
   * @param {String} [error.type] The error type.
   * - See {{#crossLink "Temasys.Peer/HANDSHAKE_ERROR_TYPE_ENUM:attribute"}}{{/crossLink}} for reference.
   * @for Temasys.Peer
   * @since 0.7.0
   */
  /**
   * Event triggered when Peer signaling state has changed.
   * @event signalingStateChange
   * @param {String} state The current signaling state.
   * - See {{#crossLink "Temasys.Peer/SIGNALING_STATE_ENUM:attribute"}}{{/crossLink}} for reference.
   * @for Temasys.Peer
   * @since 0.7.0
   */
  /**
   * Event triggered when Peer ICE connection state has changed.
   * @event iceConnectionStateChange
   * @param {String} state The current ICE connection state.
   * - See {{#crossLink "Temasys.Peer/ICE_CONNECTION_STATE_ENUM:attribute"}}{{/crossLink}} for reference.
   * @for Temasys.Peer
   * @since 0.7.0
   */
  /**
   * Event triggered when Peer ICE gathering state has changed.
   * @event iceGatheringStateChange
   * @param {String} state The current ICE gathering state.
   * - See {{#crossLink "Temasys.Peer/ICE_GATHERING_STATE_ENUM:attribute"}}{{/crossLink}} for reference.
   * @for Temasys.Peer
   * @since 0.7.0
   */
  /**
   * Event triggered when Peer local ICE candidate sending state has changed.
   * @event candidateSentStateChange
   * @param {String} state The current local ICE candidate sending state.
   * - See {{#crossLink "Temasys.Peer/CANDIDATE_SENT_STATE_ENUM:attribute"}}{{/crossLink}} for reference.
   * @param {String} candidateId The local ICE candidate ID.
   * @for Temasys.Peer
   * @since 0.7.0
   */
  /**
   * Event triggered when Peer remote ICE candidate processing state has changed.
   * @event candidateProcessingStateChange
   * @param {String} state The current remote ICE candidate processing state.
   * - See {{#crossLink "Temasys.Peer/CANDIDATE_PROCESSING_STATE_ENUM:attribute"}}{{/crossLink}} for reference.
   * @param {String} candidateId The remote ICE candidate ID.
   * @param {Error} [error] The error object.
   * - This is defined when `state` is `FAILED`.
   * @for Temasys.Peer
   * @since 0.7.0
   */
  /**
   * Event triggered when {{#crossLink "Temasys.Peer/getStats:method"}}{{/crossLink}} state has changed.
   * @event getStatsStateChange
   * @param {String} state The current stats retrieval state.
   * - See {{#crossLink "Temasys.Peer/GET_STATS_STATE_ENUM:attribute"}}{{/crossLink}} for reference.
   * @param {JSON} [stats] The stats.
   * - This is defined when `state` is `SUCCESS`.
   * - The below `stats` parameters will not be the same if `isRaw` parameter is set to `true` in the 
   * @param {JSON} stats.audio The Peer connection audio stats.
   * @param {JSON} stats.audio.sent The audio stats sent.
   * @param {JSON} stats.audio.sent.bytes The audio bytes sent information.
   * @param {Number} stats.audio.sent.bytes.current The current audio bytes sent.
   * @param {Number} stats.audio.sent.bytes.total The total audio bytes sent.
   * @param {JSON} stats.audio.sent.packets The audio packets sent information.
   * @param {Number} stats.audio.sent.packets.current The current audio packets sent.
   * @param {Number} stats.audio.sent.packets.total The total audio packets sent.
   * @param {JSON} stats.audio.sent.nackCount The audio nacks sent.
   * @param {Number} [stats.audio.sent.nackCount.current] The current audio nacks sent.
   * @param {Number} [stats.audio.sent.nackCount.total] The total audio nacks sent.
   * @param {String} stats.audio.sent.ssrc The audio sending direction RTP packets synchronization source (SSRC) ID.
   * @param {JSON} stats.audio.sent.rtt The audio sending direction round-trip time (RTT) taken.
   * @param {Number} [stats.audio.sent.rtt.current] The current audio sending direction RTT in seconds.
   * @param {JSON} stats.audio.sent.codec The selected audio sending direction codec information.
   * @param {String} stats.audio.sent.codec.name The audio sending direction codec name.
   * @param {String} stats.audio.sent.codec.payloadType The audio sending direction codec payload number.
   * @param {String} [stats.audio.sent.codec.implementation] The audio sending direction codec implementation.
   * @param {Number} stats.audio.sent.codec.channels The audio sending direction codec channels.
   * @param {Number} stats.audio.sent.codec.clockRate The audio sending direction codec sampling rate in hertz (Hz).
   * @param {String} stats.audio.sent.codec.params The audio sending direction codec parameters.
   * @param {Number} [stats.audio.sent.level] The current audio sending stream input level.
   * @param {Number} [stats.audio.sent.echoReturnLoss] The current audio sending stream echo return loss in decibels (db).
   * @param {Number} [stats.audio.sent.echoReturnLossEnhancement] The current audio sending stream echo return loss
   *   enhancement in decibels (db).
   * @param {JSON} stats.audio.received The audio stats received.
   * @param {JSON} stats.audio.received.bytes The audio bytes received information.
   * @param {Number} stats.audio.received.bytes.current The current audio bytes received.
   * @param {Number} stats.audio.received.bytes.total The total audio bytes received.
   * @param {JSON} stats.audio.received.packets The audio packets received information.
   * @param {Number} stats.audio.received.packets.current The current audio packets received.
   * @param {Number} stats.audio.received.packets.total The total audio packets received.
   * @param {JSON} stats.audio.received.packetsLost The audio packets lost information.
   * @param {Number} [stats.audio.received.packetsLost.current] The current audio packets lost.
   * @param {Number} [stats.audio.received.packetsLost.total] The total audio packets lost.
   * @param {JSON} stats.audio.received.packetsDiscarded The audio packets discarded information.
   * @param {Number} [stats.audio.received.packetsDiscarded.current] The current audio packets discarded.
   * @param {Number} [stats.audio.received.packetsDiscarded.total] The total audio packets discarded.
   * @param {JSON} stats.audio.received.packetsRepaired The audio packets repaired information.
   * @param {Number} [stats.audio.received.packetsRepaired.current] The current audio packets repaired.
   * @param {Number} [stats.audio.received.packetsRepaired.total] The total audio packets repaired.
   * @param {JSON} stats.audio.received.fractionLost The audio packets fraction loss information.
   * @param {Number} [stats.audio.received.fractionLost.current] The current audio packets fraction loss.
   * @param {JSON} stats.audio.received.jitter The audio packets jitter information.
   * @param {Number} [stats.audio.received.jitter.current] The current audio packets jitter in seconds.
   * @param {Number} [stats.audio.received.jitter.currentMs] The current audio packets jitter in miliseconds.
   * @param {JSON} stats.audio.received.nackCount The audio nacks received.
   * @param {Number} [stats.audio.received.nackCount.current] The current audio nacks received.
   * @param {Number} [stats.audio.received.nackCount.total] The total audio nacks received.
   * @param {String} stats.audio.received.ssrc The audio receiving direction RTP packets synchronization source (SSRC) ID.
   * @param {JSON} [stats.audio.received.codec] The selected audio receiving direction codec information.
   * @param {String} [stats.audio.received.codec.name] The audio receiving direction codec name.
   * @param {String} [stats.audio.received.codec.payloadType] The audio receiving direction codec payload number.
   * @param {String} [stats.audio.received.codec.implementation] The audio receiving direction codec implementation.
   * @param {Number} [stats.audio.received.codec.channels] The audio receiving direction codec channels.
   * @param {Number} [stats.audio.received.codec.clockRate] The audio receiving direction codec sampling rate in hertz (Hz).
   * @param {String} [stats.audio.received.codec.params] The audio receiving direction codec parameters.
   * @param {Number} [stats.audio.received.level] The current audio receiving stream output level.
   * @param {JSON} stats.video The Peer connection video stats.
   * @param {JSON} stats.video.sent The video stats sent.
   * @param {JSON} stats.video.sent.bytes The video bytes sent information.
   * @param {Number} stats.video.sent.bytes.current The current video bytes sent.
   * @param {Number} stats.video.sent.bytes.total The total video bytes sent.
   * @param {JSON} stats.video.sent.packets The video packets sent information.
   * @param {Number} stats.video.sent.packets.current The current video packets sent.
   * @param {Number} stats.video.sent.packets.total The total video packets sent.
   * @param {String} stats.video.sent.ssrc The video sending direction RTP packets synchronization source (SSRC) ID.
   * @param {JSON} stats.video.sent.rtt The video sending direction round-trip time (RTT) taken.
   * @param {Number} [stats.video.sent.rtt.current] The current video sending direction RTT in seconds.
   * @param {JSON} stats.video.sent.nackCount The video nacks sent.
   * @param {Number} [stats.video.sent.nackCount.current] The current video nacks sent.
   * @param {Number} [stats.video.sent.nackCount.total] The total video nacks sent.
   * @param {JSON} stats.video.sent.sliCount The video slis sent.
   * @param {Number} [stats.video.sent.sliCount.current] The current video slis sent.
   * @param {Number} [stats.video.sent.sliCount.total] The total video slis sent.
   * @param {JSON} stats.video.sent.pliCount The video plis sent.
   * @param {Number} [stats.video.sent.pliCount.current] The current video plis sent.
   * @param {Number} [stats.video.sent.pliCount.total] The total video plis sent.
   * @param {JSON} stats.video.sent.firCount The video firs sent.
   * @param {Number} [stats.video.sent.firCount.current] The current video firs sent.
   * @param {Number} [stats.video.sent.firCount.total] The total video firs sent.
   * @param {JSON} stats.video.sent.codec The selected video sending direction codec information.
   * @param {String} stats.video.sent.codec.name The selected video sending direction codec name.
   * @param {String} stats.video.sent.codec.payloadType The selected video sending direction codec payload number.
   * @param {String} [stats.video.sent.codec.implementation] The selected video sending direction codec implementation.
   * @param {Number} stats.video.sent.codec.clockRate The selected video sending direction
   *   codec sampling rate in hertz (Hz).
   * @param {String} stats.video.sent.codec.params The selected video sending direction codec parameters.
   * @param {JSON} stats.video.sent.frames The video frames sent information.
   * @param {Number} [stats.video.sent.frames.current] The current number of video frames sent.
   * @param {Number} [stats.video.sent.frames.total] The total number of video frames sent.
   * @param {JSON} stats.video.sent.frameRate The video frames per second (fps) sent information.
   * @param {Number} [stats.video.sent.frameRate.current] The current video frames per second (fps) sent.
   * @param {Number} [stats.video.sent.frameRate.mean] The current mean of the current video frames per second (fps) sent.
   * @param {Number} [stats.video.sent.frameRate.stdDev] The current standard deviation
   *   of the current video frames per second (fps) sent.
   * @param {Number} [stats.video.sent.frameRate.input] The current sending video stream frames per second (fps) input.
   * @param {JSON} stats.video.sent.framesDropped The video frames dropped information.
   * @param {Number} [stats.video.sent.framesDropped.current] The current number of video frames dropped.
   * @param {Number} [stats.video.sent.framesDropped.total] The total number of video frames dropped.
   * @param {JSON} stats.video.sent.framesCorrupted The video frames corrupted information.
   * @param {Number} [stats.video.sent.framesCorrupted.current] The current number of video frames corrupted.
   * @param {Number} [stats.video.sent.framesCorrupted.total] The total number of video frames corrupted.
   * @param {JSON} stats.video.sent.framesEncoded The video frames encoded information.
   * @param {Number} [stats.video.sent.framesEncoded.current] The current number of video frames encoded.
   * @param {Number} [stats.video.sent.framesEncoded.total] The total number of video frames encoded.
   * @param {JSON} stats.video.sent.frameSize The current video frame size sent information.
   * @param {Number} [stats.video.sent.frameSize.width] The current video frame width in pixels (px) sent.
   * @param {Number} [stats.video.sent.frameSize.height] The current video frame height in pixels (px) sent.
   * @param {Number} [stats.video.sent.qpSum] The sum of the QP values of frames passed.
   * @param {JSON} stats.video.received The video stats received.
   * @param {JSON} stats.video.received.bytes The video bytes received information.
   * @param {Number} stats.video.received.bytes.current The current video bytes received.
   * @param {Number} stats.video.received.bytes.total The total video bytes received.
   * @param {JSON} stats.video.received.packets The video packets received information.
   * @param {Number} stats.video.received.packets.current The current video packets received.
   * @param {Number} stats.video.received.packets.total The total video packets received.
   * @param {String} stats.video.received.ssrc The video sending direction RTP packets synchronization source (SSRC) ID.
   * @param {JSON} stats.video.received.jitter The video packets jitter information.
   * @param {Number} [stats.video.received.jitter.current] The current video packets jitter in seconds.
   * @param {Number} [stats.video.received.jitter.currentMs] The current video packets jitter in miliseconds.
   * @param {JSON} stats.video.received.nackCount The video nacks received.
   * @param {Number} [stats.video.received.nackCount.current] The current video nacks received.
   * @param {Number} [stats.video.received.nackCount.total] The total video nacks received.
   * @param {JSON} stats.video.received.sliCount The video slis received.
   * @param {Number} [stats.video.received.sliCount.current] The current video slis received.
   * @param {Number} [stats.video.received.sliCount.total] The total video slis received.
   * @param {JSON} stats.video.received.pliCount The video plis received.
   * @param {Number} [stats.video.received.pliCount.current] The current video plis received.
   * @param {Number} [stats.video.received.pliCount.total] The total video plis received.
   * @param {JSON} stats.video.received.firCount The video firs received.
   * @param {Number} [stats.video.received.firCount.current] The current video firs received.
   * @param {Number} [stats.video.received.firCount.total] The total video firs received.
   * @param {JSON} stats.video.received.codec The selected video sending direction codec information.
   * @param {String} [stats.video.received.codec.name] The selected video sending direction codec name.
   * @param {String} [stats.video.received.codec.payloadType] The selected video sending direction codec payload number.
   * @param {String} [stats.video.received.codec.implementation] The selected video sending direction codec implementation.
   * @param {Number} [stats.video.received.codec.clockRate] The selected video sending direction
   *   codec sampling rate in hertz (Hz).
   * @param {String} [stats.video.received.codec.params] The selected video sending direction codec parameters.
   * @param {JSON} stats.video.received.frames The video frames received information.
   * @param {Number} [stats.video.received.frames.current] The current number of video frames received.
   * @param {Number} [stats.video.received.frames.total] The total number of video frames received.
   * @param {JSON} stats.video.received.frameRate The video frames per second (fps) received information.
   * @param {Number} [stats.video.received.frameRate.current] The current video frames per second (fps) received.
   * @param {Number} [stats.video.received.frameRate.mean] The current mean of the current video frames per second (fps) received.
   * @param {Number} [stats.video.received.frameRate.stdDev] The current standard deviation
   *   of the current video frames per second (fps) received.
   * @param {Number} [stats.video.received.frameRate.output] The current sending video stream frames per second (fps) output.
   * @param {JSON} stats.video.received.framesDropped The video frames dropped information.
   * @param {Number} [stats.video.received.framesDropped.current] The current number of video frames dropped.
   * @param {Number} [stats.video.received.framesDropped.total] The total number of video frames dropped.
   * @param {JSON} stats.video.received.framesCorrupted The video frames corrupted information.
   * @param {Number} [stats.video.received.framesCorrupted.current] The current number of video frames corrupted.
   * @param {Number} [stats.video.received.framesCorrupted.total] The total number of video frames corrupted.
   * @param {JSON} stats.video.received.framesEncoded The video frames decoded information.
   * @param {Number} [stats.video.received.framesDecoded.current] The current number of video frames decoded.
   * @param {Number} [stats.video.received.framesDecoded.total] The total number of video frames decoded.
   * @param {JSON} stats.video.received.frameSize The current video frame size received information.
   * @param {Number} [stats.video.received.frameSize.width] The current video frame width in pixels (px) received.
   * @param {Number} [stats.video.received.frameSize.height] The current video frame height in pixels (px) received.
   * @param {Number} [stats.video.received.e2eDelay] The current video e2e delay.
   * - This requires a {{#crossLink "Stream"}}{{/crossLink}} attached to a video element.
   * @param {JSON} stats.candidates The Peer connection ICE candidates information.
   * @param {Array} stats.candidates.local The array of local ICE candidates stats information.
   * - `"index"` can be identified as the index item of each local ICE candidate stats object.
   * @param {String} [stats.candidates.local.index] The local ICE candidate stats.
   * @param {String} [stats.candidates.local.index.ip] The local ICE candidate IP address.
   * @param {Number} [stats.candidates.local.index.port] The local ICE candidate port.
   * @param {String} [stats.candidates.local.index.protocol] The local ICE candidate protocol.
   * @param {String} [stats.candidates.local.index.turnProtocol] The local ICE candidate protocol used to
   *   communicate with TURN server.
   * @param {String} [stats.candidates.local.index.candidateType] The local ICE candidate type.
   * - Available values are: `"host"` (local network area), `"srflx"` (STUN) and `"relay"` (TURN)
   * @param {Number} [stats.candidates.local.index.priority] The local ICE candidate priority.
   * @param {Number} [stats.candidates.local.index.selected] The flag if the local ICE candidate is selected.
   * @param {Array} stats.candidates.remote The array of remote ICE candidates stats information.
   * - `"index"` can be identified as the index item of each remote ICE candidate stats object.
   * @param {String} [stats.candidates.remote.index] The remote ICE candidate stats.
   * @param {String} [stats.candidates.remote.index.ip] The remote ICE candidate IP address.
   * @param {Number} [stats.candidates.remote.index.port] The remote ICE candidate port.
   * @param {String} [stats.candidates.remote.index.protocol] The remote ICE candidate protocol.
   * @param {String} [stats.candidates.remote.index.turnProtocol] The remote ICE candidate protocol used to
   *   communicate with TURN server.
   * @param {String} [stats.candidates.remote.index.candidateType] The remote ICE candidate type.
   * - Available values are: `"host"` (local network area), `"srflx"` (STUN) and `"relay"` (TURN)
   * @param {Number} [stats.candidates.remote.index.priority] The remote ICE candidate priority.
   * @param {Number} [stats.candidates.remote.index.selected] The flag if the remote ICE candidate is selected.
   * @param {Boolean} [stats.candidates.writable] The flag if Peer has gotten ACK to an ICE request.
   * @param {Boolean} [stats.candidates.readable] The flag if Peer has gotten a valid incoming ICE request.
   * @param {JSON} stats.candidates.rtt The current STUN connectivity checks round-trip delay (RTT) information.
   * @param {Number} [stats.candidates.current] The current rtt in seconds.
   * @param {Number} [stats.candidates.total] The total rtt in seconds.
   * @param {JSON} stats.candidates.requests The ICE connectivity check requests.
   * @param {JSON} stats.candidates.requests.received The ICE connectivity check requests received.
   * @param {Number} [stats.candidates.requests.received.current] The current number of
   *   ICE connectivity check requests received.
   * @param {Number} [stats.candidates.requests.received.total] The total number of
   *   ICE connectivity check requests received.
   * @param {JSON} stats.candidates.requests.sent The ICE connectivity check requests sent.
   * @param {Number} [stats.candidates.requests.sent.current] The current number of
   *   ICE connectivity check requests sent.
   * @param {Number} [stats.candidates.requests.sent.total] The total number of
   *   ICE connectivity check requests sent.
   * @param {JSON} stats.candidates.responses The ICE connectivity check responses.
   * @param {JSON} stats.candidates.responses.received The ICE connectivity check responses received.
   * @param {Number} [stats.candidates.responses.received.current] The current number of
   *   ICE connectivity check responses received.
   * @param {Number} [stats.candidates.responses.received.total] The total number of
   *   ICE connectivity check responses received.
   * @param {JSON} stats.candidates.responses.sent The ICE connectivity check responses sent.
   * @param {Number} [stats.candidates.responses.sent.current] The current number of
   *   ICE connectivity check responses sent.
   * @param {Number} [stats.candidates.responses.sent.total] The total number of
   *   ICE connectivity check responses sent.
   * @param {JSON} stats.candidates.consentRequests The ICE connectivity consent requests.
   * @param {JSON} stats.candidates.consentRequests.received The ICE connectivity check consent requests received.
   * @param {Number} [stats.candidates.consentRequests.received.current] The current number of
   *   ICE connectivity consent requests received.
   * @param {Number} [stats.candidates.consentRequests.received.total] The total number of
   *   ICE connectivity consent requests received.
   * @param {JSON} stats.candidates.consentRequests.sent The ICE connectivity consent requests sent.
   * @param {Number} [stats.candidates.consentRequests.sent.current] The current number of
   *   ICE connectivity consent requests sent.
   * @param {Number} [stats.candidates.consentRequests.sent.total] The total number of
   *   ICE connectivity consent requests sent.
   * @param {JSON} stats.candidates.consentResponses The ICE connectivity consent responses.
   * @param {JSON} stats.candidates.consentResponses.received The ICE connectivity check consent responses received.
   * @param {Number} [stats.candidates.consentResponses.received.current] The current number of
   *   ICE connectivity consent responses received.
   * @param {Number} [stats.candidates.consentResponses.received.total] The total number of
   *   ICE connectivity consent responses received.
   * @param {JSON} stats.candidates.consentResponses.sent The ICE connectivity consent responses sent.
   * @param {Number} [stats.candidates.consentResponses.sent.current] The current number of
   *   ICE connectivity consent responses sent.
   * @param {Number} [stats.candidates.consentResponses.sent.total] The total number of
   *   ICE connectivity consent responses sent.
   * @param {JSON} stats.certificate The Peer connection DTLS/SRTP exchanged certificates information.
   * @param {JSON} stats.certificate.local The local certificate information.
   * @param {String} [stats.certificate.local.fingerprint] The local certificate fingerprint.
   * @param {String} [stats.certificate.local.fingerprintAlgorithm] The local certificate fingerprint algorithm.
   * @param {String} [stats.certificate.local.derBase64] The local
   *   base64 certificate in binary DER format encoded in base64.
   * @param {JSON} stats.certificate.remote The remote certificate information.
   * @param {String} [stats.certificate.remote.fingerprint] The remote certificate fingerprint.
   * @param {String} [stats.certificate.remote.fingerprintAlgorithm] The remote certificate fingerprint algorithm.
   * @param {String} [stats.certificate.remote.derBase64] The remote
   *   base64 certificate in binary DER format encoded in base64.
   * @param {String} [stats.certificate.srtpCipher] The certificates SRTP cipher.
   * @param {String} [stats.certificate.dtlsCipher] The certificates DTLS cipher.
   * @param {Error} [error] The error object.
   * - This is defined when `state` is `FAILED`.
   * @for Temasys.Peer
   * @since 0.7.0
   */
  /**
   * Event triggered when sending or receiving Stream object.
   * @event stream
   * @param {Temasys.Stream} stream The Stream object.
   * @param {String} streamId The Stream ID.
   * @param {Boolean} isSelf The flag if Stream object is sent from self.
   * @for Temasys.Peer
   * @since 0.7.0
   */
  /**
   * Event triggered when receiving Datachannel object.
   * @event datachannel
   * @param {Temasys.Datachannel} channel The Datachannel object.
   * @param {String} channelId The Datachannel ID.
   * @param {Boolean} isSelf The flag if Datachannel object has started from self.
   * @for Temasys.Peer
   * @since 0.7.0
   */
  /**
   * Event triggered when sending or receiving message.
   * @event message
   * @param {Any} message The message.
   * @param {Boolean} isPrivate The flag if message sent is targeted or not.
   * @param {Boolean} isDatachannel The flag if message is sent from Datachannel connections.
   * @param {Boolean} isSelf The flag if sent from self.
   * @for Temasys.Peer
   * @since 0.7.0
   */
  /**
   * Event triggered when sending or receiving data transfers.
   * @event transfer
   * @param {Temasys.Datatransfer} transfer The data transfer object.
   * @param {String} transferId The data transfer ID.
   * @param {Boolean} isSelf The flag if transfer started from self.
   * @for Temasys.Peer
   * @since 0.7.0
   */
  /**
   * Event triggered when there are exceptions thrown in this event handlers.
   * @event domError
   * @param {Error} error The error object.
   * @for Temasys.Peer
   * @since 0.7.0
   */
}

/**
 * The enum of ICE transport policies.
 * @attribute ICE_TRANSPORT_POLICY_ENUM
 * @param {String} ALL The policy to gathering all types ("host", "srflx", "relay") of ICE candidates.
 * @param {String} RELAY The policy to gathering only "relay" ICE candidates.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.ICE_TRANSPORT_POLICY_ENUM = {
  ALL: 'all',
  RELAY: 'relay'
};

/**
 * The enum of RTP and RTCP multiplex policies.
 * @attribute RTCP_MUX_POLICY_ENUM
 * @param {String} NEGOTIATE The policy to gather ICE candidates for both RTP and RTCP.
 * @param {String} REQUIRE The policy to gather ICE candidates for only RTP, which RTCP would share.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.RTCP_MUX_POLICY_ENUM = {
  NEGOTIATE: 'negotiate',
  REQUIRE: 'require'
};

/**
 * The enum of media bundle policies.
 * @attribute BUNDLE_POLICY_ENUM
 * @param {String} BALANCED The policy to switch to `MAX_COMPAT` or `MAX_BUNDLE` depending on remote Peer supports.
 * @param {String} MAX_COMPAT The policy to gather ICE candidates for each media type and media streams will flow in
 *   each individual ICE candidate connections.
 * @param {String} MAX_BUNDLE The policy to gather ICE candidates for one media type and media streams will flow in
 *   one ICE candidate connection.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.BUNDLE_POLICY_ENUM = {
  BALANCED: 'balanced',
  MAX_COMPAT: 'max-compat',
  MAX_BUNDLE: 'max-bundle'
};

/**
 * The enum of certificate algorithms.
 * @attribute CERTIFICATE_ENUM
 * @param {String} RSA The option to generate certificate with RSA-1024 algorithm.
 * @param {String} ECDSA The option to generate certificate with ECDSA algorithm.
 * @param {String} AUTO The option to use browser specified algorithm.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.CERTIFICATE_ENUM = {
  RSA: 'RSA',
  ECDSA: 'ECDSA',
  AUTO: 'auto'
};

/**
 * The enum of TURN transport types.
 * @attribute TURN_TRANSPORT_ENUM
 * @param {String} UDP The option to use UDP transport type.
 * @param {String} TCP The option to use TCP transport type.
 * @param {String} AUTO The option to use default transport type.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.TURN_TRANSPORT_ENUM = {
  UDP: 'udp',
  TCP: 'tcp',
  AUTO: 'auto'
};

/**
 * The enum of audio codecs.
 * @attribute AUDIO_CODEC_ENUM
 * @param {String} OPUS The option to prefer OPUS audio codec.
 * @param {String} ISAC The option to prefer ISAC audio codec.
 * @param {String} ILBC The option to prefer iLBC audio codec.
 * @param {String} G722 The option to prefer the G722 audio codec.
 * @param {String} PCMA The option to prefer the G711u audio codec.
 * @param {String} PCMU The option to prefer the G711a audio codec.
 * @param {String} AUTO The option to use browser specified audio codec.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.AUDIO_CODEC_ENUM = {
  ISAC: 'ISAC',
  OPUS: 'opus',
  ILBC: 'ILBC',
  G722: 'G722',
  PCMU: 'PCMU',
  PCMA: 'PCMA',
  AUTO: 'auto'
  //SILK: 'SILK'
};

/**
 * The enum of video codecs.
 * @attribute VIDEO_CODEC_ENUM
 * @param {String} VP8 The option to prefer the VP8 video codec.
 * @param {String} VP9 The option to prefer the VP9 video codec.
 * @param {String} H264 The option to prefer the H264 video codec.
 * @param {String} AUTO The option to use browser specified audio codec.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.VIDEO_CODEC_ENUM = {
  VP8: 'VP8',
  H264: 'H264',
  VP9: 'VP9',
  AUTO: 'auto'
  //H264UC: 'H264UC'
};

/**
 * The enum of Peer handshake states.
 * @attribute HANDSHAKE_STATE_ENUM
 * @param {String} ENTER The state when Peer has joined the Room.
 * @param {String} WELCOME The state when Peer acknowledges self has joined the Room.
 * @param {String} RESTART The state after `ENTER` or `WELCOME` when Peer wants to resend another offer
 *   to switch Stream object or restart ICE connection.
 * @param {String} OFFER The state when Peer sends an offer to start ICE connection.
 * @param {String} ANSWER The state when Peer responses an answer to self offer.
 * @param {String} ERROR The state when Peer connection fails to start, or set offer or answer.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.HANDSHAKE_STATE_ENUM = {
  ENTER: 'enter',
  WELCOME: 'welcome',
  RESTART: 'restart',
  OFFER: 'offer',
  ANSWER: 'answer',
  ERROR: 'error'
};

/**
 * The enum of Peer handshake error types.
 * @attribute HANDSHAKE_STATE_ERROR_TYPE_ENUM
 * @param {String} CREATE_PEER The error type when Peer fails to create connection.
 * @param {String} CREATE_OFFER The error type when Peer fails to create local offer.
 * @param {String} SET_LOCAL_OFFER The error type when Peer fails to set local offer.
 * @param {String} SET_REMOTE_OFFER The error type when Peer fails to set remote offer.
 * @param {String} CREATE_ANSWER The error type when Peer fails to create local answer.
 * @param {String} SET_LOCAL_ANSWER The error type when Peer fails to set local answer.
 * @param {String} SET_REMOTE_ANSWER The error type when Peer fails to set remote answer.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.HANDSHAKE_ERROR_TYPE_ENUM = {
  CREATE_PEER: 'createPeer',
  CREATE_OFFER: 'createOffer',
  SET_LOCAL_OFFER: 'setLocalOffer',
  SET_REMOTE_OFFER: 'setRemoteOffer',
  CREATE_ANSWER: 'createAnswer',
  SET_LOCAL_ANSWER: 'setLocalAnswer',
  SET_REMOTE_ANSWER: 'setRemoteAnswer'
};

/**
 * The enum of Peer ICE connection states.
 * @attribute ICE_CONNECTION_STATE_ENUM
 * @param {String} CONNECTING The state when ICE is connecting.
 * @param {String} CONNECTED The state when ICE has connected but is still finding for a better ICE candidate pairing.
 * @param {String} COMPLETED The state when ICE has connected and has already paired the best ICE candidate.
 * @param {String} FAILED The state when ICE has failed to connect.
 * @param {String} DISCONNECTED The state when ICE connection has been disconnected.
 * @param {String} CLOSED The state when ICE connection has closed.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.ICE_CONNECTION_STATE_ENUM = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  COMPLETED: 'completed',
  FAILED: 'failed',
  DISCONNECTED: 'disconnected',
  CLOSED: 'closed'
};

/**
 * The enum of Peer ICE gathering states.
 * @attribute ICE_GATHERING_STATE_ENUM
 * @param {String} GATHERING The state when ICE is still gathering.
 * @param {String} COMPLETD The state when ICE has completed gathering.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.ICE_GATHERING_STATE_ENUM = {
  GATHERING: 'gathering',
  COMPLETED: 'completed'
};

/**
 * The enum of Peer ICE gathering states.
 * @attribute SIGNALING_STATE_ENUM
 * @param {String} STABLE The state when no local or remote, offer or answer is expected.
 * @param {String} HAVE_LOCAL_OFFER The state when Peer has local offer and is expecting a remote answer to be set.
 * @param {String} HAVE_REMOTE_OFFER The state when Peer has remote offer and is expecting a local answer to be set.
 * @param {String} CLOSED The state when Peer exchanging of offer or answer has closed.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.SIGNALING_STATE_ENUM = {
  STABLE: 'stable',
  HAVE_LOCAL_OFFER: 'have-local-offer',
  HAVE_REMOTE_OFFER: 'have-remote-offer',
  CLOSED: 'closed'
  // HAVE_LOCAL_PRANSWER: 'have-local-pranswer
  // HAVE_REMOTE_PRANSWER: 'have-remote-pranswer
};

/**
 * The enum of {{#crossLink "Temasys.Peer/getStats:method"}}{{/crossLink}} states.
 * @attribute GET_STATS_STATE_ENUM
 * @param {String} LOADING The state when `getStats()` is retrieving stats.
 * @param {String} SUCCESS The state when `getStats()` has retrieved stats successfully.
 * @param {String} FAILED The state when `getStats()` has failed to retrieve stats.
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.GET_STATS_STATE_ENUM = {
	LOADING: 'loading',
  SUCCESS: 'success',
  FAILED: 'failed'
};

/**
 * The enum of Peer types.
 * @attribute TYPE_ENUM
 * @param {String} MCU The type when Peer is MCU Peer.
 * @param {String} P2P The type when Peer is MCU disabled Peer.
 * @param {String} MCU_RELAYED The type when Peer is MCU relayed Peer.
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.TYPE_ENUM = {
  MCU: 'MCU',
  // SIP: 'SIP',
  P2P: 'p2p',
  MCU_RELAYED: 'MCURelayed'
};

/**
 * The enum of Peer local ICE candidate (native `RTCIceCandidate` object) sending states.
 * @attribute CANDIDATE_SENT_STATE_ENUM
 * @param {String} GATHERED The state when the ICE candidate is gathered.
 * @param {String} DROPPED The state when the ICE candidate is dropped from sending.
 * @param {String} SENT The state when the ICE candidate is sent.
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.CANDIDATE_SENT_STATE_ENUM = {
  GATHERED: 'gathered',
  DROPPED: 'dropped',
  SENT: 'sent'
};

/**
 * The enum of Peer remote ICE candidate (native `RTCIceCandidate` object) processing states.
 * @attribute CANDIDATE_PROCESSING_STATE_ENUM
 * @param {String} Received The state when the ICE candidate is received.
 * @param {String} DROPPED The state when the ICE candidate is dropped from processing.
 * @param {String} PROCESSING The state when the ICE candidate is processing.
 * @param {String} PROCESSED The state when the ICE candidate has been processed
 *   and added to Peer connection successfully.
 * @param {String} FAILED The state when the ICE candidate has failed to process
 *   and add to Peer connection.
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.CANDIDATE_PROCESSING_STATE_ENUM = {
  RECEIVED: 'received',
  DROPPED: 'dropped',
  PROCESSING: 'processing',
  PROCESSED: 'processed',
  FAILED: 'failed'
};

/**
 * Function to retrieve Peer ICE candidates.
 * @method getCandidates
 * @return {JSON} [test] rere
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.getCandidate = function () {
};

/**
 * Function to retrieve Peer {{#crossLink "Stream"}}Streams{{/crossLink}}.
 * @param getStreams
 * @return {JSON} [test] rere
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.getStreams = function () {
};

/**
 * Function to retrieve Datachannel connections.
 * @param getDatachannels
 * @return {JSON} [test] rere
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.getDatachannels = function () {
};

/**
 * Function to retrieve DTMF sender.
 * @param getDTMFSender
 * @return {JSON} [test] rere
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.getDTMFSender = function () {
};

/**
 * Function to retrieve Peer connection stats.
 * @method getStats
 * @param {Boolean} [isRaw=false] The flag to return native stats object instead of parsed stats.
 * @return {Promise} The Promise for function request completion.
 * @example
 *   peer.getStats().then(function (stats) {
 *     console.log("Received stats ->", stats);
 *   }).catch(function (error) {
 *     console.error("Received error ->", error);
 *   });
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.getStats = function (isRaw) {
};

/**
 * Function to send a new Stream object to Peer.
 * @method stream
 * @param {Temasys.Stream} stream The Stream object.
 * @param {JSON} options The options.
 * @param {JSON} options.media The media connection options.
 * - This follows the 
 * @return {Promise} The Promise for function request completion.
 * @example
 *   peer.stream(stream, options).then(function () {
 *     console.log("Send stream success ->");
 *   }).catch(function (error) {
 *     console.error("Received error ->", error);
 *   });
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.stream = function (stream, options) {
};

/**
 * Function to refresh Peer connection.
 * @method refresh
 * @return {Promise} The Promise for function request completion.
 * @example
 *   peer.stream(options).then(function () {
 *     console.log("Send stream success ->");
 *   }).catch(function (error) {
 *     console.error("Received error ->", error);
 *   });
 * @for Temasys.Peer
 * @since 0.7.0
 */
Peer.prototype.refresh = function (stream, options) {
};


/**
 * Function to send message to Peer.
 * 
 */
Peer.prototype.send = function (message, isP2P, fn) {
  var ref = this;
};