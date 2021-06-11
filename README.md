# Background

The FOV Visualizer is a resource to make it easier to view and compare sensor
FOVs. It's intended to be a free, public resource for CV engineers and to
produce visitors and awareness for Tangram Vision.

- Started from https://threejs.org/examples/#webgl_lights_spotlight
- Inspiration https://cs.wellesley.edu/~cs307/threejs/demos/Camera/frustum.shtml
- Inspiration https://www.smeenk.com/webgl/kinectfovexplorer.html

# Development

Run a local server, such as with python:

```
python -m http.server 8000
```

Visit http://localhost:8000


## Performance

To see FPS, add the following javascript to the page:

```
var script=document.createElement('script');
script.onload=function(){
    var stats=new Stats();
    document.body.appendChild(stats.dom);
    requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});
};
script.src='//mrdoob.github.io/stats.js/build/stats.min.js';
document.head.appendChild(script);
```

Source: https://github.com/mrdoob/stats.js/


## Future feature ideas

- Lidar support (visualize as cylinder/torus)
- Add multiple cameras (with same origin but distinguishing colors and text
labels) so you can visualize their overlapping FOVs
- Show hFOV and vFOV instead of vFOV and aspect ratio
- A meterstick or checkerboard that can be moved forward/back to more easily
judge what a sensor will be able to see at a given distance
- Intro screen (using `#overlay` style from three.js examples) that adds
context, instructions, branding, etc.
- Make a custom camera implementation that also obeys the spherical frustum
boundaries so, when you "look through the camera", the near/far frustum
boundaries are rounded instead of straight/flat.
- Alternative to the above (and easier): When "look through the camera" is
enabled, create a translucent sphere at the camera showing the max range of
the sensor.


# To embed

WARNING: The FOV Visualizer isn't currently deployed anywhere, so it can't be
embedded anywhere either. The `src` url in the code snippet below needs to be
updated to point to wherever the visualizer is deployed. The visualizer should
be deployed as a standalone page, so the iframe doesn't include any unnecessary
extra content.

Embed with an html snippet such as the below:

```
<iframe style="width: 100%; height: 400px;" src="https://tangramvision.com/path-to-where-fov-visualizer-lives" allowfullscreen="" frameborder="0"></iframe>
```

See `embed-example.html` for an example of what embedding looks like.
