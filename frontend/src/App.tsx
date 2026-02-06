import {
  useState,
  useEffect,
  useCallback,
  useLayoutEffect,
  useRef,
} from "react";
import {
  Calculator,
  Zap,
  Package,
  Menu,
  X,
  Users,
  LogOut,
  User,
  BarChart3,
  UserCircle,
} from "lucide-react";

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
  const {
    user: contextUser,
    profile,
    signOut: contextSignOut,
    isAdmin: contextIsAdmin,
    loading,
  } = useAuth();

  const [activeTab, setActiveTab] = useState("busbar");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchStats, setSearchStats] = useState({ limit: 20, count: 0 });

  const [localUser, setLocalUser] = useState<any>(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const user = contextUser || localUser;
  const isAdmin = contextIsAdmin || user?.role === "admin";

  /* ---------------- HEADER COLLAPSE LOGIC ---------------- */

  const headerRightRef = useRef<HTMLDivElement | null>(null);
  const tabsWrapRef = useRef<HTMLDivElement | null>(null);

  const [isTabsCollapsed, setIsTabsCollapsed] = useState(false);
  const [isTabsMenuOpen, setIsTabsMenuOpen] = useState(false);

  /* -------------------------------------------------------- */

  const fetchSearchStats = useCallback(async () => {
    if (user?.id && !isAdmin) {
      const res = await getUser(user.id);
      if (res.ok && res.data) {
        setSearchStats({
          limit: res.data.daily_search_limit || 20,
          count: res.data.search_count || 0,
        });
      }
    }
  }, [user, isAdmin]);

  useEffect(() => {
    fetchSearchStats();
  }, [fetchSearchStats, activeTab]);

  useEffect(() => {
    if (
      !isAdmin &&
      ["force", "products", "analytics", "admin"].includes(activeTab)
    ) {
      setActiveTab("busbar");
    }
  }, [isAdmin, activeTab]);

  const handleSignOut = () => {
    localStorage.removeItem("user");
    setLocalUser(null);
    contextSignOut?.();
    window.location.href = "/";
  };

  /* ---------- AUTO COLLAPSE TABS WHEN NO SPACE ---------- */

  useLayoutEffect(() => {
    const calc = () => {
      const right = headerRightRef.current;
      const tabs = tabsWrapRef.current;
      if (!right || !tabs) return;

      const available = right.clientWidth;
      const needed = tabs.scrollWidth;

      const shouldCollapse = needed > available - 40;
      setIsTabsCollapsed(shouldCollapse);

      if (!shouldCollapse) setIsTabsMenuOpen(false);
    };

    calc();

    const ro = new ResizeObserver(calc);
    if (headerRightRef.current) ro.observe(headerRightRef.current);
    if (tabsWrapRef.current) ro.observe(tabsWrapRef.current);

    window.addEventListener("resize", calc);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", calc);
    };
  }, []);

  /* ------------------------------------------------------ */

  const tabs = [
    { id: "busbar", label: "Busbar Design", icon: Calculator },
    { id: "profile", label: "Profile", icon: UserCircle },
  ];

  if (isAdmin) {
    tabs.splice(1, 0, { id: "force", label: "Force Analysis", icon: Zap });
    tabs.splice(2, 0, { id: "products", label: "Products", icon: Package });
    tabs.push({ id: "analytics", label: "Analytics", icon: BarChart3 });
    tabs.push({ id: "admin", label: "User Management", icon: Users });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      {/* ================= HEADER ================= */}
      <header className="bg-white/80 backdrop-blur-lg shadow border-b border-gray-200 sticky top-0 z-50">
        <div className="w-full px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between min-h-14 py-2">
            {/* LEFT */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">
                Electrical Engineering Suite
              </h1>
            </div>

            {/* RIGHT */}
            <div
              ref={headerRightRef}
              className="flex items-center gap-3"
            >
              {/* USER */}
              <div className="hidden md:flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700">
                  {profile?.first_name
                    ? `${profile.first_name} ${profile.last_name}`
                    : profile?.full_name || user.email}
                </span>
              </div>

              <button
                onClick={handleSignOut}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>

              {/* DESKTOP TABS */}
              <div className="hidden lg:flex items-center">
                <div ref={tabsWrapRef} className="flex gap-2">
                  {!isTabsCollapsed &&
                    tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                            activeTab === tab.id
                              ? "bg-blue-600 text-white"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                </div>

                {isTabsCollapsed && (
                  <div className="relative">
                    <button
                      onClick={() =>
                        setIsTabsMenuOpen((v) => !v)
                      }
                      className="p-2 rounded-lg hover:bg-gray-100"
                    >
                      <Menu className="w-5 h-5" />
                    </button>

                    {isTabsMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg z-50">
                        {tabs.map((tab) => {
                          const Icon = tab.icon;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => {
                                setActiveTab(tab.id);
                                setIsTabsMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                            >
                              <Icon className="w-4 h-4" />
                              {tab.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* MOBILE MENU BUTTON */}
              <button
                onClick={() =>
                  setIsMobileMenuOpen(!isMobileMenuOpen)
                }
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "busbar" && (
          <BusbarCalculator
            onSearchComplete={fetchSearchStats}
            currentUser={user}
            isCurrentAdmin={isAdmin}
          />
        )}
        {activeTab === "force" && isAdmin && <ForceCalculator />}
        {activeTab === "products" && isAdmin && <Products />}
        {activeTab === "profile" && <UserProfile />}
        {activeTab === "analytics" && isAdmin && (
          <Analytics isCurrentAdmin={isAdmin} />
        )}
        {activeTab === "admin" && isAdmin && (
          <AdminDashboard isCurrentAdmin={isAdmin} />
        )}
      </main>
    </div>
  );
}

export default App;
