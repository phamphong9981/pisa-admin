'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// MUI Imports
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  TextField,
  Typography
} from '@mui/material'

// Hooks
import { useCreateLessonSchedule, useGetScheduleDetail, useUpdateUserSchedule, useUpdateLessonSchedule } from '@/@core/hooks/useSchedule'
import { useStudentList } from '@/@core/hooks/useStudent'
import { useTeacherList } from '@/@core/hooks/useTeacher'
import { useCreateClass } from '@/@core/hooks/useClass'

// Components
import CreateClassForm from '@/views/classes/CreateClassForm'

interface CreateLessonScheduleProps {
  open: boolean
  onClose: () => void
  selectedSlot: {
    day: string
    time: string
    slotIndex: number
  } | null
  availableStudents: Array<{
    id: string
    fullname: string
  }>
  courseClasses: Array<{
    id: string
    name: string
    teacherId: string
    teacher: {
      id: string
      name: string
      skills: string[]
    }
  }>
  courseId?: string // Thêm courseId để có thể tạo lớp mới
  weekId?: string
  editMode?: boolean
  editData?: {
    classId: string
    lesson: number
    teacherName: string
    className: string
    scheduleTime: number
  } | null
  teacherId?: string // Thêm teacherId để hiển thị giáo viên mặc định
  onClassCreated?: (newClassId: string) => void // Callback khi tạo lớp thành công
}

const CreateLessonSchedule = ({
  open,
  onClose,
  selectedSlot,
  availableStudents,
  courseClasses,
  courseId,
  weekId = "08a60c9a-b3f8-42f8-8ff8-c7015d4ef3e7",
  editMode = false,
  editData = null,
  teacherId: propTeacherId,
  onClassCreated
}: CreateLessonScheduleProps) => {
  console.log('selectedSlot', selectedSlot)

  const createLessonScheduleMutation = useCreateLessonSchedule()
  const updateUserScheduleMutation = useUpdateUserSchedule()
  const updateLessonScheduleMutation = useUpdateLessonSchedule()

  // Get schedule detail for edit mode
  const { data: scheduleDetail, isLoading: isLoadingScheduleDetail } = useGetScheduleDetail(
    editData?.classId || '',
    editData?.lesson || 0,
    weekId,
    (selectedSlot?.slotIndex || 0) + 1
  )

  // Define student type
  type SelectedStudent = {
    id: string
    fullname: string
    email?: string
    course?: { id: string; name: string }
    courseName?: string
    ieltsPoint?: string
    isBusy: boolean
    source: 'available' | 'search'
    profile_id: string
    startTime?: string
    endTime?: string
    scheduleId?: string
  }

  // Form states
  const [selectedStudents, setSelectedStudents] = useState<SelectedStudent[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [lessonNumber, setLessonNumber] = useState(1)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [note, setNote] = useState('')

  const selectedClass = useMemo(
    () => courseClasses.find(cls => cls.id === selectedClassId) || null,
    [courseClasses, selectedClassId]
  )

  // Original values for comparison (edit mode)
  const [originalValues, setOriginalValues] = useState<{
    students: SelectedStudent[]
    classId: string
    teacherId: string
    lesson: number
    startTime: string
    endTime: string
    note: string
  } | null>(null)

  // Individual student notes for edit mode
  const [studentNotes, setStudentNotes] = useState<Record<string, string>>({})

  // Edit states for individual student fields
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null)
  const [editingStudentStartTime, setEditingStudentStartTime] = useState<string>('')
  const [editingStudentEndTime, setEditingStudentEndTime] = useState<string>('')
  const [editingStudentNote, setEditingStudentNote] = useState<string>('')

  // Search states
  const [studentSearch, setStudentSearch] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [teacherSearch, setTeacherSearch] = useState('')
  const [showTeacherSearchResults, setShowTeacherSearchResults] = useState(false)

  // Student search hook
  const { data: searchResults, isLoading: isSearchLoading } = useStudentList(studentSearch)

  // Teacher list hook
  const { data: teacherList } = useTeacherList()

  // Messages
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Create class dialog state
  const [showCreateClassDialog, setShowCreateClassDialog] = useState(false)

  // Action state for edit mode (removed, will use direct action)

  // Reset form when modal opens/closes or slot changes
  useEffect(() => {
    if (open && selectedSlot) {
      if (editMode && editData) {
        // Edit mode - populate with existing data
        setSelectedClassId(editData.classId)
        setLessonNumber(editData.lesson)

        if (propTeacherId) {
          setSelectedTeacherId(propTeacherId)
        }
      } else {
        // Create mode - reset form
        setSelectedStudents([])
        setSelectedClassId('')
        setSelectedTeacherId('')
        setLessonNumber(1)
        setNote('')
        setStudentNotes({})
        setEditingStudentId(null)
        setEditingStudentStartTime('')
        setEditingStudentEndTime('')
        setEditingStudentNote('')
        setOriginalValues(null)
        setNote('')
      }

      // Parse time from slot and format to HH:MM
      const timeParts = selectedSlot.time.split('-')

      if (timeParts.length === 2) {
        setStartTime(formatTimeToHHMM(timeParts[0]))
        setEndTime(formatTimeToHHMM(timeParts[1]))
      }
    }
  }, [open, selectedSlot, editMode, editData, courseClasses, propTeacherId])

  // Populate form with schedule detail data when in edit mode
  useEffect(() => {
    if (editMode && scheduleDetail && !isLoadingScheduleDetail) {
      // Get the actual start/end time from schedule detail first
      const actualStartTime = scheduleDetail.students.attending.length > 0 && scheduleDetail.students.attending[0].startTime
        ? formatTimeToHHMM(scheduleDetail.students.attending[0].startTime)
        : ''

      const actualEndTime = scheduleDetail.students.attending.length > 0 && scheduleDetail.students.attending[0].endTime
        ? formatTimeToHHMM(scheduleDetail.students.attending[0].endTime)
        : ''

      // Get the actual note
      const actualNote = scheduleDetail.scheduleInfo?.note ||
        (scheduleDetail.students.attending.length > 0 ? scheduleDetail.students.attending[0].note || '' : '')

      // Get the actual teacher ID
      const actualTeacherId = scheduleDetail.students.attending.length > 0
        ? (scheduleDetail.students.attending[0].teacherId || selectedTeacherId)
        : selectedTeacherId

      // Populate students from schedule detail
      const attendingStudents = scheduleDetail.students.attending.map(student => ({
        id: student.profileId,
        fullname: student.fullname,
        email: student.email,
        course: undefined,
        courseName: student.courseName,
        ieltsPoint: undefined,
        isBusy: false,
        source: 'available' as const,
        profile_id: student.profileId,
        startTime: student.startTime,
        endTime: student.endTime,
        scheduleId: student.scheduleId
      }))

      // Set all states at once
      setSelectedStudents(attendingStudents)
      setStartTime(actualStartTime)
      setEndTime(actualEndTime)
      setNote(actualNote)

      // Store original values for comparison with the actual values
      const originalValuesToSet = {
        students: [...attendingStudents],
        classId: selectedClassId,
        teacherId: actualTeacherId || '',
        lesson: lessonNumber,
        startTime: actualStartTime,
        endTime: actualEndTime,
        note: actualNote
      }

      setOriginalValues(originalValuesToSet)

      // Initialize individual student notes
      const notesMap: Record<string, string> = {}

      scheduleDetail.students.attending.forEach(student => {
        notesMap[student.profileId] = student.note || ''
      })
      setStudentNotes(notesMap)
    }
  }, [editMode, scheduleDetail, isLoadingScheduleDetail, selectedClassId, selectedTeacherId, lessonNumber])

  // Check if there are changes in edit mode
  const hasChanges = useMemo(() => {
    if (!editMode || !originalValues) {
      return false
    }

    // Check if students list has changed
    const currentStudentIds = selectedStudents.map(s => s.profile_id).sort()
    const originalStudentIds = originalValues.students.map(s => s.profile_id).sort()
    const studentsChanged = JSON.stringify(currentStudentIds) !== JSON.stringify(originalStudentIds)

    // Check if other fields have changed
    const otherFieldsChanged =
      selectedClassId !== originalValues.classId ||
      selectedTeacherId !== originalValues.teacherId ||
      lessonNumber !== originalValues.lesson ||
      startTime !== originalValues.startTime ||
      endTime !== originalValues.endTime ||
      note !== originalValues.note

    return studentsChanged || otherFieldsChanged
  }, [editMode, originalValues, selectedStudents, selectedClassId, selectedTeacherId, lessonNumber, startTime, endTime, note])

  // Handle delete lesson schedule - show confirmation modal
  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    try {
      await updateLessonScheduleMutation.mutateAsync({
        weekId,
        classId: selectedClassId,
        lesson: lessonNumber,
        action: 'delete',
        scheduleTime: selectedSlot!.slotIndex + 1
      })

      setSuccessMessage('Xóa lịch học thành công!')
      setErrorMessage('')
      setShowDeleteConfirm(false)

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
        setSuccessMessage('')
      }, 2000)

    } catch (error) {
      setErrorMessage('Có lỗi xảy ra khi xóa lịch học')
      setSuccessMessage('')
      setShowDeleteConfirm(false)
    }
  }

  // Handle cancel delete
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (selectedStudents.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất một học sinh')

      return
    }

    if (!selectedClassId) {
      setErrorMessage('Vui lòng chọn lớp học')

      return
    }

    if (!selectedTeacherId) {
      setErrorMessage('Vui lòng chọn giáo viên')

      return
    }

    // Note: startTime and endTime can be undefined in edit mode
    if (!editMode && (!startTime || !endTime)) {
      setErrorMessage('Vui lòng nhập thời gian bắt đầu và kết thúc')

      return
    }

    // Validate time format for both create and edit modes
    if (startTime && !isValidTimeFormat(startTime)) {
      setErrorMessage('Thời gian bắt đầu phải ở định dạng HH:MM (ví dụ: 08:00)')

      return
    }

    if (endTime && !isValidTimeFormat(endTime)) {
      setErrorMessage('Thời gian kết thúc phải ở định dạng HH:MM (ví dụ: 10:00)')

      return
    }

    try {
      if (editMode) {
        // Update mode using UpdateLessonScheduleDto
        await updateLessonScheduleMutation.mutateAsync({
          weekId,
          scheduleTime: selectedSlot!.slotIndex + 1, // Convert to 1-based index
          classId: selectedClassId,
          lesson: lessonNumber,
          action: 'update',
          startTime: startTime ? formatTimeToHHMM(startTime) : undefined,
          endTime: endTime ? formatTimeToHHMM(endTime) : undefined,
          teacherId: selectedTeacherId,
          profileIds: selectedStudents.map(s => s.profile_id),
          note: note
        })

        setSuccessMessage('Cập nhật lịch học thành công!')
      } else {
        // Create mode
        await createLessonScheduleMutation.mutateAsync({
          weekId,
          scheduleTime: selectedSlot!.slotIndex, // Convert to 1-based index
          startTime: formatTimeToHHMM(startTime), // Format to HH:MM
          endTime: formatTimeToHHMM(endTime), // Format to HH:MM
          classId: selectedClassId,
          lesson: lessonNumber,
          teacherId: selectedTeacherId,
          profileIds: selectedStudents.map(s => s.profile_id),
          note: note
        })

        setSuccessMessage('Tạo lịch học thành công!')
      }

      setErrorMessage('')

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
        setSuccessMessage('')
      }, 2000)

    } catch (error) {
      setErrorMessage(editMode ? 'Có lỗi xảy ra khi cập nhật lịch học' : 'Có lỗi xảy ra khi tạo lịch học')
      setSuccessMessage('')
    }
  }

  // Handle remove student from selected list
  const handleRemoveStudent = (studentId: string) => {
    setSelectedStudents(prev => prev.filter(s => s.profile_id !== studentId && s.id !== studentId))
  }



  // Handle start editing individual student
  const handleStartEditStudent = (student: any) => {
    setEditingStudentId(student.profile_id)
    setEditingStudentStartTime(student.startTime || '')
    setEditingStudentEndTime(student.endTime || '')
    setEditingStudentNote(studentNotes[student.profile_id] || '')
  }

  // Format time to HH:MM format
  const formatTimeToHHMM = (time: string): string => {
    if (!time) return ''

    // If time is already in HH:MM format, return as is
    if (/^\d{2}:\d{2}$/.test(time)) {
      return time
    }

    // If time is in HH:MM:SS format, extract HH:MM
    if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
      return time.substring(0, 5)
    }

    // If time is in other formats, try to parse and format
    try {
      const date = new Date(`2000-01-01T${time}`)

      if (!isNaN(date.getTime())) {
        return date.toTimeString().substring(0, 5)
      }
    } catch (e) {
      // Ignore parsing errors
    }

    return time
  }

  // Validate time format
  const isValidTimeFormat = (time: string): boolean => {
    if (!time) return true // Empty time is valid (can be undefined)

    // Check format HH:MM
    if (!/^\d{2}:\d{2}$/.test(time)) return false

    // Check if hours and minutes are valid
    const [hours, minutes] = time.split(':').map(Number)


    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
  }

  // Handle save individual student changes
  const handleSaveStudentChanges = async (student: any) => {
    if (!student.scheduleId) return

    try {
      await updateUserScheduleMutation.mutateAsync({
        scheduleId: student.scheduleId,
        start_time: editingStudentStartTime ? formatTimeToHHMM(editingStudentStartTime) : undefined,
        end_time: editingStudentEndTime ? formatTimeToHHMM(editingStudentEndTime) : undefined,
        note: editingStudentNote
      })

      // Update local state
      setStudentNotes(prev => ({
        ...prev,
        [student.profile_id]: editingStudentNote
      }))

      // Exit edit mode
      setEditingStudentId(null)
      setEditingStudentStartTime('')
      setEditingStudentEndTime('')
      setEditingStudentNote('')

      setSuccessMessage(`Cập nhật thông tin cho ${student.fullname} thành công!`)
      setTimeout(() => setSuccessMessage(''), 3000)

    } catch (error) {
      setErrorMessage(`Có lỗi xảy ra khi cập nhật thông tin cho ${student.fullname}`)
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  // Handle cancel editing individual student
  const handleCancelEditStudent = () => {
    setEditingStudentId(null)
    setEditingStudentStartTime('')
    setEditingStudentEndTime('')
    setEditingStudentNote('')
  }

  // Handle search student
  const handleSearchStudent = (searchTerm: string) => {
    setStudentSearch(searchTerm)
    setShowSearchResults(searchTerm.length > 0)
  }

  // Handle search teacher
  const handleSearchTeacher = (searchTerm: string) => {
    setTeacherSearch(searchTerm)
    setShowTeacherSearchResults(searchTerm.length > 0)
  }

  // Handle add student from search
  const handleAddStudentFromSearch = (user: { id: string; fullname: string; email: string, profile_id: string }) => {
    const isAlreadySelected = selectedStudents.some(s => s.profile_id === user.profile_id)

    if (!isAlreadySelected) {
      // Find the full student data from searchResults
      const fullStudentData = searchResults?.users?.find(u => u.id === user.id)

      if (fullStudentData) {
        const studentToAdd: SelectedStudent = {
          id: fullStudentData.id,
          fullname: fullStudentData.profile.fullname,
          email: fullStudentData.profile.email,
          course: fullStudentData?.course,
          ieltsPoint: fullStudentData.profile.ieltsPoint,
          isBusy: fullStudentData.profile.busyScheduleArr?.includes((selectedSlot?.slotIndex || 0) + 1) || false,
          source: 'search',
          profile_id: fullStudentData.profile.id
        }

        setSelectedStudents(prev => [...prev, studentToAdd])
      }
    }

    setStudentSearch('')
    setShowSearchResults(false)
  }

  // Handle select teacher from search
  const handleSelectTeacher = (teacherId: string) => {
    setSelectedTeacherId(teacherId)
    setTeacherSearch('')
    setShowTeacherSearchResults(false)
  }

  // Handle add student from available list
  const handleAddAvailableStudent = (student: { id: string; fullname: string }) => {
    const isAlreadySelected = selectedStudents.some(s => s.id === student.id)

    if (!isAlreadySelected) {
      const studentToAdd: SelectedStudent = {
        id: student.id,
        fullname: student.fullname,
        email: undefined,
        course: undefined,
        ieltsPoint: undefined,
        isBusy: false,
        source: 'available',
        profile_id: student.id
      }

      setSelectedStudents(prev => [...prev, studentToAdd])
    }
  }

  // Check if student is already selected
  const isStudentSelected = (studentId: string) => {
    return selectedStudents.some(s => s.id === studentId || s.profile_id === studentId)
  }

  // Render selected students
  const renderSelectedStudents = () => {
    return selectedStudents.map(student => {
      return (
        <Box
          key={student.profile_id}
          sx={{
            p: 1,
            backgroundColor: '#fff',
            borderRadius: 1,
            border: '1px solid #c8e6c9',
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}
        >
          {/* Student Info Row */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%'
          }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                {student.fullname}
              </Typography>
              {student.email && (
                <Typography variant="caption" color="text.secondary" display="block">
                  {student.email}
                </Typography>
              )}
              {(student.course || student.courseName) && (
                <Typography variant="caption" color="primary" display="block">
                  <i className="ri-book-line" style={{ marginRight: 4, fontSize: '10px' }} />
                  {student.course?.name || student.courseName}
                </Typography>
              )}
              {/* Alternative: Try to get course from other sources */}
              {!student.course && !student.courseName && student.source === 'search' && student.ieltsPoint && (
                <Typography variant="caption" color="info" display="block">
                  <i className="ri-award-line" style={{ marginRight: 4, fontSize: '10px' }} />
                  IELTS: {student.ieltsPoint}
                </Typography>
              )}
              {/* Debug: Show course info if available */}
              {!student.course && !student.courseName && !student.ieltsPoint && student.source === 'search' && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontStyle: 'italic' }}>
                  <i className="ri-information-line" style={{ marginRight: 4, fontSize: '10px' }} />
                  Chưa có thông tin khóa học
                </Typography>
              )}
              {student.source === 'search' && student.isBusy && (
                <Box sx={{
                  mt: 0.5,
                  p: 0.5,
                  backgroundColor: '#ffebee',
                  borderRadius: 0.5,
                  border: '1px solid #ffcdd2'
                }}>
                  <Typography variant="caption" color="error" sx={{ fontSize: '0.7rem' }}>
                    <i className="ri-time-line" style={{ marginRight: 4 }} />
                    Bận trong khung giờ này
                  </Typography>
                </Box>
              )}
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              {student.source === 'search' && student.isBusy ? (
                <Chip
                  size="small"
                  label="Bận"
                  color="error"
                  variant="outlined"
                  sx={{ fontSize: '0.65rem' }}
                />
              ) : (
                <Chip
                  size="small"
                  label="Rảnh"
                  color="success"
                  variant="outlined"
                  sx={{ fontSize: '0.65rem' }}
                />
              )}
              {(!editMode || editMode) && (
                <Chip
                  size="small"
                  label="Xóa"
                  color="error"
                  variant="outlined"
                  onDelete={() => handleRemoveStudent(student.profile_id)}
                  sx={{ fontSize: '0.65rem' }}
                />
              )}
            </Box>
          </Box>

          {/* Individual Student Fields - Only in Edit Mode */}
          {editMode && (
            <Box sx={{ mt: 1 }}>
              {/* Show current values when not editing */}
              {editingStudentId !== student.profile_id && (
                <Box sx={{
                  p: 1,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1,
                  border: '1px solid #e0e0e0'
                }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      Thông tin hiện tại:
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<i className="ri-edit-line" />}
                      onClick={() => handleStartEditStudent(student)}
                      sx={{ fontSize: '0.7rem', py: 0.25, px: 1 }}
                    >
                      Chỉnh sửa
                    </Button>
                  </Box>

                  {/* Current values display */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      <strong>Thời gian:</strong> {formatTimeToHHMM(student.startTime || '') || 'Chưa có'} - {formatTimeToHHMM(student.endTime || '') || 'Chưa có'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      <strong>Ghi chú:</strong> {studentNotes[student.profile_id] || 'Chưa có ghi chú'}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Edit form when editing */}
              {editingStudentId === student.profile_id && (
                <Box sx={{
                  p: 1.5,
                  backgroundColor: '#e3f2fd',
                  borderRadius: 1,
                  border: '1px solid #bbdefb'
                }}>
                  <Typography variant="caption" fontWeight={600} color="primary" display="block" mb={1}>
                    <i className="ri-edit-line" style={{ marginRight: 4 }} />
                    Chỉnh sửa thông tin cho {student.fullname}
                  </Typography>

                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Thời gian bắt đầu"
                        value={editingStudentStartTime}
                        onChange={(e) => {
                          const value = e.target.value
                          const sanitized = value.replace(/[^0-9:]/g, '')

                          if (sanitized.length === 2 && !sanitized.includes(':')) {
                            setEditingStudentStartTime(sanitized + ':')
                          } else if (sanitized.length <= 5) {
                            setEditingStudentStartTime(sanitized)
                          }
                        }}
                        placeholder="HH:MM"
                        InputLabelProps={{ shrink: true }}
                        helperText="HH:MM"
                        inputProps={{
                          maxLength: 5,
                          pattern: '[0-9]{2}:[0-9]{2}'
                        }}
                        error={!!(editingStudentStartTime && !isValidTimeFormat(editingStudentStartTime))}
                        sx={{ '& .MuiInputBase-root': { fontSize: '0.75rem' } }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Thời gian kết thúc"
                        value={editingStudentEndTime}
                        onChange={(e) => {
                          const value = e.target.value
                          const sanitized = value.replace(/[^0-9:]/g, '')

                          if (sanitized.length === 2 && !sanitized.includes(':')) {
                            setEditingStudentEndTime(sanitized + ':')
                          } else if (sanitized.length <= 5) {
                            setEditingStudentEndTime(sanitized)
                          }
                        }}
                        placeholder="HH:MM"
                        InputLabelProps={{ shrink: true }}
                        helperText="HH:MM"
                        inputProps={{
                          maxLength: 5,
                          pattern: '[0-9]{2}:[0-9]{2}'
                        }}
                        error={!!(editingStudentEndTime && !isValidTimeFormat(editingStudentEndTime))}
                        sx={{ '& .MuiInputBase-root': { fontSize: '0.75rem' } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Ghi chú riêng"
                        multiline
                        rows={2}
                        value={editingStudentNote}
                        onChange={(e) => setEditingStudentNote(e.target.value)}
                        placeholder="Nhập ghi chú riêng cho học sinh này..."
                        sx={{ '& .MuiInputBase-root': { fontSize: '0.75rem' } }}
                      />
                    </Grid>
                  </Grid>

                  {/* Action buttons */}
                  <Box display="flex" gap={1} mt={1}>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={() => handleSaveStudentChanges(student)}
                      disabled={updateUserScheduleMutation.isPending}
                      sx={{ fontSize: '0.7rem', py: 0.25, px: 1 }}
                    >
                      {updateUserScheduleMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="inherit"
                      onClick={handleCancelEditStudent}
                      sx={{ fontSize: '0.7rem', py: 0.25, px: 1 }}
                    >
                      Hủy
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )
    })
  }

  // Handle close
  const handleClose = () => {
    setSelectedStudents([])
    setSelectedClassId('')
    setSelectedTeacherId('')
    setLessonNumber(1)
    setStartTime('')
    setEndTime('')
    setNote('')
    setStudentNotes({})
    setEditingStudentId(null)
    setEditingStudentStartTime('')
    setEditingStudentEndTime('')
    setEditingStudentNote('')
    setStudentSearch('')
    setShowSearchResults(false)
    setTeacherSearch('')
    setShowTeacherSearchResults(false)
    setSuccessMessage('')
    setErrorMessage('')
    setOriginalValues(null)
    setShowDeleteConfirm(false)
    setNote('')
    onClose()
  }

  if (!selectedSlot) return null

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <i className={editMode ? "ri-edit-line" : "ri-calendar-schedule-line"} style={{ fontSize: '24px', color: '#1976d2' }} />
          <Typography variant="h6" fontWeight={600}>
            {editMode ? 'Chỉnh sửa lịch học' : 'Tạo lịch học mới'}
          </Typography>
          {editMode && editData && (
            <Chip
              label={`${editData.className} - Buổi ${editData.lesson}`}
              color="primary"
              variant="outlined"
              size="small"
            />
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Loading indicator for edit mode */}
          {editMode && isLoadingScheduleDetail && (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                Đang tải thông tin lịch học...
              </Typography>
            </Box>
          )}

          {/* Form content - hide while loading in edit mode */}
          {(!editMode || !isLoadingScheduleDetail) && (
            <>
              {/* Slot Information */}
              <Box sx={{ mb: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>
                  Thông tin khung giờ
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Ngày: <strong>{selectedSlot.day}</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Giờ: <strong>{selectedSlot.time}</strong>
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Grid container spacing={3}>
                {/* Lesson Number */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Số buổi học"
                    type="number"
                    value={lessonNumber}
                    onChange={(e) => setLessonNumber(parseInt(e.target.value) || 1)}
                    inputProps={{ min: 1, max: 50 }}
                    required
                    disabled={editMode}
                  />
                </Grid>

                {/* Class Selection */}
                <Grid item xs={12} md={6}>
                  <Box>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography variant="subtitle2" gutterBottom>
                        Lớp học <span style={{ color: 'red' }}>*</span>
                      </Typography>
                      {!editMode && courseId && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<i className="ri-add-line" />}
                          onClick={() => setShowCreateClassDialog(true)}
                          sx={{ fontSize: '0.75rem' }}
                        >
                          Tạo lớp mới
                        </Button>
                      )}
                    </Box>
                    <Autocomplete
                      fullWidth
                      options={courseClasses}
                      value={selectedClass}
                      onChange={(_, value) => {
                        setSelectedClassId(value?.id || '')

                        if (!editMode) {
                          if (value) {
                            setSelectedTeacherId(value.teacherId)
                          } else {
                            setSelectedTeacherId('')
                          }
                        }
                      }}
                      disabled={editMode}
                      getOptionLabel={(option) => option?.name ?? ''}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      noOptionsText="Không tìm thấy lớp học"
                      ListboxProps={{ style: { maxHeight: 260 } }}
                      renderOption={(props, option) => (
                        <Box component="li" {...props} key={option.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <i className="ri-book-line" style={{ color: '#1976d2' }} />
                          <span>{option.name}</span>
                        </Box>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Lớp học"
                          placeholder="Chọn hoặc tìm kiếm lớp học"
                          required
                        />
                      )}
                    />
                  </Box>
                </Grid>

                {/* Teacher Selection */}
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Giáo viên <span style={{ color: 'red' }}>*</span>
                    </Typography>

                    {/* Teacher Search */}
                    <TextField
                      fullWidth
                      placeholder="Tìm kiếm giáo viên..."
                      value={teacherSearch}
                      onChange={(e) => handleSearchTeacher(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <i className="ri-search-line" style={{ color: '#666', marginRight: 8 }} />
                        ),
                        endAdornment: teacherSearch && (
                          <i
                            className="ri-close-line"
                            style={{
                              color: '#666',
                              cursor: 'pointer',
                              fontSize: '18px'
                            }}
                            onClick={() => {
                              setTeacherSearch('')
                              setShowTeacherSearchResults(false)
                            }}
                          />
                        )
                      }}
                      sx={{ mb: 1 }}
                    />

                    {/* Teacher Search Results */}
                    {showTeacherSearchResults && (
                      <Box sx={{
                        maxHeight: '200px',
                        overflowY: 'auto',
                        border: '1px solid #eee',
                        borderRadius: 1,
                        p: 1,
                        backgroundColor: '#f8f9fa',
                        mb: 1
                      }}>
                        {teacherList?.filter(teacher =>
                          teacher.name.toLowerCase().includes(teacherSearch.toLowerCase())
                        ).map((teacher) => {
                          const isDefaultTeacher = selectedClass ? selectedClass.teacherId === teacher.id : false

                          const isTeacherBusy = teacher.registeredBusySchedule?.includes(selectedSlot!.slotIndex)
                          const isSelected = selectedTeacherId === teacher.id

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
                              onClick={() => handleSelectTeacher(teacher.id)}
                            >
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" fontWeight={500}>
                                  {teacher.name}
                                </Typography>
                                {isDefaultTeacher && (
                                  <Typography variant="caption" color="primary" display="block">
                                    <i className="ri-user-star-line" style={{ marginRight: 4, fontSize: '12px' }} />
                                    Giáo viên mặc định của lớp
                                  </Typography>
                                )}
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {isDefaultTeacher && (
                                  <Chip
                                    size="small"
                                    label="Mặc định"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem' }}
                                  />
                                )}
                                <Chip
                                  size="small"
                                  label={isTeacherBusy ? "Bận" : "Rảnh"}
                                  color={isTeacherBusy ? "error" : "success"}
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                                {isSelected && (
                                  <Chip
                                    size="small"
                                    label="Đã chọn"
                                    color="success"
                                    variant="filled"
                                    sx={{ fontSize: '0.7rem' }}
                                  />
                                )}
                              </Box>
                            </Box>
                          )
                        })}
                      </Box>
                    )}

                    {/* Selected Teacher Display */}
                    {selectedTeacherId && !showTeacherSearchResults && (() => {
                      const selectedTeacher = teacherList?.find(t => t.id === selectedTeacherId)

                      if (!selectedTeacher) return null

                      const isDefaultTeacher = selectedClass ? selectedClass.teacherId === selectedTeacher.id : false

                      return (
                        <Box sx={{
                          p: 1.5,
                          backgroundColor: '#e8f5e8',
                          borderRadius: 1,
                          border: '1px solid #c8e6c9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {selectedTeacher.name}
                            </Typography>
                            {isDefaultTeacher && (
                              <Typography variant="caption" color="primary" display="block">
                                <i className="ri-user-star-line" style={{ marginRight: 4, fontSize: '12px' }} />
                                Giáo viên mặc định của lớp
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {isDefaultTeacher && (
                              <Chip
                                size="small"
                                label="Mặc định"
                                color="primary"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            )}
                            {/* <Chip
                              size="small"
                              label={isTeacherBusy ? "Bận" : "Rảnh"}
                              color={isTeacherBusy ? "error" : "success"}
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            /> */}
                            <Button
                              size="small"
                              variant="outlined"
                              color="inherit"
                              onClick={() => {
                                setTeacherSearch('')
                                setShowTeacherSearchResults(true)
                              }}
                              sx={{ fontSize: '0.7rem', py: 0.25, px: 1 }}
                            >
                              Thay đổi
                            </Button>
                          </Box>
                        </Box>
                      )
                    })()}

                    {/* Default Teacher Quick Select */}
                    {selectedClass && !selectedTeacherId && !showTeacherSearchResults && (() => {
                      const isDefaultTeacherBusy = teacherList?.find(t => t.id === selectedClass.teacherId)?.registeredBusySchedule?.includes(selectedSlot!.slotIndex + 1)

                      return (
                        <Box sx={{
                          p: 1.5,
                          backgroundColor: '#fff3e0',
                          borderRadius: 1,
                          border: '1px solid #ffb74d',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {selectedClass.teacher.name}
                            </Typography>
                            <Typography variant="caption" color="primary" display="block">
                              <i className="ri-user-star-line" style={{ marginRight: 4, fontSize: '12px' }} />
                              Giáo viên mặc định của lớp
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              size="small"
                              label="Mặc định"
                              color="primary"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                            <Chip
                              size="small"
                              label={isDefaultTeacherBusy ? "Bận" : "Rảnh"}
                              color={isDefaultTeacherBusy ? "error" : "success"}
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              onClick={() => handleSelectTeacher(selectedClass.teacherId)}
                              sx={{ fontSize: '0.7rem', py: 0.25, px: 1 }}
                            >
                              Chọn
                            </Button>
                          </Box>
                        </Box>
                      )
                    })()}
                  </Box>
                </Grid>

                {/* Start Time */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Thời gian bắt đầu"
                    value={startTime}
                    onChange={(e) => {
                      const value = e.target.value

                      // Chỉ cho phép nhập số và dấu :
                      const sanitized = value.replace(/[^0-9:]/g, '')


                      // Tự động thêm dấu : sau 2 ký tự đầu
                      if (sanitized.length === 2 && !sanitized.includes(':')) {
                        setStartTime(sanitized + ':')
                      } else if (sanitized.length <= 5) {
                        setStartTime(sanitized)
                      }
                    }}
                    placeholder="HH:MM"
                    required
                    InputLabelProps={{ shrink: true }}
                    helperText="Định dạng: HH:MM (ví dụ: 08:00)"
                    inputProps={{
                      maxLength: 5,
                      pattern: '[0-9]{2}:[0-9]{2}'
                    }}
                    error={!!(startTime && !isValidTimeFormat(startTime))}
                  />
                </Grid>

                {/* End Time */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Thời gian kết thúc"
                    value={endTime}
                    onChange={(e) => {
                      const value = e.target.value

                      // Chỉ cho phép nhập số và dấu :
                      const sanitized = value.replace(/[^0-9:]/g, '')


                      // Tự động thêm dấu : sau 2 ký tự đầu
                      if (sanitized.length === 2 && !sanitized.includes(':')) {
                        setEndTime(sanitized + ':')
                      } else if (sanitized.length <= 5) {
                        setEndTime(sanitized)
                      }
                    }}
                    placeholder="HH:MM"
                    required
                    InputLabelProps={{ shrink: true }}
                    helperText="Định dạng: HH:MM (ví dụ: 17:00)"
                    inputProps={{
                      maxLength: 5,
                      pattern: '[0-9]{2}:[0-9]{2}'
                    }}
                    error={!!(endTime && !isValidTimeFormat(endTime))}
                  />
                </Grid>

                {/* Note Field */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={editMode ? "Ghi chú chung cho buổi học" : "Ghi chú cho buổi học"}
                    multiline
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={
                      editMode
                        ? "Nhập ghi chú chung về nội dung, bài tập hoặc thông tin khác cho buổi học này..."
                        : "Nhập ghi chú về nội dung, bài tập hoặc thông tin khác cho buổi học này..."
                    }
                    InputProps={{
                      startAdornment: (
                        <i className="ri-sticky-note-line" style={{ color: '#666', marginRight: 8, alignSelf: 'flex-start', marginTop: 12 }} />
                      )
                    }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Student Selection - only show in create mode or show read-only in edit mode */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  {editMode ? 'Học sinh trong lịch học' : 'Chọn học sinh'} ({selectedStudents.length} {editMode ? 'học sinh' : 'đã chọn'})
                </Typography>

                {/* Search for additional students - only in create mode or edit mode */}
                {(!editMode || editMode) && (
                  <Box sx={{ mb: 2 }}>
                    <TextField
                      fullWidth
                      placeholder="Tìm kiếm học sinh để thêm vào lịch học..."
                      value={studentSearch}
                      onChange={(e) => handleSearchStudent(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <i className="ri-search-line" style={{ color: '#666', marginRight: 8 }} />
                        ),
                        endAdornment: studentSearch && (
                          <i
                            className="ri-close-line"
                            style={{
                              color: '#666',
                              cursor: 'pointer',
                              fontSize: '18px'
                            }}
                            onClick={() => {
                              setStudentSearch('')
                              setShowSearchResults(false)
                            }}
                          />
                        )
                      }}
                      sx={{ mb: 1 }}
                    />

                    {/* Search Results */}
                    {showSearchResults && (
                      <Box sx={{
                        maxHeight: '200px',
                        overflowY: 'auto',
                        border: '1px solid #eee',
                        borderRadius: 1,
                        p: 1,
                        backgroundColor: '#f8f9fa'
                      }}>
                        {isSearchLoading ? (
                          <Box display="flex" justifyContent="center" p={2}>
                            <CircularProgress size={20} />
                          </Box>
                        ) : searchResults?.users && searchResults.users.length > 0 ? (
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                              Kết quả tìm kiếm ({searchResults.users.length} học sinh):
                            </Typography>
                            {searchResults.users.map((user) => {
                              // Check if student is busy at selected time slot
                              const isBusy = user.profile.busyScheduleArr?.includes(selectedSlot!.slotIndex + 1)

                              return (
                                <Box
                                  key={user.id}
                                  sx={{
                                    p: 1,
                                    borderBottom: '1px solid #eee',
                                    '&:last-child': { borderBottom: 'none' },
                                    cursor: isBusy ? 'not-allowed' : 'pointer',
                                    '&:hover': {
                                      backgroundColor: isBusy ? '#ffebee' : '#e3f2fd'
                                    },
                                    borderRadius: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    opacity: isBusy ? 0.6 : 1,
                                    backgroundColor: isBusy ? '#fff5f5' : 'transparent'
                                  }}
                                  onClick={() => {
                                    if (!isBusy) {
                                      handleAddStudentFromSearch({
                                        id: user.id,
                                        fullname: user.profile.fullname,
                                        email: user.profile.email,
                                        profile_id: user.profile.id
                                      })
                                    }
                                  }}
                                >
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" fontWeight={500}>
                                      {user.profile.fullname}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      {user.profile.email}
                                    </Typography>
                                    {user?.course && (
                                      <Typography variant="caption" color="primary" display="block">
                                        <i className="ri-book-line" style={{ marginRight: 4, fontSize: '12px' }} />
                                        {user.course.name}
                                      </Typography>
                                    )}
                                    {isBusy && (
                                      <Box sx={{
                                        mt: 0.5,
                                        p: 0.5,
                                        backgroundColor: '#ffebee',
                                        borderRadius: 0.5,
                                        border: '1px solid #ffcdd2'
                                      }}>
                                        <Typography variant="caption" color="error" sx={{ fontSize: '0.7rem' }}>
                                          <i className="ri-time-line" style={{ marginRight: 4 }} />
                                          Bận trong khung giờ này
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {isBusy ? (
                                      <Chip
                                        size="small"
                                        label="Bận"
                                        color="error"
                                        variant="outlined"
                                        sx={{ fontSize: '0.7rem' }}
                                      />
                                    ) : isStudentSelected(user.profile.id) ? (
                                      <Chip
                                        size="small"
                                        label="Đã chọn"
                                        color="success"
                                        variant="outlined"
                                      />
                                    ) : (
                                      <Chip
                                        size="small"
                                        label="Rảnh"
                                        color="success"
                                        variant="outlined"
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
                            Không tìm thấy học sinh nào
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                )}

                {/* Available Students from Slot - only in create mode */}
                {!editMode && availableStudents.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" mb={1}>
                      Học sinh rảnh trong khung giờ này:
                    </Typography>
                    <Box sx={{
                      maxHeight: '200px',
                      overflowY: 'auto',
                      border: '1px solid #eee',
                      borderRadius: 1,
                      p: 2
                    }}>
                      <Grid container spacing={1}>
                        {availableStudents.map((student) => (
                          <Grid item xs={12} sm={6} md={4} key={student.id}>
                            <Chip
                              label={student.fullname}
                              onClick={() => handleAddAvailableStudent(student)}
                              color={isStudentSelected(student.id) ? 'primary' : 'default'}
                              variant={isStudentSelected(student.id) ? 'filled' : 'outlined'}
                              sx={{
                                cursor: 'pointer',
                                width: '100%',
                                justifyContent: 'center'
                              }}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Box>
                )}

                {/* Absent Students - only in edit mode */}
                {editMode && scheduleDetail && scheduleDetail.students.absent.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" mb={1}>
                      Học sinh thiếu lịch ({scheduleDetail.students.absent.length} học sinh):
                    </Typography>
                    <Box sx={{
                      maxHeight: '200px',
                      overflowY: 'auto',
                      border: '1px solid #eee',
                      borderRadius: 1,
                      p: 2
                    }}>
                      <Grid container spacing={1}>
                        {scheduleDetail.students.absent.map((student) => (
                          <Grid item xs={12} sm={6} md={4} key={student.profileId}>
                            <Box sx={{
                              p: 1,
                              border: '1px solid #ffcdd2',
                              borderRadius: 1,
                              backgroundColor: '#ffebee',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 0.5
                            }}>
                              <Typography variant="body2" fontWeight={500} color="error">
                                {student.fullname}
                              </Typography>
                              {student.courseName && (
                                <Typography variant="caption" color="text.secondary">
                                  <i className="ri-book-line" style={{ marginRight: 4, fontSize: '10px' }} />
                                  {student.courseName}
                                </Typography>
                              )}
                              {student.email && (
                                <Typography variant="caption" color="text.secondary">
                                  {student.email}
                                </Typography>
                              )}
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Box>
                )}

                {/* Selected Students Summary */}
                {selectedStudents.length > 0 && (
                  <Box sx={{
                    p: 2,
                    backgroundColor: editMode ? '#fff3e0' : '#e8f5e8',
                    borderRadius: 1,
                    border: `1px solid ${editMode ? '#ffb74d' : '#c8e6c9'}`
                  }}>
                    <Typography variant="subtitle2" fontWeight={600} color={editMode ? 'warning.main' : 'success.main'} mb={1}>
                      {editMode ? 'Học sinh trong lịch học' : 'Học sinh đã chọn'} ({selectedStudents.length}):
                    </Typography>
                    {editMode && (
                      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                        <i className="ri-information-line" style={{ marginRight: 4 }} />
                        Bạn có thể chỉnh sửa ghi chú riêng cho từng học sinh bên dưới
                      </Typography>
                    )}
                    <Box display="flex" flexDirection="column" gap={1}>
                      {renderSelectedStudents()}
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Messages */}
              {successMessage && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {successMessage}
                </Alert>
              )}
              {errorMessage && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {errorMessage}
                </Alert>
              )}
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Hủy
        </Button>

        {/* Delete button for edit mode */}
        {editMode && (
          <Button
            variant="outlined"
            color="error"
            onClick={handleDelete}
            disabled={updateLessonScheduleMutation.isPending}
            startIcon={
              updateLessonScheduleMutation.isPending ?
                <CircularProgress size={16} /> :
                <i className="ri-delete-bin-line" />
            }
          >
            {updateLessonScheduleMutation.isPending ? 'Đang xóa...' : 'Xóa lịch học'}
          </Button>
        )}

        {/* Update/Create button */}
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            (editMode ? updateLessonScheduleMutation.isPending : createLessonScheduleMutation.isPending) ||
            (!editMode && selectedStudents.length === 0) ||
            (!editMode && !selectedTeacherId) ||
            (!editMode && (!startTime || !endTime)) ||
            (editMode && isLoadingScheduleDetail) ||
            (editMode && !hasChanges)
          }
          color="primary"
          startIcon={
            (editMode ? updateLessonScheduleMutation.isPending : createLessonScheduleMutation.isPending) ?
              <CircularProgress size={16} /> :
              <i className="ri-save-line" />
          }
        >
          {editMode ?
            (updateLessonScheduleMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật lịch học') :
            (createLessonScheduleMutation.isPending ? 'Đang tạo...' : 'Tạo lịch học')
          }
        </Button>
      </DialogActions>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={showDeleteConfirm}
        onClose={handleCancelDelete}
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
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ff5252 0%, #f44336 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}
            >
              <i className="ri-delete-bin-line" style={{ fontSize: '24px' }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} color="error">
                Xác nhận xóa lịch học
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hành động này không thể hoàn tác
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={600}>
                Bạn có chắc chắn muốn xóa lịch học này?
              </Typography>
            </Alert>

            <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, border: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Thông tin lịch học sẽ bị xóa:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Lớp học:</strong> {editData?.className || 'Chưa chọn lớp'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Buổi học:</strong> {lessonNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Khung giờ:</strong> {selectedSlot?.day} - {selectedSlot?.time}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Số học sinh:</strong> {selectedStudents.length} học sinh
                </Typography>
                {selectedStudents.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Danh sách học sinh:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {selectedStudents.slice(0, 5).map((student) => (
                        <Chip
                          key={student.profile_id}
                          label={student.fullname}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      ))}
                      {selectedStudents.length > 5 && (
                        <Chip
                          label={`+${selectedStudents.length - 5} khác`}
                          size="small"
                          variant="outlined"
                          color="secondary"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>

            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Cảnh báo:</strong> Tất cả dữ liệu liên quan đến lịch học này sẽ bị xóa vĩnh viễn, bao gồm:
              </Typography>
              <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                <Typography component="li" variant="body2">
                  Thông tin lịch học của học sinh
                </Typography>
                <Typography component="li" variant="body2">
                  Ghi chú và thời gian cá nhân
                </Typography>
                <Typography component="li" variant="body2">
                  Lịch sử điểm danh (nếu có)
                </Typography>
              </Box>
            </Alert>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={handleCancelDelete}
            variant="outlined"
            color="inherit"
            startIcon={<i className="ri-close-line" />}
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={updateLessonScheduleMutation.isPending}
            startIcon={
              updateLessonScheduleMutation.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <i className="ri-delete-bin-line" />
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
            {updateLessonScheduleMutation.isPending ? 'Đang xóa...' : 'Xóa lịch học'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Class Dialog */}
      <Dialog
        open={showCreateClassDialog}
        onClose={() => setShowCreateClassDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <i className="ri-add-line" style={{ fontSize: '24px', color: '#1976d2' }} />
            <Typography variant="h6" fontWeight={600}>
              Tạo lớp học mới
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {courseId ? (
              <CreateClassForm
                courseId={courseId}
                onSuccess={() => {
                  setShowCreateClassDialog(false)
                  setSuccessMessage('Tạo lớp học thành công! Danh sách lớp sẽ tự động cập nhật. Bạn có thể chọn lớp mới từ danh sách.')
                  setTimeout(() => setSuccessMessage(''), 5000)

                  // The useCreateClass hook will automatically invalidate the courseInfo query
                  // so the parent component will refresh the class list automatically
                  // Parent component's courseInfo query will be refetched and courseClasses will update
                }}
              />
            ) : (
              <Alert severity="error">
                Không thể tạo lớp học: Chưa chọn khóa học.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateClassDialog(false)} color="inherit">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}

export default CreateLessonSchedule
