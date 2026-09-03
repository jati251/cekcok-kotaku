import { useState, useCallback, useEffect, useRef } from 'react'
import type { FaceKey } from './types'
import type { RubikCubeHandle } from './RubikCube'

interface ControlsProps {
  cubeRef: React.RefObject<RubikCubeHandle | null>
}

type MoveType = 'normal' | 'prime'

const FACE_BUTTONS: { face: FaceKey; label: string; color: string; key: string }[] = [
  { face: 'R', label: 'R', color: '#B71234', key: 'r' },
  { face: 'L', label: 'L', color: '#FF8C00', key: 'l' },
  { face: 'U', label: 'U', color: '#FFFFFF', key: 'u' },
  { face: 'D', label: 'D', color: '#FFD500', key: 'd' },
  { face: 'F', label: 'F', color: '#009E60', key: 'f' },
  { face: 'B', label: 'B', color: '#0046AD', key: 'b' },
]

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

function Controls({ cubeRef }: ControlsProps) {
  const [moveType, setMoveType] = useState<MoveType>('normal')
  const [isScrambling, setIsScrambling] = useState(false)
  const [moveCount, setMoveCount] = useState(0)
  const [timer, setTimer] = useState(0)
  const [isSolved, setIsSolved] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerStartedRef = useRef(false)
  const [activeFace, setActiveFace] = useState<string | null>(null)

  useEffect(() => {
    if (!cubeRef.current) return
    const unsub = cubeRef.current.onMove((count) => {
      setMoveCount(count)
      if (count > 0 && !timerStartedRef.current) {
        timerStartedRef.current = true
        timerRef.current = setInterval(() => setTimer((t) => t + 100), 100)
      }
    })
    return unsub
  }, [cubeRef])

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const executeMove = useCallback((face: FaceKey, times: number) => {
    if (!cubeRef.current || isScrambling) return
    setActiveFace(face)
    setTimeout(() => setActiveFace(null), 300)
    for (let i = 0; i < times; i++) cubeRef.current.rotateFace(face)
  }, [cubeRef, isScrambling])

  const handleRotate = useCallback((face: FaceKey) => {
    executeMove(face, moveType === 'normal' ? 1 : 3)
  }, [executeMove, moveType])

  const handleScramble = useCallback(() => {
    if (!cubeRef.current) return
    setIsScrambling(true)
    setIsSolved(false)
    if (timerRef.current) clearInterval(timerRef.current)
    timerStartedRef.current = false
    setTimer(0)
    setMoveCount(0)
    cubeRef.current.scramble()
    const waitForFinish = () => {
      if (cubeRef.current && cubeRef.current.isAnimating) {
        requestAnimationFrame(waitForFinish)
      } else {
        setIsScrambling(false)
        timerStartedRef.current = true
        timerRef.current = setInterval(() => setTimer((t) => t + 100), 100)
      }
    }
    requestAnimationFrame(waitForFinish)
  }, [cubeRef])

  const handleReset = useCallback(() => {
    if (cubeRef.current) {
      cubeRef.current.reset()
      setIsScrambling(false)
      setIsSolved(true)
      if (timerRef.current) clearInterval(timerRef.current)
      timerStartedRef.current = false
      setTimer(0)
      setMoveCount(0)
      setTimeout(() => setIsSolved(false), 2000)
    }
  }, [cubeRef])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      const key = e.key.toLowerCase()
      const btn = FACE_BUTTONS.find((b) => b.key === key)
      if (btn && !isScrambling) { e.preventDefault(); handleRotate(btn.face); return }
      if (key === 's' && !isScrambling) { e.preventDefault(); handleScramble() }
      if (key === 'x') { e.preventDefault(); handleReset() }
      if (key === ' ') { e.preventDefault(); setMoveType((t) => t === 'normal' ? 'prime' : 'normal') }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleRotate, handleScramble, handleReset, isScrambling])

  return (
    <>
      {/* ── Solved Banner ── */}
      {isSolved && <div className="solved-banner">✨ Solved! ✨</div>}

      {/* ── Top Bar: Logo + Stats ── */}
      <div className="top-bar">
        <div className="top-left">
          <span className="logo-icon">🧩</span>
          <div className="title-group">
            <span className="game-title">Rubik's Cube</span>
            <span className="game-subtitle">Interactive 3D Puzzle</span>
          </div>
        </div>
        <div className="top-right">
          <div className="stat-chip">
            <span className="stat-icon">🎯</span>
            <span className="stat-val">{moveCount}</span>
          </div>
          <div className="stat-chip">
            <span className="stat-icon">⏱️</span>
            <span className="stat-val">{formatTime(timer)}</span>
          </div>
        </div>
      </div>

      {/* ── Bottom Bar: Controls ── */}
      <div className="bottom-bar">
        {/* Move type */}
        <div className="bottom-section">
          <div className="move-type-toggle">
            <button
              className={`toggle-btn ${moveType === 'normal' ? 'active' : ''}`}
              onClick={() => setMoveType('normal')}
              title="Clockwise"
            >CW</button>
            <button
              className={`toggle-btn ${moveType === 'prime' ? 'active' : ''}`}
              onClick={() => setMoveType('prime')}
              title="Counter-Clockwise"
            >CCW</button>
          </div>
        </div>

        {/* Face buttons */}
        <div className="bottom-section face-section">
          {FACE_BUTTONS.map(({ face, label, color }) => (
            <button
              key={face}
              className={`face-btn ${activeFace === face ? 'pressed' : ''}`}
              style={{ '--face-color': color } as React.CSSProperties}
              onClick={() => handleRotate(face)}
              disabled={isScrambling}
            >{label}</button>
          ))}
        </div>

        {/* Actions */}
        <div className="bottom-section actions-section">
          <button
            className="action-btn scramble-btn"
            onClick={handleScramble}
            disabled={isScrambling}
          >{isScrambling ? '🌀...' : '🔀 Scramble'}</button>
          <button
            className="action-btn reset-btn"
            onClick={handleReset}
            disabled={isScrambling}
          >🔄 Reset</button>
        </div>

        {/* Keyboard hints (desktop only) */}
        <div className="bottom-section hints-section">
          <span className="hint-text">
            <kbd>R L U D F B</kbd> faces
            <span className="hint-sep">·</span>
            <kbd>Space</kbd> CW/CCW
            <span className="hint-sep">·</span>
            <kbd>S</kbd> scramble
            <span className="hint-sep">·</span>
            <kbd>X</kbd> reset
          </span>
        </div>
      </div>
    </>
  )
}

export default Controls
