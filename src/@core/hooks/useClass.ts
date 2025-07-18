import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

import type { ClassType } from '@/types/classes'

// Interface cho Class data
interface ClassInfo {
    id: string
    name: string,
    totalStudent: number,
    totalLessonPerWeek: number,
    classType: string,
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
}

export interface ClassListResponse {
    id: string,
    name: string,
    totalStudent: number,
    totalLessonPerWeek: number,
    classType: string,

    // teacher: TeacherListResponse,
    teacherId: string,
    createdAt: string,
    updatedAt: string
}

interface CreateClassDto {
    name: string
    total_lesson_per_week: number
    class_type: ClassType
    teacher_id: string,
    course_id: string
}

interface UpdateClassDto {
    name?: string
    total_lesson_per_week?: number
    class_type?: ClassType
    teacher_id?: string
}

// Function để gọi API lấy danh sách class
const fetchClassList = async (): Promise<ClassListResponse[]> => {
    const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BASE_API}/classes`);

    return data.data;
}

// Function để gọi API lấy thông tin class
const fetchClassInfo = async (id: string): Promise<ClassInfo> => {
    if (!id) {
        throw new Error('Class ID is required')
    }

    const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BASE_API}/classes/${id}`);


    // Thêm một chút delay để thấy trạng thái loading
    await new Promise((resolve) => setTimeout(resolve, 500));

    return data.data;
}

const createClass = async (classInfo: CreateClassDto) => {
    console.log(classInfo);
    const { data } = await axios.post(`${process.env.NEXT_PUBLIC_BASE_API}/classes`, classInfo);


    return data.data;
}

const updateClass = async (id: string, classInfo: UpdateClassDto) => {
    const { data } = await axios.put(`${process.env.NEXT_PUBLIC_BASE_API}/classes/${id}`, classInfo);


    return data.data;
}

const deleteClass = async (id: string) => {
    const { data } = await axios.delete(`${process.env.NEXT_PUBLIC_BASE_API}/classes/${id}`);


    return data.data;
}

const registerStudentToClass = async (classId: string, username: string) => {
    const { data } = await axios.post(`${process.env.NEXT_PUBLIC_BASE_API}/classes/register-class-for-user`, {
        class_id: classId,
        username: username
    });


    return data.data;
}

const unregisterStudentFromClass = async (classId: string, username: string) => {
    const { data } = await axios.post(`${process.env.NEXT_PUBLIC_BASE_API}/classes/unregister-class-for-user`, {
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

// Hook với tùy chọn bổ sung
export const useClassWithOptions = (
    id: string,
    options?: {
        enabled?: boolean
        refetchOnWindowFocus?: boolean
        staleTime?: number
    }
) => {
    return useQuery<ClassInfo, Error>({
        queryKey: ['class', id],
        queryFn: () => fetchClassInfo(id),
        enabled: options?.enabled ?? !!id,
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true,
        staleTime: options?.staleTime ?? 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 1 ** attemptIndex, 30000),
    })
}

// Hook để tạo class mới
export const useCreateClass = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createClass,
        onSuccess: () => {
            // Invalidate và refetch classes list
            queryClient.invalidateQueries({ queryKey: ['classes'] })
        },
        onError: (error) => {
            console.error('Error creating class:', error)
        }
    })
}

export const useDeleteClass = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteClass,
        onSuccess: () => {
            // Invalidate và refetch classes list
            queryClient.invalidateQueries({ queryKey: ['classes'] })
        },
        onError: (error) => {
            console.error('Error deleting class:', error)
        }
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

