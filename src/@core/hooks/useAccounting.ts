import { useQuery } from "@tanstack/react-query";
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

const api = {
    getTotalStudyHours: async (search?: string): Promise<TotalStudyHoursResponse[]> => {
        const { data } = await apiClient.get('/total-study-hours', {
            params: {
                search: search
            }
        })

        return data.data;
    }
}

export const useGetTotalStudyHours = (search?: string) => {
    return useQuery({
        queryKey: ['totalStudyHours', search],
        queryFn: () => api.getTotalStudyHours(search),
    })
}
