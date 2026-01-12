import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from './apiClient';

export interface TotalStudyHoursResponse {
    username: string,
    fullname: string,
    email: string,
    courseName: string,
    className: string,
    totalActualHours: number,
    totalAttendedSessions: number
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

const api = {
    getTotalStudyHours: async (search?: string): Promise<TotalStudyHoursResponse[]> => {
        const { data } = await apiClient.get('/total-study-hours', {
            params: {
                search: search
            }
        })

        return data.data;
    },

    exportStudentProgressReport: async (request: StudentProgressReportRequest): Promise<Blob> => {
        const response = await apiClient.post('/statistics/student-progress-report', request, {
            responseType: 'blob'
        })

        return response.data
    }
}

export const useGetTotalStudyHours = (search?: string) => {
    return useQuery({
        queryKey: ['totalStudyHours', search],
        queryFn: () => api.getTotalStudyHours(search),
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
