import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, GraduationCap, BookOpen, Monitor, UserCheck, LogOut } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    students: 0,
    lecturers: 0,
    courses: 0,
    devices: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Verify admin role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      if (!roleData) {
        navigate("/dashboard");
        return;
      }

      // Load stats
      loadStats();
    };

    checkAuth();
  }, [navigate]);

  const loadStats = async () => {
    const [students, lecturers, courses, devices] = await Promise.all([
      supabase.from("students").select("id", { count: "exact", head: true }),
      supabase.from("lecturers").select("id", { count: "exact", head: true }),
      supabase.from("courses").select("id", { count: "exact", head: true }),
      supabase.from("devices").select("id", { count: "exact", head: true }),
    ]);

    setStats({
      students: students.count || 0,
      lecturers: lecturers.count || 0,
      courses: courses.count || 0,
      devices: devices.count || 0,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const statCards = [
    { icon: Users, label: "Total Students", value: stats.students, color: "from-blue-500 to-purple-500" },
    { icon: GraduationCap, label: "Total Lecturers", value: stats.lecturers, color: "from-purple-500 to-pink-500" },
    { icon: BookOpen, label: "Total Courses", value: stats.courses, color: "from-pink-500 to-red-500" },
    { icon: Monitor, label: "Devices", value: stats.devices, color: "from-cyan-500 to-blue-500" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Face Recognition Attendance System</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Card 
              key={index}
              className="glass-card hover-lift p-6 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-glow`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* Management Tabs */}
        <Card className="glass-card p-6">
          <Tabs defaultValue="students" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="lecturers">Lecturers</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="classes">Classes</TabsTrigger>
              <TabsTrigger value="devices">Devices</TabsTrigger>
            </TabsList>

            <TabsContent value="students">
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">Student Management</h3>
                <p className="text-muted-foreground mb-4">Add, edit, and manage student records</p>
                <Button className="bg-gradient-to-r from-primary to-primary-glow">
                  Add New Student
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="lecturers">
              <div className="text-center py-12">
                <GraduationCap className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">Lecturer Management</h3>
                <p className="text-muted-foreground mb-4">Add, edit, and manage lecturer records</p>
                <Button className="bg-gradient-to-r from-primary to-primary-glow">
                  Add New Lecturer
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="courses">
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">Course Management</h3>
                <p className="text-muted-foreground mb-4">Create and manage course offerings</p>
                <Button className="bg-gradient-to-r from-primary to-primary-glow">
                  Add New Course
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="classes">
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">Class Management</h3>
                <p className="text-muted-foreground mb-4">Create classes and manage enrollments</p>
                <Button className="bg-gradient-to-r from-primary to-primary-glow">
                  Create New Class
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="devices">
              <div className="text-center py-12">
                <Monitor className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">Device Management</h3>
                <p className="text-muted-foreground mb-4">Register and monitor face recognition devices</p>
                <Button className="bg-gradient-to-r from-primary to-primary-glow">
                  Register New Device
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
