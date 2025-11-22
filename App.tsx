
import React, { useState, useEffect, useRef } from 'react';
import { generatePersona, sendChatMessage, generateGrading, generateGreeting, generateHint } from './services/geminiService';
import { Message, Persona, Sender, GradingResult, Language } from './types';
import MessageBubble from './components/MessageBubble';
import PersonaCard from './components/PersonaCard';
import FeedbackModal from './components/FeedbackModal';
import { MessageSquarePlus, Send, Loader2, BookOpen, CheckCircle, Globe, Lightbulb } from 'lucide-react';

const MAX_TURNS = 15;

const UI_TEXT = {
  en: {
    subtitle: "Mom Test Simulator",
    newPersona: "New Persona",
    summoning: "Summoning a customer...",
    startPrompt: "Customer is starting the conversation...",
    placeholder: "Type your reply...",
    endGrade: "End & Grade",
    grading: "Analyzing your performance...",
    turnsLeft: "turns left",
    hint: "Get a Hint",
  },
  zh: {
    subtitle: "Mom Test 训练器",
    newPersona: "新用户画像",
    summoning: "正在生成模拟用户...",
    startPrompt: "客户正在发起对话...",
    placeholder: "输入你的回复...",
    endGrade: "结束并评分",
    grading: "正在分析你的表现...",
    turnsLeft: "剩余回合",
    hint: "获取提示",
  }
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('zh');
  const [persona, setPersona] = useState<Persona | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
  const [isPersonaExpanded, setIsPersonaExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial Load
  useEffect(() => {
    startNewSession();
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-finish check
  useEffect(() => {
    const userTurns = messages.filter(m => m.sender === Sender.USER).length;
    if (userTurns >= MAX_TURNS && !gradingResult && !isGrading && !isLoading) {
      handleFinish();
    }
  }, [messages]);

  const startNewSession = async () => {
    setIsLoading(true);
    setPersona(null);
    setMessages([]);
    setGradingResult(null);
    setIsPersonaExpanded(true);
    try {
      const newPersona = await generatePersona(lang);
      setPersona(newPersona);

      // Generate initial greeting from the persona
      const greetingData = await generateGreeting(newPersona, lang);

      const greetingMsg: Message = {
        id: Date.now().toString(),
        text: greetingData.aiResponse.text,
        sender: Sender.AI,
        analysis: { subtext: greetingData.aiResponse.subtext },
        isAnalysisVisible: false
      };
      setMessages([greetingMsg]);
      setIsPersonaExpanded(false); // Auto collapse after loading to focus on chat

    } catch (error) {
      console.error("Failed to init", error);
      alert("Failed to generate persona. Check API Key or connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !persona) return;

    const userText = input;
    setInput('');
    setIsLoading(true);

    const tempId = Date.now().toString();
    const tempUserMsg: Message = {
      id: tempId,
      text: userText,
      sender: Sender.USER,
      analysis: { subtext: "Analyzing..." },
      isAnalysisVisible: false
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const { userAnalysis, aiResponse } = await sendChatMessage(messages, userText, persona, lang);

      setMessages(prev => prev.map(msg =>
        msg.id === tempId
          ? { ...msg, analysis: userAnalysis }
          : msg
      ));

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.text,
        sender: Sender.AI,
        analysis: { subtext: aiResponse.subtext },
        isAnalysisVisible: false
      };
      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      console.error(error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetHint = async () => {
    if (!persona || messages.length === 0) return;
    setIsHintLoading(true);
    try {
      const hint = await generateHint(messages, persona, lang);
      setInput(hint);
    } catch (error) {
      console.error(error);
    } finally {
      setIsHintLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleAnalysis = (id: string) => {
    setMessages(prev => prev.map(msg =>
      msg.id === id ? { ...msg, isAnalysisVisible: !msg.isAnalysisVisible } : msg
    ));
  };

  const handleFinish = async () => {
    if (!persona || messages.length === 0) return;
    setIsGrading(true);
    try {
      const result = await generateGrading(messages, persona, lang);
      setGradingResult(result);
    } catch (error) {
      console.error(error);
      alert("Failed to grade conversation. Please try again.");
    } finally {
      setIsGrading(false);
    }
  };

  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'zh' : 'en';
    setLang(newLang);
    setTimeout(() => startNewSession(), 50);
  };

  const turnsUsed = messages.filter(m => m.sender === Sender.USER).length;
  const turnsLeft = Math.max(0, MAX_TURNS - turnsUsed);
  const text = UI_TEXT[lang];

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto bg-white shadow-2xl overflow-hidden border-x-2 border-slate-200 relative">

      {/* Header */}
      <header className="bg-white border-b-2 border-slate-200 p-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-[#58CC02] p-2 rounded-xl">
            <BookOpen size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl text-slate-700 tracking-tight leading-none">Needlingo</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">{text.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            title="Switch Language (Restarts Session)"
            className="text-xs font-bold text-slate-500 hover:bg-slate-100 px-3 py-2 rounded-xl border-2 border-transparent hover:border-slate-200 transition-all flex items-center gap-1"
          >
            <Globe size={16} />
            {lang === 'en' ? 'EN' : '中文'}
          </button>
          <button
            onClick={startNewSession}
            disabled={isLoading}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-wide px-4 py-2 rounded-xl border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <MessageSquarePlus size={16} />
            {text.newPersona}
          </button>
        </div>
      </header>

      {/* Persona Card */}
      {persona && (
        <PersonaCard
          persona={persona}
          isExpanded={isPersonaExpanded}
          toggleExpand={() => setIsPersonaExpanded(!isPersonaExpanded)}
        />
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50 scroll-smooth no-scrollbar">
        {!persona && isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 animate-pulse">
            <Loader2 size={48} className="animate-spin text-indigo-300 mb-4" />
            <p className="font-bold text-sm">{text.summoning}</p>
          </div>
        )}

        {persona && messages.length === 0 && isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 animate-pulse">
            <Loader2 size={48} className="animate-spin text-[#58CC02] mb-4" />
            <p className="font-bold text-sm">{text.startPrompt}</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onToggleAnalysis={toggleAnalysis}
          />
        ))}

        {isLoading && messages.length > 0 && (
          <div className="flex items-start gap-2 ml-1">
            <div className="bg-white px-4 py-3 rounded-2xl border-2 border-slate-200 rounded-tl-none">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Grading Overlay */}
      {isGrading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-30 flex items-center justify-center flex-col">
          <Loader2 size={64} className="animate-spin text-[#58CC02] mb-4" />
          <p className="text-xl font-extrabold text-slate-700">{text.grading}</p>
        </div>
      )}

      {/* Controls */}
      <div className="p-4 bg-white border-t-2 border-slate-200 shrink-0 z-20">
        <div className="flex justify-between items-center mb-3 px-1">
          <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
            {turnsLeft} {text.turnsLeft}
          </div>
          <button
            onClick={handleFinish}
            disabled={messages.length < 2 || isLoading || isGrading}
            className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-wide disabled:opacity-50 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            {text.endGrade}
          </button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || isGrading || !persona}
              placeholder={text.placeholder}
              className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl pl-4 pr-10 py-3 focus:outline-none focus:bg-white focus:border-indigo-400 font-semibold text-slate-700 placeholder-slate-400 transition-all"
            />
            <button
              onClick={handleGetHint}
              disabled={isLoading || isGrading || !persona || isHintLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-amber-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={text.hint}
            >
              {isHintLoading ? <Loader2 size={18} className="animate-spin" /> : <Lightbulb size={18} fill="currentColor" />}
            </button>
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading || isGrading || !persona}
            className="bg-[#58CC02] hover:bg-[#46A302] text-white p-3 rounded-2xl border-b-4 border-[#46A302] active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Feedback Modal */}
      {gradingResult && (
        <FeedbackModal
          result={gradingResult}
          lang={lang}
          onClose={startNewSession}
        />
      )}
    </div>
  );
};

export default App;
