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