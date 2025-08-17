'use client'

// React Imports
import { useEffect, useState } from 'react'

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
import { useCreateLessonSchedule } from '@/@core/hooks/useSchedule'
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
}

const CreateLessonSchedule = ({
  open,
  onClose,
  selectedSlot,
  availableStudents,
  courseClasses,
  weekId = "08a60c9a-b3f8-42f8-8ff8-c7015d4ef3e7"
}: CreateLessonScheduleProps) => {
  const createLessonScheduleMutation = useCreateLessonSchedule()

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
  }

  // Form states
  const [selectedStudents, setSelectedStudents] = useState<SelectedStudent[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [lessonNumber, setLessonNumber] = useState(1)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

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

  // Reset form when modal opens/closes or slot changes
  useEffect(() => {
    if (open && selectedSlot) {
      setSelectedStudents([])
      setSelectedClassId('')
      setSelectedTeacherId('')
      setLessonNumber(1)
      
      // Parse time from slot
      const timeParts = selectedSlot.time.split('-')

      if (timeParts.length === 2) {
        setStartTime(timeParts[0])
        setEndTime(timeParts[1])
      }
    }
  }, [open, selectedSlot])

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

    if (!startTime || !endTime) {
      setErrorMessage('Vui lòng nhập thời gian bắt đầu và kết thúc')
      
return
    }

    try {
      await createLessonScheduleMutation.mutateAsync({
        weekId,
        scheduleTime: selectedSlot!.slotIndex, // Convert to 1-based index
        startTime,
        endTime,
        classId: selectedClassId,
        lesson: lessonNumber,
        teacherId: selectedTeacherId,
        profileIds: selectedStudents.map(s => s.profile_id)
      })

      setSuccessMessage('Tạo lịch học thành công!')
      setErrorMessage('')

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
        setSuccessMessage('')
      }, 2000)

    } catch (error) {
      setErrorMessage('Có lỗi xảy ra khi tạo lịch học')
      setSuccessMessage('')
    }
  }

  // Handle remove student from selected list
  const handleRemoveStudent = (studentId: string) => {
    setSelectedStudents(prev => prev.filter(s => s.profile_id !== studentId && s.id !== studentId))
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
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
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
            <Chip
              size="small"
              label="Xóa"
              color="error"
              variant="outlined"
              onDelete={() => handleRemoveStudent(student.profile_id)}
              sx={{ fontSize: '0.65rem' }}
            />
          </Box>
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
    setStudentSearch('')
    setShowSearchResults(false)
    setSuccessMessage('')
    setErrorMessage('')
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
          <i className="ri-calendar-schedule-line" style={{ fontSize: '24px', color: '#1976d2' }} />
          <Typography variant="h6" fontWeight={600}>
            Tạo lịch học mới
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
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

                    // Auto-select teacher when class is selected
                    const selectedClass = courseClasses.find(cls => cls.id === e.target.value)

                    if (selectedClass) {
                      setSelectedTeacherId(selectedClass.teacherId)
                    }
                  }}
                  label="Lớp học"
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
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Student Selection */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Chọn học sinh ({selectedStudents.length} đã chọn)
            </Typography>

            {/* Search for additional students */}
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
            
            {/* Available Students from Slot */}
            {availableStudents.length > 0 && (
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

                          {/* Selected Students Summary */}
              {selectedStudents.length > 0 && (
                <Box sx={{ 
                  p: 2, 
                  backgroundColor: '#e8f5e8', 
                  borderRadius: 1, 
                  border: '1px solid #c8e6c9' 
                }}>
                  <Typography variant="subtitle2" fontWeight={600} color="success.main" mb={1}>
                    Học sinh đã chọn ({selectedStudents.length}):
                  </Typography>
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
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            createLessonScheduleMutation.isPending || 
            selectedStudents.length === 0 || 
            !selectedTeacherId ||
            !startTime ||
            !endTime
          }
          startIcon={
            createLessonScheduleMutation.isPending ? 
              <CircularProgress size={16} /> : 
              <i className="ri-save-line" />
          }
        >
          {createLessonScheduleMutation.isPending ? 'Đang tạo...' : 'Tạo lịch học'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateLessonSchedule
