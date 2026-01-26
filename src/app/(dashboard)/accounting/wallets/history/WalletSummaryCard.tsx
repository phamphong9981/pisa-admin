'use client'

import React from 'react'
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Chip,
    CircularProgress,
    Grid,
    Paper,
    Typography
} from '@mui/material'
import { styled } from '@mui/material/styles'
import { format } from 'date-fns'

import {
    formatDelta,
    type WalletDeltaSummary,
} from '@/@core/hooks/useStudentWalletAudit'

import {
    WALLET_TYPE_KEYS,
    WALLET_TYPE_LABELS,
} from '@/@core/hooks/useStudentWallet'

const SummaryCard = styled(Card)(({ theme }) => ({
    border: '2px solid',
    borderColor: theme.palette.primary.main,
    boxShadow: theme.shadows[3],
}))

interface WalletSummaryCardProps {
    studentName: string
    summaryData?: WalletDeltaSummary
    isLoading: boolean
    startDate?: Date | null
    endDate?: Date | null
}

const WalletSummaryCard: React.FC<WalletSummaryCardProps> = ({
    studentName,
    summaryData,
    isLoading,
    startDate,
    endDate,
}) => {
    const formatDateRange = () => {
        if (startDate && endDate) {
            return `Từ ${format(startDate, 'dd/MM/yyyy')} đến ${format(endDate, 'dd/MM/yyyy')}`
        }
        if (startDate) {
            return `Từ ${format(startDate, 'dd/MM/yyyy')} đến nay`
        }
        if (endDate) {
            return `Từ đầu đến ${format(endDate, 'dd/MM/yyyy')}`
        }
        return 'Tất cả thời gian'
    }

    return (
        <SummaryCard>
            <CardHeader
                title={
                    <Box display='flex' alignItems='center' gap={1}>
                        <i className='ri-pie-chart-line' style={{ fontSize: 24 }} />
                        <Typography variant='h6'>
                            Tổng hợp thay đổi - {studentName}
                        </Typography>
                    </Box>
                }
                subheader={formatDateRange()}
            />
            <CardContent>
                {isLoading ? (
                    <Box display='flex' justifyContent='center' p={4}>
                        <CircularProgress />
                    </Box>
                ) : !summaryData ? (
                    <Box textAlign='center' p={4}>
                        <Typography color='text.secondary'>
                            Không có dữ liệu thống kê
                        </Typography>
                    </Box>
                ) : (
                    <Grid container spacing={2}>
                        {WALLET_TYPE_KEYS.map(key => {
                            const delta = summaryData[key]
                            if (!delta || (delta.tang === 0 && delta.giam === 0 && delta.ton === 0 && delta.tonDau === 0 && delta.tonCuoi === 0)) {
                                return null
                            }

                            const isReserve = key === 'v7'
                            const isPositive = delta.ton > 0
                            const isNegative = delta.ton < 0

                            return (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={key}>
                                    <Paper
                                        elevation={3}
                                        sx={{
                                            p: 2.5,
                                            height: '100%',
                                            background: isReserve
                                                ? 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)'
                                                : 'linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 100%)',
                                            borderRadius: 2.5,
                                            border: '2px solid',
                                            borderColor: isReserve ? 'warning.main' : 'grey.400',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-6px)',
                                                boxShadow: 6,
                                            }
                                        }}
                                    >
                                        {/* Header - Tên ví */}
                                        <Box
                                            display='flex'
                                            flexDirection='column'
                                            alignItems='center'
                                            justifyContent='center'
                                            gap={0.5}
                                            mb={2}
                                            pb={1.5}
                                            borderBottom='2px solid'
                                            borderColor={isReserve ? 'warning.main' : 'grey.300'}
                                        >
                                            <Box display='flex' alignItems='center' gap={1}>
                                                <i
                                                    className={isReserve ? 'ri-safe-2-fill' : 'ri-wallet-3-fill'}
                                                    style={{ fontSize: 20, color: isReserve ? '#ED6C02' : '#424242' }}
                                                />
                                                <Typography variant='subtitle1' fontWeight={700} color={isReserve ? 'warning.dark' : 'text.primary'}>
                                                    {WALLET_TYPE_LABELS[key]}
                                                </Typography>
                                            </Box>
                                            <Typography variant='caption' color='text.secondary' fontWeight={500}>
                                                Loại ví ({key.toUpperCase()})
                                            </Typography>
                                        </Box>

                                        {/* Số dư cuối - Chỉ số chính (Lớn, nổi bật) */}
                                        <Box
                                            textAlign='center'
                                            mb={2.5}
                                            p={2.5}
                                            bgcolor='rgba(255, 255, 255, 0.8)'
                                            borderRadius={2}
                                            border='2px solid'
                                            borderColor='grey.800'
                                            boxShadow={2}
                                        >
                                            <Typography variant='caption' fontWeight={600} color='text.secondary' display='block' mb={0.5}>
                                                Số dư cuối kỳ
                                            </Typography>
                                            <Typography
                                                variant='h3'
                                                fontWeight={700}
                                                color='#212121'
                                                sx={{
                                                    fontSize: { xs: '2rem', sm: '2.5rem' }
                                                }}
                                            >
                                                {delta.tonCuoi}
                                            </Typography>

                                            {/* Badge biến động */}
                                            {delta.ton !== 0 && (
                                                <Chip
                                                    icon={<i className={isPositive ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} style={{ fontSize: 14 }} />}
                                                    label={formatDelta(delta)}
                                                    size='small'
                                                    sx={{
                                                        mt: 1,
                                                        fontWeight: 700,
                                                        bgcolor: isPositive ? '#4CAF50' : isNegative ? '#F44336' : '#9E9E9E',
                                                        color: 'white',
                                                        '& .MuiChip-icon': { color: 'white' }
                                                    }}
                                                />
                                            )}
                                        </Box>

                                        {/* Chi tiết phụ - Compact */}
                                        <Box>
                                            {/* Số dư đầu */}
                                            <Box
                                                display='flex'
                                                justifyContent='space-between'
                                                alignItems='center'
                                                mb={1}
                                                p={1}
                                                bgcolor='rgba(158, 158, 158, 0.1)'
                                                borderRadius={1}
                                            >
                                                <Box display='flex' alignItems='center' gap={0.5}>
                                                    <i className='ri-play-circle-line' style={{ fontSize: 14, color: '#616161' }} />
                                                    <Typography variant='caption' fontWeight={600} color='text.secondary'>
                                                        Đầu kỳ
                                                    </Typography>
                                                </Box>
                                                <Typography variant='body2' fontWeight={700} color='#424242'>
                                                    {delta.tonDau}
                                                </Typography>
                                            </Box>

                                            {/* Nạp */}
                                            <Box
                                                display='flex'
                                                justifyContent='space-between'
                                                alignItems='center'
                                                mb={1}
                                                p={1}
                                                bgcolor='rgba(76, 175, 80, 0.1)'
                                                borderRadius={1}
                                            >
                                                <Box display='flex' alignItems='center' gap={0.5}>
                                                    <i className='ri-add-circle-fill' style={{ fontSize: 14, color: '#2E7D32' }} />
                                                    <Typography variant='caption' fontWeight={600} color='#2E7D32'>
                                                        Nạp
                                                    </Typography>
                                                </Box>
                                                <Typography variant='body2' fontWeight={700} color='#1B5E20'>
                                                    +{delta.tang}
                                                </Typography>
                                            </Box>

                                            {/* Dùng */}
                                            <Box
                                                display='flex'
                                                justifyContent='space-between'
                                                alignItems='center'
                                                mb={1}
                                                p={1}
                                                bgcolor='rgba(244, 67, 54, 0.1)'
                                                borderRadius={1}
                                            >
                                                <Box display='flex' alignItems='center' gap={0.5}>
                                                    <i className='ri-indeterminate-circle-fill' style={{ fontSize: 14, color: '#C62828' }} />
                                                    <Typography variant='caption' fontWeight={600} color='#C62828'>
                                                        Dùng
                                                    </Typography>
                                                </Box>
                                                <Typography variant='body2' fontWeight={700} color='#B71C1C'>
                                                    -{delta.giam}
                                                </Typography>
                                            </Box>

                                            {/* Công thức kiểm tra (compact) */}
                                            <Box
                                                mt={1.5}
                                                pt={1.5}
                                                borderTop='1px dashed'
                                                borderColor='divider'
                                                textAlign='center'
                                            >
                                                <Typography variant='caption' color='text.secondary' fontStyle='italic' sx={{ fontSize: '0.7rem' }}>
                                                    {delta.tonCuoi} = {delta.tonDau} + {delta.tang} - {delta.giam}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Paper>
                                </Grid>
                            )
                        })}
                        {/* Show message when no wallets have data */}
                        {WALLET_TYPE_KEYS.every(key => {
                            const delta = summaryData[key]
                            return !delta || (delta.tang === 0 && delta.giam === 0 && delta.ton === 0 && delta.tonDau === 0 && delta.tonCuoi === 0)
                        }) && (
                            <Grid item xs={12}>
                                <Box textAlign='center' p={2}>
                                    <Typography color='text.secondary'>
                                        Không có thay đổi nào trong khoảng thời gian này
                                    </Typography>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                )}
            </CardContent>
        </SummaryCard>
    )
}

export default WalletSummaryCard

