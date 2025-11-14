import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './apiClient'

import type { ClassType } from '@/types/classes'
import type { TeacherListResponse } from './useTeacher'

// Interface cho Class data
interface ClassInfo {
    id: string
    name: string,
    totalStudent: number,
    totalLessonPerWeek: number,
    classType: string,
    courseId: string,
    teacherId: string,
    teacherName: string,
    students: {
        profileId: string,
        username: string,
        fullName: string,
        phoneNumber: string,
        email: string,
        lessons: number[]
    }[]
    fixedSchedule?: number[]
}

export interface ClassListResponse {
    id: string,
    name: string,
    autoSchedule: boolean,
    totalStudent: number,
    totalLessonPerWeek: number,
    classType: string,
    teacher: TeacherListResponse,
    teacherId: string,
    createdAt: string,
    updatedAt: string
}

interface CreateClassDto {
    name: string
    totalLessonPerWeek?: number
    classType: ClassType
    teacherId: string,
    courseId: string,
    autoSchedule: boolean,
    fixedSchedule?: number[]
}

interface UpdateClassDto {
    name?: string
    total_lesson_per_week?: number
    class_type?: ClassType
    teacher_id?: string
    fixedSchedule?: number[]
}

// Function để gọi API lấy danh sách class
const fetchClassList = async (): Promise<ClassListResponse[]> => {
    const { data } = await apiClient.get('/classes');

    return data.data;
}

// Function để gọi API lấy thông tin class
const fetchClassInfo = async (id: string): Promise<ClassInfo> => {
    if (!id) {
        throw new Error('Class ID is required')
    }

    const { data } = await apiClient.get(`/classes/${id}`);


    // Thêm một chút delay để thấy trạng thái loading
    await new Promise((resolve) => setTimeout(resolve, 500));

    return data.data;
}

const createClass = async (classInfo: CreateClassDto) => {
    console.log(classInfo);
    const { data } = await apiClient.post('/classes', classInfo);


    return data.data;
}

const createClassBulk = async (classInfo: CreateClassDto[]) => {
    console.log(classInfo);
    const { data } = await apiClient.post('/classes/bulk', classInfo);


    return data.data;
}

const updateClass = async (id: string, classInfo: UpdateClassDto) => {
    const { data } = await apiClient.put(`/classes/${id}`, classInfo);


    return data.data;
}

const registerStudentToClass = async (classId: string, username: string) => {
    const { data } = await apiClient.post('/classes/register-class-for-user', {
        class_id: classId,
        username: username
    });


    return data.data;
}

const unregisterStudentFromClass = async (classId: string, username: string) => {
    const { data } = await apiClient.post('/classes/unregister-class-for-user', {
        class_id: classId,
        username: username
    });


    return data.data;
}

export const useClassList = () => {
    return useQuery<ClassListResponse[], Error>({
        queryKey: ['classes'],
        queryFn: fetchClassList,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 1 ** attemptIndex, 30000),
    })
}

export const useRegisterStudentToClass = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ classId, username }: { classId: string, username: string }) => registerStudentToClass(classId, username),
        onSuccess: () => {
            // Invalidate và refetch classes list
            // queryClient.invalidateQueries({ queryKey: ['classes'] })
            queryClient.invalidateQueries({ queryKey: ['class'] })
        },
        onError: (error) => {
            console.error('Error registering student to class:', error)
        }
    })
}

export const useUnregisterStudentFromClass = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ classId, username }: { classId: string, username: string }) => unregisterStudentFromClass(classId, username),
        onSuccess: () => {
            // Invalidate và refetch classes list
            // queryClient.invalidateQueries({ queryKey: ['classes'] })
            queryClient.invalidateQueries({ queryKey: ['class'] })
        },
        onError: (error) => {
            console.error('Error unregistering student from class:', error)
        }
    })
}

// Custom hook để lấy thông tin class
export const useClass = (id: string) => {
    return useQuery<ClassInfo, Error>({
        queryKey: ['class', id],
        queryFn: () => fetchClassInfo(id),
        enabled: !!id, // Chỉ chạy query khi có id
        staleTime: 5 * 60 * 1000, // 5 phút
        gcTime: 10 * 60 * 1000, // 10 phút
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 1 ** attemptIndex, 30000),
    })
}

// Hook để tạo class mới
export const useCreateClass = (courseId: string) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createClass,
        onSuccess: () => {
            // Invalidate và refetch classes list
            queryClient.invalidateQueries({ queryKey: ['courseInfo', courseId] })
        },
        onError: (error) => {
            console.error('Error creating class:', error)
        }
    })
}

export const useCreateClassBulk = (courseId: string) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createClassBulk,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courseInfo', courseId] })
        },
    })
}

export const useUpdateClass = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, classInfo }: { id: string, classInfo: UpdateClassDto }) => updateClass(id, classInfo),
        onSuccess: () => {
            // Invalidate và refetch classes list
            queryClient.invalidateQueries({ queryKey: ['classes'] })
            queryClient.invalidateQueries({ queryKey: ['class'] })
        },
        onError: (error) => {
            console.error('Error updating class:', error)
        }
    })
}

export type { ClassInfo, CreateClassDto, UpdateClassDto }

const deleteClasses = async (ids: string[]) => {
    const { data } = await apiClient.post('/classes/delete-classes', {
        ids: ids
    });

    return data.data;
}

export const useDeleteClasses = (courseId: string, weekId: string) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteClasses,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courseInfo', courseId, weekId] })
        },
        onError: (error) => {
            console.error('Error deleting classes:', error)
        }
    })
}
