import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

const AI_TABS = [
  { key: "summary", label: "Summarize" },
  { key: "classify", label: "Classify" },
  { key: "ask", label: "Ask" },
  { key: "translate", label: "Translate" },
];

export default function ResultPanel({ result, status, error, setResult }) {
  const [activePage, setActivePage] = useState(0);
  const [aiTab, setAiTab] = useState(null);
  const [question, setQuestion] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("Spanish");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState(null);

  if (status === "idle") {
    return (
      <section style={styles.panel}>
        <motion.div
          style={styles.empty}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            style={styles.emptyGlyph}
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            ▧
          </motion.div>
          <p style={styles.emptyText}>Extracted text will appear here once you scan a document.</p>
        </motion.div>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section style={styles.panel}>
        <motion.div
          style={styles.empty}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <p style={{ ...styles.emptyText, color: "var(--red-500)" }}>
            {error || "Something went wrong."}
          </p>
        </motion.div>
      </section>
    );
  }

  if (status === "scanning" || !result) {
    return (
      <section style={styles.panel}>
        <div style={styles.skeletonWrap}>
          <div className="shimmer" style={styles.skeletonLine(70)} />
          <div className="shimmer" style={styles.skeletonLine(40)} />
          <div style={{ height: 20 }} />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="shimmer" style={styles.skeletonLine(90 - i * 4)} />
          ))}
        </div>
      </section>
    );
  }

  const page = result.pages[activePage];

  async function callAi(path, body) {
    setAiLoading(true);
    setAiAnswer(null);
    try {
      const res = await fetch(`/api/documents/${result.document_id}/${path}`, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed");
      return data;
    } catch (err) {
      toast.error(err.message);
      throw err;
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSummarize() {
    try {
      const data = await callAi("summarize");
      setAiAnswer(data.summary);
      setResult((r) => ({ ...r, summary: data.summary }));
      toast.success("Summary ready");
    } catch {}
  }

  async function handleClassify() {
    try {
      const data = await callAi("classify");
      setAiAnswer(`Document type: ${data.document_type}`);
      setResult((r) => ({ ...r, document_type: data.document_type }));
      toast.success("Classified");
    } catch {}
  }

  async function handleAsk() {
    if (!question.trim()) return;
    try {
      const data = await callAi("ask", { question });
      setAiAnswer(data.answer);
    } catch {}
  }

  async function handleTranslate() {
    try {
      const data = await callAi("translate", { target_language: targetLanguage });
      setAiAnswer(data.translated_text);
      toast.success(`Translated to ${targetLanguage}`);
    } catch {}
  }

  return (
    <section style={styles.panel}>
      <motion.div
        style={styles.resultHeader}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 style={styles.heading}>{result.filename}</h2>
          <span style={styles.meta}>
            {result.page_count} page{result.page_count !== 1 ? "s" : ""}
            {page.confidence != null && ` · ${Math.round(page.confidence)}% confidence`}
            {result.document_type && ` · ${result.document_type}`}
          </span>
        </div>
        <div style={styles.exportRow}>
          {["json", "csv", "xlsx"].map((fmt) => (
            <motion.a
              key={fmt}
              href={`/api/documents/${result.document_id}/export/${fmt}`}
              style={styles.exportBtn}
              whileHover={{ y: -2, borderColor: "var(--teal-500)", color: "var(--teal-600)" }}
              whileTap={{ scale: 0.96 }}
            >
              {fmt.toUpperCase()}
            </motion.a>
          ))}
        </div>
      </motion.div>

      {result.page_count > 1 && (
        <div style={styles.tabs}>
          {result.pages.map((p, i) => (
            <button
              key={p.page_number}
              onClick={() => setActivePage(i)}
              style={{
                ...styles.tab,
                ...(i === activePage ? styles.tabActive : {}),
              }}
            >
              {p.page_number}
            </button>
          ))}
        </div>
      )}

      <div style={styles.body}>
        <pre style={styles.textOutput}>{page.text || "(no text detected on this page)"}</pre>

        <div style={styles.aiPanel}>
          <div style={styles.aiTabs}>
            {AI_TABS.map((t) => (
              <motion.button
                key={t.key}
                onClick={() => {
                  setAiTab(aiTab === t.key ? null : t.key);
                  setAiAnswer(null);
                }}
                style={{
                  ...styles.aiTabBtn,
                  ...(aiTab === t.key ? styles.aiTabBtnActive : {}),
                }}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
              >
                {t.label}
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {aiTab && (
              <motion.div
                key={aiTab}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
                style={styles.aiBody}
              >
                {aiTab === "summary" && (
                  <button style={styles.aiAction} onClick={handleSummarize} disabled={aiLoading}>
                    {aiLoading ? "Summarizing…" : "Generate summary with Ollama"}
                  </button>
                )}
                {aiTab === "classify" && (
                  <button style={styles.aiAction} onClick={handleClassify} disabled={aiLoading}>
                    {aiLoading ? "Classifying…" : "Classify document with Ollama"}
                  </button>
                )}
                {aiTab === "ask" && (
                  <div style={styles.aiRow}>
                    <input
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Ask a question about this document…"
                      style={styles.aiInput}
                      onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                    />
                    <button style={styles.aiAction} onClick={handleAsk} disabled={aiLoading}>
                      {aiLoading ? "Thinking…" : "Ask"}
                    </button>
                  </div>
                )}
                {aiTab === "translate" && (
                  <div style={styles.aiRow}>
                    <input
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                      placeholder="Target language"
                      style={styles.aiInput}
                    />
                    <button style={styles.aiAction} onClick={handleTranslate} disabled={aiLoading}>
                      {aiLoading ? "Translating…" : "Translate"}
                    </button>
                  </div>
                )}

                <AnimatePresence>
                  {aiAnswer && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={styles.aiAnswer}
                    >
                      {aiAnswer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

const styles = {
  panel: {
    background: "var(--paper-50)",
    padding: "32px 36px",
    display: "flex",
    flexDirection: "column",
  },
  empty: {
    margin: "auto",
    textAlign: "center",
    maxWidth: 280,
  },
  emptyGlyph: {
    fontSize: 30,
    color: "var(--teal-500)",
    marginBottom: 10,
  },
  emptyText: {
    color: "#8b8577",
    fontSize: 14,
  },
  skeletonWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 8,
  },
  skeletonLine: (widthPct) => ({
    height: 12,
    borderRadius: 6,
    width: `${widthPct}%`,
  }),
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  heading: {
    fontFamily: "var(--font-display)",
    fontSize: 20,
    fontWeight: 600,
    margin: "0 0 4px",
  },
  meta: {
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    color: "#8b8577",
  },
  exportRow: { display: "flex", gap: 8 },
  exportBtn: {
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    textDecoration: "none",
    color: "var(--ink-950)",
    border: "1px solid var(--paper-line)",
    borderRadius: 6,
    padding: "6px 10px",
    display: "inline-block",
  },
  tabs: {
    display: "flex",
    gap: 4,
    marginBottom: 14,
    borderBottom: "1px solid var(--paper-line)",
  },
  tab: {
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    padding: "6px 10px",
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    color: "#8b8577",
  },
  tabActive: {
    color: "var(--teal-600)",
    borderBottomColor: "var(--teal-500)",
  },
  body: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    minHeight: 0,
  },
  textOutput: {
    flex: 1,
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    background: "var(--paper-100)",
    border: "1px solid var(--paper-line)",
    borderRadius: 8,
    padding: 20,
    margin: 0,
    overflow: "auto",
  },
  aiPanel: {
    border: "1px solid var(--paper-line)",
    borderRadius: 10,
    background: "rgba(124,111,224,0.04)",
    overflow: "hidden",
  },
  aiTabs: {
    display: "flex",
    gap: 6,
    padding: 10,
  },
  aiTabBtn: {
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    padding: "6px 12px",
    borderRadius: 999,
    border: "1px solid var(--paper-line)",
    background: "var(--paper-50)",
    color: "#5b5748",
  },
  aiTabBtnActive: {
    background: "var(--violet-500)",
    borderColor: "var(--violet-500)",
    color: "#fff",
  },
  aiBody: {
    padding: "0 14px 14px",
  },
  aiRow: {
    display: "flex",
    gap: 8,
  },
  aiInput: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid var(--paper-line)",
    fontFamily: "var(--font-body)",
    fontSize: 13,
  },
  aiAction: {
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid var(--violet-500)",
    background: "var(--violet-500)",
    color: "#fff",
    fontSize: 12,
    fontFamily: "var(--font-mono)",
  },
  aiAnswer: {
    marginTop: 12,
    padding: "12px 14px",
    borderRadius: 8,
    background: "var(--paper-50)",
    border: "1px solid var(--paper-line)",
    fontSize: 13,
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
  },
};
