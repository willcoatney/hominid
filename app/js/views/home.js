jQuery(function($){
  $('#phone-tf').mask("999-999-9999", {placeholder:"_"})
  .css('color','#555')
});

$(document).ready(function(){

	var hc = new HomeController();
	var av = new AccountValidator();
	
	$('#account-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			if (av.validateForm() == false){
				return false;
			} 	else{
			// push the disabled username field onto the form data array //	
				formData.push({name:'user', value:$('#user-tf').val()})
				formData.push({cust:'cust', value:$('#cust-tf').val()})
				return true;
			}
		},
		success	: function(responseText, status, xhr, $form){
			if (status == 'success') hc.onUpdateSuccess();
		},
		error : function(e){
			if (e.responseText == 'email-taken'){
			    av.showInvalidEmail();
			}	else if (e.responseText == 'username-taken'){
			    av.showInvalidUserName();			
			}
		}
	});

// customize the account settings form //
	
	$('#user-tf,#cust-tf').attr('disabled', 'disabled');

// setup the confirm window that displays when the user chooses to delete their account //

    $('.modal-confirm').modal({ show : false, keyboard : true, backdrop : true });
    $('.modal-confirm .modal-header h3').text('Delete Account');
    $('.modal-confirm .modal-body p').html('Are you sure you want to delete your account?');	
	$('.modal-confirm .cancel').html('Cancel');
	$('.modal-confirm .submit').html('Delete');
	$('.modal-confirm .submit').addClass('btn-danger');

  /* $('#phone-tf').mask("(999) 999-9999"); */
	

  $('#preview .large-toggle').click( function(){
    $(this).parents('#preview').toggleClass('large')
  })
                     

  $('#preview').addClass($('[name="coupon_supra"]').val())
  $('#preview').addClass($('[name="coupon_sub"]').val())
  $('#preview .title').text($('[name="coupon_title"]').val())

  $('.price-listing').text($('input.coupon-price').val())

  $('input.coupon-price').bind('change', function(){
    var v = $(this).val()
    $('.price-listing').text(v);
  });

  $('.widget-header').on('click', function(){
    var content = $(this).siblings('.widget-content')
    content.height(content.height());
    content.slideToggle()
  });

  $('.widget-content').hide()
  $('.widget#business>.widget-content').show()

})

