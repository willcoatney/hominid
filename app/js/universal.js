$(document).ready(function(){

  // $(".phone").text(function(i, text) {
  //       return text.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  // });
  $('select[name="address_city"]').on('change', function(){
   blarg = $(this).val().split(',')
   $('#address_state-cg>.controls>input').val(blarg[1].toString().toLowerCase())
   $('#city-cg>.controls>input').val(blarg[0].toString().toLowerCase().replace(' ','_'))
   $('#county-cg>.controls>input').val(blarg[2].toString().toLowerCase().replace(' ','_'))
  });

  $('.chzn-select').chosen();
});
