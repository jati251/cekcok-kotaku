// Order dispatching, customer archetypes, fleet kinematics, and tip combos for Pizza Frenzy Deluxe
import {
  CustomerOrder,
  DeliveryScooter,
  Pizzeria,
  CityBuilding,
  Particle,
  PizzaGameState,
  DistrictDefinition,
  VEHICLE_CONFIGS,
  PIZZA_CONFIGS,
} from './types';
import { pizzaAudio } from './audio';

export class PizzaPhysics {
  // --- 1. Order Spawning ---
  public static spawnOrder(
    buildings: CityBuilding[],
    orders: CustomerOrder[],
    district: DistrictDefinition,
    day: number
  ): CustomerOrder | null {
    const occupiedBuildingIds = new Set(orders.map((o) => o.buildingId));
    const available = buildings.filter((b) => !occupiedBuildingIds.has(b.id));
    if (available.length === 0) return null;

    const building = available[Math.floor(Math.random() * available.length)];
    const availableToppings = district.unlockedToppings;
    const topping = availableToppings[Math.floor(Math.random() * availableToppings.length)];

    // Customer Archetype Randomizer
    const roll = Math.random();
    let kind: 'regular' | 'vip' | 'prankster' | 'thief' | 'speedy' = 'regular';
    let customerName = 'Hungry Citizen';
    let avatarIcon = '🍕';
    let tipMult = 1.0;

    if (roll < 0.14) {
      kind = 'vip';
      customerName = 'Movie Star VIP';
      avatarIcon = '⭐';
      tipMult = 3.0;
    } else if (roll < 0.24 && day > 1) {
      kind = 'prankster';
      customerName = 'Prank Caller Kid';
      avatarIcon = '😈';
      tipMult = 0;
    } else if (roll < 0.32 && day > 2) {
      kind = 'thief';
      customerName = 'Sneaky Pizza Burglar';
      avatarIcon = '🦹';
      tipMult = 0;
    } else if (roll < 0.42) {
      kind = 'speedy';
      customerName = 'Rush Hour Commuter';
      avatarIcon = '⚡';
      tipMult = 1.8;
    }

    const basePatience = Math.max(8, 16 - district.districtNumber * 1.5);
    const maxPatience = kind === 'speedy' ? basePatience * 0.6 : kind === 'vip' ? basePatience * 0.85 : basePatience;

    pizzaAudio.playPhoneRing();

    return {
      id: Math.random().toString(36).substring(2, 9),
      buildingId: building.id,
      type: topping,
      customerKind: kind,
      customerName,
      avatarIcon,
      x: building.x,
      y: building.y,
      patience: 1.0,
      maxPatience,
      points: PIZZA_CONFIGS[topping].basePoints,
      tipMultiplier: tipMult,
    };
  }

  // --- 2. Order Dispatching ---
  public static dispatchOrder(
    pizzeria: Pizzeria,
    order: CustomerOrder,
    orders: CustomerOrder[],
    scooters: DeliveryScooter[],
    particles: Particle[],
    state: PizzaGameState
  ) {
    // 1. Check matching pizza topping
    if (pizzeria.type !== order.type) {
      pizzaAudio.playBuzzer();
      state.comboStreak = 0;
      state.isFrenzyActive = false;

      particles.push({
        x: order.x,
        y: order.y - 25,
        vx: 0,
        vy: -35,
        life: 0.9,
        maxLife: 0.9,
        color: '#ef4444',
        type: 'text',
        text: 'WRONG PIZZA!',
      });
      return;
    }

    // 2. Prankster Encounter
    if (order.customerKind === 'prankster') {
      pizzaAudio.playBuzzer();
      state.comboStreak = 0;
      const idx = orders.findIndex((o) => o.id === order.id);
      if (idx !== -1) orders.splice(idx, 1);

      particles.push({
        x: order.x,
        y: order.y - 25,
        vx: 0,
        vy: -35,
        life: 1.0,
        maxLife: 1.0,
        color: '#f97316',
        type: 'text',
        text: '😈 PRANKSTER BUSTED!',
      });
      return;
    }

    // 3. Thief Encounter
    if (order.customerKind === 'thief') {
      pizzaAudio.playPoliceSiren();
      state.thievesBusted += 1;
      state.cash += 200;
      state.score += 200;
      const idx = orders.findIndex((o) => o.id === order.id);
      if (idx !== -1) orders.splice(idx, 1);

      particles.push({
        x: order.x,
        y: order.y - 30,
        vx: 0,
        vy: -40,
        life: 1.2,
        maxLife: 1.2,
        color: '#38bdf8',
        type: 'text',
        text: '🚨 THIEF APPREHENDED! +$200',
      });
      return;
    }

    // 4. Successful Delivery Dispatch
    const tier = state.upgrades.vehicleTier;
    const speed = VEHICLE_CONFIGS[tier].speed;

    pizzaAudio.playScooterThrottle();
    pizzaAudio.playOvenBell();

    scooters.push({
      id: Math.random().toString(36).substring(2, 9),
      pizzeriaId: pizzeria.id,
      orderId: order.id,
      tier,
      startX: pizzeria.x,
      startY: pizzeria.y,
      targetX: order.x,
      targetY: order.y,
      x: pizzeria.x,
      y: pizzeria.y,
      progress: 0,
      speed,
      color: pizzeria.color,
      trailTimer: 0,
    });
  }

  // --- 3. Vehicle Kinematics ---
  public static updateScooters(
    scooters: DeliveryScooter[],
    orders: CustomerOrder[],
    particles: Particle[],
    state: PizzaGameState,
    dt: number
  ) {
    for (let i = scooters.length - 1; i >= 0; i--) {
      const s = scooters[i];
      const dist = Math.hypot(s.targetX - s.startX, s.targetY - s.startY);
      const step = (s.speed / Math.max(1, dist)) * dt;
      s.progress += step;

      s.x = s.startX + (s.targetX - s.startX) * Math.min(1, s.progress);
      s.y = s.startY + (s.targetY - s.startY) * Math.min(1, s.progress);

      // Exhaust Smoke Particles
      s.trailTimer += dt;
      if (s.trailTimer > 0.08) {
        s.trailTimer = 0;
        particles.push({
          x: s.x,
          y: s.y,
          vx: (Math.random() - 0.5) * 15,
          vy: (Math.random() - 0.5) * 15,
          life: 0.35,
          maxLife: 0.35,
          color: s.tier === 'chopper' ? '#38bdf8' : 'rgba(203, 213, 225, 0.6)',
          type: 'smoke',
          size: 3,
        });
      }

      // Reached Customer Target
      if (s.progress >= 1) {
        scooters.splice(i, 1);
        const oIdx = orders.findIndex((o) => o.id === s.orderId);

        if (oIdx !== -1) {
          const order = orders[oIdx];
          orders.splice(oIdx, 1);

          // Calculate Earnings with Combo Streaks & VIP Multipliers
          state.comboStreak += 1;
          if (state.comboStreak >= 3) {
            state.isFrenzyActive = true;
            state.frenzyTimer = 6.0;
          }

          const streakMult = Math.min(4, 1 + (state.comboStreak - 1) * 0.3);
          const earned = Math.round(order.points * order.tipMultiplier * streakMult);

          state.cash += earned;
          state.score += earned;
          state.ordersDelivered += 1;

          pizzaAudio.playCashRegister();

          // Confetti for VIP or High Streaks
          if (order.customerKind === 'vip' || state.comboStreak >= 4) {
            pizzaAudio.playFanfare();
            const colors = ['#f59e0b', '#ec4899', '#38bdf8', '#10b981'];
            for (let c = 0; c < 12; c++) {
              particles.push({
                x: order.x,
                y: order.y - 20,
                vx: (Math.random() - 0.5) * 120,
                vy: (Math.random() - 0.5) * 120 - 40,
                life: 0.8,
                maxLife: 0.8,
                color: colors[c % colors.length],
                type: 'confetti',
              });
            }
          }

          // Tip Floater Text
          particles.push({
            x: order.x,
            y: order.y - 30,
            vx: 0,
            vy: -40,
            life: 0.9,
            maxLife: 0.9,
            color: order.customerKind === 'vip' ? '#fbbf24' : '#10b981',
            type: 'text',
            text: order.customerKind === 'vip' ? `⭐ VIP +$${earned}` : `+$${earned}`,
          });

          // Check Day Target Revenue
          if (state.cash >= state.targetCash) {
            state.isDayComplete = true;
            pizzaAudio.playFanfare();
          }
        }
      }
    }
  }

  // --- 4. Order Patience & Frenzy Decay ---
  public static updateOrders(
    orders: CustomerOrder[],
    particles: Particle[],
    state: PizzaGameState,
    dt: number
  ) {
    if (state.isFrenzyActive) {
      state.frenzyTimer -= dt;
      if (state.frenzyTimer <= 0) {
        state.isFrenzyActive = false;
      }
    }

    for (let i = orders.length - 1; i >= 0; i--) {
      const ord = orders[i];
      // Hotbox insulation upgrade gives bonus patience
      const patienceDecay = dt / (ord.maxPatience + state.upgrades.hotboxInsulation * 2);
      ord.patience -= patienceDecay;

      // Customer Lost Patience & Hung Up
      if (ord.patience <= 0) {
        orders.splice(i, 1);

        // Don't penalize missed orders for pranksters or thieves
        if (ord.customerKind !== 'prankster' && ord.customerKind !== 'thief') {
          state.ordersMissed += 1;
          state.comboStreak = 0;
          state.isFrenzyActive = false;
          pizzaAudio.playCustomerAngry();

          particles.push({
            x: ord.x,
            y: ord.y - 25,
            vx: 0,
            vy: -30,
            life: 0.8,
            maxLife: 0.8,
            color: '#ef4444',
            type: 'text',
            text: 'LOST ORDER!',
          });

          if (state.ordersMissed >= state.maxMissedAllowed) {
            state.isGameOver = true;
          }
        }
      }
    }
  }
}
