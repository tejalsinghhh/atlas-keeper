import { useState, useEffect } from "react";
import { Shield, Trash2, Download, Settings as SettingsIcon, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [settings, setSettings] = useState({
    backgroundTracking: true,
    preciseCoordinates: false,
    shareWithNATPAC: true,
    notifications: true,
    dataRetention: 365
  });
  const [devMode, setDevMode] = useState(false);
  const [apiUrl, setApiUrl] = useState("https://xocogvizxiidkdmxaeyw.supabase.co");
  const [anonKey, setAnonKey] = useState("");
  const [showKeys, setShowKeys] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const consent = localStorage.getItem('natpac_consent');
    if (consent) {
      const consentData = JSON.parse(consent);
      setSettings(prev => ({
        ...prev,
        backgroundTracking: consentData.backgroundTracking,
        preciseCoordinates: consentData.preciseCoordinates,
        shareWithNATPAC: consentData.shareWithNATPAC
      }));
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      
      // Update consent in localStorage
      const consent = localStorage.getItem('natpac_consent');
      if (consent) {
        const consentData = JSON.parse(consent);
        localStorage.setItem('natpac_consent', JSON.stringify({
          ...consentData,
          [key]: value
        }));
      }
      
      return newSettings;
    });

    toast({
      title: "Settings Updated",
      description: "Your preferences have been saved.",
    });
  };

  const handleDeleteData = async () => {
    const consent = localStorage.getItem('natpac_consent');
    if (!consent) {
      toast({
        title: "No Data Found",
        description: "No user data to delete.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Are you sure you want to delete all your data? This cannot be undone.")) {
      return;
    }

    try {
      const { userId } = JSON.parse(consent);

      // Delete trips and travellers
      const { error: tripsError } = await supabase
        .from('trips')
        .delete()
        .eq('user_id', userId);

      if (tripsError) throw tripsError;

      // Delete consent
      const { error: consentError } = await supabase
        .from('consent')
        .delete()
        .eq('user_id', userId);

      if (consentError) throw consentError;

      // Clear local storage
      localStorage.removeItem('natpac_consent');

      toast({
        title: "Data Deleted",
        description: "All your data has been permanently deleted.",
      });

      // Refresh page to reset state
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('Error deleting data:', error);
      toast({
        title: "Error",
        description: "Failed to delete data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportData = async () => {
    const consent = localStorage.getItem('natpac_consent');
    if (!consent) {
      toast({
        title: "No Data Found",
        description: "No user data to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { userId } = JSON.parse(consent);

      const { data: trips, error } = await supabase
        .from('trips')
        .select(`
          *,
          travellers (*)
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const exportData = {
        exportDate: new Date().toISOString(),
        settings,
        trips: trips || []
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `natpac-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Your data has been exported successfully.",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-display font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your privacy and app preferences
        </p>
      </div>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy & Consent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Background Tracking</Label>
              <p className="text-sm text-muted-foreground">
                Allow automatic trip detection
              </p>
            </div>
            <Switch
              checked={settings.backgroundTracking}
              onCheckedChange={(checked) => handleSettingChange('backgroundTracking', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Precise Coordinates</Label>
              <p className="text-sm text-muted-foreground">
                Share exact GPS locations (opt-in)
              </p>
            </div>
            <Switch
              checked={settings.preciseCoordinates}
              onCheckedChange={(checked) => handleSettingChange('preciseCoordinates', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Share with NATPAC</Label>
              <p className="text-sm text-muted-foreground">
                Required for app functionality
              </p>
            </div>
            <Switch
              checked={settings.shareWithNATPAC}
              disabled
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Trip confirmations and updates
              </p>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleExportData} variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Export My Data
            </Button>
            <Button onClick={handleDeleteData} variant="destructive" className="flex-1">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete My Data
            </Button>
          </div>

          <div className="p-3 bg-muted/50 rounded-card">
            <p className="text-sm text-muted-foreground">
              <strong>Data Retention:</strong> Your data is stored for {settings.dataRetention} days, 
              then anonymized for research purposes. You can delete it anytime using the button above.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Developer Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              Developer Settings
            </div>
            <Badge variant="secondary">Prototype</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Developer Mode</Label>
            <Switch
              checked={devMode}
              onCheckedChange={setDevMode}
            />
          </div>

          {devMode && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="space-y-2">
                <Label>API Base URL</Label>
                <Input
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Supabase Anon Key</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowKeys(!showKeys)}
                  >
                    {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <Input
                  type={showKeys ? "text" : "password"}
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                />
              </div>

              <div className="p-3 bg-warning/10 border border-warning/20 rounded-card">
                <p className="text-sm text-warning">
                  <strong>Demo Only:</strong> These settings are for prototype demonstration. 
                  In production, API keys would be securely managed.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardHeader>
          <CardTitle>App Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Version</span>
            <Badge variant="secondary">1.0.0-prototype</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Consent Version</span>
            <Badge variant="secondary">1.0</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Last Updated</span>
            <span className="text-sm">
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}