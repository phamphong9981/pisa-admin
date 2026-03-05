# Schedule Info API

Bảng `schedule_info` lưu trữ thông tin chung cho một buổi học của một lớp trong một tuần nhất định (note, thời gian bắt đầu/kết thúc, giáo viên phụ trách, ghi chú giáo viên, trạng thái đối soát).

## 1. Lấy danh sách Schedule Info theo file (Query)
**Endpoint:** `GET /schedule-info`

Lấy danh sách thông tin buổi học dựa trên các điều kiện lọc.

### Query Parameters:
- `weekId` (UUID, Optional): Lọc theo ID tuần.
- `classId` (UUID, Optional): Lọc theo ID lớp.
- `region` (Number, Optional): Lọc theo khu vực (region).
- `teacherNote` (Boolean, Optional): 
    - `true`: Chỉ lấy các bản ghi có ghi chú giáo viên.
    - `false`: Chỉ lấy các bản ghi chưa có ghi chú giáo viên.
- `isMasked` (Boolean, Optional): Lọc theo trạng thái đối soát.

### Response `200 OK`:
Trả về mảng `ScheduleInfoByFieldResponseDto[]`:
```json
[
  {
    "id": "uuid",
    "classId": "uuid",
    "weekId": "uuid",
    "lesson": 1,
    "scheduleTime": 1,
    "note": "Ghi chú buổi học",
    "startTime": "08:00",
    "endTime": "10:00",
    "teacherId": "uuid",
    "rollcallNote": "Ghi chú điểm danh",
    "teacherNote": "Ghi chú của giáo viên về buổi học",
    "teacherNoteStudents": "Ghi chú về học sinh",
    "isMasked": false,
    "createdAt": "date-time",
    "updatedAt": "date-time",
    "className": "Tên lớp",
    "courseName": "Tên khóa học",
    "teacherName": "Tên giáo viên"
  }
]
```

---

## 2. Cập nhật Schedule Info
**Endpoint:** `PUT /schedule-info`
**Auth:** Yêu cầu đăng nhập.

Cập nhật các thông tin cơ bản của một buổi học. Các tham số định danh (`classId`, `weekId`, `lesson`) được truyền qua Query.

### Query Parameters:
- `classId` (UUID, Required)
- `weekId` (UUID, Required)
- `lesson` (Number, Required)
- `scheduleTime` (Number, Optional): Cần thiết nếu lớp có nhiều slot học trong cùng một tiết/ngày.

### Body (UpdateScheduleInfoDto):
```json
{
  "note": "string (Optional)",
  "startTime": "HH:MM (Optional)",
  "endTime": "HH:MM (Optional)",
  "teacherId": "UUID (Optional)",
  "rollcallNote": "string (Optional)",
  "isMasked": "boolean (Optional)"
}
```

### Response `200 OK`:
Trả về đối tượng `ScheduleInfoResponseDto` đã cập nhật.

---

## 3. Cập nhật Ghi chú Giáo viên (Teacher Note)
**Endpoint:** `PUT /schedule-info/teacher-note`
**Auth:** Yêu cầu đăng nhập.

API chuyên dụng cho giáo viên cập nhật ghi chú buổi học và nhận xét học sinh. 
*Lưu ý: Giáo viên chỉ có thể cập nhật trong vòng 12 tiếng sau khi buổi học kết thúc.*

### Query Parameters:
- `classId` (UUID, Required)
- `weekId` (UUID, Required)
- `lesson` (Number, Required)
- `scheduleTime` (Number, Optional)

### Body (UpdateTeacherNoteDto):
```json
{
  "teacherNote": "Nội dung bài học/Ghi chú chung",
  "teacherNoteStudents": "Nhận xét từng học sinh"
}
```

### Response `200 OK`:
Trả về đối tượng `ScheduleInfoResponseDto` đã cập nhật.

---

## 4. Xuất dữ liệu Schedule Info (CSV)
**Endpoint:** `GET /export/schedule-info`

Xuất danh sách thông tin buổi học của một tuần cụ thể ra file CSV.

### Query Parameters:
- `weekId` (UUID, Required): ID của tuần cần xuất dữ liệu.
- `download` (Boolean, Optional): 
    - `true`: Trả về header để trình duyệt tự động tải xuống file.
    - `false` hoặc không truyền: Trả về nội dung CSV dạng text.

### Response:
- Nếu `download=true`: File `schedule-info-week-{weekId}.csv`.
- Nếu không: Chuỗi văn bản định dạng CSV.

---

## Các DTO liên quan

### ScheduleInfoResponseDto
```typescript
{
    id: string;
    classId: string;
    weekId: string;
    lesson: number;
    note?: string;
    start_time?: string;
    end_time?: string;
    rollcall_note?: string;
    teacher_note?: string;
    teacher_note_students?: string;
    createdAt: Date;
    updatedAt: Date;
    schedule_time?: number;
    isMasked?: boolean;
}
```
