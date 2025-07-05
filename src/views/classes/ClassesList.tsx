'use client'

// React Imports
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

// MUI Imports
import {
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Typography,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Button
} from '@mui/material'
import { styled } from '@mui/material/styles'

// Type Imports
import type { ClassData } from '@/types/classes'
import { useClassList, useDeleteClass } from '@/@core/hooks/useClass'
import { useTeacherList } from '@/@core/hooks/useTeacher'

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 500,
  color: theme.palette.text.primary
}))

const getClassTypeColor = (classType: string) => {
  switch (classType) {
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

const getClassTypeLabel = (classType: string) => {
  switch (classType) {
    case 'FT_listening':
      return 'Nghe'
    case 'FT_writing':
      return 'Viết'
    case 'FT_reading':
      return 'Đọc'
    case 'FT_speaking':
      return 'Nói'
    default:
      return classType
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const ClassesList = () => {
  // States
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const { data: classes, isLoading, error } = useClassList()
  const { data: teachers, isLoading: isTeachersLoading } = useTeacherList()
  const deleteClassMutation = useDeleteClass()
  // Router
  const router = useRouter()

  // Hàm tìm teacher theo ID
  const getTeacherById = (teacherId: string | null) => {
    if (!teacherId || !teachers) return null
    return teachers.find(teacher => teacher.id === teacherId)
  }
  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!classes) return []
    
    return classes.filter(classItem => {
      const teacher = getTeacherById(classItem.teacherId)
      const teacherName = teacher?.name || ''
      
      return classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getClassTypeLabel(classItem.classType).toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacherName.toLowerCase().includes(searchTerm.toLowerCase())
         })
   }, [searchTerm, classes, teachers])
  
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

  const handleDelete = (id: string) => {
    deleteClassMutation.mutate(id)
  }

  if (isLoading || isTeachersLoading) {
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
    <Card>
      <CardHeader
        title="Danh sách lớp học"
        subheader="Quản lý các lớp học tại trung tâm"
        action={
          <Box display="flex" gap={2} alignItems="center">
            <Button
              variant="contained"
              startIcon={<i className="ri-add-line" />}
              onClick={() => router.push('/classes/create')}
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
                <StyledTableCell>Tên lớp học</StyledTableCell>
                <StyledTableCell>Loại lớp</StyledTableCell>
                <StyledTableCell align="center">Số học sinh</StyledTableCell>
                <StyledTableCell align="center">Buổi/tuần</StyledTableCell>
                <StyledTableCell>Giáo viên</StyledTableCell>
                <StyledTableCell>Ngày tạo</StyledTableCell>
                <StyledTableCell align="center">Thao tác</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.map((classItem) => (
                <TableRow key={classItem.id} hover>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      fontWeight={500}
                      sx={{ 
                        cursor: 'pointer',
                        color: 'primary.main',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                      onClick={() => router.push(`/classes/${classItem.id}`)}
                    >
                      {classItem.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getClassTypeLabel(classItem.classType)}
                      color={getClassTypeColor(classItem.classType) as any}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {classItem.totalStudent}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {classItem.totalLessonPerWeek}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const teacher = getTeacherById(classItem.teacherId)
                      if (teacher) {
                        return (
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={teacher.name}
                              color="success"
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 500 }}
                            />
                            {teacher.skills.length > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                ({teacher.skills.join(', ')})
                              </Typography>
                            )}
                          </Box>
                        )
                      } else {
                        return (
                          <Chip
                            label="Chưa có GV"
                            color="warning"
                            size="small"
                            variant="outlined"
                          />
                        )
                      }
                    })()}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(classItem.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={1} justifyContent="center">
                      <Tooltip title="Xem chi tiết">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => router.push(`/classes/${classItem.id}`)}
                        >
                          <i className="ri-eye-line" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Chỉnh sửa">
                        <IconButton size="small" color="secondary">
                          <i className="ri-edit-line" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton size="small" color="error" onClick={() => handleDelete(classItem.id)}>
                          <i className="ri-delete-bin-line" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {filteredData.length === 0 && (
          <Box display="flex" justifyContent="center" py={4}>
            <Typography variant="body2" color="textSecondary">
              Không tìm thấy lớp học nào
            </Typography>
          </Box>
        )}
        
        <TablePagination
          component="div"
          count={filteredData.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage="Số hàng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} trên ${count}`}
        />
      </CardContent>
    </Card>
  )
}

export default ClassesList 
