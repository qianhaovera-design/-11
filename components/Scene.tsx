
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, Stars, Sparkles, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { LuxuryTree } from './LuxuryTree';
import { HolidayMood } from '../types';

interface SceneProps {
  mood: HolidayMood;
  isScattered: boolean;
}

export const Scene: React.FC<SceneProps> = ({ mood, isScattered }) => {
  
  // Mood-based lighting config
  const isFrosted = mood === HolidayMood.FROSTED;
  // Use "dawn" for a cool, frosted feel as "snow" is not a valid preset
  const envPreset = isFrosted ? "dawn" : "city";
  const sparkleColor = isFrosted ? "#ffffff" : "#d4af37";

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: false, toneMappingExposure: 1.2 }}
      shadows
    >
      {/* Moved camera back to Z=15 to fit the full tree height (~9 units) */}
      <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={45} />
      
      {/* Lighting Setup for Drama */}
      <ambientLight intensity={0.2} color={isFrosted ? "#b0c4de" : "#022b1c"} />
      <spotLight 
        position={[5, 10, 5]} 
        angle={0.4} 
        penumbra={1} 
        intensity={20} 
        castShadow 
        color="#fff5e6" 
      />
      <pointLight position={[-5, 5, -5]} intensity={5} color="#d4af37" />
      <pointLight position={[0, 1, 3]} intensity={2} color="#ffaa00" distance={5} />

      {/* The Star of the Show */}
      <LuxuryTree mood={mood} isScattered={isScattered} />

      {/* Environment & Floor */}
      <Environment preset={envPreset} blur={0.8} background={false} />
      <ContactShadows 
        resolution={1024} 
        scale={20} 
        blur={2} 
        opacity={0.5} 
        far={10} 
        color="#000000" 
      />
      
      {/* Atmospheric Particles */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Sparkles 
        count={200} 
        scale={12} 
        size={2} 
        speed={0.4} 
        opacity={0.6} 
        color={sparkleColor}
        position={[0, 3, 0]}
      />

      {/* Controls */}
      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.8}
        minDistance={8}
        maxDistance={25}
        autoRotate={!isScattered} // Stop rotating when scattered for better manual inspection
        autoRotateSpeed={0.5}
      />

      {/* Cinematic Post-Processing */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={1} 
          mipmapBlur 
          intensity={1.5} 
          radius={0.4} 
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
        <Noise opacity={0.02} />
      </EffectComposer>
    </Canvas>
  );
};
