(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var tweaker = require('./')({
    degrees: 5
  , precision: 75
  , width: 250
  , height: 250
  , padding: 20
  , control: [0, 0, 0, 1.05, 1]
})

var pre = document.createElement('pre')

tweaker.on('update', function(points) {
  pre.innerHTML = 'points = ' + JSON.stringify(points, null, 2)
})

document.body.appendChild(tweaker.el)
document.body.appendChild(pre)

pre.style.position = 'absolute'
pre.style.left = '16px'
pre.style.top = '16px'

tweaker.el.style.position = 'absolute'
tweaker.el.style.right = '16px'
tweaker.el.style.bottom = '16px'

},{"./":2}],2:[function(require,module,exports){
var Emitter  = require('events/')
var debounce = require('debounce')
var bezier   = require('bezier')
var clamp    = require('clamp')
var ns       = 'http://www.w3.org/2000/svg'

var SVG = {
  line: require('svg-line')
}

module.exports = tweaker

function tweaker(opts) {
  opts = opts || {}

  var svg     = document.createElementNS(ns, 'svg')
  var group   = document.createElementNS(ns, 'g')
  var path    = document.createElementNS(ns, 'path')

  var precision = +(opts.precision || 50)|0
  var degrees   = +(opts.degrees || 4)|0
  var padding   = +(opts.padding || 50)|0
  var height    = +(opts.height || 200)|0
  var width     = +(opts.width || 200)|0
  var control   = opts.control || []

  var curve   = bezier.prepare(degrees)
  var size    = precision - 1
  var xpoints = new Float32Array(precision)
  var ypoints = new Float32Array(precision)
  var grid    = new Emitter
  var dots    = []
  var dstates = []
  var line    = SVG.line()
    .x(function(d, i) { return xpoints[i] })
    .y(function(d, i) { return ypoints[i] })

  grid.el = svg
  grid.points = control
  grid.interpolate = function(t) {
    return curve(control, t)
  }

  svg.setAttribute('width', width + padding * 2)
  svg.setAttribute('height', height + padding * 2)
  svg.appendChild(group)
  group.setAttribute('transform', 'translate('+padding+', '+padding+')')

  var rect = document.createElementNS(ns, 'rect')
  rect.setAttribute('x', 0)
  rect.setAttribute('y', 0)
  rect.setAttribute('width', width)
  rect.setAttribute('height', height)
  rect.style.opacity = 0
  group.appendChild(rect)

  for (var i = 0; i < degrees; i++) {
    if (i < control.length) continue
    control[i] = i / (degrees - 1)
  }

  for (var i = 0; i < precision; i++) {
    xpoints[i] = i / size * width
  }

  for (var x = 0; x < degrees; x++)
  for (var y = 0; y < 2; y++) {
    var pn = document.createElementNS(ns, 'path')
    var px = x / (degrees - 1) * width

    pn.style.stroke = '#000'
    pn.style.opacity = 0.2
    pn.setAttribute('d', [
        'M', (y ? 0 : px)
      , ',', (y ? px : 0)
      , 'L', (y ? width : px)
      , ',', (y ? px : height)
    ].join(''))

    group.appendChild(pn)
  }

  group.appendChild(path)
  path.style.fill = 'none'
  path.style.stroke = '#000'
  path.style.strokeWidth = 2

  for (var i = 0; i < degrees; i++) {
    var dot = document.createElementNS(ns, 'circle')
    group.appendChild(dot)
    dots.push(dot)
    dstates.push(false)
    dot.style.cursor = 'move'
    dot.setAttribute('r', 4)
    dot.setAttribute('cx', i / (degrees - 1) * width)
    dot.setAttribute('fill', '#000')
    updateDot(i)
  }

  dots.forEach(function(dot, i) {
    dot.addEventListener('mousedown', function(e) {
      dstates[i] = true
    }, false)
  })

  window.addEventListener('mousemove', debounce(function(e) {
    var screeny = svg.getBoundingClientRect().top
    var x = e.clientX - padding
    var y = e.clientY - padding - screeny

    var updated = false

    for (var i = 0; i < dstates.length; i++) {
      if (!dstates[i]) continue
      if (!i || i+1 === dstates.length) {
        control[i] = clamp(1 - y / height, 0, 1)
      } else {
        control[i] = 1 - y / height
      }

      updated = true
      updateDot(i)
    }

    if (!updated) return

    redraw()
    grid.emit('update', control)
  }, 1000 / 60))

  window.addEventListener('mouseup', function(e) {
    for (var i = 0; i < dstates.length; i++) {
      dstates[i] = false
    }
  })

  redraw()
  function redraw() {
    for (var i = 0; i < precision; i++) {
      ypoints[i] = height - curve(
        control, i / size
      ) * height
    }

    path.setAttribute('d', line(xpoints))
  }

  function updateDot(i) {
    dots[i].setAttribute('cy'
      , clamp(
          height - control[i] * height
        , -padding
        , height + padding
      )
    )
  }

  return grid
}

},{"bezier":3,"clamp":4,"debounce":5,"events/":6,"svg-line":7}],3:[function(require,module,exports){
var cache = {
    '1': bezier1
  , '2': bezier2
  , '3': bezier3
  , '4': bezier4
}

module.exports = neat
module.exports.prepare = prepare

function neat(arr, t) {
  return prepare(arr.length)(arr, t)
}

function prepare(pieces) {
  pieces = +pieces|0
  if (!pieces) throw new Error('Cannot create a interpolator with no elements')
  if (cache[pieces]) return cache[pieces]

  var fn = ['var ut = 1 - t', '']

  var n = pieces
  while (n--) {
    for (var j = 0; j < n; j += 1) {
      if (n+1 === pieces) {
        fn.push('var p'+j+' = arr['+j+'] * ut + arr['+(j+1)+'] * t')
      } else
      if (n > 1) {
        fn.push('p'+j+' = p'+j+' * ut + p'+(j+1)+' * t')
      } else {
        fn.push('return p'+j+' * ut + p'+(j+1)+' * t')
      }
    }
    if (n > 1) fn.push('')
  }

  fn = [
    'return function bezier'+pieces+'(arr, t) {'
    , fn.map(function(s) { return '  ' + s }).join('\n')
    , '}'
  ].join('\n')

  return Function(fn)()
}

//
// Including the first four degrees
// manually - there's a slight performance penalty
// to generated code. It's outweighed by
// the gains of the optimisations, but always
// helps to cover the most common cases :)
//

function bezier1(arr) {
  return arr[0]
}

function bezier2(arr, t) {
  return arr[0] + (arr[1] - arr[0]) * t
}

function bezier3(arr, t) {
  var ut = 1 - t
  return (arr[0] * ut + arr[1] * t) * ut + (arr[1] * ut + arr[2] * t) * t
}

function bezier4(arr, t) {
  var ut = 1 - t
  var a1 = arr[1] * ut + arr[2] * t
  return ((arr[0] * ut + arr[1] * t) * ut + a1 * t) * ut + (a1 * ut + (arr[2] * ut + arr[3] * t) * t) * t
}

},{}],4:[function(require,module,exports){
module.exports = clamp

function clamp(value, min, max) {
  return min < max
    ? (value < min ? min : value > max ? max : value)
    : (value < max ? max : value > min ? min : value)
}

},{}],5:[function(require,module,exports){
/**
 * Debounces a function by the given threshold.
 *
 * @see http://unscriptable.com/2009/03/20/debouncing-javascript-methods/
 * @param {Function} function to wrap
 * @param {Number} timeout in ms (`100`)
 * @param {Boolean} whether to execute at the beginning (`false`)
 * @api public
 */

module.exports = function debounce(func, threshold, execAsap){
  var timeout;

  return function debounced(){
    var obj = this, args = arguments;

    function delayed () {
      if (!execAsap) {
        func.apply(obj, args);
      }
      timeout = null;
    }

    if (timeout) {
      clearTimeout(timeout);
    } else if (execAsap) {
      func.apply(obj, args);
    }

    timeout = setTimeout(delayed, threshold || 100);
  };
};

},{}],6:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        throw TypeError('Uncaught, unspecified "error" event.');
      }
      return false;
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      console.trace();
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],7:[function(require,module,exports){
var pluck = require('plucker')

module.exports = createLine

function createLine() {
  var x = pluck('x')
  var y = pluck('y')

  line.x = updateX
  line.y = updateY

  return line

  function line(data) {
    var d = []

    d.push('M'
      , x(data[0], 0)
      , ','
      , y(data[0], 0)
    )

    for (var i = 1; i < data.length; i++) {
      d.push('L'
        , x(data[i], i)
        , ','
        , y(data[i], i)
      )
    }

    return d.join('')
  }


  function updateX(_x) {
    if (!arguments.length) return x
    x = functor(_x)
    return line
  }

  function updateY(_y) {
    if (!arguments.length) return y
    y = functor(_y)
    return line
  }
}

function functor(value) {
  return typeof value !== 'function'
    ? function() { return value }
    : value
}

},{"plucker":8}],8:[function(require,module,exports){
module.exports = plucker

function plucker(path, object) {
  return arguments.length >= 2
    ? pluck(path)(object)
    : pluck(path)
}

function pluck(path) {
  path = typeof path === 'string'
    ? String(path).trim().split('.')
    : path

  if (path.length < 2) {
    path = path[0]
    return pluckSingle
  } else {
    var l = path.length
    return pluckPath
  }

  function pluckSingle(object) {
    return object[path]
  }

  function pluckPath(object) {
    for (var i = 0; i < l; i++) {
      if (typeof object === 'undefined') break

      object = object[path[i]]
    }

    return object
  }
}

},{}]},{},[1])