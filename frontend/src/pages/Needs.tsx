import { useState, useEffect } from "react";
import { Search, Filter, Heart, Clock, TrendingUp, Package, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getAllNeeds, addToBasket } from "@/services/api";

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
  urgency_score?: number;
  remaining_quantity?: number;
}

const Needs = () => {
  const [needs, setNeeds] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    fetchNeeds();
  }, []);

  const fetchNeeds = async () => {
    try {
      setLoading(true);
      const filters: Record<string, any> = {
        sort: 'urgency',
        timeSensitiveOnly: false  // Show all needs, not just time-sensitive ones
      };

      if (priorityFilter !== "all") {
        filters.priority = priorityFilter;
      }
      if (categoryFilter !== "all") {
        filters.category = categoryFilter;
      }
      if (searchQuery) {
        filters.search = searchQuery;
      }

      const response = await getAllNeeds(filters);
      // Handle both response formats: {success, needs} or direct array
      if (response.success !== false) {
        const needsArray = response.needs || response || [];
        setNeeds(Array.isArray(needsArray) ? needsArray : []);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load needs",
          variant: "destructive"
        });
        setNeeds([]);
      }
    } catch (err) {
      console.error('Error fetching needs:', err);
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

  useEffect(() => {
    fetchNeeds();
  }, [priorityFilter, categoryFilter, searchQuery]);

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

  const handleAddToBasket = async (need: Need) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to add items to your basket",
        variant: "destructive"
      });
      navigate("/");
      return;
    }

    try {
      const response = await addToBasket({
        user_id: user.id,
        need_id: need.id,
        quantity: 1
      });

      if (response.success) {
        toast({
          title: "Added to basket!",
          description: `${need.title} has been added to your basket.`,
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to add to basket",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error adding to basket:', err);
      toast({
        title: "Error",
        description: "Failed to add item to basket",
        variant: "destructive"
      });
    }
  };

  const filteredNeeds = needs.filter(need => {
    const matchesSearch = need.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (need.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === "all" || need.priority === priorityFilter;
    const matchesCategory = categoryFilter === "all" || need.category === categoryFilter;
    
    return matchesSearch && matchesPriority && matchesCategory;
  });

  const categories = Array.from(new Set(needs.map(n => n.category).filter(Boolean)));

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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p className="text-muted-foreground">Loading needs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Browse Needs
              </h1>
              <p className="text-muted-foreground mt-2">
                Every contribution makes a difference. Find a cause that speaks to your heart.
              </p>
            </div>
          </div>

          {/* Filters */}
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search needs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Needs</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredNeeds.length}</div>
              <p className="text-xs text-muted-foreground">Active requests</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Urgent</CardTitle>
              <Clock className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {filteredNeeds.filter(n => n.priority === "urgent").length}
              </div>
              <p className="text-xs text-muted-foreground">Need immediate help</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Almost Done</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                {filteredNeeds.filter(n => {
                  const remaining = (n.remaining_quantity ?? (n.quantity - n.quantity_fulfilled));
                  return getProgressPercentage(n.quantity_fulfilled, n.quantity) > 75 && remaining > 0;
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">Close to goal</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Perishable</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">
                {filteredNeeds.filter(n => n.is_perishable).length}
              </div>
              <p className="text-xs text-muted-foreground">Time-sensitive items</p>
            </CardContent>
          </Card>
        </div>

        {/* Needs Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredNeeds.map((need) => {
            const remaining = need.remaining_quantity ?? (need.quantity - need.quantity_fulfilled);
            const isAvailable = remaining > 0;

            return (
              <Card key={need.id} className="shadow-soft hover:shadow-medium transition-all hover:-translate-y-1 flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge className={getPriorityColor(need.priority)} variant="outline">
                      {need.priority.toUpperCase()}
                    </Badge>
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
                  <CardTitle className="text-xl line-clamp-2">{need.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{need.description || 'No description'}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Organization:</span>
                    <span className="font-medium">{need.org_type || 'General'}</span>
                  </div>

                  {need.needed_by && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Needed by:</span>
                      <span className="font-medium">{new Date(need.needed_by).toLocaleDateString()}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress:</span>
                      <span className="font-medium">
                        {need.quantity_fulfilled} / {need.quantity} ({getProgressPercentage(need.quantity_fulfilled, need.quantity)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                        style={{ width: `${getProgressPercentage(need.quantity_fulfilled, need.quantity)}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary">${parseFloat(String(need.cost)).toFixed(2)}</span>
                      <span className="text-muted-foreground">per item</span>
                    </div>
                    {remaining > 0 && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {remaining} remaining
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleAddToBasket(need)}
                    disabled={!isAvailable}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Basket
                  </Button>
                  {!isAvailable && (
                    <Badge variant="secondary" className="text-xs">
                      Fully Funded
                    </Badge>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {filteredNeeds.length === 0 && (
          <Card className="shadow-soft">
            <CardContent className="pt-12 pb-12 text-center">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No needs found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search query</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Needs;
