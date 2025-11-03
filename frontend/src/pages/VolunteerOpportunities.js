import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getUpcomingEvents,
  signupForEvent,
  cancelEventSignup
} from '../services/api';

const EVENT_TYPES = [
  { value: '', label: 'All event types' },
  { value: 'delivery', label: 'Delivery / Distribution' },
  { value: 'kit_build', label: 'Kit Build Day' },
  { value: 'cleanup', label: 'Neighborhood Beautification' },
  { value: 'distribution', label: 'On-Site Distribution' }
];

const BUNDLE_OPTIONS = [
  { value: '', label: 'All bundles' },
  { value: 'basic_food', label: 'Basic Food Box' },
  { value: 'hygiene_kit', label: 'Hygiene Kit' },
  { value: 'winter_clothing', label: 'Winter Clothing Drive' },
  { value: 'cleaning_supplies', label: 'Cleaning Supplies' },
  { value: 'beautification', label: 'Beautification Projects' }
];

function VolunteerOpportunities() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    eventType: '',
    bundle: '',
    includePast: false,
    onlyOpen: true
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionErrors, setActionErrors] = useState({});
  const [pendingEvent, setPendingEvent] = useState(null);

  const fetchEvents = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await getUpcomingEvents({
        eventType: filters.eventType || undefined,
        bundle: filters.bundle || undefined,
        includePast: filters.includePast ? 'true' : undefined,
        userId: user.id
      });

      if (response.success) {
        let list = response.events || [];
        if (filters.onlyOpen) {
          list = list.filter((event) => {
            if (event.volunteer_slots === null || event.volunteer_slots === undefined || event.volunteer_slots === 0) {
              return true;
            }
            return (event.remaining_slots ?? (event.volunteer_slots - event.confirmed_count)) > 0;
          });
        }
        setEvents(list);
      } else {
        setError(response.message || 'Unable to load volunteer opportunities.');
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Unable to load volunteer opportunities.');
    } finally {
      setLoading(false);
    }
  }, [filters, user]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSignup = async (eventId) => {
    if (pendingEvent === eventId) return;

    setPendingEvent(eventId);
    setActionErrors((prev) => ({ ...prev, [eventId]: null }));

    try {
      const response = await signupForEvent(eventId, user.id);
      if (response.success) {
        setActionMessage(`Successfully signed up for event!`);
        await fetchEvents();
        setTimeout(() => setActionMessage(null), 3000);
      } else {
        setActionErrors((prev) => ({
          ...prev,
          [eventId]: response.message || 'Sign-up failed.'
        }));
      }
    } catch (err) {
      console.error('Sign-up error:', err);
      setActionErrors((prev) => ({
        ...prev,
        [eventId]: 'Network error during sign-up.'
      }));
    } finally {
      setPendingEvent(null);
    }
  };

  const handleCancelSignup = async (eventId) => {
    if (pendingEvent === eventId) return;

    if (!window.confirm('Are you sure you want to cancel your sign-up for this event?')) {
      return;
    }

    setPendingEvent(eventId);
    setActionErrors((prev) => ({ ...prev, [eventId]: null }));

    try {
      const response = await cancelEventSignup(eventId, user.id);
      if (response.success) {
        setActionMessage(`Successfully cancelled sign-up.`);
        await fetchEvents();
        setTimeout(() => setActionMessage(null), 3000);
      } else {
        setActionErrors((prev) => ({
          ...prev,
          [eventId]: response.message || 'Cancellation failed.'
        }));
      }
    } catch (err) {
      console.error('Cancellation error:', err);
      setActionErrors((prev) => ({
        ...prev,
        [eventId]: 'Network error during cancellation.'
      }));
    } finally {
      setPendingEvent(null);
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'TBD';
    const date = new Date(dateTime);
    if (Number.isNaN(date.getTime())) return 'TBD';
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (event) => {
    const status = event.user_status;
    if (status === 'confirmed') {
      return { label: 'Signed Up', color: 'badge-green' };
    }
    if (status === 'waitlist') {
      return { label: 'Waitlisted', color: 'badge-warning' };
    }
    if (status === 'cancelled') {
      return { label: 'Cancelled', color: 'badge-teal' };
    }
    return null;
  };

  const mySignups = events.filter(e => e.user_status === 'confirmed' || e.user_status === 'waitlist').length;
  const openSlots = events.reduce((sum, e) => sum + (e.remaining_slots || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-emerald-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading volunteer opportunities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchEvents} className="btn-green-primary">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-6 pb-16 animate-slideInRight">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section - Apple Style */}
        <div className="hero-section mb-16 animate-slideInUp text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-7xl font-semibold text-gray-900 mb-6 leading-tight tracking-tight">
              Volunteer <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Opportunities</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 mb-12 leading-relaxed font-normal">
              Make a difference in your community. Sign up for upcoming volunteer events.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="stat-card">
                <div className="text-3xl font-semibold text-gray-900">{events.length}</div>
                <div className="text-sm text-gray-600 font-medium">Total Events</div>
              </div>
              <div className="stat-card">
                <div className="text-3xl font-semibold text-gray-900">{mySignups}</div>
                <div className="text-sm text-gray-600 font-medium">Your Sign-ups</div>
              </div>
              <div className="stat-card">
                <div className="text-3xl font-semibold text-gray-900">{openSlots}</div>
                <div className="text-sm text-gray-600 font-medium">Open Slots</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Message */}
        {actionMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-sm font-medium text-green-700">{actionMessage}</p>
          </div>
        )}

        {/* Filters - Apple Style */}
        <div className="mb-12">
          <div className="glass-card p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Event Type</label>
                <select
                  value={filters.eventType}
                  onChange={(e) => setFilters((prev) => ({ ...prev, eventType: e.target.value }))}
                  className="input-green text-sm"
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Bundle</label>
                <select
                  value={filters.bundle}
                  onChange={(e) => setFilters((prev) => ({ ...prev, bundle: e.target.value }))}
                  className="input-green text-sm"
                >
                  {BUNDLE_OPTIONS.map((bundle) => (
                    <option key={bundle.value} value={bundle.value}>{bundle.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-all w-full">
                  <input
                    type="checkbox"
                    checked={filters.includePast}
                    onChange={(e) => setFilters((prev) => ({ ...prev, includePast: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Include Past</span>
                </label>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-all w-full">
                  <input
                    type="checkbox"
                    checked={filters.onlyOpen}
                    onChange={(e) => setFilters((prev) => ({ ...prev, onlyOpen: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Only Open</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Events Display */}
        {events.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No events available</h3>
            <p className="text-gray-600">Check back soon or adjust your filters</p>
          </div>
        ) : (
          <div className="premium-card-grid">
            {events.map((event) => {
              const statusBadge = getStatusBadge(event);
              const actionError = actionErrors[event.id];
              const isPending = pendingEvent === event.id;

              return (
                <div key={event.id} className="card-green p-6 relative">
                  {/* Status Badge */}
                  {statusBadge && (
                    <div className="absolute top-4 right-4">
                      <span className={`${statusBadge.color} text-xs px-2.5 py-1`}>
                        {statusBadge.label}
                      </span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="mb-4 pr-24">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">{event.need_title || 'Untitled Event'}</h3>
                    <p className="text-sm text-gray-600">{event.event_type?.replace('_', ' ') || 'General'}</p>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Start</div>
                      <div className="font-medium text-gray-900 text-xs">{formatDateTime(event.event_start)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Location</div>
                      <div className="font-medium text-gray-900 text-xs line-clamp-1">{event.location || 'TBD'}</div>
                    </div>
                  </div>

                  {/* Volunteer Status */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Volunteers</div>
                        <div className="font-medium text-gray-900">
                          {event.confirmed_count || 0} confirmed
                          {event.volunteer_slots && ` / ${event.volunteer_slots} total`}
                        </div>
                      </div>
                      {event.remaining_slots !== null && event.remaining_slots !== undefined && (
                        <div className="text-right">
                          <div className="text-xs text-gray-500 mb-1">Available</div>
                          <div className="font-semibold text-emerald-600">{event.remaining_slots} slots</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {event.notes && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.notes}</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    {(!event.user_status || event.user_status === 'cancelled') && (
                      <button
                        onClick={() => handleSignup(event.id)}
                        disabled={isPending}
                        className="flex-1 btn-green-primary text-sm py-2.5 disabled:opacity-50"
                      >
                        {isPending ? 'Signing up...' : 'Sign Up'}
                      </button>
                    )}
                    {(event.user_status === 'confirmed' || event.user_status === 'waitlist') && (
                      <button
                        onClick={() => handleCancelSignup(event.id)}
                        disabled={isPending}
                        className="flex-1 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium text-sm transition-all disabled:opacity-50"
                      >
                        {isPending ? 'Cancelling...' : 'Cancel Sign-up'}
                      </button>
                    )}
                  </div>

                  {/* Error Message */}
                  {actionError && (
                    <div className="mt-3 text-xs font-medium text-center py-2 rounded-lg bg-red-50 text-red-700">
                      {actionError}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default VolunteerOpportunities;
