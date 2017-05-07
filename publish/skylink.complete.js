/*! skylinkjs - v0.6.19 - Sat May 06 2017 12:48:04 GMT+0800 (SGT) */
/*! adapterjs - v0.14.1-6d236da - 2017-02-28 */

// Adapter's interface.
var AdapterJS = AdapterJS || {};

AdapterJS.options = AdapterJS.options || {};

// uncomment to get virtual webcams
// AdapterJS.options.getAllCams = true;

// uncomment to prevent the install prompt when the plugin in not yet installed
// AdapterJS.options.hidePluginInstallPrompt = true;

// AdapterJS version
AdapterJS.VERSION = '0.14.1-6d236da';

// This function will be called when the WebRTC API is ready to be used
// Whether it is the native implementation (Chrome, Firefox, Opera) or
// the plugin
// You may Override this function to synchronise the start of your application
// with the WebRTC API being ready.
// If you decide not to override use this synchronisation, it may result in
// an extensive CPU usage on the plugin start (once per tab loaded)
// Params:
//    - isUsingPlugin: true is the WebRTC plugin is being used, false otherwise
//
AdapterJS.onwebrtcready = AdapterJS.onwebrtcready || function(isUsingPlugin) {
  // The WebRTC API is ready.
  // Override me and do whatever you want here
};

// New interface to store multiple callbacks, private
AdapterJS._onwebrtcreadies = [];

// Sets a callback function to be called when the WebRTC interface is ready.
// The first argument is the function to callback.\
// Throws an error if the first argument is not a function
AdapterJS.webRTCReady = function (baseCallback) {
  if (typeof baseCallback !== 'function') {
    throw new Error('Callback provided is not a function');
  }

  var callback = function () {
    // Make users having requirejs to use the webRTCReady function to define first
    // When you set a setTimeout(definePolyfill, 0), it overrides the WebRTC function
    // This is be more than 0s
    if (typeof window.require === 'function' &&
      typeof AdapterJS.defineMediaSourcePolyfill === 'function') {
      AdapterJS.defineMediaSourcePolyfill();
    }

    // All WebRTC interfaces are ready, just call the callback
    baseCallback(null !== AdapterJS.WebRTCPlugin.plugin);
  };



  if (true === AdapterJS.onwebrtcreadyDone) {
    callback();
  } else {
    // will be triggered automatically when your browser/plugin is ready.
    AdapterJS._onwebrtcreadies.push(callback);
  }
};

// Plugin namespace
AdapterJS.WebRTCPlugin = AdapterJS.WebRTCPlugin || {};

// The object to store plugin information
/* jshint ignore:start */
AdapterJS.WebRTCPlugin.pluginInfo = AdapterJS.WebRTCPlugin.pluginInfo || {
  prefix : 'Tem',
  plugName : 'TemWebRTCPlugin',
  pluginId : 'plugin0',
  type : 'application/x-temwebrtcplugin',
  onload : '__TemWebRTCReady0',
  portalLink : 'https://skylink.io/plugin/',
  downloadLink : null, //set below
  companyName: 'Temasys',
  downloadLinks : {
    mac: 'https://bit.ly/webrtcpluginpkg',
    win: 'https://bit.ly/webrtcpluginmsi'
  }
};
if(typeof AdapterJS.WebRTCPlugin.pluginInfo.downloadLinks !== "undefined" && AdapterJS.WebRTCPlugin.pluginInfo.downloadLinks !== null) {
  if(!!navigator.platform.match(/^Mac/i)) {
    AdapterJS.WebRTCPlugin.pluginInfo.downloadLink = AdapterJS.WebRTCPlugin.pluginInfo.downloadLinks.mac;
  }
  else if(!!navigator.platform.match(/^Win/i)) {
    AdapterJS.WebRTCPlugin.pluginInfo.downloadLink = AdapterJS.WebRTCPlugin.pluginInfo.downloadLinks.win;
  }
}

/* jshint ignore:end */

AdapterJS.WebRTCPlugin.TAGS = {
  NONE  : 'none',
  AUDIO : 'audio',
  VIDEO : 'video'
};

// Unique identifier of each opened page
AdapterJS.WebRTCPlugin.pageId = Math.random().toString(36).slice(2);

// Use this whenever you want to call the plugin.
AdapterJS.WebRTCPlugin.plugin = null;

// Set log level for the plugin once it is ready.
// The different values are
// This is an asynchronous function that will run when the plugin is ready
AdapterJS.WebRTCPlugin.setLogLevel = null;

// Defines webrtc's JS interface according to the plugin's implementation.
// Define plugin Browsers as WebRTC Interface.
AdapterJS.WebRTCPlugin.defineWebRTCInterface = null;

// This function detects whether or not a plugin is installed.
// Checks if Not IE (firefox, for example), else if it's IE,
// we're running IE and do something. If not it is not supported.
AdapterJS.WebRTCPlugin.isPluginInstalled = null;

 // Lets adapter.js wait until the the document is ready before injecting the plugin
AdapterJS.WebRTCPlugin.pluginInjectionInterval = null;

// Inject the HTML DOM object element into the page.
AdapterJS.WebRTCPlugin.injectPlugin = null;

// States of readiness that the plugin goes through when
// being injected and stated
AdapterJS.WebRTCPlugin.PLUGIN_STATES = {
  NONE : 0,           // no plugin use
  INITIALIZING : 1,   // Detected need for plugin
  INJECTING : 2,      // Injecting plugin
  INJECTED: 3,        // Plugin element injected but not usable yet
  READY: 4            // Plugin ready to be used
};

// Current state of the plugin. You cannot use the plugin before this is
// equal to AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY
AdapterJS.WebRTCPlugin.pluginState = AdapterJS.WebRTCPlugin.PLUGIN_STATES.NONE;

// True is AdapterJS.onwebrtcready was already called, false otherwise
// Used to make sure AdapterJS.onwebrtcready is only called once
AdapterJS.onwebrtcreadyDone = false;

// Log levels for the plugin.
// To be set by calling AdapterJS.WebRTCPlugin.setLogLevel
/*
Log outputs are prefixed in some cases.
  INFO: Information reported by the plugin.
  ERROR: Errors originating from within the plugin.
  WEBRTC: Error originating from within the libWebRTC library
*/
// From the least verbose to the most verbose
AdapterJS.WebRTCPlugin.PLUGIN_LOG_LEVELS = {
  NONE : 'NONE',
  ERROR : 'ERROR',
  WARNING : 'WARNING',
  INFO: 'INFO',
  VERBOSE: 'VERBOSE',
  SENSITIVE: 'SENSITIVE'
};

// Does a waiting check before proceeding to load the plugin.
AdapterJS.WebRTCPlugin.WaitForPluginReady = null;

// This methid will use an interval to wait for the plugin to be ready.
AdapterJS.WebRTCPlugin.callWhenPluginReady = null;

// !!!! WARNING: DO NOT OVERRIDE THIS FUNCTION. !!!
// This function will be called when plugin is ready. It sends necessary
// details to the plugin.
// The function will wait for the document to be ready and the set the
// plugin state to AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY,
// indicating that it can start being requested.
// This function is not in the IE/Safari condition brackets so that
// TemPluginLoaded function might be called on Chrome/Firefox.
// This function is the only private function that is not encapsulated to
// allow the plugin method to be called.
__TemWebRTCReady0 = function () {
  if (document.readyState === 'complete') {
    AdapterJS.WebRTCPlugin.pluginState = AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY;
    AdapterJS.maybeThroughWebRTCReady();
  } else {
    var timer = setInterval(function () {
      if (document.readyState === 'complete') {
        // TODO: update comments, we wait for the document to be ready
        clearInterval(timer);
        AdapterJS.WebRTCPlugin.pluginState = AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY;
        AdapterJS.maybeThroughWebRTCReady();
      }
    }, 100);
  }
};

AdapterJS.maybeThroughWebRTCReady = function() {
  if (!AdapterJS.onwebrtcreadyDone) {
    AdapterJS.onwebrtcreadyDone = true;

    // If new interface for multiple callbacks used
    if (AdapterJS._onwebrtcreadies.length) {
      AdapterJS._onwebrtcreadies.forEach(function (callback) {
        if (typeof(callback) === 'function') {
          callback(AdapterJS.WebRTCPlugin.plugin !== null);
        }
      });
    // Else if no callbacks on new interface assuming user used old(deprecated) way to set callback through AdapterJS.onwebrtcready = ...
    } else if (typeof(AdapterJS.onwebrtcready) === 'function') {
      AdapterJS.onwebrtcready(AdapterJS.WebRTCPlugin.plugin !== null);
    }
  }
};

// Text namespace
AdapterJS.TEXT = {
  PLUGIN: {
    REQUIRE_INSTALLATION: 'This website requires you to install a WebRTC-enabling plugin ' +
      'to work on this browser.',
    NOT_SUPPORTED: 'Your browser does not support WebRTC.',
    BUTTON: 'Install Now'
  },
  REFRESH: {
    REQUIRE_REFRESH: 'Please refresh page',
    BUTTON: 'Refresh Page'
  }
};

// The result of ice connection states.
// - starting: Ice connection is starting.
// - checking: Ice connection is checking.
// - connected Ice connection is connected.
// - completed Ice connection is connected.
// - done Ice connection has been completed.
// - disconnected Ice connection has been disconnected.
// - failed Ice connection has failed.
// - closed Ice connection is closed.
AdapterJS._iceConnectionStates = {
  starting : 'starting',
  checking : 'checking',
  connected : 'connected',
  completed : 'connected',
  done : 'completed',
  disconnected : 'disconnected',
  failed : 'failed',
  closed : 'closed'
};

//The IceConnection states that has been fired for each peer.
AdapterJS._iceConnectionFiredStates = [];


// Check if WebRTC Interface is defined.
AdapterJS.isDefined = null;

// This function helps to retrieve the webrtc detected browser information.
// This sets:
// - webrtcDetectedBrowser: The browser agent name.
// - webrtcDetectedVersion: The browser version.
// - webrtcMinimumVersion: The minimum browser version still supported by AJS.
// - webrtcDetectedType: The types of webRTC support.
//   - 'moz': Mozilla implementation of webRTC.
//   - 'webkit': WebKit implementation of webRTC.
//   - 'plugin': Using the plugin implementation.
AdapterJS.parseWebrtcDetectedBrowser = function () {
  var hasMatch = null;

  // Detect Opera (8.0+)
  if ((!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0) {
    hasMatch = navigator.userAgent.match(/OPR\/(\d+)/i) || [];

    webrtcDetectedBrowser   = 'opera';
    webrtcDetectedVersion   = parseInt(hasMatch[1] || '0', 10);
    webrtcMinimumVersion    = 26;
    webrtcDetectedType      = 'webkit';
    webrtcDetectedDCSupport = 'SCTP'; // Opera 20+ uses Chrome 33

  // Detect Bowser on iOS
  } else if (navigator.userAgent.match(/Bowser\/[0-9.]*/g)) {
    hasMatch = navigator.userAgent.match(/Bowser\/[0-9.]*/g) || [];

    var chromiumVersion = parseInt((navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./i) || [])[2] || '0', 10);

    webrtcDetectedBrowser   = 'bowser';
    webrtcDetectedVersion   = parseFloat((hasMatch[0] || '0/0').split('/')[1], 10);
    webrtcMinimumVersion    = 0;
    webrtcDetectedType      = 'webkit';
    webrtcDetectedDCSupport = chromiumVersion > 30 ? 'SCTP' : 'RTP';


  // Detect Opera on iOS (does not support WebRTC yet)
  } else if (navigator.userAgent.indexOf('OPiOS') > 0) {
    hasMatch = navigator.userAgent.match(/OPiOS\/([0-9]+)\./);

    // Browser which do not support webrtc yet
    webrtcDetectedBrowser   = 'opera';
    webrtcDetectedVersion   = parseInt(hasMatch[1] || '0', 10);
    webrtcMinimumVersion    = 0;
    webrtcDetectedType      = null;
    webrtcDetectedDCSupport = null;

  // Detect Chrome on iOS (does not support WebRTC yet)
  } else if (navigator.userAgent.indexOf('CriOS') > 0) {
    hasMatch = navigator.userAgent.match(/CriOS\/([0-9]+)\./) || [];

    webrtcDetectedBrowser   = 'chrome';
    webrtcDetectedVersion   = parseInt(hasMatch[1] || '0', 10);
    webrtcMinimumVersion    = 0;
    webrtcDetectedType      = null;
    webrtcDetectedDCSupport = null;

  // Detect Firefox on iOS (does not support WebRTC yet)
  } else if (navigator.userAgent.indexOf('FxiOS') > 0) {
    hasMatch = navigator.userAgent.match(/FxiOS\/([0-9]+)\./) || [];

    // Browser which do not support webrtc yet
    webrtcDetectedBrowser   = 'firefox';
    webrtcDetectedVersion   = parseInt(hasMatch[1] || '0', 10);
    webrtcMinimumVersion    = 0;
    webrtcDetectedType      = null;
    webrtcDetectedDCSupport = null;

  // Detect IE (6-11)
  } else if (/*@cc_on!@*/false || !!document.documentMode) {
    hasMatch = /\brv[ :]+(\d+)/g.exec(navigator.userAgent) || [];

    webrtcDetectedBrowser   = 'IE';
    webrtcDetectedVersion   = parseInt(hasMatch[1], 10);
    webrtcMinimumVersion    = 9;
    webrtcDetectedType      = 'plugin';
    webrtcDetectedDCSupport = 'SCTP';

    if (!webrtcDetectedVersion) {
      hasMatch = /\bMSIE[ :]+(\d+)/g.exec(navigator.userAgent) || [];

      webrtcDetectedVersion = parseInt(hasMatch[1] || '0', 10);
    }

  // Detect Edge (20+)
  } else if (!!window.StyleMedia || navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) {
    hasMatch = navigator.userAgent.match(/Edge\/(\d+).(\d+)$/) || [];

    // Previous webrtc/adapter uses minimum version as 10547 but checking in the Edge release history,
    // It's close to 13.10547 and ObjectRTC API is fully supported in that version

    webrtcDetectedBrowser   = 'edge';
    webrtcDetectedVersion   = parseFloat((hasMatch[0] || '0/0').split('/')[1], 10);
    webrtcMinimumVersion    = 13.10547;
    webrtcDetectedType      = 'ms';
    webrtcDetectedDCSupport = null;

  // Detect Firefox (1.0+)
  // Placed before Safari check to ensure Firefox on Android is detected
  } else if (typeof InstallTrigger !== 'undefined' || navigator.userAgent.indexOf('irefox') > 0) {
    hasMatch = navigator.userAgent.match(/Firefox\/([0-9]+)\./) || [];

    webrtcDetectedBrowser   = 'firefox';
    webrtcDetectedVersion   = parseInt(hasMatch[1] || '0', 10);
    webrtcMinimumVersion    = 33;
    webrtcDetectedType      = 'moz';
    webrtcDetectedDCSupport = 'SCTP';

  // Detect Chrome (1+ and mobile)
  // Placed before Safari check to ensure Chrome on Android is detected
  } else if ((!!window.chrome && !!window.chrome.webstore) || navigator.userAgent.indexOf('Chrom') > 0) {
    hasMatch = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./i) || [];

    webrtcDetectedBrowser   = 'chrome';
    webrtcDetectedVersion   = parseInt(hasMatch[2] || '0', 10);
    webrtcMinimumVersion    = 38;
    webrtcDetectedType      = 'webkit';
    webrtcDetectedDCSupport = webrtcDetectedVersion > 30 ? 'SCTP' : 'RTP'; // Chrome 31+ supports SCTP without flags

  // Detect Safari
  } else if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
    hasMatch = navigator.userAgent.match(/version\/(\d+)/i) || [];

    var isMobile = navigator.userAgent.match(/(iPhone|iPad)/gi) || [];

    webrtcDetectedBrowser   = 'safari';
    webrtcDetectedVersion   = parseInt(hasMatch[1] || '0', 10);
    webrtcMinimumVersion    = 7;
    webrtcDetectedType      = isMobile.length === 0 ? 'plugin' : null;
    webrtcDetectedDCSupport = isMobile.length === 0 ? 'SCTP' : null;

  }

  window.webrtcDetectedBrowser   = webrtcDetectedBrowser;
  window.webrtcDetectedVersion   = webrtcDetectedVersion;
  window.webrtcMinimumVersion    = webrtcMinimumVersion;
  window.webrtcDetectedType      = webrtcDetectedType; // Scope it to window for better consistency
  window.webrtcDetectedDCSupport = webrtcDetectedDCSupport; // Scope it to window for better consistency
};

AdapterJS.addEvent = function(elem, evnt, func) {
  if (elem.addEventListener) { // W3C DOM
    elem.addEventListener(evnt, func, false);
  } else if (elem.attachEvent) {// OLD IE DOM
    elem.attachEvent('on'+evnt, func);
  } else { // No much to do
    elem[evnt] = func;
  }
};

AdapterJS.renderNotificationBar = function (message, buttonText, buttonCallback) {
  // only inject once the page is ready
  if (document.readyState !== 'complete') {
    return;
  }

  var w = window;
  var i = document.createElement('iframe');
  i.name = 'adapterjs-alert';
  i.style.position = 'fixed';
  i.style.top = '-41px';
  i.style.left = 0;
  i.style.right = 0;
  i.style.width = '100%';
  i.style.height = '40px';
  i.style.backgroundColor = '#ffffe1';
  i.style.border = 'none';
  i.style.borderBottom = '1px solid #888888';
  i.style.zIndex = '9999999';
  if(typeof i.style.webkitTransition === 'string') {
    i.style.webkitTransition = 'all .5s ease-out';
  } else if(typeof i.style.transition === 'string') {
    i.style.transition = 'all .5s ease-out';
  }
  document.body.appendChild(i);
  var c = (i.contentWindow) ? i.contentWindow :
    (i.contentDocument.document) ? i.contentDocument.document : i.contentDocument;
  c.document.open();
  c.document.write('<span style="display: inline-block; font-family: Helvetica, Arial,' +
    'sans-serif; font-size: .9rem; padding: 4px; vertical-align: ' +
    'middle; cursor: default;">' + message + '</span>');
  if(buttonText && typeof buttonCallback === 'function') {
    c.document.write('<button id="okay">' + buttonText + '</button><button id="cancel">Cancel</button>');
    c.document.close();

    // On click on okay
    AdapterJS.addEvent(c.document.getElementById('okay'), 'click', function (e) {
      e.preventDefault();
      try {
        e.cancelBubble = true;
      } catch(error) { }
      buttonCallback(e);
    });

    // On click on Cancel - all bars has same logic so keeping it that way for now
    AdapterJS.addEvent(c.document.getElementById('cancel'), 'click', function(e) {
      w.document.body.removeChild(i);
    });
  } else {
    c.document.close();
  }
  setTimeout(function() {
    if(typeof i.style.webkitTransform === 'string') {
      i.style.webkitTransform = 'translateY(40px)';
    } else if(typeof i.style.transform === 'string') {
      i.style.transform = 'translateY(40px)';
    } else {
      i.style.top = '0px';
    }
  }, 300);
};

// -----------------------------------------------------------
// Detected webrtc implementation. Types are:
// - 'moz': Mozilla implementation of webRTC.
// - 'webkit': WebKit implementation of webRTC.
// - 'plugin': Using the plugin implementation.
webrtcDetectedType = null;

// Set the settings for creating DataChannels, MediaStream for
// Cross-browser compability.
// - This is only for SCTP based support browsers.
// the 'urls' attribute.
checkMediaDataChannelSettings =
  function (peerBrowserAgent, peerBrowserVersion, callback, constraints) {
  if (typeof callback !== 'function') {
    return;
  }
  var beOfferer = true;
  var isLocalFirefox = webrtcDetectedBrowser === 'firefox';
  // Nightly version does not require MozDontOfferDataChannel for interop
  var isLocalFirefoxInterop = webrtcDetectedType === 'moz' && webrtcDetectedVersion > 30;
  var isPeerFirefox = peerBrowserAgent === 'firefox';
  var isPeerFirefoxInterop = peerBrowserAgent === 'firefox' &&
    ((peerBrowserVersion) ? (peerBrowserVersion > 30) : false);

  // Resends an updated version of constraints for MozDataChannel to work
  // If other userAgent is firefox and user is firefox, remove MozDataChannel
  if ((isLocalFirefox && isPeerFirefox) || (isLocalFirefoxInterop)) {
    try {
      delete constraints.mandatory.MozDontOfferDataChannel;
    } catch (error) {
      console.error('Failed deleting MozDontOfferDataChannel');
      console.error(error);
    }
  } else if ((isLocalFirefox && !isPeerFirefox)) {
    constraints.mandatory.MozDontOfferDataChannel = true;
  }
  if (!isLocalFirefox) {
    // temporary measure to remove Moz* constraints in non Firefox browsers
    for (var prop in constraints.mandatory) {
      if (constraints.mandatory.hasOwnProperty(prop)) {
        if (prop.indexOf('Moz') !== -1) {
          delete constraints.mandatory[prop];
        }
      }
    }
  }
  // Firefox (not interopable) cannot offer DataChannel as it will cause problems to the
  // interopability of the media stream
  if (isLocalFirefox && !isPeerFirefox && !isLocalFirefoxInterop) {
    beOfferer = false;
  }
  callback(beOfferer, constraints);
};

// Handles the differences for all browsers ice connection state output.
// - Tested outcomes are:
//   - Chrome (offerer)  : 'checking' > 'completed' > 'completed'
//   - Chrome (answerer) : 'checking' > 'connected'
//   - Firefox (offerer) : 'checking' > 'connected'
//   - Firefox (answerer): 'checking' > 'connected'
checkIceConnectionState = function (peerId, iceConnectionState, callback) {
  if (typeof callback !== 'function') {
    console.warn('No callback specified in checkIceConnectionState. Aborted.');
    return;
  }
  peerId = (peerId) ? peerId : 'peer';

  if (!AdapterJS._iceConnectionFiredStates[peerId] ||
    iceConnectionState === AdapterJS._iceConnectionStates.disconnected ||
    iceConnectionState === AdapterJS._iceConnectionStates.failed ||
    iceConnectionState === AdapterJS._iceConnectionStates.closed) {
    AdapterJS._iceConnectionFiredStates[peerId] = [];
  }
  iceConnectionState = AdapterJS._iceConnectionStates[iceConnectionState];
  if (AdapterJS._iceConnectionFiredStates[peerId].indexOf(iceConnectionState) < 0) {
    AdapterJS._iceConnectionFiredStates[peerId].push(iceConnectionState);
    if (iceConnectionState === AdapterJS._iceConnectionStates.connected) {
      setTimeout(function () {
        AdapterJS._iceConnectionFiredStates[peerId]
          .push(AdapterJS._iceConnectionStates.done);
        callback(AdapterJS._iceConnectionStates.done);
      }, 1000);
    }
    callback(iceConnectionState);
  }
  return;
};

// Firefox:
// - Creates iceServer from the url for Firefox.
// - Create iceServer with stun url.
// - Create iceServer with turn url.
//   - Ignore the transport parameter from TURN url for FF version <=27.
//   - Return null for createIceServer if transport=tcp.
// - FF 27 and above supports transport parameters in TURN url,
// - So passing in the full url to create iceServer.
// Chrome:
// - Creates iceServer from the url for Chrome M33 and earlier.
//   - Create iceServer with stun url.
//   - Chrome M28 & above uses below TURN format.
// Plugin:
// - Creates Ice Server for Plugin Browsers
//   - If Stun - Create iceServer with stun url.
//   - Else - Create iceServer with turn url
//   - This is a WebRTC Function
createIceServer = null;

// Firefox:
// - Creates IceServers for Firefox
//   - Use .url for FireFox.
//   - Multiple Urls support
// Chrome:
// - Creates iceServers from the urls for Chrome M34 and above.
//   - .urls is supported since Chrome M34.
//   - Multiple Urls support
// Plugin:
// - Creates Ice Servers for Plugin Browsers
//   - Multiple Urls support
//   - This is a WebRTC Function
createIceServers = null;
//------------------------------------------------------------

//The RTCPeerConnection object.
RTCPeerConnection = (typeof RTCPeerConnection === 'function') ?
  RTCPeerConnection : null;

// Creates RTCSessionDescription object for Plugin Browsers
RTCSessionDescription = (typeof RTCSessionDescription === 'function') ?
  RTCSessionDescription : null;

// Creates RTCIceCandidate object for Plugin Browsers
RTCIceCandidate = (typeof RTCIceCandidate === 'function') ?
  RTCIceCandidate : null;

// Get UserMedia (only difference is the prefix).
// Code from Adam Barth.
getUserMedia = null;

// Attach a media stream to an element.
attachMediaStream = null;

// Re-attach a media stream to an element.
reattachMediaStream = null;


// Detected browser agent name. Types are:
// - 'firefox': Firefox browser.
// - 'chrome': Chrome browser.
// - 'opera': Opera browser.
// - 'safari': Safari browser.
// - 'IE' - Internet Explorer browser.
webrtcDetectedBrowser = null;

// Detected browser version.
webrtcDetectedVersion = null;

// The minimum browser version still supported by AJS.
webrtcMinimumVersion  = null;

// Check for browser types and react accordingly
if ( (navigator.mozGetUserMedia ||
      navigator.webkitGetUserMedia ||
      (navigator.mediaDevices &&
       navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)))
    && !((navigator.userAgent.match(/android/ig) || []).length === 0 &&
        (navigator.userAgent.match(/chrome/ig) || []).length === 0 && navigator.userAgent.indexOf('Safari/') > 0)) {

  ///////////////////////////////////////////////////////////////////
  // INJECTION OF GOOGLE'S ADAPTER.JS CONTENT

/* jshint ignore:start */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.adapter = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(requirecopy,module,exports){
 /* eslint-env node */
'use strict';

// SDP helpers.
var SDPUtils = {};

// Generate an alphanumeric identifier for cname or mids.
// TODO: use UUIDs instead? https://gist.github.com/jed/982883
SDPUtils.generateIdentifier = function() {
  return Math.random().toString(36).substr(2, 10);
};

// The RTCP CNAME used by all peerconnections from the same JS.
SDPUtils.localCName = SDPUtils.generateIdentifier();

// Splits SDP into lines, dealing with both CRLF and LF.
SDPUtils.splitLines = function(blob) {
  return blob.trim().split('\n').map(function(line) {
    return line.trim();
  });
};
// Splits SDP into sessionpart and mediasections. Ensures CRLF.
SDPUtils.splitSections = function(blob) {
  var parts = blob.split('\nm=');
  return parts.map(function(part, index) {
    return (index > 0 ? 'm=' + part : part).trim() + '\r\n';
  });
};

// Returns lines that start with a certain prefix.
SDPUtils.matchPrefix = function(blob, prefix) {
  return SDPUtils.splitLines(blob).filter(function(line) {
    return line.indexOf(prefix) === 0;
  });
};

// Parses an ICE candidate line. Sample input:
// candidate:702786350 2 udp 41819902 8.8.8.8 60769 typ relay raddr 8.8.8.8
// rport 55996"
SDPUtils.parseCandidate = function(line) {
  var parts;
  // Parse both variants.
  if (line.indexOf('a=candidate:') === 0) {
    parts = line.substring(12).split(' ');
  } else {
    parts = line.substring(10).split(' ');
  }

  var candidate = {
    foundation: parts[0],
    component: parts[1],
    protocol: parts[2].toLowerCase(),
    priority: parseInt(parts[3], 10),
    ip: parts[4],
    port: parseInt(parts[5], 10),
    // skip parts[6] == 'typ'
    type: parts[7]
  };

  for (var i = 8; i < parts.length; i += 2) {
    switch (parts[i]) {
      case 'raddr':
        candidate.relatedAddress = parts[i + 1];
        break;
      case 'rport':
        candidate.relatedPort = parseInt(parts[i + 1], 10);
        break;
      case 'tcptype':
        candidate.tcpType = parts[i + 1];
        break;
      default: // Unknown extensions are silently ignored.
        break;
    }
  }
  return candidate;
};

// Translates a candidate object into SDP candidate attribute.
SDPUtils.writeCandidate = function(candidate) {
  var sdp = [];
  sdp.push(candidate.foundation);
  sdp.push(candidate.component);
  sdp.push(candidate.protocol.toUpperCase());
  sdp.push(candidate.priority);
  sdp.push(candidate.ip);
  sdp.push(candidate.port);

  var type = candidate.type;
  sdp.push('typ');
  sdp.push(type);
  if (type !== 'host' && candidate.relatedAddress &&
      candidate.relatedPort) {
    sdp.push('raddr');
    sdp.push(candidate.relatedAddress); // was: relAddr
    sdp.push('rport');
    sdp.push(candidate.relatedPort); // was: relPort
  }
  if (candidate.tcpType && candidate.protocol.toLowerCase() === 'tcp') {
    sdp.push('tcptype');
    sdp.push(candidate.tcpType);
  }
  return 'candidate:' + sdp.join(' ');
};

// Parses an rtpmap line, returns RTCRtpCoddecParameters. Sample input:
// a=rtpmap:111 opus/48000/2
SDPUtils.parseRtpMap = function(line) {
  var parts = line.substr(9).split(' ');
  var parsed = {
    payloadType: parseInt(parts.shift(), 10) // was: id
  };

  parts = parts[0].split('/');

  parsed.name = parts[0];
  parsed.clockRate = parseInt(parts[1], 10); // was: clockrate
  // was: channels
  parsed.numChannels = parts.length === 3 ? parseInt(parts[2], 10) : 1;
  return parsed;
};

// Generate an a=rtpmap line from RTCRtpCodecCapability or
// RTCRtpCodecParameters.
SDPUtils.writeRtpMap = function(codec) {
  var pt = codec.payloadType;
  if (codec.preferredPayloadType !== undefined) {
    pt = codec.preferredPayloadType;
  }
  return 'a=rtpmap:' + pt + ' ' + codec.name + '/' + codec.clockRate +
      (codec.numChannels !== 1 ? '/' + codec.numChannels : '') + '\r\n';
};

// Parses an a=extmap line (headerextension from RFC 5285). Sample input:
// a=extmap:2 urn:ietf:params:rtp-hdrext:toffset
SDPUtils.parseExtmap = function(line) {
  var parts = line.substr(9).split(' ');
  return {
    id: parseInt(parts[0], 10),
    uri: parts[1]
  };
};

// Generates a=extmap line from RTCRtpHeaderExtensionParameters or
// RTCRtpHeaderExtension.
SDPUtils.writeExtmap = function(headerExtension) {
  return 'a=extmap:' + (headerExtension.id || headerExtension.preferredId) +
       ' ' + headerExtension.uri + '\r\n';
};

// Parses an ftmp line, returns dictionary. Sample input:
// a=fmtp:96 vbr=on;cng=on
// Also deals with vbr=on; cng=on
SDPUtils.parseFmtp = function(line) {
  var parsed = {};
  var kv;
  var parts = line.substr(line.indexOf(' ') + 1).split(';');
  for (var j = 0; j < parts.length; j++) {
    kv = parts[j].trim().split('=');
    parsed[kv[0].trim()] = kv[1];
  }
  return parsed;
};

// Generates an a=ftmp line from RTCRtpCodecCapability or RTCRtpCodecParameters.
SDPUtils.writeFmtp = function(codec) {
  var line = '';
  var pt = codec.payloadType;
  if (codec.preferredPayloadType !== undefined) {
    pt = codec.preferredPayloadType;
  }
  if (codec.parameters && Object.keys(codec.parameters).length) {
    var params = [];
    Object.keys(codec.parameters).forEach(function(param) {
      params.push(param + '=' + codec.parameters[param]);
    });
    line += 'a=fmtp:' + pt + ' ' + params.join(';') + '\r\n';
  }
  return line;
};

// Parses an rtcp-fb line, returns RTCPRtcpFeedback object. Sample input:
// a=rtcp-fb:98 nack rpsi
SDPUtils.parseRtcpFb = function(line) {
  var parts = line.substr(line.indexOf(' ') + 1).split(' ');
  return {
    type: parts.shift(),
    parameter: parts.join(' ')
  };
};
// Generate a=rtcp-fb lines from RTCRtpCodecCapability or RTCRtpCodecParameters.
SDPUtils.writeRtcpFb = function(codec) {
  var lines = '';
  var pt = codec.payloadType;
  if (codec.preferredPayloadType !== undefined) {
    pt = codec.preferredPayloadType;
  }
  if (codec.rtcpFeedback && codec.rtcpFeedback.length) {
    // FIXME: special handling for trr-int?
    codec.rtcpFeedback.forEach(function(fb) {
      lines += 'a=rtcp-fb:' + pt + ' ' + fb.type +
      (fb.parameter && fb.parameter.length ? ' ' + fb.parameter : '') +
          '\r\n';
    });
  }
  return lines;
};

// Parses an RFC 5576 ssrc media attribute. Sample input:
// a=ssrc:3735928559 cname:something
SDPUtils.parseSsrcMedia = function(line) {
  var sp = line.indexOf(' ');
  var parts = {
    ssrc: parseInt(line.substr(7, sp - 7), 10)
  };
  var colon = line.indexOf(':', sp);
  if (colon > -1) {
    parts.attribute = line.substr(sp + 1, colon - sp - 1);
    parts.value = line.substr(colon + 1);
  } else {
    parts.attribute = line.substr(sp + 1);
  }
  return parts;
};

// Extracts DTLS parameters from SDP media section or sessionpart.
// FIXME: for consistency with other functions this should only
//   get the fingerprint line as input. See also getIceParameters.
SDPUtils.getDtlsParameters = function(mediaSection, sessionpart) {
  var lines = SDPUtils.splitLines(mediaSection);
  // Search in session part, too.
  lines = lines.concat(SDPUtils.splitLines(sessionpart));
  var fpLine = lines.filter(function(line) {
    return line.indexOf('a=fingerprint:') === 0;
  })[0].substr(14);
  // Note: a=setup line is ignored since we use the 'auto' role.
  var dtlsParameters = {
    role: 'auto',
    fingerprints: [{
      algorithm: fpLine.split(' ')[0],
      value: fpLine.split(' ')[1]
    }]
  };
  return dtlsParameters;
};

// Serializes DTLS parameters to SDP.
SDPUtils.writeDtlsParameters = function(params, setupType) {
  var sdp = 'a=setup:' + setupType + '\r\n';
  params.fingerprints.forEach(function(fp) {
    sdp += 'a=fingerprint:' + fp.algorithm + ' ' + fp.value + '\r\n';
  });
  return sdp;
};
// Parses ICE information from SDP media section or sessionpart.
// FIXME: for consistency with other functions this should only
//   get the ice-ufrag and ice-pwd lines as input.
SDPUtils.getIceParameters = function(mediaSection, sessionpart) {
  var lines = SDPUtils.splitLines(mediaSection);
  // Search in session part, too.
  lines = lines.concat(SDPUtils.splitLines(sessionpart));
  var iceParameters = {
    usernameFragment: lines.filter(function(line) {
      return line.indexOf('a=ice-ufrag:') === 0;
    })[0].substr(12),
    password: lines.filter(function(line) {
      return line.indexOf('a=ice-pwd:') === 0;
    })[0].substr(10)
  };
  return iceParameters;
};

// Serializes ICE parameters to SDP.
SDPUtils.writeIceParameters = function(params) {
  return 'a=ice-ufrag:' + params.usernameFragment + '\r\n' +
      'a=ice-pwd:' + params.password + '\r\n';
};

// Parses the SDP media section and returns RTCRtpParameters.
SDPUtils.parseRtpParameters = function(mediaSection) {
  var description = {
    codecs: [],
    headerExtensions: [],
    fecMechanisms: [],
    rtcp: []
  };
  var lines = SDPUtils.splitLines(mediaSection);
  var mline = lines[0].split(' ');
  for (var i = 3; i < mline.length; i++) { // find all codecs from mline[3..]
    var pt = mline[i];
    var rtpmapline = SDPUtils.matchPrefix(
        mediaSection, 'a=rtpmap:' + pt + ' ')[0];
    if (rtpmapline) {
      var codec = SDPUtils.parseRtpMap(rtpmapline);
      var fmtps = SDPUtils.matchPrefix(
          mediaSection, 'a=fmtp:' + pt + ' ');
      // Only the first a=fmtp:<pt> is considered.
      codec.parameters = fmtps.length ? SDPUtils.parseFmtp(fmtps[0]) : {};
      codec.rtcpFeedback = SDPUtils.matchPrefix(
          mediaSection, 'a=rtcp-fb:' + pt + ' ')
        .map(SDPUtils.parseRtcpFb);
      description.codecs.push(codec);
      // parse FEC mechanisms from rtpmap lines.
      switch (codec.name.toUpperCase()) {
        case 'RED':
        case 'ULPFEC':
          description.fecMechanisms.push(codec.name.toUpperCase());
          break;
        default: // only RED and ULPFEC are recognized as FEC mechanisms.
          break;
      }
    }
  }
  SDPUtils.matchPrefix(mediaSection, 'a=extmap:').forEach(function(line) {
    description.headerExtensions.push(SDPUtils.parseExtmap(line));
  });
  // FIXME: parse rtcp.
  return description;
};

// Generates parts of the SDP media section describing the capabilities /
// parameters.
SDPUtils.writeRtpDescription = function(kind, caps) {
  var sdp = '';

  // Build the mline.
  sdp += 'm=' + kind + ' ';
  sdp += caps.codecs.length > 0 ? '9' : '0'; // reject if no codecs.
  sdp += ' UDP/TLS/RTP/SAVPF ';
  sdp += caps.codecs.map(function(codec) {
    if (codec.preferredPayloadType !== undefined) {
      return codec.preferredPayloadType;
    }
    return codec.payloadType;
  }).join(' ') + '\r\n';

  sdp += 'c=IN IP4 0.0.0.0\r\n';
  sdp += 'a=rtcp:9 IN IP4 0.0.0.0\r\n';

  // Add a=rtpmap lines for each codec. Also fmtp and rtcp-fb.
  caps.codecs.forEach(function(codec) {
    sdp += SDPUtils.writeRtpMap(codec);
    sdp += SDPUtils.writeFmtp(codec);
    sdp += SDPUtils.writeRtcpFb(codec);
  });
  var maxptime = 0;
  caps.codecs.forEach(function(codec) {
    if (codec.maxptime > maxptime) {
      maxptime = codec.maxptime;
    }
  });
  if (maxptime > 0) {
    sdp += 'a=maxptime:' + maxptime + '\r\n';
  }
  sdp += 'a=rtcp-mux\r\n';

  caps.headerExtensions.forEach(function(extension) {
    sdp += SDPUtils.writeExtmap(extension);
  });
  // FIXME: write fecMechanisms.
  return sdp;
};

// Parses the SDP media section and returns an array of
// RTCRtpEncodingParameters.
SDPUtils.parseRtpEncodingParameters = function(mediaSection) {
  var encodingParameters = [];
  var description = SDPUtils.parseRtpParameters(mediaSection);
  var hasRed = description.fecMechanisms.indexOf('RED') !== -1;
  var hasUlpfec = description.fecMechanisms.indexOf('ULPFEC') !== -1;

  // filter a=ssrc:... cname:, ignore PlanB-msid
  var ssrcs = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:')
  .map(function(line) {
    return SDPUtils.parseSsrcMedia(line);
  })
  .filter(function(parts) {
    return parts.attribute === 'cname';
  });
  var primarySsrc = ssrcs.length > 0 && ssrcs[0].ssrc;
  var secondarySsrc;

  var flows = SDPUtils.matchPrefix(mediaSection, 'a=ssrc-group:FID')
  .map(function(line) {
    var parts = line.split(' ');
    parts.shift();
    return parts.map(function(part) {
      return parseInt(part, 10);
    });
  });
  if (flows.length > 0 && flows[0].length > 1 && flows[0][0] === primarySsrc) {
    secondarySsrc = flows[0][1];
  }

  description.codecs.forEach(function(codec) {
    if (codec.name.toUpperCase() === 'RTX' && codec.parameters.apt) {
      var encParam = {
        ssrc: primarySsrc,
        codecPayloadType: parseInt(codec.parameters.apt, 10),
        rtx: {
          ssrc: secondarySsrc
        }
      };
      encodingParameters.push(encParam);
      if (hasRed) {
        encParam = JSON.parse(JSON.stringify(encParam));
        encParam.fec = {
          ssrc: secondarySsrc,
          mechanism: hasUlpfec ? 'red+ulpfec' : 'red'
        };
        encodingParameters.push(encParam);
      }
    }
  });
  if (encodingParameters.length === 0 && primarySsrc) {
    encodingParameters.push({
      ssrc: primarySsrc
    });
  }

  // we support both b=AS and b=TIAS but interpret AS as TIAS.
  var bandwidth = SDPUtils.matchPrefix(mediaSection, 'b=');
  if (bandwidth.length) {
    if (bandwidth[0].indexOf('b=TIAS:') === 0) {
      bandwidth = parseInt(bandwidth[0].substr(7), 10);
    } else if (bandwidth[0].indexOf('b=AS:') === 0) {
      bandwidth = parseInt(bandwidth[0].substr(5), 10);
    }
    encodingParameters.forEach(function(params) {
      params.maxBitrate = bandwidth;
    });
  }
  return encodingParameters;
};

SDPUtils.writeSessionBoilerplate = function() {
  // FIXME: sess-id should be an NTP timestamp.
  return 'v=0\r\n' +
      'o=thisisadapterortc 8169639915646943137 2 IN IP4 127.0.0.1\r\n' +
      's=-\r\n' +
      't=0 0\r\n';
};

SDPUtils.writeMediaSection = function(transceiver, caps, type, stream) {
  var sdp = SDPUtils.writeRtpDescription(transceiver.kind, caps);

  // Map ICE parameters (ufrag, pwd) to SDP.
  sdp += SDPUtils.writeIceParameters(
      transceiver.iceGatherer.getLocalParameters());

  // Map DTLS parameters to SDP.
  sdp += SDPUtils.writeDtlsParameters(
      transceiver.dtlsTransport.getLocalParameters(),
      type === 'offer' ? 'actpass' : 'active');

  sdp += 'a=mid:' + transceiver.mid + '\r\n';

  if (transceiver.rtpSender && transceiver.rtpReceiver) {
    sdp += 'a=sendrecv\r\n';
  } else if (transceiver.rtpSender) {
    sdp += 'a=sendonly\r\n';
  } else if (transceiver.rtpReceiver) {
    sdp += 'a=recvonly\r\n';
  } else {
    sdp += 'a=inactive\r\n';
  }

  // FIXME: for RTX there might be multiple SSRCs. Not implemented in Edge yet.
  if (transceiver.rtpSender) {
    var msid = 'msid:' + stream.id + ' ' +
        transceiver.rtpSender.track.id + '\r\n';
    sdp += 'a=' + msid;
    sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc +
        ' ' + msid;
    if (transceiver.sendEncodingParameters[0].rtx) {
      sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].rtx.ssrc +
          ' ' + msid;
      sdp += 'a=ssrc-group:FID ' +
          transceiver.sendEncodingParameters[0].ssrc + ' ' +
          transceiver.sendEncodingParameters[0].rtx.ssrc +
          '\r\n';
    }
  }
  // FIXME: this should be written by writeRtpDescription.
  sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc +
      ' cname:' + SDPUtils.localCName + '\r\n';
  if (transceiver.rtpSender && transceiver.sendEncodingParameters[0].rtx) {
    sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].rtx.ssrc +
        ' cname:' + SDPUtils.localCName + '\r\n';
  }
  return sdp;
};

// Gets the direction from the mediaSection or the sessionpart.
SDPUtils.getDirection = function(mediaSection, sessionpart) {
  // Look for sendrecv, sendonly, recvonly, inactive, default to sendrecv.
  var lines = SDPUtils.splitLines(mediaSection);
  for (var i = 0; i < lines.length; i++) {
    switch (lines[i]) {
      case 'a=sendrecv':
      case 'a=sendonly':
      case 'a=recvonly':
      case 'a=inactive':
        return lines[i].substr(2);
      default:
        // FIXME: What should happen here?
    }
  }
  if (sessionpart) {
    return SDPUtils.getDirection(sessionpart);
  }
  return 'sendrecv';
};

// Expose public methods.
module.exports = SDPUtils;

},{}],2:[function(requirecopy,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */

'use strict';

// Shimming starts here.
(function() {
  // Utils.
  var logging = requirecopy('./utils').log;
  var browserDetails = requirecopy('./utils').browserDetails;
  // Export to the adapter global object visible in the browser.
  module.exports.browserDetails = browserDetails;
  module.exports.extractVersion = requirecopy('./utils').extractVersion;
  module.exports.disableLog = requirecopy('./utils').disableLog;

  // Uncomment the line below if you want logging to occur, including logging
  // for the switch statement below. Can also be turned on in the browser via
  // adapter.disableLog(false), but then logging from the switch statement below
  // will not appear.
  // requirecopy('./utils').disableLog(false);

  // Browser shims.
  var chromeShim = requirecopy('./chrome/chrome_shim') || null;
  var edgeShim = requirecopy('./edge/edge_shim') || null;
  var firefoxShim = requirecopy('./firefox/firefox_shim') || null;
  var safariShim = requirecopy('./safari/safari_shim') || null;

  // Shim browser if found.
  switch (browserDetails.browser) {
    case 'opera': // fallthrough as it uses chrome shims
    case 'chrome':
      if (!chromeShim || !chromeShim.shimPeerConnection) {
        logging('Chrome shim is not included in this adapter release.');
        return;
      }
      logging('adapter.js shimming chrome.');
      // Export to the adapter global object visible in the browser.
      module.exports.browserShim = chromeShim;

      chromeShim.shimGetUserMedia();
      chromeShim.shimMediaStream();
      chromeShim.shimSourceObject();
      chromeShim.shimPeerConnection();
      chromeShim.shimOnTrack();
      break;
    case 'firefox':
      if (!firefoxShim || !firefoxShim.shimPeerConnection) {
        logging('Firefox shim is not included in this adapter release.');
        return;
      }
      logging('adapter.js shimming firefox.');
      // Export to the adapter global object visible in the browser.
      module.exports.browserShim = firefoxShim;

      firefoxShim.shimGetUserMedia();
      firefoxShim.shimSourceObject();
      firefoxShim.shimPeerConnection();
      firefoxShim.shimOnTrack();
      break;
    case 'edge':
      if (!edgeShim || !edgeShim.shimPeerConnection) {
        logging('MS edge shim is not included in this adapter release.');
        return;
      }
      logging('adapter.js shimming edge.');
      // Export to the adapter global object visible in the browser.
      module.exports.browserShim = edgeShim;

      edgeShim.shimGetUserMedia();
      edgeShim.shimPeerConnection();
      break;
    case 'safari':
      if (!safariShim) {
        logging('Safari shim is not included in this adapter release.');
        return;
      }
      logging('adapter.js shimming safari.');
      // Export to the adapter global object visible in the browser.
      module.exports.browserShim = safariShim;

      safariShim.shimGetUserMedia();
      break;
    default:
      logging('Unsupported browser!');
  }
})();

},{"./chrome/chrome_shim":3,"./edge/edge_shim":5,"./firefox/firefox_shim":7,"./safari/safari_shim":9,"./utils":10}],3:[function(requirecopy,module,exports){

/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';
var logging = requirecopy('../utils.js').log;
var browserDetails = requirecopy('../utils.js').browserDetails;

var chromeShim = {
  shimMediaStream: function() {
    window.MediaStream = window.MediaStream || window.webkitMediaStream;
  },

  shimOnTrack: function() {
    if (typeof window === 'object' && window.RTCPeerConnection && !('ontrack' in
        window.RTCPeerConnection.prototype)) {
      Object.defineProperty(window.RTCPeerConnection.prototype, 'ontrack', {
        get: function() {
          return this._ontrack;
        },
        set: function(f) {
          var self = this;
          if (this._ontrack) {
            this.removeEventListener('track', this._ontrack);
            this.removeEventListener('addstream', this._ontrackpoly);
          }
          this.addEventListener('track', this._ontrack = f);
          this.addEventListener('addstream', this._ontrackpoly = function(e) {
            // onaddstream does not fire when a track is added to an existing
            // stream. But stream.onaddtrack is implemented so we use that.
            e.stream.addEventListener('addtrack', function(te) {
              var event = new Event('track');
              event.track = te.track;
              event.receiver = {track: te.track};
              event.streams = [e.stream];
              self.dispatchEvent(event);
            });
            e.stream.getTracks().forEach(function(track) {
              var event = new Event('track');
              event.track = track;
              event.receiver = {track: track};
              event.streams = [e.stream];
              this.dispatchEvent(event);
            }.bind(this));
          }.bind(this));
        }
      });
    }
  },

  shimSourceObject: function() {
    if (typeof window === 'object') {
      if (window.HTMLMediaElement &&
        !('srcObject' in window.HTMLMediaElement.prototype)) {
        // Shim the srcObject property, once, when HTMLMediaElement is found.
        Object.defineProperty(window.HTMLMediaElement.prototype, 'srcObject', {
          get: function() {
            return this._srcObject;
          },
          set: function(stream) {
            var self = this;
            // Use _srcObject as a private property for this shim
            this._srcObject = stream;
            if (this.src) {
              URL.revokeObjectURL(this.src);
            }

            if (!stream) {
              this.src = '';
              return;
            }
            this.src = URL.createObjectURL(stream);
            // We need to recreate the blob url when a track is added or
            // removed. Doing it manually since we want to avoid a recursion.
            stream.addEventListener('addtrack', function() {
              if (self.src) {
                URL.revokeObjectURL(self.src);
              }
              self.src = URL.createObjectURL(stream);
            });
            stream.addEventListener('removetrack', function() {
              if (self.src) {
                URL.revokeObjectURL(self.src);
              }
              self.src = URL.createObjectURL(stream);
            });
          }
        });
      }
    }
  },

  shimPeerConnection: function() {
    // The RTCPeerConnection object.
    window.RTCPeerConnection = function(pcConfig, pcConstraints) {
      // Translate iceTransportPolicy to iceTransports,
      // see https://code.google.com/p/webrtc/issues/detail?id=4869
      logging('PeerConnection');
      if (pcConfig && pcConfig.iceTransportPolicy) {
        pcConfig.iceTransports = pcConfig.iceTransportPolicy;
      }

      var pc = new webkitRTCPeerConnection(pcConfig, pcConstraints);
      var origGetStats = pc.getStats.bind(pc);
      pc.getStats = function(selector, successCallback, errorCallback) {
        var self = this;
        var args = arguments;

        // If selector is a function then we are in the old style stats so just
        // pass back the original getStats format to avoid breaking old users.
        if (arguments.length > 0 && typeof selector === 'function') {
          return origGetStats(selector, successCallback);
        }

        var fixChromeStats_ = function(response) {
          var standardReport = {};
          var reports = response.result();
          reports.forEach(function(report) {
            var standardStats = {
              id: report.id,
              timestamp: report.timestamp,
              type: report.type
            };
            report.names().forEach(function(name) {
              standardStats[name] = report.stat(name);
            });
            standardReport[standardStats.id] = standardStats;
          });

          return standardReport;
        };

        // shim getStats with maplike support
        var makeMapStats = function(stats, legacyStats) {
          var map = new Map(Object.keys(stats).map(function(key) {
            return[key, stats[key]];
          }));
          legacyStats = legacyStats || stats;
          Object.keys(legacyStats).forEach(function(key) {
            map[key] = legacyStats[key];
          });
          return map;
        };

        if (arguments.length >= 2) {
          var successCallbackWrapper_ = function(response) {
            args[1](makeMapStats(fixChromeStats_(response)));
          };

          return origGetStats.apply(this, [successCallbackWrapper_,
              arguments[0]]);
        }

        // promise-support
        return new Promise(function(resolve, reject) {
          if (args.length === 1 && typeof selector === 'object') {
            origGetStats.apply(self, [
              function(response) {
                resolve(makeMapStats(fixChromeStats_(response)));
              }, reject]);
          } else {
            // Preserve legacy chrome stats only on legacy access of stats obj
            origGetStats.apply(self, [
              function(response) {
                resolve(makeMapStats(fixChromeStats_(response),
                    response.result()));
              }, reject]);
          }
        }).then(successCallback, errorCallback);
      };

      return pc;
    };
    window.RTCPeerConnection.prototype = webkitRTCPeerConnection.prototype;

    // wrap static methods. Currently just generateCertificate.
    if (webkitRTCPeerConnection.generateCertificate) {
      Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
        get: function() {
          return webkitRTCPeerConnection.generateCertificate;
        }
      });
    }

    ['createOffer', 'createAnswer'].forEach(function(method) {
      var nativeMethod = webkitRTCPeerConnection.prototype[method];
      webkitRTCPeerConnection.prototype[method] = function() {
        var self = this;
        if (arguments.length < 1 || (arguments.length === 1 &&
            typeof arguments[0] === 'object')) {
          var opts = arguments.length === 1 ? arguments[0] : undefined;
          return new Promise(function(resolve, reject) {
            nativeMethod.apply(self, [resolve, reject, opts]);
          });
        }
        return nativeMethod.apply(this, arguments);
      };
    });

    // add promise support -- natively available in Chrome 51
    if (browserDetails.version < 51) {
      ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
          .forEach(function(method) {
            var nativeMethod = webkitRTCPeerConnection.prototype[method];
            webkitRTCPeerConnection.prototype[method] = function() {
              var args = arguments;
              var self = this;
              var promise = new Promise(function(resolve, reject) {
                nativeMethod.apply(self, [args[0], resolve, reject]);
              });
              if (args.length < 2) {
                return promise;
              }
              return promise.then(function() {
                args[1].apply(null, []);
              },
              function(err) {
                if (args.length >= 3) {
                  args[2].apply(null, [err]);
                }
              });
            };
          });
    }

    // shim implicit creation of RTCSessionDescription/RTCIceCandidate
    ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
        .forEach(function(method) {
          var nativeMethod = webkitRTCPeerConnection.prototype[method];
          webkitRTCPeerConnection.prototype[method] = function() {
            arguments[0] = new ((method === 'addIceCandidate') ?
                RTCIceCandidate : RTCSessionDescription)(arguments[0]);
            return nativeMethod.apply(this, arguments);
          };
        });

    // support for addIceCandidate(null)
    var nativeAddIceCandidate =
        RTCPeerConnection.prototype.addIceCandidate;
    RTCPeerConnection.prototype.addIceCandidate = function() {
      return arguments[0] === null ? Promise.resolve()
          : nativeAddIceCandidate.apply(this, arguments);
    };
  }
};


// Expose public methods.
module.exports = {
  shimMediaStream: chromeShim.shimMediaStream,
  shimOnTrack: chromeShim.shimOnTrack,
  shimSourceObject: chromeShim.shimSourceObject,
  shimPeerConnection: chromeShim.shimPeerConnection,
  shimGetUserMedia: requirecopy('./getusermedia')
};

},{"../utils.js":10,"./getusermedia":4}],4:[function(requirecopy,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';
var logging = requirecopy('../utils.js').log;

// Expose public methods.
module.exports = function() {
  var constraintsToChrome_ = function(c) {
    if (typeof c !== 'object' || c.mandatory || c.optional) {
      return c;
    }
    var cc = {};
    Object.keys(c).forEach(function(key) {
      if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
        return;
      }
      var r = (typeof c[key] === 'object') ? c[key] : {ideal: c[key]};
      if (r.exact !== undefined && typeof r.exact === 'number') {
        r.min = r.max = r.exact;
      }
      var oldname_ = function(prefix, name) {
        if (prefix) {
          return prefix + name.charAt(0).toUpperCase() + name.slice(1);
        }
        return (name === 'deviceId') ? 'sourceId' : name;
      };
      if (r.ideal !== undefined) {
        cc.optional = cc.optional || [];
        var oc = {};
        if (typeof r.ideal === 'number') {
          oc[oldname_('min', key)] = r.ideal;
          cc.optional.push(oc);
          oc = {};
          oc[oldname_('max', key)] = r.ideal;
          cc.optional.push(oc);
        } else {
          oc[oldname_('', key)] = r.ideal;
          cc.optional.push(oc);
        }
      }
      if (r.exact !== undefined && typeof r.exact !== 'number') {
        cc.mandatory = cc.mandatory || {};
        cc.mandatory[oldname_('', key)] = r.exact;
      } else {
        ['min', 'max'].forEach(function(mix) {
          if (r[mix] !== undefined) {
            cc.mandatory = cc.mandatory || {};
            cc.mandatory[oldname_(mix, key)] = r[mix];
          }
        });
      }
    });
    if (c.advanced) {
      cc.optional = (cc.optional || []).concat(c.advanced);
    }
    return cc;
  };

  var shimConstraints_ = function(constraints, func) {
    constraints = JSON.parse(JSON.stringify(constraints));
    if (constraints && constraints.audio) {
      constraints.audio = constraintsToChrome_(constraints.audio);
    }
    if (constraints && typeof constraints.video === 'object') {
      // Shim facingMode for mobile, where it defaults to "user".
      var face = constraints.video.facingMode;
      face = face && ((typeof face === 'object') ? face : {ideal: face});

      if ((face && (face.exact === 'user' || face.exact === 'environment' ||
                    face.ideal === 'user' || face.ideal === 'environment')) &&
          !(navigator.mediaDevices.getSupportedConstraints &&
            navigator.mediaDevices.getSupportedConstraints().facingMode)) {
        delete constraints.video.facingMode;
        if (face.exact === 'environment' || face.ideal === 'environment') {
          // Look for "back" in label, or use last cam (typically back cam).
          return navigator.mediaDevices.enumerateDevices()
          .then(function(devices) {
            devices = devices.filter(function(d) {
              return d.kind === 'videoinput';
            });
            var back = devices.find(function(d) {
              return d.label.toLowerCase().indexOf('back') !== -1;
            }) || (devices.length && devices[devices.length - 1]);
            if (back) {
              constraints.video.deviceId = face.exact ? {exact: back.deviceId} :
                                                        {ideal: back.deviceId};
            }
            constraints.video = constraintsToChrome_(constraints.video);
            logging('chrome: ' + JSON.stringify(constraints));
            return func(constraints);
          });
        }
      }
      constraints.video = constraintsToChrome_(constraints.video);
    }
    logging('chrome: ' + JSON.stringify(constraints));
    return func(constraints);
  };

  var shimError_ = function(e) {
    return {
      name: {
        PermissionDeniedError: 'NotAllowedError',
        ConstraintNotSatisfiedError: 'OverconstrainedError'
      }[e.name] || e.name,
      message: e.message,
      constraint: e.constraintName,
      toString: function() {
        return this.name + (this.message && ': ') + this.message;
      }
    };
  };

  var getUserMedia_ = function(constraints, onSuccess, onError) {
    shimConstraints_(constraints, function(c) {
      navigator.webkitGetUserMedia(c, onSuccess, function(e) {
        onError(shimError_(e));
      });
    });
  };

  navigator.getUserMedia = getUserMedia_;

  // Returns the result of getUserMedia as a Promise.
  var getUserMediaPromise_ = function(constraints) {
    return new Promise(function(resolve, reject) {
      navigator.getUserMedia(constraints, resolve, reject);
    });
  };

  if (!navigator.mediaDevices) {
    navigator.mediaDevices = {
      getUserMedia: getUserMediaPromise_,
      enumerateDevices: function() {
        return new Promise(function(resolve) {
          var kinds = {audio: 'audioinput', video: 'videoinput'};
          return MediaStreamTrack.getSources(function(devices) {
            resolve(devices.map(function(device) {
              return {label: device.label,
                      kind: kinds[device.kind],
                      deviceId: device.id,
                      groupId: ''};
            }));
          });
        });
      }
    };
  }

  // A shim for getUserMedia method on the mediaDevices object.
  // TODO(KaptenJansson) remove once implemented in Chrome stable.
  if (!navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia = function(constraints) {
      return getUserMediaPromise_(constraints);
    };
  } else {
    // Even though Chrome 45 has navigator.mediaDevices and a getUserMedia
    // function which returns a Promise, it does not accept spec-style
    // constraints.
    var origGetUserMedia = navigator.mediaDevices.getUserMedia.
        bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function(cs) {
      return shimConstraints_(cs, function(c) {
        return origGetUserMedia(c).catch(function(e) {
          return Promise.reject(shimError_(e));
        });
      });
    };
  }

  // Dummy devicechange event methods.
  // TODO(KaptenJansson) remove once implemented in Chrome stable.
  if (typeof navigator.mediaDevices.addEventListener === 'undefined') {
    navigator.mediaDevices.addEventListener = function() {
      logging('Dummy mediaDevices.addEventListener called.');
    };
  }
  if (typeof navigator.mediaDevices.removeEventListener === 'undefined') {
    navigator.mediaDevices.removeEventListener = function() {
      logging('Dummy mediaDevices.removeEventListener called.');
    };
  }
};

},{"../utils.js":10}],5:[function(requirecopy,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

var SDPUtils = requirecopy('sdp');
var browserDetails = requirecopy('../utils').browserDetails;

var edgeShim = {
  shimPeerConnection: function() {
    if (window.RTCIceGatherer) {
      // ORTC defines an RTCIceCandidate object but no constructor.
      // Not implemented in Edge.
      if (!window.RTCIceCandidate) {
        window.RTCIceCandidate = function(args) {
          return args;
        };
      }
      // ORTC does not have a session description object but
      // other browsers (i.e. Chrome) that will support both PC and ORTC
      // in the future might have this defined already.
      if (!window.RTCSessionDescription) {
        window.RTCSessionDescription = function(args) {
          return args;
        };
      }
    }

    window.RTCPeerConnection = function(config) {
      var self = this;

      var _eventTarget = document.createDocumentFragment();
      ['addEventListener', 'removeEventListener', 'dispatchEvent']
          .forEach(function(method) {
            self[method] = _eventTarget[method].bind(_eventTarget);
          });

      this.onicecandidate = null;
      this.onaddstream = null;
      this.ontrack = null;
      this.onremovestream = null;
      this.onsignalingstatechange = null;
      this.oniceconnectionstatechange = null;
      this.onnegotiationneeded = null;
      this.ondatachannel = null;

      this.localStreams = [];
      this.remoteStreams = [];
      this.getLocalStreams = function() {
        return self.localStreams;
      };
      this.getRemoteStreams = function() {
        return self.remoteStreams;
      };

      this.localDescription = new RTCSessionDescription({
        type: '',
        sdp: ''
      });
      this.remoteDescription = new RTCSessionDescription({
        type: '',
        sdp: ''
      });
      this.signalingState = 'stable';
      this.iceConnectionState = 'new';
      this.iceGatheringState = 'new';

      this.iceOptions = {
        gatherPolicy: 'all',
        iceServers: []
      };
      if (config && config.iceTransportPolicy) {
        switch (config.iceTransportPolicy) {
          case 'all':
          case 'relay':
            this.iceOptions.gatherPolicy = config.iceTransportPolicy;
            break;
          case 'none':
            // FIXME: remove once implementation and spec have added this.
            throw new TypeError('iceTransportPolicy "none" not supported');
          default:
            // don't set iceTransportPolicy.
            break;
        }
      }
      this.usingBundle = config && config.bundlePolicy === 'max-bundle';

      if (config && config.iceServers) {
        // Edge does not like
        // 1) stun:
        // 2) turn: that does not have all of turn:host:port?transport=udp
        // 3) turn: with ipv6 addresses
        var iceServers = JSON.parse(JSON.stringify(config.iceServers));
        this.iceOptions.iceServers = iceServers.filter(function(server) {
          if (server && server.urls) {
            var urls = server.urls;
            if (typeof urls === 'string') {
              urls = [urls];
            }
            urls = urls.filter(function(url) {
              return (url.indexOf('turn:') === 0 &&
                  url.indexOf('transport=udp') !== -1 &&
                  url.indexOf('turn:[') === -1) ||
                  (url.indexOf('stun:') === 0 &&
                    browserDetails.version >= 14393);
            })[0];
            return !!urls;
          }
          return false;
        });
      }

      // per-track iceGathers, iceTransports, dtlsTransports, rtpSenders, ...
      // everything that is needed to describe a SDP m-line.
      this.transceivers = [];

      // since the iceGatherer is currently created in createOffer but we
      // must not emit candidates until after setLocalDescription we buffer
      // them in this array.
      this._localIceCandidatesBuffer = [];
    };

    window.RTCPeerConnection.prototype._emitBufferedCandidates = function() {
      var self = this;
      var sections = SDPUtils.splitSections(self.localDescription.sdp);
      // FIXME: need to apply ice candidates in a way which is async but
      // in-order
      this._localIceCandidatesBuffer.forEach(function(event) {
        var end = !event.candidate || Object.keys(event.candidate).length === 0;
        if (end) {
          for (var j = 1; j < sections.length; j++) {
            if (sections[j].indexOf('\r\na=end-of-candidates\r\n') === -1) {
              sections[j] += 'a=end-of-candidates\r\n';
            }
          }
        } else if (event.candidate.candidate.indexOf('typ endOfCandidates')
            === -1) {
          sections[event.candidate.sdpMLineIndex + 1] +=
              'a=' + event.candidate.candidate + '\r\n';
        }
        self.localDescription.sdp = sections.join('');
        self.dispatchEvent(event);
        if (self.onicecandidate !== null) {
          self.onicecandidate(event);
        }
        if (!event.candidate && self.iceGatheringState !== 'complete') {
          var complete = self.transceivers.every(function(transceiver) {
            return transceiver.iceGatherer &&
                transceiver.iceGatherer.state === 'completed';
          });
          if (complete) {
            self.iceGatheringState = 'complete';
          }
        }
      });
      this._localIceCandidatesBuffer = [];
    };

    window.RTCPeerConnection.prototype.addStream = function(stream) {
      // Clone is necessary for local demos mostly, attaching directly
      // to two different senders does not work (build 10547).
      this.localStreams.push(stream.clone());
      this._maybeFireNegotiationNeeded();
    };

    window.RTCPeerConnection.prototype.removeStream = function(stream) {
      var idx = this.localStreams.indexOf(stream);
      if (idx > -1) {
        this.localStreams.splice(idx, 1);
        this._maybeFireNegotiationNeeded();
      }
    };

    window.RTCPeerConnection.prototype.getSenders = function() {
      return this.transceivers.filter(function(transceiver) {
        return !!transceiver.rtpSender;
      })
      .map(function(transceiver) {
        return transceiver.rtpSender;
      });
    };

    window.RTCPeerConnection.prototype.getReceivers = function() {
      return this.transceivers.filter(function(transceiver) {
        return !!transceiver.rtpReceiver;
      })
      .map(function(transceiver) {
        return transceiver.rtpReceiver;
      });
    };

    // Determines the intersection of local and remote capabilities.
    window.RTCPeerConnection.prototype._getCommonCapabilities =
        function(localCapabilities, remoteCapabilities) {
          var commonCapabilities = {
            codecs: [],
            headerExtensions: [],
            fecMechanisms: []
          };
          localCapabilities.codecs.forEach(function(lCodec) {
            for (var i = 0; i < remoteCapabilities.codecs.length; i++) {
              var rCodec = remoteCapabilities.codecs[i];
              if (lCodec.name.toLowerCase() === rCodec.name.toLowerCase() &&
                  lCodec.clockRate === rCodec.clockRate &&
                  lCodec.numChannels === rCodec.numChannels) {
                // push rCodec so we reply with offerer payload type
                commonCapabilities.codecs.push(rCodec);

                // determine common feedback mechanisms
                rCodec.rtcpFeedback = rCodec.rtcpFeedback.filter(function(fb) {
                  for (var j = 0; j < lCodec.rtcpFeedback.length; j++) {
                    if (lCodec.rtcpFeedback[j].type === fb.type &&
                        lCodec.rtcpFeedback[j].parameter === fb.parameter) {
                      return true;
                    }
                  }
                  return false;
                });
                // FIXME: also need to determine .parameters
                //  see https://github.com/openpeer/ortc/issues/569
                break;
              }
            }
          });

          localCapabilities.headerExtensions
              .forEach(function(lHeaderExtension) {
                for (var i = 0; i < remoteCapabilities.headerExtensions.length;
                     i++) {
                  var rHeaderExtension = remoteCapabilities.headerExtensions[i];
                  if (lHeaderExtension.uri === rHeaderExtension.uri) {
                    commonCapabilities.headerExtensions.push(rHeaderExtension);
                    break;
                  }
                }
              });

          // FIXME: fecMechanisms
          return commonCapabilities;
        };

    // Create ICE gatherer, ICE transport and DTLS transport.
    window.RTCPeerConnection.prototype._createIceAndDtlsTransports =
        function(mid, sdpMLineIndex) {
          var self = this;
          var iceGatherer = new RTCIceGatherer(self.iceOptions);
          var iceTransport = new RTCIceTransport(iceGatherer);
          iceGatherer.onlocalcandidate = function(evt) {
            var event = new Event('icecandidate');
            event.candidate = {sdpMid: mid, sdpMLineIndex: sdpMLineIndex};

            var cand = evt.candidate;
            var end = !cand || Object.keys(cand).length === 0;
            // Edge emits an empty object for RTCIceCandidateComplete‥
            if (end) {
              // polyfill since RTCIceGatherer.state is not implemented in
              // Edge 10547 yet.
              if (iceGatherer.state === undefined) {
                iceGatherer.state = 'completed';
              }

              // Emit a candidate with type endOfCandidates to make the samples
              // work. Edge requires addIceCandidate with this empty candidate
              // to start checking. The real solution is to signal
              // end-of-candidates to the other side when getting the null
              // candidate but some apps (like the samples) don't do that.
              event.candidate.candidate =
                  'candidate:1 1 udp 1 0.0.0.0 9 typ endOfCandidates';
            } else {
              // RTCIceCandidate doesn't have a component, needs to be added
              cand.component = iceTransport.component === 'RTCP' ? 2 : 1;
              event.candidate.candidate = SDPUtils.writeCandidate(cand);
            }

            // update local description.
            var sections = SDPUtils.splitSections(self.localDescription.sdp);
            if (event.candidate.candidate.indexOf('typ endOfCandidates')
                === -1) {
              sections[event.candidate.sdpMLineIndex + 1] +=
                  'a=' + event.candidate.candidate + '\r\n';
            } else {
              sections[event.candidate.sdpMLineIndex + 1] +=
                  'a=end-of-candidates\r\n';
            }
            self.localDescription.sdp = sections.join('');

            var complete = self.transceivers.every(function(transceiver) {
              return transceiver.iceGatherer &&
                  transceiver.iceGatherer.state === 'completed';
            });

            // Emit candidate if localDescription is set.
            // Also emits null candidate when all gatherers are complete.
            switch (self.iceGatheringState) {
              case 'new':
                self._localIceCandidatesBuffer.push(event);
                if (end && complete) {
                  self._localIceCandidatesBuffer.push(
                      new Event('icecandidate'));
                }
                break;
              case 'gathering':
                self._emitBufferedCandidates();
                self.dispatchEvent(event);
                if (self.onicecandidate !== null) {
                  self.onicecandidate(event);
                }
                if (complete) {
                  self.dispatchEvent(new Event('icecandidate'));
                  if (self.onicecandidate !== null) {
                    self.onicecandidate(new Event('icecandidate'));
                  }
                  self.iceGatheringState = 'complete';
                }
                break;
              case 'complete':
                // should not happen... currently!
                break;
              default: // no-op.
                break;
            }
          };
          iceTransport.onicestatechange = function() {
            self._updateConnectionState();
          };

          var dtlsTransport = new RTCDtlsTransport(iceTransport);
          dtlsTransport.ondtlsstatechange = function() {
            self._updateConnectionState();
          };
          dtlsTransport.onerror = function() {
            // onerror does not set state to failed by itself.
            dtlsTransport.state = 'failed';
            self._updateConnectionState();
          };

          return {
            iceGatherer: iceGatherer,
            iceTransport: iceTransport,
            dtlsTransport: dtlsTransport
          };
        };

    // Start the RTP Sender and Receiver for a transceiver.
    window.RTCPeerConnection.prototype._transceive = function(transceiver,
        send, recv) {
      var params = this._getCommonCapabilities(transceiver.localCapabilities,
          transceiver.remoteCapabilities);
      if (send && transceiver.rtpSender) {
        params.encodings = transceiver.sendEncodingParameters;
        params.rtcp = {
          cname: SDPUtils.localCName
        };
        if (transceiver.recvEncodingParameters.length) {
          params.rtcp.ssrc = transceiver.recvEncodingParameters[0].ssrc;
        }
        transceiver.rtpSender.send(params);
      }
      if (recv && transceiver.rtpReceiver) {
        params.encodings = transceiver.recvEncodingParameters;
        params.rtcp = {
          cname: transceiver.cname
        };
        if (transceiver.sendEncodingParameters.length) {
          params.rtcp.ssrc = transceiver.sendEncodingParameters[0].ssrc;
        }
        transceiver.rtpReceiver.receive(params);
      }
    };

    window.RTCPeerConnection.prototype.setLocalDescription =
        function(description) {
          var self = this;
          var sections;
          var sessionpart;
          if (description.type === 'offer') {
            // FIXME: What was the purpose of this empty if statement?
            // if (!this._pendingOffer) {
            // } else {
            if (this._pendingOffer) {
              // VERY limited support for SDP munging. Limited to:
              // * changing the order of codecs
              sections = SDPUtils.splitSections(description.sdp);
              sessionpart = sections.shift();
              sections.forEach(function(mediaSection, sdpMLineIndex) {
                var caps = SDPUtils.parseRtpParameters(mediaSection);
                self._pendingOffer[sdpMLineIndex].localCapabilities = caps;
              });
              this.transceivers = this._pendingOffer;
              delete this._pendingOffer;
            }
          } else if (description.type === 'answer') {
            sections = SDPUtils.splitSections(self.remoteDescription.sdp);
            sessionpart = sections.shift();
            var isIceLite = SDPUtils.matchPrefix(sessionpart,
                'a=ice-lite').length > 0;
            sections.forEach(function(mediaSection, sdpMLineIndex) {
              var transceiver = self.transceivers[sdpMLineIndex];
              var iceGatherer = transceiver.iceGatherer;
              var iceTransport = transceiver.iceTransport;
              var dtlsTransport = transceiver.dtlsTransport;
              var localCapabilities = transceiver.localCapabilities;
              var remoteCapabilities = transceiver.remoteCapabilities;

              var rejected = mediaSection.split('\n', 1)[0]
                  .split(' ', 2)[1] === '0';

              if (!rejected && !transceiver.isDatachannel) {
                var remoteIceParameters = SDPUtils.getIceParameters(
                    mediaSection, sessionpart);
                if (isIceLite) {
                  var cands = SDPUtils.matchPrefix(mediaSection, 'a=candidate:')
                  .map(function(cand) {
                    return SDPUtils.parseCandidate(cand);
                  })
                  .filter(function(cand) {
                    return cand.component === '1';
                  });
                  // ice-lite only includes host candidates in the SDP so we can
                  // use setRemoteCandidates (which implies an
                  // RTCIceCandidateComplete)
                  if (cands.length) {
                    iceTransport.setRemoteCandidates(cands);
                  }
                }
                var remoteDtlsParameters = SDPUtils.getDtlsParameters(
                    mediaSection, sessionpart);
                if (isIceLite) {
                  remoteDtlsParameters.role = 'server';
                }

                if (!self.usingBundle || sdpMLineIndex === 0) {
                  iceTransport.start(iceGatherer, remoteIceParameters,
                      isIceLite ? 'controlling' : 'controlled');
                  dtlsTransport.start(remoteDtlsParameters);
                }

                // Calculate intersection of capabilities.
                var params = self._getCommonCapabilities(localCapabilities,
                    remoteCapabilities);

                // Start the RTCRtpSender. The RTCRtpReceiver for this
                // transceiver has already been started in setRemoteDescription.
                self._transceive(transceiver,
                    params.codecs.length > 0,
                    false);
              }
            });
          }

          this.localDescription = {
            type: description.type,
            sdp: description.sdp
          };
          switch (description.type) {
            case 'offer':
              this._updateSignalingState('have-local-offer');
              break;
            case 'answer':
              this._updateSignalingState('stable');
              break;
            default:
              throw new TypeError('unsupported type "' + description.type +
                  '"');
          }

          // If a success callback was provided, emit ICE candidates after it
          // has been executed. Otherwise, emit callback after the Promise is
          // resolved.
          var hasCallback = arguments.length > 1 &&
            typeof arguments[1] === 'function';
          if (hasCallback) {
            var cb = arguments[1];
            window.setTimeout(function() {
              cb();
              if (self.iceGatheringState === 'new') {
                self.iceGatheringState = 'gathering';
              }
              self._emitBufferedCandidates();
            }, 0);
          }
          var p = Promise.resolve();
          p.then(function() {
            if (!hasCallback) {
              if (self.iceGatheringState === 'new') {
                self.iceGatheringState = 'gathering';
              }
              // Usually candidates will be emitted earlier.
              window.setTimeout(self._emitBufferedCandidates.bind(self), 500);
            }
          });
          return p;
        };

    window.RTCPeerConnection.prototype.setRemoteDescription =
        function(description) {
          var self = this;
          var stream = new MediaStream();
          var receiverList = [];
          var sections = SDPUtils.splitSections(description.sdp);
          var sessionpart = sections.shift();
          var isIceLite = SDPUtils.matchPrefix(sessionpart,
              'a=ice-lite').length > 0;
          this.usingBundle = SDPUtils.matchPrefix(sessionpart,
              'a=group:BUNDLE ').length > 0;
          sections.forEach(function(mediaSection, sdpMLineIndex) {
            var lines = SDPUtils.splitLines(mediaSection);
            var mline = lines[0].substr(2).split(' ');
            var kind = mline[0];
            var rejected = mline[1] === '0';
            var direction = SDPUtils.getDirection(mediaSection, sessionpart);

            var mid = SDPUtils.matchPrefix(mediaSection, 'a=mid:');
            if (mid.length) {
              mid = mid[0].substr(6);
            } else {
              mid = SDPUtils.generateIdentifier();
            }

            // Reject datachannels which are not implemented yet.
            if (kind === 'application' && mline[2] === 'DTLS/SCTP') {
              self.transceivers[sdpMLineIndex] = {
                mid: mid,
                isDatachannel: true
              };
              return;
            }

            var transceiver;
            var iceGatherer;
            var iceTransport;
            var dtlsTransport;
            var rtpSender;
            var rtpReceiver;
            var sendEncodingParameters;
            var recvEncodingParameters;
            var localCapabilities;

            var track;
            // FIXME: ensure the mediaSection has rtcp-mux set.
            var remoteCapabilities = SDPUtils.parseRtpParameters(mediaSection);
            var remoteIceParameters;
            var remoteDtlsParameters;
            if (!rejected) {
              remoteIceParameters = SDPUtils.getIceParameters(mediaSection,
                  sessionpart);
              remoteDtlsParameters = SDPUtils.getDtlsParameters(mediaSection,
                  sessionpart);
              remoteDtlsParameters.role = 'client';
            }
            recvEncodingParameters =
                SDPUtils.parseRtpEncodingParameters(mediaSection);

            var cname;
            // Gets the first SSRC. Note that with RTX there might be multiple
            // SSRCs.
            var remoteSsrc = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:')
                .map(function(line) {
                  return SDPUtils.parseSsrcMedia(line);
                })
                .filter(function(obj) {
                  return obj.attribute === 'cname';
                })[0];
            if (remoteSsrc) {
              cname = remoteSsrc.value;
            }

            var isComplete = SDPUtils.matchPrefix(mediaSection,
                'a=end-of-candidates', sessionpart).length > 0;
            var cands = SDPUtils.matchPrefix(mediaSection, 'a=candidate:')
                .map(function(cand) {
                  return SDPUtils.parseCandidate(cand);
                })
                .filter(function(cand) {
                  return cand.component === '1';
                });
            if (description.type === 'offer' && !rejected) {
              var transports = self.usingBundle && sdpMLineIndex > 0 ? {
                iceGatherer: self.transceivers[0].iceGatherer,
                iceTransport: self.transceivers[0].iceTransport,
                dtlsTransport: self.transceivers[0].dtlsTransport
              } : self._createIceAndDtlsTransports(mid, sdpMLineIndex);

              if (isComplete) {
                transports.iceTransport.setRemoteCandidates(cands);
              }

              localCapabilities = RTCRtpReceiver.getCapabilities(kind);
              sendEncodingParameters = [{
                ssrc: (2 * sdpMLineIndex + 2) * 1001
              }];

              rtpReceiver = new RTCRtpReceiver(transports.dtlsTransport, kind);

              track = rtpReceiver.track;
              receiverList.push([track, rtpReceiver]);
              // FIXME: not correct when there are multiple streams but that is
              // not currently supported in this shim.
              stream.addTrack(track);

              // FIXME: look at direction.
              if (self.localStreams.length > 0 &&
                  self.localStreams[0].getTracks().length >= sdpMLineIndex) {
                var localTrack;
                if (kind === 'audio') {
                  localTrack = self.localStreams[0].getAudioTracks()[0];
                } else if (kind === 'video') {
                  localTrack = self.localStreams[0].getVideoTracks()[0];
                }
                if (localTrack) {
                  rtpSender = new RTCRtpSender(localTrack,
                      transports.dtlsTransport);
                }
              }

              self.transceivers[sdpMLineIndex] = {
                iceGatherer: transports.iceGatherer,
                iceTransport: transports.iceTransport,
                dtlsTransport: transports.dtlsTransport,
                localCapabilities: localCapabilities,
                remoteCapabilities: remoteCapabilities,
                rtpSender: rtpSender,
                rtpReceiver: rtpReceiver,
                kind: kind,
                mid: mid,
                cname: cname,
                sendEncodingParameters: sendEncodingParameters,
                recvEncodingParameters: recvEncodingParameters
              };
              // Start the RTCRtpReceiver now. The RTPSender is started in
              // setLocalDescription.
              self._transceive(self.transceivers[sdpMLineIndex],
                  false,
                  direction === 'sendrecv' || direction === 'sendonly');
            } else if (description.type === 'answer' && !rejected) {
              transceiver = self.transceivers[sdpMLineIndex];
              iceGatherer = transceiver.iceGatherer;
              iceTransport = transceiver.iceTransport;
              dtlsTransport = transceiver.dtlsTransport;
              rtpSender = transceiver.rtpSender;
              rtpReceiver = transceiver.rtpReceiver;
              sendEncodingParameters = transceiver.sendEncodingParameters;
              localCapabilities = transceiver.localCapabilities;

              self.transceivers[sdpMLineIndex].recvEncodingParameters =
                  recvEncodingParameters;
              self.transceivers[sdpMLineIndex].remoteCapabilities =
                  remoteCapabilities;
              self.transceivers[sdpMLineIndex].cname = cname;

              if ((isIceLite || isComplete) && cands.length) {
                iceTransport.setRemoteCandidates(cands);
              }
              if (!self.usingBundle || sdpMLineIndex === 0) {
                iceTransport.start(iceGatherer, remoteIceParameters,
                    'controlling');
                dtlsTransport.start(remoteDtlsParameters);
              }

              self._transceive(transceiver,
                  direction === 'sendrecv' || direction === 'recvonly',
                  direction === 'sendrecv' || direction === 'sendonly');

              if (rtpReceiver &&
                  (direction === 'sendrecv' || direction === 'sendonly')) {
                track = rtpReceiver.track;
                receiverList.push([track, rtpReceiver]);
                stream.addTrack(track);
              } else {
                // FIXME: actually the receiver should be created later.
                delete transceiver.rtpReceiver;
              }
            }
          });

          this.remoteDescription = {
            type: description.type,
            sdp: description.sdp
          };
          switch (description.type) {
            case 'offer':
              this._updateSignalingState('have-remote-offer');
              break;
            case 'answer':
              this._updateSignalingState('stable');
              break;
            default:
              throw new TypeError('unsupported type "' + description.type +
                  '"');
          }
          if (stream.getTracks().length) {
            self.remoteStreams.push(stream);
            window.setTimeout(function() {
              var event = new Event('addstream');
              event.stream = stream;
              self.dispatchEvent(event);
              if (self.onaddstream !== null) {
                window.setTimeout(function() {
                  self.onaddstream(event);
                }, 0);
              }

              receiverList.forEach(function(item) {
                var track = item[0];
                var receiver = item[1];
                var trackEvent = new Event('track');
                trackEvent.track = track;
                trackEvent.receiver = receiver;
                trackEvent.streams = [stream];
                self.dispatchEvent(event);
                if (self.ontrack !== null) {
                  window.setTimeout(function() {
                    self.ontrack(trackEvent);
                  }, 0);
                }
              });
            }, 0);
          }
          if (arguments.length > 1 && typeof arguments[1] === 'function') {
            window.setTimeout(arguments[1], 0);
          }
          return Promise.resolve();
        };

    window.RTCPeerConnection.prototype.close = function() {
      this.transceivers.forEach(function(transceiver) {
        /* not yet
        if (transceiver.iceGatherer) {
          transceiver.iceGatherer.close();
        }
        */
        if (transceiver.iceTransport) {
          transceiver.iceTransport.stop();
        }
        if (transceiver.dtlsTransport) {
          transceiver.dtlsTransport.stop();
        }
        if (transceiver.rtpSender) {
          transceiver.rtpSender.stop();
        }
        if (transceiver.rtpReceiver) {
          transceiver.rtpReceiver.stop();
        }
      });
      // FIXME: clean up tracks, local streams, remote streams, etc
      this._updateSignalingState('closed');
    };

    // Update the signaling state.
    window.RTCPeerConnection.prototype._updateSignalingState =
        function(newState) {
          this.signalingState = newState;
          var event = new Event('signalingstatechange');
          this.dispatchEvent(event);
          if (this.onsignalingstatechange !== null) {
            this.onsignalingstatechange(event);
          }
        };

    // Determine whether to fire the negotiationneeded event.
    window.RTCPeerConnection.prototype._maybeFireNegotiationNeeded =
        function() {
          // Fire away (for now).
          var event = new Event('negotiationneeded');
          this.dispatchEvent(event);
          if (this.onnegotiationneeded !== null) {
            this.onnegotiationneeded(event);
          }
        };

    // Update the connection state.
    window.RTCPeerConnection.prototype._updateConnectionState = function() {
      var self = this;
      var newState;
      var states = {
        'new': 0,
        closed: 0,
        connecting: 0,
        checking: 0,
        connected: 0,
        completed: 0,
        failed: 0
      };
      this.transceivers.forEach(function(transceiver) {
        states[transceiver.iceTransport.state]++;
        states[transceiver.dtlsTransport.state]++;
      });
      // ICETransport.completed and connected are the same for this purpose.
      states.connected += states.completed;

      newState = 'new';
      if (states.failed > 0) {
        newState = 'failed';
      } else if (states.connecting > 0 || states.checking > 0) {
        newState = 'connecting';
      } else if (states.disconnected > 0) {
        newState = 'disconnected';
      } else if (states.new > 0) {
        newState = 'new';
      } else if (states.connected > 0 || states.completed > 0) {
        newState = 'connected';
      }

      if (newState !== self.iceConnectionState) {
        self.iceConnectionState = newState;
        var event = new Event('iceconnectionstatechange');
        this.dispatchEvent(event);
        if (this.oniceconnectionstatechange !== null) {
          this.oniceconnectionstatechange(event);
        }
      }
    };

    window.RTCPeerConnection.prototype.createOffer = function() {
      var self = this;
      if (this._pendingOffer) {
        throw new Error('createOffer called while there is a pending offer.');
      }
      var offerOptions;
      if (arguments.length === 1 && typeof arguments[0] !== 'function') {
        offerOptions = arguments[0];
      } else if (arguments.length === 3) {
        offerOptions = arguments[2];
      }

      var tracks = [];
      var numAudioTracks = 0;
      var numVideoTracks = 0;
      // Default to sendrecv.
      if (this.localStreams.length) {
        numAudioTracks = this.localStreams[0].getAudioTracks().length;
        numVideoTracks = this.localStreams[0].getVideoTracks().length;
      }
      // Determine number of audio and video tracks we need to send/recv.
      if (offerOptions) {
        // Reject Chrome legacy constraints.
        if (offerOptions.mandatory || offerOptions.optional) {
          throw new TypeError(
              'Legacy mandatory/optional constraints not supported.');
        }
        if (offerOptions.offerToReceiveAudio !== undefined) {
          numAudioTracks = offerOptions.offerToReceiveAudio;
        }
        if (offerOptions.offerToReceiveVideo !== undefined) {
          numVideoTracks = offerOptions.offerToReceiveVideo;
        }
      }
      if (this.localStreams.length) {
        // Push local streams.
        this.localStreams[0].getTracks().forEach(function(track) {
          tracks.push({
            kind: track.kind,
            track: track,
            wantReceive: track.kind === 'audio' ?
                numAudioTracks > 0 : numVideoTracks > 0
          });
          if (track.kind === 'audio') {
            numAudioTracks--;
          } else if (track.kind === 'video') {
            numVideoTracks--;
          }
        });
      }
      // Create M-lines for recvonly streams.
      while (numAudioTracks > 0 || numVideoTracks > 0) {
        if (numAudioTracks > 0) {
          tracks.push({
            kind: 'audio',
            wantReceive: true
          });
          numAudioTracks--;
        }
        if (numVideoTracks > 0) {
          tracks.push({
            kind: 'video',
            wantReceive: true
          });
          numVideoTracks--;
        }
      }

      var sdp = SDPUtils.writeSessionBoilerplate();
      var transceivers = [];
      tracks.forEach(function(mline, sdpMLineIndex) {
        // For each track, create an ice gatherer, ice transport,
        // dtls transport, potentially rtpsender and rtpreceiver.
        var track = mline.track;
        var kind = mline.kind;
        var mid = SDPUtils.generateIdentifier();

        var transports = self.usingBundle && sdpMLineIndex > 0 ? {
          iceGatherer: transceivers[0].iceGatherer,
          iceTransport: transceivers[0].iceTransport,
          dtlsTransport: transceivers[0].dtlsTransport
        } : self._createIceAndDtlsTransports(mid, sdpMLineIndex);

        var localCapabilities = RTCRtpSender.getCapabilities(kind);
        var rtpSender;
        var rtpReceiver;

        // generate an ssrc now, to be used later in rtpSender.send
        var sendEncodingParameters = [{
          ssrc: (2 * sdpMLineIndex + 1) * 1001
        }];
        if (track) {
          rtpSender = new RTCRtpSender(track, transports.dtlsTransport);
        }

        if (mline.wantReceive) {
          rtpReceiver = new RTCRtpReceiver(transports.dtlsTransport, kind);
        }

        transceivers[sdpMLineIndex] = {
          iceGatherer: transports.iceGatherer,
          iceTransport: transports.iceTransport,
          dtlsTransport: transports.dtlsTransport,
          localCapabilities: localCapabilities,
          remoteCapabilities: null,
          rtpSender: rtpSender,
          rtpReceiver: rtpReceiver,
          kind: kind,
          mid: mid,
          sendEncodingParameters: sendEncodingParameters,
          recvEncodingParameters: null
        };
      });
      if (this.usingBundle) {
        sdp += 'a=group:BUNDLE ' + transceivers.map(function(t) {
          return t.mid;
        }).join(' ') + '\r\n';
      }
      tracks.forEach(function(mline, sdpMLineIndex) {
        var transceiver = transceivers[sdpMLineIndex];
        sdp += SDPUtils.writeMediaSection(transceiver,
            transceiver.localCapabilities, 'offer', self.localStreams[0]);
      });

      this._pendingOffer = transceivers;
      var desc = new RTCSessionDescription({
        type: 'offer',
        sdp: sdp
      });
      if (arguments.length && typeof arguments[0] === 'function') {
        window.setTimeout(arguments[0], 0, desc);
      }
      return Promise.resolve(desc);
    };

    window.RTCPeerConnection.prototype.createAnswer = function() {
      var self = this;

      var sdp = SDPUtils.writeSessionBoilerplate();
      if (this.usingBundle) {
        sdp += 'a=group:BUNDLE ' + this.transceivers.map(function(t) {
          return t.mid;
        }).join(' ') + '\r\n';
      }
      this.transceivers.forEach(function(transceiver) {
        if (transceiver.isDatachannel) {
          sdp += 'm=application 0 DTLS/SCTP 5000\r\n' +
              'c=IN IP4 0.0.0.0\r\n' +
              'a=mid:' + transceiver.mid + '\r\n';
          return;
        }
        // Calculate intersection of capabilities.
        var commonCapabilities = self._getCommonCapabilities(
            transceiver.localCapabilities,
            transceiver.remoteCapabilities);

        sdp += SDPUtils.writeMediaSection(transceiver, commonCapabilities,
            'answer', self.localStreams[0]);
      });

      var desc = new RTCSessionDescription({
        type: 'answer',
        sdp: sdp
      });
      if (arguments.length && typeof arguments[0] === 'function') {
        window.setTimeout(arguments[0], 0, desc);
      }
      return Promise.resolve(desc);
    };

    window.RTCPeerConnection.prototype.addIceCandidate = function(candidate) {
      if (candidate === null) {
        this.transceivers.forEach(function(transceiver) {
          transceiver.iceTransport.addRemoteCandidate({});
        });
      } else {
        var mLineIndex = candidate.sdpMLineIndex;
        if (candidate.sdpMid) {
          for (var i = 0; i < this.transceivers.length; i++) {
            if (this.transceivers[i].mid === candidate.sdpMid) {
              mLineIndex = i;
              break;
            }
          }
        }
        var transceiver = this.transceivers[mLineIndex];
        if (transceiver) {
          var cand = Object.keys(candidate.candidate).length > 0 ?
              SDPUtils.parseCandidate(candidate.candidate) : {};
          // Ignore Chrome's invalid candidates since Edge does not like them.
          if (cand.protocol === 'tcp' && (cand.port === 0 || cand.port === 9)) {
            return;
          }
          // Ignore RTCP candidates, we assume RTCP-MUX.
          if (cand.component !== '1') {
            return;
          }
          // A dirty hack to make samples work.
          if (cand.type === 'endOfCandidates') {
            cand = {};
          }
          transceiver.iceTransport.addRemoteCandidate(cand);

          // update the remoteDescription.
          var sections = SDPUtils.splitSections(this.remoteDescription.sdp);
          sections[mLineIndex + 1] += (cand.type ? candidate.candidate.trim()
              : 'a=end-of-candidates') + '\r\n';
          this.remoteDescription.sdp = sections.join('');
        }
      }
      if (arguments.length > 1 && typeof arguments[1] === 'function') {
        window.setTimeout(arguments[1], 0);
      }
      return Promise.resolve();
    };

    window.RTCPeerConnection.prototype.getStats = function() {
      var promises = [];
      this.transceivers.forEach(function(transceiver) {
        ['rtpSender', 'rtpReceiver', 'iceGatherer', 'iceTransport',
            'dtlsTransport'].forEach(function(method) {
              if (transceiver[method]) {
                promises.push(transceiver[method].getStats());
              }
            });
      });
      var cb = arguments.length > 1 && typeof arguments[1] === 'function' &&
          arguments[1];
      return new Promise(function(resolve) {
        // shim getStats with maplike support
        var results = new Map();
        Promise.all(promises).then(function(res) {
          res.forEach(function(result) {
            Object.keys(result).forEach(function(id) {
              results.set(id, result[id]);
              results[id] = result[id];
            });
          });
          if (cb) {
            window.setTimeout(cb, 0, results);
          }
          resolve(results);
        });
      });
    };
  }
};

// Expose public methods.
module.exports = {
  shimPeerConnection: edgeShim.shimPeerConnection,
  shimGetUserMedia: requirecopy('./getusermedia')
};

},{"../utils":10,"./getusermedia":6,"sdp":1}],6:[function(requirecopy,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

// Expose public methods.
module.exports = function() {
  var shimError_ = function(e) {
    return {
      name: {PermissionDeniedError: 'NotAllowedError'}[e.name] || e.name,
      message: e.message,
      constraint: e.constraint,
      toString: function() {
        return this.name;
      }
    };
  };

  // getUserMedia error shim.
  var origGetUserMedia = navigator.mediaDevices.getUserMedia.
      bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = function(c) {
    return origGetUserMedia(c).catch(function(e) {
      return Promise.reject(shimError_(e));
    });
  };
};

},{}],7:[function(requirecopy,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

var browserDetails = requirecopy('../utils').browserDetails;

var firefoxShim = {
  shimOnTrack: function() {
    if (typeof window === 'object' && window.RTCPeerConnection && !('ontrack' in
        window.RTCPeerConnection.prototype)) {
      Object.defineProperty(window.RTCPeerConnection.prototype, 'ontrack', {
        get: function() {
          return this._ontrack;
        },
        set: function(f) {
          if (this._ontrack) {
            this.removeEventListener('track', this._ontrack);
            this.removeEventListener('addstream', this._ontrackpoly);
          }
          this.addEventListener('track', this._ontrack = f);
          this.addEventListener('addstream', this._ontrackpoly = function(e) {
            e.stream.getTracks().forEach(function(track) {
              var event = new Event('track');
              event.track = track;
              event.receiver = {track: track};
              event.streams = [e.stream];
              this.dispatchEvent(event);
            }.bind(this));
          }.bind(this));
        }
      });
    }
  },

  shimSourceObject: function() {
    // Firefox has supported mozSrcObject since FF22, unprefixed in 42.
    if (typeof window === 'object') {
      if (window.HTMLMediaElement &&
        !('srcObject' in window.HTMLMediaElement.prototype)) {
        // Shim the srcObject property, once, when HTMLMediaElement is found.
        Object.defineProperty(window.HTMLMediaElement.prototype, 'srcObject', {
          get: function() {
            return this.mozSrcObject;
          },
          set: function(stream) {
            this.mozSrcObject = stream;
          }
        });
      }
    }
  },

  shimPeerConnection: function() {
    if (typeof window !== 'object' || !(window.RTCPeerConnection ||
        window.mozRTCPeerConnection)) {
      return; // probably media.peerconnection.enabled=false in about:config
    }
    // The RTCPeerConnection object.
    if (!window.RTCPeerConnection) {
      window.RTCPeerConnection = function(pcConfig, pcConstraints) {
        if (browserDetails.version < 38) {
          // .urls is not supported in FF < 38.
          // create RTCIceServers with a single url.
          if (pcConfig && pcConfig.iceServers) {
            var newIceServers = [];
            for (var i = 0; i < pcConfig.iceServers.length; i++) {
              var server = pcConfig.iceServers[i];
              if (server.hasOwnProperty('urls')) {
                for (var j = 0; j < server.urls.length; j++) {
                  var newServer = {
                    url: server.urls[j]
                  };
                  if (server.urls[j].indexOf('turn') === 0) {
                    newServer.username = server.username;
                    newServer.credential = server.credential;
                  }
                  newIceServers.push(newServer);
                }
              } else {
                newIceServers.push(pcConfig.iceServers[i]);
              }
            }
            pcConfig.iceServers = newIceServers;
          }
        }
        return new mozRTCPeerConnection(pcConfig, pcConstraints);
      };
      window.RTCPeerConnection.prototype = mozRTCPeerConnection.prototype;

      // wrap static methods. Currently just generateCertificate.
      if (mozRTCPeerConnection.generateCertificate) {
        Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
          get: function() {
            return mozRTCPeerConnection.generateCertificate;
          }
        });
      }

      window.RTCSessionDescription = mozRTCSessionDescription;
      window.RTCIceCandidate = mozRTCIceCandidate;
    }

    // shim away need for obsolete RTCIceCandidate/RTCSessionDescription.
    ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
        .forEach(function(method) {
          var nativeMethod = RTCPeerConnection.prototype[method];
          RTCPeerConnection.prototype[method] = function() {
            arguments[0] = new ((method === 'addIceCandidate') ?
                RTCIceCandidate : RTCSessionDescription)(arguments[0]);
            return nativeMethod.apply(this, arguments);
          };
        });

    // support for addIceCandidate(null)
    var nativeAddIceCandidate =
        RTCPeerConnection.prototype.addIceCandidate;
    RTCPeerConnection.prototype.addIceCandidate = function() {
      return arguments[0] === null ? Promise.resolve()
          : nativeAddIceCandidate.apply(this, arguments);
    };

    // shim getStats with maplike support
    var makeMapStats = function(stats) {
      var map = new Map();
      Object.keys(stats).forEach(function(key) {
        map.set(key, stats[key]);
        map[key] = stats[key];
      });
      return map;
    };

    var nativeGetStats = RTCPeerConnection.prototype.getStats;
    RTCPeerConnection.prototype.getStats = function(selector, onSucc, onErr) {
      return nativeGetStats.apply(this, [selector || null])
        .then(function(stats) {
          return makeMapStats(stats);
        })
        .then(onSucc, onErr);
    };
  }
};

// Expose public methods.
module.exports = {
  shimOnTrack: firefoxShim.shimOnTrack,
  shimSourceObject: firefoxShim.shimSourceObject,
  shimPeerConnection: firefoxShim.shimPeerConnection,
  shimGetUserMedia: requirecopy('./getusermedia')
};

},{"../utils":10,"./getusermedia":8}],8:[function(requirecopy,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

var logging = requirecopy('../utils').log;
var browserDetails = requirecopy('../utils').browserDetails;

// Expose public methods.
module.exports = function() {
  var shimError_ = function(e) {
    return {
      name: {
        SecurityError: 'NotAllowedError',
        PermissionDeniedError: 'NotAllowedError'
      }[e.name] || e.name,
      message: {
        'The operation is insecure.': 'The request is not allowed by the ' +
        'user agent or the platform in the current context.'
      }[e.message] || e.message,
      constraint: e.constraint,
      toString: function() {
        return this.name + (this.message && ': ') + this.message;
      }
    };
  };

  // getUserMedia constraints shim.
  var getUserMedia_ = function(constraints, onSuccess, onError) {
    var constraintsToFF37_ = function(c) {
      if (typeof c !== 'object' || c.require) {
        return c;
      }
      var require = [];
      Object.keys(c).forEach(function(key) {
        if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
          return;
        }
        var r = c[key] = (typeof c[key] === 'object') ?
            c[key] : {ideal: c[key]};
        if (r.min !== undefined ||
            r.max !== undefined || r.exact !== undefined) {
          require.push(key);
        }
        if (r.exact !== undefined) {
          if (typeof r.exact === 'number') {
            r. min = r.max = r.exact;
          } else {
            c[key] = r.exact;
          }
          delete r.exact;
        }
        if (r.ideal !== undefined) {
          c.advanced = c.advanced || [];
          var oc = {};
          if (typeof r.ideal === 'number') {
            oc[key] = {min: r.ideal, max: r.ideal};
          } else {
            oc[key] = r.ideal;
          }
          c.advanced.push(oc);
          delete r.ideal;
          if (!Object.keys(r).length) {
            delete c[key];
          }
        }
      });
      if (require.length) {
        c.require = require;
      }
      return c;
    };
    constraints = JSON.parse(JSON.stringify(constraints));
    if (browserDetails.version < 38) {
      logging('spec: ' + JSON.stringify(constraints));
      if (constraints.audio) {
        constraints.audio = constraintsToFF37_(constraints.audio);
      }
      if (constraints.video) {
        constraints.video = constraintsToFF37_(constraints.video);
      }
      logging('ff37: ' + JSON.stringify(constraints));
    }
    return navigator.mozGetUserMedia(constraints, onSuccess, function(e) {
      onError(shimError_(e));
    });
  };

  // Returns the result of getUserMedia as a Promise.
  var getUserMediaPromise_ = function(constraints) {
    return new Promise(function(resolve, reject) {
      getUserMedia_(constraints, resolve, reject);
    });
  };

  // Shim for mediaDevices on older versions.
  if (!navigator.mediaDevices) {
    navigator.mediaDevices = {getUserMedia: getUserMediaPromise_,
      addEventListener: function() { },
      removeEventListener: function() { }
    };
  }
  navigator.mediaDevices.enumerateDevices =
      navigator.mediaDevices.enumerateDevices || function() {
        return new Promise(function(resolve) {
          var infos = [
            {kind: 'audioinput', deviceId: 'default', label: '', groupId: ''},
            {kind: 'videoinput', deviceId: 'default', label: '', groupId: ''}
          ];
          resolve(infos);
        });
      };

  if (browserDetails.version < 41) {
    // Work around http://bugzil.la/1169665
    var orgEnumerateDevices =
        navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
    navigator.mediaDevices.enumerateDevices = function() {
      return orgEnumerateDevices().then(undefined, function(e) {
        if (e.name === 'NotFoundError') {
          return [];
        }
        throw e;
      });
    };
  }
  if (browserDetails.version < 49) {
    var origGetUserMedia = navigator.mediaDevices.getUserMedia.
        bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function(c) {
      return origGetUserMedia(c).catch(function(e) {
        return Promise.reject(shimError_(e));
      });
    };
  }
  navigator.getUserMedia = function(constraints, onSuccess, onError) {
    if (browserDetails.version < 44) {
      return getUserMedia_(constraints, onSuccess, onError);
    }
    // Replace Firefox 44+'s deprecation warning with unprefixed version.
    console.warn('navigator.getUserMedia has been replaced by ' +
                 'navigator.mediaDevices.getUserMedia');
    navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
  };
};

},{"../utils":10}],9:[function(requirecopy,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
'use strict';
var safariShim = {
  // TODO: DrAlex, should be here, double check against LayoutTests
  // shimOnTrack: function() { },

  // TODO: once the back-end for the mac port is done, add.
  // TODO: check for webkitGTK+
  // shimPeerConnection: function() { },

  shimGetUserMedia: function() {
    navigator.getUserMedia = navigator.webkitGetUserMedia;
  }
};

// Expose public methods.
module.exports = {
  shimGetUserMedia: safariShim.shimGetUserMedia
  // TODO
  // shimOnTrack: safariShim.shimOnTrack,
  // shimPeerConnection: safariShim.shimPeerConnection
};

},{}],10:[function(requirecopy,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

var logDisabled_ = true;

// Utility methods.
var utils = {
  disableLog: function(bool) {
    if (typeof bool !== 'boolean') {
      return new Error('Argument type: ' + typeof bool +
          '. Please use a boolean.');
    }
    logDisabled_ = bool;
    return (bool) ? 'adapter.js logging disabled' :
        'adapter.js logging enabled';
  },

  log: function() {
    if (typeof window === 'object') {
      if (logDisabled_) {
        return;
      }
      if (typeof console !== 'undefined' && typeof console.log === 'function') {
        console.log.apply(console, arguments);
      }
    }
  },

  /**
   * Extract browser version out of the provided user agent string.
   *
   * @param {!string} uastring userAgent string.
   * @param {!string} expr Regular expression used as match criteria.
   * @param {!number} pos position in the version string to be returned.
   * @return {!number} browser version.
   */
  extractVersion: function(uastring, expr, pos) {
    var match = uastring.match(expr);
    return match && match.length >= pos && parseInt(match[pos], 10);
  },

  /**
   * Browser detector.
   *
   * @return {object} result containing browser and version
   *     properties.
   */
  detectBrowser: function() {
    // Returned result object.
    var result = {};
    result.browser = null;
    result.version = null;

    // Fail early if it's not a browser
    if (typeof window === 'undefined' || !window.navigator) {
      result.browser = 'Not a browser.';
      return result;
    }

    // Firefox.
    if (navigator.mozGetUserMedia) {
      result.browser = 'firefox';
      result.version = this.extractVersion(navigator.userAgent,
          /Firefox\/([0-9]+)\./, 1);

    // all webkit-based browsers
    } else if (navigator.webkitGetUserMedia) {
      // Chrome, Chromium, Webview, Opera, all use the chrome shim for now
      if (window.webkitRTCPeerConnection) {
        result.browser = 'chrome';
        result.version = this.extractVersion(navigator.userAgent,
          /Chrom(e|ium)\/([0-9]+)\./, 2);

      // Safari or unknown webkit-based
      // for the time being Safari has support for MediaStreams but not webRTC
      } else {
        // Safari UA substrings of interest for reference:
        // - webkit version:           AppleWebKit/602.1.25 (also used in Op,Cr)
        // - safari UI version:        Version/9.0.3 (unique to Safari)
        // - safari UI webkit version: Safari/601.4.4 (also used in Op,Cr)
        //
        // if the webkit version and safari UI webkit versions are equals,
        // ... this is a stable version.
        //
        // only the internal webkit version is important today to know if
        // media streams are supported
        //
        if (navigator.userAgent.match(/Version\/(\d+).(\d+)/)) {
          result.browser = 'safari';
          result.version = this.extractVersion(navigator.userAgent,
            /AppleWebKit\/([0-9]+)\./, 1);

        // unknown webkit-based browser
        } else {
          result.browser = 'Unsupported webkit-based browser ' +
              'with GUM support but no WebRTC support.';
          return result;
        }
      }

    // Edge.
    } else if (navigator.mediaDevices &&
        navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) {
      result.browser = 'edge';
      result.version = this.extractVersion(navigator.userAgent,
          /Edge\/(\d+).(\d+)$/, 2);

    // Default fallthrough: not supported.
    } else {
      result.browser = 'Not a supported browser.';
      return result;
    }

    return result;
  }
};

// Export.
module.exports = {
  log: utils.log,
  disableLog: utils.disableLog,
  browserDetails: utils.detectBrowser(),
  extractVersion: utils.extractVersion
};

},{}]},{},[2])(2)
});
/* jshint ignore:end */

  // END OF INJECTION OF GOOGLE'S ADAPTER.JS CONTENT
  ///////////////////////////////////////////////////////////////////

  AdapterJS.parseWebrtcDetectedBrowser();

  ///////////////////////////////////////////////////////////////////
  // EXTENSION FOR CHROME, FIREFOX AND EDGE
  // Includes legacy functions
  // -- createIceServer
  // -- createIceServers
  // -- MediaStreamTrack.getSources
  //
  // and additional shims
  // -- attachMediaStream
  // -- reattachMediaStream
  // -- requestUserMedia
  // -- a call to AdapterJS.maybeThroughWebRTCReady (notifies WebRTC is ready)

  // Add support for legacy functions createIceServer and createIceServers
  if ( navigator.mozGetUserMedia ) {
    // Shim for MediaStreamTrack.getSources.
    MediaStreamTrack.getSources = function(successCb) {
      setTimeout(function() {
        var infos = [
          { kind: 'audio', id: 'default', label:'', facing:'' },
          { kind: 'video', id: 'default', label:'', facing:'' }
        ];
        successCb(infos);
      }, 0);
    };

    // Attach a media stream to an element.
    attachMediaStream = function(element, stream) {
      element.srcObject = stream;
      return element;
    };

    reattachMediaStream = function(to, from) {
      to.srcObject = from.srcObject;
      return to;
    };

    createIceServer = function (url, username, password) {
      console.warn('createIceServer is deprecated. It should be replaced with an application level implementation.');
      // Note: Google's import of AJS will auto-reverse to 'url': '...' for FF < 38

      var iceServer = null;
      var urlParts = url.split(':');
      if (urlParts[0].indexOf('stun') === 0) {
        iceServer = { urls : [url] };
      } else if (urlParts[0].indexOf('turn') === 0) {
        if (webrtcDetectedVersion < 27) {
          var turnUrlParts = url.split('?');
          if (turnUrlParts.length === 1 ||
            turnUrlParts[1].indexOf('transport=udp') === 0) {
            iceServer = {
              urls : [turnUrlParts[0]],
              credential : password,
              username : username
            };
          }
        } else {
          iceServer = {
            urls : [url],
            credential : password,
            username : username
          };
        }
      }
      return iceServer;
    };

    createIceServers = function (urls, username, password) {
      console.warn('createIceServers is deprecated. It should be replaced with an application level implementation.');

      var iceServers = [];
      for (i = 0; i < urls.length; i++) {
        var iceServer = createIceServer(urls[i], username, password);
        if (iceServer !== null) {
          iceServers.push(iceServer);
        }
      }
      return iceServers;
    };
  } else if ( navigator.webkitGetUserMedia ) {
    // Attach a media stream to an element.
    attachMediaStream = function(element, stream) {
      if (webrtcDetectedVersion >= 43) {
        element.srcObject = stream;
      } else if (typeof element.src !== 'undefined') {
        element.src = URL.createObjectURL(stream);
      } else {
        console.error('Error attaching stream to element.');
        // logging('Error attaching stream to element.');
      }
      return element;
    };

    reattachMediaStream = function(to, from) {
      if (webrtcDetectedVersion >= 43) {
        to.srcObject = from.srcObject;
      } else {
        to.src = from.src;
      }
      return to;
    };

    createIceServer = function (url, username, password) {
      console.warn('createIceServer is deprecated. It should be replaced with an application level implementation.');

      var iceServer = null;
      var urlParts = url.split(':');
      if (urlParts[0].indexOf('stun') === 0) {
        iceServer = { 'url' : url };
      } else if (urlParts[0].indexOf('turn') === 0) {
        iceServer = {
          'url' : url,
          'credential' : password,
          'username' : username
        };
      }
      return iceServer;
    };

    createIceServers = function (urls, username, password) {
      console.warn('createIceServers is deprecated. It should be replaced with an application level implementation.');

      var iceServers = [];
      if (webrtcDetectedVersion >= 34) {
        iceServers = {
          'urls' : urls,
          'credential' : password,
          'username' : username
        };
      } else {
        for (i = 0; i < urls.length; i++) {
          var iceServer = createIceServer(urls[i], username, password);
          if (iceServer !== null) {
            iceServers.push(iceServer);
          }
        }
      }
      return iceServers;
    };
  } else if (navigator.mediaDevices && navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) {
    // Attach a media stream to an element.
    attachMediaStream = function(element, stream) {
      element.srcObject = stream;
      return element;
    };

    reattachMediaStream = function(to, from) {
      to.srcObject = from.srcObject;
      return to;
    };
  }

  // Need to override attachMediaStream and reattachMediaStream
  // to support the plugin's logic
  attachMediaStream_base = attachMediaStream;

  if (webrtcDetectedBrowser === 'opera') {
    attachMediaStream_base = function (element, stream) {
      if (webrtcDetectedVersion > 38) {
        element.srcObject = stream;
      } else if (typeof element.src !== 'undefined') {
        element.src = URL.createObjectURL(stream);
      }
      // Else it doesn't work
    };
  }

  attachMediaStream = function (element, stream) {
    if ((webrtcDetectedBrowser === 'chrome' ||
         webrtcDetectedBrowser === 'opera') &&
        !stream) {
      // Chrome does not support "src = null"
      element.src = '';
    } else {
      attachMediaStream_base(element, stream);
    }
    return element;
  };
  reattachMediaStream_base = reattachMediaStream;
  reattachMediaStream = function (to, from) {
    reattachMediaStream_base(to, from);
    return to;
  };

  // Propagate attachMediaStream and gUM in window and AdapterJS
  window.attachMediaStream      = attachMediaStream;
  window.reattachMediaStream    = reattachMediaStream;
  window.getUserMedia           = function(constraints, onSuccess, onFailure) {
    navigator.getUserMedia(constraints, onSuccess, onFailure);
  };
  AdapterJS.attachMediaStream   = attachMediaStream;
  AdapterJS.reattachMediaStream = reattachMediaStream;
  AdapterJS.getUserMedia        = getUserMedia;

  // Removed Google defined promises when promise is not defined
  if (typeof Promise === 'undefined') {
    requestUserMedia = null;
  }

  AdapterJS.maybeThroughWebRTCReady();

  // END OF EXTENSION OF CHROME, FIREFOX AND EDGE
  ///////////////////////////////////////////////////////////////////

} else { // TRY TO USE PLUGIN

  ///////////////////////////////////////////////////////////////////
  // WEBRTC PLUGIN SHIM
  // Will automatically check if the plugin is available and inject it
  // into the DOM if it is.
  // When the plugin is not available, will prompt a banner to suggest installing it
  // Use AdapterJS.options.hidePluginInstallPrompt to prevent this banner from popping
  //
  // Shims the follwing:
  // -- getUserMedia
  // -- MediaStreamTrack
  // -- MediaStreamTrack.getSources
  // -- RTCPeerConnection
  // -- RTCSessionDescription
  // -- RTCIceCandidate
  // -- createIceServer
  // -- createIceServers
  // -- attachMediaStream
  // -- reattachMediaStream
  // -- webrtcDetectedBrowser
  // -- webrtcDetectedVersion

  // IE 9 is not offering an implementation of console.log until you open a console
  if (typeof console !== 'object' || typeof console.log !== 'function') {
    /* jshint -W020 */
    console = {} || console;
    // Implemented based on console specs from MDN
    // You may override these functions
    console.log = function (arg) {};
    console.info = function (arg) {};
    console.error = function (arg) {};
    console.dir = function (arg) {};
    console.exception = function (arg) {};
    console.trace = function (arg) {};
    console.warn = function (arg) {};
    console.count = function (arg) {};
    console.debug = function (arg) {};
    console.count = function (arg) {};
    console.time = function (arg) {};
    console.timeEnd = function (arg) {};
    console.group = function (arg) {};
    console.groupCollapsed = function (arg) {};
    console.groupEnd = function (arg) {};
    /* jshint +W020 */
  }
  AdapterJS.parseWebrtcDetectedBrowser();
  isIE = webrtcDetectedBrowser === 'IE';

  /* jshint -W035 */
  AdapterJS.WebRTCPlugin.WaitForPluginReady = function() {
    while (AdapterJS.WebRTCPlugin.pluginState !== AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY) {
      /* empty because it needs to prevent the function from running. */
    }
  };
  /* jshint +W035 */

  AdapterJS.WebRTCPlugin.callWhenPluginReady = function (callback) {
    if (AdapterJS.WebRTCPlugin.pluginState === AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY) {
      // Call immediately if possible
      // Once the plugin is set, the code will always take this path
      callback();
    } else {
      // otherwise start a 100ms interval
      var checkPluginReadyState = setInterval(function () {
        if (AdapterJS.WebRTCPlugin.pluginState === AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY) {
          clearInterval(checkPluginReadyState);
          callback();
        }
      }, 100);
    }
  };

  AdapterJS.WebRTCPlugin.setLogLevel = function(logLevel) {
    AdapterJS.WebRTCPlugin.callWhenPluginReady(function() {
      AdapterJS.WebRTCPlugin.plugin.setLogLevel(logLevel);
    });
  };

  AdapterJS.WebRTCPlugin.injectPlugin = function () {
    // only inject once the page is ready
    if (document.readyState !== 'complete') {
      return;
    }

    // Prevent multiple injections
    if (AdapterJS.WebRTCPlugin.pluginState !== AdapterJS.WebRTCPlugin.PLUGIN_STATES.INITIALIZING) {
      return;
    }

    AdapterJS.WebRTCPlugin.pluginState = AdapterJS.WebRTCPlugin.PLUGIN_STATES.INJECTING;

    if (webrtcDetectedBrowser === 'IE' && webrtcDetectedVersion <= 10) {
      var frag = document.createDocumentFragment();
      AdapterJS.WebRTCPlugin.plugin = document.createElement('div');
      AdapterJS.WebRTCPlugin.plugin.innerHTML = '<object id="' +
        AdapterJS.WebRTCPlugin.pluginInfo.pluginId + '" type="' +
        AdapterJS.WebRTCPlugin.pluginInfo.type + '" ' + 'width="1" height="1">' +
        '<param name="pluginId" value="' +
        AdapterJS.WebRTCPlugin.pluginInfo.pluginId + '" /> ' +
        '<param name="windowless" value="false" /> ' +
        '<param name="pageId" value="' + AdapterJS.WebRTCPlugin.pageId + '" /> ' +
        '<param name="onload" value="' + AdapterJS.WebRTCPlugin.pluginInfo.onload + '" />' +
        '<param name="tag" value="' + AdapterJS.WebRTCPlugin.TAGS.NONE + '" />' +
        // uncomment to be able to use virtual cams
        (AdapterJS.options.getAllCams ? '<param name="forceGetAllCams" value="True" />':'') +

        '</object>';
      while (AdapterJS.WebRTCPlugin.plugin.firstChild) {
        frag.appendChild(AdapterJS.WebRTCPlugin.plugin.firstChild);
      }
      document.body.appendChild(frag);

      // Need to re-fetch the plugin
      AdapterJS.WebRTCPlugin.plugin =
        document.getElementById(AdapterJS.WebRTCPlugin.pluginInfo.pluginId);
    } else {
      // Load Plugin
      AdapterJS.WebRTCPlugin.plugin = document.createElement('object');
      AdapterJS.WebRTCPlugin.plugin.id =
        AdapterJS.WebRTCPlugin.pluginInfo.pluginId;
      // IE will only start the plugin if it's ACTUALLY visible
      if (isIE) {
        AdapterJS.WebRTCPlugin.plugin.width = '1px';
        AdapterJS.WebRTCPlugin.plugin.height = '1px';
      } else { // The size of the plugin on Safari should be 0x0px
              // so that the autorisation prompt is at the top
        AdapterJS.WebRTCPlugin.plugin.width = '0px';
        AdapterJS.WebRTCPlugin.plugin.height = '0px';
      }
      AdapterJS.WebRTCPlugin.plugin.type = AdapterJS.WebRTCPlugin.pluginInfo.type;
      AdapterJS.WebRTCPlugin.plugin.innerHTML = '<param name="onload" value="' +
        AdapterJS.WebRTCPlugin.pluginInfo.onload + '">' +
        '<param name="pluginId" value="' +
        AdapterJS.WebRTCPlugin.pluginInfo.pluginId + '">' +
        '<param name="windowless" value="false" /> ' +
        (AdapterJS.options.getAllCams ? '<param name="forceGetAllCams" value="True" />':'') +
        '<param name="pageId" value="' + AdapterJS.WebRTCPlugin.pageId + '">' +
        '<param name="tag" value="' + AdapterJS.WebRTCPlugin.TAGS.NONE + '" />';
      document.body.appendChild(AdapterJS.WebRTCPlugin.plugin);
    }


    AdapterJS.WebRTCPlugin.pluginState = AdapterJS.WebRTCPlugin.PLUGIN_STATES.INJECTED;
  };

  AdapterJS.WebRTCPlugin.isPluginInstalled =
    function (comName, plugName, plugType, installedCb, notInstalledCb) {
    if (!isIE) {
      var pluginArray = navigator.mimeTypes;
      for (var i = 0; i < pluginArray.length; i++) {
        if (pluginArray[i].type.indexOf(plugType) >= 0) {
          installedCb();
          return;
        }
      }
      notInstalledCb();
    } else {
      try {
        var axo = new ActiveXObject(comName + '.' + plugName);
      } catch (e) {
        notInstalledCb();
        return;
      }
      installedCb();
    }
  };

  AdapterJS.WebRTCPlugin.defineWebRTCInterface = function () {
    if (AdapterJS.WebRTCPlugin.pluginState ===
        AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY) {
      console.error('AdapterJS - WebRTC interface has already been defined');
      return;
    }

    AdapterJS.WebRTCPlugin.pluginState = AdapterJS.WebRTCPlugin.PLUGIN_STATES.INITIALIZING;

    AdapterJS.isDefined = function (variable) {
      return variable !== null && variable !== undefined;
    };

    createIceServer = function (url, username, password) {
      var iceServer = null;
      var urlParts = url.split(':');
      if (urlParts[0].indexOf('stun') === 0) {
        iceServer = {
          'url' : url,
          'hasCredentials' : false
        };
      } else if (urlParts[0].indexOf('turn') === 0) {
        iceServer = {
          'url' : url,
          'hasCredentials' : true,
          'credential' : password,
          'username' : username
        };
      }
      return iceServer;
    };

    createIceServers = function (urls, username, password) {
      var iceServers = [];
      for (var i = 0; i < urls.length; ++i) {
        iceServers.push(createIceServer(urls[i], username, password));
      }
      return iceServers;
    };

    RTCSessionDescription = function (info) {
      AdapterJS.WebRTCPlugin.WaitForPluginReady();
      return AdapterJS.WebRTCPlugin.plugin.
        ConstructSessionDescription(info.type, info.sdp);
    };

    RTCPeerConnection = function (servers, constraints) {
      // Validate server argumenr
      if (!(servers === undefined ||
            servers === null ||
            Array.isArray(servers.iceServers))) {
        throw new Error('Failed to construct \'RTCPeerConnection\': Malformed RTCConfiguration');
      }

      // Validate constraints argument
      if (typeof constraints !== 'undefined' && constraints !== null) {
        var invalidConstraits = false;
        invalidConstraits |= typeof constraints !== 'object';
        invalidConstraits |= constraints.hasOwnProperty('mandatory') &&
                              constraints.mandatory !== undefined &&
                              constraints.mandatory !== null &&
                              constraints.mandatory.constructor !== Object;
        invalidConstraits |= constraints.hasOwnProperty('optional') &&
                              constraints.optional !== undefined &&
                              constraints.optional !== null &&
                              !Array.isArray(constraints.optional);
        if (invalidConstraits) {
          throw new Error('Failed to construct \'RTCPeerConnection\': Malformed constraints object');
        }
      }

      // Call relevant PeerConnection constructor according to plugin version
      AdapterJS.WebRTCPlugin.WaitForPluginReady();

      // RTCPeerConnection prototype from the old spec
      var iceServers = null;
      if (servers && Array.isArray(servers.iceServers)) {
        iceServers = servers.iceServers;
        for (var i = 0; i < iceServers.length; i++) {
          // Legacy plugin versions compatibility
          if (iceServers[i].urls && !iceServers[i].url) {
            iceServers[i].url = iceServers[i].urls;
          }
          iceServers[i].hasCredentials = AdapterJS.
            isDefined(iceServers[i].username) &&
            AdapterJS.isDefined(iceServers[i].credential);
        }
      }

      if (AdapterJS.WebRTCPlugin.plugin.PEER_CONNECTION_VERSION &&
          AdapterJS.WebRTCPlugin.plugin.PEER_CONNECTION_VERSION > 1) {
        // RTCPeerConnection prototype from the new spec
        if (iceServers) {
          servers.iceServers = iceServers;
        }
        return AdapterJS.WebRTCPlugin.plugin.PeerConnection(servers);
      } else {
        var mandatory = (constraints && constraints.mandatory) ?
          constraints.mandatory : null;
        var optional = (constraints && constraints.optional) ?
          constraints.optional : null;
        return AdapterJS.WebRTCPlugin.plugin.
          PeerConnection(AdapterJS.WebRTCPlugin.pageId,
          iceServers, mandatory, optional);
      }
    };

    MediaStreamTrack = function(){};
    MediaStreamTrack.getSources = function (callback) {
      AdapterJS.WebRTCPlugin.callWhenPluginReady(function() {
        AdapterJS.WebRTCPlugin.plugin.GetSources(callback);
      });
    };

    // getUserMedia constraints shim.
    // Copied from Chrome
    var constraintsToPlugin = function(c) {
      if (typeof c !== 'object' || c.mandatory || c.optional) {
        return c;
      }
      var cc = {};
      Object.keys(c).forEach(function(key) {
        if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
          return;
        }
        var r = (typeof c[key] === 'object') ? c[key] : {ideal: c[key]};
        if (r.exact !== undefined && typeof r.exact === 'number') {
          r.min = r.max = r.exact;
        }
        var oldname = function(prefix, name) {
          if (prefix) {
            return prefix + name.charAt(0).toUpperCase() + name.slice(1);
          }
          return (name === 'deviceId') ? 'sourceId' : name;
        };
        if (r.ideal !== undefined) {
          cc.optional = cc.optional || [];
          var oc = {};
          if (typeof r.ideal === 'number') {
            oc[oldname('min', key)] = r.ideal;
            cc.optional.push(oc);
            oc = {};
            oc[oldname('max', key)] = r.ideal;
            cc.optional.push(oc);
          } else {
            oc[oldname('', key)] = r.ideal;
            cc.optional.push(oc);
          }
        }
        if (r.exact !== undefined && typeof r.exact !== 'number') {
          cc.mandatory = cc.mandatory || {};
          cc.mandatory[oldname('', key)] = r.exact;
        } else {
          ['min', 'max'].forEach(function(mix) {
            if (r[mix] !== undefined) {
              cc.mandatory = cc.mandatory || {};
              cc.mandatory[oldname(mix, key)] = r[mix];
            }
          });
        }
      });
      if (c.advanced) {
        cc.optional = (cc.optional || []).concat(c.advanced);
      }
      return cc;
    };

    getUserMedia = function (constraints, successCallback, failureCallback) {
      var cc = {};
      cc.audio = constraints.audio ?
        constraintsToPlugin(constraints.audio) : false;
      cc.video = constraints.video ?
        constraintsToPlugin(constraints.video) : false;

      AdapterJS.WebRTCPlugin.callWhenPluginReady(function() {
        AdapterJS.WebRTCPlugin.plugin.
          getUserMedia(cc, successCallback, failureCallback);
      });
    };
    window.navigator.getUserMedia = getUserMedia;

    // Defined mediaDevices when promises are available
    if ( !navigator.mediaDevices &&
      typeof Promise !== 'undefined') {
      requestUserMedia = function(constraints) {
        return new Promise(function(resolve, reject) {
          getUserMedia(constraints, resolve, reject);
        });
      };
      navigator.mediaDevices = {getUserMedia: requestUserMedia,
                                enumerateDevices: function() {
        return new Promise(function(resolve) {
          var kinds = {audio: 'audioinput', video: 'videoinput'};
          return MediaStreamTrack.getSources(function(devices) {
            resolve(devices.map(function(device) {
              return {label: device.label,
                      kind: kinds[device.kind],
                      id: device.id,
                      deviceId: device.id,
                      groupId: ''};
            }));
          });
        });
      }};
    }

    attachMediaStream = function (element, stream) {
      if (!element || !element.parentNode) {
        return;
      }

      var streamId;
      if (stream === null) {
        streamId = '';
      } else {
        if (typeof stream.enableSoundTracks !== 'undefined') {
          stream.enableSoundTracks(true);
        }
        streamId = stream.id;
      }

      var elementId = element.id.length === 0 ? Math.random().toString(36).slice(2) : element.id;
      var nodeName = element.nodeName.toLowerCase();
      if (nodeName !== 'object') { // not a plugin <object> tag yet
        var tag;
        switch(nodeName) {
          case 'audio':
            tag = AdapterJS.WebRTCPlugin.TAGS.AUDIO;
            break;
          case 'video':
            tag = AdapterJS.WebRTCPlugin.TAGS.VIDEO;
            break;
          default:
            tag = AdapterJS.WebRTCPlugin.TAGS.NONE;
          }

        var frag = document.createDocumentFragment();
        var temp = document.createElement('div');
        var classHTML = '';
        if (element.className) {
          classHTML = 'class="' + element.className + '" ';
        } else if (element.attributes && element.attributes['class']) {
          classHTML = 'class="' + element.attributes['class'].value + '" ';
        }

        temp.innerHTML = '<object id="' + elementId + '" ' + classHTML +
          'type="' + AdapterJS.WebRTCPlugin.pluginInfo.type + '">' +
          '<param name="pluginId" value="' + elementId + '" /> ' +
          '<param name="pageId" value="' + AdapterJS.WebRTCPlugin.pageId + '" /> ' +
          '<param name="windowless" value="true" /> ' +
          '<param name="streamId" value="' + streamId + '" /> ' +
          '<param name="tag" value="' + tag + '" /> ' +
          '</object>';
        while (temp.firstChild) {
          frag.appendChild(temp.firstChild);
        }

        var height = '';
        var width = '';
        if (element.clientWidth || element.clientHeight) {
          width = element.clientWidth;
          height = element.clientHeight;
        }
        else if (element.width || element.height) {
          width = element.width;
          height = element.height;
        }

        element.parentNode.insertBefore(frag, element);
        frag = document.getElementById(elementId);
        frag.width = width;
        frag.height = height;
        element.parentNode.removeChild(element);
      } else { // already an <object> tag, just change the stream id
        var children = element.children;
        for (var i = 0; i !== children.length; ++i) {
          if (children[i].name === 'streamId') {
            children[i].value = streamId;
            break;
          }
        }
        element.setStreamId(streamId);
      }
      var newElement = document.getElementById(elementId);
      AdapterJS.forwardEventHandlers(newElement, element, Object.getPrototypeOf(element));

      return newElement;
    };

    reattachMediaStream = function (to, from) {
      var stream = null;
      var children = from.children;
      for (var i = 0; i !== children.length; ++i) {
        if (children[i].name === 'streamId') {
          AdapterJS.WebRTCPlugin.WaitForPluginReady();
          stream = AdapterJS.WebRTCPlugin.plugin
            .getStreamWithId(AdapterJS.WebRTCPlugin.pageId, children[i].value);
          break;
        }
      }
      if (stream !== null) {
        return attachMediaStream(to, stream);
      } else {
        console.log('Could not find the stream associated with this element');
      }
    };

    // Propagate attachMediaStream and gUM in window and AdapterJS
    window.attachMediaStream      = attachMediaStream;
    window.reattachMediaStream    = reattachMediaStream;
    window.getUserMedia           = getUserMedia;
    AdapterJS.attachMediaStream   = attachMediaStream;
    AdapterJS.reattachMediaStream = reattachMediaStream;
    AdapterJS.getUserMedia        = getUserMedia;

    AdapterJS.forwardEventHandlers = function (destElem, srcElem, prototype) {
      var properties = Object.getOwnPropertyNames( prototype );
      for(var prop in properties) {
        if (prop) {
          var propName = properties[prop];

          if (typeof propName.slice === 'function' &&
              propName.slice(0,2) === 'on' &&
              typeof srcElem[propName] === 'function') {
              AdapterJS.addEvent(destElem, propName.slice(2), srcElem[propName]);
          }
        }
      }
      var subPrototype = Object.getPrototypeOf(prototype);
      if(!!subPrototype) {
        AdapterJS.forwardEventHandlers(destElem, srcElem, subPrototype);
      }
    };

    RTCIceCandidate = function (candidate) {
      if (!candidate.sdpMid) {
        candidate.sdpMid = '';
      }

      AdapterJS.WebRTCPlugin.WaitForPluginReady();
      return AdapterJS.WebRTCPlugin.plugin.ConstructIceCandidate(
        candidate.sdpMid, candidate.sdpMLineIndex, candidate.candidate
      );
    };

    // inject plugin
    AdapterJS.addEvent(document, 'readystatechange', AdapterJS.WebRTCPlugin.injectPlugin);
    AdapterJS.WebRTCPlugin.injectPlugin();
  };

  // This function will be called if the plugin is needed (browser different
  // from Chrome or Firefox), but the plugin is not installed.
  AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCb = AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCb ||
    function() {
      AdapterJS.addEvent(document,
                        'readystatechange',
                         AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCbPriv);
      AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCbPriv();
    };

  AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCbPriv = function () {
    if (AdapterJS.options.hidePluginInstallPrompt) {
      return;
    }

    var downloadLink = AdapterJS.WebRTCPlugin.pluginInfo.downloadLink;
    if(downloadLink) { // if download link
      var popupString;
      if (AdapterJS.WebRTCPlugin.pluginInfo.portalLink) { // is portal link
       popupString = 'This website requires you to install the ' +
        ' <a href="' + AdapterJS.WebRTCPlugin.pluginInfo.portalLink +
        '" target="_blank">' + AdapterJS.WebRTCPlugin.pluginInfo.companyName +
        ' WebRTC Plugin</a>' +
        ' to work on this browser.';
      } else { // no portal link, just print a generic explanation
       popupString = AdapterJS.TEXT.PLUGIN.REQUIRE_INSTALLATION;
      }

      AdapterJS.renderNotificationBar(popupString, AdapterJS.TEXT.PLUGIN.BUTTON, function () {
        window.open(downloadLink, '_top');

        var pluginInstallInterval = setInterval(function(){
          if(! isIE) {
            navigator.plugins.refresh(false);
          }
          AdapterJS.WebRTCPlugin.isPluginInstalled(
            AdapterJS.WebRTCPlugin.pluginInfo.prefix,
            AdapterJS.WebRTCPlugin.pluginInfo.plugName,
            AdapterJS.WebRTCPlugin.pluginInfo.type,
            function() { // plugin now installed
              clearInterval(pluginInstallInterval);
              AdapterJS.WebRTCPlugin.defineWebRTCInterface();
            },
            function() {
              // still no plugin detected, nothing to do
            });
        } , 500);
      });
    } else { // no download link, just print a generic explanation
      AdapterJS.renderNotificationBar(AdapterJS.TEXT.PLUGIN.NOT_SUPPORTED);
    }
  };


  // Try to detect the plugin and act accordingly
  AdapterJS.WebRTCPlugin.isPluginInstalled(
    AdapterJS.WebRTCPlugin.pluginInfo.prefix,
    AdapterJS.WebRTCPlugin.pluginInfo.plugName,
    AdapterJS.WebRTCPlugin.pluginInfo.type,
    AdapterJS.WebRTCPlugin.defineWebRTCInterface,
    AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCb);

  // END OF WEBRTC PLUGIN SHIM
  ///////////////////////////////////////////////////////////////////
}

// Placed it here so that the module.exports from the browserified
//   adapterjs will not override our AdapterJS exports
// Browserify compatibility
if(typeof exports !== 'undefined') {
  module.exports = AdapterJS;
}

AdapterJS.TEXT.EXTENSION = {
  REQUIRE_INSTALLATION_FF: 'To enable screensharing you need to install the Skylink WebRTC tools Firefox Add-on.',
  REQUIRE_INSTALLATION_CHROME: 'To enable screensharing you need to install the Skylink WebRTC tools Chrome Extension.',
  REQUIRE_REFRESH: 'Please refresh this page after the Skylink WebRTC tools extension has been installed.',
  BUTTON_FF: 'Install Now',
  BUTTON_CHROME: 'Go to Chrome Web Store'
};

AdapterJS.defineMediaSourcePolyfill = function () {
  var baseGetUserMedia = null;

  var clone = function(obj) {
    if (null === obj || 'object' !== typeof obj) {
      return obj;
    }
    var copy = obj.constructor();
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) {
        copy[attr] = obj[attr];
      }
    }
    return copy;
  };

  if (window.navigator.mozGetUserMedia) {
    baseGetUserMedia = window.navigator.getUserMedia;

    navigator.getUserMedia = function (constraints, successCb, failureCb) {

      if (constraints && constraints.video && !!constraints.video.mediaSource) {
        // intercepting screensharing requests

        // Invalid mediaSource for firefox, only "screen" and "window" are supported
        if (constraints.video.mediaSource !== 'screen' && constraints.video.mediaSource !== 'window') {
          failureCb(new Error('GetUserMedia: Only "screen" and "window" are supported as mediaSource constraints'));
          return;
        }

        var updatedConstraints = clone(constraints);

        //constraints.video.mediaSource = constraints.video.mediaSource;
        updatedConstraints.video.mozMediaSource = updatedConstraints.video.mediaSource;

        // so generally, it requires for document.readyState to be completed before the getUserMedia could be invoked.
        // strange but this works anyway
        var checkIfReady = setInterval(function () {
          if (document.readyState === 'complete') {
            clearInterval(checkIfReady);

            baseGetUserMedia(updatedConstraints, successCb, function (error) {
              if (['NotAllowedError', 'PermissionDeniedError', 'SecurityError', 'NotAllowedError'].indexOf(error.name) > -1 && window.parent.location.protocol === 'https:') {
                AdapterJS.renderNotificationBar(AdapterJS.TEXT.EXTENSION.REQUIRE_INSTALLATION_FF,
                  AdapterJS.TEXT.EXTENSION.BUTTON_FF, function (e) {
                  window.open('https://addons.mozilla.org/en-US/firefox/addon/skylink-webrtc-tools/', '_blank');
                  if (e.target && e.target.parentElement && e.target.nextElementSibling &&
                    e.target.nextElementSibling.click) {
                    e.target.nextElementSibling.click();
                  }
                  // Trigger refresh bar
                  AdapterJS.renderNotificationBar(AdapterJS.TEXT.EXTENSION ?
                    AdapterJS.TEXT.EXTENSION.REQUIRE_REFRESH : AdapterJS.TEXT.REFRESH.REQUIRE_REFRESH,
                    AdapterJS.TEXT.REFRESH.BUTTON, function () {
                    window.open('javascript:location.reload()', '_top');
                  }); // jshint ignore:line
                });
              } else {
                failureCb(error);
              }
            });
          }
        }, 1);

      } else { // regular GetUserMediaRequest
        baseGetUserMedia(constraints, successCb, failureCb);
      }
    };

    AdapterJS.getUserMedia = window.getUserMedia = navigator.getUserMedia;
    /* Comment out to prevent recursive errors
    navigator.mediaDevices.getUserMedia = function(constraints) {
      return new Promise(function(resolve, reject) {
        window.getUserMedia(constraints, resolve, reject);
      });
    };*/

  } else if (window.navigator.webkitGetUserMedia && window.webrtcDetectedBrowser !== 'safari') {
    baseGetUserMedia = window.navigator.getUserMedia;

    navigator.getUserMedia = function (constraints, successCb, failureCb) {
      if (constraints && constraints.video && !!constraints.video.mediaSource) {
        if (window.webrtcDetectedBrowser !== 'chrome') {
          // This is Opera, which does not support screensharing
          failureCb(new Error('Current browser does not support screensharing'));
          return;
        }

        // would be fine since no methods
        var updatedConstraints = clone(constraints);

        var chromeCallback = function(error, sourceId) {
          if(!error) {
            updatedConstraints.video.mandatory = updatedConstraints.video.mandatory || {};
            updatedConstraints.video.mandatory.chromeMediaSource = 'desktop';
            updatedConstraints.video.mandatory.maxWidth = window.screen.width > 1920 ? window.screen.width : 1920;
            updatedConstraints.video.mandatory.maxHeight = window.screen.height > 1080 ? window.screen.height : 1080;

            if (sourceId) {
              updatedConstraints.video.mandatory.chromeMediaSourceId = sourceId;
            }

            delete updatedConstraints.video.mediaSource;

            baseGetUserMedia(updatedConstraints, successCb, failureCb);

          } else { // GUM failed
            if (error === 'permission-denied') {
              failureCb(new Error('Permission denied for screen retrieval'));
            } else {
              // NOTE(J-O): I don't think we ever pass in here.
              // A failure to capture the screen does not lead here.
              failureCb(new Error('Failed retrieving selected screen'));
            }
          }
        };

        var onIFrameCallback = function (event) {
          if (!event.data) {
            return;
          }

          if (event.data.chromeMediaSourceId) {
            if (event.data.chromeMediaSourceId === 'PermissionDeniedError') {
                chromeCallback('permission-denied');
            } else {
              chromeCallback(null, event.data.chromeMediaSourceId);
            }
          }

          if (event.data.chromeExtensionStatus) {
            if (event.data.chromeExtensionStatus === 'not-installed') {
              AdapterJS.renderNotificationBar(AdapterJS.TEXT.EXTENSION.REQUIRE_INSTALLATION_CHROME,
                AdapterJS.TEXT.EXTENSION.BUTTON_CHROME, function (e) {
                window.open(event.data.data, '_blank');
                if (e.target && e.target.parentElement && e.target.nextElementSibling &&
                  e.target.nextElementSibling.click) {
                  e.target.nextElementSibling.click();
                }
                // Trigger refresh bar
                AdapterJS.renderNotificationBar(AdapterJS.TEXT.EXTENSION ?
                  AdapterJS.TEXT.EXTENSION.REQUIRE_REFRESH : AdapterJS.TEXT.REFRESH.REQUIRE_REFRESH,
                  AdapterJS.TEXT.REFRESH.BUTTON, function () {
                  window.open('javascript:location.reload()', '_top');
                }); // jshint ignore:line
              });
            } else {
              chromeCallback(event.data.chromeExtensionStatus, null);
            }
          }

          // this event listener is no more needed
          window.removeEventListener('message', onIFrameCallback);
        };

        window.addEventListener('message', onIFrameCallback);

        postFrameMessage({
          captureSourceId: true
        });

      } else {
        baseGetUserMedia(constraints, successCb, failureCb);
      }
    };

    AdapterJS.getUserMedia = window.getUserMedia = navigator.getUserMedia;
    navigator.mediaDevices.getUserMedia = function(constraints) {
      return new Promise(function(resolve, reject) {
        window.getUserMedia(constraints, resolve, reject);
      });
    };

  } else if (navigator.mediaDevices && navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) {
    // nothing here because edge does not support screensharing
    console.warn('Edge does not support screensharing feature in getUserMedia');

  } else {
    baseGetUserMedia = window.navigator.getUserMedia;

    navigator.getUserMedia = function (constraints, successCb, failureCb) {
      if (constraints && constraints.video && !!constraints.video.mediaSource) {
        // would be fine since no methods
        var updatedConstraints = clone(constraints);

        // wait for plugin to be ready
        AdapterJS.WebRTCPlugin.callWhenPluginReady(function() {
          // check if screensharing feature is available
          if (!!AdapterJS.WebRTCPlugin.plugin.HasScreensharingFeature &&
            !!AdapterJS.WebRTCPlugin.plugin.isScreensharingAvailable) {
            // set the constraints
            updatedConstraints.video.optional = updatedConstraints.video.optional || [];
            updatedConstraints.video.optional.push({
              sourceId: AdapterJS.WebRTCPlugin.plugin.screensharingKey || 'Screensharing'
            });

            delete updatedConstraints.video.mediaSource;
          } else {
            failureCb(new Error('Your version of the WebRTC plugin does not support screensharing'));
            return;
          }
          baseGetUserMedia(updatedConstraints, successCb, failureCb);
        });
      } else {
        baseGetUserMedia(constraints, successCb, failureCb);
      }
    };

    AdapterJS.getUserMedia = getUserMedia =
       window.getUserMedia = navigator.getUserMedia;
    if ( navigator.mediaDevices &&
      typeof Promise !== 'undefined') {
      navigator.mediaDevices.getUserMedia = requestUserMedia;
    }
  }

  // For chrome, use an iframe to load the screensharing extension
  // in the correct domain.
  // Modify here for custom screensharing extension in chrome
  if (window.webrtcDetectedBrowser === 'chrome') {
    var iframe = document.createElement('iframe');

    iframe.onload = function() {
      iframe.isLoaded = true;
    };

    iframe.src = 'https://cdn.temasys.com.sg/skylink/extensions/detectRTC.html';
    iframe.style.display = 'none';

    (document.body || document.documentElement).appendChild(iframe);

    var postFrameMessage = function (object) { // jshint ignore:line
      object = object || {};

      if (!iframe.isLoaded) {
        setTimeout(function () {
          iframe.contentWindow.postMessage(object, '*');
        }, 100);
        return;
      }

      iframe.contentWindow.postMessage(object, '*');
    };
  } else if (window.webrtcDetectedBrowser === 'opera') {
    console.warn('Opera does not support screensharing feature in getUserMedia');
  }
};

if (typeof window.require !== 'function') {
  AdapterJS.defineMediaSourcePolyfill();
}

/*! skylinkjs - v0.6.19 - Sat May 06 2017 12:48:04 GMT+0800 (SGT) */
(function (_globals) {

  'use strict';

  /* jshint ignore:start */
  // Object.keys() polyfill - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
  !function(){Object.keys||(Object.keys=function(){var t=Object.prototype.hasOwnProperty,r=!{toString:null}.propertyIsEnumerable("toString"),e=["toString","toLocaleString","valueOf","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","constructor"],o=e.length;return function(n){if("object"!=typeof n&&"function"!=typeof n||null===n)throw new TypeError("Object.keys called on non-object");var c=[];for(var l in n)t.call(n,l)&&c.push(l);if(r)for(var p=0;o>p;p++)t.call(n,e[p])&&c.push(e[p]);return c}}())}();
  // Date.getISOString() polyfill - https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
  !function(){function t(t){return 10>t?"0"+t:t}Date.prototype.toISOString=function(){return this.getUTCFullYear()+"-"+t(this.getUTCMonth()+1)+"-"+t(this.getUTCDate())+"T"+t(this.getUTCHours())+":"+t(this.getUTCMinutes())+":"+t(this.getUTCSeconds())+"."+(this.getUTCMilliseconds()/1e3).toFixed(3).slice(2,5)+"Z"}}();
  // Date.now() polyfill
  !function(){"function"!=typeof Date.now&&(Date.now=function(){return(new Date).getTime()})}();
  // addEventListener() polyfill - https://gist.github.com/eirikbacker/2864711
  !function(e,t){function n(e){var n=t[e];t[e]=function(e){return o(n(e))}}function a(t,n,a){return(a=this).attachEvent("on"+t,function(t){var t=t||e.event;t.preventDefault=t.preventDefault||function(){t.returnValue=!1},t.stopPropagation=t.stopPropagation||function(){t.cancelBubble=!0},n.call(a,t)})}function o(e,t){if(t=e.length)for(;t--;)e[t].addEventListener=a;else e.addEventListener=a;return e}e.addEventListener||(o([t,e]),"Element"in e?e.Element.prototype.addEventListener=a:(t.attachEvent("onreadystatechange",function(){o(t.all)}),n("getElementsByTagName"),n("getElementById"),n("createElement"),o(t.all)))}(window,document);
  // performance.now() polyfill - https://gist.github.com/paulirish/5438650
  !function(){if("performance"in window==0&&(window.performance={}),Date.now=Date.now||function(){return(new Date).getTime()},"now"in window.performance==0){var a=Date.now();performance.timing&&performance.timing.navigationStart&&(a=performance.timing.navigationStart),window.performance.now=function(){return Date.now()-a}}}();
  // BlobBuilder polyfill
  window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
  /* jshint ignore:end */

  var Temasys = {};

  /**
 * Handles the Peer Datachannel connection.
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
/**
 * Handles the Datatransfer session.
 * @class Temasys.Datatransfer
 * 
 */
Temasys.Datatransfer = function () {
};


/**
 * Handles the SDK debugger.
 * @class Temasys.Debugger
 * @since 0.7.0
 * @typedef module
 */
var _log;

Temasys.Debugger = new (function () {
  var ref = this;
  var refLogs = [];

  /**
   * The enum of debugger log levels.
   * @attribute LOG_LEVEL_ENUM
   * @param {Number} NONE The level that prints no logs.
   * @param {Number} ERROR The level that prints error logs.
   * - Prints error as [`console.error()`](https://developer.mozilla.org/en-US/docs/Web/API/Console/error)
   * @param {Number} WARN The level that prints warning + error logs.
   * - Prints warning as [`console.warn()`](https://developer.mozilla.org/en-US/docs/Web/API/Console/warn)
   * @param {Number} INFO The level that prints info + warning + error logs.
   * - Prints info as [`console.info()`](https://developer.mozilla.org/en-US/docs/Web/API/Console/info)
   * @param {Number} LOG The level that prints verbose + info + warning + error logs.
   * - Prints log as [`console.log()`](https://developer.mozilla.org/en-US/docs/Web/API/Console/log)
   * @param {Number} DEBUG The level that prints verbose (detailed debugging) + verbose + info + warning + error logs.
   * - Prints debug as [`console.debug()`](https://developer.mozilla.org/en-US/docs/Web/API/Console/debug)
   * @type JSON
   * @final
   * @readOnly
   * @for Temasys.Debugger
   * @since 0.7.0
   */
  ref.LOG_LEVEL_ENUM = {
    // Brought over values from Skylink object LOG_LEVEL
    NONE: -1,
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    LOG: 3,
    DEBUG: 4
  };

  // Stores the debugger settings.
  ref._settings = {
    global: {
      level: ref.LOG_LEVEL_ENUM.ERROR,
      traceLogs: false,
      cacheLogs: false,
      printTimestamp: false,
      printComponentId: false
    },
    components: {}
  };

  // Stores the stats.
  ref._stats = {
    total: {
      debug: 0,
      log: 0,
      info: 0,
      warn: 0,
      error: 0,
      exceptions: []
    },
    components: {}
  };

  // Stores the listener functions.
  ref._listeners = {
    catch: null,
    watch: null,
    components: []
  };

  /**
   * Function that sets the debugger configuration.
   * @method setConfig
   * @param {JSON} options The options.
   * - When provided as `null` with `componentId` provided, it unsets the specific component
   *   configuration to use the global configuration.
   * @param {Number} [options.level] The log level.
   * - When not provided, the value is set to `LOG_LEVEL_ENUM.ERROR`.
   * - This references the `LOG_LEVEL_ENUM` constant.
   * @param {Boolean} [options.traceLogs=false] The flag if Web console logs should be traced.
   * - This uses the `console.trace` function when available.
   * @param {Boolean} [options.cacheLogs=false] The flag if Web console logs should be cached for
   *   fetching in `getCachedLogs()` method.
   * @param {Boolean} [options.printTimestamp=false] The flag if timestamps (ISO-8601) should be
   *   printed on Web console logs.
   * @param {Boolean} [options.printComponentId=false] The flag if component ID should be
   *   printed on Web console logs.
   * @param {String} [componentId] The component ID.
   * - When provided, it configures the configuration for the specific component.
   * @example
   * // Example 1: Set global configuration
   * Temasys.Debugger.setConfig({
   *   level: Temasys.Debugger.LOG_LEVEL_ENUM.DEBUG
   * });
   * 
   * // Example 2: Set component configuration
   * Temasys.Debugger.setConfig({
   *   level: Temasys.Debugger.LOG_LEVEL_ENUM.LOG
   * }, componentId);
   * 
   * // Example 3: Unset component configuration and use global configuration instead for component
   * Temasys.Debugger.setConfig(null, componentId);
   * @for Temasys.Debugger
   * @since 0.7.0
   */
  ref.setConfig = function (options, componentId) {
    var useSettings = {
      level: ref.LOG_LEVEL_ENUM.ERROR,
      traceLogs: false,
      cacheLogs: false,
      printTimestamp: false,
      printComponentId: false
    };

    if (options && typeof options === 'object') {
      useSettings.level = typeof options.level === 'number' && options.level <= 4 &&
        options.level >= -1 ? options.level : useSettings.level;
      useSettings.traceLogs = typeof options.traceLogs === 'boolean' ?
        options.traceLogs : useSettings.traceLogs;
      useSettings.cacheLogs = typeof options.cacheLogs === 'boolean' ?
        options.cacheLogs : useSettings.cacheLogs;
      useSettings.printTimestamp = typeof options.printTimestamp === 'boolean' ?
        options.printTimestamp : useSettings.printTimestamp;
      useSettings.printComponentId = typeof options.printComponentId === 'boolean' ?
        options.printComponentId : useSettings.printComponentId;
    }

    // Set the component configuration : config(options, componentId)
    if (componentId && typeof componentId === 'string') {
      // Unset the component configuration : config(null, componentId)
      if (options === null) {
        delete ref._settings.components[componentId];
      } else {
        ref._settings.components[componentId] = useSettings;
      }
    // Set the global configuration : config(options)
    } else {
      ref._settings.global = useSettings;
    }
  };

  /**
   * Function that returns the debugger configuration.
   * @method getConfig
   * @param {String} [componentId] The component ID.
   * - When provided, it returns the configuration only for the specific component.
   * @param {JSON} return The configured options.
   * - Object signature matches the `options` parameter in `setConfig()` method.
   * @return {JSON}
   * @example
   * // Example 1: Get global configuration
   * var config = Temasys.Debugger.getConfig();
   * 
   * // Example 2: Get only component configuration
   * var config = Temasys.Debugger.getConfig(componentId);
   * @for Temasys.Debugger
   * @since 0.7.0
   */
  ref.getConfig = function (componentId) {
    var useSettings = componentId && typeof componentId === 'string' && ref._settings.components[componentId] ?
      ref._settings.components[componentId] : ref._settings.global;
    return {
      level: useSettings.level,
      traceLogs: useSettings.traceLogs,
      cacheLogs: useSettings.cacheLogs,
      printTimestamp: useSettings.printTimestamp,
      printComponentId: useSettings.printComponentId
    };
  };

  /**
   * Function that returns the total debugger stats.
   * @method getStats
   * @param {String} [componentId] The component ID.
   * - When provided, it returns the stats only for the specific component.
   * @param {JSON} return The stats.
   * @param {Number} return.debug The total "debug" logs received.
   * @param {Number} return.log The total number of "log" logs received.
   * @param {Number} return.info The total number of "info" logs received.
   * @param {Number} return.warn The total number of "warn" logs received.
   * @param {Number} return.error The total number of "error" logs received.
   * @param {Array} return.exceptions The total exceptions caught.
   * - Note that for tabulation for this, it this requires `catchExceptions()` to be configured.
   * - Each array item is an `Error` object.
   * @return {JSON}
   * @example
   * // Example 1: Get total stats
   * var stats = Temasys.Debugger.getStats();
   * 
   * // Example 2: Get only component total stats
   * var stats = Temasys.Debugger.getStats(componentId);
   * @for Temasys.Debugger
   * @since 0.7.0
   */
  ref.getStats = function (componentId) {
    return componentId && typeof componentId === 'string' && ref._stats.components[componentId] ?
      ref._stats.components[componentId] : ref._stats.total;
  };

  /**
   * Function that returns the list of components.
   * @method getComponents
   * @param {Array} return The list of components.
   * @return {Array}
   * @example
   * // Example: Get the list of components
   * var components = Temasys.Debugger.getComponents();
   * @for Temasys.Debugger
   * @since 0.7.0
   */
  ref.getComponents = function () {
    return Object.keys(ref._stats.components);
  };

  /**
   * Function that watches for logs logged.
   * @method watchForLogs
   * @param {Function} [fn] The callback function.
   * - When not provided as `Function`, it unsubscribes any existing configured callback function.
   * @param {Array} fn.log The log item.
   * - Object signature matches the returned log item in `getCachedLogs()` method.
   * @param {String} fn.componentId The component ID.
   * @example
   * // Example 1: Watch for logs
   * Temasys.Debugger.watchForLogs(function (log, componentId) {
   *   ..
   * });
   * 
   * // Example 2: Unwatch for logs
   * Temasys.Debugger.watchForLogs();
   * @for Temasys.Debugger
   * @since 0.7.0
   */
  ref.watchForLogs = function (fn) {
    ref._listeners.watch = typeof fn === 'function' ? fn : null;
  };

  /**
   * Function that catches the SDK exceptions.
   * @method catchExceptions
   * @param {Function} [fn] The callback function.
   * - When not provided as `Function`, it unsubscribes any existing configured callback function.
   * @param {Error} fn.error The error object caught.
   * @param {String} fn.componentId The component ID.
   * @example
   * // Example 1: Catch SDK exceptions
   * Temasys.Debugger.catchExceptions(function (error, componentId) {
   *   ..
   * });
   * 
   * // Example 2: Uncatch SDK exceptions
   * Temasys.Debugger.catchExceptions();
   * @for Temasys.Debugger
   * @since 0.7.0
   */
  ref.catchExceptions = function (fn) {
    ref._listeners.catch = typeof fn === 'function' ? function (componentId, error) {
      ref._stats.components[componentId].exceptions.push(error);
      ref._stats.total.exceptions.push(error);
      fn(error, componentId);
    } : null;

    Temasys.Utils.forEach(ref._listeners.components, function (fnComponentItem) {
      fnComponentItem(ref._listeners.catch);
    });
  };

  /**
   * Function that gets the cached logs.
   * @method getCachedLogs
   * @param {JSON} [options] The options.
   * - When provided, this may cause performance issues when cached logs size is huge.
   * @param {String} [options.componentId] The component ID of logs to return only.
   * @param {Number} [options.level] The specific level of logs to return only.
   * - This references the `LOG_LEVEL_ENUM` constant.
   * @param {Array} return The array of log items.
   * @param {Array} return._index The log item.
   * @param {String} return._index._0 The log item level property key.
   * - This references the `LOG_LEVEL_ENUM` constant.
   * @param {String} return._index._1 The log item component ID.
   * @param {String} return._index._2 The log item timestamp (in ISO-8601 format).
   * @param {String} return._index._3 The log item message.
   * @param {Array} [return._index._4] The log item meta data.
   * @param {Number} return._index._5 The log item performance timestamp.
   * - This is formed with `performance.now()` API.
   * @return {Array}
   * @example
   * // Example 1: Get cached logs for specific component and log level
   * var debugLogsForComponentA = Temasys.Debugger.getCachedLogs({
   *   level: Temasys.Debugger.LOG_LEVEL.DEBUG,
   *   componentId: "A"
   * });
   * 
   * // Example 2: Get cached logs for specific log level only
   * var debugLogsForLogError = Temasys.Debugger.getCachedLogs({
   *   level: Temasys.Debugger.LOG_LEVEL.ERROR
   * });
   *
   * // Example 3: Get cached logs for specific component only
   * var debugLogsForComponentB = Temasys.Debugger.getCachedLogs({
   *   componentId: "B"
   * });
   *
   * // Example 4: Get cached logs for all
   * var debugLogsForAll = Temasys.Debugger.getCachedLogs();
   * @for Temasys.Debugger
   * @since 0.7.0
   */
  ref.getCachedLogs = function (options) {
    var result = [];

    if (ref._fnLoop(options, function (logItem, index) {
      result.push(logItem);
    })) {
      return refLogs;
    }

    return result;
  };

  /**
   * Function that clears the cached logs.
   * @method clearCachedLogs
   * @param {JSON} [options] The options.
   * - When `options.componentId` and `options.level` is not provided, it clears all the cached logs.
   * @param {String} [options.componentId] The component ID of logs to clear only.
   * @param {Number} [options.level] The specific level of logs to clear only.
   * - This references the `LOG_LEVEL_ENUM` constant.
   * @example
   * // Example 1: Clear cached logs for specific component and log level
   * Temasys.Debugger.clearCachedLogs({
   *   level: Temasys.Debugger.LOG_LEVEL.LOG,
   *   componentId: "A"
   * });
   * 
   * // Example 2: Clear cached logs for specific log level only
   * Temasys.Debugger.clearCachedLogs({
   *   level: Temasys.Debugger.LOG_LEVEL.DEBUG
   * });
   *
   * // Example 3: Clear cached logs for specific component only
   * Temasys.Debugger.clearCachedLogs({
   *   componentId: "B"
   * });
   *
   * // Example 4: Clear cached logs for all
   * Temasys.Debugger.clearCachedLogs();
   * @for Temasys.Debugger
   * @since 0.7.0
   */
  ref.clearCachedLogs = function (options) {
    if (ref._fnLoop(options, function (logItem, index) {
      refLogs.splice(index, 1);
      return 0;
    })) {
      refLogs = [];
    }
  };

  /**
   * Function that prints the cached logs.
   * @method printCachedLogs
   * @param {JSON} [options] The options.
   * @param {String} [options.componentId] The component ID of logs to print only.
   * @param {Number} [options.level] The specific level of logs to print only.
   * - This references the `LOG_LEVEL_ENUM` constant.
   * @example
   * // Example 1: Print cached logs for specific component and log level
   * Temasys.Debugger.printCachedLogs({
   *   level: Temasys.Debugger.LOG_LEVEL.ERROR,
   *   componentId: "A"
   * });
   * 
   * // Example 2: Print cached logs for specific log level only
   * Temasys.Debugger.printCachedLogs({
   *   level: Temasys.Debugger.LOG_LEVEL.DEBUG
   * });
   *
   * // Example 3: Print cached logs for specific component only
   * Temasys.Debugger.printCachedLogs({
   *   componentId: "B"
   * });
   *
   * // Example 4: Print cached logs for all
   * Temasys.Debugger.printCachedLogs();
   * @for Temasys.Debugger
   * @since 0.7.0
   */
  ref.printCachedLogs = function (options) {
    var fn = function (logItem, index) {
      var method = typeof console[logItem[0].toLowerCase()] !== 'function' ? 'log' : logItem[0].toLowerCase();
      console[method].apply(console, [logItem[3]].concat(logItem[4]));
    };

    if (ref._fnLoop(options, fn)) {
      Temasys.Utils.forEach(refLogs, fn);
    }
  };

  /**
   * Function that checks the `options` provided and loops the log items. 
   * - Returns `true` if there's not a need to loop.
   */
  ref._fnLoop = function (options, fn) {
    // Check if `options` is defined, and return is following checks fails
    if (!(options && typeof options === 'object' &&
    // Check also if `options.componentId` is defined
      ((options.componentId && typeof options.componentId === 'string') ||
    // Check also if `options.level` is defined
      (typeof options.level === 'number' && options.level <= 4 && options.level >= -1)))) {
      return true;
    }

    Temasys.Utils.forEach(refLogs, function (logItem, index) {
      // Check if `options.level` is defined, valid and matches.
      if ((typeof options.level === 'number' ? ref.LOG_LEVEL_ENUM[logItem[0]] === options.level : true) &&
      // Check if `options.componentId` is defined, valid and matches.
        (options.componentId && typeof options.componentId ? options.componentId === logItem[1] : true)) {
        return fn(logItem, index);
      }
    });
  };

  /**
   * Handles the global log methods for all components.
   */
  _log = (function (fnLog) {
    return {
      /**
       * Function to log "debug" level message.
       */
      debug: function (componentId, message) {
        fnLog('DEBUG', Array.prototype.slice.call(arguments));
      },

      /**
       * Function to log "log" level message.
       */
      log: function (componentId, message) {
        fnLog('LOG', Array.prototype.slice.call(arguments));
      },

      /**
       * Function to log "info" level message.
       */
      info: function (componentId, message) {
        fnLog('INFO', Array.prototype.slice.call(arguments));
      },

      /**
       * Function to log "warn" level message.
       */
      warn: function (componentId, message) {
        fnLog('WARN', Array.prototype.slice.call(arguments));
      },

      /**
       * Function to log "error" level message.
       */
      error: function (componentId, message) {
        fnLog('ERROR', Array.prototype.slice.call(arguments));
      },

      /**
       * Function to configure component.
       * - Returns the component ID.
       */
      configure: function (componentId, fn) {
        componentId = componentId && typeof componentId === 'string' ? componentId : Temasys.Utils.generateUUID();
        ref._stats.components[componentId] = {
          debug: 0,
          log: 0,
          info: 0,
          warn: 0,
          error: 0,
          exceptions: []
        };
        ref._listeners.components.push(fn);
        // Configure the current `catch` listener
        fn(ref._listeners.catch);
        // For listeners.catch, invoke it as (componentId, error)
        return componentId;
      },

      /**
       * Function to push stats to API.
       */
      stat: function (appKey, roomId, peerId, type, data) {
      },

      /**
       * Function to catch custom errors to be thrown. 
       */
      throw: function (componentId, error) {
        if (typeof ref._listeners.catch === 'function') {
          ref._listeners.catch(componentId, error);
        } else {
          throw error;
        }
      }
    }
  })(function (level, args) {
    // 0: Component ID
    // 1: Message
    // 2+: Meta data
    var componentId = args[0];
    var timestamp = (new Date()).toISOString();
    var useSettings = ref._settings.components[componentId] ?
      ref._settings.components[componentId] : ref._settings.global;

    // E.g. Peer :: 34234234234 | 2017-04-12T12:41:55.563Z [RID: werwer][PID: xxx-werwer-][CID: test] - Test log is here -> null
    var message = '';
    
    // message: array - [component,roomId,peerId,anyId,message]
    if (Array.isArray(args[1])) {
      message += args[1][0] ? args[1][0] + ' ' : '';
      message += useSettings.printComponentId ? ':: ' + componentId + ' ' : '';
      message += useSettings.printTimestamp ? '| ' + timestamp + ' ' : '';
      message += args[1][1] ? '[RID: ' + args[1][1] + ']' : '';
      message += args[1][2] ? '[PID: ' + args[1][2] + ']' : '';
      message += args[1][3] ? '[CID: ' + args[1][3] + ']' : '';
      message += (message[message.length - 1] === ' ' ? '- ' : (message ? ' - ' : '')) + args[1][4];
    // message: string - message
    } else {
      message += useSettings.printComponentId ? ':: ' + componentId + ' ' : '';
      message += useSettings.printTimestamp ? '| ' + timestamp + ' ' : '';
      message += (message[message.length - 1] === ' ' ? ' - ' : '') + args[1];
    }

    // Remove the first 2 arguments and leave the meta data
    args.splice(0, 2);

    var logItem = [level, componentId, timestamp, message, args.concat([]), performance.now()];

    if (useSettings.cacheLogs) {
      refLogs.push(logItem);
    }

    if (typeof ref._listeners.watch === 'function') {
      ref._listeners.watch(logItem, componentId);
    }

    args.splice(0, 0, (useSettings.traceLogs ? '[' + level + '] ' : '') + message);

    if (ref.LOG_LEVEL_ENUM[level] <= useSettings.level) {
      var method = useSettings.traceLogs ? 'trace' : level.toLowerCase();
      method = typeof console[method] !== 'function' ? 'log' : method;
      console[method].apply(console, args);
    }

    ref._stats.total[level.toLowerCase()]++;
    ref._stats.components[componentId][level.toLowerCase()]++;

    // TODO: Push logs to remote server when requested.
  });
})();



/**
 * Handles the native `RTCPeerConnection` object connection.
 * @class Temasys.Peer
 * @param {JSON} options The options.
 * @param {JSON} [options.constraints] @(exp) The native `RTCPeerConnection` object constraints settings.
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
 * @param {JSON} [options.candidates] @(exp) The ICE candidates settings.
 * @param {Boolean} [options.candidates.host=true] The flag if "host" ICE candidates should be used.
 * @param {Boolean} [options.candidates.srflx=true] The flag if "srflx" ICE candidates should be used.
 * @param {Boolean} [options.candidates.relay=true] The flag if "relay" ICE candidates should be used.
 * @param {JSON} [options.codecs] @(exp) The codecs settings.
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
 * @param {JSON} [options.media.video.xGoogleBandwidth] @(exp) The bitrate configuration for video codec bandwidth.
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
   * - This requires a {{#crossLink "Temasys.Stream"}}{{/crossLink}} attached to a video element.
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
   * @param {JSON} message The message.
   * @param {Any} message.data The message object.
   * @param {Boolean} message.isPrivate The flag if message is targeted or not.
   * @param {Boolean} message.isDatachannel the flag if message is sent from
   *   {{#crossLink "Temasys.Datachannel"}}{{/crossLink}} connections.
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
   * Event triggered when sending DTMF.
   * @event dtmf
   * @param {Temasys.DTMF} dtmf The DTMF object.
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
Peer.prototype.getCandidates = function () {
};

/**
 * Function to retrieve Peer {{#crossLink "Temasys.Stream"}}Streams{{/crossLink}}.
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
 * Function to set the {{#crossLink "Temasys.Stream"}}{{/crossLink}} object for this Peer.
 * @method setStream
 * @param {Temasys.Stream} [stream] The Stream object.
 * - To not send any Stream to this Peer, set the value to `null`.
 * @return {Promise} The Promise for function request completion.
 * @example
 *   peer.setStream(stream).then(function () {
 *     console.log("Set stream success.");
 *   }).catch(function (error) {
 *     console.error("Set stream error ->", error);
 *   });
 * @for Temasys.Peer
 * @since 0.7.0  
 */
Peer.prototype.setStream = function (stream) {
};

/**
 * Function to refresh Peer connection.
 * @method refresh
 * @param {Temasys.Stream} stream The stream object.
 * @param {Promise} _return Test.
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
/**
 * Handles the client Room connection session in App space.
 * @class Temasys.Room
 * @param {JSON} options The options.
 * @param {String} options.appKey The App key ID.
 * @param {String} [options.name] The Room name in App space.
 * - When not provided, the value of the App key ID is used.
 * @param {String} [componentId] The unique component ID to use for `Temasys.Debugger` module or as
 *   for object identification.
 * - Please ensure that this value is unique from other class objects.
 * @constructor
 * @example
 * // Example: Create a Room object
 * var room = new Temasys.Room({
 *   appKey: myAppKey
 * });
 * 
 * room.connect();
 * @since 0.7.0
 */
Temasys.Room = function (options, componentId) {
  var ref = this;
  // The event manager
  ref._eventManager = Temasys.Utils.createEventManager();
  // The component ID.
  ref._componentId = Temasys.Debugger(componentId || null, function (fn) {
    ref._eventManager.catch(fn);
  });
  // The session received from API server.
  ref._session = {};
  // The user information
  ref._user = {};
  // The peers
  ref._peers = {};
  // The config set.
  ref._config = {
    appKey: null,
    name: null,
    requireWebRTC: options && typeof options === 'object' && options.requireWebRTC !== false
  };
  // The supports.
  ref._supports = {};
  // The current states.
  ref._states = {};

  if (!(options && typeof options === 'object' && options.appKey && typeof options.appKey === 'string')) {
    return _log.throw(ref._componentId, new Error('Temasys.Room: options.appKey is not provided when required'));
  }

  ref._config.appKey = options.appKey;
  ref._config.name = options.name && typeof options.name === 'string' ? options.name : options.appKey;

  /**
   * Function to subscribe a callback function to an event once.
   * - Parameters follows `.once()` method in returned object of `Temasys.Utils.createEventManager()` method.
   * @method once
   * @for Temasys.Room
   * @since 0.7.0
   */
  ref.once = ref._eventManager.once;

  /**
   * Function to subscribe a callback function to an event.
   * - Parameters follows `.on()` method in returned object of `Temasys.Utils.createEventManager()` method.
   * @method on
   * @for Temasys.Room
   * @since 0.7.0
   */
  ref.on = ref._eventManager.on;

  /**
   * Function to unsubscribe a callback function to an event.
   * - Parameters follows `.off()` method in returned object of `Temasys.Utils.createEventManager()` method.
   * @method off
   * @for Temasys.Room
   * @since 0.7.0
   */
  ref.off = ref._eventManager.off;

  if (!(typeof options.initTimeout === 'number' && options.initTimeout === -1)) {
    setTimeout(function () {
      ref.init();
    }, typeof options.initTimeout === 'number' ? options.initTimeout : 1000);
  }

  /**
   * Event triggered when invoked `init()` method state has changed.
   * @event initStateChange
   * @param {Number} state The current state.
   * - This references the `INIT_STATE_ENUM` constant.
   * @param {JSON} [error] The error result.
   * - This is only defined when `state` is `INIT_STATE_ENUM.ERROR`.
   * @param {Error} [error.error] The error object.
   * @param {Number} [error.code] The error code.
   * - This references the `INIT_ERROR_CODE_ENUM` constant.
   * @for Temasys.Room
   * @since 0.7.0
   */
};

/**
 * The enum of invoked `init()` method states.
 * @attribute INIT_STATE_ENUM
 * @param {Number} LOADING The state when starting dependencies and supports requirements checks.
 * @param {Number} COMPLETED The state when dependencies and supports requirements have been checked and initialised.
 * @param {Number} ERROR The state when required dependencies or supports is missing, or initialisation has errors.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Room
 * @since 0.7.0
 */
Temasys.Room.prototype.SESSION_STATE_ENUM = {
  // Brought over values from Skylink object READY_STATE_CHANGE
  LOADING: 0,
  COMPLETED: 1,
  ERROR: -1
};

/**
 * The enum of Room dependency initialising error codes.
 * @attribute INIT_ERROR_CODE_ENUM
 * @param {Number} MISSING_SOCKETIO The error code when required socket.io-client dependency is not loaded.
 * @param {Number} MISSING_ADAPTERJS The error code when required AdapterJS dependency is not loaded.
 * @param {Number} XMLHTTPREQUEST_NOT_AVAILABLE The error code when XMLHttpRequest (or
 *   XDomainRequest for IE 8-9) API is not available when required.
 * @param {Number} WEBRTC_NOT_AVAILABLE The error code when WebRTC is not supported for browser or device.
 * - This state should only happen if `options.requireWebRTC` is enabled when constructing `Temasys.Room` object.
 * @param {Number} PLUGIN_NOT_AVAILABLE The error code when WebRTC plugin is not available
 *   (or inactive) when required.
 * - This state should only happen if `options.requireWebRTC` is enabled when constructing `Temasys.Room` object.
 * @param {Number} PARSE_SUPPORTS_ERROR The error code when retrieving of WebRTC supports fails
 *   hence initialisation fails.
 * - This state should only happen if `options.requireWebRTC` is enabled when constructing `Temasys.Room` object.
 * @param {Number} WEBRTC_MIN_SUPPORTS_ERROR The error code when browser version is lower than required
 *   minimum support.
 * - This state should only happen if `options.requireWebRTC` is enabled when constructing `Temasys.Room` object.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Room
 * @since 0.7.0
 */
Temasys.Room.prototype.INIT_ERROR_CODE_ENUM = {
  // Brought over values from Skylink object READY_STATE_CHANGE_ERROR
  NO_SOCKET_IO: 1,
  NO_XMLHTTPREQUEST_SUPPORT: 2,
  NO_WEBRTC_SUPPORT: 3,
  PLUGIN_NOT_AVAILABLE: 4,
  ADAPTER_NO_LOADED: 7,
  PARSE_CODECS: 8,
  WEBRTC_MIN_SUPPORTS_ERROR: 9
};

/**
 * Function to initialise dependencies and check for supports.
 * @method init
 * @param {Number} [options.initTimeout=1000] The timeout to wait before `Temasys.Room.init()` method
 *   should be invoked when `Temasys.Room` object is constructed.
 * - When provided as `-1`, the `Temasys.Room.init()` method will not be invoked, and the method has
 *   to be invoked first by app first before invoking `Temasys.Room.connect()` method.
 * @param {Boolean} [options.requireWebRTC=true] The flag if client requires WebRTC to be supported in
 *   order to start a Room connection session.
 }
 * @param {Promise} return The promise for request completion.
 * @return {Promise}
 * @for Temasys.Room
 * @since 0.7.0
 */
Temasys.Room.prototype.init = function (options) {
  var ref = this;

  var fnEmitInitState = function (state, error) {
    log.debug(['Room', ref._config.name, null, null, 'Init state ->'], state, error || null);
    ref._states.init = state;
    ref._eventManager.emit('initStateChange', state, error || null);
    return error || null;
  };

  ref._supports = {
    webrtc: false,
    codecs: {
      audio: {},
      video: {}
    }
  };

  return new Promise(function (resolve, reject) {
    // Check for socket.io-client supports
    if (!(_globals.io || window.io)) {
      return reject(fnEmitInitState(ref.INIT_STATE_ENUM.ERROR, {
        error: new Error('init(): socket.io-client dependency is not loaded'),
        code: ref.INIT_ERROR_CODE_ENUM.MISSING_SOCKETIO
      }));
    }

    // Check for AdapterJS supports
    if (!(_globals.AdapterJS || window.AdapterJS)) {
      return reject(fnEmitInitState(ref.INIT_STATE_ENUM.ERROR, {
        error: new Error('init(): AdapterJS dependency is not loaded'),
        code: ref.INIT_ERROR_CODE_ENUM.MISSING_ADAPTERJS
      }));
    }

    // Check for XMLHttpRequest API supports
    if (!(window.webrtcDetectedBrowser === 'IE' && [8,9].indexOf(window.webrtcDetectedVersion) > -1 ?
      ['object', 'function'].indexOf(typeof window.XDomainRequest) > -1 :
      typeof window.XMLHttpRequest === 'function')) {
      return reject(fnEmitInitState(ref.INIT_STATE_ENUM.ERROR, {
        error: new Error('init(): XMLHttpRequest (or XDomainRequest for IE 8-9) API is not available'),
        code: ref.INIT_ERROR_CODE_ENUM.XMLHTTPREQUEST_NOT_AVAILABLE
      }));
    }

    (_globals.AdapterJS || window.AdapterJS).webRTCReady(function () {
      if (!window.RTCPeerConnection && ref._config.requireWebRTC) {
        return reject(fnEmitInitState(ref.INIT_STATE_ENUM.ERROR, {
          error: new Error('init(): WebRTC is not supported or available when requested'),
          code: ref.INIT_ERROR_CODE_ENUM.WEBRTC_NOT_AVAILABLE
        }));
      }

      if (window.RTCPeerConnection) {
        // Check if plugin is active and available
        if (['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1) {
          try {
            var pc = new window.RTCPeerConnection(null);
            // IE returns as typeof object
            ref._supports.webrtc = pc.createOffer !== null &&
              ['object', 'function'].indexOf(typeof pc.createOffer) > -1;

            if (ref._config.requireWebRTC) {
              return reject(fnEmitInitState(ref.INIT_STATE_ENUM.ERROR, {
                error: new Error('init(): WebRTC plugin is not available or active'),
                code: ref.INIT_ERROR_CODE_ENUM.PLUGIN_NOT_AVAILABLE
              }));
            }
          } catch (e) {}
        }
      }


    });
  });
};

  /**
   * The Room ID.
   * @attribute id
   * @type String
   * @readOnly
   * @for Room
   * @since 0.7.0
   */
  this.id = null;

  /**
   * The Room name.
   * @attribute name
   * @type String
   * @readOnly
   * @for Room
   * @since 0.7.0
   */
  this.name = null;

  /**
   * The App key ID.
   * @attribute appKey
   * @type String
   * @readOnly
   * @for Room
   * @since 0.7.0
   */
  this.appKey = null;

  



  /**
   * The Auth (API) server domain.
   * @attribute server
   * @type String
   * @readOnly
   * @for Room
   * @since 0.7.0
   */
  this.server = null;

  /**
   * The Auth (API) server protocol.
   * @attribute protocol
   * @type String
   * @readOnly
   * @for Room
   * @since 0.7.0
   */
  this.protocol = null;

  /**
   * The Room session start timestamp in ISO-8601 format.
   * @attribute start
   * @type String
   * @readOnly
   * @for Room
   * @since 0.7.0
   */
  this.start = null;

  /**
   * The Room session duration in hours.
   * @attribute duration
   * @type Number
   * @readOnly
   * @for Room
   * @since 0.7.0
   */
  this.duration = null;

  /**
   * The Room session hash used only for hash based authentication.
   * @attribute hash
   * @type String
   * @readOnly
   * @optional
   * @for Room
   * @since 0.7.0
   */
  this.hash = null;

  /**
   * The flag if Room session has auto-introduce enabled.
   * @attribute autoIntroduce
   * @type Boolean
   * @readOnly
   * @for Room
   * @since 0.7.0
   */
  this.autoIntroduce = true;

  /**
   * The Room session self Peer information.
   * @attribute peer
   * @param {String} id The session Peer ID.
   * @param {String} parentId The session parent Peer ID its linked to.
   * @param {Any} data The session custom data.
   * @param {Number} priorityWeight The session Peer priority weight.
   * @param {Boolean} isPrivileged The flag if session Peer has privileged access.
   * @param {JSON} agent The session Peer agent information.
   * @param {String} agent.name The session Peer agent name.
   * @param {String} agent.version The session Peer agent version.
   * @param {String} agent.os The session Peer agent platform.
   * @param {String} [agent.pluginVersion] The session Peer agent Temasys WebRTC version.
   * @param
   * @type JSON
   * @readOnly
   * @for Room
   * @since 0.7.0
   */
  this.peer = {
    id: null,
    peerId: null,
    data: null,
    priorityWeight: null,
    isPrivileged: false,
    agent: {
      name: window.webrtcDetectedBrowser,
      version: (window.webrtcDetectedVersion || 0).toString(),
      os: window.navigator.platform,
      pluginVersion: globals.AdapterJS && globals.AdapterJS.WebRTCPlugin &&
        globals.AdapterJS.WebRTCPlugin.plugin && globals.AdapterJS.WebRTCPlugin.plugin.VERSION
    }
  };

  /**
   * The WebRTC supports of the browser or device.
   * @attribute webrtcSupports
   * @param {Boolean} enabled The flag if WebRTC is enabled for this browser or device.
   * @param {JSON} audioCodecs The list of supported audio codecs.
   * @param {Array} audioCodecs.#codec The list of the sampling rate and its channels the audio codec supports.
   * @param {String} audioCodecs.#codec.#index The audio codec supported sampling rate and its channel item.
   *   Format is `samplingRate/channels`.
   * @param {JSON} videoCodecs The list of supported video codecs.
   * @param {Array} videoCodecs.#codec The list of the sampling rate the video codec supports.
   * @param {String} videoCodecs.#codec.#index The video codec supported sampling rate and its channel item.
   *   Format is `samplingRate`.
   * @param {Boolean} dataChannel The flag if Datachannel connections is supported for this browser or device.
   * @param {String} [dataChannelBinaryType] The Datachannel binary type interface it supports.
   * @type JSON
   * @readOnly
   * @for Room
   * @since 0.7.0
   */
  this.webrtcSupports = {
    enabled: false,
    audioCodecs: {},
    videoCodecs: {},
    dataChannel: false,
    dataChannelBinaryType: null,
    iceRestart: !(window.webrtcDetectedBrowser === 'firefox' && window.webrtcDetectedVersion < 48)
  };

  /**
   * The current Room session connection status.
   * @attribute current
   * @param {String} peerId The User Peer session ID.
   * @param {String} authState The Room authentication state.
   * @param {Boolean} connected The flag if User is connected to the Room.
   * @param {Boolean} locked The flag if Room is locked.
   * @param {Boolean} isMCUEnabled The flag if Room has MCU enabled for Peer connections.
   * @type JSON
   * @readOnly
   * @for Room
   * @since 0.7.0
   */
  this.current = {
    initState: null,
    authState: null,
    sessionState: null,
    connected: false,
    locked: false,
    isMCUEnabled: false
  };

  // Private variables
  this._session = null;
  this._peers = {};
  this._socket = null;
  this._defaultStream = null;
  this._config = {
    iceServers: [],
    requireWebRTC: options.requireWebRTC !== false,
    autoInit: options.autoInit !== false,
    priorityWeightScheme: null,
    defaultSettings: {
      enableIceTrickle: true,
      enableDataChannel: true,
      connection: {

      }
    }
  };


  // Events
  /**
   * Event triggered when Room authentication state has changed.
   * @event authState
   * @param {String} state The current authentication state.
   *   References the {{#crossLink "Socket/AUTH_STATE_ENUM:attribute"}}{{/crossLink}} enum attribute.
   * @param {JSON} error The error.
   *   This is defined when `state` value is `STATE_ENUM.ERROR`.
   * @param {Error} error.error The error object.
   * @param {Number} error.code The error code.
   *   References the {{#crossLink "Socket/AUTH_ERROR_CODE_ENUM:attribute"}}{{/crossLink}} enum attribute.
   * @param {Number} error.httpStatus The returned HTTP status.
   * @for Room
   * @since 0.7.0
   */
  /**
   * Event triggered when Room init state has changed.
   * @event initState
   * @param {String} state The current init state.
   *   References the {{#crossLink "Socket/INIT_STATE_ENUM:attribute"}}{{/crossLink}} enum attribute.
   * @param {JSON} error The error.
   * @param {Error} error.error The error object.
   * @param {Number} error.code The error code.
   *   References the {{#crossLink "Socket/INIT_ERROR_CODE_ENUM:attribute"}}{{/crossLink}} enum attribute.
   * @for Room
   * @since 0.7.0
   */
  /**
   * Event triggered when Room session state has changed.
   * @event sessionState
   * @param {String} state The current init state.
   *   References the {{#crossLink "Socket/INIT_STATE_ENUM:attribute"}}{{/crossLink}} enum attribute.
   * @param {JSON} error The error.
   * @param {Error} error.error The error object.
   * @param {Number} error.code The error code.
   *   References the {{#crossLink "Socket/INIT_ERROR_CODE_ENUM:attribute"}}{{/crossLink}} enum attribute.
   * @for Room
   * @since 0.7.0
   */
  /**
   * Event triggered when there are exceptions thrown in this event handlers.
   * @event domError
   * @param {Error} error The error object.
   * @for Socket
   * @since 0.7.0
   */
  (function (ref) {
    /**
     * Function to subscribe to an event.
     * @method on
     * @param {String} event The event to subscribe to once.
     * @param {Function} callback The callback listener function.
     * @for Room
     * @since 0.7.0
     */
    ref.on = ref._event.on;

    /**
     * Function to subscribe to an event once.
     * @method once
     * @param {String} event The event to subscribe to once.
     * @param {Function} callback The callback listener function.
     * @param {Function} [condition] The condition function that is called when
     *   event is triggered. If condition is met (when function returns `true`), the
     *   callback listener function is triggered.
     *   The default is `function () { return true; }`.
     * @param {Boolean} [fireAlways] The flag if callback listener function should always
     *   be triggered regardless as long as condition function is met.
     *   The default is `false`.
     * @for Room
     * @since 0.7.0
     */
    ref.once = ref._event.once;

    /**
     * Function to unsubscribe to events.
     * @method off
     * @param {String} [event] The specified event to unsubscribe.
     *   When not provided, it will unsubscribe all event callback listener functions.
     * @param {Function} [callback] The specified callback listener function based on
     *   the provided event to unsubscribe only.
     *   When not provided, it will unsubscribe all callback listener functions subscribed to the event.
     * @for Room
     * @since 0.7.0
     */
    ref.off = ref._event.off;

    // Catch errors to prevent issues for Room connection
    ref._event.catch(function (error) {
      ref._event.emit('domError', error);
    });

    if (ref._config.autoInit) {
      setTimeout(function () {
        ref.init();
      }, 1);
    }
  })(this);

  options = options && typeof options === 'object' ? options : {};

  //
  if (!(options.appKey && typeof options.appKey === 'string')) {
    throw new Error('')
  }
};

/**
 * The Room SM protocol version supports.
 * @attribute SM_PROTOCOL_VERSION
 * @type String
 * @readOnly
 * @final
 * @for Room
 * @since 0.7.0
 */
Temasys.Room.prototype.SM_PROTOCOL_VERSION = '0.1.2.3';

/**
 * The Room DT protocol version supports.
 * @attribute DT_PROTOCOL_VERSION
 * @type String
 * @readOnly
 * @final
 * @for Room
 * @since 0.7.0
 */
Room.prototype.DT_PROTOCOL_VERSION = '0.1.3';



/**
 * The enum of Room authentication states, in which is used to validate the App Key ID before starting a session.
 * @attribute AUTH_STATE_ENUM
 * @param {Number} LOADING The state when Room is authenticating.
 * @param {Number} COMPLETED The state when Room has been authenticated successfully.
 * @param {Number} ERROR The state when Room failed to authenticate.
 * @type JSON
 * @readOnly
 * @final
 * @for Room
 * @since 0.7.0
 */
Room.prototype.AUTH_STATE_ENUM = {
  LOADING: 1,
  COMPLETED: 2,
  ERROR: -1
};

/**
 * The enum of Room authentication error codes.
 * @attribute AUTH_ERROR_CODE_ENUM
 * @param {Number} API_INVALID The error code when configured App Key does not exists.
 * @param {Number} API_DOMAIN_NOT_MATCH The error code when App Key `"domainName"` setting does not
 *   match accessing server IP address.
 * @param {Number} API_CORS_DOMAIN_NOT_MATCH The error code when App Key `"corsurl"` setting does not
 *   match app accessing CORS.
 * @param {Number} API_CREDENTIALS_INVALID The error code when there is no CORS present in the
 *   HTTP headers when required.
 * @param {Number} API_CREDENTIALS_NOT_MATCH The error code when `.authCreds.hash` does not match
 *   the Auth (API) server generated hash as part of authentication.
 * @param {Number} API_INVALID_PARENT_KEY The error code when configured App Key does not belong to any active Apps.
 * @param {Number} API_NO_MEETING_RECORD_FOUND The error code when persistent Room enabled App Key does not
 *   have any matching scheduled meetings as matched from the `.authCreds` setting.
 * @param {Number} API_OVER_SEAT_LIMIT The error code when App Key has reached its concurrent users limit.
 * @param {Number} API_RETRIEVAL_FAILED The error code when App Key encounters server errors during retrieval.
 * @param {Number} API_WRONG_ACCESS_DOMAIN The error code when `.server` is using
 *  `"https://developer.temasys.com.sg"` domain to authenticate App Key.
 * @param {Number} XML_HTTP_REQUEST_ERROR The error code when HTTP request failed to receive expected response.
 * @param {Number} NOT_INIT The error code when {{#crossLink "Room/init:method"}}{{/crossLink}} is not called
 *   before attempting {{#crossLink "Room/connect:method"}}{{/crossLink}} method.
 * @type JSON
 * @readOnly
 * @final
 * @for Room
 * @since 0.7.0
 */
Room.prototype.AUTH_ERROR_CODE_ENUM = {
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
  NOT_INIT: -2
};

/**
 * The enum of Room connection session states.
 * @attribute SESSION_STATE_ENUM
 * @param {String} CONNECTING The state when Room connection session is attempting to start.
 * @param {String} CONNECT The state when Room connection session has started.
 * @param {String} REJECT The state when Room connection session was terminated from server.
 * @param {String} WARNING The state when Room connection session is warned which might result in
 *   `REJECT` state if not closely followed.
 * @param {String} DISCONNECT The state when Room connection session has ended.
 * @param {String} CONNECT_ERROR The state when Room connection session failed to start due
 *   to socket connection errors.
 * @type JSON
 * @readOnly
 * @final
 * @for Room
 * @since 0.7.0
 */
Room.prototype.SESSION_STATE_ENUM = {
  CONNECTING: 'connecting',
  CONNECT: 'connect',
  REJECT: 'reject',
  WARNING: 'warning',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connectError'
};

/**
 * The enum of Room connection session error codes.
 * @attribute SESSION_ERROR_ENUM
 * @param {String} CREDENTIALS_EXPIRED The error code when Room connection session failed to start
 *   because session credentials returned from Auth (API) has already expired.
 * @param {String} CREDENTIALS_ERROR The error code when Room connection session failed to start
 *   because session credentials returned from Auth (API) was invalid.
 * @param {String} DUPLICATED_LOGIN The error code when Room connection session failed to start
 *   because session credentials returned from Auth (API) has already been used.
 * @param {String} ROOM_NOT_STARTED The error code when Room connection session failed to start
 *   because session has not yet started based on the provided `.start`.
 * @param {String} EXPIRED The error code when Room connection session failed to start because it has already ended.
 * @param {String} ROOM_LOCKED The error code when Room connection session failed to start because the Room is locked.
 * @param {String} FAST_MESSAGE The error code that serves as a warning to current Room connection session
 *   as User is flooding the servers with lots of several socket messages. This might result in the User's Room
 *   connection session being terminated and messages sent to be dropped.
 * @param {String} ROOM_CLOSING The error code that serves as a warning to current Room connection session
 *   that the Room session is ending soon.
 * @param {String} ROOM_CLOSED The error code when current Room connection session has ended.
 * @param {String} SERVER_ERROR The error code when Room connection session failed to start
 *   because of internal server exceptions encountered while attempting to start.
 * @param {String} KEY_ERROR The error code when Room connection session failed to start
 *   because of some internal technical error pertaining to App Key initialisation.
 * @type JSON
 * @readOnly
 * @final
 * @for Room
 * @since 0.7.0
 */
Room.prototype.SESSION_ERROR_ENUM = {
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
 * Function to get and check the connection availability.
 * @method getConnectionAvailability
 * @param {Function} callback 
 */
Room.prototype.getConnectionAvailability = function () {
  var ref = this;

  
};

/**
 * Function to start initialising Room dependencies.
 * @method init
 * @param {Function} callback The callback function for async code execution.
 *   Returns a format of: <code>function([error])</code>
 * @param {JSON} [callback.error] The error.
 *   This is only defined if there are errors in code execution.
 *   The object signature matches the {{#crossLink "Room/initState:event"}}{{/crossLink}}
 *   event `error` payload parameter.
 * @async
 * @for Room
 * @since 0.7.0
 */
Room.prototype.init = function (fn) {
  var ref = this;

  if (typeof fn === 'function') {
    ref.once('initState', function (state, error) {
      if (error) {
        return fn(error);
      }
      fn(null);
    }, function (state) {
      return [ref.INIT_STATE_ENUM.ERROR, ref.INIT_STATE_ENUM.COMPLETED].indexOf(state) > -1;
    });
  }

  var fnUpdate = function (state, error) {
    ref.current.initState = state;
    ref._event.emit('initState', state, error);
  };

  fnUpdate(ref.INIT_STATE_ENUM.LOADING);

  // Make sure AdapterJS is loaded
  if (!(globals.AdapterJS && typeof globals.AdapterJS === 'object' &&
    globals.AdapterJS.webRTCReady && typeof globals.AdapterJS.webRTCReady === 'function')) {
    return fnUpdate(ref.INIT_STATE_ENUM.ERROR, {
      error: new Error('AdapterJS version @@adapterjsVersion is required to be loaded first'),
      code: ref.INIT_ERROR_CODE_ENUM.ADAPTER_NO_LOADED
    });
  }

  // Make sure socket.io-client is loaded
  if (!(globals.io && typeof globals.io === 'object' && typeof globals.io.connect === 'function')) {
    return fnUpdate(ref.INIT_STATE_ENUM.ERROR, {
      error: new Error('socket.io-client version @@socketioVersion is required to be loaded first'),
      code: ref.INIT_ERROR_CODE_ENUM.NO_SOCKET_IO
    });
  }

  // Make sure XMLHttpRequest is loaded
  if (!window.XMLHttpRequest && ['object', 'function'].indexOf(typeof window.XDomainRequest) === -1) {
    return fnUpdate(ref.INIT_STATE_ENUM.ERROR, {
      error: new Error('socket.io-client version @@socketioVersion is required to be loaded first'),
      code: ref.INIT_ERROR_CODE_ENUM.NO_SOCKET_IO
    });
  }

  // Start initialising plugin WebRTC functionalities or screensharing overrides
  globals.AdapterJS.webRTCReady(function () {
    var isPluginUnavailableError = false;
    // Check if plugin is available first
    if (window.RTCPeerConnection) {
      if (['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1) {
        isPluginUnavailableError = true;
        try {
          var p = new window.RTCPeerConnection(null);
          // IE returns as typeof object
          ref.webrtcSupports.enabled = ['object', 'function'].indexOf(
            typeof p.createOffer) > -1 && p.createOffer !== null;
        } catch (e) {
          ref.webrtcSupports.enabled = false;
        }
      } else {
        ref.webrtcSupports.enabled = true;
      }
    } else {
      ref.webrtcSupports.enabled = true;
    }

    if (ref._config.requireWebRTC) {
      return fnUpdate(ref.INIT_STATE_ENUM.ERROR, {
        error: new Error(isPluginUnavailableError ? 'WebRTC plugin is inactive, please activate it' :
          'WebRTC is not supported on this browser or device when required'),
        code: ref.INIT_ERROR_CODE_ENUM[isPluginUnavailableError ? 'PLUGIN_NOT_AVAILABLE' : 'NO_WEBRTC_SUPPORT']
      });
    }

    // TODO: Retrieve and parse the codes available..
    if (ref.webrtcSupports.enabled) {
      ref._getCodecsSupport(function (error) {
        if (error) {
          return fnUpdate(ref.INIT_STATE_ENUM.ERROR, {
            error: error,
            code: ref.INIT_ERROR_CODE_ENUM.PARSE_CODECS
          });
        }
        fnUpdate(ref.INIT_STATE_ENUM.COMPLETED);
      });
    }
  });
};

/**
 * Function to start Room session connection.
 * @method connect
 * @param {JSON} [options] The options.
 * @param {String} [options.server] The Auth (API) server domain to connect to.
 *   The default is based on the preset server domain.
 * @param {String} [options.protocol] The Auth (API) server protocol to connect to.
 *   The default is the value of the current accessing `window.location.protocol`.
 * @param {JSON} [options.authCreds] The credentials for hash based authentication.
 *   If this is not provided, the Auth (API) server will authenticate by checking if the CORS url
 *   configuration from the App Key matches the CORS domain from accessing app.
 * @param {String} [options.authCreds.start] The starting DateTime stamp in ISO-8601 string for the Room session connection.
 * @param {Number} [options.authCreds.duration] The duration in hours for the Room session connection.
 *   The maximum duration is `24` hours.
 * @param {String} [options.authCreds.hash] The base64 encoded HMAC-SHA1 hash generated from the starting
 *   DateTime stamp, duration, Room name and App Key secret.
 *   Please ensure that the string encodes escape characters for URI ready strings.
 * @param {JSON} [options.socket] The socket connecton configuration.
 *   This references the Socket class constructor options.
 * @param {JSON} [options.peer] The Peer connecton configuration.
 *   This references the Peer class constructor options.
 * @param {Function} callback The callback function for async code execution.
 *   Returns a format of: <code>function([error])</code>
 * @param {JSON} [callback.error] The error.
 *   This is only defined if there are errors in code execution.
 * @param {String} callback.error.eventName The event name that caused the error.
 * @param {JSON} callback.error.error The error.
 *   The object signature matches the event based on the `error.eventName`
 *   `error` payload parameter or the socket connection error object.
 * @async
 * @for Room
 * @since 0.7.0
 */
Room.prototype.connect = function (stream, options, fn) {
  var ref = this;

  if (typeof options === 'function') {
    fn = options;
    options = null;
  }

  options = options || {};

  ref.server = options.server && typeof options.server === 'string' ? options.server : 'api.temasys.io';
  ref.protocol = options.protocol && typeof options.protocol === 'string' &&
    options.protocol.indexOf(':') === (options.protocol.length - 1) ? options.protocol : window.location.protocol;
  ref.hash = null;

  if (options.authCreds && typeof options.authCreds === 'object' && options.authCreds.hash &&
    typeof options.authCreds.hash === 'string' && typeof options.authCreds.duration === 'number' &&
    options.authCreds.start && typeof options.authCreds.start === 'string') {
    ref.hash = options.authCreds.hash;
    ref.start = options.authCreds.start;
    ref.duration = options.authCreds.duration;
  }

  /**
   * Internal function to update and trigger state.
   */
  var isFnTriggered = false;
  var fnUpdate = function (eventName, state, error) {
    ref.current[eventName] = state;
    ref._event.emit(eventName, state, error);
    // Trigger the callback
    if (typeof fn === 'function' && !isFnTriggered && ((eventName === 'sessionState' &&
      [ref.SESSION_STATE_ENUM.REJECT, ref.SESSION_STATE_ENUM.CONNECT_ERROR].indexOf(state) > -1) ||
      (eventName === 'authState' && state === ref.AUTH_STATE_ENUM.ERROR))) {
      isFnTriggered = true;
      fn({
        type: eventName,
        error: error
      });
    }
  };

  if (!ref.current.initState) {
    return fnUpdate('authState', ref.AUTH_STATE_ENUM.ERROR, {
      error: new Error('.init() must be called first before .connect()'),
      code: ref.AUTH_ERROR_CODE_ENUM.NOT_INIT
    });
  }

  var xhr = new XMLHttpRequest();

  /**
   * Internal function to load XHR response.
   */
  var fnParseResponse = function (evt) {
    var response = JSON.parse(xhr.response || xhr.responseText || '{}');

    if (!response.success) {
      return fnUpdate('authState', ref.READY_STATES.ERROR, {
        httpStatus: xhr.status || -1,
        error: evt.error && typeof evt.error === 'object' ? evt.error :
          new Error(response.info || 'HTTP request error timeout'),
        code: response.error || ref.AUTH_ERROR_CODE_ENUM.XML_HTTP_REQUEST_ERROR
      });
    }

    ref.start = response.start;
    ref.duration = response.len;
    ref.id = response.room_key;
    ref.isPrivileged = response.isPrivileged === true;
    ref.autoIntroduce = response.autoIntroduce !== false;
    ref._session = response;

    fnUpdate('authState', ref.AUTH_STATE_ENUM.COMPLETED);

    ref._socket = new Socket(options.socket || {}, {
      server: response.ipSigserver,
      httpsPorts: response.httpsPortList,
      httpPorts: response.httpPortList
    });

    ref._socket.on('message', function (message, error, isSelf) {
      if (!isSelf) {
        ref._handleSMProtocol(message, false);
      }
    });

    ref._event.emit('socket', ref._socket);
    ref._socket._connect(function (error) {
      if (error) {
        return fnUpdate('sessionState', ref.SESSION_STATE_ENUM.ERROR, {
          error: new Error('Failed starting socket connection'),
          code: ref.SESSION_ERROR_ENUM.CONNECT_ERROR
        });
      } else if (typeof fn === 'function') {
        ref.once('sessionState', function (state, error) {
          if (error) {
            return fn(error);
          }
          fn(null);
        }, function (state, error) {
          return [ref.SESSION_STATE_ENUM.CONNECT, ref.SESSION_STATE_ENUM.REJECT].indexOf(state) > -1;
        });
      }

      ref._handleSMProtocol({ type: 'joinRoom' }, function (error) {
        fnUpdate('sessionState', ref.SESSION_STATE_ENUM.ERROR, {
          error: new Error('Failed sending socket message to start'),
          code: ref.SESSION_ERROR_ENUM.CONNECT_ERROR
        });
      });
    });
  };

  if (['object', 'function'].indexOf(window.XDomainRequest) > -1) {
    xhr = new XDomainRequest();
  }

  xhr.onload = fnParseResponse;
  xhr.onerror = fnParseResponse;

  xhr.open('GET', ref.protocol + '//' + ref.server + '/api/' + ref.appKey + '/' + ref.name + (ref.hash ?
    '/' + ref.start + '/' + ref.duration + '?&cred=' + ref.hash + '&rand=' + Date.now() : '?&rand=' + Date.now()), true);
  xhr.send();
};

/**
 * Function to update the default stream or self Peer data.
 * @method update
 * @param 

/**
 * Function to parse and retrieve codecs support.
 */
Room.prototype._getCodecsSupport = function (fn) {
  var ref = this;

  ref.webrtcSupports.audioCodecs = {};
  ref.webrtcSupports.videoCodecs = {};
  ref.webrtcSupports.dataChannel = false;

  if (!ref.webrtcSupports.enabled) {
    if (ref._config.requireWebRTC) {
      return fn(new Error('WebRTC is not supported on this browser or device when required'));
    }
    return fn(null);
  }

  try {
    if (window.webrtcDetectedBrowser === 'edge') {
      Utils.forEach(window.RTCRtpSender.getCapabilities().codecs, function (codec) {
        if (['audio','video'].indexOf(codec.kind) > -1 && codec.name) {
          ref.webrtcSupports[codec.kind === 'audio' ? 'audioCodecs' : 'videoCodecs'][
            codec.name.toLowerCase()] = codec.clockRate + (codec.kind === 'audio' ?
            '/' + (codecs[i].numChannels > 1 ? codecs[i].numChannels : 1) : '');
        }
      });
      return fn(null);
    }

    var pc = new RTCPeerConnection(null);
    var channel = pc.createDataChannel('test');

    ref.webrtcSupports.dataChannel = true;
    ref.webrtcSupports.dataChannelBinaryType = channel.binaryType && typeof channel.binaryType === 'string' ?
      (channel.binaryType.indexOf('array') > -1 ? 'arraybuffer' : channel.binaryType) : null;

    pc.createOffer(function (offer) {
      var mediaType = '';
      Utils.forEach(offer.sdp.split('\r\n'), function (line) {
        if (line.indexOf('m=') === 0) {
          mediaType = (line.split('m=')[1] || '').split(' ')[0];
          return;
        } else if (mediaType && ['audio', 'video'].indexOf(mediaType) > -1 && line.indexOf('a=rtpmap:') === 0) {
          var parts = (line.split(' ')[1] || '').split('/');
          ref.webrtcSupports.audioCodecs[parts[0].toLowerCase()] = parts[1] + (mediaType === 'audio' ?
            (parts[2] ? '/' + parts[2] : 1) : '');
        }
      });
    }, fn, ['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1 ? {
      mandatory: { OfferToReceiveVideo: true, OfferToReceiveAudio: true }
    } : { offerToReceiveAudio: true, offerToReceiveVideo: true });

  } catch (error) {
    fn(error);
  }
};

/**
 * Function to handle SM protocol for sending direction.
 */
Room.prototype._constructProtocolMessage = function (params, fn) {
  var ref = this;
  var message = {
    type: params.type,
    rid: ref.id
  };

  /**
   * "joinRoom" - Connects to the Room.
   */
  if (params.type === 'joinRoom') {
    message.uid = ref._session.username;
    message.apiOwner = ref._session.apiOwner;
    message.cid = ref._session.cid;
    message.isPrivileged = ref.isPrivileged;
    message.autoIntroduce = ref.autoIntroduce;
    message.key = ref.appKey;
    message.len = ref._session.len;
    message.roomCred = ref._session.roomCred;
    message.start = ref._session.start;
    message.timeStamp = ref._session.timeStamp;
    message.userCred = ref._session.userCred;

  /**
   * "enter" - Broadcasts to existing Peers in the Room we exist.
   * "welcome" - Respond to Peer who sent "enter" about who we are.
   * "restart" - Re-negotiation request.
   */
  } else if (['enter', 'welcome', 'restart'].indexOf(params.type)) {
    message.mid = ref.user.id;
    message.
  }
};

/**
 * Function to handle SM protocol for receiving direction.
 */
Room.prototype._processProtocolMessage = function (message) {

};



  /**
   * SM protocol: "joinRoom"
   */
  if (params.type === 'joinRoom') {
    fnSend({
      type: 'joinRoom',

    });
  /**
   * SM protocol: "inRoom"
   */
  } else if (params.type === 'inRoom') {
    ref.current.peerId = params.sid;
    ref.current.peerPriorityWeight =
    ref._config.iceServers = params.pc_config.iceServers;
    // Broadcast "enter" if auto-introduce is enabled
    if (ref.autoIntroduce) {
      ref._handleSMProtocol({
        type: 'enter'
      });
    }
  /**
   * SM protocol: "enter"
   */
  } else if (['welcome', 'restart', 'enter'].indexOf(params.type) > -1) {
    if (fn) {
      fnSend({
        type: params.type,
        agent: window.webrtcDetectedBrowser,
        version: (window.webrtcDetectedVersion || 0).toString(),
        os: window.navigator.platform,
        userInfo: self._getUserInfo(),
        receiveOnly: !ref._stream,
        weight: self._peerPriorityWeight,
        temasysPluginVersion: AdapterJS.WebRTCPlugin.plugin ? AdapterJS.WebRTCPlugin.plugin.VERSION : null,
        enableIceTrickle: self._enableIceTrickle,
        enableDataChannel: self._enableDataChannel,
        enableIceRestart: self._enableIceRestart,
        SMProtocolVersion: self.SM_PROTOCOL_VERSION,
        DTProtocolVersion: self.DT_PROTOCOL_VERSION
      });
    } else {

    }
  }

  if (isSelf) {

  }

  if (isSend) {
    if (type === 'joinRoom' && ref._creds) {
      message.uid = ref._creds.username;
      message.apiOwner = ref._creds.apiOwner;
      message.cid = ref._creds.cid;
      message.isPrivileged = ref._creds.isPrivileged === true;
      message.autoIntroduce = ref._creds.autoIntroduce !== false;
      message.key = ref.appKey;
      message.len = ref._creds.len;
      message.roomCred = ref._creds.roomCred;
      message.start = ref._creds.start;
      message.timeStamp = ref._creds.timeStamp;
      message.userCred = ref._creds.userCred;
      message.rid = ref.id;
      message.type = type;
    } else if (type === 'welcome' || type === 'enter') {
      message.rid = ref.id;
      message.mid = ref.session.id;
      message.type = type;
    }
    console.info(type, message);
    if (ref._socket) {
      ref._socket._send(message);
    }
  } else {
    if (type === 'group') {
      message.lists.forEach(function (itemMsgStr) {
        ref._processSMProtocol(JSON.parse(itemMsgStr));
      });
    } else if (type === 'inRoom') {
      ref.session.id = message.sid;
      ref._processSMProtocol('enter', {}, true);
    } else if (type === 'enter') {
      ref._peers[message.mid] = message;
      ref._processSMProtocol('welcome', {
        target: message.mid
      }, true);
    } else if (type === 'welcome') {
      ref._peers[message.mid] = message;
    }
  }
};

globals.Room = Room;

/**
 * Handles the Socket connection to the Signaling server.
 * @class Temasys.Socket
 * @param {JSON} options The options.
 * - Note that configuring these settings may result in connection failures.
 *   Please configure them only for debugging purposes only.
 * @param {Array} [options.servers] The list of Signaling servers to attempt to connect to.
 * - When not provided, the default values returned from Auth server is used.
 * @param {JSON} [options.servers._index] The Signaling server.
 * @param {String} options.servers._index.server The Signaling server domain.
 * @param {Number} options.servers._index.port The Signaling server port.
 * @param {String} [options.servers._index.protocol] The Signaling server protocol.
 * - When not provided, the value is the current accessing `window.location.protocol`.
 * @param {String} [options.servers._index.path] The Signaling server path.
 * - When not provided, the value is `/socket.io`.
 * @param {Boolean} [options.servers._index.reconnection] The flag if socket connection should
 *   reconnect several attempts for the current transport or port used before switching to the next
 *   available transport or port available.
 * - When not provided, the value is `false` (`true` if `.transport` is `TRANSPORT_ENUM.POLLING`).
 * @param {Number} [options.servers._index.reconnectionAttempts] The reconnection attempts to take if
 *   `options.options.index.reconnection` is enabled.
 * - The maximum value that can be provided is `5`.
 * - When not provided, the value is `0` (`4` if `.transport` is `TRANSPORT_ENUM.POLLING`).
 * @param {Number} [options.servers._index.reconnectionDelay] The number of miliseconds to wait before
 *   starting the next reconnection attempt, which is affected by the `randomizationFactor` configured.
 * - When not provided, the value is `2000`.
 * @param {Number} [options.servers._index.reconnectionDelayMax] The maximum number of miliseconds to wait
 *   before starting the next reconnection attempt.
 * - When not provided, the value is `2000` (`1000` if `.transport` is `TRANSPORT_ENUM.POLLING`).
 * @param {Number} [options.servers._index.randomizationFactor] The randomization for each reconnection attempt.
 * - When not provided, the value is `0.5`, and the range is from `0` to `1`.
 * @param {Number} [options.servers._index.timeout] The timeout in miliseconds to consider
 *   that the inital connection has timed out.
 * - When not provided, the value is `20000`.
 * @param {String} [options.servers._index.transport] The transport type.
 * - This references the `TRANSPORT_ENUM` constant.
 * - When not provided, the value is `TRANSPORT_ENUM.WEBSOCKET` or `TRANSPORT_ENUM.POLLING` if
 *   [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) is not supported.
 * @param {JSON} [options.data] The data settings.
 * @param {Boolean} [options.data.compress] The flag if sending data should be compressed if feature
 *   is available on connected Signaling server.
 * - When not provided, the value is `false`.
 * @param {Number} [options.data.priorityInterval] The interval between each priority SM protocol messages sent in queue.
 * - When not provided, the value is `10`.
 * @constructor
 * @private
 * @since 0.7.0
 */
Temasys.Socket = function (options, defaultOptions) {
  var ref = this;

  // Set the event manager
  ref._eventManager = Temasys.Utils.createEventManager();
  // Set the component ID
  ref._componentId = _log.configure(null, function (fn) {
    ref._eventManager.catchExceptions(typeof fn === 'function' ? function (error) {
      fn(ref._componentId, error);
    } : null);
  });

  // Stores the socket data settings
  ref._data = {
    compress: false,
    queue: {
      buffer: [[],[]],
      timer: null,
      sentTimestamp: 0,
      priorityInterval: 10
    },
    status: {
      updateUserEvent: 0,
      muteAudioEvent: 0,
      muteVideoEvent: 0
    },
    session: {
      roomId: null,
      peerId: null
    }
  };

  // Stores the list of fallback options
  ref._servers = [];

  // Stores the socket current state
  ref._state = {
    serverIndex: -1,
    connectionState: '',
    activeState: '',
    connected: false,
    triggered: {},
    options: {
      url: null,
      settings: null
    }
  };

  // Stores the socket stats
  ref._stats = {
    messages: {
      send: { total: 0, errors: 0 },
      recv: { total: 0, errors: 0 }
    },
    connection: {
      reconnections: {
        total: 0,
        servers: []
      },
      pings: { total: 0 },
      pongs: {
        total: 0,
        latency: {
          total: null,
          highest: null,
          lowest: null
        }
      }
    }
  };

  // Stores the socket.io-client object
  ref._connection = null;
  ref._setConfig(options, defaultOptions);

  /**
   * Event triggered when connection state has been changed.
   * @event connectionStateChange
   * @param {String} state The current connection state.
   * - This references `CONNECTION_STATE_ENUM` constant.
   * @param {Error} error The error object.
   * - This is defined when `state` is `RECONNECT_FAILED`, `RECONNECT_END`, `CONNECT_ERROR`.
   * @param {JSON} current The current settings.
   * @param {Number} current.attempts The current reconnection attempt for server item.
   * @param {Number} current.serverIndex The server item index of the server items configured.
   * @param {String} current.url The socket.io-client url used.
   * @param {JSON} current.options The socket.io-client options used.
   * - References the [socket.io-client documentation for `options`](https://socket.io/docs/client-api/#new-manager-url-options).
   * @for Temasys.Socket
   * @since 0.7.0
   */
  /**
   * Event triggered when connection active state has been changed.
   * @event activeStateChange
   * @param {String} state The current active state.
   * - This references `STATE_ENUM` constant.
   * @param {Number} date The current date time in milliseconds.
   * @param {Number} [latency] The response time latency.
   * - This is defined only when `state` is `ACTIVE_STATE_ENUM.PONG`.
   * @for Temasys.Socket
   * @since 0.7.0
   */
  /**
   * Event triggered when message is sent or received.
   * @event message
   * @param {JSON|String} message The message object.
   * - When defined as type of `String`, it could indicate that received message has parsing errors.
   * @param {Error} [error] The error object.
   * - This is defined only when parsing of received message or when sending message has errors.
   * @param {Boolean} isSelf The flag if self is sending the message.
   * @for Temasys.Socket
   * @since 0.7.0
   */

   ref.on = ref._eventManager.on;
   ref.once = ref._eventManager.once;
   ref.off = ref._eventManager.off;
};

/**
 * The enum of transport types.
 * @attribute TRANSPORT_ENUM
 * @param {String} WEBSOCKET The transport type that uses the 
 *   [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API).
 * @param {String} POLLING The transport type that uses polling that uses the 
 *   [XMLHttpRequest API](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest).
 * @type JSON
 * @final
 * @readOnly
 * @for Temasys.Socket
 */
Temasys.Socket.prototype.TRANSPORT_ENUM = {
  WEBSOCKET: 'websocket',
  POLLING: 'polling'
};

/**
 * The enum of connection states.
 * @attribute CONNECTION_STATE_ENUM
 * @param {String} CONNECTING The state when attempting to start connection for a new server item.
 * @param {String} RECONNECT_FAILED The state when failed to reconnect after all reconnection attempts.
 * @param {String} RECONNECT_ERROR The state when a reconnection attempt failed.
 * @param {String} RECONNECT_ATTEMPT The state when starting a reconnection attempt.
 * @param {String} RECONNECT The state when connected after reconnection attempts.
 * @param {String} CONNECT_ERROR The state when attempt to start connection fails and reconnection may occur if enabled.
 * @param {String} CONNECT_START_ERROR The state when attempt to construct connection for starting failed.
 * @param {String} CONNECT The state when connected.
 * @param {String} DISCONNECT The state when disconnected.
 * @param {String} TERMINATE The state when there is no more new server items to start connection.
 * @param {String} ERROR The state when there are connection errors when connected.
 * @type JSON
 * @readOnly
 * @final
 * @for Temasys.Socket
 * @since 0.7.0
 */
Temasys.Socket.prototype.CONNECTION_STATE_ENUM = {
  RECONNECT_ATTEMPT: 'reconnect_attempt',
  RECONNECT_FAILED: 'reconnect_failed',
  RECONNECT_ERROR: 'reconnect_error',
  //RECONNECTING: 'reconnecting',
  RECONNECT: 'reconnect',
  //CONNECT_TIMEOUT: 'connect_timeout',
  CONNECT_ERROR: 'connect_error',
  CONNECT: 'connect',
  CONNECTING: 'connecting',
  DISCONNECT: 'disconnect',
  CONNECT_START_ERROR: 'connect_start_error',
  TERMINATE: 'terminate',
  ERROR: 'error'
};

/**
 * The enum of connection active state after connected.
 * @attribute ACTIVE_STATE_ENUM
 * @param {String} PING The state when "ping" packet is written out to the server.
 * @param {String} PONG The state when  "pong" packet is received from the server.
 * @type JSON
 * @final
 * @readOnly
 * @for Temasys.Socket
 */
Temasys.Socket.prototype.ACTIVE_STATE_ENUM = {
  PING: 'ping',
  PONG: 'pong'
};

/**
 * Function that returns the Socket configuration.
 * - These are data configured when constructing `new Temasys.Socket()` object.
 * @method getConfig
 * @param {JSON} return The result.
 * - Object signature matches `options` in `new Temasys.Socket()`.
 * @return {JSON}
 * @example
 *   var config = socket.getConfig();
 *   console.log("Configuration ->", config);
 * @for Temasys.Socket
 * @since 0.7.0
 */
Temasys.Socket.prototype.getConfig = function () {
  var ref = this;
  return {
    servers: (function () {
      var servers = [];
      Temasys.Utils.forEach(ref._servers, function (item,index) {
        servers[index] = Temasys.Utils.copy(item);
      });
      return servers;
    })(),
    data: {
      compress: ref._data.compress,
      priorityInterval: ref._data.queue.priorityInterval
    }
  };
};

/**
 * Function to retrieve Socket connection stats.
 * @method getStats
 * @param {JSON} return The result.
 * @param {JSON} return.messages The messages stats.
 * @param {JSON} return.messages.send The messages sent stats.
 * @param {Number} return.messages.send.total The total number of messages sent.
 * @param {Number} return.messages.send.errors The total number of messages sent with errors.
 * @param {JSON} return.messages.recv The messages received stats.
 * @param {Number} return.messages.recv.total The total number of messages received.
 * @param {Number} return.messages.recv.errors The total number of messages received with errors.
 * @param {JSON} return.connection The connection stats.
 * @param {JSON} return.connection.reconnections The reconnection stats.
 * @param {Number} return.connection.reconnections.total The total number of reconnections attempts.
 * @param {Array} return.connection.reconnections.servers The servers reconnections stats.
 * @param {Number} return.connection.reconnections.servers._serverIndex The total number of reconnection attempts
 *   made for the current server index.
 * @param {JSON} return.connection.pings The "ping" stats.
 * @param {Number} return.connection.pings.total The total number of "ping" messages received.
 * @param {JSON} return.connection.pongs The "pong" stats.
 * @param {Number} return.connection.pongs.total The total number of "pong" messages sent.
 * @param {JSON} return.connection.pongs.latency The "pong" latency stats.
 * @param {Number} return.connection.pongs.latency.lowest The lowest number of latency received.
 * @param {Number} return.connection.pongs.latency.average The average number of latency received.
 * @param {Number} return.connection.pongs.latency.highest The highest number of latency received.
 * @return {JSON}
 * @example
 *   var stats = socket.getStats();
 *   console.log("Received stats ->", stats);
 * @for Temasys.Socket
 * @since 0.7.0
 */
Temasys.Socket.prototype.getStats = function () {
  var ref = this;
  return {
    messages: {
      send: {
        total: ref._stats.messages.send.total,
        errors: ref._stats.messages.send.error
      },
      recv: {
        total: ref._stats.messages.recv.total,
        errors: ref._stats.messages.recv.error
      }
    },
    connection: {
      reconnections: {
        total: ref._stats.connection.attempts.total,
        servers: (function () {
          var servers = [];
          Temasys.Utils.forEach(ref._servers, function (item, index) {
            servers[index] = ref._stats.connection.attempts.servers[index] ? ref._stats.connection.attempts.servers[index] : 0;
          });
          return servers;
        })()
      },
      pings: {
        total: ref._stats.connection.pings.total,
      },
      pongs: {
        total: ref._stats.connection.pongs.total,
        latency: {
          lowest: ref._stats.connection.pongs.latency.lowest,
          highest: ref._stats.connection.pongs.latency.highest,
          average: parseFloat((ref._stats.connection.pongs.latency.total /
            ref._stats.connection.pongs.total).toFixed(2), 10)
        }
      }
    }
  };
};

/**
 * Function to set configuration.
 */
Temasys.Socket.prototype._setConfig = function (options, defaultOptions) {
  var ref = this;

  if (!(options && typeof options === 'object' && !Array.isArray(options))) {
    return _log.throw(ref._componentId, new Error('new Temasys.Socket(): options is not defined correctly'));
  }

  // NOTE: We should always define options as an object {}.
  // Use user's defined servers
  if (Array.isArray(options.servers) && options.servers.length > 0) {
    Temasys.Utils.forEach(options.servers, function (item) {
      if (item && typeof item === 'object' ?
        !(item.server && typeof item.server === 'string') ||
        !(typeof item.port === 'number' && item.port > 0) ||
        !(item.transport === 'Websocket' ? !window.WebSocket : true) : true) {
        return;
      }

      var useItem = {
        server: item.server,
        protocol: item.protocol && typeof item.protocol === 'string' && item.protocol.length > 1 &&
          item.protocol.indexOf(':') === (item.protocol.length - 1) ? item.protocol : window.location.protocol,
        port: item.port,
        path: item.path && typeof item.path === 'string' && item.path.length > 1 &&
          item.path.indexOf('/') === 0 ? item.path : '/socket.io',
        reconnectionDelay: typeof item.reconnectionDelay === 'number' && item.reconnectionDelay >= 0 ?
          item.reconnectionDelay : 2000,
        randomizationFactor: typeof item.randomizationFactor === 'number' && item.randomizationFactor >= 0 &&
          item.randomizationFactor <= 1 ? item.randomizationFactor : 0.5,
        timeout: typeof item.timeout === 'number' && item.timeout >= 0 ? item.timeout : 20000,
        transport: !window.WebSocket ? ref.TRANSPORT_ENUM.POLLING : ref.TRANSPORT_ENUM.WEBSOCKET
      };

      if (item.transport && typeof item.transport === 'string') {
        Temasys.Utils.forEach(ref.TRANSPORT_ENUM, function (transportItem) {
          if (transportItem === item.transport) {
            useItem.transport = item.transport;
            return true;
          }
        });
      }

      useItem.reconnection = typeof item.reconnection === 'boolean' ? item.reconnection :
        useItem.transport === ref.TRANSPORT_ENUM.POLLING;
      useItem.reconnectionAttempts = typeof item.reconnectionAttempts === 'number' &&
        item.reconnectionAttempts >= 0 && item.reconnectionAttempts <= 5 ?
        item.reconnectionAttempts : (useItem.transport === ref.TRANSPORT_ENUM.POLLING ? 4 : 0);
      useItem.reconnectionDelayMax = typeof item.reconnectionDelayMax === 'number' &&
        item.reconnectionDelayMax >= 0 ? item.reconnectionDelayMax :
        (useItem.transport === ref.TRANSPORT_ENUM.POLLING ? 1000 : 2000);
      ref._servers.push(useItem);
    });

  // Use API returned defined servers
  } else {
    if (!(defaultOptions && typeof defaultOptions === 'object')) {
      defaultOptions = {};
    }

    var ports = window.location.protocol === 'https:' ?
      (Array.isArray(defaultOptions.httpsPorts) && defaultOptions.httpsPorts.length > 0 ?
      defaultOptions.httpsPorts : [443, 3443]) :
      (Array.isArray(defaultOptions.httpPorts) && defaultOptions.httpPorts.length > 0 ?
      defaultOptions.httpPorts : [80, 3000]);

    Temasys.Utils.forEach(ports, function (portItem) {
      if (portItem < 1) {
        return;
      }
      var item = {
        server: defaultOptions.server && typeof defaultOptions.server === 'string' ?
          defaultOptions.server : 'signaling.temasys.io',
        protocol: window.location.protocol,
        port: portItem,
        path: '/socket.io',
        reconnection: false,
        reconnectionDelay: 2000,
        randomizationFactor: 0.5,
        timeout: 20000,
        transport: ref.TRANSPORT_ENUM.WEBSOCKET,
        reconnectionAttempts: 0,
        reconnectionDelayMax: 2000
      };

      if (window.WebSocket) {
        ref._servers.push(item);
      }
      item.reconnection = true;
      item.reconnectionDelayMax = 1000;
      item.reconnectionAttempts = 4;
      item.transport = ref.TRANSPORT_ENUM.POLLING;
      ref._servers.push(item);
    });
  }

  if (ref._servers.length === 0) {
    return _log.throw(ref._componentId, new Error('new Temasys.Socket(): There are no servers to connect to'));
  }

  if (options.data && typeof options.data === 'object') {
    ref._data.compress = options.data.compress === true;
    ref._data.queue.priorityInterval = typeof options.data.priorityInterval === 'number' &&
      options.data.priorityInterval >= 0 ? options.data.priorityInterval : 10;
  }
};

/**
 * Function to start socket connection.
 * - Returns a Promise (Error error) for failure, (String socketId) for success
 */
Temasys.Socket.prototype._connect = function () {
  var ref = this;
  ref._state.serverIndex = -1;
  ref._state.triggered = {
    response: false,
    fnResponse: function () {},
    reconnecting: false,
    connectError: false,
    connectFailed: false,
    reconnectAttempt: false
  };

  var fnConnect = function () {
    var terminated = false;
    var useSettings = {
      attempt: 0,
      serverIndex: -1,
      url: null,
      options: {
        path: '/socket.io',
        reconnection: false,
        reconnectionAttempts: 0,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 2000,
        randomizationFactor: 0.5,
        timeout: 20000,
        transports: [],
        autoConnect: false,
        forceNew: true
      }
    };

    // Function that returns the error
    var fnEmitState = function (state, error) {
      ref._state.connectionState = ref.CONNECTION_STATE_ENUM[state];
      ref._eventManager.emit('connectionStateChange', ref.CONNECTION_STATE_ENUM[state], error || null, useSettings);

      if (!ref._state.triggered.response && ['TERMINATE', 'CONNECT', 'RECONNECT'].indexOf(state) > -1) {
        terminated = true;
        ref._state.triggered.response = true;
        ref._state.triggered.fnResponse(state === 'TERMINATE' ? error : null);
        ref._state.triggered.fnResponse = null;
      } else if (['CONNECT_START_ERROR', 'RECONNECT_FAILED'].indexOf(state) > -1 ||
        (state === 'CONNECT_ERROR' && !(useSettings.options.reconnection && useSettings.options.reconnectionAttempts > 0))) {
        terminated = true;
        if (!ref._servers[ref._state.serverIndex + 1]) {
          return fnEmitState('TERMINATE', new Error('There are no more servers to continue starting of connection'));
        }
        fnConnect();
      }
    };

    if (ref._servers.length === 0) {
      return fnEmitState('TERMINATE', new Error('There are no servers to start connection'));
    }

    ref._disconnect();
    ref._state.serverIndex++;
    ref._state.triggered.timeout = false;
    ref._state.triggered.reconnecting = false;
    ref._state.triggered.reconnectAttempt = false;
    ref._state.triggered.connectError = false;
    ref._state.triggered.connectFailed = false;
    useSettings.attempt = 0;
    useSettings.serverIndex = ref._state.serverIndex;

    var serverItem = ref._servers[ref._state.serverIndex];
    useSettings.url = serverItem.protocol + '//' + serverItem.server + ':' + serverItem.port;
    useSettings.options.path = serverItem.path;
    useSettings.options.reconnection = serverItem.reconnection;
    useSettings.options.reconnectionAttempts = serverItem.reconnectionAttempts;
    useSettings.options.reconnectionDelay = serverItem.reconnectionDelay;
    useSettings.options.reconnectionDelayMax = serverItem.reconnectionDelayMax;
    useSettings.options.randomizationFactor = serverItem.randomizationFactor;
    useSettings.options.timeout = serverItem.timeout;
    useSettings.options.transports = [serverItem.transport];

    ref._state.options = useSettings.options;
    ref._state.url = useSettings.url;

    fnEmitState('CONNECTING');

    try {
      ref._connection = io.connect(useSettings.url, useSettings.options);
    } catch (error) {
      fnEmitState('CONNECT_START_ERROR', error);
      return;
    }

    ref._connection.on('connect', function () {
      ref._state.connected = true;
      fnEmitState('CONNECT');
    });

    ref._connection.on('reconnect', function () {
      ref._state.connected = true;
      fnEmitState('RECONNECT');
    });

    ref._state.triggered.fnEmitDisconnect = function () {
      if (ref._state.connected) {
        ref._state.connected = false;
        fnEmitState('DISCONNECT');
      }
    };

    ref._connection.on('disconnect', function () {
      ref._state.triggered.fnEmitDisconnect();
    });

    // "connect_timeout" is the same as "connect_error"
    // See: https://socket.io/docs/client-api
    ref._connection.on('connect_timeout', function () {
      if (terminated) {
        return;
      // Prevent triggering of CONNECT_ERROR again
      } else if (ref._state.triggered.connectError) {
        return;
      }
      ref._state.triggered.connectError = true;
      fnEmitState('CONNECT_ERROR', new Error('Connection timeout'));
    });

    ref._connection.on('connect_error', function (error) {
      if (terminated) {
        return;
      } else if (!ref._state.connected) {
        if (!ref._state.triggered.connectFailed) {
          ref._state.triggered.connectFailed = true;
          // Prevent triggering of CONNECT_ERROR again
          if (ref._state.triggered.connectError) {
            return;
          }
          ref._state.triggered.connectError = true;
          fnEmitState('CONNECT_ERROR', error instanceof Error ? error : new Error('Connection error'));
          return;
        }
        ref._state.triggered.reconnecting = true;
        // Prevent triggering of RECONNECT_ERROR again
        if (ref._state.triggered.reconnectAttempt) {
          return;
        }
        ref._state.triggered.reconnectAttempt = true;
        fnEmitState('RECONNECT_ERROR', error instanceof Error ? error : new Error('Reconection error'));
        return;
      }
      fnEmitState('ERROR', error || new Error('Connection session error'));
    });

    // Fired when successful reconnection. reconnect does the same thing
    /*ref._connection.on('reconnecting', function () {
      fnEmitState('RECONNECTING');
    });*/

    ref._connection.on('reconnect_error', function (error) {
      if (terminated) {
        return;
      // Prevent triggering of RECONNECT_ERROR again
      } else if (ref._state.triggered.reconnectAttempt) {
        return;
      }
      ref._state.triggered.reconnectAttempt = true;
      fnEmitState('RECONNECT_ERROR', error instanceof Error ? error : new Error('Reconnection error'));
    });

    ref._connection.on('reconnect_failed', function () {
      fnEmitState('RECONNECT_FAILED', new Error('Reconnection failed'));
    });

    ref._connection.on('reconnect_attempt', function () {
      if (terminated) {
        return;
      }
      useSettings.attempt++;
      ref._stats.connection.reconnections.total++;
      ref._stats.connection.reconnections.servers[useSettings.serverIndex]++;
      ref._state.triggered.reconnectAttempt = false;
      fnEmitState('RECONNECT_ATTEMPT');
    });

    // Deprecated socket.io-client 1.4.x
    ref._connection.on('error', function (error) {
      _log.throw(ref._componentId, error instanceof Error ? error : new Error(
        typeof error === 'string' ? error : 'DOM exception'));
    });

    ref._connection.on('ping', function () {
      ref._stats.connection.pings.total++;
      ref._eventManager.emit('activeStateChange', ref.ACTIVE_STATE_ENUM.PING, Date.now(), null);
    });

    ref._connection.on('pong', function (latency) {
      // Set the highest latency received
      if (ref._stats.connection.pongs.latency.highest === null || latency > ref._stats.connection.pongs.latency.highest) {
        ref._stats.connection.pongs.latency.highest = latency;
      }
      // Set the lowest latency received
      if (ref._stats.connection.pongs.latency.lowest === null || latency < ref._stats.connection.pongs.latency.lowest) {
        ref._stats.connection.pongs.latency.lowest = latency;
      }
      ref._stats.connection.pongs.latency.total += latency;
      ref._stats.connection.pongs.total++;
      ref._eventManager.emit('activeStateChange', ref.ACTIVE_STATE_ENUM.PONG, Date.now(), latency);
    });

    ref._connection.on('message', function (messageStr) {
      ref._stats.messages.recv.total++;
      try {
        var message = JSON.parse(messageStr);
        // Cache the room ID for group messages later
        if (message.type === 'inRoom') {
          ref._data.session.roomId = message.rid;
          ref._data.session.peerId = message.sid;
        }
        ref._eventManager.emit('message', message, null, false);
      } catch (error) {
        ref._stats.messages.recv.errors++;
        ref._eventManager.emit('message', messageStr, error, false);
      }
    });

    if (typeof ref._connection.connect === 'function') {
      // Catch any "http:" accessing errors on "https:" sites errors
      try {
        ref._connection.connect();
      } catch (error) {
        fnEmitState('CONNECT_START_ERROR', error);
      }
    }
  };

  setTimeout(function () {
    fnConnect();
  }, 10);

  return new Promise(function (resolve, reject) {
    ref._state.triggered.fnResponse = function (error) {
      if (error) {
        reject(error);
      } else {
        resolve(null);
      }
    };
  });
};

/**
 * Function to start socket connection.
 */
Temasys.Socket.prototype._disconnect = function () {
  var ref = this;
  if (ref._connection) {
    ref._connection.removeAllListeners();
    if (ref._state.connected) {
      ref._connection.disconnect();
      // Add precautionary checks
      if (typeof ref._state.triggered.fnEmitDisconnect === 'function') {
        ref._state.triggered.fnEmitDisconnect();
      }
    }
    ref._connection = null;
  }
};

/**
 * Function to send the next batch of queued messages.
 */
Temasys.Socket.prototype._sendNextQueue = function (fnSend) {
  var ref = this;

  if (ref._buffer.timer) {
    clearTimeout(ref._buffer.timer);
  }

  ref._buffer.timer = setTimeout(function () {
    // Ignore if there is no queue to send
    if (ref._buffer.queue[0].length === 0) {
      return;
    }

    var now = Date.now();

    if ((now - ref._buffer.timestamp) > 1000) {
      Utils.forEach(ref._buffer.queue[0], function (qMessageStr, i) {
        var qMessage = JSON.parse(qMessageStr);
        // Drop outdated messages
        if (['muteVideoEvent', 'muteAudioEvent', 'updateUserEvent'].indexOf(qMessage.type) > -1 &&
          ref._buffer.status[qMessage.type] >= qMessage.stamp) {
          ref._buffer.queue[0].splice(i, 1);
          // Trigger callback because status is outdated so it's technically updated
          ref._buffer.queue[1].splice(i, 1)[0](null);
          return -1;
        }
      });

      var messageList = ref._buffer.queue[0].splice(0, 16);
      var fnList = ref._buffer.queue[1].splice(0, 16);

      // Send the next batch
      fnSend([{
        type: 'group',
        mid: ref._buffer.cached.user,
        rid: ref._buffer.cached.room,
        list: messageList

      }, function (error) {
        Utils.forEach(fnList, function (fnItem, i) {
          ref._event.emit('message', JSON.parse(messageList[i]), error || null, true);
          fnItem(error || null);
        });
      }]);
      ref._buffer.timestamp = now;
      ref._sendNextQueue(fnSend);
    }
  }, 1000);
};

/**
 * Function to send messages.
 */
Temasys.Socket.prototype._send = function (message, fn) {
  var ref = this;

  /**
   * Internal function to send message.
   */
  var fnSend = function (item) {
    if (!(ref._connection && ref.current.connected)) {
      var notOpenError = new Error('Failed to send message as socket is not connected');
      ref._event.emit('message', item[0], notOpenError, true);
      return item[1](notOpenError);
    }

    // "compress" functionality may not work until server has implemented it
    ref._connection.compress(ref.compressData).send(item[0], function () {
      // TODO: Server to send ack? Not documenting this as it might not be available yet
      ref._event.emit('messageAck', item[0]);
    });

    ref._event.emit('message', item[0], null, true);
    item[1](null);
  };

  // Priority channel which should not be buffered in which server should queue that.
  if (['joinRoom', 'enter', 'restart', 'welcome', 'endOfCandidates'].indexOf(message.type) > -1) {
    fnSend([message, typeof fn === 'function' ? fn : function () {}]);

  // Messaging channel for broadcast or info messages to buffer which server would drop
  } else if (['private', 'roomLockEvent', 'stream', 'public', 'updateUserEvent',
    'muteAudioEvent', 'muteVideoEvent'].indexOf(message.type) > -1) {

    setTimeout(function () {
      var now = Date.now();

      // Set the stamp value
      if (['muteVideoEvent', 'muteAudioEvent', 'updateUserEvent'].indexOf(message.type) > -1) {
        ref._buffer.status[message.type] = now;
        message.stamp = now;
      }

      if ((now - ref._buffer.timestamp) > (message.type === 'private' ? 120 : 1000)) {
        fnSend([message, typeof fn === 'function' ? fn : function () {}]);
        ref._buffer.timestamp = now;
        ref._sendNextQueue(fnSend);
        return;
      }

      // Prevent delayed Room locks
      if (message.type === 'roomLockEvent') {
        var droppedError = new Error('Unable to send command to lock Room due to messages buffer');
        ref._emit('message', message, droppedError, true);
        (typeof fn === 'function' ? fn : function () {})(droppedError);
        return;
      }

      ref._buffer.queue[0].push(JSON.stringify(message));
      ref._buffer.queue[1].push(typeof fn === 'function' ? fn : function () {});
      ref._sendNextQueue(fnSend);
    }, 0);

  // Invalid messages which is not part of the SM protocol
  } else {
    var invalidError = new Error('Invalid message type provided');
    ref._event.emit('message', message, invalidError, true);
    if (typeof fn === 'function') {
      fn(invalidError);
    }
  }
};
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
 * @param {Array} [options.audio.optional] @(exp) The native `getUserMedia()` API audio optional constraints.
 *   E.g. `optional: ({ xxx, xxx })`
 * @param {JSON|Boolean} [options.video] The video track options.
 * - When provided as a `Boolean`, it simply passes it as `true` as the native `getUserMedia()` API video constraint.
 * @param {JSON|String} [options.video.sourceId] The video track source ID to request.
 * - When provided as a `JSON`, it follows the native `getUserMedia()` API constraints.
 *   E.g. `sourceId: { exact: ..., ideal: ... }`.
 * - The list of available video track sources can be obtained from
 *   {{#crossLink "Utils/Utils.Stream.getSources:method"}}{{/crossLink}}.
 * @param {JSON|Number} [options.video.width] @(exp) The video track expected video frame resolution width.
 * - When provided as a `JSON`, it follows the native `getUserMedia()` API constraints.
 *   E.g. `width: { exact: ..., ideal: ..., min: ..., max: ... }`.
 * @param {JSON|Number} [options.video.height] @(exp) The video track expected video frame resolution height.
 * - When provided as a `JSON`, it follows the native `getUserMedia()` API constraints.
 *   E.g. `height: { exact: ..., ideal: ..., min: ..., max: ... }`.
 * @param {JSON|Number} [options.video.frameRate] @(exp) The video track expected video framerate (fps).
 * - When provided as a `JSON`, it follows the native `getUserMedia()` API constraints.
 *   E.g. `frameRate: { exact: ..., ideal: ..., min: ..., max: ... }`.
 * @param {JSON|Number} [options.video.facingMode] @(exp) The video track expected video camera facing mode.
 * - When provided as a `JSON`, it follows the native `getUserMedia()` API constraints.
 *   E.g. `facingMode: { exact: ..., ideal: ..., min: ..., max: ... }`.
 * @param {Array|String|Boolean} [options.video.screenshare] @(exp) The flag if video track is screensharing source.
 * - When provided as an `Array` or a `String`, it follows the native `getUserMedia()` API `"mediaSource"` constraints.
 *   E.g. `mediaSource: options.video.screenshare`.
 * - If this is defined (not as `false`), the native `getUserMedia()` API might be executed twice for audio track and
 *   video track separately.
 * @param {JSON} [options.custom] @(exp) The custom native `getUserMedia()` API constraints to use.
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
/**
 * Handles the utility functionalities used internally.
 * @class Temasys.Utils
 * @since 0.7.0
 * @typedef module
 */
Temasys.Utils = {
  /**
   * Function that creates an event emitter manager.
   * @method createEventManager
   * @param {JSON} return The event manager functions.
   * @param {Function} return.once Function to subscribe a callback function to an event once.
   * @param {String} return.once.eventName The event name.
   * @param {Function} return.once.fn The callback function.
   * @param {Function} [return.once.fnCondition] The condition function that is invoked
   *   each time event is emitted, and once the condition function returns `true`, the callback function is invoked.
   * - When not provided, the value is `function () { return true; }`.
   * @param {Boolean} [return.once.persistent=false] The flag if callback function should be invoked
   *   each time the condition function is met.
   * - When not provided as `true`, the callback function will only be invoked once the condition is met.
   * @param {Function} return.on Function to subscribe a callback function to an event.
   * @param {String} return.on.eventName The event name.
   * @param {Function} return.on.fn The callback function.
   * @param {Function} return.off Function to unsubscribe a callback function to an event.
   * @param {String} [return.off.eventName] The event name.
   * - When not provided, every callback functions will be unsubscribe to every events.
   * @param {Function} [return.off.fn] The callback function.
   * - When not provided, every callback functions related to the event will be unsubscribed.
   * @param {Function} [return.catchExceptions] Function to catch any errors thrown in callback functions.
   * @param {Function} [return.catchExceptions.fn]  The exception function that is invoked
   *   each time an exception is caught.
   * - When not provided as a type of `Function`, any exceptions will be thrown in the callback functions
   *   and not be caught.
   * @param {Function} return.emit Function to emit an event.
   * @param {String} return.emit.eventName The event name.
   * - Parameters after it would be considered the event callback function parameter payloads.
   *   E.g. `.emit("test", a, b, c)` would result in `.on("test", function (a, b, c) { .. })`
   * @return {JSON}
   * @example
   * // Create the event manager
   * var manager = Temasys.Utils.createEventManager;
   * var offCbFn = function () {
   *   console.log("D");
   * };
   *
   * // Subscribe to an event
   * manager.on("test", function () {
   *   console.log("A");
   * });
   * manager.once("test", function () {
   *   console.log("B");
   * });
   * manager.on("test", function () {
   *   console.log("C");
   * });
   * manager.on("test", offCbFn);
   *
   * // Emit the event - Results: A, B, C, D
   * manager.emit("test");
   *
   * // Emit the event (2) - Results: A, C, D
   * manager.emit("test");
   *
   * // Unsubscribe to an event for a specific callback function
   * manager.on("test", offCbFn);
   *
   * // Emit the event - Results: A, C
   * manager.emit("test");
   * 
   * // Subscribe to various events
   * manager.on("test2", function () {
   *   console.log("E");
   * });
   * manager.on("test2", function () {
   *   console.log("F");
   * });
   * manager.on("test3", function () {
   *   console.log("G");
   * });
   * manager.on("test4", function () {
   *   console.log("H");
   * });
   *
   * // Emit the events - Results: A, C, E, F, G, H
   * manager.emit("test");
   * manager.emit("test2");
   * manager.emit("test3");
   * manager.emit("test4");
   *
   * // Unsubscribe to an event
   * manager.off("test");
   *
   * // Emit the events - Results: E, F, G, H
   * manager.emit("test");
   * manager.emit("test2");
   * manager.emit("test3");
   * manager.emit("test4");
   *
   * // Unsubscribe to all events
   * manager.off();
   *
   * // Emit the events - Results: None
   * manager.emit("test");
   * manager.emit("test2");
   * manager.emit("test3");
   * manager.emit("test4");
   *
   * // Catch exceptions in event handlers
   * manager.on("error", function () {
   *   throw new Error("test");
   * });
   * manager.catchExceptions(function (error) {
   *   console.log(error);
   * });
   *
   * // Emit the event - Results: "test"
   * manager.emit("error");
   *
   * // Subscribe with condition that invokes once condition is met
   * manager.once("test", function () {
   *   console.log("I");
   * }, function (current) {
   *   return current > 3;
   * });
   *
   * // Subscribe with condition that invokes every time condition is met
   * manager.once("test", function () {
   *   console.log("J");
   * }, function (current) {
   *   return current > 2;
   * }, true);
   *
   * // Emit the event > current: 0 - Results: None
   * manager.emit("test", 0);
   *
   * // Emit the event > current: 3 - Results: J
   * manager.emit("test", 3);
   *
   * // Emit the event > current: 4 - Results: I, J
   * manager.emit("test", 4);
   *
   * // Emit the event > current: 5 - Results: J
   * manager.emit("test", 5);
   * @for Temasys.Utils
   * @since 0.7.0
   */
  createEventManager: function () {
    // Listeners
    var listeners = { once: [], on: [], catch: null };

    /**
     * Function that handles caught errors.
     */
    var fnCatch = function (error) {
      if (typeof listeners.catch === 'function') {
        return listeners.catch(error);
      }
      throw error;
    };

    return {
      /**
       * Function that returns the documented `.on()` method.
       */
      on: function (eventName, fn) {
        if (typeof fn !== 'function') {
          return fnCatch(new Error('Please provide a valid callback'));
        }

        if (!Array.isArray(listeners.on[eventName])) {
          listeners.on[eventName] = [];
        }

        listeners.on[eventName].push(fn);
      },

      /**
       * Function that returns the documented `.once()` method.
       */
      once: function (eventName, fn, fnCondition, persistent) {
        if (typeof fn !== 'function') {
          return fnCatch(new Error('Please provide a valid callback'));
        }

        if (typeof fnCondition === 'boolean') {
          persistent = fnCondition;
        }

        if (!Array.isArray(listeners.once[eventName])) {
          listeners.once[eventName] = [];
        }

        listeners.once[eventName].push([fn, typeof fnCondition === 'function' ?
          fnCondition : function () { return true; }, persistent === true]);
      },

      /**
       * Function that returns the documented `.off()` method.
       */
      off: function (eventName, fn) {
        if (typeof eventName === 'string') {
          // Unsubscribe single callback listener
          if (typeof fn === 'function') {
            if (Array.isArray(listeners.on[eventName])) {
              Temasys.Utils.forEach(listeners.on[eventName], function (fnItem, i) {
                if (fnItem === fn) {
                  listeners.on[eventName].splice(i, 1);
                  return -1;
                }
              });
            }

            if (Array.isArray(listeners.once[eventName])) {
              Temasys.Utils.forEach(listeners.once[eventName], function (fnItem, i) {
                if (fnItem[0] === fn) {
                  listeners.once[eventName].splice(i, 1);
                  return -1;
                }
              });
            }
          // Unsubscribe all callback listeners tied to event
          } else {
            listeners.on[eventName] = [];
            listeners.once[eventName] = [];
          }
        // Unsubscribe all callback listeners from all events
        } else {
          listeners.on = {};
          listeners.once = {};
        }
      },

      /**
       * Function that returns the documented `.catch()` method.
       */
      catchExceptions: function (fn) {
        listeners.catch = typeof fn === 'function' ? fn : null;
      },

      /**
       * Function that returns the documented `.emit()` method.
       */
      emit: function (eventName) {
        try {
          var params = Array.prototype.slice.call(arguments);
          params.shift();

          // Trigger `on()` event handler
          if (Array.isArray(listeners.on[eventName])) {
            Temasys.Utils.forEach(listeners.on[eventName], function (fnItem) {
              fnItem.apply(this, params);
            });
          }
          // Trigger `once()` event handler
          if (Array.isArray(listeners.once[eventName])) {
            Temasys.Utils.forEach(listeners.once[eventName], function (fnItem, i) {
              if (fnItem[1].apply(this, params)) {
                fnItem[0].apply(this, params);
                // Check if `persistent`
                if (fnItem[2] !== true) {
                  listeners.once[eventName].splice(i, 1);
                  return 0;
                }
              }
            });
          }
        } catch (error) {
          fnCatch(error);
        }
      }
    };
  },

  /**
   * Function that loops an object.
   * @method forEach
   * @param {Array|JSON} object The object.
   * @param {Function} fn The callback function invoked for each object item looped.
   * - To break the function loop, return `true`.
   * - To increment or decrement loop, return a (`Number`), and be careful of using it to prevent infinite loops.
   * @param {Any} fn.item The object item.
   * @param {Number|String} fn.index The object item index or property key.
   * @example
   * // Example 1: Loop Array - Results: a 1, b 2, c 3
   * Temasys.Utils.forEach(["a", "b", "c"], function (item, index) {
   *   console.log(item, index);
   * });
   *
   * // Example 2: Loop JSON - Results: 1 a, 2 b, 3 c
   * Temasys.Utils.forEach({ a: 1, b: 2, c: 3 }, function (item, prop) {
   *   console.log(item, prop);
   * });
   * @for Temasys.Utils
   * @since 0.7.0
   */
  forEach: function (object, fn) {
    if (Array.isArray(object)) {
      var index = 0;
      while (index < object.length) {
        var res = fn(object[index], index);
        if (res === true) {
          break;
        } else if (typeof res === 'number') {
          index += res;
        } else {
          index++;
        }
      }
    } else if (object && typeof object === 'object') {
      for (var prop in object) {
        if (object.hasOwnProperty(prop)) {
          if (fn(object[prop], prop) === true) {
            break;
          }
        }
      }
    }
  },

  /**
   * Function that copies an object to remove pointer reference.
   * @method copy
   * @param {Array|JSON} object The object.
   * @param {Array|JSON} return The copied object.
   * @return {Array|JSON}
   * @example
   * // Example 1: Copy an Array - Results: [1, 2, 3]
   * var copyArray = Temasys.Utils.copy([1,2,3]);
   *
   * // Example 2: Copy a JSON - Results: { a: "0", b: "1", c: "2" }
   * var copyJSON = Temasys.Utils.copy({
   *   a: "0",
   *   b: "1",
   *   c: "2"
   * });
   * @for Temasys.Utils
   * @since 0.7.0
   */
  copy: function (object) {
    if (typeof object === 'object' && object !== null) {
      try {
        if (Array.isArray(object)) {
          return object.concat([]);
        } else {
          // Not the best performant but "fastest"
          return JSON.parse(JSON.stringify(object));
        }
      } catch (error) {
        return object;
      }
    }
    return object;
  },

  /**
   * Function that extends an object to another object.
   * - Note that conflicting properties will be overwritten.
   * @method extend
   * @param {JSON} object The object.
   * @param {JSON} extendObject The object to extend.
   * @param {JSON} return The extended object.
   * @return {JSON}
   * @example
   * // Example: Extend a JSON - Results: { a: 1, b: 2, c: 3 }
   * var extended = Temasys.Utils.extend({
   *   a: 1,
   *   b: 2
   * }, {
   *   c: 3
   * });
   * @for Temasys.Utils
   * @since 0.7.0
   */
  extend: function (object, extendObject) {
    if (typeof object === 'object' && object !== null) {
      var result = Temasys.Utils.copy(object);
      if (typeof extendObject === 'object' && extendObject !== null) {
        Temasys.Utils.forEach(Temasys.Utils.copy(extendObject), function (item, prop) {
          result[prop] = item;
        });
      }
      return result;
    }
    return {};
  },

  /**
   * Function that generates an unique identifier (UUID).
   * @method generateUUID
   * @example
   * // Example: Generate an UUID
   * var uuid = Temasys.Utils.generateUUID();
   * @for Temasys.Utils
   * @since 0.7.0
   */
  /* jshint ignore:start */
  generateUUID: function () {
    var d = new Date().getTime();

    if (performance && typeof performance.now === 'function'){
      d += performance.now(); //use high-precision timer if available
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  },
  /* jshint ignore:end */

  /**
   * Function that gets the client browser current and recommended version supports.
   * @method getClientSupports
   * @param {Promise} return The Promise for the request result.
   * @param {Function} return.then Function to subscribe to when request result is successful.
   * @param {Function} return.then.fn The callback function.
   * @param {JSON} return.then.fn.result The result.
   * @param {JSON} return.then.fn.result.current The current versions and supports.
   * @param {JSON} return.then.fn.result.current.browser The browser information.
   * @param {String} return.then.fn.result.current.browser.name The browser name.
   * @param {String} return.then.fn.result.current.browser.version The browser version.
   * @param {String} return.then.fn.result.current.browser.platform The browser platform.
   * @param {String} [return.then.fn.result.current.browser.mobilePlatformVersion] The browser mobile platform version
   *   if the client is accessing from Android and iOS mobile devices.
   * @param {JSON} [return.then.fn.result.current.dependencies] The dependencies loaded.
   * @param {String} [return.then.fn.result.current.dependencies.adapterjs] The loaded AdapterJS dependency version.
   * - This is defined only for when the AdapterJS dependency versions `0.13.0` and above is loaded.
   * - Note that this is required for starting `Temasys.Room` session connections.
   * @param {Boolean} [return.then.fn.result.current.dependencies.io] The flag if the socket.io-client dependency is loaded.
   * - Note that this is required for starting `Temasys.Room` session connections.
   * @param {JSON} [return.then.fn.result.current.webrtcPlugin] The WebRTC plugin information.
   * - This is defined only when the WebRTC plugin is loaded for the current accessing webpage, which is loaded from
   *   the AdapterJS dependency.
   * - For more advanced usage of the WebRTC plugin, see https://confluence.temasys.com.sg/display/TWT/Useful+debug+APIs.
   * @param {Boolean} return.then.fn.result.current.webrtcPlugin.active The flag if the WebRTC plugin is active.
   * - This determines if the WebRTC and `getUserMedia()` API functionalities is enabled.
   * - It is also advisable to check if the plugin `<object>` element css `display` is set to `"none"` as the
   *   `display` property must be displayed in order for the plugin to load, which is some cases the WebRTC plugin is active
   *   but disabled (hence made inactive) because of the `display` css settings. To prevent displaying the plugin
   *   `<object>` element, you may set the css `visibility` to `"hidden"` and use `z-index` properties to cover it.
   * @param {String} return.then.fn.result.current.webrtcPlugin.version The WebRTC plugin version.
   * @param {String} return.then.fn.result.current.webrtcPlugin.company The WebRTC plugin company name it is built for.
   * @param {String} [return.then.fn.result.current.webrtcPlugin.expirationDate] The WebRTC plugin expiration date if any.
   * @param {JSON} [return.then.fn.result.current.webrtcPlugin.whiteList] The WebRTC plugin whitelist settings.
   * - This is defined only when whitelisting is configured for the WebRTC plugin.
   * @param {JSON} return.then.fn.result.current.webrtcPlugin.whiteList.enabled The flag if current accessing domain
   *   is configured in the list of whitelisted domains for the WebRTC plugin.
   * @param {Boolean} return.then.fn.result.current.webrtcPlugin.whiteList.restrictsUsage The flag that disables the
   *   WebRTC and `getUserMedia()` API for the WebRTC plugin unless current accessing domain is configured
   *   in the list of whitelisted domains.
   * @param {Boolean} return.then.fn.result.current.webrtcPlugin.whiteList.restrictsFeatures The flag that disables the
   *   `webrtcPlugin.features` for the WebRTC plugin unless current accessing domain is configured in the
   *   list of whitelisted domains.
   * @param {JSON} return.then.fn.result.current.webrtcPlugin.features The WebRTC plugin features supports.
   * - The enabling of these features are determined based on the WebRTC plugin pricing plan selected.
   * @param {Boolean} return.then.fn.result.current.webrtcPlugin.features.crashReporter The flag if
   *   the crash reporter is enabled for the WebRTC plugin.
   * @param {Boolean} return.then.fn.result.current.webrtcPlugin.features.autoUpdate The flag if
   *   auto updating of the plugin is enabled for the WebRTC plugin.
   * @param {Boolean} return.then.fn.result.current.webrtcPlugin.features.screensharing The flag if
   *   screensharing functionalities is enabled for the WebRTC plugin.
   * @param {Boolean} return.then.fn.result.current.webrtcPlugin.features.h264 The flag if
   *   H264 video codec is enabled for the WebRTC plugin.
   * @param {Boolean} return.then.fn.result.current.webrtcPlugin.features.httpProxy The flag if
   *   connections behind HTTP proxy is enabled for the WebRTC plugin.
   * @param {Boolean} return.then.fn.result.current.webrtcPlugin.features.noPermissionPopup The flag if
   *   permission popup is disabled for the WebRTC plugin when invoking `getUserMedia()` API method.
   * @param {Boolean} return.then.fn.result.current.webrtcPlugin.features.experimentalAEC The flag if
   *   experimental AEC (acoustic echo cancellation) is enabled for the WebRTC plugin.
   * @param {JSON} return.then.fn.result.current.supports The browser supports.
   * @param {JSON} return.then.fn.result.current.supports.webrtc The WebRTC and `getUserMedia()` API supports.
   * @param {Boolean} return.then.fn.result.current.supports.webrtc.connection The flag if `RTCPeerConnection` API is supported.
   * @param {Boolean} return.then.fn.result.current.supports.webrtc.datachannel The flag if `RTCDataChannel` API is supported.
   * @param {Boolean} return.then.fn.result.current.supports.webrtc.dtmfsender The flag if `RTCDTMFSender` API is supported.
   * @param {Boolean} return.then.fn.result.current.supports.webrtc.generateCertificate The flag if
   *   `RTCPeerConnection.generateCertificate` API is supported.
   * @param {Boolean} return.then.fn.result.current.supports.webrtc.iceRestart The flag if ICE credentials restart is supported.
   * @param {Boolean} return.then.fn.result.current.supports.webrtc.maxBandwidth The flag if maximum sending bandwidth
   *   limitations (`b=AS` or `b=TIAS` flags) is supported.
   * @param {Boolean} return.then.fn.result.current.supports.webrtc.turns The flag if TURN over TLS protocol is supported
   *   when connecting to TURN server.
   * @param {Boolean} return.then.fn.result.current.supports.webrtc.stun The flag if STUN connections is supported.
   * @param {Boolean} return.then.fn.result.current.supports.webrtc.turnOverTcp The flag if TURN connections over TCP IP
   *   protocol is supported.
   * @param {Boolean} return.then.fn.result.current.supports.webrtc.screensharing The flag if screensharing functionalities
   *   is supported.
   * @param {JSON} return.then.fn.result.current.supports.webrtc.codecs The list of codecs supported.
   * @param {JSON} return.then.fn.result.current.supports.webrtc.codecs.send The sending codecs.
   * @param {JSON} return.then.fn.result.current.supports.webrtc.codecs.send.audio The sending audio codecs.
   * @param {JSON} return.then.fn.result.current.supports.webrtc.codecs.send.audio._codecName The codec information.
   * - The property key (`#codeName`) value is the codec name.
   * @param {Number} return.then.fn.result.current.supports.webrtc.codecs.send.audio._codecName.payloadType The
   *   codec payload number.
   * @param {Number} return.then.fn.result.current.supports.webrtc.codecs.send.audio._codecName.clockRate The
   *   codec clock rate in Hz (hertz).
   * @param {Number} return.then.fn.result.current.supports.webrtc.codecs.send.audio._codecName.payloadType The
   *   number of channels, where mono is represented as `1`, and stereo as `2`.
   * @param {String} [return.then.fn.result.current.supports.webrtc.codecs.send.audio._codecName.sdpFmtpLine] The
   *   codec parameters configured as its corresponding `a=fmtp` SDP line.
   * @param {JSON} return.then.fn.result.current.supports.webrtc.codecs.send.video The sending video codecs.
   * - Object signature matches `current.supports.webrtc.codecs.send.audio`.
   * @param {JSON} return.then.fn.result.current.supports.webrtc.codecs.recv The receiving codecs.
   * - Object signature matches `current.supports.webrtc.codecs.send.audio`.
   * @param {JSON} return.then.fn.result.current.supports.webrtc.codecs.recv.audio The receiving audio codecs.
   * @param {JSON} return.then.fn.result.current.supports.webrtc.codecs.recv.video The receiving video codecs.
   * - Object signature matches `current.supports.webrtc.codecs.send.audio`.
   * @param {Boolean} return.then.fn.result.current.supports.xhr The flag if `XMLHttpRequest` API is supported.
   * - Note that this is required for starting `Temasys.Room` session connections.
   * @param {Boolean} return.then.fn.result.current.supports.corsRequest The flag if CORS (cross origin resource sharing)
   *   domain requests is supported, in which the CORS domain is determined from current accessing domain request.
   * - Note that this is required for CORS authentication when starting `Temasys.Room` session connections.
   * @param {JSON} return.then.fn.result.recommended The recommended dependencies, browsers and WebRTC plugin versions.
   * @param {JSON} return.then.fn.result.recommended.browsers The browsers.
   * @param {JSON} return.then.fn.result.recommended.browsers.chrome The chrome browser recommended versions.
   * @param {String} return.then.fn.result.recommended.browser.chrome.minVersion The recommended minimum version.
   * @param {String} [return.then.fn.result.recommended.browser.chrome.maxVersion] The recommended maximum version if any.
   * @param {String} [return.then.fn.result.recommended.browser.chrome.minMobilePlatformVersion] The recommended
   *   minimum version of the mobile platform if any.
   * @param {String} [return.then.fn.result.recommended.browser.chrome.maxMobilePlatformVersion] The recommended
   *   maximum version of the mobile platform if any.
   * @param {String} return.then.fn.result.recommended.browser.opera The opera browser recommended versions.
   * - Object signature matches `recommended.browser.chrome`.
   * @param {String} return.then.fn.result.recommended.browser.firefox The firefox browser recommended versions.
   * - Object signature matches `recommended.browser.chrome`.
   * @param {String} return.then.fn.result.recommended.browser.IE The IE browser recommended versions.
   * - Object signature matches `recommended.browser.chrome`.
   * @param {String} return.then.fn.result.recommended.browser.safari The safari browser recommended versions.
   * - Object signature matches `recommended.browser.chrome`.
   * @param {String} return.then.fn.result.recommended.browser.edge The Edge browser recommended versions.
   * - Object signature matches `recommended.browser.chrome`.
   * @param {String} return.then.fn.result.recommended.browser.bowser The Bowser browser recommended versions.
   * - Object signature matches `recommended.browser.chrome`.
   * @param {JSON} return.then.fn.result.recommended.webrtcPlugin The WebRTC plugin versions recommended.
   * @param {String} return.then.fn.result.recommended.webrtcPlugin.minVersion The recommended WebRTC plugin minimum version.
   * @param {String} [return.then.fn.result.recommended.webrtcPlugin.maxVersion] The recommended WebRTC
   *  plugin maxmimum version if any.
   * @param {JSON} return.then.fn.result.recommended.dependencies The dependencies.
   * @param {String} return.then.fn.result.recommended.dependencies.adapterjs The recommended AdapterJS dependency version.
   * @param {String} return.then.fn.result.recommended.dependencies.io The recommended socket.io-client dependency version.
   * @param {Function} return.catch Function to subscribe to when request result has errors.
   * @param {Function} return.catch.fn The callback function.
   * @param {Error} return.catch.fn.error The error object.
   * @example
   * // Example: Get the supports
   * Temasys.Utils.getClientSupports().then(function (result) {
   *   console.info("==== Browser information ==== ");
   *   console.log("- Name ->", result.current.browser.name);
   *   console.log("- Version ->", result.current.browser.version);
   *   console.log("- Platform ->", result.current.browser.platform + (result.current.browser.mobilePlatformVersion ?
   *     " (OS version: " + result.current.browser.mobilePlatformVersion : ""));
   * 
   *   console.info("==== Dependencies information ==== ");
   *   console.log("- AdapterJS version ->", result.current.dependencies.adapterjs || 'Not Loaded');
   *   console.log("- Socket.io-client loaded ->", result.current.dependencies.io);
   * 
   *   if (result.current.webrtcPlugin) {
   *     console.info("==== WebRTC plugin information ==== ");
   *     console.log("- Company ->", result.current.webrtcPlugin.company);
   *     console.log("- Version ->", result.current.webrtcPlugin.version);
   *     console.log("- Expiration date ->", result.current.webrtcPlugin.expirationDate || 'None');
   *
   *     if (result.current.webrtcPlugin.whiteList) {
   *       console.log("- Whitelisted plugin:");
   *       console.log("-- Domain is enabled ->", result.current.webrtcPlugin.whiteList.enabled);
   *       console.log("-- Whitelist restriction of features ->", result.current.webrtcPlugin.whiteList.restrictsFeatures);
   *       console.log("-- Whitelist restriction of WebRTC API ->", result.current.webrtcPlugin.whiteList.restrictsUsage);
   *     }
   *   }
   *
   *   console.info("==== Supports ====");
   *   console.log("- XMLHttpRequest API ->", result.current.supports.xhr);
   *   console.log("- CORS domain request ->", result.current.supports.corsRequest);
   *   console.log("- WebRTC:");
   *   console.log("-- Enabled ->", result.current.supports.webrtc.connection);
   *   console.log("-- Datachannel ->", result.current.supports.webrtc.datachannel);
   *   console.log("-- DTMFSender ->", result.current.supports.webrtc.dtmfsender);
   *   console.log("-- Generation of new certificate ->", result.current.supports.webrtc.generateCertificate);
   *   console.log("-- ICE restart ->", result.current.supports.webrtc.iceRestart);
   *   console.log("-- TURN over TLS connections ->", result.current.supports.webrtc.turns);
   *   console.log("-- Max sending bandwidth limits ->", result.current.supports.webrtc.maxBandwidth);
   *   console.log("-- STUN ->", result.current.supports.webrtc.stun);
   *   console.log("-- TURN over TCP ->", result.current.supports.webrtc.turnOverTcp);
   * 
   *   var parseCodecs = function (kind, dir) {
   *     console.log("-- " + kind + " " + dir + " codecs:");
   *     for (var codecName in result.current.supports.webrtc.codecs[dir][kind]) {
   *       if (result.current.supports.webrtc.codecs[dir][kind].hasOwnProperty(codecName)) {
   *         console.log("--- " + codecName + ":")
   *         console.log("---- Payload ->", result.current.supports.webrtc.codecs[dir][kind][codecName].payloadType);
   *         console.log("---- Channels ->", result.current.supports.webrtc.codecs[dir][kind][codecName].channels);
   *         console.log("---- Clockrate ->", result.current.supports.webrtc.codecs[dir][kind][codecName].clockRate);
   *         console.log("---- Params ->", result.current.supports.webrtc.codecs[dir][kind][codecName].sdpFmtpLine || 'None');
   *       }
   *     }
   *   };
   *
   *   parseCodecs('audio', 'send');
   *   parseCodecs('video', 'send');
   *   parseCodecs('audio', 'recv');
   *   parseCodecs('video', 'recv');
   *
   *   console.info("==== Recommended Browsers Versions ====");
   *   for (var browserName in result.recommended.browsers) {
   *     if (result.recommended.browsers.hasOwnProperty(browserName)) {
   *       console.log("- " + browserName + " :");
   *       console.log("-- Min version ->", result.recommended.browsers[browserName].minVersion || 'N/A');
   *       console.log("-- Max version ->", result.recommended.browsers[browserName].maxVersion || 'N/A');
   *       console.log("-- Min mobile platform version ->", result.recommended.browsers[browserName].mobilePlatformMinVersion || 'N/A');
   *       console.log("-- Max mobile platform version ->", result.recommended.browsers[browserName].mobilePlatformMaxVersion || 'N/A');
   *     }
   *   }
   * 
   *   console.info("==== Recommended WebRTC Plugin Versions ====");
   *   console.log("- Min version ->", result.recommended.webrtcPlugin.minVersion || 'N/A');
   *   console.log("- Max version ->", result.recommended.webrtcPlugin.maxVersion || 'N/A');
   * 
   *   console.info("==== Recommended Dependencies Versions ====");
   *   console.log("- AdapterJS version ->", result.recommended.dependencies.adapterjs);
   *   console.log("- Socket.io-client version ->", result.recommended.dependencies.io);
   * }).catch(function (error) {
   *   console.error("Browser supports retrieval error ->", error);
   * });
   * @for Temasys.Utils
   * @since 0.7.0
   */
  getClientSupports: function () {
    var refAdapterJS = null;
    var result = {
      current: {},
      recommended: {}
    };

    if (_globals.AdapterJS && typeof _globals.AdapterJS === 'object' &&
      typeof _globals.AdapterJS.webRTCReady === 'function') {
      refAdapterJS = _globals.AdapterJS;
    } else if (window.AdapterJS && typeof window.AdapterJS === 'object' &&
      typeof window.AdapterJS.webRTCReady === 'function') {
      refAdapterJS = window.AdapterJS;
    }

    result.current.browser = {
      name: window.webrtcDetectedBrowser,
      version: (window.webrtcDetectedVersion || 0).toString(),
      platform: navigator.platform,
      mobilePlatformVersion: null
    };

    result.current.dependencies = {
      io: !!(_globals.io || window.io),
      adapterjs: refAdapterJS ? refAdapterJS.VERSION : null
    };

    result.current.webrtcPlugin = null;
    result.current.supports = {
      webrtc: {},
      xhr: typeof window.XMLHttpRequest === 'function',
      corsRequest: window.webrtcDetectedBrowser === 'IE' && [8,9].indexOf(window.webrtcDetectedVersion) > -1 ?
        ['object', 'function'].indexOf(typeof window.XDomainRequest) > -1 : typeof window.XMLHttpRequest === 'function'
    };

    result.recommended.browers = {};
    result.recommended.browers.chrome = {
      minVersion: '@@chromeMinVersion' || null,
      maxVersion: '@@chromeMaxVersion' || null,
      mobilePlatformMinVersion: '@@chromeMobilePlatformMinVersion' || null,
      mobilePlatformMaxVersion: '@@chromeMobilePlatformMaxVersion' || null
    };

    result.recommended.browers.firefox = {
      minVersion: '@@firefoxMinVersion' || null,
      maxVersion: '@@firefoxMaxVersion' || null,
      mobilePlatformMinVersion: '@@firefoxMobilePlatformMinVersion' || null,
      mobilePlatformMaxVersion: '@@firefoxMobilePlatformMaxVersion' || null
    };

    result.recommended.browers.opera = {
      minVersion: '@@chromeMinVersion' || null,
      maxVersion: '@@chromeMaxVersion' || null,
      mobilePlatformMinVersion: '@@chromeMobilePlatformMinVersion' || null,
      mobilePlatformMaxVersion: '@@chromeMobilePlatformMaxVersion' || null
    };

    result.recommended.browers.IE = {
      minVersion: '@@ieMinVersion' || null,
      maxVersion: '@@ieMaxVersion' || null,
      mobilePlatformMinVersion: '@@ieMobilePlatformMinVersion' || null,
      mobilePlatformMaxVersion: '@@ieMobilePlatformMaxVersion' || null
    };

    result.recommended.browers.safari = {
      minVersion: '@@safariMinVersion' || null,
      maxVersion: '@@safariMaxVersion' || null,
      mobilePlatformMinVersion: '@@safariMobilePlatformMinVersion' || null,
      mobilePlatformMaxVersion: '@@safariMobilePlatformMaxVersion' || null
    };

    result.recommended.browers.edge = {
      minVersion: '@@edgeMinVersion' || null,
      maxVersion: '@@edgeMaxVersion' || null,
      mobilePlatformMinVersion: '@@edgeMobilePlatformMinVersion' || null,
      mobilePlatformMaxVersion: '@@edgeMobilePlatformMaxVersion' || null
    };

    result.recommended.browers.bowser = {
      minVersion: '@@bowserMinVersion' || null,
      maxVersion: '@@bowserMaxVersion' || null,
      mobilePlatformMinVersion: '@@bowserMobilePlatformMinVersion' || null,
      mobilePlatformMaxVersion: '@@bowserMobilePlatformMaxVersion' || null
    };

    result.recommended.dependencies = {
      io: '@@socketioVersion' || null,
      adapterjs: '@@adapterjsVersion' || null
    };

    result.recommended.webrtcPlugin = {
      minVersion: '@@pluginMinVersion' || null,
      maxVersion: '@@pluginMaxVersion' || null
    };

    return new Promise(function (resolve, reject) {
      (function (fn) {
        if (refAdapterJS) {
          refAdapterJS.webRTCReady(fn);
        } else {
          fn();
        }
      })(function () {
        result.current.supports.webrtc = {
          connection: false,
          datachannel: false,
          dtmfsender: false,
          generateCertificate: false,
          iceRestart: false,
          screensharing: false,
          maxBandwidth: false,
          turns: false,
          stun: false,
          turn: false,
          turnOverTcp: false,
          turnOverUdp: false,
          codecs: {
            send: { audio: {}, video: {} },
            recv: { audio: {}, video: {} }
          }
        };

        if (['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1 && refAdapterJS && refAdapterJS.WebRTCPlugin.plugin &&
          ['object', 'function'].indexOf(typeof window.document) > -1) {
          var refPlugin = refAdapterJS.WebRTCPlugin.plugin;
          result.current.webrtcPlugin = {
            active: false,
            version: refPlugin.VERSION || null,
            company: refPlugin.COMPANY || null,
            expirationDate: refPlugin.expirationDate || null,
            whiteList: null,
            features: {
              autoUpdate: false,
              crashReporter: false,
              noPermissionPopup: false,
              screensharing: false,
              experimentalAEC: false,
              h264: false,
              httpProxy: false
            }
          };

          if (!!refPlugin.HasWhiteListingFeature) {
            result.current.webrtcPlugin.whiteList = {
              enabled: !!refPlugin.isWebsiteWhitelisted,
              restrictsUsage: !!refPlugin.HasUsageRestrictionToDomains,
              restrictsFeatures: !!refPlugin.HasFeaturesRestrictedToDomains
            };
          }

          try {
            var pc = new RTCPeerConnection(null);
            result.current.webrtcPlugin.active = !!(pc.createOffer !== null &&
              ['object', 'function'].indexOf(typeof pc.createOffer) > -1 &&
              // Check plugin flags "valid" is true, and then check if expired
              refPlugin.valid && !refPlugin.isOutOfDate &&
              // Check if plugin has whitelisting feature and has usage restrictions
              // Ensure that plugin <object> element to access the plugin WebRTC API is not not displayed
              refPlugin.style.display !== 'none' && (result.current.webrtcPlugin.whiteList ?
              (result.current.webrtcPlugin.whiteList.enabled || !result.current.webrtcPlugin.whiteList.restrictsUsage) : true));
            pc.close();
          } catch (error) {}

          if (result.current.webrtcPlugin.active && !(result.current.webrtcPlugin.whiteList &&
            !result.current.webrtcPlugin.whiteList.enabled && result.current.webrtcPlugin.restrictsFeatures)) {
            result.current.webrtcPlugin.features = {
              autoUpdate: !!refPlugin.HasAutoupdateFeature,
              crashReporter: !!refPlugin.HasCrashReporterFeature,
              noPermissionPopup: !!refPlugin.HasPopupFeature,
              screensharing: !!(refPlugin.HasScreensharingFeature && refPlugin.isScreensharingAvailable),
              experimentalAEC: !!refPlugin.HasExperimentalAEC,
              h264: !!refPlugin.HasH264Support,
              httpProxy: !!refPlugin.HasHTTPProxyFeature
            };
          }
        }

        if (!(!!window.RTCPeerConnection && !(result.current.webrtcPlugin && !result.current.webrtcPlugin.active))) {
          return resolve(result);
        }

        (function (fnDone) {
          try {
            // Parse Edge browser
            if (window.webrtcDetectedBrowser === 'edge' && typeof window.RTCRtpSender === 'function' &&
              typeof window.RTCRtpSender.getCapabilities === 'function' && typeof window.RTCRtpReceiver === 'function' &&
              typeof window.RTCRtpReceiver.getCapabilities === 'function') {
              var fnParseCodecs = function (codecs, direction) {
                Temasys.Utils.forEach(codecs, function (codec) {
                  if (!codec.name) {
                    return;
                  }
                  var sdpFmtpLine = '';
                  Temasys.Utils.forEach(codec.parameters, function (paramValue, param) {
                    sdpFmtpLine += codec.name === 'H264' && codec.parameters[
                      'level-asymmetry-allowed'] === undefined ? '1' : paramValue;
                  });

                  result.current.supports.webrtc.codecs[direction][codec.kind][codec.name.toLowerCase()] = {
                    channels: codec.numChannels || 1,
                    clockRate: codec.clockRate,
                    payloadType: codec.preferredPayload,
                    sdpFmtpLine: sdpFmtpLine
                  };
                });
              };

              fnParseCodecs(RTCRtpSender.getCapabilities(), 'send');
              fnParseCodecs(RTCRtpReceiver.getCapabilities(), 'recv');
              return fnDone();
            }

            var pc = new RTCPeerConnection(null);
            pc.createOffer(function (offer) {
              var sdpLines = offer.sdp.split('\r\n');
              var mediaType = '';
              var codecs = {};
              Temasys.Utils.forEach(sdpLines, function (line) {
                if (line.indexOf('m=') === 0) {
                  mediaType = (line.split('m=')[1] || '').split(' ')[0];

                } else if (['audio', 'video'].indexOf(mediaType) > -1 && line.indexOf('a=rtpmap:') === 0) {
                  var parts = (line.split('a=rtpmap:')[1] || '').split(' ');
                  var codecParts = (parts[1] || '').split('/');
                  var codecResult = {
                    channels: parseInt(codecParts[2] || '1', 10) || 1,
                    clockRate: parseInt(codecParts[1] || '0', 10) || 0,
                    payloadType: parseInt(parts[0], 10),
                    sdpFmtpLine: ''
                  };
                  codecs[parts[0]] = codecParts[0].toLowerCase();
                  result.current.supports.webrtc.codecs.recv[mediaType][codecParts[0].toLowerCase()] = codecResult;
                  result.current.supports.webrtc.codecs.send[mediaType][codecParts[0].toLowerCase()] = codecResult;

                } else if (line.indexOf('a=fmtp:') === 0) {
                  var parts = (line.split('a=rtpmap:')[1] || '').split(' ');
                  var payloadType = parts[0];
                  parts.shift();
                  var fmtpLine = parts.join(' ');

                  if (codecs[parts[0]]) {
                    result.current.supports.webrtc.codecs.recv[mediaType][codecs[parts[0]]].sdpFmtpLine = fmtpLine;
                    result.current.supports.webrtc.codecs.send[mediaType][codecs[parts[0]]].sdpFmtpLine = fmtpLine;
                  }
                }
              });

              pc.close();
              fnDone();

            }, function (error) {
              pc.close();
              reject(error);

            }, ['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1 ? {
              mandatory: { OfferToReceiveAudio: 1, OfferToReceiveVideo: 1 }
            } : { offerToReceiveAudio: 1, offerToReceiveVideo: 1 });

          } catch (error) {
            reject(error);
          }

        })(function () {
          if (Object.keys(result.current.supports.webrtc.codecs.recv.audio).length === 0 &&
            Object.keys(result.current.supports.webrtc.codecs.send.audio).length === 0 &&
            Object.keys(result.current.supports.webrtc.codecs.recv.video).length === 0 &&
            Object.keys(result.current.supports.webrtc.codecs.send.video).length === 0) {
            return resolve(result);
          }

          result.current.supports.webrtc = {
            connection: true,
            datachannel: window.webrtcDetectedBrowser !== 'edge',
            stun: window.webrtcDetectedBrowser !== 'edge',
            turnOverTcp: window.webrtcDetectedBrowser !== 'edge',
            dtmfsender: window.webrtcDetectedBrowser !== 'edge' &&
              !(window.webrtcDetectedBrowser === 'firefox' && window.webrtcDetectedVersion < 52),
            maxBandwidth: window.webrtcDetectedBrowser !== 'edge' &&
              !(window.webrtcDetectedBrowser === 'firefox' && window.webrtcDetectedVersion < 49),
            turns: window.webrtcDetectedBrowser !== 'edge' &&
              !(window.webrtcDetectedBrowser === 'firefox' && window.webrtcDetectedVersion < 52),
            generateCertificate: (window.webrtcDetectedBrowser === 'firefox' && window.webrtcDetectedVersion >= 42) ||
              (window.webrtcDetectedBrowser === 'chrome' && window.webrtcDetectedVersion >= 49) ||
              (window.webrtcDetectedBrowser === 'opera' && window.webrtcDetectedVersion >= 36),
            iceRestart: window.webrtcDetectedBrowser !== 'edge' &&
              !(window.webrtcDetectedBrowser === 'firefox' && window.webrtcDetectedVersion < 48),
            screensharing: !!(['chrome', 'firefox'].indexOf(window.webrtcDetectedBrowser) > -1 ||
              (['IE', 'safari'].indexOf(window.webrtcDetectedBrowser) > -1 && result.current.webrtcPlugin &&
              result.current.webrtcPlugin.supports.screensharing)),
            codecs: result.current.supports.webrtc.codecs
          };

          resolve(result);
        });
      });
    });
  }
};
  
  

  if(typeof exports !== 'undefined') {
    module.exports = {
      Skylink: Skylink,
      SkylinkLogs: SkylinkLogs,
      Temasys: {
        Room: Room,
        Utils: Utils
      }
    };
  } else {
    _globals.Skylink = Skylink;
    _globals.SkylinkLogs = SkylinkLogs;
    _globals.Temasys = {
      Room: Room,
      Utils: Utils
    };
  }

})(this);