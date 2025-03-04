export default {
  expo: {
    name: 'polytev2',
    // ... other expo config
    extra: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    },
  },
}; 