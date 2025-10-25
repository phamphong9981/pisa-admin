import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from './apiClient';

export enum ScheduleStatus {
    OPEN = 'open',
    CLOSED = 'closed',
    PENDING = 'pending'
}
export interface WeekResponseDto {
    id: string
    startDate: Date
    scheduleStatus: ScheduleStatus
    createdAt: Date
    updatedAt: Date
}

const api = {
    getWeeks: async (): Promise<WeekResponseDto[]> => {
        const response = await apiClient.get('/weeks')
        console.log('Weeks API response:', response.data)
        return response.data
    }
}

export const useGetWeeks = () => {
    return useQuery({
        queryKey: ['weeks'],
        queryFn: api.getWeeks
    })
}
