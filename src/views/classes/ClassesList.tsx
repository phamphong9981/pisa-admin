'use client'

// React Imports
import { useState, useMemo } from 'react'

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
  Tooltip
} from '@mui/material'
import { styled } from '@mui/material/styles'

// Type Imports
import type { ClassData } from '@/types/classes'

// Sample Data (trong thực tế sẽ fetch từ API)
const SAMPLE_CLASSES: ClassData[] = [
  {
    id: "26192527-b229-4491-898c-71d3f3cc5917",
    name: "FastTrack LISTENING 02",
    totalStudent: 0,
    totalLessonPerWeek: 1,
    classType: "FT_listening",
    teacherId: "98f18f71-328b-4dfe-9a64-f482730fe56d",
    createdAt: "2025-06-27T13:53:50.548Z",
    updatedAt: "2025-06-27T13:53:50.548Z"
  },
  {
    id: "894bfe42-5223-4efe-b826-6b0f7127ac79",
    name: "FastTrack LISTENING 01",
    totalStudent: 1,
    totalLessonPerWeek: 1,
    classType: "FT_listening",
    teacherId: null,
    createdAt: "2025-06-19T07:07:08.008Z",
    updatedAt: "2025-06-28T07:18:55.060Z"
  },
  {
    id: "5d3f64bf-f1a4-44d4-aa88-82d161a4751d",
    name: "FastTrack WRINGTING 01",
    totalStudent: 2,
    totalLessonPerWeek: 2,
    classType: "FT_writing",
    teacherId: "98f18f71-328b-4dfe-9a64-f482730fe56d",
    createdAt: "2025-06-19T07:06:43.749Z",
    updatedAt: "2025-06-25T17:18:31.266Z"
  },
  {
    id: "1a1d6afa-47e7-4b86-bf02-29bb645c2e38",
    name: "FastTrack READING 01",
    totalStudent: 2,
    totalLessonPerWeek: 2,
    classType: "FT_reading",
    teacherId: "98f18f71-328b-4dfe-9a64-f482730fe56d",
    createdAt: "2025-06-18T06:35:00.228Z",
    updatedAt: "2025-06-27T14:00:10.800Z"
  }
]

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

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return SAMPLE_CLASSES
    
    return SAMPLE_CLASSES.filter(classItem =>
      classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getClassTypeLabel(classItem.classType).toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm])

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

  return (
    <Card>
      <CardHeader
        title="Danh sách lớp học"
        subheader="Quản lý các lớp học tại trung tâm"
        action={
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
                    <Typography variant="body2" fontWeight={500}>
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
                    {classItem.teacherId ? (
                      <Chip
                        label="Đã phân công"
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Chip
                        label="Chưa có GV"
                        color="warning"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(classItem.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={1} justifyContent="center">
                      <Tooltip title="Xem chi tiết">
                        <IconButton size="small" color="primary">
                          <i className="ri-eye-line" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Chỉnh sửa">
                        <IconButton size="small" color="secondary">
                          <i className="ri-edit-line" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton size="small" color="error">
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
