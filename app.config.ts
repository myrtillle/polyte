export default {
  expo: {
    name: 'Poly.te',
    scheme: 'polyte',
    slug: 'polyte-app',
    icon: './assets/logo.png',
    version: '1.0.0',
    sdkVersion: '52.0.46',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    
    android: {
      "config": {
        "googleMaps": {
          "apiKey": "AIzaSyDm9L1U_ihCMd2hkGYpujnurBWktWVf1qA"
        }
      },
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.myrtille.polytev2', 
      permissions: ["INTERNET", 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE', 'CAMERA'],
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
      "eas": {
        "projectId": "95f40b72-0bab-4e54-998e-2e3ea23efa3e"
      }
    },
    plugins: [
      ['expo-router', {
        origin: 'https://polytev2.com',
        asyncRoutes: { enabled: true }
      }],
      ['expo-location', {
        locationAlwaysAndWhenInUsePermission: 'Allow $(PRODUCT_NAME) to use your location.'
      }]
    ],
    
    "owner": "myrtillle",
  },
}; 