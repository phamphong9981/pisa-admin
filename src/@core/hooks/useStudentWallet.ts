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
export interface StudentWallet {
    id: string;
    studentId: string;
    v0: number;
    v1: number;
    v2: number;
    v3: number;
    v4: number;
    v5: number;
    v6: number;
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

export interface CreateStudentWalletDto {
    studentId: string;
    v0?: number;
    v1?: number;
    v2?: number;
    v3?: number;
    v4?: number;
    v5?: number;
    v6?: number;
}

export interface UpdateStudentWalletDto {
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

    // Create wallet
    createWallet: async (dto: CreateStudentWalletDto): Promise<StudentWallet> => {
        const { data } = await apiClient.post('/student-wallets', dto);
        return data?.data || data;
    },

    // Update wallet by ID
    updateWalletById: async ({ id, dto }: { id: string; dto: UpdateStudentWalletDto }): Promise<StudentWallet> => {
        const { data } = await apiClient.put(`/student-wallets/${id}`, dto);
        return data?.data || data;
    },

    // Update wallet by student ID
    updateWalletByStudentId: async ({ studentId, dto }: { studentId: string; dto: UpdateStudentWalletDto }): Promise<StudentWallet> => {
        const { data } = await apiClient.put(`/student-wallets/student/${studentId}`, dto);
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

export const useCreateWallet = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: studentWalletApi.createWallet,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['student-wallets'] });
        },
    });
};

export const useUpdateWalletById = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: studentWalletApi.updateWalletById,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['student-wallets'] });
        },
    });
};

export const useUpdateWalletByStudentId = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: studentWalletApi.updateWalletByStudentId,
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

export const getTotalVouchers = (wallet: StudentWallet | null): number => {
    if (!wallet) return 0;
    return wallet.v0 + wallet.v1 + wallet.v2 + wallet.v3 + wallet.v4 + wallet.v5 + wallet.v6;
};

