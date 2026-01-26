# Student Wallet Management System

Hệ thống quản lý ví học sinh với tracking lịch sử thay đổi chi tiết.

## 📁 Cấu trúc thư mục

```
accounting/wallets/
├── page.tsx                          # Trang quản lý ví chính
├── history/
│   └── page.tsx                      # Trang lịch sử tất cả học sinh
├── student/
│   └── [studentId]/
│       └── page.tsx                  # Trang chi tiết ví của từng học sinh
├── STUDENT_WALLET_AUDIT_API.md      # API documentation
└── README.md                         # File này
```

## 🎯 Các tính năng

### 1. Trang quản lý ví chính (`/accounting/wallets`)

**Chức năng:**
- Xem danh sách tất cả học sinh và trạng thái ví
- Hiển thị số dư cho 8 loại ví (v0-v7):
  - **v0**: Buổi chính
  - **v1**: Bổ trợ BTG với Giáo viên
  - **v2**: Bổ trợ BTG với Tutor
  - **v3**: Bổ trợ yếu BTS
  - **v4**: Mock 3 kỹ năng LRW
  - **v5**: Mock S GVTT
  - **v6**: Mock S Chuyên gia
  - **v7**: Ví dự trữ (Reserve wallet)
- Nạp thêm voucher cho học sinh
- Tạo ví mới (nạp lần đầu)
- Xóa ví học sinh
- Tìm kiếm theo tên, email, khóa học
- Lọc theo trạng thái ví (có/chưa có)
- Pagination

**Thao tác:**
- 👁️ **Xem chi tiết**: Xem thông tin ví và lịch sử của học sinh
- ➕ **Nạp thêm**: Thêm voucher vào ví đã tồn tại
- 💰 **Tạo ví**: Tạo ví mới và nạp voucher lần đầu
- 🗑️ **Xóa ví**: Xóa ví và toàn bộ số dư (không thể hoàn tác)
- 📋 **Xem lịch sử**: Chuyển sang trang lịch sử tổng hợp

### 2. Trang lịch sử tổng hợp (`/accounting/wallets/history`)

**Chức năng:**
- Xem lịch sử thay đổi của tất cả học sinh
- Filter theo:
  - Student ID (UUID)
  - Loại thao tác (INSERT, UPDATE, DELETE, INCREASE, ROLLCALL)
  - Khoảng thời gian (từ ngày - đến ngày)
- Hiển thị chi tiết delta changes cho từng ví
- Xem snapshot đầy đủ trước/sau thay đổi
- Pagination với điều hướng nhanh

**Loại thao tác:**
- 🆕 **Tạo mới** (INSERT): Tạo ví mới
- ℹ️ **Cập nhật** (UPDATE): Thay đổi số dư ví
- ❌ **Xóa** (DELETE): Xóa ví
- ➕ **Nạp thêm** (INCREASE): Nạp voucher vào ví
- ⚠️ **Điểm danh** (ROLLCALL): Trừ voucher khi điểm danh

**Thông tin hiển thị:**
- ID bản ghi
- Thời gian thay đổi
- Người thực hiện
- Số lượng ví bị thay đổi
- Chi tiết delta: Tang (nạp), Giam (dùng), Ton (tồn) cho từng ví

### 3. Trang chi tiết học sinh (`/accounting/wallets/student/[studentId]`)

**Chức năng:**
- Hiển thị trạng thái ví hiện tại của học sinh
- Thống kê tổng hợp thay đổi theo khoảng thời gian
- Lịch sử thay đổi chi tiết của học sinh
- Filter theo loại thao tác và khoảng thời gian
- Expand để xem chi tiết delta changes

**Thống kê:**
- Tổng số voucher nạp vào (tang)
- Tổng số voucher đã dùng (giam)
- Số dư thay đổi (ton)
- Hiển thị cho từng loại ví có thay đổi

## 🔧 Hooks & API

### Custom Hooks

#### `useStudentWallet.ts`
Quản lý dữ liệu ví học sinh:
- `useGetAllWallets()` - Lấy tất cả ví
- `useGetAllProfilesWithWallets(params)` - Lấy danh sách học sinh với ví
- `useGetWalletById(id)` - Lấy ví theo ID
- `useGetWalletByStudentId(studentId)` - Lấy ví theo student ID
- `useIncreaseWallet()` - Nạp thêm voucher
- `useDeleteWalletById(id)` - Xóa ví theo ID
- `useDeleteWalletByStudentId(studentId)` - Xóa ví theo student ID

#### `useStudentWalletAudit.ts`
Quản lý audit logs:
- `useSearchAuditLogs(params)` - Tìm kiếm audit logs
- `useGetAuditLogsByStudentId(studentId, params)` - Lấy logs của học sinh
- `useGetAuditLogsByWalletId(walletId, params)` - Lấy logs của ví
- `useGetStudentAuditSummary(studentId, params)` - Lấy tổng hợp thay đổi

### API Endpoints

Chi tiết đầy đủ tại: [STUDENT_WALLET_AUDIT_API.md](./STUDENT_WALLET_AUDIT_API.md)

**Wallet Management:**
```
GET    /student-wallets
GET    /student-wallets/profiles/all
GET    /student-wallets/:id
GET    /student-wallets/student/:studentId
POST   /student-wallets/increase
DELETE /student-wallets/:id
DELETE /student-wallets/student/:studentId
```

**Audit Logs:**
```
GET /student-wallet-audit/search
GET /student-wallet-audit/student/:studentId
GET /student-wallet-audit/wallet/:walletId
GET /student-wallet-audit/student/:studentId/summary
```

## 💡 Sử dụng

### 1. Nạp voucher cho học sinh

1. Vào trang `/accounting/wallets`
2. Tìm học sinh cần nạp
3. Click nút ➕ (Nạp thêm) hoặc 💰 (Tạo ví)
4. Nhập số lượng voucher cho từng loại ví
5. Click "Nạp thêm" hoặc "Tạo và Nạp"

### 2. Xem lịch sử học sinh

**Cách 1: Từ trang chính**
1. Vào trang `/accounting/wallets`
2. Click nút 👁️ ở hàng học sinh
3. Xem chi tiết ví và lịch sử

**Cách 2: Từ URL trực tiếp**
1. Truy cập `/accounting/wallets/student/[studentId]`
2. Thay `[studentId]` bằng UUID của học sinh

### 3. Tra cứu lịch sử tổng hợp

1. Vào trang `/accounting/wallets/history`
2. Sử dụng filters:
   - **Student ID**: Nhập UUID để xem lịch sử của học sinh cụ thể
   - **Loại thao tác**: Chọn loại thao tác muốn xem
   - **Từ ngày - Đến ngày**: Chọn khoảng thời gian
3. Click vào dòng để expand xem chi tiết delta
4. Click nút 👁️ để xem snapshot đầy đủ

### 4. Phân tích thay đổi

**Xem tổng hợp:**
1. Vào `/accounting/wallets/student/[studentId]`
2. Chọn khoảng thời gian (Từ ngày - Đến ngày)
3. Xem phần "Tổng hợp thay đổi" để biết:
   - Tổng voucher nạp vào
   - Tổng voucher đã sử dụng
   - Số dư thay đổi

**Xem chi tiết từng thao tác:**
1. Scroll xuống phần "Lịch sử thay đổi"
2. Click nút mũi tên để expand
3. Xem delta cho từng loại ví

## 🎨 UI Components

### Styled Components

- **StyledTableCell**: Header của bảng với màu primary
- **ReserveTableCell**: Header đặc biệt cho ví dự trữ (v7)
- **WalletChip**: Chip hiển thị số dư với màu động
- **DeltaChip**: Chip hiển thị thay đổi (+/-)
- **SummaryCard**: Card tổng hợp với border đặc biệt

### Color Scheme

**Wallet Status:**
- 🟢 Số dư > 0: Success colors
- ⚪ Số dư = 0: Grey colors
- 🟡 Ví dự trữ (v7): Warning colors

**Operations:**
- 🟢 INSERT (Tạo mới): Success
- 🔵 UPDATE (Cập nhật): Info
- 🔴 DELETE (Xóa): Error
- 🟣 INCREASE (Nạp thêm): Primary
- 🟡 ROLLCALL (Điểm danh): Warning

**Delta Changes:**
- 🟢 Tăng (+): Success colors
- 🔴 Giảm (-): Error colors
- ⚪ Không đổi (0): Grey colors

## 📊 Data Structure

### Wallet Detail
```typescript
{
  tang: number;  // Tổng số nạp vào
  giam: number;  // Tổng số đã dùng
  ton: number;   // Số dư còn lại (tang - giam)
}
```

### Audit Record
```typescript
{
  id: number;
  walletId?: string;
  studentId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'INCREASE' | 'ROLLCALL';
  changedAt: string;
  changedBy?: string;
  changedByUsername?: string;
  v0Delta?: WalletDelta;
  v1Delta?: WalletDelta;
  // ... v2-v7Delta
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
}
```

## 🔐 Permissions

Tất cả các trang yêu cầu authentication. Token được lưu trong localStorage và tự động gửi qua header.

## 🚀 Performance

- **Pagination**: Mặc định 10-20 records/page
- **Server-side filtering**: Search được xử lý trên backend
- **Client-side filtering**: Wallet status filter (có/chưa có ví)
- **Lazy loading**: Expand rows chỉ render khi cần
- **Auto-refetch**: Sau mỗi mutation thành công

## 🐛 Troubleshooting

### Không hiển thị dữ liệu
- Kiểm tra API endpoint trong `apiClient.ts`
- Kiểm tra token authentication
- Mở DevTools Console để xem errors

### Filter không hoạt động
- Date filter yêu cầu cả startDate và endDate
- Student ID phải là UUID hợp lệ
- Đảm bảo backend hỗ trợ các query parameters

### Delta không hiển thị
- Delta chỉ hiển thị khi có thay đổi
- Kiểm tra database trigger có hoạt động không
- Xem API response trong DevTools Network tab

## 📝 Notes

- Xóa ví là thao tác không thể hoàn tác
- Audit logs được tự động tạo bởi database trigger
- Số dư tồn = tang - giam
- Ví dự trữ (v7) có giao diện và màu sắc đặc biệt
- Date filter sử dụng ISO 8601 format (YYYY-MM-DD)

## 🔗 Related Files

- `/src/@core/hooks/useStudentWallet.ts` - Wallet management hooks
- `/src/@core/hooks/useStudentWalletAudit.ts` - Audit logs hooks
- `/src/@core/hooks/apiClient.ts` - Axios client configuration
- `STUDENT_WALLET_AUDIT_API.md` - Full API documentation

---

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Maintained by:** Development Team

