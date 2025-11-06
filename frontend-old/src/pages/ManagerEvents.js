import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getAllNeeds,
  getEventsForNeed,
  getUpcomingEvents,
  createEvent
} from '../services/api';

const EVENT_TYPES = [
  { value: 'delivery', label: 'Delivery / Distribution' },
  { value: 'kit_build', label: 'Kit Build Day' },
  { value: 'cleanup', label: 'Neighborhood Beautification' },
  { value: 'distribution', label: 'On-Site Distribution' }
];

function ManagerEvents() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [needs, setNeeds] = useState([]);
  const [selectedNeedId, setSelectedNeedId] = useState('');
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [needEvents, setNeedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    event_type: 'delivery',
    event_start: '',
    event_end: '',
    location: '',
    volunteer_slots: '10',
    notes: ''
  });

  const selectedNeed = useMemo(
    () => needs.find((need) => String(need.id) === String(selectedNeedId)) || null,
    [needs, selectedNeedId]
  );

  useEffect(() => {
    if (!user) return;

    const seedNeedId = searchParams.get('needId');

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllNeeds({
          managerId: user.id,
          sort: 'urgency',
          timeSensitiveOnly: false
        });

        if (response.success) {
          const managerNeeds = response.needs || [];
          setNeeds(managerNeeds);

          if (seedNeedId && managerNeeds.some((need) => String(need.id) === seedNeedId)) {
            setSelectedNeedId(seedNeedId);
          } else if (managerNeeds.length > 0) {
            setSelectedNeedId(String(managerNeeds[0].id));
          }
        } else {
          setError(response.message || 'Failed to load needs');
        }
      } catch (err) {
        console.error('Error loading manager needs:', err);
        setError('Unable to load manager needs');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [searchParams, user]);

  useEffect(() => {
    if (!user) return;

    const fetchUpcoming = async () => {
      try {
        const response = await getUpcomingEvents({ managerId: user.id, includePast: false });
        if (response.success) {
          setUpcomingEvents(response.events || []);
        }
      } catch (err) {
        console.error('Error loading upcoming events:', err);
      }
    };

    fetchUpcoming();
  }, [user]);

  useEffect(() => {
    if (!selectedNeedId) {
      setNeedEvents([]);
      return;
    }

    const currentNeedParam = searchParams.get('needId');
    if (currentNeedParam !== String(selectedNeedId)) {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set('needId', selectedNeedId);
      setSearchParams(nextParams, { replace: true });
    }

    const loadNeedEvents = async () => {
      try {
        setEventsLoading(true);
        const response = await getEventsForNeed(selectedNeedId);
        if (response.success) {
          setNeedEvents(response.events || []);
        } else {
          setNeedEvents([]);
        }
      } catch (err) {
        console.error('Error loading events for need:', err);
        setNeedEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };

    loadNeedEvents();
  }, [selectedNeedId, searchParams, setSearchParams]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNeedChange = (event) => {
    setSelectedNeedId(event.target.value);
    setFormSuccess(null);
    setFormError(null);
  };

  const handleCreateEvent = async (event) => {
    event.preventDefault();

    if (!selectedNeedId) {
      setFormError('Select a need to schedule an event.');
      return;
    }

    if (!formData.event_start) {
      setFormError('Event start date/time is required.');
      return;
    }

    const slotsValue = formData.volunteer_slots !== '' ? parseInt(formData.volunteer_slots, 10) : 0;
    if (Number.isNaN(slotsValue) || slotsValue < 0) {
      setFormError('Volunteer slots must be zero or greater.');
      return;
    }

    setFormError(null);
    setFormSuccess(null);
    setCreating(true);

    try {
      const payload = {
        need_id: Number(selectedNeedId),
        event_type: formData.event_type,
        event_start: formData.event_start,
        event_end: formData.event_end || null,
        location: formData.location || null,
        volunteer_slots: slotsValue,
        notes: formData.notes || null
      };

      const response = await createEvent(payload);

      if (response.success) {
        setFormSuccess('Event scheduled successfully.');
        setFormData((prev) => ({
          ...prev,
          event_start: '',
          event_end: '',
          location: ''
        }));

        const [needsEventsResponse, upcomingResponse] = await Promise.all([
          getEventsForNeed(selectedNeedId),
          getUpcomingEvents({ managerId: user.id, includePast: false })
        ]);

        if (needsEventsResponse.success) {
          setNeedEvents(needsEventsResponse.events || []);
        }
        if (upcomingResponse.success) {
          setUpcomingEvents(upcomingResponse.events || []);
        }
      } else {
        setFormError(response.message || 'Failed to create event.');
      }
    } catch (err) {
      console.error('Error creating event:', err);
      setFormError('Unexpected error while creating event.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-8 animate-slideInUp">
        <div className="max-w-4xl mx-auto px-4 py-10 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600"></div>
          <p className="mt-4 text-emerald-700 font-medium">Loading manager events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-8 animate-slideInUp">
        <div className="max-w-4xl mx-auto px-4 py-10 text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 border rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (needs.length === 0) {
    return (
      <div className="min-h-screen pt-4 pb-12 animate-slideInRight">
        <div className="max-w-4xl mx-auto px-4 py-10 text-center border border-dashed rounded">
          <h2 className="text-xl font-semibold mb-3">No needs available to schedule</h2>
          <p className="text-slate-600 text-sm mb-4">
            Create a need first, then return here to schedule a volunteer event or distribution.
          </p>
          <button
            onClick={() => (window.location.href = '/manager/add-need')}
            className="px-4 py-2 border rounded"
          >
            Add Need
          </button>
        </div>
      </div>
    );
  }

  const upcomingForSelected = upcomingEvents.filter(
    (event) => String(event.need_id) === String(selectedNeedId)
  );

  return (
    <div className="min-h-screen pt-6 pb-16 animate-slideInRight">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section - Apple Style */}
        <div className="hero-section mb-16 animate-slideInUp text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-7xl font-semibold text-gray-900 mb-6 leading-tight tracking-tight">
              Schedule <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Events</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 mb-12 leading-relaxed font-normal">
              Organize volunteer opportunities and coordinate community efforts.
            </p>
            <button
              onClick={() => (window.location.href = '/manager')}
              className="btn-green-secondary px-8 py-4"
            >
              Back to Manager
            </button>
          </div>
        </div>

        <section className="glass-card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Select Need</label>
              <select
                value={selectedNeedId}
                onChange={handleNeedChange}
                className="input-green text-sm"
              >
                {needs.map((need) => (
                  <option key={need.id} value={need.id}>
                    {need.title} • {need.priority} priority
                  </option>
                ))}
              </select>
            </div>
            {selectedNeed && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Need Summary</div>
                <div className="text-sm text-gray-900 space-y-1">
                  <div>{selectedNeed.bundle_tag?.replace('_', ' ') || 'No bundle'}</div>
                  <div>Remaining: {Math.max(0, (selectedNeed.quantity || 0) - (selectedNeed.quantity_fulfilled || 0))} items</div>
                  {selectedNeed.needed_by && (
                    <div>Needed by: {new Date(selectedNeed.needed_by).toLocaleDateString()}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Event Type</label>
                <select
                  name="event_type"
                  value={formData.event_type}
                  onChange={handleFieldChange}
                  className="input-green text-sm"
                >
                  {EVENT_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Location / Meet Point</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleFieldChange}
                  className="input-green text-sm"
                  placeholder="Community Center, Shelter Loading Dock, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Start Date & Time</label>
                <input
                  type="datetime-local"
                  name="event_start"
                  value={formData.event_start}
                  onChange={handleFieldChange}
                  className="input-green text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">End Date & Time (optional)</label>
                <input
                  type="datetime-local"
                  name="event_end"
                  value={formData.event_end}
                  onChange={handleFieldChange}
                  className="input-green text-sm"
                  min={formData.event_start || undefined}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Volunteer Slots (0 = unlimited)</label>
                <input
                  type="number"
                  name="volunteer_slots"
                  min="0"
                  value={formData.volunteer_slots}
                  onChange={handleFieldChange}
                  className="input-green text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Notes for Volunteers</label>
                <textarea
                  name="notes"
                  rows="2"
                  value={formData.notes}
                  onChange={handleFieldChange}
                  className="input-green text-sm"
                  placeholder="Parking instructions, bring gloves, etc."
                />
              </div>
            </div>

            {formError && <div className="text-sm text-red-600">{formError}</div>}
            {formSuccess && <div className="text-sm text-green-600">{formSuccess}</div>}

            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 border rounded"
            >
              {creating ? 'Scheduling...' : 'Schedule Event'}
            </button>
          </form>
        </section>

        <section className="border rounded p-4 bg-slate-50">
          <h2 className="font-semibold mb-2 text-sm uppercase text-slate-500">Upcoming Events For This Need</h2>
          {eventsLoading ? (
            <div className="text-sm text-slate-600">Loading events...</div>
          ) : needEvents.length === 0 ? (
            <div className="text-sm text-slate-600">No scheduled events yet.</div>
          ) : (
            <ul className="space-y-3">
              {needEvents.map((event) => (
                <li key={event.id} className="bg-white border rounded p-3 text-sm">
                  <div className="font-semibold flex items-center justify-between">
                    <span>{EVENT_TYPES.find((et) => et.value === event.event_type)?.label || event.event_type}</span>
                    <span className="text-slate-500">
                      {new Date(event.event_start).toLocaleString()} {event.event_end ? `→ ${new Date(event.event_end).toLocaleString()}` : ''}
                    </span>
                  </div>
                  {event.location && <div className="text-slate-600">Location: {event.location}</div>}
                  <div className="text-slate-600">
                    {event.volunteer_slots > 0
                      ? `${event.confirmed_count}/${event.volunteer_slots} volunteers confirmed`
                      : `${event.confirmed_count} volunteers confirmed`}
                  </div>
                  {event.notes && (
                    <div className="text-slate-500 text-xs border-t mt-2 pt-2">{event.notes}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border rounded p-4">
          <h2 className="font-semibold mb-3 text-sm uppercase text-slate-500">All Upcoming Events</h2>
          {upcomingEvents.length === 0 ? (
            <div className="text-sm text-slate-600">No events scheduled yet. Use the form above to schedule your first event.</div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="border rounded p-3 text-sm">
                  <div className="flex flex-wrap gap-2 justify-between">
                    <div>
                      <div className="font-semibold">{event.need_title}</div>
                      <div className="text-slate-600">
                        {EVENT_TYPES.find((et) => et.value === event.event_type)?.label || event.event_type}
                      </div>
                    </div>
                    <div className="text-slate-500">
                      {new Date(event.event_start).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-slate-600 mt-2">
                    Volunteers: {event.confirmed_count}
                    {event.volunteer_slots > 0 ? ` / ${event.volunteer_slots}` : ''}
                    {event.volunteer_slots > 0 && event.remaining_slots >= 0 && (
                      <span className="ml-2 text-xs text-slate-500">{event.remaining_slots} open</span>
                    )}
                  </div>
                  {event.notes && <div className="text-xs text-slate-500 mt-1">{event.notes}</div>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default ManagerEvents;


