$(document).ready(function() {
 
  $("div.message").click(function() {
    $(this).addClass("expanded");
  });

  $(".thread.top li").click(function(event) {
    $(".thread.top li").removeClass("selected");
    $(this).addClass("selected");
    let target =  "#" + $(this).attr("target");
    $(target).click();

    // we use getClientRects() instead of offset() because offset recalcuates 
    // position against the page which doesn't work for fixed elements above 
    // scrolling pages
    let targetOffset = $(target).offset().top - event.target.getClientRects()[0].top;
    
    $("html,body").animate( { scrollTop : targetOffset }, "fast" );
    
  });
  
  $("#collapseAll").click(function() {
    $("div.message").removeClass("expanded");
  });

  $("#expandAll").click(function() {
    $("div.message").addClass("expanded");
  });
      
  let offset = $(".messages").offset().top;
  $("#threader").css("top", offset + 10);
  
  $(".thread > ul > li").each(function(){
    $(this).click();
    return false;
    });
});
