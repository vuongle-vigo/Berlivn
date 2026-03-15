import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAnalytics } from '@/api/api';
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
import { BarChart3, Users, Search, TrendingUp, Calendar, Activity, ArrowUp, ArrowDown } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';

interface AnalyticsProps {
  isCurrentAdmin?: boolean;
}

interface AnalyticsDailyStat {
  date: string;
  total_searches: number;
}

interface AnalyticsUserActivity {
  user_id: string;
  user_name: string;
  email: string;
  total_searches: number;
  last_active: string | null;
}

interface AnalyticsTotals {
  total_users: number;
  active_users: number;
  total_searches: number;
  today_searches: number;
}

export default function Analytics({ isCurrentAdmin }: AnalyticsProps = {}) {
  const auth = useAuth();
  const { loading } = auth;
  const derivedIsAdmin = typeof auth.isAdmin === "function" ? auth.isAdmin() : Boolean(auth.isAdmin);
  const isAdmin = isCurrentAdmin ?? derivedIsAdmin;
  const [dailyStats, setDailyStats] = useState<AnalyticsDailyStat[]>([]);
  const [userActivity, setUserActivity] = useState<AnalyticsUserActivity[]>([]);
  const [totalStats, setTotalStats] = useState<AnalyticsTotals>({
    total_users: 0,
    active_users: 0,
    total_searches: 0,
    today_searches: 0,
  });
  const [timeRange, setTimeRange] = useState(7);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  // Calculate trend data
  const trendData = useMemo(() => {
    if (dailyStats.length < 2) return null;
    const sortedStats = [...dailyStats].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const recent = sortedStats.slice(-3);
    const older = sortedStats.slice(0, 3);
    const recentAvg = recent.reduce((sum, s) => sum + s.total_searches, 0) / recent.length;
    const olderAvg = older.reduce((sum, s) => sum + s.total_searches, 0) / older.length;
    const change = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
    return { recentAvg, olderAvg, change };
  }, [dailyStats]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchAnalytics = async () => {
      setIsFetching(true);
      setError(null);
      try {
        const res = await getAnalytics(timeRange);
        if (res.ok && res.data) {
          setDailyStats(res.data.daily_stats || []);
          setTotalStats(res.data.total_stats || totalStats);
          setUserActivity(res.data.user_activity || []);
        } else {
          setError(res.data?.detail || "Không thể tải dữ liệu thống kê");
        }
      } catch {
        setError("Không thể tải dữ liệu thống kê");
      } finally {
        setIsFetching(false);
      }
    };
    fetchAnalytics();
  }, [isAdmin, timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500">Đang tải quyền truy cập...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>Bạn không có quyền truy cập trang này</AlertDescription>
        </Alert>
      </div>
    );
  }

  const maxSearches = dailyStats.reduce((max, stat) => Math.max(max, stat.total_searches), 0) || 1;

  // Format data for chart
  const chartData = dailyStats.map(stat => ({
    name: stat.date,
    searches: stat.total_searches,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistics & Analytics</h1>
          <p className="text-gray-500 mt-1">Track system usage and activity</p>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          {[
            { value: 7, label: '7 ngày' },
            { value: 14, label: '14 ngày' },
            { value: 30, label: '30 ngày' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                timeRange === option.value
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isFetching && !error && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading data...</span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Users</p>
                <p className="text-4xl font-bold mt-2">{totalStats.total_users}</p>
                <p className="text-blue-200 text-xs mt-1">{totalStats.active_users} active</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Users className="w-7 h-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Active Users</p>
                <p className="text-4xl font-bold mt-2">{totalStats.active_users}</p>
                <p className="text-green-200 text-xs mt-1">
                  {totalStats.total_users > 0
                    ? Math.round((totalStats.active_users / totalStats.total_users) * 100)
                    : 0}% of total
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Activity className="w-7 h-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Searches</p>
                <p className="text-4xl font-bold mt-2">{totalStats.total_searches.toLocaleString('vi-VN')}</p>
                {trendData && (
                  <div className={`flex items-center gap-1 mt-1 ${trendData.change >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {trendData.change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    <span className="text-xs">{Math.abs(trendData.change).toFixed(1)}% vs previous period</span>
                  </div>
                )}
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Search className="w-7 h-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full" />
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Today's Searches</p>
                <p className="text-4xl font-bold mt-2">{totalStats.today_searches}</p>
                <p className="text-orange-200 text-xs mt-1">Last {timeRange} days</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <BarChart3 className="w-7 h-7" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Daily Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: number) => [`${value} lượt`, 'Tra cứu']}
                    labelStyle={{ color: '#374151', fontWeight: 600 }}
                  />
                  <Bar
                    dataKey="searches"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Usage Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSearches" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: number) => [`${value} lượt`, 'Tra cứu']}
                    labelStyle={{ color: '#374151', fontWeight: 600 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="searches"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSearches)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            User Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold text-right">Total Searches</TableHead>
                  <TableHead className="font-semibold">Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userActivity.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      No activity data yet
                    </TableCell>
                  </TableRow>
                ) : (
                  userActivity.map((activity, index) => (
                    <TableRow key={activity.user_id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{activity.user_name}</TableCell>
                      <TableCell className="text-gray-600">{activity.email}</TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                          {activity.total_searches}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {activity.last_active || '-'}
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
