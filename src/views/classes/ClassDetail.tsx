'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardHeader,
  CardContent,
  Grid,
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Avatar,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material'
import { styled } from '@mui/material/styles'
import type { ClassData } from '@/types/classes'
import { useClass } from '@/hook/useClass'

// Sample detailed data
const SAMPLE_CLASS_DETAIL: ClassData = {
  id: "5d3f64bf-f1a4-44d4-aa88-82d161a4751d",
  name: "FastTrack WRITING 01",
  totalStudent: 2,
  totalLessonPerWeek: 2,
  classType: "FT_writing",
  teacherId: "98f18f71-328b-4dfe-9a64-f482730fe56d",
  teacherName: "Tran Huy",
  createdAt: "2025-06-19T07:06:43.749Z",
  updatedAt: "2025-06-25T17:18:31.266Z",
  students: [
    {
      profileId: "e5573d93-5152-4e3b-bbb0-b7c9591d79ed",
      username: "cvhoang",
      fullName: "CV Hoang",
      phoneNumber: "0936616785",
      email: "chuhoang@gmail.com",
      lessons: [1, 2]
    },
    {
      profileId: "04d5f068-9ce6-41a9-bfd3-d112e87b4ba1",
      username: "phamphong",
      fullName: "Pham Phong",
      phoneNumber: "0936616785",
      email: "phamphong9981@gmail.com",
      lessons: [1, 2]
    }
  ]
}

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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getInitials = (name: string) => {
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
}

interface ClassDetailProps {
  classId: string
}

const ClassDetail = ({ classId }: ClassDetailProps) => {
  const router = useRouter()
  const { data: classData, isLoading, error } = useClass(classId)
  
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Đang tải thông tin lớp học...</Typography>
      </Box>
    )
  }
  console.log(classData)
  if (error) {
    return (
      <Box>
        <Typography variant="h5" color="error" gutterBottom>
          Lỗi khi tải dữ liệu
        </Typography>
        <Typography color="text.secondary">
          {error.message}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => router.push('/classes')}
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
        <Button 
          variant="contained" 
          onClick={() => router.push('/classes')}
        >
          Quay lại danh sách lớp
        </Button>
      </Box>
    )
  }
  
  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>Chi tiết lớp học</Typography>
          <Typography variant="body2" color="text.secondary">
            ID: {classId}
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<i className="ri-arrow-left-line" />}
          onClick={() => router.push('/classes')}
        >
          Quay lại
        </Button>
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
                <Typography variant="body2" color="text.secondary">Loại lớp</Typography>
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
                    <StyledTableCell align="center">Số buổi đã học</StyledTableCell>
                    <StyledTableCell align="center">Thao tác</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {classData.students.map((student) => (
                    <TableRow key={student.profileId} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {getInitials(student.fullName)}
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

export default ClassDetail 
