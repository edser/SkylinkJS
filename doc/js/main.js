/**
 * Copyright: (c) Temasys Communications Pte Ltd - All Rights Reserved
 */
/*$(document).ready(function () {
  // Menu items
  window.menu = {
    docs: {
      title: 'SDK API',
      icon: 'code',
      links: []
    },
    restapi: {
      title: 'REST API',
      icon: 'terminal',
      links: []
    },
    appspace: {
      title: 'App Space',
      icon: 'connectdevelop',
      links: [
        { name: 'How it works', href: 'pages/appspace-0.html' },
        { name: 'App Key Authentication', href: 'pages/appspace-1.html' },
        { name: 'Scheduled Sessions', href: 'pages/appspace-2.html' },
        { name: 'Privileged & Auto-Introduce', href: 'pages/appspace-3.html' }
      ]
    },
    gettingstarted: {
      title: 'Getting Started',
      icon: 'puzzle-piece',
      links: [
        { name: 'Download', href: 'pages/gettingstarted-0.html' },
        { name: 'Extensions & WebRTC Plugin', href: 'pages/gettingstarted-1.html' },
        { name: 'Code Samples', href: 'pages/gettingstarted-3.html' },
        { name: 'Demos', href: 'pages/gettingstarted-4.html' }
      ]
    }
  };

  // API docs json data dump
  var data = {
    docs: {},
    restapi: {}
  };

  $('navbar.navbar-top .nav-select').click(function () {
    // Show menu bar when menu bar is hidden on click
    if ($('navbar.navbar-top .nav-expand').css('display') === 'none') {
      $('navbar.navbar-top .nav-expand').fadeIn(200);
      $('navbar.navbar-top').addClass('selected');
      $(this).find('.fa').attr('class','fa fa-arrow-up');
    // Hide menu bar when menu bar is shown on click
    } else {
      $('navbar.navbar-top .nav-expand').fadeOut(200);
      $('navbar.navbar-top').removeClass('selected');
      $(this).find('.fa').attr('class','fa fa-arrow-right');
    }
  });

  $('navbar.navbar-top .nav-expand').on('click', 'a', function () {
    // Hide menu bar when menu bar when links are clicked in menu bar
    $('navbar.navbar-top .nav-expand').fadeOut(200);
    $('navbar.navbar-top').removeClass('selected');
    $('navbar.navbar-top .nav-select').find('.fa').attr('class','fa fa-arrow-right');
  });

  (function (fn) {
    fn('docs/data.json', function (sdkJson) {
      if (sdkJson.classes) {
        // Populate SDK API menu links
        for (var className in sdkJson.classes) {
          menu.docs.links.push({ name: className + ' <small>' + (sdkJson.classes[className].typedef || 'class') + '</small>', href: className });
        }
      }
      
      fn('restapi/data.json', function (restJson) {
        console.log(restJson);
      });
    });
  })(function (json, fn) {
    var xhr = new XMLHttpRequest();

    if (['object', 'function'].indexOf(typeof window.XDomainRequest) > -1) {
      xhr = new XDomainRequest();
    }

    xhr.onload = function () {
      fn(JSON.parse(xhr.responseText || xhr.response || '{}'));
    };

    xhr.open('GET', 'data/' + json, true);
    xhr.send();
  });
});*/

/**
 * Util function to loop object.
 */
var _forEach = function (obj, fn) {
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
};

/**
 * Util function to get object keys.
 */
var _getKeys = function (obj) {
  if (typeof Object.keys !== 'function') {
    var keys = [];
    _forEach(obj, function (i, k) {
      keys.push(k);
    });
    return keys;
  }
  return Object.keys(obj);
};

$(document).ready(function () {
  // Top-menu route references
  var externalLinks = [
    { name: 'Pricing Plans', href: 'https://temasys.io/platform', related: true },
    { name: 'SDK Github', href: 'https://github.com/Temasys/SkylinkJS', related: true },
    { name: 'REST API', href: 'https://temasys.atlassian.net/wiki/display/TPD/Skylink+REST+API', related: true },
    { name: 'Developer Console', href: 'https://console.temasys.io' },
    { name: 'Try Demo', icon: 'play-circle', href: 'https://getaroom.io', primary: true }
  ];
  // Right-menu route references
  var sections = {
    gettingstarted: {
      title: 'Getting Started',
      menu: {
        download: {
          name: 'Download',
          tabs: {
            cdn: { name: 'Temasys CDN' },
            npm: { name: 'Bower and NPM' }
          },
          static: true
        },
        custom: {
          name: 'Custom Extension & WebRTC Plugin',
          tabs: {
            prelude: { name: 'Before Integration' },
            extension: { name: 'Integrate Custom Extension' },
            plugin: { name: 'Integrate Custom WebRTC Plugin' }
          },
          static: true
        },
        blocks: {
          name: 'Building Blocks',
          tabs: {
            video: { name: 'Audio+Video Call' },
            chat: { name: 'Chat' },
            file: { name: 'File Transfer' }
          },
          static: true
        },
        demos: { name: 'Examples', static: true },
      }
    },
    appspace: {
      title: 'App Space & Features',
      menu: {
        overview: { name: 'How it Works', static: true, tabitem: true },
        auth: { name: 'App Key Authentication', static: true, tabitem: true },
        persistent: { name: 'Scheduled Sessions', static: true, tabitem: true },
        privileged: { name: 'Privileged Peer & Auto-Introduce', static: true, tabitem: true },
      }
    },
    docs: {
      title: 'SDK API',
      menu: {}
    }
  };
  // Data dump from retrieving in ajax
  var dump = {
    docs: {},
    restapi: {}
  };

  /**
   * Handles the window resize and init event.
   */
  (function (fn) {
    $(window).resize(fn);
    fn();
  })(function () {
    // Resize the example codes
    $('main.main-content .content.doc .doc-right').width((($(window).outerWidth() - 250 - 30) / 5) * 2 + 25);
    $('main.main-content .content.doc .doc-left').css('right', $('main.main-content .content.doc .doc-right').width());
  });

  /**
   * Fetches the API data and populate menu items.
   */
  (function (fn) {
    fn('docs', function (data) {

    });

    _forEach(externalLinks, function (item) {
      if (item.related) {
        $('[populate-external-links-related]').append('<a href="' + item.href + '" target="_blank">' + item.name + '</a>');
      } else {
        $('[populate-external-links]').append('<a href="' + item.href + '" target="_blank" class="' +
          (item.primary ? 'primary' : '') + '">' + (item.icon ? '<i class="fa fa-' + item.icon + '"></i> ' : '') + item.name + '</a>');
      }
    });

    _forEach(sections, function (item, ikey) {
      if (_getKeys(item.menu).length === 0) {
        return;
      }

      var subitems = '';

      _forEach(item.menu, function (sitem, sikey) {
        subitems += '<li><a select-item="' + ikey + '-' + sikey + (sitem.tabitem ? ',' + sitem.tabitem : '') +
          '">' + sitem.name + '</a></li>';
      });

      $('[populate-sections]').append('<section class="navbar-right-section">' +
        '<p class="section-header">' + item.title + '</p>' +
        '<ul>' + subitems + '</ul></section>');
    });

  })(function (json) {
    $.getJSON('data/' + json + '/data.json', function(data) {
      console.info(json + ':', data);
    });
  });
});