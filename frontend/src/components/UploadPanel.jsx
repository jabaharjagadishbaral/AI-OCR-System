import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

export default function UploadPanel({ status, setStatus, setResult, setError, onUploaded }) {
  const [dragOver, setDragOver] = useState(false);
  const [filename, setFilename] = useState(null);
  const inputRef = useRef(null);

  const upload = useCallback(
    async (file) => {
      if (!file) return;
      setFilename(file.name);
      setStatus("scanning");
      setError(null);

      const form = new FormData();
      form.append("file", file);

      try {
        const res = await fetch("/api/documents/upload", { method: "POST", body: form });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Upload failed (${res.status})`);
        }
        const data = await res.json();
        setResult(data);
        setStatus("done");
        toast.success(`${file.name} scanned successfully`);
        onUploaded?.();
      } catch (err) {
        setError(err.message);
        setStatus("error");
        toast.error(err.message);
      }
    },
    [setStatus, setResult, setError, onUploaded]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    upload(e.dataTransfer.files?.[0]);
  };

  const scanning = status === "scanning";
  const done = status === "done";

  return (
    <motion.section
      style={styles.panel}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45 }}
    >
      <h2 style={styles.heading}>Scan a document</h2>
      <p style={styles.copy}>
        PDF or image. Extracted by a Python/Tesseract microservice, then stored
        in MongoDB for history and AI features.
      </p>

      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        animate={{
          borderColor: dragOver ? "var(--teal-500)" : "var(--paper-line)",
          background: dragOver ? "#eef7f5" : "var(--paper-100)",
          scale: dragOver ? 1.015 : 1,
        }}
        transition={{ duration: 0.18 }}
        style={styles.bed}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp,.webp"
          style={{ display: "none" }}
          onChange={(e) => upload(e.target.files?.[0])}
        />

        {scanning && <div style={styles.scanLine} />}

        <AnimatePresence mode="wait">
          <motion.div
            key={filename ? filename + status : "empty"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            style={styles.bedContent}
          >
            {filename ? (
              <>
                <motion.div
                  animate={done ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.4 }}
                  style={styles.statusGlyph}
                >
                  {scanning ? "◐" : status === "error" ? "⚠" : "✓"}
                </motion.div>
                <div style={styles.filenameMono}>{filename}</div>
                <div style={styles.hint}>
                  {scanning
                    ? "Reading text…"
                    : status === "error"
                    ? "Failed — click to retry"
                    : "Click or drop to replace"}
                </div>
              </>
            ) : (
              <>
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  style={styles.dropIcon}
                >
                  ⇩
                </motion.div>
                <div style={styles.hint}>Drop a file here, or click to browse</div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <dl style={styles.specs}>
        <div style={styles.specRow}>
          <dt>Accepted</dt>
          <dd>PDF, PNG, JPG, TIFF, BMP, WEBP</dd>
        </div>
        <div style={styles.specRow}>
          <dt>OCR engine</dt>
          <dd>Tesseract (FastAPI / Hypercorn)</dd>
        </div>
        <div style={styles.specRow}>
          <dt>AI engine</dt>
          <dd>Ollama (local LLM)</dd>
        </div>
        <div style={styles.specRow}>
          <dt>Storage</dt>
          <dd>MongoDB</dd>
        </div>
        <div style={styles.specRow}>
          <dt>Limit</dt>
          <dd>25 MB</dd>
        </div>
      </dl>
    </motion.section>
  );
}

const styles = {
  panel: {
    background: "var(--paper-50)",
    padding: "32px 36px",
  },
  heading: {
    fontFamily: "var(--font-display)",
    fontSize: 22,
    fontWeight: 600,
    margin: "0 0 6px",
  },
  copy: {
    margin: "0 0 24px",
    color: "#5b5748",
    fontSize: 14,
    lineHeight: 1.5,
  },
  bed: {
    position: "relative",
    overflow: "hidden",
    border: "1.5px dashed var(--paper-line)",
    borderRadius: 10,
    height: 220,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  bedContent: {
    textAlign: "center",
    padding: "0 20px",
  },
  statusGlyph: {
    fontSize: 22,
    color: "var(--teal-600)",
    marginBottom: 6,
  },
  dropIcon: {
    fontSize: 26,
    color: "var(--teal-600)",
    marginBottom: 10,
  },
  filenameMono: {
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    marginBottom: 6,
    wordBreak: "break-all",
  },
  hint: {
    fontSize: 13,
    color: "#8b8577",
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    background:
      "linear-gradient(90deg, transparent, var(--teal-500) 20%, var(--teal-500) 80%, transparent)",
    boxShadow: "0 0 12px 2px rgba(47,158,143,0.6)",
    animation: "sweep 1.6s ease-in-out infinite",
  },
  specs: {
    marginTop: 28,
    fontSize: 13,
  },
  specRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderTop: "1px solid var(--paper-line)",
    color: "#5b5748",
  },
};
