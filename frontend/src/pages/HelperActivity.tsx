import { useState, useEffect } from "react";
import { ArrowLeft, Heart, Users, DollarSign, Package, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { getAllFunding, getAllNeeds } from "@/services/api";

interface FundingRecord {
  funding_id: number;
  quantity: number;
  amount: string | number;
  funded_at: string;
  helper_username: string;
  need_id: number;
  need_title: string;
  need_description: string | null;
  cost: string | number;
  priority: string;
  category: string;
  manager_username: string;
}

const HelperActivity = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, isManager } = useAuth();
  const [fundingRecords, setFundingRecords] = useState<FundingRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<FundingRecord[]>([]);
  const [managerNeeds, setManagerNeeds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterByMyNeeds, setFilterByMyNeeds] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !isManager) {
        navigate("/dashboard");
        return;
      }
      fetchData();
    }
  }, [user, isManager, authLoading, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch manager's needs to filter
      const needsResponse = await getAllNeeds({ managerId: user?.id });
      if (needsResponse.success) {
        const needsArray = needsResponse.needs || needsResponse || [];
        const allNeeds = Array.isArray(needsArray) ? needsArray : [];
        const needIds = allNeeds.map((need: any) => need.id);
        setManagerNeeds(needIds);
      }

      // Fetch all funding records
      const fundingResponse = await getAllFunding();
      if (fundingResponse.success) {
        const records = fundingResponse.fundingRecords || [];
        setFundingRecords(records);
        if (filterByMyNeeds && user) {
          const myNeeds = needsResponse.needs || needsResponse || [];
          const myNeedIds = Array.isArray(myNeeds) ? myNeeds.map((n: any) => n.id) : [];
          const filtered = records.filter((r: FundingRecord) => myNeedIds.includes(r.need_id));
          setFilteredRecords(filtered);
        } else {
          setFilteredRecords(records);
        }
      }
    } catch (err) {
      console.error('Error fetching helper activity:', err);
      toast({
        title: "Error",
        description: "Failed to load helper activity",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filterByMyNeeds && user) {
      const filtered = fundingRecords.filter(r => managerNeeds.includes(r.need_id));
      setFilteredRecords(filtered);
    } else {
      setFilteredRecords(fundingRecords);
    }
  }, [filterByMyNeeds, fundingRecords, managerNeeds]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-destructive/10 text-destructive border-destructive/20";
      case "high": return "bg-secondary/10 text-secondary border-secondary/20";
      default: return "bg-accent/10 text-accent border-accent/20";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate totals
  const totalContributions = filteredRecords.length;
  const totalAmount = filteredRecords.reduce((sum, record) => {
    return sum + parseFloat(String(record.amount || 0));
  }, 0);
  const totalQuantity = filteredRecords.reduce((sum, record) => {
    return sum + parseInt(String(record.quantity || 0));
  }, 0);

  // Get unique helpers
  const uniqueHelpers = new Set(filteredRecords.map(r => r.helper_username)).size;

  if (authLoading || loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p className="text-muted-foreground">Loading helper activity...</p>
        </div>
      </div>
    );
  }

  if (!user || !isManager) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="container mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Helper Activity
              </h1>
              <p className="text-muted-foreground mt-2">
                See who's contributing to your organization's needs
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={filterByMyNeeds ? "default" : "outline"}
              onClick={() => setFilterByMyNeeds(true)}
            >
              My Needs Only
            </Button>
            <Button
              variant={!filterByMyNeeds ? "default" : "outline"}
              onClick={() => setFilterByMyNeeds(false)}
            >
              All Contributions
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{totalContributions}</div>
              <p className="text-xs text-muted-foreground mt-1">Funding records</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">${totalAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Funded</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Items Funded</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{totalQuantity}</div>
              <p className="text-xs text-muted-foreground mt-1">Total quantity</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Helpers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{uniqueHelpers}</div>
              <p className="text-xs text-muted-foreground mt-1">Unique contributors</p>
            </CardContent>
          </Card>
        </div>

        {/* Contributions List */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Recent Contributions</CardTitle>
            <CardDescription>
              {filterByMyNeeds ? 'Contributions to your needs' : 'All contributions across the platform'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredRecords.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No contributions yet</h3>
                <p className="text-muted-foreground">
                  {filterByMyNeeds 
                    ? "No one has contributed to your needs yet. Share your needs to get started!"
                    : "No contributions have been made yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRecords.map((record) => (
                  <Card key={record.funding_id} className="shadow-soft">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">{record.need_title}</h3>
                            <Badge className={getPriorityColor(record.priority)} variant="outline">
                              {record.priority.toUpperCase()}
                            </Badge>
                            {record.category && (
                              <Badge variant="outline">{record.category}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {record.helper_username}
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              {record.quantity} item{record.quantity !== 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              ${parseFloat(String(record.amount)).toFixed(2)}
                            </span>
                            <span>{formatDate(record.funded_at)}</span>
                          </div>
                          {record.need_description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {record.need_description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HelperActivity;

