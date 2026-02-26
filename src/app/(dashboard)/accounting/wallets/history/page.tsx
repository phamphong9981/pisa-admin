'use client'

export const runtime = 'edge';

import React from 'react';
import {
    Autocomplete,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    CircularProgress,
    Grid,
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
    Typography,
    IconButton,
    MenuItem
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import {
    useGetAuditSummaryList,
    useExportAuditSummary,
    formatDelta,
} from '@/@core/hooks/useStudentWalletAudit';

import {
    WALLET_TYPE_KEYS,
    WALLET_TYPE_LABELS,
} from '@/@core/hooks/useStudentWallet';

import { useStudentList } from '@/@core/hooks/useStudent';
import { RegionId, RegionLabel } from '@/@core/hooks/useCourse';
import useDebounce from '@/@core/hooks/useDebounce';
import StudentHistoryModal from './StudentHistoryModal';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 700,
    backgroundColor: theme.palette.primary.main,
    color: 'white',
    borderBottom: `3px solid ${theme.palette.primary.dark}`,
    fontSize: '0.85rem',
    padding: '12px 16px',
    whiteSpace: 'nowrap',
}));

const DeltaText = styled('span')<{ deltavalue: number }>(({ theme, deltavalue }) => {
    if (deltavalue === 0) return { color: theme.palette.text.secondary };
    return {
        fontWeight: 700,
        color: deltavalue > 0 ? theme.palette.success.main : theme.palette.error.main,
        marginLeft: '4px',
        fontSize: '0.75rem'
    };
});

interface StudentOption {
    profileId: string;
    fullname: string;
    email: string;
    image?: string;
}

const StudentWalletHistoryPage = () => {
    const [page, setPage] = React.useState(1);
    const [limit] = React.useState(20);
    const [studentSearchTerm, setStudentSearchTerm] = React.useState('');
    const [selectedStudent, setSelectedStudent] = React.useState<StudentOption | null>(null);
    const [selectedRegion, setSelectedRegion] = React.useState<RegionId | ''>('');
    const [startDate, setStartDate] = React.useState<Date | null>(null);
    const [endDate, setEndDate] = React.useState<Date | null>(null);

    // Modal state
    const [modalOpen, setModalOpen] = React.useState(false);
    const [modalStudentId, setModalStudentId] = React.useState<string | null>(null);
    const [modalStudentName, setModalStudentName] = React.useState('');

    const debouncedStudentSearch = useDebounce(studentSearchTerm, 300);
    const { data: studentsData, isLoading: isStudentsLoading } = useStudentList(debouncedStudentSearch);

    const studentOptions = React.useMemo<StudentOption[]>(() => {
        if (!studentsData?.users) return [];
        return studentsData.users.map(user => ({
            profileId: user.profile.id,
            fullname: user.profile.fullname,
            email: user.profile.email,
            image: user.profile.image,
        }));
    }, [studentsData]);

    const searchParams = React.useMemo(() => {
        const params: any = { page, limit };
        if (selectedStudent?.profileId) params.studentId = selectedStudent.profileId;
        if (selectedRegion !== '') params.regionId = selectedRegion;
        if (startDate) params.startDate = format(startDate, 'yyyy-MM-dd');
        if (endDate) params.endDate = format(endDate, 'yyyy-MM-dd');
        return params;
    }, [page, limit, selectedStudent, selectedRegion, startDate, endDate]);

    const { data: summaryResponse, isLoading } = useGetAuditSummaryList(searchParams);

    const { mutate: exportSummary, isPending: isExporting } = useExportAuditSummary();

    const handleExport = () => {
        exportSummary({
            studentId: selectedStudent?.profileId,
            regionId: selectedRegion !== '' ? selectedRegion : undefined,
            startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
            endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
        });
    };

    const handleResetFilters = () => {
        setStudentSearchTerm('');
        setSelectedStudent(null);
        setSelectedRegion('');
        setStartDate(null);
        setEndDate(null);
        setPage(1);
    };

    React.useEffect(() => {
        setPage(1);
    }, [selectedStudent, selectedRegion, startDate, endDate]);

    const openHistoryModal = (studentId: string, studentName: string) => {
        setModalStudentId(studentId);
        setModalStudentName(studentName);
        setModalOpen(true);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
            <Grid container spacing={6}>
                <Grid item xs={12}>
                    <Box display='flex' alignItems='center' justifyContent='space-between' flexWrap='wrap' gap={2}>
                        <Box>
                            <Typography variant='h5' fontWeight={700}>
                                Lịch sử thay đổi ví học sinh
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                                Tổng hợp tình hình thay đổi ví của các học sinh
                            </Typography>
                        </Box>
                        <Box display='flex' gap={2}>
                            <Button
                                variant='contained'
                                color='success'
                                startIcon={isExporting ? <CircularProgress size={20} color='inherit' /> : <i className='ri-file-excel-2-line' />}
                                onClick={handleExport}
                                disabled={isExporting}
                            >
                                {isExporting ? 'Đang xuất...' : 'Xuất Excel'}
                            </Button>
                            <Button
                                variant='outlined'
                                startIcon={<i className='ri-arrow-left-line' />}
                                href='/accounting/wallets'
                            >
                                Quay lại
                            </Button>
                        </Box>
                    </Box>
                </Grid>

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
                                            if (reason === 'input' || reason === 'clear') setStudentSearchTerm(newValue);
                                        }}
                                        onChange={(_, value) => { setSelectedStudent(value); setPage(1); }}
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
                                                <Avatar src={option.image} alt={option.fullname} sx={{ width: 32, height: 32 }}>
                                                    {option.fullname?.charAt(0)}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant='body2' fontWeight={600}>{option.fullname}</Typography>
                                                    <Typography variant='caption' color='text.secondary'>{option.email}</Typography>
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
                                        label='Cơ sở'
                                        value={selectedRegion}
                                        onChange={(e) => { setSelectedRegion(e.target.value as RegionId | ''); setPage(1); }}
                                    >
                                        <MenuItem value=''>Tất cả</MenuItem>
                                        {Object.values(RegionId).filter(val => typeof val === 'number').map((value) => (
                                            <MenuItem key={value} value={value as number}>
                                                {RegionLabel[value as RegionId]}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
                                    <DatePicker
                                        label='Từ ngày'
                                        value={startDate}
                                        onChange={(newValue) => setStartDate(newValue)}
                                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
                                    <DatePicker
                                        label='Đến ngày'
                                        value={endDate}
                                        onChange={(newValue) => setEndDate(newValue)}
                                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
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

                <Grid item xs={12}>
                    <Card>
                        <CardHeader
                            title={`Tổng hợp biến động (${summaryResponse?.total || 0} học sinh)`}
                            subheader={`Trang ${page} / ${summaryResponse?.totalPages || 1}`}
                        />
                        <CardContent>
                            {isLoading ? (
                                <Box display='flex' justifyContent='center' p={4}>
                                    <CircularProgress />
                                </Box>
                            ) : !summaryResponse || summaryResponse.data.length === 0 ? (
                                <Box textAlign='center' p={4}>
                                    <i className='ri-file-list-3-line' style={{ fontSize: 64, color: '#ccc' }} />
                                    <Typography color='text.secondary' mt={2}>
                                        Không có dữ liệu trong khoảng thời gian này
                                    </Typography>
                                </Box>
                            ) : (
                                <>
                                    <TableContainer component={Paper} variant='outlined'>
                                        <Table size='small'>
                                            <TableHead>
                                                <TableRow>
                                                    <StyledTableCell>Học sinh</StyledTableCell>
                                                    <StyledTableCell>Khóa học</StyledTableCell>
                                                    {WALLET_TYPE_KEYS.map(key => (
                                                        <StyledTableCell key={key} align='center'>
                                                            {WALLET_TYPE_LABELS[key]}
                                                        </StyledTableCell>
                                                    ))}
                                                    <StyledTableCell align='center'>Hành động</StyledTableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {summaryResponse.data.map((row) => (
                                                    <TableRow key={row.studentId} hover>
                                                        <TableCell>
                                                            <Typography variant='body2' fontWeight={600}>
                                                                {row.studentFullName}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant='caption' color='text.secondary'>
                                                                {row.courseName?.split(',')[0]} {row.courseName && row.courseName.includes(',') && <span title={row.courseName}>...</span>}
                                                            </Typography>
                                                        </TableCell>
                                                        {WALLET_TYPE_KEYS.map(key => {
                                                            const walletObj = row.summary[key as keyof typeof row.summary];
                                                            if (!walletObj) return <TableCell key={key} align='center'>-</TableCell>;
                                                            return (
                                                                <TableCell key={key} align='center'>
                                                                    <Tooltip title={`Đầu kỳ: ${walletObj.tonDau} | Nạp: +${walletObj.tang} | Dùng: -${walletObj.giam}`} arrow>
                                                                        <Box display='inline-flex' alignItems='baseline'>
                                                                            <Typography variant='body2' fontWeight={600}>
                                                                                {walletObj.tonCuoi}
                                                                            </Typography>
                                                                            {/* {walletObj.ton !== 0 && (
                                                                                <DeltaText deltavalue={walletObj.ton}>
                                                                                    ({formatDelta(walletObj)})
                                                                                </DeltaText>
                                                                            )} */}
                                                                        </Box>
                                                                    </Tooltip>
                                                                </TableCell>
                                                            );
                                                        })}
                                                        <TableCell align='center'>
                                                            <Tooltip title='Xem chi tiết lịch sử'>
                                                                <IconButton
                                                                    size='small'
                                                                    color='primary'
                                                                    onClick={() => openHistoryModal(row.studentId, row.studentFullName)}
                                                                >
                                                                    <i className='ri-history-line' />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                    {summaryResponse.totalPages > 1 && (
                                        <Box display='flex' justifyContent='center' mt={3}>
                                            <Pagination
                                                count={summaryResponse.totalPages}
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

                {modalOpen && (
                    <StudentHistoryModal
                        open={modalOpen}
                        onClose={() => setModalOpen(false)}
                        studentId={modalStudentId}
                        studentName={modalStudentName}
                        startDate={startDate}
                        endDate={endDate}
                    />
                )}
            </Grid>
        </LocalizationProvider>
    );
};

export default StudentWalletHistoryPage;
