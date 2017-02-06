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
 * @param {Boolean} [options.printInstanceLabel=false] The flag if SDK should print the Skylink object
 *   instance label with the related log.
 * @param {Boolean} [options.printTimeStamp=false] The flag if SDK should print the DateTime stamp
 *   with the related log.
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
Skylink.prototype.setDebugMode = function(options) {
  var self = this;

  if (options && typeof options === 'object') {
    self._debugOptions.trace = options.trace === true;
    self._debugOptions.storeLogs = options.storeLogs === true;
    self._debugOptions.printInstanceLabel = options.printInstanceLabel === true;
    self._debugOptions.printTimeStamp = options.printTimeStamp === true;
  } else if (options === true) {
    self._debugOptions.trace = true;
    self._debugOptions.storeLogs = true;
    self._debugOptions.printInstanceLabel = true;
    self._debugOptions.printTimeStamp = true;
  } else {
    self._debugOptions.trace = false;
    self._debugOptions.storeLogs = false;
    self._debugOptions.printInstanceLabel = false;
    self._debugOptions.printTimeStamp = false;
  }

  Log.configure(self._debugOptions.instanceId, self._debugOptions);
  Log.log(self._debugOptions.instanceId, 'setDebugMode(): Set debug options ->', UtilsFactory.clone(self._debugOptions));
};