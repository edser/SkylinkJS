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
