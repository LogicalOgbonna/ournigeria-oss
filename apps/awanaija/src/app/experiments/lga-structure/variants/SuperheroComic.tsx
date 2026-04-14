"use client";

import { useEffect, useRef, useState } from "react";
import { Zap, Shield, Hammer, AlertOctagon, Flame, Activity } from "lucide-react";

export function SuperheroComic() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const progress = scrollTop / (scrollHeight - clientHeight);
        setScrollProgress(progress);
      }
    };

    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (ref) {
        ref.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  return (
    <div className="h-full min-h-[800px] bg-blue-50 text-neutral-900 overflow-hidden relative font-sans">
      {/* Progress Bar */}
      <div className="fixed top-[100px] left-0 w-full h-4 bg-blue-200 border-y-4 border-black z-50">
        <div 
          className="h-full bg-red-500 transition-all duration-100 ease-out border-r-4 border-black"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      {/* Comic Container */}
      <div 
        ref={scrollRef}
        className="h-[800px] overflow-y-auto snap-y snap-mandatory scroll-smooth"
        style={{ perspective: "1000px" }}
      >
        {/* Panel 1: Captain Council (Executive) */}
        <div className="h-[800px] w-full snap-center relative flex items-center justify-center bg-blue-100 border-b-8 border-black overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/halftone-yellow.png')] opacity-20" />
          
          <div className="relative w-full max-w-5xl mx-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="z-10 bg-white p-8 border-8 border-black shadow-[16px_16px_0px_rgba(239,68,68,1)] transform -rotate-2">
              <h2 className="text-5xl font-black uppercase mb-4 tracking-tighter text-blue-600">The Town Defenders!</h2>
              <p className="text-2xl font-bold leading-relaxed">Meet Captain Council! 🦸‍♂️ He is the Chairman of our town.</p>
              <p className="mt-4 text-xl font-medium text-neutral-600">He leads the superhero team! The people voted for him to make the town super safe, super clean, and super awesome every single day!</p>
            </div>
            
            <div className="relative h-[400px] w-full border-8 border-black bg-yellow-300 overflow-hidden shadow-[16px_16px_0px_rgba(239,68,68,1)]">
              {/* Parallax Background */}
              <div className="absolute inset-0 flex items-center justify-center" style={{ transform: `translateY(${scrollProgress * 150}px)` }}>
                <div className="w-full h-full bg-red-500 [clip-path:polygon(0_0,100%_20%,100%_100%,0_80%)]" />
              </div>
              
              {/* Character */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ transform: `translate(-50%, calc(-50% + ${scrollProgress * -150}px))` }}>
                <div className="relative">
                  <Zap className="w-48 h-48 text-yellow-100 fill-yellow-400 drop-shadow-[0_10px_0_rgba(0,0,0,0.2)]" strokeWidth={2} />
                  <div className="absolute -top-10 -right-10 bg-white border-4 border-black p-4 transform rotate-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                    <span className="font-black text-xl uppercase text-red-600">"POW! Let's go!"</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: The Sentinels (Legislative) */}
        <div className="h-[800px] w-full snap-center relative flex items-center justify-center bg-yellow-100 border-b-8 border-black overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/halftone-yellow.png')] opacity-20" />
          
          <div className="relative w-full max-w-5xl mx-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative h-[400px] w-full border-8 border-black bg-blue-300 overflow-hidden shadow-[-16px_16px_0px_rgba(234,179,8,1)] order-2 md:order-1">
              {/* Parallax Shields */}
              <div className="absolute inset-0 flex flex-wrap justify-center items-center gap-8 p-8" style={{ transform: `translateY(${(scrollProgress - 0.33) * -200}px)` }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="relative flex flex-col items-center">
                    <Shield className="w-24 h-24 text-blue-100 fill-blue-500 drop-shadow-[0_10px_0_rgba(0,0,0,0.2)]" strokeWidth={2} />
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black uppercase text-white text-xl">W{i}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="z-10 bg-white p-8 border-8 border-black shadow-[16px_16px_0px_rgba(234,179,8,1)] transform rotate-2 order-1 md:order-2">
              <h2 className="text-5xl font-black uppercase mb-4 tracking-tighter text-red-500">The Street Sentinels!</h2>
              <p className="text-2xl font-bold leading-relaxed">These are the Councillors! 🛡️ They watch over every street.</p>
              <p className="mt-4 text-xl font-medium text-neutral-600">Each Sentinel guards a different part of town (a Ward). They make the rules and make sure Captain Council is using his super-powers to help everyone!</p>
            </div>
          </div>
        </div>

        {/* Panel 3: The Gadget Gurus (Administrative) */}
        <div className="h-[800px] w-full snap-center relative flex items-center justify-center bg-red-100 border-b-8 border-black overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/halftone-yellow.png')] opacity-20" />
          
          <div className="relative w-full max-w-5xl mx-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="z-10 bg-white p-8 border-8 border-black shadow-[16px_16px_0px_rgba(59,130,246,1)] transform -rotate-1">
              <h2 className="text-5xl font-black uppercase mb-4 tracking-tighter text-blue-600">The Gadget Gurus!</h2>
              <p className="text-2xl font-bold leading-relaxed">Meet the Civil Servants! 🛠️ They work in the secret lab.</p>
              <p className="mt-4 text-xl font-medium text-neutral-600">They build the gadgets that fix the potholes, keep the hospitals glowing, and the schools running. They are the real heroes behind the scenes!</p>
            </div>
            
            <div className="relative h-[400px] w-full border-8 border-black bg-red-300 overflow-hidden shadow-[16px_16px_0px_rgba(59,130,246,1)]">
              {/* Parallax Tools */}
              <div className="absolute inset-0 flex flex-wrap justify-center items-center gap-8 p-8" style={{ transform: `translateY(${(scrollProgress - 0.66) * 150}px)` }}>
                <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] transform rotate-12"><Hammer className="w-20 h-20 text-neutral-800" /></div>
                <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] transform -rotate-12"><Activity className="w-20 h-20 text-red-500" /></div>
              </div>
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-yellow-400 border-4 border-black px-6 py-2 font-black uppercase text-3xl shadow-[4px_4px_0px_rgba(0,0,0,1)]" style={{ transform: `translate(-50%, ${(scrollProgress - 0.66) * -100}px)` }}>
                "BAM! FIXED IT!"
              </div>
            </div>
          </div>
        </div>

        {/* Panel 4: The Twist */}
        <div className="h-[800px] w-full snap-center relative flex items-center justify-center bg-neutral-900 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/halftone-yellow.png')] opacity-10" />
          
          <div className="relative w-full max-w-4xl mx-auto p-8 text-center">
            <div className="z-10 bg-white p-12 border-8 border-black shadow-[24px_24px_0px_rgba(234,179,8,1)] transform rotate-1 relative">
              <AlertOctagon className="absolute -top-12 -left-12 w-32 h-32 text-yellow-400 fill-neutral-900 bg-white rounded-full border-8 border-black p-2 animate-pulse" />
              <h2 className="text-6xl font-black uppercase mb-8 tracking-tighter text-neutral-900">The Mega-Giant!</h2>
              <p className="text-3xl font-bold leading-relaxed mb-8">The heroes need Power Crystals (money) to protect the town...</p>
              
              <div className="bg-neutral-100 border-4 border-neutral-900 p-8 text-left transform -rotate-1">
                <p className="text-2xl font-bold text-neutral-900 mb-4">But a Mega-Giant (The State Governor) from the big city comes and:</p>
                <ul className="list-disc pl-8 text-xl font-bold text-neutral-800 space-y-4">
                  <li>Absorbs their Power Crystals before they can use them! (Joint Account)</li>
                  <li>Takes away their superhero capes and puts his own friends in charge! (Caretaker Committee)</li>
                </ul>
              </div>
              
              <div className="mt-12 inline-block bg-red-600 text-white px-8 py-4 font-black text-3xl uppercase transform rotate-2 shadow-[8px_8px_0px_rgba(0,0,0,1)] border-4 border-black">
                How can they save the day now?!
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
