import { useQuery } from '@tanstack/react-query'
import { apiClient } from './apiClient'

// Types based on API documentation
export type AuditOperation = 'INSERT' | 'UPDATE' | 'DELETE'

export interface ScheduleValues {
  id: string
  profile_lesson_class_id?: string
  profile_id: string
  class_id: string
  lesson: number
  week_id: string
  schedule_time: number
  teacher_id?: string
  created_at: string
  updated_at: string
  status: string
  rollcall_status: string
  reason?: string
  status_reason?: string
  start_time?: string
  end_time?: string
  total_time?: number
  note?: string
  replace_schedule_id?: string
  rollcall_username?: string
}

export interface ScheduleAuditLog {
  id: number
  scheduleId: string
  operation: AuditOperation
  changedAt: Date
  changedBy?: string
  oldValues?: ScheduleValues
  newValues?: ScheduleValues
}

export interface ScheduleAuditSearchParams {
  weekId?: string
  scheduleTime?: number
  classId?: string
}

// API function to search schedule audit logs
const searchScheduleAudit = async (params: ScheduleAuditSearchParams): Promise<ScheduleAuditLog[]> => {
  const queryParams = new URLSearchParams()

  if (params.weekId) queryParams.append('weekId', params.weekId)
  if (params.scheduleTime) queryParams.append('scheduleTime', params.scheduleTime.toString())
  if (params.classId) queryParams.append('classId', params.classId)

  const { data } = await apiClient.get('/schedule-audit/search', {
    params: queryParams.toString() ? Object.fromEntries(queryParams) : undefined
  })

  return data.data
}

// Hook to search schedule audit logs
export const useScheduleAudit = (params: ScheduleAuditSearchParams) => {
  return useQuery<ScheduleAuditLog[], Error>({
    queryKey: ['scheduleAudit', params.weekId, params.scheduleTime, params.classId],
    queryFn: () => searchScheduleAudit(params),
    enabled: !!params.weekId && !!params.scheduleTime && !!params.classId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

