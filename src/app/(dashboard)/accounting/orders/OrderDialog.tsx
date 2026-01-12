'use client'

import React from 'react'
import { format } from 'date-fns'

import {
    Autocomplete,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography
} from '@mui/material'

import {
    BillType,
    PaymentMethod,
    RECEIPT_CATEGORIES,
    PAYMENT_CATEGORIES,
    getCategoriesByBillType,
    type CreateOrderDto,
} from '@/@core/hooks/useOrders'
import { useStudentList } from '@/@core/hooks/useStudent'
import { SingleDatePicker } from '@/components/ui/date-picker'

interface StudentOption {
    id: string
    fullname: string
    email: string
}

interface OrderDialogProps {
    open: boolean
    onClose: () => void
    isEditMode: boolean
    formData: CreateOrderDto
    onFormChange: (field: keyof CreateOrderDto, value: any) => void
    deadlineDate?: Date | undefined
    onDeadlineChange: (date: Date | undefined) => void
    onSubmit: () => void
    isSubmitting: boolean
    dialogSearch: string
    onDialogSearchChange: (value: string) => void
    dialogSelectedStudent: StudentOption | null
    onDialogSelectedStudentChange: (student: StudentOption | null) => void
}

const OrderDialog: React.FC<OrderDialogProps> = ({
    open,
    onClose,
    isEditMode,
    formData,
    onFormChange,
    deadlineDate,
    onDeadlineChange,
    onSubmit,
    isSubmitting,
    dialogSearch,
    onDialogSearchChange,
    dialogSelectedStudent,
    onDialogSelectedStudentChange,
}) => {
    const { data: dialogStudentsData, isLoading: isLoadingDialogStudents } = useStudentList(dialogSearch)

    // Student options for dialog autocomplete
    const dialogStudentOptions = React.useMemo(() => {
        if (!dialogStudentsData?.users) return []
        return dialogStudentsData.users.map(user => ({
            id: user.profile.id,
            fullname: user.profile.fullname,
            email: user.profile.email,
        }))
    }, [dialogStudentsData])

    // Get categories based on bill type
    const categories = React.useMemo(() => {
        return formData.billType === BillType.RECEIPT ? RECEIPT_CATEGORIES : PAYMENT_CATEGORIES
    }, [formData.billType])

    const handleFormChange = (field: keyof CreateOrderDto, value: any) => {
        onFormChange(field, value)

        // Update category name when category ID changes
        if (field === 'billCategoryId') {
            const category = categories.find(c => c.id === value)
            if (category) {
                onFormChange('billCategoryName', category.name)
            }
        }

        // Reset category when bill type changes
        if (field === 'billType') {
            const newCategories = value === BillType.RECEIPT ? RECEIPT_CATEGORIES : PAYMENT_CATEGORIES
            onFormChange('billCategoryId', newCategories[0]?.id || 0)
            onFormChange('billCategoryName', newCategories[0]?.name || '')
        }
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth='sm'
            fullWidth
        >
            <DialogTitle>
                <Box display='flex' alignItems='center' gap={1}>
                    <i className={isEditMode ? 'ri-edit-line' : 'ri-add-line'} />
                    <Typography variant='h6'>
                        {isEditMode ? 'Chỉnh sửa hóa đơn' : 'Tạo hóa đơn mới'}
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box display='flex' flexDirection='column' gap={2.5} mt={1}>
                    <FormControl fullWidth size='small'>
                        <InputLabel>Loại hóa đơn *</InputLabel>
                        <Select
                            value={formData.billType}
                            label='Loại hóa đơn *'
                            onChange={(e) => handleFormChange('billType', e.target.value)}
                        >
                            <MenuItem value={BillType.RECEIPT}>Phiếu thu</MenuItem>
                            <MenuItem value={BillType.PAYMENT}>Phiếu chi</MenuItem>
                        </Select>
                    </FormControl>

                    <Autocomplete
                        size='small'
                        options={dialogStudentOptions}
                        value={dialogSelectedStudent}
                        getOptionLabel={(option) => `${option.fullname} (${option.email})`}
                        isOptionEqualToValue={(option, value) => {
                            if (!value) return false
                            return option.id === value.id
                        }}
                        loading={isLoadingDialogStudents}
                        inputValue={dialogSearch}
                        onInputChange={(_, newInputValue, reason) => {
                            // Cho phép cập nhật khi gõ phím ('input') HOẶC khi chọn giá trị ('reset')
                            if (reason === 'input' || reason === 'reset' || reason === 'clear') {
                                onDialogSearchChange(newInputValue)
                            }
                        }}
                        onChange={(_, value) => {
                            onDialogSelectedStudentChange(value)
                            onFormChange('profileId', value?.id || '')
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label='Chọn học sinh *'
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {isLoadingDialogStudents ? <CircularProgress color='inherit' size={16} /> : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    )
                                }}
                            />
                        )}
                        renderOption={(props, option) => (
                            <Box component='li' {...props} key={option.id}>
                                <Box>
                                    <Typography variant='body2' fontWeight={500}>{option.fullname}</Typography>
                                    <Typography variant='caption' color='text.secondary'>{option.email}</Typography>
                                </Box>
                            </Box>
                        )}
                    />

                    <FormControl fullWidth size='small'>
                        <InputLabel>Danh mục *</InputLabel>
                        <Select
                            value={formData.billCategoryId}
                            label='Danh mục *'
                            onChange={(e) => handleFormChange('billCategoryId', e.target.value)}
                        >
                            {categories.map((cat) => (
                                <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth size='small'>
                        <InputLabel>Hình thức thanh toán</InputLabel>
                        <Select
                            value={formData.paymentMethod || ''}
                            label='Hình thức thanh toán'
                            onChange={(e) => handleFormChange('paymentMethod', e.target.value || undefined)}
                        >
                            <MenuItem value=''>— Không chọn —</MenuItem>
                            <MenuItem value={PaymentMethod.CASH}>Tiền mặt</MenuItem>
                            <MenuItem value={PaymentMethod.DEPOSIT}>Ví đặt cọc</MenuItem>
                            <MenuItem value={PaymentMethod.TRANSFER}>Chuyển khoản</MenuItem>
                            <MenuItem value={PaymentMethod.MPOS}>Quẹt thẻ</MenuItem>
                            <MenuItem value={PaymentMethod.INSTALLMENT}>Trả góp</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        size='small'
                        label='Tổng tiền *'
                        type='number'
                        value={formData.totalAmount}
                        onChange={(e) => handleFormChange('totalAmount', Number(e.target.value))}
                        inputProps={{ min: 0 }}
                    />

                    <TextField
                        fullWidth
                        size='small'
                        label='Số tiền đã trả'
                        type='number'
                        value={formData.paidAmount}
                        onChange={(e) => handleFormChange('paidAmount', Number(e.target.value))}
                        inputProps={{ min: 0 }}
                    />

                    <Box>
                        <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
                            Hạn thanh toán
                        </Typography>
                        <SingleDatePicker
                            date={deadlineDate}
                            onSelect={onDeadlineChange}
                            placeholder='Chọn hạn thanh toán'
                            disabled={{}}
                        />
                    </Box>

                    <TextField
                        fullWidth
                        size='small'
                        label='Mô tả'
                        multiline
                        rows={2}
                        value={formData.description}
                        onChange={(e) => handleFormChange('description', e.target.value)}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} color='inherit'>
                    Hủy
                </Button>
                <Button
                    variant='contained'
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    startIcon={isSubmitting && <CircularProgress size={16} color='inherit' />}
                >
                    {isEditMode ? 'Lưu' : 'Tạo'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default OrderDialog

