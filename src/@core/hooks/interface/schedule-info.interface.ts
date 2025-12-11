export class GetScheduleInfoByFieldDto {
    weekId?: string
    classId?: string
    teacherNote?: boolean
    region?: number
}

export interface ScheduleInfoByFieldResponseDto {
    id: string
    classId: string
    weekId: string
    lesson: number
    scheduleTime?: number
    note?: string
    startTime?: string
    endTime?: string
    teacherId?: string
    rollcallNote?: string
    teacherNote: string
    // Joined fields
    className?: string
    courseName?: string
    teacherName?: string
}
