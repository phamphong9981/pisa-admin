'use client'

// React Imports
import React, { useMemo, useState } from 'react'

// MUI Imports
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import { styled } from '@mui/material/styles'

// Hooks
import { useStudentListWithReload, useUpdateStudentBusySchedule } from '@/@core/hooks/useStudent'
import { SCHEDULE_TIME, useBatchOrderSchedule } from '@/@core/hooks/useSchedule'

const StyledHeaderCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '0.875rem',
  padding: theme.spacing(1.5),
  backgroundColor: '#f5f5f5',
  color: '#424242',
  border: `1px solid ${theme.palette.divider}`,
  textAlign: 'center',
  position: 'sticky',
  top: 0,
  zIndex: 1
}))

const StyledTimeCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '0.75rem',
  padding: theme.spacing(1),
  backgroundColor: '#fafafa',
  color: '#424242',
  border: `1px solid ${theme.palette.divider}`,
  textAlign: 'center',
  minWidth: '100px',
  position: 'sticky',
  left: 0,
  zIndex: 1
}))

const StyledDayCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '0.8rem',
  padding: theme.spacing(1),
  backgroundColor: '#f0f0f0',
  color: '#424242',
  border: `1px solid ${theme.palette.divider}`,
  textAlign: 'left',
  minWidth: '120px',
  position: 'sticky',
  left: 0,
  zIndex: 2
}))

const ScheduleCell = styled(TableCell, {
  shouldForwardProp: (prop) => prop !== 'isBusy' && prop !== 'isTeaching' && prop !== 'isEditable'
})<{ isBusy?: boolean; isTeaching?: boolean; isEditable?: boolean }>(({ theme, isBusy, isTeaching, isEditable }) => ({
  padding: theme.spacing(0.5),
  border: `1px solid ${theme.palette.divider}`,
  textAlign: 'center',
  cursor: isEditable ? 'pointer' : isTeaching ? 'pointer' : 'default',
  minWidth: '120px',
  minHeight: '60px',
  backgroundColor: isTeaching
    ? '#e3f2fd' // Light blue for teaching
    : isBusy
      ? '#ffebee' // Light red for busy
      : '#f1f8e9', // Light green for free
  '&:hover': {
    backgroundColor: isEditable
      ? '#e8f5e8' // Light green on hover for editable
      : isTeaching
        ? '#bbdefb' // Darker blue on hover
        : isBusy
          ? '#ffcdd2' // Darker red on hover
          : '#dcedc8', // Darker green on hover
  },
  transition: 'background-color 0.2s ease',
  position: 'relative'
}))

const getDayInVietnamese = (englishDay: string) => {
  const dayMap: { [key: string]: string } = {
    'Monday': 'Thứ 2',
    'Tuesday': 'Thứ 3',
    'Wednesday': 'Thứ 4',
    'Thursday': 'Thứ 5',
    'Friday': 'Thứ 6',
    'Saturday': 'Thứ 7',
    'Sunday': 'Chủ nhật'
  }

  return dayMap[englishDay] || englishDay
}

const EditStudentSchedule = () => {
  // States for search and filtering
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedDay, setSelectedDay] = useState<string>('all')
  const [completionStatus, setCompletionStatus] = useState<string>('all') // 'all' | 'completed' | 'incomplete'
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Hook for fetching students
  const { data: studentData, isLoading, error } = useStudentListWithReload(debouncedSearch)

  // Hook for updating student busy schedule
  const updateStudentBusyScheduleMutation = useUpdateStudentBusySchedule()

  // Hook for batch order schedule
  const batchOrderScheduleMutation = useBatchOrderSchedule()

  // Add CSS for spinner animation
  React.useEffect(() => {
    const style = document.createElement('style')

    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `
    document.head.appendChild(style)


    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(studentSearch)
    }, 500)

    return () => clearTimeout(timer)
  }, [studentSearch])

  // States for edit dialog
  const [editDialog, setEditDialog] = useState<{
    open: boolean
    studentId: string
    studentName: string
    slotIndex: number
    day: string
    time: string
    currentStatus: 'busy' | 'free'
  }>({
    open: false,
    studentId: '',
    studentName: '',
    slotIndex: 0,
    day: '',
    time: '',
    currentStatus: 'free'
  })

  // States for notification
  const [notification, setNotification] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })

  // States for CSV upload
  const [uploadDialog, setUploadDialog] = useState<{
    open: boolean
    previewData: Array<{
      email: string
      fullname: string
      className: string
      busyScheduleArr: number[]
      errors?: string[]
    }> | null
  }>({
    open: false,
    previewData: null
  })

  // Generate time slots for all 7 days
  const allTimeSlots = useMemo(() => {
    const slots: { day: string; time: string; slot: number }[] = []

    SCHEDULE_TIME.forEach((timeSlot, index) => {
      const parts = timeSlot.split(' ')
      const time = parts[0] // "8:00-10:00"
      const englishDay = parts[1] // "Monday"

      slots.push({
        day: getDayInVietnamese(englishDay),
        time: time,
        slot: index
      })
    })

    return slots
  }, [])

  // Filter students based on search term and completion status
  const filteredStudents = useMemo(() => {
    if (!studentData?.users) return []

    let result = studentData.users

    // Filter by search term
    if (studentSearch.trim()) {
      result = result.filter(student =>
        student.profile.fullname.toLowerCase().includes(studentSearch.toLowerCase()) ||
        student.profile.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
        student.course?.name.toLowerCase().includes(studentSearch.toLowerCase())
      )
    }

    // Filter by completion status
    if (completionStatus === 'completed') {
      // Đã hoàn thành: có ít nhất 1 slot rảnh (busyScheduleArr.length < 42)
      result = result.filter(student => {
        const busySlots = student.profile.busyScheduleArr?.length || 0
        return busySlots < SCHEDULE_TIME.length
      })
    } else if (completionStatus === 'incomplete') {
      // Chưa hoàn thành: tất cả 42 slot đều bận (busyScheduleArr.length === 42)
      result = result.filter(student => {
        const busySlots = student.profile.busyScheduleArr?.length || 0
        return busySlots === SCHEDULE_TIME.length
      })
    }

    return result
  }, [studentData?.users, studentSearch, completionStatus])

  // Filter time slots based on selected day
  const filteredTimeSlots = useMemo(() => {
    if (selectedDay === 'all') return allTimeSlots

    return allTimeSlots.filter(slot => slot.day === selectedDay)
  }, [allTimeSlots, selectedDay])

  // Get unique days for filter dropdown
  const uniqueDays = useMemo(() => {
    const days = allTimeSlots.map(slot => slot.day)


    return ['all', ...Array.from(new Set(days))]
  }, [allTimeSlots])

  // Check if student is busy at specific slot
  // Note: API uses 1-42, UI uses 0-41, so we need to add 1 to convert
  const isStudentBusy = (studentSchedule: number[] | undefined, slotIndex: number) => {
    if (!studentSchedule || !Array.isArray(studentSchedule)) return false

    return studentSchedule.includes(slotIndex + 1)
  }

  // Map time range string to slot number
  // Examples: "8-10am" -> slot 1, "10-12pm" -> slot 2, "1.30-3pm" -> slot 3, etc.
  const mapTimeRangeToSlot = (timeRange: string, day: string): number | null => {
    if (!timeRange || !timeRange.trim()) return null

    // Normalize time range - remove spaces, handle dots
    let normalized = timeRange.trim().toLowerCase().replace(/\s+/g, '')

    // Map to standard format
    let standardTime = ''

    // Handle "8-10am" or "8:00-10:00" - must start with 8 and end before 10
    if (normalized.match(/^8[-:]?00?[-:]?10|^8[-:]?10/)) {
      standardTime = '8:00-10:00'
    }
    // Handle "10-12pm" or "10:00-12:00" - must start with 10 and end at 12
    else if (normalized.match(/^10[-:]?00?[-:]?12|^10[-:]?12/)) {
      standardTime = '10:00-12:00'
    }
    // Handle "1.30-3pm" or "13:30-15:00" or "1:30-3pm" - must start with 1.30 or 13:30
    else if (normalized.match(/^1[.:]?30[-:]?3|^13:30[-:]?15/)) {
      standardTime = '13:30-15:00'
    }
    // Handle "3-5pm" or "15:00-17:00" - must start with 3 (not 13) and end at 5
    else if (normalized.match(/^3[-:]?5/) && !normalized.startsWith('13') && !normalized.startsWith('1.30') && !normalized.startsWith('1:30')) {
      standardTime = '15:00-17:00'
    }
    // Handle "5-7pm" or "17:00-19:00" - must start with 5 (not 15) and end at 7
    else if (normalized.match(/^5[-:]?7/) && !normalized.startsWith('15') && !normalized.startsWith('3-5') && !normalized.startsWith('3:5')) {
      standardTime = '17:00-19:00'
    }
    // Handle "7.30-9.30pm" or "19:30-21:30" or "7:30-9:30pm" - must start with 7.30 or 19:30
    else if (normalized.match(/^7[.:]?30[-:]?9[.:]?30|^19:30[-:]?21:30/)) {
      standardTime = '19:30-21:30'
    }
    else {
      return null
    }

    // Find slot index
    const slotIndex = SCHEDULE_TIME.findIndex(slot => {
      const parts = slot.split(' ')
      const time = parts[0]
      const englishDay = parts[1]
      return time === standardTime && englishDay === day
    })

    return slotIndex >= 0 ? slotIndex + 1 : null // API uses 1-42
  }

  // Parse CSV line (handle quoted fields properly)
  const parseCSVLine = (line: string): string[] => {
    const fields: string[] = []
    let currentField = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentField += '"'
          i++ // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField.trim())
        currentField = ''
      } else {
        currentField += char
      }
    }
    fields.push(currentField.trim())

    return fields
  }

  // Verify CSV header format
  const verifyCSVHeader = (headerLine: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    const fields = parseCSVLine(headerLine)

    // Expected columns (based on student-example.csv):
    // 0: Dấu thời gian
    // 1: Địa chỉ email
    // 2: Lớp
    // 3: Họ Và Tên
    // 4-10: Monday-Sunday columns
    // 11: Lý do

    if (fields.length < 12) {
      errors.push(`Số cột không đúng. Mong đợi ít nhất 12 cột, nhận được ${fields.length}`)
    }

    // Check email column
    if (fields.length > 1 && !fields[1].toLowerCase().includes('email')) {
      errors.push('Cột 2 phải là "Địa chỉ email"')
    }

    // Check for day columns
    const expectedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    expectedDays.forEach((day, index) => {
      const columnIndex = index + 4
      if (fields.length > columnIndex && !fields[columnIndex].toLowerCase().includes(day.toLowerCase())) {
        errors.push(`Cột ${columnIndex + 1} phải chứa "${day}"`)
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Parse CSV file
  const parseCSV = (csvText: string): Array<{
    email: string
    fullname: string
    className: string
    busyScheduleArr: number[]
    errors?: string[]
  }> => {
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      return []
    }

    // Verify header
    const headerVerification = verifyCSVHeader(lines[0])
    if (!headerVerification.valid) {
      // Return error result
      return [{
        email: '',
        fullname: '',
        className: '',
        busyScheduleArr: [],
        errors: ['Lỗi định dạng header: ' + headerVerification.errors.join(', ')]
      }]
    }

    // Skip header row
    const dataLines = lines.slice(1)
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const dayColumnIndices = [4, 5, 6, 7, 8, 9, 10] // Columns for Monday-Sunday (0-indexed)

    const results: Array<{
      email: string
      fullname: string
      className: string
      busyScheduleArr: number[]
      errors?: string[]
    }> = []

    dataLines.forEach((line, lineIndex) => {
      // Skip empty lines
      if (!line.trim()) return

      const fields = parseCSVLine(line)

      if (fields.length < 11) {
        results.push({
          email: '',
          fullname: `Dòng ${lineIndex + 2}`,
          className: '',
          busyScheduleArr: [],
          errors: [`Số cột không đủ. Mong đợi ít nhất 11 cột, nhận được ${fields.length}`]
        })
        return
      }

      const email = fields[1]?.trim() || ''
      const className = fields[2]?.trim() || ''
      const fullname = fields[3]?.trim() || ''
      const errors: string[] = []

      if (!email) {
        errors.push('Thiếu email')
      }

      const busyScheduleArr: number[] = []

      days.forEach((day, dayIndex) => {
        const dayColumnIndex = dayColumnIndices[dayIndex]
        const dayData = fields[dayColumnIndex]?.trim() || ''

        if (dayData) {
          // Remove quotes if present
          const cleanDayData = dayData.replace(/^"|"$/g, '')

          // Split by comma and process each time range
          const timeRanges = cleanDayData.split(',').map(t => t.trim()).filter(t => t)
          timeRanges.forEach(timeRange => {
            const slot = mapTimeRangeToSlot(timeRange, day)
            if (slot !== null && !busyScheduleArr.includes(slot)) {
              busyScheduleArr.push(slot)
            } else if (slot === null) {
              errors.push(`Không thể parse khung giờ "${timeRange}" cho ${getDayInVietnamese(day)}`)
            }
          })
        }
      })

      if (email || errors.length > 0) {
        results.push({
          email,
          fullname: fullname || `Dòng ${lineIndex + 2}`,
          className,
          busyScheduleArr: busyScheduleArr.sort((a, b) => a - b),
          errors: errors.length > 0 ? errors : undefined
        })
      }
    })

    return results
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const previewData = parseCSV(text)
      setUploadDialog({
        open: true,
        previewData
      })
    }
    reader.readAsText(file, 'UTF-8')

    // Reset input
    event.target.value = ''
  }

  // Handle close upload dialog
  const handleCloseUploadDialog = () => {
    setUploadDialog({
      open: false,
      previewData: null
    })
  }


  // Handle submit batch update
  const handleSubmitBatchUpdate = async () => {
    if (!uploadDialog.previewData) return

    try {
      const data = uploadDialog.previewData
        .filter(item => !item.errors || item.errors.length === 0)
        .map(item => ({
          email: item.email,
          busy_schedule_arr: item.busyScheduleArr,
          type: 'user' as const
        }))

      if (data.length === 0) {
        setNotification({
          open: true,
          message: 'Không có dữ liệu hợp lệ để cập nhật!',
          severity: 'error'
        })
        return
      }

      await batchOrderScheduleMutation.mutateAsync({ data })

      setNotification({
        open: true,
        message: `Đã cập nhật lịch cho ${data.length} học sinh thành công!`,
        severity: 'success'
      })

      handleCloseUploadDialog()
    } catch (error) {
      console.error('Error batch updating schedule:', error)
      setNotification({
        open: true,
        message: 'Có lỗi xảy ra khi cập nhật lịch!',
        severity: 'error'
      })
    }
  }


  // Handle cell click for editing
  const handleCellClick = (studentId: string, slotIndex: number, day: string, time: string) => {
    const student = filteredStudents.find(s => s.id === studentId)

    if (!student) return

    const isBusy = isStudentBusy(student.profile.busyScheduleArr, slotIndex)

    setEditDialog({
      open: true,
      studentId,
      studentName: student.profile.fullname,
      slotIndex,
      day,
      time,
      currentStatus: isBusy ? 'busy' : 'free'
    })
  }

  // Handle close edit dialog
  const handleCloseEditDialog = () => {
    setEditDialog(prev => ({ ...prev, open: false }))
  }

  // Handle save schedule changes
  const handleSaveSchedule = async () => {
    try {
      const student = filteredStudents.find(s => s.id === editDialog.studentId)

      if (!student) return

      const currentBusySchedule = [...(student.profile.busyScheduleArr || [])]
      let newBusySchedule: number[]

      if (editDialog.currentStatus === 'busy') {
        // Add slot to busy schedule if not already there
        // Note: API uses 1-42, so we need to add 1 to convert from UI index (0-41)
        const apiSlotIndex = editDialog.slotIndex + 1

        if (!currentBusySchedule.includes(apiSlotIndex)) {
          newBusySchedule = [...currentBusySchedule, apiSlotIndex]
        } else {
          newBusySchedule = currentBusySchedule
        }
      } else {
        // Remove slot from busy schedule
        // Note: API uses 1-42, so we need to add 1 to convert from UI index (0-41)
        const apiSlotIndex = editDialog.slotIndex + 1

        newBusySchedule = currentBusySchedule.filter(slot => slot !== apiSlotIndex)
      }

      // Use the hook to update student's busy schedule
      await updateStudentBusyScheduleMutation.mutateAsync({
        studentId: editDialog.studentId,
        busySchedule: newBusySchedule
      })

      setNotification({
        open: true,
        message: `Đã cập nhật lịch ${editDialog.studentName} thành công!`,
        severity: 'success'
      })
    } catch (error) {
      console.error('Error updating student schedule:', error)
      setNotification({
        open: true,
        message: 'Có lỗi xảy ra khi cập nhật lịch!',
        severity: 'error'
      })
    }

    handleCloseEditDialog()
  }

  // Handle close notification
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }))
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Đang tải dữ liệu học sinh...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h6" color="error">
          Lỗi khi tải dữ liệu: {error.message}
        </Typography>
      </Box>
    )
  }

  return (
    <>
      {/* Chỉnh sửa lịch học sinh */}
      <Card>
        <CardHeader
          title="Chỉnh sửa lịch học sinh"
          subheader="Click vào ô lịch để thay đổi trạng thái bận/rảnh của học sinh (42 khung giờ/tuần)"
          action={
            <Box display="flex" gap={1} alignItems="center">
              <Box display="flex" flexDirection="column" alignItems="center">
                <input
                  accept=".csv"
                  style={{ display: 'none' }}
                  id="csv-upload-input"
                  type="file"
                  onChange={handleFileUpload}
                />
                <label htmlFor="csv-upload-input">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<i className="ri-upload-line" />}
                  >
                    Upload CSV
                  </Button>
                </label>
                <Link
                  href="/student-example.csv"
                  download="student-example.csv"
                  variant="caption"
                  sx={{
                    mt: 0.5,
                    color: 'primary.main',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    display: 'block',
                    '&:hover': {
                      color: 'primary.dark'
                    }
                  }}
                >
                  Tải file mẫu
                </Link>
              </Box>
              <Chip
                size="small"
                label="Rảnh"
                sx={{
                  backgroundColor: '#f1f8e9',
                  color: '#2e7d32',
                  border: '1px solid #c8e6c9'
                }}
              />
              <Chip
                size="small"
                label="Bận"
                sx={{
                  backgroundColor: '#ffebee',
                  color: '#c62828',
                  border: '1px solid #ffcdd2'
                }}
              />
              <Chip
                size="small"
                label="Có thể chỉnh sửa"
                sx={{
                  backgroundColor: '#e8f5e8',
                  color: '#2e7d32',
                  border: '1px solid #c8e6c9',
                  borderStyle: 'dashed'
                }}
              />
            </Box>
          }
        />
        <CardContent>
          {/* Filter Section */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Tìm kiếm theo tên học sinh, email hoặc khóa học..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <i className="ri-search-line" style={{ color: '#666' }} />
                      </InputAdornment>
                    ),
                    endAdornment: studentSearch && (
                      <InputAdornment position="end">
                        <i
                          className="ri-close-line"
                          style={{
                            color: '#666',
                            cursor: 'pointer',
                            fontSize: '18px'
                          }}
                          onClick={() => setStudentSearch('')}
                        />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#1976d2',
                      },
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Lọc theo ngày</InputLabel>
                  <Select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    label="Lọc theo ngày"
                  >
                    {uniqueDays.map((day) => (
                      <MenuItem key={day} value={day}>
                        {day === 'all' ? 'Tất cả các ngày' : day}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Trạng thái hoàn thành</InputLabel>
                  <Select
                    value={completionStatus}
                    onChange={(e) => setCompletionStatus(e.target.value)}
                    label="Trạng thái hoàn thành"
                  >
                    <MenuItem value="all">Tất cả</MenuItem>
                    <MenuItem value="completed">Đã hoàn thành</MenuItem>
                    <MenuItem value="incomplete">Chưa hoàn thành</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Filter Summary */}
            {(studentSearch || selectedDay !== 'all' || completionStatus !== 'all') && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
                <Typography variant="body2" color="text.secondary">
                  <i className="ri-filter-line" style={{ marginRight: 8 }} />
                  Đang lọc:
                  {studentSearch && (
                    <Chip
                      label={`Học sinh: "${studentSearch}"`}
                      size="small"
                      sx={{ ml: 1, mr: 1 }}
                      onDelete={() => setStudentSearch('')}
                    />
                  )}
                  {selectedDay !== 'all' && (
                    <Chip
                      label={`Ngày: ${selectedDay}`}
                      size="small"
                      sx={{ ml: 1, mr: 1 }}
                      onDelete={() => setSelectedDay('all')}
                    />
                  )}
                  {completionStatus !== 'all' && (
                    <Chip
                      label={`Trạng thái: ${completionStatus === 'completed' ? 'Đã hoàn thành' : 'Chưa hoàn thành'}`}
                      size="small"
                      sx={{ ml: 1 }}
                      onDelete={() => setCompletionStatus('all')}
                    />
                  )}
                </Typography>
              </Box>
            )}
          </Box>

          <TableContainer sx={{
            maxHeight: '70vh',
            overflow: 'auto',
            border: '1px solid #e0e0e0',
            borderRadius: '8px'
          }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <StyledHeaderCell sx={{ minWidth: '120px', position: 'sticky', left: 0, zIndex: 3 }}>
                    <Typography variant="body2" fontWeight={600}>Thứ</Typography>
                  </StyledHeaderCell>
                  <StyledHeaderCell sx={{ minWidth: '100px', position: 'sticky', left: 120, zIndex: 3 }}>
                    <Typography variant="body2" fontWeight={600}>Khung giờ</Typography>
                  </StyledHeaderCell>
                  {filteredStudents.map((student) => (
                    <StyledHeaderCell key={student.id}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {student.profile.fullname}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {student.course?.name || 'Chưa có khóa học'}
                        </Typography>
                      </Box>
                    </StyledHeaderCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTimeSlots.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={filteredStudents.length + 2} align="center" sx={{ py: 4 }}>
                      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                        <i className="ri-calendar-line" style={{ fontSize: '48px', color: '#ccc' }} />
                        <Typography variant="h6" color="text.secondary">
                          Không có dữ liệu phù hợp
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Thử thay đổi bộ lọc để xem kết quả khác
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  (() => {
                    const groups: Record<string, { day: string; slots: typeof filteredTimeSlots }> = {}
                    filteredTimeSlots.forEach(s => {
                      const key = s.day
                      if (!groups[key]) groups[key] = { day: s.day, slots: [] as any }
                      groups[key].slots.push(s)
                    })
                    return Object.values(groups).flatMap(group =>
                      group.slots.map((slot, idx) => (
                        <TableRow key={`${group.day}-${slot.time}`}>
                          {idx === 0 && (
                            <StyledDayCell rowSpan={group.slots.length}>
                              {group.day}
                            </StyledDayCell>
                          )}
                          <StyledTimeCell sx={{ left: 120 }}>
                            <Typography variant="caption" color="primary">{slot.time}</Typography>
                          </StyledTimeCell>
                          {filteredStudents.map((student) => {
                            const isBusy = isStudentBusy(student.profile.busyScheduleArr, slot.slot)

                            return (
                              <ScheduleCell
                                key={`${student.id}-${slot.slot}`}
                                isBusy={isBusy}
                                isTeaching={false}
                                isEditable={true}
                                onClick={() => handleCellClick(
                                  student.id,
                                  slot.slot,
                                  slot.day,
                                  slot.time
                                )}
                              >

                                <Tooltip
                                  title={
                                    isBusy
                                      ? `${student.profile.fullname} bận vào ${slot.day} ${slot.time}`
                                      : `${student.profile.fullname} rảnh vào ${slot.day} ${slot.time}`
                                  }
                                >
                                  <IconButton size="small">
                                    {isBusy ? (
                                      <i className="ri-close-line" style={{ color: '#c62828', fontSize: '18px' }} />
                                    ) : (
                                      <i className="ri-check-line" style={{ color: '#2e7d32', fontSize: '18px' }} />
                                    )}
                                  </IconButton>
                                </Tooltip>

                              </ScheduleCell>
                            )
                          })}
                        </TableRow>
                      ))
                    )
                  })()
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Summary */}
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Thống kê {filteredStudents.length !== studentData?.users?.length && `(${filteredStudents.length}/${studentData?.users?.length} học sinh)`}
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              {filteredStudents.map((student) => {
                // Note: busyScheduleArr contains API indices (1-42), not UI indices (0-41)
                const busySlots = student.profile.busyScheduleArr?.length || 0
                const totalSlots = SCHEDULE_TIME.length
                const freeSlots = totalSlots - busySlots

                return (
                  <Card key={student.id} variant="outlined" sx={{ minWidth: 200 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {student.profile.fullname}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" mt={1}>
                        <Typography variant="body2" sx={{ color: '#2e7d32' }}>
                          Rảnh: {freeSlots}/{totalSlots}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#c62828' }}>
                          Bận: {busySlots}/{totalSlots}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mt={0.5}>
                        <Typography variant="body2" sx={{ color: '#1976d2' }}>
                          Khóa học: {student.course?.name || 'Chưa có'}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={0.5} mt={1}>
                        <Chip
                          label={student.profile.ieltsPoint || 'N/A'}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                )
              })}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Edit Schedule Dialog */}
      <Dialog open={editDialog.open} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <i className="ri-calendar-edit-line" style={{ fontSize: '24px', color: '#1976d2' }} />
            <Typography variant="h6" fontWeight={600}>
              Chỉnh sửa lịch học sinh
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Học sinh:</strong> {editDialog.studentName}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Thời gian:</strong> {editDialog.day} - {editDialog.time}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Trạng thái hiện tại:</strong>
              <Chip
                label={editDialog.currentStatus === 'busy' ? 'Bận' : 'Rảnh'}
                color={editDialog.currentStatus === 'busy' ? 'error' : 'success'}
                size="small"
                sx={{ ml: 1 }}
              />
            </Typography>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Thay đổi trạng thái:
              </Typography>
              <Box display="flex" gap={2}>
                <Button
                  variant={editDialog.currentStatus === 'free' ? 'contained' : 'outlined'}
                  color="success"
                  onClick={() => setEditDialog(prev => ({ ...prev, currentStatus: 'free' }))}
                  startIcon={<i className="ri-check-line" />}
                >
                  Rảnh
                </Button>
                <Button
                  variant={editDialog.currentStatus === 'busy' ? 'contained' : 'outlined'}
                  color="error"
                  onClick={() => setEditDialog(prev => ({ ...prev, currentStatus: 'busy' }))}
                  startIcon={<i className="ri-close-line" />}
                >
                  Bận
                </Button>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} color="inherit">
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveSchedule}
            disabled={updateStudentBusyScheduleMutation.isPending}
            startIcon={
              updateStudentBusyScheduleMutation.isPending ?
                <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }} /> :
                <i className="ri-save-line" />
            }
          >
            {updateStudentBusyScheduleMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSV Upload Preview Dialog */}
      <Dialog
        open={uploadDialog.open}
        onClose={handleCloseUploadDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <i className="ri-file-upload-line" style={{ fontSize: '24px', color: '#1976d2' }} />
              <Typography variant="h6" fontWeight={600}>
                Xem trước dữ liệu CSV
              </Typography>
            </Box>
            {uploadDialog.previewData && (
              <Chip
                label={`${uploadDialog.previewData.filter(item => !item.errors || item.errors.length === 0).length}/${uploadDialog.previewData.length} hợp lệ`}
                color={uploadDialog.previewData.some(item => item.errors && item.errors.length > 0) ? 'warning' : 'success'}
                size="small"
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {uploadDialog.previewData && (
            <Box sx={{ mt: 2 }}>
              <TableContainer sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <StyledHeaderCell>Email</StyledHeaderCell>
                      <StyledHeaderCell>Họ tên</StyledHeaderCell>
                      <StyledHeaderCell>Lớp</StyledHeaderCell>
                      <StyledHeaderCell>Số khung giờ bận</StyledHeaderCell>
                      <StyledHeaderCell>Khung giờ bận</StyledHeaderCell>
                      <StyledHeaderCell>Lỗi</StyledHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {uploadDialog.previewData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.email}</TableCell>
                        <TableCell>{item.fullname}</TableCell>
                        <TableCell>{item.className}</TableCell>
                        <TableCell>{item.busyScheduleArr.length}</TableCell>
                        <TableCell>
                          <Box display="flex" gap={0.5} flexWrap="wrap">
                            {item.busyScheduleArr.map(slot => {
                              const slotIndex = slot - 1 // Convert to 0-based
                              const scheduleTime = SCHEDULE_TIME[slotIndex]
                              if (!scheduleTime) return null
                              const parts = scheduleTime.split(' ')
                              const time = parts[0]
                              const day = getDayInVietnamese(parts[1])
                              return (
                                <Chip
                                  key={slot}
                                  label={`${day} ${time}`}
                                  size="small"
                                  variant="outlined"
                                />
                              )
                            })}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {item.errors && item.errors.length > 0 ? (
                            <Box>
                              {item.errors.map((error, errIndex) => (
                                <Typography
                                  key={errIndex}
                                  variant="caption"
                                  color="error"
                                  display="block"
                                >
                                  {error}
                                </Typography>
                              ))}
                            </Box>
                          ) : (
                            <Chip label="Hợp lệ" color="success" size="small" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog} color="inherit">
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitBatchUpdate}
            disabled={batchOrderScheduleMutation.isPending || !uploadDialog.previewData || uploadDialog.previewData.filter(item => !item.errors || item.errors.length === 0).length === 0}
            startIcon={
              batchOrderScheduleMutation.isPending ?
                <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }} /> :
                <i className="ri-check-line" />
            }
          >
            {batchOrderScheduleMutation.isPending ? 'Đang cập nhật...' : 'Xác nhận cập nhật'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default EditStudentSchedule
