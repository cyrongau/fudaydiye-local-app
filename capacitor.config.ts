
/**
 * Fudaydiye Capacitor Configuration
 */

const config = {
  appId: 'so.fudaydiye.app',
  appName: 'Fudaydiye',
  webDir: 'dist',
  // server: {
  //   androidScheme: 'https',
  //   // Uncomment the next 2 lines for Live Reload (Replace IP with your computer's IP)
  //   // For Android Emulator, use 10.0.2.2 instead of localhost
  //   url: 'http://10.0.2.2:3000',
  //   cleartext: true
  // },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#015754",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#06DC7F",
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#015754', // Matches our secondary theme
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
    }
  }
};

export default config;
