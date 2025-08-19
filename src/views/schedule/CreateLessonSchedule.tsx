'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// MUI Imports
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material'

// Hooks
import { useCreateLessonSchedule, useGetScheduleDetail, useUpdateUserSchedule, useUpdateLessonSchedule } from '@/@core/hooks/useSchedule'
import { useStudentList } from '@/@core/hooks/useStudent'
import { useTeacherList } from '@/@core/hooks/useTeacher'

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
  weekId?: string
  editMode?: boolean
  editData?: {
    classId: string
    lesson: number
    teacherName: string
    className: string
    scheduleTime: number
  } | null
}

const CreateLessonSchedule = ({
  open,
  onClose,
  selectedSlot,
  availableStudents,
  courseClasses,
  weekId = "08a60c9a-b3f8-42f8-8ff8-c7015d4ef3e7",
  editMode = false,
  editData = null
}: CreateLessonScheduleProps) => {
  const createLessonScheduleMutation = useCreateLessonSchedule()
  const updateUserScheduleMutation = useUpdateUserSchedule()
  const updateLessonScheduleMutation = useUpdateLessonSchedule()
  
  // Get schedule detail for edit mode
  const { data: scheduleDetail, isLoading: isLoadingScheduleDetail } = useGetScheduleDetail(
    editData?.classId || '',
    editData?.lesson || 0,
    weekId
  )

  // Define student type
  type SelectedStudent = {
    id: string
    fullname: string
    email?: string
    course?: { id: string; name: string }
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
  
  // Original values for comparison (edit mode)
  const [originalValues, setOriginalValues] = useState<{
    students: SelectedStudent[]
    classId: string
    teacherId: string
    lesson: number
    startTime: string
    endTime: string
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

  // Student search hook
  const { data: searchResults, isLoading: isSearchLoading } = useStudentList(studentSearch)
  
  // Teacher list hook
  const { data: teacherList } = useTeacherList()

  // Messages
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  
  // Action state for edit mode (removed, will use direct action)

  // Reset form when modal opens/closes or slot changes
  useEffect(() => {
    if (open && selectedSlot) {
      if (editMode && editData) {
        // Edit mode - populate with existing data
        setSelectedClassId(editData.classId)
        setLessonNumber(editData.lesson)
        
        // Find teacher from class
        const selectedClass = courseClasses.find(cls => cls.id === editData.classId)

        if (selectedClass) {
          setSelectedTeacherId(selectedClass.teacherId)
          console.log('Setting teacher from class:', selectedClass.teacherId)
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
      }
      
      // Parse time from slot and format to HH:MM
      const timeParts = selectedSlot.time.split('-')

      if (timeParts.length === 2) {
        setStartTime(formatTimeToHHMM(timeParts[0]))
        setEndTime(formatTimeToHHMM(timeParts[1]))
      }
    }
  }, [open, selectedSlot, editMode, editData, courseClasses])

  // Populate form with schedule detail data when in edit mode
  useEffect(() => {
    if (editMode && scheduleDetail && !isLoadingScheduleDetail) {
      // Populate students from schedule detail
      const attendingStudents = scheduleDetail.students.attending.map(student => ({
        id: student.profileId,
        fullname: student.fullname,
        email: student.email,
        course: undefined,
        ieltsPoint: undefined,
        isBusy: false,
        source: 'available' as const,
        profile_id: student.profileId,
        startTime: student.startTime,
        endTime: student.endTime,
        scheduleId: student.scheduleId
      }))

      setSelectedStudents(attendingStudents)
      
      // Store original values for comparison
      // Get the actual teacher ID from schedule detail or editData
      const actualTeacherId = scheduleDetail.students.attending.length > 0 
        ? (scheduleDetail.students.attending[0].teacherId || selectedTeacherId)
        : selectedTeacherId
        
      const originalValuesToSet = {
        students: [...attendingStudents],
        classId: selectedClassId,
        teacherId: actualTeacherId || '',
        lesson: lessonNumber,
        startTime: startTime,
        endTime: endTime
      }
      
      setOriginalValues(originalValuesToSet)
      
      // Initialize individual student notes
      const notesMap: Record<string, string> = {}

      scheduleDetail.students.attending.forEach(student => {
        notesMap[student.profileId] = student.note || ''
      })
      setStudentNotes(notesMap)
      
      // Set general note from first student's note (for backward compatibility)
      if (scheduleDetail.students.attending.length > 0) {
        setNote(scheduleDetail.students.attending[0].note || '')
      }

      // Set start/end time if available and format to HH:MM
      if (scheduleDetail.students.attending.length > 0) {
        const firstStudent = scheduleDetail.students.attending[0]

        if (firstStudent.startTime) {
          setStartTime(formatTimeToHHMM(firstStudent.startTime))
        }

        if (firstStudent.endTime) {
          setEndTime(formatTimeToHHMM(firstStudent.endTime))
        }
      }
    }
  }, [editMode, scheduleDetail, isLoadingScheduleDetail, selectedClassId, selectedTeacherId, lessonNumber, startTime, endTime])

  // Check if there are changes in edit mode
  const hasChanges = useMemo(() => {
    if (!editMode || !originalValues) return false
    
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
      endTime !== originalValues.endTime
    
    // Debug log
    if (editMode && originalValues) {
      console.log('Debug hasChanges:', {
        selectedTeacherId,
        originalTeacherId: originalValues.teacherId,
        teacherChanged: selectedTeacherId !== originalValues.teacherId,
        otherFieldsChanged,
        hasChanges: studentsChanged || otherFieldsChanged
      })
    }
    
    return studentsChanged || otherFieldsChanged
  }, [editMode, originalValues, selectedStudents, selectedClassId, selectedTeacherId, lessonNumber, startTime, endTime])

  // Handle delete lesson schedule
  const handleDelete = async () => {
    try {
      await updateLessonScheduleMutation.mutateAsync({
        weekId,
        classId: selectedClassId,
        lesson: lessonNumber,
        action: 'delete'
      })
      
      setSuccessMessage('Xóa lịch học thành công!')
      setErrorMessage('')
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
        setSuccessMessage('')
      }, 2000)
      
    } catch (error) {
      setErrorMessage('Có lỗi xảy ra khi xóa lịch học')
      setSuccessMessage('')
    }
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
          profileIds: selectedStudents.map(s => s.profile_id)
        })
        
        setSuccessMessage('Cập nhật lịch học thành công!')
      } else {
        // Create mode
        await createLessonScheduleMutation.mutateAsync({
          weekId,
          scheduleTime: selectedSlot!.slotIndex + 1, // Convert to 1-based index
          startTime: formatTimeToHHMM(startTime), // Format to HH:MM
          endTime: formatTimeToHHMM(endTime), // Format to HH:MM
          classId: selectedClassId,
          lesson: lessonNumber,
          teacherId: selectedTeacherId,
          profileIds: selectedStudents.map(s => s.profile_id)
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

  // Handle add student from available list (for edit mode)
  const handleAddStudentFromAvailable = (student: { id: string; fullname: string }) => {
    const isAlreadySelected = selectedStudents.some(s => s.id === student.id || s.profile_id === student.id)

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
    
return /^\d{2}:\d{2}$/.test(time)
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

  // Handle add student from search
  const handleAddStudentFromSearch = (user: { id: string; fullname: string; email: string, profile_id: string}) => {
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
              {student.course && (
                <Typography variant="caption" color="primary" display="block">
                  <i className="ri-book-line" style={{ marginRight: 4, fontSize: '10px' }} />
                  {student.course.name}
                </Typography>
              )}
              {/* Alternative: Try to get course from other sources */}
              {!student.course && student.source === 'search' && student.ieltsPoint && (
                <Typography variant="caption" color="info" display="block">
                  <i className="ri-award-line" style={{ marginRight: 4, fontSize: '10px' }} />
                  IELTS: {student.ieltsPoint}
                </Typography>
              )}
              {/* Debug: Show course info if available */}
              {!student.course && !student.ieltsPoint && student.source === 'search' && (
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
                        type="time"
                        value={editingStudentStartTime}
                        onChange={(e) => setEditingStudentStartTime(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        helperText="HH:MM"
                        sx={{ '& .MuiInputBase-root': { fontSize: '0.75rem' } }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Thời gian kết thúc"
                        type="time"
                        value={editingStudentEndTime}
                        onChange={(e) => setEditingStudentEndTime(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        helperText="HH:MM"
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
    setSuccessMessage('')
    setErrorMessage('')
    setOriginalValues(null)
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
              <FormControl fullWidth required>
                <InputLabel>Lớp học</InputLabel>
                <Select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value)

                    // Auto-select teacher when class is selected (only in create mode)
                    if (!editMode) {
                      const selectedClass = courseClasses.find(cls => cls.id === e.target.value)

                      if (selectedClass) {
                        setSelectedTeacherId(selectedClass.teacherId)
                      }
                    }
                  }}
                  label="Lớp học"
                  disabled={editMode}
                >
                  {courseClasses.map((cls) => (
                    <MenuItem key={cls.id} value={cls.id}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <i className="ri-book-line" style={{ color: '#1976d2' }} />
                        <span>{cls.name}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Teacher Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Giáo viên</InputLabel>
                <Select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  label="Giáo viên"
                  disabled={!selectedClassId}
                >
                  {/* Default class teacher */}
                  {selectedClassId && (() => {
                    const selectedClass = courseClasses.find(cls => cls.id === selectedClassId)

                    if (!selectedClass) return null
                    
                    // Check if default teacher is busy at selected time slot
                    const isDefaultTeacherBusy = teacherList?.find(t => t.id === selectedClass.teacherId)?.registeredBusySchedule?.includes(selectedSlot!.slotIndex + 1)
                    
                    return (
                      <MenuItem value={selectedClass.teacherId}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <i className="ri-user-star-line" style={{ color: '#1976d2' }} />
                          <span>{selectedClass.teacher.name}</span>
                          <Chip 
                            size="small" 
                            label="Giáo viên mặc định" 
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
                        </Box>
                      </MenuItem>
                    )
                  })()}
                  
                  {/* Divider */}
                  {selectedClassId && teacherList && teacherList.length > 0 && (
                    <MenuItem disabled>
                      <Divider sx={{ width: '100%' }}>
                        <Chip label="Hoặc chọn giáo viên khác" size="small" />
                      </Divider>
                    </MenuItem>
                  )}
                  
                  {/* All available teachers */}
                  {teacherList?.map((teacher) => {
                    const isDefaultTeacher = selectedClassId && (() => {
                      const selectedClass = courseClasses.find(cls => cls.id === selectedClassId)

                      
return selectedClass?.teacherId === teacher.id
                    })()
                    
                    if (isDefaultTeacher) return null // Skip default teacher as it's already shown above
                    
                    // Check if teacher is busy at selected time slot
                    const isTeacherBusy = teacher.registeredBusySchedule?.includes(selectedSlot!.slotIndex + 1)
                    
                    return (
                      <MenuItem key={teacher.id} value={teacher.id}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <i className="ri-user-line" style={{ color: '#666' }} />
                          <span>{teacher.name}</span>
                          <Chip 
                            size="small" 
                            label={isTeacherBusy ? "Bận" : "Rảnh"} 
                            color={isTeacherBusy ? "error" : "success"} 
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </Box>
                      </MenuItem>
                    )
                  })}
                </Select>
              </FormControl>
            </Grid>

            {/* Start Time */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Thời gian bắt đầu"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
                helperText="Định dạng: HH:MM (ví dụ: 08:00)"
              />
            </Grid>

            {/* End Time */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Thời gian kết thúc"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
                helperText="Định dạng: HH:MM (ví dụ: 17:00)"
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
                helperText={
                  editMode 
                    ? "Ghi chú này sẽ được áp dụng cho tất cả học sinh. Bạn cũng cần chỉnh sửa ghi chú riêng cho từng học sinh bên dưới."
                    : ""
                }
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
              {/* Search Notice */}
              <Box sx={{ 
                mb: 2, 
                p: 1.5, 
                backgroundColor: '#e3f2fd', 
                borderRadius: 1, 
                border: '1px solid #bbdefb' 
              }}>
                <Typography variant="caption" color="primary" display="block" mb={0.5}>
                  <i className="ri-information-line" style={{ marginRight: 4 }} />
                  <strong>Lưu ý:</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  • <span style={{ color: '#2e7d32' }}>🟢 Rảnh:</span> Học sinh có thể tham gia lịch học này
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  • <span style={{ color: '#c62828' }}>🔴 Bận:</span> Học sinh đã có lịch học khác trong khung giờ này
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  • <span style={{ color: '#1976d2' }}>📚 Course:</span> Hiển thị khóa học hiện tại của học sinh
                </Typography>
              </Box>

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
            
            {/* Available Students from Slot - only in create mode or edit mode */}
            {(!editMode || editMode) && availableStudents.length > 0 && (
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
                          onClick={() => editMode ? handleAddStudentFromAvailable(student) : handleAddAvailableStudent(student)}
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
    </Dialog>
  )
}

export default CreateLessonSchedule
