'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import {
    Alert,
    Avatar,
    Box,
    Card,
    CardContent,
    CardHeader,
    Chip,
    IconButton,
    InputAdornment,
    Paper,
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

import { useUnscheduleList } from '@/@core/hooks/useSchedule'

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

const getInitials = (name: string) => {
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
}

const UnscheduledStudents = () => {
  const router = useRouter()
  const { data: unscheduledStudents, isLoading, error } = useUnscheduleList()
  
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')

  // Filter data based on search term
  console.log(unscheduledStudents);
  
  const filteredData = unscheduledStudents?.filter(student => {
    return student.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
  }) || []

  // Paginate data
  const paginatedData = filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

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
        <Typography>Đang tải dữ liệu học sinh...</Typography>
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
        title="Quản lý học sinh"
        subheader="Danh sách học sinh có tiết học chưa được sắp xếp lịch"
        action={
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              size="small"
              placeholder="Tìm kiếm học sinh..."
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
        {filteredData.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            {unscheduledStudents?.length === 0 
              ? "Tất cả học sinh đã được sắp xếp lịch học!"
              : "Không tìm thấy học sinh nào phù hợp với từ khóa tìm kiếm."
            }
          </Alert>
        ) : (
          <>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Có {filteredData.length} học sinh có tiết học chưa được sắp xếp lịch
            </Alert>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <StyledTableCell>Học sinh</StyledTableCell>
                    <StyledTableCell>Liên hệ</StyledTableCell>
                    <StyledTableCell>Lớp học</StyledTableCell>
                    <StyledTableCell>Giáo viên</StyledTableCell>
                    <StyledTableCell align="center">Buổi học</StyledTableCell>
                    <StyledTableCell align="center">Lịch bận</StyledTableCell>
                    <StyledTableCell align="center">Thao tác</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.map((student) => (
                    <TableRow key={student.profileLessonClassId} hover>
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
                              ID: {student.profileId.slice(0, 8)}...
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {student.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {student.phone}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {student.className}
                            </Typography>
                            <Chip 
                              label={getClassTypeLabel(student.classType)} 
                              color={getClassTypeColor(student.classType) as any}
                              size="small"
                            />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                            {getInitials(student.teacherName)}
                          </Avatar>
                          <Typography variant="body2">
                            {student.teacherName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">

                          <Chip 
                            label={`Buổi ${student.lesson}`}
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" flexWrap="wrap" gap={0.5} justifyContent="center">
                          {student.busySchedule.length > 0 ? (
                            student.busySchedule.slice(0, 3).map((busyTime, index) => (
                              <Chip
                                key={index}
                                label={`Slot ${busyTime}`}
                                size="small"
                                variant="outlined"
                                color="error"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            ))
                          ) : (
                            <Chip
                              label="Không bận"
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          )}
                          {student.busySchedule.length > 3 && (
                            <Chip
                              label={`+${student.busySchedule.length - 3}`}
                              size="small"
                              variant="outlined"
                              color="default"
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
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default UnscheduledStudents 
