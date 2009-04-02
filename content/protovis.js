var undefined;
Function.prototype.extend = function() {
  function f() {}
  f.prototype = this.prototype;
  return new f();
};
Array.prototype.dict = function(f, o) {
  var m = {};
  for (var i = 0; i < this.length; i++) {
    if (i in this) {
      var k = this[i];
      m[k] = f.call(o, k, i, this);
    }
  }
  return m;
};

if (!Array.prototype.reduce) {
  Array.prototype.reduce = function(f, v) {
    var len = this.length;
    if (!len && (arguments.length == 1)) {
      throw new Error();
    }

    var i = 0;
    if (arguments.length < 2) {
      while (true) {
        if (i in this) {
          v = this[i++];
          break;
        }
        if (++i >= len) {
          throw new Error();
        }
      }
    }

    for (; i < len; i++) {
      if (i in this) {
        v = f.call(null, v, this[i], i, this);
      }
    }
    return v;
  };
}
Date.__parse__ = Date.parse;

Date.parse = function(s, format) {
  if (arguments.length == 1) {
    return Date.__parse__(s);
  }

  var d = new Date(1970, 1, 1); // local time

  var fields = [function() {}];
  format = format.replace(/[\\\^\$\*\+\?\[\]\(\)\.\{\}]/g, "\\$&");
  format = format.replace(/%[a-zA-Z0-9]/g, function(s) {
      switch (s) {
        case '%S': {
          fields.push(function(x) { d.setSeconds(x); });
          return "([0-9]+)";
        }
        case '%M': {
          fields.push(function(x) { d.setMinutes(x); });
          return "([0-9]+)";
        }
        case '%H': {
          fields.push(function(x) { d.setHours(x); });
          return "([0-9]+)";
        }
        case '%d': {
          fields.push(function(x) { d.setDate(x); });
          return "([0-9]+)";
        }
        case '%m': {
          fields.push(function(x) { d.setMonth(x - 1); });
          return "([0-9]+)";
        }
        case '%Y': {
          fields.push(function(x) { d.setYear(x); });
          return "([0-9]+)";
        }
        case '%%': {
          fields.push(function() {});
          return "%";
        }
        case '%y': {
          fields.push(function(x) {
              x = Number(x);
              d.setYear(x + (((0 <= x) && (x < 69)) ? 2000
                  : (((x >= 69) && (x < 100) ? 1900 : 0))));
            });
          return "([0-9]+)";
        }
      }
      return s;
    });

  var match = s.match(format);
  if (match) {
    match.forEach(function(m, i) { fields[i](m); });
  }

  return d;
};

if (Date.prototype.toLocaleFormat) {
  Date.prototype.format = Date.prototype.toLocaleFormat;
} else {
  Date.prototype.format = function(format) {
    var d = this;
    return format.replace(/%[a-zA-Z0-9]/g, function(s) {
        switch (s) {
          case '%a': return [
              "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
            ][d.getDay()];
        case '%b': return [
              "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul",
              "Aug", "Sep", "Oct", "Nov", "Dec"
            ][d.getMonth()];
          case '%S': return d.getSeconds();
          case '%M': return d.getMinutes();
          case '%H': return d.getHours();
          case '%d': return d.getDate();
          case '%m': return d.getMonth() + 1;
          case '%Y': return d.getYear();
          case '%%': return "%";
          case '%y': return d.getYear() % 100;
        }
        return s;
      });
    };
}
if (typeof CanvasRenderingContext2D == "undefined") {
  var CanvasRenderingContext2D = document
      .createElement("canvas").getContext("2d").constructor;
}

var c = CanvasRenderingContext2D.prototype;
if (c.mozDrawText) {
  if (!c.measureText) {
    c.measureText = function(s) {
      this.mozTextStyle = this.font;
      return { width: this.mozMeasureText(s) };
    };
  }
  if (!c.fillText) {
    c.fillText = function(s, x, y) {
      this.mozTextStyle = this.font;
      this.save();
      this.translate(x, y);
      this.mozDrawText(s);
      this.restore();
    };
  }
} else {
  if (!c.measureText) {
    c.measureText = function() { return { width: -1 }; };
  }
  if (!c.fillText) {
    c.fillText = function() {};
  }
}
window.addEventListener("load", function() {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].type == "text/javascript+protovis") {
        try {
          pv.Panel.$dom = scripts[i];
          eval(pv.parse(scripts[i].textContent));
        } catch (ignored) {}
        delete pv.Panel.$dom;
      }
    }
  }, false);
var pv = {};

/* Function expression support. */
try {
  eval("pv.parse = function(x) x;"); // native support
} catch (e) {
  pv.parse = function(js) { // hacky regex support
    var re = new RegExp("function([^)]*)", "g"), m, i = 0;
    var s = "";
    while (m = re.exec(js)) {
      var j = m.index + m[0].length;
      while (js[++j] == ' ');
      if (js[j--] != '{') {
        s += js.substring(i, j) + "{return ";
        i = j;
        for (var p = 0; p >= 0 && j < js.length; j++) {
          switch (js[j]) {
            case '[': case '(': p++; break;
            case ']': case ')': p--; break;
            case ';':
            case ',': if (p == 0) p--; break;
          }
        }
        s += pv.parse(js.substring(i, --j)) + ";}";
        i = j;
      }
      re.lastIndex = j;
    }
    s += js.substring(i);
    return s;
  };
}

pv.identity = function(x) { return x; };

pv.range = function(start, end, step) {
  if (arguments.length == 1) {
    end = start;
    start = 0;
  }
  if (step == undefined) {
    step = 1;
  }
  var array = []
  while (start < end) {
    array.push(start);
    start += step;
  }
  return array;
};

pv.cross = function(a, b) {
  var array = [];
  for (var i = 0, n = a.length, m = b.length; i < n; i++) {
    for (var j = 0, x = a[i]; j < m; j++) {
      array.push([x, b[j]]);
    }
  }
  return array;
};

pv.nest = function(array) {
  return new pv.Nest(array);
};

pv.blend = function(arrays) {
  return Array.prototype.concat.apply([], arrays);
};

pv.keys = function(map) {
  var array = [];
  for (var key in map) {
    array.push(key);
  }
  return array;
};

pv.entries = function(map) {
  var array = [];
  for (var key in map) {
    array.push({ key: key, value: map[key] });
  }
  return array;
};

pv.values = function(map) {
  var array = [];
  for (var key in map) {
    array.push(map[key]);
  }
  return array;
};

pv.normalize = function(array, f) {
  if (!f) {
    f = pv.identity;
  }
  var sum = array.reduce(function(p, d) { return p + f(d); }, 0);
  return array.map(function(d) { return f(d) / sum; });
};

pv.count = function(array) {
  return array.length;
};

pv.sum = function(array, f) {
  if (!f) {
    f = pv.identity;
  }
  return array.reduce(function(p, d) { return p + f(d); }, 0);
};

pv.max = function(array, f) {
  if (!f) {
    f = pv.identity;
  }
  return array.reduce(function(p, d) { return Math.max(p, f(d)); }, -Infinity);
};

pv.max.index = function(array, f) {
  if (!f) {
    f = pv.identity;
  }
  var maxi = -1, maxx = -Infinity;
  for (var i = 0; i < array.length; i++) {
    var x = f(array[i]);
    if (x > maxx) {
      maxx = x;
      maxi = i;
    }
  }
  return maxi;
}

pv.min = function(array, f) {
  if (!f) {
    f = pv.identity;
  }
  return array.reduce(function(p, d) { return Math.min(p, f(d)); }, Infinity);
};

pv.min.index = function(array, f) {
  if (!f) {
    f = pv.identity;
  }
  var mini = -1, minx = Infinity;
  for (var i = 0; i < array.length; i++) {
    var x = f(array[i]);
    if (x < minx) {
      minx = x;
      mini = i;
    }
  }
  return mini;
}

pv.mean = function(array, f) {
  return pv.sum(array, f) / array.length;
};

pv.median = function(array, f) {
  if (!f) {
    f = pv.identity;
  }
  array = array.map(f).sort(function(a, b) { return a - b; });
  if (array.length % 2) {
    return array[Math.floor(array.length / 2)];
  }
  var i = array.length / 2;
  return (array[i - 1] + array[i]) / 2;
};

pv.permute = function(array, permutation, f) {
  if (!f) {
    f = pv.identity;
  }
  var p = new Array(array.length);
  permutation.forEach(function(j, i) { p[i] = f(array[j]); });
  return p;
};

pv.numerate = function(array, f) {
  if (!f) {
    f = pv.identity;
  }
  var map = {};
  array.forEach(function(x, i) { map[f(x)] = i; });
  return map;
};

pv.reverseOrder = function(b, a) {
  return (a < b) ? -1 : ((a > b) ? 1 : 0);
};

pv.naturalOrder = function(a, b) {
  return (a < b) ? -1 : ((a > b) ? 1 : 0);
};

pv.gradient = function() {
  if (arguments.length < 2) {
    return arguments[0];
  }
  var g = new pv.Gradient();
  for (var i = 0, n = arguments.length - 1; i <= n; i++) {
    g.color(i / n, arguments[i]);
  }
  return g;
};

pv.css = function(e, p) {
  return parseFloat(self.getComputedStyle(e, null).getPropertyValue(p));
};
pv.Nest = function(array) {
  this.array = array;
  this.keys = [];
};

pv.Nest.prototype.key = function(key) {
  this.keys.push(key);
  return this;
};

pv.Nest.prototype.sortKeys = function(order) {
  this.keys[this.keys.length - 1].order = order || pv.naturalOrder;
  return this;
};

pv.Nest.prototype.sortValues = function(order) {
  this.order = order || pv.naturalOrder;
  return this;
};

pv.Nest.prototype.rollup = function(f) {
  var map = this.map();

  function rollup(map) {
    for (var key in map) {
      var e = map[key];
      if (e instanceof Array) {
        map[key] = f(e);
      } else {
        rollup(e);
      }
    }
  }

  rollup(map);
  return map;
};

pv.Nest.prototype.entries = function() {

  function entries(map) {
    var array = [];
    for (var k in map) {
      var v = map[k];
      array.push({ key: k, values: (v instanceof Array) ? v : entries(v) });
    };
    return array;
  }

  function sort(array, i) {
    var o = this.keys[i].order;
    if (o) {
      array.sort(function(a, b) { return o(a.key, b.key); });
    }
    if (++i < this.keys.length) {
      for (var j = 0; j < array.length; j++) {
        sort.call(this, array[j].values, i);
      }
    }
    return array;
  }

  return sort.call(this, entries(this.map()), 0);
};

pv.Nest.prototype.map = function() {
  if (!this.keys.length) {
    return this.array;
  }

  var map = {}, values = [];
  for (var i, j = 0; j < this.array.length; j++) {
    var x = this.array[j];
    var m = map;
    for (i = 0; i < this.keys.length - 1; i++) {
      var k = this.keys[i](x);
      if (!m[k]) {
        m[k] = {};
      }
      m = m[k];
    }
    k = this.keys[i](x);
    if (!m[k]) {
      var a = [];
      values.push(a);
      m[k] = a;
    }
    m[k].push(x);
  }

  if (this.order) {
    for (var i = 0; i < values.length; i++) {
      values[i].sort(this.order);
    }
  }

  return map;
};
pv.Scales = {};
pv.Scales.epsilon = 1e-30;
pv.Scales.defaultBase = 10;
pv.Scales.defaultNice = false;

pv.Scales.step = function(min, max, base) {
  if (!base) base = pv.Scales.defaultBase;
  var exp = Math.round(Math.log(max-min)/Math.log(base)) - 1;
  return Math.pow(base, exp);
};

// -- Ordinal Scale ----

pv.Scales.ordinal = function(ordinals) {
  var map = pv.numerate(ordinals);
  function f(x) {
    var i = map[x];
    return (i == undefined) ? -1 : i;
  }
  f.values = function() { return ordinals; };
  f.interp = function(i) { return ordinals[i]; };
  return f;
};

// -- Linear Scale ----

pv.Scales.linear = function(min, max, base) {
  if (base == undefined) base = pv.Scales.defaultBase;
  var range = max - min, eps = pv.Scales.epsilon;
  function f(x) { return range < eps && range > -eps ? 0 : (x - min) / range; }
  f.values = function(n) { return pv.Scales.linear.values(min, max, base, n); };
  f.interp = function(f) { return min + f * range; };
  return f;
};

pv.Scales.linear.fromData = function(array, f, base, nice) {
  if (base == undefined) base = pv.Scales.defaultBase;
  if (nice == undefined) nice = pv.Scales.defaultNice;
  var min = pv.min(array, f);
  var max = pv.max(array, f);
  if (!nice) {
    var r = pv.Scales.linear.range(min, max, base);
    min = r.min;
    max = r.max;
  }
  return pv.Scales.linear(min, max, base);
};

pv.Scales.linear.values = function(min, max, base, n) {
  if (base == undefined) base = pv.Scales.defaultBase;
  if (n == undefined) n = -1;
  var range = max - min;
  if (range == 0) {
    return [min];
  } else {
    var step = pv.Scales.step(min, max, base);
    var stride = n<0 ? 1 : Math.max(1, Math.floor(range/(step*n)));
    var array = [];
    for (var x=min; x <= max; x += stride*step)
      array.push(x);
    return array;
  }
};

pv.Scales.linear.range = function(min, max, base) {
  var step = pv.Scales.step(min, max, base);
  return {
    min: Math.floor(min / step) * step,
    max: Math.ceil(max / step) * step
  };
};

// -- Root Scale ----

pv.Scales.root = function(min, max, base) {
  if (base == undefined) base = 2;
  function root(x) {
    var s = (x < 0) ? -1 : 1;
    return s * Math.pow(s * x, 1 / base);
  }
  var rmin = root(min), range = root(max) - rmin, eps = pv.Scales.epsilon;
  function f(x) { return (root(x) - rmin) / range; }
  f.values = function(n) { return pv.Scales.linear.values(min, max, base, 10); };
  f.interp = function(f) {
    var g = rmin + f * range, s = (g < 0) ? -1 : 1;
    return s * Math.pow(s * g, base);
  };
  return f;
};

pv.Scales.root.fromData = function(array, f, base, nice) {
  if (base == undefined) base = 2;
  if (nice == undefined) nice = pv.Scales.defaultNice;
  var min = pv.min(array, f);
  var max = pv.max(array, f);
  if (!nice) {
    var r = pv.Scales.linear.range(min, max, 10);
    min = r.min;
    max = r.max;
  }
  return pv.Scales.root(min, max, base);
};

// -- Log Scale ----

pv.Scales.log = function(min, max, base) {
  if (base == undefined) base = pv.Scales.defaultBase;
  var lg = (min < 0 && max > 0) ? pv.Scales.log.zlog : pv.Scales.log.log;
  var lmin = lg(min, base), lrange = lg(max, base) - lmin, eps = pv.Scales.epsilon;
  function f(x) {
    return (lrange < eps && lrange > -eps) ? 0 : (lg(x, base) - lmin) / lrange;
  }
  f.values = function(n) {
    return pv.Scales.log.values(min, max, 10, n);
  };
  f.interp = function(f) {
    var g = lmin + f * lrange, s = (g < 0) ? -1 : 1;
    return s * Math.pow(base, s * g);
  };
  return f;
};

pv.Scales.log.fromData = function(array, f, base, nice) {
  if (base == undefined) base = pv.Scales.defaultBase;
  if (nice == undefined) nice = pv.Scales.defaultNice;
  var min = pv.min(array, f);
  var max = pv.max(array, f);
  if (!nice) {
    var r = pv.Scales.log.range(min, max, base);
    min = r.min;
    max = r.max;
  }
  return pv.Scales.log(min, max, base);
};

pv.Scales.log.log = function(x, b) {
  return x==0 ? 0 : x>0 ? Math.log(x)/Math.log(b) : -Math.log(-x)/Math.log(b);
};

pv.Scales.log.zlog = function(x, b) {
  var s = (x < 0) ? -1 : 1;
  x = s*x;
  if (x < b) x += (b-x)/b;
  return s * Math.log(x) / Math.log(b);
};

pv.Scales.log.values = function(min, max, base, n) {
  if (base == undefined) base = pv.Scales.defaultBase;
  if (n == undefined) n = -1;
  var z = (min < 0 && max > 0);
  var lg = z ? pv.Scales.log.zlog : pv.Scales.log.log;
  var beg = Math.round(lg(min, base));
  var end = Math.round(lg(max, base));
  var i, j, b, v = z?-1:1;

  if (beg == end && beg>0 && Math.pow(base,beg) > min) {
  	--beg; // decrement to generate more values
  }
  var array = [];
  for (i = beg; i <= end; ++i) {
    if (i==0 && v<=0) { array.push(v); array.push(0); }
    v = z && i<0 ? -Math.pow(base,-i) : Math.pow(base,i);
    b = z && i<0 ? Math.pow(base,-i-1) : v;

    for (j = 1; j < base; ++j, v += b) {
      if (v > max) break;
      array.push(v);
    }
  }
  return array;
};

pv.Scales.log.range = function(min, max, base) {
  if (base == undefined) base = pv.Scales.defaultBase;
  function lg(x) { return Math.log(x) / Math.log(base); }
  var r = {
    min: (min > 0 ?  Math.pow(base,  Math.floor(lg(min)))
			: -Math.pow(base, -Math.floor(-lg(-min)))),
    max: (max > 0 ?  Math.pow(base,  Math.ceil(lg(max)))
			: -Math.pow(base, -Math.ceil(-lg(-max))))
  };
  if (min < 0 && max > 0) {
    if (Math.abs(min) < base) r.min = Math.floor(min);
    if (Math.abs(max) < base) r.max = Math.ceil(max);	
  }
  return r;
};

// -- Quantile Scale ----

// TODO?

// -- DateTime Scale ----

// TODO
pv.Colors = function(values) {
  var idToColor = {}; // from type-childIndex to assigned color
  var typeToCount = {}; // from type to number of marks seen (of that type)

  function color() {

    /* TODO Blech. Need a better solution than this... */
    if (!this.root.scene._resetColors) {
      idToColor = {};
      typeToCount = {};
      this.root.scene._resetColors = true;
    }

    var type = this.type.toString();
    var id = type + "-" + this.childIndex;
    var color = idToColor[id];
    if (color == undefined) {
      var count = typeToCount[type] = (typeToCount[type] || 0) + 1;
      idToColor[id] = color = values[(count - 1) % values.length];
    }
    return color;
  }

  color.values = values;
  color.unique = function() {
      var index = (this.index == -1) ? this.parent.index : this.index;
      return values[index % values.length];
    };
  return color;
};

/* From Flare. */

pv.Colors.category10 = pv.Colors([
  "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
  "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
]);

pv.Colors.category20 = pv.Colors([
  "#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c",
  "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5",
  "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f",
  "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"
]);

pv.Colors.category19 = pv.Colors([
  "#9c9ede", "#7375b5", "#4a5584", "#cedb9c", "#b5cf6b",
  "#8ca252", "#637939", "#e7cb94", "#e7ba52", "#bd9e39",
  "#8c6d31", "#e7969c", "#d6616b", "#ad494a", "#843c39",
  "#de9ed6", "#ce6dbd", "#a55194", "#7b4173"
]);
pv.Gradient = function() {
  this.colors = [];
  this.$orientation = "vertical";
};

pv.Gradient.prototype.color = function(offset, color) {
  this.colors.push({ offset: offset, color: color });
  return this;
};

pv.Gradient.prototype.orientation = function(orientation) {
  this.$orientation = orientation;
  return this;
};

pv.Gradient.prototype.create = function(c, w, h) {
  switch (this.$orientation) {
    case "vertical": w = 0; break;
    case "horizontal": h = 0; break;
  }
  var g = c.createLinearGradient(0, 0, w, h);
  for (var i = 0; i < this.colors.length; i++) {
    var s = this.colors[i];
    g.addColorStop(s.offset, s.color);
  }
  return g;
};
pv.Mark = function() {};

pv.Mark.toString = function() {
  return "mark";
};

pv.Mark.property = function(name) {
  return function(v) {
      if (arguments.length) {
        if (this.scene) {
          this.scene[this.index][name] = v;
        } else {
          this["$" + name] = (v instanceof Function) ? v : function() { return v; };
        }
        return this;
      }
      return this.scene[this.index][name];
    };
};

pv.Mark.prototype.defineProperty = function(name) {
  if (!this.hasOwnProperty("properties")) {
    this.properties = (this.properties || []).concat();
  }
  this.properties.push(name);
  this[name] = pv.Mark.property(name);
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

pv.Mark.defaults = new pv.Mark()
  .data([null])
  .visible(true);

pv.Mark.prototype.extend = function(proto) {
  this.proto = proto;
  return this;
};

pv.Mark.prototype.add = function(type) {
  return this.parent.add(type).extend(this);
};

pv.Mark.Anchor = function() {
  pv.Mark.call(this);
};

pv.Mark.Anchor.prototype = pv.Mark.extend();
pv.Mark.Anchor.prototype.name = pv.Mark.property("name");

pv.Mark.prototype.anchor = function(name) {
  var anchorType = this.type;
  while (!anchorType.Anchor) {
    anchorType = anchorType.defaults.proto.type;
  }
  var anchor = new anchorType.Anchor().extend(this).name(name);
  anchor.parent = this.parent;
  anchor.type = this.type;
  return anchor;
};

pv.Mark.prototype.anchorTarget = function() {
  var target = this;
  while (!(target instanceof pv.Mark.Anchor)) {
    target = target.proto;
  }
  return target.proto;
};

pv.Mark.prototype.first = function() {
  return this.scene[0];
};

pv.Mark.prototype.last = function() {
  return this.scene[this.scene.length - 1];
};

pv.Mark.prototype.sibling = function() {
  return (this.index == 0) ? null : this.scene[this.index - 1];
};

pv.Mark.prototype.cousin = function(panel, i) {
  var s = panel
      ? panel.scene[this.parent.index]
      : (this.parent && this.parent.sibling());
  return (s && s.children)
      ? s.children[this.childIndex][(i == undefined) ? this.index : i]
      : null;
};

pv.Mark.prototype.build = function(s) {
  if (!this.scene) {
    this.scene = [];
    if (!this.parent) {
      s = {};
      this.scene.data = [];
    }
  }

  var data = this.get("data");
  var stack = this.root.scene.data;
  stack.unshift(null);
  this.index = -1;
  for (var i = 0, d; i < data.length; i++) {
    pv.Mark.prototype.index = ++this.index;
    stack[0] = d = data[i];
    this.scene[this.index] = this.get("visible")
        ? this.buildInstance(s, d) : { data: d, visible: false };
  }
  stack.shift();
  delete this.index;
  pv.Mark.prototype.index = -1;

  return this;
};

pv.Mark.prototype.buildInstance = function(s, d) {
  var p = this.type.prototype;
  s = { data: d, parent: s, visible: true };
  for (var i = 0; i < p.properties.length; i++) {
    var name = p.properties[i];
    if (!(name in s)) {
      s[name] = this.get(name);
    }
  }
  this.buildImplied(s);
  return s;
};

pv.Mark.prototype.buildImplied = function(s) {
  var p = this.type.prototype;

  var l = s.left;
  var r = s.right;
  var t = s.top;
  var b = s.bottom;
  var w = p.width ? s.width : 0;
  var h = p.height ? s.height : 0;

  var width = s.parent.width;
  if (w == null) {
    w = width - (r = r || 0) - (l = l || 0);
  } else if (r == null) {
    r = width - w - (l = l || 0);
  } else if (l == null) {
    l = width - w - (r = r || 0);
  }

  var height = s.parent.height;
  if (h == null) {
    h = height - (t = t || 0) - (b = b || 0);
  } else if (b == null) {
    b = height - h - (t = t || 0);
  } else if (t == null) {
    t = height - h - (b = b || 0);
  }

  s.left = l;
  s.right = r;
  s.top = t;
  s.bottom = b;
  if (p.width) s.width = w;
  if (p.height) s.height = h;
};

pv.Mark.prototype.get = function(name) {
  var mark = this;
  while (!mark["$" + name]) {
    mark = mark.proto;
    if (!mark) {
      mark = this.type.defaults;
      while (!mark["$" + name]) {
        mark = mark.proto;
        if (!mark) {
          return null;
        }
      }
      break;
    }
  }

  // Note that the property function is applied to the 'this' instance (the
  // leaf-level mark), rather than whatever mark defined the property function.
  // This can be confusing because a property function can be called on an
  // object of a different "class", but is useful for logic reuse.
  return mark["$" + name].apply(this, this.root.scene.data);
};

pv.Mark.prototype.render = function(g) {
  for (var i = 0; i < this.scene.length; i++) {
    var s = this.scene[i];
    if (s.visible) {
      this.renderInstance(g, s);
    }
  }
};

pv.Mark.prototype.renderInstance = function(g, s) {};

pv.Mark.prototype.title = function(s) {
  this.parent.canvas().title = s;
  return this;
};

pv.Mark.prototype.cursor = function(s) {
  this.parent.canvas().style.cursor = s;
  return this;
};

pv.Mark.prototype.event = function(type, handler) {
  this["on" + type] = handler;
  this.root.$interactive = true;
  return this;
};

pv.Mark.prototype.contains = function(x, y, s) {
  return false;
};
pv.Area = function() {
  pv.Mark.call(this);
};

pv.Area.toString = function() {
  return "area";
};

pv.Area.prototype = pv.Mark.extend();
pv.Area.prototype.type = pv.Area;
pv.Area.prototype.defineProperty("width");
pv.Area.prototype.defineProperty("height");
pv.Area.prototype.defineProperty("lineWidth");
pv.Area.prototype.defineProperty("strokeStyle");
pv.Area.prototype.defineProperty("fillStyle");

pv.Area.defaults = new pv.Area().extend(pv.Mark.defaults)
    .width(0)
    .height(0)
    .lineWidth(1.5)
    .strokeStyle(null)
    .fillStyle(pv.Colors.category20);

pv.Area.Anchor = function() {
  pv.Mark.Anchor.call(this);
};

pv.Area.Anchor.prototype = pv.Mark.Anchor.extend();
pv.Area.Anchor.prototype.type = pv.Area;

pv.Area.Anchor.prototype.$left = function(d) {
  var area = this.anchorTarget();
  switch (this.get("name")) {
    case "bottom":
    case "top":
    case "center": return area.left() + area.width() / 2;
    case "right": return area.left() + area.width();
  }
  return null;
};

pv.Area.Anchor.prototype.$right = function(d) {
  var area = this.anchorTarget();
  switch (this.get("name")) {
    case "bottom":
    case "top":
    case "center": return area.right() + area.width() / 2;
    case "left": return area.right() + area.width();
  }
  return null;
};

pv.Area.Anchor.prototype.$top = function(d) {
  var area = this.anchorTarget();
  switch (this.get("name")) {
    case "left":
    case "right":
    case "center": return area.top() + area.height() / 2;
    case "bottom": return area.top() + area.height();
  }
  return null;
};

pv.Area.Anchor.prototype.$bottom = function(d) {
  var area = this.anchorTarget();
  switch (this.get("name")) {
    case "left":
    case "right":
    case "center": return area.bottom() + area.height() / 2;
    case "top": return area.bottom() + area.height();
  }
  return null;
};

pv.Area.Anchor.prototype.$textAlign = function(d) {
  switch (this.get("name")) {
    case "left": return "left";
    case "bottom":
    case "top":
    case "center": return "center";
    case "right": return "right";
  }
  return null;
};

pv.Area.Anchor.prototype.$textBaseline = function(d) {
  switch (this.get("name")) {
    case "right":
    case "left":
    case "center": return "middle";
    case "top": return "top";
    case "bottom": return "bottom";
  }
  return null;
};

pv.Area.prototype.render = function(g) {
  g.save();
  var move = true;
  var back = [];

  for (var i = 0; i < this.scene.length; i++) {
    var s = this.scene[i];
    if (!s.visible) {
      continue; // TODO render fragment
    }

    var x0 = s.left;
    var x1 = x0 + s.width;
    var y0 = s.top;
    var y1 = y0 + s.height;

    if (move) {
      move = false;
      g.beginPath();
      g.moveTo(x0, y0);
    } else {
      g.lineTo(x0, y0);
    }

    back.push({ x: x1, y: y1 });
  }

  back.reverse();
  for (var i = 0; i < back.length; i++) {
    g.lineTo(back[i].x, back[i].y);
  }
  g.closePath();

  /* TODO variable fillStyle, strokeStyle, lineWidth */
  if (s) {
    if (s.fillStyle) {
      g.fillStyle = s.fillStyle;
      g.fill();
    }
    if (s.strokeStyle) {
      g.lineWidth = s.lineWidth;
      g.strokeStyle = s.strokeStyle;
      g.stroke();
    }
  }

  g.restore();
};
pv.Bar = function() {
  pv.Mark.call(this);
};

pv.Bar.toString = function() {
  return "bar";
};

pv.Bar.prototype = pv.Mark.extend();
pv.Bar.prototype.type = pv.Bar;
pv.Bar.prototype.defineProperty("width");
pv.Bar.prototype.defineProperty("height");
pv.Bar.prototype.defineProperty("lineWidth");
pv.Bar.prototype.defineProperty("strokeStyle");
pv.Bar.prototype.defineProperty("fillStyle");

pv.Bar.defaults = new pv.Bar().extend(pv.Mark.defaults)
    .lineWidth(1.5)
    .strokeStyle(null)
    .fillStyle(pv.Colors.category20);

pv.Bar.Anchor = function() {
  pv.Mark.Anchor.call(this);
};

pv.Bar.Anchor.prototype = pv.Mark.Anchor.extend();
pv.Bar.Anchor.prototype.type = pv.Bar;

pv.Bar.Anchor.prototype.$left = function(d) {
  var bar = this.anchorTarget();
  switch (this.get("name")) {
    case "bottom":
    case "top":
    case "center": return bar.left() + bar.width() / 2;
    case "left": return bar.left();
  }
  return null;
};

pv.Bar.Anchor.prototype.$right = function(d) {
  var bar = this.anchorTarget();
  switch (this.get("name")) {
    case "bottom":
    case "top":
    case "center": return bar.right() + bar.width() / 2;
    case "right": return bar.right();
  }
  return null;
};

pv.Bar.Anchor.prototype.$top = function(d) {
  var bar = this.anchorTarget();
  switch (this.get("name")) {
    case "left":
    case "right":
    case "center": return bar.top() + bar.height() / 2;
    case "top": return bar.top();
  }
  return null;
};

pv.Bar.Anchor.prototype.$bottom = function(d) {
  var bar = this.anchorTarget();
  switch (this.get("name")) {
    case "left":
    case "right":
    case "center": return bar.bottom() + bar.height() / 2;
    case "bottom": return bar.bottom();
  }
  return null;
};

pv.Bar.Anchor.prototype.$textAlign = function(d) {
  var bar = this.anchorTarget();
  switch (this.get("name")) {
    case "left": return "left";
    case "bottom":
    case "top":
    case "center": return "center";
    case "right": return "right";
  }
  return null;
};

pv.Bar.Anchor.prototype.$textBaseline = function(d) {
  var bar = this.anchorTarget();
  switch (this.get("name")) {
    case "right":
    case "left":
    case "center": return "middle";
    case "top": return "top";
    case "bottom": return "bottom";
  }
  return null;
};

pv.Bar.renderStyle = function(style, g, w, h) {
  return (style instanceof pv.Gradient) ? style.create(g, w, h) : style;
};

pv.Bar.prototype.renderInstance = function(g, s) {
  var x = s.left, y = s.top, w = s.width, h = s.height;
  g.save();
  g.translate(x, y);
  if (s.fillStyle) {
    g.fillStyle = pv.Bar.renderStyle(s.fillStyle, g, w, h);
    g.fillRect(0, 0, w, h);
  }
  if (s.strokeStyle) {
    g.lineWidth = s.lineWidth;
    g.strokeStyle = pv.Bar.renderStyle(s.strokeStyle, g, w, h);
    g.strokeRect(0, 0, w, h);
  }
  g.restore();
};

pv.Bar.prototype.contains = function(x, y, s) {
  var p = s.strokeStyle ? s.lineWidth : 0;
  return ((s.left - p) <= x) && (x < (s.left + s.width + p))
      && ((s.top - p) <= y) && (y < (s.top + s.height + p));
};
pv.Dot = function() {
  pv.Mark.call(this);
};

pv.Dot.toString = function() {
  return "dot";
};

pv.Dot.prototype = pv.Mark.extend();
pv.Dot.prototype.type = pv.Dot;
pv.Dot.prototype.defineProperty("size");
pv.Dot.prototype.defineProperty("shape");
pv.Dot.prototype.defineProperty("angle");
pv.Dot.prototype.defineProperty("lineWidth");
pv.Dot.prototype.defineProperty("strokeStyle");
pv.Dot.prototype.defineProperty("fillStyle");

pv.Dot.defaults = new pv.Dot().extend(pv.Mark.defaults)
    .size(20)
    .shape("circle")
    .angle(0)
    .lineWidth(1.5)
    .strokeStyle(pv.Colors.category10)
    .fillStyle(null);

pv.Dot.Anchor = function() {
  pv.Mark.Anchor.call(this);
};

pv.Dot.Anchor.prototype = pv.Mark.Anchor.extend();
pv.Dot.Anchor.prototype.type = pv.Dot;

pv.Dot.Anchor.prototype.$left = function(d) {
  var dot = this.anchorTarget();
  switch (this.get("name")) {
    case "bottom":
    case "top":
    case "center": return dot.left();
    case "left": return dot.left() - dot.radius();
  }
  return null;
};

pv.Dot.Anchor.prototype.$right = function(d) {
  var dot = this.anchorTarget();
  switch (this.get("name")) {
    case "bottom":
    case "top":
    case "center": return dot.right();
    case "right": return dot.right() - dot.radius();
  }
  return null;
};

pv.Dot.Anchor.prototype.$top = function(d) {
  var dot = this.anchorTarget();
  switch (this.get("name")) {
    case "left":
    case "right":
    case "center": return dot.top();
    case "top": return dot.top() - dot.radius();
  }
  return null;
};

pv.Dot.Anchor.prototype.$bottom = function(d) {
  var dot = this.anchorTarget();
  switch (this.get("name")) {
    case "left":
    case "right":
    case "center": return dot.bottom();
    case "bottom": return dot.bottom() - dot.radius();
  }
  return null;
};

pv.Dot.Anchor.prototype.$textAlign = function(d) {
  switch (this.get("name")) {
    case "left": return "right";
    case "bottom":
    case "top":
    case "center": return "center";
    case "right": return "left";
  }
  return null;
};

pv.Dot.Anchor.prototype.$textBaseline = function(d) {
  switch (this.get("name")) {
    case "right":
    case "left":
    case "center": return "middle";
    case "top": return "bottom";
    case "bottom": return "top";
  }
  return null;
};

pv.Dot.prototype.radius = function() {
  return Math.sqrt(this.size());
};

pv.Dot.prototype.renderInstance = function(g, s) {
  function path(shape, size) {
    g.beginPath();
    var radius = Math.sqrt(size);
    switch (shape) {
      case "cross": {
        g.moveTo(-radius, -radius);
        g.lineTo(radius, radius);
        g.moveTo(radius, -radius);
        g.lineTo(-radius, radius);
        break;
      }
      case "triangle": {
        var h = radius;
        var w = radius * 2 / Math.sqrt(3);
        g.moveTo(0, h);
        g.lineTo(w, -h);
        g.lineTo(-w, -h);
        g.closePath();
        break;
      }
      case "diamond": {
        radius *= Math.sqrt(2);
        g.moveTo(0, -radius);
        g.lineTo(radius, 0);
        g.lineTo(0, radius);
        g.lineTo(-radius, 0);
        g.closePath();
        break;
      }
      case "square": {
        g.moveTo(-radius, -radius);
        g.lineTo(radius, -radius);
        g.lineTo(radius, radius);
        g.lineTo(-radius, radius);
        g.closePath();
        break;
      }
      case "tick": {
        g.moveTo(0, 0);
        g.lineTo(0, -size);
        break;
      }
      default: {
        g.arc(0, 0, radius, 0, 2.0 * Math.PI, false);
        break;
      }
    }
  }

  g.save();
  g.translate(s.left, s.top);
  g.rotate(s.angle);
  path(s.shape, s.size);
  if (s.fillStyle) {
    g.fillStyle = s.fillStyle;
    g.fill();
  }
  if (s.strokeStyle) {
    g.lineWidth = s.lineWidth;
    g.strokeStyle = s.strokeStyle;
    g.stroke();
  }
  g.restore();
};
pv.Label = function() {
  pv.Mark.call(this);
};

pv.Label.toString = function() {
  return "label";
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

pv.Label.defaults = new pv.Label().extend(pv.Mark.defaults)
    .text(pv.identity)
    .font("10px Sans-Serif")
    .textAngle(0)
    .textStyle("black")
    .textAlign("left")
    .textBaseline("bottom")
    .textMargin(3);

pv.Label.prototype.renderInstance = function(g, s) {
  g.save();
  g.font = s.font;

  /* Horizontal alignment. */
  var ox = 0;
  switch (s.textAlign) {
    case "center": ox += -g.measureText(s.text).width / 2; break;
    case "right": ox += -g.measureText(s.text).width - s.textMargin; break;
    case "left": ox += s.textMargin; break;
  }

  /* Vertical alignment. */
  var oy = 0;
  function lineHeight(font) {
    return Number(/[0-9]+/.exec(font)[0]) * .68;
  }
  switch (s.textBaseline) {
    case "middle": oy += lineHeight(s.font) / 2; break;
    case "top": oy += lineHeight(s.font) + s.textMargin; break;
    case "bottom": oy -= s.textMargin; break;
  }

  g.translate(s.left, s.top);
  g.rotate(s.textAngle);
  g.fillStyle = s.textStyle;
  g.fillText(s.text, ox, oy);
  g.restore();
};
pv.Line = function() {
  pv.Mark.call(this);
};

pv.Line.toString = function() {
  return "line";
};

pv.Line.prototype = pv.Mark.extend();
pv.Line.prototype.type = pv.Line;
pv.Line.prototype.defineProperty("lineWidth");
pv.Line.prototype.defineProperty("strokeStyle");
pv.Line.prototype.defineProperty("fillStyle");

pv.Line.defaults = new pv.Line().extend(pv.Mark.defaults)
    .lineWidth(1.5)
    .strokeStyle(pv.Colors.category10);

pv.Line.prototype.render = function(g) {
  g.save();
  var move = true;

  for (var i = 0; i < this.scene.length; i++) {
    var s = this.scene[i];
    if (!s.visible) {
      continue; // TODO render fragment
    }

    if (move) {
      move = false;
      g.beginPath();
      g.moveTo(s.left, s.top);
    } else {
      g.lineTo(s.left, s.top);
    }
  }

  /* TODO variable fillStyle, strokeStyle, lineWidth */
  if (s) {
    if (s.fillStyle) {
      g.fillStyle = s.fillStyle;
      g.fill();
    }
    if (s.strokeStyle) {
      g.lineWidth = s.lineWidth;
      g.strokeStyle = s.strokeStyle;
      g.stroke();
    }
  }

  g.restore();
};
pv.Rule = function() {
  pv.Mark.call(this);
};

pv.Rule.toString = function() {
  return "rule";
};

pv.Rule.prototype = pv.Mark.extend();
pv.Rule.prototype.type = pv.Rule;
pv.Rule.prototype.defineProperty("lineWidth");
pv.Rule.prototype.defineProperty("strokeStyle");

pv.Rule.defaults = new pv.Rule().extend(pv.Mark.defaults)
    .lineWidth(1)
    .strokeStyle("black");

pv.Rule.Anchor = function() {
  pv.Mark.Anchor.call(this);
};

pv.Rule.Anchor.prototype = pv.Mark.Anchor.extend();
pv.Rule.Anchor.prototype.type = pv.Rule;

pv.Rule.Anchor.prototype.$left = function(d) {
  var rule = this.anchorTarget();
  switch (this.get("name")) {
    case "bottom":
    case "top":
    case "left": return rule.left();
  }
 return null;
};

pv.Rule.Anchor.prototype.$right = function(d) {
  var rule = this.anchorTarget();
  switch (this.get("name")) {
    case "right": return rule.right();
  }
  return null;
};

pv.Rule.Anchor.prototype.$top = function(d) {
  var rule = this.anchorTarget();
  switch (this.get("name")) {
    case "left":
    case "right":
    case "top": return rule.top();
  }
  return null;
};

pv.Rule.Anchor.prototype.$bottom = function(d) {
  var rule = this.anchorTarget();
  switch (this.get("name")) {
    case "bottom": return rule.bottom();
  }
  return null;
};

pv.Rule.Anchor.prototype.$textAlign = function(d) {
  switch (this.get("name")) {
    case "top":
    case "bottom": return "center";
    case "right": return "left";
    case "left": return "right";
  }
  return null;
};

pv.Rule.Anchor.prototype.$textBaseline = function(d) {
  switch (this.get("name")) {
    case "right":
    case "left": return "middle";
    case "top": return "bottom";
    case "bottom": return "top";
  }
  return null;
};

pv.Rule.prototype.buildImplied = function(s) {
  s.width = s.height = 0;

  var l = s.left;
  var r = s.right;
  var t = s.top;
  var b = s.bottom;

  /* Determine horizontal or vertical orientation. */
  if (((l == null) && (r == null)) || (r != null)) {
    s.width = s.parent.width - (l = l || 0) - (r = r || 0);
  } else if (((t == null) && (b == null)) || (b != null)) {
    s.height = s.parent.height - (t = t || 0) - (b = b || 0);
  }

  s.left = l;
  s.right = r;
  s.top = t;
  s.bottom = b;

  pv.Mark.prototype.buildImplied.call(this, s);
};

pv.Rule.prototype.renderInstance = function(g, s) {
  if (s.strokeStyle) {
    g.save();
    g.lineWidth = s.lineWidth;
    g.strokeStyle = s.strokeStyle;
    g.beginPath();
    g.moveTo(s.left, s.top);
    g.lineTo(s.left + s.width, s.top + s.height);
    g.stroke();
    g.restore();
  }
};
pv.Panel = function() {
  pv.Bar.call(this);
  this.children = [];
  this.root = this;
  this.$dom = pv.Panel.$dom;
};

pv.Panel.toString = function() {
  return "panel";
};

pv.Panel.prototype = pv.Bar.extend();
pv.Panel.prototype.type = pv.Panel;
pv.Panel.prototype.defineProperty("canvas");

pv.Panel.defaults = new pv.Panel().extend(pv.Bar.defaults)
    .top(0).left(0).bottom(0).right(0)
    .fillStyle(null);

pv.Panel.prototype.add = function(type) {
  var child = new type();
  child.parent = this;
  child.root = this.root;
  child.childIndex = this.children.length;
  this.children.push(child);
  return child;
};

pv.Panel.prototype.clear = function() {
  for (var i = 0; i < this.scene.length; i++) {
    var c = this.scene[i].canvas;
    if (!c.$clear) {
      c.$clear = true;
      c.getContext("2d").clearRect(0, 0, c.width, c.height);
    }
  }
  for (var i = 0; i < this.scene.length; i++) {
    delete this.scene[i].canvas.$clear;
  }
};

pv.Panel.prototype.createCanvas = function(w, h) {
  function lastChild(node) {
    while (node.lastChild && node.lastChild.tagName) {
      node = node.lastChild;
    }
    return (node == document.body) ? node : node.parentNode;
  }

  /* Cache the canvas element to reuse across renders. */
  if (!this.$canvases) this.$canvases = [];
  var c = this.$canvases[this.index];
  if (!c) {
    this.$canvases[this.index] = c = document.createElement("canvas");
    this.$dom // script element for text/javascript+protovis
        ? this.$dom.parentNode.insertBefore(c, this.$dom)
        : lastChild(document.body).appendChild(c);
  }

  c.width = w;
  c.height = h;
  return c;
};

pv.Panel.prototype.buildInstance = function(s, d) {
  s = pv.Bar.prototype.buildInstance.call(this, s, d);
  this.scene[this.index] = s;
  s.children = [];
  for (var i = 0; i < this.children.length; i++) {
    s.children.push(this.children[i].build(s).scene);
  }
  for (var i = 0; i < this.children.length; i++) {
    delete this.children[i].scene;
  }
  return s;
};

pv.Panel.prototype.buildImplied = function(s) {
  var c = s.canvas;
  if (c) {
    if (typeof c == "string") {
      s.canvas = c = document.getElementById(c);
    }
    s.width = c.width - s.left - s.right;
    s.height = c.height - s.top - s.bottom;
  } else if (s.parent.canvas) {
    s.canvas = s.parent.canvas;
  } else {
    s.canvas = this.createCanvas(
        s.width + s.left + s.right,
        s.height + s.top + s.bottom);
  }
  pv.Bar.prototype.buildImplied.call(this, s);
};

pv.Panel.prototype.render = function(g) {
  if (!this.parent) {
    delete this.scene;
    this.build();
    this.listen();
  }
  this.update(g);
};

pv.Panel.prototype.update = function(g) {
  if (!this.parent) {
    this.clear();
  }
  for (var i = 0; i < this.scene.length; i++) {
    var s = this.scene[i], sg = g || s.canvas.getContext("2d");
    this.renderInstance(sg, s);
    sg.save();
    sg.translate(s.left, s.top);
    for (var j = 0; j < this.children.length; j++) {
      var c = this.children[j];
      c.scene = s.children[j];
      c.render(sg);
      delete c.scene;
    }
    sg.restore();
  }
};

pv.Panel.prototype.listen = function() {
  if (!this.$interactive) return; // TODO selective listening
  var that = this;
  function dispatch(e) {
    if (that.dispatch(e)) {
      e.preventDefault();
    }
  }
  for (var i = 0; i < this.scene.length; i++) {
    var c = this.scene[i].canvas;
    if (!c.$listen) {
      c.$listen = true;
      c.addEventListener("click", dispatch, false);
      c.addEventListener("mousemove", dispatch, false);
      c.addEventListener("mouseout", dispatch, false);
      c.addEventListener("mousedown", dispatch, false);
    }
  }
  if (!self.$listen) {
    self.$listen = true;
    self.addEventListener("mouseup", dispatch, false);
  }
};

pv.Panel.prototype.dispatch = function(e) {
  var handled = false;

  /* Recursively compute offset for DOM element. */
  function offset(e) {
    var o = {
        left: pv.css(e, "padding-left") + pv.css(e, "border-left-width"),
        top: pv.css(e, "padding-top") + pv.css(e, "border-top-width"),
      };
    while (e.offsetParent) {
      o.left += e.offsetLeft;
      o.top += e.offsetTop;
      e = e.offsetParent;
    }
    return o;
  }

  /* Recursively visit child panels. TODO prune tree */
  function visit(x, y, s) {
    if (this.contains(x, y, s)) {
      if (!s.$mouseover) {
        if ((e.type == "mousemove") && this.onmouseover) {
          s.$mouseover = true;
          this.onmouseover(s.data);
          handled = true;
        }
      }
      if ((e.type != "mouseup") && this["on" + e.type]) {
        if (e.type == "mousedown") {
          s.$mousedown = true;
        }
        this["on" + e.type](s.data);
        handled = true;
      }
    } else if (s.$mouseover) {
      if ((e.type == "mousemove") || (e.type == "mouseout")) {
        this.onmouseout(s.data);
        handled = true;
        delete s.$mouseover;
      }
    }
    if (s.$mousedown) {
      if (e.type == "mouseup") {
        this.onmouseup(s.data);
        handled = true;
        delete s.$mousedown;
      }
    }

    if (s.children) {
      x -= s.left;
      y -= s.top;
      for (var i = 0; i < s.children.length; i++) {
        var c = this.children[i], cs = s.children[i];
        c.scene = cs;
        for (var j = 0; j < cs.length; j++) {
          c.index = j;
          visit.call(c, x, y, cs[j]);
          delete c.index;
        }
        delete c.scene;
      }
    }
  }

  /* Only root panels can have custom canvases. */
  var ex = e.pageX, ey = e.pageY;
  for (var i = 0; i < this.scene.length; i++) {
    var s = this.scene[i], c = s.canvas, o = c.$offset;
    if (!o) c.$offset = o = offset(c);
    this.index = i;
    visit.call(this, ex - o.left, ey - o.top, s);
    delete this.index;
  }

  for (var i = 0; i < this.scene.length; i++) {
    delete this.scene[i].canvas.$offset;
  }

  this.update();
  return handled;
};
pv.Image = function() {
  pv.Bar.call(this);
};

pv.Image.toString = function() {
  return "image";
};

pv.Image.prototype = pv.Bar.extend();
pv.Image.prototype.type = pv.Image;
pv.Image.prototype.defineProperty("image");
pv.Image.prototype.defineProperty("imageWidth");
pv.Image.prototype.defineProperty("imageHeight");

pv.Image.defaults = new pv.Image().extend(pv.Bar.defaults)
    .fillStyle(null);

pv.Image.prototype.renderInstance = function(g, s) {
  var x = s.left, y = s.top, w = s.width, h = s.height;
  g.save();
  g.translate(x, y);
  if (s.fillStyle) {
    g.fillStyle = pv.Bar.renderStyle(s.fillStyle, g, w, h);
    g.fillRect(0, 0, w, h);
  }
  try {
    g.drawImage(s.image, 0, 0, w, h);
  } catch (ignored) {}
  if (s.strokeStyle) {
    g.lineWidth = s.lineWidth;
    g.strokeStyle = pv.Bar.renderStyle(s.strokeStyle, g, w, h);
    g.strokeRect(0, 0, w, h);
  }
  g.restore();
};

pv.Image.prototype.buildImplied = function(s) {
  pv.Bar.prototype.buildImplied.call(this, s);
  if (typeof s.image == "string") {

    /* Cache the image element to reuse across renders. */
    if (!pv.Image.cache) pv.Image.cache = {};
    var i = pv.Image.cache[s.image];

    if (!i) {
      i = new Image(), r = this.root;
      i.src = s.image;
      if (s.imageWidth) i.width = s.imageWidth;
      if (s.imageHeight) i.height = s.imageHeight;
      i.onload = function() { r.update(); }; // redraw on load
      pv.Image.cache[s.image] = i;
    }

    s.image = i;
  } else if (s.image instanceof Function) {
    var c = document.createElement("canvas"); // TODO cache?

    /* Update the canvas dimensions. */
    var w = s.imageWidth || s.width, h = s.imageHeight || s.height;
    c.width = w;
    c.height = h;

    var g = c.getContext("2d");
    var image = g.getImageData(0, 0, w, h);
    var stack = this.root.scene.data;
    stack.unshift(null, null);
    for (var x = 0, p = 0; x < w; x++) {
      stack[0] = x;
      for (var y = 0; y < h; y++) {
        stack[1] = y;
        var color = s.image.apply(this, stack);
        for (var z = 0; z < 4; z++, p++) {
          image.data[p] = color[z];
        }
      }
    }
    g.putImageData(image, 0, 0);
    stack.splice(0, 2);

    s.image = c;
  }
};

/* For consistency with other property functions, these support constants. */

pv.Image.prototype.rgba = function(f, g, b, a) {
  if (!(f instanceof Function)) {
    return this.fillStyle("rgb(" + f + "," + g + "," + b + "," + a + ")");
  }
  return this.image(function() { return f; });
};

pv.Image.prototype.rgb = function(f, g, b) {
  if (!(f instanceof Function)) {
    return this.fillStyle("rgb(" + f + "," + g + "," + b + ")");
  }
  return this.image(function() {
      return function() {
          var rgb = f.apply(this, arguments);
          rgb[3] = 255;
          return rgb;
        };
    });
};

pv.Image.prototype.monochrome = function(f) {
  if (!(f instanceof Function)) {
    return this.fillStyle("rgb(" + f + "," + f + "," + f + ")");
  }
  return this.image(function() {
      return function() {
          var v = f.apply(this, arguments);
          return [v, v, v, 255];
        };
    });
};
pv.Wedge = function() {
  pv.Mark.call(this);
};

pv.Wedge.toString = function() {
  return "wedge";
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

pv.Wedge.defaults = new pv.Wedge().extend(pv.Mark.defaults)
    .startAngle(function() {
        var s = this.sibling();
        return s ? s.endAngle : -Math.PI / 2;
      })
    .innerRadius(0)
    .lineWidth(1.5)
    .strokeStyle(null)
    .fillStyle(pv.Colors.category20.unique);

pv.Wedge.prototype.midRadius = function() {
  return (this.innerRadius() + this.outerRadius()) / 2;
};

pv.Wedge.prototype.midAngle = function() {
  return (this.startAngle() + this.endAngle()) / 2;
};

pv.Wedge.Anchor = function() {
  pv.Mark.Anchor.call(this);
};

pv.Wedge.Anchor.prototype = pv.Mark.Anchor.extend();
pv.Wedge.Anchor.prototype.type = pv.Wedge;

pv.Wedge.Anchor.prototype.$left = function() {
  var w = this.anchorTarget();
  switch (this.get("name")) {
    case "outer": return w.left() + w.outerRadius() * Math.cos(w.midAngle());
    case "inner": return w.left() + w.innerRadius() * Math.cos(w.midAngle());
    case "start": return w.left() + w.midRadius() * Math.cos(w.startAngle());
    case "center": return w.left() + w.midRadius() * Math.cos(w.midAngle());
    case "end": return w.left() + w.midRadius() * Math.cos(w.endAngle());
  }
  return null;
};

pv.Wedge.Anchor.prototype.$right = function() {
  var w = this.anchorTarget();
  switch (this.get("name")) {
    case "outer": return w.right() + w.outerRadius() * Math.cos(w.midAngle());
    case "inner": return w.right() + w.innerRadius() * Math.cos(w.midAngle());
    case "start": return w.right() + w.midRadius() * Math.cos(w.startAngle());
    case "center": return w.right() + w.midRadius() * Math.cos(w.midAngle());
    case "end": return w.right() + w.midRadius() * Math.cos(w.endAngle());
  }
  return null;
};

pv.Wedge.Anchor.prototype.$top = function() {
  var w = this.anchorTarget();
  switch (this.get("name")) {
    case "outer": return w.top() + w.outerRadius() * Math.sin(w.midAngle());
    case "inner": return w.top() + w.innerRadius() * Math.sin(w.midAngle());
    case "start": return w.top() + w.midRadius() * Math.sin(w.startAngle());
    case "center": return w.top() + w.midRadius() * Math.sin(w.midAngle());
    case "end": return w.top() + w.midRadius() * Math.sin(w.endAngle());
  }
  return null;
};

pv.Wedge.Anchor.prototype.$bottom = function() {
  var w = this.anchorTarget();
  switch (this.get("name")) {
    case "outer": return w.bottom() + w.outerRadius() * Math.sin(w.midAngle());
    case "inner": return w.bottom() + w.innerRadius() * Math.sin(w.midAngle());
    case "start": return w.bottom() + w.midRadius() * Math.sin(w.startAngle());
    case "center": return w.bottom() + w.midRadius() * Math.sin(w.midAngle());
    case "end": return w.bottom() + w.midRadius() * Math.sin(w.endAngle());
  }
  return null;
};

pv.Wedge.Anchor.prototype.$textAlign = function() {
  var w = this.anchorTarget();
  switch (this.get("name")) {
    case "outer": return pv.Wedge.upright(w.midAngle()) ? "right" : "left";
    case "inner": return pv.Wedge.upright(w.midAngle()) ? "left" : "right";
    default: return "center";
  }
};

pv.Wedge.Anchor.prototype.$textBaseline = function() {
  var w = this.anchorTarget();
  switch (this.get("name")) {
    case "start": return pv.Wedge.upright(w.startAngle()) ? "top" : "bottom";
    case "end": return pv.Wedge.upright(w.endAngle()) ? "bottom" : "top";
    default: return "middle";
  }
};

pv.Wedge.Anchor.prototype.$textAngle = function() {
  var w = this.anchorTarget();
  var a = 0;
  switch (this.get("name")) {
    case "center":
    case "inner":
    case "outer": a = w.midAngle(); break;
    case "start": a = w.startAngle(); break;
    case "end": a = w.endAngle(); break;
  }
  return pv.Wedge.upright(a) ? a : (a + Math.PI);
};

pv.Wedge.upright = function(angle) {
  angle = angle % (2 * Math.PI);
  angle = (angle < 0) ? (2 * Math.PI + angle) : angle;
  return (angle < Math.PI / 2) || (angle > 3 * Math.PI / 2);
};

pv.Wedge.prototype.buildImplied = function(s) {
  pv.Mark.prototype.buildImplied.call(this, s);
  if (s.endAngle == null) {
    s.endAngle = s.startAngle + s.angle;
  }
};

pv.Wedge.prototype.renderInstance = function(g, s) {
  function path(a0, a1, r0, r1) {
    if ((r0 + r1) == 0) {
      return;
    }
    g.beginPath();
    if (r0 == 0) {
      g.moveTo(0, 0);
      g.arc(0, 0, r1, a0, a1, false);
    } else if (r0 == r1) {
      g.arc(0, 0, r0, a0, a1, false);
    } else {
      g.arc(0, 0, r0, a0, a1, false);
      g.arc(0, 0, r1, a1, a0, true);
    }
    if (a0 != a1) {
      g.closePath();
    }
  }

  g.save();
  g.translate(s.left, s.top);
  path(s.startAngle, s.endAngle, s.innerRadius, s.outerRadius);
  if (s.fillStyle) {
    g.fillStyle = s.fillStyle;
    g.fill();
  }
  if (s.strokeStyle) {
    g.lineWidth = s.lineWidth;
    g.strokeStyle = s.strokeStyle;
    g.stroke();
  }
  g.restore();
};
