import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from './apiClient';

export interface TeacherListResponse {
    id: string,
    name: string,
    skills: string[],
    registeredBusySchedule: number[],
    createdAt: string,
    updatedAt: string
}

// Function để gọi API lấy danh sách teacher
const fetchTeacherList = async (search?: string): Promise<TeacherListResponse[]> => {
    const { data } = await apiClient.get('/teachers', {
        params: {
            search
        }
    });


    return data.data;
}

export const useTeacherList = (search?: string) => {
    return useQuery<TeacherListResponse[], Error>({
        queryKey: ['teachers', search],
        queryFn: () => fetchTeacherList(search),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 1 ** attemptIndex, 30000),
    })
}


const updateTeacherBusySchedule = async (teacherId: string, busySchedule: number[]) => {
    const { data } = await apiClient.put(`/teachers/${teacherId}/order-schedule`, {
        registeredBusySchedule: busySchedule
    });

    return data.data;
}

export const useUpdateTeacherBusySchedule = () => {
    const queryClient = useQueryClient();


    return useMutation({
        mutationFn: ({ teacherId, busySchedule }: { teacherId: string; busySchedule: number[] }) =>
            updateTeacherBusySchedule(teacherId, busySchedule),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teachers'] })
        }
    })
}
