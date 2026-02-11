'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  LogOut,
  User,
  Building2,
  Bell,
  CreditCard,
  Download,
  HelpCircle,
  Shield,
  ChevronRight,
  Award,
  Mail,
  Phone,
  Globe,
  Moon,
  Sun
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type SettingsTab = 'profile' | 'business' | 'notifications' | 'subscription' | 'data' | 'support' | 'account';

interface SettingsSection {
  id: SettingsTab;
  title: string;
  icon: React.ElementType;
  description: string;
}

const settingsSections: SettingsSection[] = [
  {
    id: 'profile',
    title: 'Profile',
    icon: User,
    description: 'Manage your personal information',
  },
  {
    id: 'business',
    title: 'Business',
    icon: Building2,
    description: 'Business name, currency, language',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    description: 'Push notifications and reminders',
  },
  {
    id: 'subscription',
    title: 'Subscription',
    icon: CreditCard,
    description: 'Plan and billing',
  },
  {
    id: 'data',
    title: 'Data & Backup',
    icon: Download,
    description: 'Export and backup your data',
  },
  {
    id: 'support',
    title: 'Support',
    icon: HelpCircle,
    description: 'Help, contact, and feedback',
  },
  {
    id: 'account',
    title: 'Account',
    icon: Shield,
    description: 'Privacy, terms, and sign out',
  },
];

export default function SettingsPage() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);

  // Profile state
  const [name, setName] = useState(user?.user_metadata?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');

  // Business state
  const [businessName, setBusinessName] = useState('');
  const [currency, setCurrency] = useState('TRY');
  const [language, setLanguage] = useState(locale);

  // Notifications state
  const [pushEnabled, setPushEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);

  // Theme state
  const [darkMode, setDarkMode] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      router.push(`/${locale}/login`);
    } catch (error) {
      toast.error('Failed to sign out. Please try again.');
      console.error('Sign out error:', error);
    }
  };

  const handleSaveProfile = () => {
    toast.success('Profile saved successfully');
  };

  const handleSaveBusiness = () => {
    toast.success('Business settings saved');
  };

  const handleExportData = (format: 'csv' | 'pdf') => {
    toast.success(`Exporting data as ${format.toUpperCase()}...`);
  };

  const activeSection = settingsSections.find((s) => s.id === activeTab);
  const ActiveIcon = activeSection?.icon || User;

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] p-6 text-white">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold font-display">Settings</h1>
          <p className="text-white/80 mt-1">Manage your account and preferences</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6 -mt-4">
        {/* Beta Badge */}
        <Card className="border-[var(--color-accent)] bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-accent-hover)]/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-[var(--color-accent)] flex items-center justify-center">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-[var(--color-text)]">
                  Beta Founder
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Early adopter benefits - 50% off forever! 🚀
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <Card className="border-[var(--color-border)]">
              <CardContent className="p-2">
                {settingsSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveTab(section.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                        activeTab === section.id
                          ? 'bg-[var(--color-accent)] text-white'
                          : 'hover:bg-[var(--color-bg)] text-[var(--color-text)]'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{section.title}</p>
                        <p className={`text-xs ${activeTab === section.id ? 'text-white/70' : 'text-[var(--color-text-secondary)]'}`}>
                          {section.description}
                        </p>
                      </div>
                      {activeTab === section.id && <ChevronRight className="h-4 w-4" />}
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2">
            <Card className="border-[var(--color-border)]">
              <CardHeader className="border-b border-[var(--color-border)]">
                <CardTitle className="flex items-center gap-2 font-display">
                  <ActiveIcon className="h-5 w-5 text-[var(--color-accent)]" />
                  {activeSection?.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* Profile Section */}
                {activeTab === 'profile' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+90 555 123 4567"
                      />
                    </div>
                    <Button onClick={handleSaveProfile} className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]">
                      Save Changes
                    </Button>
                  </div>
                )}

                {/* Business Section */}
                {activeTab === 'business' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="My Shop"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TRY">₺ Turkish Lira</SelectItem>
                          <SelectItem value="USD">$ US Dollar</SelectItem>
                          <SelectItem value="EUR">€ Euro</SelectItem>
                          <SelectItem value="INR">₹ Indian Rupee</SelectItem>
                          <SelectItem value="IDR">Rp Indonesian Rupiah</SelectItem>
                          <SelectItem value="NGN">₦ Nigerian Naira</SelectItem>
                          <SelectItem value="EGP">£ Egyptian Pound</SelectItem>
                          <SelectItem value="ZAR">R South African Rand</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="tr">Türkçe</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select defaultValue="Europe/Istanbul">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Europe/Istanbul">Istanbul (GMT+3)</SelectItem>
                          <SelectItem value="Asia/Kolkata">Mumbai (GMT+5:30)</SelectItem>
                          <SelectItem value="Asia/Jakarta">Jakarta (GMT+7)</SelectItem>
                          <SelectItem value="Africa/Lagos">Lagos (GMT+1)</SelectItem>
                          <SelectItem value="Africa/Cairo">Cairo (GMT+2)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleSaveBusiness} className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]">
                      Save Changes
                    </Button>
                  </div>
                )}

                {/* Notifications Section */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-[var(--color-text-secondary)]">Receive alerts on your device</p>
                      </div>
                      <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Payment Reminders</p>
                        <p className="text-sm text-[var(--color-text-secondary)]">Remind customers about debts</p>
                      </div>
                      <Switch checked={remindersEnabled} onCheckedChange={setRemindersEnabled} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Weekly Report</p>
                        <p className="text-sm text-[var(--color-text-secondary)]">Summary of weekly activity</p>
                      </div>
                      <Switch checked={weeklyReport} onCheckedChange={setWeeklyReport} />
                    </div>
                  </div>
                )}

                {/* Subscription Section */}
                {activeTab === 'subscription' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-[var(--color-accent)]/10 rounded-xl border border-[var(--color-accent)]/20">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-semibold text-[var(--color-text)]">Current Plan</p>
                          <p className="text-sm text-[var(--color-text-secondary)]">Beta Founder</p>
                        </div>
                        <Badge className="bg-[var(--color-accent)] text-white">50% Off</Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span>Up to 50 customers</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span>Unlimited transactions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span>Offline mode</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span>Data export</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      View Pricing Plans
                    </Button>
                    <Button variant="outline" className="w-full">
                      Manage Billing
                    </Button>
                  </div>
                )}

                {/* Data Section */}
                {activeTab === 'data' && (
                  <div className="space-y-6">
                    <div>
                      <p className="font-medium mb-2">Export Your Data</p>
                      <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                        Download all your customers and transactions
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleExportData('csv')}
                          className="flex-1"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export CSV
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleExportData('pdf')}
                          className="flex-1"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export PDF
                        </Button>
                      </div>
                    </div>
                    <div className="border-t border-[var(--color-border)] pt-6">
                      <p className="font-medium mb-2">Backup</p>
                      <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                        Your data is automatically backed up to the cloud
                      </p>
                      <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        Last backup: Just now
                      </div>
                    </div>
                  </div>
                )}

                {/* Support Section */}
                {activeTab === 'support' && (
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Help Center
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Mail className="h-4 w-4 mr-2" />
                      Contact Support
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Phone className="h-4 w-4 mr-2" />
                      Call Support
                    </Button>
                    <div className="border-t border-[var(--color-border)] pt-4">
                      <p className="text-sm text-[var(--color-text-secondary)] mb-2">Enjoying the app?</p>
                      <Button variant="outline" className="w-full">
                        Rate Us on Store
                      </Button>
                    </div>
                  </div>
                )}

                {/* Account Section */}
                {activeTab === 'account' && (
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="h-4 w-4 mr-2" />
                      Privacy Policy
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Globe className="h-4 w-4 mr-2" />
                      Terms of Service
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Globe className="h-4 w-4 mr-2" />
                      Licenses
                    </Button>
                    <div className="border-t border-[var(--color-border)] pt-4">
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => setSignOutDialogOpen(true)}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Version */}
        <p className="text-center text-xs text-[var(--color-text-secondary)]">
          Global Ledger v1.0.0 (Beta)
        </p>
      </div>

      {/* Sign Out Confirmation Dialog */}
      <Dialog open={signOutDialogOpen} onOpenChange={setSignOutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out? You can always sign back in with your email.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignOutDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSignOut}>
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
