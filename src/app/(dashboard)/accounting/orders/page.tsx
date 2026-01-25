'use client'

export const runtime = 'edge';

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
  ReportFormat,
  useGetOrders,
  useCreateOrder,
  useUpdateOrder,
  useDeleteOrder,
  useExportFeeReceipt,
  getBillTypeName,
  formatCurrency,
  type Order,
  type CreateOrderDto,
  type UpdateOrderDto,
  type ExportFeeReceiptDto,
} from '@/@core/hooks/useOrders'
import { useStudentList } from '@/@core/hooks/useStudent'
import { RegionId, RegionLabel } from '@/@core/hooks/useCourse'
import OrderDialog from './OrderDialog'
import ImportOrdersDialog from './ImportOrdersDialog'
import ProfileSearchDialog from './ProfileSearchDialog'

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 700,
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  borderBottom: `3px solid ${theme.palette.primary.dark}`,
  fontSize: '0.85rem',
  padding: '12px 16px',
}))

// File types for showSaveFilePicker
interface FileType {
  description: string
  accept: Record<string, string[]>
}

// Helper function to save file with dialog (File System Access API)
const saveFileWithDialog = async (
  blob: Blob,
  suggestedName: string,
  fileTypes: FileType[]
): Promise<boolean> => {
  // Check if File System Access API is supported
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName,
        types: fileTypes,
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return true
    } catch (err: any) {
      // User cancelled the dialog
      if (err.name === 'AbortError') {
        return false
      }
      // Fall through to legacy download if there's an error
      console.warn('showSaveFilePicker failed, falling back to legacy download:', err)
    }
  }

  // Fallback: legacy download method
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = suggestedName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
  return true
}

// Get file types for different formats
const getFileTypes = (ext: string, isZip: boolean): FileType[] => {
  if (isZip) {
    return [{ description: 'ZIP Archive', accept: { 'application/zip': ['.zip'] } }]
  }
  if (ext === 'pdf') {
    return [{ description: 'PDF Document', accept: { 'application/pdf': ['.pdf'] } }]
  }
  return [{ description: 'Excel Spreadsheet', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }]
}

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
  const [openExportDialog, setOpenExportDialog] = React.useState(false)
  const [openProfileSearchDialog, setOpenProfileSearchDialog] = React.useState(false)
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
  const exportFeeReceiptMutation = useExportFeeReceipt()

  // Export dialog state
  const [exportSearch, setExportSearch] = React.useState('')
  const [exportSelectedStudents, setExportSelectedStudents] = React.useState<Array<{ id: string; fullname: string; email: string }>>([])
  const [exportMonth, setExportMonth] = React.useState<number>(new Date().getMonth() + 1)
  const [exportYear, setExportYear] = React.useState<number>(new Date().getFullYear())
  const [exportRegionId, setExportRegionId] = React.useState<number>(RegionId.HALONG)
  const [exportFormat, setExportFormat] = React.useState<ReportFormat>(ReportFormat.EXCEL)
  const { data: exportStudentsData, isLoading: isLoadingExportStudents } = useStudentList(exportSearch)

  // File Preview Dialog states
  const [previewDialog, setPreviewDialog] = React.useState<{
    open: boolean
    blob: Blob | null
    filename: string
    fileType: 'pdf' | 'xlsx' | 'zip'
    previewUrl: string | null
  }>({
    open: false,
    blob: null,
    filename: '',
    fileType: 'xlsx',
    previewUrl: null
  })

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
    setOpenExportDialog(false)
    setSelectedOrder(null)
    setDialogSearch('')
    setDialogSelectedStudent(null)
    setExportSearch('')
    setExportSelectedStudents([])
    setExportRegionId(RegionId.HALONG)
    setExportFormat(ReportFormat.EXCEL)
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

  const handleExportFeeReceipt = async () => {
    if (exportSelectedStudents.length === 0) {
      setNotification({
        open: true,
        message: 'Vui lòng chọn ít nhất một học sinh',
        severity: 'error'
      })
      return
    }

    if (exportMonth < 1 || exportMonth > 12) {
      setNotification({
        open: true,
        message: 'Tháng phải từ 1 đến 12',
        severity: 'error'
      })
      return
    }

    if (exportYear < 2000) {
      setNotification({
        open: true,
        message: 'Năm phải từ 2000 trở lên',
        severity: 'error'
      })
      return
    }

    if (!exportRegionId || exportRegionId < 1) {
      setNotification({
        open: true,
        message: 'Vui lòng chọn khu vực',
        severity: 'error'
      })
      return
    }

    try {
      const dto: ExportFeeReceiptDto = {
        profileIds: exportSelectedStudents.map(s => s.id),
        month: exportMonth,
        year: exportYear,
        regionId: exportRegionId,
        format: exportFormat,
      }

      const blob = await exportFeeReceiptMutation.mutateAsync(dto)

      // Create filename with appropriate extension
      // If multiple students, it's always a ZIP file from backend
      const isMultiple = exportSelectedStudents.length > 1
      const fileExtension = isMultiple ? 'zip' : (exportFormat === ReportFormat.PDF ? 'pdf' : 'xlsx')
      const filename = isMultiple
        ? `fee_receipts_${exportMonth}_${exportYear}.zip`
        : `fee_receipt_${exportMonth}_${exportYear}.${fileExtension}`

      // Open preview dialog instead of saving directly
      openPreviewDialog(blob, filename, fileExtension as 'pdf' | 'xlsx' | 'zip')
      handleCloseDialogs()
    } catch (error) {
      console.error('Export fee receipt error:', error)
      setNotification({
        open: true,
        message: 'Có lỗi xảy ra khi xuất file',
        severity: 'error'
      })
    }
  }

  // Export dialog student options
  const exportStudentOptions = React.useMemo(() => {
    if (!exportStudentsData?.users) return []
    return exportStudentsData.users.map(user => ({
      id: user.profile.id,
      fullname: user.profile.fullname,
      email: user.profile.email,
    }))
  }, [exportStudentsData])

  // Open file preview dialog
  const openPreviewDialog = (blob: Blob, filename: string, fileType: 'pdf' | 'xlsx' | 'zip') => {
    // Create preview URL for PDF files
    const previewUrl = fileType === 'pdf' ? window.URL.createObjectURL(blob) : null

    setPreviewDialog({
      open: true,
      blob,
      filename,
      fileType,
      previewUrl
    })
  }

  // Close preview dialog and cleanup
  const closePreviewDialog = () => {
    if (previewDialog.previewUrl) {
      window.URL.revokeObjectURL(previewDialog.previewUrl)
    }
    setPreviewDialog({
      open: false,
      blob: null,
      filename: '',
      fileType: 'xlsx',
      previewUrl: null
    })
  }

  // Handle save file from preview
  const handleSaveFromPreview = async () => {
    if (!previewDialog.blob) return

    const isZip = previewDialog.fileType === 'zip'
    const saved = await saveFileWithDialog(
      previewDialog.blob,
      previewDialog.filename,
      getFileTypes(previewDialog.fileType, isZip)
    )

    if (saved) {
      setNotification({
        open: true,
        message: 'Đã lưu file thành công!',
        severity: 'success'
      })
      closePreviewDialog()
    }
  }

  // Open file in new tab (for PDF)
  const handleOpenInNewTab = () => {
    if (previewDialog.blob) {
      const url = window.URL.createObjectURL(previewDialog.blob)
      window.open(url, '_blank')
    }
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get file icon based on type
  const getFileIcon = (fileType: 'pdf' | 'xlsx' | 'zip') => {
    switch (fileType) {
      case 'pdf':
        return { icon: 'ri-file-pdf-2-line', color: '#f40f02' }
      case 'xlsx':
        return { icon: 'ri-file-excel-2-line', color: '#217346' }
      case 'zip':
        return { icon: 'ri-folder-zip-line', color: '#ffc107' }
    }
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
                color='info'
                startIcon={<i className='ri-user-search-line' />}
                onClick={() => setOpenProfileSearchDialog(true)}
              >
                Tìm học sinh
              </Button>
              <Button
                variant='outlined'
                color='primary'
                startIcon={<i className='ri-file-upload-line' />}
                onClick={() => setOpenImportDialog(true)}
              >
                Import CSV/Excel
              </Button>
              <Button
                variant='outlined'
                color='success'
                startIcon={<i className='ri-file-download-line' />}
                onClick={() => setOpenExportDialog(true)}
              >
                Xuất phiếu thu
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

      {/* Export Fee Receipt Dialog */}
      <Dialog open={openExportDialog} onClose={handleCloseDialogs} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Box display='flex' alignItems='center' gap={1}>
            <i className='ri-file-download-line' style={{ color: '#4caf50' }} />
            <Typography variant='h6'>Xuất phiếu thu học phí</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box display='flex' flexDirection='column' gap={3} sx={{ mt: 2 }}>
            <Autocomplete
              multiple
              size='small'
              options={exportStudentOptions}
              getOptionLabel={(option) => `${option.fullname} (${option.email})`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              loading={isLoadingExportStudents}
              inputValue={exportSearch}
              onInputChange={(_, value, reason) => {
                if (reason === 'input') {
                  setExportSearch(value)
                }
              }}
              value={exportSelectedStudents}
              onChange={(_, value) => {
                setExportSelectedStudents(value as Array<{ id: string; fullname: string; email: string }>)
                setExportSearch('')
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label='Chọn học sinh'
                  required
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isLoadingExportStudents ? <CircularProgress color='inherit' size={16} /> : null}
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

            <Box display='flex' gap={2}>
              <FormControl size='small' fullWidth>
                <InputLabel>Tháng</InputLabel>
                <Select
                  value={exportMonth}
                  label='Tháng'
                  onChange={(e) => setExportMonth(Number(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <MenuItem key={month} value={month}>
                      Tháng {month}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size='small' fullWidth>
                <InputLabel>Năm</InputLabel>
                <Select
                  value={exportYear}
                  label='Năm'
                  onChange={(e) => setExportYear(Number(e.target.value))}
                >
                  {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <FormControl size='small' fullWidth>
              <InputLabel>Khu vực</InputLabel>
              <Select
                value={exportRegionId}
                label='Khu vực'
                onChange={(e) => setExportRegionId(Number(e.target.value))}
              >
                {Object.entries(RegionLabel).map(([key, label]) => (
                  <MenuItem key={key} value={Number(key)}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size='small' fullWidth>
              <InputLabel>Định dạng</InputLabel>
              <Select
                value={exportFormat}
                label='Định dạng'
                onChange={(e) => setExportFormat(e.target.value as ReportFormat)}
              >
                <MenuItem value={ReportFormat.EXCEL}>Excel (.xlsx)</MenuItem>
                <MenuItem value={ReportFormat.PDF}>PDF (.pdf)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialogs} color='inherit'>
            Hủy
          </Button>
          <Button
            variant='contained'
            color='success'
            onClick={handleExportFeeReceipt}
            disabled={exportFeeReceiptMutation.isPending}
            startIcon={
              exportFeeReceiptMutation.isPending && <CircularProgress size={16} color='inherit' />
            }
          >
            Xuất phiếu thu
          </Button>
        </DialogActions>
      </Dialog>

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

      {/* File Preview Dialog */}
      <Dialog
        open={previewDialog.open}
        onClose={closePreviewDialog}
        maxWidth='lg'
        fullWidth
        PaperProps={{
          sx: { minHeight: previewDialog.fileType === 'pdf' ? '80vh' : 'auto' }
        }}
      >
        <DialogTitle>
          <Box display='flex' alignItems='center' justifyContent='space-between'>
            <Box display='flex' alignItems='center' gap={1}>
              <i
                className={getFileIcon(previewDialog.fileType).icon}
                style={{ fontSize: 28, color: getFileIcon(previewDialog.fileType).color }}
              />
              <Box>
                <Typography variant='h6'>Xem trước file</Typography>
                <Typography variant='caption' color='text.secondary'>
                  Xem trước và quyết định lưu file
                </Typography>
              </Box>
            </Box>
            <Button
              variant='text'
              color='inherit'
              onClick={closePreviewDialog}
              sx={{ minWidth: 'auto', p: 1 }}
            >
              <i className='ri-close-line' style={{ fontSize: 24 }} />
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {/* File Info */}
          <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant='caption' color='text.secondary'>Tên file</Typography>
                <Typography variant='body2' fontWeight={600}>{previewDialog.filename}</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant='caption' color='text.secondary'>Loại file</Typography>
                <Typography variant='body2' fontWeight={600}>
                  {previewDialog.fileType === 'pdf' ? 'PDF Document' :
                    previewDialog.fileType === 'xlsx' ? 'Excel Spreadsheet' : 'ZIP Archive'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant='caption' color='text.secondary'>Kích thước</Typography>
                <Typography variant='body2' fontWeight={600}>
                  {previewDialog.blob ? formatFileSize(previewDialog.blob.size) : '—'}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Preview Content */}
          {previewDialog.fileType === 'pdf' && previewDialog.previewUrl ? (
            <Box sx={{ height: '60vh', border: '1px solid #e0e0e0', borderRadius: 1, overflow: 'hidden' }}>
              <iframe
                src={previewDialog.previewUrl}
                width='100%'
                height='100%'
                style={{ border: 'none' }}
                title='PDF Preview'
              />
            </Box>
          ) : (
            <Box
              sx={{
                p: 4,
                textAlign: 'center',
                backgroundColor: '#fafafa',
                borderRadius: 2,
                border: '2px dashed #e0e0e0'
              }}
            >
              <i
                className={getFileIcon(previewDialog.fileType).icon}
                style={{ fontSize: 64, color: getFileIcon(previewDialog.fileType).color, opacity: 0.7 }}
              />
              <Typography variant='h6' sx={{ mt: 2 }}>
                {previewDialog.fileType === 'xlsx' ? 'File Excel' : 'File ZIP'}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                {previewDialog.fileType === 'xlsx'
                  ? 'Không thể xem trước file Excel trong trình duyệt. Vui lòng lưu file để mở bằng Microsoft Excel hoặc ứng dụng tương tự.'
                  : 'Không thể xem trước file ZIP trong trình duyệt. Vui lòng lưu file để giải nén và xem nội dung.'}
              </Typography>
              <Typography variant='caption' color='text.secondary' sx={{ mt: 2, display: 'block' }}>
                <i className='ri-information-line' style={{ marginRight: 4 }} />
                File đã sẵn sàng để tải xuống
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={closePreviewDialog} color='inherit'>
            <i className='ri-close-line' style={{ marginRight: 4 }} />
            Hủy
          </Button>
          {previewDialog.fileType === 'pdf' && (
            <Button
              variant='outlined'
              onClick={handleOpenInNewTab}
              startIcon={<i className='ri-external-link-line' />}
            >
              Mở trong tab mới
            </Button>
          )}
          <Button
            variant='contained'
            color='primary'
            onClick={handleSaveFromPreview}
            startIcon={<i className='ri-download-2-line' />}
          >
            Lưu file
          </Button>
        </DialogActions>
      </Dialog>

      {/* Profile Search Dialog */}
      <ProfileSearchDialog
        open={openProfileSearchDialog}
        onClose={() => setOpenProfileSearchDialog(false)}
      />
    </Grid>
  )
}

export default OrdersPage

