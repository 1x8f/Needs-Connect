import { useState, useEffect } from "react";
import { Plus, Package, TrendingUp, Clock, Users, Edit, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { getAllNeeds, deleteNeed } from "@/services/api";

interface Need {
  id: number;
  title: string;
  description: string;
  cost: number | string; // Can be string from API
  quantity: number;
  quantity_fulfilled: number;
  priority: string;
  category: string;
  org_type: string;
  needed_by: string | null;
  is_perishable: boolean;
  bundle_tag: string;
  service_required: boolean;
  created_at: string;
  urgency_score?: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isManager, loading: authLoading } = useAuth();
  const [needs, setNeeds] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    if (!user) {
      navigate("/");
      return;
    }

    // Check role directly from user object - add debug logging
    console.log('Dashboard - User:', user, 'Role:', user.role, 'isManager:', isManager);
    
    if (user.role !== 'manager') {
      console.log('Dashboard - Access denied, redirecting to /needs');
      toast({
        title: "Access denied",
        description: "Manager access required",
        variant: "destructive"
      });
      navigate("/needs");
      return;
    }

    console.log('Dashboard - User is manager, fetching needs');
    fetchManagerNeeds();
  }, [user, authLoading, navigate, toast, isManager]);

  const fetchManagerNeeds = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await getAllNeeds({
        managerId: user.id,
        sort: 'urgency',
        timeSensitiveOnly: false
      });

      // Handle both response formats: {success, needs} or direct array
      if (response.success !== false) {
        const needsArray = response.needs || response || [];
        const allNeeds = Array.isArray(needsArray) ? needsArray : [];
        const managerNeeds = allNeeds.filter(
          (need: any) => need.manager_id === user.id || need.manager_username === user.username
        );
        setNeeds(managerNeeds);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load needs",
          variant: "destructive"
        });
        setNeeds([]);
      }
    } catch (err) {
      console.error('Error fetching manager needs:', err);
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive"
      });
      setNeeds([]);
    } finally {
      setLoading(false);
    }
  };

  const totalNeeds = needs.length;
  const totalItems = needs.reduce((sum, need) => sum + need.quantity, 0);
  const fulfilledItems = needs.reduce((sum, need) => sum + need.quantity_fulfilled, 0);
  const fulfillmentRate = totalItems > 0 ? Math.round((fulfilledItems / totalItems) * 100) : 0;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-destructive/10 text-destructive border-destructive/20";
      case "high": return "bg-secondary/10 text-secondary border-secondary/20";
      default: return "bg-accent/10 text-accent border-accent/20";
    }
  };

  const getProgressPercentage = (fulfilled: number, total: number) => {
    return Math.round((fulfilled / total) * 100);
  };

  const handleDeleteNeed = async (id: number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?\n\nThis will:\n- Remove the need permanently\n- Remove it from any helper's baskets\n- Cannot be undone!`)) {
      return;
    }

    try {
      const response = await deleteNeed(id);
      if (response.success) {
        toast({
          title: "Need deleted",
          description: `${title} has been removed.`,
        });
        fetchManagerNeeds();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete need",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error deleting need:', err);
      toast({
        title: "Error",
        description: "Failed to delete need",
        variant: "destructive"
      });
    }
  };

  // Show loading while auth is loading or data is loading
  if (authLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user after loading, show loading while redirect happens
  if (!user || user.role !== 'manager') {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Show loading while fetching data
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  console.log('Dashboard - Rendering dashboard content', { user, needsCount: needs.length, loading });

  return (
    <div className="p-6">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Manager Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your organization's needs and track progress
            </p>
          </div>
          <Button size="lg" variant="warm" className="gap-2" onClick={() => navigate("/add-need")}>
            <Plus className="h-5 w-5" />
            Create New Need
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Needs</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{totalNeeds}</div>
              <p className="text-xs text-muted-foreground mt-1">Active requests</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Items Needed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{totalItems}</div>
              <p className="text-xs text-muted-foreground mt-1">Total quantity</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Fulfilled</CardTitle>
              <CheckCircle className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{fulfilledItems}</div>
              <p className="text-xs text-muted-foreground mt-1">Items received</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{fulfillmentRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">Fulfillment rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Needs List */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-2xl">Your Active Needs</CardTitle>
            <CardDescription>
              Track and manage all your posted needs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {needs.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No needs found</h3>
                <p className="text-muted-foreground mb-6">Create your first need to get started</p>
                <Button onClick={() => navigate("/add-need")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Need
                </Button>
              </div>
            ) : (
              needs.map((need) => (
                <Card key={need.id} className="shadow-soft hover:shadow-medium transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getPriorityColor(need.priority)} variant="outline">
                            {need.priority.toUpperCase()}
                          </Badge>
                          {need.category && (
                            <Badge variant="outline">{need.category}</Badge>
                          )}
                          {need.is_perishable && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              Perishable
                            </Badge>
                          )}
                          {need.service_required && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Volunteer
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl mb-1">{need.title}</CardTitle>
                        <CardDescription>
                          Posted {new Date(need.created_at).toLocaleDateString()}
                          {need.needed_by && ` • Needed by ${new Date(need.needed_by).toLocaleDateString()}`}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => navigate(`/edit-need/${need.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteNeed(need.id, need.title)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Cost per item</div>
                        <div className="text-xl font-bold text-primary">${parseFloat(String(need.cost)).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Total needed</div>
                        <div className="text-xl font-bold">{need.quantity}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Fulfilled</div>
                        <div className="text-xl font-bold text-accent">{need.quantity_fulfilled}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Remaining</div>
                        <div className="text-xl font-bold text-secondary">
                          {need.quantity - need.quantity_fulfilled}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {getProgressPercentage(need.quantity_fulfilled, need.quantity)}%
                        </span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                          style={{ width: `${getProgressPercentage(need.quantity_fulfilled, need.quantity)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-soft hover:shadow-medium transition-all cursor-pointer" onClick={() => navigate("/events")}>
            <CardHeader>
              <div className="h-12 w-12 rounded-xl gradient-warm flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Schedule Distribution Event</CardTitle>
              <CardDescription>
                Organize volunteer events to distribute fulfilled needs
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-all cursor-pointer" onClick={() => navigate("/helper-activity")}>
            <CardHeader>
              <div className="h-12 w-12 rounded-xl gradient-cool flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <CardTitle>View Helper Activity</CardTitle>
              <CardDescription>
                See who's contributing and thank your supporters
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
