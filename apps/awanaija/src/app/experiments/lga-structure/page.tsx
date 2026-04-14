"use client";

import { useState } from "react";
import { AnimalFableComic } from "./variants/AnimalFableComic";
import { SuperheroComic } from "./variants/SuperheroComic";
import { TownJourneyComic } from "./variants/TownJourneyComic";

export default function LGAStructureExperiment() {
  const [activeVariant, setActiveVariant] = useState<number>(1);

  const variants = [
    { id: 1, name: "The Forest Village (Animal Fable)", component: AnimalFableComic },
    { id: 2, name: "The Town Defenders (Superhero)", component: SuperheroComic },
    { id: 3, name: "The Magic Town Bus (Journey)", component: TownJourneyComic },
  ];

  const ActiveComponent = variants.find((v) => v.id === activeVariant)?.component || AnimalFableComic;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      <header className="p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black uppercase text-amber-400 tracking-tighter">How Our Town Works!</h1>
            <p className="text-sm font-bold text-slate-400">A Comic Book Adventure for Kids</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setActiveVariant(variant.id)}
                className={`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wider border-2 border-black transition-all duration-300 ${
                  activeVariant === variant.id
                    ? "bg-amber-400 text-black shadow-[4px_4px_0px_rgba(0,0,0,1)] translate-y-[-2px] translate-x-[-2px]"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 shadow-none"
                }`}
              >
                {variant.id}. {variant.name}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-grow relative overflow-hidden">
        <ActiveComponent />
      </main>
    </div>
  );
}
