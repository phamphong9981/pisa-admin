'use client'

import { useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  Paper,
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

import { useCourseInfo, useRegisterCourse, useUnregisterCourse } from '@/@core/hooks/useCourse'
import { useStudentList } from '@/@core/hooks/useStudent'
import CreateClassForm from '@/views/classes/CreateClassForm'

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3)
}))

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 500,
  color: theme.palette.text.primary
}))

const getCourseTypeColor = (courseType: string) => {
  switch (courseType) {
    case 'FT_listening': return 'primary'
    case 'FT_writing': return 'secondary'
    case 'FT_reading': return 'success'
    case 'FT_speaking': return 'warning'
    default: return 'default'
  }
}

const getCourseTypeLabel = (courseType: string) => {
  switch (courseType) {
    case 'FT_listening': return 'Nghe'
    case 'FT_writing': return 'Viết'
    case 'FT_reading': return 'Đọc'  
    case 'FT_speaking': return 'Nói'
    default: return courseType
  }
}

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
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
}

interface CourseDetailProps {
  courseName: string
}

const CourseDetail = ({ courseName }: CourseDetailProps) => {
  const router = useRouter()
  const [openCreateClassDialog, setOpenCreateClassDialog] = useState(false)
  const [openRegisterDialog, setOpenRegisterDialog] = useState(false)
  const [openUnregisterDialog, setOpenUnregisterDialog] = useState(false)
  const [studentToUnregister, setStudentToUnregister] = useState<{ id: string; name: string } | null>(null)
  const [searchStudent, setSearchStudent] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])

  const [notification, setNotification] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })

  const { data: course, isLoading: isLoadingCourses, error: coursesError } = useCourseInfo(courseName)
  const { mutate: registerCourse, isPending: isRegistering } = useRegisterCourse()
  const { mutate: unregisterCourse, isPending: isUnregistering } = useUnregisterCourse()
  const { data: studentListData, isLoading: isStudentListLoading } = useStudentList(searchStudent)
  
  // Get registered student IDs
  const registeredStudentIds = useMemo(() => {
    return course?.profileCourses?.map(pc => pc.profile.id) || []
  }, [course?.profileCourses])

  // Filter out already registered students
  const availableStudents = useMemo(() => {
    if (!studentListData?.users) return []
    
return studentListData.users.filter(student => 
      !registeredStudentIds.includes(student.profile.id)
    )
  }, [studentListData?.users, registeredStudentIds])

  const classes = course?.classes

  // Lấy danh sách lớp học của khóa học này
  if (isLoadingCourses) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Đang tải thông tin lớp học...</Typography>
      </Box>
    )
  }

  if (coursesError) {
    return (
      <Box>
        <Typography variant="h5" color="error" gutterBottom>
          Lỗi khi tải dữ liệu
        </Typography>
        <Typography color="text.secondary">
          {coursesError?.message}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => router.push('/courses')}
          sx={{ mt: 2 }}
        >
          Quay lại danh sách lớp học
        </Button>
      </Box>
    )
  }

  if (!course) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Không tìm thấy lớp học
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => router.push('/courses')}
        >
          Quay lại danh sách lớp học
        </Button>
      </Box>
    )
  }
  
  // Handler for register
  const handleRegisterStudents = () => {
    if (!course?.id || selectedStudentIds.length === 0) return
    registerCourse(
      { courseId: course.id, profileIds: selectedStudentIds },
      {
        onSuccess: () => {
          setNotification({ open: true, message: 'Đăng ký học sinh thành công!', severity: 'success' })
          setOpenRegisterDialog(false)
          setSelectedStudentIds([])
        },
        onError: () => {
          setNotification({ open: true, message: 'Đăng ký học sinh thất bại!', severity: 'error' })
        }
      }
    )
  }

  // Handler for unregister
  const handleUnregisterStudent = () => {
    if (!course?.id || !studentToUnregister) return
    unregisterCourse(
      { courseId: course.id, profileId: studentToUnregister.id },
      {
        onSuccess: () => {
          setNotification({ open: true, message: 'Hủy đăng ký học sinh thành công!', severity: 'success' })
          setOpenUnregisterDialog(false)
          setStudentToUnregister(null)
        },
        onError: () => {
          setNotification({ open: true, message: 'Hủy đăng ký học sinh thất bại!', severity: 'error' })
        }
      }
    )
  }

  return (
    <>
      <Box>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box>
            <Typography variant="h4" gutterBottom>Chi tiết lớp học</Typography>
            <Typography variant="body2" color="text.secondary">
              Lớp học: {courseName}
            </Typography>
          </Box>
          <Button 
            variant="outlined" 
            startIcon={<i className="ri-arrow-left-line" />}
            onClick={() => router.push('/courses')}
          >
            Quay lại
          </Button>
        </Box>

        {/* Thông tin cơ bản khóa học */}
        <StyledCard>
          <CardHeader 
            title={
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  {getInitials(course.name)}
                </Avatar>
                <Box>
                  <Typography variant="h5">{course.name}</Typography>
                  <Chip 
                    label={getCourseTypeLabel(course.type)} 
                    color={getCourseTypeColor(course.type) as any}
                    size="small"
                  />
                </Box>
              </Box>
            }
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">Giáo viên phụ trách</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {course.teacher?.name || 'Chưa phân công'}
                  </Typography>
                </Box>
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">Loại lớp học</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {getCourseTypeLabel(course.type)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">Tổng số kỹ năng</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {course.classes.length} kỹ năng
                  </Typography>
                </Box>
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">Tổng số học sinh</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {course.profileCourses?.length || 0} học sinh
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">Trạng thái</Typography>
                  <Chip 
                    label="Đang hoạt động" 
                    color="success" 
                    size="small"
                  />
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
                  Danh sách học sinh ({course?.profileCourses?.length || 0})
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<i className="ri-user-add-line" />}
                  onClick={() => setOpenRegisterDialog(true)}
                >
                  Đăng ký học sinh
                </Button>
              </Box>
            }
          />
          <CardContent>
            {!course?.profileCourses || course.profileCourses.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">
                  Chưa có học sinh nào đăng ký khóa học này
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <StyledTableCell>Học sinh</StyledTableCell>
                      <StyledTableCell>Email</StyledTableCell>
                      <StyledTableCell>Số điện thoại</StyledTableCell>
                      <StyledTableCell>IELTS Band Score</StyledTableCell>
                      <StyledTableCell>Ngày tạo</StyledTableCell>
                      <StyledTableCell align="center">Thao tác</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {course.profileCourses.map((profileCourse) => {
                      const student = profileCourse.profile

                      
return (
                        <TableRow key={student.id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                {getInitials(student.fullname)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {student.fullname}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ID: {student.id.slice(0, 8)}...
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
                            <Typography variant="body2">
                              {student.phone || 'Chưa cập nhật'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={student.ieltsPoint || 'Chưa có điểm'} 
                              color={student.ieltsPoint ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(student.createdAt).toLocaleDateString('vi-VN')}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box display="flex" gap={1} justifyContent="center">
                              <Tooltip title="Xem chi tiết học sinh">
                                <IconButton 
                                  size="small" 
                                  color="primary"
                                  onClick={() => router.push(`/students/${student.id}`)}
                                >
                                  <i className="ri-eye-line" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Xem lịch học">
                                <IconButton 
                                  size="small" 
                                  color="info"
                                  onClick={() => router.push(`/students/${student.id}/schedule`)}
                                >
                                  <i className="ri-calendar-line" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Hủy đăng ký">
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => {
                                    setStudentToUnregister({ id: student.id, name: student.fullname })
                                    setOpenUnregisterDialog(true)
                                  }}
                                >
                                  <i className="ri-user-unfollow-line" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </StyledCard>

        {/* Popup đăng ký học sinh */}
        <Dialog
          open={openRegisterDialog}
          onClose={() => setOpenRegisterDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogContent>
            <Box mb={2} display="flex" alignItems="center" gap={2}>
              <Typography variant="h6">Đăng ký học sinh vào khóa học</Typography>
              <Box flex={1} />
              <input
                type="text"
                placeholder="Tìm kiếm học sinh theo tên, email, SĐT..."
                value={searchStudent}
                onChange={e => setSearchStudent(e.target.value)}
                style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', width: 300 }}
              />
            </Box>
            <Box maxHeight={400} overflow="auto">
              {isStudentListLoading ? (
                <Typography>Đang tải danh sách học sinh...</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <StyledTableCell></StyledTableCell>
                      <StyledTableCell>Học sinh</StyledTableCell>
                      <StyledTableCell>Email</StyledTableCell>
                      <StyledTableCell>Số điện thoại</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {availableStudents.map(student => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student.profile.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedStudentIds(prev => [...prev, student.profile.id])
                              } else {
                                setSelectedStudentIds(prev => prev.filter(id => id !== student.profile.id))
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>{student.profile.fullname}</TableCell>
                        <TableCell>{student.profile.email}</TableCell>
                        <TableCell>{student.profile.phone || 'Chưa cập nhật'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
            <Box mt={2} display="flex" justifyContent="flex-end" gap={2}>
              <Button onClick={() => setOpenRegisterDialog(false)} disabled={isRegistering}>Hủy</Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleRegisterStudents}
                disabled={selectedStudentIds.length === 0 || isRegistering}
              >
                {isRegistering ? 'Đang đăng ký...' : 'Đăng ký'}
              </Button>
            </Box>
          </DialogContent>
        </Dialog>

        {/* Danh sách lớp học */}
        <StyledCard>
          <CardHeader 
            title={
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">
                  Danh sách lớp kỹ năng ({classes?.length || 0})
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<i className="ri-add-line" />}
                  onClick={() => setOpenCreateClassDialog(true)}
                >
                  Thêm lớp kỹ năng
                </Button>
              </Box>
            }
          />
          <CardContent>
            {!classes || classes.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">
                  Chưa có kỹ năng nào trong lớp học này
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <StyledTableCell>Lớp kỹ năng</StyledTableCell>
                      <StyledTableCell>Loại kỹ năng</StyledTableCell>
                      <StyledTableCell align="center">Số học sinh</StyledTableCell>
                      <StyledTableCell align="center">Buổi/tuần</StyledTableCell>
                      <StyledTableCell>Giáo viên</StyledTableCell>
                      <StyledTableCell align="center">Thao tác</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {classes.map((classItem) => (
                      <TableRow key={classItem.id} hover onClick={() => router.push(`/classes/${classItem.id}`)}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar sx={{ bgcolor: 'secondary.main' }}>
                              {getInitials(classItem.name)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {classItem.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {classItem.id.slice(0, 8)}...
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={getClassTypeLabel(classItem.classType)} 
                            color={getClassTypeColor(classItem.classType) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Badge badgeContent={classItem.totalStudent} color="primary">
                            <Typography variant="body2">
                              {classItem.totalStudent} học sinh
                            </Typography>
                          </Badge>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {classItem.totalLessonPerWeek} buổi
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                              {getInitials(classItem.teacher?.name || '')}
                            </Avatar>
                            <Typography variant="body2">
                              {classItem.teacher?.name || 'Chưa phân công'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" gap={1} justifyContent="center">
                            <Tooltip title="Xem chi tiết lớp kỹ năng">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => router.push(`/classes/${classItem.id}`)}
                              >
                                <i className="ri-eye-line" />
                              </IconButton>
                            </Tooltip>
                            {/* <Tooltip title="Xem lịch học">
                              <IconButton 
                                size="small" 
                                color="info"
                                onClick={() => router.push(`/classes/${classItem.id}/schedule`)}
                              >
                                <i className="ri-calendar-line" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Chỉnh sửa">
                              <IconButton size="small" color="warning">
                                <i className="ri-edit-line" />
                              </IconButton>
                            </Tooltip> */}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </StyledCard>
      </Box>

      {/* Create Class Dialog */}
      <Dialog
        open={openCreateClassDialog}
        onClose={() => setOpenCreateClassDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <CreateClassForm 
            courseId={course.id} 
            onSuccess={() => setOpenCreateClassDialog(false)} 
          />
        </DialogContent>
              </Dialog>

        {/* Unregister Confirmation Dialog */}
        <Dialog
          open={openUnregisterDialog}
          onClose={() => setOpenUnregisterDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogContent>
            <Box textAlign="center" py={2}>
              <i className="ri-error-warning-line" style={{ fontSize: 48, color: '#f44336', marginBottom: 16 }} />
              <Typography variant="h6" gutterBottom>
                Xác nhận hủy đăng ký
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={3}>
                Bạn có chắc chắn muốn hủy đăng ký học sinh <strong>{studentToUnregister?.name}</strong> khỏi khóa học này?
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Hành động này không thể hoàn tác.
              </Typography>
              <Box display="flex" justifyContent="center" gap={2}>
                <Button 
                  variant="outlined" 
                  onClick={() => setOpenUnregisterDialog(false)}
                  disabled={isUnregistering}
                >
                  Hủy
                </Button>
                <Button 
                  variant="contained" 
                  color="error"
                  onClick={handleUnregisterStudent}
                  disabled={isUnregistering}
                >
                  {isUnregistering ? 'Đang xử lý...' : 'Xác nhận hủy đăng ký'}
                </Button>
              </Box>
            </Box>
          </DialogContent>
        </Dialog>

        {/* Notification */}
        <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Box
          sx={{
            backgroundColor: notification.severity === 'success' ? '#4caf50' : '#f44336',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <i className={`ri-${notification.severity === 'success' ? 'check-line' : 'error-warning-line'}`} />
          <Typography variant="body2">{notification.message}</Typography>
        </Box>
      </Snackbar>
    </>
  )
}

export default CourseDetail 
