import React, { useState, useEffect } from 'react';
import { getAllNeeds } from '../services/api';
import { ShoppingCart, Package, Minus, Plus } from 'lucide-react';

const NeedsList = () => {
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantities, setQuantities] = useState({}); // per-need quantity to add

  useEffect(() => {
    fetchNeeds();
    const onNeedsUpdated = () => fetchNeeds();
    window.addEventListener('needs-updated', onNeedsUpdated);
    return () => window.removeEventListener('needs-updated', onNeedsUpdated);
  }, []);

  const fetchNeeds = async () => {
    try {
      setLoading(true);
      const response = await getAllNeeds();
      setNeeds(response.needs || []);
      setError(null);
    } catch (err) {
      setError('Failed to load needs');
      console.error('Error fetching needs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToBasket = (need) => {
    try {
      let basket = JSON.parse(localStorage.getItem('basket') || '[]');
      const existingItemIndex = basket.findIndex(item => item.id === need.id);
      const qty = Math.max(1, Number(quantities[need.id] || 1));

      if (existingItemIndex > -1) {
        basket[existingItemIndex].quantity = Number(basket[existingItemIndex].quantity || 0) + qty;
      } else {
        basket.push({
          id: need.id,
          title: need.title,
          cost: need.cost,
          quantity: qty,
          category: need.category,
          organization: need.org_type
        });
      }

      localStorage.setItem('basket', JSON.stringify(basket));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Error adding to basket:', err);
      alert('Failed to add item to basket. Please try again.');
    }
  };

  const isInBasket = (needId) => {
    const basket = JSON.parse(localStorage.getItem('basket') || '[]');
    return basket.some(item => item.id === needId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center text-slate-600">Loading needs...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-700">{error}</p>
            <button
              onClick={fetchNeeds}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-16">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Browse Needs</h1>
        </div>

        {/* Needs Grid */}
        {needs.length === 0 ? (
          <div className="border border-dashed border-slate-300 rounded p-8 text-center">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">No needs available</h3>
            <p className="text-slate-600 text-sm">Add needs from the manager page and refresh</p>
          </div>
        ) : (
          <div className="space-y-4">
            {needs.map((need) => {
              const remaining = Math.max(0, (need.quantity || 0) - (need.quantity_fulfilled || 0));
              const selectedQty = Math.max(1, Math.min(Number(quantities[need.id] || 1), remaining || 1));

              return (
                <div key={need.id} className="border rounded p-4">
                  <h3 className="font-bold mb-1 text-lg">{need.title}</h3>
                  <p className="text-sm text-slate-600 mb-1 capitalize">Category: {need.category}</p>
                  <p className="text-sm mb-2">{need.description}</p>

                  <div className="mb-3 text-sm">
                    <span className="text-slate-700">Quantity: </span>
                    <span className="font-semibold">{remaining}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-sm font-bold">${need.cost}</span>
                      <span className="text-sm text-slate-600 ml-1">per item</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuantities(prev => ({ ...prev, [need.id]: Math.max(1, (selectedQty || 1) - 1) }))}
                        className="w-8 h-8 border rounded flex items-center justify-center"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={remaining || 1}
                        value={selectedQty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value || '1', 10);
                          setQuantities(prev => ({ ...prev, [need.id]: isNaN(val) ? 1 : val }));
                        }}
                        className="w-14 text-center text-sm border rounded py-1"
                      />
                      <button
                        onClick={() => setQuantities(prev => ({ ...prev, [need.id]: Math.min((remaining || 1), (selectedQty || 1) + 1) }))}
                        className="w-8 h-8 border rounded flex items-center justify-center"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleAddToBasket(need)}
                        disabled={remaining === 0}
                        className={`px-4 py-2 border rounded text-sm ${remaining === 0 ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : ''}`}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NeedsList;
