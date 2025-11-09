import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Calendar, MapPin, Users, Clock, Package, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { getUpcomingEvents, createEvent, updateEvent, deleteEvent } from "@/services/api";
import { getAllNeeds } from "@/services/api";

interface Event {
  id: number;
  need_id: number;
  need_title: string;
  event_type: string;
  event_start: string;
  event_end: string | null;
  location: string | null;
  volunteer_slots: number;
  confirmed_count: number;
  waitlist_count: number;
  remaining_slots: number | null;
  notes: string | null;
  priority: string;
  bundle_tag: string;
}

interface Need {
  id: number;
  title: string;
}

const Events = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, isManager } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    need_id: '',
    event_type: 'distribution',
    event_start: '',
    event_end: '',
    location: '',
    volunteer_slots: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading) {
      if (!user || !isManager) {
        navigate("/dashboard");
        return;
      }
      fetchEvents();
      fetchNeeds();
    }
  }, [user, isManager, authLoading, navigate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await getUpcomingEvents({ managerId: user?.id });
      if (response.success) {
        setEvents(response.events || []);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNeeds = async () => {
    try {
      const response = await getAllNeeds({ managerId: user?.id });
      if (response.success) {
        const needsArray = response.needs || response || [];
        setNeeds(Array.isArray(needsArray) ? needsArray : []);
      }
    } catch (err) {
      console.error('Error fetching needs:', err);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.need_id) {
      newErrors.need_id = 'Please select a need';
    }
    if (!formData.event_type) {
      newErrors.event_type = 'Event type is required';
    }
    if (!formData.event_start) {
      newErrors.event_start = 'Event start time is required';
    }
    if (formData.event_end && new Date(formData.event_end) < new Date(formData.event_start)) {
      newErrors.event_end = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user) return;

    setSubmitting(true);

    try {
      const eventData = {
        need_id: parseInt(formData.need_id),
        event_type: formData.event_type,
        event_start: formData.event_start,
        event_end: formData.event_end || null,
        location: formData.location || null,
        volunteer_slots: formData.volunteer_slots ? parseInt(formData.volunteer_slots) : 0,
        notes: formData.notes || null
      };

      let response;
      if (editingEvent) {
        response = await updateEvent(editingEvent.id, eventData);
      } else {
        response = await createEvent(eventData);
      }

      if (response.success) {
        toast({
          title: editingEvent ? "Event updated!" : "Event created!",
          description: editingEvent 
            ? "Distribution event has been updated successfully."
            : "Distribution event has been scheduled successfully.",
        });
        setShowCreateForm(false);
        setShowEditForm(false);
        setEditingEvent(null);
        setFormData({
          need_id: '',
          event_type: 'distribution',
          event_start: '',
          event_end: '',
          location: '',
          volunteer_slots: '',
          notes: ''
        });
        fetchEvents();
      } else {
        toast({
          title: "Error",
          description: response.message || `Failed to ${editingEvent ? 'update' : 'create'} event`,
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error(`Error ${editingEvent ? 'updating' : 'creating'} event:`, err);
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    // Format datetime for input (YYYY-MM-DDTHH:mm)
    const formatDateTime = (dateString: string) => {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setFormData({
      need_id: String(event.need_id),
      event_type: event.event_type,
      event_start: formatDateTime(event.event_start),
      event_end: event.event_end ? formatDateTime(event.event_end) : '',
      location: event.location || '',
      volunteer_slots: String(event.volunteer_slots || 0),
      notes: event.notes || ''
    });
    setShowEditForm(true);
  };

  const handleDelete = async () => {
    if (!deletingEvent) return;

    try {
      const response = await deleteEvent(deletingEvent.id);

      if (response.success) {
        toast({
          title: "Event deleted!",
          description: "Distribution event has been deleted successfully.",
        });
        setDeletingEvent(null);
        fetchEvents();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete event",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      console.error('Error deleting event:', err);
      const errorMessage = err?.message || "Failed to connect to server";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    setEditingEvent(null);
    setFormData({
      need_id: '',
      event_type: 'distribution',
      event_start: '',
      event_end: '',
      location: '',
      volunteer_slots: '',
      notes: ''
    });
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      delivery: 'Delivery',
      cleanup: 'Cleanup',
      kit_build: 'Kit Building',
      distribution: 'Distribution'
    };
    return labels[type] || type;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (authLoading || loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  if (!user || !isManager) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="container mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Distribution Events
              </h1>
              <p className="text-muted-foreground mt-2">
                Schedule and manage volunteer events for distributing fulfilled needs
              </p>
            </div>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            {showCreateForm ? 'Cancel' : 'Schedule Event'}
          </Button>
        </div>

        {/* Create Event Form */}
        {showCreateForm && (
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Schedule New Event</CardTitle>
              <CardDescription>Create a new distribution or volunteer event</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="need_id">
                      Need <span className="text-destructive">*</span>
                    </Label>
                    <Select value={formData.need_id} onValueChange={(value) => handleChange('need_id', value)}>
                      <SelectTrigger id="need_id" className={errors.need_id ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select a need..." />
                      </SelectTrigger>
                      <SelectContent>
                        {needs.map(need => (
                          <SelectItem key={need.id} value={String(need.id)}>{need.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.need_id && <p className="text-sm text-destructive">{errors.need_id}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event_type">
                      Event Type <span className="text-destructive">*</span>
                    </Label>
                    <Select value={formData.event_type} onValueChange={(value) => handleChange('event_type', value)}>
                      <SelectTrigger id="event_type" className={errors.event_type ? "border-destructive" : ""}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="distribution">Distribution</SelectItem>
                        <SelectItem value="delivery">Delivery</SelectItem>
                        <SelectItem value="cleanup">Cleanup</SelectItem>
                        <SelectItem value="kit_build">Kit Building</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.event_type && <p className="text-sm text-destructive">{errors.event_type}</p>}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="event_start">
                      Start Date & Time <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="event_start"
                      type="datetime-local"
                      value={formData.event_start}
                      onChange={(e) => handleChange('event_start', e.target.value)}
                      className={errors.event_start ? "border-destructive" : ""}
                    />
                    {errors.event_start && <p className="text-sm text-destructive">{errors.event_start}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event_end">End Date & Time</Label>
                    <Input
                      id="event_end"
                      type="datetime-local"
                      value={formData.event_end}
                      onChange={(e) => handleChange('event_end', e.target.value)}
                      className={errors.event_end ? "border-destructive" : ""}
                    />
                    {errors.event_end && <p className="text-sm text-destructive">{errors.event_end}</p>}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      placeholder="Event location"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="volunteer_slots">Volunteer Slots</Label>
                    <Input
                      id="volunteer_slots"
                      type="number"
                      min="0"
                      value={formData.volunteer_slots}
                      onChange={(e) => handleChange('volunteer_slots', e.target.value)}
                      placeholder="Number of volunteers needed"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Additional event details..."
                    rows={3}
                  />
                </div>

                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Event'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Events List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="pt-12 pb-12 text-center">
                <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No events scheduled</h3>
                <p className="text-muted-foreground mb-4">Create your first distribution event to get started</p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Event
                </Button>
              </CardContent>
            </Card>
          ) : (
            events.map((event) => (
              <Card key={event.id} className="shadow-soft hover:shadow-medium transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{event.need_title}</CardTitle>
                      <CardDescription className="mt-1">
                        {getEventTypeLabel(event.event_type)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{event.priority}</Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(event)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeletingEvent(event)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatDateTime(event.event_start)}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  {event.volunteer_slots > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {event.confirmed_count} / {event.volunteer_slots} volunteers
                        {event.remaining_slots !== null && event.remaining_slots > 0 && (
                          <span className="text-muted-foreground"> ({event.remaining_slots} spots left)</span>
                        )}
                      </span>
                    </div>
                  )}
                  {event.notes && (
                    <p className="text-sm text-muted-foreground">{event.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit Event Dialog */}
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
              <DialogDescription>Update the distribution event details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit_need_id">
                    Need <span className="text-destructive">*</span>
                  </Label>
                  <Select value={formData.need_id} onValueChange={(value) => handleChange('need_id', value)}>
                    <SelectTrigger id="edit_need_id" className={errors.need_id ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select a need..." />
                    </SelectTrigger>
                    <SelectContent>
                      {needs.map(need => (
                        <SelectItem key={need.id} value={String(need.id)}>{need.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.need_id && <p className="text-sm text-destructive">{errors.need_id}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_event_type">
                    Event Type <span className="text-destructive">*</span>
                  </Label>
                  <Select value={formData.event_type} onValueChange={(value) => handleChange('event_type', value)}>
                    <SelectTrigger id="edit_event_type" className={errors.event_type ? "border-destructive" : ""}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="distribution">Distribution</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                      <SelectItem value="cleanup">Cleanup</SelectItem>
                      <SelectItem value="kit_build">Kit Building</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.event_type && <p className="text-sm text-destructive">{errors.event_type}</p>}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit_event_start">
                    Start Date & Time <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit_event_start"
                    type="datetime-local"
                    value={formData.event_start}
                    onChange={(e) => handleChange('event_start', e.target.value)}
                    className={errors.event_start ? "border-destructive" : ""}
                  />
                  {errors.event_start && <p className="text-sm text-destructive">{errors.event_start}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_event_end">End Date & Time</Label>
                  <Input
                    id="edit_event_end"
                    type="datetime-local"
                    value={formData.event_end}
                    onChange={(e) => handleChange('event_end', e.target.value)}
                    className={errors.event_end ? "border-destructive" : ""}
                  />
                  {errors.event_end && <p className="text-sm text-destructive">{errors.event_end}</p>}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit_location">Location</Label>
                  <Input
                    id="edit_location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="Event location"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_volunteer_slots">Volunteer Slots</Label>
                  <Input
                    id="edit_volunteer_slots"
                    type="number"
                    min="0"
                    value={formData.volunteer_slots}
                    onChange={(e) => handleChange('volunteer_slots', e.target.value)}
                    placeholder="Number of volunteers needed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_notes">Notes</Label>
                <Textarea
                  id="edit_notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Additional event details..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update Event'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingEvent} onOpenChange={(open) => !open && setDeletingEvent(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the event "{deletingEvent?.need_title}". This action cannot be undone.
                All volunteer signups for this event will also be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Events;

