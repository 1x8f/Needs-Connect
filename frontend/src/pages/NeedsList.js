import React, { useState, useEffect } from 'react';
import { getAllNeeds } from '../services/api';
import { ShoppingCart, CheckCircle, Package } from 'lucide-react';

const NeedsList = () => {
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNeeds();
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

      if (existingItemIndex > -1) {
        basket[existingItemIndex].quantity += 1;
      } else {
        basket.push({
          id: need.id,
          title: need.title,
          cost: need.cost,
          quantity: 1,
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
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Browse Needs</h1>
          <p className="text-slate-600">Help our community by funding essential items</p>
        </div>

        {/* Needs Grid */}
        {needs.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-dashed border-slate-300 p-12 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No needs available</h3>
            <p className="text-slate-600">Check back soon for new needs to support</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {needs.map((need) => {
              const fundingPercentage = Math.round((need.quantity_fulfilled / need.quantity) * 100);
              const isFullyFunded = need.quantity_fulfilled >= need.quantity;
              const inBasket = isInBasket(need.id);

              return (
                <div
                  key={need.id}
                  className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-slate-900 flex-1">
                      {need.title}
                    </h3>
                    {need.priority >= 8 && (
                      <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                        Urgent
                      </span>
                    )}
                  </div>

                  {/* Organization */}
                  <p className="text-sm text-slate-600 mb-3 capitalize">{need.org_type}</p>

                  {/* Description */}
                  <p className="text-sm text-slate-700 mb-4 line-clamp-2">
                    {need.description}
                  </p>

                  {/* Category */}
                  <div className="mb-4">
                    <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded capitalize">
                      {need.category}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                      <span>{need.quantity_fulfilled} of {need.quantity} funded</span>
                      <span>{fundingPercentage}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${fundingPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-slate-900">${need.cost}</span>
                      <span className="text-sm text-slate-500 ml-1">per item</span>
                    </div>

                    {!isFullyFunded ? (
                      <button
                        onClick={() => handleAddToBasket(need)}
                        disabled={inBasket}
                        className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors ${
                          inBasket
                            ? 'bg-green-600 text-white'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {inBasket ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Added
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4" />
                            Add
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="px-4 py-2 bg-green-100 text-green-700 font-semibold rounded-lg">
                        Funded
                      </span>
                    )}
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
