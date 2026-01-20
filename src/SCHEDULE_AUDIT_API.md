# Schedule Audit API Documentation

## Tổng quan

API quản lý audit log (lịch sử thay đổi) của bảng `schedule`. Hệ thống tự động ghi lại tất cả các thao tác INSERT, UPDATE, DELETE trên bảng schedule và lưu trữ trạng thái trước và sau khi thay đổi.

## Base URL

```
/schedule-audit
```

## Cấu trúc dữ liệu

### ScheduleAudit Entity

```typescript
{
  id: number;                    // ID của audit log (BIGINT)
  scheduleId: string;            // UUID của schedule record
  operation: 'INSERT' | 'UPDATE' | 'DELETE';  // Loại thao tác
  changedAt: Date;               // Thời gian thay đổi
  changedBy?: string;            // User ID người thực hiện (có thể là 'system')
  oldValues?: Record<string, any>;  // Trạng thái trước khi thay đổi (NULL cho INSERT)
  newValues?: Record<string, any>;  // Trạng thái sau khi thay đổi (NULL cho DELETE)
}
```

### Các trường trong old_values và new_values

Các trường JSONB `old_values` và `new_values` chứa toàn bộ thông tin của schedule record tại thời điểm thay đổi:

```typescript
{
  id: string;
  profile_lesson_class_id?: string;
  profile_id: string;
  class_id: string;
  lesson: number;
  week_id: string;
  schedule_time: number;
  teacher_id?: string;
  created_at: string;
  updated_at: string;
  status: string;
  rollcall_status: string;
  reason?: string;
  status_reason?: string;
  start_time?: string;
  end_time?: string;
  total_time?: number;
  note?: string;
  replace_schedule_id?: string;
  rollcall_username?: string;
}
```

---

## Endpoints

### 1. Tìm kiếm audit logs

Tìm kiếm lịch sử thay đổi của schedule với các bộ lọc tùy chọn. API tìm kiếm trong cả `old_values` và `new_values` (JSONB).

**Endpoint:** `GET /schedule-audit/search`

**Query Parameters:**
- `weekId` (string, optional): UUID của week để lọc
- `scheduleTime` (number, optional): Schedule time (1-42) để lọc
- `classId` (string, optional): UUID của class để lọc

**Example Requests:**
```bash
# Tìm tất cả audit logs
GET /schedule-audit/search

# Tìm theo weekId
GET /schedule-audit/search?weekId=550e8400-e29b-41d4-a716-446655440000

# Tìm theo scheduleTime
GET /schedule-audit/search?scheduleTime=10

# Tìm theo classId
GET /schedule-audit/search?classId=550e8400-e29b-41d4-a716-446655440001

# Kết hợp nhiều filter
GET /schedule-audit/search?weekId=550e8400-e29b-41d4-a716-446655440000&scheduleTime=10&classId=550e8400-e29b-41d4-a716-446655440001
```

**Response:** `200 OK`

```json
[
  {
    "id": 12345,
    "scheduleId": "550e8400-e29b-41d4-a716-446655440000",
    "operation": "UPDATE",
    "changedAt": "2024-01-15T10:30:00.000Z",
    "changedBy": "user-uuid-here",
    "oldValues": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "profile_id": "profile-uuid",
      "class_id": "class-uuid",
      "week_id": "week-uuid",
      "schedule_time": 10,
      "status": "active",
      "rollcall_status": "not_rollcall",
      "lesson": 1,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-15T10:00:00.000Z"
    },
    "newValues": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "profile_id": "profile-uuid",
      "class_id": "class-uuid",
      "week_id": "week-uuid",
      "schedule_time": 10,
      "status": "active",
      "rollcall_status": "attending",
      "lesson": 1,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  },
  {
    "id": 12344,
    "scheduleId": "550e8400-e29b-41d4-a716-446655440001",
    "operation": "INSERT",
    "changedAt": "2024-01-15T09:00:00.000Z",
    "changedBy": "system",
    "oldValues": null,
    "newValues": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "profile_id": "profile-uuid-2",
      "class_id": "class-uuid",
      "week_id": "week-uuid",
      "schedule_time": 15,
      "status": "active",
      "rollcall_status": "not_rollcall",
      "lesson": 2,
      "created_at": "2024-01-15T09:00:00.000Z",
      "updated_at": "2024-01-15T09:00:00.000Z"
    }
  },
  {
    "id": 12343,
    "scheduleId": "550e8400-e29b-41d4-a716-446655440002",
    "operation": "DELETE",
    "changedAt": "2024-01-15T08:00:00.000Z",
    "changedBy": "user-uuid-here",
    "oldValues": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "profile_id": "profile-uuid-3",
      "class_id": "class-uuid",
      "week_id": "week-uuid",
      "schedule_time": 20,
      "status": "cancelled",
      "rollcall_status": "not_rollcall",
      "lesson": 3,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-15T08:00:00.000Z"
    },
    "newValues": null
  }
]
```

**Response Fields:**
- `id`: ID của audit log (BIGINT, tự động tăng)
- `scheduleId`: UUID của schedule record được thay đổi
- `operation`: Loại thao tác (`INSERT`, `UPDATE`, `DELETE`)
- `changedAt`: Thời gian thay đổi (ISO 8601 format)
- `changedBy`: User ID người thực hiện (hoặc `'system'` nếu không có)
- `oldValues`: Trạng thái trước khi thay đổi (JSONB, `null` cho INSERT)
- `newValues`: Trạng thái sau khi thay đổi (JSONB, `null` cho DELETE)

**Lưu ý:**
- Kết quả được sắp xếp theo `changedAt DESC` (mới nhất trước)
- API tìm kiếm trong cả `old_values` và `new_values`
- Nếu một trong hai chứa giá trị khớp với filter, record sẽ được trả về
- Có thể kết hợp nhiều filter cùng lúc (AND logic)

---

## Logic tìm kiếm

### Tìm kiếm trong JSONB

API sử dụng PostgreSQL JSONB operators để tìm kiếm:
- `->>`: Lấy giá trị text từ JSONB
- `CAST(... AS INTEGER)`: Chuyển đổi giá trị sang integer cho `schedule_time`

### Ví dụ logic:

1. **Tìm theo weekId:**
   - Tìm trong `old_values->>'week_id'` HOẶC `new_values->>'week_id'`
   - Nếu một trong hai khớp, record được trả về

2. **Tìm theo scheduleTime:**
   - Tìm trong `old_values->>'schedule_time'` HOẶC `new_values->>'schedule_time'`
   - Chuyển đổi sang integer để so sánh

3. **Tìm theo classId:**
   - Tìm trong `old_values->>'class_id'` HOẶC `new_values->>'class_id'`
   - Nếu một trong hai khớp, record được trả về

### Kết hợp filters:

Khi có nhiều filter, chúng được kết hợp bằng AND:
```
WHERE (old_values->>'week_id' = ? OR new_values->>'week_id' = ?)
  AND (CAST(old_values->>'schedule_time' AS INTEGER) = ? OR CAST(new_values->>'schedule_time' AS INTEGER) = ?)
  AND (old_values->>'class_id' = ? OR new_values->>'class_id' = ?)
```

---

## Use Cases

### 1. Xem lịch sử thay đổi của một schedule cụ thể

```bash
# Tìm tất cả thay đổi của schedule có weekId và scheduleTime cụ thể
GET /schedule-audit/search?weekId=week-uuid&scheduleTime=10
```

### 2. Theo dõi thay đổi trong một tuần

```bash
# Xem tất cả thay đổi trong một week
GET /schedule-audit/search?weekId=week-uuid
```

### 3. Kiểm tra lịch sử của một lớp học

```bash
# Xem tất cả thay đổi liên quan đến một class
GET /schedule-audit/search?classId=class-uuid
```

### 4. So sánh trạng thái trước và sau

```typescript
// Ví dụ: Kiểm tra thay đổi rollcall_status
const audit = response[0];
if (audit.operation === 'UPDATE') {
  const oldStatus = audit.oldValues?.rollcall_status;
  const newStatus = audit.newValues?.rollcall_status;
  console.log(`Status changed from ${oldStatus} to ${newStatus}`);
}
```

---

## Status Codes

| Status Code | Mô tả |
|------------|-------|
| 200 | OK - Request thành công |
| 400 | Bad Request - Validation error (ví dụ: UUID không hợp lệ) |

---

## Validation

- `weekId`: Phải là UUID hợp lệ
- `scheduleTime`: Phải là số nguyên >= 1
- `classId`: Phải là UUID hợp lệ

---

## Notes

- Tất cả các endpoints đều sử dụng `TransformInterceptor` và `ClassSerializerInterceptor` để format response
- Timestamps được trả về theo format ISO 8601
- Audit logs được tự động tạo bởi database trigger khi có thay đổi trên bảng `schedule`
- `changedBy` có thể là `'system'` nếu thay đổi được thực hiện bởi hệ thống hoặc không có user context
- GIN indexes được tạo trên `old_values` và `new_values` để tối ưu hiệu suất tìm kiếm JSONB

