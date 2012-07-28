jQuery.fn.center = function () {
  this.css("position","absolute");
  this.css("left", ( $(window).width() - this.width() ) / 2+$(window).scrollLeft() + "px");
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

 $('.fadeIn').fadeIn();

})

$(window).on('resize', function (){
  $('.center').center()
});

$(window).on('load',function(){
 $('.center').center()

});
