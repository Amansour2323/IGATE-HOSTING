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
import { 
  Server, Globe, Megaphone, Shield, Clock, Headphones, 
  CheckCircle, Star, ArrowLeft, ChevronLeft, ChevronRight,
  Zap, Lock, BarChart3, Users
} from "lucide-react";

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [billingCycle, setBillingCycle] = useState("monthly");

  const slides = [
    {
      title: "استضافة مواقع احترافية",
      subtitle: "سرعة فائقة وأمان متكامل",
      description: "خوادم عالية الأداء مع دعم فني على مدار الساعة",
      image: "https://images.unsplash.com/photo-1645477704075-cb3d14b349ee?w=1200&q=80",
      cta: "ابدأ الآن",
      link: "/#plans"
    },
    {
      title: "تصميم مواقع متميز",
      subtitle: "تصاميم عصرية تعكس هويتك",
      description: "نصمم لك موقع احترافي يجذب عملائك",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
      cta: "اكتشف المزيد",
      link: "/contact"
    },
    {
      title: "تسويق رقمي فعال",
      subtitle: "وصول أوسع ونتائج ملموسة",
      description: "نساعدك في الوصول لجمهورك المستهدف",
      image: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=1200&q=80",
      cta: "تواصل معنا",
      link: "/contact"
    }
  ];

  const features = [
    { icon: Zap, title: "سرعة فائقة", description: "خوادم SSD بأداء عالي" },
    { icon: Shield, title: "حماية متقدمة", description: "SSL مجاني وحماية DDoS" },
    { icon: Clock, title: "99.9% Uptime", description: "ضمان استمرارية الخدمة" },
    { icon: Headphones, title: "دعم 24/7", description: "فريق دعم متاح دائماً" },
    { icon: Lock, title: "نسخ احتياطي", description: "نسخ يومي تلقائي" },
    { icon: BarChart3, title: "لوحة تحكم", description: "إدارة سهلة ومرنة" }
  ];

  const stats = [
    { value: "10,000+", label: "عميل سعيد" },
    { value: "99.9%", label: "وقت التشغيل" },
    { value: "24/7", label: "دعم فني" },
    { value: "5+", label: "سنوات خبرة" }
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API}/products?category=hosting`);
        setProducts(response.data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="min-h-screen" data-testid="home-page">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] overflow-hidden" data-testid="hero-section">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-l from-slate-900/95 via-slate-900/80 to-slate-900/60 z-10" />
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 z-20 flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="max-w-2xl"
                >
                  <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                    {slide.subtitle}
                  </Badge>
                  <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
                    {slide.title}
                  </h1>
                  <p className="text-xl text-gray-300 mb-8">
                    {slide.description}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Link to={slide.link}>
                      <Button size="lg" className="gap-2 text-lg h-12 px-8" data-testid="hero-cta-btn">
                        {slide.cta}
                        <ArrowLeft className="w-5 h-5 rtl-flip" />
                      </Button>
                    </Link>
                    <Link to="/contact">
                      <Button size="lg" variant="outline" className="text-lg h-12 px-8 border-white/30 text-white hover:bg-white/10">
                        تواصل معنا
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        ))}

        {/* Slide Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4">
          <button onClick={prevSlide} className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide ? "bg-primary" : "bg-white/40"
                }`}
              />
            ))}
          </div>
          <button onClick={nextSlide} className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Hosting Plans */}
      <section id="plans" className="py-20 bg-muted/30" data-testid="plans-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">باقات الاستضافة</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              اختر الباقة المناسبة لاحتياجاتك مع ضمان استرداد المال خلال 30 يوم
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mt-8">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <motion.div
                key={product.product_id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
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
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">لماذا تختار Igate-host؟</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              نقدم لك أفضل خدمات الاستضافة بمعايير عالمية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full card-hover text-center p-6">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-20 bg-muted/30" data-testid="services-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">خدماتنا المتكاملة</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              حلول شاملة لنجاح أعمالك الرقمية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full card-hover overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                  <Server className="w-20 h-20 text-white/80" />
                </div>
                <CardHeader>
                  <CardTitle>استضافة المواقع</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    خوادم عالية الأداء مع SSD وحماية متقدمة ودعم فني على مدار الساعة
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full card-hover overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-cyan-600 to-cyan-800 flex items-center justify-center">
                  <Globe className="w-20 h-20 text-white/80" />
                </div>
                <CardHeader>
                  <CardTitle>تصميم المواقع</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    تصاميم احترافية متجاوبة تعكس هوية علامتك التجارية وتجذب عملائك
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full card-hover overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                  <Megaphone className="w-20 h-20 text-white/80" />
                </div>
                <CardHeader>
                  <CardTitle>التسويق الرقمي</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    استراتيجيات تسويقية فعالة للوصول لجمهورك المستهدف وزيادة مبيعاتك
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 hero-gradient" data-testid="stats-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" data-testid="cta-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            جاهز لبدء مشروعك الرقمي؟
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            انضم لآلاف العملاء الراضين وابدأ رحلتك معنا اليوم
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/#plans">
              <Button size="lg" className="gap-2 text-lg h-12 px-8" data-testid="cta-plans-btn">
                عرض الباقات
                <ArrowLeft className="w-5 h-5 rtl-flip" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="text-lg h-12 px-8">
                تواصل معنا
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
