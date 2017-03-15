$(document).ready(function () {

  $('#side-menu').on('click', 'a', function () {
    if (!$(this).attr('target-menu')) return;
    $(this).toggleClass('active');
    $(this).find('.fa').toggleClass('fa-caret-down').toggleClass('fa-caret-up');
    $('#' + $(this).attr('target-menu')).slideToggle();
  });

});