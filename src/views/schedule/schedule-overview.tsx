'use client'

// React Imports
import { useMemo, useState } from 'react'

// Styled Components
import { styled } from '@mui/material/styles'

// MUI Imports
import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'

// Hooks
import { SCHEDULE_TIME, useGetAllSchedule } from '@/@core/hooks/useSchedule'
import { useCourseList } from '@/@core/hooks/useCourse'
import ScheduleDetailPopup from '@/views/teachers/ScheduleDetailPopup'

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
  minWidth: 180,
  borderRight: `1px solid ${theme.palette.divider}`
}))

const ScheduleOverview = () => {
  // Course data and selection
  const { data: courses, isLoading: isCoursesLoading, error: coursesError } = useCourseList()
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')

  const [popup, setPopup] = useState<{
    open: boolean
    classId: string
    lesson: number
    teacherName: string
    className: string
    scheduleTime: number
  }>({ open: false, classId: '', lesson: 0, teacherName: '', className: '', scheduleTime: 0 })

  // Schedules for the selected course (exclude makeup)
  const { data: courseSchedules, isLoading: isCourseSchedulesLoading } = useGetAllSchedule(selectedCourseId)
  const visibleSchedules = useMemo(() => (courseSchedules || []).filter(s => !s.is_makeup), [courseSchedules])

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

  const keyFromSlotIndex = (slotIndex1Based: number) => {
    const slot = parsedSlots[slotIndex1Based - 1]

    
return slot ? `${slot.day}|${slot.time}` : ''
  }

  const schedulesByKey = useMemo(() => {
    const map: Record<string, any[]> = {}

    visibleSchedules.forEach(s => {
      const key = keyFromSlotIndex(s.schedule_time)

      if (!key) return
      if (!map[key]) map[key] = []
      map[key].push(s)
    })
    
return map
  }, [visibleSchedules])

  const getDayInVietnamese = (englishDay: string) => {
    const dayMap: { [key: string]: string } = {
      Monday: 'Thứ 2',
      Tuesday: 'Thứ 3',
      Wednesday: 'Thứ 4',
      Thursday: 'Thứ 5',
      Friday: 'Thứ 6',
      Saturday: 'Thứ 7',
      Sunday: 'Chủ nhật'
    }

    
return dayMap[englishDay] || englishDay
  }

  const handleOpenPopup = (s: any) => {
    setPopup({
      open: true,
      classId: s.class_id,
      lesson: s.lesson,
      teacherName: s.teacher_name,
      className: s.class_name,
      scheduleTime: s.schedule_time
    })
  }

  const handleClosePopup = () => setPopup(prev => ({ ...prev, open: false }))

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardHeader title="Tổng quan lịch theo khóa học" subheader="Chọn khóa học để xem lưới thời gian (Ox: khung giờ, Oy: thứ trong tuần) và điểm danh bằng cách bấm vào lớp trong ô" />
        <CardContent>
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
        </CardContent>
      </Card>

      {selectedCourseId ? (
        <Card>
          <CardHeader title="Lưới thời gian theo lớp kỹ năng" />
          <CardContent>
            {isCourseSchedulesLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
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
                        <DayCell>{getDayInVietnamese(day)}</DayCell>
                        {times.map(time => {
                          const key = `${day}|${time}`
                          const items = schedulesByKey[key] || []

                          
return (
                            <GridCell key={key}>
                              <Box display="flex" gap={0.5} flexDirection="column">
                                {items.length === 0 ? (
                                  <Typography variant="caption" color="text.secondary">-</Typography>
                                ) : (
                                  items.map((s, i) => (
                                    <Chip
                                      key={`${s.class_id}-${s.lesson}-${i}`}
                                      size="small"
                                      color="primary"
                                      label={`${s.class_name} • Buổi ${s.lesson}`}
                                      onClick={() => handleOpenPopup(s)}
                                    />
                                  ))
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
        <Alert severity="info">Hãy chọn một khóa học để xem lưới thời gian.</Alert>
      )}

      <ScheduleDetailPopup
        open={popup.open}
        onClose={handleClosePopup}
        classId={popup.classId}
        lesson={popup.lesson}
        teacherName={popup.teacherName}
        className={popup.className}
        scheduleTime={popup.scheduleTime}
      />
    </Box>
  )
}

export default ScheduleOverview 
