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
import { RangeCamera } from "./RangeCamera.js";
import { sensors } from "./sensors.js";
window.THREE = THREE;

function main() {
    let renderer, scene, camera, labelRenderer, textureLoader;
    let activeCamera;

    let spotLight, lightHelper, shadowCameraHelper;
    let sensor1Info, sensor2Info; // sensor info from sensors.js
    let sensor1, sensor2; // RangeCameras
    let sensor1Colors, sensor2Colors;
    let checkerboardTexture, gridHelper, checkerboard;
    let polarGridGroup;
    // let checkerboardTexture2, checkerboard2;
    let wallGroup, propGroup;

    let sensor1MinRangeLabel, sensor1MaxRangeLabel, sensor2MinRangeLabel, sensor2MaxRangeLabel;

    let _preventExtraRenders = false;

    let gui;
    let farController,
        nearController,
        sensor1Controller,
        sensor2Controller,
        horizFovController,
        vertFovController,
        propDistanceController,
        checkerboardDistanceController,
        gridSizeController;

    const FLOOR_WIDTH = 60;

    function populateProps() {
        propGroup = new THREE.Group();
        propGroup.position.set(8, 0, 0);
        scene.add(propGroup);

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
    }

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

        gridHelper = new THREE.GridHelper(
            FLOOR_WIDTH,
            FLOOR_WIDTH,
            new THREE.Color(0x333333),
            new THREE.Color(0x333333)
        );
        gridHelper.rotateZ(Math.PI / 2);
        gridHelper.position.set(0, 0, 0);

        // Populate the polar grid helper, but don't add.
        // Addition is controlled in the GUI.
        polarGridGroup = new THREE.Group();
        const polarGridHelper = new THREE.PolarGridHelper(
            FLOOR_WIDTH / 2,
            24,
            FLOOR_WIDTH / 2,
            64,
            0x333333,
            0x111111
        );
        polarGridHelper.material.opacity = 0.3;
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(FLOOR_WIDTH, FLOOR_WIDTH),
            new THREE.MeshBasicMaterial({
                color: 0x555555,
                side: THREE.DoubleSide,
                opacity: 0.3,
                transparent: true,
            })
        );
        plane.rotateX(Math.PI / 2);
        polarGridGroup.add(polarGridHelper);
        polarGridGroup.add(plane);

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

        // Add our first sensor
        sensor1Colors = [0xb3e5fc, 0x03a9f4]; // blue tones
        sensor1Info = sensors["Azure Kinect (Narrow FOV Mode)"];
        sensor1 = new RangeCamera(sensor1Info, sensor1Colors);
        sensor1.translateY(1);
        scene.add(sensor1);

        // Add our second comparable sensor, but keep it hidden
        sensor2Colors = [0xf3b533, 0xf8982e]; // orange tones
        sensor2Info = sensors["Azure Kinect (Wide FOV Mode)"];
        sensor2 = new RangeCamera(sensor2Info, sensor2Colors);
        sensor2.visible = false;
        sensor2.translateY(1);
        scene.add(sensor2);

        textureLoader = new THREE.TextureLoader();

        const geometry = new THREE.PlaneGeometry(FLOOR_WIDTH, FLOOR_WIDTH, 1, 1);
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

        populateProps();

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
        renderer.render(scene, activeCamera);
        labelRenderer.render(scene, activeCamera);
    }

    function updateRangeTextLabels() {
        // Sensor 1
        let hFrustumMinOpp = sensor1.nearRange * Math.sin(sensor1.horizFovInRad / 2);
        let hFrustumMinAdj = sensor1.nearRange * Math.cos(sensor1.horizFovInRad / 2);
        let hFrustumMaxOpp = sensor1.farRange * Math.sin(sensor1.horizFovInRad / 2);
        let hFrustumMaxAdj = sensor1.farRange * Math.cos(sensor1.horizFovInRad / 2);

        sensor1MinRangeLabel.position.set(
            sensor1.position.x + hFrustumMinAdj,
            sensor1.position.y + 1,
            sensor1.position.z + hFrustumMinOpp
        );
        sensor1MinRangeLabel.element.textContent = `Min Range: ${sensor1.nearRange.toFixed(1)} m.`;

        sensor1MaxRangeLabel.position.set(
            sensor1.position.x + hFrustumMaxAdj,
            sensor1.position.y + 1,
            sensor1.position.z + hFrustumMaxOpp
        );
        sensor1MaxRangeLabel.element.textContent = `Max Range: ${sensor1.farRange.toFixed(1)} m.`;

        hFrustumMinOpp = sensor2.nearRange * Math.sin(sensor2.horizFovInRad / 2);
        hFrustumMinAdj = sensor2.nearRange * Math.cos(sensor2.horizFovInRad / 2);
        hFrustumMaxOpp = sensor2.farRange * Math.sin(sensor2.horizFovInRad / 2);
        hFrustumMaxAdj = sensor2.farRange * Math.cos(sensor2.horizFovInRad / 2);

        sensor2MinRangeLabel.position.set(
            sensor2.position.x + hFrustumMinAdj,
            sensor2.position.y + 0.5,
            sensor2.position.z + hFrustumMinOpp
        );
        sensor2MinRangeLabel.element.textContent = `Min Range: ${sensor2.nearRange.toFixed(1)} m.`;

        sensor2MaxRangeLabel.position.set(
            sensor2.position.x + hFrustumMaxAdj,
            sensor2.position.y + 0.5,
            sensor2.position.z + hFrustumMaxOpp
        );
        sensor2MaxRangeLabel.element.textContent = `Max Range: ${sensor2.farRange.toFixed(1)} m.`;

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
            sensor2MinRangeLabel.visible = true;
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
        return Math.min(far - 0.5, 5);
    }

    function buildGui() {
        gui = new GUI();

        const params = {
            "min range (m.)": sensor1.nearRange,
            "max range (m.)": sensor1.farRange,
            "vertical fov (°)": rtd(sensor1.vertFovInRad),
            "horizontal fov (°)": rtd(sensor1.horizFovInRad),
            "Open: sensor 1 datasheet": function() {
                if (sensor1Info.datasheetURL) window.open(sensor1Info.datasheetURL);
            },
            "Open: sensor 2 datasheet": function() {
                if (sensor2Info.datasheetURL) window.open(sensor2Info.datasheetURL);
            },
            "sensor1 (blue)": "rs1",
            "sensor2 (orange)": "rs1",
            "show wall": true,
            "show props": true,
            "switch to polar": false,
            "prop dist (m.)": propGroup.position.x,
            "wall dist (m.)": wallGroup.position.x,
            "grid size (m.)": 1,
        };

        sensor1Controller = gui
            .add(params, "sensor1 (blue)", Object.keys(sensors))
            .onChange(function(val) {
                console.log(`sensor1=${val}`);
                scene.remove(sensor1);
                sensor1Info = sensors[val];
                sensor1 = new RangeCamera(sensor1Info, sensor1Colors);
                sensor1.translateY(1);
                scene.add(sensor1);
                updateRangeTextLabels();
                _preventExtraRenders = true;
                requestAnimationFrame(render);
                _preventExtraRenders = false;
            });

        sensor2Controller = gui
            .add(params, "sensor2 (orange)", ["None", ...Object.keys(sensors)])
            .onChange(function(val) {
                if (val === "None") {
                    sensor2.shouldBeVisible = false;
                    sensor2.visible = false;
                    sensor2MinRangeLabel.visible = false;
                    sensor2MaxRangeLabel.visible = false;
                    requestAnimationFrame(render);
                } else {
                    sensor2.shouldBeVisible = true;
                    sensor2.visible = true;
                    sensor2.visible = true;
                    sensor2MinRangeLabel.visible = true;
                    sensor2MaxRangeLabel.visible = true;

                    console.log(`sensor2=${val}`);
                    scene.remove(sensor2);
                    sensor2Info = sensors[val];
                    sensor2 = new RangeCamera(sensor2Info, sensor2Colors);
                    sensor2.translateY(1);
                    scene.add(sensor2);
                    updateRangeTextLabels();

                    _preventExtraRenders = true;
                    requestAnimationFrame(render);
                    _preventExtraRenders = false;
                }
            });

        gui.add(params, "Open: sensor 1 datasheet");
        gui.add(params, "Open: sensor 2 datasheet");

        const sensor1Folder = gui.addFolder("Advanced Sensor1 Controls");

        nearController = sensor1Folder
            .add(params, "min range (m.)", 0.1, maxNear(sensor1.farRange), 0.1)
            .onChange(function(val) {
                sensor1.setNearRange(val);
                // We don't want this to overlap with the farRange
                farController.min(val + 1);
                farController.updateDisplay();
                updateRangeTextLabels();
                if (!_preventExtraRenders) requestAnimationFrame(render);
            });

        farController = sensor1Folder
            .add(params, "max range (m.)", sensor1.nearRange + 1, 40, 0.1)
            .onChange(function(val) {
                sensor1.setFarRange(val);
                // We don't want this to overlap with the nearRange
                nearController.max(maxNear(val));
                nearController.updateDisplay();
                updateRangeTextLabels();
                if (!_preventExtraRenders) requestAnimationFrame(render);
            });

        vertFovController = sensor1Folder
            .add(params, "vertical fov (°)", 10, 179)
            .onChange(function(val) {
                sensor1.setVertFov(dtr(val));
                if (!_preventExtraRenders) requestAnimationFrame(render);
            });

        horizFovController = sensor1Folder
            .add(params, "horizontal fov (°)", 10, 360)
            .onChange(function(val) {
                sensor1.setHorizFov(dtr(val));
                if (!_preventExtraRenders) requestAnimationFrame(render);
            });

        const sceneFolder = gui.addFolder("Advanced Scene Controls");

        checkerboardDistanceController = sceneFolder
            .add(params, "wall dist (m.)", 0.1, 30.0, 0.1)
            .onChange(function(val) {
                wallGroup.position.set(val, 30, 0);
                if (!_preventExtraRenders) requestAnimationFrame(render);
            });

        gridSizeController = sceneFolder
            .add(params, "grid size (m.)", 0.01, 2, 0.01)
            .onChange(function(val) {
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

        propDistanceController = sceneFolder
            .add(params, "prop dist (m.)", 0, 30.0, 0.1)
            .onChange(function(val) {
                propGroup.position.set(val, 0, 0);
                if (!_preventExtraRenders) requestAnimationFrame(render);
            });

        sceneFolder.add(params, "show wall").onChange(function(val) {
            wallGroup.visible = val;
            requestAnimationFrame(render);
        });

        sceneFolder.add(params, "show props").onChange(function(val) {
            propGroup.visible = val;
            requestAnimationFrame(render);
        });

        sceneFolder.add(params, "switch to polar").onChange(function(val) {
            if (val) {
                scene.remove(checkerboard);
                scene.add(polarGridGroup);
            } else {
                scene.remove(polarGridGroup);
                scene.add(checkerboard);
            }
            requestAnimationFrame(render);
        });

        gui.open();
    }

    init();
    buildGui();
    sensor1Controller.setValue("Azure Kinect (Narrow FOV Mode)");
    sensor2Controller.setValue("None");
}

export { main };