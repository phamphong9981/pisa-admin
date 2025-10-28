'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Snackbar,
  TextField,
  Typography
} from '@mui/material'
import { Alert } from '@mui/material'

// Component Imports
import { Icon } from '@iconify/react'

// Hooks
import { useCreateTeacherAccount, useDeleteTeacherAccount, CreateTeacherAccountDto } from '@/@core/hooks/useTeacher'
import { Skills } from '@/@core/hooks/skills.constant'

import TeachersClassList from '@/views/teachers/TeachersClassList'

// Icon Imports

const TeachersInfoPage = () => {
  const createTeacherMutation = useCreateTeacherAccount()
  const deleteTeacherMutation = useDeleteTeacherAccount()
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [teacherToDelete, setTeacherToDelete] = useState<{ id: string; name: string; userId: string } | null>(null)
  const [teacherForm, setTeacherForm] = useState<CreateTeacherAccountDto>({
    username: '',
    password: '',
    fullname: '',
    email: '',
    phone: '',
    name: '',
    skills: []
  })
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [notification, setNotification] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })

  // Get skills options from enum
  const skillsOptions = Object.values(Skills)

  const handleOpenAddDialog = () => {
    setOpenAddDialog(true)
  }

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false)
    setTeacherForm({
      username: '',
      password: '',
      fullname: '',
      email: '',
      phone: '',
      name: '',
      skills: []
    })
    setSelectedSkills([])
  }

  const handleTeacherFormChange = (field: keyof CreateTeacherAccountDto, value: string | string[]) => {
    setTeacherForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSkillsChange = (skills: string[]) => {
    setSelectedSkills(skills)
    setTeacherForm(prev => ({ ...prev, skills }))
  }

  const handleCreateTeacher = async () => {
    try {
      await createTeacherMutation.mutateAsync(teacherForm)
      setNotification({
        open: true,
        message: 'Thêm giáo viên thành công!',
        severity: 'success'
      })
      handleCloseAddDialog()
    } catch (error) {
      setNotification({
        open: true,
        message: 'Có lỗi xảy ra khi thêm giáo viên',
        severity: 'error'
      })
    }
  }

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }))
  }

  // Delete teacher handlers
  const handleOpenDeleteDialog = (teacherId: string, teacherName: string, userId: string) => {
    setTeacherToDelete({ id: teacherId, name: teacherName, userId })
    setOpenDeleteDialog(true)
  }

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false)
    setTeacherToDelete(null)
  }

  const handleDeleteTeacher = async () => {
    if (!teacherToDelete) return

    try {
      await deleteTeacherMutation.mutateAsync(teacherToDelete.userId)
      setNotification({
        open: true,
        message: `Xóa giáo viên "${teacherToDelete.name}" thành công!`,
        severity: 'success'
      })
      handleCloseDeleteDialog()
    } catch (error) {
      setNotification({
        open: true,
        message: 'Có lỗi xảy ra khi xóa giáo viên',
        severity: 'error'
      })
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 6 }}>
        <Typography variant='h4' sx={{ mb: 2 }}>
          Thông tin giáo viên
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Quản lý thông tin chi tiết và danh sách lớp phụ trách của giáo viên
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Button
              variant='contained'
              startIcon={<Icon icon='ri:add-line' />}
              onClick={handleOpenAddDialog}
            >
              Thêm giáo viên mới
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant='outlined'
              startIcon={<Icon icon='ri:download-line' />}
            >
              Xuất báo cáo
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Teachers Class List Component */}
      <TeachersClassList onDeleteTeacher={handleOpenDeleteDialog} />

      {/* Add Teacher Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth='md' fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Icon icon='ri:user-add-line' style={{ marginRight: '8px' }} />
            Thêm giáo viên mới
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Tên đăng nhập'
                placeholder='Nhập tên đăng nhập'
                value={teacherForm.username}
                onChange={(e) => handleTeacherFormChange('username', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Mật khẩu'
                type='password'
                placeholder='Nhập mật khẩu'
                value={teacherForm.password}
                onChange={(e) => handleTeacherFormChange('password', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Họ và tên'
                placeholder='Nhập họ và tên giáo viên'
                value={teacherForm.fullname}
                onChange={(e) => handleTeacherFormChange('fullname', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Tên hiển thị'
                placeholder='Nhập tên hiển thị'
                value={teacherForm.name}
                onChange={(e) => handleTeacherFormChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Email'
                type='email'
                placeholder='Nhập email'
                value={teacherForm.email}
                onChange={(e) => handleTeacherFormChange('email', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Số điện thoại'
                placeholder='Nhập số điện thoại'
                value={teacherForm.phone}
                onChange={(e) => handleTeacherFormChange('phone', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={skillsOptions}
                value={selectedSkills}
                onChange={(event, newValue) => handleSkillsChange(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Chuyên môn"
                    placeholder="Chọn các kỹ năng chuyên môn..."
                    helperText="Chọn các kỹ năng mà giáo viên có thể giảng dạy"
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
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        border: '1px solid #bbdefb'
                      }}
                    />
                  ))
                }
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Typography variant="body2">
                      {option}
                    </Typography>
                  </Box>
                )}
                noOptionsText="Không có kỹ năng nào"
                clearOnBlur={false}
                selectOnFocus
                handleHomeEndKeys
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog} color='secondary'>
            Hủy
          </Button>
          <Button
            variant='contained'
            onClick={handleCreateTeacher}
            disabled={createTeacherMutation.isPending}
          >
            {createTeacherMutation.isPending ? 'Đang thêm...' : 'Thêm giáo viên'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <i className="ri-delete-bin-line" style={{ marginRight: '8px', color: '#d32f2f' }} />
            Xác nhận xóa giáo viên
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Bạn có chắc chắn muốn xóa giáo viên <strong>"{teacherToDelete?.name}"</strong> không?
            </Typography>
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              <i className="ri-error-warning-line" style={{ marginRight: '8px' }} />
              <strong>Cảnh báo:</strong> Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan đến giáo viên này sẽ bị xóa vĩnh viễn.
            </Typography>
            <Box sx={{
              mt: 2,
              p: 2,
              backgroundColor: '#fff3e0',
              borderRadius: 1,
              border: '1px solid #ffb74d'
            }}>
              <Typography variant="body2" color="text.secondary">
                <i className="ri-information-line" style={{ marginRight: '8px', color: '#ff9800' }} />
                Bao gồm: Thông tin cá nhân, lịch dạy, lớp phụ trách và các dữ liệu liên quan khác.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color='secondary'>
            Hủy
          </Button>
          <Button
            variant='contained'
            color='error'
            onClick={handleDeleteTeacher}
            disabled={deleteTeacherMutation.isPending}
            startIcon={<i className="ri-delete-bin-line" />}
          >
            {deleteTeacherMutation.isPending ? 'Đang xóa...' : 'Xóa giáo viên'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
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
    </Box>
  )
}

export default TeachersInfoPage 
