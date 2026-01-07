
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { AuditLog } from '../types';

export const AuditService = {

    /**
     * Log a security or administrative action to the immutable ledger
     */
    logAction: async (
        actorId: string,
        actorName: string,
        action: AuditLog['action'],
        details: string,
        severity: AuditLog['severity'] = 'LOW',
        targetType?: AuditLog['targetType'],
        targetId?: string
    ) => {
        try {
            await addDoc(collection(db, 'audit_logs'), {
                actorId,
                actorName,
                action,
                details,
                severity,
                targetType,
                targetId,
                timestamp: serverTimestamp(),
                metadata: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform
                }
            });
        } catch (error) {
            console.error("AUDIT FAILURE: Could not write to ledger", error);
        }
    },

    /**
     * Fetch recent audit trail for the command center
     */
    getLogs: async (max = 50) => {
        try {
            const q = query(
                collection(db, 'audit_logs'),
                orderBy('timestamp', 'desc'),
                limit(max)
            );
            const snap = await getDocs(q);
            return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
        } catch (error) {
            console.error("AUDIT FETCH ERROR", error);
            return [];
        }
    },

    /**
     * AI INTERNAL SYSTEM MANAGER (Simulated)
     * Runs silent checks on system integrity and returns a risk report
     */
    runSecurityScan: async () => {
        const risks: { level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', message: string, section: string }[] = [];

        // 1. Check for suspended vendors with active products (Data Integrity)
        // Note: This is an expensive query in real production, optimized here for demo
        const suspendedVendorsSnap = await getDocs(query(collection(db, 'users'), where('vendorStatus', '==', 'SUSPENDED')));
        const suspendedIds = suspendedVendorsSnap.docs.map(d => d.id);

        if (suspendedIds.length > 0) {
            // Check a sample of products (limited check)
            // In a real 'AI' agent, this would run backend-side
            const qProd = query(collection(db, 'products'), where('status', '==', 'ACTIVE'), limit(50));
            const prods = await getDocs(qProd);
            let leakCount = 0;
            prods.forEach(p => {
                if (suspendedIds.includes(p.data().vendorId)) leakCount++;
            });

            if (leakCount > 0) {
                risks.push({
                    level: 'HIGH',
                    section: 'DATA_LEAK',
                    message: `Detected ${leakCount} active products linked to SUSPENDED vendor nodes. Recommendation: Trigger cascade shutdown.`
                });
            }
        }

        // 2. Check for Riders with incomplete KYC but marked ONLINE (Compliance)
        const rogueRiders = await getDocs(query(
            collection(db, 'users'),
            where('role', '==', 'RIDER'),
            where('status', '==', 'ONLINE'),
            where('kycStatus', '!=', 'VERIFIED')
        ));

        if (!rogueRiders.empty) {
            risks.push({
                level: 'CRITICAL',
                section: 'COMPLIANCE',
                message: `${rogueRiders.size} Unverified Riders are currently ONLINE. Immediate suspension recommended.`
            });
        }

        // 3. High Value Wallet Exposure
        const richWallets = await getDocs(query(collection(db, 'users'), where('walletBalance', '>', 5000), limit(20)));
        if (!richWallets.empty) {
            risks.push({
                level: 'MEDIUM',
                section: 'FINANCE',
                message: `${richWallets.size} wallets exceed $5,000 cold storage implementation recommended.`
            });
        }

        // 4. Admin Account Security (Mock)
        // Checking if we have multiple admins
        // const admins = await getDocs(query(collection(db, 'users'), where('role', '==', 'ADMIN')));
        // if (admins.size < 2) {
        //    risks.push({
        //       level: 'MEDIUM',
        //       section: 'ACCESS',
        //       message: 'Only 1 Super Admin detected. Redundancy recommended to prevent lockout.'
        //    });
        // }

        return risks;
    }
};
