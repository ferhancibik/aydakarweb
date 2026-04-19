/* ============================================
   3D MODEL VIEWER - Three.js
   Mouse ile 360° döndürme, scroll ile zoom
   ============================================ */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ============================================
   YAPILANDIRMA
   --------------------------------------------
   Kendi 3D modelinizi yüklemek için:
   1) .glb veya .gltf formatındaki modelinizi
      bu klasöre 'model.glb' ismiyle koyun.
   2) MODEL_URL değişkenini modelinizin yoluna
      göre ayarlayın (örn: './assets/robot.glb').
   3) Model yoksa demo bir küre gösterilir.
   ============================================ */
const MODEL_URL = './model.glb';
const FORCE_AIRCRAFT_PLACEHOLDER = true;

const container = document.getElementById('modelViewer');
const loaderEl = document.getElementById('modelLoader');
const resetBtn = document.getElementById('resetCamera');

if (container) {
    /* ----- Scene ----- */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f7fa);

    /* ----- Camera ----- */
    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(4, 3, 6);

    /* ----- Renderer ----- */
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    /* ----- Environment (stüdyo yansımaları için) ----- */
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(
        new RoomEnvironment(renderer),
        0.04
    ).texture;

    /* ----- Işıklandırma ----- */
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(6, 8, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 40;
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.radius = 4;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.6);
    fillLight.position.set(-5, 3, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(0, 2, -6);
    scene.add(rimLight);

    /* ----- Yer (gölge alıcı) ----- */
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.12 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.25;
    ground.receiveShadow = true;
    scene.add(ground);

    /* ----- Kontroller: 360° mouse dönüşü ----- */
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 2.5;
    controls.maxDistance = 14;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;
    controls.target.set(0, 0, 0);

    const defaultCamPos = camera.position.clone();
    const defaultTarget = controls.target.clone();

    let userInteracted = false;
    const stopAutoRotate = () => {
        if (!userInteracted) {
            controls.autoRotate = false;
            userInteracted = true;
        }
    };
    renderer.domElement.addEventListener('pointerdown', stopAutoRotate);
    renderer.domElement.addEventListener('wheel', stopAutoRotate, { passive: true });

    /* ----- Reset düğmesi ----- */
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            camera.position.copy(defaultCamPos);
            controls.target.copy(defaultTarget);
            controls.update();
            controls.autoRotate = true;
            userInteracted = false;
        });
    }

    /* ----- Demo/Placeholder model (kullanıcı kendi modelini koyana kadar) ----- */
    let loadedRoot = null;

    const createAircraftPlaceholder = () => {
        const group = new THREE.Group();
        const bodyMat = new THREE.MeshPhysicalMaterial({
            color: 0xe2e8f0,
            metalness: 0.55,
            roughness: 0.25,
            clearcoat: 0.8,
            clearcoatRoughness: 0.12
        });
        const accentMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            metalness: 0.4,
            roughness: 0.45
        });

        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 3.2, 24), bodyMat);
        body.rotation.z = Math.PI / 2;
        body.castShadow = true;
        group.add(body);

        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.65, 24), bodyMat);
        nose.rotation.z = -Math.PI / 2;
        nose.position.x = 1.9;
        nose.castShadow = true;
        group.add(nose);

        const mainWing = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 3.6), accentMat);
        mainWing.position.x = -0.15;
        mainWing.castShadow = true;
        group.add(mainWing);

        const rearWing = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.06, 1.55), accentMat);
        rearWing.position.x = -1.25;
        rearWing.castShadow = true;
        group.add(rearWing);

        const verticalTail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.08), accentMat);
        verticalTail.position.set(-1.45, 0.32, 0);
        verticalTail.castShadow = true;
        group.add(verticalTail);

        const cockpit = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
            new THREE.MeshStandardMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.55 })
        );
        cockpit.position.set(0.42, 0.2, 0);
        cockpit.castShadow = true;
        group.add(cockpit);

        return group;
    };

    /* ----- Modele çerçeveleme (auto-fit) ----- */
    const fitCameraToObject = (obj, offset = 1.35) => {
        const box = new THREE.Box3().setFromObject(obj);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        obj.position.sub(center);

        const maxSize = Math.max(size.x, size.y, size.z);
        const fitDist = (maxSize / (2 * Math.atan((Math.PI * camera.fov) / 360))) * offset;
        camera.position.set(fitDist, fitDist * 0.7, fitDist);
        camera.near = fitDist / 100;
        camera.far = fitDist * 100;
        camera.updateProjectionMatrix();
        controls.target.set(0, 0, 0);
        controls.minDistance = fitDist * 0.4;
        controls.maxDistance = fitDist * 4;
        controls.update();

        defaultCamPos.copy(camera.position);
        defaultTarget.copy(controls.target);

        ground.position.y = box.min.y - center.y - 0.02;
    };

    const hideLoader = () => {
        if (loaderEl) loaderEl.classList.add('hidden');
    };

    /* ----- GLTF modelini dene, yoksa placeholder ----- */
    const tryLoadModel = () => {
        if (FORCE_AIRCRAFT_PLACEHOLDER) {
            loadedRoot = createAircraftPlaceholder();
            scene.add(loadedRoot);
            fitCameraToObject(loadedRoot, 1.8);
            hideLoader();
            return;
        }
        const loader = new GLTFLoader();
        loader.load(
            MODEL_URL,
            (gltf) => {
                loadedRoot = gltf.scene;
                loadedRoot.traverse((node) => {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                        if (node.material) {
                            node.material.envMapIntensity = 1.0;
                        }
                    }
                });
                scene.add(loadedRoot);
                fitCameraToObject(loadedRoot);
                hideLoader();
            },
            undefined,
            () => {
                loadedRoot = createAircraftPlaceholder();
                scene.add(loadedRoot);
                fitCameraToObject(loadedRoot, 1.8);
                hideLoader();
            }
        );
    };

    tryLoadModel();

    /* ----- Resize ----- */
    const onResize = () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    /* ----- Render döngüsü ----- */
    const clock = new THREE.Clock();
    const animate = () => {
        requestAnimationFrame(animate);
        const dt = clock.getDelta();
        if (loadedRoot && !userInteracted) {
            // hafif dalgalanma
            loadedRoot.position.y = Math.sin(clock.elapsedTime * 1.2) * 0.04;
        }
        controls.update();
        renderer.render(scene, camera);
    };
    animate();
}
