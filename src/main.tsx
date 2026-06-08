import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initAppSettings } from "./hooks/useAppSettings";

initAppSettings();

createRoot(document.getElementById("root")!).render(<App />);
