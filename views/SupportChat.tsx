
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text?: string;
  image?: string;
  voice?: boolean;
  time: string;
}

const SupportChat: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'agent', text: "Haye! I'm Hodan from Fudaydiye Support. How can I help you today?", time: '14:20' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    
    // Simulate Agent Response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const agentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: "Mahadsanid for the message. I am looking into your request right now. One moment...",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, agentMsg]);
    }, 3000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const msg: ChatMessage = {
          id: Date.now().toString(),
          sender: 'user',
          image: reader.result as string,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, msg]);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Send voice message simulation
      const msg: ChatMessage = {
        id: Date.now().toString(),
        sender: 'user',
        voice: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, msg]);
    }
    setIsRecording(!isRecording);
  };

  return (
    <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark font-display">
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 active:scale-90 transition-all">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex items-center gap-3">
           <div className="relative">
              <div className="size-10 rounded-xl bg-primary/20 p-0.5 border border-primary/30">
                 <img src="https://picsum.photos/id/1012/100/100" className="w-full h-full object-cover rounded-[8px]" alt="Agent" />
              </div>
              <span className="absolute -bottom-1 -right-1 size-3 bg-green-500 rounded-full border-2 border-white dark:border-surface-dark"></span>
           </div>
           <div>
              <h3 className="text-sm font-black text-secondary dark:text-white uppercase tracking-tighter">Hodan (Support)</h3>
              <p className="text-[8px] font-black text-primary uppercase tracking-widest">Active Intelligence</p>
           </div>
        </div>
        <button className="ml-auto size-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 active:scale-90">
           <span className="material-symbols-outlined text-[20px]">call</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 no-scrollbar pb-32">
        <div className="flex flex-col items-center mb-4 opacity-40">
           <div className="size-16 rounded-[24px] bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl">lock</span>
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center">Encrypted Communication Tunnel Established</p>
        </div>

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
             <div className={`max-w-[80%] rounded-[28px] overflow-hidden ${
               msg.sender === 'user' 
               ? 'bg-secondary text-white rounded-tr-none shadow-lg' 
               : 'bg-white dark:bg-surface-dark text-secondary dark:text-white border border-gray-100 dark:border-white/5 rounded-tl-none shadow-soft'
             }`}>
                {msg.text && <p className="p-4 text-sm font-medium leading-relaxed">{msg.text}</p>}
                {msg.image && <img src={msg.image} className="w-full max-h-60 object-cover" alt="Attachment" />}
                {msg.voice && (
                  <div className="p-4 flex items-center gap-3 w-48">
                     <span className="material-symbols-outlined text-primary">play_circle</span>
                     <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full w-1/3 bg-primary"></div>
                     </div>
                     <span className="text-[9px] font-black opacity-60">0:12</span>
                  </div>
                )}
                <div className={`px-4 pb-2 text-[8px] font-black opacity-40 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                   {msg.time}
                </div>
             </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-pulse">
             <div className="bg-white dark:bg-surface-dark p-4 rounded-3xl rounded-tl-none border border-gray-100 dark:border-white/5 flex gap-1">
                <div className="size-1.5 bg-primary rounded-full"></div>
                <div className="size-1.5 bg-primary rounded-full"></div>
                <div className="size-1.5 bg-primary rounded-full"></div>
             </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </main>

      {/* Input Section */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-white/5 p-4 pb-10">
         {isRecording ? (
           <div className="flex items-center justify-between bg-primary/10 rounded-[28px] p-2 border border-primary/20 animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center gap-3 px-4">
                 <span className="size-3 bg-red-500 rounded-full animate-pulse"></span>
                 <span className="text-sm font-black text-secondary dark:text-white uppercase tracking-tighter">Recording {Math.floor(recordingSeconds / 60)}:{ (recordingSeconds % 60).toString().padStart(2, '0') }</span>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => setIsRecording(false)} className="size-12 rounded-2xl bg-white dark:bg-surface-dark flex items-center justify-center text-red-500 shadow-sm">
                    <span className="material-symbols-outlined">delete</span>
                 </button>
                 <button onClick={toggleRecording} className="size-12 rounded-2xl bg-secondary text-primary flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined">send</span>
                 </button>
              </div>
           </div>
         ) : (
           <div className="flex items-center gap-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="size-12 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center text-gray-400 active:scale-90 transition-all"
              >
                 <span className="material-symbols-outlined">add_circle</span>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
              
              <div className="flex-1 h-14 bg-gray-100 dark:bg-white/5 rounded-[24px] border border-gray-100 dark:border-white/10 flex items-center px-5 focus-within:border-primary/40 transition-all shadow-inner">
                 <input 
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value)}
                   onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                   placeholder="Type your message..." 
                   className="bg-transparent border-none focus:ring-0 text-sm font-bold flex-1 text-secondary dark:text-white placeholder:text-gray-400"
                 />
                 <button className="text-gray-400 hover:text-primary">
                    <span className="material-symbols-outlined">sentiment_satisfied</span>
                 </button>
              </div>

              {inputText.trim() ? (
                <button 
                  onClick={handleSendMessage}
                  className="size-14 rounded-2xl bg-primary text-secondary flex items-center justify-center shadow-primary-glow active:scale-95 transition-all"
                >
                   <span className="material-symbols-outlined font-black">send</span>
                </button>
              ) : (
                <button 
                  onClick={toggleRecording}
                  className="size-14 rounded-2xl bg-secondary text-primary flex items-center justify-center shadow-lg active:scale-95 transition-all"
                >
                   <span className="material-symbols-outlined font-black">mic</span>
                </button>
              )}
           </div>
         )}
      </footer>
    </div>
  );
};

export default SupportChat;
