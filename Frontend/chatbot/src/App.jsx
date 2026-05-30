import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const BOT_NAME = "Merchant";
const API_URL = "http://127.0.0.1:8000/query";

// ── Typing dots ──────────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-[#39FF14]"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

// ── Streaming text (token-by-token illusion) ─────────────────────────────────
function StreamingText({ text, onComplete }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed("");
    setDone(false);
    const scheduleNext = () => {
      if (indexRef.current >= text.length) {
        setDone(true);
        onComplete?.();
        return;
      }
      const chunkSize = Math.random() > 0.85 ? 3 : 1;
      const chunk = text.slice(indexRef.current, indexRef.current + chunkSize);
      indexRef.current += chunkSize;
      setDisplayed((prev) => prev + chunk);
      const delay = 16 + (Math.random() > 0.9 ? Math.random() * 80 : 0);
      setTimeout(scheduleNext, delay);
    };
    const t = setTimeout(scheduleNext, 80);
    return () => clearTimeout(t);
  }, [text]);

  const renderText = (raw) =>
    raw.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return (
          <strong key={i} className="text-[#39FF14] font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      return part.split("\n").map((line, j, arr) => (
        <span key={`${i}-${j}`}>
          {line}
          {j < arr.length - 1 && <br />}
        </span>
      ));
    });

  return (
    <span>
      {renderText(displayed)}
      {!done && (
        <motion.span
          className="inline-block w-0.5 h-4 bg-[#39FF14] ml-0.5 align-middle"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        />
      )}
    </span>
  );
}

// ── Render bold markdown inside static text ──────────────────────────────────
function RichText({ text, isBot }) {
  return (
    <span className="whitespace-pre-wrap">
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong
            key={i}
            className={isBot ? "text-[#39FF14] font-semibold" : "font-bold"}
          >
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

// ── Single chat bubble ───────────────────────────────────────────────────────
function Message({ msg, isLast }) {
  const isBot = msg.role === "bot";
  const isError = msg.role === "error";

  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-3 justify-start"
      >
        {/* Error avatar */}
        <div className="flex-shrink-0 mt-1 w-8 h-8 rounded-full bg-[#3a1010] border border-[#6a2020] flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="#ff4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="max-w-[72%]">
          <p className="text-[10px] font-bold tracking-[0.2em] text-[#ff4444] uppercase mb-1.5 ml-1">
            Error
          </p>
          <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[#1a0a0a] border border-[#4a1a1a] text-[#ffaaaa] text-sm leading-relaxed">
            {msg.text}
          </div>
          <p className="text-[10px] text-[#402020] mt-1 ml-1">{msg.time}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`flex gap-3 ${isBot ? "justify-start" : "justify-end"} group`}
    >
      {/* Bot avatar */}
      {isBot && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 rounded-full bg-[#39FF14] flex items-center justify-center shadow-[0_0_12px_rgba(57,255,20,0.45)]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 3h18v2H3V3zm0 4h18v2H3V7zm0 4h12v2H3v-2zm0 4h12v2H3v-2zm14 0l3 3-3 3v-6z"
                fill="#000"
              />
            </svg>
          </div>
        </div>
      )}

      <div className={`max-w-[72%] ${isBot ? "" : "order-first"}`}>
        {isBot && (
          <p className="text-[10px] font-bold tracking-[0.2em] text-[#39FF14] uppercase mb-1.5 ml-1">
            {BOT_NAME}
          </p>
        )}

        <div
          className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isBot
              ? "bg-[#111a11] border border-[#1c371c] text-[#c8ecc8] rounded-tl-sm"
              : "bg-[#39FF14] text-black font-medium rounded-tr-sm shadow-[0_0_18px_rgba(57,255,20,0.28)]"
          }`}
        >
          {isBot && isLast && msg.streaming ? (
            <StreamingText text={msg.text} />
          ) : (
            <RichText text={msg.text} isBot={isBot} />
          )}
        </div>

        <p className="text-[10px] text-[#274027] mt-1 ml-1">{msg.time}</p>
      </div>

      {/* User avatar */}
      {!isBot && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 rounded-full bg-[#182018] border border-[#253525] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"
                fill="#39FF14"
              />
            </svg>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Quick action card ────────────────────────────────────────────────────────
function QuickAction({ icon, label, sublabel, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#1c371c] bg-[#0c160c] hover:border-[#39FF14]/40 hover:bg-[#111a11] transition-all duration-200 text-left group"
    >
      <div className="w-8 h-8 rounded-lg bg-[#162016] border border-[#1c371c] flex items-center justify-center flex-shrink-0 group-hover:border-[#39FF14]/50 group-hover:bg-[#1a2a1a] transition-all">
        <span className="text-base">{icon}</span>
      </div>
      <div>
        <p className="text-[#b0d8b0] text-xs font-semibold leading-none mb-0.5">
          {label}
        </p>
        <p className="text-[#3a5a3a] text-[10px] leading-none">{sublabel}</p>
      </div>
    </motion.button>
  );
}

function formatTime(d) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ChatbotUI() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "bot",
      text: "Hello! I'm **Merchant**, your intelligent commerce assistant. Ask me anything about your products, inventory, or FAQs — I'm connected to your backend and ready to help.",
      time: formatTime(new Date()),
      streaming: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Core: send message → hit API → stream response ──────────────────────
  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isTyping) return;

    // 1. Append user bubble
    const userMsg = {
      id: Date.now(),
      role: "user",
      text: trimmed,
      time: formatTime(new Date()),
      streaming: false,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "44px";
    setIsTyping(true);

    try {
      // 2. POST to backend — body: { question: "..." }
      const { data } = await axios.post(API_URL, { question: trimmed });

      // 3. Extract answer — handles { query, answer } or { question, answer }
      //    or a plain string response. Adjust keys to match your API contract.
      const answerText =
        data?.answer ||
        data?.response ||
        data?.reply ||
        (typeof data === "string" ? data : JSON.stringify(data));

      const botMsg = {
        id: Date.now() + 1,
        role: "bot",
        text: answerText,
        time: formatTime(new Date()),
        streaming: true,   // triggers StreamingText animation
      };
      setIsTyping(false);
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      // 4. Surface a styled error bubble instead of a silent failure
      const status = err?.response?.status;
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Unknown error";

      const errMsg = {
        id: Date.now() + 2,
        role: "error",
        text: status
          ? `Server responded with ${status}: ${detail}`
          : `Could not reach the server. Make sure the backend is running at ${API_URL}.\n\nDetails: ${detail}`,
        time: formatTime(new Date()),
        streaming: false,
      };
      setIsTyping(false);
      setMessages((prev) => [...prev, errMsg]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "44px";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  };

  const showSuggestions = messages.length === 1;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-[#070f07] font-sans antialiased overflow-hidden">
      {/* Grid texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(#39FF14 1px, transparent 1px), linear-gradient(90deg, #39FF14 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />
      {/* Glow orbs */}
      <div className="fixed top-[-10%] left-[20%] w-[500px] h-[500px] bg-[#39FF14] rounded-full blur-[220px] opacity-[0.03] pointer-events-none" />
      <div className="fixed bottom-[10%] right-[10%] w-[340px] h-[340px] bg-[#00dd0a] rounded-full blur-[180px] opacity-[0.035] pointer-events-none" />

      {/* ── Header ── */}
      <motion.header
        initial={{ y: -56, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-[#112211] bg-[#070f07]/85 backdrop-blur-xl"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-[#39FF14] flex items-center justify-center shadow-[0_0_22px_rgba(57,255,20,0.38)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
                  stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                />
                <line x1="3" y1="6" x2="21" y2="6" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                <path d="M16 10a4 4 0 01-8 0" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <motion.span
              className="absolute -top-1 -right-1 w-3 h-3 bg-[#39FF14] rounded-full border-2 border-[#070f07]"
              animate={{
                boxShadow: [
                  "0 0 4px rgba(57,255,20,0.6)",
                  "0 0 10px rgba(57,255,20,1)",
                  "0 0 4px rgba(57,255,20,0.6)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight leading-none">
              Merchant
            </h1>
            <p className="text-[#39FF14] text-[10px] font-medium tracking-[0.18em] uppercase mt-0.5">
              Commerce Assistant · Online
            </p>
          </div>
        </div>

        {/* Endpoint badge */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0c160c] border border-[#1c371c]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-pulse" />
            <span className="text-[10px] text-[#3a6a3a] font-mono tracking-wide">
              {API_URL.replace("http://", "")}
            </span>
          </div>
          {[
            { icon: "ti-refresh", label: "Refresh" },
            { icon: "ti-settings", label: "Settings" },
          ].map(({ icon, label }, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.93 }}
              aria-label={label}
              className="w-8 h-8 rounded-lg border border-[#1c371c] bg-[#0c160c] flex items-center justify-center text-[#2d5a2d] hover:text-[#39FF14] hover:border-[#39FF14]/50 hover:bg-[#111a11] transition-all duration-200"
            >
              <i className={`ti ${icon}`} style={{ fontSize: 14 }} />
            </motion.button>
          ))}
        </div>
      </motion.header>

      {/* ── Messages ── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-6 space-y-5 relative z-10"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#1c371c #070f07" }}
      >
        <AnimatePresence>
          {messages.map((msg, i) => (
            <Message key={msg.id} msg={msg} isLast={i === messages.length - 1} />
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-[#39FF14] flex items-center justify-center shadow-[0_0_12px_rgba(57,255,20,0.45)] flex-shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 3h18v2H3V3zm0 4h18v2H3V7zm0 4h12v2H3v-2zm0 4h12v2H3v-2zm14 0l3 3-3 3v-6z"
                    fill="#000"
                  />
                </svg>
              </div>
              <div className="bg-[#111a11] border border-[#1c371c] rounded-2xl rounded-tl-sm px-1">
                <TypingIndicator />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick actions — visible only on first load */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="ml-11 mt-4"
            >
              <p className="text-[10px] font-bold tracking-[0.22em] text-[#2d5a2d] uppercase mb-3">
                Quick Actions
              </p>
              <div className="grid grid-cols-2 gap-2 max-w-sm">
                <QuickAction
                  icon="🛍️"
                  label="Fetch New Products"
                  sublabel="Browse latest inventory"
                  onClick={() => sendMessage("Try fetching new products")}
                />
                <QuickAction
                  icon="🔍"
                  label="Product Enquiry"
                  sublabel="Check stock & details"
                  onClick={() => sendMessage("Ask product enquiry")}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative z-10 px-4 pb-5 pt-3 border-t border-[#112211] bg-[#070f07]/90 backdrop-blur-xl"
      >
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2 bg-[#0c160c] border border-[#1c371c] rounded-2xl p-2 transition-all duration-300 focus-within:border-[#39FF14]/45 focus-within:shadow-[0_0_24px_rgba(57,255,20,0.07)]">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0 mb-1 w-8 h-8 rounded-lg flex items-center justify-center text-[#2d5a2d] hover:text-[#39FF14] hover:bg-[#111a11] transition-colors"
            >
              <i className="ti ti-paperclip" style={{ fontSize: 16 }} />
            </motion.button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask Merchant anything about your products..."
              rows={1}
              className="flex-1 bg-transparent text-[#c8ecc8] placeholder-[#1e3e1e] text-sm resize-none outline-none py-2 px-1 leading-relaxed min-h-[44px] max-h-[140px]"
              style={{ scrollbarWidth: "none" }}
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              className={`flex-shrink-0 mb-1 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                input.trim() && !isTyping
                  ? "bg-[#39FF14] text-black shadow-[0_0_16px_rgba(57,255,20,0.38)] hover:shadow-[0_0_26px_rgba(57,255,20,0.6)] hover:bg-[#50ff30]"
                  : "bg-[#0f1f0f] text-[#1c3a1c] cursor-not-allowed"
              }`}
            >
              {isTyping ? (
                <motion.span
                  className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </motion.button>
          </div>

          <p className="text-center text-[10px] text-[#172d17] mt-2.5 tracking-wide">
            Press{" "}
            <kbd className="px-1 py-0.5 rounded bg-[#0f1f0f] border border-[#1c371c] text-[#2d5a2d] font-mono text-[9px]">
              Enter
            </kbd>{" "}
            to send &nbsp;·&nbsp;{" "}
            <kbd className="px-1 py-0.5 rounded bg-[#0f1f0f] border border-[#1c371c] text-[#2d5a2d] font-mono text-[9px]">
              Shift+Enter
            </kbd>{" "}
            for new line
          </p>
        </div>
      </motion.div>
    </div>
  );
}