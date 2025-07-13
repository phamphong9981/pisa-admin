'use client'

import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  IconButton,
  Paper,
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
import { useRouter } from 'next/navigation'

import { useCourseInfo } from '@/@core/hooks/useCourse'

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
  const { data: course, isLoading: isLoadingCourses, error: coursesError } = useCourseInfo(courseName)
  const classes = course?.classes
  // Lấy danh sách lớp học của khóa học này
  if (isLoadingCourses) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Đang tải thông tin khóa học...</Typography>
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
          Quay lại danh sách khóa học
        </Button>
      </Box>
    )
  }

  if (!course) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Không tìm thấy khóa học
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => router.push('/courses')}
        >
          Quay lại danh sách khóa học
        </Button>
      </Box>
    )
  }
  
  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>Chi tiết khóa học</Typography>
          <Typography variant="body2" color="text.secondary">
            Khóa học: {courseName}
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
                <Typography variant="body2" color="text.secondary">Loại khóa học</Typography>
                <Typography variant="body1" fontWeight={500}>
                  {getCourseTypeLabel(course.type)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">Tổng số lớp</Typography>
                <Typography variant="body1" fontWeight={500}>
                  {course.classes.length} lớp học
                </Typography>
              </Box>
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

      {/* Danh sách lớp học */}
      <StyledCard>
        <CardHeader 
          title={
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">
                Danh sách lớp học ({classes?.length || 0})
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<i className="ri-add-line" />}
                onClick={() => router.push(`/classes/create?course=${encodeURIComponent(courseName)}`)}
              >
                Thêm lớp học
              </Button>
            </Box>
          }
        />
        <CardContent>
          {!classes || classes.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                Chưa có lớp học nào trong khóa học này
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <StyledTableCell>Lớp học</StyledTableCell>
                    <StyledTableCell>Loại lớp</StyledTableCell>
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
                          <Tooltip title="Xem chi tiết lớp">
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
  )
}

export default CourseDetail 
