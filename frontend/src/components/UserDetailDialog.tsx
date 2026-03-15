import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { getUserSearchLogs } from '@/api/api';
import { History, Loader2 } from 'lucide-react';

interface UserDetailProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchLog {
  id: string;
  user_id: string;
  query_data: any;
  result_count: number;
  created_at: string;
}

export default function UserDetailDialog({ user, open, onOpenChange }: UserDetailProps) {
  const [searchLogs, setSearchLogs] = useState<SearchLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');

  useEffect(() => {
    if (user && open && activeTab === 'history') {
      fetchSearchLogs();
    }
  }, [user, open, activeTab]);

  const fetchSearchLogs = async () => {
    if (!user?.id) return;
    setLoadingLogs(true);
    try {
      const res = await getUserSearchLogs(user.id, 30);
      if (res.ok && res.data) {
        setSearchLogs(res.data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch search logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Chi tiết người dùng</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b pb-2 mb-4">
          <Button
            variant={activeTab === 'info' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('info')}
            className="rounded-full"
          >
            Thông tin
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('history')}
            className="rounded-full"
          >
            <History className="w-4 h-4 mr-2" />
            Lịch sử tra cứu
          </Button>
        </div>

        {activeTab === 'info' ? (
          <div className="space-y-6">
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
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Lịch sử tra cứu (30 ngày gần nhất)</h3>
              <Button variant="outline" size="sm" onClick={fetchSearchLogs}>
                Làm mới
              </Button>
            </div>

            {loadingLogs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Đang tải...</span>
              </div>
            ) : searchLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có lịch sử tra cứu
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {searchLogs.map((log) => (
                  <div key={log.id} className="p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">
                        {log.created_at ? new Date(log.created_at).toLocaleString('vi-VN') : '-'}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {log.result_count} kết quả
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <pre className="whitespace-pre-wrap break-all text-xs">
                        {JSON.stringify(log.query_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
