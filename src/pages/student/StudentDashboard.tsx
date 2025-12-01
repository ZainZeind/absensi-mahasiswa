import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User, LogOut, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";

interface AttendanceRecord {
  id: string;
  status: string;
  check_in_time: string;
  attendance_sessions: {
    session_date: string;
    classes: {
      class_name: string;
      courses: {
        course_name: string;
      };
    };
  };
}

const StudentDashboard = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    total: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Verify student role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "student")
        .single();

      if (!roleData) {
        navigate("/dashboard");
        return;
      }

      loadAttendance(session.user.id);
    };

    checkAuth();
  }, [navigate]);

  const loadAttendance = async (userId: string) => {
    // Get student record
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (student) {
      // Get attendance records
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select(`
          id,
          status,
          check_in_time,
          attendance_sessions (
            session_date,
            classes (
              class_name,
              courses (
                course_name
              )
            )
          )
        `)
        .eq("student_id", student.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (attendanceData) {
        setAttendance(attendanceData as AttendanceRecord[]);

        // Calculate stats
        const present = attendanceData.filter(a => a.status === "present").length;
        const absent = attendanceData.filter(a => a.status === "absent").length;
        const late = attendanceData.filter(a => a.status === "late").length;
        const total = attendanceData.length;

        setStats({ present, absent, late, total });
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "absent":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "late":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "absent":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "late":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default:
        return "bg-muted/10 text-muted-foreground border-muted/20";
    }
  };

  const attendanceRate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Student Dashboard</h1>
              <p className="text-sm text-muted-foreground">My Attendance Records</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card p-6">
            <p className="text-sm text-muted-foreground mb-2">Attendance Rate</p>
            <p className="text-3xl font-bold mb-3">{attendanceRate}%</p>
            <Progress value={attendanceRate} className="h-2" />
          </Card>

          <Card className="glass-card p-6">
            <p className="text-sm text-muted-foreground mb-2">Present</p>
            <p className="text-3xl font-bold text-green-500">{stats.present}</p>
          </Card>

          <Card className="glass-card p-6">
            <p className="text-sm text-muted-foreground mb-2">Absent</p>
            <p className="text-3xl font-bold text-red-500">{stats.absent}</p>
          </Card>

          <Card className="glass-card p-6">
            <p className="text-sm text-muted-foreground mb-2">Late</p>
            <p className="text-3xl font-bold text-yellow-500">{stats.late}</p>
          </Card>
        </div>

        {/* Attendance History */}
        <Card className="glass-card p-6">
          <h2 className="text-2xl font-bold mb-6">Recent Attendance</h2>

          {attendance.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">No Attendance Records</h3>
              <p className="text-muted-foreground">Your attendance history will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {attendance.map((record) => (
                <div 
                  key={record.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(record.status)}
                    <div>
                      <p className="font-semibold">
                        {record.attendance_sessions?.classes?.courses?.course_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {record.attendance_sessions?.classes?.class_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {new Date(record.attendance_sessions?.session_date).toLocaleDateString()}
                      </p>
                      {record.check_in_time && (
                        <p className="text-sm text-muted-foreground">
                          {new Date(record.check_in_time).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                    <Badge className={getStatusColor(record.status)}>
                      {record.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
