// High-Definition 2.5D Isometric Sprite Loader & Cache

import hqImg from '../assets/sprites/headquarters.png';
import barracksImg from '../assets/sprites/tent_barracks.png';
import tankFactoryImg from '../assets/sprites/tank_factory.png';
import airfieldImg from '../assets/sprites/hangar_airfield.png';
import lumberImg from '../assets/sprites/lumber_mill.png';
import goldMineImg from '../assets/sprites/gold_mine.png';
import refineryImg from '../assets/sprites/oil_refinery.png';
import cottageImg from '../assets/sprites/commander_cottage.png';
import shipyardImg from '../assets/sprites/naval_shipyard.png';
import towerImg from '../assets/sprites/guard_tower.png';

const SPRITE_URLS: Record<string, string> = {
  headquarters: hqImg,
  tent_barracks: barracksImg,
  tank_factory: tankFactoryImg,
  hangar_airfield: airfieldImg,
  lumber_mill: lumberImg,
  gold_mine: goldMineImg,
  oil_refinery: refineryImg,
  commander_cottage: cottageImg,
  officer_villa: cottageImg,
  town_hall: hqImg,
  naval_shipyard: shipyardImg,
  guard_tower: towerImg,
  patriot_missiles: towerImg,
};

class SpriteCache {
  private images: Map<string, HTMLImageElement> = new Map();
  private loadedCount: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.preloadAll();
    }
  }

  private preloadAll() {
    for (const [key, url] of Object.entries(SPRITE_URLS)) {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        this.loadedCount++;
      };
      this.images.set(key, img);
    }
  }

  public getSprite(buildingTypeId: string): HTMLImageElement | null {
    const img = this.images.get(buildingTypeId);
    if (img && img.complete && img.naturalWidth > 0) {
      return img;
    }
    return null;
  }
}

export const spriteManager = new SpriteCache();
