
import React from 'react';
import { useNavigate } from 'react-router-dom';

const AboutUs: React.FC = () => {
   const navigate = useNavigate();

   return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display animate-in fade-in duration-1000">
         {/* Cinematic Hero */}
         <section className="relative h-[70vh] min-h-[600px] bg-secondary flex items-center justify-center overflow-hidden pb-32">
            <img
               src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=2070&auto=format&fit=crop"
               className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale brightness-50 scale-110 animate-float"
               alt="Logistics Background"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/60 to-transparent"></div>

            <div className="relative z-10 text-center px-6 max-w-5xl space-y-8">
               <span className="bg-primary text-secondary px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.5em] w-fit mx-auto shadow-2xl animate-in slide-in-from-top duration-700">The Fudaydiye Vision</span>
               <h1 className="text-6xl md:text-9xl font-black text-white uppercase tracking-tighter leading-[0.85] drop-shadow-2xl">
                  Mesh <br /> <span className="text-primary italic">Intelligence</span>
               </h1>
               <p className="text-sm md:text-xl font-bold text-white/50 uppercase tracking-[0.3em] max-w-2xl mx-auto leading-relaxed">
                  Somaliland's premier commerce architecture. Scaling local merchants through high-speed logistics and neural marketplace nodes.
               </p>
            </div>
         </section>

         {/* Core Values / Mission Grid */}
         <main className="max-w-7xl mx-auto px-6 md:px-12 -mt-32 relative z-20 pb-40 space-y-24">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <MissionCard
                  icon="bolt"
                  title="Atomic Speed"
                  desc="Delivery dispatches optimized via our real-time Bajaj & Motorcycle mesh. Arrival under 60 minutes, guaranteed."
               />
               <MissionCard
                  icon="verified_user"
                  title="Trust Protocol"
                  desc="Vetted merchant nodes and auditable MOBILE pay gateways ensure every transaction is secured by absolute consensus."
               />
               <MissionCard
                  icon="hub"
                  title="Global Scale"
                  desc="Connecting the Horn of Africa to global inventory while maintaining hyper-local service and cultural integrity."
               />
            </div>

            {/* Detailed Story Section */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
               <div className="space-y-10">
                  <div className="space-y-4">
                     <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Our Purpose</span>
                     <h2 className="text-4xl md:text-6xl font-black text-secondary dark:text-white uppercase tracking-tighter leading-tight">Empowering the <br /> Somali Marketplace</h2>
                  </div>
                  <div className="prose dark:prose-invert prose-lg max-w-none text-gray-500 dark:text-gray-400 leading-relaxed font-medium uppercase text-xs tracking-widest">
                     <p>Fudaydiye began as a response to the fragmentation of regional commerce. We realized that while the merchant spirit in Hargeisa and Berbera was unmatched, the infrastructure lacked the neural connectivity needed to compete in a digital-first era.</p>
                     <p>Our cloud architecture now serves thousands of verified users, providing a unified terminal for shopping, social selling, and enterprise-grade logistics dispatches.</p>
                  </div>
                  <button onClick={() => navigate('/select-identity')} className="h-20 px-12 bg-secondary text-primary font-black rounded-[24px] uppercase text-xs tracking-[0.2em] shadow-xl hover:shadow-primary-glow active:scale-95 transition-all">Join the Mesh Hub</button>
               </div>
               <div className="relative">
                  <div className="absolute -inset-4 bg-primary/10 rounded-[64px] blur-3xl animate-pulse"></div>
                  <img
                     src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop"
                     className="relative z-10 rounded-[64px] shadow-2xl border-8 border-white dark:border-surface-dark grayscale-[30%] hover:grayscale-0 transition-all duration-700"
                     alt="Storefront"
                  />
               </div>
            </section>

            {/* Impact Metrics */}
            <section className="bg-secondary text-white rounded-[80px] p-12 md:p-24 relative overflow-hidden group shadow-primary-glow">
               <div className="absolute top-0 right-0 size-64 bg-primary/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
               <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
                  <MetricItem label="Verified Merchants" value="1.2k+" />
                  <MetricItem label="Monthly Dispatches" value="45k+" />
                  <MetricItem label="Trust Score Avg" value="98.2%" />
                  <MetricItem label="Regional Hubs" value="12" />
               </div>
            </section>
         </main>
      </div>
   );
};

const MissionCard: React.FC<{ icon: string; title: string; desc: string }> = ({ icon, title, desc }) => (
   <div className="bg-white dark:bg-surface-dark p-10 rounded-[56px] border border-gray-100 dark:border-white/5 shadow-soft hover:-translate-y-2 transition-all duration-500 group">
      <div className="size-16 rounded-[24px] bg-primary flex items-center justify-center text-secondary mb-8 shadow-lg group-hover:scale-110 transition-transform">
         <span className="material-symbols-outlined text-4xl font-black">{icon}</span>
      </div>
      <h3 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tighter mb-4">{title}</h3>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-relaxed uppercase tracking-widest">{desc}</p>
   </div>
);

const MetricItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
   <div className="space-y-2">
      <div className="text-4xl md:text-6xl font-black text-white tracking-tighter">{value}</div>
      <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] opacity-60">{label}</p>
   </div>
);

export default AboutUs;
