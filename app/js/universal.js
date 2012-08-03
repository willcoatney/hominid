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

  $('select#location').on('change', function(){
   blarg = $(this).val().split(',')
   $('input#address_city').val(blarg[0].toString())
   $('input#address_state').val(blarg[1].toString())
   $('#state-cg>.controls>span').text(blarg[1].toString())
   $('input#county').val(blarg[2].toString())
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

});
