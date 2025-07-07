import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

import type { TeacherListResponse } from './useTeacher'

// Constants
const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']

const TIME_SLOTS = [
    '8:00-10:00',
    '10:00-12:00',
    '13:00-15:00',
    '15:00-17:00',
    '18:00-20:00',
    '20:00-22:00'
]

interface ExportData {
    [key: string]: string | number
}

export const useExport = () => {
    // Format dữ liệu cho export
    const formatTeachersScheduleForExport = (teachers: TeacherListResponse[]) => {
        if (!teachers || teachers.length === 0) return []

        const data: ExportData[] = []

        // Tạo header row
        const headerRow: ExportData = { 'Khung giờ': 'Giáo viên →' }

        teachers.forEach(teacher => {
            headerRow[teacher.name] = `${teacher.skills.join(', ')}`
        })
        data.push(headerRow)

        // Tạo dữ liệu cho từng khung giờ
        let slotIndex = 0

        DAYS.forEach((day) => {
            TIME_SLOTS.forEach((time) => {
                const row: ExportData = {
                    'Khung giờ': `${day} ${time}`
                }

                teachers.forEach(teacher => {
                    const isBusy = teacher.registeredBusySchedule.includes(slotIndex)

                    row[teacher.name] = isBusy ? 'BẬN' : 'RẢNH'
                })

                data.push(row)
                slotIndex++
            })
        })

        // Thêm summary row
        const summaryHeader: ExportData = { 'Khung giờ': '--- THỐNG KÊ ---' }

        teachers.forEach(teacher => {
            summaryHeader[teacher.name] = ''
        })
        data.push(summaryHeader)

        const freeRow: ExportData = { 'Khung giờ': 'Số khung RẢNH' }
        const busyRow: ExportData = { 'Khung giờ': 'Số khung BẬN' }

        teachers.forEach(teacher => {
            const busySlots = teacher.registeredBusySchedule.length
            const freeSlots = 42 - busySlots

            freeRow[teacher.name] = freeSlots
            busyRow[teacher.name] = busySlots
        })
        data.push(freeRow)
        data.push(busyRow)

        return data
    }

    // Export to Excel
    const exportToExcel = (teachers: TeacherListResponse[], filename = 'lich-ranh-giao-vien') => {
        try {
            const data = formatTeachersScheduleForExport(teachers)

            // Tạo worksheet
            const worksheet = XLSX.utils.json_to_sheet(data)

            // Set column widths
            const colWidths = [
                { wch: 20 }, // Khung giờ column
                ...teachers.map(() => ({ wch: 15 })) // Teacher columns
            ]

            worksheet['!cols'] = colWidths

            // Style cho header row
            const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')

            for (let C = range.s.c; C <= range.e.c; ++C) {
                const address = XLSX.utils.encode_cell({ r: 0, c: C })

                if (!worksheet[address]) continue
                worksheet[address].s = {
                    font: { bold: true },
                    fill: { fgColor: { rgb: 'E3F2FD' } }
                }
            }

            // Tạo workbook
            const workbook = XLSX.utils.book_new()

            XLSX.utils.book_append_sheet(workbook, worksheet, 'Lịch rảnh giáo viên')

            // Export file
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })

            const blob = new Blob([excelBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            })

            const currentDate = new Date().toISOString().slice(0, 10)

            saveAs(blob, `${filename}-${currentDate}.xlsx`)

            return { success: true, message: 'Xuất file Excel thành công!' }
        } catch (error) {
            console.error('Export to Excel error:', error)
            
return { success: false, message: 'Lỗi khi xuất file Excel!' }
        }
    }

    // Export to CSV
    const exportToCSV = (teachers: TeacherListResponse[], filename = 'lich-ranh-giao-vien') => {
        try {
            const data = formatTeachersScheduleForExport(teachers)

            // Convert to CSV format
            const csv = convertToCSV(data)

            // Create and download file
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
            const currentDate = new Date().toISOString().slice(0, 10)

            saveAs(blob, `${filename}-${currentDate}.csv`)

            return { success: true, message: 'Xuất file CSV thành công!' }
        } catch (error) {
            console.error('Export to CSV error:', error)
            
return { success: false, message: 'Lỗi khi xuất file CSV!' }
        }
    }

    // Helper function to convert data to CSV
    const convertToCSV = (data: ExportData[]): string => {
        if (data.length === 0) return ''

        // Get headers
        const headers = Object.keys(data[0])

        // Create CSV content
        const csvContent = [
            // Headers
            headers.join(','),

            // Data rows
            ...data.map(row =>
                headers.map(header => {
                    const value = row[header]


                    // Escape commas and quotes in CSV
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`
                    }

                    
return value
                }).join(',')
            )
        ].join('\n')

        return csvContent
    }

    // Export summary statistics
    const exportSummary = (teachers: TeacherListResponse[], filename = 'thong-ke-giao-vien') => {
        try {
            const summaryData = teachers.map(teacher => ({
                'Tên giáo viên': teacher.name,
                'Kỹ năng': teacher.skills.join(', '),
                'Số khung rảnh': 42 - teacher.registeredBusySchedule.length,
                'Số khung bận': teacher.registeredBusySchedule.length,
                'Tỷ lệ rảnh (%)': Math.round(((42 - teacher.registeredBusySchedule.length) / 42) * 100),
                'Ngày tạo': new Date(teacher.createdAt).toLocaleDateString('vi-VN'),
                'Cập nhật': new Date(teacher.updatedAt).toLocaleDateString('vi-VN')
            }))

            // Create worksheet
            const worksheet = XLSX.utils.json_to_sheet(summaryData)

            // Set column widths
            worksheet['!cols'] = [
                { wch: 20 }, // Tên
                { wch: 25 }, // Kỹ năng
                { wch: 15 }, // Rảnh
                { wch: 15 }, // Bận
                { wch: 15 }, // Tỷ lệ
                { wch: 12 }, // Ngày tạo
                { wch: 12 }  // Cập nhật
            ]

            // Create workbook
            const workbook = XLSX.utils.book_new()

            XLSX.utils.book_append_sheet(workbook, worksheet, 'Thống kê giáo viên')

            // Export
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })

            const blob = new Blob([excelBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            })

            const currentDate = new Date().toISOString().slice(0, 10)

            saveAs(blob, `${filename}-${currentDate}.xlsx`)

            return { success: true, message: 'Xuất thống kê thành công!' }
        } catch (error) {
            console.error('Export summary error:', error)
            
return { success: false, message: 'Lỗi khi xuất thống kê!' }
        }
    }

    return {
        exportToExcel,
        exportToCSV,
        exportSummary,
        formatTeachersScheduleForExport
    }
}

export default useExport 
