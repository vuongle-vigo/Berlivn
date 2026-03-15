import { useState, useEffect, useMemo } from 'react';
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
import UserDetailDialog from '@/components/UserDetailDialog';
import { getAllUsers, updateUserAdmin, deleteUserProfile } from '@/api/api';
import { Eye, Search, ChevronLeft, ChevronRight, Filter, UserPlus, RotateCcw } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  role: string;
  daily_search_limit: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  company?: {
    name?: string;
    registration_number?: string;
    activities?: string;
    employee_count?: string;
    phone?: string;
  };
  search_count?: number;
}

const ITEMS_PER_PAGE = 10;

export default function AdminDashboard({ isCurrentAdmin }: { isCurrentAdmin?: boolean }) {
  const auth = useAuth();
  const derivedIsAdmin = typeof auth.isAdmin === 'function' ? auth.isAdmin() : Boolean(auth.isAdmin);
  const effectiveIsAdmin = isCurrentAdmin ?? derivedIsAdmin;
  const { refreshProfile } = auth;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    role: 'user',
    daily_search_limit: 10,
    is_active: true,
  });

  useEffect(() => {
    if (effectiveIsAdmin) {
      fetchUsers();
    }
  }, [effectiveIsAdmin]);

  // Filter and paginate users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.first_name?.toLowerCase().includes(searchLower) ||
        user.last_name?.toLowerCase().includes(searchLower) ||
        user.company?.name?.toLowerCase().includes(searchLower);

      // Role filter
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;

      // Status filter
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'inactive' && !user.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await getAllUsers();
      if (error) throw error;
      setUsers(data || []);
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
      const { error } = await updateUserAdmin(editingUser.id, {
        role: formData.role,
        daily_search_limit: formData.daily_search_limit,
        is_active: formData.is_active,
      });

      if (error) throw error;

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
    if (!confirm('Bạn có chắc muốn xóa user này? Thao tác này không thể hoàn tác.')) return;

    setError('');
    setSuccess('');

    try {
      const { error } = await deleteUserProfile(userId);
      if (error) throw error;

      setSuccess('User deleted successfully');
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi xóa user');
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      role: user.role || 'user',
      daily_search_limit: user.daily_search_limit || 10,
      is_active: user.is_active !== false,
    });
    setDialogOpen(true);
  };

  const openDetailDialog = (user: User) => {
    setViewingUser(user);
    setDetailDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      role: 'user',
      daily_search_limit: 10,
      is_active: true,
    });
    setEditingUser(null);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  // Stats calculation
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.is_active).length,
    admins: users.filter(u => u.role === 'admin').length,
  }), [users]);

  if (!effectiveIsAdmin) {
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <UserPlus className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Active Users</p>
                <p className="text-3xl font-bold mt-1">{stats.active}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <Filter className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Admins</p>
                <p className="text-3xl font-bold mt-1">{stats.admins}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-full">
                <UserPlus className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-2xl font-bold text-red-600">User Management</CardTitle>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by email, name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full md:w-64"
                />
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-36">
                  <SelectValue placeholder="Vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" onClick={resetFilters} title="Đặt lại bộ lọc">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {success && (
            <Alert className="mb-4 bg-green-50 text-green-900 border-green-200">
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
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Họ tên</TableHead>
                  <TableHead className="font-semibold">Company</TableHead>
                  <TableHead className="font-semibold">Vai trò</TableHead>
                  <TableHead className="font-semibold">Giới hạn/ngày</TableHead>
                  <TableHead className="font-semibold">Trạng thái</TableHead>
                  <TableHead className="font-semibold">Ngày tạo</TableHead>
                  <TableHead className="font-semibold text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-gray-500">Loading...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                        ? 'No users found matching your criteria'
                        : 'No users yet'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || '-'}</TableCell>
                      <TableCell>{user.company?.name || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'admin'
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{user.daily_search_limit || 0}</span>
                          <span className="text-gray-400 text-xs">lượt</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          user.is_active
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 hover:bg-blue-50 hover:border-blue-300"
                            onClick={() => openDetailDialog(user)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 hover:bg-orange-50 hover:border-orange-300"
                            onClick={() => openEditDialog(user)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 px-2"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          resetForm();
          setError('');
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email</Label>
              <Input
                value={editingUser?.email || ''}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Full Name</Label>
              <Input
                value={editingUser?.full_name || `${editingUser?.first_name || ''} ${editingUser?.last_name || ''}`.trim() || ''}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
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
                <Label className="text-sm font-medium">Daily Search Limit</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.daily_search_limit}
                  onChange={(e) => setFormData({ ...formData, daily_search_limit: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="is_active" className="text-sm font-medium">Account Active</Label>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                {loading ? 'Processing...' : 'Update'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <UserDetailDialog
        user={viewingUser}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </div>
  );
}
