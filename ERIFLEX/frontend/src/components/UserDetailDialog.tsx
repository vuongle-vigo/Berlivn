import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface UserDetailProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserDetailDialog({ user, open, onOpenChange }: UserDetailProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Chi tiết người dùng</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-red-600 border-b-2 border-red-200 pb-2">
                Thông tin công ty
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.company ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Tên công ty</Label>
                      <p className="font-medium">{user.company.name || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Số đăng ký</Label>
                      <p className="font-medium">{user.company.registration_number || '-'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Hoạt động</Label>
                      <p className="font-medium">{user.company.activities || '-'}</p>
                    </div>
                    {user.company.activities === 'Khác' && user.company.activities_other && (
                      <div>
                        <Label className="text-gray-600">Hoạt động khác</Label>
                        <p className="font-medium">{user.company.activities_other}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Số lượng nhân viên</Label>
                      <p className="font-medium">{user.company.employee_count || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Số điện thoại chung</Label>
                      <p className="font-medium">{user.company.phone || '-'}</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 italic">Chưa có thông tin công ty</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-blue-600 border-b-2 border-blue-200 pb-2">
                Thông tin người dùng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Email</Label>
                  <p className="font-medium">{user.email || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Họ và tên</Label>
                  <p className="font-medium">{user.full_name || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Tên</Label>
                  <p className="font-medium">{user.first_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Họ và tên đệm</Label>
                  <p className="font-medium">{user.last_name || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Chức vụ</Label>
                  <p className="font-medium">{user.position || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Vai trò hệ thống</Label>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role === 'admin' ? 'Admin' : 'User'}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-gray-600">Địa chỉ chuyên nghiệp</Label>
                <p className="font-medium">{user.professional_address || '-'}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-600">Mã bưu chính</Label>
                  <p className="font-medium">{user.postal_code || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Thành phố</Label>
                  <p className="font-medium">{user.city || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Quốc gia</Label>
                  <p className="font-medium">{user.country || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Số điện thoại trực tiếp</Label>
                  <p className="font-medium">{user.direct_phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Số điện thoại di động</Label>
                  <p className="font-medium">{user.mobile_phone || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Giới hạn tra cứu/ngày</Label>
                  <p className="font-medium">{user.daily_search_limit || '0'}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Trạng thái</Label>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.is_active ? 'Hoạt động' : 'Tạm khóa'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Ngày tạo</Label>
                  <p className="font-medium">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600">Cập nhật lần cuối</Label>
                  <p className="font-medium">
                    {user.updated_at ? new Date(user.updated_at).toLocaleDateString('vi-VN') : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
