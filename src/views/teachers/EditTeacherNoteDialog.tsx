'use client'

import { useState, useEffect } from 'react'

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography
} from '@mui/material'

import { useUpdateTeacher } from '@/@core/hooks/useTeacher'

interface EditTeacherNoteDialogProps {
  open: boolean
  onClose: () => void
  teacherId: string
  teacherName: string
  teacherSkills: string[]
  currentNote?: string
  onSuccess?: () => void
  onError?: () => void
}

const EditTeacherNoteDialog = ({
  open,
  onClose,
  teacherId,
  teacherName,
  teacherSkills,
  currentNote = '',
  onSuccess,
  onError
}: EditTeacherNoteDialogProps) => {
  const [note, setNote] = useState(currentNote)
  const { mutate: updateTeacher, isPending: isUpdatingTeacher } = useUpdateTeacher()

  // Update note when currentNote changes
  useEffect(() => {
    if (open) {
      setNote(currentNote || '')
    }
  }, [open, currentNote])

  const handleClose = () => {
    setNote('')
    onClose()
  }

  const handleSave = () => {
    if (!teacherId) return

    updateTeacher(
      {
        teacherId,
        teacher: {
          name: teacherName,
          skills: teacherSkills,
          note: note.trim() || undefined
        }
      },
      {
        onSuccess: () => {
          handleClose()
          onSuccess?.()
        },
        onError: () => {
          onError?.()
        }
      }
    )
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <i className="ri-file-edit-line" style={{ fontSize: 24, color: '#1976d2' }} />
          <Typography variant="h6">Chỉnh sửa ghi chú</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Giáo viên: <strong>{teacherName}</strong>
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Ghi chú"
            placeholder="Nhập ghi chú cho giáo viên..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            sx={{ mt: 2 }}
            helperText="Ghi chú sẽ hiển thị dưới tên giáo viên trong lịch"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isUpdatingTeacher}>
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isUpdatingTeacher}
          startIcon={
            isUpdatingTeacher ? (
              <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <i className="ri-save-line" />
            )
          }
        >
          {isUpdatingTeacher ? 'Đang lưu...' : 'Lưu'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EditTeacherNoteDialog

