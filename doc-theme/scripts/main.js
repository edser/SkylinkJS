$(document).ready(function () {

  $('#side-menu').on('click', 'a', function () {
    if (!$(this).attr('target-menu')) {
      if ($(this).attr('template')) {
        $('[template].active').removeClass('active');
        $(this).toggleClass('active');
        $('#load-template').load('templates/' + $(this).attr('template'));
      }
      return;
    }
    $(this).toggleClass('active');
    $(this).find('.fa').toggleClass('fa-caret-down').toggleClass('fa-caret-up');
    $('#' + $(this).attr('target-menu')).slideToggle();
  });

  $('#load-template').load('templates/overview.html');

  // HOTFIX: :(
  function onResize () {
    $('.container navbar.side, .container .body').height($(window).height() - $('navbar.top').outerHeight());
    //$('.container, .container-wrapper').outerHeight($(window).height() - $('navbar.top').outerHeight());
  }

  $(window).resize(onResize);
  onResize();
  
  $(document).prettyPrint();
});