import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from './apiClient';

export interface TeacherListResponse {
    id: string,
    name: string,
    skills: string[],
    registeredBusySchedule: number[],
    createdAt: string,
    updatedAt: string,
    userId: string,
    note?: string
    username?: string
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
export interface CreateTeacherAccountDto {
    username: string
    password: string
    fullname: string
    email: string
    phone: string
    name: string
    skills: string[]
    note?: string
}

const createTeacherAccount = async (teacher: CreateTeacherAccountDto) => {
    const { data } = await apiClient.post('/user/register-teacher', teacher);

    return data.data;
}

export const useCreateTeacherAccount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (teacher: CreateTeacherAccountDto) => createTeacherAccount(teacher),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teachers'] })
        }
    })
}


const deleteTeacherAccount = async (teacherId: string) => {
    const { data } = await apiClient.delete(`/user/${teacherId}`);

    return data.data;
}

export const useDeleteTeacherAccount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (teacherId: string) => deleteTeacherAccount(teacherId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teachers'] })
        }
    })
}

export interface UpdateTeacherDto {
    name: string
    skills: string[]
    note?: string
}

const updateTeacher = async (teacherId: string, teacher: UpdateTeacherDto) => {
    const { data } = await apiClient.put(`/teachers/${teacherId}`, teacher);

    return data.data;
}

export const useUpdateTeacher = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ teacherId, teacher }: { teacherId: string, teacher: UpdateTeacherDto }) => updateTeacher(teacherId, teacher),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teachers'] })
        }
    })
}
