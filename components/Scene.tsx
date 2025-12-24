import React, { useLayoutEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { COLORS, LIGHT_COUNT, SNOW_COUNT, STAR_COUNT } from '../constants';
import { TreeState } from '../types';

interface SceneProps {
  treeState: TreeState;
  asciiTextures: THREE.CanvasTexture[];
  snowmanFaceTexture?: THREE.CanvasTexture | null;
}

export interface SceneHandle {
  launchFirework: () => void;
}

const Scene = forwardRef<SceneHandle, SceneProps>(({ treeState, asciiTextures, snowmanFaceTexture }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const fireworkParticlesRef = useRef<THREE.Points[]>([]);
  const bannersGroupRef = useRef<THREE.Group>(new THREE.Group());
  const santaGroupRef = useRef<THREE.Group>(new THREE.Group());
  const fireGroupRef = useRef<THREE.Group>(new THREE.Group());
  const fireLightRef = useRef<THREE.PointLight | null>(null);
  const moonRef = useRef<THREE.Group | null>(null);
  const cloudsRef = useRef<THREE.Group[]>([]);
  const auroraRef = useRef<THREE.Group>(new THREE.Group());
  const snowmanRef = useRef<THREE.Group>(new THREE.Group());
  const snowmanFaceRef = useRef<THREE.Mesh | null>(null);
  const snowman2Ref = useRef<THREE.Group>(new THREE.Group());
  const snowman3Ref = useRef<THREE.Group>(new THREE.Group());
  const snowman4Ref = useRef<THREE.Group>(new THREE.Group());
  const elvesRef = useRef<THREE.Group[]>([]);
  const heartsRef = useRef<THREE.Group[]>([]);

  const launchFirework = useCallback(() => {
    if (!sceneRef.current) return;
    const count = 400;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const color = new THREE.Color(COLORS.fireworkColors[Math.floor(Math.random() * COLORS.fireworkColors.length)]);
    
    const origin = new THREE.Vector3(
      (Math.random() - 0.5) * 500,
      150 + Math.random() * 100,
      (Math.random() - 0.5) * 500
    );

    for (let i = 0; i < count; i++) {
      positions[i * 3] = origin.x;
      positions[i * 3 + 1] = origin.y;
      positions[i * 3 + 2] = origin.z;

      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      const speed = 1.8 + Math.random() * 2.2;
      
      velocities[i * 3] = Math.cos(theta) * Math.sin(phi) * speed;
      velocities[i * 3 + 1] = Math.sin(theta) * Math.sin(phi) * speed;
      velocities[i * 3 + 2] = Math.cos(phi) * speed;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ 
      color, 
      size: 2.5, 
      transparent: true, 
      opacity: 1, 
      blending: THREE.AdditiveBlending, 
      depthWrite: false 
    });

    const firework = new THREE.Points(geometry, material);
    (firework as any).userData = { velocities, life: 3.0 };
    sceneRef.current.add(firework);
    fireworkParticlesRef.current.push(firework);
  }, []);

  useImperativeHandle(ref, () => ({ launchFirework }));

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x1a1a40, 0.0003);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 30000);
    camera.position.set(0, 250, 700);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = treeState.autoRotate;
    controls.autoRotateSpeed = 0.25;
    controls.enablePan = false;
    controls.target.set(0, 80, 0);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (event: PointerEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      
      // Check banners
      const bannerIntersects = raycaster.intersectObjects(bannersGroupRef.current.children, true);
      if (bannerIntersects.length > 0) {
        launchFirework();
        const obj = bannerIntersects[0].object as THREE.Mesh;
        obj.scale.set(1.4, 1.4, 1.4);
        setTimeout(() => obj.scale.set(1, 1, 1), 150);
      }
      
      // Check Santa
      const santaIntersects = raycaster.intersectObjects([santaGroupRef.current], true);
      if (santaIntersects.length > 0) {
        // Launch multiple fireworks when Santa is clicked
        for (let i = 0; i < 8; i++) {
          setTimeout(() => launchFirework(), i * 200);
        }
        santaGroupRef.current.scale.set(1.4, 1.4, 1.4);
        setTimeout(() => santaGroupRef.current.scale.set(1.2, 1.2, 1.2), 150);
      }
    };
    window.addEventListener('pointerdown', onPointerDown);

    // Environment Lighting
    scene.add(new THREE.AmbientLight(0xffccee, 0.9));
    const moonDir = new THREE.DirectionalLight(0xffeeff, 1.3);
    moonDir.position.set(-300, 800, 300);
    scene.add(moonDir);

    // Snowy Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(20000, 20000),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.05 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // MOUNTAINS IN BACKGROUND
    const mountainGroup = new THREE.Group();
    for (let i = 0; i < 15; i++) {
      const mountainHeight = 400 + Math.random() * 600;
      const mountainWidth = 300 + Math.random() * 400;
      const mountain = new THREE.Mesh(
        new THREE.ConeGeometry(mountainWidth, mountainHeight, 4),
        new THREE.MeshStandardMaterial({ 
          color: COLORS.mountainColor,
          roughness: 0.9,
          metalness: 0.1
        })
      );
      const angle = (i / 15) * Math.PI * 2;
      const distance = 3000 + Math.random() * 2000;
      mountain.position.set(
        Math.cos(angle) * distance,
        mountainHeight / 2,
        Math.sin(angle) * distance
      );
      mountain.rotation.y = Math.random() * Math.PI;
      mountain.castShadow = true;
      
      // Snow cap
      const snowCap = new THREE.Mesh(
        new THREE.ConeGeometry(mountainWidth * 0.6, mountainHeight * 0.3, 4),
        new THREE.MeshStandardMaterial({ color: COLORS.mountainSnow })
      );
      snowCap.position.y = mountainHeight * 0.35;
      mountain.add(snowCap);
      
      mountainGroup.add(mountain);
    }
    scene.add(mountainGroup);

    // MASSIVE CHRISTMAS TREE
    const treeGroup = new THREE.Group();
    const treeMat = new THREE.MeshStandardMaterial({ 
      color: 0x013204, 
      roughness: 0.5,
      emissive: 0x011a01,
      emissiveIntensity: 0.4
    });
    const treeLayers = 40;
    for (let i = 0; i < treeLayers; i++) {
      const radius = 75 - i * 1.85;
      const height = 12.0;
      const layer = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 32), treeMat);
      layer.position.y = 6.0 + i * 4.4;
      layer.castShadow = true;
      treeGroup.add(layer);
    }
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(14, 16, 40, 16), new THREE.MeshStandardMaterial({ color: 0x24160d }));
    trunk.position.y = 20;
    treeGroup.add(trunk);
    scene.add(treeGroup);

    // STAR TOPPER - BRIGHT YELLOW
    const star = new THREE.Mesh(
        new THREE.OctahedronGeometry(24, 0),
        new THREE.MeshStandardMaterial({ 
          color: COLORS.starGold, 
          emissive: COLORS.starGold, 
          emissiveIntensity: 80 
        })
    );
    star.position.y = 185;
    treeGroup.add(star);

    // GIFTS AT THE BOTTOM
    const giftColors = [0xff5252, 0x69f0ae, 0x448aff, 0xffd700, 0xe040fb, 0xff80ab, 0x1de9b6];
    for (let i = 0; i < 35; i++) {
      const w = 6 + Math.random() * 10;
      const h = 6 + Math.random() * 10;
      const d = 6 + Math.random() * 10;
      const gift = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color: giftColors[i % giftColors.length], roughness: 0.2 })
      );
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 50;
      gift.position.set(Math.cos(angle) * dist, h / 2, Math.sin(angle) * dist);
      gift.rotation.y = Math.random() * Math.PI;
      gift.castShadow = true;
      scene.add(gift);
      
      // Ribbon cross
      const rib1 = new THREE.Mesh(new THREE.BoxGeometry(w * 1.05, h * 0.1, d * 0.2), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      const rib2 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.2, h * 0.1, d * 1.05), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      gift.add(rib1, rib2);
    }

    // MORE ORNAMENTS ON TREE - Large baubles
    const ornamentColors = [0xffb3d9, 0xffe6f0, 0xb3d9ff, 0xffe6cc, 0xccffdd, 0xe6b3ff, 0xffd9ec, 0xfffacd];
    for (let i = 0; i < 150; i++) {
      const ornament = new THREE.Mesh(
        new THREE.SphereGeometry(2.5 + Math.random() * 2, 16, 16),
        new THREE.MeshStandardMaterial({ 
          color: ornamentColors[i % ornamentColors.length],
          roughness: 0.1,
          metalness: 0.8,
          emissive: ornamentColors[i % ornamentColors.length],
          emissiveIntensity: 0.3
        })
      );
      const angle = Math.random() * Math.PI * 2;
      const height = 15 + Math.random() * 160;
      const radius = (75 - (height / 185) * 75) * 0.95;
      ornament.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
      treeGroup.add(ornament);
    }

    // CANDY CANES on tree
    for (let i = 0; i < 80; i++) {
      const candyCane = new THREE.Group();
      const stick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      const hook = new THREE.Mesh(
        new THREE.TorusGeometry(2, 0.5, 8, 16, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0xff0000 })
      );
      hook.position.y = 5;
      hook.rotation.x = Math.PI / 2;
      candyCane.add(stick, hook);
      
      const angle = Math.random() * Math.PI * 2;
      const height = 20 + Math.random() * 150;
      const radius = (75 - (height / 185) * 75) * 0.98;
      candyCane.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
      candyCane.rotation.z = Math.random() * 0.5;
      treeGroup.add(candyCane);
    }

    // GOLDEN BELLS
    for (let i = 0; i < 60; i++) {
      const bell = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.75),
        new THREE.MeshStandardMaterial({ 
          color: 0xffd700,
          roughness: 0.2,
          metalness: 0.9,
          emissive: 0xffeb3b,
          emissiveIntensity: 0.5
        })
      );
      const angle = Math.random() * Math.PI * 2;
      const height = 25 + Math.random() * 140;
      const radius = (75 - (height / 185) * 75) * 0.96;
      bell.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
      treeGroup.add(bell);
    }

    // RED CHRISTMAS SOCKS
    for (let i = 0; i < 45; i++) {
      const sockGroup = new THREE.Group();
      
      // Sock body
      const sockBody = new THREE.Mesh(
        new THREE.BoxGeometry(3, 7, 2),
        new THREE.MeshStandardMaterial({ color: 0xdc143c, roughness: 0.6 })
      );
      sockBody.position.y = 3.5;
      sockGroup.add(sockBody);
      
      // Sock foot
      const sockFoot = new THREE.Mesh(
        new THREE.BoxGeometry(4, 2, 2.5),
        new THREE.MeshStandardMaterial({ color: 0xdc143c, roughness: 0.6 })
      );
      sockFoot.position.set(1, 0.5, 0);
      sockGroup.add(sockFoot);
      
      // White cuff
      const cuff = new THREE.Mesh(
        new THREE.CylinderGeometry(1.8, 1.8, 1.5, 16),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 })
      );
      cuff.position.y = 7;
      sockGroup.add(cuff);
      
      const angle = Math.random() * Math.PI * 2;
      const height = 25 + Math.random() * 120;
      const radius = (75 - (height / 185) * 75) * 0.97;
      sockGroup.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
      sockGroup.rotation.z = Math.random() * 0.4 - 0.2;
      sockGroup.rotation.y = angle;
      treeGroup.add(sockGroup);
    }

    // SNOWMAN NEXT TO TREE
    const snowman = new THREE.Group();
    snowman.position.set(-100, 0, 150);
    
    // Bottom snowball
    const bottomBall = new THREE.Mesh(
      new THREE.SphereGeometry(25, 32, 32),
      new THREE.MeshStandardMaterial({ color: COLORS.snowmanWhite, roughness: 0.8 })
    );
    bottomBall.position.y = 25;
    bottomBall.castShadow = true;
    snowman.add(bottomBall);
    
    // Middle snowball
    const middleBall = new THREE.Mesh(
      new THREE.SphereGeometry(18, 32, 32),
      new THREE.MeshStandardMaterial({ color: COLORS.snowmanWhite, roughness: 0.8 })
    );
    middleBall.position.y = 58;
    middleBall.castShadow = true;
    snowman.add(middleBall);
    
    // Head snowball
    const headBall = new THREE.Mesh(
      new THREE.SphereGeometry(13, 32, 32),
      new THREE.MeshStandardMaterial({ color: COLORS.snowmanWhite, roughness: 0.8 })
    );
    headBall.position.y = 85;
    headBall.castShadow = true;
    snowman.add(headBall);
    
    // Face placeholder (will be replaced with image)
    const faceGeometry = new THREE.CircleGeometry(10, 32);
    const faceMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0
    });
    const face = new THREE.Mesh(faceGeometry, faceMaterial);
    face.position.set(0, 85, 13);
    snowman.add(face);
    snowmanFaceRef.current = face;
    
    // Eyes (coal)
    const leftEye = new THREE.Mesh(
      new THREE.SphereGeometry(1.0, 16, 16),
      new THREE.MeshStandardMaterial({ color: COLORS.snowmanBlack })
    );
    leftEye.position.set(-3.5, 88, 12.5);
    snowman.add(leftEye);
    
    const rightEye = new THREE.Mesh(
      new THREE.SphereGeometry(1.0, 16, 16),
      new THREE.MeshStandardMaterial({ color: COLORS.snowmanBlack })
    );
    rightEye.position.set(3.5, 88, 12.5);
    snowman.add(rightEye);
    
    // Carrot nose
    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(1.0, 6, 16),
      new THREE.MeshStandardMaterial({ color: COLORS.snowmanOrange })
    );
    nose.position.set(0, 85, 13);
    nose.rotation.x = Math.PI / 2;
    snowman.add(nose);
    
    // Rosy cheeks
    const leftCheek = new THREE.Mesh(
      new THREE.SphereGeometry(2.5, 16, 16),
      new THREE.MeshStandardMaterial({ 
        color: 0xffb3d9,
        emissive: 0xffb3d9,
        emissiveIntensity: 0.3,
        roughness: 0.8
      })
    );
    leftCheek.position.set(-6, 83, 11);
    leftCheek.scale.set(1, 0.8, 0.5);
    snowman.add(leftCheek);
    
    const rightCheek = new THREE.Mesh(
      new THREE.SphereGeometry(2.5, 16, 16),
      new THREE.MeshStandardMaterial({ 
        color: 0xffb3d9,
        emissive: 0xffb3d9,
        emissiveIntensity: 0.3,
        roughness: 0.8
      })
    );
    rightCheek.position.set(6, 83, 11);
    rightCheek.scale.set(1, 0.8, 0.5);
    snowman.add(rightCheek);
    
    // Buttons (coal)
    for (let i = 0; i < 3; i++) {
      const button = new THREE.Mesh(
        new THREE.SphereGeometry(1.3, 16, 16),
        new THREE.MeshStandardMaterial({ color: COLORS.snowmanBlack })
      );
      button.position.set(0, 63 - i * 6.5, 17.5);
      snowman.add(button);
    }
    
    // Stick arms
    const leftArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.5, 20, 8),
      new THREE.MeshStandardMaterial({ color: 0x3d2b1f })
    );
    leftArm.position.set(-17, 60, 0);
    leftArm.rotation.z = Math.PI / 3;
    snowman.add(leftArm);
    
    const rightArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.5, 20, 8),
      new THREE.MeshStandardMaterial({ color: 0x3d2b1f })
    );
    rightArm.position.set(17, 60, 0);
    rightArm.rotation.z = -Math.PI / 3;
    snowman.add(rightArm);
    
    // Top hat
    const hatBrim = new THREE.Mesh(
      new THREE.CylinderGeometry(10, 10, 1.5, 32),
      new THREE.MeshStandardMaterial({ color: COLORS.snowmanBlack })
    );
    hatBrim.position.y = 98;
    snowman.add(hatBrim);
    
    const hatTop = new THREE.Mesh(
      new THREE.CylinderGeometry(6.5, 6.5, 13, 32),
      new THREE.MeshStandardMaterial({ color: COLORS.snowmanBlack })
    );
    hatTop.position.y = 106;
    snowman.add(hatTop);
    
    snowmanRef.current = snowman;
    scene.add(snowman);

    // SNOWMAN 2 - Smaller, simpler style
    const snowman2 = new THREE.Group();
    snowman2.position.set(120, 0, 200);
    
    const snow2Bottom = new THREE.Mesh(
      new THREE.SphereGeometry(18, 32, 32),
      new THREE.MeshStandardMaterial({ color: COLORS.snowmanWhite, roughness: 0.8 })
    );
    snow2Bottom.position.y = 18;
    snow2Bottom.castShadow = true;
    snowman2.add(snow2Bottom);
    
    const snow2Middle = new THREE.Mesh(
      new THREE.SphereGeometry(13, 32, 32),
      new THREE.MeshStandardMaterial({ color: COLORS.snowmanWhite, roughness: 0.8 })
    );
    snow2Middle.position.y = 42;
    snow2Middle.castShadow = true;
    snowman2.add(snow2Middle);
    
    const snow2Head = new THREE.Mesh(
      new THREE.SphereGeometry(9, 32, 32),
      new THREE.MeshStandardMaterial({ color: COLORS.snowmanWhite, roughness: 0.8 })
    );
    snow2Head.position.y = 60;
    snow2Head.castShadow = true;
    snowman2.add(snow2Head);
    
    // Simple face
    const snow2LeftEye = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 16), new THREE.MeshStandardMaterial({ color: COLORS.snowmanBlack }));
    snow2LeftEye.position.set(-2.5, 62, 8.5);
    snowman2.add(snow2LeftEye);
    const snow2RightEye = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 16), new THREE.MeshStandardMaterial({ color: COLORS.snowmanBlack }));
    snow2RightEye.position.set(2.5, 62, 8.5);
    snowman2.add(snow2RightEye);
    const snow2Nose = new THREE.Mesh(new THREE.ConeGeometry(0.7, 4, 16), new THREE.MeshStandardMaterial({ color: COLORS.snowmanOrange }));
    snow2Nose.position.set(0, 60, 9);
    snow2Nose.rotation.x = Math.PI / 2;
    snowman2.add(snow2Nose);
    
    // Red scarf
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(9.5, 1, 16, 32), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
    scarf.position.y = 52;
    scarf.rotation.x = Math.PI / 2;
    snowman2.add(scarf);
    
    snowman2Ref.current = snowman2;
    scene.add(snowman2);

    // SNOWMAN 3 - Tiny cute one
    const snowman3 = new THREE.Group();
    snowman3.position.set(-150, 0, 100);
    
    const snow3Bottom = new THREE.Mesh(
      new THREE.SphereGeometry(12, 32, 32),
      new THREE.MeshStandardMaterial({ color: COLORS.snowmanWhite, roughness: 0.8 })
    );
    snow3Bottom.position.y = 12;
    snow3Bottom.castShadow = true;
    snowman3.add(snow3Bottom);
    
    const snow3Head = new THREE.Mesh(
      new THREE.SphereGeometry(8, 32, 32),
      new THREE.MeshStandardMaterial({ color: COLORS.snowmanWhite, roughness: 0.8 })
    );
    snow3Head.position.y = 27;
    snow3Head.castShadow = true;
    snowman3.add(snow3Head);
    
    // Cute face
    const snow3LeftEye = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), new THREE.MeshStandardMaterial({ color: COLORS.snowmanBlack }));
    snow3LeftEye.position.set(-1.8, 29, 7.5);
    snowman3.add(snow3LeftEye);
    const snow3RightEye = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), new THREE.MeshStandardMaterial({ color: COLORS.snowmanBlack }));
    snow3RightEye.position.set(1.8, 29, 7.5);
    snowman3.add(snow3RightEye);
    const snow3Nose = new THREE.Mesh(new THREE.ConeGeometry(0.5, 3, 16), new THREE.MeshStandardMaterial({ color: COLORS.snowmanOrange }));
    snow3Nose.position.set(0, 27, 8);
    snow3Nose.rotation.x = Math.PI / 2;
    snowman3.add(snow3Nose);
    
    // Green hat
    const hat3Brim = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 1, 32), new THREE.MeshStandardMaterial({ color: 0x00aa00 }));
    hat3Brim.position.y = 35;
    snowman3.add(hat3Brim);
    const hat3Top = new THREE.Mesh(new THREE.ConeGeometry(4, 8, 32), new THREE.MeshStandardMaterial({ color: 0x00aa00 }));
    hat3Top.position.y = 40;
    snowman3.add(hat3Top);
    
    snowman3Ref.current = snowman3;
    scene.add(snowman3);

    // SNOWMAN 4 - Tall thin one
    const snowman4 = new THREE.Group();
    snowman4.position.set(80, 0, -120);
    
    const snow4Bottom = new THREE.Mesh(
      new THREE.SphereGeometry(20, 32, 32),
      new THREE.MeshStandardMaterial({ color: COLORS.snowmanWhite, roughness: 0.8 })
    );
    snow4Bottom.position.y = 20;
    snow4Bottom.castShadow = true;
    snowman4.add(snow4Bottom);
    
    const snow4Middle = new THREE.Mesh(
      new THREE.SphereGeometry(15, 32, 32),
      new THREE.MeshStandardMaterial({ color: COLORS.snowmanWhite, roughness: 0.8 })
    );
    snow4Middle.position.y = 48;
    snow4Middle.castShadow = true;
    snowman4.add(snow4Middle);
    
    const snow4Head = new THREE.Mesh(
      new THREE.SphereGeometry(10, 32, 32),
      new THREE.MeshStandardMaterial({ color: COLORS.snowmanWhite, roughness: 0.8 })
    );
    snow4Head.position.y = 72;
    snow4Head.castShadow = true;
    snowman4.add(snow4Head);
    
    // Face
    const snow4LeftEye = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), new THREE.MeshStandardMaterial({ color: COLORS.snowmanBlack }));
    snow4LeftEye.position.set(-2.8, 74, 9.5);
    snowman4.add(snow4LeftEye);
    const snow4RightEye = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), new THREE.MeshStandardMaterial({ color: COLORS.snowmanBlack }));
    snow4RightEye.position.set(2.8, 74, 9.5);
    snowman4.add(snow4RightEye);
    const snow4Nose = new THREE.Mesh(new THREE.ConeGeometry(0.8, 5, 16), new THREE.MeshStandardMaterial({ color: COLORS.snowmanOrange }));
    snow4Nose.position.set(0, 72, 10);
    snow4Nose.rotation.x = Math.PI / 2;
    snowman4.add(snow4Nose);
    
    // Long arms
    const left4Arm = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.4, 18, 8), new THREE.MeshStandardMaterial({ color: 0x3d2b1f }));
    left4Arm.position.set(-14, 50, 0);
    left4Arm.rotation.z = Math.PI / 4;
    snowman4.add(left4Arm);
    const right4Arm = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.4, 18, 8), new THREE.MeshStandardMaterial({ color: 0x3d2b1f }));
    right4Arm.position.set(14, 50, 0);
    right4Arm.rotation.z = -Math.PI / 4;
    snowman4.add(right4Arm);
    
    // Blue scarf
    const scarf4 = new THREE.Mesh(new THREE.TorusGeometry(10.5, 1.2, 16, 32), new THREE.MeshStandardMaterial({ color: 0x0066ff }));
    scarf4.position.y = 63;
    scarf4.rotation.x = Math.PI / 2;
    snowman4.add(scarf4);
    
    snowman4Ref.current = snowman4;
    scene.add(snowman4);

    // ELVES AROUND THE TREE
    const elfCount = 6;
    const elves: THREE.Group[] = [];
    for (let i = 0; i < elfCount; i++) {
      const elf = new THREE.Group();
      const angle = (i / elfCount) * Math.PI * 2;
      const distance = 95;
      elf.position.set(
        Math.cos(angle) * distance,
        0,
        Math.sin(angle) * distance
      );
      elf.rotation.y = angle + Math.PI;
      
      // Elf body - green outfit
      const elfBody = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 4, 12, 16),
        new THREE.MeshStandardMaterial({ color: 0x00aa00, roughness: 0.6 })
      );
      elfBody.position.y = 10;
      elfBody.castShadow = true;
      elf.add(elfBody);
      
      // Elf head
      const elfHead = new THREE.Mesh(
        new THREE.SphereGeometry(3.5, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.7 })
      );
      elfHead.position.y = 18;
      elfHead.castShadow = true;
      elf.add(elfHead);
      
      // Elf hat - pointed green hat
      const elfHat = new THREE.Mesh(
        new THREE.ConeGeometry(3, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0x00aa00 })
      );
      elfHat.position.y = 24;
      elfHat.rotation.z = Math.sin(i) * 0.3;
      elf.add(elfHat);
      
      // Hat pom-pom
      const pomPom = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xff0000 })
      );
      pomPom.position.y = 28;
      elf.add(pomPom);
      
      // Elf arms
      const leftArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x00aa00 })
      );
      leftArm.position.set(-4.5, 12, 0);
      leftArm.rotation.z = Math.PI / 4;
      elf.add(leftArm);
      
      const rightArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x00aa00 })
      );
      rightArm.position.set(4.5, 12, 0);
      rightArm.rotation.z = -Math.PI / 4;
      elf.add(rightArm);
      
      // Elf legs - yellow/gold pants
      const leftLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1, 6, 8),
        new THREE.MeshStandardMaterial({ color: 0xffcc00 })
      );
      leftLeg.position.set(-1.5, 3, 0);
      elf.add(leftLeg);
      
      const rightLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1, 6, 8),
        new THREE.MeshStandardMaterial({ color: 0xffcc00 })
      );
      rightLeg.position.set(1.5, 3, 0);
      elf.add(rightLeg);
      
      // Elf shoes - curly toed
      const leftShoe = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 1, 3.5),
        new THREE.MeshStandardMaterial({ color: 0x000000 })
      );
      leftShoe.position.set(-1.5, 0.5, 1);
      leftShoe.rotation.x = -0.3;
      elf.add(leftShoe);
      
      const rightShoe = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 1, 3.5),
        new THREE.MeshStandardMaterial({ color: 0x000000 })
      );
      rightShoe.position.set(1.5, 0.5, 1);
      rightShoe.rotation.x = -0.3;
      elf.add(rightShoe);
      
      // White collar
      const collar = new THREE.Mesh(
        new THREE.TorusGeometry(3.2, 0.8, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      collar.position.y = 16;
      collar.rotation.x = Math.PI / 2;
      elf.add(collar);
      
      // Belt
      const belt = new THREE.Mesh(
        new THREE.TorusGeometry(4.2, 0.6, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0x000000 })
      );
      belt.position.y = 8;
      belt.rotation.x = Math.PI / 2;
      elf.add(belt);
      
      // Belt buckle
      const buckle = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 1.5, 0.5),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 })
      );
      buckle.position.set(0, 8, 4.5);
      elf.add(buckle);
      
      // Store animation data
      (elf as any).userData = { 
        baseAngle: angle,
        baseDistance: distance,
        animOffset: i * 0.5
      };
      
      elves.push(elf);
      scene.add(elf);
    }
    elvesRef.current = elves;

    // CAMPFIRE NEXT TO TREE - Enhanced
    const campfire = new THREE.Group();
    campfire.position.set(120, 0, 80);
    
    // Logs arranged in teepee style
    for (let i = 0; i < 8; i++) {
      const log = new THREE.Mesh(
        new THREE.CylinderGeometry(2.5, 2.5, 24), 
        new THREE.MeshStandardMaterial({ 
          color: 0x3d2b1f,
          roughness: 0.9
        })
      );
      log.rotation.z = Math.PI / 2;
      log.rotation.y = (i * Math.PI) / 4;
      log.position.y = 6;
      log.rotation.x = -0.3;
      campfire.add(log);
    }
    
    // Stone circle around fire
    for (let i = 0; i < 12; i++) {
      const stone = new THREE.Mesh(
        new THREE.DodecahedronGeometry(3 + Math.random()),
        new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.95 })
      );
      const angle = (i / 12) * Math.PI * 2;
      stone.position.set(
        Math.cos(angle) * 18,
        1,
        Math.sin(angle) * 18
      );
      campfire.add(stone);
    }
    
    // Multi-layered flames with colors
    const flames: THREE.Mesh[] = [];
    const flameColors = [0xff2200, 0xff6600, 0xff9900, 0xffcc00, 0xffff66];
    
    for (let i = 0; i < 40; i++) {
      const height = i / 40;
      const colorIndex = Math.floor(height * flameColors.length);
      const f = new THREE.Mesh(
        new THREE.SphereGeometry(2 + Math.random() * 5, 8, 8),
        new THREE.MeshBasicMaterial({ 
          color: flameColors[colorIndex],
          transparent: true,
          opacity: 0.6 + Math.random() * 0.3,
          blending: THREE.AdditiveBlending
        })
      );
      f.position.y = 5 + height * 25;
      const radius = (1 - height) * 8;
      const angle = Math.random() * Math.PI * 2;
      f.position.x = Math.cos(angle) * radius;
      f.position.z = Math.sin(angle) * radius;
      (f as any).userData = { 
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1.5,
        baseY: f.position.y
      };
      campfire.add(f);
      flames.push(f);
    }
    
    // Glowing embers at base
    for (let i = 0; i < 20; i++) {
      const ember = new THREE.Mesh(
        new THREE.SphereGeometry(0.5 + Math.random() * 0.8, 8, 8),
        new THREE.MeshBasicMaterial({ 
          color: 0xff3300,
          emissive: 0xff3300,
          emissiveIntensity: 1,
          transparent: true,
          opacity: 0.8
        })
      );
      ember.position.set(
        (Math.random() - 0.5) * 12,
        Math.random() * 4,
        (Math.random() - 0.5) * 12
      );
      (ember as any).userData = { 
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: 2 + Math.random() * 3
      };
      campfire.add(ember);
      flames.push(ember);
    }
    
    // Main fire light with warm glow
    const fireLight = new THREE.PointLight(0xff6600, 500, 400);
    fireLight.position.y = 20;
    fireLight.castShadow = true;
    campfire.add(fireLight);
    
    // Secondary orange glow
    const fireGlow = new THREE.PointLight(0xff9900, 300, 250);
    fireGlow.position.y = 15;
    campfire.add(fireGlow);
    
    // Smoke particles
    const smokeGeo = new THREE.BufferGeometry();
    const smokeCount = 100;
    const smokePos = new Float32Array(smokeCount * 3);
    for (let i = 0; i < smokeCount * 3; i += 3) {
      smokePos[i] = (Math.random() - 0.5) * 6;
      smokePos[i + 1] = 25 + Math.random() * 40;
      smokePos[i + 2] = (Math.random() - 0.5) * 6;
    }
    smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));
    const smokeMat = new THREE.PointsMaterial({
      size: 8,
      color: 0x888888,
      transparent: true,
      opacity: 0.3,
      blending: THREE.NormalBlending,
      depthWrite: false
    });
    const smoke = new THREE.Points(smokeGeo, smokeMat);
    campfire.add(smoke);
    
    fireLightRef.current = fireLight;
    fireGroupRef.current = campfire;
    scene.add(campfire);

    // SANTA ON A FLUFFY CLOUD
    const santaAndCloud = new THREE.Group();
    const cloudGroup = new THREE.Group();
    for (let i = 0; i < 18; i++) {
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(25 + Math.random() * 45, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })
      );
      puff.position.set((Math.random() - 0.5) * 120, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 100);
      cloudGroup.add(puff);
    }
    santaAndCloud.add(cloudGroup);

    // Santa Sleigh with details
    const sleigh = new THREE.Mesh(
      new THREE.BoxGeometry(65, 25, 35), 
      new THREE.MeshStandardMaterial({ 
        color: 0xc62828, 
        roughness: 0.4,
        metalness: 0.3
      })
    );
    sleigh.position.y = 45;
    santaAndCloud.add(sleigh);
    
    // Sleigh gold trim
    const sleighTrim = new THREE.Mesh(
      new THREE.BoxGeometry(66, 3, 36),
      new THREE.MeshStandardMaterial({ 
        color: 0xffd700,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0xffd700,
        emissiveIntensity: 0.3
      })
    );
    sleighTrim.position.y = 58;
    santaAndCloud.add(sleighTrim);
    
    // Gift bag in sleigh
    const giftBag = new THREE.Mesh(
      new THREE.SphereGeometry(22, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 })
    );
    giftBag.position.set(15, 55, 0);
    giftBag.scale.set(1, 1.3, 1);
    santaAndCloud.add(giftBag);
    
    // Detailed Santa
    // Santa body - red coat
    const santaBody = new THREE.Mesh(
      new THREE.CylinderGeometry(12, 14, 28, 16),
      new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        roughness: 0.7
      })
    );
    santaBody.position.set(-15, 68, 0);
    santaAndCloud.add(santaBody);
    
    // White fur trim on coat
    const coatTrim1 = new THREE.Mesh(
      new THREE.CylinderGeometry(12.5, 12.5, 3, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
    );
    coatTrim1.position.set(-15, 81, 0);
    santaAndCloud.add(coatTrim1);
    
    const coatTrim2 = new THREE.Mesh(
      new THREE.CylinderGeometry(14.5, 14.5, 3, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
    );
    coatTrim2.position.set(-15, 54, 0);
    santaAndCloud.add(coatTrim2);
    
    // Black belt
    const belt = new THREE.Mesh(
      new THREE.CylinderGeometry(13, 13, 5, 16),
      new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.3 })
    );
    belt.position.set(-15, 68, 0);
    santaAndCloud.add(belt);
    
    // Gold belt buckle
    const buckle = new THREE.Mesh(
      new THREE.BoxGeometry(8, 6, 3),
      new THREE.MeshStandardMaterial({ 
        color: 0xffd700,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0xffd700,
        emissiveIntensity: 0.4
      })
    );
    buckle.position.set(-15, 68, 13);
    santaAndCloud.add(buckle);
    
    // Santa head - skin tone
    const santaHead = new THREE.Mesh(
      new THREE.SphereGeometry(9, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.8 })
    );
    santaHead.position.set(-15, 88, 0);
    santaAndCloud.add(santaHead);
    
    // Rosy cheeks
    const santaLeftCheek = new THREE.Mesh(
      new THREE.SphereGeometry(2, 16, 16),
      new THREE.MeshStandardMaterial({ 
        color: 0xff9999,
        emissive: 0xff9999,
        emissiveIntensity: 0.3
      })
    );
    santaLeftCheek.position.set(-18, 86, 7);
    santaLeftCheek.scale.set(1, 0.7, 0.4);
    santaAndCloud.add(santaLeftCheek);
    
    const santaRightCheek = santaLeftCheek.clone();
    santaRightCheek.position.set(-12, 86, 7);
    santaAndCloud.add(santaRightCheek);
    
    // White beard
    const beard = new THREE.Mesh(
      new THREE.SphereGeometry(8, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
    );
    beard.position.set(-15, 83, 5);
    beard.scale.set(1, 1.2, 0.7);
    santaAndCloud.add(beard);
    
    // Mustache
    const mustache = new THREE.Mesh(
      new THREE.SphereGeometry(6, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
    );
    mustache.position.set(-15, 88, 7);
    mustache.scale.set(1.3, 0.4, 0.5);
    santaAndCloud.add(mustache);
    
    // Red Santa hat
    const santaHat = new THREE.Mesh(
      new THREE.ConeGeometry(10, 18, 16),
      new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.7 })
    );
    santaHat.position.set(-15, 100, 0);
    santaHat.rotation.z = 0.3;
    santaAndCloud.add(santaHat);
    
    // Hat white pom-pom
    const hatPomPom = new THREE.Mesh(
      new THREE.SphereGeometry(3.5, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
    );
    hatPomPom.position.set(-20, 110, 0);
    santaAndCloud.add(hatPomPom);
    
    // Hat white trim
    const hatTrim = new THREE.Mesh(
      new THREE.CylinderGeometry(10.5, 10.5, 3, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
    );
    hatTrim.position.set(-15, 92, 0);
    santaAndCloud.add(hatTrim);
    
    // Santa arms
    const santaLeftArm = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 3.5, 22, 16),
      new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.7 })
    );
    santaLeftArm.position.set(-26, 72, 0);
    santaLeftArm.rotation.z = Math.PI / 6;
    santaAndCloud.add(santaLeftArm);
    
    const santaRightArm = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 3.5, 22, 16),
      new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.7 })
    );
    santaRightArm.position.set(-4, 72, 0);
    santaRightArm.rotation.z = -Math.PI / 6;
    santaAndCloud.add(santaRightArm);
    
    // White gloves
    const santaLeftGlove = new THREE.Mesh(
      new THREE.SphereGeometry(4, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })
    );
    santaLeftGlove.position.set(-30, 60, 0);
    santaAndCloud.add(santaLeftGlove);
    
    const santaRightGlove = santaLeftGlove.clone();
    santaRightGlove.position.set(0, 60, 0);
    santaAndCloud.add(santaRightGlove);
    
    // Black boots
    const santaLeftBoot = new THREE.Mesh(
      new THREE.BoxGeometry(8, 8, 12),
      new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.3 })
    );
    santaLeftBoot.position.set(-19, 52, 3);
    santaAndCloud.add(santaLeftBoot);
    
    const santaRightBoot = santaLeftBoot.clone();
    santaRightBoot.position.set(-11, 52, 3);
    santaAndCloud.add(santaRightBoot);

    santaAndCloud.position.set(0, 250, 0);
    santaAndCloud.scale.set(1.2, 1.2, 1.2);
    (santaAndCloud as any).userData = { clickable: true };
    santaGroupRef.current = santaAndCloud;
    scene.add(santaAndCloud);

    // VIBRANT YELLOW MOON
    const moonGroup = new THREE.Group();
    moonGroup.position.set(1500, 1800, -4000);
    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(300, 32, 32),
      new THREE.MeshBasicMaterial({ color: COLORS.moonYellow })
    );
    moonGroup.add(moonMesh);
    for(let i=1; i<12; i++) {
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(300 + i * 150, 32, 32),
        new THREE.MeshBasicMaterial({ color: COLORS.moonYellow, transparent: true, opacity: 0.2 / i, blending: THREE.AdditiveBlending })
      );
      moonGroup.add(glow);
    }
    moonRef.current = moonGroup;
    scene.add(moonGroup);

    // Floating hearts particles
    const heartParticleCount = 500;
    const heartParticleGeo = new THREE.BufferGeometry();
    const heartParticlePos = new Float32Array(heartParticleCount * 3);
    const heartParticleSpeeds = new Float32Array(heartParticleCount);
    
    for (let i = 0; i < heartParticleCount; i++) {
      heartParticlePos[i * 3] = (Math.random() - 0.5) * 2000;
      heartParticlePos[i * 3 + 1] = Math.random() * 1000;
      heartParticlePos[i * 3 + 2] = (Math.random() - 0.5) * 2000;
      heartParticleSpeeds[i] = 0.3 + Math.random() * 0.5;
    }
    
    heartParticleGeo.setAttribute('position', new THREE.BufferAttribute(heartParticlePos, 3));
    heartParticleGeo.setAttribute('speed', new THREE.BufferAttribute(heartParticleSpeeds, 1));
    
    const heartCanvas = document.createElement('canvas');
    heartCanvas.width = 64;
    heartCanvas.height = 64;
    const heartCtx = heartCanvas.getContext('2d')!;
    heartCtx.fillStyle = '#ffb3d9';
    heartCtx.beginPath();
    heartCtx.moveTo(32, 20);
    heartCtx.bezierCurveTo(32, 15, 28, 10, 22, 10);
    heartCtx.bezierCurveTo(10, 10, 10, 24, 10, 24);
    heartCtx.bezierCurveTo(10, 32, 20, 42, 32, 54);
    heartCtx.bezierCurveTo(44, 42, 54, 32, 54, 24);
    heartCtx.bezierCurveTo(54, 24, 54, 10, 42, 10);
    heartCtx.bezierCurveTo(36, 10, 32, 15, 32, 20);
    heartCtx.fill();
    
    const heartTexture = new THREE.CanvasTexture(heartCanvas);
    const heartParticleMat = new THREE.PointsMaterial({
      size: 8,
      map: heartTexture,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: false
    });
    
    const heartParticles = new THREE.Points(heartParticleGeo, heartParticleMat);
    scene.add(heartParticles);

    // STARS - Sparkling night sky
    const starsGeo = new THREE.BufferGeometry();
    const starPosArr = new Float32Array(STAR_COUNT * 3);
    const starSizes = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT * 3; i += 3) {
      const dist = 7000 + Math.random() * 5000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPosArr[i] = dist * Math.sin(phi) * Math.cos(theta);
      starPosArr[i+1] = dist * Math.sin(phi) * Math.sin(theta);
      starPosArr[i+2] = dist * Math.cos(phi);
      starSizes[i / 3] = 3.0 + Math.random() * 8.0;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPosArr, 3));
    starsGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    const starsMaterial = new THREE.PointsMaterial({ 
      color: 0xffffff, 
      size: 6.0, 
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    });
    const starsPoints = new THREE.Points(starsGeo, starsMaterial);
    (starsPoints as any).userData = { twinkle: true };
    scene.add(starsPoints);

    // GLOWING PARTICLES in sky for extra bling
    const sparkleGeo = new THREE.BufferGeometry();
    const sparkleCount = 2000;
    const sparklePosArr = new Float32Array(sparkleCount * 3);
    for (let i = 0; i < sparkleCount * 3; i += 3) {
      sparklePosArr[i] = (Math.random() - 0.5) * 8000;
      sparklePosArr[i+1] = 200 + Math.random() * 2000;
      sparklePosArr[i+2] = (Math.random() - 0.5) * 8000;
    }
    sparkleGeo.setAttribute('position', new THREE.BufferAttribute(sparklePosArr, 3));
    const sparkleMaterial = new THREE.PointsMaterial({ 
      color: 0xffeb3b, 
      size: 12.0, 
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sparklePoints = new THREE.Points(sparkleGeo, sparkleMaterial);
    (sparklePoints as any).userData = { sparkle: true };
    scene.add(sparklePoints);

    // SNOW
    const snowGeo = new THREE.BufferGeometry();
    const snowPosArr = new Float32Array(SNOW_COUNT * 3);
    for (let i = 0; i < SNOW_COUNT * 3; i += 3) {
      snowPosArr[i] = (Math.random() - 0.5) * 10000;
      snowPosArr[i+1] = Math.random() * 3000;
      snowPosArr[i+2] = (Math.random() - 0.5) * 10000;
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPosArr, 3));
    const snowPoints = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 3.5, transparent: true, opacity: 0.9 }));
    scene.add(snowPoints);

    // LIGHTS - Yellow themed
    const rainbowColors = [0xffd54f, 0xffeb3b, 0xfff176, 0xfff9c4, 0xffe082, 0xffecb3, 0xffffff, 0xffc107];
    const treeDecor = new THREE.Group();
    for (let i = 0; i < LIGHT_COUNT; i++) {
      const angle = i * 0.45;
      const h = 6.0 + (i / LIGHT_COUNT) * 165.0;
      const rAtH = (75 - (h / 185) * 75) * 1.05;
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(1.0, 8, 8),
        new THREE.MeshStandardMaterial({ 
          color: rainbowColors[i % rainbowColors.length], 
          emissive: rainbowColors[i % rainbowColors.length], 
          emissiveIntensity: 40 
        })
      );
      bulb.position.set(Math.cos(angle) * rAtH, h, Math.sin(angle) * rAtH);
      (bulb as any).userData = { twinkle: 2 + Math.random() * 6 };
      treeDecor.add(bulb);
    }
    scene.add(treeDecor);

    scene.add(bannersGroupRef.current);

    let frameId: number;
    const animate = (time: number) => {
      const t = time * 0.001;
      controls.update();

      // Moon & Cloud Animation
      if (moonRef.current) {
        moonRef.current.rotation.y = t * 0.03;
        moonRef.current.scale.setScalar(1 + Math.sin(t * 0.6) * 0.02);
      }

      // Snowman dancing animation
      if (snowmanRef.current) {
        snowmanRef.current.rotation.y = Math.sin(t * 2) * 0.3;
        snowmanRef.current.position.y = Math.sin(t * 3) * 8;
        snowmanRef.current.rotation.z = Math.sin(t * 2.5) * 0.15;
      }

      // Snowman 2 - Gentle bounce
      if (snowman2Ref.current) {
        snowman2Ref.current.rotation.y = Math.sin(t * 1.5) * 0.2;
        snowman2Ref.current.position.y = Math.sin(t * 2.2) * 6;
      }

      // Snowman 3 - Quick wiggle
      if (snowman3Ref.current) {
        snowman3Ref.current.rotation.y = Math.sin(t * 3) * 0.4;
        snowman3Ref.current.position.y = Math.sin(t * 4) * 5;
        snowman3Ref.current.rotation.z = Math.sin(t * 3.5) * 0.2;
      }

      // Snowman 4 - Slow sway
      if (snowman4Ref.current) {
        snowman4Ref.current.rotation.y = Math.sin(t * 1.2) * 0.25;
        snowman4Ref.current.position.y = Math.sin(t * 1.8) * 7;
        snowman4Ref.current.rotation.z = Math.sin(t * 1.5) * 0.1;
      }

      // Elves dancing around the tree
      elvesRef.current.forEach((elf: any, i) => {
        const data = elf.userData;
        const elfAngle = data.baseAngle + Math.sin(t * 1.5 + data.animOffset) * 0.3;
        const distance = data.baseDistance + Math.sin(t * 2 + data.animOffset) * 5;
        elf.position.x = Math.cos(elfAngle) * distance;
        elf.position.z = Math.sin(elfAngle) * distance;
        elf.position.y = Math.abs(Math.sin(t * 3 + data.animOffset)) * 8;
        elf.rotation.y = elfAngle + Math.PI + Math.sin(t * 2.5 + data.animOffset) * 0.4;
        
        // Make elves wave their arms
        if (elf.children.length > 4) {
          const leftArm = elf.children[4];
          const rightArm = elf.children[5];
          leftArm.rotation.z = Math.PI / 4 + Math.sin(t * 4 + data.animOffset) * 0.5;
          rightArm.rotation.z = -Math.PI / 4 - Math.sin(t * 4 + data.animOffset) * 0.5;
        }
      });

      // Hearts floating and rotating animation
      heartsRef.current.forEach((heart, i) => {
        heart.rotation.y += 0.02;
        heart.position.y = heart.userData.baseY + Math.sin(t + i) * 5;
        heart.rotation.z = Math.sin(t * 2 + i) * 0.2;
      });

      // Santa flying across screen
      const s = santaGroupRef.current;
      const santaSpeed = 0.9;
      const screenWidth = 1200;
      const santaX = ((t * santaSpeed * 100) % (screenWidth * 2)) - screenWidth;
      s.position.x = santaX;
      s.position.z = -200;
      s.position.y = 450 + Math.sin(t * 0.6) * 30;
      // Face forward in direction of travel
      s.rotation.y = santaX < 0 ? Math.PI / 2 : -Math.PI / 2;

      // Campfire animation
      if (fireLightRef.current) fireLightRef.current.intensity = 300 + Math.sin(t * 22) * 200;
      fireGroupRef.current.children.forEach((flame: any) => {
        if (flame.userData.phase !== undefined) {
          flame.scale.setScalar(0.7 + Math.sin(t * 15 + flame.userData.phase) * 0.5);
          flame.position.y = 5 + Math.sin(t * 7 + flame.userData.phase) * 8;
        }
      });

      // Tree Lights
      treeDecor.children.forEach((obj: any) => {
        if (obj.userData.twinkle) {
            obj.material.emissiveIntensity = 25 + Math.sin(t * obj.userData.twinkle) * 20;
        }
      });

      // Sparkling stars and sky particles
      scene.children.forEach((obj: any) => {
        if (obj.userData.twinkle && obj.material) {
          obj.material.opacity = 0.8 + Math.sin(t * 2 + Math.random() * 10) * 0.2;
        }
        if (obj.userData.sparkle && obj.material) {
          obj.material.opacity = 0.3 + Math.sin(t * 4) * 0.3;
          obj.rotation.y = t * 0.1;
        }
      });

      // Star rotation
      star.rotation.y += 0.05;

      // Snow fall
      const sPos = snowPoints.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < sPos.length; i += 3) {
        sPos[i+1] -= 2.8;
        sPos[i] += Math.sin(t * 0.4 + i) * 0.4;
        if (sPos[i+1] < 0) sPos[i+1] = 3000;
      }
      snowPoints.geometry.attributes.position.needsUpdate = true;

      // Banner orbiting
      bannersGroupRef.current.children.forEach((orn: any, i) => {
        const orbitAngle = t * 0.3 + (i * 2.5);
        const orbitDist = 85 + Math.sin(t * 0.5 + i) * 20;
        orn.position.x = Math.cos(orbitAngle) * orbitDist;
        orn.position.z = Math.sin(orbitAngle) * orbitDist;
        orn.position.y = 50 + Math.sin(t * 2.5 + i) * 15;
        orn.lookAt(camera.position);
      });

      // Fireworks update
      fireworkParticlesRef.current = fireworkParticlesRef.current.filter((fw) => {
        const life = fw.userData.life;
        if (life <= 0) { scene.remove(fw); return false; }
        const pArr = fw.geometry.attributes.position.array as Float32Array;
        const vels = fw.userData.velocities;
        for (let i = 0; i < pArr.length; i++) {
          pArr[i] += vels[i];
          if (i % 3 === 1) vels[i] -= 0.007;
        }
        fw.geometry.attributes.position.needsUpdate = true;
        (fw.material as THREE.PointsMaterial).opacity = life;
        fw.userData.life -= 0.015;
        return true;
      });

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [treeState.autoRotate]);

  useLayoutEffect(() => {
    if (!bannersGroupRef.current) return;
    while(bannersGroupRef.current.children.length > 0) {
      const child = bannersGroupRef.current.children[0] as any;
      if (child.material?.map) child.material.map.dispose();
      bannersGroupRef.current.remove(child);
    }
    asciiTextures.forEach((texture) => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(35, 35), 
        new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide })
      );
      bannersGroupRef.current.add(mesh);
    });
  }, [asciiTextures]);

  // Update snowman face with first uploaded image
  useLayoutEffect(() => {
    if (snowmanFaceRef.current && snowmanFaceTexture) {
      const material = snowmanFaceRef.current.material as THREE.MeshBasicMaterial;
      if (material.map) material.map.dispose();
      material.map = snowmanFaceTexture;
      material.opacity = 1;
      material.needsUpdate = true;
    }
  }, [snowmanFaceTexture]);

  return <div ref={containerRef} className="w-full h-full" />;
});

export default Scene;