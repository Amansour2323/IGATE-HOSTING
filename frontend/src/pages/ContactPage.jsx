import { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../App";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Clock, Send, MessageCircle } from "lucide-react";

const ContactPage = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/contact`, formData);
      toast.success("تم إرسال رسالتك بنجاح! سنتواصل معك قريباً");
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      toast.error("حدث خطأ أثناء إرسال الرسالة");
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "البريد الإلكتروني",
      value: "support@igate-host.com",
      link: "mailto:support@igate-host.com"
    },
    {
      icon: Phone,
      title: "الهاتف",
      value: "+20 100 123 4567",
      link: "tel:+201001234567"
    },
    {
      icon: MessageCircle,
      title: "واتساب",
      value: "+20 100 123 4567",
      link: "https://wa.me/201001234567"
    },
    {
      icon: Clock,
      title: "ساعات العمل",
      value: "24/7 متاح دائماً",
      link: null
    }
  ];

  return (
    <div className="min-h-screen" data-testid="contact-page">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16 hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4">تواصل معنا</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              نحن هنا لمساعدتك. تواصل معنا في أي وقت
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info Cards */}
            <div className="lg:col-span-1 space-y-4">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="card-hover">
                    <CardContent className="p-6">
                      {info.link ? (
                        <a
                          href={info.link}
                          target={info.link.startsWith("http") ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 group"
                        >
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <info.icon className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold">{info.title}</div>
                            <div className="text-muted-foreground" dir={info.icon === Phone || info.icon === MessageCircle ? "ltr" : undefined}>
                              {info.value}
                            </div>
                          </div>
                        </a>
                      ) : (
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <info.icon className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold">{info.title}</div>
                            <div className="text-muted-foreground">{info.value}</div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {/* Location */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">العنوان</div>
                        <div className="text-muted-foreground">القاهرة، مصر</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">أرسل لنا رسالة</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6" data-testid="contact-form">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">الاسم الكامل *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="أدخل اسمك الكامل"
                          required
                          className="text-right"
                          data-testid="contact-name-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">البريد الإلكتروني *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="example@email.com"
                          required
                          dir="ltr"
                          className="text-left"
                          data-testid="contact-email-input"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+20 xxx xxx xxxx"
                        dir="ltr"
                        className="text-left"
                        data-testid="contact-phone-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">الرسالة *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="اكتب رسالتك هنا..."
                        rows={6}
                        required
                        className="text-right resize-none"
                        data-testid="contact-message-input"
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full gap-2"
                      disabled={loading}
                      data-testid="contact-submit-btn"
                    >
                      {loading ? (
                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          إرسال الرسالة
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactPage;
