import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Shield, Camera, Clock, TrendingUp, Users, Zap } from "lucide-react";
import heroImage from "@/assets/hero-face-recognition.jpg";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Camera,
      title: "Face Recognition",
      description: "Advanced AI-powered facial recognition ensures accurate identity verification"
    },
    {
      icon: Shield,
      title: "Zero Proxy Attendance",
      description: "Eliminate fraudulent attendance with real-time biometric verification"
    },
    {
      icon: Clock,
      title: "Real-Time Tracking",
      description: "Monitor attendance sessions live with instant notifications"
    },
    {
      icon: TrendingUp,
      title: "Analytics Dashboard",
      description: "Comprehensive insights into attendance patterns and trends"
    },
    {
      icon: Users,
      title: "Multi-Role Access",
      description: "Tailored interfaces for admins, lecturers, and students"
    },
    {
      icon: Zap,
      title: "Instant Processing",
      description: "Lightning-fast face matching with sub-second response times"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-transparent to-background" />
        
        <div className="container relative z-10 mx-auto px-4 pt-20 pb-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up space-y-8">
              <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                <span className="text-sm font-medium text-primary">Next-Generation Attendance System</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="glow-text bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
                  Face Recognition
                </span>
                <br />
                Attendance System
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-lg">
                Eliminate proxy attendance with cutting-edge facial recognition technology. 
                Secure, accurate, and real-time attendance tracking for modern campuses.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/auth")}
                  className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 text-lg px-8 h-14 shadow-glow"
                >
                  Get Started
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate("/auth")}
                  className="border-2 text-lg px-8 h-14"
                >
                  Learn More
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold text-primary">99.9%</div>
                  <div className="text-sm text-muted-foreground">Accuracy Rate</div>
                </div>
                <div className="h-12 w-px bg-border" />
                <div>
                  <div className="text-3xl font-bold text-primary">&lt;1s</div>
                  <div className="text-sm text-muted-foreground">Response Time</div>
                </div>
                <div className="h-12 w-px bg-border" />
                <div>
                  <div className="text-3xl font-bold text-primary">0%</div>
                  <div className="text-sm text-muted-foreground">Proxy Rate</div>
                </div>
              </div>
            </div>

            <div className="relative animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-accent/30 blur-3xl rounded-full" />
              <img 
                src={heroImage} 
                alt="Face Recognition Technology" 
                className="relative z-10 rounded-2xl shadow-elevated border border-border/50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Why Choose Our System?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built with advanced AI and security features to ensure accurate and fraud-proof attendance tracking
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="glass-card hover-lift p-8 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-6 shadow-glow">
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Simple, secure, and seamless attendance process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: "01", title: "Lecturer Activates Session", desc: "Start an attendance session for your class with one click" },
              { step: "02", title: "Face Scan in Classroom", desc: "Students scan their faces using the classroom device" },
              { step: "03", title: "Instant Verification", desc: "AI matches faces and records attendance automatically" }
            ].map((item, index) => (
              <div key={index} className="text-center animate-fade-in-up" style={{ animationDelay: `${index * 0.15}s` }}>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold shadow-glow">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <Card className="glass-card p-12 text-center max-w-4xl mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 animate-glow-pulse" />
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4">
                Ready to Eliminate Proxy Attendance?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join modern campuses using AI-powered attendance tracking
              </p>
              <Button 
                size="lg"
                onClick={() => navigate("/auth")}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-12 h-14 shadow-glow"
              >
                Start Free Trial
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 Face Recognition Attendance System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
