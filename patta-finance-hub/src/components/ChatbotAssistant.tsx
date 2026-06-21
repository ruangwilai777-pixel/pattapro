'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RefreshCw, MessageCircle, AlertCircle, Bot } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatbotAssistantProps {
  financialSummary: any; // Raw report data from API
}

export default function ChatbotAssistant({ financialSummary }: ChatbotAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'ยินดีต้อนรับเจ้า! ยินดีต้อนรับสู่ระบบบัญชีการเงินรวมของแบรนด์ภัทธาและธุรกิจรถวิ่งงานเน้อเจ้า ปี้อยากหื้อน้องนินาช่วยตรวจสอบยอดเงินรวม หรือต้องการแนวทางลดรายจ่ายธุรกิจส่วนไหน สอบถามนินาได้เลยเน้อเจ้า นินาพร้อมอู้จาแนะนำเป็นภาษาเหนือแล้วเจ้า! 🌸'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userText = inputValue.trim();
    setInputValue('');
    setError('');

    // Append user message
    const updatedMessages = [...messages, { role: 'user', content: userText } as ChatMessage];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const response = await fetch('/api/admin-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages,
          financialSummary: financialSummary
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'ไม่สามารถติดต่อถามน้องนินาได้เจ้า');
      }

      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: data.content }
      ]);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลจาก AI');
      // If error occurs, let the user retry
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (confirm('คุณแน่ใจที่จะล้างบทสนทนาทั้งหมดใช่ไหมเจ้า?')) {
      setMessages([
        {
          role: 'assistant',
          content: 'นินาล้างแชทเรียบร้อยแล้วเจ้า! มีสิ่งไหนหื้อนินาตรวจสอบหรือวิเคราะห์วิจัยข้อมูลการเงินรอบนี้ต่อไหมเจ้า อู้มาได้เลยเน้อเจ้า 🌸'
        }
      ]);
      setError('');
    }
  };

  return (
    <div className="glass-panel flex flex-col h-[calc(100vh-14rem)] min-h-[500px] overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)] bg-[rgba(20,18,16,0.3)]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--accent-gold-dark)] to-[var(--accent-gold)] flex items-center justify-center border border-[var(--glass-border-light)] shadow-inner">
              <Bot className="w-5 h-5 text-[var(--bg-primary)]" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[var(--bg-secondary)] animate-pulse"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">น้องนินา AI บัญชีและแผนกลยุทธ์</h3>
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-gold)] animate-pulse" />
            </div>
            <p className="text-[11px] text-[var(--accent-gold)]">ที่ปรึกษาการเงินอัจฉริยะส่วนตัว (อู้คำเมืองเน้อเจ้า)</p>
          </div>
        </div>

        <button 
          onClick={handleClear}
          className="text-xs text-[var(--text-muted)] hover:text-red-400 border border-[var(--glass-border)] hover:border-red-500/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all bg-[rgba(0,0,0,0.15)]"
        >
          <RefreshCw className="w-3 h-3" />
          <span>ล้างแชท</span>
        </button>
      </div>

      {/* Messages Scroll Port */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`max-w-[80%] flex flex-col gap-1 ${
              msg.role === 'user' ? 'self-end' : 'self-start'
            }`}
          >
            <span className={`text-[10px] text-[var(--text-muted)] px-1 ${
              msg.role === 'user' ? 'text-right' : 'text-left'
            }`}>
              {msg.role === 'user' ? 'คุณ (เจ้าของธุรกิจ)' : 'น้องนินา'}
            </span>
            <div 
              className={`p-3.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user' 
                  ? 'chat-bubble-user text-[var(--text-primary)]' 
                  : 'chat-bubble-assistant text-[var(--text-primary)] shadow-md'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="self-start max-w-[80%] flex flex-col gap-1">
            <span className="text-[10px] text-[var(--text-muted)] px-1">น้องนินากำลังคำนวณ...</span>
            <div className="chat-bubble-assistant p-4 text-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-gold)] animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 rounded-full bg-[var(--accent-gold)] animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 rounded-full bg-[var(--accent-gold)] animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}

        {error && (
          <div className="mx-auto max-w-[90%] bg-red-950/20 border border-red-900/30 p-3 rounded-lg text-xs text-red-400 flex items-center gap-2 mt-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Form Footer */}
      <form onSubmit={handleSend} className="p-4 border-t border-[var(--glass-border)] bg-[rgba(20,18,16,0.3)] flex gap-3 items-center">
        <input 
          type="text" 
          placeholder="ถามน้องนินาได้เลยเจ้า... เช่น 'วิเคราะห์จุดคุ้มทุนรอบนี้หื้อหน่อย' หรือ 'ลดค่าน้ำมันรถยังไงดี'"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="glass-input flex-1 py-3"
          disabled={loading}
        />
        <button 
          type="submit" 
          className="glass-button h-11 w-11 rounded-lg flex items-center justify-center shrink-0"
          disabled={loading || !inputValue.trim()}
          title="ส่งคำถาม"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
