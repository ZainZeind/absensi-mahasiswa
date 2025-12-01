import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, LogOut, Play, Square, Users, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Class {
  id: string;
  class_name: string;
  room: string;
  courses: {
    course_name: string;
    course_code: string;
  };
}

const LecturerDashboard = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [activeSessions, setActiveSessions] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Verify lecturer role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "lecturer")
        .single();

      if (!roleData) {
        navigate("/dashboard");
        return;
      }

      loadClasses(session.user.id);
    };

    checkAuth();
  }, [navigate]);

  const loadClasses = async (userId: string) => {
    // Get lecturer record
    const { data: lecturer } = await supabase
      .from("lecturers")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (lecturer) {
      // Get classes taught by this lecturer
      const { data: classData } = await supabase
        .from("classes")
        .select(`
          id,
          class_name,
          room,
          courses (
            course_name,
            course_code
          )
        `)
        .eq("lecturer_id", lecturer.id);

      if (classData) {
        setClasses(classData as Class[]);
      }

      // Check for active sessions
      const { data: sessions } = await supabase
        .from("attendance_sessions")
        .select("class_id")
        .eq("status", "active")
        .in("class_id", classData?.map(c => c.id) || []);

      if (sessions) {
        setActiveSessions(new Set(sessions.map(s => s.class_id)));
      }
    }
  };

  const handleStartSession = async (classId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("attendance_sessions")
      .insert({
        class_id: classId,
        session_date: new Date().toISOString().split('T')[0],
        start_time: new Date().toISOString(),
        status: "active",
        created_by: session.user.id,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to start session",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Session Started!",
        description: "Students can now check in for attendance",
      });
      setActiveSessions(prev => new Set(prev).add(classId));
    }
  };

  const handleStopSession = async (classId: string) => {
    const { error } = await supabase
      .from("attendance_sessions")
      .update({ 
        status: "closed",
        end_time: new Date().toISOString(),
      })
      .eq("class_id", classId)
      .eq("status", "active");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to stop session",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Session Ended",
        description: "Attendance session has been closed",
      });
      setActiveSessions(prev => {
        const newSet = new Set(prev);
        newSet.delete(classId);
        return newSet;
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Lecturer Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage Your Classes</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">My Classes</h2>
          <p className="text-muted-foreground">Start attendance sessions and monitor your classes</p>
        </div>

        {classes.length === 0 ? (
          <Card className="glass-card p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold mb-2">No Classes Assigned</h3>
            <p className="text-muted-foreground">Contact administration to get assigned to classes</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem, index) => {
              const isActive = activeSessions.has(classItem.id);
              return (
                <Card 
                  key={classItem.id}
                  className="glass-card p-6 hover-lift animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{classItem.class_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {classItem.courses?.course_code} - {classItem.courses?.course_name}
                      </p>
                    </div>
                    <Badge variant={isActive ? "default" : "secondary"}>
                      {isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                    <Users className="w-4 h-4" />
                    <span>Room {classItem.room}</span>
                  </div>

                  <div className="flex gap-2">
                    {isActive ? (
                      <Button 
                        onClick={() => handleStopSession(classItem.id)}
                        variant="destructive"
                        className="w-full"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Stop Session
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleStartSession(classItem.id)}
                        className="w-full bg-gradient-to-r from-primary to-primary-glow"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Session
                      </Button>
                    )}
                  </div>

                  {isActive && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <p className="text-sm text-center text-muted-foreground">
                        Students can now scan faces to check in
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LecturerDashboard;
