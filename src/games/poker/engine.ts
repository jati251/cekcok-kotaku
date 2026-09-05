import { Card, Player, BettingRound, WinnerResult } from './types';
import { createDeck, evaluateBestHand } from './handEvaluator';
import { pokerAudio } from './audio';

export const INITIAL_PLAYERS: Omit<Player, 'cards' | 'currentBet' | 'totalBetRound' | 'folded' | 'isAllIn'>[] = [
  { id: 'p_hero', name: 'Anda (Hero)', avatar: '👑', isUser: true, chips: 2000 },
  { id: 'p_sultan', name: 'Sultan Andara', avatar: '🤑', isUser: false, chips: 2500 },
  { id: 'p_dewi', name: 'Dewi Poker', avatar: '💃', isUser: false, chips: 1800 },
  { id: 'p_budi', name: 'Budi Bluff', avatar: '🕶️', isUser: false, chips: 2200 },
];

export interface PokerState {
  players: Player[];
  communityCards: Card[];
  pot: number;
  currentRound: BettingRound;
  dealerIdx: number;
  currentTurnIdx: number;
  currentHighestBet: number;
  minRaise: number;
  smallBlind: number;
  bigBlind: number;
  deck: Card[];
  winners: WinnerResult[] | null;
  handNumber: number;
  logs: string[];
  isAiThinking: boolean;
  roundActive: boolean;
}

export function createInitialPokerState(): PokerState {
  const players: Player[] = INITIAL_PLAYERS.map((p) => ({
    ...p,
    cards: [],
    currentBet: 0,
    totalBetRound: 0,
    folded: false,
    isAllIn: false,
    showCards: false,
  }));

  return {
    players,
    communityCards: [],
    pot: 0,
    currentRound: 'preflop',
    dealerIdx: 0,
    currentTurnIdx: 0,
    currentHighestBet: 0,
    minRaise: 20,
    smallBlind: 10,
    bigBlind: 20,
    deck: [],
    winners: null,
    handNumber: 0,
    logs: ['Selamat datang di Texas Hold\'em High Stakes Casino! Klik "Bagi Kartu" untuk mulai.'],
    isAiThinking: false,
    roundActive: false,
  };
}

export function startNewHand(prev: PokerState): PokerState {
  // Ensure players have chips. If broke, reload
  const players: Player[] = prev.players.map((p) => {
    let chips = p.chips;
    if (chips < prev.bigBlind) {
      chips = 1500; // auto reload bankrupt players
    }
    return {
      ...p,
      chips,
      cards: [],
      currentBet: 0,
      totalBetRound: 0,
      folded: false,
      isAllIn: false,
      showCards: p.isUser,
      lastAction: undefined,
    };
  });

  const nextDealerIdx = (prev.dealerIdx + 1) % players.length;
  const sbIdx = (nextDealerIdx + 1) % players.length;
  const bbIdx = (nextDealerIdx + 2) % players.length;
  const utgIdx = (nextDealerIdx + 3) % players.length;

  let deck = createDeck();
  pokerAudio.playCardDeal();

  // Deal 2 cards to each active player
  for (const p of players) {
    p.cards = [deck.pop()!, deck.pop()!];
  }

  // Blinds deduction
  const sbAmount = Math.min(players[sbIdx].chips, prev.smallBlind);
  players[sbIdx].chips -= sbAmount;
  players[sbIdx].currentBet = sbAmount;
  players[sbIdx].totalBetRound = sbAmount;
  players[sbIdx].lastAction = `SB $${sbAmount}`;
  if (players[sbIdx].chips === 0) players[sbIdx].isAllIn = true;

  const bbAmount = Math.min(players[bbIdx].chips, prev.bigBlind);
  players[bbIdx].chips -= bbAmount;
  players[bbIdx].currentBet = bbAmount;
  players[bbIdx].totalBetRound = bbAmount;
  players[bbIdx].lastAction = `BB $${bbAmount}`;
  if (players[bbIdx].chips === 0) players[bbIdx].isAllIn = true;

  const initialPot = sbAmount + bbAmount;

  return {
    ...prev,
    players,
    communityCards: [],
    pot: initialPot,
    currentRound: 'preflop',
    dealerIdx: nextDealerIdx,
    currentTurnIdx: utgIdx,
    currentHighestBet: bbAmount,
    minRaise: prev.bigBlind,
    deck,
    winners: null,
    handNumber: prev.handNumber + 1,
    isAiThinking: false,
    roundActive: true,
    logs: [
      `Hand #${prev.handNumber + 1} dimulai. Dealer: ${players[nextDealerIdx].name}.`,
      `${players[sbIdx].name} Small Blind ($${sbAmount}), ${players[bbIdx].name} Big Blind ($${bbAmount}).`,
    ],
  };
}

// Check if current betting round is complete
function isBettingRoundComplete(state: PokerState): boolean {
  const activePlayers = state.players.filter((p) => !p.folded);
  if (activePlayers.length <= 1) return true;

  // If all active players are all-in or have matched the current highest bet
  const canActPlayers = activePlayers.filter((p) => !p.isAllIn);
  if (canActPlayers.length <= 1) {
    // If only 1 or 0 players can act, everyone else is all-in, round is done
    const nonAllIn = canActPlayers[0];
    if (!nonAllIn || nonAllIn.currentBet === state.currentHighestBet) {
      return true;
    }
  }

  return canActPlayers.every((p) => p.currentBet === state.currentHighestBet && p.lastAction !== undefined);
}

// Advance to next street (Flop, Turn, River, Showdown)
export function advanceStreet(state: PokerState): PokerState {
  const activePlayers = state.players.filter((p) => !p.folded);

  // If only 1 player remains, they win pot immediately
  if (activePlayers.length === 1) {
    const winner = activePlayers[0];
    winner.chips += state.pot;
    pokerAudio.playWinSound();
    return {
      ...state,
      winners: [
        {
          player: winner,
          evaluation: evaluateBestHand(winner.cards, state.communityCards),
          amountWon: state.pot,
        },
      ],
      currentRound: 'showdown',
      roundActive: false,
      logs: [`${winner.name} memenangkan pot sebesar $${state.pot} karena semua lawan fold!`, ...state.logs],
    };
  }

  // Reset bets for next betting round
  const nextPlayers = state.players.map((p) => ({
    ...p,
    currentBet: 0,
    lastAction: p.folded ? 'Fold' : p.isAllIn ? 'All-In' : undefined,
  }));

  const deck = [...state.deck];
  const communityCards = [...state.communityCards];
  let nextRound: BettingRound = state.currentRound;

  if (state.currentRound === 'preflop') {
    nextRound = 'flop';
    deck.pop(); // Burn 1 card
    communityCards.push(deck.pop()!, deck.pop()!, deck.pop()!);
    pokerAudio.playCardDeal();
  } else if (state.currentRound === 'flop') {
    nextRound = 'turn';
    deck.pop(); // Burn 1 card
    communityCards.push(deck.pop()!);
    pokerAudio.playCardDeal();
  } else if (state.currentRound === 'turn') {
    nextRound = 'river';
    deck.pop(); // Burn 1 card
    communityCards.push(deck.pop()!);
    pokerAudio.playCardDeal();
  } else if (state.currentRound === 'river') {
    // Showdown!
    return resolveShowdown({
      ...state,
      players: nextPlayers,
      deck,
      communityCards,
      currentRound: 'showdown',
    });
  }

  // Check if everyone is all-in, fast-forward to showdown
  const canActPlayers = nextPlayers.filter((p) => !p.folded && !p.isAllIn);
  if (canActPlayers.length <= 1) {
    // Fast advance
    const intermediateState: PokerState = {
      ...state,
      players: nextPlayers,
      deck,
      communityCards,
      currentRound: nextRound,
      currentHighestBet: 0,
      minRaise: state.bigBlind,
    };
    return advanceStreet(intermediateState);
  }

  // First active player after dealer gets first action
  let nextTurn = (state.dealerIdx + 1) % nextPlayers.length;
  while (nextPlayers[nextTurn].folded || nextPlayers[nextTurn].isAllIn) {
    nextTurn = (nextTurn + 1) % nextPlayers.length;
  }

  return {
    ...state,
    players: nextPlayers,
    deck,
    communityCards,
    currentRound: nextRound,
    currentTurnIdx: nextTurn,
    currentHighestBet: 0,
    minRaise: state.bigBlind,
    logs: [`Masuk ronde ${nextRound.toUpperCase()}. Kartu meja dibuka.`, ...state.logs],
  };
}

// Showdown resolution
function resolveShowdown(state: PokerState): PokerState {
  const activePlayers = state.players.filter((p) => !p.folded);

  // Reveal all active cards
  const players = state.players.map((p) => ({
    ...p,
    showCards: !p.folded ? true : p.showCards,
  }));

  const evaluations = activePlayers.map((p) => ({
    player: p,
    evaluation: evaluateBestHand(p.cards, state.communityCards),
  }));

  // Sort by score descending
  evaluations.sort((a, b) => b.evaluation.score - a.evaluation.score);

  const highestScore = evaluations[0].evaluation.score;
  const bestWinners = evaluations.filter((e) => e.evaluation.score === highestScore);

  const potShare = Math.floor(state.pot / bestWinners.length);
  const winners: WinnerResult[] = bestWinners.map((w) => {
    // Credit chips to player
    const p = players.find((pl) => pl.id === w.player.id)!;
    p.chips += potShare;
    return {
      player: p,
      evaluation: w.evaluation,
      amountWon: potShare,
    };
  });

  pokerAudio.playWinSound();

  const winnerNames = winners.map((w) => `${w.player.name} (${w.evaluation.name})`).join(' & ');
  const winLog = `🏆 SHOWDOWN: ${winnerNames} memenangkan pot $${state.pot}!`;

  return {
    ...state,
    players,
    winners,
    currentRound: 'showdown',
    roundActive: false,
    logs: [winLog, ...state.logs],
  };
}

// Move to next player's turn
function moveToNextPlayer(state: PokerState): PokerState {
  if (isBettingRoundComplete(state)) {
    return advanceStreet(state);
  }

  let nextIdx = (state.currentTurnIdx + 1) % state.players.length;
  let count = 0;
  while ((state.players[nextIdx].folded || state.players[nextIdx].isAllIn) && count < state.players.length) {
    nextIdx = (nextIdx + 1) % state.players.length;
    count++;
  }

  return {
    ...state,
    currentTurnIdx: nextIdx,
  };
}

// Execute player action (Fold, Check, Call, Bet, Raise, All-In)
export function applyPlayerAction(
  state: PokerState,
  action: 'fold' | 'check' | 'call' | 'raise' | 'all-in',
  raiseAmount?: number
): PokerState {
  const player = state.players[state.currentTurnIdx];
  if (!player || player.folded || player.isAllIn) return state;

  const toCall = state.currentHighestBet - player.currentBet;
  let newPot = state.pot;
  let newHighestBet = state.currentHighestBet;
  let newMinRaise = state.minRaise;
  let actionDesc = '';

  const updatedPlayers = state.players.map((p, idx) => {
    if (idx !== state.currentTurnIdx) return p;

    const updated = { ...p };

    if (action === 'fold') {
      updated.folded = true;
      updated.lastAction = 'Fold';
      actionDesc = `${p.name} melakukan Fold.`;
      pokerAudio.playFoldSound();
    } else if (action === 'check') {
      updated.lastAction = 'Check';
      actionDesc = `${p.name} Check.`;
      pokerAudio.playCheckSound();
    } else if (action === 'call') {
      const callChips = Math.min(updated.chips, toCall);
      updated.chips -= callChips;
      updated.currentBet += callChips;
      updated.totalBetRound += callChips;
      newPot += callChips;
      if (updated.chips === 0) {
        updated.isAllIn = true;
        updated.lastAction = 'All-In';
        actionDesc = `${p.name} Call All-In ($${callChips})!`;
        pokerAudio.playAllInSound();
      } else {
        updated.lastAction = `Call $${toCall}`;
        actionDesc = `${p.name} Call $${toCall}.`;
        pokerAudio.playChipSound();
      }
    } else if (action === 'raise' || action === 'all-in') {
      const targetBet = action === 'all-in'
        ? updated.currentBet + updated.chips
        : Math.max(state.currentHighestBet + state.minRaise, raiseAmount || state.currentHighestBet + state.minRaise);

      const added = Math.min(updated.chips, targetBet - updated.currentBet);
      updated.chips -= added;
      updated.currentBet += added;
      updated.totalBetRound += added;
      newPot += added;

      const raiseDiff = updated.currentBet - state.currentHighestBet;
      if (raiseDiff > newMinRaise) {
        newMinRaise = raiseDiff;
      }
      newHighestBet = updated.currentBet;

      if (updated.chips === 0) {
        updated.isAllIn = true;
        updated.lastAction = 'All-In';
        actionDesc = `🔥 ${p.name} ALL-IN sebesar $${updated.currentBet}!`;
        pokerAudio.playAllInSound();
      } else {
        updated.lastAction = `Raise $${updated.currentBet}`;
        actionDesc = `${p.name} Raise ke $${updated.currentBet}.`;
        pokerAudio.playChipSound();
      }
    }

    return updated;
  });

  const nextState: PokerState = {
    ...state,
    players: updatedPlayers,
    pot: newPot,
    currentHighestBet: newHighestBet,
    minRaise: newMinRaise,
    logs: [actionDesc, ...state.logs],
  };

  // Check if hand ended (only 1 remaining)
  const nonFolded = nextState.players.filter((p) => !p.folded);
  if (nonFolded.length === 1) {
    return advanceStreet(nextState);
  }

  return moveToNextPlayer(nextState);
}

// AI Bot decision engine
export function getAiDecision(state: PokerState): { action: 'fold' | 'check' | 'call' | 'raise' | 'all-in'; raiseAmount?: number } {
  const bot = state.players[state.currentTurnIdx];
  const toCall = state.currentHighestBet - bot.currentBet;
  const evalResult = evaluateBestHand(bot.cards, state.communityCards);

  // Hole card score preflop
  if (state.currentRound === 'preflop') {
    const isPair = bot.cards[0]?.rank === bot.cards[1]?.rank;
    const isHighCard = bot.cards.some((c) => c.value >= 12);
    const maxVal = Math.max(bot.cards[0]?.value || 0, bot.cards[1]?.value || 0);

    if (toCall === 0) {
      if (isPair || (bot.cards[0]?.value >= 13 && bot.cards[1]?.value >= 10)) {
        return Math.random() < 0.6 ? { action: 'raise', raiseAmount: state.bigBlind * 3 } : { action: 'check' };
      }
      return { action: 'check' };
    }

    // Facing bet
    if (isPair && maxVal >= 10) {
      return Math.random() < 0.4 ? { action: 'raise', raiseAmount: state.currentHighestBet + state.minRaise * 2 } : { action: 'call' };
    }
    if (isPair || (isHighCard && toCall <= state.bigBlind * 3)) {
      return { action: 'call' };
    }
    if (toCall <= state.bigBlind) {
      return { action: 'call' };
    }
    // Aggressive bluff bot
    if (bot.id === 'p_budi' && Math.random() < 0.25) {
      return { action: 'raise', raiseAmount: state.currentHighestBet + state.minRaise };
    }
    return { action: 'fold' };
  }

  // Postflop decision
  const rank = evalResult.rank;

  if (toCall === 0) {
    if (['FULL_HOUSE', 'FOUR_OF_A_KIND', 'STRAIGHT_FLUSH', 'ROYAL_FLUSH', 'FLUSH', 'STRAIGHT'].includes(rank)) {
      // Monster hand - bet for value or slow-play
      return Math.random() < 0.75
        ? { action: 'raise', raiseAmount: Math.max(state.minRaise, Math.floor(state.pot * 0.6)) }
        : { action: 'check' };
    }
    if (['THREE_OF_A_KIND', 'TWO_PAIR'].includes(rank)) {
      return Math.random() < 0.6
        ? { action: 'raise', raiseAmount: Math.max(state.minRaise, Math.floor(state.pot * 0.4)) }
        : { action: 'check' };
    }
    if (rank === 'ONE_PAIR' && Math.random() < 0.3) {
      return { action: 'raise', raiseAmount: state.minRaise };
    }
    return { action: 'check' };
  }

  // Facing a bet
  if (['FULL_HOUSE', 'FOUR_OF_A_KIND', 'STRAIGHT_FLUSH', 'ROYAL_FLUSH'].includes(rank)) {
    // Reraise or All-In!
    return Math.random() < 0.6
      ? { action: 'raise', raiseAmount: state.currentHighestBet + state.minRaise * 3 }
      : { action: 'call' };
  }

  if (['FLUSH', 'STRAIGHT', 'THREE_OF_A_KIND'].includes(rank)) {
    if (toCall < bot.chips * 0.5) {
      return Math.random() < 0.4
        ? { action: 'raise', raiseAmount: state.currentHighestBet + state.minRaise * 2 }
        : { action: 'call' };
    }
    return { action: 'call' };
  }

  if (rank === 'TWO_PAIR') {
    if (toCall < bot.chips * 0.4) return { action: 'call' };
    return Math.random() < 0.5 ? { action: 'call' } : { action: 'fold' };
  }

  if (rank === 'ONE_PAIR') {
    if (toCall <= state.bigBlind * 2 || toCall < state.pot * 0.25) return { action: 'call' };
    return Math.random() < 0.3 ? { action: 'call' } : { action: 'fold' };
  }

  // High card or missed draw
  if (toCall <= state.bigBlind && Math.random() < 0.4) {
    return { action: 'call' };
  }

  // Bluff opportunity
  if (bot.id === 'p_budi' && Math.random() < 0.15 && toCall < state.pot * 0.5) {
    return { action: 'raise', raiseAmount: state.currentHighestBet + state.minRaise };
  }

  return { action: 'fold' };
}
