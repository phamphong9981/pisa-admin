'use client'

import { useState, useMemo } from 'react'
import {
    CardContent,
    Typography,
    Grid,
    TableContainer,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Chip,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Box,
    Autocomplete,
    TextField,
    InputAdornment,
    Checkbox,
    Tooltip
} from '@mui/material'
import { styled } from '@mui/material/styles'
import { format } from 'date-fns'

import { useGetScheduleInfoByField, useUpdateScheduleInfo, formatScheduleTimeWithDate } from '@/@core/hooks/useSchedule'
import { useGetWeeks } from '@/@core/hooks/useWeek'
import { RegionId, RegionLabel } from '@/@core/hooks/useCourse'

// Styled Components
const StyledTableCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 600,
    backgroundColor: theme.palette.grey[50],
    textTransform: 'uppercase',
    fontSize: '0.75rem',
    letterSpacing: '0.5px'
}))

const MarkedScheduleTab = () => {
    // Hooks
    const { data: weeks } = useGetWeeks()

    const [selectedWeekId, setSelectedWeekId] = useState<string>('')
    const [selectedRegion, setSelectedRegion] = useState<RegionId | null>(null)
    const [selectedIsMasked, setSelectedIsMasked] = useState<string>('')
    const [selectedTeacherNote, setSelectedTeacherNote] = useState<string>('')

    const updateScheduleInfoMutation = useUpdateScheduleInfo()

    const searchParams = useMemo(() => {
        return {
            weekId: selectedWeekId || undefined,
            region: selectedRegion || undefined,
            isMasked: selectedIsMasked === 'true' ? true : selectedIsMasked === 'false' ? false : undefined,
            teacherNote: selectedTeacherNote === 'true' ? true : selectedTeacherNote === 'false' ? false : undefined
        }
    }, [selectedWeekId, selectedRegion, selectedIsMasked, selectedTeacherNote])

    // Enable query if at least one filter is selected to avoid huge initial payload
    const { data: scheduleInfos, isLoading, isFetching, refetch } = useGetScheduleInfoByField(searchParams)

    const handleMaskChange = async (info: any, checked: boolean) => {
        try {
            await updateScheduleInfoMutation.mutateAsync({
                classId: info.classId,
                weekId: info.weekId,
                lesson: info.lesson,
                scheduleTime: info.scheduleTime,
                isMasked: checked
            })
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái kiểm tra:', error)
        }
    }

    const currentWeekInfo = useMemo(() => {
        return weeks?.find(w => w.id === selectedWeekId)
    }, [weeks, selectedWeekId])

    return (
        <CardContent>
            {/* Filters */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                        <InputLabel>Tuần học</InputLabel>
                        <Select
                            value={selectedWeekId}
                            label="Tuần học"
                            onChange={(e) => setSelectedWeekId(e.target.value)}
                        >
                            <MenuItem value="">-- Chọn tuần học --</MenuItem>
                            {weeks?.map((week) => {
                                const weekStartDate = new Date(week.startDate)
                                const weekEndDate = new Date(weekStartDate)
                                weekEndDate.setDate(weekEndDate.getDate() + 6)

                                return (
                                    <MenuItem key={week.id} value={week.id}>
                                        {format(weekStartDate, 'dd/MM/yyyy')} - {format(weekEndDate, 'dd/MM/yyyy')}
                                    </MenuItem>
                                )
                            })}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Autocomplete
                        fullWidth
                        options={Object.values(RegionId).filter((v): v is RegionId => typeof v === 'number')}
                        value={selectedRegion}
                        getOptionLabel={(option) => RegionLabel[option]}
                        onChange={(_, value) => setSelectedRegion(value)}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Cơ sở"
                                placeholder="Chọn cơ sở..."
                                InputProps={{
                                    ...params.InputProps,
                                    startAdornment: (
                                        <>
                                            <InputAdornment position="start">
                                                <i className="ri-map-pin-line" />
                                            </InputAdornment>
                                            {params.InputProps.startAdornment}
                                        </>
                                    )
                                }}
                            />
                        )}
                        renderOption={(props, option) => (
                            <Box component="li" {...props} key={option}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <i className="ri-map-pin-fill" style={{ color: '#1976d2' }} />
                                    <Typography variant="body2">{RegionLabel[option]}</Typography>
                                </Box>
                            </Box>
                        )}
                        noOptionsText="Không có cơ sở nào"
                    />
                </Grid>

                <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                        <InputLabel>Đánh dấu</InputLabel>
                        <Select
                            value={selectedIsMasked}
                            label="Đánh dấu"
                            onChange={(e) => setSelectedIsMasked(e.target.value)}
                        >
                            <MenuItem value="">Tất cả</MenuItem>
                            <MenuItem value="true">Đã đánh dấu</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            {/* Reset Button & Refresh */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                    variant="outlined"
                    onClick={() => {
                        setSelectedWeekId('')
                        setSelectedRegion(null)
                        setSelectedIsMasked('')
                        setSelectedTeacherNote('')
                    }}
                    startIcon={<i className="ri-filter-off-line" />}
                    size="small"
                >
                    Đặt lại bộ lọc
                </Button>
                <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<i className="ri-refresh-line" />}
                    onClick={() => refetch()}
                    disabled={isFetching}
                    size="small"
                >
                    Tải lại danh sách
                </Button>
            </Box>

            {/* Table */}
            {isLoading || isFetching ? (
                <Box display="flex" justifyContent="center" py={5}>
                    <CircularProgress />
                </Box>
            ) : !selectedWeekId && !selectedIsMasked && !selectedTeacherNote ? (
                <Box textAlign="center" py={5} sx={{ color: 'text.secondary' }}>
                    <i className="ri-filter-3-line" style={{ fontSize: 48, marginBottom: 8, display: 'block', opacity: 0.3 }} />
                    <Typography>
                        Vui lòng chọn bộ lọc (tuần học, trạng thái) để hiển thị lịch kiểm tra.
                    </Typography>
                </Box>
            ) : !scheduleInfos || scheduleInfos.length === 0 ? (
                <Box textAlign="center" py={5} sx={{ color: 'text.secondary' }}>
                    <i className="ri-file-list-3-line" style={{ fontSize: 48, marginBottom: 8, display: 'block', opacity: 0.3 }} />
                    <Typography>
                        Không tìm thấy ca kiểm tra nào
                    </Typography>
                </Box>
            ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', minHeight: 400 }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <StyledTableCell>Lớp / Khóa học</StyledTableCell>
                                <StyledTableCell>Bài học</StyledTableCell>
                                <StyledTableCell>Thời gian</StyledTableCell>
                                <StyledTableCell>Giáo viên</StyledTableCell>
                                <StyledTableCell>Ghi chú (Admin)</StyledTableCell>
                                <StyledTableCell align="center">Nhận xét (G.Viên)</StyledTableCell>
                                <StyledTableCell align="center">Đã Đ.Dấu / K.Tra</StyledTableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {scheduleInfos.map((info) => (
                                <TableRow key={info.id} hover>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600} color="primary">
                                                {info.className || 'N/A'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                {info.courseName || 'N/A'}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={`Bài ${info.lesson}`} size="small" color="secondary" variant="outlined" />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                            {formatScheduleTimeWithDate(info.scheduleTime, currentWeekInfo?.startDate, info.startTime, info.endTime)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {info.teacherName || '—'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {info.note || '—'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                            {info.teacherNote ? (
                                                <Tooltip title={info.teacherNote}>
                                                    <i className="ri-message-3-fill" style={{ color: '#2e7d32', fontSize: '20px' }} />
                                                </Tooltip>
                                            ) : (
                                                <i className="ri-message-3-line" style={{ color: '#bdbdbd', fontSize: '20px' }} />
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Tooltip title={info.isMasked ? "Bỏ đánh dấu ca" : "Đánh dấu ca đã kiểm tra"}>
                                            <Checkbox
                                                checked={info.isMasked || false}
                                                onChange={(e) => handleMaskChange(info, e.target.checked)}
                                                icon={<i className="ri-flag-line" style={{ color: '#bdbdbd', fontSize: '22px' }} />}
                                                checkedIcon={<i className="ri-flag-fill" style={{ color: '#d32f2f', fontSize: '22px' }} />}
                                            />
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </CardContent>
    )
}

export default MarkedScheduleTab
