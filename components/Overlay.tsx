
import React, { useState, useEffect } from 'react';
import { HolidayMood, GeneratedMessage } from '../types';
import { generateHolidayGreeting } from '../services/geminiService';
import { Sparkles, Wand2, Loader2, BoxSelect, Boxes, MessageSquareQuote } from 'lucide-react';

interface OverlayProps {
  mood: HolidayMood;
  setMood: (mood: HolidayMood) => void;
  showGreeting: boolean;
  setShowGreeting: (show: boolean) => void;
  isScattered: boolean;
  setIsScattered: (scatter: boolean) => void;
}

export const Overlay: React.FC<OverlayProps> = ({ 
  mood, 
  setMood, 
  showGreeting, 
  setShowGreeting,
  isScattered,
  setIsScattered
}) => {
  const [loading, setLoading] = useState(false);
  const [greeting, setGreeting] = useState<GeneratedMessage | null>(null);

  // Initial greeting generation
  useEffect(() => {
    handleGenerateGreeting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateGreeting = async () => {
    setLoading(true);
    const result = await generateHolidayGreeting(mood);
    setGreeting(result);
    setLoading(false);
    if (!isScattered) {
        setShowGreeting(true);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 md:p-10 pointer-events-none">
      
      {/* Header - Updated Typography (Smaller & Elegant) */}
      <header className="flex flex-col items-start z-20 pointer-events-auto transition-opacity duration-1000 ease-in-out opacity-100">
        <div className="flex flex-col md:block">
          <span className="font-serif italic text-xl md:text-2xl text-emerald-100/90 tracking-wide md:-mb-2 block md:inline-block relative z-10 drop-shadow-lg">
            Merry
          </span>
          <h1 className="font-serif text-4xl md:text-6xl text-[#d4af37] tracking-tighter drop-shadow-2xl font-bold">
            Christmas
          </h1>
        </div>
        <p className="text-emerald-100/60 font-sans tracking-[0.3em] text-[10px] md:text-xs mt-3 uppercase border-t border-[#d4af37]/30 pt-2 w-full md:w-auto text-left">
          2025 Interactive Collection
        </p>
      </header>

      {/* Main Center Interaction - Greeting Card */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md pointer-events-auto transition-all duration-700 ${showGreeting && !isScattered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <div className="backdrop-blur-xl bg-black/60 border border-[#d4af37]/30 p-8 text-center rounded-sm shadow-[0_0_50px_rgba(212,175,55,0.1)] relative overflow-hidden group">
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-[#d4af37]/60" />
            <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-[#d4af37]/60" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b border-l border-[#d4af37]/60" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-[#d4af37]/60" />

            {loading ? (
               <div className="flex flex-col items-center justify-center py-12">
                 <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin mb-4" />
                 <span className="text-white/50 font-serif italic">Crafting elegance...</span>
               </div>
            ) : (
              <>
                <h2 className="font-serif text-3xl text-white mb-4 italic">
                  {greeting?.title}
                </h2>
                <div className="w-12 h-[1px] bg-[#d4af37] mx-auto mb-6" />
                <p className="font-light text-lg text-neutral-200 leading-relaxed font-sans mb-3">
                  {greeting?.body}
                </p>
                {greeting?.translation && (
                  <p className="font-light text-base text-[#d4af37]/80 leading-relaxed font-serif tracking-wide">
                    {greeting.translation}
                  </p>
                )}
                <button 
                  onClick={handleGenerateGreeting}
                  className="mt-8 px-6 py-2 border border-[#d4af37]/40 text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition-all duration-300 font-sans text-xs tracking-widest uppercase flex items-center gap-2 mx-auto"
                >
                  <Wand2 className="w-3 h-3" />
                  Divinate New Wish
                </button>
              </>
            )}
        </div>
      </div>

      {/* Footer Controls */}
      <footer className="flex flex-col md:flex-row justify-between items-end md:items-center w-full z-20 pointer-events-auto gap-6">
        
        {/* Mood Selector */}
        <div className="flex gap-4">
            {Object.values(HolidayMood).map((m) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                disabled={isScattered}
                className={`group relative px-4 py-2 text-sm tracking-widest transition-all duration-500 overflow-hidden ${mood === m ? 'text-[#d4af37]' : 'text-neutral-500 hover:text-neutral-300'} ${isScattered ? 'opacity-30 cursor-not-allowed' : 'opacity-100'}`}
              >
                <span className="relative z-10">{m.split(' ')[0]}</span>
                {mood === m && (
                  <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#d4af37] shadow-[0_0_10px_#d4af37]" />
                )}
              </button>
            ))}
        </div>

        {/* Action Controls */}
        <div className="flex gap-4 items-center">
            {/* Tree Interaction Toggle */}
            <button 
              className={`h-10 px-6 rounded-full border flex items-center justify-center transition-all duration-300 gap-2 text-xs uppercase tracking-widest ${isScattered ? 'bg-[#d4af37] text-black border-[#d4af37] hover:bg-white' : 'border-white/10 text-white hover:border-[#d4af37] hover:text-[#d4af37]'}`}
              onClick={() => {
                setIsScattered(!isScattered);
                if (!isScattered) setShowGreeting(false); // Hide greeting when scattering
              }}
            >
               {isScattered ? <Boxes className="w-4 h-4" /> : <BoxSelect className="w-4 h-4" />}
               {isScattered ? 'Assemble' : 'Deconstruct'}
            </button>

            {/* View/Greeting Toggle */}
            <button 
              className={`h-10 px-4 rounded-full border border-white/10 flex items-center justify-center gap-2 hover:border-[#d4af37]/50 transition-colors text-xs uppercase tracking-widest ${showGreeting ? 'text-[#d4af37]' : 'text-white/70'}`}
              onClick={() => setShowGreeting(!showGreeting)}
              aria-label="Toggle Message"
              disabled={isScattered}
            >
               {showGreeting ? <Sparkles className="w-4 h-4" /> : <MessageSquareQuote className="w-4 h-4" />}
               {showGreeting ? 'Hide Greeting' : 'View Greeting'}
            </button>
        </div>
      </footer>
    </div>
  );
};
