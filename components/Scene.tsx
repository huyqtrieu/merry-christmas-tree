import React, { useLayoutEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { COLORS, LIGHT_COUNT, SNOW_COUNT, STAR_COUNT } from '../constants';
import { TreeState } from '../types';

interface SceneProps {
  treeState: TreeState;
  asciiTextures: THREE.CanvasTexture[];
}

export interface SceneHandle {
  launchFirework: () => void;
}

const Scene = forwardRef<SceneHandle, SceneProps>(({ treeState, asciiTextures }, ref) => {
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
    scene.fog = new THREE.FogExp2(0x0a0a20, 0.0006);
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
      const intersects = raycaster.intersectObjects(bannersGroupRef.current.children, true);
      if (intersects.length > 0) {
        launchFirework();
        const obj = intersects[0].object as THREE.Mesh;
        obj.scale.set(1.4, 1.4, 1.4);
        setTimeout(() => obj.scale.set(1, 1, 1), 150);
      }
    };
    window.addEventListener('pointerdown', onPointerDown);

    // Environment Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const moonDir = new THREE.DirectionalLight(0xfff9c4, 1.0);
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
      const radius = 55 - i * 1.35;
      const height = 9.0;
      const layer = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 32), treeMat);
      layer.position.y = 4.5 + i * 3.3;
      layer.castShadow = true;
      treeGroup.add(layer);
    }
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(10, 12, 30, 16), new THREE.MeshStandardMaterial({ color: 0x24160d }));
    trunk.position.y = 15;
    treeGroup.add(trunk);
    scene.add(treeGroup);

    // STAR TOPPER
    const star = new THREE.Mesh(
        new THREE.OctahedronGeometry(18, 0),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffeb3b, emissiveIntensity: 70 })
    );
    star.position.y = 135;
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

    // CAMPFIRE NEXT TO TREE
    const campfire = new THREE.Group();
    campfire.position.set(120, 0, 80);
    for (let i = 0; i < 6; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 20), new THREE.MeshStandardMaterial({ color: 0x3d2b1f }));
      log.rotation.z = Math.PI / 2;
      log.rotation.y = (i * Math.PI) / 3;
      campfire.add(log);
    }
    const flames: THREE.Mesh[] = [];
    for (let i = 0; i < 25; i++) {
      const f = new THREE.Mesh(
        new THREE.SphereGeometry(2 + Math.random() * 4, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff4500, transparent: true, opacity: 0.8 })
      );
      f.position.y = 4 + Math.random() * 12;
      f.position.x = (Math.random() - 0.5) * 8;
      f.position.z = (Math.random() - 0.5) * 8;
      (f as any).userData = { phase: Math.random() * Math.PI * 2 };
      campfire.add(f);
      flames.push(f);
    }
    const fireLight = new THREE.PointLight(0xff6600, 400, 300);
    fireLight.position.y = 20;
    campfire.add(fireLight);
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

    // Santa Sleigh
    const sleigh = new THREE.Mesh(new THREE.BoxGeometry(65, 25, 35), new THREE.MeshStandardMaterial({ color: 0xb71c1c }));
    sleigh.position.y = 45;
    santaAndCloud.add(sleigh);
    // Simple Santa
    const santaBody = new THREE.Mesh(new THREE.BoxGeometry(18, 22, 18), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
    santaBody.position.set(-15, 65, 0);
    santaAndCloud.add(santaBody);
    const santaHead = new THREE.Mesh(new THREE.SphereGeometry(8, 16, 16), new THREE.MeshStandardMaterial({ color: 0xffdbac }));
    santaHead.position.set(-15, 82, 0);
    santaAndCloud.add(santaHead);

    santaAndCloud.position.set(1800, 900, -1200);
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

    // STARS
    const starsGeo = new THREE.BufferGeometry();
    const starPosArr = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT * 3; i += 3) {
      const dist = 7000 + Math.random() * 5000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPosArr[i] = dist * Math.sin(phi) * Math.cos(theta);
      starPosArr[i+1] = dist * Math.sin(phi) * Math.sin(theta);
      starPosArr[i+2] = dist * Math.cos(phi);
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPosArr, 3));
    scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 5.0, transparent: true })));

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

    // LIGHTS
    const rainbowColors = [0xff1744, 0x00e676, 0x2979ff, 0xffea00, 0xd500f9, 0xff9100, 0x00e5ff, 0xff4081];
    const treeDecor = new THREE.Group();
    for (let i = 0; i < LIGHT_COUNT; i++) {
      const angle = i * 0.45;
      const h = 5.0 + (i / LIGHT_COUNT) * 120.0;
      const rAtH = (55 - (h / 140) * 55) * 1.05;
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(1.0, 8, 8),
        new THREE.MeshStandardMaterial({ color: rainbowColors[i % rainbowColors.length], emissive: rainbowColors[i % rainbowColors.length], emissiveIntensity: 35 })
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

      // Santa Cloud Movement
      const s = santaGroupRef.current;
      const sAngle = t * 0.035;
      s.position.x = Math.cos(sAngle) * 2000;
      s.position.z = Math.sin(sAngle) * 2000 - 1500;
      s.position.y = 900 + Math.sin(t * 0.5) * 120;
      s.lookAt(new THREE.Vector3(Math.cos(sAngle + 0.1) * 2000, s.position.y, Math.sin(sAngle + 0.1) * 2000 - 1500));

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

  return <div ref={containerRef} className="w-full h-full" />;
});

export default Scene;