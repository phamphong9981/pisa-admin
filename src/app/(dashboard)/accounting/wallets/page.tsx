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
    Popover,
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
    getTotalBalance,
    useDeleteWalletById,
    useGetAllProfilesWithWallets,
    useIncreaseWallet,
    WALLET_TYPE_KEYS,
    WALLET_TYPE_LABELS,
    type IncreaseStudentWalletDto,
    type StudentProfileWithWallet,
    type WalletTypeKey,
} from '@/@core/hooks/useStudentWallet';

// Styled components
// Styled components
const StyledTableCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 700,
    backgroundColor: theme.palette.primary.main,
    color: 'white',
    borderBottom: `3px solid ${theme.palette.primary.dark}`,
    fontSize: '0.85rem',
    padding: '12px 16px',
}))

const ReserveTableCell = styled(StyledTableCell)(({ theme }) => ({
    backgroundColor: theme.palette.warning.dark, // Distinct color for header
    borderBottom: `3px solid ${theme.palette.warning.main}`,
}))

const WalletChip = styled(Chip)<{ walletvalue: number; isreserve?: number }>(({ theme, walletvalue, isreserve }) => {
    const isPositive = walletvalue > 0;

    if (isreserve) {
        return {
            fontWeight: 700,
            minWidth: 40,
            backgroundColor: isPositive ? theme.palette.warning.light : theme.palette.grey[100],
            color: isPositive ? theme.palette.warning.dark : theme.palette.grey[500],
            border: isPositive ? `1px solid ${theme.palette.warning.main}` : '1px dashed #ccc',
        }
    }

    return {
        fontWeight: 600,
        minWidth: 40,
        backgroundColor: isPositive ? theme.palette.success.light : theme.palette.grey[200],
        color: isPositive ? theme.palette.success.dark : theme.palette.grey[600],
    }
})

const StudentWalletsPage = () => {
    // State
    const [page, setPage] = React.useState(1)
    const [limit] = React.useState(10)
    const [searchTerm, setSearchTerm] = React.useState('')
    const [filterHasWallet, setFilterHasWallet] = React.useState<'all' | 'with' | 'without'>('all')

    // Dialog states

    const [openCreateDialog, setOpenCreateDialog] = React.useState(false)
    const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false)
    const [selectedProfile, setSelectedProfile] = React.useState<StudentProfileWithWallet | null>(null)

    // Form state
    const [walletForm, setWalletForm] = React.useState<Omit<IncreaseStudentWalletDto, 'studentId'>>({
        v0: 0,
        v1: 0,
        v2: 0,
        v3: 0,
        v4: 0,
        v5: 0,
        v6: 0,
        v7: 0,
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
    const increaseWalletMutation = useIncreaseWallet()
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
    const handleOpenDialog = (profile: StudentProfileWithWallet) => {
        setSelectedProfile(profile)
        // Reset form to 0 for "Increase" action
        setWalletForm({
            v0: 0,
            v1: 0,
            v2: 0,
            v3: 0,
            v4: 0,
            v5: 0,
            v6: 0,
            v7: 0,
        })
        setOpenCreateDialog(true) // Reusing this state for the "Deposit/Create" dialog
    }

    const handleOpenDeleteDialog = (profile: StudentProfileWithWallet) => {
        setSelectedProfile(profile)
        setOpenDeleteDialog(true)
    }

    const handleCloseDialogs = () => {

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
            v7: 0,
        })
    }

    const handleFormChange = (key: WalletTypeKey, value: string) => {
        const numValue = parseInt(value) || 0
        setWalletForm(prev => ({
            ...prev,
            [key]: numValue
        }))
    }

    const handleIncreaseWallet = async () => {
        if (!selectedProfile) return

        try {
            const dto: IncreaseStudentWalletDto = {
                studentId: selectedProfile.id,
                ...walletForm
            }
            await increaseWalletMutation.mutateAsync(dto)
            setNotification({
                open: true,
                message: `Nạp voucher cho học sinh "${selectedProfile.fullname}" thành công!`,
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

    // Popover state
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
    const [selectedDetail, setSelectedDetail] = React.useState<{ title: string, data: any } | null>(null)

    const handleWalletClick = (event: React.MouseEvent<HTMLElement>, title: string, data: any) => {
        setAnchorEl(event.currentTarget)
        setSelectedDetail({ title, data })
    }

    const handleClosePopover = () => {
        setAnchorEl(null)
        setSelectedDetail(null)
    }

    const openPopover = Boolean(anchorEl)

    // Reset page when search or filter changes
    React.useEffect(() => {
        setPage(1)
    }, [searchTerm, filterHasWallet])

    return (
        <Grid container spacing={6}>
            {/* Header */}
            <Grid item xs={12}>
                <Box display='flex' alignItems='center' justifyContent='space-between' flexWrap='wrap' gap={2}>
                    <Box>
                        <Typography variant='h5' fontWeight={700}>
                            Quản lý ví học sinh
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                            Quản lý số dư voucher trong ví của tất cả học sinh
                        </Typography>
                    </Box>
                    <Button
                        variant='contained'
                        color='primary'
                        startIcon={<i className='ri-history-line' />}
                        href='/accounting/wallets/history'
                    >
                        Xem lịch sử
                    </Button>
                </Box>
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
                                                key === 'v7' ? (
                                                    <ReserveTableCell key={key} align='center'>
                                                        <Tooltip title={WALLET_TYPE_LABELS[key]} arrow>
                                                            <span>{key.toUpperCase()} <i className="ri-safe-2-fill" style={{ fontSize: '0.8em' }}></i></span>
                                                        </Tooltip>
                                                    </ReserveTableCell>
                                                ) : (
                                                    <StyledTableCell key={key} align='center'>
                                                        <Tooltip title={WALLET_TYPE_LABELS[key]} arrow>
                                                            <span>{key.toUpperCase()}</span>
                                                        </Tooltip>
                                                    </StyledTableCell>
                                                )
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
                                                    <TableCell
                                                        key={key}
                                                        align='center'
                                                        sx={key === 'v7' ? { bgcolor: 'rgba(237, 108, 2, 0.08)' } : {}}
                                                    >
                                                        <Tooltip title="Nhấn để xem chi tiết">
                                                            <WalletChip
                                                                label={profile.wallet?.[key]?.ton ?? 0}
                                                                size='small'
                                                                walletvalue={profile.wallet?.[key]?.ton ?? 0}
                                                                isreserve={key === 'v7' ? 1 : 0}
                                                                onClick={(e) => handleWalletClick(e, WALLET_TYPE_LABELS[key], profile.wallet?.[key])}
                                                                sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                                                            />
                                                        </Tooltip>
                                                    </TableCell>
                                                ))}
                                                <TableCell align='center'>
                                                    <Chip
                                                        label={getTotalBalance(profile.wallet)}
                                                        color='primary'
                                                        size='small'
                                                        sx={{ fontWeight: 700, minWidth: 50 }}
                                                    />
                                                </TableCell>
                                                <TableCell align='center'>
                                                    <Box display='flex' gap={0.5} justifyContent='center'>
                                                        {profile.wallet ? (
                                                            <>
                                                                <Tooltip title='Nạp thêm voucher'>
                                                                    <IconButton
                                                                        size='small'
                                                                        color='primary'
                                                                        onClick={() => handleOpenDialog(profile)}
                                                                    >
                                                                        <i className='ri-add-circle-line' />
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
                                                            <Tooltip title='Tạo ví (Nạp lần đầu)'>
                                                                <IconButton
                                                                    size='small'
                                                                    color='success'
                                                                    onClick={() => handleOpenDialog(profile)}
                                                                >
                                                                    <i className='ri-wallet-3-line' />
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

            {/* Create/Deposit Wallet Dialog */}
            <Dialog
                open={openCreateDialog}
                onClose={handleCloseDialogs}
                maxWidth='sm'
                fullWidth
            >
                <DialogTitle>
                    <Box display='flex' alignItems='center' gap={1}>
                        <i
                            className='ri-add-circle-line'
                            style={{ color: '#4caf50' }}
                        />
                        <Typography variant='h6'>
                            {selectedProfile?.wallet ? 'Nạp thêm Voucher' : 'Tạo ví mới (Nạp lần đầu)'}
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
                                </Box>
                            </Box>

                            {/* Current Balance (if exists) */}
                            {selectedProfile.wallet && (
                                <Box mb={3}>
                                    <Typography variant='subtitle2' fontWeight={600} mb={1}>
                                        Số dư hiện tại:
                                    </Typography>
                                    <Grid container spacing={1}>
                                        {WALLET_TYPE_KEYS.map(key => (
                                            <Grid item xs={6} sm={4} key={key}>
                                                <Box display='flex' justifyContent='space-between' p={1} bgcolor='grey.50' borderRadius={1}>
                                                    <Typography variant='caption' color='text.secondary'>{key.toUpperCase()}</Typography>
                                                    <Typography variant='caption' fontWeight={700}>
                                                        {selectedProfile.wallet?.[key]?.ton ?? 0}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                            )}

                            <Typography variant='subtitle2' fontWeight={600} mb={2} color='primary'>
                                Nhập số lượng muốn nạp thêm:
                            </Typography>

                            {/* Wallet Form */}
                            <Grid container spacing={2}>
                                {WALLET_TYPE_KEYS.map(key => (
                                    key === 'v7' ? (
                                        <Grid item xs={12} sm={6} key={key}>
                                            <Box sx={{ p: 1, border: '1px dashed #ed6c02', borderRadius: 1, bgcolor: '#fff3e0' }}>
                                                <TextField
                                                    fullWidth
                                                    type='number'
                                                    label={WALLET_TYPE_LABELS[key]}
                                                    value={walletForm[key] ?? 0}
                                                    onChange={(e) => handleFormChange(key, e.target.value)}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position='start'>
                                                                <Typography variant='caption' color='warning.dark' fontWeight={700}>
                                                                    {key.toUpperCase()}
                                                                </Typography>
                                                            </InputAdornment>
                                                        )
                                                    }}
                                                    size='small'
                                                    color='warning'
                                                    focused
                                                />
                                            </Box>
                                        </Grid>
                                    ) : (
                                        <Grid item xs={12} sm={6} key={key}>
                                            <TextField
                                                fullWidth
                                                type='number'
                                                label={WALLET_TYPE_LABELS[key]}
                                                value={walletForm[key] ?? 0}
                                                onChange={(e) => handleFormChange(key, e.target.value)}
                                                InputProps={{
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
                                    )
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
                                    Tổng cộng nạp thêm:
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
                        color='success'
                        onClick={handleIncreaseWallet}
                        disabled={increaseWalletMutation.isPending}
                        startIcon={
                            increaseWalletMutation.isPending && (
                                <CircularProgress size={16} color='inherit' />
                            )
                        }
                    >
                        {selectedProfile?.wallet ? 'Nạp thêm' : 'Tạo và Nạp'}
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
                                            {WALLET_TYPE_LABELS[key]}: <strong>{selectedProfile.wallet?.[key]?.ton ?? 0}</strong>
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

            {/* Wallet Detail Popover */}
            <Popover
                open={openPopover}
                anchorEl={anchorEl}
                onClose={handleClosePopover}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
            >
                <Box p={2} sx={{ minWidth: 250 }}>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom align="center" color="primary">
                        {selectedDetail?.title}
                    </Typography>
                    <Box sx={{ my: 1, borderTop: '1px solid #eee' }} />
                    {selectedDetail?.data ? (
                        <Grid container spacing={2} textAlign="center">
                            <Grid item xs={4}>
                                <Typography variant="caption" display="block" color="success.main" fontWeight={600}>
                                    Nạp
                                </Typography>
                                <Typography variant="body1" fontWeight={700} color="success.dark">
                                    {selectedDetail.data.tang}
                                </Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant="caption" display="block" color="error.main" fontWeight={600}>
                                    Dùng
                                </Typography>
                                <Typography variant="body1" fontWeight={700} color="error.dark">
                                    {selectedDetail.data.giam}
                                </Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant="caption" display="block" color="primary.main" fontWeight={600}>
                                    Tồn
                                </Typography>
                                <Typography variant="body1" fontWeight={700} color="primary.dark">
                                    {selectedDetail.data.ton}
                                </Typography>
                            </Grid>
                        </Grid>
                    ) : (
                        <Typography variant="body2" color="text.secondary" align="center">
                            Chưa có thông tin ví
                        </Typography>
                    )}
                </Box>
            </Popover>
        </Grid>
    )
}

export default StudentWalletsPage

