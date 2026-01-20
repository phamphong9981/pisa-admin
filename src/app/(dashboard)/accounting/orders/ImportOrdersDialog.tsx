'use client'

import React, { useState, useCallback } from 'react'
import { format, parse } from 'date-fns'
import {
  Box,
  Button,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

import {
  BillType,
  PaymentMethod,
  RECEIPT_CATEGORIES,
  PAYMENT_CATEGORIES,
  useCreateOrdersBulk,
  type CreateOrderDto,
  type BulkCreateOrdersResponse,
} from '@/@core/hooks/useOrders'

interface ParsedOrderRow {
  billType: string
  billCategory: string
  studentCode: string
  paymentMethod: string
  description: string
  totalAmount: string
  paidAmount: string
  deadline: string
}

interface ProcessedOrder extends CreateOrderDto {
  rowIndex: number
  errors?: string[]
  studentCode?: string
}

interface ImportOrdersDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const ImportOrdersDialog: React.FC<ImportOrdersDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [parsedData, setParsedData] = useState<ParsedOrderRow[]>([])
  const [processedOrders, setProcessedOrders] = useState<ProcessedOrder[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [importResult, setImportResult] = useState<BulkCreateOrdersResponse | null>(null)

  const createOrdersBulkMutation = useCreateOrdersBulk()

  // Helper to safely convert value to string
  const safeToString = (value: any): string => {
    if (value === null || value === undefined) return ''
    if (value instanceof Date && !isNaN(value.getTime())) {
      return format(value, 'MM/dd/yyyy')
    }
    return String(value)
  }

  // Parse date from MM/DD/YYYY or DD/MM/YYYY format
  const parseDate = (dateStr: string): string | undefined => {
    if (!dateStr || dateStr.trim() === '') return undefined
    const cleanStr = dateStr.trim()
    try {
      // Try MM/dd/yyyy
      let date = parse(cleanStr, 'MM/dd/yyyy', new Date())
      if (!isNaN(date.getTime())) return format(date, 'yyyy-MM-dd')

      // Try dd/MM/yyyy
      date = parse(cleanStr, 'dd/MM/yyyy', new Date())
      if (!isNaN(date.getTime())) return format(date, 'yyyy-MM-dd')

      // Try other formats
      date = new Date(cleanStr)
      if (!isNaN(date.getTime())) return format(date, 'yyyy-MM-dd')

      return undefined
    } catch {
      return undefined
    }
  }

  // Parse bill type: 1 = RECEIPT, 0 = PAYMENT
  const parseBillType = (value: string): BillType => {
    const num = parseInt(value, 10)
    return num === 1 ? BillType.RECEIPT : BillType.PAYMENT
  }

  // Parse category from "id|name" format
  const parseCategory = (value: string): { id: number; name: string } | null => {
    if (!value) return null
    const parts = value.split('|')
    if (parts.length >= 2) {
      const id = parseInt(parts[0].trim(), 10)
      const name = parts.slice(1).join('|').trim()
      if (!isNaN(id) && name) {
        return { id, name }
      }
    }
    return null
  }

  // Parse payment method from "value|name" format
  const parsePaymentMethod = (value: string): PaymentMethod | undefined => {
    if (!value) return undefined
    const parts = value.split('|')
    const methodValue = parts[0]?.trim().toLowerCase()

    const methodMap: Record<string, PaymentMethod> = {
      'cash': PaymentMethod.CASH,
      'deposit': PaymentMethod.DEPOSIT,
      'transfer': PaymentMethod.TRANSFER,
      'mpos': PaymentMethod.MPOS,
      'installment': PaymentMethod.INSTALLMENT,
    }

    return methodMap[methodValue] || undefined
  }

  // Process CSV data
  const processParsedData = useCallback(() => {
    setIsProcessing(true)
    const processed: ProcessedOrder[] = []
    const errorList: string[] = []

    parsedData.forEach((row, index) => {
      const rowErrors: string[] = []
      const rowIndex = index + 2 // +2 because of header row

      // Parse bill type
      let billType: BillType
      try {
        billType = parseBillType(row.billType)
      } catch {
        rowErrors.push('Loại hóa đơn không hợp lệ')
        billType = BillType.RECEIPT // Default
      }

      // Parse category
      const category = parseCategory(row.billCategory)
      if (!category) {
        rowErrors.push('Danh mục hóa đơn không hợp lệ (cần format: id|name)')
      }

      // Validate student code
      const studentCode = row.studentCode?.trim()
      if (!studentCode) {
        rowErrors.push('Mã học sinh không được để trống')
      }

      // Parse payment method
      const paymentMethod = parsePaymentMethod(row.paymentMethod)

      // Parse amounts
      const totalAmount = parseFloat(row.totalAmount?.replace(/,/g, '') || '0')
      const paidAmount = parseFloat(row.paidAmount?.replace(/,/g, '') || '0')

      if (isNaN(totalAmount) || totalAmount <= 0) {
        rowErrors.push('Số tiền hóa đơn không hợp lệ')
      }

      if (isNaN(paidAmount) || paidAmount < 0) {
        rowErrors.push('Số tiền đã thanh toán không hợp lệ')
      }

      if (paidAmount > totalAmount) {
        rowErrors.push('Số tiền đã thanh toán không được lớn hơn tổng tiền')
      }

      // Parse deadline
      const deadline = parseDate(row.deadline)

      // If there are critical errors, skip this row
      if (rowErrors.length > 0 || !category || !studentCode) {
        if (rowErrors.length > 0) {
          errorList.push(`Dòng ${rowIndex}: ${rowErrors.join(', ')}`)
        }
        if (!category || !studentCode) {
          return // Skip this row
        }
      }

      // Get all categories for validation
      const allCategories = billType === BillType.RECEIPT ? RECEIPT_CATEGORIES : PAYMENT_CATEGORIES
      const isValidCategory = allCategories.some(cat => cat.id === category.id)

      if (!isValidCategory) {
        errorList.push(`Dòng ${rowIndex}: Danh mục ID ${category.id} không hợp lệ cho loại hóa đơn này`)
        return
      }

      const orderData: ProcessedOrder = {
        billType,
        profileId: studentCode, // Will be validated/transformed later if needed
        billCategoryId: category.id,
        billCategoryName: category.name,
        paymentMethod,
        description: row.description?.trim() || '',
        totalAmount,
        paidAmount: paidAmount || 0,
        deadline,
        rowIndex,
        studentCode,
        errors: rowErrors.length > 0 ? rowErrors : undefined,
      }

      processed.push(orderData)
    })

    setProcessedOrders(processed)
    setErrors(errorList)
    setIsProcessing(false)
  }, [parsedData])

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    const fileExtension = file.name.split('.').pop()?.toLowerCase()

    if (fileExtension === 'csv') {
      // Parse CSV
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: (results) => {
          const data = results.data as any[]

          // Map CSV columns to our structure
          const parsed: ParsedOrderRow[] = data.map((row: any) => ({
            billType: row['Loại hóa đơn'] || row['Bill Type'] || '',
            billCategory: row['Danh mục hóa đơn'] || row['Bill Category'] || '',
            studentCode: row['Mã học sinh'] || row['Student Code'] || '',
            paymentMethod: row['Hình thức thanh toán'] || row['Payment Method'] || '',
            description: row['Mô tả'] || row['Description'] || '',
            totalAmount: row['Số tiền hóa đơn'] || row['Total Amount'] || '',
            paidAmount: row['Số tiền đã thanh toán'] || row['Paid Amount'] || '',
            deadline: row['Ngày phải trả'] || row['Deadline'] || '',
          }))

          setParsedData(parsed)
          setShowPreview(true)
          setErrors([])
          setImportResult(null)
        },
        error: (error) => {
          setErrors([`Lỗi đọc file CSV: ${error.message}`])
          setShowPreview(false)
        },
      })
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Parse Excel
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array', cellDates: true })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[]

          // Map Excel columns to our structure
          const parsed: ParsedOrderRow[] = jsonData.map((row: any) => ({
            billType: safeToString(row['Loại hóa đơn'] || row['Bill Type']),
            billCategory: safeToString(row['Danh mục hóa đơn'] || row['Bill Category']),
            studentCode: safeToString(row['Mã học sinh'] || row['Student Code']),
            paymentMethod: safeToString(row['Hình thức thanh toán'] || row['Payment Method']),
            description: safeToString(row['Mô tả'] || row['Description']),
            totalAmount: safeToString(row['Số tiền hóa đơn'] || row['Total Amount']),
            paidAmount: safeToString(row['Số tiền đã thanh toán'] || row['Paid Amount']),
            deadline: safeToString(row['Ngày phải trả'] || row['Deadline']),
          }))

          setParsedData(parsed)
          setShowPreview(true)
          setErrors([])
          setImportResult(null)
        } catch (error: any) {
          setErrors([`Lỗi đọc file Excel: ${error.message}`])
          setShowPreview(false)
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      setErrors(['File không hợp lệ. Vui lòng chọn file CSV hoặc Excel (.xlsx, .xls)'])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
  })

  // Handle import
  const handleImport = async () => {
    if (processedOrders.length === 0) {
      setErrors(['Không có hóa đơn nào để import'])
      return
    }

    try {
      setIsProcessing(true)

      // Remove extra fields before sending to API
      const ordersToCreate = processedOrders.map(({ rowIndex, studentCode, errors, ...rest }) => rest)

      const result = await createOrdersBulkMutation.mutateAsync({ orders: ordersToCreate })
      setImportResult(result)

      if (result.created > 0) {
        if (onSuccess) {
          onSuccess()
        }
      }
    } catch (error: any) {
      console.error('Import orders error:', error)
      setErrors([`Lỗi khi import: ${error.message || 'Có lỗi xảy ra'}`])
    } finally {
      setIsProcessing(false)
    }
  }

  // Reset state when dialog closes
  const handleClose = () => {
    setParsedData([])
    setProcessedOrders([])
    setErrors([])
    setShowPreview(false)
    setImportResult(null)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='lg' fullWidth>
      <DialogTitle>
        <Box display='flex' alignItems='center' gap={1}>
          <i className='ri-file-upload-line' />
          <Typography variant='h6'>Import hóa đơn từ CSV/Excel</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box display='flex' flexDirection='column' gap={3} mt={2}>
          {!showPreview && !importResult && (
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                transition: 'all 0.2s',
              }}
            >
              <input {...getInputProps()} />
              <i className='ri-file-upload-line' style={{ fontSize: 48, color: '#999', marginBottom: 16 }} />
              <Typography variant='h6' gutterBottom>
                {isDragActive ? 'Thả file vào đây' : 'Kéo thả file CSV/Excel vào đây'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                hoặc click để chọn file
              </Typography>
              <Typography variant='caption' color='text.secondary' sx={{ mt: 2, display: 'block' }}>
                Hỗ trợ: .csv, .xlsx, .xls
              </Typography>
            </Box>
          )}

          {errors.length > 0 && (
            <Alert severity='error'>
              <Typography variant='subtitle2' gutterBottom>Lỗi:</Typography>
              <Box component='ul' sx={{ m: 0, pl: 2 }}>
                {errors.map((error, index) => (
                  <li key={index}>
                    <Typography variant='body2'>{error}</Typography>
                  </li>
                ))}
              </Box>
            </Alert>
          )}

          {showPreview && !importResult && (
            <>
              <Box display='flex' justifyContent='space-between' alignItems='center'>
                <Typography variant='h6'>Xem trước dữ liệu</Typography>
                <Button
                  size='small'
                  onClick={processParsedData}
                  disabled={isProcessing || parsedData.length === 0}
                  startIcon={isProcessing ? <CircularProgress size={16} /> : <i className='ri-refresh-line' />}
                >
                  Xử lý dữ liệu
                </Button>
              </Box>

              {processedOrders.length > 0 && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant='subtitle2' gutterBottom>
                      Đã xử lý: {processedOrders.length} hóa đơn
                    </Typography>
                    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                      <Table size='small' stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Dòng</TableCell>
                            <TableCell>Loại</TableCell>
                            <TableCell>Danh mục</TableCell>
                            <TableCell>Mã HS</TableCell>
                            <TableCell align='right'>Tổng tiền</TableCell>
                            <TableCell align='right'>Đã trả</TableCell>
                            <TableCell>Hạn TT</TableCell>
                            <TableCell>Lỗi</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {processedOrders.map((order, index) => (
                            <TableRow key={index} hover>
                              <TableCell>{order.rowIndex}</TableCell>
                              <TableCell>
                                <Chip
                                  label={order.billType === BillType.RECEIPT ? 'Phiếu thu' : 'Phiếu chi'}
                                  color={order.billType === BillType.RECEIPT ? 'success' : 'error'}
                                  size='small'
                                />
                              </TableCell>
                              <TableCell>{order.billCategoryName}</TableCell>
                              <TableCell>{order.studentCode}</TableCell>
                              <TableCell align='right'>{order.totalAmount?.toLocaleString('vi-VN')}</TableCell>
                              <TableCell align='right'>{order?.paidAmount?.toLocaleString('vi-VN')}</TableCell>
                              <TableCell>{order.deadline || '—'}</TableCell>
                              <TableCell>
                                {order.errors && order.errors.length > 0 ? (
                                  <Chip label={`${order.errors.length} lỗi`} color='warning' size='small' />
                                ) : (
                                  <Chip label='OK' color='success' size='small' />
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </>
              )}
            </>
          )}

          {importResult && (
            <Alert severity={importResult.failed === 0 ? 'success' : 'warning'}>
              <Typography variant='subtitle2' gutterBottom>Kết quả import:</Typography>
              <Typography variant='body2'>
                • Thành công: {importResult.created} hóa đơn
              </Typography>
              {importResult.failed > 0 && (
                <Typography variant='body2'>
                  • Thất bại: {importResult.failed} hóa đơn
                </Typography>
              )}
              {importResult.errors && importResult.errors.length > 0 && (
                <Box component='ul' sx={{ mt: 1, mb: 0, pl: 2 }}>
                  {importResult.errors.map((error, index) => (
                    <li key={index}>
                      <Typography variant='body2'>
                        Dòng {error.index + 1}: {error.error}
                      </Typography>
                    </li>
                  ))}
                </Box>
              )}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color='inherit'>
          {importResult ? 'Đóng' : 'Hủy'}
        </Button>
        {showPreview && !importResult && (
          <Button
            variant='contained'
            onClick={handleImport}
            disabled={isProcessing || processedOrders.length === 0}
            startIcon={isProcessing ? <CircularProgress size={16} color='inherit' /> : <i className='ri-upload-line' />}
          >
            Import ({processedOrders.length} hóa đơn)
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default ImportOrdersDialog

