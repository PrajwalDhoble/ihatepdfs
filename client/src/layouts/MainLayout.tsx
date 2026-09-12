import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import AdSlot from "@/components/AdSlot";

export default function MainLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="sidebar-main">
        <div className="container" style={{ paddingTop: "var(--space-3)" }}>
          <AdSlot placement="below-nav" />
        </div>
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
