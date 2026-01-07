import * asfunctions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Trigger: On Vendor Profile Update
 * Logic: If vendorStatus changes to SUSPENDED, recursively find all their products and mark them HIDDEN.
 */
export const onVendorSuspended = functions.firestore
    .document('users/{userId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        const vendorId = context.params.userId;

        // Check if role is VENDOR (optimization)
        if (after.role !== 'VENDOR') return;

        // Detect Status Change: ACTIVE -> SUSPENDED
        if (before.vendorStatus !== 'SUSPENDED' && after.vendorStatus === 'SUSPENDED') {
            console.log(`[Security] Vendor ${vendorId} suspended. Initiating product lockdown.`);

            try {
                // Batch Update (Limit 500 per batch)
                // In a real massive scale, we'd use a Recursive Delete or Chunked Query.
                // Assuming < 500 products for now or simple batching.
                const productsQuery = await db.collection('products')
                    .where('vendorId', '==', vendorId)
                    .where('status', '==', 'ACTIVE')
                    .limit(500)
                    .get();

                if (productsQuery.empty) {
                    console.log(`[Security] No active products found for vendor ${vendorId}.`);
                    return;
                }

                const batch = db.batch();
                let count = 0;

                productsQuery.docs.forEach(doc => {
                    batch.update(doc.ref, {
                        status: 'HIDDEN',
                        adminHidden: true, // Internal flag to know it was system-hidden
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    count++;
                });

                await batch.commit();
                console.log(`[Security] Successfully deactivated ${count} products for suspended vendor ${vendorId}.`);

                // Create Audit Log from Server Side
                await db.collection('audit_logs').add({
                    actorId: 'SYSTEM',
                    actorName: 'Cloud Security Protocol',
                    action: 'UPDATE',
                    targetType: 'PRODUCT',
                    details: `Auto-deactivated ${count} products due to Vendor Suspension`,
                    severity: 'HIGH',
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                });

            } catch (error) {
                console.error(`[Security] Failed to deactivate products for vendor ${vendorId}:`, error);
            }
        }
    });
