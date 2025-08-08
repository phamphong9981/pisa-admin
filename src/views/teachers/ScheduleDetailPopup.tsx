'use client'

import React from 'react'

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from '@mui/material'
import { styled } from '@mui/material/styles'

import { RollcallStatus, SCHEDULE_TIME, useGetScheduleDetail, useUpdateRollcallStatus } from '@/@core/hooks/useSchedule'

const StyledDialog = styled(Dialog)(() => ({
  '& .MuiDialog-paper': {
    maxWidth: '95vw',
    width: '1400px',
    maxHeight: '95vh',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden'
  },
  '& .MuiDialogTitle-root': {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '24px 32px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  },
  '& .MuiDialogContent-root': {
    padding: '32px',
    backgroundColor: '#fafbfc'
  },
  '& .MuiDialogActions-root': {
    padding: '20px 32px',
    backgroundColor: '#f8f9fa',
    borderTop: '1px solid #e9ecef'
  }
}))

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 700,
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  borderBottom: `3px solid ${theme.palette.primary.dark}`,
  fontSize: '0.9rem',
  padding: '16px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  '&:first-of-type': {
    borderTopLeftRadius: '8px'
  },
  '&:last-of-type': {
    borderTopRightRadius: '8px'
  }
}))

const StudentTableCell = styled(TableCell)(({ theme }) => ({
  fontSize: '0.875rem',
  padding: '16px',
  borderBottom: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    transition: 'background-color 0.2s ease'
  }
}))

const StatusChip = styled(Chip)<{ status: string }>(({ status }) => ({
  fontSize: '0.75rem',
  fontWeight: 600,
  borderRadius: '8px',
  padding: '4px 8px',
  minHeight: '24px',
  ...(status === 'attending' && {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
    border: '1px solid #4caf50'
  }),
  ...(status === 'absent_without_reason' && {
    backgroundColor: '#ffebee',
    color: '#c62828',
    border: '1px solid #f44336'
  }),
  ...(status === 'absent_with_reason' && {
    backgroundColor: '#fff3e0',
    color: '#ef6c00',
    border: '1px solid #ff9800'
  }),
  ...(status === 'absent_with_late_reason' && {
    backgroundColor: '#f3e5f5',
    color: '#7b1fa2',
    border: '1px solid #9c27b0'
  }),
  ...(status === 'not_rollcall' && {
    backgroundColor: '#f5f5f5',
    color: '#757575',
    border: '1px solid #9e9e9e'
  })
}))

const StyledCard = styled(Card)(() => ({
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
    transition: 'all 0.3s ease'
  },
  transition: 'all 0.3s ease'
}))

const StyledTableContainer = styled(TableContainer)(() => ({
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  border: '1px solid #e9ecef',
  '& .MuiTable-root': {
    backgroundColor: 'white'
  }
}))

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTab-root': {
    minHeight: '48px',
    fontSize: '0.875rem',
    fontWeight: 600,
    textTransform: 'none',
    borderRadius: '8px 8px 0 0',
    marginRight: '4px',
    '&.Mui-selected': {
      backgroundColor: theme.palette.primary.main,
      color: 'white',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    },
    '&:hover': {
      backgroundColor: theme.palette.action.hover
    }
  },
  '& .MuiTabs-indicator': {
    display: 'none'
  }
}))

const StyledAvatar = styled(Avatar)(() => ({
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  border: '2px solid white',
  '&:hover': {
    transform: 'scale(1.1)',
    transition: 'transform 0.2s ease'
  }
}))

const StyledChip = styled(Chip)(() => ({
  borderRadius: '16px',
  fontWeight: 600,
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
    transition: 'all 0.2s ease'
  },
  transition: 'all 0.2s ease'
}))

interface ScheduleDetailPopupProps {
  open: boolean
  onClose: () => void
  classId: string
  lesson: number
  weekId?: string
  teacherName: string
  className: string
  scheduleTime: number
}

const getRollcallStatusText = (status: RollcallStatus) => {
  switch (status) {
    case RollcallStatus.ATTENDING:
      return 'Có mặt'
    case RollcallStatus.ABSENT_WITHOUT_REASON:
      return 'Vắng không lý do'
    case RollcallStatus.ABSENT_WITH_REASON:
      return 'Vắng có lý do'
    case RollcallStatus.ABSENT_WITH_LATE_REASON:
      return 'Vắng báo muộn'
    case RollcallStatus.NOT_ROLLCALL:
      return 'Chưa điểm danh'
    default:
      return 'Không xác định'
  }
}



const ScheduleDetailPopup: React.FC<ScheduleDetailPopupProps> = ({
  open,
  onClose,
  classId,
  lesson,
  weekId = "08a60c9a-b3f8-42f8-8ff8-c7015d4ef3e7",
  teacherName,
  className,
  scheduleTime
}) => {
  const [tabValue, setTabValue] = React.useState(0)
  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false)
  const [updatedCount, setUpdatedCount] = React.useState(0)
  const [pendingChanges, setPendingChanges] = React.useState<Map<string, { status: RollcallStatus, reason?: string }>>(new Map())
  const [showStatusDialog, setShowStatusDialog] = React.useState(false)
  const [currentStudentId, setCurrentStudentId] = React.useState<string | null>(null)
  const [showReasonDialog, setShowReasonDialog] = React.useState(false)
  const [selectedStatusForReason, setSelectedStatusForReason] = React.useState<RollcallStatus | null>(null)
  const [reasonText, setReasonText] = React.useState('')
  
  const { data: scheduleDetail, isLoading, error } = useGetScheduleDetail(classId, lesson, weekId)
  const updateRollcallMutation = useUpdateRollcallStatus()

  const formatScheduleTime = (scheduleTimeIndex: number) => {
    return SCHEDULE_TIME[scheduleTimeIndex - 1] || 'Chưa có lịch'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getEffectiveStatus = (studentId: string, fallbackStatus: RollcallStatus) => {
    return pendingChanges.get(studentId)?.status || fallbackStatus
  }

  const getEffectiveReason = (studentId: string, fallbackReason?: string) => {
    const pending = pendingChanges.get(studentId)
    return pending?.reason ?? fallbackReason
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleStatusClick = (studentId: string) => {
    setCurrentStudentId(studentId)
    setShowStatusDialog(true)
  }

  const handleStatusDialogClose = () => {
    setShowStatusDialog(false)
    setCurrentStudentId(null)
  }

  const handleStatusChange = (newStatus: RollcallStatus) => {
    if (!currentStudentId) return

    const student = scheduleDetail?.students.attending.find(s => s.profileId === currentStudentId)

    if (!student) return

    // Nếu cần lý do, mở hộp nhập lý do
    if (
      newStatus === RollcallStatus.ABSENT_WITH_REASON ||
      newStatus === RollcallStatus.ABSENT_WITH_LATE_REASON
    ) {
      setSelectedStatusForReason(newStatus)
      const existingPending = pendingChanges.get(currentStudentId)
      const initialReason = existingPending?.reason ?? student.reason ?? ''
      setReasonText(initialReason)
      setShowStatusDialog(false)
      setShowReasonDialog(true)
      return
    }

    // Nếu trạng thái mới giống trạng thái cũ và không có lý do, xóa khỏi pendingChanges
    if (student.rollcallStatus === newStatus) {
      setPendingChanges(prev => {
        const newMap = new Map(prev)
        newMap.delete(currentStudentId)
        return newMap
      })
    } else {
      setPendingChanges(prev => {
        const newMap = new Map(prev)
        newMap.set(currentStudentId, { status: newStatus })
        return newMap
      })
    }

    handleStatusDialogClose()
  }

  const handleConfirmReason = () => {
    if (!currentStudentId || !selectedStatusForReason) return

    const student = scheduleDetail?.students.attending.find(s => s.profileId === currentStudentId)
    const existingStatus = student?.rollcallStatus
    const existingReason = student?.reason ?? ''

    // Nếu không thay đổi gì so với hiện tại thì bỏ pending
    if (existingStatus === selectedStatusForReason && (reasonText.trim() === (existingReason ?? '').trim())) {
      setPendingChanges(prev => {
        const newMap = new Map(prev)
        newMap.delete(currentStudentId)
        return newMap
      })
    } else {
      setPendingChanges(prev => {
        const newMap = new Map(prev)
        newMap.set(currentStudentId, { status: selectedStatusForReason, reason: reasonText.trim() || undefined })
        return newMap
      })
    }

    setShowReasonDialog(false)
    setSelectedStatusForReason(null)
    setReasonText('')
    handleStatusDialogClose()
  }

  const handleCancelReason = () => {
    setShowReasonDialog(false)
    setSelectedStatusForReason(null)
    setReasonText('')
  }

  const handleBatchUpdate = async () => {
    if (pendingChanges.size === 0 || !scheduleDetail) return

    const updates = Array.from(pendingChanges.entries()).map(([studentId, change]) => {
      const student = scheduleDetail.students.attending.find(s => s.profileId === studentId)

      return {
        scheduleId: student?.scheduleId || '',
        rollcallStatus: change.status,
        reason: (change.status === RollcallStatus.ABSENT_WITH_REASON || change.status === RollcallStatus.ABSENT_WITH_LATE_REASON)
          ? (change.reason ?? student?.reason)
          : undefined
      }
    }).filter(update => update.scheduleId)

    if (updates.length === 0) return

    try {
      await updateRollcallMutation.mutateAsync(updates)
      setUpdatedCount(updates.length)
      setPendingChanges(new Map())
      setShowSuccessMessage(true)
    } catch (error) {
      console.error('Error updating rollcall status:', error)
    }
  }

  const handleCancelChanges = () => {
    setPendingChanges(new Map())
  }

  if (isLoading) {
    return (
      <StyledDialog open={open} onClose={onClose}>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </DialogContent>
      </StyledDialog>
    )
  }

  if (error) {
    return (
      <StyledDialog open={open} onClose={onClose}>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <i className="ri-error-warning-line" style={{ color: '#f44336' }} />
            Lỗi khi tải thông tin
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error">
            Không thể tải thông tin chi tiết lịch học: {error.message}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Đóng</Button>
        </DialogActions>
      </StyledDialog>
    )
  }

  if (!scheduleDetail) {
    return (
      <StyledDialog open={open} onClose={onClose}>
        <DialogContent>
          <Alert severity="warning">
            Không tìm thấy thông tin chi tiết lịch học
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Đóng</Button>
        </DialogActions>
      </StyledDialog>
    )
  }

  const { classInfo, students } = scheduleDetail

  return (
    <StyledDialog open={open} onClose={onClose}>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={3}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)'
            }}
          >
            <i className="ri-calendar-line" style={{ fontSize: '24px', color: 'white' }} />
          </Box>
          <Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="h5" fontWeight={700} sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                Chi tiết lịch học - {className}
              </Typography>
              {pendingChanges.size > 0 && (
                <Chip
                  label={`${pendingChanges.size} thay đổi chưa lưu`}
                  color="warning"
                  variant="filled"
                  size="small"
                  icon={<i className="ri-edit-line" />}
                  sx={{
                    backgroundColor: 'rgba(255, 152, 0, 0.9)',
                    color: 'white',
                    fontWeight: 600
                  }}
                />
              )}
            </Box>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)', mt: 0.5 }}>
              Buổi {lesson} • {formatScheduleTime(scheduleTime)} • GV: {teacherName}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* Class Information */}
        <StyledCard sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {classInfo.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Loại lớp: {classInfo.classType} • Buổi {classInfo.lesson}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Thời gian: {formatScheduleTime(scheduleTime)}
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="h6" color="primary" fontWeight={600}>
                  {students.total} học sinh
                </Typography>
                <Box display="flex" gap={1} mt={1}>
                  <StyledChip 
                    label={`${students.attendingCount} có mặt`} 
                    size="small" 
                    color="success" 
                    variant="outlined"
                  />
                  <StyledChip 
                    label={`${students.makeupCount} học bù`} 
                    size="small" 
                    color="info" 
                    variant="outlined"
                  />
                  <StyledChip 
                    label={`${students.absentCount} vắng`} 
                    size="small" 
                    color="warning" 
                    variant="outlined"
                  />
                </Box>
              </Box>
            </Box>
          </CardContent>
        </StyledCard>

        {/* Students Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <StyledTabs value={tabValue} onChange={handleTabChange} aria-label="student status tabs">
            <Tab 
              label={`Có mặt (${students.attendingCount})`} 
              icon={<i className="ri-check-line" />}
              iconPosition="start"
            />
            <Tab 
              label={`Học bù (${students.makeupCount})`} 
              icon={<i className="ri-refresh-line" />}
              iconPosition="start"
            />
            <Tab 
              label={`Vắng mặt (${students.absentCount})`} 
              icon={<i className="ri-close-line" />}
              iconPosition="start"
            />
          </StyledTabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ mt: 2 }}>
                      {/* Attending Students */}
            {tabValue === 0 && (
              <StyledTableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <StyledTableCell>Học sinh</StyledTableCell>
                    <StyledTableCell>Email</StyledTableCell>
                    <StyledTableCell>SĐT</StyledTableCell>
                    <StyledTableCell>Trạng thái</StyledTableCell>
                    <StyledTableCell>Giáo viên dạy</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.attending.map((student) => (
                    <TableRow key={student.profileId}>
                      <StudentTableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <StyledAvatar sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                            {getInitials(student.fullname)}
                          </StyledAvatar>
                          <Typography variant="body2" fontWeight={500}>
                            {student.fullname}
                          </Typography>
                        </Box>
                      </StudentTableCell>
                      <StudentTableCell>
                        <Typography variant="body2">
                          {student.email}
                        </Typography>
                      </StudentTableCell>
                      <StudentTableCell>
                        <Typography variant="body2">
                          {student.phone}
                        </Typography>
                      </StudentTableCell>
                      <StudentTableCell 
                        onClick={() => handleStatusClick(student.profileId)}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'rgba(25, 118, 210, 0.04)'
                          },
                          transition: 'background-color 0.2s ease'
                        }}
                      >
                        <Box>
                          {(() => {
                            const effectiveStatus = getEffectiveStatus(student.profileId, student.rollcallStatus)
                            const effectiveReason = getEffectiveReason(student.profileId, student.reason)
                            return (
                              <>
                                <StatusChip
                                  label={getRollcallStatusText(effectiveStatus)}
                                  status={effectiveStatus}
                                  size="small"
                                />
                                {(effectiveStatus === RollcallStatus.ABSENT_WITH_REASON || effectiveStatus === RollcallStatus.ABSENT_WITH_LATE_REASON) && effectiveReason && (
                                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                    Lý do: {effectiveReason}
                                  </Typography>
                                )}
                              </>
                            )
                          })()}
                        </Box>
                      </StudentTableCell>
                      <StudentTableCell>
                        {student.teacherName ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <StyledAvatar sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                              {getInitials(student.teacherName)}
                            </StyledAvatar>
                            <Typography variant="body2">
                              {student.teacherName}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Chưa phân công
                          </Typography>
                        )}
                      </StudentTableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </StyledTableContainer>
          )}

                      {/* Makeup Students */}
            {tabValue === 1 && (
              <StyledTableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <StyledTableCell>Học sinh</StyledTableCell>
                    <StyledTableCell>Email</StyledTableCell>
                    <StyledTableCell>SĐT</StyledTableCell>
                    <StyledTableCell>Lịch bù</StyledTableCell>
                    <StyledTableCell>Giáo viên dạy</StyledTableCell>
                    <StyledTableCell>Lý do</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.makeup.map((student) => (
                    <TableRow key={student.profileId}>
                      <StudentTableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <StyledAvatar sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                            {getInitials(student.fullname)}
                          </StyledAvatar>
                          <Typography variant="body2" fontWeight={500}>
                            {student.fullname}
                          </Typography>
                        </Box>
                      </StudentTableCell>
                      <StudentTableCell>
                        <Typography variant="body2">
                          {student.email}
                        </Typography>
                      </StudentTableCell>
                      <StudentTableCell>
                        <Typography variant="body2">
                          {student.phone}
                        </Typography>
                      </StudentTableCell>
                      <StudentTableCell>
                        {student.scheduleTime ? (
                          <StyledChip 
                            label={formatScheduleTime(student.scheduleTime)}
                            size="small"
                            color="info"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Chưa sắp lịch
                          </Typography>
                        )}
                      </StudentTableCell>
                      <StudentTableCell>
                        {student.teacherName ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <StyledAvatar sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                              {getInitials(student.teacherName)}
                            </StyledAvatar>
                            <Typography variant="body2">
                              {student.teacherName}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Chưa phân công
                          </Typography>
                        )}
                      </StudentTableCell>
                      <StudentTableCell>
                        <Typography variant="body2" color="text.secondary">
                          {student.reason || 'Không có lý do'}
                        </Typography>
                      </StudentTableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </StyledTableContainer>
          )}

                      {/* Absent Students */}
            {tabValue === 2 && (
              <StyledTableContainer>
              <Table>
                  <TableHead>
                    <TableRow>
                      <StyledTableCell>Học sinh</StyledTableCell>
                      <StyledTableCell>Email</StyledTableCell>
                      <StyledTableCell>SĐT</StyledTableCell>
                      <StyledTableCell>Trạng thái</StyledTableCell>
                      <StyledTableCell>Lịch bận</StyledTableCell>
                    </TableRow>
                  </TableHead>
                <TableBody>
                  {students.absent.map((student) => (
                    <TableRow key={student.profileId}>
                      <StudentTableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <StyledAvatar sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                            {getInitials(student.fullname)}
                          </StyledAvatar>
                          <Typography variant="body2" fontWeight={500}>
                            {student.fullname}
                          </Typography>
                        </Box>
                      </StudentTableCell>
                      <StudentTableCell>
                        <Typography variant="body2">
                          {student.email}
                        </Typography>
                      </StudentTableCell>
                      <StudentTableCell>
                        <Typography variant="body2">
                          {student.phone}
                        </Typography>
                      </StudentTableCell>
                      <StudentTableCell>
                        {(() => {
                          const effectiveStatus = getEffectiveStatus(student.profileId, student.rollcallStatus)
                          const effectiveReason = getEffectiveReason(student.profileId, student.reason)
                          return (
                            <Box>
                              <StatusChip
                                label={getRollcallStatusText(effectiveStatus)}
                                status={effectiveStatus}
                                size="small"
                              />
                              {(effectiveStatus === RollcallStatus.ABSENT_WITH_REASON || effectiveStatus === RollcallStatus.ABSENT_WITH_LATE_REASON) && effectiveReason && (
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                  Lý do: {effectiveReason}
                                </Typography>
                              )}
                            </Box>
                          )
                        })()}
                      </StudentTableCell>
                      <StudentTableCell>
                        <Box display="flex" gap={0.5} flexWrap="wrap">
                          {student.busySchedule.map((timeSlot, index) => (
                            <StyledChip
                              key={index}
                              label={formatScheduleTime(timeSlot)}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.65rem' }}
                            />
                          ))}
                        </Box>
                      </StudentTableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </StyledTableContainer>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        {pendingChanges.size > 0 && (
          <>
            <Button 
              onClick={handleCancelChanges} 
              variant="outlined" 
              color="inherit"
              startIcon={<i className="ri-close-line" />}
            >
              Hủy thay đổi ({pendingChanges.size})
            </Button>
            <Button 
              onClick={handleBatchUpdate} 
              variant="contained" 
              color="error"
              disabled={updateRollcallMutation.isPending}
              startIcon={
                updateRollcallMutation.isPending ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <i className="ri-save-line" />
                )
              }
              sx={{
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(244, 67, 54, 0.4)'
                }
              }}
            >
              {updateRollcallMutation.isPending ? 'Đang lưu...' : `Điểm danh (${pendingChanges.size})`}
            </Button>
          </>
        )}
        <Button onClick={onClose} variant="outlined">
          Đóng
        </Button>
      </DialogActions>

      {/* Status Selection Dialog */}
      <Dialog
        open={showStatusDialog}
        onClose={handleStatusDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <i className="ri-user-settings-line" style={{ fontSize: '24px', color: '#1976d2' }} />
            <Typography variant="h6" fontWeight={600}>
              Chọn trạng thái điểm danh
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <Button
              variant="outlined"
              onClick={() => handleStatusChange(RollcallStatus.ATTENDING)}
              startIcon={<i className="ri-check-line" style={{ color: '#2e7d32' }} />}
              sx={{
                justifyContent: 'flex-start',
                padding: '12px 16px',
                borderRadius: '12px',
                borderColor: '#4caf50',
                color: '#2e7d32',
                '&:hover': {
                  backgroundColor: '#e8f5e8',
                  borderColor: '#2e7d32'
                }
              }}
            >
              <Box textAlign="left">
                <Typography variant="body1" fontWeight={600}>Có mặt</Typography>
                <Typography variant="body2" color="text.secondary">Học sinh có mặt trong buổi học</Typography>
              </Box>
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => handleStatusChange(RollcallStatus.ABSENT_WITHOUT_REASON)}
              startIcon={<i className="ri-close-line" style={{ color: '#c62828' }} />}
              sx={{
                justifyContent: 'flex-start',
                padding: '12px 16px',
                borderRadius: '12px',
                borderColor: '#f44336',
                color: '#c62828',
                '&:hover': {
                  backgroundColor: '#ffebee',
                  borderColor: '#c62828'
                }
              }}
            >
              <Box textAlign="left">
                <Typography variant="body1" fontWeight={600}>Vắng không lý do</Typography>
                <Typography variant="body2" color="text.secondary">Học sinh vắng mặt không có lý do</Typography>
              </Box>
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => handleStatusChange(RollcallStatus.ABSENT_WITH_REASON)}
              startIcon={<i className="ri-time-line" style={{ color: '#ef6c00' }} />}
              sx={{
                justifyContent: 'flex-start',
                padding: '12px 16px',
                borderRadius: '12px',
                borderColor: '#ff9800',
                color: '#ef6c00',
                '&:hover': {
                  backgroundColor: '#fff3e0',
                  borderColor: '#ef6c00'
                }
              }}
            >
              <Box textAlign="left">
                <Typography variant="body1" fontWeight={600}>Vắng có lý do</Typography>
                <Typography variant="body2" color="text.secondary">Học sinh vắng mặt có lý do chính đáng</Typography>
              </Box>
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => handleStatusChange(RollcallStatus.ABSENT_WITH_LATE_REASON)}
              startIcon={<i className="ri-time-line" style={{ color: '#7b1fa2' }} />}
              sx={{
                justifyContent: 'flex-start',
                padding: '12px 16px',
                borderRadius: '12px',
                borderColor: '#9c27b0',
                color: '#7b1fa2',
                '&:hover': {
                  backgroundColor: '#f3e5f5',
                  borderColor: '#7b1fa2'
                }
              }}
            >
              <Box textAlign="left">
                <Typography variant="body1" fontWeight={600}>Vắng báo muộn</Typography>
                <Typography variant="body2" color="text.secondary">Học sinh vắng mặt và báo muộn</Typography>
              </Box>
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => handleStatusChange(RollcallStatus.NOT_ROLLCALL)}
              startIcon={<i className="ri-question-line" style={{ color: '#757575' }} />}
              sx={{
                justifyContent: 'flex-start',
                padding: '12px 16px',
                borderRadius: '12px',
                borderColor: '#9e9e9e',
                color: '#757575',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                  borderColor: '#757575'
                }
              }}
            >
              <Box textAlign="left">
                <Typography variant="body1" fontWeight={600}>Chưa điểm danh</Typography>
                <Typography variant="body2" color="text.secondary">Chưa thực hiện điểm danh</Typography>
              </Box>
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStatusDialogClose} variant="outlined">
            Hủy
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reason Input Dialog */}
      <Dialog
        open={showReasonDialog}
        onClose={handleCancelReason}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <i className="ri-file-text-line" style={{ fontSize: '24px', color: '#ef6c00' }} />
            <Typography variant="h6" fontWeight={600}>
              Nhập lý do vắng
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label="Lý do"
            placeholder="Nhập lý do vắng mặt..."
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelReason} variant="outlined">Hủy</Button>
          <Button onClick={handleConfirmReason} variant="contained" color="primary">Xác nhận</Button>
        </DialogActions>
      </Dialog>

      {/* Success Message */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={3000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setShowSuccessMessage(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          Đã cập nhật trạng thái điểm danh cho {updatedCount} học sinh thành công!
        </Alert>
      </Snackbar>


    </StyledDialog>
  )
}

export default ScheduleDetailPopup 
