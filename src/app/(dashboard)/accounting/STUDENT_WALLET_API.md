# Student Wallet API Documentation

## Tổng quan

API quản lý ví học sinh (Student Wallet) cho phép tạo, đọc, cập nhật và xóa thông tin ví của học sinh. Mỗi học sinh có thể có một ví chứa các loại voucher khác nhau (v0-v6).

## Base URL

```
/student-wallets
```

## Các loại ví (Wallet Types)

- **v0**: Buổi chính
- **v1**: Bổ trợ BTG với Giáo viên
- **v2**: Bổ trợ BTG với Tutor
- **v3**: Bổ trợ yếu BTS
- **v4**: Mock 3 kỹ năng LRW (Listening, Reading, Writing)
- **v5**: Mock S GVTT (Speaking với Giáo viên)
- **v6**: Mock S Chuyên gia (Speaking với Chuyên gia)

---

## Endpoints

### 1. Lấy tất cả ví học sinh

Lấy danh sách tất cả các ví học sinh trong hệ thống.

**Endpoint:** `GET /student-wallets`

**Response:** `200 OK`

```json
[
  {
    "id": "uuid",
    "studentId": "uuid",
    "student": {
      "id": "uuid",
      "fullname": "Tên học sinh",
      "email": "email@example.com",
      ...
    },
    "v0": 10,
    "v1": 5,
    "v2": 3,
    "v3": 2,
    "v4": 1,
    "v5": 0,
    "v6": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 2. Lấy tất cả profile học sinh kèm ví (có phân trang và tìm kiếm)

Lấy danh sách các profile có UserType là 'user' kèm theo ví tương ứng (nếu có) và tên các khóa học. Endpoint hỗ trợ phân trang và tìm kiếm theo tên, email, hoặc tên khóa học.

**Endpoint:** `GET /student-wallets/profiles/all`

**Query Parameters:**
- `search` (string, optional): Tìm kiếm theo fullname, email, hoặc courseNames (case-insensitive, partial match)
- `page` (number, optional): Số trang (mặc định: 1, tối thiểu: 1)
- `limit` (number, optional): Số lượng item mỗi trang (mặc định: 10, tối thiểu: 1, tối đa: 100)

**Example Requests:**
```
GET /student-wallets/profiles/all?page=1&limit=10
GET /student-wallets/profiles/all?search=Nguyễn&page=1&limit=10
GET /student-wallets/profiles/all?search=ielts&page=1&limit=20
GET /student-wallets/profiles/all?search=example@gmail.com
```

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "fullname": "Tên học sinh",
      "email": "email@example.com",
      "phone": "0123456789",
      "image": "image-url",
      "ieltsPoint": "7.5",
      "currentWeekBusyScheduleArr": [1, 5, 9],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "wallet": {
        "id": "uuid",
        "studentId": "uuid",
        "v0": 10,
        "v1": 5,
        "v2": 3,
        "v3": 2,
        "v4": 1,
        "v5": 0,
        "v6": 0,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      },
      "courseNames": ["IELTS Foundation", "IELTS Intermediate"]
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

**Response Fields:**
- `data`: Mảng các profile với thông tin ví và khóa học
- `total`: Tổng số profile khớp với điều kiện tìm kiếm (nếu có) có UserType là 'user' (không phụ thuộc pagination)
- `page`: Số trang hiện tại
- `limit`: Số lượng item mỗi trang

**Search Behavior:**
- Tìm kiếm không phân biệt hoa thường (case-insensitive)
- Hỗ trợ tìm kiếm một phần (partial match)
- Tìm kiếm trong các trường: `fullname`, `email`, và `courseNames`
- Ví dụ: `search=nguyen` sẽ tìm tất cả profile có fullname, email, hoặc courseNames chứa "nguyen" (không phân biệt hoa thường)

**Lưu ý:** 
- Trường `wallet` có thể là `null` nếu học sinh chưa có ví
- Trường `courseNames` là mảng tên các khóa học mà học sinh đang tham gia (có thể là mảng rỗng `[]` nếu chưa có khóa học nào)
- Khi sử dụng `search`, kết quả sẽ được filter theo điều kiện tìm kiếm và `total` sẽ phản ánh số lượng profile khớp với điều kiện

---

### 3. Lấy ví học sinh theo ID

Lấy thông tin chi tiết một ví học sinh theo ID của ví.

**Endpoint:** `GET /student-wallets/:id`

**Parameters:**
- `id` (UUID, required): ID của ví học sinh

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "studentId": "uuid",
  "student": {
    "id": "uuid",
    "fullname": "Tên học sinh",
    "email": "email@example.com",
    ...
  },
  "v0": 10,
  "v1": 5,
  "v2": 3,
  "v3": 2,
  "v4": 1,
  "v5": 0,
  "v6": 0,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Response:** `404 Not Found`

```json
{
  "statusCode": 404,
  "message": "Student wallet with ID {id} not found"
}
```

---

### 4. Lấy ví học sinh theo Student ID

Lấy thông tin ví học sinh theo ID của học sinh (profile ID).

**Endpoint:** `GET /student-wallets/student/:studentId`

**Parameters:**
- `studentId` (UUID, required): ID của học sinh (profile ID)

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "studentId": "uuid",
  "student": {
    "id": "uuid",
    "fullname": "Tên học sinh",
    "email": "email@example.com",
    ...
  },
  "v0": 10,
  "v1": 5,
  "v2": 3,
  "v3": 2,
  "v4": 1,
  "v5": 0,
  "v6": 0,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Response:** `404 Not Found`

```json
{
  "statusCode": 404,
  "message": "Student wallet for student ID {studentId} not found"
}
```

---

### 5. Tạo ví học sinh mới

Tạo một ví mới cho học sinh. Mỗi học sinh chỉ có thể có một ví duy nhất.

**Endpoint:** `POST /student-wallets`

**Request Body:**

```json
{
  "studentId": "uuid",  // Required: ID của học sinh (profile ID)
  "v0": 0,              // Optional: Buổi chính (default: 0)
  "v1": 0,              // Optional: Bổ trợ BTG với GV (default: 0)
  "v2": 0,              // Optional: Bổ trợ BTG với Tutor (default: 0)
  "v3": 0,              // Optional: Bổ trợ yếu BTS (default: 0)
  "v4": 0,              // Optional: Mock 3 kỹ năng LRW (default: 0)
  "v5": 0,              // Optional: Mock S GVTT (default: 0)
  "v6": 0               // Optional: Mock S Chuyên gia (default: 0)
}
```

**Validation Rules:**
- `studentId`: Phải là UUID hợp lệ
- `v0-v6`: Phải là số nguyên >= 0 (nếu được cung cấp)

**Response:** `201 Created`

```json
{
  "id": "uuid",
  "studentId": "uuid",
  "v0": 0,
  "v1": 0,
  "v2": 0,
  "v3": 0,
  "v4": 0,
  "v5": 0,
  "v6": 0,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**

`400 Bad Request` - Validation error:
```json
{
  "statusCode": 400,
  "message": ["studentId must be a UUID", "v0 must be an integer"]
}
```

`404 Not Found` - Student not found:
```json
{
  "statusCode": 404,
  "message": "Student with ID {studentId} not found"
}
```

`409 Conflict` - Wallet already exists:
```json
{
  "statusCode": 409,
  "message": "Student wallet for student ID {studentId} already exists"
}
```

---

### 6. Cập nhật ví học sinh theo ID

Cập nhật thông tin ví học sinh theo ID của ví. Chỉ cập nhật các trường được cung cấp.

**Endpoint:** `PUT /student-wallets/:id`

**Parameters:**
- `id` (UUID, required): ID của ví học sinh

**Request Body:**

```json
{
  "v0": 10,   // Optional: Buổi chính
  "v1": 5,    // Optional: Bổ trợ BTG với GV
  "v2": 3,    // Optional: Bổ trợ BTG với Tutor
  "v3": 2,    // Optional: Bổ trợ yếu BTS
  "v4": 1,    // Optional: Mock 3 kỹ năng LRW
  "v5": 0,    // Optional: Mock S GVTT
  "v6": 0     // Optional: Mock S Chuyên gia
}
```

**Validation Rules:**
- Tất cả các trường đều optional
- Nếu cung cấp, phải là số nguyên >= 0

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "studentId": "uuid",
  "v0": 10,
  "v1": 5,
  "v2": 3,
  "v3": 2,
  "v4": 1,
  "v5": 0,
  "v6": 0,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

**Error Responses:**

`400 Bad Request` - Validation error:
```json
{
  "statusCode": 400,
  "message": ["v0 must be an integer", "v1 must be a positive number or zero"]
}
```

`404 Not Found` - Wallet not found:
```json
{
  "statusCode": 404,
  "message": "Student wallet with ID {id} not found"
}
```

---

### 7. Cập nhật ví học sinh theo Student ID

Cập nhật thông tin ví học sinh theo ID của học sinh (profile ID).

**Endpoint:** `PUT /student-wallets/student/:studentId`

**Parameters:**
- `studentId` (UUID, required): ID của học sinh (profile ID)

**Request Body:**

```json
{
  "v0": 10,   // Optional: Buổi chính
  "v1": 5,    // Optional: Bổ trợ BTG với GV
  "v2": 3,    // Optional: Bổ trợ BTG với Tutor
  "v3": 2,    // Optional: Bổ trợ yếu BTS
  "v4": 1,    // Optional: Mock 3 kỹ năng LRW
  "v5": 0,    // Optional: Mock S GVTT
  "v6": 0     // Optional: Mock S Chuyên gia
}
```

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "studentId": "uuid",
  "v0": 10,
  "v1": 5,
  "v2": 3,
  "v3": 2,
  "v4": 1,
  "v5": 0,
  "v6": 0,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

**Error Responses:**

`404 Not Found` - Wallet not found:
```json
{
  "statusCode": 404,
  "message": "Student wallet for student ID {studentId} not found"
}
```

---

### 8. Xóa ví học sinh theo ID

Xóa một ví học sinh theo ID của ví.

**Endpoint:** `DELETE /student-wallets/:id`

**Parameters:**
- `id` (UUID, required): ID của ví học sinh

**Response:** `204 No Content`

**Error Response:** `404 Not Found`

```json
{
  "statusCode": 404,
  "message": "Student wallet with ID {id} not found"
}
```

---

### 9. Xóa ví học sinh theo Student ID

Xóa ví học sinh theo ID của học sinh (profile ID).

**Endpoint:** `DELETE /student-wallets/student/:studentId`

**Parameters:**
- `studentId` (UUID, required): ID của học sinh (profile ID)

**Response:** `204 No Content`

**Error Response:** `404 Not Found`

```json
{
  "statusCode": 404,
  "message": "Student wallet for student ID {studentId} not found"
}
```

---

## Status Codes

| Status Code | Mô tả |
|------------|-------|
| 200 | OK - Request thành công |
| 201 | Created - Tạo resource thành công |
| 204 | No Content - Xóa thành công (không có response body) |
| 400 | Bad Request - Validation error hoặc request không hợp lệ |
| 404 | Not Found - Resource không tồn tại |
| 409 | Conflict - Resource đã tồn tại (ví dụ: ví đã có cho học sinh) |

## Validation

- Tất cả ID phải là UUID hợp lệ
- Các giá trị ví (v0-v6) phải là số nguyên >= 0
- Mỗi học sinh chỉ có thể có một ví duy nhất

## Notes

- Tất cả các endpoints đều sử dụng `TransformInterceptor` và `ClassSerializerInterceptor` để format response
- Timestamps được trả về theo format ISO 8601
- Khi cập nhật ví, chỉ các trường được cung cấp mới được cập nhật, các trường khác giữ nguyên giá trị cũ

