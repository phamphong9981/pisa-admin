'use client'

import * as React from 'react'
import { DayPicker, DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Button, Popover } from '@mui/material'
import { styled } from '@mui/material/styles'

import 'react-day-picker/dist/style.css'

const StyledPopover = styled(Popover)(({ theme }) => ({
    '& .rdp': {
        margin: 0,
        '--rdp-cell-size': '40px',
        '--rdp-accent-color': theme.palette.primary.main,
        '--rdp-background-color': theme.palette.background.paper,
        '--rdp-accent-color-dark': theme.palette.primary.dark,
        '--rdp-background-color-dark': theme.palette.background.default,
        '--rdp-outline': `2px solid ${theme.palette.primary.main}`,
        '--rdp-outline-selected': `2px solid ${theme.palette.primary.main}`,
        fontFamily: theme.typography.fontFamily,
    },
    '& .rdp-months': {
        display: 'flex',
        gap: theme.spacing(4),
    },
    '& .rdp-month': {
        margin: 0,
    },
    '& .rdp-table': {
        width: '100%',
        maxWidth: '100%',
    },
    '& .rdp-head_cell': {
        color: theme.palette.text.secondary,
        fontWeight: theme.typography.fontWeightMedium,
        fontSize: theme.typography.body2.fontSize,
        padding: theme.spacing(1),
    },
    '& .rdp-cell': {
        width: 'var(--rdp-cell-size)',
        height: 'var(--rdp-cell-size)',
    },
    '& .rdp-button': {
        width: '100%',
        height: '100%',
        borderRadius: theme.shape.borderRadius,
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        color: theme.palette.text.primary,
        fontSize: theme.typography.body2.fontSize,
        '&:hover:not([disabled])': {
            backgroundColor: theme.palette.action.hover,
        },
        '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: '2px',
        },
        '&[disabled]': {
            color: theme.palette.action.disabled,
            cursor: 'not-allowed',
        },
    },
    '& .rdp-day_selected': {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        '&:hover': {
            backgroundColor: theme.palette.primary.dark,
        },
    },
    '& .rdp-day_range_start, & .rdp-day_range_end': {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
    },
    '& .rdp-day_range_middle': {
        backgroundColor: theme.palette.action.selected,
    },
    '& .rdp-day_today:not(.rdp-day_selected)': {
        fontWeight: theme.typography.fontWeightBold,
    },
    '& .rdp-caption': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing(1, 2),
        marginBottom: theme.spacing(1),
    },
    '& .rdp-caption_label': {
        fontWeight: theme.typography.fontWeightMedium,
        fontSize: theme.typography.subtitle1.fontSize,
        color: theme.palette.text.primary,
    },
    '& .rdp-nav': {
        display: 'flex',
        gap: theme.spacing(1),
    },
    '& .rdp-button_reset': {
        padding: theme.spacing(0.5),
        borderRadius: theme.shape.borderRadius,
        '&:hover': {
            backgroundColor: theme.palette.action.hover,
        },
    },
}))

interface SingleDatePickerProps {
    date?: Date | undefined
    onSelect?: (date: Date | undefined) => void
    placeholder?: string
    disabled?: { after?: Date; before?: Date } | ((date: Date) => boolean)
}

export const SingleDatePicker: React.FC<SingleDatePickerProps> = ({
    date,
    onSelect,
    placeholder = 'Chọn ngày',
    disabled,
}) => {
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
    const open = Boolean(anchorEl)

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const handleSelect = (selectedDate: Date | undefined) => {
        onSelect?.(selectedDate)
        if (selectedDate) {
            handleClose()
        }
    }

    const formatDate = () => {
        if (!date) {
            return placeholder
        }
        return format(date, 'dd/MM/yyyy', { locale: vi })
    }

    // Build disabled prop - only include properties that are defined
    const buildDisabledProp = (): any => {
        if (typeof disabled === 'function') {
            return disabled
        }
        if (!disabled) {
            return { after: new Date() }
        }
        const disabledObj: { after?: Date; before?: Date } = {}
        if (disabled.after !== undefined) {
            disabledObj.after = disabled.after
        }
        if (disabled.before !== undefined) {
            disabledObj.before = disabled.before
        }
        // If no properties, default to after: new Date()
        if (Object.keys(disabledObj).length === 0) {
            return { after: new Date() }
        }
        return disabledObj
    }

    return (
        <>
            <Button
                variant='outlined'
                onClick={handleClick}
                sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    color: date ? 'text.primary' : 'text.secondary',
                    minWidth: 200,
                }}
                startIcon={<i className='ri-calendar-line' />}
            >
                {formatDate()}
            </Button>
            <StyledPopover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                PaperProps={{
                    sx: {
                        p: 2,
                        mt: 1,
                    },
                }}
            >
                <DayPicker
                    mode='single'
                    selected={date}
                    onSelect={handleSelect}
                    locale={vi}
                    numberOfMonths={1}
                    disabled={buildDisabledProp()}
                />
            </StyledPopover>
        </>
    )
}

interface DatePickerProps {
    dateRange?: DateRange | undefined
    onSelect?: (range: DateRange | undefined) => void
    placeholder?: string
}

export const DatePicker: React.FC<DatePickerProps> = ({
    dateRange,
    onSelect,
    placeholder = 'Chọn khoảng thời gian',
}) => {
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
    const open = Boolean(anchorEl)

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const handleSelect = (range: DateRange | undefined) => {
        onSelect?.(range)
        if (range?.from && range?.to) {
            handleClose()
        }
    }

    const formatDateRange = () => {
        if (!dateRange?.from) {
            return placeholder
        }
        if (dateRange.from && !dateRange.to) {
            return format(dateRange.from, 'dd/MM/yyyy', { locale: vi })
        }
        if (dateRange.from && dateRange.to) {
            return `${format(dateRange.from, 'dd/MM/yyyy', { locale: vi })} - ${format(dateRange.to, 'dd/MM/yyyy', { locale: vi })}`
        }
        return placeholder
    }

    return (
        <>
            <Button
                variant='outlined'
                onClick={handleClick}
                sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    color: dateRange?.from ? 'text.primary' : 'text.secondary',
                    minWidth: 280,
                }}
                startIcon={<i className='ri-calendar-line' />}
            >
                {formatDateRange()}
            </Button>
            <StyledPopover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                PaperProps={{
                    sx: {
                        p: 2,
                        mt: 1,
                    },
                }}
            >
                <DayPicker
                    mode='range'
                    selected={dateRange}
                    onSelect={handleSelect}
                    locale={vi}
                    numberOfMonths={2}
                />
            </StyledPopover>
        </>
    )
}

