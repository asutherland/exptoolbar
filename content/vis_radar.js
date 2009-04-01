/**
 * Create a radar-inspired visualization.
 *
 * Sorta cribbing from my visophyte-based e-mail radar vis:
 * http://www.visophyte.org/blog/2007/11/02/radial-radar-email-vis-with-care-factors/
 *
 * Definitely cribbing from the protovis antibiotics example:
 * http://vis.stanford.edu/protovis/ex/antibiotics-burtin.html
 *
 * Because protovis's coordinate space is not automatic, in order to have the
 *  visualization automatically update if the number of conversations changes,
 *  we build a closure that allows these pseudo-constants to be updated while
 *  still looking innocuous.  This is a bit of a lark because I normally don't
 *  use this style of JS.  We could just as easily use the more explicit model
 *  normally used for mozilla code, but this fits stylistically with protovis.
 * This does mean that all uses of the pseudo-constants must be made within
 *  function expressions or explicit functions, but that's already the protovis
 *  idiom.
 *
 * @param aCanvas The canvas node to render into.
 */
function makeConversationRadarVis(_aCanvas, _aConversations) {
  let vis = new pv.Panel().canvas(_aCanvas);

  let width, height;
  let innerRadius, outerRadius, radiusSpan;
  function updateCanvas(aCanvas) {
    width = aCanvas.width;
    height = aCanvas.height;

    // eh, make the inner radius constant sized to bound the visual distortion
    innerRadius = 60;
    outerRadius = Math.min(width/2, height/2) - 10;
    radiusSpan = outerRadius - innerRadius;
  }
  updateCanvas(_aCanvas);

  let convAngleWidth;
  let convWedge = vis.add(pv.Wedge);
  // map a contact id to a (0.0, 1.0) range
  // (this should probably be accomplished using protovis or gloda)
  let contactIdToRelPos = {};
  function updateConversations(aConversations) {
    convAngleWidth = 2.0 * Math.PI / (aConversations.length + 1);
    dump("CONV ANGLE WIDTH: " + convAngleWidth + "\n");
    // each item should be {conv, hits, messagesColl}
    //ddumpObject(aConversations, "convs", 1);
    vis.data([aConversations]);
    //convWedge.data(aConversations);
    setupDateTransform();

    // Traverse all the messages...
    //  - populating seenContact* for the benefit of contactIdToRelPos
    let seenContacts = [];
    let seenContactMap = {};
    for (let [, convInfo] in Iterator(aConversations)) {
      let messages;
      if (convInfo.messagesColl && convInfo.messagesColl.items.length)
        messages = convInfo.messagesColl.items;
      else
        messages = convInfo.hits;
      for (let [, message] in Iterator(messages)) {
        for (let [, contact] in Iterator(message.involves)) {
          if (!(contact.id in seenContactMap)) {
            seenContactMap[contact.id] = seenContacts.length;
            seenContacts.push(contact);
          }
        }
      }
    }

    for (let [iContact, contact] in Iterator(seenContacts)) {
      contactIdToRelPos[contact.id] = (1 + iContact) /
                                      (seenContacts.length + 1);
    }
  }
  updateConversations(_aConversations);

  convWedge
    // the data is the list of conversations...
    .data(function (d) d)
    //.data(function(d) {ddump("DATA---------------\n"); ddumpObject(d, "data", 0); return d; })
    // center it
    .left(function() width / 2)
    .top(function() height / 2)
    .innerRadius(function() innerRadius)
    .outerRadius(function() outerRadius)
    .startAngle(function ()
       this.index * convAngleWidth + convAngleWidth / 2 - Math.PI / 2)
    .angle(function() convAngleWidth)
    .fillStyle(function (d) this.index % 2 ? "#eeeeee" : "#fafafa");
    //.fillStyle(function (d) this.index % 2 ? "#222" : "#333");
  /*
    .fillStyle(function (d) {
       dump("---filling:\n");
       ddumpObject(d, "data", 0);
       return this.index % 2 ? "#eeeeee" : "#fafafa";
       });
*/
  convWedge.anchor("center").add(pv.Label)
    .textAlign("center")
    .textStyle("#555")
    .text(function (convInfo) convInfo.conv.subject.substr(0, 40));

  function positionMessage(message) {
    let p = innerRadius +
            dateLogTransform(message.date) * radiusSpan;
    return p;
  }

  // circular time gridlines.  use the wedge as our prototype for positioning
  let timeTunnel = vis.add(pv.Dot)
    // eh, could do inheritence/nesting for the position
      .left(function() width / 2)
      .top(function() height / 2)
      .data(DATE_RANGE_LABELS)
      .strokeStyle("rgba(64, 64, 64, 0.4)").lineWidth(0.5)
      .size(function() Math.pow(innerRadius + DATE_RANGES[this.index][0] * radiusSpan, 2))
    .anchor("top").add(pv.Label)
      .textStyle("rgba(64, 64, 64, 0.7)")
      .textBaseline("top")
      .text(pv.identity);

  // create synthetic wedges so that we can anchor dots for the actual messages
  let convPanel = vis.add(pv.Panel)
    .data(function(d) d);
  let convMessageMagicAll = convPanel.add(pv.Wedge)
    // data for our children is our hits
    // we are operating in the
    .data(function(d, d2) (d.messagesColl && d.messagesColl.items.length) ?
          d.messagesColl.items : [] )
    .left(function() width / 2)
    .top(function() height / 2)
    .innerRadius(positionMessage)
    .outerRadius(positionMessage)
    .startAngle(function (message)
       this.parent.index * convAngleWidth + convAngleWidth / 2 - Math.PI / 2 +
               convAngleWidth * (contactIdToRelPos[message.from.id] || 0))
    .fillStyle("rgb(255,0,0)")
    .angle(0);

  function colorMessage(msg, convInfo) {
    let r, g, b, a;
    // messages with tags get colored based on the tag's color!
    if (msg.tags && msg.tags.length) {
      [r, g, b] = mapUglyColorToPrettyColor(msg.tags[0].color);
    }
    // otherwise, starred = yellow
    else if (msg.starred) {
      [r, g, b] = mapUglyColorToPrettyColor("#ff0");
    }
    else {
      r = g = b = 128;
    }
    if (msg.id in convInfo.hitIds)
      a = 1.0;
    else
      a = 0.3;
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }

  let nonHitMessage = convMessageMagicAll.anchor("center").add(pv.Dot)
    // data is the message itself
    //.data(function (d) d)
    .size(function (msg) msg.starred ? 16 : 10)
    .shape(function (msg) msg.starred ? "diamond" : "circle")
    .visible(function (msg, convInfo) !(msg.id in convInfo.hitIds))
    .strokeStyle(null)
    .fillStyle(colorMessage);

  let convMessageMagicHits = convMessageMagicAll.add(pv.Wedge)
    .data(function (d) d.hits);
  let hitMessage = convMessageMagicHits.anchor("center").add(pv.Dot)
    // data is the message itself
    //.data(function (d) d)
    .size(function (msg) msg.starred ? 16 : 10)
    .shape(function (msg) msg.starred ? "diamond" :
                            (msg.from.popularity > 100) ? "circle" : "cross")
    .strokeStyle(colorMessage)
    .fillStyle(colorMessage);

  return {
    vis: vis,
    updateCanvas: updateCanvas,
    updateConversations: updateConversations,
  };
}

var DATE_RANGE_LABELS = ["now", "1 day", "1 week", "1 month",
                         "3 months", "1 year", "5 years",
                         "forever"];
/**
 * Table supporting dateLogTransform and populated by setupDateTransform.
 * Each item in the list is a list of the form:
 *  [output value low, output value high, more recent ts, older ts].
 */
var DATE_RANGES;
/**
 * Given a date, perform a 'log'-style transform, mapping a date to the range
 *  [0.0, 1.0].  The twiddle values are in setupDateTransform.
 *
 * Within each range, the scaling is linear.
 */
function dateLogTransform(aDate) {
  let ts = aDate.valueOf();
  for (let i = 0; i < DATE_RANGES.length; i++) {
    let [outLow, outHigh, tsRecent, tsOld] = DATE_RANGES[i];
    if (ts >= tsOld && ts <= tsRecent)
      return outLow + (outHigh - outLow) * ((ts - tsOld) / (tsRecent - tsOld));
  }
  return 6.0;
}

function setupDateTransform(aNow) {
  if (aNow == null)
    aNow = new Date();
  let tsnow = aNow.valueOf();

  DATE_RANGES = [];
  // one day
  DATE_RANGES.push([0.0, 0.2,
    tsnow,
    tsnow - 24 * 60 * 60 * 1000]);
  // one week
  DATE_RANGES.push([0.2, 0.4,
    tsnow - 24 * 60 * 60 * 1000,
    tsnow - 7 * 24 * 60 * 60 * 1000]);
  // one month
  DATE_RANGES.push([0.4, 0.6,
    tsnow - 7 * 24 * 60 * 60 * 1000,
    tsnow - 28 * 24 * 60 * 60 * 1000]); // the metric month! kinda...
  // three months
  DATE_RANGES.push([0.6, 0.8,
    tsnow - 28 * 24 * 60 * 60 * 1000,
    tsnow - 3 * 28 * 24 * 60 * 60 * 1000]);
  // one year
  DATE_RANGES.push([0.8, 0.9,
    tsnow - 3 * 28 * 24 * 60 * 60 * 1000,
    tsnow - 365 * 24 * 60 * 60 * 1000]);
  // five years
  DATE_RANGES.push([0.9, 0.95,
    tsnow - 365 * 24 * 60 * 60 * 1000,
    tsnow - 5 * 365 * 24 * 60 * 60 * 1000]);
  // forever
  DATE_RANGES.push([0.95, 1.0, tsnow, 0]);
  // never-used value to help with labeling...
  DATE_RANGES.push([1.0, 1.0, null, null]);
}

function decodeHexColor(aHexColor) {
  let r, g, b;
  if (aHexColor[0] == "#")
    aHexColor = aHexColor.substr(1);
  dump("length: " + aHexColor.length + "\n");
  if (aHexColor.length == 6) {
    r = parseInt(aHexColor.substr(0, 2), 16);
    g = parseInt(aHexColor.substr(2, 4), 16);
    b = parseInt(aHexColor.substr(4, 6), 16);
  }
  else {
    r = parseInt(aHexColor.substr(0, 1), 16);
    g = parseInt(aHexColor.substr(1, 2), 16);
    b = parseInt(aHexColor.substr(2, 3), 16);
    r = r * 16 + r;
    g = g * 16 + g;
    b = b * 16 + b;
  }
  return [r, g, b];
}

var TANGO_COLORS = [
  '#fcaf3e', '#f57900', '#ce5c00', // orange
  '#8ae234', '#73d216', '#4e9a06', // chameleon
  '#729fcf', '#3a65a4', '#204a87', // sky blue
  '#ad7fa8', '#75507b', '#5c3566', // plum
  '#ef2929', '#cc0000', '#a40000', // scarlet red
  '#fce94f', '#edd400', '#c4a000', // butter
  '#e9b97e', '#c17d11', '#8f5902', // chocolate
];

var PRETTY_COLORS = TANGO_COLORS;

var UGLY_TO_PRETTY_CACHE = {};
/**
 * Map an ugly hex color into a pretty [r, g, b] tuple.
 */
function mapUglyColorToPrettyColor(aUglyHex) {
  if (aUglyHex in UGLY_TO_PRETTY_CACHE) {
    return UGLY_TO_PRETTY_CACHE[aUglyHex];
  }
  let [r, g, b] = decodeHexColor(aUglyHex);

  let bestTupe, bestDist;
  for (let [, candHexColor] in Iterator(PRETTY_COLORS)) {
    let candTupe = decodeHexColor(candHexColor);
    let [cr, cg, cb] = candTupe;
    let dist = (cr - r) * (cr - r) + (cg - g) * (cg - g) + (cb - b) * (cb - b);
    if (bestTupe === undefined || dist < bestDist) {
      bestTupe = candTupe;
      bestDist = dist;
    }
  }

  UGLY_TO_PRETTY_CACHE[aUglyHex] = bestTupe;
  return bestTupe;
}