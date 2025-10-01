'use client'

// React Imports
import { useMemo, useState } from 'react'

// Styled Components
import { styled } from '@mui/material/styles'

// MUI Imports
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'

// Hooks
import { useCourseInfo, useCourseList } from '@/@core/hooks/useCourse'
import { SCHEDULE_TIME, useAutoScheduleCourse, useGetAllSchedule } from '@/@core/hooks/useSchedule'
import { useGetWeeks, WeekResponseDto } from '@/@core/hooks/useWeek'
import CreateLessonSchedule from './CreateLessonSchedule'

const StyledHeaderCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 700,
  backgroundColor: theme.palette.grey[100],
  color: theme.palette.text.primary,
  borderBottom: `2px solid ${theme.palette.divider}`,
  fontSize: '0.9rem',
  position: 'sticky',
  top: 0,
  zIndex: 1
}))

const DayCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  backgroundColor: theme.palette.grey[50],
  borderRight: `1px solid ${theme.palette.divider}`,
  minWidth: 140
}))

const GridCell = styled(TableCell)(({ theme }) => ({
  verticalAlign: 'top',
  padding: theme.spacing(1),
  minWidth: 220,
  borderRight: `1px solid ${theme.palette.divider}`
}))



const ClassBox = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 10,
  overflow: 'hidden',
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.primary.light}`,
  boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
  transition: 'all 0.2s ease',
  marginBottom: theme.spacing(1),
  '&:hover': {
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    transform: 'translateY(-2px)'
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    background: theme.palette.primary.main
  }
}))

const ClassBoxHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1),
  background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
  color: '#fff',
  borderBottom: `1px solid ${theme.palette.primary.main}`,
  fontWeight: 700,
  fontSize: '0.85rem'
}))

const ClassBoxBody = styled('div')(({ theme }) => ({
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.paper
}))

const ClassBoxSubHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.default,
  borderBottom: `1px solid ${theme.palette.divider}`,
  color: theme.palette.text.secondary,
  fontSize: '0.75rem',
}))

const SchedulePlanner = () => {
  const [selectedRegion, setSelectedRegion] = useState<number>(1) // Default to HALONG
  const { data: courses, isLoading: isCoursesLoading, error: coursesError } = useCourseList(selectedRegion)
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [classSearch, setClassSearch] = useState<string>('')

  // Week selection
  const { data: weeksData, isLoading: isWeeksLoading } = useGetWeeks()
  const [selectedWeekId, setSelectedWeekId] = useState<string>('')

  const { data: courseInfo, isLoading: isCourseInfoLoading, error: courseInfoError } = useCourseInfo(selectedCourseId, selectedWeekId)

  const { data: courseSchedules } = useGetAllSchedule(selectedCourseId, selectedWeekId)
  const autoScheduleCourseMutation = useAutoScheduleCourse()

  // Get weeks list
  const weeks = useMemo(() => {
    console.log('weeksData:', weeksData)
    return weeksData || []
  }, [weeksData])

  // Calculate end date for a week (startDate + 6 days)
  const calculateEndDate = (startDate: Date): Date => {
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 6) // Add 6 days to get the end of the week
    return endDate
  }

  // Set default week (most recent or first available)
  useMemo(() => {
    if (weeks.length > 0 && !selectedWeekId) {
      // Sort by startDate descending and take the most recent
      const sortedWeeks = [...weeks].sort((a: WeekResponseDto, b: WeekResponseDto) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      )
      setSelectedWeekId(sortedWeeks[0].id)
    }
  }, [weeks, selectedWeekId])

  // Reset selected course when region or week changes
  useMemo(() => {
    setSelectedCourseId('')
  }, [selectedRegion, selectedWeekId])

  // State for highlighting teacher's free schedule
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')

  // State for auto schedule messages
  const [autoScheduleMessage, setAutoScheduleMessage] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({
    type: null,
    message: ''
  })

  // State for export
  const [isExporting, setIsExporting] = useState(false)

  // State for create lesson schedule modal
  const [createLessonModal, setCreateLessonModal] = useState<{
    open: boolean
    selectedSlot: {
      day: string
      time: string
      slotIndex: number
    } | null
    editMode: boolean
    editData: {
      classId: string
      lesson: number
      teacherName: string
      className: string
      scheduleTime: number
    } | null
    teacherId?: string
  }>({
    open: false,
    selectedSlot: null,
    editMode: false,
    editData: null,
    teacherId: undefined
  })

  // Parse SCHEDULE_TIME into day + time
  const parsedSlots = useMemo(() => {
    return SCHEDULE_TIME.map((s) => {
      const [time, day] = s.split(' ')


      return { time, day }
    })
  }, [])

  const days = useMemo(() => {
    const seen = new Set<string>()
    const order: string[] = []

    parsedSlots.forEach(p => { if (!seen.has(p.day)) { seen.add(p.day); order.push(p.day) } })

    return order
  }, [parsedSlots])

  const times = useMemo(() => {
    const seen = new Set<string>()
    const order: string[] = []

    parsedSlots.forEach(p => { if (!seen.has(p.time)) { seen.add(p.time); order.push(p.time) } })

    return order
  }, [parsedSlots])

  const indexFromDayTime = (day: string, time: string) => {
    const idx = parsedSlots.findIndex(p => p.day === day && p.time === time)


    return idx >= 0 ? idx + 1 : -1
  }

  const keyFromSlotIndex = (slotIndex1Based: number) => {
    const slot = parsedSlots[slotIndex1Based - 1]


    return slot ? `${slot.day}|${slot.time}` : ''
  }

  const schedulesByKey = useMemo(() => {
    const map: Record<string, any[]> = {}
    const visibleSchedules = (courseSchedules || []).filter(s => !s.is_makeup)

    visibleSchedules.forEach(s => {
      const key = keyFromSlotIndex(s.schedule_time)

      if (!key) return
      if (!map[key]) map[key] = []
      map[key].push(s)
    })

    return map
  }, [courseSchedules, keyFromSlotIndex])

  const scheduledStudentIdsByIndex = useMemo(() => {
    const map: Record<number, Set<string>> = {}
    const visibleSchedules = (courseSchedules || []).filter(s => !s.is_makeup)

    visibleSchedules.forEach(s => {
      const idx = s.schedule_time

      if (!map[idx]) map[idx] = new Set<string>()
      const students: any[] = Array.isArray(s.students) ? s.students : []

      students.forEach(st => {
        if (st?.id) map[idx].add(st.id)
      })
    })

    return map
  }, [courseSchedules])

  const freeStudentsByIndex = useMemo(() => {
    const map: Record<number, { id: string; fullname: string }[]> = {}

    if (!courseInfo) return map
    const profiles = (courseInfo.profileCourses || []).map(pc => pc.profile)

    for (let i = 1; i <= SCHEDULE_TIME.length; i++) {
      map[i] = profiles
        .filter(p => !(p.busyScheduleArr || []).includes(i))
        .map(p => ({ id: p.id, fullname: p.fullname }))
    }

    return map
  }, [courseInfo])

  const filteredClasses = useMemo(() => {
    const cls = courseInfo?.classes || []

    if (!classSearch.trim()) return cls
    const keyword = classSearch.toLowerCase()


    return cls.filter(c => c.name.toLowerCase().includes(keyword))
  }, [courseInfo, classSearch])

  // Get all scheduled classes across all time slots
  const allScheduledClasses = useMemo(() => {
    const scheduledClassIds = new Set<string>()

    Object.values(schedulesByKey).forEach(schedules => {
      schedules.forEach(schedule => {
        scheduledClassIds.add(schedule.class_id)
      })
    })

    return scheduledClassIds
  }, [schedulesByKey])

  // Helper function to check if teacher is busy at specific time slot
  const isTeacherBusy = (teacherId: string, slotIndex: number) => {
    if (!courseInfo?.classes) return false

    // Find the class with this teacher
    const teacherClass = courseInfo.classes.find(cls => cls.teacherId === teacherId)

    if (!teacherClass?.teacher?.registeredBusySchedule) return false

    // Check if the teacher is busy at this slot (slotIndex is 0-based, registeredBusySchedule is 0-based)
    return teacherClass.teacher.registeredBusySchedule.includes(slotIndex)
  }

  // Helper function to check if teacher is teaching at specific time slot
  const isTeacherTeaching = (teacherId: string, slotIndex: number) => {
    if (!courseSchedules) return false

    return courseSchedules.some(schedule =>
      schedule.teacher_id === teacherId && schedule.schedule_time === slotIndex + 1
    )
  }

  // Handle click on class box to open edit lesson schedule modal
  const handleClassBoxClick = (schedule: any) => {
    const slotIndex = schedule.schedule_time - 1 // Convert to 0-based index
    const slot = parsedSlots[slotIndex]

    if (slot) {
      setCreateLessonModal({
        open: true,
        selectedSlot: {
          day: slot.day,
          time: slot.time,
          slotIndex: slotIndex
        },
        editMode: true,
        editData: {
          classId: schedule.class_id,
          lesson: schedule.lesson,
          teacherName: schedule.teacher_name,
          className: schedule.class_name,
          scheduleTime: schedule.schedule_time
        },
        teacherId: schedule.teacher_id // Truyền teacherId từ schedule
      })
    }
  }

  // Handle open create lesson schedule modal
  const handleOpenCreateLessonModal = (day: string, time: string, slotIndex: number, teacherId?: string) => {
    setCreateLessonModal({
      open: true,
      selectedSlot: { day, time, slotIndex },
      editMode: false,
      editData: null,
      teacherId
    })
  }

  // Handle close create lesson schedule modal
  const handleCloseCreateLessonModal = () => {
    setCreateLessonModal({
      open: false,
      selectedSlot: null,
      editMode: false,
      editData: null,
      teacherId: undefined
    })
  }

  // Handle class click to highlight teacher's free schedule
  const handleClassClick = (teacherId: string) => {
    if (selectedTeacherId === teacherId) {
      setSelectedTeacherId('') // Deselect if same teacher
    } else {
      setSelectedTeacherId(teacherId) // Select new teacher
    }
  }

  // Handle auto schedule course
  const handleAutoScheduleCourse = async () => {
    if (!selectedCourseId) {
      setAutoScheduleMessage({
        type: 'error',
        message: 'Vui lòng chọn một khóa học trước khi xếp lịch tự động'
      })

      return
    }

    try {
      await autoScheduleCourseMutation.mutateAsync(selectedCourseId)
      setAutoScheduleMessage({
        type: 'success',
        message: 'Xếp lịch tự động thành công! Hệ thống đã tự động sắp xếp lịch học cho khóa học này.'
      })

      // Clear message after 5 seconds
      setTimeout(() => {
        setAutoScheduleMessage({ type: null, message: '' })
      }, 5000)
    } catch (error) {
      console.error('Error auto scheduling course:', error)
      setAutoScheduleMessage({
        type: 'error',
        message: 'Có lỗi xảy ra khi xếp lịch tự động. Vui lòng thử lại.'
      })

      // Clear error message after 5 seconds
      setTimeout(() => {
        setAutoScheduleMessage({ type: null, message: '' })
      }, 5000)
    }
  }

  // Handle export to CSV
  const handleExportToCSV = () => {
    if (!selectedCourseId || !courseInfo) {
      setAutoScheduleMessage({
        type: 'error',
        message: 'Vui lòng chọn một khóa học trước khi export'
      })
      return
    }

    setIsExporting(true)

    try {
      // Prepare CSV data
      const csvData: string[][] = []

      // Add header row
      const headerRow = ['Thứ', ...times]
      csvData.push(headerRow)

      // Add data rows for each day
      days.forEach(day => {
        const row: string[] = [day]

        times.forEach(time => {
          const index = indexFromDayTime(day, time)
          const scheduled = schedulesByKey[`${day}|${time}`] || []
          const free = index > 0 ? (freeStudentsByIndex[index] || []) : []

          // Filter out scheduled students from free list
          let availableFree = free
          if (index > 0 && scheduledStudentIdsByIndex[index]) {
            const scheduledIds = scheduledStudentIdsByIndex[index]
            availableFree = free.filter(s => !scheduledIds.has(s.id))
          }

          // Create cell content
          let cellContent = ''

          // Add scheduled classes
          if (scheduled.length > 0) {
            const scheduledInfo = scheduled.map(s => {
              const students = Array.isArray(s.students) ? s.students : []
              const studentNames = students.map((st: any) => {
                const coursename = st.coursename ? ` - ${st.coursename}` : ''
                return `${st.fullname}${coursename}`
              }).join('\n')

              return `${s.class_name} (Buổi ${s.lesson}) - GV: ${s.teacher_name}${s.note ? ` - Ghi chú: ${s.note}` : ''}${studentNames ? `\nHS:\n${studentNames}` : ''}`
            }).join('\n\n')

            cellContent += `[LỊCH HỌC]\n${scheduledInfo}`
          }

          // Add free students
          if (availableFree.length > 0) {
            const freeNames = availableFree.map(s => s.fullname).join('\n')
            if (cellContent) cellContent += '\n\n'
            cellContent += `[HS RẢNH]\n${freeNames}`
          }

          // If no content, show empty
          if (!cellContent) {
            cellContent = 'Trống'
          }

          row.push(cellContent)
        })

        csvData.push(row)
      })

      // Add summary section
      csvData.push([]) // Empty row
      csvData.push(['TỔNG KẾT'])
      csvData.push(['Khóa học', courseInfo.name])
      csvData.push(['Tổng số lớp', String(courseInfo.classes?.length || 0)])
      csvData.push(['Tổng số học sinh', String(courseInfo.profileCourses?.length || 0)])

      // Count scheduled classes
      const totalScheduledClasses = Object.values(schedulesByKey).reduce((total, schedules) => total + schedules.length, 0)
      csvData.push(['Số lớp đã xếp lịch', String(totalScheduledClasses)])

      // Convert to CSV string
      const csvString = csvData.map(row =>
        row.map(cell => {
          // Escape quotes and wrap in quotes if contains newlines
          const escapedCell = cell.replace(/"/g, '""')
          return escapedCell.includes('\n') ? `"${escapedCell}"` : `"${escapedCell}"`
        }).join(',')
      ).join('\n')

      // Add BOM for UTF-8 support in Excel
      const BOM = '\uFEFF'
      const csvWithBOM = BOM + csvString

      // Create and download file
      const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', `Lich_Hoc_${courseInfo.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)

      setAutoScheduleMessage({
        type: 'success',
        message: 'Export CSV thành công! File đã được tải về.'
      })

      // Clear message after 3 seconds
      setTimeout(() => {
        setAutoScheduleMessage({ type: null, message: '' })
      }, 3000)

    } catch (error) {
      console.error('Error exporting CSV:', error)
      setAutoScheduleMessage({
        type: 'error',
        message: 'Có lỗi xảy ra khi export CSV. Vui lòng thử lại.'
      })

      // Clear error message after 3 seconds
      setTimeout(() => {
        setAutoScheduleMessage({ type: null, message: '' })
      }, 3000)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardHeader
          title="Xếp lịch học theo khóa học"
          subheader="Chọn khóa học để xem lưới thời gian và các học sinh rảnh trong từng khung giờ"
          action={
            selectedCourseId && (
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Khóa học: {courses?.find(c => c.id === selectedCourseId)?.name}
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={
                    isExporting ?
                      <CircularProgress size={16} color="inherit" /> :
                      <i className="ri-download-line" />
                  }
                  onClick={handleExportToCSV}
                  disabled={isExporting}
                  sx={{
                    minWidth: 'auto',
                    px: 2,
                    py: 1,
                    fontSize: '0.875rem'
                  }}
                >
                  {isExporting ? 'Đang export...' : 'Export CSV'}
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={
                    autoScheduleCourseMutation.isPending ?
                      <CircularProgress size={16} color="inherit" /> :
                      <i className="ri-magic-line" />
                  }
                  onClick={handleAutoScheduleCourse}
                  disabled={autoScheduleCourseMutation.isPending}
                  sx={{
                    minWidth: 'auto',
                    px: 2,
                    py: 1,
                    fontSize: '0.875rem'
                  }}
                >
                  {autoScheduleCourseMutation.isPending ? 'Đang xếp lịch...' : 'Xếp lịch tự động'}
                </Button>
              </Box>
            )
          }
        />
        <CardContent>
          {/* Region and Week Selection */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Khu vực</InputLabel>
              <Select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(Number(e.target.value))}
                label="Khu vực"
              >
                <MenuItem value={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <i className="ri-map-pin-line" style={{ color: '#1976d2' }} />
                    <span>Hạ Long</span>
                  </Box>
                </MenuItem>
                <MenuItem value={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <i className="ri-map-pin-line" style={{ color: '#1976d2' }} />
                    <span>Uông Bí</span>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 250 }}>
              <InputLabel>Tuần học</InputLabel>
              <Select
                value={selectedWeekId}
                onChange={(e) => setSelectedWeekId(e.target.value)}
                label="Tuần học"
                disabled={isWeeksLoading}
              >
                {isWeeksLoading ? (
                  <MenuItem disabled>Đang tải...</MenuItem>
                ) : weeks.length === 0 ? (
                  <MenuItem disabled>Không có dữ liệu</MenuItem>
                ) : (
                  weeks.map((week: WeekResponseDto) => {
                    const startDate = new Date(week.startDate)
                    const endDate = calculateEndDate(startDate)

                    return (
                      <MenuItem key={week.id} value={week.id}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <i className="ri-calendar-line" style={{ color: '#1976d2' }} />
                          <Box>
                            <Typography variant="body2">
                              {startDate.toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })} - {endDate.toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {week.scheduleStatus === 'open' ? 'Mở' :
                                week.scheduleStatus === 'closed' ? 'Đóng' : 'Chờ duyệt'}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    )
                  })
                )}
              </Select>
            </FormControl>
          </Box>

          {/* Course Selection */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Chọn khóa học:
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {isCoursesLoading ? (
                <CircularProgress size={20} />
              ) : coursesError ? (
                <Alert severity="error">Lỗi tải danh sách khóa học: {coursesError.message}</Alert>
              ) : (courses || []).map(course => (
                <Chip
                  key={course.id}
                  label={course.name}
                  color={selectedCourseId === course.id ? 'primary' : 'default'}
                  variant={selectedCourseId === course.id ? 'filled' : 'outlined'}
                  onClick={() => setSelectedCourseId(course.id)}
                />
              ))}
            </Box>
          </Box>

          {/* Auto schedule info */}
          {selectedCourseId && (
            <Box sx={{ mt: 2, p: 1.5, backgroundColor: '#e8f5e8', borderRadius: 1, border: '1px solid #c8e6c9' }}>
              <Typography variant="caption" color="success.main" display="block" mb={0.5}>
                <i className="ri-information-line" style={{ marginRight: 4 }} />
                <strong>Xếp lịch tự động:</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Nhấn nút &quot;Xếp lịch tự động&quot; ở góc trên bên phải để hệ thống tự động sắp xếp lịch học cho khóa học này dựa trên thời gian rảnh của học sinh và giáo viên.
              </Typography>
            </Box>
          )}

          {/* Auto schedule messages */}
          {autoScheduleMessage.type && (
            <Box sx={{ mt: 2 }}>
              <Alert
                severity={autoScheduleMessage.type}
                onClose={() => setAutoScheduleMessage({ type: null, message: '' })}
              >
                {autoScheduleMessage.message}
              </Alert>
            </Box>
          )}
        </CardContent>
      </Card>

      {selectedCourseId ? (
        <Card>
          <CardHeader title="Lưới học sinh rảnh theo khung giờ" />
          <CardContent>
            <Box display="flex" gap={1} alignItems="center" mb={2} flexWrap="wrap">
              <TextField
                label="Tìm lớp"
                size="small"
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
              />
              <Box display="flex" gap={0.5} flexWrap="wrap">
                {filteredClasses.map(cls => {
                  // Check if class has schedule
                  const hasSchedule = allScheduledClasses.has(cls.id)

                  // Get teacher info for this class
                  const teacherId = cls.teacherId || ''
                  const teacherName = cls.teacher?.name || 'Chưa có GV'

                  return (
                    <Chip
                      key={cls.id}
                      size="small"
                      label={
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <span>{cls.name}</span>
                          <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.8 }}>
                            (GV: {teacherName})
                          </Typography>
                        </Box>
                      }
                      color={hasSchedule ? 'success' : 'default'}
                      variant={hasSchedule ? 'filled' : 'outlined'}
                      onClick={() => handleClassClick(teacherId)}
                      sx={{
                        cursor: 'pointer',
                        ...(hasSchedule && {
                          backgroundColor: '#e8f5e8',
                          color: '#2e7d32',
                          borderColor: '#4caf50',
                          fontWeight: 600
                        }),
                        ...(selectedTeacherId === teacherId && {
                          backgroundColor: '#1976d2',
                          color: '#fff',
                          borderColor: '#1976d2',
                          fontWeight: 700,
                          transform: 'scale(1.05)',
                          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
                        })
                      }}
                    />
                  )
                })}
                {filteredClasses.length === 0 && (
                  <Typography variant="caption" color="text.secondary">Không có lớp phù hợp</Typography>
                )}
              </Box>
            </Box>

            {isCourseInfoLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
            ) : courseInfoError ? (
              <Alert severity="error">Lỗi tải thông tin khóa học: {courseInfoError.message}</Alert>
            ) : (
              <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <StyledHeaderCell>Thứ / Giờ</StyledHeaderCell>
                      {times.map(t => (
                        <StyledHeaderCell key={t} align="center">{t}</StyledHeaderCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {days.map(day => (
                      <TableRow key={day} hover={false}>
                        <DayCell>{day}</DayCell>
                        {times.map(time => {
                          const index = indexFromDayTime(day, time)
                          let free = index > 0 ? (freeStudentsByIndex[index] || []) : []
                          const scheduled = schedulesByKey[`${day}|${time}`] || []

                          if (index > 0 && scheduledStudentIdsByIndex[index]) {
                            const set = scheduledStudentIdsByIndex[index]

                            free = free.filter(s => !set.has(s.id))
                          }

                          // Check if this time slot should be highlighted for selected teacher
                          const shouldHighlight = selectedTeacherId && index > 0 &&
                            !isTeacherBusy(selectedTeacherId, index - 1) &&
                            !isTeacherTeaching(selectedTeacherId, index - 1)


                          return (
                            <GridCell
                              key={`${day}|${time}`}
                              sx={{
                                ...(shouldHighlight && {
                                  backgroundColor: '#e3f2fd',
                                  border: '2px solid #1976d2',
                                  position: 'relative',
                                  '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: 4,
                                    background: '#1976d2',
                                    zIndex: 2
                                  }
                                })
                              }}
                            >
                              {shouldHighlight && (
                                <Box sx={{
                                  textAlign: 'center',
                                  mb: 1,
                                  p: 0.5,
                                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                                  borderRadius: 1,
                                  border: '1px solid rgba(25, 118, 210, 0.3)'
                                }}>
                                  <Typography variant="caption" color="primary" fontWeight={600}>
                                    <i className="ri-time-line" style={{ marginRight: 4 }} />
                                    GV rảnh
                                  </Typography>
                                </Box>
                              )}

                              <Box display="flex" flexDirection="column" gap={0.75}>
                                {/* Scheduled classes as boxes */}
                                {scheduled.map((s, i) => (
                                  <ClassBox
                                    key={`${s.class_id}-${s.lesson}-${i}`}
                                    onClick={() => handleClassBoxClick(s)}
                                    sx={{ cursor: 'pointer' }}
                                  >
                                    <ClassBoxHeader>
                                      <Box display="flex" gap={1} alignItems="center">
                                        <Typography variant="body2" fontWeight={700}>{s.class_name}
                                          {s.note && (
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                              sx={{
                                                fontStyle: 'italic',
                                                fontSize: '0.7rem',
                                                lineHeight: 1.2,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical'
                                              }}
                                            >
                                              {s.note}
                                            </Typography>
                                          )}
                                        </Typography>
                                        <Chip
                                          size="small"
                                          variant="outlined"
                                          label={`Buổi ${s.lesson}`}
                                          sx={{
                                            borderColor: 'rgba(255,255,255,0.8)',
                                            color: '#fff',
                                            height: 22
                                          }}
                                        />
                                      </Box>
                                    </ClassBoxHeader>
                                    <ClassBoxSubHeader>
                                      <Box display="flex" flexDirection="column" gap={0.5} width="100%">
                                        <Typography variant="caption">GV: {s.teacher_name}</Typography>
                                        {(s.start_time || s.end_time) && (
                                          <Typography variant="caption" sx={{
                                            color: 'primary.main',
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5
                                          }}>
                                            <i className="ri-time-line" style={{ fontSize: '0.75rem' }} />
                                            {s.start_time && s.end_time
                                              ? `${s.start_time} - ${s.end_time}`
                                              : s.start_time || s.end_time
                                            }
                                          </Typography>
                                        )}
                                      </Box>
                                    </ClassBoxSubHeader>
                                    <ClassBoxBody>
                                      {Array.isArray(s.students) && s.students.length > 0 ? (
                                        <Box display="flex" gap={0.5} flexWrap="wrap">
                                          {s.students.map((st: any) => {
                                            const coursename = st.coursename ? ` - ${st.coursename}` : '';
                                            const displayLabel = st.note
                                              ? `${st.fullname}${coursename} (${st.note})`
                                              : `${st.fullname}${coursename}`;

                                            return (
                                              <Chip
                                                key={st.id}
                                                size="small"
                                                label={displayLabel}
                                                sx={{
                                                  maxWidth: '100%',
                                                  '& .MuiChip-label': {
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                  }
                                                }}
                                              />
                                            );
                                          })}
                                        </Box>
                                      ) : (
                                        <Typography variant="caption" color="text.secondary">Chưa có danh sách học sinh</Typography>
                                      )}
                                    </ClassBoxBody>
                                  </ClassBox>
                                ))}

                                {/* Free students list */}
                                <Box>
                                  {free.length > 0 ? (
                                    <Box display="flex" gap={0.5} flexWrap="wrap">
                                      {free.map(s => (
                                        <Chip key={s.id} size="small" label={s.fullname} />
                                      ))}
                                    </Box>
                                  ) : (
                                    scheduled.length === 0 ? (
                                      <Typography variant="caption" color="text.secondary">Không có HS rảnh</Typography>
                                    ) : null
                                  )}
                                </Box>

                                {/* Create Lesson Button */}
                                {free.length > 0 && (
                                  <Box sx={{ mt: 1, textAlign: 'center' }}>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="primary"
                                      startIcon={<i className="ri-add-line" />}
                                      onClick={() => handleOpenCreateLessonModal(day, time, index)}
                                      sx={{
                                        fontSize: '0.75rem',
                                        py: 0.5,
                                        px: 1,
                                        minWidth: 'auto',
                                        borderStyle: 'dashed'
                                      }}
                                    >
                                      Tạo lịch
                                    </Button>
                                  </Box>
                                )}
                              </Box>
                            </GridCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      ) : (
        <Alert severity="info">Hãy chọn một khóa học để xem lưới học sinh rảnh.</Alert>
      )}

      {/* Schedule Detail Popup */}
      {/* <ScheduleDetailPopup
        open={scheduleDetailPopup.open}
        onClose={handleCloseScheduleDetailPopup}
        classId={scheduleDetailPopup.classId}
        lesson={scheduleDetailPopup.lesson}
        teacherName={scheduleDetailPopup.teacherName}
        className={scheduleDetailPopup.className}
        scheduleTime={scheduleDetailPopup.scheduleTime}
      /> */}

      {/* Create Lesson Schedule Modal */}
      <CreateLessonSchedule
        open={createLessonModal.open}
        onClose={handleCloseCreateLessonModal}
        selectedSlot={createLessonModal.selectedSlot}
        availableStudents={(() => {
          if (!createLessonModal.selectedSlot) return []
          const index = createLessonModal.selectedSlot.slotIndex


          return index > 0 ? (freeStudentsByIndex[index] || []) : []
        })()}
        courseClasses={courseInfo?.classes || []}
        weekId={selectedWeekId}
        editMode={createLessonModal.editMode}
        editData={createLessonModal.editData}
        teacherId={createLessonModal.teacherId}
      />
    </Box>
  )
}

export default SchedulePlanner


