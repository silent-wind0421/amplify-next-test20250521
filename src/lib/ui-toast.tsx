// src/lib/ui-toast.tsx
import { toast } from "sonner";
import { Message } from "@/components/common/message";

export const successToast = (desc: string) =>
  toast(Message.IA000004, { description: desc });

export const errorToast = () =>
  toast(
    <div>
      <div className="font-bold text-destructive"> {Message.EF050021} </div>
      <div className="text-sm text-muted-foreground"> {Message.EF050020} </div>
    </div>,
    {
      icon: "❌",
      className: "bg-destructive text-destructive-foreground",
      duration: 5000,
    }
  );
