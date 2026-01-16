
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

// Initialize Firebase Admin
// Assuming service account is set via GOOGLE_APPLICATION_CREDENTIALS or environment
// For local emulator, it connects automatically if FIREBASE_AUTH_EMULATOR_HOST is set
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
    console.log("Fetching last 20 users...");
    try {
        const listUsersResult = await admin.auth().listUsers(20);
        listUsersResult.users.forEach((userRecord) => {
            console.log(`UID: ${userRecord.uid} | Email: ${userRecord.email} | Name: ${userRecord.displayName} | Role: ${(userRecord.customClaims as any)?.role || 'NONE'}`);
        });
        return listUsersResult.users;
    } catch (error) {
        console.error('Error listing users:', error);
        return [];
    }
}

async function setRole(emailOrUid: string, role: string) {
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

        await admin.auth().setCustomUserClaims(user.uid, { role });
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
