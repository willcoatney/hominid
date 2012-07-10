

$('.supra').on("changeSelection", function(e, thisId ){

  var selected = 'active'
  var inactive = 'inactive'

  if ( $(this).hasClass( selected )){
    return false;
  }
  


  $(this)
  .removeClass( inactive )
  .addClass( selected )
  .animate({
    width : '30%'

  }, 100 );

  $(this)
  .siblings( $( selected ))
  .removeClass( selected )
  .addClass(inactive)
  .animate({
    width : "19%"


  }, 100 );

  $('#categories>.btn-group>.shortcut')
  .removeClass('sub-selected, selected')

  $('#categories>#sub1>.shortcut.all')
  .addClass('selected')


  $('#categories>.btn-group>.shortcut')
  .hide()

  $('#categories>.btn-group>.shortcut.'+thisId)
  .show()

  $('#sorts').hide()

});

$('#supras>.supra').on( 'click', function (){
  var id = $(this).attr('id')
  $(this).trigger("changeSelection", id)
})

$('#categories>.btn-group>.shortcut').on( 'click', function (){
  $('#sorts').show()
  /* $('.coupon-container').delay(300).show() */
})

$(document).ready( function (){
  $('#categories>.btn-group>.shortcut').hide()
  $('#sorts').hide()
  /* $('.coupon-container').hide() */

});
