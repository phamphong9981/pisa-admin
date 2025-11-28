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

import { useUpsertTeacherScheduleNote } from '@/@core/hooks/useTeacher'

interface EditTeacherScheduleNoteDialogProps {
    open: boolean
    onClose: () => void
    teacherId: string
    teacherName: string
    weekId: string
    scheduleTime: number
    dayLabel: string
    time: string
    currentNote?: string
    onSuccess?: () => void
    onError?: () => void
}

const EditTeacherScheduleNoteDialog = ({
    open,
    onClose,
    teacherId,
    teacherName,
    weekId,
    scheduleTime,
    dayLabel,
    time,
    currentNote = '',
    onSuccess,
    onError
}: EditTeacherScheduleNoteDialogProps) => {
    const [note, setNote] = useState(currentNote)
    const { mutate: upsertNote, isPending: isUpserting } = useUpsertTeacherScheduleNote()

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
        if (!teacherId || !weekId || !scheduleTime) return

        upsertNote(
            {
                teacherId,
                weekId,
                scheduleTime,
                note: note.trim() || undefined
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
                    <Typography variant="h6">Chỉnh sửa ghi chú lịch</Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2 }}>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Giáo viên: <strong>{teacherName}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Thời gian: <strong>{dayLabel} - {time}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Khung giờ: <strong>{scheduleTime}</strong>
                        </Typography>
                    </Box>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Ghi chú"
                        placeholder="Nhập ghi chú cho khung giờ này..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        helperText="Ghi chú sẽ hiển thị trong ô lịch này"
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={isUpserting}>
                    Hủy
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={isUpserting}
                    startIcon={
                        isUpserting ? (
                            <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                            <i className="ri-save-line" />
                        )
                    }
                >
                    {isUpserting ? 'Đang lưu...' : 'Lưu'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default EditTeacherScheduleNoteDialog

