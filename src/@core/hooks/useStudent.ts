import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from './apiClient'

export interface Profile {
    id: string;
    fullname: string;
    email: string;
    phone: string;
    image: string;
    ieltsPoint: string;
    createdAt: Date;
    updatedAt: Date;
    busyScheduleArr: number[];
}

interface ListUsersResponseDto {
    users: {
        id: string;
        username: string;
        type: string;
        fcmToken?: string;
        createdAt: Date;
        updatedAt: Date;
        profile: Profile;
        course?: {
            name: string,
            id: string
        }
    }[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

const fetchStudentList = async (search: string): Promise<ListUsersResponseDto> => {
    const { data } = await apiClient.get('/user/', {
        params: {
            type: 'user',
            search
        }
    });

    return data.data;
}

export const useStudentList = (search: string) => {
    return useQuery<ListUsersResponseDto, Error>({
        queryKey: ['students', search],
        queryFn: () => fetchStudentList(search),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 1 ** attemptIndex, 30000),
    })
}

const updateStudentBusySchedule = async (studentId: string, busySchedule: number[]) => {
    const { data } = await apiClient.put(`/${studentId}/order-schedule`, {
        busy_schedule_arr: busySchedule
    });

    return data.data;
}

export const useUpdateStudentBusySchedule = () => {
    const queryClient = useQueryClient();


    return useMutation({
        mutationFn: ({ studentId, busySchedule }: { studentId: string, busySchedule: number[] }) => updateStudentBusySchedule(studentId, busySchedule),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] })
        }
    })
}
