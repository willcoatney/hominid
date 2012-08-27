jQuery.fn.center = function () {
  this.css("position","absolute");
  this.css("left", ( $(window).width() - this.width() ) / 2+$(window).scrollLeft() + "px");
  this.css("top", ( $(window).height() - this.height() ) / 2+$(window).scrollTop() + "px");
  return this;
}

jQuery.fn.vertical_center = function () {
  this.css("position","absolute");
  this.css("top", ( $(window).height() - this.height() ) / 2+$(window).scrollTop() + "px");
  return this;
}

$(document).ready(function(){

  $('select.loc').on('change', function(){
   var p = $(this).parents('ul')
   var b = $(this).val().split(',')

   p.find('input.city').val(b[0].toString())
   p.find('input.state').val(b[1].toString())
   p.find('input.county').val(b[2].toString())
  });

  $('.chzn-select').chosen();

})

$(window).on('resize', function (){
  $('.center').center()
  $('.vertical-center').vertical_center()
});

$(window).on('load',function(){
  $('.center').center()
  $('.vertical-center').vertical_center()
  $('.fadeIn').fadeIn();
  $('.jsOpacity').animate({
    opacity: 1
  })
 
});
