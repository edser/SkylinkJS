$(document).ready(function () {
  var dataStorage = {};

  /**
   * Handles the rendering of a single component template.
   */
  var Template = {
    /**
     * Loop class items.
     * @method loop
     * @for Template
     */
    loop: function (className, type, fn) {
      var index = 0;
      while (index < dataStorage.classitems.length) {
        if (dataStorage.classitems[index]['class'] === className && (
          (type === 'properties' && !dataStorage.classitems[index].final &&
          dataStorage.classitems[index].itemtype === 'attribute') || (type === 'constants' &&
          dataStorage.classitems[index].final && dataStorage.classitems[index].itemtype === 'attribute') ||
          (type === 'events' && dataStorage.classitems[index].itemtype === 'event') ||
          (type === 'methods' && dataStorage.classitems[index].itemtype === 'method'))) {
          fn(dataStorage.classitems[index]);
        }
        index++;
      }
    },

    /**
     * Render class content.
     * @method renderClass
     * @for Template
     */
    renderClass: function (className) {
      return '<section class="doc"><h1><var>' + className + '</var> ' +
        (dataStorage.classes[className].typedef || 'class') + '</h1>' +
        '<article class="_first"><p>' + window.marked(dataStorage.classes[className].description || '') + '</p>' +
        this.renderSummary(className, 'properties') +
        this.renderSummary(className, 'constants') +
        this.renderSummary(className, 'methods') +
        this.renderSummary(className, 'events') + '</article>' +
        this.renderItems(className, 'constructor') +
        this.renderItems(className, 'properties') +
        this.renderItems(className, 'constants') +
        this.renderItems(className, 'methods') +
        this.renderItems(className, 'events');
    },

    /**
     * Render item type.
     * @method renderItemType
     * @for Template
     */
    renderItemType: function (type) {
      if (!type) {
        return '<var>None</var>';
      }
      var items = type.split('|'), outputStr = '', index = 0;
      while (index < items.length) {
        if (['Object', 'Array', 'ArrayBuffer', 'Blob', 'String', 'Number',
          'Boolean', 'JSON', 'Error', 'MediaStream', 'Function', 'RTCCertificate'].indexOf(items[index]) > -1) {
          outputStr += '<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/' +
				    'Reference/Global_Objects/' + items[index] + '" target="_blank">' + items[index] + '</a>';
        } else if (type === 'Any') {
          outputStr += '<var>Any</var>';
        } else {
          outputStr += '<a class="select-template-item" template="' + items[index] +
            '"><var>' + items[index] + '</var></a>';
        }
        outputStr += index === items.length - 1 ? '' : ' | ';
        index++;
      }
      return outputStr;
    },

    /**
     * Render class event/method/attr summary table item description.
     * @method renderSummaryDescription
     * @for Template
     */
    renderSummaryDescription: function (text) {
      return window.marked(text || '').replace(/<(\/p|p)>|<(ul|ol)>(.|\r|\n|\s)*<\/(ul|ol)>/gi, '').replace(
        /<blockquote\ class\=\".*\">.*<\/blockquote>/gi, '').replace(/<(br|hr|br\/|hr\/)>/gi, '');
    },

    /**
     * Render class event/method/attr summary table.
     * @method renderSummary
     * @for Template
     */
    renderSummary: function (className, type) {
      var outputStr = '', ref = this;

      ref.loop(className, type, function (item) {
        if (!item) {
          return;
        }

        if (type === 'properties') {
          outputStr += '<tr><td><a href="#attr_' + item.name + '"><code>.' + item.name + '</code></a></td><td><var>' +
            ref.renderItemType(item.type) + '</var></td><td>' + ref.renderSummaryDescription(item.description) + '</td></tr>';
        } else if (type === 'constants') {
           outputStr += '<tr><td><a href="#attr_' + item.name + '"><code>.' + item.name + '</code></a></td><td>' +
            ref.renderSummaryDescription(item.description) + '</td></tr>';
        } else if (type === 'methods') {
           outputStr += '<tr><td><a href="#method_' + item.name + '"><code>.' + item.name + '()</code></a></td>' + 
            '<td><var>' + ref.renderItemType(item.type) + '</var></td><td>' +
            ref.renderSummaryDescription(item.description) + '</td></tr>';
        } else if (type === 'events') {
          outputStr += '<tr><td><a href="#event_' + item.name + '"><code>"' + item.name + '"</code></a></td>' + 
            '<td>' + ref.renderSummaryDescription(item.description) + '</td></tr>';
        }
      });

      if (!outputStr) {
        return '';
      }

      if (type === 'properties') {
        return '<h5>Properties</h5><div class="table-responsive"><table><thead><tr><th>Name</th><th>Type</th>' +
          '<th>Description</th></tr></thead><tbody>' + outputStr + '</tbody></table></div>';
      } else if (type === 'constants') {
        return '<h5>Constants / Enums</h5><div class="table-responsive"><table><thead><tr><th>Name</th>' +
          '<th>Description</th></tr></thead><tbody>' + outputStr + '</tbody></table></div>';
      } else if (type === 'methods') {
        return '<h5>Methods</h5><div class="table-responsive"><table><thead><tr><th>Method</th><th>Returns</th>' +
          '<th>Description</th></tr></thead><tbody>' + outputStr + '</tbody></table></div>';
      } else if (type === 'events') {
        return '<h5>Events</h5><div class="table-responsive"><table><thead><tr><th>Event</th>' +
          '<th>Description</th></tr></thead><tbody>' + outputStr + '</tbody></table></div>';
      }
      return '';
    },

    /**
     * Render class event/method/attr items parameters.
     * @method renderItemsParams
     * @for Template
     */
    renderItemsParams: function (params, isChild) {
      if (!(Array.isArray(params) && params.length > 0)) {
        return isChild ? '' : '<p>None</p>';
      }
      var outputStr = '', index = 0;

      while (index < params.length) {
        var desc = (params[index].description || ''), isCbParam = false, deprecated = false;
        if (desc.indexOf('@(cbparam)') > -1) {
          desc = desc.replace(/@\(cbparam\)/gi, '');
          isCbParam = true;
        }
        if (desc.indexOf('@(deprecated)') > -1) {
          desc = desc.replace(/@\(deprecated\)/gi, '');
          deprecated = true;
        }
        outputStr += '<li><p class="name"><var><b>' + params[index].name + '</b></var> &nbsp;:&nbsp; <var>' +
          this.renderItemType(params[index].type) + '</var>' +
          (params[index].optdefault ? '<span class="name-default">Default: <code>' + params[index].optdefault +
          '</code></span>' : '') + (isCbParam ? '<span class="label primary"><i class="fa fa-mail-reply"></i>' + 
          ' function parameter</span>' : '') + (deprecated ? '<span class="label danger">' + 
          '<i class="fa fa-exclamation-triangle"></i> deprecated</span>' : '') +
          '</p><p class="desc">' + window.marked(desc).replace(/<(br|br\/)>/gi, '') +
          '</p>' + this.renderItemsParams(params[index].props, true) + '</li>';
        index++;
      }
      return '<ul class="doc-params">' + outputStr + '</ul>';
    },

    /**
     * Render class event/method/attr items.
     * @method renderItems
     * @for Template
     */
    renderItems: function (className, type) {
      var outputStr = '', ref = this;
      var renderFn = function (item) {
        var requiresItem = item.requires ? item.requires(':') : null;
        outputStr += '<article class="doc-item"><p class="doc-item-type-first">' +
          (item.is_constructor ? 'Constructor' : (item.itemtype === 'attribute' ? (item.final ? 'Constant' :
          'Property') : (item.itemtype === 'event' ? 'Event' : 'Method'))) + '</p><div class="doc-type"><div class="doc-type-wrapper">' +
          (item.async ? '<span class="label primary"><i class="fa fa-exchange"></i> async</span>' : '') +
          (item.deprecated ? '	<span class="label danger"><i class="fa fa-exclamation-triangle"></i> deprecated</span>' : '') +
          (item.beta ? '<span class="label info"><i class="fa fa-flask"></i> beta / experimental</span>' : '') +
          (item.optional ? '<span class="label default"><i class="fa fa-puzzle-piece"></i> optional</span>' : '') +
          (item.final ? '<span class="label warning"><i class="fa fa-gavel"></i> final</span>' : '') +
          '<span class="version">Since: ' + (item.since || '-') + '</span><span class="type">' +
          (item.itemtype === 'attribute' && item.final ? 'constant' : (item.is_constructor ? 'constructor' : item.itemtype)) + '</span>' +
          '<span class="definedat">Defined at: <a><var>' + item.file + ':' + item.line + '</var></a></span></div></div>' +
          '<h3><var>' + (item.is_constructor ? 'new ' + item.name + '()' : (item.itemtype === 'event' ?
          '"' + item.name + '"' : '.' + item.name + (item.itemtype === 'method' ? '()' : ''))) + '</var> <small>' +
          (item.itemtype === 'attribute' ? ' : &nbsp;' + ref.renderItemType(item.type) : (item.itemtype === 'method' ?
          ' &#8594;&nbsp; ' + ref.renderItemType(item.returnType) : '')) + '</small></h3><p class="doc-supports">' +
          (requiresItem ? '<span class="when">Available / Defined when <var>' + requiresItem[0] + '</var> is <code>' +
          requiresItem[1] + '/code>.</span>' : '') + '<!--<span class="supports"><em class="title">Supports:</em>' +
				  '<em><i class="fa fa-chrome"></i> 55</em><em><i class="fa fa-firefox"></i> 48</em>' +
          '<em><i class="fa fa-opera"></i> 37</em><em><i class="fa fa-safari"></i> 7 (0.8.870)</em>' +
				  '<em><i class="fa fa-internet-explorer"></i> 11 (0.8.870)</em><em><i class="fa fa-edge"></i> 13.457</em>' +
				  '<em><i class="fa fa-android"></i> 8</em><em><i class="fa fa-globe"></i> 0.6.1</em></span>--></p>' +
          '<p>' + window.marked(item.description || '') + '</p><h5>' + (item.itemtype === 'attribute' ? 'Properties:' :
          (item.itemtype === 'event' ? 'Payloads:' : 'Parameters:')) + '</h5>' + ref.renderItemsParams(item.params) +
          '</article>';
      };

      if (type === 'constructor') {
        if (dataStorage.classes[className] && dataStorage.classes[className].is_constructor) {
          renderFn(dataStorage.classes[className]);
        }
      } else {
        ref.loop(className, type, renderFn);
      }
      return outputStr;
    }
  };

  /**
   * Handles the loading of the template.
   */
  (function (fn) {
    /**
     * @event click
     * @for #side-menu a
     */
    $('#side-menu').on('click', 'a', function () {
      if ($(this).parent().find('ul').length === 0) {
        return fn($(this).attr('template'));
      }
      $(this).toggleClass('active');
      $(this).find('.fa').toggleClass('fa-caret-down').toggleClass('fa-caret-up');
      $(this).parent().find('ul').slideToggle();
    });

    /**
     * @event click
     * @for #populate-template a.select-template-item
     */
    $('#populate-template').on('click', 'a.select-template-item', function () {
      fn($(this).attr('template'));
    });

    fn('static/overview_01');

  })(function (route) {
    if (!route) {
      return;
    }

    // Appear to user it's selected
    $('a[template].active').removeClass('active');
    $('a[template="' + route + '"]').toggleClass('active');
    $('#populate-template').html('');
    $('#populate-template').scrollTop(0);
    
    if (route.indexOf('static/') === 0) {
      $('#populate-template').load('content/templates/' + route + '.html', function () {
        $('a[template].active').removeClass('active');
        $('a[template="' + route + '"]').toggleClass('active');
        prettyPrint();
      });
      return;
    }

    if (!dataStorage.classes[route]) {
      return;
    }

    $('#populate-template').html(Template.renderClass(route));
  });

  /**
   * Handles the window size resizing.
   */
  (function (fn) {
    $(window).resize(fn);
    fn();
  })(function () {
    $('.container navbar.side, .container .body').height($(window).height() - $('navbar.top').outerHeight());
  });

  /**
   * Populate the menu items.
   */
  (function () {
    var xhr = new XMLHttpRequest();

    if (['window', 'object'].indexOf(window.XDomainRequest) > -1) {
      xhr = new XDomainRequest();
    }

    xhr.onload = function() {
      dataStorage = JSON.parse(xhr.response || xhr.responseText || '{}');
      var menuTemasysOutputStr = '<li><a>Temasys <small>module</small>' +
        '<i class="fa fa-caret-down"></i></a><ul>';
      var menuSkylinkOutputStr = '';

      if (dataStorage.classes) {
        for (var className in dataStorage.classes) {
          // Hard-code Temasys for now to be quicker
          if (dataStorage.classes.hasOwnProperty(className) && dataStorage.classes[className]) {
            var str = '<li><a template="' + className + '">' + className + ' <small>' +
              (dataStorage.classes[className].typedef || 'class') + '</small></a></li>';
            if (className.indexOf('Temasys.') === 0) {
              menuTemasysOutputStr += str;
            } else {
              menuSkylinkOutputStr += str;
            }
          }
          $('#populate-side-menu').html(menuTemasysOutputStr + '</ul></li>' + menuSkylinkOutputStr);
        }
      }
    };

    xhr.open('GET', 'content/data/data.json', true);
    xhr.send();
  })();
});