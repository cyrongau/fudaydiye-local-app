
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
// Assuming running with GOOGLE_APPLICATION_CREDENTIALS or inside firebase:shell environment
// If running via ts-node locally with service account:
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const PHONE_NUMBER = '+254715491409';
const KEEP_EMAIL = 'admin@fudaydiye.so';

async function cleanup() {
    try {
        console.log(`Looking up user with phone: ${PHONE_NUMBER}...`);
        const user = await admin.auth().getUserByPhoneNumber(PHONE_NUMBER);

        console.log('Found User:');
        console.log(`- UID: ${user.uid}`);
        console.log(`- Email: ${user.email}`);
        console.log(`- Phone: ${user.phoneNumber}`);
        console.log(`- Created: ${user.metadata.creationTime}`);

        if (user.email === KEEP_EMAIL) {
            console.log("WAIT! This is the Admin account. Do NOT delete.");
            console.log("If this is the account you are logged in as, then the phone number is ALREADY linked.");
            return;
        }

        console.log(`\nDeleting Zombie Account (${user.uid})...`);
        await admin.auth().deleteUser(user.uid);
        console.log("Successfully deleted user from Auth.");

        // Optional: Delete from Firestore 'users' collection too
        const db = admin.firestore();
        await db.collection('users').doc(user.uid).delete();
        console.log("Successfully deleted profile from Firestore.");

        console.log("\nDONE. The phone number is now free.");

    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            console.log("No user found with this phone number. It should be free to link.");
        } else {
            console.error("Error:", error);
        }
    }
}

cleanup();
