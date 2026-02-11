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
import { useTranslations } from 'next-intl';

type SettingsTab = 'profile' | 'business' | 'notifications' | 'subscription' | 'data' | 'support' | 'account';

interface SettingsSection {
  id: SettingsTab;
  titleKey: string;
  descriptionKey: string;
  icon: React.ElementType;
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const tAccount = useTranslations('settings.sections.account');

  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);

  // Settings sections will be computed from translations
  const settingsSections: SettingsSection[] = [
    { id: 'profile', titleKey: 'sections.profile.title', descriptionKey: 'sections.profile.description', icon: User },
    { id: 'business', titleKey: 'sections.business.title', descriptionKey: 'sections.business.description', icon: Building2 },
    { id: 'notifications', titleKey: 'sections.notifications.title', descriptionKey: 'sections.notifications.description', icon: Bell },
    { id: 'subscription', titleKey: 'sections.subscription.title', descriptionKey: 'sections.subscription.description', icon: CreditCard },
    { id: 'data', titleKey: 'sections.data.title', descriptionKey: 'sections.data.description', icon: Download },
    { id: 'support', titleKey: 'sections.support.title', descriptionKey: 'sections.support.description', icon: HelpCircle },
    { id: 'account', titleKey: 'sections.account.title', descriptionKey: 'sections.account.description', icon: Shield },
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
      toast.success(tCommon('success') || 'Signed out successfully');
      router.push(`/${locale}/login`);
    } catch (error) {
      toast.error(tCommon('tryAgain'));
      console.error('Sign out error:', error);
    }
  };

  const handleSaveProfile = () => {
    toast.success(t('sections.profile.saved'));
  };

  const handleSaveBusiness = () => {
    toast.success(t('sections.business.saved'));
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
          <h1 className="text-2xl font-bold font-display">{t('title')}</h1>
          <p className="text-white/80 mt-1">{t('subtitle')}</p>
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
                  {t('betaFounder')}
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {t('betaDescription')}
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
                  const title = typeof section.titleKey === 'string' ? section.titleKey : t(section.titleKey);
                  const description = typeof section.descriptionKey === 'string' ? section.descriptionKey : t(section.descriptionKey);
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
                        <p className="font-medium text-sm">{title}</p>
                        <p className={`text-xs ${activeTab === section.id ? 'text-white/70' : 'text-[var(--color-text-secondary)]'}`}>
                          {description}
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
                  {activeSection ? t(activeSection.titleKey) : ''}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* Profile Section */}
                {activeTab === 'profile' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('sections.profile.fullName')}</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('sections.profile.fullName')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('sections.profile.email')}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('sections.profile.phone')}</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+90 555 123 4567"
                      />
                    </div>
                    <Button onClick={handleSaveProfile} className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]">
                      {t('sections.profile.saveChanges')}
                    </Button>
                  </div>
                )}

                {/* Business Section */}
                {activeTab === 'business' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">{t('sections.business.businessName')}</Label>
                      <Input
                        id="businessName"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder={t('sections.business.businessNamePlaceholder')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">{t('sections.business.currency')}</Label>
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
                      <Label htmlFor="language">{t('sections.business.language')}</Label>
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
                      <Label htmlFor="timezone">{t('sections.business.timezone')}</Label>
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
                      {t('sections.business.saveChanges')}
                    </Button>
                  </div>
                )}

                {/* Notifications Section */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{t('sections.notifications.pushEnabled')}</p>
                        <p className="text-sm text-[var(--color-text-secondary)]">{t('sections.notifications.pushDescription')}</p>
                      </div>
                      <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{t('sections.notifications.remindersEnabled')}</p>
                        <p className="text-sm text-[var(--color-text-secondary)]">{t('sections.notifications.remindersDescription')}</p>
                      </div>
                      <Switch checked={remindersEnabled} onCheckedChange={setRemindersEnabled} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{t('sections.notifications.weeklyReport')}</p>
                        <p className="text-sm text-[var(--color-text-secondary)]">{t('sections.notifications.weeklyReportDescription')}</p>
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
                          <p className="font-semibold text-[var(--color-text)]">{t('sections.subscription.currentPlan')}</p>
                          <p className="text-sm text-[var(--color-text-secondary)]">{t('sections.subscription.planName')}</p>
                        </div>
                        <Badge className="bg-[var(--color-accent)] text-white">50% Off</Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span>{t('sections.subscription.features.customers')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span>{t('sections.subscription.features.transactions')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span>{t('sections.subscription.features.offline')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span>{t('sections.subscription.features.export')}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      {t('sections.subscription.viewPricing')}
                    </Button>
                    <Button variant="outline" className="w-full">
                      {t('sections.subscription.manageBilling')}
                    </Button>
                  </div>
                )}

                {/* Data Section */}
                {activeTab === 'data' && (
                  <div className="space-y-6">
                    <div>
                      <p className="font-medium mb-2">{t('sections.data.export')}</p>
                      <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                        {t('sections.data.exportDescription')}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleExportData('csv')}
                          className="flex-1"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {t('sections.data.exportCSV')}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleExportData('pdf')}
                          className="flex-1"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {t('sections.data.exportPDF')}
                        </Button>
                      </div>
                    </div>
                    <div className="border-t border-[var(--color-border)] pt-6">
                      <p className="font-medium mb-2">{t('sections.data.backup')}</p>
                      <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                        {t('sections.data.backupDescription')}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        {t('sections.data.lastBackup')}
                      </div>
                    </div>
                  </div>
                )}

                {/* Support Section */}
                {activeTab === 'support' && (
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      {t('sections.support.helpCenter')}
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Mail className="h-4 w-4 mr-2" />
                      {t('sections.support.contactSupport')}
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Phone className="h-4 w-4 mr-2" />
                      {t('sections.support.callSupport')}
                    </Button>
                    <div className="border-t border-[var(--color-border)] pt-4">
                      <p className="text-sm text-[var(--color-text-secondary)] mb-2">Enjoying the app?</p>
                      <Button variant="outline" className="w-full">
                        {t('sections.support.rateUs')}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Account Section */}
                {activeTab === 'account' && (
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="h-4 w-4 mr-2" />
                      {tAccount('privacyPolicy')}
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Globe className="h-4 w-4 mr-2" />
                      {tAccount('termsOfService')}
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Globe className="h-4 w-4 mr-2" />
                      {tAccount('licenses')}
                    </Button>
                    <div className="border-t border-[var(--color-border)] pt-4">
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => setSignOutDialogOpen(true)}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        {tAccount('signOut')}
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
            <DialogTitle>{tAccount('signOutTitle')}</DialogTitle>
            <DialogDescription>
              {tAccount('signOutConfirm')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignOutDialogOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleSignOut}>
              {tAccount('signOut')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
