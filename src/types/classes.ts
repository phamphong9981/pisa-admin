export interface ClassData {
  id: string
  name: string
  totalStudent: number
  totalLessonPerWeek: number
  classType: 'FT_listening' | 'FT_writing' | 'FT_reading' | 'FT_speaking'
  teacherId: string | null
  createdAt: string
  updatedAt: string
}

export interface ClassesResponse {
  data: ClassData[]
  total: number
} 
