import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import * as ToastPrimitive from "@radix-ui/react-toast";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { HomePage } from "./pages/HomePage.js";
import { GmDashboardPage } from "./pages/GmDashboardPage.js";
import { RoomPage } from "./pages/RoomPage.js";
import { ToastContainer } from "./components/ui/Toast.js";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastPrimitive.Provider duration={4000} swipeDirection="right">
      <TooltipPrimitive.Provider delayDuration={400}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/gm" element={<GmDashboardPage />} />
            <Route path="/room/:code" element={<RoomPage />} />
          </Routes>
        </BrowserRouter>
        <ToastContainer />
      </TooltipPrimitive.Provider>
    </ToastPrimitive.Provider>
  </StrictMode>,
);
