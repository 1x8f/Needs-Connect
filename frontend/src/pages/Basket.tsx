import { useState, useEffect } from "react";
import { Trash2, ShoppingBasket, Heart, ArrowRight, Package, Plus, Minus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getBasket, removeFromBasket, updateBasketItem, checkout, clearBasket } from "@/services/api";

interface BasketItem {
  basket_id: number;
  need_id: number;
  title: string;
  cost: number | string; // Can be string from API
  basket_quantity: number;
  available_quantity: number;
  org_type?: string;
  item_total: number;
}

const Basket = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [basketItems, setBasketItems] = useState<BasketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    if (user) {
      fetchBasket();
    } else {
      setLoading(false);
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const fetchBasket = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await getBasket(user.id);
      if (response.success) {
        setBasketItems(response.basket || []);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load basket",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error fetching basket:', err);
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (basketId: number, title: string) => {
    try {
      const response = await removeFromBasket(basketId);
      if (response.success) {
        toast({
          title: "Item removed",
          description: `${title} has been removed from your basket.`,
        });
        fetchBasket();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to remove item",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error removing item:', err);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive"
      });
    }
  };

  const handleUpdateQuantity = async (basketId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const response = await updateBasketItem(basketId, newQuantity);
      if (response.success) {
        fetchBasket();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update quantity",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive"
      });
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to checkout",
        variant: "destructive"
      });
      navigate("/");
      return;
    }

    if (basketItems.length === 0) {
      toast({
        title: "Basket is empty",
        description: "Add items to your basket before checking out",
        variant: "destructive"
      });
      return;
    }

    try {
      setCheckingOut(true);
      const response = await checkout(user.id);
      if (response.success) {
        toast({
          title: "Thank you!",
          description: `Your contribution of $${response.totalAmount.toFixed(2)} was processed successfully.`,
        });
        setBasketItems([]);
        setTimeout(() => {
          navigate("/needs");
        }, 2000);
      } else {
        toast({
          title: "Checkout failed",
          description: response.message || "Please try again",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error('Error during checkout:', err);
      toast({
        title: "Error",
        description: "Failed to process checkout",
        variant: "destructive"
      });
    } finally {
      setCheckingOut(false);
    }
  };

  const handleClearBasket = async () => {
    if (!user) return;

    if (!window.confirm('Clear your entire basket?')) {
      return;
    }

    try {
      const response = await clearBasket(user.id);
      if (response.success) {
        toast({
          title: "Basket cleared",
          description: "All items have been removed from your basket.",
        });
        setBasketItems([]);
      }
    } catch (err) {
      console.error('Error clearing basket:', err);
      toast({
        title: "Error",
        description: "Failed to clear basket",
        variant: "destructive"
      });
    }
  };

  const totalItems = basketItems.reduce((sum, item) => sum + item.basket_quantity, 0);
  const totalCost = basketItems.reduce((sum, item) => sum + parseFloat(String(item.item_total || 0)), 0);

  if (!user) {
    return (
      <div className="flex items-center justify-center p-6 py-20">
        <Card className="shadow-glow max-w-md w-full">
          <CardContent className="pt-12 pb-12 text-center space-y-6">
            <div className="mx-auto h-20 w-20 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBasket className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Please log in</h2>
              <p className="text-muted-foreground">
                You need to be logged in to view your basket
              </p>
            </div>
            <Button size="lg" variant="warm" className="gap-2" onClick={() => navigate("/")}>
              <Heart className="h-5 w-5" />
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center p-6 py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p className="text-muted-foreground">Loading basket...</p>
        </div>
      </div>
    );
  }

  if (basketItems.length === 0) {
    return (
      <div className="flex items-center justify-center p-6 py-20">
        <Card className="shadow-glow max-w-md w-full">
          <CardContent className="pt-12 pb-12 text-center space-y-6">
            <div className="mx-auto h-20 w-20 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBasket className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Your basket is empty</h2>
              <p className="text-muted-foreground">
                Browse needs and add items to make a difference
              </p>
            </div>
            <Button size="lg" variant="warm" className="gap-2" onClick={() => navigate("/needs")}>
              <Heart className="h-5 w-5" />
              Browse Needs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Your Basket
          </h1>
          <p className="text-muted-foreground">
            Review your items and complete your contribution
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Basket Items */}
          <div className="lg:col-span-2 space-y-4">
            {basketItems.map((item) => (
              <Card key={item.basket_id} className="shadow-soft hover:shadow-medium transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{item.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {item.org_type || 'General'}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.basket_id, item.title)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-muted-foreground">Quantity:</div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUpdateQuantity(item.basket_id, item.basket_quantity - 1)}
                          disabled={item.basket_quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-semibold w-8 text-center">{item.basket_quantity}</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUpdateQuantity(item.basket_id, item.basket_quantity + 1)}
                          disabled={item.basket_quantity >= item.available_quantity}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {item.available_quantity < item.basket_quantity && (
                        <span className="text-xs text-amber-600">
                          Max: {item.available_quantity}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground mb-1">
                        ${parseFloat(String(item.cost)).toFixed(2)} each
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        ${parseFloat(String(item.item_total || 0)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/needs")}>
              <Heart className="h-4 w-4" />
              Add More Items
            </Button>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <Card className="shadow-glow sticky top-6">
              <CardHeader>
                <CardTitle className="text-2xl">Order Summary</CardTitle>
                <CardDescription>Your contribution breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Items:</span>
                    <span className="font-medium">{totalItems}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Organizations Helped:</span>
                    <span className="font-medium">
                      {new Set(basketItems.map(item => item.org_type || 'General')).size}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-lg font-medium">Total Impact</span>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">
                        ${totalCost.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Tax deductible
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                  <div className="flex items-start gap-3">
                    <Heart className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-accent mb-1">Thank you!</p>
                      <p className="text-muted-foreground">
                        Your contribution will make a real difference in your community.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-3">
                {/* Payment Options */}
                <div className="w-full space-y-3">
                  <div className="text-sm font-medium text-muted-foreground">Payment Method</div>
                  
                  {/* Google Pay Button */}
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400 text-gray-900"
                    onClick={() => {
                      toast({
                        title: "Google Pay",
                        description: "Google Pay integration coming soon!",
                      });
                      handleCheckout();
                    }}
                    disabled={checkingOut || basketItems.length === 0}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google Pay
                  </Button>

                  {/* Apple Pay Button */}
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full bg-black text-white hover:bg-gray-900 border-2 border-black hover:border-gray-900"
                    onClick={() => {
                      toast({
                        title: "Apple Pay",
                        description: "Apple Pay integration coming soon!",
                      });
                      handleCheckout();
                    }}
                    disabled={checkingOut || basketItems.length === 0}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Apple Pay
                  </Button>

                  {/* Credit Card Button */}
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 border-0"
                    onClick={() => {
                      toast({
                        title: "Credit Card",
                        description: "Credit card payment coming soon!",
                      });
                      handleCheckout();
                    }}
                    disabled={checkingOut || basketItems.length === 0}
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Credit Card
                  </Button>
                </div>

                <div className="relative w-full py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      or
                    </span>
                  </div>
                </div>

                {/* Standard Checkout Button */}
                <Button 
                  size="lg" 
                  variant="warm" 
                  className="w-full gap-2"
                  onClick={handleCheckout}
                  disabled={checkingOut || basketItems.length === 0}
                >
                  {checkingOut ? 'Processing...' : 'Complete Contribution'}
                  {!checkingOut && <ArrowRight className="h-5 w-5" />}
                </Button>

                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/needs")}
                >
                  Continue Shopping
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="w-full text-destructive hover:text-destructive"
                  onClick={handleClearBasket}
                >
                  Clear Basket
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Basket;
