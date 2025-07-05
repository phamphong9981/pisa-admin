import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface TeacherListResponse {
    id: string,
    name: string,
    skills: string[],
    registeredBusySchedule: number[],
    createdAt: string,
    updatedAt: string
}

// Function để gọi API lấy danh sách teacher
const fetchTeacherList = async (): Promise<TeacherListResponse[]> => {
    const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BASE_API}/teachers`);
    return data.data;
}

export const useTeacherList = () => {
    return useQuery<TeacherListResponse[], Error>({
        queryKey: ['teachers'],
        queryFn: fetchTeacherList,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 1 ** attemptIndex, 30000),
    })
}
