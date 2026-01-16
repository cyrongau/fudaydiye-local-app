
import * as admin from 'firebase-admin';

admin.initializeApp({
    projectId: 'fudaydiye-commerce'
});

async function main() {
    const phoneNumber = '+254715491409';
    console.log(`Searching for user with phone: ${phoneNumber}...`);

    try {
        const user = await admin.auth().getUserByPhoneNumber(phoneNumber);
        console.log('FOUND AUTH USER:');
        console.log(JSON.stringify(user.toJSON(), null, 2));

        // Check Firestore
        const doc = await admin.firestore().collection('users').doc(user.uid).get();
        if (doc.exists) {
            console.log('FOUND FIRESTORE DOC:');
            console.log(JSON.stringify(doc.data(), null, 2));
        } else {
            console.log('No Firestore document found for this UID.');
        }

    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            console.log('No user found with this phone number.');
        } else {
            console.error('Error:', error);
        }
    }
}

main();
