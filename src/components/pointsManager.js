import * as THREE from 'three';

const VERTEX_SHADER = /* glsl */ `
    attribute vec4 aUvRect;
    varying vec2 vUv;
    void main() {
        vUv = vec2(
            aUvRect.x + uv.x * aUvRect.z,
            aUvRect.y + (1.0 - uv.y) * aUvRect.w
        );
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    }
`;

const FRAGMENT_SHADER = /* glsl */ `
    precision highp float;
    uniform sampler2D uAtlas;
    varying vec2 vUv;
    void main() {
        gl_FragColor = texture2D(uAtlas, vUv);
    }
`;

function createPointsManager({ scene, data, atlas, atlasTexture, spread = 5, thumbSize = 0.04 }) {
    const count = data.points.length;
    const geometry = new THREE.PlaneGeometry(1, 1);

    const uvRect = new Float32Array(count * 4);
    const ids = new Array(count);
    const positions = new Array(count);
    const idToIndex = new Map();
    const dummy = new THREE.Object3D();

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < count; i++) {
        const p = data.points[i];
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    }
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    const material = new THREE.ShaderMaterial({
        uniforms: { uAtlas: { value: atlasTexture } },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
    });

    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.frustumCulled = false;

    let missing = 0;
    for (let i = 0; i < count; i++) {
        const p = data.points[i];
        const meta = atlas.images[p.id];
        ids[i] = p.id;
        idToIndex.set(p.id, i);

        const nx = (p.x - minX) / rangeX;
        const ny = (p.y - minY) / rangeY;
        const wx = (nx - 0.5) * spread;
        const wy = (ny - 0.5) * spread;

        if (!meta) {
            positions[i] = { x: wx, y: wy, sx: 0, sy: 0 };
            dummy.position.set(wx, wy, 0);
            dummy.scale.set(0, 0, 0);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
            missing++;
            continue;
        }

        const aspect = meta.aspect || 1;
        const sx = aspect >= 1 ? thumbSize : thumbSize * aspect;
        const sy = aspect >= 1 ? thumbSize / aspect : thumbSize;

        positions[i] = { x: wx, y: wy, sx, sy };
        dummy.position.set(wx, wy, 0);
        dummy.scale.set(sx, sy, 1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        uvRect[i * 4 + 0] = meta.imgU;
        uvRect[i * 4 + 1] = meta.imgV;
        uvRect[i * 4 + 2] = meta.imgUSize;
        uvRect[i * 4 + 3] = meta.imgVSize;
    }

    geometry.setAttribute('aUvRect', new THREE.InstancedBufferAttribute(uvRect, 4));
    mesh.instanceMatrix.needsUpdate = true;

    if (missing) console.warn(`pointsManager: ${missing} points have no atlas entry`);

    scene.add(mesh);

    const HIGHLIGHT_SCALE = 1.6;
    let highlighted = -1;

    function setInstance(i, scaleMul, z) {
        const pos = positions[i];
        if (!pos) return;
        dummy.position.set(pos.x, pos.y, z);
        dummy.scale.set(pos.sx * scaleMul, pos.sy * scaleMul, 1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
    }

    function highlight(id) {
        if (highlighted >= 0) setInstance(highlighted, 1, 0);
        const i = idToIndex.has(id) ? idToIndex.get(id) : -1;
        if (i >= 0) setInstance(i, HIGHLIGHT_SCALE, 0.01);
        highlighted = i;
        mesh.instanceMatrix.needsUpdate = true;
    }

    function getPosition(id) {
        const i = idToIndex.get(id);
        return i == null ? null : positions[i];
    }

    return { mesh, geometry, material, ids, highlight, getPosition };
}

export { createPointsManager };
