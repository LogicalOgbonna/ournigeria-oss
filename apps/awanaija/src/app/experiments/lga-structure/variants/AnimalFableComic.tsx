"use client";

import { useEffect, useRef, useState } from "react";
import { Cat, Bird, Wrench, AlertTriangle, School, Heart, Map } from "lucide-react";

export function AnimalFableComic() {
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
    <div className="h-full min-h-[800px] bg-emerald-50 text-neutral-900 overflow-hidden relative font-sans">
      {/* Progress Bar */}
      <div className="fixed top-[100px] left-0 w-full h-4 bg-emerald-200 border-y-4 border-black z-50">
        <div 
          className="h-full bg-amber-400 transition-all duration-100 ease-out border-r-4 border-black"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      {/* Comic Container */}
      <div 
        ref={scrollRef}
        className="h-[800px] overflow-y-auto snap-y snap-mandatory scroll-smooth"
        style={{ perspective: "1000px" }}
      >
        {/* Panel 1: The Mayor (Executive) */}
        <div className="h-[800px] w-full snap-center relative flex items-center justify-center bg-emerald-100 border-b-8 border-black overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_#10b981_2px,_transparent_2px)] bg-[size:20px_20px]" />
          
          <div className="relative w-full max-w-5xl mx-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="z-10 bg-white p-8 border-8 border-black rounded-3xl shadow-[16px_16px_0px_rgba(0,0,0,1)] transform -rotate-2">
              <h2 className="text-5xl font-black uppercase mb-4 tracking-tighter text-amber-500">The Village Chief!</h2>
              <p className="text-2xl font-bold leading-relaxed">Meet Chief Leo the Lion! 🦁 He is the Chairman of our village.</p>
              <p className="mt-4 text-xl font-medium text-neutral-600">He was chosen by all the animals to make big choices, like where to build the new playground and how to keep the forest clean!</p>
            </div>
            
            <div className="relative h-[400px] w-full border-8 border-black bg-amber-200 rounded-[3rem] overflow-hidden shadow-[16px_16px_0px_rgba(0,0,0,1)]">
              {/* Parallax Background */}
              <div className="absolute bottom-0 left-0 w-full h-1/3 bg-emerald-400 rounded-t-full" style={{ transform: `translateY(${scrollProgress * 100}px)` }} />
              
              {/* Character */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ transform: `translate(-50%, calc(-50% + ${scrollProgress * -150}px))` }}>
                <div className="relative">
                  <Cat className="w-48 h-48 text-amber-600 drop-shadow-[0_10px_0_rgba(0,0,0,0.2)]" strokeWidth={1.5} />
                  <div className="absolute -top-10 -right-10 bg-white border-4 border-black rounded-2xl p-4 transform rotate-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                    <span className="font-black text-xl uppercase">"I lead the way!"</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: The Helpers (Legislative) */}
        <div className="h-[800px] w-full snap-center relative flex items-center justify-center bg-sky-100 border-b-8 border-black overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_#0ea5e9_2px,_transparent_2px)] bg-[size:20px_20px]" />
          
          <div className="relative w-full max-w-5xl mx-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative h-[400px] w-full border-8 border-black bg-sky-200 rounded-[3rem] overflow-hidden shadow-[-16px_16px_0px_rgba(0,0,0,1)] order-2 md:order-1">
              {/* Parallax Owls */}
              <div className="absolute inset-0 flex justify-around items-center px-8" style={{ transform: `translateY(${(scrollProgress - 0.33) * -200}px)` }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="relative flex flex-col items-center">
                    <div className="w-4 h-32 bg-amber-800 absolute -bottom-32" /> {/* Tree branch */}
                    <Bird className="w-24 h-24 text-sky-700 drop-shadow-[0_10px_0_rgba(0,0,0,0.2)]" strokeWidth={1.5} />
                    <span className="mt-2 bg-white border-4 border-black rounded-xl px-3 py-1 font-black uppercase text-sm shadow-[4px_4px_0px_rgba(0,0,0,1)]">Tree {i}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="z-10 bg-white p-8 border-8 border-black rounded-3xl shadow-[16px_16px_0px_rgba(0,0,0,1)] transform rotate-2 order-1 md:order-2">
              <h2 className="text-5xl font-black uppercase mb-4 tracking-tighter text-sky-500">The Wise Watchers!</h2>
              <p className="text-2xl font-bold leading-relaxed">These are the Owls! 🦉 They are our Councillors.</p>
              <p className="mt-4 text-xl font-medium text-neutral-600">Each Owl lives in a different tree (a Ward). They make the rules and tell Chief Leo what their tree needs, like more acorns or stronger branches!</p>
            </div>
          </div>
        </div>

        {/* Panel 3: The Workers (Administrative) */}
        <div className="h-[800px] w-full snap-center relative flex items-center justify-center bg-amber-100 border-b-8 border-black overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_#f59e0b_2px,_transparent_2px)] bg-[size:20px_20px]" />
          
          <div className="relative w-full max-w-5xl mx-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="z-10 bg-white p-8 border-8 border-black rounded-3xl shadow-[16px_16px_0px_rgba(0,0,0,1)] transform -rotate-1">
              <h2 className="text-5xl font-black uppercase mb-4 tracking-tighter text-amber-600">The Busy Beavers!</h2>
              <p className="text-2xl font-bold leading-relaxed">Meet the Civil Servants! 🦫 They are the workers who never stop.</p>
              <p className="mt-4 text-xl font-medium text-neutral-600">Even when Chief Leo goes on vacation, the Beavers stay to fix the roads, run the animal hospital, and keep the forest school open!</p>
            </div>
            
            <div className="relative h-[400px] w-full border-8 border-black bg-amber-200 rounded-[3rem] overflow-hidden shadow-[16px_16px_0px_rgba(0,0,0,1)]">
              {/* Parallax Tools */}
              <div className="absolute inset-0 flex flex-wrap justify-center items-center gap-8 p-8" style={{ transform: `translateY(${(scrollProgress - 0.66) * 150}px)` }}>
                <div className="bg-white border-4 border-black p-4 rounded-full shadow-[4px_4px_0px_rgba(0,0,0,1)]"><Wrench className="w-16 h-16 text-neutral-600" /></div>
                <div className="bg-white border-4 border-black p-4 rounded-full shadow-[4px_4px_0px_rgba(0,0,0,1)]"><Heart className="w-16 h-16 text-red-500" /></div>
                <div className="bg-white border-4 border-black p-4 rounded-full shadow-[4px_4px_0px_rgba(0,0,0,1)]"><School className="w-16 h-16 text-blue-500" /></div>
                <div className="bg-white border-4 border-black p-4 rounded-full shadow-[4px_4px_0px_rgba(0,0,0,1)]"><Map className="w-16 h-16 text-emerald-600" /></div>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white border-4 border-black px-6 py-2 rounded-2xl font-black uppercase text-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)]" style={{ transform: `translate(-50%, ${(scrollProgress - 0.66) * -100}px)` }}>
                "We fix things!"
              </div>
            </div>
          </div>
        </div>

        {/* Panel 4: The Twist */}
        <div className="h-[800px] w-full snap-center relative flex items-center justify-center bg-red-100 overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_#ef4444_2px,_transparent_2px)] bg-[size:20px_20px]" />
          
          <div className="relative w-full max-w-4xl mx-auto p-8 text-center">
            <div className="z-10 bg-white p-12 border-8 border-black rounded-[3rem] shadow-[24px_24px_0px_rgba(220,38,38,1)] transform rotate-1 relative">
              <AlertTriangle className="absolute -top-12 -left-12 w-32 h-32 text-red-500 bg-white rounded-full border-8 border-black p-4 animate-bounce" />
              <h2 className="text-6xl font-black uppercase mb-8 tracking-tighter text-red-600">Uh Oh! The Giant Bear!</h2>
              <p className="text-3xl font-bold leading-relaxed mb-8">The village is supposed to get its own honey jars to build things...</p>
              
              <div className="bg-red-50 border-4 border-red-500 rounded-2xl p-8 text-left transform -rotate-1">
                <p className="text-2xl font-bold text-red-900 mb-4">But sometimes, the Giant Bear (The State Governor) from the big mountain comes down and:</p>
                <ul className="list-disc pl-8 text-xl font-bold text-red-800 space-y-4">
                  <li>Takes the honey jars before they reach the village! (Joint Account)</li>
                  <li>Tells Chief Leo to go home and puts his own friends in charge! (Caretaker Committee)</li>
                </ul>
              </div>
              
              <div className="mt-12 inline-block bg-black text-white px-8 py-4 rounded-2xl font-black text-3xl uppercase transform rotate-2 shadow-[8px_8px_0px_rgba(220,38,38,1)]">
                That's not fair to the animals!
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
