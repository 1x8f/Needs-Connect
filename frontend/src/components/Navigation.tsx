import { Heart, ShoppingBasket, LayoutDashboard, Home, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { getBasket } from "@/services/api";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isManager } = useAuth();
  const [basketCount, setBasketCount] = useState(0);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    // Only fetch basket count for helpers, not managers
    if (user && !isManager) {
      fetchBasketCount();
      const interval = setInterval(fetchBasketCount, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [user, isManager]);

  const fetchBasketCount = async () => {
    if (!user || isManager) return;
    try {
      const response = await getBasket(user.id);
      if (response.success && response.basket) {
        const count = response.basket.reduce((sum: number, item: any) => sum + (item.basket_quantity || 0), 0);
        setBasketCount(count);
      }
    } catch (err) {
      // Silently fail - basket count is not critical
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg shadow-soft">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 transition-transform hover:scale-105"
          >
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Needs Connect
            </span>
          </button>

          {/* Navigation Links */}
          {user && (
            <div className="flex items-center gap-2">
              <Button
                variant={isActive("/") ? "purpleTurquoise" : "ghost"}
                onClick={() => navigate("/")}
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>

              <Button
                variant={isActive("/needs") ? "purpleTurquoise" : "ghost"}
                onClick={() => navigate("/needs")}
                className="gap-2"
              >
                <ShoppingBasket className="h-4 w-4" />
                Browse Needs
              </Button>

              {isManager && (
                <Button
                  variant={isActive("/dashboard") ? "purpleTurquoise" : "ghost"}
                  onClick={() => navigate("/dashboard")}
                  className="gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              )}

              {/* Only show basket button for helpers, not managers */}
              {!isManager && (
                <Button
                  variant={isActive("/basket") ? "purpleTurquoise" : "outline"}
                  onClick={() => navigate("/basket")}
                  className="gap-2 relative"
                >
                  <ShoppingBasket className="h-4 w-4" />
                  Basket
                  {basketCount > 0 && (
                    <Badge variant="secondary" className="ml-1 absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {basketCount}
                    </Badge>
                  )}
                </Button>
              )}

              {user && (
                <div className="flex items-center gap-2 ml-4 pl-4 border-l">
                  <span className="text-sm text-muted-foreground">
                    {user.username}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {!user && (
            <Button
              variant="warm"
              onClick={() => navigate("/")}
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
