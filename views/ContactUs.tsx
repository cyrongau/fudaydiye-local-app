
import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

const ContactUs: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [business, setBusiness] = useState({
        title: 'Fudaydiye',
        shortDesc: "Hargeisa's ultimate commerce mesh.",
        address: "Independence Ave, Telesom Plaza, 4th Floor, Hargeisa, Somaliland",
        phone: "+252 63 444 1122",
        email: "ops@fudaydiye.so",
        socialFacebook: "",
        socialInstagram: "",
        socialTwitter: "",
        socialYoutube: "",
    });

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "system_config", "global"), (doc) => {
            if (doc.exists() && doc.data().business) {
                setBusiness(prev => ({ ...prev, ...doc.data().business }));
            }
        });
        return () => unsub();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            alert("Message dispatched to Ops Control.");
            setFormData({ name: '', email: '', subject: '', message: '' });
            setLoading(false);
        }, 1500);
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display">
            {/* Header */}
            <div className="bg-secondary text-white py-24 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/10 blur-[100px] rounded-full translate-x-1/2"></div>
                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 block animate-in fade-in slide-in-from-bottom-4 duration-700">Get in Touch</span>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">Contact Us</h1>
                    <p className="text-lg text-white/60 font-medium max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                        Need assistance? Our support mesh is active 24/7. Reach out for inquiries, partnerships, or logistical support.
                    </p>
                </div>
            </div>

            <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16">

                {/* Contact Info */}
                <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-1000">
                    <div>
                        <h3 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tighter mb-2">Headquarters</h3>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-widest whitespace-pre-line">{business.address}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-soft">
                            <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-2xl font-black">call</span>
                            </div>
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Phone</h4>
                            <p className="text-lg font-black text-secondary dark:text-white tracking-tight">{business.phone}</p>
                        </div>
                        <div className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-soft">
                            <div className="size-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-2xl font-black">mail</span>
                            </div>
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Email</h4>
                            <p className="text-lg font-black text-secondary dark:text-white tracking-tight">{business.email}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-black text-secondary dark:text-white uppercase tracking-tighter mb-4">Connect With Us</h3>
                        <div className="flex gap-4">
                            {business.socialFacebook && <SocialBtn icon="public" link={business.socialFacebook} />}
                            {business.socialInstagram && <SocialBtn icon="photo_camera" link={business.socialInstagram} />}
                            {business.socialTwitter && <SocialBtn icon="chat" link={business.socialTwitter} />}
                            {business.socialYoutube && <SocialBtn icon="play_circle" link={business.socialYoutube} />}
                        </div>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="bg-white dark:bg-surface-dark p-8 md:p-12 rounded-[48px] shadow-2xl border border-gray-100 dark:border-white/5 animate-in fade-in slide-in-from-right-4 duration-1000">
                    <h3 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tighter mb-8">Send a Message</h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Full Name</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full h-14 bg-gray-50 dark:bg-white/5 rounded-2xl border-none px-6 text-sm font-bold focus:ring-2 focus:ring-primary/50 transition-all dark:text-white" placeholder="John Doe" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email Address</label>
                                <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full h-14 bg-gray-50 dark:bg-white/5 rounded-2xl border-none px-6 text-sm font-bold focus:ring-2 focus:ring-primary/50 transition-all dark:text-white" placeholder="john@example.com" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Subject</label>
                            <input required value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} className="w-full h-14 bg-gray-50 dark:bg-white/5 rounded-2xl border-none px-6 text-sm font-bold focus:ring-2 focus:ring-primary/50 transition-all dark:text-white" placeholder="How can we help?" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Message</label>
                            <textarea required rows={4} value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 rounded-2xl border-none p-6 text-sm font-medium focus:ring-2 focus:ring-primary/50 transition-all dark:text-white resize-none" placeholder="Type your message here..." />
                        </div>
                        <button disabled={loading} className="w-full h-16 bg-secondary text-white rounded-[20px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-primary hover:text-secondary transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
                            {loading ? <span className="animate-spin material-symbols-outlined">sync</span> : <>Send Message <span className="material-symbols-outlined">send</span></>}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

const SocialBtn: React.FC<{ icon: string, link: string }> = ({ icon, link }) => (
    <a href={link} target="_blank" rel="noreferrer" className="size-12 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-secondary transition-all">
        <span className="material-symbols-outlined text-2xl">{icon}</span>
    </a>
)

export default ContactUs;
