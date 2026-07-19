import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, X, Send, Paperclip, FileText, Image as ImageIcon, 
  ChevronDown, Maximize2, Minimize2, Headset, User, Bot, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { 
  collection, doc, setDoc, onSnapshot, query, orderBy, 
  limit, serverTimestamp, getDoc, updateDoc 
} from 'firebase/firestore';
import { UserProfile, ChatMessage, SupportThread } from '../types';

interface SupportChatProps {
  currentUser: UserProfile | null;
}

export default function SupportChat({ currentUser }: SupportChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [attachment, setAttachment] = useState<{ name: string; type: string; data: string; size: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const userId = currentUser?.id || 'anonymous';
  const userName = currentUser?.fullName || 'Tamu';
  const userEmail = currentUser?.email || 'guest@example.com';

  // Listen for global event to open support chat
  useEffect(() => {
    const handleOpenSupport = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    window.addEventListener('fid_open_support', handleOpenSupport);
    return () => window.removeEventListener('fid_open_support', handleOpenSupport);
  }, []);

  // Sound effects
  const playSound = (type: 'send' | 'receive') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      if (type === 'send') {
        osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
      } else {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
      }
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  };

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  // Firestore Sync
  useEffect(() => {
    if (!userId || userId === 'anonymous') return;

    const threadRef = doc(db, 'supportChats', userId);
    
    // Listen to thread metadata for unread badge
    const unsubscribeThread = onSnapshot(threadRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as SupportThread;
        if (isOpen && data.unreadForUser) {
          updateDoc(threadRef, { unreadForUser: false }).catch(() => {});
          setUnreadCount(0);
        } else if (!isOpen && data.unreadForUser) {
          setUnreadCount(1);
        }
      }
    });

    // Listen to messages
    const messagesQuery = query(
      collection(db, 'supportChats', userId, 'messages'),
      orderBy('timestamp_ms', 'asc'),
      limit(50)
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(d => d.data() as ChatMessage);
      
      setMessages(prev => {
        if (msgs.length > prev.length) {
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg.sender !== 'user' && !isOpen) {
            playSound('receive');
          }
        }
        return msgs;
      });
    });

    return () => {
      unsubscribeThread();
      unsubscribeMessages();
    };
  }, [userId, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachment) return;

    const text = inputText.trim();
    const currentAttachment = attachment;
    
    setInputText('');
    setAttachment(null);
    playSound('send');

    const now = new Date();
    const timestamp_ms = now.getTime();
    const timestamp = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const messageId = `msg_${userId}_${timestamp_ms}`;
    const newMsg: ChatMessage = {
      id: messageId,
      sender: 'user',
      senderName: userName,
      text: text || undefined,
      attachment: currentAttachment || undefined,
      timestamp,
      timestamp_ms
    };

    try {
      const threadRef = doc(db, 'supportChats', userId);
      const msgRef = doc(db, 'supportChats', userId, 'messages', messageId);

      // Create/Update thread
      await setDoc(threadRef, {
        userId,
        userName,
        userEmail,
        lastMessage: text || (currentAttachment ? `📎 [File: ${currentAttachment.name}]` : ''),
        lastUpdated: now.toISOString(),
        timestamp_ms,
        unreadForOwner: true,
        unreadForUser: false,
        status: 'active'
      }, { merge: true });

      // Add message
      await setDoc(msgRef, newMsg);

      // AI Bot Auto-reply logic (Simulated)
      if (messages.length === 0) {
        setIsTyping(true);
        setTimeout(async () => {
          setIsTyping(false);
          const botId = `bot_${Date.now()}`;
          const botMsg: ChatMessage = {
            id: botId,
            sender: 'bot',
            senderName: 'Fidya - AI Support',
            text: `Halo ${userName}! Saya Fidya, asisten AI dari FID INVOICE. Pesan Anda telah saya teruskan ke tim Support kami (Bapak Andi). \n\nSembari menunggu, apakah ada hal spesifik tentang Billing atau Fitur Invoice yang ingin ditanyakan?`,
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            timestamp_ms: Date.now()
          };
          await setDoc(doc(db, 'supportChats', userId, 'messages', botId), botMsg);
          playSound('receive');
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('File terlalu besar. Maksimal 2MB untuk demo ini.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachment({
        name: file.name,
        type: file.type,
        data: event.target?.result as string,
        size: file.size
      });
    };
    reader.readAsDataURL(file);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
      setUnreadCount(0);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-[360px] h-[520px] bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="bg-slate-900 dark:bg-slate-950 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg">
                  <Headset className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Dukungan Pelanggan</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Andi is Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={toggleChat}
                  className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Message Viewport */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50"
            >
              <div className="text-center py-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  Mulai Percakapan
                </span>
              </div>

              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} group`}
                >
                  <div className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      msg.sender === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : msg.sender === 'bot'
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-slate-700 dark:text-slate-200 rounded-tl-none'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none'
                    }`}>
                      {msg.attachment && (
                        <div className="mb-2 rounded-lg overflow-hidden border border-black/10 bg-black/5">
                          {msg.attachment.type.startsWith('image/') ? (
                            <img src={msg.attachment.data} alt={msg.attachment.name} className="max-w-full h-auto block" />
                          ) : (
                            <div className="p-3 flex items-center gap-2">
                              <FileText className="w-5 h-5 text-blue-500" />
                              <span className="text-xs font-medium truncate max-w-[150px]">{msg.attachment.name}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {msg.timestamp} • {msg.senderName}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none px-4 py-2 text-slate-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-xs font-medium">Fidya sedang mengetik...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Attachment Preview */}
            {attachment && (
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  {attachment.type.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-blue-500" /> : <FileText className="w-4 h-4 text-blue-500" />}
                  <span className="text-[10px] font-bold truncate text-slate-600 dark:text-slate-400">{attachment.name}</span>
                </div>
                <button onClick={() => setAttachment(null)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Input */}
            <form 
              onSubmit={handleSendMessage}
              className="p-3 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileSelect}
                accept="image/*,.pdf"
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Tulis pesan Anda..."
                className="flex-1 bg-slate-100 dark:bg-slate-900 border-none outline-none rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white"
              />
              <button 
                type="submit"
                disabled={!inputText.trim() && !attachment}
                className={`p-2 rounded-xl transition-all ${
                  inputText.trim() || attachment 
                    ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 active:scale-95' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4">
        {unreadCount > 0 && !isOpen && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-xl flex items-center gap-2 border-2 border-white dark:border-slate-900"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
            Ada pesan baru!
          </motion.div>
        )}
        
        <button
          onClick={toggleChat}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-90 ${
            isOpen ? 'bg-slate-900 dark:bg-slate-950 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isOpen ? <ChevronDown className="w-7 h-7" /> : (
            <div className="relative">
              <MessageSquare className="w-7 h-7" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
              )}
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
