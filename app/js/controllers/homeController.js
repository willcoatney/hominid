
function HomeController()

{
// bind event listeners to button clicks //
	var that = this;

// handle user logout //	
	$('#logout').click( function () { that.attemptLogout(); });
	
// confirm account deletion //	
	$('.account-form-btn1').click( function () {$('.modal-confirm').modal('show')});	
	
// handle account deletion //	
	$('.modal-confirm .submit').click(function () { that.deleteAccount(); });


  $('#merchant_validation button').on('click', function(){
    var v = $(this).siblings('input').val()
    if (v > 2000 || v < 1000){
      $(this).parent('li').text('nope!')
      $('.modal-alert').modal({ show : false, keyboard : false });
      $('.modal-alert').modal('show');
      $('.modal-alert .modal-header h3').text('Sorry, nope.');
      $('.modal-alert .modal-body p').html('That is not a legitimate ID.');

    } else {
      $(this).after('<a href="/">RELOAD</a>')
      $('#cust-tf').val(v)
    }

  })

	
	this.deleteAccount = function()
	{
		$('.modal-confirm').modal('hide');
		var that = this;	
		$.ajax({ 
			url: '/delete',
			type: 'POST',
			data: { id: $('#userId').val()},
			success: function(data){
	 			that.showLockedAlert('Your account has been deleted.<br>Redirecting you back to the homepage.');
			},
			error: function(jqXHR){
				console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
			}
		});	
	}

	this.attemptLogout = function()
	{
		var that = this;
		$.ajax({
			url: "/home",
			type: "POST",
			data: {logout : true},
			success: function(data){
	 			that.showLockedAlert('Your are now logged out.<br>Redirecting you back to the homepage.');
			},
			error: function(jqXHR){
				console.log(jqXHR.responseText+' :: '+jqXHR.statusText);
			}		
		});
	}	
	
	this.showLockedAlert = function(msg){
		$('.modal-alert').modal({ show : false, keyboard : false, backdrop : 'static' });				
		$('.modal-alert .modal-header h3').text('Success!');
		$('.modal-alert .modal-body p').html(msg);
		$('.modal-alert').modal('show');
		$('.modal-alert button').click(function(){window.location.href = '/';})
		setTimeout(function(){window.location.href = '/';}, 3000);		
	}
}

HomeController.prototype.onUpdateSuccess = function()
{
	$('.modal-alert').modal({ show : false, keyboard : true, backdrop : true });				
	$('.modal-alert .modal-header h3').text('Success!');
	$('.modal-alert .modal-body p').html('Your account has been updated.'); 				
	$('.modal-alert').modal('show');
	$('.modal-alert button').off('click');

}
