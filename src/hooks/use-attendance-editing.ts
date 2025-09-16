import { useState } from "react";

export type EditKind = "arrival" | "departure" | "contract" | "note";
export type EditingState = { id: string; type: EditKind; value?: string | null } | null;

export function useAttendanceEditing() {
    const [editing, setEditing] = useState<EditingState>(null);
    const startEditing = (s: EditingState) => setEditing(s);
    const cancelEditing = () => setEditing(null);
    const setValue = (value: string | null) =>
        setEditing(prev => (prev ? { ...prev, value } : prev));
    return { editing, startEditing, cancelEditing, setValue };
}
