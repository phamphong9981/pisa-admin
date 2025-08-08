import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import axios from 'axios'

export const SCHEDULE_TIME = [
    "8:00-10:00 Monday",
    "10:00-12:00 Monday",
    "13:30-15:00 Monday",
    "15:00-17:00 Monday",
    "17:00-19:00 Monday",
    "19:30-21:30 Monday",
    "8:00-10:00 Tuesday",
    "10:00-12:00 Tuesday",
    "13:30-15:00 Tuesday",
    "15:00-17:00 Tuesday",
    "17:00-19:00 Tuesday",
    "19:30-21:30 Tuesday",
    "8:00-10:00 Wednesday",
    "10:00-12:00 Wednesday",
    "13:30-15:00 Wednesday",
    "15:00-17:00 Wednesday",
    "17:00-19:00 Wednesday",
    "19:30-21:30 Wednesday",
    "8:00-10:00 Thursday",
    "10:00-12:00 Thursday",
    "13:30-15:00 Thursday",
    "15:00-17:00 Thursday",
    "17:00-19:00 Thursday",
    "19:30-21:30 Thursday",
    "8:00-10:00 Friday",
    "10:00-12:00 Friday",
    "13:30-15:00 Friday",
    "15:00-17:00 Friday",
    "17:00-19:00 Friday",
    "19:30-21:30 Friday",
    "8:00-10:00 Saturday",
    "10:00-12:00 Saturday",
    "13:30-15:00 Saturday",
    "15:00-17:00 Saturday",
    "17:00-19:00 Saturday",
    "19:30-21:30 Saturday",
    "8:00-10:00 Sunday",
    "10:00-12:00 Sunday",
    "13:30-15:00 Sunday",
    "15:00-17:00 Sunday",
    "17:00-19:00 Sunday",
    "19:30-21:30 Sunday",
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

export enum RollcallStatus {
    NOT_ROLLCALL = 'not_rollcall',
    ATTENDING = 'attending',
    ABSENT_WITHOUT_REASON = 'absent_without_reason',
    ABSENT_WITH_REASON = 'absent_with_reason',
    ABSENT_WITH_LATE_REASON = 'absent_with_late_reason',
}

// New DTOs for getScheduleDetail
export interface StudentScheduleDetailDto {
    profileId: string
    fullname: string
    email: string
    phone: string
    scheduleId?: string
    scheduleTime?: number
    scheduleStatus?: string
    rollcallStatus: RollcallStatus
    teacherId?: string
    teacherName?: string
    isMakeup: boolean
    busySchedule: number[]
    reason?: string
}

export interface ClassScheduleDetailDto {
    id: string
    name: string
    classType: string
    lesson: number
    weekId: string
    startDate: Date
}

export interface ScheduleDetailResponseDto {
    classInfo: ClassScheduleDetailDto
    students: {
        attending: StudentScheduleDetailDto[]
        makeup: StudentScheduleDetailDto[]
        absent: StudentScheduleDetailDto[]
        total: number
        attendingCount: number
        makeupCount: number
        absentCount: number
    }
}

const getScheduleDetail = async (classId: string, lesson: number, weekId: string = "08a60c9a-b3f8-42f8-8ff8-c7015d4ef3e7"): Promise<ScheduleDetailResponseDto> => {
    const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BASE_API}/schedule-detail`, {
        params: {
            classId,
            lesson,
            weekId
        }
    })

    return data.data;
}

export const useGetScheduleDetail = (classId: string, lesson: number, weekId: string) => {
    return useQuery({
        queryKey: ['schedule-detail', classId, lesson, weekId],
        queryFn: () => getScheduleDetail(classId, lesson, weekId),
        staleTime: 5 * 60 * 1000, // 5 phút
        gcTime: 10 * 60 * 1000, // 10 phút
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 1 ** attemptIndex, 30000),
    })
}

const updateRollcallStatus = async (rollcalls: {
    scheduleId: string,
    rollcallStatus: RollcallStatus,
    reason?: string
}[]) => {
    const { data } = await axios.put(`${process.env.NEXT_PUBLIC_BASE_API}/rollcall-schedule`, {
        rollcalls
    })

    return data.data;
}

export const useUpdateRollcallStatus = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (rollcalls: {
            scheduleId: string,
            rollcallStatus: RollcallStatus,
            reason?: string
        }[]) => updateRollcallStatus(rollcalls),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedule-detail'] })
        },
        onError: (error) => {
            console.error('Error updating rollcall status:', error)
        }
    })
}
