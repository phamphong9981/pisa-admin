'use client'

// export const runtime = 'edge';

import React from 'react'
import { format } from 'date-fns'

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { styled } from '@mui/material/styles'

import {
  BillType,
  PaymentMethod,
  useGetOrders,
  useCreateOrder,
  useUpdateOrder,
  useDeleteOrder,
  getBillTypeName,
  formatCurrency,
  type Order,
  type CreateOrderDto,
  type UpdateOrderDto,
} from '@/@core/hooks/useOrders'
import { useStudentList } from '@/@core/hooks/useStudent'
import OrderDialog from './OrderDialog'
import ImportOrdersDialog from './ImportOrdersDialog'

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 700,
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  borderBottom: `3px solid ${theme.palette.primary.dark}`,
  fontSize: '0.85rem',
  padding: '12px 16px',
}))

const OrdersPage = () => {
  // Filters state
  const [page, setPage] = React.useState(1)
  const [limit] = React.useState(10)
  const [billTypeFilter, setBillTypeFilter] = React.useState<BillType | ''>('')
  const [filterSearch, setFilterSearch] = React.useState('')
  const [dialogSearch, setDialogSearch] = React.useState('')
  const [selectedProfileId, setSelectedProfileId] = React.useState<string | undefined>(undefined)
  const [dialogSelectedStudent, setDialogSelectedStudent] = React.useState<{ id: string; fullname: string; email: string } | null>(null)
  const [cachedFilterOptions, setCachedFilterOptions] = React.useState<Array<{ id: string; fullname: string; email: string }>>([])

  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = React.useState(false)
  const [openEditDialog, setOpenEditDialog] = React.useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false)
  const [openImportDialog, setOpenImportDialog] = React.useState(false)
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null)

  // Notification state
  const [notification, setNotification] = React.useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info'
  }>({
    open: false,
    message: '',
    severity: 'info'
  })

  // Form state
  const [formData, setFormData] = React.useState<CreateOrderDto>({
    billType: BillType.RECEIPT,
    profileId: '',
    billCategoryId: 79,
    billCategoryName: 'Học phí',
    paymentMethod: PaymentMethod.CASH,
    description: '',
    totalAmount: 0,
    paidAmount: 0,
    deadline: undefined,
  })
  const [deadlineDate, setDeadlineDate] = React.useState<Date | undefined>(undefined)

  // API hooks
  const { data: ordersData, isLoading: isLoadingOrders, refetch } = useGetOrders({
    page,
    limit,
    billType: billTypeFilter !== '' ? billTypeFilter : undefined,
    profileId: selectedProfileId,
  })

  // Separate hooks for filter
  const { data: filterStudentsData, isLoading: isLoadingFilterStudents } = useStudentList(filterSearch)
  const createOrderMutation = useCreateOrder()
  const updateOrderMutation = useUpdateOrder()
  const deleteOrderMutation = useDeleteOrder()

  // 1) Tính options từ API (không setState ở đây)
  const computedFilterOptions = React.useMemo(() => {
    if (!filterStudentsData?.users) return []
    return filterStudentsData.users.map(user => ({
      id: user.profile.id,
      fullname: user.profile.fullname,
      email: user.profile.email,
    }))
  }, [filterStudentsData])

  // 2) Cache options bằng useEffect (side-effect đúng chỗ)
  React.useEffect(() => {
    // chỉ cache khi có data mới
    if (computedFilterOptions.length > 0) {
      setCachedFilterOptions(computedFilterOptions)
    }
  }, [computedFilterOptions])

  // 3) Chọn options dùng để render
  const filterStudentOptions =
    (openCreateDialog || openEditDialog) ? cachedFilterOptions : computedFilterOptions

  // Handlers
  const handleOpenCreateDialog = () => {
    setFormData({
      billType: BillType.RECEIPT,
      profileId: '',
      billCategoryId: 79,
      billCategoryName: 'Học phí',
      paymentMethod: PaymentMethod.CASH,
      description: '',
      totalAmount: 0,
      paidAmount: 0,
      deadline: undefined,
    })
    setDeadlineDate(undefined)
    setDialogSearch('')
    setDialogSelectedStudent(null)
    setOpenCreateDialog(true)
  }

  const handleOpenEditDialog = (order: Order) => {
    setSelectedOrder(order)
    setFormData({
      billType: order.billType,
      profileId: order.profileId,
      billCategoryId: order.billCategoryId,
      billCategoryName: order.billCategoryName,
      paymentMethod: order.paymentMethod,
      description: order.description || '',
      totalAmount: order.totalAmount,
      paidAmount: order.paidAmount,
      deadline: order.deadline,
    })
    setDeadlineDate(order.deadline ? new Date(order.deadline) : undefined)
    setDialogSearch('')
    // Set selected student if profile info is available
    if (order.profile) {
      setDialogSelectedStudent({
        id: order.profile.id,
        fullname: order.profile.fullname,
        email: order.profile.email,
      })
    } else {
      setDialogSelectedStudent(null)
    }
    setOpenEditDialog(true)
  }

  const handleOpenDeleteDialog = (order: Order) => {
    setSelectedOrder(order)
    setOpenDeleteDialog(true)
  }

  const handleCloseDialogs = () => {
    setOpenCreateDialog(false)
    setOpenEditDialog(false)
    setOpenDeleteDialog(false)
    setSelectedOrder(null)
    setDialogSearch('')
    setDialogSelectedStudent(null)
  }

  const handleFormChange = (field: keyof CreateOrderDto, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDeadlineChange = (date: Date | undefined) => {
    setDeadlineDate(date)
    setFormData(prev => ({
      ...prev,
      deadline: date ? format(date, 'yyyy-MM-dd') : undefined
    }))
  }

  const handleCreateOrder = async () => {
    if (!formData.profileId) {
      setNotification({
        open: true,
        message: 'Vui lòng chọn học sinh',
        severity: 'error'
      })
      return
    }

    try {
      await createOrderMutation.mutateAsync(formData)
      setNotification({
        open: true,
        message: 'Tạo hóa đơn thành công!',
        severity: 'success'
      })
      handleCloseDialogs()
      refetch()
    } catch (error) {
      console.error('Create order error:', error)
      setNotification({
        open: true,
        message: 'Có lỗi xảy ra khi tạo hóa đơn',
        severity: 'error'
      })
    }
  }

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return

    try {
      const updateDto: UpdateOrderDto = {
        billType: formData.billType,
        profileId: formData.profileId,
        billCategoryId: formData.billCategoryId,
        billCategoryName: formData.billCategoryName,
        paymentMethod: formData.paymentMethod,
        description: formData.description,
        totalAmount: formData.totalAmount,
        paidAmount: formData.paidAmount,
        deadline: formData.deadline,
      }

      await updateOrderMutation.mutateAsync({ id: selectedOrder.id, dto: updateDto })
      setNotification({
        open: true,
        message: 'Cập nhật hóa đơn thành công!',
        severity: 'success'
      })
      handleCloseDialogs()
      refetch()
    } catch (error) {
      console.error('Update order error:', error)
      setNotification({
        open: true,
        message: 'Có lỗi xảy ra khi cập nhật hóa đơn',
        severity: 'error'
      })
    }
  }

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return

    try {
      await deleteOrderMutation.mutateAsync(selectedOrder.id)
      setNotification({
        open: true,
        message: 'Xóa hóa đơn thành công!',
        severity: 'success'
      })
      handleCloseDialogs()
      refetch()
    } catch (error) {
      console.error('Delete order error:', error)
      setNotification({
        open: true,
        message: 'Có lỗi xảy ra khi xóa hóa đơn',
        severity: 'error'
      })
    }
  }

  const getStatusChip = (order: Order) => {
    const remaining = order.totalAmount - order.paidAmount
    if (remaining <= 0) {
      return <Chip label='Đã thanh toán' color='success' size='small' />
    }
    if (order.paidAmount > 0) {
      return <Chip label='Thanh toán một phần' color='warning' size='small' />
    }
    return <Chip label='Chưa thanh toán' color='error' size='small' />
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h5' fontWeight={700}>Quản lý hóa đơn</Typography>
        <Typography variant='body2' color='text.secondary'>
          Quản lý phiếu thu, phiếu chi của học sinh
        </Typography>
      </Grid>

      {/* Notification */}
      {notification.open && (
        <Grid item xs={12}>
          <Alert
            severity={notification.severity}
            onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          >
            {notification.message}
          </Alert>
        </Grid>
      )}

      {/* Filters & Actions */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display='flex' gap={2} flexWrap='wrap' alignItems='center'>
              <FormControl size='small' sx={{ minWidth: 150 }}>
                <InputLabel>Loại hóa đơn</InputLabel>
                <Select
                  value={billTypeFilter}
                  label='Loại hóa đơn'
                  onChange={(e) => {
                    setBillTypeFilter(e.target.value as BillType | '')
                    setPage(1)
                  }}
                >
                  <MenuItem value=''>Tất cả</MenuItem>
                  <MenuItem value={BillType.RECEIPT}>Phiếu thu</MenuItem>
                  <MenuItem value={BillType.PAYMENT}>Phiếu chi</MenuItem>
                </Select>
              </FormControl>

              <Autocomplete
                size='small'
                options={filterStudentOptions}
                sx={{ minWidth: 280 }}
                getOptionLabel={(option) => `${option.fullname} (${option.email})`}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                loading={isLoadingFilterStudents}
                inputValue={filterSearch}
                onInputChange={(_, value, reason) => {
                  if (reason === 'input') setFilterSearch(value)
                }}
                onChange={(_, value) => {
                  setSelectedProfileId(value?.id)
                  setPage(1)
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label='Lọc theo học sinh'
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isLoadingFilterStudents ? <CircularProgress color='inherit' size={16} /> : null}
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

              <Box flex={1} />

              <Button
                variant='outlined'
                color='primary'
                startIcon={<i className='ri-file-upload-line' />}
                onClick={() => setOpenImportDialog(true)}
              >
                Import CSV/Excel
              </Button>
              <Button
                variant='contained'
                color='primary'
                startIcon={<i className='ri-add-line' />}
                onClick={handleOpenCreateDialog}
              >
                Tạo hóa đơn
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Orders Table */}
      <Grid item xs={12}>
        <Card>
          <CardHeader title={`Danh sách hóa đơn (${ordersData?.total || 0})`} />
          <CardContent>
            {isLoadingOrders ? (
              <Box display='flex' justifyContent='center' p={4}>
                <CircularProgress />
              </Box>
            ) : ordersData?.data?.length === 0 ? (
              <Box textAlign='center' p={4}>
                <Typography color='text.secondary'>Không có hóa đơn nào</Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <StyledTableCell>Loại</StyledTableCell>
                        <StyledTableCell>Học sinh</StyledTableCell>
                        <StyledTableCell>Danh mục</StyledTableCell>
                        <StyledTableCell align='right'>Tổng tiền</StyledTableCell>
                        <StyledTableCell align='right'>Đã trả</StyledTableCell>
                        <StyledTableCell>Trạng thái</StyledTableCell>
                        <StyledTableCell>Hạn TT</StyledTableCell>
                        <StyledTableCell>Ngày tạo</StyledTableCell>
                        <StyledTableCell align='center'>Thao tác</StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ordersData?.data?.map((order) => (
                        <TableRow key={order.id} hover>
                          <TableCell>
                            <Chip
                              label={getBillTypeName(order.billType)}
                              color={order.billType === BillType.RECEIPT ? 'success' : 'error'}
                              size='small'
                              variant='outlined'
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2' fontWeight={500}>
                              {order.profile?.fullname || '—'}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {order.profile?.email || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2'>{order.billCategoryName}</Typography>
                          </TableCell>
                          <TableCell align='right'>
                            <Typography variant='body2' fontWeight={600}>
                              {formatCurrency(order.totalAmount)}
                            </Typography>
                          </TableCell>
                          <TableCell align='right'>
                            <Typography variant='body2'>
                              {formatCurrency(order.paidAmount)}
                            </Typography>
                          </TableCell>
                          <TableCell>{getStatusChip(order)}</TableCell>
                          <TableCell>
                            {order.deadline
                              ? format(new Date(order.deadline), 'dd/MM/yyyy')
                              : '—'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
                          </TableCell>
                          <TableCell align='center'>
                            <Tooltip title='Sửa'>
                              <IconButton
                                size='small'
                                color='primary'
                                onClick={() => handleOpenEditDialog(order)}
                              >
                                <i className='ri-edit-line' />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Xóa'>
                              <IconButton
                                size='small'
                                color='error'
                                onClick={() => handleOpenDeleteDialog(order)}
                              >
                                <i className='ri-delete-bin-line' />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                {ordersData && ordersData.total > limit && (
                  <Box display='flex' justifyContent='center' mt={3}>
                    <Pagination
                      count={Math.ceil(ordersData.total / limit)}
                      page={page}
                      onChange={(_, newPage) => setPage(newPage)}
                      color='primary'
                    />
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Create/Edit Dialog */}
      <OrderDialog
        open={openCreateDialog || openEditDialog}
        onClose={handleCloseDialogs}
        isEditMode={openEditDialog}
        formData={formData}
        onFormChange={handleFormChange}
        deadlineDate={deadlineDate}
        onDeadlineChange={handleDeadlineChange}
        onSubmit={openCreateDialog ? handleCreateOrder : handleUpdateOrder}
        isSubmitting={createOrderMutation.isPending || updateOrderMutation.isPending}
        dialogSearch={dialogSearch}
        onDialogSearchChange={setDialogSearch}
        dialogSelectedStudent={dialogSelectedStudent}
        onDialogSelectedStudentChange={setDialogSelectedStudent}
      />

      {/* Import Orders Dialog */}
      <ImportOrdersDialog
        open={openImportDialog}
        onClose={() => setOpenImportDialog(false)}
        onSuccess={() => {
          setOpenImportDialog(false)
          refetch()
          setNotification({
            open: true,
            message: 'Import hóa đơn thành công!',
            severity: 'success'
          })
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDialogs} maxWidth='xs' fullWidth>
        <DialogTitle>
          <Box display='flex' alignItems='center' gap={1}>
            <i className='ri-error-warning-line' style={{ color: '#f44336' }} />
            <Typography variant='h6'>Xác nhận xóa</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa hóa đơn này? Hành động này không thể hoàn tác.
          </Typography>
          {selectedOrder && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant='body2'>
                <strong>Danh mục:</strong> {selectedOrder.billCategoryName}
              </Typography>
              <Typography variant='body2'>
                <strong>Số tiền:</strong> {formatCurrency(selectedOrder.totalAmount)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialogs} color='inherit'>
            Hủy
          </Button>
          <Button
            variant='contained'
            color='error'
            onClick={handleDeleteOrder}
            disabled={deleteOrderMutation.isPending}
            startIcon={
              deleteOrderMutation.isPending && <CircularProgress size={16} color='inherit' />
            }
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default OrdersPage

