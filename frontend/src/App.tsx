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
import logo from "./assets/logo.png";

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
      <header className="bg-white/90 backdrop-blur-lg shadow-md border-b border-gray-200 sticky top-0 z-50">
        <div className="w-full px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between min-h-16 py-2">
            {/* LEFT */}
            <div className="flex items-center gap-4">
              <img
                src={logo}
                alt="Berlivn Busbar logo"
                className="w-12 h-12 object-contain rounded-lg shadow-sm"
              />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">
                  Berlivn Busbar
                </h1>
                <div className="flex items-center gap-3 text-xs text-gray-500 -mt-0.5">
                  <span>Mobile: +84 28 3844 2266</span>
                  <span className="hidden md:inline">|</span>
                  <span className="hidden md:inline">Email: info@berlivn.com</span>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div
              ref={headerRightRef}
              className="flex items-center gap-2"
            >
              {/* USER INFO */}
              <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-sm">
                  <span className="text-gray-700 font-medium">
                    {profile?.full_name || user.email}
                  </span>
                  {isAdmin && (
                    <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                      Admin
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>

              {/* DESKTOP TABS */}
              <div className="hidden lg:flex items-center">
                <div ref={tabsWrapRef} className="flex gap-1">
                  {!isTabsCollapsed &&
                    tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === tab.id
                              ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
                              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 ${
                                activeTab === tab.id ? "bg-blue-50 text-blue-600" : ""
                              }`}
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
      <main className="w-full px-4 sm:px-6 lg:px-8 py-4">
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
