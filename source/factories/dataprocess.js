/**
 * Factory that handles Data packets processing.
 */
var DataProcess = {
  /**
   * + Function that converts Blob to ArrayBuffer.
   */
  blobToArrayBuffer: function (blob, fn) {
    var fr = new FileReader();
    fr.onload = function () {
      fn(AdapterJS && AdapterJS.WebRTCPlugin && AdapterJS.WebRTCPlugin.plugin &&
        AdapterJS.WebRTCPlugin.plugin.VERSION ? new Int8Array(fr.result) : fr.result)
    };
    fr.readAsArrayBuffer(blob);
  }
};