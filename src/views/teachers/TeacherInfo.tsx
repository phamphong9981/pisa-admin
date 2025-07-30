'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    TextField,
    Typography
} from '@mui/material'

// Component Imports
import { Icon } from '@iconify/react'

import TeachersClassList from '@/views/teachers/TeachersClassList'

// Icon Imports

const TeachersInfoPage = () => {
  const [openAddDialog, setOpenAddDialog] = useState(false)

  const handleOpenAddDialog = () => {
    setOpenAddDialog(true)
  }

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false)
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
      <TeachersClassList />

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
                label='Họ và tên'
                placeholder='Nhập họ và tên giáo viên'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Email'
                type='email'
                placeholder='Nhập email'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Số điện thoại'
                placeholder='Nhập số điện thoại'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Chuyên môn'
                placeholder='Ví dụ: Toán, Văn, Anh...'
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Mô tả'
                multiline
                rows={3}
                placeholder='Mô tả thêm về giáo viên'
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog} color='secondary'>
            Hủy
          </Button>
          <Button variant='contained' onClick={handleCloseAddDialog}>
            Thêm giáo viên
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TeachersInfoPage 
