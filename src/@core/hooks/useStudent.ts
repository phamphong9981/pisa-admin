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
        course?: {
            name: string,
            id: string
        }
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

const fetchStudentList = async (search: string): Promise<ListUsersResponseDto> => {
    const { data } = await apiClient.get('/user/', {
        params: {
            type: 'user',
            search
        }
    });

    return data.data;
}

export const useStudentList = (search: string) => {
    return useQuery<ListUsersResponseDto, Error>({
        queryKey: ['students', search],
        queryFn: () => fetchStudentList(search),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 1 ** attemptIndex, 30000),
    })
}

export const useStudentListWithReload = (search: string) => {
    return useQuery<ListUsersResponseDto, Error>({
        queryKey: ['students', search],
        queryFn: () => fetchStudentList(search),
        refetchInterval: 3000,
        refetchIntervalInBackground: true,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 1 ** attemptIndex, 30000),
    })
}

const updateStudentBusySchedule = async (studentId: string, busySchedule: number[]) => {
    const { data } = await apiClient.put(`/${studentId}/order-schedule`, {
        busy_schedule_arr: busySchedule
    });

    return data.data;
}

export const useUpdateStudentBusySchedule = () => {
    const queryClient = useQueryClient();


    return useMutation({
        mutationFn: ({ studentId, busySchedule }: { studentId: string, busySchedule: number[] }) => updateStudentBusySchedule(studentId, busySchedule),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] })
        }
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
}

const registerUser = async (createUserDto: CreateUserDto) => {
    const { data } = await apiClient.post('/user', createUserDto);

    return data.data;
}

export const useCreateUser = (courseId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: registerUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courseInfo', courseId] })
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
