export default {
  expo: {
    name: 'polytev2',
    slug: 'polytev2',
    icon: './assets/logo.png',
    version: '1.0.0',
    sdkVersion: '52.0.46',
    android: {
      "config": {
        "googleMaps": {
          "apiKey": "AIzaSyDU8Ufeqdzk4TJOSmwP_zYpK08rrjQc3P8"
        }
      },
      package: 'com.myrtille.polytev2', 
      permissions: ["INTERNET"],
    },
    extra: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      "eas": {
        "projectId": "95f40b72-0bab-4e54-998e-2e3ea23efa3e"
      }
    },
    "owner": "myrtillle",
  },
}; 