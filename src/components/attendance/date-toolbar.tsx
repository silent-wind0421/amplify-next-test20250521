import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

type Props = {
  title?: string;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  calendarMonth: Date;
  setCalendarMonth: (d: Date) => void;
  open: boolean;
  setOpen: (b: boolean) => void;
};

export default function DateToolbar({
  title = "通所実績管理",
  selectedDate,
  onSelectDate,
  calendarMonth,
  setCalendarMonth,
  open,
  setOpen,
}: Props) {
  const formatted = format(selectedDate, "yyyy年MM月dd日(E)", { locale: ja });

  return (
    <CardHeader className="flex flex-row items-center justify-between bg-blue-500 py-3 text-white">
      <CardTitle className="text-lg font-bold">{title}</CardTitle>
      <div className="flex items-center rounded bg-white/20 overflow-hidden">
        <div
          className="px-3 py-1 text-white cursor-text hover:bg-white/10 transition-colors text-sm"
          onClick={() => setOpen(true)}
        >
          {formatted}
        </div>
        <Popover
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (o) setCalendarMonth(selectedDate);
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/30 rounded-none"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              locale={ja}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              formatters={{
                formatCaption: (d) => format(d, "yyyy年M月", { locale: ja }),
              }}
              onSelect={(d: Date | undefined) => {
                //  型付け
                if (d) {
                  onSelectDate(d); //  親へ通知
                  setCalendarMonth(d);
                  setOpen(false);
                }
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </CardHeader>
  );
}
