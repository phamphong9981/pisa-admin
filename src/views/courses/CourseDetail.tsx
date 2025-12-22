'use client'

import { useMemo, useState, useEffect } from 'react'

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
  TextField,
  Tooltip,
  Typography,
  Checkbox
} from '@mui/material'

import { styled } from '@mui/material/styles'

import {
  useCourseInfo,
  useRegisterCourse,
  useUnregisterCourse
} from '@/@core/hooks/useCourse'
import { useStudentList } from '@/@core/hooks/useStudent'
import { useGetWeeks } from '@/@core/hooks/useWeek'
import CreateClassForm from '@/views/classes/CreateClassForm'
import ImportClassesFromCSV from '@/views/classes/ImportClassesFromCSV'
import StudentSchedulePopup from '@/views/courses/StudentSchedulePopup'
import CreateStudentDialog from '@/views/courses/CreateStudentDialog'
import {
  useDeleteClasses,
  useBatchRegisterUsersToClasses,
  useBatchUnregisterUsersFromClasses,
  useUserClassesInCourse,
  useRegisterStudentToClass,
  useUnregisterStudentFromClass
} from '@/@core/hooks/useClass'

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
  const [openImportClassDialog, setOpenImportClassDialog] = useState(false)
  const [openRegisterDialog, setOpenRegisterDialog] = useState(false)
  const [openCreateStudentDialog, setOpenCreateStudentDialog] = useState(false)
  const [openUnregisterDialog, setOpenUnregisterDialog] = useState(false)
  const [openDeleteClassesDialog, setOpenDeleteClassesDialog] = useState(false)
  const [studentToUnregister, setStudentToUnregister] = useState<{ id: string; name: string } | null>(null)
  const [searchStudent, setSearchStudent] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [selectedStudentTableIds, setSelectedStudentTableIds] = useState<string[]>([])
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([])
  const [selectedWeekId, setSelectedWeekId] = useState<string>('')
  const [openBatchRegisterDialog, setOpenBatchRegisterDialog] = useState(false)
  const [openBatchUnregisterDialog, setOpenBatchUnregisterDialog] = useState(false)
  const [openRegisterClassesDialog, setOpenRegisterClassesDialog] = useState(false)
  const [selectedStudentForClasses, setSelectedStudentForClasses] = useState<{
    id: string
    name: string
    username: string
    userId: string
  } | null>(null)
  const [selectedClassesInModal, setSelectedClassesInModal] = useState<string[]>([])

  // States for student schedule popup
  const [studentSchedulePopup, setStudentSchedulePopup] = useState<{
    open: boolean
    studentId: string
    studentName: string
  }>({
    open: false,
    studentId: '',
    studentName: ''
  })

  const [notification, setNotification] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })

  const { data: course, isLoading: isLoadingCourses, error: coursesError } = useCourseInfo(courseName, selectedWeekId || 'all')
  const { mutate: registerCourse, isPending: isRegistering } = useRegisterCourse()
  const { mutate: unregisterCourse, isPending: isUnregistering } = useUnregisterCourse()
  const { data: studentListData, isLoading: isStudentListLoading } = useStudentList(searchStudent)
  const { data: weeksData, isLoading: isLoadingWeeks } = useGetWeeks()
  const deleteClassesMutation = useDeleteClasses(courseName, selectedWeekId || 'all')
  const batchRegisterMutation = useBatchRegisterUsersToClasses(courseName)
  const batchUnregisterMutation = useBatchUnregisterUsersFromClasses(courseName)
  const registerStudentToClassMutation = useRegisterStudentToClass()
  const unregisterStudentFromClassMutation = useUnregisterStudentFromClass()
  // Get user classes in course for the selected student
  const { data: userClassesData, isLoading: isLoadingUserClasses, refetch: refetchUserClasses } = useUserClassesInCourse(
    selectedStudentForClasses?.userId || '',
    course?.id || ''
  )

  // Get registered class IDs from userClassesData
  const registeredClassIds = useMemo(() => {
    return userClassesData?.map(uc => uc.id) || []
  }, [userClassesData])

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

  // Filter classes to only show autoSchedule === true in modal
  const autoScheduleClasses = useMemo(() => {
    return classes?.filter(c => c.autoSchedule === true) || []
  }, [classes])

  useEffect(() => {
    if (!classes || classes.length === 0) {
      setSelectedClassIds([])
      return
    }

    setSelectedClassIds(prev => prev.filter(id => classes.some(cls => cls.id === id)))
  }, [classes])

  const handleToggleClassSelection = (classId: string) => {
    setSelectedClassIds(prev =>
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    )
  }

  const handleToggleAllClasses = (checked: boolean) => {
    if (!classes) return
    if (checked) {
      setSelectedClassIds(classes.map(cls => cls.id))
    } else {
      setSelectedClassIds([])
    }
  }

  const allClassesSelected = classes ? selectedClassIds.length === classes.length && classes.length > 0 : false
  const someClassesSelected = classes ? selectedClassIds.length > 0 && selectedClassIds.length < classes.length : false

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

  const handleCreateStudentSuccess = () => {
    setNotification({ open: true, message: 'Tạo học sinh mới thành công!', severity: 'success' })
    setOpenCreateStudentDialog(false)
  }

  const handleCreateStudentError = () => {
    setNotification({ open: true, message: 'Tạo học sinh mới thất bại!', severity: 'error' })
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

  const handleBatchRegister = () => {
    if (selectedClassIds.length === 0 || selectedStudentIds.length === 0) return

    const userIds = selectedStudentIds

    const payload = {
      items: selectedClassIds.map(classId => ({
        classId,
        userIds
      }))
    }

    batchRegisterMutation.mutate(payload, {
      onSuccess: () => {
        setNotification({ open: true, message: 'Đăng ký hàng loạt thành công!', severity: 'success' })
        setOpenBatchRegisterDialog(false)
        setSelectedStudentIds([])
        setSelectedClassIds([])
      },
      onError: () => {
        setNotification({ open: true, message: 'Đăng ký hàng loạt thất bại!', severity: 'error' })
      }
    })
  }

  const handleBatchUnregister = () => {
    if (selectedClassIds.length === 0 || selectedStudentTableIds.length === 0) return

    const userIds = selectedStudentTableIds

    const payload = {
      items: selectedClassIds.map(classId => ({
        classId,
        userIds
      }))
    }

    batchUnregisterMutation.mutate(payload, {
      onSuccess: () => {
        setNotification({ open: true, message: 'Hủy đăng ký hàng loạt thành công!', severity: 'success' })
        setOpenBatchUnregisterDialog(false)
        setSelectedStudentTableIds([])
        setSelectedClassIds([])
      },
      onError: () => {
        setNotification({ open: true, message: 'Hủy đăng ký hàng loạt thất bại!', severity: 'error' })
      }
    })
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
          <Box display="flex" alignItems="center" gap={2}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Chọn tuần</InputLabel>
              <Select
                value={selectedWeekId}
                onChange={(e) => setSelectedWeekId(e.target.value)}
                label="Chọn tuần"
                disabled={isLoadingWeeks}
              >
                <MenuItem value="">
                  <em>Tất cả tuần</em>
                </MenuItem>
                {weeksData?.map((week) => (
                  <MenuItem key={week.id} value={week.id}>
                    <Box display="flex" flexDirection="column" alignItems="flex-start">
                      <Typography variant="body2">
                        Tuần từ {new Date(week.startDate).toLocaleDateString('vi-VN')}
                      </Typography>
                      <Chip
                        label={week.scheduleStatus === 'open' ? 'Mở' : week.scheduleStatus === 'closed' ? 'Đóng' : 'Chờ'}
                        color={week.scheduleStatus === 'open' ? 'success' : week.scheduleStatus === 'closed' ? 'error' : 'warning'}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<i className="ri-arrow-left-line" />}
              onClick={() => router.push('/courses')}
            >
              Quay lại
            </Button>
          </Box>
        </Box>

        {/* Thông tin tuần được chọn */}
        {selectedWeekId && weeksData && (
          <StyledCard>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <i className="ri-calendar-line" style={{ fontSize: 24, color: '#1976d2' }} />
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Tuần được chọn
                  </Typography>
                  {(() => {
                    const selectedWeek = weeksData.find(week => week.id === selectedWeekId)
                    if (!selectedWeek) return null
                    return (
                      <Box display="flex" alignItems="center" gap={2}>
                        <Typography variant="body1">
                          Tuần từ {new Date(selectedWeek.startDate).toLocaleDateString('vi-VN')}
                        </Typography>
                        <Chip
                          label={selectedWeek.scheduleStatus === 'open' ? 'Mở' : selectedWeek.scheduleStatus === 'closed' ? 'Đóng' : 'Chờ'}
                          color={selectedWeek.scheduleStatus === 'open' ? 'success' : selectedWeek.scheduleStatus === 'closed' ? 'error' : 'warning'}
                          size="small"
                        />
                        <Typography variant="body2" color="text.secondary">
                          Tạo lúc: {new Date(selectedWeek.createdAt).toLocaleDateString('vi-VN')}
                        </Typography>
                      </Box>
                    )
                  })()}
                </Box>
              </Box>
            </CardContent>
          </StyledCard>
        )}

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
                  <Typography variant="body2" color="text.secondary">Giáo viên chủ nhiệm</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {course.teacher?.name || 'Chưa phân công'}
                  </Typography>
                </Box>
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">Trình độ lớp học</Typography>
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
                <Box display="flex" alignItems="center" gap={1}>
                  {selectedStudentTableIds.length > 0 && selectedClassIds.length > 0 && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<i className="ri-user-unfollow-line" />}
                      onClick={() => setOpenBatchUnregisterDialog(true)}
                    >
                      Hủy ĐK hàng loạt ({selectedStudentTableIds.length} học sinh)
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<i className="ri-user-add-line" />}
                    onClick={() => setOpenCreateStudentDialog(true)}
                  >
                    Tạo học sinh mới
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<i className="ri-user-shared-line" />}
                    onClick={() => setOpenRegisterDialog(true)}
                  >
                    Đăng ký học sinh
                  </Button>
                </Box>
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
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={course?.profileCourses?.length > 0 && selectedStudentTableIds.length === course?.profileCourses?.length}
                          indeterminate={selectedStudentTableIds.length > 0 && selectedStudentTableIds.length < (course?.profileCourses?.length || 0)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudentTableIds(course?.profileCourses?.map(pc => pc.profile.id) || [])
                            } else {
                              setSelectedStudentTableIds([])
                            }
                          }}
                        />
                      </TableCell>
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
                        <TableRow key={student.id} hover selected={selectedStudentTableIds.includes(student.id)}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedStudentTableIds.includes(student.id)}
                              onChange={() => {
                                setSelectedStudentTableIds(prev =>
                                  prev.includes(student.id)
                                    ? prev.filter(id => id !== student.id)
                                    : [...prev, student.id]
                                )
                              }}
                            />
                          </TableCell>
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
                              <Tooltip title="Xem lịch bị thay đổi">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => setStudentSchedulePopup({
                                    open: true,
                                    studentId: student.id,
                                    studentName: student.fullname
                                  })}
                                >
                                  <i className="ri-eye-line" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Đăng ký môn học">
                                <IconButton
                                  size="small"
                                  color="info"
                                  onClick={() => {
                                    // Find username from studentListData
                                    const studentFromList = studentListData?.users.find(u => u.profile.id === student.id)
                                    const username = studentFromList?.username || ''
                                    // Use student.id as userId (profile ID)
                                    const userId = student.id
                                    setSelectedStudentForClasses({
                                      id: student.id,
                                      name: student.fullname,
                                      username: username,
                                      userId: userId
                                    })
                                    setSelectedClassesInModal([])
                                    setOpenRegisterClassesDialog(true)
                                  }}
                                >
                                  <i className="ri-book-line" />
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
                <Box display="flex" gap={1} alignItems="center">
                  {selectedClassIds.length > 0 && selectedStudentIds.length > 0 && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<i className="ri-user-shared-line" />}
                      onClick={() => setOpenBatchRegisterDialog(true)}
                    >
                      Đăng ký hàng loạt vào {selectedClassIds.length} lớp
                    </Button>
                  )}
                  {selectedClassIds.length > 0 && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<i className="ri-delete-bin-line" />}
                      onClick={() => setOpenDeleteClassesDialog(true)}
                    >
                      Xóa ({selectedClassIds.length})
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<i className="ri-file-upload-line" />}
                    onClick={() => setOpenImportClassDialog(true)}
                  >
                    Import từ CSV
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<i className="ri-add-line" />}
                    onClick={() => setOpenCreateClassDialog(true)}
                  >
                    Thêm thủ công
                  </Button>
                </Box>
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
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={allClassesSelected}
                          indeterminate={someClassesSelected}
                          onChange={(event) => handleToggleAllClasses(event.target.checked)}
                        />
                      </TableCell>
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
                      <TableRow
                        key={classItem.id}
                        hover
                        onClick={() => router.push(`/classes/${classItem.id}`)}
                        selected={selectedClassIds.includes(classItem.id)}
                      >
                        <TableCell padding="checkbox" onClick={e => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedClassIds.includes(classItem.id)}
                            onChange={() => handleToggleClassSelection(classItem.id)}
                          />
                        </TableCell>
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
                                onClick={(event) => {
                                  event.stopPropagation()
                                  router.push(`/classes/${classItem.id}`)
                                }}
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

      {/* Import Classes from CSV Dialog */}
      <ImportClassesFromCSV
        courseId={course.id}
        open={openImportClassDialog}
        onClose={() => setOpenImportClassDialog(false)}
        onSuccess={() => {
          setNotification({ open: true, message: 'Import lớp học thành công!', severity: 'success' })
        }}
      />

      {/* Delete Classes Dialog */}
      <Dialog
        open={openDeleteClassesDialog}
        onClose={() => setOpenDeleteClassesDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Box textAlign="center" py={2}>
            <i className="ri-delete-bin-6-line" style={{ fontSize: 48, color: '#f44336', marginBottom: 16 }} />
            <Typography variant="h6" gutterBottom>
              Xác nhận xóa lớp học
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              Bạn có chắc chắn muốn xóa {selectedClassIds.length} lớp học đã chọn? Hành động này không thể hoàn tác.
            </Typography>
            <Box display="flex" justifyContent="center" gap={2}>
              <Button
                variant="outlined"
                onClick={() => setOpenDeleteClassesDialog(false)}
                disabled={deleteClassesMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => {
                  deleteClassesMutation.mutate(selectedClassIds, {
                    onSuccess: () => {
                      setNotification({ open: true, message: 'Xóa lớp học thành công!', severity: 'success' })
                      setSelectedClassIds([])
                      setOpenDeleteClassesDialog(false)
                      router.refresh()
                    },
                    onError: () => {
                      setNotification({ open: true, message: 'Xóa lớp học thất bại!', severity: 'error' })
                    }
                  })
                }}
                disabled={deleteClassesMutation.isPending}
                startIcon={deleteClassesMutation.isPending ? <i className="ri-loader-line animate-spin" /> : <i className="ri-check-line" />}
              >
                {deleteClassesMutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Create Student Dialog */}
      <CreateStudentDialog
        open={openCreateStudentDialog}
        onClose={() => setOpenCreateStudentDialog(false)}
        courseId={course?.id || ''}
        onSuccess={handleCreateStudentSuccess}
        onError={handleCreateStudentError}
      />

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

      {/* Student Schedule Popup */}
      <StudentSchedulePopup
        open={studentSchedulePopup.open}
        onClose={() => setStudentSchedulePopup(prev => ({ ...prev, open: false }))}
        studentId={studentSchedulePopup.studentId}
        studentName={studentSchedulePopup.studentName}
        weekId={selectedWeekId || "08a60c9a-b3f8-42f8-8ff8-c7015d4ef3e7"}
      />

      {/* Batch Register Dialog */}
      <Dialog
        open={openBatchRegisterDialog}
        onClose={() => setOpenBatchRegisterDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Box textAlign="center" py={2}>
            <i className="ri-user-shared-line" style={{ fontSize: 48, color: '#1976d2', marginBottom: 16 }} />
            <Typography variant="h6" gutterBottom>
              Xác nhận đăng ký hàng loạt
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              Bạn có chắc chắn muốn đăng ký <strong>{selectedStudentIds.length}</strong> học sinh vào <strong>{selectedClassIds.length}</strong> lớp đã chọn?
            </Typography>
            <Box display="flex" justifyContent="center" gap={2}>
              <Button
                variant="outlined"
                onClick={() => setOpenBatchRegisterDialog(false)}
                disabled={batchRegisterMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleBatchRegister}
                disabled={batchRegisterMutation.isPending}
              >
                {batchRegisterMutation.isPending ? 'Đang xử lý...' : 'Xác nhận đăng ký'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Batch Unregister Dialog */}
      <Dialog
        open={openBatchUnregisterDialog}
        onClose={() => setOpenBatchUnregisterDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Box textAlign="center" py={2}>
            <i className="ri-user-unfollow-line" style={{ fontSize: 48, color: '#f44336', marginBottom: 16 }} />
            <Typography variant="h6" gutterBottom>
              Xác nhận hủy đăng ký hàng loạt
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              Bạn có chắc chắn muốn hủy đăng ký <strong>{selectedStudentTableIds.length}</strong> học sinh khỏi <strong>{selectedClassIds.length}</strong> lớp đã chọn?
            </Typography>
            <Box display="flex" justifyContent="center" gap={2}>
              <Button
                variant="outlined"
                onClick={() => setOpenBatchUnregisterDialog(false)}
                disabled={batchUnregisterMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleBatchUnregister}
                disabled={batchUnregisterMutation.isPending}
              >
                {batchUnregisterMutation.isPending ? 'Đang xử lý...' : 'Xác nhận hủy đăng ký'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Register Classes Dialog */}
      <Dialog
        open={openRegisterClassesDialog}
        onClose={() => {
          setOpenRegisterClassesDialog(false)
          setSelectedStudentForClasses(null)
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <Box mb={2} display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6" gutterBottom>
                Đăng ký môn học cho {selectedStudentForClasses?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Danh sách các môn học trong khóa học và trạng thái đăng ký
              </Typography>
            </Box>
            {selectedClassesInModal.length > 0 && (
              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<i className="ri-user-shared-line" />}
                  onClick={() => {
                    if (!selectedStudentForClasses || selectedClassesInModal.length === 0) return
                    const unregisteredClasses = selectedClassesInModal.filter(id => !registeredClassIds.includes(id))
                    if (unregisteredClasses.length === 0) return

                    const payload = {
                      items: unregisteredClasses.map(classId => ({
                        classId,
                        userIds: [selectedStudentForClasses.userId]
                      }))
                    }

                    batchRegisterMutation.mutate(payload, {
                      onSuccess: () => {
                        setNotification({
                          open: true,
                          message: `Đăng ký ${unregisteredClasses.length} môn học thành công!`,
                          severity: 'success'
                        })
                        setSelectedClassesInModal([])
                        refetchUserClasses()
                      },
                      onError: () => {
                        setNotification({
                          open: true,
                          message: 'Đăng ký hàng loạt thất bại!',
                          severity: 'error'
                        })
                      }
                    })
                  }}
                  disabled={batchRegisterMutation.isPending || selectedClassesInModal.filter(id => !registeredClassIds.includes(id)).length === 0}
                >
                  Đăng ký ({selectedClassesInModal.filter(id => !registeredClassIds.includes(id)).length})
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<i className="ri-user-unfollow-line" />}
                  onClick={() => {
                    if (!selectedStudentForClasses || selectedClassesInModal.length === 0) return
                    const registeredClasses = selectedClassesInModal.filter(id => registeredClassIds.includes(id))
                    if (registeredClasses.length === 0) return

                    const payload = {
                      items: registeredClasses.map(classId => ({
                        classId,
                        userIds: [selectedStudentForClasses.userId]
                      }))
                    }

                    batchUnregisterMutation.mutate(payload, {
                      onSuccess: () => {
                        setNotification({
                          open: true,
                          message: `Hủy đăng ký ${registeredClasses.length} môn học thành công!`,
                          severity: 'success'
                        })
                        setSelectedClassesInModal([])
                        refetchUserClasses()
                      },
                      onError: () => {
                        setNotification({
                          open: true,
                          message: 'Hủy đăng ký hàng loạt thất bại!',
                          severity: 'error'
                        })
                      }
                    })
                  }}
                  disabled={batchUnregisterMutation.isPending || selectedClassesInModal.filter(id => registeredClassIds.includes(id)).length === 0}
                >
                  Hủy ĐK ({selectedClassesInModal.filter(id => registeredClassIds.includes(id)).length})
                </Button>
              </Box>
            )}
          </Box>

          {isLoadingUserClasses ? (
            <Box textAlign="center" py={4}>
              <Typography>Đang tải danh sách môn học...</Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={autoScheduleClasses.length > 0 && selectedClassesInModal.length === autoScheduleClasses.length}
                        indeterminate={selectedClassesInModal.length > 0 && selectedClassesInModal.length < autoScheduleClasses.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedClassesInModal(autoScheduleClasses.map(c => c.id))
                          } else {
                            setSelectedClassesInModal([])
                          }
                        }}
                      />
                    </TableCell>
                    <StyledTableCell>Môn học</StyledTableCell>
                    <StyledTableCell>Loại kỹ năng</StyledTableCell>
                    <StyledTableCell align="center">Số buổi đã đăng ký</StyledTableCell>
                    <StyledTableCell>Giáo viên</StyledTableCell>
                    <StyledTableCell align="center">Trạng thái</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {autoScheduleClasses.map((classItem) => {
                    const isRegistered = registeredClassIds.includes(classItem.id)
                    const userClass = userClassesData?.find(uc => uc.id === classItem.id)
                    const registeredLessonsCount = userClass?.registeredLessons?.length || 0
                    const isSelected = selectedClassesInModal.includes(classItem.id)

                    return (
                      <TableRow key={classItem.id} hover selected={isSelected}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => {
                              setSelectedClassesInModal(prev =>
                                prev.includes(classItem.id)
                                  ? prev.filter(id => id !== classItem.id)
                                  : [...prev, classItem.id]
                              )
                            }}
                          />
                        </TableCell>
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
                                {classItem.totalLessonPerWeek} buổi/tuần
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
                          <Typography variant="body2">
                            {registeredLessonsCount} / {classItem.totalLessonPerWeek}
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
                          <Chip
                            label={isRegistered ? 'Đã đăng ký' : 'Chưa đăng ký'}
                            color={isRegistered ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box mt={3} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Đã chọn: {selectedClassesInModal.length} môn học
            </Typography>
            <Button
              variant="outlined"
              onClick={() => {
                setOpenRegisterClassesDialog(false)
                setSelectedStudentForClasses(null)
                setSelectedClassesInModal([])
              }}
            >
              Đóng
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CourseDetail 
