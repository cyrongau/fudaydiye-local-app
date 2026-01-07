
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DocumentModal from '../components/DocumentModal';

const ExternalDeliveryTracking: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  const shipmentData = {
    id: id || 'FD-1290',
    status: 'IN TRANSIT',
    origin: 'Hargeisa Warehouse A',
    destination: 'Berbera Port Authority',
    rider: 'Khadar Ahmed',
    vehicle: 'Bajaj (SL-229)',
    eta: '45 mins',
    size: 'Medium',
    weight: '12.5 kg',
    price: '$4.50'
  };

  const steps = [
    { label: 'Shipment Requested', time: '09:00 AM', completed: true },
    { label: 'Picked Up', time: '10:15 AM', completed: true },
    { label: 'In Transit', time: 'Current', completed: true, active: true },
    { label: 'Delivered', time: 'Expected 11:30 AM', completed: false }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-secondary dark:text-primary tracking-tighter leading-none">Track Dispatch</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">#{shipmentData.id}</p>
          </div>
        </div>
        <button 
          onClick={() => setSelectedDoc({ id: shipmentData.id, date: 'Today', amount: shipmentData.price, location: shipmentData.destination, size: shipmentData.size })}
          className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-sm"
        >
          <span className="material-symbols-outlined text-[22px]">receipt</span>
        </button>
      </header>

      <main className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto pb-10 no-scrollbar">
        {/* Status Indicator */}
        <section className="bg-secondary text-white p-6 rounded-[32px] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 size-32 bg-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="relative z-10 flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Live Delivery Status</p>
              <h2 className="text-3xl font-black tracking-tighter">{shipmentData.status}</h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">Arriving In</p>
              <span className="text-xl font-black text-primary">{shipmentData.eta}</span>
            </div>
          </div>
        </section>

        {/* Map Snapshot View */}
        <section 
          onClick={() => navigate(`/customer/track/${shipmentData.id}`)}
          className="relative h-48 rounded-[32px] overflow-hidden border border-gray-100 dark:border-gray-800 shadow-soft cursor-pointer group"
        >
          <img 
            src="https://images.unsplash.com/photo-1569336415962-a4bd9f6dfc0f?q=80&w=2000&auto=format&fit=crop" 
            className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110"
            alt="Map View"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/20">
              <div className="size-2 rounded-full bg-primary animate-ping"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary dark:text-white">View Live GPS Tracking</span>
            </div>
          </div>
        </section>

        {/* Rider Info */}
        <section className="bg-white dark:bg-surface-dark p-5 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-soft flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="https://picsum.photos/id/1012/100/100" className="size-14 rounded-2xl object-cover border border-gray-100 dark:border-gray-800 shadow-sm" alt="Rider" />
            <div>
              <h4 className="text-sm font-black text-secondary dark:text-white leading-none mb-1">{shipmentData.rider}</h4>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{shipmentData.vehicle}</p>
              <div className="flex items-center gap-1 text-amber-400 mt-1">
                <span className="material-symbols-outlined text-[14px] fill-1">star</span>
                <span className="text-[10px] font-black text-gray-500">4.9 Rider Score</span>
              </div>
            </div>
          </div>
          <button className="size-12 rounded-2xl bg-primary text-secondary flex items-center justify-center shadow-lg active:scale-95 transition-all">
            <span className="material-symbols-outlined">call</span>
          </button>
        </section>

        {/* Shipment Details Grid */}
        <section className="grid grid-cols-2 gap-4">
          <DetailTile label="Origin" value={shipmentData.origin} icon="home" />
          <DetailTile label="Destination" value={shipmentData.destination} icon="location_on" />
          <DetailTile label="Volume" value={shipmentData.size} icon="package" />
          <DetailTile label="Weight" value={shipmentData.weight} icon="fitness_center" />
        </section>

        {/* Delivery Timeline */}
        <section className="bg-white dark:bg-surface-dark p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-soft">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Shipment Progress</h3>
          <div className="space-y-0">
            {steps.map((step, idx) => (
              <div key={idx} className="relative flex gap-6 pb-8 last:pb-0">
                {idx !== steps.length - 1 && (
                  <div className={`absolute left-2.5 top-5 bottom-0 w-0.5 ${step.completed ? 'bg-primary' : 'bg-gray-100 dark:bg-white/5 border-l-2 border-dashed'}`}></div>
                )}
                <div className={`relative z-10 size-5 rounded-full border-2 flex items-center justify-center ${step.completed ? 'bg-primary border-primary' : 'bg-white dark:bg-surface-dark border-gray-200'}`}>
                  {step.completed && <span className="material-symbols-outlined text-secondary text-[12px] font-black">check</span>}
                  {step.active && <div className="size-1.5 rounded-full bg-white animate-ping"></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-xs font-black uppercase tracking-widest ${step.active ? 'text-primary' : step.completed ? 'text-secondary dark:text-white' : 'text-gray-400'}`}>
                    {step.label}
                  </h4>
                  <p className="text-[10px] font-bold text-gray-400 mt-0.5">{step.time}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-4">
           <button className="w-full h-16 bg-secondary text-primary font-black uppercase tracking-[0.2em] rounded-button shadow-xl active:scale-95 transition-all text-xs flex items-center justify-center gap-3">
             <span className="material-symbols-outlined">support_agent</span>
             Contact Support
           </button>
           <p className="text-[9px] font-black text-gray-400 text-center uppercase tracking-widest">
             Estimated rates are subject to traffic & hub load
           </p>
        </div>
      </main>

      <DocumentModal 
        isOpen={!!selectedDoc} 
        onClose={() => setSelectedDoc(null)} 
        type="SHIPPING_RECEIPT" 
        data={selectedDoc || {}} 
      />
    </div>
  );
};

const DetailTile: React.FC<{ label: string; value: string; icon: string }> = ({ label, value, icon }) => (
  <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
    <div className="flex items-center gap-2 mb-2">
      <span className="material-symbols-outlined text-primary text-[18px]">{icon}</span>
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
    </div>
    <p className="text-xs font-black text-secondary dark:text-white truncate">{value}</p>
  </div>
);

export default ExternalDeliveryTracking;
