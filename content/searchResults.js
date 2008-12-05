
let Cc = Components.classes;
let Ci = Components.interfaces;

function OnLoad() {
  try {
    $(".conversations").css("marginTop", $("#toolbox").height() );
    $("#toolbox").width($(".conversations").width());
    
    $(window).resize(function() { $("#toolbox").width($(".conversations").width()); });
    
    $("button.archive").click(function() {
      removeConversations();
    });
    $("button.delete").click(function() {
      removeConversations();
    });
    $("button.junk").click(function() {
      removeConversations();
    });
  } catch (e) {
    dumpExc(e);
  }
}

function removeConversations() {
  $(":checked").parent().slideUp("fast");
}

let gSelectedConversationNodes = {};
