module.exports = function(config) {
  config.set({
    basePath: '..',
    frameworks: ['mocha', 'chai-as-promised', 'chai'],
    files: [
      { pattern: 'node_modules/socket.io-client/socket.io.js', included: true, served: true },
      { pattern: 'node_modules/adapterjs/publish/adapter.screenshare.js', included: true, served: true },
      { pattern: 'source/**/*.js', included: false, served: true },
      { pattern: 'tests/libs/*.js', included: true, served: true },
      { pattern: 'tests/units/*.js', included: true, served: true }
    ],
    exclude: [],
    preprocessors: {},
    reporters: ['mocha'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_NONE,
    autoWatch: false,
    customLaunchers: {
      ChromeCustom: {
        base: 'Chrome',
        flags: ['--use-fake-ui-for-media-stream', '--disable-user-media-security']
      },
      FirefoxCustom: {
        base: 'Firefox',
        prefs: {
          'media.navigator.permission.disabled': true,
          'media.getusermedia.screensharing.enabled': true
        } 
      }
    },
    browsers: ['ChromeCustom'], //'FirefoxCustom', 'Safari', 'IE', 'Opera'],
    transports: ['websocket', 'flashsocket', 'xhr-polling', 'jsonp-polling', 'polling'],
    browserNoActivityTimeout: 4 * 60 * 1000,
    singleRun: true,
    plugins: [
      'karma-mocha', 
      'karma-mocha-reporter', 
      'karma-chai',
      'karma-chai-as-promised',
      'karma-chrome-launcher', 
      'karma-safari-launcher', 
      'karma-firefox-launcher',
      'karma-ie-launcher',
      'karma-opera-launcher' 
    ]
  });
};