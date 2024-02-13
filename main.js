import * as THREE from 'three'

// Data and visualization
import { CompositionShader } from './shaders/CompositionShader.js'
import { BASE_LAYER, BLOOM_LAYER, BLOOM_PARAMS, OVERLAY_LAYER } from "./config/renderConfig.js";

// Rendering
import { MapControls } from 'three/addons/controls/OrbitControls.js'

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { Galaxy } from './objects/galaxy.js';

let canvas, renderer, camera, scene, orbit, baseComposer, bloomComposer, overlayComposer, texture

let cameraX = 200;
let cameraY = 200;
let cameraZ = 0;

function initThree() {

    // grab canvas
    canvas = document.querySelector('#canvas');

    // scene
    scene = new THREE.Scene();
    // scene.fog = new THREE.FogExp2(0xEBE2DB, 0.00003);


    texture = new THREE.TextureLoader().load('resources/cosmos.jpg');
    scene.background = texture;

    // camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000000);
    camera.position.set(cameraX, cameraY, cameraZ);
    camera.up.set(0, 0, 1);
    camera.lookAt(0, 0, 0);

    // map orbit
    // orbit = new MapControls(camera, canvas)
    // orbit.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    // orbit.dampingFactor = 0.05;
    // orbit.screenSpacePanning = false;
    // orbit.minDistance = 1;
    // orbit.maxDistance = 16384;
    // orbit.maxPolarAngle = (Math.PI / 2) - (Math.PI / 360)

    initRenderPipeline()
}

const info = (v) => document.getElementById("info").innerText = v;

function initRenderPipeline() {

    // Assign Renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas,
        logarithmicDepthBuffer: true,
    })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    // renderer.outputEncoding = THREE.sRGBEncoding
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.5

    // General-use rendering pass for chaining
    const renderScene = new RenderPass(scene, camera)

    // Rendering pass for bloom
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85)
    bloomPass.threshold = BLOOM_PARAMS.bloomThreshold
    bloomPass.strength = BLOOM_PARAMS.bloomStrength
    bloomPass.radius = BLOOM_PARAMS.bloomRadius

    // bloom composer
    bloomComposer = new EffectComposer(renderer)
    bloomComposer.renderToScreen = false
    bloomComposer.addPass(renderScene)
    bloomComposer.addPass(bloomPass)

    // overlay composer
    overlayComposer = new EffectComposer(renderer)
    overlayComposer.renderToScreen = false
    overlayComposer.addPass(renderScene)

    // Shader pass to combine base layer, bloom, and overlay layers
    const finalPass = new ShaderPass(
        new THREE.ShaderMaterial({
            uniforms: {
                baseTexture: { value: null },
                bloomTexture: { value: bloomComposer.renderTarget2.texture },
                overlayTexture: { value: overlayComposer.renderTarget2.texture }
            },
            vertexShader: CompositionShader.vertex,
            fragmentShader: CompositionShader.fragment,
            defines: {}
        }), 'baseTexture'
    );
    finalPass.needsSwap = true;

    // base layer composer
    baseComposer = new EffectComposer(renderer)
    baseComposer.addPass(renderScene)
    baseComposer.addPass(finalPass)

    info(JSON.stringify({
        cameraX, cameraY, cameraZ
    }, null, 2))

    document.addEventListener("keyup", function (ev) {
        const kLeft = ev.key === "ArrowLeft";
        const kRight = ev.key === "ArrowRight";
        const kUp = ev.key === "ArrowUp";
        const kDown = ev.key === "ArrowDown";

        if (!kLeft && !kRight && !kUp && !kDown) return;
    });

    document.addEventListener("mousemove", function (ev) {
        let cX = camera.position.x;
        let cY = camera.position.y;
        let cZ = camera.position.z;

        // ev.preventDefault();
        const x = (ev.clientX / window.innerWidth) * ev.movementX / 100;
        const y = (ev.clientY / window.innerHeight) * ev.movementY / 100;

        // if (cX < 100) cX = cX + x;

        cZ = cZ < -2 ? -2 : cZ + y;
        cZ = cZ > 2 ? 2 : cZ + y;

        camera.position.set(cX, cY, cZ);

        info(JSON.stringify({
            position: camera.position, up: camera.up, look: camera
        }, null, 2))
    });

    document.addEventListener("click", () => {
        resetCamera()
    });

    const i1 = setInterval(() => { animate(1) }, 30);
    // const i2 = setInterval(() => { animate(1) }, 10);
    const i3 = setInterval(() => { animate(0.2) }, 10);
    const i4 = setInterval(() => { animate(0.4) }, 20);
    const i5 = setInterval(() => { animate(0.4) }, 20);

    setTimeout(() => clearInterval(i1), 500);
    // setTimeout(() => clearInterval(i2), 3000);
    setTimeout(() => clearInterval(i3), 2000);
    setTimeout(() => clearInterval(i4), 30000);
    setTimeout(() => clearInterval(i4), 300000);

    window.i = texture;
}



const animate = (acc) => {
    let cX = camera.position.x;
    let cY = camera.position.y;
    let cZ = camera.position.z;

    if (cX < -120 || cY < -120) return;

    cX = cX < 100 ? cX - acc * 0.1 : cX - acc;
    cY = cY < 100 ? cY - acc * 0.1 : cY - acc;
    // cZ = cZ + acc * 0.01;

    camera.position.set(cX, cY, cZ);

    texture.repeat.x = texture.repeat.x - (texture.repeat.x * 0.00005)
    texture.repeat.y = texture.repeat.y - (texture.repeat.y * 0.00005)


    info(JSON.stringify({
        position: camera.position, up: camera.up, look: camera
    }, null, 2));

}

function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
    }
    return needResize;
}

function resetCamera() {
    camera.position.set(cameraX, cameraY, cameraZ);
    texture.repeat.x = 1;
    texture.repeat.y = 1;
}

async function render() {

    // orbit.update()

    // fix buffer size
    if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }

    // fix aspect ratio
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();

    galaxy.updateScale(camera)

    // Run each pass of the render pipeline
    renderPipeline()

    requestAnimationFrame(render)

}

function renderPipeline() {

    // Render bloom
    camera.layers.set(BLOOM_LAYER)
    bloomComposer.render()

    // Render overlays
    camera.layers.set(OVERLAY_LAYER)
    overlayComposer.render()

    // Render normal
    camera.layers.set(BASE_LAYER)
    baseComposer.render()

}

let a = 1;



initThree()
// let axes = new THREE.AxesHelper(5.0)
// scene.add(axes)

let galaxy = new Galaxy(scene)

requestAnimationFrame(render);