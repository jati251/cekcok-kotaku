export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number; // 2..14 (Ace = 14)
  id: string;
}

export type HandRankType =
  | 'HIGH_CARD'
  | 'ONE_PAIR'
  | 'TWO_PAIR'
  | 'THREE_OF_A_KIND'
  | 'STRAIGHT'
  | 'FLUSH'
  | 'FULL_HOUSE'
  | 'FOUR_OF_A_KIND'
  | 'STRAIGHT_FLUSH'
  | 'ROYAL_FLUSH';

export interface HandEvaluation {
  rank: HandRankType;
  score: number; // Comparative numeric score for tiebreaks
  name: string;
  description: string;
  best5: Card[];
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isUser: boolean;
  chips: number;
  currentBet: number;
  totalBetRound: number;
  cards: Card[];
  folded: boolean;
  isAllIn: boolean;
  lastAction?: string;
  showCards?: boolean;
}

export type BettingRound = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export interface WinnerResult {
  player: Player;
  evaluation: HandEvaluation;
  amountWon: number;
}
