import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.joudafood.app',
  appName: 'Jouda - جودة',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    hostname: 'joudafood.com'
  },
  plugins: {
    CapacitorCamera: {
      android: {
        captureMode: 'camera'
      }
    }
  }
};

export default config;
