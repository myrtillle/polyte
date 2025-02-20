import { supabase } from './supabase';

export type ReportType = 'request' | 'user' | 'review' | 'message';
export type ReportStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';

export type Report = {
  id: string;
  reporter_id: string;
  reported_id: string;
  type: ReportType;
  content_id: string;
  reason: string;
  details?: string;
  status: ReportStatus;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
};

export async function createReport(
  reportedId: string,
  type: ReportType,
  contentId: string,
  reason: string,
  details?: string
) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      reported_id: reportedId,
      type,
      content_id: contentId,
      reason,
      details,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Report;
}

export async function getReports() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Report[];
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus
) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('reports')
    .update({
      status,
      resolved_at: status === 'resolved' || status === 'dismissed' 
        ? new Date().toISOString() 
        : null,
      resolved_by: status === 'resolved' || status === 'dismissed' 
        ? user.id 
        : null,
    })
    .eq('id', reportId)
    .select()
    .single();

  if (error) throw error;
  return data as Report;
} 