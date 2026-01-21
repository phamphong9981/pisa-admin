import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from './apiClient';

// Wallet type labels
export const WALLET_TYPE_LABELS: Record<string, string> = {
    v0: 'Buổi chính',
    v1: 'Bổ trợ BTG với Giáo viên',
    v2: 'Bổ trợ BTG với Tutor',
    v3: 'Bổ trợ yếu BTS',
    v4: 'Mock 3 kỹ năng LRW',
    v5: 'Mock S GVTT',
    v6: 'Mock S Chuyên gia',
};

export const WALLET_TYPE_KEYS = ['v0', 'v1', 'v2', 'v3', 'v4', 'v5', 'v6'] as const;
export type WalletTypeKey = typeof WALLET_TYPE_KEYS[number];

// Interfaces
export interface WalletDetail {
    tang: number;
    giam: number;
    ton: number;
}

export interface StudentWallet {
    id: string;
    studentId: string;
    v0: WalletDetail;
    v1: WalletDetail;
    v2: WalletDetail;
    v3: WalletDetail;
    v4: WalletDetail;
    v5: WalletDetail;
    v6: WalletDetail;
    createdAt: string;
    updatedAt: string;
    student?: {
        id: string;
        fullname: string;
        email: string;
        phone?: string;
        image?: string;
    };
}

export interface StudentProfileWithWallet {
    id: string;
    userId: string;
    fullname: string;
    email: string;
    phone?: string;
    image?: string;
    ieltsPoint?: string;
    createdAt: string;
    updatedAt: string;
    wallet: StudentWallet | null;
    courseNames?: string[];
}

export interface ProfilesWithWalletsResponse {
    data: StudentProfileWithWallet[];
    total: number;
    page: number;
    limit: number;
}

export interface ProfilesWithWalletsQueryParams {
    search?: string;
    page?: number;
    limit?: number;
}

export interface IncreaseStudentWalletDto {
    studentId: string;
    v0?: number;
    v1?: number;
    v2?: number;
    v3?: number;
    v4?: number;
    v5?: number;
    v6?: number;
}

// API functions
const studentWalletApi = {
    // Get all student wallets
    getAllWallets: async (): Promise<StudentWallet[]> => {
        const { data } = await apiClient.get('/student-wallets');
        return data?.data || data;
    },

    // Get all student profiles with wallets (with pagination)
    getAllProfilesWithWallets: async (params?: ProfilesWithWalletsQueryParams): Promise<ProfilesWithWalletsResponse> => {
        const { data } = await apiClient.get('/student-wallets/profiles/all', { params });
        return data?.data || data;
    },

    // Get wallet by ID
    getWalletById: async (id: string): Promise<StudentWallet> => {
        const { data } = await apiClient.get(`/student-wallets/${id}`);
        return data?.data || data;
    },

    // Get wallet by student ID
    getWalletByStudentId: async (studentId: string): Promise<StudentWallet> => {
        const { data } = await apiClient.get(`/student-wallets/student/${studentId}`);
        return data?.data || data;
    },

    // Increase wallet (create or update)
    increaseWallet: async (dto: IncreaseStudentWalletDto): Promise<StudentWallet> => {
        const { data } = await apiClient.post('/student-wallets/increase', dto);
        return data?.data || data;
    },

    // Delete wallet by ID
    deleteWalletById: async (id: string): Promise<void> => {
        await apiClient.delete(`/student-wallets/${id}`);
    },

    // Delete wallet by student ID
    deleteWalletByStudentId: async (studentId: string): Promise<void> => {
        await apiClient.delete(`/student-wallets/student/${studentId}`);
    },
};

// Hooks
export const useGetAllWallets = () => {
    return useQuery({
        queryKey: ['student-wallets'],
        queryFn: studentWalletApi.getAllWallets,
    });
};

export const useGetAllProfilesWithWallets = (params?: ProfilesWithWalletsQueryParams) => {
    return useQuery({
        queryKey: ['student-wallets', 'profiles', params],
        queryFn: () => studentWalletApi.getAllProfilesWithWallets(params),
    });
};

export const useGetWalletById = (id: string | undefined) => {
    return useQuery({
        queryKey: ['student-wallets', id],
        queryFn: () => studentWalletApi.getWalletById(id!),
        enabled: !!id,
    });
};

export const useGetWalletByStudentId = (studentId: string | undefined) => {
    return useQuery({
        queryKey: ['student-wallets', 'student', studentId],
        queryFn: () => studentWalletApi.getWalletByStudentId(studentId!),
        enabled: !!studentId,
    });
};

export const useIncreaseWallet = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: studentWalletApi.increaseWallet,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['student-wallets'] });
        },
    });
};

export const useDeleteWalletById = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: studentWalletApi.deleteWalletById,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['student-wallets'] });
        },
    });
};

export const useDeleteWalletByStudentId = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: studentWalletApi.deleteWalletByStudentId,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['student-wallets'] });
        },
    });
};

// Helper functions
export const getWalletTypeLabel = (key: WalletTypeKey): string => {
    return WALLET_TYPE_LABELS[key] || key;
};

export const getTotalBalance = (wallet: StudentWallet | null): number => {
    if (!wallet) return 0;
    return (
        wallet.v0.ton +
        wallet.v1.ton +
        wallet.v2.ton +
        wallet.v3.ton +
        wallet.v4.ton +
        wallet.v5.ton +
        wallet.v6.ton
    );
};

