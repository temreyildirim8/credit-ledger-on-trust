'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/lib/hooks/useAuth';
import { userProfilesService } from '@/lib/services/user-profiles.service';
import { getBrandName } from '@/lib/branding';
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
  Loader2,
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
import { SubscriptionUpgradeModal } from '@/components/settings/SubscriptionUpgradeModal';

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
  const localeHook = useLocale();

  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split('/')[1] || 'en';
  const brandName = getBrandName(localeHook);
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Settings sections
  const settingsSections: SettingsSection[] = [
    { id: 'profile', titleKey: 'sections.profile.title', descriptionKey: 'sections.profile.description', icon: User },
    { id: 'business', titleKey: 'sections.business.title', descriptionKey: 'sections.business.description', icon: Building2 },
    { id: 'notifications', titleKey: 'sections.notifications.title', descriptionKey: 'sections.notifications.description', icon: Bell },
    { id: 'subscription', titleKey: 'sections.subscription.title', descriptionKey: 'sections.subscription.description', icon: CreditCard },
    { id: 'data', titleKey: 'sections.data.title', descriptionKey: 'sections.data.description', icon: Download },
    { id: 'support', titleKey: 'sections.support.title', descriptionKey: 'sections.support.description', icon: HelpCircle },
    { id: 'account', titleKey: 'sections.account.title', descriptionKey: 'sections.account.description', icon: Shield },
  ];

  // Profile state
  const [name, setName] = useState(user?.user_metadata?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');

  // Original values for change detection
  const [originalName, setOriginalName] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');
  const [originalBusinessName, setOriginalBusinessName] = useState('');
  const [originalCurrency, setOriginalCurrency] = useState('TRY');
  const [originalLanguage, setOriginalLanguage] = useState(locale);

  // Business state
  const [businessName, setBusinessName] = useState('');
  const [currency, setCurrency] = useState('TRY');
  const [language, setLanguage] = useState(locale);

  // Notifications state
  const [pushEnabled, setPushEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);

  // Theme state (reserved for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [darkMode, setDarkMode] = useState(false);

  // Load user profile data on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const profile = await userProfilesService.getProfile(user.id);
        if (profile) {
          const loadedName = profile.full_name || user?.user_metadata?.name || '';
          const loadedPhone = profile.phone || '';
          const loadedBusinessName = profile.shop_name || '';
          const loadedCurrency = profile.currency || 'TRY';
          const loadedLanguage = profile.language || locale;

          setName(loadedName);
          setPhone(loadedPhone);
          setBusinessName(loadedBusinessName);
          setCurrency(loadedCurrency);
          setLanguage(loadedLanguage);

          // Store original values for change detection
          setOriginalName(loadedName);
          setOriginalPhone(loadedPhone);
          setOriginalBusinessName(loadedBusinessName);
          setOriginalCurrency(loadedCurrency);
          setOriginalLanguage(loadedLanguage);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        toast.error(t('errors.loadFailed') || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [user?.id, user?.user_metadata?.name, locale, t]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success(tCommon('success') || 'Signed out successfully');
      // Redirect to marketing home page after sign out
      window.location.replace(`/${locale}`);
    } catch (error) {
      toast.error(tCommon('tryAgain'));
      console.error('Sign out error:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    // Validation for empty required fields
    if (!name.trim()) {
      toast.error(t('sections.profile.nameRequired') || 'Name is required');
      return;
    }

    // Check if anything changed
    const nameChanged = name.trim() !== originalName.trim();
    const phoneChanged = phone.trim() !== originalPhone.trim();

    if (!nameChanged && !phoneChanged) {
      toast.info(t('sections.profile.noChanges') || 'No changes to save');
      return;
    }

    setIsSaving(true);
    try {
      // Check if profile exists, create if not
      const existingProfile = await userProfilesService.getProfile(user.id);

      if (existingProfile) {
        await userProfilesService.updateProfile(user.id, {
          full_name: name.trim(),
          phone: phone.trim() || undefined,
        });
      } else {
        await userProfilesService.createProfile(user.id, {
          full_name: name.trim(),
          phone: phone.trim() || undefined,
        });
      }

      // Update original values after successful save
      setOriginalName(name.trim());
      setOriginalPhone(phone.trim());

      toast.success(t('sections.profile.saved'));
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(t('errors.saveFailed') || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBusiness = async () => {
    if (!user?.id) return;

    // Check if anything changed
    const businessNameChanged = businessName.trim() !== originalBusinessName.trim();
    const currencyChanged = currency !== originalCurrency;
    const languageChanged = language !== originalLanguage;

    if (!businessNameChanged && !currencyChanged && !languageChanged) {
      toast.info(t('sections.business.noChanges') || 'No changes to save');
      return;
    }

    setIsSaving(true);
    try {
      // Check if profile exists, create if not
      const existingProfile = await userProfilesService.getProfile(user.id);

      if (existingProfile) {
        await userProfilesService.updateProfile(user.id, {
          shop_name: businessName.trim() || undefined,
          currency: currency,
          language: language,
        });
      } else {
        await userProfilesService.createProfile(user.id, {
          shop_name: businessName.trim() || undefined,
          currency: currency,
          language: language,
        });
      }

      // Update original values after successful save
      setOriginalBusinessName(businessName.trim());
      setOriginalCurrency(currency);
      setOriginalLanguage(language);

      toast.success(t('sections.business.saved'));

      // If language changed, navigate to the new locale
      if (language !== locale) {
        const currentPath = pathname.replace(`/${locale}`, `/${language}`);
        router.replace(currentPath);
      }
    } catch (error) {
      console.error('Error saving business settings:', error);
      toast.error(t('errors.saveFailed') || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = (format: 'csv' | 'pdf') => {
    toast.success(`Exporting data as ${format.toUpperCase()}...`);
  };

  const activeSection = settingsSections.find((s) => s.id === activeTab);
  const ActiveIcon = activeSection?.icon || User;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-accent to-accent-hover rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Award className="h-8 w-8 text-white/80" />
            <div>
              <h1 className="text-2xl font-bold font-display">{t('title')}</h1>
              <p className="text-white/90 text-sm">{t('subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Beta Badge */}
      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-text">
                {t('betaFounder')}
              </p>
              <p className="text-sm text-text-secondary">
                {t('betaDescription')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <Card className="border-border">
            <CardContent className="p-3">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                const title = typeof section.titleKey === 'string' ? section.titleKey : t(section.titleKey);
                const description = typeof section.descriptionKey === 'string' ? section.descriptionKey : t(section.descriptionKey);
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveTab(section.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      activeTab === section.id
                        ? 'bg-accent text-white shadow-sm'
                        : 'hover:bg-surface-alt text-text'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{title}</p>
                      <p className={`text-xs ${activeTab === section.id ? 'text-white/70' : 'text-text-secondary'}`}>
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
          <Card className="border-border">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <ActiveIcon className="h-5 w-5 text-accent" />
                {activeSection ? t(activeSection.titleKey) : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              )}

              {/* Profile Section */}
              {!isLoading && activeTab === 'profile' && (
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
                  <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full bg-accent hover:bg-accent-hover text-white">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('sections.profile.saveChanges')}
                  </Button>
                </div>
              )}

              {/* Business Section */}
              {!isLoading && activeTab === 'business' && (
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
                      <SelectTrigger className="w-full">
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
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="tr">Türkçe</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSaveBusiness} disabled={isSaving} className="w-full bg-accent hover:bg-accent-hover text-white">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('sections.business.saveChanges')}
                  </Button>
                </div>
              )}

              {/* Notifications Section */}
              {!isLoading && activeTab === 'notifications' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text">{t('sections.notifications.pushEnabled')}</p>
                      <p className="text-sm text-text-secondary">{t('sections.notifications.pushDescription')}</p>
                    </div>
                    <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text">{t('sections.notifications.remindersEnabled')}</p>
                      <p className="text-sm text-text-secondary">{t('sections.notifications.remindersDescription')}</p>
                    </div>
                    <Switch checked={remindersEnabled} onCheckedChange={setRemindersEnabled} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text">{t('sections.notifications.weeklyReport')}</p>
                      <p className="text-sm text-text-secondary">{t('sections.notifications.weeklyReportDescription')}</p>
                    </div>
                    <Switch checked={weeklyReport} onCheckedChange={setWeeklyReport} />
                  </div>
                </div>
              )}

              {/* Subscription Section */}
              {!isLoading && activeTab === 'subscription' && (
                <div className="space-y-5">
                  <div className="p-4 bg-accent/10 rounded-xl border border-accent/20">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-text">{t('sections.subscription.currentPlan')}</p>
                        <p className="text-sm text-text-secondary">{t('sections.subscription.planName')}</p>
                      </div>
                      <Badge className="bg-accent text-white">50% Off</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-success" />
                        <span>{t('sections.subscription.features.customers')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-success" />
                        <span>{t('sections.subscription.features.transactions')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-success" />
                        <span>{t('sections.subscription.features.offline')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-success" />
                        <span>{t('sections.subscription.features.export')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      className="flex-1 bg-accent hover:bg-accent-hover"
                      onClick={() => setUpgradeModalOpen(true)}
                    >
                      {t('sections.subscription.upgrade')}
                    </Button>
                    <Button variant="outline" className="flex-1">
                      {t('sections.subscription.manageBilling')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Data Section */}
              {!isLoading && activeTab === 'data' && (
                <div className="space-y-5">
                  <div>
                    <p className="font-medium mb-3 text-text">{t('sections.data.export')}</p>
                    <p className="text-sm text-text-secondary mb-4">{t('sections.data.exportDescription')}</p>
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
                  <div className="p-4 bg-surface-alt rounded-xl border border-border">
                    <p className="font-medium mb-2 text-text">{t('sections.data.backup')}</p>
                    <p className="text-sm text-text-secondary mb-3">{t('sections.data.backupDescription')}</p>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <div className="h-2 w-2 rounded-full bg-success" />
                      {t('sections.data.lastBackup')}
                    </div>
                  </div>
                </div>
              )}

              {/* Support Section */}
              {!isLoading && activeTab === 'support' && (
                <div className="space-y-3">
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
                  <div className="border-t border-border pt-3">
                    <p className="text-sm text-text-secondary text-center mb-2">{t('sections.support.enjoyingApp')}</p>
                    <Button variant="outline" className="w-full">
                      {t('sections.support.rateUs')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Account Section */}
              {!isLoading && activeTab === 'account' && (
                <div className="space-y-3">
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
                  <div className="border-t border-border pt-3">
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
      <p className="text-center text-xs text-text-secondary">
        {brandName} v1.0.0 (Beta)
      </p>

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

      {/* Subscription Upgrade Modal */}
      <SubscriptionUpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        currentPlan="free"
      />
    </div>
  );
}
