/**
 * Volunteer Page Component
 * 
 * Allows helpers to browse and sign up for volunteer events.
 * Features:
 * - View all upcoming volunteer opportunities
 * - See event details (location, time, capacity, notes)
 * - Sign up for events with automatic waitlist handling
 * - View personal signup status (Confirmed/Waitlist)
 * - Cancel existing signups
 * 
 * @component
 * @returns {JSX.Element} Volunteer opportunities page
 */

import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, MapPin, Users, Clock, Package, CheckCircle2, XCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { getUpcomingEvents, signupForEvent, cancelSignup } from "@/services/api";

/**
 * Event interface matching backend response
 * Includes computed fields like remaining_slots and user_status
 */
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
  user_status: string | null; // 'confirmed', 'waitlist', 'cancelled', or null
}

const Volunteer = () => {
  // ============================================
  // Hooks & State Management
  // ============================================
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, isManager } = useAuth();
  
  // Event list and loading states
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Track which event is currently being processed (for loading states)
  const [signingUp, setSigningUp] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);

  // ============================================
  // Effects
  // ============================================
  
  /**
   * Fetch events when component mounts or user changes
   * Redirects to home if user is not authenticated
   */
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/");
        return;
      }
      fetchEvents();
    }
  }, [user, authLoading, navigate]);

  // ============================================
  // Data Fetching
  // ============================================
  
  /**
   * Fetches all upcoming events with user's signup status
   * Includes remaining slots and waitlist information
   */
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await getUpcomingEvents({ userId: user?.id });
      if (response.success) {
        setEvents(response.events || []);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      toast({
        title: "Error",
        description: "Failed to load volunteer opportunities",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // Event Handlers
  // ============================================
  
  /**
   * Handles volunteer signup for an event
   * Automatically handles waitlist when event is at capacity
   * 
   * @param {number} eventId - ID of the event to sign up for
   */
  const handleSignup = async (eventId: number) => {
    if (!user) return;

    setSigningUp(eventId);
    try {
      const response = await signupForEvent(eventId, user.id);
      if (response.success) {
        toast({
          title: response.status === 'waitlist' ? "Added to waitlist" : "Signed up!",
          description: response.message || (response.status === 'waitlist' 
            ? "Event is at capacity. You've been added to the waitlist."
            : "You've successfully signed up for this event."),
        });
        fetchEvents(); // Refresh to show updated status
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to sign up for event",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      console.error('Error signing up:', err);
      toast({
        title: "Error",
        description: err?.message || "Failed to connect to server",
        variant: "destructive"
      });
    } finally {
      setSigningUp(null);
    }
  };

  /**
   * Handles cancellation of event signup
   * Updates UI immediately after successful cancellation
   * 
   * @param {number} eventId - ID of the event to cancel signup for
   */
  const handleCancel = async (eventId: number) => {
    if (!user) return;

    setCancelling(eventId);
    try {
      const response = await cancelSignup(eventId, user.id);
      if (response.success) {
        toast({
          title: "Signup cancelled",
          description: "You've cancelled your signup for this event.",
        });
        fetchEvents(); // Refresh to show updated status
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to cancel signup",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      console.error('Error cancelling signup:', err);
      toast({
        title: "Error",
        description: err?.message || "Failed to connect to server",
        variant: "destructive"
      });
    } finally {
      setCancelling(null);
    }
  };

  // ============================================
  // Utility Functions
  // ============================================
  
  /**
   * Converts event type code to human-readable label
   * 
   * @param {string} type - Event type code
   * @returns {string} Human-readable event type label
   */
  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      delivery: 'Delivery',
      cleanup: 'Cleanup',
      kit_build: 'Kit Building',
      distribution: 'Distribution'
    };
    return labels[type] || type;
  };

  /**
   * Formats ISO date string to localized date/time string
   * 
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date/time string
   */
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  /**
   * Generates status badge component for user's signup status
   * 
   * @param {string | null} status - User's signup status (confirmed, waitlist, cancelled, or null)
   * @returns {JSX.Element | null} Badge component or null if no status
   */
  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      confirmed: { variant: "default", label: "Confirmed" },
      waitlist: { variant: "secondary", label: "Waitlist" },
      cancelled: { variant: "outline", label: "Cancelled" }
    };

    const config = variants[status];
    if (!config) return null;

    return (
      <Badge variant={config.variant} className="ml-2">
        {config.label}
      </Badge>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p className="text-muted-foreground">Loading volunteer opportunities...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="container mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Volunteer Opportunities
            </h1>
            <p className="text-muted-foreground mt-2">
              Browse and sign up for volunteer events to help distribute fulfilled needs
            </p>
          </div>
        </div>

        {/* Events List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="pt-12 pb-12 text-center">
                <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No volunteer opportunities available</h3>
                <p className="text-muted-foreground mb-4">
                  Check back later for upcoming volunteer events
                </p>
              </CardContent>
            </Card>
          ) : (
            events.map((event) => {
              const isSignedUp = event.user_status === 'confirmed' || event.user_status === 'waitlist';
              const isConfirmed = event.user_status === 'confirmed';
              const isWaitlisted = event.user_status === 'waitlist';
              const isFull = event.volunteer_slots > 0 && event.remaining_slots === 0 && !isSignedUp;

              return (
                <Card key={event.id} className="shadow-soft hover:shadow-medium transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center">
                          {event.need_title}
                          {getStatusBadge(event.user_status)}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {getEventTypeLabel(event.event_type)}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{event.priority}</Badge>
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
                          {isFull && (
                            <span className="text-destructive font-medium"> (Full)</span>
                          )}
                        </span>
                      </div>
                    )}
                    {event.notes && (
                      <p className="text-sm text-muted-foreground">{event.notes}</p>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="pt-2">
                      {isConfirmed ? (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleCancel(event.id)}
                          disabled={cancelling === event.id}
                        >
                          {cancelling === event.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel Signup
                            </>
                          )}
                        </Button>
                      ) : isWaitlisted ? (
                        <Button
                          variant="secondary"
                          className="w-full"
                          onClick={() => handleCancel(event.id)}
                          disabled={cancelling === event.id}
                        >
                          {cancelling === event.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Remove from Waitlist
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={() => handleSignup(event.id)}
                          disabled={signingUp === event.id || isFull}
                        >
                          {signingUp === event.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                              Signing up...
                            </>
                          ) : isFull ? (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Event Full
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Sign Up
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Volunteer;

