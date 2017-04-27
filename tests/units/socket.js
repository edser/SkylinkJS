describe('Temasys.Socket', function() {
	// Load the script first
	before(function (done) {
		loadScript([
      'base/source/components/utils.js',
      'base/source/components/debugger.js',
      'base/source/components/socket.js'
    ], function (err) {
			if (err) {
				throw err;
			}
			done();
		});
	});

  /**
   * 
   */
})