---
description: Build a debug APK for the Android application
---

# Build Android APK

This workflow guides you through generating an Android APK file for testing on physical devices.

## Prerequisites

1.  **JDK (Java Development Kit)**: Ensure Java is installed and `JAVA_HOME` is set.
2.  **Anderson SDK**: Ensure Android SDK is installed (usually via Android Studio).
3.  **Capacitor**: Authenticated and synced.

## Steps

### 1. Build Web Assets
First, build the React application to generate the `dist` folder.
```powershell
npm run build
```

### 2. Sync Native Projects
Copy the web assets to the native Android project.
```powershell
npx cap sync android
```
// turbo

### 3. Build APK with Gradle
Navigate to the android folder and run the build command.
```powershell
cd android
./gradlew assembleDebug
```

### 4. Locate APK
The generated APK will be located at:
`android/app/build/outputs/apk/debug/app-debug.apk`

---
> [!TIP]
> You can drag and drop this `app-debug.apk` file to WhatsApp or Email to share it with your staff.
> On their phone, they may need to enable "Install from Unknown Sources".
