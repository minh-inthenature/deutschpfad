import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.deutschpfad.app',
  appName: 'DeutschPfad',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_deutschpfad',
      iconColor: '#E23636',
    },
  },
};

export default config;
