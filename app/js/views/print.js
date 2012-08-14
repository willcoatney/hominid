// isotope
//

var doneOnce = false

$.Isotope.prototype._getCenteredMasonryColumns = function() {
  this.width = this.element.width();
  
  var parentWidth = this.element.parent().width();
  
  var colW = this.options.masonry && this.options.masonry.columnWidth ||
                this.$filteredAtoms.outerWidth(true) ||
                parentWidth;
  
  var cols = Math.floor( parentWidth / colW );
  cols = Math.max( cols, 1 );

  this.masonry.cols = cols;
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


var $container = $('.coupon-container');

$container.isotope({
  itemSelector : '.coupon',
  masonry : {
    columnWidth : 300
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

var doneOnce = false;
var filters = {}

$('.option-set a').click(function(){

  if ( !doneOnce) {
    $('h1#foobar').append('derp')
    $('.step.jsHide').fadeIn()
    doneOnce = true
  }

  var $this = $(this);
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
      $rivals.removeClass('active');
    }
  }
  
  if ( $step.hasClass('cats')){

    var $catSelector = $this.attr('href').slice(1);
    var $catTag = $('.step.tags').children('ul.'+ $catSelector )
    var $catHandler = $step.siblings('.tag-handler').children('p.'+ $catSelector )


    $catTag.css('display','block')
    $catTag.siblings().hide()
    $catHandler.css('display','block')
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

  return false;

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

$( function (){
  $('.date').each(function(){
    var h = $(this).html()
    $(this).text(moment(h).fromNow())
  })
});

$(window).on('load', function (){

  $('.coupon-container').isotope('reLayout')

});







