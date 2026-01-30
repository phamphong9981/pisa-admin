# Locked Schedule Dates API Documentation

## Tổng quan

API quản lý các ngày đã khóa sổ lịch học. Khi một ngày được khóa, tất cả các lịch học trong ngày đó sẽ không thể chỉnh sửa, xóa hoặc điểm danh. Hệ thống lưu trữ danh sách các ngày đã khóa để kế toán có thể quản lý và theo dõi.

## Base URL

```
/locked-schedule-dates
```

## Cấu trúc dữ liệu

### LockedScheduleDate Entity

```typescript
{
  id: string;                    // UUID của locked date record
  lockDate: Date;                // Ngày bị khóa (YYYY-MM-DD)
  createdAt: Date;               // Thời gian tạo
  updatedAt: Date;               // Thời gian cập nhật
  createdBy?: string;            // User ID người tạo (UUID, nullable)
  updatedBy?: string;            // User ID người cập nhật (UUID, nullable)
}
```

## Authentication

Tất cả các endpoints đều yêu cầu JWT authentication. Các endpoint tạo, cập nhật, xóa và khóa schedule yêu cầu quyền Admin.

## API Endpoints

### 1. Lấy danh sách các ngày đã khóa

**GET** `/locked-schedule-dates`

Lấy danh sách tất cả các ngày đã khóa, sắp xếp theo ngày giảm dần (mới nhất trước).

**Authentication:** JWT required

**Response:**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "lockDate": "2024-01-15",
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:00:00.000Z",
    "createdBy": "123e4567-e89b-12d3-a456-426614174000",
    "updatedBy": "123e4567-e89b-12d3-a456-426614174000"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "lockDate": "2024-01-14",
    "createdAt": "2024-01-09T10:00:00.000Z",
    "updatedAt": "2024-01-09T10:00:00.000Z",
    "createdBy": "123e4567-e89b-12d3-a456-426614174000",
    "updatedBy": "123e4567-e89b-12d3-a456-426614174000"
  }
]
```

**Example Request:**

```bash
curl -X GET \
  http://localhost:3000/locked-schedule-dates \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

### 2. Tạo hoặc cập nhật ngày khóa

**POST** `/locked-schedule-dates`

Tạo một ngày khóa mới hoặc cập nhật ngày khóa đã tồn tại. Nếu ngày đã tồn tại, chỉ cập nhật `updatedBy` và `updatedAt`.

**Authentication:** JWT + Admin required

**Request Body:**

```json
{
  "lock_date": "2024-01-15"
}
```

**Request Body Schema:**

- `lock_date` (string, required): Ngày cần khóa, định dạng YYYY-MM-DD (ISO date string)

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "lockDate": "2024-01-15",
  "createdAt": "2024-01-10T10:00:00.000Z",
  "updatedAt": "2024-01-10T10:00:00.000Z",
  "createdBy": "123e4567-e89b-12d3-a456-426614174000",
  "updatedBy": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Example Request:**

```bash
curl -X POST \
  http://localhost:3000/locked-schedule-dates \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "lock_date": "2024-01-15"
  }'
```

**Error Responses:**

- `400 Bad Request`: Dữ liệu đầu vào không hợp lệ
- `401 Unauthorized`: Chưa đăng nhập hoặc token không hợp lệ
- `403 Forbidden`: Không có quyền Admin

---

### 3. Xóa ngày khóa

**DELETE** `/locked-schedule-dates/:id`

Xóa một ngày khóa khỏi danh sách. Lưu ý: Việc xóa ngày khóa không tự động mở khóa các schedule đã bị khóa. Để mở khóa schedule, sử dụng endpoint `PUT /locked-schedule-dates/lock` với `is_locked: false`.

**Authentication:** JWT + Admin required

**Path Parameters:**

- `id` (UUID, required): ID của locked schedule date cần xóa

**Response:**

```json
{
  "message": "Locked schedule date deleted successfully"
}
```

**Example Request:**

```bash
curl -X DELETE \
  http://localhost:3000/locked-schedule-dates/550e8400-e29b-41d4-a716-446655440000 \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**Error Responses:**

- `404 Not Found`: Không tìm thấy locked schedule date với ID đã cho
- `401 Unauthorized`: Chưa đăng nhập hoặc token không hợp lệ
- `403 Forbidden`: Không có quyền Admin

---

### 4. Khóa hoặc mở khóa schedule theo ngày

**PUT** `/locked-schedule-dates/lock`

Khóa hoặc mở khóa tất cả các schedule có `schedule_date` trùng với ngày được chỉ định. Khi khóa, ngày sẽ được lưu vào bảng `locked_schedule_dates`. Khi mở khóa, các schedule sẽ được cập nhật nhưng ngày vẫn được giữ trong bảng `locked_schedule_dates` (có thể xóa bằng endpoint DELETE nếu cần).

**Authentication:** JWT + Admin required

**Request Body:**

```json
{
  "start_date": "2024-01-15",
  "is_locked": true
}
```

**Request Body Schema:**

- `start_date` (string, required): Ngày cần khóa/mở khóa, định dạng YYYY-MM-DD
- `is_locked` (boolean, optional): `true` để khóa, `false` để mở khóa. Mặc định là `true` nếu không cung cấp

**Response:**

```json
{
  "message": "Successfully locked 25 schedule(s)",
  "lockedCount": 25
}
```

**Example Request - Khóa schedule:**

```bash
curl -X PUT \
  http://localhost:3000/locked-schedule-dates/lock \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "start_date": "2024-01-15",
    "is_locked": true
  }'
```

**Example Request - Mở khóa schedule:**

```bash
curl -X PUT \
  http://localhost:3000/locked-schedule-dates/lock \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "start_date": "2024-01-15",
    "is_locked": false
  }'
```

**Lưu ý quan trọng:**

- Endpoint này chỉ khóa/mở khóa các schedule có `schedule_date` **chính xác bằng** ngày được chỉ định (không phải <=)
- Khi khóa (`is_locked: true`), ngày sẽ tự động được thêm vào bảng `locked_schedule_dates` nếu chưa tồn tại
- Khi mở khóa (`is_locked: false`), các schedule sẽ được mở khóa nhưng bản ghi trong `locked_schedule_dates` vẫn được giữ lại

**Error Responses:**

- `400 Bad Request`: Dữ liệu đầu vào không hợp lệ
- `401 Unauthorized`: Chưa đăng nhập hoặc token không hợp lệ
- `403 Forbidden`: Không có quyền Admin

---

## Luồng hoạt động

### Khi khóa một ngày:

1. Kế toán gọi `PUT /locked-schedule-dates/lock` với `start_date` và `is_locked: true`
2. Hệ thống tìm tất cả schedule có `schedule_date = start_date`
3. Cập nhật `is_locked = true` cho tất cả các schedule đó
4. Lưu ngày vào bảng `locked_schedule_dates` (nếu chưa tồn tại)
5. Trả về số lượng schedule đã bị khóa

### Khi mở khóa một ngày:

1. Kế toán gọi `PUT /locked-schedule-dates/lock` với `start_date` và `is_locked: false`
2. Hệ thống tìm tất cả schedule có `schedule_date = start_date`
3. Cập nhật `is_locked = false` cho tất cả các schedule đó
4. Trả về số lượng schedule đã được mở khóa

### Khi schedule bị khóa:

- Không thể chỉnh sửa schedule (update)
- Không thể xóa schedule (delete)
- Không thể điểm danh (rollcall)
- Tất cả các thao tác trên sẽ trả về lỗi `403 Forbidden` với thông báo "Lịch này đã bị khóa, không thể chỉnh sửa"

---

## Ví dụ sử dụng

### Scenario 1: Khóa tất cả lịch học ngày 15/01/2024

```bash
# Bước 1: Khóa schedule
curl -X PUT \
  http://localhost:3000/locked-schedule-dates/lock \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "start_date": "2024-01-15",
    "is_locked": true
  }'

# Response:
# {
#   "message": "Successfully locked 30 schedule(s)",
#   "lockedCount": 30
# }

# Bước 2: Kiểm tra danh sách ngày đã khóa
curl -X GET \
  http://localhost:3000/locked-schedule-dates \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'

# Response sẽ bao gồm ngày 2024-01-15
```

### Scenario 2: Mở khóa lịch học ngày 15/01/2024

```bash
curl -X PUT \
  http://localhost:3000/locked-schedule-dates/lock \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "start_date": "2024-01-15",
    "is_locked": false
  }'

# Response:
# {
#   "message": "Successfully unlocked 30 schedule(s)",
#   "lockedCount": 30
# }
```

### Scenario 3: Xóa ngày khóa khỏi danh sách

```bash
# Lấy danh sách để tìm ID
curl -X GET \
  http://localhost:3000/locked-schedule-dates \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'

# Xóa bằng ID
curl -X DELETE \
  http://localhost:3000/locked-schedule-dates/550e8400-e29b-41d4-a716-446655440000 \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

---

## Lưu ý

1. **Định dạng ngày**: Tất cả các ngày phải được gửi dưới dạng ISO date string (YYYY-MM-DD)
2. **Quyền truy cập**: Chỉ Admin mới có thể tạo, cập nhật, xóa và khóa schedule
3. **Khóa chính xác**: Endpoint `PUT /locked-schedule-dates/lock` chỉ khóa các schedule có `schedule_date` chính xác bằng ngày được chỉ định, không khóa các ngày trước đó
4. **Xóa ngày khóa**: Việc xóa ngày khóa khỏi danh sách không tự động mở khóa các schedule. Cần gọi endpoint mở khóa riêng
5. **Audit trail**: Hệ thống lưu `createdBy` và `updatedBy` để theo dõi ai đã thực hiện thao tác

