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
