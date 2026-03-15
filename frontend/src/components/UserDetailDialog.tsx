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

  const fullName = user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || '-';

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
          <div className="space-y-5 p-1">
            {/* Header with user info */}
            <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {fullName !== '-' ? fullName.charAt(0).toUpperCase() : '?'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800">{fullName}</h3>
                <p className="text-gray-600">{user.email || '-'}</p>
                <div className="flex gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {user.role === 'admin' ? 'Admin' : 'User'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {user.is_active ? 'Hoạt động' : 'Tạm khóa'}
                  </span>
                </div>
              </div>
            </div>

            {/* Company Info */}
            <Card className="border-2 border-orange-100">
              <CardHeader className="pb-2 px-4">
                <CardTitle className="text-base font-bold text-orange-700 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Thông tin công ty
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 px-4 pb-4 space-y-3">
                {user.company?.name || user.company_name ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-orange-600 font-medium">Tên công ty</Label>
                        <p className="font-semibold text-gray-800 text-sm">{user.company?.name || user.company_name || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-orange-600 font-medium">Mã số đăng ký</Label>
                        <p className="font-semibold text-gray-800 text-sm">{user.company?.registration_number || user.registration_number || '-'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-orange-600 font-medium">Lĩnh vực hoạt động</Label>
                        <p className="font-semibold text-gray-800 text-sm">{user.company?.activities || user.activities || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-orange-600 font-medium">Số nhân viên</Label>
                        <p className="font-semibold text-gray-800 text-sm">{user.company?.employee_count || user.employee_count || '-'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-orange-600 font-medium">Điện thoại công ty</Label>
                        <p className="font-semibold text-gray-800 text-sm">{user.company?.phone || user.company_phone || '-'}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 italic text-center py-2">Chưa có thông tin công ty</p>
                )}
              </CardContent>
            </Card>

            {/* Personal Info */}
            <Card className="border-2 border-blue-100">
              <CardHeader className="pb-2 px-4">
                <CardTitle className="text-base font-bold text-blue-700 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Thông tin cá nhân
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 px-4 pb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-blue-600 font-medium">Họ</Label>
                    <p className="font-semibold text-gray-800 text-sm">{user.first_name || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-blue-600 font-medium">Tên</Label>
                    <p className="font-semibold text-gray-800 text-sm">{user.last_name || '-'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-blue-600 font-medium">Chức vụ</Label>
                    <p className="font-semibold text-gray-800 text-sm">{user.job_position || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-blue-600 font-medium">Điện thoại trực tiếp</Label>
                    <p className="font-semibold text-gray-800 text-sm">{user.direct_phone || '-'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-blue-600 font-medium">Điện thoại di động</Label>
                    <p className="font-semibold text-gray-800 text-sm">{user.mobile_phone || '-'}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-blue-600 font-medium">Địa chỉ chuyên nghiệp</Label>
                  <p className="font-semibold text-gray-800 text-sm">{user.professional_address || '-'}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-blue-600 font-medium">Mã bưu chính</Label>
                    <p className="font-semibold text-gray-800 text-sm">{user.postal_code || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-blue-600 font-medium">Thành phố</Label>
                    <p className="font-semibold text-gray-800 text-sm">{user.city || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-blue-600 font-medium">Quốc gia</Label>
                    <p className="font-semibold text-gray-800 text-sm">{user.country || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card className="border-2 border-purple-100">
              <CardHeader className="pb-2 px-4">
                <CardTitle className="text-base font-bold text-purple-700 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Thông tin tài khoản
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 px-4 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-purple-600 font-medium">Giới hạn tra cứu/ngày</Label>
                    <p className="font-semibold text-gray-800 text-sm">{user.daily_search_limit || '0'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-purple-600 font-medium">Tra cứu hôm nay</Label>
                    <p className="font-semibold text-gray-800 text-sm">{user.daily_search_remaining || '0'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-purple-600 font-medium">Tổng tra cứu</Label>
                    <p className="font-semibold text-gray-800 text-sm">{user.search_count || '0'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-purple-600 font-medium">Ngày tạo tài khoản</Label>
                    <p className="font-semibold text-gray-800 text-sm">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '-'}
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
