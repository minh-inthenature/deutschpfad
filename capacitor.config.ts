import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.deutschpfad.app',
  appName: 'DeutschPfad',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
};

export default config;
