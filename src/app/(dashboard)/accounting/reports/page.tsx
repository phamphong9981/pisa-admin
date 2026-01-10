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
  FormControl,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
  Typography
} from '@mui/material'

import { useExportStudentProgressReport, ReportFormat } from '@/@core/hooks/useAccounting'
import { useStudentList } from '@/@core/hooks/useStudent'

interface StudentOption {
  id: string
  fullname: string
  email: string
}

const AccountingReportsPage = () => {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedStudents, setSelectedStudents] = React.useState<StudentOption[]>([])
  const [reportFormat, setReportFormat] = React.useState<ReportFormat>(ReportFormat.EXCEL)
  const [notification, setNotification] = React.useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info'
  }>({
    open: false,
    message: '',
    severity: 'info'
  })

  // Fetch students for autocomplete
  const { data: studentData, isLoading: isLoadingStudents } = useStudentList(searchTerm)
  const exportMutation = useExportStudentProgressReport()

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
      const blob = await exportMutation.mutateAsync({ profileIds, format: reportFormat })
      
      // Determine file extension based on number of students and format
      const isZip = selectedStudents.length > 1
      const ext = getFileExtension(reportFormat)
      const filename = isZip 
        ? 'student_progress_reports.zip'
        : `student_progress_report_${selectedStudents[0].fullname.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`
      
      // Download the file
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      setNotification({
        open: true,
        message: `Đã xuất báo cáo cho ${selectedStudents.length} học sinh thành công!`,
        severity: 'success'
      })
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
      const blob = await exportMutation.mutateAsync({ profileIds: [], format: reportFormat })
      
      // Download the file
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'student_progress_reports.zip'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      setNotification({
        open: true,
        message: 'Đã xuất báo cáo cho tất cả học sinh thành công!',
        severity: 'success'
      })
    } catch (error) {
      console.error('Export error:', error)
      setNotification({
        open: true,
        message: 'Có lỗi xảy ra khi xuất báo cáo. Vui lòng thử lại.',
        severity: 'error'
      })
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h5' fontWeight={700}>Xuất báo cáo</Typography>
        <Typography variant='body2' color='text.secondary'>
          Xuất báo cáo chuyên cần học sinh (Student Progress Report)
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
    </Grid>
  )
}

export default AccountingReportsPage

