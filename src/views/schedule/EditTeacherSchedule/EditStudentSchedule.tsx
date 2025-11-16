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
import { useStudentListWithReload, useUpdateStudentBusySchedule } from '@/@core/hooks/useStudent'
import { SCHEDULE_TIME } from '@/@core/hooks/useSchedule'

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

const StyledDayCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '0.8rem',
  padding: theme.spacing(1),
  backgroundColor: '#f0f0f0',
  color: '#424242',
  border: `1px solid ${theme.palette.divider}`,
  textAlign: 'left',
  minWidth: '120px',
  position: 'sticky',
  left: 0,
  zIndex: 2
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

const EditStudentSchedule = () => {
  // States for search and filtering
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedDay, setSelectedDay] = useState<string>('all')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Hook for fetching students
  const { data: studentData, isLoading, error } = useStudentListWithReload(debouncedSearch)

  // Hook for updating student busy schedule
  const updateStudentBusyScheduleMutation = useUpdateStudentBusySchedule()

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

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(studentSearch)
    }, 500)

    return () => clearTimeout(timer)
  }, [studentSearch])

  // States for edit dialog
  const [editDialog, setEditDialog] = useState<{
    open: boolean
    studentId: string
    studentName: string
    slotIndex: number
    day: string
    time: string
    currentStatus: 'busy' | 'free'
  }>({
    open: false,
    studentId: '',
    studentName: '',
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

  // Filter students based on search term
  const filteredStudents = useMemo(() => {
    if (!studentData?.users) return []

    if (!studentSearch.trim()) return studentData.users

    return studentData.users.filter(student =>
      student.profile.fullname.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.profile.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.course?.name.toLowerCase().includes(studentSearch.toLowerCase())
    )
  }, [studentData?.users, studentSearch])

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

  // Check if student is busy at specific slot
  // Note: API uses 1-42, UI uses 0-41, so we need to add 1 to convert
  const isStudentBusy = (studentSchedule: number[] | undefined, slotIndex: number) => {
    if (!studentSchedule || !Array.isArray(studentSchedule)) return false

    return studentSchedule.includes(slotIndex + 1)
  }


  // Handle cell click for editing
  const handleCellClick = (studentId: string, slotIndex: number, day: string, time: string) => {
    const student = filteredStudents.find(s => s.id === studentId)

    if (!student) return

    const isBusy = isStudentBusy(student.profile.busyScheduleArr, slotIndex)

    setEditDialog({
      open: true,
      studentId,
      studentName: student.profile.fullname,
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
      const student = filteredStudents.find(s => s.id === editDialog.studentId)

      if (!student) return

      const currentBusySchedule = [...(student.profile.busyScheduleArr || [])]
      let newBusySchedule: number[]

      if (editDialog.currentStatus === 'busy') {
        // Add slot to busy schedule if not already there
        // Note: API uses 1-42, so we need to add 1 to convert from UI index (0-41)
        const apiSlotIndex = editDialog.slotIndex + 1

        if (!currentBusySchedule.includes(apiSlotIndex)) {
          newBusySchedule = [...currentBusySchedule, apiSlotIndex]
        } else {
          newBusySchedule = currentBusySchedule
        }
      } else {
        // Remove slot from busy schedule
        // Note: API uses 1-42, so we need to add 1 to convert from UI index (0-41)
        const apiSlotIndex = editDialog.slotIndex + 1

        newBusySchedule = currentBusySchedule.filter(slot => slot !== apiSlotIndex)
      }

      // Use the hook to update student's busy schedule
      await updateStudentBusyScheduleMutation.mutateAsync({
        studentId: editDialog.studentId,
        busySchedule: newBusySchedule
      })

      setNotification({
        open: true,
        message: `Đã cập nhật lịch ${editDialog.studentName} thành công!`,
        severity: 'success'
      })
    } catch (error) {
      console.error('Error updating student schedule:', error)
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
        <Typography>Đang tải dữ liệu học sinh...</Typography>
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
      {/* Chỉnh sửa lịch học sinh */}
      <Card>
        <CardHeader
          title="Chỉnh sửa lịch học sinh"
          subheader="Click vào ô lịch để thay đổi trạng thái bận/rảnh của học sinh (42 khung giờ/tuần)"
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
                  placeholder="Tìm kiếm theo tên học sinh, email hoặc khóa học..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <i className="ri-search-line" style={{ color: '#666' }} />
                      </InputAdornment>
                    ),
                    endAdornment: studentSearch && (
                      <InputAdornment position="end">
                        <i
                          className="ri-close-line"
                          style={{
                            color: '#666',
                            cursor: 'pointer',
                            fontSize: '18px'
                          }}
                          onClick={() => setStudentSearch('')}
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
            {(studentSearch || selectedDay !== 'all') && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
                <Typography variant="body2" color="text.secondary">
                  <i className="ri-filter-line" style={{ marginRight: 8 }} />
                  Đang lọc:
                  {studentSearch && (
                    <Chip
                      label={`Học sinh: "${studentSearch}"`}
                      size="small"
                      sx={{ ml: 1, mr: 1 }}
                      onDelete={() => setStudentSearch('')}
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
                  <StyledHeaderCell sx={{ minWidth: '120px', position: 'sticky', left: 0, zIndex: 3 }}>
                    <Typography variant="body2" fontWeight={600}>Thứ</Typography>
                  </StyledHeaderCell>
                  <StyledHeaderCell sx={{ minWidth: '100px', position: 'sticky', left: 120, zIndex: 3 }}>
                    <Typography variant="body2" fontWeight={600}>Khung giờ</Typography>
                  </StyledHeaderCell>
                  {filteredStudents.map((student) => (
                    <StyledHeaderCell key={student.id}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {student.profile.fullname}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {student.course?.name || 'Chưa có khóa học'}
                        </Typography>
                      </Box>
                    </StyledHeaderCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTimeSlots.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={filteredStudents.length + 2} align="center" sx={{ py: 4 }}>
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
                  (() => {
                    const groups: Record<string, { day: string; slots: typeof filteredTimeSlots }> = {}
                    filteredTimeSlots.forEach(s => {
                      const key = s.day
                      if (!groups[key]) groups[key] = { day: s.day, slots: [] as any }
                      groups[key].slots.push(s)
                    })
                    return Object.values(groups).flatMap(group =>
                      group.slots.map((slot, idx) => (
                        <TableRow key={`${group.day}-${slot.time}`}>
                          {idx === 0 && (
                            <StyledDayCell rowSpan={group.slots.length}>
                              {group.day}
                            </StyledDayCell>
                          )}
                          <StyledTimeCell sx={{ left: 120 }}>
                            <Typography variant="caption" color="primary">{slot.time}</Typography>
                          </StyledTimeCell>
                          {filteredStudents.map((student) => {
                            const isBusy = isStudentBusy(student.profile.busyScheduleArr, slot.slot)

                            return (
                              <ScheduleCell
                                key={`${student.id}-${slot.slot}`}
                                isBusy={isBusy}
                                isTeaching={false}
                                isEditable={true}
                                onClick={() => handleCellClick(
                                  student.id,
                                  slot.slot,
                                  slot.day,
                                  slot.time
                                )}
                              >

                                <Tooltip
                                  title={
                                    isBusy
                                      ? `${student.profile.fullname} bận vào ${slot.day} ${slot.time}`
                                      : `${student.profile.fullname} rảnh vào ${slot.day} ${slot.time}`
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

                              </ScheduleCell>
                            )
                          })}
                        </TableRow>
                      ))
                    )
                  })()
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Summary */}
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Thống kê {filteredStudents.length !== studentData?.users?.length && `(${filteredStudents.length}/${studentData?.users?.length} học sinh)`}
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              {filteredStudents.map((student) => {
                // Note: busyScheduleArr contains API indices (1-42), not UI indices (0-41)
                const busySlots = student.profile.busyScheduleArr?.length || 0
                const totalSlots = SCHEDULE_TIME.length
                const freeSlots = totalSlots - busySlots

                return (
                  <Card key={student.id} variant="outlined" sx={{ minWidth: 200 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {student.profile.fullname}
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
                          Khóa học: {student.course?.name || 'Chưa có'}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={0.5} mt={1}>
                        <Chip
                          label={student.profile.ieltsPoint || 'N/A'}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
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
              Chỉnh sửa lịch học sinh
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Học sinh:</strong> {editDialog.studentName}
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
            disabled={updateStudentBusyScheduleMutation.isPending}
            startIcon={
              updateStudentBusyScheduleMutation.isPending ?
                <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }} /> :
                <i className="ri-save-line" />
            }
          >
            {updateStudentBusyScheduleMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
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

export default EditStudentSchedule
