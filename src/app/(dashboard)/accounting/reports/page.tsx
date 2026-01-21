'use client'

export const runtime = 'edge';

import React from 'react'

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
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  Snackbar,
  TextField,
  Typography
} from '@mui/material'

import { format } from 'date-fns'

import { useExportStudentProgressReport, useExportClassSessionReport, ReportFormat } from '@/@core/hooks/useAccounting'
import { useStudentList } from '@/@core/hooks/useStudent'
import { SingleDatePicker } from '@/components/ui/date-picker'

interface StudentOption {
  id: string
  fullname: string
  email: string
}

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

const AccountingReportsPage = () => {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedStudents, setSelectedStudents] = React.useState<StudentOption[]>([])
  const [reportFormat, setReportFormat] = React.useState<ReportFormat>(ReportFormat.EXCEL)
  const [fromDate, setFromDate] = React.useState<Date | undefined>(undefined)
  const [toDate, setToDate] = React.useState<Date | undefined>(undefined)
  const [notification, setNotification] = React.useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info'
  }>({
    open: false,
    message: '',
    severity: 'info'
  })

  // Class Session Report states
  const [openClassSessionDialog, setOpenClassSessionDialog] = React.useState(false)
  const [classSessionFromDate, setClassSessionFromDate] = React.useState<Date | undefined>(undefined)
  const [classSessionToDate, setClassSessionToDate] = React.useState<Date | undefined>(undefined)
  const [isExportingClassSession, setIsExportingClassSession] = React.useState(false)

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

  // Fetch students for autocomplete
  const { data: studentData, isLoading: isLoadingStudents } = useStudentList(searchTerm)
  const exportMutation = useExportStudentProgressReport()
  const exportClassSessionMutation = useExportClassSessionReport()

  // Map student data to options
  const studentOptions: StudentOption[] = React.useMemo(() => {
    if (!studentData?.users) return []
    return studentData.users.map(user => ({
      id: user.profile.id,
      fullname: user.profile.fullname,
      email: user.profile.email
    }))
  }, [studentData])

  // Get file extension based on format
  const getFileExtension = (format: ReportFormat) => {
    return format === ReportFormat.PDF ? 'pdf' : 'xlsx'
  }

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

  // Handle export for selected students
  const handleExportSelected = async () => {
    if (selectedStudents.length === 0) {
      setNotification({
        open: true,
        message: 'Vui lòng chọn ít nhất một học sinh',
        severity: 'error'
      })
      return
    }

    try {
      const profileIds = selectedStudents.map(s => s.id)
      const request = {
        profileIds,
        format: reportFormat,
        fromDate: fromDate ? format(fromDate, 'yyyy-MM-dd') : undefined,
        toDate: toDate ? format(toDate, 'yyyy-MM-dd') : undefined,
      }
      const blob = await exportMutation.mutateAsync(request)

      // Determine file extension based on number of students and format
      const isZip = selectedStudents.length > 1
      const ext = getFileExtension(reportFormat)
      const filename = isZip
        ? 'student_progress_reports.zip'
        : `student_progress_report_${selectedStudents[0].fullname.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`

      // Open preview dialog instead of saving directly
      const fileType = isZip ? 'zip' : (ext as 'pdf' | 'xlsx')
      openPreviewDialog(blob, filename, fileType)
    } catch (error) {
      console.error('Export error:', error)
      setNotification({
        open: true,
        message: 'Có lỗi xảy ra khi xuất báo cáo. Vui lòng thử lại.',
        severity: 'error'
      })
    }
  }

  // Handle export for all students
  const handleExportAll = async () => {
    try {
      const request = {
        profileIds: [],
        format: reportFormat,
        fromDate: fromDate ? format(fromDate, 'yyyy-MM-dd') : undefined,
        toDate: toDate ? format(toDate, 'yyyy-MM-dd') : undefined,
      }
      const blob = await exportMutation.mutateAsync(request)

      // Open preview dialog instead of saving directly
      const filename = 'student_progress_reports.zip'
      openPreviewDialog(blob, filename, 'zip')
    } catch (error) {
      console.error('Export error:', error)
      setNotification({
        open: true,
        message: 'Có lỗi xảy ra khi xuất báo cáo. Vui lòng thử lại.',
        severity: 'error'
      })
    }
  }

  // Handle Class Session Report
  const handleOpenClassSessionDialog = () => {
    setOpenClassSessionDialog(true)
  }

  const handleCloseClassSessionDialog = () => {
    setOpenClassSessionDialog(false)
    setClassSessionFromDate(undefined)
    setClassSessionToDate(undefined)
  }

  const handleExportClassSessionReport = async () => {
    setIsExportingClassSession(true)
    try {
      const request = {
        fromDate: classSessionFromDate ? format(classSessionFromDate, 'yyyy-MM-dd') : undefined,
        toDate: classSessionToDate ? format(classSessionToDate, 'yyyy-MM-dd') : undefined,
      }

      const blob = await exportClassSessionMutation.mutateAsync(request)

      // Generate filename
      const currentDate = format(new Date(), 'yyyy-MM-dd')
      const filename = `class_session_report_${currentDate}.xlsx`

      // Open preview dialog instead of saving directly
      openPreviewDialog(blob, filename, 'xlsx')
      handleCloseClassSessionDialog()
    } catch (error: any) {
      console.error('Error exporting class session report:', error)
      setNotification({
        open: true,
        message: error?.response?.data?.message || 'Có lỗi xảy ra khi xuất báo cáo',
        severity: 'error'
      })
    } finally {
      setIsExportingClassSession(false)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h5' fontWeight={700}>Xuất báo cáo</Typography>
        <Typography variant='body2' color='text.secondary'>
          Xuất các loại báo cáo: Báo cáo chuyên cần học sinh và Báo cáo buổi học lớp
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

      {/* Student Progress Report Card */}
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title={
              <Box display='flex' alignItems='center' gap={1}>
                <i className='ri-file-excel-2-line' style={{ fontSize: 24, color: '#217346' }} />
                <Typography variant='h6'>Báo cáo chuyên cần học sinh</Typography>
              </Box>
            }
            subheader='Xuất file Excel báo cáo tiến độ học tập của học sinh'
          />
          <CardContent>
            {/* Info Box */}
            <Box sx={{ p: 2, mb: 3, backgroundColor: '#e3f2fd', borderRadius: 1, border: '1px solid #bbdefb' }}>
              <Typography variant='body2' color='primary.main' fontWeight={600} gutterBottom>
                <i className='ri-information-line' style={{ marginRight: 8 }} />
                Thông tin báo cáo
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Báo cáo bao gồm: Thông tin học sinh, lớp học, ngày học, giờ học, tổng giờ, môn học, giáo viên, điểm danh và ghi chú.
                <br />
                • Chọn một học sinh: Xuất file đơn (.xlsx hoặc .pdf)
                <br />
                • Chọn nhiều học sinh hoặc tất cả: Xuất file ZIP chứa các file báo cáo
              </Typography>
            </Box>

            {/* Format Selection */}
            <Box sx={{ mb: 3 }}>
              <Typography variant='subtitle2' gutterBottom>
                Định dạng xuất:
              </Typography>
              <FormControl component='fieldset'>
                <RadioGroup
                  row
                  value={reportFormat}
                  onChange={(e) => setReportFormat(e.target.value as ReportFormat)}
                >
                  <FormControlLabel
                    value={ReportFormat.EXCEL}
                    control={<Radio size='small' />}
                    label={
                      <Box display='flex' alignItems='center' gap={0.5}>
                        <i className='ri-file-excel-2-line' style={{ fontSize: 18, color: '#217346' }} />
                        <Typography variant='body2'>Excel (.xlsx)</Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value={ReportFormat.PDF}
                    control={<Radio size='small' />}
                    label={
                      <Box display='flex' alignItems='center' gap={0.5}>
                        <i className='ri-file-pdf-2-line' style={{ fontSize: 18, color: '#f40f02' }} />
                        <Typography variant='body2'>PDF (.pdf)</Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>
            </Box>

            {/* Date Range Selection */}
            <Box sx={{ mb: 3 }}>
              <Typography variant='subtitle2' gutterBottom>
                Khoảng thời gian (tùy chọn):
              </Typography>
              <Box display='flex' gap={2} flexWrap='wrap' alignItems='center'>
                <Box>
                  <Typography variant='caption' color='text.secondary' sx={{ mb: 0.5, display: 'block' }}>
                    Từ ngày:
                  </Typography>
                  <SingleDatePicker
                    date={fromDate}
                    onSelect={setFromDate}
                    placeholder='Chọn ngày bắt đầu'
                    disabled={toDate ? { after: toDate } : { after: new Date() }}
                  />
                </Box>
                <Box>
                  <Typography variant='caption' color='text.secondary' sx={{ mb: 0.5, display: 'block' }}>
                    Đến ngày:
                  </Typography>
                  <SingleDatePicker
                    date={toDate}
                    onSelect={setToDate}
                    placeholder='Chọn ngày kết thúc'
                    disabled={fromDate ? { after: new Date(), before: fromDate } : { after: new Date() }}
                  />
                </Box>
              </Box>
              {(fromDate || toDate) && (
                <Box sx={{ mt: 1 }}>
                  <Button
                    size='small'
                    variant='text'
                    color='inherit'
                    onClick={() => {
                      setFromDate(undefined)
                      setToDate(undefined)
                    }}
                    startIcon={<i className='ri-close-line' />}
                  >
                    Xóa khoảng thời gian
                  </Button>
                </Box>
              )}
            </Box>

            {/* Student Selection */}
            <Box sx={{ mb: 3 }}>
              <Typography variant='subtitle2' gutterBottom>
                Chọn học sinh để xuất báo cáo:
              </Typography>
              <Autocomplete
                multiple
                options={studentOptions}
                value={selectedStudents}
                onChange={(_, newValue) => setSelectedStudents(newValue)}
                getOptionLabel={(option) => `${option.fullname} (${option.email})`}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                loading={isLoadingStudents}
                onInputChange={(_, value) => setSearchTerm(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder='Tìm kiếm học sinh theo tên hoặc email...'
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <i className='ri-search-line' style={{ color: '#666', marginRight: 8 }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                      endAdornment: (
                        <>
                          {isLoadingStudents ? <CircularProgress color='inherit' size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      )
                    }}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.id}
                      label={option.fullname}
                      size='small'
                      icon={<i className='ri-user-line' style={{ fontSize: 14 }} />}
                    />
                  ))
                }
                renderOption={(props, option) => (
                  <Box component='li' {...props} key={option.id}>
                    <Box display='flex' alignItems='center' gap={1} width='100%'>
                      <i className='ri-user-line' style={{ color: '#666' }} />
                      <Box flex={1}>
                        <Typography variant='body2' fontWeight={500}>
                          {option.fullname}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {option.email}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
                noOptionsText='Không tìm thấy học sinh'
                loadingText='Đang tải...'
              />
            </Box>

            {/* Selected Students Summary */}
            {selectedStudents.length > 0 && (
              <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Box display='flex' alignItems='center' justifyContent='space-between' mb={1}>
                  <Typography variant='body2' fontWeight={600}>
                    Đã chọn {selectedStudents.length} học sinh:
                  </Typography>
                  <Button
                    size='small'
                    variant='text'
                    color='inherit'
                    onClick={() => setSelectedStudents([])}
                    startIcon={<i className='ri-close-line' />}
                  >
                    Xóa tất cả
                  </Button>
                </Box>
                <Box display='flex' gap={0.5} flexWrap='wrap'>
                  {selectedStudents.slice(0, 10).map(student => (
                    <Chip
                      key={student.id}
                      size='small'
                      label={student.fullname}
                      onDelete={() => setSelectedStudents(prev => prev.filter(s => s.id !== student.id))}
                    />
                  ))}
                  {selectedStudents.length > 10 && (
                    <Chip
                      size='small'
                      label={`+${selectedStudents.length - 10} học sinh khác`}
                      variant='outlined'
                    />
                  )}
                </Box>
              </Box>
            )}

            {/* Action Buttons */}
            <Box display='flex' gap={2} flexWrap='wrap'>
              <Button
                variant='contained'
                color='primary'
                onClick={handleExportSelected}
                disabled={selectedStudents.length === 0 || exportMutation.isPending}
                startIcon={
                  exportMutation.isPending ? (
                    <CircularProgress size={16} color='inherit' />
                  ) : (
                    <i className={reportFormat === ReportFormat.PDF ? 'ri-file-pdf-2-line' : 'ri-file-excel-2-line'} />
                  )
                }
              >
                {exportMutation.isPending
                  ? 'Đang xuất...'
                  : `Xuất ${reportFormat === ReportFormat.PDF ? 'PDF' : 'Excel'} (${selectedStudents.length} học sinh)`}
              </Button>

              <Button
                variant='outlined'
                color='secondary'
                onClick={handleExportAll}
                disabled={exportMutation.isPending}
                startIcon={
                  exportMutation.isPending ? (
                    <CircularProgress size={16} color='inherit' />
                  ) : (
                    <i className='ri-download-cloud-2-line' />
                  )
                }
              >
                {exportMutation.isPending ? 'Đang xuất...' : 'Xuất tất cả học sinh'}
              </Button>
            </Box>

            {/* Warning for export all */}
            <Box sx={{ mt: 2, p: 1.5, backgroundColor: '#fff3e0', borderRadius: 1, border: '1px solid #ffb74d' }}>
              <Typography variant='caption' color='warning.dark'>
                <i className='ri-error-warning-line' style={{ marginRight: 4 }} />
                <strong>Lưu ý:</strong> Khi xuất báo cáo cho tất cả học sinh, quá trình có thể mất nhiều thời gian tùy thuộc vào số lượng học sinh trong hệ thống.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Class Session Report Card */}
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title={
              <Box display='flex' alignItems='center' gap={1}>
                <i className='ri-file-excel-2-line' style={{ fontSize: 24, color: '#217346' }} />
                <Typography variant='h6'>Báo cáo buổi học lớp</Typography>
              </Box>
            }
            subheader='Xuất báo cáo tổng hợp các buổi học theo từng lớp (Excel)'
          />
          <CardContent>
            {/* Info Box */}
            <Box sx={{ p: 2, mb: 3, backgroundColor: '#e3f2fd', borderRadius: 1, border: '1px solid #bbdefb' }}>
              <Typography variant='body2' color='primary.main' fontWeight={600} gutterBottom>
                <i className='ri-information-line' style={{ marginRight: 8 }} />
                Thông tin báo cáo
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Báo cáo bao gồm: Ngày học, giờ học, lớp học, giáo viên, môn học, số lượng học sinh tham gia và tổng số giờ học thực tế.
                <br />
                • Chọn khoảng thời gian để lọc dữ liệu (tùy chọn). Nếu không chọn, sẽ xuất tất cả dữ liệu.
              </Typography>
            </Box>

            {/* Action Button */}
            <Box display='flex' gap={2} flexWrap='wrap'>
              <Button
                variant='contained'
                color='success'
                onClick={handleOpenClassSessionDialog}
                startIcon={<i className='ri-file-excel-2-line' />}
              >
                Xuất báo cáo buổi học lớp
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Class Session Report Dialog */}
      <Dialog open={openClassSessionDialog} onClose={handleCloseClassSessionDialog} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Box display='flex' alignItems='center' gap={1}>
            <i className='ri-file-excel-2-line' style={{ fontSize: 24, color: '#217346' }} />
            <Typography variant='h6'>Xuất báo cáo buổi học lớp</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant='body2' color='text.secondary' gutterBottom>
              Chọn khoảng thời gian để lọc dữ liệu. Để trống nếu muốn xuất tất cả dữ liệu.
            </Typography>

            <Box display='flex' flexDirection='column' gap={2} mt={3}>
              <Box>
                <Typography variant='body2' fontWeight={500} gutterBottom>
                  Từ ngày
                </Typography>
                <SingleDatePicker
                  date={classSessionFromDate}
                  onSelect={setClassSessionFromDate}
                  placeholder='Chọn ngày bắt đầu (tùy chọn)'
                  disabled={{ after: classSessionToDate || new Date() }}
                />
              </Box>

              <Box>
                <Typography variant='body2' fontWeight={500} gutterBottom>
                  Đến ngày
                </Typography>
                <SingleDatePicker
                  date={classSessionToDate}
                  onSelect={setClassSessionToDate}
                  placeholder='Chọn ngày kết thúc (tùy chọn)'
                  disabled={{
                    after: new Date(),
                    before: classSessionFromDate
                  }}
                />
              </Box>
            </Box>

            {(classSessionFromDate || classSessionToDate) && (
              <Box sx={{ mt: 3, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1, border: '1px solid #bbdefb' }}>
                <Typography variant='body2' fontWeight={600} gutterBottom>
                  Khoảng thời gian đã chọn:
                </Typography>
                <Typography variant='body2'>
                  {classSessionFromDate
                    ? `Từ ${format(classSessionFromDate, 'dd/MM/yyyy')}`
                    : 'Từ đầu'}
                  {' → '}
                  {classSessionToDate
                    ? `Đến ${format(classSessionToDate, 'dd/MM/yyyy')}`
                    : 'Đến hiện tại'}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseClassSessionDialog} disabled={isExportingClassSession}>
            Hủy
          </Button>
          <Button
            variant='contained'
            color='success'
            onClick={handleExportClassSessionReport}
            disabled={isExportingClassSession}
            startIcon={
              isExportingClassSession ? (
                <CircularProgress size={16} color='inherit' />
              ) : (
                <i className='ri-file-excel-2-line' />
              )
            }
          >
            {isExportingClassSession ? 'Đang xuất...' : 'Xuất báo cáo'}
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

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Chip
          label={notification.message}
          color={notification.severity === 'success' ? 'success' : notification.severity === 'error' ? 'error' : 'info'}
          onDelete={() => setNotification(prev => ({ ...prev, open: false }))}
          icon={
            notification.severity === 'success' ? <i className='ri-check-line' /> :
              notification.severity === 'error' ? <i className='ri-error-warning-line' /> :
                <i className='ri-information-line' />
          }
        />
      </Snackbar>
    </Grid>
  )
}

export default AccountingReportsPage

