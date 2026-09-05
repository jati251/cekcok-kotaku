import { Card, HandEvaluation, Rank, Suit } from './types';

export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const RANK_VALUES: Record<Rank, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        suit,
        rank,
        value: RANK_VALUES[rank],
        id: `${rank}_${suit}`,
      });
    }
  }
  return shuffleDeck(deck);
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled;
}

// Generate all combinations of k items from array
function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length === 0) return [];
  const head = arr[0];
  const tail = arr.slice(1);
  const withHead = getCombinations(tail, k - 1).map((comb) => [head, ...comb]);
  const withoutHead = getCombinations(tail, k);
  return [...withHead, ...withoutHead];
}

// Evaluate exactly 5 cards
function evaluate5Cards(cards: Card[]): HandEvaluation {
  // Sort descending by value
  const sorted = [...cards].sort((a, b) => b.value - a.value);
  const values = sorted.map((c) => c.value);
  const suits = sorted.map((c) => c.suit);

  const isFlush = suits.every((s) => s === suits[0]);

  // Check straight
  let isStraight = false;
  let straightHigh = 0;

  // Normal straight check
  if (
    values[0] - values[1] === 1 &&
    values[1] - values[2] === 1 &&
    values[2] - values[3] === 1 &&
    values[3] - values[4] === 1
  ) {
    isStraight = true;
    straightHigh = values[0];
  } else if (
    // Ace-low straight (A, 5, 4, 3, 2)
    values[0] === 14 &&
    values[1] === 5 &&
    values[2] === 4 &&
    values[3] === 3 &&
    values[4] === 2
  ) {
    isStraight = true;
    straightHigh = 5; // Ace counts as 1
  }

  // Count frequencies
  const counts: Record<number, number> = {};
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
  }

  // Group by count and value
  const groups = Object.entries(counts).map(([v, count]) => ({
    value: Number(v),
    count,
  }));
  // Sort primarily by count descending, secondarily by value descending
  groups.sort((a, b) => b.count - a.count || b.value - a.value);

  // 1. Royal Flush & Straight Flush
  if (isFlush && isStraight) {
    if (straightHigh === 14) {
      return {
        rank: 'ROYAL_FLUSH',
        score: 10_000_000,
        name: 'Royal Flush',
        description: `Royal Flush (${suits[0]})`,
        best5: sorted,
      };
    }
    return {
      rank: 'STRAIGHT_FLUSH',
      score: 9_000_000 + straightHigh,
      name: 'Straight Flush',
      description: `Straight Flush (${sorted[0].rank} High)`,
      best5: sorted,
    };
  }

  // 2. Four of a Kind
  if (groups[0].count === 4) {
    const quadVal = groups[0].value;
    const kicker = groups[1].value;
    return {
      rank: 'FOUR_OF_A_KIND',
      score: 8_000_000 + quadVal * 100 + kicker,
      name: 'Four of a Kind',
      description: `Four of a Kind (${groups[0].value}s)`,
      best5: sorted,
    };
  }

  // 3. Full House
  if (groups[0].count === 3 && groups[1].count === 2) {
    const tripVal = groups[0].value;
    const pairVal = groups[1].value;
    return {
      rank: 'FULL_HOUSE',
      score: 7_000_000 + tripVal * 100 + pairVal,
      name: 'Full House',
      description: `Full House (${tripVal}s full of ${pairVal}s)`,
      best5: sorted,
    };
  }

  // 4. Flush
  if (isFlush) {
    const tiebreaker =
      values[0] * 10000 + values[1] * 1000 + values[2] * 100 + values[3] * 10 + values[4];
    return {
      rank: 'FLUSH',
      score: 6_000_000 + tiebreaker,
      name: 'Flush',
      description: `Flush (${sorted[0].rank} High)`,
      best5: sorted,
    };
  }

  // 5. Straight
  if (isStraight) {
    return {
      rank: 'STRAIGHT',
      score: 5_000_000 + straightHigh,
      name: 'Straight',
      description: `Straight (${straightHigh} High)`,
      best5: sorted,
    };
  }

  // 6. Three of a Kind
  if (groups[0].count === 3) {
    const tripVal = groups[0].value;
    const k1 = groups[1].value;
    const k2 = groups[2].value;
    return {
      rank: 'THREE_OF_A_KIND',
      score: 4_000_000 + tripVal * 1000 + k1 * 20 + k2,
      name: 'Three of a Kind',
      description: `Three of a Kind (${tripVal}s)`,
      best5: sorted,
    };
  }

  // 7. Two Pair
  if (groups[0].count === 2 && groups[1].count === 2) {
    const p1 = Math.max(groups[0].value, groups[1].value);
    const p2 = Math.min(groups[0].value, groups[1].value);
    const kicker = groups[2].value;
    return {
      rank: 'TWO_PAIR',
      score: 3_000_000 + p1 * 1000 + p2 * 50 + kicker,
      name: 'Two Pair',
      description: `Two Pair (${p1}s & ${p2}s)`,
      best5: sorted,
    };
  }

  // 8. One Pair
  if (groups[0].count === 2) {
    const pairVal = groups[0].value;
    const k1 = groups[1].value;
    const k2 = groups[2].value;
    const k3 = groups[3].value;
    return {
      rank: 'ONE_PAIR',
      score: 2_000_000 + pairVal * 10000 + k1 * 400 + k2 * 20 + k3,
      name: 'One Pair',
      description: `Pair of ${pairVal}s`,
      best5: sorted,
    };
  }

  // 9. High Card
  const tiebreaker =
    values[0] * 10000 + values[1] * 1000 + values[2] * 100 + values[3] * 10 + values[4];
  return {
    rank: 'HIGH_CARD',
    score: 1_000_000 + tiebreaker,
    name: 'High Card',
    description: `High Card (${sorted[0].rank})`,
    best5: sorted,
  };
}

// Given hole cards (2) and community cards (0..5), evaluate the best hand
export function evaluateBestHand(holeCards: Card[], communityCards: Card[]): HandEvaluation {
  const allCards = [...holeCards, ...communityCards];

  if (allCards.length < 5) {
    // If fewer than 5 cards available, return placeholder based on highest card or pair
    if (allCards.length >= 2 && allCards[0].value === allCards[1].value) {
      return {
        rank: 'ONE_PAIR',
        score: 2_000_000 + allCards[0].value * 10000,
        name: 'Pocket Pair',
        description: `Pocket Pair (${allCards[0].rank}s)`,
        best5: allCards,
      };
    }
    const highest = [...allCards].sort((a, b) => b.value - a.value)[0];
    return {
      rank: 'HIGH_CARD',
      score: highest ? 1_000_000 + highest.value : 0,
      name: highest ? `High Card ${highest.rank}` : 'Unknown',
      description: highest ? `High Card ${highest.rank}` : 'Waiting...',
      best5: allCards,
    };
  }

  const combinations = getCombinations(allCards, 5);
  let best: HandEvaluation | null = null;

  for (const comb of combinations) {
    const evalResult = evaluate5Cards(comb);
    if (!best || evalResult.score > best.score) {
      best = evalResult;
    }
  }

  return best!;
}
