import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
Chart.register(ArcElement, Tooltip, Legend);

// Add global error handling for unhandled rejections
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled promise rejection:', event.reason);
  // Prevent the default handling (which would log to console)
  event.preventDefault();
});

// Improved error handling for React errors
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Failed to find root element");
} else {
  createRoot(rootElement).render(<App />);
}
