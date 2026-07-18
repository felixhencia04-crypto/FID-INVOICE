import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Send, X, Sparkles, Clock, User, 
  Check, CheckCheck, HelpCircle, Shield, CreditCard, Ban
} from 'lucide-react';
import { UserProfile } from '../types';
import { db } from '../lib/firebase';
import { collection, doc, getDocs, setDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

interface CallCenterChatProps {
  currentUser: UserProfile | null;
  onNavigate: (page: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system' | 'bot';
  senderName: string;
  text: string;
  timestamp: string;
}

export default function CallCenterChat({ currentUser, onNavigate }: CallCenterChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const userId = currentUser?.id || 'guest_user';
  const userName = currentUser?.fullName || 'Tamu';
  const userEmail = currentUser?.email || 'guest@example.com';

  // Load chat history from localStorage
  const loadChatHistory = async () => {
    const chatKey = 'fid_invoice_chat_' + userId;
    
    // Default welcome msgs
    const welcomeMsgs: ChatMessage[] = [
      {
        id: 'welcome_1',
        sender: 'bot',
        senderName: 'Fidya - AI Support',
        text: currentUser 
          ? `Halo Kak ${currentUser.fullName}! Selamat datang di Pusat Layanan & Chat Support FID INVOICE. Saya Fidya, asisten pintar Anda. Bagaimana saya bisa membantu operasional bisnis Anda hari ini?`
          : 'Halo! Selamat datang di Pusat Layanan & Chat Support FID INVOICE. Saya Fidya, asisten digital Anda. Apakah Kakak mengalami kendala pendaftaran, login, atau ingin bertanya mengenai fitur aplikasi?',
        timestamp: new Date().toTimeString().split(' ')[0].substring(0, 5)
      }
    ];

    try {
      const res = await fetch(`/api/chats/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.messages.length > 0) {
          localStorage.setItem(chatKey, JSON.stringify(data.messages));
          setMessages(data.messages);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }

    const stored = localStorage.getItem(chatKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      setMessages(parsed);
      
      if (!isOpen) {
        const threadStr = localStorage.getItem('fid_invoice_support_chats') || '[]';
        const threads = JSON.parse(threadStr);
        const myThread = threads.find((t: any) => (t.userId === userId) || (t.id === userId));
        if (myThread && myThread.unreadForUser) {
          setUnreadCount(1);
        }
      }
    } else {
      localStorage.setItem(chatKey, JSON.stringify(welcomeMsgs));
      setMessages(welcomeMsgs);
    }
  };

  // Use Firestore onSnapshot for real-time customer support chat replies
  useEffect(() => {
    loadChatHistory();

    const q = query(collection(db, 'supportChats', userId, 'messages'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => d.data() as ChatMessage);
      msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() || 0); // basic sort
      
      if (msgs.length > 0) {
        setMessages(prev => {
          if (msgs.length !== prev.length || (msgs.length > 0 && prev.length > 0 && msgs[msgs.length - 1].id !== prev[prev.length - 1].id)) {
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg.sender === 'agent' && !isOpen) {
              setUnreadCount(prevUnread => prevUnread + 1);
              try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, ctx.currentTime);
                osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
                osc.connect(gain);
                gain.connect(ctx.destination);
                gain.gain.setValueAtTime(0.04, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
                osc.start();
                osc.stop(ctx.currentTime + 0.35);
              } catch (e) {}
            }
            return msgs;
          }
          return prev;
        });
      }
    });

    return () => unsubscribe();
  }, [userId, isOpen]);

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Mark messages as read when opening chat
  const handleOpenChat = () => {
    setIsOpen(true);
    setUnreadCount(0);
    
    // Clear unreadForUser in index
    const threadStr = localStorage.getItem('fid_invoice_support_chats') || '[]';
    const threads = JSON.parse(threadStr);
    const updatedThreads = threads.map((t: any) => {
      if ((t.userId === userId) || (t.id === userId)) {
        return { ...t, unreadForUser: false };
      }
      return t;
    });
    localStorage.setItem('fid_invoice_support_chats', JSON.stringify(updatedThreads));
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    setInputText('');

    const now = new Date();
    const formattedTime = now.toTimeString().split(' ')[0].substring(0, 5);

    const newMsg: ChatMessage = {
      id: 'msg_user_' + Date.now(),
      sender: 'user',
      senderName: userName,
      text: userText,
      timestamp: formattedTime
    };

    // Update messages
    const chatKey = 'fid_invoice_chat_' + userId;
    const existingMsgs = JSON.parse(localStorage.getItem(chatKey) || '[]');
    const updatedMsgs = [...existingMsgs, newMsg];
    localStorage.setItem(chatKey, JSON.stringify(updatedMsgs));
    setMessages(updatedMsgs);

    // Update global threads index list for Admin Panel
    const threadStr = localStorage.getItem('fid_invoice_support_chats') || '[]';
    let threads = JSON.parse(threadStr);
    const targetIdx = threads.findIndex((t: any) => (t.userId === userId) || (t.id === userId));

    const threadInfo = {
      userId,
      userName,
      userEmail,
      lastMessage: userText,
      lastUpdated: now.toISOString(),
      unreadForOwner: true, // Requires admin attention
      unreadForUser: false
    };

    if (targetIdx > -1) {
      threads[targetIdx] = threadInfo;
    } else {
      threads.push(threadInfo);
    }
    localStorage.setItem('fid_invoice_support_chats', JSON.stringify(threads));

    fetch(`/api/chats/${userId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: updatedMsgs, threadMeta: threadInfo })
    }).catch(e => console.error(e));

    // Play a crisp keyboard click send chime
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (ex) {}

    // Simulate smart AI bot (Fidya) auto-reply
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      let replyText = '';

      const lowerText = userText.toLowerCase();

      if (lowerText.includes('billing') || lowerText.includes('bayar') || lowerText.includes('rekening') || lowerText.includes('qris') || lowerText.includes('paket') || lowerText.includes('harga')) {
        replyText = `Terkait pembayaran paket langganan di FID INVOICE, Anda dapat melakukan perpanjangan instan menggunakan **metode transfer bank manual** maupun **QRIS Dinamis** di halaman Billing.\n\nKami menawarkan paket: \n1. **Starter** (Coba gratis 3 hari penuh)\n2. **Professional** (Rp 99.000 / bulan)\n3. **Enterprise** (Rp 249.000 / bulan)\n\nJika Anda sudah melakukan transfer, mohon kirimkan bukti transfer tersebut di sini, atau konfirmasikan ke Admin Panel kami agar segera diaktifkan.`;
      } else if (lowerText.includes('expired') || lowerText.includes('habis') || lowerText.includes('blokir') || lowerText.includes('tangguh')) {
        replyText = `Masa aktif akun Anda terdeteksi habis atau ditangguhkan. Jangan khawatir, seluruh data rekam keuangan, riwayat invoice, serta data klien Anda tersimpan dengan aman di database kami.\n\nUntuk mengaktifkannya kembali, silakan klik tombol **"Perpanjang Sekarang"** pada banner merah di bagian atas aplikasi Anda, atau pilih paket langganan Anda kembali. Kami akan mengaktifkan akses pembuatan invoice Anda dalam hitungan detik setelah pembayaran terverifikasi.`;
      } else if (lowerText.includes('error') || lowerText.includes('bug') || lowerText.includes('rusak') || lowerText.includes('tidak bisa')) {
        replyText = `Mohon maaf atas ketidaknyamanan yang Kakak alami. Saat ini aplikasi berjalan di mode demo sandbox yang aman.\n\nApakah Anda ingin saya meneruskan kendala teknis ini kepada **Bapak Andi (Supervisor Customer Experience)** agar dapat meninjau langsung database Anda? Silakan tuliskan detail error yang ditemui.`;
      } else if (lowerText.includes('invoice') || lowerText.includes('buat invoice') || lowerText.includes('faktur')) {
        replyText = `Untuk membuat invoice baru, silakan navigasi ke tab **"Buat Invoice"** di menu samping kiri Anda. Jika akun Anda dalam masa tenggang atau habis, silakan lakukan perpanjangan lisensi terlebih dahulu.\n\nAnda dapat menambahkan Logo Perusahaan, Pajak PPN (11%), Diskon, serta Tanda Tangan Digital pada invoice Anda secara instan.`;
      } else if (lowerText.includes('quotation') || lowerText.includes('penawaran')) {
        replyText = `Fitur **Penawaran Harga (Quotation Management)** memudahkan Anda membuat estimasi biaya profesional untuk prospek klien Anda. Anda dapat mengirim penawaran via WhatsApp/Email, dan mengonversinya menjadi **Invoice Resmi** hanya dengan 1-klik jika klien menyetujuinya!`;
      } else {
        replyText = `Terima kasih atas pesan Kakak! Saya Fidya, asisten AI, telah merekam pertanyaan tersebut.\n\nPesan Kakak telah saya daftarkan ke antrean support dan diteruskan kepada **Bapak Andi (Supervisor Customer Experience)**. Beliau akan membalas secara manual langsung ke dalam chat ini.\n\nMohon tetap membuka aplikasi atau memeriksa widget chat ini secara berkala ya Kak!`;
      }

      const botMsg: ChatMessage = {
        id: 'msg_bot_' + Date.now(),
        sender: 'bot',
        senderName: 'Fidya - AI Support',
        text: replyText,
        timestamp: new Date().toTimeString().split(' ')[0].substring(0, 5)
      };

      const currentMsgs = JSON.parse(localStorage.getItem(chatKey) || '[]');
      const finalMsgs = [...currentMsgs, botMsg];
      localStorage.setItem(chatKey, JSON.stringify(finalMsgs));
      setMessages(finalMsgs);

      // Update index with bot reply too
      const currentThreads = JSON.parse(localStorage.getItem('fid_invoice_support_chats') || '[]');
      const myIdx = currentThreads.findIndex((t: any) => t.userId === userId);
      if (myIdx > -1) {
        currentThreads[myIdx].lastMessage = replyText.substring(0, 60) + '...';
        currentThreads[myIdx].lastUpdated = new Date().toISOString();
        localStorage.setItem('fid_invoice_support_chats', JSON.stringify(currentThreads));
      }

      // Sync bot message to Firestore
      setDoc(doc(db, 'supportChats', userId), { ...threadInfo, unreadForOwner: false }).catch(() => {});
      setDoc(doc(db, 'supportChats', userId, 'messages', botMsg.id), botMsg).catch(() => {});

      // Play soft incoming notification sound
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } catch (e) {}

    }, 1200);

  };

  const handleQuickQuestion = (question: string) => {
    setInputText(question);
    // Auto-focus input
    setTimeout(() => {
      handleSendMessage();
    }, 50);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] no-print">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            id="chat-trigger-btn"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={handleOpenChat}
            className="flex items-center gap-2 px-5 py-4 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-full shadow-2xl shadow-brand-primary/30 hover:scale-[1.05] active:scale-[0.95] cursor-pointer transition-all border-none font-bold"
          >
            <div className="relative">
              <MessageSquare className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-2.5 -right-2.5 bg-brand-gold text-brand-dark text-[9px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-brand-primary animate-bounce">
                  {unreadCount}
                </span>
              )}
            </div>
            <span className="text-xs tracking-tight">Hubungi Support</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="chat-window-panel"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="bg-white rounded-3xl w-[350px] sm:w-[380px] h-[520px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden text-left relative"
          >
            {/* Header */}
            <div className="bg-brand-primary p-4 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Sparkles className="w-5 h-5 text-brand-gold animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider">FIDYA SUPPORT CHAT</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-[10px] text-white/80 font-mono">Fidya & Andi Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 text-white/80 hover:text-white rounded-lg transition-colors cursor-pointer border-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              <div className="text-center">
                <span className="inline-block text-[9px] font-bold tracking-widest uppercase font-mono px-2.5 py-1 bg-gray-100 text-gray-400 rounded-full border border-gray-200/50">
                  Sesi Chat Dukungan Teknis
                </span>
              </div>

              {messages.map((msg) => {
                const isMe = msg.sender === 'user';
                const isBot = msg.sender === 'bot';
                const isAgent = msg.sender === 'agent';

                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {/* Sender Label */}
                    <span className="text-[9px] font-bold text-gray-400 mb-1 px-1 flex items-center gap-1">
                      {!isMe && (
                        <span className={`h-1.5 w-1.5 rounded-full ${isBot ? 'bg-indigo-500' : 'bg-brand-gold'}`}></span>
                      )}
                      {msg.senderName}
                    </span>

                    {/* Speech Bubble */}
                    <div 
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                        isMe 
                          ? 'bg-brand-primary text-white rounded-tr-none shadow-sm' 
                          : isAgent
                            ? 'bg-amber-50 border border-amber-200 text-slate-800 rounded-tl-none shadow-xs font-medium'
                            : 'bg-white border border-gray-100 text-slate-700 rounded-tl-none shadow-xs'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>

                    {/* Timestamp & Read Status */}
                    <div className="flex items-center gap-1.5 mt-1 px-1">
                      <Clock className="w-2.5 h-2.5 text-gray-400" />
                      <span className="text-[9px] font-mono text-gray-400">{msg.timestamp}</span>
                      {isMe && (
                        <CheckCheck className="w-3 h-3 text-emerald-500" />
                      )}
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex flex-col items-start">
                  <span className="text-[9px] font-bold text-gray-400 mb-1 px-1">Fidya sedang mengetik...</span>
                  <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions suggestion */}
            {messages.length < 3 && (
              <div className="px-4 py-2 bg-slate-50 border-t border-gray-100/80 flex flex-wrap gap-1.5 shrink-0">
                <button
                  onClick={() => handleQuickQuestion('Bagaimana cara bayar langganan?')}
                  className="px-2.5 py-1.5 bg-white hover:bg-brand-primary/5 text-[10px] text-gray-600 hover:text-brand-primary border border-gray-200 hover:border-brand-primary/30 rounded-xl transition-all cursor-pointer font-bold shrink-0"
                >
                  💳 Cara Bayar Paket
                </button>
                <button
                  onClick={() => handleQuickQuestion('Akun saya expired/habis.')}
                  className="px-2.5 py-1.5 bg-white hover:bg-brand-primary/5 text-[10px] text-gray-600 hover:text-brand-primary border border-gray-200 hover:border-brand-primary/30 rounded-xl transition-all cursor-pointer font-bold shrink-0"
                >
                  ⚠️ Masa Aktif Habis
                </button>
                <button
                  onClick={() => handleQuickQuestion('Bagaimana cara membuat invoice?')}
                  className="px-2.5 py-1.5 bg-white hover:bg-brand-primary/5 text-[10px] text-gray-600 hover:text-brand-primary border border-gray-200 hover:border-brand-primary/30 rounded-xl transition-all cursor-pointer font-bold shrink-0"
                >
                  ✍️ Buat Invoice Baru
                </button>
              </div>
            )}

            {/* Input Footer */}
            <form 
              onSubmit={handleSendMessage}
              className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center shrink-0"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ketik pesan dukungan di sini..."
                className="flex-1 bg-gray-50 border border-gray-200 text-slate-800 text-xs px-4 py-3 rounded-2xl focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary transition-all placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-3 bg-brand-primary hover:bg-brand-primary-dark disabled:bg-gray-100 text-white disabled:text-gray-400 rounded-2xl transition-all cursor-pointer border-none shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
