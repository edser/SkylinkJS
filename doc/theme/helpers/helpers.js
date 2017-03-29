var t = 0;
/**
 * Function to print "type".
 * @method sharedPrintTypeFn
 * @private
 */
function sharedPrintTypeFn (typeItem) {
	if (!typeItem) {
		return '';
	}
	var outputStr = '';
	var types = typeItem.split('|');
	for (var i = 0; i < types.length; i++) {
		if (['JSON', 'Array', 'String', 'Boolean', 'ArrayBuffer', 'Blob', 'Error',
			'Number', 'Date', 'Promise', 'Function', 'Object', 'MediaStream'].indexOf(types[i]) > -1) {
			outputStr += '<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/' +
				'Reference/Global_Objects/' + types[i] + '" target="_blank"><var>' + types[i] + '</var></a>';
		} else if (types[i] !== 'Any') {
			outputStr += '<a class="load-template-item" template="classes/' + types[i] +
				'" target="_blank"><var>' + types[i] + '</var></a>';
		} else {
			outputStr += '<var>' + types[i] + '</var>';
		}
		if (i !== (types.length - 1)) {
			outputStr += '|';
		}
	}
	return outputStr;
}

/**
 * * Function to print "params".
 * @method sharedPrintParamsFn
 * @private
 */
function sharedPrintParamsFn (params, isReturn) {
	var outputStr = '';
	for (var i = 0; i < params.length; i++) {
		// YUIDoc hack
		if (params[i].name.indexOf('_return') === 0 ? !isReturn : isReturn) {
			continue;
		}
		var name = params[i].name, desc = params[i].description,
			deprecated = false, beta = false, cbfn = false;
		if (desc.indexOf('@{beta}') > -1) {
			beta = true;
			desc = desc.replace(/@{beta}/gi, '');
		}
		if (desc.indexOf('@{depre}') > -1) {
			deprecated = true;
			desc = desc.replace(/@{depre}/gi, '');
		}
		if (desc.indexOf('@{cbfn}') > -1) {
			cbfn = true;
			desc = desc.replace(/@{cbfn}/gi, '');
		}
		if (name.indexOf('_return') === 0) {
			name = name.replace(/_return/gi, '');
		}
		outputStr += '<li><p class="name"><var><b>' + name + '</b> - ' + sharedPrintTypeFn(params[i].type) + '</var>' +
			(params[i].optdefault ? '<span class="name-default">Default: <code>' + params[i].optdefault +
			'</code></span>' : '') + (params[i].optional ? '<span class="label default">' +
			'<i class="fa fa-puzzle-piece"></i> optional' : '') + (beta ?
			'<span class="label info"><i class="fa fa-flask"></i> beta</span>' : '') + (deprecated ?
			'<span class="label danger"><i class="fa fa-exclamation-triangle"></i> deprecated</span>' : '') +
			(cbfn ? '<span class="label primary"><i class="fa fa-mail-reply"></i> function param</span>' : '') +
			'</p><p class="desc">' + desc + '</p>' + (Array.isArray(params[i].props) &&
			params[i].props.length > 0 ? sharedPrintParamsFn(params[i].props, isReturn) : '') + '</li>';
	}
	return '<ul class="doc-params">' + outputStr + '</ul>';
}

module.exports = {
	/**
	 * Renders the sidebar menu item.
	 * @template sidebaritem
	 * @for sidebar.handlebars
	 */
	sidebaritem: function (item, isTemasys, projectRoot) {
		var index = item.name.indexOf('Temasys.');
		if (isTemasys ? index > -1 : index === -1) {
			return '<li><a template="classes/' + item.name + '" class="nodropdown">' + item.displayName + ' <small>' +
				(['Temasys.Utils', 'SkylinkLogs'].indexOf(item.name) > -1 ? 'module' : 'class') + '</small></a></li>';
		}
	},

	/**
	 * Renders the sidebar default menu items.
	 * @template sidebardefaultitems
	 * @for sidebar.handlebars
	 */
	sidebardefaultitems: function () {
		var outputStr = '';
		var items = [{
			name: 'Overview',
			index: 1,
			route: 'overview',
			subitems: [
				{ name: 'Architecture', route: 'architecture', index: 'a', default: true },
				{ name: 'Authenticating App Key', route: 'authenticate', index: 'b' },
				{ name: 'Feature: Persistent Rooms', route: 'persistent', index: 'c' },
				{ name: 'Feature: Auto-Introduce & Privileged', route: 'privileged', index: 'd' }
			]
		}, {
			name: 'Integrating to Your Site',
			index: 2,
			route: 'integrate',
			subitems: [
				{ name: 'Referencing the SDK', route: 'reference', index: 'a' },
				{ name: 'Code Samples', route: 'samples', index: 'b' },
				{ name: 'Integrating your extensions & WebRTC plugin', route: 'extension', index: 'c' }
			]
		}, {
			name: 'Demos',
			index: 3,
			route: 'demo'
		}];
		for (var i = 0; i < items.length; i++) {
			outputStr += '<li><a ' + (items[i].subitems ? '' : 'template="assets/templates/' + items[i].route +
				'" class="nodropdown"') + '>' + items[i].index + '. ' + items[i].name + (items[i].subitems ?
				'<i class="fa fa-caret-down"></i>' : '') + '</a>';
			if (items[i].subitems) {
				outputStr += '<ul>';
				for (var j = 0; j < items[i].subitems.length; j++) {
					outputStr += '<li><a template="assets/templates/' + items[i].route + '/' + items[i].subitems[j].route +
					  '" class="' + (items[i].subitems[j].default ? 'template-default' : '') + '">' +items[i].subitems[j].index +
						'. ' + items[i].subitems[j].name + '</a></li>';
				}
				outputStr += '</ul>';
			}
			outputStr += '</li>';
		}
		return outputStr;
	},

	/**
	 * Renders the header.
	 * @template header
	 * @for classes.handlebars
	 */
	header: function (name) {
		return '<h1><var>' + name + '</var> ' + (['Temasys.Utils', 'SkylinkLogs'].indexOf(
			name) > -1 ? 'module' : 'class') + '</h1>';
	},

	/**
	 * Renders the table item description.
	 * @template tableItemDescription
	 * @for classes.handlebars
	 */
	tableItemDescription: function (desc) {
		var paragraph = desc.toString().match(/<p>.*<\/p>/gi);
		if (Array.isArray(paragraph) && paragraph[0]) {
			return paragraph[0].replace(/<(p|\/p)>/gi, '');
		}
		return '';
	},

	/**
	 * Renders the table item params.
	 * @template tableItemParams
	 * @for classes.handlebars
	 */
	tableItemParams: function (params) {
		if (!(Array.isArray(params))) {
			return '()';
		}
		var outputStr = '';
		for (var i = 0; i < params.length; i++) {
			if (params[i].name === 'returns') {
				continue;
			}
			outputStr += '<code>' + (params[i].optional ? '[' : '') + params[i].name +
				(params[i].optional ? ']' : '') + '</code>' + (i !== (params.length - 1) &&
				!(params[i + 1] && params[i + 1].name === 'returns') ? ', ' : '');
		}
		return '(' + outputStr + ')';
	},

	/**
	 * Renders the parameters items list.
	 * @template parameters
	 * @for classes.handlebars
	 */
	parameters: function (_params, _isReturn) {
		if (!(Array.isArray(_params) && _params.length > 0)) {
			return '<p>None</p>';
		}
		return sharedPrintParamsFn(_params, _isReturn);
	},

	/**
	 * Renders the when clause item.
	 * @template when
	 * @for classes.handlebars
	 */
	when: function (whenItem) {
		if (whenItem) {
			var parts = whenItem.split(',');
			return '<span class="when">Defined only when <var>.' + parts[0] + '</var> is <code>' +
				parts[1] + '</code>.</span>';
		}
		return '';
	},

	/**
	 * Renders the type item.
	 * @template type
	 * @for classes.handlebars
	 */
	type: sharedPrintTypeFn,

	test: function (ref) {
		if (t === 0) {
			console.log(JSON.stringify(ref.is_constructor));
		}
		t++;
	}
};