$(document).ready(function () {

  /**
   * Loads the templates.
   * @method loadTemplate
   * @for #load-template
   */
  function loadTemplate (templateUrl) {
    var isYuiDocGen = templateUrl.indexOf('classes') === 0;
    console.log('template:', templateUrl);
    $('#load-template').load(templateUrl + '.html', function () {
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
    if ($(this).parent().find('ul').length === 0) {
      if ($(this).attr('template')) {
        $('#side-menu a[template].active').removeClass('active');
        $(this).toggleClass('active');
        loadTemplate($(this).attr('template'));
      }
      return false;
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