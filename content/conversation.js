$(document).ready(function() {
 
  $("#collapseAll").click(function() {
    $("message-in-conversation").removeClass("expanded");
  });

  $("#expandAll").click(function() {
    $("message-in-conversation").addClass("expanded");
  });
});
