import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Plus, Send } from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  read: boolean | null;
  created_at: string | null;
}

interface User {
  id: string;
  full_name: string | null;
}

export default function MessagingSystem() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const channel = setupRealtimeSubscription();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedUser) {
      markMessagesAsRead();
    }
  }, [selectedUser, messages]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();
    
    return channel;
  };

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || "");

      await Promise.all([loadMessages(), loadUsers()]);
    } catch (error: any) {
      toast.error("Error loading data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error("Error loading messages:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name");

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error("Error loading users:", error);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      const unreadMessages = messages.filter(
        m => m.receiver_id === currentUserId && 
             m.sender_id === selectedUser && 
             !m.read
      );

      if (unreadMessages.length > 0) {
        await supabase
          .from("messages")
          .update({ read: true })
          .in("id", unreadMessages.map(m => m.id));
      }
    } catch (error: any) {
      console.error("Error marking messages as read:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) {
      toast.error("Please enter a message and select a recipient");
      return;
    }

    try {
      const { error } = await supabase
        .from("messages")
        .insert([{
          sender_id: currentUserId,
          receiver_id: selectedUser,
          message: newMessage,
        }]);

      if (error) throw error;
      toast.success("Message sent successfully");
      setNewMessage("");
      loadMessages();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getConversationMessages = () => {
    if (!selectedUser) return [];
    return messages.filter(
      m => (m.sender_id === currentUserId && m.receiver_id === selectedUser) ||
           (m.sender_id === selectedUser && m.receiver_id === currentUserId)
    ).reverse();
  };

  const getUnreadCount = (userId: string) => {
    return messages.filter(
      m => m.sender_id === userId && m.receiver_id === currentUserId && !m.read
    ).length;
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.full_name || "Unknown";
  };

  const conversationPartners = Array.from(
    new Set(
      messages.map(m => 
        m.sender_id === currentUserId ? m.receiver_id : m.sender_id
      )
    )
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
      <Card className="md:col-span-1">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Conversations</CardTitle>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[480px]">
            <div className="space-y-2">
              {conversationPartners.map((userId) => {
                const unreadCount = getUnreadCount(userId);
                return (
                  <Button
                    key={userId}
                    variant={selectedUser === userId ? "default" : "ghost"}
                    className="w-full justify-between"
                    onClick={() => setSelectedUser(userId)}
                  >
                    <span>{getUserName(userId)}</span>
                    {unreadCount > 0 && (
                      <span className="bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>
            {selectedUser ? `Chat with ${getUserName(selectedUser)}` : "Select a conversation"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedUser ? (
            <div className="space-y-4">
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                <div className="space-y-4">
                  {getConversationMessages().map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.sender_id === currentUserId
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[480px] text-muted-foreground">
              Select a conversation to start messaging
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
            <DialogDescription>Start a conversation with a user</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Recipient</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.filter(u => u.id !== currentUserId).map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              handleSendMessage();
              setDialogOpen(false);
            }}>
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
