import * as THREE from 'three';
import { loadMapData } from './mapData.js';
import { createPointsManager } from './components/pointsManager.js';

function app({ container, id, mapType, state, appIsReady }) {
    console.log("App initialized");
    let canvas, scene, camera, renderer, data, points;
    let targetX = 0, targetY = 0;
    const LERP = 0.12;
    const { clientWidth: width, clientHeight: height } = container;


    async function setup() {
        canvas = document.createElement('canvas');
        canvas.id = id;
        canvas.style.display = 'block';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        container.appendChild(canvas);
        window.addEventListener('resize', onResize);

        createScene();

        const [mapData, atlasMeta, atlasTexture] = await Promise.all([
            loadMapData(mapType),
            fetch('/atlas/atlas.json').then(r => r.json()),
            new THREE.TextureLoader().loadAsync('/atlas/atlas.jpg'),
        ]);

        atlasTexture.flipY = false;
        atlasTexture.colorSpace = THREE.SRGBColorSpace;
        atlasTexture.minFilter = THREE.LinearMipMapLinearFilter;
        atlasTexture.magFilter = THREE.LinearFilter;
        atlasTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        atlasTexture.generateMipmaps = true;

        data = mapData;
        points = createPointsManager({ scene, data, atlas: atlasMeta, atlasTexture });
        appIsReady(id);
    }

    function createScene() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0e0e10);
        camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.z = .2;
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(width, height, false);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    function onResize() {
        const { clientWidth: width, clientHeight: height } = container;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
    }

    function update() { }

    function animate() {
        camera.position.x += (targetX - camera.position.x) * LERP;
        camera.position.y += (targetY - camera.position.y) * LERP;
        renderer.render(scene, camera);
    }

    function focusOn(pointId) {
        if (!points) return;
        const pos = points.getPosition(pointId);
        if (!pos) return;
        targetX = pos.x;
        targetY = pos.y;
        points.highlight(pointId);
    }

    function getIds() {
        return points ? points.ids : [];
    }

    setup();

    return { animate, focusOn, getIds }
}

export default app;
