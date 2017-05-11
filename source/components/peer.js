/**
 * Handles the peer connection.
 * @class Temasys.Peer
 * @param {JSON} options The options.
 * @param {String} [options.rtcpMuxPolicy] The option for muxing or combining RTP and RTCP packets streaming to a connection.
 * - Examples: `"negotiate"`, `"require"`
 * - When not provided, the default value is `"require"`.
 * - Reference [`RTCP_MUX_POLICY_ENUM` constant](#docs+Temasys.Peer+constants+RTCP_MUX_POLICY_ENUM) for the list of available policies.
 * @param {String} [options.bundlePolicy] The option for bundling or combining audio, video and datachannel media streaming to a connection.
 * - Examples: `"balanced"`, `"max-bundle"`
 * - When not provided, the default value is `"balanced"`.
 * - Reference [`BUNDLE_POLICY_ENUM` constant](#docs+Temasys.Peer+constants+BUNDLE_POLICY_ENUM) for the list of available policies.
 * @param {Number} [options.iceCandidatePoolSize] The number of ICE candidates to prefetch, so that the next peer connection can
 *   use the similar pool of ICE candidates to ensure quicker connections.
 * - Range: `0` - `255`
 * - Examples: `0`, `25`
 * - When not provided, the default value is `0`.
 * @param {Array} [options.certificates] The list of custom certificates to generate and use if supported - where each item is a _JSON_.
 * - Examples: `new Array(Temasys.Peer.prototype.CERTIFICATE_ENUM.RSA)`, `new Array(Temasys.Peer.prototype.CERTIFICATE_ENUM.ECDSA)`
 * - When not provided, the default value is `new Array()`, which indicates that it uses the default certificates provided by client browser.
 * - Reference [`CERTIFICATE_ENUM` constant](#docs+Temasys.Peer+constants+CERTIFICATE_ENUM) for the list of available options.
 * @param {Array} [options.iceCandidateTypes] The list of ICE candidate types to accept - where each item is a _String_.
 * - Examples: `new Array("relay")`, `new Array("host", "srflx", "relay")`
 * - When not provided, the default value is `new Array("host", "srflx", "relay")`.
 * - Note that the `"prflx"` option cannot be disabled as it is discovered during ICE connectivity checks.
 * - For quicker connections for users behind firewalls or certain NATs, enforcing TURN connections like doing
 *   `new Array("relay")` would speed up the ICE connectivity process.
 * - Reference [`CANDIDATE_TYPE_ENUM` constant](#docs+Temasys.Peer+constants+CANDIDATE_TYPE_ENUM) for the list of available types.
 * @param {JSON} [options.iceServers] The ICE servers options.
 * @param {JSON|Boolean} [options.iceServers.stun] The STUN server options.
 * - Examples: `stun:server.org`
 * - When provided as `false`, using STUN servers is disabled.
 * @param {Boolean} [options.iceServers.stun.public] The flag if publicly available STUN servers should be used.
 * - When not provided, the default value is `true`.
 * @param {Array} [options.iceServers.stun.servers] The list of STUN servers - where each item is a _String_.
 * - Examples: `stun.l.google.com`, `turn.temasys.io`, `turns.temasys.io`
 * - When not provided, the default value returned from signaling server is used.
 * @param {Array} [options.iceServers.stun.ports] The list of STUN ports, not for publicly available STUN servers - where each item is a _Number_.
 * - Examples: `new Array(19302)`, `new Array(3478)`
 * - Range: `3478`, `19302` - `19308`
 * - When not provided, the default value returned from signaling server is used.
 * @param {JSON|Boolean} [options.iceServers.turn] The TURN server options.
 * - Examples: `turn:server.org`
 * - When provided as `false`, using TURN servers is disabled.
 * @param {Array} [options.iceServers.turn.servers] The list of TURN servers - where each item is a _String_.
 * - Examples: `turn.temasys.io`, `turns.temasys.io`
 * - When not provided, the default value returned from signaling server is used.
 * @param {Array} [options.iceServers.turn.schemes] The TURN connection scheme to use - where each item is a _String_.
 * - Examples: `new Array("turn_udp", "turn_tcp")`, `new Array("turn_tls")`
 * - When not provided, the default value is `new Array("turn_udp", "turn_tcp")`.
 * - Reference [`TURN_CONNECTION_ENUM` constant](#docs+Temasys.Peer+constants+TURN_CONNECTION_ENUM) for the list of available schemes.
 * @param {Array} [options.iceServers.turn.ports] The list of TURN ports - where each item is a _Number_.
 * - Examples: `new Array(443)`, `new Array(3478)`
 * - When not provided, the default value returned from signaling server is used.
 * @param {Number} [options.trickleIce] The flag if trickling of ICE candidates during gathering should enabled if available
 *   for quicker ICE connection establishment.
 * - When not provided, the default value is `true`.
 * @param {JSON|Boolean} [options.audio] The audio media streaming options.
 * - When provided as `false`, the audio media streaming is disabled.
 * @param {String} [options.audio.direction] The audio media streaming direction.
 * - Examples: `"sendrecv"`, `"sendonly"`, `"recvonly"`
 * - When not provided, the default value is `"sendrecv"`
 * - Reference [`MEDIA_DIRECTION_ENUM` constant](#docs+Temasys.Peer+constants+MEDIA_DIRECTION_ENUM) for the list of available directions.
 * @param {Number} [options.audio.maxBandwidth] The maximum bandwidth cap for audio media streaming in kbps.
 * - Examples: `20`, `30`, `50`
 * - When not provided, the default value is `20`.
 * @param {JSON} [options.audio.codec] The preferred audio codec options.
 * - When not provided, the default value provided from the generated session description is used.
 * @param {String} options.audio.codec.name The preferred audio codec if available.
 * - Examples: `"opus"`, `"g722"`
 * - When not provided, the default value provided from the generated session description is used.
 * - Reference [`AUDIO_CODEC_ENUM` constant](#docs+Temasys.Peer+constants+AUDIO_CODEC_ENUM) for the list of available codecs.
 * @param {Number} [options.audio.codec.samplingRate] The preferred audio codec sampling rate if available.
 * - Examples: `48000`, `16000`
 * - When not provided, the default value provided from the generated session description is used.
 * @param {Boolean} [options.audio.voiceActivityDetection] The flag if voice activity detection (VAD) should be enabled.
 * - When not provided, the default value is `true`.
 * @param {Boolean} [options.audio.comfortNoise] The flag if "comfort noise" like artifical noise should be added when
 *   varying levels of sending audio streaming is given when DTX is enabled for OPUS codec. 
 * @param {JSON} [options.audio.codecParams] The audio codec parameters.
 * - When not provided, the default value provided from the generated session description is used.
 * - Note that some of these settings may be informational but for debugging purposes, they may be manipulated.
 * @param {JSON} [options.audio.codecParams.opus] The OPUS audio codec parameters.
 * - These settings would be used when OPUS audio codec is selected.
 * @param {Boolean} [options.audio.codecParams.opus.stereo] The flag if stereo band should be enabled for sending audio streaming.
 * @param {Boolean} [options.audio.codecParams.opus.usedtx] The flag if DTX (Discontinuous Transmission) should be enabled
 *   for sending audio streaming.
 * - This might help to reduce bandwidth as it reduces the bitrate during silence or background noise,
 *    and goes hand-in-hand with the `audio.voiceActivityDetection` flag.
 * @param {Boolean} [options.audio.codecParams.opus.useinbandfec] The flag in-band FEC (Forward Error Correction)
 *   should be enabled for sending audio streaming.
 * - This helps to reduce the harm of packet loss by encoding information about the previous packet loss.
 * @param {Number} [options.audio.codecParams.opus.maxplaybackrate] The maximum sampling rate in Hz (hertz) for receiving audio streaming.
 * - Range: `8000` - `48000`.
 * @param {Number} [options.audio.codecParams.opus.minptime] The minimum length of time in milleseconds
 *   should be encapsulated for a single audio data packet.
 * @param {JSON|Boolean} [options.video] The video media streaming options.
 * - When provided as `false`, the video media streaming is disabled.
 * @param {String} [options.video.direction] The video media streaming direction.
 * - Examples: `"sendrecv"`, `"sendonly"`, `"recvonly"`
 * - When not provided, the default value is `"sendrecv"`
 * - Reference [`MEDIA_DIRECTION_ENUM` constant](#docs+Temasys.Peer+constants+MEDIA_DIRECTION_ENUM) for the list of available directions.
 * @param {Number} [options.video.maxBandwidth] The maximum bandwidth cap for video media streaming in kbps.
 * - Examples: `256`, `512`, `700`, `10240`
 * - When not provided, the default value is `512`.
 * @param {JSON} [options.video.codec] The preferred video codec options.
 * - When not provided, the default value provided from the generated session description is used.
 * @param {String} [options.video.codec.name] The preferred video codec if available.
 * - Examples: `"vp8"`, `"vp9"`, `"h264"`
 * - When not provided, the default value provided from the generated session description is used.
 * - Reference [`VIDEO_CODEC_ENUM` constant](#docs+Temasys.Peer+constants+VIDEO_CODEC_ENUM) for the list of available codecs.
 * @param {Number} [options.video.codec.samplingRate] The preferred video codec sampling rate if available.
 * - Examples: `48000`
 * - When not provided, the default value provided from the generated session description is used.
 * @param {Number} [options.video.codec.minBandwidth] The minimum bandwidth for video codec media streaming in kbps.
 * - Examples: `256`, `512`, `700`, `10240`
 * - This uses the `x-google-min-bitrate` flag.
 * @param {Number} [options.video.codec.maxBandwidth] The maximum bandwidth for video codec media streaming in kbps.
 * - Examples: `256`, `512`, `700`, `10240`
 * - This uses the `x-google-max-bitrate` flag.
 * @param {JSON} [options.video.codecParams] The video codec parameters.
 * - When not provided, the default value provided from the generated session description is used.
 * - Note that some of these settings may be informational but for debugging purposes, they may be manipulated.
 * @param {JSON} [options.video.codecParams.h264] The H264 video codec parameters.
 * - These settings would be used when H264 video codec is selected.
 * @param {String} [options.video.codecParams.h264.profileLevelId] The base16 encoded string which
 *   indicates the H264 baseline, main, or the extended profiles.
 * @param {Boolean} [options.video.codecParams.h264.levelAsymmetryAllowed] The flag if different level of encoding
 *   and decoding video packets should be enabled.
 * @param {Number} [options.video.codecParams.h264.packetizationMode] The H264 video codec packetization mode
 *   where it splits video frames that are larger for a RTP packet into RTP packet chunks.
 * - Examples: `0`, `1`, `2`
 * @param {JSON} [options.video.codecParams.vp8] The VP8 video codec parameters.
 * - These settings would be used when VP8 video codec is selected.
 * @param {Number} [options.video.codecParams.vp8.maxFr] The maximum number of frames per second (fps) the
 *   VP8 video decoder should decode video packets.
 * @param {Number} [options.video.codecParams.vp8.maxFs] The maximum number of frame size macroblocks
 *   that the VP8 video decoder is capable of decoding video packets.
 * - The value has to have the width and height of the frame in macroblocks less than the value of
 *   `parseInt(Math.sqrt(maxFs * 8))`. For example, if the value is `1200`, it is capable of the
 *   support of `640x480` frame width and height, which heights up to `1552px` (`97` macroblocks value.
 * @param {JSON} [options.video.codecParams.vp9] The VP9 video codec parameters.
 * - These settings would be used when VP9 video codec is selected.
 * @param {Number} [options.video.codecParams.vp9.maxFr] The maximum number of frames per second (fps) the
 *   VP9 video decoder should decode video packets.
 * @param {Number} [options.video.codecParams.vp9.maxFs] The maximum number of frame size macroblocks
 *   that the VP9 video decoder is capable of decoding video packets.
 * - The value has to have the width and height of the frame in macroblocks less than the value of
 *   `parseInt(Math.sqrt(maxFs * 8))`. For example, if the value is `1200`, it is capable of the
 *   support of `640x480` frame width and height, which heights up to `1552px` (`97` macroblocks value.
 * @param {JSON|Boolean} [options.datachannel] The data media (for datachannel) streaming options.
 * - When provided as `false`, the data media streaming or datachannel is disabled.
 * @param {Number} [options.datachannel.maxBandwidth] The maximum bandwidth cap for data media streaming in kbps.
 * - Examples: `30`, `16240`
 * - When not provided, the default value is `30`.
 * @param {JSON} [options.mechanisms] The RTCP mechanism options.
 * @param {Boolean} [options.mechanisms.fec] The flag if generic forward error correction (FEC) codecs
 *   like ulpfec and red for should be enabled if available.
 * - When not provided, the default value is `true`.
 * @param {Boolean} [options.mechanisms.rtx] The flag if re-transmission (RTX) should be enabled if available.
 * - When not provided, the default value is `true`.
 * @param {Boolean} [options.mechanisms.remb] The flag if receiver estimated maximum bitrate (REMB) should be enabled if available.
 * - When not provided, the default value is `true`.
 * @constructor
 * @private
 * @since 0.7.0
 */
Temasys.Peer = function (options, defaultOptions) {
  var ref = this;

  /**
   * Event triggered when ICE connection state has changed.
   * @event iceConnectionStateChange
   * @param {String} state The ICE connection state.
   * - Reference [`ICE_CONNECTION_STATE_ENUM` constant](#docs+Temasys.Peer+constants+ICE_CONNECTION_STATE_ENUM) for the list of available states.
   * @for Temasys.Peer
   * @since 0.7.0
   */
  /**
   * Event triggered when negotiation state has changed.
   * @event negotiationStateChange
   * @param {String} state The negotiation state.
   * - Reference [`NEGOTIATION_STATE_ENUM` constant](#docs+Temasys.Peer+constants+NEGOTIATION_STATE_ENUM) for the list of available states.
   * @for Temasys.Peer
   * @since 0.7.0
   */
  /**
   * Event triggered when ICE gathering state has changed.
   * @event iceGatheringStateChange
   * @param {String} state The ICE gathering state.
   * - Reference [`ICE_GATHERING_STATE_ENUM` constant](#docs+Temasys.Peer+constants+ICE_GATHERING_STATE_ENUM) for the list of available states.
   * @for Temasys.Peer
   * @since 0.7.0
   */
  // TOCHANGE V
  /**
   * Event triggered when ICE candidate processing state has changed.
   * @event candidateProcessingStateChange
   * @param {String} state The ICE candidate processing state.
   * - Reference [`CANDIDATE_PROCESSING_STATE_ENUM` constant](#docs+Temasys.Peer+constants+CANDIDATE_PROCESSING_STATE_ENUM) for the list of available states.
   * @param {String} candidateId The ICE candidate ID.
   * - When received as `"endOfCandidates"`, it means that the remote ICE gathering has been completed.
   * @param {JSON} [candidate] The ICE candidate.
   * @param {String} candidate.candidate The ICE candidate information.
   * @param {String} candidate.sdpMid The media line ID the ICE candidate relates to.
   * @param {Number} candidate.sdpMLineIndex The index of media line the ICE candidate relates to.
   * @param {Boolean} isSelf The flag if ICE candidate is generated from client.
   * @for Temasys.Peer
   * @since 0.7.0
   */
};

/**
 * The enum of policies for muxing or combining RTP and RTCP packets streaming.
 * - Reference [real-time transport protocol (RTP)](https://en.wikipedia.org/wiki/Real-time_Transport_Protocol)
 *    and [RTP control protocol (RTCP)](https://en.wikipedia.org/wiki/RTP_Control_Protocol) for more information.
 * @attribute RTCP_MUX_POLICY_ENUM
 * @param {String} REQUIRE The policy to stream RTP and RTCP packets on seperate connections.
 * - Value: `"require"`
 * @param {String} NEGOTIATE The policy to stream RTP and RTCP packets on the same connection.
 * - Value: `"negotiate"`
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Temasys.Peer.prototype.RTCP_MUX_POLICY_ENUM = {
  NEGOTIATE: 'negotiate',
  REQUIRE: 'require'
};

/**
 * The enum of policies for bundling audio, video and datachannel media streaming.
 * @attribute BUNDLE_POLICY_ENUM
 * @param {String} BALANCED The policy to stream audio, video and data on the same connection, but switch to
 *   seperate connections if remote endpoint does not support bundling where media streaming uses the same connection.
 * - Value: `"balanced"`
 * @param {String} MAX_COMPAT The policy to stream audio, video and data on separate connections.
 * - Value: `"max-compat"`
 * @param {String} MAX_BUNDLE The policy to stream audio, video and data on the same connection.
 * - Value: `"max-bundle"`
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Temasys.Peer.prototype.BUNDLE_POLICY_ENUM = {
  BALANCED: 'balanced',
  MAX_COMPAT: 'max-compat',
  MAX_BUNDLE: 'max-bundle'
};

/**
 * The enum of options for generating certificates types.
 * @attribute CERTIFICATE_ENUM
 * @param {JSON} RSA The option to generate RSA certificate using PKCS#1 standard, with modulus length of `2048` and SHA-256 hashing.
 * - Value: `{ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }`
 * - Reference [RSA cryptography](https://en.wikipedia.org/wiki/RSA_%28cryptosystem%29), and
 *   [PKCS#1 standard](https://en.wikipedia.org/wiki/PKCS_1) for more information.
 * @param {JSON} ECDSA The option to generate ECDSA certificate with `p-256` named curve.
 * - Value: `{ name: "ECDSA", namedCurve: "P-256" }`
 * - Reference [ECDSA cryptography](https://en.wikipedia.org/wiki/Elliptic_curve_cryptography) for more information.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Temasys.Peer.CERTIFICATE_ENUM = {
  RSA: {
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256'
  },
  ECDSA: {
    name: 'ECDSA',
    namedCurve: 'P-256'
  }
};

/**
 * The enum of ICE candidate types.
 * @attribute CANDIDATE_TYPE_ENUM
 * @param {String} HOST The candidate type for host connections like the host network interface, including VPN interfaces.
 * - Value: `"host"`
 * - Sending route: `192.168.1.95:58874 (local)` &#8680; `192.168.1.25:58875 (local)`
 * - Receiving route: `192.168.1.95:58874 (local)` &#8678; `192.168.1.25:58875 (local)`
 * - This connects for devices connected on the same network or router.
 * @param {String} SRFLX The candidate type for server-reflexive connections like connecting from another network endpoint.
 * - Value: `"srflx"`
 * - NAT mapped address for STUN: `42.22.0.5:5000`
 * - NAT mapped address for remote end-point: `42.22.0.5:5000`
 * - Sending route: `192.168.1.95:58874 (local)` as `42.22.0.5:5000 (public)` &#8680; `40.20.2.3:3000 (public)`
 *    as `192.168.1.25:58875 (local)`
 * - Receiving route: `192.168.1.95:58874 (local)` as `42.22.0.5:5000 (public)` &#8678; `40.20.2.3:3000 (public)`
 *    as `192.168.1.25:58875 (local)`
 * - This connects for devices on different network but is not behind firewalls or symmetrical NATs.
 * @param {String} PRFLX The candidate type for connecting from another network endpoint behind symmetrical NATs.
 * - Value: `"prflx"`
 * - NAT mapped address for STUN: `42.22.0.5:5000`
 * - NAT mapped address for remote end-point: `42.22.0.5:5500`
 * - Sending route: `192.168.1.95:58874 (local)` as `42.22.0.5:5500 (public)` &#8680; `40.20.2.3:3000 (public)`
 *    as `192.168.1.25:58875 (local)`
 * - Receiving route: `192.168.1.95:58874 (local)` as `42.22.0.5:5500 (public)` &#8678; `40.20.2.3:3000 (public)`
 *    as `192.168.1.25:58875 (local)`
 * - This connects for devices when receiving a different port from the response, which is due to the symmetrical NAT
 *    mapping the STUN server session and the session from the client to remote endpoint to different ports,
 *    and hence the port is switched and corrected to use the replied port to ensure connections.
 * @param {String} RELAY The candidate type for relayed connections like connecting from another
 *   network endpoint behind firewalls, symmetrical NATs or other port restricted NATs.
 * - Value: `"relay"`
 * - Sending route: `192.168.1.95:58874 (local)` as `42.22.0.5:5500 (public)` &#8680; `50.22.1.62:6000 (TURN)` as
 *    `50.22.1.62:5600 (TURN)` &#8680; `40.20.2.3:3000 (public)` as `192.168.1.25:58875 (local)`
 * - Receiving route: `192.168.1.95:58874 (local)` as `42.22.0.5:5500 (public)` &#8678; `50.22.1.62:6000 (TURN)` as
 *    `50.22.1.62:5600 (TURN)` &#8678; `40.20.2.3:3000 (public)` as `192.168.1.25:58875 (local)`
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Temasys.Peer.prototype.CANDIDATE_TYPE_ENUM = {
  HOST: 'host',
  SRFLX: 'srflx',
  PRFLX: 'prfx',
  RELAY: 'relay'
};

/**
 * The enum of options for generating certificates types.
 * @attribute TURN_CONNECTION_ENUM
 * @param {String} TURN_TLS The scheme to use TURN / TLS using TCP protocol when connecting to TURN server.
 * - Value: `"turn_tls"`
 * - Output: `turns:turnserver.org`
 * @param {String} TURN_UDP The scheme to use TURN using TCP transport protocol when connecting to TURN server.
 * - Value: `"turn_udp"`
 * - Output: `turn:turnserver.org?transport=udp`
 * @param {String} TURN_TCP The scheme to use TURN using UDP transport protocol when connecting to TURN server.
 * - Value: `"turn_tcp"`
 * - Output: `turn:turnserver.org?transport=tcp`
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Temasys.Peer.TURN_CONNECTION_ENUM = {
  TURN_TLS: 'turn_tls',
  TURN_UDP: 'turn_udp',
  TURN_TCP: 'turn_tcp'
};

/**
 * The enum of audio media codecs.
 * @attribute AUDIO_CODEC_ENUM
 * @param {String} OPUS The option to prefer OPUS audio codec.
 * - Value: `"opus"`
 * - Reference [OPUS codec](https://en.wikipedia.org/wiki/Opus_%28audio_format%29) for more information.
 * @param {String} ISAC The option to prefer internet speech audio codec (iSAC).
 * - Value: `"isac"`
 * - Reference [iSAC codec](https://en.wikipedia.org/wiki/Opus_%28audio_format%29) for more information.
 * @param {String} ILBC The option to prefer internet low bitrate audio codec (iLBC).
 * - Value: `"ilbc"`
 * - Reference [iLBC codec](https://en.wikipedia.org/wiki/Internet_Low_Bitrate_Codec) for more information.
 * @param {String} G722 The option to prefer the G722 audio codec.
 * - Value: `"g722"`
 * - Reference [G.722 codec](https://en.wikipedia.org/wiki/G.722) for more information.
 * @param {String} PCMU The option to prefer the G711u audio codec.
 * - Value: `"pcmu"`
 * - Reference [G.711u codec](https://en.wikipedia.org/wiki/G.711#.CE.BC-Law) for more information.
 * @param {String} PCMA The option to prefer the G711a audio codec.
 * - Value: `"pcma"`
 * - Reference [G.711a codec](https://en.wikipedia.org/wiki/G.711#A-Law) for more information.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Temasys.Peer.prototype.AUDIO_CODEC_ENUM = {
  ISAC: 'isac',
  OPUS: 'opus',
  ILBC: 'ilbc',
  G722: 'g722',
  PCMU: 'pcmu',
  PCMA: 'pcma',
  //SILK: 'SILK'
};

/**
 * The enum of video media codecs.
 * @attribute VIDEO_CODEC_ENUM
 * @param {String} VP8 The option to prefer the VP8 video codec.
 * - Value: `"vp8"`
 * - Reference [VP8 codec](https://en.wikipedia.org/wiki/VP8) for more information.
 * @param {String} VP9 The option to prefer the VP9 video codec.
 * - Value: `"vp9"`
 * - Reference [VP9 codec](https://en.wikipedia.org/wiki/VP9) for more information.
 * @param {String} H264 The option to prefer the H264 video codec.
 * - Value: `"h264"`
 * - Reference [H264 codec](https://en.wikipedia.org/wiki/H.264/MPEG-4_AVC) for more information.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Temasys.Peer.prototype.VIDEO_CODEC_ENUM = {
  VP8: 'vp8',
  H264: 'h264',
  VP9: 'vp9',
  //H264UC: 'H264UC'
};

/**
 * The enum of direction for media streaming.
 * @attribute MEDIA_DIRECTION_ENUM
 * @param {String} SEND_RECV The direction to send and also receive media (audio, video or data) stream for remote endpoint if available.
 * - Value: `"sendrecv"`
 * @param {String} SEND_ONLY The direction to only send media (audio, video or data) stream for remote endpoint if available.
 * - Value: `"sendonly"`
 * @param {String} RECV_ONLY The direction to only receive media (audio, video or data) stream for remote endpoint if available.
 * - Value: `"recvonly"`
 * @param {String} INACTIVE The direction to not send or receive media (audio, video or data) stream for remote endpoint.
 * - Value: `"inactive"`
 * - Note that RTCP packets might still be sent even when direction is inactive.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Temasys.Peer.MEDIA_DIRECTION_ENUM = {
  SEND_RECV: 'sendrecv',
  SEND_ONLY: 'sendonly',
  RECV_ONLY: 'recvonly',
  INACTIVE: 'inactive'
};

/**
 * The enum of ICE connection states.
 * @attribute ICE_CONNECTION_STATE_ENUM
 * @param {String} NEW The ICE transports are at its initial stage without attempting connections.
 * - Value: `"new"`
 * @param {String} CHECKING The ICE transports are attempting and checking for connections.
 * - Value: `"checking"`
 * @param {String} CONNECTED The ICE transports are connected.
 * - Value: `"connected"`
 * @param {String} COMPLETED The ICE transports are connected and have already selected the best pair of candidates.
 * - Value: `"completed"`
 * @param {String} FAILED The ICE transports failed to connect.
 * - Value: `"failed"`
 * @param {String} DISCONNECTED The ICE transports are disconnected.
 * - Value: `"disconnected"`
 * @param {String} CLOSED The ICE transports are closed and would no longer reconnect.
 * - Value: `"closed"`
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Temasys.Peer.prototype.ICE_CONNECTION_STATE_ENUM = {
  NEW: 'new',
  CHECKING: 'checking',
  CONNECTED: 'connected',
  COMPLETED: 'completed',
  FAILED: 'failed',
  DISCONNECTED: 'disconnected',
  CLOSED: 'closed'
};

/**
 * The enum of peer connection negotiation states.
 * @attribute NEGOTIATION_STATE_ENUM
 * @param {String} ENTER
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Temasys.Peer.prototype.NEGOTIATION_STATE_ENUM = {
  ENTER: 'enter',
  WELCOME: 'welcome',
  WELCOME_RESEND: 'welcome-resend',
  RESTART: 'restart',
  RESTART_RESEND: 'restart-resend',
  OFFER_LOCAL: 'have-local-offer',
  OFFER_LOCAL_ERROR: 'offer_local_error',
  OFFER_REMOTE: 'offer_remote',
  OFFER_REMOTE_ERROR: 'offer_remote_error',
  ANSWER_LOCAL: 'answer_local'
  ANSWER_LOCAL_ERROR: 'answer_local_error',
  ANSWER_REMOTE: 'answer_remote'
  ANSWER_REMOTE_ERROR: 'answer_remote_error',
  CLOSED: 'closed'
};

/**
 * The enum of ICE gathering states.
 * @attribute ICE_GATHERING_STATE_ENUM
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Temasys.Peer.prototype.ICE_GATHERING_STATE_ENUM = {
};

/**
 * The enum of ICE gathering states.
 * @attribute ICE_GATHERING_STATE_ENUM
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Temasys.Peer.prototype.ICE_GATHERING_STATE_ENUM = {
};

/**
 * The enum of ICE candidate processing states.
 * @attribute ICE_CANDIDATE_PROCESSING_STATE_ENUM
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Temasys.Peer.prototype.ICE_CANDIDATE_PROCESSING_STATE_ENUM = {
};

/**
 * The enum of peer connection types.
 * @attribute TYPE_ENUM
 * @param {String} MCU The type that indicates it is a MCU peer connection.
 * - Value: `"mcu"`
 * @param {String} MCU_RELAYED The type that indicates it is a peer connection relayed from the MCU.
 * - Value: `"mcu_relayed"`
 * @param {String} NORMAL The type that indicates it is a normal peer connection.
 * - Value: `"p2p"`
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Peer
 * @since 0.7.0
 */
Temasys.Peer.prototype.TYPE_ENUM = {
  MCU: 'mcu',
  MCU_RELAYED: 'mcu_relayed',
  NORMAL: 'p2p'
};

/**
 * Function that returns the peer information.
 * @method getInfo
 * @param {JSON} return The peer information.
 * @param {String} return.id The peer ID.
 * @param {String} [return.parentId] The peer parent ID its linked to if any.
 * @param {JSON|String} [return.customData] The peer custom data.
 * @param {String} return.type The peer connection type.
 * - Reference [`TYPE_ENUM` constant](#docs+Temasys.Datachannel+constants+TYPE_ENUM) for the list of available types.
 * @param {JSON} return.media The peer media settings.
 * @param {JSON|Boolean} return.media.audio The peer audio media settings.
 * @param {String} return.media.audio.direction The peer audio direction.
 * - Reference [`MEDIA_DIRECTION_ENUM` constant](#docs+Temasys.Peer+constants+MEDIA_DIRECTION_ENUM) for the list of available directions.
 * @param {JSON|Boolean} return.media.video The peer video media settings.
 * @param {String} return.media.video.direction The peer video direction.
 * - Reference [`MEDIA_DIRECTION_ENUM` constant](#docs+Temasys.Peer+constants+MEDIA_DIRECTION_ENUM) for the list of available directions.
 * @param {JSON|Boolean} return.media.datachannel The peer datachannel media settings.
 * @param {JSON} return.agent The peer agent information.
 * @param {String} return.agent.name The peer agent name.
 * @param {String} return.agent.version The peer agent version.
 * @param {String} [return.agent.platform] The peer agent platform if any.
 * @param {String} [return.agent.pluginVersion] The peer Temasys plugin version if any.
 * @param {Boolean} return.trickleIce The flag if peer supports trickling of ICE connections.
 * @param {Boolean} return.restartIce The flag if peer supports restarting of ICE connections.
 * @return {JSON}  
 * @example
 *   console.log("info ->", datachannel.getInfo());
 * @for Temasys.Peer
 * @since 0.7.0
 */
Temasys.Peer.prototype.getInfo = function () {
  var ref = this;
};

/**
 * Function that returns the peer connection stats.
 * @method getStats
 * @param {JSON} return The full stats.
 * @return {Promise}  
 * @example
 * peer.getStats().then(function (stats) {
 *   console.info("stats ->", stats);
 * });
 * @for Temasys.Peer
 * @since 0.7.0
 */
Temasys.Peer.prototype.getStats = function () {
  var ref = this;
};

/**
 * Function that returns the current datachannel states and connection session.
 * @method getCurrent
 * @param {JSON} return The current states and connection session.
 * @param {JSON} return.states The current states.
 * @param {String} return.states.iceConnectionState The ICE connection state.
 * - Reference [`ICE_CONNECTION_STATE_ENUM` constant](#docs+Temasys.Peer+constants+ICE_CONNECTION_STATE_ENUM) for the list of available states.
 * @param {String} return.states.iceGatheringState The ICE gathering state.
 * - Reference [`ICE_GATHERING_STATE_ENUM` constant](#docs+Temasys.Peer+constants+ICE_GATHERING_STATE_ENUM) for the list of available states.
 * @param {String} return.states.negotiationState The peer connection negotiation state.
 * - Reference [`NEGOTIATION_STATE_ENUM` constant](#docs+Temasys.Peer+constants+NEGOTIATION_STATE_ENUM) for the list of available states.
 * @param {Boolean} return.states.connected The flag if peer is connected.
 * @return {JSON}  
 * @example
 *   console.log("current info ->", peer.getCurrent());
 * @for Temasys.Peer
 * @since 0.7.0
 */
Temasys.Peer.prototype.getCurrent = function () {
  var ref = this;
};