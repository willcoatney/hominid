
function LoginController()
{
// show login form on login button click  
  $('#btn-login-show').click( function () { $('#login-form').fadeToggle("fast");});

// bind event listeners to button clicks //	
	
	$('#login-form #forgot-password').click(function(){ $('#get-credentials').modal('show');});
	
// automatically toggle focus between the email modal window and the login form //

    $('#get-credentials').on('shown', function(){ $('#email-tf').focus(); });
	$('#get-credentials').on('hidden', function(){ $('#user-tf').focus(); });
	
}
