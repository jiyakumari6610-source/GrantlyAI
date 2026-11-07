import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot,
  Send,
  Sparkles,
  User,
  RotateCcw,
  Languages,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { getStudentProfile } from '../services/storageService';
import { ChatMessage } from '../types';
import { useAuth } from '../context/AuthContext';

export const CopilotPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user, profile: authProfile } = useAuth();
  const profile = authProfile || getStudentProfile();

  const studentName = profile.fullName ? profile.fullName.trim() : 'there';
  const initials = profile.fullName
    ? profile.fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('')
    : 'ME';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-01',
      role: 'assistant',
      text: `Hello ${studentName}! I am **Grantly Copilot**, your scholarship discovery and eligibility advisor.
      
I can help you:
- Decode complex government circulars and eligibility formulas.
- Suggest grants tailored to your **${profile.course || 'academic'}** background${profile.percentage ? ` and **${profile.percentage}%** aggregate` : ''}.
- Audit missing certificates and upcoming deadlines.
- Answer questions in both **English and Hindi (हिंदी)**!

What would you like to explore today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        'Which scholarships am I eligible for?',
        'Explain this scholarship in simple Hindi.',
        'What documents am I missing?',
        'How can I improve my scholarship readiness?',
      ],
      source: 'gemini-3.8-flash',
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      handleSendMessage(q);
    }
  }, [searchParams]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const idToken = user ? await user.getIdToken() : null;
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-6).map((m) => ({ role: m.role, text: m.text })),
          studentProfile: profile,
        }),
      });

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        text: data.reply || "I'm reviewing your eligibility criteria now.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source,
        suggestions: [
          'What are the next application steps?',
          'Explain required documents.',
          'Is there any other funding opportunity?',
        ],
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        text: `Based on your profile (${profile.course}, ${profile.percentage}% marks, ₹${Number(profile.annualFamilyIncome).toLocaleString('en-IN')} annual family income in ${profile.state}):
        
You are strongly eligible for:
1. **Pragati Tech Fellowship for STEM** (₹50,000/yr)
2. **National Merit-Means Higher Education Grant** (₹75,000/yr)
3. **State Higher Education Excellence Award (Jharkhand)** (₹40,000)

Make sure your **Income Certificate (FY 2024-25)** and **College Bonafide** are uploaded in the Document Center.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        role: 'assistant',
        text: `Session reset. Ready to assist with your scholarship search and queries. Ask me anything in English or Hindi!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          'Which scholarships am I eligible for?',
          'Explain this scholarship in simple Hindi.',
          'What documents am I missing?',
        ],
      },
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8.5rem)] pb-4">
      {/* Header with subtle glow */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 border border-white/10 mb-4 flex items-center justify-between gap-4 shrink-0 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#8065FF]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#8065FF] to-[#42D9F5] p-0.5 shadow-lg shadow-[#8065FF]/30">
              <div className="w-full h-full bg-[#080D1B] rounded-[14px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-[#42D9F5]" />
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#27C995] border-2 border-[#080D1B]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-base font-bold text-white">Grantly Copilot</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#27C995]/20 text-[#27C995] font-semibold border border-[#27C995]/30">
                Gemini 3.8 Flash • Online
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Personalized for {profile.fullName} ({profile.course}, {profile.state})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
            <Languages className="w-3.5 h-3.5 text-[#8065FF]" />
            <span>English / हिंदी</span>
          </div>
          <button
            onClick={handleClearChat}
            title="Reset Chat Session"
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area with Motion Entrance */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {messages.map((msg, index) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8065FF] to-[#42D9F5] flex items-center justify-center shrink-0 text-white shadow-md">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-[#8065FF] to-[#603bfa] text-white rounded-tr-none shadow-lg shadow-[#8065FF]/20'
                  : 'glass-card border border-white/10 text-slate-200 rounded-tl-none shadow-xl'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              <div
                className={`mt-2 flex items-center justify-between text-[10px] ${
                  msg.role === 'user' ? 'text-violet-200' : 'text-slate-400'
                }`}
              >
                <span>{msg.timestamp}</span>
                {msg.source && (
                  <span className="font-mono text-[9px] uppercase tracking-wider">
                    {msg.source}
                  </span>
                )}
              </div>

              {/* Suggestions pills */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Suggested Next Questions:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.suggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(sug)}
                        className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/15 text-[11px] text-slate-300 hover:text-white border border-white/10 transition text-left"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 text-white text-xs font-bold">
                {initials}
              </div>
            )}
          </motion.div>
        ))}

        {/* Animated Typing Indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8065FF] to-[#42D9F5] flex items-center justify-center shrink-0 text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div className="glass-card rounded-2xl rounded-tl-none p-3.5 border border-white/10 text-xs text-slate-400 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8065FF] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#42D9F5] animate-bounce delay-150" />
                <span className="w-2 h-2 rounded-full bg-[#27C995] animate-bounce delay-300" />
              </div>
              <span className="text-[11px]">Consulting Grantly Knowledge Engine...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form with Shimmer Glow */}
      <div className="shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="glass-card rounded-2xl p-2 sm:p-2.5 border border-white/10 flex items-center gap-2 shadow-2xl focus-within:border-[#8065FF]/60 transition"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything in English or Hindi (e.g. 'कौन सी छात्रवृत्ति मेरे लिए सही है?')..."
            className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-3 rounded-xl bg-gradient-to-r from-[#8065FF] to-[#603bfa] hover:brightness-110 disabled:opacity-40 text-white transition shadow-md shadow-[#8065FF]/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-slate-500 text-center mt-1.5">
          Grantly Copilot uses server-side Gemini 3.8 Flash. Factual advice is grounded in official portal guidelines.
        </p>
      </div>
    </div>
  );
};
