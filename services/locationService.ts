import { supabase } from './supabase';

export interface Barangay {
  id: number;
  name: string;
}

export interface Purok {
  id: number;
  purok_name: string;
  barangay_id: number;
}

export const locationService = {
  async getBarangays(): Promise<Barangay[]> {
    console.log('🔄 locationService: Fetching barangays from Supabase...');
    try {
      const { data, error } = await supabase
        .from('barangays')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error('❌ locationService: Error fetching barangays:', error);
        throw error;
      }

      console.log('✅ locationService: Barangays fetched successfully:', data);
      return data || [];
    } catch (error) {
      console.error('❌ locationService: Exception in getBarangays:', error);
      throw error;
    }
  },

  async getPuroksByBarangay(barangayId: number): Promise<Purok[]> {
    try {
      const { data, error } = await supabase
        .from('puroks')
        .select('id, purok_name, barangay_id')
        .eq('barangay_id', barangayId)
        .order('purok_name');
      
      if (error) {
        console.error('Error fetching puroks:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('No puroks found for barangay:', barangayId);
        return [];
      }

      return data;
    } catch (error) {
      console.error('Error in getPuroksByBarangay:', error);
      throw error;
    }
  }
}; 