'use client'

import React from 'react'

import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    List,
    ListItem,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    Paper,
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
import { styled } from '@mui/material/styles'

import { useProfileSearch, type ProfileSearchResult } from '@/@core/hooks/useStudent'
import { RegionLabel, RegionId } from '@/@core/hooks/useCourse'

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 600,
    backgroundColor: theme.palette.grey[100],
    color: theme.palette.text.primary,
    borderBottom: `2px solid ${theme.palette.divider}`,
    fontSize: '0.8rem',
    padding: '10px 12px',
}))

const InfoRow = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: theme.spacing(1.5),
    '& .label': {
        fontWeight: 600,
        color: theme.palette.text.secondary,
        minWidth: 120,
        fontSize: '0.85rem',
    },
    '& .value': {
        color: theme.palette.text.primary,
        fontSize: '0.85rem',
        wordBreak: 'break-word',
    },
}))

interface ProfileSearchDialogProps {
    open: boolean
    onClose: () => void
    onSelectProfile?: (profile: ProfileSearchResult) => void
    weekId?: string // Optional weekId to fetch busy schedule for specific week
}

const ProfileSearchDialog: React.FC<ProfileSearchDialogProps> = ({
    open,
    onClose,
    onSelectProfile,
    weekId,
}) => {
    const [searchTerm, setSearchTerm] = React.useState('')
    const [selectedProfile, setSelectedProfile] = React.useState<ProfileSearchResult | null>(null)

    // Search profiles
    const { data: profiles, isLoading, error } = useProfileSearch(searchTerm, weekId)

    // Reset state when dialog closes
    React.useEffect(() => {
        if (!open) {
            setSearchTerm('')
            setSelectedProfile(null)
        }
    }, [open])

    const handleSelectProfile = (profile: ProfileSearchResult) => {
        setSelectedProfile(profile)
    }

    const handleConfirmSelect = () => {
        if (selectedProfile && onSelectProfile) {
            onSelectProfile(selectedProfile)
            onClose()
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        })
    }

    const getRegionName = (region: number) => {
        return RegionLabel[region as RegionId] || `Vùng ${region}`
    }

    const getCourseStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'success'
            case 'inactive':
                return 'default'
            default:
                return 'default'
        }
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { minHeight: '70vh' }
            }}
        >
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <i className="ri-search-line" style={{ fontSize: 24, color: '#1976d2' }} />
                    <Typography variant="h6">Tìm kiếm thông tin học sinh</Typography>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                <Grid container spacing={3}>
                    {/* Search & Results Panel */}
                    <Grid item xs={12} md={5}>
                        {/* Search Input */}
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Tìm theo tên, email hoặc tên khóa học..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <i className="ri-search-line" />
                                    </InputAdornment>
                                ),
                                endAdornment: isLoading && (
                                    <InputAdornment position="end">
                                        <CircularProgress size={20} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 2 }}
                        />

                        {/* Error State */}
                        {error && (
                            <Box sx={{ p: 2, textAlign: 'center', color: 'error.main' }}>
                                <i className="ri-error-warning-line" style={{ fontSize: 32 }} />
                                <Typography variant="body2">Lỗi khi tải dữ liệu</Typography>
                            </Box>
                        )}

                        {/* Results List */}
                        <Paper variant="outlined" sx={{ maxHeight: 450, overflow: 'auto' }}>
                            {!searchTerm ? (
                                <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                                    <i className="ri-user-search-line" style={{ fontSize: 48, opacity: 0.5 }} />
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        Nhập từ khóa để tìm kiếm học sinh
                                    </Typography>
                                </Box>
                            ) : isLoading ? (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                    <CircularProgress size={32} />
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        Đang tìm kiếm...
                                    </Typography>
                                </Box>
                            ) : profiles && profiles.length > 0 ? (
                                <List disablePadding>
                                    {profiles.map((profile, index) => (
                                        <React.Fragment key={profile.id}>
                                            {index > 0 && <Divider />}
                                            <ListItemButton
                                                selected={selectedProfile?.id === profile.id}
                                                onClick={() => handleSelectProfile(profile)}
                                            >
                                                <ListItemAvatar>
                                                    <Avatar src={profile.image} alt={profile.fullname}>
                                                        {profile.fullname.charAt(0)}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {profile.fullname}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary" display="block">
                                                                {profile.email}
                                                            </Typography>
                                                            {profile.profileCourses.length > 0 && (
                                                                <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                    {profile.profileCourses.slice(0, 2).map((pc) => (
                                                                        <Chip
                                                                            key={pc.id}
                                                                            label={pc.course.name}
                                                                            size="small"
                                                                            variant="outlined"
                                                                            sx={{ fontSize: '0.65rem', height: 20 }}
                                                                        />
                                                                    ))}
                                                                    {profile.profileCourses.length > 2 && (
                                                                        <Chip
                                                                            label={`+${profile.profileCourses.length - 2}`}
                                                                            size="small"
                                                                            sx={{ fontSize: '0.65rem', height: 20 }}
                                                                        />
                                                                    )}
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    }
                                                />
                                            </ListItemButton>
                                        </React.Fragment>
                                    ))}
                                </List>
                            ) : (
                                <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                                    <i className="ri-user-unfollow-line" style={{ fontSize: 48, opacity: 0.5 }} />
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        Không tìm thấy học sinh nào
                                    </Typography>
                                </Box>
                            )}
                        </Paper>

                        {/* Results count */}
                        {profiles && profiles.length > 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Tìm thấy {profiles.length} học sinh
                            </Typography>
                        )}
                    </Grid>

                    {/* Profile Detail Panel */}
                    <Grid item xs={12} md={7}>
                        {selectedProfile ? (
                            <Card variant="outlined">
                                <CardContent>
                                    {/* Header */}
                                    <Box display="flex" alignItems="center" gap={2} mb={3}>
                                        <Avatar
                                            src={selectedProfile.image}
                                            alt={selectedProfile.fullname}
                                            sx={{ width: 64, height: 64 }}
                                        >
                                            {selectedProfile.fullname.charAt(0)}
                                        </Avatar>
                                        <Box flex={1}>
                                            <Typography variant="h6" fontWeight={600}>
                                                {selectedProfile.fullname}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {selectedProfile.email}
                                            </Typography>
                                        </Box>
                                        <Tooltip title="Copy Profile ID">
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(selectedProfile.id)
                                                }}
                                            >
                                                <i className="ri-file-copy-line" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                    <Divider sx={{ mb: 2 }} />

                                    {/* Basic Info */}
                                    <Typography variant="subtitle2" color="primary" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <i className="ri-information-line" />
                                        Thông tin cơ bản
                                    </Typography>

                                    <Box sx={{ mb: 3 }}>
                                        <InfoRow>
                                            <span className="label">Profile ID:</span>
                                            <span className="value" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                {selectedProfile.id}
                                            </span>
                                        </InfoRow>
                                        <InfoRow>
                                            <span className="label">Điện thoại:</span>
                                            <span className="value">{selectedProfile.phone || 'Chưa cập nhật'}</span>
                                        </InfoRow>
                                        <InfoRow>
                                            <span className="label">Điểm IELTS:</span>
                                            <span className="value">
                                                {selectedProfile.ieltsPoint ? (
                                                    <Chip label={selectedProfile.ieltsPoint} size="small" color="primary" />
                                                ) : (
                                                    'Chưa có'
                                                )}
                                            </span>
                                        </InfoRow>
                                        <InfoRow>
                                            <span className="label">Ngày tạo:</span>
                                            <span className="value">{formatDate(selectedProfile.createdAt)}</span>
                                        </InfoRow>
                                        <InfoRow>
                                            <span className="label">Cập nhật:</span>
                                            <span className="value">{formatDate(selectedProfile.updatedAt)}</span>
                                        </InfoRow>
                                    </Box>

                                    {/* Courses */}
                                    <Typography variant="subtitle2" color="primary" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <i className="ri-book-open-line" />
                                        Khóa học đang tham gia ({selectedProfile.profileCourses.length})
                                    </Typography>

                                    {selectedProfile.profileCourses.length > 0 ? (
                                        <TableContainer component={Paper} variant="outlined">
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <StyledTableCell>Tên khóa học</StyledTableCell>
                                                        <StyledTableCell>Loại</StyledTableCell>
                                                        <StyledTableCell>Vùng</StyledTableCell>
                                                        <StyledTableCell>Trạng thái</StyledTableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {selectedProfile.profileCourses.map((pc) => (
                                                        <TableRow key={pc.id} hover>
                                                            <TableCell>
                                                                <Typography variant="body2" fontWeight={500}>
                                                                    {pc.course.name}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={pc.course.type}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{ fontSize: '0.7rem' }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2">
                                                                    {getRegionName(pc.course.region)}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={pc.course.status === 'active' ? 'Hoạt động' : 'Ngừng'}
                                                                    size="small"
                                                                    color={getCourseStatusColor(pc.course.status) as any}
                                                                    sx={{ fontSize: '0.7rem' }}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    ) : (
                                        <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                                            <Typography variant="body2" color="text.secondary">
                                                <i className="ri-calendar-close-line" style={{ marginRight: 8 }} />
                                                Học sinh chưa đăng ký khóa học nào
                                            </Typography>
                                        </Paper>
                                    )}

                                    {/* Busy Schedule (if any) */}
                                    {selectedProfile.busyScheduleArr && selectedProfile.busyScheduleArr.length > 0 && (
                                        <>
                                            <Typography variant="subtitle2" color="primary" sx={{ mt: 2, mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <i className="ri-calendar-close-line" />
                                                Lịch bận tuần này
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selectedProfile.busyScheduleArr.map((slot) => (
                                                    <Chip
                                                        key={slot}
                                                        label={`Ca ${slot}`}
                                                        size="small"
                                                        variant="outlined"
                                                        color="warning"
                                                        sx={{ fontSize: '0.7rem' }}
                                                    />
                                                ))}
                                            </Box>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <Paper
                                variant="outlined"
                                sx={{
                                    height: '100%',
                                    minHeight: 400,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'text.secondary',
                                }}
                            >
                                <i className="ri-user-line" style={{ fontSize: 64, opacity: 0.3 }} />
                                <Typography variant="body1" sx={{ mt: 2 }}>
                                    Chọn một học sinh để xem thông tin chi tiết
                                </Typography>
                            </Paper>
                        )}
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} color="inherit">
                    Đóng
                </Button>
                {onSelectProfile && (
                    <Button
                        variant="contained"
                        onClick={handleConfirmSelect}
                        disabled={!selectedProfile}
                        startIcon={<i className="ri-check-line" />}
                    >
                        Chọn học sinh này
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    )
}

export default ProfileSearchDialog

