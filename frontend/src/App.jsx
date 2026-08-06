import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";

import UploadPanel from "./components/UploadPanel.jsx";
import ResultPanel from "./components/ResultPanel.jsx";
import HistorySidebar from "./components/HistorySidebar.jsx";
import ParticleField from "./components/ParticleField.jsx";

export default function App() {
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | scanning | done | error
  const [error, setError] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const bumpHistory = useCallback(() => setHistoryRefresh((n) => n + 1), []);

  const loadFromHistory = useCallback(async (documentId) => {
    setHistoryOpen(false);
    setStatus("scanning");
    try {
      const res = await fetch(`/api/documents/${documentId}`);
      if (!res.ok) throw new Error("Could not load that document");
      const data = await res.json();
      setResult(data);
      setStatus("done");
    } catch (err) {
      setError(err.message);
      setStatus("error");
      toast.error(err.message);
    }
  }, []);

  return (
    <div style={styles.page}>
      <ParticleField />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: "var(--font-body)",
            fontSize: 13,
            background: "var(--ink-950)",
            color: "var(--paper-50)",
            borderRadius: 10,
          },
        }}
      />

      <HistorySidebar
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelect={loadFromHistory}
        refreshKey={historyRefresh}
      />

      <motion.header
        style={styles.header}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div style={styles.headerLeft}>
          <motion.button
            onClick={() => setHistoryOpen(true)}
            style={styles.historyBtn}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            aria-label="Open scan history"
          >
            ☰
          </motion.button>
          <div style={styles.wordmark}>
            <span style={styles.wordmarkMain}>Lumen</span>
            <span style={styles.wordmarkSub}>AI Document Intelligence</span>
          </div>
        </div>
        <nav style={styles.stackTag}>
          <span style={styles.dot} /> MERN + FastAPI (Ollama-powered)
        </nav>
      </motion.header>

      <motion.main
        style={styles.grid}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <UploadPanel
          status={status}
          setStatus={setStatus}
          setResult={setResult}
          setError={setError}
          onUploaded={bumpHistory}
        />
        <ResultPanel result={result} status={status} error={error} setResult={setResult} />
      </motion.main>

      <footer style={styles.footer}>
        OCR runs on a Python/FastAPI microservice (Hypercorn). Everything else —
        storage, history, exports, AI orchestration — runs on Node/Express + MongoDB.
      </footer>
    </div>
  );
}

const styles = {
  page: {
    position: "relative",
    minHeight: "100%",
    display: "flex",
    flexDirection: "column",
    zIndex: 1,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "24px 40px 20px",
    borderBottom: "1px solid var(--paper-line)",
    position: "relative",
    zIndex: 2,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  historyBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    border: "1px solid var(--paper-line)",
    background: "rgba(255,255,255,0.5)",
    fontSize: 16,
  },
  wordmark: { display: "flex", alignItems: "baseline", gap: 12 },
  wordmarkMain: {
    fontFamily: "var(--font-display)",
    fontSize: 28,
    fontWeight: 600,
    letterSpacing: "-0.01em",
  },
  wordmarkSub: {
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  stackTag: {
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    color: "var(--teal-600)",
    border: "1px solid var(--teal-500)",
    borderRadius: 999,
    padding: "4px 14px 4px 10px",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "var(--teal-500)",
    animation: "pulseGlow 2s ease-in-out infinite",
  },
  grid: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "minmax(320px, 420px) 1fr",
    gap: 1,
    background: "var(--paper-line)",
    position: "relative",
    zIndex: 2,
  },
  footer: {
    padding: "14px 40px",
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    color: "#8b8577",
    borderTop: "1px solid var(--paper-line)",
    position: "relative",
    zIndex: 2,
  },
};
