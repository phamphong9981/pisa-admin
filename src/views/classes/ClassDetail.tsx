'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Badge,
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
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material'
import { styled } from '@mui/material/styles'

import { useClass, useUnregisterStudentFromClass } from '@/@core/hooks/useClass'
import { SCHEDULE_TIME, useClassSchedule, useUpdateLessonSchedule } from '@/@core/hooks/useSchedule'
import { useTeacherList } from '@/@core/hooks/useTeacher'
import RegisterStudentForm from './RegisterStudentForm'

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3)
}))

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 500,
  color: theme.palette.text.primary
}))

const getClassTypeColor = (classType: string) => {
  switch (classType) {
    case 'FT_listening': return 'primary'
    case 'FT_writing': return 'secondary'
    case 'FT_reading': return 'success'
    case 'FT_speaking': return 'warning'
    default: return 'default'
  }
}

const getClassTypeLabel = (classType: string) => {
  switch (classType) {
    case 'FT_listening': return 'Nghe'
    case 'FT_writing': return 'Viết'
    case 'FT_reading': return 'Đọc'  
    case 'FT_speaking': return 'Nói'
    default: return classType
  }
}

const getInitials = (name: string) => {
  console.log(name);
  
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
}

interface ClassDetailProps {
  classId: string
}

const ClassDetail = ({ classId }: ClassDetailProps) => {
  const router = useRouter()
  const { data: classData, isLoading, error } = useClass(classId)
  const { data: scheduleData, isLoading: isScheduleLoading, error: scheduleError } = useClassSchedule(classId)
  const { data: teachers, isLoading: isTeachersLoading } = useTeacherList()
  const unregisterMutation = useUnregisterStudentFromClass()
  const updateLessonMutation = useUpdateLessonSchedule()
  
  // States for unregister functionality
  const [selectedStudentToUnregister, setSelectedStudentToUnregister] = useState<{
    profileId: string
    username: string
    fullName: string
  } | null>(null)

  const [showUnregisterDialog, setShowUnregisterDialog] = useState(false)
  const [unregisterSuccess, setUnregisterSuccess] = useState('')
  const [unregisterError, setUnregisterError] = useState('')

  // States for lesson editing
  const [showEditLessonDialog, setShowEditLessonDialog] = useState(false)

  const [selectedLesson, setSelectedLesson] = useState<{
    lesson: number
    scheduleTime: number
    teacherId: string
    teacherName: string
  } | null>(null)

  const [editLessonForm, setEditLessonForm] = useState({
    scheduleTime: 1,
    teacherId: ''
  })

  const [updateSuccess, setUpdateSuccess] = useState('')
  const [updateError, setUpdateError] = useState('')
  
  if (isLoading || isScheduleLoading || isTeachersLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Đang tải thông tin lớp học...</Typography>
      </Box>
    )
  }
  
  if (error) {
    return (
      <Box>
        <Typography variant="h5" color="error" gutterBottom>
          Lỗi khi tải dữ liệu lớp học
        </Typography>
        <Typography color="text.secondary">
          {error.message}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => router.push(`/courses/${classData?.courseId}`)}
          sx={{ mt: 2 }}
        >
          Quay lại danh sách lớp
        </Button>
      </Box>
    )
  }

  if (!classData) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Không tìm thấy lớp học
        </Typography>
      </Box>
    )
  }

  // Sắp xếp lessons theo thứ tự buổi học (nếu có dữ liệu schedule)
  const sortedLessons = scheduleData ? [...scheduleData.lessons].sort((a, b) => a.lesson - b.lesson) : []
  
  // Hàm format thời gian từ timestamp
  const formatScheduleTime = (scheduleTimeIndex: number) => {
    return SCHEDULE_TIME[scheduleTimeIndex - 1] || 'Chưa có lịch'
  }
  
  // Unregister handlers
  const handleUnregisterClick = (student: typeof classData.students[0]) => {
    setSelectedStudentToUnregister({
      profileId: student.profileId,
      username: student.username,
      fullName: student.fullName
    })
    setShowUnregisterDialog(true)
    setUnregisterError('')
    setUnregisterSuccess('')
  }

  const handleConfirmUnregister = async () => {
    if (!selectedStudentToUnregister) return

    try {
      await unregisterMutation.mutateAsync({
        classId,
        username: selectedStudentToUnregister.username
      })
      
      setUnregisterSuccess(`Đã hủy đăng ký học sinh ${selectedStudentToUnregister.fullName} khỏi kỹ năng ${classData?.name}`)
      setShowUnregisterDialog(false)
      setSelectedStudentToUnregister(null)
      setUnregisterError('')
    } catch (error: any) {
      setUnregisterError(error.response?.data?.message || 'Có lỗi xảy ra khi hủy đăng ký học sinh')
      setShowUnregisterDialog(false)
    }
  }

  const handleCancelUnregister = () => {
    setShowUnregisterDialog(false)
    setSelectedStudentToUnregister(null)
  }

  // Lesson editing handlers
  const handleEditLessonClick = (lesson: typeof sortedLessons[0]) => {
    setSelectedLesson({
      lesson: lesson.lesson,
      scheduleTime: lesson.scheduleTime,
      teacherId: lesson.teacherId,
      teacherName: lesson.teacherName
    })
    setEditLessonForm({
      scheduleTime: lesson.scheduleTime,
      teacherId: lesson.teacherId
    })
    setShowEditLessonDialog(true)
    setUpdateError('')
    setUpdateSuccess('')
  }

  const handleUpdateLesson = async () => {
    if (!selectedLesson) return

    try {
      await updateLessonMutation.mutateAsync({
        classId,
        lesson: selectedLesson.lesson,
        scheduleTime: editLessonForm.scheduleTime,
        teacherId: editLessonForm.teacherId,
        weekId: "08a60c9a-b3f8-42f8-8ff8-c7015d4ef3e7",
        action: "update"
      })
      
      setUpdateSuccess(`Đã cập nhật thông tin buổi ${selectedLesson.lesson} thành công`)
      setShowEditLessonDialog(false)
      setSelectedLesson(null)
      setUpdateError('')
    } catch (error: any) {
      setUpdateError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin buổi học')
    }
  }

  const handleCancelEditLesson = () => {
    setShowEditLessonDialog(false)
    setSelectedLesson(null)
  }
  
  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box>
            <Typography variant="h4" gutterBottom>Chi tiết lớp kỹ năng</Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {classId}
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Button 
              variant="contained" 
              startIcon={<i className="ri-edit-line" />}
              onClick={() => router.push(`/classes/${classId}/edit`)}
            >
              Chỉnh sửa
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<i className="ri-arrow-left-line" />}
              onClick={() => router.push(`/courses/${classData.courseId}`)}
            >
              Quay lại
            </Button>
          </Box>
        </Box>

        {/* Thông tin cơ bản lớp học */}
        <StyledCard>
          <CardHeader 
            title={
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="h5">{classData.name}</Typography>
                <Chip 
                  label={getClassTypeLabel(classData.classType)} 
                  color={getClassTypeColor(classData.classType) as any}
                  size="small"
                />
              </Box>
            }
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">Giáo viên</Typography>
                  <Typography variant="body1" fontWeight={500}>{classData.teacherName}</Typography>
                </Box>
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">Tổng số học sinh</Typography>
                  <Typography variant="body1" fontWeight={500}>{classData.totalStudent} học sinh</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">Số buổi học/tuần</Typography>
                  <Typography variant="body1" fontWeight={500}>{classData.totalLessonPerWeek} buổi</Typography>
                </Box>
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">Loại kỹ năng</Typography>
                  <Typography variant="body1" fontWeight={500}>{classData.classType}</Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </StyledCard>

        {/* Danh sách học sinh */}
        <StyledCard>
          <CardHeader 
            title={
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">
                  Danh sách học sinh ({classData.students.length})
                </Typography>
              </Box>
            }
          />
          <CardContent>
            {classData.students.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">
                  Chưa có học sinh nào trong lớp này
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <StyledTableCell>Học sinh</StyledTableCell>
                      <StyledTableCell>Tên đăng nhập</StyledTableCell>
                      <StyledTableCell>Số điện thoại</StyledTableCell>
                      <StyledTableCell>Email</StyledTableCell>
                      <StyledTableCell align="center">Số buổi đăng ký</StyledTableCell>
                      <StyledTableCell align="center">Thao tác</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {classData.students.map((student) => (
                      <TableRow key={student.profileId} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {getInitials(student.fullName || "")}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {student.fullName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {student.profileId.slice(0, 8)}...
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {student.username}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {student.phoneNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {student.email}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={`${student.lessons.length} buổi`}
                            size="small"
                            color={student.lessons.length > 0 ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Xem chi tiết">
                            <IconButton size="small" color="primary">
                              <i className="ri-eye-line" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Chỉnh sửa">
                            <IconButton size="small" color="info">
                              <i className="ri-edit-line" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Hủy đăng ký">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleUnregisterClick(student)}
                              disabled={unregisterMutation.isPending}
                            >
                              <i className="ri-user-unfollow-line" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </StyledCard>

        {/* Lịch học theo từng lesson */}
        <StyledCard>
          <CardHeader 
            title={
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">
                  Lịch học theo buổi ({sortedLessons.length})
                </Typography>
                {scheduleError && (
                  <Alert severity="warning" sx={{ py: 0.5 }}>
                    Không thể tải lịch học
                  </Alert>
                )}
              </Box>
            }
          />
          <CardContent>
            {scheduleError ? (
              <Box textAlign="center" py={4}>
                <Typography color="error" gutterBottom>
                  Lỗi khi tải lịch học
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {scheduleError.message}
                </Typography>
              </Box>
            ) : sortedLessons.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">
                  Chưa có lịch học nào được sắp xếp
                </Typography>
              </Box>
            ) : (
              <Box>
                {sortedLessons.map((lesson, index) => (
                  <Accordion key={lesson.lesson} defaultExpanded={index === 0}>
                    <AccordionSummary 
                      expandIcon={<i className="ri-arrow-down-s-line" />}
                      sx={{ bgcolor: 'action.hover' }}
                    >
                      <Box display="flex" alignItems="center" gap={2} width="100%">
                        <Badge 
                          badgeContent={lesson.lesson} 
                          color="primary"
                          sx={{ 
                            '& .MuiBadge-badge': { 
                              position: 'static', 
                              transform: 'none',
                              minWidth: '24px',
                              height: '24px',
                              borderRadius: '12px'
                            } 
                          }}
                        >
                          <i className="ri-calendar-event-line text-xl" />
                        </Badge>
                        <Box flex={1}>
                          <Typography variant="h6" fontWeight={600}>
                            Buổi {lesson.lesson}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatScheduleTime(lesson.scheduleTime)}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                            <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>
                              {getInitials(lesson.teacherName || "")}
                            </Avatar>
                            <Typography variant="caption" color="text.secondary">
                              GV: {lesson.teacherName}
                            </Typography>
                          </Box>
                        </Box>
                        <Box display="flex" gap={1} alignItems="center">
                          <Chip 
                            label={`${lesson.attendingCount} có mặt`}
                            size="small"
                            color="success"
                          />
                          <Chip 
                            label={`${lesson.absentCount} vắng mặt`}
                            size="small"
                            color="warning"
                          />
                          <Tooltip title="Chỉnh sửa buổi học">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditLessonClick(lesson)
                              }}
                            >
                              <i className="ri-edit-line" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      {lesson.totalStudents === 0 ? (
                        <Box textAlign="center" py={2}>
                          <Typography color="text.secondary">
                            Chưa có học sinh nào đăng ký buổi kỹ năng này
                          </Typography>
                        </Box>
                      ) : (
                        <Box>
                          {/* Học sinh có mặt */}
                          {lesson.attendingStudents.length > 0 && (
                            <Box mb={3}>
                              <Typography variant="h6" color="success.main" gutterBottom>
                                <i className="ri-check-line" /> Học sinh có mặt ({lesson.attendingCount})
                              </Typography>
                              <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <StyledTableCell>Học sinh</StyledTableCell>
                                      <StyledTableCell>Email</StyledTableCell>
                                      <StyledTableCell>Thời gian xác nhận</StyledTableCell>
                                      <StyledTableCell align="center">Thao tác</StyledTableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {lesson.attendingStudents.map((student) => (
                                      <TableRow key={`attending-${student.profileId}-${lesson.lesson}`} hover>
                                        <TableCell>
                                          <Box display="flex" alignItems="center" gap={2}>
                                            <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                                              {getInitials(student.fullname || "")}
                                            </Avatar>
                                            <Box>
                                              <Typography variant="body2" fontWeight={500}>
                                                {student.fullname}
                                              </Typography>
                                              <Typography variant="caption" color="text.secondary">
                                                ID: {student.profileId.slice(0, 8)}...
                                              </Typography>
                                            </Box>
                                          </Box>
                                        </TableCell>
                                        <TableCell>
                                          <Typography variant="body2">
                                            {student.email}
                                          </Typography>
                                        </TableCell>
                                        <TableCell>
                                          <Typography variant="body2" color="text.secondary">
                                            {formatScheduleTime(student.scheduleTime)}
                                          </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                          <Tooltip title="Xem chi tiết">
                                            <IconButton size="small" color="primary">
                                              <i className="ri-eye-line" />
                                            </IconButton>
                                          </Tooltip>
                                          <Tooltip title="Đánh dấu vắng mặt">
                                            <IconButton size="small" color="warning">
                                              <i className="ri-close-line" />
                                            </IconButton>
                                          </Tooltip>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Box>
                          )}

                          {/* Học sinh vắng mặt */}
                          {lesson.absentStudents.length > 0 && (
                            <Box>
                              <Typography variant="h6" color="warning.main" gutterBottom>
                                <i className="ri-close-line" /> Học sinh vắng mặt ({lesson.absentCount})
                              </Typography>
                              <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <StyledTableCell>Học sinh</StyledTableCell>
                                      <StyledTableCell>Email</StyledTableCell>
                                      <StyledTableCell>Lịch trình bận</StyledTableCell>
                                      <StyledTableCell align="center">Thao tác</StyledTableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {lesson.absentStudents.map((student) => (
                                      <TableRow key={`absent-${student.profileId}-${lesson.lesson}`} hover>
                                        <TableCell>
                                          <Box display="flex" alignItems="center" gap={2}>
                                            <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}>
                                              {getInitials(student.fullname || "")}
                                            </Avatar>
                                            <Box>
                                              <Typography variant="body2" fontWeight={500}>
                                                {student.fullname}
                                              </Typography>
                                              <Typography variant="caption" color="text.secondary">
                                                ID: {student.profileId.slice(0, 8)}...
                                              </Typography>
                                            </Box>
                                          </Box>
                                        </TableCell>
                                        <TableCell>
                                          <Typography variant="body2">
                                            {student.email}
                                          </Typography>
                                        </TableCell>
                                        <TableCell>
                                          {student.busySchedule.length > 0 ? (
                                            <Box display="flex" flexWrap="wrap" gap={0.5} alignItems="center" maxWidth="300px">
                                              {student.busySchedule.length > 3 && (
                                                <Typography variant="caption" color="error.main" sx={{ mb: 0.5, width: '100%' }}>
                                                  <i className="ri-alert-line" /> {student.busySchedule.length} lịch trình bận:
                                                </Typography>
                                              )}
                                              {[...student.busySchedule]
                                                .sort((a, b) => Number(a) - Number(b))
                                                .map((busyTime, index) => (
                                                <Tooltip
                                                  key={index}
                                                  title={`Bận lúc: ${((busyTime))}`}
                                                  arrow
                                                  placement="top"
                                                >
                                                  <Chip
                                                    label={((busyTime))}
                                                    size="small"
                                                    variant="outlined"
                                                    color="error"
                                                    sx={{
                                                      fontSize: '0.7rem',
                                                      height: '22px',
                                                      backgroundColor: 'rgba(244, 67, 54, 0.08)',
                                                      borderColor: 'error.300',
                                                      color: 'error.dark',
                                                      transition: 'all 0.2s ease',
                                                      '& .MuiChip-label': {
                                                        px: 0.75,
                                                        fontWeight: 600,
                                                        letterSpacing: '0.01em'
                                                      },
                                                      '& .MuiChip-icon': {
                                                        fontSize: '14px',
                                                        marginLeft: '4px'
                                                      },
                                                      '&:hover': {
                                                        backgroundColor: 'rgba(244, 67, 54, 0.15)',
                                                        borderColor: 'error.main',
                                                        transform: 'translateY(-1px)',
                                                        boxShadow: '0 2px 4px rgba(244, 67, 54, 0.2)'
                                                      }
                                                    }}
                                                    icon={<i className="ri-time-line" />}
                                                  />
                                                </Tooltip>
                                              ))}
                                            </Box>
                                          ) : (
                                            <Box 
                                              display="flex" 
                                              alignItems="center" 
                                              gap={1}
                                              sx={{
                                                backgroundColor: 'rgba(76, 175, 80, 0.08)',
                                                borderRadius: '8px',
                                                padding: '6px 12px',
                                                border: '1px solid rgba(76, 175, 80, 0.2)'
                                              }}
                                            >
                                              <i className="ri-checkbox-circle-line" style={{ color: '#4caf50', fontSize: '16px' }} />
                                              <Typography 
                                                variant="body2" 
                                                color="success.main" 
                                                fontWeight={500}
                                                sx={{ fontSize: '0.75rem' }}
                                              >
                                                Không có lịch trình bận
                                              </Typography>
                                            </Box>
                                          )}
                                        </TableCell>
                                        <TableCell align="center">
                                          <Tooltip title="Xem chi tiết">
                                            <IconButton size="small" color="primary">
                                              <i className="ri-eye-line" />
                                            </IconButton>
                                          </Tooltip>
                                          <Tooltip title="Đánh dấu có mặt">
                                            <IconButton size="small" color="success">
                                              <i className="ri-check-line" />
                                            </IconButton>
                                          </Tooltip>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Box>
                          )}
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}
          </CardContent>
        </StyledCard>

        {/* Register Student Form */}
        <StyledCard>
          <RegisterStudentForm 
            classId={classId}
            className={classData.name}
            currentStudents={classData.students.map(s => ({
              profileId: s.profileId,
              username: s.username,
              fullName: s.fullName
            }))}
          />
        </StyledCard>

        {/* Edit Lesson Dialog */}
        <Dialog open={showEditLessonDialog} onClose={handleCancelEditLesson} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <i className="ri-edit-line text-primary" />
              Chỉnh sửa buổi học {selectedLesson?.lesson}
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedLesson && (
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box mb={2} p={2} sx={{ bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
                      <Typography variant="h6" gutterBottom>
                        Buổi {selectedLesson.lesson} - {classData.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Thời gian hiện tại: {formatScheduleTime(selectedLesson.scheduleTime)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Giáo viên hiện tại: {selectedLesson.teacherName}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Thời gian buổi học</InputLabel>
                      <Select
                        value={editLessonForm.scheduleTime}
                        onChange={(e) => setEditLessonForm(prev => ({
                          ...prev,
                          scheduleTime: Number(e.target.value)
                        }))}
                        label="Thời gian buổi học"
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
                        value={editLessonForm.teacherId}
                        onChange={(e) => setEditLessonForm(prev => ({
                          ...prev,
                          teacherId: e.target.value
                        }))}
                        label="Giáo viên"
                      >
                        {teachers?.map((teacher) => (
                          <MenuItem key={teacher.id} value={teacher.id}>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Avatar sx={{ width: 32, height: 32 }}>
                                {getInitials(teacher.name|| "")}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {teacher.name}
                                </Typography>
                                {teacher.skills.length > 0 && (
                                  <Typography variant="caption" color="text.secondary">
                                    Kỹ năng: {teacher.skills.join(', ')}
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
                
                {updateError && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {updateError}
                  </Alert>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelEditLesson} color="inherit">
              Hủy
            </Button>
            <Button
              onClick={handleUpdateLesson}
              variant="contained"
              disabled={updateLessonMutation.isPending}
              startIcon={updateLessonMutation.isPending ? <CircularProgress size={16} /> : <i className="ri-save-line" />}
            >
              {updateLessonMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Unregister Confirmation Dialog */}
        <Dialog open={showUnregisterDialog} onClose={handleCancelUnregister} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <i className="ri-alert-line text-warning" />
              Xác nhận hủy đăng ký
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedStudentToUnregister && (
              <Box>
                <Typography variant="body1" gutterBottom>
                  Bạn có chắc chắn muốn hủy đăng ký học sinh sau khỏi kỹ năng <strong>{classData?.name}</strong>?
                </Typography>
                <Box mt={2} p={2} sx={{ bgcolor: 'error.50', borderRadius: 1, border: '1px solid', borderColor: 'error.200' }}>
                  <Box display="flex" alignItems="center" gap={2} mb={1}>
                    <Avatar sx={{ bgcolor: 'error.main', width: 40, height: 40 }}>
                      {getInitials(selectedStudentToUnregister.fullName || "")}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{selectedStudentToUnregister.fullName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        @{selectedStudentToUnregister.username}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    ID: {selectedStudentToUnregister.profileId}
                  </Typography>
                </Box>
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Lưu ý:</strong> Hành động này không thể hoàn tác. Học sinh sẽ bị xóa khỏi tất cả các buổi học trong lớp.
                  </Typography>
                </Alert>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelUnregister} color="inherit">
              Hủy
            </Button>
            <Button
              onClick={handleConfirmUnregister}
              variant="contained"
              color="error"
              disabled={unregisterMutation.isPending}
              startIcon={unregisterMutation.isPending ? <CircularProgress size={16} /> : <i className="ri-user-unfollow-line" />}
            >
              {unregisterMutation.isPending ? 'Đang hủy đăng ký...' : 'Xác nhận hủy'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success Snackbar */}
        <Snackbar
          open={!!unregisterSuccess || !!updateSuccess}
          autoHideDuration={6000}
          onClose={() => {
            setUnregisterSuccess('')
            setUpdateSuccess('')
          }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => {
              setUnregisterSuccess('')
              setUpdateSuccess('')
            }} 
            severity="success" 
            variant="filled"
            sx={{ width: '100%' }}
          >
            {unregisterSuccess || updateSuccess}
          </Alert>
        </Snackbar>

        {/* Error Snackbar */}
        <Snackbar
          open={!!unregisterError || !!updateError}
          autoHideDuration={6000}
          onClose={() => {
            setUnregisterError('')
            setUpdateError('')
          }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => {
              setUnregisterError('')
              setUpdateError('')
            }} 
            severity="error" 
            variant="filled"
            sx={{ width: '100%' }}
          >
            {unregisterError || updateError}
          </Alert>
        </Snackbar>
      </Box>
  )
}

export default ClassDetail 
