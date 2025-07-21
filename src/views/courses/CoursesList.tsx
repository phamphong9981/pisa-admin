'use client'

// React Imports
import { useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

// MUI Imports
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
  IconButton,
  InputAdornment,
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
import { styled } from '@mui/material/styles'

// Hook Imports
import { useCourseList } from '@/@core/hooks/useCourse'

// Component Imports
import CreateCourseForm from './CreateCourseForm'

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 500,
  color: theme.palette.text.primary
}))

const getCourseTypeColor = (courseType: string) => {
  switch (courseType) {
    case 'FT_listening':
      return 'primary'
    case 'FT_writing':
      return 'secondary'
    case 'FT_reading':
      return 'success'
    case 'FT_speaking':
      return 'warning'
    default:
      return 'default'
  }
}

const getDisplayCourseTypeLabel = (courseType: string) => {
  switch (courseType) {
    case 'FT_listening':
      return 'Nghe'
    case 'FT_writing':
      return 'Viết'
    case 'FT_reading':
      return 'Đọc'
    case 'FT_speaking':
      return 'Nói'
    default:
      return courseType
  }
}

const getInitials = (name: string) => {
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
}

const CoursesList = () => {
  // States
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  
  const { data: courses, isLoading, error } = useCourseList()

  // Router
  const router = useRouter()

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!courses) return []
    
    return courses.filter(course => {
      const teacherName = course.teacher?.name || ''
      
      return course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getDisplayCourseTypeLabel(course.type).toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacherName.toLowerCase().includes(searchTerm.toLowerCase())
    })
  }, [searchTerm, courses])
  
  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage

    return filteredData.slice(startIndex, startIndex + rowsPerPage)
  }, [filteredData, page, rowsPerPage])

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Đang tải dữ liệu...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">Lỗi: {error.message}</Typography>
      </Box>
    )
  }

  return (
    <>
      <Card>
        <CardHeader
          title="Quản lý lớp học"
          subheader="Quản lý các lớp học tại trung tâm"
          action={
            <Box display="flex" gap={2} alignItems="center">
              <Button
                variant="contained"
                startIcon={<i className="ri-add-line" />}
                onClick={() => setOpenCreateDialog(true)}
                sx={{ minWidth: 'auto' }}
              >
                Tạo lớp học mới
              </Button>
              <TextField
                size="small"
                placeholder="Tìm kiếm lớp học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="ri-search-line" />
                    </InputAdornment>
                  )
                }}
                sx={{ minWidth: 300 }}
              />
            </Box>
          }
        />
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <StyledTableCell>Lớp học</StyledTableCell>
                  <StyledTableCell>Loại lớp</StyledTableCell>
                  <StyledTableCell align="center">Số kỹ năng</StyledTableCell>
                  <StyledTableCell>Giáo viên</StyledTableCell>
                  <StyledTableCell align="center">Thao tác</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((course) => (
                  <TableRow key={course.name} hover onClick={() => router.push(`/courses/${encodeURIComponent(course.id)}`)}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getInitials(course.name)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {course.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {course.classes.length} kỹ năng
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getDisplayCourseTypeLabel(course.type)} 
                        color={getCourseTypeColor(course.type) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Badge badgeContent={course.classes.length} color="primary">
                        <Typography variant="body2">
                          {course.classes.length} kỹ năng
                        </Typography>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                          {getInitials(course.teacher?.name || '')}
                        </Avatar>
                        <Typography variant="body2">
                          {course.teacher?.name || 'Chưa phân công'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={1} justifyContent="center">
                        <Tooltip title="Xem chi tiết lớp học">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => router.push(`/courses/${encodeURIComponent(course.id)}`)}
                          >
                            <i className="ri-eye-line" />
                          </IconButton>
                        </Tooltip>
                        {/* <Tooltip title="Xem lịch học">
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => router.push(`/courses/${encodeURIComponent(course.id)}/schedule`)}
                          >
                            <i className="ri-calendar-line" />
                          </IconButton>
                        </Tooltip> */}
                        {/* <Tooltip title="Chỉnh sửa">
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
          
          <TablePagination
            component="div"
            count={filteredData.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Số hàng mỗi trang:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} trong ${count}`}
          />
        </CardContent>
      </Card>

      {/* Create Course Dialog */}
      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <CreateCourseForm onSuccess={() => setOpenCreateDialog(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CoursesList 
