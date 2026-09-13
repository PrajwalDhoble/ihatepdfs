import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

export default function MainLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="sidebar-main">
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
