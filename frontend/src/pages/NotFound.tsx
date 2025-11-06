import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex items-center justify-center p-6 py-20">
      <Card className="max-w-md w-full shadow-glow">
        <CardContent className="pt-12 pb-12 text-center space-y-6">
          <div className="mx-auto h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
            <Search className="h-12 w-12 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-primary">404</h1>
            <h2 className="text-2xl font-bold">Page Not Found</h2>
            <p className="text-muted-foreground">
              Oops! The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="flex gap-3 justify-center pt-4">
            <Button variant="warm" size="lg" className="gap-2" asChild>
              <a href="/">
                <Home className="h-4 w-4" />
                Go Home
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="/needs">Browse Needs</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
