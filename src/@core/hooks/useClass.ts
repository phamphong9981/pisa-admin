import { ClassType } from '@/types/classes'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
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

interface ClassListResponse {
    id: string,
    name: string,
    totalStudent: number,
    totalLessonPerWeek: number,
    classType: string,
    teacherId: string,
    createdAt: string,
    updatedAt: string
}

interface CreateClassDto {
    name: string
    total_lesson_per_week: number
    class_type: ClassType
    teacher_id: string
}

// Function để gọi API lấy danh sách class
const fetchClassList = async (): Promise<ClassListResponse[]> => {
    const { data } = await axios.get("http://localhost:8080/classes");
    return data.data;
}

// Function để gọi API lấy thông tin class
const fetchClassInfo = async (id: string): Promise<ClassInfo> => {
    if (!id) {
        throw new Error('Class ID is required')
    }

    const { data } = await axios.get("http://localhost:8080/classes/" + id);
    // Thêm một chút delay để thấy trạng thái loading
    await new Promise((resolve) => setTimeout(resolve, 500));
    return data.data;
}

const createClass = async (classInfo: CreateClassDto) => {
    console.log(classInfo);
    const { data } = await axios.post("http://localhost:8080/classes", classInfo);
    return data.data;
}

const deleteClass = async (id: string) => {
    const { data } = await axios.delete("http://localhost:8080/classes/" + id);
    return data.data;
}

export const useClassList = () => {
    return useQuery<ClassListResponse[], Error>({
        queryKey: ['classes'],
        queryFn: fetchClassList,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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

export type { ClassInfo, CreateClassDto, ClassListResponse }
