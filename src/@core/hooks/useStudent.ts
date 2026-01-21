import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from './apiClient'

export interface Profile {
    id: string;
    fullname: string;
    email: string;
    phone: string;
    image: string;
    ieltsPoint: string;
    createdAt: Date;
    updatedAt: Date;
    busyScheduleArr: number[];
}

// Admin roles can be combined, e.g.:
// 'admin', 'admin_schedule', 'admin_schedule_accounting', 'admin_schedule_class_teacher', etc.
type AdminModule = 'schedule' | 'accounting' | 'class' | 'teacher'
type AdminRole1 = `admin_${AdminModule}`
type AdminRole2 = `admin_${AdminModule}_${AdminModule}`
type AdminRole3 = `admin_${AdminModule}_${AdminModule}_${AdminModule}`
type AdminRole4 = `admin_${AdminModule}_${AdminModule}_${AdminModule}_${AdminModule}`
export type UserType = 'user' | 'teacher' | 'admin' | AdminRole1 | AdminRole2 | AdminRole3 | AdminRole4

interface ListUsersResponseDto {
    users: {
        id: string;
        username: string;
        type: string;
        fcmToken?: string;
        createdAt: Date;
        updatedAt: Date;
        profile: Profile;
        teacher?: {
            name: string,
            skills: string[],
            note: string,
        }
        course?: {
            name: string,
            id: string
        }
        schedules?: {
            id: string;
            lesson: number;
            scheduleTime: number;
            status: string;
            className: string;
            courseName: string;
            teacherName: string;
        }[];
    }[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

const fetchStudentList = async (search: string, weekId?: string, region?: number): Promise<ListUsersResponseDto> => {
    const { data } = await apiClient.get('/user/', {
        params: {
            type: 'user',
            search,
            weekId,
            region
        }
    });

    return data.data;
}

export const useStudentList = (search: string, weekId?: string, region?: number) => {
    return useQuery<ListUsersResponseDto, Error>({
        queryKey: ['students', search, weekId, region],
        queryFn: () => fetchStudentList(search, weekId, region),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 1 ** attemptIndex, 30000),
    })
}

export const useStudentListWithReload = (search: string, weekId?: string, region?: number) => {
    return useQuery<ListUsersResponseDto, Error>({
        queryKey: ['students', search, weekId, region],
        queryFn: () => fetchStudentList(search, weekId, region),
        refetchInterval: 3000,
        refetchIntervalInBackground: true,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 1 ** attemptIndex, 30000),
    })
}

export interface CreateUserDto {
    username: string
    password: string
    fullname: string
    email: string
    phone?: string
    courseId?: string,
    type?: UserType
    ieltsPoint?: string
}

const registerUser = async (createUserDto: CreateUserDto) => {
    const { data } = await apiClient.post('/user', createUserDto);

    return data.data;
}

export const useCreateUser = (courseId?: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: registerUser,
        onSuccess: () => {
            if (courseId) {
                queryClient.invalidateQueries({ queryKey: ['courseInfo', courseId] })
            }
            queryClient.invalidateQueries({ queryKey: ['users'] })
            queryClient.invalidateQueries({ queryKey: ['students'] })
        },
        onError: (error) => {
            console.error('Error registering user:', error)
        }
    })
}

const fetchUserList = async (search: string, type?: UserType): Promise<ListUsersResponseDto> => {
    const { data } = await apiClient.get('/user/', {
        params: {
            search,
            type
        }
    });

    return data.data;
}

export const useUserList = (search: string, type?: UserType) => {
    return useQuery<ListUsersResponseDto, Error>({
        queryKey: ['users', search, type],
        queryFn: () => fetchUserList(search, type),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 1 ** attemptIndex, 30000),
    })
}

export interface UpdateUserDto {
    username?: string
    password?: string
    type?: UserType
    fullname?: string
    email?: string
    phone?: string
    image?: string
    ieltsPoint?: string
    courseId?: string
}

const updateUser = async (userId: string, updateUserDto: UpdateUserDto) => {
    const { data } = await apiClient.put(`/user/${userId}`, updateUserDto);

    return data.data;
}

export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, updateUserDto }: { userId: string, updateUserDto: UpdateUserDto }) => updateUser(userId, updateUserDto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
        }
    })
}

const deleteUser = async (userId: string) => {
    const { data } = await apiClient.delete(`/user/${userId}`);

    return data.data;
}

export const useDeleteUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (userId: string) => deleteUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
            queryClient.invalidateQueries({ queryKey: ['students'] })
        }
    })
}

// Profile Search API types
export interface ProfileCourse {
    id: string
    profileId: string
    courseId: string
    createdAt: string
    updatedAt: string
    course: {
        id: string
        name: string
        type: string
        teacherId: string
        region: number
        status: string
        createdAt: string
        updatedAt: string
    }
}

export interface ProfileSearchResult {
    id: string
    userId: string
    fullname: string
    email: string
    phone: string
    image: string
    ieltsPoint: string
    currentWeekBusyScheduleArr: number[]
    createdAt: string
    updatedAt: string
    profileCourses: ProfileCourse[]
}

// Profile Search API function
const searchProfiles = async (search?: string): Promise<ProfileSearchResult[]> => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)

    const { data } = await apiClient.get('/user/profiles/search', {
        params: search ? { search } : undefined
    })

    return data.data
}

// Hook to search profiles
export const useProfileSearch = (search: string) => {
    return useQuery<ProfileSearchResult[], Error>({
        queryKey: ['profileSearch', search],
        queryFn: () => searchProfiles(search),
        enabled: search.length >= 1, // Only search when at least 1 character
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    })
}
