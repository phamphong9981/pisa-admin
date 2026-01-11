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
    FT_LISTENING = 'Listening',
    FT_SPEAKING = 'Speaking',
    FT_WRITING = 'Writing',
    FT_READING = 'Reading',
    OTHER = 'Other',
}
