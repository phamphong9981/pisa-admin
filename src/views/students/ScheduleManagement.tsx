'use client'

// React Imports
import { useState, useMemo } from 'react'

import { useRouter } from 'next/navigation'

// Styled Components
import { styled } from '@mui/material/styles'

// MUI Imports
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  TablePagination,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Avatar,
  Divider,
  Fab,
  Tabs,
  Tab,
  Collapse
} from '@mui/material'

// Hooks
import { useGetAllSchedule, SCHEDULE_TIME, useCreateSchedule, useGetMakeupSchedule } from '@/@core/hooks/useSchedule'
import { useUnscheduleList } from '@/@core/hooks/useSchedule'
import { useTeacherList } from '@/@core/hooks/useTeacher'

const StyledCard = styled(Card)(({ theme }) => ({
  boxShadow: theme.shadows[6],
  borderRadius: theme.shape.borderRadius * 2,
  overflow: 'hidden',
  '& .MuiCardHeader-root': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '& .MuiCardHeader-title': {
      fontWeight: 600,
      fontSize: '1.125rem'
    }
  }
}))

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  backgroundColor: theme.palette.grey[50],
  color: theme.palette.text.primary,
  borderBottom: `2px solid ${theme.palette.divider}`,
  fontSize: '0.875rem'
}))

const StyledChip = styled(Chip)(() => ({
  fontSize: '0.75rem',
  fontWeight: 500,
  '&.busy-chip': {
    backgroundColor: '#ffcdd2',
    color: '#c62828',
    border: '1px solid #ef9a9a'
  }
}))


const PurpleHeaderBox = styled(Box)(({ theme }) => ({
  background: '#8e24aa',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 3),
  borderTopLeftRadius: theme.shape.borderRadius * 2,
  borderTopRightRadius: theme.shape.borderRadius * 2,
}))

const BlueHeaderBox = styled(Box)(({ theme }) => ({
  background: '#1976d2',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 3),
  borderTopLeftRadius: theme.shape.borderRadius * 2,
  borderTopRightRadius: theme.shape.borderRadius * 2,
}))

const ScheduleManagement = () => {
  const router = useRouter()
  
  // Hooks for all schedules
  const { data: allSchedules } = useGetAllSchedule()
  const { data: makeupSchedules, isLoading: isMakeupSchedulesLoading, error: makeupSchedulesError } = useGetMakeupSchedule()
  
  // Hooks for unscheduled students
  const { data: unscheduledStudents, isLoading: isUnscheduledLoading, error: unscheduledError } = useUnscheduleList()

  // Hooks for teachers and create schedule
  const { data: teachers, isLoading: isTeachersLoading } = useTeacherList()
  const createScheduleMutation = useCreateSchedule()

  // States for all schedules section
  const [schedulePage, setSchedulePage] = useState(0)
  const [scheduleRowsPerPage, setScheduleRowsPerPage] = useState(10)

  // States for unscheduled students section
  const [studentSearch, setStudentSearch] = useState('')
  const [studentPage, setStudentPage] = useState(0)
  const [studentRowsPerPage, setStudentRowsPerPage] = useState(10)

  // Collapse state
  const [openSchedule, setOpenSchedule] = useState(true)
  const [openUnscheduled, setOpenUnscheduled] = useState(true)

  // States for makeup class dialog
  const [openMakeupDialog, setOpenMakeupDialog] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<number>(1)
  const [createSuccess, setCreateSuccess] = useState('')
  const [createError, setCreateError] = useState('')

  // Tab state for schedule section
  const [scheduleTab, setScheduleTab] = useState(0)

  // Group makeup schedules by teacher_id + schedule_time
  const groupedMakeupSchedules = useMemo(() => {
    if (!makeupSchedules) return []

    const groupMap: Record<string, {teacher_id: string, teacher_name: string, schedule_time: number, students: {fullname?: string, email?: string, phone?: string}[]}> = {}
    
    makeupSchedules.forEach(sch => {
      const key = sch.teacher_id + '-' + sch.schedule_time
      
      if (!groupMap[key]) {
        groupMap[key] = {
          teacher_id: sch.teacher_id,
          teacher_name: sch.teacher_name,
          schedule_time: sch.schedule_time,
          students: []
        }
      }

      groupMap[key].students.push({ fullname: sch.fullname, email: sch.email, phone: sch.phone })
    })

    return Object.values(groupMap)
  }, [makeupSchedules])

  // Normal schedules (not makeup)
  const normalSchedules = useMemo(() => {
    if (!allSchedules) return []
    
return allSchedules.filter(s => !s.is_makeup)
  }, [allSchedules])
  

  // Filtered and paginated data for unscheduled students
  const filteredStudents = useMemo(() => {
    if (!unscheduledStudents) return []
    
    return unscheduledStudents.filter(student => 
      student.fullname.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.className.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.teacherName.toLowerCase().includes(studentSearch.toLowerCase())
    )
  }, [unscheduledStudents, studentSearch])

  const paginatedStudents = useMemo(() => {
    const startIndex = studentPage * studentRowsPerPage

    return filteredStudents.slice(startIndex, startIndex + studentRowsPerPage)
  }, [filteredStudents, studentPage, studentRowsPerPage])

  // Helper functions
  const formatScheduleTime = (scheduleTimeIndex: number) => {
    return SCHEDULE_TIME[scheduleTimeIndex - 1] || 'Chưa có lịch'
  }

  const getClassTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'FT_listening': 'Nghe',
      'FT_writing': 'Viết', 
      'FT_reading': 'Đọc',
      'FT_speaking': 'Nói'
    }

    return typeMap[type] || type
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  // Handle pagination for schedules
  const handleSchedulePageChange = (event: unknown, newPage: number) => {
    setSchedulePage(newPage)
  }

  const handleScheduleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setScheduleRowsPerPage(parseInt(event.target.value, 10))
    setSchedulePage(0)
  }

  // Handle pagination for students
  const handleStudentPageChange = (event: unknown, newPage: number) => {
    setStudentPage(newPage)
  }

  const handleStudentRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStudentRowsPerPage(parseInt(event.target.value, 10))
    setStudentPage(0)
  }

  // Handle makeup class creation
  const handleCreateMakeupClass = async () => {
    if (selectedStudents.length === 0) {
      setCreateError('Vui lòng chọn ít nhất một học sinh')
      
return
    }
    
    if (!selectedTeacher) {
      setCreateError('Vui lòng chọn giáo viên')

      return
    }

    try {
      await createScheduleMutation.mutateAsync({
        profileLessonClassIds: selectedStudents,
        teacherId: selectedTeacher,
        scheduleTime: selectedTimeSlot
      })
      
      setCreateSuccess('Tạo lớp học bù thành công!')
      setCreateError('')
      
      // Reset form
      setSelectedStudents([])
      setSelectedTeacher('')
      setSelectedTimeSlot(1)
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        setOpenMakeupDialog(false)
        setCreateSuccess('')
      }, 2000)
      
    } catch (error) {
      setCreateError('Có lỗi xảy ra khi tạo lớp học bù')
      setCreateSuccess('')
    }
  }

  // Check if teacher is available at selected time slot
  const isTeacherAvailable = (teacherId: string, timeSlot: number) => {
    const teacher = teachers?.find(t => t.id === teacherId)

    if (!teacher) return false
    
    return !teacher.registeredBusySchedule.includes(timeSlot - 1)
  }

  // Get students that can be scheduled at selected time slot
  const getAvailableStudents = () => {
    if (!unscheduledStudents) return []
    
    return unscheduledStudents.filter(student => 
      !student.busySchedule.includes(selectedTimeSlot - 1)
    )
  }

  // Check if student is available at selected time slot
  const isStudentAvailable = (student: any) => {
    return !student.busySchedule.includes(selectedTimeSlot - 1)
  }

  return (
    <Box>
      {/* Floating Action Button for Create Makeup Class */}
      <Fab
        color="secondary"
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 1200,
          width: 72,
          height: 72,
          boxShadow: '0 8px 32px 0 rgba(255,87,34,0.35)',
          border: '3px solid #fff',
          background: 'linear-gradient(135deg, #ff512f 0%, #f9d423 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.25s cubic-bezier(.4,2,.6,1)',
          '&:hover': {
            background: 'linear-gradient(135deg, #f9d423 0%, #ff512f 100%)',
            boxShadow: '0 12px 36px 0 rgba(255,87,34,0.45)',
            transform: 'scale(1.12) rotate(-8deg)'
          }
        }}
        onClick={() => setOpenMakeupDialog(true)}
      >
        <Tooltip title="Tạo lớp học bù">
          <i className="ri-calendar-schedule-line" style={{ fontSize: '2.2rem', color: '#fff', fontWeight: 700 }} />
        </Tooltip>
      </Fab>

      <Grid container spacing={3}>
        {/* All Schedules Section */}
        <Grid item xs={12} lg={12}>
          <StyledCard>
            <PurpleHeaderBox>
              <Typography fontWeight={700} fontSize="1.125rem">
                Tất cả các lịch học
              </Typography>
              <IconButton onClick={() => setOpenSchedule(v => !v)} sx={{ color: '#fff' }}>
                {openSchedule ? (
                  <i className="ri-arrow-up-s-line" />
                ) : (
                  <i className="ri-arrow-down-s-line" />
                )}
              </IconButton>
            </PurpleHeaderBox>
            {openSchedule && (
              <CardContent>
                {/* Tabs for normal/makeup schedule */}
                <Tabs
                  value={scheduleTab}
                  onChange={(_, v) => setScheduleTab(v)}
                  sx={{ mb: 3 }}
                  indicatorColor="secondary"
                  textColor="secondary"
                >
                  <Tab label="Lịch thường" />
                  <Tab label="Lịch bù" />
                </Tabs>
                {/* Lịch thường */}
                <Collapse in={scheduleTab === 0}>
                  <TableContainer component={Paper} sx={{ maxHeight: '500px' }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <StyledTableCell>Tên lớp</StyledTableCell>
                          <StyledTableCell>Loại lớp</StyledTableCell>
                          <StyledTableCell>Giáo viên</StyledTableCell>
                          <StyledTableCell>Buổi học</StyledTableCell>
                          <StyledTableCell>Thời gian</StyledTableCell>
                          <StyledTableCell align="center">Hành động</StyledTableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {normalSchedules.map((schedule, index) => (
                          <TableRow key={`${schedule.class_id}-${schedule.lesson}-${index}`} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {schedule.class_name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={getClassTypeLabel(schedule.class_type)}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {schedule.teacher_name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={`Buổi ${schedule.lesson}`}
                                size="small"
                                sx={{ 
                                  backgroundColor: '#fff3e0',
                                  color: '#e65100',
                                  border: '1px solid #ffcc02'
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="primary">
                                {formatScheduleTime(schedule.schedule_time)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Xem chi tiết lớp học">
                                <IconButton 
                                  size="small" 
                                  color="primary"
                                  onClick={() => router.push(`/classes/${schedule.class_id}`)}
                                >
                                  <i className="ri-eye-line" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    component="div"
                    count={normalSchedules.length}
                    page={schedulePage}
                    onPageChange={handleSchedulePageChange}
                    rowsPerPage={scheduleRowsPerPage}
                    onRowsPerPageChange={handleScheduleRowsPerPageChange}
                    labelRowsPerPage="Số hàng mỗi trang:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} trong ${count}`}
                  />
                </Collapse>
                {/* Lịch bù */}
                <Collapse in={scheduleTab === 1}>
                  <Box sx={{ maxHeight: 500, overflowY: 'auto' }}>
                    {isMakeupSchedulesLoading ? (
                      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                        <CircularProgress />
                      </Box>
                    ) : makeupSchedulesError ? (
                      <Alert severity="error">Lỗi khi tải lịch bù: {makeupSchedulesError.message}</Alert>
                    ) : groupedMakeupSchedules.length === 0 ? (
                      <Alert severity="info">Không có lịch bù nào</Alert>
                    ) : (
                      groupedMakeupSchedules.map((group) => (
                        <Card key={group.teacher_id + '-' + group.schedule_time} sx={{ mb: 3, boxShadow: 2 }}>
                          <CardHeader
                            avatar={<Avatar>{getInitials(group.teacher_name)}</Avatar>}
                            title={<>
                              <Typography fontWeight={600}>{group.teacher_name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatScheduleTime(group.schedule_time)}
                              </Typography>
                            </>}
                          />
                          <CardContent>
                            <Typography variant="subtitle2" mb={1}>Danh sách học sinh:</Typography>
                            <Box component="ul" sx={{ pl: 3, mb: 0 }}>
                              {group.students.map((stu, i) => (
                                <li key={i}>
                                  <Typography variant="body2" display="inline" fontWeight={500}>{stu.fullname || '-'}</Typography>
                                  <Typography variant="caption" color="text.secondary" ml={1}>{stu.email || ''}</Typography>
                                  {stu.phone && (
                                    <Typography variant="caption" color="text.secondary" ml={1}>{stu.phone}</Typography>
                                  )}
                                </li>
                              ))}
                            </Box>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </Box>
                </Collapse>
              </CardContent>
            )}
          </StyledCard>
        </Grid>

        {/* Unscheduled Students Section */}
        <Grid item xs={12} lg={12}>
          <StyledCard>
            <BlueHeaderBox>
              <Typography fontWeight={700} fontSize="1.125rem">
                Danh sách học sinh đang thiếu lịch học
              </Typography>
              <IconButton onClick={() => setOpenUnscheduled(v => !v)} sx={{ color: '#fff' }}>
                {openUnscheduled ? (
                  <i className="ri-arrow-up-s-line" />
                ) : (
                  <i className="ri-arrow-down-s-line" />
                )}
              </IconButton>
            </BlueHeaderBox>
            {openUnscheduled && (
              <CardContent>
                {/* Search for students */}
                <TextField
                  fullWidth
                  placeholder="Tìm kiếm theo tên học sinh, email, lớp học..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <i className="ri-search-line" />
                      </InputAdornment>
                    )
                  }}
                  sx={{ mb: 3 }}
                />

                {isUnscheduledLoading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <CircularProgress />
                  </Box>
                ) : unscheduledError ? (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    Lỗi khi tải danh sách học sinh: {unscheduledError.message}
                  </Alert>
                ) : (
                  <>
                    <TableContainer component={Paper} sx={{ maxHeight: '500px' }}>
                      <Table stickyHeader>
                        <TableHead>
                          <TableRow>
                            <StyledTableCell>Học sinh</StyledTableCell>
                            <StyledTableCell>Lớp học</StyledTableCell>
                            <StyledTableCell>Buổi học</StyledTableCell>
                            <StyledTableCell>Giáo viên</StyledTableCell>
                            <StyledTableCell>Lịch bận</StyledTableCell>
                            <StyledTableCell align="center">Hành động</StyledTableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedStudents.map((student) => (
                            <TableRow key={student.profileLessonClassId} hover>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2" fontWeight={600}>
                                    {student.fullname}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {student.email}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2" fontWeight={600}>
                                    {student.className}
                                  </Typography>
                                  <Chip 
                                    label={getClassTypeLabel(student.classType)}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={`Buổi ${student.lesson}`}
                                  size="small"
                                  sx={{ 
                                    backgroundColor: '#fff3e0',
                                    color: '#e65100',
                                    border: '1px solid #ffcc02'
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {student.teacherName}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Box display="flex" flexWrap="wrap" gap={0.5} maxWidth="200px">
                                  {student.busySchedule.length > 0 ? (
                                    student.busySchedule.slice(0, 2).map((scheduleIndex, index) => (
                                      <StyledChip
                                        key={index}
                                        label={formatScheduleTime(scheduleIndex + 1)}
                                        size="small"
                                        className="busy-chip"
                                      />
                                    ))
                                  ) : (
                                    <Typography variant="caption" color="text.secondary">
                                      Không có lịch bận
                                    </Typography>
                                  )}
                                  {student.busySchedule.length > 2 && (
                                    <Tooltip 
                                      title={
                                        <Box sx={{ p: 1, maxWidth: 280 }}>
                                          <Typography 
                                            variant="subtitle2" 
                                            sx={{ 
                                              fontWeight: 600, 
                                              color: '#222',
                                              mb: 1,
                                              borderBottom: '1px solid #eee',
                                              pb: 0.5
                                            }}
                                          >
                                            Các khung giờ bận khác:
                                          </Typography>
                                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            {student.busySchedule.slice(2).map((scheduleIndex, index) => {
                                              const scheduleText = formatScheduleTime(scheduleIndex + 1)
                                              const [timeRange, day] = scheduleText.split(' ')

                                              return (
                                                <Box 
                                                  key={index} 
                                                  sx={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: 1,
                                                    p: 0.5,
                                                    borderRadius: 1,
                                                    backgroundColor: '#f9f9f9',
                                                    border: '1px solid #eee'
                                                  }}
                                                >
                                                  <Box 
                                                    sx={{ 
                                                      width: 8, 
                                                      height: 8, 
                                                      borderRadius: '50%', 
                                                      backgroundColor: '#ff5722',
                                                      flexShrink: 0
                                                    }} 
                                                  />
                                                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                    <Typography 
                                                      variant="caption" 
                                                      sx={{ 
                                                        fontWeight: 600, 
                                                        color: '#222',
                                                        fontSize: '0.75rem'
                                                      }}
                                                    >
                                                      {timeRange}
                                                    </Typography>
                                                    <Typography 
                                                      variant="caption" 
                                                      sx={{ 
                                                        color: '#666',
                                                        fontSize: '0.7rem'
                                                      }}
                                                    >
                                                      {day}
                                                    </Typography>
                                                  </Box>
                                                </Box>
                                              )
                                            })}
                                          </Box>
                                        </Box>
                                      }
                                      arrow
                                      componentsProps={{
                                        tooltip: {
                                          sx: {
                                            backgroundColor: '#fff',
                                            color: '#222',
                                            border: '1px solid #eee',
                                            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
                                            borderRadius: 2,
                                            maxWidth: 'none !important',
                                            p: 0
                                          }
                                        },
                                        arrow: {
                                          sx: {
                                            color: '#fff',
                                            '&::before': {
                                              border: '1px solid #eee',
                                              backgroundColor: '#fff',
                                            }
                                          }
                                        }
                                      }}
                                    >
                                      <StyledChip
                                        label={`+${student.busySchedule.length - 2}`}
                                        size="small"
                                        className="busy-chip"
                                      />
                                    </Tooltip>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Box display="flex" gap={1} justifyContent="center">
                                  <Tooltip title="Xem chi tiết lớp học">
                                    <IconButton 
                                      size="small" 
                                      color="primary"
                                      onClick={() => router.push(`/classes/${student.classId}`)}
                                    >
                                      <i className="ri-eye-line" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Sắp xếp lịch học">
                                    <IconButton 
                                      size="small" 
                                      color="success"
                                      onClick={() => {
                                        // TODO: Implement schedule assignment
                                        console.log('Schedule lesson for:', student)
                                      }}
                                    >
                                      <i className="ri-calendar-schedule-line" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <TablePagination
                      component="div"
                      count={filteredStudents.length}
                      page={studentPage}
                      onPageChange={handleStudentPageChange}
                      rowsPerPage={studentRowsPerPage}
                      onRowsPerPageChange={handleStudentRowsPerPageChange}
                      labelRowsPerPage="Số hàng mỗi trang:"
                      labelDisplayedRows={({ from, to, count }) => `${from}-${to} trong ${count}`}
                    />
                  </>
                )}
              </CardContent>
            )}
          </StyledCard>
        </Grid>
      </Grid>

      {/* Makeup Class Creation Dialog */}
      <Dialog 
        open={openMakeupDialog} 
        onClose={() => setOpenMakeupDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <i className="ri-calendar-schedule-line" style={{ fontSize: '24px', color: '#1976d2' }} />
            <Typography variant="h6" fontWeight={600}>
              Tạo lớp học bù
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Time Slot Selection */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Khung giờ học</InputLabel>
                  <Select
                    value={selectedTimeSlot}
                    onChange={(e) => setSelectedTimeSlot(e.target.value as number)}
                    label="Khung giờ học"
                  >
                    {SCHEDULE_TIME.map((time, index) => (
                      <MenuItem key={index} value={index + 1}>
                        {time}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Giáo viên</InputLabel>
                  <Select
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                    label="Giáo viên"
                    disabled={isTeachersLoading}
                  >
                    {teachers?.map((teacher) => (
                      <MenuItem 
                        key={teacher.id} 
                        value={teacher.id}
                        disabled={!isTeacherAvailable(teacher.id, selectedTimeSlot)}
                      >
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {getInitials(teacher.name)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {teacher.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {teacher.skills.join(', ')}
                            </Typography>
                            {!isTeacherAvailable(teacher.id, selectedTimeSlot) && (
                              <Typography variant="caption" color="error">
                                Bận trong khung giờ này
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Student Selection */}
            <Typography variant="h6" gutterBottom>
              Chọn học sinh ({selectedStudents.length} đã chọn)
            </Typography>
            
            <Box sx={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
              {getAvailableStudents().map((student) => (
                <Box 
                  key={student.profileLessonClassId}
                  sx={{ 
                    p: 2, 
                    borderBottom: '1px solid #f0f0f0',
                    '&:last-child': { borderBottom: 'none' }
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <Checkbox
                      checked={selectedStudents.includes(student.profileLessonClassId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents(prev => [...prev, student.profileLessonClassId])
                        } else {
                          setSelectedStudents(prev => prev.filter(id => id !== student.profileLessonClassId))
                        }
                      }}
                      disabled={!isStudentAvailable(student)}
                    />
                    <Avatar sx={{ width: 40, height: 40 }}>
                      {getInitials(student.fullname)}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="body2" fontWeight={600}>
                        {student.fullname}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {student.className} - Buổi {student.lesson}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        GV: {student.teacherName}
                      </Typography>
                    </Box>
                    <Box>
                      <Chip 
                        label={getClassTypeLabel(student.classType)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                  
                  {!isStudentAvailable(student) && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      Học sinh bận trong khung giờ này
                    </Alert>
                  )}
                </Box>
              ))}
            </Box>

            {/* Messages */}
            {createSuccess && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {createSuccess}
              </Alert>
            )}
            {createError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {createError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMakeupDialog(false)}>
            Hủy
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateMakeupClass}
            disabled={createScheduleMutation.isPending || selectedStudents.length === 0 || !selectedTeacher}
            startIcon={createScheduleMutation.isPending ? <CircularProgress size={16} /> : <i className="ri-save-line" />}
          >
            {createScheduleMutation.isPending ? 'Đang tạo...' : 'Tạo lớp bù'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ScheduleManagement 
