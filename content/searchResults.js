
let Cc = Components.classes;
let Ci = Components.interfaces;

function OnLoad() {
  try {
    $("#toolbox").width($(".toolbox").width());    
    positionToolbox();
    $(".conversation:first-child").focus();    
    $(window).resize(function() { positionToolbox(); });
    $("button.archive").click(function() {
      removeConversation(selectedConversation);
    });
    $("button.delete").click(function() {
      removeConversation(selectedConversation);
    });
    $("button.junk").click(function() {
      removeConversation(selectedConversation);
    });
    $("button.reply").click(function() {});
    $("button.forward").click(function() {});
  } catch (e) {
    dumpExc(e);
  }
}

function removeConversation(obj) {
  obj.slideUp("fast");
  selectedConversation = $(obj[0].nextElementSibling);
}

function positionToolbox() {
  dump("in positionToolbox!\n");
  $("#toolbox").css("left", $(".toolbox").offset().left);
}

var selectedConversation = null;


