'use client'

export const runtime = 'edge';

import React from 'react';

import {
    Alert,
    Autocomplete,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    CircularProgress,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    InputAdornment,
    MenuItem,
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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import {
    useSearchAuditLogs,
    useGetStudentAuditSummary,
    getOperationLabel,
    getOperationColor,
    formatDelta,
    OPERATION_LABELS,
    type AuditOperation,
    type StudentWalletAuditRecord,
    type AuditSearchParams,
} from '@/@core/hooks/useStudentWalletAudit';

import {
    WALLET_TYPE_KEYS,
    WALLET_TYPE_LABELS,
    type WalletTypeKey,
} from '@/@core/hooks/useStudentWallet';

import { useStudentList } from '@/@core/hooks/useStudent';
import useDebounce from '@/@core/hooks/useDebounce';
import WalletSummaryCard from './WalletSummaryCard';

// Styled components
const StyledTableCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 700,
    backgroundColor: theme.palette.primary.main,
    color: 'white',
    borderBottom: `3px solid ${theme.palette.primary.dark}`,
    fontSize: '0.85rem',
    padding: '12px 16px',
}))

const DeltaChip = styled(Chip)<{ deltavalue: number }>(({ theme, deltavalue }) => {
    const isPositive = deltavalue > 0;
    const isZero = deltavalue === 0;

    if (isZero) {
        return {
            fontWeight: 600,
            minWidth: 50,
            backgroundColor: theme.palette.grey[100],
            color: theme.palette.grey[500],
        }
    }

    return {
        fontWeight: 700,
        minWidth: 50,
        backgroundColor: isPositive ? theme.palette.success.light : theme.palette.error.light,
        color: isPositive ? theme.palette.success.dark : theme.palette.error.dark,
    }
})


interface StudentOption {
    profileId: string;
    fullname: string;
    email: string;
    image?: string;
}

const StudentWalletHistoryPage = () => {
    // State
    const [page, setPage] = React.useState(1)
    const [limit] = React.useState(20)
    const [studentSearchTerm, setStudentSearchTerm] = React.useState('')
    const [selectedStudent, setSelectedStudent] = React.useState<StudentOption | null>(null)
    const [selectedOperation, setSelectedOperation] = React.useState<AuditOperation | 'all'>('all')
    const [startDate, setStartDate] = React.useState<Date | null>(null)
    const [endDate, setEndDate] = React.useState<Date | null>(null)

    // Expanded rows
    const [expandedRows, setExpandedRows] = React.useState<Set<number>>(new Set())

    // Detail dialog
    const [detailDialogOpen, setDetailDialogOpen] = React.useState(false)
    const [selectedRecord, setSelectedRecord] = React.useState<StudentWalletAuditRecord | null>(null)

    // Debounce student search
    const debouncedStudentSearch = useDebounce(studentSearchTerm, 300)

    // Fetch students for autocomplete
    const { data: studentsData, isLoading: isStudentsLoading } = useStudentList(debouncedStudentSearch)

    // Student options for autocomplete
    const studentOptions = React.useMemo<StudentOption[]>(() => {
        if (!studentsData?.users) return []
        return studentsData.users.map(user => ({
            profileId: user.profile.id,
            fullname: user.profile.fullname,
            email: user.profile.email,
            image: user.profile.image,
        }))
    }, [studentsData])

    // Build search params
    const searchParams = React.useMemo((): AuditSearchParams => {
        const params: AuditSearchParams = {
            page,
            limit,
        };

        if (selectedStudent?.profileId) {
            params.studentId = selectedStudent.profileId;
        }

        if (selectedOperation !== 'all') {
            params.operation = selectedOperation;
        }

        if (startDate) {
            params.startDate = format(startDate, 'yyyy-MM-dd');
        }

        if (endDate) {
            params.endDate = format(endDate, 'yyyy-MM-dd');
        }

        return params;
    }, [page, limit, selectedStudent, selectedOperation, startDate, endDate])

    // API hooks
    const { data: auditResponse, isLoading } = useSearchAuditLogs(searchParams)

    // Summary API - only fetch when a student is selected
    const { data: summaryData, isLoading: isLoadingSummary } = useGetStudentAuditSummary(
        selectedStudent?.profileId,
        {
            startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
            endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
        }
    )

    // Handlers
    const toggleRowExpansion = (id: number) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        })
    }

    const handleViewDetail = (record: StudentWalletAuditRecord) => {
        setSelectedRecord(record)
        setDetailDialogOpen(true)
    }

    const handleCloseDetailDialog = () => {
        setDetailDialogOpen(false)
        setSelectedRecord(null)
    }

    const handleResetFilters = () => {
        setStudentSearchTerm('')
        setSelectedStudent(null)
        setSelectedOperation('all')
        setStartDate(null)
        setEndDate(null)
        setPage(1)
    }

    // Reset page when filters change
    React.useEffect(() => {
        setPage(1)
    }, [selectedStudent, selectedOperation, startDate, endDate])

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
            <Grid container spacing={6}>
                {/* Header */}
                <Grid item xs={12}>
                    <Box display='flex' alignItems='center' justifyContent='space-between' flexWrap='wrap' gap={2}>
                        <Box>
                            <Typography variant='h5' fontWeight={700}>
                                Lịch sử thay đổi ví học sinh
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                                Xem chi tiết các thao tác nạp, sử dụng và thay đổi ví
                            </Typography>
                        </Box>
                        <Button
                            variant='outlined'
                            startIcon={<i className='ri-arrow-left-line' />}
                            href='/accounting/wallets'
                        >
                            Quay lại
                        </Button>
                    </Box>
                </Grid>

                {/* Filters */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Autocomplete
                                        fullWidth
                                        size='small'
                                        options={studentOptions}
                                        value={selectedStudent}
                                        getOptionLabel={(option) => `${option.fullname} (${option.email})`}
                                        isOptionEqualToValue={(option, value) => option.profileId === value.profileId}
                                        loading={isStudentsLoading}
                                        inputValue={studentSearchTerm}
                                        onInputChange={(_, newValue, reason) => {
                                            if (reason === 'input' || reason === 'clear') {
                                                setStudentSearchTerm(newValue)
                                            }
                                        }}
                                        onChange={(_, value) => {
                                            setSelectedStudent(value)
                                            setPage(1)
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label='Tìm kiếm học sinh'
                                                placeholder='Nhập tên hoặc email...'
                                                InputProps={{
                                                    ...params.InputProps,
                                                    startAdornment: (
                                                        <>
                                                            <InputAdornment position='start'>
                                                                <i className='ri-user-search-line' />
                                                            </InputAdornment>
                                                            {params.InputProps.startAdornment}
                                                        </>
                                                    ),
                                                }}
                                            />
                                        )}
                                        renderOption={(props, option) => (
                                            <Box component='li' {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Avatar
                                                    src={option.image}
                                                    alt={option.fullname}
                                                    sx={{ width: 32, height: 32 }}
                                                >
                                                    {option.fullname?.charAt(0)}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant='body2' fontWeight={600}>
                                                        {option.fullname}
                                                    </Typography>
                                                    <Typography variant='caption' color='text.secondary'>
                                                        {option.email}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        select
                                        size='small'
                                        label='Loại thao tác'
                                        value={selectedOperation}
                                        onChange={(e) => setSelectedOperation(e.target.value as AuditOperation | 'all')}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position='start'>
                                                    <i className='ri-filter-line' />
                                                </InputAdornment>
                                            ),
                                        }}
                                    >
                                        <MenuItem value='all'>Tất cả</MenuItem>
                                        {Object.entries(OPERATION_LABELS).map(([key, label]) => (
                                            <MenuItem key={key} value={key}>
                                                {label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                <Grid item xs={12} sm={6} md={2}>
                                    <DatePicker
                                        label='Từ ngày'
                                        value={startDate}
                                        onChange={(newValue) => setStartDate(newValue)}
                                        slotProps={{
                                            textField: {
                                                size: 'small',
                                                fullWidth: true,
                                            }
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6} md={2}>
                                    <DatePicker
                                        label='Đến ngày'
                                        value={endDate}
                                        onChange={(newValue) => setEndDate(newValue)}
                                        slotProps={{
                                            textField: {
                                                size: 'small',
                                                fullWidth: true,
                                            }
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={12} md={2}>
                                    <Button
                                        fullWidth
                                        variant='outlined'
                                        color='secondary'
                                        onClick={handleResetFilters}
                                        sx={{ height: '40px' }}
                                    >
                                        <i className='ri-refresh-line' style={{ marginRight: 4 }} />
                                        Đặt lại
                                    </Button>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Summary Statistics - Only show when student is selected */}
                {selectedStudent && (
                    <Grid item xs={12}>
                        <WalletSummaryCard
                            studentName={selectedStudent.fullname}
                            summaryData={summaryData}
                            isLoading={isLoadingSummary}
                            startDate={startDate}
                            endDate={endDate}
                        />
                    </Grid>
                )}

                {/* History Table */}
                <Grid item xs={12}>
                    <Card>
                        <CardHeader
                            title={`Lịch sử thay đổi (${auditResponse?.total || 0} bản ghi)`}
                            subheader={`Trang ${page} / ${auditResponse?.totalPages || 1}`}
                        />
                        <CardContent>
                            {isLoading ? (
                                <Box display='flex' justifyContent='center' p={4}>
                                    <CircularProgress />
                                </Box>
                            ) : !auditResponse || auditResponse.data.length === 0 ? (
                                <Box textAlign='center' p={4}>
                                    <i className='ri-history-line' style={{ fontSize: 64, color: '#ccc' }} />
                                    <Typography color='text.secondary' mt={2}>
                                        Không tìm thấy lịch sử thay đổi nào
                                    </Typography>
                                </Box>
                            ) : (
                                <>
                                    <TableContainer component={Paper} variant='outlined'>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <StyledTableCell width={50}></StyledTableCell>
                                                    <StyledTableCell>ID</StyledTableCell>
                                                    <StyledTableCell>Thời gian</StyledTableCell>
                                                    <StyledTableCell>Thao tác</StyledTableCell>
                                                    <StyledTableCell>Học sinh</StyledTableCell>
                                                    <StyledTableCell>Người thực hiện</StyledTableCell>
                                                    <StyledTableCell align='center'>Thay đổi</StyledTableCell>
                                                    <StyledTableCell align='center'>Hành động</StyledTableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {auditResponse.data.map((record) => {
                                                    const isExpanded = expandedRows.has(record.id);
                                                    const hasChanges = WALLET_TYPE_KEYS.some(key => record[`${key}Delta` as keyof StudentWalletAuditRecord]);

                                                    return (
                                                        <React.Fragment key={record.id}>
                                                            <TableRow hover>
                                                                <TableCell>
                                                                    {hasChanges && (
                                                                        <IconButton
                                                                            size='small'
                                                                            onClick={() => toggleRowExpansion(record.id)}
                                                                        >
                                                                            <i className={isExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
                                                                        </IconButton>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant='caption' fontFamily='monospace'>
                                                                        #{record.id}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant='body2' fontWeight={600}>
                                                                        {format(new Date(record.changedAt), 'dd/MM/yyyy', { locale: vi })}
                                                                    </Typography>
                                                                    <Typography variant='caption' color='text.secondary'>
                                                                        {format(new Date(record.changedAt), 'HH:mm:ss', { locale: vi })}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Chip
                                                                        label={getOperationLabel(record.operation)}
                                                                        color={getOperationColor(record.operation)}
                                                                        size='small'
                                                                        variant='outlined'
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Box>
                                                                        <Typography variant='body2' fontWeight={600}>
                                                                            {record.studentFullName || 'N/A'}
                                                                        </Typography>
                                                                        {record.courseName && (
                                                                            <Typography variant='caption' color='text.secondary'>
                                                                                {record.courseName}
                                                                            </Typography>
                                                                        )}
                                                                    </Box>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant='body2'>
                                                                        {record.changedByUsername || record.changedBy || 'System'}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell align='center'>
                                                                    {hasChanges ? (
                                                                        <Chip
                                                                            label={`${WALLET_TYPE_KEYS.filter(key => record[`${key}Delta` as keyof StudentWalletAuditRecord]).length} ví`}
                                                                            size='small'
                                                                            color='info'
                                                                        />
                                                                    ) : (
                                                                        <Typography variant='caption' color='text.secondary'>-</Typography>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell align='center'>
                                                                    <Tooltip title='Xem chi tiết'>
                                                                        <IconButton
                                                                            size='small'
                                                                            color='primary'
                                                                            onClick={() => handleViewDetail(record)}
                                                                        >
                                                                            <i className='ri-eye-line' />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </TableCell>
                                                            </TableRow>

                                                            {/* Expanded row showing delta details */}
                                                            {hasChanges && (
                                                                <TableRow>
                                                                    <TableCell colSpan={8} sx={{ py: 0, bgcolor: 'grey.50' }}>
                                                                        <Collapse in={isExpanded} timeout='auto' unmountOnExit>
                                                                            <Box p={2}>
                                                                                <Typography variant='subtitle2' fontWeight={700} mb={1}>
                                                                                    Chi tiết thay đổi:
                                                                                </Typography>
                                                                                <Grid container spacing={1}>
                                                                                    {WALLET_TYPE_KEYS.map(key => {
                                                                                        const delta = record[`${key}Delta` as keyof StudentWalletAuditRecord] as any;
                                                                                        if (!delta) return null;

                                                                                        return (
                                                                                            <Grid item xs={6} sm={4} md={3} key={key}>
                                                                                                <Box
                                                                                                    p={1.5}
                                                                                                    bgcolor='white'
                                                                                                    borderRadius={1}
                                                                                                    border='1px solid'
                                                                                                    borderColor='divider'
                                                                                                >
                                                                                                    <Typography variant='caption' color='text.secondary' fontWeight={600}>
                                                                                                        {WALLET_TYPE_LABELS[key]}
                                                                                                    </Typography>
                                                                                                    <Box display='flex' gap={1} mt={0.5} flexWrap='wrap'>
                                                                                                        <Chip
                                                                                                            label={`Nạp: +${delta.tang}`}
                                                                                                            size='small'
                                                                                                            color='success'
                                                                                                            variant='outlined'
                                                                                                            sx={{ fontSize: '0.7rem' }}
                                                                                                        />
                                                                                                        <Chip
                                                                                                            label={`Dùng: -${delta.giam}`}
                                                                                                            size='small'
                                                                                                            color='error'
                                                                                                            variant='outlined'
                                                                                                            sx={{ fontSize: '0.7rem' }}
                                                                                                        />
                                                                                                        <DeltaChip
                                                                                                            label={formatDelta(delta)}
                                                                                                            size='small'
                                                                                                            deltavalue={delta.ton}
                                                                                                            sx={{ fontSize: '0.7rem', fontWeight: 700 }}
                                                                                                        />
                                                                                                    </Box>
                                                                                                </Box>
                                                                                            </Grid>
                                                                                        );
                                                                                    })}
                                                                                </Grid>
                                                                            </Box>
                                                                        </Collapse>
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    {/* Pagination */}
                                    {auditResponse && auditResponse.totalPages > 1 && (
                                        <Box display='flex' justifyContent='center' mt={3}>
                                            <Pagination
                                                count={auditResponse.totalPages}
                                                page={page}
                                                onChange={(_, newPage) => setPage(newPage)}
                                                color='primary'
                                                showFirstButton
                                                showLastButton
                                            />
                                        </Box>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Detail Dialog */}
                <Dialog
                    open={detailDialogOpen}
                    onClose={handleCloseDetailDialog}
                    maxWidth='md'
                    fullWidth
                >
                    <DialogTitle>
                        <Box display='flex' alignItems='center' gap={1}>
                            <i className='ri-file-list-3-line' style={{ color: '#1976d2' }} />
                            <Typography variant='h6'>
                                Chi tiết thay đổi #{selectedRecord?.id}
                            </Typography>
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        {selectedRecord && (
                            <Box>
                                {/* Basic Info */}
                                <Grid container spacing={2} mb={3}>
                                    <Grid item xs={6}>
                                        <Typography variant='caption' color='text.secondary'>Thời gian</Typography>
                                        <Typography variant='body2' fontWeight={600}>
                                            {format(new Date(selectedRecord.changedAt), 'dd/MM/yyyy HH:mm:ss', { locale: vi })}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant='caption' color='text.secondary'>Thao tác</Typography>
                                        <Box mt={0.5}>
                                            <Chip
                                                label={getOperationLabel(selectedRecord.operation)}
                                                color={getOperationColor(selectedRecord.operation)}
                                                size='small'
                                            />
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant='caption' color='text.secondary'>Học sinh</Typography>
                                        <Typography variant='body2' fontWeight={600}>
                                            {selectedRecord.studentFullName || 'N/A'}
                                        </Typography>
                                        {selectedRecord.courseName && (
                                            <Typography variant='caption' color='text.secondary' display='block'>
                                                Khóa học: {selectedRecord.courseName}
                                            </Typography>
                                        )}
                                        <Typography variant='caption' fontFamily='monospace' color='text.secondary' display='block' sx={{ fontSize: '0.7rem', mt: 0.5 }}>
                                            ID: {selectedRecord.studentId}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant='caption' color='text.secondary'>Người thực hiện</Typography>
                                        <Typography variant='body2' fontWeight={600}>
                                            {selectedRecord.changedByUsername || selectedRecord.changedBy || 'System'}
                                        </Typography>
                                    </Grid>
                                </Grid>

                                {/* Delta Changes */}
                                {WALLET_TYPE_KEYS.some(key => selectedRecord[`${key}Delta` as keyof StudentWalletAuditRecord]) && (
                                    <Box mb={3}>
                                        <Typography variant='subtitle2' fontWeight={700} mb={2}>
                                            Thay đổi số dư:
                                        </Typography>
                                        <Grid container spacing={2}>
                                            {WALLET_TYPE_KEYS.map(key => {
                                                const delta = selectedRecord[`${key}Delta` as keyof StudentWalletAuditRecord] as any;
                                                if (!delta) return null;

                                                return (
                                                    <Grid item xs={12} sm={6} key={key}>
                                                        <Box
                                                            p={2}
                                                            bgcolor='grey.50'
                                                            borderRadius={1}
                                                            border='1px solid'
                                                            borderColor='divider'
                                                        >
                                                            <Typography variant='body2' fontWeight={700} mb={1}>
                                                                {WALLET_TYPE_LABELS[key]}
                                                            </Typography>
                                                            <Grid container spacing={1}>
                                                                <Grid item xs={4}>
                                                                    <Typography variant='caption' color='success.main'>Nạp</Typography>
                                                                    <Typography variant='body1' fontWeight={700} color='success.dark'>
                                                                        +{delta.tang}
                                                                    </Typography>
                                                                </Grid>
                                                                <Grid item xs={4}>
                                                                    <Typography variant='caption' color='error.main'>Dùng</Typography>
                                                                    <Typography variant='body1' fontWeight={700} color='error.dark'>
                                                                        -{delta.giam}
                                                                    </Typography>
                                                                </Grid>
                                                                <Grid item xs={4}>
                                                                    <Typography variant='caption' color='primary.main'>Tồn</Typography>
                                                                    <Typography variant='body1' fontWeight={700} color='primary.dark'>
                                                                        {formatDelta(delta)}
                                                                    </Typography>
                                                                </Grid>
                                                            </Grid>
                                                        </Box>
                                                    </Grid>
                                                );
                                            })}
                                        </Grid>
                                    </Box>
                                )}

                                {/* Old/New Values */}
                                {(selectedRecord.oldValues || selectedRecord.newValues) && (
                                    <Box>
                                        <Typography variant='subtitle2' fontWeight={700} mb={2}>
                                            Snapshot dữ liệu:
                                        </Typography>
                                        <Grid container spacing={2}>
                                            {selectedRecord.oldValues && (
                                                <Grid item xs={12} md={6}>
                                                    <Typography variant='caption' color='text.secondary' fontWeight={600}>
                                                        Trước khi thay đổi:
                                                    </Typography>
                                                    <Box
                                                        mt={1}
                                                        p={2}
                                                        bgcolor='grey.50'
                                                        borderRadius={1}
                                                        sx={{ maxHeight: 300, overflow: 'auto' }}
                                                    >
                                                        <pre style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                                                            {JSON.stringify(selectedRecord.oldValues, null, 2)}
                                                        </pre>
                                                    </Box>
                                                </Grid>
                                            )}
                                            {selectedRecord.newValues && (
                                                <Grid item xs={12} md={selectedRecord.oldValues ? 6 : 12}>
                                                    <Typography variant='caption' color='text.secondary' fontWeight={600}>
                                                        Sau khi thay đổi:
                                                    </Typography>
                                                    <Box
                                                        mt={1}
                                                        p={2}
                                                        bgcolor='grey.50'
                                                        borderRadius={1}
                                                        sx={{ maxHeight: 300, overflow: 'auto' }}
                                                    >
                                                        <pre style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                                                            {JSON.stringify(selectedRecord.newValues, null, 2)}
                                                        </pre>
                                                    </Box>
                                                </Grid>
                                            )}
                                        </Grid>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={handleCloseDetailDialog} color='primary' variant='contained'>
                            Đóng
                        </Button>
                    </DialogActions>
                </Dialog>
            </Grid>
        </LocalizationProvider>
    )
}

export default StudentWalletHistoryPage

