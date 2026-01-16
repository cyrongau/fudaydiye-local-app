
const admin = require('firebase-admin');
// constant removed

// Initialize app (try/catch in case already executing in environment)
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(), // Use emulator defaults
            projectId: 'fudaydiye-commerce'
        });
    } catch (e) {
        console.error("Init error:", e);
    }
}

const db = admin.firestore();

async function checkOrders(email) {
    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        const uid = userRecord.uid;
        console.log(`Rider: ${email} (UID: ${uid})`);

        const ordersSnapshot = await db.collection('orders')
            .where('riderId', '==', uid)
            .get();

        if (ordersSnapshot.empty) {
            console.log('No orders found for this rider in Firestore.');
            return;
        }

        console.log(`Found ${ordersSnapshot.size} orders:`);
        ordersSnapshot.forEach(doc => {
            const data = doc.data();
            console.log(`\n[Order ID: ${doc.id}]`);
            console.log(`- Order Number: ${data.orderNumber}`);
            console.log(`- Status: ${data.status}`);
            console.log(`- Vendor ID: ${data.vendorId}`);
            console.log(`- Customer: ${data.customerName}`);
            console.log(`- Created At: ${data.createdAt ? data.createdAt.toDate() : 'N/A'}`);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

// Run for driver@fudaydiye.so
checkOrders('driver@fudaydiye.so');
