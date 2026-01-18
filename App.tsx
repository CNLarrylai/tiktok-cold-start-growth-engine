
import React, { useState, useEffect } from 'react';
import { fixBio, generateHook, identifyUser } from './services/geminiService';
import { BioComparison, ScriptHook, LiveMilestone } from './types';

const getDeviceId = () => {
  let id = localStorage.getItem('sg_device_id');
  if (!id) {
    id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('sg_device_id', id);
  }
  return id;
};

const LIVE_RUNSHEET: LiveMilestone[] = [
  { minute: 1, title: "The Welcome Hook", description: "Set the vibe and acknowledge early joiners. Don't wait for 'more people to join'.", icon: "waves", type: 'hook' },
  { minute: 5, title: "Value Drop", description: "Retention peak. Deliver your first 'Secret' to stop viewers from leaving.", icon: "auto_awesome", type: 'value' },
  { minute: 15, title: "The Pivot", description: "Transition to Q&A session. Engage directly with high-value commenters.", icon: "forum", type: 'pivot' },
  { minute: 30, title: "CONVERSION CALL", description: "Drive traffic to the link in bio. Close the deal while the energy is high.", icon: "link", type: 'conversion' }
];

export default function App() {
  const [bioInput, setBioInput] = useState("I post lifestyle, tech, and my dog. Welcome to my page! 📍 NYC");
  const [optimizedBio, setOptimizedBio] = useState<string | null>(null);
  const [isFixingBio, setIsFixingBio] = useState(false);

  const [nicheInput, setNicheInput] = useState("fitness coaching");
  const [hook, setHook] = useState<ScriptHook | null>(null);
  const [isGeneratingHook, setIsGeneratingHook] = useState(false);

  const [deviceId] = useState(getDeviceId());

  const handleFixBio = async () => {
    setIsFixingBio(true);
    try {
      const fixed = await fixBio(bioInput, deviceId);
      setOptimizedBio(fixed);
    } finally {
      setIsFixingBio(false);
    }
  };

  const handleGenerateHook = async () => {
    setIsGeneratingHook(true);
    try {
      const h = await generateHook(nicheInput, deviceId);
      setHook(h);
    } finally {
      setIsGeneratingHook(false);
    }
  };

  useEffect(() => {
    // Load history or generate initial hook
    const loadData = async () => {
      const history = await identifyUser(deviceId);
      if (history.found && history.data) {
        if (history.data.bioInput) setBioInput(history.data.bioInput);
        if (history.data.optimizedBio) setOptimizedBio(history.data.optimizedBio);
        if (history.data.nicheInput) setNicheInput(history.data.nicheInput);
        if (history.data.hook) setHook(history.data.hook);
      } else {
        // New user or no history - don't auto-generate to save quota
        // handleGenerateHook();
      }
    };
    loadData();
  }, [deviceId]);

  return (
    <div className="min-h-screen grid-bg relative">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-nav">
        <div className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-primary rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(254,42,84,0.4)]">
              <span className="material-symbols-outlined text-white text-2xl">trending_up</span>
            </div>
            <h2 className="text-xl font-black tracking-tighter uppercase italic">ServiceGrow</h2>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a href="#identity" className="text-sm font-semibold hover:text-primary transition-colors uppercase tracking-widest">Identity</a>
            <a href="#hooks" className="text-sm font-semibold hover:text-primary transition-colors uppercase tracking-widest">Hooks</a>
            <a href="#retention" className="text-sm font-semibold hover:text-primary transition-colors uppercase tracking-widest">Retention</a>
            <button className="bg-primary hover:bg-[#e0254a] transition-all px-6 py-2.5 rounded-full text-white text-sm font-bold tracking-wide shadow-lg">
              GET STARTED
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* Hero / Identity Section */}
        <section id="identity" className="min-h-screen flex items-center justify-center px-6 py-20">
          <div className="max-w-[1100px] w-full grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent-cyan rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-card-bg border border-white/10 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">Identity Comparison</span>
                  <div className="flex gap-1.5">
                    <div className="size-2 rounded-full bg-red-500/50"></div>
                    <div className="size-2 rounded-full bg-yellow-500/50"></div>
                    <div className="size-2 rounded-full bg-green-500/50"></div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white/5 p-5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="size-10 rounded-full bg-slate-800 flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-500">person</span>
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={bioInput}
                          onChange={(e) => setBioInput(e.target.value)}
                          className="w-full bg-transparent border-none text-xs text-white/40 italic focus:ring-0 p-0 resize-none h-12"
                          placeholder="Type your current bio..."
                        />
                      </div>
                    </div>
                    <div className="py-1 px-3 bg-red-500/10 rounded-lg text-[10px] text-red-400 font-bold uppercase tracking-tighter inline-block">
                      Algorithm Confusion: 98%
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={handleFixBio}
                      disabled={isFixingBio}
                      className={`size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/40 hover:scale-110 transition-all ${isFixingBio ? 'animate-spin' : ''}`}
                    >
                      <span className="material-symbols-outlined">{isFixingBio ? 'sync' : 'south'}</span>
                    </button>
                  </div>

                  <div className={`transition-all duration-700 ${optimizedBio ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-4'}`}>
                    <div className="bg-primary/5 p-5 rounded-xl border border-primary/20">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="size-10 rounded-full ring-2 ring-primary bg-primary/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary">auto_awesome</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-white/90 leading-relaxed">
                            {optimizedBio || "Click the arrow to fix your bio instantly with AI."}
                          </p>
                        </div>
                      </div>
                      <div className="py-1 px-3 bg-accent-cyan/10 rounded-lg text-[10px] text-accent-cyan font-bold uppercase tracking-tighter inline-block">
                        Niche Authority: 100%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 md:order-2 space-y-8">
              <h2 className="text-primary font-black uppercase tracking-widest text-sm">Section 1: The Identity Problem</h2>
              <h1 className="text-5xl md:text-7xl font-black leading-[0.9] tracking-tighter">
                STOP <span className="text-primary">CONFUSING</span> THE ALGORITHM
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed max-w-md">
                Your bio is your first impression. If the algorithm doesn't know who you are, it can't find your fans. We turn your profile into a conversion machine.
              </p>
              <button
                onClick={handleFixBio}
                className="group flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl"
              >
                {isFixingBio ? 'Optimizing...' : 'Fix My Bio'}
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
          </div>
        </section>

        {/* Section 2: Hooks */}
        <section id="hooks" className="min-h-screen flex items-center justify-center px-6 py-20 bg-background-dark/50 border-y border-white/5">
          <div className="max-w-[1100px] w-full grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-accent-cyan font-black uppercase tracking-widest text-sm">Section 2: The Content Hook</h2>
              <h1 className="text-5xl md:text-7xl font-black leading-[0.9] tracking-tighter text-white">
                STOP <span className="text-accent-cyan">BORING</span> YOUR AUDIENCE
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed max-w-md">
                You have 3 seconds to stop the scroll. Use our proven Mad-Libs scripts to grab attention instantly and spike your retention graphs.
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={nicheInput}
                  onChange={(e) => setNicheInput(e.target.value)}
                  placeholder="Enter your niche..."
                  className="bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:border-accent-cyan outline-none transition-all flex-1"
                />
                <button
                  onClick={handleGenerateHook}
                  disabled={isGeneratingHook}
                  className="group flex items-center gap-3 bg-accent-cyan text-black px-8 py-4 rounded-full font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent-cyan/20"
                >
                  {isGeneratingHook ? 'Working...' : 'Generate'}
                  <span className={`material-symbols-outlined ${isGeneratingHook ? 'animate-spin' : 'group-hover:rotate-45'} transition-transform`}>bolt</span>
                </button>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -top-10 -left-10 size-16 bg-primary/20 rounded-full blur-2xl animate-pulse-soft"></div>
              <div className="absolute -bottom-10 -right-10 size-24 bg-accent-cyan/20 rounded-full blur-2xl animate-pulse-soft"></div>

              <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 hover:scale-[1.02] transition-transform duration-500 shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                  <span className="material-symbols-outlined text-accent-cyan p-2 bg-accent-cyan/10 rounded-lg">edit_note</span>
                  <span className="font-bold text-white tracking-widest uppercase text-xs">Script Builder v2.0</span>
                </div>

                <div className="space-y-8 text-xl md:text-3xl font-medium text-white/70 leading-relaxed">
                  {hook ? (
                    <p>
                      "The secret to <span className="bg-accent-cyan/20 text-accent-cyan px-4 py-1.5 rounded-lg border border-accent-cyan/30 inline-block my-1 shadow-sm">[{hook.result.toUpperCase()}]</span> is actually <span className="bg-white/10 text-white px-4 py-1.5 rounded-lg border border-white/20 inline-block my-1">[{hook.topic.toUpperCase()}]</span> and most people are <span className="bg-primary/20 text-primary px-4 py-1.5 rounded-lg border border-primary/30 inline-block my-1">[{hook.action.toUpperCase()}]</span>."
                    </p>
                  ) : (
                    <div className="space-y-4 animate-pulse">
                      <div className="h-8 bg-white/10 rounded w-full"></div>
                      <div className="h-8 bg-white/10 rounded w-3/4"></div>
                    </div>
                  )}
                </div>

                <div className="mt-12 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-5 py-2.5">
                    <span className="text-lg">🔥</span>
                    <span className="text-xs font-bold text-white/60 tracking-wider uppercase">Hype Hook</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-5 py-2.5">
                    <span className="text-lg">🚀</span>
                    <span className="text-xs font-bold text-white/60 tracking-wider uppercase">Viral Potential</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Retention */}
        <section id="retention" className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
          <div className="max-w-[1100px] w-full">
            <div className="text-center mb-16 space-y-6">
              <h2 className="text-primary font-black uppercase tracking-widest text-sm">Section 3: The Live Engagement</h2>
              <h1 className="text-5xl md:text-8xl font-black leading-[0.8] tracking-tighter text-white">
                STOP THE <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent-cyan to-primary animate-pulse-soft">AWKWARD SILENCE</span>
              </h1>
            </div>

            <div className="bg-card-bg border border-white/10 rounded-3xl overflow-hidden shadow-2xl max-w-4xl mx-auto transform hover:scale-[1.01] transition-all duration-500">
              <div className="bg-white/5 px-8 py-5 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="size-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]"></div>
                  <span className="text-xs font-black uppercase tracking-[0.2em]">LIVE RUN-SHEET PRO</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-white/40 uppercase font-black tracking-widest">Est. Retention: 84%</span>
                </div>
              </div>

              <div className="p-10">
                <div className="grid grid-cols-[80px_1fr] gap-x-8">
                  {LIVE_RUNSHEET.map((step, idx) => (
                    <React.Fragment key={idx}>
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <div className={`size-12 rounded-2xl flex items-center justify-center transition-all ${step.type === 'conversion'
                          ? 'bg-primary shadow-[0_0_20px_rgba(254,42,84,0.4)] text-white'
                          : 'bg-white/5 border border-white/10 text-white/60'
                          }`}>
                          <span className="material-symbols-outlined">{step.icon}</span>
                        </div>
                        {idx !== LIVE_RUNSHEET.length - 1 && (
                          <div className={`w-0.5 h-16 bg-gradient-to-b ${idx % 2 === 0 ? 'from-primary/50 to-accent-cyan/50' : 'from-accent-cyan/50 to-primary/50'
                            }`}></div>
                        )}
                      </div>
                      <div className={`pb-12 group`}>
                        <h3 className={`text-2xl font-black transition-colors ${step.type === 'conversion' ? 'text-primary italic uppercase tracking-tighter' : 'text-white'
                          }`}>
                          Minute {step.minute}: {step.title}
                        </h3>
                        <p className="text-slate-500 mt-2 text-lg leading-relaxed max-w-2xl group-hover:text-slate-400 transition-colors">
                          {step.description}
                        </p>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6">
          <div className="max-w-[800px] mx-auto text-center space-y-12">
            <div className="inline-block px-5 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-black uppercase tracking-[0.3em] mb-4">
              Ready to scale?
            </div>
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-white">
              TRANSFORM YOUR <br />
              <span className="text-primary italic">TIKTOK PRESENCE</span> TODAY.
            </h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-8">
              <button className="w-full md:w-auto bg-primary hover:bg-[#e0254a] text-white px-12 py-6 rounded-full text-lg font-black uppercase tracking-widest transition-all shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95">
                GET STARTED FOR FREE
              </button>
              <button className="w-full md:w-auto bg-white/5 hover:bg-white/10 text-white px-12 py-6 rounded-full text-lg font-black uppercase tracking-widest transition-all border border-white/10 hover:border-white/20">
                VIEW PRICING
              </button>
            </div>
            <p className="text-slate-500 text-sm font-medium tracking-wide">Join 5,000+ creators growing with ServiceGrow.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background-dark border-t border-white/5 py-16 px-6">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">trending_up</span>
            </div>
            <h2 className="text-2xl font-black tracking-tighter uppercase italic text-white">ServiceGrow</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-12">
            <a href="#" className="text-white/40 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">Privacy</a>
            <a href="#" className="text-white/40 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">Terms</a>
            <a href="#" className="text-white/40 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">Support</a>
            <a href="#" className="text-white/40 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">Pricing</a>
          </div>
          <p className="text-white/20 text-[10px] font-bold tracking-[0.2em] uppercase">© 2024 ServiceGrow. All rights reserved.</p>
        </div>
      </footer>

      {/* Floating Scroll Indicator */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 pointer-events-none transition-opacity duration-500">
        <div className="flex flex-col items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Scroll to Explore</span>
          <div className="w-px h-16 bg-gradient-to-b from-primary/50 to-transparent"></div>
        </div>
      </div>
    </div>
  );
}
