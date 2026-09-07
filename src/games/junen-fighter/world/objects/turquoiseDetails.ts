import * as T from 'three';
import type { WorldContext } from '../types';
import { scroll, tube } from './detail';

function timber(ctx: WorldContext, a: number[], b: number[], width: number, depth: number, mat: T.Material) {
  const start=new T.Vector3(...a), end=new T.Vector3(...b), delta=end.clone().sub(start);
  const g=new T.BoxGeometry(width,delta.length(),depth);
  g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));
  ctx.emit(g,mat,...start.add(end).multiplyScalar(.5).toArray() as [number,number,number]);
}

export function layeredGable(ctx: WorldContext, x:number, y:number, z:number, half:number, rise:number, open = false) {
  const {box,materials:m}=ctx;
  for(const side of [-1,1]) {
    for(const [offset,width,depth] of [[0,.19,.23],[.12,.075,.29],[-.14,.055,.18]]) {
      timber(ctx,[x+side*half,y+offset,z],[x,y+rise+offset,z],width,depth,m.roofGrey);
    }
    if(open) {
      timber(ctx,[x+side*(half-.25),y+.03,z+.18],[x,y+rise-.24,z+.18],.075,.065,m.white);
      timber(ctx,[x+side*(half-.6),y+.05,z+.18],[x,y+rise*.64,z+.18],.05,.055,m.white);
    }
  }
  if(open) {
    box(m.white,x,y+.03,z+.18,half*2-.4,.07,.07);
    box(m.white,x,y+rise*.48,z+.18,.07,rise*.88,.07);
    for(const side of [-1,1])box(m.white,x+side*half*.42,y+rise*.25,z+.18,.045,rise*.48,.055);
  }
}

export function archedCasements(ctx: WorldContext,x:number,y:number,z:number,w:number,h:number) {
  const {box,emit,materials:m}=ctx;
  // Each sash has a curved top pane, solid perimeter and a recessed sill.
  const sash=w/2-.065, lower=y-h/2, top=y+h/2;
  for(const side of [-1,1]) {
    const cx=x+side*w/4;
    const shape=new T.Shape();
    shape.moveTo(-sash/2,0);shape.lineTo(sash/2,0);shape.lineTo(sash/2,h-.23);
    shape.quadraticCurveTo(0,h+.06,-sash/2,h-.23);shape.closePath();
    const glass=new T.ShapeGeometry(shape,16);glass.rotateY(Math.PI);
    emit(glass,m.glass,cx,lower,z+.04);
    for(const dx of [-sash/2,0,sash/2])box(m.white,cx+dx,y-.09,z-.015,.04,h-.15,.07);
    for(const yy of [lower,lower+h*.38])box(m.white,cx,yy,z-.018,sash,.045,.07);
    tube(ctx,[[cx-sash/2,top-.23,z-.015],[cx,top-.085,z-.015],[cx+sash/2,top-.23,z-.015]],m.white,.025,24);
  }
  for(const dx of [-w/2,w/2])box(m.white,x+dx,y,z-.06,.08,h+.12,.13);
  box(m.white,x,lower-.04,z-.09,w+.2,.10,.25);
  box(m.white,x,top+.05,z-.05,w+.1,.07,.12);
  for(let dx=-w/2+.06;dx<w/2;dx+=.11)box(m.white,x+dx,top+.23,z-.02,.014,.25,.025);
  for(const yy of [top+.1,top+.37])box(m.white,x,yy,z-.025,w+.08,.025,.055);
}

export function turquoiseFence(ctx:WorldContext,w:number) {
  const {box,emit,materials:m}=ctx;
  const pillars=[-w/2+.1,-.95,1.9,w/2-.1];
  box(m.white,0,.13,0,w,.2,.22);
  for(const x of pillars) {
    box(m.white,x,.87,0,.29,1.65,.33);
    box(m.blue,x,.86,-.18,.16,1.42,.026);
    box(m.concrete,x,1.7,0,.4,.075,.42);
  }
  for(let i=0;i<pillars.length-1;i++) {
    const left=pillars[i]+.17,right=pillars[i+1]-.17,width=right-left,cx=(right+left)/2;
    box(m.blue,cx,.83,.025,width,1.25,.033);
    for(const yy of [.24,1.42])box(m.rust,cx,yy,-.02,width,.037,.045);
    for(let x=left+.11;x<right;x+=.205) {
      box(m.dark,x,.88,-.04,.018,1.39,.027);
      emit(new T.ConeGeometry(.033,.105,8),m.rust,x,1.63,-.04);
      for(const yy of [.34,1.34]) {
        scroll(ctx,x,yy,-.065,m.rust,.052,1);
        scroll(ctx,x,yy,-.065,m.rust,.052,-1);
      }
    }
    for(let x=left+.3;x<right-.1;x+=.61) {
      tube(ctx,[[x,.56,-.07],[x-.10,.73,-.07],[x,.97,-.07],[x+.10,.73,-.07],[x,.56,-.07]],m.rust,.011,32);
      for(const side of [-1,1])scroll(ctx,x+side*.035,.76,-.082,m.rust,.075,side);
      emit(new T.SphereGeometry(.035,10,8),m.rust,x,.76,-.08,1,1.5,.6);
    }
    if(i===2) {
      for(const y of [.45,1.28])box(m.rust,left-.055,y,-.035,.09,.11,.07);
      box(m.dark,right-.1,.96,-.08,.035,.17,.065);
    }
  }
}

export function limestoneSkirting(ctx:WorldContext,w:number,z:number) {
  const {emit,materials:m}=ctx;
  // Staggered split stones, with small grout gaps and mixed cuts.
  for(let row=0;row<3;row++)for(let col=0;col<Math.ceil(w/.48);col++) {
    const left=-w/2+col*.48, right=Math.min(w/2,left+.47), y=.04+row*.245;
    const cut=(right-left)*(.38+(col%3)*.09);
    const polys=[[[left,y],[right,y+.025],[left+cut,y+.225]],[[left+cut+.012,y+.225],[right,y+.04],[right,y+.23]]];
    for(const polygon of polys) {
      const shape=new T.Shape(polygon.map(([x,yy])=>new T.Vector2(x,yy)));
      emit(new T.ExtrudeGeometry(shape,{depth:.022,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:1}), (row+col)%4===0?m.cream:m.stone,0,0,z);
    }
  }
}
