
import React, { useEffect, useState } from 'react';
import { seedTestUsers } from '../lib/seeder';
import { useNavigate } from 'react-router-dom';

const SeedView: React.FC = () => {
    const [status, setStatus] = useState('Initializing Seeder...');
    const navigate = useNavigate();

    useEffect(() => {
        const run = async () => {
            setStatus('Provisioning Infrastructure...');
            const success = await seedTestUsers();
            if (success) {
                setStatus('Seeding Complete! Redirecting...');
                setTimeout(() => navigate('/'), 1500);
            } else {
                setStatus('Seeding Failed. Check Console.');
            }
        };
        run();
    }, []);

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-black text-white">
            <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <h1 className="text-xl font-bold uppercase tracking-widest">{status}</h1>
        </div>
    );
};

export default SeedView;
