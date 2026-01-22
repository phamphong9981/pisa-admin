import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from './apiClient';

// Enums
export enum BillType {
    PAYMENT = 0, // Phiếu chi
    RECEIPT = 1, // Phiếu thu
}

export enum PaymentMethod {
    CASH = 'cash',
    DEPOSIT = 'deposit',
    TRANSFER = 'transfer',
    MPOS = 'mpos',
    INSTALLMENT = 'installment',
}

export enum ReportFormat {
    EXCEL = 'excel',
    PDF = 'pdf',
}

// Bill Categories
export const RECEIPT_CATEGORIES = [
    { id: 325, name: 'Các khoản giảm trừ doanh thu' },
    { id: 314, name: 'Doanh thu bán hàng và cung cấp dịch vụ' },
    { id: 79, name: 'Học phí' },
    { id: 83, name: 'Kho' },
    { id: 84, name: 'Phí chuyển lớp' },
    { id: 126, name: 'Ví thành viên' },
    { id: 522, name: 'Hoàn tiền' },
    { id: 523, name: 'Hoàn tiền học phí' },
    { id: 524, name: 'Hoàn tiền đặt cọc' },
    { id: 509, name: 'Hợp đồng thuê nhà' },
    { id: 512, name: 'Dịch vụ' },
    { id: 510, name: 'Tiền thuê nhà' },
    { id: 511, name: 'Đặt cọc thuê nhà' },
    { id: 318, name: 'Thu khác (Thu phát sinh)' },
    { id: 80, name: 'Lệ phí thi IELTS' },
    { id: 81, name: 'Giáo trình tài liệu' },
    { id: 1332, name: 'Tiền thi thử - Mock test' },
    { id: 1188, name: 'Tiền ký túc xá' },
    { id: 711, name: 'Tiền ăn (ăn cơm, ăn vặt...)' },
    { id: 1185, name: 'Phí app phát âm ELSA' },
    { id: 464, name: 'Giảm giá hàng bán' },
    { id: 459, name: 'Hàng bán bị trả lại' },
    { id: 463, name: 'Khuyến mại' },
    { id: 461, name: 'Trả lại học phí' },
    { id: 462, name: 'Trả lại tiền cọc' },
    { id: 326, name: 'Chi khác (Chi phát sinh)' },
    { id: 78, name: 'Học phí tháng trước nộp thừa' },
    { id: 1187, name: 'Lệ phí thi IELTS được hoàn' },
    { id: 1333, name: 'Chi phí đi thi IELTS' },
    { id: 1186, name: 'Học phí tháng trước chưa hoàn thành' },
];

export const PAYMENT_CATEGORIES = [
    { id: 464, name: 'Giảm giá hàng bán' },
    { id: 459, name: 'Hàng bán bị trả lại' },
    { id: 463, name: 'Khuyến mại' },
    { id: 461, name: 'Trả lại học phí' },
    { id: 462, name: 'Trả lại tiền cọc' },
    { id: 326, name: 'Chi khác (Chi phát sinh)' },
    { id: 78, name: 'Học phí tháng trước nộp thừa' },
    { id: 1187, name: 'Lệ phí thi IELTS được hoàn' },
    { id: 1333, name: 'Chi phí đi thi IELTS' },
    { id: 1186, name: 'Học phí tháng trước chưa hoàn thành' },
    { id: 325, name: 'Các khoản giảm trừ doanh thu' },
    { id: 314, name: 'Doanh thu bán hàng và cung cấp dịch vụ' },
    { id: 79, name: 'Học phí' },
    { id: 83, name: 'Kho' },
    { id: 84, name: 'Phí chuyển lớp' },
    { id: 126, name: 'Ví thành viên' },
    { id: 522, name: 'Hoàn tiền' },
    { id: 523, name: 'Hoàn tiền học phí' },
    { id: 524, name: 'Hoàn tiền đặt cọc' },
    { id: 509, name: 'Hợp đồng thuê nhà' },
    { id: 512, name: 'Dịch vụ' },
    { id: 510, name: 'Tiền thuê nhà' },
    { id: 511, name: 'Đặt cọc thuê nhà' },
    { id: 318, name: 'Thu khác (Thu phát sinh)' },
    { id: 80, name: 'Lệ phí thi IELTS' },
    { id: 81, name: 'Giáo trình tài liệu' },
    { id: 1332, name: 'Tiền thi thử - Mock test' },
    { id: 1188, name: 'Tiền ký túc xá' },
    { id: 711, name: 'Tiền ăn (ăn cơm, ăn vặt...)' },
    { id: 1185, name: 'Phí app phát âm ELSA' },
];

// Interfaces
export interface Order {
    id: string;
    billType: BillType;
    profileId: string;
    billCategoryId: number;
    billCategoryName: string;
    paymentMethod?: PaymentMethod;
    description?: string;
    totalAmount: number;
    paidAmount: number;
    deadline?: string;
    createdAt: string;
    updatedAt: string;
    profile?: {
        id: string;
        fullname: string;
        email: string;
    };
}

export interface CreateOrderDto {
    billType: BillType;
    profileId: string;
    billCategoryId: number;
    billCategoryName: string;
    paymentMethod?: PaymentMethod;
    description?: string;
    totalAmount: number;
    paidAmount?: number;
    deadline?: string;
}

export interface UpdateOrderDto {
    billType?: BillType;
    profileId?: string;
    billCategoryId?: number;
    billCategoryName?: string;
    paymentMethod?: PaymentMethod;
    description?: string;
    totalAmount?: number;
    paidAmount?: number;
    deadline?: string;
}

export interface BulkCreateOrdersDto {
    orders: CreateOrderDto[];
}

export interface BulkCreateOrdersResponse {
    created: number;
    failed: number;
    errors: Array<{ index: number; error: string }>;
    orders: Order[];
}

export interface OrdersListResponse {
    data: Order[];
    total: number;
    page: number;
    limit: number;
}

export interface OrdersQueryParams {
    profileId?: string;
    billType?: BillType;
    billCategoryId?: number;
    page?: number;
    limit?: number;
}

export interface ExportFeeReceiptDto {
    profileId: string;
    month: number;
    year: number;
    regionId: number;
    format?: ReportFormat;
}

// API functions
const ordersApi = {
    getOrders: async (params: OrdersQueryParams): Promise<OrdersListResponse> => {
        const { data } = await apiClient.get('/orders', { params });
        return data?.data;
    },

    getOrder: async (id: string): Promise<Order> => {
        const { data } = await apiClient.get(`/orders/${id}`);
        return data?.data;
    },

    createOrder: async (dto: CreateOrderDto): Promise<Order> => {
        const { data } = await apiClient.post('/orders', dto);
        return data?.data;
    },

    createOrdersBulk: async (dto: BulkCreateOrdersDto): Promise<BulkCreateOrdersResponse> => {
        const { data } = await apiClient.post('/orders/bulk', dto);
        return data?.data;
    },

    updateOrder: async ({ id, dto }: { id: string; dto: UpdateOrderDto }): Promise<Order> => {
        const { data } = await apiClient.put(`/orders/${id}`, dto);
        return data?.data;
    },

    deleteOrder: async (id: string): Promise<{ message: string }> => {
        const { data } = await apiClient.delete(`/orders/${id}`);
        return data?.data;
    },

    exportFeeReceipt: async (dto: ExportFeeReceiptDto): Promise<Blob> => {
        const response = await apiClient.post('/orders/export/fee-receipt', dto, {
            responseType: 'blob'
        });
        return response.data;
    },
};

// Hooks
export const useGetOrders = (params: OrdersQueryParams = {}) => {
    return useQuery({
        queryKey: ['orders', params],
        queryFn: () => ordersApi.getOrders(params),
    });
};

export const useGetOrder = (id: string | undefined) => {
    return useQuery({
        queryKey: ['order', id],
        queryFn: () => ordersApi.getOrder(id!),
        enabled: !!id,
    });
};

export const useCreateOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ordersApi.createOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });
};

export const useCreateOrdersBulk = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ordersApi.createOrdersBulk,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });
};

export const useUpdateOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ordersApi.updateOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });
};

export const useDeleteOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ordersApi.deleteOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });
};

export const useExportFeeReceipt = () => {
    return useMutation({
        mutationFn: ordersApi.exportFeeReceipt,
        onError: (error) => {
            console.error('Error exporting fee receipt:', error);
        },
    });
};

// Helper functions
export const getBillTypeName = (billType: BillType): string => {
    return billType === BillType.RECEIPT ? 'Phiếu thu' : 'Phiếu chi';
};

export const getPaymentMethodName = (method?: PaymentMethod): string => {
    if (!method) return '—';
    const names: Record<PaymentMethod, string> = {
        [PaymentMethod.CASH]: 'Tiền mặt',
        [PaymentMethod.DEPOSIT]: 'Ví đặt cọc',
        [PaymentMethod.TRANSFER]: 'Chuyển khoản',
        [PaymentMethod.MPOS]: 'Quẹt thẻ',
        [PaymentMethod.INSTALLMENT]: 'Trả góp',
    };
    return names[method] || method;
};

export const getCategoriesByBillType = () => {
    return [...RECEIPT_CATEGORIES, ...PAYMENT_CATEGORIES];
};

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
};

