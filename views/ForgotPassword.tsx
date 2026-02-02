import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

const ForgotPassword: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError("Please enter your email address.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccessMessage("Password reset link sent! Check your email.");
        } catch (err: any) {
            console.error("Reset Error:", err);
            setError(err.message || "Failed to send reset link. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex flex-col min-h-screen items-center justify-center bg-background-light dark:bg-background-dark transition-colors duration-500 font-display p-6">
            <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070')] bg-cover bg-center"></div>

            <div className="relative z-10 w-full max-w-lg bg-white/95 dark:bg-surface-dark/95 backdrop-blur-2xl rounded-[48px] p-10 shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-start mb-6">
                    <button onClick={() => navigate('/login')} className="size-10 rounded-full bg-gray-100 dark:bg-white/5 border border-secondary/10 dark:border-white/10 flex items-center justify-center text-secondary dark:text-white hover:bg-gray-200 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-secondary dark:text-white uppercase mb-2">Reset Password</h1>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Enter your email address to receive a recovery link.</p>
                </div>

                {successMessage ? (
                    <div className="bg-green-50 border border-green-200 rounded-3xl p-8 text-center animate-in slide-in-from-bottom-2">
                        <div className="size-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                            <span className="material-symbols-outlined text-3xl">mark_email_read</span>
                        </div>
                        <h3 className="text-lg font-black text-green-800 uppercase mb-2">Check Your Inbox</h3>
                        <p className="text-sm font-medium text-green-700 mb-6">{successMessage}</p>
                        <button onClick={() => navigate('/login')} className="w-full h-12 bg-white text-green-700 font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg border border-green-200 hover:bg-green-50 transition-colors">Back to Login</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border border-red-100">{error}</div>}

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full h-16 rounded-[24px] bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 focus:border-primary text-secondary dark:text-white text-base font-bold px-6 shadow-inner focus:outline-none transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-16 bg-primary text-secondary font-black text-xs uppercase tracking-[0.3em] rounded-[24px] shadow-primary-glow flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:translate-y-[-2px]"
                        >
                            {isLoading ? <span className="material-symbols-outlined animate-spin">sync</span> : 'Send Reset Link'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
