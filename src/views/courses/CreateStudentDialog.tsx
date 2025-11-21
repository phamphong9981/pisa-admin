'use client'

import { useState } from 'react'

import {
    Box,
    Button,
    Dialog,
    DialogContent,
    Grid,
    TextField,
    Typography
} from '@mui/material'

import { useCreateUser } from '@/@core/hooks/useStudent'

interface CreateStudentDialogProps {
    open: boolean
    onClose: () => void
    courseId: string
    onSuccess?: () => void
    onError?: () => void
}

const CreateStudentDialog = ({
    open,
    onClose,
    courseId,
    onSuccess,
    onError
}: CreateStudentDialogProps) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        fullname: '',
        email: '',
        phone: ''
    })

    const { mutate: createUser, isPending: isCreatingUser } = useCreateUser(courseId)

    const handleClose = () => {
        // Reset form when closing
        setFormData({
            username: '',
            password: '',
            fullname: '',
            email: '',
            phone: ''
        })
        onClose()
    }

    const handleSubmit = () => {
        const { username, password, fullname, email } = formData

        if (!username || !password || !fullname || !email) {
            // You might want to show an error message here
            // For now, we'll just return without showing a notification
            // The parent component can handle notifications if needed
            return
        }

        createUser(
            {
                username: formData.username,
                password: formData.password,
                fullname: formData.fullname,
                email: formData.email,
                phone: formData.phone,
                courseId: courseId
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

    const handleChange = (field: keyof typeof formData) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }))
    }

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogContent>
                <Box mb={3}>
                    <Typography variant="h6" gutterBottom>
                        Tạo học sinh mới
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Điền thông tin học sinh để thêm vào hệ thống và tự động đăng ký vào khóa học hiện tại.
                    </Typography>
                </Box>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Tên đăng nhập"
                            fullWidth
                            required
                            value={formData.username}
                            onChange={handleChange('username')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Mật khẩu"
                            type="password"
                            fullWidth
                            required
                            value={formData.password}
                            onChange={handleChange('password')}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Họ và tên"
                            fullWidth
                            required
                            value={formData.fullname}
                            onChange={handleChange('fullname')}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Email"
                            type="email"
                            fullWidth
                            required
                            value={formData.email}
                            onChange={handleChange('email')}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Số điện thoại"
                            fullWidth
                            value={formData.phone}
                            onChange={handleChange('phone')}
                        />
                    </Grid>
                </Grid>
                <Box mt={4} display="flex" justifyContent="flex-end" gap={2}>
                    <Button
                        variant="outlined"
                        onClick={handleClose}
                        disabled={isCreatingUser}
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={isCreatingUser || !formData.username || !formData.password || !formData.fullname || !formData.email}
                    >
                        {isCreatingUser ? 'Đang tạo...' : 'Tạo học sinh'}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    )
}

export default CreateStudentDialog

