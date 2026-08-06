import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function HistorySidebar({ open, onClose, onSelect, refreshKey }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    fetch("/api/documents")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, refreshKey]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.scrim}
          />
          <motion.aside
            key="panel"
            className="glass"
            initial={{ x: -360 }}
            animate={{ x: 0 }}
            exit={{ x: -360 }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            style={styles.panel}
          >
            <div style={styles.header}>
              <h3 style={styles.title}>Scan history</h3>
              <button onClick={onClose} style={styles.closeBtn} aria-label="Close history">
                ✕
              </button>
            </div>
            <p style={styles.subtitle}>Stored in MongoDB — persists across restarts.</p>

            {loading && <div style={styles.empty}>Loading…</div>}
            {!loading && items.length === 0 && (
              <div style={styles.empty}>No scans yet. Upload a document to get started.</div>
            )}

            <ul style={styles.list}>
              {items.map((item, i) => (
                <motion.li
                  key={item.document_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => onSelect(item.document_id)}
                  style={styles.item}
                  whileHover={{ x: 4, backgroundColor: "rgba(47,158,143,0.08)" }}
                >
                  <div style={styles.itemName}>{item.filename}</div>
                  <div style={styles.itemMeta}>
                    {item.page_count} page{item.page_count !== 1 ? "s" : ""}
                    {item.document_type ? ` · ${item.document_type}` : ""}
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

const styles = {
  scrim: {
    position: "fixed",
    inset: 0,
    background: "rgba(18,23,43,0.25)",
    zIndex: 30,
  },
  panel: {
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    width: 320,
    zIndex: 31,
    padding: "28px 22px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "8px 0 40px rgba(18,23,43,0.12)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontFamily: "var(--font-display)",
    fontSize: 20,
    margin: 0,
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: 16,
    color: "#8b8577",
  },
  subtitle: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "#8b8577",
    marginTop: 6,
    marginBottom: 20,
  },
  empty: {
    fontSize: 13,
    color: "#8b8577",
    marginTop: 20,
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    overflowY: "auto",
    flex: 1,
  },
  item: {
    padding: "12px 10px",
    borderRadius: 8,
    cursor: "pointer",
    marginBottom: 4,
  },
  itemName: {
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 2,
    wordBreak: "break-all",
  },
  itemMeta: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "#8b8577",
  },
};
