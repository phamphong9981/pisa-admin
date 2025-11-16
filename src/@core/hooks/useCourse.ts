// React Query Imports
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Axios Import
import { apiClient } from './apiClient'

export enum CourseStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}
// Type Imports
import type { TeacherListResponse } from './useTeacher'
import type { ClassListResponse } from './useClass'
import type { Profile } from './useStudent'

interface CourseListResponse {
    id: string,
    name: string,
    status: CourseStatus,
    type: string,
    teacher: {
        name: string
    },
    classes: {
        id: string,
        startTime: string | null,
        endTime: string | null,
        autoSchedule: boolean
    }[],
    region: number
}

const fetchCourseList = async (region?: number, weekId?: string): Promise<CourseListResponse[]> => {
    const params = new URLSearchParams();

    if (region) params.append('region', region.toString());
    if (weekId) params.append('weekId', weekId);

    const { data } = await apiClient.get('/courses', {
        params: params.toString() ? Object.fromEntries(params) : undefined
    });
    return data.data;
}

// Region ids and labels used consistently across app
export enum RegionId {
    HALONG = 1,
    UONGBI = 2,
    CAMPHA = 3,
    BAICHAY = 4
}

export const RegionLabel: Record<RegionId, string> = {
    [RegionId.HALONG]: 'Hạ Long',
    [RegionId.UONGBI]: 'Uông Bí',
    [RegionId.CAMPHA]: 'Cẩm Phả',
    [RegionId.BAICHAY]: 'Bãi Cháy'
}

export const useCourseList = (region?: number, weekId?: string) => {
    return useQuery<CourseListResponse[], Error>({
        queryKey: ['courses', region, weekId],
        queryFn: () => fetchCourseList(region, weekId),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 1 ** attemptIndex, 30000),
    })
}

interface CourseInfo {
    name: string,
    status: CourseStatus,
    type: string,
    teacher: TeacherListResponse,
    classes: ClassListResponse[],
    id: string,
    profileCourses: {
        profile: Profile
    }[]
}

export const useCourseInfo = (courseId: string, weekId: string) => {
    return useQuery<CourseInfo, Error>({
        queryKey: ['courseInfo', courseId, weekId],
        queryFn: async () => {
            const { data } = await apiClient.get(`/courses/${courseId}/${weekId}`);

            return data.data;
        },
        enabled: !!courseId,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 1 ** attemptIndex, 30000),
    })
}

export const useCourseInfoWithReload = (courseId: string, weekId: string) => {
    return useQuery<CourseInfo, Error>({
        queryKey: ['courseInfo', courseId, weekId],
        queryFn: async () => {
            const { data } = await apiClient.get(`/courses/${courseId}/${weekId}`);

            return data.data;
        },
        enabled: !!courseId,
        refetchInterval: 2000,
        refetchIntervalInBackground: true,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 1 ** attemptIndex, 30000),
    })
}

// Optional client-side course type enum (not enforced by API)
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
    // Accept raw API type strings (e.g., FT_listening) or mapped enum values
    type: string | CourseType,
    teacher_id: string,
    region: number
}

const createCourse = async (createCourseRequest: CreateCourseRequest) => {
    const { data } = await apiClient.post('/courses', createCourseRequest);

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



const registerCourse = async (courseId: string, profileIds: string[]) => {
    const { data } = await apiClient.post('/courses/register-course', {
        profile_ids: profileIds,
        course_id: courseId
    });

    return data.data;
}

export const useRegisterCourse = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ courseId, profileIds }: { courseId: string, profileIds: string[] }) => registerCourse(courseId, profileIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courseInfo'] })
        },
        onError: (error) => {
            console.error('Error registering course:', error)
        }
    })
}

const unregisterCourse = async (courseId: string, profileId: string) => {
    const { data } = await apiClient.post('/courses/unregister-course', {
        profile_id: profileId,
        course_id: courseId
    });

    return data.data;
}

export const useUnregisterCourse = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ courseId, profileId }: { courseId: string, profileId: string }) => unregisterCourse(courseId, profileId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courseInfo'] })
        },
    })
}


export interface UpdateCourseRequest {
    name?: string
    // Accept backend type string directly for flexibility
    type?: string | CourseType
    teacherId?: string
    region?: number
    status?: CourseStatus
}

const updateCourse = async (courseId: string, updateCourseRequest: UpdateCourseRequest) => {
    const { data } = await apiClient.put(`/courses/${courseId}`, updateCourseRequest);

    return data.data;
}

export const useUpdateCourse = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ courseId, updateCourseRequest }: { courseId: string, updateCourseRequest: UpdateCourseRequest }) => updateCourse(courseId, updateCourseRequest),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courseInfo'] })
            queryClient.invalidateQueries({ queryKey: ['courses'] })
        },
        onError: (error) => {
            console.error('Error updating course:', error)
        }
    })
}
