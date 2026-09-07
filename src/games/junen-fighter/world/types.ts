import * as T from 'three';

export interface WorldMaterials {
  wallDefault: T.MeshStandardMaterial;
  wallGray: T.MeshStandardMaterial;
  concrete: T.MeshStandardMaterial;
  dark: T.MeshStandardMaterial;
  white: T.MeshStandardMaterial;
  wood: T.MeshStandardMaterial;
  tile: T.MeshStandardMaterial;
  roofGrey: T.MeshStandardMaterial;
  gold: T.MeshStandardMaterial;
  glass: T.MeshStandardMaterial;
  rubber: T.MeshStandardMaterial;
  green: T.MeshStandardMaterial;
  tankMat: T.MeshStandardMaterial;
  clay: T.MeshStandardMaterial;
  cream: T.MeshStandardMaterial;
  pale: T.MeshStandardMaterial;
  teal: T.MeshStandardMaterial;
  brightGreen: T.MeshStandardMaterial;
  pink: T.MeshStandardMaterial;
  salmon: T.MeshStandardMaterial;
  rust: T.MeshStandardMaterial;
  blue: T.MeshStandardMaterial;
  stone: T.MeshStandardMaterial;
  cloth: T.MeshStandardMaterial[];
  leafMats: T.MeshStandardMaterial[];
  road: T.MeshStandardMaterial;
  teakWood?: T.MeshStandardMaterial;
  woodSlat?: T.MeshStandardMaterial;
  silverCover?: T.MeshStandardMaterial;
  aquaBlue?: T.MeshStandardMaterial;
}

export interface WorldContext {
  materials: WorldMaterials;
  random: () => number;
  transform: T.Matrix4;
  textures: T.Texture[];
  emit: (
    geo: T.BufferGeometry,
    mat: T.Material,
    x: number,
    y: number,
    z: number,
    sx?: number,
    sy?: number,
    sz?: number,
    rx?: number,
    ry?: number,
    rz?: number,
  ) => void;
  box: (
    m: T.Material,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    rx?: number,
    ry?: number,
    rz?: number,
  ) => void;
  cyl: (
    m: T.Material,
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
    rx?: number,
    rz?: number,
  ) => void;
  beam: (m: T.Material, a: number[], b: number[], r: number) => void;
  sign: (
    text: string,
    x: number,
    y: number,
    z: number,
    w?: number,
    h?: number,
    bg?: string,
    fg?: string,
    ry?: number,
  ) => void;
}
