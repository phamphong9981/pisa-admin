'use client'

import React from 'react'

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
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

import type { StudentScheduleDetailDto } from '@/@core/hooks/useSchedule';
import { RollcallStatus, SCHEDULE_TIME, useGetScheduleDetail, useUpdateRollcallStatus, useUpdateUserSchedule, useUpdateLessonSchedule } from '@/@core/hooks/useSchedule'

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
  ...(status === 'trial' && {
    backgroundColor: '#fff3e0',
    color: '#ef6c00',
    border: '1px solid #ff9800'
  }),
  ...(status === 'retake' && {
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
      return 'Vắng mặt'
    case RollcallStatus.TRIAL:
      return 'Học thử'
    case RollcallStatus.RETAKE:
      return 'Học lại'
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
  weekId = "08a60c9a-b3f8-42f8-8ff8-c7015d4ef3e7", // Fallback weekId
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
  const [showTimeDialog, setShowTimeDialog] = React.useState(false)
  const [timeStart, setTimeStart] = React.useState<string>('')
  const [timeEnd, setTimeEnd] = React.useState<string>('')
  const [selectedScheduleId, setSelectedScheduleId] = React.useState<string>('')
  const [selectedStudentName, setSelectedStudentName] = React.useState<string>('')
  const [showTimeSuccess, setShowTimeSuccess] = React.useState(false)
  const [showRollcallNoteDialog, setShowRollcallNoteDialog] = React.useState(false)
  const [rollcallNoteText, setRollcallNoteText] = React.useState('')
  const [showRollcallNoteSuccess, setShowRollcallNoteSuccess] = React.useState(false)
  const [showTeacherNoteDialog, setShowTeacherNoteDialog] = React.useState(false)
  const [teacherNoteText, setTeacherNoteText] = React.useState('')
  const [showTeacherNoteSuccess, setShowTeacherNoteSuccess] = React.useState(false)
  const [editingReasonStudentId, setEditingReasonStudentId] = React.useState<string | null>(null)
  const [editingReasonText, setEditingReasonText] = React.useState('')

  const scheduleDetailQuery = useGetScheduleDetail(classId, lesson, weekId, scheduleTime)
  const { data: scheduleDetail, isLoading, error } = scheduleDetailQuery

  // Refetch detail whenever dialog opens (component may stay mounted)
  React.useEffect(() => {
    if (open) {
      scheduleDetailQuery.refetch()
    }
  }, [open, classId, lesson, weekId, scheduleTime])
  const updateRollcallMutation = useUpdateRollcallStatus()
  const updateUserScheduleMutation = useUpdateUserSchedule()
  const updateLessonScheduleMutation = useUpdateLessonSchedule()

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

        newMap.set(currentStudentId, { status: selectedStatusForReason, reason: reasonText.trim() })

        return newMap
      })
    }

    setShowReasonDialog(false)
    setSelectedStatusForReason(null)
    setReasonText('')
    setCurrentStudentId(null)
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
        reason: change.reason !== undefined ? change.reason : student?.reason // Reason có thể có trong bất kỳ trạng thái nào, bao gồm chuỗi rỗng
      }
    }).filter(update => update.scheduleId)

    if (updates.length === 0) return

    try {
      await updateRollcallMutation.mutateAsync(updates)
      setUpdatedCount(updates.length)
      setPendingChanges(new Map())
      setShowSuccessMessage(true)
      onClose()
    } catch (error) {
      console.error('Error updating rollcall status:', error)
    }
  }

  const toInputTime = (value?: string) => {
    if (!value) return ''

    // Normalize values like HH:mm:ss to HH:mm for input type="time"
    return value.length >= 5 ? value.slice(0, 5) : value
  }

  const formatTimeRange = (start?: string, end?: string) => {
    if (!start && !end) return '—'

    return `${toInputTime(start)} - ${toInputTime(end)}`
  }

  const handleOpenTimeDialog = (student: StudentScheduleDetailDto) => {
    if (!student.scheduleId) return
    setSelectedScheduleId(student.scheduleId)
    setSelectedStudentName(student.fullname)
    setTimeStart(toInputTime(student.startTime))
    setTimeEnd(toInputTime(student.endTime))
    setShowTimeDialog(true)
  }

  const handleCloseTimeDialog = () => {
    setShowTimeDialog(false)
    setSelectedScheduleId('')
    setSelectedStudentName('')
    setTimeStart('')
    setTimeEnd('')
  }

  const handleSaveTime = async () => {
    console.log(selectedScheduleId, timeStart, timeEnd);

    if (!selectedScheduleId) return

    try {
      await updateUserScheduleMutation.mutateAsync({ scheduleId: selectedScheduleId, start_time: timeStart || undefined, end_time: timeEnd || undefined })
      setShowTimeSuccess(true)
      handleCloseTimeDialog()
    } catch (e) {
      // swallow, error UI can be added later
    }
  }

  const handleOpenRollcallNoteDialog = () => {
    setRollcallNoteText(scheduleDetail?.scheduleInfo?.rollcallNote || '')
    setShowRollcallNoteDialog(true)
  }

  const handleCloseRollcallNoteDialog = () => {
    setShowRollcallNoteDialog(false)
    setRollcallNoteText('')
  }

  const handleSaveRollcallNote = async () => {
    if (!scheduleDetail) return

    try {
      await updateLessonScheduleMutation.mutateAsync({
        weekId: scheduleDetail.classInfo.weekId,
        classId: classId,
        lesson: lesson,
        scheduleTime: scheduleTime,
        action: 'update',
        rollcallNote: rollcallNoteText.trim()
      })
      setShowRollcallNoteSuccess(true)
      handleCloseRollcallNoteDialog()
      scheduleDetailQuery.refetch()
    } catch (e) {
      // swallow, error UI can be added later
    }
  }

  const handleOpenTeacherNoteDialog = () => {
    setTeacherNoteText(scheduleDetail?.scheduleInfo?.teacherNote || '')
    setShowTeacherNoteDialog(true)
  }

  const handleCloseTeacherNoteDialog = () => {
    setShowTeacherNoteDialog(false)
    setTeacherNoteText('')
  }

  const handleSaveTeacherNote = async () => {
    if (!scheduleDetail) return

    try {
      await updateLessonScheduleMutation.mutateAsync({
        weekId: scheduleDetail.classInfo.weekId,
        classId: classId,
        lesson: lesson,
        scheduleTime: scheduleTime,
        action: 'update',
        teacherNote: teacherNoteText.trim()
      })
      setShowTeacherNoteSuccess(true)
      handleCloseTeacherNoteDialog()
      scheduleDetailQuery.refetch()
    } catch (e) {
      // swallow, error UI can be added later
    }
  }

  const handleAttendingCheckboxChange = (studentId: string, checked: boolean) => {
    const student = scheduleDetail?.students.attending.find(s => s.profileId === studentId)
    if (!student) return

    if (checked) {
      // Nếu tick ATTENDING, set status là ATTENDING và xóa reason
      setPendingChanges(prev => {
        const newMap = new Map(prev)
        newMap.set(studentId, { status: RollcallStatus.ATTENDING })
        return newMap
      })
    } else {
      // Nếu bỏ tick, set về NOT_ROLLCALL nếu đang là ATTENDING
      const currentStatus = getEffectiveStatus(studentId, student.rollcallStatus)
      if (currentStatus === RollcallStatus.ATTENDING) {
        setPendingChanges(prev => {
          const newMap = new Map(prev)
          newMap.set(studentId, { status: RollcallStatus.NOT_ROLLCALL })
          return newMap
        })
      } else {
        // Nếu đang là trạng thái khác, chỉ cần đảm bảo không phải ATTENDING
        setPendingChanges(prev => {
          const newMap = new Map(prev)
          const existing = newMap.get(studentId)
          if (existing && existing.status === RollcallStatus.ATTENDING) {
            newMap.set(studentId, { status: RollcallStatus.NOT_ROLLCALL })
          }
          return newMap
        })
      }
    }
  }

  const handleStatusSelectChange = (studentId: string, newStatus: RollcallStatus) => {
    const student = scheduleDetail?.students.attending.find(s => s.profileId === studentId)
    if (!student) return

    // Cập nhật trạng thái, giữ reason cũ nếu có
    setPendingChanges(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(studentId)
      newMap.set(studentId, {
        status: newStatus,
        reason: existing?.reason // Giữ reason cũ nếu có
      })
      return newMap
    })
  }

  const handleStartEditReason = (studentId: string) => {
    const student = scheduleDetail?.students.attending.find(s => s.profileId === studentId)
    if (!student) return

    const effectiveReason = getEffectiveReason(studentId, student.reason)
    setEditingReasonStudentId(studentId)
    setEditingReasonText(effectiveReason || '')
  }

  const handleSaveReason = (studentId: string) => {
    const pending = pendingChanges.get(studentId)
    const currentStatus = scheduleDetail?.students.attending.find(s => s.profileId === studentId)?.rollcallStatus || RollcallStatus.NOT_ROLLCALL
    const effectiveStatus = pending?.status || currentStatus

    setPendingChanges(prev => {
      const newMap = new Map(prev)
      newMap.set(studentId, {
        status: effectiveStatus,
        reason: editingReasonText.trim()
      })
      return newMap
    })

    setEditingReasonStudentId(null)
    setEditingReasonText('')
  }

  const handleCancelEditReason = () => {
    setEditingReasonStudentId(null)
    setEditingReasonText('')
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
                  Thời gian: {(() => {
                    // Lấy startTime và endTime từ scheduleInfo
                    if (scheduleDetail?.scheduleInfo?.startTime || scheduleDetail?.scheduleInfo?.endTime) {
                      return formatTimeRange(scheduleDetail.scheduleInfo.startTime, scheduleDetail.scheduleInfo.endTime)
                    }
                    // Fallback về formatScheduleTime nếu không có startTime/endTime
                    return formatScheduleTime(scheduleTime)
                  })()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Giáo viên dạy: {students.attending.length > 0 && students.attending[0].teacherName
                    ? students.attending[0].teacherName
                    : teacherName || '—'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ghi chú buổi học: {scheduleDetail?.scheduleInfo?.note || '—'}
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    Ghi chú điểm danh: {scheduleDetail?.scheduleInfo?.rollcallNote || '—'}
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    onClick={handleOpenRollcallNoteDialog}
                    sx={{
                      minWidth: 'auto',
                      padding: '4px',
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.08)'
                      }
                    }}
                  >
                    <i className="ri-edit-line" style={{ fontSize: '16px' }} />
                  </Button>
                </Box>
                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    Biến động ca học: {scheduleDetail?.scheduleInfo?.teacherNote || '—'}
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    onClick={handleOpenTeacherNoteDialog}
                    sx={{
                      minWidth: 'auto',
                      padding: '4px',
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.08)'
                      }
                    }}
                  >
                    <i className="ri-edit-line" style={{ fontSize: '16px' }} />
                  </Button>
                </Box>
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
                    <StyledTableCell align="center">Có mặt</StyledTableCell>
                    <StyledTableCell>Trạng thái</StyledTableCell>
                    <StyledTableCell>Note điểm danh</StyledTableCell>
                    <StyledTableCell>Thời gian</StyledTableCell>
                    <StyledTableCell>Người điểm danh</StyledTableCell>
                    <StyledTableCell>Ghi chú</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.attending.map((student) => {
                    const effectiveStatus = getEffectiveStatus(student.profileId, student.rollcallStatus)
                    const effectiveReason = getEffectiveReason(student.profileId, student.reason)
                    const isAttending = effectiveStatus === RollcallStatus.ATTENDING
                    const isEditingReason = editingReasonStudentId === student.profileId

                    return (
                      <TableRow key={student.profileId}>
                        <StudentTableCell>
                          <Box display="flex" alignItems="center" gap={2}>
                            <StyledAvatar sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                              {getInitials(student.fullname)}
                            </StyledAvatar>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {student.fullname}
                              </Typography>
                              {student.phone && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {student.phone}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </StudentTableCell>
                        <StudentTableCell align="center">
                          <Checkbox
                            checked={isAttending}
                            onChange={(e) => handleAttendingCheckboxChange(student.profileId, e.target.checked)}
                            color="success"
                            sx={{
                              '&.Mui-checked': {
                                color: '#2e7d32'
                              }
                            }}
                          />
                        </StudentTableCell>
                        <StudentTableCell>
                          {!isAttending ? (
                            <FormControl fullWidth size="small">
                              <Select
                                value={(() => {
                                  // Chuyển đổi các trạng thái cũ sang trạng thái mới
                                  // Nếu là ABSENT_WITH_REASON hoặc ABSENT_WITH_LATE_REASON, chuyển thành ABSENT_WITHOUT_REASON
                                  if (effectiveStatus === RollcallStatus.ABSENT_WITH_REASON ||
                                    effectiveStatus === RollcallStatus.ABSENT_WITH_LATE_REASON) {
                                    return RollcallStatus.ABSENT_WITHOUT_REASON
                                  }
                                  // Các trạng thái khác giữ nguyên
                                  return effectiveStatus as RollcallStatus.NOT_ROLLCALL | RollcallStatus.ABSENT_WITHOUT_REASON | RollcallStatus.TRIAL | RollcallStatus.RETAKE
                                })()}
                                onChange={(e) => handleStatusSelectChange(student.profileId, e.target.value as RollcallStatus)}
                                displayEmpty
                                sx={{ fontSize: '0.875rem' }}
                              >
                                <MenuItem value={RollcallStatus.NOT_ROLLCALL}>
                                  {getRollcallStatusText(RollcallStatus.NOT_ROLLCALL)}
                                </MenuItem>
                                <MenuItem value={RollcallStatus.ABSENT_WITHOUT_REASON}>
                                  {getRollcallStatusText(RollcallStatus.ABSENT_WITHOUT_REASON)}
                                </MenuItem>
                                <MenuItem value={RollcallStatus.TRIAL}>
                                  {getRollcallStatusText(RollcallStatus.TRIAL)}
                                </MenuItem>
                                <MenuItem value={RollcallStatus.RETAKE}>
                                  {getRollcallStatusText(RollcallStatus.RETAKE)}
                                </MenuItem>
                              </Select>
                            </FormControl>
                          ) : (
                            <StatusChip
                              label={getRollcallStatusText(RollcallStatus.ATTENDING)}
                              status={RollcallStatus.ATTENDING}
                              size="small"
                            />
                          )}
                        </StudentTableCell>
                        <StudentTableCell>
                          {isEditingReason ? (
                            <Box display="flex" alignItems="center" gap={1}>
                              <TextField
                                size="small"
                                fullWidth
                                value={editingReasonText}
                                onChange={(e) => setEditingReasonText(e.target.value)}
                                onBlur={() => handleSaveReason(student.profileId)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleSaveReason(student.profileId)
                                  } else if (e.key === 'Escape') {
                                    e.preventDefault()
                                    handleCancelEditReason()
                                  }
                                }}
                                placeholder="Nhập lý do..."
                                sx={{ fontSize: '0.875rem' }}
                                autoFocus
                              />
                              <IconButton
                                size="small"
                                color="inherit"
                                onClick={handleCancelEditReason}
                                sx={{ padding: '4px' }}
                                title="Hủy (Esc)"
                              >
                                <i className="ri-close-line" style={{ fontSize: '18px' }} />
                              </IconButton>
                            </Box>
                          ) : (
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography
                                variant="body2"
                                color={effectiveReason ? 'text.primary' : 'text.secondary'}
                                sx={{
                                  flex: 1,
                                  fontStyle: effectiveReason ? 'normal' : 'italic'
                                }}
                              >
                                {effectiveReason || '—'}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => handleStartEditReason(student.profileId)}
                                sx={{ padding: '4px' }}
                              >
                                <i className="ri-edit-line" style={{ fontSize: '16px', color: '#1976d2' }} />
                              </IconButton>
                            </Box>
                          )}
                        </StudentTableCell>
                        <StudentTableCell>
                          <Typography variant="body2" color={student.startTime || student.endTime ? 'text.primary' : 'text.secondary'}>
                            {formatTimeRange(student.startTime, student.endTime)}
                          </Typography>
                        </StudentTableCell>
                        <StudentTableCell>
                          {student.rollcallUsername ? (
                            <Typography variant="body2" color="primary.main" fontWeight={500}>
                              {student.rollcallUsername}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              Chưa điểm danh
                            </Typography>
                          )}
                        </StudentTableCell>
                        <StudentTableCell>
                          {student.note ? (
                            <Typography variant="body2" color="text.primary" sx={{ fontStyle: 'italic' }}>
                              {student.note}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </StudentTableCell>
                      </TableRow>
                    )
                  })}
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
                    <StyledTableCell>Lịch bù</StyledTableCell>
                    <StyledTableCell>Thời gian</StyledTableCell>
                    <StyledTableCell>Người điểm danh</StyledTableCell>
                    <StyledTableCell>Lý do</StyledTableCell>
                    <StyledTableCell>Ghi chú</StyledTableCell>
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
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {student.fullname}
                            </Typography>
                            {student.phone && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {student.phone}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </StudentTableCell>
                      <StudentTableCell>
                        <Typography variant="body2">
                          {student.email}
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
                        <Typography variant="body2" color={student.startTime || student.endTime ? 'text.primary' : 'text.secondary'}>
                          {formatTimeRange(student.startTime, student.endTime)}
                        </Typography>
                      </StudentTableCell>
                      <StudentTableCell>
                        {student.rollcallUsername ? (
                          <Typography variant="body2" color="primary.main" fontWeight={500}>
                            {student.rollcallUsername}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            Chưa điểm danh
                          </Typography>
                        )}
                      </StudentTableCell>
                      <StudentTableCell>
                        <Typography variant="body2" color="text.secondary">
                          {student.reason || 'Không có lý do'}
                        </Typography>
                      </StudentTableCell>
                      <StudentTableCell>
                        {student.note ? (
                          <Typography variant="body2" color="text.primary" sx={{ fontStyle: 'italic' }}>
                            {student.note}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
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
                    <StyledTableCell>Trạng thái</StyledTableCell>
                    <StyledTableCell>Thời gian</StyledTableCell>
                    <StyledTableCell>Lịch bận</StyledTableCell>
                    <StyledTableCell>Người điểm danh</StyledTableCell>
                    <StyledTableCell>Ghi chú</StyledTableCell>
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
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {student.fullname}
                            </Typography>
                            {student.phone && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {student.phone}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </StudentTableCell>
                      <StudentTableCell>
                        <Typography variant="body2">
                          {student.email}
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
                        <Typography variant="body2" color={student.startTime || student.endTime ? 'text.primary' : 'text.secondary'}>
                          {formatTimeRange(student.startTime, student.endTime)}
                        </Typography>
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
                      <StudentTableCell>
                        {student.rollcallUsername ? (
                          <Typography variant="body2" color="primary.main" fontWeight={500}>
                            {student.rollcallUsername}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            Chưa điểm danh
                          </Typography>
                        )}
                      </StudentTableCell>
                      <StudentTableCell>
                        {student.note ? (
                          <Typography variant="body2" color="text.primary" sx={{ fontStyle: 'italic' }}>
                            {student.note}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
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
        )}
        <Button
          onClick={() => {
            setPendingChanges(new Map())
            onClose()
          }}
          variant="outlined"
        >
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
                <Typography variant="body1" fontWeight={600}>Vắng mặt</Typography>
                <Typography variant="body2" color="text.secondary">Học sinh vắng mặt</Typography>
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

      {/* Time Edit Dialog - Disabled */}
      {/* <Dialog
        open={showTimeDialog}
        onClose={handleCloseTimeDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)' }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <i className="ri-time-line" style={{ fontSize: '24px', color: '#1976d2' }} />
            <Typography variant="h6" fontWeight={600}>
              Chỉnh sửa thời gian {selectedStudentName ? `- ${selectedStudentName}` : ''}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" gap={2} mt={1}>
            <TextField
              label="Bắt đầu"
              type="time"
              value={timeStart}
              onChange={(e) => setTimeStart(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }}
              fullWidth
            />
            <TextField
              label="Kết thúc"
              type="time"
              value={timeEnd}
              onChange={(e) => setTimeEnd(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTimeDialog} variant="outlined">Hủy</Button>
          <Button onClick={handleSaveTime} variant="contained" disabled={updateUserScheduleMutation.isPending} startIcon={updateUserScheduleMutation.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}>
            {updateUserScheduleMutation.isPending ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog> */}

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

      {/* Time Update Success */}
      <Snackbar
        open={showTimeSuccess}
        autoHideDuration={2500}
        onClose={() => setShowTimeSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setShowTimeSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Đã cập nhật thời gian học thành công!
        </Alert>
      </Snackbar>

      {/* Rollcall Note Edit Dialog */}
      <Dialog
        open={showRollcallNoteDialog}
        onClose={handleCloseRollcallNoteDialog}
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
            <i className="ri-file-edit-line" style={{ fontSize: '24px', color: '#1976d2' }} />
            <Typography variant="h6" fontWeight={600}>
              Ghi chú điểm danh
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={4}
            label="Ghi chú điểm danh"
            placeholder="Nhập ghi chú cho bộ phận điểm danh..."
            value={rollcallNoteText}
            onChange={(e) => setRollcallNoteText(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRollcallNoteDialog} variant="outlined">Hủy</Button>
          <Button
            onClick={handleSaveRollcallNote}
            variant="contained"
            color="primary"
            disabled={updateLessonScheduleMutation.isPending}
            startIcon={updateLessonScheduleMutation.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {updateLessonScheduleMutation.isPending ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rollcall Note Update Success */}
      <Snackbar
        open={showRollcallNoteSuccess}
        autoHideDuration={2500}
        onClose={() => setShowRollcallNoteSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setShowRollcallNoteSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Đã cập nhật ghi chú điểm danh thành công!
        </Alert>
      </Snackbar>

      {/* Teacher Note Edit Dialog */}
      <Dialog
        open={showTeacherNoteDialog}
        onClose={handleCloseTeacherNoteDialog}
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
            <i className="ri-file-edit-line" style={{ fontSize: '24px', color: '#1976d2' }} />
            <Typography variant="h6" fontWeight={600}>
              Biến động ca học
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={4}
            label="Biến động ca học"
            placeholder="Nhập ghi chú về biến động ca học từ giáo viên..."
            value={teacherNoteText}
            onChange={(e) => setTeacherNoteText(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTeacherNoteDialog} variant="outlined">Hủy</Button>
          <Button
            onClick={handleSaveTeacherNote}
            variant="contained"
            color="primary"
            disabled={updateLessonScheduleMutation.isPending}
            startIcon={updateLessonScheduleMutation.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {updateLessonScheduleMutation.isPending ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Teacher Note Update Success */}
      <Snackbar
        open={showTeacherNoteSuccess}
        autoHideDuration={2500}
        onClose={() => setShowTeacherNoteSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setShowTeacherNoteSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Đã cập nhật biến động ca học thành công!
        </Alert>
      </Snackbar>

    </StyledDialog>
  )
}

export default ScheduleDetailPopup 
