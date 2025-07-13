'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import {
  Card,
  CardHeader,
  CardContent,
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
import { styled } from '@mui/material/styles'

import { ClassType } from '@/types/classes'
import type { CreateClassDto } from '@/@core/hooks/useClass';
import { useCreateClass } from '@/@core/hooks/useClass'
import { useTeacherList } from '@/@core/hooks/useTeacher'

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3)
}))

interface CreateClassFormProps {
  courseId?: string
}

const CreateClassForm = ({ courseId }: CreateClassFormProps) => {
  const router = useRouter()
  const createClassMutation = useCreateClass()
  const { data: teachers, isLoading: isTeachersLoading, error: teachersError } = useTeacherList()
  
  const [formData, setFormData] = useState<CreateClassDto>({
    name: '',
    total_lesson_per_week: 1,
    class_type: ClassType.FT_LISTENING,
    teacher_id: '',
    course_id: courseId || ''
  })
  
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success')

  const handleChange = (field: keyof CreateClassDto, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await createClassMutation.mutateAsync(formData)
      setSnackbarMessage('Tạo lớp học thành công!')
      setSnackbarSeverity('success')
      setOpenSnackbar(true)
      
      // Reset form
      setFormData({
        name: '',
        total_lesson_per_week: 1,
        class_type: ClassType.FT_LISTENING,
        teacher_id: '',
        course_id: courseId || ''
      })
      
      // Quay lại trang trước sau 2 giây
      setTimeout(() => {
        router.back()
      }, 2000)
      
    } catch (error) {
      setSnackbarMessage('Có lỗi xảy ra khi tạo lớp học!')
      setSnackbarSeverity('error')
      setOpenSnackbar(true)
    }
  }

  const getClassTypeLabel = (classType: ClassType) => {
    switch (classType) {
      case ClassType.FT_LISTENING: return 'FastTrack - Nghe'
      case ClassType.FT_WRITING: return 'FastTrack - Viết'
      case ClassType.FT_READING: return 'FastTrack - Đọc'
      case ClassType.FT_SPEAKING: return 'FastTrack - Nói'
      case ClassType.LISTENING: return 'Nghe'
      case ClassType.WRITING: return 'Viết'
      case ClassType.READING: return 'Đọc'
      case ClassType.SPEAKING: return 'Nói'
      default: return classType
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
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>Tạo lớp học mới</Typography>
          <Typography variant="body2" color="text.secondary">
            Điền thông tin để tạo lớp học mới
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<i className="ri-arrow-left-line" />}
          onClick={() => router.back()}
        >
          Quay lại
        </Button>
      </Box>

      <StyledCard>
        <CardHeader title="Thông tin lớp học" />
        <CardContent>
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
                  label="Tên lớp học"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  placeholder="Nhập tên lớp học"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Số buổi học/tuần"
                  type="number"
                  value={formData.total_lesson_per_week}
                  onChange={(e) => handleChange('total_lesson_per_week', parseInt(e.target.value))}
                  required
                  inputProps={{ min: 1, max: 7 }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Loại lớp học</InputLabel>
                  <Select
                    value={formData.class_type}
                    onChange={(e) => handleChange('class_type', e.target.value as ClassType)}
                    label="Loại lớp học"
                  >
                    {Object.values(ClassType).map((type) => (
                      <MenuItem key={type} value={type}>
                        {getClassTypeLabel(type)}
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
                    variant="outlined"
                    onClick={() => router.back()}
                    disabled={createClassMutation.isPending}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={createClassMutation.isPending}
                    startIcon={createClassMutation.isPending ? <i className="ri-loader-line animate-spin" /> : <i className="ri-save-line" />}
                  >
                    {createClassMutation.isPending ? 'Đang tạo...' : 'Tạo lớp học'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </StyledCard>

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

export default CreateClassForm 
