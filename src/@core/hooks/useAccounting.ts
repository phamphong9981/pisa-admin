import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface TotalStudyHoursResponse {
    username: string,
    fullname: string,
    email: string,
    courseName: string,
    className: string,
    totalActualHours: number,
    totalAttendedSessions: number
}

const api = {
    getTotalStudyHours: async (search?: string): Promise<TotalStudyHoursResponse[]> => {
        const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BASE_API}/total-study-hours`, {
            params: {
                search: search
            }
        })

        return data.data;
    }
}

export const useGetTotalStudyHours = (search?: string) => {
    return useQuery({
        queryKey: ['totalStudyHours', search],
        queryFn: () => api.getTotalStudyHours(search),
    })
}
