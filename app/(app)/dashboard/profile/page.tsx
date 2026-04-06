import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AgentSidebar } from "@/components/AgentSidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
     title: "Profile & Settings | Rezoomind",
     description: "Manage your personalized career profile",
};

export default async function ProfilePage() {
     const session = await getServerSession(authOptions);

     if (!session) {
          redirect("/login?next=/dashboard/profile");
     }

     return (
          <div className="mx-auto max-w-5xl px-4 py-8">
               <div className="h-[80vh] border border-stone-800 overflow-hidden">
                    <AgentSidebar />
               </div>
          </div>
     );
}
