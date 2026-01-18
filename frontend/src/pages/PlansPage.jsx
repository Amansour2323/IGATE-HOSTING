import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../App";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { CheckCircle, Star, Server, Globe, Megaphone, Zap, Shield, Clock } from "lucide-react";

const PlansPage = () => {
  const [products, setProducts] = useState([]);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [activeCategory, setActiveCategory] = useState("hosting");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API}/products`);
        setProducts(response.data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = [
    { id: "hosting", label: "استضافة المواقع", icon: Server },
    { id: "design", label: "تصميم المواقع", icon: Globe },
    { id: "marketing", label: "التسويق الرقمي", icon: Megaphone },
  ];

  const filteredProducts = products.filter(p => p.category === activeCategory);

  const features = [
    { icon: Zap, text: "تفعيل فوري" },
    { icon: Shield, text: "ضمان استرداد 30 يوم" },
    { icon: Clock, text: "دعم 24/7" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-testid="plans-page">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16 hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4">باقاتنا وخدماتنا</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              اختر الباقة المناسبة لاحتياجاتك مع ضمان الجودة والدعم المستمر
            </p>
            
            {/* Features Pills */}
            <div className="flex flex-wrap justify-center gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                  <feature.icon className="w-4 h-4" />
                  <span className="text-sm">{feature.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`font-medium ${billingCycle === "monthly" ? "text-primary" : "text-muted-foreground"}`}>
              شهري
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                billingCycle === "yearly" ? "bg-primary" : "bg-muted"
              }`}
              data-testid="billing-toggle"
            >
              <span className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${
                billingCycle === "yearly" ? "right-1" : "left-1"
              }`} />
            </button>
            <span className={`font-medium ${billingCycle === "yearly" ? "text-primary" : "text-muted-foreground"}`}>
              سنوي
              <Badge variant="secondary" className="mr-2">وفر 20%</Badge>
            </span>
          </div>

          {/* Category Tabs */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
            <TabsList className="grid w-full max-w-xl mx-auto grid-cols-3 mb-8">
              {categories.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.id} className="gap-2" data-testid={`tab-${cat.id}`}>
                  <cat.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{cat.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((cat) => (
              <TabsContent key={cat.id} value={cat.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {filteredProducts.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <cat.icon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">لا توجد باقات متاحة حالياً في هذه الفئة</p>
                    </div>
                  ) : (
                    filteredProducts.map((product, index) => (
                      <motion.div
                        key={product.product_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className={`relative h-full card-hover ${
                          product.is_popular ? "border-primary shadow-lg shadow-primary/20" : ""
                        }`} data-testid={`plan-card-${index}`}>
                          {product.is_popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                              <Badge className="bg-primary">
                                <Star className="w-3 h-3 ml-1" />
                                الأكثر شعبية
                              </Badge>
                            </div>
                          )}
                          <CardHeader className="text-center pb-4">
                            <CardTitle className="text-2xl">{product.name_ar}</CardTitle>
                            <CardDescription>{product.description_ar}</CardDescription>
                          </CardHeader>
                          <CardContent className="text-center">
                            <div className="mb-6">
                              <span className="text-4xl font-bold">
                                {billingCycle === "monthly" ? product.price_monthly : product.price_yearly}
                              </span>
                              <span className="text-muted-foreground mr-1">
                                جنيه / {billingCycle === "monthly" ? "شهر" : "سنة"}
                              </span>
                            </div>
                            <ul className="space-y-3 text-right">
                              {product.features.map((feature, fIndex) => (
                                <li key={fIndex} className="flex items-center gap-2">
                                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                          <CardFooter>
                            <Link to={`/checkout/${product.product_id}`} className="w-full">
                              <Button 
                                className="w-full" 
                                variant={product.is_popular ? "default" : "outline"}
                                data-testid={`order-btn-${index}`}
                              >
                                اطلب الآن
                              </Button>
                            </Link>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">أسئلة شائعة</h2>
            <p className="text-muted-foreground">إجابات على الأسئلة الأكثر شيوعاً</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "هل يمكنني ترقية الباقة لاحقاً؟",
                a: "نعم، يمكنك الترقية في أي وقت وسيتم احتساب الفرق فقط."
              },
              {
                q: "ما هي طرق الدفع المتاحة؟",
                a: "نقبل الدفع عبر البطاقات البنكية (Visa/Mastercard) من خلال بوابة Kashier الآمنة."
              },
              {
                q: "هل يوجد ضمان استرداد المال؟",
                a: "نعم، نقدم ضمان استرداد المال خلال 30 يوم إذا لم تكن راضياً عن الخدمة."
              },
              {
                q: "كم يستغرق تفعيل الخدمة؟",
                a: "يتم تفعيل خدمات الاستضافة فوراً بعد تأكيد الدفع. أما خدمات التصميم فتبدأ خلال 24-48 ساعة."
              }
            ].map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">لم تجد ما تبحث عنه؟</h2>
          <p className="text-primary-foreground/80 mb-8">
            تواصل معنا وسنساعدك في اختيار الباقة المناسبة لاحتياجاتك
          </p>
          <Link to="/contact">
            <Button size="lg" variant="secondary" className="gap-2">
              تواصل معنا الآن
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PlansPage;
