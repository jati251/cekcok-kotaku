import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { WorldContext } from '../types';

export function buildScooter(ctx: WorldContext, x: number, z: number, color: T.Material) {
  const { cyl, box, beam, emit, materials } = ctx;
  const { rubber, white, dark, glass } = materials;

  for (const dz of [-0.52, 0.52]) {
    cyl(rubber, x, 0.32, z + dz, 0.29, 0.15, 0, Math.PI / 2);
    cyl(white, x + 0.08, 0.32, z + dz, 0.17, 0.02, 0, Math.PI / 2);
  }

  emit(new RoundedBoxGeometry(.36,.35,.95,3,.09),color,x,.54,z);
  emit(new RoundedBoxGeometry(.4,.12,.65,3,.055),rubber,x,.86,z-.14);
  emit(new RoundedBoxGeometry(.38,.64,.18,3,.075),color,x,.8,z+.5,1,1,1,-.2);
  box(white, x, 1.1, z + 0.59, 0.26, 0.13, 0.06);

  beam(dark, [x, 0.4, z + 0.52], [x, 1.15, z + 0.39], 0.035);
  beam(dark, [x - 0.3, 1.18, z + 0.39], [x + 0.3, 1.18, z + 0.39], 0.025);

  for (const dx of [-0.26, 0.26]) {
    beam(dark, [x + dx, 1.18, z + 0.39], [x + dx * 1.3, 1.43, z + 0.39], 0.013);
    emit(new T.SphereGeometry(0.09, 8, 6), glass, x + dx * 1.3, 1.43, z + 0.39, 1, 0.6, 0.3);
  }
}

// Cross-sections describe the body silhouette, keeping the roof, hood and hatch continuous.
export function buildCar(ctx: WorldContext, x: number, z: number, covered = false, paint = ctx.materials.white) {
  const { box, emit, beam, materials: m } = ctx;
  const sections = [
    [-1.78,.60,.74],[-1.65,.78,1.05],[-1.30,.80,1.45],
    [-.95,.81,1.61],[.38,.80,1.62],[.85,.78,1.12],[1.48,.75,.98],[1.76,.62,.83],
  ];
  const ring = 24, positions: number[] = [], indices: number[] = [], uv: number[] = [];
  sections.forEach(([zz,w,top],i) => {
    for(let j=0;j<ring;j++) {
      const a=j/ring*Math.PI*2;
      const xx=Math.sign(Math.cos(a))*Math.pow(Math.abs(Math.cos(a)),.32)*w;
      const yy=.3+(top-.3)*(Math.sin(a)*.5+.5);
      const fold=covered ? .018*Math.sin(j*2.7+i*.8)*(1-Math.max(0,Math.sin(a))) : 0;
      positions.push(xx+fold,yy,zz);
      uv.push(j/ring,i/(sections.length-1));
      if(i<sections.length-1) {
        const n=i*ring+j,k=i*ring+(j+1)%ring;
        indices.push(n,k,n+ring,k,k+ring,n+ring);
      }
    }
  });
  for(const i of [0,sections.length-1]) {
    const center=positions.length/3;
    positions.push(0,.65,sections[i][0]);uv.push(.5,.5);
    for(let j=0;j<ring;j++) {
      const a=i*ring+j,b=i*ring+(j+1)%ring;
      indices.push(...(i===0?[center,b,a]:[center,a,b]));
    }
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
  emit(g,covered?(m.silverCover??m.cloth[2]):paint,x,0,z);
  for(const side of [-1,1]) {
    for(const zz of [-1.13,1.1]) {
      emit(new T.TorusGeometry(.25,.075,10,32),m.rubber,x+side*.77,.34,z+zz,1,1,1,0,Math.PI/2);
      emit(new T.CylinderGeometry(.19,.19,.03,24),m.dark,x+side*.83,.34,z+zz,1,1,1,0,0,Math.PI/2);
      for(let spoke=0;spoke<8;spoke++) {
        const a=spoke*Math.PI/4;
        beam(m.white,[x+side*.85,.34,z+zz],[x+side*.85,.34+Math.sin(a)*.17,z+zz+Math.cos(a)*.17],.016);
      }
    }
    emit(new T.SphereGeometry(1,16,10),covered?(m.silverCover??m.cloth[2]):paint,x+side*.86,1.13,z+.54,.13,.08,.17);
    if(!covered) {
      for(const [zz,len] of [[-.73,.67],[.05,.69]]) {
        box(m.glass,x+side*.796,1.27,z+zz,.018,.40,len,0,0,side*.13);
        box(m.dark,x+side*.807,1.045,z+zz,.024,.035,len+.04);
        box(m.white,x+side*.817,.96,z+zz-.18,.026,.035,.13);
      }
      box(m.dark,x+side*.79,1.24,z-.34,.035,.53,.045);
      box(m.dark,x+side*.76,.42,z,.04,.055,1.65);
    }
  }
  if(!covered) {
    box(m.glass,x,1.35,z+.63,1.34,.66,.025,.72);
    box(m.glass,x,1.27,z-1.4,1.25,.49,.025,-.5);
    for(const dx of [-.52,.52]) {
      emit(new T.SphereGeometry(1,16,8),m.white,x+dx,.83,z+1.68,.23,.10,.055);
      box(m.rust,x+dx,.85,z-1.73,.18,.24,.045);
    }
    box(m.dark,x,.56,z+1.75,.85,.21,.035);
    for(let y=.49;y<.66;y+=.04)box(m.concrete,x,y,z+1.775,.79,.013,.02);
    box(m.dark,x,.48,z-1.78,.37,.13,.022);
    for(const dx of [-.28,.28])beam(m.dark,[x+dx,1.06,z+.83],[x+dx+.15,1.17,z+.74],.009);
  }
}
