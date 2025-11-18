'use client'

// React Imports
import { useState, useMemo } from 'react'

// MUI Imports
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import { Alert } from '@mui/material'

// Component Imports
import { Icon } from '@iconify/react'

// Hooks
import { useUserList, useUpdateUser, useCreateUser, UpdateUserDto, CreateUserDto, UserType } from '@/@core/hooks/useStudent'

const UserInfoPage = () => {
  const updateUserMutation = useUpdateUser()
  const createUserMutation = useCreateUser()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<UserType | 'all'>('all')
  const { data: usersData, isLoading: isLoadingUsers, error: usersError } = useUserList(searchTerm)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [userToEdit, setUserToEdit] = useState<{
    id: string
    username: string
    fullname: string
    email: string
    phone: string
    type: string
    ieltsPoint?: string
  } | null>(null)
  const [editUserForm, setEditUserForm] = useState<UpdateUserDto>({
    username: '',
    fullname: '',
    email: '',
    phone: '',
    type: 'user',
    ieltsPoint: ''
  })
  const [createUserForm, setCreateUserForm] = useState<CreateUserDto>({
    username: '',
    password: '',
    fullname: '',
    email: '',
    phone: '',
    type: 'user',
    ieltsPoint: ''
  })
  const [adminModules, setAdminModules] = useState<string[]>([])
  const [createAdminModules, setCreateAdminModules] = useState<string[]>([])
  const [notification, setNotification] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })

  // Filter users based on search term and type
  const filteredUsers = useMemo(() => {
    if (!usersData?.users) return []

    const searchLower = searchTerm.toLowerCase()

    return usersData.users.filter(user => {
      const matchesSearch =
        !searchTerm.trim() ||
        user.profile.fullname?.toLowerCase().includes(searchLower) ||
        user.profile.email?.toLowerCase().includes(searchLower) ||
        user.username?.toLowerCase().includes(searchLower) ||
        user.profile.phone?.toLowerCase().includes(searchLower)

      const matchesType = selectedType === 'all' || user.type === selectedType

      return matchesSearch && matchesType
    })
  }, [usersData, searchTerm, selectedType])

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }))
  }

  // Edit user handlers
  const handleOpenEditDialog = (user: {
    id: string
    username: string
    profile: {
      id: string
      fullname: string
      email: string
      phone: string
      ieltsPoint?: string
    }
    type: string
  }) => {
    const isAdminType = typeof user.type === 'string' && user.type.startsWith('admin')
    const modules = isAdminType ? user.type.split('_').slice(1).filter(Boolean) : []
    setAdminModules(modules)
    setUserToEdit({
      id: user.id,
      username: user.username,
      fullname: user.profile.fullname,
      email: user.profile.email,
      phone: user.profile.phone || '',
      type: user.type,
      ieltsPoint: user.profile.ieltsPoint
    })
    setEditUserForm({
      username: user.username,
      fullname: user.profile.fullname,
      email: user.profile.email,
      phone: user.profile.phone || '',
      type: (isAdminType ? (modules.length ? (`admin_${modules.join('_')}`) : 'admin') : user.type) as UserType,
      ieltsPoint: user.profile.ieltsPoint || ''
    })
    setOpenEditDialog(true)
  }

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false)
    setUserToEdit(null)
    setEditUserForm({
      username: '',
      fullname: '',
      email: '',
      phone: '',
      type: 'user',
      ieltsPoint: ''
    })
    setAdminModules([])
  }

  const handleEditUserFormChange = (field: keyof UpdateUserDto, value: string | UserType) => {
    setEditUserForm(prev => ({ ...prev, [field]: value }))
  }

  const handleUpdateUser = async () => {
    if (!userToEdit) return

    try {
      await updateUserMutation.mutateAsync({
        userId: userToEdit.id,
        updateUserDto: editUserForm
      })
      setNotification({
        open: true,
        message: `Cập nhật thông tin người dùng "${editUserForm.fullname}" thành công!`,
        severity: 'success'
      })
      handleCloseEditDialog()
    } catch (error) {
      setNotification({
        open: true,
        message: 'Có lỗi xảy ra khi cập nhật thông tin người dùng',
        severity: 'error'
      })
    }
  }

  const getUserTypeLabel = (type: string) => {
    if (type === 'user') return 'Học sinh'
    if (type === 'teacher') return 'Giáo viên'
    if (type === 'admin') return 'Admin (Tất cả quyền)'

    if (typeof type === 'string' && type.startsWith('admin')) {
      const parts = type.split('_').slice(1) // remove 'admin'
      if (parts.length === 0) return 'Admin'

      const labelMap: Record<string, string> = {
        schedule: 'Lịch học',
        accounting: 'Kế toán',
        class: 'Lớp học',
        teacher: 'Giáo viên'
      }

      const labels = parts.map(p => labelMap[p] || p)

      return `Admin ${labels.join(', ')}`
    }

    return type
  }

  const getUserTypeColor = (type: string) => {
    if (typeof type === 'string' && type.startsWith('admin')) return 'error'
    if (type === 'teacher') return 'warning'
    return 'primary'
  }

  const ADMIN_MODULES: { key: 'schedule' | 'accounting' | 'class' | 'teacher'; label: string }[] = [
    { key: 'schedule', label: 'Lịch học' },
    { key: 'accounting', label: 'Kế toán' },
    { key: 'class', label: 'Lớp học' },
    { key: 'teacher', label: 'Giáo viên' }
  ]

  const buildAdminType = (modules: string[]) => {
    if (!modules || modules.length === 0) return 'admin'
    return `admin_${modules.join('_')}`
  }

  const toggleAdminModule = (moduleKey: string) => {
    setAdminModules(prev => {
      const exists = prev.includes(moduleKey)
      const next = exists ? prev.filter(m => m !== moduleKey) : [...prev, moduleKey]
      setEditUserForm(p => ({ ...p, type: buildAdminType(next) as UserType }))
      return next
    })
  }

  // Create user handlers
  const handleOpenCreateDialog = () => {
    setCreateUserForm({
      username: '',
      password: '',
      fullname: '',
      email: '',
      phone: '',
      type: 'user',
      ieltsPoint: ''
    })
    setCreateAdminModules([])
    setOpenCreateDialog(true)
  }

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false)
    setCreateUserForm({
      username: '',
      password: '',
      fullname: '',
      email: '',
      phone: '',
      type: 'user',
      ieltsPoint: ''
    })
    setCreateAdminModules([])
  }

  const handleCreateUserFormChange = (field: keyof CreateUserDto, value: string | UserType) => {
    setCreateUserForm(prev => ({ ...prev, [field]: value }))
  }

  const handleCreateUser = async () => {
    try {
      const userData: CreateUserDto = {
        ...createUserForm,
        type: typeof createUserForm.type === 'string' && createUserForm.type.startsWith('admin')
          ? (buildAdminType(createAdminModules) as UserType)
          : createUserForm.type
      }

      await createUserMutation.mutateAsync(userData)
      setNotification({
        open: true,
        message: `Tạo người dùng "${createUserForm.fullname}" thành công!`,
        severity: 'success'
      })
      handleCloseCreateDialog()
    } catch (error) {
      setNotification({
        open: true,
        message: 'Có lỗi xảy ra khi tạo người dùng',
        severity: 'error'
      })
    }
  }

  const toggleCreateAdminModule = (moduleKey: string) => {
    setCreateAdminModules(prev => {
      const exists = prev.includes(moduleKey)
      const next = exists ? prev.filter(m => m !== moduleKey) : [...prev, moduleKey]
      setCreateUserForm(p => ({ ...p, type: buildAdminType(next) as UserType }))
      return next
    })
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 6 }}>
        <Typography variant='h4' sx={{ mb: 2 }}>
          Quản lý người dùng
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Quản lý thông tin chi tiết của tất cả người dùng trong hệ thống
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Button
              variant='contained'
              color='primary'
              startIcon={<Icon icon='ri:add-line' />}
              onClick={handleOpenCreateDialog}
            >
              Tạo mới người dùng
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

      {/* Users Table */}
      <Card>
        <CardContent>
          {/* Search and Filter Box */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  placeholder="Tìm kiếm theo tên, email, username hoặc số điện thoại..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Icon icon='ri:search-line' />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setSearchTerm('')}
                          edge="end"
                        >
                          <Icon icon='ri:close-line' />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Loại người dùng</InputLabel>
                  <Select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as UserType | 'all')}
                    label="Loại người dùng"
                  >
                    <MenuItem value="all">Tất cả</MenuItem>
                    <MenuItem value="user">Học sinh</MenuItem>
                    <MenuItem value="teacher">Giáo viên</MenuItem>
                    <MenuItem value="admin_schedule">Admin Lịch học</MenuItem>
                    <MenuItem value="admin_accounting">Admin Kế toán</MenuItem>
                    <MenuItem value="admin_class">Admin Lớp học</MenuItem>
                    <MenuItem value="admin_teacher">Admin Giáo viên</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          {/* Table */}
          {isLoadingUsers ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <Typography>Đang tải dữ liệu...</Typography>
            </Box>
          ) : usersError ? (
            <Box>
              <Typography variant="h6" color="error">
                Lỗi khi tải dữ liệu: {usersError.message}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Tên người dùng</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Số điện thoại</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Loại tài khoản</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>IELTS Point</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Khóa học</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {user.profile.fullname}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              @{user.username}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {user.profile.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {user.profile.phone || 'Chưa cập nhật'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getUserTypeLabel(user.type)}
                            size="small"
                            color={getUserTypeColor(user.type) as any}
                            sx={{ fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          {user.profile.ieltsPoint ? (
                            <Chip
                              label={user.profile.ieltsPoint}
                              size="small"
                              color="success"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Chưa có
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.course ? (
                            <Chip
                              label={user.course.name}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Chưa đăng ký
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Tooltip title="Chỉnh sửa thông tin">
                              <IconButton
                                color="primary"
                                size="small"
                                onClick={() => handleOpenEditDialog(user)}
                                sx={{
                                  '&:hover': {
                                    backgroundColor: '#e3f2fd'
                                  }
                                }}
                              >
                                <Icon icon='ri:edit-line' />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Box textAlign="center">
                          <Icon icon='ri:search-line' style={{ fontSize: '48px', color: '#999', marginBottom: '16px' }} />
                          <Typography variant="h6" color="text.secondary" mb={1}>
                            Không tìm thấy người dùng
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {searchTerm || selectedType !== 'all'
                              ? `Không tìm thấy người dùng nào phù hợp với bộ lọc`
                              : 'Chưa có người dùng nào'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth='md' fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Icon icon='ri:edit-line' style={{ marginRight: '8px' }} />
            Chỉnh sửa thông tin người dùng
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Tên đăng nhập'
                placeholder='Nhập tên đăng nhập'
                value={editUserForm.username}
                onChange={(e) => handleEditUserFormChange('username', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Loại tài khoản</InputLabel>
                <Select
                  value={editUserForm.type}
                  onChange={(e) => {
                    const value = e.target.value as UserType
                    handleEditUserFormChange('type', value)
                    if (typeof value === 'string' && value.startsWith('admin')) {
                      // keep current modules; if value is exactly 'admin', don't change modules
                      if (value === 'admin') {
                        // leave modules as-is
                      } else {
                        // parse provided value
                        const mods = value.split('_').slice(1).filter(Boolean)
                        setAdminModules(mods)
                      }
                    } else {
                      // non-admin types clear modules
                      setAdminModules([])
                    }
                  }}
                  label="Loại tài khoản"
                >
                  <MenuItem value="user">Học sinh</MenuItem>
                  <MenuItem value="teacher">Giáo viên</MenuItem>
                  <MenuItem value="admin">Admin (tùy chọn quyền)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {typeof editUserForm.type === 'string' && editUserForm.type.startsWith('admin') && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                    Quyền Admin:
                  </Typography>
                  {ADMIN_MODULES.map(m => {
                    const selected = adminModules.includes(m.key)
                    return (
                      <Chip
                        key={m.key}
                        label={m.label}
                        onClick={() => toggleAdminModule(m.key)}
                        variant={selected ? 'filled' : 'outlined'}
                        color={selected ? 'primary' : 'default'}
                        sx={{ fontSize: '0.75rem' }}
                      />
                    )
                  })}
                  <Chip
                    label="Xóa tất cả"
                    onClick={() => {
                      setAdminModules([])
                      setEditUserForm(p => ({ ...p, type: 'admin' }))
                    }}
                    variant="outlined"
                    color="error"
                    sx={{ fontSize: '0.75rem' }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Loại hiện tại sẽ lưu là: <strong>{buildAdminType(adminModules)}</strong>
                </Typography>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Họ và tên'
                placeholder='Nhập họ và tên'
                value={editUserForm.fullname}
                onChange={(e) => handleEditUserFormChange('fullname', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Email'
                type='email'
                placeholder='Nhập email'
                value={editUserForm.email}
                onChange={(e) => handleEditUserFormChange('email', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Số điện thoại'
                placeholder='Nhập số điện thoại'
                value={editUserForm.phone}
                onChange={(e) => handleEditUserFormChange('phone', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='IELTS Point'
                placeholder='Nhập điểm IELTS'
                value={editUserForm.ieltsPoint}
                onChange={(e) => handleEditUserFormChange('ieltsPoint', e.target.value)}
                helperText="Ví dụ: 6.5, 7.0, 8.0"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Mật khẩu mới (để trống nếu không muốn đổi)'
                type='password'
                placeholder='Nhập mật khẩu mới'
                value={editUserForm.password || ''}
                onChange={(e) => handleEditUserFormChange('password', e.target.value)}
                helperText="Chỉ điền nếu muốn thay đổi mật khẩu"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} color='secondary'>
            Hủy
          </Button>
          <Button
            variant='contained'
            onClick={handleUpdateUser}
            disabled={updateUserMutation.isPending}
          >
            {updateUserMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={openCreateDialog} onClose={handleCloseCreateDialog} maxWidth='md' fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Icon icon='ri:user-add-line' style={{ marginRight: '8px' }} />
            Tạo mới người dùng
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Tên đăng nhập'
                placeholder='Nhập tên đăng nhập'
                value={createUserForm.username}
                onChange={(e) => handleCreateUserFormChange('username', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Loại tài khoản</InputLabel>
                <Select
                  value={createUserForm.type}
                  onChange={(e) => {
                    const value = e.target.value as UserType
                    handleCreateUserFormChange('type', value)
                    if (typeof value === 'string' && value.startsWith('admin')) {
                      if (value === 'admin') {
                        // leave modules as-is
                      } else {
                        const mods = value.split('_').slice(1).filter(Boolean)
                        setCreateAdminModules(mods)
                      }
                    } else {
                      setCreateAdminModules([])
                    }
                  }}
                  label="Loại tài khoản"
                >
                  <MenuItem value="user">Học sinh</MenuItem>
                  <MenuItem value="teacher">Giáo viên</MenuItem>
                  <MenuItem value="admin">Admin (tùy chọn quyền)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {typeof createUserForm.type === 'string' && createUserForm.type.startsWith('admin') && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                    Quyền Admin:
                  </Typography>
                  {ADMIN_MODULES.map(m => {
                    const selected = createAdminModules.includes(m.key)
                    return (
                      <Chip
                        key={m.key}
                        label={m.label}
                        onClick={() => toggleCreateAdminModule(m.key)}
                        variant={selected ? 'filled' : 'outlined'}
                        color={selected ? 'primary' : 'default'}
                        sx={{ fontSize: '0.75rem' }}
                      />
                    )
                  })}
                  <Chip
                    label="Xóa tất cả"
                    onClick={() => {
                      setCreateAdminModules([])
                      setCreateUserForm(p => ({ ...p, type: 'admin' }))
                    }}
                    variant="outlined"
                    color="error"
                    sx={{ fontSize: '0.75rem' }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Loại hiện tại sẽ lưu là: <strong>{buildAdminType(createAdminModules)}</strong>
                </Typography>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Họ và tên'
                placeholder='Nhập họ và tên'
                value={createUserForm.fullname}
                onChange={(e) => handleCreateUserFormChange('fullname', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Email'
                type='email'
                placeholder='Nhập email'
                value={createUserForm.email}
                onChange={(e) => handleCreateUserFormChange('email', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Số điện thoại'
                placeholder='Nhập số điện thoại'
                value={createUserForm.phone}
                onChange={(e) => handleCreateUserFormChange('phone', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='IELTS Point'
                placeholder='Nhập điểm IELTS'
                value={createUserForm.ieltsPoint}
                onChange={(e) => handleCreateUserFormChange('ieltsPoint', e.target.value)}
                helperText="Ví dụ: 6.5, 7.0, 8.0"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Mật khẩu'
                type='password'
                placeholder='Nhập mật khẩu'
                value={createUserForm.password}
                onChange={(e) => handleCreateUserFormChange('password', e.target.value)}
                required
                helperText="Mật khẩu bắt buộc khi tạo mới"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog} color='secondary'>
            Hủy
          </Button>
          <Button
            variant='contained'
            onClick={handleCreateUser}
            disabled={createUserMutation.isPending || !createUserForm.username || !createUserForm.password || !createUserForm.fullname || !createUserForm.email}
          >
            {createUserMutation.isPending ? 'Đang tạo...' : 'Tạo mới'}
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

export default UserInfoPage

