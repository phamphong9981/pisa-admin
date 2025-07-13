import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { TeacherListResponse } from './useTeacher'
import { ClassListResponse } from './useClass'
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
    console.log(data.data);
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
    classes: ClassListResponse[]
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
