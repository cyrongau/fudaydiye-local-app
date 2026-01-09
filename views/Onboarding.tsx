import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import splashLogistics from '../src/assets/onboarding/splash_logistics_clean.png';
import splashLive from '../src/assets/onboarding/splash_live_clean.png';
import splashVendor from '../src/assets/onboarding/splash_vendor_clean.png';
import splashRider from '../src/assets/onboarding/splash_rider_clean.png';
import logo from '../src/assets/logo.png'; // Assuming standard logo path

const slides = [
    {
        id: 'logistics',
        image: splashLogistics,
        bg: 'bg-[#F9FAFB]',
        title: "Fudaydiye Logistics",
        desc: "Efficient routes. Faster earnings. The reliable partner for your delivery business.",
        accent: "text-primary"
    },
    {
        id: 'live',
        image: splashLive,
        bg: 'bg-[#012E2B]',
        title: "Shop Live, Shop Instantly",
        desc: "Watch sellers, ask questions, and grab exclusive deals in real-time.",
        accent: "text-white"
    },
    {
        id: 'vendor',
        image: splashVendor,
        bg: 'bg-[#F9FAFB]',
        title: "Your Store, Everywhere",
        desc: "Seamless store management, sales tracking, and live session hosting right from your pocket.",
        accent: "text-primary"
    },
    {
        id: 'rider',
        image: splashRider,
        bg: 'bg-[#F9FAFB]',
        title: "New Orders Nearby",
        desc: "Accept delivery requests, track your earnings, and navigate with precision.",
        accent: "text-primary"
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
        navigate('/', { replace: true });
    };

    const currentSlide = slides[currentIndex];

    // Determine text colors based on background brightness approximation or manual flag
    // For this set, mostly light/white backgrounds except 'live' which is dark green.
    const isDarkBg = currentSlide.id === 'live';
    const textColor = isDarkBg ? 'text-white' : 'text-secondary';
    const subTextColor = isDarkBg ? 'text-gray-300' : 'text-gray-500';

    return (
        <div className={`fixed inset-0 w-screen h-screen z-50 flex flex-col items-center justify-between overflow-hidden transition-colors duration-500 ${currentSlide.bg}`}>

            {/* Full Screen Image Layer */}
            <div className="absolute inset-0 w-full h-full z-0">
                <img
                    src={currentSlide.image}
                    alt="Onboarding Background"
                    className="w-full h-full object-cover"
                />
                {/* Gradient Overlay for Text Readability: Only necessary if images are busy at bottom */}
                <div className={`absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t ${isDarkBg ? 'from-[#012E2B] via-[#012E2B]/80' : 'from-[#F9FAFB] via-[#F9FAFB]/80'} to-transparent`} />
            </div>

            {/* Top Navigation Overlay */}
            <div className="absolute top-0 w-full p-8 z-20 flex justify-between items-start">
                {/* Logo Overlay - Optional, nice branding touch */}
                <div className="flex items-center gap-2 opacity-90">
                    <img src={logo} alt="Fudaydiye" className="h-8 w-auto object-contain brightness-110 drop-shadow-sm" />
                    <span className={`text-lg font-black tracking-tighter uppercase ${textColor} drop-shadow-sm hidden md:block`}>Fudaydiye</span>
                </div>

                <button
                    onClick={completeOnboarding}
                    className="px-4 py-2 bg-black/5 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-black/10 transition-all border border-white/10"
                >
                    Skip
                </button>
            </div>

            {/* Content Area (Bottom Half) */}
            <div className="absolute bottom-0 w-full z-20 px-8 pb-12 pt-12 flex flex-col items-center text-center max-w-lg mx-auto">

                {/* Content Text */}
                <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 key={currentIndex}"> {/* Key forces re-render/anim */}
                    <h2 className={`text-4xl xs:text-5xl font-black tracking-tighter uppercase leading-[0.9] mb-4 ${currentSlide.accent || textColor} drop-shadow-sm`}>
                        {currentSlide.title}
                    </h2>
                    <p className={`text-sm xs:text-base font-medium leading-relaxed ${subTextColor} max-w-xs mx-auto`}>
                        {currentSlide.desc}
                    </p>
                </div>

                {/* Bottom Controls */}
                <div className="w-full flex flex-col items-center gap-8">
                    {/* Dots */}
                    <div className="flex gap-2">
                        {slides.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full transition-all duration-500 shadow-sm ${idx === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-gray-400/30'}`}
                            />
                        ))}
                    </div>

                    {/* Primary Button */}
                    <button
                        onClick={handleNext}
                        className="w-full h-16 bg-primary text-secondary font-black text-sm uppercase tracking-[0.2em] rounded-[24px] shadow-lg shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 hover:brightness-110"
                    >
                        {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
                        <span className="material-symbols-outlined text-xl font-bold">arrow_forward</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
