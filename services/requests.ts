import { supabase } from './supabase';
import { CreateRequestInput, Request } from '../types/request';
import { createNotification } from './notifications';
import { optimizeImage, compressImage, getFileSizeKB } from './images';
import { errorHandler } from '../utils/errorHandler';
import { cache } from './cache';

export type RequestFilter = {
  status?: Request['status'];
  search?: string;
  created_by?: string;
  assigned_to?: string;
  maxDistance?: number;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  sortBy?: 'date' | 'points' | 'distance';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  categories?: string[];
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  hasMore: boolean;
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function getRequests(filter?: RequestFilter): Promise<PaginatedResponse<Request>> {
  const limit = filter?.limit || 10;
  const from = ((filter?.page || 1) - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('requests')
    .select(`
      *,
      created_by_profile:profiles!requests_created_by_fkey(
        full_name,
        avatar_url
      ),
      assigned_to_profile:profiles!requests_assigned_to_fkey(
        full_name,
        avatar_url
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filter?.status) {
    query = query.eq('status', filter.status);
  }

  if (filter?.search) {
    query = query.or(`title.ilike.%${filter.search}%,description.ilike.%${filter.search}%`);
  }

  if (filter?.created_by) {
    query = query.eq('created_by', filter.created_by);
  }

  if (filter?.assigned_to) {
    query = query.eq('assigned_to', filter.assigned_to);
  }

  if (filter?.categories?.length) {
    query = query.contains('categories', filter.categories);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  let filteredData = data as (Request & {
    created_by_profile: { full_name: string; avatar_url?: string };
    assigned_to_profile?: { full_name: string; avatar_url?: string };
  })[];

  if (filter?.maxDistance && filter?.userLocation) {
    filteredData = filteredData.filter(request => {
      const distance = calculateDistance(
        filter.userLocation!.latitude,
        filter.userLocation!.longitude,
        request.location.latitude,
        request.location.longitude
      );
      return distance <= filter.maxDistance!;
    });
  }

  if (filter?.sortBy) {
    filteredData.sort((a, b) => {
      const order = filter.sortOrder === 'asc' ? 1 : -1;
      
      switch (filter.sortBy) {
        case 'date':
          return (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) * order;
        case 'points':
          return (b.reward_points - a.reward_points) * order;
        case 'distance':
          if (filter.userLocation) {
            const distA = calculateDistance(
              filter.userLocation.latitude,
              filter.userLocation.longitude,
              a.location.latitude,
              a.location.longitude
            );
            const distB = calculateDistance(
              filter.userLocation.latitude,
              filter.userLocation.longitude,
              b.location.latitude,
              b.location.longitude
            );
            return (distA - distB) * order;
          }
          return 0;
        default:
          return 0;
      }
    });
  }

  return {
    data: filteredData,
    total: count || 0,
    hasMore: (count || 0) > from + filteredData.length
  };
}

export async function createRequest(data: CreateRequestInput) {
  try {
    // Optimize image if provided
    let optimizedImageUri = data.image_url;
    if (data.image_url) {
      optimizedImageUri = await optimizeImage(data.image_url);
      // Further compress if still too large
      const sizeKB = 500; // 500KB target
      if (await getFileSizeKB(optimizedImageUri) > sizeKB) {
        optimizedImageUri = await compressImage(optimizedImageUri, sizeKB);
      }
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not authenticated');

    // Try to create request
    const { data: request, error } = await supabase
      .from('requests')
      .insert({
        ...data,
        image_url: optimizedImageUri,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return request as Request;
  } catch (error) {
    // If offline, cache the request for later
    if (!navigator.onLine) {
      await cache.addPendingAction({
        type: 'create',
        entity: 'requests',
        data: { ...data, image_url: data.image_url },
      });
      return null;
    }

    throw errorHandler.handleError(error, {
      retry: () => createRequest(data),
    });
  }
}

export async function getRequestById(id: string) {
  const { data, error } = await supabase
    .from('requests')
    .select(`
      *,
      created_by_profile:profiles!requests_created_by_fkey(
        full_name,
        avatar_url
      ),
      assigned_to_profile:profiles!requests_assigned_to_fkey(
        full_name,
        avatar_url
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Request & {
    created_by_profile: { full_name: string; avatar_url?: string };
    assigned_to_profile?: { full_name: string; avatar_url?: string };
  };
}

export async function updateRequestStatus(id: string, status: Request['status']) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Not authenticated');

  // Get request details first
  const { data: request, error: requestError } = await supabase
    .from('requests')
    .select('*, created_by_profile:profiles!requests_created_by_fkey(full_name)')
    .eq('id', id)
    .single();

  if (requestError) throw requestError;

  const { data, error } = await supabase
    .from('requests')
    .update({
      status,
      assigned_to: status === 'in_progress' ? user.id : null,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Send notifications based on status change
  if (status === 'in_progress') {
    await createNotification(
      request.created_by,
      'request_help',
      'Someone is helping with your request!',
      `${user.user_metadata.full_name} has started helping with your request "${request.title}"`,
      { requestId: id }
    );
  } else if (status === 'completed') {
    await createNotification(
      request.created_by,
      'request_complete',
      'Your request is complete!',
      `${user.user_metadata.full_name} has completed your request "${request.title}"`,
      { requestId: id }
    );
  }

  return data as Request;
} 