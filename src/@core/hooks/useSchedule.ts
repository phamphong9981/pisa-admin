import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiClient } from './apiClient'
import { GetScheduleInfoByFieldDto, ScheduleInfoByFieldResponseDto } from './interface/schedule-info.interface'

export enum ScheduleStatus {
    ACTIVE = 'active',
    ON_REQUEST_ACTIVE = 'on_request_active',
    ON_REQUEST_CANCEL = 'on_request_cancel',
    CANCELLED = 'cancelled',
    MAKEUP = 'makeup',
    ON_REQUEST_CHANGE = 'on_request_change',
    CHANGED = 'changed',
    NO_SCHEDULE = 'no_schedule', // no schedule for this week
    APPROVED_ACTIVE = 'approved_active'
}

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

// Map day names to Vietnamese
const dayMap: { [key: string]: string } = {
    Monday: 'Thứ 2',
    Tuesday: 'Thứ 3',
    Wednesday: 'Thứ 4',
    Thursday: 'Thứ 5',
    Friday: 'Thứ 6',
    Saturday: 'Thứ 7',
    Sunday: 'Chủ nhật'
}

// Map day names to offset from week start (Monday = 0)
const dayOffsetMap: Record<string, number> = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6
}

/**
 * Format schedule time with day and date
 * @param scheduleTime - Index in SCHEDULE_TIME array
 * @param weekStartDate - Start date of the week (Date or string)
 * @returns Formatted string like "Thứ 2, 01/01/2024 - 8:00-10:00"
 */
export const formatScheduleTimeWithDate = (
    scheduleTime: number | undefined,
    weekStartDate: Date | string | undefined,
    startTime?: string,
    endTime?: string
): string => {
    if (scheduleTime === undefined || scheduleTime <= 0 || scheduleTime > SCHEDULE_TIME.length) {
        return '—'
    }

    const formatTime = (time?: string) => {
        if (!time) return ''
        // Split by ':' and take only the first two parts (HH:mm)
        const parts = time.split(':')
        if (parts.length >= 2) {
            return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
        }
        return time
    }

    const scheduleStr = SCHEDULE_TIME[scheduleTime - 1]
    const [defaultTimeRange, dayName] = scheduleStr.split(' ')
    const timeRange = (startTime && endTime) ? `${formatTime(startTime)}-${formatTime(endTime)}` : defaultTimeRange

    if (!weekStartDate) {
        // If no week start date, just return the time and day name
        const vietnameseDay = dayMap[dayName] || dayName
        return `${vietnameseDay}\n${timeRange}`
    }

    if (!dayName || !(dayName in dayOffsetMap)) {
        return timeRange || '—'
    }

    // Calculate the specific date
    const startDate = typeof weekStartDate === 'string' ? new Date(weekStartDate) : weekStartDate
    const startDateCopy = new Date(startDate)

    // Find the Monday of the week containing startDate
    // getDay() returns 0 (Sunday) to 6 (Saturday)
    const startDayOfWeek = startDateCopy.getDay()
    // Calculate days to subtract to get to Monday (Monday = 1 in getDay())
    // If Sunday (0), subtract 6 days. If Monday (1), subtract 0 days, etc.
    const daysToMonday = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1
    startDateCopy.setDate(startDateCopy.getDate() - daysToMonday)

    // Now startDateCopy is Monday of that week
    // Calculate offset to target day
    const dayOffset = dayOffsetMap[dayName]
    const targetDate = new Date(startDateCopy)
    targetDate.setDate(startDateCopy.getDate() + dayOffset)

    // Format date in Vietnamese format
    const formattedDate = targetDate.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })

    const vietnameseDay = dayMap[dayName] || dayName

    return `${vietnameseDay}, ${formattedDate}\n${timeRange}`
}
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

    const { data } = await apiClient.get(`/schedule/class/${id}`);


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

export const updateUserSchedule = async (scheduleId: string, start_time?: string, end_time?: string, note?: string, status?: ScheduleStatus) => {
    const { data } = await apiClient.put('/user-schedule', {
        schedule_id: scheduleId,
        start_time: start_time,
        end_time: end_time,
        note: note,
        status: status
    })

    return data.data;
}

export const useUpdateUserSchedule = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ scheduleId, start_time, end_time, note, status }: { scheduleId: string, start_time?: string, end_time?: string, note?: string, status?: ScheduleStatus }) => updateUserSchedule(scheduleId, start_time, end_time, note, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedule-detail'] })
            queryClient.invalidateQueries({ queryKey: ['schedule-by-fields'] })
            queryClient.invalidateQueries({ queryKey: ['schedules'] })

        },
    })
}

export interface AllScheduleStudentDto {
    id: string
    fullname: string
    note?: string
    coursename?: string
    rollcall_status?: RollcallStatus
    teacher_id?: string
    rollcall_reason?: string
}

export interface AllScheduleResponse {
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
    students?: AllScheduleStudentDto[] | null
    note?: string
    start_time?: string
    end_time?: string
    region?: number
    rollcall_note?: string
    isTransferred?: boolean
}

const getAllSchedule = async (courseId?: string, weekId?: string): Promise<AllScheduleResponse[]> => {
    const { data } = await apiClient.get('/schedules', {
        params: {
            weekId,
            courseId,
        }
    });

    return data.data;
}

export const useGetAllSchedule = (enable: boolean, courseId?: string, weekId?: string) => {
    return useQuery({
        queryKey: ['schedules', courseId, weekId],
        queryFn: () => getAllSchedule(courseId, weekId),
        enabled: enable || !!courseId,
        // Refetch every 2 seconds for near-real-time updates
        refetchInterval: 3000,
        refetchIntervalInBackground: true,
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
    const { data } = await apiClient.get('/unscheduled-lessons')

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
    const { data } = await apiClient.post('/schedule', {
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
    TRIAL = 'trial',
    RETAKE = 'retake',
}

// New DTOs for getScheduleDetail
export interface StudentScheduleDetailDto {
    profileId: string
    fullname: string
    email: string
    phone: string
    scheduleId?: string
    scheduleTime?: number
    scheduleStatus?: ScheduleStatus
    rollcallStatus: RollcallStatus
    teacherId?: string
    teacherName?: string
    isMakeup: boolean
    busySchedule: number[]
    reason?: string,
    startTime?: string,
    endTime?: string,
    note?: string,
    courseName: string
    rollcallUsername?: string
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
    scheduleInfo: {
        note?: string
        startTime?: string
        endTime?: string
        rollcallNote?: string
        teacherNote?: string
    }
}

const getScheduleDetail = async (classId: string, lesson: number, weekId: string = "08a60c9a-b3f8-42f8-8ff8-c7015d4ef3e7", scheduleTime?: number): Promise<ScheduleDetailResponseDto> => {
    const { data } = await apiClient.get('/schedule-detail', {
        params: {
            classId,
            lesson,
            weekId,
            scheduleTime
        }
    })

    return data.data;
}

export const useGetScheduleDetail = (classId: string, lesson: number, weekId: string, scheduleTime: number) => {
    return useQuery({
        queryKey: ['schedule-detail', classId, lesson, weekId, scheduleTime],
        queryFn: () => getScheduleDetail(classId, lesson, weekId, scheduleTime),
        enabled: !!classId && !!lesson,
        // Always fetch fresh, avoid caching for detail
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 1 ** attemptIndex, 30000),
    })
}

const updateRollcallStatus = async (rollcalls: {
    scheduleId: string,
    rollcallStatus: RollcallStatus,
    reason?: string,
    isMasked?: boolean
}[]) => {
    const { data } = await apiClient.put('/rollcall-schedule', {
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
            reason?: string,
            isMasked?: boolean
        }[]) => updateRollcallStatus(rollcalls),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedule-detail'] })
        },
        onError: (error) => {
            console.error('Error updating rollcall status:', error)
        }
    })
}


export interface CreateLessonScheduleDto {
    weekId: string
    scheduleTime: number
    startTime: string
    endTime: string
    classId: string
    lesson: number
    teacherId: string
    profileIds: string[]
    note?: string
}

const createLessonSchedule = async (lessonSchedule: CreateLessonScheduleDto) => {
    const { data } = await apiClient.post('/create-lesson-schedule', lessonSchedule)

    return data.data;
}

export const useCreateLessonSchedule = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createLessonSchedule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['unschedule-list'] })
            queryClient.invalidateQueries({ queryKey: ['schedules'] })
        },
    })
}

const autoScheduleCourse = async (courseId: string) => {
    const { data } = await apiClient.post('/auto-schedule-course', {
        courseId
    })

    return data.data;
}

export const useAutoScheduleCourse = () => {
    const queryClient = useQueryClient()


    return useMutation({
        mutationFn: autoScheduleCourse,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['unschedule-list'] })
            queryClient.invalidateQueries({ queryKey: ['schedules'] })
        },
    })
}

export interface UpdateLessonScheduleDto {
    weekId: string

    scheduleTime?: number

    classId: string

    lesson: number

    action: string // update, delete

    startTime?: string

    endTime?: string

    teacherId?: string

    profileIds?: string[]

    note?: string

    rollcallNote?: string

    teacherNote?: string
}

const updateLessonSchedule = async (lessonSchedule: UpdateLessonScheduleDto) => {
    const { data } = await apiClient.put('/update-lesson-schedule', lessonSchedule)

    return data.data;
}

export const useUpdateLessonSchedule = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: updateLessonSchedule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['unschedule-list'] })
            queryClient.invalidateQueries({ queryKey: ['schedules'] })
            queryClient.invalidateQueries({ queryKey: ['schedule-detail'] })
            queryClient.invalidateQueries({ queryKey: ['teachers'] })
        },
    })
}

export interface ScheduleByFieldResponseDto {
    id: string
    lesson: number
    status: string
    startTime?: string
    endTime?: string
    note?: string
    scheduleTime?: number

    // Joined fields
    fullname: string
    classname: string
    courseName?: string
}

const getScheduleByFields = async (status: ScheduleStatus, weekId: string = "08a60c9a-b3f8-42f8-8ff8-c7015d4ef3e7"): Promise<ScheduleByFieldResponseDto[]> => {
    const { data } = await apiClient.get('/schedules-by-fields', {
        params: {
            status,
            weekId
        }
    })

    return data.data;
}

export const useGetScheduleByFields = (status: ScheduleStatus, weekId: string) => {
    return useQuery({
        queryKey: ['schedule-by-fields', status, weekId],
        queryFn: () => getScheduleByFields(status, weekId),
        staleTime: 5 * 60 * 1000, // 5 phút
        gcTime: 10 * 60 * 1000, // 10 phút
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 1 ** attemptIndex, 30000),
    })
}

export interface MissingSchedulesDto {
    profileId: string
    fullname: string
    email: string
    phone: string
    scheduleId?: string
    scheduleTime?: number
    scheduleStatus?: string
    classId: string
    className: string
    classType: string
    courseName: string
    weekId: string
    startDate: string
    reasonStatus?: string
    replaceSchedule?: {
        id: string
        scheduleTime: number
        startDate: string
    }
}

const missingSchedulesList = async (profileId?: string, courseId?: string, weekId?: string): Promise<MissingSchedulesDto[]> => {
    const { data } = await apiClient.get('/missing-schedules', {
        params: {
            profileId,
            courseId,
            weekId
        }
    })

    return data.data;
}

export const useMissingSchedulesList = (profileId?: string, courseId?: string, weekId?: string) => {
    return useQuery({
        queryKey: ['missing-schedules', profileId, courseId, weekId],
        queryFn: () => missingSchedulesList(profileId, courseId, weekId),
        staleTime: 5 * 60 * 1000, // 5 phút
        gcTime: 10 * 60 * 1000, // 10 phút
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 1 ** attemptIndex, 30000),
    })
}


const requestSchedule = async (status: ScheduleStatus, scheduleId: string, statusReason?: string): Promise<MissingSchedulesDto[]> => {
    const { data } = await apiClient.put('/request-schedule', {
        status,
        schedule_id: scheduleId,
        status_reason: statusReason
    })

    return data.data;
}

export const useRequestSchedule = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ status, scheduleId, statusReason }: { status: ScheduleStatus, scheduleId: string, statusReason?: string }) => requestSchedule(status, scheduleId, statusReason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['missing-schedules'] })
            queryClient.invalidateQueries({ queryKey: ['schedule-by-fields'] })
        },
    })
}

// Batch order schedule
export interface BatchOrderScheduleItem {
    email: string
    busy_schedule_arr: number[]
    type?: 'teacher' | 'user'
}

export interface BatchOrderScheduleRequest {
    data: BatchOrderScheduleItem[]
    weekId?: string
}

const batchOrderSchedule = async (request: BatchOrderScheduleRequest) => {
    const { data } = await apiClient.put('/admin/batch-order-schedule', request)

    return data.data
}

export const useBatchOrderSchedule = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (request: BatchOrderScheduleRequest) => batchOrderSchedule(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teachers'] })
            queryClient.invalidateQueries({ queryKey: ['students'] })
            queryClient.invalidateQueries({ queryKey: ['schedules'] })
        },
        onError: (error) => {
            console.error('Error batch ordering schedule:', error)
        }
    })
}

// Export schedule info CSV
export interface ExportScheduleInfoResponse {
    filename: string
    contentType: string
    contentDisposition: string
    content: string
}

export const exportScheduleInfo = async (weekId: string, download: boolean = true): Promise<ExportScheduleInfoResponse> => {
    const { data } = await apiClient.get('/export/schedule-info', {
        params: { weekId, download }
    })

    // Some APIs wrap payload in data.data, handle both
    const payload = (data && data.data) ? data.data : data

    return payload as ExportScheduleInfoResponse
}

// Get schedule info by field
const getScheduleInfoByField = async (query: GetScheduleInfoByFieldDto): Promise<ScheduleInfoByFieldResponseDto[]> => {
    const { data } = await apiClient.get('/schedule-info', {
        params: query
    })

    return data.data || []
}

export const useGetScheduleInfoByField = (query: GetScheduleInfoByFieldDto) => {
    return useQuery({
        queryKey: ['schedule-info-by-field', query],
        queryFn: () => getScheduleInfoByField(query),
        enabled: !!query.teacherNote || !!query.weekId || !!query.classId,
        staleTime: 5 * 60 * 1000, // 5 phút
        gcTime: 10 * 60 * 1000, // 10 phút
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 1 ** attemptIndex, 30000),
    })
}

export interface SearchScheduleResponseDto {
    scheduleId: string
    profileId: string
    profileFullname: string
    profileEmail: string
    classId: string
    className: string
    courseId: string
    courseName: string
    lesson: number
    weekId: string
    scheduleTime: number
    teacherId?: string
    teacherName?: string
    status: string
    rollcallStatus: string
    startTime?: string
    endTime?: string
    totalTime?: number
    reason?: string
    scheduleInfoId?: string
    scheduleInfoNote?: string
    scheduleInfoStartTime?: string
    scheduleInfoEndTime?: string
    scheduleInfoTeacherNote?: string
    scheduleDate?: string
    courseRegion?: number
    profilePhone?: string
    isMasked?: boolean
}

export interface SearchSchedulePaginationResponseDto {
    data: SearchScheduleResponseDto[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface SearchScheduleParams {
    search?: string
    weekId?: string
    scheduleTime?: number // Deprecated: use scheduleTimes instead
    scheduleTimes?: number[] // Array of schedule times (1-42)
    profileId?: string
    teacherId?: string
    startDate?: string
    endDate?: string
    rollcallStatus?: string
    region?: number
    page?: number
    limit?: number
    isMasked?: boolean
}

const searchSchedule = async (params: SearchScheduleParams): Promise<SearchSchedulePaginationResponseDto> => {
    // Build params object
    const requestParams: any = {
        search: params.search,
        weekId: params.weekId,
        profileId: params.profileId,
        teacherId: params.teacherId,
        startDate: params.startDate,
        endDate: params.endDate,
        rollcallStatus: params.rollcallStatus,
        region: params.region,
        page: params.page || 1,
        limit: params.limit || 50,
        isMasked: params.isMasked
    }

    // Use scheduleTimes if provided, otherwise fall back to scheduleTime for backward compatibility
    if (params.scheduleTimes && params.scheduleTimes.length > 0) {
        // Send as array - axios will handle it correctly
        requestParams.scheduleTimes = params.scheduleTimes
    } else if (params.scheduleTime) {
        // Backward compatibility: convert single scheduleTime to array
        requestParams.scheduleTimes = [params.scheduleTime]
    }

    const { data } = await apiClient.get('/search-schedule', {
        params: requestParams
    })

    return data.data
}

export const useSearchSchedule = (params: SearchScheduleParams, enabled: boolean = true) => {
    return useQuery({
        queryKey: ['search-schedule', params],
        queryFn: () => searchSchedule(params),
        enabled: enabled,
        staleTime: 1 * 60 * 1000,
    })
}

export const useExportSearchSchedule = () => {
    return useMutation({
        mutationFn: (params: SearchScheduleParams) => {
            // Build params object
            const requestParams: any = {
                search: params.search,
                weekId: params.weekId,
                profileId: params.profileId,
                teacherId: params.teacherId,
                startDate: params.startDate,
                endDate: params.endDate,
                rollcallStatus: params.rollcallStatus,
                region: params.region,
                isMasked: params.isMasked
                // No pagination for export
            }

            if (params.scheduleTimes && params.scheduleTimes.length > 0) {
                requestParams.scheduleTimes = params.scheduleTimes
            } else if (params.scheduleTime) {
                requestParams.scheduleTimes = [params.scheduleTime]
            }

            return apiClient.get('/search-schedule/export', {
                params: requestParams,
                responseType: 'blob'
            }).then(response => {
                const url = window.URL.createObjectURL(new Blob([response.data]))
                const link = document.createElement('a')
                link.href = url

                let filename = `search_schedule_${new Date().toISOString().split('T')[0]}.xlsx`
                const disposition = response.headers['content-disposition']
                if (disposition && disposition.indexOf('attachment') !== -1) {
                    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
                    const matches = filenameRegex.exec(disposition)
                    if (matches != null && matches[1]) {
                        filename = matches[1].replace(/['"]/g, '')
                    }
                }

                link.setAttribute('download', filename)
                document.body.appendChild(link)
                link.click()
                link.remove()
                window.URL.revokeObjectURL(url)
            })
        }
    })
}

// Locked Schedule Date Entity
export interface LockedScheduleDate {
    id: string
    lockDate: string // YYYY-MM-DD
    createdAt: string
    updatedAt: string
    createdBy?: string
    updatedBy?: string
}

// Get locked schedule dates
const getLockedScheduleDates = async (): Promise<LockedScheduleDate[]> => {
    const { data } = await apiClient.get('/locked-schedule-dates')

    return data.data || data
}

export const useGetLockedScheduleDates = () => {
    return useQuery({
        queryKey: ['locked-schedule-dates'],
        queryFn: getLockedScheduleDates,
        staleTime: 5 * 60 * 1000,
        retry: 1
    })
}

// Delete locked schedule date
const deleteLockedScheduleDate = async (id: string) => {
    const { data } = await apiClient.delete(`/locked-schedule-dates/${id}`)

    return data
}

export const useDeleteLockedScheduleDate = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteLockedScheduleDate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locked-schedule-dates'] })
        },
        onError: (error) => {
            console.error('Error deleting locked schedule date:', error)
        }
    })
}

// Lock schedule by date
export interface LockScheduleByDateRequest {
    start_date: string // Format: 'YYYY-MM-DD'
    is_locked: boolean
}

export interface LockScheduleByDateResponse {
    message: string
    lockedCount?: number
}

const lockScheduleByDate = async (request: LockScheduleByDateRequest): Promise<LockScheduleByDateResponse> => {
    const { data } = await apiClient.put('/locked-schedule-dates/lock', request)

    return data.data || data
}

export const useLockScheduleByDate = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: lockScheduleByDate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['search-schedule'] })
            queryClient.invalidateQueries({ queryKey: ['schedules'] })
            queryClient.invalidateQueries({ queryKey: ['schedule-detail'] })
            queryClient.invalidateQueries({ queryKey: ['locked-schedule-dates'] })
        },
        onError: (error) => {
            console.error('Error locking schedule by date:', error)
        }
    })
}

