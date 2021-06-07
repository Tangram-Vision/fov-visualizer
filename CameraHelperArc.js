import * as THREE from 'https://cdn.skypack.dev/three';

const _vector = /*@__PURE__*/ new THREE.Vector3();
const _camera = /*@__PURE__*/ new THREE.Camera();

/**
 *	- shows frustum, line of sight and up of the camera
 *	- suitable for fast updates
 * 	- based on frustum visualization in lightgl.js shadowmap example
 *		http://evanw.github.com/lightgl.js/tests/shadowmap.html
 */

class CameraHelperArc extends THREE.LineSegments {

    constructor(camera) {

        const geometry = new THREE.BufferGeometry();
        const material = new THREE.LineBasicMaterial({ color: 0xffffff, vertexColors: true, toneMapped: false });

        const vertices = [];
        const colors = [];

        const pointMap = {};

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

        // TODO: make these curved arcs instead
        addLine('cn1', 'cn2', colorCross);
        addLine('cn3', 'cn4', colorCross);

        addLine('cf1', 'cf2', colorCross);
        addLine('cf3', 'cf4', colorCross);

        /*
        function addCurve(a, b, color) {

            _vector.set(x, y, z).unproject(camera);
            const points = pointMap[point];

            addPoint(a, color);
            addPoint(b, color);

            // Eyeballing the ellipse curve for min and max range
            const vertCurve = new THREE.EllipseCurve(
                0, 0,            // ax, aY
                10, 10,           // xRadius, yRadius
                - dtr(20), dtr(20),  // aStartAngle, aEndAngle
                false,            // aClockwise
                0                 // aRotation
            );
            const points2 = vertCurve.getPoints(50);
            const geometry2 = new THREE.BufferGeometry().setFromPoints(points2);
            const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
            // TODO: ellipse is just a bunch of lines... so that could be added
            // to CameraHelperArc's list of points/vertices
            const ellipse = new THREE.Line(geometry2, material);
            ellipse.position.set(cam.position.x, cam.position.y, cam.position.z);
            scene.add(ellipse);

            // Eyeballing the ellipse curve for min and max range
            const horizCurve = new THREE.EllipseCurve(
                0, 0,            // ax, aY
                10, 10,           // xRadius, yRadius
                - dtr(32.5), dtr(32.5),  // aStartAngle, aEndAngle
                false,            // aClockwise
                0                 // aRotation
            );
            const points3 = horizCurve.getPoints(50);
            const geometry3 = new THREE.BufferGeometry().setFromPoints(points3);
            // TODO: ellipse is just a bunch of lines... so that could be added
            // to CameraHelperArc's list of points/vertices
            const ellipse2 = new THREE.Line(geometry3, material);
            ellipse2.rotateX(Math.PI / 2);
            ellipse2.position.set(cam.position.x, cam.position.y, cam.position.z);
            scene.add(ellipse2);

        }
        */

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

        _vector.set(w, 0, 1).unproject(_camera);
        // TODO: Why is the z-coord negative? Do I need to do something else with the camera's orientation?
        _vector.z = Math.abs(_vector.z);
        const hfov_half = Math.atan2(_vector.x, _vector.z);
        const hx = radius * Math.sin(hfov_half);
        const hz = radius * Math.cos(hfov_half);

        _vector.set(0, h, 1).unproject(_camera);
        // TODO: Why is the z-coord negative? Do I need to do something else with the camera's orientation?
        _vector.z = Math.abs(_vector.z);
        const vfov_half = Math.atan2(_vector.y, _vector.z);
        const vy = radius * Math.sin(vfov_half);
        const vz = radius * Math.cos(vfov_half);

        // Flip z-coord back to negative while projecting.
        // TODO: Fix this, like the above TODOs
        const hProjectZ = _vector.set(hx, 0, -hz).project(_camera).z;
        const vProjectZ = _vector.set(0, vy, -vz).project(_camera).z;

        // center / target

        setPoint('c', pointMap, geometry, _camera, 0, 0, - 1);
        setPoint('t', pointMap, geometry, _camera, 0, 0, 1);

        // near

        // setPoint('n1', pointMap, geometry, _camera, - w, - h, - 1);
        // setPoint('n2', pointMap, geometry, _camera, w, - h, - 1);
        // setPoint('n3', pointMap, geometry, _camera, - w, h, - 1);
        // setPoint('n4', pointMap, geometry, _camera, w, h, - 1);

        // TODO: calculate projected distance for near also!
        // TODO: calculate projected distance for near also!
        // TODO: calculate projected distance for near also!
        setPoint('n1', pointMap, geometry, _camera, w, 0, - 1.2);
        setPoint('n2', pointMap, geometry, _camera, 0, h, - 1.2);
        setPoint('n3', pointMap, geometry, _camera, - w, 0, - 1.2);
        setPoint('n4', pointMap, geometry, _camera, 0, -h, - 1.2);

        // far

        // setPoint('f1', pointMap, geometry, _camera, - w, - h, 1);
        // setPoint('f2', pointMap, geometry, _camera, w, - h, 1);
        // setPoint('f3', pointMap, geometry, _camera, - w, h, 1);
        // setPoint('f4', pointMap, geometry, _camera, w, h, 1);
        setPoint('f1', pointMap, geometry, _camera, w, 0, hProjectZ);
        setPoint('f2', pointMap, geometry, _camera, 0, h, vProjectZ);
        setPoint('f3', pointMap, geometry, _camera, - w, 0, hProjectZ);
        setPoint('f4', pointMap, geometry, _camera, 0, -h, vProjectZ);

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

        // TODO: Do something to set unprojected curve coordinates in geometry, don't bother trying to do them in projected coords
        // TODO: Do something to set unprojected curve coordinates in geometry, don't bother trying to do them in projected coords
        // TODO: Do something to set unprojected curve coordinates in geometry, don't bother trying to do them in projected coords
        // TODO: Do something to set unprojected curve coordinates in geometry, don't bother trying to do them in projected coords
        // TODO: Do something to set unprojected curve coordinates in geometry, don't bother trying to do them in projected coords

        geometry.getAttribute('position').needsUpdate = true;

    }

    dispose() {

        this.geometry.dispose();
        this.material.dispose();

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

function dtr(d) {
    return d * Math.PI / 180;
}
function rtd(r) {
    return r * 180 / Math.PI;
}

export { CameraHelperArc };
