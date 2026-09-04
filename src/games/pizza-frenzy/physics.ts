// Order dispatching, customer patience, and delivery kinematics for Pizza Frenzy
import {
  CustomerOrder,
  DeliveryScooter,
  Pizzeria,
  CityBuilding,
  Particle,
  PizzaGameState,
  PizzaType,
  PIZZA_CONFIGS,
} from './types';
import { pizzaAudio } from './audio';

export class PizzaPhysics {
  public static spawnOrder(
    buildings: CityBuilding[],
    orders: CustomerOrder[],
    day: number
  ): CustomerOrder | null {
    // Find buildings without active orders
    const occupiedBuildingIds = new Set(orders.map((o) => o.buildingId));
    const available = buildings.filter((b) => !occupiedBuildingIds.has(b.id));
    if (available.length === 0) return null;

    const building = available[Math.floor(Math.random() * available.length)];
    const types: PizzaType[] = ['pepperoni', 'margherita', 'supreme', 'veggie'];
    const type = types[Math.floor(Math.random() * types.length)];

    const isVIP = Math.random() < 0.15;
    const isPrankster = Math.random() < 0.12 && day > 1;
    const basePatience = Math.max(7, 14 - day * 0.8);

    pizzaAudio.playPhoneRing();

    return {
      id: Math.random().toString(36).substring(2, 9),
      buildingId: building.id,
      type,
      x: building.x,
      y: building.y,
      patience: 1.0,
      maxPatience: isVIP ? basePatience * 0.75 : basePatience,
      points: isVIP ? PIZZA_CONFIGS[type].basePoints * 2 : PIZZA_CONFIGS[type].basePoints,
      isVIP,
      isPrankster,
    };
  }

  public static dispatchOrder(
    pizzeria: Pizzeria,
    order: CustomerOrder,
    orders: CustomerOrder[],
    scooters: DeliveryScooter[],
    particles: Particle[],
    state: PizzaGameState
  ) {
    if (pizzeria.type !== order.type) {
      // Wrong pizza sent!
      pizzaAudio.playBuzzer();
      state.comboStreak = 0;
      particles.push({
        x: order.x,
        y: order.y - 20,
        vx: 0,
        vy: -30,
        life: 0.8,
        maxLife: 0.8,
        color: '#ef4444',
        type: 'text',
        text: 'WRONG PIZZA!',
      });
      return;
    }

    if (order.isPrankster) {
      // Prankster busted!
      pizzaAudio.playBuzzer();
      // Remove order
      const idx = orders.findIndex((o) => o.id === order.id);
      if (idx !== -1) orders.splice(idx, 1);
      particles.push({
        x: order.x,
        y: order.y - 20,
        vx: 0,
        vy: -30,
        life: 0.9,
        maxLife: 0.9,
        color: '#f97316',
        type: 'text',
        text: 'PRANKSTER BUSTED!',
      });
      return;
    }

    // Launch scooter
    pizzaAudio.playScooterThrottle();
    pizzaAudio.playOvenBell();

    scooters.push({
      id: Math.random().toString(36).substring(2, 9),
      pizzeriaId: pizzeria.id,
      orderId: order.id,
      startX: pizzeria.x,
      startY: pizzeria.y,
      targetX: order.x,
      targetY: order.y,
      x: pizzeria.x,
      y: pizzeria.y,
      progress: 0,
      speed: 1.8, // Completes in ~0.55s
      color: pizzeria.color,
    });
  }

  public static updateScooters(
    scooters: DeliveryScooter[],
    orders: CustomerOrder[],
    particles: Particle[],
    state: PizzaGameState,
    dt: number
  ) {
    for (let i = scooters.length - 1; i >= 0; i--) {
      const s = scooters[i];
      s.progress += s.speed * dt;

      // Lerp position
      s.x = s.startX + (s.targetX - s.startX) * s.progress;
      s.y = s.startY + (s.targetY - s.startY) * s.progress;

      // Exhaust smoke
      if (Math.random() < 0.4) {
        particles.push({
          x: s.x,
          y: s.y,
          vx: (Math.random() - 0.5) * 20,
          vy: (Math.random() - 0.5) * 20,
          life: 0.3,
          maxLife: 0.3,
          color: 'rgba(203, 213, 225, 0.4)',
          type: 'smoke',
        });
      }

      if (s.progress >= 1.0) {
        // Delivery reached!
        scooters.splice(i, 1);
        const orderIdx = orders.findIndex((o) => o.id === s.orderId);
        if (orderIdx !== -1) {
          const deliveredOrder = orders[orderIdx];
          orders.splice(orderIdx, 1);

          state.comboStreak += 1;
          const tipMultiplier = 1 + (state.comboStreak - 1) * 0.15;
          const earned = Math.round(deliveredOrder.points * tipMultiplier);

          state.cash += earned;
          state.score += earned;
          state.ordersDelivered += 1;

          pizzaAudio.playCashRegister();

          // Spawning money floating text
          particles.push({
            x: deliveredOrder.x,
            y: deliveredOrder.y - 25,
            vx: 0,
            vy: -45,
            life: 0.8,
            maxLife: 0.8,
            color: '#10b981',
            type: 'text',
            text: `+$${earned} ${state.comboStreak > 2 ? `(${state.comboStreak}x Streak!)` : ''}`,
          });

          // Check Day Target
          if (state.cash >= state.targetCash && !state.isDayComplete) {
            state.isDayComplete = true;
            pizzaAudio.playDayComplete();
          }
        }
      }
    }
  }

  public static updateOrders(
    orders: CustomerOrder[],
    particles: Particle[],
    state: PizzaGameState,
    dt: number
  ) {
    for (let i = orders.length - 1; i >= 0; i--) {
      const o = orders[i];
      o.patience -= dt / o.maxPatience;

      if (o.patience <= 0) {
        // Order expired!
        orders.splice(i, 1);
        state.ordersMissed += 1;
        state.comboStreak = 0;
        pizzaAudio.playBuzzer();

        particles.push({
          x: o.x,
          y: o.y - 20,
          vx: 0,
          vy: -30,
          life: 0.7,
          maxLife: 0.7,
          color: '#ef4444',
          type: 'text',
          text: 'MISSED!',
        });

        if (state.ordersMissed >= state.maxMissedAllowed) {
          state.isGameOver = true;
        }
      }
    }
  }
}
