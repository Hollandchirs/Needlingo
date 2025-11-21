import React from 'react';
import { GradingResult, Language } from '../types';
import { X, ThumbsUp, ThumbsDown, RefreshCw, CheckCircle, AlertTriangle, Trophy, Frown } from 'lucide-react';

interface FeedbackModalProps {
  result: GradingResult;
  onClose: () => void;
  lang: Language;
}

const TEXT = {
  en: {
    titleSuccess: "Level Cleared!",
    titleFail: "Level Failed",
    subtitleSuccess: "You found the truth & pitched correctly!",
    subtitleFail: "You didn't uncover the real pain point.",
    totalScore: "Total Score",
    summary: "Coach's Summary",
    strengths: "Top Strengths",
    flaws: "Major Flaws",
    breakdown: "Line-by-Line Breakdown",
    better: "Try asking instead:",
    newSession: "Start New Session"
  },
  zh: {
    titleSuccess: "恭喜通关！",
    titleFail: "挑战失败",
    subtitleSuccess: "你挖掘到了真相并给出了完美方案！",
    subtitleFail: "你没有挖掘到用户真正的痛点。",
    totalScore: "总分",
    summary: "教练总结",
    strengths: "主要优点",
    flaws: "主要不足",
    breakdown: "逐句分析",
    better: "试着这样问：",
    newSession: "开始新会话"
  }
};

const FeedbackModal: React.FC<FeedbackModalProps> = ({ result, onClose, lang }) => {
  const t = TEXT[lang];
  const isWin = result.isLevelCleared;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#58CC02] border-[#58CC02]'; 
    if (score >= 0) return 'text-[#FFC800] border-[#FFC800]';
    return 'text-[#FF4B4B] border-[#FF4B4B]'; 
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-[#58CC02]';
    if (score >= 0) return 'bg-[#FFC800]';
    return 'bg-[#FF4B4B]';
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className={`rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border-4 ${isWin ? 'border-[#58CC02] bg-[#f0fdf4]' : 'border-slate-200 bg-white'}`}>
        
        {/* Header */}
        <div className={`p-6 border-b-2 flex items-start justify-between shrink-0 ${isWin ? 'bg-[#58CC02] text-white border-[#46A302]' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl shadow-sm border-b-4 ${isWin ? 'bg-white/20 border-white/30' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
               {isWin ? <Trophy size={32} className="text-white" /> : <Frown size={32} />}
            </div>
            <div>
              <h2 className={`text-3xl font-black tracking-tight ${isWin ? 'text-white' : 'text-slate-700'}`}>
                {isWin ? t.titleSuccess : t.titleFail}
              </h2>
              <p className={`font-bold text-sm mt-1 opacity-90 ${isWin ? 'text-white' : 'text-slate-400'}`}>
                {isWin ? t.subtitleSuccess : t.subtitleFail}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${isWin ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-100 text-slate-400'}`}>
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 no-scrollbar">
          
          {/* Main Feedback Banner */}
          <div className={`mb-6 p-4 rounded-2xl border-2 ${isWin ? 'bg-green-100 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
             <p className="font-bold text-lg text-center">"{result.levelFeedback}"</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Summary */}
            <div className="lg:col-span-1 space-y-6">
              {/* Score Circle */}
              <div className="flex flex-col items-center bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center border-8 text-4xl font-black mb-4 shadow-sm ${getScoreColor(result.totalScore)}`}>
                  {result.totalScore}
                </div>
                <div className="text-center">
                   <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{t.totalScore}</span>
                </div>
              </div>

              {/* Summary Text */}
              <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm">
                 <h3 className="text-sm font-extrabold text-slate-700 uppercase mb-2">{t.summary}</h3>
                 <p className="text-slate-600 text-sm font-medium leading-relaxed italic">
                  "{result.summary}"
                </p>
              </div>

              {/* Key Stats */}
               <div className="space-y-3">
                  <div className="bg-green-50 p-4 rounded-2xl border-2 border-green-100">
                    <h4 className="flex items-center gap-2 text-xs font-extrabold text-green-600 uppercase tracking-wider mb-2">
                      <ThumbsUp size={14} /> {t.strengths}
                    </h4>
                    <ul className="space-y-1">
                      {result.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-green-800 font-bold">• {s}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-2xl border-2 border-red-100">
                    <h4 className="flex items-center gap-2 text-xs font-extrabold text-red-600 uppercase tracking-wider mb-2">
                      <ThumbsDown size={14} /> {t.flaws}
                    </h4>
                    <ul className="space-y-1">
                      {result.weaknesses.map((s, i) => (
                        <li key={i} className="text-sm text-red-800 font-bold">• {s}</li>
                      ))}
                    </ul>
                  </div>
               </div>
            </div>

            {/* Right Column: Line by Line */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-extrabold text-slate-700 px-2">{t.breakdown}</h3>
              
              {result.lineByLineAnalysis.map((item, index) => (
                <div key={index} className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm flex gap-4">
                   {/* Score Badge */}
                   <div className="shrink-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm ${getScoreBg(item.score)}`}>
                        {item.score > 0 ? `+${item.score}` : item.score}
                      </div>
                   </div>

                   {/* Content */}
                   <div className="flex-1 min-w-0">
                      <div className="mb-3 pb-3 border-b border-slate-100">
                        <p className="text-slate-800 font-bold text-base">"{item.originalText}"</p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          {item.score >= 0 
                            ? <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0"/> 
                            : <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0"/>
                          }
                          <p className={`text-sm font-bold ${item.score >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {item.reason}
                          </p>
                        </div>
                        
                        {item.betterAlternative && (
                          <div className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg">
                            <RefreshCw size={14} className="text-indigo-500 mt-1 shrink-0"/>
                            <div>
                              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wide">{t.better}</span>
                              <p className="text-sm text-indigo-600 font-bold italic">"{item.betterAlternative}"</p>
                            </div>
                          </div>
                        )}
                      </div>
                   </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t-2 border-slate-100 bg-white shrink-0 flex justify-end">
          <button 
            onClick={onClose}
            className="w-full md:w-auto px-8 py-4 bg-[#58CC02] text-white font-extrabold text-lg tracking-wide uppercase rounded-2xl border-b-4 border-[#46A302] hover:bg-[#46A302] active:border-b-0 active:translate-y-1 transition-all"
          >
            {t.newSession}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;