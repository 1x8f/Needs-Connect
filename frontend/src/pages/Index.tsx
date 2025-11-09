import { useState } from "react";
import { Heart, ShoppingBasket, Calendar, Users, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-community.jpg";

const Index = () => {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username to continue",
        variant: "destructive"
      });
      return;
    }

    const result = await login(username.trim());
    if (result.success && result.user) {
      toast({
        title: "Welcome!",
        description: `Logged in as ${result.user.username}`,
      });
      // Small delay to ensure state is updated before navigation
      setTimeout(() => {
        // Redirect based on role
        if (result.user?.role === 'manager') {
          navigate("/dashboard");
        } else {
          navigate("/needs");
        }
      }, 100);
    } else {
      toast({
        title: "Login failed",
        description: result.message || "Please try again",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-20 md:py-32">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 -z-10">
          <img 
            src={heroImage} 
            alt="Community helping each other" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-muted/50" />
        </div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-secondary/10 blur-3xl animate-float" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 h-96 w-96 rounded-full bg-accent/10 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        </div>

        <div className="container mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left Column - Hero Text */}
            <div className="animate-fade-in space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                Connect. Give. Transform Lives.
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight bg-gradient-to-br from-primary via-primary to-accent bg-clip-text text-transparent">
                Every Need
                <br />
                Finds a Helper
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                Join a community where compassion meets action. Connect with nonprofits, 
                fund urgent needs, and volunteer to make a real difference in your community.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Button size="lg" variant="warm" className="gap-2" onClick={() => navigate("/needs")}>
                  <Heart className="h-5 w-5" />
                  Start Helping Today
                </Button>
                <Button size="lg" variant="outline" onClick={() => {
                  document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  Learn More
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border/50">
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-primary">2.4K+</div>
                  <div className="text-sm text-muted-foreground">Needs Funded</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-secondary">890+</div>
                  <div className="text-sm text-muted-foreground">Active Helpers</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-accent">156</div>
                  <div className="text-sm text-muted-foreground">Nonprofits</div>
                </div>
              </div>
            </div>

            {/* Right Column - Login Card */}
            <Card className="shadow-glow border-2 animate-scale-in">
              <CardHeader className="space-y-2">
                <CardTitle className="text-3xl">Welcome Back</CardTitle>
                <CardDescription className="text-base">
                  Sign in to continue making a difference
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="username" className="text-sm font-medium">
                      Username
                    </label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-12"
                      required
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full">
                    Continue
                  </Button>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        New here?
                      </span>
                    </div>
                  </div>

                  <Button type="button" variant="outline" size="lg" className="w-full">
                    Create Account
                  </Button>
                </form>

                <div className="mt-6 p-4 rounded-lg bg-accent/10 border border-accent/20">
                  <p className="text-sm text-center text-muted-foreground">
                    <span className="font-medium text-accent">Demo:</span> Use <code className="px-2 py-1 bg-accent/20 rounded">admin</code> for manager role
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="px-6 py-20 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to transform lives in your community
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="shadow-soft hover:shadow-medium transition-all hover:-translate-y-1">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                  <ShoppingBasket className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Browse Needs</CardTitle>
                <CardDescription className="text-base">
                  Explore urgent requests from local nonprofits. From food supplies to volunteer opportunities.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-all hover:-translate-y-1">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl gradient-warm flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Fund & Support</CardTitle>
                <CardDescription className="text-base">
                  Choose what matters to you. Fund items, sponsor programs, or commit your time as a volunteer.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-all hover:-translate-y-1">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl gradient-cool flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Track Impact</CardTitle>
                <CardDescription className="text-base">
                  See the real difference you're making. Track your contributions and their impact on the community.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="px-6 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                Your Impact
                <br />
                <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                  Goes Further
                </span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Every contribution creates a ripple effect. When you fund a need, you're not just 
                providing an item – you're enabling organizations to focus on their mission, 
                helping families thrive, and building stronger communities.
              </p>
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Community Powered</h3>
                    <p className="text-muted-foreground">Built on trust and transparency, connecting real people with real needs.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Time Sensitive</h3>
                    <p className="text-muted-foreground">Priority alerts ensure urgent needs get immediate attention.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Card className="shadow-soft">
                <CardHeader>
                  <div className="text-4xl font-bold text-primary mb-2">$125K</div>
                  <CardDescription>Total Funding</CardDescription>
                </CardHeader>
              </Card>
              <Card className="shadow-soft">
                <CardHeader>
                  <div className="text-4xl font-bold text-secondary mb-2">3.2K</div>
                  <CardDescription>Items Delivered</CardDescription>
                </CardHeader>
              </Card>
              <Card className="shadow-soft">
                <CardHeader>
                  <div className="text-4xl font-bold text-accent mb-2">567</div>
                  <CardDescription>Active Volunteers</CardDescription>
                </CardHeader>
              </Card>
              <Card className="shadow-soft">
                <CardHeader>
                  <div className="text-4xl font-bold text-primary mb-2">98%</div>
                  <CardDescription>Success Rate</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-gradient-to-br from-primary via-primary to-accent text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 h-full w-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMSI+PHBhdGggZD0iTTM2IDE0YzAtMS4xLS45LTItMi0yaC00Yy0xLjEgMC0yIC45LTIgMnY0YzAgMS4xLjkgMiAyIDJoNGMxLjEgMCAyLS45IDItMnYtNHoiLz48L2c+PC9nPjwvc3ZnPg==')]" />
        </div>
        <div className="container mx-auto max-w-4xl text-center relative z-10 space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">Ready to Make a Difference?</h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Join thousands of helpers who are already transforming their communities, 
            one need at a time.
          </p>
          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Button size="lg" variant="secondary" className="gap-2 bg-white text-primary hover:bg-white/90" onClick={() => navigate("/needs")}>
              <Heart className="h-5 w-5" />
              Get Started Now
            </Button>
            <Button 
              size="lg" 
              variant="ghost" 
              className="border-2 border-white/90 bg-transparent/0 text-white hover:bg-white/20 hover:border-white" 
              onClick={() => navigate("/needs")}
            >
              Browse Needs
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
