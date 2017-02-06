/**
 * + Factory that handles the Datachannel connections.
 *   [connection] can be provided as the RTCPeerConnection or the RTCDataChannel connection.
 */
var DatachannelFactory = function (connection, options) {
  var channel = {
    // Datachannel connection
    connection: null,
    // Datachannel states
    states: {
      rejected: false,
      closing: false
    },
    // Datachannel relation info
    userId: options.userId,
    peerId: options.peerId,
    instanceId: options.instanceId,
    // Datachannel info
    label: options.label,
    prop: options.prop,
    type: options.prop === 'main' ? Skylink.prototype.DATA_CHANNEL_TYPE.MESSAGING :
      Skylink.prototype.DATA_CHANNEL_TYPE.DATA,
    custom: {}
  };

  var eventManager = {
    listeners: {},
    emit: function (evt, params) {
      /* jshint ignore:start */
      if (evt === 'state') {
        params.type = channel.type;
        params.label = channel.label;
        params.bufferedAmount = channel.connection.bufferedAmount || 0;
        params.bufferedAmountLowThreshold = channel.connection.bufferedAmountLowThreshold || 0;
        // Polyfill for plugin that does not have this property
        params.binaryType =  channel.connection.binaryType || 'arraybuffer';
        params.messageErrorType = params.messageErrorType || null;
        params.error = params.error || null;
        logFn('log', 'State "' + params.state + '" ->', params);
      } else if (evt === 'data') {
        logFn('debug', 'Data ' + (params.type ? '"' + params.type + '" protocol ->' : 'chunk'),
          params.type ? params : '(Size: ' + (params.size || params.length || params.byteLength) + ')');
      }
      /* jshint ignore:end */
      UtilsFactory.forEach(eventManager.listeners[evt] || [], function (fn) {
        fn(params);
      });
    }
  };

  /**
   * - Function that logs the component internally.
   */
  var logFn = function (level, message, obj) {
    Log[level](channel.instanceId, [channel.peerId, 'Datachannel', channel.prop, message], obj);
  };

  /**
   * - Function that handles the RTCDataChannel.onopen event.
   */
  var onOpenEventFn = function () {
    var fn = function () {
      eventManager.emit('state', {
        state: Skylink.prototype.DATA_CHANNEL_STATE.OPEN
      });
    };

    if (channel.connection.readyState === Skylink.prototype.DATA_CHANNEL_STATE.OPEN) {
      // Prevent event handlers triggering before Datachannel object was defined
      setTimeout(fn, 1); // 500);
    } else {
      // Prevent event handlers triggering before Datachannel object was defined
      setTimeout(function () {
        eventManager.emit('state', {
          state: channel.connection.readyState
        });
      }, 1);
      channel.connection.onopen = function () {
        // Prevent timelapse where the other state is triggered before "open"
        setTimeout(fn, 1);
      };
    }
  };

  /**
   * - Function that handles the RTCDataChannel.onclose event.
   */
  var onCloseEventFn = function () {
    var fn = function () {
      if (!channel.states.closing) {
        channel.states.closing = true;
        eventManager.emit('state', {
          state: Skylink.prototype.DATA_CHANNEL_STATE.CLOSING
        });
      }

      setTimeout(function () {
        eventManager.emit('state', {
          state: Skylink.prototype.DATA_CHANNEL_STATE.CLOSED
        });

        if (channel.states.rejected) {
          return;
        }

        /* jshint ignore:start */
        // Set jshint to make it less ranty over called before defined (or empty block).. and if you look into
        // the call-steps, this won't be called only after the first openChannelFn is called
        // Revive only MESSAGING Datachannel connection for P2P messaging
        if (channel.type === Skylink.prototype.DATA_CHANNEL_TYPE.MESSAGING) {
          logFn('debug', 'Reviving "main" connection.');
          // This indicates the Peer is offerer, so we can revive the Datachannel connection
          // Ensure that Peer connection is correct and not closed
          // Checks happens in the function
          setTimeout(openChannelFn, 100);
        }
        /* jshint ignore:end */
      }, 1);
    };

    // Fixes for Firefox bug (49 is working) -> https://bugzilla.mozilla.org/show_bug.cgi?id=1118398
    if (window.webrtcDetectedBrowser === 'firefox') {
      var triggered = false;
      var block = 0;

      channel.connection.onclose = function () {
        if (!triggered) {
          triggered = true;
          fn();
        }
      };

      var intervalChecker = setInterval(function () {
        if (channel.connection.readyState === Skylink.prototype.DATA_CHANNEL_STATE.CLOSED || triggered || block === 5) {
          clearInterval(intervalChecker);

          if (!triggered) {
            triggered = true;
            fn();
          }
        // After 5 seconds from CLOSING state and Firefox is not rendering to close, we have to assume to close it.
        // It is dead! This fixes the case where if it's Firefox who closes the Datachannel, the connection will
        // still assume as CLOSING..
        } else if (channel.connection.readyState === Skylink.prototype.DATA_CHANNEL_STATE.CLOSING) {
          block++;
        }
      }, 1000);

    } else {
      channel.connection.onclose = fn;
    }
  };

  /**
   * - Function that handles the RTCDataChannel.onmessage event.
   */
  var onMessageEventFn = function () {
    channel.connection.onmessage = function (evt) {
      var data = evt.data || evt;

      if (data && typeof data === 'string') {
        try {
          var protocol = JSON.parse(data);
          eventManager.emit('data', protocol);
        } catch (error) {
          if (data.indexOf('{') > -1 && data.indexOf('}') === (data.length - 1)) {
            logFn('error', 'Dropping received data as due to incorrect JSON parsing ->', { data: data,
              size: data.length || data.size, error: error });
            eventManager.emit('state', {
              state: Skylink.prototype.DATA_CHANNEL_STATE.ERROR,
              error: error
            });
            return;
          }

          // Remove spaces if its binarystring file transfer data chunk for Android SDK bug case
          eventManager.emit('data', data);
        }
      // Convert data to Blob for now
      } else {
        if (data instanceof Blob) {
          eventManager.emit('data', data);
        } else {
          // Convert and re-prase for some browser for plugin case and ArrayBuffer to Blob
          var dataToBlob = new Blob([data.constructor && data.constructor.name === 'Array' ? new Int8Array(data) : data]);
          eventManager.emit('data', dataToBlob);
        }
      }
    };
  };

  /**
   * - Function that handles the RTCDataChannel.onbufferedamountlow event.
   */
  var onBufferedAmountLowEventFn = function () {
    channel.connection.onbufferedamountlow = function () {
      eventManager.emit('state', {
        state: Skylink.prototype.DATA_CHANNEL_STATE.BUFFERED_AMOUNT_LOW
      });
    };
  };

  /**
   * - Function that opens or initialises the RTCDataChannel connection.
   */
  var openChannelFn = function () {
    if (channel.states.rejected || !connection) {
      return;
    }

    if (!connection.label && connection.signalingState !== Skylink.prototype.PEER_CONNECTION_STATE.CLOSED) {
      try {
        logFn('debug', 'Opening connection.');
        channel.connection = connection.createDataChannel(channel.label, {
          reliable: true,
          ordered: true
        });
      } catch (error) {
        logFn('error', 'Failed opening connection ->', error);
        eventManager.emit('state', {
          state: Skylink.prototype.DATA_CHANNEL_STATE.CREATE_ERROR,
          error: error
        });
        return;
      }
    } else {
      logFn('debug', 'Initialising connection.');
      channel.connection = connection;
      channel.label = connection.label;
    }
    channel.states.closing = false;
    onOpenEventFn();
    onCloseEventFn();
    onMessageEventFn();
    onBufferedAmountLowEventFn();
  };

  openChannelFn();

  return {
    /**
     * + Function that subscribes to an event.
     */
    on: function (evt, fn) {
      eventManager.listeners[evt] = eventManager[evt] || [];
      eventManager.listeners[evt].push(fn);
    },

    /**
     * + Function that sends a data to Datachannel connection.
     *   Use [callback] function to indicate as success data sent.
     */
    send: function (data, sendAsRaw, fn) {
      if (!channel.connection) {
        return;
      }
      var messageErrorType = data && typeof data === 'object' && !sendAsRaw && data.type === 'MESSAGE' ?
        Skylink.prototype.DATA_CHANNEL_MESSAGE_ERROR.MESSAGE : Skylink.prototype.DATA_CHANNEL_MESSAGE_ERROR.TRANSFER;

      if (channel.connection.readyState !== Skylink.prototype.DATA_CHANNEL_STATE.OPEN) {
        logFn('warn', 'Dropping data as connection is not opened ->', { data: data,
          size: data.size || data.length || data.byteLength, error: error });
        eventManager.emit('state', {
          state: Skylink.prototype.DATA_CHANNEL_STATE.SEND_MESSAGE_ERROR,
          error: new Error('Failed sending message as Datachannel connection state is not opened. Current ' +
            'readyState is "' + channel.connection.readyState + '"'),
          messageType: messageErrorType
        });
        return;
      }

      try {
        DataProcess(data, channel.connection.binaryType, sendAsRaw, function (converted) {
          channel.connection.send(sendAsRaw ? converted : JSON.stringify(converted));
          logFn('debug', 'Sending ' + (sendAsRaw ? 'String' : '"' + converted.type + '" protocol') + ' ->',
            sendAsRaw ? '(Size: ' + (converted.length || converted.size) + ')' : converted);
          fn();
        });


        if (sendAsRaw && data && typeof data === 'object') {
          

          data instanceof Blob

          var converted = data;
          // Blob data to be converted..
          // Plugin does not have binaryType but it uses arraybuffer by default (like chrome)
          if ( && (channel.states.isPlugin ||  === 'arraybuffer')) {
            DataProcess.blobToArrayBuffer(data, function (converted) {
              logFn('debug', 'Sending converted Blob to Arraybuffer ->' + '(Size: ' + converted.byteLength + ')');
              fn();
            });
          // Arraybuffer data to be converted
          } else if (!(data instanceof Blob) && channel.connection.binaryType === 'blob') {
            DataProcess.process
            converted = new Blob(data);
            channel.connection.send(new Blob(data));
            logFn('debug', 'Sending converted Arraybuffer to Blob ->' + '(Size: ' + converted.size + ')');
            fn();
          // No need conversion as it is supported
          } else {
            channel.connection.send(data);
            logFn('debug', 'Sending ' + (data.size ? 'Blob' : 'Arraybuffer') + ' ->' + '(Size: ' +
              (data.size || data.byteLength) + ')');
            fn();
          }
        } else {
          
        }
      // RTCDataChannel could be closed (dead).
      } catch (error) {
        logFn('error', 'Failed sending data ->', { data: data,
          size: data.size || data.length || data.byteLength, error: error });

        eventManager.emit('state', {
          state: Skylink.prototype.DATA_CHANNEL_STATE.SEND_MESSAGE_ERROR,
          error: error,
          messageType: messageErrorType
        });
      }
    },

    /**
     * + Function that closes the Datachannel connection.
     */
    close: function () {
      if (!channel.connection) {
        return;
      }
      if (channel.connection.readyState !== Skylink.prototype.DATA_CHANNEL_STATE.CLOSED) {
        logFn('debug', 'Closing connection.');
        if (!channel.states.closing) {
          channel.states.closing = true;
          eventManager.emit('state', {
            state: Skylink.prototype.DATA_CHANNEL_STATE.CLOSING
          });
        }
        channel.connection.close();
      }
    },

    /**
     * + Function that returns the Datachannel connection session info.
     */
    getInfo: function () {
      return {
        readyState: channel.connection.readyState,
        label: channel.label,
        prop: channel.prop,
        type: channel.type,
        bufferedAmount:  channel.connection.bufferedAmount || 0,
        bufferedAmountLowThreshold: channel.connection.bufferedAmountLowThreshold || 0,
        binaryType: channel.connection.binaryType || 'arraybuffer',
        custom: channel.custom
      };
    },

    /**
     * + Function that sets the Datachannel connection custom info.
     */
    setCustom: function (prop, value) {
      channel.custom[prop] = value;
    }
  };
};
