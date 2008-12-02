
let Cc = Components.classes;
let Ci = Components.interfaces;

let gStr = {
  yesterday: "Yesterday", // "yesterday",
  monthDate: "#1 #2", // "monthDate",
  yearDate: "#1 #2 #3" // "yearDate",
};

function findSnippetInMimeMsg(mimeMsg) {
  return mimeMsg.bodyPlain.slice(0,100);
}


function makeDateFriendly(date)
{
  if (!date) {
    dump("ERROR: date passed to makeDateFriendly is false\n");
    return;
  }
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
  try {
    return aText.replace("#" + aIndex, aValue);
  } catch (e) {
    dump("aText = " + aText + '\n');
    dumpExc(e);
  }
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