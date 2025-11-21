import React from 'react';
import { Persona } from '../types';
import { User, Briefcase, AlertCircle, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface PersonaCardProps {
  persona: Persona;
  isExpanded: boolean;
  toggleExpand: () => void;
}

const PersonaCard: React.FC<PersonaCardProps> = ({ persona, isExpanded, toggleExpand }) => {
  return (
    <div className="bg-white border-b-2 border-slate-200 z-10">
      <div 
        className="px-4 py-3 cursor-pointer flex items-center justify-between hover:bg-slate-50 transition-colors"
        onClick={toggleExpand}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#58CC02] border-b-4 border-[#46A302] rounded-xl flex items-center justify-center text-white shadow-sm">
            <User size={24} />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-700 text-lg">{persona.name}</h2>
            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-400">
              <Briefcase size={14} />
              <span>{persona.role}</span>
            </div>
          </div>
        </div>
        
        <div className="text-slate-400">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 bg-white text-sm space-y-4 animate-in slide-in-from-top-2">
           <div className="p-4 bg-blue-50 border-2 border-blue-100 rounded-xl text-blue-800">
             <h3 className="font-extrabold mb-1 flex items-center gap-2 uppercase tracking-wide text-xs opacity-70">
                <AlertCircle size={14}/> Stated Problem
             </h3>
             <p className="font-semibold leading-relaxed">{persona.problem}</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
               <span className="block text-xs font-extrabold text-slate-400 uppercase tracking-wide mb-1">Stated Solution</span>
               <p className="text-slate-600 font-medium">{persona.currentSolution}</p>
             </div>
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
               <span className="block text-xs font-extrabold text-slate-400 uppercase tracking-wide mb-1">Context</span>
               <p className="text-slate-600 font-medium italic">{persona.context}</p>
             </div>
           </div>

           {/* Hint about hidden info */}
           <div className="flex items-center gap-2 text-xs text-slate-400 font-bold bg-slate-50 p-2 rounded-lg justify-center">
              <HelpCircle size={12}/>
              <span>Dig deeper to find their specific workflow & emotional triggers!</span>
           </div>
        </div>
      )}
    </div>
  );
};

export default PersonaCard;