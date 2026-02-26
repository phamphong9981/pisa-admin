import React from 'react';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Pagination,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import {
    useSearchAuditLogs,
    getOperationLabel,
    getOperationColor,
    formatDelta,
    type StudentWalletAuditRecord,
} from '@/@core/hooks/useStudentWalletAudit';

import {
    WALLET_TYPE_KEYS,
    WALLET_TYPE_LABELS,
} from '@/@core/hooks/useStudentWallet';

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

interface StudentHistoryModalProps {
    open: boolean;
    onClose: () => void;
    studentId: string | null;
    studentName: string;
    startDate?: Date | null;
    endDate?: Date | null;
}

const StudentHistoryModal: React.FC<StudentHistoryModalProps> = ({ open, onClose, studentId, studentName, startDate, endDate }) => {
    const [page, setPage] = React.useState(1);
    const [limit] = React.useState(10);
    const [expandedRows, setExpandedRows] = React.useState<Set<number>>(new Set());

    const searchParams = React.useMemo(() => {
        const params: any = { page, limit };
        if (studentId) params.studentId = studentId;
        if (startDate) params.startDate = format(startDate, 'yyyy-MM-dd');
        if (endDate) params.endDate = format(endDate, 'yyyy-MM-dd');
        return params;
    }, [page, limit, studentId, startDate, endDate]);

    const { data: auditResponse, isLoading } = useSearchAuditLogs(studentId ? searchParams : undefined);

    // Reset state when opened with a new student
    React.useEffect(() => {
        if (open) {
            setPage(1);
            setExpandedRows(new Set());
        }
    }, [open, studentId]);

    const toggleRowExpansion = (id: number) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth='xl' fullWidth>
            <DialogTitle>
                <Box display='flex' alignItems='center' gap={1}>
                    <i className='ri-history-line' style={{ color: '#1976d2' }} />
                    <Typography variant='h6'>
                        Lịch sử thay đổi ví - {studentName}
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
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
                    <Box p={4} pt={2}>
                        <TableContainer component={Paper} variant='outlined'>
                            <Table size='small'>
                                <TableHead>
                                    <TableRow>
                                        <StyledTableCell width={40}></StyledTableCell>
                                        <StyledTableCell>ID</StyledTableCell>
                                        <StyledTableCell>Thời gian</StyledTableCell>
                                        <StyledTableCell>Thao tác</StyledTableCell>
                                        <StyledTableCell>Người thực hiện</StyledTableCell>
                                        <StyledTableCell align='center'>Thay đổi</StyledTableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {auditResponse.data.map((record) => {
                                        const isExpanded = expandedRows.has(record.id);
                                        const hasChanges = WALLET_TYPE_KEYS.some(key => record[`${key}Delta` as keyof StudentWalletAuditRecord]);

                                        return (
                                            <React.Fragment key={record.id}>
                                                <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
                                                    <TableCell>
                                                        {hasChanges && (
                                                            <IconButton size='small' onClick={() => toggleRowExpansion(record.id)}>
                                                                <i className={isExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
                                                            </IconButton>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant='caption' fontFamily='monospace'>#{record.id}</Typography>
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
                                                </TableRow>
                                                {hasChanges && (
                                                    <TableRow>
                                                        <TableCell colSpan={6} sx={{ py: 0, bgcolor: 'grey.50' }}>
                                                            <Collapse in={isExpanded} timeout='auto' unmountOnExit>
                                                                <Box p={2}>
                                                                    <Typography variant='subtitle2' fontWeight={700} mb={1}>Chi tiết thay đổi:</Typography>
                                                                    <Grid container spacing={1}>
                                                                        {WALLET_TYPE_KEYS.map(key => {
                                                                            const delta = record[`${key}Delta` as keyof StudentWalletAuditRecord] as any;
                                                                            if (!delta) return null;
                                                                            return (
                                                                                <Grid item xs={6} sm={4} md={3} key={key}>
                                                                                    <Box p={1.5} bgcolor='white' borderRadius={1} border='1px solid' borderColor='divider'>
                                                                                        <Typography variant='caption' color='text.secondary' fontWeight={600}>
                                                                                            {WALLET_TYPE_LABELS[key]}
                                                                                        </Typography>
                                                                                        <Box display='flex' gap={1} mt={0.5} flexWrap='wrap'>
                                                                                            <Chip label={`Nạp: +${delta.tang}`} size='small' color='success' variant='outlined' sx={{ fontSize: '0.7rem' }} />
                                                                                            <Chip label={`Dùng: -${delta.giam}`} size='small' color='error' variant='outlined' sx={{ fontSize: '0.7rem' }} />
                                                                                            <DeltaChip label={formatDelta(delta)} size='small' deltavalue={delta.ton} sx={{ fontSize: '0.7rem', fontWeight: 700 }} />
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
                        {auditResponse.totalPages > 1 && (
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
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} variant='contained'>Đóng</Button>
            </DialogActions>
        </Dialog>
    );
};

export default StudentHistoryModal;
