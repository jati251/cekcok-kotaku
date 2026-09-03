import type { FreightContract } from '../types';

export const CITY_FREIGHT_CONTRACTS: FreightContract[] = [
  {
    id: 'coastal_cargo_ferry',
    title: 'Coastal Merchant Vessel',
    transportType: 'cargo_ship',
    costCoins: 150,
    goodsReward: 120,
    deliverySeconds: 25,
    isDelivering: false,
    orderedAt: null,
  },
  {
    id: 'transcontinental_train',
    title: 'Transcontinental Freight Rail',
    transportType: 'freight_train',
    costCoins: 400,
    goodsReward: 350,
    deliverySeconds: 60,
    isDelivering: false,
    orderedAt: null,
  },
];
