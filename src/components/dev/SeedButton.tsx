//src/componemts/dev/SeedButton.tsx
import { seedVisitRecords } from "@/app/attendance/seed";
import { Button } from "@/components/ui/button";

export default function SeedButton() {
    return (
        <Button
            onClick={async () => {
                await seedVisitRecords();
                alert("初期データを登録しました！");
            }}
        >
            初期データ登録
        </Button>
    );
}
