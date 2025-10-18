'use client'

// React Imports
import { useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

// Styled Components
import { styled } from '@mui/material/styles'

// MUI Imports
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fab,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'

// Hooks
import { SCHEDULE_TIME, useCreateSchedule, useMissingSchedulesList, MissingSchedulesDto } from '@/@core/hooks/useSchedule'
import { useTeacherList } from '@/@core/hooks/useTeacher'

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

const UnscheduledStudents = () => {
  const router = useRouter()

  // Hooks for missing schedules (unscheduled students)
  const { data: missingSchedules, isLoading: isUnscheduledLoading, error: unscheduledError } = useMissingSchedulesList()

  // Hooks for teachers and create schedule
  const { data: teachers, isLoading: isTeachersLoading } = useTeacherList()
  const createScheduleMutation = useCreateSchedule()

  // States for unscheduled students section
  const [studentSearch, setStudentSearch] = useState('')

  // States for makeup class dialog
  const [openMakeupDialog, setOpenMakeupDialog] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<number>(1)
  const [createSuccess, setCreateSuccess] = useState('')
  const [createError, setCreateError] = useState('')

  // Filtered and grouped data for missing schedules (unscheduled students)
  const filteredStudents = useMemo(() => {
    if (!missingSchedules) return []

    return missingSchedules.filter(schedule =>
      schedule.fullname.toLowerCase().includes(studentSearch.toLowerCase()) ||
      schedule.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
      schedule.className.toLowerCase().includes(studentSearch.toLowerCase()) ||
      schedule.courseName.toLowerCase().includes(studentSearch.toLowerCase())
    )
  }, [missingSchedules, studentSearch])

  // Group schedules by week
  const groupedSchedules = useMemo(() => {
    if (!filteredStudents) return {}

    const grouped: { [weekId: string]: MissingSchedulesDto[] } = {}

    filteredStudents.forEach(schedule => {
      const weekId = schedule.weekId

      if (!grouped[weekId]) {
        grouped[weekId] = []
      }
      grouped[weekId].push(schedule)
    })

    return grouped
  }, [filteredStudents])

  const weekIds = Object.keys(groupedSchedules).sort()

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
    return (name || '').split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
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
    if (!missingSchedules) return []

    // For missing schedules, we can schedule them if they don't have a schedule time yet
    return missingSchedules.filter(schedule => !schedule.scheduleTime)
  }

  // Check if student is available at selected time slot
  const isStudentAvailable = (schedule: MissingSchedulesDto) => {
    // For missing schedules, they are available if they don't have a schedule time yet
    return !schedule.scheduleTime
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 6 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
            }}
          >
            <i className="ri-user-forbid-line" style={{ fontSize: '24px', color: '#fff' }} />
          </Box>
          <Box>
            <Typography variant='h4' fontWeight={700}>
              Danh sách học sinh đang thiếu lịch học
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              Quản lý và sắp xếp lịch học cho các học sinh chưa có lịch
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Floating Action Button for Create Makeup Class */}
      <Fab
        color="secondary"
        sx={{
          position: 'fixed',
          bottom: 15,
          right: 32,
          zIndex: 1200,
          width: 70,
          height: 70,
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

      {/* Section Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        color: '#fff',
        p: 3,
        borderRadius: 2,
        mb: 3,
        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
      }}>
        <Typography fontWeight={700} fontSize="1.125rem">
          Danh sách học sinh đang thiếu lịch học
        </Typography>
      </Box>

      {/* Search for students */}
      <TextField
        fullWidth
        placeholder="Tìm kiếm theo tên học sinh, email, lớp học..."
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
          mb: 3,
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
          {/* Render schedules grouped by week */}
          {weekIds.length === 0 ? (
            <Box textAlign="center" py={4}>
              <i className="ri-user-forbid-line" style={{ fontSize: '48px', color: '#ccc' }} />
              <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                {filteredStudents.length === 0 && studentSearch
                  ? 'Không tìm thấy học sinh nào phù hợp'
                  : 'Tất cả học sinh đã có lịch học'
                }
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredStudents.length === 0 && studentSearch
                  ? 'Thử thay đổi từ khóa tìm kiếm'
                  : 'Không có học sinh nào đang thiếu lịch học'
                }
              </Typography>
            </Box>
          ) : (
            weekIds.map((weekId) => {
              const weekSchedules = groupedSchedules[weekId]
              const weekTotal = weekSchedules.length

              // Get week start date from first schedule in this week
              const firstSchedule = weekSchedules[0]
              const weekStartDate = firstSchedule?.startDate || weekId

              return (
                <Box key={weekId} sx={{ mb: 4 }}>
                  {/* Week Header */}
                  <Box sx={{
                    p: 2,
                    backgroundColor: '#f5f5f5',
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                    mb: 2
                  }}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <i className="ri-calendar-line" style={{ color: '#1976d2', fontSize: '20px' }} />
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          Tuần học
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(weekStartDate).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })} - {weekTotal} học sinh thiếu lịch
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Students Table for this week */}
                  <TableContainer component={Paper} sx={{
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <StyledTableCell>Học sinh</StyledTableCell>
                          <StyledTableCell>Lớp học</StyledTableCell>
                          <StyledTableCell>Lịch học</StyledTableCell>
                          <StyledTableCell>Trạng thái</StyledTableCell>
                          <StyledTableCell>Thời gian</StyledTableCell>
                          <StyledTableCell align="center">Hành động</StyledTableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {weekSchedules.map((student) => (
                          <TableRow key={student.scheduleId || student.classId} hover>
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
                              <Box>
                                {student.scheduleTime ? (
                                  <>
                                    <Chip
                                      label={`Buổi ${student.scheduleTime}`}
                                      size="small"
                                      sx={{
                                        backgroundColor: '#e3f2fd',
                                        color: '#1976d2',
                                        border: '1px solid #bbdefb',
                                        mb: 0.5
                                      }}
                                    />
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      {formatScheduleTime(student.scheduleTime)}
                                    </Typography>
                                  </>
                                ) : (
                                  <Chip
                                    label="Chưa có lịch"
                                    size="small"
                                    sx={{
                                      backgroundColor: '#fff3e0',
                                      color: '#e65100',
                                      border: '1px solid #ffcc02'
                                    }}
                                  />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {student.reasonStatus || 'Chưa có thông tin'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {student.startDate}
                                </Typography>
                                {student.replaceSchedule && (
                                  <Chip
                                    label="Có lớp bù"
                                    size="small"
                                    color="success"
                                    sx={{ mt: 0.5 }}
                                  />
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
                </Box>
              )
            })
          )}

          {/* Summary Stats */}
          <Box sx={{
            mt: 3,
            p: 3,
            backgroundColor: '#f8f9fa',
            borderRadius: 2,
            border: '1px solid #e9ecef',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" fontWeight={600} color="text.primary">
                  Tổng kết
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {filteredStudents.length} học sinh thiếu lịch trong {weekIds.length} tuần học
                </Typography>
              </Box>
              <Box display="flex" gap={2}>
                {weekIds.map((weekId) => {
                  const weekCount = groupedSchedules[weekId].length
                  return (
                    <Chip
                      key={weekId}
                      label={`Tuần ${weekId.slice(-4)}: ${weekCount}`}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  )
                })}
              </Box>
            </Box>
          </Box>
        </>
      )}

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
                  key={student.scheduleId || student.classId}
                  sx={{
                    p: 2,
                    borderBottom: '1px solid #f0f0f0',
                    '&:last-child': { borderBottom: 'none' }
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <Checkbox
                      checked={selectedStudents.includes(student.scheduleId || student.classId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents(prev => [...prev, student.scheduleId || student.classId])
                        } else {
                          setSelectedStudents(prev => prev.filter(id => id !== (student.scheduleId || student.classId)))
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
                        {student.className} - {student.courseName}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {student.scheduleStatus || 'Chưa có trạng thái'}
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

export default UnscheduledStudents 
