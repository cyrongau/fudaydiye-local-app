
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Providers';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const PaymentConfirmation: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, profile } = useAuth();

    // Scanned Data (Simulated or passed via state)
    const scannedData = location.state as {
        invoiceId: string;
        merchantName: string;
        amount: number;
        itemCount: number;
    } | null;

    const [pin, setPin] = useState(['', '', '', '']);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    // Defaults if accessed directly (for dev testing)
    const invoice = scannedData || {
        invoiceId: 'INV-DEMO-8821',
        merchantName: 'City Supermarket - Hargeisa',
        amount: 45.50,
        itemCount: 8
    };

    const handlePinChange = (index: number, value: string) => {
        if (value.length > 1) return;
        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);

        // Auto-focus next
        if (value && index < 3) {
            document.getElementById(`pin-${index + 1}`)?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            document.getElementById(`pin-${index - 1}`)?.focus();
        }
    };

    const handleAuthorize = async () => {
        if (pin.join('').length !== 4) {
            setError('Please enter a valid 4-digit PIN');
            return;
        }

        setIsProcessing(true);
        setError('');

        try {
            // Simulate API Call
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Create Order Record (Simulated)
            await addDoc(collection(db, 'orders'), {
                userId: user?.uid,
                vendorName: invoice.merchantName,
                totalAmount: invoice.amount,
                status: 'COMPLETED',
                paymentMethod: 'WALLET_QR',
                createdAt: serverTimestamp(),
                items: [{ name: 'Scanned Invoice Items', quantity: invoice.itemCount, price: invoice.amount }]
            });

            // Success Redirect
            navigate('/customer/orders', { state: { success: true } });

        } catch (err) {
            console.error(err);
            setError('Payment Authorization Failed. Network timeout.');
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 font-display">
            {/* Header */}
            <header className="p-6 pt-12 flex justify-between items-center">
                <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-gray-500">close</span>
                </button>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Secure Payment</p>
                <div className="size-10"></div>
            </header>

            <main className="flex-1 flex flex-col px-8 pb-10">
                <div className="flex-1 flex flex-col justify-center items-center text-center">
                    <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <span className="material-symbols-outlined text-4xl text-primary">qr_code_2</span>
                    </div>

                    <h2 className="text-3xl font-black text-secondary dark:text-white uppercase tracking-tighter mb-2">${invoice.amount.toFixed(2)}</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">To: {invoice.merchantName}</p>

                    <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 w-full max-w-xs mb-10 border border-gray-100 dark:border-white/10">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                            <span>Invoice ID</span>
                            <span>{invoice.invoiceId}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                            <span>Items</span>
                            <span>{invoice.itemCount} Units</span>
                        </div>
                    </div>

                    <div className="space-y-4 w-full max-w-[240px]">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Enter Wallet PIN</label>
                        <div className="flex justify-between gap-3">
                            {pin.map((digit, idx) => (
                                <input
                                    key={idx}
                                    id={`pin-${idx}`}
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handlePinChange(idx, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(idx, e)}
                                    className="w-12 h-14 bg-white dark:bg-surface-dark border-2 border-gray-200 dark:border-white/10 rounded-xl text-center text-xl font-black focus:border-primary focus:outline-none transition-colors"
                                />
                            ))}
                        </div>
                    </div>

                    {error && <p className="mt-6 text-[10px] font-black text-red-500 uppercase tracking-widest animate-bounce">{error}</p>}
                </div>

                <button
                    onClick={handleAuthorize}
                    disabled={isProcessing}
                    className="w-full h-16 bg-gradient-to-r from-secondary to-secondary/90 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:scale-100"
                >
                    {isProcessing ? (
                        <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <span className="material-symbols-outlined">fingerprint</span>
                            <span>Authorize Payment</span>
                        </>
                    )}
                </button>
            </main>
        </div>
    );
};

export default PaymentConfirmation;
