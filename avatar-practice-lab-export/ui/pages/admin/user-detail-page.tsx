import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  ArrowLeft,
  User,
  Clock,
  Target,
  LogIn,
  Calendar,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
  Award,
  BarChart3
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
  Cell
} from "recharts";

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "0m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  async function fetchUserData() {
    setLoading(true);
    setError(null);
    try {
      const [userRes, detailsRes] = await Promise.all([
        fetch(`/api/admin/analytics/users?page=1&limit=100`),
        fetch(`/api/admin/analytics/user/${userId}`)
      ]);

      const [userData, detailsData] = await Promise.all([
        userRes.json(),
        detailsRes.json()
      ]);

      if (userData.success) {
        const foundUser = userData.data.users.find((u: any) => u.id === userId);
        if (foundUser) {
          setUser(foundUser);
        }
      }

      if (detailsData.success) {
        setUserDetails(detailsData.data);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Failed to load user data");
    } finally {
      setLoading(false);
    }
  }

  async function updateUserRole(role: string) {
    try {
      await fetch(`/api/admin/config/user-roles/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      fetchUserData();
    } catch (err) {
      console.error("Error updating user role:", err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <Button variant="outline" onClick={() => navigate("/admin")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Admin
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-500">{error || "User not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sessionsByMode = userDetails?.sessions?.reduce((acc: any, session: any) => {
    const mode = session.mode || session.session_type || "Practice";
    acc[mode] = (acc[mode] || 0) + 1;
    return acc;
  }, {}) || {};

  const modeChartData = Object.entries(sessionsByMode).map(([name, value]) => ({
    name,
    value
  }));

  const sessionsOverTime = userDetails?.sessions?.slice(0, 30).reverse().map((s: any) => ({
    date: new Date(s.start_time).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: s.overall_score || 0,
    duration: Math.round((s.duration || 0) / 60)
  })) || [];

  const skillScores = userDetails?.skillScores || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                {(user.first_name?.[0] || user.username?.[0] || "?").toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {user.first_name ? `${user.first_name} ${user.last_name || ""}` : user.username}
                </h1>
                <p className="text-sm text-slate-500">{user.email || user.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`${
                user.role === "admin" ? "bg-red-100 text-red-700" :
                user.role === "coach" ? "bg-blue-100 text-blue-700" :
                "bg-slate-100 text-slate-600"
              }`}>
                {user.role || "learner"}
              </Badge>
              <select
                value={user.role || "learner"}
                onChange={(e) => updateUserRole(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
              >
                <option value="learner">Learner</option>
                <option value="coach">Coach</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-l-4 border-l-cyan-500">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-cyan-500" />
                <p className="text-xs text-slate-500 uppercase">Total Sessions</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{user.total_sessions || 0}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-blue-500" />
                <p className="text-xs text-slate-500 uppercase">Practice Time</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatDuration(Number(user.total_duration) || 0)}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <p className="text-xs text-slate-500 uppercase">Avg Score</p>
              </div>
              <p className={`text-2xl font-bold ${
                Number(user.avg_score) >= 80 ? "text-green-600" :
                Number(user.avg_score) >= 60 ? "text-amber-600" :
                "text-slate-600"
              }`}>
                {user.avg_score ? Math.round(user.avg_score) : "-"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <LogIn className="h-4 w-4 text-purple-500" />
                <p className="text-xs text-slate-500 uppercase">Total Logins</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{user.login_count || userDetails?.loginEvents?.length || 0}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-amber-500" />
                <p className="text-xs text-slate-500 uppercase">Last Active</p>
              </div>
              <p className="text-lg font-bold text-slate-900">
                {user.last_session ? new Date(user.last_session).toLocaleDateString() : "Never"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-cyan-500" />
                Performance Over Time
              </CardTitle>
              <CardDescription className="text-xs">Session scores and duration trends</CardDescription>
            </CardHeader>
            <CardContent>
              {sessionsOverTime.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sessionsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                      <Line type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} name="Score" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                  No session data yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                Sessions by Mode
              </CardTitle>
              <CardDescription className="text-xs">Practice mode distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {modeChartData.length > 0 ? (
                <div className="h-48 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={modeChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {modeChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                  No session data yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <LogIn className="h-4 w-4 text-purple-500" />
                Recent Logins
              </CardTitle>
              <CardDescription className="text-xs">Login activity history</CardDescription>
            </CardHeader>
            <CardContent>
              {userDetails?.loginEvents && userDetails.loginEvents.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {userDetails.loginEvents.slice(0, 15).map((event: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span className="text-sm text-slate-700">
                          {new Date(event.occurredAt).toLocaleString()}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{event.ipAddress || "-"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">No login history</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" />
                Skill Performance
              </CardTitle>
              <CardDescription className="text-xs">Scores by skill area</CardDescription>
            </CardHeader>
            <CardContent>
              {skillScores.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {skillScores.map((skill: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-slate-700">{skill.skill_name}</span>
                          <span className={`text-sm font-medium ${
                            skill.avg_score >= 80 ? "text-green-600" :
                            skill.avg_score >= 60 ? "text-amber-600" :
                            "text-red-500"
                          }`}>{Math.round(skill.avg_score)}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              skill.avg_score >= 80 ? "bg-green-500" :
                              skill.avg_score >= 60 ? "bg-amber-500" :
                              "bg-red-500"
                            }`}
                            style={{ width: `${skill.avg_score}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">{skill.session_count} sessions</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">No skill data yet</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-cyan-500" />
              All Sessions
            </CardTitle>
            <CardDescription className="text-xs">Complete session history for this user</CardDescription>
          </CardHeader>
          <CardContent>
            {userDetails?.sessions && userDetails.sessions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Scenario/Skill</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Duration</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Score</th>
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userDetails.sessions.map((session: any, idx: number) => (
                      <tr key={idx} className="border-b hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-sm text-slate-600">
                          {new Date(session.start_time).toLocaleDateString()}
                          <span className="text-xs text-slate-400 ml-1">
                            {new Date(session.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant="outline" className="text-xs">
                            {session.mode || session.session_type || "Practice"}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-sm text-slate-700">
                          {session.scenario || session.skill || "-"}
                        </td>
                        <td className="py-2.5 px-3 text-sm text-slate-600">
                          {formatDuration(session.duration || 0)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`font-semibold text-sm ${
                            session.overall_score >= 80 ? "text-green-600" :
                            session.overall_score >= 60 ? "text-amber-600" :
                            session.overall_score > 0 ? "text-red-500" :
                            "text-slate-400"
                          }`}>
                            {session.overall_score ? Math.round(session.overall_score) : "-"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {session.end_time ? (
                            <span className="flex items-center gap-1 text-green-600 text-xs">
                              <CheckCircle className="h-3.5 w-3.5" /> Completed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-slate-400 text-xs">
                              <XCircle className="h-3.5 w-3.5" /> Incomplete
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-sm">No sessions recorded</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
