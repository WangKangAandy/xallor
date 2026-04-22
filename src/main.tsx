import { createRoot } from "react-dom/client";
import App from "./app/App";
import { initColorScheme } from "./app/theme/initColorScheme";
import "./styles/index.css";

initColorScheme();
createRoot(document.getElementById("root")!).render(<App />);
