// services/leaderboardService.ts
import { supabase } from './supabase';

function getStartDateForRange(range: string): string | null {
    const now = new Date();
    if (range === 'THIS MONTH') {
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
    if (range === 'THIS YEAR') {
      return new Date(now.getFullYear(), 0, 1).toISOString();
    }
    if (range === 'THIS WEEK') {
      const day = now.getDay(); // 0 (Sunday) to 6 (Saturday)
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
      return new Date(now.getFullYear(), now.getMonth(), diff).toISOString();
    }
    return null; // ALL TIME
}

export const leaderboardService = {
    async fetchLeaderboardByUsers(timeRange: string) {
        const { data, error } = await supabase
          .from('user_polys')
          .select(`
            points,
            user_id,
            personal_users!user_id (first_name, last_name),
            created_at
          `);
    
        if (error) {
          console.error('❌ Failed to fetch user leaderboard data:', error);
          return [];
        }
    
        const startDate = getStartDateForRange(timeRange);
    
        const filteredData = startDate
          ? data.filter((entry) => new Date(entry.created_at) >= new Date(startDate))
          : data;
    
        const grouped = filteredData.reduce((acc, entry) => {
          const user = Array.isArray(entry.personal_users) ? entry.personal_users[0] : entry.personal_users;
          const fullName = user ? `${user.first_name} ${user.last_name}` : 'Unknown User';
          if (!acc[fullName]) acc[fullName] = 0;
          acc[fullName] += entry.points || 0;
          return acc;
        }, {} as Record<string, number>);
    
        return Object.entries(grouped)
          .map(([name, totalPoints]) => ({ name, totalPoints }))
          .sort((a, b) => b.totalPoints - a.totalPoints);
    },
    
    async fetchLeaderboardByPurok(timeRange: string) {
    const { data, error } = await supabase
        .from('user_polys')
        .select(`
        points,
        user_id,
        personal_users!user_id (purok, barangay),
        created_at
        `);

    if (error) {
        console.error('❌ Failed to fetch purok leaderboard data:', error);
        return [];
    }

    const startDate = getStartDateForRange(timeRange);

    const filteredData = startDate
        ? data.filter((entry) => new Date(entry.created_at) >= new Date(startDate))
        : data;

    const grouped = filteredData.reduce((acc, entry) => {
        const user = Array.isArray(entry.personal_users) ? entry.personal_users[0] : entry.personal_users;
        const purok = user?.purok || 'Unknown Purok';
        const barangay = user?.barangay || 'Unknown Barangay';
        const label = `Purok ${purok} - ${barangay}`;

        if (!acc[label]) acc[label] = 0;
        acc[label] += entry.points || 0;
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
        .map(([name, totalPoints]) => ({ name, totalPoints }))
        .sort((a, b) => b.totalPoints - a.totalPoints);
    }
};
