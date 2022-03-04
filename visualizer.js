// Copyright 2021 Tangram Robotics, Inc.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice,
// this list of conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice,
// this list of conditions and the following disclaimer in the documentation
// and/or other materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors
// may be used to endorse or promote products derived from this software without
// specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.

import * as THREE from "https://cdn.skypack.dev/pin/three@v0.129.0-chk6X8RSBl37CcZQlxof/mode=imports,min/optimized/three.js";
import { OrbitControls } from "https://cdn.skypack.dev/pin/three@v0.129.0-chk6X8RSBl37CcZQlxof/mode=imports,min/unoptimized/examples/jsm/controls/OrbitControls.js";
import { GUI } from "https://cdn.skypack.dev/pin/three@v0.129.0-chk6X8RSBl37CcZQlxof/mode=imports,min/unoptimized/examples/jsm/libs/dat.gui.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/pin/three@v0.129.0-chk6X8RSBl37CcZQlxof/mode=imports,min/unoptimized/examples/jsm/loaders/GLTFLoader.js";
import {
    CSS2DObject,
    CSS2DRenderer
} from "https://cdn.skypack.dev/pin/three@v0.129.0-chk6X8RSBl37CcZQlxof/mode=imports,min/unoptimized/examples/jsm/renderers/CSS2DRenderer.js";
import { CameraHelperArc } from "./CameraHelperArc.js";
window.THREE = THREE;

function main() {
    let renderer, scene, camera, labelRenderer;
    let activeCamera;

    let spotLight, lightHelper, shadowCameraHelper;
    let sensor1, sensorHelper1;
    let sensor2, sensorHelper2;
    let checkerboardTexture, gridHelper, checkerboard;
    let checkerboardTexture2, checkerboard2;
    let wallGroup, propGroup;

    let sensor1MinRangeLabel, sensor1MaxRangeLabel, sensor2MinRangeLabel, sensor2MaxRangeLabel;

    let _preventExtraRenders = false;

    let gui;
    let farController,
        nearController,
        sensor1Controller,
        sensor2Controller,
        fovController,
        aspectController,
        propDistanceController,
        checkerboardDistanceController,
        gridSizeController;

    const FLOOR_WIDTH = 60;

    function init() {
        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        renderer.shadowMap.enabled = true;

        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputEncoding = THREE.sRGBEncoding;

        labelRenderer = new CSS2DRenderer();
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.domElement.style.position = "absolute";
        labelRenderer.domElement.style.top = "0px";
        document.body.appendChild(labelRenderer.domElement);

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(-4, 3, -3);
        const lookAtTarget = new THREE.Vector3(2, 2, 0);

        sensor1 = new THREE.PerspectiveCamera(30, 16.0 / 9.0, 1, 1000);
        sensor1.position.set(0, 1, 0);
        sensor1.rotateY(-Math.PI / 2);
        sensor1.near = 0.5;
        sensor1.far = 10;
        scene.add(sensor1);

        sensor2 = new THREE.PerspectiveCamera(30, 16.0 / 9.0, 1, 1000);
        sensor2.position.set(0, 1, 0);
        sensor2.rotateY(-Math.PI / 2);
        sensor2.near = 0.5;
        sensor2.far = 10;
        sensor2.visible = false;
        scene.add(sensor2);

        gridHelper = new THREE.GridHelper(
            FLOOR_WIDTH,
            FLOOR_WIDTH,
            new THREE.Color(0x333333),
            new THREE.Color(0x333333)
        );
        gridHelper.rotateZ(Math.PI / 2);
        gridHelper.position.set(0, 0, 0);

        // const polarGridHelper = new THREE.PolarGridHelper(200, 16, 8, 64, 0x0000ff, 0x808080);
        // polarGridHelper.position.y = - 150;
        // polarGridHelper.position.x = 200;
        // scene.add(polarGridHelper);

        // const axesHelper = new THREE.AxesHelper(5);
        // axesHelper.position.set(0, 0.01, 0);
        // scene.add(axesHelper);

        const controls = new OrbitControls(camera, labelRenderer.domElement);
        controls.addEventListener("change", render);
        // controls.minDistance = 20;
        controls.maxDistance = 100;
        controls.enablePan = true;
        controls.target = lookAtTarget;
        // Need to set camera lookat *after* creating OrbitControls, otherwise
        // it looks at the origin.
        camera.lookAt(lookAtTarget);
        activeCamera = camera;

        const ambient = new THREE.AmbientLight(0xffffff, 0.1);
        scene.add(ambient);

        propGroup = new THREE.Group();
        propGroup.position.set(8, 0, 0);
        scene.add(propGroup);

        const sensor1Colors = [0xffaa00, 0xff0000, 0xffffff, 0x333333];
        const sensor2Colors = [0x00aaff, 0x0000ff, 0xffffff, 0x333333];
        sensorHelper1 = new CameraHelperArc(sensor1, sensor1Colors);
        scene.add(sensorHelper1);
        sensorHelper2 = new CameraHelperArc(sensor2, sensor2Colors);
        sensorHelper2.visible = false;
        scene.add(sensorHelper2);

        const geometry = new THREE.PlaneGeometry(FLOOR_WIDTH, FLOOR_WIDTH, 1, 1);
        const textureLoader = new THREE.TextureLoader();
        checkerboardTexture = textureLoader.load("assets/checkerboard.png", function(texture) {
            checkerboardTexture.wrapS = checkerboardTexture.wrapT = THREE.RepeatWrapping;
            // div by 2 because texture is 2x2 pixels in size
            checkerboardTexture.repeat.set(FLOOR_WIDTH / 2, FLOOR_WIDTH / 2);
            checkerboardTexture.magFilter = THREE.NearestFilter;
            const meshMaterial = new THREE.MeshPhongMaterial({
                color: 0x080808,
                map: checkerboardTexture,
                shininess: 5,
            });
            checkerboard = new THREE.Mesh(geometry, meshMaterial);
            checkerboard.rotateX(-Math.PI / 2);
            checkerboard.rotateZ(-Math.PI / 2);
            // Move down 0.01 m. so that wall grid always renders above the
            // floor (avoid Z-fighting).
            checkerboard.position.set(10, -0.01, 0);
            checkerboard.receiveShadow = true;
            scene.add(checkerboard);
            render();
        });
        /*
                const geometry2 = new THREE.PlaneGeometry(FLOOR_WIDTH, FLOOR_WIDTH, 1, 1);
                checkerboardTexture2 = textureLoader.load("assets/checkerboard.png", function (texture) {
                    checkerboardTexture2.wrapS = checkerboardTexture2.wrapT = THREE.RepeatWrapping;
                    checkerboardTexture2.repeat.set(FLOOR_WIDTH / 2, FLOOR_WIDTH / 2);
                    checkerboardTexture2.magFilter = THREE.NearestFilter;
                    const meshMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, map: checkerboardTexture2, transparent: true, opacity: 0.2, depthWrite: false });
                    checkerboard2 = new THREE.Mesh(geometry, meshMaterial);
                    checkerboard2.rotateY(-Math.PI / 2);
                    checkerboard2.position.set(10, -30, 0);
                    scene.add(checkerboard2);
                    render();
                });
                */

        const wallGeo = new THREE.PlaneGeometry(FLOOR_WIDTH, FLOOR_WIDTH, 1, 1);
        const wallMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.2,
            depthWrite: false,
        });
        const wallMesh = new THREE.Mesh(wallGeo, wallMat);
        wallMesh.rotateY(-Math.PI / 2);
        // scene.add(wallMesh);

        wallGroup = new THREE.Group();
        wallGroup.add(wallMesh);
        wallGroup.add(gridHelper);
        wallGroup.position.set(10, 30, 0);
        scene.add(wallGroup);

        // const group = new THREE.Group();
        // const geometry = new THREE.PlaneGeometry(20, 10, 20, 10);

        // const meshMaterial = new THREE.MeshPhongMaterial({ color: 0x156289, emissive: 0x072534, side: THREE.DoubleSide, flatShading: true });
        // const plane = new THREE.Mesh(geometry, meshMaterial);
        // group.add(plane);

        // const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
        // lineMaterial.depthTest = false;
        // // This approach doesn't render all the line segments for some
        // // reason, so switched to using WireframeGeometry.
        // // const planeLines = new THREE.LineSegments(geometry, lineMaterial);
        // const wireframe = new THREE.WireframeGeometry(geometry);
        // const planeLines = new THREE.LineSegments(wireframe, lineMaterial);
        // group.add(planeLines);

        // group.rotateX(-Math.PI / 2);
        // group.position.set(5, 0, 0);
        // scene.add(group);

        // Objects in scene
        const crate = new THREE.BoxGeometry(1, 1, 1);
        textureLoader.load("assets/crate.gif", function(texture) {
            const material2 = new THREE.MeshPhongMaterial({ map: texture });
            const mesh = new THREE.Mesh(crate, material2);
            mesh.position.set(0.5, 0.5, 1.5);

            mesh.castShadow = true;
            mesh.receiveShadow = true;
            // Even if object origin is outside camera frustum, parts of the
            // model may be visible, so just force it to always render.
            mesh.frustumCulled = false;
            propGroup.add(mesh);
            render();
        });

        // FBX character model
        // const fbxLoader = new FBXLoader();
        // fbxLoader.load('assets/ybot.fbx', function (object) {
        //     // Scale model to height of nearly 2 m.
        //     object.scale.set(0.011, 0.011, 0.011);
        //     object.position.set(0, 0, -2);
        //     object.rotateY(-Math.PI / 2);
        //     object.traverse(function (child) {

        //         if (child.isMesh) {

        //             child.castShadow = true;
        //             child.receiveShadow = true;

        //         }

        //     });
        //     propGroup.add(object);
        // });

        // GLTF character model
        const gltfLoader = new GLTFLoader();
        gltfLoader.load("assets/xbot.glb", function(gltf) {
            const object = gltf.scene;
            object.position.set(0, 0, -1);
            object.rotateY(-Math.PI / 2);
            object.traverse(function(child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    // Even if object origin is outside camera frustum, parts of the
                    // model may be visible, so just force it to always render.
                    child.frustumCulled = false;
                }
            });
            propGroup.add(object);
            render();
        });

        // Add light so the character model isn't shaded completely flat
        const dirLight = new THREE.DirectionalLight(0xffffff);
        dirLight.position.set(-5, 20, 5);
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 30;
        dirLight.shadow.camera.bottom = -30;
        dirLight.shadow.camera.left = -30;
        dirLight.shadow.camera.right = 30;
        scene.add(dirLight);

        // Range labels
        const sensor1MinRangeLabelDiv = document.createElement("div");
        sensor1MinRangeLabelDiv.classList.add("label", "sensor1");
        sensor1MinRangeLabelDiv.textContent = "Min Range: 0.0 m";
        // sensor1MinRangeLabelDiv.style.marginTop = '-1em';
        sensor1MinRangeLabel = new CSS2DObject(sensor1MinRangeLabelDiv);
        sensor1MinRangeLabel.position.set(1, 1, 1);
        scene.add(sensor1MinRangeLabel);

        const sensor1MaxRangeLabelDiv = document.createElement("div");
        sensor1MaxRangeLabelDiv.classList.add("label", "sensor1");
        sensor1MaxRangeLabelDiv.textContent = "Max Range: 0.0 m";
        // sensor1MaxRangeLabelDiv.style.marginTop = '-1em';
        sensor1MaxRangeLabel = new CSS2DObject(sensor1MaxRangeLabelDiv);
        sensor1MaxRangeLabel.position.set(2, 2, 2);
        scene.add(sensor1MaxRangeLabel);

        const sensor2MinRangeLabelDiv = document.createElement("div");
        sensor2MinRangeLabelDiv.classList.add("label", "sensor2");
        sensor2MinRangeLabelDiv.textContent = "Min Range: 0.0 m";
        // sensor2MinRangeLabelDiv.style.marginTop = '-1em';
        sensor2MinRangeLabel = new CSS2DObject(sensor2MinRangeLabelDiv);
        sensor2MinRangeLabel.position.set(1, 1, 1);
        scene.add(sensor2MinRangeLabel);
        sensor2MinRangeLabel.visible = false;

        const sensor2MaxRangeLabelDiv = document.createElement("div");
        sensor2MaxRangeLabelDiv.classList.add("label", "sensor2");
        sensor2MaxRangeLabelDiv.textContent = "Max Range: 0.0 m";
        // sensor2MaxRangeLabelDiv.style.marginTop = '-1em';
        sensor2MaxRangeLabel = new CSS2DObject(sensor2MaxRangeLabelDiv);
        sensor2MaxRangeLabel.position.set(2, 2, 2);
        scene.add(sensor2MaxRangeLabel);
        sensor2MaxRangeLabel.visible = false;

        render();

        window.addEventListener("resize", onWindowResize);
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
        requestAnimationFrame(render);
    }

    function render() {
        // console.log(performance.now());

        sensor1.updateProjectionMatrix();
        sensorHelper1.update();
        sensor2.updateProjectionMatrix();
        sensorHelper2.update();
        updateRangeTextLabels();

        renderer.render(scene, activeCamera);
        labelRenderer.render(scene, activeCamera);
    }

    function updateRangeTextLabels() {
        // NOTE: Small +/- 0.01 adjustments to X coordinate are to ensure
        // the label is inside the camera frustum and can render when
        // viewing through the camera (though we hide min-range labels when
        // viewing through the camera).

        // Sensor 1
        const sensor1Coords = sensorHelper1.geometry.getAttribute("position");
        // console.log(`Min: ${-coords.getZ(sensor1Near)}, ${coords.getY(sensor1Near)}, ${coords.getX(sensor1Near)}`);

        const sensor1Near = sensorHelper1.pointMap["c"][0];
        sensor1MinRangeLabel.position.set(-sensor1Coords.getZ(sensor1Near) + 0.01,
            sensor1Coords.getY(sensor1Near) + sensor1.position.y,
            sensor1Coords.getX(sensor1Near)
        );
        sensor1MinRangeLabel.element.textContent = `Min Range: ${sensor1.near.toFixed(1)} m.`;

        const sensor1Far = sensorHelper1.pointMap["t"][0];
        sensor1MaxRangeLabel.position.set(-sensor1Coords.getZ(sensor1Far) - 0.01,
            sensor1Coords.getY(sensor1Far) + sensor1.position.y,
            sensor1Coords.getX(sensor1Far)
        );
        sensor1MaxRangeLabel.element.textContent = `Max Range: ${sensor1.far.toFixed(1)} m.`;

        // Sensor 2
        const sensor2Coords = sensorHelper2.geometry.getAttribute("position");

        const sensor2Near = sensorHelper2.pointMap["c"][0];
        sensor2MinRangeLabel.position.set(-sensor2Coords.getZ(sensor2Near) + 0.01,
            sensor2Coords.getY(sensor2Near) + sensor2.position.y,
            sensor2Coords.getX(sensor2Near)
        );
        sensor2MinRangeLabel.element.textContent = `Min Range: ${sensor2.near.toFixed(1)} m.`;

        const sensor2Far = sensorHelper1.pointMap["t"][0];
        sensor2MaxRangeLabel.position.set(-sensor2Coords.getZ(sensor2Far) - 0.01,
            sensor2Coords.getY(sensor2Far) + sensor2.position.y,
            sensor2Coords.getX(sensor2Far)
        );
        sensor2MaxRangeLabel.element.textContent = `Max Range: ${sensor2.far.toFixed(1)} m.`;

        if (activeCamera == sensor1) {
            sensor1MinRangeLabel.visible = false;
            sensor1MaxRangeLabel.element.style.marginTop = "2em";
            sensor1MaxRangeLabel.element.style.marginLeft = "-6em";
            sensor2MinRangeLabel.visible = false;
            sensor2MaxRangeLabel.element.style.marginTop = "4em";
            sensor2MaxRangeLabel.element.style.marginLeft = "-6em";
        } else {
            /* revert to style in main.css */
            sensor1MinRangeLabel.visible = true;
            sensor1MaxRangeLabel.element.style.marginTop = "";
            sensor1MaxRangeLabel.element.style.marginLeft = "";
            sensor2MinRangeLabel.visible = sensor2.shouldBeVisible;
            sensor2MaxRangeLabel.element.style.marginTop = "";
            sensor2MaxRangeLabel.element.style.marginLeft = "";
        }
    }

    function dtr(d) {
        return (d * Math.PI) / 180;
    }

    function rtd(r) {
        return (r * 180) / Math.PI;
    }

    function maxNear(far) {
        return Math.min(far / 2, 5);
    }

    function aspectFromFov(horizFov, vertFov) {
        return Math.tan(dtr(horizFov / 2)) / Math.tan(dtr(vertFov / 2));
    }

    const sensors = {
        "Intel RealSense D415": { horizFov: 65, vertFov: 40, minRange: 0.3, maxRange: 10 },
        "Intel RealSense D435/D435i": { horizFov: 87, vertFov: 58, minRange: 0.2, maxRange: 10 },
        "Intel RealSense D455": { horizFov: 87, vertFov: 58, minRange: 0.6, maxRange: 10 },
        "Structure Core Mono": { horizFov: 59, vertFov: 46, minRange: 0.3, maxRange: 10 },
        "Structure Core RGB": { horizFov: 59, vertFov: 46, minRange: 0.3, maxRange: 10 },
        "Mynt Eye S S210": { horizFov: 95, vertFov: 50, minRange: 0.5, maxRange: 7 },
        "Mynt Eye S S1030": { horizFov: 122, vertFov: 76, minRange: 0.5, maxRange: 18 },
        "Mynt Eye D D1000-120": { horizFov: 105, vertFov: 58, minRange: 0.3, maxRange: 10 },
        "Mynt Eye D D1000-50": { horizFov: 64, vertFov: 38, minRange: 0.5, maxRange: 15 },
        "Mynt Eye D 1200": { horizFov: 59, vertFov: 35, minRange: 0.2, maxRange: 3 },
        "Mynt Eye P": { horizFov: 75, vertFov: 40, minRange: 0.2, maxRange: 4.2 },
        "Orbbec Astra +": { horizFov: 55, vertFov: 45, minRange: 0.6, maxRange: 8 },
        "Orbbec Astra + S": { horizFov: 55, vertFov: 45, minRange: 0.4, maxRange: 2 },
        "Orbbec Astra Stereo S U3": { horizFov: 68, vertFov: 45, minRange: 0.25, maxRange: 2.5 },
        "Orbbec Astra Embedded S": { horizFov: 68, vertFov: 45, minRange: 0.25, maxRange: 1.5 },
        "Orbbec Astra": { horizFov: 60, vertFov: 50, minRange: 0.6, maxRange: 8 },
        "Orbbec Astra S": { horizFov: 60, vertFov: 50, minRange: 0.4, maxRange: 2 },
        "Orbbec Astra Pro": { horizFov: 60, vertFov: 50, minRange: 0.6, maxRange: 8 },
        "Orbbec Astra Mini": { horizFov: 60, vertFov: 50, minRange: 0.6, maxRange: 5 },
        "Orbbec Astra Mini S": { horizFov: 60, vertFov: 50, minRange: 0.35, maxRange: 1 },
        "Orbbec Astra Persee": { horizFov: 60, vertFov: 49, minRange: 0.6, maxRange: 8 },
        "StereoLabs Zed": { horizFov: 90, vertFov: 60, minRange: 0.3, maxRange: 25 },
        "StereoLabs Zed 2": { horizFov: 110, vertFov: 70, minRange: 0.2, maxRange: 20 },
        "StereoLabs Zed Mini": { horizFov: 90, vertFov: 60, minRange: 0.1, maxRange: 15 },
        "Luxonis OAK-D": { horizFov: 72, vertFov: 45, minRange: 0.2, maxRange: 20 },
        "pmd Pico Flexx": { horizFov: 62, vertFov: 45, minRange: 0.1, maxRange: 4 },
        "pmd Pico Monstar": { horizFov: 100, vertFov: 85, minRange: 0.5, maxRange: 6 },
        "Azure Kinect (Narrow FOV Mode)": { horizFov: 75, vertFov: 65, minRange: 0.5, maxRange: 5.5 },
        "Azure Kinect (Wide FOV Mode)": { horizFov: 120, vertFov: 120, minRange: 0.25, maxRange: 2.9 },
    };

    function buildGui() {
        gui = new GUI();

        const params = {
            "min range (m.)": sensor1.near,
            "max range (m.)": sensor1.far,
            "vertical fov (°)": sensor1.fov,
            "aspect ratio": sensor1.aspect,
            "sensor1 (yellow)": "rs1",
            "sensor2 (cyan)": "rs1",
            "view from camera": false,
            "show props": true,
            "prop dist (m.)": propGroup.position.x,
            "wall dist (m.)": wallGroup.position.x,
            "grid size (m.)": 1,
        };

        sensor1Controller = gui
            .add(params, "sensor1 (yellow)", Object.keys(sensors))
            .onChange(function(val) {
                console.log(`sensor1=${val}`);
                const params = sensors[val];

                _preventExtraRenders = true;
                nearController.setValue(params["minRange"]);
                farController.setValue(params["maxRange"]);
                fovController.setValue(params["vertFov"]);
                const aspect = aspectFromFov(params["horizFov"], params["vertFov"]);
                aspectController.setValue(aspect);
                requestAnimationFrame(render);
                _preventExtraRenders = false;
            });

        sensor2Controller = gui
            .add(params, "sensor2 (cyan)", ["None", ...Object.keys(sensors)])
            .onChange(function(val) {
                if (val === "None") {
                    sensor2.shouldBeVisible = false;
                    sensor2.visible = false;
                    sensorHelper2.visible = false;
                    sensor2MinRangeLabel.visible = false;
                    sensor2MaxRangeLabel.visible = false;
                    requestAnimationFrame(render);
                } else {
                    sensor2.shouldBeVisible = true;
                    sensor2.visible = true;
                    sensorHelper2.visible = true;
                    sensor2MinRangeLabel.visible = true;
                    sensor2MaxRangeLabel.visible = true;

                    console.log(`sensor2=${val}`);
                    const params = sensors[val];

                    _preventExtraRenders = true;
                    sensor2.near = params["minRange"];
                    sensor2.far = params["maxRange"];
                    sensor2.fov = params["vertFov"];
                    sensor2.aspect = aspectFromFov(params["horizFov"], params["vertFov"]);
                    requestAnimationFrame(render);
                    _preventExtraRenders = false;
                }
            });

        checkerboardDistanceController = gui
            .add(params, "wall dist (m.)", 0.1, 30.0, 0.1)
            .onChange(function(val) {
                wallGroup.position.set(val, 30, 0);
                // checkerboard2.position.set(val, -30, 0);
                if (!_preventExtraRenders) requestAnimationFrame(render);
            });

        gridSizeController = gui.add(params, "grid size (m.)", 0.01, 2, 0.01).onChange(function(val) {
            // Texture is 2x2 in pixels.
            // To have a 1m grid size (the plane is 60m square), the texture must be scaled by 60m/1m/2.
            const scalar = FLOOR_WIDTH / val / 2;
            checkerboardTexture.repeat.set(scalar, scalar);

            // checkerboardTexture2.repeat.set(scalar, scalar);

            // Remove and re-create the gridHelper with the new grid size.
            wallGroup.remove(gridHelper);
            gridHelper = new THREE.GridHelper(
                FLOOR_WIDTH,
                FLOOR_WIDTH / val,
                new THREE.Color(0x333333),
                new THREE.Color(0x333333)
            );
            // gridHelper.position.set(checkerboardDistanceController.getValue(), 30, 0);
            gridHelper.rotateZ(Math.PI / 2);
            gridHelper.position.set(0, 0, 0);
            wallGroup.add(gridHelper);

            if (!_preventExtraRenders) requestAnimationFrame(render);
        });

        const sensor1Folder = gui.addFolder("Advanced Sensor1 Controls");

        nearController = sensor1Folder
            .add(params, "min range (m.)", 0.1, maxNear(sensor1.far), 0.1)
            .onChange(function(val) {
                sensor1.near = val;
                farController.min(val + 1);
                farController.updateDisplay();
                if (!_preventExtraRenders) requestAnimationFrame(render);
            });

        farController = sensor1Folder
            .add(params, "max range (m.)", sensor1.near + 1, 40, 0.1)
            .onChange(function(val) {
                sensor1.far = val;
                nearController.max(maxNear(val));
                nearController.updateDisplay();
                if (!_preventExtraRenders) requestAnimationFrame(render);
            });

        fovController = sensor1Folder.add(params, "vertical fov (°)", 10, 179).onChange(function(val) {
            sensor1.fov = val;
            if (!_preventExtraRenders) requestAnimationFrame(render);
        });

        aspectController = sensor1Folder.add(params, "aspect ratio", 0.4, 5.0).onChange(function(val) {
            sensor1.aspect = val;
            if (!_preventExtraRenders) requestAnimationFrame(render);
        });

        const sceneFolder = gui.addFolder("Advanced Scene Controls");

        propDistanceController = sceneFolder
            .add(params, "prop dist (m.)", 0, 30.0, 0.1)
            .onChange(function(val) {
                propGroup.position.set(val, 0, 0);
                if (!_preventExtraRenders) requestAnimationFrame(render);
            });

        sceneFolder.add(params, "show props").onChange(function(val) {
            propGroup.visible = val;
            requestAnimationFrame(render);
        });

        sceneFolder.add(params, "view from camera").onChange(function(val) {
            if (val) {
                activeCamera = sensor1;
            } else {
                activeCamera = camera;
            }
            requestAnimationFrame(render);
        });

        gui.open();
    }

    init();

    buildGui();

    sensor1Controller.setValue("Intel RealSense D415");
    sensor2Controller.setValue("None");
    // Setting sensor triggers a render already.
    // render();
}

export { main };