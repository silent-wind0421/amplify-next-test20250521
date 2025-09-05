// src/components/attendance/NoteDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  open: boolean;
  userName: string;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  onSave: () => void | Promise<void>;
  onFocus?: () => void;
  onBlur?: () => void;
};

export default function NoteDialog({
  open,
  userName,
  value,
  onChange,
  onClose,
  onSave,
  onFocus,
  onBlur,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>備考の編集</DialogTitle>
          <DialogDescription>
            {userName}さんの備考を入力してください
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="備考を入力"
            className="min-h-[100px]"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={onSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
