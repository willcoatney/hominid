$(document).ready(function(){

// datepicker
  
  var today = new Date;
  var todayWrapper = moment(today).format("MMM Do 'YY"); 

  $('#today').text(todayWrapper)

  $('#alert').hide();

  // ALERT ANY TIME YOU CHANGE ANYTHING
  // var startDate = new Date(2012,1,20);
  // var endDate = new Date(2012,1,25);
  // $('#datepicker')
  //   .datepicker()
  //   .on('changeDate', function(ev){
  //       if (ev.date.valueOf() > today.valueOf()){
  //           $('#alert').show().find('strong').text('Wrong answer.');
  //       } else {
  //           $('#alert').hide();
  //       }
  //   });

  // WORKING DIV, BUT BROKEN INPUT
  // var startDate = new Date(2012,1,20);
  // var endDate = new Date(2012,1,25);
  // $('#date-start')
  //     .datepicker()
  //     .on('changeDate', function(ev){
  //         if (ev.date.valueOf() > endDate.valueOf()){
  //             $('#alert').show().find('strong').text('The start date must be before the end date.');
  //         } else {
  //             $('#alert').hide();
  //             startDate = new Date(ev.date);
  //             $('#date-start-display').text($('#date-start').data('date'));
  //         }
  //         $('#date-start').datepicker('hide');
  //     });
  // $('#date-end')
  //     .datepicker()
  //     .on('changeDate', function(ev){
  //         if (ev.date.valueOf() < startDate.valueOf()){
  //             $('#alert').show().find('strong').text('The end date must be after the start date.');
  //         } else {
  //             $('#alert').hide();
  //             endDate = new Date(ev.date);
  //             $('#date-end-display').text($('#date-end').data('date'));
  //         }
  //         $('#date-end').datepicker('hide');
  //     });

})

