'use client'

import { useState } from 'react'

import {
  Grid,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar
} from '@mui/material'

import { CourseType , useCreateCourse } from '@/@core/hooks/useCourse'
import { useTeacherList } from '@/@core/hooks/useTeacher'

interface CreateCourseFormProps {
  onSuccess?: () => void
}

const CreateCourseForm = ({ onSuccess }: CreateCourseFormProps) => {
  const createCourseMutation = useCreateCourse()
  const { data: teachers, isLoading: isTeachersLoading, error: teachersError } = useTeacherList()
  
  const [formData, setFormData] = useState({
    name: '',
    type: CourseType.FOUNDATION,
    teacher_id: ''
  })
  
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success')

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'type' ? value as CourseType : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await createCourseMutation.mutateAsync(formData)
      setSnackbarMessage('Tạo khóa học thành công!')
      setSnackbarSeverity('success')
      setOpenSnackbar(true)
      
      // Reset form
      setFormData({
        name: '',
        type: CourseType.FOUNDATION,
        teacher_id: ''
      })
      
      // Call onSuccess callback
      onSuccess?.()
      
    } catch (error) {
      setSnackbarMessage('Có lỗi xảy ra khi tạo khóa học!')
      setSnackbarSeverity('error')
      setOpenSnackbar(true)
    }
  }

  const getCourseTypeLabel = (courseType: CourseType) => {
    switch (courseType) {
      case CourseType.FOUNDATION: return 'Foundation - Cơ bản'
      case CourseType.INTERMEDIATE: return 'Intermediate - Trung cấp'
      case CourseType.ADVANCED: return 'Advanced - Nâng cao'
      case CourseType.IELTS: return 'IELTS'
      case CourseType.TOEFL: return 'TOEFL'
      case CourseType.TOEIC: return 'TOEIC'
      default: return courseType
    }
  }

  if (isTeachersLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Đang tải danh sách giáo viên...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Tạo khóa học mới</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Điền thông tin để tạo khóa học mới
      </Typography>

      {teachersError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Không thể tải danh sách giáo viên. Vui lòng thử lại sau.
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Tên khóa học"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              placeholder="Nhập tên khóa học"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Loại khóa học</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                label="Loại khóa học"
              >
                {Object.values(CourseType).map((type) => (
                  <MenuItem key={type} value={type}>
                    {getCourseTypeLabel(type)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Giáo viên</InputLabel>
              <Select
                value={formData.teacher_id}
                onChange={(e) => handleChange('teacher_id', e.target.value)}
                label="Giáo viên"
                disabled={!teachers || teachers.length === 0}
              >
                {teachers && teachers.length > 0 ? (
                  teachers.map((teacher) => (
                    <MenuItem key={teacher.id} value={teacher.id}>
                      <Box display="flex" flexDirection="column" alignItems="flex-start">
                        <Typography variant="body2" fontWeight={500}>
                          {teacher.name}
                        </Typography>
                        {teacher.skills.length > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            Kỹ năng: {teacher.skills.join(', ')}
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>
                    {teachersError ? 'Lỗi tải danh sách giáo viên' : 'Không có giáo viên nào'}
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button
                type="submit"
                variant="contained"
                disabled={createCourseMutation.isPending}
                startIcon={createCourseMutation.isPending ? <i className="ri-loader-line animate-spin" /> : <i className="ri-save-line" />}
              >
                {createCourseMutation.isPending ? 'Đang tạo...' : 'Tạo khóa học'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setOpenSnackbar(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default CreateCourseForm 
