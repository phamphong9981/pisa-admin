import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from './apiClient';


export interface TotalStudyHoursResponse {
    username: string,
    fullname: string,
    email: string,
    courseName: string,
    className: string,
    totalActualHours: number,
    teacherName: string,
    totalAttendedSessions: number
}

export interface PaginationMeta {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
}

export interface TotalStudyHoursPaginatedResponse {
    data: TotalStudyHoursResponse[]
    pagination: PaginationMeta
}

export interface TotalStudyHoursParams {
    search?: string
    weekId?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
}

export enum ReportFormat {
    EXCEL = 'excel',
    PDF = 'pdf',
}

export interface StudentProgressReportRequest {
    profileIds?: string[]
    format?: ReportFormat
    fromDate?: string // Format: YYYY-MM-DD
    toDate?: string // Format: YYYY-MM-DD
}

export interface ClassSessionReportRequest {
    fromDate?: string // Format: YYYY-MM-DD
    toDate?: string // Format: YYYY-MM-DD
}

const api = {
    getTotalStudyHours: async (params?: TotalStudyHoursParams): Promise<TotalStudyHoursPaginatedResponse> => {
        const { data } = await apiClient.get('/total-study-hours', {
            params: params
        })

        return data.data;
    },

    exportTotalStudyHours: async (params?: TotalStudyHoursParams): Promise<Blob> => {
        const { data } = await apiClient.get('/total-study-hours/export', {
            params: params,
            responseType: 'blob'
        })

        return data
    },

    exportStudentProgressReport: async (request: StudentProgressReportRequest): Promise<Blob> => {
        const response = await apiClient.post('/statistics/student-progress-report', request, {
            responseType: 'blob'
        })

        return response.data
    },

    exportClassSessionReport: async (request: ClassSessionReportRequest): Promise<Blob> => {
        const response = await apiClient.post('/statistics/class-session-report', request, {
            responseType: 'blob'
        })

        return response.data
    }
}

export const useGetTotalStudyHours = (params?: TotalStudyHoursParams) => {
    return useQuery({
        queryKey: ['totalStudyHours', params],
        queryFn: () => api.getTotalStudyHours(params),
    })
}

export const useExportTotalStudyHours = () => {
    return useMutation({
        mutationFn: (params?: TotalStudyHoursParams) => api.exportTotalStudyHours(params),
        onError: (error) => {
            console.error('Error exporting total study hours:', error)
        }
    })
}

export const useExportStudentProgressReport = () => {
    return useMutation({
        mutationFn: (request: StudentProgressReportRequest) => api.exportStudentProgressReport(request),
        onError: (error) => {
            console.error('Error exporting student progress report:', error)
        }
    })
}

export const useExportClassSessionReport = () => {
    return useMutation({
        mutationFn: (request: ClassSessionReportRequest) => api.exportClassSessionReport(request),
        onError: (error) => {
            console.error('Error exporting class session report:', error)
        }
    })
}
