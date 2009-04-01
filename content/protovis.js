var undefined;
Function.prototype.extend = function() {
  function a() {}
  a.prototype = this.prototype;
  return new a()
};
/* messing with the Array prototype is bad */
function array2Dict(g, h) {
  var a = {};
  for (var d = 0; d < this.length; d++) {
    if (d in this) {
      var b = this[d];
      a[b] = g.call(h, b, d, this)
    }
  }
  return a
};
if (!Array.prototype.reduce) {
  Array.prototype.reduce = function(g, b) {
    var a = this.length;
    if (!a && (arguments.length == 1)) {
      throw new Error()
    }
    var d = 0;
    if (arguments.length < 2) {
      while (true) {
        if (d in this) {
          b = this[d++];
          break
        }
        if (++d >= a) {
          throw new Error()
        }
      }
    }
    for (; d < a; d++) {
      if (d in this) {
        b = g.call(null, b, this[d], d, this)
      }
    }
    return b
  }
}
Date.__parse__ = Date.parse;
Date.parse = function(f, g) {
  if (arguments.length == 1) {
    return Date.__parse__(f)
  }
  var h = new Date(1970, 1, 1);
  var a = [function() {}];
  g = g.replace(/[\\\^\$\*\+\?\[\]\(\)\.\{\}]/g, "\\$&");
  g = g.replace(/%[a-zA-Z0-9]/g,
  function(d) {
    switch (d) {
    case "%S":
      a.push(function(i) {
        h.setSeconds(i)
      });
      return "([0-9]+)";
    case "%M":
      a.push(function(i) {
        h.setMinutes(i)
      });
      return "([0-9]+)";
    case "%H":
      a.push(function(i) {
        h.setHours(i)
      });
      return "([0-9]+)";
    case "%d":
      a.push(function(i) {
        h.setDate(i)
      });
      return "([0-9]+)";
    case "%m":
      a.push(function(i) {
        h.setMonth(i - 1)
      });
      return "([0-9]+)";
    case "%Y":
      a.push(function(i) {
        h.setYear(i)
      });
      return "([0-9]+)";
    case "%%":
      a.push(function() {});
      return "%";
    case "%y":
      a.push(function(i) {
        i = Number(i);
        h.setYear(i + (((0 <= i) && (i < 69)) ? 2000 : (((i >= 69) && (i < 100) ? 1900 : 0))))
      });
      return "([0-9]+)"
    }
    return d
  });
  var b = f.match(g);
  if (b) {
    b.forEach(function(d, j) {
      a[j](d)
    })
  }
  return h
};
if (Date.prototype.toLocaleFormat) {
  Date.prototype.format = Date.prototype.toLocaleFormat
} else {
  Date.prototype.format = function(a) {
    var b = this;
    return a.replace(/%[a-zA-Z0-9]/g,
    function(d) {
      switch (d) {
      case "%a":
        return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", ][b.getDay()];
      case "%b":
        return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][b.getMonth()];
      case "%S":
        return b.getSeconds();
      case "%M":
        return b.getMinutes();
      case "%H":
        return b.getHours();
      case "%d":
        return b.getDate();
      case "%m":
        return b.getMonth() + 1;
      case "%Y":
        return b.getYear();
      case "%%":
        return "%";
      case "%y":
        return b.getYear() % 100
      }
      return d
    })
  }
}
if (typeof CanvasRenderingContext2D == "undefined") {
  var CanvasRenderingContext2D = document.createElement("canvas").getContext("2d").constructor
}
var c = CanvasRenderingContext2D.prototype;
if (c.mozDrawText) {
  if (!c.measureText) {
    c.measureText = function(a) {
      this.mozTextStyle = this.font;
      return {
        width: this.mozMeasureText(a)
      }
    }
  }
  if (!c.fillText) {
    c.fillText = function(b, a, d) {
      this.mozTextStyle = this.font;
      this.save();
      this.translate(a, d);
      this.mozDrawText(b);
      this.restore()
    }
  }
} else {
  if (!c.measureText) {
    c.measureText = function() {
      return {
        width: -1
      }
    }
  }
  if (!c.fillText) {
    c.fillText = function() {}
  }
}
window.addEventListener("load",
function() {
  var scripts = document.getElementsByTagName("script");
  for (var i = 0; i < scripts.length; i++) {
    if (scripts[i].type == "text/javascript+protovis") {
      try {
        pv.Panel.$dom = scripts[i];
        eval(pv.parse(scripts[i].textContent))
      } catch(ignored) {}
      delete pv.Panel.$dom
    }
  }
},
false);
var pv = {};
try {
  eval("pv.parse = function(x) x;")
} catch(e) {
  pv.parse = function(k) {
    var g = new RegExp("function([^)]*)", "g"),
    a,
    d = 0;
    var f = "";
    while (a = g.exec(k)) {
      var b = a.index + a[0].length;
      while (k[++b] == " ") {}
      if (k[b--] != "{") {
        f += k.substring(d, b) + "{return ";
        d = b;
        for (var h = 0; h >= 0 && b < k.length; b++) {
          switch (k[b]) {
          case "[":
          case "(":
            h++;
            break;
          case "]":
          case ")":
            h--;
            break;
          case ";":
          case ",":
            if (h == 0) {
              h--
            }
            break
          }
        }
        f += pv.parse(k.substring(d, --b)) + ";}";
        d = b
      }
      g.lastIndex = b
    }
    f += k.substring(d);
    return f
  }
}
pv.identity = function(a) {
  return a
};
pv.range = function(f, a, b) {
  if (arguments.length == 1) {
    a = f;
    f = 0
  }
  if (b == undefined) {
    b = 1
  }
  var d = [];
  while (f < a) {
    d.push(f);
    f += b
  }
  return d
};
pv.cross = function(h, g) {
  var p = [];
  for (var l = 0, o = h.length, f = g.length; l < o; l++) {
    for (var k = 0, d = h[l]; k < f; k++) {
      p.push([d, g[k]])
    }
  }
  return p
};
pv.nest = function(a) {
  return new pv.Nest(a)
};
pv.blend = function(a) {
  return Array.prototype.concat.apply([], a)
};
pv.keys = function(b) {
  var d = [];
  for (var a in b) {
    d.push(a)
  }
  return d
};
pv.entries = function(b) {
  var d = [];
  for (var a in b) {
    d.push({
      key: a,
      value: b[a]
    })
  }
  return d
};
pv.values = function(b) {
  var d = [];
  for (var a in b) {
    d.push(b[a])
  }
  return d
};
pv.normalize = function(d, b) {
  if (!b) {
    b = pv.identity
  }
  var a = d.reduce(function(f, g) {
    return f + b(g)
  },
  0);
  return d.map(function(f) {
    return b(f) / a
  })
};
pv.count = function(a) {
  return a.length
};
pv.sum = function(b, a) {
  if (!a) {
    a = pv.identity
  }
  return b.reduce(function(f, g) {
    return f + a(g)
  },
  0)
};
pv.max = function(b, a) {
  if (!a) {
    a = pv.identity
  }
  return b.reduce(function(f, g) {
    return Math.max(f, a(g))
  },
  -Infinity)
};
pv.max.index = function(j, g) {
  if (!g) {
    g = pv.identity
  }
  var b = -1,
  h = -Infinity;
  for (var d = 0; d < j.length; d++) {
    var a = g(j[d]);
    if (a > h) {
      h = a;
      b = d
    }
  }
  return b
};
pv.min = function(b, a) {
  if (!a) {
    a = pv.identity
  }
  return b.reduce(function(f, g) {
    return Math.min(f, a(g))
  },
  Infinity)
};
pv.min.index = function(j, h) {
  if (!h) {
    h = pv.identity
  }
  var g = -1,
  b = Infinity;
  for (var d = 0; d < j.length; d++) {
    var a = h(j[d]);
    if (a < b) {
      b = a;
      g = d
    }
  }
  return g
};
pv.mean = function(b, a) {
  return pv.sum(b, a) / b.length
};
pv.median = function(d, b) {
  if (!b) {
    b = pv.identity
  }
  d = d.map(b).sort(function(g, f) {
    return g - f
  });
  if (d.length % 2) {
    return d[Math.floor(d.length / 2)]
  }
  var a = d.length / 2;
  return (d[a - 1] + d[a]) / 2
};
pv.permute = function(g, a, b) {
  if (!b) {
    b = pv.identity
  }
  var d = new Array(g.length);
  a.forEach(function(f, h) {
    d[h] = b(g[f])
  });
  return d
};
pv.numerate = function(d, a) {
  if (!a) {
    a = pv.identity
  }
  var b = {};
  d.forEach(function(f, g) {
    b[a(f)] = g
  });
  return b
};
pv.reverseOrder = function(d, f) {
  return (f < d) ? -1 : ((f > d) ? 1 : 0)
};
pv.naturalOrder = function(f, d) {
  return (f < d) ? -1 : ((f > d) ? 1 : 0)
};
pv.gradient = function() {
  if (arguments.length < 2) {
    return arguments[0]
  }
  var b = new pv.Gradient();
  for (var a = 0, d = arguments.length - 1; a <= d; a++) {
    b.color(a / d, arguments[a])
  }
  return b
};
pv.css = function(b, a) {
  return parseFloat(self.getComputedStyle(b, null).getPropertyValue(a))
};
pv.Nest = function(a) {
  this.array = a;
  this.keys = []
};
pv.Nest.prototype.key = function(a) {
  this.keys.push(a);
  return this
};
pv.Nest.prototype.sortKeys = function(a) {
  this.keys[this.keys.length - 1].order = a || pv.naturalOrder;
  return this
};
pv.Nest.prototype.sortValues = function(a) {
  this.order = a || pv.naturalOrder;
  return this
};
pv.Nest.prototype.rollup = function(b) {
  var d = this.map();
  function a(h) {
    for (var f in h) {
      var g = h[f];
      if (g instanceof Array) {
        h[f] = b(g)
      } else {
        a(g)
      }
    }
  }
  a(d);
  return d
};
pv.Nest.prototype.entries = function() {
  function a(g) {
    var h = [];
    for (var f in g) {
      var d = g[f];
      h.push({
        key: f,
        values: (d instanceof Array) ? d: a(d)
      })
    }
    return h
  }
  function b(h, f) {
    var g = this.keys[f].order;
    if (g) {
      h.sort(function(j, i) {
        return g(j.key, i.key)
      })
    }
    if (++f < this.keys.length) {
      for (var d = 0; d < h.length; d++) {
        b.call(this, h[d].values, f)
      }
    }
    return h
  }
  return b.call(this, a(this.map()), 0)
};
pv.Nest.prototype.map = function() {
  if (!this.keys.length) {
    return this.array
  }
  var o = {},
  h = [];
  for (var n, l = 0; l < this.array.length; l++) {
    var d = this.array[l];
    var b = o;
    for (n = 0; n < this.keys.length - 1; n++) {
      var g = this.keys[n](d);
      if (!b[g]) {
        b[g] = {}
      }
      b = b[g]
    }
    g = this.keys[n](d);
    if (!b[g]) {
      var f = [];
      h.push(f);
      b[g] = f
    }
    b[g].push(d)
  }
  if (this.order) {
    for (var n = 0; n < h.length; n++) {
      h[n].sort(this.order)
    }
  }
  return o
};
pv.Scales = {};
pv.Scales.epsilon = 1e-30;
pv.Scales.defaultBase = 10;
pv.Scales.defaultNice = false;
pv.Scales.step = function(b, a, d) {
  if (!d) {
    d = pv.Scales.defaultBase
  }
  var f = Math.round(Math.log(a - b) / Math.log(d)) - 1;
  return Math.pow(d, f)
};
pv.Scales.ordinal = function(b) {
  var d = pv.numerate(b);
  function a(f) {
    var g = d[f];
    return (g == undefined) ? -1 : g
  }
  a.values = function() {
    return b
  };
  a.interp = function(f) {
    return b[f]
  };
  return a
};
pv.Scales.linear = function(g, a, i) {
  if (i == undefined) {
    i = pv.Scales.defaultBase
  }
  var d = a - g,
  b = pv.Scales.epsilon;
  function h(f) {
    return d < b && d > -b ? 0 : (f - g) / d
  }
  h.values = function(f) {
    return pv.Scales.linear.values(g, a, i, f)
  };
  h.interp = function(j) {
    return g + j * d
  };
  return h
};
pv.Scales.linear.fromData = function(j, i, h, g) {
  if (h == undefined) {
    h = pv.Scales.defaultBase
  }
  if (g == undefined) {
    g = pv.Scales.defaultNice
  }
  var b = pv.min(j, i);
  var a = pv.max(j, i);
  if (!g) {
    var d = pv.Scales.linear.range(b, a, h);
    b = d.min;
    a = d.max
  }
  return pv.Scales.linear(b, a, h)
};
pv.Scales.linear.values = function(g, j, b, d) {
  if (b == undefined) {
    b = pv.Scales.defaultBase
  }
  if (d == undefined) {
    d = -1
  }
  var h = j - g;
  if (h == 0) {
    return [g]
  } else {
    var f = pv.Scales.step(g, j, b);
    var a = d < 0 ? 1 : Math.max(1, Math.floor(h / (f * d)));
    var i = [];
    for (var k = g; k <= j; k += a * f) {
      i.push(k)
    }
    return i
  }
};
pv.Scales.linear.range = function(b, a, f) {
  var d = pv.Scales.step(b, a, f);
  return {
    min: Math.floor(b / d) * d,
    max: Math.ceil(a / d) * d
  }
};
pv.Scales.root = function(i, a, k) {
  if (k == undefined) {
    k = 2
  }
  function d(f) {
    var l = (f < 0) ? -1 : 1;
    return l * Math.pow(l * f, 1 / k)
  }
  var h = d(i),
  g = d(a) - h,
  b = pv.Scales.epsilon;
  function j(f) {
    return (d(f) - h) / g
  }
  j.values = function(f) {
    return pv.Scales.linear.values(i, a, k, 10)
  };
  j.interp = function(n) {
    var m = h + n * g,
    l = (m < 0) ? -1 : 1;
    return l * Math.pow(l * m, k)
  };
  return j
};
pv.Scales.root.fromData = function(j, i, h, g) {
  if (h == undefined) {
    h = 2
  }
  if (g == undefined) {
    g = pv.Scales.defaultNice
  }
  var b = pv.min(j, i);
  var a = pv.max(j, i);
  if (!g) {
    var d = pv.Scales.linear.range(b, a, 10);
    b = d.min;
    a = d.max
  }
  return pv.Scales.root(b, a, h)
};
pv.Scales.log = function(g, a, j) {
  if (j == undefined) {
    j = pv.Scales.defaultBase
  }
  var d = (g < 0 && a > 0) ? pv.Scales.log.zlog: pv.Scales.log.log;
  var k = d(g, j),
  h = d(a, j) - k,
  b = pv.Scales.epsilon;
  function i(f) {
    return (h < b && h > -b) ? 0 : (d(f, j) - k) / h
  }
  i.values = function(f) {
    return pv.Scales.log.values(g, a, 10, f)
  };
  i.interp = function(n) {
    var m = k + n * h,
    l = (m < 0) ? -1 : 1;
    return l * Math.pow(j, l * m)
  };
  return i
};
pv.Scales.log.fromData = function(j, i, h, g) {
  if (h == undefined) {
    h = pv.Scales.defaultBase
  }
  if (g == undefined) {
    g = pv.Scales.defaultNice
  }
  var b = pv.min(j, i);
  var a = pv.max(j, i);
  if (!g) {
    var d = pv.Scales.log.range(b, a, h);
    b = d.min;
    a = d.max
  }
  return pv.Scales.log(b, a, h)
};
pv.Scales.log.log = function(d, a) {
  return d == 0 ? 0 : d > 0 ? Math.log(d) / Math.log(a) : -Math.log( - d) / Math.log(a)
};
pv.Scales.log.zlog = function(d, a) {
  var f = (d < 0) ? -1 : 1;
  d = f * d;
  if (d < a) {
    d += (a - d) / a
  }
  return f * Math.log(d) / Math.log(a)
};
pv.Scales.log.values = function(h, q, a, d) {
  if (a == undefined) {
    a = pv.Scales.defaultBase
  }
  if (d == undefined) {
    d = -1
  }
  var m = (h < 0 && q > 0);
  var t = m ? pv.Scales.log.zlog: pv.Scales.log.log;
  var o = Math.round(t(h, a));
  var f = Math.round(t(q, a));
  var k, g, p, s = m ? -1 : 1;
  if (o == f && o > 0 && Math.pow(a, o) > h) {--o
  }
  var l = [];
  for (k = o; k <= f; ++k) {
    if (k == 0 && s <= 0) {
      l.push(s);
      l.push(0)
    }
    s = m && k < 0 ? -Math.pow(a, -k) : Math.pow(a, k);
    p = m && k < 0 ? Math.pow(a, -k - 1) : s;
    for (g = 1; g < a; ++g, s += p) {
      if (s > q) {
        break
      }
      l.push(s)
    }
  }
  return l
};
pv.Scales.log.range = function(d, a, g) {
  if (g == undefined) {
    g = pv.Scales.defaultBase
  }
  function b(h) {
    return Math.log(h) / Math.log(g)
  }
  var f = {
    min: (d > 0 ? Math.pow(g, Math.floor(b(d))) : -Math.pow(g, -Math.floor( - b( - d)))),
    max: (a > 0 ? Math.pow(g, Math.ceil(b(a))) : -Math.pow(g, -Math.ceil( - b( - a))))
  };
  if (d < 0 && a > 0) {
    if (Math.abs(d) < g) {
      f.min = Math.floor(d)
    }
    if (Math.abs(a) < g) {
      f.max = Math.ceil(a)
    }
  }
  return f
};
pv.Colors = function(b) {
  var f = {};
  var d = {};
  function a() {
    if (!this.root.scene._resetColors) {
      f = {};
      d = {};
      this.root.scene._resetColors = true
    }
    var h = this.type.toString();
    var j = h + "-" + this.childIndex;
    var g = f[j];
    if (g == undefined) {
      var i = d[h] = (d[h] || 0) + 1;
      f[j] = g = b[(i - 1) % b.length]
    }
    return g
  }
  a.values = b;
  a.unique = function() {
    var g = (this.index == -1) ? this.parent.index: this.index;
    return b[g % b.length]
  };
  return a
};
pv.Colors.category10 = pv.Colors(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"]);
pv.Colors.category20 = pv.Colors(["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"]);
pv.Colors.category19 = pv.Colors(["#9c9ede", "#7375b5", "#4a5584", "#cedb9c", "#b5cf6b", "#8ca252", "#637939", "#e7cb94", "#e7ba52", "#bd9e39", "#8c6d31", "#e7969c", "#d6616b", "#ad494a", "#843c39", "#de9ed6", "#ce6dbd", "#a55194", "#7b4173"]);
pv.Gradient = function() {
  this.colors = [];
  this.$orientation = "vertical"
};
pv.Gradient.prototype.color = function(b, a) {
  this.colors.push({
    offset: b,
    color: a
  });
  return this
};
pv.Gradient.prototype.orientation = function(a) {
  this.$orientation = a;
  return this
};
pv.Gradient.prototype.create = function(k, a, f) {
  switch (this.$orientation) {
  case "vertical":
    a = 0;
    break;
  case "horizontal":
    f = 0;
    break
  }
  var j = k.createLinearGradient(0, 0, a, f);
  for (var b = 0; b < this.colors.length; b++) {
    var d = this.colors[b];
    j.addColorStop(d.offset, d.color)
  }
  return j
};
pv.Mark = function() {};
pv.Mark.toString = function() {
  return "mark"
};
pv.Mark.property = function(a) {
  return function(b) {
    if (arguments.length) {
      if (this.scene) {
        this.scene[this.index][a] = b
      } else {
        this["$" + a] = (b instanceof Function) ? b: function() {
          return b
        }
      }
      return this
    }
    return this.scene[this.index][a]
  }
};
pv.Mark.prototype.defineProperty = function(a) {
  if (!this.hasOwnProperty("properties")) {
    this.properties = (this.properties || []).concat()
  }
  this.properties.push(a);
  this[a] = pv.Mark.property(a)
};
pv.Mark.prototype.type = pv.Mark;
pv.Mark.prototype.proto = null;
pv.Mark.prototype.parent = null;
pv.Mark.prototype.childIndex = -1;
pv.Mark.prototype.index = -1;
pv.Mark.prototype.scene = null;
pv.Mark.prototype.root = null;
pv.Mark.prototype.defineProperty("data");
pv.Mark.prototype.defineProperty("visible");
pv.Mark.prototype.defineProperty("left");
pv.Mark.prototype.defineProperty("right");
pv.Mark.prototype.defineProperty("top");
pv.Mark.prototype.defineProperty("bottom");
pv.Mark.defaults = new pv.Mark().data([null]).visible(true);
pv.Mark.prototype.extend = function(a) {
  this.proto = a;
  return this
};
pv.Mark.prototype.add = function(a) {
  return this.parent.add(a).extend(this)
};
pv.Mark.Anchor = function() {
  pv.Mark.call(this)
};
pv.Mark.Anchor.prototype = pv.Mark.extend();
pv.Mark.Anchor.prototype.name = pv.Mark.property("name");
pv.Mark.prototype.anchor = function(d) {
  var a = this.type;
  while (!a.Anchor) {
    a = a.defaults.proto.type
  }
  var b = new a.Anchor().extend(this).name(d);
  b.parent = this.parent;
  b.type = this.type;
  return b
};
pv.Mark.prototype.anchorTarget = function() {
  var a = this;
  while (! (a instanceof pv.Mark.Anchor)) {
    a = a.proto
  }
  return a.proto
};
pv.Mark.prototype.first = function() {
  return this.scene[0]
};
pv.Mark.prototype.last = function() {
  return this.scene[this.scene.length - 1]
};
pv.Mark.prototype.sibling = function() {
  return (this.index == 0) ? null: this.scene[this.index - 1]
};
pv.Mark.prototype.cousin = function(a, b) {
  var d = a ? a.scene[this.parent.index] : (this.parent && this.parent.sibling());
  return (d && d.children) ? d.children[this.childIndex][(b == undefined) ? this.index: b] : null
};
pv.Mark.prototype.build = function(f) {
  if (!this.scene) {
    this.scene = [];
    if (!this.parent) {
      f = {};
      this.scene.data = []
    }
  }
  var g = this.get("data");
  var a = this.root.scene.data;
  a.unshift(null);
  this.index = -1;
  for (var b = 0, h; b < g.length; b++) {
    pv.Mark.prototype.index = ++this.index;
    a[0] = h = g[b];
    this.scene[this.index] = this.get("visible") ? this.buildInstance(f, h) : {
      data: h,
      visible: false
    }
  }
  a.shift();
  delete this.index;
  pv.Mark.prototype.index = -1;
  return this
};
pv.Mark.prototype.buildInstance = function(f, h) {
  var g = this.type.prototype;
  f = {
    data: h,
    parent: f,
    visible: true
  };
  for (var b = 0; b < g.properties.length; b++) {
    var a = g.properties[b];
    if (! (a in f)) {
      f[a] = this.get(a)
    }
  }
  this.buildImplied(f);
  return f
};
pv.Mark.prototype.buildImplied = function(o) {
  var f = this.type.prototype;
  var g = o.left;
  var a = o.right;
  var n = o.top;
  var j = o.bottom;
  var k = f.width ? o.width: 0;
  var i = f.height ? o.height: 0;
  var d = o.parent.width;
  if (k == null) {
    k = d - (a = a || 0) - (g = g || 0)
  } else {
    if (a == null) {
      a = d - k - (g = g || 0)
    } else {
      if (g == null) {
        g = d - k - (a = a || 0)
      }
    }
  }
  var m = o.parent.height;
  if (i == null) {
    i = m - (n = n || 0) - (j = j || 0)
  } else {
    if (j == null) {
      j = m - i - (n = n || 0)
    } else {
      if (n == null) {
        n = m - i - (j = j || 0)
      }
    }
  }
  o.left = g;
  o.right = a;
  o.top = n;
  o.bottom = j;
  if (f.width) {
    o.width = k
  }
  if (f.height) {
    o.height = i
  }
};
pv.Mark.prototype.get = function(a) {
  var b = this;
  while (!b["$" + a]) {
    b = b.proto;
    if (!b) {
      b = this.type.defaults;
      while (!b["$" + a]) {
        b = b.proto;
        if (!b) {
          return null
        }
      }
      break
    }
  }
  return b["$" + a].apply(this, this.root.scene.data)
};
pv.Mark.prototype.render = function(d) {
  for (var a = 0; a < this.scene.length; a++) {
    var b = this.scene[a];
    if (b.visible) {
      this.renderInstance(d, b)
    }
  }
};
pv.Mark.prototype.renderInstance = function(b, a) {};
pv.Mark.prototype.title = function(a) {
  this.parent.canvas().title = a;
  return this
};
pv.Mark.prototype.cursor = function(a) {
  this.parent.canvas().style.cursor = a;
  return this
};
pv.Mark.prototype.event = function(b, a) {
  this["on" + b] = a;
  this.root.$interactive = true;
  return this
};
pv.Mark.prototype.contains = function(a, d, b) {
  return false
};
pv.Area = function() {
  pv.Mark.call(this)
};
pv.Area.toString = function() {
  return "area"
};
pv.Area.prototype = pv.Mark.extend();
pv.Area.prototype.type = pv.Area;
pv.Area.prototype.defineProperty("width");
pv.Area.prototype.defineProperty("height");
pv.Area.prototype.defineProperty("lineWidth");
pv.Area.prototype.defineProperty("strokeStyle");
pv.Area.prototype.defineProperty("fillStyle");
pv.Area.defaults = new pv.Area().extend(pv.Mark.defaults).width(0).height(0).lineWidth(1.5).strokeStyle(null).fillStyle(pv.Colors.category20);
pv.Area.Anchor = function() {
  pv.Mark.Anchor.call(this)
};
pv.Area.Anchor.prototype = pv.Mark.Anchor.extend();
pv.Area.Anchor.prototype.type = pv.Area;
pv.Area.Anchor.prototype.$left = function(b) {
  var a = this.anchorTarget();
  switch (this.get("name")) {
  case "bottom":
  case "top":
  case "center":
    return a.left() + a.width() / 2;
  case "right":
    return a.left() + a.width()
  }
  return null
};
pv.Area.Anchor.prototype.$right = function(b) {
  var a = this.anchorTarget();
  switch (this.get("name")) {
  case "bottom":
  case "top":
  case "center":
    return a.right() + a.width() / 2;
  case "left":
    return a.right() + a.width()
  }
  return null
};
pv.Area.Anchor.prototype.$top = function(b) {
  var a = this.anchorTarget();
  switch (this.get("name")) {
  case "left":
  case "right":
  case "center":
    return a.top() + a.height() / 2;
  case "bottom":
    return a.top() + a.height()
  }
  return null
};
pv.Area.Anchor.prototype.$bottom = function(b) {
  var a = this.anchorTarget();
  switch (this.get("name")) {
  case "left":
  case "right":
  case "center":
    return a.bottom() + a.height() / 2;
  case "top":
    return a.bottom() + a.height()
  }
  return null
};
pv.Area.Anchor.prototype.$textAlign = function(a) {
  switch (this.get("name")) {
  case "left":
    return "left";
  case "bottom":
  case "top":
  case "center":
    return "center";
  case "right":
    return "right"
  }
  return null
};
pv.Area.Anchor.prototype.$textBaseline = function(a) {
  switch (this.get("name")) {
  case "right":
  case "left":
  case "center":
    return "middle";
  case "top":
    return "top";
  case "bottom":
    return "bottom"
  }
  return null
};
pv.Area.prototype.render = function(j) {
  j.save();
  var d = true;
  var h = [];
  for (var f = 0; f < this.scene.length; f++) {
    var m = this.scene[f];
    if (!m.visible) {
      continue
    }
    var b = m.left;
    var a = b + m.width;
    var l = m.top;
    var k = l + m.height;
    if (d) {
      d = false;
      j.beginPath();
      j.moveTo(b, l)
    } else {
      j.lineTo(b, l)
    }
    h.push({
      x: a,
      y: k
    })
  }
  h.reverse();
  for (var f = 0; f < h.length; f++) {
    j.lineTo(h[f].x, h[f].y)
  }
  j.closePath();
  if (m) {
    if (m.fillStyle) {
      j.fillStyle = m.fillStyle;
      j.fill()
    }
    if (m.strokeStyle) {
      j.lineWidth = m.lineWidth;
      j.strokeStyle = m.strokeStyle;
      j.stroke()
    }
  }
  j.restore()
};
pv.Bar = function() {
  pv.Mark.call(this)
};
pv.Bar.toString = function() {
  return "bar"
};
pv.Bar.prototype = pv.Mark.extend();
pv.Bar.prototype.type = pv.Bar;
pv.Bar.prototype.defineProperty("width");
pv.Bar.prototype.defineProperty("height");
pv.Bar.prototype.defineProperty("lineWidth");
pv.Bar.prototype.defineProperty("strokeStyle");
pv.Bar.prototype.defineProperty("fillStyle");
pv.Bar.defaults = new pv.Bar().extend(pv.Mark.defaults).lineWidth(1.5).strokeStyle(null).fillStyle(pv.Colors.category20);
pv.Bar.Anchor = function() {
  pv.Mark.Anchor.call(this)
};
pv.Bar.Anchor.prototype = pv.Mark.Anchor.extend();
pv.Bar.Anchor.prototype.type = pv.Bar;
pv.Bar.Anchor.prototype.$left = function(b) {
  var a = this.anchorTarget();
  switch (this.get("name")) {
  case "bottom":
  case "top":
  case "center":
    return a.left() + a.width() / 2;
  case "left":
    return a.left()
  }
  return null
};
pv.Bar.Anchor.prototype.$right = function(b) {
  var a = this.anchorTarget();
  switch (this.get("name")) {
  case "bottom":
  case "top":
  case "center":
    return a.right() + a.width() / 2;
  case "right":
    return a.right()
  }
  return null
};
pv.Bar.Anchor.prototype.$top = function(b) {
  var a = this.anchorTarget();
  switch (this.get("name")) {
  case "left":
  case "right":
  case "center":
    return a.top() + a.height() / 2;
  case "top":
    return a.top()
  }
  return null
};
pv.Bar.Anchor.prototype.$bottom = function(b) {
  var a = this.anchorTarget();
  switch (this.get("name")) {
  case "left":
  case "right":
  case "center":
    return a.bottom() + a.height() / 2;
  case "bottom":
    return a.bottom()
  }
  return null
};
pv.Bar.Anchor.prototype.$textAlign = function(b) {
  var a = this.anchorTarget();
  switch (this.get("name")) {
  case "left":
    return "left";
  case "bottom":
  case "top":
  case "center":
    return "center";
  case "right":
    return "right"
  }
  return null
};
pv.Bar.Anchor.prototype.$textBaseline = function(b) {
  var a = this.anchorTarget();
  switch (this.get("name")) {
  case "right":
  case "left":
  case "center":
    return "middle";
  case "top":
    return "top";
  case "bottom":
    return "bottom"
  }
  return null
};
pv.Bar.renderStyle = function(d, f, a, b) {
  return (d instanceof pv.Gradient) ? d.create(f, a, b) : d
};
pv.Bar.prototype.renderInstance = function(i, f) {
  var a = f.left,
  j = f.top,
  b = f.width,
  d = f.height;
  i.save();
  i.translate(a, j);
  if (f.fillStyle) {
    i.fillStyle = pv.Bar.renderStyle(f.fillStyle, i, b, d);
    i.fillRect(0, 0, b, d)
  }
  if (f.strokeStyle) {
    i.lineWidth = f.lineWidth;
    i.strokeStyle = pv.Bar.renderStyle(f.strokeStyle, i, b, d);
    i.strokeRect(0, 0, b, d)
  }
  i.restore()
};
pv.Bar.prototype.contains = function(a, f, b) {
  var d = b.strokeStyle ? b.lineWidth: 0;
  return ((b.left - d) <= a) && (a < (b.left + b.width + d)) && ((b.top - d) <= f) && (f < (b.top + b.height + d))
};
pv.Dot = function() {
  pv.Mark.call(this)
};
pv.Dot.toString = function() {
  return "dot"
};
pv.Dot.prototype = pv.Mark.extend();
pv.Dot.prototype.type = pv.Dot;
pv.Dot.prototype.defineProperty("size");
pv.Dot.prototype.defineProperty("shape");
pv.Dot.prototype.defineProperty("angle");
pv.Dot.prototype.defineProperty("lineWidth");
pv.Dot.prototype.defineProperty("strokeStyle");
pv.Dot.prototype.defineProperty("fillStyle");
pv.Dot.defaults = new pv.Dot().extend(pv.Mark.defaults).size(20).shape("circle").angle(0).lineWidth(1.5).strokeStyle(pv.Colors.category10).fillStyle(null);
pv.Dot.Anchor = function() {
  pv.Mark.Anchor.call(this)
};
pv.Dot.Anchor.prototype = pv.Mark.Anchor.extend();
pv.Dot.Anchor.prototype.type = pv.Dot;
pv.Dot.Anchor.prototype.$left = function(b) {
  var a = this.anchorTarget();
  switch (this.get("name")) {
  case "bottom":
  case "top":
  case "center":
    return a.left();
  case "left":
    return a.left() - a.radius()
  }
  return null
};
pv.Dot.Anchor.prototype.$right = function(b) {
  var a = this.anchorTarget();
  switch (this.get("name")) {
  case "bottom":
  case "top":
  case "center":
    return a.right();
  case "right":
    return a.right() - a.radius()
  }
  return null
};
pv.Dot.Anchor.prototype.$top = function(b) {
  var a = this.anchorTarget();
  switch (this.get("name")) {
  case "left":
  case "right":
  case "center":
    return a.top();
  case "top":
    return a.top() - a.radius()
  }
  return null
};
pv.Dot.Anchor.prototype.$bottom = function(b) {
  var a = this.anchorTarget();
  switch (this.get("name")) {
  case "left":
  case "right":
  case "center":
    return a.bottom();
  case "bottom":
    return a.bottom() - a.radius()
  }
  return null
};
pv.Dot.Anchor.prototype.$textAlign = function(a) {
  switch (this.get("name")) {
  case "left":
    return "right";
  case "bottom":
  case "top":
  case "center":
    return "center";
  case "right":
    return "left"
  }
  return null
};
pv.Dot.Anchor.prototype.$textBaseline = function(a) {
  switch (this.get("name")) {
  case "right":
  case "left":
  case "center":
    return "middle";
  case "top":
    return "bottom";
  case "bottom":
    return "top"
  }
  return null
};
pv.Dot.prototype.radius = function() {
  return Math.sqrt(this.size())
};
pv.Dot.prototype.renderInstance = function(b, a) {
  function d(i, j) {
    b.beginPath();
    var f = Math.sqrt(j);
    switch (i) {
    case "cross":
      b.moveTo( - f, -f);
      b.lineTo(f, f);
      b.moveTo(f, -f);
      b.lineTo( - f, f);
      break;
    case "triangle":
      var k = f;
      var g = f * 2 / Math.sqrt(3);
      b.moveTo(0, k);
      b.lineTo(g, -k);
      b.lineTo( - g, -k);
      b.closePath();
      break;
    case "diamond":
      f *= Math.sqrt(2);
      b.moveTo(0, -f);
      b.lineTo(f, 0);
      b.lineTo(0, f);
      b.lineTo( - f, 0);
      b.closePath();
      break;
    case "square":
      b.moveTo( - f, -f);
      b.lineTo(f, -f);
      b.lineTo(f, f);
      b.lineTo( - f, f);
      b.closePath();
      break;
    case "tick":
      b.moveTo(0, 0);
      b.lineTo(0, -j);
      break;
    default:
      b.arc(0, 0, f, 0, 2 * Math.PI, false);
      break
    }
  }
  b.save();
  b.translate(a.left, a.top);
  b.rotate(a.angle);
  d(a.shape, a.size);
  if (a.fillStyle) {
    b.fillStyle = a.fillStyle;
    b.fill()
  }
  if (a.strokeStyle) {
    b.lineWidth = a.lineWidth;
    b.strokeStyle = a.strokeStyle;
    b.stroke()
  }
  b.restore()
};
pv.Label = function() {
  pv.Mark.call(this)
};
pv.Label.toString = function() {
  return "label"
};
pv.Label.prototype = pv.Mark.extend();
pv.Label.prototype.type = pv.Label;
pv.Label.prototype.defineProperty("text");
pv.Label.prototype.defineProperty("font");
pv.Label.prototype.defineProperty("textAngle");
pv.Label.prototype.defineProperty("textStyle");
pv.Label.prototype.defineProperty("textAlign");
pv.Label.prototype.defineProperty("textBaseline");
pv.Label.prototype.defineProperty("textMargin");
pv.Label.defaults = new pv.Label().extend(pv.Mark.defaults).text(pv.identity).font("10px Sans-Serif").textAngle(0).textStyle("black").textAlign("left").textBaseline("bottom").textMargin(3);
pv.Label.prototype.renderInstance = function(h, f) {
  h.save();
  h.font = f.font;
  var b = 0;
  switch (f.textAlign) {
  case "center":
    b += -h.measureText(f.text).width / 2;
    break;
  case "right":
    b += -h.measureText(f.text).width - f.textMargin;
    break;
  case "left":
    b += f.textMargin;
    break
  }
  var a = 0;
  function d(g) {
    return Number(/[0-9]+/.exec(g)[0]) * 0.68
  }
  switch (f.textBaseline) {
  case "middle":
    a += d(f.font) / 2;
    break;
  case "top":
    a += d(f.font) + f.textMargin;
    break;
  case "bottom":
    a -= f.textMargin;
    break
  }
  h.translate(f.left, f.top);
  h.rotate(f.textAngle);
  h.fillStyle = f.textStyle;
  h.fillText(f.text, b, a);
  h.restore()
};
pv.Line = function() {
  pv.Mark.call(this)
};
pv.Line.toString = function() {
  return "line"
};
pv.Line.prototype = pv.Mark.extend();
pv.Line.prototype.type = pv.Line;
pv.Line.prototype.defineProperty("lineWidth");
pv.Line.prototype.defineProperty("strokeStyle");
pv.Line.prototype.defineProperty("fillStyle");
pv.Line.defaults = new pv.Line().extend(pv.Mark.defaults).lineWidth(1.5).strokeStyle(pv.Colors.category10);
pv.Line.prototype.render = function(f) {
  f.save();
  var a = true;
  for (var b = 0; b < this.scene.length; b++) {
    var d = this.scene[b];
    if (!d.visible) {
      continue
    }
    if (a) {
      a = false;
      f.beginPath();
      f.moveTo(d.left, d.top)
    } else {
      f.lineTo(d.left, d.top)
    }
  }
  if (d) {
    if (d.fillStyle) {
      f.fillStyle = d.fillStyle;
      f.fill()
    }
    if (d.strokeStyle) {
      f.lineWidth = d.lineWidth;
      f.strokeStyle = d.strokeStyle;
      f.stroke()
    }
  }
  f.restore()
};
pv.Rule = function() {
  pv.Mark.call(this)
};
pv.Rule.toString = function() {
  return "rule"
};
pv.Rule.prototype = pv.Mark.extend();
pv.Rule.prototype.type = pv.Rule;
pv.Rule.prototype.defineProperty("lineWidth");
pv.Rule.prototype.defineProperty("strokeStyle");
pv.Rule.defaults = new pv.Rule().extend(pv.Mark.defaults).lineWidth(1).strokeStyle("black");
pv.Rule.Anchor = function() {
  pv.Mark.Anchor.call(this)
};
pv.Rule.Anchor.prototype = pv.Mark.Anchor.extend();
pv.Rule.Anchor.prototype.type = pv.Rule;
pv.Rule.Anchor.prototype.$left = function(b) {
  var a = this.anchorTarget();
  switch (this.get("name")) {
  case "bottom":
  case "top":
  case "left":
    return a.left()
  }
  return null
};
pv.Rule.Anchor.prototype.$right = function(b) {
  var a = this.anchorTarget();
  switch (this.get("name")) {
  case "right":
    return a.right()
  }
  return null
};
pv.Rule.Anchor.prototype.$top = function(b) {
  var a = this.anchorTarget();
  switch (this.get("name")) {
  case "left":
  case "right":
  case "top":
    return a.top()
  }
  return null
};
pv.Rule.Anchor.prototype.$bottom = function(b) {
  var a = this.anchorTarget();
  switch (this.get("name")) {
  case "bottom":
    return a.bottom()
  }
  return null
};
pv.Rule.Anchor.prototype.$textAlign = function(a) {
  switch (this.get("name")) {
  case "top":
  case "bottom":
    return "center";
  case "right":
    return "left";
  case "left":
    return "right"
  }
  return null
};
pv.Rule.Anchor.prototype.$textBaseline = function(a) {
  switch (this.get("name")) {
  case "right":
  case "left":
    return "middle";
  case "top":
    return "bottom";
  case "bottom":
    return "top"
  }
  return null
};
pv.Rule.prototype.buildImplied = function(g) {
  g.width = g.height = 0;
  var d = g.left;
  var h = g.right;
  var f = g.top;
  var a = g.bottom;
  if (((d == null) && (h == null)) || (h != null)) {
    g.width = g.parent.width - (d = d || 0) - (h = h || 0)
  } else {
    if (((f == null) && (a == null)) || (a != null)) {
      g.height = g.parent.height - (f = f || 0) - (a = a || 0)
    }
  }
  g.left = d;
  g.right = h;
  g.top = f;
  g.bottom = a;
  pv.Mark.prototype.buildImplied.call(this, g)
};
pv.Rule.prototype.renderInstance = function(b, a) {
  if (a.strokeStyle) {
    b.save();
    b.lineWidth = a.lineWidth;
    b.strokeStyle = a.strokeStyle;
    b.beginPath();
    b.moveTo(a.left, a.top);
    b.lineTo(a.left + a.width, a.top + a.height);
    b.stroke();
    b.restore()
  }
};
pv.Panel = function() {
  pv.Bar.call(this);
  this.children = [];
  this.root = this;
  this.$dom = pv.Panel.$dom
};
pv.Panel.toString = function() {
  return "panel"
};
pv.Panel.prototype = pv.Bar.extend();
pv.Panel.prototype.type = pv.Panel;
pv.Panel.prototype.defineProperty("canvas");
pv.Panel.defaults = new pv.Panel().extend(pv.Bar.defaults).top(0).left(0).bottom(0).right(0).fillStyle(null);
pv.Panel.prototype.add = function(a) {
  var b = new a();
  b.parent = this;
  b.root = this.root;
  b.childIndex = this.children.length;
  this.children.push(b);
  return b
};
pv.Panel.prototype.clear = function() {
  for (var a = 0; a < this.scene.length; a++) {
    var b = this.scene[a].canvas;
    if (!b.$clear) {
      b.$clear = true;
      b.getContext("2d").clearRect(0, 0, b.width, b.height)
    }
  }
  for (var a = 0; a < this.scene.length; a++) {
    delete this.scene[a].canvas.$clear
  }
};
pv.Panel.prototype.createCanvas = function(a, b) {
  function d(g) {
    while (g.lastChild && g.lastChild.tagName) {
      g = g.lastChild
    }
    return (g == document.body) ? g: g.parentNode
  }
  if (!this.$canvases) {
    this.$canvases = []
  }
  var f = this.$canvases[this.index];
  if (!f) {
    this.$canvases[this.index] = f = document.createElement("canvas");
    this.$dom ? this.$dom.parentNode.insertBefore(f, this.$dom) : d(document.body).appendChild(f)
  }
  f.width = a;
  f.height = b;
  return f
};
pv.Panel.prototype.buildInstance = function(b, f) {
  b = pv.Bar.prototype.buildInstance.call(this, b, f);
  this.scene[this.index] = b;
  b.children = [];
  for (var a = 0; a < this.children.length; a++) {
    b.children.push(this.children[a].build(b).scene)
  }
  for (var a = 0; a < this.children.length; a++) {
    delete this.children[a].scene
  }
  return b
};
pv.Panel.prototype.buildImplied = function(a) {
  var b = a.canvas;
  if (b) {
    if (typeof b == "string") {
      a.canvas = b = document.getElementById(b)
    }
    a.width = b.width - a.left - a.right;
    a.height = b.height - a.top - a.bottom
  } else {
    if (a.parent.canvas) {
      a.canvas = a.parent.canvas
    } else {
      a.canvas = this.createCanvas(a.width + a.left + a.right, a.height + a.top + a.bottom)
    }
  }
  pv.Bar.prototype.buildImplied.call(this, a)
};
pv.Panel.prototype.render = function(a) {
  if (!this.parent) {
    delete this.scene;
    this.build();
    this.listen()
  }
  this.update(a)
};
pv.Panel.prototype.update = function(h) {
  if (!this.parent) {
    this.clear()
  }
  for (var b = 0; b < this.scene.length; b++) {
    var f = this.scene[b],
    d = h || f.canvas.getContext("2d");
    this.renderInstance(d, f);
    d.save();
    d.translate(f.left, f.top);
    for (var a = 0; a < this.children.length; a++) {
      var k = this.children[a];
      k.scene = f.children[a];
      k.render(d);
      delete k.scene
    }
    d.restore()
  }
};
pv.Panel.prototype.listen = function() {
  if (!this.$interactive) {
    return
  }
  var d = this;
  function a(g) {
    if (d.dispatch(g)) {
      g.preventDefault()
    }
  }
  for (var b = 0; b < this.scene.length; b++) {
    var f = this.scene[b].canvas;
    if (!f.$listen) {
      f.$listen = true;
      f.addEventListener("click", a, false);
      f.addEventListener("mousemove", a, false);
      f.addEventListener("mouseout", a, false);
      f.addEventListener("mousedown", a, false)
    }
  }
  if (!self.$listen) {
    self.$listen = true;
    self.addEventListener("mouseup", a, false)
  }
};
pv.Panel.prototype.dispatch = function(g) {
  var f = false;
  function b(i) {
    var n = {
      left: pv.css(i, "padding-left") + pv.css(i, "border-left-width"),
      top: pv.css(i, "padding-top") + pv.css(i, "border-top-width"),
    };
    while (i.offsetParent) {
      n.left += i.offsetLeft;
      n.top += i.offsetTop;
      i = i.offsetParent
    }
    return n
  }
  function l(n, v, t) {
    if (this.contains(n, v, t)) {
      if (!t.$mouseover) {
        if ((g.type == "mousemove") && this.onmouseover) {
          t.$mouseover = true;
          this.onmouseover(t.data);
          f = true
        }
      }
      if ((g.type != "mouseup") && this["on" + g.type]) {
        if (g.type == "mousedown") {
          t.$mousedown = true
        }
        this["on" + g.type](t.data);
        f = true
      }
    } else {
      if (t.$mouseover) {
        if ((g.type == "mousemove") || (g.type == "mouseout")) {
          this.onmouseout(t.data);
          f = true;
          delete t.$mouseover
        }
      }
    }
    if (t.$mousedown) {
      if (g.type == "mouseup") {
        this.onmouseup(t.data);
        f = true;
        delete t.$mousedown
      }
    }
    if (t.children) {
      n -= t.left;
      v -= t.top;
      for (var p = 0; p < t.children.length; p++) {
        var u = this.children[p],
        q = t.children[p];
        u.scene = q;
        for (var o = 0; o < q.length; o++) {
          u.index = o;
          l.call(u, n, v, q[o]);
          delete u.index
        }
        delete u.scene
      }
    }
  }
  var j = g.pageX,
  h = g.pageY;
  for (var d = 0; d < this.scene.length; d++) {
    var m = this.scene[d],
    k = m.canvas,
    a = k.$offset;
    if (!a) {
      k.$offset = a = b(k)
    }
    this.index = d;
    l.call(this, j - a.left, h - a.top, m);
    delete this.index
  }
  for (var d = 0; d < this.scene.length; d++) {
    delete this.scene[d].canvas.$offset
  }
  this.update();
  return f
};
pv.Image = function() {
  pv.Bar.call(this)
};
pv.Image.toString = function() {
  return "image"
};
pv.Image.prototype = pv.Bar.extend();
pv.Image.prototype.type = pv.Image;
pv.Image.prototype.defineProperty("image");
pv.Image.prototype.defineProperty("imageWidth");
pv.Image.prototype.defineProperty("imageHeight");
pv.Image.defaults = new pv.Image().extend(pv.Bar.defaults).fillStyle(null);
pv.Image.prototype.renderInstance = function(j, i) {
  var a = i.left,
  k = i.top,
  b = i.width,
  f = i.height;
  j.save();
  j.translate(a, k);
  if (i.fillStyle) {
    j.fillStyle = pv.Bar.renderStyle(i.fillStyle, j, b, f);
    j.fillRect(0, 0, b, f)
  }
  try {
    j.drawImage(i.image, 0, 0, b, f)
  } catch(d) {}
  if (i.strokeStyle) {
    j.lineWidth = i.lineWidth;
    j.strokeStyle = pv.Bar.renderStyle(i.strokeStyle, j, b, f);
    j.strokeRect(0, 0, b, f)
  }
  j.restore()
};
pv.Image.prototype.buildImplied = function(u) {
  pv.Bar.prototype.buildImplied.call(this, u);
  if (typeof u.image == "string") {
    if (!pv.Image.cache) {
      pv.Image.cache = {}
    }
    var f = pv.Image.cache[u.image];
    if (!f) {
      f = new Image(),
      r = this.root;
      f.src = u.image;
      if (u.imageWidth) {
        f.width = u.imageWidth
      }
      if (u.imageHeight) {
        f.height = u.imageHeight
      }
      f.onload = function() {
        r.update()
      };
      pv.Image.cache[u.image] = f
    }
    u.image = f
  } else {
    if (u.image instanceof Function) {
      var m = document.createElement("canvas");
      var t = u.imageWidth || u.width,
      j = u.imageHeight || u.height;
      m.width = t;
      m.height = j;
      var k = m.getContext("2d");
      var b = k.getImageData(0, 0, t, j);
      var o = this.root.scene.data;
      o.unshift(null, null);
      for (var q = 0, a = 0; q < t; q++) {
        o[0] = q;
        for (var n = 0; n < j; n++) {
          o[1] = n;
          var d = u.image.apply(this, o);
          for (var l = 0; l < 4; l++, a++) {
            b.data[a] = d[l]
          }
        }
      }
      k.putImageData(b, 0, 0);
      o.splice(0, 2);
      u.image = m
    }
  }
};
pv.Image.prototype.rgba = function(j, i, d, h) {
  if (! (j instanceof Function)) {
    return this.fillStyle("rgb(" + j + "," + i + "," + d + "," + h + ")")
  }
  return this.image(function() {
    return j
  })
};
pv.Image.prototype.rgb = function(h, d, a) {
  if (! (h instanceof Function)) {
    return this.fillStyle("rgb(" + h + "," + d + "," + a + ")")
  }
  return this.image(function() {
    return function() {
      var b = h.apply(this, arguments);
      b[3] = 255;
      return b
    }
  })
};
pv.Image.prototype.monochrome = function(a) {
  if (! (a instanceof Function)) {
    return this.fillStyle("rgb(" + a + "," + a + "," + a + ")")
  }
  return this.image(function() {
    return function() {
      var b = a.apply(this, arguments);
      return [b, b, b, 255]
    }
  })
};
pv.Wedge = function() {
  pv.Mark.call(this)
};
pv.Wedge.toString = function() {
  return "wedge"
};
pv.Wedge.prototype = pv.Mark.extend();
pv.Wedge.prototype.type = pv.Wedge;
pv.Wedge.prototype.defineProperty("startAngle");
pv.Wedge.prototype.defineProperty("endAngle");
pv.Wedge.prototype.defineProperty("angle");
pv.Wedge.prototype.defineProperty("innerRadius");
pv.Wedge.prototype.defineProperty("outerRadius");
pv.Wedge.prototype.defineProperty("lineWidth");
pv.Wedge.prototype.defineProperty("strokeStyle");
pv.Wedge.prototype.defineProperty("fillStyle");
pv.Wedge.defaults = new pv.Wedge().extend(pv.Mark.defaults).startAngle(function() {
  var a = this.sibling();
  return a ? a.endAngle: -Math.PI / 2
}).innerRadius(0).lineWidth(1.5).strokeStyle(null).fillStyle(pv.Colors.category20.unique);
pv.Wedge.prototype.midRadius = function() {
  return (this.innerRadius() + this.outerRadius()) / 2
};
pv.Wedge.prototype.midAngle = function() {
  return (this.startAngle() + this.endAngle()) / 2
};
pv.Wedge.Anchor = function() {
  pv.Mark.Anchor.call(this)
};
pv.Wedge.Anchor.prototype = pv.Mark.Anchor.extend();
pv.Wedge.Anchor.prototype.type = pv.Wedge;
pv.Wedge.Anchor.prototype.$left = function() {
  var a = this.anchorTarget();
  switch (this.get("name")) {
  case "outer":
    return a.left() + a.outerRadius() * Math.cos(a.midAngle());
  case "inner":
    return a.left() + a.innerRadius() * Math.cos(a.midAngle());
  case "start":
    return a.left() + a.midRadius() * Math.cos(a.startAngle());
  case "center":
    return a.left() + a.midRadius() * Math.cos(a.midAngle());
  case "end":
    return a.left() + a.midRadius() * Math.cos(a.endAngle())
  }
  return null
};
pv.Wedge.Anchor.prototype.$right = function() {
  var a = this.anchorTarget();
  switch (this.get("name")) {
  case "outer":
    return a.right() + a.outerRadius() * Math.cos(a.midAngle());
  case "inner":
    return a.right() + a.innerRadius() * Math.cos(a.midAngle());
  case "start":
    return a.right() + a.midRadius() * Math.cos(a.startAngle());
  case "center":
    return a.right() + a.midRadius() * Math.cos(a.midAngle());
  case "end":
    return a.right() + a.midRadius() * Math.cos(a.endAngle())
  }
  return null
};
pv.Wedge.Anchor.prototype.$top = function() {
  var a = this.anchorTarget();
  switch (this.get("name")) {
  case "outer":
    return a.top() + a.outerRadius() * Math.sin(a.midAngle());
  case "inner":
    return a.top() + a.innerRadius() * Math.sin(a.midAngle());
  case "start":
    return a.top() + a.midRadius() * Math.sin(a.startAngle());
  case "center":
    return a.top() + a.midRadius() * Math.sin(a.midAngle());
  case "end":
    return a.top() + a.midRadius() * Math.sin(a.endAngle())
  }
  return null
};
pv.Wedge.Anchor.prototype.$bottom = function() {
  var a = this.anchorTarget();
  switch (this.get("name")) {
  case "outer":
    return a.bottom() + a.outerRadius() * Math.sin(a.midAngle());
  case "inner":
    return a.bottom() + a.innerRadius() * Math.sin(a.midAngle());
  case "start":
    return a.bottom() + a.midRadius() * Math.sin(a.startAngle());
  case "center":
    return a.bottom() + a.midRadius() * Math.sin(a.midAngle());
  case "end":
    return a.bottom() + a.midRadius() * Math.sin(a.endAngle())
  }
  return null
};
pv.Wedge.Anchor.prototype.$textAlign = function() {
  var a = this.anchorTarget();
  switch (this.get("name")) {
  case "outer":
    return pv.Wedge.upright(a.midAngle()) ? "right": "left";
  case "inner":
    return pv.Wedge.upright(a.midAngle()) ? "left": "right";
  default:
    return "center"
  }
};
pv.Wedge.Anchor.prototype.$textBaseline = function() {
  var a = this.anchorTarget();
  switch (this.get("name")) {
  case "start":
    return pv.Wedge.upright(a.startAngle()) ? "top": "bottom";
  case "end":
    return pv.Wedge.upright(a.endAngle()) ? "bottom": "top";
  default:
    return "middle"
  }
};
pv.Wedge.Anchor.prototype.$textAngle = function() {
  var d = this.anchorTarget();
  var b = 0;
  switch (this.get("name")) {
  case "center":
  case "inner":
  case "outer":
    b = d.midAngle();
    break;
  case "start":
    b = d.startAngle();
    break;
  case "end":
    b = d.endAngle();
    break
  }
  return pv.Wedge.upright(b) ? b: (b + Math.PI)
};
pv.Wedge.upright = function(a) {
  a = a % (2 * Math.PI);
  a = (a < 0) ? (2 * Math.PI + a) : a;
  return (a < Math.PI / 2) || (a > 3 * Math.PI / 2)
};
pv.Wedge.prototype.buildImplied = function(a) {
  pv.Mark.prototype.buildImplied.call(this, a);
  if (a.endAngle == null) {
    a.endAngle = a.startAngle + a.angle
  }
};
pv.Wedge.prototype.renderInstance = function(b, a) {
  function d(h, f, i, g) {
    if ((i + g) == 0) {
      return
    }
    b.beginPath();
    if (i == 0) {
      b.moveTo(0, 0);
      b.arc(0, 0, g, h, f, false)
    } else {
      if (i == g) {
        b.arc(0, 0, i, h, f, false)
      } else {
        b.arc(0, 0, i, h, f, false);
        b.arc(0, 0, g, f, h, true)
      }
    }
    if (h != f) {
      b.closePath()
    }
  }
  b.save();
  b.translate(a.left, a.top);
  d(a.startAngle, a.endAngle, a.innerRadius, a.outerRadius);
  if (a.fillStyle) {
    b.fillStyle = a.fillStyle;
    b.fill()
  }
  if (a.strokeStyle) {
    b.lineWidth = a.lineWidth;
    b.strokeStyle = a.strokeStyle;
    b.stroke()
  }
  b.restore()
};