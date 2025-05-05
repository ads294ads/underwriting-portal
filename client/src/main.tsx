import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
Chart.register(ArcElement, Tooltip, Legend);

createRoot(document.getElementById("root")!).render(<App />);
