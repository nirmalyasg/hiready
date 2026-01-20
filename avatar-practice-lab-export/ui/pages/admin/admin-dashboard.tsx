import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import a3cendLogo from "@/assets/a3cend-logo.png";
import {
  Users,
  Activity,
  DollarSign,
  Settings,
  BarChart3,
  Clock,
  TrendingUp,
  ArrowLeft,
  Shield,
  AlertTriangle,
  Target,
  LogIn,
  LogOut,
  Calendar,
  ChevronRight,
  Zap,
  FileText,
  PlayCircle,
  User,
  MessageSquare,
  Video,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  Briefcase,
  Menu,
  X
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Legend
} from "recharts";

interface AnalyticsSummary {
  totalUsers: number;
  activeUsersLast30Days: number;
  activeUsersLast7Days: number;
  totalSessions: number;
  sessionsLast30Days: number;
  avgSessionDuration: number;
  loginEventsLast30Days: number;
}

interface DailySession {
  date: string;
  session_count: number;
  unique_users: number;
  avg_duration: number;
}

interface CostSummary {
  byService: Array<{
    service: string;
    total_requests: number;
    total_tokens_in: number;
    total_tokens_out: number;
    total_cost: number;
  }>;
  totalCost: number;
  period: { days: number; startDate: string };
}

type Page = "overview" | "users" | "sessions" | "content" | "avatars" | "costs" | "jobs";

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [activePage, setActivePage] = useState<Page>("overview");

  useEffect(() => {
    checkAdminAccess();
  }, [isAuthenticated]);

  async function checkAdminAccess() {
    try {
      const response = await fetch("/api/admin/check-access");
      const data = await response.json();
      setIsAdmin(data.isAdmin);
    } catch (err) {
      console.error("Error checking admin access:", err);
    } finally {
      setCheckingAccess(false);
    }
  }

  if (authLoading || checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-500" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">Please log in to access the admin dashboard.</p>
            <Button onClick={() => navigate("/login")} className="w-full">
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              You don't have admin privileges to access this dashboard.
            </p>
            <Button onClick={() => navigate("/avatar/dashboard")} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const navItems = [
    { id: "overview" as Page, label: "Overview", icon: BarChart3 },
    { id: "users" as Page, label: "Users", icon: Users },
    { id: "sessions" as Page, label: "Sessions", icon: PlayCircle },
    { id: "content" as Page, label: "Content", icon: FileText },
    { id: "avatars" as Page, label: "Avatars", icon: Video },
    { id: "costs" as Page, label: "Costs", icon: DollarSign },
    { id: "jobs" as Page, label: "Jobs", icon: Briefcase }
  ];

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8f7fc]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-3">
                <img src={a3cendLogo} alt="A3CEND" className="h-8" />
                <div className="h-6 w-px bg-gray-200" />
                <span className="text-sm font-semibold text-[#000000] tracking-tight">Admin Console</span>
              </Link>
              <Badge className="bg-[#24c4b8]/10 text-[#24c4b8] border-[#24c4b8]/20 text-xs font-medium">Admin</Badge>
            </div>
            
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      activePage === item.id 
                        ? "bg-[#000000] text-white shadow-md" 
                        : "text-gray-500 hover:text-[#000000] hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex items-center gap-2.5 px-3 py-1.5 bg-gray-50 rounded-full">
                  <div className="w-7 h-7 rounded-full bg-[#000000]/10 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-[#000000]" />
                  </div>
                  <span className="text-sm font-medium text-[#000000] hidden lg:block">
                    {user?.username || 'Admin'}
                  </span>
                </div>
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    window.location.href = '/';
                  }}
                  className="flex items-center justify-center w-9 h-9 text-gray-500 hover:text-[#cb6ce6] hover:bg-[#cb6ce6]/10 rounded-full transition-all duration-200"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden flex items-center justify-center w-10 h-10 text-[#000000] hover:bg-gray-50 rounded-xl transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
        
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white animate-in slide-in-from-top-2 duration-200">
            <nav className="max-w-full mx-auto px-4 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActivePage(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      activePage === item.id 
                        ? "bg-[#000000] text-white shadow-md" 
                        : "text-gray-500 hover:text-[#000000] hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
              
              <div className="pt-3 mt-3 border-t border-gray-100">
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    window.location.href = '/';
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#cb6ce6] hover:bg-[#cb6ce6]/10 transition-all duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  Sign out
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activePage === "overview" && <OverviewPage />}
        {activePage === "users" && <UsersPage />}
        {activePage === "sessions" && <SessionsPage />}
        {activePage === "content" && <ContentPage />}
        {activePage === "avatars" && <AvatarsPage />}
        {activePage === "costs" && <CostsPage />}
        {activePage === "jobs" && <JobsPage />}
      </main>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds === 0) return "0m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}

function formatCostDetailed(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

function OverviewPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [dailySessions, setDailySessions] = useState<DailySession[]>([]);
  const [costSummary, setCostSummary] = useState<CostSummary | null>(null);
  const [topScenarios, setTopScenarios] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any>(null);
  const [timePeriod, setTimePeriod] = useState<"24h" | "7d" | "30d">("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [timePeriod]);

  async function fetchData() {
    setLoading(true);
    const days = timePeriod === "24h" ? 1 : timePeriod === "7d" ? 7 : 30;
    try {
      const [summaryRes, sessionsRes, costsRes, scenariosRes, activityRes] = await Promise.all([
        fetch("/api/admin/analytics/summary"),
        fetch(`/api/admin/analytics/sessions?days=${days}`),
        fetch(`/api/admin/costs/summary?days=${days}`),
        fetch("/api/admin/analytics/scenarios"),
        fetch("/api/admin/analytics/activity")
      ]);

      const [summaryData, sessionsData, costsData, scenariosData, activityData] = await Promise.all([
        summaryRes.json(),
        sessionsRes.json(),
        costsRes.json(),
        scenariosRes.json(),
        activityRes.json()
      ]);

      if (summaryData.success) setSummary(summaryData.data);
      if (sessionsData.success) setDailySessions(sessionsData.data);
      if (costsData.success) setCostSummary(costsData.data);
      if (scenariosData.success) setTopScenarios(scenariosData.data.slice(0, 5));
      if (activityData.success) setActivityData(activityData.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  const chartData = [...dailySessions].reverse().slice(-14);
  const costPerSession = summary?.sessionsLast30Days && costSummary?.totalCost 
    ? costSummary.totalCost / summary.sessionsLast30Days 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Overview</h2>
          <p className="text-slate-500 text-sm">Platform health at a glance</p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-1">
          {(["24h", "7d", "30d"] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                timePeriod === period ? "bg-white shadow-sm text-slate-900" : "text-slate-600"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-600" />
              <p className="text-xs text-blue-600 font-medium">DAU/WAU/MAU</p>
            </div>
            <p className="text-xl font-bold text-slate-900">
              {activityData?.dailyActiveUsers || 0} / {activityData?.weeklyActiveUsers || 0} / {activityData?.monthlyActiveUsers || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-green-600" />
              <p className="text-xs text-green-600 font-medium">Avg Sessions/User</p>
            </div>
            <p className="text-xl font-bold text-slate-900">
              {summary?.activeUsersLast30Days ? (summary.sessionsLast30Days / summary.activeUsersLast30Days).toFixed(1) : "0"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-purple-600" />
              <p className="text-xs text-purple-600 font-medium">Avg Duration</p>
            </div>
            <p className="text-xl font-bold text-slate-900">{formatDuration(summary?.avgSessionDuration || 0)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-amber-600" />
              <p className="text-xs text-amber-600 font-medium">Sessions ({timePeriod})</p>
            </div>
            <p className="text-xl font-bold text-slate-900">{summary?.sessionsLast30Days || 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-white border-rose-100">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-rose-600" />
              <p className="text-xs text-rose-600 font-medium">Cost ({timePeriod})</p>
            </div>
            <p className="text-xl font-bold text-slate-900">{formatCost(costSummary?.totalCost || 0)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-white border-teal-100">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-teal-600" />
              <p className="text-xs text-teal-600 font-medium">Cost/Session</p>
            </div>
            <p className="text-xl font-bold text-slate-900">{formatCostDetailed(costPerSession)}</p>
          </CardContent>
        </Card>
      </div>

      {costSummary?.byService && costSummary.byService.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cost Breakdown by Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {costSummary.byService.map((service, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <p className="text-xs font-medium text-slate-600 capitalize">{service.service}</p>
                  </div>
                  <p className="text-lg font-bold text-slate-900">{formatCostDetailed(service.total_cost)}</p>
                  <p className="text-xs text-slate-400">{service.total_requests} calls</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Activity Trend</CardTitle>
            <CardDescription className="text-xs">Sessions and users over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      stroke="#94a3b8"
                      fontSize={11}
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip 
                      labelFormatter={(val) => new Date(val).toLocaleDateString()}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="session_count" stroke="#0ea5e9" fill="url(#colorSessions)" strokeWidth={2} name="Sessions" />
                    <Line type="monotone" dataKey="unique_users" stroke="#10b981" strokeWidth={2} dot={false} name="Users" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                  No session data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Scenarios</CardTitle>
            <CardDescription className="text-xs">Most practiced this period</CardDescription>
          </CardHeader>
          <CardContent>
            {topScenarios.length > 0 ? (
              <div className="space-y-2">
                {topScenarios.map((scenario, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{scenario.name}</p>
                      <p className="text-xs text-slate-500">{scenario.skill_name || "General"}</p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-sm font-semibold text-slate-900">{scenario.session_count}</p>
                      <p className="text-xs text-slate-500">sessions</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-sm">
                No scenario data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [engagementStats, setEngagementStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchEngagementStats();
  }, [page]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/users?page=${page}&limit=15`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.users);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEngagementStats() {
    try {
      const res = await fetch("/api/admin/analytics/user-breakdown");
      const data = await res.json();
      if (data.success) {
        setEngagementStats(data.data);
      }
    } catch (err) {
      console.error("Error fetching engagement stats:", err);
    }
  }

  async function updateUserRole(userId: string, role: string) {
    try {
      await fetch(`/api/admin/config/user-roles/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      fetchUsers();
    } catch (err) {
      console.error("Error updating user role:", err);
    }
  }

  const filteredUsers = searchQuery 
    ? users.filter(u => 
        u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.first_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Users</h2>
        <p className="text-slate-500 text-sm">Monitor user engagement and manage accounts</p>
      </div>

      {engagementStats?.engagementMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {engagementStats.engagementMetrics.map((tier: any, idx: number) => (
            <Card key={idx} className="bg-white">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-slate-500">{tier.engagement_tier}</p>
                <p className="text-2xl font-bold text-slate-900">{tier.user_count}</p>
                <p className="text-xs text-slate-400">users</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base">All Users</CardTitle>
              <CardDescription className="text-xs">Click any row to see detailed activity</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg w-48"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sessions</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Time</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Score</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Active</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr 
                        key={user.id} 
                        className="border-b hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/admin/users/${user.id}`)}
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium text-sm">
                              {(user.first_name?.[0] || user.username?.[0] || "?").toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 text-sm">{user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.username}</p>
                              <p className="text-xs text-slate-500">{user.email || ""}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge 
                            className={`text-xs ${
                              user.role === "admin" ? "bg-red-100 text-red-700" :
                              user.role === "coach" ? "bg-blue-100 text-blue-700" :
                              "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {user.role || "learner"}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-sm">{user.total_sessions || 0}</td>
                        <td className="py-2.5 px-3 text-slate-600 text-sm">{formatDuration(Number(user.total_duration) || 0)}</td>
                        <td className="py-2.5 px-3">
                          <span className={`font-medium text-sm ${
                            Number(user.avg_score) >= 80 ? "text-green-600" :
                            Number(user.avg_score) >= 60 ? "text-yellow-600" :
                            Number(user.avg_score) > 0 ? "text-red-600" : "text-slate-400"
                          }`}>
                            {user.avg_score ? Math.round(user.avg_score) : "-"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-slate-500">
                          {user.last_session ? new Date(user.last_session).toLocaleDateString() : user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never"}
                        </td>
                        <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={user.role || "learner"}
                            onChange={(e) => updateUserRole(user.id, e.target.value)}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
                          >
                            <option value="learner">Learner</option>
                            <option value="coach">Coach</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<"overview" | "funnel" | "quality">("overview");
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [sqiData, setSqiData] = useState<any>(null);
  const [period, setPeriod] = useState("7d");

  useEffect(() => {
    fetchData();
  }, [page, period]);

  async function fetchData() {
    setLoading(true);
    try {
      const [sessionsRes, dailyRes, funnelRes, sqiRes] = await Promise.all([
        fetch(`/api/admin/analytics/sessions-list?page=${page}&limit=20`),
        fetch("/api/admin/analytics/sessions?days=14"),
        fetch(`/api/admin/analytics/funnel?period=${period}`),
        fetch(`/api/admin/analytics/session-quality?period=${period}`)
      ]);

      const [sessionsData, dailyData, funnelDataRes, sqiDataRes] = await Promise.all([
        sessionsRes.json(),
        dailyRes.json(),
        funnelRes.json(),
        sqiRes.json()
      ]);

      if (sessionsData.success) {
        setSessions(sessionsData.data.sessions || []);
        setTotalPages(sessionsData.data.pagination?.totalPages || 1);
      }
      if (dailyData.success) {
        setDailyStats(dailyData.data.reverse());
      }
      if (funnelDataRes.success) {
        setFunnelData(funnelDataRes.data.funnel || []);
      }
      if (sqiDataRes.success) {
        setSqiData(sqiDataRes.data);
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  const completionRate = sessions.length > 0 
    ? Math.round((sessions.filter(s => s.duration > 60).length / sessions.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Sessions</h2>
          <p className="text-slate-500 text-sm">Session analytics, funnel, and quality metrics</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-slate-100 rounded-lg p-1">
            {["24h", "7d", "30d"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  period === p ? "bg-white shadow-sm text-slate-900" : "text-slate-600"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === "overview" ? "bg-white shadow-sm text-slate-900" : "text-slate-600"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("funnel")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === "funnel" ? "bg-white shadow-sm text-slate-900" : "text-slate-600"
              }`}
            >
              Funnel
            </button>
            <button
              onClick={() => setActiveTab("quality")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === "quality" ? "bg-white shadow-sm text-slate-900" : "text-slate-600"
              }`}
            >
              Quality (SQI)
            </button>
          </div>
        </div>
      </div>

      {activeTab === "overview" && (
      <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-slate-500">Total Sessions (14d)</p>
            <p className="text-2xl font-bold text-slate-900">{dailyStats.reduce((sum, d) => sum + Number(d.session_count), 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-slate-500">Avg Duration</p>
            <p className="text-2xl font-bold text-slate-900">{formatDuration(dailyStats.reduce((sum, d) => sum + Number(d.avg_duration), 0) / (dailyStats.length || 1))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-slate-500">Unique Users</p>
            <p className="text-2xl font-bold text-slate-900">{dailyStats.reduce((sum, d) => sum + Number(d.unique_users), 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-slate-500">Completion Rate</p>
            <p className="text-2xl font-bold text-slate-900">{completionRate}%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Daily Session Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            {dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    stroke="#94a3b8"
                    fontSize={11}
                  />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip 
                    labelFormatter={(val) => new Date(val).toLocaleDateString()}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="session_count" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No session data yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Sessions</CardTitle>
          <CardDescription className="text-xs">Individual session details</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">No sessions recorded yet</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">User</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Scenario</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Duration</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Score</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr key={session.id} className="border-b hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-sm">{session.username || "Unknown"}</td>
                        <td className="py-2.5 px-3 text-sm text-slate-600">{session.scenario || session.skill || "Practice"}</td>
                        <td className="py-2.5 px-3 text-sm">{formatDuration(session.duration || 0)}</td>
                        <td className="py-2.5 px-3">
                          <span className={`text-sm font-medium ${
                            session.overall_score >= 80 ? "text-green-600" :
                            session.overall_score >= 60 ? "text-yellow-600" :
                            session.overall_score > 0 ? "text-red-600" : "text-slate-400"
                          }`}>
                            {session.overall_score ? Math.round(session.overall_score) : "-"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-slate-500">
                          {new Date(session.start_time).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3">
                          {session.duration > 60 ? (
                            <Badge className="bg-green-100 text-green-700 text-xs">Completed</Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-700 text-xs">Short</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      </>
      )}

      {activeTab === "funnel" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session Funnel</CardTitle>
            <CardDescription className="text-xs">Where users drop off in the session flow</CardDescription>
          </CardHeader>
          <CardContent>
            {funnelData.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                <p>No funnel data yet</p>
                <p className="text-xs mt-2">Funnel tracking will populate as users navigate through the app</p>
              </div>
            ) : (
              <div className="space-y-3">
                {funnelData.map((step, index) => {
                  const maxCount = Math.max(...funnelData.map(s => s.count), 1);
                  const widthPercent = (step.count / maxCount) * 100;
                  
                  return (
                    <div key={step.step} className="relative">
                      <div className="flex items-center gap-3">
                        <div className="w-32 text-xs text-slate-600 text-right">{step.label}</div>
                        <div className="flex-1 h-10 bg-slate-100 rounded-lg overflow-hidden relative">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                            style={{ width: `${widthPercent}%` }}
                          />
                          <div className="absolute inset-0 flex items-center px-3">
                            <span className="text-sm font-medium text-white drop-shadow">{step.count}</span>
                          </div>
                        </div>
                        <div className="w-20 text-right">
                          {step.dropOffPercent > 0 ? (
                            <span className={`text-xs font-medium ${step.dropOffPercent > 30 ? "text-red-600" : step.dropOffPercent > 15 ? "text-amber-600" : "text-slate-500"}`}>
                              -{step.dropOffPercent}%
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "quality" && sqiData && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-l-4 border-l-cyan-500">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-slate-500">Avg SQI Score</p>
                <p className="text-2xl font-bold text-slate-900">{sqiData.summary?.avgSQI || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-slate-500">High Quality</p>
                <p className="text-2xl font-bold text-green-600">{sqiData.summary?.highQualityCount || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-slate-500">Low Quality</p>
                <p className="text-2xl font-bold text-red-600">{sqiData.summary?.lowQualityCount || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-slate-400">
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-slate-500">Total Sessions</p>
                <p className="text-2xl font-bold text-slate-900">{sqiData.summary?.totalSessions || 0}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quality Distribution</CardTitle>
              <CardDescription className="text-xs">Session Quality Index (SQI) breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {sqiData.summary?.qualityDistribution && (
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Excellent (90+)", value: sqiData.summary.qualityDistribution.excellent, color: "bg-green-500" },
                    { label: "Good (75-89)", value: sqiData.summary.qualityDistribution.good, color: "bg-blue-500" },
                    { label: "Fair (50-74)", value: sqiData.summary.qualityDistribution.fair, color: "bg-amber-500" },
                    { label: "Poor (<50)", value: sqiData.summary.qualityDistribution.poor, color: "bg-red-500" }
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <div className={`${item.color} text-white text-2xl font-bold rounded-lg py-4`}>
                        {item.value}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">{item.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Sessions by Quality</CardTitle>
              <CardDescription className="text-xs">Sessions with their SQI scores</CardDescription>
            </CardHeader>
            <CardContent>
              {(sqiData.sessions?.length || 0) === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">No session quality data yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">User</th>
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Scenario</th>
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Duration</th>
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">SQI</th>
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Completed</th>
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Analyzed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sqiData.sessions?.slice(0, 20).map((session: any) => (
                        <tr key={session.id} className="border-b hover:bg-slate-50">
                          <td className="py-2.5 px-3 text-sm">{session.username || "Unknown"}</td>
                          <td className="py-2.5 px-3 text-sm text-slate-600">{session.scenario_name || "Practice"}</td>
                          <td className="py-2.5 px-3 text-sm">{formatDuration(session.duration || 0)}</td>
                          <td className="py-2.5 px-3">
                            <span className={`text-sm font-bold px-2 py-1 rounded ${
                              session.sqi_score >= 90 ? "bg-green-100 text-green-700" :
                              session.sqi_score >= 75 ? "bg-blue-100 text-blue-700" :
                              session.sqi_score >= 50 ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {session.sqi_score}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {session.completed ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400" />
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {session.analysis_viewed ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-slate-300" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function ContentPage() {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"scenarios" | "skills">("scenarios");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [scenariosRes, skillsRes] = await Promise.all([
        fetch("/api/admin/analytics/scenarios"),
        fetch("/api/admin/analytics/skills")
      ]);

      const [scenariosData, skillsData] = await Promise.all([
        scenariosRes.json(),
        skillsRes.json()
      ]);

      if (scenariosData.success) setScenarios(scenariosData.data);
      if (skillsData.success) setSkills(skillsData.data);
    } catch (err) {
      console.error("Error fetching content data:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Content</h2>
          <p className="text-slate-500 text-sm">Scenario and skill performance</p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("scenarios")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === "scenarios" ? "bg-white shadow-sm text-slate-900" : "text-slate-600"
            }`}
          >
            Scenarios
          </button>
          <button
            onClick={() => setActiveTab("skills")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === "skills" ? "bg-white shadow-sm text-slate-900" : "text-slate-600"
            }`}
          >
            Skills
          </button>
        </div>
      </div>

      {activeTab === "scenarios" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Scenario Performance</CardTitle>
            <CardDescription className="text-xs">Usage and effectiveness metrics for each scenario</CardDescription>
          </CardHeader>
          <CardContent>
            {scenarios.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">No scenario data yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Scenario</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Skill</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Sessions</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Users</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Avg Score</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Avg Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarios.map((scenario) => (
                      <tr key={scenario.id} className="border-b hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <p className="font-medium text-sm text-slate-900">{scenario.name}</p>
                        </td>
                        <td className="py-2.5 px-3 text-sm text-slate-600">{scenario.skill_name || "General"}</td>
                        <td className="py-2.5 px-3 text-sm font-medium">{scenario.session_count || 0}</td>
                        <td className="py-2.5 px-3 text-sm">{scenario.unique_users || 0}</td>
                        <td className="py-2.5 px-3">
                          <span className={`text-sm font-medium ${
                            Number(scenario.avg_score) >= 80 ? "text-green-600" :
                            Number(scenario.avg_score) >= 60 ? "text-yellow-600" :
                            Number(scenario.avg_score) > 0 ? "text-red-600" : "text-slate-400"
                          }`}>
                            {scenario.avg_score ? Math.round(scenario.avg_score) : "-"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-sm text-slate-600">{formatDuration(Number(scenario.avg_duration) || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "skills" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Skill Performance</CardTitle>
            <CardDescription className="text-xs">Usage and effectiveness metrics for each skill area</CardDescription>
          </CardHeader>
          <CardContent>
            {skills.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">No skill data yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Skill</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Category</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Sessions</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Users</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Avg Score</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Total Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skills.map((skill) => (
                      <tr key={skill.id} className="border-b hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <p className="font-medium text-sm text-slate-900">{skill.name}</p>
                        </td>
                        <td className="py-2.5 px-3 text-sm text-slate-600">{skill.category || "General"}</td>
                        <td className="py-2.5 px-3 text-sm font-medium">{skill.session_count || 0}</td>
                        <td className="py-2.5 px-3 text-sm">{skill.unique_users || 0}</td>
                        <td className="py-2.5 px-3">
                          <span className={`text-sm font-medium ${
                            Number(skill.avg_score) >= 80 ? "text-green-600" :
                            Number(skill.avg_score) >= 60 ? "text-yellow-600" :
                            Number(skill.avg_score) > 0 ? "text-red-600" : "text-slate-400"
                          }`}>
                            {skill.avg_score ? Math.round(skill.avg_score) : "-"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-sm text-slate-600">{formatDuration(Number(skill.total_duration) || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AvatarsPage() {
  const [avatars, setAvatars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/analytics/avatars");
      const data = await res.json();
      if (data.success) {
        setAvatars(data.data);
      }
    } catch (err) {
      console.error("Error fetching avatar data:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Avatars</h2>
        <p className="text-slate-500 text-sm">Avatar usage and performance metrics</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Avatar Performance</CardTitle>
          <CardDescription className="text-xs">Usage statistics for each avatar</CardDescription>
        </CardHeader>
        <CardContent>
          {avatars.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">No avatar usage data yet</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {avatars.map((avatar) => (
                <div key={avatar.id} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                      <Video className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{avatar.name}</p>
                      <p className="text-xs text-slate-500">{avatar.gender || "Neutral"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs">Sessions</p>
                      <p className="font-medium">{avatar.session_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Avg Duration</p>
                      <p className="font-medium">{formatDuration(Number(avatar.avg_duration) || 0)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Avg Score</p>
                      <p className={`font-medium ${
                        Number(avatar.avg_score) >= 80 ? "text-green-600" :
                        Number(avatar.avg_score) >= 60 ? "text-yellow-600" : "text-slate-600"
                      }`}>
                        {avatar.avg_score ? Math.round(avatar.avg_score) : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Users</p>
                      <p className="font-medium">{avatar.unique_users || 0}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CostsPage() {
  const [costsByUser, setCostsByUser] = useState<any[]>([]);
  const [costSummary, setCostSummary] = useState<CostSummary | null>(null);
  const [dailyCosts, setDailyCosts] = useState<any[]>([]);
  const [pricing, setPricing] = useState<Record<string, number>>({});
  const [budgetGuards, setBudgetGuards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [filterService, setFilterService] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, [timePeriod]);

  async function fetchData() {
    setLoading(true);
    const days = timePeriod === "7d" ? 7 : timePeriod === "30d" ? 30 : 90;
    try {
      const [usersRes, summaryRes, dailyRes, pricingRes, guardsRes] = await Promise.all([
        fetch(`/api/admin/costs/by-user?days=${days}`),
        fetch(`/api/admin/costs/summary?days=${days}`),
        fetch(`/api/admin/costs/daily?days=${days}`),
        fetch("/api/admin/costs/pricing"),
        fetch("/api/admin/budget-guards")
      ]);

      const [usersData, summaryData, dailyData, pricingData, guardsData] = await Promise.all([
        usersRes.json(),
        summaryRes.json(),
        dailyRes.json(),
        pricingRes.json(),
        guardsRes.json()
      ]);

      if (usersData.success) setCostsByUser(usersData.data);
      if (summaryData.success) setCostSummary(summaryData.data);
      if (dailyData.success) setDailyCosts(dailyData.data);
      if (pricingData.success) setPricing(pricingData.data);
      if (guardsData.success) setBudgetGuards(guardsData.data || []);
    } catch (err) {
      console.error("Error fetching cost data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function saveBudgetGuard(guardType: string, limitValue: number, isActive: boolean) {
    try {
      const res = await fetch("/api/admin/budget-guards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guardType, limitValue, isActive, fallbackAction: "warn" })
      });
      const data = await res.json();
      if (data.success) setBudgetGuards(data.data);
    } catch (err) {
      console.error("Error saving budget guard:", err);
    }
  }

  async function updatePricing(key: string, value: number) {
    try {
      await fetch("/api/admin/costs/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value })
      });
      setPricing(p => ({ ...p, [key]: value }));
    } catch (err) {
      console.error("Error updating pricing:", err);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  const filteredUsers = filterService === "all" 
    ? costsByUser 
    : costsByUser.filter(u => {
        if (filterService === "openai") return u.openai_cost > 0;
        if (filterService === "heygen") return u.heygen_cost > 0;
        if (filterService === "tavily") return u.tavily_cost > 0;
        return true;
      });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Costs</h2>
          <p className="text-slate-500 text-sm">API spending and budget management</p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-1">
          {(["7d", "30d", "90d"] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                timePeriod === period ? "bg-white shadow-sm text-slate-900" : "text-slate-600"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {costSummary?.byService?.map((service, idx) => (
          <Card key={idx}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <p className="text-xs text-slate-500 uppercase tracking-wide">{service.service}</p>
              </div>
              <p className="text-lg font-bold">{formatCostDetailed(service.total_cost)}</p>
              <p className="text-xs text-slate-400">{service.total_requests} calls</p>
            </CardContent>
          </Card>
        ))}
        <Card className="bg-slate-900 text-white">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Total ({timePeriod})</p>
            <p className="text-lg font-bold">{formatCost(costSummary?.totalCost || 0)}</p>
            <p className="text-xs text-slate-400">all services</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pricing Configuration</CardTitle>
          <CardDescription className="text-xs">Set cost rates for API tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">GPT-4 Input (/1K)</label>
              <input
                type="number"
                step="0.001"
                value={pricing.openai_gpt4_price_per_1k_input || 0.01}
                onChange={(e) => updatePricing("openai_gpt4_price_per_1k_input", parseFloat(e.target.value))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">GPT-4 Output (/1K)</label>
              <input
                type="number"
                step="0.001"
                value={pricing.openai_gpt4_price_per_1k_output || 0.03}
                onChange={(e) => updatePricing("openai_gpt4_price_per_1k_output", parseFloat(e.target.value))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">Whisper (/min)</label>
              <input
                type="number"
                step="0.001"
                value={pricing.openai_whisper_price_per_minute || 0.006}
                onChange={(e) => updatePricing("openai_whisper_price_per_minute", parseFloat(e.target.value))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">Tavily (/search)</label>
              <input
                type="number"
                step="0.001"
                value={pricing.tavily_price_per_search || 0.001}
                onChange={(e) => updatePricing("tavily_price_per_search", parseFloat(e.target.value))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">HeyGen (/min)</label>
              <input
                type="number"
                step="0.01"
                value={pricing.heygen_price_per_minute || 0.10}
                onChange={(e) => updatePricing("heygen_price_per_minute", parseFloat(e.target.value))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-orange-500" />
            Budget Guards
          </CardTitle>
          <CardDescription className="text-xs">Set spending limits to control costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { type: "max_cost_per_session", label: "Max Cost per Session", unit: "$", defaultValue: 1.00 },
              { type: "max_daily_cost", label: "Max Daily Total Cost", unit: "$", defaultValue: 50.00 },
              { type: "max_tavily_per_user_day", label: "Max Tavily Searches/User/Day", unit: "searches", defaultValue: 20 }
            ].map((guard) => {
              const existingGuard = budgetGuards.find(g => g.guardType === guard.type);
              return (
                <div key={guard.type} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-medium">{guard.label}</p>
                      <p className="text-xs text-slate-500">
                        {existingGuard?.isActive ? "Active" : "Inactive"}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const current = existingGuard?.isActive ?? false;
                        saveBudgetGuard(guard.type, existingGuard?.limitValue || guard.defaultValue, !current);
                      }}
                      className={`text-xs px-2 py-1 rounded ${
                        existingGuard?.isActive 
                          ? "bg-green-100 text-green-700" 
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {existingGuard?.isActive ? "ON" : "OFF"}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {guard.unit === "$" && <span className="text-slate-400">$</span>}
                    <input
                      type="number"
                      step={guard.unit === "$" ? "0.01" : "1"}
                      value={existingGuard?.limitValue || guard.defaultValue}
                      onChange={(e) => saveBudgetGuard(guard.type, parseFloat(e.target.value), existingGuard?.isActive ?? false)}
                      className="flex-1 border border-slate-200 rounded px-2 py-1.5 text-sm"
                    />
                    {guard.unit !== "$" && <span className="text-xs text-slate-400">{guard.unit}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base">Costs by User</CardTitle>
              <CardDescription className="text-xs">Estimated API costs per user</CardDescription>
            </div>
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5"
            >
              <option value="all">All Services</option>
              <option value="openai">OpenAI</option>
              <option value="heygen">HeyGen</option>
              <option value="tavily">Tavily</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">No usage data available yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">User</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Requests</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">OpenAI</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Whisper</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Tavily</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">HeyGen</th>
                    <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.user_id} className="border-b hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <p className="font-medium text-sm">{user.username}</p>
                      </td>
                      <td className="py-2.5 px-3 text-sm">{user.total_requests}</td>
                      <td className="py-2.5 px-3 text-sm text-slate-600">{formatCostDetailed(user.openai_cost || 0)}</td>
                      <td className="py-2.5 px-3 text-sm text-slate-600">{formatCostDetailed(user.whisper_cost || 0)}</td>
                      <td className="py-2.5 px-3 text-sm text-slate-600">{formatCostDetailed(user.tavily_cost || 0)}</td>
                      <td className="py-2.5 px-3 text-sm text-slate-600">{formatCostDetailed(user.heygen_cost || 0)}</td>
                      <td className="py-2.5 px-3 font-medium text-sm">{formatCostDetailed(user.total_cost || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface AdminJob {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  jdText: string | null;
  status: string;
  applyLinkSlug: string;
  candidateCount: number;
  shareToken: string | null;
  generatedInterviewPlan: any;
  createdAt: string;
}

interface AdminCompany {
  id: string;
  name: string;
  domain: string | null;
}

function JobsPage() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<AdminJob | null>(null);
  const [creating, setCreating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  
  const [newJob, setNewJob] = useState({
    companyId: "",
    companyName: "",
    title: "",
    jdText: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [jobsRes, companiesRes] = await Promise.all([
        fetch("/api/admin/jobs"),
        fetch("/api/admin/companies")
      ]);
      
      const jobsData = await jobsRes.json();
      const companiesData = await companiesRes.json();
      
      if (jobsData.success) setJobs(jobsData.jobs);
      if (companiesData.success) setCompanies(companiesData.companies);
    } catch (err) {
      console.error("Error fetching jobs:", err);
    } finally {
      setLoading(false);
    }
  }

  async function createJob() {
    if (!newJob.title.trim()) return;
    
    setCreating(true);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: newJob.companyId || null,
          companyName: newJob.companyName || "Demo Company",
          title: newJob.title,
          jdText: newJob.jdText
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setJobs([data.job, ...jobs]);
        setShowCreateDialog(false);
        setNewJob({ companyId: "", companyName: "", title: "", jdText: "" });
      }
    } catch (err) {
      console.error("Error creating job:", err);
    } finally {
      setCreating(false);
    }
  }

  async function generateShareToken(jobId: string) {
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/share-token`, {
        method: "POST"
      });
      
      const data = await res.json();
      if (data.success) {
        setJobs(jobs.map(j => j.id === jobId ? { ...j, shareToken: data.token } : j));
      }
    } catch (err) {
      console.error("Error generating share token:", err);
    }
  }

  function copyShareLink(job: AdminJob) {
    const link = job.shareToken 
      ? `${window.location.origin}/invite/${job.shareToken}`
      : `${window.location.origin}/apply/${job.applyLinkSlug}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(job.id);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Job Management</h2>
          <p className="text-slate-500 text-sm">Create jobs, generate interview plans, and share with candidates</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-[#24c4b8] hover:bg-[#1db0a5]">
          <Briefcase className="h-4 w-4 mr-2" />
          Add New Job
        </Button>
      </div>

      {showCreateDialog && (
        <Card className="border-2 border-[#24c4b8]/20">
          <CardHeader>
            <CardTitle className="text-base">Create New Job</CardTitle>
            <CardDescription>Add a job description to generate an interview plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Company</label>
                {companies.length > 0 ? (
                  <select
                    value={newJob.companyId}
                    onChange={(e) => setNewJob({ ...newJob, companyId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="">Select existing company...</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={newJob.companyName}
                    onChange={(e) => setNewJob({ ...newJob, companyName: e.target.value })}
                    placeholder="Enter company name"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Job Title</label>
                <input
                  type="text"
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  placeholder="e.g., Senior Product Manager"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Job Description</label>
              <textarea
                value={newJob.jdText}
                onChange={(e) => setNewJob({ ...newJob, jdText: e.target.value })}
                placeholder="Paste the full job description here..."
                rows={6}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button 
                onClick={createJob} 
                disabled={creating || !newJob.title.trim()}
                className="bg-[#24c4b8] hover:bg-[#1db0a5]"
              >
                {creating ? "Creating..." : "Create & Generate Interview Plan"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No jobs created yet. Add a job to get started.</p>
            </CardContent>
          </Card>
        ) : (
          jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-slate-900">{job.title}</h3>
                      <Badge className={`text-xs ${
                        job.status === 'active' ? 'bg-green-100 text-green-700' :
                        job.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {job.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 mb-3">{job.companyName || 'No company'}</p>
                    
                    {job.generatedInterviewPlan && (
                      <div className="flex gap-2 flex-wrap mb-3">
                        {job.generatedInterviewPlan.phases?.map((phase: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {phase.name} ({phase.mins}min)
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {job.candidateCount} candidates
                      </span>
                      <span>Created {new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {!job.shareToken ? (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => generateShareToken(job.id)}
                      >
                        Generate Link
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyShareLink(job)}
                        className="gap-2"
                      >
                        {copiedToken === job.id ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <FileText className="h-3 w-3" />
                            Copy Link
                          </>
                        )}
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                    >
                      {selectedJob?.id === job.id ? 'Hide Details' : 'View Details'}
                    </Button>
                  </div>
                </div>
                
                {selectedJob?.id === job.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Job Description</h4>
                        <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 max-h-40 overflow-y-auto">
                          {job.jdText || 'No description provided'}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Generated Interview Plan</h4>
                        {job.generatedInterviewPlan ? (
                          <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-2">
                            <p><strong>Total Duration:</strong> {job.generatedInterviewPlan.totalMins || job.generatedInterviewPlan.totalMinutes} minutes</p>
                            {job.generatedInterviewPlan.roleArchetype && (
                              <p><strong>Role Type:</strong> {job.generatedInterviewPlan.roleArchetype.name || job.generatedInterviewPlan.roleArchetype.id}</p>
                            )}
                            <div>
                              <strong>Phases:</strong>
                              <ul className="list-disc list-inside mt-1">
                                {job.generatedInterviewPlan.phases?.map((phase: any, idx: number) => (
                                  <li key={idx}>{phase.name}: {phase.description}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-400">
                            No interview plan generated
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
