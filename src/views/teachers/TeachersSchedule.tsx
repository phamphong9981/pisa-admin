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
  DialogActions,
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
import { useTeacherList, useUpdateTeacher, useTeacherScheduleNotesByWeek, TeacherScheduleNoteResponseDto } from '@/@core/hooks/useTeacher'
import { useGetWeeks, WeekResponseDto, ScheduleStatus as WeekStatus } from '@/@core/hooks/useWeek'
import { RegionId, RegionLabel } from '@/@core/hooks/useCourse'

// Components
import ScheduleDetailPopup from './ScheduleDetailPopup'
import EditTeacherNoteDialog from './EditTeacherNoteDialog'
import EditTeacherScheduleNoteDialog from './EditTeacherScheduleNoteDialog'

// Region color mapping
const REGION_COLORS: Record<number, string> = {
  [RegionId.HALONG]: '#f6b26b',
  [RegionId.BAICHAY]: '#24cdb4',
  [RegionId.CAMPHA]: '#8e7cc3',
  [RegionId.UONGBI]: '#91e9b2',
  [RegionId.HAIDUONG]: '#4caf50'
}

const getRegionColor = (region?: number): string => {
  if (!region || !REGION_COLORS[region]) {
    return '#e3f2fd' // Default blue color
  }
  return REGION_COLORS[region]
}

const TeachingInfo = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'region'
})<{ region?: number }>(({ theme, region }) => {
  const regionColor = getRegionColor(region)
  const isLightColor = region && REGION_COLORS[region]

  return {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '8px',
    overflow: 'hidden',
    border: `1px solid ${isLightColor ? regionColor : '#e0e0e0'}`,
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
      backgroundColor: isLightColor ? regionColor : '#e3f2fd',
      borderBottom: `1px solid ${isLightColor ? regionColor : '#bbdefb'}`,
      '& .class-name': {
        fontSize: '0.7rem',
        fontWeight: 600,
        color: isLightColor ? '#fff' : '#1976d2',
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
        color: isLightColor ? '#fff' : '#1976d2',
        backgroundColor: isLightColor ? 'rgba(255, 255, 255, 0.3)' : '#fff',
        padding: '2px 6px',
        borderRadius: '6px',
        border: `1px solid ${isLightColor ? 'rgba(255, 255, 255, 0.5)' : '#bbdefb'}`,
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
          width: '100%',
          minWidth: 0,
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }
      }
    }
  }
})

const TeachingInfosContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  width: '100%',
  minWidth: 0
}))

// Component to render schedule cell with note support
const ScheduleCell = ({
  teacherId,
  teacherName,
  isBusy,
  dayLabel,
  time,
  scheduleTime,
  scheduleNote,
  onEditNote
}: {
  teacherId: string
  teacherName: string
  isBusy: boolean
  dayLabel: string
  time: string
  scheduleTime: number
  scheduleNote?: string
  onEditNote: (teacherId: string, teacherName: string, scheduleTime: number, dayLabel: string, time: string, currentNote?: string) => void
}) => {

  return (
    <Tooltip
      title={
        scheduleNote
          ? `Ghi chú: ${scheduleNote} - Click để chỉnh sửa`
          : isBusy
            ? `${teacherName} bận vào ${dayLabel} ${time} - Ghi chú của BPXL`
            : `${teacherName} rảnh vào ${dayLabel} ${time} - Ghi chú của BPXL`
      }
    >
      <Box
        onClick={(e) => {
          e.stopPropagation()
          onEditNote(teacherId, teacherName, scheduleTime, dayLabel, time, scheduleNote)
        }}
        sx={{
          width: '100%',
          height: '100%',
          minHeight: '80px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          backgroundColor: isBusy ? '#ffebee' : '#f1f8e9',
          borderRadius: 1,
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            backgroundColor: isBusy ? '#ffcdd2' : '#dcedc8'
          }
        }}
      >
        {/* Note header - nổi bật ở đầu cell */}
        {scheduleNote && (
          <Box
            sx={{
              width: '100%',
              backgroundColor: '#fff3cd',
              borderBottom: '2px solid #ffc107',
              padding: '4px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              minHeight: '24px',
              flexShrink: 0
            }}
            title={scheduleNote}
            onClick={(e) => {
              e.stopPropagation()
              onEditNote(teacherId, teacherName, scheduleTime, dayLabel, time, scheduleNote)
            }}
          >
            <i className="ri-file-text-line" style={{ fontSize: '12px', color: '#856404', flexShrink: 0 }} />
            <Typography
              variant="caption"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: '#856404',
                fontWeight: 600,
                fontSize: '0.7rem',
                flex: 1,
                minWidth: 0
              }}
            >
              {scheduleNote}
            </Typography>
          </Box>
        )}

        {/* Main cell content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: scheduleNote ? '4px' : '8px'
          }}
        >
          <IconButton size="small" sx={{ pointerEvents: 'none' }}>
            {isBusy ? (
              <i className="ri-close-line" style={{ color: '#c62828', fontSize: '18px' }} />
            ) : (
              <i className="ri-check-line" style={{ color: '#2e7d32', fontSize: '18px' }} />
            )}
          </IconButton>
        </Box>

        {/* Edit hint when no note */}
        {!scheduleNote && (
          <Box
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              opacity: 0.3,
              '&:hover': {
                opacity: 0.6
              }
            }}
          >
            <i className="ri-edit-line" style={{ fontSize: '12px', color: '#666' }} />
          </Box>
        )}
      </Box>
    </Tooltip>
  )
}


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
  // Week selection
  const { data: weeksData, isLoading: isWeeksLoading } = useGetWeeks()
  const [selectedWeekId, setSelectedWeekId] = useState<string>('')

  // Get teachers with weekId to fetch busy schedule for that week
  const { data: teachers, isLoading, error } = useTeacherList(undefined, selectedWeekId || undefined)

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

  // Fetch all schedule notes for the selected week
  const { data: allScheduleNotes } = useTeacherScheduleNotesByWeek(selectedWeekId || '')

  // Create a map for quick lookup: key = `${teacherId}_${scheduleTime}`, value = note
  const scheduleNotesMap = useMemo(() => {
    const map = new Map<string, string>()

    if (!allScheduleNotes || allScheduleNotes.length === 0) return map

    allScheduleNotes.forEach(note => {
      if (note.teacherId && note.scheduleTime !== undefined) {
        const key = `${note.teacherId}_${note.scheduleTime}`
        if (note.note) {
          map.set(key, note.note)
        }
      }
    })

    return map
  }, [allScheduleNotes])

  // Helper function to get note for a teacher at a specific schedule time
  const getScheduleNote = (teacherId: string, scheduleTime: number): string | undefined => {
    const key = `${teacherId}_${scheduleTime}`
    return scheduleNotesMap.get(key)
  }

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
  const [selectedRegions, setSelectedRegions] = useState<number[]>([])
  const [selectedFreeTimeRanges, setSelectedFreeTimeRanges] = useState<string[]>([])

  // States for saved filter groups
  interface SavedFilterGroup {
    id: string
    name: string
    teacherIds: string[]
    createdAt: string
  }

  const [savedFilterGroups, setSavedFilterGroups] = useState<SavedFilterGroup[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('teacher-filter-groups')
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

  const [saveGroupDialogOpen, setSaveGroupDialogOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [loadGroupMenuAnchor, setLoadGroupMenuAnchor] = useState<null | HTMLElement>(null)

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

  // State for schedule note dialog
  const [scheduleNoteDialog, setScheduleNoteDialog] = useState<{
    open: boolean
    teacherId: string
    teacherName: string
    weekId: string
    scheduleTime: number
    dayLabel: string
    time: string
    currentNote?: string
  }>({
    open: false,
    teacherId: '',
    teacherName: '',
    weekId: '',
    scheduleTime: 0,
    dayLabel: '',
    time: '',
    currentNote: undefined
  })

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

  // Check if teacher has any schedule in selected regions
  const teacherHasScheduleInSelectedRegions = useMemo(() => {
    if (!schedules || selectedRegions.length === 0) {
      return new Set<string>() // Return empty set if no filtering needed
    }

    const teacherIdsWithSchedules = new Set<string>()

    schedules.forEach(schedule => {
      // Check if schedule belongs to selected regions
      if (schedule.region !== undefined && schedule.region !== null && selectedRegions.includes(schedule.region)) {
        // Add teacher_id if exists
        if (schedule.teacher_id) {
          teacherIdsWithSchedules.add(schedule.teacher_id)
        }
        // Also check students' teacher_id
        if (schedule.students && Array.isArray(schedule.students)) {
          schedule.students.forEach((student: any) => {
            if (student.teacher_id) {
              teacherIdsWithSchedules.add(student.teacher_id)
            }
          })
        }
      }
    })

    return teacherIdsWithSchedules
  }, [schedules, selectedRegions])

  // Map time ranges to slot indices (1-based)
  const timeRangeToSlotIndices = useMemo(() => {
    if (selectedFreeTimeRanges.length === 0) {
      return new Set<number>()
    }

    const slotIndices = new Set<number>()

    SCHEDULE_TIME.forEach((slotString, index) => {
      const parts = slotString.split(' ')
      const time = parts[0]

      if (selectedFreeTimeRanges.includes(time)) {
        slotIndices.add(index + 1) // Convert to 1-based index
      }
    })

    return slotIndices
  }, [selectedFreeTimeRanges])

  // Check if teacher is free in selected time ranges
  const teacherIsFreeInSelectedTimeRanges = useMemo(() => {
    if (selectedFreeTimeRanges.length === 0) {
      return new Set<string>() // Return empty set if no filtering needed
    }

    const freeTeacherIds = new Set<string>()

    if (!teachers) return freeTeacherIds

    teachers.forEach(teacher => {
      const busySchedule = teacher.registeredBusySchedule || []

      // Check if teacher is free in ALL selected time ranges
      const isFreeInAllRanges = Array.from(timeRangeToSlotIndices).every(slotIndex => {
        // Teacher is free if slotIndex is NOT in busySchedule
        return !busySchedule.includes(slotIndex)
      })

      if (isFreeInAllRanges) {
        freeTeacherIds.add(teacher.id)
      }
    })

    return freeTeacherIds
  }, [teachers, selectedFreeTimeRanges, timeRangeToSlotIndices])

  // Filter teachers based on selected teachers, selected regions, and sort by pinned status
  const filteredTeachers = useMemo(() => {
    if (!teachers) return []

    let result = teachers

    // Filter by selected teachers
    if (selectedTeachers.length > 0) {
      result = result.filter(teacher =>
        selectedTeachers.some(selected => selected.id === teacher.id)
      )
    }

    // Filter by selected regions - only show teachers who have schedules in selected regions
    if (selectedRegions.length > 0) {
      result = result.filter(teacher =>
        teacherHasScheduleInSelectedRegions.has(teacher.id)
      )
    }

    // Filter by free time ranges - only show teachers who are free in ALL selected time ranges
    if (selectedFreeTimeRanges.length > 0) {
      result = result.filter(teacher =>
        teacherIsFreeInSelectedTimeRanges.has(teacher.id)
      )
    }

    // Sort: pinned teachers first (in order of pinnedTeacherIds), then others
    result = [...result].sort((a, b) => {
      const aIsPinned = pinnedTeacherIds.includes(a.id)
      const bIsPinned = pinnedTeacherIds.includes(b.id)

      if (aIsPinned && !bIsPinned) return -1
      if (!aIsPinned && bIsPinned) return 1

      // If both pinned, sort by their order in pinnedTeacherIds
      if (aIsPinned && bIsPinned) {
        const aIndex = pinnedTeacherIds.indexOf(a.id)
        const bIndex = pinnedTeacherIds.indexOf(b.id)
        return aIndex - bIndex
      }

      // If both not pinned, maintain original order
      return 0
    })

    return result
  }, [teachers, selectedTeachers, pinnedTeacherIds, selectedRegions, selectedFreeTimeRanges, teacherHasScheduleInSelectedRegions, teacherIsFreeInSelectedTimeRanges])

  // Handle open schedule note dialog
  const handleOpenScheduleNoteDialog = (teacherId: string, teacherName: string, scheduleTime: number, dayLabel: string, time: string, currentNote?: string) => {
    if (!selectedWeekId) return

    setScheduleNoteDialog({
      open: true,
      teacherId,
      teacherName,
      weekId: selectedWeekId,
      scheduleTime,
      dayLabel,
      time,
      currentNote
    })
  }

  // Handle close schedule note dialog
  const handleCloseScheduleNoteDialog = () => {
    setScheduleNoteDialog(prev => ({
      ...prev,
      open: false,
      teacherId: '',
      teacherName: '',
      weekId: '',
      scheduleTime: 0,
      dayLabel: '',
      time: '',
      currentNote: undefined
    }))
  }

  // Handle save schedule note success
  const handleSaveScheduleNoteSuccess = () => {
    setNotification({
      open: true,
      message: 'Cập nhật ghi chú lịch thành công!',
      severity: 'success'
    })
    handleCloseScheduleNoteDialog()
  }

  // Handle save schedule note error
  const handleSaveScheduleNoteError = () => {
    setNotification({
      open: true,
      message: 'Cập nhật ghi chú lịch thất bại!',
      severity: 'error'
    })
  }

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

    let filteredSchedules = schedules.filter(schedule =>
      (schedule.teacher_id === teacherId || schedule.students?.some(student => student.teacher_id === teacherId)) && schedule.schedule_time === slotIndex + 1
    )

    // Filter by selected regions if any
    if (selectedRegions.length > 0) {
      filteredSchedules = filteredSchedules.filter(schedule => {
        // If schedule has region, check if it's in selected regions
        if (schedule.region !== undefined && schedule.region !== null) {
          return selectedRegions.includes(schedule.region)
        }
        // If no region info, exclude it when filtering
        return false
      })
    }

    return filteredSchedules
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
          label: 'Vắng mặt',
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

  // Handle save filter group
  const handleSaveFilterGroup = () => {
    if (!groupName.trim() || selectedTeachers.length === 0) {
      setNotification({
        open: true,
        message: 'Vui lòng nhập tên group và chọn ít nhất một giáo viên!',
        severity: 'error'
      })
      return
    }

    const newGroup: SavedFilterGroup = {
      id: Date.now().toString(),
      name: groupName.trim(),
      teacherIds: selectedTeachers.map(t => t.id),
      createdAt: new Date().toISOString()
    }

    const updatedGroups = [...savedFilterGroups, newGroup]
    setSavedFilterGroups(updatedGroups)

    if (typeof window !== 'undefined') {
      localStorage.setItem('teacher-filter-groups', JSON.stringify(updatedGroups))
    }

    setNotification({
      open: true,
      message: `Đã lưu group "${groupName.trim()}" thành công!`,
      severity: 'success'
    })

    setGroupName('')
    setSaveGroupDialogOpen(false)
  }

  // Handle load filter group
  const handleLoadFilterGroup = (group: SavedFilterGroup) => {
    if (!teachers) return

    const groupTeachers = teachers.filter(teacher =>
      group.teacherIds.includes(teacher.id)
    )
    setSelectedTeachers(groupTeachers)
    setLoadGroupMenuAnchor(null)

    setNotification({
      open: true,
      message: `Đã tải group "${group.name}" thành công!`,
      severity: 'success'
    })
  }

  // Handle delete filter group
  const handleDeleteFilterGroup = (groupId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    const updatedGroups = savedFilterGroups.filter(g => g.id !== groupId)
    setSavedFilterGroups(updatedGroups)

    if (typeof window !== 'undefined') {
      localStorage.setItem('teacher-filter-groups', JSON.stringify(updatedGroups))
    }

    setNotification({
      open: true,
      message: 'Đã xóa group thành công!',
      severity: 'success'
    })
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

      // Get all schedule notes for this teacher
      const teacherScheduleNotes = allScheduleNotes?.filter(note => note.teacherId === teacher.id) || []
      const hasScheduleNotes = teacherScheduleNotes.length > 0

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
            <Box display="flex" alignItems="center" gap={1} width="100%" flexWrap="wrap">
              <Typography variant="caption" color="text.secondary">
                {teacher.skills?.join(', ') || 'Không có kỹ năng'}
              </Typography>
            </Box>
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
          const scheduleNote = getScheduleNote(cellData.teacherId, cellData.slot + 1)

          return (
            <Box
              sx={{
                width: '100%',
                minHeight: '80px',
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                justifyContent: 'flex-start',
                overflow: 'visible',
                minWidth: 0,
                gap: 0.5
              }}
            >
              {/* Schedule Note for Teacher - Always visible when teaching, or when there's a note */}
              {isTeaching && (
                <Box
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenScheduleNoteDialog(cellData.teacherId, teacherName, cellData.slot + 1, dayLabel, time, scheduleNote)
                  }}
                  sx={{
                    width: '100%',
                    backgroundColor: scheduleNote ? '#fff3cd' : 'transparent',
                    borderBottom: scheduleNote ? '2px solid #ffc107' : '1px dashed #ccc',
                    padding: scheduleNote ? '4px 6px' : '2px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    minHeight: scheduleNote ? '24px' : '20px',
                    flexShrink: 0,
                    cursor: 'pointer',
                    borderRadius: '4px 4px 0 0',
                    '&:hover': {
                      backgroundColor: scheduleNote ? '#ffe69c' : '#f5f5f5'
                    }
                  }}
                  title={scheduleNote ? `Ghi chú: ${scheduleNote} - Click để chỉnh sửa` : 'Ghi chú của BPXL'}
                >
                  <i className="ri-file-text-line" style={{ fontSize: '12px', color: scheduleNote ? '#856404' : '#999', flexShrink: 0 }} />
                  <Typography
                    variant="caption"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: scheduleNote ? '#856404' : '#999',
                      fontWeight: scheduleNote ? 600 : 400,
                      fontSize: '0.7rem',
                      flex: 1,
                      minWidth: 0,
                      fontStyle: scheduleNote ? 'normal' : 'italic'
                    }}
                  >
                    {scheduleNote || 'Ghi chú của BPXL...'}
                  </Typography>
                  <i className="ri-edit-line" style={{ fontSize: '12px', color: scheduleNote ? '#856404' : '#999', flexShrink: 0, opacity: 0.6 }} />
                </Box>
              )}

              {/* Teaching Info or Schedule Cell */}
              {isTeaching && teachingInfos.length > 0 ? (
                <TeachingInfosContainer sx={{ width: '100%', minWidth: 0 }}>
                  {teachingInfos.map((teachingInfo, index) => (
                    <TeachingInfo
                      key={`${teachingInfo.class_id}-${teachingInfo.lesson}-${index}`}
                      region={teachingInfo.region}
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
                        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                          <Box className="class-name" title={teachingInfo.class_name}>
                            {teachingInfo.class_name}
                          </Box>
                          {(teachingInfo.start_time || teachingInfo.end_time) && (
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: '0.6rem',
                                color: teachingInfo.region && REGION_COLORS[teachingInfo.region]
                                  ? 'rgba(255, 255, 255, 0.8)'
                                  : 'rgba(25, 118, 210, 0.7)',
                                fontWeight: 400,
                                lineHeight: 1.2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {teachingInfo.start_time && teachingInfo.end_time
                                ? `${teachingInfo.start_time} - ${teachingInfo.end_time}`
                                : teachingInfo.start_time || teachingInfo.end_time}
                            </Typography>
                          )}
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
                            {teachingInfo.students.slice(0, 15).map((student: any) => {
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
                                : {
                                  color: '#000000 !important'
                                }

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
                                        width: '100%',
                                        color: '#000000 !important'
                                      }}
                                    >
                                      {displayLabel}
                                    </Typography>
                                    {student.rollcall_reason && (
                                      <Typography
                                        component="span"
                                        variant="caption"
                                        sx={{
                                          fontSize: '0.6rem',
                                          color: rollcallStatusConfig && !isNotRollcall
                                            ? rollcallStatusConfig.textColor
                                            : 'rgba(0, 0, 0, 0.6)',
                                          fontStyle: 'italic',
                                          display: 'block',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          width: '100%',
                                          lineHeight: 1.2,
                                          opacity: 0.8
                                        }}
                                      >
                                        {student.rollcall_reason}
                                      </Typography>
                                    )}
                                  </Box>
                                </Tooltip>
                              )
                            })}
                            {teachingInfo.students.length > 15 && (
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
                                  ...và {teachingInfo.students.length - 15} học sinh khác
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
                <ScheduleCell
                  teacherId={cellData.teacherId}
                  teacherName={teacherName}
                  isBusy={isBusy}
                  dayLabel={dayLabel}
                  time={time}
                  scheduleTime={cellData.slot + 1}
                  scheduleNote={scheduleNote}
                  onEditNote={handleOpenScheduleNoteDialog}
                />
              )}
            </Box>
          )
        }
      })
    })

    return columns
  }, [filteredTeachers, pinnedTeacherIds, schedules, selectedWeekId, allScheduleNotes, selectedRegions, handleOpenScheduleNoteDialog, handleOpenEditNoteDialog, handleTogglePinTeacher, isTeacherPinned, getRollcallStatusConfig, getScheduleNote])

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
        {/* Filter Groups Management */}
        <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<i className="ri-save-line" />}
            onClick={() => setSaveGroupDialogOpen(true)}
            disabled={selectedTeachers.length === 0}
          >
            Lưu group
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<i className="ri-folder-open-line" />}
            onClick={(e) => setLoadGroupMenuAnchor(e.currentTarget)}
            disabled={savedFilterGroups.length === 0}
          >
            Tải group ({savedFilterGroups.length})
          </Button>
          <Menu
            anchorEl={loadGroupMenuAnchor}
            open={Boolean(loadGroupMenuAnchor)}
            onClose={() => setLoadGroupMenuAnchor(null)}
            PaperProps={{
              sx: { maxHeight: 400, width: 300 }
            }}
          >
            {savedFilterGroups.length === 0 ? (
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">
                  Chưa có group nào được lưu
                </Typography>
              </MenuItem>
            ) : (
              savedFilterGroups.map((group) => (
                <MenuItem
                  key={group.id}
                  onClick={() => handleLoadFilterGroup(group)}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {group.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {group.teacherIds.length} giáo viên • {new Date(group.createdAt).toLocaleDateString('vi-VN')}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleDeleteFilterGroup(group.id, e)}
                    sx={{ ml: 1 }}
                  >
                    <i className="ri-delete-bin-line" style={{ fontSize: '16px', color: '#d32f2f' }} />
                  </IconButton>
                </MenuItem>
              ))
            )}
          </Menu>
        </Box>

        {/* Horizontal Filters - Lọc theo trục ngang (lọc hàng: ngày và khung giờ) */}
        <Box sx={{ mb: 2, p: 2, backgroundColor: '#fff8e1', borderRadius: 1, border: '1px solid #ffe082' }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, color: '#f57c00' }}>
            <i className="ri-arrow-left-right-line" style={{ fontSize: '18px' }} />
            Lọc theo trục ngang (Hàng)
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              - Lọc các hàng thời gian hiển thị trên bảng
            </Typography>
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Lọc theo ngày</InputLabel>
                <Select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  label="Lọc theo ngày"
                  sx={{ backgroundColor: 'white' }}
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
            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                size="small"
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
                          <i className="ri-time-line" style={{ color: '#f57c00', marginRight: 8 }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white',
                        '&:hover fieldset': {
                          borderColor: '#f57c00',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#f57c00',
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
        </Box>

        {/* Vertical Filters - Lọc theo trục dọc (lọc cột: giáo viên) */}
        <Box sx={{ mb: 2, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1, border: '1px solid #90caf9' }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, color: '#1976d2' }}>
            <i className="ri-arrow-up-down-line" style={{ fontSize: '18px' }} />
            Lọc theo trục dọc (Cột)
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              - Lọc các cột giáo viên hiển thị trên bảng
            </Typography>
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <Autocomplete
                multiple
                size="small"
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
                    placeholder="Chọn giáo viên..."
                    label="Chọn giáo viên"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <i className="ri-user-search-line" style={{ color: '#1976d2', marginRight: 8 }} />
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
                        backgroundColor: '#bbdefb',
                        color: '#1565c0',
                        border: '1px solid #90caf9'
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
              <Autocomplete
                multiple
                size="small"
                options={uniqueTimeRanges}
                value={selectedFreeTimeRanges}
                onChange={(event, newValue) => {
                  setSelectedFreeTimeRanges(newValue)
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Lọc GV rảnh trong khung giờ..."
                    label="Lọc GV rảnh trong khung giờ"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <i className="ri-user-heart-line" style={{ color: '#2e7d32', marginRight: 8 }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white',
                        '&:hover fieldset': {
                          borderColor: '#2e7d32',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#2e7d32',
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
                        backgroundColor: '#c8e6c9',
                        color: '#2e7d32',
                        border: '1px solid #a5d6a7',
                        fontWeight: 600
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
            <Grid item xs={12} md={4}>
              <Autocomplete
                multiple
                size="small"
                options={Object.values(RegionId).filter((v): v is RegionId => typeof v === 'number')}
                getOptionLabel={(option) => RegionLabel[option as RegionId]}
                value={selectedRegions}
                onChange={(event, newValue) => {
                  setSelectedRegions(newValue)
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Lọc GV theo khu vực..."
                    label="Lọc GV theo khu vực"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <i className="ri-map-pin-line" style={{ color: '#7b1fa2', marginRight: 8 }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white',
                        '&:hover fieldset': {
                          borderColor: '#7b1fa2',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#7b1fa2',
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
                      label={RegionLabel[option as RegionId]}
                      size="small"
                      sx={{
                        backgroundColor: REGION_COLORS[option] || '#e3f2fd',
                        color: '#fff',
                        border: `1px solid ${REGION_COLORS[option] || '#bbdefb'}`,
                        fontWeight: 600
                      }}
                    />
                  ))
                }
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: REGION_COLORS[option] || '#e3f2fd'
                        }}
                      />
                      <Typography variant="body2" fontWeight={600}>
                        {RegionLabel[option as RegionId]}
                      </Typography>
                    </Box>
                  </Box>
                )}
                noOptionsText="Không có khu vực nào"
                clearOnBlur={false}
                selectOnFocus
                handleHomeEndKeys
              />
            </Grid>
          </Grid>
        </Box>

        {/* Filter Summary - Combined display */}
        {(selectedDay !== 'all' || selectedTimeRanges.length > 0 || selectedRegions.length > 0 || selectedFreeTimeRanges.length > 0 || selectedTeachers.length > 0) && (
          <Box sx={{ p: 2, backgroundColor: '#fafafa', borderRadius: 1, border: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <i className="ri-filter-3-line" style={{ fontSize: '18px', color: '#666' }} />
              Tổng hợp bộ lọc đang áp dụng
            </Typography>

            <Grid container spacing={2}>
              {/* Horizontal Filters Summary */}
              {(selectedDay !== 'all' || selectedTimeRanges.length > 0) && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 1.5, backgroundColor: '#fff8e1', borderRadius: 1, border: '1px solid #ffe082' }}>
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#f57c00', fontWeight: 600, mb: 1 }}>
                      <i className="ri-arrow-left-right-line" style={{ fontSize: '14px' }} />
                      Trục ngang (Hàng):
                    </Typography>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {selectedDay !== 'all' && (
                        <Chip
                          label={`Ngày: ${selectedDayLabel || selectedDay}`}
                          size="small"
                          onDelete={() => setSelectedDay('all')}
                          sx={{
                            backgroundColor: '#fff3e0',
                            color: '#e65100',
                            border: '1px solid #ffcc80'
                          }}
                        />
                      )}
                      {selectedTimeRanges.map((timeRange) => (
                        <Chip
                          key={timeRange}
                          label={`Giờ: ${timeRange}`}
                          size="small"
                          onDelete={() => {
                            setSelectedTimeRanges(prev => prev.filter(t => t !== timeRange))
                          }}
                          sx={{
                            backgroundColor: '#fff3e0',
                            color: '#e65100',
                            border: '1px solid #ffcc80'
                          }}
                        />
                      ))}
                      {(selectedDay !== 'all' || selectedTimeRanges.length > 0) && (
                        <Chip
                          label="Xóa lọc ngang"
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setSelectedDay('all')
                            setSelectedTimeRanges([])
                          }}
                          sx={{
                            color: '#e65100',
                            borderColor: '#e65100',
                            '&:hover': {
                              backgroundColor: '#fff3e0'
                            }
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </Grid>
              )}

              {/* Vertical Filters Summary */}
              {(selectedTeachers.length > 0 || selectedFreeTimeRanges.length > 0 || selectedRegions.length > 0) && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 1.5, backgroundColor: '#e3f2fd', borderRadius: 1, border: '1px solid #90caf9' }}>
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#1976d2', fontWeight: 600, mb: 1 }}>
                      <i className="ri-arrow-up-down-line" style={{ fontSize: '14px' }} />
                      Trục dọc (Cột):
                    </Typography>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {selectedTeachers.map((teacher) => (
                        <Chip
                          key={teacher.id}
                          label={teacher.name}
                          size="small"
                          onDelete={() => {
                            setSelectedTeachers(prev => prev.filter(t => t.id !== teacher.id))
                          }}
                          sx={{
                            backgroundColor: '#bbdefb',
                            color: '#1565c0',
                            border: '1px solid #90caf9'
                          }}
                        />
                      ))}
                      {selectedFreeTimeRanges.map((timeRange) => (
                        <Chip
                          key={`free-${timeRange}`}
                          label={`Rảnh: ${timeRange}`}
                          size="small"
                          onDelete={() => {
                            setSelectedFreeTimeRanges(prev => prev.filter(t => t !== timeRange))
                          }}
                          sx={{
                            backgroundColor: '#c8e6c9',
                            color: '#2e7d32',
                            border: '1px solid #a5d6a7',
                            fontWeight: 600
                          }}
                        />
                      ))}
                      {selectedRegions.map((region) => (
                        <Chip
                          key={region}
                          label={`KV: ${RegionLabel[region as RegionId]}`}
                          size="small"
                          onDelete={() => {
                            setSelectedRegions(prev => prev.filter(r => r !== region))
                          }}
                          sx={{
                            backgroundColor: REGION_COLORS[region] || '#e3f2fd',
                            color: '#fff',
                            border: `1px solid ${REGION_COLORS[region] || '#bbdefb'}`,
                            fontWeight: 600
                          }}
                        />
                      ))}
                      <Chip
                        label="Xóa lọc dọc"
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedTeachers([])
                          setSelectedFreeTimeRanges([])
                          setSelectedRegions([])
                        }}
                        sx={{
                          color: '#1976d2',
                          borderColor: '#1976d2',
                          '&:hover': {
                            backgroundColor: '#e3f2fd'
                          }
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>

            {/* Clear All Filters */}
            <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
              <Chip
                icon={<i className="ri-delete-bin-line" style={{ fontSize: '14px' }} />}
                label="Xóa tất cả bộ lọc"
                size="small"
                variant="outlined"
                onClick={() => {
                  setSelectedDay('all')
                  setSelectedTimeRanges([])
                  setSelectedTeachers([])
                  setSelectedFreeTimeRanges([])
                  setSelectedRegions([])
                }}
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
      {/* PISA TEACHER */}
      <Card>
        <CardHeader
          title="PISA TEACHER"
          subheader="Quản lý lịch giảng dạy của giáo viên PISA trong tuần"
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

      {/* Edit Schedule Note Dialog */}
      <EditTeacherScheduleNoteDialog
        open={scheduleNoteDialog.open}
        onClose={handleCloseScheduleNoteDialog}
        teacherId={scheduleNoteDialog.teacherId}
        teacherName={scheduleNoteDialog.teacherName}
        weekId={scheduleNoteDialog.weekId}
        scheduleTime={scheduleNoteDialog.scheduleTime}
        dayLabel={scheduleNoteDialog.dayLabel}
        time={scheduleNoteDialog.time}
        currentNote={scheduleNoteDialog.currentNote}
        onSuccess={handleSaveScheduleNoteSuccess}
        onError={handleSaveScheduleNoteError}
      />

      {/* Save Filter Group Dialog */}
      <Dialog open={saveGroupDialogOpen} onClose={() => {
        setSaveGroupDialogOpen(false)
        setGroupName('')
      }} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <i className="ri-save-line" style={{ fontSize: '24px', color: '#1976d2' }} />
            <Typography variant="h6" fontWeight={600}>
              Lưu group filter giáo viên
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Tên group"
              placeholder="Nhập tên group (ví dụ: Giáo viên Toán, Giáo viên Anh văn...)"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSaveFilterGroup()
                }
              }}
            />
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Số giáo viên đã chọn: <strong>{selectedTeachers.length}</strong>
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {selectedTeachers.map((teacher) => (
                  <Chip
                    key={teacher.id}
                    label={teacher.name}
                    size="small"
                    sx={{
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      border: '1px solid #bbdefb'
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setSaveGroupDialogOpen(false)
            setGroupName('')
          }}>
            Hủy
          </Button>
          <Button
            onClick={handleSaveFilterGroup}
            variant="contained"
            disabled={!groupName.trim() || selectedTeachers.length === 0}
            startIcon={<i className="ri-save-line" />}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

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
                  PISA TEACHER - Toàn màn hình
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Quản lý lịch giảng dạy của giáo viên PISA trong tuần
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
