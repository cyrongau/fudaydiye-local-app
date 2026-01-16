
const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin (Auto-detects credentials or emulator)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'fudaydiye-commerce'
    });
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function listUsers() {
    console.log("Fetching last 50 users...");
    try {
        const listUsersResult = await admin.auth().listUsers(50);
        listUsersResult.users.forEach((userRecord) => {
            const role = (userRecord.customClaims && userRecord.customClaims.role) ? userRecord.customClaims.role : 'NONE';
            console.log(`UID: ${userRecord.uid} | Email: ${userRecord.email} | Name: ${userRecord.displayName} | Role: ${role}`);
        });
        return listUsersResult.users;
    } catch (error) {
        console.error('Error listing users:', error);
        return [];
    }
}

async function setRole(emailOrUid, role) {
    try {
        let user;
        if (emailOrUid.includes('@')) {
            user = await admin.auth().getUserByEmail(emailOrUid);
        } else {
            user = await admin.auth().getUser(emailOrUid);
        }

        if (!user) {
            console.error("User not found.");
            return;
        }

        const currentClaims = user.customClaims || {};
        await admin.auth().setCustomUserClaims(user.uid, { ...currentClaims, role });
        console.log(`Successfully set role '${role}' for user ${user.email} (${user.uid})`);

        // Verify
        const updatedUser = await admin.auth().getUser(user.uid);
        console.log("Current Claims:", updatedUser.customClaims);

    } catch (error) {
        console.error("Error setting role:", error);
    }
}

async function main() {
    await listUsers();

    rl.question('Enter Email or UID to assign RIDER role: ', async (answer) => {
        if (answer) {
            await setRole(answer.trim(), 'RIDER');
        }
        rl.close();
        process.exit(0);
    });
}

main();
