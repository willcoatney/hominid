
$( function (){

  // $('a.link').on('click', function(){

  //   var otherLinks = $(this).parent().siblings().children()

  //   $(this).addClass('active')
  //   otherLinks.removeClass('active')

  // });

  $('.date').each(function(){
    var h = $(this).html()
    $(this).text(moment(h).fromNow())
  })


});
