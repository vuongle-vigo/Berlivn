export interface FakeUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  daily_search_limit: number;
  is_active: boolean;
  password: string;
  created_at: string;
}

export interface SearchLog {
  user_id: string;
  date: string;
  count: number;
}

export interface DailyStats {
  date: string;
  total_searches: number;
  active_users: number;
}

export interface UserActivity {
  user_id: string;
  user_name: string;
  email: string;
  total_searches: number;
  last_active: string;
}

const FAKE_USERS: FakeUser[] = [
  {
    id: '1',
    email: 'admin@demo.com',
    password: 'Admin123!',
    full_name: 'Admin Demo',
    role: 'admin',
    daily_search_limit: 999999,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'user@demo.com',
    password: 'User123!',
    full_name: 'User Demo',
    role: 'user',
    daily_search_limit: 10,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    email: 'john@example.com',
    password: 'John123!',
    full_name: 'John Smith',
    role: 'user',
    daily_search_limit: 5,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    email: 'inactive@example.com',
    password: 'Inactive123!',
    full_name: 'Inactive User',
    role: 'user',
    daily_search_limit: 10,
    is_active: false,
    created_at: new Date().toISOString(),
  },
];

let users = [...FAKE_USERS];
let searchLogs: SearchLog[] = [];

function generateFakeAnalytics() {
  const logs: SearchLog[] = [];
  const now = new Date();

  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toDateString();

    users.forEach(user => {
      if (user.role === 'user' && user.is_active) {
        const searchCount = Math.floor(Math.random() * (user.daily_search_limit * 0.8));
        if (searchCount > 0) {
          logs.push({
            user_id: user.id,
            date: dateStr,
            count: searchCount,
          });
        }
      }
    });
  }

  return logs;
}

searchLogs = generateFakeAnalytics();

export const fakeAuth = {
  getUsers: (): FakeUser[] => {
    return users.map(u => ({ ...u, password: '' }));
  },

  login: async (email: string, password: string): Promise<{ user: FakeUser | null; error: string | null }> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return { user: null, error: 'Email hoặc mật khẩu không đúng' };
    }

    if (!user.is_active) {
      return { user: null, error: 'Tài khoản đã bị khóa' };
    }

    return { user: { ...user, password: '' }, error: null };
  },

  register: async (email: string, password: string, fullName: string): Promise<{ error: string | null }> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    if (users.find(u => u.email === email)) {
      return { error: 'Email đã tồn tại' };
    }

    const newUser: FakeUser = {
      id: Date.now().toString(),
      email,
      password,
      full_name: fullName,
      role: 'user',
      daily_search_limit: 10,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    return { error: null };
  },

  createUser: async (email: string, password: string, fullName: string, role: 'admin' | 'user', dailyLimit: number, isActive: boolean): Promise<{ error: string | null }> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    if (users.find(u => u.email === email)) {
      return { error: 'Email đã tồn tại' };
    }

    const newUser: FakeUser = {
      id: Date.now().toString(),
      email,
      password,
      full_name: fullName,
      role,
      daily_search_limit: dailyLimit,
      is_active: isActive,
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    return { error: null };
  },

  updateUser: async (userId: string, updates: Partial<FakeUser>): Promise<{ error: string | null }> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const index = users.findIndex(u => u.id === userId);
    if (index === -1) {
      return { error: 'User không tồn tại' };
    }

    users[index] = { ...users[index], ...updates };
    return { error: null };
  },

  deleteUser: async (userId: string): Promise<{ error: string | null }> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    users = users.filter(u => u.id !== userId);
    return { error: null };
  },

  getRemainingSearches: (userId: string): number => {
    const user = users.find(u => u.id === userId);
    if (!user) return 0;

    const today = new Date().toDateString();
    const log = searchLogs.find(l => l.user_id === userId && l.date === today);

    return user.daily_search_limit - (log?.count || 0);
  },

  canSearch: (userId: string): boolean => {
    const user = users.find(u => u.id === userId);
    if (!user || !user.is_active) return false;

    return fakeAuth.getRemainingSearches(userId) > 0;
  },

  incrementSearch: (userId: string): void => {
    const today = new Date().toDateString();
    const existingLog = searchLogs.find(l => l.user_id === userId && l.date === today);

    if (existingLog) {
      existingLog.count++;
    } else {
      searchLogs.push({ user_id: userId, date: today, count: 1 });
    }
  },

  getDailyStats: (days: number = 7): DailyStats[] => {
    const stats: DailyStats[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();

      const dayLogs = searchLogs.filter(l => l.date === dateStr);
      const totalSearches = dayLogs.reduce((sum, log) => sum + log.count, 0);
      const activeUsers = new Set(dayLogs.map(l => l.user_id)).size;

      stats.push({
        date: date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
        total_searches: totalSearches,
        active_users: activeUsers,
      });
    }

    return stats;
  },

  getUserActivity: (): UserActivity[] => {
    const activities: UserActivity[] = [];

    users.forEach(user => {
      if (user.role === 'user') {
        const userLogs = searchLogs.filter(l => l.user_id === user.id);
        const totalSearches = userLogs.reduce((sum, log) => sum + log.count, 0);

        const lastLog = userLogs
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        activities.push({
          user_id: user.id,
          user_name: user.full_name,
          email: user.email,
          total_searches: totalSearches,
          last_active: lastLog ? new Date(lastLog.date).toLocaleDateString('vi-VN') : 'Chưa có hoạt động',
        });
      }
    });

    return activities.sort((a, b) => b.total_searches - a.total_searches);
  },

  getTotalStats: () => {
    const totalUsers = users.filter(u => u.role === 'user').length;
    const activeUsers = users.filter(u => u.role === 'user' && u.is_active).length;
    const totalSearches = searchLogs.reduce((sum, log) => sum + log.count, 0);

    const today = new Date().toDateString();
    const todaySearches = searchLogs
      .filter(l => l.date === today)
      .reduce((sum, log) => sum + log.count, 0);

    return {
      totalUsers,
      activeUsers,
      totalSearches,
      todaySearches,
    };
  },
};
