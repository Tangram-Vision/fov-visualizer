# Background

The FOV Visualizer is a resource to make it easier to view and compare sensor
FOVs. It's intended to be a free, public resource for CV engineers and to
produce visitors and awareness for Tangram Vision.

- Started from https://threejs.org/examples/#webgl_lights_spotlight
- Inspiration https://cs.wellesley.edu/~cs307/threejs/demos/Camera/frustum.shtml
- Inspiration https://www.smeenk.com/webgl/kinectfovexplorer.html

Human-esque model is from mixamo.com which states on the [FAQ](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html):

> You can use both characters and animations royalty free for personal, commercial, and non-profit projects including:
> - Incorporating characters into illustrations and graphic art
> - 3D printing characters
> - Creating films
> - Creating video games

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

See https://gitlab.com/tangram-vision/fov-visualizer/-/issues


# Deployment

To deploy, use the `terraform/aws` folder in the `devops` repo. The
`fov_visualizer.tf` file in that folder takes a path to this repo and updates S3
+ CloudFront to match the declared configuration, including uploading any
changed files from this repo to S3.

The deployment command will look like:

```
TF_VAR_fov_visualizer_repo_filepath=../../fov-visualizer terraform plan
TF_VAR_fov_visualizer_repo_filepath=../../fov-visualizer terraform apply
```

For other ways to supply the variable, see the terraform folder's README.


# To embed

Embed with an html snippet such as the below:

```
<iframe style="width: 100%; height: 500px;" src="https://fov-visualizer.tangramvision.com" allowfullscreen="" frameborder="0"></iframe>
```

See `embed-example.html` for an example of what embedding looks like.
