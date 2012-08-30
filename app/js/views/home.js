
require('../../vendor/js/bootstrap.min.js')
require('./universal.js')

var doneOnce = false

var Color = require('color')
var spectrum = require('../../vendor/js/spectrum.js')

jQuery(function($){
  $('#phone-tf').mask("999-999-9999", {placeholder:""})
  .css('color','rgba(0,0,0,0.6)')
  // $('#zip-tf').mask("99999", {placeholder:"_"})
  // .css('color','rgba(0,0,0,0.6)')
});

$('.helper').popover({
  trigger: 'hover',
  title: 'help'
})

$('.nav-tabs').button()

$(document).ready(function(){

	var hc = new HomeController();
	var av = new AccountValidator();
	
	$('form#account-form').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			if (av.validateForm() == false){
				return false;
			} 	else{
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
	
	$('#user-tf').attr('disabled', 'disabled');

  $('.modal-confirm').modal({ show : false, keyboard : true, backdrop : true });
  $('.modal-confirm .modal-header h3').text('Delete Account');
  $('.modal-confirm .modal-body p').html('Are you sure you want to delete your account?');	
	$('.modal-confirm .cancel').html('Cancel');
	$('.modal-confirm .submit').html('Delete');
	$('.modal-confirm .submit').addClass('btn-danger');

  var u = $('input#color-picker').val()


  $('section#sidebar>div.inner').css('backgroundColor', u )
  $('section#logos li').css({ backgroundColor: u })
  $('.coupon .symbol-container .symbol').css({ backgroundColor: u })

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
      if( !doneOnce ){
        $('#nav-top').show()
      }
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
    var id = $(this).children().attr('data-image')

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
      $('section#logos li').css("backgroundColor", x )
      $('button.Color').css("backgroundColor", xl )
      $('.coupon .symbol-container .symbol').css("backgroundColor", x )
      $('input#color-picker').val(x)
    }
  });


  $('ul.chzn-results>li:contains("locked")').addClass('group-result').removeClass('group-option').css({display:"list-item"});

  var couponBody = $('textarea#coupon_body').attr('data-text')
  $('textarea#coupon_body').text( couponBody )

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
    if(count >= 4){ 
      $(this).siblings('.chzn-drop').hide();
    }else{
      $(this).siblings('.chzn-drop').show();
    }
  });

  $('button.lq').on('click', function(){
    var $this = $(this)

    var v = $this.text()
    var d = $this.parents('ul').prevAll('ul').children('li')
    var e = $this.parents('ul').prevAll('ul').find('button.lq')
    var f = $this.parents('ul').nextAll('ul').children('li')
    var g = $this.parents('ul').nextAll('ul').find('button.lq')

    $($this, e).addClass('active')
    $($this, d).siblings().fadeIn()
    g.removeClass('active')
    f.fadeOut()

    $('input.lq').val(v)
  })

  $('.date').each(function(){
    var h = $(this).html()
    $(this).text(moment(h).fromNow())
  })

});

