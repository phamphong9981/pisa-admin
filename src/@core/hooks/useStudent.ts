import { useQuery } from "@tanstack/react-query"
import axios from "axios"

export interface Profile {
    id: string;
    fullname: string;
    email: string;
    phone: string;
    image: string;
    ieltsPoint: string;
    createdAt: Date;
    updatedAt: Date;
}

interface ListUsersResponseDto {
    users: {
        id: string;
        username: string;
        type: string;
        fcmToken?: string;
        createdAt: Date;
        updatedAt: Date;
        profile: Profile;
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
    const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BASE_API}/user/`, {
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
