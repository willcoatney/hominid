
require('../../vendor/js/bootstrap.min.js')


var Color = require('color')
var spectrum = require('../../vendor/js/spectrum.js')

jQuery(function($){
  $('#phone-tf').mask("999-999-9999", {placeholder:"_"})
  .css('color','rgba(0,0,0,0.6)')
  $('#zip-tf').mask("999999", {placeholder:"_"})
  .css('color','rgba(0,0,0,0.6)')
});

$('.helper').popover({
  trigger: 'hover',
  title: 'help'
})

$(document).ready(function(){
  

	var hc = new HomeController();
	var av = new AccountValidator();
	
	$('form#account-form').ajaxForm({
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

  $('.modal-confirm').modal({ show : false, keyboard : true, backdrop : true });
  $('.modal-confirm .modal-header h3').text('Delete Account');
  $('.modal-confirm .modal-body p').html('Are you sure you want to delete your account?');	
	$('.modal-confirm .cancel').html('Cancel');
	$('.modal-confirm .submit').html('Delete');
	$('.modal-confirm .submit').addClass('btn-danger');

  var u = $('input#color-picker').val()

  function _lighten( o ){
    var e = Color( o ).lighten(0.6).desaturate(0.5).hexString()
    return e;
  }


  $('section#sidebar>div.inner').css('backgroundColor', u )
  $('nav#nav-top>h1').css({ borderColor: _lighten(u) })
  $('section#logos li div').css({ backgroundColor: u })

  $('nav#nav-home a').on('click', function(){
    $this = $(this)
    if($(this).parent().is('li.active,li.disabled')){
      return
    }

    $this.parent().addClass('active')
    $this.parent().siblings().removeClass('active')

    var o = $this.attr('id');
    var e = $('article>#'+o)
    var r = $('nav#nav-top>#'+o)

    $('section#content').fadeOut('fast',function(){
      e.siblings().hide();
      e.show();
      r.siblings('h1').hide();
      r.css({ display: 'inline-block' })

      $(this).fadeIn('fast')
    })
  });

  $('#logos li').on('click',function(){
    var t = $(this)
    var tc = $(this).children()
    var s = $(this).siblings('li')
    var sc = $(this).siblings('li').children()
    var id = $(this).children().attr('id')

    t.addClass('selected')
    tc.css({ opacity: '1'});
    s.removeClass('selected')
    sc.css({ opacity: '0.4' });
    t.siblings('input').val( id )
  })

  $('#color-picker').spectrum({
    color: $(this).val(),
    move: function(o){
      var x = o.toHexString()
      var xl = Color(x).lighten(0.6).desaturate(0.5).hexString()
      $('#sidebar>.inner').css("backgroundColor", x )
      $('section#logos li div').css("backgroundColor", x )
      $('#nav-top>h1').css("borderColor", xl )
      $('input#color-picker').val(x)
    }
  });


  $('ul.chzn-results>li:contains("locked")').addClass('group-result').removeClass('group-option').css({display:"list-item"});

})

$(function(){

  $('#category .chzn-results>li').on('click', function(){
    var txt = $(this).text()
    $('#tags ul.chzn-results>li').removeClass('result-selected').addClass('active-result')
    $('#tags ul.chzn-choices>li.search-choice').remove()
    $('#tags>#'+txt).siblings().hide()
    $('#tags>#'+txt).show()
  });

  $('#tags .chzn-choices').on('click', function(){
    var count = $(this).children('li').length;
    if(count >= 3){ 
      $(this).siblings('.chzn-drop').hide();
    }else{
      $(this).siblings('.chzn-drop').show();
    }
  });
});
