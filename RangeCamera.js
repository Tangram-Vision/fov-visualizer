import * as THREE from "https://cdn.skypack.dev/pin/three@v0.129.0-chk6X8RSBl37CcZQlxof/mode=imports,min/optimized/three.js";

// Returns a line segment object that shows arcs of vision
// - Create a sphere for near range
// - Wrap around horizontally for as far as range is
// - Create planes vertically for vfov (with some geometry)
// - Repeat for far range
class RangeCamera extends THREE.Group {
    constructor(sensor_info, sensor_colors) {
        console.log(sensor_info);
        const horizFovInRad = (sensor_info["horizFov"] * Math.PI) / 180;
        const vertFovInRad = (sensor_info["vertFov"] * Math.PI) / 180;
        const nearRange = sensor_info["minRange"];
        const farRange = sensor_info["maxRange"];
        // We can't have a vertical FOV above 180*
        if (vertFovInRad > Math.PI) {
            vertFovInRad = Math.PI;
        }
        if (vertFovInRad < 0) {
            vertFovInRad = 0;
        }
        // We can't have a horizontal FOV above 360*
        if (horizFovInRad > 2 * Math.PI) {
            horizFovInRad = 2 * Math.PI;
        }
        if (horizFovInRad < 0) {
            horizFovInRad = 0;
        }

        const nearGroup = createFrustumGroup(vertFovInRad, horizFovInRad, nearRange, 0xff0000, 0);
        const farGroup = createFrustumGroup(vertFovInRad, horizFovInRad, farRange, 0xffff00, nearRange);
        // const cameraGroup = new THREE.Group();
        super();
        this.add(nearGroup);
        this.add(farGroup);
        this.type = "RangeCamera";
    }
}

function createFrustumGroup(vertFovInRad, horizFovInRad, range, frustumColor, minRange) {
    const widthSegments = 32;
    const heightSegments = 16;
    const phiStart = Math.PI;
    const phiLength = horizFovInRad;
    const thetaStart = Math.PI / 2 - vertFovInRad / 2;
    const thetaLength = vertFovInRad;

    const sphereGeometry = new THREE.SphereGeometry(
        range,
        widthSegments,
        heightSegments,
        phiStart,
        phiLength,
        thetaStart,
        thetaLength
    );
    const sphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x666666,
        side: THREE.DoubleSide,
        opacity: 0.3,
        transparent: true,
    });
    const rangeSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    rangeSphere.rotateY(-horizFovInRad / 2);

    // frustum vfov and hfov rings
    const ringInnerRad = range - 0.02;
    const ringOuterRad = range + 0.02;
    const ringThetaSegments = 50;
    const ringPhiSegments = 1;
    const hRingThetaStart = horizFovInRad / 2;
    const hRingThetaLength = horizFovInRad;
    const hRingGeometry = new THREE.RingGeometry(
        ringInnerRad,
        ringOuterRad,
        ringThetaSegments,
        ringPhiSegments,
        hRingThetaStart,
        hRingThetaLength
    );
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: frustumColor,
        side: THREE.DoubleSide,
    });
    const ringHfov = new THREE.Mesh(hRingGeometry, ringMaterial);
    ringHfov.rotateX(Math.PI / 2);
    ringHfov.rotateZ(-horizFovInRad);

    const vRingThetaStart = vertFovInRad / 2;
    const vRingThetaLength = vertFovInRad;
    const vRingGeometry = new THREE.RingGeometry(
        ringInnerRad,
        ringOuterRad,
        ringThetaSegments,
        ringPhiSegments,
        vRingThetaStart,
        vRingThetaLength
    );
    const ringVfov = new THREE.Mesh(vRingGeometry, ringMaterial);
    ringVfov.rotateZ(-vertFovInRad);

    // Lines to the outer edges of our sphere
    const lineMaterial = new THREE.LineBasicMaterial({
        color: frustumColor,
    });

    // Horizontal bounds
    const hFrustumMinOpp = minRange * Math.sin(horizFovInRad / 2);
    const hFrustumMinAdj = minRange * Math.cos(horizFovInRad / 2);
    const hFrustumMaxOpp = range * Math.sin(horizFovInRad / 2);
    const hFrustumMaxAdj = range * Math.cos(horizFovInRad / 2);

    // Vertical bounds
    const vFrustumMinOpp = minRange * Math.sin(vertFovInRad / 2);
    const vFrustumMinAdj = minRange * Math.cos(vertFovInRad / 2);
    const vFrustumMaxOpp = range * Math.sin(vertFovInRad / 2);
    const vFrustumMaxAdj = range * Math.cos(vertFovInRad / 2);

    const rightLineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(hFrustumMinAdj, 0, hFrustumMinOpp),
        new THREE.Vector3(hFrustumMaxAdj, 0, hFrustumMaxOpp),
    ]);
    const rightLine = new THREE.Line(rightLineGeometry, lineMaterial);
    const leftLineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(hFrustumMinAdj, 0, -hFrustumMinOpp),
        new THREE.Vector3(hFrustumMaxAdj, 0, -hFrustumMaxOpp),
    ]);
    const leftLine = new THREE.Line(leftLineGeometry, lineMaterial);
    const upLineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(vFrustumMinAdj, vFrustumMinOpp, 0),
        new THREE.Vector3(vFrustumMaxAdj, vFrustumMaxOpp, 0),
    ]);
    const upLine = new THREE.Line(upLineGeometry, lineMaterial);
    const downLineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(vFrustumMinAdj, -vFrustumMinOpp, 0),
        new THREE.Vector3(vFrustumMaxAdj, -vFrustumMaxOpp, 0),
    ]);
    const downLine = new THREE.Line(downLineGeometry, lineMaterial);
    const centerLineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(minRange, 0, 0),
        new THREE.Vector3(range, 0, 0),
    ]);
    const centerLine = new THREE.Line(centerLineGeometry, lineMaterial);

    // Group holding all of our items for this range sphere
    const group = new THREE.Group();
    group.add(rangeSphere);
    group.add(ringHfov);
    group.add(ringVfov);
    group.add(rightLine);
    group.add(leftLine);
    group.add(upLine);
    group.add(downLine);
    group.add(centerLine);

    return group;
}

export { RangeCamera };