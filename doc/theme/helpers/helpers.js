module.exports = {
	contains: function (context, options) {
		return JSON.stringify([context,options]);
	},
	typeof: function (context) {
		return '<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/' +
			context + '" target="_blank"></a>';
	}
};