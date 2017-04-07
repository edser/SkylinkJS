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
     * @param {JSON} methodItem The docs method/event/property/constant item.
     * @return {JSON} The parsed docs item.
     * @private
     */
    parseDocDescription: function (methodItem) {
      if (typeof methodItem.description !== 'string') {
        return methodItem;
      }

      var desc = window.marked(methodItem.description).replace(/<(br|br\/)>/gi, '');

      /**
       * Function to parse item flags
       * YUIDoc workaround for properties additional flags.
       * @method parseFlagsFn
       * @private
       */
      var parseFlagsFn = function (flagKey) {
        var regexp = new RegExp('@\(' + flagKey + '\)', 'gi');
        if (desc.indexOf(regexp) > -1) {
          desc = desc.replace(regexp, '');
          methodItem[flagKey] = true;
        }
      };

      parseFlagsFn('beta');
      parseFlagsFn('experimental');
      parseFlagsFn('deprecated');

      /**
       * Parse @(link=.*)
       * YUIDoc replacement for {{#crossLink}} to work in this app
       */
      (function () {
        var result = desc.match(/@\(link=.*\)/gi);
        var index = 0;

        if (result) {
          while (index < result.length) {
            var linkParts = ((result[index].split('(link=')[1] || '').split(')')[0] || '').split('|');
            var linkHref = parts[0];
            var linkTitle = parts[1];

            if (!(linkHref.indexOf('http') === 0)) {
              // E.g. Temasys.DataChannel:getStats:method
              var hrefParts = linkHref.split(':');

              if (hrefParts.length > 0) {
                linkTitle = !linkTitle ? '<code>' + hrefParts[0] + '</code> - ' +
                  '<code>' + hrefParts[1] + '</code> ' + hrefParts[2] : linkTitle;
                linkHref = '#docs+' + hrefParts[0] + '+';

                if (hrefParts[2] === 'event') {
                  linkHref += 'events';
                } else if (hrefParts[2] === 'method') {
                  linkHref += 'methods';
                } else if (hrefParts[2] === 'constant') {
                  linkHref += 'constants';
                } else if (hrefParts[2] === 'property') {
                  linkHref += 'properties';
                } else {
                  linkHref += hrefParts[2];
                }
                linkHref += '+' + hrefParts[1]; 

              } else {
                title = !title ? '<code>' + hrefParts[0] + '</code>' : linkTitle;
                linkHref = '#docs+' + hrefParts[0];
              }
            }
            desc = desc.replace(new RegExp(linkHref, 'gi'), '<a href="' + linkHref + '"' +
              (linkHref.indexOf('http') === 0 ? ' target="_blank"' : '') + '>' + linkTitle + '</a>');
          }
        }
      })();

      methodItem.description = desc;
      methodItem.parameters = [];

      /**
       * Parse sub-parameters.
       */
      (function () {
        var prop = Array.isArray(methodItem.params) ? 'params' : (Array.isArray(methodItem.props) ? 'props' : '');

        // Parse sub parameters.
        if (prop) {
          utils.forEach(methodItem[prop], function (paramItem) {
            methodItem.parameters.push(utils.parseDocDescription(paramItem));
          });
          delete methodItem[prop];
        }
      })();

      return methodItem;
    },

    /**
     * Function to parse the docs type.
     * @method utils.parseDocType
     * @param {String} type The docs method/event/property/constant item ".type".
     * @return {Array} The parsed docs item types.
     * @private
     */
    parseDocType: function (type) {
      var parsedItems = [];

      utils.forEach((type || '').split('|'), function (typeItem) {
        if (!typeItem) {
          return [{ type: 'None', href: '' }];
        }

        parsedItems.push({
          type: typeItem,
          href: ['String', 'JSON', 'Boolean', 'Number', 'ArrayBuffer', 'Blob',
            'Array', 'Object', 'MediaStream', 'RTCCertificate', 'Function', 'Promise'].indexOf(typeItem) > -1 ?
            'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/' + typeItem :
            '#docs-' + typeItem
        });
      });

      return parsedItems;
    },

    /**
     * Function to parse the docs item header.
     * @method utils.parseDocHeader
     * @param {JSON} methodItem The docs method/event/property/constant item.
     * @return {JSON} The parsed docs item.
     * @private
     */
    parseDocHeader: function (methodItem) {
      var headerHtmlStr = '';

      if (methodItem.itemtype === 'attribute') {
        headerHtmlStr += '<code>.' + methodItem.name + '</code><span class="type">: ';

      } else if (methodItem.itemtype === 'method' || methodItem.is_constructor) {
        var paramsHtmlStr = '';

        utils.forEach(methodItem.parameters, function (param, paramKey) {
          paramsHtmlStr += '<small>' + (param.optional ? '[' : '') + param.name + (param.optional ? ']' : '') + '</small>, ';
        });

        // Remove extra ", "
        paramsHtmlStr = paramsHtmlStr.substr(0, paramsHtmlStr.length - 2);
        headerHtmlStr += methodItem.is_constructor ? '<code>new ' + methodItem.name + '(' + paramsHtmlStr + ')</code><span class="type">' :
          '<code>.' + methodItem.name + '(' + paramsHtmlStr + ')</code><span class="type">&#8594; ';

      } else if (methodItem.itemtype === 'event') {
        headerHtmlStr += '<code>"' + methodItem.name + '"</code><span class="type">';
      }

      var parsedTypes = utils.parseDocType(methodItem.type);

      if (parsedTypes.length > 0) {
        utils.forEach(parsedTypes, function (typeItem) {
          headerHtmlStr += '<a href="' + typeItem.href + '"' + (typeItem.href.indexOf('http') === 0 ? ' target="_blank"' : '') + '>' + 
            '<code>' + typeItem.type + '</code></a>/';
        });

        headerHtmlStr = headerHtmlStr.substr(0, headerHtmlStr.length - 1);

      } else if (methodItem.itemtype === 'method') {
        headerHtmlStr += '<var class="return-none">None</var>';
      }

      headerHtmlStr += '</span><span class="since">Since: <b>' + (methodItem.since || '-') + '</b></span>';
      return headerHtmlStr;
    },

    /**
     * Function to parse the parameters.
     * @method utils.parseDocParams
     * @param {JSON} params The docs method/event/property/constant item params.
     * @return {String} The parsed docs param HTML string.
     * @private
     */
    parseDocParams: function (params, isReturn, isChild) {
      var paramsHtmlStr = '';

      utils.forEach(params, function (paramItem) {
        // Return for parsing "return" items
        if (paramItem.name.indexOf('return') === 0 ? !isReturn : isReturn) {
          return;
        }

        paramsHtmlStr += '<li><div class="param-name"><code>' + paramItem.name + '</code>';

        utils.forEach(utils.parseDocType(paramItem.type), function (typeItem) {
          paramsHtmlStr += '<a href="' + typeItem.href + '"' + (typeItem.href.indexOf('http') === 0 ?' target="_blank"' : '') + '>' + 
            '<var class="typeof">' + typeItem.type + '</var></a>/';
        });

        paramsHtmlStr = paramsHtmlStr.substr(0, paramsHtmlStr.length - 1);

        if (paramItem.optional) {
          paramsHtmlStr += '<span class="optional"><b>Optional</b>' + (paramItem.optdefault ? '- defaults to <code>' +
            paramItem.optdefault + '</code>' : '') + '</span>';
        }

        if (paramItem.deprecated) {
          paramsHtmlStr += '<span class="deprecated"><b>Deprecated</b></span>';
        }

        if (paramItem.beta) {
          paramsHtmlStr += '<span class="beta"><b>beta</b></span>';
        }

        if (paramItem.experimental) {
          paramsHtmlStr += '<span class="beta"><b>experimental</b></span>';
        }

        if (paramItem.response) {
          paramsHtmlStr += '<span class="response"><b>Function parameter</b></span>';
        }

        paramsHtmlStr += '</div><div class="param-desc">' + utils.parseDocDescription(paramItem.description) + '</div>' +
          utils.parseDocParams(paramItem.parameters, isReturn, true) + '</li>';
      });

      return (!paramsHtmlStr && !isChild ? '<p>None</p>' : '<ul class="doc-params">' + paramsHtmlStr + '</ul>');
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
          name: 'Integrating Screensharing Extension & WebRTC Plugin',
          default: 'extension',
          tabs: {
            extension: { name: 'Screensharing Extension' },
            plugin: { name: 'Temasys WebRTC Plugin' }
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
   * Stores the lock for scrolling states.
   * @attribute scrollStates
   * @type JSON
   * @private
   */
  var scrollStates = {
    navbar: false,
    timeout: null,
    href: ''
  };

  /**
   * Handles the hash change event.
   * @method onHashchangeEventDelegate
   * @private
   */
  function onHashchangeEventDelegate () {
    var winHashParts = (window.location.hash.split('#')[1] || '').split('+');
    var sectionKey = winHashParts[0];
    var pageKey = winHashParts[1];
    var tabKey = winHashParts[2];
    var methodKey = winHashParts[3];

    if (scrollStates.navbar) {
      // Select nothing if unknown hash is provided
      if (!navbarRight[sectionKey]) {
        return;

      // Fallback to the default item if not available
      } else if (!(pageKey && navbarRight[sectionKey].menu[pageKey])) {
        return window.location.hash = '#' + sectionKey + '+' + navbarRight[pageKey].default;

      // Fallback to the next default item if not available
      } else if (!tabKey && !navbarRight[sectionKey].asTabs) {
        return window.location.hash = '#' + sectionKey + '+' + pageKey + '+' +
          (utils.getKeys(navbarRight[sectionKey].menu[pageKey].tabs)[0] || 'null');

      // Fallback to the first item available
      } else if (navbarRight[sectionKey].menu[pageKey].items && !methodKey) {
        return window.location.hash = '#' + sectionKey + '+' + pageKey + '+' + tabKey + '+' +
          ((navbarRight[sectionKey].menu[pageKey].items[tabKey] &&
          navbarRight[sectionKey].menu[pageKey].items[tabKey][0] &&
          navbarRight[sectionKey].menu[pageKey].items[tabKey][0].name) || 'null');
      }

      // Populate menu items for per section
      (function () {
        var tabsHtmlStr = '';

        // Populate for "as tabs" items
        if (navbarRight[sectionKey].asTabs) {
          utils.forEach(navbarRight[sectionKey].menu, function (pageItem, pageItemKey) {
            tabsHtmlStr += '<a href="#' + sectionKey + '+' + pageItemKey + '" class="' + (pageKey === pageItemKey ? 'active' : '') + '">' + pageItem.name + '</a>';
          });

          $('[populate-content-header]').html(navbarRight[sectionKey].name);
        
        } else {
          utils.forEach(navbarRight[sectionKey].menu[pageKey].tabs, function (tabItem, tabItemKey) {
            tabsHtmlStr += '<a href="#' + sectionKey + '+' + pageKey + '+' + tabItemKey + '" class="' + (tabKey === tabItemKey ? 'active' : '') + '">' + tabItem.name + '</a>';
          });

          $('[populate-content-header]').html(navbarRight[sectionKey].menu[pageKey].name);
        }
        $('[populate-content-tabs]').html(tabsHtmlStr);
      })();

      // For static templating
      if (navbarRight[sectionKey].static) {
        $('[populate-content]').html('').load('data/pages/' + sectionKey + '-' + pageKey +
          (!navbarRight[sectionKey].asTabs ? '-' + tabKey : '') + '.html', function () {
          prettyPrint();
          $(window).scrollTop(0);
        });

      // For docs templating
      } else {
        // Render and populate the docs
        var contentHtmlStr = '';

        utils.forEach(cachedDocs[pageKey][tabKey], function (methodItem) {
          var exampleCodeHtmlStr = '';

          utils.forEach(methodItem.example, function (exampleItem) {
            exampleCodeHtmlStr += exampleItem;
          });

          contentHtmlStr += '<div active-href="' + sectionKey + '+' + pageKey + '+' + tabKey + '+' + methodItem.name + '" class="content doc">' +
            '<div class="doc-left">' +
            '<h2>' + utils.parseDocHeader(methodItem) + '</h2>' +
            (methodItem.deprecated ? '<div class="panel danger">This is currently <b>Deprecated</b>.</div>' : '') +
            (methodItem.beta ? '<div class="panel info">This is currently in <b>Beta</b>.</div>' : '') +
            (methodItem.requires ? '<div class="panel">This is defined only when <code>.' + methodItem.requires.split(',')[0] +
              '</code> is <code>' + methodItem.requires.split(',')[1] + '</code>.</div>' : '') +
            '<p>' + methodItem.description + '</p>';

          // Render "Keys:" for properties / constants
          if (tabKey === 'properties' || tabKey === 'constants') {
            contentHtmlStr += '<h3>Keys:</h3>' + utils.parseDocParams(methodItem.parameters, false);

          // Render "Payloads:" for events
          } else if (tabKey === 'events') {
            contentHtmlStr += '<h3>Payload:</h3>' + utils.parseDocParams(methodItem.parameters, false);

          // Render "Returns:" and "Parameters:" for methods
          } else if (tabKey === 'methods') {
            contentHtmlStr += '<h3>Returns:</h3>' + utils.parseDocParams(methodItem.parameters, true) +
              '<h3>Parameters:</h3>' + utils.parseDocParams(methodItem.parameters, false);

          // Render "Parameters:" for constructor
          } else if (tabKey === 'constructor') {
            contentHtmlStr += '<h3>Parameters:</h3>' + utils.parseDocParams(methodItem.parameters, false);
          }

          contentHtmlStr += '<p><button class="content-doc-mobile"' + (!exampleCodeHtmlStr ? ' disabled="true"' : '') + '>' +
            '<i class="fa fa-ellipsis-h"></i></button></p></div>' +
            (['methods', 'constructor'].indexOf(tabKey) > -1 ? '<div class="doc-right">' +
            '<pre class="prettyprint">' + exampleCodeHtmlStr + '</pre></div>' : '') + '</div>';
        });

        $('[populate-content]').html(contentHtmlStr);
        $(window).scrollTop(0);
        prettyPrint();
      }
    }

    $('li[active-href]').removeClass('active');
    $('li[active-href="' + sectionKey + '+' + pageKey + '"]').addClass('active');
    $('li[active-href="' + winHashParts.join('+') + '"]').addClass('active');

    if ($(window).outerWidth() > 800) {
      $('navbar.navbar-left').animate({
        scrollTop: (window.location.hash.indexOf('#docs+') === 0 ?
          $('li[active-href="' + sectionKey + '+' + pageKey + '+' + tabKey + '+' + methodKey + '"]').offset().top :
          $('section[active-href="' + sectionKey + '"]').offset().top) - 75 +
          $('navbar.navbar-left').scrollTop()
      }, 100);

      if (methodKey && scrollStates.navbar) {
        $('main.main-content').find('.content.doc').each(function () {
          if ($(this).attr('active-href') === winHashParts.join('+')) {
            $('body').animate({
              scrollTop: $(this).offset().top + $('body').scrollTop() - 88
            }, 100);
          }
        });
      }
    }
  }

  /**
   * Handles the mobile toggle button event.
   * @method onMobileMenuClickEventDelegate
   * @private
   */
  function onMobileMenuClickEventDelegate () {
    $('body').toggleClass('toggled');
  }

  /**
   * Handles the mobile tabs menu toggle button event.
   * @method onMobileTabsMenuClickEventDelegate
   * @private
   */
  function onMobileTabsMenuClickEventDelegate () {
    $('main.main-content.tabs .header-tabs').toggleClass('toggled');
    //$('main.main-content.tabs .header-tabs .header-tabs-mobile').show();
  }

  /**
   * Handles the mobile tabs menu toggle button event.
   * @method onMobileTabsMenuClickEventDelegate
   * @private
   */
  function onMobileTabsMenuClickEventDelegate () {
    $('main.main-content.tabs .header-tabs').toggleClass('toggled');
    //$('main.main-content.tabs .header-tabs .header-tabs-mobile').show();
  }

  /**
   * Handles the window scroll event.
   * @method onScrollEventDelegate
   * @private
   */
  function onScrollEventDelegate () {
    if ($(window).outerWidth() > 800 && window.location.hash.indexOf('#docs+') === 0) {
      var scrollToHref = '';

      $('main.main-content').find('.content.doc').each(function () {
        var offsetTop = $('body').scrollTop() + 88;// + 55;
        var rangeFrom = $(this).offset().top;
        var rangeTo = rangeFrom + $(this).height();

        var winHashParts = ($(this).attr('active-href') || '').split('+');
        var sectionKey = winHashParts[0];
        var pageKey = winHashParts[1];

        if (offsetTop > rangeFrom && offsetTop < rangeTo) {
          scrollToHref = $(this).attr('active-href');
        }
      });

      if (scrollToHref && scrollToHref !== scrollStates.href) {
        scrollStates.href = scrollToHref;

        if (window.location.hash !== '#' + scrollToHref && !scrollStates.navbar) {
          window.location.hash = '#' + scrollToHref;
        }
      }
    }
  }

  /**
   * Handles the doc item content expand example clicked event.
   * @method onExampleExpandClickEventDelegate
   * @private
   */
  function onExampleExpandClickEventDelegate () {
    $(this).closest('.content.doc').toggleClass('toggled');
  }

  /**
   * Handles the a[href] click event.
   * @method onHashClickEventDelegate
   * @private
   */
  function onHashClickEventDelegate () {
    scrollStates.navbar = true;
    setTimeout(function () {
      scrollStates.navbar = false
    }, 100);
  }

  $(window).on('hashchange', onHashchangeEventDelegate);
  $('navbar.navbar-top .navbar-top-mobile').click(onMobileMenuClickEventDelegate);
  $('main.main-content.tabs .header-tabs .header-tabs-mobile-selection').click(onMobileTabsMenuClickEventDelegate);
  $(window).scroll(onScrollEventDelegate);
  $('main.main-content').on('click', '.content.doc .content-doc-mobile', onExampleExpandClickEventDelegate);
  $('body').on('click', 'a[href]', onHashClickEventDelegate);

  /**
   * Fetches for the docs/data.json
   */
  $.getJSON('data/docs/data.json', function(data) {
    // Populate the cached docs
    utils.forEach(data.classes, function (docItem, docItemKey) {
      cachedDocs[docItemKey] = {
        name: docItemKey,
        typedef: docItem.typedef || 'class',
        since: docItem.since,
        methods: {},
        events: {},
        properties: {},
        constants: {},
        constructor: {}
      };

      navbarRight.docs.menu[docItemKey] = {
        name: docItemKey + ' <small>' + (docItem.typedef || 'class') + '</small>',
        tabs: {},
        items: {},
        default: ''
      };

      if (docItem.is_constructor) {
        cachedDocs[docItemKey].constructor[docItem.name] = utils.parseDocDescription(docItem);
        navbarRight.docs.menu[docItemKey].default = 'constructor';
        navbarRight.docs.menu[docItemKey].tabs.constructor = { name: 'constructor' };
        navbarRight.docs.menu[docItemKey].items.constructor = [{ name: docItem.name }];
      }

      utils.forEach(data.classitems, function (docMethodItem) {
        if (!docMethodItem.name) {
          return;
        } else if (docMethodItem['class'] === docItemKey) {
          var tabKey = docMethodItem.itemtype === 'attribute' ? (docMethodItem.final ? 'constants' : 'properties') :
            (docMethodItem.itemtype === 'event' ? 'events' : 'methods');
          cachedDocs[docItemKey][tabKey][docMethodItem.name] = utils.parseDocDescription(docMethodItem);

          if (!navbarRight.docs.menu[docItemKey].default) {
            navbarRight.docs.menu[docItemKey].default = tabKey;
          }

          if (!navbarRight.docs.menu[docItemKey].items[tabKey]) {
            navbarRight.docs.menu[docItemKey].items[tabKey] = [];
          }

          navbarRight.docs.menu[docItemKey].tabs[tabKey] = { name: tabKey };
          navbarRight.docs.menu[docItemKey].items[tabKey].push({ name: docMethodItem.name });
        }
      });
    });

    // Populate navbar-right sections
    utils.forEach(navbarRight, function (sectionItem, sectionItemKey) {
      var sectionHtmlStr = '';

      utils.forEach(sectionItem.menu, function (pageItem, pageItemKey) {
        sectionHtmlStr += '<li active-href="' + sectionItemKey + '+' + pageItemKey + '" class="' + (pageItem.items ? 'parent' : '') + '">' +
          '<a href="#' + sectionItemKey + '+' + pageItemKey + '">' + pageItem.name + '</a>';

        if (!sectionItem.static) {
          utils.forEach(pageItem.tabs, function (tabItem, tabItemKey) {
            var tabsHtmlStr = '';

            utils.forEach(cachedDocs[pageItemKey][tabItemKey], function (methodItem, methodItemKey) {
              tabsHtmlStr += '<li active-href="' + sectionItemKey + '+' + pageItemKey + '+' + tabItemKey + '+' + methodItemKey + '">' +
                '<a href="#' + sectionItemKey + '+' + pageItemKey + '+' + tabItemKey + '+' + methodItemKey + '">' +
                '<span class="circle"></span><span class="div"></span>' +
                (tabItemKey === 'events' ? '"' + methodItem.name + '"' :
                (tabItemKey === 'methods' ? '.' + methodItem.name + '()' :
                (tabItemKey === 'constructor' ? 'new ' + methodItem.name + '()' : '.' + methodItem.name))) + '</a></li>';
            });

            sectionHtmlStr += '<span class="parent-header">' + tabItem.name + '</span><ul>' + tabsHtmlStr + '</ul>';
          });
        }
      });

      $('[populate-sections]').append('<section class="navbar-left-section" active-href="' +  sectionItemKey + '">' +
        '<p class="section-header">' + sectionItem.name + '</p>' +
        '<ul>' + sectionHtmlStr + '</ul>' +
        '</section>');
    });

    // Populate navbar-top items
    (function () {
      var topMenuHtmlStr = '';

      utils.forEach(navbarTop, function (menuItem) {
        topMenuHtmlStr += '<li><a href="' + menuItem.href + '" target="_blank">' + menuItem.name + '</a></li>';

        if (menuItem.related) {
          $('[populate-external-links-related]').append('');
        } else {
          $('[populate-external-links]').append('<a href="' + menuItem.href + '" target="_blank" class="' + (menuItem.primary ? 'primary' : '') + '">' +
            (menuItem.icon ? '<i class="fa fa-' + menuItem.icon + '"></i> ' : '') + menuItem.name + '</a>');
        }
      });

      // Append for appearing in mobile view
      $('[populate-sections]').append('<section class="navbar-left-section navbar-left-section-mobile">' +
        '<p class="section-header">Related links</p>' +
        '<ul>' + topMenuHtmlStr + '</ul></section>');
    })();

    if (!(window.location.hash && window.location.hash.indexOf('+') > 0)) {
      window.location.hash = '#gettingstarted+download+cdn';
    }
    onHashClickEventDelegate();
    onHashchangeEventDelegate();
  });

});