// isotope
//
var doneOnce = {}


$.Isotope.prototype._getCenteredMasonryColumns = function() {
  this.width = this.element.width();
  
  var parentWidth = this.element.parent().width();
  
                // i.e. options.masonry && options.masonry.columnWidth
  var colW = this.options.masonry && this.options.masonry.columnWidth ||
                // or use the size of the first item
                this.$filteredAtoms.outerWidth(true) ||
                // if there's no items, use size of container
                parentWidth;
  
  var cols = Math.floor( parentWidth / colW );
  cols = Math.max( cols, 1 );

  // i.e. this.masonry.cols = ....
  this.masonry.cols = cols;
  // i.e. this.masonry.columnWidth = ...
  this.masonry.columnWidth = colW;
};

$.Isotope.prototype._masonryReset = function() {
  // layout-specific props
  this.masonry = {};
  // FIXME shouldn't have to call this again
  this._getCenteredMasonryColumns();
  var i = this.masonry.cols;
  this.masonry.colYs = [];
  while (i--) {
    this.masonry.colYs.push( 0 );
  }
};

$.Isotope.prototype._masonryResizeChanged = function() {
  var prevColCount = this.masonry.cols;
  // get updated colCount
  this._getCenteredMasonryColumns();
  return ( this.masonry.cols !== prevColCount );
};

$.Isotope.prototype._masonryGetContainerSize = function() {
  var unusedCols = 0,
      i = this.masonry.cols;
  // count unused columns
  while ( --i ) {
    if ( this.masonry.colYs[i] !== 0 ) {
      break;
    }
    unusedCols++;
  }
  
  return {
        height : Math.max.apply( Math, this.masonry.colYs ),
        // fit container to columns that have been used;
        width : (this.masonry.cols - unusedCols) * this.masonry.columnWidth
      };
};

$(function(){
  
  var $container = $('.coupon-container');
  
  
  $container.isotope({
    itemSelector : '.coupon',
    masonry : {
      columnWidth : 70
    },
    getSortData : {
      cheapest: function( $elem ) {
        return ($elem.attr('sort-price'));
      },
      newest: function ( $elem ) {
        return -($elem.attr('sort-date'));
      }
    }
  });


  //  sorts and filters

  var filters = {}

  $('.option-set a').click(function(){
    var $this = $(this);
    // don't proceed if already selected
    if ( $this.hasClass('active') ) {
      return;
    }
    var $optionSet = $this.parents('.option-set');
    var $step = $this.parents('.step');
    var $rivals = $optionSet.siblings().find('a');

    if ( $step.hasClass('tags')){
      if ( $optionSet.hasClass('active')){
      }else{
        $optionSet.addClass('active')
        $optionSet.siblings().removeClass('active')
        /* $optionSet.siblings().toggle() */
        $rivals.removeClass('active');
      }
    }
    
    if ( $step.hasClass('cats')){

      var $catSelector = $this.attr('href').slice(1);
      var $catTag = $('.step.tags').children('ul.'+ $catSelector )
      var $catHandler = $step.siblings('.tag-handler').children('p.'+ $catSelector )

      $catTag.css('display','block')
      $catTag.siblings().hide()
      $catHandler.css('display','inline-block')
      $catHandler.siblings().hide()
    }


    $optionSet.find('.active').removeClass('active');
    $optionSet.addClass('active');
    $this.addClass('active');
    
    var group = $optionSet.attr('filter-group');
    filters[ group ] = $this.attr('filter-value');
    var isoFilters = [];
    for ( var prop in filters ) {
      isoFilters.push( filters[ prop ] )
    }
    var selector = isoFilters.join('');
    $container.isotope({ filter: selector });

    if (doneOnce != true){
      $('#steps').children().css('display','inline-block')
      $('.step.sorts,.step.tags,.step.tag-handler,.step.area').animate({
        opacity: 1
      });
      $('.center').center()
      doneOnce = true;
    }

    return false;
  });


  $('.slide').on('click',function(){
    if($(this).hasClass('prev')){
      var $this = $(this);
      if($this.next().hasClass('v')){
        $this.hide()
        return false;
      }
      $(this).siblings('li.v').prev('.h').show().removeClass('h').addClass('v')
      $(this).siblings('li.v:last').hide().removeClass('v').addClass('h')
      $(this).siblings('.slide').show()
      if($this.next().hasClass('v')){
        $this.hide()
      }
    }
    if($(this).hasClass('next')){
      var $this = $(this);
      if($this.prev().hasClass('v')){
        $this.hide()
        return false;
      }
      $(this).siblings('li.v + li.h').show().removeClass('h').addClass('v')
      $(this).siblings('li.v:first').hide().removeClass('v').addClass('h')
      $(this).siblings('.slide').show()
      if($this.prev().hasClass('v')){
        $this.hide()
      }
    }
  });

  $('.step.sorts a').click(function(){
    var sortName = $(this).attr('href').slice(1);
    $('.coupon-container').isotope({ sortBy: sortName });
    return false;
  });

  
  // change size of clicked coupon
  $container.delegate( '.coupon .large-toggle', 'click', function(){
    $(this).parents('.coupon').toggleClass('large');
    $container.isotope('reLayout');
  });

  $container.delegate( '.coupon .favorite-toggle', 'click', function(){
    $(this).parents('.coupon').toggleClass('favorite');
    $container.isotope('reLayout');
  });

  $('.date').each(function(){
    var h = $(this).html()
    $(this).text(moment(h).fromNow())
  })
});

$(window).on('load', function (){

  $('.order-container').height($('#steps').innerHeight())

  $('.slide.prev').hide()
  $('div#steps').children('.step').not('.cats').hide()

  $('div.step.tags ul').each(function(){
    $(this).children('li:lt(4)').show().addClass('v')
    $(this).children('li:gt(3)').hide().addClass('h')
  })
                            

  $('.center').center()
  $('.coupon-container').isotope('reLayout')

});








