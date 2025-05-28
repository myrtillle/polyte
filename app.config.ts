import 'dotenv/config';

export default {
  expo: {
    name: 'Poly.te',
    scheme: 'polyte',
    slug: 'polytev2',
    icon: './assets/logo.png',
    version: '1.0.0',
    // sdkVersion: '52.0.46',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/logo.png',
      resizeMode: 'contain',
      backgroundColor: '#023F0F',
    },
    assetBundlePatterns: ['**/*'],

    android: {
      "config": {
        "googleMaps": {
          "apiKey": "AIzaSyDGM8pq1tOO2gIOeKj94sOCXduccidNCwU"
        }
      },
      adaptiveIcon: {
        foregroundImage: './assets/logo.png',
        backgroundColor: 'transparent',
      },
      package: 'com.myrtille.polytev2',
      versionCode: 1,
      permissions: [
        'INTERNET', 
        'READ_EXTERNAL_STORAGE', 
        'WRITE_EXTERNAL_STORAGE', 
        'CAMERA', 
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION'
      ],
      intentFilters: [
        {
          "action": "VIEW",
          "data": {
            "scheme": "polyte",
            "host": "*"
          },
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    extra: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      GOOGLE_MAPS_API_KEY: "AIzaSyDGM8pq1tOO2gIOeKj94sOCXduccidNCwU",
      "eas": {
        "projectId": "95f40b72-0bab-4e54-998e-2e3ea23efa3e"
      }
    },
    plugins: [
      // ['expo-router', {
      //   origin: 'https://polytev2.com',
      //   asyncRoutes: { enabled: true }
      // }],
      ['expo-location', {
        locationAlwaysAndWhenInUsePermission: 'Allow $(PRODUCT_NAME) to use your location.'
      }]
    ],

    "owner": "myrtillle",
  },
}; 