import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../../App";
import AdminLayout from "./AdminLayout";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { toast } from "sonner";
import { MessageSquare, Eye, Mail, Phone, Clock } from "lucide-react";

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API}/admin/contact`, { withCredentials: true });
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const markAsRead = async (messageId) => {
    try {
      await axios.put(`${API}/admin/contact/${messageId}/read`, {}, { withCredentials: true });
      fetchMessages();
    } catch (error) {
      toast.error("فشل في تحديث حالة الرسالة");
    }
  };

  const viewMessage = (message) => {
    setSelectedMessage(message);
    setDialogOpen(true);
    if (!message.is_read) {
      markAsRead(message.message_id);
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
      <div data-testid="admin-messages">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">رسائل التواصل</h1>
          <p className="text-muted-foreground">إدارة رسائل العملاء من نموذج التواصل</p>
        </motion.div>

        <Card>
          <CardContent className="p-0">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد رسائل حتى الآن</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المرسل</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>الرسالة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((message) => (
                    <TableRow key={message.message_id} className={!message.is_read ? "bg-primary/5" : ""}>
                      <TableCell className="font-medium">{message.name}</TableCell>
                      <TableCell>
                        <a href={`mailto:${message.email}`} className="text-primary hover:underline">
                          {message.email}
                        </a>
                      </TableCell>
                      <TableCell dir="ltr">{message.phone || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">{message.message}</TableCell>
                      <TableCell>
                        {message.is_read ? (
                          <Badge variant="secondary">مقروءة</Badge>
                        ) : (
                          <Badge variant="default">جديدة</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(message.created_at).toLocaleDateString("ar-EG")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewMessage(message)}
                          className="gap-1"
                          data-testid={`view-message-${message.message_id}`}
                        >
                          <Eye className="w-4 h-4" />
                          عرض
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Message Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>تفاصيل الرسالة</DialogTitle>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {selectedMessage.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedMessage.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {selectedMessage.email}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedMessage.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span dir="ltr">{selectedMessage.phone}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(selectedMessage.created_at).toLocaleString("ar-EG")}</span>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">الرسالة:</h4>
                  <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.location.href = `mailto:${selectedMessage.email}`}
                  >
                    <Mail className="w-4 h-4 ml-2" />
                    رد بالبريد
                  </Button>
                  {selectedMessage.phone && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => window.open(`https://wa.me/${selectedMessage.phone.replace(/\D/g, '')}`, '_blank')}
                    >
                      <Phone className="w-4 h-4 ml-2" />
                      واتساب
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminMessages;
