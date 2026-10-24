import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SessionProvider } from "@/admin/session";
import Dashboard from "@/admin/Dashboard";
import Login from "@/admin/Login";
import Profile from "@/admin/Profile";
import { SiteLayout } from "@/components/SiteLayout";
import { Toaster } from "@/components/ui/sonner";
import AttractionDetail from "@/pages/AttractionDetail";
import Attractions from "@/pages/Attractions";
import Events from "@/pages/Events";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import Safety from "@/pages/Safety";

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<Home />} />
            <Route path="atracoes" element={<Attractions />} />
            <Route path="atracoes/:slug" element={<AttractionDetail />} />
            <Route path="eventos" element={<Events />} />
            <Route path="seguranca" element={<Safety />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/conta" element={<Profile />} />
        </Routes>
        <Toaster richColors position="top-right" />
      </SessionProvider>
    </BrowserRouter>
  );
}
