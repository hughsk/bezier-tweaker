# bezier-tweaker [![Flattr this!](https://api.flattr.com/button/flattr-badge-large.png)](https://flattr.com/submit/auto?user_id=hughskennedy&url=http://github.com/hughsk/bezier-tweaker&title=bezier-tweaker&description=hughsk/bezier-tweaker%20on%20GitHub&language=en_GB&tags=flattr,github,javascript&category=software)[![experimental](http://hughsk.github.io/stability-badges/dist/experimental.svg)](http://github.com/hughsk/stability-badges) #

Small UI for adjusting 1-dimensional bezier curves.

## Usage ##

[![bezier-tweaker](https://nodei.co/npm/bezier-tweaker.png?mini=true)](https://nodei.co/npm/bezier-tweaker)

### tweaker = bt([opts]) ###

Creates a new UI for adjusting a bezier curve, returning an EventEmitter with
the following properties:

* `tweaker.el`: the SVG element containing the UI.
* `tweaker.points`: the Y positions for each control point, ranging from 0 to 1.
* `tweaker.interpolate`: an interpolation function that takes an X value between
   0 and 1, returning a Y value between 0 and 1. Useful for live-updating
   animations.

Takes the following options:

* `precision`: The amount of points to draw in the line. Defaults to 50.
* `degrees`: Number of points to use in the curve. Defaults to 4.
* `padding`: Padding around the UI, in pixels. Defaults to 50.
* `height`: Height (not including padding), in pixels. Defaults to 200.
* `width`: Width (not including padding), in pixels. Defaults to 200.
* `control`: Pass in a custom array of control points.

### tweaker.on('update', handle) ###

Emitted every time the curve is updated, passing along the array of control
points (also available at `tweaker.points`) as the first argument.

## License ##

MIT. See [LICENSE.md](http://github.com/hughsk/bezier-tweaker/blob/master/LICENSE.md) for details.
