import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Bell, MessageSquare, Megaphone } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  teacher_id: string;
}

interface Message {
  id: string;
  message: string;
  sender_id: string;
  read: boolean;
  created_at: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export default function NotificationsView() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    loadData();
    setupRealtimeSubscriptions();
  }, []);

  const setupRealtimeSubscriptions = () => {
    const announcementsChannel = supabase
      .channel('announcements-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, loadAnnouncements)
      .subscribe();

    const messagesChannel = supabase
      .channel('messages-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, loadMessages)
      .subscribe();

    const notificationsChannel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, loadNotifications)
      .subscribe();

    return () => {
      supabase.removeChannel(announcementsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(notificationsChannel);
    };
  };

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || "");
      
      await Promise.all([loadAnnouncements(), loadMessages(), loadNotifications()]);
    } catch (error: any) {
      toast.error("Error loading notifications");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get student's enrolled classes
      const { data: enrollments } = await supabase
        .from("class_enrollments")
        .select("class_id")
        .eq("student_id", user?.id || "");

      if (!enrollments || enrollments.length === 0) {
        setAnnouncements([]);
        return;
      }

      const classIds = enrollments.map(e => e.class_id);

      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .in("class_id", classIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error: any) {
      console.error("Error loading announcements:", error);
    }
  };

  const loadMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("receiver_id", user?.id || "")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error("Error loading messages:", error);
    }
  };

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user?.id || "")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      console.error("Error loading notifications:", error);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);
      
      loadNotifications();
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length + messages.filter(m => !m.read).length;

  if (loading) return <div>Loading notifications...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount}</Badge>
          )}
        </CardTitle>
        <CardDescription>Stay updated with announcements and messages</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="announcements">
              <Megaphone className="h-4 w-4 mr-2" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages ({messages.filter(m => !m.read).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <Card key={notif.id} className={!notif.read ? "border-primary" : ""}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{notif.title}</CardTitle>
                        {!notif.read && <Badge variant="default">New</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                      {!notif.read && (
                        <button
                          onClick={() => markNotificationAsRead(notif.id)}
                          className="text-xs text-primary mt-2 underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="announcements">
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <Card key={announcement.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{announcement.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {announcement.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(announcement.created_at).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
                {announcements.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No announcements yet
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="messages">
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <Card key={msg.id} className={!msg.read ? "border-primary" : ""}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm">{msg.message}</p>
                        {!msg.read && <Badge variant="default">New</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
                {messages.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No messages yet
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}