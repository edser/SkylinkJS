/**
 * Function that modifies the session description to configure settings for OPUS audio codec.
 * @method _setSDPOpusConfig
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._setSDPOpusConfig = function(targetMid, sessionDescription) {
  var sdpLines = sessionDescription.sdp.split('\r\n');
  var payload = null;
  var appendFmtpLineAtIndex = -1;
  var userAudioSettings = this.getPeerInfo().settings.audio;
  var opusSettings = {
    useinbandfec: null,
    usedtx: null,
    maxplaybackrate: null,
    stereo: false
  };

  if (userAudioSettings && typeof userAudioSettings === 'object') {
    opusSettings.stereo = userAudioSettings.stereo === true;
    opusSettings.useinbandfec = typeof userAudioSettings.useinbandfec === 'boolean' ? userAudioSettings.useinbandfec : null;
    opusSettings.usedtx = typeof userAudioSettings.usedtx === 'boolean' ? userAudioSettings.usedtx : null;
    opusSettings.maxplaybackrate = typeof userAudioSettings.maxplaybackrate === 'number' ? userAudioSettings.maxplaybackrate : null;
  }


  // Find OPUS RTPMAP line
  for (var i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].indexOf('a=rtpmap:') === 0 && (sdpLines[i].toLowerCase()).indexOf('opus/48000') > 0) {
      payload = (sdpLines[i].split(' ')[0] || '').split(':')[1] || null;
      appendFmtpLineAtIndex = i;
      break;
    }
  }

  if (!payload) {
    Log.warn(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
      'Failed to find OPUS payload. Not configuring options.']);
    return sessionDescription.sdp;
  }

  // Set OPUS FMTP line
  for (var j = 0; j < sdpLines.length; j++) {
    if (sdpLines[j].indexOf('a=fmtp:' + payload) === 0) {
      var opusConfigs = (sdpLines[j].split('a=fmtp:' + payload)[1] || '').replace(/\s/g, '').split(';');
      var updatedOpusParams = '';

      for (var k = 0; k < opusConfigs.length; k++) {
        if (!(opusConfigs[k] && opusConfigs[k].indexOf('=') > 0)) {
          continue;
        }

        var params = opusConfigs[k].split('=');

        if (['useinbandfec', 'usedtx', 'sprop-stereo', 'stereo', 'maxplaybackrate'].indexOf(params[0]) > -1) {
          // Get default OPUS useinbandfec
          if (params[0] === 'useinbandfec' && params[1] === '1' && opusSettings.useinbandfec === null) {
            Log.log(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
              'Received OPUS useinbandfec as true by default.']);
            opusSettings.useinbandfec = true;

          // Get default OPUS usedtx
          } else if (params[0] === 'usedtx' && params[1] === '1' && opusSettings.usedtx === null) {
            Log.log(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
              'Received OPUS usedtx as true by default.']);
            opusSettings.usedtx = true;

          // Get default OPUS maxplaybackrate
          } else if (params[0] === 'maxplaybackrate' && parseInt(params[1] || '0', 10) > 0 && opusSettings.maxplaybackrate === null) {
            Log.log(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
              'Received OPUS maxplaybackrate as ' + params[1] + ' by default.']);
            opusSettings.maxplaybackrate = params[1];
          }
        } else {
          updatedOpusParams += opusConfigs[k] + ';';
        }
      }

      if (opusSettings.stereo === true) {
        updatedOpusParams += 'stereo=1;';
      }

      if (opusSettings.useinbandfec === true) {
        updatedOpusParams += 'useinbandfec=1;';
      }

      if (opusSettings.usedtx === true) {
        updatedOpusParams += 'usedtx=1;';
      }

      if (opusSettings.maxplaybackrate) {
        updatedOpusParams += 'maxplaybackrate=' + opusSettings.maxplaybackrate + ';';
      }

      Log.log(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
        'Updated OPUS parameters ->'], updatedOpusParams);

      sdpLines[j] = 'a=fmtp:' + payload + ' ' + updatedOpusParams;
      appendFmtpLineAtIndex = -1;
      break;
    }
  }

  if (appendFmtpLineAtIndex > 0) {
    var newFmtpLine = 'a=fmtp:' + payload + ' ';

    if (opusSettings.stereo === true) {
      newFmtpLine += 'stereo=1;';
    }

    if (opusSettings.useinbandfec === true) {
      newFmtpLine += 'useinbandfec=1;';
    }

    if (opusSettings.usedtx === true) {
      newFmtpLine += 'usedtx=1;';
    }

    if (opusSettings.maxplaybackrate) {
      newFmtpLine += 'maxplaybackrate=' + opusSettings.maxplaybackrate + ';';
    }

    Log.info(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
      'Created OPUS parameters ->'], newFmtpLine);

    sdpLines.splice(appendFmtpLineAtIndex + 1, 0, newFmtpLine);
  }

  return sdpLines.join('\r\n');
};

/**
 * Function that modifies the session description to limit the maximum sending bandwidth.
 * Setting this may not necessarily work in Firefox.
 * @method _setSDPBitrate
 * @private
 * @for Skylink
 * @since 0.5.10
 */
Skylink.prototype._setSDPBitrate = function(targetMid, sessionDescription) {
  var self = this;
  var sdpLines = sessionDescription.sdp.split('\r\n');
  var parseFn = function (type, bw) {
    var mLineType = type;
    var mLineIndex = -1;
    var cLineIndex = -1;

    if (type === 'data') {
      mLineType = 'application';
    }

    for (var i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].indexOf('m=' + mLineType) === 0) {
        mLineIndex = i;
      } else if (mLineIndex > 0) {
        if (sdpLines[i].indexOf('m=') === 0) {
          break;
        }

        if (sdpLines[i].indexOf('c=') === 0) {
          cLineIndex = i;
        // Remove previous b:AS settings
        } else if (sdpLines[i].indexOf('b=AS:') === 0 || sdpLines[i].indexOf('b:TIAS:') === 0) {
          sdpLines.splice(i, 1);
          i--;
        }
      }
    }

    if (!(typeof bw === 'number' && bw > 0)) {
      Log.warn(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type, 'Not limiting "' + type + '" bandwidth']);
      return;
    }

    if (cLineIndex === -1) {
      Log.warn(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type, 'Failed setting "' +
        type + '" bandwidth as c-line is missing.']);
      return;
    }

    // Follow RFC 4566, that the b-line should follow after c-line.
    Log.info(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
      'Limiting maximum sending "' + type + '" bandwidth ->'], bw);
    sdpLines.splice(cLineIndex + 1, 0, window.webrtcDetectedBrowser === 'firefox' ? 'b=TIAS:' + (bw * 1024) : 'b=AS:' + bw);
  };

  parseFn('audio', this._streamsBandwidthSettings.bAS.audio);
  parseFn('video', this._streamsBandwidthSettings.bAS.video);
  parseFn('data', this._streamsBandwidthSettings.bAS.data);

  // Sets the experimental google bandwidth
  if ((typeof this._streamsBandwidthSettings.googleX.min === 'number') || (typeof this._streamsBandwidthSettings.googleX.max === 'number')) {
    var codec = null;
    var codecRtpMapLineIndex = -1;
    var codecFmtpLineIndex = -1;

    for (var j = 0; j < sdpLines.length; j++) {
      if (sdpLines[j].indexOf('m=video') === 0) {
        codec = sdpLines[j].split(' ')[3];
      } else if (codec) {
        if (sdpLines[j].indexOf('m=') === 0) {
          break;
        }

        if (sdpLines[j].indexOf('a=rtpmap:' + codec + ' ') === 0) {
          codecRtpMapLineIndex = j;
        } else if (sdpLines[j].indexOf('a=fmtp:' + codec + ' ') === 0) {
          sdpLines[j] = sdpLines[j].replace(/x-google-(min|max)-bitrate=[0-9]*[;]*/gi, '');
          codecFmtpLineIndex = j;
          break;
        }
      }
    }

    if (codecRtpMapLineIndex > -1) {
      var xGoogleParams = '';

      if (typeof this._streamsBandwidthSettings.googleX.min === 'number') {
        xGoogleParams += 'x-google-min-bitrate=' + this._streamsBandwidthSettings.googleX.min + ';';
      }

      if (typeof this._streamsBandwidthSettings.googleX.max === 'number') {
        xGoogleParams += 'x-google-max-bitrate=' + this._streamsBandwidthSettings.googleX.max + ';';
      }

      Log.info(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription',
        sessionDescription.type, 'Limiting x-google-bitrate ->'], xGoogleParams);

      if (codecFmtpLineIndex > -1) {
        sdpLines[codecFmtpLineIndex] += (sdpLines[codecFmtpLineIndex].split(' ')[1] ? ';' : '') + xGoogleParams;
      } else {
        sdpLines.splice(codecRtpMapLineIndex + 1, 0, 'a=fmtp:' + codec + ' ' + xGoogleParams);
      }
    }
  }

  return sdpLines.join('\r\n');
};

/**
 * Function that modifies the session description to set the preferred audio/video codec.
 * @method _setSDPCodec
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._setSDPCodec = function(targetMid, sessionDescription) {
  var self = this;
  var sdpLines = sessionDescription.sdp.split('\r\n');
  var parseFn = function (type, codec) {
    if (codec === 'auto') {
      Log.warn(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
        'Not preferring any codec for "' + type + '" streaming. Using browser selection.']);
      return;
    }

    // Find the codec first
    for (var i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].indexOf('a=rtpmap:') === 0 && (sdpLines[i].toLowerCase()).indexOf(codec.toLowerCase()) > 0) {
        var payload = sdpLines[i].split(':')[1].split(' ')[0] || null;

        if (!payload) {
          Log.warn(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type, 'Not preferring "' +
            codec + '" for "' + type + '" streaming as payload is not found.']);
          return;
        }

        for (var j = 0; j < sdpLines.length; j++) {
          if (sdpLines[j].indexOf('m=' + type) === 0) {
            Log.info(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type, 'Preferring "' +
              codec + '" for "' + type + '" streaming.']);

            var parts = sdpLines[j].split(' ');

            if (parts.indexOf(payload) >= 3) {
              parts.splice(parts.indexOf(payload), 1);
            }

            // Example: m=audio 9 UDP/TLS/RTP/SAVPF 111
            parts.splice(3, 0, payload);
            sdpLines[j] = parts.join(' ');
            break;
          }
        }
      }
    }
  };

  parseFn('audio', this._selectedAudioCodec);
  parseFn('video', this._selectedVideoCodec);

  return sdpLines.join('\r\n');
};

/**
 * Function that modifies the session description to remove the previous experimental H264
 * codec that is apparently breaking connections.
 * NOTE: We should perhaps not remove it since H264 is supported?
 * @method _removeSDPFirefoxH264Pref
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._removeSDPFirefoxH264Pref = function(targetMid, sessionDescription) {
  Log.info(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
    'Removing Firefox experimental H264 flag to ensure interopability reliability']);

  return sessionDescription.sdp.replace(/a=fmtp:0 profile-level-id=0x42e00c;packetization-mode=1\r\n/g, '');
};

/**
 * Function that modifies the session description to append the MediaStream and MediaStreamTrack IDs that seems
 * to be missing from Firefox answer session description to Chrome connection causing freezes in re-negotiation.
 * @method _addSDPMediaStreamTrackIDs
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._addSDPMediaStreamTrackIDs = function (targetMid, sessionDescription) {
  var self = this;
  if (!(this._peerConnections[targetMid] && this._peerConnections[targetMid].getLocalStreams().length > 0)) {
    Log.log(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
      'Not enforcing MediaStream IDs as no Streams is sent.']);
    return sessionDescription.sdp;
  }

  var sessionDescriptionStr = sessionDescription.sdp;

  if (!this._enableIceTrickle) {
    sessionDescriptionStr = sessionDescriptionStr.replace(/a=end-of-candidates\r\n/g, '');
  }

  var sdpLines = sessionDescriptionStr.split('\r\n');
  var agent = ((this._peerInformations[targetMid] || {}).agent || {}).name || '';
  var localStream = this._peerConnections[targetMid].getLocalStreams()[0];
  var localStreamId = localStream.id || localStream.label;

  var parseFn = function (type, tracks) {
    if (tracks.length === 0) {
      Log.log(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
        'Not enforcing "' + type + '" MediaStreamTrack IDs as no Stream "' + type + '" tracks is sent.']);
      return;
    }

    var trackId = tracks[0].id || tracks[0].label;
    var trackLabel = tracks[0].label || 'Default';
    var ssrcId = null;
    var hasReachedType = false;

    // Get SSRC ID
    for (var i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].indexOf('m=' + type) === 0) {
        if (!hasReachedType) {
          hasReachedType = true;
          continue;
        } else {
          break;
        }
      }

      if (hasReachedType && sdpLines[i].indexOf('a=ssrc:') === 0) {
        ssrcId = (sdpLines[i].split(':')[1] || '').split(' ')[0] || null;

        var msidLine = 'a=ssrc:' + ssrcId + ' msid:' + localStreamId + ' ' + trackId;
        var mslabelLine = 'a=ssrc:' + ssrcId + ' mslabel:' + trackLabel;
        var labelLine = 'a=ssrc:' + ssrcId + ' label:' + trackLabel;

        if (sdpLines.indexOf(msidLine) === -1) {
          sdpLines.splice(i + 1, 0, msidLine);
          i++;
        }

        if (sdpLines.indexOf(mslabelLine) === -1) {
          sdpLines.splice(i + 1, 0, mslabelLine);
          i++;
        }

        if (sdpLines.indexOf(labelLine) === -1) {
          sdpLines.splice(i + 1, 0, labelLine);
          i++;
        }

        Log.info(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type, 'Updating MediaStreamTrack ssrc (' +
          ssrcId + ') for "' + localStreamId + '" stream and "' + trackId + '" (label:"' + trackLabel + '")']);

        break;
      }
    }
  };

  parseFn('audio', localStream.getAudioTracks());
  parseFn('video', localStream.getVideoTracks());

  // Append signaling of end-of-candidates
  if (!this._enableIceTrickle){
    Log.info(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
      'Appending end-of-candidates signal for non-trickle ICE connection.']);
    for (var i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].indexOf('a=candidate:') === 0) {
        if (sdpLines[i + 1] ? !(sdpLines[i + 1].indexOf('a=candidate:') === 0 ||
          sdpLines[i + 1].indexOf('a=end-of-candidates') === 0) : true) {
          sdpLines.splice(i + 1, 0, 'a=end-of-candidates');
          i++;
        }
      }
    }
  }

  if (sessionDescription.type === this.HANDSHAKE_PROGRESS.ANSWER && this._sdpSessions[targetMid]) {
    var bundleLineIndex = -1;
    var mLineIndex = -1;

    for (var j = 0; j < sdpLines.length; j++) {
      if (sdpLines[j].indexOf('a=group:BUNDLE') === 0 && this._sdpSessions[targetMid].remote.bundleLine) {
        sdpLines[j] = this._sdpSessions[targetMid].remote.bundleLine;
      } else if (sdpLines[j].indexOf('m=') === 0) {
        mLineIndex++;
        var compareA = sdpLines[j].split(' ');
        var compareB = (this._sdpSessions[targetMid].remote.mLines[mLineIndex] || '').split(' ');

        if (compareA[0] && compareB[0] && compareA[0] !== compareB[0]) {
          compareB[1] = 0;
          Log.info(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
            'Appending middle rejected m= line ->'], compareB.join(' '));
          sdpLines.splice(j, 0, compareB.join(' '));
          j++;
          mLineIndex++;
        }
      }
    }

    while (this._sdpSessions[targetMid].remote.mLines[mLineIndex + 1]) {
      mLineIndex++;
      var appendIndex = sdpLines.length;
      if (!sdpLines[appendIndex - 1].replace(/\s/gi, '')) {
        appendIndex -= 1;
      }
      var parts = (this._sdpSessions[targetMid].remote.mLines[mLineIndex] || '').split(' ');
      parts[1] = 0;
      Log.info(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
        'Appending later rejected m= line ->'], parts.join(' '));
      sdpLines.splice(appendIndex, 0, parts.join(' '));
    }
  }

  if (window.webrtcDetectedBrowser === 'edge' && sessionDescription.type === this.HANDSHAKE_PROGRESS.OFFER &&
    !sdpLines[sdpLines.length - 1].replace(/\s/gi, '')) {
    Log.info(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription',
      sessionDescription.type, 'Removing last empty space for Edge browsers']);
    sdpLines.splice(sdpLines.length - 1, 1);
  }

  return sdpLines.join('\r\n');
};

/**
 * Function that modifies the session description to remove VP9 and H264 apt/rtx lines to prevent plugin connection breaks.
 * @method _removeSDPH264VP9AptRtxForOlderPlugin
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._removeSDPH264VP9AptRtxForOlderPlugin = function (targetMid, sessionDescription) {
  var removeVP9AptRtxPayload = false;
  var agent = (this._peerInformations[targetMid] || {}).agent || {};

  if (agent.pluginVersion) {
    // 0.8.870 supports
    var parts = agent.pluginVersion.split('.');
    removeVP9AptRtxPayload = parseInt(parts[0], 10) >= 0 && parseInt(parts[1], 10) >= 8 &&
      parseInt(parts[2], 10) >= 870;
  }

  // Remove rtx or apt= lines that prevent connections for browsers without VP8 or VP9 support
  // See: https://bugs.chromium.org/p/webrtc/issues/detail?id=3962
  if (['chrome', 'opera'].indexOf(window.webrtcDetectedBrowser) > -1 && removeVP9AptRtxPayload) {
    Log.info(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
      'Removing VP9/H264 apt= and rtx payload lines causing connectivity issues']);

    sessionDescription.sdp = sessionDescription.sdp.replace(/a=rtpmap:\d+ rtx\/\d+\r\na=fmtp:\d+ apt=101\r\n/g, '');
    sessionDescription.sdp = sessionDescription.sdp.replace(/a=rtpmap:\d+ rtx\/\d+\r\na=fmtp:\d+ apt=107\r\n/g, '');
  }

  return sessionDescription.sdp;
};

/**
 * Function that modifies the session description to remove codecs.
 * @method _removeSDPCodecs
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._removeSDPCodecs = function (targetMid, sessionDescription) {
  var self = this;
  var audioSettings = this.getPeerInfo().settings.audio;

  var parseFn = function (type, codec) {
    var payloadList = sessionDescription.sdp.match(new RegExp('a=rtpmap:(\\d*)\\ ' + codec + '.*', 'gi'));

    if (!(Array.isArray(payloadList) && payloadList.length > 0)) {
      Log.warn(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
        'Not removing "' + codec + '" as it does not exists.']);
      return;
    }

    for (var i = 0; i < payloadList.length; i++) {
      var payload = payloadList[i].split(' ')[0].split(':')[1];

      Log.info(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
        'Removing "' + codec + '" payload ->'], payload);

      sessionDescription.sdp = sessionDescription.sdp.replace(
        new RegExp('a=rtpmap:' + payload + '\\ .*\\r\\n', 'g'), '');
      sessionDescription.sdp = sessionDescription.sdp.replace(
        new RegExp('a=fmtp:' + payload + '\\ .*\\r\\n', 'g'), '');
      sessionDescription.sdp = sessionDescription.sdp.replace(
        new RegExp('a=rtpmap:\\d+ rtx\\/\\d+\\r\\na=fmtp:\\d+ apt=' + payload + '\\r\\n', 'g'), '');

      // Remove the m-line codec
      var sdpLines = sessionDescription.sdp.split('\r\n');

      for (var j = 0; j < sdpLines.length; j++) {
        if (sdpLines[j].indexOf('m=' + type) === 0) {
          var parts = sdpLines[j].split(' ');

          if (parts.indexOf(payload) >= 3) {
            parts.splice(parts.indexOf(payload), 1);
          }

          sdpLines[j] = parts.join(' ');
          break;
        }
      }

      sessionDescription.sdp = sdpLines.join('\r\n');
    }
  };

  if (this._disableVideoFecCodecs) {
    if (this._hasMCU) {
      Log.warn(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
        'Not removing "ulpfec" or "red" codecs as connected to MCU to prevent connectivity issues.']);
    } else {
      parseFn('video', 'red');
      parseFn('video', 'ulpfec');
    }
  }

  if (this._disableComfortNoiseCodec && audioSettings && typeof audioSettings === 'object' && audioSettings.stereo) {
    parseFn('audio', 'CN');
  }

  return sessionDescription.sdp;
};

/**
 * Function that modifies the session description to remove REMB packets fb.
 * @method _removeSDPREMBPackets
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._removeSDPREMBPackets = function (targetMid, sessionDescription) {
  if (!this._disableREMB) {
    return sessionDescription.sdp;
  }

  Log.info(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type, 'Removing REMB packets.']);
  return sessionDescription.sdp.replace(/a=rtcp-fb:\d+ goog-remb\r\n/g, '');
};

/**
 * Function that retrieves the session description selected codec.
 * @method _getSDPSelectedCodec
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._getSDPSelectedCodec = function (targetMid, sessionDescription, type) {
  if (!(sessionDescription && sessionDescription.sdp)) {
    return null;
  }

  var sdpLines = sessionDescription.sdp.split('\r\n');
  var selectedCodecInfo = {
    name: null,
    implementation: null,
    clockRate: null,
    channels: null,
    payloadType: null,
    params: null
  };

  for (var i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].indexOf('m=' + type) === 0) {
      var parts = sdpLines[i].split(' ');

      if (parts.length < 4) {
        break;
      }

      selectedCodecInfo.payloadType = parseInt(parts[3], 10);

    } else if (selectedCodecInfo.payloadType !== null) {
      if (sdpLines[i].indexOf('m=') === 0) {
        break;
      }

      if (sdpLines[i].indexOf('a=rtpmap:' + selectedCodecInfo.payloadType + ' ') === 0) {
        var params = (sdpLines[i].split(' ')[1] || '').split('/');
        selectedCodecInfo.name = params[0] || '';
        selectedCodecInfo.clockRate = params[1] ? parseInt(params[1], 10) : null;
        selectedCodecInfo.channels = params[2] ? parseInt(params[2], 10) : null;

      } else if (sdpLines[i].indexOf('a=fmtp:' + selectedCodecInfo.payloadType + ' ') === 0) {
        selectedCodecInfo.params = sdpLines[i].split('a=fmtp:' + selectedCodecInfo.payloadType + ' ')[1] || null;
      }
    }
  }

  Log.debug(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
    'Parsing session description "' + type + '" codecs ->'], selectedCodecInfo);

  return selectedCodecInfo;
};

/**
 * Function that modifies the session description to remove non-relay ICE candidates.
 * @method _removeSDPFilteredCandidates
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._removeSDPFilteredCandidates = function (targetMid, sessionDescription) {
  // Handle Firefox MCU Peer ICE candidates
  if (targetMid === 'MCU' && sessionDescription.type === this.HANDSHAKE_PROGRESS.ANSWER &&
    window.webrtcDetectedBrowser === 'firefox') {
    sessionDescription.sdp = sessionDescription.sdp.replace(/ generation 0/g, '');
    sessionDescription.sdp = sessionDescription.sdp.replace(/ udp /g, ' UDP ');
  }

  if (this._forceTURN && this._hasMCU) {
    Log.warn(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type, 'Not filtering ICE candidates as ' +
      'TURN connections are enforced as MCU is present (and act as a TURN itself) so filtering of ICE candidate ' +
      'flags are not honoured']);
    return sessionDescription.sdp;
  }

  if (this._filterCandidatesType.host) {
    Log.info(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type, 'Removing "host" ICE candidates.']);
    sessionDescription.sdp = sessionDescription.sdp.replace(/a=candidate:.*host.*\r\n/g, '');
  }

  if (this._filterCandidatesType.srflx) {
    Log.info(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type, 'Removing "srflx" ICE candidates.']);
    sessionDescription.sdp = sessionDescription.sdp.replace(/a=candidate:.*srflx.*\r\n/g, '');
  }

  if (this._filterCandidatesType.relay) {
    Log.info(this._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type, 'Removing "relay" ICE candidates.']);
    sessionDescription.sdp = sessionDescription.sdp.replace(/a=candidate:.*relay.*\r\n/g, '');
  }

  // sessionDescription.sdp = sessionDescription.sdp.replace(/a=candidate:(?!.*relay.*).*\r\n/g, '');

  return sessionDescription.sdp;
};

/**
 * Function that retrieves the current list of support codecs.
 * @method _getCodecsSupport
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._getCodecsSupport = function (callback) {
  var self = this;

  if (self._currentCodecSupport) {
    callback(null);
  }

  self._currentCodecSupport = { audio: {}, video: {} };

  try {
    if (window.webrtcDetectedBrowser === 'edge') {
      var codecs = RTCRtpSender.getCapabilities().codecs;

      for (var i = 0; i < codecs.length; i++) {
        if (['audio','video'].indexOf(codecs[i].kind) > -1 && codecs[i].name) {
          var codec = codecs[i].name.toLowerCase();
          self._currentCodecSupport[codecs[i].kind][codec] = codecs[i].clockRate +
            (codecs[i].numChannels > 1 ? '/' + codecs[i].numChannels : '');
        }
      }
      // Ignore .fecMechanisms for now
      callback(null);

    } else {
      var pc = new RTCPeerConnection(null);
      var offerConstraints = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      };

      if (['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1) {
        offerConstraints = {
          mandatory: {
            OfferToReceiveVideo: true,
            OfferToReceiveAudio: true
          }
        };
      }

      pc.createOffer(function (offer) {
        var sdpLines = offer.sdp.split('\r\n');
        var mediaType = '';

        for (var i = 0; i < sdpLines.length; i++) {
          if (sdpLines[i].indexOf('m=') === 0) {
            mediaType = (sdpLines[i].split('m=')[1] || '').split(' ')[0];
          } else if (sdpLines[i].indexOf('a=rtpmap:') === 0) {
            if (['audio', 'video'].indexOf(mediaType) === -1) {
              continue;
            }
            var parts = (sdpLines[i].split(' ')[1] || '').split('/');
            var codec = (parts[0] || '').toLowerCase();
            var info = parts[1] + (parts[2] ? '/' + parts[2] : '');

            self._currentCodecSupport[mediaType][codec] = info;
          }
        }

        callback(null);

      }, function (error) {
        callback(error);
      }, offerConstraints);
    }
  } catch (error) {
    callback(error);
  }
};

/**
 * Function that modifies the session description to handle the connection settings.
 * This is experimental and never recommended to end-users.
 * @method _handleSDPConnectionSettings
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._handleSDPConnectionSettings = function (targetMid, sessionDescription, direction) {
  var self = this;

  if (!self._sdpSessions[targetMid]) {
    return sessionDescription.sdp;
  }

  var sessionDescriptionStr = sessionDescription.sdp;

  if (direction === 'remote' && !self.getPeerInfo(targetMid).config.enableIceTrickle) {
    sessionDescriptionStr = sessionDescriptionStr.replace(/a=end-of-candidates\r\n/g, '');
  }

  var sdpLines = sessionDescriptionStr.split('\r\n');
  var peerAgent = ((self._peerInformations[targetMid] || {}).agent || {}).name || '';
  var mediaType = '';
  var bundleLineIndex = -1;
  var bundleLineMids = [];
  var mLineIndex = -1;
  var settings = UtilsFactory.clone(self._sdpSettings);

  if (targetMid === 'MCU') {
    settings.connection.audio = true;
    settings.connection.video = true;
    settings.connection.data = true;
  }

  if (settings.video) {
    settings.connection.video = (window.webrtcDetectedBrowser === 'edge' && peerAgent !== 'edge') ||
      (['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1 && peerAgent === 'edge' ?
      !!self._currentCodecSupport.video.h264 : true);
  }

  if (self._hasMCU) {
    settings.direction.audio.receive = targetMid === 'MCU' ? false : true;
    settings.direction.audio.send = targetMid === 'MCU' ? true : false;
    settings.direction.video.receive = targetMid === 'MCU' ? false : true;
    settings.direction.video.send = targetMid === 'MCU' ? true : false;
  }

  // ANSWERER: Reject only the m= lines. Returned rejected m= lines as well.
  // OFFERER: Remove m= lines

  self._sdpSessions[targetMid][direction].mLines = [];
  self._sdpSessions[targetMid][direction].bundleLine = '';

  for (var i = 0; i < sdpLines.length; i++) {
    // Cache the a=group:BUNDLE line used for remote answer from Edge later
    if (sdpLines[i].indexOf('a=group:BUNDLE') === 0) {
      self._sdpSessions[targetMid][direction].bundleLine = sdpLines[i];
      bundleLineIndex = i;

    // Check if there's a need to reject m= line
    } else if (sdpLines[i].indexOf('m=') === 0) {
      mediaType = (sdpLines[i].split('m=')[1] || '').split(' ')[0] || '';
      mediaType = mediaType === 'application' ? 'data' : mediaType;
      mLineIndex++;

      self._sdpSessions[targetMid][direction].mLines[mLineIndex] = sdpLines[i];

      // Check if there is missing unsupported video codecs support and reject it regardles of MCU Peer or not
      if (!settings.connection[mediaType]) {
        Log.log(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
          'Removing rejected m=' + mediaType + ' line ->'], sdpLines[i]);

        // Check if answerer and we do not have the power to remove the m line if index is 0
        // Set as a=inactive because we do not have that power to reject it somehow..
        // first m= line cannot be rejected for BUNDLE
        if (bundleLineIndex > -1 && mLineIndex === 0 && (direction === 'remote' ?
          sessionDescription.type === this.HANDSHAKE_PROGRESS.OFFER :
          sessionDescription.type === this.HANDSHAKE_PROGRESS.ANSWER)) {
          Log.warn(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
            'Not removing rejected m=' + mediaType + ' line ->'], sdpLines[i]);
          settings.connection[mediaType] = true;
          if (['audio', 'video'].indexOf(mediaType) > -1) {
            settings.direction[mediaType].send = false;
            settings.direction[mediaType].receive = false;
          }
          continue;
        }

        if (direction === 'remote' || sessionDescription.type === this.HANDSHAKE_PROGRESS.ANSWER) {
          var parts = sdpLines[i].split(' ');
          parts[1] = 0;
          sdpLines[i] = parts.join(' ');
          continue;
        }
      }
    }

    if (direction === 'remote' && sdpLines[i].indexOf('a=candidate:') === 0 &&
      !self.getPeerInfo(targetMid).config.enableIceTrickle) {
      if (sdpLines[i + 1] ? !(sdpLines[i + 1].indexOf('a=candidate:') === 0 ||
        sdpLines[i + 1].indexOf('a=end-of-candidates') === 0) : true) {
        Log.info(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type,
          'Appending end-of-candidates signal for non-trickle ICE connection.']);
        sdpLines.splice(i + 1, 0, 'a=end-of-candidates');
        i++;
      }
    }

    if (mediaType) {
      // Remove lines if we are rejecting the media and ensure unless (rejectVideoMedia is true), MCU has to enable those m= lines
      if (!settings.connection[mediaType]) {
        sdpLines.splice(i, 1);
        i--;

      // Store the mids session description
      } else if (sdpLines[i].indexOf('a=mid:') === 0) {
        bundleLineMids.push(sdpLines[i].split('a=mid:')[1] || '');

      // Configure direction a=sendonly etc for local sessiondescription
      }  else if (direction === 'local' && mediaType && ['audio', 'video'].indexOf(mediaType) > -1 &&
        ['a=sendrecv', 'a=sendonly', 'a=recvonly'].indexOf(sdpLines[i]) > -1) {

        if (settings.direction[mediaType].send && !settings.direction[mediaType].receive) {
          sdpLines[i] = sdpLines[i].indexOf('send') > -1 ? 'a=sendonly' : 'a=inactive';
        } else if (!settings.direction[mediaType].send && settings.direction[mediaType].receive) {
          sdpLines[i] = sdpLines[i].indexOf('recv') > -1 ? 'a=recvonly' : 'a=inactive';
        } else if (!settings.direction[mediaType].send && !settings.direction[mediaType].receive) {
        // MCU currently does not support a=inactive flag.. what do we do here?
          sdpLines[i] = 'a=inactive';
        }

        // Handle Chrome bundle bug. - See: https://bugs.chromium.org/p/webrtc/issues/detail?id=6280
        if (!self._hasMCU && window.webrtcDetectedBrowser !== 'firefox' && peerAgent === 'firefox' &&
          sessionDescription.type === self.HANDSHAKE_PROGRESS.OFFER && sdpLines[i] === 'a=recvonly') {
          Log.warn(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription', sessionDescription.type, 'Overriding any original settings ' +
            'to receive only to send and receive to resolve chrome BUNDLE errors.']);
          sdpLines[i] = 'a=sendrecv';
          settings.direction[mediaType].send = true;
          settings.direction[mediaType].receive = true;
        }
      }
    }

    // Remove weird empty characters for Edge case.. :(
    if (!(sdpLines[i] || '').replace(/\n|\r|\s|\ /gi, '')) {
      sdpLines.splice(i, 1);
      i--;
    }
  }

  // Fix chrome "offerToReceiveAudio" local offer not removing audio BUNDLE
  if (bundleLineIndex > -1) {
    sdpLines[bundleLineIndex] = 'a=group:BUNDLE ' + bundleLineMids.join(' ');
  }

  // Append empty space below
  if (window.webrtcDetectedBrowser !== 'edge') {
    if (!sdpLines[sdpLines.length - 1].replace(/\n|\r|\s/gi, '')) {
      sdpLines[sdpLines.length - 1] = '';
    } else {
      sdpLines.push('');
    }
  }

  Log.info(self._debugOptions.instanceId, [targetMid, 'RTCSessionDesription',
    sessionDescription.type, 'Handling connection lines and direction ->'], settings);

  return sdpLines.join('\r\n');
};

/**
 * Function that parses and retrieves the session description fingerprint.
 * @method _getSDPFingerprint
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._getSDPFingerprint = function (targetMid, sessionDescription) {
  var fingerprint = {
    fingerprint: null,
    fingerprintAlgorithm: null,
    derBase64: null
  };

  if (!(sessionDescription && sessionDescription.sdp)) {
    return fingerprint;
  }

  var sdpLines = sessionDescription.sdp.split('\r\n');

  for (var i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].indexOf('a=fingerprint') === 0) {
      var parts = sdpLines[i].replace('a=fingerprint:', '').split(' ');
      fingerprint.fingerprint = parts[1];
      fingerprint.fingerprintAlgorithm = parts[0];
      break;
    }
  }

  return fingerprint;
};
