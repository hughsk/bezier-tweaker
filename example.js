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
