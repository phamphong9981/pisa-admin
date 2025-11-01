import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

import type { TeacherListResponse } from './useTeacher'
import { SCHEDULE_TIME, type AllScheduleResponse, type AllScheduleStudentDto } from './useSchedule'

const DAY_MAP: Record<string, string> = {
    Monday: 'Thứ 2',
    Tuesday: 'Thứ 3',
    Wednesday: 'Thứ 4',
    Thursday: 'Thứ 5',
    Friday: 'Thứ 6',
    Saturday: 'Thứ 7',
    Sunday: 'Chủ nhật'
}

interface TimeSlotForExport {
    slot: number // zero-based index, consistent with UI mapping
    day: string
    time: string
}

interface ExportData {
    [key: string]: string | number
}

export const useExport = () => {
    const defaultTimeSlots: TimeSlotForExport[] = SCHEDULE_TIME.map((slot, index) => {
        const [time, englishDay] = slot.split(' ')

        return {
            slot: index,
            day: DAY_MAP[englishDay] ?? englishDay,
            time
        }
    })

    const normalizeStudents = (students?: AllScheduleResponse['students']): AllScheduleStudentDto[] => {
        if (!students) return []

        if (Array.isArray(students)) {
            return students
        }

        return [students]
    }

    const formatStudentLabel = (student: AllScheduleStudentDto) => {
        const courseName = student.coursename ? ` - ${student.coursename}` : ''
        return student.note ? `${student.fullname}${courseName} (${student.note})` : `${student.fullname}${courseName}`
    }

    // Format dữ liệu cho export
    const formatTeachersScheduleForExport = (
        teachers: TeacherListResponse[],
        schedules: AllScheduleResponse[] | undefined,
        options?: {
            timeSlots?: TimeSlotForExport[]
            includeSummary?: boolean
        }
    ) => {
        if (!teachers || teachers.length === 0) return []

        const effectiveTimeSlots = options?.timeSlots?.length ? options.timeSlots : defaultTimeSlots
        const includeSummary = options?.includeSummary ?? true

        const data: ExportData[] = []

        // Header row với thông tin kỹ năng
        const headerRow: ExportData = { 'Khung giờ': 'Giáo viên →' }

        teachers.forEach(teacher => {
            headerRow[teacher.name] = teacher.skills.length ? teacher.skills.join(', ') : 'Không có kỹ năng'
        })
        data.push(headerRow)

        // Thêm dữ liệu từng khung giờ
        effectiveTimeSlots.forEach(slotInfo => {
            const slotNumber = slotInfo.slot + 1 // schedule_time sử dụng chỉ số 1-based
            const row: ExportData = {
                'Khung giờ': `${slotInfo.day} ${slotInfo.time}`
            }

            teachers.forEach(teacher => {
                const teachingInfo = schedules?.find(schedule =>
                    schedule.teacher_id === teacher.id && schedule.schedule_time === slotNumber
                )

                if (teachingInfo) {
                    const students = normalizeStudents(teachingInfo.students)
                    const baseInfo = `ĐANG DẠY: ${teachingInfo.class_name} (Buổi ${teachingInfo.lesson})`

                    if (students.length === 0) {
                        row[teacher.name] = baseInfo
                    } else {
                        const studentLines = students.map(student => `- ${formatStudentLabel(student)}`).join('\n')
                        row[teacher.name] = `${baseInfo}\nHS:\n${studentLines}`
                    }
                } else if (teacher.registeredBusySchedule.includes(slotNumber)) {
                    row[teacher.name] = 'BẬN'
                } else {
                    row[teacher.name] = 'RẢNH'
                }
            })

            data.push(row)
        })

        if (includeSummary) {
            const summaryHeader: ExportData = { 'Khung giờ': '--- THỐNG KÊ ---' }

            teachers.forEach(teacher => {
                summaryHeader[teacher.name] = ''
            })
            data.push(summaryHeader)

            const freeRow: ExportData = { 'Khung giờ': 'Số khung RẢNH' }
            const busyRow: ExportData = { 'Khung giờ': 'Số khung BẬN' }
            const teachingRow: ExportData = { 'Khung giờ': 'Số khung ĐANG DẠY' }
            const totalStudentsRow: ExportData = { 'Khung giờ': 'Tổng số học sinh' }

            teachers.forEach(teacher => {
                const busySlots = teacher.registeredBusySchedule.length
                const teachingSlots = schedules?.filter(schedule => schedule.teacher_id === teacher.id).length || 0
                const totalStudents = (schedules || [])
                    .filter(schedule => schedule.teacher_id === teacher.id)
                    .reduce((total, schedule) => {
                        const students = normalizeStudents(schedule.students)
                        return total + students.length
                    }, 0)

                const freeSlots = Math.max(SCHEDULE_TIME.length - busySlots - teachingSlots, 0)

                freeRow[teacher.name] = freeSlots
                busyRow[teacher.name] = busySlots
                teachingRow[teacher.name] = teachingSlots
                totalStudentsRow[teacher.name] = totalStudents
            })

            data.push(freeRow)
            data.push(busyRow)
            data.push(teachingRow)
            data.push(totalStudentsRow)
        }

        return data
    }

    // Export to Excel
    const exportToExcel = (
        teachers: TeacherListResponse[],
        schedules: AllScheduleResponse[] | undefined,
        options?: {
            filename?: string
            timeSlots?: TimeSlotForExport[]
            includeSummary?: boolean
        }
    ) => {
        try {
            const data = formatTeachersScheduleForExport(teachers, schedules, {
                timeSlots: options?.timeSlots,
                includeSummary: options?.includeSummary
            })

            // Tạo worksheet
            const worksheet = XLSX.utils.json_to_sheet(data)

            // Set column widths
            const colWidths = [
                { wch: 20 }, // Khung giờ column
                ...teachers.map(() => ({ wch: 30 })) // Teacher columns rộng hơn để hiển thị chi tiết
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

            XLSX.utils.book_append_sheet(workbook, worksheet, 'Lịch dạy giáo viên')

            // Export file
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })

            const blob = new Blob([excelBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            })

            const currentDate = new Date().toISOString().slice(0, 10)

            const filename = options?.filename ?? 'lich-giao-vien'

            saveAs(blob, `${filename}-${currentDate}.xlsx`)

            return { success: true, message: 'Xuất file Excel thành công!' }
        } catch (error) {
            console.error('Export to Excel error:', error)

            return { success: false, message: 'Lỗi khi xuất file Excel!' }
        }
    }

    // Export to CSV
    const exportToCSV = (
        teachers: TeacherListResponse[],
        schedules: AllScheduleResponse[] | undefined,
        options?: {
            filename?: string
            timeSlots?: TimeSlotForExport[]
            includeSummary?: boolean
        }
    ) => {
        try {
            const data = formatTeachersScheduleForExport(teachers, schedules, {
                timeSlots: options?.timeSlots,
                includeSummary: options?.includeSummary
            })

            // Convert to CSV format
            const csv = convertToCSV(data)

            // Create and download file
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
            const currentDate = new Date().toISOString().slice(0, 10)

            const filename = options?.filename ?? 'lich-giao-vien'

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
                    const rawValue = row[header]
                    const value = rawValue === undefined || rawValue === null ? '' : String(rawValue)

                    // Escape commas, quotes, and newlines in CSV
                    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
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
