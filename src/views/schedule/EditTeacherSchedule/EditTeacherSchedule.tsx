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
import { SCHEDULE_TIME, useBatchOrderSchedule } from '@/@core/hooks/useSchedule'
import { useTeacherList } from '@/@core/hooks/useTeacher'
import { useUserList } from '@/@core/hooks/useStudent'


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
  shouldForwardProp: (prop) => prop !== 'isBusy' && prop !== 'isTeaching' && prop !== 'isEditable' && prop !== 'isSelected'
})<{ isBusy?: boolean; isTeaching?: boolean; isEditable?: boolean; isSelected?: boolean }>(({ theme, isBusy, isTeaching, isEditable, isSelected }) => ({
  padding: theme.spacing(0.5),
  border: `1px solid ${isSelected ? '#1976d2' : theme.palette.divider}`,
  borderWidth: isSelected ? '2px' : '1px',
  textAlign: 'center',
  cursor: isEditable ? 'pointer' : isTeaching ? 'pointer' : 'default',
  minWidth: '120px',
  minHeight: '60px',
  backgroundColor: isSelected
    ? '#fff3e0' // Orange tint for selected
    : isTeaching
      ? '#e3f2fd' // Light blue for teaching
      : isBusy
        ? '#ffebee' // Light red for busy
        : '#f1f8e9', // Light green for free
  '&:hover': {
    backgroundColor: isSelected
      ? '#ffe0b2' // Darker orange on hover when selected
      : isEditable
        ? '#e8f5e8' // Light green on hover for editable
        : isTeaching
          ? '#bbdefb' // Darker blue on hover
          : isBusy
            ? '#ffcdd2' // Darker red on hover
            : '#dcedc8', // Darker green on hover
  },
  transition: 'background-color 0.2s ease, border 0.2s ease',
  position: 'relative'
}))

const TeachingInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.5),
  '& .class-name': {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#1976d2',
    textAlign: 'center',
    lineHeight: 1.2,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  '& .lesson-info': {
    fontSize: '0.65rem',
    color: '#666',
    backgroundColor: '#fff',
    padding: '2px 6px',
    borderRadius: '8px',
    border: '1px solid #e0e0e0'
  }
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

const EditTeacherSchedule = () => {
  const { data: teachers, isLoading, error } = useTeacherList()

  // Fetch user list to get teacher emails
  const { data: teacherUsers } = useUserList('', 'teacher')

  // For now, we'll use empty array for schedules until we have proper courseId and weekId
  const schedules: any[] = []

  // IMPORTANT: Index Mapping
  // - UI uses 0-41 index for 42 time slots
  // - API uses 1-42 index for slot numbers
  // - When checking if teacher is busy: teacherSchedule.includes(slotIndex + 1)
  // - When updating busy schedule: use (slotIndex + 1) for API calls

  // Hook for batch order schedule
  const batchOrderScheduleMutation = useBatchOrderSchedule()

  // Create a map of userId to email for teachers
  const teacherEmailMap = useMemo(() => {
    const map: Record<string, string> = {}
    if (teacherUsers?.users) {
      teacherUsers.users.forEach(user => {
        if (user.profile?.email) {
          map[user.id] = user.profile.email
        }
      })
    }
    return map
  }, [teacherUsers])

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

  // States for filtering
  const [teacherSearch, setTeacherSearch] = useState('')
  const [selectedDay, setSelectedDay] = useState<string>('all')
  const [completionStatus, setCompletionStatus] = useState<string>('all') // 'all' | 'completed' | 'incomplete'

  // States for edit dialog
  const [editDialog, setEditDialog] = useState<{
    open: boolean
    teacherId: string
    teacherName: string
    slotIndex: number
    day: string
    time: string
    currentStatus: 'busy' | 'free'
  }>({
    open: false,
    teacherId: '',
    teacherName: '',
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
      teacherName: string
      busyScheduleArr: number[]
      errors?: string[]
    }> | null
  }>({
    open: false,
    previewData: null
  })

  // States for multi-select mode
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [selectedCells, setSelectedCells] = useState<Array<{
    teacherId: string
    slotIndex: number
    day: string
    time: string
    teacherName: string
  }>>([])

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

  // Filter teachers based on search term and completion status
  const filteredTeachers = useMemo(() => {
    if (!teachers) return []

    let result = teachers

    // Filter by search term
    if (teacherSearch.trim()) {
      result = result.filter(teacher =>
        teacher.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
        teacher.skills.some(skill =>
          skill.toLowerCase().includes(teacherSearch.toLowerCase())
        )
      )
    }

    // Filter by completion status
    if (completionStatus === 'completed') {
      // Đã hoàn thành: có ít nhất 1 slot rảnh (busyScheduleArr.length < 42)
      result = result.filter(teacher => {
        const busySlots = teacher.registeredBusySchedule?.length || 0
        return busySlots < SCHEDULE_TIME.length
      })
    } else if (completionStatus === 'incomplete') {
      // Chưa hoàn thành: tất cả 42 slot đều bận (busyScheduleArr.length === 42)
      result = result.filter(teacher => {
        const busySlots = teacher.registeredBusySchedule?.length || 0
        return busySlots === SCHEDULE_TIME.length
      })
    }

    return result
  }, [teachers, teacherSearch, completionStatus])

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

  // Check if teacher is busy at specific slot
  // Note: API uses 1-42, UI uses 0-41, so we need to add 1 to convert
  const isTeacherBusy = (teacherSchedule: number[] | undefined, slotIndex: number) => {
    if (!teacherSchedule || !Array.isArray(teacherSchedule)) return false

    return teacherSchedule.includes(slotIndex + 1)
  }

  // Check if teacher is teaching at specific slot
  // Note: API uses 1-42, UI uses 0-41, so we need to add 1 to convert
  const isTeacherTeaching = (teacherId: string, slotIndex: number) => {
    if (!schedules) return false

    return schedules.some(schedule =>
      schedule.teacher_id === teacherId && schedule.schedule_time === slotIndex + 1
    )
  }

  // Get teaching info for a teacher at specific slot
  // Note: API uses 1-42, UI uses 0-41, so we need to add 1 to convert
  const getTeachingInfo = (teacherId: string, slotIndex: number) => {
    if (!schedules) return null

    return schedules.find(schedule =>
      schedule.teacher_id === teacherId && schedule.schedule_time === slotIndex + 1
    )
  }

  // Check if slot is editable (not teaching)
  const isSlotEditable = (teacherId: string, slotIndex: number) => {
    return !isTeacherTeaching(teacherId, slotIndex)
  }

  // Map time range string to slot number for teacher format
  // Examples: "8am-10am" -> slot 1, "10am-12pm" -> slot 2, "1-3pm" -> slot 3, etc.
  const mapTeacherTimeRangeToSlot = (timeRange: string, day: string): number | null => {
    if (!timeRange || !timeRange.trim()) return null

    // Normalize time range - remove spaces
    let normalized = timeRange.trim().toLowerCase().replace(/\s+/g, '')

    // Map to standard format
    let standardTime = ''

    // Handle "8am-10am" or "8:00-10:00"
    if (normalized.match(/^8am[-:]?10am|^8[-:]?00?[-:]?10/)) {
      standardTime = '8:00-10:00'
    }
    // Handle "10am-12pm" or "10:00-12:00"
    else if (normalized.match(/^10am[-:]?12pm|^10[-:]?00?[-:]?12/)) {
      standardTime = '10:00-12:00'
    }
    // Handle "1-3pm" or "13:30-15:00" or "1:30-3pm"
    else if (normalized.match(/^1[-:]?3pm|^1[.:]?30[-:]?3|^13:30[-:]?15/)) {
      standardTime = '13:30-15:00'
    }
    // Handle "3-5pm" or "15:00-17:00" (but not "13:30-15:00")
    else if (normalized.match(/^3[-:]?5pm/) && !normalized.startsWith('13') && !normalized.startsWith('1.30') && !normalized.startsWith('1:30')) {
      standardTime = '15:00-17:00'
    }
    // Handle "5-7pm" or "17:00-19:00" (but not "15:00-17:00")
    else if (normalized.match(/^5[-:]?7pm/) && !normalized.startsWith('15') && !normalized.startsWith('3-5') && !normalized.startsWith('3:5')) {
      standardTime = '17:00-19:00'
    }
    // Handle "7.30-9.30pm" or "19:30-21:30" or "7:30-9:30pm"
    else if (normalized.match(/^7[.:]?30[-:]?9[.:]?30pm|^19:30[-:]?21:30/)) {
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

  // Verify CSV header format for teacher
  const verifyTeacherCSVHeader = (headerLine: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    const fields = parseCSVLine(headerLine)

    // Expected columns (based on teacher-example.csv):
    // 0: Dấu thời gian
    // 1: Địa chỉ email
    // 2: Tên giáo viên
    // 3-9: Monday-Sunday columns
    // 10+: Other columns

    if (fields.length < 10) {
      errors.push(`Số cột không đúng. Mong đợi ít nhất 10 cột, nhận được ${fields.length}`)
    }

    // Check email column
    if (fields.length > 1 && !fields[1].toLowerCase().includes('email')) {
      errors.push('Cột 2 phải là "Địa chỉ email"')
    }

    // Check for day columns
    const expectedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    expectedDays.forEach((day, index) => {
      const columnIndex = index + 3
      if (fields.length > columnIndex && !fields[columnIndex].toLowerCase().includes(day.toLowerCase())) {
        errors.push(`Cột ${columnIndex + 1} phải chứa "${day}"`)
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Parse CSV file for teachers
  const parseTeacherCSV = (csvText: string): Array<{
    email: string
    teacherName: string
    busyScheduleArr: number[]
    errors?: string[]
  }> => {
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      return []
    }

    // Verify header
    const headerVerification = verifyTeacherCSVHeader(lines[0])
    if (!headerVerification.valid) {
      // Return error result
      return [{
        email: '',
        teacherName: '',
        busyScheduleArr: [],
        errors: ['Lỗi định dạng header: ' + headerVerification.errors.join(', ')]
      }]
    }

    // Skip header row
    const dataLines = lines.slice(1)
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const dayColumnIndices = [3, 4, 5, 6, 7, 8, 9] // Columns for Monday-Sunday (0-indexed)

    const results: Array<{
      email: string
      teacherName: string
      busyScheduleArr: number[]
      errors?: string[]
    }> = []

    dataLines.forEach((line, lineIndex) => {
      // Skip empty lines
      if (!line.trim()) return

      const fields = parseCSVLine(line)

      if (fields.length < 10) {
        results.push({
          email: '',
          teacherName: `Dòng ${lineIndex + 2}`,
          busyScheduleArr: [],
          errors: [`Số cột không đủ. Mong đợi ít nhất 10 cột, nhận được ${fields.length}`]
        })
        return
      }

      const email = fields[1]?.trim() || ''
      const teacherName = fields[2]?.trim() || ''
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
            const slot = mapTeacherTimeRangeToSlot(timeRange, day)
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
          teacherName: teacherName || `Dòng ${lineIndex + 2}`,
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
      const previewData = parseTeacherCSV(text)
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
          type: 'teacher' as const
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
        message: `Đã cập nhật lịch cho ${data.length} giáo viên thành công!`,
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
  const handleCellClick = (teacherId: string, slotIndex: number, day: string, time: string) => {
    // Multi-select mode
    if (isMultiSelectMode) {
      // Only allow selection of editable cells
      if (!isSlotEditable(teacherId, slotIndex)) return

      const teacher = teachers?.find(t => t.id === teacherId)
      if (!teacher) return

      const cellKey = `${teacherId}-${slotIndex}`
      const isAlreadySelected = selectedCells.some(cell => `${cell.teacherId}-${cell.slotIndex}` === cellKey)

      if (isAlreadySelected) {
        // Deselect
        setSelectedCells(prev => prev.filter(cell => `${cell.teacherId}-${cell.slotIndex}` !== cellKey))
      } else {
        // Select
        setSelectedCells(prev => [...prev, {
          teacherId,
          slotIndex,
          day,
          time,
          teacherName: teacher.name
        }])
      }
    } else {
      // Single select mode - open edit dialog
      if (!isSlotEditable(teacherId, slotIndex)) return

      const teacher = teachers?.find(t => t.id === teacherId)

      if (!teacher) return

      const isBusy = isTeacherBusy(teacher.registeredBusySchedule, slotIndex)

      setEditDialog({
        open: true,
        teacherId,
        teacherName: teacher.name,
        slotIndex,
        day,
        time,
        currentStatus: isBusy ? 'busy' : 'free'
      })
    }
  }

  // Handle batch update selected cells
  const handleBatchUpdateSelected = async (status: 'busy' | 'free') => {
    if (selectedCells.length === 0) return

    try {
      // Group by teacherId to batch updates per teacher
      const updatesByTeacher: Record<string, {
        teacherId: string
        slots: number[]
      }> = {}

      selectedCells.forEach(cell => {
        // Initialize if not exists
        if (!updatesByTeacher[cell.teacherId]) {
          const teacher = teachers?.find(t => t.id === cell.teacherId)

          if (teacher) {
            updatesByTeacher[cell.teacherId] = {
              teacherId: cell.teacherId,
              slots: [...(teacher.registeredBusySchedule || [])]
            }
          } else {
            // Skip if teacher not found
            console.warn(`Teacher not found: ${cell.teacherId}`)
            return
          }
        }

        // Ensure updatesByTeacher[cell.teacherId] exists before accessing slots
        if (!updatesByTeacher[cell.teacherId]) {
          console.warn(`Failed to initialize teacher: ${cell.teacherId}`)
          return
        }

        const apiSlotIndex = cell.slotIndex + 1 // Convert to 1-based

        if (status === 'busy') {
          // Add slot if not already there
          if (!updatesByTeacher[cell.teacherId].slots.includes(apiSlotIndex)) {
            updatesByTeacher[cell.teacherId].slots.push(apiSlotIndex)
          }
        } else {
          // Remove slot
          updatesByTeacher[cell.teacherId].slots = updatesByTeacher[cell.teacherId].slots.filter(
            slot => slot !== apiSlotIndex
          )
        }
      })

      // Prepare batch update data
      const batchUpdateData = Object.values(updatesByTeacher).map(({ teacherId, slots }) => {
        const teacher = teachers?.find(t => t.id === teacherId)
        if (!teacher) {
          throw new Error(`Teacher not found: ${teacherId}`)
        }

        const teacherEmail = teacherEmailMap[teacher.userId]
        if (!teacherEmail) {
          throw new Error(`Email not found for teacher: ${teacherId}`)
        }

        return {
          email: teacherEmail,
          busy_schedule_arr: slots.sort((a, b) => a - b),
          type: 'teacher' as const
        }
      })

      // Use batch order schedule to update all teachers
      await batchOrderScheduleMutation.mutateAsync({ data: batchUpdateData })

      setNotification({
        open: true,
        message: `Đã cập nhật ${selectedCells.length} ô thành công!`,
        severity: 'success'
      })

      // Clear selection
      setSelectedCells([])
      setIsMultiSelectMode(false)
    } catch (error) {
      console.error('Error batch updating cells:', error)
      setNotification({
        open: true,
        message: 'Có lỗi xảy ra khi cập nhật!',
        severity: 'error'
      })
    }
  }

  // Clear selection
  const handleClearSelection = () => {
    setSelectedCells([])
  }

  // Toggle multi-select mode
  const handleToggleMultiSelect = () => {
    setIsMultiSelectMode(prev => !prev)
    if (isMultiSelectMode) {
      // Clear selection when disabling multi-select mode
      setSelectedCells([])
    }
  }

  // Handle close edit dialog
  const handleCloseEditDialog = () => {
    setEditDialog(prev => ({ ...prev, open: false }))
  }

  // Handle save schedule changes
  const handleSaveSchedule = async () => {
    try {
      const teacher = teachers?.find(t => t.id === editDialog.teacherId)

      if (!teacher) return

      const teacherEmail = teacherEmailMap[teacher.userId]
      if (!teacherEmail) {
        setNotification({
          open: true,
          message: 'Không tìm thấy email của giáo viên!',
          severity: 'error'
        })
        return
      }

      const currentBusySchedule = [...(teacher.registeredBusySchedule || [])]
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

      // Use batch order schedule to update teacher's busy schedule
      await batchOrderScheduleMutation.mutateAsync({
        data: [{
          email: teacherEmail,
          busy_schedule_arr: newBusySchedule,
          type: 'teacher'
        }]
      })

      setNotification({
        open: true,
        message: `Đã cập nhật lịch ${editDialog.teacherName} thành công!`,
        severity: 'success'
      })
    } catch (error) {
      console.error('Error updating teacher schedule:', error)
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
        <Typography>Đang tải dữ liệu giáo viên...</Typography>
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
      {/* Chỉnh sửa lịch giáo viên */}
      <Card>
        <CardHeader
          title="Chỉnh sửa lịch giáo viên"
          subheader="Click vào ô lịch để thay đổi trạng thái bận/rảnh của giáo viên (42 khung giờ/tuần)"
          action={
            <Box display="flex" gap={1} alignItems="center">
              <Box display="flex" flexDirection="column" alignItems="center">
                <input
                  accept=".csv"
                  style={{ display: 'none' }}
                  id="csv-upload-input-teacher"
                  type="file"
                  onChange={handleFileUpload}
                />
                <label htmlFor="csv-upload-input-teacher">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<i className="ri-upload-line" />}
                  >
                    Upload CSV
                  </Button>
                </label>
                <Link
                  href="/teacher-example.csv"
                  download="teacher-example.csv"
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
              <Button
                variant={isMultiSelectMode ? 'contained' : 'outlined'}
                color={isMultiSelectMode ? 'primary' : 'inherit'}
                onClick={handleToggleMultiSelect}
                startIcon={<i className={isMultiSelectMode ? 'ri-checkbox-multiple-fill' : 'ri-checkbox-multiple-line'} />}
                size="small"
              >
                Chọn nhiều
              </Button>
              {selectedCells.length > 0 && (
                <Chip
                  label={`Đã chọn: ${selectedCells.length} ô`}
                  color="primary"
                  onDelete={handleClearSelection}
                  deleteIcon={<i className="ri-close-line" />}
                />
              )}
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
                label="Đang dạy (Không thể sửa)"
                sx={{
                  backgroundColor: '#e3f2fd',
                  color: '#1976d2',
                  border: '1px solid #bbdefb'
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
                  placeholder="Tìm kiếm theo tên giáo viên hoặc kỹ năng..."
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <i className="ri-search-line" style={{ color: '#666' }} />
                      </InputAdornment>
                    ),
                    endAdornment: teacherSearch && (
                      <InputAdornment position="end">
                        <i
                          className="ri-close-line"
                          style={{
                            color: '#666',
                            cursor: 'pointer',
                            fontSize: '18px'
                          }}
                          onClick={() => setTeacherSearch('')}
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
            {(teacherSearch || selectedDay !== 'all' || completionStatus !== 'all') && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
                <Typography variant="body2" color="text.secondary">
                  <i className="ri-filter-line" style={{ marginRight: 8 }} />
                  Đang lọc:
                  {teacherSearch && (
                    <Chip
                      label={`Giáo viên: "${teacherSearch}"`}
                      size="small"
                      sx={{ ml: 1, mr: 1 }}
                      onDelete={() => setTeacherSearch('')}
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
                  {filteredTeachers.map((teacher) => (
                    <StyledHeaderCell key={teacher.id}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {teacher.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {teacher.skills?.length || 0} kỹ năng
                        </Typography>
                      </Box>
                    </StyledHeaderCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTimeSlots.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={filteredTeachers.length + 2} align="center" sx={{ py: 4 }}>
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
                          {filteredTeachers.map((teacher) => {
                            const isBusy = isTeacherBusy(teacher.registeredBusySchedule, slot.slot)
                            const isTeaching = isTeacherTeaching(teacher.id, slot.slot)
                            const teachingInfo = getTeachingInfo(teacher.id, slot.slot)
                            const isEditable = isSlotEditable(teacher.id, slot.slot)
                            const cellKey = `${teacher.id}-${slot.slot}`
                            const isSelected = selectedCells.some(cell => `${cell.teacherId}-${cell.slotIndex}` === cellKey)

                            return (
                              <ScheduleCell
                                key={cellKey}
                                isBusy={isBusy}
                                isTeaching={isTeaching}
                                isEditable={isEditable}
                                isSelected={isSelected}
                                onClick={isEditable ? () => handleCellClick(
                                  teacher.id,
                                  slot.slot,
                                  slot.day,
                                  slot.time
                                ) : undefined}
                              >
                                {isSelected && (
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: 4,
                                      right: 4,
                                      width: 20,
                                      height: 20,
                                      borderRadius: '50%',
                                      backgroundColor: '#1976d2',
                                      color: 'white',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '12px',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    ✓
                                  </Box>
                                )}
                                {isTeaching && teachingInfo ? (
                                  <TeachingInfo>
                                    <Box className="class-name" title={teachingInfo.class_name}>
                                      {teachingInfo.class_name}
                                    </Box>
                                    <Box className="lesson-info">
                                      Buổi {teachingInfo.lesson}
                                    </Box>
                                  </TeachingInfo>
                                ) : (
                                  <Tooltip
                                    title={
                                      isEditable
                                        ? `Click để thay đổi lịch ${teacher.name} vào ${slot.day} ${slot.time}`
                                        : isBusy
                                          ? `${teacher.name} bận vào ${slot.day} ${slot.time}`
                                          : `${teacher.name} rảnh vào ${slot.day} ${slot.time}`
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
                                )}
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

          {/* Batch Update Panel */}
          {selectedCells.length > 0 && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                backgroundColor: '#e3f2fd',
                borderRadius: 1,
                border: '2px solid #1976d2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                flexWrap: 'wrap'
              }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="body1" fontWeight={600} color="primary">
                  <i className="ri-checkbox-multiple-fill" style={{ marginRight: 8 }} />
                  Đã chọn: {selectedCells.length} ô
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleClearSelection}
                  startIcon={<i className="ri-close-line" />}
                >
                  Bỏ chọn
                </Button>
              </Box>
              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleBatchUpdateSelected('free')}
                  disabled={batchOrderScheduleMutation.isPending}
                  startIcon={
                    batchOrderScheduleMutation.isPending ? (
                      <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <i className="ri-check-line" />
                    )
                  }
                >
                  Đặt tất cả là Rảnh
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => handleBatchUpdateSelected('busy')}
                  disabled={batchOrderScheduleMutation.isPending}
                  startIcon={
                    batchOrderScheduleMutation.isPending ? (
                      <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <i className="ri-close-line" />
                    )
                  }
                >
                  Đặt tất cả là Bận
                </Button>
              </Box>
            </Box>
          )}

          {/* Summary */}
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Thống kê {filteredTeachers.length !== teachers?.length && `(${filteredTeachers.length}/${teachers?.length} giáo viên)`}
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              {filteredTeachers.map((teacher) => {
                // Note: registeredBusySchedule contains API indices (1-42), not UI indices (0-41)
                const busySlots = teacher.registeredBusySchedule?.length || 0
                const teachingSlots = schedules?.filter(s => s.teacher_id === teacher.id).length || 0
                const totalSlots = SCHEDULE_TIME.length
                const freeSlots = totalSlots - busySlots - teachingSlots

                return (
                  <Card key={teacher.id} variant="outlined" sx={{ minWidth: 200 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {teacher.name}
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
                          Đang dạy: {teachingSlots}/{totalSlots}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={0.5} mt={1}>
                        {teacher.skills.map((skill, index) => (
                          <Chip
                            key={index}
                            label={skill}
                            size="small"
                            variant="outlined"
                          />
                        ))}
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
              Chỉnh sửa lịch giáo viên
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Giáo viên:</strong> {editDialog.teacherName}
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
            disabled={batchOrderScheduleMutation.isPending}
            startIcon={
              batchOrderScheduleMutation.isPending ?
                <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }} /> :
                <i className="ri-save-line" />
            }
          >
            {batchOrderScheduleMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
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
                      <StyledHeaderCell>Tên giáo viên</StyledHeaderCell>
                      <StyledHeaderCell>Số khung giờ bận</StyledHeaderCell>
                      <StyledHeaderCell>Khung giờ bận</StyledHeaderCell>
                      <StyledHeaderCell>Lỗi</StyledHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {uploadDialog.previewData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.email}</TableCell>
                        <TableCell>{item.teacherName}</TableCell>
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

export default EditTeacherSchedule
