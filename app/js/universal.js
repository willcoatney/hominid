$(document).ready(function(){

  // $(".phone").text(function(i, text) {
  //       return text.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  // });
  $('select#location').on('change', function(){
   blarg = $(this).val().split(',')
   $('input#address_city').val(blarg[0].toString())
   $('input#address_state').val(blarg[1].toString())
   $('#address_state-cg>.controls>span').text(blarg[1].toString())
   $('input#county').val(blarg[2].toString())
  });

  $('.chzn-select').chosen();
});
