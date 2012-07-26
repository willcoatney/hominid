
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

