import * as THREE from 'https://cdn.skypack.dev/three';

const _vector = /*@__PURE__*/ new THREE.Vector3();
const _camera = /*@__PURE__*/ new THREE.Camera();
const _curve = /*@__PURE__*/ new THREE.EllipseCurve();

/**
 *	- shows frustum, line of sight and up of the camera
 *	- suitable for fast updates
 * 	- based on frustum visualization in lightgl.js shadowmap example
 *		http://evanw.github.com/lightgl.js/tests/shadowmap.html
 *  - greg modified to show a curved frustum at the sensor's max range
 */

class CameraHelperArc extends THREE.LineSegments {

    constructor(camera) {

        const geometry = new THREE.BufferGeometry();
        const material = new THREE.LineBasicMaterial({ color: 0xffffff, vertexColors: true, toneMapped: false });

        const vertices = [];
        const colors = [];

        const pointMap = {};
        const farCurvePoints = 40;
        const nearCurvePoints = 10;

        // colors

        const colorFrustum = new THREE.Color(0xffaa00);
        const colorCone = new THREE.Color(0xff0000);
        const colorUp = new THREE.Color(0x00aaff);
        const colorTarget = new THREE.Color(0xffffff);
        const colorCross = new THREE.Color(0x333333);

        // near

        // addLine('n1', 'n2', colorFrustum);
        // addLine('n2', 'n4', colorFrustum);
        // addLine('n4', 'n3', colorFrustum);
        // addLine('n3', 'n1', colorFrustum);

        // far

        // addLine('f1', 'f2', colorFrustum);
        // addLine('f2', 'f4', colorFrustum);
        // addLine('f4', 'f3', colorFrustum);
        // addLine('f3', 'f1', colorFrustum);

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

        // up

        addLine('u1', 'u2', colorUp);
        addLine('u2', 'u3', colorUp);
        addLine('u3', 'u1', colorUp);

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

        // we need just camera projection matrix inverse
        // world matrix must be identity
        //
        // greg: changed to copying full matrix so fov, heading, etc. are all
        // the same for calculating coordinates of the frustum edge points and
        // arc endpoints

        _camera.projectionMatrixInverse.copy(this.camera.projectionMatrixInverse);
        _camera.projectionMatrix.copy(this.camera.projectionMatrix);
        // Copying world matrix matches _camera to this.camera orientation when
        // projecting/unprojecting, otherwise I get z=-10 for unprojecting the
        // target (middle of the far frustum plane).
        // But, the matrix is being applied twice, I think. This involves
        // `this.matrix = camera.matrixWorld` above.
        // _camera.matrixWorld.copy(this.camera.matrixWorld);
        // _camera.matrixWorldInverse.copy(this.camera.matrixWorldInverse);

        _vector.set(0, 0, 1).unproject(_camera);
        const radius = Math.abs(_vector.z);

        // TODO: Figure out how to make these equations agnostic to the direction of the camera?
        // TODO: Or maybe copy the camera once in the init (before setting
        //       this.matrix), then just copy matrices in this function?
        //
        // TODO: OR, figure out the coord by just by dividing by the camera's NEAR coordinate? That's what the 1/d factor is in the projection, right?
        // TODO: OR, figure out the coord by just by dividing by the camera's NEAR coordinate? That's what the 1/d factor is in the projection, right?
        // TODO: OR, figure out the coord by just by dividing by the camera's NEAR coordinate? That's what the 1/d factor is in the projection, right?
        // see diagram

        // center / target

        setPoint('c', pointMap, geometry, _camera, 0, 0, - 1);
        setPoint('t', pointMap, geometry, _camera, 0, 0, 1);

        // near

        // Rectangular
        // setPoint('n1', pointMap, geometry, _camera, - w, - h, - 1);
        // setPoint('n2', pointMap, geometry, _camera, w, - h, - 1);
        // setPoint('n3', pointMap, geometry, _camera, - w, h, - 1);
        // setPoint('n4', pointMap, geometry, _camera, w, h, - 1);

        // Arced
        const nearZ = calcFrustumProjectedArcCoordZ("near", _camera);
        setPoint('n1', pointMap, geometry, _camera, w, 0, nearZ["horizontal"]);
        setPoint('n2', pointMap, geometry, _camera, 0, h, nearZ["vertical"]);
        setPoint('n3', pointMap, geometry, _camera, - w, 0, nearZ["horizontal"]);
        setPoint('n4', pointMap, geometry, _camera, 0, -h, nearZ["vertical"]);

        // far

        // Rectangular
        // setPoint('f1', pointMap, geometry, _camera, - w, - h, 1);
        // setPoint('f2', pointMap, geometry, _camera, w, - h, 1);
        // setPoint('f3', pointMap, geometry, _camera, - w, h, 1);
        // setPoint('f4', pointMap, geometry, _camera, w, h, 1);

        // Arced
        const farZ = calcFrustumProjectedArcCoordZ("far", _camera);
        setPoint('f1', pointMap, geometry, _camera, w, 0, farZ["horizontal"]);
        setPoint('f2', pointMap, geometry, _camera, 0, h, farZ["vertical"]);
        setPoint('f3', pointMap, geometry, _camera, - w, 0, farZ["horizontal"]);
        setPoint('f4', pointMap, geometry, _camera, 0, -h, farZ["vertical"]);

        // up

        setPoint('u1', pointMap, geometry, _camera, w * 0.7, h * 1.1, - 1);
        setPoint('u2', pointMap, geometry, _camera, - w * 0.7, h * 1.1, - 1);
        setPoint('u3', pointMap, geometry, _camera, 0, h * 2, - 1);

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
