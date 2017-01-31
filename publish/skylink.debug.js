/*! skylinkjs - v0.6.17 - Wed Feb 01 2017 01:24:15 GMT+0800 (SGT) */

(function(refThis) {

'use strict';

/**
 * Polyfill for Object.keys() from Mozilla
 * From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
 */
if (!Object.keys) {
  Object.keys = (function() {
    var hasOwnProperty = Object.prototype.hasOwnProperty,
      hasDontEnumBug = !({
        toString: null
      }).propertyIsEnumerable('toString'),
      dontEnums = [
        'toString',
        'toLocaleString',
        'valueOf',
        'hasOwnProperty',
        'isPrototypeOf',
        'propertyIsEnumerable',
        'constructor'
      ],
      dontEnumsLength = dontEnums.length;

    return function(obj) {
      if (typeof obj !== 'object' && typeof obj !== 'function' || obj === null) throw new TypeError('Object.keys called on non-object');

      var result = [];

      for (var prop in obj) {
        if (hasOwnProperty.call(obj, prop)) result.push(prop);
      }

      if (hasDontEnumBug) {
        for (var i = 0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) result.push(dontEnums[i]);
        }
      }
      return result;
    }
  })()
}

/**
 * Polyfill for Date.getISOString() from Mozilla
 * From https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
 */
(function() {
  function pad(number) {
    if (number < 10) {
      return '0' + number;
    }
    return number;
  }

  Date.prototype.toISOString = function() {
    return this.getUTCFullYear() +
      '-' + pad(this.getUTCMonth() + 1) +
      '-' + pad(this.getUTCDate()) +
      'T' + pad(this.getUTCHours()) +
      ':' + pad(this.getUTCMinutes()) +
      ':' + pad(this.getUTCSeconds()) +
      '.' + (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
      'Z';
  };
})();

/**
 * Polyfill for addEventListener() from Eirik Backer @eirikbacker (github.com).
 * From https://gist.github.com/eirikbacker/2864711
 * MIT Licensed
 */
(function(win, doc){
  if(win.addEventListener) return; //No need to polyfill

  function docHijack(p){var old = doc[p];doc[p] = function(v){ return addListen(old(v)) }}
  function addEvent(on, fn, self){
    return (self = this).attachEvent('on' + on, function(e){
      var e = e || win.event;
      e.preventDefault  = e.preventDefault  || function(){e.returnValue = false}
      e.stopPropagation = e.stopPropagation || function(){e.cancelBubble = true}
      fn.call(self, e);
    });
  }
  function addListen(obj, i){
    if(i = obj.length)while(i--)obj[i].addEventListener = addEvent;
    else obj.addEventListener = addEvent;
    return obj;
  }

  addListen([doc, win]);
  if('Element' in win)win.Element.prototype.addEventListener = addEvent; //IE8
  else{                                     //IE < 8
    doc.attachEvent('onreadystatechange', function(){addListen(doc.all)}); //Make sure we also init at domReady
    docHijack('getElementsByTagName');
    docHijack('getElementById');
    docHijack('createElement');
    addListen(doc.all);
  }
})(window, document);

/**
 * Global function that clones an object.
 */
var clone = function (obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  var copy = function (data) {
    var copy = data.constructor();
    for (var attr in data) {
      if (data.hasOwnProperty(attr)) {
        copy[attr] = data[attr];
      }
    }
    return copy;
  };

  if (typeof obj === 'object' && !Array.isArray(obj)) {
    try {
      return JSON.parse( JSON.stringify(obj) );
    } catch (err) {
      return copy(obj);
    }
  }

  return copy(obj);
};

/**
 * <h2>Prerequisites on using Skylink</h2>
 * Before using any Skylink functionalities, you will need to authenticate your App Key using
 *   the <a href="#method_init">`init()` method</a>.
 *
 * To manage or create App Keys, you may access the [Skylink Developer Portal here](https://console.temasys.io).
 *
 * To view the list of supported browsers, visit [the list here](
 * https://github.com/Temasys/SkylinkJS#supported-browsers).
 *
 * Here are some articles to help you get started:
 * - [How to setup a simple video call](https://temasys.com.sg/getting-started-with-webrtc-and-skylinkjs/)
 * - [How to setup screensharing](https://temasys.com.sg/screensharing-with-skylinkjs/)
 * - [How to create a chatroom like feature](https://temasys.com.sg/building-a-simple-peer-to-peer-webrtc-chat/)
 *
 * Here are some demos you may use to aid your development:
 * - Getaroom.io [[Demo](https://getaroom.io) / [Source code](https://github.com/Temasys/getaroom)]
 * - Creating a component [[Link](https://github.com/Temasys/skylink-call-button)]
 *
 * You may see the example below in the <a href="#">Constructor tab</a> to have a general idea how event subscription
 *   and the ordering of <a href="#method_init"><code>init()</code></a> and
 *   <a href="#method_joinRoom"><code>joinRoom()</code></a> methods should be called.
 *
 * If you have any issues, you may find answers to your questions in the FAQ section on [our support portal](
 * http://support.temasys.io), asks questions, request features or raise bug tickets as well.
 *
 * If you would like to contribute to our Temasys SkylinkJS codebase, see [the contributing README](
 * https://github.com/Temasys/SkylinkJS/blob/master/CONTRIBUTING.md).
 *
 * [See License (Apache 2.0)](https://github.com/Temasys/SkylinkJS/blob/master/LICENSE)
 *
 * @class Skylink
 * @constructor
 * @example
 *   // Here's a simple example on how you can start using Skylink.
 *   var skylinkDemo = new Skylink();
 *
 *   // Subscribe all events first as a general guideline
 *   skylinkDemo.on("incomingStream", function (peerId, stream, peerInfo, isSelf) {
 *     if (isSelf) {
 *       attachMediaStream(document.getElementById("selfVideo"), stream);
 *     } else {
 *       var peerVideo = document.createElement("video");
 *       peerVideo.id = peerId;
 *       peerVideo.autoplay = "autoplay";
 *       document.getElementById("peersVideo").appendChild(peerVideo);
 *       attachMediaStream(peerVideo, stream);
 *     }
 *   });
 *
 *   skylinkDemo.on("peerLeft", function (peerId, peerInfo, isSelf) {
 *     if (!isSelf) {
 *       var peerVideo = document.getElementById(peerId);
 *       // do a check if peerVideo exists first
 *       if (peerVideo) {
 *         document.getElementById("peersVideo").removeChild(peerVideo);
 *       } else {
 *         console.error("Peer video for " + peerId + " is not found.");
 *       }
 *     }
 *   });
 *
 *  // init() should always be called first before other methods other than event methods like on() or off().
 *  skylinkDemo.init("YOUR_APP_KEY_HERE", function (error, success) {
 *    if (success) {
 *      skylinkDemo.joinRoom("my_room", {
 *        userData: "My Username",
 *        audio: true,
 *        video: true
 *      });
 *    }
 *  });
 * @for Skylink
 * @since 0.5.0
 */
function Skylink() {
  /**
   * Stores the `init()` method options.
   * @attribute _options
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.18
   */
  this._options = {};

  /**
   * Stores the User session.
   * @attribute _user
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.5.6
   */
  this._user = {
    id: null,
    data: '',
    priorityWeight: 0,
    iceServers: [],
    timestamps: {
      updateUserEvent: 0,
      muteAudioEvent: 0,
      muteVideoEvent: 0
    },
    mutedStreams: {
      audio: false,
      video: false
    },
    room: {
      name: null,
      readyState: null,
      connected: false,
      locked: false,
      hasMCU: false,
      session: null,
      path: null,
      protocol: null
    },
    settings: {
      mediaConnection: {
        audio: true,
        video: true,
        data: true
      },
      mediaDirection: {
        audio: { send: true, receive: true },
        video: { send: true, receive: true }
      },
      bandwidth: {
        max: {},
        xVideoCodec: {}
      }
    }
  };

  /**
   * Stores the Socket connection.
   * @attribute _socket
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.1.0
   */
  this._socket = {
    connected: false,
    pollDead: false,
    socket: null,
    server: 'signaling.temasys.io',
    ports: {
      'https:': [443, 3443],
      'http:': [80, 3000]
    },
    session: {
      path: null,
      options: null,
      retries: 0,
      finalAttempts: 0,
      port: null,
      protocol: null,
      transportType: 'WebSocket'
    },
    queue: {
      fn: null,
      interval: 1000,
      throughput: 16,
      messages: [],
      timestamp: null,
      types: ['muteAudioEvent', 'muteVideoEvent', 'public', 'stream']
    }
  };

  /**
   * Stores the list of Peer Datachannel connections.
   * @attribute _dataChannels
   * @param {JSON} #peerId The list of Datachannels associated with Peer ID.
   * @param {RTCDataChannel} #peerId.#channelLabel The Datachannel connection.
   *   The property name <code>"main"</code> is reserved for messaging Datachannel type.
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.2.0
   */
  this._dataChannels = {};

  /**
   * Stores the list of data transfers from / to Peers.
   * @attribute _dataTransfers
   * @param {JSON} #transferId The data transfer session.
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.16
   */
  this._dataTransfers = {};

  /**
   * Stores the list of buffered ICE candidates that is received before
   *   remote session description is received and set.
   * @attribute _peerCandidatesQueue
   * @param {Array} <#peerId> The list of the Peer connection buffered ICE candidates received.
   * @param {Object} <#peerId>.<#index> The Peer connection buffered ICE candidate received.
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.5.1
   */
  this._peerCandidatesQueue = {};

  /**
   * Stores the list of ICE candidates received before signaling end.
   * @attribute _peerEndOfCandidatesCounter
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.16
   */
  this._peerEndOfCandidatesCounter = {};

  /**
   * Stores the list of Peer connection ICE candidates.
   * @attribute _gatheredCandidates
   * @param {JSON} <#peerId> The list of the Peer connection ICE candidates.
   * @param {JSON} <#peerId>.sending The list of the Peer connection ICE candidates sent.
   * @param {JSON} <#peerId>.receiving The list of the Peer connection ICE candidates received.
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.14
   */
  this._gatheredCandidates = {};

  /**
   * Stores the global number of Peer connection retries that would increase the wait-for-response timeout
   *   for the Peer connection health timer.
   * @attribute _retryCounters
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.5.10
   */
  this._retryCounters = {};

  /**
   * Stores the list of the Peer connections.
   * @attribute _peerConnections
   * @param {Object} <#peerId> The Peer connection.
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.1.0
   */
  this._peerConnections = {};

  /**
   * Stores the list of the Peer connections stats.
   * @attribute _peerStats
   * @param {Object} <#peerId> The Peer connection stats.
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.16
   */
  this._peerStats = {};

  /**
   * Stores the list of Peers session information.
   * @attribute _peerInformations
   * @param {JSON} <#peerId> The Peer session information.
   * @param {JSON|String} <#peerId>.userData The Peer custom data.
   * @param {JSON} <#peerId>.settings The Peer streaming information.
   * @param {JSON} <#peerId>.mediaStatus The Peer streaming muted status.
   * @param {JSON} <#peerId>.agent The Peer agent information.
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.3.0
   */
  this._peerInformations = {};

  /**
   * Stores the list of Peers retrieved from the Signaling from <code>getPeers()</code> method.
   * @attribute _peerList
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.1
   */
  this._peerList = null;

  /**
   * Stores the list of <code>on()</code> event handlers.
   * @attribute _EVENTS
   * @param {Array} <#event> The list of event handlers associated with the event.
   * @param {Function} <#event>.<#index> The event handler function.
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.5.2
   */
  this._EVENTS = {};

  /**
   * Stores the list of <code>once()</code> event handlers.
   * These events are only triggered once.
   * @attribute _onceEvents
   * @param {Array} <#event> The list of event handlers associated with the event.
   * @param {Array} <#event>.<#index> The array of event handler function and its condition function.
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.5.4
   */
  this._onceEvents = {};

  /**
   * Stores the timestamps data used for throttling.
   * @attribute _timestamp
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.5.8
   */
  this._timestamp = {
    socketMessage: null,
    shareScreen: null,
    refreshConnection: null,
    getUserMedia: null,
    lastRestart: null
  };

  /**
   * Stores the value if ICE restart is supported.
   * @attribute _enableIceRestart
   * @type String
   * @private
   * @for Skylink
   * @since 0.6.16
   */
  this._enableIceRestart = window.webrtcDetectedBrowser === 'firefox' ?
    window.webrtcDetectedVersion >= 48 : true;

  /**
   * Stores the list of Peer messages timestamp.
   * @attribute _peerMessagesStamps
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.15
   */
  this._peerMessagesStamps = {};

  /**
   * Stores the Streams.
   * @attribute _streams
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.15
   */
  this._streams = {
    userMedia: null,
    screenshare: null
  };

  /**
   * Stores the default camera Stream settings.
   * @attribute _streamsDefaultSettings
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.15
   */
  this._streamsDefaultSettings = {
    userMedia: {
      audio: {
        stereo: false
      },
      video: {
        resolution: {
          width: 640,
          height: 480
        },
        frameRate: 50
      }
    },
    screenshare: {
      video: true
    }
  };

  /**
   * Stores all the Stream required muted settings.
   * @attribute _streamsMutedSettings
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.15
   */
  this._streamsMutedSettings = {
    audioMuted: false,
    videoMuted: false
  };

  /**
   * Stores all the Stream sending maximum bandwidth settings.
   * @attribute _streamsBandwidthSettings
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.15
   */
  this._streamsBandwidthSettings = {
    googleX: {},
    bAS: {}
  };

  /**
   * Stores all the Stream stopped callbacks.
   * @attribute _streamsStoppedCbs
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.15
   */
  this._streamsStoppedCbs = {};

  /**
   * Stores all the Stream sessions.
   * Defined as <code>false</code> when Stream has already ended.
   * @attribute _streamsSession
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.15
   */
  this._streamsSession = {};

  /**
   * Stores the session description settings.
   * @attribute _sdpSettings
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.16
   */
  this._sdpSettings = {
    connection: {
      audio: true,
      video: true,
      data: true
    },
    direction: {
      audio: { send: true, receive: true },
      video: { send: true, receive: true }
    }
  };

  /**
   * Stores the list of recordings.
   * @attribute _recordings
   * @type JSON
   * @private
   * @beta
   * @for Skylink
   * @since 0.6.16
   */
  this._recordings = {};

  /**
   * Stores the current active recording session ID.
   * There can only be 1 recording session at a time in a Room
   * @attribute _currentRecordingId
   * @type JSON
   * @private
   * @beta
   * @for Skylink
   * @since 0.6.16
   */
  this._currentRecordingId = false;

  /**
   * Stores the recording session timeout to ensure 4 seconds has been recorded.
   * @attribute _recordingStartInterval
   * @type JSON
   * @private
   * @beta
   * @for Skylink
   * @since 0.6.16
   */
  this._recordingStartInterval = null;

  /**
   * Stores the currently supported codecs.
   * @attribute _currentCodecSupport
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.18
   */
  this._currentCodecSupport = null;

  /**
   * Stores the session description orders and info.
   * @attribute _sdpSessions
   * @type JSON
   * @private
   * @for Skylink
   * @since 0.6.18
   */
  this._sdpSessions = {};
}
Skylink.prototype.DATA_CHANNEL_STATE = {
  CONNECTING: 'connecting',
  OPEN: 'open',
  CLOSING: 'closing',
  CLOSED: 'closed',
  ERROR: 'error',
  CREATE_ERROR: 'createError',
  BUFFERED_AMOUNT_LOW: 'bufferedAmountLow',
  SEND_MESSAGE_ERROR: 'sendMessageError'
};

/**
 * The list of Datachannel types.
 * @attribute DATA_CHANNEL_TYPE
 * @param {String} MESSAGING <small>Value <code>"messaging"</code></small>
 *   The value of the Datachannel type that is used only for messaging in
 *   <a href="#method_sendP2PMessage"><code>sendP2PMessage()</code> method</a>.
 *   <small>However for Peers that do not support simultaneous data transfers, this Datachannel
 *   type will be used to do data transfers (1 at a time).</small>
 *   <small>Each Peer connections will only have one of this Datachannel type and the
 *   connection will only close when the Peer connection is closed (happens when <a href="#event_peerConnectionState">
 *   <code>peerConnectionState</code> event</a> triggers parameter payload <code>state</code> as
 *   <code>CLOSED</code> for Peer).</small>
 * @param {String} DATA <small>Value <code>"data"</code></small>
 *   The value of the Datachannel type that is used only for a data transfer in
 *   <a href="#method_sendURLData"><code>sendURLData()</code> method</a> and
 *   <a href="#method_sendBlobData"><code>sendBlobData()</code> method</a>.
 *   <small>The connection will close after the data transfer has been completed or terminated (happens when
 *   <a href="#event_dataTransferState"><code>dataTransferState</code> event</a> triggers parameter payload
 *   <code>state</code> as <code>DOWNLOAD_COMPLETED</code>, <code>UPLOAD_COMPLETED</code>,
 *   <code>REJECTED</code>, <code>CANCEL</code> or <code>ERROR</code> for Peer).</small>
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype.DATA_CHANNEL_TYPE = {
  MESSAGING: 'messaging',
  DATA: 'data'
};

/**
 * The list of Datachannel sending message error types.
 * @attribute DATA_CHANNEL_MESSAGE_ERROR
 * @param {String} MESSAGE     <small>Value <code>"message"</code></small>
 *   The value of the Datachannel sending message error type when encountered during
 *   sending P2P message from <a href="#method_sendP2PMessage"><code>sendP2PMessage()</code> method</a>.
 * @param {String} TRANSFER    <small>Value <code>"transfer"</code></small>
 *   The value of the Datachannel sending message error type when encountered during
 *   data transfers from <a href="#method_sendURLData"><code>sendURLData()</code> method</a> or
 *   <a href="#method_sendBlobData"><code>sendBlobData()</code> method</a>.
 * @param {String} STREAM_DATA <small>Value <code>"data"</code></small>
 *   The value of the Datachannel sending message error type when encountered during
 *   stream data chunks from <a href="#method_streamData"><code>treamData()</code> method</a>.
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype.DATA_CHANNEL_MESSAGE_ERROR = {
  MESSAGE: 'message',
  TRANSFER: 'transfer',
  STREAM_DATA: 'data'
};

/**
 * Function that starts a Datachannel connection with Peer.
 * @method _createDataChannel
 * @private
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._createDataChannel = function(peerId, dataChannel, createAsMessagingChannel) {
  var self = this;

  if (!self._user.room.connected) {
    log.error([peerId, 'RTCDataChannel', null,
      'Aborting of creating or initializing Datachannel as User does not have Room session']);
    return;
  }

  if (!(self._peerConnections[peerId] &&
    self._peerConnections[peerId].signalingState !== self.PEER_CONNECTION_STATE.CLOSED)) {
    log.error([peerId, 'RTCDataChannel', null,
      'Aborting of creating or initializing Datachannel as Peer connection does not exists']);
    return;
  }

  var channelName = self._user.id + '_' + peerId;
  var channelType = createAsMessagingChannel ? self.DATA_CHANNEL_TYPE.MESSAGING : self.DATA_CHANNEL_TYPE.DATA;

  if (dataChannel && typeof dataChannel === 'object') {
    channelName = dataChannel.label;

  } else if (typeof dataChannel === 'string') {
    channelName = dataChannel;
    dataChannel = null;
  }

  if (!dataChannel) {
    try {
      dataChannel = self._peerConnections[peerId].createDataChannel(channelName, {
        reliable: true,
        ordered: true
      });

    } catch (error) {
      log.error([peerId, 'RTCDataChannel', channelName, 'Failed creating Datachannel ->'], error);
      self._trigger('dataChannelState', self.DATA_CHANNEL_STATE.CREATE_ERROR, peerId, error, channelName, channelType, null);
      return;
    }
  }

  if (!self._dataChannels[peerId]) {
    log.debug([peerId, 'RTCDataChannel', channelName, 'initializing main DataChannel']);

    channelType = self.DATA_CHANNEL_TYPE.MESSAGING;

    self._dataChannels[peerId] = {};

  } else if (self._dataChannels[peerId].main && self._dataChannels[peerId].main.channel.label === channelName) {
    channelType = self.DATA_CHANNEL_TYPE.MESSAGING;
  }

  /**
   * Subscribe to events
   */
  dataChannel.onerror = function (evt) {
    var channelError = evt.error || evt;

    log.error([peerId, 'RTCDataChannel', channelName, 'Datachannel has an exception ->'], channelError);

    self._trigger('dataChannelState', self.DATA_CHANNEL_STATE.ERROR, peerId, channelError, channelName, channelType, null);
  };

  dataChannel.onbufferedamountlow = function () {
    log.debug([peerId, 'RTCDataChannel', channelName, 'Datachannel buffering data transfer low']);

    // TODO: Should we add an event here
    self._trigger('dataChannelState', self.DATA_CHANNEL_STATE.BUFFERED_AMOUNT_LOW, peerId, null, channelName, channelType, null);
  };

  dataChannel.onmessage = function(event) {
    self._processDataChannelData(event.data, peerId, channelName, channelType);
  };

  var onOpenHandlerFn = function () {
    log.debug([peerId, 'RTCDataChannel', channelName, 'Datachannel has opened']);

    self._trigger('dataChannelState', self.DATA_CHANNEL_STATE.OPEN, peerId, null, channelName, channelType, null);
  };

  if (dataChannel.readyState === self.DATA_CHANNEL_STATE.OPEN) {
    setTimeout(onOpenHandlerFn, 500);

  } else {
    self._trigger('dataChannelState', dataChannel.readyState, peerId, null, channelName, channelType, null);

    dataChannel.onopen = onOpenHandlerFn;
  }

  var onCloseHandlerFn = function () {
    log.debug([peerId, 'RTCDataChannel', channelName, 'Datachannel has closed']);

    self._trigger('dataChannelState', self.DATA_CHANNEL_STATE.CLOSED, peerId, null, channelName, channelType, null);

    if (self._peerConnections[peerId] && self._peerConnections[peerId].remoteDescription &&
      self._peerConnections[peerId].remoteDescription.sdp && (self._peerConnections[peerId].remoteDescription.sdp.indexOf(
      'm=application') === -1 || self._peerConnections[peerId].remoteDescription.sdp.indexOf('m=application 0') > 0)) {
      return;
    }

    if (channelType === self.DATA_CHANNEL_TYPE.MESSAGING) {
      setTimeout(function () {
        if (self._peerConnections[peerId] &&
          self._peerConnections[peerId].signalingState !== self.PEER_CONNECTION_STATE.CLOSED &&
          (self._peerConnections[peerId].localDescription &&
          self._peerConnections[peerId].localDescription.type === self.HANDSHAKE_PROGRESS.OFFER)) {
          log.debug([peerId, 'RTCDataChannel', channelName, 'Reviving Datachannel connection']);
          self._createDataChannel(peerId, channelName, true);
        }
      }, 100);
    }
  };

  // Fixes for Firefox bug (49 is working) -> https://bugzilla.mozilla.org/show_bug.cgi?id=1118398
  if (window.webrtcDetectedBrowser === 'firefox') {
    var hasTriggeredClose = false;
    var timeBlockAfterClosing = 0;

    dataChannel.onclose = function () {
      if (!hasTriggeredClose) {
        hasTriggeredClose = true;
        onCloseHandlerFn();
      }
    };

    var onFFClosed = setInterval(function () {
      if (dataChannel.readyState === self.DATA_CHANNEL_STATE.CLOSED ||
        hasTriggeredClose || timeBlockAfterClosing === 5) {
        clearInterval(onFFClosed);

        if (!hasTriggeredClose) {
          hasTriggeredClose = true;
          onCloseHandlerFn();
        }
      // After 5 seconds from CLOSING state and Firefox is not rendering to close, we have to assume to close it.
      // It is dead! This fixes the case where if it's Firefox who closes the Datachannel, the connection will
      // still assume as CLOSING..
      } else if (dataChannel.readyState === self.DATA_CHANNEL_STATE.CLOSING) {
        timeBlockAfterClosing++;
      }
    }, 1000);

  } else {
    dataChannel.onclose = onCloseHandlerFn;
  }

  if (channelType === self.DATA_CHANNEL_TYPE.MESSAGING) {
    self._dataChannels[peerId].main = {
      channelName: channelName,
      channelType: channelType,
      transferId: null,
      channel: dataChannel
    };
  } else {
    self._dataChannels[peerId][channelName] = {
      channelName: channelName,
      channelType: channelType,
      transferId: channelName,
      channel: dataChannel
    };
  }
};

/**
 * Function that sends data over the Datachannel connection.
 * @method _sendMessageToDataChannel
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._sendMessageToDataChannel = function(peerId, data, channelProp, doNotConvert) {
  var self = this;

  // Set it as "main" (MESSAGING) Datachannel
  if (!channelProp || channelProp === peerId) {
    channelProp = 'main';
  }

  // TODO: What happens when we want to send binary data over or ArrayBuffers?
  if (!(typeof data === 'object' && data) && !(data && typeof data === 'string')) {
    log.warn([peerId, 'RTCDataChannel', 'prop:' + channelProp, 'Dropping invalid data ->'], data);
    return;
  }

  if (!(self._peerConnections[peerId] &&
    self._peerConnections[peerId].signalingState !== self.PEER_CONNECTION_STATE.CLOSED)) {
    log.warn([peerId, 'RTCDataChannel', 'prop:' + channelProp,
      'Dropping for sending message as Peer connection does not exists or is closed ->'], data);
    return;
  }

  if (!(self._dataChannels[peerId] && self._dataChannels[peerId][channelProp])) {
    log.warn([peerId, 'RTCDataChannel', 'prop:' + channelProp,
      'Dropping for sending message as Datachannel connection does not exists ->'], data);
    return;
  }

  var channelName = self._dataChannels[peerId][channelProp].channelName;
  var channelType = self._dataChannels[peerId][channelProp].channelType;
  var readyState  = self._dataChannels[peerId][channelProp].channel.readyState;
  var messageType = typeof data === 'object' && data.type === self._DC_PROTOCOL_TYPE.MESSAGE ?
    self.DATA_CHANNEL_MESSAGE_ERROR.MESSAGE : self.DATA_CHANNEL_MESSAGE_ERROR.TRANSFER;

  if (messageType === self.DATA_CHANNEL_MESSAGE_ERROR.TRANSFER) {
    var transferId = self._dataChannels[peerId][channelProp].transferId;

    if (transferId && self._dataTransfers[transferId] && ([self.DATA_TRANSFER_DATA_TYPE.BINARY_STRING,
      self.DATA_TRANSFER_DATA_TYPE.STRING].indexOf(self._dataTransfers[transferId].chunkType) > -1 ||
      (Array.isArray(self._dataTransfers[transferId].enforceBSPeers) &&
      self._dataTransfers[transferId].enforceBSPeers.indexOf(peerId) > -1)) && !(data instanceof Blob) && !data.type) {
      messageType = self.DATA_CHANNEL_MESSAGE_ERROR.STREAM_DATA;
    }
  }

  if (readyState !== self.DATA_CHANNEL_STATE.OPEN) {
    var notOpenError = 'Failed sending message as Datachannel connection state is not opened. Current ' +
      'readyState is "' + readyState + '"';

    log.error([peerId, 'RTCDataChannel', 'prop:' + channelProp, notOpenError + ' ->'], data);

    self._trigger('dataChannelState', self.DATA_CHANNEL_STATE.SEND_MESSAGE_ERROR, peerId,
      new Error(notOpenError), channelName, channelType, messageType);

    throw new Error(notOpenError);
  }

  try {
    if (!doNotConvert && typeof data === 'object') {
      log.debug([peerId, 'RTCDataChannel', 'prop:' + channelProp, 'Sending message ->'], data);

      self._dataChannels[peerId][channelProp].channel.send(JSON.stringify(data));

    } else {
      log.debug([peerId, 'RTCDataChannel', 'prop:' + channelProp, 'Sending data with size ->'],
        data.size || data.length || data.byteLength);

      self._dataChannels[peerId][channelProp].channel.send(data);
    }
  } catch (error) {
    log.error([peerId, 'RTCDataChannel', 'prop:' + channelProp, 'Failed sending message ->'], error);

    self._trigger('dataChannelState', self.DATA_CHANNEL_STATE.SEND_MESSAGE_ERROR, peerId,
      error, channelName, channelType, messageType);

    throw error;
  }
};

/**
 * Function that stops the Datachannel connection and removes object references.
 * @method _closeDataChannel
 * @private
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype._closeDataChannel = function(peerId, channelProp) {
  var self = this;

  if (!self._dataChannels[peerId]) {
    log.warn([peerId, 'RTCDataChannel', channelProp || null,
      'Aborting closing Datachannels as Peer connection does not have Datachannel sessions']);
    return;
  }

  var closeFn = function (rChannelProp) {
    var channelName = self._dataChannels[peerId][rChannelProp].channelName;
    var channelType = self._dataChannels[peerId][rChannelProp].channelType;

    if (self._dataChannels[peerId][rChannelProp].readyState !== self.DATA_CHANNEL_STATE.CLOSED) {
      log.debug([peerId, 'RTCDataChannel', channelName, 'Closing Datachannel']);

      self._trigger('dataChannelState', self.DATA_CHANNEL_STATE.CLOSING, peerId, null, channelName, channelType, null);

      self._dataChannels[peerId][rChannelProp].channel.close();

      delete self._dataChannels[peerId][rChannelProp];
    }
  };

  if (!channelProp) {
    for (var channelNameProp in self._dataChannels) {
      if (self._dataChannels[peerId].hasOwnProperty(channelNameProp)) {
        if (self._dataChannels[peerId][channelNameProp]) {
          closeFn(channelNameProp);
        }
      }
    }
  } else {
    if (!self._dataChannels[peerId][channelProp]) {
      log.warn([peerId, 'RTCDataChannel', channelProp, 'Aborting closing Datachannel as it does not exists']);
      return;
    }

    closeFn(channelProp);
  }
};
Skylink.prototype.DATA_TRANSFER_DATA_TYPE = {
  BINARY_STRING: 'binaryString',
  ARRAY_BUFFER: 'arrayBuffer',
  BLOB: 'blob',
  STRING: 'string'
};

/**
 * Stores the data chunk size for Blob transfers.
 * @attribute _CHUNK_FILE_SIZE
 * @type Number
 * @private
 * @readOnly
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._CHUNK_FILE_SIZE = 49152;

/**
 * Stores the data chunk size for Blob transfers transferring from/to
 *   Firefox browsers due to limitation tested in the past in some PCs (linx predominatly).
 * @attribute _MOZ_CHUNK_FILE_SIZE
 * @type Number
 * @private
 * @readOnly
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._MOZ_CHUNK_FILE_SIZE = 12288;

/**
 * Stores the data chunk size for binary Blob transfers.
 * @attribute _BINARY_FILE_SIZE
 * @type Number
 * @private
 * @readOnly
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._BINARY_FILE_SIZE = 65456;

/**
 * Stores the data chunk size for binary Blob transfers.
 * @attribute _MOZ_BINARY_FILE_SIZE
 * @type Number
 * @private
 * @readOnly
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._MOZ_BINARY_FILE_SIZE = 16384;

/**
 * Stores the data chunk size for data URI string transfers.
 * @attribute _CHUNK_DATAURL_SIZE
 * @type Number
 * @private
 * @readOnly
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._CHUNK_DATAURL_SIZE = 1212;

/**
 * Function that converts Base64 string into Blob object.
 * This is referenced from devnull69@stackoverflow.com #6850276.
 * @method _base64ToBlob
 * @private
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype._base64ToBlob = function(dataURL) {
  var byteString = atob(dataURL);
  // write the bytes of the string to an ArrayBuffer
  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (var j = 0; j < byteString.length; j++) {
    ia[j] = byteString.charCodeAt(j);
  }
  // write the ArrayBuffer to a blob, and you're done
  return new Blob([ab]);
};

/**
 * Function that converts a Blob object into Base64 string.
 * @method _blobToBase64
 * @private
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype._blobToBase64 = function(data, callback) {
  var fileReader = new FileReader();
  fileReader.onload = function() {
    // Load Blob as dataurl base64 string
    var base64BinaryString = fileReader.result.split(',')[1];
    callback(base64BinaryString);
  };
  fileReader.readAsDataURL(data);
};

/**
 * Function that converts a Blob object into ArrayBuffer object.
 * @method _blobToArrayBuffer
 * @private
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype._blobToArrayBuffer = function(data, callback) {
  var self = this;
  var fileReader = new FileReader();
  fileReader.onload = function() {
    // Load Blob as dataurl base64 string
    if (self._isUsingPlugin) {
      callback(new Int8Array(fileReader.result));
    } else {
      callback(fileReader.result);
    }
  };
  fileReader.readAsArrayBuffer(data);
};

/**
 * Function that chunks Blob object based on the data chunk size provided.
 * If provided Blob object size is lesser than or equals to the chunk size, it should return an array
 *   of length of <code>1</code>.
 * @method _chunkBlobData
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._chunkBlobData = function(blob, chunkSize) {
  var chunksArray = [];
  var startCount = 0;
  var endCount = 0;
  var blobByteSize = blob.size;

  if (blobByteSize > chunkSize) {
    // File Size greater than Chunk size
    while ((blobByteSize - 1) > endCount) {
      endCount = startCount + chunkSize;
      chunksArray.push(blob.slice(startCount, endCount));
      startCount += chunkSize;
    }
    if ((blobByteSize - (startCount + 1)) > 0) {
      chunksArray.push(blob.slice(startCount, blobByteSize - 1));
    }
  } else {
    // File Size below Chunk size
    chunksArray.push(blob);
  }
  return chunksArray;
};

/**
 * Function that chunks large string into string chunks based on the data chunk size provided.
 * If provided string length is lesser than or equals to the chunk size, it should return an array
 *   of length of <code>1</code>.
 * @method _chunkDataURL
 * @private
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype._chunkDataURL = function(dataURL, chunkSize) {
  var outputStr = dataURL; //encodeURIComponent(dataURL);
  var dataURLArray = [];
  var startCount = 0;
  var endCount = 0;
  var dataByteSize = dataURL.size || dataURL.length;

  if (dataByteSize > chunkSize) {
    // File Size greater than Chunk size
    while ((dataByteSize - 1) > endCount) {
      endCount = startCount + chunkSize;
      dataURLArray.push(outputStr.slice(startCount, endCount));
      startCount += chunkSize;
    }
    if ((dataByteSize - (startCount + 1)) > 0) {
      chunksArray.push(outputStr.slice(startCount, dataByteSize - 1));
    }
  } else {
    // File Size below Chunk size
    dataURLArray.push(outputStr);
  }

  return dataURLArray;
};
Skylink.prototype.DT_PROTOCOL_VERSION = '0.1.1';

/**
 * The list of data transfers directions.
 * @attribute DATA_TRANSFER_TYPE
 * @param {String} UPLOAD <small>Value <code>"upload"</code></small>
 *   The value of the data transfer direction when User is uploading data to Peer.
 * @param {String} DOWNLOAD <small>Value <code>"download"</code></small>
 *   The value of the data transfer direction when User is downloading data from Peer.
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype.DATA_TRANSFER_TYPE = {
  UPLOAD: 'upload',
  DOWNLOAD: 'download'
};

/**
 * The list of data transfers session types.
 * @attribute DATA_TRANSFER_SESSION_TYPE
 * @param {String} BLOB     <small>Value <code>"blob"</code></small>
 *   The value of the session type for
 *   <a href="#method_sendURLData"><code>sendURLData()</code> method</a> data transfer.
 * @param {String} DATA_URL <small>Value <code>"dataURL"</code></small>
 *   The value of the session type for
 *   <a href="#method_sendBlobData"><code>method_sendBlobData()</code> method</a> data transfer.
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype.DATA_TRANSFER_SESSION_TYPE = {
  BLOB: 'blob',
  DATA_URL: 'dataURL'
};

/**
 * The list of data transfer states.
 * @attribute DATA_TRANSFER_STATE
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
 * @for Skylink
 * @since 0.4.0
 */
Skylink.prototype.DATA_TRANSFER_STATE = {
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
  USER_UPLOAD_REQUEST: 'userRequest'
};

/**
 * Stores the list of data transfer protocols.
 * @attribute _DC_PROTOCOL_TYPE
 * @param {String} WRQ The protocol to initiate data transfer.
 * @param {String} ACK The protocol to request for data transfer chunk.
 *   Give <code>-1</code> to reject the request at the beginning and <code>0</code> to accept
 *   the data transfer request.
 * @param {String} CANCEL The protocol to terminate data transfer.
 * @param {String} ERROR The protocol when data transfer has errors and has to be terminated.
 * @param {String} MESSAGE The protocol that is used to send P2P messages.
 * @type JSON
 * @readOnly
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._DC_PROTOCOL_TYPE = {
  WRQ: 'WRQ',
  ACK: 'ACK',
  ERROR: 'ERROR',
  CANCEL: 'CANCEL',
  MESSAGE: 'MESSAGE'
};

/**
 * <blockquote class="info">
 *   Note that Android, iOS and C++ SDKs do not support simultaneous data transfers.
 * </blockquote>
 * Function that starts an uploading data transfer from User to Peers.
 * @method sendBlobData
 * @param {Blob} data The Blob object.
 * @param {Number} [timeout=60] The timeout to wait for response from Peer.
 * @param {String|Array} [targetPeerId] The target Peer ID to start data transfer with.
 * - When provided as an Array, it will start uploading data transfers with all connections
 *   with all the Peer IDs provided.
 * - When not provided, it will start uploading data transfers with all the currently connected Peers in the Room.
 * @param {Boolean} [sendChunksAsBinary=false] <blockquote class="info">
 *   Note that this is currently not supported for MCU enabled Peer connections or Peer connections connecting from
 *   Android, iOS and Linux SDKs. This would fallback to <code>transferInfo.chunkType</code> to
 *   <code>BINARY_STRING</code> when MCU is connected. </blockquote> The flag if data transfer
 *   binary data chunks should not be encoded as Base64 string during data transfers.
 * @param {Function} [callback] The callback function fired when request has completed.
 *   <small>Function parameters signature is <code>function (error, success)</code></small>
 *   <small>Function request completion is determined by the <a href="#event_dataTransferState">
 *   <code>dataTransferState</code> event</a> triggering <code>state</code> parameter payload
 *   as <code>UPLOAD_COMPLETED</code> for all Peers targeted for request success.</small>
 * @param {JSON} callback.error The error result in request.
 *   <small>Defined as <code>null</code> when there are no errors in request</small>
 * @param {String} callback.error.transferId The data transfer ID.
 *   <small>Defined as <code>null</code> when <code>sendBlobData()</code> fails to start data transfer.</small>
 * @param {Array} callback.error.listOfPeers The list Peer IDs targeted for the data transfer.
 * @param {JSON} callback.error.transferErrors The list of data transfer errors.
 * @param {Error|String} callback.error.transferErrors.#peerId The data transfer error associated
 *   with the Peer ID defined in <code>#peerId</code> property.
 *   <small>If <code>#peerId</code> value is <code>"self"</code>, it means that it is the error when there
 *   are no Peer connections to start data transfer with.</small>
 * @param {JSON} callback.error.transferInfo The data transfer information.
 *   <small>Object signature matches the <code>transferInfo</code> parameter payload received in the
 *   <a href="#event_dataTransferState"><code>dataTransferState</code> event</a> except without the
 *   <code>percentage</code> and <code>data</code> property.</small>
 * @param {JSON} callback.success The success result in request.
 *   <small>Defined as <code>null</code> when there are errors in request</small>
 * @param {String} callback.success.transferId The data transfer ID.
 * @param {Array} callback.success.listOfPeers The list Peer IDs targeted for the data transfer.
 * @param {JSON} callback.success.transferInfo The data transfer information.
 *   <small>Object signature matches the <code>transferInfo</code> parameter payload received in the
 *   <a href="#event_dataTransferState"><code>dataTransferState</code> event</a> except without the
 *   <code>percentage</code> property and <code>data</code>.</small>
 * @trigger <ol class="desc-seq">
 *   <li>Checks if Peer connection and Datachannel connection are in correct states. <ol>
 *   <li>If Peer connection or session does not exists: <ol><li><a href="#event_dataTransferState">
 *   <code>dataTransferState</code> event</a> triggers parameter payload <code>state</code>
 *   as <code>ERROR</code>.</li><li><b>ABORT</b> step and return error.</li></ol></li>
 *   <li>If Peer connection is not stable: <small>The stable state can be checked with <a href="#event_peerConnectionState">
 *   <code>peerConnectionState</code> event</a> triggering parameter payload <code>state</code> as <code>STABLE</code>
 *   for Peer.</small> <ol><li><a href="#event_dataTransferState"><code>dataTransferState</code> event</a> triggers
 *   parameter payload <code>state</code> as <code>ERROR</code>.</li><li><b>ABORT</b> step and return error.</li></ol></li>
 *   <li>If Peer connection messaging Datachannel has not been opened: <small>This can be checked with
 *   <a href="#event_dataChannelState"><code>dataChannelState</code> event</a> triggering parameter
 *   payload <code>state</code> as <code>OPEN</code> and <code>channelType</code> as
 *   <code>MESSAGING</code> for Peer.</small> <ol><li><a href="#event_dataTransferState">
 *   <code>dataTransferState</code> event</a> triggers parameter payload <code>state</code> as <code>ERROR</code>.</li>
 *   <li><b>ABORT</b> step and return error.</li></ol></li>
 *   <li>If MCU is enabled for the App Key provided in <a href="#method_init"><code>init()</code>method</a> and connected: <ol>
 *   <li>If MCU Peer connection is not stable: <small>The stable state can be checked with <a href="#event_peerConnectionState">
 *   <code>peerConnectionState</code> event</a> triggering parameter payload <code>state</code> as <code>STABLE</code>
 *   and <code>peerId</code> value as <code>"MCU"</code> for MCU Peer.</small>
 *   <ol><li><a href="#event_dataTransferState"><code>dataTransferState</code> event</a> triggers
 *   parameter payload <code>state</code> as <code>ERROR</code>.</li><li><b>ABORT</b> step and return error.</li></ol></li>
 *   <li>If MCU Peer connection messaging Datachannel has not been opened: <small>This can be checked with
 *   <a href="#event_dataChannelState"><code>dataChannelState</code> event</a> triggering parameter
 *   payload <code>state</code> as <code>OPEN</code>, <code>peerId</code> value as <code>"MCU"</code>
 *   and <code>channelType</code> as <code>MESSAGING</code> for MCU Peer.</small>
 *   <ol><li><a href="#event_dataTransferState"><code>dataTransferState</code> event</a> triggers
 *   parameter payload <code>state</code> as <code>ERROR</code>.</li>
 *   <li><b>ABORT</b> step and return error.</li></ol></li></ol></li>
 *   <li>Checks if should open a new data Datachannel.<ol>
 *   <li>If Peer supports simultaneous data transfer, open new data Datachannel: <small>If MCU is connected,
 *   this opens a new data Datachannel with MCU Peer with all the Peers IDs information that supports
 *   simultaneous data transfers targeted for the data transfer session instead of opening new data Datachannel
 *   with all Peers targeted for the data transfer session.</small> <ol>
 *   <li><a href="#event_dataChannelState"><code>dataChannelState</code> event</a> triggers parameter
 *   payload <code>state</code> as <code>CONNECTING</code> and <code>channelType</code> as <code>DATA</code>.
 *   <small>Note that there is no timeout to wait for parameter payload <code>state</code> to be
 *   <code>OPEN</code>.</small></li>
 *   <li>If Datachannel has been created and opened successfully: <ol>
 *   <li><a href="#event_dataChannelState"><code>dataChannelState</code> event</a> triggers parameter payload
 *   <code>state</code> as <code>OPEN</code> and <code>channelType</code> as <code>DATA</code>.</li></ol></li>
 *   <li>Else: <ol><li><a href="#event_dataChannelState"><code>dataChannelState</code> event</a>
 *   triggers parameter payload <code>state</code> as <code>CREATE_ERROR</code> and <code>channelType</code> as
 *   <code>DATA</code>.</li><li><a href="#event_dataTransferState"><code>dataTransferState</code> event</a> triggers
 *   parameter payload <code>state</code> as <code>ERROR</code>.</li><li><b>ABORT</b> step and
 *   return error.</li></ol></li></ol></li><li>Else: <small>If MCU is connected,
 *   this uses the messaging Datachannel with MCU Peer with all the Peers IDs information that supports
 *   simultaneous data transfers targeted for the data transfer session instead of using the messaging Datachannels
 *   with all Peers targeted for the data transfer session.</small> <ol><li>If messaging Datachannel connection has a
 *   data transfer in-progress: <ol><li><a href="#event_dataTransferState"><code>dataTransferState</code> event</a>
 *   triggers parameter payload <code>state</code> as <code>ERROR</code>.</li><li><b>ABORT</b> step and
 *   return error.</li></ol></li></li></ol></ol></li></ol></li>
 *   <li>Starts the data transfer to Peer. <ol>
 *   <li><a href="#event_incomingDataRequest"><code>incomingDataRequest</code> event</a> triggers.</li>
 *   <li><em>For User only</em> <a href="#event_dataTransferState"><code>dataTransferState</code> event</a>
 *   triggers parameter payload <code>state</code> as <code>USER_UPLOAD_REQUEST</code>.</li>
 *   <li><em>For Peer only</em> <a href="#event_dataTransferState"><code>dataTransferState</code> event</a>
 *   triggers parameter payload <code>state</code> as <code>UPLOAD_REQUEST</code>.</li>
 *   <li>Peer invokes <a href="#method_acceptDataTransfer"><code>acceptDataTransfer()</code> method</a>. <ol>
 *   <li>If parameter <code>accept</code> value is <code>true</code>: <ol>
 *   <li>User starts upload data transfer to Peer. <ol>
 *   <li><em>For User only</em> <a href="#event_dataTransferState"><code>dataTransferState</code> event</a>
 *   triggers parameter payload <code>state</code> as <code>UPLOAD_STARTED</code>.</li>
 *   <li><em>For Peer only</em> <a href="#event_dataTransferState"><code>dataTransferState</code> event</a>
 *   triggers parameter payload <code>state</code> as <code>DOWNLOAD_STARTED</code>.</li></ol></li>
 *   <li>If Peer / User invokes <a href="#method_cancelDataTransfer"><code>cancelDataTransfer()</code> method</a>: <ol>
 *   <li><a href="#event_dataTransferState"><code>dataTransferState</code> event</a> triggers parameter
 *   <code>state</code> as <code>CANCEL</code>.</li><li><b>ABORT</b> step and return error.</li></ol></li>
 *   <li>If data transfer has timeout errors: <ol>
 *   <li><a href="#event_dataTransferState"><code>dataTransferState</code> event</a> triggers parameter
 *   <code>state</code> as <code>ERROR</code>.</li><li><b>ABORT</b> step and return error.</li></ol></li>
 *   <li>Checks for Peer connection and Datachannel connection during data transfer: <ol>
 *   <li>If MCU is enabled for the App Key provided in <a href="#method_init"><code>init()</code>
 *   method</a> and connected: <ol>
 *   <li>If MCU Datachannel has closed abruptly during data transfer: <ol>
 *   <small>This can be checked with <a href="#event_dataChannelState"><code>dataChannelState</code> event</a>
 *   triggering parameter payload <code>state</code> as <code>CLOSED</code>, <code>peerId</code> value as
 *   <code>"MCU"</code> and <code>channelType</code> as <code>DATA</code> for targeted Peers that supports simultaneous
 *   data transfer or <code>MESSAGING</code> for targeted Peers that do not support it.</small> <ol>
 *   <li><a href="#event_dataTransferState"><code>dataTransferState</code> event</a> triggers parameter
 *   <code>state</code> as <code>ERROR</code>.</li><li><b>ABORT</b> step and return error.</li></ol></li></ol></li>
 *   <li>If MCU Peer connection has changed from not being stable: <ol>
 *   <small>This can be checked with <a href="#event_peerConnectionState"><code>peerConnection</code> event</a>
 *   triggering parameter payload <code>state</code> as not <code>STABLE</code>, <code>peerId</code> value as
 *   <code>"MCU"</code>.</small> <ol><li><a href="#event_dataTransferState"><code>dataTransferState</code> event</a> triggers parameter
 *   <code>state</code> as <code>ERROR</code>.</li><li><b>ABORT</b> step and return error.</li></ol></li></ol></li>
 *   <li>If Peer connection has changed from not being stable: <ol>
 *   <small>This can be checked with <a href="#event_peerConnectionState"><code>peerConnection</code> event</a>
 *   triggering parameter payload <code>state</code> as not <code>STABLE</code>.</small> <ol>
 *   <li><a href="#event_dataTransferState"><code>dataTransferState</code> event</a> triggers parameter
 *   <code>state</code> as <code>ERROR</code>.</li><li><b>ABORT</b> step and return error.</li></ol></li></ol></li></ol></li>
 *   <li>Else: <ol><li>If Datachannel has closed abruptly during data transfer:
 *   <small>This can be checked with <a href="#event_dataChannelState"><code>dataChannelState</code> event</a>
 *   triggering parameter payload <code>state</code> as <code>CLOSED</code> and <code>channelType</code>
 *   as <code>DATA</code> for Peer that supports simultaneous data transfer or <code>MESSAGING</code>
 *   for Peer that do not support it.</small> <ol>
 *   <li><a href="#event_dataTransferState"><code>dataTransferState</code> event</a> triggers parameter
 *   <code>state</code> as <code>ERROR</code>.</li><li><b>ABORT</b> step and return error.</li></ol></li></ol></li></ol></li>
 *   <li>If data transfer is still progressing: <ol>
 *   <li><em>For User only</em> <a href="#event_dataTransferState"><code>dataTransferState</code> event</a>
 *   triggers parameter payload <code>state</code> as <code>UPLOADING</code>.</li>
 *   <li><em>For Peer only</em> <a href="#event_dataTransferState"><code>dataTransferState</code> event</a>
 *   triggers parameter payload <code>state</code> as <code>DOWNLOADING</code>.</li></ol></li>
 *   <li>If data transfer has completed <ol>
 *   <li><a href="#event_incomingData"><code>incomingData</code> event</a> triggers.</li>
 *   <li><em>For User only</em> <a href="#event_dataTransferState"><code>dataTransferState</code> event</a>
 *   triggers parameter payload <code>state</code> as <code>UPLOAD_COMPLETED</code>.</li>
 *   <li><em>For Peer only</em> <a href="#event_dataTransferState"><code>dataTransferState</code> event</a>
 *   triggers parameter payload <code>state</code> as <code>DOWNLOAD_COMPLETED</code>.</li></ol></li></ol></li>
 *   <li>If parameter <code>accept</code> value is <code>false</code>: <ol>
 *   <li><em>For User only</em> <a href="#event_dataTransferState"><code>dataTransferState</code> event</a>
 *   triggers parameter payload <code>state</code> as <code>REJECTED</code>.</li>
 *   <li><em>For Peer only</em> <a href="#event_dataTransferState"><code>dataTransferState</code> event</a>
 *   triggers parameter payload <code>state</code> as <code>USER_REJECTED</code>.</li>
 *   <li><b>ABORT</b> step and return error.</li></ol></li></ol>
 * @example
 * &lt;body&gt;
 *  &lt;input type="radio" name="timeout" onchange="setTransferTimeout(0)"&gt; 1s timeout (Default)
 *  &lt;input type="radio" name="timeout" onchange="setTransferTimeout(120)"&gt; 2s timeout
 *  &lt;input type="radio" name="timeout" onchange="setTransferTimeout(300)"&gt; 5s timeout
 *  &lt;hr&gt;
 *  &lt;input type="file" onchange="uploadFile(this.files[0], this.getAttribute('data'))" data="peerId"&gt;
 *  &lt;input type="file" onchange="uploadFileGroup(this.files[0], this.getAttribute('data').split(',')))" data="peerIdA,peerIdB"&gt;
 *  &lt;input type="file" onchange="uploadFileAll(this.files[0])" data=""&gt;
 *  &lt;script&gt;
 *    var transferTimeout = 0;
 *
 *    function setTransferTimeout (timeout) {
 *      transferTimeout = timeout;
 *    }
 *
 *    // Example 1: Upload data to a Peer
 *    function uploadFile (file, peerId) {
 *      var cb = function (error, success) {
 *        if (error) return;
 *        console.info("File has been transferred to '" + peerId + "' successfully");
 *      };
 *      if (transferTimeout > 0) {
 *        skylinkDemo.sendBlobData(file, peerId, transferTimeout, cb);
 *      } else {
 *        skylinkDemo.sendBlobData(file, peerId, cb);
 *      }
 *    }
 *
 *    // Example 2: Upload data to a list of Peers
 *    function uploadFileGroup (file, peerIds) {
 *      var cb = function (error, success) {
 *        var listOfPeers = error ? error.listOfPeers : success.listOfPeers;
 *        var listOfPeersErrors = error ? error.transferErrors : {};
 *        for (var i = 0; i < listOfPeers.length; i++) {
 *          if (listOfPeersErrors[listOfPeers[i]]) {
 *            console.error("Failed file transfer to '" + listOfPeers[i] + "'");
 *          } else {
 *            console.info("File has been transferred to '" + listOfPeers[i] + "' successfully");
 *          }
 *        }
 *      };
 *      if (transferTimeout > 0) {
 *        skylinkDemo.sendBlobData(file, peerIds, transferTimeout, cb);
 *      } else {
 *        skylinkDemo.sendBlobData(file, peerIds, cb);
 *      }
 *    }
 *
 *    // Example 2: Upload data to a list of Peers
 *    function uploadFileAll (file) {
 *      var cb = function (error, success) {
 *        var listOfPeers = error ? error.listOfPeers : success.listOfPeers;
 *        var listOfPeersErrors = error ? error.transferErrors : {};
 *        for (var i = 0; i < listOfPeers.length; i++) {
 *          if (listOfPeersErrors[listOfPeers[i]]) {
 *            console.error("Failed file transfer to '" + listOfPeers[i] + "'");
 *          } else {
 *            console.info("File has been transferred to '" + listOfPeers[i] + "' successfully");
 *          }
 *        }
 *      };
 *      if (transferTimeout > 0) {
 *        skylinkDemo.sendBlobData(file, transferTimeout, cb);
 *      } else {
 *        skylinkDemo.sendBlobData(file, cb);
 *      }
 *    }
 * &lt;/script&gt;
 * &lt;/body&gt;
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.sendBlobData = function(data, timeout, targetPeerId, sendChunksAsBinary, callback) {
  var self = this;
  var listOfPeers = Object.keys(self._peerConnections);
  var sessionType = 'blob';
  var sessionChunkType = 'string';
  var transferInfo = {
    name: null,
    size: null,
    chunkSize: self._CHUNK_FILE_SIZE,
    chunkType: self.DATA_TRANSFER_DATA_TYPE.BINARY_STRING,
    dataType: self.DATA_TRANSFER_SESSION_TYPE.BLOB,
    mimeType: null,
    direction: self.DATA_TRANSFER_TYPE.UPLOAD,
    timeout: 60,
    isPrivate: false,
    percentage: 0
  };

  // Function that returns the error emitted before data transfer has started
  var emitErrorBeforeDataTransferFn = function (error) {
    log.error(error);

    if (typeof callback === 'function') {
      var transferErrors = {};

      if (listOfPeers.length === 0) {
        transferErrors.self = new Error(error);
      } else {
        for (var i = 0; i < listOfPeers.length; i++) {
          transferErrors[listOfPeers[i]] = new Error(error);
        }
      }

      callback({
        transferId: null,
        transferInfo: transferInfo,
        listOfPeers: listOfPeers,
        transferErrors: transferErrors
      }, null);
    }
  };

  // Remove MCU Peer as list of Peers
  if (listOfPeers.indexOf('MCU') > -1) {
    listOfPeers.splice(listOfPeers.indexOf('MCU'), 1);
  }

  // sendBlobData(.., timeout)
  if (typeof timeout === 'number') {
    transferInfo.timeout = timeout;
  } else if (Array.isArray(timeout)) {
    listOfPeers = timeout;
  } else if (timeout && typeof timeout === 'string') {
    listOfPeers = [timeout];
  } else if (timeout && typeof timeout === 'boolean') {
    transferInfo.chunkType = self.DATA_TRANSFER_DATA_TYPE.ARRAY_BUFFER;
    transferInfo.chunkSize = self._BINARY_FILE_SIZE;
    sessionChunkType = 'binary';
  } else if (typeof timeout === 'function') {
    callback = timeout;
  }

  // sendBlobData(.., .., targetPeerId)
  if (Array.isArray(targetPeerId)) {
    listOfPeers = targetPeerId;
  } else if (targetPeerId && typeof targetPeerId === 'string') {
    listOfPeers = [targetPeerId];
  } else if (targetPeerId && typeof targetPeerId === 'boolean') {
    transferInfo.chunkType = self.DATA_TRANSFER_DATA_TYPE.ARRAY_BUFFER;
    transferInfo.chunkSize = self._BINARY_FILE_SIZE;
    sessionChunkType = 'binary';
  } else if (typeof targetPeerId === 'function') {
    callback = targetPeerId;
  }

  // sendBlobData(.., .., .., sendChunksAsBinary)
  if (sendChunksAsBinary && typeof sendChunksAsBinary === 'boolean') {
    transferInfo.chunkType = self.DATA_TRANSFER_DATA_TYPE.ARRAY_BUFFER;
    transferInfo.chunkSize = self._BINARY_FILE_SIZE;
    sessionChunkType = 'binary';
  } else if (typeof sendChunksAsBinary === 'function') {
    callback = sendChunksAsBinary;
  }

  if (window.webrtcDetectedBrowser === 'firefox' &&
    transferInfo.chunkType === self.DATA_TRANSFER_DATA_TYPE.BINARY_STRING) {
    transferInfo.chunkSize = self._MOZ_CHUNK_FILE_SIZE;
  }

  if (self._hasMCU && transferInfo.chunkType === self.DATA_TRANSFER_DATA_TYPE.ARRAY_BUFFER) {
    log.warn('Binary data chunks transfer is not yet supported with MCU environment. ' +
      'Fallbacking to binary string data chunks transfer.');
    transferInfo.chunkType = self.DATA_TRANSFER_DATA_TYPE.BINARY_STRING;
    transferInfo.chunkSize = self._CHUNK_FILE_SIZE;
    sessionChunkType = 'string';
  }

  // Use BLOB for Firefox
  if (transferInfo.chunkType === self.DATA_TRANSFER_DATA_TYPE.ARRAY_BUFFER &&
    window.webrtcDetectedBrowser === 'firefox') {
    transferInfo.chunkType = self.DATA_TRANSFER_DATA_TYPE.BLOB;
    transferInfo.chunkSize = self._MOZ_BINARY_FILE_SIZE;
    sessionChunkType = 'binary';
  }

  // Start checking if data transfer can start
  if (!(data && typeof data === 'object' && data instanceof Blob)) {
    emitErrorBeforeDataTransferFn('Provided data is not a Blob data');
    return;
  }

  transferInfo.name = data.name || null;
  transferInfo.mimeType = data.type || null;

  if (data.size < 1) {
    emitErrorBeforeDataTransferFn('Provided data is not a valid Blob data.');
    return;
  }

  transferInfo.size = data.size;

  if (!self._user.room.connected) {
    emitErrorBeforeDataTransferFn('Unable to send any blob data. User is not in Room.');
    return;
  }

  if (listOfPeers.length === 0) {
    emitErrorBeforeDataTransferFn('Unable to send any blob data. There are no Peers to start data transfer with');
    return;
  }

  if (!self._options.enableDataChannel) {
    emitErrorBeforeDataTransferFn('Unable to send any blob data. Datachannel is disabled');
    return;
  }

  var chunks = self._chunkBlobData(data, transferInfo.chunkSize);

  transferInfo.originalSize = transferInfo.size;

  if (transferInfo.chunkType === self.DATA_TRANSFER_DATA_TYPE.BINARY_STRING) {
    transferInfo.size = 4 * Math.ceil(transferInfo.size / 3);
    transferInfo.chunkSize = 4 * Math.ceil(transferInfo.chunkSize / 3);
  }

  self._startDataTransfer(chunks, transferInfo, sessionType, sessionChunkType, listOfPeers, callback);
};

/**
 * <blockquote class="info">
 *   Currently, the Android, iOS and C++ SDKs do not support this type of data transfer session.
 * </blockquote>
 * Function that starts an uploading string data transfer from User to Peers.
 * @method sendURLData
 * @param {String} data The data string to transfer to Peer.
 * @param {Number} [timeout=60] The timeout to wait for response from Peer.
 * @param {String|Array} [targetPeerId] The target Peer ID to start data transfer with.
 * - When provided as an Array, it will start uploading data transfers with all connections
 *   with all the Peer IDs provided.
 * - When not provided, it will start uploading data transfers with all the currently connected Peers in the Room.
 * @param {Function} [callback] The callback function fired when request has completed.
 *   <small>Function parameters signature is <code>function (error, success)</code></small>
 *   <small>Function request completion is determined by the <a href="#event_dataTransferState">
 *   <code>dataTransferState</code> event</a> triggering <code>state</code> parameter payload
 *   as <code>UPLOAD_COMPLETED</code> for all Peers targeted for request success.</small>
 * @param {JSON} callback.error The error result in request.
 *   <small>Defined as <code>null</code> when there are no errors in request</small>
 * @param {String} callback.error.transferId The data transfer ID.
 *   <small>Defined as <code>null</code> when <code>sendURLData()</code> fails to start data transfer.</small>
 * @param {Array} callback.error.listOfPeers The list Peer IDs targeted for the data transfer.
 * @param {JSON} callback.error.transferErrors The list of data transfer errors.
 * @param {Error|String} callback.error.transferErrors.#peerId The data transfer error associated
 *   with the Peer ID defined in <code>#peerId</code> property.
 *   <small>If <code>#peerId</code> value is <code>"self"</code>, it means that it is the error when there
 *   are no Peer connections to start data transfer with.</small>
 * @param {JSON} callback.error.transferInfo The data transfer information.
 *   <small>Object signature matches the <code>transferInfo</code> parameter payload received in the
 *   <a href="#event_dataTransferState"><code>dataTransferState</code> event</a> except without the
 *   <code>percentage</code> property and <code>data</code>.</small>
 * @param {JSON} callback.success The success result in request.
 *   <small>Defined as <code>null</code> when there are errors in request</small>
 * @param {String} callback.success.transferId The data transfer ID.
 * @param {Array} callback.success.listOfPeers The list Peer IDs targeted for the data transfer.
 * @param {JSON} callback.success.transferInfo The data transfer information.
 *   <small>Object signature matches the <code>transferInfo</code> parameter payload received in the
 *   <a href="#event_dataTransferState"><code>dataTransferState</code> event</a> except without the
 *   <code>percentage</code> property and <code>data</code>.</small>
 * @trigger <small>Event sequence follows <a href="#method_sendBlobData">
 * <code>sendBlobData()</code> method</a>.</small>
 * @example
 * &lt;body&gt;
 *  &lt;input type="radio" name="timeout" onchange="setTransferTimeout(0)"&gt; 1s timeout (Default)
 *  &lt;input type="radio" name="timeout" onchange="setTransferTimeout(120)"&gt; 2s timeout
 *  &lt;input type="radio" name="timeout" onchange="setTransferTimeout(300)"&gt; 5s timeout
 *  &lt;hr&gt;
 *  &lt;input type="file" onchange="showImage(this.files[0], this.getAttribute('data'))" data="peerId"&gt;
 *  &lt;input type="file" onchange="showImageGroup(this.files[0], this.getAttribute('data').split(',')))" data="peerIdA,peerIdB"&gt;
 *  &lt;input type="file" onchange="showImageAll(this.files[0])" data=""&gt;
 *  &lt;image id="target-1" src=""&gt;
 *  &lt;image id="target-2" src=""&gt;
 *  &lt;image id="target-3" src=""&gt;
 *  &lt;script&gt;
 *    var transferTimeout = 0;
 *
 *    function setTransferTimeout (timeout) {
 *      transferTimeout = timeout;
 *    }
 *
 *    function retrieveImageDataURL(file, cb) {
 *      var fr = new FileReader();
 *      fr.onload = function () {
 *        cb(fr.result);
 *      };
 *      fr.readAsDataURL(files[0]);
 *    }
 *
 *    // Example 1: Send image data URL to a Peer
 *    function showImage (file, peerId) {
 *      var cb = function (error, success) {
 *        if (error) return;
 *        console.info("Image has been transferred to '" + peerId + "' successfully");
 *      };
 *      retrieveImageDataURL(file, function (str) {
 *        if (transferTimeout > 0) {
 *          skylinkDemo.sendURLData(str, peerId, transferTimeout, cb);
 *        } else {
 *          skylinkDemo.sendURLData(str, peerId, cb);
 *        }
 *        document.getElementById("target-1").src = str;
 *      });
 *    }
 *
 *    // Example 2: Send image data URL to a list of Peers
 *    function showImageGroup (file, peerIds) {
 *      var cb = function (error, success) {
 *        var listOfPeers = error ? error.listOfPeers : success.listOfPeers;
 *        var listOfPeersErrors = error ? error.transferErrors : {};
 *        for (var i = 0; i < listOfPeers.length; i++) {
 *          if (listOfPeersErrors[listOfPeers[i]]) {
 *            console.error("Failed image transfer to '" + listOfPeers[i] + "'");
 *          } else {
 *            console.info("Image has been transferred to '" + listOfPeers[i] + "' successfully");
 *          }
 *        }
 *      };
 *      retrieveImageDataURL(file, function (str) {
 *        if (transferTimeout > 0) {
 *          skylinkDemo.sendURLData(str, peerIds, transferTimeout, cb);
 *        } else {
 *          skylinkDemo.sendURLData(str, peerIds, cb);
 *        }
 *        document.getElementById("target-2").src = str;
 *      });
 *    }
 *
 *    // Example 2: Send image data URL to a list of Peers
 *    function uploadFileAll (file) {
 *      var cb = function (error, success) {
 *        var listOfPeers = error ? error.listOfPeers : success.listOfPeers;
 *        var listOfPeersErrors = error ? error.transferErrors : {};
 *        for (var i = 0; i < listOfPeers.length; i++) {
 *          if (listOfPeersErrors[listOfPeers[i]]) {
 *            console.error("Failed image transfer to '" + listOfPeers[i] + "'");
 *          } else {
 *            console.info("Image has been transferred to '" + listOfPeers[i] + "' successfully");
 *          }
 *        }
 *      };
 *      retrieveImageDataURL(file, function (str) {
 *        if (transferTimeout > 0) {
 *          skylinkDemo.sendURLData(str, transferTimeout, cb);
 *        } else {
 *          skylinkDemo.sendURLData(str, cb);
 *        }
 *        document.getElementById("target-3").src = str;
 *      });
 *    }
 * &lt;/script&gt;
 * &lt;/body&gt;
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype.sendURLData = function(data, timeout, targetPeerId, callback) {
  var self = this;
  var listOfPeers = Object.keys(self._peerConnections);
  var sessionType = 'data';
  var sessionChunkType = 'string';
  var transferInfo = {
    name: null,
    size: null,
    chunkSize: self._CHUNK_FILE_SIZE,
    chunkType: self.DATA_TRANSFER_DATA_TYPE.STRING,
    dataType: self.DATA_TRANSFER_SESSION_TYPE.DATA_URL,
    mimeType: null,
    direction: self.DATA_TRANSFER_TYPE.UPLOAD,
    timeout: 60,
    isPrivate: false,
    percentage: 0
  };

  // Function that returns the error emitted before data transfer has started
  var emitErrorBeforeDataTransferFn = function (error) {
    log.error(error);

    if (typeof callback === 'function') {
      var transferErrors = {};

      if (listOfPeers.length === 0) {
        transferErrors.self = new Error(error);
      } else {
        for (var i = 0; i < listOfPeers.length; i++) {
          transferErrors[listOfPeers[i]] = new Error(error);
        }
      }

      callback({
        transferId: null,
        transferInfo: transferInfo,
        listOfPeers: listOfPeers,
        transferErrors: transferErrors
      }, null);
    }
  };

  // Remove MCU Peer as list of Peers
  if (listOfPeers.indexOf('MCU') > -1) {
    listOfPeers.splice(listOfPeers.indexOf('MCU'), 1);
  }

  // sendURLData(.., timeout)
  if (typeof timeout === 'number') {
    transferInfo.timeout = timeout;
  } else if (Array.isArray(timeout)) {
    listOfPeers = timeout;
  } else if (timeout && typeof timeout === 'string') {
    listOfPeers = [timeout];
  } else if (typeof timeout === 'function') {
    callback = timeout;
  }

  // sendURLData(.., .., targetPeerId)
  if (Array.isArray(targetPeerId)) {
    listOfPeers = targetPeerId;
  } else if (targetPeerId && typeof targetPeerId === 'string') {
    listOfPeers = [targetPeerId];
  } else if (typeof targetPeerId === 'function') {
    callback = targetPeerId;
  }

  // Start checking if data transfer can start
  if (!(data && typeof data === 'string')) {
    emitErrorBeforeDataTransferFn('Provided data is not a dataURL');
    return;
  }

  transferInfo.size = data.length || data.size;

  if (!self._user.room.connected) {
    emitErrorBeforeDataTransferFn('Unable to send any dataURL. User is not in Room.');
    return;
  }

  if (listOfPeers.length === 0) {
    emitErrorBeforeDataTransferFn('Unable to send any dataURL. There are no Peers to start data transfer with');
    return;
  }

  if (!self._options.enableDataChannel) {
    emitErrorBeforeDataTransferFn('Unable to send any dataURL. Datachannel is disabled');
    return;
  }

  var chunks = self._chunkDataURL(data, transferInfo.chunkSize);

  transferInfo.originalSize = transferInfo.size;

  self._startDataTransfer(chunks, transferInfo, sessionType, sessionChunkType, listOfPeers, callback);
};

/**
 * Function that accepts or rejects an upload data transfer request from Peer to User.
 * @method acceptDataTransfer
 * @param {String} peerId The Peer ID.
 * @param {String} transferId The data transfer ID.
 * @param {Boolean} [accept=false] The flag if User accepts the upload data transfer request from Peer.
 * @example
 *   // Example 1: Accept Peer upload data transfer request
 *   skylinkDemo.on("incomingDataRequest", function (transferId, peerId, transferInfo, isSelf) {
 *      if (!isSelf) {
 *        skylinkDemo.acceptDataTransfer(peerId, transferId, true);
 *      }
 *   });
 *
 *   // Example 2: Reject Peer upload data transfer request
 *   skylinkDemo.on("incomingDataRequest", function (transferId, peerId, transferInfo, isSelf) {
 *      if (!isSelf) {
 *        skylinkDemo.acceptDataTransfer(peerId, transferId, false);
 *      }
 *   });
 * @trigger <small>Event sequence follows <a href="#method_sendBlobData">
 * <code>sendBlobData()</code> method</a> after <code>acceptDataTransfer()</code> method is invoked.</small>
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype.respondBlobRequest =
Skylink.prototype.acceptDataTransfer = function (peerId, transferId, accept) {
  var self = this;

  if (typeof transferId !== 'string' && typeof peerId !== 'string') {
    log.error([peerId, 'RTCDataChannel', transferId, 'Aborting accept data transfer as ' +
      'data transfer ID or peer ID is not provided']);
    return;
  }

  if (!self._dataChannels[peerId]) {
    log.error([peerId, 'RTCDataChannel', transferId, 'Aborting accept data transfer as ' +
      'Peer does not have any Datachannel connections']);
    return;
  }

  if (!self._dataTransfers[transferId]) {
    log.error([peerId, 'RTCDataChannel', transferId, 'Aborting accept data transfer as ' +
      'invalid transfer ID is provided']);
    return;
  }

  // Check Datachannel property in _dataChannels[peerId] list
  var channelProp = 'main';

  if (self._dataChannels[peerId][transferId]) {
    channelProp = transferId;
  }

  if (accept) {
    log.debug([peerId, 'RTCDataChannel', transferId, 'Accepted data transfer and starting ...']);

    var dataChannelStateCbFn = function (state, evtPeerId, error, cN, cT) {
      console.info(evtPeerId, error, cN, cT);
      self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.ERROR, transferId, peerId,
        self._getTransferInfo(transferId, peerId, true, false, false), {
        transferType: self.DATA_TRANSFER_TYPE.DOWNLOAD,
        message: new Error('Data transfer terminated as Peer Datachannel connection closed abruptly.')
      });
    };

    self.once('dataChannelState', dataChannelStateCbFn, function (state, evtPeerId, error, channelName, channelType) {
      if (!(self._dataTransfers[transferId] && self._dataTransfers[transferId].sessions[peerId])) {
        self.off('dataChannelState', dataChannelStateCbFn);
        return;
      }
      return evtPeerId === peerId && (channelProp === 'main' ? channelType === self.DATA_CHANNEL_STATE.MESSAGING :
        channelName === transferId) && [self.DATA_CHANNEL_STATE.CLOSING, self.DATA_CHANNEL_STATE.CLOSED,
        self.DATA_CHANNEL_STATE.ERROR].indexOf(state) > -1;
    });

    // From here we start detecting as completion for data transfer downloads
    self.once('dataTransferState', function () {
      if (dataChannelStateCbFn) {
        self.off('dataChannelState', dataChannelStateCbFn);
      }

      delete self._dataTransfers[transferId];

      if (self._dataChannels[peerId]) {
        if (channelProp === 'main' && self._dataChannels[peerId].main) {
          self._dataChannels[peerId].main.transferId = null;
        }

        if (channelProp === transferId) {
          self._closeDataChannel(peerId, transferId);
        }
      }
    }, function (state, evtTransferId, evtPeerId) {
      return evtTransferId === transferId && evtPeerId === peerId &&
        [self.DATA_TRANSFER_STATE.ERROR, self.DATA_TRANSFER_STATE.CANCEL,
        self.DATA_TRANSFER_STATE.DOWNLOAD_COMPLETED].indexOf(state) > -1;
    });

    // Send ACK protocol to start data transfer
    // MCU sends the data transfer from the "P2P" Datachannel
    self._sendMessageToDataChannel(peerId, {
      type: self._DC_PROTOCOL_TYPE.ACK,
      sender: self._user.id,
      ackN: 0
    }, channelProp);

    self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.DOWNLOAD_STARTED, transferId, peerId,
      self._getTransferInfo(transferId, peerId, true, false, false), null);

  } else {
    log.warn([peerId, 'RTCDataChannel', transferId, 'Rejected data transfer and data transfer request has been aborted']);

    // Send ACK protocol to terminate data transfer request
    // MCU sends the data transfer from the "P2P" Datachannel
    self._sendMessageToDataChannel(peerId, {
      type: self._DC_PROTOCOL_TYPE.ACK,
      sender: self._user.id,
      ackN: -1
    }, channelProp);

    // Insanity check
    if (channelProp === 'main' && self._dataChannels[peerId].main) {
      self._dataChannels[peerId].main.transferId = null;
    }

    self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.USER_REJECTED, transferId, peerId,
      self._getTransferInfo(transferId, peerId, true, false, false), {
      message: new Error('Data transfer terminated as User has rejected data transfer request.'),
      transferType: self.DATA_TRANSFER_TYPE.DOWNLOAD
    });

    delete self._dataTransfers[transferId];
  }
};

/**
 * <blockquote class="info">
 *   For MCU enabled Peer connections, the cancel data transfer functionality may differ, as it
 *   will result in all Peers related to the data transfer ID to be terminated.
 * </blockquote>
 * Function that terminates a currently uploading / downloading data transfer from / to Peer.
 * @method cancelDataTransfer
 * @param {String} peerId The Peer ID.
 * @param {String} transferId The data transfer ID.
 * @example
 *   // Example 1: Cancel Peer data transfer
 *   var transferSessions = {};
 *
 *   skylinkDemo.on("dataTransferState", function (state, transferId, peerId) {
 *     if ([skylinkDemo.DATA_TRANSFER_STATE.DOWNLOAD_STARTED,
 *       skylinkDemo.DATA_TRANSFER_STATE.UPLOAD_STARTED].indexOf(state) > -1) {
 *       if (!Array.isArray(transferSessions[transferId])) {
 *         transferSessions[transferId] = [];
 *       }
 *       transferSessions[transferId].push(peerId);
 *     } else {
 *       transferSessions[transferId].splice(transferSessions[transferId].indexOf(peerId), 1);
 *     }
 *   });
 *
 *   function cancelTransfer (peerId, transferId) {
 *     skylinkDemo.cancelDataTransfer(peerId, transferId);
 *   }
 * @trigger <small>Event sequence follows <a href="#method_sendBlobData">
 * <code>sendBlobData()</code> method</a> after <code>cancelDataTransfer()</code> method is invoked.</small>
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype.cancelBlobTransfer =
Skylink.prototype.cancelDataTransfer = function (peerId, transferId) {
  var self = this;

  if (!(transferId && typeof transferId === 'string')) {
    log.error([peerId, 'RTCDataChannel', transferId, 'Aborting cancel data transfer as data transfer ID is not provided']);
    return;
  }

  if (!(peerId && typeof peerId === 'string')) {
    log.error([peerId, 'RTCDataChannel', transferId, 'Aborting cancel data transfer as peer ID is not provided']);
    return;
  }

  if (!self._dataTransfers[transferId]) {
    log.error([peerId, 'RTCDataChannel', transferId, 'Aborting cancel data transfer as ' +
      'data transfer session does not exists.']);
    return;
  }

  log.debug([peerId, 'RTCDataChannel', transferId, 'Canceling data transfer ...']);

  /**
   * Emit data state event function.
   */
  var emitEventFn = function (peers, transferInfoPeerId) {
    for (var i = 0; i < peers.length; i++) {
      self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.CANCEL, transferId, peers[i],
        self._getTransferInfo(transferId, transferInfoPeerId, false, false, false), {
        transferType: self._dataTransfers[transferId].direction,
        message: new Error('User cancelled download transfer')
      });
    }
  };

  // For uploading from Peer to MCU case of broadcast
  if (self._hasMCU && self._dataTransfers[transferId].direction === self.DATA_TRANSFER_TYPE.UPLOAD) {
    if (!self._dataChannels.MCU) {
      log.error([peerId, 'RTCDataChannel', transferId, 'Aborting cancel data transfer as ' +
        'Peer does not have any Datachannel connections']);
      return;
    }

    // We abort all data transfers to all Peers if uploading via MCU since it broadcasts to MCU
    log.warn([peerId, 'RTCDataChannel', transferId, 'Aborting all data transfers to Peers']);

    // If data transfer to MCU broadcast has interop Peers, send to MCU via the "main" Datachannel
    if (Object.keys(self._dataTransfers[transferId].peers.main).length > 0) {
      self._sendMessageToDataChannel('MCU', {
        type: self._DC_PROTOCOL_TYPE.CANCEL,
        sender: self._user.id,
        content: 'Peer cancelled download transfer',
        name: self._dataTransfers[transferId].name,
        ackN: 0
      }, 'main');
    }

    // If data transfer to MCU broadcast has non-interop Peers, send to MCU via the new Datachanel
    if (Object.keys(self._dataTransfers[transferId].peers[transferId]).length > 0) {
      self._sendMessageToDataChannel('MCU', {
        type: self._DC_PROTOCOL_TYPE.CANCEL,
        sender: self._user.id,
        content: 'Peer cancelled download transfer',
        name: self._dataTransfers[transferId].name,
        ackN: 0
      }, transferId);
    }

    emitEventFn(Object.keys(self._dataTransfers[transferId].peers.main).concat(
      Object.keys(self._dataTransfers[transferId].peers[transferId])));
  } else {
    var channelProp = 'main';

    if (!self._dataChannels[peerId]) {
      log.error([peerId, 'RTCDataChannel', transferId, 'Aborting cancel data transfer as ' +
        'Peer does not have any Datachannel connections']);
      return;
    }

    if (self._dataChannels[peerId][transferId]) {
      channelProp = transferId;
    }

    self._sendMessageToDataChannel(peerId, {
      type: self._DC_PROTOCOL_TYPE.CANCEL,
      sender: self._user.id,
      content: 'Peer cancelled download transfer',
      name: self._dataTransfers[transferId].name,
      ackN: 0
    }, channelProp);

    emitEventFn([peerId], peerId);
  }
};

/**
 * Function that sends a message to Peers via the Datachannel connection.
 * <small>Consider using <a href="#method_sendURLData"><code>sendURLData()</code> method</a> if you are
 * sending large strings to Peers.</small>
 * @method sendP2PMessage
 * @param {String|JSON} message The message.
 * @param {String|Array} [targetPeerId] The target Peer ID to send message to.
 * - When provided as an Array, it will send the message to only Peers which IDs are in the list.
 * - When not provided, it will broadcast the message to all connected Peers with Datachannel connection in the Room.
 * @trigger <ol class="desc-seq">
 *  <li>Sends P2P message to all targeted Peers. <ol>
 *  <li>If Peer connection Datachannel has not been opened: <small>This can be checked with
 *  <a href="#event_dataChannelState"><code>dataChannelState</code> event</a>
 *  triggering parameter payload <code>state</code> as <code>OPEN</code> and
 *  <code>channelType</code> as <code>MESSAGING</code> for Peer.</small> <ol>
 *  <li><a href="#event_dataChannelState"><code>dataChannelState</code> event</a> triggers
 *  parameter payload <code>state</code> as <code>SEND_MESSAGE_ERROR</code>.</li>
 *  <li><b>ABORT</b> step and return error.</li></ol></li>
 *  <li><a href="#event_incomingMessage"><code>incomingMessage</code> event</a> triggers
 *  parameter payload <code>message.isDataChannel</code> value as <code>true</code> and
 *  <code>isSelf</code> value as <code>true</code>.</li></ol></li></ol>
 * @example
 *   // Example 1: Broadcasting to all Peers
 *   skylinkDemo.on("dataChannelState", function (state, peerId, error, channelName, channelType) {
 *      if (state === skylinkDemo.DATA_CHANNEL_STATE.OPEN &&
 *        channelType === skylinkDemo.DATA_CHANNEL_TYPE.MESSAGING) {
 *        skylinkDemo.sendP2PMessage("Hi all!");
 *      }
 *   });
 *
 *   // Example 2: Sending to specific Peers
 *   var peersInExclusiveParty = [];
 *
 *   skylinkDemo.on("peerJoined", function (peerId, peerInfo, isSelf) {
 *     if (isSelf) return;
 *     if (peerInfo.userData.exclusive) {
 *       peersInExclusiveParty[peerId] = false;
 *     }
 *   });
 *
 *   skylinkDemo.on("dataChannelState", function (state, peerId, error, channelName, channelType) {
 *      if (state === skylinkDemo.DATA_CHANNEL_STATE.OPEN &&
 *        channelType === skylinkDemo.DATA_CHANNEL_TYPE.MESSAGING) {
 *        peersInExclusiveParty[peerId] = true;
 *      }
 *   });
 *
 *   function updateExclusivePartyStatus (message) {
 *     var readyToSend = [];
 *     for (var p in peersInExclusiveParty) {
 *       if (peersInExclusiveParty.hasOwnProperty(p)) {
 *         readyToSend.push(p);
 *       }
 *     }
 *     skylinkDemo.sendP2PMessage(message, readyToSend);
 *   }
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.sendP2PMessage = function(message, targetPeerId) {
  var listOfPeers = Object.keys(this._dataChannels);
  var isPrivate = false;

  if (Array.isArray(targetPeerId)) {
    listOfPeers = targetPeerId;
    isPrivate = true;
  } else if (targetPeerId && typeof targetPeerId === 'string') {
    listOfPeers = [targetPeerId];
    isPrivate = true;
  }

  if (!this._user.room.connected) {
    log.error('Unable to send message as User is not in Room. ->', message);
    return;
  }

  if (!this._options.enableDataChannel) {
    log.error('Unable to send message as User does not have Datachannel enabled. ->', message);
    return;
  }

  // Loop out unwanted Peers
  for (var i = 0; i < listOfPeers.length; i++) {
    var peerId = listOfPeers[i];

    if (!this._dataChannels[peerId]) {
      log.error([peerId, 'RTCDataChannel', null, 'Dropping of sending message to Peer as ' +
        'Datachannel connection does not exists']);
      listOfPeers.splice(i, 1);
      i--;
    } else if (peerId === 'MCU') {
      listOfPeers.splice(i, 1);
      i--;
    } else if (!this._hasMCU) {
      log.debug([peerId, 'RTCDataChannel', null, 'Sending ' + (isPrivate ? 'private' : '') +
        ' P2P message to Peer']);

      this._sendMessageToDataChannel(peerId, {
        type: this._DC_PROTOCOL_TYPE.MESSAGE,
        isPrivate: isPrivate,
        sender: this._user.id,
        target: peerId,
        data: message
      }, 'main');
    }
  }

  if (listOfPeers.length === 0) {
    log.warn('Currently there are no Peers to send P2P message to (unless the message is queued ' +
      'and there are Peer connected by then).');
  }

  if (this._hasMCU) {
    log.debug(['MCU', 'RTCDataChannel', null, 'Broadcasting ' + (isPrivate ? 'private' : '') +
      ' P2P message to Peers']);

    this._sendMessageToDataChannel('MCU', {
      type: this._DC_PROTOCOL_TYPE.MESSAGE,
      isPrivate: isPrivate,
      sender: this._user.id,
      target: listOfPeers,
      data: message
    }, 'main');
  }

  this._trigger('incomingMessage', {
    content: message,
    isPrivate: isPrivate,
    targetPeerId: targetPeerId || null,
    listOfPeers: listOfPeers,
    isDataChannel: true,
    senderPeerId: this._user.id
  }, this._user.id, this.getPeerInfo(), true);
};

/**
 * <blockquote class="info">
 * Note that this functionality is currently not supported by MCU enabled Peer connections.<br>
 * The current maximum data chunk size is <code>65456</code>.
 * </blockquote>
 * Function that streams a data chunk to Peers.
 * @method streamData
 * @param {Blob} data The data stream chunk.
 * @param {String|Array} [targetPeerId] The target Peer ID to send message to.
 * - When provided as an Array, it will stream the data chunk to only Peers which IDs are in the list.
 * - When not provided, it will stream the data chunk to all connected Peers with Datachannel connection in the Room.
 * @trigger <ol class="desc-seq">
 *  <li>Sends P2P message to all targeted Peers. <ol>
 *  <li>If Peer connection Datachannel has not been opened: <small>This can be checked with
 *  <a href="#event_dataChannelState"><code>dataChannelState</code> event</a>
 *  triggering parameter payload <code>state</code> as <code>OPEN</code> and
 *  <code>channelType</code> as <code>MESSAGING</code> for Peer.</small> <ol>
 *  <li><a href="#event_dataChannelState"><code>dataChannelState</code> event</a> triggers
 *  parameter payload <code>state</code> as <code>STREAM_DATA_ERROR</code>.</li>
 *  <li><b>ABORT</b> step and return error.</li></ol></li>
 *  <li><a href="#event_incomingMessage"><code>incomingMessage</code> event</a> triggers
 *  parameter payload <code>message.isDataChannel</code> value as <code>true</code> and
 *  <code>isSelf</code> value as <code>true</code>.</li></ol></li></ol>
 * @example
 *   // Example 1: Broadcasting to all Peers
 *   skylinkDemo.on("dataChannelState", function (state, peerId, error, channelName, channelType) {
 *      if (state === skylinkDemo.DATA_CHANNEL_STATE.OPEN &&
 *        channelType === skylinkDemo.DATA_CHANNEL_TYPE.MESSAGING) {
 *        skylinkDemo.streamData(new Blob(["<a href='#'></a>""]));
 *      }
 *   });
 *
 *   // Example 2: Streaming to specific Peers
 *   var peersInExclusiveParty = [];
 *
 *   skylinkDemo.on("peerJoined", function (peerId, peerInfo, isSelf) {
 *     if (isSelf) return;
 *     if (peerInfo.userData.exclusive) {
 *       peersInExclusiveParty[peerId] = false;
 *     }
 *   });
 *
 *   skylinkDemo.on("dataChannelState", function (state, peerId, error, channelName, channelType) {
 *      if (state === skylinkDemo.DATA_CHANNEL_STATE.OPEN &&
 *        channelType === skylinkDemo.DATA_CHANNEL_TYPE.MESSAGING) {
 *        peersInExclusiveParty[peerId] = true;
 *      }
 *   });
 *
 *   function updateExclusivePartyStatus (dataChunk) {
 *     var readyToSend = [];
 *     for (var p in peersInExclusiveParty) {
 *       if (peersInExclusiveParty.hasOwnProperty(p)) {
 *         readyToSend.push(p);
 *       }
 *     }
 *     skylinkDemo.streamData(dataChunk, readyToSend);
 *   }
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype.streamData = function(data, targetPeerId) {
  var self = this;
  var listOfPeers = Object.keys(self._dataChannels);
  var isPrivate = false;

  if (Array.isArray(targetPeerId)) {
    listOfPeers = targetPeerId;
    isPrivate = true;
  } else if (targetPeerId && typeof targetPeerId === 'string') {
    listOfPeers = [targetPeerId];
    isPrivate = true;
  }

  if (!(data && data instanceof Blob)) {
    log.error('Unable to stream invalid data chunk ->', data);
    return;
  }

  if (data.size > 65456) {
    log.error('Unable to stream data chunk greater that specified maximum size (65456) ->', data);
    return;
  }

  if (!self._options.enableDataChannel) {
    log.error('Unable to stream data chunk as User does not have Datachannel enabled. ->', data);
    return;
  }

  if (self._hasMCU) {
    log.error('Unable to stream data chunk as MCU does not support this functionality. ->', data);
    return;
  }

  self._blobToArrayBuffer(data, function (arrayBufferData) {
    if (!self._user.room.connected) {
      log.error('Unable to stream data chunk as User is not in Room. ->', data);
      return;
    }

    // Loop out unwanted Peers
    for (var i = 0; i < listOfPeers.length; i++) {
      var peerId = listOfPeers[i];

      if (!self._dataChannels[peerId]) {
        log.error([peerId, 'RTCDataChannel', null, 'Dropping of streaming data chunk to Peer as ' +
          'Datachannel connection does not exists']);
        listOfPeers.splice(i, 1);
        i--;
      } else {
        var transferId = self._dataChannels[peerId].main.transferId;

        if (transferId && self._dataTransfers[transferId] &&
          // Check if its upload direction
          self._dataTransfers[transferId].direction === self.DATA_TRANSFER_TYPE.UPLOAD ?
          // Check if its not string / binarystring transfer
          self._dataTransfers[transferId].sessionChunkType === 'binary' &&
          // Check if there is no polyfill for peer
          self._dataTransfers[transferId].enforceBSPeers.indexOf(peerId) === -1 : false) {
          log.error([peerId, 'RTCDataChannel', null, 'Dropping of streaming data chunk to Peer as ' +
            'Datachannel connection is streaming binary data chunks for blob transfer']);
          listOfPeers.splice(i, 1);
          i--;
          continue;
        }

        log.debug([peerId, 'RTCDataChannel', null, 'Streaming ' + (isPrivate ? 'private' : '') +
          ' data chunk to Peer']);

        self._sendMessageToDataChannel(peerId, arrayBufferData, 'main', true);
      }
    }

    if (listOfPeers.length === 0) {
      log.warn('Currently there are no Peers to stream data chunk.');
    }

    self._trigger('incomingDataStream', {
      content: data,
      chunkSize: data.size,
      chunkType: self.DATA_TRANSFER_DATA_TYPE.ARRAY_BUFFER,
      isPrivate: isPrivate,
      targetPeerId: targetPeerId || null,
      listOfPeers: listOfPeers,
      senderPeerId: self._user.id
    }, self._user.id, self.getPeerInfo(), true);
  });
};

/**
 * Function that starts the data transfer to Peers.
 * @method _startDataTransfer
 * @private
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype._startDataTransfer = function(chunks, transferInfo, sessionType, sessionChunkType, listOfPeers, callback) {
  var self = this;
  var transferId = self._user.id + '_' + (new Date()).getTime();
  var transferErrors = {};
  var transferCompleted = [];

  // Polyfill data name to prevent empty fields in WRQ
  // TODO: What happens if transfer requires extension?
  if (!transferInfo.name) {
    transferInfo.name = transferId;
  }

  self._dataTransfers[transferId] = clone(transferInfo);
  self._dataTransfers[transferId].peers = {};
  self._dataTransfers[transferId].peers.main = {};
  self._dataTransfers[transferId].peers[transferId] = {};
  self._dataTransfers[transferId].sessions = {};
  self._dataTransfers[transferId].chunks = chunks;
  self._dataTransfers[transferId].enforceBSPeers = [];
  self._dataTransfers[transferId].enforcedBSInfo = {};
  self._dataTransfers[transferId].sessionType = sessionType;
  self._dataTransfers[transferId].sessionChunkType = sessionChunkType;
  self._dataTransfers[transferId].senderPeerId = self._user.id;

  // Check if fallback chunks is required
  if (sessionType === 'blob' && sessionChunkType === 'binary') {
    for (var p = 0; p < listOfPeers.length; p++) {
      var protocolVer = (((self._peerInformations[listOfPeers[p]]) || {}).agent || {}).DTProtocolVersion || '0.1.0';

      // C++ SDK does not support binary file transfer for now
      if (self._isLowerThanVersion(protocolVer, '0.1.1')) {
        self._dataTransfers[transferId].enforceBSPeers.push(listOfPeers[p]);
      }
    }

    if (self._dataTransfers[transferId].enforceBSPeers.length > 0) {
      var bsChunkSize = window.webrtcDetectedBrowser === 'firefox' ? self._MOZ_CHUNK_FILE_SIZE : self._CHUNK_FILE_SIZE;
      var bsChunks = self._chunkBlobData(new Blob(chunks), bsChunkSize);

      self._dataTransfers[transferId].enforceBSInfo = {
        chunkSize: 4 * Math.ceil(bsChunkSize / 3),
        chunkType: self.DATA_TRANSFER_DATA_TYPE.BINARY_STRING,
        size: 4 * Math.ceil(transferInfo.originalSize / 3),
        chunks: bsChunks
      };
    }
  }

  /**
   * Complete Peer function.
   */
  var completeFn = function (peerId, error) {
    // Ignore if already added.
    if (transferCompleted.indexOf(peerId) > -1) {
      return;
    }

    log.debug([peerId, 'RTCDataChannel', transferId, 'Data transfer result. Is errors present? ->'], error);

    transferCompleted.push(peerId);

    if (error) {
      transferErrors[peerId] = new Error(error);
    }

    if (listOfPeers.length === transferCompleted.length) {
      log.log([null, 'RTCDataChannel', transferId, 'Data transfer request completed']);

      if (typeof callback === 'function') {
        if (Object.keys(transferErrors).length > 0) {
          callback({
            transferId: transferId,
            transferInfo: self._getTransferInfo(transferId, peerId, false, true, false),
            transferErrors: transferErrors,
            listOfPeers: listOfPeers
          }, null);
        } else {
          callback(null, {
            transferId: transferId,
            transferInfo: self._getTransferInfo(transferId, peerId, false, true, false),
            listOfPeers: listOfPeers
          });
        }
      }
    }
  };

  for (var i = 0; i < listOfPeers.length; i++) {
    var MCUInteropStatus = self._startDataTransferToPeer(transferId, listOfPeers[i], completeFn, null, null);

    if (typeof MCUInteropStatus === 'boolean') {
      if (MCUInteropStatus === true) {
        self._dataTransfers[transferId].peers.main[listOfPeers[i]] = true;
      } else {
        self._dataTransfers[transferId].peers[transferId][listOfPeers[i]] = true;
      }
    }
  }

  if (self._hasMCU) {
    if (Object.keys(self._dataTransfers[transferId].peers.main).length > 0) {
      self._startDataTransferToPeer(transferId, 'MCU', completeFn, 'main',
        Object.keys(self._dataTransfers[transferId].peers.main));
    }

    if (Object.keys(self._dataTransfers[transferId].peers[transferId]).length > 0) {
      self._startDataTransferToPeer(transferId, 'MCU', completeFn, transferId,
        Object.keys(self._dataTransfers[transferId].peers[transferId]));
    }
  }
};

/**
 * Function that starts or listens the data transfer status to Peer.
 * This reacts differently during MCU environment.
 * @method _startDataTransferToPeer
 * @return {Boolean} Returns a Boolean only during MCU environment which flag indicates if Peer requires interop
 *   (Use messaging Datachannel connection instead).
 * @private
 * @since 0.6.16
 */
Skylink.prototype._startDataTransferToPeer = function (transferId, peerId, callback, channelProp, targetPeers) {
  var self = this;

  var peerConnectionStateCbFn = null;
  var dataChannelStateCbFn = null;

  /**
   * Emit event for Peers function.
   */
  var emitEventFn = function (cb) {
    var peers = targetPeers || [peerId];
    for (var i = 0; i < peers.length; i++) {
      cb(peers[i]);
    }
  };

  /**
   * Return error and trigger them if failed before or during data transfers function.
   */
  var returnErrorBeforeTransferFn = function (error) {
    // Replace if it is a MCU Peer errors for clear indication in error message
    var updatedError = peerId === 'MCU' ? error.replace(/Peer/g, 'MCU Peer') : error;

    emitEventFn(function (evtPeerId) {
      self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.ERROR, transferId, evtPeerId,
        self._getTransferInfo(transferId, peerId, true, true, false), {
        message: new Error(updatedError),
        transferType: self.DATA_TRANSFER_TYPE.UPLOAD
      });
    });
  };

  /**
   * Send WRQ protocol to start data transfers.
   */
  var sendWRQFn = function () {
    var size = self._dataTransfers[transferId].size;
    var chunkSize = self._dataTransfers[transferId].chunkSize;
    var chunkType = self._dataTransfers[transferId].sessionChunkType;

    if (self._dataTransfers[transferId].enforceBSPeers.indexOf(peerId) > -1) {
      log.warn([peerId, 'RTCDataChannel', transferId,
        'Binary data chunks transfer is not yet supported with Peer connecting from ' +
        'Android, iOS and C++ SDK. Fallbacking to binary string data chunks transfer.']);

      size = self._dataTransfers[transferId].enforceBSInfo.size;
      chunkSize = self._dataTransfers[transferId].enforceBSInfo.chunkSize;
      chunkType = 'string';
    }

    self._sendMessageToDataChannel(peerId, {
      type: self._DC_PROTOCOL_TYPE.WRQ,
      transferId: transferId,
      name: self._dataTransfers[transferId].name,
      size: size,
      originalSize: self._dataTransfers[transferId].originalSize,
      dataType: self._dataTransfers[transferId].sessionType,
      mimeType: self._dataTransfers[transferId].mimeType,
      chunkType: chunkType,
      chunkSize: chunkSize,
      timeout: self._dataTransfers[transferId].timeout,
      isPrivate: self._dataTransfers[transferId].isPrivate,
      sender: self._user.id,
      agent: window.webrtcDetectedBrowser,
      version: window.webrtcDetectedVersion,
      target: targetPeers ? targetPeers : peerId
    }, channelProp);

    emitEventFn(function (evtPeerId) {
      self._trigger('incomingDataRequest', transferId, evtPeerId,
        self._getTransferInfo(transferId, peerId, false, false, false), true);

      self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.USER_UPLOAD_REQUEST, transferId, evtPeerId,
        self._getTransferInfo(transferId, peerId, true, false, false), null);
    });
  };

  // Listen to data transfer state
  if (peerId !== 'MCU') {
    var dataTransferStateCbFn = function (state, evtTransferId, evtPeerId, transferInfo, error) {
      if (peerConnectionStateCbFn) {
        self.off('peerConnectionState', peerConnectionStateCbFn);
      }

      if (dataChannelStateCbFn) {
        self.off('dataChannelState', dataChannelStateCbFn);
      }

      if (channelProp) {
        delete self._dataTransfers[transferId].peers[channelProp][peerId];
      }

      if (state === self.DATA_TRANSFER_STATE.UPLOAD_COMPLETED) {
        callback(peerId, null);
      } else {
        callback(peerId, error.message.message || error.message.toString());
      }

      // Handle Peer uploading to MCU case
      if (self._hasMCU && self._dataTransfers[transferId].direction === self.DATA_TRANSFER_TYPE.UPLOAD) {
        if (!(Object.keys(self._dataTransfers[transferId].peers.main).length === 0 &&
          Object.keys(self._dataTransfers[transferId].peers[transferId]).length === 0)) {
          return;
        }

        delete self._dataTransfers[transferId];

      } else {
        delete self._dataTransfers[transferId].sessions[peerId];

        if (Object.keys(self._dataTransfers[transferId].sessions).length === 0) {
          delete self._dataTransfers[transferId];
        }
      }
    };

    self.once('dataTransferState', dataTransferStateCbFn, function (state, evtTransferId, evtPeerId) {
      if (!(self._dataTransfers[transferId] && (self._hasMCU ? (self._dataTransfers[transferId].peers.main[peerId] ||
        self._dataTransfers[transferId].peers[transferId][peerId]) : self._dataTransfers[transferId].sessions[peerId]))) {
        if (dataTransferStateCbFn) {
          self.off('dataTransferState', dataTransferStateCbFn);
        }
        if (peerConnectionStateCbFn) {
          self.off('peerConnectionState', peerConnectionStateCbFn);
        }
        if (dataChannelStateCbFn) {
          self.off('dataChannelState', dataChannelStateCbFn);
        }
        return;
      }
      return evtTransferId === transferId && evtPeerId === peerId &&
        [self.DATA_TRANSFER_STATE.UPLOAD_COMPLETED, self.DATA_TRANSFER_STATE.ERROR,
        self.DATA_TRANSFER_STATE.CANCEL, self.DATA_TRANSFER_STATE.REJECTED].indexOf(state) > -1;
    });
  }

  // When Peer connection does not exists
  if (!self._peerConnections[peerId]) {
    returnErrorBeforeTransferFn('Unable to start data transfer as Peer connection does not exists.');
    return;
  }

  // When Peer session does not exists
  if (!self._peerInformations[peerId]) {
    returnErrorBeforeTransferFn('Unable to start data transfer as Peer connection does not exists.');
    return;
  }

  // When Peer connection is not STABLE
  if (self._peerConnections[peerId].signalingState !== self.PEER_CONNECTION_STATE.STABLE) {
    returnErrorBeforeTransferFn('Unable to start data transfer as Peer connection is not stable.');
    return;
  }

  if (!self._dataTransfers[transferId]) {
    returnErrorBeforeTransferFn('Unable to start data transfer as data transfer session is not in order.');
    return;
  }

  if (!(self._dataChannels[peerId] && self._dataChannels[peerId].main)) {
    returnErrorBeforeTransferFn('Unable to start data transfer as Peer Datachannel connection does not exists.');
    return;
  }

  if (self._dataChannels[peerId].main.channel.readyState !== self.DATA_CHANNEL_STATE.OPEN) {
    returnErrorBeforeTransferFn('Unable to start data transfer as Peer Datachannel connection is not opened.');
    return;
  }

  var protocolVer = (self._peerInformations[peerId].agent || {}).DTProtocolVersion || '0.1.0';
  var requireInterop = self._isLowerThanVersion(protocolVer, '0.1.0.1');

  // Prevent DATA_URL (or "string" dataType transfers) with Android / iOS / C++ SDKs
  if (self._isLowerThanVersion(protocolVer, '0.1.1') && self._dataTransfers[transferId].sessionType === 'data' &&
    self._dataTransfers[transferId].sessionChunkType === 'string') {
    returnErrorBeforeTransferFn('Unable to start data transfer as Peer do not support DATA_URL type of data transfers');
    return;
  }

  // Listen to Peer connection state for MCU Peer
  if (peerId !== 'MCU' && self._hasMCU) {
    channelProp = requireInterop ? 'main' : transferId;

    peerConnectionStateCbFn = function () {
      returnErrorBeforeTransferFn('Data transfer terminated as Peer connection is not stable.');
    };

    self.once('peerConnectionState', peerConnectionStateCbFn, function (state, evtPeerId) {
      if (!self._dataTransfers[transferId]) {
        self.off('peerConnectionState', peerConnectionStateCbFn);
        return;
      }
      return state !== self.PEER_CONNECTION_STATE.STABLE && evtPeerId === peerId;
    });
    return requireInterop;
  }

  if (requireInterop || channelProp === 'main') {
    // When MCU Datachannel connection has a transfer in-progress
    if (self._dataChannels[peerId].main.transferId) {
      returnErrorBeforeTransferFn('Unable to start data transfer as Peer Datachannel has a data transfer in-progress.');
      return;
    }
  }

  self._dataTransfers[transferId].sessions[peerId] = {
    timer: null,
    ackN: 0
  };

  dataChannelStateCbFn = function (state, evtPeerId, error) {
    // Prevent from triggering in instances where the ackN === chunks.length
    if (self._dataTransfers[transferId].sessions[peerId].ackN >= (self._dataTransfers[transferId].chunks.length - 1)) {
      return;
    }

    if (error) {
      returnErrorBeforeTransferFn(error.message || error.toString());
    } else {
      returnErrorBeforeTransferFn('Data transfer terminated as Peer Datachannel connection closed abruptly.');
    }
  };

  self.once('dataChannelState', dataChannelStateCbFn, function (state, evtPeerId, error, channelName, channelType) {
    if (!(self._dataTransfers[transferId] && self._dataTransfers[transferId].sessions[peerId])) {
      self.off('dataChannelState', dataChannelStateCbFn);
      return;
    }

    if (evtPeerId === peerId && (channelType === self.DATA_CHANNEL_TYPE.DATA ? channelName === transferId : true)) {
      if (state === self.DATA_CHANNEL_STATE.OPEN && channelType === self.DATA_CHANNEL_TYPE.DATA &&
        channelName === transferId) {
        sendWRQFn();
        return false;
      }
      return [self.DATA_CHANNEL_STATE.CREATE_ERROR, self.DATA_CHANNEL_STATE.ERROR,
        self.DATA_CHANNEL_STATE.CLOSING, self.DATA_CHANNEL_STATE.CLOSED].indexOf(state) > -1;
    }
  });

  // Create new Datachannel for Peer to start data transfer
  if (!((requireInterop && peerId !== 'MCU') || channelProp === 'main')) {
    channelProp = transferId;

    self._createDataChannel(peerId, transferId);

  } else {
    self._dataChannels[peerId].main.transferId = transferId;

    sendWRQFn();
  }
};

/**
 * Function that returns the data transfer session.
 * @method _getTransferInfo
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._getTransferInfo = function (transferId, peerId, returnDataProp, hidePercentage, returnDataAtStart) {
  if (!this._dataTransfers[transferId]) {
    return {};
  }

  var transferInfo = {
    name: this._dataTransfers[transferId].name,
    size: this._dataTransfers[transferId].size,
    dataType: this._dataTransfers[transferId].dataType || this.DATA_TRANSFER_SESSION_TYPE.BLOB,
    mimeType: this._dataTransfers[transferId].mimeType || null,
    chunkSize: this._dataTransfers[transferId].chunkSize,
    chunkType: this._dataTransfers[transferId].chunkType,
    timeout: this._dataTransfers[transferId].timeout,
    isPrivate: this._dataTransfers[transferId].isPrivate,
    direction: this._dataTransfers[transferId].direction
  };

  if (this._dataTransfers[transferId].originalSize) {
    transferInfo.size = this._dataTransfers[transferId].originalSize;

  } else if (this._dataTransfers[transferId].chunkType === this.DATA_TRANSFER_DATA_TYPE.BINARY_STRING) {
    transferInfo.size = Math.ceil(transferInfo.size * 3 / 4);
  }

  if (!hidePercentage) {
    transferInfo.percentage = 0;

    if (!this._dataTransfers[transferId].sessions[peerId]) {
      if (returnDataProp) {
        transferInfo.data = null;
      }
      return transferInfo;
    }

    if (this._dataTransfers[transferId].direction === this.DATA_TRANSFER_TYPE.DOWNLOAD) {
      if (this._dataTransfers[transferId].sessions[peerId].receivedSize === this._dataTransfers[transferId].sessions[peerId].size) {
        transferInfo.percentage = 100;

      } else {
        transferInfo.percentage = parseFloat(((this._dataTransfers[transferId].sessions[peerId].receivedSize /
          this._dataTransfers[transferId].size) * 100).toFixed(2), 10);
      }
    } else {
      var chunksLength = (this._dataTransfers[transferId].enforceBSPeers.indexOf(peerId) > -1 ?
        this._dataTransfers[transferId].enforceBSInfo.chunks.length : this._dataTransfers[transferId].chunks.length);

      if (this._dataTransfers[transferId].sessions[peerId].ackN === chunksLength) {
        transferInfo.percentage = 100;

      } else {
        transferInfo.percentage = parseFloat(((this._dataTransfers[transferId].sessions[peerId].ackN /
          chunksLength) * 100).toFixed(2), 10);
      }
    }

    if (returnDataProp) {
      if (typeof returnDataAtStart !== 'number') {
        if (transferInfo.percentage === 100) {
          transferInfo.data = this._getTransferData(transferId);
        } else {
          transferInfo.data = null;
        }
      } else {
        transferInfo.percentage = returnDataAtStart;

        if (returnDataAtStart === 0) {
          transferInfo.data = this._getTransferData(transferId);
        }
      }
    }
  }

  return transferInfo;
};

/**
 * Function that returns the compiled data transfer data.
 * @method _getTransferData
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._getTransferData = function (transferId) {
  if (!this._dataTransfers[transferId]) {
    return null;
  }

  if (this._dataTransfers[transferId].dataType === this.DATA_TRANSFER_SESSION_TYPE.BLOB) {
    var mimeType = {
      name: this._dataTransfers[transferId].name
    };

    if (this._dataTransfers[transferId].mimeType) {
      mimeType.type = this._dataTransfers[transferId].mimeType;
    }

    return new Blob(this._dataTransfers[transferId].chunks, mimeType);
  }

  return this._dataTransfers[transferId].chunks.join('');
};

/**
 * Function that handles the data transfers sessions timeouts.
 * @method _handleDataTransferTimeoutForPeer
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._handleDataTransferTimeoutForPeer = function (transferId, peerId, setPeerTO) {
  var self = this;

  if (!(self._dataTransfers[transferId] && self._dataTransfers[transferId].sessions[peerId])) {
    log.debug([peerId, 'RTCDataChannel', transferId, 'Data transfer does not exists for Peer. Ignoring timeout.']);
    return;
  }

  log.debug([peerId, 'RTCDataChannel', transferId, 'Clearing data transfer timer for Peer.']);

  if (self._dataTransfers[transferId].sessions[peerId].timer) {
    clearTimeout(self._dataTransfers[transferId].sessions[peerId].timer);
  }

  self._dataTransfers[transferId].sessions[peerId].timer = null;

  if (setPeerTO) {
    log.debug([peerId, 'RTCDataChannel', transferId, 'Setting data transfer timer for Peer.']);

    self._dataTransfers[transferId].sessions[peerId].timer = setTimeout(function () {
      if (!(self._dataTransfers[transferId] && self._dataTransfers[transferId].sessions[peerId])) {
        log.debug([peerId, 'RTCDataChannel', transferId, 'Data transfer already ended for Peer. Ignoring expired timeout.']);
        return;
      }

      if (!self._user.room.connected) {
        log.debug([peerId, 'RTCDataChannel', transferId, 'User is not in Room. Ignoring expired timeout.']);
        return;
      }

      if (!self._dataChannels[peerId]) {
        log.debug([peerId, 'RTCDataChannel', transferId, 'Datachannel connection does not exists. Ignoring expired timeout.']);
        return;
      }

      log.error([peerId, 'RTCDataChannel', transferId, 'Data transfer response has timed out.']);

      /**
       * Emit event for Peers function.
       */
      var emitEventFn = function (cb) {
        if (peerId === 'MCU') {
          var broadcastedPeers = [self._dataTransfers[transferId].peers.main,
            self._dataTransfers[transferId].peers[transferId]];

          for (var i = 0; i < broadcastedPeers.length; i++) {
            // Should not happen but insanity check
            if (!broadcastedPeers[i]) {
              continue;
            }

            for (var bcPeerId in broadcastedPeers[i]) {
              if (broadcastedPeers[i].hasOwnProperty(bcPeerId) && broadcastedPeers[i][bcPeerId]) {
                cb(bcPeerId);
              }
            }
          }
        } else {
          cb(peerId);
        }
      };

      var errorMsg = 'Connection Timeout. Longer than ' + self._dataTransfers[transferId].timeout +
        ' seconds. Connection is abolished.';

      self._sendMessageToDataChannel(peerId, {
        type: self._DC_PROTOCOL_TYPE.ERROR,
        content: errorMsg,
        isUploadError: self._dataTransfers[transferId].direction === self.DATA_TRANSFER_TYPE.UPLOAD,
        sender: self._user.id,
        name: self._dataTransfers[transferId].name
      }, self._dataChannels[peerId][transferId] ? transferId : 'main');

      emitEventFn(function (evtPeerId) {
        self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.ERROR, transferId, peerId,
          self._getTransferInfo(transferId, peerId, true, false, false), {
          transferType: self.DATA_TRANSFER_TYPE.DOWNLOAD,
          message: new Error(errorMsg)
        });
      });
    }, self._dataTransfers[transferId].timeout * 1000);
  }
};

/**
 * Function that handles the data received from Datachannel and
 * routes to the relevant data transfer protocol handler.
 * @method _processDataChannelData
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._processDataChannelData = function(rawData, peerId, channelName, channelType) {
  var self = this;

  var channelProp = channelType === self.DATA_CHANNEL_TYPE.MESSAGING ? 'main' : channelName;
  var transferId = channelProp === 'main' ? self._dataChannels[peerId].main.transferId : channelName;

  if (!self._peerConnections[peerId]) {
    log.warn([peerId, 'RTCDataChannel', channelName, 'Dropping data received from Peer ' +
      'as connection is not present ->'], rawData);
    return;
  }

  if (!(self._dataChannels[peerId] && self._dataChannels[peerId][channelProp])) {
    log.warn([peerId, 'RTCDataChannel', channelName, 'Dropping data received from Peer ' +
      'as Datachannel connection is not present ->'], rawData);
    return;
  }

  // Expect as string
  if (typeof rawData === 'string') {
    try {
      var protocolData = JSON.parse(rawData);

      log.debug([peerId, 'RTCDataChannel', channelProp, 'Received protocol message ->'], protocolData);

      // Ignore ACK, ERROR and CANCEL if there is no data transfer session in-progress
      if ([self._DC_PROTOCOL_TYPE.ACK, self._DC_PROTOCOL_TYPE.ERROR, self._DC_PROTOCOL_TYPE.CANCEL].indexOf(protocolData.type) > -1 &&
        !(transferId && self._dataTransfers[transferId] && self._dataTransfers[transferId].sessions[peerId])) {
          log.warn([peerId, 'RTCDataChannel', channelProp, 'Discarded protocol message as data transfer session ' +
            'is not present ->'], protocolData);
          return;
      }

      switch (protocolData.type) {
        case self._DC_PROTOCOL_TYPE.WRQ:
          // Discard iOS bidirectional upload when Datachannel is in-progress for data transfers
          if (transferId && self._dataTransfers[transferId] && self._dataTransfers[transferId].sessions[peerId]) {
            log.warn([peerId, 'RTCDataChannel', channelProp, 'Rejecting bidirectional data transfer request as ' +
              'it is currently not supported in the SDK']);

            self._sendMessageToDataChannel(peerId, {
              type: self._DC_PROTOCOL_TYPE.ACK,
              ackN: -1,
              sender: self._user.id
            }, channelProp);
            return;
          }
          self._WRQProtocolHandler(peerId, protocolData, channelProp);
          break;
        case self._DC_PROTOCOL_TYPE.ACK:
          self._ACKProtocolHandler(peerId, protocolData, channelProp);
          break;
        case self._DC_PROTOCOL_TYPE.ERROR:
          self._ERRORProtocolHandler(peerId, protocolData, channelProp);
          break;
        case self._DC_PROTOCOL_TYPE.CANCEL:
          self._CANCELProtocolHandler(peerId, protocolData, channelProp);
          break;
        case self._DC_PROTOCOL_TYPE.MESSAGE:
          self._MESSAGEProtocolHandler(peerId, protocolData, channelProp);
          break;
        default:
          log.warn([peerId, 'RTCDataChannel', channelProp, 'Discarded unknown protocol message ->'], protocolData);
      }

    } catch (error) {
      if (rawData.indexOf('{') > -1 && rawData.indexOf('}') > 0) {
        log.error([peerId, 'RTCDataChannel', channelProp, 'Received error ->'], error);

        self._trigger('dataChannelState', self.DATA_CHANNEL_STATE.ERROR, peerId, error, channelName, channelType, null);
        return;
      }

      if (!(transferId && self._dataTransfers[transferId] && self._dataTransfers[transferId].sessions[peerId])) {
        log.warn([peerId, 'RTCDataChannel', channelProp, 'Discarded data chunk as data transfer session ' +
          'is not present ->'], rawData);
        return;
      }

      if (self._dataTransfers[transferId].chunks[self._dataTransfers[transferId].sessions[peerId].ackN]) {
        log.warn([peerId, 'RTCDataChannel', transferId, 'Dropping data chunk as it has already been added ->'], rawData);
        return;
      }

      var chunkType = self.DATA_TRANSFER_DATA_TYPE.BINARY_STRING;

      if (self._dataTransfers[transferId].dataType === self.DATA_TRANSFER_SESSION_TYPE.DATA_URL) {
        log.debug([peerId, 'RTCDataChannel', channelProp, 'Received string data chunk @' +
          self._dataTransfers[transferId].sessions[peerId].ackN + ' with size ->'], rawData.length || rawData.size);

        self._DATAProtocolHandler(peerId, rawData, self.DATA_TRANSFER_DATA_TYPE.STRING,
          rawData.length || rawData.size || 0, channelProp);

      } else {
        var removeSpaceData = rawData.replace(/\s|\r|\n/g, '');

        log.debug([peerId, 'RTCDataChannel', channelProp, 'Received binary string data chunk @' +
          self._dataTransfers[transferId].sessions[peerId].ackN + ' with size ->'],
          removeSpaceData.length || removeSpaceData.size);

        self._DATAProtocolHandler(peerId, self._base64ToBlob(removeSpaceData), self.DATA_TRANSFER_DATA_TYPE.BINARY_STRING,
          removeSpaceData.length || removeSpaceData.size || 0, channelProp);
      }
    }
  } else {
    if (rawData instanceof Blob) {
      if (transferId && self._dataTransfers[transferId]) {
        log.debug([peerId, 'RTCDataChannel', channelProp, 'Received blob data chunk @' +
          self._dataTransfers[transferId].sessions[peerId].ackN + ' with size ->'], rawData.size);
      } else {
        log.debug([peerId, 'RTCDataChannel', channelProp, 'Received blob stream data chunk with size ->'], rawData.size);
      }

      self._DATAProtocolHandler(peerId, rawData, self.DATA_TRANSFER_DATA_TYPE.BLOB, rawData.size, channelProp);

    } else {
      var byteArray = rawData;

      if (rawData.constructor && rawData.constructor.name === 'Array') {
        // Need to re-parse on some browsers
        byteArray = new Int8Array(rawData);
      }

      var blob = new Blob([byteArray]);

      if (transferId && self._dataTransfers[transferId]) {
        log.debug([peerId, 'RTCDataChannel', channelProp, 'Received arraybuffer data chunk @' +
          self._dataTransfers[transferId].sessions[peerId].ackN + ' with size ->'], blob.size);
      } else {
        log.debug([peerId, 'RTCDataChannel', channelProp, 'Received arraybuffer stream data chunk with size ->'], blob.size);
      }

      self._DATAProtocolHandler(peerId, blob, self.DATA_TRANSFER_DATA_TYPE.ARRAY_BUFFER, blob.size, channelProp);
    }
  }
};

/**
 * Function that handles the "WRQ" data transfer protocol.
 * @method _WRQProtocolHandler
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._WRQProtocolHandler = function(peerId, data, channelProp) {
  var self = this;
  var transferId = channelProp === 'main' ? data.transferId || peerId + '_' + (new Date()).getTime() : channelProp;
  var senderPeerId = data.sender || peerId;

  if (data.dataType === 'data' && data.chunkType === 'blob') {
    return;
  }

  self._dataTransfers[transferId] = {
    name: data.name || transferId,
    size: data.size || 0,
    chunkSize: data.chunkSize,
    originalSize: data.originalSize || 0,
    timeout: data.timeout || 60,
    isPrivate: !!data.isPrivate,
    senderPeerId: data.sender || peerId,
    dataType: self.DATA_TRANSFER_SESSION_TYPE.BLOB,
    mimeType: data.mimeType || null,
    chunkType: self.DATA_TRANSFER_DATA_TYPE.BINARY_STRING,
    direction: self.DATA_TRANSFER_TYPE.DOWNLOAD,
    chunks: [],
    sessions: {},
    sessionType: data.dataType || 'blob',
    sessionChunkType: data.chunkType || 'string'
  };

  if (self._dataTransfers[transferId].sessionType === 'data' &&
    self._dataTransfers[transferId].sessionChunkType === 'string') {
    self._dataTransfers[transferId].dataType = self.DATA_TRANSFER_SESSION_TYPE.DATA_URL;
    self._dataTransfers[transferId].chunkType = self.DATA_TRANSFER_DATA_TYPE.STRING;
  } else if (self._dataTransfers[transferId].sessionType === 'blob' &&
    self._dataTransfers[transferId].sessionChunkType === 'binary') {
    self._dataTransfers[transferId].chunkType = self.DATA_TRANSFER_DATA_TYPE.ARRAY_BUFFER;
  }

  self._dataChannels[peerId][channelProp].transferId = transferId;
  self._dataTransfers[transferId].sessions[peerId] = {
    timer: null,
    ackN: 0,
    receivedSize: 0
  };

  self._trigger('incomingDataRequest', transferId, senderPeerId,
    self._getTransferInfo(transferId, peerId, false, false, false), false);

  self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.UPLOAD_REQUEST, transferId, senderPeerId,
    self._getTransferInfo(transferId, peerId, true, false, false), null);
};

/**
 * Function that handles the "ACK" data transfer protocol.
 * @method _ACKProtocolHandler
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._ACKProtocolHandler = function(peerId, data, channelProp) {
  var self = this;

  var transferId = channelProp;
  var senderPeerId = data.sender || peerId;

  if (channelProp === 'main') {
    transferId = self._dataChannels[peerId].main.transferId;
  }

  self._handleDataTransferTimeoutForPeer(transferId, peerId, false);

  /**
   * Emit event for Peers function.
   */
  var emitEventFn = function (cb) {
    if (peerId === 'MCU') {
      if (!self._dataTransfers[transferId].peers[channelProp]) {
        log.warn([peerId, 'RTCDataChannel', channelProp, 'Dropping triggering of ACK event as ' +
          'Peers list does not exists']);
        return;
      }
      for (var evtPeerId in self._dataTransfers[transferId].peers[channelProp]) {
        if (self._dataTransfers[transferId].peers[channelProp].hasOwnProperty(evtPeerId) &&
          self._dataTransfers[transferId].peers[channelProp][evtPeerId]) {
          cb(evtPeerId);
        }
      }
    } else {
      cb(senderPeerId);
    }
  };

  if (data.ackN > -1) {
    if (data.ackN === 0) {
      emitEventFn(function (evtPeerId) {
        self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.UPLOAD_STARTED, transferId, evtPeerId,
          self._getTransferInfo(transferId, peerId, true, false, 0), null);
      });
    } else if (self._dataTransfers[transferId].enforceBSPeers.indexOf(peerId) > -1 ?
      data.ackN === self._dataTransfers[transferId].enforceBSInfo.chunks.length :
      data.ackN === self._dataTransfers[transferId].chunks.length) {
      self._dataTransfers[transferId].sessions[peerId].ackN = data.ackN;

      emitEventFn(function (evtPeerId) {
        self._trigger('incomingData', self._getTransferData(transferId), transferId, evtPeerId,
          self._getTransferInfo(transferId, peerId, false, false, false), true);

        self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.UPLOAD_COMPLETED, transferId, evtPeerId,
          self._getTransferInfo(transferId, peerId, true, false, 100), null);
      });

      if (self._dataChannels[peerId][channelProp]) {
        self._dataChannels[peerId][channelProp].transferId = null;

        if (channelProp !== 'main') {
          self._closeDataChannel(peerId, channelProp);
        }
      }
      return;
    }

    var uploadFn = function (chunk) {
      self._sendMessageToDataChannel(peerId, chunk, channelProp, true);

      if (data.ackN < self._dataTransfers[transferId].chunks.length) {
        emitEventFn(function (evtPeerId) {
          self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.UPLOADING, transferId, evtPeerId,
            self._getTransferInfo(transferId, peerId, true, false, false), null);
        });
      }

      self._handleDataTransferTimeoutForPeer(transferId, peerId, true);
    };

    self._dataTransfers[transferId].sessions[peerId].ackN = data.ackN;

    if (self._dataTransfers[transferId].enforceBSPeers.indexOf(peerId) > -1) {
      self._blobToBase64(self._dataTransfers[transferId].enforceBSInfo.chunks[data.ackN], uploadFn);
    } else if (self._dataTransfers[transferId].chunkType === self.DATA_TRANSFER_DATA_TYPE.BINARY_STRING) {
      self._blobToBase64(self._dataTransfers[transferId].chunks[data.ackN], uploadFn);
    } else if (self._dataTransfers[transferId].chunkType === self.DATA_TRANSFER_DATA_TYPE.ARRAY_BUFFER) {
      self._blobToArrayBuffer(self._dataTransfers[transferId].chunks[data.ackN], uploadFn);
    } else {
      uploadFn(self._dataTransfers[transferId].chunks[data.ackN]);
    }
  } else {
    self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.REJECTED, transferId, senderPeerId,
      self._getTransferInfo(transferId, peerId, true, false, false), {
      message: new Error('Data transfer terminated as Peer has rejected data transfer request'),
      transferType: self.DATA_TRANSFER_TYPE.UPLOAD
    });
  }
};

/**
 * Function that handles the "MESSAGE" data transfer protocol.
 * @method _MESSAGEProtocolHandler
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._MESSAGEProtocolHandler = function(peerId, data, channelProp) {
  var senderPeerId = data.sender || peerId;

  log.log([senderPeerId, 'RTCDataChannel', channelProp, 'Received P2P message from peer:'], data);

  this._trigger('incomingMessage', {
    content: data.data,
    isPrivate: data.isPrivate,
    isDataChannel: true,
    targetPeerId: this._user.id,
    senderPeerId: senderPeerId
  }, senderPeerId, this.getPeerInfo(senderPeerId), false);
};

/**
 * Function that handles the "ERROR" data transfer protocol.
 * @method _ERRORProtocolHandler
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._ERRORProtocolHandler = function(peerId, data, channelProp) {
  var self = this;

  var transferId = channelProp;
  var senderPeerId = data.sender || peerId;

  if (channelProp === 'main') {
    transferId = self._dataChannels[peerId].main.transferId;
  }

  self._handleDataTransferTimeoutForPeer(transferId, peerId, false);

  /**
   * Emit event for Peers function.
   */
  var emitEventFn = function (cb) {
    if (peerId === 'MCU') {
      if (!self._dataTransfers[transferId].peers[channelProp]) {
        log.warn([peerId, 'RTCDataChannel', channelProp, 'Dropping triggering of ERROR event as ' +
          'Peers list does not exists']);
        return;
      }
      for (var evtPeerId in self._dataTransfers[transferId].peers[channelProp]) {
        if (self._dataTransfers[transferId].peers[channelProp].hasOwnProperty(evtPeerId) &&
          self._dataTransfers[transferId].peers[channelProp][evtPeerId]) {
          cb(evtPeerId);
        }
      }
    } else {
      cb(senderPeerId);
    }
  };

  log.error([peerId, 'RTCDataChannel', channelProp, 'Received an error from peer ->'], data);

  emitEventFn(function (evtPeerId) {
    self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.ERROR, transferId, evtPeerId,
      self._getTransferInfo(transferId, peerID, true, false, false), {
      message: new Error(data.content),
      transferType: self._dataTransfers[transferId].direction
    });
  });
};

/**
 * Function that handles the "CANCEL" data transfer protocol.
 * @method _CANCELProtocolHandler
 * @private
 * @for Skylink
 * @since 0.5.0
 */
Skylink.prototype._CANCELProtocolHandler = function(peerId, data, channelProp) {
  var self = this;
  var transferId = channelProp;

  if (channelProp === 'main') {
    transferId = self._dataChannels[peerId].main.transferId;
  }

  self._handleDataTransferTimeoutForPeer(transferId, peerId, false);

  /**
   * Emit event for Peers function.
   */
  var emitEventFn = function (cb) {
    if (peerId === 'MCU') {
      if (!self._dataTransfers[transferId].peers[channelProp]) {
        log.warn([peerId, 'RTCDataChannel', channelProp, 'Dropping triggering of CANCEL event as ' +
          'Peers list does not exists']);
        return;
      }
      for (var evtPeerId in self._dataTransfers[transferId].peers[channelProp]) {
        if (self._dataTransfers[transferId].peers[channelProp].hasOwnProperty(evtPeerId) &&
          self._dataTransfers[transferId].peers[channelProp][evtPeerId]) {
          cb(evtPeerId);
        }
      }
    } else {
      cb(peerId);
    }
  };

  log.error([peerId, 'RTCDataChannel', channelProp, 'Received data transfer termination from peer ->'], data);

  emitEventFn(function (evtPeerId) {
    self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.CANCEL, transferId, evtPeerId,
      self._getTransferInfo(transferId, peerId, true, false, false), {
      message: new Error(data.content || 'Peer has terminated data transfer.'),
      transferType: self._dataTransfers[transferId].direction
    });
  });
};

/**
 * Function that handles the data transfer chunk received.
 * @method _DATAProtocolHandler
 * @private
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._DATAProtocolHandler = function(peerId, chunk, chunkType, chunkSize, channelProp) {
  var self = this;
  var transferId = channelProp;
  var senderPeerId = peerId;

  if (channelProp === 'main') {
    transferId = self._dataChannels[peerId].main.transferId;
  }

  // Check if it is binary stream packet
  if ([self.DATA_TRANSFER_DATA_TYPE.ARRAY_BUFFER, self.DATA_TRANSFER_DATA_TYPE.BLOB].indexOf(chunkType) > -1) {
    // Check if there is data transfer going on
    if (!(transferId && self._dataTransfers[transferId] &&
    // Check if direction is downloading
      self._dataTransfers[transferId].direction === self.DATA_TRANSFER_TYPE.DOWNLOAD &&
    // Check if it is not binary data transfer
      self._dataTransfers[transferId].sessionChunkType === 'binary')) {
      self._trigger('incomingDataStream', {
        content: chunk,
        chunkSize: chunkSize,
        chunkType: chunkType,
        isPrivate: false,
        listOfPeers: null,
        targetPeerId: (self._user ? self._user.id : null) || null,
        senderPeerId: peerId
      }, peerId, self.getPeerInfo(peerId), false);
      return;
    } else if (!transferId) {
      return;
    }
  } else if (!transferId) {
    return;
  }

  if (self._dataTransfers[transferId].senderPeerId) {
    senderPeerId = self._dataTransfers[transferId].senderPeerId;
  }

  self._handleDataTransferTimeoutForPeer(transferId, peerId, false);

  self._dataTransfers[transferId].chunkType = chunkType;
  self._dataTransfers[transferId].sessions[peerId].receivedSize += chunkSize;
  self._dataTransfers[transferId].chunks[self._dataTransfers[transferId].sessions[peerId].ackN] = chunk;

  if (self._dataTransfers[transferId].sessions[peerId].receivedSize >= self._dataTransfers[transferId].size) {
    log.log([peerId, 'RTCDataChannel', channelProp, 'Data transfer has been completed. Computed size ->'],
      self._dataTransfers[transferId].sessions[peerId].receivedSize);

    // Send last ACK to Peer to indicate completion of data transfers
    self._sendMessageToDataChannel(peerId, {
      type: self._DC_PROTOCOL_TYPE.ACK,
      sender: self._user.id,
      ackN: self._dataTransfers[transferId].sessions[peerId].ackN + 1
    }, channelProp);

    self._trigger('incomingData', self._getTransferData(transferId), transferId, senderPeerId,
      self._getTransferInfo(transferId, peerId, false, false, false), null);

    self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.DOWNLOAD_COMPLETED, transferId, senderPeerId,
      self._getTransferInfo(transferId, peerId, true, false, false), null);
    return;
  }

  self._dataTransfers[transferId].sessions[peerId].ackN += 1;

  self._sendMessageToDataChannel(peerId, {
    type: self._DC_PROTOCOL_TYPE.ACK,
    sender: self._user.id,
    ackN: self._dataTransfers[transferId].sessions[peerId].ackN
  }, channelProp);

  self._handleDataTransferTimeoutForPeer(transferId, peerId, true);

  self._trigger('dataTransferState', self.DATA_TRANSFER_STATE.DOWNLOADING, transferId, senderPeerId,
    self._getTransferInfo(transferId, peerId, true, false, false), null);
};

Skylink.prototype.CANDIDATE_GENERATION_STATE = {
  NEW: 'new',
  GATHERING: 'gathering',
  COMPLETED: 'completed'
};

/**
 * <blockquote class="info">
 *   Learn more about how ICE works in this
 *   <a href="https://temasys.com.sg/ice-what-is-this-sorcery/">article here</a>.
 * </blockquote>
 * The list of Peer connection remote ICE candidate processing states for trickle ICE connections.
 * @attribute CANDIDATE_PROCESSING_STATE
 * @param {String} RECEIVED <small>Value <code>"received"</code></small>
 *   The value of the state when the remote ICE candidate was received.
 * @param {String} DROPPED  <small>Value <code>"received"</code></small>
 *   The value of the state when the remote ICE candidate is dropped.
 * @param {String} BUFFERED  <small>Value <code>"buffered"</code></small>
 *   The value of the state when the remote ICE candidate is buffered.
 * @param {String} PROCESSING  <small>Value <code>"processing"</code></small>
 *   The value of the state when the remote ICE candidate is being processed.
 * @param {String} PROCESS_SUCCESS  <small>Value <code>"processSuccess"</code></small>
 *   The value of the state when the remote ICE candidate has been processed successfully.
 *   <small>The ICE candidate that is processed will be used to check against the list of
 *   locally generated ICE candidate to start matching for the suitable pair for the best ICE connection.</small>
 * @param {String} PROCESS_ERROR  <small>Value <code>"processError"</code></small>
 *   The value of the state when the remote ICE candidate has failed to be processed.
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype.CANDIDATE_PROCESSING_STATE = {
  RECEIVED: 'received',
  DROPPED: 'dropped',
  BUFFERED: 'buffered',
  PROCESSING: 'processing',
  PROCESS_SUCCESS: 'processSuccess',
  PROCESS_ERROR: 'processError'
};

/**
 * Function that handles the Peer connection gathered ICE candidate to be sent.
 * @method _onIceCandidate
 * @private
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype._onIceCandidate = function(targetMid, candidate) {
  var self = this;
  var pc = self._peerConnections[targetMid];

  if (!pc) {
    log.warn([targetMid, 'RTCIceCandidate', null, 'Ignoring of ICE candidate event as ' +
      'Peer connection does not exists ->'], candidate);
    return;
  }

  if (candidate.candidate) {
    if (!pc.gathering) {
      log.log([targetMid, 'RTCIceCandidate', null, 'ICE gathering has started.']);

      pc.gathering = true;
      pc.gathered = false;

      self._trigger('candidateGenerationState', self.CANDIDATE_GENERATION_STATE.GATHERING, targetMid);
    }

    var candidateType = candidate.candidate.split(' ')[7];

    log.debug([targetMid, 'RTCIceCandidate', candidateType, 'Generated ICE candidate ->'], candidate);

    if (candidateType === 'endOfCandidates') {
      log.warn([targetMid, 'RTCIceCandidate', candidateType, 'Dropping of sending ICE candidate ' +
        'end-of-candidates signal to prevent errors ->'], candidate);
      return;
    }

    if (self._options.filterCandidatesType[candidateType]) {
      if (!(self._hasMCU && self._forceTURN)) {
        log.warn([targetMid, 'RTCIceCandidate', candidateType, 'Dropping of sending ICE candidate as ' +
          'it matches ICE candidate filtering flag ->'], candidate);
        return;
      }

      log.warn([targetMid, 'RTCIceCandidate', candidateType, 'Not dropping of sending ICE candidate as ' +
        'TURN connections are enforced as MCU is present (and act as a TURN itself) so filtering of ICE candidate ' +
        'flags are not honoured ->'], candidate);
    }

    if (!self._gatheredCandidates[targetMid]) {
      self._gatheredCandidates[targetMid] = {
        sending: { host: [], srflx: [], relay: [] },
        receiving: { host: [], srflx: [], relay: [] }
      };
    }

    self._gatheredCandidates[targetMid].sending[candidateType].push({
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex,
      candidate: candidate.candidate
    });

    if (!self._options.enableIceTrickle) {
      log.warn([targetMid, 'RTCIceCandidate', candidateType, 'Dropping of sending ICE candidate as ' +
        'trickle ICE is disabled ->'], candidate);
      return;
    }

    log.debug([targetMid, 'RTCIceCandidate', candidateType, 'Sending ICE candidate ->'], candidate);

    self._socketSendMessage({
      type: self._SIG_MESSAGE_TYPE.CANDIDATE,
      label: candidate.sdpMLineIndex,
      id: candidate.sdpMid,
      candidate: candidate.candidate,
      mid: self._user.id,
      target: targetMid,
      rid: self._user.room.session.rid
    });

  } else {
    log.log([targetMid, 'RTCIceCandidate', null, 'ICE gathering has completed.']);

    pc.gathering = false;
    pc.gathered = true;

    self._trigger('candidateGenerationState', self.CANDIDATE_GENERATION_STATE.COMPLETED, targetMid);

    // Disable Ice trickle option
    if (!self._options.enableIceTrickle) {
      var sessionDescription = self._peerConnections[targetMid].localDescription;

      if (!(sessionDescription && sessionDescription.type && sessionDescription.sdp)) {
        log.warn([targetMid, 'RTCSessionDescription', null, 'Not sending any session description after ' +
          'ICE gathering completed as it is not present.']);
        return;
      }

      // a=end-of-candidates should present in non-trickle ICE connections so no need to send endOfCandidates message
      self._socketSendMessage({
        type: sessionDescription.type,
        sdp: self._addSDPMediaStreamTrackIDs(targetMid, sessionDescription),
        mid: self._user.id,
        userInfo: self._getUserInfo(),
        target: targetMid,
        rid: self._user.room.session.rid
      });
    } else if (self._gatheredCandidates[targetMid]) {
      self._socketSendMessage({
        type: self._SIG_MESSAGE_TYPE.END_OF_CANDIDATES,
        noOfExpectedCandidates: self._gatheredCandidates[targetMid].sending.srflx.length +
          self._gatheredCandidates[targetMid].sending.host.length +
          self._gatheredCandidates[targetMid].sending.relay.length,
        mid: self._user.id,
        target: targetMid,
        rid: self._user.room.session.rid
      });
    }
  }
};

/**
 * Function that buffers the Peer connection ICE candidate when received
 *   before remote session description is received and set.
 * @method _addIceCandidateToQueue
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._addIceCandidateToQueue = function(targetMid, canId, candidate) {
  var candidateType = candidate.candidate.split(' ')[7];

  log.debug([targetMid, 'RTCIceCandidate', canId + ':' + candidateType, 'Buffering ICE candidate.']);

  this._trigger('candidateProcessingState', this.CANDIDATE_PROCESSING_STATE.BUFFERED,
    targetMid, canId, candidateType, {
    candidate: candidate.candidate,
    sdpMid: candidate.sdpMid,
    sdpMLineIndex: candidate.sdpMLineIndex
  }, null);

  this._peerCandidatesQueue[targetMid] = this._peerCandidatesQueue[targetMid] || [];
  this._peerCandidatesQueue[targetMid].push([canId, candidate]);
};

/**
 * Function that adds all the Peer connection buffered ICE candidates received.
 * This should be called only after the remote session description is received and set.
 * @method _addIceCandidateFromQueue
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._addIceCandidateFromQueue = function(targetMid) {
  this._peerCandidatesQueue[targetMid] = this._peerCandidatesQueue[targetMid] || [];

  for (var i = 0; i < this._peerCandidatesQueue[targetMid].length; i++) {
    var canArray = this._peerCandidatesQueue[targetMid][i];

    if (canArray) {
      var candidateType = canArray[1].candidate.split(' ')[7];

      log.debug([targetMid, 'RTCIceCandidate', canArray[0] + ':' + candidateType, 'Adding buffered ICE candidate.']);

      this._addIceCandidate(targetMid, canArray[0], canArray[1]);
    } else if (this._peerConnections[targetMid] &&
      this._peerConnections[targetMid].signalingState !== this.PEER_CONNECTION_STATE.CLOSED) {
      log.debug([targetMid, 'RTCPeerConnection', null, 'Signaling of end-of-candidates remote ICE gathering.']);
      this._peerConnections[targetMid].addIceCandidate(null);
    }
  }

  delete this._peerCandidatesQueue[targetMid];

  this._signalingEndOfCandidates(targetMid);
};

/**
 * Function that adds the ICE candidate to Peer connection.
 * @method _addIceCandidate
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._addIceCandidate = function (targetMid, canId, candidate) {
  var self = this;
  var candidateType = candidate.candidate.split(' ')[7];

  var onSuccessCbFn = function () {
    log.log([targetMid, 'RTCIceCandidate', canId + ':' + candidateType,
      'Added ICE candidate successfully.']);
    self._trigger('candidateProcessingState', self.CANDIDATE_PROCESSING_STATE.PROCESS_SUCCESS,
      targetMid, canId, candidateType, {
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex
    }, null);
  };

  var onErrorCbFn = function (error) {
    log.error([targetMid, 'RTCIceCandidate', canId + ':' + candidateType,
      'Failed adding ICE candidate ->'], error);
    self._trigger('candidateProcessingState', self.CANDIDATE_PROCESSING_STATE.PROCESS_ERROR,
      targetMid, canId, candidateType, {
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex
    }, error);
  };

  log.debug([targetMid, 'RTCIceCandidate', canId + ':' + candidateType, 'Adding ICE candidate.']);

  self._trigger('candidateProcessingState', self.CANDIDATE_PROCESSING_STATE.PROCESSING,
    targetMid, canId, candidateType, {
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex
    }, null);

  if (!(self._peerConnections[targetMid] &&
    self._peerConnections[targetMid].signalingState !== self.PEER_CONNECTION_STATE.CLOSED)) {
    log.warn([targetMid, 'RTCIceCandidate', canId + ':' + candidateType, 'Dropping ICE candidate ' +
      'as Peer connection does not exists or is closed']);
    self._trigger('candidateProcessingState', self.CANDIDATE_PROCESSING_STATE.DROPPED,
      targetMid, canId, candidateType, {
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex
    }, new Error('Failed processing ICE candidate as Peer connection does not exists or is closed.'));
    return;
  }

  self._peerConnections[targetMid].addIceCandidate(candidate, onSuccessCbFn, onErrorCbFn);
};
Skylink.prototype.ICE_CONNECTION_STATE = {
  STARTING: 'starting',
  CHECKING: 'checking',
  CONNECTED: 'connected',
  COMPLETED: 'completed',
  CLOSED: 'closed',
  FAILED: 'failed',
  TRICKLE_FAILED: 'trickleFailed',
  DISCONNECTED: 'disconnected'
};

/**
 * <blockquote class="info">
 *   Note that configuring the protocol may not necessarily result in the desired network transports protocol
 *   used in the actual TURN network traffic as it depends which protocol the browser selects and connects with.
 *   This simply configures the TURN ICE server urls <code?transport=(protocol)</code> query option when constructing
 *   the Peer connection. When all protocols are selected, the ICE servers urls are duplicated with all protocols.
 * </blockquote>
 * The list of TURN network transport protocols options when constructing Peer connections
 * configured in the <a href="#method_init"><code>init()</code> method</a>.
 * <small>Example <code>.urls</code> inital input: [<code>"turn:server.com?transport=tcp"</code>,
 * <code>"turn:server1.com:3478"</code>, <code>"turn:server.com?transport=udp"</code>]</small>
 * @attribute TURN_TRANSPORT
 * @param {String} TCP <small>Value  <code>"tcp"</code></small>
 *   The value of the option to configure using only TCP network transport protocol.
 *   <small>Example <code>.urls</code> output: [<code>"turn:server.com?transport=tcp"</code>,
 *   <code>"turn:server1.com:3478?transport=tcp"</code>]</small>
 * @param {String} UDP <small>Value  <code>"udp"</code></small>
 *   The value of the option to configure using only UDP network transport protocol.
 *   <small>Example <code>.urls</code> output: [<code>"turn:server.com?transport=udp"</code>,
 *   <code>"turn:server1.com:3478?transport=udp"</code>]</small>
 * @param {String} ANY <small>Value  <code>"any"</code></small>
 *   The value of the option to configure using any network transport protocols configured from the Signaling server.
 *   <small>Example <code>.urls</code> output: [<code>"turn:server.com?transport=tcp"</code>,
 *   <code>"turn:server1.com:3478"</code>, <code>"turn:server.com?transport=udp"</code>]</small>
 * @param {String} NONE <small>Value <code>"none"</code></small>
 *   The value of the option to not configure using any network transport protocols.
 *   <small>Example <code>.urls</code> output: [<code>"turn:server.com"</code>, <code>"turn:server1.com:3478"</code>]</small>
 *   <small>Configuring this does not mean that no protocols will be used, but
 *   rather removing <code>?transport=(protocol)</code> query option in
 *   the TURN ICE server <code>.urls</code> when constructing the Peer connection.</small>
 * @param {String} ALL <small>Value  <code>"all"</code></small>
 *   The value of the option to configure using both TCP and UDP network transport protocols.
 *   <small>Example <code>.urls</code> output: [<code>"turn:server.com?transport=tcp"</code>,
 *   <code>"turn:server.com?transport=udp"</code>, <code>"turn:server1.com:3478?transport=tcp"</code>,
 *   <code>"turn:server1.com:3478?transport=udp"</code>]</small>
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.5.4
 */
Skylink.prototype.TURN_TRANSPORT = {
  UDP: 'udp',
  TCP: 'tcp',
  ANY: 'any',
  NONE: 'none',
  ALL: 'all'
};

/**
 * Function that filters and configures the ICE servers received from Signaling
 *   based on the <code>init()</code> configuration and returns the updated
 *   list of ICE servers to be used when constructing Peer connection.
 * @method _setIceServers
 * @private
 * @for Skylink
 * @since 0.5.4
 */
Skylink.prototype._setIceServers = function(givenConfig) {
  var self = this;
  var givenIceServers = clone(givenConfig.iceServers);
  var iceServersList = {};
  var newIceServers = [];
  // TURN SSL config
  var useTURNSSLProtocol = false;
  var useTURNSSLPort = false;



  if (self._options.forceTURNSSL) {
    if (window.webrtcDetectedBrowser === 'chrome' ||
      window.webrtcDetectedBrowser === 'safari' ||
      window.webrtcDetectedBrowser === 'IE') {
      useTURNSSLProtocol = true;
    } else {
      useTURNSSLPort = true;
    }
  }

  log.log('TURN server connections SSL configuration', {
    useTURNSSLProtocol: useTURNSSLProtocol,
    useTURNSSLPort: useTURNSSLPort
  });

  var pushIceServer = function (username, credential, url, index) {
    if (!iceServersList[username]) {
      iceServersList[username] = {};
    }

    if (!iceServersList[username][credential]) {
      iceServersList[username][credential] = [];
    }

    if (self._options.iceServer && url.indexOf('temasys') > 0) {
      var parts = url.split(':');
      var subparts = (parts[1] || '').split('?');
      subparts[0] = self._options.iceServer;
      parts[1] = subparts.join('?');
      url = parts.join(':');
    }

    if (iceServersList[username][credential].indexOf(url) === -1) {
      if (typeof index === 'number') {
        iceServersList[username][credential].splice(index, 0, url);
      } else {
        iceServersList[username][credential].push(url);
      }
    }
  };

  var i, serverItem;

  for (i = 0; i < givenIceServers.length; i++) {
    var server = givenIceServers[i];

    if (typeof server.url !== 'string') {
      log.warn('Ignoring ICE server provided at index ' + i, clone(server));
      continue;
    }

    if (server.url.indexOf('stun') === 0) {
      if (!self._options.enableSTUNServer) {
        log.warn('Ignoring STUN server provided at index ' + i, clone(server));
        continue;
      }

      if (!self._options.usePublicSTUN && server.url.indexOf('temasys') === -1) {
        log.warn('Ignoring public STUN server provided at index ' + i, clone(server));
        continue;
      }

    } else if (server.url.indexOf('turn') === 0) {
      if (!self._options.enableTURNServer) {
        log.warn('Ignoring TURN server provided at index ' + i, clone(server));
        continue;
      }

      if (server.url.indexOf(':443') === -1 && useTURNSSLPort) {
        log.log('Ignoring TURN Server (non-SSL port) provided at index ' + i, clone(server));
        continue;
      }

      if (useTURNSSLProtocol) {
        var parts = server.url.split(':');
        parts[0] = 'turns';
        server.url = parts.join(':');
      }
    }

    // parse "@" settings
    if (server.url.indexOf('@') > 0) {
      var protocolParts = server.url.split(':');
      var urlParts = protocolParts[1].split('@');
      server.username = urlParts[0];
      server.url = protocolParts[0] + ':' + urlParts[1];

      // add the ICE server port
      // Edge uses 3478 with ?transport=udp for now
      if (window.webrtcDetectedBrowser === 'edge') {
        server.url += ':3478';
      } else if (protocolParts[2]) {
        server.url += ':' + protocolParts[2];
      }
    }

    var username = typeof server.username === 'string' ? server.username : 'none';
    var credential = typeof server.credential === 'string' ? server.credential : 'none';

    if (server.url.indexOf('turn') === 0) {
      if (self._options.TURNServerTransport === self.TURN_TRANSPORT.ANY) {
        pushIceServer(username, credential, server.url);

      } else {
        var rawUrl = server.url;

        if (rawUrl.indexOf('?transport=') > 0) {
          rawUrl = rawUrl.split('?transport=')[0];
        }

        if (self._options.TURNServerTransport === self.TURN_TRANSPORT.NONE) {
          pushIceServer(username, credential, rawUrl);
        } else if (self._options.TURNServerTransport === self.TURN_TRANSPORT.UDP) {
          pushIceServer(username, credential, rawUrl + '?transport=udp');
        } else if (self._options.TURNServerTransport === self.TURN_TRANSPORT.TCP) {
          pushIceServer(username, credential, rawUrl + '?transport=tcp');
        } else if (self._options.TURNServerTransport === self.TURN_TRANSPORT.ALL) {
          pushIceServer(username, credential, rawUrl + '?transport=tcp');
          pushIceServer(username, credential, rawUrl + '?transport=udp');
        } else {
          log.warn('Invalid TURN transport option "' + self._options.TURNServerTransport +
            '". Ignoring TURN server at index' + i, clone(server));
          continue;
        }
      }
    } else {
      pushIceServer(username, credential, server.url);
    }
  }

  // add mozilla STUN for firefox
  if (self._options.enableSTUNServer && self._options.usePublicSTUN && window.webrtcDetectedBrowser === 'firefox') {
    pushIceServer('none', 'none', 'stun:stun.services.mozilla.com', 0);
  }

  var hasUrlsSupport = false;

  if (window.webrtcDetectedBrowser === 'chrome' && window.webrtcDetectedVersion > 34) {
    hasUrlsSupport = true;
  }

  if (window.webrtcDetectedBrowser === 'firefox' && window.webrtcDetectedVersion > 38) {
    hasUrlsSupport = true;
  }

  if (window.webrtcDetectedBrowser === 'opera' && window.webrtcDetectedVersion > 31) {
    hasUrlsSupport = true;
  }

  // plugin supports .urls
  if (window.webrtcDetectedBrowser === 'safari' || window.webrtcDetectedBrowser === 'IE') {
    hasUrlsSupport = true;
  }

  // bowser / edge
  if (['bowser', 'edge'].indexOf(window.webrtcDetectedBrowser) > -1) {
    hasUrlsSupport = true;
  }

  for (var serverUsername in iceServersList) {
    if (iceServersList.hasOwnProperty(serverUsername)) {
      for (var serverCred in iceServersList[serverUsername]) {
        if (iceServersList[serverUsername].hasOwnProperty(serverCred)) {
          if (hasUrlsSupport) {
            var urlsItem = {
              urls: iceServersList[serverUsername][serverCred]
            };
            if (serverUsername !== 'none') {
              urlsItem.username = serverUsername;
            }
            if (serverCred !== 'none') {
              urlsItem.credential = serverCred;
            }

            // Edge uses 1 url only for now
            if (window.webrtcDetectedBrowser === 'edge') {
              if (urlsItem.username && urlsItem.credential) {
                urlsItem.urls = [urlsItem.urls[0]];
                newIceServers.push(urlsItem);
                break;
              }
            } else {
              newIceServers.push(urlsItem);
            }
          } else {
            for (var j = 0; j < iceServersList[serverUsername][serverCred].length; j++) {
              var urlItem = {
                url: iceServersList[serverUsername][serverCred][j]
              };
              if (serverUsername !== 'none') {
                urlItem.username = serverUsername;
              }
              if (serverCred !== 'none') {
                urlItem.credential = serverCred;
              }
              newIceServers.push(urlItem);
            }
          }
        }
      }
    }
  }

  log.log('Output iceServers configuration:', newIceServers);

  return newIceServers;
};
Skylink.prototype.PEER_CONNECTION_STATE = {
  STABLE: 'stable',
  HAVE_LOCAL_OFFER: 'have-local-offer',
  HAVE_REMOTE_OFFER: 'have-remote-offer',
  CLOSED: 'closed'
};

/**
 * The list of <a href="#method_getConnectionStatus"><code>getConnectionStatus()</code>
 * method</a> retrieval states.
 * @attribute GET_CONNECTION_STATUS_STATE
 * @param {Number} RETRIEVING <small>Value <code>0</code></small>
 *   The value of the state when <code>getConnectionStatus()</code> is retrieving the Peer connection stats.
 * @param {Number} RETRIEVE_SUCCESS <small>Value <code>1</code></small>
 *   The value of the state when <code>getConnectionStatus()</code> has retrieved the Peer connection stats successfully.
 * @param {Number} RETRIEVE_ERROR <small>Value <code>-1</code></small>
 *   The value of the state when <code>getConnectionStatus()</code> has failed retrieving the Peer connection stats.
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype.GET_CONNECTION_STATUS_STATE = {
  RETRIEVING: 0,
  RETRIEVE_SUCCESS: 1,
  RETRIEVE_ERROR: -1
};

/**
 * <blockquote class="info">
 *  As there are more features getting implemented, there will be eventually more different types of
 *  server Peers.
 * </blockquote>
 * The list of available types of server Peer connections.
 * @attribute SERVER_PEER_TYPE
 * @param {String} MCU <small>Value <code>"mcu"</code></small>
 *   The value of the server Peer type that is used for MCU connection.
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype.SERVER_PEER_TYPE = {
  MCU: 'mcu'
  //SIP: 'sip'
};

/**
 * <blockquote class="info">
 *   Note that Edge browser does not support renegotiation.
 *   For MCU enabled Peer connections with <code>options.mcuUseRenegoRestart</code> set to <code>false</code>
 *   in the <a href="#method_init"><code>init()</code> method</a>, the restart functionality may differ, you
 *   may learn more about how to workaround it
 *   <a href="http://support.temasys.io/support/discussions/topics/12000002853">in this article here</a>.
 *   For restarts with Peers connecting from Android, iOS or C++ SDKs, restarts might not work as written in
 *   <a href="http://support.temasys.io/support/discussions/topics/12000005188">in this article here</a>.
 *   Note that this functionality should be used when Peer connection stream freezes during a connection.
 *   For a better user experience for only MCU enabled Peer connections, the functionality is throttled when invoked many
 *   times in less than the milliseconds interval configured in the <a href="#method_init"><code>init()</code> method</a>.
 * </blockquote>
 * Function that refreshes Peer connections to update with the current streaming.
 * @method refreshConnection
 * @param {String|Array} [targetPeerId] <blockquote class="info">
 *   Note that this is ignored if MCU is enabled for the App Key provided in
 *   <a href="#method_init"><code>init()</code> method</a>. <code>refreshConnection()</code> will "refresh"
 *   all Peer connections. See the <u>Event Sequence</u> for more information.</blockquote>
 *   The target Peer ID to refresh connection with.
 * - When provided as an Array, it will refresh all connections with all the Peer IDs provided.
 * - When not provided, it will refresh all the currently connected Peers in the Room.
 * @param {Boolean} [iceRestart=false] <blockquote class="info">
 *   Note that this flag will not be honoured for MCU enabled Peer connections where
 *   <code>options.mcuUseRenegoRestart</code> flag is set to <code>false</code> as it is not necessary since for MCU
 *   "restart" case is to invoke <a href="#method_joinRoom"><code>joinRoom()</code> method</a> again, or that it is
 *   not supported by the MCU.</blockquote>
 *   The flag if ICE connections should restart when refreshing Peer connections.
 *   <small>This is used when ICE connection state is <code>FAILED</code> or <code>DISCONNECTED</code>, which state
 *   can be retrieved with the <a href="#event_iceConnectionState"><code>iceConnectionState</code> event</a>.</small>
 * @param {Function} [callback] The callback function fired when request has completed.
 *   <small>Function parameters signature is <code>function (error, success)</code></small>
 *   <small>Function request completion is determined by the <a href="#event_peerRestart">
 *   <code>peerRestart</code> event</a> triggering <code>isSelfInitiateRestart</code> parameter payload
 *   value as <code>true</code> for all Peers targeted for request success.</small>
 * @param {JSON} callback.error The error result in request.
 *   <small>Defined as <code>null</code> when there are no errors in request</small>
 * @param {Array} callback.error.listOfPeers The list of Peer IDs targeted.
 * @param {JSON} callback.error.refreshErrors The list of Peer connection refresh errors.
 * @param {Error|String} callback.error.refreshErrors.#peerId The Peer connection refresh error associated
 *   with the Peer ID defined in <code>#peerId</code> property.
 *   <small>If <code>#peerId</code> value is <code>"self"</code>, it means that it is the error when there
 *   is no Peer connections to refresh with.</small>
 * @param {JSON} callback.success The success result in request.
 *   <small>Defined as <code>null</code> when there are errors in request</small>
 * @param {Array} callback.success.listOfPeers The list of Peer IDs targeted.
 * @trigger <ol class="desc-seq">
 *   <li>Checks if MCU is enabled for App Key provided in <a href="#method_init"><code>init()</code> method</a><ol>
 *   <li>If MCU is enabled: <ol><li>If there are connected Peers in the Room: <ol>
 *   <li><a href="#event_peerRestart"><code>peerRestart</code> event</a> triggers parameter payload
 *   <code>isSelfInitiateRestart</code> value as <code>true</code> for all connected Peer connections.</li>
 *   <li><a href="#event_serverPeerRestart"><code>serverPeerRestart</code> event</a> triggers for
 *   connected MCU server Peer connection.</li></ol></li>
 *   <li>If <code>options.mcuUseRenegoRestart</code> value is <code>false</code> set in the
 *   <a href="#method_init"><code>init()</code> method</a>: <ol><li>
 *   Invokes <a href="#method_joinRoom"><code>joinRoom()</code> method</a> <small><code>refreshConnection()</code>
 *   will retain the User session information except the Peer ID will be a different assigned ID due to restarting the
 *   Room session.</small> <ol><li>If request has errors <ol><li><b>ABORT</b> and return error.
 *   </li></ol></li></ol></li></ol></li></ol></li>
 *   <li>Else: <ol><li>If there are connected Peers in the Room: <ol>
 *   <li>Refresh connections for all targeted Peers. <ol>
 *   <li>If Peer connection exists: <ol>
 *   <li><a href="#event_peerRestart"><code>peerRestart</code> event</a> triggers parameter payload
 *   <code>isSelfInitiateRestart</code> value as <code>true</code> for all targeted Peer connections.</li></ol></li>
 *   <li>Else: <ol><li><b>ABORT</b> and return error.</li></ol></li>
 *   </ol></li></ol></li></ol></ol></li></ol></li></ol>
 * @example
 *   // Example 1: Refreshing a Peer connection
 *   function refreshFrozenVideoStream (peerId) {
 *     skylinkDemo.refreshConnection(peerId, function (error, success) {
 *       if (error) return;
 *       console.log("Refreshing connection for '" + peerId + "'");
 *     });
 *   }
 *
 *   // Example 2: Refreshing a list of Peer connections
 *   function refreshFrozenVideoStreamGroup (peerIdA, peerIdB) {
 *     skylinkDemo.refreshConnection([peerIdA, peerIdB], function (error, success) {
 *       if (error) {
 *         if (error.transferErrors[peerIdA]) {
 *           console.error("Failed refreshing connection for '" + peerIdA + "'");
 *         } else {
 *           console.log("Refreshing connection for '" + peerIdA + "'");
 *         }
 *         if (error.transferErrors[peerIdB]) {
 *           console.error("Failed refreshing connection for '" + peerIdB + "'");
 *         } else {
 *           console.log("Refreshing connection for '" + peerIdB + "'");
 *         }
 *       } else {
 *         console.log("Refreshing connection for '" + peerIdA + "' and '" + peerIdB + "'");
 *       }
 *     });
 *   }
 *
 *   // Example 3: Refreshing all Peer connections
 *   function refreshFrozenVideoStreamAll () {
 *     skylinkDemo.refreshConnection(function (error, success) {
 *       if (error) {
 *         for (var i = 0; i < error.listOfPeers.length; i++) {
 *           if (error.refreshErrors[error.listOfPeers[i]]) {
 *             console.error("Failed refreshing connection for '" + error.listOfPeers[i] + "'");
 *           } else {
 *             console.info("Refreshing connection for '" + error.listOfPeers[i] + "'");
 *           }
 *         }
 *       } else {
 *         console.log("Refreshing connection for all Peers", success.listOfPeers);
 *       }
 *     });
 *   }
 *
 *   // Example 4: Refresh Peer connection when ICE connection has failed or disconnected
 *   //            and do a ICE connection refresh (only for non-MCU case)
 *   skylinkDemo.on("iceConnectionState", function (state, peerId) {
 *      if (!usesMCUKey && [skylinkDemo.ICE_CONNECTION_STATE.FAILED,
 *        skylinkDemo.ICE_CONNECTION_STATE.DISCONNECTED].indexOf(state) > -1) {
 *        skylinkDemo.refreshConnection(peerId, true);
 *      }
 *   });
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.refreshConnection = function(targetPeerId, iceRestart, callback) {
  var self = this;

  var listOfPeers = Object.keys(self._peerConnections);
  var doIceRestart = false;

  if(Array.isArray(targetPeerId)) {
    listOfPeers = targetPeerId;
  } else if (typeof targetPeerId === 'string') {
    listOfPeers = [targetPeerId];
  } else if (typeof targetPeerId === 'boolean') {
    doIceRestart = targetPeerId;
  } else if (typeof targetPeerId === 'function') {
    callback = targetPeerId;
  }

  if (typeof iceRestart === 'boolean') {
    doIceRestart = iceRestart;
  } else if (typeof iceRestart === 'function') {
    callback = iceRestart;
  }

  var emitErrorForPeersFn = function (error) {
    log.error(error);

    if (typeof callback === 'function') {
      var listOfPeerErrors = {};

      if (listOfPeers.length === 0) {
        listOfPeerErrors.self = new Error(error);
      } else {
        for (var i = 0; i < listOfPeers.length; i++) {
          listOfPeerErrors[listOfPeers[i]] = new Error(error);
        }
      }

      callback({
        refreshErrors: listOfPeerRestartErrors,
        listOfPeers: listOfPeers
      }, null);
    }
  };

  if (listOfPeers.length === 0 && !(self._hasMCU && !self._mcuUseRenegoRestart)) {
    emitErrorForPeersFn('There is currently no peer connections to restart');
    return;
  }

  if (window.webrtcDetectedBrowser === 'edge') {
    emitErrorForPeersFn('Edge browser currently does not support renegotiation.');
    return;
  }

  self._throttle(function (runFn) {
    if (!runFn && self._hasMCU && !self._mcuUseRenegoRestart) {
      if (self._options.throttlingShouldThrowError) {
        emitErrorForPeersFn('Unable to run as throttle interval has not reached (' + self._options.throttleIntervals.refreshConnection + 'ms).');
      }
      return;
    }
    self._refreshPeerConnection(listOfPeers, doIceRestart, callback);
  }, 'refreshConnection', self._options.throttleIntervals.refreshConnection);

};

/**
 * Function that refresh connections.
 * @method _refreshPeerConnection
 * @private
 * @for Skylink
 * @since 0.6.15
 */
Skylink.prototype._refreshPeerConnection = function(listOfPeers, doIceRestart, callback) {
  var self = this;
  var listOfPeerRestarts = [];
  var error = '';
  var listOfPeerRestartErrors = {};

  // To fix jshint dont put functions within a loop
  var refreshSinglePeerCallback = function (peerId) {
    return function (error) {
      if (listOfPeerRestarts.indexOf(peerId) === -1) {
        if (error) {
          log.error([peerId, 'RTCPeerConnection', null, 'Failed restarting for peer'], error);
          listOfPeerRestartErrors[peerId] = error;
        }
        listOfPeerRestarts.push(peerId);
      }

      if (listOfPeerRestarts.length === listOfPeers.length) {
        if (typeof callback === 'function') {
          log.log([null, 'PeerConnection', null, 'Invoked all peers to restart. Firing callback']);

          if (Object.keys(listOfPeerRestartErrors).length > 0) {
            callback({
              refreshErrors: listOfPeerRestartErrors,
              listOfPeers: listOfPeers
            }, null);
          } else {
            callback(null, {
              listOfPeers: listOfPeers
            });
          }
        }
      }
    };
  };

  var refreshSinglePeer = function(peerId, peerCallback){
    if (!self._peerConnections[peerId]) {
      error = 'There is currently no existing peer connection made ' +
        'with the peer. Unable to restart connection';
      log.error([peerId, null, null, error]);
      peerCallback(error);
      return;
    }

    log.log([peerId, 'PeerConnection', null, 'Restarting peer connection']);

    // do a hard reset on variable object
    self._restartPeerConnection(peerId, doIceRestart, peerCallback);
  };

  if(!self._hasMCU) {
    var i;

    for (i = 0; i < listOfPeers.length; i++) {
      var peerId = listOfPeers[i];

      if (Object.keys(self._peerConnections).indexOf(peerId) > -1) {
        refreshSinglePeer(peerId, refreshSinglePeerCallback(peerId));
      } else {
        error = 'Peer connection with peer does not exists. Unable to restart';
        log.error([peerId, 'PeerConnection', null, error]);
        refreshSinglePeerCallback(peerId)(error);
      }
    }
  } else {
    self._restartMCUConnection(callback, doIceRestart);
  }
};

/**
 * <blockquote class="info">
 * Note that this is not well supported in the Edge browser.
 * </blockquote>
 * Function that retrieves Peer connection bandwidth and ICE connection stats.
 * @method getConnectionStatus
 * @param {String|Array} [targetPeerId] The target Peer ID to retrieve connection stats from.
 * - When provided as an Array, it will retrieve all connection stats from all the Peer IDs provided.
 * - When not provided, it will retrieve all connection stats from the currently connected Peers in the Room.
 * @param {Function} [callback] The callback function fired when request has completed.
 *   <small>Function parameters signature is <code>function (error, success)</code></small>
 *   <small>Function request completion is determined by the <a href="#event_getConnectionStatusStateChange">
 *   <code>getConnectionStatusStateChange</code> event</a> triggering <code>state</code> parameter payload
 *   value as <code>RETRIEVE_SUCCESS</code> for all Peers targeted for request success.</small>
 *   [Rel: Skylink.GET_CONNECTION_STATUS_STATE]
 * @param {JSON} callback.error The error result in request.
 *   <small>Defined as <code>null</code> when there are no errors in request</small>
 * @param {Array} callback.error.listOfPeers The list of Peer IDs targeted.
 * @param {JSON} callback.error.retrievalErrors The list of Peer connection stats retrieval errors.
 * @param {Error|String} callback.error.retrievalErrors.#peerId The Peer connection stats retrieval error associated
 *   with the Peer ID defined in <code>#peerId</code> property.
 *   <small>If <code>#peerId</code> value is <code>"self"</code>, it means that it is the error when there
 *   are no Peer connections to refresh with.</small>
 * @param {JSON} callback.error.connectionStats The list of Peer connection stats.
 *   <small>These are the Peer connection stats that has been managed to be successfully retrieved.</small>
 * @param {JSON} callback.error.connectionStats.#peerId The Peer connection stats associated with
 *   the Peer ID defined in <code>#peerId</code> property.
 *   <small>Object signature matches the <code>stats</code> parameter payload received in the
 *   <a href="#event_getConnectionStatusStateChange"><code>getConnectionStatusStateChange</code> event</a>.</small>
 * @param {JSON} callback.success The success result in request.
 *   <small>Defined as <code>null</code> when there are errors in request</small>
 * @param {Array} callback.success.listOfPeers The list of Peer IDs targeted.
 * @param {JSON} callback.success.connectionStats The list of Peer connection stats.
 * @param {JSON} callback.success.connectionStats.#peerId The Peer connection stats associated with
 *   the Peer ID defined in <code>#peerId</code> property.
 *   <small>Object signature matches the <code>stats</code> parameter payload received in the
 *   <a href="#event_getConnectionStatusStateChange"><code>getConnectionStatusStateChange</code> event</a>.</small>
 * @trigger <ol class="desc-seq">
 *   <li>Retrieves Peer connection stats for all targeted Peers. <ol>
 *   <li>If Peer connection has closed or does not exists: <small>This can be checked with
 *   <a href="#event_peerConnectionState"><code>peerConnectionState</code> event</a>
 *   triggering parameter payload <code>state</code> as <code>CLOSED</code> for Peer.</small> <ol>
 *   <li><a href="#event_getConnectionStatusStateChange"> <code>getConnectionStatusStateChange</code> event</a>
 *   triggers parameter payload <code>state</code> as <code>RETRIEVE_ERROR</code>.</li>
 *   <li><b>ABORT</b> and return error.</li></ol></li>
 *   <li><a href="#event_getConnectionStatusStateChange"><code>getConnectionStatusStateChange</code> event</a>
 *   triggers parameter payload <code>state</code> as <code>RETRIEVING</code>.</li>
 *   <li>Received response from retrieval. <ol>
 *   <li>If retrieval was successful: <ol>
 *   <li><a href="#event_getConnectionStatusStateChange"><code>getConnectionStatusStateChange</code> event</a>
 *   triggers parameter payload <code>state</code> as <code>RETRIEVE_SUCCESS</code>.</li></ol></li>
 *   <li>Else: <ol>
 *   <li><a href="#event_getConnectionStatusStateChange"> <code>getConnectionStatusStateChange</code> event</a>
 *   triggers parameter payload <code>state</code> as <code>RETRIEVE_ERROR</code>.</li>
 *   </ol></li></ol></li></ol></li></ol>
 * @example
 *   // Example 1: Retrieve a Peer connection stats
 *   function startBWStatsInterval (peerId) {
 *     setInterval(function () {
 *       skylinkDemo.getConnectionStatus(peerId, function (error, success) {
 *         if (error) return;
 *         var sendVideoBytes  = success.connectionStats[peerId].video.sending.bytes;
 *         var sendAudioBytes  = success.connectionStats[peerId].audio.sending.bytes;
 *         var recvVideoBytes  = success.connectionStats[peerId].video.receiving.bytes;
 *         var recvAudioBytes  = success.connectionStats[peerId].audio.receiving.bytes;
 *         var localCandidate  = success.connectionStats[peerId].selectedCandidate.local;
 *         var remoteCandidate = success.connectionStats[peerId].selectedCandidate.remote;
 *         console.log("Sending audio (" + sendAudioBytes + "bps) video (" + sendVideoBytes + ")");
 *         console.log("Receiving audio (" + recvAudioBytes + "bps) video (" + recvVideoBytes + ")");
 *         console.log("Local candidate: " + localCandidate.ipAddress + ":" + localCandidate.portNumber +
 *           "?transport=" + localCandidate.transport + " (type: " + localCandidate.candidateType + ")");
 *         console.log("Remote candidate: " + remoteCandidate.ipAddress + ":" + remoteCandidate.portNumber +
 *           "?transport=" + remoteCandidate.transport + " (type: " + remoteCandidate.candidateType + ")");
 *       });
 *     }, 1000);
 *   }
 *
 *   // Example 2: Retrieve a list of Peer connection stats
 *   function printConnStats (peerId, data) {
 *     if (!data.connectionStats[peerId]) return;
 *     var sendVideoBytes  = data.connectionStats[peerId].video.sending.bytes;
 *     var sendAudioBytes  = data.connectionStats[peerId].audio.sending.bytes;
 *     var recvVideoBytes  = data.connectionStats[peerId].video.receiving.bytes;
 *     var recvAudioBytes  = data.connectionStats[peerId].audio.receiving.bytes;
 *     var localCandidate  = data.connectionStats[peerId].selectedCandidate.local;
 *     var remoteCandidate = data.connectionStats[peerId].selectedCandidate.remote;
 *     console.log(peerId + " - Sending audio (" + sendAudioBytes + "bps) video (" + sendVideoBytes + ")");
 *     console.log(peerId + " - Receiving audio (" + recvAudioBytes + "bps) video (" + recvVideoBytes + ")");
 *     console.log(peerId + " - Local candidate: " + localCandidate.ipAddress + ":" + localCandidate.portNumber +
 *       "?transport=" + localCandidate.transport + " (type: " + localCandidate.candidateType + ")");
 *     console.log(peerId + " - Remote candidate: " + remoteCandidate.ipAddress + ":" + remoteCandidate.portNumber +
 *       "?transport=" + remoteCandidate.transport + " (type: " + remoteCandidate.candidateType + ")");
 *   }
 *
 *   function startBWStatsInterval (peerIdA, peerIdB) {
 *     setInterval(function () {
 *       skylinkDemo.getConnectionStatus([peerIdA, peerIdB], function (error, success) {
 *         if (error) {
 *           printConnStats(peerIdA, error.connectionStats);
 *           printConnStats(peerIdB, error.connectionStats);
 *         } else {
 *           printConnStats(peerIdA, success.connectionStats);
 *           printConnStats(peerIdB, success.connectionStats);
 *         }
 *       });
 *     }, 1000);
 *   }
 *
 *   // Example 3: Retrieve all Peer connection stats
 *   function printConnStats (listOfPeers, data) {
 *     listOfPeers.forEach(function (peerId) {
 *       if (!data.connectionStats[peerId]) return;
 *       var sendVideoBytes  = data.connectionStats[peerId].video.sending.bytes;
 *       var sendAudioBytes  = data.connectionStats[peerId].audio.sending.bytes;
 *       var recvVideoBytes  = data.connectionStats[peerId].video.receiving.bytes;
 *       var recvAudioBytes  = data.connectionStats[peerId].audio.receiving.bytes;
 *       var localCandidate  = data.connectionStats[peerId].selectedCandidate.local;
 *       var remoteCandidate = data.connectionStats[peerId].selectedCandidate.remote;
 *       console.log(peerId + " - Sending audio (" + sendAudioBytes + "bps) video (" + sendVideoBytes + ")");
 *       console.log(peerId + " - Receiving audio (" + recvAudioBytes + "bps) video (" + recvVideoBytes + ")");
 *       console.log(peerId + " - Local candidate: " + localCandidate.ipAddress + ":" + localCandidate.portNumber +
 *         "?transport=" + localCandidate.transport + " (type: " + localCandidate.candidateType + ")");
 *       console.log(peerId + " - Remote candidate: " + remoteCandidate.ipAddress + ":" + remoteCandidate.portNumber +
 *         "?transport=" + remoteCandidate.transport + " (type: " + remoteCandidate.candidateType + ")");
 *     });
 *   }
 *
 *   function startBWStatsInterval (peerIdA, peerIdB) {
 *     setInterval(function () {
 *       skylinkDemo.getConnectionStatus(function (error, success) {
 *         if (error) {
 *           printConnStats(error.listOfPeers, error.connectionStats);
 *         } else {
 *           printConnStats(success.listOfPeers, success.connectionStats);
 *         }
 *       });
 *     }, 1000);
 *   }
 * @for Skylink
 * @since 0.6.14
 */
Skylink.prototype.getConnectionStatus = function (targetPeerId, callback) {
  var self = this;
  var listOfPeers = Object.keys(self._peerConnections);
  var listOfPeerStats = {};
  var listOfPeerErrors = {};

  // getConnectionStatus([])
  if (Array.isArray(targetPeerId)) {
    listOfPeers = targetPeerId;

  // getConnectionStatus('...')
  } else if (typeof targetPeerId === 'string' && !!targetPeerId) {
    listOfPeers = [targetPeerId];

  // getConnectionStatus(function () {})
  } else if (typeof targetPeerId === 'function') {
    callback = targetPeerId;
    targetPeerId = undefined;
  }

  // Check if Peers list is empty, in which we throw an Error if there isn't any
  if (listOfPeers.length === 0) {
    listOfPeerErrors.self = new Error('There is currently no peer connections to retrieve connection status');

    log.error([null, 'RTCStatsReport', null, 'Retrieving request failure ->'], listOfPeerErrors.self);

    if (typeof callback === 'function') {
      callback({
        listOfPeers: listOfPeers,
        retrievalErrors: listOfPeerErrors,
        connectionStats: listOfPeerStats
      }, null);
    }
    return;
  }

  if (window.webrtcDetectedBrowser === 'edge') {
    log.warn('Edge browser does not have well support for stats.');
  }

  var completedTaskCounter = [];

  var checkCompletedFn = function (peerId) {
    if (completedTaskCounter.indexOf(peerId) === -1) {
      completedTaskCounter.push(peerId);
    }

    if (completedTaskCounter.length === listOfPeers.length) {
      if (typeof callback === 'function') {
        if (Object.keys(listOfPeerErrors).length > 0) {
          callback({
            listOfPeers: listOfPeers,
            retrievalErrors: listOfPeerErrors,
            connectionStats: listOfPeerStats
          }, null);

        } else {
          callback(null, {
            listOfPeers: listOfPeers,
            connectionStats: listOfPeerStats
          });
        }
      }
    }
  };

  var statsFn = function (peerId) {
    var retrieveFn = function (firstRetrieval, nextCb) {
      return function (err, result) {
        if (err) {
          log.error([peerId, 'RTCStatsReport', null, 'Retrieval failure ->'], error);
          listOfPeerErrors[peerId] = error;
          self._trigger('getConnectionStatusStateChange', self.GET_CONNECTION_STATUS_STATE.RETRIEVE_ERROR,
            peerId, null, error);
          checkCompletedFn(peerId);
          if (firstRetrieval) {
            delete self._peerStats[peerId];
          }
          return;
        }

        if (firstRetrieval) {
          nextCb();
        } else {
          listOfPeerStats[peerId] = result;
          self._trigger('getConnectionStatusStateChange', self.GET_CONNECTION_STATUS_STATE.RETRIEVE_SUCCESS,
            peerId, listOfPeerStats[peerId], null);
          checkCompletedFn(peerId);
        }
      };
    };

    if (!self._peerStats[peerId]) {
      self._peerStats[peerId] = {};

      log.debug([peerId, 'RTCStatsReport', null, 'Retrieving first report to tabulate results']);

      self._retrieveStats(peerId, retrieveFn(true, function () {
        self._retrieveStats(peerId, retrieveFn());
      }));
      return;
    }

    self._retrieveStats(peerId, retrieveFn());
  };

  // Loop through all the list of Peers selected to retrieve connection status
  for (var i = 0; i < listOfPeers.length; i++) {
    var peerId = listOfPeers[i];

    self._trigger('getConnectionStatusStateChange', self.GET_CONNECTION_STATUS_STATE.RETRIEVING,
      peerId, null, null);

    // Check if the Peer connection exists first
    if (self._peerConnections.hasOwnProperty(peerId) && self._peerConnections[peerId]) {
      statsFn(peerId);

    } else {
      listOfPeerErrors[peerId] = new Error('The peer connection object does not exists');

      log.error([peerId, 'RTCStatsReport', null, 'Retrieval failure ->'], listOfPeerErrors[peerId]);

      self._trigger('getConnectionStatusStateChange', self.GET_CONNECTION_STATUS_STATE.RETRIEVE_ERROR,
        peerId, null, listOfPeerErrors[peerId]);

      checkCompletedFn(peerId);
    }
  }
};

/**
 * Function that retrieves Peer connection stats.
 * @method _retrieveStats
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._retrieveStats = function (peerId, callback) {
  var self = this;

  log.debug([peerId, 'RTCStatsReport', null, 'Retrieivng connection status']);

  var pc = self._peerConnections[peerId];
  var result = {
    raw: null,
    connection: {
      iceConnectionState: pc.iceConnectionState,
      iceGatheringState: pc.iceGatheringState,
      signalingState: pc.signalingState,
      remoteDescription: {
        type: pc.remoteDescription ? pc.remoteDescription.type || null : null,
        sdp : pc.remoteDescription ? pc.remoteDescription.sdp || null : null
      },
      localDescription: {
        type: pc.localDescription ? pc.localDescription.type || null : null,
        sdp : pc.localDescription ? pc.localDescription.sdp || null : null
      },
      candidates: clone(self._gatheredCandidates[peerId] || {
        sending: { host: [], srflx: [], relay: [] },
        receiving: { host: [], srflx: [], relay: [] }
      }),
      dataChannels: {}
    },
    audio: {
      sending: {
        ssrc: null,
        bytes: 0,
        packets: 0,
        // Should not be for sending?
        packetsLost: 0,
        rtt: 0,
        // Should not be for sending?
        jitter: 0,
        // Should not be for sending?
        jitterBufferMs: null,
        codec: self._getSDPSelectedCodec(peerId, pc.remoteDescription, 'audio'),
        nacks: null,
        inputLevel: null,
        echoReturnLoss: null,
        echoReturnLossEnhancement: null,
        totalBytes: 0,
        totalPackets: 0,
        totalPacketsLost: 0,
        totalNacks: null
      },
      receiving: {
        ssrc: null,
        bytes: 0,
        packets: 0,
        packetsLost: 0,
        packetsDiscarded: 0,
        fractionLost: 0,
        nacks: null,
        jitter: 0,
        jitterBufferMs: null,
        codec: self._getSDPSelectedCodec(peerId, pc.remoteDescription, 'audio'),
        outputLevel: null,
        totalBytes: 0,
        totalPackets: 0,
        totalPacketsLost: 0,
        totalNacks: null
      }
    },
    video: {
      sending: {
        ssrc: null,
        bytes: 0,
        packets: 0,
        // Should not be for sending?
        packetsLost: 0,
        rtt: 0,
        // Should not be for sending?
        jitter: 0,
        // Should not be for sending?
        jitterBufferMs: null,
        codec: self._getSDPSelectedCodec(peerId, pc.remoteDescription, 'video'),
        frameWidth: null,
        frameHeight: null,
        framesDecoded: null,
        framesCorrupted: null,
        framesDropped: null,
        framesPerSecond: null,
        framesInput: null,
        frames: null,
        frameRateEncoded: null,
        frameRate: null,
        frameRateInput: null,
        frameRateMean: null,
        frameRateStdDev: null,
        nacks: null,
        plis: null,
        firs: null,
        slis: null,
        qpSum: null,
        totalBytes: 0,
        totalPackets: 0,
        totalPacketsLost: 0,
        totalNacks: null,
        totalPlis: null,
        totalFirs: null,
        totalSlis: null,
        totalFrames: null
      },
      receiving: {
        ssrc: null,
        bytes: 0,
        packets: 0,
        packetsDiscarded: 0,
        packetsLost: 0,
        fractionLost: 0,
        jitter: 0,
        jitterBufferMs: null,
        codec: self._getSDPSelectedCodec(peerId, pc.remoteDescription, 'video'),
        frameWidth: null,
        frameHeight: null,
        framesDecoded: null,
        framesCorrupted: null,
        framesPerSecond: null,
        framesDropped: null,
        framesOutput: null,
        frames: null,
        frameRateMean: null,
        frameRateStdDev: null,
        nacks: null,
        plis: null,
        firs: null,
        slis: null,
        e2eDelay: null,
        totalBytes: 0,
        totalPackets: 0,
        totalPacketsLost: 0,
        totalNacks: null,
        totalPlis: null,
        totalFirs: null,
        totalSlis: null,
        totalFrames: null
      }
    },
    selectedCandidate: {
      local: {
        ipAddress: null,
        candidateType: null,
        portNumber: null,
        transport: null, 
        turnMediaTransport: null
      },
      remote: {
        ipAddress: null,
        candidateType: null,
        portNumber: null,
        transport: null
      },
      consentResponses: {
        received: null,
        sent: null,
        totalReceived: null,
        totalSent: null
      },
      consentRequests: {
        received: null,
        sent: null,
        totalReceived: null,
        totalSent: null
      },
      responses: {
        received: null,
        sent: null,
        totalReceived: null,
        totalSent: null
      },
      requests: {
        received: null,
        sent: null,
        totalReceived: null,
        totalSent: null
      }
    },
    certificate: {
      local: self._getSDPFingerprint(peerId, pc.localDescription),
      remote: self._getSDPFingerprint(peerId, pc.remoteDescription),
      dtlsCipher: null,
      srtpCipher: null
    }
  };

  for (var channelProp in self._dataChannels[peerId]) {
    if (self._dataChannels[peerId].hasOwnProperty(channelProp) && self._dataChannels[peerId][channelProp]) {
      result.connection.dataChannels[self._dataChannels[peerId][channelProp].channel.label] = {
        label: self._dataChannels[peerId][channelProp].channel.label,
        readyState: self._dataChannels[peerId][channelProp].channel.readyState,
        channelType: channelProp === 'main' ? self.DATA_CHANNEL_TYPE.MESSAGING : self.DATA_CHANNEL_TYPE.DATA,
        currentTransferId: self._dataChannels[peerId][channelProp].transferId || null
      };
    }
  }

  var loopFn = function (obj, fn) {
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop) && obj[prop]) {
        fn(obj[prop], prop);
      }
    }
  };

  var formatCandidateFn = function (candidateDirType, candidate) {
    result.selectedCandidate[candidateDirType].ipAddress = candidate.ipAddress;
    result.selectedCandidate[candidateDirType].candidateType = candidate.candidateType;
    result.selectedCandidate[candidateDirType].portNumber = typeof candidate.portNumber !== 'number' ?
      parseInt(candidate.portNumber, 10) || null : candidate.portNumber;
    result.selectedCandidate[candidateDirType].transport = candidate.transport;
  };

  pc.getStats(null, function (stats) {
    log.debug([peerId, 'RTCStatsReport', null, 'Retrieval success ->'], stats);

    result.raw = stats;

    if (window.webrtcDetectedBrowser === 'firefox') {
      loopFn(stats, function (obj, prop) {
        var dirType = '';

        // Receiving/Sending RTP packets
        if (prop.indexOf('inbound_rtp') === 0 || prop.indexOf('outbound_rtp') === 0) {
          dirType = prop.indexOf('inbound_rtp') === 0 ? 'receiving' : 'sending';

          if (!self._peerStats[peerId][prop]) {
            self._peerStats[peerId][prop] = obj;
          }

          result[obj.mediaType][dirType].bytes = self._parseConnectionStats(self._peerStats[peerId][prop],
            obj, dirType === 'receiving' ? 'bytesReceived' : 'bytesSent');
          result[obj.mediaType][dirType].totalBytes = parseInt(
            (dirType === 'receiving' ? obj.bytesReceived : obj.bytesSent) || '0', 10);
          result[obj.mediaType][dirType].packets = self._parseConnectionStats(self._peerStats[peerId][prop],
            obj, dirType === 'receiving' ? 'packetsReceived' : 'packetsSent');
          result[obj.mediaType][dirType].totalPackets = parseInt(
            (dirType === 'receiving' ? obj.packetsReceived : obj.packetsSent) || '0', 10);
          result[obj.mediaType][dirType].ssrc = obj.ssrc;
          
          if (obj.mediaType === 'video') {
            result.video[dirType].frameRateMean = obj.framerateMean || 0;
            result.video[dirType].frameRateStdDev = obj.framerateStdDev || 0;
            result.video[dirType].framesDropped = typeof obj.framesDropped === 'number' ? obj.framesDropped :
              (typeof obj.droppedFrames === 'number' ? obj.droppedFrames : null);
            result.video[dirType].framesCorrupted = typeof obj.framesCorrupted === 'number' ? obj.framesCorrupted : null;
            result.video[dirType].framesPerSecond = typeof obj.framesPerSecond === 'number' ? obj.framesPerSecond : null;

            if (dirType === 'sending') {
              result.video[dirType].framesEncoded = typeof obj.framesEncoded === 'number' ? obj.framesEncoded : null;
              result.video[dirType].frames = typeof obj.framesSent === 'number' ? obj.framesSent : null;
            } else {
              result.video[dirType].framesDecoded = typeof obj.framesDecoded === 'number' ? obj.framesDecoded : null;
              result.video[dirType].frames = typeof obj.framesReceived === 'number' ? obj.framesReceived : null;
            }
          }

          if (dirType === 'receiving') {
            obj.packetsDiscarded = (typeof obj.packetsDiscarded === 'number' ? obj.packetsDiscarded :
              obj.discardedPackets) || 0;
            obj.packetsLost = typeof obj.packetsLost === 'number' ? obj.packetsLost : 0;

            result[obj.mediaType].receiving.packetsLost = self._parseConnectionStats(self._peerStats[peerId][prop],
              obj, 'packetsLost');
            result[obj.mediaType].receiving.packetsDiscarded = self._parseConnectionStats(self._peerStats[peerId][prop],
              obj, 'packetsDiscarded');
            result[obj.mediaType].receiving.totalPacketsDiscarded = obj.packetsDiscarded;
            result[obj.mediaType].receiving.totalPacketsLost = obj.packetsLost;
          }

          self._peerStats[peerId][prop] = obj;

        // Sending RTP packets lost
        } else if (prop.indexOf('inbound_rtcp') === 0 || prop.indexOf('outbound_rtcp') === 0) {
          dirType = prop.indexOf('inbound_rtp') === 0 ? 'receiving' : 'sending';

          if (!self._peerStats[peerId][prop]) {
            self._peerStats[peerId][prop] = obj;
          }

          if (dirType === 'sending') {
            result[obj.mediaType].sending.rtt = obj.mozRtt || 0;
            result[obj.mediaType].sending.targetBitrate = typeof obj.targetBitrate === 'number' ? obj.targetBitrate : 0;
          } else {
            result[obj.mediaType].receiving.jitter = obj.jitter || 0;
          }

          self._peerStats[peerId][prop] = obj;

        // Candidates
        } else if (obj.nominated && obj.selected) {
          formatCandidateFn('remote', stats[obj.remoteCandidateId]);
          formatCandidateFn('local', stats[obj.localCandidateId]);
        }
      });

    } else if (window.webrtcDetectedBrowser === 'edge') {
      var tracks = [];

      if (pc.getRemoteStreams().length > 0) {
        tracks = tracks.concat(pc.getRemoteStreams()[0].getTracks());
      }

      if (pc.getLocalStreams().length > 0) {
        tracks = tracks.concat(pc.getLocalStreams()[0].getTracks());
      }

      loopFn(tracks, function (track) {
        loopFn(stats, function (obj, prop) {
          if (obj.type === 'track' && obj.trackIdentifier === track.id) {
            var dirType = obj.remoteSource ? 'receiving' : 'sending';
            var mediaType = track.kind;

            if (mediaType === 'audio') {
              result[mediaType][dirType][dirType === 'sending' ? 'inputLevel' : 'outputLevel'] = obj.audioLevel;
              if (dirType === 'sending') {
                result[mediaType][dirType].echoReturnLoss = obj.echoReturnLoss;
                result[mediaType][dirType].echoReturnLossEnhancement = obj.echoReturnLossEnhancement;
              }
            } else {
              result[mediaType][dirType].frames = self._parseConnectionStats(self._peerStats[peerId][subprop],
                streamObj,dirType === 'sending' ? obj.framesSent : obj.framesReceived);
              result[mediaType][dirType].framesDropped = obj.framesDropped;
              result[mediaType][dirType].framesDecoded = obj.framesDecoded;
              result[mediaType][dirType].framesCorrupted = obj.framesCorrupted;
              result[mediaType][dirType].framesPerSecond = obj.framesPerSecond;
              result[mediaType][dirType].frameHeight = obj.frameHeight || null;
              result[mediaType][dirType].frameWidth = obj.frameWidth || null;
              result[mediaType][dirType].totalFrames = dirType === 'sending' ? obj.framesSent : obj.framesReceived;
            }

            loopFn(stats, function (streamObj, subprop) {
              if (streamObj.mediaTrackId === obj.id && ['outboundrtp', 'inboundrtp'].indexOf(streamObj.type) > -1) {
                if (!self._peerStats[peerId][subprop]) {
                  self._peerStats[peerId][subprop] = streamObj;
                }

                result[mediaType][dirType].ssrc = parseInt(streamObj.ssrc || '0', 10);
                result[mediaType][dirType].nacks = self._parseConnectionStats(self._peerStats[peerId][subprop],
                  streamObj, 'nackCount');
                result[mediaType][dirType].totalNacks = streamObj.nackCount;

                if (mediaType === 'video') {
                  result[mediaType][dirType].firs = self._parseConnectionStats(self._peerStats[peerId][subprop],
                    streamObj, 'firCount');
                  result[mediaType][dirType].plis = self._parseConnectionStats(self._peerStats[peerId][subprop],
                    streamObj, 'pliCount');
                  result[mediaType][dirType].slis = self._parseConnectionStats(self._peerStats[peerId][subprop],
                    streamObj, 'sliCount');
                  result[mediaType][dirType].totalFirs = streamObj.firCount;
                  result[mediaType][dirType].totalPlis = streamObj.plisCount;
                  result[mediaType][dirType].totalSlis = streamObj.sliCount;
                }

                result[mediaType][dirType].bytes = self._parseConnectionStats(self._peerStats[peerId][subprop],
                  streamObj, dirType === 'receiving' ? 'bytesReceived' : 'bytesSent');
                result[mediaType][dirType].packets = self._parseConnectionStats(self._peerStats[peerId][subprop],
                  streamObj, dirType === 'receiving' ? 'packetsReceived' : 'packetsSent');

                result[mediaType][dirType].totalBytes = dirType === 'receiving' ? streamObj.bytesReceived : streamObj.bytesSent;
                result[mediaType][dirType].totalPackets = dirType === 'receiving' ? streamObj.packetsReceived : streamObj.packetsSent;

                if (dirType === 'receiving') {
                  result[mediaType][dirType].jitter = streamObj.jitter || 0;
                  result[mediaType].receiving.fractionLost = streamObj.fractionLost;
                  result[mediaType][dirType].packetsLost = self._parseConnectionStats(self._peerStats[peerId][subprop],
                    streamObj, 'packetsLost');
                  result[mediaType][dirType].packetsDiscarded = self._parseConnectionStats(self._peerStats[peerId][subprop],
                    streamObj, 'packetsDiscarded');
                  result[mediaType][dirType].totalPacketsLost = streamObj.packetsLost;
                  result[mediaType][dirType].totalPacketsDiscarded = streamObj.packetsDiscarded || 0;
                } else {
                  result[mediaType].sending.rtt = streamObj.roundTripTime || 0;
                  result[mediaType].sending.targetBitrate = streamObj.targetBitrate || 0;
                }

                if (result[mediaType][dirType].codec && streamObj.codecId) {
                  result[mediaType][dirType].codec.name = streamObj.codecId;
                }
              }
            });
          }
        });
      });

    } else {
      var reportedCandidate = false;
      var reportedCertificate = false;

      loopFn(stats, function (obj, prop) {
        if (prop.indexOf('ssrc_') === 0) {
          var dirType = prop.indexOf('_recv') > 0 ? 'receiving' : 'sending';

          // Polyfill fix for plugin. Plugin should fix this though
          if (!obj.mediaType) {
            obj.mediaType = obj.hasOwnProperty('audioOutputLevel') || obj.hasOwnProperty('audioInputLevel') ||
              obj.hasOwnProperty('googEchoCancellationReturnLoss') || obj.hasOwnProperty('googEchoCancellation') ?
              'audio' : 'video';
          }

          if (!self._peerStats[peerId][prop]) {
            self._peerStats[peerId][prop] = obj;
          }

          // Capture e2e delay
          try {
            if (obj.mediaType === 'video' && dirType === 'receiving') {
              var captureStartNtpTimeMs = parseInt(obj.googCaptureStartNtpTimeMs || '0', 10);

              if (captureStartNtpTimeMs > 0 && pc.getRemoteStreams().length > 0 && document &&
                typeof document.getElementsByTagName === 'function') {
                var streamId = pc.getRemoteStreams()[0].id || pc.getRemoteStreams()[0].label;
                var elements = [];

                if (self._isUsingPlugin) {
                  elements = document.getElementsByTagName('object');
                } else {
                  elements = document.getElementsByTagName('video');

                  if (elements.length === 0) {
                    elements = document.getElementsByTagName('audio');
                  }
                }

                for (var e = 0; e < elements.length; e++) {
                  var videoElmStreamId = null;

                  if (self._isUsingPlugin) {
                    if (!(elements[e].children && typeof elements[e].children === 'object' &&
                      typeof elements[e].children.length === 'number' && elements[e].children.length > 0)) {
                      break;
                    }

                    for (var ec = 0; ec < elements[e].children.length; ec++) {
                      if (elements[e].children[ec].name === 'streamId') {
                        videoElmStreamId = elements[e].children[ec].value || null;
                        break;
                      }
                    }

                  } else {
                    videoElmStreamId = elements[e].srcObject ? elements[e].srcObject.id ||
                      elements[e].srcObject.label : null;
                  }

                  if (videoElmStreamId && videoElmStreamId === streamId) {
                    result[obj.mediaType][dirType].e2eDelay = ((new Date()).getTime() + 2208988800000) -
                      captureStartNtpTimeMs - elements[e].currentTime * 1000;
                    break;
                  }
                }
              }
            }
          } catch (error) {
            log.warn([peerId, 'RTCStatsReport', null, 'Failed retrieving e2e delay ->'], error);
          }

          // Receiving/Sending RTP packets
          result[obj.mediaType][dirType].ssrc = parseInt(obj.ssrc || '0', 10);
          result[obj.mediaType][dirType].bytes = self._parseConnectionStats(self._peerStats[peerId][prop],
            obj, dirType === 'receiving' ? 'bytesReceived' : 'bytesSent');
          result[obj.mediaType][dirType].packets = self._parseConnectionStats(self._peerStats[peerId][prop],
            obj, dirType === 'receiving' ? 'packetsReceived' : 'packetsSent');
          result[obj.mediaType][dirType].nacks = self._parseConnectionStats(self._peerStats[peerId][prop],
            obj, dirType === 'receiving' ? 'googNacksReceived' : 'googNacksSent');
          result[obj.mediaType][dirType].totalPackets = parseInt((dirType === 'receiving' ? obj.packetsReceived :
            obj.packetsSent) || '0', 10);
          result[obj.mediaType][dirType].totalBytes = parseInt((dirType === 'receiving' ? obj.bytesReceived :
            obj.bytesSent) || '0', 10);
          result[obj.mediaType][dirType].totalNacks = parseInt((dirType === 'receiving' ? obj.googNacksReceived :
            obj.googNacksSent) || '0', 10);

          if (result[obj.mediaType][dirType].codec) {
            if (obj.googCodecName && obj.googCodecName !== 'unknown') {
              result[obj.mediaType][dirType].codec.name = obj.googCodecName;
            }
            if (obj.codecImplementationName && obj.codecImplementationName !== 'unknown') {
              result[obj.mediaType][dirType].codec.implementation = obj.codecImplementationName;
            }
          }

          if (dirType === 'sending') {
            // NOTE: Chrome sending audio does have it but plugin has..
            result[obj.mediaType].sending.rtt = parseFloat(obj.googRtt || '0', 10);
            result[obj.mediaType].sending.targetBitrate = obj.targetBitrate ? parseInt(obj.targetBitrate, 10) : null;
          } else {
            result[obj.mediaType].receiving.packetsLost = self._parseConnectionStats(self._peerStats[peerId][prop],
              obj, 'packetsLost');
            result[obj.mediaType].receiving.packetsDiscarded = self._parseConnectionStats(self._peerStats[peerId][prop],
              obj, 'packetsDiscarded');
            result[obj.mediaType].receiving.jitter = parseFloat(obj.googJitterReceived || '0', 10);
            result[obj.mediaType].receiving.jitterBufferMs = obj.googJitterBufferMs ? parseFloat(obj.googJitterBufferMs || '0', 10) : null;
            result[obj.mediaType].receiving.totalPacketsLost = parseInt(obj.packetsLost || '0', 10);
            result[obj.mediaType].receiving.totalPacketsDiscarded = parseInt(obj.packetsDiscarded || '0', 10);
          }

          if (obj.mediaType === 'video') {
            result.video[dirType].framesCorrupted = obj.framesCorrupted ? parseInt(obj.framesCorrupted, 10) : null;
            result.video[dirType].framesPerSecond = obj.framesPerSecond ? parseFloat(obj.framesPerSecond, 10) : null;
            result.video[dirType].framesDropped = obj.framesDropped ? parseInt(obj.framesDropped, 10) : null;
            
            if (dirType === 'sending') {
              result.video[dirType].frameWidth = obj.googFrameWidthSent ?
                parseInt(obj.googFrameWidthSent, 10) : null;
              result.video[dirType].frameHeight = obj.googFrameHeightSent ?
                parseInt(obj.googFrameHeightSent, 10) : null;
              result.video[dirType].plis = obj.googPlisSent ?
                self._parseConnectionStats(self._peerStats[peerId][prop], obj, 'googPlisSent') : null;
              result.video[dirType].firs = obj.googFirsSent ?
                self._parseConnectionStats(self._peerStats[peerId][prop], obj, 'googFirsSent') : null;
              result[obj.mediaType][dirType].totalPlis = obj.googPlisSent ? parseInt(obj.googPlisSent, 10) : null;
              result[obj.mediaType][dirType].totalFirs = obj.googFirsSent ? parseInt(obj.googFirsSent, 10) : null;
              result.video[dirType].framesEncoded = obj.framesEncoded ? parseInt(obj.framesEncoded, 10) : null;
              result.video[dirType].frameRateEncoded = obj.googFrameRateEncoded ?
                parseInt(obj.googFrameRateEncoded, 10) : null;
              result.video[dirType].frameRateInput = obj.googFrameRateInput ?
                parseInt(obj.googFrameRateInput, 10) : null;
              result.video[dirType].frameRate = obj.googFrameRateSent ?
                parseInt(obj.googFrameRateSent, 10) : null;
              result.video[dirType].qpSum = obj.qpSum ? parseInt(obj.qpSum, 10) : null;
              result.video[dirType].frames = obj.framesSent ?
                self._parseConnectionStats(self._peerStats[peerId][prop], obj, 'framesSent') : null;
              result.video[dirType].totalFrames = obj.framesSent ? parseInt(obj.framesSent, 10) : null;
            } else {
              result.video[dirType].frameWidth = obj.googFrameWidthReceived ?
                parseInt(obj.googFrameWidthReceived, 10) : null;
              result.video[dirType].frameHeight = obj.googFrameHeightReceived ?
                parseInt(obj.googFrameHeightReceived, 10) : null;
              result.video[dirType].plis = obj.googPlisReceived ?
                self._parseConnectionStats(self._peerStats[peerId][prop], obj, 'googPlisReceived') : null;
              result.video[dirType].firs = obj.googFirsReceived ?
                self._parseConnectionStats(self._peerStats[peerId][prop], obj, 'googFirsReceived') : null;
              result[obj.mediaType][dirType].totalPlis = obj.googPlisReceived ? parseInt(obj.googPlisReceived, 10) : null;
              result[obj.mediaType][dirType].totalFirs = obj.googFirsReceived ? parseInt(obj.googFirsReceived, 10) : null;
              result.video[dirType].framesDecoded = obj.framesDecoded ? parseInt(obj.framesDecoded, 10) : null;
              result.video[dirType].frameRateDecoded = obj.googFrameRateDecoded ?
                parseInt(obj.googFrameRateDecoded, 10) : null;
              result.video[dirType].frameRateOutput = obj.googFrameRateOutput ?
                parseInt(obj.googFrameRateOutput, 10) : null;
              result.video[dirType].frameRate = obj.googFrameRateReceived ?
                parseInt(obj.googFrameRateReceived, 10) : null;
              result.video[dirType].frames = obj.framesReceived ?
                self._parseConnectionStats(self._peerStats[peerId][prop], obj, 'framesReceived') : null;
              result.video[dirType].totalFrames = obj.framesReceived ? parseInt(obj.framesReceived, 10) : null;
            }
          } else {
            if (dirType === 'receiving') {
              result.audio[dirType].outputLevel = parseFloat(obj.audioOutputLevel || '0', 10);
            } else {
              result.audio[dirType].inputLevel = parseFloat(obj.audioInputLevel || '0', 10);
              result.audio[dirType].echoReturnLoss = parseFloat(obj.googEchoCancellationReturnLoss || '0', 10);
              result.audio[dirType].echoReturnLossEnhancement = parseFloat(obj.googEchoCancellationReturnLossEnhancement || '0', 10);
            }
          }

          self._peerStats[peerId][prop] = obj;

          if (!reportedCandidate) {
            loopFn(stats, function (canObj, canProp) {
              if (!reportedCandidate && canProp.indexOf('Conn-') === 0) {
                if (obj.transportId === canObj.googChannelId) {
                  if (!self._peerStats[peerId][canProp]) {
                    self._peerStats[peerId][canProp] = canObj;
                  }
                  formatCandidateFn('local', stats[canObj.localCandidateId]);
                  formatCandidateFn('remote', stats[canObj.remoteCandidateId]);
                  result.selectedCandidate.writable = canObj.googWritable ? canObj.googWritable === 'true' : null;
                  result.selectedCandidate.readable = canObj.googReadable ? canObj.googReadable === 'true' : null;
                  result.selectedCandidate.rtt = canObj.googRtt ?
                    self._parseConnectionStats(self._peerStats[peerId][canProp], canObj, 'googRtt') : null;
                  result.selectedCandidate.totalRtt = canObj.googRtt ? parseInt(canObj.googRtt, 10) : null;
                  result.selectedCandidate.requests = {
                    received: canObj.requestsReceived ?
                      self._parseConnectionStats(self._peerStats[peerId][canProp], canObj, 'requestsReceived') : null,
                    sent: canObj.requestsSent ?
                      self._parseConnectionStats(self._peerStats[peerId][canProp], canObj, 'requestsSent') : null,
                    totalReceived: canObj.requestsReceived ? parseInt(canObj.requestsReceived, 10) : null,
                    totalSent: canObj.requestsSent ? parseInt(canObj.requestsSent, 10) : null
                  };
                  result.selectedCandidate.responses = {
                    received: canObj.responsesReceived ?
                      self._parseConnectionStats(self._peerStats[peerId][canProp], canObj, 'responsesReceived') : null,
                    sent: canObj.responsesSent ?
                      self._parseConnectionStats(self._peerStats[peerId][canProp], canObj, 'responsesSent') : null,
                    totalReceived: canObj.responsesReceived ? parseInt(canObj.responsesReceived, 10) : null,
                    totalSent: canObj.responsesSent ? parseInt(canObj.responsesSent, 10) : null
                  };
                  result.selectedCandidate.consentRequests = {
                    received: canObj.consentRequestsReceived ?
                      self._parseConnectionStats(self._peerStats[peerId][canProp], canObj, 'consentRequestsReceived') : null,
                    sent: canObj.consentRequestsSent ?
                      self._parseConnectionStats(self._peerStats[peerId][canProp], canObj, 'consentRequestsSent') : null,
                    totalReceived: canObj.consentRequestsReceived ? parseInt(canObj.consentRequestsReceived, 10) : null,
                    totalSent: canObj.consentRequestsSent ? parseInt(canObj.consentRequestsSent, 10) : null
                  };
                  result.selectedCandidate.consentResponses = {
                    received: canObj.consentResponsesReceived ?
                      self._parseConnectionStats(self._peerStats[peerId][canProp], canObj, 'consentResponsesReceived') : null,
                    sent: canObj.consentResponsesSent ?
                      self._parseConnectionStats(self._peerStats[peerId][canProp], canObj, 'consentResponsesSent') : null,
                    totalReceived: canObj.consentResponsesReceived ? parseInt(canObj.consentResponsesReceived, 10) : null,
                    totalSent: canObj.consentResponsesSent ? parseInt(canObj.consentResponsesSent, 10) : null
                  };
  
                  self._peerStats[peerId][canProp] = canObj;
                  reportedCandidate = true;
                }
              }
            });
          }

          if (!reportedCertificate && stats[obj.transportId]) {
            result.certificate.srtpCipher = stats[obj.transportId].srtpCipher || null;
            result.certificate.dtlsCipher = stats[obj.transportId].dtlsCipher || null;

            var localCertId = stats[obj.transportId].localCertificateId;
            var remoteCertId = stats[obj.transportId].remoteCertificateId;

            if (localCertId && stats[localCertId]) {
              result.certificate.local.derBase64 = stats[localCertId].googDerBase64 || null;
              if (stats[localCertId].googFingerprint) {
                result.certificate.local.fingerprint = stats[localCertId].googFingerprint;
              }
              if (stats[localCertId].googFingerprintAlgorithm) {
                result.certificate.local.fingerprintAlgorithm = stats[localCertId].googFingerprintAlgorithm;
              }
            }

            if (remoteCertId && stats[remoteCertId]) {
              result.certificate.remote.derBase64 = stats[remoteCertId].googDerBase64 || null;
              if (stats[remoteCertId].googFingerprint) {
                result.certificate.remote.fingerprint = stats[remoteCertId].googFingerprint;
              }
              if (stats[remoteCertId].googFingerprintAlgorithm) {
                result.certificate.remote.fingerprintAlgorithm = stats[remoteCertId].googFingerprintAlgorithm;
              }
            }
            reportedCertificate = true;
          }
        }
      });
    }

    if ((result.selectedCandidate.local.candidateType || '').indexOf('relay') === 0) {
      result.selectedCandidate.local.turnMediaTransport = 'UDP';
      if (self._forceTURNSSL && window.webrtcDetectedBrowser !== 'firefox') {
        result.selectedCandidate.local.turnMediaTransport = 'TCP/TLS';
      } else if ((self._options.TURNServerTransport === self.TURN_TRANSPORT.TCP || self._options.forceTURNSSL) &&
        self._user.iceServers.length > 0 && self._user.iceServers[0] && self._user.iceServers[0].urls[0] &&
        self._user.iceServers[0].urls[0].indexOf('?transport=tcp') > 0) {
        result.selectedCandidate.local.turnMediaTransport = 'TCP';
      }
    } else {
      result.selectedCandidate.local.turnMediaTransport = null;
    }

    callback(null, result);

  }, function (error) {
    callback(error, null);
  });
};

/**
 * Function that starts the Peer connection session.
 * Remember to remove previous method of reconnection (re-creating the Peer connection - destroy and create connection).
 * @method _addPeer
 * @private
 * @for Skylink
 * @since 0.5.4
 */
Skylink.prototype._addPeer = function(targetMid, peerBrowser, toOffer, restartConn, receiveOnly, isSS) {
  var self = this;
  if (self._peerConnections[targetMid] && !restartConn) {
    log.error([targetMid, null, null, 'Connection to peer has already been made']);
    return;
  }
  log.log([targetMid, null, null, 'Starting the connection to peer. Options provided:'], {
    peerBrowser: peerBrowser,
    toOffer: toOffer,
    receiveOnly: receiveOnly,
    enableDataChannel: self._options.enableDataChannel
  });

  log.info('Adding peer', isSS);

  if (!restartConn) {
    self._peerConnections[targetMid] = self._createPeerConnection(targetMid, !!isSS);
  }

  if (!self._peerConnections[targetMid]) {
    log.error([targetMid, null, null, 'Failed creating the connection to peer']);
    return;
  }

  self._peerConnections[targetMid].hasScreen = !!isSS;
};

/**
 * Function that re-negotiates a Peer connection.
 * Remember to remove previous method of reconnection (re-creating the Peer connection - destroy and create connection).
 * @method _restartPeerConnection
 * @private
 * @for Skylink
 * @since 0.5.8
 */
Skylink.prototype._restartPeerConnection = function (peerId, doIceRestart, callback) {
  var self = this;

  if (!self._peerConnections[peerId]) {
    log.error([peerId, null, null, 'Peer does not have an existing ' +
      'connection. Unable to restart']);
    return;
  }

  var pc = self._peerConnections[peerId];
  var agent = (self.getPeerInfo(peerId) || {}).agent || {};

  // prevent restarts for other SDK clients
  if (self._isLowerThanVersion(agent.SMProtocolVersion || '', '0.1.2')) {
    var notSupportedError = new Error('Failed restarting with other agents connecting from other SDKs as ' +
      're-negotiation is not supported by other SDKs');

    log.warn([peerId, 'RTCPeerConnection', null, 'Ignoring restart request as agent\'s SDK does not support it'],
        notSupportedError);

    if (typeof callback === 'function') {
      log.debug([peerId, 'RTCPeerConnection', null, 'Firing restart failure callback']);
      callback(notSupportedError);
    }
    return;
  }

  // This is when the state is stable and re-handshaking is possible
  // This could be due to previous connection handshaking that is already done
  if (pc.signalingState === self.PEER_CONNECTION_STATE.STABLE && self._peerConnections[peerId]) {
    log.log([peerId, null, null, 'Sending restart message to signaling server']);

    var restartMsg = {
      type: self._SIG_MESSAGE_TYPE.RESTART,
      mid: self._user.id,
      rid: self._user.room.session.rid,
      agent: window.webrtcDetectedBrowser,
      version: (window.webrtcDetectedVersion || 0).toString(),
      os: window.navigator.platform,
      userInfo: self._getUserInfo(),
      target: peerId,
      weight: self._user.priorityWeight,
      receiveOnly: self.getPeerInfo().config.receiveOnly,
      enableIceTrickle: self._options.enableIceTrickle,
      enableDataChannel: self._options.enableDataChannel,
      enableIceRestart: self._enableIceRestart,
      doIceRestart: doIceRestart === true && self._enableIceRestart && self._peerInformations[peerId] &&
        self._peerInformations[peerId].config.enableIceRestart,
      isRestartResend: false,
      temasysPluginVersion: AdapterJS.WebRTCPlugin.plugin ? AdapterJS.WebRTCPlugin.plugin.VERSION : null,
      SMProtocolVersion: self.SM_PROTOCOL_VERSION,
      DTProtocolVersion: self.DT_PROTOCOL_VERSION
    };

    if (self._user.connection.publishOnly) {
      restartMsg.publishOnly = {
        type: self._streams.screenshare && self._streams.screenshare.stream ? 'screenshare' : 'video'
      };
    }

    if (self._user.parentId) {
      restartMsg.parentId = self._user.parentId;
    }

    self._peerEndOfCandidatesCounter[peerId] = self._peerEndOfCandidatesCounter[peerId] || {};
    self._peerEndOfCandidatesCounter[peerId].len = 0;
    self._socketSendMessage(restartMsg);
    self._trigger('peerRestart', peerId, self.getPeerInfo(peerId), true, doIceRestart === true);

    if (typeof callback === 'function') {
      log.debug([peerId, 'RTCPeerConnection', null, 'Firing restart callback']);
      callback(null);
    }

  } else {
    // Let's check if the signalingState is stable first.
    // In another galaxy or universe, where the local description gets dropped..
    // In the offerHandler or answerHandler, do the appropriate flags to ignore or drop "extra" descriptions
    if (pc.signalingState === self.PEER_CONNECTION_STATE.HAVE_LOCAL_OFFER) {
      // Checks if the local description is defined first
      var hasLocalDescription = pc.localDescription && pc.localDescription.sdp;
      // By then it should have at least the local description..
      if (hasLocalDescription) {
        self._socketSendMessage({
          type: pc.localDescription.type,
          sdp: pc.localDescription.sdp,
          mid: self._user.id,
          target: peerId,
          rid: self._user.room.session.rid,
          restart: true
        });
      } else {
        var noLocalDescriptionError = 'Failed re-sending localDescription as there is ' +
          'no localDescription set to connection. There could be a handshaking step error';
        log.error([peerId, 'RTCPeerConnection', null, noLocalDescriptionError], {
            localDescription: pc.localDescription,
            remoteDescription: pc.remoteDescription
        });
        if (typeof callback === 'function') {
          log.debug([peerId, 'RTCPeerConnection', null, 'Firing restart failure callback']);
          callback(new Error(noLocalDescriptionError));
        }
      }
    // It could have connection state closed
    } else {
      var unableToRestartError = 'Failed restarting as peer connection state is ' + pc.signalingState;
      log.warn([peerId, 'RTCPeerConnection', null, unableToRestartError]);
      if (typeof callback === 'function') {
        log.debug([peerId, 'RTCPeerConnection', null, 'Firing restart failure callback']);
        callback(new Error(unableToRestartError));
      }
    }
  }
};

/**
 * Function that ends the Peer connection session.
 * @method _removePeer
 * @private
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._removePeer = function(peerId) {
  if (!this._peerConnections[peerId] && !this._peerInformations[peerId]) {
    log.debug([peerId, 'RTCPeerConnection', null, 'Dropping the hangup from Peer as not connected to Peer at all.']);
    return;
  }

  var peerInfo = clone(this.getPeerInfo(peerId)) || {
    userData: '',
    settings: {},
    mediaStatus: {},
    agent: {},
    config: {},
    room: clone(this._selectedRoom)
  };

  if (peerId !== 'MCU') {
    this._trigger('peerLeft', peerId, peerInfo, false);
  } else {
    this._hasMCU = false;
    log.log([peerId, null, null, 'MCU has stopped listening and left']);
    this._trigger('serverPeerLeft', peerId, this.SERVER_PEER_TYPE.MCU);
  }

  // check if health timer exists
  if (this._peerConnections[peerId]) {
    if (this._peerConnections[peerId].signalingState !== this.PEER_CONNECTION_STATE.CLOSED) {
      this._peerConnections[peerId].close();
    }

    if (peerId !== 'MCU') {
      this._handleEndedStreams(peerId);
    }

    delete this._peerConnections[peerId];
  }
  // remove peer informations session
  if (this._peerInformations[peerId]) {
    delete this._peerInformations[peerId];
  }
  // remove peer messages stamps session
  if (this._peerMessagesStamps[peerId]) {
    delete this._peerMessagesStamps[peerId];
  }
  // remove peer streams session
  if (this._streamsSession[peerId]) {
    delete this._streamsSession[peerId];
  }
  // remove peer streams session
  if (this._peerEndOfCandidatesCounter[peerId]) {
    delete this._peerEndOfCandidatesCounter[peerId];
  }
  // remove peer sdp session
  if (this._sdpSessions[peerId]) {
    delete this._sdpSessions[peerId];
  }

  // close datachannel connection
  if (this._dataChannels[peerId]) {
    this._closeDataChannel(peerId);
  }

  log.log([peerId, null, null, 'Successfully removed peer']);
};

/**
 * Function that creates the Peer connection.
 * @method _createPeerConnection
 * @private
 * @for Skylink
 * @since 0.5.1
 */
Skylink.prototype._createPeerConnection = function(targetMid, isScreenSharing) {
  var pc, self = this;
  if (!self._user.room.connected || !Array.isArray(self._user.iceServers)) {
    return;
  }
  // currently the AdapterJS 0.12.1-2 causes an issue to prevent firefox from
  // using .urls feature
  try {
    pc = new RTCPeerConnection({
      iceServers: self._user.iceServers,
      iceTransportPolicy: self._options.filterCandidatesType.host && self._options.filterCandidatesType.srflx &&
        !self._options.filterCandidatesType.relay ? 'relay' : 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    }, {
      optional: [
        { DtlsSrtpKeyAgreement: true },
        { googIPv6: true }
      ]
    });
    log.info([targetMid, null, null, 'Created peer connection']);
  } catch (error) {
    log.error([targetMid, null, null, 'Failed creating peer connection:'], error);
    return null;
  }
  // attributes (added on by Temasys)
  pc.setOffer = '';
  pc.setAnswer = '';
  pc.hasStream = false;
  pc.hasScreen = !!isScreenSharing;
  pc.hasMainChannel = false;
  pc.firefoxStreamId = '';
  pc.processingLocalSDP = false;
  pc.processingRemoteSDP = false;
  pc.gathered = false;
  pc.gathering = false;

  // candidates
  self._gatheredCandidates[targetMid] = {
    sending: { host: [], srflx: [], relay: [] },
    receiving: { host: [], srflx: [], relay: [] }
  };

  self._streamsSession[targetMid] = self._streamsSession[targetMid] || {};
  self._peerEndOfCandidatesCounter[targetMid] = self._peerEndOfCandidatesCounter[targetMid] || {};
  self._sdpSessions[targetMid] = { local: {}, remote: {} };

  // callbacks
  // standard not implemented: onnegotiationneeded,
  pc.ondatachannel = function(event) {
    var dc = event.channel || event;
    log.debug([targetMid, 'RTCDataChannel', dc.label, 'Received datachannel ->'], dc);
    if (self._options.enableDataChannel && self._peerInformations[targetMid] &&
      self._peerInformations[targetMid].config.enableDataChannel) {
      var channelType = self.DATA_CHANNEL_TYPE.DATA;
      var channelKey = dc.label;

      // if peer does not have main channel, the first item is main
      if (!pc.hasMainChannel) {
        channelType = self.DATA_CHANNEL_TYPE.MESSAGING;
        channelKey = 'main';
        pc.hasMainChannel = true;
      }

      self._createDataChannel(targetMid, dc);

    } else {
      log.warn([targetMid, 'RTCDataChannel', dc.label, 'Not adding datachannel as enable datachannel ' +
        'is set to false']);
    }
  };

  pc.onaddstream = function(event) {
    if (!self._peerConnections[targetMid]) {
      return;
    }

    var stream = event.stream || event;
    var streamId = stream.id || stream.label;

    if (targetMid === 'MCU') {
      log.warn([targetMid, 'MediaStream', streamId, 'Ignoring received remote stream from MCU ->'], stream);
      return;
    } else if (!self._sdpSettings.direction.audio.receive && !self._sdpSettings.direction.video.receive) {
      log.warn([targetMid, 'MediaStream', streamId, 'Ignoring received empty remote stream ->'], stream);
      return;
    }

    // Fixes for the dirty-hack for Chrome offer to Firefox (inactive)
    // See: ESS-680
    if (!self._hasMCU && window.webrtcDetectedBrowser === 'firefox' &&
      pc.getRemoteStreams().length > 1 && pc.remoteDescription && pc.remoteDescription.sdp) {

      if (pc.remoteDescription.sdp.indexOf(' msid:' + streamId + ' ') === -1) {
        log.warn([targetMid, 'MediaStream', streamId, 'Ignoring received empty remote stream ->'], stream);
        return;
      }
    }

    var peerSettings = clone(self.getPeerInfo(targetMid).settings);
    var hasScreenshare = peerSettings.video && typeof peerSettings.video === 'object' && !!peerSettings.video.screenshare;

    pc.hasStream = true;
    pc.hasScreen = !!hasScreenshare;

    self._streamsSession[targetMid][streamId] = peerSettings;
    self._onRemoteStreamAdded(targetMid, stream, !!hasScreenshare);
  };

  pc.onicecandidate = function(event) {
    self._onIceCandidate(targetMid, event.candidate || event);
  };

  pc.oniceconnectionstatechange = function(evt) {
    var iceConnectionState = pc.iceConnectionState;

    log.debug([targetMid, 'RTCIceConnectionState', null, 'Ice connection state changed ->'], iceConnectionState);

    if (window.webrtcDetectedBrowser === 'edge') {
      if (iceConnectionState === 'connecting') {
        iceConnectionState = self.ICE_CONNECTION_STATE.CHECKING;
      } else if (iceConnectionState === 'new') {
        iceConnectionState = self.ICE_CONNECTION_STATE.FAILED;
      }
    }

    self._trigger('iceConnectionState', iceConnectionState, targetMid);

    if (pc.iceConnectionState === self.ICE_CONNECTION_STATE.FAILED && self._options.enableIceTrickle) {
      self._trigger('iceConnectionState', self.ICE_CONNECTION_STATE.TRICKLE_FAILED, targetMid);
    }
  };

  pc.onsignalingstatechange = function() {
    log.debug([targetMid, 'RTCSignalingState', null, 'Peer connection state changed ->'], pc.signalingState);
    self._trigger('peerConnectionState', pc.signalingState, targetMid);
  };
  pc.onicegatheringstatechange = function() {
    log.log([targetMid, 'RTCIceGatheringState', null, 'Ice gathering state changed ->'], pc.iceGatheringState);
    self._trigger('candidateGenerationState', pc.iceGatheringState, targetMid);
  };

  if (window.webrtcDetectedBrowser === 'firefox') {
    pc.removeStream = function (stream) {
      var senders = pc.getSenders();
      for (var s = 0; s < senders.length; s++) {
        var tracks = stream.getTracks();
        for (var t = 0; t < tracks.length; t++) {
          if (tracks[t] === senders[s].track) {
            pc.removeTrack(senders[s]);
          }
        }
      }
    };
  }

  return pc;
};

/**
 * Function that handles the <code>_restartPeerConnection</code> scenario
 *   for MCU enabled Peer connections.
 * This is implemented currently by making the user leave and join the Room again.
 * The Peer ID will not stay the same though.
 * @method _restartMCUConnection
 * @private
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype._restartMCUConnection = function(callback, doIceRestart) {
  var self = this;
  var listOfPeers = Object.keys(self._peerConnections);
  var listOfPeerRestartErrors = {};
  var sendRestartMsgFn = function (peerId) {
    var restartMsg = {
      type: self._SIG_MESSAGE_TYPE.RESTART,
      mid: self._user.id,
      rid: self._user.room.session.rid,
      agent: window.webrtcDetectedBrowser,
      version: (window.webrtcDetectedVersion || 0).toString(),
      os: window.navigator.platform,
      userInfo: self._getUserInfo(),
      target: peerId,
      weight: self._user.priorityWeight,
      receiveOnly: self.getPeerInfo().config.receiveOnly,
      enableIceTrickle: self._options.enableIceTrickle,
      enableDataChannel: self._options.enableDataChannel,
      enableIceRestart: self._enableIceRestart,
      doIceRestart: self._options.mcuUseRenegoRestart && doIceRestart === true &&
        self._enableIceRestart && self._peerInformations[peerId] &&
        self._peerInformations[peerId].config.enableIceRestart,
      isRestartResend: false,
      temasysPluginVersion: AdapterJS.WebRTCPlugin.plugin ? AdapterJS.WebRTCPlugin.plugin.VERSION : null,
      SMProtocolVersion: self.SM_PROTOCOL_VERSION,
      DTProtocolVersion: self.DT_PROTOCOL_VERSION
    };

    if (self._user.connection.publishOnly) {
      restartMsg.publishOnly = {
        type: self._streams.screenshare && self._streams.screenshare.stream ? 'screenshare' : 'video'
      };
    }

    if (self._user.parentId) {
      restartMsg.parentId = self._user.parentId;
    }

    log.log([peerId, 'RTCPeerConnection', null, 'Sending restart message to signaling server ->'], restartMsg);

    self._socketSendMessage(restartMsg);
  };

  for (var i = 0; i < listOfPeers.length; i++) {
    if (!self._peerConnections[listOfPeers[i]]) {
      var error = 'Peer connection with peer does not exists. Unable to restart';
      log.error([listOfPeers[i], 'PeerConnection', null, error]);
      listOfPeerRestartErrors[listOfPeers[i]] = new Error(error);
      continue;
    }

    if (listOfPeers[i] !== 'MCU') {
      self._trigger('peerRestart', listOfPeers[i], self.getPeerInfo(listOfPeers[i]), true, false);

      if (!self._mcuUseRenegoRestart) {
        sendRestartMsgFn(listOfPeers[i]);
      }
    }
  }

  self._trigger('serverPeerRestart', 'MCU', self.SERVER_PEER_TYPE.MCU);

  if (self._mcuUseRenegoRestart) {
    self._peerEndOfCandidatesCounter.MCU = self._peerEndOfCandidatesCounter.MCU || {};
    self._peerEndOfCandidatesCounter.MCU.len = 0;
    sendRestartMsgFn('MCU');
  } else {
    // Restart with MCU = peer leaves then rejoins room
    var peerJoinedFn = function (peerId, peerInfo, isSelf) {
      log.log([null, 'PeerConnection', null, 'Invoked all peers to restart with MCU. Firing callback']);

      if (typeof callback === 'function') {
        if (Object.keys(listOfPeerRestartErrors).length > 0) {
          callback({
            refreshErrors: listOfPeerRestartErrors,
            listOfPeers: listOfPeers
          }, null);
        } else {
          callback(null, {
            listOfPeers: listOfPeers
          });
        }
      }
    };

    self.once('peerJoined', peerJoinedFn, function (peerId, peerInfo, isSelf) {
      return isSelf;
    });

    self.leaveRoom(false, function (error, success) {
      if (error) {
        if (typeof callback === 'function') {
          for (var i = 0; i < listOfPeers.length; i++) {
            listOfPeerRestartErrors[listOfPeers[i]] = error;
          }
          callback({
            refreshErrors: listOfPeerRestartErrors,
            listOfPeers: listOfPeers
          }, null);
        }
      } else {
        //self._trigger('serverPeerLeft', 'MCU', self.SERVER_PEER_TYPE.MCU);
        self.joinRoom(self._selectedRoom);
      }
    });
  }
};

/**
 * Function that handles the stats tabulation.
 * @method _parseConnectionStats
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._parseConnectionStats = function(prevStats, stats, prop) {
  var nTime = stats.timestamp;
  var oTime = prevStats.timestamp;
  var nVal = parseFloat(stats[prop] || '0', 10);
  var oVal = parseFloat(prevStats[prop] || '0', 10);

  if ((new Date(nTime).getTime()) === (new Date(oTime).getTime())) {
    return nVal;
  }

  return parseFloat(((nVal - oVal) / (nTime - oTime) * 1000).toFixed(3) || '0', 10);
};

/**
 * Function that signals the end-of-candidates flag.
 * @method _signalingEndOfCandidates
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._signalingEndOfCandidates = function(targetMid) {
  var self = this;

  if (!self._peerEndOfCandidatesCounter[targetMid]) {
    return;
  }

  // If remote description is set
  if (self._peerConnections[targetMid].remoteDescription && self._peerConnections[targetMid].remoteDescription.sdp &&
  // If end-of-candidates signal is received
    typeof self._peerEndOfCandidatesCounter[targetMid].expectedLen === 'number' &&
  // If all ICE candidates are received
    self._peerEndOfCandidatesCounter[targetMid].len >= self._peerEndOfCandidatesCounter[targetMid].expectedLen &&
  // If there is no ICE candidates queue
    (self._peerCandidatesQueue[targetMid] ? self._peerCandidatesQueue[targetMid].length === 0 : true) &&
  // If it has not been set yet
    !self._peerEndOfCandidatesCounter[targetMid].hasSet) {
    log.debug([targetMid, 'RTCPeerConnection', null, 'Signaling of end-of-candidates remote ICE gathering.']);
    self._peerEndOfCandidatesCounter[targetMid].hasSet = true;
    try {
      if (window.webrtcDetectedBrowser === 'edge') {
        var mLineCounter = -1;
        var addedMids = [];
        var sdpLines = self._peerConnections[targetMid].remoteDescription.sdp.split('\r\n');

        for (var i = 0; i < sdpLines.length; i++) {
          if (sdpLines[i].indexOf('m=') === 0) {
            mLineCounter++;
          } else if (sdpLines[i].indexOf('a=mid:') === 0) {
            var mid = sdpLines[i].split('a=mid:')[1] || '';
            if (mid && addedMids.indexOf(mid) === -1) {
              addedMids.push(mid);
              self._addIceCandidate(targetMid, 'endofcan-' + (new Date()).getTime(), new RTCIceCandidate({
                sdpMid: mid,
                sdpMLineIndex: mLineCounter,
                candidate: 'candidate:1 1 udp 1 0.0.0.0 9 typ endOfCandidates'
              }));
            }
          }
        }

      } else {
        self._peerConnections[targetMid].addIceCandidate(null);
      }

      if (self._gatheredCandidates[targetMid]) {
        self._trigger('candidatesGathered', targetMid, {
          expected: self._peerEndOfCandidatesCounter[targetMid].expectedLen || 0,
          received: self._peerEndOfCandidatesCounter[targetMid].len || 0,
          processed: self._gatheredCandidates[targetMid].receiving.srflx.length +
            self._gatheredCandidates[targetMid].receiving.relay.length +
            self._gatheredCandidates[targetMid].receiving.host.length
        });
      }

    } catch (error) {
      log.error([targetMid, 'RTCPeerConnection', null, 'Failed signaling end-of-candidates ->'], error);
    }
  }
};



Skylink.prototype.setUserData = function(userData) {
  var self = this;
  var updatedUserData = '';

  if (!(typeof userData === 'undefined' || userData === null)) {
    updatedUserData = userData;
  }

  self._user.data = updatedUserData;

  if (self._user.room.connected) {
    log.log('Updated userData -> ', updatedUserData);
    self._socketSendMessage({
      type: self._SIG_MESSAGE_TYPE.UPDATE_USER,
      mid: self._user.id,
      rid: self._user.room.session.rid,
      userData: updatedUserData,
      stamp: (new Date()).getTime()
    });
    self._trigger('peerUpdated', self._user.id, self.getPeerInfo(), true);
  } else {
    log.warn('User is not in the room. Broadcast of updated information will be dropped');
  }
};

/**
 * Function that returns the User / Peer current custom data.
 * @method getUserData
 * @param {String} [peerId] The Peer ID to return the current custom data from.
 * - When not provided or that the Peer ID is does not exists, it will return
 *   the User current custom data.
 * @return {JSON|String} The User / Peer current custom data.
 * @example
 *   // Example 1: Get Peer current custom data
 *   var peerUserData = skylinkDemo.getUserData(peerId);
 *
 *   // Example 2: Get User current custom data
 *   var userUserData = skylinkDemo.getUserData();
 * @for Skylink
 * @since 0.5.10
 */
Skylink.prototype.getUserData = function(peerId) {
  if (peerId && this._peerInformations[peerId]) {
    var userData = this._peerInformations[peerId].userData;
    if (!(userData !== null && typeof userData === 'undefined')) {
      userData = '';
    }
    return userData;
  }
  return this._user.data;
};

/**
 * Function that returns the User / Peer current session information.
 * @method getPeerInfo
 * @param {String} [peerId] The Peer ID to return the current session information from.
 * - When not provided or that the Peer ID is does not exists, it will return
 *   the User current session information.
 * @return {JSON} The User / Peer current session information.
 *   <small>Object signature matches the <code>peerInfo</code> parameter payload received in the
 *   <a href="#event_peerJoined"><code>peerJoined</code> event</a>.</small>
 * @example
 *   // Example 1: Get Peer current session information
 *   var peerPeerInfo = skylinkDemo.getPeerInfo(peerId);
 *
 *   // Example 2: Get User current session information
 *   var userPeerInfo = skylinkDemo.getPeerInfo();
 * @for Skylink
 * @since 0.4.0
 */
Skylink.prototype.getPeerInfo = function(peerId) {
  var peerInfo = null;

  if (typeof peerId === 'string' && typeof this._peerInformations[peerId] === 'object') {
    peerInfo = clone(this._peerInformations[peerId]);
    peerInfo.room = clone(this._selectedRoom);
    peerInfo.settings.bandwidth = peerInfo.settings.bandwidth || {};
    peerInfo.settings.googleXBandwidth = peerInfo.settings.googleXBandwidth || {};

    if (!(typeof peerInfo.settings.video === 'boolean' || (peerInfo.settings.video &&
      typeof peerInfo.settings.video === 'object'))) {
      peerInfo.settings.video = false;
      peerInfo.mediaStatus.audioMuted = true;
    }

    if (!(typeof peerInfo.settings.audio === 'boolean' || (peerInfo.settings.audio &&
      typeof peerInfo.settings.audio === 'object'))) {
      peerInfo.settings.audio = false;
      peerInfo.mediaStatus.audioMuted = true;
    }

    if (typeof peerInfo.mediaStatus.audioMuted !== 'boolean') {
      peerInfo.mediaStatus.audioMuted = true;
    }

    if (typeof peerInfo.mediaStatus.videoMuted !== 'boolean') {
      peerInfo.mediaStatus.videoMuted = true;
    }

    if (peerInfo.settings.maxBandwidth) {
      peerInfo.settings.bandwidth = clone(peerInfo.settings.maxBandwidth);
      delete peerInfo.settings.maxBandwidth;
    }

    if (peerInfo.settings.video && typeof peerInfo.settings.video === 'object' &&
      peerInfo.settings.video.customSettings && typeof peerInfo.settings.video.customSettings === 'object') {
      if (peerInfo.settings.video.customSettings.frameRate) {
        peerInfo.settings.video.frameRate = clone(peerInfo.settings.video.customSettings.frameRate);
      }
      if (peerInfo.settings.video.customSettings.facingMode) {
        peerInfo.settings.video.facingMode = clone(peerInfo.settings.video.customSettings.facingMode);
      }
      if (peerInfo.settings.video.customSettings.width) {
        peerInfo.settings.video.resolution = peerInfo.settings.video.resolution || {};
        peerInfo.settings.video.resolution.width = clone(peerInfo.settings.video.customSettings.width);
      }
      if (peerInfo.settings.video.customSettings.height) {
        peerInfo.settings.video.resolution = peerInfo.settings.video.resolution || {};
        peerInfo.settings.video.resolution.height = clone(peerInfo.settings.video.customSettings.height);
      }
      if (peerInfo.settings.video.customSettings.facingMode) {
        peerInfo.settings.video.facingMode = clone(peerInfo.settings.video.customSettings.facingMode);
      }
    }

    if (peerInfo.settings.audio && typeof peerInfo.settings.audio === 'object') {
      peerInfo.settings.audio.stereo = peerInfo.settings.audio.stereo === true;
    }

    if (!(peerInfo.userData !== null && typeof peerInfo.userData !== 'undefined')) {
      peerInfo.userData = '';
    }

    peerInfo.parentId = peerInfo.parentId || null;

    if (peerId === 'MCU') {
      peerInfo.config.receiveOnly = true;
      peerInfo.config.publishOnly = false;
    } else if (this._hasMCU) {
      peerInfo.config.receiveOnly = false;
      peerInfo.config.publishOnly = true;
    }

    // If there is Peer ID (not broadcast ENTER message) and Peer is Edge browser and User is not
    if (window.webrtcDetectedBrowser !== 'edge' && peerInfo.agent.name === 'edge' ?
    // If User is IE/safari and does not have H264 support, remove video support
      ['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1 && !this._currentCodecSupport.video.h264 :
    // If User is Edge and Peer is not and no H264 support, remove video support
      window.webrtcDetectedBrowser === 'edge' && peerInfo.agent.name !== 'edge' && !this._currentCodecSupport.video.h264) {
      peerInfo.settings.video = false;
      peerInfo.mediaStatus.videoMuted = true;
    }

  } else {
    peerInfo = {
      userData: clone(this._user.data),
      settings: {
        audio: false,
        video: false
      },
      mediaStatus: clone(this._streamsMutedSettings),
      agent: {
        name: window.webrtcDetectedBrowser,
        version: window.webrtcDetectedVersion,
        os: window.navigator.platform,
        pluginVersion: AdapterJS.WebRTCPlugin.plugin ? AdapterJS.WebRTCPlugin.plugin.VERSION : null,
        SMProtocolVersion: this.SMProtocolVersion,
        DTProtocolVersion: this.DTProtocolVersion
      },
      room: clone(this._user.room.name),
      config: {
        enableDataChannel: this._options.enableDataChannel,
        enableIceTrickle: this._options.enableIceTrickle,
        enableIceRestart: this._enableIceRestart,
        priorityWeight: this._user.priorityWeight,
        receiveOnly: false,
        publishOnly: !!this._user.connection.publishOnly
      }
    };

    if (!(peerInfo.userData !== null && typeof peerInfo.userData !== 'undefined')) {
      peerInfo.userData = '';
    }

    if (this._streams.screenshare) {
      peerInfo.settings = clone(this._streams.screenshare.settings);
    } else if (this._streams.userMedia) {
      peerInfo.settings = clone(this._streams.userMedia.settings);
    }

    peerInfo.settings.bandwidth = clone(this._user.connection.bandwidth.max);
    peerInfo.settings.googleXBandwidth = clone(this._user.connection.bandwidth.xVideoCodec);
    peerInfo.parentId = this._user.parentId ? this._user.parentId : null;
    peerInfo.config.receiveOnly = !peerInfo.settings.video && !peerInfo.settings.audio;
  }

  if (!peerInfo.settings.audio) {
    peerInfo.mediaStatus.audioMuted = true;
  }

  if (!peerInfo.settings.video) {
    peerInfo.mediaStatus.videoMuted = true;
  }

  if (!peerInfo.settings.audio && !peerInfo.settings.video) {
    peerInfo.config.receiveOnly = true;
    peerInfo.config.publishOnly = false;
  }

  return peerInfo;
};

/**
 * Function that gets the list of connected Peers in the Room.
 * @method getPeersInRoom
 * @return {JSON} The list of connected Peers. <ul>
 *   <li><code>#peerId</code><var><b>{</b>JSON<b>}</b></var><p>The Peer information.
 *   <small>Object signature matches the <code>peerInfo</code> parameter payload received in the
 *   <a href="#event_peerJoined"><code>peerJoined</code> event</a> except there is
 *   the <code>isSelf</code> flag that determines if Peer is User or not.</small></p></li></ul>
 * @example
 *   // Example 1: Get the list of currently connected Peers in the same Room
 *   var peers = skylinkDemo.getPeersInRoom();
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype.getPeersInRoom = function() {
  var listOfPeersInfo = {};
  var listOfPeers = Object.keys(this._peerInformations);

  for (var i = 0; i < listOfPeers.length; i++) {
    listOfPeersInfo[listOfPeers[i]] = clone(this.getPeerInfo(listOfPeers[i]));
    listOfPeersInfo[listOfPeers[i]].isSelf = false;
  }

  if (this._user && this._user.id) {
    listOfPeersInfo[this._user.id] = clone(this.getPeerInfo());
    listOfPeersInfo[this._user.id].isSelf = true;
  }

  return listOfPeersInfo;
};

/**
 * Function that gets the list of connected Peers Streams in the Room.
 * @method getPeersStream
 * @return {JSON} The list of Peers Stream. <ul>
 *   <li><code>#peerId</code><var><b>{</b>JSON<b>}</b></var><p>The Peer Stream.</p><ul>
 *   <li><code>stream</code><var><b>{</b>MediaStream<b>}</b></var><p>The Stream object.</p></li>
 *   <li><code>streamId</code><var><b>{</b>String<b>}</b></var><p>The Stream ID.</p></li>
 *   <li><code>isSelf</code><var><b>{</b>Boolean<b>}</b></var><p>The flag if Peer is User.</p></li>
 *   </p></li></ul></li></ul>
 * @example
 *   // Example 1: Get the list of current Peer Streams in the same Room
 *   var streams = skylinkDemo.getPeersStream();
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype.getPeersStream = function() {
  var listOfPeersStreams = {};
  var listOfPeers = Object.keys(this._peerConnections);

  for (var i = 0; i < listOfPeers.length; i++) {
    var stream = null;

    if (this._peerConnections[listOfPeers[i]] &&
      this._peerConnections[listOfPeers[i]].remoteDescription &&
      this._peerConnections[listOfPeers[i]].remoteDescription.sdp &&
      (this._sdpSettings.direction.audio.receive || this._sdpSettings.direction.video.receive)) {
      var streams = this._peerConnections[listOfPeers[i]].getRemoteStreams();

      for (var j = 0; j < streams.length; j++) {
        if (this._peerConnections[listOfPeers[i]].remoteDescription.sdp.indexOf(
          'msid:' + (streams[j].id || streams[j].label)) > 0) {
          stream = streams[j];
          break;
        }
      }
    }

    listOfPeersStreams[listOfPeers[i]] = {
      streamId: stream ? stream.id || stream.label || null : null,
      stream: stream,
      isSelf: false
    };
  }

  if (this._user && this._user.id) {
    var selfStream = null;

    if (this._streams.screenshare && this._streams.screenshare.stream) {
      selfStream = this._streams.screenshare.stream;
    } else if (this._streams.userMedia && this._streams.userMedia.stream) {
      selfStream = this._streams.userMedia.stream;
    }

    listOfPeersStreams[this._user.id] = {
      streamId: selfStream ? selfStream.id || selfStream.label || null : null,
      stream: selfStream,
      isSelf: true
    };
  }

  return listOfPeersStreams;
};

/**
 * Function that gets the list of current data transfers.
 * @method getCurrentDataTransfers
 * @return {JSON} The list of Peers Stream. <ul>
 *   <li><code>#transferId</code><var><b>{</b>JSON<b>}</b></var><p>The data transfer session.</p><ul>
 *   <li><code>transferInfo</code><var><b>{</b>JSON<b>}</b></var><p>The Stream object.
 *   <small>Object signature matches the <code>transferInfo</code> parameter payload received in the
 *   <a href="#event_dataTransferState"><code>dataTransferState</code> event</a>
 *   except without the <code>data</code> property.</small></p></li>
 *   <li><code>peerId</code><var><b>{</b>String<b>}</b></var><p>The sender Peer ID.</p></li>
 *   <li><code>isSelf</code><var><b>{</b>Boolean<b>}</b></var><p>The flag if Peer is User.</p></li>
 *   </p></li></ul></li></ul>
 * @example
 *   // Example 1: Get the list of current data transfers in the same Room
 *   var currentTransfers = skylinkDemo.getCurrentDataTransfers();
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype.getCurrentDataTransfers = function() {
  var listOfDataTransfers = {};

  if (!(this._user && this._user.id)) {
    return {};
  }

  for (var prop in this._dataTransfers) {
    if (this._dataTransfers.hasOwnProperty(prop) && this._dataTransfers[prop]) {
      listOfDataTransfers[prop] = {
        transferInfo: this._getTransferInfo(prop, this._user.id, true, true, true),
        isSelf: this._dataTransfers[prop].senderPeerId === this._user.id,
        peerId: this._dataTransfers[prop].senderPeerId || this._user.id
      };
    }
  }

  return listOfDataTransfers;
};

/**
 * Function that returns the User session information to be sent to Peers.
 * @method _getUserInfo
 * @private
 * @for Skylink
 * @since 0.4.0
 */
Skylink.prototype._getUserInfo = function(peerId) {
  var userInfo = clone(this.getPeerInfo());
  var peerInfo = clone(this.getPeerInfo(peerId));

  // Adhere to SM protocol without breaking the other SDKs.
  if (userInfo.settings.video && typeof userInfo.settings.video === 'object') {
    userInfo.settings.video.customSettings = {};

    if (userInfo.settings.video.frameRate && typeof userInfo.settings.video.frameRate === 'object') {
      userInfo.settings.video.customSettings.frameRate = clone(userInfo.settings.video.frameRate);
      userInfo.settings.video.frameRate = -1;
    }

    if (userInfo.settings.video.facingMode && typeof userInfo.settings.video.facingMode === 'object') {
      userInfo.settings.video.customSettings.facingMode = clone(userInfo.settings.video.facingMode);
      userInfo.settings.video.facingMode = '-1';
    }

    if (userInfo.settings.video.resolution && typeof userInfo.settings.video.resolution === 'object') {
      if (userInfo.settings.video.resolution.width && typeof userInfo.settings.video.resolution.width === 'object') {
        userInfo.settings.video.customSettings.width = clone(userInfo.settings.video.width);
        userInfo.settings.video.resolution.width = -1;
      }

      if (userInfo.settings.video.resolution.height && typeof userInfo.settings.video.resolution.height === 'object') {
        userInfo.settings.video.customSettings.height = clone(userInfo.settings.video.height);
        userInfo.settings.video.resolution.height = -1;
      }
    }
  }

  if (userInfo.settings.bandwidth) {
    userInfo.settings.maxBandwidth = clone(userInfo.settings.bandwidth);
    delete userInfo.settings.bandwidth;
  }

  // If there is Peer ID (not broadcast ENTER message) and Peer is Edge browser and User is not
  if (peerId ? (window.webrtcDetectedBrowser !== 'edge' && peerInfo.agent.name === 'edge' ?
  // If User is IE/safari and does not have H264 support, remove video support
    ['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1 && !this._currentCodecSupport.video.h264 :
  // If User is Edge and Peer is not and no H264 support, remove video support
    window.webrtcDetectedBrowser === 'edge' && peerInfo.agent.name !== 'edge' && !this._currentCodecSupport.video.h264) :
  // If broadcast ENTER message and User is Edge and has no H264 support
    window.webrtcDetectedBrowser === 'edge' && !this._currentCodecSupport.video.h264) {
    userInfo.settings.video = false;
    userInfo.mediaStatus.videoMuted = true;
  }

  delete userInfo.agent;
  delete userInfo.room;
  delete userInfo.config;
  delete userInfo.parentId;
  return userInfo;
};

Skylink.prototype.HANDSHAKE_PROGRESS = {
  ENTER: 'enter',
  WELCOME: 'welcome',
  OFFER: 'offer',
  ANSWER: 'answer',
  ERROR: 'error'
};

/**
 * Function that creates the Peer connection offer session description.
 * @method _doOffer
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._doOffer = function(targetMid, iceRestart, peerBrowser) {
  var self = this;
  var pc = self._peerConnections[targetMid] || self._addPeer(targetMid, peerBrowser);

  log.log([targetMid, null, null, 'Checking caller status'], peerBrowser);

  // Added checks to ensure that connection object is defined first
  if (!pc) {
    log.warn([targetMid, 'RTCSessionDescription', 'offer', 'Dropping of creating of offer ' +
      'as connection does not exists']);
    return;
  }

  // Added checks to ensure that state is "stable" if setting local "offer"
  if (pc.signalingState !== self.PEER_CONNECTION_STATE.STABLE) {
    log.warn([targetMid, 'RTCSessionDescription', 'offer',
      'Dropping of creating of offer as signalingState is not "' +
      self.PEER_CONNECTION_STATE.STABLE + '" ->'], pc.signalingState);
    return;
  }

  var peerAgent = ((self._peerInformations[targetMid] || {}).agent || {}).name || '';
  var doIceRestart = !!((self._peerInformations[targetMid] || {}).config || {}).enableIceRestart &&
    iceRestart && self._enableIceRestart;
  var offerToReceiveAudio = !(!self._sdpSettings.connection.audio && targetMid !== 'MCU');
  var offerToReceiveVideo = !(!self._sdpSettings.connection.video && targetMid !== 'MCU') &&
    ((window.webrtcDetectedBrowser === 'edge' && peerAgent !== 'edge') ||
    (['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1 && peerAgent === 'edge') ?
    !!self._currentCodecSupport.video.h264 : true);

  var offerConstraints = {
    offerToReceiveAudio: offerToReceiveAudio,
    offerToReceiveVideo: offerToReceiveVideo,
    iceRestart: doIceRestart
  };

  // Prevent undefined OS errors
  peerBrowser.os = peerBrowser.os || '';

  // Fallback to use mandatory constraints for plugin based browsers
  if (['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1) {
    offerConstraints = {
      mandatory: {
        OfferToReceiveAudio: offerToReceiveAudio,
        OfferToReceiveVideo: offerToReceiveVideo,
        iceRestart: doIceRestart
      }
    };
  }

  // Add stream only at offer/answer end
  if (!self._hasMCU || targetMid === 'MCU') {
    self._addLocalMediaStreams(targetMid);
  }

  if (self._options.enableDataChannel && self._peerInformations[targetMid] &&
    self._peerInformations[targetMid].config.enableDataChannel &&
    !(!self._sdpSettings.connection.data && targetMid !== 'MCU')) {
    // Edge doesn't support datachannels yet
    if (!(self._dataChannels[targetMid] && self._dataChannels[targetMid].main)) {
      self._createDataChannel(targetMid);
      self._peerConnections[targetMid].hasMainChannel = true;
    }
  }

  log.debug([targetMid, null, null, 'Creating offer with config:'], offerConstraints);

  pc.endOfCandidates = false;

  pc.createOffer(function(offer) {
    log.debug([targetMid, null, null, 'Created offer'], offer);

    self._setLocalAndSendMessage(targetMid, offer);

  }, function(error) {
    self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.ERROR, targetMid, error);

    log.error([targetMid, null, null, 'Failed creating an offer:'], error);

  }, offerConstraints);
};

/**
 * Function that creates the Peer connection answer session description.
 * This comes after receiving and setting the offer session description.
 * @method _doAnswer
 * @private
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype._doAnswer = function(targetMid) {
  var self = this;
  log.log([targetMid, null, null, 'Creating answer.']);
  var pc = self._peerConnections[targetMid];

  // Added checks to ensure that connection object is defined first
  if (!pc) {
    log.warn([targetMid, 'RTCSessionDescription', 'answer', 'Dropping of creating of answer ' +
      'as connection does not exists']);
    return;
  }

  // Added checks to ensure that state is "have-remote-offer" if setting local "answer"
  if (pc.signalingState !== self.PEER_CONNECTION_STATE.HAVE_REMOTE_OFFER) {
    log.warn([targetMid, 'RTCSessionDescription', 'answer',
      'Dropping of creating of answer as signalingState is not "' +
      self.PEER_CONNECTION_STATE.HAVE_REMOTE_OFFER + '" ->'], pc.signalingState);
    return;
  }

  // Add stream only at offer/answer end
  if (!self._hasMCU || targetMid === 'MCU') {
    self._addLocalMediaStreams(targetMid);
  }

  // No ICE restart constraints for createAnswer as it fails in chrome 48
  // { iceRestart: true }
  pc.createAnswer(function(answer) {
    log.debug([targetMid, null, null, 'Created answer'], answer);
    self._setLocalAndSendMessage(targetMid, answer);
  }, function(error) {
    log.error([targetMid, null, null, 'Failed creating an answer:'], error);
    self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.ERROR, targetMid, error);
  });
};

/**
 * Function that sets the local session description and sends to Peer.
 * If trickle ICE is disabled, the local session description will be sent after
 *   ICE gathering has been completed.
 * @method _setLocalAndSendMessage
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._setLocalAndSendMessage = function(targetMid, sessionDescription) {
  var self = this;
  var pc = self._peerConnections[targetMid];

  // Added checks to ensure that sessionDescription is defined first
  if (!(!!sessionDescription && !!sessionDescription.sdp)) {
    log.warn([targetMid, 'RTCSessionDescription', null, 'Local session description is undefined ->'], sessionDescription);
    return;
  }

  // Added checks to ensure that connection object is defined first
  if (!pc) {
    log.warn([targetMid, 'RTCSessionDescription', sessionDescription.type,
      'Local session description will not be set as connection does not exists ->'], sessionDescription);
    return;

  } else if (sessionDescription.type === self.HANDSHAKE_PROGRESS.OFFER &&
    pc.signalingState !== self.PEER_CONNECTION_STATE.STABLE) {
    log.warn([targetMid, 'RTCSessionDescription', sessionDescription.type, 'Local session description ' +
      'will not be set as signaling state is "' + pc.signalingState + '" ->'], sessionDescription);
    return;

  // Added checks to ensure that state is "have-remote-offer" if setting local "answer"
  } else if (sessionDescription.type === self.HANDSHAKE_PROGRESS.ANSWER &&
    pc.signalingState !== self.PEER_CONNECTION_STATE.HAVE_REMOTE_OFFER) {
    log.warn([targetMid, 'RTCSessionDescription', sessionDescription.type, 'Local session description ' +
      'will not be set as signaling state is "' + pc.signalingState + '" ->'], sessionDescription);
    return;

  // Added checks if there is a current local sessionDescription being processing before processing this one
  } else if (pc.processingLocalSDP) {
    log.warn([targetMid, 'RTCSessionDescription', sessionDescription.type,
      'Local session description will not be set as another is being processed ->'], sessionDescription);
    return;
  }

  pc.processingLocalSDP = true;

  // Sets and expected receiving codecs etc.
  //sessionDescription.sdp = self._setSDPOpusConfig(targetMid, sessionDescription);
  //sessionDescription.sdp = self._setSDPCodec(targetMid, sessionDescription);
  sessionDescription.sdp = self._removeSDPFirefoxH264Pref(targetMid, sessionDescription);
  sessionDescription.sdp = self._removeSDPH264VP9AptRtxForOlderPlugin(targetMid, sessionDescription);
  sessionDescription.sdp = self._removeSDPCodecs(targetMid, sessionDescription);
  sessionDescription.sdp = self._handleSDPConnectionSettings(targetMid, sessionDescription, 'local');
  //sessionDescription.sdp = self._setSDPBitrate(targetMid, sessionDescription);
  sessionDescription.sdp = self._removeSDPREMBPackets(targetMid, sessionDescription);

  log.log([targetMid, 'RTCSessionDescription', sessionDescription.type,
    'Local session description updated ->'], sessionDescription.sdp);

  pc.setLocalDescription(sessionDescription, function() {
    log.debug([targetMid, 'RTCSessionDescription', sessionDescription.type,
      'Local session description has been set ->'], sessionDescription);

    pc.processingLocalSDP = false;

    self._trigger('handshakeProgress', sessionDescription.type, targetMid);

    if (sessionDescription.type === self.HANDSHAKE_PROGRESS.ANSWER) {
      pc.setAnswer = 'local';
    } else {
      pc.setOffer = 'local';
    }

    if (!self._options.enableIceTrickle && !pc.gathered) {
      log.log([targetMid, 'RTCSessionDescription', sessionDescription.type,
        'Local session description sending is halted to complete ICE gathering.']);
      return;
    }

    self._socketSendMessage({
      type: sessionDescription.type,
      sdp: self._addSDPMediaStreamTrackIDs(targetMid, sessionDescription),
      mid: self._user.id,
      target: targetMid,
      rid: self._user.room.session.rid,
      userInfo: self._getUserInfo()
    });

  }, function(error) {
    log.error([targetMid, 'RTCSessionDescription', sessionDescription.type, 'Local description failed setting ->'], error);

    pc.processingLocalSDP = false;

    self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.ERROR, targetMid, error);
  });
};

Skylink.prototype.GET_PEERS_STATE = {
	ENQUIRED: 'enquired',
	RECEIVED: 'received'
};

/**
 * <blockquote class="info">
 *   Note that this feature requires <code>"isPrivileged"</code> flag to be enabled and
 *   <code>"autoIntroduce"</code> flag to be disabled for the App Key provided in the
 *   <a href="#method_init"><code>init()</code> method</a>, as only Users connecting using
 *   the App Key with this flag enabled (which we call privileged Users / Peers) can retrieve the list of
 *   Peer IDs from Rooms within the same App space.
 *   <a href="http://support.temasys.io/support/solutions/articles/12000012342-what-is-a-privileged-key-">
 *   Read more about privileged App Key feature here</a>.
 * </blockquote>
 * The list of <a href="#method_introducePeer"><code>introducePeer</code> method</a> Peer introduction request states.
 * @attribute INTRODUCE_STATE
 * @param {String} INTRODUCING <small>Value <code>"enquired"</code></small>
 *   The value of the state when introduction request for the selected pair of Peers has been made to the Signaling server.
 * @param {String} ERROR       <small>Value <code>"error"</code></small>
 *   The value of the state when introduction request made to the Signaling server
 *   for the selected pair of Peers has failed.
 * @readOnly
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype.INTRODUCE_STATE = {
	INTRODUCING: 'introducing',
	ERROR: 'error'
};

/**
 * <blockquote class="info">
 *   Note that this feature requires <code>"isPrivileged"</code> flag to be enabled for the App Key
 *   provided in the <a href="#method_init"><code>init()</code> method</a>, as only Users connecting using
 *   the App Key with this flag enabled (which we call privileged Users / Peers) can retrieve the list of
 *   Peer IDs from Rooms within the same App space.
 *   <a href="http://support.temasys.io/support/solutions/articles/12000012342-what-is-a-privileged-key-">
 *   Read more about privileged App Key feature here</a>.
 * </blockquote>
 * Function that retrieves the list of Peer IDs from Rooms within the same App space.
 * @method getPeers
 * @param {Boolean} [showAll=false] The flag if Signaling server should also return the list of privileged Peer IDs.
 * <small>By default, the Signaling server does not include the list of privileged Peer IDs in the return result.</small>
 * @param {Function} [callback] The callback function fired when request has completed.
 *   <small>Function parameters signature is <code>function (error, success)</code></small>
 *   <small>Function request completion is determined by the <a href="#event_getPeersStateChange">
 *   <code>getPeersStateChange</code> event</a> triggering <code>state</code> parameter payload value as
 *   <code>RECEIVED</code> for request success.</small>
 *   [Rel: Skylink.GET_PEERS_STATE]
 * @param {Error|String} callback.error The error result in request.
 *   <small>Defined as <code>null</code> when there are no errors in request</small>
 *   <small>Object signature is the <code>getPeers()</code> error when retrieving list of Peer IDs from Rooms
 *   within the same App space.</small>
 * @param {JSON} callback.success The success result in request.
 *   <small>Defined as <code>null</code> when there are errors in request</small>
 *   <small>Object signature matches the <code>peerList</code> parameter payload received in the
 *   <a href="#event_getPeersStateChange"><code>getPeersStateChange</code> event</a>.</small>
 * @trigger <ol class="desc-seq">
 *   <li>If App Key provided in the <a href="#method_init"><code>init()</code> method</a> is not
 *   a Privileged enabled Key: <ol><li><b>ABORT</b> and return error.</li></ol></li>
 *   <li>Retrieves the list of Peer IDs from Rooms within the same App space. <ol>
 *   <li><a href="#event_getPeersStateChange"><code>getPeersStateChange</code> event</a> triggers parameter
 *   payload <code>state</code> value as <code>ENQUIRED</code>.</li>
 *   <li>If received list from Signaling server successfully: <ol>
 *   <li><a href="#event_getPeersStateChange"><code>getPeersStateChange</code> event</a> triggers parameter
 *   payload <code>state</code> value as <code>RECEIVED</code>.</li></ol></li></ol>
 * @example
 *   // Example 1: Retrieving the un-privileged Peers
 *   skylinkDemo.joinRoom(function (jRError, jRSuccess) {
 *     if (jRError) return;
 *     skylinkDemo.getPeers(function (error, success) {
 *        if (error) return;
 *        console.log("The list of only un-privileged Peers in the same App space ->", success);
 *     });
 *   });
 *
 *   // Example 2: Retrieving the all Peers (privileged or un-privileged)
 *   skylinkDemo.joinRoom(function (jRError, jRSuccess) {
 *     if (jRError) return;
 *     skylinkDemo.getPeers(true, function (error, success) {
 *        if (error) return;
 *        console.log("The list of all Peers in the same App space ->", success);
 *     });
 *   });
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype.getPeers = function(showAll, callback){
	var self = this;
	if (!self._user.room.session.isPrivileged){
		log.warn('Please upgrade your key to privileged to use this function');
		return;
	}
	if (!self._options.appKey){
		log.warn('App key is not defined. Please authenticate again.');
		return;
	}

	// Only callback is provided
	if (typeof showAll === 'function'){
		callback = showAll;
		showAll = false;
	}

	self._socketSendMessage({
		type: self._SIG_MESSAGE_TYPE.GET_PEERS,
		showAll: showAll || false
	});

	self._trigger('getPeersStateChange',self.GET_PEERS_STATE.ENQUIRED, self._user.id, null);

	log.log('Enquired server for peers within the realm');

	if (typeof callback === 'function'){
		self.once('getPeersStateChange', function(state, privilegedPeerId, peerList){
			callback(null, peerList);
		}, function(state, privilegedPeerId, peerList){
			return state === self.GET_PEERS_STATE.RECEIVED;
		});
	}

};

/**
 * <blockquote class="info">
 *   Note that this feature requires <code>"isPrivileged"</code> flag to be enabled and
 *   <code>"autoIntroduce"</code> flag to be disabled for the App Key provided in the
 *   <a href="#method_init"><code>init()</code> method</a>, as only Users connecting using
 *   the App Key with this flag enabled (which we call privileged Users / Peers) can retrieve the list of
 *   Peer IDs from Rooms within the same App space.
 *   <a href="http://support.temasys.io/support/solutions/articles/12000012342-what-is-a-privileged-key-">
 *   Read more about privileged App Key feature here</a>.
 * </blockquote>
 * Function that selects and introduces a pair of Peers to start connection with each other.
 * @method introducePeer
 * @param {String} sendingPeerId The Peer ID to be connected with <code>receivingPeerId</code>.
 * @param {String} receivingPeerId The Peer ID to be connected with <code>sendingPeerId</code>.
 * @trigger <ol class="desc-seq">
 *   <li>If App Key provided in the <a href="#method_init"><code>init()</code> method</a> is not
 *   a Privileged enabled Key: <ol><li><b>ABORT</b> and return error.</li></ol></li>
 *   <li>Starts sending introduction request for the selected pair of Peers to the Signaling server. <ol>
 *   <li><a href="#event_introduceStateChange"><code>introduceStateChange</code> event</a> triggers parameter
 *   payload <code>state</code> value as <code>INTRODUCING</code>.</li>
 *   <li>If received errors from Signaling server: <ol>
 *   <li><a href="#event_introduceStateChange"><code>introduceStateChange</code> event</a> triggers parameter
 *   payload <code>state</code> value as <code>ERROR</code>.</li></ol></li></ol></li></ol>
 * @example
 *   // Example 1: Introduce a pair of Peers
 *   skylinkDemo.on("introduceStateChange", function (state, privilegedPeerId, sendingPeerId, receivingPeerId) {
 *	   if (state === skylinkDemo.INTRODUCE_STATE.INTRODUCING) {
 *       console.log("Peer '" + sendingPeerId + "' has been introduced to '" + receivingPeerId + "'");
 *     }
 *   });
 *
 *   skylinkDemo.joinRoom(function (jRError, jRSuccess) {
 *     if (jRError) return;
 *     skylinkDemo.getPeers(function (gPError, gPSuccess) {
 *        if (gPError) return;
 *        skylinkDemo.introducePeer(gPSuccess.roomName[0], gPSuccess.roomName[1]);
 *     });
 *   });
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype.introducePeer = function(sendingPeerId, receivingPeerId){
	var self = this;
	if (!self._user.room.session.isPrivileged){
		log.warn('Please upgrade your key to privileged to use this function');
		self._trigger('introduceStateChange', self.INTRODUCE_STATE.ERROR, self._user.id, sendingPeerId, receivingPeerId, 'notPrivileged');
		return;
	}
	self._socketSendMessage({
		type: self._SIG_MESSAGE_TYPE.INTRODUCE,
		sendingPeerId: sendingPeerId,
		receivingPeerId: receivingPeerId
	});
	self._trigger('introduceStateChange', self.INTRODUCE_STATE.INTRODUCING, self._user.id, sendingPeerId, receivingPeerId, null);
	log.log('Introducing',sendingPeerId,'to',receivingPeerId);
};


Skylink.prototype.SYSTEM_ACTION = {
  WARNING: 'warning',
  REJECT: 'reject'
};

/**
 * The list of Signaling server reaction states reason of action code during
 * <a href="#method_joinRoom"><code>joinRoom()</code> method</a>.
 * @attribute SYSTEM_ACTION_REASON
 * @param {String} CREDENTIALS_EXPIRED <small>Value <code>"oldTimeStamp"</code></small>
 *   The value of the reason code when Room session token has expired.
 *   <small>Happens during <a href="#method_joinRoom"><code>joinRoom()</code> method</a> request.</small>
 *   <small>Results with: <code>REJECT</code></small>
 * @param {String} CREDENTIALS_ERROR   <small>Value <code>"credentialError"</code></small>
 *   The value of the reason code when Room session token provided is invalid.
 *   <small>Happens during <a href="#method_joinRoom"><code>joinRoom()</code> method</a> request.</small>
 * @param {String} DUPLICATED_LOGIN    <small>Value <code>"duplicatedLogin"</code></small>
 *   The value of the reason code when Room session token has been used already.
 *   <small>Happens during <a href="#method_joinRoom"><code>joinRoom()</code> method</a> request.</small>
 *   <small>Results with: <code>REJECT</code></small>
 * @param {String} ROOM_NOT_STARTED    <small>Value <code>"notStart"</code></small>
 *   The value of the reason code when Room session has not started.
 *   <small>Happens during <a href="#method_joinRoom"><code>joinRoom()</code> method</a> request.</small>
 *   <small>Results with: <code>REJECT</code></small>
 * @param {String} EXPIRED             <small>Value <code>"expired"</code></small>
 *   The value of the reason code when Room session has ended already.
 *   <small>Happens during <a href="#method_joinRoom"><code>joinRoom()</code> method</a> request.</small>
 *   <small>Results with: <code>REJECT</code></small>
 * @param {String} ROOM_LOCKED         <small>Value <code>"locked"</code></small>
 *   The value of the reason code when Room is locked.
 *   <small>Happens during <a href="#method_joinRoom"><code>joinRoom()</code> method</a> request.</small>
 *   <small>Results with: <code>REJECT</code></small>
 * @param {String} FAST_MESSAGE        <small>Value <code>"fastmsg"</code></small>
 *    The value of the reason code when User is flooding socket messages to the Signaling server
 *    that is sent too quickly within less than a second interval.
 *    <small>Happens after Room session has started. This can be caused by various methods like
 *    <a href="#method_sendMessage"><code>sendMessage()</code> method</a>,
 *    <a href="#method_setUserData"><code>setUserData()</code> method</a>,
 *    <a href="#method_muteStream"><code>muteStream()</code> method</a>,
 *    <a href="#method_enableAudio"><code>enableAudio()</code> method</a>,
 *    <a href="#method_enableVideo"><code>enableVideo()</code> method</a>,
 *    <a href="#method_disableAudio"><code>disableAudio()</code> method</a> and
 *    <a href="#method_disableVideo"><code>disableVideo()</code> method</a></small>
 *    <small>Results with: <code>WARNING</code></small>
 * @param {String} ROOM_CLOSING        <small>Value <code>"toClose"</code></small>
 *    The value of the reason code when Room session is ending.
 *    <small>Happens after Room session has started. This serves as a prerequisite warning before
 *    <code>ROOM_CLOSED</code> occurs.</small>
 *    <small>Results with: <code>WARNING</code></small>
 * @param {String} ROOM_CLOSED         <small>Value <code>"roomclose"</code></small>
 *    The value of the reason code when Room session has just ended.
 *    <small>Happens after Room session has started.</small>
 *    <small>Results with: <code>REJECT</code></small>
 * @param {String} SERVER_ERROR        <small>Value <code>"serverError"</code></small>
 *    The value of the reason code when Room session fails to start due to some technical errors.
 *    <small>Happens during <a href="#method_joinRoom"><code>joinRoom()</code> method</a> request.</small>
 *    <small>Results with: <code>REJECT</code></small>
 * @param {String} KEY_ERROR           <small>Value <code>"keyFailed"</code></small>
 *    The value of the reason code when Room session fails to start due to some technical error pertaining to
 *    App Key initialization.
 *    <small>Happens during <a href="#method_joinRoom"><code>joinRoom()</code> method</a> request.</small>
 *    <small>Results with: <code>REJECT</code></small>
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype.SYSTEM_ACTION_REASON = {
  CREDENTIALS_EXPIRED: 'oldTimeStamp',
  CREDENTIALS_ERROR: 'credentialError',
  DUPLICATED_LOGIN: 'duplicatedLogin',
  ROOM_NOT_STARTED: 'notStart',
  EXPIRED: 'expired',
  ROOM_LOCKED: 'locked',
  FAST_MESSAGE: 'fastmsg',
  ROOM_CLOSING: 'toclose',
  ROOM_CLOSED: 'roomclose',
  SERVER_ERROR: 'serverError',
  KEY_ERROR: 'keyFailed'
};

/**
 * Function that starts the Room session.
 * @method joinRoom
 * @param {String} [room] The Room name.
 * - When not provided or is provided as an empty string, its value is the <code>options.defaultRoom</code>
 *   provided in the <a href="#method_init"><code>init()</code> method</a>.
 *   <small>Note that if you are using credentials based authentication, you cannot switch the Room
 *   that is not the same as the <code>options.defaultRoom</code> defined in the
 *   <a href="#method_init"><code>init()</code> method</a>.</small>
 * @param {JSON} [options] The Room session configuration options.
 * @param {JSON|String} [options.userData] The User custom data.
 *   <small>This can be set after Room session has started using the
 *   <a href="#method_setUserData"><code>setUserData()</code> method</a>.</small>
 * @param {Boolean} [options.useExactConstraints] The <a href="#method_getUserMedia"><code>getUserMedia()</code>
 *   method</a> <code>options.useExactConstraints</code> parameter settings.
 *   <small>See the <code>options.useExactConstraints</code> parameter in the
 *   <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a> for more information.</small>
 * @param {Boolean|JSON} [options.audio] The <a href="#method_getUserMedia"><code>getUserMedia()</code>
 *   method</a> <code>options.audio</code> parameter settings.
 *   <small>When value is defined as <code>true</code> or an object, <a href="#method_getUserMedia">
 *   <code>getUserMedia()</code> method</a> to be invoked to retrieve new Stream. If
 *   <code>options.video</code> is not defined, it will be defined as <code>false</code>.</small>
 *   <small>Object signature matches the <code>options.audio</code> parameter in the
 *   <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a>.</small>
 * @param {Boolean|JSON} [options.video] The <a href="#method_getUserMedia"><code>getUserMedia()</code>
 *   method</a> <code>options.video</code> parameter settings.
 *   <small>When value is defined as <code>true</code> or an object, <a href="#method_getUserMedia">
 *   <code>getUserMedia()</code> method</a> to be invoked to retrieve new Stream. If
 *   <code>options.audio</code> is not defined, it will be defined as <code>false</code>.</small>
 *   <small>Object signature matches the <code>options.video</code> parameter in the
 *   <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a>.</small>
 * @param {JSON} [options.bandwidth] <blockquote class="info">Note that this is currently not supported
 *   with Firefox browsers versions 48 and below as noted in an existing
 *   <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=976521#c21">bugzilla ticket here</a>.</blockquote>
 *   The configuration to set the maximum streaming bandwidth to send to Peers.
 * @param {Number} [options.bandwidth.audio] The maximum audio streaming bandwidth sent to Peers in kbps.
 *   <small>Recommended values are <code>50</code> to <code>200</code>. <code>50</code> is sufficient enough for
 *   an audio call. The higher you go if you want clearer audio and to be able to hear music streaming.</small>
 * @param {Number} [options.bandwidth.video] The maximum video streaming bandwidth sent to Peers.
 *   <small>Recommended values are <code>256</code>-<code>500</code> for 180p quality,
 *   <code>500</code>-<code>1024</code> for 360p quality, <code>1024</code>-<code>2048</code> for 720p quality
 *   and <code>2048</code>-<code>4096</code> for 1080p quality.</small>
 * @param {Number} [options.bandwidth.data] The maximum data streaming bandwidth sent to Peers.
 *   <small>This affects the P2P messaging in <a href="#method_sendP2PMessage"><code>sendP2PMessage()</code> method</a>,
 *   and data transfers in <a href="#method_sendBlobData"><code>sendBlobData()</code> method</a> and
 *   <a href="#method_sendURLData"><code>sendURLData()</code> method</a>.</small>
 * @param {JSON} [options.googleXBandwidth] <blockquote class="info">Note that this is an experimental configuration
 *   and may cause disruptions in connections or connectivity issues when toggled, or may not work depending on
 *   browser supports. Currently, this only toggles the video codec bandwidth configuration.</blockquote>
 *   The configuration to set the experimental google video streaming bandwidth sent to Peers.
 *   <small>Note that Peers may override the "receive from" streaming bandwidth depending on the Peers configuration.</small>
 * @param {Number} [options.googleXBandwidth.min] The minimum experimental google video streaming bandwidth sent to Peers.
 *   <small>This toggles the <code>"x-google-min-bitrate"</code> flag in the session description.</small>
 * @param {Number} [options.googleXBandwidth.max] The maximum experimental google video streaming bandwidth sent to Peers.
 *   <small>This toggles the <code>"x-google-max-bitrate"</code> flag in the session description.</small>
 * @param {Boolean} [options.manualGetUserMedia] The flag if <code>joinRoom()</code> should trigger
 *   <a href="#event_mediaAccessRequired"><code>mediaAccessRequired</code> event</a> in which the
 *   <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a> or
 *   <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a>
 *   must be retrieved as a requirement before Room session may begin.
 *   <small>This ignores the <code>options.audio</code> and <code>options.video</code> configuration.</small>
 *   <small>After 30 seconds without any Stream retrieved, this results in the `callback(error, ..)` result.</small>
 * @param {JSON} [options.sdpSettings] <blockquote class="info">
 *   Note that this is mainly used for debugging purposes and that it is an experimental flag, so
 *   it may cause disruptions in connections or connectivity issues when toggled. Note that it might not work
 *   with MCU enabled Peer connections or break MCU enabled Peer connections.</blockquote>
 *   The configuration to set the session description settings.
 * @param {JSON} [options.sdpSettings.connection] The configuration to set the session description connection settings.
 *   <small>Note that this configuration may disable the media streaming and these settings will be enabled for
 *   MCU server Peer connection regardless of the flags configured.</small>
 * @param {Boolean} [options.sdpSettings.connection.audio=true] The configuration to enable audio session description connection.
 * @param {Boolean} [options.sdpSettings.connection.video=true] The configuration to enable video session description connection.
 * @param {Boolean} [options.sdpSettings.connection.data=true] The configuration to enable Datachannel session description connection.
 * @param {JSON} [options.sdpSettings.direction] The configuration to set the session description connection direction
 *   to enable or disable uploading and downloading audio or video media streaming.
 *   <small>Note that this configuration does not prevent RTCP packets from being sent and received.</small>
 * @param {JSON} [options.sdpSettings.direction.audio] The configuration to set the session description
 *   connection direction for audio streaming.
 * @param {Boolean} [options.sdpSettings.direction.audio.send=true] The flag if uploading audio streaming
 *   should be enabled when available.
 * @param {Boolean} [options.sdpSettings.direction.audio.receive=true] The flag if downloading audio
 *   streaming should be enabled when available.
 * @param {JSON} [options.sdpSettings.direction.video] The configuration to set the session description
 *   connection direction for video streaming.
 * @param {Boolean} [options.sdpSettings.direction.video.send=true] The flag if uploading video streaming
 *   should be enabled when available.
 * @param {Boolean} [options.sdpSettings.direction.video.receive=true] The flag if downloading video streaming
 *   should be enabled when available.
 * @param {JSON|Boolean} [options.publishOnly] <blockquote class="info">
 *   For MCU enabled Peer connections, defining this flag would make Peer not know other Peers presence in the Room.<br>
 *   For non-MCU enable Peer connections, defining this flag would cause other Peers in the Room to
 *   not to send Stream to Peer, and overrides the config
 *   <code>options.sdpSettings.direction.audio.receive</code> value to <code>false</code>,
 *   <code>options.sdpSettings.direction.video.receive</code> value to <code>false</code>,
 *   <code>options.sdpSettings.direction.video.send</code> value to <code>true</code> and
 *   <code>options.sdpSettings.direction.audio.send</code> value to <code>true</code>.<br>
 *   Note that this feature is currently is beta, and for any enquiries on enabling and its support for MCU enabled
 *   Peer connections, please  contact <a href="http://support.temasys.io">our support portal</a>.</blockquote></blockquote>
 *   The config if Peer would publish only.
 * @param {String} [options.publishOnly.parentId] <blockquote class="info"><b>Deprecation Warning!</b>
 *   This property has been deprecated. Use <code>options.parentId</code> instead.
 *   </blockquote> The parent Peer ID to match to when Peer is connected.
 *   <small>This is useful for identification for users connecting the Room twice simultaneously for multi-streaming.</small>
 *   <small>If User Peer ID matches the parent Peer ID provided from Peer, User will not be connected to Peer.</small>
 * @param {String} [options.parentId] The parent Peer ID to match to when Peer is connected.
 *   <small>Note that configuring this value overrides the <code>options.publishOnly.parentId</code> value.</small>
 *   <small>This is useful for identification for users connecting the Room twice simultaneously for multi-streaming.</small>
 *   <small>If User Peer ID matches the parent Peer ID provided from Peer, User will not be connected to Peer.</small>
 * @param {Function} [callback] The callback function fired when request has completed.
 *   <small>Function parameters signature is <code>function (error, success)</code></small>
 *   <small>Function request completion is determined by the <a href="#event_peerJoined">
 *   <code>peerJoined</code> event</a> triggering <code>isSelf</code> parameter payload value as <code>true</code>
 *   for request success.</small>
 * @param {JSON} callback.error The error result in request.
 *   <small>Defined as <code>null</code> when there are no errors in request</small>
 * @param {Error|String} callback.error.error The error received when starting Room session has failed.
 * @param {Number} [callback.error.errorCode] The current <a href="#method_init"><code>init()</code> method</a> ready state.
 *   <small>Defined as <code>null</code> when no <a href="#method_init"><code>init()</code> method</a>
 *   has not been called due to invalid configuration.</small>
 *   [Rel: Skylink.READY_STATE_CHANGE]
 * @param {String} callback.error.room The Room name.
 * @param {JSON} callback.success The success result in request.
 *   <small>Defined as <code>null</code> when there are errors in request</small>
 * @param {String} callback.success.room The Room name.
 * @param {String} callback.success.peerId The User's Room session Peer ID.
 * @param {JSON} callback.success.peerInfo The User's current Room session information.
 *   <small>Object signature matches the <code>peerInfo</code> parameter payload received in the
 *   <a href="#event_peerJoined"><code>peerJoined</code> event</a>.</small>
 * @example
 *   // Example 1: Connecting to the default Room without Stream
 *   skylinkDemo.joinRoom(function (error, success) {
 *     if (error) return;
 *     console.log("User connected.");
 *   });
 *
 *   // Example 2: Connecting to Room "testxx" with Stream
 *   skylinkDemo.joinRoom("testxx", {
 *     audio: true,
 *     video: true
 *   }, function (error, success) {
 *     if (error) return;
 *     console.log("User connected with getUserMedia() Stream.")
 *   });
 *
 *   // Example 3: Connecting to default Room with Stream retrieved earlier
 *   skylinkDemo.getUserMedia(function (gUMError, gUMSuccess) {
 *     if (gUMError) return;
 *     skylinkDemo.joinRoom(function (error, success) {
 *       if (error) return;
 *       console.log("User connected with getUserMedia() Stream.");
 *     });
 *   });
 *
 *   // Example 4: Connecting to "testxx" Room with shareScreen() Stream retrieved manually
 *   skylinkDemo.on("mediaAccessRequired", function () {
 *     skylinkDemo.shareScreen(function (sSError, sSSuccess) {
 *       if (sSError) return;
 *     });
 *   });
 *
 *   skylinkDemo.joinRoom("testxx", {
 *     manualGetUserMedia: true
 *   }, function (error, success) {
 *     if (error) return;
 *     console.log("User connected with shareScreen() Stream.");
 *   });
 *
 *   // Example 5: Connecting to "testxx" Room with User custom data
 *   var data = { username: "myusername" };
 *   skylinkDemo.joinRoom("testxx", {
 *     userData: data
 *   }, function (error, success) {
 *     if (error) return;
 *     console.log("User connected with correct user data?", success.peerInfo.userData.username === data.username);
 *   });
 * @trigger <ol class="desc-seq">
 *   <li>If User is in a Room: <ol>
 *   <li>Invoke <a href="#method_leaveRoom"><code>leaveRoom()</code> method</a>
 *   to end current Room connection. <small>Invoked <a href="#method_leaveRoom"><code>leaveRoom()</code>
 *   method</a> <code>stopMediaOptions</code> parameter value will be <code>false</code>.</small>
 *   <small>Regardless of request errors, <code>joinRoom()</code> will still proceed.</small></li></ol></li>
 *   <li>Check if Room name provided matches the Room name of the currently retrieved Room session token. <ol>
 *   <li>If Room name does not matches: <ol>
 *   <li>Invoke <a href="#method_init"><code>init()</code> method</a> to retrieve new Room session token. <ol>
 *   <li>If request has errors: <ol><li><b>ABORT</b> and return error.</li></ol></li></ol></li></ol></li></ol></li>
 *   <li>Open a new socket connection to Signaling server. <ol><li>If Socket connection fails: <ol>
 *   <li><a href="#event_socketError"><code>socketError</code> event</a> triggers parameter payload
 *   <code>errorCode</code> as <code>CONNECTION_FAILED</code>. <ol>
 *   <li>Checks if there are fallback ports and transports to use. <ol>
 *   <li>If there are still fallback ports and transports: <ol>
 *   <li>Attempts to retry socket connection to Signaling server. <ol>
 *   <li><a href="#event_channelRetry"><code>channelRetry</code> event</a> triggers.</li>
 *   <li><a href="#event_socketError"><code>socketError</code> event</a> triggers parameter
 *   payload <code>errorCode</code> as <code>RECONNECTION_ATTEMPT</code>.</li>
 *   <li>If attempt to retry socket connection to Signaling server has failed: <ol>
 *   <li><a href="#event_socketError"><code>socketError</code> event</a> triggers parameter payload
 *   <code>errorCode</code> as <code>RECONNECTION_FAILED</code>.</li>
 *   <li>Checks if there are still any more fallback ports and transports to use. <ol>
 *   <li>If there are is no more fallback ports and transports to use: <ol>
 *   <li><a href="#event_socketError"><code>socketError</code> event</a> triggers
 *   parameter payload <code>errorCode</code> as <code>RECONNECTION_ABORTED</code>.</li>
 *   <li><b>ABORT</b> and return error.</li></ol></li><li>Else: <ol><li><b>REPEAT</b> attempt to retry socket connection
 *   to Signaling server step.</li></ol></li></ol></li></ol></li></ol></li></ol></li><li>Else: <ol>
 *   <li><a href="#event_socketError"><code>socketError</code> event</a> triggers
 *   parameter payload <code>errorCode</code> as <code>CONNECTION_ABORTED</code>.</li>
 *   <li><b>ABORT</b> and return error.</li></ol></li></ol></li></ol></li></ol></li>
 *   <li>If socket connection to Signaling server has opened: <ol>
 *   <li><a href="#event_channelOpen"><code>channelOpen</code> event</a> triggers.</li></ol></li></ol></li>
 *   <li>Checks if there is <code>options.manualGetUserMedia</code> requested <ol><li>If it is requested: <ol>
 *   <li><a href="#event_mediaAccessRequired"><code>mediaAccessRequired</code> event</a> triggers.</li>
 *   <li>If more than 30 seconds has passed and no <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a>
 *   or <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a>
 *   has been retrieved: <ol><li><b>ABORT</b> and return error.</li></ol></li></ol></li><li>Else: <ol>
 *   <li>If there is <code>options.audio</code> or <code>options.video</code> requested: <ol>
 *   <li>Invoke <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a>. <ol>
 *   <li>If request has errors: <ol><li><b>ABORT</b> and return error.</li></ol></li></ol></li></ol></li></ol></li>
 *   </ol></li><li>Starts the Room session <ol><li>If Room session has started successfully: <ol>
 *   <li><a href="#event_peerJoined"><code>peerJoined</code> event</a> triggers parameter payload
 *   <code>isSelf</code> value as <code>true</code>.</li>
 *   <li>If MCU is enabled for the App Key provided in <a href="#method_init"><code>init()</code>
 *   method</a> and connected: <ol><li><a href="#event_serverPeerJoined"><code>serverPeerJoined</code>
 *   event</a> triggers <code>serverPeerType</code> as <code>MCU</code>. <small>MCU has
 *   to be present in the Room in order for Peer connections to commence.</small></li>
 *   <li>Checks for any available Stream <ol>
 *   <li>If <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a> is available: <ol>
 *   <li><a href="#event_incomingStream"><code>incomingStream</code> event</a>
 *   triggers parameter payload <code>isSelf</code> value as <code>true</code> and <code>stream</code>
 *   as <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a>.
 *   <small>User will be sending <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a>
 *   to Peers.</small></li></ol></li>
 *   <li>Else if <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a> is available: <ol>
 *   <li><a href="#event_incomingStream"><code>incomingStream</code> event</a> triggers parameter
 *   payload <code>isSelf</code> value as <code>true</code> and <code>stream</code> as
 *   <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a>.
 *   <small>User will be sending <code>getUserMedia()</code> Stream to Peers.</small></li></ol></li><li>Else: <ol>
 *   <li>No Stream will be sent.</li></ol></li></ol></li></ol></li></ol></li><li>Else: <ol>
 *   <li><a href="#event_systemAction"><code>systemAction</code> event</a> triggers
 *   parameter payload <code>action</code> as <code>REJECT</code>.</li>
 *   <li><b>ABORT</b> and return error.</li></ol></li></ol></li></ol>
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.joinRoom = function(room, options, callback) {
  var self = this;

  // Parse joinRoom() options
  // --> joinRoom (function () {})
  if (typeof room === 'function') {
    callback = room;
    room = undefined;
  // --> joinRoom ({})
  } else if (room && typeof room === 'object') {
    options = room;
    room = undefined;
  }

  // --> joinRoom (.., function () {})
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }

  // Check if room name provided is correct
  if (room === null || ['number', 'boolean'].indexOf(typeof room) > -1) {
    return self._joinRoomCallback({
      error: new Error('Invalid room name is provided'),
      room: room
    }, callback);
  }

  // Check if options provided is correct
  if (options === null || ['number', 'boolean'].indexOf(typeof options) > -1) {
    return self._joinRoomCallback({
      error: new Error('Invalid mediaOptions is provided'),
      room: room
    }, callback);
  }

  options = options || {};

  // Disconnect any User session
  // Disconnect media streams if new streams is requested
  self.leaveRoom(options && (options.audio || typeof options.audio === 'boolean') ||
    (options.video || typeof options.video === 'boolean'), function () {
    // Fallback to default Room if needed
    var updatedRoom = self._options.credentials || !(room && typeof room === 'string') ?
      self._options.defaultRoom : room;

    // Fetch new session data
    self._initFetchAPIData(updatedRoom, function (authErr) {
      if (authErr) {
        return self._joinRoomCallback({
          error: err.error,
          room: updatedRoom
        }, callback);
      }

      // Connect to Signaling server
      self._socketOpen(function (socketErr) {
        if (socketErr) {
          return self._joinRoomCallback({
            error: new Error('Failed opening Signaling server connection'),
            room: updatedRoom
          }, callback);
        }

        self._user.data = typeof options.userData !== undefined ? options.userData : '';
        self._user.connection = {
          mediaConnection: { audio: true, video: true, data: true },
          mediaDirection: {
            audio: { send: true, receive: true },
            video: { send: true, receive: true }
          },
          bandwidth: {
            max: {},
            xVideoCodec: {}
          }
        };

        // Parse options.bandwidth
        if (options.bandwidth && typeof options.bandwidth === 'object') {
          // Parse options.bandwidth.audio
          if (typeof options.bandwidth.audio === 'number') {
            self._user.connection.bandwidth.max.audio = options.bandwidth.audio;
          }
          // Parse options.bandwidth.video
          if (typeof options.bandwidth.video === 'number') {
            self._user.connection.bandwidth.max.video = options.bandwidth.video;
          }
          // Parse options.bandwidth.data
          if (typeof options.bandwidth.data === 'number') {
            self._user.connection.bandwidth.max.data = options.bandwidth.data;
          }
        }

        // Parse options.googleXBandwidth
        if (options.googleXBandwidth && typeof options.googleXBandwidth === 'object') {
          // Parse options.googleXBandwidth.min
          if (typeof options.googleXBandwidth.min === 'number') {
            self._user.connection.bandwidth.xVideoCodec.min = options.googleXBandwidth.min;
          }
          // Parse options.googleXBandwidth.max
          if (typeof mediaOptions.googleXBandwidth.max === 'number') {
            self._user.connection.bandwidth.xVideoCodec.max = options.googleXBandwidth.max;
          }
        }

        // Parse options.sdpSettings
        if (options.sdpSettings && typeof options.sdpSettings === 'object') {
          // Parse options.sdpSettings.direction
          if (options.sdpSettings.direction && typeof options.sdpSettings.direction === 'object') {
            // Parse options.sdpSettings.direction.audio
            if (options.sdpSettings.direction.audio) {
              // Parse options.sdpSettings.direction.audio.receive
              self._user.connection.mediaDirection.audio.receive = options.sdpSettings.direction.audio.receive !== false;
              // Parse options.sdpSettings.direction.audio.send
              self._user.connection.mediaDirection.audio.send = options.sdpSettings.direction.audio.send !== false;
            }
            // Parse options.sdpSettings.direction.video
            if (options.sdpSettings.direction.video) {
              // Parse options.sdpSettings.direction.video.receive
              self._user.connection.mediaDirection.video.receive = options.sdpSettings.direction.video.receive !== false;
              // Parse options.sdpSettings.direction.video.send
              self._user.connection.mediaDirection.video.send = options.sdpSettings.direction.video.send !== false;
            }
          }
          // Parse options.sdpSettings.connection
          if (options.sdpSettings.connection && typeof options.sdpSettings.connection === 'object') {
            // Parse options.sdpSettings.connection.audio
            self._user.connection.mediaConnection.audio = options.sdpSettings.connection.audio !== false;
            // Parse options.sdpSettings.connection.video
            self._user.connection.mediaConnection.video = options.sdpSettings.connection.video !== false;
            // Parse options.sdpSettings.connection.data
            self._user.connection.mediaConnection.data = options.sdpSettings.connection.data !== false;
          }
        }

        // Parse options.publishOnly
        if (options.publishOnly && (typeof options.publishOnly === 'object' || options.publishOnly === true)) {
          self._user.connection.publishOnly = true;
          // Override settings
          self._user.connection.mediaDirection.audio.send = true;
          self._user.connection.mediaDirection.audio.receive = false;
          self._user.connection.mediaDirection.video.send = true;
          self._user.connection.mediaDirection.video.receive = false;
          // Parse options.publishOnly.parentId (deprecated way of setting parent ID)
          if (typeof options.publishOnly === 'object' && options.publishOnly.parentId &&
            typeof options.publishOnly.parentId === 'string') {
            self._user.parentId = options.publishOnly.parentId;
          }
        }

        // Parse options.parentId
        if (options.parentId && typeof options.parentId === 'string') {
          self._user.parentId = options.parentId;
        }

        // Handle options.manualGetUserMedia case
        if (options.manualGetUserMedia === true) {
          self._trigger('mediaAccessRequired');
          // Set an interval to wait for User to obtain stream to start connection
          var currentBlock = 0;
          var requireStreamInterval = setInterval(function () {
            // Check if Stream has been retrieved
            if (self._streams.userMedia.stream || self._streams.userMedia.screenshare) {
              clearInterval(requireStreamInterval);
              self._joinRoomCallback({ startConnection: true });
            // Check if timeout limit has been reached
            } else if (currentBlock === 600) {
              clearInterval(requireStreamInterval);
              self.once('mediaAccessError', function (error) {
                self._joinRoomCallback({
                  error: error
                }, callback);
              });
              self._onUserMediaError(new Error('Waiting for stream timeout'), false, false);
            }
            // Increment counter
            currentBlock++;
          }, 50);

        // Handle options.audio or options.video case
        } else if ((options.audio && (options.audio === true || typeof options.audio === 'object')) ||
          (options.video && (options.video === true || typeof options.video === 'object'))) {
          self.getUserMedia(options, function (err) {
            if (err) {
              return self._joinRoomCallback({
                error: err
              }, callback);
            }
            self._joinRoomCallback({ startConnection: true });
          });

        // Handle none of the above
        } else {
          self._joinRoomCallback({ startConnection: true });
        }
      });
    });
  });
};

/**
 * <blockquote class="info">
 *   Note that this method will close any existing socket channel connection despite not being in the Room.
 * </blockquote>
 * Function that stops Room session.
 * @method leaveRoom
 * @param {Boolean|JSON} [stopMediaOptions=true] The flag if <code>leaveRoom()</code>
 *   should stop both <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a>
 *   and <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a>.
 * - When provided as a boolean, this sets both <code>stopMediaOptions.userMedia</code>
 *   and <code>stopMediaOptions.screenshare</code> to its boolean value.
 * @param {Boolean} [stopMediaOptions.userMedia=true] The flag if <code>leaveRoom()</code>
 *   should stop <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a>.
 *   <small>This invokes <a href="#method_stopStream"><code>stopStream()</code> method</a>.</small>
 * @param {Boolean} [stopMediaOptions.screenshare=true] The flag if <code>leaveRoom()</code>
 *   should stop <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a>.
 *   <small>This invokes <a href="#method_stopScreen"><code>stopScreen()</code> method</a>.</small>
 * @param {Function} [callback] The callback function fired when request has completed.
 *   <small>Function parameters signature is <code>function (error, success)</code></small>
 *   <small>Function request completion is determined by the <a href="#event_peerLeft">
 *   <code>peerLeft</code> event</a> triggering <code>isSelf</code> parameter payload value as <code>true</code>
 *   for request success.</small>
 * @param {Error|String} callback.error The error result in request.
 *   <small>Defined as <code>null</code> when there are no errors in request</small>
 *   <small>Object signature is the <code>leaveRoom()</code> error when stopping Room session.</small>
 * @param {JSON} callback.success The success result in request.
 *   <small>Defined as <code>null</code> when there are errors in request</small>
 * @param {String} callback.success.peerId The User's Room session Peer ID.
 * @param {String} callback.success.previousRoom The Room name.
 * @trigger <ol class="desc-seq">
 *   <li>If Socket connection is opened: <ol><li><a href="#event_channelClose"><code>channelClose</code> event</a> triggers.</li></ol></li>
 *   <li>Checks if User is in Room. <ol><li>If User is not in a Room: <ol><li><b>ABORT</b> and return error.</li>
 *   </ol></li><li>Else: <ol><li>If parameter <code>stopMediaOptions.userMedia</code> value is <code>true</code>: <ol>
 *   <li>Invoke <a href="#method_stopStream"><code>stopStream()</code> method</a>.
 *   <small>Regardless of request errors, <code>leaveRoom()</code> will still proceed.</small></li></ol></li>
 *   <li>If parameter <code>stopMediaOptions.screenshare</code> value is <code>true</code>: <ol>
 *   <li>Invoke <a href="#method_stopScreen"><code>stopScreen()</code> method</a>.
 *   <small>Regardless of request errors, <code>leaveRoom()</code> will still proceed.</small></li></ol></li>
 *   <li><a href="#event_peerLeft"><code>peerLeft</code> event</a> triggers for User and all connected Peers in Room.</li>
 *   <li>If MCU is enabled for the App Key provided in <a href="#method_init"><code>init()</code> method</a>
 *   and connected: <ol><li><a href="#event_serverPeerLeft"><code>serverPeerLeft</code> event</a>
 *   triggers parameter payload <code>serverPeerType</code> as <code>MCU</code>.</li></ol></li></ol></li></ol></li></ol>
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.leaveRoom = function(stopOptions, callback) {
  var self = this;
  var currentRoom = self._user.room.name;
  var currentPeerId = self._user.id;
  var stopMedia = { userMedia: true, screenshare: true };
  var isConnected = self._user.room.connected === true;

  // Parse leaveRoom() options
  // --> leaveRoom(false)
  if (typeof stopOptions === 'boolean') {
    if (stopOptions === false) {
      stopMedia.userMedia = false;
      stopMedia.screenshare = false;
    }
  // --> leaveRoom({})
  } else if (stopOptions && typeof stopOptions === 'object') {
    // Parse stopOptions.userMedia
    stopMedia.userMedia = stopOptions.userMedia !== false;
    // Parse stopOptions.screenshare
    stopMedia.screenshare = stopOptions.screenshare !== false;
  // --> leaveRoom(function () {})
  } else if (typeof stopOptions === 'function') {
    callback = stopOptions;
  }

  for (var peerId in self._peerInformations) {
    if (self._peerInformations.hasOwnProperty(peerId)) {
      if (self._peerInformations[peerId]) {
        self._removePeer(peerId);
      }
      delete self._peerInformations[peerId];
    }
  }

  self._user.room.connected = false;
  self._socketClose();

  // Trigger error that User is not in the Room so it's not completely successful
  if (!isConnected || !currentPeerId || !currentRoom) {
    return self._leaveRoomCallback({
      error: 'Unable to leave room as user is not in any room'
    }, callback);
  }

  // Stop User Streams
  if (stopMedia.userMedia || stopMedia.screenshare) {
    self._stopStreams(stopMedia);
  }

  // Trigger `peerLeft` event for User
  self._trigger('peerLeft', currentPeerId, self.getPeerInfo(), true);
  self._leaveRoomCallback({}, callback);
};

/**
 * <blockquote class="info">
 *   Note that broadcasted events from <a href="#method_muteStream"><code>muteStream()</code> method</a>,
 *   <a href="#method_stopStream"><code>stopStream()</code> method</a>,
 *   <a href="#method_stopScreen"><code>stopScreen()</code> method</a>,
 *   <a href="#method_sendMessage"><code>sendMessage()</code> method</a>,
 *   <a href="#method_unlockRoom"><code>unlockRoom()</code> method</a> and
 *   <a href="#method_lockRoom"><code>lockRoom()</code> method</a> may be queued when
 *   sent within less than an interval.
 * </blockquote>
 * Function that locks the current Room when in session to prevent other Peers from joining the Room.
 * @method lockRoom
 * @trigger <ol class="desc-seq">
 *   <li>Requests to Signaling server to lock Room <ol>
 *   <li><a href="#event_roomLock"><code>roomLock</code> event</a> triggers parameter payload
 *   <code>isLocked</code> value as <code>true</code>.</li></ol></li></ol>
 * @for Skylink
 * @since 0.5.0
 */
Skylink.prototype.lockRoom = function() {
  var self = this;

  if (!self._user.room.connected) {
    log.error('Unable to lock Room as User is not in Room.');
    return;
  }

  log.log('Locking Room ...');

  self._socketSendMessage({
    type: 'roomLockEvent',
    mid: self._user.id,
    rid: self._user.room.session.rid,
    lock: true
  });

  self._user.room.locked = true;
  self._trigger('roomLock', true, self._user.id, self.getPeerInfo(), true);
};

/**
 * <blockquote class="info">
 *   Note that broadcasted events from <a href="#method_muteStream"><code>muteStream()</code> method</a>,
 *   <a href="#method_stopStream"><code>stopStream()</code> method</a>,
 *   <a href="#method_stopScreen"><code>stopScreen()</code> method</a>,
 *   <a href="#method_sendMessage"><code>sendMessage()</code> method</a>,
 *   <a href="#method_unlockRoom"><code>unlockRoom()</code> method</a> and
 *   <a href="#method_lockRoom"><code>lockRoom()</code> method</a> may be queued when
 *   sent within less than an interval.
 * </blockquote>
 * Function that unlocks the current Room when in session to allow other Peers to join the Room.
 * @method unlockRoom
 * @trigger <ol class="desc-seq">
 *   <li>Requests to Signaling server to unlock Room <ol>
 *   <li><a href="#event_roomLock"><code>roomLock</code> event</a> triggers parameter payload
 *   <code>isLocked</code> value as <code>false</code>.</li></ol></li></ol>
 * @for Skylink
 * @since 0.5.0
 */
Skylink.prototype.unlockRoom = function() {
  if (!self._user.room.connected) {
    log.error('Unable to unlock Room as User is not in Room.');
    return;
  }

  log.log('Unlocking Room ...');

  self._socketSendMessage({
    type: 'roomLockEvent',
    mid: self._user.id,
    rid: self._user.room.session.rid,
    lock: false
  });

  self._user.room.locked = false;
  self._trigger('roomLock', false, self._user.id, self.getPeerInfo(), true);
};

/**
 * Function that handles `joinRoom()` async callbacks to proceed to the next step.
 * @method _joinRoomCallback
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._joinRoomCallback = function (result, callback) {
  var self = this;

  // joinRoom() start connection
  if (result.startConnection) {
    self.once('peerJoined', function (peerId, peerInfo) {
      self._joinRoomCallback({ peerId: peerId, room: peerInfo.room });
    });

    self._socketSendMessage({
      type: 'joinRoom',
      uid: self._user.room.session.uid,
      cid: self._user.room.session.cid,
      rid: self._user.room.session.rid,
      userCred: self._user.room.session.userCred,
      timeStamp: self._user.room.session.timeStamp,
      apiOwner: self._user.room.session.apiOwner,
      roomCred: self._user.room.session.roomCred,
      start: self._user.room.session.start,
      len: self._user.room.session.len,
      isPrivileged: self._user.room.session.isPrivileged === true, // Default to false if undefined
      autoIntroduce: self._user.room.session.autoIntroduce !== false, // Default to true if undefined
      key: self._options.appKey
    });

  // joinRoom() result success
  } else if (result.error) {
    log.error('joinRoom() failed ->', result);

    if (typeof callback === 'function') {
      callback({
        error: new Error(result.error),
        errorCode: result.errorCode || null,
        room: result.room
      }, null);
    }

  // joinRoom() result error
  } else {
    log.info('joinRoom() success ->', result);

    if (typeof callback === 'function') {
      callback(null, {
        peerId: result.peerId,
        room: result.room,
        peerInfo: self.getPeerInfo()
      });
    }
  }
};

/**
 * Function that handles `leaveRoom()` async callbacks to proceed to the next step.
 * @method _leaveRoomCallback
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._leaveRoomCallback = function (result, callback) {
  var self = this;

  // leaveRoom() result success
  if (result.error) {
    log.error('leaveRoom() failed ->', result);

    if (typeof callback === 'function') {
      callback(new Error(result.error), null);
    }

  // leaveRoom() result success
  } else {
    log.info('leaveRoom() success ->', result);

    if (typeof callback === 'function') {
      callback(null, {
        peerId: result.peerId,
        previousRoom: result.room
      });
    }
  }
};

Skylink.prototype.VERSION = '0.6.17';

/**
 * The list of <a href="#method_init"><code>init()</code> method</a> ready states.
 * @attribute READY_STATE_CHANGE
 * @param {Number} INIT      <small>Value <code>0</code></small>
 *   The value of the state when <code>init()</code> has just started.
 * @param {Number} LOADING   <small>Value <code>1</code></small>
 *   The value of the state when <code>init()</code> is authenticating App Key provided
 *   (and with credentials if provided as well) with the Auth server.
 * @param {Number} COMPLETED <small>Value <code>2</code></small>
 *   The value of the state when <code>init()</code> has successfully authenticated with the Auth server.
 *   Room session token is generated for joining the <code>defaultRoom</code> provided in <code>init()</code>.
 *   <small>Room session token has to be generated each time User switches to a different Room
 *   in <a href="#method_joinRoom"><code>joinRoom()</code> method</a>.</small>
 * @param {Number} ERROR     <small>Value <code>-1</code></small>
 *   The value of the state when <code>init()</code> has failed authenticating with the Auth server.
 *   [Rel: Skylink.READY_STATE_CHANGE_ERROR]
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype.READY_STATE_CHANGE = {
  INIT: 0,
  LOADING: 1,
  COMPLETED: 2,
  ERROR: -1
};

/**
 * The list of <a href="#method_init"><code>init()</code> method</a> ready state failure codes.
 * @attribute READY_STATE_CHANGE_ERROR
 * @param {Number} API_INVALID                 <small>Value <code>4001</code></small>
 *   The value of the failure code when provided App Key in <code>init()</code> does not exists.
 *   <small>To resolve this, check that the provided App Key exists in
 *   <a href="https://console.temasys.io">the Temasys Console</a>.</small>
 * @param {Number} API_DOMAIN_NOT_MATCH        <small>Value <code>4002</code></small>
 *   The value of the failure code when <code>"domainName"</code> property in the App Key does not
 *   match the accessing server IP address.
 *   <small>To resolve this, contact our <a href="http://support.temasys.io">support portal</a>.</small>
 * @param {Number} API_CORS_DOMAIN_NOT_MATCH   <small>Value <code>4003</code></small>
 *   The value of the failure code when <code>"corsurl"</code> property in the App Key does not match accessing CORS.
 *   <small>To resolve this, configure the App Key CORS in
 *   <a href="https://console.temasys.io">the Temasys Console</a>.</small>
 * @param {Number} API_CREDENTIALS_INVALID     <small>Value <code>4004</code></small>
 *   The value of the failure code when there is no [CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
 *   present in the HTTP headers during the request to the Auth server present nor
 *   <code>options.credentials.credentials</code> configuration provided in the <code>init()</code>.
 *   <small>To resolve this, ensure that CORS are present in the HTTP headers during the request to the Auth server.</small>
 * @param {Number} API_CREDENTIALS_NOT_MATCH   <small>Value <code>4005</code></small>
 *   The value of the failure code when the <code>options.credentials.credentials</code> configuration provided in the
 *   <code>init()</code> does not match up with the <code>options.credentials.startDateTime</code>,
 *   <code>options.credentials.duration</code> or that the <code>"secret"</code> used to generate
 *   <code>options.credentials.credentials</code> does not match the App Key's <code>"secret</code> property provided.
 *   <small>To resolve this, check that the <code>options.credentials.credentials</code> is generated correctly and
 *   that the <code>"secret"</code> used to generate it is from the App Key provided in the <code>init()</code>.</small>
 * @param {Number} API_INVALID_PARENT_KEY      <small>Value <code>4006</code></small>
 *   The value of the failure code when the App Key provided does not belong to any existing App.
 *   <small>To resolve this, check that the provided App Key exists in
 *   <a href="https://console.temasys.io">the Developer Console</a>.</small>
 * @param {Number} API_NO_MEETING_RECORD_FOUND <small>Value <code>4010</code></small>
 *   The value of the failure code when provided <code>options.credentials</code>
 *   does not match any scheduled meetings available for the "Persistent Room" enabled App Key provided.
 *   <small>See the <a href="http://support.temasys.io/support/solutions/articles/
 * 12000002811-using-the-persistent-room-feature-to-configure-meetings">Persistent Room article</a> to learn more.</small>
 * @param {Number} API_OVER_SEAT_LIMIT         <small>Value <code>4020</code></small>
 *   The value of the failure code when App Key has reached its current concurrent users limit.
 *   <small>To resolve this, use another App Key. To create App Keys dynamically, see the
 *   <a href="https://temasys.atlassian.net/wiki/display/TPD/SkylinkAPI+-+Application+Resources">Application REST API
 *   docs</a> for more information.</small>
 * @param {Number} API_RETRIEVAL_FAILED        <small>Value <code>4021</code></small>
 *   The value of the failure code when App Key retrieval of authentication token fails.
 *   <small>If this happens frequently, contact our <a href="http://support.temasys.io">support portal</a>.</small>
 * @param {Number} API_WRONG_ACCESS_DOMAIN     <small>Value <code>5005</code></small>
 *   The value of the failure code when App Key makes request to the incorrect Auth server.
 *   <small>To resolve this, ensure that the <code>roomServer</code> is not configured. If this persists even without
 *   <code>roomServer</code> configuration, contact our <a href="http://support.temasys.io">support portal</a>.</small>
 * @param {Number} XML_HTTP_REQUEST_ERROR      <small>Value <code>-1</code></small>
 *   The value of the failure code when requesting to Auth server has timed out.
 * @param {Number} NO_SOCKET_IO                <small>Value <code>1</code></small>
 *   The value of the failure code when dependency <a href="http://socket.io/download/">Socket.IO client</a> is not loaded.
 *   <small>To resolve this, ensure that the Socket.IO client dependency is loaded before the Skylink SDK.
 *   You may use the provided Socket.IO client <a href="http://socket.io/download/">CDN here</a>.</small>
 * @param {Number} NO_XMLHTTPREQUEST_SUPPORT   <small>Value <code>2</code></small>
 *   The value of the failure code when <a href="https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest">
 *   XMLHttpRequest API</a> required to make request to Auth server is not supported.
 *   <small>To resolve this, display in the Web UI to ask clients to switch to the list of supported browser
 *   as <a href="https://github.com/Temasys/SkylinkJS/tree/0.6.14#supported-browsers">listed in here</a>.</small>
 * @param {Number} NO_WEBRTC_SUPPORT           <small>Value <code>3</code></small>
 *   The value of the failure code when <a href="https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/">
 *   RTCPeerConnection API</a> required for Peer connections is not supported.
 *   <small>To resolve this, display in the Web UI to ask clients to switch to the list of supported browser
 *   as <a href="https://github.com/Temasys/SkylinkJS/tree/0.6.14#supported-browsers">listed in here</a>.
 *   For <a href="http://confluence.temasys.com.sg/display/TWPP">plugin supported browsers</a>, if the clients
 *   does not have the plugin installed, there will be an installation toolbar that will prompt for installation
 *   to support the RTCPeerConnection API.</small>
 * @param {Number} NO_PATH                     <small>Value <code>4</code></small>
 *   The value of the failure code when provided <code>init()</code> configuration has errors.
 * @param {Number} ADAPTER_NO_LOADED           <small>Value <code>7</code></small>
 *   The value of the failure code when dependency <a href="https://github.com/Temasys/AdapterJS/">AdapterJS</a>
 *   is not loaded.
 *   <small>To resolve this, ensure that the AdapterJS dependency is loaded before the Skylink dependency.
 *   You may use the provided AdapterJS <a href="https://github.com/Temasys/AdapterJS/">CDN here</a>.</small>
 * @param {Number} PARSE_CODECS                <small>Value <code>8</code></small>
 *   The value of the failure code when codecs support cannot be parsed and retrieved.
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.4.0
 */
Skylink.prototype.READY_STATE_CHANGE_ERROR = {
  API_INVALID: 4001,
  API_DOMAIN_NOT_MATCH: 4002,
  API_CORS_DOMAIN_NOT_MATCH: 4003,
  API_CREDENTIALS_INVALID: 4004,
  API_CREDENTIALS_NOT_MATCH: 4005,
  API_INVALID_PARENT_KEY: 4006,
  API_NO_MEETING_RECORD_FOUND: 4010,
  API_OVER_SEAT_LIMIT: 4020,
  API_RETRIEVAL_FAILED: 4021,
  API_WRONG_ACCESS_DOMAIN: 5005,
  XML_HTTP_REQUEST_ERROR: -1,
  NO_SOCKET_IO: 1,
  NO_XMLHTTPREQUEST_SUPPORT: 2,
  NO_WEBRTC_SUPPORT: 3,
  NO_PATH: 4,
  ADAPTER_NO_LOADED: 7,
  PARSE_CODECS: 8
};

/**
 * Spoofs the REGIONAL_SERVER to prevent errors on deployed apps except the fact this no longer works.
 * Automatic regional selection has already been implemented hence REGIONAL_SERVER is no longer useful.
 * @attribute REGIONAL_SERVER
 * @type JSON
 * @readOnly
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype.REGIONAL_SERVER = {
  APAC1: '',
  US1: ''
};

/**
 * Function that generates an <a href="https://en.wikipedia.org/wiki/Universally_unique_identifier">UUID</a> (Unique ID).
 * @method generateUUID
 * @return {String} Returns a generated UUID (Unique ID).
 * @for Skylink
 * @since 0.5.9
 */
/* jshint ignore:start */
Skylink.prototype.generateUUID = function() {
  var d = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === 'x' ? r : (r && 0x7 | 0x8)).toString(16);
  });
  return uuid;
};
/* jshint ignore:end */

/**
 * Function that authenticates and initialises App Key used for Room connections.
 * @method init
 * @param {JSON|String} options The configuration options.
 * - When provided as a string, it's configured as <code>options.appKey</code>.
 * @param {String} options.appKey The App Key.
 *   <small>By default, <code>init()</code> uses [HTTP CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
 *   authentication. For credentials based authentication, see the <code>options.credentials</code> configuration
 *   below. You can know more about the <a href="http://support.temasys.io/support/solutions/articles/
 * 12000002712-authenticating-your-application-key-to-start-a-connection">in the authentication methods article here</a>
 *   for more details on the various authentication methods.</small>
 *   <small>If you are using the Persistent Room feature for scheduled meetings, you will require to
 *   use the credential based authentication. See the <a href="http://support.temasys.io/support
 * /solutions/articles/12000002811-using-the-persistent-room-feature-to-configure-meetings">Persistent Room article here
 *   </a> for more information.</small>
 * @param {String} [options.defaultRoom] The default Room to connect to when no <code>room</code> parameter
 *    is provided in  <a href="#method_joinRoom"><code>joinRoom()</code> method</a>.
 * - When not provided or is provided as an empty string, its value is <code>options.appKey</code>.
 *   <small>Note that switching Rooms is not available when using <code>options.credentials</code> based authentication.
 *   The Room that User will be connected to is the <code>defaultRoom</code> provided.</small>
 * @param {String} [options.roomServer] The Auth server.
 * <small>Note that this is a debugging feature and is only used when instructed for debugging purposes.</small>
 * @param {Boolean} [options.enableIceTrickle=true] The flag if Peer connections should
 *   trickle ICE for faster connectivity.
 * @param {Boolean} [options.enableDataChannel=true] <blockquote class="info">
 *   Note that for Edge browsers, this value is overriden as <code>false</code> due to its supports.
 *   </blockquote> The flag if Datachannel connections should be enabled.
 *   <small>This is required to be enabled for <a href="#method_sendBlobData"><code>sendBlobData()</code> method</a>,
 *   <a href="#method_sendURLData"><code>sendURLData()</code> method</a> and
 *   <a href="#method_sendP2PMessage"><code>sendP2PMessage()</code> method</a>.</small>
 * @param {Boolean} [options.enableTURNServer=true] The flag if TURN ICE servers should
 *   be used when constructing Peer connections to allow TURN connections when required and enabled for the App Key.
 * @param {Boolean} [options.enableSTUNServer=true] <blockquote class="info">
 *   Note that for Edge browsers, this value is overriden as <code>false</code> due to its supports.
 *   </blockquote> The flag if STUN ICE servers should
 *   be used when constructing Peer connections to allow TURN connections when required.
 * @param {Boolean} [options.forceTURN=false] The flag if Peer connections should enforce
 *   connections over the TURN server.
 *   <small>This overrides <code>options.enableTURNServer</code> value to <code>true</code> and
 *   <code>options.enableSTUNServer</code> value to <code>false</code>, <code>options.filterCandidatesType.host</code>
 *   value to <code>true</code>, <code>options.filterCandidatesType.srflx</code> value to <code>true</code> and
 *   <code>options.filterCandidatesType.relay</code> value to <code>false</code>.</small>
 *   <small>Note that currently for MCU enabled Peer connections, the <code>options.filterCandidatesType</code>
 *   configuration is not honoured as Peers connected with MCU is similar as a forced TURN connection. The flags
 *   will act as if the value is <code>false</code> and ICE candidates will never be filtered regardless of the
 *   <code>options.filterCandidatesType</code> configuration.</small>
 * @param {Boolean} [options.usePublicSTUN=true] The flag if publicly available STUN ICE servers should
 *   be used if <code>options.enableSTUNServer</code> is enabled.
 * @param {Boolean} [options.TURNServerTransport] <blockquote class="info">
 *   Note that configuring the protocol may not necessarily result in the desired network transports protocol
 *   used in the actual TURN network traffic as it depends which protocol the browser selects and connects with.
 *   This simply configures the TURN ICE server urls <code?transport=(protocol)</code> query option when constructing
 *   the Peer connection. When all protocols are selected, the ICE servers urls are duplicated with all protocols.<br>
 *   Note that for Edge browsers, this value is overriden as <code>UDP</code> due to its supports.
 *   </blockquote> The option to configure the <code>?transport=</code>
 *   query parameter in TURN ICE servers when constructing a Peer connections.
 * - When not provided, its value is <code>ANY</code>.
 *   [Rel: Skylink.TURN_TRANSPORT]
 * @param {Boolean} [options.disableVideoFecCodecs=false] <blockquote class="info">
 *   Note that this is an experimental flag and may cause disruptions in connections or connectivity issues when toggled,
 *   and to prevent connectivity issues, these codecs will not be removed for MCU enabled Peer connections.
 *   </blockquote> The flag if video FEC (Forward Error Correction)
 *   codecs like ulpfec and red should be removed in sending session descriptions.
 *   <small>This can be useful for debugging purposes to prevent redundancy and overheads in RTP encoding.</small>
 * @param {Boolean} [options.disableComfortNoiseCodec=false] <blockquote class="info">
 *   Note that this is an experimental flag and may cause disruptions in connections or connectivity issues when toggled.
 *   </blockquote> The flag if audio
 *   <a href="https://en.wikipedia.org/wiki/Comfort_noise">Comfort Noise (CN)</a> codec should be removed
 *   in sending session descriptions.
 *   <small>This can be useful for debugging purposes to test preferred audio quality and feedback.</small>
 * @param {Boolean} [options.disableREMB=false] <blockquote class="info">
 *   Note that this is mainly used for debugging purposes and that it is an experimental flag, so
 *   it may cause disruptions in connections or connectivity issues when toggled. </blockquote>
 *   The flag if video REMB feedback packets should be disabled in sending session descriptions.
 * @param {JSON} [options.credentials] The credentials used for authenticating App Key with
 *   credentials to retrieve the Room session token used for connection in <a href="#method_joinRoom">
 *   <code>joinRoom()</code> method</a>.
 *   <small>Note that switching of Rooms is not allowed when using credentials based authentication, unless
 *   <code>init()</code> is invoked again with a different set of credentials followed by invoking
 *   the <a href="#method_joinRoom"><code>joinRoom()</code> method</a>.</small>
 * @param {String} options.credentials.startDateTime The credentials User session in Room starting DateTime
 *   in <a href="https://en.wikipedia.org/wiki/ISO_8601">ISO 8601 format</a>.
 * @param {Number} options.credentials.duration The credentials User session in Room duration in hours.
 * @param {String} options.credentials.credentials The generated credentials used to authenticate
 *   the provided App Key with its <code>"secret"</code> property.
 *   <blockquote class="details"><h5>To generate the credentials:</h5><ol>
 *   <li>Concatenate a string that consists of the Room name you provide in the <code>options.defaultRoom</code>,
 *   the <code>options.credentials.duration</code> and the <code>options.credentials.startDateTime</code>.
 *   <small>Example: <code>var concatStr = defaultRoom + "_" + duration + "_" + startDateTime;</code></small></li>
 *   <li>Hash the concatenated string with the App Key <code>"secret"</code> property using
 *   <a href="https://en.wikipedia.org/wiki/SHA-1">SHA-1</a>.
 *   <small>Example: <code>var hash = CryptoJS.HmacSHA1(concatStr, appKeySecret);</code></small>
 *   <small>See the <a href="https://code.google.com/p/crypto-js/#HMAC"><code>CryptoJS.HmacSHA1</code> library</a>.</small></li>
 *   <li>Encode the hashed string using <a href="https://en.wikipedia.org/wiki/Base64">base64</a>
 *   <small>Example: <code>var b64Str = hash.toString(CryptoJS.enc.Base64);</code></small>
 *   <small>See the <a href="https://code.google.com/p/crypto-js/#The_Cipher_Output">CryptoJS.enc.Base64</a> library</a>.</small></li>
 *   <li>Encode the base64 encoded string to replace special characters using UTF-8 encoding.
 *   <small>Example: <code>var credentials = encodeURIComponent(base64String);</code></small>
 *   <small>See <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/
 * Global_Objects/encodeURIComponent">encodeURIComponent() API</a>.</small></li></ol></blockquote>
 * @param {Boolean} [options.audioFallback=false] The flag if <a href="#method_getUserMedia">
 *   <code>getUserMedia()</code> method</a> should fallback to retrieve only audio Stream when
 *   retrieving audio and video Stream fails.
 * @param {Boolean} [options.forceSSL=false] The flag if HTTPS connections should be enforced
 *   during request to Auth server and socket connections to Signaling server
 *   when accessing <code>window.location.protocol</code> value is <code>"http:"</code>.
 *   <small>By default, <code>"https:"</code> protocol connections uses HTTPS connections.</small>
 * @param {String} [options.audioCodec] <blockquote class="info">
 *   Note that if the audio codec is not supported, the SDK will not configure the local <code>"offer"</code> or
 *   <code>"answer"</code> session description to prefer the codec.<br>
 *   Note that for Edge browsers, this value is set as <code>OPUS</code> due to its supports.</blockquote>
 *   The option to configure the preferred audio codec to use to encode sending audio data when available for Peer connection.
 * - When not provided, its value is <code>AUTO</code>.
 *   [Rel: Skylink.AUDIO_CODEC]
 * @param {String} [options.videoCodec] <blockquote class="info">
 *   Note that if the video codec is not supported, the SDK will not configure the local <code>"offer"</code> or
 *   <code>"answer"</code> session description to prefer the codec.<br>
 *   Note that for Edge browsers, this value is set as <code>H264</code> due to its supports.</blockquote>
 *   The option to configure the preferred video codec to use to encode sending video data when available for Peer connection.
 * - When not provided, its value is <code>AUTO</code>.
 *   [Rel: Skylink.VIDEO_CODEC]
 * @param {Number} [options.socketTimeout=20000] The timeout for each attempts for socket connection
 *   with the Signaling server to indicate that connection has timed out and has failed to establish.
 *   <small>Note that the mininum timeout value is <code>5000</code>. If less, this value will be <code>5000</code>.</small>
 *   <small>Note that it is recommended to use <code>12000</code> as the lowest timeout value if Peers are connecting
 *   using Polling transports to prevent connection errors.</small>
 * @param {Boolean} [options.forceTURNSSL=false] <blockquote class="info">
 *   Note that currently Firefox does not support the TURNS protocol, and that if TURNS is required,
 *   TURN ICE servers using port <code>443</code> will be used instead.<br>
 *   Note that for Edge browsers, this value is overriden as <code>false</code> due to its supports and
 *   only port <code>3478</code> is used.</blockquote>
 *   The flag if TURNS protocol should be used when <code>options.enableTURNServer</code> is enabled.
 * @param {JSON} [options.filterCandidatesType] <blockquote class="info">
 *   Note that this a debugging feature and there might be connectivity issues when toggling these flags.
 *   </blockquote> The configuration options to filter the type of ICE candidates sent and received.
 * @param {Boolean} [options.filterCandidatesType.host=false] The flag if local network ICE candidates should be filtered out.
 * @param {Boolean} [options.filterCandidatesType.srflx=false] The flag if STUN ICE candidates should be filtered out.
 * @param {Boolean} [options.filterCandidatesType.relay=false] The flag if TURN ICE candidates should be filtered out.
 * @param {JSON} [options.throttleIntervals] The configuration options to configure the throttling method timeouts.
 * @param {Number} [options.throttleIntervals.shareScreen=10000] The interval timeout for
 *   <a href="#method_shareScreen"><code>shareScreen()</code> method</a> throttling in milliseconds.
 * @param {Number} [options.throttleIntervals.getUserMedia=0] The interval timeout for
 *   <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a> throttling in milliseconds.
 * @param {Number} [options.throttleIntervals.refreshConnection=5000] <blockquote class="info">
 *   Note that this throttling is only done for MCU enabled Peer connections with the
 *   <code>options.mcuUseRenegoRestart</code> being set to <code>false</code>.
 *   </blockquote> The interval timeout for <a href="#method_refreshConnection">
 *   <code>refreshConnection()</code> method</a> throttling in milliseconds.
 *   <small>Note that there will be no throttling when <a href="#method_refreshConnection">
 *   <code>refreshConnection()</code> method</a> is called internally.</small>
 * @param {Boolean} [options.throttleShouldThrowError=false] The flag if throttled methods should throw errors when
 *   method is invoked less than the interval timeout value configured in <code>options.throttleIntervals</code>.
 * @param {Boolean} [options.mcuUseRenegoRestart=false] <blockquote class="info">
 *   Note that this feature is currently is beta and for any enquiries on enabling and its support, please
 *   contact <a href="http://support.temasys.io">our support portal</a>.</blockquote>
 *   The flag if <a href="#method_refreshConnection"><code>
 *   refreshConnection()</code> method</a> should renegotiate like non-MCU enabled Peer connection for MCU
 *   enabled Peer connections instead of invoking <a href="#method_joinRoom"><code>joinRoom()</code> method</a> again.
 * @param {String} [options.iceServer] The ICE server.
 *   <small>Note that this is a debugging feature and is only used when instructed for debugging purposes.</small>
 * @param {String} [options.socketServer] The Signaling server.
 *   <small>Note that this is a debugging feature and is only used when instructed for debugging purposes.</small>
 * @param {Function} [callback] The callback function fired when request has completed.
 *   <small>Function parameters signature is <code>function (error, success)</code></small>
 *   <small>Function request completion is determined by the <a href="#event_readyStateChange">
 *   <code>readyStateChange</code> event</a> <code>state</code> parameter payload value
 *   as <code>COMPLETED</code> for request success.</small>
 *   [Rel: Skylink.READY_STATE_CHANGE]
 * @param {JSON|String} callback.error The error result in request.
 * - When defined as string, it's the error when required App Key is not provided.
 *   <small>Defined as <code>null</code> when there are no errors in request</small>
 * @param {Number} callback.error.errorCode The <a href="#event_readyStateChange"><code>readyStateChange</code>
 *   event</a> <code>error.errorCode</code> parameter payload value.
 *   [Rel: Skylink.READY_STATE_CHANGE_ERROR]
 * @param {Error} callback.error.error The <a href="#event_readyStateChange"><code>readyStateChange</code>
 *   event</a> <code>error.content</code> parameter payload value.
 * @param {Number} callback.error.status The <a href="#event_readyStateChange"><code>readyStateChange</code>
 *   event</a> <code>error.status</code> parameter payload value.
 * @param {JSON} callback.success The success result in request.
 *   <small>Defined as <code>null</code> when there are errors in request</small>
 * @param {String} callback.success.serverUrl The constructed REST URL requested to Auth server.
 * @param {String} callback.success.readyState The current ready state.
 *   [Rel: Skylink.READY_STATE_CHANGE]
 * @param {String} callback.success.selectedRoom The Room based on the current Room session token retrieved for.
 * @param {String} callback.success.appKey The configured value of the <code>options.appKey</code>.
 * @param {String} callback.success.defaultRoom The configured value of the <code>options.defaultRoom</code>.
 * @param {String} callback.success.roomServer The configured value of the <code>options.roomServer</code>.
 * @param {Boolean} callback.success.enableIceTrickle The configured value of the <code>options.enableIceTrickle</code>.
 * @param {Boolean} callback.success.enableDataChannel The configured value of the <code>options.enableDataChannel</code>.
 * @param {Boolean} callback.success.enableTURNServer The configured value of the <code>options.enableTURNServer</code>.
 * @param {Boolean} callback.success.enableSTUNServer The configured value of the <code>options.enableSTUNServer</code>.
 * @param {Boolean} callback.success.TURNTransport The configured value of the <code>options.TURNServerTransport</code>.
 * @param {Boolean} callback.success.audioFallback The configured value of the <code>options.audioFallback</code>.
 * @param {Boolean} callback.success.forceSSL The configured value of the <code>options.forceSSL</code>.
 * @param {String} callback.success.audioCodec The configured value of the <code>options.audioCodec</code>.
 * @param {String} callback.success.videoCodec The configured value of the <code>options.videoCodec</code>.
 * @param {Number} callback.success.socketTimeout The configured value of the <code>options.socketTimeout</code>.
 * @param {Boolean} callback.success.forceTURNSSL The configured value of the <code>options.forceTURNSSL</code>.
 * @param {Boolean} callback.success.forceTURN The configured value of the <code>options.forceTURN</code>.
 * @param {Boolean} callback.success.usePublicSTUN The configured value of the <code>options.usePublicSTUN</code>.
 * @param {Boolean} callback.success.disableVideoFecCodecs The configured value of the <code>options.disableVideoFecCodecs</code>.
 * @param {Boolean} callback.success.disableComfortNoiseCodec The configured value of the <code>options.disableComfortNoiseCodec</code>.
 * @param {Boolean} callback.success.disableREMB The configured value of the <code>options.disableREMB</code>.
 * @param {JSON} callback.success.filterCandidatesType The configured value of the <code>options.filterCandidatesType</code>.
 * @param {Number} callback.success.throttleIntervals The configured value of the <code>options.throttleIntervals</code>.
 * @param {Number} callback.success.throttleShouldThrowError The configured value of the <code>options.throttleShouldThrowError</code>.
 * @param {Number} callback.success.mcuUseRenegoRestart The configured value of the <code>options.mcuUseRenegoRestart</code>.
 * @param {Number} callback.success.iceServer The configured value of the <code>options.iceServer</code>.
 * @param {Number} callback.success.socketServer The configured value of the <code>options.socketServer</code>.
 * @example
 *   // Example 1: Using CORS authentication and connection to default Room
 *   skylinkDemo(appKey, function (error, success) {
 *     if (error) return;
 *     skylinkDemo.joinRoom(); // Goes to default Room
 *   });
 *
 *   // Example 2: Using CORS authentication and connection to a different Room
 *   skylinkDemo(appKey, function (error, success) {
 *     skylinkDemo.joinRoom("testxx"); // Goes to "testxx" Room
 *   });
 *
 *   // Example 3: Using credentials authentication and connection to only default Room
 *   var defaultRoom   = "test",
 *       startDateTime = (new Date()).toISOString(),
 *       duration      = 1, // Allows only User session to stay for 1 hour
 *       appKeySecret  = "xxxxxxx",
 *       hash          = CryptoJS.HmacSHA1(defaultRoom + "_" + duration + "_" + startDateTime, appKeySecret);
 *       credentials   = encodeURIComponent(hash.toString(CryptoJS.enc.Base64));
 *
 *   skylinkDemo({
 *     defaultRoom: defaultRoom,
 *     appKey: appKey,
 *     credentials: {
 *       duration: duration,
 *       startDateTime: startDateTime,
 *       credentials: credentials
 *     }
 *   }, function (error, success) {
 *     if (error) return;
 *     skylinkDemo.joinRoom(); // Goes to default Room (switching to different Room is not allowed for credentials authentication)
 *   });
 * @trigger <ol class="desc-seq">
 *   <li>If parameter <code>options</code> is not provided: <ol><li><b>ABORT</b> and return error.</li></ol></li>
 *   <li>Checks if dependecies and browser APIs are available. <ol><li>If AdapterJS is not loaded: <ol>
 *   <li><a href="#event_readyStateChange"><code>readyStateChange</code> event</a> triggers
 *   parameter payload <code>state</code> as <code>ERROR</code> and <code>error.errorCode</code> as
 *   <code>ADAPTER_NO_LOADED</code>.</li><li><b>ABORT</b> and return error.</li></ol></li>
 *   <li>If socket.io-client is not loaded: <ol><li><a href="#event_readyStateChange">
 *   <code>readyStateChange</code> event</a> triggers parameter payload <code>state</code>
 *   as <code>ERROR</code> and <code>error.errorCode</code> as <code>NO_SOCKET_IO</code>.</li>
 *   <li><b>ABORT</b> and return error. </li></ol></li>
 *   <li>If XMLHttpRequest API is not available: <ol><li><a href="#event_readyStateChange">
 *   <code>readyStateChange</code> event</a> triggers parameter payload <code>state</code>
 *   as <code>ERROR</code> and <code>error.errorCode</code> as <code>NO_XMLHTTPREQUEST_SUPPORT</code>.</li>
 *   <li><b>ABORT</b> and return error.</li></ol></li><li>If WebRTC is not supported by device: <ol>
 *   <li><a href="#event_readyStateChange"><code>readyStateChange</code> event</a> triggers parameter
 *   payload <code>state</code> as <code>ERROR</code> and <code>error.errorCode</code> as
 *   <code>NO_WEBRTC_SUPPORT</code>.</li><li><b>ABORT</b> and return error.</li></ol></li></ol></li>
 *   <li>Retrieves Room session token from Auth server. <ol>
 *   <li><a href="#event_readyStateChange"><code>readyStateChange</code> event</a> triggers
 *   parameter payload <code>state</code> as <code>LOADING</code>.</li>
 *   <li>If retrieval was successful: <ol><li><a href="#event_readyStateChange"><code>readyStateChange</code> event</a>
 *   triggers parameter payload <code>state</code> as <code>COMPLETED</code>.</li></ol></li><li>Else: <ol>
 *   <li><a href="#event_readyStateChange"><code>readyStateChange</code> event</a> triggers parameter
 *   payload <code>state</code> as <code>ERROR</code>.</li><li><b>ABORT</b> and return error.</li></ol></li></ol></li></ol>
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.init = function(options, callback) {
  var self = this;

  // Default init() options
  self._options = {
    appKey: null,
    defaultRoom: null,
    credentials: null,
    roomServer: '//api.temasys.io',
    iceServer: null,
    socketServer: null,
    enableSTUNServer: true,
    enableTURNServer: true,
    enableDataChannel: true,
    enableIceTrickle: true,
    usePublicSTUN: true,
    TURNServerTransport: self.TURN_TRANSPORT.ANY,
    videoCodec: self.AUDIO_CODEC.AUTO,
    audioCodec: self.VIDEO_CODEC.AUTO,
    forceSSL: false,
    forceTURN: false,
    forceTURNSSL: false,
    audioFallback: false,
    throttleShouldThrowError: false,
    mcuUseRenegoRestart: false,
    disableREMB: false,
    disableVideoFecCodecs: false,
    disableComfortNoiseCodec: false,
    socketTimeout: 20000,
    filterCandidatesType: {
      host: false,
      srflx: false,
      relay: false
    },
    throttleIntervals: {
      shareScreen: 10000,
      refreshConnection: 5000,
      getUserMedia: 0
    }
  };

  // Parse init() options
  // --> init (function () {})
  if (typeof options === 'function'){
    callback = options;
    options = undefined;

  // --> init ("xxxxx-xxxxx-xxxxx-xxxxx", ..)
  } else if (options && typeof options === 'string') {
    self._options.appKey = options;
    self._options.defaultRoom = options;

  // --> init ({}, ..)
  } else if (options && typeof options === 'object') {
    // Parse options.appKey
    if (options.appKey && typeof options.appKey === 'string') {
      self._options.appKey = options.appKey;
      self._options.defaultRoom = options.appKey;

    // Parse options.apiKey (deprecated)
    } else if (options.apiKey && typeof options.apiKey === 'string') {
      self._options.appKey = options.apiKey;
      self._options.defaultRoom = options.apiKey;
    }

    // Parse options.defaultRoom
    if (options.defaultRoom && typeof options.defaultRoom === 'string') {
      self._options.defaultRoom = options.defaultRoom;
    }

    // Parse options.roomServer
    if (options.roomServer && typeof options.roomServer === 'string' &&
      options.roomServer.indexOf('temasys') > -1 && options.roomServer.indexOf('//') === 0) {
      self._options.roomServer = options.roomServer.lastIndexOf('/') === (options.roomServer.length - 1) ?
        options.roomServer.substring(0, options.roomServer.length - 1) : options.roomServer;
    }

    // Parse options.iceServer
    if (options.iceServer && typeof options.iceServer === 'string' && options.iceServer.indexOf('temasys') > -1) {
      self._options.iceServer = options.iceServer;
    }

    // Parse options.socketServer
    if (options.socketServer && typeof options.socketServer === 'string' && options.socketServer.indexOf('temasys') > -1) {
      self._options.socketServer = options.socketServer;
    }

    // Parse options.credentials
    // Ensure that values are all passed in correctly
    if (options.credentials && typeof options.credentials === 'object' && options.credentials.credentials &&
      typeof options.credentials.credentials === 'string' && typeof options.credentials.duration === 'number' &&
      options.credentials.startDateTime && typeof options.credentials.startDateTime === 'string') {
      self._options.credentials = {
        startDateTime: options.credentials.startDateTime,
        duration: options.credentials.duration,
        credentials: options.credentials.credentials
      };
    }

    // Parse options.socketTimeout
    if (typeof options.socketTimeout === 'number' && options.socketTimeout >= 5000) {
      self._options.socketTimeout = options.socketTimeout;
    }

    // Parse options.audioCodec
    if (options.audioCodec && typeof options.audioCodec === 'string') {
      for (var aprop in self.AUDIO_CODEC) {
        if (self.AUDIO_CODEC.hasOwnProperty(aprop) && self.AUDIO_CODEC[aprop] === options.audioCodec) {
          self._options.audioCodec = options.audioCodec;
        }
      }
    }

    // Parse options.videoCodec
    if (options.videoCodec && typeof options.videoCodec === 'string') {
      for (var vprop in self.VIDEO_CODEC) {
        if (self.VIDEO_CODEC.hasOwnProperty(vprop) && self.VIDEO_CODEC[vprop] === options.videoCodec) {
          self._options.videoCodec = options.videoCodec;
        }
      }
    }

    // Parse options.TURNServerTransport
    if (options.TURNServerTransport && typeof options.TURNServerTransport === 'string') {
      for (var tprop in self.TURN_TRANSPORT) {
        if (self.TURN_TRANSPORT.hasOwnProperty(tprop) && self.TURN_TRANSPORT[tprop] === options.TURNServerTransport) {
          self._options.TURNServerTransport = options.TURNServerTransport;
        }
      }
    }

    // Parse options.filterCandidatesType
    if (options.filterCandidatesType && typeof options.filterCandidatesType === 'object') {
      // Parse options.filterCandidatesType.host
      self._options.filterCandidatesType.host = options.filterCandidatesType.host === true;
      // Parse options.filterCandidatesType.srflx
      self._options.filterCandidatesType.srflx = options.filterCandidatesType.srflx === true;
      // Parse options.filterCandidatesType.relay
      self._options.filterCandidatesType.relay = options.filterCandidatesType.relay === true;
    }

    // Parse options.throttleIntervals
    if (options.throttleIntervals && typeof options.throttleIntervals === 'object') {
      // Parse options.throttleIntervals.getUserMedia
      if (typeof options.throttleIntervals.getUserMedia === 'number') {
        self._options.throttleIntervals.getUserMedia = options.throttleIntervals.getUserMedia;
      }
      // Parse options.throttleIntervals.refreshConnection
      if (typeof options.throttleIntervals.refreshConnection === 'number') {
        self._options.throttleIntervals.refreshConnection = options.throttleIntervals.refreshConnection;
      }
      // Parse options.throttleIntervals.shareScreen
      if (typeof options.throttleIntervals.shareScreen === 'number') {
        self._options.throttleIntervals.shareScreen = options.throttleIntervals.shareScreen;
      }
    }

    // Parse options.enableSTUNServer
    self._options.enableSTUNServer = options.enableSTUNServer !== false;
    // Parse options.enableTURNServer
    self._options.enableTURNServer = options.enableTURNServer !== false;
    // Parse options.enableIceTrickle
    self._options.enableIceTrickle = options.enableIceTrickle !== false;
    // Parse options.enableDataChannel
    self._options.enableDataChannel = options.enableDataChannel !== false;
    // Parse options.usePublicSTUN
    self._options.usePublicSTUN = options.usePublicSTUN !== false;
    // Parse options.forceSSL
    self._options.forceSSL = options.forceSSL === true;
    // Parse options.forceTURNSSL
    self._options.forceTURNSSL = options.forceTURNSSL === true;
    // Parse options.audioFallback
    self._options.audioFallback = options.audioFallback === true;
    // Parse options.disableVideoFecCodecs
    self._options.disableVideoFecCodecs = options.disableVideoFecCodecs === true;
    // Parse options.disableComfortNoiseCodec
    self._options.disableComfortNoiseCodec = options.disableComfortNoiseCodec === true;
    // Parse options.disableREMB
    self._options.disableREMB = options.disableREMB === true;
    // Parse options.mcuUseRenegoRestart
    self._options.mcuUseRenegoRestart = options.mcuUseRenegoRestart === true;
    // Parse options.throttleShouldThrowError
    self._options.throttleShouldThrowError = options.throttleShouldThrowError === true;

    // Parse options.forceTURN
    // Override any configuration for force TURN case
    if (options.forceTURN === true) {
      self._options.filterCandidatesType.host = true;
      self._options.filterCandidatesType.srflx = true;
      self._options.filterCandidatesType.relay = false;
      self._options.enableTURNServer = true;
      self._options.enableSTUNServer = false;
      self._options.usePublicSTUN = false;
      self._options.forceTURN = true;
    }
  }

  // Edge does not support Datachannel, STUN server connections, TURN transports of UDP..
  if (window.webrtcDetectedBrowser === 'edge') {
    log.warn('init() overriding any configuration for Edge connection case.');

    self._options.filterCandidatesType.host = true;
    self._options.filterCandidatesType.srflx = true;
    self._options.filterCandidatesType.relay = false;
    self._options.enableTURNServer = true;
    self._options.enableSTUNServer = false;
    self._options.usePublicSTUN = false;
    // Force Edge to prefer OPUS
    self._options.audioCodec = self.AUDIO_CODEC.OPUS;
    // Force Edge to prefer H264
    self._options.videoCodec = self.AUDIO_CODEC.H264;
    self._options.TURNServerTransport = self.TURN_TRANSPORT.UDP;
  }

  // Check if App Key is provided
  if (!options.appKey) {
    return self._initCallback({
      state: self.READY_STATE_CHANGE.ERROR,
      content: 'No API key provided.',
      errorCode: self.READY_STATE_CHANGE_ERROR.NO_PATH,
      room: self._options.defaultRoom
    }, callback);
  }

  // Check if XMLHttpRequest is supported
  if (!(window.XMLHttpRequest || window.XDomainRequest)) {
    return self._initCallback({
      state: self.READY_STATE_CHANGE.ERROR,
      content: 'XMLHttpRequest not available',
      errorCode: self.READY_STATE_CHANGE_ERROR.NO_XMLHTTPREQUEST_SUPPORT,
      room: self._options.defaultRoom
    }, callback);
  }

  // Check if socket.io-client has been loaded
  if (!(window.io || io)) {
    return self._initCallback({
      state: self.READY_STATE_CHANGE.ERROR,
      content: 'Socket.io not found',
      errorCode: self.READY_STATE_CHANGE_ERROR.NO_SOCKET_IO,
      room: self._options.defaultRoom
    }, callback);
  }

  // Check if AdapterJS has been loaded
  if (!((window.AdapterJS || AdapterJS) && typeof AdapterJS.webRTCReady === 'function')) {
    return self._initCallback({
      state: self.READY_STATE_CHANGE.ERROR,
      content: 'AdapterJS dependency is not loaded or incorrect AdapterJS dependency is used',
      errorCode: self.READY_STATE_CHANGE_ERROR.ADAPTER_NO_LOADED,
      room: self._options.defaultRoom
    }, callback);
  }

  AdapterJS.webRTCReady(function () {
    // Check if RTCPeerConnection is available
    if (!window.RTCPeerConnection) {
      return self._initCallback({
        state: self.READY_STATE_CHANGE.ERROR,
        content: 'WebRTC not available',
        errorCode: self.READY_STATE_CHANGE_ERROR.NO_WEBRTC_SUPPORT,
        room: self._options.defaultRoom
      }, callback);
    }

    // Check and get codecs support
    self._getCodecsSupport(function (error) {
      if (error) {
        return self._initCallback({
          state: self.READY_STATE_CHANGE.ERROR,
          content: error.message || error.toString(),
          errorCode: self.READY_STATE_CHANGE_ERROR.PARSE_CODECS,
          room: self._options.defaultRoom
        }, callback);
      }

      // Check if there is any codecs retrieved to start connection
      if (Object.keys(self._currentCodecSupport.audio).length === 0 &&
        Object.keys(self._currentCodecSupport.video).length === 0) {
        return self._initCallback({
          state: self.READY_STATE_CHANGE.ERROR,
          content: 'No audio/video codecs available to start connection',
          errorCode: self.READY_STATE_CHANGE_ERROR.PARSE_CODECS,
          room: self._options.defaultRoom
        }, callback);
      }

      // Fetch API data
      self._initFetchAPIData(self._options.defaultRoom, callback);
    });
  });
};

/**
 * Function that handles `init()` async callbacks to proceed to the next step.
 * @method _initCallback
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._initCallback = function (result, callback) {
  var self = this;

  self._user.room.readyState = result.state;
  // Trigger `readyStateChange` event
  self._trigger('readyStateChange', result.state, result.state === self.READY_STATE_CHANGE.ERROR ? {
    content: result.content,
    status: result.status || null,
    errorCode: result.errorCode
  } : null, result.room);

  // init() result error
  if (result.state === self.READY_STATE_CHANGE.ERROR) {
    log.error('init() failed ->', result);

    if (typeof callback === 'function') {
      // Convert the parameters to suit the documented result
      callback({
        error: new Error(result.content),
        status: result.status || null,
        errorCode: result.errorCode
      }, null);
    }

  // init() result success
  } else if (result.state === self.READY_STATE_CHANGE.COMPLETED) {
    log.info('init() success ->', clone(self._options));

    if (typeof callback === 'function') {
      // Convert the parameters to suit the documented result
      callback(null, {
        serverUrl: self._user.room.path,
        readyState: self._user.room.readyState,
        appKey: self._options.appKey,
        roomServer: self._options.roomServer,
        defaultRoom: self._options.defaultRoom,
        selectedRoom: self._selectedRoom,
        enableDataChannel: self._options.enableDataChannel,
        enableIceTrickle: self._options.enableIceTrickle,
        enableTURNServer: self._options.enableTURNServer,
        enableSTUNServer: self._options.enableSTUNServer,
        TURNTransport: self._options.TURNServerTransport,
        audioFallback: self._options.audioFallback,
        forceSSL: self._options.forceSSL,
        socketTimeout: self._options.socketTimeout,
        forceTURNSSL: self._options.forceTURNSSL,
        audioCodec: self._options.audioCodec,
        videoCodec: self._options.videoCodec,
        forceTURN: self._options.forceTURN,
        usePublicSTUN: self._options.usePublicSTUN,
        disableVideoFecCodecs: self._options.disableVideoFecCodecs,
        disableComfortNoiseCodec: self._options.disableComfortNoiseCodec,
        disableREMB: self._options.disableREMB,
        filterCandidatesType: self._options.filterCandidatesType,
        throttleIntervals: self._options.throttleIntervals,
        throttleShouldThrowError: self._options.throttlingShouldThrowError,
        mcuUseRenegoRestart: self._options.mcuUseRenegoRestart,
        iceServer: self._options.turnServer,
        socketServer: self._options.socketServer
      });
    }
  }
};

/**
 * Function that handles `init()` fetching of API data.
 * @method _initFetchAPIData
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._initFetchAPIData = function (room, callback, isInit) {
  var self = this;
  var xhr = new XMLHttpRequest();
  var protocol = self._options.forceSSL ? 'https:' : window.location.protocol;

  // Fallback support for IE8/9
  if (['object', 'function'].indexOf(typeof window.XDomainRequest) > -1) {
    xhr = new XDomainRequest();
  }

  // Can only use default room due to credentials generated!
  self._user.room.name = self._options.credentials ? self._options.defaultRoom : room;
  self._user.room.protocol = protocol;

  self._initCallback({
    state: self.READY_STATE_CHANGE.INIT,
    room: self._user.room.name
  });

  // Construct API REST path
  self._user.room.path = self._options.roomServer + '/api/' + self._options.appKey + '/' + self._selectedRoom;

  // Construct path with credentials authentication.
  if (self._options.credentials) {
    self._user.room.path += '/' + self._options.credentials.startDateTime + '/' +
      self._options.credentials.duration + '?&cred=' + self._options.credentials.credentials;
  }

  // Append random number to prevent network cache
  self._user.room.path += '&' + (!self._options.credentials ? '?' :'') + 'rand=' + (new Date ()).toISOString();

  // XMLHttpRequest success
  xhr.onload = function () {
    var response = JSON.parse(xhr.responseText || xhr.response || '{}') || {};
    var status = xhr.status || 200;

    log.debug('init() retrieved response ->', response);

    // Successful authentication
    if (response.success) {
      // Configure User session settings
      self._user.room.session = {
        uid: response.username,
        userCred: response.userCred,
        timeStamp: response.timeStamp,
        rid: response.room_key,
        roomCred: response.roomCred,
        len: response.len,
        start: response.start,
        cid: response.cid,
        apiOwner: response.apiOwner,
        isPrivileged: response.isPrivileged,
        autoIntroduce: response.autoIntroduce
      };

      // Configure Signaling settings
      self._socket.ports = {
        'https:': Array.isArray(response.httpsPortList) && response.httpsPortList.length > 0 ?
          response.httpsPortList : [443, 3443],
        'http:': Array.isArray(response.httpPortList) && response.httpPortList.length > 0 ?
          response.httpPortList : [80, 3000]
      };
      self._socket.server = response.ipSigserver;

      // Trigger `readyStateChange` event as COMPLETED
      self._initCallback({
        state: self.READY_STATE_CHANGE.COMPLETED,
        room: self._user.room.name
      }, callback);

    // Failed authentication
    } else {
      // Trigger `readyStateChange` event as ERROR
      self._initCallback({
        state: self.READY_STATE_CHANGE.ERROR,
        content: info.info,
        status: status,
        errorCode: info.errorCode,
        room: self._user.room.name
      }, callback);
    }
  };

  // XMLHttpRequest error
  xhr.onerror = function () {
    log.error('init() failed retrieving response due to network timeout.');
    self._initCallback({
      state: self.READY_STATE_CHANGE.ERROR,
      status: xhr.status || null,
      content: 'Network error occurred. (Status: ' + xhr.status + ')',
      errorCode: self.READY_STATE_CHANGE_ERROR.XML_HTTP_REQUEST_ERROR,
      room: self._user.room.name
    }, callback);
  };

  // Trigger `readyStateChange` event as LOADING
  self._initCallback({
    state: self.READY_STATE_CHANGE.LOADING,
    room: self._user.room.name
  });

  xhr.open('GET', protocol + self._user.room.path, true);
  xhr.send();
};

Skylink.prototype.LOG_LEVEL = {
  DEBUG: 4,
  LOG: 3,
  INFO: 2,
  WARN: 1,
  ERROR: 0,
  NONE: -1
};

/**
 * Stores the log message starting header string.
 * E.g. "<header> - <the log message>".
 * @attribute _LOG_KEY
 * @type String
 * @private
 * @scoped true
 * @for Skylink
 * @since 0.5.4
 */
var _LOG_KEY = 'SkylinkJS';

/**
 * Stores the list of available SDK log levels.
 * @attribute _LOG_LEVELS
 * @type Array
 * @private
 * @scoped true
 * @for Skylink
 * @since 0.5.5
 */
var _LOG_LEVELS = ['error', 'warn', 'info', 'log', 'debug'];

/**
 * Stores the current SDK log level.
 * Default is ERROR (<code>0</code>).
 * @attribute _logLevel
 * @type String
 * @default 0
 * @private
 * @scoped true
 * @for Skylink
 * @since 0.5.4
 */
var _logLevel = 0;

/**
 * Stores the flag if debugging mode is enabled.
 * This manipulates the SkylinkLogs interface.
 * @attribute _enableDebugMode
 * @type Boolean
 * @default false
 * @private
 * @scoped true
 * @for Skylink
 * @since 0.5.4
 */
var _enableDebugMode = false;

/**
 * Stores the flag if logs should be stored in SkylinkLogs interface.
 * @attribute _enableDebugStack
 * @type Boolean
 * @default false
 * @private
 * @scoped true
 * @for Skylink
 * @since 0.5.5
 */
var _enableDebugStack = false;

/**
 * Stores the flag if logs should trace if available.
 * This uses the <code>console.trace</code> API.
 * @attribute _enableDebugTrace
 * @type Boolean
 * @default false
 * @private
 * @scoped true
 * @for Skylink
 * @since 0.5.5
 */
var _enableDebugTrace = false;

/**
 * Stores the logs used for SkylinkLogs object.
 * @attribute _storedLogs
 * @type Array
 * @private
 * @scoped true
 * @for Skylink
 * @since 0.5.5
 */
var _storedLogs = [];

/**
 * Function that gets the stored logs.
 * @method _getStoredLogsFn
 * @private
 * @scoped true
 * @for Skylink
 * @since 0.5.5
 */
var _getStoredLogsFn = function (logLevel) {
  if (typeof logLevel === 'undefined') {
    return _storedLogs;
  }
  var returnLogs = [];
  for (var i = 0; i < _storedLogs.length; i++) {
    if (_storedLogs[i][1] === _LOG_LEVELS[logLevel]) {
      returnLogs.push(_storedLogs[i]);
    }
  }
  return returnLogs;
};

/**
 * Function that clears the stored logs.
 * @method _clearAllStoredLogsFn
 * @private
 * @scoped true
 * @for Skylink
 * @since 0.5.5
 */
var _clearAllStoredLogsFn = function () {
  _storedLogs = [];
};

/**
 * Function that prints in the Web Console interface the stored logs.
 * @method _printAllStoredLogsFn
 * @private
 * @scoped true
 * @for Skylink
 * @since 0.5.5
 */
var _printAllStoredLogsFn = function () {
  for (var i = 0; i < _storedLogs.length; i++) {
    var timestamp = _storedLogs[i][0];
    var log = (console[_storedLogs[i][1]] !== 'undefined') ?
      _storedLogs[i][1] : 'log';
    var message = _storedLogs[i][2];
    var debugObject = _storedLogs[i][3];

    if (typeof debugObject !== 'undefined') {
      console[log](message, debugObject, timestamp);
    } else {
      console[log](message, timestamp);
    }
  }
};

/**
 * <blockquote class="info">
 *   To utilise and enable the <code>SkylinkLogs</code> API functionalities, the
 *   <a href="#method_setDebugMode"><code>setDebugMode()</code> method</a>
 *   <code>options.storeLogs</code> parameter has to be enabled.
 * </blockquote>
 * The object interface to manage the SDK <a href="https://developer.mozilla.org/en/docs/Web/API/console">
 * Javascript Web Console</a> logs.
 * @property SkylinkLogs
 * @type JSON
 * @global true
 * @for Skylink
 * @since 0.5.5
 */
window.SkylinkLogs = {
  /**
   * Function that gets the current stored SDK <code>console</code> logs.
   * @property SkylinkLogs.getLogs
   * @param {Number} [logLevel] The specific log level of logs to return.
   * - When not provided or that the level does not exists, it will return all logs of all levels.
   *  [Rel: Skylink.LOG_LEVEL]
   * @return {Array} The array of stored logs.<ul>
   *   <li><code><#index></code><var><b>{</b>Array<b>}</b></var><p>The stored log item.</p><ul>
   *   <li><code>0</code><var><b>{</b>Date<b>}</b></var><p>The DateTime of when the log was stored.</p></li>
   *   <li><code>1</code><var><b>{</b>String<b>}</b></var><p>The log level. [Rel: Skylink.LOG_LEVEL]</p></li>
   *   <li><code>2</code><var><b>{</b>String<b>}</b></var><p>The log message.</p></li>
   *   <li><code>3</code><var><b>{</b>Any<b>}</b></var><span class="label">Optional</span><p>The log message object.
   *   </p></li></ul></li></ul>
   * @example
   *  // Example 1: Get logs of specific level
   *  var debugLogs = SkylinkLogs.getLogs(skylinkDemo.LOG_LEVEL.DEBUG);
   *
   *  // Example 2: Get all the logs
   *  var allLogs = SkylinkLogs.getLogs();
   * @type Function
   * @global true
   * @triggerForPropHackNone true
   * @for Skylink
   * @since 0.5.5
   */
  getLogs: _getStoredLogsFn,

  /**
   * Function that clears all the current stored SDK <code>console</code> logs.
   * @property SkylinkLogs.clearAllLogs
   * @type Function
   * @example
   *   // Example 1: Clear all the logs
   *   SkylinkLogs.clearAllLogs();
   * @global true
   * @triggerForPropHackNone true
   * @for Skylink
   * @since 0.5.5
   */
  clearAllLogs: _clearAllStoredLogsFn,

  /**
   * Function that prints all the current stored SDK <code>console</code> logs into the
   * <a href="https://developer.mozilla.org/en/docs/Web/API/console">Javascript Web Console</a>.
   * @property SkylinkLogs.printAllLogs
   * @type Function
   * @example
   *   // Example 1: Print all the logs
   *   SkylinkLogs.printAllLogs();
   * @global true
   * @triggerForPropHackNone true
   * @for Skylink
   * @since 0.5.5
   */
  printAllLogs: _printAllStoredLogsFn
};

/**
 * Function that handles the logs received and prints in the Web Console interface according to the log level set.
 * @method _logFn
 * @private
 * @required
 * @scoped true
 * @for Skylink
 * @since 0.5.5
 */
var _logFn = function(logLevel, message, debugObject) {
  var outputLog = _LOG_KEY;

  if (typeof message === 'object') {
    outputLog += (message[0]) ? ' [' + message[0] + '] -' : ' -';
    outputLog += (message[1]) ? ' <<' + message[1] + '>>' : '';
    if (message[2]) {
      outputLog += ' ';
      if (typeof message[2] === 'object') {
        for (var i = 0; i < message[2].length; i++) {
          outputLog += '(' + message[2][i] + ')';
        }
      } else {
        outputLog += '(' + message[2] + ')';
      }
    }
    outputLog += ' ' + message[3];
  } else {
    outputLog += ' - ' + message;
  }

  if (_enableDebugMode && _enableDebugStack) {
    // store the logs
    var logItem = [(new Date()), _LOG_LEVELS[logLevel], outputLog];

    if (typeof debugObject !== 'undefined') {
      logItem.push(debugObject);
    }
    _storedLogs.push(logItem);
  }

  if (_logLevel >= logLevel) {
    // Fallback to log if failure
    logLevel = (typeof console[_LOG_LEVELS[logLevel]] === 'undefined') ? 3 : logLevel;

    if (_enableDebugMode && _enableDebugTrace) {
      var logConsole = (typeof console.trace === 'undefined') ? logLevel[3] : 'trace';
      if (typeof debugObject !== 'undefined') {
        console[_LOG_LEVELS[logLevel]](outputLog, debugObject);
        // output if supported
        if (typeof console.trace !== 'undefined') {
          console.trace('');
        }
      } else {
        console[_LOG_LEVELS[logLevel]](outputLog);
        // output if supported
        if (typeof console.trace !== 'undefined') {
          console.trace('');
        }
      }
    } else {
      if (typeof debugObject !== 'undefined') {
        console[_LOG_LEVELS[logLevel]](outputLog, debugObject);
      } else {
        console[_LOG_LEVELS[logLevel]](outputLog);
      }
    }
  }
};

/**
 * Stores the logging functions.
 * @attribute log
 * @param {Function} debug The function that handles the DEBUG level logs.
 * @param {Function} log The function that handles the LOG level logs.
 * @param {Function} info The function that handles the INFO level logs.
 * @param {Function} warn The function that handles the WARN level logs.
 * @param {Function} error The function that handles the ERROR level logs.
 * @type JSON
 * @private
 * @scoped true
 * @for Skylink
 * @since 0.5.4
 */
var log = {
  debug: function (message, object) {
    _logFn(4, message, object);
  },

  log: function (message, object) {
    _logFn(3, message, object);
  },

  info: function (message, object) {
    _logFn(2, message, object);
  },

  warn: function (message, object) {
    _logFn(1, message, object);
  },

  error: function (message, object) {
    _logFn(0, message, object);
  }
};

/**
 * Function that configures the level of <code>console</code> API logs to be printed in the
 * <a href="https://developer.mozilla.org/en/docs/Web/API/console">Javascript Web Console</a>.
 * @method setLogLevel
 * @param {Number} [logLevel] The specific log level of logs to return.
 * - When not provided or that the level does not exists, it will not overwrite the current log level.
 *   <small>By default, the initial log level is <code>ERROR</code>.</small>
 *   [Rel: Skylink.LOG_LEVEL]
 * @example
 *   // Example 1: Print all of the console.debug, console.log, console.info, console.warn and console.error logs.
 *   skylinkDemo.setLogLevel(skylinkDemo.LOG_LEVEL.DEBUG);
 *
 *   // Example 2: Print only the console.log, console.info, console.warn and console.error logs.
 *   skylinkDemo.setLogLevel(skylinkDemo.LOG_LEVEL.LOG);
 *
 *   // Example 3: Print only the console.info, console.warn and console.error logs.
 *   skylinkDemo.setLogLevel(skylinkDemo.LOG_LEVEL.INFO);
 *
 *   // Example 4: Print only the console.warn and console.error logs.
 *   skylinkDemo.setLogLevel(skylinkDemo.LOG_LEVEL.WARN);
 *
 *   // Example 5: Print only the console.error logs. This is done by default.
 *   skylinkDemo.setLogLevel(skylinkDemo.LOG_LEVEL.ERROR);
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.setLogLevel = function(logLevel) {
  if(logLevel === undefined) {
    logLevel = Skylink.LOG_LEVEL.WARN;
  }
  for (var level in this.LOG_LEVEL) {
    if (this.LOG_LEVEL[level] === logLevel) {
      _logLevel = logLevel;
      log.log([null, 'Log', level, 'Log level exists. Level is set']);
      return;
    }
  }
  log.error([null, 'Log', level, 'Log level does not exist. Level is not set']);
};

/**
 * Function that configures the debugging mode of the SDK.
 * @method setDebugMode
 * @param {Boolean|JSON} [options=false] The debugging options.
 * - When provided as a boolean, this sets both <code>options.trace</code>
 *   and <code>options.storeLogs</code> to its boolean value.
 * @param {Boolean} [options.trace=false] The flag if SDK <code>console</code> logs
 *   should output as <code>console.trace()</code> logs for tracing the <code>Function</code> call stack.
 *   <small>Note that the <code>console.trace()</code> output logs is determined by the log level set
 *   <a href="#method_setLogLevel"><code>setLogLevel()</code> method</a>.</small>
 *   <small>If <code>console.trace()</code> API is not supported, <code>setDebugMode()</code>
 *   will fallback to use <code>console.log()</code> API.</small>
 * @param {Boolean} [options.storeLogs=false] The flag if SDK should store the <code>console</code> logs.
 *   <small>This is required to be enabled for <a href="#prop_SkylinkLogs"><code>SkylinkLogs</code> API</a>.</small>
 * @example
 *   // Example 1: Enable both options.storeLogs and options.trace
 *   skylinkDemo.setDebugMode(true);
 *
 *   // Example 2: Enable only options.storeLogs
 *   skylinkDemo.setDebugMode({ storeLogs: true });
 *
 *   // Example 3: Disable debugging mode
 *   skylinkDemo.setDebugMode();
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype.setDebugMode = function(isDebugMode) {
  if (typeof isDebugMode === 'object') {
    if (Object.keys(isDebugMode).length > 0) {
      _enableDebugTrace = !!isDebugMode.trace;
      _enableDebugStack = !!isDebugMode.storeLogs;
    } else {
      _enableDebugMode = false;
      _enableDebugTrace = false;
      _enableDebugStack = false;
    }
  }
  if (isDebugMode === false) {
    _enableDebugMode = false;
    _enableDebugTrace = false;
    _enableDebugStack = false;

    return;
  }
  _enableDebugMode = true;
  _enableDebugTrace = true;
  _enableDebugStack = true;
};
var _eventsDocs = {
  /**
   * Event triggered when socket connection to Signaling server has opened.
   * @event channelOpen
   * @param {JSON} session The socket connection session information.
   * @param {String} session.serverUrl The socket connection Signaling url used.
   * @param {String} session.transportType The socket connection transport type used.
   * @param {JSON} session.socketOptions The socket connection options.
   * @param {Number} session.attempts The socket connection current reconnection attempts.
   * @param {Number} session.finalAttempts The socket connection current last attempts
   *   for the last available transports and port.
   * @for Skylink
   * @since 0.1.0
   */
  channelOpen: [],

  /**
   * Event triggered when socket connection to Signaling server has closed.
   * @event channelClose
   * @param {JSON} session The socket connection session information.
   *   <small>Object signature matches the <code>session</code> parameter payload received in the
   *   <a href="#event_channelOpen"><code>channelOpen</code> event</a>.</small>
   * @for Skylink
   * @since 0.1.0
   */
  channelClose: [],

  /**
   * <blockquote class="info">
   *   Note that this is used only for SDK developer purposes.
   * </blockquote>
   * Event triggered when receiving socket message from the Signaling server.
   * @event channelMessage
   * @param {JSON} message The socket message object.
   * @param {JSON} session The socket connection session information.
   *   <small>Object signature matches the <code>session</code> parameter payload received in the
   *   <a href="#event_channelOpen"><code>channelOpen</code> event</a>.</small>
   * @for Skylink
   * @since 0.1.0
   */
  channelMessage: [],

  /**
   * <blockquote class="info">
   *   This may be caused by Javascript errors in the event listener when subscribing to events.<br>
   *   It may be resolved by checking for code errors in your Web App in the event subscribing listener.<br>
   *   <code>skylinkDemo.on("eventName", function () { // Errors here });</code>
   * </blockquote>
   * Event triggered when socket connection encountered exception.
   * @event channelError
   * @param {Error|String} error The error object.
   * @param {JSON} session The socket connection session information.
   *   <small>Object signature matches the <code>session</code> parameter payload received in the
   *   <a href="#event_channelOpen"><code>channelOpen</code> event</a>.</small>
   * @for Skylink
   * @since 0.1.0
   */
  channelError: [],

  /**
   * Event triggered when attempting to establish socket connection to Signaling server when failed.
   * @event channelRetry
   * @param {String} fallbackType The current fallback state.
   *   [Rel: Skylink.SOCKET_FALLBACK]
   * @param {Number} currentAttempt The current socket reconnection attempt.
   * @param {JSON} session The socket connection session information.
   *   <small>Object signature matches the <code>session</code> parameter payload received in the
   *   <a href="#event_channelOpen"><code>channelOpen</code> event</a>.</small>
   * @for Skylink
   * @since 0.5.6
   */
  channelRetry: [],

  /**
   * Event triggered when attempt to establish socket connection to Signaling server has failed.
   * @event socketError
   * @param {Number} errorCode The socket connection error code.
   *   [Rel: Skylink.SOCKET_ERROR]
   * @param {Error|String|Number} error The error object.
   * @param {String} type The fallback state of the socket connection attempt.
   *   [Rel: Skylink.SOCKET_FALLBACK]
   * @param {JSON} session The socket connection session information.
   *   <small>Object signature matches the <code>session</code> parameter payload received in the
   *   <a href="#event_channelOpen"><code>channelOpen</code> event</a>.</small>
   * @for Skylink
   * @since 0.5.5
   */
  socketError: [],

  /**
   * Event triggered when <a href="#method_init"><code>init()</code> method</a> ready state changes.
   * @event readyStateChange
   * @param {Number} readyState The current <code>init()</code> ready state.
   *   [Rel: Skylink.READY_STATE_CHANGE]
   * @param {JSON} [error] The error result.
   *   <small>Defined only when <code>state</code> is <code>ERROR</code>.</small>
   * @param {Number} error.status The HTTP status code when failed.
   * @param {Number} error.errorCode The ready state change failure code.
   *   [Rel: Skylink.READY_STATE_CHANGE_ERROR]
   * @param {Error} error.content The error object.
   * @param {String} room The Room to The Room to retrieve session token for.
   * @for Skylink
   * @since 0.4.0
   */
  readyStateChange: [],

  /**
   * Event triggered when a Peer connection establishment state has changed.
   * @event handshakeProgress
   * @param {String} state The current Peer connection establishment state.
   *   [Rel: Skylink.HANDSHAKE_PROGRESS]
   * @param {String} peerId The Peer ID.
   * @param {Error|String} [error] The error object.
   *   <small>Defined only when <code>state</code> is <code>ERROR</code>.</small>
   * @for Skylink
   * @since 0.3.0
   */
  handshakeProgress: [],

  /**
   * <blockquote class="info">
   *   Learn more about how ICE works in this
   *   <a href="https://temasys.com.sg/ice-what-is-this-sorcery/">article here</a>.
   * </blockquote>
   * Event triggered when a Peer connection ICE gathering state has changed.
   * @event candidateGenerationState
   * @param {String} state The current Peer connection ICE gathering state.
   *   [Rel: Skylink.CANDIDATE_GENERATION_STATE]
   * @param {String} peerId The Peer ID.
   * @for Skylink
   * @since 0.1.0
   */
  candidateGenerationState: [],

  /**
   * <blockquote class="info">
   *   Learn more about how ICE works in this
   *   <a href="https://temasys.com.sg/ice-what-is-this-sorcery/">article here</a>.
   * </blockquote>
   * Event triggered when a Peer connection session description exchanging state has changed.
   * @event peerConnectionState
   * @param {String} state The current Peer connection session description exchanging state.
   *   [Rel: Skylink.PEER_CONNECTION_STATE]
   * @param {String} peerId The Peer ID.
   * @for Skylink
   * @since 0.1.0
   */
  peerConnectionState: [],

  /**
   * <blockquote class="info">
   *   Learn more about how ICE works in this
   *   <a href="https://temasys.com.sg/ice-what-is-this-sorcery/">article here</a>.
   * </blockquote>
   * Event triggered when a Peer connection ICE connection state has changed.
   * @event iceConnectionState
   * @param {String} state The current Peer connection ICE connection state.
   *   [Rel: Skylink.ICE_CONNECTION_STATE]
   * @param {String} peerId The Peer ID.
   * @for Skylink
   * @since 0.1.0
   */
  iceConnectionState: [],

  /**
   * Event triggered when retrieval of Stream failed.
   * @event mediaAccessError
   * @param {Error|String} error The error object.
   * @param {Boolean} isScreensharing The flag if event occurred during
   *   <a href="#method_shareScreen"><code>shareScreen()</code> method</a> and not
   *   <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a>.
   * @param {Boolean} isAudioFallbackError The flag if event occurred during
   *   retrieval of audio tracks only when <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a>
   *   had failed to retrieve both audio and video tracks.
   * @for Skylink
   * @since 0.1.0
   */
  mediaAccessError: [],

  /**
   * Event triggered when Stream retrieval fallback state has changed.
   * @event mediaAccessFallback
   * @param {JSON} error The error result.
   * @param {Error|String} error.error The error object.
   * @param {JSON} [error.diff=null] The list of excepted but received audio and video tracks in Stream.
   *   <small>Defined only when <code>state</code> payload is <code>FALLBACKED</code>.</small>
   * @param {JSON} error.diff.video The expected and received video tracks.
   * @param {Number} error.diff.video.expected The expected video tracks.
   * @param {Number} error.diff.video.received The received video tracks.
   * @param {JSON} error.diff.audio The expected and received audio tracks.
   * @param {Number} error.diff.audio.expected The expected audio tracks.
   * @param {Number} error.diff.audio.received The received audio tracks.
   * @param {Number} state The fallback state.
   *   [Rel: Skylink.MEDIA_ACCESS_FALLBACK_STATE]
   * @param {Boolean} isScreensharing The flag if event occurred during
   *   <a href="#method_shareScreen"><code>shareScreen()</code> method</a> and not
   *   <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a>.
   * @param {Boolean} isAudioFallback The flag if event occurred during
   *   retrieval of audio tracks only when <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a>
   *   had failed to retrieve both audio and video tracks.
   * @param {String} streamId The Stream ID.
   *   <small>Defined only when <code>state</code> payload is <code>FALLBACKED</code>.</small>
   * @for Skylink
   * @since 0.6.3
   */
  mediaAccessFallback: [],

  /**
   * Event triggered when retrieval of Stream is successful.
   * @event mediaAccessSuccess
   * @param {MediaStream} stream The Stream object.
   *   <small>To attach it to an element: <code>attachMediaStream(videoElement, stream);</code>.</small>
   * @param {Boolean} isScreensharing The flag if event occurred during
   *   <a href="#method_shareScreen"><code>shareScreen()</code> method</a> and not
   *   <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a>.
   * @param {Boolean} isAudioFallback The flag if event occurred during
   *   retrieval of audio tracks only when <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a>
   *   had failed to retrieve both audio and video tracks.
   * @param {String} streamId The Stream ID.
   * @for Skylink
   * @since 0.1.0
   */
  mediaAccessSuccess: [],

  /**
   * Event triggered when retrieval of Stream is required to complete <a href="#method_joinRoom">
   * <code>joinRoom()</code> method</a> request.
   * @event mediaAccessRequired
   * @for Skylink
   * @since 0.5.5
   */
  mediaAccessRequired: [],

  /**
   * Event triggered when Stream has stopped streaming.
   * @event mediaAccessStopped
   * @param {Boolean} isScreensharing The flag if event occurred during
   *   <a href="#method_shareScreen"><code>shareScreen()</code> method</a> and not
   *   <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a>.
   * @param {Boolean} isAudioFallback The flag if event occurred during
   *   retrieval of audio tracks only when <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a>
   *   had failed to retrieve both audio and video tracks.
   * @param {String} streamId The Stream ID.
   * @for Skylink
   * @since 0.5.6
   */
  mediaAccessStopped: [],

  /**
   * Event triggered when a Peer joins the room.
   * @event peerJoined
   * @param {String} peerId The Peer ID.
   * @param {JSON} peerInfo The Peer session information.
   * @param {JSON|String} peerInfo.userData The Peer current custom data.
   * @param {JSON} peerInfo.settings The Peer sending Stream settings.
   * @param {Boolean|JSON} peerInfo.settings.audio The Peer Stream audio settings.
   *   <small>When defined as <code>false</code>, it means there is no audio being sent from Peer.</small>
   *   <small>When defined as <code>true</code>, the <code>peerInfo.settings.audio.stereo</code> value is
   *   considered as <code>false</code> and the <code>peerInfo.settings.audio.exactConstraints</code>
   *   value is considered as <code>false</code>.</small>
   * @param {Boolean} peerInfo.settings.audio.stereo The flag if stereo band is configured
   *   when encoding audio codec is <a href="#attr_AUDIO_CODEC"><code>OPUS</code></a> for receiving audio data.
   * @param {Boolean} [peerInfo.settings.audio.usedtx] <blockquote class="info">
   *   Note that this feature might not work depending on the browser support and implementation.</blockquote>
   *   The flag if DTX (Discontinuous Transmission) is configured when encoding audio codec
   *   is <a href="#attr_AUDIO_CODEC"><code>OPUS</code></a> for sending audio data.
   *   <small>This might help to reduce bandwidth it reduces the bitrate during silence or background noise.</small>
   *   <small>When not defined, the default browser configuration is used.</small>
   * @param {Boolean} [peerInfo.settings.audio.useinbandfec] <blockquote class="info">
   *   Note that this feature might not work depending on the browser support and implementation.</blockquote>
   *   The flag if capability to take advantage of in-band FEC (Forward Error Correction) is
   *   configured when encoding audio codec is <a href="#attr_AUDIO_CODEC"><code>OPUS</code></a> for sending audio data.
   *   <small>This might help to reduce the harm of packet loss by encoding information about the previous packet.</small>
   *   <small>When not defined, the default browser configuration is used.</small>
   * @param {Number} [peerInfo.settings.audio.maxplaybackrate] <blockquote class="info">
   *   Note that this feature might not work depending on the browser support and implementation.</blockquote>
   *   The maximum output sampling rate rendered in Hertz (Hz) when encoding audio codec is
   *   <a href="#attr_AUDIO_CODEC"><code>OPUS</code></a> for sending audio data.
   *   <small>This value must be between <code>8000</code> to <code>48000</code>.</small>
   *   <small>When not defined, the default browser configuration is used.</small>
   * @param {Boolean} peerInfo.settings.audio.echoCancellation The flag if echo cancellation is enabled for audio tracks.
   * @param {Array} [peerInfo.settings.audio.optional] The Peer Stream <code>navigator.getUserMedia()</code> API
   *   <code>audio: { optional [..] }</code> property.
   * @param {String} [peerInfo.settings.audio.deviceId] The Peer Stream audio track source ID of the device used.
   * @param {Boolean} peerInfo.settings.audio.exactConstraints The flag if Peer Stream audio track is sending exact
   *   requested values of <code>peerInfo.settings.audio.deviceId</code> when provided.
   * @param {Boolean|JSON} peerInfo.settings.video The Peer Stream video settings.
   *   <small>When defined as <code>false</code>, it means there is no video being sent from Peer.</small>
   *   <small>When defined as <code>true</code>, the <code>peerInfo.settings.video.screenshare</code> value is
   *   considered as <code>false</code>  and the <code>peerInfo.settings.video.exactConstraints</code>
   *   value is considered as <code>false</code>.</small>
   * @param {JSON} [peerInfo.settings.video.resolution] The Peer Stream video resolution.
   *   [Rel: Skylink.VIDEO_RESOLUTION]
   * @param {Number|JSON} peerInfo.settings.video.resolution.width The Peer Stream video resolution width or
   *   video resolution width settings.
   *   <small>When defined as a JSON object, it is the user set resolution width settings with (<code>"min"</code> or
   *   <code>"max"</code> or <code>"ideal"</code> or <code>"exact"</code> etc configurations).</small>
   * @param {Number|JSON} peerInfo.settings.video.resolution.height The Peer Stream video resolution height or
   *   video resolution height settings.
   *   <small>When defined as a JSON object, it is the user set resolution height settings with (<code>"min"</code> or
   *   <code>"max"</code> or <code>"ideal"</code> or <code>"exact"</code> etc configurations).</small>
   * @param {Number|JSON} [peerInfo.settings.video.frameRate] The Peer Stream video
   *   <a href="https://en.wikipedia.org/wiki/Frame_rate">frameRate</a> per second (fps) or video frameRate settings.
   *   <small>When defined as a JSON object, it is the user set frameRate settings with (<code>"min"</code> or
   *   <code>"max"</code> or <code>"ideal"</code> or <code>"exact"</code> etc configurations).</small>
   * @param {Boolean} peerInfo.settings.video.screenshare The flag if Peer Stream is a screensharing Stream.
   * @param {Array} [peerInfo.settings.video.optional] The Peer Stream <code>navigator.getUserMedia()</code> API
   *   <code>video: { optional [..] }</code> property.
   * @param {String} [peerInfo.settings.video.deviceId] The Peer Stream video track source ID of the device used.
   * @param {Boolean} peerInfo.settings.video.exactConstraints The flag if Peer Stream video track is sending exact
   *   requested values of <code>peerInfo.settings.video.resolution</code>,
   *   <code>peerInfo.settings.video.frameRate</code> and <code>peerInfo.settings.video.deviceId</code>
   *   when provided.
   * @param {String|JSON} [peerInfo.settings.video.facingMode] The Peer Stream video camera facing mode.
   *   <small>When defined as a JSON object, it is the user set facingMode settings with (<code>"min"</code> or
   *   <code>"max"</code> or <code>"ideal"</code> or <code>"exact"</code> etc configurations).</small>
   * @param {JSON} peerInfo.settings.bandwidth The maximum streaming bandwidth sent from Peer.
   * @param {Number} [peerInfo.settings.bandwidth.audio] The maximum audio streaming bandwidth sent from Peer.
   * @param {Number} [peerInfo.settings.bandwidth.video] The maximum video streaming bandwidth sent from Peer.
   * @param {Number} [peerInfo.settings.bandwidth.data] The maximum data streaming bandwidth sent from Peer.
   * @param {JSON} peerInfo.settings.googleXBandwidth <blockquote class="info">
   *   Note that this feature might not work depending on the browser support and implementation,
   *   and its properties and values are only defined for User's end and cannot be viewed
   *   from Peer's end (when <code>isSelf</code> value is <code>false</code>).</blockquote>
   *   The experimental google video streaming bandwidth sent to Peers.
   * @param {Number} [peerInfo.settings.googleXBandwidth.min] The minimum experimental google video streaming bandwidth sent to Peers.
   * @param {Number} [peerInfo.settings.googleXBandwidth.max] The maximum experimental google video streaming bandwidth sent to Peers.
   * @param {JSON} peerInfo.mediaStatus The Peer Stream muted settings.
   * @param {Boolean} peerInfo.mediaStatus.audioMuted The flag if Peer Stream audio tracks is muted or not.
   *   <small>If Peer <code>peerInfo.settings.audio</code> is false, this will be defined as <code>true</code>.</small>
   * @param {Boolean} peerInfo.mediaStatus.videoMuted The flag if Peer Stream video tracks is muted or not.
   *   <small>If Peer <code>peerInfo.settings.video</code> is false, this will be defined as <code>true</code>.</small>
   * @param {JSON} peerInfo.agent The Peer agent information.
   * @param {String} peerInfo.agent.name The Peer agent name.
   *   <small>Data may be accessing browser or non-Web SDK name.</small>
   * @param {Number} peerInfo.agent.version The Peer agent version.
   *   <small>Data may be accessing browser or non-Web SDK version. If the original value is <code>"0.9.6.1"</code>,
   *   it will be interpreted as <code>0.90601</code> where <code>0</code> helps to seperate the minor dots.</small>
   * @param {String} [peerInfo.agent.os] The Peer platform name.
   *  <small>Data may be accessing OS platform version from Web SDK.</small>
   * @param {String} [peerInfo.agent.pluginVersion] The Peer Temasys Plugin version.
   *  <small>Defined only when Peer is using the Temasys Plugin (IE / Safari).</small>
   * @param {String} peerInfo.agent.DTProtocolVersion The Peer data transfer (DT) protocol version.
   * @param {String} peerInfo.agent.SMProtocolVersion The Peer signaling message (SM) protocol version.
   * @param {String} peerInfo.room The Room Peer is from.
   * @param {JSON} peerInfo.config The Peer connection configuration.
   * @param {Boolean} peerInfo.config.enableIceTrickle The flag if Peer connection has
   *   trickle ICE enabled or faster connectivity.
   * @param {Boolean} peerInfo.config.enableDataChannel The flag if Datachannel connections would be enabled for Peer.
   * @param {Boolean} peerInfo.config.enableIceRestart The flag if Peer connection has ICE connection restart support.
   *   <small>Note that ICE connection restart support is not honoured for MCU enabled Peer connection.</small>
   * @param {Number} peerInfo.config.priorityWeight The flag if Peer or User should be the offerer.
   *   <small>If User's <code>priorityWeight</code> is higher than Peer's, User is the offerer, else Peer is.
   *   However for the case where the MCU is connected, User will always be the offerer.</small>
   * @param {Boolean} peerInfo.config.publishOnly The flag if Peer is publishing only stream but not receiving streams.
   * @param {Boolean} peerInfo.config.receiveOnly The flag if Peer is receiving only streams but not publishing stream.
   * @param {String} [peerInfo.parentId] The parent Peer ID that it is matched to for multi-streaming connections.
   * @param {Boolean} isSelf The flag if Peer is User.
   * @for Skylink
   * @since 0.5.2
   */
  peerJoined: [],

  /**
   * Event triggered when a Peer connection has been refreshed.
   * @event peerRestart
   * @param {String} peerId The Peer ID.
   * @param {JSON} peerInfo The Peer session information.
   *   <small>Object signature matches the <code>peerInfo</code> parameter payload received in the
   *   <a href="#event_peerJoined"><code>peerJoined</code> event</a>.</small>
   * @param {Boolean} isSelfInitiateRestart The flag if User is initiating the Peer connection refresh.
   * @param {Boolean} isIceRestart The flag if Peer connection ICE connection will restart.
   * @for Skylink
   * @since 0.5.5
   */
  peerRestart: [],

  /**
   * Event triggered when a Peer session information has been updated.
   * @event peerUpdated
   * @param {String} peerId The Peer ID.
   * @param {JSON} peerInfo The Peer session information.
   *   <small>Object signature matches the <code>peerInfo</code> parameter payload received in the
   *   <a href="#event_peerJoined"><code>peerJoined</code> event</a>.</small>
   * @param {Boolean} isSelf The flag if Peer is User.
   * @for Skylink
   * @since 0.5.2
   */
  peerUpdated: [],

  /**
   * Event triggered when a Peer leaves the room.
   * @event peerLeft
   * @param {String} peerId The Peer ID.
   * @param {JSON} peerInfo The Peer session information.
   *   <small>Object signature matches the <code>peerInfo</code> parameter payload received in the
   *   <a href="#event_peerJoined"><code>peerJoined</code> event</a>.</small>
   * @param {Boolean} isSelf The flag if Peer is User.
   * @for Skylink
   * @since 0.5.2
   */
  peerLeft: [],

  /**
   * Event triggered when Room session has ended abruptly due to network disconnections.
   * @event sessionDisconnect
   * @param {String} peerId The User's Room session Peer ID.
   * @param {JSON} peerInfo The User's Room session information.
   *   <small>Object signature matches the <code>peerInfo</code> parameter payload received in the
   *   <a href="#event_peerJoined"><code>peerJoined</code> event</a>.</small>
   * @for Skylink
   * @since 0.6.10
   */
  sessionDisconnect: [],

  /**
   * Event triggered when receiving Peer Stream.
   * @event incomingStream
   * @param {String} peerId The Peer ID.
   * @param {MediaStream} stream The Stream object.
   *   <small>To attach it to an element: <code>attachMediaStream(videoElement, stream);</code>.</small>
   * @param {Boolean} isSelf The flag if Peer is User.
   * @param {JSON} peerInfo The Peer session information.
   *   <small>Object signature matches the <code>peerInfo</code> parameter payload received in the
   *   <a href="#event_peerJoined"><code>peerJoined</code> event</a>.</small>
   * @param {Boolean} isScreensharing The flag if Peer Stream is a screensharing Stream.
   * @param {String} streamId The Stream ID.
   * @for Skylink
   * @since 0.5.5
   */
  incomingStream: [],

  /**
   * Event triggered when receiving message from Peer.
   * @event incomingMessage
   * @param {JSON} message The message result.
   * @param {JSON|String} message.content The message object.
   * @param {String} message.senderPeerId The sender Peer ID.
   * @param {String|Array} [message.targetPeerId] The value of the <code>targetPeerId</code>
   *   defined in <a href="#method_sendP2PMessage"><code>sendP2PMessage()</code> method</a> or
   *   <a href="#method_sendMessage"><code>sendMessage()</code> method</a>.
   *   <small>Defined as User's Peer ID when <code>isSelf</code> payload value is <code>false</code>.</small>
   *   <small>Defined as <code>null</code> when provided <code>targetPeerId</code> in
   *   <a href="#method_sendP2PMessage"><code>sendP2PMessage()</code> method</a> or
   *   <a href="#method_sendMessage"><code>sendMessage()</code> method</a> is not defined.</small>
   * @param {Array} [message.listOfPeers] The list of Peers that the message has been sent to.
   *  <small>Defined only when <code>isSelf</code> payload value is <code>true</code>.</small>
   * @param {Boolean} message.isPrivate The flag if message is targeted or not, basing
   *   off the <code>targetPeerId</code> parameter being defined in
   *   <a href="#method_sendP2PMessage"><code>sendP2PMessage()</code> method</a> or
   *   <a href="#method_sendMessage"><code>sendMessage()</code> method</a>.
   * @param {Boolean} message.isDataChannel The flag if message is sent from
   *   <a href="#method_sendP2PMessage"><code>sendP2PMessage()</code> method</a>.
   * @param {String} peerId The Peer ID.
   * @param {JSON} peerInfo The Peer session information.
   *   <small>Object signature matches the <code>peerInfo</code> parameter payload received in the
   *   <a href="#event_peerJoined"><code>peerJoined</code> event</a>.</small>
   * @param {Boolean} isSelf The flag if Peer is User.
   * @for Skylink
   * @since 0.5.2
   */
  incomingMessage: [],

  /**
   * Event triggered when receiving completed data transfer from Peer.
   * @event incomingData
   * @param {Blob|String} data The data.
   * @param {String} transferId The data transfer ID.
   * @param {String} peerId The Peer ID.
   * @param {JSON} transferInfo The data transfer information.
   *   <small>Object signature matches the <code>transferInfo</code> parameter payload received in the
   *   <a href="#event_dataTransferState"><code>dataTransferState</code> event</a>
   *   except without the <code>data</code> property.</small>
   * @param {Boolean} isSelf The flag if Peer is User.
   * @for Skylink
   * @since 0.6.1
   */
  incomingData: [],

  /**
   * Event triggered when receiving data stream chunk.
   * @event incomingDataStream
   * @param {JSON} data The data result.
   * @param {JSON|String} data.content The data stream chunk.
   * @param {String} data.senderPeerId The sender Peer ID.
   * @param {String|Array} [data.targetPeerId] The value of the <code>targetPeerId</code>
   *   defined in <a href="#method_streamData"><code>streamData()</code> method</a>.
   *   <small>Defined as User's Peer ID when <code>isSelf</code> payload value is <code>false</code>.</small>
   *   <small>Defined as <code>null</code> when provided <code>targetPeerId</code> in
   *   <a href="#method_streamData"><code>streamData()</code> method</a> is not defined.</small>
   * @param {Array} [data.listOfPeers] The list of Peers that the data stream has been sent to.
   *  <small>Defined only when <code>isSelf</code> payload value is <code>true</code>.</small>
   * @param {Boolean} data.isPrivate The flag if data stream is targeted or not, basing
   *   off the <code>targetPeerId</code> parameter being defined in
   *   <a href="#method_streamData"><code>streamData()</code> method</a>.
   * @param {Number} data.chunkSize The data stream chunk size.
   * @param {String} data.chunkType The data stream chunk type.
   *   [Rel: Skylink.DATA_TRANSFER_DATA_TYPE]
   * @param {String} peerId The Peer ID.
   * @param {Boolean} isSelf The flag if Peer is User.
   * @for Skylink
   * @since 0.6.18
   */
  incomingDataStream: [],

  /**
   * Event triggered when receiving upload data transfer from Peer.
   * @event incomingDataRequest
   * @param {String} transferId The transfer ID.
   * @param {String} peerId The Peer ID.
   * @param {String} transferInfo The data transfer information.
   *   <small>Object signature matches the <code>transferInfo</code> parameter payload received in the
   *   <a href="#event_dataTransferState"><code>dataTransferState</code> event</a>.</small>
   * @param {Boolean} isSelf The flag if Peer is User.
   * @for Skylink
   * @since 0.6.1
   */
  incomingDataRequest: [],

  /**
   * Event triggered when Room locked status has changed.
   * @event roomLock
   * @param {Boolean} isLocked The flag if Room is locked.
   * @param {String} peerId The Peer ID.
   * @param {JSON} peerInfo The Peer session information.
   *   <small>Object signature matches the <code>peerInfo</code> parameter payload received in the
   *   <a href="#event_peerJoined"><code>peerJoined</code> event</a>.</small>
   * @param {Boolean} isSelf The flag if User changed the Room locked status.
   * @for Skylink
   * @since 0.5.2
   */
  roomLock: [],

  /**
   * Event triggered when a Datachannel connection state has changed.
   * @event dataChannelState
   * @param {String} state The current Datachannel connection state.
   *   [Rel: Skylink.DATA_CHANNEL_STATE]
   * @param {String} peerId The Peer ID.
   * @param {Error} [error] The error object.
   *   <small>Defined only when <code>state</code> payload is <code>ERROR</code> or <code>SEND_MESSAGE_ERROR</code>.</small>
   * @param {String} channelName The Datachannel ID.
   * @param {String} channelType The Datachannel type.
   *   [Rel: Skylink.DATA_CHANNEL_TYPE]
   * @param {String} messageType The Datachannel sending Datachannel message error type.
   *   <small>Defined only when <cod>state</code> payload is <code>SEND_MESSAGE_ERROR</code>.</small>
   *   [Rel: Skylink.DATA_CHANNEL_MESSAGE_ERROR]
   * @for Skylink
   * @since 0.1.0
   */
  dataChannelState: [],

  /**
   * Event triggered when a data transfer state has changed.
   * @event dataTransferState
   * @param {String} state The current data transfer state.
   *   [Rel: Skylink.DATA_TRANSFER_STATE]
   * @param {String} transferId The data transfer ID.
   * @param {String} peerId The Peer ID.
   * @param {JSON} transferInfo The data transfer information.
   * @param {Blob|String} [transferInfo.data] The data object.
   *   <small>Defined only when <code>state</code> payload is <code>UPLOAD_STARTED</code> or
   *   <code>DOWNLOAD_COMPLETED</code>.</small>
   * @param {String} transferInfo.name The data transfer name.
   * @param {Number} transferInfo.size The data transfer data object size.
   * @param {String} transferInfo.dataType The data transfer session type.
   *   [Rel: Skylink.DATA_TRANSFER_SESSION_TYPE]
   * @param {String} transferInfo.chunkType The data transfer type of data chunk being used to send to Peer for transfers.
   *   <small>For <a href="#method_sendBlobData"><code>sendBlobData()</code> method</a> data transfers, the
   *   initial data chunks value may change depending on the currently received data chunk type or the
   *   agent supported sending type of data chunks.</small>
   *   <small>For <a href="#method_sendURLData"><code>sendURLData()</code> method</a> data transfers, it is
   *   <code>STRING</code> always.</small>
   *   [Rel: Skylink.DATA_TRANSFER_DATA_TYPE]
   * @param {String} [transferInfo.mimeType] The data transfer data object MIME type.
   *   <small>Defined only when <a href="#method_sendBlobData"><code>sendBlobData()</code> method</a>
   *   data object sent MIME type information is defined.</small>
   * @param {Number} transferInfo.chunkSize The data transfer data chunk size.
   * @param {Number} transferInfo.percentage The data transfer percentage of completion progress.
   * @param {Number} transferInfo.timeout The flag if message is targeted or not, basing
   *   off the <code>targetPeerId</code> parameter being defined in
   *   <a href="#method_sendURLData"><code>sendURLData()</code> method</a> or
   *   <a href="#method_sendBlobData"><code>sendBlobData()</code> method</a>.
   * @param {Boolean} transferInfo.isPrivate The flag if message is targeted or not, basing
   *   off the <code>targetPeerId</code> parameter being defined in
   *   <a href="#method_sendBlobData"><code>sendBlobData()</code> method</a> or
   *   <a href="#method_sendURLData"><code>sendURLData()</code> method</a>.
   * @param {String} transferInfo.direction The data transfer direction.
   *   [Rel: Skylink.DATA_TRANSFER_TYPE]
   * @param {JSON} [error] The error result.
   *   <small>Defined only when <code>state</code> payload is <code>ERROR</code>, <code>CANCEL</code>,
   *   <code>REJECTED</code> or <code>USER_REJECTED</code>.</small>
   * @param {Error|String} error.message The error object.
   * @param {String} error.transferType The data transfer direction from where the error occurred.
   *   [Rel: Skylink.DATA_TRANSFER_TYPE]
   * @for Skylink
   * @since 0.4.1
   */
  dataTransferState: [],

  /**
   * Event triggered when Signaling server reaction state has changed.
   * @event systemAction
   * @param {String} action The current Signaling server reaction state.
   *   [Rel: Skylink.SYSTEM_ACTION]
   * @param {String} message The message.
   * @param {String} reason The Signaling server reaction state reason of action code.
   *   [Rel: Skylink.SYSTEM_ACTION_REASON]
   * @for Skylink
   * @since 0.5.1
   */
  systemAction: [],

  /**
   * Event triggered when a server Peer joins the room.
   * @event serverPeerJoined
   * @param {String} peerId The Peer ID.
   * @param {String} serverPeerType The server Peer type
   *   [Rel: Skylink.SERVER_PEER_TYPE]
   * @for Skylink
   * @since 0.6.1
   */
  serverPeerJoined: [],

  /**
   * Event triggered when a server Peer leaves the room.
   * @event serverPeerLeft
   * @param {String} peerId The Peer ID.
   * @param {String} serverPeerType The server Peer type
   *   [Rel: Skylink.SERVER_PEER_TYPE]
   * @for Skylink
   * @since 0.6.1
   */
  serverPeerLeft: [],

  /**
   * Event triggered when a server Peer connection has been refreshed.
   * @event serverPeerRestart
   * @param {String} peerId The Peer ID.
   * @param {String} serverPeerType The server Peer type
   *   [Rel: Skylink.SERVER_PEER_TYPE]
   * @for Skylink
   * @since 0.6.1
   */
  serverPeerRestart: [],

  /**
   * Event triggered when a Peer Stream streaming has stopped.
   * <small>Note that it may not be the currently sent Stream to User, and it also triggers
   * when User leaves the Room for any currently sent Stream to User from Peer.</small>
   * @event streamEnded
   * @param {String} peerId The Peer ID.
   * @param {JSON} peerInfo The Peer session information.
   *   <small>Object signature matches the <code>peerInfo</code> parameter payload received in the
   *   <a href="#event_peerJoined"><code>peerJoined</code> event</a>.</small>
   * @param {Boolean} isSelf The flag if Peer is User.
   * @param {Boolean} isScreensharing The flag if Peer Stream is a screensharing Stream.
   * @param {String} streamId The Stream ID.
   * @for Skylink
   * @since 0.5.10
   */
  streamEnded: [],

  /**
   * Event triggered when Peer Stream audio or video tracks has been muted / unmuted.
   * @event streamMuted
   * @param {String} peerId The Peer ID.
   * @param {JSON} peerInfo The Peer session information.
   *   <small>Object signature matches the <code>peerInfo</code> parameter payload received in the
   *   <a href="#event_peerJoined"><code>peerJoined</code> event</a>.</small>
   * @param {Boolean} isSelf The flag if Peer is User.
   * @param {Boolean} isScreensharing The flag if Peer Stream is a screensharing Stream.
   * @for Skylink
   * @since 0.6.1
   */
  streamMuted: [],

  /**
   * Event triggered when <a href="#method_getPeers"><code>getPeers()</code> method</a> retrieval state changes.
   * @event getPeersStateChange
   * @param {String} state The current <code>getPeers()</code> retrieval state.
   *   [Rel: Skylink.GET_PEERS_STATE]
   * @param {String} privilegedPeerId The User's privileged Peer ID.
   * @param {JSON} peerList The list of Peer IDs Rooms within the same App space.
   * @param {Array} peerList.#room The list of Peer IDs associated with the Room defined in <code>#room</code> property.
   * @for Skylink
   * @since 0.6.1
   */
  getPeersStateChange: [],

  /**
   * Event triggered when <a href="#method_introducePeer"><code>introducePeer()</code> method</a>
   * introduction request state changes.
   * @event introduceStateChange
   * @param {String} state The current <code>introducePeer()</code> introduction request state.
   *   [Rel: Skylink.INTRODUCE_STATE]
   * @param {String} privilegedPeerId The User's privileged Peer ID.
   * @param {String} sendingPeerId The Peer ID to be connected with <code>receivingPeerId</code>.
   * @param {String} receivingPeerId The Peer ID to be connected with <code>sendingPeerId</code>.
   * @param {String} [reason] The error object.
   *   <small>Defined only when <code>state</code> payload is <code>ERROR</code>.</small>
   * @for Skylink
   * @since 0.6.1
   */
  introduceStateChange: [],

  /**
   * Event triggered when recording session state has changed.
   * @event recordingState
   * @param {Number} state The current recording session state.
   *   [Rel: Skylink.RECORDING_STATE]
   * @param {String} recordingId The recording session ID.
   * @param {JSON} link The recording session mixin videos link in
   *   <a href="https://en.wikipedia.org/wiki/MPEG-4_Part_14">MP4</a> format.
   *   <small>Defined only when <code>state</code> payload is <code>LINK</code>.</small>
   * @param {String} link.#peerId The recording session recorded Peer only video associated
   *   with the Peer ID defined in <code>#peerId</code> property.
   *   <small>If <code>#peerId</code> value is <code>"mixin"</code>, it means that is the mixin
   *   video of all Peers in the Room.</small>
   * @param {Error|String} error The error object.
   *   <small>Defined only when <code>state</code> payload is <code>ERROR</code>.</small>
   * @beta
   * @for Skylink
   * @since 0.6.16
   */
  recordingState: [],

  /**
   * Event triggered when <a href="#method_getConnectionStatus"><code>getConnectionStatus()</code> method</a>
   * retrieval state changes.
   * @event getConnectionStatusStateChange
   * @param {Number} state The current <code>getConnectionStatus()</code> retrieval state.
   *   [Rel: Skylink.GET_CONNECTION_STATUS_STATE]
   * @param {String} peerId The Peer ID.
   * @param {JSON} [stats] The Peer connection current stats.
   *   <small>Defined only when <code>state</code> payload is <code>RETRIEVE_SUCCESS</code>.</small>
   * @param {JSON} stats.raw The Peer connection raw stats before parsing.
   * @param {JSON} stats.audio The Peer connection audio streaming stats.
   * @param {JSON} stats.audio.sending The Peer connection sending audio streaming stats.
   * @param {Number} stats.audio.sending.bytes The Peer connection current sending audio streaming bytes.
   *   <small>Note that value is in bytes so you have to convert that to bits for displaying for an example kbps.</small>
   * @param {Number} stats.audio.sending.totalBytes The Peer connection total sending audio streaming bytes.
   *   <small>Note that value is in bytes so you have to convert that to bits for displaying for an example kbps.</small>
   * @param {Number} stats.audio.sending.packets The Peer connection current sending audio streaming packets.
   * @param {Number} stats.audio.sending.totalPackets The Peer connection total sending audio streaming packets.
   * @param {Number} stats.audio.sending.packetsLost <blockquote class="info">
   *   This property has been deprecated and would be removed in future releases
   *   as it should not be in <code>sending</code> property.
   *   </blockquote> The Peer connection current sending audio streaming packets lost.
   * @param {Number} stats.audio.sending.totalPacketsLost <blockquote class="info">
   *   This property has been deprecated and would be removed in future releases
   *   as it should not be in <code>sending</code> property.
   *   </blockquote> The Peer connection total sending audio streaming packets lost.
   * @param {Number} stats.audio.sending.ssrc The Peer connection sending audio streaming RTP packets SSRC.
   * @param {Number} stats.audio.sending.rtt The Peer connection sending audio streaming RTT (Round-trip delay time).
   *   <small>Defined as <code>0</code> if it's not present in original raw stats before parsing.</small>
   * @param {Number} stats.audio.sending.jitter <blockquote class="info">
   *   This property has been deprecated and would be removed in future releases
   *   as it should not be in <code>sending</code> property.
   *   </blockquote> The Peer connection sending audio streaming RTP packets jitter in seconds.
   *   <small>Defined as <code>0</code> if it's not present in original raw stats before parsing.</small>
   * @param {Number} [stats.audio.sending.jitterBufferMs] <blockquote class="info">
   *   This property has been deprecated and would be removed in future releases
   *   as it should not be in <code>sending</code> property.
   *   </blockquote> The Peer connection sending audio streaming
   *   RTP packets jitter buffer in miliseconds.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} [stats.audio.sending.codec] The Peer connection sending audio streaming selected codec information.
   *   <small>Defined as <code>null</code> if local session description is not available before parsing.</small>
   * @param {String} stats.audio.sending.codec.name The Peer connection sending audio streaming selected codec name.
   * @param {Number} stats.audio.sending.codec.payloadType The Peer connection sending audio streaming selected codec payload type.
   * @param {String} [stats.audio.sending.codec.implementation] The Peer connection sending audio streaming selected codec implementation.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.audio.sending.codec.channels] The Peer connection sending audio streaming selected codec channels (2 for stereo).
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing,
   *   and this is usually present in <code>stats.audio</code> property.</small>
   * @param {Number} [stats.audio.sending.codec.clockRate] The Peer connection sending audio streaming selected codec media sampling rate.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.audio.sending.codec.params] The Peer connection sending audio streaming selected codec parameters.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.audio.sending.inputLevel] The Peer connection sending audio streaming input level.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.audio.sending.echoReturnLoss] The Peer connection sending audio streaming echo return loss in db (decibels).
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.audio.sending.echoReturnLossEnhancement] The Peer connection sending audio streaming
   *   echo return loss enhancement db (decibels).
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} stats.audio.receiving The Peer connection receiving audio streaming stats.
   * @param {Number} stats.audio.receiving.bytes The Peer connection current sending audio streaming bytes.
   *   <small>Note that value is in bytes so you have to convert that to bits for displaying for an example kbps.</small>
   * @param {Number} stats.audio.receiving.totalBytes The Peer connection total sending audio streaming bytes.
   *   <small>Note that value is in bytes so you have to convert that to bits for displaying for an example kbps.</small>
   * @param {Number} stats.audio.receiving.packets The Peer connection current receiving audio streaming packets.
   * @param {Number} stats.audio.receiving.totalPackets The Peer connection total receiving audio streaming packets.
   * @param {Number} stats.audio.receiving.packetsLost The Peer connection current receiving audio streaming packets lost.
   * @param {Number} stats.audio.receiving.fractionLost The Peer connection current receiving audio streaming fraction packets lost.
   * @param {Number} stats.audio.receiving.packetsDiscarded The Peer connection current receiving audio streaming packets discarded.
   * @param {Number} stats.audio.receiving.totalPacketsLost The Peer connection total receiving audio streaming packets lost.
   * @param {Number} stats.audio.receiving.totalPacketsDiscarded The Peer connection total receiving audio streaming packets discarded.
   * @param {Number} stats.audio.receiving.ssrc The Peer connection receiving audio streaming RTP packets SSRC.
   * @param {Number} stats.audio.receiving.jitter The Peer connection receiving audio streaming RTP packets jitter in seconds.
   *   <small>Defined as <code>0</code> if it's not present in original raw stats before parsing.</small>
   * @param {Number} [stats.audio.receiving.jitterBufferMs] The Peer connection receiving audio streaming
   *   RTP packets jitter buffer in miliseconds.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} [stats.audio.receiving.codec] The Peer connection receiving audio streaming selected codec information.
   *   <small>Defined as <code>null</code> if remote session description is not available before parsing.</small>
   *   <small>Note that if the value is polyfilled, the value may not be accurate since the remote Peer can override the selected codec.
   *   The value is derived from the remote session description.</small>
   * @param {String} stats.audio.receiving.codec.name The Peer connection receiving audio streaming selected codec name.
   * @param {Number} stats.audio.receiving.codec.payloadType The Peer connection receiving audio streaming selected codec payload type.
   * @param {String} [stats.audio.receiving.codec.implementation] The Peer connection receiving audio streaming selected codec implementation.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.audio.receiving.codec.channels] The Peer connection receiving audio streaming selected codec channels (2 for stereo).
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing,
   *   and this is usually present in <code>stats.audio</code> property.</small>
   * @param {Number} [stats.audio.receiving.codec.clockRate] The Peer connection receiving audio streaming selected codec media sampling rate.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.audio.receiving.codec.params] The Peer connection receiving audio streaming selected codec parameters.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.audio.receiving.outputLevel] The Peer connection receiving audio streaming output level.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} stats.video The Peer connection video streaming stats.
   * @param {JSON} stats.video.sending The Peer connection sending video streaming stats.
   * @param {Number} stats.video.sending.bytes The Peer connection current sending video streaming bytes.
   *   <small>Note that value is in bytes so you have to convert that to bits for displaying for an example kbps.</small>
   * @param {Number} stats.video.sending.totalBytes The Peer connection total sending video streaming bytes.
   *   <small>Note that value is in bytes so you have to convert that to bits for displaying for an example kbps.</small>
   * @param {Number} stats.video.sending.packets The Peer connection current sending video streaming packets.
   * @param {Number} stats.video.sending.totalPackets The Peer connection total sending video streaming packets.
   * @param {Number} stats.video.sending.packetsLost <blockquote class="info">
   *   This property has been deprecated and would be removed in future releases
   *   as it should not be in <code>sending</code> property.
   *   </blockquote> The Peer connection current sending video streaming packets lost.
   * @param {Number} stats.video.sending.totalPacketsLost <blockquote class="info">
   *   This property has been deprecated and would be removed in future releases
   *   as it should not be in <code>sending</code> property.
   *   </blockquote> The Peer connection total sending video streaming packets lost.
   * @param {Number} stats.video.sending.ssrc The Peer connection sending video streaming RTP packets SSRC.
   * @param {Number} stats.video.sending.rtt The Peer connection sending video streaming RTT (Round-trip delay time).
   *   <small>Defined as <code>0</code> if it's not present in original raw stats before parsing.</small>
   * @param {Number} stats.video.sending.jitter <blockquote class="info">
   *   This property has been deprecated and would be removed in future releases
   *   as it should not be in <code>sending</code> property.
   *   </blockquote> The Peer connection sending video streaming RTP packets jitter in seconds.
   *   <small>Defined as <code>0</code> if it's not present in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.jitterBufferMs] <blockquote class="info">
   *   This property has been deprecated and would be removed in future releases
   *   as it should not be in <code>sending</code> property.
   *   </blockquote> The Peer connection sending video streaming RTP packets jitter buffer in miliseconds.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.qpSum] The Peer connection sending video streaming sum of the QP values of frames passed.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} [stats.video.sending.codec] The Peer connection sending video streaming selected codec information.
   *   <small>Defined as <code>null</code> if local session description is not available before parsing.</small>
   * @param {String} stats.video.sending.codec.name The Peer connection sending video streaming selected codec name.
   * @param {Number} stats.video.sending.codec.payloadType The Peer connection sending video streaming selected codec payload type.
   * @param {String} [stats.video.sending.codec.implementation] The Peer connection sending video streaming selected codec implementation.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.codec.channels] The Peer connection sending video streaming selected codec channels (2 for stereo).
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing,
   *   and this is usually present in <code>stats.audio</code> property.</small>
   * @param {Number} [stats.video.sending.codec.clockRate] The Peer connection sending video streaming selected codec media sampling rate.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.video.sending.codec.params] The Peer connection sending video streaming selected codec parameters.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.frames] The Peer connection sending video streaming frames.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.frameRateInput] The Peer connection sending video streaming fps input.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.frameRateInput] The Peer connection sending video streaming fps input.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.framesDropped] The Peer connection sending video streaming frames dropped.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.frameRateMean] The Peer connection sending video streaming fps mean.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.frameRateStdDev] The Peer connection sending video streaming fps standard deviation.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small> 
   * @param {Number} [stats.video.sending.framesPerSecond] The Peer connection sending video streaming fps.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.framesDecoded] The Peer connection sending video streaming frames decoded.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.framesCorrupted] The Peer connection sending video streaming frames corrupted.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.totalFrames] The Peer connection total sending video streaming frames.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.nacks] The Peer connection current sending video streaming nacks.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.totalNacks] The Peer connection total sending video streaming nacks.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.plis] The Peer connection current sending video streaming plis.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.totalPlis] The Peer connection total sending video streaming plis.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.firs] The Peer connection current sending video streaming firs.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.totalFirs] The Peer connection total sending video streaming firs.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.slis] The Peer connection current sending video streaming slis.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.sending.totalSlis] The Peer connection total sending video streaming slis.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} stats.video.receiving The Peer connection receiving video streaming stats.
   * @param {Number} stats.video.receiving.bytes The Peer connection current receiving video streaming bytes.
   *   <small>Note that value is in bytes so you have to convert that to bits for displaying for an example kbps.</small>
   * @param {Number} stats.video.receiving.totalBytes The Peer connection total receiving video streaming bytes.
   *   <small>Note that value is in bytes so you have to convert that to bits for displaying for an example kbps.</small>
   * @param {Number} stats.video.receiving.packets The Peer connection current receiving video streaming packets.
   * @param {Number} stats.video.receiving.totalPackets The Peer connection total receiving video streaming packets.
   * @param {Number} stats.video.receiving.packetsLost The Peer connection current receiving video streaming packets lost.
   * @param {Number} stats.video.receiving.fractionLost The Peer connection current receiving video streaming fraction packets lost.
   * @param {Number} stats.video.receiving.packetsDiscarded The Peer connection current receiving video streaming packets discarded.
   * @param {Number} stats.video.receiving.totalPacketsLost The Peer connection total receiving video streaming packets lost.
   * @param {Number} stats.video.receiving.totalPacketsDiscarded The Peer connection total receiving video streaming packets discarded.
   * @param {Number} stats.video.receiving.ssrc The Peer connection receiving video streaming RTP packets SSRC.
   * @param {Number} [stats.video.receiving.e2eDelay] The Peer connection receiving video streaming e2e delay.
   *   <small>Defined as <code>null</code> if it's not present in original raw stats before parsing, and that
   *   it finds any existing audio, video or object (plugin) DOM elements that has set with the
   *   Peer remote stream object to parse current time. Note that <code>document.getElementsByTagName</code> function
   *   and DOM <code>.currentTime</code> has to be supported inorder for data to be parsed correctly.</small>
   * @param {Number} stats.video.receiving.jitter The Peer connection receiving video streaming RTP packets jitter in seconds.
   *   <small>Defined as <code>0</code> if it's not present in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.jitterBufferMs] The Peer connection receiving video streaming
   *   RTP packets jitter buffer in miliseconds.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} [stats.video.receiving.codec] The Peer connection receiving video streaming selected codec information.
   *   <small>Defined as <code>null</code> if remote session description is not available before parsing.</small>
   *   <small>Note that if the value is polyfilled, the value may not be accurate since the remote Peer can override the selected codec.
   *   The value is derived from the remote session description.</small>
   * @param {String} stats.video.receiving.codec.name The Peer connection receiving video streaming selected codec name.
   * @param {Number} stats.video.receiving.codec.payloadType The Peer connection receiving video streaming selected codec payload type.
   * @param {String} [stats.video.receiving.codec.implementation] The Peer connection receiving video streaming selected codec implementation.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.codec.channels] The Peer connection receiving video streaming selected codec channels (2 for stereo).
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing,
   *   and this is usually present in <code>stats.audio</code> property.</small>
   * @param {Number} [stats.video.receiving.codec.clockRate] The Peer connection receiving video streaming selected codec media sampling rate.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.video.receiving.codec.params] The Peer connection receiving video streaming selected codec parameters.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.frames] The Peer connection receiving video streaming frames.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.framesOutput] The Peer connection receiving video streaming fps output.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.framesDecoded] The Peer connection receiving video streaming frames decoded.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.frameRateMean] The Peer connection receiving video streaming fps mean.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.frameRateStdDev] The Peer connection receiving video streaming fps standard deviation.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.framesPerSecond] The Peer connection receiving video streaming fps.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.framesDecoded] The Peer connection receiving video streaming frames decoded.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.framesCorrupted] The Peer connection receiving video streaming frames corrupted.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.totalFrames] The Peer connection total receiving video streaming frames.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.nacks] The Peer connection current receiving video streaming nacks.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.totalNacks] The Peer connection total receiving video streaming nacks.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.plis] The Peer connection current receiving video streaming plis.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.totalPlis] The Peer connection total receiving video streaming plis.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.firs] The Peer connection current receiving video streaming firs.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.totalFirs] The Peer connection total receiving video streaming firs.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.slis] The Peer connection current receiving video streaming slis.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Number} [stats.video.receiving.totalPlis] The Peer connection total receiving video streaming slis.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} stats.selectedCandidate The Peer connection selected ICE candidate pair stats.
   * @param {JSON} stats.selectedCandidate.local The Peer connection selected local ICE candidate.
   * @param {String} stats.selectedCandidate.local.ipAddress The Peer connection selected
   *   local ICE candidate IP address.
   * @param {Number} stats.selectedCandidate.local.portNumber The Peer connection selected
   *   local ICE candidate port number.
   * @param {String} stats.selectedCandidate.local.transport The Peer connection selected
   *   local ICE candidate IP transport type.
   * @param {String} stats.selectedCandidate.local.candidateType The Peer connection selected
   *   local ICE candidate type.
   * @param {String} [stats.selectedCandidate.local.turnMediaTransport] The Peer connection possible
   *   transport used when relaying local media to TURN server.
   *   <small>Types are <code>"UDP"</code> (UDP connections), <code>"TCP"</code> (TCP connections) and
   *   <code>"TCP/TLS"</code> (TCP over TLS connections).</small>
   * @param {JSON} stats.selectedCandidate.remote The Peer connection selected remote ICE candidate.
   * @param {String} stats.selectedCandidate.remote.ipAddress The Peer connection selected
   *   remote ICE candidate IP address.
   * @param {Number} stats.selectedCandidate.remote.portNumber The Peer connection selected
   *   remote ICE candidate port number.
   * @param {String} stats.selectedCandidate.remote.transport The Peer connection selected
   *   remote ICE candidate IP transport type.
   * @param {String} stats.selectedCandidate.remote.candidateType The Peer connection selected
   *   remote ICE candidate type.
   
   * @param {Boolean} [stats.selectedCandidate.writable] The flag if Peer has gotten ACK to an ICE request.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {Boolean} [stats.selectedCandidate.readable] The flag if Peer has gotten a valid incoming ICE request.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.rtt] The current STUN connectivity checks RTT (Round-trip delay time).
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.totalRtt] The total STUN connectivity checks RTT (Round-trip delay time).
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} stats.selectedCandidate.requests The ICE connectivity check requests.
   * @param {String} [stats.selectedCandidate.requests.received] The current ICE connectivity check requests received.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.requests.sent] The current ICE connectivity check requests sent.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.requests.totalReceived] The total ICE connectivity check requests received.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.requests.totalSent] The total ICE connectivity check requests sent.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} stats.selectedCandidate.responses The ICE connectivity check responses.
   * @param {String} [stats.selectedCandidate.responses.received] The current ICE connectivity check responses received.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.responses.sent] The current ICE connectivity check responses sent.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.responses.totalReceived] The total ICE connectivity check responses received.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.responses.totalSent] The total ICE connectivity check responses sent.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} stats.selectedCandidate.consentRequests The current ICE consent requests.
   * @param {String} [stats.selectedCandidate.consentRequests.received] The current ICE consent requests received.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.consentRequests.sent] The current ICE consent requests sent.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.consentRequests.totalReceived] The total ICE consent requests received.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.consentRequests.totalSent] The total ICE consent requests sent.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} stats.selectedCandidate.consentResponses The current ICE consent responses.
   * @param {String} [stats.selectedCandidate.consentResponses.received] The current ICE consent responses received.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.consentResponses.sent] The current ICE consent responses sent.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.consentResponses.totalReceived] The total ICE consent responses received.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.selectedCandidate.consentResponses.totalSent] The total ICE consent responses sent.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} stats.certificate The Peer connection DTLS/SRTP exchanged certificates information.
   * @param {JSON} stats.certificate.local The Peer connection local certificate information.
   * @param {String} [stats.certificate.local.fingerprint] The Peer connection local certificate fingerprint.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.certificate.local.fingerprintAlgorithm] The Peer connection local
   *   certificate fingerprint algorithm.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.certificate.local.derBase64] The Peer connection local
   *   base64 certificate in binary DER format encoded in base64.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} stats.certificate.remote The Peer connection remote certificate information.
   * @param {String} [stats.certificate.remote.fingerprint] The Peer connection remote certificate fingerprint.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.certificate.remote.fingerprintAlgorithm] The Peer connection remote
   *   certificate fingerprint algorithm.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.certificate.remote.derBase64] The Peer connection remote
   *   base64 certificate in binary DER format encoded in base64.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.certificate.srtpCipher] The certificates SRTP cipher.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {String} [stats.certificate.dtlsCipher] The certificates DTLS cipher.
   *   <small>Defined as <code>null</code> if it's not available in original raw stats before parsing.</small>
   * @param {JSON} stats.connection The Peer connection object stats.
   * @param {String} stats.connection.iceConnectionState The Peer connection ICE connection state.
   * @param {String} stats.connection.iceGatheringState The Peer connection ICE gathering state.
   * @param {String} stats.connection.signalingState The Peer connection signaling state.
   * @param {JSON} stats.connection.localDescription The Peer connection local session description.
   * @param {String} stats.connection.localDescription.type The Peer connection local session description type.
   *   <small>Defined as <code>null</code> when local session description is not available.</small>
   * @param {String} stats.connection.localDescription.sdp The Peer connection local session description SDP.
   *   <small>Defined as <code>null</code> when local session description is not available.</small>
   * @param {JSON} stats.connection.remoteDescription The Peer connection remote session description.
   * @param {String} stats.connection.remoteDescription.type The Peer connection remote session description type.
   *   <small>Defined as <code>null</code> when remote session description is not available.</small>
   * @param {String} stats.connection.remoteDescription.sdp The Peer connection remote session description sdp.
   *   <small>Defined as <code>null</code> when remote session description is not available.</small>
   * @param {JSON} stats.connection.candidates The Peer connection list of ICE candidates sent or received.
   * @param {JSON} stats.connection.candidates.sending The Peer connection list of local ICE candidates sent.
   * @param {Array} stats.connection.candidates.sending.host The Peer connection list of local
   *   <code>"host"</code> (local network) ICE candidates sent.
   * @param {JSON} stats.connection.candidates.sending.host.#index The Peer connection local
   *   <code>"host"</code> (local network) ICE candidate.
   * @param {String} stats.connection.candidates.sending.host.#index.candidate The Peer connection local
   *   <code>"host"</code> (local network) ICE candidate connection description.
   * @param {String} stats.connection.candidates.sending.host.#index.sdpMid The Peer connection local
   *   <code>"host"</code> (local network) ICE candidate identifier based on the local session description.
   * @param {Number} stats.connection.candidates.sending.host.#index.sdpMLineIndex The Peer connection local
   *   <code>"host"</code> (local network) ICE candidate media description index (starting from <code>0</code>)
   *   based on the local session description.
   * @param {Array} stats.connection.candidates.sending.srflx The Peer connection list of local
   *   <code>"srflx"</code> (STUN) ICE candidates sent.
   * @param {JSON} stats.connection.candidates.sending.srflx.#index The Peer connection local
   *   <code>"srflx"</code> (STUN) ICE candidate.
   * @param {String} stats.connection.candidates.sending.srflx.#index.candidate The Peer connection local
   *   <code>"srflx"</code> (STUN) ICE candidate connection description.
   * @param {String} stats.connection.candidates.sending.srflx.#index.sdpMid The Peer connection local
   *   <code>"srflx"</code> (STUN) ICE candidate identifier based on the local session description.
   * @param {Number} stats.connection.candidates.sending.srflx.#index.sdpMLineIndex The Peer connection local
   *   <code>"srflx"</code> (STUN) ICE candidate media description index (starting from <code>0</code>)
   *   based on the local session description.
   * @param {Array} stats.connection.candidates.sending.relay The Peer connection list of local
   *   <code>"relay"</code> (TURN) candidates sent.
   * @param {JSON} stats.connection.candidates.sending.relay.#index The Peer connection local
   *   <code>"relay"</code> (TURN) ICE candidate.
   * @param {String} stats.connection.candidates.sending.relay.#index.candidate The Peer connection local
   *   <code>"relay"</code> (TURN) ICE candidate connection description.
   * @param {String} stats.connection.candidates.sending.relay.#index.sdpMid The Peer connection local
   *   <code>"relay"</code> (TURN) ICE candidate identifier based on the local session description.
   * @param {Number} stats.connection.candidates.sending.relay.#index.sdpMLineIndex The Peer connection local
   *   <code>"relay"</code> (TURN) ICE candidate media description index (starting from <code>0</code>)
   *   based on the local session description.
   * @param {JSON} stats.connection.candidates.receiving The Peer connection list of remote ICE candidates received.
   * @param {Array} stats.connection.candidates.receiving.host The Peer connection list of remote
   *   <code>"host"</code> (local network) ICE candidates received.
   * @param {JSON} stats.connection.candidates.receiving.host.#index The Peer connection remote
   *   <code>"host"</code> (local network) ICE candidate.
   * @param {String} stats.connection.candidates.receiving.host.#index.candidate The Peer connection remote
   *   <code>"host"</code> (local network) ICE candidate connection description.
   * @param {String} stats.connection.candidates.receiving.host.#index.sdpMid The Peer connection remote
   *   <code>"host"</code> (local network) ICE candidate identifier based on the remote session description.
   * @param {Number} stats.connection.candidates.receiving.host.#index.sdpMLineIndex The Peer connection remote
   *   <code>"host"</code> (local network) ICE candidate media description index (starting from <code>0</code>)
   *   based on the remote session description.
   * @param {Array} stats.connection.candidates.receiving.srflx The Peer connection list of remote
   *   <code>"srflx"</code> (STUN) ICE candidates received.
   * @param {JSON} stats.connection.candidates.receiving.srflx.#index The Peer connection remote
   *   <code>"srflx"</code> (STUN) ICE candidate.
   * @param {String} stats.connection.candidates.receiving.srflx.#index.candidate The Peer connection remote
   *   <code>"srflx"</code> (STUN) ICE candidate connection description.
   * @param {String} stats.connection.candidates.receiving.srflx.#index.sdpMid The Peer connection remote
   *   <code>"srflx"</code> (STUN) ICE candidate identifier based on the remote session description.
   * @param {Number} stats.connection.candidates.receiving.srflx.#index.sdpMLineIndex The Peer connection remote
   *   <code>"srflx"</code> (STUN) ICE candidate media description index (starting from <code>0</code>)
   *   based on the remote session description.
   * @param {Array} stats.connection.candidates.receiving.relay The Peer connection list of remote
   *   <code>"relay"</code> (TURN) ICE candidates received.
   * @param {JSON} stats.connection.candidates.receiving.relay.#index The Peer connection remote
   *   <code>"relay"</code> (TURN) ICE candidate.
   * @param {String} stats.connection.candidates.receiving.relay.#index.candidate The Peer connection remote
   *   <code>"relay"</code> (TURN) ICE candidate connection description.
   * @param {String} stats.connection.candidates.receiving.relay.#index.sdpMid The Peer connection remote
   *   <code>"relay"</code> (TURN) ICE candidate identifier based on the remote session description.
   * @param {Number} stats.connection.candidates.receiving.relay.#index.sdpMLineIndex The Peer connection remote
   *   <code>"relay"</code> (TURN) ICE candidate media description index (starting from <code>0</code>)
   *   based on the remote session description.
   * @param {JSON} stats.connection.dataChannels The Peer connection list of Datachannel connections.
   * @param {JSON} stats.connection.dataChannels.#channelName The Peer connection Datachannel connection stats.
   * @param {String} stats.connection.dataChannels.#channelName.label The Peer connection Datachannel connection ID.
   * @param {String} stats.connection.dataChannels.#channelName.readyState The Peer connection Datachannel connection readyState.
   *   [Rel: Skylink.DATA_CHANNEL_STATE]
   * @param {String} stats.connection.dataChannels.#channelName.type The Peer connection Datachannel connection type.
   *   [Rel: Skylink.DATA_CHANNEL_TYPE]
   * @param {String} stats.connection.dataChannels.#channelName.currentTransferId The Peer connection
   *   Datachannel connection current progressing transfer session ID.
   *   <small>Defined as <code>null</code> when there is currently no transfer session progressing on the Datachannel connection.</small>
   * @param {Error} error The error object received.
   *   <small>Defined only when <code>state</code> payload is <code>RETRIEVE_ERROR</code>.</small>
   * @for Skylink
   * @since 0.6.14
   */
  getConnectionStatusStateChange: [],

  /**
   * Event triggered when <a href="#method_muteStream"><code>muteStream()</code> method</a> changes
   * User Streams audio and video tracks muted status.
   * @event localMediaMuted
   * @param {JSON} mediaStatus The Streams muted settings.
   *   <small>This indicates the muted settings for both
   *   <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a> and
   *   <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a>.</small>
   * @param {Boolean} mediaStatus.audioMuted The flag if all Streams audio tracks is muted or not.
   *   <small>If User's <code>peerInfo.settings.audio</code> is false, this will be defined as <code>true</code>.</small>
   * @param {Boolean} mediaStatus.videoMuted The flag if all Streams video tracks is muted or not.
   *   <small>If User's <code>peerInfo.settings.video</code> is false, this will be defined as <code>true</code>.</small>
   * @for Skylink
   * @since 0.6.15
   */
  localMediaMuted: [],

  /**
   * <blockquote class="info">
   *   Learn more about how ICE works in this
   *   <a href="https://temasys.com.sg/ice-what-is-this-sorcery/">article here</a>.<br>
   *   Note that this event may not be triggered for MCU enabled Peer connections as ICE candidates
   *   may be received in the session description instead.
   * </blockquote>
   * Event triggered when remote ICE candidate processing state has changed when Peer is using trickle ICE.
   * @event candidateProcessingState
   * @param {String} state The ICE candidate processing state.
   *   [Rel: Skylink.CANDIDATE_PROCESSING_STATE]
   * @param {String} peerId The Peer ID.
   * @param {String} candidateId The remote ICE candidate session ID.
   *   <small>Note that this value is not related to WebRTC API but for identification of remote ICE candidate received.</small>
   * @param {String} candidateType The remote ICE candidate type.
   *   <small>Expected values are <code>"host"</code> (local network), <code>"srflx"</code> (STUN) and <code>"relay"</code> (TURN).</small>
   * @param {JSON} candidate The remote ICE candidate.
   * @param {String} candidate.candidate The remote ICE candidate connection description.
   * @param {String} candidate.sdpMid The remote ICE candidate identifier based on the remote session description.
   * @param {Number} candidate.sdpMLineIndex The remote ICE candidate media description index
   *   (starting from <code>0</code>) based on the remote session description.
   * @param {Error} [error] The error object.
   *   <small>Defined only when <code>state</code> is <code>DROPPED</code> or <code>PROCESS_ERROR</code>.</small>
   * @for Skylink
   * @since 0.6.16
   */
  candidateProcessingState: [],

  /**
   * <blockquote class="info">
   *   Learn more about how ICE works in this
   *   <a href="https://temasys.com.sg/ice-what-is-this-sorcery/">article here</a>.<br>
   *   Note that this event may not be triggered for MCU enabled Peer connections as ICE candidates
   *   may be received in the session description instead.
   * </blockquote>
   * Event triggered when all remote ICE candidates gathering has completed and been processed.
   * @event candidatesGathered
   * @param {String} peerId The Peer ID.
   * @param {JSON} length The remote ICE candidates length.
   * @param {Number} length.expected The expected total number of remote ICE candidates to be received.
   * @param {Number} length.received The actual total number of remote ICE candidates received.
   * @param {Number} length.processed The total number of remote ICE candidates processed. 
   * @for Skylink
   * @since 0.6.18
   */
  candidatesGathered: []
};

/**
 * Function that subscribes a listener to an event.
 * @method on
 * @param {String} eventName The event.
 * @param {Function} callback The listener.
 *   <small>This will be invoked when event is triggered.</small>
 * @example
 *   // Example 1: Subscribing to "peerJoined" event
 *   skylinkDemo.on("peerJoined", function (peerId, peerInfo, isSelf) {
 *     console.info("peerJoined event has been triggered with:", peerId, peerInfo, isSelf);
 *   });
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype.on = function(eventName, callback) {
  if ('function' === typeof callback) {
    this._EVENTS[eventName] = this._EVENTS[eventName] || [];
    this._EVENTS[eventName].push(callback);
    log.log([null, 'Event', eventName, 'Event is subscribed']);
  } else {
    log.error([null, 'Event', eventName, 'Provided parameter is not a function']);
  }
};

/**
 * Function that subscribes a listener to an event once.
 * @method once
 * @param {String} eventName The event.
 * @param {Function} callback The listener.
 *   <small>This will be invoked once when event is triggered and conditional function is satisfied.</small>
 * @param {Function} [condition] The conditional function that will be invoked when event is triggered.
 *   <small>Return <code>true</code> when invoked to satisfy condition.</small>
 *   <small>When not provided, the conditional function will always return <code>true</code>.</small>
 * @param {Boolean} [fireAlways=false] The flag that indicates if <code>once()</code> should act like
 *   <code>on()</code> but only invoke listener only when conditional function is satisfied.
 * @example
 *   // Example 1: Subscribing to "peerJoined" event that triggers without condition
 *   skylinkDemo.once("peerJoined", function (peerId, peerInfo, isSelf) {
 *     console.info("peerJoined event has been triggered once with:", peerId, peerInfo, isSelf);
 *   });
 *
 *   // Example 2: Subscribing to "incomingStream" event that triggers with condition
 *   skylinkDemo.once("incomingStream", function (peerId, stream, isSelf, peerInfo) {
 *     console.info("incomingStream event has been triggered with User stream:", stream);
 *   }, function (peerId, peerInfo, isSelf) {
 *     return isSelf;
 *   });
 *
 *   // Example 3: Subscribing to "dataTransferState" event that triggers always only when condition is satisfied
 *   skylinkDemo.once("dataTransferState", function (state, transferId, peerId, transferInfo) {
 *     console.info("Received data transfer from Peer:", transferInfo.data);
 *   }, function (state, transferId, peerId) {
 *     if (state === skylinkDemo.DATA_TRANSFER_STATE.UPLOAD_REQUEST) {
 *       skylinkDemo.acceptDataTransfer(peerId, transferId);
 *     }
 *     return state === skylinkDemo.DATA_TRANSFER_STATE.DOWNLOAD_COMPLETED;
 *   }, true);
 * @for Skylink
 * @since 0.5.4
 */
Skylink.prototype.once = function(eventName, callback, condition, fireAlways) {
  if (typeof condition === 'boolean') {
    fireAlways = condition;
    condition = null;
  }
  fireAlways = (typeof fireAlways === 'undefined' ? false : fireAlways);
  condition = (typeof condition !== 'function') ? function () {
    return true;
  } : condition;

  if (typeof callback === 'function') {
    this._onceEvents[eventName] = this._onceEvents[eventName] || [];
    this._onceEvents[eventName].push([callback, condition, fireAlways]);
    log.log([null, 'Event', eventName, 'Event is subscribed on condition']);
  } else {
    log.error([null, 'Event', eventName, 'Provided callback is not a function']);
  }
};

/**
 * Function that unsubscribes listeners from an event.
 * @method off
 * @param {String} [eventName] The event.
 * - When not provided, all listeners to all events will be unsubscribed.
 * @param {Function} [callback] The listener to unsubscribe.
 * - When not provided, all listeners associated to the event will be unsubscribed.
 * @example
 *   // Example 1: Unsubscribe all "peerJoined" event
 *   skylinkDemo.off("peerJoined");
 *
 *   // Example 2: Unsubscribe only one listener from "peerJoined event"
 *   var pJListener = function (peerId, peerInfo, isSelf) {
 *     console.info("peerJoined event has been triggered with:", peerId, peerInfo, isSelf);
 *   };
 *
 *   skylinkDemo.off("peerJoined", pJListener);
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.off = function(eventName, callback) {
  if (!(eventName && typeof eventName === 'string')) {
    this._EVENTS = {};
    this._onceEvents = {};
  } else {
    if (callback === undefined) {
      this._EVENTS[eventName] = [];
      this._onceEvents[eventName] = [];
      log.log([null, 'Event', eventName, 'All events are unsubscribed']);
      return;
    }
    var arr = this._EVENTS[eventName];
    var once = this._onceEvents[eventName];

    // unsubscribe events that is triggered always
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] === callback) {
        log.log([null, 'Event', eventName, 'Event is unsubscribed']);
        arr.splice(i, 1);
        break;
      }
    }
    // unsubscribe events fired only once
    if(once !== undefined) {
      for (var j = 0; j < once.length; j++) {
        if (once[j][0] === callback) {
          log.log([null, 'Event', eventName, 'One-time Event is unsubscribed']);
          once.splice(j, 1);
          break;
        }
      }
    }
  }
};

/**
 * Function that triggers an event.
 * The rest of the parameters after the <code>eventName</code> parameter is considered as the event parameter payloads.
 * @method _trigger
 * @private
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype._trigger = function(eventName) {
  //convert the arguments into an array
  var args = Array.prototype.slice.call(arguments);
  var arr = this._EVENTS[eventName];
  var once = this._onceEvents[eventName] || null;
  args.shift(); //Omit the first argument since it's the event name
  if (arr) {
    // for events subscribed forever
    for (var i = 0; i < arr.length; i++) {
      try {
        log.log([null, 'Event', eventName, 'Event is fired']);
        if(arr[i].apply(this, args) === false) {
          break;
        }
      } catch(error) {
        log.error([null, 'Event', eventName, 'Exception occurred in event:'], error);
        throw error;
      }
    }
  }
  if (once){
    // for events subscribed on once
    for (var j = 0; j < once.length; j++) {
      if (once[j][1].apply(this, args) === true) {
        log.log([null, 'Event', eventName, 'Condition is met. Firing event']);
        if(once[j][0].apply(this, args) === false) {
          break;
        }
        if (once[j] && !once[j][2]) {
          log.log([null, 'Event', eventName, 'Removing event after firing once']);
          once.splice(j, 1);
          //After removing current element, the next element should be element of the same index
          j--;
        }
      } else {
        log.log([null, 'Event', eventName, 'Condition is still not met. ' +
          'Holding event from being fired']);
      }
    }
  }
  log.log([null, 'Event', eventName, 'Event is triggered']);
};



/**
 * Function that checks if the current state condition is met before subscribing
 *   event handler to wait for condition to be fulfilled.
 * @method _condition
 * @private
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._condition = function(eventName, callback, checkFirst, condition, fireAlways) {
  if (typeof condition === 'boolean') {
    fireAlways = condition;
    condition = null;
  }
  if (typeof callback === 'function' && typeof checkFirst === 'function') {
    if (checkFirst()) {
      log.log([null, 'Event', eventName, 'First condition is met. Firing callback']);
      callback();
      return;
    }
    log.log([null, 'Event', eventName, 'First condition is not met. Subscribing to event']);
    this.once(eventName, callback, condition, fireAlways);
  } else {
    log.error([null, 'Event', eventName, 'Provided callback or checkFirst is not a function']);
  }
};

/**
 * Function that starts an interval check to wait for a condition to be resolved.
 * @method _wait
 * @private
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._wait = function(callback, condition, intervalTime, fireAlways) {
  fireAlways = (typeof fireAlways === 'undefined' ? false : fireAlways);
  if (typeof callback === 'function' && typeof condition === 'function') {
    if (condition()) {
      log.log([null, 'Event', null, 'Condition is met. Firing callback']);
      callback();
      return;
    }
    log.log([null, 'Event', null, 'Condition is not met. Doing a check.']);

    intervalTime = (typeof intervalTime === 'number') ? intervalTime : 50;

    var doWait = setInterval(function () {
      if (condition()) {
        log.log([null, 'Event', null, 'Condition is met after waiting. Firing callback']);
        if (!fireAlways){
          clearInterval(doWait);
        }
        callback();
      }
    }, intervalTime);
  } else {
    if (typeof callback !== 'function'){
      log.error([null, 'Event', null, 'Provided callback is not a function']);
    }
    if (typeof condition !== 'function'){
      log.error([null, 'Event', null, 'Provided condition is not a function']);
    }
  }
};

/**
 * Function that throttles a method function to prevent multiple invokes over a specified amount of time.
 * Returns a function to be invoked <code>._throttle(fn, 1000)()</code> to make throttling functionality work.
 * @method _throttle
 * @private
 * @for Skylink
 * @since 0.5.8
 */
Skylink.prototype._throttle = function(func, prop, wait){
  var self = this;
  var now = (new Date()).getTime();

  if (!(self._timestamp[prop] && ((now - self._timestamp[prop]) < wait))) {
    func(true);
    self._timestamp[prop] = now;
  } else {
    func(false);
  }
};
Skylink.prototype.SOCKET_ERROR = {
  CONNECTION_FAILED: 0,
  RECONNECTION_FAILED: -1,
  CONNECTION_ABORTED: -2,
  RECONNECTION_ABORTED: -3,
  RECONNECTION_ATTEMPT: -4
};

/**
 * The list of <a href="#method_joinRoom"><code>joinRoom()</code> method</a> socket connection reconnection states.
 * @attribute SOCKET_FALLBACK
 * @param {String} NON_FALLBACK      <small>Value <code>"nonfallback"</code></small>
 *   The value of the reconnection state when <code>joinRoom()</code> socket connection is at its initial state
 *   without transitioning to any new socket port or transports yet.
 * @param {String} FALLBACK_PORT     <small>Value <code>"fallbackPortNonSSL"</code></small>
 *   The value of the reconnection state when <code>joinRoom()</code> socket connection is reconnecting with
 *   another new HTTP port using WebSocket transports to attempt to establish connection with Signaling server.
 * @param {String} FALLBACK_PORT_SSL <small>Value <code>"fallbackPortSSL"</code></small>
 *   The value of the reconnection state when <code>joinRoom()</code> socket connection is reconnecting with
 *   another new HTTPS port using WebSocket transports to attempt to establish connection with Signaling server.
 * @param {String} LONG_POLLING      <small>Value <code>"fallbackLongPollingNonSSL"</code></small>
 *   The value of the reconnection state when <code>joinRoom()</code> socket connection is reconnecting with
 *   another new HTTP port using Polling transports to attempt to establish connection with Signaling server.
 * @param {String} LONG_POLLING_SSL  <small>Value <code>"fallbackLongPollingSSL"</code></small>
 *   The value of the reconnection state when <code>joinRoom()</code> socket connection is reconnecting with
 *   another new HTTPS port using Polling transports to attempt to establish connection with Signaling server.
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype.SOCKET_FALLBACK = {
  NON_FALLBACK: 'nonfallback',
  FALLBACK_PORT: 'fallbackPortNonSSL',
  FALLBACK_SSL_PORT: 'fallbackPortSSL',
  LONG_POLLING: 'fallbackLongPollingNonSSL',
  LONG_POLLING_SSL: 'fallbackLongPollingSSL'
};

/**
 * Function that sends Socket message to Signaling.
 * @method _socketSendMessage
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._socketSendMessage = function(message) {
  var self = this;

  // Check and prevent sending message if socket connection is not connected
  if (!self._socket.connected) {
    return log.warn([message.target || '(all)', 'Socket', message.type,
      'Dropping of message as Socket connection is not opened ->'], message);
  }

  // Check if message matches group list
  if (self._socket.queue.types.indexOf(message.type) > -1) {
    // "Queuing" mechanism just simply send if interval has reached.
    // It does go by order, it's kinda like UDP and messages may be sent in unordered manner
    // Whatever available broadcasted messages that can be sent, just be sent
    // Check if timestamp is within the specified interval
    if (!(self._socket.queue.timestamp && ((new Date ()).getTime() - self._socket.queue.timestamp) <= self._socket.queue.interval)) {
      // Clear existing timeout intervals since the current item is sent.
      // The rest of the queue items can wait. Sadz
      if (self._socket.queue.fn) {
        clearTimeout(self._socket.queue.fn);
      }
      self._socket.socket.send(JSON.stringify(message));
      // Trigger `incomingMessage` event if "public" type
      if (message.type === 'public') {
        self._trigger('incomingMessage', {
          content: message.data,
          isPrivate: false,
          targetPeerId: null,
          listOfPeers: Object.keys(self._peerInformations),
          isDataChannel: false,
          senderPeerId: self._user.id
        }, self._user.id, self.getPeerInfo(), true);
      // Update socket message timestamp event
      } else if (message.type !== 'stream') {
        self._user.timestamps[message.type] = message.stamp;
      }
      // Update socket messages queue timestamp
      self._socket.queue.timestamp = (new Date()).getTime();
      // Check if there is a current queue and start timing if so
      if (self._socket.queue.messages.length > 0) {
        self._socketSendMessageProcessNextQueue();
      }

    // Time to queue the socket messages
    } else {
      log.debug(['(all)', 'Socket', message.type, 'Queueing message ->'], message);
      self._socket.queue.messages.push(message);
      self._socketSendMessageProcessNextQueue();
    }
  // Send direct message without queuing.
  // Do note that the Signaling messages does throttling drops hence the queuing of broadcasted messages
  } else {
    log.debug([message.target || '(all)', 'Socket', message.type, 'Sending message ->'], message);
    self._socket.socket.send(JSON.stringify(message));
  }
};

/**
 * Function that sends Socket message to Signaling.
 * @method _socketSendMessage
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._socketSendMessageProcessNextQueue = function () {
  var self = this;

  // Append socket queue if it does exists
  if (!self._socket.queue.fn) {
    self._socket.queue.fn = setTimeout(function () {
      // Clear socket queue interval
      self._socket.queue.fn = null;
      // Check if socket connection is opened
      if (!self._socket.connected) {
        log.warn('Dropping queue stack of messages as socket connection is closed ->', self._socket.queue.messages);
        return;
      }
      // Check if there is any queue stack at all first
      if (self._socket.queue.messages.length === 0) {
        return;
      }

      var currentStack = [];

      // Remove outdated messages
      for (var i = 0; i < self._socket.queue.messages.length; i++) {
        var messageItem = self._socket.queue.messages[i];
        // Check if it is outdated before dropping them
        if (['muteAudioEvent', 'muteVideoEvent', 'updateUserEvent'].indexOf(messageItem.type) > -1 &&
          self._user.timestamps[messageItem.type] >= messageItem.stamp) {
          self._socket.queue.messages.splice(i, 1);
          i--;
        } else if (currentStack.length <= self._socket.queue.throughput) {
          if (['muteAudioEvent', 'muteVideoEvent', 'updateUserEvent'].indexOf(messageItem.type) > -1) {
            self._user.timestamps[messageItem.type] = messageItem.stamp;
          }
          self._socket.queue.messages.splice(i, 1);
          i--;
          currentStack.push(JSON.stringify(messageItem));
        }
      }

      // Send current queue of stack messages
      log.debug(['(all)', 'Socket', 'group', 'Sending queue stack ->'], currentStack);

      self._socket.socket.send(JSON.stringify({
        type: self._SIG_MESSAGE_TYPE.GROUP,
        lists: currentStack,
        mid: self._user.id,
        rid: self._user.room.session.rid
      }));
      self._socket.queue.timestamp = (new Date()).getTime();

      // Trigger `incomingMessage` events
      for (var j = 0; j < currentStack.length; j++) {
        if (currentStack[j].type === 'public') {
          self._trigger('incomingMessage', {
            content: currentStack[j].data,
            isPrivate: false,
            targetPeerId: null,
            listOfPeers: Object.keys(self._peerInformations),
            isDataChannel: false,
            senderPeerId: self._user.id
          }, self._user.id, self.getPeerInfo(), true);
        }
      }

      // Process next queue
      self._socketSendMessageProcessNextQueue();

    }, self._socket.queue.interval);
  }
};

/**
 * Function that establishes the Socket connection to Signaling.
 * @method _socketAttemptConnection
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._socketAttemptConnection = function (callback) {
  var self = this;
  var socketPorts = self._socket.ports[self._socket.session.protocol];
  // The `socketError` and `channelRetry` fallback state
  var fallbackState = null;

  // State when there is no existing current port
  if (self._socket.session.port === null) {
    self._socket.session.port = socketPorts[0];
    self._socket.session.finalAttempts = 0;
    self._socket.session.retries = 0;
    // Set the initial fallback state
    fallbackState = self.SOCKET_FALLBACK.NON_FALLBACK;

  // State when current port has reached the final last port
  } else if (ports.indexOf(self._signalingServerPort) === ports.length - 1) {
    // Let's attempt to use Polling transports from the first port
    if (self._socket.session.transportType === 'WebSocket') {
      self._socket.session.transportType = 'Polling';
      self._socket.session.port = socketPorts[0];
    // Let's attempt with another last 4 rounds
    } else {
      self._socket.session.finalAttempts++;
    }
  // State to go to the next port
  } else {
    self._socket.session.port = socketPorts[socketPorts.indexOf(self._socket.session.port) + 1];
  }

  // Socket.io-client options
  // Handle socket.io-client options for WebSocket transports (by default)
  self._socket.session.options = {
    forceNew: true,
    reconnection: true,
    timeout: self._options.socketTimeout,
    reconnectionAttempts: 2,
    reconnectionDelayMax: 5000,
    reconnectionDelay: 1000,
    transports: ['websocket']
  };

  // Handle socket.io-client options for Polling transports
  if (self._socket.session.transportType === 'Polling') {
    self._socket.session.options.reconnectionDelayMax = 1000;
    self._socket.session.options.reconnectionAttempts = 4;
    self._socket.session.options.transports = ['xhr-polling', 'jsonp-polling', 'polling'];
  }

  // Configure the non-initial fallback types
  if (fallbackState === null) {
    fallbackState = self._socket.session.protocol === 'http:' ?
    // Configure the HTTP protocol Polling or WebSocket type
      (self._socket.session.transportType === 'Polling' ? self.SOCKET_FALLBACK.LONG_POLLING :
      self.SOCKET_FALLBACK.FALLBACK_PORT) : (self._socket.session.transportType === 'Polling' ?
    // Configure the HTTPS protocol Polling or WebSocket type
      self.SOCKET_FALLBACK.LONG_POLLING_SSL : self.SOCKET_FALLBACK.FALLBACK_SSL_PORT);

    self._socket.session.retries++;

    // Trigger `socketError` event for RECONNECTION_ATTEMPT
    self._trigger('socketError', self.SOCKET_ERROR.RECONNECTION_ATTEMPT, null,
      fallbackState, self._socketGetSession());
    // Trigger `channelRetry` event for the first failure, not the reconnect attempts retries
    self._trigger('channelRetry', fallbackState, self._socket.session.retries, self._socketGetSession());
  }

  // Construct Signaling server path
  self._socket.session.path = self._socket.session.protocol + '//' + self._socket.server + ':' +
    self._socket.session.port; //'http://ec2-52-8-93-170.us-west-1.compute.amazonaws.com:6001';

  // Use the custom Signaling server url
  if (typeof self._options.socketServer === 'string') {
    self._socket.session.path = self._socket.session.protocol + '//' + self._options.socketServer + ':' +
      self._socket.session.port;
  }

  // Disconnect any existing socket connection
  if (self._socket.socket) {
    self._socket.removeAllListeners();
    self._socket.disconnect();
    self._socket = null;
  }

  self._socket.connected = false;

  log.log('Opening socket connection ->', self._socketGetSession());

  self._socket.socket = io.connect(self._socket.session.path, self._socket.session.options);

  // socket.io-client `reconnect_attempt` event
  // Triggered each time socket.io-client attempts to reconnect
  self._socket.socket.on('reconnect_attempt', function (attempt) {
    self._socket.session.retries++;
    // Trigger `channelRetry` event
    self._trigger('channelRetry', fallbackState, self._socket.session.retries, self._socketGetSession());
  });

  // socket.io-client `reconnect_attempt` event
  // Triggered each time socket.io-client fails to reconnect after all the maximum attempt configured
  self._socket.socket.on('reconnect_failed', function () {
    // Check if its the initial state, return as first connection failure
    if (fallbackState === self.SOCKET_FALLBACK.NON_FALLBACK) {
      // Trigger `socketError` event for CONNECTION FAILED
      self._trigger('socketError', self.SOCKET_ERROR.CONNECTION_FAILED,
        new Error('Failed connection with transport "' + self._socket.session.transportType +
        '" and port ' + self._socket.session.port + '.'), fallbackState, self._socketGetSession());
    // Else trigger as subsequent connection failure
    } else {
      // Trigger `socketError` event for RECONNECTION_FAILED
      self._trigger('socketError', self.SOCKET_ERROR.RECONNECTION_FAILED,
        new Error('Failed reconnection with transport "' + self._socket.session.transportType +
        '" and port ' + self._socket.session.port + '.'), fallbackState, self._socketGetSession());
    }
    // Check if it has reached the final attempt limit before fallbacking to the next available port / transport type
    if (self._socket.session.finalAttempts < 4) {
      self._socketAttemptConnection();
    // Check if it has reached the final attempt limit
    } else {
      // Trigger `socketError` event for RECONNECTION_ABORTED. Not more attempts to go on to retry.
      self._trigger('socketError', self.SOCKET_ERROR.RECONNECTION_ABORTED, new Error('Reconnection aborted as ' +
        'there no more available ports, transports and final attempts left.'), fallbackState, self._socketGetSession());
      callback(new Error('Reconnection aborted.'));
    }
  });

  // socket.io-client `reconnect_attempt` event
  // Triggered each time socket.io-client has connected
  self._socket.socket.on('connect', function () {
    if (!self._socket.connected) {
      log.log('Socket channel opened for port @' + self._socket.session.port + '.');
      self._socket.connected = true;
      // Trigger `channelOpen` event
      self._trigger('channelOpen', clone(self._socketSession));
      callback();
    }
  });

  // socket.io-client `reconnect` event
  // Triggered each time socket.io-client has connected after several reconnection attempts
  self._socket.socket.on('reconnect', function () {
    if (!self._socket.connected) {
      log.log('Socket channel opened after reconnection attempt (' + self._socket.session.retries +
        ') for port @' + self._socket.session.port + '.');
      self._socket.connected = true;
      // Trigger `channelOpen` event
      self._trigger('channelOpen', self._socketGetSession());
      callback();
    }
  });

  // socket.io-client `error` event
  // Triggered when socket.io-client event handler errors like `peerJoined` event from the call-stack.
  // Can be xhr-poll errors
  self._socket.socket.on('error', function(error) {
    // Disconnect Polling errors
    if (error.message.indexOf('xhr post error') > -1) {
      log.error('Socket channel Polling errors and connection is unstable. Disconnecting..');
      // Trigger `socketError` event
      self._trigger('socketError', self.SOCKET_ERROR.CONNECTION_ABORTED,
        new Error('Failed reconnection with transport "' + self._socket.session.transportType +
        '" and port ' + self._socket.session.port + '.'), fallbackState, self._socketGetSession());
      // Close socket connection
      self._socketClose();
      return;
    }
    log.error('App exception occurred. Please check your event handlers for code errors. ->', error);
    // Trigger `channelError` event
    self._trigger('channelError', error, self._socketGetSession());
  });

  // socket.io-client `error` event
  // Triggered when socket.io-client is disconnected abruptly
  self._socket.socket.on('disconnect', function() {
    if (self._socket.connected) {
      log.warn('Socket connection closed abruptly.');
      self._socket.connected = false;
      // Trigger `channelClose` event
      self._trigger('channelClose', self._socketGetSession());
      // Check if User is in Room and Socket connection was disconnected
      if (self._user.room.connected) {
        self.leaveRoom(false);
        self._trigger('sessionDisconnect', self._user.id, self.getPeerInfo());
      }
    }
  });

  // socket.io-client `message` event
  // Triggered when socket.io-client receives message from Peers
  self._socket.socket.on('message', function(messageStr) {
    var message = JSON.parse(messageStr);
    if (message.type === self._SIG_MESSAGE_TYPE.GROUP) {
      log.debug('Bundle of ' + message.lists.length + ' messages');
      for (var i = 0; i < message.lists.length; i++) {
        var indiMessage = JSON.parse(message.lists[i]);
        self._processSigMessage(indiMessage);
        self._trigger('channelMessage', indiMessage, self._socketGetSession());
      }
    } else {
      self._processSigMessage(message);
      self._trigger('channelMessage', message, clone(self._socketSession));
    }
  });
};

/**
 * Function that starts the Socket connection.
 * @method _socketOpen
 * @private
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype._socketOpen = function (callback) {
  var self = this;

  if (self._socket.socket) {
    self._socketClose();
  }

  self._socket.session.port = null;
  self._socket.session.protocol = self._options.forceSSL ? 'https:' : window.location.protocol;
  // IE < 9 doesn't support WebSocket
  self._socket.session.transportType = !window.WebSocket ? 'Polling' : 'WebSocket';
  self._socket.session.retries = 0;
  self._socket.session.finalAttempts = 0;
  self._socket.session.fallbackState = null;

  // Begin with a websocket connection
  self._socketAttemptConnection(callback);
};

/**
 * Function that returns the Socket session information.
 * @method _socketGetSession
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._socketGetSession = function () {
  var self = this;
  return {
    finalAttempts: self._socket.session.finalAttempts,
    serverUrl: self._socket.session.path,
    socketOptions: clone(self._socket.session.options),
    attempts: self._socket.session.retries,
    transportType: self._socket.session.transportType
  };
};

/**
 * Function that stops the Socket connection.
 * @method _socketClose
 * @private
 * @for Skylink
 * @since 0.6.18
 */
Skylink.prototype._socketClose = function() {
  var self = this;

  // Remove all current event listeners
  if (self._socket.socket) {
    self._socket.socket.removeAllListeners();
  }

  // Close connection or return as close if state is connected
  if (self._socket.connected) {
    if (self._socket.socket) {
      self._socket.socket.disconnect();
    }

    self._socket.connected = false;

    self._trigger('channelClose', self._socketGetSession());
  }

  self._socket.socket = null;
};
Skylink.prototype.SM_PROTOCOL_VERSION = '0.1.2.3';

/**
 * Stores the list of socket messaging protocol types.
 * See confluence docs for the list based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @attribute _SIG_MESSAGE_TYPE
 * @type JSON
 * @readOnly
 * @private
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype._SIG_MESSAGE_TYPE = {
  JOIN_ROOM: 'joinRoom',
  IN_ROOM: 'inRoom',
  ENTER: 'enter',
  WELCOME: 'welcome',
  RESTART: 'restart',
  OFFER: 'offer',
  ANSWER: 'answer',
  CANDIDATE: 'candidate',
  BYE: 'bye',
  REDIRECT: 'redirect',
  UPDATE_USER: 'updateUserEvent',
  ROOM_LOCK: 'roomLockEvent',
  MUTE_VIDEO: 'muteVideoEvent',
  MUTE_AUDIO: 'muteAudioEvent',
  PUBLIC_MESSAGE: 'public',
  PRIVATE_MESSAGE: 'private',
  STREAM: 'stream',
  GROUP: 'group',
  GET_PEERS: 'getPeers',
  PEER_LIST: 'peerList',
  INTRODUCE: 'introduce',
  INTRODUCE_ERROR: 'introduceError',
  APPROACH: 'approach',
  START_RECORDING: 'startRecordingRoom',
  STOP_RECORDING: 'stopRecordingRoom',
  RECORDING: 'recordingEvent',
  END_OF_CANDIDATES: 'endOfCandidates'
};

/**
 * Stores the list of socket messaging protocol types to queue when sent less than a second interval.
 * @attribute _groupMessageList
 * @type Array
 * @private
 * @for Skylink
 * @since 0.5.10
 */
Skylink.prototype._groupMessageList = [
  Skylink.prototype._SIG_MESSAGE_TYPE.STREAM,
  Skylink.prototype._SIG_MESSAGE_TYPE.UPDATE_USER,
  Skylink.prototype._SIG_MESSAGE_TYPE.MUTE_AUDIO,
  Skylink.prototype._SIG_MESSAGE_TYPE.MUTE_VIDEO,
  Skylink.prototype._SIG_MESSAGE_TYPE.PUBLIC_MESSAGE
];

/**
 * <blockquote class="info">
 *   Note that broadcasted events from <a href="#method_muteStream"><code>muteStream()</code> method</a>,
 *   <a href="#method_stopStream"><code>stopStream()</code> method</a>,
 *   <a href="#method_stopScreen"><code>stopScreen()</code> method</a>,
 *   <a href="#method_sendMessage"><code>sendMessage()</code> method</a>,
 *   <a href="#method_unlockRoom"><code>unlockRoom()</code> method</a> and
 *   <a href="#method_lockRoom"><code>lockRoom()</code> method</a> may be queued when
 *   sent within less than an interval.
 * </blockquote>
 * Function that sends a message to Peers via the Signaling socket connection.
 * @method sendMessage
 * @param {String|JSON} message The message.
 * @param {String|Array} [targetPeerId] The target Peer ID to send message to.
 * - When provided as an Array, it will send the message to only Peers which IDs are in the list.
 * - When not provided, it will broadcast the message to all connected Peers in the Room.
 * @example
 *   // Example 1: Broadcasting to all Peers
 *   skylinkDemo.sendMessage("Hi all!");
 *
 *   // Example 2: Sending to specific Peers
 *   var peersInExclusiveParty = [];
 *
 *   skylinkDemo.on("peerJoined", function (peerId, peerInfo, isSelf) {
 *     if (isSelf) return;
 *     if (peerInfo.userData.exclusive) {
 *       peersInExclusiveParty.push(peerId);
 *     }
 *   });
 *
 *   function updateExclusivePartyStatus (message) {
 *     skylinkDemo.sendMessage(message, peersInExclusiveParty);
 *   }
 * @trigger <ol class="desc-seq">
 *   <li>Sends socket connection message to all targeted Peers via Signaling server. <ol>
 *   <li><a href="#event_incomingMessage"><code>incomingMessage</code> event</a> triggers parameter payload
 *   <code>message.isDataChannel</code> value as <code>false</code>.</li></ol></li></ol>
 * @for Skylink
 * @since 0.4.0
 */
Skylink.prototype.sendMessage = function(message, targetPeerId) {
  var listOfPeers = Object.keys(this._peerInformations);
  var isPrivate = false;

  if (Array.isArray(targetPeerId)) {
    listOfPeers = targetPeerId;
    isPrivate = true;
  } else if (targetPeerId && typeof targetPeerId === 'string') {
    listOfPeers = [targetPeerId];
    isPrivate = true;
  }

  if (!this._user.room.connected) {
    log.error('Unable to send message as User is not in Room. ->', message);
    return;
  }

  // Loop out unwanted Peers
  for (var i = 0; i < listOfPeers.length; i++) {
    var peerId = listOfPeers[i];

    if (!this._peerInformations[peerId]) {
      log.error([peerId, 'Socket', null, 'Dropping of sending message to Peer as ' +
        'Peer session does not exists']);
      listOfPeers.splice(i, 1);
      i--;
    } else if (peerId === 'MCU') {
      listOfPeers.splice(i, 1);
      i--;
    } else if (isPrivate) {
      log.debug([peerId, 'Socket', null, 'Sending private message to Peer']);

      this._socketSendMessage({
        data: message,
        mid: this._user.id,
        rid: this._user.room.session.rid,
        target: peerId,
        type: this._SIG_MESSAGE_TYPE.PRIVATE_MESSAGE
      });
    }
  }

  if (listOfPeers.length === 0) {
    log.warn('Currently there are no Peers to send message to (unless the message is queued and ' +
      'there are Peer connected by then).');
  }

  if (!isPrivate) {
    log.debug([null, 'Socket', null, 'Broadcasting message to Peers']);

    this._socketSendMessage({
      data: message,
      mid: this._user.id,
      rid: this._user.room.session.rid,
      type: this._SIG_MESSAGE_TYPE.PUBLIC_MESSAGE
    });
  } else {
    this._trigger('incomingMessage', {
      content: message,
      isPrivate: isPrivate,
      targetPeerId: targetPeerId || null,
      listOfPeers: listOfPeers,
      isDataChannel: false,
      senderPeerId: this._user.id
    }, this._user.id, this.getPeerInfo(), true);
  }
};

/**
 * <blockquote class="info">
 *   Note that this feature requires MCU and recording to be enabled for the App Key provided in the
 *   <a href="#method_init"><code>init()</code> method</a>. If recording feature is not available to
 *   be enabled in the <a href="https://console.temasys.io">Developer Console</a>, please
 *   <a href="http://support.temasys.io">contact us on our support portal</a>.
 * </blockquote>
 * Starts a recording session.
 * @method startRecording
 * @param {Function} [callback] The callback function fired when request has completed.
 *   <small>Function parameters signature is <code>function (error, success)</code></small>
 *   <small>Function request completion is determined by the <a href="#event_recordingState">
 *   <code>recordingState</code> event</a> triggering <code>state</code> parameter payload as <code>START</code>.</small>
 * @param {Error|String} callback.error The error result in request.
 *   <small>Defined as <code>null</code> when there are no errors in request</small>
 *   <small>Object signature is the <code>startRecording()</code> error when starting a new recording session.</small>
 * @param {String|JSON} callback.success The success result in request.
 *   <small>Defined as <code>null</code> when there are errors in request</small>
 *   <small>Object signature is the <a href="#event_recordingState">
 *   <code>recordingState</code> event</a> triggered <code>recordingId</code> parameter payload.</small>
 * @example
 *   // Example 1: Start recording session
 *   skylinkDemo.startRecording(function (error, success) {
 *     if (error) return;
 *     console.info("Recording session has started. ID ->", success);
 *   });
 * @trigger <ol class="desc-seq">
 *   <li>If MCU is not connected: <ol><li><b>ABORT</b> and return error.</li></ol></li>
 *   <li>If there is an existing recording session currently going on: <ol>
 *   <li><b>ABORT</b> and return error.</li></ol></li>
 *   <li>Sends to MCU via Signaling server to start recording session. <ol>
 *   <li>If recording session has been started successfully: <ol>
 *   <li><a href="#event_recordingState"><code>recordingState</code> event</a> triggers
 *   parameter payload <code>state</code> as <code>START</code>.</li></ol></li></ol></li></ol>
 * @beta
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype.startRecording = function (callback) {
  var self = this;

  if (!self._hasMCU) {
    var noMCUError = 'Unable to start recording as MCU is not connected';
    log.error(noMCUError);
    if (typeof callback === 'function') {
      callback(new Error(noMCUError), null);
    }
    return;
  }

  if (self._currentRecordingId) {
    var hasRecordingSessionError = 'Unable to start recording as there is an existing recording in-progress';
    log.error(hasRecordingSessionError);
    if (typeof callback === 'function') {
      callback(new Error(hasRecordingSessionError), null);
    }
    return;
  }

  if (typeof callback === 'function') {
    self.once('recordingState', function (state, recordingId) {
      callback(null, recordingId);
    }, function (state) {
      return state === self.RECORDING_STATE.START;
    });
  }

  self._socketSendMessage({
    type: self._SIG_MESSAGE_TYPE.START_RECORDING,
    rid: self._user.room.session.rid,
    target: 'MCU'
  });

  log.debug(['MCU', 'Recording', null, 'Starting recording']);
};

/**
 * <blockquote class="info">
 *   Note that this feature requires MCU and recording to be enabled for the App Key provided in the
 *   <a href="#method_init"><code>init()</code> method</a>. If recording feature is not available to
 *   be enabled in the <a href="https://console.temasys.io">Developer Console</a>, please
 *   <a href="http://support.temasys.io">contact us on our support portal</a>.
 * </blockquote>
 * Stops a recording session.
 * @param {Function} [callback] The callback function fired when request has completed.
 *   <small>Function parameters signature is <code>function (error, success)</code></small>
 *   <small>Function request completion is determined by the <a href="#event_recordingState">
 *   <code>recordingState</code> event</a> triggering <code>state</code> parameter payload as <code>STOP</code>
 *   or as <code>LINK</code> when the value of <code>callbackSuccessWhenLink</code> is <code>true</code>.</small>
 * @param {Error|String} callback.error The error result in request.
 *   <small>Defined as <code>null</code> when there are no errors in request</small>
 *   <small>Object signature is the <code>stopRecording()</code> error when stopping current recording session.</small>
 * @param {String|JSON} callback.success The success result in request.
 * - When <code>callbackSuccessWhenLink</code> value is <code>false</code>, it is defined as string as
 *   the recording session ID.
 * - when <code>callbackSuccessWhenLink</code> value is <code>true</code>, it is defined as an object as
 *   the recording session information.
 *   <small>Defined as <code>null</code> when there are errors in request</small>
 * @param {JSON} callback.success.recordingId The recording session ID.
 * @param {JSON} callback.success.link The recording session mixin videos link in
 *   <a href="https://en.wikipedia.org/wiki/MPEG-4_Part_14">MP4</a> format.
 *   <small>Object signature matches the <code>link</code> parameter payload received in the
 *   <a href="#event_recordingState"><code>recordingState</code> event</a>.</small>
 * @param {Boolean} [callbackSuccessWhenLink=false] The flag if <code>callback</code> function provided
 *   should result in success only when <a href="#event_recordingState"><code>recordingState</code> event</a>
 *   triggering <code>state</code> parameter payload as <code>LINK</code>.
 * @method stopRecording
 * @example
 *   // Example 1: Stop recording session
 *   skylinkDemo.stopRecording(function (error, success) {
 *     if (error) return;
 *     console.info("Recording session has stopped. ID ->", success);
 *   });
 *
 *   // Example 2: Stop recording session with mixin videos link
 *   skylinkDemo.stopRecording(function (error, success) {
 *     if (error) return;
 *     console.info("Recording session has compiled with links ->", success.link);
 *   }, true);
 * @trigger <ol class="desc-seq">
 *   <li>If MCU is not connected: <ol><li><b>ABORT</b> and return error.</li></ol></li>
 *   <li>If there is no existing recording session currently going on: <ol>
 *   <li><b>ABORT</b> and return error.</li></ol></li>
 *   <li>If existing recording session recording time has not elapsed more than 4 seconds:
 *   <small>4 seconds is mandatory for recording session to ensure better recording
 *   experience and stability.</small> <ol><li><b>ABORT</b> and return error.</li></ol></li>
 *   <li>Sends to MCU via Signaling server to stop recording session: <ol>
 *   <li>If recording session has been stopped successfully: <ol>
 *   <li><a href="#event_recordingState"><code>recordingState</code> event</a>
 *   triggers parameter payload <code>state</code> as <code>START</code>.
 *   <li>MCU starts mixin recorded session videos: <ol>
 *   <li>If recording session has been mixin successfully with links: <ol>
 *   <li><a href="#event_recordingState"><code>recordingState</code> event</a> triggers
 *   parameter payload <code>state</code> as <code>LINK</code>.<li>Else: <ol>
 *   <li><a href="#event_recordingState"><code>recordingState</code> event</a> triggers
 *   parameter payload <code>state</code> as <code>ERROR</code>.<li><b>ABORT</b> and return error.</ol></li>
 *   </ol></li></ol></li><li>Else: <ol>
 *   <li><a href="#event_recordingState"><code>recordingState</code> event</a>
 *   triggers parameter payload <code>state</code> as <code>ERROR</code>.</li><li><b>ABORT</b> and return error.</li>
 *   </ol></li></ol></li></ol>
 * @beta
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype.stopRecording = function (callback, callbackSuccessWhenLink) {
  var self = this;

  if (!self._hasMCU) {
    var noMCUError = 'Unable to stop recording as MCU is not connected';
    log.error(noMCUError);
    if (typeof callback === 'function') {
      callback(new Error(noMCUError), null);
    }
    return;
  }

  if (!self._currentRecordingId) {
    var noRecordingSessionError = 'Unable to stop recording as there is no recording in-progress';
    log.error(noRecordingSessionError);
    if (typeof callback === 'function') {
      callback(new Error(noRecordingSessionError), null);
    }
    return;
  }

  if (self._recordingStartInterval) {
    var recordingSecsRequiredError = 'Unable to stop recording as 4 seconds has not been recorded yet';
    log.error(recordingSecsRequiredError);
    if (typeof callback === 'function') {
      callback(new Error(recordingSecsRequiredError), null);
    }
    return;
  }

  if (typeof callback === 'function') {
    var expectedRecordingId = self._currentRecordingId;

    self.once('recordingState', function (state, recordingId, link, error) {
      if (callbackSuccessWhenLink) {
        if (error) {
          callback(error, null);
          return;
        }

        callback(null, {
          link: link,
          recordingId: recordingId
        });
        return;
      }

      callback(null, recordingId);

    }, function (state, recordingId) {
      if (expectedRecordingId === recordingId) {
        if (callbackSuccessWhenLink) {
          return [self.RECORDING_STATE.LINK, self.RECORDING_STATE.ERROR].indexOf(state) > -1;
        }
        return state === self.RECORDING_STATE.STOP;
      }
    });
  }

  self._socketSendMessage({
    type: self._SIG_MESSAGE_TYPE.STOP_RECORDING,
    rid: self._user.room.session.rid,
    target: 'MCU'
  });

  log.debug(['MCU', 'Recording', null, 'Stopping recording']);
};

/**
 * <blockquote class="info">
 *   Note that this feature requires MCU and recording to be enabled for the App Key provided in the
 *   <a href="#method_init"><code>init()</code> method</a>. If recording feature is not available to
 *   be enabled in the <a href="https://console.temasys.io">Developer Console</a>, please
 *   <a href="http://support.temasys.io">contact us on our support portal</a>.
 * </blockquote>
 * Gets the list of current recording sessions since User has connected to the Room.
 * @method getRecordings
 * @return {JSON} The list of recording sessions.<ul>
 *   <li><code>#recordingId</code><var><b>{</b>JSON<b>}</b></var><p>The recording session.</p><ul>
 *   <li><code>active</code><var><b>{</b>Boolean<b>}</b></var><p>The flag that indicates if the recording session is currently active.</p></li>
 *   <li><code>state</code><var><b>{</b>Number<b>}</b></var><p>The current recording state. [Rel: Skylink.RECORDING_STATE]</p></li>
 *   <li><code>startedDateTime</code><var><b>{</b>String<b>}</b></var><p>The recording session started DateTime in
 *   <a href="https://en.wikipedia.org/wiki/ISO_8601">ISO 8601 format</a>.<small>Note that this value may not be
 *   very accurate as this value is recorded when the start event is received.</small></p></li>
 *   <li><code>endedDateTime</code><var><b>{</b>String<b>}</b></var><p>The recording session ended DateTime in
 *   <a href="https://en.wikipedia.org/wiki/ISO_8601">ISO 8601 format</a>.<small>Note that this value may not be
 *   very accurate as this value is recorded when the stop event is received.</small>
 *   <small>Defined only after <code>state</code> has triggered <code>STOP</code>.</small></p></li>
 *   <li><code>mixingDateTime</code><var><b>{</b>String<b>}</b></var><p>The recording session mixing completed DateTime in
 *   <a href="https://en.wikipedia.org/wiki/ISO_8601">ISO 8601 format</a>.<small>Note that this value may not be
 *   very accurate as this value is recorded when the mixing completed event is received.</small>
 *   <small>Defined only when <code>state</code> is <code>LINK</code>.</small></p></li>
 *   <li><code>links</code><var><b>{</b>JSON<b>}</b></var><p>The recording session links.
 *   <small>Object signature matches the <code>link</code> parameter payload received in the
 *   <a href="#event_recordingState"><code>recordingState</code> event</a>.</small>
 *   <small>Defined only when <code>state</code> is <code>LINK</code>.</small></p></li>
 *   <li><code>error</code><var><b>{</b>Error<b>}</b></var><p>The recording session error.
 *   <small>Defined only when <code>state</code> is <code>ERROR</code>.</small></p></li></ul></li></ul>
 * @example
 *   // Example 1: Get recording sessions
 *   skylinkDemo.getRecordings();
 * @beta
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype.getRecordings = function () {
  return clone(this._recordings);
};

/**
 * Function that handles and processes the socket message received.
 * @method _processSigMessage
 * @private
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype._processSigMessage = function(message, session) {
  var origin = message.mid;
  if (!origin || origin === this._user.id) {
    origin = 'Server';
  }
  log.debug([origin, null, null, 'Received from peer ->'], message.type);
  if (message.mid === this._user.id &&
    message.type !== this._SIG_MESSAGE_TYPE.REDIRECT &&
    message.type !== this._SIG_MESSAGE_TYPE.IN_ROOM) {
    log.debug([origin, null, null, 'Ignoring message ->'], message.type);
    return;
  }
  switch (message.type) {
  //--- BASIC API Messages ----
  case this._SIG_MESSAGE_TYPE.PUBLIC_MESSAGE:
    this._publicMessageHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.PRIVATE_MESSAGE:
    this._privateMessageHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.IN_ROOM:
    this._inRoomHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.ENTER:
    this._enterHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.WELCOME:
    this._welcomeHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.RESTART:
    this._restartHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.OFFER:
    this._offerHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.ANSWER:
    this._answerHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.CANDIDATE:
    this._candidateHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.BYE:
    this._byeHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.REDIRECT:
    this._redirectHandler(message);
    break;
    //--- ADVANCED API Messages ----
  case this._SIG_MESSAGE_TYPE.UPDATE_USER:
    this._updateUserEventHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.MUTE_VIDEO:
    this._muteVideoEventHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.MUTE_AUDIO:
    this._muteAudioEventHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.STREAM:
    this._streamEventHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.ROOM_LOCK:
    this._roomLockEventHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.PEER_LIST:
    this._peerListEventHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.INTRODUCE_ERROR:
    this._introduceErrorEventHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.APPROACH:
    this._approachEventHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.RECORDING:
    this._recordingEventHandler(message);
    break;
  case this._SIG_MESSAGE_TYPE.END_OF_CANDIDATES:
    this._endOfCandidatesHandler(message);
    break;
  default:
    log.error([message.mid, null, null, 'Unsupported message ->'], message.type);
    break;
  }
};

/**
 * Function that handles the "peerList" socket message received.
 * See confluence docs for the "peerList" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _peerListEventHandler
 * @private
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype._peerListEventHandler = function(message){
  var self = this;
  self._peerList = message.result;
  log.log(['Server', null, message.type, 'Received list of peers'], self._peerList);
  self._trigger('getPeersStateChange',self.GET_PEERS_STATE.RECEIVED, self._user.id, self._peerList);
};

/**
 * Function that handles the "endOfCandidates" socket message received.
 * See confluence docs for the "endOfCandidates" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _endOfCandidatesHandler
 * @private
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype._endOfCandidatesHandler = function(message){
  var self = this;
  var targetMid = message.mid;

  if (!(self._peerConnections[targetMid] &&
    self._peerConnections[targetMid].signalingState !== self.PEER_CONNECTION_STATE.CLOSED)) {
    return;
  }

  self._peerEndOfCandidatesCounter[targetMid].expectedLen = message.noOfExpectedCandidates || 0;
  self._signalingEndOfCandidates(targetMid);
};

/**
 * Function that handles the "introduceError" socket message received.
 * See confluence docs for the "introduceError" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _introduceErrorEventHandler
 * @private
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype._introduceErrorEventHandler = function(message){
  var self = this;
  log.log(['Server', null, message.type, 'Introduce failed. Reason: '+message.reason]);
  self._trigger('introduceStateChange',self.INTRODUCE_STATE.ERROR, self._user.id,
    message.sendingPeerId, message.receivingPeerId, message.reason);
};

/**
 * Function that handles the "approach" socket message received.
 * See confluence docs for the "approach" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _approachEventHandler
 * @private
 * @for Skylink
 * @since 0.6.1
 */
Skylink.prototype._approachEventHandler = function(message){
  var self = this;
  log.log(['Server', null, message.type, 'Approaching peer'], message.target);
  // self._room.connection.peerConfig = self._setIceServers(message.pc_config);
  // self._user.room.connected = true;
  self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.ENTER, self._user.id);

  var enterMsg = {
    type: self._SIG_MESSAGE_TYPE.ENTER,
    mid: self._user.id,
    rid: self._user.room.session.rid,
    agent: window.webrtcDetectedBrowser,
    version: (window.webrtcDetectedVersion || 0).toString(),
    os: window.navigator.platform,
    userInfo: self._getUserInfo(),
    receiveOnly: self.getPeerInfo().config.receiveOnly,
    target: message.target,
    weight: self._user.priorityWeight,
    temasysPluginVersion: AdapterJS.WebRTCPlugin.plugin ? AdapterJS.WebRTCPlugin.plugin.VERSION : null,
    enableIceTrickle: self._options.enableIceTrickle,
    enableDataChannel: self._options.enableDataChannel,
    enableIceRestart: self._enableIceRestart,
    SMProtocolVersion: self.SM_PROTOCOL_VERSION,
    DTProtocolVersion: self.DT_PROTOCOL_VERSION
  };

  if (self._user.connection.publishOnly) {
    enterMsg.publishOnly = {
      type: self._streams.screenshare && self._streams.screenshare.stream ? 'screenshare' : 'video'
    };
  }

  if (self._user.parentId) {
    enterMsg.parentId = self._user.parentId;
  }

  self._socketSendMessage(enterMsg);
};

/**
 * Function that handles the "redirect" socket message received.
 * See confluence docs for the "redirect" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _redirectHandler
 * @private
 * @for Skylink
 * @since 0.5.1
 */
Skylink.prototype._redirectHandler = function(message) {
  log.log(['Server', null, message.type, 'System action warning:'], {
    message: message.info,
    reason: message.reason,
    action: message.action
  });

  if (message.action === this.SYSTEM_ACTION.REJECT) {
  	for (var key in this._peerConnections) {
  		if (this._peerConnections.hasOwnProperty(key)) {
  			this._removePeer(key);
  		}
  	}
  }

  // Handle the differences provided in Signaling server
  if (message.reason === 'toClose') {
    message.reason = 'toclose';
  }

  this._trigger('systemAction', message.action, message.info, message.reason);
};

/**
 * Function that handles the "updateUserEvent" socket message received.
 * See confluence docs for the "updateUserEvent" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _updateUserEventHandler
 * @private
 * @for Skylink
 * @since 0.2.0
 */
Skylink.prototype._updateUserEventHandler = function(message) {
  var targetMid = message.mid;
  log.log([targetMid, null, message.type, 'Peer updated userData:'], message.userData);
  if (this._peerInformations[targetMid]) {
    if (this._peerMessagesStamps[targetMid] && typeof message.stamp === 'number') {
      if (message.stamp < this._peerMessagesStamps[targetMid].userData) {
        log.warn([targetMid, null, message.type, 'Dropping outdated status ->'], message);
        return;
      }
      this._peerMessagesStamps[targetMid].userData = message.stamp;
    }
    this._peerInformations[targetMid].userData = message.userData || {};
    this._trigger('peerUpdated', targetMid, this.getPeerInfo(targetMid), false);
  } else {
    log.log([targetMid, null, message.type, 'Peer does not have any user information']);
  }
};

/**
 * Function that handles the "roomLockEvent" socket message received.
 * See confluence docs for the "roomLockEvent" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _roomLockEventHandler
 * @private
 * @for Skylink
 * @since 0.2.0
 */
Skylink.prototype._roomLockEventHandler = function(message) {
  var targetMid = message.mid;
  log.log([targetMid, message.type, 'Room lock status:'], message.lock);
  this._trigger('roomLock', message.lock, targetMid, this.getPeerInfo(targetMid), false);
};

/**
 * Function that handles the "muteAudioEvent" socket message received.
 * See confluence docs for the "muteAudioEvent" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _muteAudioEventHandler
 * @private
 * @for Skylink
 * @since 0.2.0
 */
Skylink.prototype._muteAudioEventHandler = function(message) {
  var targetMid = message.mid;
  log.log([targetMid, null, message.type, 'Peer\'s audio muted:'], message.muted);
  if (this._peerInformations[targetMid]) {
    if (this._peerMessagesStamps[targetMid] && typeof message.stamp === 'number') {
      if (message.stamp < this._peerMessagesStamps[targetMid].audioMuted) {
        log.warn([targetMid, null, message.type, 'Dropping outdated status ->'], message);
        return;
      }
      this._peerMessagesStamps[targetMid].audioMuted = message.stamp;
    }
    this._peerInformations[targetMid].mediaStatus.audioMuted = message.muted;
    this._trigger('streamMuted', targetMid, this.getPeerInfo(targetMid), false,
      this._peerInformations[targetMid].settings.video &&
      this._peerInformations[targetMid].settings.video.screenshare);
    this._trigger('peerUpdated', targetMid, this.getPeerInfo(targetMid), false);
  } else {
    log.log([targetMid, message.type, 'Peer does not have any user information']);
  }
};

/**
 * Function that handles the "muteVideoEvent" socket message received.
 * See confluence docs for the "muteVideoEvent" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _muteVideoEventHandler
 * @private
 * @for Skylink
 * @since 0.2.0
 */
Skylink.prototype._muteVideoEventHandler = function(message) {
  var targetMid = message.mid;
  log.log([targetMid, null, message.type, 'Peer\'s video muted:'], message.muted);
  if (this._peerInformations[targetMid]) {
    if (this._peerMessagesStamps[targetMid] && typeof message.stamp === 'number') {
      if (message.stamp < this._peerMessagesStamps[targetMid].videoMuted) {
        log.warn([targetMid, null, message.type, 'Dropping outdated status ->'], message);
        return;
      }
      this._peerMessagesStamps[targetMid].videoMuted = message.stamp;
    }
    this._peerInformations[targetMid].mediaStatus.videoMuted = message.muted;
    this._trigger('streamMuted', targetMid, this.getPeerInfo(targetMid), false,
      this._peerInformations[targetMid].settings.video &&
      this._peerInformations[targetMid].settings.video.screenshare);
    this._trigger('peerUpdated', targetMid, this.getPeerInfo(targetMid), false);
  } else {
    log.log([targetMid, null, message.type, 'Peer does not have any user information']);
  }
};

/**
 * Function that handles the "stream" socket message received.
 * See confluence docs for the "stream" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _streamEventHandler
 * @private
 * @for Skylink
 * @since 0.2.0
 */
Skylink.prototype._streamEventHandler = function(message) {
  var targetMid = message.mid;
  log.log([targetMid, null, message.type, 'Peer\'s stream status:'], message.status);

  if (this._peerInformations[targetMid] && message.streamId) {
    this._streamsSession[targetMid] = this._streamsSession[targetMid] || {};
    if (message.status === 'ended') {
      if (message.settings && typeof message.settings === 'object' &&
        typeof this._streamsSession[targetMid][message.streamId] === 'undefined') {
        this._streamsSession[targetMid][message.streamId] = {
          audio: message.settings.audio,
          video: message.settings.video
        };
      }

      this._handleEndedStreams(targetMid, message.streamId);
  	}
  } else {
    // Probably left the room already
    log.log([targetMid, null, message.type, 'Peer does not have any user information']);
  }
};

/**
 * Function that handles the "bye" socket message received.
 * See confluence docs for the "bye" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _byeHandler
 * @private
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype._byeHandler = function(message) {
  var targetMid = message.mid;
  var selfId = (this._user || {}).sid;

  if (selfId !== targetMid){
    log.log([targetMid, null, message.type, 'Peer has left the room']);
    this._removePeer(targetMid);
  } else {
    log.log([targetMid, null, message.type, 'Self has left the room']);
  }
};

/**
 * Function that handles the "private" socket message received.
 * See confluence docs for the "private" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _privateMessageHandler
 * @private
 * @for Skylink
 * @since 0.4.0
 */
Skylink.prototype._privateMessageHandler = function(message) {
  var targetMid = message.mid;
  log.log([targetMid, null, message.type,
    'Received private message from peer:'], message.data);
  this._trigger('incomingMessage', {
    content: message.data,
    isPrivate: true,
    targetPeerId: message.target, // is not null if there's user
    isDataChannel: false,
    senderPeerId: targetMid
  }, targetMid, this.getPeerInfo(targetMid), false);
};

/**
 * Function that handles the "public" socket message received.
 * See confluence docs for the "public" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _publicMessageHandler
 * @private
 * @for Skylink
 * @since 0.4.0
 */
Skylink.prototype._publicMessageHandler = function(message) {
  var targetMid = message.mid;
  log.log([targetMid, null, message.type,
    'Received public message from peer:'], message.data);
  this._trigger('incomingMessage', {
    content: message.data,
    isPrivate: false,
    targetPeerId: null, // is not null if there's user
    isDataChannel: false,
    senderPeerId: targetMid
  }, targetMid, this.getPeerInfo(targetMid), false);
};

/**
 * Handles the RECORDING Protocol message event received from the platform signaling.
 * @method _recordingEventHandler
 * @param {JSON} message The message object received from platform signaling.
 *    This should contain the <code>RECORDING</code> payload.
 * @param {String} message.url The recording URL if mixing has completed.
 * @param {String} message.action The recording action received.
 * @param {String} message.error The recording error exception received.
 * @private
 * @beta
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._recordingEventHandler = function (message) {
  var self = this;

  log.debug(['MCU', 'Recording', null, 'Received recording message ->'], message);

  if (message.action === 'on') {
    if (!self._recordings[message.recordingId]) {
      log.debug(['MCU', 'Recording', message.recordingId, 'Started recording']);

      self._currentRecordingId = message.recordingId;
      self._recordings[message.recordingId] = {
        active: true,
        state: self.RECORDING_STATE.START,
        startedDateTime: (new Date()).toISOString(),
        endedDateTime: null,
        mixingDateTime: null,
        links: null,
        error: null
      };
      self._recordingStartInterval = setTimeout(function () {
        log.log(['MCU', 'Recording', message.recordingId, '4 seconds has been recorded. Recording can be stopped now']);
        self._recordingStartInterval = null;
      }, 4000);
      self._trigger('recordingState', self.RECORDING_STATE.START, message.recordingId, null, null);
    }

  } else if (message.action === 'off') {
    if (!self._recordings[message.recordingId]) {
      log.error(['MCU', 'Recording', message.recordingId, 'Received request of "off" but the session is empty']);
      return;
    }

    self._currentRecordingId = null;

    if (self._recordingStartInterval) {
      clearTimeout(self._recordingStartInterval);
      log.warn(['MCU', 'Recording', message.recordingId, 'Recording stopped abruptly before 4 seconds']);
      self._recordingStartInterval = null;
    }

    log.debug(['MCU', 'Recording', message.recordingId, 'Stopped recording']);

    self._recordings[message.recordingId].active = false;
    self._recordings[message.recordingId].state = self.RECORDING_STATE.STOP;
    self._recordings[message.recordingId].endedDateTime = (new Date()).toISOString();
    self._trigger('recordingState', self.RECORDING_STATE.STOP, message.recordingId, null, null);

  } else if (message.action === 'url') {
    if (!self._recordings[message.recordingId]) {
      log.error(['MCU', 'Recording', message.recordingId, 'Received URL but the session is empty']);
      return;
    }

    var links = {};

    if (Array.isArray(message.urls)) {
      for (var i = 0; i < message.urls.length; i++) {
        links[messages.urls[i].id || ''] = messages.urls[i].url || '';
      }
    } else if (typeof message.url === 'string') {
      links.mixin = message.url;
    }

    self._recordings[message.recordingId].links = links;
    self._recordings[message.recordingId].state = self.RECORDING_STATE.LINK;
    self._recordings[message.recordingId].mixingDateTime = (new Date()).toISOString();
    self._trigger('recordingState', self.RECORDING_STATE.LINK, message.recordingId, links, null);

  } else {
    var recordingError = new Error(message.error || 'Unknown error');
    if (!self._recordings[message.recordingId]) {
      log.error(['MCU', 'Recording', message.recordingId, 'Received error but the session is empty ->'], recordingError);
      return;
    }

    log.error(['MCU', 'Recording', message.recordingId, 'Recording failure ->'], recordingError);

    self._recordings[message.recordingId].state = self.RECORDING_STATE.ERROR;
    self._recordings[message.recordingId].error = recordingError;

    if (self._recordings[message.recordingId].active) {
      log.debug(['MCU', 'Recording', message.recordingId, 'Stopped recording abruptly']);
      self._recordings[message.recordingId].active = false;
      //self._trigger('recordingState', self.RECORDING_STATE.STOP, message.recordingId, null, recordingError);
    }

    self._trigger('recordingState', self.RECORDING_STATE.ERROR, message.recordingId, null, recordingError);
  }
};

/**
 * Function that handles the "inRoom" socket message received.
 * See confluence docs for the "inRoom" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _inRoomHandler
 * @private
 * @for Skylink
 * @since 0.1.0
 */
Skylink.prototype._inRoomHandler = function(message) {
  var self = this;
  log.log(['Server', null, message.type, 'User is now in the room and ' +
    'functionalities are now available. Config received:'], message.pc_config);
  self._user.iceServers = self._setIceServers(message.pc_config);
  self._user.room.connected = true;
  self._user.id = message.sid;
  self._user.priorityWeight = message.tieBreaker;

  self._trigger('peerJoined', self._user.id, self.getPeerInfo(), true);
  self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.ENTER, self._user.id);

  var streamId = null;

  if (self._streams.screenshare && self._streams.screenshare.stream) {
    streamId = self._streams.screenshare.stream.id || self._streams.screenshare.stream.label;
    self._trigger('incomingStream', self._user.id, self._streams.screenshare.stream, true, self.getPeerInfo(), true, streamId);
  } else if (self._streams.userMedia && self._streams.userMedia.stream) {
    streamId = self._streams.userMedia.stream.id || self._streams.userMedia.stream.label;
    self._trigger('incomingStream', self._user.id, self._streams.userMedia.stream, true, self.getPeerInfo(), false, streamId);
  }
  // NOTE ALEX: should we wait for local streams?
  // or just go with what we have (if no stream, then one way?)
  // do we hardcode the logic here, or give the flexibility?
  // It would be better to separate, do we could choose with whom
  // we want to communicate, instead of connecting automatically to all.
  var enterMsg = {
    type: self._SIG_MESSAGE_TYPE.ENTER,
    mid: self._user.id,
    rid: self._user.room.session.rid,
    agent: window.webrtcDetectedBrowser,
    version: (window.webrtcDetectedVersion || 0).toString(),
    os: window.navigator.platform,
    userInfo: self._getUserInfo(),
    receiveOnly: self.getPeerInfo().config.receiveOnly,
    weight: self._user.priorityWeight,
    temasysPluginVersion: AdapterJS.WebRTCPlugin.plugin ? AdapterJS.WebRTCPlugin.plugin.VERSION : null,
    enableIceTrickle: self._options.enableIceTrickle,
    enableDataChannel: self._options.enableDataChannel,
    enableIceRestart: self._enableIceRestart,
    SMProtocolVersion: self.SM_PROTOCOL_VERSION,
    DTProtocolVersion: self.DT_PROTOCOL_VERSION
  };

  if (self._user.connection.publishOnly) {
    enterMsg.publishOnly = {
      type: self._streams.screenshare && self._streams.screenshare.stream ? 'screenshare' : 'video'
    };
  }

  if (self._user.parentId) {
    enterMsg.parentId = self._user.parentId;
  }

  self._socketSendMessage(enterMsg);
};

/**
 * Function that handles the "enter" socket message received.
 * See confluence docs for the "enter" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _enterHandler
 * @private
 * @for Skylink
 * @since 0.5.1
 */
Skylink.prototype._enterHandler = function(message) {
  var self = this;
  var targetMid = message.mid;
  var isNewPeer = false;
  var userInfo = message.userInfo || {};
  userInfo.settings = userInfo.settings || {};
  userInfo.mediaStatus = userInfo.mediaStatus || {};
  userInfo.config = {
    enableIceTrickle: typeof message.enableIceTrickle === 'boolean' ? message.enableIceTrickle : true,
    enableIceRestart: typeof message.enableIceRestart === 'boolean' ? message.enableIceRestart : false,
    enableDataChannel: typeof message.enableDataChannel === 'boolean' ? message.enableDataChannel : true,
    priorityWeight: typeof message.weight === 'number' ? message.weight : 0,
    receiveOnly: message.receiveOnly === true,
    publishOnly: !!message.publishOnly
  };
  userInfo.parentId = message.parentId || null;
  userInfo.agent = {
    name: typeof message.agent === 'string' && message.agent ? message.agent : 'other',
    version: (function () {
      if (!(message.version && typeof message.version === 'string')) {
        return 0;
      }
      // E.g. 0.9.6, replace minor "." with 0
      if (message.version.indexOf('.') > -1) {
        var parts = message.version.split('.');
        if (parts.length > 2) {
          var majorVer = parts[0] || '0';
          parts.splice(0, 1);
          return parseFloat(majorVer + '.' + parts.join('0'), 10);
        }
        return parseFloat(message.version || '0', 10);
      }
      return parseInt(message.version || '0', 10);
    })(),
    os: typeof message.os === 'string' && message.os ? message.os : '',
    pluginVersion: typeof message.temasysPluginVersion === 'string' && message.temasysPluginVersion ?
      message.temasysPluginVersion : null,
    SMProtocolVersion: message.SMProtocolVersion && typeof message.SMProtocolVersion === 'string' ?
      message.SMProtocolVersion : '0.1.1',
    DTProtocolVersion: message.DTProtocolVersion && typeof message.DTProtocolVersion === 'string' ?
      message.DTProtocolVersion : '0.1.0'
  };

  log.log([targetMid, 'RTCPeerConnection', null, 'Peer "enter" received ->'], message);

  if (targetMid !== 'MCU' && self._user.parentId && self._user.parentId === targetMid) {
    log.warn([targetMid, 'RTCPeerConnection', null, 'Discarding "enter" for parentId case ->'], message);
    return;
  }

  if (!self._peerInformations[targetMid]) {
    isNewPeer = true;

    self._peerInformations[targetMid] = userInfo;

    var hasScreenshare = userInfo.settings.video && typeof userInfo.settings.video === 'object' &&
      !!userInfo.settings.video.screenshare;

    self._addPeer(targetMid, {
      agent: userInfo.agent.name,
      version: userInfo.agent.version,
      os: userInfo.agent.os
    }, false, false, message.receiveOnly, hasScreenshare);

    if (targetMid === 'MCU') {
      log.info([targetMid, 'RTCPeerConnection', null, 'MCU feature has been enabled']);

      self._hasMCU = true;
      self._trigger('serverPeerJoined', targetMid, self.SERVER_PEER_TYPE.MCU);

    } else {
      self._trigger('peerJoined', targetMid, self.getPeerInfo(targetMid), false);
    }

    self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.ENTER, targetMid);
  }

  self._peerMessagesStamps[targetMid] = self._peerMessagesStamps[targetMid] || {
    userData: 0,
    audioMuted: 0,
    videoMuted: 0
  };

  var welcomeMsg = {
    type: self._SIG_MESSAGE_TYPE.WELCOME,
    mid: self._user.id,
    rid: self._user.room.session.rid,
    enableIceTrickle: self._options.enableIceTrickle,
    enableDataChannel: self._options.enableDataChannel,
    enableIceRestart: self._enableIceRestart,
    agent: window.webrtcDetectedBrowser,
    version: (window.webrtcDetectedVersion || 0).toString(),
    receiveOnly: self.getPeerInfo().config.receiveOnly,
    os: window.navigator.platform,
    userInfo: self._getUserInfo(),
    target: targetMid,
    weight: self._user.priorityWeight,
    temasysPluginVersion: AdapterJS.WebRTCPlugin.plugin ? AdapterJS.WebRTCPlugin.plugin.VERSION : null,
    SMProtocolVersion: self.SM_PROTOCOL_VERSION,
    DTProtocolVersion: self.DT_PROTOCOL_VERSION
  };

  if (self._user.connection.publishOnly) {
    welcomeMsg.publishOnly = {
      type: self._streams.screenshare && self._streams.screenshare.stream ? 'screenshare' : 'video'
    };
  }

  if (self._user.parentId) {
    welcomeMsg.parentId = self._user.parentId;
  }

  self._socketSendMessage(welcomeMsg);

  if (isNewPeer) {
    self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.WELCOME, targetMid);
  }
};

/**
 * Function that handles the "restart" socket message received.
 * See confluence docs for the "restart" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _restartHandler
 * @private
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype._restartHandler = function(message){
  var self = this;
  var targetMid = message.mid;
  var userInfo = message.userInfo || {};
  userInfo.settings = userInfo.settings || {};
  userInfo.mediaStatus = userInfo.mediaStatus || {};
  userInfo.config = {
    enableIceTrickle: typeof message.enableIceTrickle === 'boolean' ? message.enableIceTrickle : true,
    enableIceRestart: typeof message.enableIceRestart === 'boolean' ? message.enableIceRestart : false,
    enableDataChannel: typeof message.enableDataChannel === 'boolean' ? message.enableDataChannel : true,
    priorityWeight: typeof message.weight === 'number' ? message.weight : 0,
    receiveOnly: message.receiveOnly === true,
    publishOnly: !!message.publishOnly
  };
  userInfo.parentId = message.parentId || null;
  userInfo.agent = {
    name: typeof message.agent === 'string' && message.agent ? message.agent : 'other',
    version: (function () {
      if (!(message.version && typeof message.version === 'string')) {
        return 0;
      }
      // E.g. 0.9.6, replace minor "." with 0
      if (message.version.indexOf('.') > -1) {
        var parts = message.version.split('.');
        if (parts.length > 2) {
          var majorVer = parts[0] || '0';
          parts.splice(0, 1);
          return parseFloat(majorVer + '.' + parts.join('0'), 10);
        }
        return parseFloat(message.version || '0', 10);
      }
      return parseInt(message.version || '0', 10);
    })(),
    os: typeof message.os === 'string' && message.os ? message.os : '',
    pluginVersion: typeof message.temasysPluginVersion === 'string' && message.temasysPluginVersion ?
      message.temasysPluginVersion : null,
    SMProtocolVersion: message.SMProtocolVersion && typeof message.SMProtocolVersion === 'string' ?
      message.SMProtocolVersion : '0.1.1',
    DTProtocolVersion: message.DTProtocolVersion && typeof message.DTProtocolVersion === 'string' ?
      message.DTProtocolVersion : '0.1.0'
  };

  log.log([targetMid, 'RTCPeerConnection', null, 'Peer "restart" received ->'], message);

  if (!self._peerInformations[targetMid]) {
    log.error([targetMid, 'RTCPeerConnection', null, 'Peer does not have an existing session. Ignoring restart process.']);
    return;
  }

  if (targetMid !== 'MCU' && self._user.parentId && self._user.parentId === targetMid) {
    log.warn([targetMid, 'RTCPeerConnection', null, 'Discarding "restart" for parentId case ->'], message);
    return;
  }

  if (self._hasMCU && !self._mcuUseRenegoRestart) {
    log.warn([targetMid, 'RTCPeerConnection', null, 'Dropping restart request as MCU does not support re-negotiation. ' +
      'Restart workaround is to re-join Room for Peer.']);
    self._trigger('peerRestart', targetMid, self.getPeerInfo(targetMid), false, false);
    return;
  }

  self._peerInformations[targetMid] = userInfo;
  self._peerMessagesStamps[targetMid] = self._peerMessagesStamps[targetMid] || {
    userData: 0,
    audioMuted: 0,
    videoMuted: 0
  };
  self._peerEndOfCandidatesCounter[targetMid] = self._peerEndOfCandidatesCounter[targetMid] || {};
  self._peerEndOfCandidatesCounter[targetMid].len = 0;

  // Make peer with highest weight do the offer
  if (self._user.priorityWeight > message.weight) {
    log.debug([targetMid, 'RTCPeerConnection', null, 'Re-negotiating new offer/answer.']);

    if (self._peerMessagesStamps[targetMid].hasRestart) {
      log.warn([targetMid, 'RTCPeerConnection', null, 'Discarding extra "restart" received.']);
      return;
    }

    self._peerMessagesStamps[targetMid].hasRestart = true;
    self._doOffer(targetMid, message.doIceRestart === true, {
      agent: userInfo.agent.name,
      version: userInfo.agent.version,
      os: userInfo.agent.os
    }, true);

  } else {
    log.debug([targetMid, 'RTCPeerConnection', null, 'Waiting for peer to start re-negotiation.']);

    var restartMsg = {
      type: self._SIG_MESSAGE_TYPE.RESTART,
      mid: self._user.id,
      rid: self._user.room.session.rid,
      agent: window.webrtcDetectedBrowser,
      version: (window.webrtcDetectedVersion || 0).toString(),
      os: window.navigator.platform,
      userInfo: self._getUserInfo(),
      target: targetMid,
      weight: self._user.priorityWeight,
      enableIceTrickle: self._options.enableIceTrickle,
      enableDataChannel: self._options.enableDataChannel,
      enableIceRestart: self._enableIceRestart,
      doIceRestart: message.doIceRestart === true,
      receiveOnly: self.getPeerInfo().config.receiveOnly,
      isRestartResend: true,
      temasysPluginVersion: AdapterJS.WebRTCPlugin.plugin ? AdapterJS.WebRTCPlugin.plugin.VERSION : null,
      SMProtocolVersion: self.SM_PROTOCOL_VERSION,
      DTProtocolVersion: self.DT_PROTOCOL_VERSION,
    };

    if (self._user.connection.publishOnly) {
      restartMsg.publishOnly = {
        type: self._streams.screenshare && self._streams.screenshare.stream ? 'screenshare' : 'video'
      };
    }

    if (self._user.parentId) {
      restartMsg.parentId = self._user.parentId;
    }

    self._socketSendMessage(restartMsg);
  }

  self._trigger('peerRestart', targetMid, self.getPeerInfo(targetMid), false, message.doIceRestart === true);
};

/**
 * Function that handles the "welcome" socket message received.
 * See confluence docs for the "welcome" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _welcomeHandler
 * @private
 * @for Skylink
 * @since 0.5.4
 */
Skylink.prototype._welcomeHandler = function(message) {
  var self = this;
  var targetMid = message.mid;
  var isNewPeer = false;
  var userInfo = message.userInfo || {};
  userInfo.settings = userInfo.settings || {};
  userInfo.mediaStatus = userInfo.mediaStatus || {};
  userInfo.config = {
    enableIceTrickle: typeof message.enableIceTrickle === 'boolean' ? message.enableIceTrickle : true,
    enableIceRestart: typeof message.enableIceRestart === 'boolean' ? message.enableIceRestart : false,
    enableDataChannel: typeof message.enableDataChannel === 'boolean' ? message.enableDataChannel : true,
    priorityWeight: typeof message.weight === 'number' ? message.weight : 0,
    receiveOnly: message.receiveOnly === true,
    publishOnly: !!message.publishOnly
  };
  userInfo.parentId = message.parentId || null;
  userInfo.agent = {
    name: typeof message.agent === 'string' && message.agent ? message.agent : 'other',
    version: (function () {
      if (!(message.version && typeof message.version === 'string')) {
        return 0;
      }
      // E.g. 0.9.6, replace minor "." with 0
      if (message.version.indexOf('.') > -1) {
        var parts = message.version.split('.');
        if (parts.length > 2) {
          var majorVer = parts[0] || '0';
          parts.splice(0, 1);
          return parseFloat(majorVer + '.' + parts.join('0'), 10);
        }
        return parseFloat(message.version || '0', 10);
      }
      return parseInt(message.version || '0', 10);
    })(),
    os: typeof message.os === 'string' && message.os ? message.os : '',
    pluginVersion: typeof message.temasysPluginVersion === 'string' && message.temasysPluginVersion ?
      message.temasysPluginVersion : null,
    SMProtocolVersion: message.SMProtocolVersion && typeof message.SMProtocolVersion === 'string' ?
      message.SMProtocolVersion : '0.1.1',
    DTProtocolVersion: message.DTProtocolVersion && typeof message.DTProtocolVersion === 'string' ?
      message.DTProtocolVersion : '0.1.0'
  };

  log.log([targetMid, 'RTCPeerConnection', null, 'Peer "welcome" received ->'], message);

  if (targetMid !== 'MCU' && self._user.parentId && self._user.parentId === targetMid) {
    log.warn([targetMid, 'RTCPeerConnection', null, 'Discarding "welcome" for parentId case ->'], message);
    return;
  }

  if (!self._peerInformations[targetMid]) {
    isNewPeer = true;

    self._peerInformations[targetMid] = userInfo;

    var hasScreenshare = userInfo.settings.video && typeof userInfo.settings.video === 'object' &&
      !!userInfo.settings.video.screenshare;

    self._addPeer(targetMid, {
      agent: userInfo.agent.name,
      version: userInfo.agent.version,
      os: userInfo.agent.os
    }, false, false, message.receiveOnly, hasScreenshare);

    if (targetMid === 'MCU') {
      log.info([targetMid, 'RTCPeerConnection', null, 'MCU feature has been enabled']);

      self._hasMCU = true;
      self._trigger('serverPeerJoined', targetMid, self.SERVER_PEER_TYPE.MCU);

    } else {
      self._trigger('peerJoined', targetMid, self.getPeerInfo(targetMid), false);
    }

    self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.ENTER, targetMid);
    self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.WELCOME, targetMid);
  }

  self._peerMessagesStamps[targetMid] = self._peerMessagesStamps[targetMid] || {
    userData: 0,
    audioMuted: 0,
    videoMuted: 0,
    hasWelcome: false
  };

  if (self._hasMCU || self._user.priorityWeight > message.weight) {
    if (self._peerMessagesStamps[targetMid].hasWelcome) {
      log.warn([targetMid, 'RTCPeerConnection', null, 'Discarding extra "welcome" received.']);
      return;
    }

    log.debug([targetMid, 'RTCPeerConnection', null, 'Starting negotiation']);

    self._peerMessagesStamps[targetMid].hasWelcome = true;
    self._doOffer(targetMid, false, {
      agent: userInfo.agent.name,
      version: userInfo.agent.version,
      os: userInfo.agent.os
    }, true);

  } else {
    log.debug([targetMid, 'RTCPeerConnection', null, 'Waiting for peer to start negotiation.']);

    var welcomeMsg = {
      type: self._SIG_MESSAGE_TYPE.WELCOME,
      mid: self._user.id,
      rid: self._user.room.session.rid,
      enableIceTrickle: self._options.enableIceTrickle,
      enableDataChannel: self._options.enableDataChannel,
      enableIceRestart: self._enableIceRestart,
      receiveOnly: self.getPeerInfo().config.receiveOnly,
      agent: window.webrtcDetectedBrowser,
      version: (window.webrtcDetectedVersion || 0).toString(),
      os: window.navigator.platform,
      userInfo: self._getUserInfo(),
      target: targetMid,
      weight: self._user.priorityWeight,
      temasysPluginVersion: AdapterJS.WebRTCPlugin.plugin ? AdapterJS.WebRTCPlugin.plugin.VERSION : null,
      SMProtocolVersion: self.SM_PROTOCOL_VERSION,
      DTProtocolVersion: self.DT_PROTOCOL_VERSION
    };

    if (self._user.connection.publishOnly) {
      welcomeMsg.publishOnly = {
        type: self._streams.screenshare && self._streams.screenshare.stream ? 'screenshare' : 'video'
      };
    }

    if (self._user.parentId) {
      welcomeMsg.parentId = self._user.parentId;
    }

    self._socketSendMessage(welcomeMsg);
  }
};

/**
 * Function that handles the "offer" socket message received.
 * See confluence docs for the "offer" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _offerHandler
 * @private
 * @for Skylink
 * @since 0.5.1
 */
Skylink.prototype._offerHandler = function(message) {
  var self = this;
  var targetMid = message.mid;
  var pc = self._peerConnections[targetMid];

  if (!pc) {
    log.error([targetMid, null, message.type, 'Peer connection object ' +
      'not found. Unable to setRemoteDescription for offer']);
    return;
  }

  /*if (pc.localDescription ? !!pc.localDescription.sdp : false) {
    log.warn([targetMid, null, message.type, 'Peer has an existing connection'],
      pc.localDescription);
    return;
  }*/

  // Add-on by Web SDK fixes
  if (message.userInfo && typeof message.userInfo === 'object') {
    var userInfo = message.userInfo || {};

    self._peerInformations[targetMid].settings = userInfo.settings || {};
    self._peerInformations[targetMid].mediaStatus = userInfo.mediaStatus || {};
    self._peerInformations[targetMid].userData = userInfo.userData;
  }

  log.log([targetMid, null, message.type, 'Received offer from peer. ' +
    'Session description:'], clone(message));

  var offer = new RTCSessionDescription({
    type: message.type,
    sdp: self._hasMCU ? message.sdp.split('\n').join('\r\n') : message.sdp
  });
  log.log([targetMid, 'RTCSessionDescription', message.type,
    'Session description object created'], offer);

  offer.sdp = self._removeSDPFilteredCandidates(targetMid, offer);
  offer.sdp = self._setSDPCodec(targetMid, offer);
  offer.sdp = self._setSDPBitrate(targetMid, offer);
  offer.sdp = self._setSDPOpusConfig(targetMid, offer);
  offer.sdp = self._removeSDPCodecs(targetMid, offer);
  offer.sdp = self._removeSDPREMBPackets(targetMid, offer);
  offer.sdp = self._handleSDPConnectionSettings(targetMid, offer, 'remote');

  log.log([targetMid, 'RTCSessionDescription', message.type, 'Updated remote offer ->'], offer.sdp);

  // This is always the initial state. or even after negotiation is successful
  if (pc.signalingState !== self.PEER_CONNECTION_STATE.STABLE) {
    log.warn([targetMid, null, message.type, 'Peer connection state is not in ' +
      '"stable" state for re-negotiation. Dropping message.'], {
        signalingState: pc.signalingState,
        isRestart: !!message.resend
      });
    return;
  }

  // Added checks if there is a current remote sessionDescription being processing before processing this one
  if (pc.processingRemoteSDP) {
    log.warn([targetMid, 'RTCSessionDescription', 'offer',
      'Dropping of setting local offer as there is another ' +
      'sessionDescription being processed ->'], offer);
    return;
  }

  pc.processingRemoteSDP = true;

  // Edge FIXME problem: Add stream only at offer/answer end
  if (window.webrtcDetectedBrowser === 'edge' && (!self._hasMCU || targetMid === 'MCU')) {
    self._addLocalMediaStreams(targetMid);
  }

  pc.setRemoteDescription(offer, function() {
    log.debug([targetMid, 'RTCSessionDescription', message.type, 'Remote description set']);
    pc.setOffer = 'remote';
    pc.processingRemoteSDP = false;
    self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.OFFER, targetMid);
    self._addIceCandidateFromQueue(targetMid);
    self._doAnswer(targetMid);
  }, function(error) {
    self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.ERROR, targetMid, error);

    pc.processingRemoteSDP = false;

    log.error([targetMid, null, message.type, 'Failed setting remote description:'], error);
  });
};


/**
 * Function that handles the "candidate" socket message received.
 * See confluence docs for the "candidate" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _candidateHandler
 * @private
 * @for Skylink
 * @since 0.5.1
 */
Skylink.prototype._candidateHandler = function(message) {
  var targetMid = message.mid;

  if (!message.candidate && !message.id) {
    log.warn([targetMid, 'RTCIceCandidate', null, 'Received invalid ICE candidate message ->'], message);
    return;
  }

  var canId = 'can-' + (new Date()).getTime();
  var candidateType = message.candidate.split(' ')[7] || '';
  var candidate = new RTCIceCandidate({
    sdpMLineIndex: message.label,
    candidate: message.candidate,
    sdpMid: message.id
  });

  log.debug([targetMid, 'RTCIceCandidate', canId + ':' + candidateType, 'Received ICE candidate ->'], candidate);

  this._peerEndOfCandidatesCounter[targetMid] = this._peerEndOfCandidatesCounter[targetMid] || {};
  this._peerEndOfCandidatesCounter[targetMid].len = this._peerEndOfCandidatesCounter[targetMid].len || 0;
  this._peerEndOfCandidatesCounter[targetMid].hasSet = false;
  this._peerEndOfCandidatesCounter[targetMid].len++;

  this._trigger('candidateProcessingState', this.CANDIDATE_PROCESSING_STATE.RECEIVED,
    targetMid, canId, candidateType, {
    candidate: candidate.candidate,
    sdpMid: candidate.sdpMid,
    sdpMLineIndex: candidate.sdpMLineIndex
  }, null);

  if (!(this._peerConnections[targetMid] &&
    this._peerConnections[targetMid].signalingState !== this.PEER_CONNECTION_STATE.CLOSED)) {
    log.warn([targetMid, 'RTCIceCandidate', canId + ':' + candidateType, 'Dropping ICE candidate ' +
      'as Peer connection does not exists or is closed']);
    this._trigger('candidateProcessingState', this.CANDIDATE_PROCESSING_STATE.DROPPED,
      targetMid, canId, candidateType, {
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex
    }, new Error('Failed processing ICE candidate as Peer connection does not exists or is closed.'));
    this._signalingEndOfCandidates(targetMid);
    return;
  }

  if (this._options.filterCandidatesType[candidateType]) {
    if (!(this._hasMCU && this._forceTURN)) {
      log.warn([targetMid, 'RTCIceCandidate', canId + ':' + candidateType, 'Dropping received ICE candidate as ' +
        'it matches ICE candidate filtering flag ->'], candidate);
      this._trigger('candidateProcessingState', this.CANDIDATE_PROCESSING_STATE.DROPPED,
        targetMid, canId, candidateType, {
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex
      }, new Error('Dropping of processing ICE candidate as it matches ICE candidate filtering flag.'));
      this._signalingEndOfCandidates(targetMid);
      return;
    }

    log.warn([targetMid, 'RTCIceCandidate', canId + ':' + candidateType, 'Not dropping received ICE candidate as ' +
      'TURN connections are enforced as MCU is present (and act as a TURN itself) so filtering of ICE candidate ' +
      'flags are not honoured ->'], candidate);
  }

  if (this._peerConnections[targetMid].remoteDescription && this._peerConnections[targetMid].remoteDescription.sdp &&
    this._peerConnections[targetMid].localDescription && this._peerConnections[targetMid].localDescription.sdp) {
    this._addIceCandidate(targetMid, canId, candidate);
  } else {
    this._addIceCandidateToQueue(targetMid, canId, candidate);
  }

  this._signalingEndOfCandidates(targetMid);

  if (!this._gatheredCandidates[targetMid]) {
    this._gatheredCandidates[targetMid] = {
      sending: { host: [], srflx: [], relay: [] },
      receiving: { host: [], srflx: [], relay: [] }
    };
  }

  this._gatheredCandidates[targetMid].receiving[candidateType].push({
    sdpMid: candidate.sdpMid,
    sdpMLineIndex: candidate.sdpMLineIndex,
    candidate: candidate.candidate
  });
};

/**
 * Function that handles the "answer" socket message received.
 * See confluence docs for the "answer" expected properties to be received
 *   based on the current <code>SM_PROTOCOL_VERSION</code>.
 * @method _answerHandler
 * @private
 * @for Skylink
 * @since 0.5.1
 */
Skylink.prototype._answerHandler = function(message) {
  var self = this;
  var targetMid = message.mid;

  log.log([targetMid, null, message.type,
    'Received answer from peer. Session description:'], clone(message));

  var pc = self._peerConnections[targetMid];

  if (!pc) {
    log.error([targetMid, null, message.type, 'Peer connection object ' +
      'not found. Unable to setRemoteDescription for answer']);
    return;
  }

  // Add-on by Web SDK fixes
  if (message.userInfo && typeof message.userInfo === 'object') {
    var userInfo = message.userInfo || {};

    self._peerInformations[targetMid].settings = userInfo.settings || {};
    self._peerInformations[targetMid].mediaStatus = userInfo.mediaStatus || {};
    self._peerInformations[targetMid].userData = userInfo.userData;
  }

  var answer = new RTCSessionDescription({
    type: message.type,
    sdp: self._hasMCU ? message.sdp.split('\n').join('\r\n') : message.sdp
  });

  log.log([targetMid, 'RTCSessionDescription', message.type,
    'Session description object created'], answer);

  /*if (pc.remoteDescription ? !!pc.remoteDescription.sdp : false) {
    log.warn([targetMid, null, message.type, 'Peer has an existing connection'],
      pc.remoteDescription);
    return;
  }

  if (pc.signalingState === self.PEER_CONNECTION_STATE.STABLE) {
    log.error([targetMid, null, message.type, 'Unable to set peer connection ' +
      'at signalingState "stable". Ignoring remote answer'], pc.signalingState);
    return;
  }*/

  answer.sdp = self._removeSDPFilteredCandidates(targetMid, answer);
  answer.sdp = self._setSDPCodec(targetMid, answer);
  answer.sdp = self._setSDPBitrate(targetMid, answer);
  answer.sdp = self._setSDPOpusConfig(targetMid, answer);
  answer.sdp = self._removeSDPCodecs(targetMid, answer);
  answer.sdp = self._removeSDPREMBPackets(targetMid, answer);
  answer.sdp = self._handleSDPConnectionSettings(targetMid, answer, 'remote');

  log.log([targetMid, 'RTCSessionDescription', message.type, 'Updated remote answer ->'], answer.sdp);


  // This should be the state after offer is received. or even after negotiation is successful
  if (pc.signalingState !== self.PEER_CONNECTION_STATE.HAVE_LOCAL_OFFER) {
    log.warn([targetMid, null, message.type, 'Peer connection state is not in ' +
      '"have-local-offer" state for re-negotiation. Dropping message.'], {
        signalingState: pc.signalingState,
        isRestart: !!message.restart
      });
    return;
  }

  // Added checks if there is a current remote sessionDescription being processing before processing this one
  if (pc.processingRemoteSDP) {
    log.warn([targetMid, 'RTCSessionDescription', 'answer',
      'Dropping of setting local answer as there is another ' +
      'sessionDescription being processed ->'], answer);
    return;
  }

  pc.processingRemoteSDP = true;

  pc.setRemoteDescription(answer, function() {
    log.debug([targetMid, null, message.type, 'Remote description set']);
    pc.setAnswer = 'remote';
    pc.processingRemoteSDP = false;
    self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.ANSWER, targetMid);
    self._addIceCandidateFromQueue(targetMid);

    if (self._peerMessagesStamps[targetMid]) {
      self._peerMessagesStamps[targetMid].hasRestart = false;
    }

    if (self._dataChannels[targetMid] && (pc.remoteDescription.sdp.indexOf('m=application') === -1 ||
      pc.remoteDescription.sdp.indexOf('m=application 0') > 0)) {
      log.warn([targetMid, 'RTCPeerConnection', null, 'Closing all datachannels as they were rejected.']);
      self._closeDataChannel(targetMid);
    }

  }, function(error) {
    self._trigger('handshakeProgress', self.HANDSHAKE_PROGRESS.ERROR, targetMid, error);

    pc.processingRemoteSDP = false;

    log.error([targetMid, null, message.type, 'Failed setting remote description:'], {
      error: error,
      state: pc.signalingState
    });
  });
};

/**
 * Function that compares the SM / DT protocol versions to see if it in the version.
 * @method _isLowerThanVersion
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._isLowerThanVersion = function (agentVer, requiredVer) {
  var partsA = agentVer.split('.');
  var partsB = requiredVer.split('.');

  for (var i = 0; i < partsB.length; i++) {
    if (parseInt(partsA[i] || '0', 10) < parseInt(partsB[i] || '0', 10)) {
      return true;
    }
  }

  return false;
};

Skylink.prototype.VIDEO_CODEC = {
  AUTO: 'auto',
  VP8: 'VP8',
  H264: 'H264',
  VP9: 'VP9'
  //H264UC: 'H264UC'
};

/**
 * <blockquote class="info">
 *   Note that if the audio codec is not supported, the SDK will not configure the local <code>"offer"</code> or
 *   <code>"answer"</code> session description to prefer the codec.
 * </blockquote>
 * The list of available audio codecs to set as the preferred audio codec to use to encode
 * sending audio data when available encoded audio codec for Peer connections
 * configured in the <a href="#method_init"><code>init()</code> method</a>.
 * @attribute AUDIO_CODEC
 * @param {String} AUTO <small>Value <code>"auto"</code></small>
 *   The value of the option to not prefer any audio codec but rather use the created
 *   local <code>"offer"</code> / <code>"answer"</code> session description audio codec preference.
 * @param {String} OPUS <small>Value <code>"opus"</code></small>
 *   The value of the option to prefer the <a href="https://en.wikipedia.org/wiki/Opus_(audio_format)">OPUS</a> audio codec.
 * @param {String} ISAC <small>Value <code>"ISAC"</code></small>
 *   The value of the option to prefer the <a href="https://en.wikipedia.org/wiki/Internet_Speech_Audio_Codec">ISAC</a> audio codec.
 * @param {String} G722 <small>Value <code>"G722"</code></small>
 *   The value of the option to prefer the <a href="https://en.wikipedia.org/wiki/G.722">G722</a> audio codec.
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.5.10
 */
Skylink.prototype.AUDIO_CODEC = {
  AUTO: 'auto',
  ISAC: 'ISAC',
  OPUS: 'opus',
  //ILBC: 'ILBC',
  //G711: 'G711',
  G722: 'G722'
  //SILK: 'SILK'
};

/**
 * <blockquote class="info">
 *   Note that currently <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a> only configures
 *   the maximum resolution of the Stream due to browser interopability and support.
 * </blockquote>
 * The list of <a href="https://en.wikipedia.org/wiki/Graphics_display_resolution#Video_Graphics_Array">
 * video resolutions</a> sets configured in the <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a>.
 * @attribute VIDEO_RESOLUTION
 * @param {JSON} QQVGA <small>Value <code>{ width: 160, height: 120 }</code></small>
 *   The value of the option to configure QQVGA resolution.
 *   <small>Aspect ratio: <code>4:3</code></small>
 *   <small>Note that configurating this resolution may not be supported depending on browser and device supports.</small>
 * @param {JSON} HQVGA <small>Value <code>{ width: 240, height: 160 }</code></small>
 *   The value of the option to configure HQVGA resolution.
 *   <small>Aspect ratio: <code>3:2</code></small>
 *   <small>Note that configurating this resolution may not be supported depending on browser and device supports.</small>
 * @param {JSON} QVGA <small>Value <code>{ width: 320, height: 240 }</code></small>
 *   The value of the option to configure QVGA resolution.
 *   <small>Aspect ratio: <code>4:3</code></small>
 * @param {JSON} WQVGA <small>Value <code>{ width: 384, height: 240 }</code></small>
 *   The value of the option to configure WQVGA resolution.
 *   <small>Aspect ratio: <code>16:10</code></small>
 *   <small>Note that configurating this resolution may not be supported depending on browser and device supports.</small>
 * @param {JSON} HVGA <small>Value <code>{ width: 480, height: 320 }</code></small>
 *   The value of the option to configure HVGA resolution.
 *   <small>Aspect ratio: <code>3:2</code></small>
 *   <small>Note that configurating this resolution may not be supported depending on browser and device supports.</small>
 * @param {JSON} VGA <small>Value <code>{ width: 640, height: 480 }</code></small>
 *   The value of the option to configure VGA resolution.
 *   <small>Aspect ratio: <code>4:3</code></small>
 * @param {JSON} WVGA <small>Value <code>{ width: 768, height: 480 }</code></small>
 *   The value of the option to configure WVGA resolution.
 *   <small>Aspect ratio: <code>16:10</code></small>
 *   <small>Note that configurating this resolution may not be supported depending on browser and device supports.</small>
 * @param {JSON} FWVGA <small>Value <code>{ width: 854, height: 480 }</code></small>
 *   The value of the option to configure FWVGA resolution.
 *   <small>Aspect ratio: <code>16:9</code></small>
 *   <small>Note that configurating this resolution may not be supported depending on browser and device supports.</small>
 * @param {JSON} SVGA <small>Value <code>{ width: 800, height: 600 }</code></small>
 *   The value of the option to configure SVGA resolution.
 *   <small>Aspect ratio: <code>4:3</code></small>
 *   <small>Note that configurating this resolution may not be supported depending on browser and device supports.</small>
 * @param {JSON} DVGA <small>Value <code>{ width: 960, height: 640 }</code></small>
 *   The value of the option to configure DVGA resolution.
 *   <small>Aspect ratio: <code>3:2</code></small>
 *   <small>Note that configurating this resolution may not be supported depending on browser and device supports.</small>
 * @param {JSON} WSVGA <small>Value <code>{ width: 1024, height: 576 }</code></small>
 *   The value of the option to configure WSVGA resolution.
 *   <small>Aspect ratio: <code>16:9</code></small>
 * @param {JSON} HD <small>Value <code>{ width: 1280, height: 720 }</code></small>
 *   The value of the option to configure HD resolution.
 *   <small>Aspect ratio: <code>16:9</code></small>
 *   <small>Note that configurating this resolution may not be supported depending on device supports.</small>
 * @param {JSON} HDPLUS <small>Value <code>{ width: 1600, height: 900 }</code></small>
 *   The value of the option to configure HDPLUS resolution.
 *   <small>Aspect ratio: <code>16:9</code></small>
 *   <small>Note that configurating this resolution may not be supported depending on browser and device supports.</small>
 * @param {JSON} FHD <small>Value <code>{ width: 1920, height: 1080 }</code></small>
 *   The value of the option to configure FHD resolution.
 *   <small>Aspect ratio: <code>16:9</code></small>
 *   <small>Note that configurating this resolution may not be supported depending on device supports.</small>
 * @param {JSON} QHD <small>Value <code>{ width: 2560, height: 1440 }</code></small>
 *   The value of the option to configure QHD resolution.
 *   <small>Aspect ratio: <code>16:9</code></small>
 *   <small>Note that configurating this resolution may not be supported depending on browser and device supports.</small>
 * @param {JSON} WQXGAPLUS <small>Value <code>{ width: 3200, height: 1800 }</code></small>
 *   The value of the option to configure WQXGAPLUS resolution.
 *   <small>Aspect ratio: <code>16:9</code></small>
 *   <small>Note that configurating this resolution may not be supported depending on browser and device supports.</small>
 * @param {JSON} UHD <small>Value <code>{ width: 3840, height: 2160 }</code></small>
 *   The value of the option to configure UHD resolution.
 *   <small>Aspect ratio: <code>16:9</code></small>
 *   <small>Note that configurating this resolution may not be supported depending on browser and device supports.</small>
 * @param {JSON} UHDPLUS <small>Value <code>{ width: 5120, height: 2880 }</code></small>
 *   The value of the option to configure UHDPLUS resolution.
 *   <small>Aspect ratio: <code>16:9</code></small>
 *   <small>Note that configurating this resolution may not be supported depending on browser and device supports.</small>
 * @param {JSON} FUHD <small>Value <code>{ width: 7680, height: 4320 }</code></small>
 *   The value of the option to configure FUHD resolution.
 *   <small>Aspect ratio: <code>16:9</code></small>
 *   <small>Note that configurating this resolution may not be supported depending on browser and device supports.</small>
 * @param {JSON} QUHD <small>Value <code>{ width: 15360, height: 8640 }</code></small>
 *   The value of the option to configure QUHD resolution.
 *   <small>Aspect ratio: <code>16:9</code></small>
 *   <small>Note that configurating this resolution may not be supported depending on browser and device supports.</small>
 * @type JSON
 * @readOnly
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype.VIDEO_RESOLUTION = {
  QQVGA: { width: 160, height: 120 /*, aspectRatio: '4:3'*/ },
  HQVGA: { width: 240, height: 160 /*, aspectRatio: '3:2'*/ },
  QVGA: { width: 320, height: 240 /*, aspectRatio: '4:3'*/ },
  WQVGA: { width: 384, height: 240 /*, aspectRatio: '16:10'*/ },
  HVGA: { width: 480, height: 320 /*, aspectRatio: '3:2'*/ },
  VGA: { width: 640, height: 480 /*, aspectRatio: '4:3'*/ },
  WVGA: { width: 768, height: 480 /*, aspectRatio: '16:10'*/ },
  FWVGA: { width: 854, height: 480 /*, aspectRatio: '16:9'*/ },
  SVGA: { width: 800, height: 600 /*, aspectRatio: '4:3'*/ },
  DVGA: { width: 960, height: 640 /*, aspectRatio: '3:2'*/ },
  WSVGA: { width: 1024, height: 576 /*, aspectRatio: '16:9'*/ },
  HD: { width: 1280, height: 720 /*, aspectRatio: '16:9'*/ },
  HDPLUS: { width: 1600, height: 900 /*, aspectRatio: '16:9'*/ },
  FHD: { width: 1920, height: 1080 /*, aspectRatio: '16:9'*/ },
  QHD: { width: 2560, height: 1440 /*, aspectRatio: '16:9'*/ },
  WQXGAPLUS: { width: 3200, height: 1800 /*, aspectRatio: '16:9'*/ },
  UHD: { width: 3840, height: 2160 /*, aspectRatio: '16:9'*/ },
  UHDPLUS: { width: 5120, height: 2880 /*, aspectRatio: '16:9'*/ },
  FUHD: { width: 7680, height: 4320 /*, aspectRatio: '16:9'*/ },
  QUHD: { width: 15360, height: 8640 /*, aspectRatio: '16:9'*/ }
};

/**
 * The list of <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a> or
 * <a href="#method_shareScreen"><code>shareScreen()</code> method</a> Stream fallback states.
 * @attribute MEDIA_ACCESS_FALLBACK_STATE
 * @param {JSON} FALLBACKING <small>Value <code>0</code></small>
 *   The value of the state when <code>getUserMedia()</code> will retrieve audio track only
 *   when retrieving audio and video tracks failed.
 *   <small>This can be configured by <a href="#method_init"><code>init()</code> method</a>
 *   <code>audioFallback</code> option.</small>
 * @param {JSON} FALLBACKED  <small>Value <code>1</code></small>
 *   The value of the state when <code>getUserMedia()</code> or <code>shareScreen()</code>
 *   retrieves camera / screensharing Stream successfully but with missing originally required audio or video tracks.
 * @param {JSON} ERROR       <small>Value <code>-1</code></small>
 *   The value of the state when <code>getUserMedia()</code> failed to retrieve audio track only
 *   after retrieving audio and video tracks failed.
 * @readOnly
 * @for Skylink
 * @since 0.6.14
 */
Skylink.prototype.MEDIA_ACCESS_FALLBACK_STATE = {
  FALLBACKING: 0,
  FALLBACKED: 1,
  ERROR: -1
};

/**
 * The list of recording states.
 * @attribute RECORDING_STATE
 * @param {Number} START <small>Value <code>0</code></small>
 *   The value of the state when recording session has started.
 * @param {Number} STOP <small>Value <code>1</code></small>
 *   The value of the state when recording session has stopped.<br>
 *   <small>At this stage, the recorded videos will go through the mixin server to compile the videos.</small>
 * @param {Number} LINK <small>Value <code>2</code></small>
 *   The value of the state when recording session mixin request has been completed.
 * @param {Number} ERROR <small>Value <code>-1</code></small>
 *   The value of the state state when recording session has errors.
 *   <small>This can happen during recording session or during mixin of recording videos,
 *   and at this stage, any current recording session or mixin is aborted.</small>
 * @type JSON
 * @beta
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype.RECORDING_STATE = {
  START: 0,
  STOP: 1,
  LINK: 2,
  ERROR: -1
};

/**
 * <blockquote class="info">
 *   For a better user experience, the functionality is throttled when invoked many times in less
 *   than the milliseconds interval configured in the <a href="#method_init"><code>init()</code> method</a>.
 * </blockquote>
 * Function that retrieves camera Stream.
 * @method getUserMedia
 * @param {JSON} [options] The camera Stream configuration options.
 * - When not provided, the value is set to <code>{ audio: true, video: true }</code>.
 *   <small>To fallback to retrieve audio track only when retrieving of audio and video tracks failed,
 *   enable the <code>audioFallback</code> flag in the <a href="#method_init"><code>init()</code> method</a>.</small>
 * @param {Boolean} [options.useExactConstraints=false] <blockquote class="info">
 *   Note that by enabling this flag, exact values will be requested when retrieving camera Stream,
 *   but it does not prevent constraints related errors. By default when not enabled,
 *   expected mandatory maximum values (or optional values for source ID) will requested to prevent constraints related
 *   errors, with an exception for <code>options.video.frameRate</code> option in Safari and IE (any plugin-enabled) browsers,
 *   where the expected maximum value will not be requested due to the lack of support.</blockquote>
 *   The flag if <code>getUserMedia()</code> should request for camera Stream to match exact requested values of
 *   <code>options.audio.deviceId</code> and <code>options.video.deviceId</code>, <code>options.video.resolution</code>
 *   and <code>options.video.frameRate</code> when provided.
 * @param {Boolean|JSON} [options.audio=false] <blockquote class="info">
 *    Note that the current Edge browser implementation does not support the <code>options.audio.optional</code>,
 *    <code>options.audio.deviceId</code>, <code>options.audio.echoCancellation</code>.</blockquote>
 *    The audio configuration options.
 * @param {Boolean} [options.audio.stereo=false] The flag if stereo band should be configured
 *   when encoding audio codec is <a href="#attr_AUDIO_CODEC"><code>OPUS</code></a> for sending / receiving audio data.
 *   <small>Note that Peers may override the "receiving" <code>stereo</code> config depending on the Peers configuration.</small>
 * @param {Boolean} [options.audio.usedtx] <blockquote class="info">
 *   Note that this feature might not work depending on the browser support and implementation.</blockquote>
 *   The flag if DTX (Discontinuous Transmission) should be configured when encoding audio codec
 *   is <a href="#attr_AUDIO_CODEC"><code>OPUS</code></a> for sending / receiving audio data.
 *   <small>This might help to reduce bandwidth it reduces the bitrate during silence or background noise.</small>
 *   <small>When not provided, the default browser configuration is used.</small>
 *   <small>Note that Peers may override the "receiving" <code>usedtx</code> config depending on the Peers configuration.</small>
 * @param {Boolean} [options.audio.useinbandfec] <blockquote class="info">
 *   Note that this feature might not work depending on the browser support and implementation.</blockquote>
 *   The flag if capability to take advantage of in-band FEC (Forward Error Correction) should be
 *   configured when encoding audio codec is <a href="#attr_AUDIO_CODEC"><code>OPUS</code></a> for sending / receiving audio data.
 *   <small>This might help to reduce the harm of packet loss by encoding information about the previous packet.</small>
 *   <small>When not provided, the default browser configuration is used.</small>
 *   <small>Note that Peers may override the "receiving" <code>useinbandfec</code> config depending on the Peers configuration.</small>
 * @param {Number} [options.audio.maxplaybackrate] <blockquote class="info">
 *   Note that this feature might not work depending on the browser support and implementation.</blockquote>
 *   The maximum output sampling rate rendered in Hertz (Hz) when encoding audio codec is
 *   <a href="#attr_AUDIO_CODEC"><code>OPUS</code></a> for sending / receiving audio data.
 *   <small>This value must be between <code>8000</code> to <code>48000</code>.</small>
 *   <small>When not provided, the default browser configuration is used.</small>
 *   <small>Note that Peers may override the "receiving" <code>maxplaybackrate</code> config depending on the Peers configuration.</small>
 * @param {Boolean} [options.audio.mute=false] The flag if audio tracks should be muted upon receiving them.
 *   <small>Providing the value as <code>false</code> does nothing to <code>peerInfo.mediaStatus.audioMuted</code>,
 *   but when provided as <code>true</code>, this sets the <code>peerInfo.mediaStatus.audioMuted</code> value to
 *   <code>true</code> and mutes any existing <a href="#method_shareScreen">
 *   <code>shareScreen()</code> Stream</a> audio tracks as well.</small>
 * @param {Array} [options.audio.optional] <blockquote class="info">
 *   Note that this may result in constraints related error when <code>options.useExactConstraints</code> value is
 *   <code>true</code>. If you are looking to set the requested source ID of the audio track,
 *   use <code>options.audio.deviceId</code> instead.</blockquote>
 *   The <code>navigator.getUserMedia()</code> API <code>audio: { optional [..] }</code> property.
 * @param {String} [options.audio.deviceId] <blockquote class="info">
 *   Note this is currently not supported in Firefox browsers.
 *   </blockquote> The audio track source ID of the device to use.
 *   <small>The list of available audio source ID can be retrieved by the <a href="https://developer.
 * mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices"><code>navigator.mediaDevices.enumerateDevices</code>
 *   API</a>.</small>
 * @param {Boolean} [options.audio.echoCancellation=false] The flag to enable audio tracks echo cancellation.
 * @param {Boolean|JSON} [options.video=false] <blockquote class="info">
 *    Note that the current Edge browser implementation does not support the <code>options.video.optional</code>,
 *    <code>options.video.deviceId</code>, <code>options.video.resolution</code> and
 *    <code>options.video.frameRate</code>, <code>options.video.facingMode</code>.</blockquote>
 *   The video configuration options.
 * @param {Boolean} [options.video.mute=false] The flag if video tracks should be muted upon receiving them.
 *   <small>Providing the value as <code>false</code> does nothing to <code>peerInfo.mediaStatus.videoMuted</code>,
 *   but when provided as <code>true</code>, this sets the <code>peerInfo.mediaStatus.videoMuted</code> value to
 *   <code>true</code> and mutes any existing <a href="#method_shareScreen">
 *   <code>shareScreen()</code> Stream</a> video tracks as well.</small>
 * @param {JSON} [options.video.resolution] The video resolution.
 *   <small>By default, <a href="#attr_VIDEO_RESOLUTION"><code>VGA</code></a> resolution option
 *   is selected when not provided.</small>
 *   [Rel: Skylink.VIDEO_RESOLUTION]
 * @param {Number|JSON} [options.video.resolution.width] The video resolution width.
 * - When provided as a number, it is the video resolution width.
 * - When provided as a JSON, it is the <code>navigator.mediaDevices.getUserMedia()</code> <code>.width</code> settings.
 *   Parameters are <code>"ideal"</code> for ideal resolution width, <code>"exact"</code> for exact video resolution width,
 *   <code>"min"</code> for min video resolution width and <code>"max"</code> for max video resolution width.
 *   Note that this may result in constraints related errors depending on the browser/hardware supports.
 * @param {Number|JSON} [options.video.resolution.height] The video resolution height.
 * - When provided as a number, it is the video resolution height.
 * - When provided as a JSON, it is the <code>navigator.mediaDevices.getUserMedia()</code> <code>.height</code> settings.
 *   Parameters are <code>"ideal"</code> for ideal video resolution height, <code>"exact"</code> for exact video resolution height,
 *   <code>"min"</code> for min video resolution height and <code>"max"</code> for max video resolution height.
 *   Note that this may result in constraints related errors depending on the browser/hardware supports.
 * @param {Number|JSON} [options.video.frameRate] The video <a href="https://en.wikipedia.org/wiki/Frame_rate">
 *   frameRate</a> per second (fps).
 * - When provided as a number, it is the video framerate.
 * - When provided as a JSON, it is the <code>navigator.mediaDevices.getUserMedia()</code> <code>.frameRate</code> settings.
 *   Parameters are <code>"ideal"</code> for ideal video framerate, <code>"exact"</code> for exact video framerate,
 *   <code>"min"</code> for min video framerate and <code>"max"</code> for max video framerate.
 *   Note that this may result in constraints related errors depending on the browser/hardware supports.
 * @param {Array} [options.video.optional] <blockquote class="info">
 *   Note that this may result in constraints related error when <code>options.useExactConstraints</code> value is
 *   <code>true</code>. If you are looking to set the requested source ID of the video track,
 *   use <code>options.video.deviceId</code> instead.</blockquote>
 *   The <code>navigator.getUserMedia()</code> API <code>video: { optional [..] }</code> property.
 * @param {String} [options.video.deviceId] <blockquote class="info">
 *   Note this is currently not supported in Firefox browsers.
 *   </blockquote> The video track source ID of the device to use.
 *   <small>The list of available video source ID can be retrieved by the <a href="https://developer.
 * mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices"><code>navigator.mediaDevices.enumerateDevices</code>
 *   API</a>.</small>
 * @param {String|JSON} [options.video.facingMode] The video camera facing mode.
 *   <small>The list of available video source ID can be retrieved by the <a href="https://developer.mozilla.org
 *   /en-US/docs/Web/API/MediaTrackConstraints/facingMode">MediaTrackConstraints <code>facingMode</code> API</a>.</small>
 * @param {Function} [callback] The callback function fired when request has completed.
 *   <small>Function parameters signature is <code>function (error, success)</code></small>
 *   <small>Function request completion is determined by the <a href="#event_mediaAccessSuccess">
 *   <code>mediaAccessSuccess</code> event</a> triggering <code>isScreensharing</code> parameter
 *   payload value as <code>false</code> for request success.</small>
 * @param {Error|String} callback.error The error result in request.
 *   <small>Defined as <code>null</code> when there are no errors in request</small>
 *   <small>Object signature is the <code>getUserMedia()</code> error when retrieving camera Stream.</small>
 * @param {MediaStream} callback.success The success result in request.
 *   <small>Defined as <code>null</code> when there are errors in request</small>
 *   <small>Object signature is the camera Stream object.</small>
 * @example
 *   // Example 1: Get both audio and video.
 *   skylinkDemo.getUserMedia(function (error, success) {
 *     if (error) return;
 *     attachMediaStream(document.getElementById("my-video"), success);
 *   });
 *
 *   // Example 2: Get only audio.
 *   skylinkDemo.getUserMedia({
 *     audio: true
 *   }, function (error, success) {
 *     if (error) return;
 *     attachMediaStream(document.getElementById("my-audio"), success);
 *   });
 *
 *   // Example 3: Configure resolution for video
 *   skylinkDemo.getUserMedia({
 *     audio: true,
 *     video: {
 *       resolution: skylinkDemo.VIDEO_RESOLUTION.HD
 *     }
 *   }, function (error, success) {
 *     if (error) return;
 *     attachMediaStream(document.getElementById("my-video"), success);
 *   });
 *
 *   // Example 4: Configure stereo flag for OPUS codec audio (OPUS is always used by default)
 *   skylinkDemo.init({
 *     appKey: "xxxxxx",
 *     audioCodec: skylinkDemo.AUDIO_CODEC.OPUS
 *   }, function (initErr, initSuccess) {
 *     skylinkDemo.getUserMedia({
 *       audio: {
 *         stereo: true
 *       },
 *       video: true
 *     }, function (error, success) {
 *       if (error) return;
 *       attachMediaStream(document.getElementById("my-video"), success);
 *     });
 *   });
 *
 *   // Example 5: Configure frameRate for video
 *   skylinkDemo.getUserMedia({
 *     audio: true,
 *     video: {
 *       frameRate: 50
 *     }
 *   }, function (error, success) {
 *     if (error) return;
 *     attachMediaStream(document.getElementById("my-video"), success);
 *   });
 *
 *   // Example 6: Configure video and audio based on selected sources. Does not work for Firefox currently.
 *   var sources = { audio: [], video: [] };
 *
 *   function selectStream (audioSourceId, videoSourceId) {
 *     if (window.webrtcDetectedBrowser === 'firefox') {
 *       console.warn("Currently this feature is not supported by Firefox browsers!");
 *       return;
 *     }
 *     skylinkDemo.getUserMedia({
 *       audio: {
 *         optional: [{ sourceId: audioSourceId }]
 *       },
 *       video: {
 *         optional: [{ sourceId: videoSourceId }]
 *       }
 *     }, function (error, success) {
 *       if (error) return;
 *       attachMediaStream(document.getElementById("my-video"), success);
 *     });
 *   }
 *
 *   navigator.mediaDevices.enumerateDevices().then(function(devices) {
 *     var selectedAudioSourceId = "";
 *     var selectedVideoSourceId = "";
 *     devices.forEach(function(device) {
 *       console.log(device.kind + ": " + device.label + " source ID = " + device.deviceId);
 *       if (device.kind === "audio") {
 *         selectedAudioSourceId = device.deviceId;
 *       } else {
 *         selectedVideoSourceId = device.deviceId;
 *       }
 *     });
 *     selectStream(selectedAudioSourceId, selectedVideoSourceId);
 *   }).catch(function (error) {
 *      console.error("Failed", error);
 *   });
 * @trigger <ol class="desc-seq">
 *   <li>If <code>options.audio</code> value is <code>false</code> and <code>options.video</code>
 *   value is <code>false</code>: <ol><li><b>ABORT</b> and return error.</li></ol></li>
 *   <li>Retrieve camera Stream. <ol><li>If retrieval was succesful: <ol>
 *   <li>If there is any previous <code>getUserMedia()</code> Stream: <ol>
 *   <li>Invokes <a href="#method_stopStream"><code>stopStream()</code> method</a>.</li></ol></li>
 *   <li>If there are missing audio or video tracks requested: <ol>
 *   <li><a href="#event_mediaAccessFallback"><code>mediaAccessFallback</code> event</a> triggers parameter payload
 *   <code>state</code> as <code>FALLBACKED</code>, <code>isScreensharing</code> value as <code>false</code> and
 *   <code>isAudioFallback</code> value as <code>false</code>.</li></ol></li>
 *   <li>Mutes / Unmutes audio and video tracks based on current muted settings in <code>peerInfo.mediaStatus</code>.
 *   <small>This can be retrieved with <a href="#method_getPeerInfo"><code>getPeerInfo()</code> method</a>.</small></li>
 *   <li><a href="#event_mediaAccessSuccess"><code>mediaAccessSuccess</code> event</a> triggers parameter payload
 *   <code>isScreensharing</code> value as <code>false</code> and <code>isAudioFallback</code>
 *   value as <code>false</code>.</li></ol></li><li>Else: <ol>
 *   <li>If <code>options.audioFallback</code> is enabled in the <a href="#method_init"><code>init()</code> method</a>,
 *   <code>options.audio</code> value is <code>true</code> and <code>options.video</code> value is <code>true</code>: <ol>
 *   <li><a href="#event_mediaAccessFallback"><code>mediaAccessFallback</code> event</a> event triggers
 *   parameter payload <code>state</code> as <code>FALLBACKING</code>, <code>isScreensharing</code>
 *   value as <code>false</code> and <code>isAudioFallback</code> value as <code>true</code>.</li>
 *   <li>Retrieve camera Stream with audio tracks only. <ol><li>If retrieval was successful: <ol>
 *   <li>If there is any previous <code>getUserMedia()</code> Stream: <ol>
 *   <li>Invokes <a href="#method_stopStream"><code>stopStream()</code> method</a>.</li></ol></li>
 *   <li><a href="#event_mediaAccessFallback"><code>mediaAccessFallback</code> event</a> event triggers
 *   parameter payload <code>state</code> as <code>FALLBACKED</code>, <code>isScreensharing</code>
 *   value as <code>false</code> and <code>isAudioFallback</code> value as <code>true</code>.</li>
 *   <li>Mutes / Unmutes audio and video tracks based on current muted settings in <code>peerInfo.mediaStatus</code>.
 *   <small>This can be retrieved with <a href="#method_getPeerInfo"><code>getPeerInfo()</code> method</a>.</small></li>
 *   <li><a href="#event_mediaAccessSuccess"><code>mediaAccessSuccess</code> event</a> triggers
 *   parameter payload <code>isScreensharing</code> value as <code>false</code> and
 *   <code>isAudioFallback</code> value as <code>true</code>.</li></ol></li><li>Else: <ol>
 *   <li><a href="#event_mediaAccessError"><code>mediaAccessError</code> event</a> triggers
 *   parameter payload <code>isScreensharing</code> value as <code>false</code> and
 *   <code>isAudioFallbackError</code> value as <code>true</code>.</li>
 *   <li><a href="#event_mediaAccessFallback"><code>mediaAccessFallback</code> event</a> event triggers
 *   parameter payload <code>state</code> as <code>ERROR</code>, <code>isScreensharing</code> value as
 *   <code>false</code> and <code>isAudioFallback</code> value as <code>true</code>.</li>
 *   <li><b>ABORT</b> and return error.</li></ol></li></ol></li></ol></li><li>Else: <ol>
 *   <li><a href="#event_mediaAccessError"><code>mediaAccessError</code> event</a> triggers parameter payload
 *   <code>isScreensharing</code> value as <code>false</code> and <code>isAudioFallbackError</code> value as
 *   <code>false</code>.</li><li><b>ABORT</b> and return error.</li></ol></li></ol></li></ol></li></ol></li></ol>
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype.getUserMedia = function(options,callback) {
  var self = this;

  if (typeof options === 'function'){
    callback = options;
    options = {
      audio: true,
      video: true
    };

  } else if (typeof options !== 'object' || options === null) {
    if (typeof options === 'undefined') {
      options = {
        audio: true,
        video: true
      };

    } else {
      var invalidOptionsError = 'Please provide a valid options';
      log.error(invalidOptionsError, options);
      if (typeof callback === 'function') {
        callback(new Error(invalidOptionsError), null);
      }
      return;
    }

  } else if (!options.audio && !options.video) {
    var noConstraintOptionsSelectedError = 'Please select audio or video';
    log.error(noConstraintOptionsSelectedError, options);
    if (typeof callback === 'function') {
      callback(new Error(noConstraintOptionsSelectedError), null);
    }
    return;
  }

  /*if (window.location.protocol !== 'https:' && window.webrtcDetectedBrowser === 'chrome' &&
    window.webrtcDetectedVersion > 46) {
    errorMsg = 'getUserMedia() has to be called in https:// application';
    log.error(errorMsg, options);
    if (typeof callback === 'function') {
      callback(new Error(errorMsg), null);
    }
    return;
  }*/

  self._throttle(function (runFn) {
    if (!runFn) {
      if (self._options.throttlingShouldThrowError) {
        var throttleLimitError = 'Unable to run as throttle interval has not reached (' + self._options.throttleIntervals.getUserMedia + 'ms).';
        log.error(throttleLimitError);

        if (typeof callback === 'function') {
          callback(new Error(throttleLimitError), null);
        }
      }
      return;
    }

    if (typeof callback === 'function') {
      var mediaAccessSuccessFn = function (stream) {
        self.off('mediaAccessError', mediaAccessErrorFn);
        callback(null, stream);
      };
      var mediaAccessErrorFn = function (error) {
        self.off('mediaAccessSuccess', mediaAccessSuccessFn);
        callback(error, null);
      };

      self.once('mediaAccessSuccess', mediaAccessSuccessFn, function (stream, isScreensharing) {
        return !isScreensharing;
      });

      self.once('mediaAccessError', mediaAccessErrorFn, function (error, isScreensharing) {
        return !isScreensharing;
      });
    }

    // Parse stream settings
    var settings = self._parseStreamSettings(options);

    navigator.getUserMedia(settings.getUserMediaSettings, function (stream) {
      if (settings.mutedSettings.shouldAudioMuted) {
        self._streamsMutedSettings.audioMuted = true;
      }

      if (settings.mutedSettings.shouldVideoMuted) {
        self._streamsMutedSettings.videoMuted = true;
      }

      self._onStreamAccessSuccess(stream, settings, false, false);

    }, function (error) {
      self._onStreamAccessError(error, settings, false, false);
    });
  }, 'getUserMedia', self._options.throttleIntervals.getUserMedia);
};

/**
 * <blockquote class="info">
 *   Note that if <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a> is available despite having
 *   <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a> available, the
 *   <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a> is sent instead of the
 *   <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a> to Peers.
 * </blockquote>
 * Function that sends a new <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a>
 * to all connected Peers in the Room.
 * @method sendStream
 * @param {JSON|MediaStream} options The <a href="#method_getUserMedia"><code>getUserMedia()</code>
 *   method</a> <code>options</code> parameter settings.
 * - When provided as a <code>MediaStream</code> object, this configures the <code>options.audio</code> and
 *   <code>options.video</code> based on the tracks available in the <code>MediaStream</code> object,
 *   and configures the <code>options.audio.mute</code> and <code>options.video.mute</code> based on the tracks
 *   <code>.enabled</code> flags in the tracks provided in the <code>MediaStream</code> object without
 *   invoking <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a>.
 *   <small>Object signature matches the <code>options</code> parameter in the
 *   <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a>.</small>
 * @param {Function} [callback] The callback function fired when request has completed.
 *   <small>Function parameters signature is <code>function (error, success)</code></small>
 *   <small>Function request completion is determined by the <a href="#event_mediaAccessSuccess">
 *   <code>mediaAccessSuccess</code> event</a> triggering <code>isScreensharing</code> parameter payload value
 *   as <code>false</code> for request success when User is in Room without Peers,
 *   or by the <a href="#event_peerRestart"><code>peerRestart</code> event</a> triggering
 *   <code>isSelfInitiateRestart</code> parameter payload value as <code>true</code> for all connected Peers
 *   for request success when User is in Room with Peers.</small>
 * @param {Error|String} callback.error The error result in request.
 *   <small>Defined as <code>null</code> when there are no errors in request</small>
 *   <small>Object signature is the <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a> error or
 *   when invalid <code>options</code> is provided.</small>
 * @param {MediaStream} callback.success The success result in request.
 *   <small>Defined as <code>null</code> when there are errors in request</small>
 *   <small>Object signature is the <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a>
 *   Stream object.</small>
 * @example
 *   // Example 1: Send MediaStream object
 *   function retrieveStreamBySourceForFirefox (sourceId) {
 *     navigator.mediaDevices.getUserMedia({
 *       audio: true,
 *       video: {
 *         sourceId: { exact: sourceId }
 *       }
 *     }).then(function (stream) {
 *       skylinkDemo.sendStream(stream, function (error, success) {
 *         if (err) return;
 *         if (stream === success) {
 *           console.info("Same MediaStream has been sent");
 *         }
 *         console.log("Stream is now being sent to Peers");
 *         attachMediaStream(document.getElementById("my-video"), success);
 *       });
 *     });
 *   }
 *
 *   // Example 2: Send video later
 *   var inRoom = false;
 *
 *   function sendVideo () {
 *     if (!inRoom) return;
 *     skylinkDemo.sendStream({
 *       audio: true,
 *       video: true
 *     }, function (error, success) {
 *       if (error) return;
 *       console.log("getUserMedia() Stream with video is now being sent to Peers");
 *       attachMediaStream(document.getElementById("my-video"), success);
 *     });
 *   }
 *
 *   skylinkDemo.joinRoom({
 *     audio: true
 *   }, function (jRError, jRSuccess) {
 *     if (jRError) return;
 *     inRoom = true;
 *   });
 * @trigger <ol class="desc-seq">
 *   <li>If User is not in Room: <ol><li><b>ABORT</b> and return error.</li></ol></li>
 *   <li>Checks <code>options</code> provided. <ol><li>If provided parameter <code>options</code> is not valid: <ol>
 *   <li><b>ABORT</b> and return error.</li></ol></li>
 *   <li>Else if provided parameter <code>options</code> is a Stream object: <ol>
 *   <li>Checks if there is any audio or video tracks. <ol><li>If there is no tracks: <ol>
 *   <li><b>ABORT</b> and return error.</li></ol></li><li>Else: <ol>
 *   <li>Set <code>options.audio</code> value as <code>true</code> if Stream has audio tracks.</li>
 *   <li>Set <code>options.video</code> value as <code>false</code> if Stream has video tracks.</li>
 *   <li>Mutes / Unmutes audio and video tracks based on current muted settings in
 *   <code>peerInfo.mediaStatus</code>. <small>This can be retrieved with
 *   <a href="#method_getPeerInfo"><code>getPeerInfo()</code> method</a>.</small></li>
 *   <li>If there is any previous <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a>:
 *   <ol><li>Invokes <a href="#method_stopStream"><code>stopStream()</code> method</a> to stop previous Stream.</li></ol></li>
 *   <li><a href="#event_mediaAccessSuccess"><code>mediaAccessSuccess</code> event</a> triggers
 *   parameter payload <code>isScreensharing</code> value as <code>false</code> and <code>isAudioFallback</code>
 *   value as <code>false</code>.</li></ol></li></ol></li></ol></li><li>Else: <ol>
 *   <li>Invoke <a href="#method_getUserMedia"><code>getUserMedia()</code> method</a> with
 *   <code>options</code> provided in <code>sendStream()</code>. <ol><li>If request has errors: <ol>
 *   <li><b>ABORT</b> and return error.</li></ol></li></ol></li></ol></li></ol></li>
 *   <li>If there is currently no <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a>: <ol>
 *   <li><a href="#event_incomingStream"><code>incomingStream</code> event</a> triggers parameter payload
 *   <code>isSelf</code> value as <code>true</code> and <code>stream</code> as
 *   <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a>.</li>
 *   <li><a href="#event_peerUpdated"><code>peerUpdated</code> event</a> triggers parameter payload
 *   <code>isSelf</code> value as <code>true</code>.</li>
 *   <li>Checks if MCU is enabled for App Key provided in <a href="#method_init"><code>init()</code> method</a>. <ol>
 *   <li>If MCU is enabled: <ol><li>Invoke <a href="#method_refreshConnection"><code>refreshConnection()</code>
 *   method</a>. <ol><li>If request has errors: <ol><li><b>ABORT</b> and return error.</li></ol></li></ol></li></ol></li>
 *   <li>Else: <ol><li>If there are connected Peers in the Room: <ol>
 *   <li>Invoke <a href="#method_refreshConnection"><code>refreshConnection()</code> method</a>. <ol>
 *   <li>If request has errors: <ol><li><b>ABORT</b> and return error.
 *   </li></ol></li></ol></li></ol></li></ol></li></ol></li></ol></li></ol>
 * @for Skylink
 * @since 0.5.6
 */

Skylink.prototype.sendStream = function(options, callback) {
  var self = this;

  var restartFn = function (stream) {
    if (self._user.room.connected) {
      if (!self._streams.screenshare) {
        self._trigger('incomingStream', self._user.id, stream, true, self.getPeerInfo(), false, stream.id || stream.label);
        self._trigger('peerUpdated', self._user.id, self.getPeerInfo(), true);
      }

      if (Object.keys(self._peerConnections).length > 0 || self._hasMCU) {
        self._refreshPeerConnection(Object.keys(self._peerConnections), false, function (err, success) {
          if (err) {
            log.error('Failed refreshing connections for sendStream() ->', err);
            if (typeof callback === 'function') {
              callback(new Error('Failed refreshing connections.'), null);
            }
            return;
          }
          if (typeof callback === 'function') {
            callback(null, stream);
          }
        });
      } else if (typeof callback === 'function') {
        callback(null, stream);
      }
    } else {
      var notInRoomAgainError = 'Unable to send stream as user is not in the Room.';
      log.error(notInRoomAgainError, stream);
      if (typeof callback === 'function') {
        callback(new Error(notInRoomAgainError), null);
      }
    }
  };

  if (typeof options !== 'object' || options === null) {
    var invalidOptionsError = 'Provided stream settings is invalid';
    log.error(invalidOptionsError, options);
    if (typeof callback === 'function'){
      callback(new Error(invalidOptionsError),null);
    }
    return;
  }

  if (!self._user.room.connected) {
    var notInRoomError = 'Unable to send stream as user is not in the Room.';
    log.error(notInRoomError, options);
    if (typeof callback === 'function'){
      callback(new Error(notInRoomError),null);
    }
    return;
  }

  if (window.webrtcDetectedBrowser === 'edge') {
    var edgeNotSupportError = 'Edge browser currently does not support renegotiation.';
    log.error(edgeNotSupportError, options);
    if (typeof callback === 'function'){
      callback(new Error(edgeNotSupportError),null);
    }
    return;
  }

  if (typeof options.getAudioTracks === 'function' || typeof options.getVideoTracks === 'function') {
    var checkActiveTracksFn = function (tracks) {
      for (var t = 0; t < tracks.length; t++) {
        if (!(tracks[t].ended || (typeof tracks[t].readyState === 'string' ?
          tracks[t].readyState !== 'live' : false))) {
          return true;
        }
      }
      return false;
    };

    if (!checkActiveTracksFn( options.getAudioTracks() ) && !checkActiveTracksFn( options.getVideoTracks() )) {
      var invalidStreamError = 'Provided stream object does not have audio or video tracks.';
      log.error(invalidStreamError, options);
      if (typeof callback === 'function'){
        callback(new Error(invalidStreamError),null);
      }
      return;
    }

    self._onStreamAccessSuccess(options, {
      settings: {
        audio: true,
        video: true
      },
      getUserMediaSettings: {
        audio: true,
        video: true
      }
    }, false, false);

    restartFn(options);

  } else {
    self.getUserMedia(options, function (err, stream) {
      if (err) {
        if (typeof callback === 'function') {
          callback(err, null);
        }
        return;
      }
      restartFn(stream);
    });
  }
};

/**
 * <blockquote class="info">
 *   Note that broadcasted events from <a href="#method_muteStream"><code>muteStream()</code> method</a>,
 *   <a href="#method_stopStream"><code>stopStream()</code> method</a>,
 *   <a href="#method_stopScreen"><code>stopScreen()</code> method</a>,
 *   <a href="#method_sendMessage"><code>sendMessage()</code> method</a>,
 *   <a href="#method_unlockRoom"><code>unlockRoom()</code> method</a> and
 *   <a href="#method_lockRoom"><code>lockRoom()</code> method</a> may be queued when
 *   sent within less than an interval.
 * </blockquote>
 * Function that stops <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a>.
 * @method stopStream
 * @example
 *   function stopStream () {
 *     skylinkDemo.stopStream();
 *   }
 *
 *   skylinkDemo.getUserMedia();
 * @trigger <ol class="desc-seq">
 *   <li>Checks if there is <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a>. <ol>
 *   <li>If there is <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a>: <ol>
 *   <li>Stop <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a> Stream. <ol>
 *   <li><a href="#event_mediaAccessStopped"><code>mediaAccessStopped</code> event</a> triggers
 *   parameter payload <code>isScreensharing</code> value as <code>false</code>.</li><li>If User is in Room: <ol>
 *   <li><a href="#event_streamEnded"><code>streamEnded</code> event</a> triggers parameter
 *   payload <code>isSelf</code> value as <code>true</code> and <code>isScreensharing</code> value as<code>false</code>
 *   .</li><li><a href="#event_peerUpdated"><code>peerUpdated</code> event</a> triggers parameter payload
 *   <code>isSelf</code> value as <code>true</code>.</li></ol></li></ol></li></ol></li></ol></li></ol>
 * @for Skylink
 * @since 0.5.6
 */
Skylink.prototype.stopStream = function () {
  if (this._streams.userMedia) {
    this._stopStreams({
      userMedia: true
    });
  }
};

/**
 * <blockquote class="info">
 *   Note that broadcasted events from <a href="#method_muteStream"><code>muteStream()</code> method</a>,
 *   <a href="#method_stopStream"><code>stopStream()</code> method</a>,
 *   <a href="#method_stopScreen"><code>stopScreen()</code> method</a>,
 *   <a href="#method_sendMessage"><code>sendMessage()</code> method</a>,
 *   <a href="#method_unlockRoom"><code>unlockRoom()</code> method</a> and
 *   <a href="#method_lockRoom"><code>lockRoom()</code> method</a> may be queued when
 *   sent within less than an interval.
 * </blockquote>
 * Function that mutes both <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a> and
 * <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a> audio or video tracks.
 * @method muteStream
 * @param {JSON} options The Streams muting options.
 * @param {Boolean} [options.audioMuted=true] The flag if all Streams audio
 *   tracks should be muted or not.
 * @param {Boolean} [options.videoMuted=true] The flag if all Streams video
 *   tracks should be muted or not.
 * @example
 *   // Example 1: Mute both audio and video tracks in all Streams
 *   skylinkDemo.muteStream({
 *     audioMuted: true,
 *     videoMuted: true
 *   });
 *
 *   // Example 2: Mute only audio tracks in all Streams
 *   skylinkDemo.muteStream({
 *     audioMuted: true,
 *     videoMuted: false
 *   });
 *
 *   // Example 3: Mute only video tracks in all Streams
 *   skylinkDemo.muteStream({
 *     audioMuted: false,
 *     videoMuted: true
 *   });
 * @trigger <ol class="desc-seq">
 *   <li>If provided parameter <code>options</code> is invalid: <ol><li><b>ABORT</b> and return error.</li></ol></li>
 *   <li>Checks if there is any available Streams: <ol><li>If there is no available Streams: <ol>
 *   <li><b>ABORT</b> and return error.</li></ol></li><li>If User is in Room: <ol>
 *   <li>Checks if there is audio tracks to mute / unmute: <ol><li>If there is audio tracks to mute / unmute: <ol>
 *   <li>If <code>options.audioMuted</code> value is not the same as the current
 *   <code>peerInfo.mediaStatus.audioMuted</code>: <small>This can be retrieved with
 *   <a href="#method_getPeerInfo"><code>getPeerInfo()</code> method</a>.</small> <ol>
 *   <li><em>For Peer only</em> <a href="#event_peerUpdated"><code>peerUpdated</code> event</a>
 *   triggers with parameter payload <code>isSelf</code> value as <code>false</code>.</li>
 *   <li><em>For Peer only</em> <a href="#event_streamMuted"><code>streamMuted</code> event</a>
 *   triggers with parameter payload <code>isSelf</code> value as <code>false</code>.</li></ol></li></ol></li></ol></li>
 *   <li>Checks if there is video tracks to mute / unmute: <ol><li>If there is video tracks to mute / unmute: <ol>
 *   <li>If <code>options.videoMuted</code> value is not the same as the current
 *   <code>peerInfo.mediaStatus.videoMuted</code>: <small>This can be retrieved with
 *   <a href="#method_getPeerInfo"><code>getPeerInfo()</code> method</a>.</small> <ol>
 *   <li><em>For Peer only</em> <a href="#event_peerUpdated"><code>peerUpdated</code> event</a>
 *   triggers with parameter payload <code>isSelf</code> value as <code>false</code>.</li>
 *   <li><em>For Peer only</em> <a href="#event_streamMuted"><code>streamMuted</code> event</a> triggers with
 *   parameter payload <code>isSelf</code> value as <code>false</code>.</li></ol></li></ol></li></ol></li></ol></li>
 *   <li>If <code>options.audioMuted</code> value is not the same as the current
 *   <code>peerInfo.mediaStatus.audioMuted</code> or <code>options.videoMuted</code> value is not
 *   the same as the current <code>peerInfo.mediaStatus.videoMuted</code>: <ol>
 *   <li><a href="#event_localMediaMuted"><code>localMediaMuted</code> event</a> triggers.</li>
 *   <li>If User is in Room: <ol><li><a href="#event_streamMuted"><code>streamMuted</code> event</a>
 *   triggers with parameter payload <code>isSelf</code> value as <code>true</code>.</li>
 *   <li><a href="#event_peerUpdated"><code>peerUpdated</code> event</a> triggers with
 *   parameter payload <code>isSelf</code> value as <code>true</code>.</li></ol></li></ol></li></ol></li></ol>
 * @for Skylink
 * @since 0.5.7
 */
Skylink.prototype.muteStream = function(options) {
  var self = this;

  if (typeof options !== 'object') {
    log.error('Provided settings is not an object');
    return;
  }

  if (!(self._streams.userMedia && self._streams.userMedia.stream) &&
    !(self._streams.screenshare && self._streams.screenshare.stream)) {
    log.warn('No streams are available to mute / unmute!');
    return;
  }

  var audioMuted = typeof options.audioMuted === 'boolean' ? options.audioMuted : true;
  var videoMuted = typeof options.videoMuted === 'boolean' ? options.videoMuted : true;
  var hasToggledAudio = false;
  var hasToggledVideo = false;

  if (self._streamsMutedSettings.audioMuted !== audioMuted) {
    self._streamsMutedSettings.audioMuted = audioMuted;
    hasToggledAudio = true;
  }

  if (self._streamsMutedSettings.videoMuted !== videoMuted) {
    self._streamsMutedSettings.videoMuted = videoMuted;
    hasToggledVideo = true;
  }

  if (hasToggledVideo || hasToggledAudio) {
    var streamTracksAvailability = self._muteStreams();

    if (hasToggledVideo && self._user.room.connected) {
      self._socketSendMessage({
        type: self._SIG_MESSAGE_TYPE.MUTE_VIDEO,
        mid: self._user.id,
        rid: self._user.room.session.rid,
        muted: self._streamsMutedSettings.videoMuted,
        stamp: (new Date()).getTime()
      });
    }

    if (hasToggledAudio && self._user.room.connected) {
      setTimeout(function () {
        self._socketSendMessage({
          type: self._SIG_MESSAGE_TYPE.MUTE_AUDIO,
          mid: self._user.id,
          rid: self._user.room.session.rid,
          muted: self._streamsMutedSettings.audioMuted,
          stamp: (new Date()).getTime()
        });
      }, hasToggledVideo ? 1050 : 0);
    }

    if ((streamTracksAvailability.hasVideo && hasToggledVideo) ||
      (streamTracksAvailability.hasAudio && hasToggledAudio)) {

      self._trigger('localMediaMuted', {
        audioMuted: streamTracksAvailability.hasAudio ? self._streamsMutedSettings.audioMuted : true,
        videoMuted: streamTracksAvailability.hasVideo ? self._streamsMutedSettings.videoMuted : true
      });

      if (self._user.room.connected) {
        self._trigger('streamMuted', self._user.id, self.getPeerInfo(), true,
          self._streams.screenshare && self._streams.screenshare.stream);
        self._trigger('peerUpdated', self._user.id, self.getPeerInfo(), true);
      }
    }
  }
};

/**
 * <blockquote class="info"><b>Deprecation Warning!</b>
 *   This method has been deprecated. Use <a href="#method_muteStream"><code>muteStream()</code> method</a> instead.
 * </blockquote>
 * Function that unmutes both <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a> and
 * <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a> audio tracks.
 * @method enableAudio
 * @deprecated true
 * @example
 *   function unmuteAudio () {
 *     skylinkDemo.enableAudio();
 *   }
 * @trigger <ol class="desc-seq">
 *   <li>Invokes <a href="#method_muteStream"><code>muteStream()</code> method</a> with
 *   <code>options.audioMuted</code> value as <code>false</code> and
 *   <code>options.videoMuted</code> value with current <code>peerInfo.mediaStatus.videoMuted</code> value.
 *   <small>See <a href="#method_getPeerInfo"><code>getPeerInfo()</code> method</a> for more information.</small></li></ol>
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.enableAudio = function() {
  this.muteStream({
    audioMuted: false,
    videoMuted: this._streamsMutedSettings.videoMuted
  });
};

/**
 * <blockquote class="info"><b>Deprecation Warning!</b>
 *   This method has been deprecated. Use <a href="#method_muteStream"><code>muteStream()</code> method</a> instead.
 * </blockquote>
 * Function that mutes both <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a> and
 * <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a> audio tracks.
 * @method disableAudio
 * @deprecated true
 * @example
 *   function muteAudio () {
 *     skylinkDemo.disableAudio();
 *   }
 * @trigger <ol class="desc-seq">
 *   <li>Invokes <a href="#method_muteStream"><code>muteStream()</code> method</a> with
 *   <code>options.audioMuted</code> value as <code>true</code> and
 *   <code>options.videoMuted</code> value with current <code>peerInfo.mediaStatus.videoMuted</code> value.
 *   <small>See <a href="#method_getPeerInfo"><code>getPeerInfo()</code> method</a> for more information.</small></li></ol>
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.disableAudio = function() {
  this.muteStream({
    audioMuted: true,
    videoMuted: this._streamsMutedSettings.videoMuted
  });
};

/**
 * <blockquote class="info"><b>Deprecation Warning!</b>
 *   This method has been deprecated. Use <a href="#method_muteStream"><code>muteStream()</code> method</a> instead.
 * </blockquote>
 * Function that unmutes both <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a> and
 * <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a> video tracks.
 * @method enableVideo
 * @deprecated true
 * @example
 *   function unmuteVideo () {
 *     skylinkDemo.enableVideo();
 *   }
 * @trigger <ol class="desc-seq">
 *   <li>Invokes <a href="#method_muteStream"><code>muteStream()</code> method</a> with
 *   <code>options.videoMuted</code> value as <code>false</code> and
 *   <code>options.audioMuted</code> value with current <code>peerInfo.mediaStatus.audioMuted</code> value.
 *   <small>See <a href="#method_getPeerInfo"><code>getPeerInfo()</code> method</a> for more information.</small></li></ol>
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.enableVideo = function() {
  this.muteStream({
    videoMuted: false,
    audioMuted: this._streamsMutedSettings.audioMuted
  });
};

/**
 * <blockquote class="info"><b>Deprecation Warning!</b>
 *   This method has been deprecated. Use <a href="#method_muteStream"><code>muteStream()</code> method</a> instead.
 * </blockquote>
 * Function that mutes both <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a> and
 * <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a> video tracks.
 * @method disableVideo
 * @deprecated true
 * @example
 *   function muteVideo () {
 *     skylinkDemo.disableVideo();
 *   }
 * @trigger <ol class="desc-seq">
 *   <li>Invokes <a href="#method_muteStream"><code>muteStream()</code> method</a> with
 *   <code>options.videoMuted</code> value as <code>true</code> and
 *   <code>options.audioMuted</code> value with current <code>peerInfo.mediaStatus.audioMuted</code> value.
 *   <small>See <a href="#method_getPeerInfo"><code>getPeerInfo()</code> method</a> for more information.</small></li></ol>
 * @for Skylink
 * @since 0.5.5
 */
Skylink.prototype.disableVideo = function() {
  this.muteStream({
    videoMuted: true,
    audioMuted: this._streamsMutedSettings.audioMuted
  });
};

/**
 * <blockquote class="info">
 *   For a better user experience, the functionality is throttled when invoked many times in less
 *   than the milliseconds interval configured in the <a href="#method_init"><code>init()</code> method</a>.
 *   Note that the Opera and Edge browser does not support screensharing, and as for IE / Safari browsers using
 *   the Temasys Plugin screensharing support, check out the <a href="https://temasys.com.sg/plugin/#commercial-licensing">
 *   commercial licensing</a> for more options.
 * </blockquote>
 * Function that retrieves screensharing Stream.
 * @method shareScreen
 * @param {JSON|Boolean} [enableAudio=false] The flag if audio tracks should be retrieved.
 * @param {Boolean} [enableAudio.stereo=false] The flag if stereo band should be configured
 *   when encoding audio codec is <a href="#attr_AUDIO_CODEC"><code>OPUS</code></a> for sending audio data.
 * @param {Boolean} [enableAudio.usedtx] <blockquote class="info">
 *   Note that this feature might not work depending on the browser support and implementation.</blockquote>
 *   The flag if DTX (Discontinuous Transmission) should be configured when encoding audio codec
 *   is <a href="#attr_AUDIO_CODEC"><code>OPUS</code></a> for sending audio data.
 *   <small>This might help to reduce bandwidth it reduces the bitrate during silence or background noise.</small>
 *   <small>When not provided, the default browser configuration is used.</small>
 * @param {Boolean} [enableAudio.useinbandfec] <blockquote class="info">
 *   Note that this feature might not work depending on the browser support and implementation.</blockquote>
 *   The flag if capability to take advantage of in-band FEC (Forward Error Correction) should be
 *   configured when encoding audio codec is <a href="#attr_AUDIO_CODEC"><code>OPUS</code></a> for sending audio data.
 *   <small>This might help to reduce the harm of packet loss by encoding information about the previous packet.</small>
 *   <small>When not provided, the default browser configuration is used.</small>
 * @param {Number} [enableAudio.maxplaybackrate] <blockquote class="info">
 *   Note that this feature might not work depending on the browser support and implementation.</blockquote>
 *   The maximum output sampling rate rendered in Hertz (Hz) when encoding audio codec is
 *   <a href="#attr_AUDIO_CODEC"><code>OPUS</code></a> for sending audio data.
 *   <small>This value must be between <code>8000</code> to <code>48000</code>.</small>
 *   <small>When not provided, the default browser configuration is used.</small>
 * @param {Boolean} [enableAudio.echoCancellation=false] The flag to enable audio tracks echo cancellation.
 * @param {Function} [callback] The callback function fired when request has completed.
 *   <small>Function parameters signature is <code>function (error, success)</code></small>
 *   <small>Function request completion is determined by the <a href="#event_mediaAccessSuccess">
 *   <code>mediaAccessSuccess</code> event</a> triggering <code>isScreensharing</code> parameter payload value
 *   as <code>true</code> for request success when User is not in the Room or is in Room without Peers,
 *   or by the <a href="#event_peerRestart"><code>peerRestart</code> event</a> triggering
 *   <code>isSelfInitiateRestart</code> parameter payload value as <code>true</code> for all connected Peers
 *   for request success when User is in Room with Peers.</small>
 * @param {Error|String} callback.error The error result in request.
 *   <small>Defined as <code>null</code> when there are no errors in request</small>
 *   <small>Object signature is the <code>shareScreen()</code> error when retrieving screensharing Stream.</small>
 * @param {MediaStream} callback.success The success result in request.
 *   <small>Defined as <code>null</code> when there are errors in request</small>
 *   <small>Object signature is the screensharing Stream object.</small>
 * @example
 *   // Example 1: Share screen with audio
 *   skylinkDemo.shareScreen(function (error, success) {
 *     if (error) return;
 *     attachMediaStream(document.getElementById("my-screen"), success);
 *   });
 *
 *   // Example 2: Share screen without audio
 *   skylinkDemo.shareScreen(false, function (error, success) {
 *     if (error) return;
 *     attachMediaStream(document.getElementById("my-screen"), success);
 *   });
 * @trigger <ol class="desc-seq">
 *   <li>Retrieves screensharing Stream. <ol><li>If retrieval was successful: <ol><li>If browser is Firefox: <ol>
 *   <li>If there are missing audio or video tracks requested: <ol>
 *   <li>If there is any previous <code>shareScreen()</code> Stream: <ol>
 *   <li>Invokes <a href="#method_stopScreen"><code>stopScreen()</code> method</a>.</li></ol></li>
 *   <li><a href="#event_mediaAccessFallback"><code>mediaAccessFallback</code> event</a>
 *   triggers parameter payload <code>state</code> as <code>FALLBACKED</code>, <code>isScreensharing</code>
 *   value as <code>true</code> and <code>isAudioFallback</code> value as <code>false</code>.</li></ol></li>
 *   <li><a href="#event_mediaAccessSuccess"><code>mediaAccessSuccess</code> event</a> triggers
 *   parameter payload <code>isScreensharing</code> value as <code>true</code> and <code>isAudioFallback</code>
 *   value as <code>false</code>.</li></ol></li><li>Else: <ol>
 *   <li>If audio is requested: <small>Chrome, Safari and IE currently doesn't support retrieval of
 *   audio track together with screensharing video track.</small> <ol><li>Retrieves audio Stream: <ol>
 *   <li>If retrieval was successful: <ol><li>Attempts to attach screensharing Stream video track to audio Stream. <ol>
 *   <li>If attachment was successful: <ol><li><a href="#event_mediaAccessSuccess">
 *   <code>mediaAccessSuccess</code> event</a> triggers parameter payload <code>isScreensharing</code>
 *   value as <code>true</code> and <code>isAudioFallback</code> value as <code>false</code>.</li></ol></li><li>Else: <ol>
 *   <li>If there is any previous <code>shareScreen()</code> Stream: <ol>
 *   <li>Invokes <a href="#method_stopScreen"><code>stopScreen()</code> method</a>.</li></ol></li>
 *   <li><a href="#event_mediaAccessFallback"><code>mediaAccessFallback</code> event</a> triggers parameter payload
 *   <code>state</code> as <code>FALLBACKED</code>, <code>isScreensharing</code> value as <code>true</code> and
 *   <code>isAudioFallback</code> value as <code>false</code>.</li>
 *   <li><a href="#event_mediaAccessSuccess"><code>mediaAccessSuccess</code> event</a> triggers
 *   parameter payload <code>isScreensharing</code> value as <code>true</code> and <code>isAudioFallback</code>
 *   value as <code>false</code>.</li></ol></li></ol></li></ol></li><li>Else: <ol>
 *   <li>If there is any previous <code>shareScreen()</code> Stream: <ol>
 *   <li>Invokes <a href="#method_stopScreen"><code>stopScreen()</code> method</a>.</li></ol></li>
 *   <li><a href="#event_mediaAccessFallback"><code>mediaAccessFallback</code> event</a>
 *   triggers parameter payload <code>state</code> as <code>FALLBACKED</code>, <code>isScreensharing</code>
 *   value as <code>true</code> and <code>isAudioFallback</code> value as <code>false</code>.</li>
 *   <li><a href="#event_mediaAccessSuccess"><code>mediaAccessSuccess</code> event</a> triggers
 *   parameter payload <code>isScreensharing</code> value as <code>true</code> and <code>isAudioFallback</code>
 *   value as <code>false</code>.</li></ol></li></ol></li></ol></li><li>Else: <ol>
 *   <li><a href="#event_mediaAccessSuccess"><code>mediaAccessSuccess</code> event</a>
 *   triggers parameter payload <code>isScreensharing</code> value as <code>true</code>
 *   and <code>isAudioFallback</code> value as <code>false</code>.</li></ol></li></ol></li></ol></li><li>Else: <ol>
 *   <li><a href="#event_mediaAccessError"><code>mediaAccessError</code> event</a> triggers parameter payload
 *   <code>isScreensharing</code> value as <code>true</code> and <code>isAudioFallback</code> value as
 *   <code>false</code>.</li><li><b>ABORT</b> and return error.</li></ol></li></ol></li><li>If User is in Room: <ol>
 *   <li><a href="#event_incomingStream"><code>incomingStream</code> event</a> triggers parameter payload
 *   <code>isSelf</code> value as <code>true</code> and <code>stream</code> as <code>shareScreen()</code> Stream.</li>
 *   <li><a href="#event_peerUpdated"><code>peerUpdated</code> event</a> triggers parameter payload
 *   <code>isSelf</code> value as <code>true</code>.</li>
 *   <li>Checks if MCU is enabled for App Key provided in <a href="#method_init"><code>init()</code> method</a>. <ol>
 *   <li>If MCU is enabled: <ol><li>Invoke <a href="#method_refreshConnection"><code>refreshConnection()</code> method</a>.
 *   <ol><li>If request has errors: <ol><li><b>ABORT</b> and return error.</li></ol></li></ol></li></ol></li><li>Else: <ol>
 *   <li>If there are connected Peers in the Room: <ol><li>Invoke <a href="#method_refreshConnection">
 *   <code>refreshConnection()</code> method</a>. <ol><li>If request has errors: <ol><li><b>ABORT</b> and return error.</li>
 *   </ol></li></ol></li></ol></li></ol></li></ol></li></ol></li></ol>
 * @for Skylink
 * @since 0.6.0
 */
Skylink.prototype.shareScreen = function (enableAudio, callback) {
  var self = this;
  var enableAudioSettings = {
    stereo: true
  };

  if (typeof enableAudio === 'function') {
    callback = enableAudio;
    enableAudio = true;

  } else if (enableAudio && typeof enableAudio === 'object') {
    enableAudioSettings.usedtx = typeof enableAudio.usedtx === 'boolean' ? enableAudio.usedtx : null;
    enableAudioSettings.useinbandfec = typeof enableAudio.useinbandfec === 'boolean' ? enableAudio.useinbandfec : null;
    enableAudioSettings.stereo = enableAudio.stereo === true;
    enableAudioSettings.echoCancellation = enableAudio.echoCancellation === true;
  }

  self._throttle(function (runFn) {
    if (!runFn) {
      if (self._options.throttlingShouldThrowError) {
        var throttleLimitError = 'Unable to run as throttle interval has not reached (' + self._options.throttleIntervals.shareScreen + 'ms).';
        log.error(throttleLimitError);

        if (typeof callback === 'function') {
          callback(new Error(throttleLimitError), null);
        }
      }
      return;
    }

    var settings = {
      settings: {
        audio: enableAudio === true || (enableAudio && typeof enableAudio === 'object') ? enableAudioSettings : false,
        video: {
          screenshare: true,
          exactConstraints: false
        }
      },
      getUserMediaSettings: {
        video: {
          mediaSource: 'window'
        }
      }
    };

    var mediaAccessSuccessFn = function (stream) {
      self.off('mediaAccessError', mediaAccessErrorFn);

      if (self._user.room.connected) {
        self._trigger('incomingStream', self._user.id, stream, true, self.getPeerInfo(), true, stream.id || stream.label);
        self._trigger('peerUpdated', self._user.id, self.getPeerInfo(), true);

        if (Object.keys(self._peerConnections).length > 0 || self._hasMCU) {
          self._refreshPeerConnection(Object.keys(self._peerConnections), false, function (err, success) {
            if (err) {
              log.error('Failed refreshing connections for shareScreen() ->', err);
              if (typeof callback === 'function') {
                callback(new Error('Failed refreshing connections.'), null);
              }
              return;
            }
            if (typeof callback === 'function') {
              callback(null, stream);
            }
          });
        } else if (typeof callback === 'function') {
          callback(null, stream);
        }
      } else if (typeof callback === 'function') {
        callback(null, stream);
      }
    };

    var mediaAccessErrorFn = function (error) {
      self.off('mediaAccessSuccess', mediaAccessSuccessFn);

      if (typeof callback === 'function') {
        callback(error, null);
      }
    };

    self.once('mediaAccessSuccess', mediaAccessSuccessFn, function (stream, isScreensharing) {
      return isScreensharing;
    });

    self.once('mediaAccessError', mediaAccessErrorFn, function (error, isScreensharing) {
      return isScreensharing;
    });

    try {
      if (enableAudio && window.webrtcDetectedBrowser === 'firefox') {
        settings.getUserMediaSettings.audio = true;
      }

      navigator.getUserMedia(settings.getUserMediaSettings, function (stream) {
        if (window.webrtcDetectedBrowser === 'firefox' || !enableAudio) {
          self._onStreamAccessSuccess(stream, settings, true, false);
          return;
        }

        navigator.getUserMedia({
          audio: true

        }, function (audioStream) {
          try {
            audioStream.addTrack(stream.getVideoTracks()[0]);

            self.once('mediaAccessSuccess', function () {
              self._streams.screenshare.streamClone = stream;
            }, function (stream, isScreensharing) {
              return isScreensharing;
            });

            self._onStreamAccessSuccess(audioStream, settings, true, false);

          } catch (error) {
            log.error('Failed retrieving audio stream for screensharing stream', error);
            self._onStreamAccessSuccess(stream, settings, true, false);
          }
        }, function (error) {
          log.error('Failed retrieving audio stream for screensharing stream', error);
          self._onStreamAccessSuccess(stream, settings, true, false);
        });

      }, function (error) {
        self._onStreamAccessError(error, settings, true, false);
      });

    } catch (error) {
      self._onStreamAccessError(error, settings, true, false);
    }
  }, 'shareScreen', self._options.throttleIntervals.shareScreen);
};

/**
 * <blockquote class="info">
 *   Note that broadcasted events from <a href="#method_muteStream"><code>muteStream()</code> method</a>,
 *   <a href="#method_stopStream"><code>stopStream()</code> method</a>,
 *   <a href="#method_stopScreen"><code>stopScreen()</code> method</a>,
 *   <a href="#method_sendMessage"><code>sendMessage()</code> method</a>,
 *   <a href="#method_unlockRoom"><code>unlockRoom()</code> method</a> and
 *   <a href="#method_lockRoom"><code>lockRoom()</code> method</a> may be queued when
 *   sent within less than an interval.
 * </blockquote>
 * Function that stops <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a>.
 * @method stopScreen
 * @example
 *   function stopScreen () {
 *     skylinkDemo.stopScreen();
 *   }
 *
 *   skylinkDemo.shareScreen();
 * @trigger <ol class="desc-seq">
 *   <li>Checks if there is <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a>. <ol>
 *   <li>If there is <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a>: <ol>
 *   <li>Stop <a href="#method_shareScreen"><code>shareScreen()</code> Stream</a> Stream. <ol>
 *   <li><a href="#event_mediaAccessStopped"><code>mediaAccessStopped</code> event</a>
 *   triggers parameter payload <code>isScreensharing</code> value as <code>true</code> and
 *   <code>isAudioFallback</code> value as <code>false</code>.</li><li>If User is in Room: <ol>
 *   <li><a href="#event_streamEnded"><code>streamEnded</code> event</a> triggers parameter payload
 *   <code>isSelf</code> value as <code>true</code> and <code>isScreensharing</code> value as <code>true</code>.</li>
 *   <li><a href="#event_peerUpdated"><code>peerUpdated</code> event</a> triggers parameter payload
 *   <code>isSelf</code> value as <code>true</code>.</li>
 *   </ol></li></ol></li><li>If User is in Room: <small><b>SKIP</b> this step if <code>stopScreen()</code>
 *   was invoked from <a href="#method_shareScreen"><code>shareScreen()</code> method</a>.</small> <ol>
 *   <li>If there is <a href="#method_getUserMedia"> <code>getUserMedia()</code>Stream</a> Stream: <ol>
 *   <li><a href="#event_incomingStream"><code>incomingStream</code> event</a> triggers parameter payload
 *   <code>isSelf</code> value as <code>true</code> and <code>stream</code> as
 *   <a href="#method_getUserMedia"><code>getUserMedia()</code> Stream</a>.</li>
 *   <li><a href="#event_peerUpdated"><code>peerUpdated</code> event</a> triggers parameter payload
 *   <code>isSelf</code> value as <code>true</code>.</li></ol></li>
 *   <li>Invoke <a href="#method_refreshConnection"><code>refreshConnection()</code> method</a>.</li>
 *   </ol></li></ol></li></ol></li></ol>
 * @for Skylink
 * @since 0.6.0
 */
Skylink.prototype.stopScreen = function () {
  if (this._streams.screenshare) {
    this._stopStreams({
      screenshare: true
    });

    if (this._user.room.connected) {
      if (this._streams.userMedia && this._streams.userMedia.stream) {
        this._trigger('incomingStream', this._user.id, this._streams.userMedia.stream, true, this.getPeerInfo(),
          false, this._streams.userMedia.stream.id || this._streams.userMedia.stream.label);
        this._trigger('peerUpdated', this._user.id, this.getPeerInfo(), true);
      }
      this._refreshPeerConnection(Object.keys(this._peerConnections), false);
    }
  }
};

/**
 * Function that handles the muting of Stream audio and video tracks.
 * @method _muteStreams
 * @private
 * @for Skylink
 * @since 0.6.15
 */
Skylink.prototype._muteStreams = function () {
  var self = this;
  var hasVideo = false;
  var hasAudio = false;

  var muteFn = function (stream) {
    var audioTracks = stream.getAudioTracks();
    var videoTracks = stream.getVideoTracks();

    for (var a = 0; a < audioTracks.length; a++) {
      audioTracks[a].enabled = !self._streamsMutedSettings.audioMuted;
      hasAudio = true;
    }

    for (var v = 0; v < videoTracks.length; v++) {
      videoTracks[v].enabled = !self._streamsMutedSettings.videoMuted;
      hasVideo = true;
    }
  };

  if (self._streams.userMedia && self._streams.userMedia.stream) {
    muteFn(self._streams.userMedia.stream);
  }

  if (self._streams.screenshare && self._streams.screenshare.stream) {
    muteFn(self._streams.screenshare.stream);
  }

  if (self._streams.screenshare && self._streams.screenshare.streamClone) {
    muteFn(self._streams.screenshare.streamClone);
  }

  log.debug('Updated Streams muted status ->', self._streamsMutedSettings);

  return {
    hasVideo: hasVideo,
    hasAudio: hasAudio
  };
};

/**
 * Function that handles stopping the Stream streaming.
 * @method _stopStreams
 * @private
 * @for Skylink
 * @since 0.6.15
 */
Skylink.prototype._stopStreams = function (options) {
  var self = this;
  var stopFn = function (stream) {
    var streamId = stream.id || stream.label;
    log.debug([null, 'MediaStream', streamId, 'Stopping Stream ->'], stream);

    try {
      var audioTracks = stream.getAudioTracks();
      var videoTracks = stream.getVideoTracks();

      for (var a = 0; a < audioTracks.length; a++) {
        audioTracks[a].stop();
      }

      for (var v = 0; v < videoTracks.length; v++) {
        videoTracks[v].stop();
      }

    } catch (error) {
      stream.stop();
    }

    if (self._streamsStoppedCbs[streamId]) {
      self._streamsStoppedCbs[streamId]();
      delete self._streamsStoppedCbs[streamId];
    }
  };

  var stopUserMedia = false;
  var stopScreenshare = false;
  var hasStoppedMedia = false;

  if (typeof options === 'object') {
    stopUserMedia = options.userMedia === true;
    stopScreenshare = options.screenshare === true;
  }

  if (stopUserMedia && self._streams.userMedia) {
    if (self._streams.userMedia.stream) {
      stopFn(self._streams.userMedia.stream);
    }

    self._streams.userMedia = null;
    hasStoppedMedia = true;
  }

  if (stopScreenshare && self._streams.screenshare) {
    if (self._streams.screenshare.streamClone) {
      stopFn(self._streams.screenshare.streamClone);
    }

    if (self._streams.screenshare.stream) {
      stopFn(self._streams.screenshare.stream);
    }

    self._streams.screenshare = null;
    hasStoppedMedia = true;
  }

  if (self._user.room.connected && hasStoppedMedia) {
    self._trigger('peerUpdated', self._user.id, self.getPeerInfo(), true);
  }

  log.log('Stopping Streams with settings ->', options);
};

/**
 * Function that parses the <code>getUserMedia()</code> settings provided.
 * @method _parseStreamSettings
 * @private
 * @for Skylink
 * @since 0.6.15
 */
Skylink.prototype._parseStreamSettings = function(options) {
  var settings = {
    settings: { audio: false, video: false },
    mutedSettings: { shouldAudioMuted: false, shouldVideoMuted: false },
    getUserMediaSettings: { audio: false, video: false }
  };

  if (options.audio) {
    // For Edge to work since they do not support the advanced constraints yet
    settings.settings.audio = {
      stereo: false,
      exactConstraints: !!options.useExactConstraints,
      echoCancellation: false
    };
    settings.getUserMediaSettings.audio = {
      echoCancellation: false
    };

    if (typeof options.audio === 'object') {
      if (typeof options.audio.stereo === 'boolean') {
        settings.settings.audio.stereo = options.audio.stereo;
      }

      if (typeof options.audio.useinbandfec === 'boolean') {
        settings.settings.audio.useinbandfec = options.audio.useinbandfec;
      }

      if (typeof options.audio.usedtx === 'boolean') {
        settings.settings.audio.usedtx = options.audio.usedtx;
      }

      if (typeof options.audio.maxplaybackrate === 'number' &&
        options.audio.maxplaybackrate >= 8000 && options.audio.maxplaybackrate <= 48000) {
        settings.settings.audio.maxplaybackrate = options.audio.maxplaybackrate;
      }

      if (typeof options.audio.mute === 'boolean') {
        settings.mutedSettings.shouldAudioMuted = options.audio.mute;
      }

      // Not supported in Edge browser features
      if (window.webrtcDetectedBrowser !== 'edge') {
        if (typeof options.audio.echoCancellation === 'boolean') {
          settings.settings.audio.echoCancellation = options.audio.echoCancellation;
          settings.getUserMediaSettings.audio.echoCancellation = options.audio.echoCancellation;
        }

        if (Array.isArray(options.audio.optional)) {
          settings.settings.audio.optional = clone(options.audio.optional);
          settings.getUserMediaSettings.audio.optional = clone(options.audio.optional);
        }

        if (options.audio.deviceId && typeof options.audio.deviceId === 'string' &&
          window.webrtcDetectedBrowser !== 'firefox') {
          settings.settings.audio.deviceId = options.audio.deviceId;

          if (options.useExactConstraints) {
            settings.getUserMediaSettings.audio.deviceId = { exact: options.audio.deviceId };

          } else {
            if (!Array.isArray(settings.getUserMediaSettings.audio.optional)) {
              settings.getUserMediaSettings.audio.optional = [];
            }

            settings.getUserMediaSettings.audio.optional.push({
              sourceId: options.audio.deviceId
            });
          }
        }
      }
    }

    if (window.webrtcDetectedBrowser === 'edge') {
      settings.getUserMediaSettings.audio = true;
    }
  }

  if (options.video) {
    // For Edge to work since they do not support the advanced constraints yet
    settings.settings.video = {
      resolution: clone(this.VIDEO_RESOLUTION.VGA),
      screenshare: false,
      exactConstraints: !!options.useExactConstraints
    };
    settings.getUserMediaSettings.video = {};

    if (typeof options.video === 'object') {
      if (typeof options.video.mute === 'boolean') {
        settings.mutedSettings.shouldVideoMuted = options.video.mute;
      }

      if (Array.isArray(options.video.optional)) {
        settings.settings.video.optional = clone(options.video.optional);
        settings.getUserMediaSettings.video.optional = clone(options.video.optional);
      }

      if (options.video.deviceId && typeof options.video.deviceId === 'string' &&
        window.webrtcDetectedBrowser !== 'firefox') {
        settings.settings.video.deviceId = options.video.deviceId;

        if (options.useExactConstraints) {
          settings.getUserMediaSettings.video.deviceId = { exact: options.video.deviceId };

        } else {
          if (!Array.isArray(settings.getUserMediaSettings.video.optional)) {
            settings.getUserMediaSettings.video.optional = [];
          }

          settings.getUserMediaSettings.video.optional.push({
            sourceId: options.video.deviceId
          });
        }
      }

      if (options.video.resolution && typeof options.video.resolution === 'object') {
        if ((options.video.resolution.width && typeof options.video.resolution.width === 'object') ||
          typeof options.video.resolution.width === 'number') {
          settings.settings.video.resolution.width = options.video.resolution.width;
        }
        if ((options.video.resolution.height && typeof options.video.resolution.height === 'object') ||
          typeof options.video.resolution.height === 'number') {
          settings.settings.video.resolution.height = options.video.resolution.height;
        }
      }

      settings.getUserMediaSettings.video.width = typeof settings.settings.video.resolution.width === 'object' ?
        settings.settings.video.resolution.width : (options.useExactConstraints ?
        { exact: settings.settings.video.resolution.width } : { max: settings.settings.video.resolution.width });

      settings.getUserMediaSettings.video.height = typeof settings.settings.video.resolution.height === 'object' ?
        settings.settings.video.resolution.height : (options.useExactConstraints ?
        { exact: settings.settings.video.resolution.height } : { max: settings.settings.video.resolution.height });

      if ((options.video.frameRate && typeof options.video.frameRate === 'object') ||
        typeof options.video.frameRate === 'number' && !self._isUsingPlugin) {
        settings.settings.video.frameRate = options.video.frameRate;
        settings.getUserMediaSettings.video.frameRate = typeof settings.settings.video.frameRate === 'object' ?
          settings.settings.video.frameRate : (options.useExactConstraints ?
          { exact: settings.settings.video.frameRate } : { max: settings.settings.video.frameRate });
      }

      if (options.video.facingMode && ['string', 'object'].indexOf(typeof options.video.facingMode) > -1 && self._isUsingPlugin) {
        settings.settings.video.facingMode = options.video.facingMode;
        settings.getUserMediaSettings.video.facingMode = typeof settings.settings.video.facingMode === 'object' ?
          settings.settings.video.facingMode : (options.useExactConstraints ?
          { exact: settings.settings.video.facingMode } : { max: settings.settings.video.facingMode });
      }
    } else if (options.useExactConstraints) {
      settings.getUserMediaSettings.video = {
        width: { exact: settings.settings.video.resolution.width },
        height: { exact: settings.settings.video.resolution.height }
      };

    } else {
      settings.getUserMediaSettings.video.mandatory = {
        maxWidth: settings.settings.video.resolution.width,
        maxHeight: settings.settings.video.resolution.height
      };
    }

    if (window.webrtcDetectedBrowser === 'edge') {
      settings.settings.video = {
        screenshare: false,
        exactConstraints: !!options.useExactConstraints
      };
      settings.getUserMediaSettings.video = true;
    }
  }

  return settings;
};

/**
 * Function that handles the native <code>navigator.getUserMedia()</code> API success callback result.
 * @method _onStreamAccessSuccess
 * @private
 * @for Skylink
 * @since 0.3.0
 */
Skylink.prototype._onStreamAccessSuccess = function(stream, settings, isScreenSharing, isAudioFallback) {
  var self = this;
  var streamId = stream.id || stream.label;

  log.log([null, 'MediaStream', streamId, 'Has access to stream ->'], stream);

  // Stop previous stream
  if (!isScreenSharing && self._streams.userMedia) {
    self._stopStreams({
      userMedia: true,
      screenshare: false
    });

  } else if (isScreenSharing && self._streams.screenshare) {
    self._stopStreams({
      userMedia: false,
      screenshare: true
    });
  }

  self._streamsStoppedCbs[streamId] = function () {
    log.log([null, 'MediaStream', streamId, 'Stream has ended']);

    self._trigger('mediaAccessStopped', !!isScreenSharing, !!isAudioFallback, streamId);

    if (self._user.room.connected) {
      log.debug([null, 'MediaStream', streamId, 'Sending Stream ended status to Peers']);

      self._socketSendMessage({
        type: self._SIG_MESSAGE_TYPE.STREAM,
        mid: self._user.id,
        rid: self._user.room.session.rid,
        streamId: streamId,
        settings: settings.settings,
        status: 'ended'
      });

      self._trigger('streamEnded', self._user.id, self.getPeerInfo(), true, !!isScreenSharing, streamId);

      if (isScreenSharing && self._streams.screenshare && self._streams.screenshare.stream &&
        (self._streams.screenshare.stream.id || self._streams.screenshare.stream.label) === streamId) {
        self._streams.screenshare = null;

      } else if (!isScreenSharing && self._streams.userMedia && self._streams.userMedia.stream &&
        (self._streams.userMedia.stream.id || self._streams.userMedia.stream.label) === streamId) {
        self._streams.userMedia = null;
      }
    }
  };

  // Handle event for Chrome / Opera
  if (['chrome', 'opera'].indexOf(window.webrtcDetectedBrowser) > -1) {
    stream.oninactive = function () {
      if (self._streamsStoppedCbs[streamId]) {
        self._streamsStoppedCbs[streamId]();
        delete self._streamsStoppedCbs[streamId];
      }
    };

  // Handle event for Firefox (use an interval)
  } else if (window.webrtcDetectedBrowser === 'firefox') {
    stream.endedInterval = setInterval(function () {
      if (typeof stream.recordedTime === 'undefined') {
        stream.recordedTime = 0;
      }
      if (stream.recordedTime === stream.currentTime) {
        clearInterval(stream.endedInterval);

        if (self._streamsStoppedCbs[streamId]) {
          self._streamsStoppedCbs[streamId]();
          delete self._streamsStoppedCbs[streamId];
        }

      } else {
        stream.recordedTime = stream.currentTime;
      }
    }, 1000);

  } else {
    stream.onended = function () {
      if (self._streamsStoppedCbs[streamId]) {
        self._streamsStoppedCbs[streamId]();
        delete self._streamsStoppedCbs[streamId];
      }
    };
  }

  if ((settings.settings.audio && stream.getAudioTracks().length === 0) ||
    (settings.settings.video && stream.getVideoTracks().length === 0)) {

    var tracksNotSameError = 'Expected audio tracks length with ' +
      (settings.settings.audio ? '1' : '0') + ' and video tracks length with ' +
      (settings.settings.video ? '1' : '0') + ' but received audio tracks length ' +
      'with ' + stream.getAudioTracks().length + ' and video ' +
      'tracks length with ' + stream.getVideoTracks().length;

    log.warn([null, 'MediaStream', streamId, tracksNotSameError]);

    var requireAudio = !!settings.settings.audio;
    var requireVideo = !!settings.settings.video;

    if (settings.settings.audio && stream.getAudioTracks().length === 0) {
      settings.settings.audio = false;
    }

    if (settings.settings.video && stream.getVideoTracks().length === 0) {
      settings.settings.video = false;
    }

    self._trigger('mediaAccessFallback', {
      error: new Error(tracksNotSameError),
      diff: {
        video: { expected: requireVideo ? 1 : 0, received: stream.getVideoTracks().length },
        audio: { expected: requireAudio ? 1 : 0, received: stream.getAudioTracks().length }
      }
    }, self.MEDIA_ACCESS_FALLBACK_STATE.FALLBACKED, !!isScreenSharing, !!isAudioFallback, streamId);
  }

  self._streams[ isScreenSharing ? 'screenshare' : 'userMedia' ] = {
    stream: stream,
    settings: settings.settings,
    constraints: settings.getUserMediaSettings
  };
  self._muteStreams();
  self._trigger('mediaAccessSuccess', stream, !!isScreenSharing, !!isAudioFallback, streamId);
};

/**
 * Function that handles the native <code>navigator.getUserMedia()</code> API failure callback result.
 * @method _onStreamAccessError
 * @private
 * @for Skylink
 * @since 0.6.15
 */
Skylink.prototype._onStreamAccessError = function(error, settings, isScreenSharing) {
  var self = this;

  if (!isScreenSharing && settings.settings.audio && settings.settings.video && self._options.audioFallback) {
    log.debug('Fallbacking to retrieve audio only Stream');

    self._trigger('mediaAccessFallback', {
      error: error,
      diff: null
    }, self.MEDIA_ACCESS_FALLBACK_STATE.FALLBACKING, false, true);

    navigator.getUserMedia({
      audio: true
    }, function (stream) {
      self._onStreamAccessSuccess(stream, settings, false, true);

    }, function (error) {
      log.error('Failed fallbacking to retrieve audio only Stream ->', error);

      self._trigger('mediaAccessError', error, false, true);
      self._trigger('mediaAccessFallback', {
        error: error,
        diff: null
      }, self.MEDIA_ACCESS_FALLBACK_STATE.ERROR, false, true);
    });
    return;
  }

  log.error('Failed retrieving ' + (isScreenSharing ? 'screensharing' : 'camera') + ' Stream ->', error);

  self._trigger('mediaAccessError', error, !!isScreenSharing, false);
};

/**
 * Function that handles the <code>RTCPeerConnection.onaddstream</code> remote MediaStream received.
 * @method _onRemoteStreamAdded
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._onRemoteStreamAdded = function(targetMid, stream, isScreenSharing) {
  var self = this;

  if (!self._peerInformations[targetMid]) {
    log.warn([targetMid, 'MediaStream', stream.id,
      'Received remote stream when peer is not connected. ' +
      'Ignoring stream ->'], stream);
    return;
  }

  /*if (!self._peerInformations[targetMid].settings.audio &&
    !self._peerInformations[targetMid].settings.video && !isScreenSharing) {
    log.log([targetMid, 'MediaStream', stream.id,
      'Receive remote stream but ignoring stream as it is empty ->'
      ], stream);
    return;
  }*/
  log.log([targetMid, 'MediaStream', stream.id, 'Received remote stream ->'], stream);

  if (isScreenSharing) {
    log.log([targetMid, 'MediaStream', stream.id, 'Peer is having a screensharing session with user']);
  }

  self._trigger('incomingStream', targetMid, stream, false, self.getPeerInfo(targetMid), isScreenSharing, stream.id || stream.label);
  self._trigger('peerUpdated', targetMid, self.getPeerInfo(targetMid), false);
};

/**
 * Function that sets User's Stream to send to Peer connection.
 * Priority for <code>shareScreen()</code> Stream over <code>getUserMedia()</code> Stream.
 * @method _addLocalMediaStreams
 * @private
 * @for Skylink
 * @since 0.5.2
 */
Skylink.prototype._addLocalMediaStreams = function(peerId) {
  var self = this;

  // NOTE ALEX: here we could do something smarter
  // a mediastream is mainly a container, most of the info
  // are attached to the tracks. We should iterates over track and print
  try {
    log.log([peerId, null, null, 'Adding local stream']);

    var pc = self._peerConnections[peerId];

    if (pc) {
      if (pc.signalingState !== self.PEER_CONNECTION_STATE.CLOSED) {
        // Updates the streams accordingly
        var updateStreamFn = function (updatedStream) {
          var hasStream = false;

          // remove streams
          var streams = pc.getLocalStreams();
          for (var i = 0; i < streams.length; i++) {
            if (updatedStream !== null && streams[i].id === updatedStream.id) {
              hasStream = true;
              continue;
            }
            // try removeStream
            pc.removeStream(streams[i]);
          }

          if (updatedStream !== null && !hasStream) {
            pc.addStream(updatedStream);
          }
        };

        if (self._streams.screenshare && self._streams.screenshare.stream) {
          log.debug([peerId, 'MediaStream', null, 'Sending screen'], self._streams.screenshare.stream);

          updateStreamFn(self._streams.screenshare.stream);

        } else if (self._streams.userMedia && self._streams.userMedia.stream) {
          log.debug([peerId, 'MediaStream', null, 'Sending stream'], self._streams.userMedia.stream);

          updateStreamFn(self._streams.userMedia.stream);

        } else {
          log.warn([peerId, 'MediaStream', null, 'No media to send. Will be only receiving']);

          updateStreamFn(null);
        }

      } else {
        log.warn([peerId, 'MediaStream', null,
          'Not adding any stream as signalingState is closed']);
      }
    } else {
      log.warn([peerId, 'MediaStream', self._mediaStream,
        'Not adding stream as peerconnection object does not exists']);
    }
  } catch (error) {
    if ((error.message || '').indexOf('already added') > -1) {
      log.warn([peerId, null, null, 'Not re-adding stream as LocalMediaStream is already added'], error);
    } else {
      // Fix errors thrown like NS_ERROR_UNEXPECTED
      log.error([peerId, null, null, 'Failed adding local stream'], error);
    }
  }
};

/**
 * Function that handles ended streams.
 * @method _handleEndedStreams
 * @private
 * @for Skylink
 * @since 0.6.16
 */
Skylink.prototype._handleEndedStreams = function (peerId, checkStreamId) {
  var self = this;
  self._streamsSession[peerId] = self._streamsSession[peerId] || {};

  var renderEndedFn = function (streamId) {
    var shouldTrigger = !!self._streamsSession[peerId][streamId];

    if (!checkStreamId && self._peerConnections[peerId] &&
      self._peerConnections[peerId].signalingState !== self.PEER_CONNECTION_STATE.CLOSED) {
      var streams = self._peerConnections[peerId].getRemoteStreams();

      for (var i = 0; i < streams.length; i++) {
        if (streamId === (streams[i].id || streams[i].label)) {
          shouldTrigger = false;
          break;
        }
      }
    }

    if (shouldTrigger) {
      var peerInfo = clone(self.getPeerInfo(peerId));
      peerInfo.settings.audio = clone(self._streamsSession[peerId][streamId].audio);
      peerInfo.settings.video = clone(self._streamsSession[peerId][streamId].video);
      var hasScreenshare = peerInfo.settings.video && typeof peerInfo.settings.video === 'object' &&
        !!peerInfo.settings.video.screenshare;
      self._streamsSession[peerId][streamId] = false;
      self._trigger('streamEnded', peerId, peerInfo, false, hasScreenshare, streamId);
    }
  };

  if (checkStreamId) {
    renderEndedFn(checkStreamId);
  } else {
    for (var prop in self._streamsSession[peerId]) {
      if (self._streamsSession[peerId].hasOwnProperty(prop) && self._streamsSession[peerId][prop]) {
        renderEndedFn(prop);
      }
    }
  }
};
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
    log.warn([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Failed to find OPUS payload. Not configuring options.']);
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
            log.log([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Received OPUS useinbandfec as true by default.']);
            opusSettings.useinbandfec = true;

          // Get default OPUS usedtx
          } else if (params[0] === 'usedtx' && params[1] === '1' && opusSettings.usedtx === null) {
            log.log([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Received OPUS usedtx as true by default.']);
            opusSettings.usedtx = true;

          // Get default OPUS maxplaybackrate
          } else if (params[0] === 'maxplaybackrate' && parseInt(params[1] || '0', 10) > 0 && opusSettings.maxplaybackrate === null) {
            log.log([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Received OPUS maxplaybackrate as ' + params[1] + ' by default.']);
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

      log.log([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Updated OPUS parameters ->'], updatedOpusParams);

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

    log.info([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Created OPUS parameters ->'], newFmtpLine);

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
      log.warn([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Not limiting "' + type + '" bandwidth']);
      return;
    }

    if (cLineIndex === -1) {
      log.error([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Failed setting "' +
        type + '" bandwidth as c-line is missing.']);
      return;
    }

    // Follow RFC 4566, that the b-line should follow after c-line.
    log.info([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Limiting maximum sending "' + type + '" bandwidth ->'], bw);
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

      log.info([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Limiting x-google-bitrate ->'], xGoogleParams);

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
  var sdpLines = sessionDescription.sdp.split('\r\n');
  var parseFn = function (type, codec) {
    if (codec === 'auto') {
      log.warn([targetMid, 'RTCSessionDesription', sessionDescription.type,
        'Not preferring any codec for "' + type + '" streaming. Using browser selection.']);
      return;
    }

    // Find the codec first
    for (var i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].indexOf('a=rtpmap:') === 0 && (sdpLines[i].toLowerCase()).indexOf(codec.toLowerCase()) > 0) {
        var payload = sdpLines[i].split(':')[1].split(' ')[0] || null;

        if (!payload) {
          log.warn([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Not preferring "' +
            codec + '" for "' + type + '" streaming as payload is not found.']);
          return;
        }

        for (var j = 0; j < sdpLines.length; j++) {
          if (sdpLines[j].indexOf('m=' + type) === 0) {
            log.info([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Preferring "' +
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

  parseFn('audio', this._options.audioCodec);
  parseFn('video', this._options.videoCodec);

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
  log.info([targetMid, 'RTCSessionDesription', sessionDescription.type,
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
  if (!(this._peerConnections[targetMid] && this._peerConnections[targetMid].getLocalStreams().length > 0)) {
    log.log([targetMid, 'RTCSessionDesription', sessionDescription.type,
      'Not enforcing MediaStream IDs as no Streams is sent.']);
    return sessionDescription.sdp;
  }

  var sessionDescriptionStr = sessionDescription.sdp;

  if (!this._options.enableIceTrickle) {
    sessionDescriptionStr = sessionDescriptionStr.replace(/a=end-of-candidates\r\n/g, '');
  }

  var sdpLines = sessionDescriptionStr.split('\r\n');
  var agent = ((this._peerInformations[targetMid] || {}).agent || {}).name || '';
  var localStream = this._peerConnections[targetMid].getLocalStreams()[0];
  var localStreamId = localStream.id || localStream.label;

  var parseFn = function (type, tracks) {
    if (tracks.length === 0) {
      log.log([targetMid, 'RTCSessionDesription', sessionDescription.type,
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

        log.info([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Updating MediaStreamTrack ssrc (' +
          ssrcId + ') for "' + localStreamId + '" stream and "' + trackId + '" (label:"' + trackLabel + '")']);

        break;
      }
    }
  };

  parseFn('audio', localStream.getAudioTracks());
  parseFn('video', localStream.getVideoTracks());

  // Append signaling of end-of-candidates
  if (!this._options.enableIceTrickle){
    log.info([targetMid, 'RTCSessionDesription', sessionDescription.type,
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
          log.info([targetMid, 'RTCSessionDesription', sessionDescription.type,
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
      log.info([targetMid, 'RTCSessionDesription', sessionDescription.type,
        'Appending later rejected m= line ->'], parts.join(' '));
      sdpLines.splice(appendIndex, 0, parts.join(' '));
    }
  }

  if (window.webrtcDetectedBrowser === 'edge' && sessionDescription.type === this.HANDSHAKE_PROGRESS.OFFER &&
    !sdpLines[sdpLines.length - 1].replace(/\s/gi, '')) {
    log.info([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Removing last empty space for Edge browsers']);
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
    log.info([targetMid, 'RTCSessionDesription', sessionDescription.type,
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
  var audioSettings = this.getPeerInfo().settings.audio;

  var parseFn = function (type, codec) {
    var payloadList = sessionDescription.sdp.match(new RegExp('a=rtpmap:(\\d*)\\ ' + codec + '.*', 'gi'));

    if (!(Array.isArray(payloadList) && payloadList.length > 0)) {
      log.warn([targetMid, 'RTCSessionDesription', sessionDescription.type,
        'Not removing "' + codec + '" as it does not exists.']);
      return;
    }

    for (var i = 0; i < payloadList.length; i++) {
      var payload = payloadList[i].split(' ')[0].split(':')[1];

      log.info([targetMid, 'RTCSessionDesription', sessionDescription.type,
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

  if (this._options.disableVideoFecCodecs) {
    if (this._hasMCU) {
      log.warn([targetMid, 'RTCSessionDesription', sessionDescription.type,
        'Not removing "ulpfec" or "red" codecs as connected to MCU to prevent connectivity issues.']);
    } else {
      parseFn('video', 'red');
      parseFn('video', 'ulpfec');
    }
  }

  if (this._options.disableComfortNoiseCodec && audioSettings && typeof audioSettings === 'object' && audioSettings.stereo) {
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
  if (!this._options.disableREMB) {
    return sessionDescription.sdp;
  }

  log.info([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Removing REMB packets.']);
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

  log.debug([targetMid, 'RTCSessionDesription', sessionDescription.type,
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
    log.warn([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Not filtering ICE candidates as ' +
      'TURN connections are enforced as MCU is present (and act as a TURN itself) so filtering of ICE candidate ' +
      'flags are not honoured']);
    return sessionDescription.sdp;
  }

  if (this._options.filterCandidatesType.host) {
    log.info([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Removing "host" ICE candidates.']);
    sessionDescription.sdp = sessionDescription.sdp.replace(/a=candidate:.*host.*\r\n/g, '');
  }

  if (this._options.filterCandidatesType.srflx) {
    log.info([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Removing "srflx" ICE candidates.']);
    sessionDescription.sdp = sessionDescription.sdp.replace(/a=candidate:.*srflx.*\r\n/g, '');
  }

  if (this._options.filterCandidatesType.relay) {
    log.info([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Removing "relay" ICE candidates.']);
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
  var settings = clone(self._sdpSettings);

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
        log.log([targetMid, 'RTCSessionDesription', sessionDescription.type,
          'Removing rejected m=' + mediaType + ' line ->'], sdpLines[i]);
        
        // Check if answerer and we do not have the power to remove the m line if index is 0
        // Set as a=inactive because we do not have that power to reject it somehow..
        // first m= line cannot be rejected for BUNDLE
        if (bundleLineIndex > -1 && mLineIndex === 0 && (direction === 'remote' ?
          sessionDescription.type === this.HANDSHAKE_PROGRESS.OFFER :
          sessionDescription.type === this.HANDSHAKE_PROGRESS.ANSWER)) {
          log.warn([targetMid, 'RTCSessionDesription', sessionDescription.type,
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
        log.info([targetMid, 'RTCSessionDesription', sessionDescription.type,
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
          log.warn([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Overriding any original settings ' +
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

  log.info([targetMid, 'RTCSessionDesription', sessionDescription.type, 'Handling connection lines and direction ->'], settings);

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


  if(typeof exports !== 'undefined') {
    // Prevent breaking code
    module.exports = {
      Skylink: Skylink
    };
  }

  if (refThis) {
    refThis.Skylink = Skylink;
  }

  if (window) {
    window.Skylink = Skylink;
  }

})(this);
