import {
  Ball,
  TableConfig,
  FeltTheme,
  CueStickState,
  AimTrajectory,
} from './types';
import { BALL_RADIUS } from './physics';

const FELT_THEMES: Record<
  FeltTheme,
  { base: string; dark: string; cushion: string; border: string }
> = {
  emerald: {
    base: '#0f766e',
    dark: '#042f2e',
    cushion: '#0d5d56',
    border: '#292524',
  },
  navy: {
    base: '#1d4ed8',
    dark: '#172554',
    cushion: '#1e40af',
    border: '#18181b',
  },
  burgundy: {
    base: '#9f1239',
    dark: '#4c0519',
    cushion: '#881337',
    border: '#292524',
  },
  midnight: {
    base: '#27272a',
    dark: '#09090b',
    cushion: '#18181b',
    border: '#0f172a',
  },
};

export class PoolRenderer {
  public renderTable(
    ctx: CanvasRenderingContext2D,
    table: TableConfig,
    theme: FeltTheme
  ) {
    const { width: w, height: h, cushionWidth: cw } = table;
    const colors = FELT_THEMES[theme];

    // 1. Outer Wooden Table Rail with Rounded Corners
    ctx.save();
    const woodGradient = ctx.createLinearGradient(0, 0, w, h);
    woodGradient.addColorStop(0, '#3e2723');
    woodGradient.addColorStop(0.5, '#2e1c15');
    woodGradient.addColorStop(1, '#1b0f0a');

    ctx.fillStyle = woodGradient;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 20);
    ctx.fill();

    // Outer rail bevel border
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inlaid Diamond Sights on Wooden Rails
    this.renderDiamondSights(ctx, table);

    // 2. Playfield Felt Bed (Cloth)
    const playX = cw;
    const playY = cw;
    const playW = w - 2 * cw;
    const playH = h - 2 * cw;

    // Felt gradient with soft center spotlight
    const feltGradient = ctx.createRadialGradient(
      w / 2,
      h / 2,
      w * 0.15,
      w / 2,
      h / 2,
      w * 0.65
    );
    feltGradient.addColorStop(0, colors.base);
    feltGradient.addColorStop(1, colors.dark);

    ctx.fillStyle = feltGradient;
    ctx.fillRect(playX, playY, playW, playH);

    // Inner cloth ambient shadow from cushions
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 8;
    ctx.strokeRect(playX + 4, playY + 4, playW - 8, playH - 8);

    // 3. Table Markings: Head String and Foot Spot
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(table.headStringX, playY);
    ctx.lineTo(table.headStringX, playY + playH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Foot Spot Marker
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(table.footSpotX, h / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Head Spot Marker
    ctx.beginPath();
    ctx.arc(table.headStringX, h / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // 4. Cushions
    this.renderCushions(ctx, table, colors.cushion);

    // 5. Pockets
    this.renderPockets(ctx, table);

    ctx.restore();
  }

  // Render inlaid pearl diamond sights along the wooden rails
  private renderDiamondSights(ctx: CanvasRenderingContext2D, table: TableConfig) {
    const { width: w, height: h, cushionWidth: cw } = table;
    const sightColor = '#f5f5f4';

    ctx.fillStyle = sightColor;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 2;

    const drawDiamond = (x: number, y: number) => {
      const s = 3;
      ctx.beginPath();
      ctx.moveTo(x, y - s);
      ctx.lineTo(x + s, y);
      ctx.lineTo(x, y + s);
      ctx.lineTo(x - s, y);
      ctx.closePath();
      ctx.fill();
    };

    const playW = w - 2 * cw;
    const playH = h - 2 * cw;
    const spacingX = playW / 8;
    const spacingY = playH / 4;

    // Top and Bottom Rail Sights
    for (let i = 1; i < 8; i++) {
      if (i === 4) continue; // Skip middle pocket
      const x = cw + i * spacingX;
      drawDiamond(x, cw / 2);
      drawDiamond(x, h - cw / 2);
    }

    // Left and Right Rail Sights
    for (let i = 1; i < 4; i++) {
      const y = cw + i * spacingY;
      drawDiamond(cw / 2, y);
      drawDiamond(w - cw / 2, y);
    }

    ctx.shadowBlur = 0;
  }

  // Render cushion rubber rails
  private renderCushions(
    ctx: CanvasRenderingContext2D,
    table: TableConfig,
    cushionColor: string
  ) {
    ctx.strokeStyle = cushionColor;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    for (const c of table.cushions) {
      ctx.beginPath();
      ctx.moveTo(c.p1.x, c.p1.y);
      ctx.lineTo(c.p2.x, c.p2.y);
      ctx.stroke();
    }
  }

  // Render pocket holes and metallic brackets
  private renderPockets(ctx: CanvasRenderingContext2D, table: TableConfig) {
    for (const p of table.pockets) {
      // Metallic pocket outer bracket
      const outerGrad = ctx.createRadialGradient(
        p.x - 3,
        p.y - 3,
        p.radius * 0.3,
        p.x,
        p.y,
        p.radius + 6
      );
      outerGrad.addColorStop(0, '#e5e7eb');
      outerGrad.addColorStop(0.5, '#9ca3af');
      outerGrad.addColorStop(1, '#4b5563');

      ctx.fillStyle = outerGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius + 4, 0, Math.PI * 2);
      ctx.fill();

      // Pocket inner drop hole
      const innerGrad = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.radius);
      innerGrad.addColorStop(0, '#000000');
      innerGrad.addColorStop(0.85, '#0a0a0a');
      innerGrad.addColorStop(1, '#18181b');

      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Pocket rim inner highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Render individual billiard ball with 3D sphere shading
  public renderBall(ctx: CanvasRenderingContext2D, ball: Ball) {
    if (ball.isPocketed && ball.pocketAnimProgress >= 1) return;

    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.scale(ball.scale, ball.scale);

    const r = BALL_RADIUS;

    // 1. Dynamic Contact Drop Shadow
    if (!ball.isPocketed) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(2, 3, r * 0.95, r * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Ball Base & Shading
    const lightOffsetX = -r * 0.35;
    const lightOffsetY = -r * 0.35;

    if (ball.number === 0) {
      // Cue Ball (Solid White Ivory with Specular Highlight)
      const cueGrad = ctx.createRadialGradient(
        lightOffsetX,
        lightOffsetY,
        r * 0.1,
        0,
        0,
        r
      );
      cueGrad.addColorStop(0, '#ffffff');
      cueGrad.addColorStop(0.7, '#f4f4f5');
      cueGrad.addColorStop(1, '#cbd5e1');

      ctx.fillStyle = cueGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Red alignment dots on cue ball (for english / spin visual)
      ctx.fillStyle = '#ef4444';
      const dotOffset = r * 0.45;
      [
        { x: dotOffset, y: 0 },
        { x: -dotOffset, y: 0 },
        { x: 0, y: dotOffset },
        { x: 0, y: -dotOffset },
        { x: 0, y: 0 },
      ].forEach((dot) => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 1.3, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (ball.type === 'stripe') {
      // Striped Ball (White sphere with colored equator band)
      // Base white sphere
      const baseGrad = ctx.createRadialGradient(
        lightOffsetX,
        lightOffsetY,
        r * 0.1,
        0,
        0,
        r
      );
      baseGrad.addColorStop(0, '#ffffff');
      baseGrad.addColorStop(0.7, '#f4f4f5');
      baseGrad.addColorStop(1, '#94a3b8');

      ctx.fillStyle = baseGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Colored Stripe Band
      ctx.save();
      ctx.rotate(ball.rotation);
      ctx.fillStyle = ball.color;
      ctx.beginPath();
      ctx.rect(-r, -r * 0.52, r * 2, r * 1.04);
      ctx.clip();

      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // White Number Circle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Number Text
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ball.number.toString(), 0, 0.5);
    } else {
      // Solid Ball or 8-Ball
      const ballGrad = ctx.createRadialGradient(
        lightOffsetX,
        lightOffsetY,
        r * 0.1,
        0,
        0,
        r
      );
      ballGrad.addColorStop(0, ball.number === 8 ? '#4b5563' : '#ffffff');
      ballGrad.addColorStop(0.3, ball.color);
      ballGrad.addColorStop(1, ball.number === 8 ? '#000000' : '#1e1b4b');

      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // White Number Circle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Number Text
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 8.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ball.number.toString(), 0, 0.5);
    }

    // 3. Specular Highlight Glare
    const specGrad = ctx.createRadialGradient(
      lightOffsetX,
      lightOffsetY,
      0,
      lightOffsetX,
      lightOffsetY,
      r * 0.45
    );
    specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = specGrad;
    ctx.beginPath();
    ctx.arc(lightOffsetX, lightOffsetY, r * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Render laser aim guide and ghost ball
  public renderAimGuide(
    ctx: CanvasRenderingContext2D,
    trajectory: AimTrajectory,
    cueBall: Ball
  ) {
    if (cueBall.isPocketed) return;

    ctx.save();

    // 1. Dotted Aim Line from Cue Ball to Target/Cushion
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(trajectory.cueStart.x, trajectory.cueStart.y);
    ctx.lineTo(trajectory.cueEnd.x, trajectory.cueEnd.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Ghost Ball at impact point
    if (trajectory.ghostBall) {
      const gx = trajectory.ghostBall.x;
      const gy = trajectory.ghostBall.y;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(gx, gy, BALL_RADIUS, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.arc(gx, gy, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // 3. Target Ball Trajectory Line (Deflection towards pocket)
      if (trajectory.targetBall && trajectory.targetDir) {
        const tx = trajectory.targetBall.x;
        const ty = trajectory.targetBall.y;
        const lineLen = 140;

        ctx.strokeStyle = '#34d399'; // Vibrant emerald aim line
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + trajectory.targetDir.x * lineLen, ty + trajectory.targetDir.y * lineLen);
        ctx.stroke();

        // Arrow head on target direction
        const arrowX = tx + trajectory.targetDir.x * lineLen;
        const arrowY = ty + trajectory.targetDir.y * lineLen;
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.arc(arrowX, arrowY, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Cue Ball Tangent Reflection Line
      if (trajectory.cueReflectionDir) {
        const refLen = 70;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(
          gx + trajectory.cueReflectionDir.x * refLen,
          gy + trajectory.cueReflectionDir.y * refLen
        );
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    ctx.restore();
  }

  // Render wooden cue stick with power pull-back
  public renderCueStick(
    ctx: CanvasRenderingContext2D,
    cueBall: Ball,
    cueState: CueStickState
  ) {
    if (cueBall.isPocketed) return;

    ctx.save();
    ctx.translate(cueBall.x, cueBall.y);
    ctx.rotate(cueState.angle);

    // Pull-back offset proportional to shot power
    const pullBack = BALL_RADIUS + 12 + cueState.power * 80;
    const stickLength = 320;
    const tipWidth = 5;
    const buttWidth = 11;

    // Cue stick drop shadow onto cloth
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.moveTo(-pullBack + 6, 8 - tipWidth / 2);
    ctx.lineTo(-pullBack - stickLength + 6, 8 - buttWidth / 2);
    ctx.lineTo(-pullBack - stickLength + 6, 8 + buttWidth / 2);
    ctx.lineTo(-pullBack + 6, 8 + tipWidth / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 1. Chalked Cue Tip (Sky blue)
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-pullBack, -tipWidth / 2, -4, tipWidth);

    // 2. Brass / White Ferrule
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-pullBack - 4, -tipWidth / 2, -10, tipWidth);

    // 3. Maple Wood Forearm
    const woodGrad = ctx.createLinearGradient(0, -buttWidth / 2, 0, buttWidth / 2);
    woodGrad.addColorStop(0, '#fed7aa');
    woodGrad.addColorStop(0.5, '#f97316');
    woodGrad.addColorStop(1, '#9a3412');

    ctx.fillStyle = woodGrad;
    ctx.beginPath();
    ctx.moveTo(-pullBack - 14, -tipWidth / 2);
    ctx.lineTo(-pullBack - stickLength * 0.55, -buttWidth * 0.4);
    ctx.lineTo(-pullBack - stickLength * 0.55, buttWidth * 0.4);
    ctx.lineTo(-pullBack - 14, tipWidth / 2);
    ctx.closePath();
    ctx.fill();

    // 4. Textured Irish Linen Grip
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(-pullBack - stickLength * 0.55, -buttWidth * 0.4);
    ctx.lineTo(-pullBack - stickLength * 0.85, -buttWidth * 0.48);
    ctx.lineTo(-pullBack - stickLength * 0.85, buttWidth * 0.48);
    ctx.lineTo(-pullBack - stickLength * 0.55, buttWidth * 0.4);
    ctx.closePath();
    ctx.fill();

    // Grip texture stripes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const gx = -pullBack - stickLength * (0.58 + i * 0.03);
      ctx.beginPath();
      ctx.moveTo(gx, -buttWidth * 0.45);
      ctx.lineTo(gx, buttWidth * 0.45);
      ctx.stroke();
    }

    // 5. Ebony Butt & Rubber Bumper
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-pullBack - stickLength * 0.85, -buttWidth * 0.48);
    ctx.lineTo(-pullBack - stickLength, -buttWidth / 2);
    ctx.lineTo(-pullBack - stickLength, buttWidth / 2);
    ctx.lineTo(-pullBack - stickLength * 0.85, buttWidth * 0.48);
    ctx.closePath();
    ctx.fill();

    // Rubber Bumper end-cap
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-pullBack - stickLength, 0, buttWidth / 2, Math.PI / 2, (Math.PI * 3) / 2);
    ctx.fill();

    ctx.restore();
  }

  // Render ghost cue ball and placement halo when in Ball-In-Hand mode
  public renderBallInHandIndicator(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    isValid: boolean
  ) {
    ctx.save();

    // Pulsing halo ring
    ctx.strokeStyle = isValid ? '#22c55e' : '#ef4444';
    ctx.fillStyle = isValid ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.arc(x, y, BALL_RADIUS + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();

    // Semi-transparent ghost cue ball
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(x, y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export const poolRenderer = new PoolRenderer();
