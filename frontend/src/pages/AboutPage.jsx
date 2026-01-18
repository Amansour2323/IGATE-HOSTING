import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Card, CardContent } from "../components/ui/card";
import { Target, Eye, Award, Users, CheckCircle, Rocket } from "lucide-react";

const AboutPage = () => {
  const values = [
    {
      icon: Target,
      title: "رؤيتنا",
      description: "أن نكون الشريك الأول والأمثل للشركات في مصر والشرق الأوسط في مجال الحلول الرقمية المتكاملة"
    },
    {
      icon: Eye,
      title: "رسالتنا",
      description: "تقديم خدمات استضافة وتصميم وتسويق رقمي بأعلى جودة وأسعار تنافسية مع دعم فني متميز"
    },
    {
      icon: Award,
      title: "قيمنا",
      description: "الجودة، الموثوقية، الابتكار، والتميز في خدمة العملاء هي الركائز الأساسية لعملنا"
    }
  ];

  const whyUs = [
    "خبرة تزيد عن 5 سنوات في مجال الاستضافة",
    "فريق دعم فني متخصص ومتاح على مدار الساعة",
    "أسعار تنافسية مع جودة عالمية",
    "خوادم في مراكز بيانات عالمية",
    "ضمان استرداد المال خلال 30 يوم",
    "حماية متقدمة ضد الهجمات الإلكترونية"
  ];

  const team = [
    { name: "أحمد محمد", role: "المدير التنفيذي", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop" },
    { name: "سارة أحمد", role: "مدير التقنية", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop" },
    { name: "محمد علي", role: "مدير الدعم الفني", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop" }
  ];

  return (
    <div className="min-h-screen" data-testid="about-page">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16 hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4">من نحن</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              شركة igate - شريكك الموثوق في عالم الحلول الرقمية
            </p>
          </motion.div>
        </div>
      </section>

      {/* About Content */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                <span className="gradient-text">Igate-host</span> - منصة الاستضافة الأولى
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                تأسست شركة igate بهدف تقديم حلول استضافة مواقع احترافية للشركات والأفراد في مصر والشرق الأوسط. 
                نحن نؤمن بأن كل مشروع يستحق بنية تحتية رقمية قوية وموثوقة.
              </p>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                من خلال منصة Igate-host، نقدم خدمات استضافة متكاملة تشمل استضافة المواقع، 
                تصميم المواقع الاحترافية، والتسويق الرقمي الفعال. نسعى دائماً لتقديم أفضل الحلول 
                بأسعار تنافسية مع الحفاظ على أعلى معايير الجودة.
              </p>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">5+</div>
                  <div className="text-sm text-muted-foreground">سنوات خبرة</div>
                </div>
                <div className="w-px h-12 bg-border"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">10K+</div>
                  <div className="text-sm text-muted-foreground">عميل</div>
                </div>
                <div className="w-px h-12 bg-border"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">99.9%</div>
                  <div className="text-sm text-muted-foreground">وقت التشغيل</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1758873271805-1ff103e28558?w=600&q=80"
                alt="فريق العمل"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -right-6 bg-primary text-white p-6 rounded-xl shadow-lg">
                <Rocket className="w-8 h-8 mb-2" />
                <div className="font-bold">نمو مستمر</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Vision, Mission, Values */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full text-center p-8 card-hover">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <item.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <img
                src="https://images.unsplash.com/photo-1608280200244-fae9946df695?w=600&q=80"
                alt="الدعم الفني"
                className="rounded-2xl shadow-xl"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">لماذا تختارنا؟</h2>
              <p className="text-lg text-muted-foreground mb-8">
                نلتزم بتقديم أفضل الخدمات لعملائنا مع التركيز على الجودة والموثوقية
              </p>
              <ul className="space-y-4">
                {whyUs.map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                    <span className="text-lg">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">فريق العمل</h2>
            <p className="text-lg text-muted-foreground">
              خبراء متخصصون يعملون على مدار الساعة لخدمتكم
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="text-center p-6 card-hover">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h3 className="text-xl font-bold">{member.name}</h3>
                  <p className="text-muted-foreground">{member.role}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
