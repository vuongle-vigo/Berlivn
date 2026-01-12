import { useState, useEffect, useCallback } from "react";
import { Calculator, Zap, Package, Menu, X, Users, LogOut, User, BarChart3, UserCircle } from "lucide-react";
import { useAuth } from "./contexts/AuthContext";
import { getUser } from "./api/api";
import Login from "./pages/Login";
import BusbarCalculator from "./pages/BusbarCalculator";
import ForceCalculator from "./pages/ForceCalculator";
import Products from "./pages/Products";
import AdminDashboard from "./pages/AdminDashboard";
import Analytics from "./pages/Analytics";
import UserProfile from "./pages/UserProfile";

function App() {
  const { user: contextUser, profile, signOut: contextSignOut, isAdmin: contextIsAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("busbar");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchStats, setSearchStats] = useState({ limit: 20, count: 0 });
  
  // Fallback state for user from localStorage
  const [localUser, setLocalUser] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Combine context user and local user
  const user = contextUser || localUser;
  const isAdmin = contextIsAdmin || (user?.role === 'admin');

  const fetchSearchStats = useCallback(async () => {
    if (user?.id && !isAdmin) {
      const res = await getUser(user.id);
      if (res.ok && res.data) {
        setSearchStats({
          limit: res.data.daily_search_limit || 20,
          count: res.data.search_count || 0
        });
      }
    }
  }, [user, isAdmin]);

  useEffect(() => {
    fetchSearchStats();
  }, [fetchSearchStats, activeTab]);

  const handleSignOut = () => {
    localStorage.removeItem('user');
    setLocalUser(null);
    if (contextSignOut) contextSignOut();
    window.location.href = '/';
  };

  const tabs = [
    { id: "busbar", label: "Busbar Design", icon: Calculator },
    { id: "force", label: "Force Analysis", icon: Zap },
    { id: "profile", label: "Profile", icon: UserCircle },
  ];

  if (isAdmin) {
    // Insert Products before Profile for admins to maintain order
    tabs.splice(2, 0, { id: "products", label: "Products", icon: Package });
    tabs.push({ id: "analytics", label: "Analytics", icon: BarChart3 });
    tabs.push({ id: "admin", label: "User Management", icon: Users });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Electrical Engineering Suite
                </h1>
                <p className="text-xs text-gray-500">
                  {/* Professional Busbar Design & Analysis */}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700">
                  {profile?.first_name 
                    ? `${profile.first_name} ${profile.last_name}` 
                    : (profile?.full_name || user.email)}
                </span>
                {/* {isAdmin ? (
                  <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                    Admin
                  </span>
                ) : (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                    Searches: {Math.max(0, searchStats.limit - searchStats.count)}/{searchStats.limit}
                  </span>
                )} */}
              </div>

              <button
                onClick={handleSignOut}
                className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6 text-gray-600" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-600" />
                )}
              </button>

              <nav className="hidden lg:flex space-x-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                        activeTab === tab.id
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {isMobileMenuOpen && (
            <nav className="lg:hidden py-4 space-y-2 border-t border-gray-200">
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-700">
                    {profile?.first_name 
                      ? `${profile.first_name} ${profile.last_name}` 
                      : (profile?.full_name || user.email)}
                  </span>
                  {isAdmin && (
                    <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                      Admin
                    </span>
                  )}
                </div>
              </div>

              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}

              <button
                onClick={handleSignOut}
                className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg font-medium text-sm text-gray-600 hover:bg-gray-100"
              >
                <LogOut className="w-5 h-5" />
                <span>Đăng xuất</span>
              </button>
            </nav>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="transition-all duration-300 ease-in-out">
          {activeTab === "busbar" && (
            <BusbarCalculator 
              onSearchComplete={fetchSearchStats} 
              currentUser={user}
              isCurrentAdmin={isAdmin}
            />
          )}
          {activeTab === "force" && <ForceCalculator />}
          {activeTab === "products" && isAdmin && <Products />}
          {activeTab === "profile" && <UserProfile />}
          {activeTab === "analytics" && isAdmin && (
            <Analytics isCurrentAdmin={isAdmin} />
          )}
          {activeTab === "admin" && isAdmin && (
            <AdminDashboard isCurrentAdmin={isAdmin} />
            )}
        </div>
      </main>

      <footer className="bg-white/80 backdrop-blur-lg border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              IEC 61439 Compliant Calculations
            </p>
            <p className="text-xs text-gray-500">
              Professional electrical engineering tools for busbar design and
              force analysis
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
