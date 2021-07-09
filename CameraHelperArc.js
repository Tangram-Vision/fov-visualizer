// Copyright 2021 Tangram Vision
//
// Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


import * as THREE from 'https://cdn.skypack.dev/pin/three@v0.129.0-chk6X8RSBl37CcZQlxof/mode=imports,min/optimized/three.js';

const _vector = /*@__PURE__*/ new THREE.Vector3();
const _camera = /*@__PURE__*/ new THREE.Camera();
const _curve = /*@__PURE__*/ new THREE.EllipseCurve();

/**
 * Example of regular CameraHelper behavior:
 * https://threejs.org/examples/#webgl_lights_spotlight
 *
 * This file changes CameraHelper behavior to have arced near/far frustum
 * boundaries, because we care about sensor max range. The regular CameraHelper
 * displays a rectangular pyramid frustum, so the distance from camera to the
 * middle of the frustum's "far" plane (the sensor's max range) can be much
 * smaller than the distance from the camera to the far edges/corners of the
 * frustum for large FOVs. As an example, a sensor with a 10m max range and
 * 120-degree horizontal FOV can see 11.5m to the left/right edges of the
 * frustum, according to the regular CameraHelper. This CameraHelperArc ensures
 * the *entire* far frustum boundary has a distance of "max sensor range" (e.g.
 * 10m) from the camera.
 *
 * Fundamentally, this implementation uses trigonometry to figure out the
 * frustum edge coordinates at the correct distances (sensor max and min
 * ranges). To do so, we calculate the coordinates (x,z) in the diagram below,
 * knowing the angle and the hypotenuse (which is the sensor's max or min
 * range).
 *
 *     far frustum midpoint         far frustum right edge
 *    (e.g. sensor max range)     (beyond sensor max range!)
 *        (0,Z) o-------------------------o (X,Z)
 *              |                        /
 *              |                       /
 *              |                      /
 *              |                     /
 *              |                    /
 *              |                   /
 *              |                  o  (x,z)
 *              |                 /   where sqrt(x^2 + z^2) = Z
 *              |                /    i.e. the distance from the camera to here
 *              |               /     is the same as the distance from the
 *              |              /      camera to the far frustum midpoint (this
 *              |             /       is at the sensor max range)
 *              |            /
 *              |           /
 *              |          /
 *              |         /
 *              |        /
 *              |       /
 *              |      /
 *              |     /
 *              |    /
 *              |   /
 *              |  /
 *              | /
 *              |/  <-- This angle is half of the horizontal FOV
 *              o <-- Camera
 *
 * Then we draw a curve between the endpoints. The curve also goes through the
 * center of the frustum "plane" (which is no longer visualized as a plane).
 */

class CameraHelperArc extends THREE.LineSegments {

    constructor(camera, themeColors) {

        const geometry = new THREE.BufferGeometry();
        const material = new THREE.LineBasicMaterial({ color: 0xffffff, vertexColors: true, toneMapped: false });

        const vertices = [];
        const colors = [];

        const pointMap = {};
        const farCurvePoints = 40;
        const nearCurvePoints = 10;

        // colors

        let colorFrustum, colorCone, colorTarget, colorCross;
        if (themeColors) {
            colorFrustum = new THREE.Color(themeColors[0]);
            colorCone = new THREE.Color(themeColors[1]);
            colorTarget = new THREE.Color(themeColors[2]);
            colorCross = new THREE.Color(themeColors[3]);
        }
        else {
            colorFrustum = new THREE.Color(0xffaa00);
            colorCone = new THREE.Color(0xff0000);
            // colorUp = new THREE.Color(0x00aaff);
            colorTarget = new THREE.Color(0xffffff);
            colorCross = new THREE.Color(0x333333);
        }

        // sides

        addLine('n1', 'f1', colorFrustum);
        addLine('n2', 'f2', colorFrustum);
        addLine('n3', 'f3', colorFrustum);
        addLine('n4', 'f4', colorFrustum);

        // cone

        addLine('p', 'n1', colorCone);
        addLine('p', 'n2', colorCone);
        addLine('p', 'n3', colorCone);
        addLine('p', 'n4', colorCone);

        // target

        addLine('c', 't', colorTarget);
        addLine('p', 'c', colorCross);

        // cross

        // addLine('cn1', 'cn2', colorCross);
        // addLine('cn3', 'cn4', colorCross);
        addLine('cf1', 'cf2', colorCross);
        addLine('cf3', 'cf4', colorCross);

        // far cross arcs
        addCurve('fh', colorFrustum);
        addCurve('fv', colorFrustum);

        // near cross arcs
        addCurve('nh', colorFrustum);
        addCurve('nv', colorFrustum);

        function addCurve(direction, color) {
            const curvePoints = (direction.startsWith('f')) ? farCurvePoints : nearCurvePoints;
            for (let i = 0; i < curvePoints; i++) {
                addLine(`${direction}-${i}`, `${direction}-${i + 1}`, color);
            }
        }

        function addLine(a, b, color) {

            addPoint(a, color);
            addPoint(b, color);

        }

        function addPoint(id, color) {

            vertices.push(0, 0, 0);
            colors.push(color.r, color.g, color.b);

            if (pointMap[id] === undefined) {

                pointMap[id] = [];

            }

            pointMap[id].push((vertices.length / 3) - 1);

        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        super(geometry, material);

        this.type = 'CameraHelperArc';

        this.camera = camera;
        if (this.camera.updateProjectionMatrix) this.camera.updateProjectionMatrix();

        this.matrix = camera.matrixWorld;
        this.matrixAutoUpdate = false;

        this.pointMap = pointMap;
        this.farCurvePoints = farCurvePoints;
        this.nearCurvePoints = nearCurvePoints;

        this.update();

    }

    update() {

        const geometry = this.geometry;
        const pointMap = this.pointMap;

        const w = 1, h = 1;

        _camera.projectionMatrixInverse.copy(this.camera.projectionMatrixInverse);
        _camera.projectionMatrix.copy(this.camera.projectionMatrix);

        // center / target

        setPoint('c', pointMap, geometry, _camera, 0, 0, - 1);
        setPoint('t', pointMap, geometry, _camera, 0, 0, 1);

        // near arced
        const nearZ = calcFrustumProjectedArcCoordZ("near", _camera);
        setPoint('n1', pointMap, geometry, _camera, w, 0, nearZ["horizontal"]);
        setPoint('n2', pointMap, geometry, _camera, 0, h, nearZ["vertical"]);
        setPoint('n3', pointMap, geometry, _camera, - w, 0, nearZ["horizontal"]);
        setPoint('n4', pointMap, geometry, _camera, 0, -h, nearZ["vertical"]);

        // far arced
        const farZ = calcFrustumProjectedArcCoordZ("far", _camera);
        setPoint('f1', pointMap, geometry, _camera, w, 0, farZ["horizontal"]);
        setPoint('f2', pointMap, geometry, _camera, 0, h, farZ["vertical"]);
        setPoint('f3', pointMap, geometry, _camera, - w, 0, farZ["horizontal"]);
        setPoint('f4', pointMap, geometry, _camera, 0, -h, farZ["vertical"]);

        // cross

        setPoint('cf1', pointMap, geometry, _camera, - w, 0, 1);
        setPoint('cf2', pointMap, geometry, _camera, w, 0, 1);
        setPoint('cf3', pointMap, geometry, _camera, 0, - h, 1);
        setPoint('cf4', pointMap, geometry, _camera, 0, h, 1);

        setPoint('cn1', pointMap, geometry, _camera, - w, 0, - 1);
        setPoint('cn2', pointMap, geometry, _camera, w, 0, - 1);
        setPoint('cn3', pointMap, geometry, _camera, 0, - h, - 1);
        setPoint('cn4', pointMap, geometry, _camera, 0, h, - 1);

        // cross arcs
        setCurvePoints('n1', 'n3', 'nh', pointMap, geometry, this.nearCurvePoints);
        setCurvePoints('n2', 'n4', 'nv', pointMap, geometry, this.nearCurvePoints);
        setCurvePoints('f1', 'f3', 'fh', pointMap, geometry, this.farCurvePoints);
        setCurvePoints('f2', 'f4', 'fv', pointMap, geometry, this.farCurvePoints);

        geometry.getAttribute('position').needsUpdate = true;

    }

    dispose() {

        this.geometry.dispose();
        this.material.dispose();

    }

}

// Dunno how to make curves in camera space, so doing it in world/unprojected space
function setCurvePoints(pointA, pointB, direction, pointMap, geometry, curvePointsCount) {

    const pointsA = pointMap[pointA];
    const pointsB = pointMap[pointB];

    if (pointsA !== undefined && pointsB !== undefined && pointsA.length > 0 && pointsB.length > 0) {

        const a = pointsA[0];
        const b = pointsB[0];

        const position = geometry.getAttribute('position');

        const vecA = new THREE.Vector3(position.getX(a), position.getY(a), position.getZ(a));
        const vecB = new THREE.Vector3(position.getX(b), position.getY(b), position.getZ(b));
        const angle = vecA.angleTo(vecB);
        _curve.xRadius = _curve.yRadius = vecA.length();
        _curve.aStartAngle = - angle / 2;
        _curve.aEndAngle = angle / 2;
        const curvePoints = _curve.getPoints(curvePointsCount);

        if (direction.endsWith('h')) {
            for (let i = 0; i < curvePoints.length; i++) {
                const point = curvePoints[i];
                const points = pointMap[`${direction}-${i}`];
                for (let j = 0; j < points.length; j++) {
                    position.setXYZ(points[j], point.y, 0, - point.x);
                }
            }
        }
        else if (direction.endsWith('v')) {
            for (let i = 0; i < curvePoints.length; i++) {
                const point = curvePoints[i];
                const points = pointMap[`${direction}-${i}`];
                for (let j = 0; j < points.length; j++) {
                    position.setXYZ(points[j], 0, point.y, - point.x);
                }
            }
        }
    }

}


function setPoint(point, pointMap, geometry, camera, x, y, z) {

    _vector.set(x, y, z).unproject(camera);

    const points = pointMap[point];

    if (points !== undefined) {

        const position = geometry.getAttribute('position');

        for (let i = 0, l = points.length; i < l; i++) {

            position.setXYZ(points[i], _vector.x, _vector.y, _vector.z);

        }

    }

}

function calcFrustumProjectedArcCoordZ(plane, _camera) {
    const z = (plane === "far") ? 1 : -1;
    _vector.set(0, 0, z).unproject(_camera);
    const radius = Math.abs(_vector.z);

    _vector.set(1, 0, z).unproject(_camera);
    // TODO: Why is the z-coord negative? Do I need to do something else with the camera's orientation?
    _vector.z = Math.abs(_vector.z);
    const hfov_half = Math.atan2(_vector.x, _vector.z);
    const hx = radius * Math.sin(hfov_half);
    const hz = radius * Math.cos(hfov_half);

    _vector.set(0, 1, z).unproject(_camera);
    // TODO: Why is the z-coord negative? Do I need to do something else with the camera's orientation?
    _vector.z = Math.abs(_vector.z);
    const vfov_half = Math.atan2(_vector.y, _vector.z);
    const vy = radius * Math.sin(vfov_half);
    const vz = radius * Math.cos(vfov_half);

    // Flip z-coord back to negative while projecting.
    // TODO: Fix this, like the above TODOs
    const hProjectZ = _vector.set(hx, 0, -hz).project(_camera).z;
    const vProjectZ = _vector.set(0, vy, -vz).project(_camera).z;
    return { "horizontal": hProjectZ, "vertical": vProjectZ };
}

export { CameraHelperArc };
