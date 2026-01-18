import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { API, useAuth } from "../App";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { ShoppingCart, CreditCard, CheckCircle, ArrowLeft, Shield, Clock } from "lucide-react";

const CheckoutPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [planDuration, setPlanDuration] = useState("monthly");
  const [formData, setFormData] = useState({
    customer_name: user?.name || "",
    customer_email: user?.email || "",
    customer_phone: ""
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`${API}/products/${productId}`);
        setProduct(response.data);
      } catch (error) {
        toast.error("المنتج غير موجود");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId, navigate]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customer_name: user.name || prev.customer_name,
        customer_email: user.email || prev.customer_email
      }));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // Create order
      const orderResponse = await axios.post(`${API}/orders`, {
        product_id: productId,
        plan_duration: planDuration,
        ...formData
      }, { withCredentials: true });

      const order = orderResponse.data;

      // Create payment session
      const paymentResponse = await axios.post(
        `${API}/payments/create-session?order_id=${order.order_id}`,
        {},
        { withCredentials: true }
      );

      const payment = paymentResponse.data;

      if (payment.mock_mode) {
        // Mock payment - complete directly
        await axios.post(
          `${API}/payments/mock-complete/${payment.payment_id}`,
          {},
          { withCredentials: true }
        );
        toast.success("تم إتمام الدفع بنجاح! (وضع تجريبي)");
        navigate("/dashboard");
      } else if (payment.payment_url) {
        // Redirect to Kashier
        window.location.href = payment.payment_url;
      } else {
        toast.error("فشل في إنشاء جلسة الدفع");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "حدث خطأ أثناء إنشاء الطلب");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) return null;

  const price = planDuration === "monthly" ? product.price_monthly : product.price_yearly;

  return (
    <div className="min-h-screen bg-muted/30" data-testid="checkout-page">
      <Navbar />

      <div className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header */}
            <div className="mb-8">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="gap-2 mb-4"
              >
                <ArrowLeft className="w-4 h-4 rtl-flip" />
                العودة
              </Button>
              <h1 className="text-3xl font-bold">إتمام الطلب</h1>
              <p className="text-muted-foreground">أكمل بياناتك لإتمام عملية الشراء</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      بيانات الطلب
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6" data-testid="checkout-form">
                      {/* Plan Duration */}
                      <div className="space-y-3">
                        <Label>مدة الاشتراك</Label>
                        <RadioGroup
                          value={planDuration}
                          onValueChange={setPlanDuration}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div>
                            <RadioGroupItem value="monthly" id="monthly" className="peer sr-only" />
                            <Label
                              htmlFor="monthly"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <span className="font-semibold">شهري</span>
                              <span className="text-2xl font-bold">{product.price_monthly} جنيه</span>
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem value="yearly" id="yearly" className="peer sr-only" />
                            <Label
                              htmlFor="yearly"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer relative"
                            >
                              <Badge className="absolute -top-2 left-1/2 -translate-x-1/2" variant="secondary">وفر 20%</Badge>
                              <span className="font-semibold">سنوي</span>
                              <span className="text-2xl font-bold">{product.price_yearly} جنيه</span>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <Separator />

                      {/* Customer Info */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="customer_name">الاسم الكامل *</Label>
                          <Input
                            id="customer_name"
                            value={formData.customer_name}
                            onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                            placeholder="أدخل اسمك الكامل"
                            required
                            data-testid="checkout-name-input"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="customer_email">البريد الإلكتروني *</Label>
                          <Input
                            id="customer_email"
                            type="email"
                            value={formData.customer_email}
                            onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                            placeholder="example@email.com"
                            required
                            dir="ltr"
                            data-testid="checkout-email-input"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="customer_phone">رقم الهاتف</Label>
                          <Input
                            id="customer_phone"
                            type="tel"
                            value={formData.customer_phone}
                            onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                            placeholder="+20 xxx xxx xxxx"
                            dir="ltr"
                            data-testid="checkout-phone-input"
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Payment Info */}
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="w-5 h-5 text-primary" />
                          <span className="font-semibold">طريقة الدفع</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          سيتم توجيهك لبوابة Kashier لإتمام عملية الدفع بشكل آمن
                        </p>
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full gap-2"
                        disabled={processing}
                        data-testid="checkout-submit-btn"
                      >
                        {processing ? (
                          <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                        ) : (
                          <>
                            <CreditCard className="w-5 h-5" />
                            إتمام الدفع - {price} جنيه
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>ملخص الطلب</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{product.name_ar}</h3>
                      <p className="text-sm text-muted-foreground">{product.description_ar}</p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="font-medium">المميزات:</h4>
                      <ul className="space-y-1">
                        {product.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>السعر</span>
                        <span>{price} جنيه</span>
                      </div>
                      <div className="flex justify-between">
                        <span>المدة</span>
                        <span>{planDuration === "monthly" ? "شهر واحد" : "سنة كاملة"}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>الإجمالي</span>
                        <span className="text-primary">{price} جنيه</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="w-4 h-4" />
                      <span>دفع آمن 100%</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>ضمان استرداد المال 30 يوم</span>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CheckoutPage;
