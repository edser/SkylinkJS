/**
 * + Factory that handles the Peer connection.
 */ 
var PeerFactory = function (peerId, mcuRelayed, listener) {
	var peer = {
		id: peerId,
		info: {},
		states: {
			iceGatheringState: 'new',
			remoteGathering: {
				expected: 0,
				current: 0,
				signalled: false,
				connection: { mids: [], iceUFrag: '', icePwd: '' }
			},
			stats: {}
		},
		stream: {
			current: {},
			remoteSessions: {},
			disableVideo: false
		},
		channels: {},
		candidates: {
			local: { host:[], srflx:[], relay:[] },
			remote: { host:[], srflx:[], relay:[] },
			buffered: []
		},
		stamps: {
			updateUserEvent: 0,
			muteAudioEvent: 0,
			muteVideoEvent: 0
		},
		connection: null,
		options: {}
	};

	/**
	 * - Function that listens to the RTCPeerConnection.onaddstream event.
	 */
	var onaddstreamEventFn = function () {
		return function (evt) {
			var stream = evt.stream || evt;
	    var streamId = stream.id || stream.label;

	    // Incorrect step as User should not receive Stream from MCU or when it's not trying to receive any Stream
	    if (peerId === 'MCU' || (!peer.options.mediaDirection.audio.receive &&
	    	!peer.options.mediaDirection.video.receive)) {
	    	return;
	    }

	    // Drop Stream for the dirty-hack fixes for Chrome offer to Firefox (inactive) | Ticket: ESS-680
	    if (!mcuRelayed && window.webrtcDetectedBrowser === 'firefox' &&
	    	peer.connection.getRemoteStreams().length > 1 && peer.connection.remoteDescription &&
	    	peer.connection.remoteDescription.sdp &&
	    	peer.connection.remoteDescription.sdp.indexOf(' msid:' + streamId + ' ') === -1) {
	    	return;
	    }

	    peer.stream.remoteSessions[streamId] = UtilsFactory.clone(peer.info.settings);

	    listener('peer:stream', {
	    	active: true,
	    	stream: stream,
	    	streamId: streamId,
	    	settings: peer.stream.remoteSessions[streamId]
	    });
		};
	};

	/**
	 * - Function that listens to the RTCPeerConnection.onicecandidate event.
	 */
	var onicecandidateEventFn = function () {
		return function (evt) {
			if (evt.candidate) {
				if (peer.states.iceGatheringState !== Skylink.prototype.CANDIDATE_GENERATION_STATE.GATHERING) {
					peer.states.iceGatheringState = Skylink.prototype.CANDIDATE_GENERATION_STATE.GATHERING;
					listener('peer:icegatheringstate', {
						state: Skylink.prototype.CANDIDATE_GENERATION_STATE.GATHERING
					});
				}

				var canType = evt.candidate.candidate.split(' ')[7];

				if (canType === 'endOfCandidates') {
					return;
				}

				if (peer.options.disableCandidates[canType] && !(mcuRelayed && canType === 'srflx')) {
					return;
				}

				peer.candidates.local[canType].push(evt.candidate);

				if (!peer.options.trickleIce) {
					return;
				}

				listener('peer:candidate', evt.candidate);
			} else {
				if (peer.states.iceGatheringState !== Skylink.prototype.CANDIDATE_GENERATION_STATE.COMPLETED) {
					peer.states.iceGatheringState = Skylink.prototype.CANDIDATE_GENERATION_STATE.COMPLETED;
					listener('peer:icegatheringstate', {
						state: Skylink.prototype.CANDIDATE_GENERATION_STATE.COMPLETED,
						length: peer.candidates.local.srflx.length +
	          	peer.candidates.local.host.length + peer.candidates.local.relay.length
					});
				}

				if (!peer.options.trickleIce) {
					listener('peer:' + peer.connection.localDescription.type, peer.connection.localDescription);
				}
			}
		};
  };

	/**
	 * - Function that listens to the RTCPeerConnection.onaddstream event.
	 */
	var ondatachannelEventFn = function () {
		return function (evt) {
			/*if (!peer.options.datachannel || !peer.info.config.enableDataChannel) {
				return;
			}

			var channel = evt.channel || evt;
			var channelProp = Object.keys(peer.channels).length === 0 ? 'main' : channel.label;

			peer.channels[channelProp] = DataChannelFactory(channel, {
				prop: channelProp,
				peerId: peerId,
				userId: options.userId,
				DTProtocolVersion: peer.info.agent.DTProtocolVersion
			}, function (eventName, data) {
				listener(eventName, data);
			});*/
		};
	};

	/**
	 * - Function that listens to the RTCPeerConnection.oniceconnectionstatechange event.
	 */
	var oniceconnectionstatechangeEventFn = function () {
		return function () {
			var iceConnectionState = peer.connection.iceConnectionState;

			if (window.webrtcDetectedBrowser === 'edge') {
	      if (iceConnectionState === 'connecting') {
	        iceConnectionState = Skylink.prototype.ICE_CONNECTION_STATE.CHECKING;
	      } else if (iceConnectionState === 'new') {
	        iceConnectionState = Skylink.prototype.ICE_CONNECTION_STATE.FAILED;
	      }
	    }

	    listener('peer:iceconnectionstate', {
	    	state: iceConnectionState,
	    	timestamp: Date.now()
	    });

	    // Users can decide to disable trickle ICE for now??
	    if (iceConnectionState === Skylink.prototype.ICE_CONNECTION_STATE.FAILED && peer.options.trickleIce) {
	      listener('peer:iceconnectionstate', {
		    	state: Skylink.prototype.ICE_CONNECTION_STATE.TRICKLE_FAILED,
		    	timestamp: Date.now()
		    });
	    }
		};
	};

	/**
	 * - Function that listens to the RTCPeerConnection.onsignalingstatechange event.
	 */
	var onsignalingstatechangeEventFn = function () {
		return function () {
			listener('peer:signalingstate', {
				state: peer.connection.iceConnectionState,
				timestamp: Date.now()
			});
		};
	};

	return {
		/**
		 * + Function that starts the Peer connection.
		 */
		start: function (iceServers, options) {
			peer.options = options;

			try {
				peer.connection = new RTCPeerConnection({
					iceServers: iceServers,
		      iceTransportPolicy: options.disableCandidates.host && options.disableCandidates.srflx &&
		        !options.disableCandidates.relay ? 'relay' : 'all',
		      bundlePolicy: 'max-bundle',
		      rtcpMuxPolicy: 'require'
		    }, {
		      optional: [
		        { DtlsSrtpKeyAgreement: true },
		        { googIPv6: true }
		      ]
		    });
		  } catch (error) {
		  	return listener('peer:handshakeprogress', {
		  		state: Skylink.prototype.HANDSHAKE_PROGRESS.ERROR,
		  		error: error
		  	});
		  }

	    peer.connection.onaddstream = onaddstreamEventFn();
	    peer.connection.onicecandidate = onicecandidateEventFn();
	    peer.connection.ondatachannel = ondatachannelEventFn();
	    peer.connection.oniceconnectionstatechange = oniceconnectionstatechangeEventFn();
	    peer.connection.onsignalingstatechange = onsignalingstatechangeEventFn();
		},

		/**
		 * + Function that starts the offer handshake step.
		 */
		stepAtOffer: function (stream, iceRestart) {
			if (!peer.connection) {
				return;
			}

			var constraints = {
				offerToReceiveVideo: !peer.options.mediaConnection.video && peerId !== 'MCU',
				offerToReceiveAudio: !peer.options.mediaConnection.audio && peerId !== 'MCU'
			};

			/*if (Object.keys(peer.channels).length === 0 && peer.options.datachannel && peer.info.config.enableDataChannel) {
				try {
					var channelName = peerId + '_' + peer.options.userId;
					var channel = peer.connection.createDataChannel(channelName, {
						reliable: true,
						ordered: true
					});

					peers.channels.main = DataChannelFactory(channel, {
						prop: channelProp,
						peerId: peerId,
						userId: options.userId,
						DTProtocolVersion: peer.info.agent.DTProtocolVersion
					}, function (eventName, data) {
						listener(eventName, data);
					});
				} catch (error) {
					listener('channel:state', {
						state: Skylink.prototype.DATA_CHANNEL_STATE.CREATE_ERROR,
						error: error,
						channelName: channelName,
						channelType: Skylink.prototype.DATA_CHANNEL_TYPE.MESSAGING
					});
				}
			}*/

			peer.connection.createOffer(function (offer) {
				/* offer.sdp = SDPFactory(offer, false, peer.options);*/
				peer.connection.setLocalDescription(offer, function () {
					listener('peer:handshakeprogress', {
						state: Skylink.prototype.HANDSHAKE_PROGRESS.OFFER
					});
					listener('peer:offer', offer);
				}, function (error) {
					listener('peer:handshakeprogress', {
						state: Skylink.prototype.HANDSHAKE_PROGRESS.ERROR,
						error: error,
						type: Skylink.prototype.HANDSHAKE_PROGRESS.OFFER
					});
				});
			}, function (error) {
				listener('peer:handshakeprogress', {
					state: Skylink.prototype.HANDSHAKE_PROGRESS.ERROR,
					error: error,
					type: Skylink.prototype.HANDSHAKE_PROGRESS.OFFER
				});
			}, constraints);
		},

		/**
		 * + Function that starts the answers handshake step.
		 */
		stepAtAnswer: function (offer, stream) {
			if (!peer.connection) {
				return;
			}

			//offer.sdp = offer.sdp = SDPFactory(offer, true, peer.options);

			peer.setRemoteDescription(offer, function () {
				listener('peer:handshakeprogress', {
					state: Skylink.prototype.HANDSHAKE_PROGRESS.OFFER
				});
				peer.connection.createAnswer(function (answer) {
					/* answer.sdp = SDPFactory(answer, false, peer.options);*/
					peer.connection.setLocalDescription(answer, function () {
						listener('peer:handshakeprogress', {
							state: Skylink.prototype.HANDSHAKE_PROGRESS.ANSWER
						});
						listener('peer:answer', answer);
					}, function (error) {
						listener('peer:handshakeprogress', {
							state: Skylink.prototype.HANDSHAKE_PROGRESS.ERROR,
							error: error,
							type: Skylink.prototype.HANDSHAKE_PROGRESS.ANSWER
						});
					});
				}, function (error) {
					listener('peer:handshakeprogress', {
						state: Skylink.prototype.HANDSHAKE_PROGRESS.ERROR,
						error: error,
						type: Skylink.prototype.HANDSHAKE_PROGRESS.ANSWER
					});
				});
			}, function (error) {
				listener('peer:handshakeprogress', {
					state: Skylink.prototype.HANDSHAKE_PROGRESS.ERROR,
					error: error,
					type: Skylink.prototype.HANDSHAKE_PROGRESS.OFFER
				});
			});
		},

		/**
		 * + Function that completes the handshake steps.
		 */
		stepAtComplete: function (answer) {
			if (!peer.connection) {
				return;
			}

			//offer.sdp = offer.sdp = SDPFactory(offer, true, peer.options);

			peer.setRemoteDescription(answer, function () {
				listener('peer:handshakeprogress', {
					state: Skylink.prototype.HANDSHAKE_PROGRESS.ANSWER
				});
			}, function (error) {
				listener('peer:handshakeprogress', {
					state: Skylink.prototype.HANDSHAKE_PROGRESS.ERROR,
					error: error,
					type: Skylink.prototype.HANDSHAKE_PROGRESS.ANSWER
				});
			});
		},

		/**
		 * + Function that adds the remote ICE candidate.
		 *   Give `{ length: xx, candidate: null }` to indicate completion of remote ICE gathering.
		 */
		addCandidate: function (candidate) {
			if (candidate.candidate) {
				if (!(peer.connection && peer.connection.remoteDescription && peer.connection.remoteDescription.sdp)) {
					peer.candidates.buffered.push(candidate);
				}
			} else {
				peer.states.remoteGathering.expected = candidates.length;

				if (candidates.length === (peer.candidates.remote.host + peer.candidates.remote.srflx +
					peer.candidates.remote.relay)) {
				}
			}
		},

		/**
		 * + Function that returns Peer connection stats.
		 */
		getStats: function () {
		},

		/**
		 * + Function that updates Peer connection ICE servers.
		 */
		updateIce: function (iceServers) {
			try {
				peer.connection[typeof peer.connection.setConfiguration === 'function' ? 'setConfiguration' : 'updateIce']({
					iceServers: iceServers,
		      iceTransportPolicy: options.disableCandidates.host && options.disableCandidates.srflx &&
		        !options.disableCandidates.relay ? 'relay' : 'all',
		      bundlePolicy: 'max-bundle',
		      rtcpMuxPolicy: 'require'
				});
			} catch (e) {
				return e;
			}
		},

		/**
		 * + Function that sets the Peer status.
		 */
		setState: function (params) {
			if (['muteAudioEvent', 'muteVideoEvent', 'updateUserEvent', 'stream'].indexOf(params) > -1) {
				if (typeof params.stamp === 'number') {
					// Outdated event, ignore.
					if (params.stamp <= peer.stamps[params.type]) {
						return;
					} else {
						peer.stamps[params.type] = params.stamp;
					}
				}

				if (params.type === 'muteVideoEvent') {
					peer.info.mediaStatus.videoMuted = params.muted;
					listener('peer:updated');
				} else if (params.type === 'muteAudioEvent') {
					peer.info.mediaStatus.audioMuted = params.muted;
					listener('peer:updated');
				} else if (params.type === 'updateUserEvent') {
					peer.info.userData = typeof params.userData !== 'undefined' ? params.userData : '';
					listener('peer:updated');
				} else {
					if (params.status === 'ended' && params.streamId) {
						var session = params.settings && typeof params.settings === 'object' ? 
							params.settings : peer.stream.remoteSessions[params.streamId];
						listener('peer:stream', {
							active: false,
							streamId: params.streamId,
							stream: null,
							settings: session
						});
					}
				}
				return;
			}

			if (['welcome', 'enter', 'restart'].indexOf(params.type) > -1) {
				peer.info.agent = {
					name: params.agent && typeof params.agent === 'string' ? params.agent : 'other',
					version: 0,
					os: params.os && typeof params.os === 'string' ? params.os : '',
					pluginVersion: params.temasysPluginVersion && typeof params.temasysPluginVersion === 'string' ?
						params.temasysPluginVersion : null,
    			SMProtocolVersion: params.SMProtocolVersion && typeof params.SMProtocolVersion === 'string' ?
      			params.SMProtocolVersion : '0.1.1',
    			DTProtocolVersion: params.DTProtocolVersion && typeof params.DTProtocolVersion === 'string' ?
      			params.DTProtocolVersion : (peerId === 'MCU' ? '0.1.2' : '0.1.0')
				};
				peer.info.config = {
					enableIceTrickle: params.enableIceTrickle !== false,
			    enableIceRestart: params.enableIceRestart === true,
			    enableDataChannel: params.enableDataChannel !== false,
			    priorityWeight: typeof params.weight === 'number' ? params.weight : 0,
			    receiveOnly: params.receiveOnly === true,
			    publishOnly: !!params.publishOnly
				};
				peer.info.parentId = params.parentId || null;

				// E.g. 0.9.6, replace minor "." with 0
	      if (message.version && typeof message.version === 'string') {
	        if (message.version.indexOf('.') > -1) {
	        	var parts = message.version.split('.');
		        if (parts.length > 2) {
		          var majorVer = parts[0] || '0';
		          parts.splice(0, 1);
		          peer.info.agent.version = parseFloat(majorVer + '.' + parts.join('0'), 10) || 0;
		        }
		        peer.info.agent.version =  parseFloat(message.version || '0', 10) || 0;
		      } else {
		      	peer.info.agent.version = parseInt(message.version || '0', 10);
		      }
	      }
			}

			if (params.userInfo && typeof params.userInfo === 'object') {
				peer.info.settings = params.userInfo.settings || { audio: false, video: false };
				peer.info.mediaStatus = params.userInfo.mediaStatus || { audioMuted: true, videoMuted: true };
			} else if (['offer', 'answer'].indexOf(params.type) > -1) {
				return;
			}

			if (['restart', 'offer', 'answer'].indexOf(params.type) > -1) {
				listener('peer:updated');
			} else {
				listener('peer:joined');
			}
		}
	};
};