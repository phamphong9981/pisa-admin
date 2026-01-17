'use client'

export const runtime = 'edge';

import React from 'react';

import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    InputAdornment,
    Pagination,
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
} from '@mui/material';
import { styled } from '@mui/material/styles';

import {
    getTotalVouchers,
    useCreateWallet,
    useDeleteWalletById,
    useGetAllProfilesWithWallets,
    useUpdateWalletById,
    WALLET_TYPE_KEYS,
    WALLET_TYPE_LABELS,
    type CreateStudentWalletDto,
    type StudentProfileWithWallet,
    type UpdateStudentWalletDto,
    type WalletTypeKey,
} from '@/@core/hooks/useStudentWallet';

// Styled components
const StyledTableCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 700,
    backgroundColor: theme.palette.primary.main,
    color: 'white',
    borderBottom: `3px solid ${theme.palette.primary.dark}`,
    fontSize: '0.85rem',
    padding: '12px 16px',
}))

const WalletChip = styled(Chip)<{ walletvalue: number }>(({ theme, walletvalue }) => ({
    fontWeight: 600,
    minWidth: 40,
    backgroundColor: walletvalue > 0 ? theme.palette.success.light : theme.palette.grey[200],
    color: walletvalue > 0 ? theme.palette.success.dark : theme.palette.grey[600],
}))

const StudentWalletsPage = () => {
    // State
    const [page, setPage] = React.useState(1)
    const [limit] = React.useState(10)
    const [searchTerm, setSearchTerm] = React.useState('')
    const [filterHasWallet, setFilterHasWallet] = React.useState<'all' | 'with' | 'without'>('all')

    // Dialog states
    const [openEditDialog, setOpenEditDialog] = React.useState(false)
    const [openCreateDialog, setOpenCreateDialog] = React.useState(false)
    const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false)
    const [selectedProfile, setSelectedProfile] = React.useState<StudentProfileWithWallet | null>(null)

    // Form state
    const [walletForm, setWalletForm] = React.useState<UpdateStudentWalletDto>({
        v0: 0,
        v1: 0,
        v2: 0,
        v3: 0,
        v4: 0,
        v5: 0,
        v6: 0,
    })

    // Notification state
    const [notification, setNotification] = React.useState<{
        open: boolean
        message: string
        severity: 'success' | 'error' | 'info'
    }>({
        open: false,
        message: '',
        severity: 'info'
    })

    // API hooks - pass search to backend for server-side filtering
    const { data: profilesResponse, isLoading, refetch } = useGetAllProfilesWithWallets({
        search: searchTerm.trim() || undefined,
        page,
        limit
    })
    const createWalletMutation = useCreateWallet()
    const updateWalletMutation = useUpdateWalletById()
    const deleteWalletMutation = useDeleteWalletById()

    // Filter profiles (client-side filtering only for wallet status since backend doesn't support it)
    const filteredProfiles = React.useMemo(() => {
        if (!profilesResponse?.data) return []

        // Only filter by wallet status (with/without) on client-side
        // Search is handled by backend
        if (filterHasWallet === 'all') {
            return profilesResponse.data
        }

        return profilesResponse.data.filter(profile => {
            if (filterHasWallet === 'with') {
                return profile.wallet !== null
            } else if (filterHasWallet === 'without') {
                return profile.wallet === null
            }
            return true
        })
    }, [profilesResponse, filterHasWallet])

    // Handlers
    const handleOpenCreateDialog = (profile: StudentProfileWithWallet) => {
        setSelectedProfile(profile)
        setWalletForm({
            v0: 0,
            v1: 0,
            v2: 0,
            v3: 0,
            v4: 0,
            v5: 0,
            v6: 0,
        })
        setOpenCreateDialog(true)
    }

    const handleOpenEditDialog = (profile: StudentProfileWithWallet) => {
        setSelectedProfile(profile)
        if (profile.wallet) {
            setWalletForm({
                v0: profile.wallet.v0,
                v1: profile.wallet.v1,
                v2: profile.wallet.v2,
                v3: profile.wallet.v3,
                v4: profile.wallet.v4,
                v5: profile.wallet.v5,
                v6: profile.wallet.v6,
            })
        }
        setOpenEditDialog(true)
    }

    const handleOpenDeleteDialog = (profile: StudentProfileWithWallet) => {
        setSelectedProfile(profile)
        setOpenDeleteDialog(true)
    }

    const handleCloseDialogs = () => {
        setOpenEditDialog(false)
        setOpenCreateDialog(false)
        setOpenDeleteDialog(false)
        setSelectedProfile(null)
        setWalletForm({
            v0: 0,
            v1: 0,
            v2: 0,
            v3: 0,
            v4: 0,
            v5: 0,
            v6: 0,
        })
    }

    const handleFormChange = (key: WalletTypeKey, value: string) => {
        const numValue = parseInt(value) || 0
        setWalletForm(prev => ({
            ...prev,
            [key]: Math.max(0, numValue)
        }))
    }

    const handleCreateWallet = async () => {
        if (!selectedProfile) return

        try {
            const dto: CreateStudentWalletDto = {
                studentId: selectedProfile.id,
                ...walletForm
            }
            await createWalletMutation.mutateAsync(dto)
            setNotification({
                open: true,
                message: `Tạo ví cho học sinh "${selectedProfile.fullname}" thành công!`,
                severity: 'success'
            })
            handleCloseDialogs()
            refetch()
        } catch (error: any) {
            setNotification({
                open: true,
                message: error?.response?.data?.message || 'Có lỗi xảy ra khi tạo ví',
                severity: 'error'
            })
        }
    }

    const handleUpdateWallet = async () => {
        if (!selectedProfile?.wallet) return

        try {
            await updateWalletMutation.mutateAsync({
                id: selectedProfile.wallet.id,
                dto: walletForm
            })
            setNotification({
                open: true,
                message: `Cập nhật ví của "${selectedProfile.fullname}" thành công!`,
                severity: 'success'
            })
            handleCloseDialogs()
            refetch()
        } catch (error: any) {
            setNotification({
                open: true,
                message: error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật ví',
                severity: 'error'
            })
        }
    }

    const handleDeleteWallet = async () => {
        if (!selectedProfile?.wallet) return

        try {
            await deleteWalletMutation.mutateAsync(selectedProfile.wallet.id)
            setNotification({
                open: true,
                message: `Xóa ví của "${selectedProfile.fullname}" thành công!`,
                severity: 'success'
            })
            handleCloseDialogs()
            refetch()
        } catch (error: any) {
            setNotification({
                open: true,
                message: error?.response?.data?.message || 'Có lỗi xảy ra khi xóa ví',
                severity: 'error'
            })
        }
    }

    // Statistics
    const stats = React.useMemo(() => {
        if (!profilesResponse?.data) return { total: 0, withWallet: 0, withoutWallet: 0 }
        const withWallet = profilesResponse.data.filter(p => p.wallet !== null).length
        return {
            total: profilesResponse.total || 0,
            withWallet,
            withoutWallet: (profilesResponse.total || 0) - withWallet
        }
    }, [profilesResponse])

    // Reset page when search or filter changes
    React.useEffect(() => {
        setPage(1)
    }, [searchTerm, filterHasWallet])

    return (
        <Grid container spacing={6}>
            {/* Header */}
            <Grid item xs={12}>
                <Typography variant='h5' fontWeight={700}>
                    Quản lý ví học sinh
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                    Quản lý số dư voucher trong ví của tất cả học sinh
                </Typography>
            </Grid>

            {/* Notification */}
            {notification.open && (
                <Grid item xs={12}>
                    <Alert
                        severity={notification.severity}
                        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
                    >
                        {notification.message}
                    </Alert>
                </Grid>
            )}

            {/* Stats Cards */}
            <Grid item xs={12}>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white'
                        }}>
                            <CardContent>
                                <Typography variant='h3' fontWeight={700}>{stats.total}</Typography>
                                <Typography variant='body2' sx={{ opacity: 0.9 }}>Tổng số học sinh</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{
                            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                            color: 'white'
                        }}>
                            <CardContent>
                                <Typography variant='h3' fontWeight={700}>{stats.withWallet}</Typography>
                                <Typography variant='body2' sx={{ opacity: 0.9 }}>Đã có ví</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card sx={{
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            color: 'white'
                        }}>
                            <CardContent>
                                <Typography variant='h3' fontWeight={700}>{stats.withoutWallet}</Typography>
                                <Typography variant='body2' sx={{ opacity: 0.9 }}>Chưa có ví</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Grid>

            {/* Filters */}
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Box display='flex' gap={2} flexWrap='wrap' alignItems='center'>
                            <TextField
                                size='small'
                                placeholder='Tìm kiếm theo tên, email, hoặc tên khóa học...'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                sx={{ minWidth: 300 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position='start'>
                                            <i className='ri-search-line' />
                                        </InputAdornment>
                                    ),
                                    endAdornment: searchTerm && (
                                        <InputAdornment position='end'>
                                            <IconButton size='small' onClick={() => setSearchTerm('')}>
                                                <i className='ri-close-line' />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />

                            <Box display='flex' gap={1}>
                                <Chip
                                    label='Tất cả'
                                    variant={filterHasWallet === 'all' ? 'filled' : 'outlined'}
                                    color={filterHasWallet === 'all' ? 'primary' : 'default'}
                                    onClick={() => setFilterHasWallet('all')}
                                    sx={{ cursor: 'pointer' }}
                                />
                                <Chip
                                    label='Đã có ví'
                                    variant={filterHasWallet === 'with' ? 'filled' : 'outlined'}
                                    color={filterHasWallet === 'with' ? 'success' : 'default'}
                                    onClick={() => setFilterHasWallet('with')}
                                    sx={{ cursor: 'pointer' }}
                                />
                                <Chip
                                    label='Chưa có ví'
                                    variant={filterHasWallet === 'without' ? 'filled' : 'outlined'}
                                    color={filterHasWallet === 'without' ? 'warning' : 'default'}
                                    onClick={() => setFilterHasWallet('without')}
                                    sx={{ cursor: 'pointer' }}
                                />
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* Wallets Table */}
            <Grid item xs={12}>
                <Card>
                    <CardHeader
                        title={`Danh sách ví học sinh (${profilesResponse?.total || 0})`}
                        subheader={`Hiển thị ${filteredProfiles.length} học sinh trên trang này. Số lượng voucher theo từng loại ví`}
                    />
                    <CardContent>
                        {isLoading ? (
                            <Box display='flex' justifyContent='center' p={4}>
                                <CircularProgress />
                            </Box>
                        ) : filteredProfiles.length === 0 ? (
                            <Box textAlign='center' p={4}>
                                <i className='ri-wallet-3-line' style={{ fontSize: 64, color: '#ccc' }} />
                                <Typography color='text.secondary' mt={2}>
                                    {searchTerm || filterHasWallet !== 'all'
                                        ? 'Không tìm thấy học sinh nào phù hợp'
                                        : 'Chưa có dữ liệu học sinh'
                                    }
                                </Typography>
                            </Box>
                        ) : (
                            <TableContainer component={Paper} variant='outlined'>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <StyledTableCell>Học sinh</StyledTableCell>
                                            <StyledTableCell align='center'>Trạng thái</StyledTableCell>
                                            {WALLET_TYPE_KEYS.map(key => (
                                                <StyledTableCell key={key} align='center'>
                                                    <Tooltip title={WALLET_TYPE_LABELS[key]} arrow>
                                                        <span>{key.toUpperCase()}</span>
                                                    </Tooltip>
                                                </StyledTableCell>
                                            ))}
                                            <StyledTableCell align='center'>Tổng</StyledTableCell>
                                            <StyledTableCell align='center'>Thao tác</StyledTableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredProfiles.map((profile) => (
                                            <TableRow key={profile.id} hover>
                                                <TableCell>
                                                    <Box display='flex' alignItems='center' gap={2}>
                                                        <Avatar
                                                            src={profile.image}
                                                            alt={profile.fullname}
                                                            sx={{ width: 40, height: 40 }}
                                                        >
                                                            {profile.fullname?.charAt(0)}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant='body2' fontWeight={600}>
                                                                {profile.fullname}
                                                            </Typography>
                                                            <Typography variant='caption' color='text.secondary'>
                                                                {profile.email}
                                                            </Typography>
                                                            {profile.courseNames && profile.courseNames.length > 0 && (
                                                                <Typography variant='caption' display='block' color='text.secondary'>
                                                                    {profile.courseNames.join(', ')}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align='center'>
                                                    {profile.wallet ? (
                                                        <Chip
                                                            label='Đã có ví'
                                                            color='success'
                                                            size='small'
                                                            variant='outlined'
                                                        />
                                                    ) : (
                                                        <Chip
                                                            label='Chưa có ví'
                                                            color='warning'
                                                            size='small'
                                                            variant='outlined'
                                                        />
                                                    )}
                                                </TableCell>
                                                {WALLET_TYPE_KEYS.map(key => (
                                                    <TableCell key={key} align='center'>
                                                        <WalletChip
                                                            label={profile.wallet?.[key] ?? 0}
                                                            size='small'
                                                            walletvalue={profile.wallet?.[key] ?? 0}
                                                        />
                                                    </TableCell>
                                                ))}
                                                <TableCell align='center'>
                                                    <Chip
                                                        label={getTotalVouchers(profile.wallet)}
                                                        color='primary'
                                                        size='small'
                                                        sx={{ fontWeight: 700, minWidth: 50 }}
                                                    />
                                                </TableCell>
                                                <TableCell align='center'>
                                                    <Box display='flex' gap={0.5} justifyContent='center'>
                                                        {profile.wallet ? (
                                                            <>
                                                                <Tooltip title='Chỉnh sửa ví'>
                                                                    <IconButton
                                                                        size='small'
                                                                        color='primary'
                                                                        onClick={() => handleOpenEditDialog(profile)}
                                                                    >
                                                                        <i className='ri-edit-line' />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title='Xóa ví'>
                                                                    <IconButton
                                                                        size='small'
                                                                        color='error'
                                                                        onClick={() => handleOpenDeleteDialog(profile)}
                                                                    >
                                                                        <i className='ri-delete-bin-line' />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </>
                                                        ) : (
                                                            <Tooltip title='Tạo ví'>
                                                                <IconButton
                                                                    size='small'
                                                                    color='success'
                                                                    onClick={() => handleOpenCreateDialog(profile)}
                                                                >
                                                                    <i className='ri-add-circle-line' />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        {/* Pagination */}
                        {profilesResponse && profilesResponse.total > limit && (
                            <Box display='flex' justifyContent='center' mt={3}>
                                <Pagination
                                    count={Math.ceil(profilesResponse.total / limit)}
                                    page={page}
                                    onChange={(_, newPage) => setPage(newPage)}
                                    color='primary'
                                />
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Grid>

            {/* Create/Edit Wallet Dialog */}
            <Dialog
                open={openCreateDialog || openEditDialog}
                onClose={handleCloseDialogs}
                maxWidth='sm'
                fullWidth
            >
                <DialogTitle>
                    <Box display='flex' alignItems='center' gap={1}>
                        <i
                            className={openCreateDialog ? 'ri-add-circle-line' : 'ri-edit-line'}
                            style={{ color: openCreateDialog ? '#4caf50' : '#2196f3' }}
                        />
                        <Typography variant='h6'>
                            {openCreateDialog ? 'Tạo ví mới' : 'Chỉnh sửa ví'}
                        </Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedProfile && (
                        <Box>
                            {/* Student Info */}
                            <Box
                                display='flex'
                                alignItems='center'
                                gap={2}
                                mb={3}
                                mt={1}
                                p={2}
                                bgcolor='grey.100'
                                borderRadius={2}
                            >
                                <Avatar
                                    src={selectedProfile.image}
                                    alt={selectedProfile.fullname}
                                    sx={{ width: 56, height: 56 }}
                                >
                                    {selectedProfile.fullname?.charAt(0)}
                                </Avatar>
                                <Box>
                                    <Typography variant='subtitle1' fontWeight={600}>
                                        {selectedProfile.fullname}
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                        {selectedProfile.email}
                                    </Typography>
                                    {selectedProfile.courseNames && selectedProfile.courseNames.length > 0 && (
                                        <Typography variant='body2' color='text.secondary'>
                                            {selectedProfile.courseNames.join(', ')}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>

                            {/* Wallet Form */}
                            <Grid container spacing={2}>
                                {WALLET_TYPE_KEYS.map(key => (
                                    <Grid item xs={12} sm={6} key={key}>
                                        <TextField
                                            fullWidth
                                            type='number'
                                            label={WALLET_TYPE_LABELS[key]}
                                            value={walletForm[key] ?? 0}
                                            onChange={(e) => handleFormChange(key, e.target.value)}
                                            InputProps={{
                                                inputProps: { min: 0 },
                                                startAdornment: (
                                                    <InputAdornment position='start'>
                                                        <Typography variant='caption' color='text.secondary'>
                                                            {key.toUpperCase()}
                                                        </Typography>
                                                    </InputAdornment>
                                                )
                                            }}
                                            size='small'
                                        />
                                    </Grid>
                                ))}
                            </Grid>

                            {/* Total Preview */}
                            <Box
                                mt={3}
                                p={2}
                                bgcolor='primary.light'
                                borderRadius={2}
                                display='flex'
                                justifyContent='space-between'
                                alignItems='center'
                            >
                                <Typography variant='subtitle2' color='primary.dark'>
                                    Tổng số voucher:
                                </Typography>
                                <Typography variant='h5' fontWeight={700} color='primary.dark'>
                                    {Object.values(walletForm).reduce((sum, val) => sum + (val ?? 0), 0)}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleCloseDialogs} color='inherit'>
                        Hủy
                    </Button>
                    <Button
                        variant='contained'
                        color={openCreateDialog ? 'success' : 'primary'}
                        onClick={openCreateDialog ? handleCreateWallet : handleUpdateWallet}
                        disabled={createWalletMutation.isPending || updateWalletMutation.isPending}
                        startIcon={
                            (createWalletMutation.isPending || updateWalletMutation.isPending) && (
                                <CircularProgress size={16} color='inherit' />
                            )
                        }
                    >
                        {openCreateDialog ? 'Tạo ví' : 'Cập nhật'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={handleCloseDialogs} maxWidth='xs' fullWidth>
                <DialogTitle>
                    <Box display='flex' alignItems='center' gap={1}>
                        <i className='ri-error-warning-line' style={{ color: '#f44336' }} />
                        <Typography variant='h6'>Xác nhận xóa ví</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Bạn có chắc chắn muốn xóa ví của học sinh <strong>"{selectedProfile?.fullname}"</strong>?
                    </Typography>
                    <Typography variant='body2' color='error' mt={2}>
                        Hành động này không thể hoàn tác. Tất cả số dư voucher trong ví sẽ bị xóa.
                    </Typography>
                    {selectedProfile?.wallet && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
                            <Typography variant='body2' fontWeight={600} mb={1}>
                                Số dư hiện tại:
                            </Typography>
                            <Grid container spacing={1}>
                                {WALLET_TYPE_KEYS.map(key => (
                                    <Grid item xs={6} key={key}>
                                        <Typography variant='caption'>
                                            {WALLET_TYPE_LABELS[key]}: <strong>{selectedProfile.wallet?.[key] ?? 0}</strong>
                                        </Typography>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleCloseDialogs} color='inherit'>
                        Hủy
                    </Button>
                    <Button
                        variant='contained'
                        color='error'
                        onClick={handleDeleteWallet}
                        disabled={deleteWalletMutation.isPending}
                        startIcon={
                            deleteWalletMutation.isPending && <CircularProgress size={16} color='inherit' />
                        }
                    >
                        Xóa ví
                    </Button>
                </DialogActions>
            </Dialog>
        </Grid>
    )
}

export default StudentWalletsPage

