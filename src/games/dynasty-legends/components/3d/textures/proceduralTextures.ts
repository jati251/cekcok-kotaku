import * as THREE from 'three';
import { MapTheme } from '../../../types';
import { TerrainTextureManager } from './terrainTextures';
import { PropAndEntityTextureManager } from './propAndEntityTextures';

class ProceduralTextureManager {
  private terrain = new TerrainTextureManager();
  private props = new PropAndEntityTextureManager();

  getTerrainTexture(theme: MapTheme): THREE.CanvasTexture {
    return this.terrain.getTerrainTexture(theme);
  }

  getRoadTexture(theme: MapTheme): THREE.CanvasTexture {
    return this.terrain.getRoadTexture(theme);
  }

  getSkyDomeTexture(theme: MapTheme): THREE.CanvasTexture {
    return this.terrain.getSkyDomeTexture(theme);
  }

  getMountainRockTexture(theme: MapTheme): THREE.CanvasTexture {
    return this.terrain.getMountainRockTexture(theme);
  }

  getTreeBarkTexture(): THREE.CanvasTexture {
    return this.terrain.getTreeBarkTexture();
  }

  getWoodTexture(): THREE.CanvasTexture {
    return this.props.getWoodTexture();
  }

  getTentFabricTexture(primaryColor?: string): THREE.CanvasTexture {
    return this.props.getTentFabricTexture(primaryColor);
  }

  getDrumSkinTexture(): THREE.CanvasTexture {
    return this.props.getDrumSkinTexture();
  }

  getWarriorArmorTexture(color?: string): THREE.CanvasTexture {
    return this.props.getWarriorArmorTexture(color);
  }

  getStrawHatTexture(): THREE.CanvasTexture {
    return this.props.getStrawHatTexture();
  }

  getStoneMasonryTexture(): THREE.CanvasTexture {
    return this.props.getStoneMasonryTexture();
  }

  getHorseCoatTexture(color?: string): THREE.CanvasTexture {
    return this.props.getHorseCoatTexture(color);
  }
}

export const proceduralTextures = new ProceduralTextureManager();
