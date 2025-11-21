
import React, { useState } from 'react';
import { Message, Sender } from '../types';
import { Eye, EyeOff, Info, Lock, Unlock, Star } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  onToggleAnalysis: (id: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onToggleAnalysis }) => {
  const isUser = message.sender === Sender.USER;
  const [isBetterAskVisible, setIsBetterAskVisible] = useState(false);

  const getScoreColor = (score: number | undefined) => {
    if (score === undefined) return 'bg-gray-200 text-gray-500';
    if (score >= 80) return 'bg-green-500 text-white';
    if (score >= 50) return 'bg-yellow-500 text-white';
    return 'bg-red-500 text-white';
  };

  return (
    <div className={`flex flex-col mb-6 ${isUser ? 'items-end' : 'items-start'}`}>
      
      {/* Message Bubble */}
      <div 
        onClick={() => onToggleAnalysis(message.id)}
        className={`
          relative max-w-[85%] px-5 py-3 rounded-2xl cursor-pointer transition-all duration-200 
          border-2 border-b-4 active:border-b-2 active:translate-y-[2px] group
          ${isUser 
            ? 'bg-[#1CB0F6] text-white border-[#1899D6] hover:bg-[#1899D6]' 
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}
        `}
      >
        <div className="text-base font-bold leading-relaxed">
          {message.text}
        </div>
        
        {/* Interaction Hint */}
        <div className={`absolute -bottom-3 ${isUser ? '-left-3' : '-right-3'} bg-white rounded-full p-1 shadow-sm border-2 border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
           {message.isAnalysisVisible ? <EyeOff size={14} className="text-slate-400"/> : <Eye size={14} className="text-[#1CB0F6]"/>}
        </div>
      </div>

      {/* Analysis Section */}
      {message.isAnalysisVisible && (
        <div className={`
          mt-3 max-w-[80%] p-4 rounded-xl text-sm border-2 animate-in fade-in slide-in-from-top-2 duration-300
          ${isUser 
            ? 'bg-slate-100 border-slate-300 text-slate-600 mr-1' 
            : 'bg-amber-50 border-amber-200 text-amber-800 ml-1'}
        `}>
          <div className="flex items-start gap-3">
            <div className={`p-1.5 rounded-lg shrink-0 ${isUser ? 'bg-slate-200' : 'bg-amber-100'}`}>
              <Info size={16} className={isUser ? 'text-slate-500' : 'text-amber-600'} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <p className="font-extrabold text-xs uppercase tracking-wider opacity-70">
                  {isUser ? 'COACH' : 'SUBTEXT'}
                </p>
                {isUser && message.analysis.score !== undefined && (
                  <div className={`px-2 py-0.5 rounded-lg text-xs font-black flex items-center gap-1 ${getScoreColor(message.analysis.score)}`}>
                    <Star size={10} fill="currentColor" />
                    {message.analysis.score}
                  </div>
                )}
              </div>
              
              <p className="font-medium italic leading-relaxed opacity-90">
                "{message.analysis.subtext}"
              </p>
              
              {isUser && message.analysis.feedback && (
                 <div className="mt-3 text-xs font-bold not-italic p-3 bg-white border border-slate-200 rounded-lg text-slate-500 shadow-sm">
                   {message.analysis.feedback}
                 </div>
              )}

              {/* Better Ask Reveal */}
              {isUser && message.analysis.betterAlternative && (
                <div className="mt-3">
                  {!isBetterAskVisible ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsBetterAskVisible(true); }}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg border border-indigo-200 transition-colors"
                    >
                      <Lock size={12} />
                      <span className="text-xs font-bold uppercase">Reveal Standard Question</span>
                    </button>
                  ) : (
                    <div 
                       className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg animate-in fade-in"
                       onClick={(e) => { e.stopPropagation(); setIsBetterAskVisible(false); }}
                    >
                      <div className="flex items-center gap-2 mb-1 text-indigo-400">
                        <Unlock size={12} />
                        <span className="text-[10px] font-black uppercase tracking-wider">Better Ask</span>
                      </div>
                      <p className="text-indigo-700 font-bold text-sm">"{message.analysis.betterAlternative}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
