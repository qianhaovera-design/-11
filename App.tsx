
import React, { useState, Suspense } from 'react';
import { Scene } from './components/Scene';
import { Overlay } from './components/Overlay';
import { HolidayMood } from './types';

const App: React.FC = () => {
  const [mood, setMood] = useState<HolidayMood>(HolidayMood.CLASSIC);
  const [showGreeting, setShowGreeting] = useState<boolean>(false);
  const [isScattered, setIsScattered] = useState<boolean>(false);

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden selection:bg-[#d4af37] selection:text-black">
      {/* 3D Background Layer */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={null}>
          <Scene mood={mood} isScattered={isScattered} />
        </Suspense>
      </div>

      {/* UI Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <Overlay 
          mood={mood} 
          setMood={setMood} 
          showGreeting={showGreeting} 
          setShowGreeting={setShowGreeting}
          isScattered={isScattered}
          setIsScattered={setIsScattered}
        />
      </div>

      {/* Cinematic Vignette */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#000000_120%)] opacity-80" />
    </div>
  );
};

export default App;
