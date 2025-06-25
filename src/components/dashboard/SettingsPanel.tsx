
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Mail, 
  Bell, 
  Download, 
  CreditCard, 
  Shield,
  Clock,
  FileText
} from 'lucide-react';

const SettingsPanel: React.FC = () => {
  const [emailReports, setEmailReports] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [dailyUpdates, setDailyUpdates] = useState(false);
  const [reportFrequency, setReportFrequency] = useState('weekly');
  const [deliveryPreference, setDeliveryPreference] = useState('both');

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Settings className="mr-2 h-5 w-5 text-blue-400" />
            Account Settings
          </CardTitle>
          <CardDescription className="text-slate-400">
            Manage your subscription and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-lg border border-green-700/30">
            <div>
              <h3 className="font-semibold text-white">Pro Subscription</h3>
              <p className="text-sm text-slate-400">Active until March 15, 2024</p>
            </div>
            <div className="text-right">
              <Badge className="bg-green-600 text-white mb-2">ACTIVE</Badge>
              <p className="text-xs text-slate-400">$29.99/month</p>
            </div>
          </div>

          <Button variant="outline" className="w-full border-slate-600 text-white hover:bg-slate-700">
            <CreditCard className="mr-2 h-4 w-4" />
            Manage Billing
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Bell className="mr-2 h-5 w-5 text-yellow-400" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="email-reports" className="text-white">Email reports</Label>
              <p className="text-sm text-slate-400">
                Receive MCP reports via email
              </p>
            </div>
            <Switch
              id="email-reports"
              checked={emailReports}
              onCheckedChange={setEmailReports}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="push-notifications" className="text-white">Push notifications</Label>
              <p className="text-sm text-slate-400">
                Get notified when new reports are available
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-white">Delivery preference</Label>
            <Select value={deliveryPreference} onValueChange={setDeliveryPreference}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="email" className="text-white">Email only</SelectItem>
                <SelectItem value="dashboard" className="text-white">Dashboard only</SelectItem>
                <SelectItem value="both" className="text-white">Both email & dashboard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Clock className="mr-2 h-5 w-5 text-green-400" />
            Report Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="daily-updates" className="text-white flex items-center">
                Daily updates
                <Badge variant="outline" className="ml-2 text-xs border-yellow-500 text-yellow-400">
                  PRO
                </Badge>
              </Label>
              <p className="text-sm text-slate-400">
                Generate reports daily instead of weekly
              </p>
            </div>
            <Switch
              id="daily-updates"
              checked={dailyUpdates}
              onCheckedChange={setDailyUpdates}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-white">Report frequency</Label>
            <Select value={reportFrequency} onValueChange={setReportFrequency}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="daily" className="text-white">Daily (Pro)</SelectItem>
                <SelectItem value="weekly" className="text-white">Weekly</SelectItem>
                <SelectItem value="manual" className="text-white">Manual only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <FileText className="mr-2 h-5 w-5 text-purple-400" />
            Export & Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full border-slate-600 text-white hover:bg-slate-700">
            <Download className="mr-2 h-4 w-4" />
            Download Report History (PDF)
          </Button>
          <Button variant="outline" className="w-full border-slate-600 text-white hover:bg-slate-700">
            <Mail className="mr-2 h-4 w-4" />
            Export Watchlist
          </Button>
          <Button variant="outline" className="w-full border-slate-600 text-white hover:bg-slate-700">
            <Shield className="mr-2 h-4 w-4" />
            Privacy & Data Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPanel;
