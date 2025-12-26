'use client'

// React Imports
import { useMemo, useState, useEffect, useCallback } from 'react'

// Styled Components
import { styled } from '@mui/material/styles'

// MUI Imports
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Tooltip
} from '@mui/material'

// Hooks
import { useCourseInfo, useCourseInfoWithReload, useCourseList, RegionId, RegionLabel } from '@/@core/hooks/useCourse'
import { SCHEDULE_TIME, useAutoScheduleCourse, useGetAllSchedule } from '@/@core/hooks/useSchedule'
import { useGetWeeks, WeekResponseDto } from '@/@core/hooks/useWeek'
import { useTeacherList, TeacherListResponse, useTeacherScheduleNotes } from '@/@core/hooks/useTeacher'
import useAuth from '@/@core/hooks/useAuth'
import CreateLessonSchedule from './CreateLessonSchedule'
import MissingScheduleTable from './MissingScheduleTable'

const StyledHeaderCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 700,
  backgroundColor: theme.palette.grey[100],
  color: theme.palette.text.primary,
  borderBottom: `2px solid ${theme.palette.divider}`,
  fontSize: '0.9rem',
  position: 'sticky',
  top: 0,
  zIndex: 2
}))

const StyledFirstHeaderCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 700,
  backgroundColor: theme.palette.grey[100],
  color: theme.palette.text.primary,
  borderBottom: `2px solid ${theme.palette.divider}`,
  fontSize: '0.9rem',
  position: 'sticky',
  top: 0,
  left: 0,
  zIndex: 3,
  minWidth: 140
}))

const DayCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  backgroundColor: theme.palette.grey[50],
  borderRight: `1px solid ${theme.palette.divider}`,
  minWidth: 140,
  position: 'sticky',
  left: 0,
  zIndex: 1
}))

const GridCell = styled(TableCell)(({ theme }) => ({
  verticalAlign: 'top',
  padding: theme.spacing(1),
  minWidth: 220,
  borderRight: `1px solid ${theme.palette.divider}`
}))



const ClassBox = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 10,
  overflow: 'hidden',
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.primary.light}`,
  boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
  transition: 'all 0.2s ease',
  marginBottom: theme.spacing(1),
  '&:hover': {
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    transform: 'translateY(-2px)'
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    background: theme.palette.primary.main
  }
}))

const ClassBoxHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1),
  background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
  color: '#fff',
  borderBottom: `1px solid ${theme.palette.primary.main}`,
  fontWeight: 700,
  fontSize: '0.85rem'
}))

const ClassBoxBody = styled('div')(({ theme }) => ({
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.paper
}))

const ClassBoxSubHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.default,
  borderBottom: `1px solid ${theme.palette.divider}`,
  color: theme.palette.text.secondary,
  fontSize: '0.75rem',
}))

const getDayInVietnamese = (englishDay: string) => {
  const dayMap: Record<string, string> = {
    Monday: 'Thứ 2',
    Tuesday: 'Thứ 3',
    Wednesday: 'Thứ 4',
    Thursday: 'Thứ 5',
    Friday: 'Thứ 6',
    Saturday: 'Thứ 7',
    Sunday: 'Chủ nhật'
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

// LocalStorage key for course order
const COURSE_ORDER_STORAGE_KEY = 'schedule-planner-course-order'

const SchedulePlanner = () => {
  const { isTeacher } = useAuth()
  const isReadOnly = isTeacher() // Teacher chỉ xem, không được chỉnh sửa

  const [selectedRegion, setSelectedRegion] = useState<number>(RegionId.HALONG) // Default to HALONG
  const [selectedWeekId, setSelectedWeekId] = useState<string>('')
  const { data: courses, isLoading: isCoursesLoading, error: coursesError } = useCourseList(selectedRegion, selectedWeekId)

  // State for course order (drag and drop)
  const [courseOrder, setCourseOrder] = useState<Record<string, string[]>>({})
  const [draggedCourseId, setDraggedCourseId] = useState<string | null>(null)
  const [dragOverCourseId, setDragOverCourseId] = useState<string | null>(null)

  // Load course order from localStorage on mount
  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem(COURSE_ORDER_STORAGE_KEY)
      if (savedOrder) {
        setCourseOrder(JSON.parse(savedOrder))
      }
    } catch (error) {
      console.error('Error loading course order from localStorage:', error)
    }
  }, [])

  // Save course order to localStorage
  const saveCourseOrder = useCallback((newOrder: Record<string, string[]>) => {
    try {
      localStorage.setItem(COURSE_ORDER_STORAGE_KEY, JSON.stringify(newOrder))
    } catch (error) {
      console.error('Error saving course order to localStorage:', error)
    }
  }, [])

  // Generate storage key based on region and week
  const courseOrderKey = useMemo(() => {
    return `${selectedRegion}-${selectedWeekId}`
  }, [selectedRegion, selectedWeekId])

  // Get sorted active courses based on saved order
  const activeCourses = useMemo(() => {
    const active = (courses || []).filter(c => c.status === 'active')

    const savedOrder = courseOrder[courseOrderKey]
    if (savedOrder && savedOrder.length > 0) {
      return [...active].sort((a, b) => {
        const indexA = savedOrder.indexOf(a.id)
        const indexB = savedOrder.indexOf(b.id)
        if (indexA === -1 && indexB === -1) return 0
        if (indexA === -1) return 1
        if (indexB === -1) return -1
        return indexA - indexB
      })
    }

    return active
  }, [courses, courseOrder, courseOrderKey])

  // Get current order of course IDs for drag and drop
  const currentCourseOrder = useMemo(() => {
    return activeCourses.map(c => c.id)
  }, [activeCourses])

  // Drag handlers for courses
  const handleCourseDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, courseId: string) => {
    setDraggedCourseId(courseId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', courseId)
  }, [])

  const handleCourseDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, courseId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (courseId !== draggedCourseId) {
      setDragOverCourseId(courseId)
    }
  }, [draggedCourseId])

  const handleCourseDragLeave = useCallback(() => {
    setDragOverCourseId(null)
  }, [])

  const handleCourseDrop = useCallback((e: React.DragEvent<HTMLDivElement>, targetCourseId: string) => {
    e.preventDefault()
    if (!draggedCourseId || draggedCourseId === targetCourseId) {
      setDraggedCourseId(null)
      setDragOverCourseId(null)
      return
    }

    const sourceIndex = currentCourseOrder.indexOf(draggedCourseId)
    const targetIndex = currentCourseOrder.indexOf(targetCourseId)

    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedCourseId(null)
      setDragOverCourseId(null)
      return
    }

    // Create new order array
    const newOrderArray = [...currentCourseOrder]
    newOrderArray.splice(sourceIndex, 1)
    newOrderArray.splice(targetIndex, 0, draggedCourseId)

    // Update state and localStorage
    const newCourseOrder = {
      ...courseOrder,
      [courseOrderKey]: newOrderArray
    }
    setCourseOrder(newCourseOrder)
    saveCourseOrder(newCourseOrder)

    setDraggedCourseId(null)
    setDragOverCourseId(null)
  }, [draggedCourseId, courseOrder, courseOrderKey, currentCourseOrder, saveCourseOrder])

  const handleCourseDragEnd = useCallback(() => {
    setDraggedCourseId(null)
    setDragOverCourseId(null)
  }, [])

  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [classSearch, setClassSearch] = useState<string>('')

  // State for teacher search
  const [teacherSearchTerm, setTeacherSearchTerm] = useState<string>('')
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherListResponse | null>(null)

  // State for student search and filter
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())

  // Week selection
  const { data: weeksData, isLoading: isWeeksLoading } = useGetWeeks()


  const { data: courseInfo, isLoading: isCourseInfoLoading, error: courseInfoError } = useCourseInfoWithReload(selectedCourseId, selectedWeekId)

  const { data: courseSchedules } = useGetAllSchedule(false, selectedCourseId, selectedWeekId)
  const autoScheduleCourseMutation = useAutoScheduleCourse()

  // Teacher search - use weekId to fetch teacher's busy schedule for that week
  const { data: teachers, isLoading: isTeachersLoading } = useTeacherList(teacherSearchTerm, selectedWeekId || undefined)

  // Fetch teacher schedule notes when a teacher is selected
  const { data: teacherScheduleNotes } = useTeacherScheduleNotes(
    selectedTeacher?.id || '',
    selectedWeekId || '',
    undefined // Get all notes for the week, not just one scheduleTime
  )

  // Get weeks list
  const weeks = useMemo(() => {
    console.log('weeksData:', weeksData)
    return weeksData || []
  }, [weeksData])

  // Get selected week object
  const selectedWeek = useMemo(() => {
    return weeks.find(week => week.id === selectedWeekId)
  }, [weeks, selectedWeekId])

  // Check if selected week is open
  const isWeekOpen = useMemo(() => {
    return selectedWeek?.scheduleStatus === 'open'
  }, [selectedWeek])

  // Calculate end date for a week (startDate + 6 days)
  const calculateEndDate = (startDate: Date): Date => {
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 6) // Add 6 days to get the end of the week
    return endDate
  }

  // Set default week (most recent or first available)
  useMemo(() => {
    if (weeks.length > 0 && !selectedWeekId) {
      // Sort by startDate descending and take the most recent
      const sortedWeeks = [...weeks].sort((a: WeekResponseDto, b: WeekResponseDto) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      )
      setSelectedWeekId(sortedWeeks[0].id)
    }
  }, [weeks, selectedWeekId])

  // Reset selected course when region or week changes
  useMemo(() => {
    setSelectedCourseId('')
  }, [selectedRegion, selectedWeekId])

  // State for auto schedule messages
  const [autoScheduleMessage, setAutoScheduleMessage] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({
    type: null,
    message: ''
  })

  // State for export
  const [isExporting, setIsExporting] = useState(false)

  // State for missing schedule table
  const [showMissingScheduleTable, setShowMissingScheduleTable] = useState(false)

  // State for create lesson schedule modal
  const [createLessonModal, setCreateLessonModal] = useState<{
    open: boolean
    selectedSlot: {
      day: string
      time: string
      slotIndex: number
      dayLabel?: string
    } | null
    editMode: boolean
    editData: {
      classId: string
      lesson: number
      teacherName: string
      className: string
      scheduleTime: number
    } | null
    teacherId?: string
  }>({
    open: false,
    selectedSlot: null,
    editMode: false,
    editData: null,
    teacherId: undefined
  })

  // Parse SCHEDULE_TIME into day + time
  const parsedSlots = useMemo(() => {
    return SCHEDULE_TIME.map((slotString) => {
      const [time, day] = slotString.split(' ')
      const vietnameseDay = getDayInVietnamese(day)
      const offset = dayOffsetMap[day] ?? 0

      let dayLabel = vietnameseDay

      if (selectedWeek?.startDate) {
        const date = new Date(selectedWeek.startDate)
        date.setDate(date.getDate() + offset)
        const formatted = date.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit'
        })
        dayLabel = `${vietnameseDay} (${formatted})`
      }

      return { time, day, dayLabel }
    })
  }, [selectedWeek?.startDate])

  const days = useMemo(() => {
    const seen = new Set<string>()
    const order: string[] = []

    parsedSlots.forEach(p => { if (!seen.has(p.day)) { seen.add(p.day); order.push(p.day) } })

    return order
  }, [parsedSlots])

  const times = useMemo(() => {
    const seen = new Set<string>()
    const order: string[] = []

    parsedSlots.forEach(p => { if (!seen.has(p.time)) { seen.add(p.time); order.push(p.time) } })

    return order
  }, [parsedSlots])

  const dayLabelMap = useMemo(() => {
    const map: Record<string, string> = {}

    parsedSlots.forEach(slot => {
      if (!map[slot.day]) {
        map[slot.day] = slot.dayLabel
      }
    })

    return map
  }, [parsedSlots])

  const indexFromDayTime = (day: string, time: string) => {
    const idx = parsedSlots.findIndex(p => p.day === day && p.time === time)


    return idx >= 0 ? idx + 1 : -1
  }

  const keyFromSlotIndex = (slotIndex1Based: number) => {
    const slot = parsedSlots[slotIndex1Based - 1]


    return slot ? `${slot.day}|${slot.time}` : ''
  }

  const schedulesByKey = useMemo(() => {
    const map: Record<string, any[]> = {}
    const visibleSchedules = (courseSchedules || []).filter(s => !s.is_makeup)

    visibleSchedules.forEach(s => {
      const key = keyFromSlotIndex(s.schedule_time)

      if (!key) return
      if (!map[key]) map[key] = []
      map[key].push(s)
    })

    return map
  }, [courseSchedules, keyFromSlotIndex])

  const scheduledStudentIdsByIndex = useMemo(() => {
    const map: Record<number, Set<string>> = {}
    const visibleSchedules = (courseSchedules || []).filter(s => !s.is_makeup)

    visibleSchedules.forEach(s => {
      const idx = s.schedule_time

      if (!map[idx]) map[idx] = new Set<string>()
      const students: any[] = Array.isArray(s.students) ? s.students : []

      students.forEach(st => {
        if (st?.id) map[idx].add(st.id)
      })
    })

    return map
  }, [courseSchedules])

  const freeStudentsByIndex = useMemo(() => {
    const map: Record<number, { id: string; fullname: string }[]> = {}

    if (!courseInfo) return map
    const profiles = (courseInfo.profileCourses || []).map(pc => pc.profile)

    for (let i = 1; i <= SCHEDULE_TIME.length; i++) {
      map[i] = profiles
        .filter(p => !(p.busyScheduleArr || []).includes(i))
        .map(p => ({ id: p.id, fullname: p.fullname }))
    }

    return map
  }, [courseInfo])

  const filteredClasses = useMemo(() => {
    const cls = courseInfo?.classes?.filter(c => c.autoSchedule === true) || []

    if (!classSearch.trim()) return cls
    const keyword = classSearch.toLowerCase()

    return cls.filter(c => c.name.toLowerCase().includes(keyword))
  }, [courseInfo, classSearch])

  // Get all scheduled classes across all time slots
  const allScheduledClasses = useMemo(() => {
    const scheduledClassIds = new Set<string>()

    Object.values(schedulesByKey).forEach(schedules => {
      schedules.forEach(schedule => {
        scheduledClassIds.add(schedule.class_id)
      })
    })

    return scheduledClassIds
  }, [schedulesByKey])

  // Calculate classes with complete schedule (all 42 time slots filled)
  // Only count classes with autoSchedule: true
  const classesWithCompleteSchedule = useMemo(() => {
    if (!activeCourses) return []

    return activeCourses.map(course => {
      // Filter only classes with autoSchedule: true
      const autoScheduleClasses = course.classes.filter(cls => cls.autoSchedule !== false)

      const classesWithSchedule = autoScheduleClasses.filter(cls => {
        // Check if class has both startTime and endTime (indicating it's scheduled for all time slots)
        return cls.startTime && cls.endTime
      })

      const totalClasses = autoScheduleClasses.length
      const scheduledClasses = classesWithSchedule.length
      const isComplete = scheduledClasses === totalClasses && totalClasses > 0

      return {
        courseId: course.id,
        courseName: course.name,
        totalClasses,
        scheduledClasses,
        isComplete,
        classes: course.classes.map(cls => ({
          id: cls.id,
          startTime: cls.startTime,
          endTime: cls.endTime,
          isScheduled: !!(cls.startTime && cls.endTime),
          autoSchedule: cls.autoSchedule
        }))
      }
    })
  }, [courses])

  // Calculate teacher's available time slots for highlighting
  const teacherAvailableSlots = useMemo(() => {
    if (!selectedTeacher) return new Set<number>()

    const teacherBusySlots = selectedTeacher.registeredBusySchedule || []
    const availableSlots = new Set<number>()

    // Add all slots that teacher is NOT busy (0-based)
    for (let i = 1; i <= SCHEDULE_TIME.length; i++) {
      if (!teacherBusySlots.includes(i)) {
        availableSlots.add(i)
      }
    }

    return availableSlots
  }, [selectedTeacher])

  // Create a map of teacher notes by scheduleTime for quick lookup
  const teacherNotesByScheduleTime = useMemo(() => {
    const map: Record<number, string> = {}
    if (teacherScheduleNotes) {
      teacherScheduleNotes.forEach(note => {
        if (note.scheduleTime && note.note) {
          map[note.scheduleTime] = note.note
        }
      })
    }
    return map
  }, [teacherScheduleNotes])

  // Get all students from course info for search
  const allStudents = useMemo(() => {
    if (!courseInfo) return []
    return (courseInfo.profileCourses || []).map(pc => ({
      id: pc.profile.id,
      fullname: pc.profile.fullname,
      email: pc.profile.email,
      phone: pc.profile.phone
    }))
  }, [courseInfo])

  // Filter students by search term
  const filteredStudents = useMemo(() => {
    if (!studentSearchTerm.trim()) return []
    const keyword = studentSearchTerm.toLowerCase()
    return allStudents.filter(student =>
      student.fullname.toLowerCase().includes(keyword) ||
      student.email?.toLowerCase().includes(keyword) ||
      student.phone?.toLowerCase().includes(keyword)
    )
  }, [allStudents, studentSearchTerm])

  // Calculate time slots where all selected students are free
  const studentsAvailableSlots = useMemo(() => {
    if (selectedStudentIds.size === 0) return new Set<number>()

    const availableSlots = new Set<number>()

    // Check each time slot
    for (let i = 1; i <= SCHEDULE_TIME.length; i++) {
      const freeStudentsAtSlot = freeStudentsByIndex[i] || []
      const freeStudentIds = new Set(freeStudentsAtSlot.map(s => s.id))

      // Check if all selected students are free at this slot
      const allSelectedAreFree = Array.from(selectedStudentIds).every(studentId => {
        // Check if student is in free list and not scheduled
        if (!freeStudentIds.has(studentId)) return false

        // Also check if student is not scheduled at this time
        if (scheduledStudentIdsByIndex[i]?.has(studentId)) return false

        return true
      })

      if (allSelectedAreFree) {
        availableSlots.add(i)
      }
    }

    return availableSlots
  }, [selectedStudentIds, freeStudentsByIndex, scheduledStudentIdsByIndex])

  // Toggle student selection
  const toggleStudentSelection = useCallback((studentId: string) => {
    setSelectedStudentIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(studentId)) {
        newSet.delete(studentId)
      } else {
        newSet.add(studentId)
      }
      return newSet
    })
  }, [])

  // Get selected students info
  const selectedStudentsInfo = useMemo(() => {
    return allStudents.filter(s => selectedStudentIds.has(s.id))
  }, [allStudents, selectedStudentIds])

  // Helper function to check if teacher is busy at specific time slot
  const isTeacherBusy = (teacherId: string, slotIndex: number) => {
    if (!courseInfo?.classes) return false

    // Find the class with this teacher
    const teacherClass = courseInfo.classes.find(cls => cls.teacherId === teacherId)

    if (!teacherClass?.teacher?.registeredBusySchedule) return false

    // Check if the teacher is busy at this slot (slotIndex is 0-based, registeredBusySchedule is 0-based)
    return teacherClass.teacher.registeredBusySchedule.includes(slotIndex + 1)
  }

  // Helper function to check if teacher is teaching at specific time slot
  const isTeacherTeaching = (teacherId: string, slotIndex: number) => {
    if (!courseSchedules) return false

    return courseSchedules.some(schedule =>
      schedule.teacher_id === teacherId && schedule.schedule_time === slotIndex + 1
    )
  }

  // Handle click on class box to open edit lesson schedule modal
  const handleClassBoxClick = (schedule: any) => {
    // Disable for teachers (read-only mode)
    if (isReadOnly) return

    const slotIndex = schedule.schedule_time
    const slot = parsedSlots[slotIndex - 1]
    if (slot) {
      setCreateLessonModal({
        open: true,
        selectedSlot: {
          day: slot.day,
          time: slot.time,
          slotIndex: slotIndex,
          dayLabel: slot.dayLabel
        },
        editMode: true,
        editData: {
          classId: schedule.class_id,
          lesson: schedule.lesson,
          teacherName: schedule.teacher_name,
          className: schedule.class_name,
          scheduleTime: schedule.schedule_time
        },
        teacherId: schedule.teacher_id // Truyền teacherId từ schedule
      })
    }
  }

  // Handle open create lesson schedule modal
  const handleOpenCreateLessonModal = (day: string, time: string, slotIndex: number, teacherId?: string) => {
    // Disable for teachers (read-only mode)
    if (isReadOnly) return

    const slotInfo = parsedSlots[slotIndex - 1]

    setCreateLessonModal({
      open: true,
      selectedSlot: { day, time, slotIndex, dayLabel: slotInfo?.dayLabel },
      editMode: false,
      editData: null,
      teacherId
    })
  }

  // Handle close create lesson schedule modal
  const handleCloseCreateLessonModal = () => {
    setCreateLessonModal({
      open: false,
      selectedSlot: null,
      editMode: false,
      editData: null,
      teacherId: undefined
    })
  }

  // Handle auto schedule course
  const handleAutoScheduleCourse = async () => {
    if (!selectedCourseId) {
      setAutoScheduleMessage({
        type: 'error',
        message: 'Vui lòng chọn một khóa học trước khi xếp lịch tự động'
      })

      return
    }

    try {
      await autoScheduleCourseMutation.mutateAsync(selectedCourseId)
      setAutoScheduleMessage({
        type: 'success',
        message: 'Xếp lịch tự động thành công! Hệ thống đã tự động sắp xếp lịch học cho khóa học này.'
      })

      // Clear message after 5 seconds
      setTimeout(() => {
        setAutoScheduleMessage({ type: null, message: '' })
      }, 5000)
    } catch (error) {
      console.error('Error auto scheduling course:', error)
      setAutoScheduleMessage({
        type: 'error',
        message: 'Có lỗi xảy ra khi xếp lịch tự động. Vui lòng thử lại.'
      })

      // Clear error message after 5 seconds
      setTimeout(() => {
        setAutoScheduleMessage({ type: null, message: '' })
      }, 5000)
    }
  }

  // Handle export to CSV
  const handleExportToCSV = () => {
    if (!selectedCourseId || !courseInfo) {
      setAutoScheduleMessage({
        type: 'error',
        message: 'Vui lòng chọn một khóa học trước khi export'
      })
      return
    }

    setIsExporting(true)

    try {
      // Prepare CSV data
      const csvData: string[][] = []

      // Add header row
      const headerRow = ['Thứ / Ngày', ...times]
      csvData.push(headerRow)

      // Add data rows for each day
      days.forEach(day => {
        const displayDay = dayLabelMap[day] || getDayInVietnamese(day)
        const row: string[] = [displayDay]

        times.forEach(time => {
          const index = indexFromDayTime(day, time)
          const scheduled = schedulesByKey[`${day}|${time}`] || []
          const free = index > 0 ? (freeStudentsByIndex[index] || []) : []

          // Filter out scheduled students from free list
          let availableFree = free
          if (index > 0 && scheduledStudentIdsByIndex[index]) {
            const scheduledIds = scheduledStudentIdsByIndex[index]
            availableFree = free.filter(s => !scheduledIds.has(s.id))
          }

          // Create cell content
          let cellContent = ''

          // Add scheduled classes
          if (scheduled.length > 0) {
            const scheduledInfo = scheduled.map(s => {
              const students = Array.isArray(s.students) ? s.students : []
              const studentNames = students.map((st: any) => {
                const coursename = st.coursename ? ` - ${st.coursename}` : ''
                return `${st.fullname}${coursename}`
              }).join('\n')

              return `${s.class_name} (Buổi ${s.lesson}) - GV: ${s.teacher_name}${s.note ? ` - Ghi chú: ${s.note}` : ''}${studentNames ? `\nHS:\n${studentNames}` : ''}`
            }).join('\n\n')

            cellContent += `[LỊCH HỌC]\n${scheduledInfo}`
          }

          // Add free students
          if (availableFree.length > 0) {
            const freeNames = availableFree.map(s => s.fullname).join('\n')
            if (cellContent) cellContent += '\n\n'
            cellContent += `[HS RẢNH]\n${freeNames}`
          }

          // If no content, show empty
          if (!cellContent) {
            cellContent = 'Trống'
          }

          row.push(cellContent)
        })

        csvData.push(row)
      })

      // Add summary section
      csvData.push([]) // Empty row
      csvData.push(['TỔNG KẾT'])
      csvData.push(['Khóa học', courseInfo.name])
      csvData.push(['Tổng số lớp', String(courseInfo.classes?.length || 0)])
      csvData.push(['Tổng số học sinh', String(courseInfo.profileCourses?.length || 0)])

      // Count scheduled classes
      const totalScheduledClasses = Object.values(schedulesByKey).reduce((total, schedules) => total + schedules.length, 0)
      csvData.push(['Số lớp đã xếp lịch', String(totalScheduledClasses)])

      // Convert to CSV string
      const csvString = csvData.map(row =>
        row.map(cell => {
          // Escape quotes and wrap in quotes if contains newlines
          const escapedCell = cell.replace(/"/g, '""')
          return escapedCell.includes('\n') ? `"${escapedCell}"` : `"${escapedCell}"`
        }).join(',')
      ).join('\n')

      // Add BOM for UTF-8 support in Excel
      const BOM = '\uFEFF'
      const csvWithBOM = BOM + csvString

      // Create and download file
      const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', `Lich_Hoc_${courseInfo.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)

      setAutoScheduleMessage({
        type: 'success',
        message: 'Export CSV thành công! File đã được tải về.'
      })

      // Clear message after 3 seconds
      setTimeout(() => {
        setAutoScheduleMessage({ type: null, message: '' })
      }, 3000)

    } catch (error) {
      console.error('Error exporting CSV:', error)
      setAutoScheduleMessage({
        type: 'error',
        message: 'Có lỗi xảy ra khi export CSV. Vui lòng thử lại.'
      })

      // Clear error message after 3 seconds
      setTimeout(() => {
        setAutoScheduleMessage({ type: null, message: '' })
      }, 3000)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardHeader
          title="Xếp lịch học theo khóa học"
          subheader="Chọn khóa học để xem lưới thời gian và các học sinh rảnh trong từng khung giờ"
          action={
            selectedCourseId && (
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Khóa học: {activeCourses?.find(c => c.id === selectedCourseId)?.name}
                </Typography>
                <Button
                  variant="outlined"
                  color={showMissingScheduleTable ? "primary" : "inherit"}
                  startIcon={<i className="ri-table-line" />}
                  onClick={() => setShowMissingScheduleTable(!showMissingScheduleTable)}
                  sx={{
                    minWidth: 'auto',
                    px: 2,
                    py: 1,
                    fontSize: '0.875rem'
                  }}
                >
                  {showMissingScheduleTable ? 'Ẩn lịch thiếu' : 'Hiển thị lịch thiếu'}
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={
                    isExporting ?
                      <CircularProgress size={16} color="inherit" /> :
                      <i className="ri-download-line" />
                  }
                  onClick={handleExportToCSV}
                  disabled={isExporting}
                  sx={{
                    minWidth: 'auto',
                    px: 2,
                    py: 1,
                    fontSize: '0.875rem'
                  }}
                >
                  {isExporting ? 'Đang export...' : 'Export CSV'}
                </Button>
                {isWeekOpen && !isReadOnly && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={
                      autoScheduleCourseMutation.isPending ?
                        <CircularProgress size={16} color="inherit" /> :
                        <i className="ri-magic-line" />
                    }
                    onClick={handleAutoScheduleCourse}
                    disabled={autoScheduleCourseMutation.isPending}
                    sx={{
                      minWidth: 'auto',
                      px: 2,
                      py: 1,
                      fontSize: '0.875rem'
                    }}
                  >
                    {autoScheduleCourseMutation.isPending ? 'Đang xếp lịch...' : 'Xếp lịch tự động'}
                  </Button>
                )}
              </Box>
            )
          }
        />
        <CardContent>
          {/* Region and Week Selection */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Khu vực</InputLabel>
              <Select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(Number(e.target.value))}
                label="Khu vực"
              >
                {(Object.values(RegionId).filter((v): v is RegionId => typeof v === 'number')).map((id) => (
                  <MenuItem key={id} value={id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <i className="ri-map-pin-line" />
                      <span>{RegionLabel[id]}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 250 }}>
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
                    const endDate = calculateEndDate(startDate)

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
                              {week.scheduleStatus === 'open' ? 'Mở' :
                                week.scheduleStatus === 'closed' ? 'Đóng' : 'Chờ duyệt'}
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

          {/* Course Selection */}
          <Box sx={{ mb: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="subtitle2">
                Chọn khóa học:
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <i className="ri-drag-move-2-line" style={{ marginRight: 4 }} />
                Kéo thả để sắp xếp
              </Typography>
              {courseOrder[courseOrderKey] && courseOrder[courseOrderKey].length > 0 && (
                <Tooltip title="Đặt lại thứ tự mặc định">
                  <Button
                    size="small"
                    variant="text"
                    color="inherit"
                    onClick={() => {
                      const newCourseOrder = { ...courseOrder }
                      delete newCourseOrder[courseOrderKey]
                      setCourseOrder(newCourseOrder)
                      saveCourseOrder(newCourseOrder)
                    }}
                    sx={{
                      minWidth: 'auto',
                      p: 0.5,
                      fontSize: '0.7rem'
                    }}
                  >
                    <i className="ri-refresh-line" style={{ fontSize: '14px' }} />
                  </Button>
                </Tooltip>
              )}
            </Box>
            <Box display="flex" gap={1} flexWrap="wrap">
              {isCoursesLoading ? (
                <CircularProgress size={20} />
              ) : coursesError ? (
                <Alert severity="error">Lỗi tải danh sách khóa học: {coursesError.message}</Alert>
              ) : (activeCourses || []).map(course => {
                // Check if this course has all classes scheduled
                const courseScheduleInfo = classesWithCompleteSchedule.find(c => c.courseId === course.id)
                const isFullyScheduled = courseScheduleInfo?.isComplete || false
                const isDragging = draggedCourseId === course.id
                const isDragOver = dragOverCourseId === course.id

                return (
                  <Box
                    key={course.id}
                    draggable
                    onDragStart={(e) => handleCourseDragStart(e, course.id)}
                    onDragOver={(e) => handleCourseDragOver(e, course.id)}
                    onDragLeave={handleCourseDragLeave}
                    onDrop={(e) => handleCourseDrop(e, course.id)}
                    onDragEnd={handleCourseDragEnd}
                    sx={{
                      cursor: 'grab',
                      opacity: isDragging ? 0.5 : 1,
                      transform: isDragOver ? 'scale(1.05)' : 'none',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      '&::before': isDragOver ? {
                        content: '""',
                        position: 'absolute',
                        left: -4,
                        top: 0,
                        bottom: 0,
                        width: 3,
                        backgroundColor: 'primary.main',
                        borderRadius: 1
                      } : {},
                      '&:active': {
                        cursor: 'grabbing'
                      }
                    }}
                  >
                    <Chip
                      label={
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <i className="ri-draggable" style={{ fontSize: '12px', opacity: 0.6 }} />
                          {course.name}
                        </Box>
                      }
                      onClick={() => setSelectedCourseId(course.id)}
                      sx={{
                        backgroundColor: selectedCourseId === course.id
                          ? 'primary.main'
                          : isFullyScheduled
                            ? '#e8f5e8'
                            : '#fff3e0',
                        color: selectedCourseId === course.id
                          ? 'white'
                          : isFullyScheduled
                            ? '#2e7d32'
                            : '#f57c00',
                        border: selectedCourseId === course.id
                          ? 'none'
                          : `1px solid ${isFullyScheduled ? '#4caf50' : '#ff9800'}`,
                        fontWeight: 600,
                        '&:hover': {
                          backgroundColor: selectedCourseId === course.id
                            ? 'primary.dark'
                            : isFullyScheduled
                              ? '#c8e6c9'
                              : '#ffe0b2',
                        },
                        ...(isDragOver && {
                          borderColor: 'primary.main',
                          borderWidth: 2
                        })
                      }}
                      icon={
                        selectedCourseId === course.id ? undefined : (
                          <i
                            className={isFullyScheduled ? "ri-check-line" : "ri-time-line"}
                            style={{ fontSize: '12px' }}
                          />
                        )
                      }
                    />
                  </Box>
                )
              })}
            </Box>
          </Box>

          {/* Auto schedule info */}
          {selectedCourseId && isWeekOpen && !isReadOnly && (
            <Box sx={{ mt: 2, p: 1.5, backgroundColor: '#e8f5e8', borderRadius: 1, border: '1px solid #c8e6c9' }}>
              <Typography variant="caption" color="success.main" display="block" mb={0.5}>
                <i className="ri-information-line" style={{ marginRight: 4 }} />
                <strong>Xếp lịch tự động:</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Nhấn nút &quot;Xếp lịch tự động&quot; ở góc trên bên phải để hệ thống tự động sắp xếp lịch học cho khóa học này dựa trên thời gian rảnh của học sinh và giáo viên.
              </Typography>
            </Box>
          )}

          {/* Read-only mode info for teachers */}
          {isReadOnly && (
            <Box sx={{ mt: 2, p: 1.5, backgroundColor: '#e3f2fd', borderRadius: 1, border: '1px solid #90caf9' }}>
              <Typography variant="caption" color="info.main" display="block" mb={0.5}>
                <i className="ri-eye-line" style={{ marginRight: 4 }} />
                <strong>Chế độ xem:</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Bạn đang ở chế độ xem. Các chức năng tạo, sửa, xóa lịch học đã bị vô hiệu hóa.
              </Typography>
            </Box>
          )}

          {/* Week closed info */}
          {selectedCourseId && !isWeekOpen && (
            <Box sx={{ mt: 2, p: 1.5, backgroundColor: '#fff3e0', borderRadius: 1, border: '1px solid #ff9800' }}>
              <Typography variant="caption" color="warning.main" display="block" mb={0.5}>
                <i className="ri-information-line" style={{ marginRight: 4 }} />
                <strong>Tuần học đã đóng:</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Chức năng xếp lịch tự động chỉ khả dụng khi tuần học đang ở trạng thái &quot;Mở&quot;. Vui lòng chọn tuần học khác hoặc liên hệ quản trị viên.
              </Typography>
            </Box>
          )}

          {/* Auto schedule messages */}
          {autoScheduleMessage.type && (
            <Box sx={{ mt: 2 }}>
              <Alert
                severity={autoScheduleMessage.type}
                onClose={() => setAutoScheduleMessage({ type: null, message: '' })}
              >
                {autoScheduleMessage.message}
              </Alert>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Missing Schedule Table */}
      {selectedCourseId && showMissingScheduleTable && (
        <Box sx={{ mb: 4 }}>
          <MissingScheduleTable courseId={selectedCourseId} weekId={selectedWeekId} />
        </Box>
      )}

      {selectedCourseId ? (
        <Card>
          <CardHeader title="Lưới học sinh rảnh theo khung giờ" />
          <CardContent>
            {/* Student and Teacher Search */}
            {selectedCourseId && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {/* Student Search */}
                  <Box sx={{ flex: 1, minWidth: 300 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Tìm kiếm học sinh để xem lịch rảnh chung:
                    </Typography>
                    <Box>
                      {/* Student Search Input */}
                      <TextField
                        fullWidth
                        placeholder="Tìm kiếm học sinh (tên, email, SĐT)..."
                        value={studentSearchTerm}
                        onChange={(e) => setStudentSearchTerm(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <i className="ri-search-line" style={{ color: '#666', marginRight: 8 }} />
                          ),
                          endAdornment: studentSearchTerm && (
                            <i
                              className="ri-close-line"
                              style={{
                                color: '#666',
                                cursor: 'pointer',
                                fontSize: '18px'
                              }}
                              onClick={() => setStudentSearchTerm('')}
                            />
                          )
                        }}
                        sx={{ mb: 1 }}
                      />

                      {/* Student Search Results */}
                      {studentSearchTerm && (
                        <Box sx={{
                          maxHeight: '200px',
                          overflowY: 'auto',
                          border: '1px solid #eee',
                          borderRadius: 1,
                          p: 1,
                          backgroundColor: '#f8f9fa',
                          mb: 1
                        }}>
                          {filteredStudents.length > 0 ? (
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                Kết quả tìm kiếm ({filteredStudents.length} học sinh):
                              </Typography>
                              {filteredStudents.map((student) => {
                                const isSelected = selectedStudentIds.has(student.id)

                                return (
                                  <Box
                                    key={student.id}
                                    sx={{
                                      p: 1,
                                      borderBottom: '1px solid #eee',
                                      '&:last-child': { borderBottom: 'none' },
                                      cursor: 'pointer',
                                      '&:hover': { backgroundColor: '#e3f2fd' },
                                      borderRadius: 1,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      backgroundColor: isSelected ? '#e3f2fd' : 'transparent'
                                    }}
                                    onClick={() => toggleStudentSelection(student.id)}
                                  >
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant="body2" fontWeight={500}>
                                        {student.fullname}
                                      </Typography>
                                      {student.email && (
                                        <Typography variant="caption" color="text.secondary" display="block">
                                          <i className="ri-mail-line" style={{ marginRight: 4, fontSize: '12px' }} />
                                          {student.email}
                                        </Typography>
                                      )}
                                    </Box>
                                    {isSelected && (
                                      <Chip
                                        size="small"
                                        label="Đã chọn"
                                        color="primary"
                                        variant="filled"
                                        sx={{ fontSize: '0.7rem' }}
                                      />
                                    )}
                                  </Box>
                                )
                              })}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary" textAlign="center" p={2}>
                              Không tìm thấy học sinh nào
                            </Typography>
                          )}
                        </Box>
                      )}

                      {/* Selected Students Display */}
                      {selectedStudentIds.size > 0 && !studentSearchTerm && (
                        <Box sx={{
                          p: 1.5,
                          backgroundColor: '#fff3e0',
                          borderRadius: 1,
                          border: '1px solid #ffb74d',
                          mb: 1
                        }}>
                          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                            <Typography variant="body2" fontWeight={600}>
                              Đã chọn {selectedStudentIds.size} học sinh:
                            </Typography>
                            <Button
                              size="small"
                              variant="text"
                              color="inherit"
                              onClick={() => setSelectedStudentIds(new Set())}
                              sx={{ fontSize: '0.7rem', py: 0.25, px: 1 }}
                            >
                              Xóa tất cả
                            </Button>
                          </Box>
                          <Box display="flex" gap={0.5} flexWrap="wrap">
                            {selectedStudentsInfo.map(student => (
                              <Chip
                                key={student.id}
                                size="small"
                                label={student.fullname}
                                onDelete={() => toggleStudentSelection(student.id)}
                                sx={{ fontSize: '0.75rem' }}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* Teacher Search */}
                  <Box sx={{ flex: 1, minWidth: 300 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Tìm kiếm giáo viên để xem lịch khớp trên lưới:
                    </Typography>
                    <Box>
                      <TextField
                        fullWidth
                        placeholder="Tìm kiếm giáo viên..."
                        value={teacherSearchTerm}
                        onChange={(e) => setTeacherSearchTerm(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <i className="ri-search-line" style={{ color: '#666', marginRight: 8 }} />
                          ),
                          endAdornment: teacherSearchTerm && (
                            <i
                              className="ri-close-line"
                              style={{
                                color: '#666',
                                cursor: 'pointer',
                                fontSize: '18px'
                              }}
                              onClick={() => setTeacherSearchTerm('')}
                            />
                          )
                        }}
                        sx={{ mb: 1 }}
                      />

                      {/* Teacher Search Results */}
                      {teacherSearchTerm && (
                        <Box sx={{
                          maxHeight: '200px',
                          overflowY: 'auto',
                          border: '1px solid #eee',
                          borderRadius: 1,
                          p: 1,
                          backgroundColor: '#f8f9fa',
                          mb: 1
                        }}>
                          {isTeachersLoading ? (
                            <Box display="flex" justifyContent="center" p={2}>
                              <CircularProgress size={20} />
                            </Box>
                          ) : teachers && teachers.length > 0 ? (
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                Kết quả tìm kiếm ({teachers.length} giáo viên):
                              </Typography>
                              {teachers.map((teacher) => {
                                const isTeacherBusy = teacher.registeredBusySchedule?.includes(0) // Check if teacher is busy at any slot
                                const isSelected = selectedTeacher?.id === teacher.id

                                return (
                                  <Box
                                    key={teacher.id}
                                    sx={{
                                      p: 1,
                                      borderBottom: '1px solid #eee',
                                      '&:last-child': { borderBottom: 'none' },
                                      cursor: 'pointer',
                                      '&:hover': { backgroundColor: '#e3f2fd' },
                                      borderRadius: 1,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      backgroundColor: isSelected ? '#e3f2fd' : 'transparent'
                                    }}
                                    onClick={() => {
                                      // Toggle: nếu đã chọn thì bỏ chọn, nếu chưa chọn thì chọn
                                      if (isSelected) {
                                        setSelectedTeacher(null)
                                      } else {
                                        setSelectedTeacher(teacher)
                                      }
                                    }}
                                  >
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant="body2" fontWeight={500}>
                                        {teacher.name}
                                      </Typography>
                                      {teacher.skills && teacher.skills.length > 0 && (
                                        <Typography variant="caption" color="text.secondary" display="block">
                                          <i className="ri-award-line" style={{ marginRight: 4, fontSize: '12px' }} />
                                          {teacher.skills.join(', ')}
                                        </Typography>
                                      )}
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Chip
                                        size="small"
                                        label="Rảnh"
                                        color="success"
                                        variant="outlined"
                                        sx={{ fontSize: '0.7rem' }}
                                      />
                                      {isSelected && (
                                        <Chip
                                          size="small"
                                          label="Đã chọn"
                                          color="primary"
                                          variant="filled"
                                          sx={{ fontSize: '0.7rem' }}
                                        />
                                      )}
                                    </Box>
                                  </Box>
                                )
                              })}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary" textAlign="center" p={2}>
                              Không tìm thấy giáo viên nào
                            </Typography>
                          )}
                        </Box>
                      )}

                      {/* Selected Teacher Display */}
                      {selectedTeacher && !teacherSearchTerm && (
                        <Box
                          sx={{
                            p: 1.5,
                            backgroundColor: '#e8f5e8',
                            borderRadius: 1,
                            border: '1px solid #c8e6c9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: '#c8e6c9'
                            }
                          }}
                          onClick={() => setSelectedTeacher(null)}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {selectedTeacher.name}
                            </Typography>
                            {selectedTeacher.skills && selectedTeacher.skills.length > 0 && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                <i className="ri-award-line" style={{ marginRight: 4, fontSize: '12px' }} />
                                {selectedTeacher.skills.join(', ')}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              size="small"
                              label="Rảnh"
                              color="success"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              (Click để bỏ chọn)
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
            <Box display="flex" gap={1} alignItems="center" mb={2} flexWrap="wrap">
              <Box display="flex" gap={0.5} flexWrap="wrap">
                {filteredClasses.map(cls => {
                  // Check if class has schedule
                  const hasSchedule = allScheduledClasses.has(cls.id)

                  // Get teacher info for this class
                  const teacherName = cls.teacher?.name || 'Chưa có GV'

                  return (
                    <Chip
                      key={cls.id}
                      size="small"
                      label={
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <span>{cls.name}</span>
                          <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.8 }}>
                            (GV: {teacherName})
                          </Typography>
                        </Box>
                      }
                      color={hasSchedule ? 'success' : 'default'}
                      variant={hasSchedule ? 'filled' : 'outlined'}
                      sx={{
                        ...(hasSchedule && {
                          backgroundColor: '#e8f5e8',
                          color: '#2e7d32',
                          borderColor: '#4caf50',
                          fontWeight: 600
                        })
                      }}
                    />
                  )
                })}
                {filteredClasses.length === 0 && (
                  <Typography variant="caption" color="text.secondary">Không có lớp phù hợp</Typography>
                )}
              </Box>
            </Box>

            {isCourseInfoLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
              </Box>
            ) : courseInfoError ? (
              <Alert severity="error">Lỗi tải thông tin khóa học: {courseInfoError.message}</Alert>
            ) : (
              <TableContainer
                component={Paper}
                sx={{
                  borderRadius: 2,
                  maxHeight: '80vh',
                  overflow: 'auto'
                }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <StyledFirstHeaderCell>Thứ / Giờ</StyledFirstHeaderCell>
                      {times.map(t => (
                        <StyledHeaderCell key={t} align="center">{t}</StyledHeaderCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {days.map(day => (
                      <TableRow key={day} hover={false}>
                        <DayCell>{dayLabelMap[day] || getDayInVietnamese(day)}</DayCell>
                        {times.map(time => {
                          const index = indexFromDayTime(day, time)
                          let free = index > 0 ? (freeStudentsByIndex[index] || []) : []
                          const scheduled = schedulesByKey[`${day}|${time}`] || []

                          if (index > 0 && scheduledStudentIdsByIndex[index]) {
                            const set = scheduledStudentIdsByIndex[index]

                            free = free.filter(s => !set.has(s.id))
                          }

                          // Check if this time slot is available for the searched teacher
                          const isTeacherAvailable = selectedTeacher && index > 0 &&
                            teacherAvailableSlots.has(index)

                          // Get teacher note for this time slot if available
                          const teacherNoteForSlot = selectedTeacher && index > 0 ? teacherNotesByScheduleTime[index] : undefined

                          // Check if all selected students are available at this time slot
                          const areAllStudentsAvailable = selectedStudentIds.size > 0 && index > 0 &&
                            studentsAvailableSlots.has(index)

                          // Filter free students if students are selected
                          let displayFree = free
                          if (selectedStudentIds.size > 0) {
                            // Only show selected students in the free list
                            displayFree = free.filter(s => selectedStudentIds.has(s.id))
                          }

                          return (
                            <GridCell
                              key={`${day}|${time}`}
                              sx={{
                                ...(isTeacherAvailable && {
                                  backgroundColor: '#e8f5e8',
                                  border: '2px solid #4caf50',
                                  position: 'relative',
                                  '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: 4,
                                    background: '#4caf50',
                                    zIndex: 2
                                  }
                                }),
                                ...(areAllStudentsAvailable && !isTeacherAvailable && {
                                  backgroundColor: '#fff3e0',
                                  border: '2px solid #ff9800',
                                  position: 'relative',
                                  '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: 4,
                                    background: '#ff9800',
                                    zIndex: 2
                                  }
                                }),
                                ...(areAllStudentsAvailable && isTeacherAvailable && {
                                  backgroundColor: '#e8f5e8',
                                  border: '2px solid #4caf50',
                                  position: 'relative',
                                  '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: 4,
                                    background: 'linear-gradient(to right, #4caf50 50%, #ff9800 50%)',
                                    zIndex: 2
                                  }
                                })
                              }}
                            >
                              {/* Show students available indicator */}
                              {areAllStudentsAvailable && (
                                <Box sx={{
                                  textAlign: 'center',
                                  mb: 1,
                                  p: 0.5,
                                  backgroundColor: isTeacherAvailable
                                    ? 'rgba(76, 175, 80, 0.1)'
                                    : 'rgba(255, 152, 0, 0.1)',
                                  borderRadius: 1,
                                  border: `1px solid ${isTeacherAvailable ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 152, 0, 0.3)'}`
                                }}>
                                  <Typography
                                    variant="caption"
                                    color={isTeacherAvailable ? "success.main" : "warning.main"}
                                    fontWeight={600}
                                  >
                                    <i className="ri-check-line" style={{ marginRight: 4 }} />
                                    {selectedStudentIds.size} học sinh rảnh
                                  </Typography>
                                </Box>
                              )}
                              {isTeacherAvailable && (
                                <Box sx={{
                                  textAlign: 'center',
                                  mb: 1,
                                  p: 0.5,
                                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                  borderRadius: 1,
                                  border: '1px solid rgba(76, 175, 80, 0.3)'
                                }}>
                                  <Typography variant="caption" color="success.main" fontWeight={600}>
                                    <i className="ri-check-line" style={{ marginRight: 4 }} />
                                    {selectedTeacher?.name} rảnh
                                  </Typography>
                                  {teacherNoteForSlot && (
                                    <Box sx={{ mt: 0.5, pt: 0.5, borderTop: '1px solid rgba(76, 175, 80, 0.2)' }}>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{
                                          fontSize: '0.7rem',
                                          fontStyle: 'italic',
                                          display: 'block',
                                          textAlign: 'left',
                                          wordBreak: 'break-word'
                                        }}
                                      >
                                        <i className="ri-file-text-line" style={{ marginRight: 4, fontSize: '0.75rem' }} />
                                        {teacherNoteForSlot}
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              )}

                              {/* Show teacher note even if teacher is not available (busy) */}
                              {selectedTeacher && !isTeacherAvailable && teacherNoteForSlot && (
                                <Box sx={{
                                  textAlign: 'center',
                                  mb: 1,
                                  p: 0.5,
                                  backgroundColor: 'rgba(255, 152, 0, 0.1)',
                                  borderRadius: 1,
                                  border: '1px solid rgba(255, 152, 0, 0.3)'
                                }}>
                                  <Typography variant="caption" color="warning.main" fontWeight={600}>
                                    <i className="ri-file-text-line" style={{ marginRight: 4 }} />
                                    Ghi chú {selectedTeacher?.name}
                                  </Typography>
                                  <Box sx={{ mt: 0.5 }}>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{
                                        fontSize: '0.7rem',
                                        fontStyle: 'italic',
                                        display: 'block',
                                        textAlign: 'left',
                                        wordBreak: 'break-word'
                                      }}
                                    >
                                      {teacherNoteForSlot}
                                    </Typography>
                                  </Box>
                                </Box>
                              )}

                              <Box display="flex" flexDirection="column" gap={0.75}>
                                {/* Scheduled classes as boxes */}
                                {scheduled.map((s, i) => (
                                  <ClassBox
                                    key={`${s.class_id}-${s.lesson}-${i}`}
                                    onClick={() => handleClassBoxClick(s)}
                                    sx={{
                                      cursor: isReadOnly ? 'default' : 'pointer',
                                      opacity: isReadOnly ? 1 : 1,
                                      '&:hover': isReadOnly ? {} : {
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                        transform: 'translateY(-2px)'
                                      }
                                    }}
                                  >
                                    <ClassBoxHeader>
                                      <Box display="flex" gap={1} alignItems="center">
                                        <Typography variant="body2" fontWeight={700}>{s.class_name}
                                          {s.note && (
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                              sx={{
                                                fontStyle: 'italic',
                                                fontSize: '0.7rem',
                                                lineHeight: 1.2,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical'
                                              }}
                                            >
                                              {s.note}
                                            </Typography>
                                          )}
                                        </Typography>
                                        <Chip
                                          size="small"
                                          variant="outlined"
                                          label={`Buổi ${s.lesson}`}
                                          sx={{
                                            borderColor: 'rgba(255,255,255,0.8)',
                                            color: '#fff',
                                            height: 22
                                          }}
                                        />
                                      </Box>
                                    </ClassBoxHeader>
                                    <ClassBoxSubHeader>
                                      <Box display="flex" flexDirection="column" gap={0.5} width="100%">
                                        <Typography variant="caption">GV: {s.teacher_name}</Typography>
                                        {(s.start_time || s.end_time) && (
                                          <Typography variant="caption" sx={{
                                            color: 'primary.main',
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5
                                          }}>
                                            <i className="ri-time-line" style={{ fontSize: '0.75rem' }} />
                                            {s.start_time && s.end_time
                                              ? `${s.start_time} - ${s.end_time}`
                                              : s.start_time || s.end_time
                                            }
                                          </Typography>
                                        )}
                                      </Box>
                                    </ClassBoxSubHeader>
                                    <ClassBoxBody>
                                      {Array.isArray(s.students) && s.students.length > 0 ? (() => {
                                        const visibleStudents = s.students.slice(0, 10)
                                        const hasMoreStudents = s.students.length > 10
                                        const additionalStudents = hasMoreStudents ? s.students.slice(10) : []

                                        return (
                                          <Box display="flex" gap={0.5} flexWrap="wrap">
                                            {visibleStudents.map((st: any) => {
                                              const coursename = st.coursename ? ` - ${st.coursename}` : ''
                                              const displayLabel = st.note
                                                ? `${st.fullname}${coursename} (${st.note})`
                                                : `${st.fullname}${coursename}`

                                              return (
                                                <Chip
                                                  key={st.id}
                                                  size="small"
                                                  label={displayLabel}
                                                  sx={{
                                                    maxWidth: '100%',
                                                    '& .MuiChip-label': {
                                                      overflow: 'hidden',
                                                      textOverflow: 'ellipsis',
                                                      whiteSpace: 'nowrap'
                                                    }
                                                  }}
                                                />
                                              )
                                            })}

                                            {hasMoreStudents && (
                                              <Tooltip
                                                title={additionalStudents.map((st: any) => st.fullname).join(', ')}
                                              >
                                                <Chip
                                                  size="small"
                                                  label="..."
                                                  sx={{
                                                    maxWidth: '100%',
                                                    '& .MuiChip-label': {
                                                      overflow: 'hidden',
                                                      textOverflow: 'ellipsis',
                                                      whiteSpace: 'nowrap'
                                                    }
                                                  }}
                                                />
                                              </Tooltip>
                                            )}
                                          </Box>
                                        )
                                      })() : (
                                        <Typography variant="caption" color="text.secondary">Chưa có danh sách học sinh</Typography>
                                      )}
                                    </ClassBoxBody>
                                  </ClassBox>
                                ))}

                                {/* Free students list */}
                                <Box>
                                  {displayFree.length > 0 ? (() => {
                                    const visibleFreeStudents = displayFree.slice(0, 10)
                                    const hasMoreFreeStudents = displayFree.length > 10
                                    const additionalFreeStudents = hasMoreFreeStudents ? displayFree.slice(10) : []

                                    return (
                                      <Box display="flex" gap={0.5} flexWrap="wrap">
                                        {visibleFreeStudents.map(s => {
                                          const isSelected = selectedStudentIds.has(s.id)
                                          return (
                                            <Chip
                                              key={s.id}
                                              size="small"
                                              label={s.fullname}
                                              sx={{
                                                ...(isSelected && selectedStudentIds.size > 0 && {
                                                  backgroundColor: '#fff3e0',
                                                  borderColor: '#ff9800',
                                                  borderWidth: 2,
                                                  fontWeight: 600
                                                })
                                              }}
                                            />
                                          )
                                        })}
                                        {hasMoreFreeStudents && (
                                          <Tooltip
                                            title={additionalFreeStudents.map(s => s.fullname).join(', ')}
                                          >
                                            <Chip size="small" label="..." />
                                          </Tooltip>
                                        )}
                                      </Box>
                                    )
                                  })() : (
                                    scheduled.length === 0 ? (
                                      <Typography variant="caption" color="text.secondary">
                                        {selectedStudentIds.size > 0 ? 'Không có học sinh đã chọn nào rảnh' : 'Không có HS rảnh'}
                                      </Typography>
                                    ) : null
                                  )}
                                </Box>

                                {/* Create Lesson Button */}
                                {displayFree.length > 0 && !isReadOnly && (
                                  <Box sx={{ mt: 1, textAlign: 'center' }}>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="primary"
                                      startIcon={<i className="ri-add-line" />}
                                      onClick={() => handleOpenCreateLessonModal(day, time, index, selectedTeacher?.id)}
                                      sx={{
                                        fontSize: '0.75rem',
                                        py: 0.5,
                                        px: 1,
                                        minWidth: 'auto',
                                        borderStyle: 'dashed'
                                      }}
                                    >
                                      Tạo lịch
                                    </Button>
                                  </Box>
                                )}
                              </Box>
                            </GridCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      ) : (
        <Alert severity="info">Hãy chọn một khóa học để xem lưới học sinh rảnh.</Alert>
      )}

      {/* Schedule Detail Popup */}
      {/* <ScheduleDetailPopup
        open={scheduleDetailPopup.open}
        onClose={handleCloseScheduleDetailPopup}
        classId={scheduleDetailPopup.classId}
        lesson={scheduleDetailPopup.lesson}
        teacherName={scheduleDetailPopup.teacherName}
        className={scheduleDetailPopup.className}
        scheduleTime={scheduleDetailPopup.scheduleTime}
      /> */}

      {/* Create Lesson Schedule Modal */}
      <CreateLessonSchedule
        open={createLessonModal.open}
        onClose={handleCloseCreateLessonModal}
        selectedSlot={createLessonModal.selectedSlot}
        availableStudents={(() => {
          if (!createLessonModal.selectedSlot) return []
          const index = createLessonModal.selectedSlot.slotIndex


          return index > 0 ? (freeStudentsByIndex[index] || []) : []
        })()}
        courseClasses={courseInfo?.classes || []}
        courseId={selectedCourseId}
        weekId={selectedWeekId}
        editMode={createLessonModal.editMode}
        editData={createLessonModal.editData}
        teacherId={createLessonModal.teacherId}
        onClassCreated={(newClassId) => {
          // The useCreateClass hook will automatically invalidate the courseInfo query
          // so the parent component will refresh the class list automatically
          // Optionally, we can select the newly created class
          // setSelectedClassId(newClassId)
        }}
      />
    </Box>
  )
}

export default SchedulePlanner


