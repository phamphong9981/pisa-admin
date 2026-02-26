# Student Wallet Audit API Documentation

## Tổng quan

API quản lý audit log (lịch sử thay đổi) của bảng `student_wallets`. Hệ thống tự động ghi lại tất cả các thao tác INSERT, UPDATE, DELETE trên bảng student_wallets và lưu trữ:
- **Delta values**: Số lượng thay đổi cho từng ví (v0-v7) với các trường `tang` (tăng), `giam` (giảm), `ton` (tồn)
- **Full snapshots**: Trạng thái đầy đủ trước và sau khi thay đổi

## Base URL

```
/student-wallet-audit
```

## Cấu trúc dữ liệu

### StudentWalletAudit Entity

```typescript
{
  id: number;                    // ID của audit log (BIGINT, tự động tăng)
  walletId?: string;             // UUID của wallet record (nullable, không có FK để giữ log khi xóa)
  studentId: string;             // UUID của học sinh
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'INCREASE' | 'ROLLCALL';  // Loại thao tác
  changedAt: Date;               // Thời gian thay đổi (TIMESTAMPTZ)
  changedBy?: string;            // User ID người thực hiện (có thể là 'system')
  
  // Delta values - Số lượng thay đổi cho từng ví
  v0Delta?: {                    // Ví chính (buổi chính)
    tang: number;                 // Số lượng tăng
    giam: number;                 // Số lượng giảm
    ton: number;                  // Số lượng tồn thay đổi
  };
  v1Delta?: {                    // Bổ trợ BTG với GV
    tang: number;
    giam: number;
    ton: number;
  };
  v2Delta?: {                    // Bổ trợ BTG với Tutor
    tang: number;
    giam: number;
    ton: number;
  };
  v3Delta?: {                    // Bổ trợ yếu BTS
    tang: number;
    giam: number;
    ton: number;
  };
  v4Delta?: {                    // Mock 3 kỹ năng LRW
    tang: number;
    giam: number;
    ton: number;
  };
  v5Delta?: {                    // Mock S GVTT
    tang: number;
    giam: number;
    ton: number;
  };
  v6Delta?: {                    // Mock S Chuyên gia
    tang: number;
    giam: number;
    ton: number;
  };
  v7Delta?: {                    // Ví dự trữ (Reserve wallet)
    tang: number;
    giam: number;
    ton: number;
  };
  
  // Full record snapshots
  oldValues?: Record<string, any>;  // Trạng thái trước khi thay đổi (NULL cho INSERT)
  newValues?: Record<string, any>;  // Trạng thái sau khi thay đổi (NULL cho DELETE)
}
```

### Các trường trong old_values và new_values

Các trường JSONB `old_values` và `new_values` chứa toàn bộ thông tin của wallet record tại thời điểm thay đổi:

```typescript
{
  id: string;
  student_id: string;
  v0: { tang: number; giam: number; ton: number };
  v1: { tang: number; giam: number; ton: number };
  v2: { tang: number; giam: number; ton: number };
  v3: { tang: number; giam: number; ton: number };
  v4: { tang: number; giam: number; ton: number };
  v5: { tang: number; giam: number; ton: number };
  v6: { tang: number; giam: number; ton: number };
  v7: { tang: number; giam: number; ton: number };
  created_at: string;
  updated_at: string;
}
```

### Wallet Types (Loại ví)

| Ví | Mô tả |
|----|-------|
| **v0** | Ví chính (buổi chính) |
| **v1** | Bổ trợ BTG với GV |
| **v2** | Bổ trợ BTG với Tutor |
| **v3** | Bổ trợ yếu BTS |
| **v4** | Mock 3 kỹ năng LRW |
| **v5** | Mock S GVTT |
| **v6** | Mock S Chuyên gia |
| **v7** | Ví dự trữ (Reserve wallet) |

### Operations (Loại thao tác)

| Operation | Mô tả |
|-----------|-------|
| **INSERT** | Tạo mới wallet |
| **UPDATE** | Cập nhật wallet (thay đổi giá trị tuyệt đối) |
| **DELETE** | Xóa wallet |
| **INCREASE** | Tăng số lượng (thêm vào tang và ton) |
| **ROLLCALL** | Thay đổi do điểm danh (trừ vào giam và ton) |

---

## Endpoints

### 1. Tìm kiếm audit logs với filters và pagination

Tìm kiếm lịch sử thay đổi của student wallets với các bộ lọc tùy chọn và hỗ trợ phân trang.

**Endpoint:** `GET /student-wallet-audit/search`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studentId` | string (UUID) | No | UUID của học sinh để lọc |
| `walletId` | string (UUID) | No | UUID của wallet để lọc |
| `operation` | string | No | Loại thao tác: `INSERT`, `UPDATE`, `DELETE`, `INCREASE`, `ROLLCALL` |
| `startDate` | string (ISO 8601) | No | Ngày bắt đầu (YYYY-MM-DD hoặc YYYY-MM-DDTHH:mm:ss.sssZ) |
| `endDate` | string (ISO 8601) | No | Ngày kết thúc (YYYY-MM-DD hoặc YYYY-MM-DDTHH:mm:ss.sssZ) |
| `changedBy` | string (UUID) | No | User ID người thực hiện thay đổi |
| `limit` | number | No | Số lượng kết quả mỗi trang (mặc định: 100, tối đa: 1000) |
| `page` | number | No | Số trang (mặc định: 1) |

**Example Requests:**

```bash
# Tìm tất cả audit logs
GET /student-wallet-audit/search

# Tìm theo studentId
GET /student-wallet-audit/search?studentId=550e8400-e29b-41d4-a716-446655440000

# Tìm theo operation
GET /student-wallet-audit/search?operation=UPDATE

# Tìm theo khoảng thời gian
GET /student-wallet-audit/search?startDate=2024-01-01&endDate=2024-01-31

# Tìm theo người thực hiện
GET /student-wallet-audit/search?changedBy=user-uuid-here

# Kết hợp nhiều filter
GET /student-wallet-audit/search?studentId=550e8400-e29b-41d4-a716-446655440000&operation=UPDATE&startDate=2024-01-01&endDate=2024-01-31&limit=50&page=1
```

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": 12345,
      "walletId": "550e8400-e29b-41d4-a716-446655440000",
      "studentId": "550e8400-e29b-41d4-a716-446655440001",
      "operation": "UPDATE",
      "changedAt": "2024-01-15T10:30:00.000Z",
      "changedBy": "user-uuid-here",
      "changedByUsername": "admin",
      "v0Delta": {
        "tang": 0,
        "giam": 1,
        "ton": -1
      },
      "v1Delta": null,
      "v2Delta": null,
      "v3Delta": null,
      "v4Delta": null,
      "v5Delta": null,
      "v6Delta": null,
      "v7Delta": null,
      "oldValues": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "student_id": "550e8400-e29b-41d4-a716-446655440001",
        "v0": { "tang": 10, "giam": 5, "ton": 5 },
        "v1": { "tang": 5, "giam": 2, "ton": 3 },
        "v2": { "tang": 0, "giam": 0, "ton": 0 },
        "v3": { "tang": 0, "giam": 0, "ton": 0 },
        "v4": { "tang": 0, "giam": 0, "ton": 0 },
        "v5": { "tang": 0, "giam": 0, "ton": 0 },
        "v6": { "tang": 0, "giam": 0, "ton": 0 },
        "v7": { "tang": 0, "giam": 0, "ton": 0 },
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-15T10:00:00.000Z"
      },
      "newValues": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "student_id": "550e8400-e29b-41d4-a716-446655440001",
        "v0": { "tang": 10, "giam": 6, "ton": 4 },
        "v1": { "tang": 5, "giam": 2, "ton": 3 },
        "v2": { "tang": 0, "giam": 0, "ton": 0 },
        "v3": { "tang": 0, "giam": 0, "ton": 0 },
        "v4": { "tang": 0, "giam": 0, "ton": 0 },
        "v5": { "tang": 0, "giam": 0, "ton": 0 },
        "v6": { "tang": 0, "giam": 0, "ton": 0 },
        "v7": { "tang": 0, "giam": 0, "ton": 0 },
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      }
    },
    {
      "id": 12344,
      "walletId": "550e8400-e29b-41d4-a716-446655440002",
      "studentId": "550e8400-e29b-41d4-a716-446655440003",
      "operation": "INCREASE",
      "changedAt": "2024-01-15T09:00:00.000Z",
      "changedBy": "user-uuid-here",
      "changedByUsername": "admin",
      "v0Delta": {
        "tang": 5,
        "giam": 0,
        "ton": 5
      },
      "v1Delta": null,
      "v2Delta": null,
      "v3Delta": null,
      "v4Delta": null,
      "v5Delta": null,
      "v6Delta": null,
      "v7Delta": null,
      "oldValues": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "student_id": "550e8400-e29b-41d4-a716-446655440003",
        "v0": { "tang": 5, "giam": 0, "ton": 5 }
      },
      "newValues": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "student_id": "550e8400-e29b-41d4-a716-446655440003",
        "v0": { "tang": 10, "giam": 0, "ton": 10 }
      }
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 100,
  "totalPages": 2
}
```

**Response Fields:**
- `data`: Mảng các audit log records
- `total`: Tổng số records
- `page`: Trang hiện tại
- `limit`: Số lượng records mỗi trang
- `totalPages`: Tổng số trang

**Lưu ý:**
- Kết quả được sắp xếp theo `changedAt DESC` (mới nhất trước)
- Delta values chỉ có giá trị khi có thay đổi cho ví đó, nếu không sẽ là `null`
- Có thể kết hợp nhiều filter cùng lúc (AND logic)
- Pagination mặc định: `limit=100`, `page=1`

---

### 2. Lấy tất cả audit logs của một học sinh

**Endpoint:** `GET /student-wallet-audit/student/:studentId`

**Path Parameters:**
- `studentId` (UUID, required): UUID của học sinh

**Query Parameters:**
- Hỗ trợ tất cả query parameters từ endpoint `/search` (operation, startDate, endDate, limit, page, etc.)

**Example Request:**

```bash
GET /student-wallet-audit/student/550e8400-e29b-41d4-a716-446655440000
```

**Response:** `200 OK`

Tương tự như response của endpoint `/search`, nhưng đã được filter theo `studentId`.

---

### 3. Lấy tất cả audit logs của một wallet

**Endpoint:** `GET /student-wallet-audit/wallet/:walletId`

**Path Parameters:**
- `walletId` (UUID, required): UUID của wallet

**Query Parameters:**
- Hỗ trợ tất cả query parameters từ endpoint `/search` (operation, startDate, endDate, limit, page, etc.)

**Example Request:**

```bash
GET /student-wallet-audit/wallet/550e8400-e29b-41d4-a716-446655440000
```

**Response:** `200 OK`

Tương tự như response của endpoint `/search`, nhưng đã được filter theo `walletId`.

---

### 4. Lấy tổng hợp delta changes (Delta Summary)

Tính tổng tất cả các thay đổi (delta) cho tất cả các ví của học sinh trong một khoảng thời gian, bao gồm tồn đầu kỳ và tồn cuối kỳ, hỗ trợ tìm kiếm mảng nhiều học sinh bằng regionId. Chỉ tính các học sinh đang học (course có `status = 'active'`) và hồ sơ khóa học chưa xóa (`is_deleted = false`).

**Endpoint:** `GET /student-wallet-audit/summary`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studentId` | string (UUID) | No | UUID của học sinh. |
| `regionId` | number | No | ID của cơ sở (region). Nếu truyền `regionId`, sẽ lấy tất cả học sinh thuộc cơ sở đó. |
| `startDate` | string (ISO 8601) | No | Ngày bắt đầu (YYYY-MM-DD hoặc YYYY-MM-DDTHH:mm:ss.sssZ). Nếu không có, sẽ tính từ bản ghi đầu tiên |
| `endDate` | string (ISO 8601) | No | Ngày kết thúc (YYYY-MM-DD hoặc YYYY-MM-DDTHH:mm:ss.sssZ). Nếu không có, sẽ tính đến bản ghi cuối cùng |
| `page` | number | No | Phân trang: số trang (mặc định 1) |
| `limit` | number | No | Phân trang: số bản ghi mỗi trang (mặc định 100) |

**Example Request:**

```bash
# Tổng hợp tất cả thay đổi của 1 học sinh
GET /student-wallet-audit/summary?studentId=550e8400-e29b-41d4-a716-446655440000

# Tổng hợp tất cả thay đổi của các học sinh thuộc 1 cơ sở (region)
GET /student-wallet-audit/summary?regionId=1

# Tổng hợp theo cơ sở trong khoảng thời gian cụ thể (kết hợp phân trang)
GET /student-wallet-audit/summary?regionId=1&startDate=2024-01-01&endDate=2024-01-31&page=1&limit=50
```

**Response:** `200 OK`

```json
{
  "data": [
    {
      "studentId": "550e8400-e29b-41d4-a716-446655440000",
      "studentFullName": "Nguyen Van A",
      "courseName": "IELTS Foundation, IELTS Intermediate",
      "summary": {
        "v0": { "tang": 15, "giam": 8, "ton": 7, "tonDau": 10, "tonCuoi": 17 },
        "v1": { "tang": 5, "giam": 2, "ton": 3, "tonDau": 5, "tonCuoi": 8 },
        "v2": { "tang": 0, "giam": 0, "ton": 0, "tonDau": 0, "tonCuoi": 0 },
        "v3": { "tang": 0, "giam": 0, "ton": 0, "tonDau": 0, "tonCuoi": 0 },
        "v4": { "tang": 0, "giam": 0, "ton": 0, "tonDau": 0, "tonCuoi": 0 },
        "v5": { "tang": 0, "giam": 0, "ton": 0, "tonDau": 0, "tonCuoi": 0 },
        "v6": { "tang": 0, "giam": 0, "ton": 0, "tonDau": 0, "tonCuoi": 0 },
        "v7": { "tang": 0, "giam": 0, "ton": 0, "tonDau": 0, "tonCuoi": 0 }
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 100,
  "totalPages": 1
}
```

**Response Fields:**
- `data`: Mảng kết quả tổng hợp của từng học sinh (studentId, fullname, các course đang học, và block summary tương tự trên).
- `total`, `page`, `limit`, `totalPages`: Thông tin phân trang.
- Mỗi ví (v0-v7) trong block `summary` có 5 trường:
  - `tang`: Tổng số lượng tăng trong kỳ (tổng của tất cả `tang` delta từ các bản ghi trong kỳ)
  - `giam`: Tổng số lượng giảm trong kỳ (tổng của tất cả `giam` delta từ các bản ghi trong kỳ)
  - `ton`: Tổng thay đổi tồn trong kỳ (tổng của tất cả `ton` delta từ các bản ghi trong kỳ)
  - `tonDau`: Tồn đầu kỳ (lấy từ `old_values.vX.ton` của bản ghi audit đầu tiên trong kỳ, sắp xếp theo `changed_at ASC`)
  - `tonCuoi`: Tồn cuối kỳ (lấy từ `new_values.vX.ton` của bản ghi audit cuối cùng trong kỳ, sắp xếp theo `changed_at DESC`)

**Cách tính toán:**

1. **Tổng delta (tang, giam, ton)**:
   - Tính tổng tất cả các giá trị delta từ các bản ghi audit trong khoảng thời gian được chỉ định
   - Công thức: `SUM(vX_delta->>'field')` cho tất cả các bản ghi thỏa điều kiện

2. **Tồn đầu kỳ (tonDau)**:
   - Lấy từ `old_values.vX.ton` của bản ghi audit **đầu tiên** trong kỳ (ORDER BY `changed_at ASC LIMIT 1`)
   - Đây là số dư tồn **trước khi** xảy ra thay đổi đầu tiên trong kỳ
   - Nếu bản ghi đầu tiên là INSERT (không có `old_values`), `tonDau` sẽ là `0`

3. **Tồn cuối kỳ (tonCuoi)**:
   - Lấy từ `new_values.vX.ton` của bản ghi audit **cuối cùng** trong kỳ (ORDER BY `changed_at DESC LIMIT 1`)
   - Đây là số dư tồn **sau khi** xảy ra thay đổi cuối cùng trong kỳ
   - Nếu bản ghi cuối cùng là DELETE (không có `new_values`), `tonCuoi` sẽ là `0`

**Công thức kiểm tra:**
```
tonCuoi = tonDau + ton
```

Trong đó:
- `tonCuoi`: Tồn cuối kỳ
- `tonDau`: Tồn đầu kỳ
- `ton`: Tổng thay đổi tồn trong kỳ (có thể âm nếu giảm nhiều hơn tăng)

**Lưu ý quan trọng:**

1. **Khoảng thời gian:**
   - Nếu không có `startDate` và `endDate`: Tính tổng tất cả thay đổi từ bản ghi đầu tiên đến bản ghi cuối cùng
   - Nếu chỉ có `startDate`: Tính từ ngày đó đến bản ghi cuối cùng
   - Nếu chỉ có `endDate`: Tính từ bản ghi đầu tiên đến ngày đó
   - Nếu có cả hai: Tính trong khoảng thời gian được chỉ định

2. **Các trường hợp đặc biệt:**
   - Nếu không có bản ghi nào trong kỳ: Tất cả giá trị sẽ là `0`
   - Nếu bản ghi đầu tiên là INSERT: `tonDau = 0` (vì `old_values` là `null`)
   - Nếu bản ghi cuối cùng là DELETE: `tonCuoi = 0` (vì `new_values` là `null`)
   - Các giá trị delta có thể âm nếu có nhiều thao tác giảm hơn tăng

3. **Ý nghĩa của các giá trị:**
   - `tang`: Tổng số buổi/tiết được thêm vào ví (qua các thao tác INCREASE hoặc UPDATE tăng)
   - `giam`: Tổng số buổi/tiết bị trừ khỏi ví (qua các thao tác ROLLCALL hoặc UPDATE giảm)
   - `ton`: Tổng thay đổi ròng của số dư tồn (có thể dương hoặc âm)
   - `tonDau`: Số dư tồn tại thời điểm bắt đầu kỳ
   - `tonCuoi`: Số dư tồn tại thời điểm kết thúc kỳ

---

### 5. Xuất dữ liệu tổng hợp delta ra file Excel

Tương tự như API lấy tổng hợp delta changes nhưng sẽ xuất kết quả ra định dạng Excel (`.xlsx`). Chú ý API này **không giới hạn phân trang** (không áp dụng `page` và `limit`), dữ liệu truy xuất sẽ tự động lấy toàn bộ kết quả dựa trên các bộ lọc.

**Endpoint:** `GET /student-wallet-audit/summary/export`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studentId` | string (UUID) | No | UUID của học sinh. |
| `regionId` | number | No | ID của cơ sở (region). Nếu truyền `regionId`, sẽ lấy tất cả học sinh thuộc cơ sở đó. |
| `startDate` | string (ISO 8601) | No | Ngày bắt đầu |
| `endDate` | string (ISO 8601) | No | Ngày kết thúc |

**Example Request:**

```bash
# Xuất toàn bộ học sinh thuộc 1 cơ sở ra file Excel
GET /student-wallet-audit/summary/export?regionId=1&startDate=2024-01-01&endDate=2024-01-31
```

**Response:**
File download với header `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` và tên file có định dạng `delta_summary_<timestamp>.xlsx`.

---

## Use Cases

### 1. Xem lịch sử thay đổi của một học sinh

```bash
# Xem tất cả thay đổi wallet của học sinh
GET /student-wallet-audit/student/550e8400-e29b-41d4-a716-446655440000
```

### 2. Theo dõi thay đổi trong một khoảng thời gian

```bash
# Xem thay đổi trong tháng 1/2024
GET /student-wallet-audit/search?startDate=2024-01-01&endDate=2024-01-31
```

### 3. Kiểm tra các thao tác tăng ví (INCREASE)

```bash
# Xem tất cả thao tác tăng ví
GET /student-wallet-audit/search?operation=INCREASE
```

### 5. Kiểm tra các thao tác điểm danh (ROLLCALL)

```bash
# Xem tất cả thao tác điểm danh ảnh hưởng đến ví
GET /student-wallet-audit/search?operation=ROLLCALL
```

### 6. Xem tổng hợp thay đổi của học sinh / cơ sở

```bash
# Xem tổng hợp tất cả thay đổi từ trước đến nay
GET /student-wallet-audit/summary?studentId=550e8400-e29b-41d4-a716-446655440000

# Xem tổng hợp trong tháng của cả 1 cơ sở
GET /student-wallet-audit/summary?regionId=1&startDate=2024-01-01&endDate=2024-01-31

# Xem tổng hợp từ đầu tháng đến hiện tại
GET /student-wallet-audit/summary?studentId=550e8400-e29b-41d4-a716-446655440000&startDate=2024-01-01

# Xem tổng hợp từ trước đến cuối tháng
GET /student-wallet-audit/summary?studentId=550e8400-e29b-41d4-a716-446655440000&endDate=2024-01-31
```

**Ví dụ sử dụng:**
- Kiểm tra số dư tồn đầu tháng và cuối tháng
- Xem tổng số buổi đã tăng/giảm trong kỳ
- Đối chiếu: `tonCuoi = tonDau + ton`

### 7. So sánh trạng thái trước và sau

```typescript
// Ví dụ: Kiểm tra thay đổi v0
const audit = response.data[0];
if (audit.operation === 'UPDATE') {
  const oldV0 = audit.oldValues?.v0;
  const newV0 = audit.newValues?.v0;
  const delta = audit.v0Delta;
  
  console.log(`v0 changed:`);
  console.log(`  Old: ${oldV0.tang} tang, ${oldV0.giam} giam, ${oldV0.ton} ton`);
  console.log(`  New: ${newV0.tang} tang, ${newV0.giam} giam, ${newV0.ton} ton`);
  console.log(`  Delta: ${delta.tang} tang, ${delta.giam} giam, ${delta.ton} ton`);
}
```

### 8. Theo dõi thay đổi của một người dùng cụ thể

```bash
# Xem tất cả thay đổi do một user thực hiện
GET /student-wallet-audit/search?changedBy=user-uuid-here
```

---

## Status Codes

| Status Code | Mô tả |
|------------|-------|
| 200 | OK - Request thành công |
| 400 | Bad Request - Validation error (ví dụ: UUID không hợp lệ, operation không hợp lệ) |
| 404 | Not Found - Không tìm thấy resource (khi dùng path parameters) |

---

## Validation

### Query Parameters

- `studentId`: Phải là UUID hợp lệ
- `walletId`: Phải là UUID hợp lệ
- `operation`: Phải là một trong các giá trị: `INSERT`, `UPDATE`, `DELETE`, `INCREASE`, `ROLLCALL`
- `startDate`: Phải là ISO 8601 date string (YYYY-MM-DD hoặc YYYY-MM-DDTHH:mm:ss.sssZ)
- `endDate`: Phải là ISO 8601 date string (YYYY-MM-DD hoặc YYYY-MM-DDTHH:mm:ss.sssZ)
- `changedBy`: Phải là UUID hợp lệ
- `limit`: Phải là số nguyên từ 1 đến 1000 (mặc định: 100)
- `page`: Phải là số nguyên >= 1 (mặc định: 1)

### Path Parameters

- `studentId`: Phải là UUID hợp lệ (sử dụng `ParseUUIDPipe`)
- `walletId`: Phải là UUID hợp lệ (sử dụng `ParseUUIDPipe`)

---

## Delta Calculation Logic

### Cách tính Delta

Delta được tính bằng công thức:
```
delta = new_value - old_value
```

Ví dụ:
- `oldValues.v0.ton = 10`
- `newValues.v0.ton = 7`
- `v0Delta.ton = 7 - 10 = -3`

### Các trường hợp đặc biệt

1. **INSERT**: 
   - `oldValues = null`
   - `v0Delta` đến `v7Delta` = giá trị của `newValues` tương ứng

2. **DELETE**:
   - `newValues = null`
   - `v0Delta` đến `v7Delta` = giá trị âm của `oldValues` tương ứng (đảo ngược)

3. **UPDATE**:
   - `v0Delta` đến `v7Delta` = `newValues - oldValues` cho từng ví
   - Nếu một ví không thay đổi, delta tương ứng sẽ là `null` hoặc `{ tang: 0, giam: 0, ton: 0 }`

---

## Notes

- Tất cả các endpoints đều sử dụng `TransformInterceptor` và `ClassSerializerInterceptor` để format response
- Timestamps được trả về theo format ISO 8601
- Audit logs được tự động tạo bởi database trigger khi có thay đổi trên bảng `student_wallets`
- `changedBy` có thể là `'system'` nếu thay đổi được thực hiện bởi hệ thống hoặc không có user context
- GIN indexes được tạo trên `old_values` và `new_values` để tối ưu hiệu suất tìm kiếm JSONB
- `walletId` có thể là `null` trong audit log nếu wallet đã bị xóa (không có FK constraint để giữ log)
- Delta values chỉ được tính cho các ví có thay đổi, các ví không thay đổi sẽ có delta là `null`
- Summary endpoint tính tổng tất cả delta values, có thể dùng để xem tổng thay đổi của học sinh trong một khoảng thời gian

---

## Database Schema

### Indexes

Các indexes được tạo để tối ưu hiệu suất:

- `idx_student_wallet_audit_student_id`: Index trên `student_id` - tìm kiếm nhanh theo học sinh
- `idx_student_wallet_audit_wallet_id`: Index trên `wallet_id` - tìm kiếm nhanh theo wallet
- `idx_student_wallet_audit_changed_at`: Index trên `changed_at` - tìm kiếm nhanh theo thời gian
- `idx_student_wallet_audit_operation`: Index trên `operation` - tìm kiếm nhanh theo loại thao tác
- `idx_student_wallet_audit_student_changed_at`: Composite index trên `(student_id, changed_at DESC)` - tối ưu cho query phổ biến
- `idx_student_wallet_audit_old_values_gin`: GIN index trên `old_values` - tìm kiếm trong JSONB
- `idx_student_wallet_audit_new_values_gin`: GIN index trên `new_values` - tìm kiếm trong JSONB

### Trigger

Trigger `trg_audit_student_wallet` tự động ghi log mỗi khi có INSERT, UPDATE, hoặc DELETE trên bảng `student_wallets`.

Trigger function `func_audit_student_wallet()`:
- Lấy user ID từ `app.current_user_id` config parameter (nếu có)
- Tính delta cho từng ví (v0-v7) bằng function `func_calc_wallet_delta()`
- Lưu full snapshot của old và new values

---

## Error Handling

### Validation Errors (400 Bad Request)

Nếu `operation` không hợp lệ:

```json
{
  "statusCode": 400,
  "message": ["operation must be one of the following values: INSERT, UPDATE, DELETE, INCREASE, ROLLCALL"],
  "error": "Bad Request"
}
```

Nếu `studentId` không phải UUID hợp lệ:

```json
{
  "statusCode": 400,
  "message": ["studentId must be a UUID"],
  "error": "Bad Request"
}
```

Nếu `limit` vượt quá 1000:

```json
{
  "statusCode": 400,
  "message": ["limit must not be greater than 1000"],
  "error": "Bad Request"
}
```

### Not Found (404)

Khi sử dụng path parameters, nếu không tìm thấy:

```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

---

## Examples

### Example 1: Tìm tất cả thay đổi của học sinh trong tháng

```bash
GET /student-wallet-audit/student/550e8400-e29b-41d4-a716-446655440000?startDate=2024-01-01&endDate=2024-01-31&limit=50
```

### Example 2: Xem tổng hợp thay đổi do điểm danh

```bash
GET /student-wallet-audit/search?operation=ROLLCALL&startDate=2024-01-01&endDate=2024-01-31
```

### Example 3: Xem tổng hợp delta của học sinh

```bash
GET /student-wallet-audit/summary?studentId=550e8400-e29b-41d4-a716-446655440000&startDate=2024-01-01&endDate=2024-01-31
```

Response sẽ trả về mảng kết quả trong đó chứa thông tin học sinh và thông tin tổng số lượng tăng/giảm/tồn thay đổi cho từng ví trong khoảng thời gian đó.

