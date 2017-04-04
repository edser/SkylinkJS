/**
 * Copyright: (c) Temasys Communications Pte Ltd - All Rights Reserved
 */
$(document).ready(function () {
  'use strict';

  /**
   * Stores the utils functions.
   * @attribute utils
   * @type JSON
   * @private
   */
  var utils = {
    /**
     * Function to loop object.
     * @method utils.forEach
     * @param {JSON|Array} obj The object.
     * @param {Function} fn The function invoked each item it goes through the object loop.
     * @private
     */
    forEach: function (obj, fn) {
      if (Array.isArray(obj)) {
        var index = 0;
        while (index < obj.length) {
          fn(obj[index], index);
          index++;
        }
      } else if (obj && typeof obj === 'object') {
        for (var key in obj) {
          if (obj.hasOwnProperty(key)) {
            fn(obj[key], key);
          }
        }
      }
    },

    /**
     * Function to get object keys.
     * @method utils.getKeys
     * @param {JSON} obj The object.
     * @return {Array} The array of keys.
     * @private
     */
    getKeys: function (obj) {
      if (typeof Object.keys !== 'function') {
        var keys = [];
        utils.forEach(obj, function (i, k) {
          keys.push(k);
        });
        return keys;
      }
      return Object.keys(obj);
    },

    /**
     * Function to parse the docs item description.
     * @method utils.parseDocDescription
     * @param {JSON} item The docs item.
     * @return {JSON} The parsed docs item.
     * @private
     */
    parseDocDescription: function (item) {
      if (typeof item.description !== 'string') {
        return item;
      }

      var desc = window.marked(item.description).replace(/<(br|br\/)>/gi, '');

      // Parse for beta tags
      if (desc.indexOf(/@\(beta\)/gi, '') > -1) {
        desc = desc.replace(/@\(beta\)/gi, '');
        item.beta = true;
      }

      // Parse for experimental tags
      if (desc.indexOf(/@\(experimental\)/gi, '') > -1) {
        desc = desc.replace(/@\(experimental\)/gi, '');
        item.experimental = true;
      }

      // Parse for deprecated tags
      if (desc.indexOf(/@\(deprecated\)/gi, '') > -1) {
        desc = desc.replace(/@\(deprecated\)/gi, '');
        item.deprecated = true;
      }

      // Parse #crossLink
      (function () {
        var result = desc.match(/{{#crossLink\ \".*\"}}.*{{\/crossLink}}/gi);
        var index = 0;

        if (result) {
          try {
            while (index < result.length) {
              var parts = result[index].split('"');
              var href = '';
              var title = '';

              if (parts[1].indexOf('/') > 0) {
                var sparts = parts[1].split('/');
                var aparts = sparts[1].split(':');
                href += sparts[0] + '#' + (aparts[1] === 'attribute' ? 'attr' :
                  (aparts[1] === 'event' ? 'event' : 'method')) + '_' + aparts[0];
                title = '<code>' + sparts[0] + '.' + aparts[0] + (aparts[1] === 'method' ? '()' : '') + '</code>';
              } else {
                href += parts[1];
                title = parts[1];
              }

              if (parts[2] && parts[2].match(/}}.*{{\/crossLink/gi)) {
                title = parts[2].split('}}')[1].split('{{/crossLink')[0] || title;
              }

              desc = desc.replace(new RegExp(result[index], 'gi'), '<a href="#' + href + '" target="_blank">' + title + '</a>');
              index++;
            }
          } catch (e) {}
        }
      })();

      item.description = desc;
      item.parameters = [];

      var prop = Array.isArray(item.params) ? 'params' : (Array.isArray(item.props) ? 'props' : '');

      // Parse sub parameters.
      if (prop) {
        utils.forEach(item[prop], function (subitem) {
          item.parameters.push(utils.parseDocDescription(subitem));
        });
        delete item[prop];
      }
      return item;
    },

    /**
     * Function to parse the docs type.
     * @method utils.parseDocType
     * @param {String} type The docs item types.
     * @return {Array} The parsed docs item types.
     * @private
     */
    parseDocType: function (type) {
      var types = [];
      utils.forEach((type || '').split('|'), function (item) {
        if (!item) {
          return [{ type: 'None', href: '' }];
        }
        types.push({
          type: item,
          href: ['String', 'JSON', 'Boolean', 'Number', 'ArrayBuffer', 'Blob',
            'Array', 'Object', 'MediaStream', 'RTCCertificate', 'Function', 'Promise'].indexOf(item) > -1 ?
            'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/' + item :
            '#docs-' + type
        });
      });
      return types;
    },

    /**
     * Function to parse the docs item header.
     * @method utils.parseDocHeader
     * @param {JSON} item The docs item.
     * @return {JSON} The parsed docs item.
     * @private
     */
    parseDocHeader: function (item) {
      var str = '';

      if (item.itemtype === 'attribute') {
        str += '<code>.' + item.name + '</code><span class="type">: ';
      } else if (item.itemtype === 'method' || item.is_constructor) {
        var paramsStr = '';
        utils.forEach(item.parameters, function (param, paramKey) {
          paramsStr += '<small>' + (param.optional ? '[' : '') + param.name + (param.optional ? ']' : '') + '</small>, ';
        });
        // Remove extra ", "
        paramsStr = paramsStr.substr(0, paramsStr.length - 2);
        str += '<code>' + (item.is_constructor ? 'new ' : '.') + item.name + '(' + paramsStr + ')</code><span class="type">&#8594; ';
      } else if (item.itemtype === 'event') {
        str += '<code>"' + item.name + '"</code><span class="type">';
      }

      var types = utils.parseDocType(item.type);

      if (types.length > 0) {
        utils.forEach(types, function (type) {
          str += '<a href="' + type.href + '"' + (type.href.indexOf('http') === 0 ? ' target="_blank"' : '') + '>' + 
            '<code>' + type.type + '</code></a>';
        });
      } else if (item.itemtype === 'method') {
        str += '<var class="return-none">None</var>';
      }

      str += '</span><span class="since">Since: <b>' + (item.since || '-') + '</b></span>';
      return str;
    },

    /**
     * Function to parse the parameters.
     * @method utils.parseDocParams
     * @param {JSON} params The docs params.
     * @return {String} The parsed docs param HTML string.
     * @private
     */
    parseDocParams: function (params, isReturn, isChild) {
      var htmlStr = '';

      utils.forEach(params, function (item) {
        if (item.name.indexOf('return') === 0 ? !isReturn : isReturn) {
          return;
        }

        htmlStr += '<li><div class="param-name"><code>' + item.name + '</code>';

        utils.forEach(utils.parseDocType(item.type), function (type) {
          htmlStr += '<a href="' + type.href + '"' + (type.href.indexOf('http') === 0 ?' target="_blank"' : '') + '>' + 
            '<var class="typeof">' + type.type + '</var></a>';
        });

        if (item.optional) {
          htmlStr += '<span class="optional"><b>Optional</b>' + (item.optdefault ? '- defaults to <code>' +
            item.optdefault + '</code>' : '') + '</span>';
        }

        if (item.deprecated) {
          htmlStr += '<span class="deprecated"><b>Deprecated</b></span>';
        }

        if (item.beta) {
          htmlStr += '<span class="beta"><b>beta</b></span>';
        }

        if (item.experimental) {
          htmlStr += '<span class="beta"><b>experimental</b></span>';
        }

        if (item.response) {
          htmlStr += '<span class="response"><b>Function parameter</b></span>';
        }

        htmlStr += '</div><div class="param-desc">' + utils.parseDocDescription(item.description) + '</div>' +
          utils.parseDocParams(item.parameters, isReturn, true) + '</li>';
      });

      return (!htmlStr && !isChild ? '<p>None</p>' : '<ul class="doc-params">' + htmlStr + '</ul>');
    }
  };

  /**
   * Stores the external links (navbar-top routes)
   * @attribute navbarTop
   * @type Array
   * @private
   */
  var navbarTop = [
    { name: 'Pricing Plans', href: 'https://temasys.io/platform', related: true },
    { name: 'SDK Github', href: 'https://github.com/Temasys/SkylinkJS', related: true },
    { name: 'REST API', href: 'https://temasys.atlassian.net/wiki/display/TPD/Skylink+REST+API', related: true },
    { name: 'Developer Console', href: 'https://console.temasys.io' },
    { name: 'Try Demo', icon: 'play-circle', href: 'https://getaroom.io', primary: true }
  ];

  /**
   * Stores the internal links (navbar-right routes).
   * Format: <section>+<tab>+<subtab:if-included>
   * @attribute navbarRight
   * @type JSON
   * @private
   */
  var navbarRight = {
    // Getting Started section
    gettingstarted: {
      static: true,
      name: 'Getting Started',
      menu: {
        download: {
          name: 'Download',
          default: 'cdn',
          tabs: {
            cdn: { name: 'Hosted CDN' },
            npm: { name: 'NPM / Bowser' }
          }
        },
        custom: {
          name: 'Custom Extensions & WebRTC Plugin',
          default: 'extension',
          tabs: {
            extension: { name: 'Integrating Extension' },
            plugin: { name: 'Integrating WebRTC Plugin' }
          }
        },
        blocks: {
          name: 'Building Blocks',
          default: 'video',
          tabs: {
            video: { name: 'Audio & Video Call' },
            chat: { name: 'Chat' },
            screenshare: { name: 'Screensharing' }
          }
        },
        examples: {
          name: 'Examples',
          default: 'tutorial',
          tabs: {
            tutorial: { name: 'Tutorials' },
            demos: { name: 'Demos' }
          }
        }
      }
    },
    // App Space section
    appspace: {
      static: true,
      name: 'App Space & Features',
      asTabs: true,
      menu: {
        overview: { name: 'How it Works' },
        authenticate: { name: 'App Key Authentication' },
        schedule: { name: 'Scheduled Sessions' },
        privileged: { name: 'Privileged & Auto-Introduce' }
      }
    },
    // Docs API
    docs: {
      static: false,
      name: 'SDK API',
      menu: {}
    }
  };

  /**
   * Stores the docs data retrieved.
   * @attribute cachedDocs
   * @type JSON
   * @private
   */
  var cachedDocs = {};

  /**
   * Handles the hash change event.
   * @method onHashchangeEventDelegate
   * @private
   */
  function onHashchangeEventDelegate () {
    var parts = (window.location.hash.split('#')[1] || '').split('+');
    var sectionKey = parts[0];
    var linkKey = parts[1];
    var tabItemKey = parts[2];
    var methodNameKey = parts[3];

    // Select nothing if unknown hash is provided
    if (!navbarRight[sectionKey]) {
      return;
    // Fallback to the default item if not available
    } else if (!(linkKey && navbarRight[sectionKey].menu[linkKey])) {
      return window.location.hash = '#' + sectionKey + '+' + navbarRight[linkKey].default;

    // Fallback to the next default item if not available
    } else if (!tabItemKey && !navbarRight[sectionKey].asTabs) {
      return window.location.hash = '#' + sectionKey + '+' + linkKey + '+' +
        (utils.getKeys(navbarRight[sectionKey].menu[linkKey].tabs)[0] || 'null');

    // Fallback to the first item available
    } else if (navbarRight[sectionKey].menu[linkKey].items && !methodNameKey) {
      return window.location.hash = '#' + sectionKey + '+' + linkKey + '+' + tabItemKey + '+' +
        ((navbarRight[sectionKey].menu[linkKey].items[tabItemKey] &&
        navbarRight[sectionKey].menu[linkKey].items[tabItemKey][0] &&
        navbarRight[sectionKey].menu[linkKey].items[tabItemKey][0].name) || 'null');
    }

    // Populate for "as tabs" items
    if (navbarRight[sectionKey].asTabs) {
      $('[populate-content-header]').html('<h1>' + navbarRight[sectionKey].name + '</h1>');

      utils.forEach(navbarRight[sectionKey].menu, function (item, key) {
        $('[populate-content-header]').append(
          '<a href="#' + sectionKey + '+' + key + '" class="' + (linkKey === key ? 'active' : '') + '">' + item.name + '</a>');
      });

    // Populate normal tabs items
    } else {
      $('[populate-content-header]').html('<h1>' + navbarRight[sectionKey].menu[linkKey].name + '</h1>');

      utils.forEach(navbarRight[sectionKey].menu[linkKey].tabs, function (item, key) {
        $('[populate-content-header]').append(
          '<a href="#' + sectionKey + '+' + linkKey + '+' + key + '" class="' + (tabItemKey === key ? 'active' : '') + '">' + item.name + '</a>');
      });
    }

    // For static templating
    if (navbarRight[sectionKey].static) {
      $('[populate-content]').html('').load('data/pages/' + sectionKey + '-' + linkKey +
        (!navbarRight[sectionKey].asTabs ? '-' + tabItemKey : '') + '.html');
    } else {
      $('[populate-menu-header]').html(tabItemKey !== 'null' ? tabItemKey : '');
      $('[populate-menu]').html('');

      utils.forEach(navbarRight[sectionKey].menu[linkKey].items[tabItemKey], function (item, key) {
        $('[populate-menu]').append('<li active-href="' + sectionKey + '+' + linkKey + '+' + tabItemKey + '+' + item.name + '">' +
          '<a href="#' + sectionKey + '+' + linkKey + '+' + tabItemKey + '+' + item.name + '">' +
          '<span class="circle"></span><span class="div"></span>' + item.name + '</a></li>');
      });

      // Render and populate the docs
      (function () {
        var htmlStr = '';

        utils.forEach(cachedDocs[linkKey][tabItemKey], function (item) {
          var exampleStr = '';

          utils.forEach(item.example, function (example) {
            exampleStr += example;
          });

          htmlStr += '<div scroll-href="#' + sectionKey + '+' + linkKey + '+' + tabItemKey + '+' + item.name + '" class="content doc">' +
            '<div class="doc-left">' +
            '<h2>' + utils.parseDocHeader(item) + '</h2>' +
            (item.deprecated ? '<div class="panel danger">This is currently <b>Deprecated</b>.</div>' : '') +
            (item.beta ? '<div class="panel info">This is currently in <b>Beta</b>.</div>' : '') +
            (item.requires ? '<div class="panel">This is defined only when <code>.' + item.requires.split(',')[0] +
              '</code> is <code>' + item.requires.split(',')[1] + '</code>.</div>' : '') +
            '<p>' + item.description + '</p>';
          
          // Render "Keys:" for properties / constants
          if (tabItemKey === 'properties' || tabItemKey === 'constants') {
            htmlStr += '<h3>Keys:</h3>' + utils.parseDocParams(item.parameters, false);
          // Render "Payloads:" for events
          } else if (tabItemKey === 'events') {
            htmlStr += '<h3>Payload:</h3>' + utils.parseDocParams(item.parameters, false);
          // Render "Returns:" and "Parameters:" for methods
          } else if (tabItemKey === 'methods') {
            htmlStr += '<h3>Returns:</h3>' + utils.parseDocParams(item.parameters, true) +
              '<h3>Parameters:</h3>' + utils.parseDocParams(item.parameters, false);
          // Render "Parameters:" for constructor
          } else if (tabItemKey === 'constructor') {
            htmlStr += '<h3>Parameters:</h3>' + utils.parseDocParams(item.parameters, false);
          }

          htmlStr += '</div>' + (tabItemKey === 'methods' ? '<div class="doc-right">' +
            '<pre class="prettyprint">' + exampleStr + '</pre></div>' : '') + '</div>';
        });

        $('[populate-content]').html(htmlStr);
      })();
    }

    $('[active-href]').removeClass('active');
    $('[active-href="' + sectionKey + '+' + linkKey + '"]').addClass('active');
    $('[active-href="' + parts.join('+') + '"]').addClass('active');
    prettyPrint();
  }

  /**
   * Handles the mobile toggle button event.
   * @method onMobileMenuClickEventDelegate
   * @private
   */
  function onMobileMenuClickEventDelegate () {
    $('body').toggleClass('toggled');
  }

  $(window).on('hashchange', onHashchangeEventDelegate);
  $('navbar.navbar-top .navbar-top-right-mobile').click(onMobileMenuClickEventDelegate);

  /**
   * Fetches for the docs/data.json
   */
  $.getJSON('data/docs/data.json', function(data) {
    utils.forEach(data.classes, function (item, className) {
      cachedDocs[className] = {
        name: className,
        typedef: item.typedef || 'class',
        since: item.since,
        methods: {},
        events: {},
        properties: {},
        constants: {},
        constructor: {}
      };

      navbarRight.docs.menu[className] = {
        name: className + ' <small>' + (item.typedef || 'class') + '</small>',
        tabs: {},
        items: {},
        default: ''
      };
      
      if (item.is_constructor) {
        cachedDocs[className].constructor[item.name] = utils.parseDocDescription(item);
        navbarRight.docs.menu[className].default = 'constructor';
        navbarRight.docs.menu[className].tabs.constructor = { name: 'constructor' };
        navbarRight.docs.menu[className].items.constructor = [{
          name: item.name,
          target: 'constructor'
        }];
      }

      utils.forEach(data.classitems, function (subitem) {
        if (!subitem.name) {
          return;
        } else if (subitem['class'] === className) {
          var prop = subitem.itemtype === 'attribute' ? (subitem.final ? 'constants' : 'properties') :
            (subitem.itemtype === 'event' ? 'events' : 'methods');
          cachedDocs[className][prop][subitem.name] = utils.parseDocDescription(subitem);

          if (!navbarRight.docs.menu[className].default) {
            navbarRight.docs.menu[className].default = prop;
          }

          if (!navbarRight.docs.menu[className].items[prop]) {
            navbarRight.docs.menu[className].items[prop] = [];
          }

          navbarRight.docs.menu[className].tabs[prop] = { name: prop };
          navbarRight.docs.menu[className].items[prop].push({ name: subitem.name });
        }
      });
    });

    utils.forEach(navbarRight, function (item, key) {
      var menuStr = '';

      utils.forEach(item.menu, function (subitem, subkey) {
        menuStr += '<li active-href="' + key + '+' + subkey + '" class="' + (subitem.items ? 'parent' : '') + '">' +
          '<a href="#' + key + '+' + subkey + '">' + subitem.name + '</a>' +  
          (subitem.items ? '<span class="parent-header" populate-menu-header></span><ul populate-menu></ul>' : '') +
          '</li>';
      });

      $('[populate-sections]').append('<section class="navbar-right-section">' +
        '<p class="section-header">' + item.name + '</p>' +
        '<ul>' + menuStr + '</ul>' +
        '</section>');
    });

    (function () {
      var externalMenuStr = '';
      utils.forEach(navbarTop, function (item) {
        externalMenuStr += '<li><a href="' + item.href + '" target="_blank">' + item.name + '</a></li>';

        if (item.related) {
          $('[populate-external-links-related]').append('');
        } else {
          $('[populate-external-links]').append('<a href="' + item.href + '" target="_blank" class="' + (item.primary ? 'primary' : '') + '">' +
            (item.icon ? '<i class="fa fa-' + item.icon + '"></i> ' : '') + item.name + '</a>');
        }
      });

      $('[populate-sections]').append('<section class="navbar-right-section navbar-right-section-mobile">' +
        '<p class="section-header">Related links</p>' +
        '<ul>' + externalMenuStr + '</ul></section>');
    })();

    onHashchangeEventDelegate();
  });

});