// React Query Imports
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Axios Import
import axios from 'axios'

// Type Imports
import type { TeacherListResponse } from './useTeacher'
import type { ClassListResponse } from './useClass'

interface CourseListResponse {
    id: string,
    name: string,
    type: string,
    teacher: {
        name: string
    },
    classes: {
        id: string,
    }[]
}

const fetchCourseList = async (): Promise<CourseListResponse[]> => {
    const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BASE_API}/courses`);

    return data.data;
}

export const useCourseList = () => {
    return useQuery<CourseListResponse[], Error>({
        queryKey: ['courses'],
        queryFn: fetchCourseList,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 1 ** attemptIndex, 30000),
    })
}

interface CourseInfo {
    name: string,
    type: string,
    teacher: TeacherListResponse,
    classes: ClassListResponse[],
    id: string
}

export const useCourseInfo = (courseId: string) => {
    return useQuery<CourseInfo, Error>({
        queryKey: ['courseInfo', courseId],
        queryFn: async () => {
            const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BASE_API}/courses/${courseId}`);

            return data.data;
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 1 ** attemptIndex, 30000),
    })
}

export enum CourseType {
    FOUNDATION = 'foundation',
    INTERMEDIATE = 'intermediate',
    ADVANCED = 'advanced',
    IELTS = 'ielts',
    TOEFL = 'toefl',
    TOEIC = 'toeic',
}

interface CreateCourseRequest {
    name: string,
    type: CourseType,
    teacher_id: string
}

const createCourse = async (createCourseRequest: CreateCourseRequest) => {
    const { data } = await axios.post(`${process.env.NEXT_PUBLIC_BASE_API}/courses`, createCourseRequest);

    return data.data;
}

export const useCreateCourse = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createCourse,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courses'] })
        },
        onError: (error) => {
            console.error('Error creating course:', error)
        }
    })
}
