import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.8e0123ac99dd4e369043934e77c01654',
  appName: 'tempo-flow-mindful',
  webDir: 'dist',
  server: {
    url: 'https://8e0123ac-99dd-4e36-9043-934e77c01654.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;