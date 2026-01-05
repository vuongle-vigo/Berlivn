import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { BarChart3, Users, Search, TrendingUp } from 'lucide-react';
import { getAnalytics } from '@/api/api';

// local types used by this page
interface DailyStats {
  date: string;
  total_searches: number;
  active_users: number;
}
interface UserActivity {
  user_id: string;
  user_name: string;
  email: string;
  total_searches: number;
  last_active: string;
}

export default function Analytics() {
  const { isAdmin, user: authUser } = useAuth();
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalSearches: 0,
    todaySearches: 0,
  });
  const [timeRange, setTimeRange] = useState(7);

  useEffect(() => {
    if (isAdmin) {
      loadAnalytics();
    }
  }, [isAdmin, timeRange]);

  const loadAnalytics = async () => {
    try {
      const res = await getAnalytics(timeRange, authUser?.token);
      if (!res.ok) {
        return;
      }
      const data = res.data || {};
      const ds: DailyStats[] = data.daily_stats || data.dailyStats || data.daily || [];
      const ua: UserActivity[] = data.user_activity || data.userActivity || data.activity || [];
      const ts = data.total_stats || data.totalStats || data.totals || {
        totalUsers: 0, activeUsers: 0, totalSearches: 0, todaySearches: 0,
      };
      setDailyStats(ds);
      setUserActivity(ua);
      setTotalStats(ts);
    } catch {
      // ignore errors for now
    }
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

  const maxSearches = Math.max(...dailyStats.map(s => s.total_searches), 1);
  const maxUsers = Math.max(...dailyStats.map(s => s.active_users), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-red-600">Thống kê & Phân tích</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange(7)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === 7
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            7 ngày
          </button>
          <button
            onClick={() => setTimeRange(14)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === 14
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            14 ngày
          </button>
          <button
            onClick={() => setTimeRange(30)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === 30
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            30 ngày
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng người dùng</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalStats.totalUsers}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Người dùng hoạt động</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalStats.activeUsers}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng lượt tra cứu</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalStats.totalSearches}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-full">
                <Search className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tra cứu hôm nay</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalStats.todaySearches}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-full">
                <BarChart3 className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-red-600">Biểu đồ tra cứu theo ngày</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm font-medium text-gray-600">
                <span>Số lượt tra cứu</span>
                <span>Max: {maxSearches}</span>
              </div>
              <div className="space-y-2">
                {dailyStats.map((stat, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 w-16 text-right">
                      {stat.date}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                        style={{ width: `${(stat.total_searches / maxSearches) * 100}%` }}
                      >
                        {stat.total_searches > 0 && (
                          <span className="text-white text-xs font-semibold">
                            {stat.total_searches}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-6 space-y-3">
              <div className="flex items-center justify-between text-sm font-medium text-gray-600">
                <span>Người dùng hoạt động</span>
                <span>Max: {maxUsers}</span>
              </div>
              <div className="space-y-2">
                {dailyStats.map((stat, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 w-16 text-right">
                      {stat.date}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                        style={{ width: `${(stat.active_users / maxUsers) * 100}%` }}
                      >
                        {stat.active_users > 0 && (
                          <span className="text-white text-xs font-semibold">
                            {stat.active_users}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-red-600">Hoạt động người dùng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Tổng lượt tra cứu</TableHead>
                  <TableHead>Hoạt động gần nhất</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userActivity.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      Chưa có dữ liệu hoạt động
                    </TableCell>
                  </TableRow>
                ) : (
                  userActivity.map((activity) => (
                    <TableRow key={activity.user_id}>
                      <TableCell className="font-medium">{activity.user_name}</TableCell>
                      <TableCell className="text-gray-600">{activity.email}</TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                          {activity.total_searches}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600">{activity.last_active}</TableCell>
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
