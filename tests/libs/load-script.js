// From npm "load-script" but converted not to be module.exports
// See: https://www.npmjs.com/package/load-script
// Version: 1.0.0
// Note that the script has been modified for the tests
var loadScript = (function () {
	function load (src, opts, cb) {
		var head = document.head || document.getElementsByTagName('head')[0]
		var script = document.createElement('script')

		if (typeof opts === 'function') {
			cb = opts
			opts = {}
		}

		opts = opts || {}
		cb = cb || function() {}

		script.type = opts.type || 'text/javascript'
		script.charset = opts.charset || 'utf8';
		script.async = 'async' in opts ? !!opts.async : true
		script.src = src

		if (opts.attrs) {
			setAttributes(script, opts.attrs)
		}

		if (opts.text) {
			script.text = '' + opts.text
		}

		var onend = 'onload' in script ? stdOnEnd : ieOnEnd
		onend(script, cb)

		// some good legacy browsers (firefox) fail the 'in' detection above
		// so as a fallback we always set onload
		// old IE will ignore this and new IE will set onload
		if (!script.onload) {
			stdOnEnd(script, cb);
		}

		head.appendChild(script)
	}

	function setAttributes(script, attrs) {
		for (var attr in attrs) {
			script.setAttribute(attr, attrs[attr]);
		}
	}

	function stdOnEnd (script, cb) {
		script.onload = function () {
			this.onerror = this.onload = null
			cb(null, script)
		}
		script.onerror = function () {
			// this.onload = null here is necessary
			// because even IE9 works not like others
			this.onerror = this.onload = null
			cb(new Error('Failed to load ' + this.src), script)
		}
	}

	function ieOnEnd (script, cb) {
		script.onreadystatechange = function () {
			if (this.readyState != 'complete' && this.readyState != 'loaded') return
			this.onreadystatechange = null
			cb(null, script) // there is no way to catch loading errors in IE8
		}
	}

	return function (list, fn) {
		list = list && typeof list === 'string' ? [list] : list;

		if (!Array.isArray(list)) {
			throw new Error('Invalid "list" provided.');
		}

		var index = 0;
		var nextFn = function () {
			load(list[index], function (err, success) {
				if (err) {
					return fn(err);
				}
				index++;
				if (index < list.length) {
					nextFn();
				} else {
					fn(null, success);
				}
			});
		};
		nextFn();
	};
})();