import React from 'react';
import { UserCheck, ShieldAlert, ArrowRight, Check } from 'lucide-react';
import { useQuestStore } from '../stores/questStore';
import { Button } from '../../../components/ui/Button';

export const DialogueModal: React.FC = () => {
  const { dialogue, nextDialogueStep } = useQuestStore();

  if (!dialogue.isOpen) return null;

  const currentMessage = dialogue.messages[dialogue.currentStep];
  const isLastStep = dialogue.currentStep >= dialogue.messages.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar Box */}
          <div className="relative flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 border-2 border-emerald-400/50 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
            {dialogue.avatar === 'general_castor' ? (
              <ShieldAlert className="w-10 h-10 text-amber-300" />
            ) : (
              <UserCheck className="w-10 h-10 text-emerald-200" />
            )}
            <div className="absolute -bottom-2 px-2 py-0.5 rounded bg-slate-950 text-[9px] font-bold text-slate-300 border border-slate-700 uppercase">
              Advisor
            </div>
          </div>

          {/* Dialogue Text */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-slate-100 font-tactical tracking-wider">
                {dialogue.speaker}
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                [Step {dialogue.currentStep + 1} of {dialogue.messages.length}]
              </span>
            </div>

            <p className="text-sm text-slate-200 mt-2 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              "{currentMessage}"
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <Button
            variant={isLastStep ? 'tactical' : 'primary'}
            size="md"
            icon={isLastStep ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            onClick={nextDialogueStep}
          >
            {isLastStep ? 'Understood, Sir!' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
};
