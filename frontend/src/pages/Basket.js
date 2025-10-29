import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  CheckCircle,
  Package
} from 'lucide-react';

function Basket() {
  const [basket, setBasket] = useState([]);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Load basket from localStorage
  useEffect(() => {
    loadBasket();
    
    // Listen for storage changes (when items are added from other pages)
    window.addEventListener('storage', loadBasket);
    return () => window.removeEventListener('storage', loadBasket);
  }, []);

  const loadBasket = () => {
    try {
      const savedBasket = localStorage.getItem('basket');
      const items = savedBasket ? JSON.parse(savedBasket) : [];
      setBasket(items);
    } catch (err) {
      console.error('Error loading basket:', err);
      setBasket([]);
    }
  };

  const saveBasket = (newBasket) => {
    localStorage.setItem('basket', JSON.stringify(newBasket));
    window.dispatchEvent(new Event('storage'));
    setBasket(newBasket);
  };

  const updateQuantity = (itemId, change) => {
    const newBasket = basket.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    saveBasket(newBasket);
  };

  const removeItem = (itemId) => {
    const newBasket = basket.filter(item => item.id !== itemId);
    saveBasket(newBasket);
  };

  const clearBasket = () => {
    if (window.confirm('Clear your entire basket?')) {
      saveBasket([]);
    }
  };

  const handleCheckout = () => {
    if (basket.length === 0) return;
    
    if (window.confirm(`Checkout ${basket.length} item(s) for $${totalCost.toLocaleString()}?`)) {
      // Clear basket and show success
      saveBasket([]);
      setCheckoutSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Calculate totals
  const totalItems = basket.reduce((sum, item) => sum + item.quantity, 0);
  const totalCost = basket.reduce((sum, item) => sum + (item.cost * item.quantity), 0);

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            Continue Shopping
          </Link>
          
          <h1 className="text-5xl font-bold text-slate-900 mb-3 tracking-tight">
            Your Basket
          </h1>
          <p className="text-xl text-slate-600">
            Review and checkout your selected needs
          </p>
        </div>

        {/* Checkout Success */}
        {checkoutSuccess && (
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-8 text-center mb-8 shadow-xl">
            <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-white" strokeWidth={2} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Thank You for Your Support!</h2>
            <p className="text-lg text-slate-700 mb-6">
              Your donation of <span className="font-bold text-emerald-600">${totalCost.toLocaleString()}</span> will make a real difference.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                to="/"
                onClick={() => setCheckoutSuccess(false)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Browse More Needs
              </Link>
            </div>
          </div>
        )}

        {/* Empty Basket State */}
        {basket.length === 0 && !checkoutSuccess && (
          <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center">
            <div className="max-w-md mx-auto">
              <ShoppingCart className="w-20 h-20 text-slate-300 mx-auto mb-6" strokeWidth={1.5} />
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                Your basket is empty
              </h2>
              <p className="text-slate-600 mb-6">
                Browse available needs and add items to your basket to get started.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Package className="w-5 h-5" strokeWidth={2} />
                Browse Needs
              </Link>
            </div>
          </div>
        )}

        {/* Basket Items */}
        {basket.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Items List */}
            <div className="lg:col-span-2 space-y-4">
              {basket.map((item) => (
                <div key={item.id} className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                  
                  {/* Item Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 mb-1">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="px-2 py-1 bg-slate-100 rounded-full text-xs font-medium capitalize">
                          {item.category}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{item.organization}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-5 h-5" strokeWidth={2} />
                    </button>
                  </div>

                  {/* Price and Quantity */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Price per item</p>
                      <p className="text-2xl font-bold text-slate-900">${item.cost}</p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        disabled={item.quantity <= 1}
                        className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4 text-slate-700" strokeWidth={2} />
                      </button>
                      
                      <span className="text-xl font-bold text-slate-900 w-12 text-center">
                        {item.quantity}
                      </span>
                      
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4 text-slate-700" strokeWidth={2} />
                      </button>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <p className="text-sm text-slate-600 mb-1">Item total</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${(item.cost * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-xl">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Order Summary</h2>
                
                {/* Stats */}
                <div className="space-y-4 mb-6 pb-6 border-b border-slate-200">
                  <div className="flex justify-between text-slate-700">
                    <span>Items:</span>
                    <span className="font-semibold">{totalItems}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Subtotal:</span>
                    <span className="font-semibold">${totalCost.toLocaleString()}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="mb-6 pb-6 border-b border-slate-200">
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-bold text-slate-900">Total:</span>
                    <span className="text-3xl font-bold text-slate-900">
                      ${totalCost.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-lg rounded-xl shadow-xl shadow-blue-500/40 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 mb-3"
                >
                  <CheckCircle className="w-6 h-6" strokeWidth={2} />
                  Checkout
                </button>

                {/* Clear Basket */}
                <button
                  onClick={clearBasket}
                  className="w-full h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all duration-200"
                >
                  Clear Basket
                </button>

                {/* Trust Indicators */}
                <div className="mt-6 pt-6 border-t border-slate-200 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                    </div>
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-blue-600" strokeWidth={2} />
                    </div>
                    <span>100% goes to community needs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Basket;
