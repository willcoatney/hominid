$(document).ready( function() {

  // var Supra = Backbone.Model.extend({
  // });

  var object = {};

  _.extend(object, Backbone.Events);

  object.on("alert", function(msg) {
    alert("Triggered " + msg);
  });

  $('.foo').on("click", function () {

    object.trigger("alert", "an event");

  })

});
