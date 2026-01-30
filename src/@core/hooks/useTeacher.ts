import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from './apiClient';

export interface ScheduleNoteDto {
    scheduleTime: number
    note?: string
}

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
    scheduleNotes?: ScheduleNoteDto[]
}

// Function để gọi API lấy danh sách teacher
const fetchTeacherList = async (search?: string, weekId?: string): Promise<TeacherListResponse[]> => {
    const { data } = await apiClient.get('/teachers', {
        params: {
            search,
            weekId
        }
    });


    return data.data;
}

export const useTeacherList = (search?: string, weekId?: string) => {
    return useQuery<TeacherListResponse[], Error>({
        queryKey: ['teachers', search, weekId],
        queryFn: () => fetchTeacherList(search, weekId),
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
    const { data } = await apiClient.delete(`/teachers/${teacherId}`);

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

export interface CreateTeacherScheduleNoteDto {
    teacherId: string
    weekId: string
    scheduleTime: number
    note?: string
}

const upsertTeacherScheduleNote = async (dto: CreateTeacherScheduleNoteDto) => {
    const { data } = await apiClient.post('/teacher-schedule-notes', dto);

    return data.data;
}

export const useUpsertTeacherScheduleNote = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateTeacherScheduleNoteDto) => upsertTeacherScheduleNote(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teachers'] })
            queryClient.invalidateQueries({ queryKey: ['schedules'] })
            queryClient.invalidateQueries({ queryKey: ['teacher-schedule-notes'] })
        }
    })
}

export interface TeacherScheduleNoteResponseDto {
    teacherId?: string
    weekId?: string
    scheduleTime?: number
    note?: string
}

const fetchTeacherScheduleNotes = async (weekId: string, teacherId?: string, scheduleTime?: number): Promise<TeacherScheduleNoteResponseDto[]> => {
    const { data } = await apiClient.get('/teacher-schedule-notes', {
        params: {
            teacherId,
            weekId,
            scheduleTime
        }
    });

    return data.data;
}

// Hook to fetch all schedule notes for a week (for all teachers)
export const useTeacherScheduleNotesByWeek = (weekId: string, teacherId?: string, scheduleTime?: number) => {
    return useQuery<TeacherScheduleNoteResponseDto[], Error>({
        queryKey: ['teacher-schedule-notes', weekId, teacherId, scheduleTime],
        queryFn: () => fetchTeacherScheduleNotes(weekId, teacherId, scheduleTime),
        enabled: !!weekId, // Only fetch when weekId is provided
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 1 ** attemptIndex, 30000),
    })
}

// Hook to fetch schedule notes for a specific teacher (kept for backward compatibility)
export const useTeacherScheduleNotes = (teacherId: string, weekId: string, scheduleTime?: number) => {
    return useQuery<TeacherScheduleNoteResponseDto[], Error>({
        queryKey: ['teacher-schedule-notes', teacherId, weekId, scheduleTime],
        queryFn: () => fetchTeacherScheduleNotes(weekId, teacherId, scheduleTime),
        enabled: !!teacherId && !!weekId, // Only fetch when both teacherId and weekId are provided
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 1 ** attemptIndex, 30000),
    })
}
