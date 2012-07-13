

var categories = '#categories .sub .link'
var locations = '#locations .link'

$('.supra').on("changeSelection", function(e, thisId ){

  var active = 'active'
  var inactive = 'inactive'

  $('#welcome').fadeOut('fast');

  if ( $(this).hasClass( active )){ return false;}
  $('.btn-toolbar').slideDown(function(){
  $('.coupon-container').fadeIn();
  });
  

  $(this)
    .addClass( active )
    .removeClass( inactive )
    .animate({width : '30%'}, 100 );
  

  $(this)
  .siblings()
  .removeClass( active )
  .addClass( inactive )
  .animate({
    width : "19%"


  }, 100 );

  $( categories ).removeClass('active')

  $( categories ).hide()

  $( categories + '.'+thisId).show()

  $('#sorts, #locations').show()

});

$('#supras>.supra').on( 'click', function (){
  var id = $(this).attr('id')
  $(this).trigger("changeSelection", id)
})

$( '.link').on( 'click', function (){
  $(this).parents('#filters').find('a').removeClass('active')
  
})

$(document).ready( function (){
  $( categories ).hide()
  $('.btn-toolbar').hide()
  /* $('#sorts, #locations').hide() */
  $('.coupon-container').hide()

});


$('#shuffle').tooltip('hover')
//   $(this).tooltip('show')
//   $(this).tooltip('hide')
// });
