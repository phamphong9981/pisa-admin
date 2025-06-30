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
    classType: 'FT_listening' | 'FT_writing' | 'FT_reading' | 'FT_speaking'
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
