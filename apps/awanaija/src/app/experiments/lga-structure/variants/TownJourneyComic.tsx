"use client";

import { useEffect, useRef, useState } from "react";
import { Bus, MapPin, Wrench, AlertCircle, Cloud, Sun } from "lucide-react";

export function TownJourneyComic() {
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
    <div className="h-full min-h-[800px] bg-yellow-50 text-neutral-900 overflow-hidden relative font-sans">
      {/* Progress Bar */}
      <div className="fixed top-[100px] left-0 w-full h-4 bg-yellow-200 border-y-4 border-black z-50">
        <div 
          className="h-full bg-blue-500 transition-all duration-100 ease-out border-r-4 border-black"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      {/* Comic Container */}
      <div 
        ref={scrollRef}
        className="h-[800px] overflow-y-auto snap-y snap-mandatory scroll-smooth"
        style={{ perspective: "1000px" }}
      >
        {/* Panel 1: The Bus Driver (Executive) */}
        <div className="h-[800px] w-full snap-center relative flex items-center justify-center bg-sky-200 border-b-8 border-black overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/clouds.png')] opacity-30" />
          
          <div className="relative w-full max-w-5xl mx-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="z-10 bg-white p-8 border-8 border-black rounded-xl shadow-[16px_16px_0px_rgba(0,0,0,1)] transform -rotate-2">
              <h2 className="text-5xl font-black uppercase mb-4 tracking-tighter text-yellow-500">The Magic Town Bus!</h2>
              <p className="text-2xl font-bold leading-relaxed">Honk! Honk! 🚌 Meet the Driver! He is the Chairman of our town.</p>
              <p className="mt-4 text-xl font-medium text-neutral-600">The people picked him to steer the big yellow bus. He decides which roads we take to build schools, parks, and hospitals!</p>
            </div>
            
            <div className="relative h-[400px] w-full border-8 border-black bg-yellow-300 rounded-[2rem] overflow-hidden shadow-[16px_16px_0px_rgba(0,0,0,1)]">
              {/* Parallax Background */}
              <div className="absolute top-10 left-10" style={{ transform: `translateX(${scrollProgress * 100}px)` }}>
                <Cloud className="w-24 h-24 text-white fill-white" />
              </div>
              <div className="absolute top-5 right-10" style={{ transform: `translateY(${scrollProgress * 50}px)` }}>
                <Sun className="w-32 h-32 text-orange-400 fill-orange-400" />
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1/4 bg-neutral-800" />
              
              {/* Character */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ transform: `translate(-50%, calc(-50% + ${scrollProgress * -150}px))` }}>
                <div className="relative">
                  <Bus className="w-48 h-48 text-yellow-600 fill-yellow-500 drop-shadow-[0_10px_0_rgba(0,0,0,0.2)]" strokeWidth={1.5} />
                  <div className="absolute -top-10 -right-10 bg-white border-4 border-black p-4 rounded-xl transform rotate-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                    <span className="font-black text-xl uppercase text-blue-600">"All aboard!"</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: The Tour Guides (Legislative) */}
        <div className="h-[800px] w-full snap-center relative flex items-center justify-center bg-emerald-200 border-b-8 border-black overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/clouds.png')] opacity-30" />
          
          <div className="relative w-full max-w-5xl mx-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative h-[400px] w-full border-8 border-black bg-emerald-300 rounded-[2rem] overflow-hidden shadow-[-16px_16px_0px_rgba(0,0,0,1)] order-2 md:order-1">
              {/* Parallax Map Pins */}
              <div className="absolute inset-0 flex flex-wrap justify-center items-center gap-8 p-8" style={{ transform: `translateY(${(scrollProgress - 0.33) * -200}px)` }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="relative flex flex-col items-center">
                    <MapPin className="w-24 h-24 text-red-600 fill-red-500 drop-shadow-[0_10px_0_rgba(0,0,0,0.2)]" strokeWidth={1.5} />
                    <span className="absolute top-6 left-1/2 -translate-x-1/2 font-black uppercase text-white text-xl">Stop {i}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="z-10 bg-white p-8 border-8 border-black rounded-xl shadow-[16px_16px_0px_rgba(0,0,0,1)] transform rotate-2 order-1 md:order-2">
              <h2 className="text-5xl font-black uppercase mb-4 tracking-tighter text-emerald-600">The Tour Guides!</h2>
              <p className="text-2xl font-bold leading-relaxed">These are the Councillors! 🗺️ They know every street.</p>
              <p className="mt-4 text-xl font-medium text-neutral-600">Each Guide represents a different bus stop (a Ward). They make sure the Driver doesn't forget anyone's neighborhood and that the bus rules are followed!</p>
            </div>
          </div>
        </div>

        {/* Panel 3: The Mechanics (Administrative) */}
        <div className="h-[800px] w-full snap-center relative flex items-center justify-center bg-orange-200 border-b-8 border-black overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/clouds.png')] opacity-30" />
          
          <div className="relative w-full max-w-5xl mx-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="z-10 bg-white p-8 border-8 border-black rounded-xl shadow-[16px_16px_0px_rgba(0,0,0,1)] transform -rotate-1">
              <h2 className="text-5xl font-black uppercase mb-4 tracking-tighter text-orange-600">The Mechanics!</h2>
              <p className="text-2xl font-bold leading-relaxed">Meet the Civil Servants! 🔧 They keep the engine purring.</p>
              <p className="mt-4 text-xl font-medium text-neutral-600">Even if we get a new Driver, the Mechanics stay in the garage. They fix the tires, put gas in the tank, and make sure the bus can take us to school and the doctor!</p>
            </div>
            
            <div className="relative h-[400px] w-full border-8 border-black bg-orange-300 rounded-[2rem] overflow-hidden shadow-[16px_16px_0px_rgba(0,0,0,1)]">
              {/* Parallax Tools */}
              <div className="absolute inset-0 flex flex-wrap justify-center items-center gap-8 p-8" style={{ transform: `translateY(${(scrollProgress - 0.66) * 150}px)` }}>
                <div className="bg-white border-4 border-black p-4 rounded-full shadow-[4px_4px_0px_rgba(0,0,0,1)] transform rotate-12"><Wrench className="w-20 h-20 text-neutral-800" /></div>
              </div>
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white border-4 border-black px-6 py-2 rounded-xl font-black uppercase text-3xl shadow-[4px_4px_0px_rgba(0,0,0,1)]" style={{ transform: `translate(-50%, ${(scrollProgress - 0.66) * -100}px)` }}>
                "VROOM VROOM!"
              </div>
            </div>
          </div>
        </div>

        {/* Panel 4: The Twist */}
        <div className="h-[800px] w-full snap-center relative flex items-center justify-center bg-purple-200 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/clouds.png')] opacity-30" />
          
          <div className="relative w-full max-w-4xl mx-auto p-8 text-center">
            <div className="z-10 bg-white p-12 border-8 border-black rounded-[2rem] shadow-[24px_24px_0px_rgba(147,51,234,1)] transform rotate-1 relative">
              <AlertCircle className="absolute -top-12 -left-12 w-32 h-32 text-purple-600 bg-white rounded-full border-8 border-black p-2 animate-bounce" />
              <h2 className="text-6xl font-black uppercase mb-8 tracking-tighter text-purple-600">The Big Toll Gate!</h2>
              <p className="text-3xl font-bold leading-relaxed mb-8">The bus needs gas money to drive around town...</p>
              
              <div className="bg-purple-100 border-4 border-purple-500 rounded-xl p-8 text-left transform -rotate-1">
                <p className="text-2xl font-bold text-purple-900 mb-4">But a Big Toll Gate (The State Governor) blocks the road and:</p>
                <ul className="list-disc pl-8 text-xl font-bold text-purple-800 space-y-4">
                  <li>Takes all the bus fare before the bus can buy gas! (Joint Account)</li>
                  <li>Kicks the Driver off the bus and puts his own friends in the seat! (Caretaker Committee)</li>
                </ul>
              </div>
              
              <div className="mt-12 inline-block bg-black text-white px-8 py-4 rounded-xl font-black text-3xl uppercase transform rotate-2 shadow-[8px_8px_0px_rgba(147,51,234,1)] border-4 border-purple-600">
                Now the bus is stuck!
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
