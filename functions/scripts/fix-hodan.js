
const admin = require('firebase-admin');

// Ensure Environment Variables are set
if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    console.error("FIREBASE_AUTH_EMULATOR_HOST not set");
    process.exit(1);
}

// Initialize without cert (uses emulator env vars)
admin.initializeApp({
    projectId: "fudaydiye-commerce"
});

async function main() {
    console.log("Searching for 'Hodan'...");
    let pageToken;
    let uid;
    let email;

    try {
        // 1. Try generic listing
        do {
            const listUsersResult = await admin.auth().listUsers(1000, pageToken);
            for (const user of listUsersResult.users) {
                if (user.displayName && user.displayName.toLowerCase().includes("hodan")) {
                    console.log(`FOUND USER (Auth): ${user.email} (${user.uid})`);
                    uid = user.uid;
                    email = user.email;
                    break;
                }
            }
            if (uid) break;
            pageToken = listUsersResult.pageToken;
        } while (pageToken);

        // 2. If not found, try Firestore
        if (!uid) {
            console.log("Not found in Auth DisplayName, checking Firestore...");
            const db = admin.firestore();
            // Try a broad search or just list recent
            const snap = await db.collection('users').get();
            snap.forEach(doc => {
                const data = doc.data();
                if (data.fullName && data.fullName.toLowerCase().includes('hodan')) {
                    console.log(`FOUND USER (Firestore): ${data.email} (${doc.id})`);
                    uid = doc.id;
                    email = data.email;
                }
            });
        }

        if (!uid) {
            console.log("User 'Hodan' not found anywhere. Listing first 5 users:");
            const list = await admin.auth().listUsers(5);
            list.users.forEach(u => console.log(`- ${u.email} (${u.displayName})`));
            return;
        }

        console.log(`Setting role to 'VENDOR' for ${uid}...`);
        await admin.auth().setCustomUserClaims(uid, { role: 'VENDOR' });

        const fresh = await admin.auth().getUser(uid);
        console.log(`Updated Claims:`, fresh.customClaims);
        console.log("SUCCESS! Role fixed.");

    } catch (error) {
        console.error("Script Error:", error);
    }
}

main();
