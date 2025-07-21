"use client";

// import { Authenticator } from "@aws-amplify/ui-react";  modified by yoshida
// import { signOut } from "aws-amplify/auth"; // これが重要 modified by yoshida
import AttendanceManagement from "@/components/attendance-management";
import { SeedButton } from "@/components/seed-button";

export default function AttendancePage() {
  return (
   
      
        <div className="space-y-4">
          

          {process.env.NEXT_PUBLIC_SHOW_SEED_BUTTON === "true" && (
            <div className="flex justify-end">
              <SeedButton />
            </div>
          )}

          <AttendanceManagement />
        </div>
    
  );
}
