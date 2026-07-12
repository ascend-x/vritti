import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAvailableVehicles, getAvailableDrivers, getTrips, getMonthlyRevenue } from '../../api';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I am Vritti AI. How can I help you manage your fleet today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const submitQuery = async (queryToSubmit) => {
    if (!queryToSubmit.trim()) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: queryToSubmit }]);
    setIsLoading(true);

    // Mock AI Processing Delay
    await new Promise(r => setTimeout(r, 1000));

    let reply = "I specialize in logistics operations! You can ask me to find **available trucks**, check **available drivers**, track **active trips**, or calculate your **revenue**.";

    try {
      const lowerQuery = query.toLowerCase();
      
      if (lowerQuery.includes('available') && (lowerQuery.includes('truck') || lowerQuery.includes('vehicle'))) {
        const vehicles = await getAvailableVehicles();
        if (vehicles.length > 0) {
          reply = `I found ${vehicles.length} available vehicles right now. For example, ${vehicles[0].reg_number} (${vehicles[0].name_model}) is ready for dispatch!`;
        } else {
          reply = "I couldn't find any available vehicles at the moment. They might all be on trips or in the shop.";
        }
      } 
      else if (lowerQuery.includes('available') && (lowerQuery.includes('driver') || lowerQuery.includes('pilot'))) {
        const drivers = await getAvailableDrivers();
        if (drivers.length > 0) {
          reply = `There are ${drivers.length} drivers available! ${drivers[0].name} has a safety score of ${drivers[0].safety_score}% and is ready to go.`;
        } else {
          reply = "No drivers are currently available for dispatch.";
        }
      }
      else if (lowerQuery.includes('trip') || lowerQuery.includes('status')) {
        const tripsRes = await getTrips();
        const active = tripsRes.data.filter(t => t.status === 'Dispatched');
        reply = `You currently have ${active.length} active trips on the road.`;
      }
      else if (lowerQuery.includes('revenue') || lowerQuery.includes('earn') || lowerQuery.includes('money')) {
        const revData = await getMonthlyRevenue(new Date().getFullYear());
        const total = revData.reduce((sum, m) => sum + m.revenue, 0);
        reply = `Your total revenue for this year so far is ₹${total.toLocaleString('en-IN')}. Keep it up!`;
      }
    } catch (err) {
      reply = "Oops! I hit a snag while checking the database.";
    }

    setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    setIsLoading(false);
  };

  const handleSend = (e) => {
    e.preventDefault();
    submitQuery(input);
  };

  const handleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      submitQuery(transcript);
    };
    
    recognition.start();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-brand-500 hover:bg-brand-600 text-brand-950 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 z-40 group"
      >
        <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-[380px] h-[500px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-500" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white leading-none">Vritti AI</h3>
                  <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">Smart Dispatch Assistant</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-zinc-200 dark:bg-zinc-800' : 'bg-brand-500 text-brand-950'}`}>
                    {m.role === 'user' ? <User className="w-4 h-4 text-zinc-600 dark:text-zinc-400" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm ${
                    m.role === 'user' 
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-tr-sm' 
                      : 'bg-brand-50 dark:bg-brand-500/10 text-zinc-800 dark:text-zinc-200 rounded-tl-sm border border-brand-100 dark:border-brand-500/20'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                   <div className="w-8 h-8 rounded-full bg-brand-500 text-brand-950 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-brand-50 dark:bg-brand-500/10 rounded-tl-sm border border-brand-100 dark:border-brand-500/20 flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <form onSubmit={handleSend} className="relative flex gap-2">
                <button type="button" onClick={handleVoice} className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-brand-500'}`}>
                  <Mic className="w-4 h-4" />
                </button>
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Ask about your fleet..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    className="w-full h-11 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-4 pr-12 text-sm text-zinc-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                  />
                  <button type="submit" disabled={!input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-brand-500 hover:bg-brand-600 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-brand-950 rounded-lg flex items-center justify-center transition-colors">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
