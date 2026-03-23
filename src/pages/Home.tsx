import { useState, useEffect } from "react";
import { Play, Pause, Battery, MapPin, Navigation, Zap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OnboardingModal } from "@/components/OnboardingModal";
import { TripCard } from "@/components/TripCard";
import heroImage from "@/assets/hero-image.jpg";

export default function Home() {
  const [isTracking, setIsTracking] = useState(true);
  const [batteryMode, setBatteryMode] = useState("normal");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [detectedTrips, setDetectedTrips] = useState([]);

  useEffect(() => {
    // Check if user has consented
    const consent = localStorage.getItem('natpac_consent');
    if (!consent) {
      setShowOnboarding(true);
    }

    // Simulate trip detection
    if (isTracking) {
      const interval = setInterval(() => {
        // Simulate detecting a new trip every 30 seconds (for demo)
        const mockTrip = {
          client_id: `trip-${Date.now()}`,
          origin: "Current Location",
          destination: "Detected Destination",
          start_time: new Date().toISOString(),
          end_time: null,
          mode: ["WALK", "CAR", "BUS"][Math.floor(Math.random() * 3)],
          trip_number: Math.floor(Math.random() * 1000),
          user_id: null
        };

        // Only add if we don't have pending trips (for demo purposes)
        setDetectedTrips(current => {
          if (current.length < 2) {
            return [...current, mockTrip];
          }
          return current;
        });
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isTracking]);

  const simulateCurrentTrip = () => {
    setCurrentTrip({
      mode: "CAR",
      speed: "45 km/h",
      confidence: 0.87
    });

    // Clear after 10 seconds
    setTimeout(() => setCurrentTrip(null), 10000);
  };

  const handleStartManualTrip = () => {
    const newTrip = {
      client_id: `manual-${Date.now()}`,
      origin: "",
      destination: "",
      start_time: new Date().toISOString(),
      end_time: null,
      mode: null,
      trip_number: Math.floor(Math.random() * 1000),
      user_id: null
    };

    setDetectedTrips(current => [...current, newTrip]);
  };

  const handleTripSaved = (savedTrip, clientId?: string) => {
    setDetectedTrips(current => current.filter(trip => trip.client_id !== clientId));
  };

  return (
    <>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-primary">
          <div className="absolute inset-0 bg-black/20"></div>
          <img 
            src={heroImage} 
            alt="NATPAC Travel Diary" 
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
          />
          <div className="relative p-8 text-center text-white">
            <h1 className="text-display font-bold mb-2">Travel Diary</h1>
            <p className="text-subheading opacity-90 mb-6">
              Help improve transport planning by sharing your journey data
            </p>
            <div className="flex items-center justify-center gap-2">
              <Badge className="bg-white/20 text-white border-white/30">
                Privacy-First
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30">
                Automatic Detection
              </Badge>
            </div>
          </div>
        </div>

        {/* Tracking Controls */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                {isTracking ? (
                  <Play className="w-5 h-5 text-accent" />
                ) : (
                  <Pause className="w-5 h-5 text-muted-foreground" />
                )}
                Trip Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={isTracking ? "default" : "secondary"} className={isTracking ? "status-moving" : "status-stopped"}>
                  {isTracking ? "Active" : "Paused"}
                </Badge>
              </div>
              <Button
                onClick={() => setIsTracking(!isTracking)}
                variant={isTracking ? "outline" : "default"}
                className="w-full"
              >
                {isTracking ? "Pause Tracking" : "Start Tracking"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Battery className="w-5 h-5 text-warning" />
                Battery Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={batteryMode} onValueChange={setBatteryMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low-power">Low Power</SelectItem>
                  <SelectItem value="high-accuracy">High Accuracy</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Current Movement */}
        {currentTrip && (
          <Card className="border-accent bg-accent/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-accent">
                <Navigation className="w-5 h-5 animate-pulse" />
                Currently Moving
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{currentTrip.mode} • {currentTrip.speed}</p>
                  <p className="text-sm text-muted-foreground">
                    {Math.round(currentTrip.confidence * 100)}% confidence
                  </p>
                </div>
                <Badge className="mode-car">
                  {currentTrip.mode}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Button onClick={handleStartManualTrip} variant="outline" className="flex-1">
            <Plus className="w-4 h-4 mr-2" />
            Start Trip Manually
          </Button>
          <Button onClick={simulateCurrentTrip} variant="accent" size="sm">
            <Zap className="w-4 h-4 mr-2" />
            Demo
          </Button>
        </div>

        {/* Detected Trips */}
        {detectedTrips.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-heading">Confirm Your Trips</h2>
            <div className="space-y-3">
              {detectedTrips.map((trip, index) => (
                <TripCard
                  key={trip.id || trip.client_id}
                  trip={trip}
                  isDetected={true}
                  isEditing={trip.origin === ""}
                  confidence={0.75 + Math.random() * 0.2}
                  onSave={handleTripSaved}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {detectedTrips.length === 0 && isTracking && (
          <Card className="text-center py-12">
            <CardContent>
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-subheading mb-2">Ready to Track</h3>
              <p className="text-muted-foreground mb-4">
                We'll automatically detect your trips when you start moving.
              </p>
              <Button onClick={simulateCurrentTrip} variant="outline">
                <Zap className="w-4 h-4 mr-2" />
                Simulate a Trip
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <OnboardingModal open={showOnboarding} onOpenChange={setShowOnboarding} />
    </>
  );
}