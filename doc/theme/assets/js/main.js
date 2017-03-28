$(document).ready(function () {

  /**
   * Loads the templates.
   * @method loadTemplate
   * @for #load-template
   */
  function loadTemplate (href) {
    var templateUrl = '';
    var isYuiDocGen = false;
    if (href.indexOf('?template=') === 0) {
      templateUrl = 'assets/templates/' + href.split('?template=')[1] + '.html';
    } else if (href.indexOf('?class=') === 0) {
      templateUrl = 'classes/' + href.split('?template=')[1] + '.html';
      isYuiDocGen = true;
    }
    $('#load-template').load(templateUrl, function () {
      if (isYuiDocGen) {
        $('#load-template').html($('#load-template #template-content').html());
      }
      prettyPrint();
    });
  }

  /**
   * Loads the templates and handles the clicks
   * @event click
   * @for #side-menu a
   */
  $('#side-menu').on('click', 'a', function () {
    // No sub <ul>
    if (!$(this).parent().find('ul')) {
      if ($(this).attr('template')) {
        $('#side-menu [template].active').removeClass('active');
        $(this).toggleClass('active');
        loadTemplate($(this).attr('template'));
        return false;
      }
    }

    $(this).toggleClass('active');
    $(this).find('.fa').toggleClass('fa-caret-down').toggleClass('fa-caret-up');
    $(this).parent().find('ul').slideToggle();
  });

  // HOTFIX: :(
  function onResize () {
    $('.container navbar.side, .container .body').height($(window).height() - $('navbar.top').outerHeight());
    //$('.container, .container-wrapper').outerHeight($(window).height() - $('navbar.top').outerHeight());
  }

  $(window).resize(onResize);
  onResize();
  //onLoadTemplate('temasys/room.html');
});