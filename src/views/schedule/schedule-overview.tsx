'use client'

// React Imports
import { useState, useMemo } from 'react'

import { useRouter } from 'next/navigation'

// Styled Components
import { styled } from '@mui/material/styles'

// MUI Imports
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Tooltip,
  TablePagination,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Avatar,
  Tabs,
  Tab,
  Collapse
} from '@mui/material'

// Hooks
import { useGetAllSchedule, SCHEDULE_TIME, useGetMakeupSchedule } from '@/@core/hooks/useSchedule'

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  backgroundColor: theme.palette.grey[50],
  color: theme.palette.text.primary,
  borderBottom: `2px solid ${theme.palette.divider}`,
  fontSize: '0.875rem'
}))

const ScheduleOverview = () => {
  const router = useRouter()
  
  // Hooks for all schedules
  const { data: allSchedules } = useGetAllSchedule()
  const { data: makeupSchedules, isLoading: isMakeupSchedulesLoading, error: makeupSchedulesError } = useGetMakeupSchedule()

  // States for all schedules section
  const [schedulePage, setSchedulePage] = useState(0)
  const [scheduleRowsPerPage, setScheduleRowsPerPage] = useState(10)

  // Tab state for schedule section
  const [scheduleTab, setScheduleTab] = useState(0)

  // Group makeup schedules by teacher_id + schedule_time
  const groupedMakeupSchedules = useMemo(() => {
    if (!makeupSchedules) return []

    const groupMap: Record<string, {teacher_id: string, teacher_name: string, schedule_time: number, students: {fullname?: string, email?: string, phone?: string}[]}> = {}
    
    makeupSchedules.forEach(sch => {
      const key = sch.teacher_id + '-' + sch.schedule_time
      
      if (!groupMap[key]) {
        groupMap[key] = {
          teacher_id: sch.teacher_id,
          teacher_name: sch.teacher_name,
          schedule_time: sch.schedule_time,
          students: []
        }
      }

      groupMap[key].students.push({ fullname: sch.fullname, email: sch.email, phone: sch.phone })
    })

    return Object.values(groupMap)
  }, [makeupSchedules])

  // Normal schedules (not makeup)
  const normalSchedules = useMemo(() => {
    if (!allSchedules) return []
    
    return allSchedules.filter(s => !s.is_makeup)
  }, [allSchedules])

  // Helper functions
  const formatScheduleTime = (scheduleTimeIndex: number) => {
    return SCHEDULE_TIME[scheduleTimeIndex - 1] || 'Chưa có lịch'
  }

  const getClassTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'FT_listening': 'Nghe',
      'FT_writing': 'Viết', 
      'FT_reading': 'Đọc',
      'FT_speaking': 'Nói'
    }

    return typeMap[type] || type
  }

  const getInitials = (name: string) => { 
    return (name|| '').split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  // Handle pagination for schedules
  const handleSchedulePageChange = (event: unknown, newPage: number) => {
    setSchedulePage(newPage)
  }

  const handleScheduleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setScheduleRowsPerPage(parseInt(event.target.value, 10))
    setSchedulePage(0)
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 6 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Box 
            sx={{ 
              width: 48, 
              height: 48, 
              borderRadius: 2, 
              background: 'linear-gradient(135deg, #8e24aa 0%, #ab47bc 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(142, 36, 170, 0.3)'
            }}
          >
            <i className="ri-calendar-check-line" style={{ fontSize: '24px', color: '#fff' }} />
          </Box>
          <Box>
            <Typography variant='h4' fontWeight={700}>
              Tổng hợp lịch học
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              Xem tổng quan tất cả các lịch học thường và lịch bù
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Section Header */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #8e24aa 0%, #ab47bc 100%)',
        color: '#fff',
        p: 3,
        borderRadius: 2,
        mb: 3,
        boxShadow: '0 4px 12px rgba(142, 36, 170, 0.3)'
      }}>
        <Typography fontWeight={700} fontSize="1.125rem">
          Tất cả các lịch học
        </Typography>
      </Box>
      
      {/* Tabs for normal/makeup schedule */}
      <Tabs
        value={scheduleTab}
        onChange={(_, v) => setScheduleTab(v)}
        sx={{ 
          mb: 3,
          '& .MuiTab-root': {
            fontWeight: 600,
            fontSize: '0.95rem',
            textTransform: 'none',
            minHeight: 48
          },
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0'
          }
        }}
        indicatorColor="secondary"
        textColor="secondary"
      >
        <Tab 
          label={
            <Box display="flex" alignItems="center" gap={1}>
              <i className="ri-calendar-line" />
              <span>Lịch thường</span>
            </Box>
          } 
        />
        <Tab 
          label={
            <Box display="flex" alignItems="center" gap={1}>
              <i className="ri-calendar-schedule-line" />
              <span>Lịch bù</span>
            </Box>
          } 
        />
      </Tabs>

      {/* Lịch thường */}
      <Collapse in={scheduleTab === 0}>
        <TableContainer component={Paper} sx={{ 
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Table>
            <TableHead>
              <TableRow>
                <StyledTableCell>Tên lớp</StyledTableCell>
                <StyledTableCell>Loại lớp</StyledTableCell>
                <StyledTableCell>Giáo viên</StyledTableCell>
                <StyledTableCell>Buổi học</StyledTableCell>
                <StyledTableCell>Thời gian</StyledTableCell>
                <StyledTableCell align="center">Hành động</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {normalSchedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                      <i className="ri-calendar-line" style={{ fontSize: '48px', color: '#ccc' }} />
                      <Typography variant="h6" color="text.secondary">
                        Không có lịch học thường nào
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tất cả lịch học đã được sắp xếp hoặc chưa có dữ liệu
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                normalSchedules.map((schedule, index) => (
                  <TableRow key={`${schedule.class_id}-${schedule.lesson}-${index}`} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {schedule.class_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getClassTypeLabel(schedule.class_type)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {schedule.teacher_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`Buổi ${schedule.lesson}`}
                        size="small"
                        sx={{ 
                          backgroundColor: '#fff3e0',
                          color: '#e65100',
                          border: '1px solid #ffcc02'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="primary">
                        {formatScheduleTime(schedule.schedule_time)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Xem chi tiết lớp học">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => router.push(`/classes/${schedule.class_id}`)}
                        >
                          <i className="ri-eye-line" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ 
          mt: 3,
          p: 3,
          backgroundColor: '#f8f9fa',
          borderRadius: 2,
          border: '1px solid #e9ecef',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <TablePagination
            component="div"
            count={normalSchedules.length}
            page={schedulePage}
            onPageChange={handleSchedulePageChange}
            rowsPerPage={scheduleRowsPerPage}
            onRowsPerPageChange={handleScheduleRowsPerPageChange}
            labelRowsPerPage="Số hàng mỗi trang:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} trong ${count}`}
            sx={{
              '& .MuiTablePagination-toolbar': {
                padding: 0,
                minHeight: 'auto',
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontWeight: 600,
                  color: '#495057',
                  fontSize: '0.875rem'
                },
                '& .MuiTablePagination-select': {
                  fontWeight: 600,
                  backgroundColor: '#fff',
                  border: '1px solid #dee2e6',
                  borderRadius: 1,
                  padding: '4px 8px',
                  '&:hover': {
                    borderColor: '#8e24aa',
                    backgroundColor: '#f8f9fa'
                  },
                  '&:focus': {
                    borderColor: '#8e24aa',
                    boxShadow: '0 0 0 2px rgba(142, 36, 170, 0.2)'
                  }
                }
              },
              '& .MuiTablePagination-actions': {
                '& .MuiIconButton-root': {
                  backgroundColor: '#fff',
                  border: '1px solid #dee2e6',
                  borderRadius: 1,
                  margin: '0 4px',
                  width: 40,
                  height: 40,
                  color: '#6c757d',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: '#8e24aa',
                    borderColor: '#8e24aa',
                    color: '#fff',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(142, 36, 170, 0.3)'
                  },
                  '&:disabled': {
                    backgroundColor: '#f8f9fa',
                    borderColor: '#e9ecef',
                    color: '#adb5bd'
                  },
                  '&.Mui-selected': {
                    backgroundColor: '#8e24aa',
                    borderColor: '#8e24aa',
                    color: '#fff'
                  }
                }
              }
            }}
          />
        </Box>
      </Collapse>

      {/* Lịch bù */}
      <Collapse in={scheduleTab === 1}>
        <Box>
          {isMakeupSchedulesLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : makeupSchedulesError ? (
            <Alert severity="error">Lỗi khi tải lịch bù: {makeupSchedulesError.message}</Alert>
          ) : groupedMakeupSchedules.length === 0 ? (
            <Alert severity="info">Không có lịch bù nào</Alert>
          ) : (
            groupedMakeupSchedules.map((group) => (
              <Card key={group.teacher_id + '-' + group.schedule_time} sx={{ mb: 3, boxShadow: 2 }}>
                <CardHeader
                  avatar={<Avatar>{getInitials(group.teacher_name)}</Avatar>}
                  title={<>
                    <Typography fontWeight={600}>{group.teacher_name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatScheduleTime(group.schedule_time)}
                    </Typography>
                  </>}
                />
                <CardContent>
                  <Typography variant="subtitle2" mb={1}>Danh sách học sinh:</Typography>
                  <Box component="ul" sx={{ pl: 3, mb: 0 }}>
                    {group.students.map((stu, i) => (
                      <li key={i}>
                        <Typography variant="body2" display="inline" fontWeight={500}>{stu.fullname || '-'}</Typography>
                        <Typography variant="caption" color="text.secondary" ml={1}>{stu.email || ''}</Typography>
                        {stu.phone && (
                          <Typography variant="caption" color="text.secondary" ml={1}>{stu.phone}</Typography>
                        )}
                      </li>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Box>
      </Collapse>
    </Box>
  )
}

export default ScheduleOverview 
