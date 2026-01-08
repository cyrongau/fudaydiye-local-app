import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Providers';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Papa from 'papaparse';
import { Product } from '../types';

const VendorProductImport: React.FC = () => {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            parseCSV(selectedFile);
        }
    };

    const parseCSV = (file: File) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length) {
                    setLogs(prev => [...prev, `CSV Error: ${results.errors[0].message}`]);
                    return;
                }
                setParsedData(results.data);
                setLogs(prev => [...prev, `Parsed ${results.data.length} rows successfully.`]);
            },
            error: (error: any) => {
                setLogs(prev => [...prev, `Parse Failed: ${error.message}`]);
            }
        });
    };

    const handleUpload = async () => {
        if (!user || parsedData.length === 0) return;
        setIsUploading(true);
        setLogs([]);

        const batchSize = 400; // Safety margin below 500
        const chunks = [];

        for (let i = 0; i < parsedData.length; i += batchSize) {
            chunks.push(parsedData.slice(i, i + batchSize));
        }

        try {
            let processedCount = 0;

            for (const chunk of chunks) {
                const batch = writeBatch(db);

                chunk.forEach((row: any) => {
                    if (!row.name || !row.price) {
                        console.warn("Skipping invalid row", row);
                        return;
                    }

                    const newDocRef = doc(collection(db, "products"));
                    const productData: Partial<Product> = {
                        id: newDocRef.id,
                        name: row.name,
                        description: row.description || '',
                        basePrice: parseFloat(row.price) || 0,
                        baseStock: parseInt(row.stock) || 0,
                        category: row.category || 'Uncategorized',
                        images: row.image_url ? [row.image_url] : [],
                        productType: 'SIMPLE',
                        status: 'ACTIVE',
                        vendorId: user.uid,
                        vendor: profile?.businessName || 'Unknown Vendor',
                        rating: 0,
                        reviewsCount: 0,
                        hasVariations: false,
                        attributes: [],
                        variations: [],
                        createdAt: new Date().toISOString() // Use ISO string for client-side simplicity until server timestamp
                    };

                    batch.set(newDocRef, productData);
                });

                await batch.commit();
                processedCount += chunk.length;
                setProgress(Math.round((processedCount / parsedData.length) * 100));
                setLogs(prev => [...prev, `Committed batch of ${chunk.length} items...`]);
            }

            setLogs(prev => [...prev, "All batches completed successfully!"]);
            setTimeout(() => navigate('/vendor/products'), 2000);

        } catch (err: any) {
            console.error(err);
            setLogs(prev => [...prev, `Upload Failed: ${err.message}`]);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto min-h-screen bg-gray-50 dark:bg-background-dark">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/vendor/products')} className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors">
                    <span className="material-symbols-outlined text-gray-500">arrow_back</span>
                </button>
                <h1 className="text-2xl font-black text-secondary dark:text-white uppercase tracking-tighter">Bulk Import Inventory</h1>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-white/5 space-y-8">

                {/* Step 1: Template */}
                <section className="space-y-4">
                    <h3 className="text-lg font-black uppercase text-primary">1. Download Template</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Use our standard CSV template to ensure your data is formatted correctly.</p>
                    <a href="/templates/product_import_template.csv" download className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-white/5 text-secondary dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined">download</span>
                        Download CSV Template
                    </a>
                </section>

                <hr className="border-gray-100 dark:border-white/5" />

                {/* Step 2: Upload */}
                <section className="space-y-4">
                    <h3 className="text-lg font-black uppercase text-primary">2. Upload & Parse</h3>
                    <div
                        className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${file ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-white/10 hover:border-primary/50'}`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">upload_file</span>
                        {file ? (
                            <div>
                                <p className="font-bold text-secondary dark:text-white">{file.name}</p>
                                <p className="text-xs text-primary font-bold uppercase mt-1">{parsedData.length} items parsed</p>
                            </div>
                        ) : (
                            <div>
                                <p className="font-bold text-gray-400">Click to upload CSV</p>
                                <p className="text-xs text-gray-300 mt-1">Maximum 500 items per batch recommended</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Console / Status */}
                {logs.length > 0 && (
                    <div className="bg-black/90 rounded-xl p-4 font-mono text-xs text-green-400 max-h-40 overflow-y-auto">
                        {logs.map((log, i) => <div key={i}>&gt; {log}</div>)}
                    </div>
                )}

                {/* Action */}
                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleUpload}
                        disabled={!parsedData.length || isUploading}
                        className="px-8 py-4 bg-primary text-secondary font-black uppercase tracking-widest rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-1 transition-all flex items-center gap-3"
                    >
                        {isUploading ? (
                            <>
                                <span className="size-4 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin"></span>
                                Importing ({progress}%)
                            </>
                        ) : (
                            <>
                                Start Import
                                <span className="material-symbols-outlined">rocket_launch</span>
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};
export default VendorProductImport;
