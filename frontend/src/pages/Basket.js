import React, { useState, useEffect } from 'react';
import { getBasket, updateBasketItem, removeFromBasket, clearBasket, checkout } from '../services/api';

/**
 * Basket Page - View and manage basket items
 * Helpers can update quantities, remove items, and checkout
 */
function Basket() {
  // State management
  const [basket, setBasket] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [error, setError] = useState(null);
  
  // Update/remove states
  const [updatingItems, setUpdatingItems] = useState({}); // Track which items are being updated
  const [itemMessages, setItemMessages] = useState({}); // Success/error messages per item
  
  // Checkout state
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [checkoutTotal, setCheckoutTotal] = useState(0); // Store the checkout total

  // TODO: Replace with actual logged-in user from authentication
  // For now, hardcoded as user 2 (john - helper)
  const currentUserId = 2;

  // Fetch basket on component load
  useEffect(() => {
    fetchBasket();
  }, []);

  // Fetch basket from API
  const fetchBasket = async () => {
    try {
      setError(null);
      const response = await getBasket(currentUserId);

      if (response.success) {
        setBasket(response.basket);
        setTotalCost(response.totalCost);
      } else {
        setError('Failed to load basket');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Error fetching basket:', err);
    }
  };

  // Handle quantity update
  const handleUpdateQuantity = async (basketItemId, needId, newQuantity, availableQuantity, needTitle) => {
    // VALIDATION
    
    // 1. Check if quantity is valid
    if (newQuantity <= 0) {
      setItemMessages(prev => ({
        ...prev,
        [basketItemId]: { type: 'error', text: 'Quantity must be greater than 0' }
      }));
      return;
    }

    // 2. Check if quantity exceeds available
    if (newQuantity > availableQuantity) {
      setItemMessages(prev => ({
        ...prev,
        [basketItemId]: { type: 'error', text: `Only ${availableQuantity} available` }
      }));
      return;
    }

    // Start loading for this item
    setUpdatingItems(prev => ({ ...prev, [basketItemId]: true }));
    setItemMessages(prev => ({ ...prev, [basketItemId]: null }));

    try {
      const response = await updateBasketItem(basketItemId, newQuantity);

      if (response.success) {
        // Success! Refresh the basket
        await fetchBasket();
        
        setItemMessages(prev => ({
          ...prev,
          [basketItemId]: { type: 'success', text: 'Quantity updated!' }
        }));

        // Clear message after 2 seconds
        setTimeout(() => {
          setItemMessages(prev => ({
            ...prev,
            [basketItemId]: null
          }));
        }, 2000);

      } else {
        setItemMessages(prev => ({
          ...prev,
          [basketItemId]: { type: 'error', text: response.message || 'Failed to update' }
        }));
      }

    } catch (err) {
      console.error('Error updating basket item:', err);
      setItemMessages(prev => ({
        ...prev,
        [basketItemId]: { type: 'error', text: 'Error connecting to server' }
      }));
    } finally {
      setUpdatingItems(prev => ({ ...prev, [basketItemId]: false }));
    }
  };

  // Handle remove item
  const handleRemoveItem = async (basketItemId, needTitle) => {
    if (!window.confirm(`Remove ${needTitle} from basket?`)) {
      return;
    }

    setUpdatingItems(prev => ({ ...prev, [basketItemId]: true }));

    try {
      const response = await removeFromBasket(basketItemId);

      if (response.success) {
        // Success! Refresh the basket
        await fetchBasket();
      } else {
        setItemMessages(prev => ({
          ...prev,
          [basketItemId]: { type: 'error', text: 'Failed to remove item' }
        }));
      }

    } catch (err) {
      console.error('Error removing item:', err);
      setItemMessages(prev => ({
        ...prev,
        [basketItemId]: { type: 'error', text: 'Error connecting to server' }
      }));
    } finally {
      setUpdatingItems(prev => ({ ...prev, [basketItemId]: false }));
    }
  };

  // Handle clear basket
  const handleClearBasket = async () => {
    if (!window.confirm('Clear entire basket? This cannot be undone.')) {
      return;
    }

    try {
      const response = await clearBasket(currentUserId);

      if (response.success) {
        // Success! Refresh the basket
        await fetchBasket();
      } else {
        setError('Failed to clear basket');
      }

    } catch (err) {
      console.error('Error clearing basket:', err);
      setError('Error connecting to server');
    }
  };

  // Handle checkout
  const handleCheckout = async () => {
    if (basket.length === 0) {
      setCheckoutError('Your basket is empty');
      return;
    }

    if (!window.confirm(`Checkout and fund ${basket.length} item(s) for $${totalCost.toFixed(2)}?`)) {
      return;
    }

    setCheckingOut(true);
    setCheckoutError(null);

    try {
      const response = await checkout(currentUserId);

      if (response.success) {
        // SUCCESS! Save the total amount BEFORE clearing
        setCheckoutTotal(response.totalAmount || totalCost);
        setCheckoutSuccess(true);
        
        // Clear basket display
        setBasket([]);
        setTotalCost(0);

        // Scroll to top to see success message
        window.scrollTo({ top: 0, behavior: 'smooth' });

      } else {
        setCheckoutError(response.message || 'Checkout failed');
      }

    } catch (err) {
      console.error('Error during checkout:', err);
      setCheckoutError('Error connecting to server');
    } finally {
      setCheckingOut(false);
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'normal':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Show error state (only on critical errors)
  if (error && basket.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-2xl mb-4">{error}</div>
          <button
            onClick={fetchBasket}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Your Basket</h1>
        <p className="text-gray-300">Review and checkout your selected needs</p>
      </div>

      {/* Checkout Success Message */}
      {checkoutSuccess && (
        <div className="max-w-6xl mx-auto mb-6">
          <div className="bg-green-900 border-2 border-green-500 rounded-lg p-6 text-center">
            <h2 className="text-3xl font-bold text-green-200 mb-2">🎉 Checkout Successful!</h2>
            <p className="text-green-300 text-lg">Thank you for funding these needs!</p>
            <p className="text-green-400 mt-2">Total funded: ${checkoutTotal.toFixed(2)}</p>
            <button
              onClick={() => {
                setCheckoutSuccess(false);
                window.location.href = '/'; // Go back to needs list (we'll use router later)
              }}
              className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg"
            >
              Browse More Needs
            </button>
          </div>
        </div>
      )}

      {/* Checkout Error */}
      {checkoutError && (
        <div className="max-w-6xl mx-auto mb-6">
          <div className="bg-red-900 border-2 border-red-500 rounded-lg p-4">
            <p className="text-red-200">{checkoutError}</p>
          </div>
        </div>
      )}

      {/* Empty Basket State */}
      {basket.length === 0 && !checkoutSuccess && (
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-white mb-2">Your basket is empty</h2>
            <p className="text-gray-400 mb-6">Browse available needs and add items to your basket</p>
            <button
              onClick={() => window.location.href = '/'} // We'll use router later
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
            >
              Browse Needs
            </button>
          </div>
        </div>
      )}

      {/* Basket Items */}
      {basket.length > 0 && (
        <div className="max-w-6xl mx-auto">
          {/* Basket Items List */}
          <div className="grid gap-6 mb-6">
            {basket.map((item) => {
              // Backend returns these specific property names:
              // basket_id, basket_quantity, available_quantity, item_total
              const basketId = item.basket_id;
              const basketQuantity = item.basket_quantity;
              const availableQuantity = item.available_quantity;
              const itemTotal = parseFloat(item.item_total) || 0;

              return (
                <div
                  key={basketId}
                  className="bg-gray-800 rounded-lg p-6 shadow-lg"
                >
                  {/* Header with priority and remove button */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`${getPriorityColor(item.priority)} text-white text-xs font-bold px-3 py-1 rounded-full uppercase`}
                      >
                        {item.priority}
                      </span>
                      <span className="text-gray-400 text-sm">{item.category || 'General'}</span>
                    </div>
                    
                    <button
                      onClick={() => handleRemoveItem(basketId, item.title)}
                      disabled={updatingItems[basketId]}
                      className="text-red-400 hover:text-red-300 font-bold disabled:opacity-50"
                    >
                      ✕ Remove
                    </button>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold text-white mb-2">{item.title}</h2>
                  
                  {/* Description */}
                  {item.description && (
                    <p className="text-gray-300 mb-4">{item.description}</p>
                  )}

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-gray-400 text-sm">Cost per item</p>
                      <p className="text-white font-bold text-lg">${item.cost}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Your quantity</p>
                      <p className="text-white font-bold text-lg">{basketQuantity}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Available total</p>
                      <p className="text-white font-bold text-lg">{availableQuantity}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Item total</p>
                      <p className="text-white font-bold text-lg">${itemTotal.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Update Quantity Section */}
                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex items-end gap-4">
                      <div className="flex-1">
                        <label className="block text-gray-300 text-sm mb-2">
                          Update Quantity (max: {availableQuantity})
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={availableQuantity}
                          defaultValue={basketQuantity}
                          id={`quantity-${basketId}`}
                          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const newQuantity = parseInt(document.getElementById(`quantity-${basketId}`).value);
                          handleUpdateQuantity(basketId, item.need_id, newQuantity, availableQuantity, item.title);
                        }}
                        disabled={updatingItems[basketId]}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors"
                      >
                        {updatingItems[basketId] ? 'Updating...' : 'Update'}
                      </button>
                    </div>

                    {/* Item Message */}
                    {itemMessages[basketId] && (
                      <div className={`mt-3 p-3 rounded-lg ${
                        itemMessages[basketId].type === 'success'
                          ? 'bg-green-900 text-green-200'
                          : 'bg-red-900 text-red-200'
                      }`}>
                        {itemMessages[basketId].text}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary and Checkout Section */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg sticky bottom-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Summary */}
              <div>
                <p className="text-gray-400 text-sm">Total Items: {basket.length}</p>
                <p className="text-3xl font-bold text-white">Total: ${totalCost.toFixed(2)}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={handleClearBasket}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
                >
                  Clear Basket
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={checkingOut || basket.length === 0}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors text-lg"
                >
                  {checkingOut ? 'Processing...' : `Checkout ($${totalCost.toFixed(2)})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Basket;

