import * as THREE from "https://cdn.skypack.dev/pin/three@v0.129.0-chk6X8RSBl37CcZQlxof/mode=imports,min/optimized/three.js";

// Returns a line segment object that shows arcs of vision
// - Create a sphere for near range
// - Wrap around horizontally for as far as range is
// - Create planes vertically for vfov (with some geometry)
// - Repeat for far range
class RangeCamera extends THREE.Group {
    constructor(vertFovInRad, horizFovInRad, nearRange, farRange) {
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

        const nearGroup = createFrustumGroup(
            vertFovInRad,
            horizFovInRad,
            nearRange,
            0xff0000,
            0
        );
        const farGroup = createFrustumGroup(
            vertFovInRad,
            horizFovInRad,
            farRange,
            0xffff00,
            nearRange
        );
        // const cameraGroup = new THREE.Group();
        super();
        this.add(nearGroup);
        this.add(farGroup);
        this.type = "RangeCamera";
    }
}

function createFrustumGroup(
    vertFovInRad,
    horizFovInRad,
    range,
    frustumColor,
    minRange
) {
    const widthSegments = 32;
    const heightSegments = 16;
    const phiStart = -horizFovInRad / 2; // Start rotated around the axis
    const phiLength = horizFovInRad;

    // Clipping planes for vertical FOV restriction
    // TODO: Base these on real geometry
    const clipPlaneHeight = range * Math.sin(vertFovInRad / 2);
    const clipPlanes = [
        new THREE.Plane(new THREE.Vector3(0, -1, 0), clipPlaneHeight),
    ];
    // level them with the camera
    for (const plane of clipPlanes) {
        plane.translate(new THREE.Vector3(0, 1, 0));
    }

    const sphereGeometry = new THREE.SphereGeometry(
        range,
        widthSegments,
        heightSegments,
        phiStart,
        phiLength
    );
    const sphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x666666,
        side: THREE.DoubleSide,
        clippingPlanes: clipPlanes,
        clipIntersection: true,
        opacity: 0.3,
        transparent: true,
    });
    const rangeSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    rangeSphere.rotateY(Math.PI);

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
    ringVfov.rotateY(Math.PI);

    // Lines to the outer edges of our sphere
    const lineMaterial = new THREE.LineBasicMaterial({
        color: frustumColor,
    });

    const frustum_max_x = range * Math.sin(horizFovInRad / 2); // right
    const frustum_max_y = range * Math.sin(vertFovInRad / 2); // up
    const frustum_max_z = range * Math.cos(vertFovInRad / 2); // forward
    const frustum_min_x = minRange * Math.sin(horizFovInRad / 2); // right
    const frustum_min_y = minRange * Math.sin(vertFovInRad / 2); // up
    const frustum_min_z = minRange * Math.cos(vertFovInRad / 2); // forward

    const rightLineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(frustum_min_x, 0, frustum_min_z),
        new THREE.Vector3(frustum_max_x, 0, frustum_max_z),
    ]);
    const rightLine = new THREE.Line(rightLineGeometry, lineMaterial);
    const leftLineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-frustum_min_x, 0, frustum_min_z),
        new THREE.Vector3(-frustum_max_x, 0, frustum_max_z),
    ]);
    const leftLine = new THREE.Line(leftLineGeometry, lineMaterial);
    const upLineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, frustum_min_y, -frustum_min_z),
        new THREE.Vector3(0, frustum_max_y, -frustum_max_z),
    ]);
    const upLine = new THREE.Line(upLineGeometry, lineMaterial);
    const downLineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -frustum_min_y, -frustum_min_z),
        new THREE.Vector3(0, -frustum_max_y, -frustum_max_z),
    ]);
    const downLine = new THREE.Line(downLineGeometry, lineMaterial);
    const centerLineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, frustum_min_z),
        new THREE.Vector3(0, 0, frustum_max_z),
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
    // Center on the camera position
    group.position.set(0, 1, 0);

    return group;
}

export { RangeCamera };