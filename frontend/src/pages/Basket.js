import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getNeedById, updateNeed } from '../services/api';
import { ShoppingCart, Trash2, Plus, Minus, CheckCircle, Package } from 'lucide-react';

function Basket() {
  const [basket, setBasket] = useState([]);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [lastCheckoutTotal, setLastCheckoutTotal] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

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
    setShowConfirm(true);
  };

  const confirmCheckout = async () => {
    setLastCheckoutTotal(totalCost);
    try {
      await Promise.all(
        basket.map(async (item) => {
          try {
            const resp = await getNeedById(item.id);
            const need = resp?.need || {};
            const currentFulfilled = Number(need.quantity_fulfilled || 0);
            const totalQuantity = Number(need.quantity || 0);
            const delta = Number(item.quantity || 0);
            const newFulfilled = Math.min(totalQuantity, currentFulfilled + delta);
            await updateNeed(item.id, { quantity_fulfilled: newFulfilled });
          } catch (e) {
            console.error('Failed to update need fulfillment', item.id, e);
          }
        })
      );
    } catch (e) {
      console.error('Batch update failed', e);
    }

    saveBasket([]);
    setCheckoutSuccess(true);
    setShowConfirm(false);
    window.dispatchEvent(new Event('needs-updated'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelCheckout = () => setShowConfirm(false);

  // Calculate totals
  const totalItems = basket.reduce((sum, item) => sum + item.quantity, 0);
  const totalCost = basket.reduce((sum, item) => sum + (item.cost * item.quantity), 0);

  return (
    <div className="min-h-screen bg-white p-6 pt-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Basket</h1>
        </div>

        {/* Checkout Success */}
        {checkoutSuccess && (
          <div className="border rounded p-6 mb-6 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h2 className="text-xl font-bold mb-1">Thank you!</h2>
            <p className="text-sm mb-3">Your donation of ${lastCheckoutTotal.toLocaleString()} was processed.</p>
            <Link to="/" onClick={() => setCheckoutSuccess(false)} className="text-blue-700 text-sm">Browse more needs</Link>
          </div>
        )}

        {/* Empty Basket State */}
        {basket.length === 0 && !checkoutSuccess && (
          <div className="border border-dashed rounded p-8 text-center">
            <ShoppingCart className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <div className="font-semibold mb-1">Your basket is empty</div>
            <Link to="/" className="text-blue-700 text-sm">Browse Needs</Link>
          </div>
        )}

        {/* Basket Items */}
        {basket.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Items List */}
            <div className="md:col-span-2 space-y-3">
              {basket.map((item) => (
                <div key={item.id} className="border rounded p-4">
                  
                  {/* Item Header */}
                  <div className="flex items-start justify-between mb-3">
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 flex items-center justify-center border rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4 text-slate-700" strokeWidth={2} />
                      </button>
                      
                      <span className="text-base font-bold w-10 text-center">
                        {item.quantity}
                      </span>
                      
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center border rounded"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4 text-slate-700" strokeWidth={2} />
                      </button>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <p className="text-sm text-slate-600 mb-1">Item total</p>
                      <p className="text-lg font-bold">
                        ${(item.cost * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Sidebar */}
            <div className="md:col-span-1">
              <div className="border rounded p-4 sticky top-20">
                <h2 className="text-base font-bold mb-4">Summary</h2>
                
                {/* Stats */}
                <div className="space-y-2 mb-4 pb-4 border-b">
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
                <div className="mb-4 pb-4 border-b">
                  <div className="flex justify-between items-baseline">
                    <span className="text-base font-bold">Total:</span>
                    <span className="text-xl font-bold">
                      ${totalCost.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button onClick={handleCheckout} className="w-full px-4 py-2 border rounded text-sm mb-2">Checkout</button>

                {/* Clear Basket */}
                <button onClick={clearBasket} className="w-full px-4 py-2 border rounded text-sm">Clear Basket</button>

                {/* Trust Indicators */}
                <div className="mt-4 pt-4 border-t text-xs text-slate-600"></div>
              </div>
            </div>
          </div>
        )}

        {showConfirm && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white border rounded p-4 w-[320px]">
              <h3 className="font-bold mb-2 text-sm">Confirm Checkout</h3>
              <p className="text-sm mb-3">Checkout {basket.length} item(s) for ${totalCost.toLocaleString()}?</p>
              <div className="flex items-center justify-end gap-2">
                <button onClick={cancelCheckout} className="px-3 py-2 border rounded text-sm">Cancel</button>
                <button onClick={confirmCheckout} className="px-3 py-2 border rounded text-sm bg-blue-600 text-white">Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Basket;
