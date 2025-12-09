
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HolidayMood } from '../types';

interface LuxuryTreeProps {
  mood: HolidayMood;
  isScattered: boolean;
}

// --- Shader Definitions for Foliage ---

const foliageVertexShader = `
  attribute vec3 aTreePos;
  attribute vec3 aScatterPos;
  attribute float aRandom;
  
  uniform float uTime;
  uniform float uProgress; // 0.0 = Tree, 1.0 = Scatter
  
  varying float vAlpha;

  void main() {
    // 1. Interpolate Position
    float t = uProgress;
    t = t * t * (3.0 - 2.0 * t); // Smoothstep
    
    vec3 targetPos = mix(aTreePos, aScatterPos, t);
    
    // 2. Add "Life" (Animation)
    // Breathing effect in Tree Mode
    float breathe = sin(uTime * 1.5 + aTreePos.y * 2.0) * 0.05 * (1.0 - uProgress);
    targetPos += normalize(aTreePos) * breathe;

    // Floating effect in Scatter Mode
    float floatSpeed = 0.5;
    float floatAmp = 0.5 * uProgress;
    targetPos.x += sin(uTime * floatSpeed + aRandom * 100.0) * floatAmp;
    targetPos.y += cos(uTime * floatSpeed * 0.8 + aRandom * 50.0) * floatAmp;
    targetPos.z += sin(uTime * floatSpeed * 1.2 + aRandom * 25.0) * floatAmp;

    vec4 mvPosition = modelViewMatrix * vec4(targetPos, 1.0);
    
    // Size attenuation
    float baseSize = 8.0 * (1.0 + sin(uTime * 2.0 + aRandom * 10.0) * 0.3); // Twinkle size
    gl_PointSize = baseSize * (1.0 / -mvPosition.z);
    
    gl_Position = projectionMatrix * mvPosition;

    // Fade alpha at edges of transition slightly for smoothness
    vAlpha = 0.6 + 0.4 * sin(uTime + aRandom * 10.0);
  }
`;

const foliageFragmentShader = `
  uniform vec3 uColor;
  uniform vec3 uGlowColor;
  
  varying float vAlpha;

  void main() {
    // Circular particle
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;

    // Soft glow gradient
    float strength = 1.0 - (dist * 2.0);
    strength = pow(strength, 1.5);

    // Mix emerald core with gold glow
    vec3 color = mix(uColor, uGlowColor, strength * 0.8);
    
    gl_FragColor = vec4(color, vAlpha * strength);
  }
`;

// --- Configuration ---
const COUNTS = {
  FOLIAGE: 15000, 
  BAUBLES_METAL: 150,
  BAUBLES_BRUSHED: 150, // New Brushed category
  BAUBLES_MATTE: 150,
  BAUBLES_FROSTED: 100,
  LIGHTS: 600
  // Gifts are dynamic arrays
};

const DUMMY = new THREE.Object3D();
const TEMP_POS = new THREE.Vector3();
const TEMP_QUAT = new THREE.Quaternion();
const TEMP_SCALE = new THREE.Vector3();

// --- Star Geometry Helper ---
const createStarGeometry = () => {
  const shape = new THREE.Shape();
  const points = 5;
  const outerRadius = 0.6; // Slightly larger hero star
  const innerRadius = 0.25;
  
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.15,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 2
  });
  
  geom.center(); 
  return geom;
};

export const LuxuryTree: React.FC<LuxuryTreeProps> = ({ mood, isScattered }) => {
  const foliageRef = useRef<THREE.Points>(null);
  const foliageMatRef = useRef<THREE.ShaderMaterial>(null);
  
  // Bauble Refs
  const baublesMetalRef = useRef<THREE.InstancedMesh>(null);
  const baublesBrushedRef = useRef<THREE.InstancedMesh>(null);
  const baublesMatteRef = useRef<THREE.InstancedMesh>(null);
  const baublesFrostedRef = useRef<THREE.InstancedMesh>(null);

  const lightsRef = useRef<THREE.InstancedMesh>(null);
  
  // Split Gifts for Material Variety
  const emeraldGiftsRef = useRef<THREE.InstancedMesh>(null);
  const goldGiftsRef = useRef<THREE.InstancedMesh>(null);
  
  // Star Refs
  const starMeshRef = useRef<THREE.Mesh>(null);
  const starData = useMemo(() => {
    // Tree Pos: Top of tree (Apex)
    const tree = new THREE.Vector3(0, 4.3, 0);
    // Scatter Pos: Fly out of screen (Past camera z=8)
    const scatter = new THREE.Vector3(0, 2, 15);
    return { tree, scatter };
  }, []);

  const transitionProgress = useRef(0); // 0 = Tree, 1 = Scatter

  // --- Palette Based on Mood ---
  const palette = useMemo(() => {
    switch (mood) {
      case HolidayMood.FROSTED:
        return {
          foliage: new THREE.Color('#0a281e'),
          glow: new THREE.Color('#a0e8af'),
          baubleMetal: '#a0e8af', // Icy Silver/Green
          baubleBrushed: '#789c8a', // Muted sage metal
          baubleMatte: '#2f4f4f', // Matte Slate
          baubleFrosted: '#ffffff', // White Frost
          gift: '#2f4f4f',
          giftGold: '#b0c4de',
          light: '#e0ffff',
          star: '#a0e8af'
        };
      case HolidayMood.MODERN:
        return {
          foliage: new THREE.Color('#000000'),
          glow: new THREE.Color('#d4af37'),
          baubleMetal: '#d4af37', // Gold
          baubleBrushed: '#bfa026', // Darker gold
          baubleMatte: '#111111', // Matte Black
          baubleFrosted: '#eeeeee', // White
          gift: '#111111',
          giftGold: '#eeeeee',
          light: '#ffcc00',
          star: '#ffffff'
        };
      case HolidayMood.CLASSIC:
      default:
        return {
          foliage: new THREE.Color('#013220'), // Deep Emerald
          glow: new THREE.Color('#FFD700'),   // Gold
          baubleMetal: '#FFD700', // Polished Gold
          baubleBrushed: '#E5C100', // Satin/Brushed Gold (Slightly less intense)
          baubleMatte: '#004225', // Matte Deep Emerald
          baubleFrosted: '#F0E68C', // Frosted Champagne
          gift: '#064e3b',   // Emerald Green
          giftGold: '#d4af37', // Gold 
          light: '#fff8e7',   // Warm White
          star: '#FFD700'
        };
    }
  }, [mood]);

  function mix(x: number, y: number, a: number) {
    return x * (1 - a) + y * a;
  }

  // --- 1. Foliage Data Generation ---
  const foliageGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const treePositions = [];
    const scatterPositions = [];
    const randoms = [];
    
    // Tree parameters
    const TREE_BASE_Y = -4.5;
    const TREE_HEIGHT = 8.5;
    const MAX_RADIUS_BASE = 4.0;

    for (let i = 0; i < COUNTS.FOLIAGE; i++) {
      const hNorm = 1.0 - Math.pow(Math.random(), 0.45); 
      const y = TREE_BASE_Y + hNorm * TREE_HEIGHT;
      const radiusAtHeight = MAX_RADIUS_BASE * Math.pow(1.0 - hNorm, 0.85);
      
      const shellBias = 0.7; 
      const rRandom = Math.sqrt(Math.random()); 
      const r = mix(rRandom, 1.0, shellBias) * radiusAtHeight;
      
      const angle = Math.random() * Math.PI * 2 + (y * 5.0);
      
      const tx = Math.sin(angle) * r;
      const tz = Math.cos(angle) * r;
      const ty = y; 
      
      treePositions.push(tx, ty, tz);

      const sr = 6 + Math.random() * 8; 
      const sTheta = Math.random() * Math.PI * 2;
      const sPhi = Math.acos(2 * Math.random() - 1);
      const sx = sr * Math.sin(sPhi) * Math.cos(sTheta);
      const sy = sr * Math.sin(sPhi) * Math.sin(sTheta);
      const sz = sr * Math.cos(sPhi);
      
      scatterPositions.push(sx, sy, sz);
      randoms.push(Math.random());
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(treePositions, 3));
    geo.setAttribute('aTreePos', new THREE.Float32BufferAttribute(treePositions, 3));
    geo.setAttribute('aScatterPos', new THREE.Float32BufferAttribute(scatterPositions, 3));
    geo.setAttribute('aRandom', new THREE.Float32BufferAttribute(randoms, 1));
    
    return geo;
  }, []);

  // --- 2. Ornaments Data Generation ---
  const generateInstanceData = (count: number, type: 'heavy' | 'light' | 'ethereal' | 'ground') => {
    const data = [];
    const TREE_BASE_Y = -4.5;
    const TREE_HEIGHT = 8.5;
    const MAX_RADIUS_BASE = 4.0;

    for (let i = 0; i < count; i++) {
      let ty, r;
      let scaleMult = 1.0;

      if (type === 'ground') {
        // GROUND GIFTS: Large, seated on floor around base
        ty = TREE_BASE_Y - 0.2 + (Math.random() - 0.5) * 0.3; // Approx floor
        // Radius extends outwards from base
        r = MAX_RADIUS_BASE * (0.9 + Math.random() * 0.9); 
        scaleMult = 1.5 + Math.random() * 1.5; // Big boxes
      } 
      else if (type === 'heavy') {
        // TREE GIFTS: Filler for the internal volume
        const hNorm = 1.0 - Math.pow(Math.random(), 0.4); 
        const hNormClamped = hNorm * 0.85; 
        ty = TREE_BASE_Y + hNormClamped * TREE_HEIGHT;
        const radiusAtHeight = MAX_RADIUS_BASE * Math.pow(1.0 - hNormClamped, 0.85);
        r = Math.sqrt(Math.random()) * radiusAtHeight * 0.95;
        ty += (Math.random() - 0.5) * 0.5;
        scaleMult = Math.random() > 0.7 ? 1.5 : 0.8;
      } 
      else {
        // BAUBLES & LIGHTS: Surface Decoration
        const hNorm = 1.0 - Math.pow(Math.random(), 0.45);
        ty = TREE_BASE_Y + hNorm * TREE_HEIGHT;
        const radiusAtHeight = MAX_RADIUS_BASE * Math.pow(1.0 - hNorm, 0.85);
        const rOffset = type === 'light' ? 0.05 : 0.2; 
        r = radiusAtHeight + rOffset;
      }
      
      const angle = Math.random() * Math.PI * 2;
      const tx = Math.sin(angle) * r;
      const tz = Math.cos(angle) * r;

      // Scatter Position
      let sr = 10;
      if (type === 'heavy' || type === 'ground') sr = 5 + Math.random() * 5;
      if (type === 'ethereal') sr = 8 + Math.random() * 12;

      const sTheta = Math.random() * Math.PI * 2;
      const sPhi = Math.acos(2 * Math.random() - 1);
      const sx = sr * Math.sin(sPhi) * Math.cos(sTheta);
      const sy = sr * Math.sin(sPhi) * Math.sin(sTheta);
      const sz = sr * Math.cos(sPhi);

      const rot = new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0);

      data.push({
        tree: new THREE.Vector3(tx, ty, tz),
        scatter: new THREE.Vector3(sx, sy, sz),
        rotation: rot,
        scale: (Math.random() * 0.5 + 0.5) * scaleMult,
        randomOffset: Math.random() * 100
      });
    }
    return data;
  };

  const baublesMetalData = useMemo(() => generateInstanceData(COUNTS.BAUBLES_METAL, 'light'), []);
  const baublesBrushedData = useMemo(() => generateInstanceData(COUNTS.BAUBLES_BRUSHED, 'light'), []);
  const baublesMatteData = useMemo(() => generateInstanceData(COUNTS.BAUBLES_MATTE, 'light'), []);
  const baublesFrostedData = useMemo(() => generateInstanceData(COUNTS.BAUBLES_FROSTED, 'light'), []);
  
  const lightsData = useMemo(() => generateInstanceData(COUNTS.LIGHTS, 'ethereal'), []);
  
  // Mix tree gifts and ground gifts for variety
  const emeraldGiftsData = useMemo(() => {
    const tree = generateInstanceData(300, 'heavy');
    const ground = generateInstanceData(20, 'ground');
    return [...tree, ...ground];
  }, []);

  const goldGiftsData = useMemo(() => {
    const tree = generateInstanceData(40, 'heavy'); // Accents
    const ground = generateInstanceData(25, 'ground'); // Ornate ground gifts
    return [...tree, ...ground];
  }, []);
  
  // Star Geometry
  const starGeo = useMemo(() => createStarGeometry(), []);

  // --- Animation Loop ---
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    
    // 1. Update Transition State
    const target = isScattered ? 1 : 0;
    transitionProgress.current = THREE.MathUtils.damp(transitionProgress.current, target, 2.0, delta);
    const progress = transitionProgress.current;

    // 2. Update Foliage Shader
    if (foliageMatRef.current) {
      foliageMatRef.current.uniforms.uTime.value = time;
      foliageMatRef.current.uniforms.uProgress.value = progress;
      foliageMatRef.current.uniforms.uColor.value.copy(palette.foliage);
      foliageMatRef.current.uniforms.uGlowColor.value.copy(palette.glow);
    }

    // 3. Update Instances (Physics & Morphing)
    const updateMesh = (
      mesh: THREE.InstancedMesh | null, 
      data: any[], 
      baseScale: number,
      physicsType: 'heavy' | 'light' | 'ethereal'
    ) => {
      if (!mesh) return;
      
      for (let i = 0; i < data.length; i++) {
        const d = data[i];
        const t = progress; 
        
        // Morph Position
        TEMP_POS.copy(d.tree).lerp(d.scatter, t);

        // Add Noise/Float based on Weight
        let floatAmp = 0.2;
        let floatSpeed = 0.5;

        if (physicsType === 'heavy') {
            floatAmp = 0.05;
            floatSpeed = 0.2;
        } else if (physicsType === 'ethereal') {
            floatAmp = 0.8;
            floatSpeed = 1.2;
        }
        
        if (t > 0.01) {
          TEMP_POS.y += Math.sin(time * floatSpeed + d.randomOffset) * floatAmp * t;
          TEMP_POS.x += Math.cos(time * floatSpeed * 0.7 + d.randomOffset) * floatAmp * t;
        }

        // Scale Logic
        let s = d.scale * baseScale;
        if (physicsType === 'ethereal') {
           s *= (0.6 + 0.4 * Math.sin(time * 3.0 + d.randomOffset)); 
        }
        TEMP_SCALE.set(s, s, s);

        // Rotation Logic
        TEMP_QUAT.setFromEuler(d.rotation);
        if (t > 0.01) {
           const spinSpeed = physicsType === 'heavy' ? 0.1 : 0.8;
           TEMP_QUAT.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), time * spinSpeed + d.randomOffset));
        }

        DUMMY.position.copy(TEMP_POS);
        DUMMY.quaternion.copy(TEMP_QUAT);
        DUMMY.scale.copy(TEMP_SCALE);
        DUMMY.updateMatrix();
        
        mesh.setMatrixAt(i, DUMMY.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };

    updateMesh(baublesMetalRef.current, baublesMetalData, 0.25, 'light');
    updateMesh(baublesBrushedRef.current, baublesBrushedData, 0.25, 'light');
    updateMesh(baublesMatteRef.current, baublesMatteData, 0.25, 'light');
    updateMesh(baublesFrostedRef.current, baublesFrostedData, 0.25, 'light');

    updateMesh(emeraldGiftsRef.current, emeraldGiftsData, 0.45, 'heavy'); 
    updateMesh(goldGiftsRef.current, goldGiftsData, 0.45, 'heavy'); 
    updateMesh(lightsRef.current, lightsData, 0.06, 'ethereal');
    
    // 4. Update Star Position
    if (starMeshRef.current) {
        const t = progress;
        TEMP_POS.copy(starData.tree).lerp(starData.scatter, t);
        
        if (t > 0.01) {
             starMeshRef.current.rotation.x = time * 0.5;
             starMeshRef.current.rotation.y = time * 0.8;
             starMeshRef.current.rotation.z = time * 0.2;
        } else {
             starMeshRef.current.rotation.set(0, time * 0.5, 0); 
        }
        
        starMeshRef.current.position.copy(TEMP_POS);
    }

    if (foliageRef.current) {
      foliageRef.current.rotation.y = time * 0.05 * (1 - progress);
    }
  });

  return (
    <group>
      {/* 1. Foliage Layer (Dense Points) */}
      <points ref={foliageRef} geometry={foliageGeometry}>
        <shaderMaterial
          ref={foliageMatRef}
          vertexShader={foliageVertexShader}
          fragmentShader={foliageFragmentShader}
          uniforms={{
            uTime: { value: 0 },
            uProgress: { value: 0 },
            uColor: { value: palette.foliage },
            uGlowColor: { value: palette.glow },
          }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* 2. Ornaments - Diversified Baubles */}
      
      {/* Metal (Polished Gold) */}
      <instancedMesh ref={baublesMetalRef} args={[undefined, undefined, COUNTS.BAUBLES_METAL]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial 
          color={palette.baubleMetal} 
          metalness={1.0} 
          roughness={0.05} 
          envMapIntensity={2.5} 
        />
      </instancedMesh>

      {/* Brushed (Satin Gold) */}
      <instancedMesh ref={baublesBrushedRef} args={[undefined, undefined, COUNTS.BAUBLES_BRUSHED]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial 
          color={palette.baubleBrushed} 
          metalness={0.9} 
          roughness={0.4} 
          envMapIntensity={1.5} 
        />
      </instancedMesh>

      {/* Matte (Deep Emerald/Velvet) */}
      <instancedMesh ref={baublesMatteRef} args={[undefined, undefined, COUNTS.BAUBLES_MATTE]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial 
          color={palette.baubleMatte} 
          metalness={0.1} 
          roughness={0.9} 
        />
      </instancedMesh>

      {/* Frosted (Real Glass Effect) */}
      <instancedMesh ref={baublesFrostedRef} args={[undefined, undefined, COUNTS.BAUBLES_FROSTED]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhysicalMaterial 
          color={palette.baubleFrosted} 
          metalness={0.0} 
          roughness={0.5} 
          transmission={0.8}
          thickness={1.5}
          envMapIntensity={2.0}
        />
      </instancedMesh>

      {/* Emerald Gifts (Tree Filler + Ground) */}
      <instancedMesh ref={emeraldGiftsRef} args={[undefined, undefined, 320]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={palette.gift} metalness={0.4} roughness={0.6} />
      </instancedMesh>

      {/* Gold Gifts (Ornate Accents + Ground) */}
      <instancedMesh ref={goldGiftsRef} args={[undefined, undefined, 65]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={palette.giftGold} metalness={0.9} roughness={0.2} envMapIntensity={1.5} />
      </instancedMesh>

      <instancedMesh ref={lightsRef} args={[undefined, undefined, COUNTS.LIGHTS]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color={palette.light} emissive={palette.light} emissiveIntensity={3} toneMapped={false} />
      </instancedMesh>

      {/* 3. The Golden Star */}
      <mesh ref={starMeshRef} geometry={starGeo}>
        <meshStandardMaterial 
            color={palette.star} 
            emissive={palette.star} 
            emissiveIntensity={2} 
            metalness={1} 
            roughness={0} 
            toneMapped={false}
        />
      </mesh>
    </group>
  );
};
