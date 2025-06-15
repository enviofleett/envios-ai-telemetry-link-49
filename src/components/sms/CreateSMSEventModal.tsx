
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { smsService } from "@/services/smsService";

interface CreateEventFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onEventCreated: () => void;
}

const CreateSMSEventModal: React.FC<CreateEventFormProps> = ({ open, setOpen, onEventCreated }) => {
  const [recipientPhone, setRecipientPhone] = useState("");
  const [message, setMessage] = useState("");
  const [eventType, setEventType] = useState("CUSTOM");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isValidPhone = smsService.validatePhoneNumber(recipientPhone);
      if (!isValidPhone) {
        toast({
          title: "Invalid Phone Number",
          description: "Please enter a valid phone number.",
          variant: "destructive",
        });
        return;
      }

      const formattedPhoneNumber = smsService.formatPhoneNumber(recipientPhone);
      await smsService.sendSMS(formattedPhoneNumber, message, eventType);
      toast({
        title: "Success",
        description: "SMS event created successfully.",
      });
      onEventCreated();
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create SMS event.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create SMS Event</DialogTitle>
          <DialogDescription>Create a new SMS event to send.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="recipientPhone">Recipient Phone</Label>
            <Input
              type="tel"
              id="recipientPhone"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="Recipient Phone"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="message">Message</Label>
            <Input
              type="text"
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eventType">Event Type</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CUSTOM">Custom</SelectItem>
                <SelectItem value="NOTIFICATION">Notification</SelectItem>
                <SelectItem value="REMINDER">Reminder</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSMSEventModal;
