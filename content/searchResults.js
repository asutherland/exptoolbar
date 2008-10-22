
let Cc = Components.classes;
let Ci = Components.interfaces;

let conversationShown = false;

let gStr = {
  yesterday: "Yesterday", // "yesterday",
  monthDate: "#1 #2", // "monthDate",
  yearDate: "#1 #2 #3" // "yearDate",
};

var tl;
var gEventSource;

function OnLoad() {
  try {
    $(window).bind("resize", onResize);
    gEventSource = new Timeline.DefaultEventSource();
    var bandInfos = [
      Timeline.createBandInfo({
          eventSource: gEventSource,
          showEventText: false,
          width:          "70%", 
          intervalUnit:   Timeline.DateTime.MONTH, 
          intervalPixels: 100
      }),
      Timeline.createBandInfo({
          eventSource: gEventSource,
          width:          "30%",
          showEventText: false,
          trackHeight:    0.5,
          trackGap:       0.2,
          intervalUnit:   Timeline.DateTime.YEAR, 
          intervalPixels: 200,
          overview:       true
      })
    ];
    bandInfos[1].syncWith = 0;
    bandInfos[1].highlight = true;
    tl = Timeline.create(document.getElementById("my-timeline"), bandInfos);
    var theme = Timeline.ClassicTheme.create();
    //Timeline.ThemeName = 'dark-theme'
    $("#timeline-wrap").hide();
    $('#timeline-toggle-button').bind("click", ShowTimeline);
    $('#close-timeline-button').bind("click", HideTimeline);
    adjustSizes();
  } catch (e) {
    dumpExc(e);
  }
}

function adjustSizes()
{

  var newWindowHeight = $(window).height();
  //var navbarHeight = $("#navigation").height();
  dump("newWindowHeight = " + newWindowHeight + '\n');
  //dump("navbarHeight = " + navbarHeight + '\n');
  $("#conversations").css("height", newWindowHeight); // XXX
  $("#messagelist").css("height", newWindowHeight);
}

var resizeTimerID = null;
function onResize() {
    if (resizeTimerID == null) {
        resizeTimerID = window.setTimeout(function() {
            resizeTimerID = null;
            adjustSizes();
            tl.layout(); }, 500);
    }
}

let gEvents = [];
let gConversations = [];
let gTimelineShown = false;

function gTimeline_addConversations(conversations) {
  gConversations = conversations;
  if (gTimelineShown) {
    UpdateTimeline();
  }
}

function UpdateTimeline()
{
    gEvents = []
    for (let i = 0; i < gConversations.length ; i++) {
      let conversation = gConversations[i];
      let messagesIter = Iterator(conversation.messages);
      let oldest = conversation.messages[0].date;
      let newest = conversation.messages[0].date;
      for each ([idx, message] in messagesIter)
      {
        oldest = message.date < oldest ? message.date : oldest;
        newest = message.date > newest ? message.date : newest;
      }
      let escapedSubject = conversation.subject.replace('&', '&amp;');
      let escapedShortSubject;
      if (conversation.subject.length > 20) {
        escapedShortSubject = conversation.subject.slice(0,25).replace('&', '&amp;')+'...';
      } else {
        escapedShortSubject = conversation.subject;
      }
      var evt = new Timeline.DefaultEventSource.Event({
                    id: conversation.id.toString(),
                    start: oldest,
                    end: newest,
                    instant: true,
                    text: escapedShortSubject,
                    description: escapedShortSubject,
                    caption: escapedShortSubject
      });
      gEvents.push(evt);
    };
    gEventSource.clear();
    gEventSource.addMany(gEvents);
}

function ShowTimeline()
{
  try {
    UpdateTimeline();
    $('#timeline-wrap').slideDown();
    $('#timeline-wrap').show();
    $('#my-timeline').show();
    $('#timeline-toggle-button').text("Hide timeline");
    $('#timeline-toggle-button').unbind("click", ShowTimeline);
    $('#timeline-toggle-button').bind("click", HideTimeline);
    gTimelineShown = true;
  } catch (e) {
    dump(e);
    dumpExc(e);
  }
}

function HideTimeline()
{
  $("#timeline-wrap").slideUp();
  $('#timeline-toggle-button').text("Show timeline");
  $('#timeline-toggle-button').unbind("click", HideTimeline);
  $('#timeline-toggle-button').bind("click", ShowTimeline);
  gTimelineShown = false;
}

function initialize()
{
//131     get _strBundle() {
//132         if (!this.__strBundle) {
//133             var bunService = Cc["@mozilla.org/intl/stringbundle;1"].
//134                              getService(Ci.nsIStringBundleService);
//135             this.__strBundle = bunService.createBundle(
//136                         "chrome://passwordmgr/locale/passwordmgr.properties");
//137             if (!this.__strBundle)
//138                 throw "String bundle for Login Manager not present!";
//139         }
//140 
//141         return this.__strBundle;
//142     },
  //let (sb = document.getElementById("dateStrings")) {
  //  let getStr = function(string) sb.getString(string);
  //  for (let [name, value] in Iterator(gStr))
  //    gStr[name] = typeof value == "string" ? getStr(value) : value.map(getStr);
  //}
}

function findSnippetInMimeMsg(mimeMsg) {
  return mimeMsg.body.slice(0,100);
}


function goback()
{
    try {
        $("#backButton").animate({'opacity': 0})
        $(".rhs").animate({'width': "15em"})
        $(".conversations").animate({'marginRight': "16em"});
        $("#commandbox").slideDown();
        $(".messagelist").slideUp();
        conversationShown = false;
    } catch (e) {
        dumpExc(e);
    }
}


function makeDateFriendly(date)
{
  let dts = Cc["@mozilla.org/intl/scriptabledateformat;1"].
            getService(Ci.nsIScriptableDateFormat);

  // Figure out when today begins
  let now = new Date();
  let today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Get the end time to display
  let end = date;

  // Figure out if the end time is from today, yesterday, this week, etc.
  let dateTime;
  if (end >= today) {
    // Download finished after today started, show the time
    dateTime = dts.FormatTime("", dts.timeFormatNoSeconds,
                              end.getHours(), end.getMinutes(), 0);
  } else if (today - end < (24 * 60 * 60 * 1000)) {
    // Download finished after yesterday started, show yesterday
    dateTime = gStr.yesterday;
  } else if (today - end < (6 * 24 * 60 * 60 * 1000)) {
    // Download finished after last week started, show day of week
    dateTime = end.toLocaleFormat("%A");
  } else if (today - end < (30 * 24 * 60 * 60 * 1000)) {
    // Download must have been from some time ago.. show month/day
    let month = end.toLocaleFormat("%B");
    // Remove leading 0 by converting the date string to a number
    let date = Number(end.toLocaleFormat("%d"));
    dateTime = replaceInsert(gStr.monthDate, 1, month);
    dateTime = replaceInsert(dateTime, 2, date);
  } else {
    // Download finished after last month started, show year
    let month = end.toLocaleFormat("%B");
    let year = end.toLocaleFormat("%y");
    // Remove leading 0 by converting the date string to a number
    let date = Number(end.toLocaleFormat("%d"));
    dateTime = replaceInsert(gStr.yearDate, 1, month);
    dateTime = replaceInsert(dateTime, 2, date);
    dateTime = replaceInsert(dateTime, 3, year);
  }
  
  return dateTime;
  //
  //// Set the tooltip to be the full date and time
  //let dateTimeTip = dts.FormatDateTime("",
  //                                     dts.dateFormatLong,
  //                                     dts.timeFormatNoSeconds,
  //                                     end.getFullYear(),
  //                                     end.getMonth() + 1,
  //                                     end.getDate(),
  //                                     end.getHours(),
  //                                     end.getMinutes(),
  //                                     0); 
}

function makeFriendlyName(name)
{
    let firstName = name.split(' ')[0];
    if (firstName.indexOf('@') != -1)
        firstName = firstName.split('@')[0] + '@...';
    firstName = firstName.replace(" ", "");
    firstName = firstName.replace("'", "");
    firstName = firstName.replace('"', "");
    return firstName;
}

// TODO, remove after debugging
function ddump(text)
{
    dump(text + "\n");
}
function ddumpObject(obj, name, maxDepth, curDepth)
{
  if (curDepth == undefined)
    curDepth = 0;
  if (maxDepth != undefined && curDepth > maxDepth)
    return;

  var i = 0;
  for (prop in obj)
  {
    i++;
    try {
      if (typeof(obj[prop]) == "object")
      {
        if (obj[prop] && obj[prop].length != undefined)
          ddump(name + "." + prop + "=[probably array, length "
                + obj[prop].length + "]");
        else
          ddump(name + "." + prop + "=[" + typeof(obj[prop]) + "]");
        ddumpObject(obj[prop], name + "." + prop, maxDepth, curDepth+1);
      }
      else if (typeof(obj[prop]) == "function")
        ddump(name + "." + prop + "=[function]");
      else
        ddump(name + "." + prop + "=" + obj[prop]);
    } catch (e) {
      ddump(name + "." + prop + "-> Exception(" + e + ")");
    }
  }
  if (!i)
    ddump(name + " is empty");
}


function dumpExc(e, message) {
  var objDump = getObjectTree(e,1);
  if (typeof(e) == 'object' && 'stack' in e)
      objDump += e.stack;
  if (typeof(message)=='undefined' || !message)
      message='';
  dump(message+'\n-- EXCEPTION START --\n'+objDump+'-- EXCEPTION END --\n');
}

function getObjectTree(o, recurse, compress, level)
{
    var s = "";
    var pfx = "";

    if (typeof recurse == "undefined")
        recurse = 0;
    if (typeof level == "undefined")
        level = 0;
    if (typeof compress == "undefined")
        compress = true;

    for (var i = 0; i < level; i++)
        pfx += (compress) ? "| " : "|  ";

    var tee = (compress) ? "+ " : "+- ";

    if (typeof(o) != 'object') {
        s += pfx + tee + i + " (" + typeof(o) + ") " + o + "\n";
    } else
    for (i in o)
    {
        var t;
        try
        {
            t = typeof o[i];

            switch (t)
            {
                case "function":
                    var sfunc = String(o[i]).split("\n");
                    if (sfunc[2] == "    [native code]")
                        sfunc = "[native code]";
                    else
                        sfunc = sfunc.length + " lines";
                    s += pfx + tee + i + " (function) " + sfunc + "\n";
                    break;

                case "object":
                    s += pfx + tee + i + " (object) " + o[i] + "\n";
                    if (!compress)
                        s += pfx + "|\n";
                    if ((i != "parent") && (recurse))
                        s += getObjectTree(o[i], recurse - 1,
                                             compress, level + 1);
                    break;

                case "string":
                    if (o[i].length > 200)
                        s += pfx + tee + i + " (" + t + ") " +
                            o[i].length + " chars\n";
                    else
                        s += pfx + tee + i + " (" + t + ") '" + o[i] + "'\n";
                    break;

                default:
                    s += pfx + tee + i + " (" + t + ") " + o[i] + "\n";
            }
        }
        catch (ex)
        {
            s += pfx + tee + i + " (exception) " + ex + "\n";
        }

        if (!compress)
            s += pfx + "|\n";

    }

    s += pfx + "*\n";

    return s;
}


/**
 * Helper function to replace a placeholder string with a real string
 *
 * @param aText
 *        Source text containing placeholder (e.g., #1)
 * @param aIndex
 *        Index number of placeholder to replace
 * @param aValue
 *        New string to put in place of placeholder
 * @return The string with placeholder replaced with the new string
 */
function replaceInsert(aText, aIndex, aValue)
{
  return aText.replace("#" + aIndex, aValue);
}

var converter = new Showdown.converter();
function makeHTML(text) {
    return converter.makeHtml(text);
}


escapeXMLchars = function(s) {
    return s.replace(/[<>&]/g, function(s) {
        switch (s) {
            case "<": return "&lt;";
            case ">": return "&gt;";
            case "&": return "&amp;";
            default: throw Error("Unexpected match");
            }
        }
    );    
}