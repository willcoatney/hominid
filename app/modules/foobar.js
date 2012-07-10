$("#foo").click(function () {
  var color = $(this).css("background-color");
  $("#foo").html("That div is <span style='color:" +
                     color + ";'>" + color + "</span>.");
});
/* $('#foo').click().toggle(); */

// $(document).ready( function () {
//   $('.foo').click().toggle();
// });
