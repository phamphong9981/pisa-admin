# Statistics API - Student Progress Report

## Tổng quan

Module Statistics cung cấp API để xuất báo cáo tiến độ học tập của học sinh dưới dạng file Excel. API hỗ trợ xuất báo cáo cho một hoặc nhiều học sinh, tự động nén thành file ZIP khi có nhiều học sinh.

## Endpoint

### POST `/statistics/student-progress-report`

Xuất báo cáo chuyên cần học sinh (Student Progress Report).

**Authentication:** Yêu cầu Admin Guard (chỉ admin mới có quyền truy cập)

**Content-Type:** `application/json`

**Response Type:** 
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (Excel file)
- `application/zip` (ZIP file khi có nhiều học sinh)

## Request Body

```json
{
  "profileIds": ["string"] // Optional: Mảng UUID của profile học sinh
}
```

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `profileIds` | `string[]` | No | Mảng UUID của các học sinh cần xuất báo cáo. Nếu không có hoặc để trống, sẽ xuất báo cáo cho **TẤT CẢ** học sinh trong hệ thống |

## Response

### Headers

```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="student_progress_report_[Tên_Học_Sinh].xlsx"
Content-Length: [file_size]
```

Hoặc (khi có nhiều học sinh):

```
Content-Type: application/zip
Content-Disposition: attachment; filename="student_progress_reports.zip"
Content-Length: [file_size]
```

### Body

Response là binary data (file Excel hoặc ZIP)

## Các trường hợp sử dụng

### 1. Xuất báo cáo cho tất cả học sinh

**Request:**
```json
POST /statistics/student-progress-report
{}
```

hoặc

```json
POST /statistics/student-progress-report
{
  "profileIds": []
}
```

**Response:** File ZIP chứa tất cả các file Excel báo cáo của từng học sinh.

**Filename:** `student_progress_reports.zip`

### 2. Xuất báo cáo cho một học sinh

**Request:**
```json
POST /statistics/student-progress-report
{
  "profileIds": ["550e8400-e29b-41d4-a716-446655440000"]
}
```

**Response:** File Excel duy nhất của học sinh đó.

**Filename:** `student_progress_report_[Tên_Học_Sinh].xlsx`

**Lưu ý:** Tên file sẽ được sanitize (loại bỏ ký tự đặc biệt, thay khoảng trắng bằng underscore, giới hạn 50 ký tự).

### 3. Xuất báo cáo cho nhiều học sinh

**Request:**
```json
POST /statistics/student-progress-report
{
  "profileIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001",
    "770e8400-e29b-41d4-a716-446655440002"
  ]
}
```

**Response:** File ZIP chứa các file Excel của từng học sinh.

**Filename:** `student_progress_reports.zip`

## Format File Excel

### Layout tổng quan

- **Khổ giấy:** A4 Landscape
- **Worksheet name:** "Student Progress Report"
- **Orientation:** Landscape (ngang)
- **Margins:** 0.5 inch (all sides)

### Cấu trúc file

#### 1. Tiêu đề (Rows 1-2)

**Row 1:**
- Cell B1-H1 (merged): "BÁO CÁO CHUYÊN CẦN"
- Font: Bold, Size 16
- Alignment: Center (horizontal & vertical)
- Height: 25px

**Row 2:**
- Cell B2-H2 (merged): "STUDENT PROGRESS REPORT"
- Font: Bold, Size 12
- Alignment: Center (horizontal & vertical)
- Height: 20px

#### 2. Thông tin học sinh (Row 4)

- Cell B4: "Học sinh / Student name:"
- Cell D4-H4 (merged): Tên học sinh (được điền từ dữ liệu)
- Font: Size 11
- Height: 22px
- Border bottom cho cell tên học sinh

#### 3. Bảng dữ liệu (Row 6+)

**Header Row (Row 6):**
- Font: Bold, Size 11
- Alignment: Center (horizontal & vertical), WrapText: true
- Border: Full (thin)
- Height: 35px

| Cột | Key | Width | Header | Alignment |
|-----|-----|-------|--------|-----------|
| A | STT | 6 | STT | Center |
| B | Class | 12 | Lớp\nClass | Center |
| C | Date | 14 | Ngày\nDate | Center |
| D | Period | 16 | Giờ học\nPeriod | Center |
| E | Total Hours | 12 | Tổng giờ\nTotal hours | Center |
| F | Subject | 14 | Môn học\nSubject | Left |
| G | Teacher | 20 | Giáo viên\nTeacher | Left |
| H | Attendance | 16 | Điểm danh\nAttendance | Center |
| I | Note | 22 | Ghi chú\nNote | Left (WrapText) |

**Data Rows:**
- Font: Size 11
- Border: Full (thin) cho tất cả cells
- Height: 22px
- Tối thiểu 10 rows (nếu dữ liệu ít hơn, các rows trống vẫn có STT và border)
- Alignment:
  - Center: STT, Date, Period, Total hours, Attendance
  - Left: Class, Subject, Teacher, Note (Note có wrapText)

**Mẫu dữ liệu:**

| STT | Lớp | Ngày | Giờ học | Tổng giờ | Môn học | Giáo viên | Điểm danh | Ghi chú |
|-----|-----|------|---------|----------|---------|-----------|-----------|---------|
| 1 | FT 504 | 11/20/2025 | 08:40-10:00 | 1,67 | Listening | GV Nguyễn Văn A | Vắng mặt | Hs xin nghỉ lý do cá nhân |
| 2 | FT 504 | 11/21/2025 | 10:10-11:30 | 1,33 | Speaking | GV Trần Thị B | Có mặt | |

#### 4. Footer (Cuối bảng)

- Row: Sau bảng + 2 rows
- Cell F-I (merged): "QUẢN LÍ HỌC VIÊN"
- Font: Bold, Size 12
- Alignment: Center (horizontal & vertical)
- Không có border

## Mapping dữ liệu

### Điểm danh (Attendance)

Mapping từ `rollcall_status` sang tiếng Việt:

| rollcall_status | Attendance (VN) |
|-----------------|-----------------|
| `not_rollcall` | Chưa điểm danh |
| `attending` | Có mặt |
| `absent_without_reason` | Vắng mặt |
| `absent_with_reason` | Vắng có phép |
| `absent_with_late_reason` | Vắng có lý do muộn |

### Ngày (Date)

Format: `MM/DD/YYYY`

Được tính từ `week.start_date` + offset dựa trên `schedule_time`:
- `schedule_time` 1-6: Monday (offset 0)
- `schedule_time` 7-12: Tuesday (offset 1)
- `schedule_time` 13-18: Wednesday (offset 2)
- ... và tiếp tục

### Tổng giờ (Total hours)

Format: `X,XX` (dấu phẩy thay vì dấu chấm, 2 chữ số thập phân)

Ví dụ: `1.67` → `1,67`

### Giờ học (Period)

Format: `HH:MM-HH:MM`

Lấy từ `start_time` và `end_time` của schedule.

Ví dụ: `08:40-10:00`

### Môn học (Subject)

Hiện tại mặc định là `"Listening"`. Có thể mở rộng sau để lấy từ database.

### Giáo viên (Teacher)

Lấy từ `teachers.name`. Nếu không có, để trống.

### Ghi chú (Note)

Ưu tiên:
1. `schedule.reason` (lý do vắng mặt)
2. `schedule_info.note` (ghi chú từ schedule_info)
3. Nếu không có, để trống

## Query dữ liệu

API query từ các bảng sau:
- `schedule` - Lịch học của học sinh
- `profiles` - Thông tin học sinh
- `class` - Thông tin lớp học
- `week` - Thông tin tuần học
- `teachers` - Thông tin giáo viên (LEFT JOIN)
- `schedule_info` - Thông tin chi tiết schedule (LEFT JOIN)

**Điều kiện:**
- Chỉ lấy các schedule có `status` hợp lệ (không lấy các status như `cancelled`, `no_schedule`, v.v.)
- Sắp xếp: Theo tên học sinh → Ngày (DESC) → Schedule time (ASC)

## Ví dụ cURL

### Xuất báo cáo một học sinh

```bash
curl -X POST http://localhost:3000/statistics/student-progress-report \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "profileIds": ["550e8400-e29b-41d4-a716-446655440000"]
  }' \
  --output student_report.xlsx
```

### Xuất báo cáo tất cả học sinh

```bash
curl -X POST http://localhost:3000/statistics/student-progress-report \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{}' \
  --output all_students_reports.zip
```

### Xuất báo cáo nhiều học sinh

```bash
curl -X POST http://localhost:3000/statistics/student-progress-report \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "profileIds": [
      "550e8400-e29b-41d4-a716-446655440000",
      "660e8400-e29b-41d4-a716-446655440001"
    ]
  }' \
  --output multiple_reports.zip
```

## Ví dụ JavaScript/TypeScript

### Axios

```typescript
import axios from 'axios';

// Xuất báo cáo một học sinh
async function generateStudentReport(profileId: string) {
  const response = await axios.post(
    'http://localhost:3000/statistics/student-progress-report',
    { profileIds: [profileId] },
    {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      responseType: 'blob' // Quan trọng: phải set responseType là 'blob'
    }
  );

  // Tạo URL để download
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'student_report.xlsx');
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// Xuất báo cáo tất cả học sinh
async function generateAllReports() {
  const response = await axios.post(
    'http://localhost:3000/statistics/student-progress-report',
    {},
    {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      responseType: 'blob'
    }
  );

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'all_reports.zip');
  document.body.appendChild(link);
  link.click();
  link.remove();
}
```

### Fetch API

```javascript
async function generateReport(profileIds = []) {
  const response = await fetch(
    'http://localhost:3000/statistics/student-progress-report',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ profileIds })
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = profileIds.length === 1 
    ? 'student_report.xlsx' 
    : 'reports.zip';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}
```

## Lỗi có thể xảy ra

### 401 Unauthorized
- **Nguyên nhân:** Không có token hoặc token không hợp lệ
- **Giải pháp:** Đăng nhập lại và lấy token admin

### 403 Forbidden
- **Nguyên nhân:** User không có quyền admin
- **Giải pháp:** Sử dụng tài khoản admin

### 400 Bad Request
- **Nguyên nhân:** Format `profileIds` không đúng (không phải array UUID)
- **Giải pháp:** Kiểm tra lại format request body

### 500 Internal Server Error
- **Nguyên nhân:** Lỗi khi generate file Excel hoặc ZIP
- **Giải pháp:** Kiểm tra logs server, đảm bảo database connection hoạt động

## Lưu ý

1. **Performance:** Khi xuất báo cáo cho tất cả học sinh, có thể mất nhiều thời gian nếu số lượng học sinh lớn. Nên cân nhắc:
   - Sử dụng pagination
   - Chỉ xuất báo cáo cho học sinh có lịch học trong khoảng thời gian nhất định

2. **File Size:** File ZIP có thể rất lớn nếu có nhiều học sinh. Frontend nên hiển thị loading indicator.

3. **Sanitize Filename:** Tên file được sanitize để tránh lỗi:
   - Loại bỏ ký tự: `/ \ ? % * : | " < >`
   - Thay khoảng trắng bằng `_`
   - Giới hạn 50 ký tự

4. **Timezone:** Ngày tháng được tính theo timezone của database. Đảm bảo database và server cùng timezone.

5. **Empty Data:** Nếu học sinh không có schedule nào, vẫn sẽ tạo file Excel với 10 rows trống (chỉ có STT 1-10).

## Mở rộng trong tương lai

- [ ] Thêm filter theo khoảng thời gian (từ ngày - đến ngày)
- [ ] Thêm filter theo lớp học
- [ ] Thêm filter theo course
- [ ] Export PDF thay vì Excel
- [ ] Thêm chart/đồ thị vào báo cáo
- [ ] Cache kết quả để tăng performance
- [ ] Background job để generate file lớn
- [ ] Email tự động gửi báo cáo cho phụ huynh

