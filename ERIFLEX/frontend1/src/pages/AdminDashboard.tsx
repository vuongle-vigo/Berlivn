import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { listUsers as apiListUsers, createUser as apiCreateUser, updateUser as apiUpdateUser, deleteUser as apiDeleteUser } from '@/api/api';

// local admin user type (fields used in this page)
interface AdminUser {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'user';
  daily_search_limit?: number;
  is_active?: boolean;
  created_at?: string;
}

export default function AdminDashboard() {
  const { isAdmin, refreshProfile, user: authUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'user' as 'admin' | 'user',
    daily_search_limit: 10,
    is_active: true,
  });

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiListUsers(authUser?.token);
      if (!res.ok) throw new Error(res.data?.message || 'Lỗi khi tải danh sách user');
      const list: AdminUser[] = Array.isArray(res.data) ? res.data : res.data?.users || [];
      setUsers(list);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await apiCreateUser({
        email: formData.email,
        password: formData.password,
        role: formData.role,
      }, authUser?.token);
      if (!res.ok) throw new Error(res.data?.message || 'Tạo user thất bại');
      // optionally update profile metadata via separate endpoint if backend supports additional fields
      setSuccess('Tạo user thành công');
      setDialogOpen(false);
      resetForm();
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await apiUpdateUser(editingUser.id, {
        full_name: formData.full_name,
        role: formData.role,
        daily_search_limit: formData.daily_search_limit,
        is_active: formData.is_active,
      }, authUser?.token);
      if (!res.ok) throw new Error(res.data?.message || 'Cập nhật user thất bại');
      setSuccess('Cập nhật user thành công');
      setDialogOpen(false);
      setEditingUser(null);
      resetForm();
      await fetchUsers();
      await refreshProfile();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Bạn có chắc muốn xóa user này?')) return;

    setError('');
    setSuccess('');

    try {
      const res = await apiDeleteUser(userId, authUser?.token);
      if (!res.ok) throw new Error(res.data?.message || 'Xóa user thất bại');
      setSuccess('Xóa user thành công');
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi xóa user');
    }
  };

  const openEditDialog = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      full_name: user.full_name || '',
      role: user.role,
      daily_search_limit: user.daily_search_limit,
      is_active: user.is_active,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      role: 'user',
      daily_search_limit: 10,
      is_active: true,
    });
    setEditingUser(null);
  };

  if (!isAdmin) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>Bạn không có quyền truy cập trang này</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold text-red-600">Quản lý User</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              resetForm();
              setError('');
            }
          }}>
            <DialogTrigger asChild>
              <Button>Thêm User Mới</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-full p-6 sm:p-8">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Chỉnh sửa User' : 'Thêm User Mới'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!!editingUser}
                    required
                  />
                </div>

                {!editingUser && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Mật khẩu</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="full_name">Họ và tên</Label>
                  <Input
                    id="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Vai trò</Label>
                  <Select value={formData.role} onValueChange={(value: 'admin' | 'user') => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="daily_search_limit">Giới hạn tra cứu/ngày</Label>
                  <Input
                    id="daily_search_limit"
                    type="number"
                    min="0"
                    value={formData.daily_search_limit}
                    onChange={(e) => setFormData({ ...formData, daily_search_limit: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="is_active">Tài khoản hoạt động</Label>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Đang xử lý...' : editingUser ? 'Cập nhật' : 'Tạo User'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Hủy
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {success && (
            <Alert className="mb-4">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {error && !dialogOpen && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Giới hạn/ngày</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Chưa có user nào
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.full_name || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </TableCell>
                      <TableCell>{user.daily_search_limit}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.is_active ? 'Hoạt động' : 'Tạm khóa'}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(user)}
                          >
                            Sửa
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            Xóa
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
