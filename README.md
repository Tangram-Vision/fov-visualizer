# Purpose

The FOV Visualizer is a resource to make it easier for CV engineers and roboticists to view and
compare sensor FOVs.

- Started from https://threejs.org/examples/#webgl_lights_spotlight
- Inspired by https://cs.wellesley.edu/~cs307/threejs/demos/Camera/frustum.shtml
- Inspired by https://www.smeenk.com/webgl/kinectfovexplorer.html

## For Hardware Partners: How To Add A Sensor Line

If you represent a company that manufactures depth sensors and would like to see your sensor on the
visualizer, we’ve made it easier to submit that request. 

Note that in both cases, the sensor datasheet must be accessible by anyone visiting the visualizer.
If your datasheet is a PDF, we are more than happy to host it in the [Tangram Vision Datasheet
Library](https://drive.google.com/drive/u/0/folders/1tN23D09Iq9NnaJIZ7gmHJk9w6HOUxrQZ),

### Option 1 (fast): Create a Merge Request in the repository

Those who know their way around GitLab can submit a Merge Request to this repository with the right
data. Every sensor has an entry in [`sensors.js`](./sensors.js) with basic information and a link to
that sensor’s datasheet. This is by far the fastest way to get in the visualizer; we just have to
review the MR and click “merge”!

### Option 2 (slower): Send us your datasheet

Send us a PDF or link to the datasheet describing your depth sensor. We will review the datasheet,
pull out the relevant information, and add it to the depth sensor visualizer manually.

---

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

## To embed

Embed with an html snippet such as the below:

```
<iframe style="width: 100%; height: 550px; border: none;" title="Tangram Vision Depth Sensor Visualizer" src="https://fov-visualizer.tangramvision.com"></iframe>
```

See `embed-example.html` for an example of what embedding looks like.

# License

This repo uses the BSD-3 license, see the [LICENSE file](LICENSE)

Human-esque models are from mixamo.com which states on the [FAQ](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html):

> You can use both characters and animations royalty free for personal, commercial, and non-profit projects including:
> - Incorporating characters into illustrations and graphic art
> - 3D printing characters
> - Creating films
> - Creating video games