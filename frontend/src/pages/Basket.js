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
    <div className="min-h-screen pt-6 pb-16 animate-slideInRight">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Apple Style */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-semibold text-gray-900 mb-4 tracking-tight">
            Your <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Basket</span>
          </h1>
          <p className="text-lg text-gray-600">Review your selected donations and complete your purchase</p>
        </div>

        {/* Checkout Success */}
        {checkoutSuccess && (
          <div className="glass-card p-8 mb-8 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Thank you!</h2>
            <p className="text-gray-600 mb-6">Your donation of ${lastCheckoutTotal.toFixed(2)} was processed successfully.</p>
            <Link to="/" onClick={() => setCheckoutSuccess(false)} className="btn-green-primary">Browse more needs</Link>
          </div>
        )}

        {/* Empty Basket State */}
        {basket.length === 0 && !checkoutSuccess && (
          <div className="glass-card p-16 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Your basket is empty</h3>
            <p className="text-gray-600 mb-6">Browse available needs and add items to get started</p>
            <Link to="/" className="btn-green-primary">Browse Needs</Link>
          </div>
        )}

        {/* Basket Items */}
        {basket.length > 0 && !checkoutSuccess && (
          <div className="space-y-4">
            {basket.map((item) => (
              <div key={item.id} className="card-green p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                      {item.category && (
                        <span className="badge-teal text-xs">{item.category}</span>
                      )}
                      {item.organization && (
                        <span className="badge-green text-xs">{item.organization}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        disabled={item.quantity <= 1}
                        className="p-1.5 hover:bg-gray-200 rounded transition-colors disabled:opacity-30"
                      >
                        <Minus className="w-4 h-4 text-gray-700" />
                      </button>
                      <span className="text-sm font-semibold text-gray-900 w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                      >
                        <Plus className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right min-w-[100px]">
                      <div className="text-xs text-gray-500">Total</div>
                      <div className="text-lg font-semibold text-gray-900">${(item.cost * item.quantity).toFixed(2)}</div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Summary Card */}
            <div className="glass-card p-6 mt-8">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Items</span>
                  <span className="font-semibold text-gray-900">{totalItems}</span>
                </div>
                <div className="flex justify-between text-xl">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-semibold text-gray-900">${totalCost.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={clearBasket}
                  className="flex-1 btn-green-secondary"
                >
                  Clear Basket
                </button>
                <button
                  onClick={handleCheckout}
                  className="flex-1 btn-green-primary"
                >
                  Checkout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Checkout Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-[360px] animate-slideInUp">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Confirm Donation</h3>
              <p className="text-gray-600 mb-6">
                Complete your donation of <strong>${totalCost.toFixed(2)}</strong> for {totalItems} {totalItems === 1 ? 'item' : 'items'}?
              </p>
              <div className="flex gap-3">
                <button onClick={cancelCheckout} className="flex-1 btn-green-secondary">
                  Cancel
                </button>
                <button onClick={confirmCheckout} className="flex-1 btn-green-primary">
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Basket;
