# Background

The FOV Visualizer is a resource to make it easier for CV engineers and roboticists to view and compare sensor FOVs.

- Started from https://threejs.org/examples/#webgl_lights_spotlight
- Inspired by https://cs.wellesley.edu/~cs307/threejs/demos/Camera/frustum.shtml
- Inspired by https://www.smeenk.com/webgl/kinectfovexplorer.html

Human-esque models are from mixamo.com which states on the [FAQ](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html):

> You can use both characters and animations royalty free for personal, commercial, and non-profit projects including:
> - Incorporating characters into illustrations and graphic art
> - 3D printing characters
> - Creating films
> - Creating video games


# Development

Run a local server, such as with python:

```
python3 -m http.server 8000
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

See https://gitlab.com/tangram-vision/fov-visualizer/-/issues


# Deployment

To deploy, see the `fov-visualizer` folder in the `devops` repo.


# To embed

Embed with an html snippet such as the below:

```
<iframe style="width: 100%; height: 550px; border: none;" title="Tangram Vision Depth Sensor Visualizer" src="https://fov-visualizer.tangramvision.com"></iframe>
```

See `embed-example.html` for an example of what embedding looks like.


# License

This repo uses the BSD-3 license: https://opensource.org/licenses/BSD-3-Clause