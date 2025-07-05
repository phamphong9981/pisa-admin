import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
export interface ClassScheduleDto {
    classId: string
    className: string
    classType: string
    teacherId: string
    weekId: string
    startDate: string
    lessons: {
        lesson: number
        scheduleTime: number
        attendingStudents: {
            profileId: string
            fullname: string
            email: string
            scheduleTime: number
        }[]
        absentStudents: {
            profileId: string
            fullname: string
            email: string
            busySchedule: string[]
        }[]
        totalStudents: number
        attendingCount: number
        absentCount: number
    }[]
}

// Function để gọi API lấy thông tin class
const fetchClassScheduleInfo = async (id: string): Promise<ClassScheduleDto> => {
    if (!id) {
        throw new Error('Class ID is required')
    }

    const { data } = await axios.get("http://localhost:8080/schedule/class/" + id);
    // Thêm một chút delay để thấy trạng thái loading
    // await new Promise((resolve) => setTimeout(resolve, 500));
    return data.data.classSchedule;
}

// Custom hook để lấy thông tin class
export const useClassSchedule = (id: string) => {
    return useQuery<ClassScheduleDto, Error>({
        queryKey: ['class-schedule', id],
        queryFn: () => fetchClassScheduleInfo(id),
        enabled: !!id, // Chỉ chạy query khi có id
        staleTime: 5 * 60 * 1000, // 5 phút
        gcTime: 10 * 60 * 1000, // 10 phút
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 1 ** attemptIndex, 30000),
    })
}
