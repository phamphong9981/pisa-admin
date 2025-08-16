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
    TextField,
    Typography
} from '@mui/material'

// Hooks
import { useCourseInfo, useCourseList } from '@/@core/hooks/useCourse'
import { SCHEDULE_TIME, useGetAllSchedule } from '@/@core/hooks/useSchedule'
import ScheduleDetailPopup from '@/components/ScheduleDetailPopup'

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
  const { data: courses, isLoading: isCoursesLoading, error: coursesError } = useCourseList()
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const { data: courseInfo, isLoading: isCourseInfoLoading, error: courseInfoError } = useCourseInfo(selectedCourseId)
  const [classSearch, setClassSearch] = useState<string>('')
  const { data: courseSchedules } = useGetAllSchedule(selectedCourseId)

  // State for schedule detail popup
  const [scheduleDetailPopup, setScheduleDetailPopup] = useState<{
    open: boolean
    classId: string
    lesson: number
    teacherName: string
    className: string
    scheduleTime: number
  }>({
    open: false,
    classId: '',
    lesson: 0,
    teacherName: '',
    className: '',
    scheduleTime: 0
  })

  // State for highlighting teacher's free schedule
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')

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
  }, [courseSchedules])

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

  // Handle click on class box to open schedule detail popup
  const handleClassBoxClick = (schedule: any) => {
    setScheduleDetailPopup({
      open: true,
      classId: schedule.class_id,
      lesson: schedule.lesson,
      teacherName: schedule.teacher_name,
      className: schedule.class_name,
      scheduleTime: schedule.schedule_time
    })
  }

  // Handle close schedule detail popup
  const handleCloseScheduleDetailPopup = () => {
    setScheduleDetailPopup(prev => ({ ...prev, open: false }))
  }

  // Handle class click to highlight teacher's free schedule
  const handleClassClick = (teacherId: string) => {
    if (selectedTeacherId === teacherId) {
      setSelectedTeacherId('') // Deselect if same teacher
    } else {
      setSelectedTeacherId(teacherId) // Select new teacher
    }
  }

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardHeader title="Xếp lịch học theo khóa học" subheader="Chọn khóa học để xem lưới thời gian và các học sinh rảnh trong từng khung giờ" />
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
                                        <Typography variant="body2" fontWeight={700}>{s.class_name}</Typography>
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
                                      <Typography variant="caption">GV: {s.teacher_name}</Typography>
                                    </ClassBoxSubHeader>
                                    <ClassBoxBody>
                                      {Array.isArray(s.students) && s.students.length > 0 ? (
                                        <Box display="flex" gap={0.5} flexWrap="wrap">
                                          {s.students.map((st: any) => (
                                            <Chip key={st.id} size="small" label={st.fullname} />
                                          ))}
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
      <ScheduleDetailPopup
        open={scheduleDetailPopup.open}
        onClose={handleCloseScheduleDetailPopup}
        classId={scheduleDetailPopup.classId}
        lesson={scheduleDetailPopup.lesson}
        teacherName={scheduleDetailPopup.teacherName}
        className={scheduleDetailPopup.className}
        scheduleTime={scheduleDetailPopup.scheduleTime}
      />
    </Box>
  )
}

export default SchedulePlanner


