// services/leaderboardService.ts
import { supabase } from './supabase';

interface Purok {
  purok_name: string;
}

interface Barangay {
  name: string;
}

interface PersonalUser {
  first_name: string;
  last_name: string;
  puroks?: Purok[] | Purok;
  barangays?: Barangay[] | Barangay;
}

interface UserPoly {
  points: number;
  offer_id: string;
  user_id: string;
  personal_users: PersonalUser[] | PersonalUser;
  created_at: string;
  offers?: { offered_weight: number }[] | { offered_weight: number };
}

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
    async fetchLeaderboardByUsers(timeRange: string, metric: 'points' | 'weight') {
        const { data, error } = await supabase
          .from('user_polys')
          .select(`
            points,
            offer_id,
            user_id,
            personal_users!user_id (first_name, last_name, username),
            created_at,
            offers!offer_id (offered_weight)
          `);
    
        if (error) {
          console.error('❌ Failed to fetch user leaderboard data:', error);
          return [];
        }
    
        const startDate = getStartDateForRange(timeRange);
    
        const filteredData = startDate
          ? data.filter((entry) => new Date(entry.created_at) >= new Date(startDate))
          : data;
    
        const grouped = filteredData.reduce((acc: Record<string, number>, entry: any) => {
          const user = Array.isArray(entry.personal_users) ? entry.personal_users[0] : entry.personal_users;
          const fullName = user ? `${user.username}` : 'Unknown User';
          if (!acc[fullName]) acc[fullName] = 0;
          
          if (metric === 'points') {
            acc[fullName] += entry.points || 0;
          } else {
            // For weight, get it from the offers table
            const offer = Array.isArray(entry.offers) ? entry.offers[0] : entry.offers;
            acc[fullName] += offer?.offered_weight || 0;
          }
          return acc;
        }, {});
    
        return Object.entries(grouped)
          .map(([name, totalValue]) => ({ name, totalValue }))
          .sort((a, b) => b.totalValue - a.totalValue);
    },
    
    async fetchLeaderboardByPurok(timeRange: string, metric: 'points' | 'weight') {
        const { data, error } = await supabase
            .from('user_polys')
            .select(`
            points,
            offer_id,
            user_id,
            personal_users!user_id (
                puroks!purok_id (purok_name),
                barangays!barangay_id (name)
            ),
            created_at,
            offers!offer_id (offered_weight)
            `);

        if (error) {
            console.error('❌ Failed to fetch purok leaderboard data:', error);
            return [];
        }

        const startDate = getStartDateForRange(timeRange);

        const filteredData = startDate
            ? data.filter((entry) => new Date(entry.created_at) >= new Date(startDate))
            : data;

        const grouped = filteredData.reduce((acc: Record<string, number>, entry: any) => {
            const user = Array.isArray(entry.personal_users) ? entry.personal_users[0] : entry.personal_users;
            const purok = Array.isArray(user?.puroks) ? user.puroks[0]?.purok_name : user?.puroks?.purok_name || 'Unknown Purok';
            const barangay = Array.isArray(user?.barangays) ? user.barangays[0]?.name : user?.barangays?.name || 'Unknown Barangay';
            const label = `${purok}`;

            if (!acc[label]) acc[label] = 0;
            
            if (metric === 'points') {
                acc[label] += entry.points || 0;
            } else {
                // For weight, get it from the offers table
                const offer = Array.isArray(entry.offers) ? entry.offers[0] : entry.offers;
                acc[label] += offer?.offered_weight || 0;
            }
            return acc;
        }, {});

        return Object.entries(grouped)
            .map(([name, totalValue]) => ({ name, totalValue }))
            .sort((a, b) => b.totalValue - a.totalValue);
    }
};
