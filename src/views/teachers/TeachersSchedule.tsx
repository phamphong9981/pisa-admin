'use client'

// React Imports
import { useMemo, useState } from 'react'



// MUI Imports
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Tooltip,
  Button,
  Menu,
  MenuItem,
  Alert,
  Snackbar
} from '@mui/material'
import { styled } from '@mui/material/styles'

// Hooks
import { useTeacherList } from '@/@core/hooks/useTeacher'
import { SCHEDULE_TIME, useGetAllSchedule } from '@/@core/hooks/useSchedule'
import { useExport } from '@/@core/hooks/useExport'

// Components
import TeachersClassList from './TeachersClassList'
import ScheduleDetailPopup from './ScheduleDetailPopup'


const StyledHeaderCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '0.875rem',
  padding: theme.spacing(1.5),
  backgroundColor: '#f5f5f5',
  color: '#424242',
  border: `1px solid ${theme.palette.divider}`,
  textAlign: 'center',
  position: 'sticky',
  top: 0,
  zIndex: 1
}))

const StyledTimeCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '0.75rem',
  padding: theme.spacing(1),
  backgroundColor: '#fafafa',
  color: '#424242',
  border: `1px solid ${theme.palette.divider}`,
  textAlign: 'center',
  minWidth: '100px',
  position: 'sticky',
  left: 0,
  zIndex: 1
}))

const ScheduleCell = styled(TableCell, {
  shouldForwardProp: (prop) => prop !== 'isBusy' && prop !== 'isTeaching'
})<{ isBusy?: boolean; isTeaching?: boolean }>(({ theme, isBusy, isTeaching }) => ({
  padding: theme.spacing(0.5),
  border: `1px solid ${theme.palette.divider}`,
  textAlign: 'center',
  cursor: isTeaching ? 'pointer' : 'default',
  minWidth: '120px',
  minHeight: '60px',
  backgroundColor: isTeaching 
    ? '#e3f2fd' // Light blue for teaching
    : isBusy 
      ? '#ffebee' // Light red for busy
      : '#f1f8e9', // Light green for free
  '&:hover': {
    backgroundColor: isTeaching 
      ? '#bbdefb' // Darker blue on hover
      : isBusy 
        ? '#ffcdd2' // Darker red on hover
        : '#dcedc8', // Darker green on hover
  },
  transition: 'background-color 0.2s ease',
  position: 'relative'
}))

const TeachingInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.5),
  '& .class-name': {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#1976d2',
    textAlign: 'center',
    lineHeight: 1.2,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  '& .lesson-info': {
    fontSize: '0.65rem',
    color: '#666',
    backgroundColor: '#fff',
    padding: '2px 6px',
    borderRadius: '8px',
    border: '1px solid #e0e0e0'
  }
}))


const getDayInVietnamese = (englishDay: string) => {
  const dayMap: { [key: string]: string } = {
    'Monday': 'Thứ 2',
    'Tuesday': 'Thứ 3', 
    'Wednesday': 'Thứ 4',
    'Thursday': 'Thứ 5',
    'Friday': 'Thứ 6',
    'Saturday': 'Thứ 7',
    'Sunday': 'Chủ nhật'
  }

  return dayMap[englishDay] || englishDay
}

const TeachersSchedule = () => {
  const { data: teachers, isLoading, error } = useTeacherList()
  const { data: schedules, isLoading: isSchedulesLoading } = useGetAllSchedule()
  const { exportToExcel, exportToCSV, exportSummary } = useExport()
  
  // States for export menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const [notification, setNotification] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })

  // States for schedule detail popup
  const [scheduleDetailPopup, setScheduleDetailPopup] = useState<{
    open: boolean
    classId: string
    lesson: number
    teacherName: string
    className: string
    scheduleTime: number
  }>({
    open: false,
    classId: '',
    lesson: 0,
    teacherName: '',
    className: '',
    scheduleTime: 0
  })

  // Generate time slots for all 7 days
  const allTimeSlots = useMemo(() => {
    const slots: { day: string; time: string; slot: number }[] = []
    
    SCHEDULE_TIME.forEach((timeSlot, index) => {
      const parts = timeSlot.split(' ')
      const time = parts[0] // "8:00-10:00"
      const englishDay = parts[1] // "Monday"
      
      slots.push({
        day: getDayInVietnamese(englishDay),
        time: time,
        slot: index
      })
    })
    
    return slots
  }, [])

  // Check if teacher is busy at specific slot
  const isTeacherBusy = (teacherSchedule: number[], slotIndex: number) => {
    return teacherSchedule.includes(slotIndex)
  }

  // Check if teacher is teaching at specific slot
  const isTeacherTeaching = (teacherId: string, slotIndex: number) => {
    if (!schedules) return false

    return schedules.some(schedule => 
      schedule.teacher_id === teacherId && schedule.schedule_time === slotIndex + 1
    )
  }

  // Get teaching info for a teacher at specific slot
  const getTeachingInfo = (teacherId: string, slotIndex: number) => {
    if (!schedules) return null

    return schedules.find(schedule => 
      schedule.teacher_id === teacherId && schedule.schedule_time === slotIndex + 1
    )
  }

  // Handle export menu
  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleExportClose = () => {
    setAnchorEl(null)
  }

  // Export handlers
  const handleExportExcel = () => {
    if (!teachers) return
    
    const result = exportToExcel(teachers)

    setNotification({
      open: true,
      message: result.message,
      severity: result.success ? 'success' : 'error'
    })
    handleExportClose()
  }

  const handleExportCSV = () => {
    if (!teachers) return
    
    const result = exportToCSV(teachers)

    setNotification({
      open: true,
      message: result.message,
      severity: result.success ? 'success' : 'error'
    })
    handleExportClose()
  }

  const handleExportSummary = () => {
    if (!teachers) return
    
    const result = exportSummary(teachers)

    setNotification({
      open: true,
      message: result.message,
      severity: result.success ? 'success' : 'error'
    })
    handleExportClose()
  }

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }))
  }

  // Handle click on teaching cell
  const handleTeachingCellClick = (classId: string, lesson: number, teacherName: string, className: string, scheduleTime: number) => {
    setScheduleDetailPopup({
      open: true,
      classId,
      lesson,
      teacherName,
      className,
      scheduleTime
    })
  }

  // Handle close schedule detail popup
  const handleCloseScheduleDetailPopup = () => {
    setScheduleDetailPopup(prev => ({ ...prev, open: false }))
  }

  if (isLoading || isSchedulesLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Đang tải dữ liệu giáo viên...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h6" color="error">
          Lỗi khi tải dữ liệu: {error.message}
        </Typography>
      </Box>
    )
  }

  return (
    <>
      {/* Danh sách giáo viên và lớp */}
      <TeachersClassList />

      {/* Lịch rảnh giáo viên */}
      <Card>
        <CardHeader
          title="Lịch rảnh giáo viên"
          subheader="Quản lý lịch rảnh của tất cả giáo viên theo từng khung giờ trong tuần"
          action={
            <Box display="flex" gap={1} alignItems="center">
              <Chip 
                size="small" 
                label="Rảnh" 
                sx={{ 
                  backgroundColor: '#f1f8e9',
                  color: '#2e7d32',
                  border: '1px solid #c8e6c9'
                }}
              />
              <Chip 
                size="small" 
                label="Bận" 
                sx={{ 
                  backgroundColor: '#ffebee',
                  color: '#c62828',
                  border: '1px solid #ffcdd2'
                }}
              />
              <Chip 
                size="small" 
                label="Đang dạy" 
                sx={{ 
                  backgroundColor: '#e3f2fd',
                  color: '#1976d2',
                  border: '1px solid #bbdefb'
                }}
              />
              
              {/* Export Button */}
              <Button
                variant="contained"
                startIcon={<i className="ri-download-line" />}
                onClick={handleExportClick}
                disabled={!teachers || teachers.length === 0}
              >
                Xuất file
              </Button>
              
              {/* Export Menu */}
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleExportClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem onClick={handleExportExcel}>
                  <i className="ri-file-excel-line" style={{ marginRight: 8 }} />
                  Xuất Excel (.xlsx)
                </MenuItem>
                <MenuItem onClick={handleExportCSV}>
                  <i className="ri-file-text-line" style={{ marginRight: 8 }} />
                  Xuất CSV (.csv)
                </MenuItem>
                <MenuItem onClick={handleExportSummary}>
                  <i className="ri-bar-chart-line" style={{ marginRight: 8 }} />
                  Xuất thống kê
                </MenuItem>
              </Menu>
            </Box>
          }
        />
        <CardContent>
          <TableContainer sx={{ 
            maxHeight: '70vh', 
            overflow: 'auto',
            border: '1px solid #e0e0e0',
            borderRadius: '8px'
          }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <StyledHeaderCell sx={{ minWidth: '150px' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Khung giờ
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Theo tuần
                      </Typography>
                    </Box>
                  </StyledHeaderCell>
                  {teachers?.map((teacher) => (
                    <StyledHeaderCell key={teacher.id}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {teacher.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {teacher.skills?.length || 0} kỹ năng
                        </Typography>
                      </Box>
                    </StyledHeaderCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {allTimeSlots.map((slot, index) => (
                  <TableRow key={index}>
                    <StyledTimeCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {slot.day}
                        </Typography>
                        <Typography variant="caption" color="primary">
                          {slot.time}
                        </Typography>
                      </Box>
                    </StyledTimeCell>
                    {teachers?.map((teacher) => {
                      const isBusy = isTeacherBusy(teacher.registeredBusySchedule, slot.slot)
                      const isTeaching = isTeacherTeaching(teacher.id, slot.slot)
                      const teachingInfo = getTeachingInfo(teacher.id, slot.slot)
                      
                      return (
                        <ScheduleCell
                          key={`${teacher.id}-${slot.slot}`}
                          isBusy={isBusy}
                          isTeaching={isTeaching}
                          onClick={isTeaching && teachingInfo ? () => handleTeachingCellClick(
                            teachingInfo.class_id,
                            teachingInfo.lesson,
                            teacher.name,
                            teachingInfo.class_name,
                            teachingInfo.schedule_time
                          ) : undefined}
                        >
                          {isTeaching && teachingInfo ? (
                            <TeachingInfo>
                              <Box className="class-name" title={teachingInfo.class_name}>
                                {teachingInfo.class_name}
                              </Box>
                              <Box className="lesson-info">
                                Buổi {teachingInfo.lesson}
                              </Box>
                            </TeachingInfo>
                          ) : (
                            <Tooltip 
                              title={
                                isBusy 
                                  ? `${teacher.name} bận vào ${slot.day} ${slot.time}`
                                  : `${teacher.name} rảnh vào ${slot.day} ${slot.time}`
                              }
                            >
                              <IconButton size="small">
                                {isBusy ? (
                                  <i className="ri-close-line" style={{ color: '#c62828', fontSize: '18px' }} />
                                ) : (
                                  <i className="ri-check-line" style={{ color: '#2e7d32', fontSize: '18px' }} />
                                )}
                              </IconButton>
                            </Tooltip>
                          )}
                        </ScheduleCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Summary */}
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Thống kê
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              {teachers?.map((teacher) => {
                const busySlots = teacher.registeredBusySchedule.length
                const teachingSlots = schedules?.filter(s => s.teacher_id === teacher.id).length || 0
                const totalSlots = SCHEDULE_TIME.length
                const freeSlots = totalSlots - busySlots - teachingSlots
                
                return (
                  <Card key={teacher.id} variant="outlined" sx={{ minWidth: 200 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {teacher.name}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" mt={1}>
                        <Typography variant="body2" sx={{ color: '#2e7d32' }}>
                          Rảnh: {freeSlots}/{totalSlots}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#c62828' }}>
                          Bận: {busySlots}/{totalSlots}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mt={0.5}>
                        <Typography variant="body2" sx={{ color: '#1976d2' }}>
                          Đang dạy: {teachingSlots}/{totalSlots}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={0.5} mt={1}>
                        {teacher.skills.map((skill, index) => (
                          <Chip 
                            key={index}
                            label={skill} 
                            size="small" 
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                )
              })}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Export Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Schedule Detail Popup */}
      <ScheduleDetailPopup
        open={scheduleDetailPopup.open}
        onClose={handleCloseScheduleDetailPopup}
        classId={scheduleDetailPopup.classId}
        lesson={scheduleDetailPopup.lesson}
        teacherName={scheduleDetailPopup.teacherName}
        className={scheduleDetailPopup.className}
        scheduleTime={scheduleDetailPopup.scheduleTime}
      />
    </>
  )
}

export default TeachersSchedule 
