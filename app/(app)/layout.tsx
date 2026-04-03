import Header from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-stone-900">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
