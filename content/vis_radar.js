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
  function updateConversations(aConversations) {
    convAngleWidth = 2.0 * Math.PI / (aConversations.length + 1);
    dump("CONV ANGLE WIDTH: " + convAngleWidth + "\n");
    // each item should be {conv, hits, messagesColl}
    //ddumpObject(aConversations, "convs", 1);
    vis.data([aConversations]);
    //convWedge.data(aConversations);
    setupDateTransform();
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
  /*
    .fillStyle(function (d) {
       dump("---filling:\n");
       ddumpObject(d, "data", 0);
       return this.index % 2 ? "#eeeeee" : "#fafafa";
       });
*/
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
  let convMessageMagic = convPanel.add(pv.Wedge)
    // data for our children is our hits
    // we are operating in the
    .data(function(d, d2) {
            //ddump("DATA---------------\n");
            //ddumpObject(d, "d1", 1);
            //ddumpObject(d2, "d2", 1);
            return d.hits; })
    .left(function() width / 2)
    .top(function() height / 2)
  //    .data(function (d) [c.hits for (c in d)])
    .innerRadius(positionMessage)
    .outerRadius(positionMessage)
    .startAngle(function ()
       this.parent.index * convAngleWidth + convAngleWidth - Math.PI / 2)
    .fillStyle("rgb(255,0,0)")
    .angle(0);

  let hitMessage = convMessageMagic.anchor("center").add(pv.Dot)
    // data is the message itself
    //.data(function (d) d)
    .size(10)
    .strokeStyle("#fcc")
    .fillStyle("#fee");

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