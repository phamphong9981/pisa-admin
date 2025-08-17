'use client'

// React Imports
import React, { useMemo, useState } from 'react'

// MUI Imports
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import { styled } from '@mui/material/styles'

// Hooks
import { SCHEDULE_TIME } from '@/@core/hooks/useSchedule'
import { useTeacherList , useUpdateTeacherBusySchedule } from '@/@core/hooks/useTeacher'


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
  shouldForwardProp: (prop) => prop !== 'isBusy' && prop !== 'isTeaching' && prop !== 'isEditable'
})<{ isBusy?: boolean; isTeaching?: boolean; isEditable?: boolean }>(({ theme, isBusy, isTeaching, isEditable }) => ({
  padding: theme.spacing(0.5),
  border: `1px solid ${theme.palette.divider}`,
  textAlign: 'center',
  cursor: isEditable ? 'pointer' : isTeaching ? 'pointer' : 'default',
  minWidth: '120px',
  minHeight: '60px',
  backgroundColor: isTeaching 
    ? '#e3f2fd' // Light blue for teaching
    : isBusy 
      ? '#ffebee' // Light red for busy
      : '#f1f8e9', // Light green for free
  '&:hover': {
    backgroundColor: isEditable 
      ? '#e8f5e8' // Light green on hover for editable
      : isTeaching 
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

const EditTeacherSchedule = () => {
  const { data: teachers, isLoading, error } = useTeacherList()

  // For now, we'll use empty array for schedules until we have proper courseId and weekId
  const schedules: any[] = []
  
  // IMPORTANT: Index Mapping
  // - UI uses 0-27 index for 28 time slots
  // - API uses 1-28 index for slot numbers
  // - When checking if teacher is busy: teacherSchedule.includes(slotIndex + 1)
  // - When updating busy schedule: use (slotIndex + 1) for API calls
  
  // Hook for updating teacher busy schedule
  const updateTeacherBusyScheduleMutation = useUpdateTeacherBusySchedule()

  // Add CSS for spinner animation
  React.useEffect(() => {
    const style = document.createElement('style')

    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `
    document.head.appendChild(style)

    
return () => {
      document.head.removeChild(style)
    }
  }, [])
  
  // States for filtering
  const [teacherSearch, setTeacherSearch] = useState('')
  const [selectedDay, setSelectedDay] = useState<string>('all')

  // States for edit dialog
  const [editDialog, setEditDialog] = useState<{
    open: boolean
    teacherId: string
    teacherName: string
    slotIndex: number
    day: string
    time: string
    currentStatus: 'busy' | 'free'
  }>({
    open: false,
    teacherId: '',
    teacherName: '',
    slotIndex: 0,
    day: '',
    time: '',
    currentStatus: 'free'
  })

  // States for notification
  const [notification, setNotification] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({
    open: false,
    message: '',
    severity: 'success'
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

  // Filter teachers based on search term
  const filteredTeachers = useMemo(() => {
    if (!teachers) return []
    
    if (!teacherSearch.trim()) return teachers
    
    return teachers.filter(teacher => 
      teacher.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
      teacher.skills.some(skill => 
        skill.toLowerCase().includes(teacherSearch.toLowerCase())
      )
    )
  }, [teachers, teacherSearch])

  // Filter time slots based on selected day
  const filteredTimeSlots = useMemo(() => {
    if (selectedDay === 'all') return allTimeSlots
    
    return allTimeSlots.filter(slot => slot.day === selectedDay)
  }, [allTimeSlots, selectedDay])

  // Get unique days for filter dropdown
  const uniqueDays = useMemo(() => {
    const days = allTimeSlots.map(slot => slot.day)

    
return ['all', ...Array.from(new Set(days))]
  }, [allTimeSlots])

  // Check if teacher is busy at specific slot
  // Note: API uses 1-28, UI uses 0-27, so we need to add 1 to convert
  const isTeacherBusy = (teacherSchedule: number[], slotIndex: number) => {
    return teacherSchedule.includes(slotIndex + 1)
  }

  // Check if teacher is teaching at specific slot
  // Note: API uses 1-28, UI uses 0-27, so we need to add 1 to convert
  const isTeacherTeaching = (teacherId: string, slotIndex: number) => {
    if (!schedules) return false

    return schedules.some(schedule => 
      schedule.teacher_id === teacherId && schedule.schedule_time === slotIndex + 1
    )
  }

  // Get teaching info for a teacher at specific slot
  // Note: API uses 1-28, UI uses 0-27, so we need to add 1 to convert
  const getTeachingInfo = (teacherId: string, slotIndex: number) => {
    if (!schedules) return null

    return schedules.find(schedule => 
      schedule.teacher_id === teacherId && schedule.schedule_time === slotIndex + 1
    )
  }

  // Check if slot is editable (not teaching)
  const isSlotEditable = (teacherId: string, slotIndex: number) => {
    return !isTeacherTeaching(teacherId, slotIndex)
  }

  // Handle cell click for editing
  const handleCellClick = (teacherId: string, slotIndex: number, day: string, time: string) => {
    if (!isSlotEditable(teacherId, slotIndex)) return

    const teacher = teachers?.find(t => t.id === teacherId)

    if (!teacher) return

    const isBusy = isTeacherBusy(teacher.registeredBusySchedule, slotIndex)
    
    setEditDialog({
      open: true,
      teacherId,
      teacherName: teacher.name,
      slotIndex,
      day,
      time,
      currentStatus: isBusy ? 'busy' : 'free'
    })
  }

  // Handle close edit dialog
  const handleCloseEditDialog = () => {
    setEditDialog(prev => ({ ...prev, open: false }))
  }

  // Handle save schedule changes
  const handleSaveSchedule = async () => {
    try {
      const teacher = teachers?.find(t => t.id === editDialog.teacherId)

      if (!teacher) return

      const currentBusySchedule = [...teacher.registeredBusySchedule]
      let newBusySchedule: number[]

      if (editDialog.currentStatus === 'busy') {
        // Add slot to busy schedule if not already there
        // Note: API uses 1-28, so we need to add 1 to convert from UI index (0-27)
        const apiSlotIndex = editDialog.slotIndex + 1

        if (!currentBusySchedule.includes(apiSlotIndex)) {
          newBusySchedule = [...currentBusySchedule, apiSlotIndex]
        } else {
          newBusySchedule = currentBusySchedule
        }
      } else {
        // Remove slot from busy schedule
        // Note: API uses 1-28, so we need to add 1 to convert from UI index (0-27)
        const apiSlotIndex = editDialog.slotIndex + 1

        newBusySchedule = currentBusySchedule.filter(slot => slot !== apiSlotIndex)
      }

      // Use the hook to update teacher's busy schedule
      await updateTeacherBusyScheduleMutation.mutateAsync({
        teacherId: editDialog.teacherId,
        busySchedule: newBusySchedule
      })

      setNotification({
        open: true,
        message: `Đã cập nhật lịch ${editDialog.teacherName} thành công!`,
        severity: 'success'
      })
    } catch (error) {
      console.error('Error updating teacher schedule:', error)
      setNotification({
        open: true,
        message: 'Có lỗi xảy ra khi cập nhật lịch!',
        severity: 'error'
      })
    }

    handleCloseEditDialog()
  }

  // Handle close notification
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }))
  }

  if (isLoading) {
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
      {/* Chỉnh sửa lịch giáo viên */}
      <Card>
        <CardHeader
          title="Chỉnh sửa lịch giáo viên"
          subheader="Click vào ô lịch để thay đổi trạng thái bận/rảnh của giáo viên"
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
                label="Đang dạy (Không thể sửa)" 
                sx={{ 
                  backgroundColor: '#e3f2fd',
                  color: '#1976d2',
                  border: '1px solid #bbdefb'
                }}
              />
              <Chip 
                size="small" 
                label="Có thể chỉnh sửa" 
                sx={{ 
                  backgroundColor: '#e8f5e8',
                  color: '#2e7d32',
                  border: '1px solid #c8e6c9',
                  borderStyle: 'dashed'
                }}
              />
            </Box>
          }
        />
        <CardContent>
          {/* Filter Section */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Tìm kiếm theo tên giáo viên hoặc kỹ năng..."
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <i className="ri-search-line" style={{ color: '#666' }} />
                      </InputAdornment>
                    ),
                    endAdornment: teacherSearch && (
                      <InputAdornment position="end">
                        <i 
                          className="ri-close-line" 
                          style={{ 
                            color: '#666', 
                            cursor: 'pointer',
                            fontSize: '18px'
                          }}
                          onClick={() => setTeacherSearch('')}
                        />
                      </InputAdornment>
                    )
                  }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      '&:hover fieldset': {
                        borderColor: '#1976d2',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#1976d2',
                      },
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Lọc theo ngày</InputLabel>
                  <Select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    label="Lọc theo ngày"
                  >
                    {uniqueDays.map((day) => (
                      <MenuItem key={day} value={day}>
                        {day === 'all' ? 'Tất cả các ngày' : day}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            {/* Filter Summary */}
            {(teacherSearch || selectedDay !== 'all') && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
                <Typography variant="body2" color="text.secondary">
                  <i className="ri-filter-line" style={{ marginRight: 8 }} />
                  Đang lọc: 
                  {teacherSearch && (
                    <Chip 
                      label={`Giáo viên: "${teacherSearch}"`} 
                      size="small" 
                      sx={{ ml: 1, mr: 1 }}
                      onDelete={() => setTeacherSearch('')}
                    />
                  )}
                  {selectedDay !== 'all' && (
                    <Chip 
                      label={`Ngày: ${selectedDay}`} 
                      size="small" 
                      sx={{ ml: 1 }}
                      onDelete={() => setSelectedDay('all')}
                    />
                  )}
                </Typography>
              </Box>
            )}
          </Box>

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
                        {selectedDay === 'all' ? 'Theo tuần' : selectedDay}
                      </Typography>
                    </Box>
                  </StyledHeaderCell>
                  {filteredTeachers.map((teacher) => (
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
                {filteredTimeSlots.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={filteredTeachers.length + 1} align="center" sx={{ py: 4 }}>
                      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                        <i className="ri-calendar-line" style={{ fontSize: '48px', color: '#ccc' }} />
                        <Typography variant="h6" color="text.secondary">
                          Không có dữ liệu phù hợp
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Thử thay đổi bộ lọc để xem kết quả khác
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTimeSlots.map((slot, index) => (
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
                      {filteredTeachers.map((teacher) => {
                        const isBusy = isTeacherBusy(teacher.registeredBusySchedule, slot.slot)
                        const isTeaching = isTeacherTeaching(teacher.id, slot.slot)
                        const teachingInfo = getTeachingInfo(teacher.id, slot.slot)
                        const isEditable = isSlotEditable(teacher.id, slot.slot)
                        
                        return (
                          <ScheduleCell
                            key={`${teacher.id}-${slot.slot}`}
                            isBusy={isBusy}
                            isTeaching={isTeaching}
                            isEditable={isEditable}
                            onClick={isEditable ? () => handleCellClick(
                              teacher.id,
                              slot.slot,
                              slot.day,
                              slot.time
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
                                  isEditable
                                    ? `Click để thay đổi lịch ${teacher.name} vào ${slot.day} ${slot.time}`
                                    : isBusy 
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
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Summary */}
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Thống kê {filteredTeachers.length !== teachers?.length && `(${filteredTeachers.length}/${teachers?.length} giáo viên)`}
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              {filteredTeachers.map((teacher) => {
                // Note: registeredBusySchedule contains API indices (1-28), not UI indices (0-27)
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

      {/* Edit Schedule Dialog */}
      <Dialog open={editDialog.open} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <i className="ri-calendar-edit-line" style={{ fontSize: '24px', color: '#1976d2' }} />
            <Typography variant="h6" fontWeight={600}>
              Chỉnh sửa lịch giáo viên
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Giáo viên:</strong> {editDialog.teacherName}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Thời gian:</strong> {editDialog.day} - {editDialog.time}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Trạng thái hiện tại:</strong> 
              <Chip 
                label={editDialog.currentStatus === 'busy' ? 'Bận' : 'Rảnh'} 
                color={editDialog.currentStatus === 'busy' ? 'error' : 'success'} 
                size="small" 
                sx={{ ml: 1 }}
              />
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Thay đổi trạng thái:
              </Typography>
              <Box display="flex" gap={2}>
                <Button
                  variant={editDialog.currentStatus === 'free' ? 'contained' : 'outlined'}
                  color="success"
                  onClick={() => setEditDialog(prev => ({ ...prev, currentStatus: 'free' }))}
                  startIcon={<i className="ri-check-line" />}
                >
                  Rảnh
                </Button>
                <Button
                  variant={editDialog.currentStatus === 'busy' ? 'contained' : 'outlined'}
                  color="error"
                  onClick={() => setEditDialog(prev => ({ ...prev, currentStatus: 'busy' }))}
                  startIcon={<i className="ri-close-line" />}
                >
                  Bận
                </Button>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} color="inherit">
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveSchedule}
            disabled={updateTeacherBusyScheduleMutation.isPending}
            startIcon={
              updateTeacherBusyScheduleMutation.isPending ? 
                <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }} /> : 
                <i className="ri-save-line" />
            }
          >
            {updateTeacherBusyScheduleMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
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
    </>
  )
}

export default EditTeacherSchedule
