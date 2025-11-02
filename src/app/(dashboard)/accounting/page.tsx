'use client'

export const runtime = 'edge';

import React from 'react'

import { Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid, IconButton, InputAdornment, InputLabel, MenuItem, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'

import { useGetTotalStudyHours } from '@/@core/hooks/useAccounting'
import { exportScheduleInfo } from '@/@core/hooks/useSchedule'
import { useGetWeeks, WeekResponseDto, ScheduleStatus as WeekStatus } from '@/@core/hooks/useWeek'

const AccountingPage = () => {
  const [search, setSearch] = React.useState<string | undefined>(undefined)
  const { data, isFetching } = useGetTotalStudyHours(search)
  const { data: weeksData, isLoading: isWeeksLoading } = useGetWeeks()
  const [openDialog, setOpenDialog] = React.useState(false)
  const [selectedWeekIdInDialog, setSelectedWeekIdInDialog] = React.useState<string>('')
  const [isDownloading, setIsDownloading] = React.useState(false)

  const weeks = React.useMemo(() => weeksData || [], [weeksData])
  const openWeek = React.useMemo(() => weeks.find(w => w.scheduleStatus === WeekStatus.OPEN), [weeks])

  // Calculate end date for a week (startDate + 6 days)
  const calculateEndDate = (startDate: Date): Date => {
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 6)
    return endDate
  }

  // Get selected week info in dialog
  const selectedWeekInDialog = React.useMemo(() => {
    return weeks.find(week => week.id === selectedWeekIdInDialog) || null
  }, [weeks, selectedWeekIdInDialog])

  // Set default week when dialog opens
  React.useEffect(() => {
    if (openDialog && weeks.length > 0 && !selectedWeekIdInDialog) {
      if (openWeek) {
        setSelectedWeekIdInDialog(openWeek.id)
      } else {
        const sorted = [...weeks].sort((a: WeekResponseDto, b: WeekResponseDto) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
        setSelectedWeekIdInDialog(sorted[0].id)
      }
    }
  }, [openDialog, weeks, selectedWeekIdInDialog, openWeek])

  const handleOpenDownloadDialog = () => {
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedWeekIdInDialog('')
  }

  const handleDownloadSchedule = async () => {
    if (!selectedWeekIdInDialog) return

    setIsDownloading(true)
    try {
      const res = await exportScheduleInfo(selectedWeekIdInDialog, true)
      const blob = new Blob([res.content], { type: res.contentType || 'text/csv; charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = res.filename || 'schedule.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      handleCloseDialog()
    } catch (e) {
      console.error('Error downloading schedule:', e)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h5' fontWeight={700}>Kế toán</Typography>
        <Typography variant='body2' color='text.secondary'>Danh sách học sinh và số buổi, thời gian đã học</Typography>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display='flex' gap={2} alignItems='center' mb={3} flexWrap='wrap'>
              <TextField
                value={search ?? ''}
                onChange={e => setSearch(e.target.value || undefined)}
                placeholder='Tìm tên, email, lớp, khóa học...'
                sx={{ flex: 1, minWidth: 250 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <i className='ri-search-line' />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton edge='end' onClick={() => setSearch(undefined)} disabled={!search}>
                        <i className='ri-close-line' />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <Button
                variant='contained'
                onClick={handleOpenDownloadDialog}
                disabled={isWeeksLoading}
                startIcon={<i className='ri-download-line' />}
              >
                Tải lịch tuần (CSV)
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Học sinh</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Khóa học</TableCell>
                    <TableCell>Lớp</TableCell>
                    <TableCell align='right'>Số buổi</TableCell>
                    <TableCell align='right'>Tổng giờ thực học</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data || []).map(row => (
                    <TableRow key={`${row.email}-${row.className}-${row.courseName}`}>
                      <TableCell>
                        <Box display='flex' alignItems='center' gap={1}>
                          <i className='ri-user-line' />
                          <Box>
                            <Typography variant='body2' fontWeight={600}>{row.fullname || row.username}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.courseName}</TableCell>
                      <TableCell>{row.className}</TableCell>
                      <TableCell align='right'>{row.totalAttendedSessions}</TableCell>
                      <TableCell align='right'>{row.totalActualHours}</TableCell>
                    </TableRow>
                  ))}
                  {(!isFetching && (data || []).length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography variant='body2' color='text.secondary'>Không có dữ liệu</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      {/* Download Schedule Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Box display='flex' alignItems='center' gap={1}>
            <i className='ri-download-line' style={{ fontSize: 24, color: '#1976d2' }} />
            <Typography variant='h6'>Tải lịch tuần (CSV)</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Chọn tuần học để export</InputLabel>
              <Select
                value={selectedWeekIdInDialog}
                onChange={(e) => setSelectedWeekIdInDialog(e.target.value)}
                label='Chọn tuần học để export'
                disabled={isWeeksLoading}
              >
                {isWeeksLoading ? (
                  <MenuItem disabled>Đang tải...</MenuItem>
                ) : weeks.length === 0 ? (
                  <MenuItem disabled>Không có dữ liệu</MenuItem>
                ) : (
                  weeks.map((week: WeekResponseDto) => {
                    const startDate = new Date(week.startDate)
                    const endDate = calculateEndDate(startDate)

                    return (
                      <MenuItem key={week.id} value={week.id}>
                        <Box display='flex' alignItems='center' gap={1} width='100%'>
                          <i className='ri-calendar-line' style={{ color: '#1976d2' }} />
                          <Box flex={1}>
                            <Typography variant='body2'>
                              {startDate.toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })} - {endDate.toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {week.scheduleStatus === WeekStatus.OPEN ? 'Mở' :
                                week.scheduleStatus === WeekStatus.CLOSED ? 'Đóng' : 'Chờ duyệt'}
                              {openWeek?.id === week.id && ' (Tuần mở)'}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    )
                  })
                )}
              </Select>
            </FormControl>

            {/* Selected Week Info */}
            {selectedWeekInDialog && (
              <Box sx={{ p: 2, backgroundColor: '#e3f2fd', borderRadius: 1, border: '1px solid #bbdefb' }}>
                <Box display='flex' alignItems='center' gap={2}>
                  <i className='ri-calendar-line' style={{ fontSize: 20, color: '#1976d2' }} />
                  <Box flex={1}>
                    <Typography variant='body2' fontWeight={600} gutterBottom>
                      Tuần học được chọn
                    </Typography>
                    <Box display='flex' alignItems='center' gap={2} flexWrap='wrap'>
                      <Typography variant='body2'>
                        Tuần từ {new Date(selectedWeekInDialog.startDate).toLocaleDateString('vi-VN')} đến {calculateEndDate(new Date(selectedWeekInDialog.startDate)).toLocaleDateString('vi-VN')}
                      </Typography>
                      <Chip
                        label={selectedWeekInDialog.scheduleStatus === WeekStatus.OPEN ? 'Mở' :
                          selectedWeekInDialog.scheduleStatus === WeekStatus.CLOSED ? 'Đóng' : 'Chờ duyệt'}
                        color={selectedWeekInDialog.scheduleStatus === WeekStatus.OPEN ? 'success' :
                          selectedWeekInDialog.scheduleStatus === WeekStatus.CLOSED ? 'error' : 'warning'}
                        size='small'
                      />
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isDownloading}>
            Hủy
          </Button>
          <Button
            variant='contained'
            onClick={handleDownloadSchedule}
            disabled={!selectedWeekIdInDialog || isDownloading}
            startIcon={isDownloading ? <i className='ri-loader-4-line' style={{ animation: 'spin 1s linear infinite' }} /> : <i className='ri-download-line' />}
          >
            {isDownloading ? 'Đang tải...' : 'Tải về'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default AccountingPage



