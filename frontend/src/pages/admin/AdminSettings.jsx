import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../../App";
import AdminLayout from "./AdminLayout";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Separator } from "../../components/ui/separator";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { Settings, CreditCard, Key, Save, Eye, EyeOff, AlertTriangle, CheckCircle } from "lucide-react";

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [settings, setSettings] = useState({
    kashier_merchant_id: "",
    kashier_api_key: "",
    kashier_mode: "sandbox",
    tax_enabled: false,
    tax_percentage: 14,
    company_name: "igate",
    website_name: "Igate-host",
    support_email: "support@igate-host.com",
    support_phone: "+20 100 123 4567"
  });
  const [connectionStatus, setConnectionStatus] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${API}/admin/settings`, { withCredentials: true });
        setSettings(prev => ({ ...prev, ...response.data }));
        setConnectionStatus(response.data.kashier_connected);
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/settings`, settings, { withCredentials: true });
      toast.success("تم حفظ الإعدادات بنجاح");
      
      // Test connection after save
      const testRes = await axios.post(`${API}/admin/settings/test-kashier`, {}, { withCredentials: true });
      setConnectionStatus(testRes.data.connected);
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  const testKashierConnection = async () => {
    try {
      const response = await axios.post(`${API}/admin/settings/test-kashier`, {}, { withCredentials: true });
      setConnectionStatus(response.data.connected);
      if (response.data.connected) {
        toast.success("تم الاتصال بـ Kashier بنجاح!");
      } else {
        toast.error("فشل الاتصال: " + (response.data.error || "تحقق من المفاتيح"));
      }
    } catch (error) {
      setConnectionStatus(false);
      toast.error("فشل في اختبار الاتصال");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div data-testid="admin-settings">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">الإعدادات</h1>
          <p className="text-muted-foreground">إعدادات بوابة الدفع والضرائب ومعلومات الشركة</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kashier Payment Gateway Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  بوابة الدفع Kashier
                </CardTitle>
                <CardDescription>
                  إعدادات الاتصال ببوابة الدفع Kashier
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Connection Status */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    {connectionStatus === true ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : connectionStatus === false ? (
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                    )}
                    <span>حالة الاتصال</span>
                  </div>
                  <Badge variant={connectionStatus === true ? "success" : connectionStatus === false ? "destructive" : "secondary"}>
                    {connectionStatus === true ? "متصل" : connectionStatus === false ? "غير متصل" : "غير محدد"}
                  </Badge>
                </div>

                {/* Mode Toggle */}
                <div className="space-y-2">
                  <Label>وضع التشغيل</Label>
                  <div className="flex items-center gap-4">
                    <Button
                      variant={settings.kashier_mode === "sandbox" ? "default" : "outline"}
                      onClick={() => setSettings({ ...settings, kashier_mode: "sandbox" })}
                      className="flex-1"
                    >
                      تجريبي (Sandbox)
                    </Button>
                    <Button
                      variant={settings.kashier_mode === "live" ? "default" : "outline"}
                      onClick={() => setSettings({ ...settings, kashier_mode: "live" })}
                      className="flex-1"
                    >
                      إنتاج (Live)
                    </Button>
                  </div>
                  {settings.kashier_mode === "sandbox" && (
                    <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                      ⚠️ أنت في الوضع التجريبي - لن يتم خصم أموال حقيقية
                    </p>
                  )}
                </div>

                <Separator />

                {/* Merchant ID */}
                <div className="space-y-2">
                  <Label htmlFor="merchant_id">Merchant ID</Label>
                  <Input
                    id="merchant_id"
                    value={settings.kashier_merchant_id}
                    onChange={(e) => setSettings({ ...settings, kashier_merchant_id: e.target.value })}
                    placeholder="MID-xx-xx"
                    dir="ltr"
                    data-testid="kashier-merchant-id"
                  />
                  <p className="text-xs text-muted-foreground">
                    تجده في لوحة تحكم Kashier تحت اسم المستخدم
                  </p>
                </div>

                {/* API Key */}
                <div className="space-y-2">
                  <Label htmlFor="api_key">API Key</Label>
                  <div className="relative">
                    <Input
                      id="api_key"
                      type={showApiKey ? "text" : "password"}
                      value={settings.kashier_api_key}
                      onChange={(e) => setSettings({ ...settings, kashier_api_key: e.target.value })}
                      placeholder="أدخل مفتاح API"
                      dir="ltr"
                      className="pl-10"
                      data-testid="kashier-api-key"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    تجده في Integrate Now → Payment API Keys
                  </p>
                </div>

                <Button
                  variant="outline"
                  onClick={testKashierConnection}
                  className="w-full"
                  data-testid="test-connection-btn"
                >
                  <Key className="w-4 h-4 ml-2" />
                  اختبار الاتصال
                </Button>

                {/* How to get keys */}
                <div className="p-4 bg-blue-50 rounded-lg text-sm">
                  <h4 className="font-medium text-blue-900 mb-2">كيفية الحصول على المفاتيح:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-blue-800">
                    <li>سجل دخول إلى <a href="https://merchant.kashier.io" target="_blank" rel="noopener noreferrer" className="underline">merchant.kashier.io</a></li>
                    <li>اذهب إلى "Integrate Now"</li>
                    <li>اضغط على "Payment API Keys"</li>
                    <li>انسخ Merchant ID و API Key</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tax & Company Settings */}
          <div className="space-y-6">
            {/* Tax Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات الضرائب</CardTitle>
                  <CardDescription>تفعيل وتحديد نسبة الضريبة على الفواتير</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>تفعيل الضريبة (VAT)</Label>
                      <p className="text-sm text-muted-foreground">إضافة الضريبة للفواتير</p>
                    </div>
                    <Switch
                      checked={settings.tax_enabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, tax_enabled: checked })}
                      data-testid="tax-toggle"
                    />
                  </div>
                  
                  {settings.tax_enabled && (
                    <div className="space-y-2">
                      <Label htmlFor="tax_percentage">نسبة الضريبة (%)</Label>
                      <Input
                        id="tax_percentage"
                        type="number"
                        value={settings.tax_percentage}
                        onChange={(e) => setSettings({ ...settings, tax_percentage: parseFloat(e.target.value) })}
                        min="0"
                        max="100"
                        data-testid="tax-percentage"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Company Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>معلومات الشركة</CardTitle>
                  <CardDescription>تظهر في الفواتير ورسائل البريد</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>اسم الشركة</Label>
                      <Input
                        value={settings.company_name}
                        onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                        data-testid="company-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>اسم الموقع</Label>
                      <Input
                        value={settings.website_name}
                        onChange={(e) => setSettings({ ...settings, website_name: e.target.value })}
                        data-testid="website-name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>بريد الدعم</Label>
                    <Input
                      type="email"
                      value={settings.support_email}
                      onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                      dir="ltr"
                      data-testid="support-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>هاتف الدعم</Label>
                    <Input
                      value={settings.support_phone}
                      onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                      dir="ltr"
                      data-testid="support-phone"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <Button
            size="lg"
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
            data-testid="save-settings-btn"
          >
            {saving ? (
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
            ) : (
              <>
                <Save className="w-5 h-5" />
                حفظ الإعدادات
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
