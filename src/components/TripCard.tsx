import { useState } from "react";
import { MapPin, Clock, Users, Edit3, Save, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Trip {
  id?: string; // DB UUID
  client_id?: string; // local-only identifier
  origin: string;
  destination: string;
  start_time: string;
  end_time: string | null;
  mode: string | null;
  trip_number?: number;
  user_id?: string | null;
}

interface TripCardProps {
  trip: Trip;
  onSave?: (trip: Trip, clientId?: string) => void;
  isEditing?: boolean;
  isDetected?: boolean;
  confidence?: number;
}

const TRANSPORT_MODES = [
  { value: "WALK", label: "Walk", color: "mode-walk" },
  { value: "BIKE", label: "Bike", color: "mode-bike" },
  { value: "CAR", label: "Car", color: "mode-car" },
  { value: "BUS", label: "Bus", color: "mode-bus" },
  { value: "TRAIN", label: "Train", color: "mode-train" },
  { value: "OTHER", label: "Other", color: "mode-other" },
];

export function TripCard({ trip, onSave, isEditing = false, isDetected = false, confidence }: TripCardProps) {
  const [editing, setEditing] = useState(isEditing);
  const [expanded, setExpanded] = useState(isDetected);
  const [isLoading, setIsLoading] = useState(false);
  const [editedTrip, setEditedTrip] = useState(trip);
  const [companions, setCompanions] = useState({
    adults: 0,
    children: 0,
    unknown: 0
  });
  const [note, setNote] = useState("");
  const { toast } = useToast();

  const getModeColor = (mode: string | null) => {
    const modeInfo = TRANSPORT_MODES.find(m => m.value === mode?.toUpperCase());
    return modeInfo?.color || "mode-other";
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timeString: string) => {
    return new Date(timeString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getConfidenceBadge = () => {
    if (!confidence) return null;
    
    const variant = confidence > 0.8 ? "accent" : confidence > 0.5 ? "warning" : "destructive";
    return (
      <Badge variant="secondary" className={`text-xs ${
        confidence > 0.8 ? 'text-accent' : 
        confidence > 0.5 ? 'text-warning' : 
        'text-destructive'
      }`}>
        {Math.round(confidence * 100)}% confidence
      </Badge>
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Get user ID from localStorage consent or create demo user
      const consent = localStorage.getItem('natpac_consent');
      let userId = consent ? JSON.parse(consent).userId : null;

      if (!userId) {
        // Create demo user
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert([{
            name: 'Demo User',
            email: `demo-${Math.random().toString(36).substring(7)}@example.com`
          }])
          .select()
          .single();

        if (userError) throw userError;
        userId = userData.id;
      }

      // Insert or update trip without sending local client_id or non-UUID id
      const { id: editedId, client_id, user_id: _ignoredUser, ...rest } = editedTrip as any;
      const basePayload: any = {
        ...rest,
        mode: editedTrip.mode ? editedTrip.mode.toUpperCase() : null,
        user_id: userId,
      };
      if (basePayload.client_id) delete basePayload.client_id;

      let updatedTrip: any;
      let tripError: any;

      if (editedId) {
        const { data, error } = await supabase
          .from('trips')
          .update(basePayload)
          .eq('id', editedId)
          .select()
          .single();
        updatedTrip = data;
        tripError = error;
      } else {
        // Let DB assign id and trip_number defaults
        const { data, error } = await supabase
          .from('trips')
          .insert([basePayload])
          .select()
          .single();
        updatedTrip = data;
        tripError = error;
      }

      if (tripError) throw tripError;

      // Add companions if any
      const totalCompanions = companions.adults + companions.children + companions.unknown;
      if (totalCompanions > 0) {
        const companionInserts = [];
        
        for (let i = 0; i < companions.adults; i++) {
          companionInserts.push({
            trip_id: updatedTrip.id,
            name: `Adult ${i + 1}`,
            relation: 'Adult',
            age: 30
          });
        }
        
        for (let i = 0; i < companions.children; i++) {
          companionInserts.push({
            trip_id: updatedTrip.id,
            name: `Child ${i + 1}`,
            relation: 'Child',
            age: 10
          });
        }
        
        for (let i = 0; i < companions.unknown; i++) {
          companionInserts.push({
            trip_id: updatedTrip.id,
            name: `Companion ${i + 1}`,
            relation: 'Unknown',
            age: null
          });
        }

        const { error: companionsError } = await supabase
          .from('travellers')
          .insert(companionInserts);

        if (companionsError) throw companionsError;
      }

      toast({
        title: "Trip saved — Thank you!",
        description: "Your trip has been recorded successfully.",
      });

      setEditing(false);
      onSave?.(updatedTrip, trip.client_id || editedTrip.client_id);
    } catch (error) {
      console.error('Error saving trip:', error);
      toast({
        title: "Error",
        description: "Failed to save trip. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscard = () => {
    setEditedTrip(trip);
    setEditing(false);
    setCompanions({ adults: 0, children: 0, unknown: 0 });
    setNote("");
  };

  return (
    <Card className={`card-trip ${isDetected ? 'ring-2 ring-primary/20' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge className={getModeColor(editedTrip.mode)}>
              {editedTrip.mode || "Unknown"}
            </Badge>
            {getConfidenceBadge()}
            {isDetected && (
              <Badge variant="outline" className="text-primary border-primary">
                Auto-detected
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(!expanded)}
              className="h-6 w-6"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Trip Route */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              {editing ? (
                <Input
                  value={editedTrip.origin}
                  onChange={(e) => setEditedTrip({...editedTrip, origin: e.target.value})}
                  placeholder="Origin"
                  className="flex-1"
                />
              ) : (
                <span className="text-sm font-medium">{editedTrip.origin}</span>
              )}
            </div>
            <div className="ml-6 border-l-2 border-dashed border-muted h-4"></div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              {editing ? (
                <Input
                  value={editedTrip.destination}
                  onChange={(e) => setEditedTrip({...editedTrip, destination: e.target.value})}
                  placeholder="Destination"
                  className="flex-1"
                />
              ) : (
                <span className="text-sm font-medium">{editedTrip.destination}</span>
              )}
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              {formatDate(editedTrip.start_time)} • {formatTime(editedTrip.start_time)}
              {editedTrip.end_time && ` - ${formatTime(editedTrip.end_time)}`}
            </span>
          </div>

          {/* Mode Selection */}
          {editing && (
            <div className="space-y-2">
              <Label>Transport Mode</Label>
              <Select 
                value={editedTrip.mode || ""} 
                onValueChange={(value) => setEditedTrip({...editedTrip, mode: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select transport mode" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSPORT_MODES.map((mode) => (
                    <SelectItem key={mode.value} value={mode.value}>
                      {mode.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Companions */}
          {editing && (
            <div className="space-y-3">
              <Label>Travel Companions</Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Adults</Label>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCompanions(c => ({...c, adults: Math.max(0, c.adults - 1)}))}
                      disabled={companions.adults === 0}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center text-sm">{companions.adults}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCompanions(c => ({...c, adults: Math.min(10, c.adults + 1)}))}
                      disabled={companions.adults >= 10}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Children</Label>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCompanions(c => ({...c, children: Math.max(0, c.children - 1)}))}
                      disabled={companions.children === 0}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center text-sm">{companions.children}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCompanions(c => ({...c, children: Math.min(10, c.children + 1)}))}
                      disabled={companions.children >= 10}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Others</Label>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCompanions(c => ({...c, unknown: Math.max(0, c.unknown - 1)}))}
                      disabled={companions.unknown === 0}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center text-sm">{companions.unknown}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCompanions(c => ({...c, unknown: Math.min(10, c.unknown + 1)}))}
                      disabled={companions.unknown >= 10}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Note */}
          {editing && (
            <div className="space-y-2">
              <Label>Note (Optional)</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add any additional details..."
                rows={2}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {editing ? (
              <>
                <Button 
                  onClick={handleSave} 
                  disabled={isLoading}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? "Saving..." : "Save"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDiscard}
                  disabled={isLoading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => setEditing(true)}
                size="sm"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}