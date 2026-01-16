
import { api } from '../../services/api';
import { db } from '../../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export interface RiderLocationPayload {
    riderId: string;
    latitude: number;
    longitude: number;
    status: 'ONLINE' | 'OFFLINE' | 'BUSY';
}

export class RiderService {

    /**
     * Sends a heartbeat to the backend with current location.
     * Should be called periodically (e.g., every 30s) by the background task.
     */
    static async sendHeartbeat(payload: RiderLocationPayload): Promise<void> {
        try {
            await api.post('/logistics/rider/location', payload);
        } catch (error) {
            console.error('Failed to send rider heartbeat:', error);
            // Silent fail is acceptable for heartbeat, retry next tick
        }
    }

    /**
     * Listens to the Rider's own document to detect job assignments.
     * The backend assigns a job by setting `currentOrderId` on the Rider doc.
     */
    static subscribeToJobAssignment(riderId: string, onAssign: (orderId: string | null) => void): () => void {
        const riderRef = doc(db, 'riders', riderId);

        const unsubscribe = onSnapshot(riderRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                const currentOrderId = data['currentOrderId'] || null;
                onAssign(currentOrderId);
            }
        });

        return unsubscribe;
    }

    /**
     * Accepts a job (Optional, for explicit acknowledgment)
     */
    static async acceptJob(jobId: string, riderId: string): Promise<void> {
        await api.post('/logistics/jobs/status', { orderId: jobId, status: 'ACCEPTED', riderId });
    }

    static async pickupJob(jobId: string, riderId: string): Promise<void> {
        await api.post('/logistics/jobs/status', { orderId: jobId, status: 'PICKED_UP', riderId });
    }

    static async completeJob(jobId: string, riderId: string): Promise<void> {
        await api.post('/logistics/jobs/status', { orderId: jobId, status: 'DELIVERED', riderId });
    }

    static async cancelJob(jobId: string, riderId: string): Promise<void> {
        await api.post('/logistics/jobs/status', { orderId: jobId, status: 'CANCELLED', riderId });
    }

    static async updateStatus(riderId: string, status: 'ONLINE' | 'OFFLINE' | 'BUSY'): Promise<void> {
        await api.post('/logistics/rider/status', { riderId, status });
    }
}
