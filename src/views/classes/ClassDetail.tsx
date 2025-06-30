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
      
      <Card>
        <CardContent>
          <Typography>Đây là trang chi tiết lớp học với ID: {classId}</Typography>
          <Typography>Tính năng đang được phát triển...</Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default ClassDetail 
