import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { HomePage } from "./pages/HomePage.js";
import { GmDashboardPage } from "./pages/GmDashboardPage.js";
import { RoomPage } from "./pages/RoomPage.js";
import { ToastContainer } from "./components/ui/Toast.js";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/gm" element={<GmDashboardPage />} />
        <Route path="/room/:code" element={<RoomPage />} />
      </Routes>
    </BrowserRouter>
    <ToastContainer />
  </StrictMode>,
);
