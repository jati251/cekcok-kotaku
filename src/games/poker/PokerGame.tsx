import React, { useState, useEffect, useRef } from 'react';
import { Card, Suit } from './types';
import {
  createInitialPokerState,
  startNewHand,
  applyPlayerAction,
  getAiDecision,
  PokerState,
} from './engine';
import { pokerAudio } from './audio';
import { evaluateBestHand } from './handEvaluator';

interface PokerGameProps {
  onBack: () => void;
}

export const PokerGame: React.FC<PokerGameProps> = ({ onBack }) => {
  const [state, setState] = useState<PokerState>(() => createInitialPokerState());
  const [raiseSliderValue, setRaiseSliderValue] = useState<number>(40);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [showAtmModal, setShowAtmModal] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => pokerAudio.isMuted());

  const hero = state.players[0];
  const isHeroTurn =
    state.roundActive &&
    state.currentRound !== 'showdown' &&
    state.currentTurnIdx === 0 &&
    !hero.folded &&
    !hero.isAllIn;

  const toCall = Math.max(0, state.currentHighestBet - (hero?.currentBet || 0));
  const minValidRaise = Math.min(
    hero.chips + hero.currentBet,
    state.currentHighestBet + state.minRaise
  );
  const maxValidRaise = hero.chips + hero.currentBet;

  // Auto-sync raise slider default when it becomes hero's turn
  const prevTurnRef = useRef(state.currentTurnIdx);
  useEffect(() => {
    if (isHeroTurn && prevTurnRef.current !== 0) {
      setRaiseSliderValue(minValidRaise);
    }
    prevTurnRef.current = state.currentTurnIdx;
  }, [isHeroTurn, minValidRaise, state.currentTurnIdx]);

  // AI Turn automation runner
  useEffect(() => {
    if (!state.roundActive || state.currentRound === 'showdown') return;
    const activePlayer = state.players[state.currentTurnIdx];
    if (!activePlayer || activePlayer.isUser || activePlayer.folded || activePlayer.isAllIn) return;

    const timer = setTimeout(() => {
      setState((curr) => {
        const currentActive = curr.players[curr.currentTurnIdx];
        if (!curr.roundActive || currentActive.isUser || currentActive.folded || currentActive.isAllIn) {
          return curr;
        }
        const decision = getAiDecision(curr);
        return applyPlayerAction(curr, decision.action, decision.raiseAmount);
      });
    }, 850 + Math.random() * 400);

    return () => clearTimeout(timer);
  }, [state.roundActive, state.currentTurnIdx, state.currentRound, state.players]);

  // Action handlers
  const handleStartHand = () => {
    setState((curr) => startNewHand(curr));
  };

  const handleHeroAction = (action: 'fold' | 'check' | 'call' | 'raise' | 'all-in', amount?: number) => {
    if (!isHeroTurn) return;
    setState((curr) => applyPlayerAction(curr, action, amount));
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    pokerAudio.setMuted(nextMute);
    setIsMuted(nextMute);
  };

  const handleAtmTopUp = () => {
    setState((curr) => ({
      ...curr,
      players: curr.players.map((p, idx) => (idx === 0 ? { ...p, chips: p.chips + 2000 } : p)),
      logs: ['Atm Kasino: Anda menerima bonus chips gratis sebesar $2,000!', ...curr.logs],
    }));
    setShowAtmModal(false);
    pokerAudio.playWinSound();
  };

  // Hero current hand evaluation preview
  const heroEvaluation =
    hero.cards.length === 2 ? evaluateBestHand(hero.cards, state.communityCards) : null;

  return (
    <div className="relative w-full min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-neutral-900/90 backdrop-blur-md border-b border-amber-900/40 z-20 shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-all text-sm font-medium border border-neutral-700 shadow-sm"
          >
            <span>←</span> Launcher
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">♠️</span>
            <div>
              <h1 className="text-base font-bold tracking-wide text-amber-400 leading-tight">
                TEXAS HOLD&apos;EM POKER
              </h1>
              <p className="text-xs text-neutral-400">High Stakes VIP Lounge • Tournament Edition</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-md bg-neutral-800/80 border border-neutral-700 text-xs">
            <span className="text-neutral-400">Blinds:</span>
            <span className="font-semibold text-emerald-400">
              ${state.smallBlind} / ${state.bigBlind}
            </span>
          </div>

          <button
            onClick={() => setShowAtmModal(true)}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-neutral-950 font-bold text-xs tracking-wide shadow-md hover:shadow-amber-500/20 transition-all flex items-center gap-1.5"
          >
            <span>🏦</span> Top Up Chips
          </button>

          <button
            onClick={() => setShowGuide(true)}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium border border-neutral-700 transition-all"
          >
            📖 Panduan
          </button>

          <button
            onClick={handleToggleMute}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm border border-neutral-700 transition-all"
            title={isMuted ? 'Unmute Suara' : 'Mute Suara'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      {/* Main Poker Arena */}
      <main className="flex-1 flex flex-col items-center justify-between p-4 md:p-6 max-w-7xl mx-auto w-full relative">
        {/* Table Felt Area */}
        <div className="relative w-full max-w-5xl my-auto aspect-[16/9] min-h-[480px] max-h-[640px] rounded-[140px] md:rounded-[200px] border-[14px] md:border-[18px] border-amber-950/80 bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-950 shadow-[inset_0_0_120px_rgba(0,0,0,0.85),0_20px_50px_rgba(0,0,0,0.9)] flex items-center justify-center p-6 border-double">
          {/* Subtle Inner Felt Line */}
          <div className="absolute inset-4 rounded-[120px] md:rounded-[180px] border-2 border-emerald-600/20 pointer-events-none" />

          {/* Table Center Watermark */}
          <div className="absolute flex flex-col items-center pointer-events-none opacity-20 select-none">
            <span className="text-6xl font-serif">♠ ♥ ♦ ♣</span>
            <span className="text-xs font-bold tracking-[0.3em] uppercase mt-1">High Roller Club</span>
          </div>

          {/* Seat Top: Dewi Poker (Player 2) */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
            <PlayerSeat
              player={state.players[2]}
              isCurrentTurn={state.roundActive && state.currentTurnIdx === 2}
              isDealer={state.dealerIdx === 2}
              isHero={false}
            />
          </div>

          {/* Seat Left: Sultan Andara (Player 1) */}
          <div className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 flex flex-col items-center z-10">
            <PlayerSeat
              player={state.players[1]}
              isCurrentTurn={state.roundActive && state.currentTurnIdx === 1}
              isDealer={state.dealerIdx === 1}
              isHero={false}
            />
          </div>

          {/* Seat Right: Budi Bluff (Player 3) */}
          <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 flex flex-col items-center z-10">
            <PlayerSeat
              player={state.players[3]}
              isCurrentTurn={state.roundActive && state.currentTurnIdx === 3}
              isDealer={state.dealerIdx === 3}
              isHero={false}
            />
          </div>

          {/* Center Community Board & Pot */}
          <div className="flex flex-col items-center gap-3 z-10">
            {/* Pot Badge */}
            <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-neutral-950/80 border border-amber-500/40 shadow-xl backdrop-blur-sm">
              <span className="text-amber-400 text-sm">🪙</span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300/90">Total Pot:</span>
              <span className="text-lg font-black text-amber-400 font-mono tracking-tight">
                ${state.pot.toLocaleString()}
              </span>
              {state.currentHighestBet > 0 && (
                <span className="text-xs text-neutral-400 border-l border-neutral-700 pl-2">
                  Call: ${state.currentHighestBet}
                </span>
              )}
            </div>

            {/* Round Name Tag */}
            <div className="text-[10px] font-black uppercase tracking-[0.25em] px-3 py-0.5 rounded bg-emerald-950/70 text-emerald-300/80 border border-emerald-700/30">
              {state.roundActive ? state.currentRound : 'MEJA SIAP'}
            </div>

            {/* Community Cards Display */}
            <div className="flex items-center gap-2 p-2 rounded-xl bg-neutral-950/40 border border-emerald-600/30 backdrop-blur-xs min-h-[90px] shadow-inner">
              {state.communityCards.length === 0 ? (
                <div className="flex gap-2 opacity-30">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-12 h-16 md:w-14 md:h-20 rounded-md border border-dashed border-emerald-400/40 flex items-center justify-center text-xs text-emerald-300"
                    >
                      ?
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex gap-2">
                  {state.communityCards.map((card) => (
                    <PlayingCardView key={card.id} card={card} />
                  ))}
                  {Array.from({ length: 5 - state.communityCards.length }).map((_, idx) => (
                    <div
                      key={`empty-${idx}`}
                      className="w-12 h-16 md:w-14 md:h-20 rounded-md border border-dashed border-emerald-500/30 bg-emerald-950/20"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Hand End Winner Announcement */}
            {state.winners && state.winners.length > 0 && (
              <div className="flex flex-col items-center animate-bounce mt-1">
                <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-neutral-950 font-black text-xs shadow-lg tracking-wide flex items-center gap-1.5">
                  <span>🏆</span>
                  <span>{state.winners.map((w) => `${w.player.name} (${w.evaluation.name})`).join(' & ')}</span>
                  <span>+${state.winners[0].amountWon}</span>
                </div>
              </div>
            )}
          </div>

          {/* Seat Bottom: Hero / You (Player 0) */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
            <PlayerSeat
              player={hero}
              isCurrentTurn={isHeroTurn}
              isDealer={state.dealerIdx === 0}
              isHero={true}
              heroEvaluation={heroEvaluation?.name}
            />
          </div>
        </div>

        {/* Action Controls & Commentary Footer */}
        <div className="w-full max-w-5xl mt-3 flex flex-col md:flex-row items-stretch gap-4 z-20">
          {/* Action Decision Panel */}
          <div className="flex-1 p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl flex flex-col justify-between gap-3">
            {/* Action Header / Turn Info */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isHeroTurn ? 'bg-emerald-400 animate-ping' : 'bg-neutral-600'
                  }`}
                />
                <span className="font-semibold text-neutral-300">
                  {isHeroTurn
                    ? '🎯 Giliran Anda! Tentukan taruhan Anda:'
                    : state.roundActive
                    ? `Menunggu giliran ${state.players[state.currentTurnIdx]?.name}...`
                    : 'Ronde selesai. Siap mulai tangan berikutnya?'}
                </span>
              </div>
              {heroEvaluation && (
                <div className="px-2.5 py-0.5 rounded bg-emerald-950 border border-emerald-600/40 text-emerald-300 font-bold text-[11px]">
                  Kombinasi Anda: {heroEvaluation.name}
                </div>
              )}
            </div>

            {/* Turn Buttons */}
            {isHeroTurn ? (
              <div className="flex flex-col gap-3">
                {/* Upper row: Fold, Check/Call */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleHeroAction('fold')}
                    className="py-2.5 px-4 rounded-xl bg-red-950/70 hover:bg-red-800/80 border border-red-700/60 text-red-200 font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
                  >
                    🚫 Fold (Tutup Kartu)
                  </button>

                  <button
                    onClick={() => handleHeroAction(toCall === 0 ? 'check' : 'call')}
                    className="py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-emerald-950 flex items-center justify-center gap-1"
                  >
                    {toCall === 0 ? (
                      '✅ Check'
                    ) : (
                      <>
                        <span>💰 Call</span>
                        <span className="font-mono text-emerald-100 font-normal">
                          (${Math.min(hero.chips, toCall)})
                        </span>
                      </>
                    )}
                  </button>

                  {/* Quick Preset Buttons */}
                  <button
                    disabled={hero.chips < toCall + state.minRaise}
                    onClick={() => {
                      const halfPot = Math.min(
                        maxValidRaise,
                        Math.max(minValidRaise, Math.floor(state.pot / 2) + state.currentHighestBet)
                      );
                      handleHeroAction('raise', halfPot);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:hover:bg-neutral-800 text-amber-300 font-bold text-xs border border-neutral-700 transition-all"
                  >
                    ½ Pot (${Math.floor(state.pot / 2)})
                  </button>

                  <button
                    onClick={() => handleHeroAction('all-in')}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    🔥 ALL IN (${hero.chips})
                  </button>
                </div>

                {/* Lower row: Slider & Raise */}
                <div className="flex items-center gap-3 bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800">
                  <span className="text-xs text-neutral-400 font-medium whitespace-nowrap">
                    Raise: <span className="text-amber-400 font-bold font-mono">${raiseSliderValue}</span>
                  </span>
                  <input
                    type="range"
                    min={minValidRaise}
                    max={maxValidRaise}
                    step={state.bigBlind}
                    value={raiseSliderValue}
                    onChange={(e) => setRaiseSliderValue(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-2 bg-neutral-800 rounded-lg"
                    disabled={hero.chips < toCall + state.minRaise}
                  />
                  <button
                    disabled={hero.chips < toCall + state.minRaise}
                    onClick={() => handleHeroAction('raise', raiseSliderValue)}
                    className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-neutral-950 font-black text-xs whitespace-nowrap shadow-md transition-all"
                  >
                    Konfirmasi Raise
                  </button>
                </div>
              </div>
            ) : !state.roundActive ? (
              <div className="flex items-center justify-center py-4">
                <button
                  onClick={handleStartHand}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-neutral-950 font-black text-base tracking-wide shadow-xl shadow-emerald-900/30 hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  <span>🃏</span>
                  <span>BAGI KARTU (MULAI TANGAN BARU)</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 text-sm text-neutral-400 italic">
                Para pemain sedang berhitung strategi...
              </div>
            )}
          </div>

          {/* Live Action History Log */}
          <div className="w-full md:w-80 h-36 md:h-auto p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl flex flex-col justify-between">
            <div className="text-xs font-bold text-neutral-400 pb-1.5 border-b border-neutral-800 flex items-center justify-between">
              <span>📜 Histori Permainan</span>
              <span className="text-[10px] text-neutral-500">Hand #{state.handNumber}</span>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 space-y-1 my-1.5 text-[11px] text-neutral-300 font-mono">
              {state.logs.slice(0, 6).map((log, idx) => (
                <div
                  key={idx}
                  className={`leading-tight py-0.5 ${
                    idx === 0 ? 'text-amber-300 font-semibold' : 'text-neutral-400'
                  }`}
                >
                  • {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h2 className="text-lg font-bold text-amber-400">📖 Urutan Kekuatan Kartu Poker (Hand Ranking)</h2>
              <button
                onClick={() => setShowGuide(false)}
                className="text-neutral-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs text-neutral-300">
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="font-bold text-amber-400">1. Royal Flush:</span> A-K-Q-J-10 dengan corak daun yang sama (Kartu tertinggi yang tak terkalahkan).
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="font-bold text-amber-400">2. Straight Flush:</span> 5 kartu berurutan dengan corak yang sama (misal 9-8-7-6-5 ♥️).
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="font-bold text-amber-400">3. Four of a Kind:</span> 4 kartu dengan angka sama (misal A-A-A-A-K).
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="font-bold text-amber-400">4. Full House:</span> 3 kartu sama + 2 kartu sama (misal K-K-K-8-8).
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="font-bold text-amber-400">5. Flush:</span> 5 kartu dengan corak sama, tidak perlu urut (misal 5 kartu daun ♠️).
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="font-bold text-amber-400">6. Straight:</span> 5 kartu berurutan beda corak (misal 5-6-7-8-9).
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="font-bold text-amber-400">7. Three of a Kind:</span> 3 kartu berangka sama (misal Q-Q-Q-7-2).
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="font-bold text-amber-400">8. Two Pair:</span> 2 pasang kartu kembar (misal J-J dan 4-4).
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="font-bold text-amber-400">9. One Pair:</span> 1 pasang kartu kembar (misal 10-10).
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="font-bold text-amber-400">10. High Card:</span> Tidak ada kombinasi, dinilai dari kartu tertinggi pemegang.
              </div>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold rounded-xl text-xs transition-all"
            >
              Tutup Panduan
            </button>
          </div>
        </div>
      )}

      {/* ATM Top Up Modal */}
      {showAtmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
            <span className="text-4xl">🏦</span>
            <h2 className="text-lg font-bold text-amber-400 mt-2">ATM Kasino VIP (Gratis)</h2>
            <p className="text-xs text-neutral-400 mt-1">
              Habis chips atau ingin menaikkan modal taruhan Anda? Ambil dana chips virtual gratis tanpa batas!
            </p>
            <div className="my-4 p-4 rounded-xl bg-neutral-950 border border-amber-500/30 text-2xl font-black text-amber-400 font-mono">
              +$2,000 CHIPS
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAtmModal(false)}
                className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300"
              >
                Batal
              </button>
              <button
                onClick={handleAtmTopUp}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-bold text-xs shadow-md"
              >
                Ambil Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent: Player Seat
interface PlayerSeatProps {
  player: PokerState['players'][0];
  isCurrentTurn: boolean;
  isDealer: boolean;
  isHero: boolean;
  heroEvaluation?: string;
}

const PlayerSeat: React.FC<PlayerSeatProps> = ({
  player,
  isCurrentTurn,
  isDealer,
  isHero,
  heroEvaluation,
}) => {
  return (
    <div className="flex flex-col items-center">
      {/* Cards container */}
      <div className="flex items-center gap-1 mb-1.5 min-h-[70px]">
        {player.cards.length === 0 ? (
          <div className="flex gap-1 opacity-20">
            <div className="w-10 h-14 md:w-12 md:h-16 rounded border border-dashed border-neutral-400" />
            <div className="w-10 h-14 md:w-12 md:h-16 rounded border border-dashed border-neutral-400" />
          </div>
        ) : (
          player.cards.map((c, i) => (
            <PlayingCardView
              key={c.id || i}
              card={c}
              hidden={!player.showCards}
              folded={player.folded}
            />
          ))
        )}
      </div>

      {/* Player badge & chip status */}
      <div
        className={`relative flex items-center gap-2 px-3 py-1.5 rounded-2xl backdrop-blur-md transition-all shadow-lg ${
          isCurrentTurn
            ? 'bg-amber-500/20 border-2 border-amber-400 ring-4 ring-amber-400/20 scale-105'
            : player.folded
            ? 'bg-neutral-950/70 border border-neutral-800 opacity-50 grayscale'
            : 'bg-neutral-950/80 border border-neutral-700'
        }`}
      >
        {/* Dealer Button */}
        {isDealer && (
          <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-white text-neutral-950 font-black text-[10px] flex items-center justify-center shadow-md border border-neutral-300">
            D
          </span>
        )}

        <span className="text-lg">{player.avatar}</span>

        <div className="flex flex-col text-left leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-neutral-100">{player.name}</span>
            {player.isAllIn && (
              <span className="px-1 py-0.2 rounded bg-red-600 text-white font-black text-[9px] uppercase tracking-wider animate-pulse">
                ALL-IN
              </span>
            )}
          </div>
          <span className="text-xs font-mono font-bold text-amber-400">
            ${player.chips.toLocaleString()}
          </span>
        </div>

        {/* Current bet pill */}
        {player.currentBet > 0 && (
          <div className="ml-1 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-[10px] font-mono font-bold text-amber-300">
            ${player.currentBet}
          </div>
        )}
      </div>

      {/* Last Action / Hand Evaluation note */}
      {player.lastAction && !player.folded && (
        <span className="text-[10px] font-bold text-emerald-400 mt-1 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/40">
          {player.lastAction}
        </span>
      )}
      {player.folded && (
        <span className="text-[10px] font-semibold text-neutral-500 mt-1">Folded</span>
      )}
      {isHero && heroEvaluation && (
        <span className="text-[10px] font-bold text-amber-300 mt-0.5 drop-shadow">
          {heroEvaluation}
        </span>
      )}
    </div>
  );
};

// Subcomponent: Playing Card View
interface PlayingCardViewProps {
  card: Card;
  hidden?: boolean;
  folded?: boolean;
}

const SUIT_ICONS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const PlayingCardView: React.FC<PlayingCardViewProps> = ({ card, hidden = false, folded = false }) => {
  if (hidden) {
    return (
      <div
        className={`w-11 h-15 md:w-13 md:h-18 rounded-lg bg-gradient-to-br from-blue-950 to-indigo-950 border-2 border-amber-400/40 shadow-md flex items-center justify-center transition-all ${
          folded ? 'opacity-40' : ''
        }`}
      >
        <div className="w-8 h-12 rounded border border-amber-400/20 flex items-center justify-center text-[10px] text-amber-400/40 font-serif">
          ♠
        </div>
      </div>
    );
  }

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const icon = SUIT_ICONS[card.suit];

  return (
    <div
      className={`w-11 h-15 md:w-13 md:h-18 rounded-lg bg-white border border-neutral-300 shadow-md p-1 flex flex-col justify-between transition-all ${
        folded ? 'opacity-40 grayscale' : 'hover:-translate-y-1'
      }`}
    >
      <div className={`text-[11px] md:text-xs font-black leading-none ${isRed ? 'text-red-600' : 'text-neutral-900'}`}>
        {card.rank}
        <span className="text-[10px] ml-0.5">{icon}</span>
      </div>

      <div className={`text-base md:text-lg text-center leading-none ${isRed ? 'text-red-600' : 'text-neutral-900'}`}>
        {icon}
      </div>

      <div className={`text-[9px] md:text-[10px] font-black leading-none rotate-180 self-end ${isRed ? 'text-red-600' : 'text-neutral-900'}`}>
        {card.rank}
      </div>
    </div>
  );
};
