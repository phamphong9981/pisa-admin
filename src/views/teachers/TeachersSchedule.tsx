'use client'

// React Imports
import { useMemo, useState } from 'react'

// MUI Imports
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { styled } from '@mui/material/styles'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

// Hooks
import { useExport } from '@/@core/hooks/useExport'
import { RollcallStatus, SCHEDULE_TIME, useGetAllSchedule } from '@/@core/hooks/useSchedule'
import { useTeacherList, useUpdateTeacher } from '@/@core/hooks/useTeacher'
import { useGetWeeks, WeekResponseDto, ScheduleStatus as WeekStatus } from '@/@core/hooks/useWeek'

// Components
import ScheduleDetailPopup from './ScheduleDetailPopup'
import EditTeacherNoteDialog from './EditTeacherNoteDialog'

const TeachingInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '8px',
  overflow: 'hidden',
  border: '1px solid #e0e0e0',
  backgroundColor: '#fff',
  marginBottom: theme.spacing(0.5),
  '&:last-child': {
    marginBottom: 0
  },
  '& .lesson-header': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(0.5, 0.75),
    backgroundColor: '#e3f2fd',
    borderBottom: '1px solid #bbdefb',
    '& .class-name': {
      fontSize: '0.7rem',
      fontWeight: 600,
      color: '#1976d2',
      lineHeight: 1.2,
      flex: 1,
      marginRight: theme.spacing(0.5),
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      minWidth: 0
    },
    '& .lesson-badge': {
      fontSize: '0.6rem',
      color: '#1976d2',
      backgroundColor: '#fff',
      padding: '2px 6px',
      borderRadius: '6px',
      border: '1px solid #bbdefb',
      fontWeight: 600
    }
  },
  '& .lesson-note': {
    padding: theme.spacing(0.5, 0.75),
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #e0e0e0',
    fontSize: '0.65rem',
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 1.3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  '& .students-content': {
    padding: theme.spacing(0.5),
    '& .students-list': {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.25),
      '& .student-item': {
        fontSize: '0.65rem',
        color: '#333',
        padding: '2px 4px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        border: '1px solid #e9ecef',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: '100%',
        minWidth: 0,
        maxWidth: '100%'
      }
    }
  }
}))

const TeachingInfosContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  width: '100%',
  minWidth: 0
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

const dayOffsetMap: Record<string, number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6
}

const TeachersSchedule = () => {
  const { data: teachers, isLoading, error } = useTeacherList()

  // Week selection
  const { data: weeksData, isLoading: isWeeksLoading } = useGetWeeks()
  const [selectedWeekId, setSelectedWeekId] = useState<string>('')

  // Get weeks list and find open week
  const weeks = useMemo(() => {
    return weeksData || []
  }, [weeksData])

  const openWeek = useMemo(() => {
    return weeks.find(week => week.scheduleStatus === WeekStatus.OPEN)
  }, [weeks])

  const selectedWeekInfo = useMemo(() => {
    if (!selectedWeekId) return null

    return weeks.find(week => week.id === selectedWeekId) || null
  }, [weeks, selectedWeekId])

  // Set default week (open week or most recent)
  useMemo(() => {
    if (weeks.length > 0 && !selectedWeekId) {
      if (openWeek) {
        setSelectedWeekId(openWeek.id)
      } else {
        // Sort by startDate descending and take the most recent
        const sortedWeeks = [...weeks].sort((a: WeekResponseDto, b: WeekResponseDto) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        )
        setSelectedWeekId(sortedWeeks[0].id)
      }
    }
  }, [weeks, selectedWeekId, openWeek])

  const { data: schedules, isLoading: isSchedulesLoading } = useGetAllSchedule(true, undefined, selectedWeekId || undefined)
  const { exportToExcel, exportToCSV, exportSummary } = useExport()

  // States for export menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  // States for edit note dialog
  const [editNoteDialog, setEditNoteDialog] = useState<{
    open: boolean
    teacherId: string
    teacherName: string
    teacherSkills: string[]
    currentNote?: string
  }>({
    open: false,
    teacherId: '',
    teacherName: '',
    teacherSkills: [],
    currentNote: undefined
  })

  const [notification, setNotification] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })

  // States for filtering
  const [selectedTeachers, setSelectedTeachers] = useState<any[]>([])
  const [selectedDay, setSelectedDay] = useState<string>('all')
  const [selectedTimeRanges, setSelectedTimeRanges] = useState<string[]>([])

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

  // State for full screen modal
  const [fullScreenOpen, setFullScreenOpen] = useState(false)

  // State for pinned teachers (loaded from localStorage)
  const [pinnedTeacherIds, setPinnedTeacherIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pinned-teacher-ids')
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          return []
        }
      }
    }
    return []
  })

  // Generate time slots for all 7 days
  const allTimeSlots = useMemo(() => {
    const slots: { dayKey: string; dayLabel: string; time: string; slot: number }[] = []

    SCHEDULE_TIME.forEach((timeSlot, index) => {
      const parts = timeSlot.split(' ')
      const time = parts[0]
      const englishDay = parts[1]
      const vietnameseDay = getDayInVietnamese(englishDay)
      const offset = dayOffsetMap[englishDay] ?? 0

      let dayLabel = vietnameseDay

      if (selectedWeekInfo?.startDate) {
        const date = new Date(selectedWeekInfo.startDate)
        date.setDate(date.getDate() + offset)
        const formatted = date.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit'
        })
        dayLabel = `${vietnameseDay} (${formatted})`
      }

      slots.push({
        dayKey: vietnameseDay,
        dayLabel,
        time,
        slot: index
      })
    })

    return slots
  }, [selectedWeekInfo?.startDate])

  // Filter teachers based on selected teachers and sort by pinned status
  const filteredTeachers = useMemo(() => {
    if (!teachers) return []

    let result = teachers

    // Filter by selected teachers
    if (selectedTeachers.length > 0) {
      result = result.filter(teacher =>
        selectedTeachers.some(selected => selected.id === teacher.id)
      )
    }

    // Sort: pinned teachers first, then others
    result = [...result].sort((a, b) => {
      const aIsPinned = pinnedTeacherIds.includes(a.id)
      const bIsPinned = pinnedTeacherIds.includes(b.id)

      if (aIsPinned && !bIsPinned) return -1
      if (!aIsPinned && bIsPinned) return 1

      // If both pinned or both not pinned, maintain original order
      return 0
    })

    return result
  }, [teachers, selectedTeachers, pinnedTeacherIds])

  // Filter time slots based on selected day
  const filteredTimeSlots = useMemo(() => {
    let slots = selectedDay === 'all'
      ? allTimeSlots
      : allTimeSlots.filter(slot => slot.dayKey === selectedDay)

    if (selectedTimeRanges.length > 0) {
      slots = slots.filter(slot => selectedTimeRanges.includes(slot.time))
    }

    return slots
  }, [allTimeSlots, selectedDay, selectedTimeRanges])

  // Get unique days for filter dropdown
  const uniqueDayOptions = useMemo(() => {
    const seen = new Map<string, string>()

    allTimeSlots.forEach(slot => {
      if (!seen.has(slot.dayKey)) {
        seen.set(slot.dayKey, slot.dayLabel)
      }
    })

    return Array.from(seen.entries()).map(([key, label]) => ({ key, label }))
  }, [allTimeSlots])

  const uniqueTimeRanges = useMemo(() => {
    const times = allTimeSlots.map(slot => slot.time)

    return Array.from(new Set(times))
  }, [allTimeSlots])

  const selectedDayLabel = useMemo(() => {
    if (selectedDay === 'all') return null

    return uniqueDayOptions.find(option => option.key === selectedDay)?.label || null
  }, [selectedDay, uniqueDayOptions])

  // Check if teacher is busy at specific slot
  const isTeacherBusy = (teacherSchedule: number[], slotIndex: number) => {
    return teacherSchedule.includes(slotIndex + 1)
  }

  // Check if teacher is teaching at specific slot
  const isTeacherTeaching = (teacherId: string, slotIndex: number) => {
    if (!schedules) return false

    return schedules.some(schedule =>
      (schedule.teacher_id === teacherId || schedule.students?.some(student => student.teacher_id === teacherId)) && schedule.schedule_time === slotIndex + 1
    )
  }

  // Get all teaching infos for a teacher at specific slot (multiple classes can be at same time)
  const getTeachingInfos = (teacherId: string, slotIndex: number) => {
    if (!schedules) return []

    return schedules.filter(schedule =>
      (schedule.teacher_id === teacherId || schedule.students?.some(student => student.teacher_id === teacherId)) && schedule.schedule_time === slotIndex + 1
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
  const buildExportFilename = (base: string) => {
    if (!selectedWeekInfo) return base

    const startDate = new Date(selectedWeekInfo.startDate).toISOString().slice(0, 10)

    return `${base}-${startDate}`
  }

  const getRollcallStatusConfig = (status?: RollcallStatus) => {
    switch (status) {
      case RollcallStatus.ATTENDING:
        return {
          label: 'Đã điểm danh',
          backgroundColor: '#c8e6c9',
          borderColor: '#81c784',
          textColor: '#1b5e20',
          accentColor: '#388e3c'
        }
      case RollcallStatus.ABSENT_WITHOUT_REASON:
        return {
          label: 'Vắng không lý do',
          backgroundColor: '#ffcdd2',
          borderColor: '#ef9a9a',
          textColor: '#b71c1c',
          accentColor: '#d32f2f'
        }
      case RollcallStatus.ABSENT_WITH_REASON:
        return {
          label: 'Vắng có lý do',
          backgroundColor: '#ffe0b2',
          borderColor: '#ffcc80',
          textColor: '#e65100',
          accentColor: '#fb8c00'
        }
      case RollcallStatus.ABSENT_WITH_LATE_REASON:
        return {
          label: 'Vắng xin muộn',
          backgroundColor: '#d1c4e9',
          borderColor: '#b39ddb',
          textColor: '#4527a0',
          accentColor: '#7e57c2'
        }
      default:
        return null
    }
  }

  const handleExportExcel = () => {
    if (!filteredTeachers || filteredTeachers.length === 0) return

    const exportSlots = filteredTimeSlots.map(slot => ({
      slot: slot.slot,
      day: slot.dayLabel,
      time: slot.time
    }))

    const result = exportToExcel(filteredTeachers, schedules, {
      timeSlots: exportSlots,
      filename: buildExportFilename('lich-giao-vien')
    })

    setNotification({
      open: true,
      message: result.message,
      severity: result.success ? 'success' : 'error'
    })
    handleExportClose()
  }

  const handleExportCSV = () => {
    if (!filteredTeachers || filteredTeachers.length === 0) return

    const exportSlots = filteredTimeSlots.map(slot => ({
      slot: slot.slot,
      day: slot.dayLabel,
      time: slot.time
    }))

    const result = exportToCSV(filteredTeachers, schedules, {
      timeSlots: exportSlots,
      filename: buildExportFilename('lich-giao-vien')
    })

    setNotification({
      open: true,
      message: result.message,
      severity: result.success ? 'success' : 'error'
    })
    handleExportClose()
  }

  const handleExportSummary = () => {
    if (!filteredTeachers || filteredTeachers.length === 0) return

    const result = exportSummary(filteredTeachers, buildExportFilename('thong-ke-giao-vien'))

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

  // Handle open edit note dialog
  const handleOpenEditNoteDialog = (teacherId: string, teacherName: string, teacherSkills: string[], currentNote?: string) => {
    setEditNoteDialog({
      open: true,
      teacherId,
      teacherName,
      teacherSkills,
      currentNote
    })
  }

  // Handle close edit note dialog
  const handleCloseEditNoteDialog = () => {
    setEditNoteDialog({
      open: false,
      teacherId: '',
      teacherName: '',
      teacherSkills: [],
      currentNote: undefined
    })
  }

  // Handle save note success
  const handleSaveNoteSuccess = () => {
    setNotification({
      open: true,
      message: 'Cập nhật ghi chú thành công!',
      severity: 'success'
    })
    handleCloseEditNoteDialog()
  }

  // Handle save note error
  const handleSaveNoteError = () => {
    setNotification({
      open: true,
      message: 'Cập nhật ghi chú thất bại!',
      severity: 'error'
    })
  }

  // Handle toggle pin teacher
  const handleTogglePinTeacher = (teacherId: string) => {
    const newPinnedIds = pinnedTeacherIds.includes(teacherId)
      ? pinnedTeacherIds.filter(id => id !== teacherId)
      : [...pinnedTeacherIds, teacherId]

    setPinnedTeacherIds(newPinnedIds)

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('pinned-teacher-ids', JSON.stringify(newPinnedIds))
    }
  }

  // Check if teacher is pinned
  const isTeacherPinned = (teacherId: string) => {
    return pinnedTeacherIds.includes(teacherId)
  }

  // Prepare data for DataGrid rows
  const gridRows = useMemo(() => {
    if (!filteredTimeSlots.length) return []

    // Group slots by day
    const groups: Record<string, { label: string; slots: typeof filteredTimeSlots }> = {}
    filteredTimeSlots.forEach(s => {
      const key = s.dayKey
      if (!groups[key]) groups[key] = { label: s.dayLabel, slots: [] as any }
      groups[key].slots.push(s)
    })

    const rows: any[] = []
    Object.values(groups).forEach(group => {
      const totalRowsInDay = group.slots.length
      group.slots.forEach((slot, idx) => {
        const row: any = {
          id: `${group.label}-${slot.time}-${slot.slot}`,
          day: group.label, // Show day label in all rows for merge effect
          dayKey: group.label,
          dayRowIndex: idx,
          dayTotalRows: totalRowsInDay,
          time: slot.time,
          slot: slot.slot
        }

        // Add data for each teacher
        filteredTeachers.forEach(teacher => {
          const isBusy = isTeacherBusy(teacher.registeredBusySchedule, slot.slot)
          const isTeaching = isTeacherTeaching(teacher.id, slot.slot)
          const teachingInfos = getTeachingInfos(teacher.id, slot.slot)

          row[`teacher_${teacher.id}`] = {
            teacherId: teacher.id,
            teacherName: teacher.name,
            isBusy,
            isTeaching,
            teachingInfos,
            slot: slot.slot,
            dayLabel: slot.dayLabel,
            time: slot.time
          }
        })

        rows.push(row)
      })
    })

    return rows
  }, [filteredTimeSlots, filteredTeachers, schedules])

  // Prepare columns for DataGrid
  const gridColumns = useMemo<GridColDef[]>(() => {
    const columns: GridColDef[] = [
      {
        field: 'day',
        headerName: 'Thứ',
        width: 120,
        minWidth: 120,
        headerAlign: 'center',
        align: 'left',
        sortable: false,
        renderCell: (params: GridRenderCellParams) => {
          const row = params.row as any
          const dayValue = params.value || row.dayKey // Use value from row data

          return (
            <Box
              sx={{
                fontWeight: 700,
                fontSize: '0.8rem',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 8px',
                backgroundColor: '#f0f0f0',
                borderRight: '2px solid #ccc',
                borderBottom: '1px solid #e0e0e0'
              }}
            >
              {dayValue ? (
                <Typography variant="body2" fontWeight={700} sx={{ textAlign: 'center' }}>
                  {dayValue}
                </Typography>
              ) : null}
            </Box>
          )
        }
      },
      {
        field: 'time',
        headerName: 'Khung giờ',
        width: 100,
        minWidth: 100,
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        renderCell: (params: GridRenderCellParams) => (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#fafafa',
              borderRight: '2px solid #ccc',
              borderBottom: '1px solid #e0e0e0'
            }}
          >
            <Typography variant="caption" color="primary" fontWeight={600}>
              {params.value}
            </Typography>
          </Box>
        )
      }
    ]

    // Add dynamic columns for each teacher
    filteredTeachers.forEach(teacher => {
      const isPinned = isTeacherPinned(teacher.id)
      columns.push({
        field: `teacher_${teacher.id}`,
        headerName: teacher.name,
        width: 250,
        minWidth: 220,
        flex: 0,
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        renderHeader: () => (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, flexDirection: 'column', width: '100%', p: 1 }}>
            <Box display="flex" alignItems="center" gap={0.5} width="100%">
              {isPinned && (
                <Tooltip title="Đã ghim">
                  <i className="ri-pushpin-fill" style={{ fontSize: '14px', color: '#ff9800' }} />
                </Tooltip>
              )}
              <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
                {teacher.name}
              </Typography>
              <Tooltip title={isPinned ? "Bỏ ghim" : "Ghim giáo viên"}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTogglePinTeacher(teacher.id)
                  }}
                  sx={{ padding: '2px' }}
                >
                  <i
                    className={isPinned ? "ri-pushpin-fill" : "ri-pushpin-line"}
                    style={{
                      fontSize: '14px',
                      color: isPinned ? '#ff9800' : '#1976d2'
                    }}
                  />
                </IconButton>
              </Tooltip>
              <Tooltip title="Chỉnh sửa ghi chú">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenEditNoteDialog(teacher.id, teacher.name, teacher.skills || [], teacher.note)
                  }}
                  sx={{ padding: '2px' }}
                >
                  <i className="ri-edit-line" style={{ fontSize: '14px', color: '#1976d2' }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="caption" color="text.secondary" display="block">
              {teacher.skills?.length || 0} kỹ năng
            </Typography>
            {teacher.note && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontStyle: 'italic',
                  color: '#666',
                  maxWidth: '180px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                title={teacher.note}
              >
                <i className="ri-file-text-line" style={{ marginRight: 4, fontSize: '12px' }} />
                {teacher.note}
              </Typography>
            )}
          </Box>
        ),
        renderCell: (params: GridRenderCellParams) => {
          const cellData = params.value as {
            teacherId: string
            teacherName: string
            isBusy: boolean
            isTeaching: boolean
            teachingInfos: any[]
            slot: number
            dayLabel: string
            time: string
          }

          if (!cellData) return null

          const { isBusy, isTeaching, teachingInfos, teacherName, dayLabel, time } = cellData

          return (
            <Box
              sx={{
                width: '100%',
                minHeight: '80px',
                padding: '4px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                overflow: 'visible',
                minWidth: 0
              }}
            >
              {isTeaching && teachingInfos.length > 0 ? (
                <TeachingInfosContainer sx={{ width: '100%', minWidth: 0 }}>
                  {teachingInfos.map((teachingInfo, index) => (
                    <TeachingInfo
                      key={`${teachingInfo.class_id}-${teachingInfo.lesson}-${index}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTeachingCellClick(
                          teachingInfo.class_id,
                          teachingInfo.lesson,
                          teacherName,
                          teachingInfo.class_name,
                          teachingInfo.schedule_time
                        )
                      }}
                      sx={{ cursor: 'pointer', width: '100%', minWidth: 0, flexShrink: 0 }}
                    >
                      <Box className="lesson-header">
                        <Box className="class-name" title={teachingInfo.class_name}>
                          {teachingInfo.class_name}
                        </Box>
                        {teachingInfo.lesson && (
                          <Box className="lesson-badge">
                            Buổi {teachingInfo.lesson}
                          </Box>
                        )}
                      </Box>
                      {teachingInfo.note && (
                        <Box className="lesson-note" title={teachingInfo.note}>
                          <i className="ri-file-text-line" style={{ marginRight: 4, fontSize: '12px' }} />
                          {teachingInfo.note}
                        </Box>
                      )}
                      {teachingInfo.students && Array.isArray(teachingInfo.students) && teachingInfo.students.length > 0 && (
                        <Box className="students-content">
                          <Box className="students-list">
                            {teachingInfo.students.slice(0, 7).map((student: any) => {
                              const coursename = student.coursename ? ` - ${student.coursename}` : ''
                              const displayLabel = student.note
                                ? `${student.fullname}${coursename} (${student.note})`
                                : `${student.fullname}${coursename}`
                              const rollcallStatusConfig = getRollcallStatusConfig(student.rollcall_status as RollcallStatus | undefined)
                              const isNotRollcall = !student.rollcall_status || student.rollcall_status === RollcallStatus.NOT_ROLLCALL

                              const studentSx = rollcallStatusConfig && !isNotRollcall
                                ? {
                                  backgroundColor: `${rollcallStatusConfig.backgroundColor} !important`,
                                  borderColor: `${rollcallStatusConfig.borderColor} !important`,
                                  color: `${rollcallStatusConfig.textColor} !important`,
                                  borderLeft: `4px solid ${rollcallStatusConfig.accentColor}`
                                }
                                : undefined

                              return (
                                <Tooltip title={displayLabel} arrow placement="top">
                                  <Box
                                    key={student.id}
                                    className="student-item"
                                    sx={studentSx}
                                  >
                                    <Typography
                                      component="span"
                                      variant="caption"
                                      sx={{
                                        fontWeight: 500,
                                        display: 'block',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        width: '100%'
                                      }}
                                    >
                                      {displayLabel}
                                    </Typography>
                                  </Box>
                                </Tooltip>
                              )
                            })}
                            {teachingInfo.students.length > 7 && (
                              <Box
                                className="student-item"
                                sx={{
                                  backgroundColor: '#e3f2fd !important',
                                  borderColor: '#90caf9 !important',
                                  color: '#1976d2 !important',
                                  fontStyle: 'italic',
                                  textAlign: 'center'
                                }}
                              >
                                <Typography component="span" variant="caption" sx={{ fontWeight: 600 }}>
                                  ...và {teachingInfo.students.length - 7} học sinh khác
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      )}
                    </TeachingInfo>
                  ))}
                </TeachingInfosContainer>
              ) : (
                <Tooltip
                  title={
                    isBusy
                      ? `${teacherName} bận vào ${dayLabel} ${time}`
                      : `${teacherName} rảnh vào ${dayLabel} ${time}`
                  }
                >
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isBusy ? '#ffebee' : '#f1f8e9',
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: isBusy ? '#ffcdd2' : '#dcedc8'
                      }
                    }}
                  >
                    <IconButton size="small">
                      {isBusy ? (
                        <i className="ri-close-line" style={{ color: '#c62828', fontSize: '18px' }} />
                      ) : (
                        <i className="ri-check-line" style={{ color: '#2e7d32', fontSize: '18px' }} />
                      )}
                    </IconButton>
                  </Box>
                </Tooltip>
              )}
            </Box>
          )
        }
      })
    })

    return columns
  }, [filteredTeachers, pinnedTeacherIds, schedules])

  // Render schedule table (reusable for both card and full screen modal)
  const renderScheduleTable = (isFullScreen: boolean = false) => {
    if (filteredTimeSlots.length === 0) {
      return (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={400} gap={2}>
          <i className="ri-calendar-line" style={{ fontSize: '48px', color: '#ccc' }} />
          <Typography variant="h6" color="text.secondary">
            Không có dữ liệu phù hợp
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Thử thay đổi bộ lọc để xem kết quả khác
          </Typography>
        </Box>
      )
    }

    return (
      <Box sx={{ height: isFullScreen ? 'calc(100vh - 300px)' : '70vh', width: '100%' }}>
        <DataGrid
          rows={gridRows}
          columns={gridColumns}
          disableColumnMenu
          disableRowSelectionOnClick
          disableDensitySelector
          hideFooter
          columnHeaderHeight={100}
          getRowHeight={() => 'auto'}
          getRowId={(row) => row.id}
          sx={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #e0e0e0',
              padding: '8px',
              display: 'flex',
              alignItems: 'flex-start',
              overflow: 'visible',
              minWidth: 0,
              '&:focus': {
                outline: 'none'
              },
              '&:focus-within': {
                outline: 'none'
              }
            },
            '& .MuiDataGrid-cell[data-field^="teacher_"]': {
              overflow: 'visible !important',
              minWidth: '220px'
            },
            '& .MuiDataGrid-row': {
              maxHeight: 'none !important'
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f5f5f5',
              borderBottom: '2px solid #e0e0e0'
            },
            '& .MuiDataGrid-columnHeader': {
              padding: '8px',
              '&:focus': {
                outline: 'none'
              },
              '&:focus-within': {
                outline: 'none'
              }
            },
            '& .MuiDataGrid-columnSeparator': {
              display: 'none'
            },
            '& .MuiDataGrid-virtualScroller': {
              overflowY: 'auto !important',
              overflowX: 'auto !important'
            },
            '& .MuiDataGrid-cell[data-field="day"]': {
              position: 'sticky',
              left: 0,
              zIndex: 3,
              backgroundColor: '#f0f0f0 !important'
            },
            '& .MuiDataGrid-columnHeader[data-field="day"]': {
              position: 'sticky',
              left: 0,
              zIndex: 4,
              backgroundColor: '#f5f5f5 !important'
            },
            '& .MuiDataGrid-cell[data-field="time"]': {
              position: 'sticky',
              left: 120,
              zIndex: 2,
              backgroundColor: '#fafafa !important'
            },
            '& .MuiDataGrid-columnHeader[data-field="time"]': {
              position: 'sticky',
              left: 120,
              zIndex: 3,
              backgroundColor: '#f5f5f5 !important'
            }
          }}
        />
      </Box>
    )
  }

  // Render filter section (reusable for both card and full screen modal)
  const renderFilterSection = () => (
    <>
      {/* Week Selection */}
      <Box sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 300 }}>
          <InputLabel>Tuần học</InputLabel>
          <Select
            value={selectedWeekId}
            onChange={(e) => setSelectedWeekId(e.target.value)}
            label="Tuần học"
            disabled={isWeeksLoading}
          >
            {isWeeksLoading ? (
              <MenuItem disabled>Đang tải...</MenuItem>
            ) : weeks.length === 0 ? (
              <MenuItem disabled>Không có dữ liệu</MenuItem>
            ) : (
              weeks.map((week: WeekResponseDto) => {
                const startDate = new Date(week.startDate)
                const endDate = new Date(startDate)
                endDate.setDate(endDate.getDate() + 6)

                return (
                  <MenuItem key={week.id} value={week.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <i className="ri-calendar-line" style={{ color: '#1976d2' }} />
                      <Box>
                        <Typography variant="body2">
                          {startDate.toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })} - {endDate.toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {week.scheduleStatus === WeekStatus.OPEN ? 'Mở' :
                            week.scheduleStatus === WeekStatus.CLOSED ? 'Đóng' : 'Chờ duyệt'}
                          {openWeek?.id === week.id && ' (Đang chọn)'}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                )
              })
            )}
          </Select>
        </FormControl>
      </Box>

      {/* Filter Section */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Autocomplete
              multiple
              options={teachers || []}
              getOptionLabel={(option) => option.name}
              value={selectedTeachers}
              onChange={(event, newValue) => {
                setSelectedTeachers(newValue)
              }}
              filterOptions={(options, { inputValue }) => {
                return options.filter(option =>
                  option.name.toLowerCase().includes(inputValue.toLowerCase()) ||
                  option.skills.some((skill: string) =>
                    skill.toLowerCase().includes(inputValue.toLowerCase())
                  )
                )
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Chọn giáo viên để lọc..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <i className="ri-search-line" style={{ color: '#666', marginRight: 8 }} />
                        {params.InputProps.startAdornment}
                      </>
                    ),
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
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={option.name}
                    size="small"
                    sx={{
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      border: '1px solid #bbdefb'
                    }}
                  />
                ))
              }
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {option.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.skills?.length || 0} kỹ năng: {option.skills?.join(', ') || 'Không có'}
                    </Typography>
                  </Box>
                </Box>
              )}
              noOptionsText="Không tìm thấy giáo viên"
              clearOnBlur={false}
              selectOnFocus
              handleHomeEndKeys
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Lọc theo ngày</InputLabel>
              <Select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                label="Lọc theo ngày"
              >
                <MenuItem value="all">Tất cả các ngày</MenuItem>
                {uniqueDayOptions.map((day) => (
                  <MenuItem key={day.key} value={day.key}>
                    {day.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Autocomplete
              multiple
              options={uniqueTimeRanges}
              value={selectedTimeRanges}
              onChange={(event, newValue) => {
                setSelectedTimeRanges(newValue)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Chọn khung giờ để lọc..."
                  label="Lọc theo khung giờ"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <i className="ri-time-line" style={{ color: '#666', marginRight: 8 }} />
                        {params.InputProps.startAdornment}
                      </>
                    ),
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
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option}
                    label={option}
                    size="small"
                    sx={{
                      backgroundColor: '#fff3e0',
                      color: '#e65100',
                      border: '1px solid #ffcc80'
                    }}
                  />
                ))
              }
              noOptionsText="Không có khung giờ nào"
              clearOnBlur={false}
              selectOnFocus
              handleHomeEndKeys
            />
          </Grid>
        </Grid>

        {/* Selected Teachers Display */}
        {selectedTeachers.length > 0 && (
          <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <i className="ri-filter-line" style={{ marginRight: 8 }} />
              Giáo viên đã chọn ({selectedTeachers.length}):
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {selectedTeachers.map((teacher) => (
                <Chip
                  key={teacher.id}
                  label={teacher.name}
                  size="small"
                  onDelete={() => {
                    setSelectedTeachers(prev => prev.filter(t => t.id !== teacher.id))
                  }}
                  sx={{
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    border: '1px solid #bbdefb'
                  }}
                />
              ))}
              <Chip
                label="Xóa tất cả"
                size="small"
                variant="outlined"
                onClick={() => setSelectedTeachers([])}
                sx={{
                  color: '#d32f2f',
                  borderColor: '#d32f2f',
                  '&:hover': {
                    backgroundColor: '#ffebee'
                  }
                }}
              />
            </Box>
          </Box>
        )}

        {/* Filter Summary */}
        {(selectedDay !== 'all' || selectedTimeRanges.length > 0) && (
          <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
              <i className="ri-filter-line" style={{ marginRight: 8 }} />
              Đang lọc:
              {selectedDay !== 'all' && (
                <Chip
                  label={`Ngày: ${selectedDayLabel || selectedDay}`}
                  size="small"
                  onDelete={() => setSelectedDay('all')}
                />
              )}
              {selectedTimeRanges.length > 0 && (
                <>
                  {selectedTimeRanges.map((timeRange) => (
                    <Chip
                      key={timeRange}
                      label={`Khung giờ: ${timeRange}`}
                      size="small"
                      onDelete={() => {
                        setSelectedTimeRanges(prev => prev.filter(t => t !== timeRange))
                      }}
                    />
                  ))}
                  {selectedTimeRanges.length > 1 && (
                    <Chip
                      label="Xóa tất cả khung giờ"
                      size="small"
                      variant="outlined"
                      onClick={() => setSelectedTimeRanges([])}
                      sx={{
                        color: '#d32f2f',
                        borderColor: '#d32f2f',
                        '&:hover': {
                          backgroundColor: '#ffebee'
                        }
                      }}
                    />
                  )}
                </>
              )}
            </Typography>
          </Box>
        )}
      </Box>
    </>
  )

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

              {/* Full Screen Button */}
              <Button
                variant="outlined"
                startIcon={<i className="ri-fullscreen-line" />}
                onClick={() => setFullScreenOpen(true)}
              >
                Toàn màn hình
              </Button>

              {/* Export Button */}
              <Button
                variant="contained"
                startIcon={<i className="ri-download-line" />}
                onClick={handleExportClick}
                disabled={!filteredTeachers || filteredTeachers.length === 0}
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
          {renderFilterSection()}
          {renderScheduleTable(false)}
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
        weekId={selectedWeekId}
        teacherName={scheduleDetailPopup.teacherName}
        className={scheduleDetailPopup.className}
        scheduleTime={scheduleDetailPopup.scheduleTime}
      />

      {/* Edit Note Dialog */}
      <EditTeacherNoteDialog
        open={editNoteDialog.open}
        onClose={handleCloseEditNoteDialog}
        teacherId={editNoteDialog.teacherId}
        teacherName={editNoteDialog.teacherName}
        teacherSkills={editNoteDialog.teacherSkills}
        currentNote={editNoteDialog.currentNote}
        onSuccess={handleSaveNoteSuccess}
        onError={handleSaveNoteError}
      />

      {/* Full Screen Schedule Dialog */}
      <Dialog
        open={fullScreenOpen}
        onClose={() => setFullScreenOpen(false)}
        maxWidth={false}
        fullWidth
        fullScreen
        PaperProps={{
          sx: {
            m: 0,
            height: '100vh',
            maxHeight: '100vh',
            borderRadius: 0
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <i className="ri-calendar-schedule-line" style={{ fontSize: 28, color: '#1976d2' }} />
              <Box>
                <Typography variant="h5" fontWeight={600}>
                  Lịch rảnh giáo viên - Toàn màn hình
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Quản lý lịch rảnh của tất cả giáo viên theo từng khung giờ trong tuần
                </Typography>
              </Box>
            </Box>
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
              <Button
                variant="outlined"
                startIcon={<i className="ri-download-line" />}
                onClick={handleExportClick}
                disabled={!filteredTeachers || filteredTeachers.length === 0}
              >
                Xuất file
              </Button>
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
              <IconButton
                onClick={() => setFullScreenOpen(false)}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                <i className="ri-fullscreen-exit-line" style={{ fontSize: 24 }} />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, height: 'calc(100vh - 120px)', overflow: 'auto' }}>
          {renderFilterSection()}
          {renderScheduleTable(true)}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default TeachersSchedule 
