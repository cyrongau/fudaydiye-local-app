"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
// Initialize Firebase Admin
admin.initializeApp({
    projectId: 'fudaydiye-commerce'
});
const ZOMBIE_UID = 'fNPcuVZTJ9Qs7nHLgAElwUyeJow2';
const ADMIN_UID = 'z6cxJjRX4sfZiiHequbYbdBrXQd2';
const PHONE_NUMBER = '+254715491409';
async function mergeAccounts() {
    console.log(`Starting merge process for Admin: ${ADMIN_UID} and Zombie: ${ZOMBIE_UID}`);
    try {
        // 1. Check if Zombie exists and delete it
        try {
            const zombieUser = await admin.auth().getUser(ZOMBIE_UID);
            console.log(`Found Zombie User: ${zombieUser.email} (${zombieUser.uid}). Deleting...`);
            await admin.auth().deleteUser(ZOMBIE_UID);
            console.log('✅ Zombie User deleted from Auth.');
        }
        catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.log('⚠️ Zombie user not found in Auth (already deleted?). Proceeding...');
            }
            else {
                throw error;
            }
        }
        // 2. Double check if phone number is already in use by someone else (just in case)
        try {
            const existingUser = await admin.auth().getUserByPhoneNumber(PHONE_NUMBER);
            if (existingUser.uid !== ADMIN_UID) {
                console.log(`⚠️ Phone number ${PHONE_NUMBER} is still linked to ${existingUser.uid}. Attempting to delete that one too...`);
                await admin.auth().deleteUser(existingUser.uid);
                console.log('✅ Colliding user deleted.');
            }
        }
        catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.log('Phone number is free. Proceeding to link.');
            }
        }
        // 3. Update Admin Account with Phone Number
        console.log(`Updating Admin User ${ADMIN_UID} with phone ${PHONE_NUMBER}...`);
        await admin.auth().updateUser(ADMIN_UID, {
            phoneNumber: PHONE_NUMBER
        });
        console.log('✅ Admin User updated successfully!');
        // 4. (Optional) Merge Firestore Data?
        // Checking if zombie had a firestore doc
        const zombieDocRef = admin.firestore().collection('users').doc(ZOMBIE_UID);
        const zombieDoc = await zombieDocRef.get();
        if (zombieDoc.exists) {
            console.log('Found Firestore data for Zombie. Merging into Admin...');
            const zombieData = zombieDoc.data();
            if (zombieData) {
                // Merge strategy: Copy everything that doesn't exist on Admin
                // But be careful not to overwrite Admin critical fields
                const adminDocRef = admin.firestore().collection('users').doc(ADMIN_UID);
                await adminDocRef.set(zombieData, { merge: true });
                console.log('✅ Data merged.');
                // Delete old doc
                await zombieDocRef.delete();
                console.log('✅ Zombie Firestore doc deleted.');
            }
        }
        else {
            console.log('No Firestore data found for Zombie.');
        }
        console.log('🎉 MIGRATION COMPLETE. You can now login with the phone number.');
    }
    catch (error) {
        console.error('❌ Error during merge:', error);
    }
}
mergeAccounts();
//# sourceMappingURL=merge_zombie_accounts.js.map