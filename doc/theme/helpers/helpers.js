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
	}
};