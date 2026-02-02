import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'fudaydiye-commerce'
    });
}


async function setSuperAdminClaims() {
    const email = 'admin@fudaydiye.so';

    try {
        // Get user by email
        const user = await admin.auth().getUserByEmail(email);

        console.log(`Found user: ${email}`);
        console.log(`UID: ${user.uid}`);

        // Set custom claims
        await admin.auth().setCustomUserClaims(user.uid, { role: 'SUPER_ADMIN' });
        console.log('✅ Custom claims set');

        // Update Firestore to ensure consistency
        await admin.firestore().collection('users').doc(user.uid).set({
            role: 'SUPER_ADMIN',
            email: email,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log('✅ Firestore updated');

        // Verify claims were set
        const updatedUser = await admin.auth().getUser(user.uid);
        console.log('\n📋 Verification:');
        console.log('Custom claims:', updatedUser.customClaims);

        console.log('\n✅ SUCCESS: Super admin claims configured');
        console.log('⚠️  IMPORTANT: User must log out and log back in to get new token with claims');

    } catch (error) {
        console.error('❌ Error setting custom claims:', error);
        process.exit(1);
    }

    process.exit(0);
}

setSuperAdminClaims();
