export interface Student {
    profileId: string
    username: string
    fullName: string
    phoneNumber: string
    email: string
    lessons: number[]
}

export interface ClassData {
    id: string
    name: string
    totalStudent: number
    totalLessonPerWeek: number
    classType: ClassType
    teacherId: string | null
    teacherName?: string
    createdAt: string
    updatedAt: string
    students?: Student[]
}

export interface ClassesResponse {
    data: ClassData[]
    total: number
}

export enum ClassType {
    FT_LISTENING = 'listening',
    FT_SPEAKING = 'speaking',
    FT_WRITING = 'writing',
    FT_READING = 'reading',
    OTHER = 'other',
}
