import { useQuery } from "@tanstack/react-query";
import { apiClient } from './apiClient';

// Types based on API documentation
export type AuditOperation = 'INSERT' | 'UPDATE' | 'DELETE' | 'INCREASE' | 'ROLLCALL';

export interface WalletDelta {
    tang: number;
    giam: number;
    ton: number;
}

export interface StudentWalletAuditRecord {
    id: number;
    walletId?: string;
    studentId: string;
    operation: AuditOperation;
    changedAt: string;
    changedBy?: string;
    changedByUsername?: string;
    v0Delta?: WalletDelta;
    v1Delta?: WalletDelta;
    v2Delta?: WalletDelta;
    v3Delta?: WalletDelta;
    v4Delta?: WalletDelta;
    v5Delta?: WalletDelta;
    v6Delta?: WalletDelta;
    v7Delta?: WalletDelta;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    studentFullName?: string
    courseName?: string
}

export interface AuditSearchParams {
    studentId?: string;
    walletId?: string;
    operation?: AuditOperation;
    startDate?: string;
    endDate?: string;
    changedBy?: string;
    limit?: number;
    page?: number;
}

export interface AuditSearchResponse {
    data: StudentWalletAuditRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface WalletDeltaSummaryItem extends WalletDelta {
    tonDau: number;  // Tồn đầu kỳ
    tonCuoi: number; // Tồn cuối kỳ
}

export interface WalletDeltaSummary {
    v0: WalletDeltaSummaryItem;
    v1: WalletDeltaSummaryItem;
    v2: WalletDeltaSummaryItem;
    v3: WalletDeltaSummaryItem;
    v4: WalletDeltaSummaryItem;
    v5: WalletDeltaSummaryItem;
    v6: WalletDeltaSummaryItem;
    v7: WalletDeltaSummaryItem;
}

// Operation labels in Vietnamese
export const OPERATION_LABELS: Record<AuditOperation, string> = {
    INSERT: 'Tạo mới',
    UPDATE: 'Cập nhật',
    DELETE: 'Xóa',
    INCREASE: 'Nạp thêm',
    ROLLCALL: 'Điểm danh',
};

// Operation colors for UI
export const OPERATION_COLORS: Record<AuditOperation, 'success' | 'info' | 'error' | 'warning' | 'primary'> = {
    INSERT: 'success',
    UPDATE: 'info',
    DELETE: 'error',
    INCREASE: 'primary',
    ROLLCALL: 'warning',
};

// API functions
const studentWalletAuditApi = {
    // Search audit logs with filters
    search: async (params?: AuditSearchParams): Promise<AuditSearchResponse> => {
        const { data } = await apiClient.get('/student-wallet-audit/search', { params });
        return data?.data || data;
    },

    // Get audit logs for a specific student
    getByStudentId: async (studentId: string, params?: Omit<AuditSearchParams, 'studentId'>): Promise<AuditSearchResponse> => {
        const { data } = await apiClient.get(`/student-wallet-audit/student/${studentId}`, { params });
        return data?.data || data;
    },

    // Get audit logs for a specific wallet
    getByWalletId: async (walletId: string, params?: Omit<AuditSearchParams, 'walletId'>): Promise<AuditSearchResponse> => {
        const { data } = await apiClient.get(`/student-wallet-audit/wallet/${walletId}`, { params });
        return data?.data || data;
    },

    // Get delta summary for a student
    getStudentSummary: async (studentId: string, params?: { startDate?: string; endDate?: string }): Promise<WalletDeltaSummary> => {
        const { data } = await apiClient.get(`/student-wallet-audit/student/${studentId}/summary`, { params });
        return data?.data || data;
    },
};

// Hooks
export const useSearchAuditLogs = (params?: AuditSearchParams) => {
    return useQuery({
        queryKey: ['student-wallet-audit', 'search', params],
        queryFn: () => studentWalletAuditApi.search(params),
    });
};

export const useGetAuditLogsByStudentId = (studentId: string | undefined, params?: Omit<AuditSearchParams, 'studentId'>) => {
    return useQuery({
        queryKey: ['student-wallet-audit', 'student', studentId, params],
        queryFn: () => studentWalletAuditApi.getByStudentId(studentId!, params),
        enabled: !!studentId,
    });
};

export const useGetAuditLogsByWalletId = (walletId: string | undefined, params?: Omit<AuditSearchParams, 'walletId'>) => {
    return useQuery({
        queryKey: ['student-wallet-audit', 'wallet', walletId, params],
        queryFn: () => studentWalletAuditApi.getByWalletId(walletId!, params),
        enabled: !!walletId,
    });
};

export const useGetStudentAuditSummary = (studentId: string | undefined, params?: { startDate?: string; endDate?: string }) => {
    return useQuery({
        queryKey: ['student-wallet-audit', 'student', studentId, 'summary', params],
        queryFn: () => studentWalletAuditApi.getStudentSummary(studentId!, params),
        enabled: !!studentId,
    });
};

// Helper functions
export const getOperationLabel = (operation: AuditOperation): string => {
    return OPERATION_LABELS[operation] || operation;
};

export const getOperationColor = (operation: AuditOperation) => {
    return OPERATION_COLORS[operation] || 'default';
};

export const formatDelta = (delta: WalletDelta | undefined): string => {
    if (!delta) return '-';
    const sign = delta.ton > 0 ? '+' : '';
    return `${sign}${delta.ton}`;
};

export const hasDeltaChanges = (record: StudentWalletAuditRecord): boolean => {
    return !!(
        record.v0Delta ||
        record.v1Delta ||
        record.v2Delta ||
        record.v3Delta ||
        record.v4Delta ||
        record.v5Delta ||
        record.v6Delta ||
        record.v7Delta
    );
};

