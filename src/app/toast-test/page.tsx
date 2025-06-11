// src/app/toast-test/page.tsx
"use client";

import { Toaster, toast } from "sonner";

export default function ToastTestPage() {
    return (
        <div className="p-10 space-y-4">
            <h1 className="text-xl font-bold">トースト表示テスト</h1>

            <button
                onClick={() =>
                    toast("トースト表示テスト", {
                        description: "これは表示されるはずです",
                        duration: 5000,
                    })
                }
                className="px-4 py-2 bg-blue-600 text-white rounded"
            >
                トーストを表示
            </button>

            <Toaster richColors position="bottom-center" />
        </div>
    );
}
