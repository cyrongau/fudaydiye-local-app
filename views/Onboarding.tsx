import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import splashLogistics from '../src/assets/onboarding/splash_logistics.png';
import splashLive from '../src/assets/onboarding/splash_live.png';
import splashVendor from '../src/assets/onboarding/splash_vendor.png';
import splashRider from '../src/assets/onboarding/splash_rider.png';

const slides = [
    {
        id: 'logistics',
        image: splashLogistics,
        bg: 'bg-white',
        title: 'Global Logistics',
        desc: 'Shop brands from around the world and track your deliveries in real-time.'
    },
    {
        id: 'live',
        image: splashLive,
        bg: 'bg-[#012E2B]',
        title: 'Live Shopping',
        desc: 'Watch authentic product demos and shop instantly with sellers.'
    },
    {
        id: 'vendor',
        image: splashVendor,
        bg: 'bg-gray-50',
        title: 'Vendor Tools',
        desc: 'Manage your entire store key metrics from one powerful dashboard.'
    },
    {
        id: 'rider',
        image: splashRider,
        bg: 'bg-white',
        title: 'Rider Network',
        desc: 'Join the fastest logistics network in Somaliland.'
    }
];

const Onboarding: React.FC = () => {
    const navigate = useNavigate();
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            completeOnboarding();
        }
    };

    const completeOnboarding = () => {
        localStorage.setItem('fddy_onboarding_completed', 'true');
        navigate('/login', { replace: true });
    };

    return (
        <div className={`relative h-screen w-full flex flex-col items-center justify-between overflow-hidden transition-colors duration-500 ${slides[currentIndex].bg}`}>
            {/* Skip Button */}
            <div className="absolute top-0 right-0 p-6 z-20">
                <button
                    onClick={completeOnboarding}
                    className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors"
                >
                    Skip
                </button>
            </div>

            {/* Image Container */}
            <div className="flex-1 w-full flex items-center justify-center p-6 relative">
                <img
                    src={slides[currentIndex].image}
                    alt={slides[currentIndex].title}
                    className="w-full h-full object-contain max-h-[70vh] animate-in fade-in zoom-in-95 duration-500 shadow-2xl rounded-[40px]"
                />
            </div>

            {/* Content */}
            <div className="w-full p-8 pb-12 bg-white/90 backdrop-blur-xl rounded-t-[48px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10">
                <div className="flex justify-center gap-2 mb-6">
                    {slides.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-gray-200'}`}
                        />
                    ))}
                </div>

                <div className="text-center mb-8 space-y-3">
                    <h2 className="text-2xl font-black text-secondary uppercase tracking-tighter">
                        {slides[currentIndex].title}
                    </h2>
                    <p className="text-xs font-medium text-gray-500 max-w-xs mx-auto leading-relaxed">
                        {slides[currentIndex].desc}
                    </p>
                </div>

                <button
                    onClick={handleNext}
                    className="w-full h-14 bg-primary text-secondary font-black text-sm uppercase tracking-[0.2em] rounded-[24px] shadow-primary-glow active:scale-[0.98] transition-all"
                >
                    {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
                </button>
            </div>
        </div>
    );
};

export default Onboarding;
