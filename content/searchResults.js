let conversationShown = false;

function addMessageWithBody(msgHdr, mimeMessage) {
    dump("in addMessageWithBody!!" +  msgHdr + ' ' + mimeMessage + '\n')
    //try {
    //    dump("messagebod = " + mimeMessage.body + '\n');
    //    $(".conversationNode").append(mimeMessage.body)
    //} catch (e) {
    //    dump(e);
    //}
}


function diveIntoConversation(conversationNode) {
    try {
        dump("in diveIntoConversation " + conversationNode + '\n');
        if (!conversationShown) {
            conversationShown = true;
            $(".rhs").animate({'width': "40em"})
            $(".results").animate({'marginRight': "41em"});
            $(".commandbox").slideUp();
            $("#backButton").animate({'opacity': 1})
            $(conversationNode).show();
        }
        let glodaconv = conversationNode.obj;
        let message = glodaconv.messages[0];
        parent.MsgHdrToMimeMessage(message.folderMessage,
                            null, addMessageWithBody)
    } catch (e) {
        dump(e);
    }
}

function goback()
{
    try {
        $("#backButton").animate({'opacity': 0})
        $(".rhs").animate({'width': "15em"})
        $(".results").animate({'marginRight': "16em"});
        $(".commandbox").slideDown();
        $(".conversation").slideUp();
        conversationShown = false;
    } catch (e) {
        dump(e);
    }
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
