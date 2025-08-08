'use client'

export const runtime = 'edge';

import React from 'react'

import { Box, Card, CardContent, Grid, IconButton, InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'

import { useGetTotalStudyHours } from '@/@core/hooks/useAccounting'

const AccountingPage = () => {
  const [search, setSearch] = React.useState<string | undefined>(undefined)
  const { data, isFetching } = useGetTotalStudyHours(search)

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant='h5' fontWeight={700}>Kế toán</Typography>
        <Typography variant='body2' color='text.secondary'>Danh sách học sinh và số buổi, thời gian đã học</Typography>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display='flex' gap={2} alignItems='center' mb={3}>
              <TextField
                value={search ?? ''}
                onChange={e => setSearch(e.target.value || undefined)}
                placeholder='Tìm tên, email, lớp, khóa học...'
                fullWidth
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
    </Grid>
  )
}

export default AccountingPage


