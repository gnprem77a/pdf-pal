import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.c0c9173cc1364f46b42ca64751647963',
  appName: 'instantpdf',
  webDir: 'dist',
  // Note: Remove or comment out the server block for native builds
  // The server.url causes the app to load from web, disabling native plugins
  // Uncomment only for live reload during development:
  // server: {
  //   url: 'https://c0c9173c-c136-4f46-b42c-a64751647963.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // }
};

export default config;
