import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import axios from 'axios'

export const SCHEDULE_TIME = [
    "8:00-10:00 Monday",
    "10:00-12:00 Monday",
    "14:00-16:00 Monday",
    "16:00-18:00 Monday",
    "18:00-20:00 Monday",
    "20:00-22:00 Monday",
    "8:00-10:00 Tuesday",
    "10:00-12:00 Tuesday",
    "14:00-16:00 Tuesday",
    "16:00-18:00 Tuesday",
    "18:00-20:00 Tuesday",
    "20:00-22:00 Tuesday",
    "8:00-10:00 Wednesday",
    "10:00-12:00 Wednesday",
    "14:00-16:00 Wednesday",
    "16:00-18:00 Wednesday",
    "18:00-20:00 Wednesday",
    "20:00-22:00 Wednesday",
    "8:00-10:00 Thursday",
    "10:00-12:00 Thursday",
    "14:00-16:00 Thursday",
    "16:00-18:00 Thursday",
    "18:00-20:00 Thursday",
    "20:00-22:00 Thursday",
    "8:00-10:00 Friday",
    "10:00-12:00 Friday",
    "14:00-16:00 Friday",
    "16:00-18:00 Friday",
    "18:00-20:00 Friday",
    "20:00-22:00 Friday",
    "8:00-10:00 Saturday",
    "10:00-12:00 Saturday",
    "14:00-16:00 Saturday",
    "16:00-18:00 Saturday",
    "18:00-20:00 Saturday",
    "20:00-22:00 Saturday",
    "8:00-10:00 Sunday",
    "10:00-12:00 Sunday",
    "14:00-16:00 Sunday",
    "16:00-18:00 Sunday",
    "18:00-20:00 Sunday",
    "20:00-22:00 Sunday",
]
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
        teacherName: string
        teacherId: string
    }[]
}

// Function để gọi API lấy thông tin class
const fetchClassScheduleInfo = async (id: string): Promise<ClassScheduleDto> => {
    if (!id) {
        throw new Error('Class ID is required')
    }

    const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BASE_API}/schedule/class/${id}`);


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

const updateLessonSchedule = async (classId: string, lesson: number, scheduleTime?: number, teacherId?: string) => {
    const { data } = await axios.put(`${process.env.NEXT_PUBLIC_BASE_API}/schedule`, {
        schedule_time: scheduleTime,
        teacher_id: teacherId,
        class_id: classId,
        lesson
    });

    return data.data;
}

export const useUpdateLessonSchedule = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ classId, lesson, scheduleTime, teacherId }: { classId: string, lesson: number, scheduleTime?: number, teacherId?: string }) => updateLessonSchedule(classId, lesson, scheduleTime, teacherId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['class-schedule'] })
        },
        onError: (error) => {
            console.error('Error updating lesson schedule:', error)
        }
    })
}

interface allScheduleResponse {
    schedule_time: number
    teacher_id: string
    class_name: string
    class_type: string
    teacher_name: string
    class_id: string
    lesson: number
    is_makeup: boolean
    fullname?: string
    email?: string
    phone?: string
}

const getAllSchedule = async (): Promise<allScheduleResponse[]> => {
    const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BASE_API}/schedules`);

    return data.data;
}

export const useGetAllSchedule = () => {
    return useQuery({
        queryKey: ['schedules'],
        queryFn: getAllSchedule,
        staleTime: 5 * 60 * 1000, // 5 phút
        gcTime: 10 * 60 * 1000, // 10 phút
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 1 ** attemptIndex, 30000),
    })
}

const getMakeupSchedule = async (): Promise<allScheduleResponse[]> => {
    const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BASE_API}/makeup-schedules`)

    return data.data;
}

export const useGetMakeupSchedule = () => {
    return useQuery({
        queryKey: ['makeup-schedules'],
        queryFn: getMakeupSchedule,
        staleTime: 5 * 60 * 1000, // 5 phút
        gcTime: 10 * 60 * 1000, // 10 phút
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 1 ** attemptIndex, 30000),
    })
}

interface unscheduleQueryResponse {
    profileLessonClassId: string
    profileId: string
    fullname: string
    email: string
    phone: string
    classId: string
    className: string
    classType: string
    lesson: number
    teacherId: string
    teacherName: string
    busySchedule: number[]
}

const unscheduleList = async (): Promise<unscheduleQueryResponse[]> => {
    const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BASE_API}/unscheduled-lessons`)

    return data.data?.unscheduledLessons || []
}

export const useUnscheduleList = () => {
    return useQuery<unscheduleQueryResponse[], Error>({
        queryKey: ['unschedule-list'],
        queryFn: unscheduleList,
        staleTime: 5 * 60 * 1000, // 5 phút
        gcTime: 10 * 60 * 1000, // 10 phút
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 1 ** attemptIndex, 30000),
    })
}

const createSchedule = async (profileLessonClassIds: string[], teacherId: string, scheduleTime: number) => {
    const { data } = await axios.post(`${process.env.NEXT_PUBLIC_BASE_API}/schedule`, {
        profile_lesson_class_ids: profileLessonClassIds,
        teacher_id: teacherId,
        schedule_time: scheduleTime
    })

    return data.data;
}

export const useCreateSchedule = () => {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: ({ profileLessonClassIds, teacherId, scheduleTime }: { profileLessonClassIds: string[], teacherId: string, scheduleTime: number }) => createSchedule(profileLessonClassIds, teacherId, scheduleTime),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['unschedule-list'] })
            queryClient.invalidateQueries({ queryKey: ['schedules'] })
            queryClient.invalidateQueries({ queryKey: ['makeup-schedules'] })
        },
        onError: (error) => {
            console.error('Error creating schedule:', error)
        }
    })
}
