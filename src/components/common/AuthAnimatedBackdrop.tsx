import React, { useId, useRef, useEffect } from 'react'

export interface AuthAnimatedBackdropProps {
  variant: 'buyer' | 'seller'
  className?: string
}

interface OrbConfig {
  maxDisplacement: number
  forceMultiplier: number
  springK: number
  repelExtra: number
}

interface OrbPhysicsState {
  x: number
  y: number
  vx: number
  vy: number
  baseCenterX: number
  baseCenterY: number
  radius: number
}

export const AuthAnimatedBackdrop: React.FC<AuthAnimatedBackdropProps> = ({
  variant,
  className = '',
}) => {
  const waveGradientId = useId()
  const isBuyer = variant === 'buyer'

  // Outer wrapper refs for translate3d mouse-repel physics control
  const orb1Ref = useRef<HTMLDivElement>(null)
  const orb2Ref = useRef<HTMLDivElement>(null)
  const orb3Ref = useRef<HTMLDivElement>(null)
  const orb4Ref = useRef<HTMLDivElement>(null)

  // Multi-stop base gradients strictly using Toti Cakery palette
  const baseGradientStyle: React.CSSProperties = {
    backgroundImage: isBuyer
      ? 'linear-gradient(135deg, #F6EFE6 0%, #EFE4D6 33%, #E8DCCB 66%, #C6A48F 100%)'
      : 'linear-gradient(135deg, #3A1F16 0%, #6B4A3C 50%, #8B6A5A 100%)',
  }

  // Floating orbs linear gradients (2 stops with visible depth: lighter top-left, deeper bottom-right)
  const orb1Gradient: React.CSSProperties = {
    backgroundImage: isBuyer
      ? 'linear-gradient(135deg, #E0A04E 0%, #C8893D 100%)'
      : 'linear-gradient(135deg, #E0A04E 0%, #C8893D 100%)',
  }

  const orb2Gradient: React.CSSProperties = {
    backgroundImage: isBuyer
      ? 'linear-gradient(135deg, #C6A48F 0%, #9B4A2F 100%)'
      : 'linear-gradient(135deg, #F6EFE6 0%, #C6A48F 100%)',
  }

  const orb3Gradient: React.CSSProperties = {
    backgroundImage: isBuyer
      ? 'linear-gradient(135deg, #E8DCCB 0%, #C6A48F 100%)'
      : 'linear-gradient(135deg, #C6A48F 0%, #9B4A2F 100%)',
  }

  const orb4Gradient: React.CSSProperties = {
    backgroundImage: isBuyer
      ? 'linear-gradient(135deg, #E0A04E 0%, #9B4A2F 100%)'
      : 'linear-gradient(135deg, #E0A04E 0%, #C8893D 100%)',
  }

  useEffect(() => {
    // 1. Guard against prefers-reduced-motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motionQuery.matches) {
      return
    }

    const orbRefs = [orb1Ref, orb2Ref, orb3Ref, orb4Ref]

    // Tuning per orb & variant
    // Buyer: lively and bouncy (damping 0.88)
    // Seller: heavier/slower settling (damping 0.82, lower force)
    const damping = isBuyer ? 0.88 : 0.82

    const configs: OrbConfig[] = isBuyer
      ? [
          { maxDisplacement: 105, forceMultiplier: 14, springK: 0.035, repelExtra: 90 }, // Orb 1 (Mid-Left)
          { maxDisplacement: 130, forceMultiplier: 18, springK: 0.038, repelExtra: 90 }, // Orb 2 (Bottom-Left)
          { maxDisplacement: 80, forceMultiplier: 10, springK: 0.030, repelExtra: 90 },  // Orb 3 (Top-Right, large)
          { maxDisplacement: 160, forceMultiplier: 28, springK: 0.048, repelExtra: 90 }, // Orb 4 (Accent dot, small)
        ]
      : [
          { maxDisplacement: 85, forceMultiplier: 9, springK: 0.030, repelExtra: 85 },
          { maxDisplacement: 105, forceMultiplier: 12, springK: 0.034, repelExtra: 85 },
          { maxDisplacement: 65, forceMultiplier: 6.5, springK: 0.026, repelExtra: 85 },
          { maxDisplacement: 135, forceMultiplier: 18, springK: 0.040, repelExtra: 85 },
        ]

    const states: OrbPhysicsState[] = [
      { x: 0, y: 0, vx: 0, vy: 0, baseCenterX: 0, baseCenterY: 0, radius: 40 },
      { x: 0, y: 0, vx: 0, vy: 0, baseCenterX: 0, baseCenterY: 0, radius: 30 },
      { x: 0, y: 0, vx: 0, vy: 0, baseCenterX: 0, baseCenterY: 0, radius: 45 },
      { x: 0, y: 0, vx: 0, vy: 0, baseCenterX: 0, baseCenterY: 0, radius: 15 },
    ]

    const measureCenters = () => {
      for (let i = 0; i < orbRefs.length; i++) {
        const el = orbRefs[i].current
        if (!el) continue
        const rect = el.getBoundingClientRect()
        // Subtract current displacement so baseCenter is the un-translated origin
        states[i].baseCenterX = rect.left + rect.width / 2 - states[i].x
        states[i].baseCenterY = rect.top + rect.height / 2 - states[i].y
        states[i].radius = Math.max(rect.width, rect.height) / 2
      }
    }

    measureCenters()

    let mouseX = -9999
    let mouseY = -9999
    let isMouseInside = false
    let isRunning = false
    let rafId: number | null = null

    const tick = () => {
      const minMargin = 20
      const winW = window.innerWidth
      const winH = window.innerHeight

      let allAtRest = true
      let allOrbsFar = true

      for (let i = 0; i < 4; i++) {
        const state = states[i]
        const config = configs[i]
        const outerEl = orbRefs[i].current
        if (!outerEl) continue

        // Current orb center in client coords
        const curCenterX = state.baseCenterX + state.x
        const curCenterY = state.baseCenterY + state.y

        // Distance to cursor
        let repelForceX = 0
        let repelForceY = 0

        const repelRange = state.radius + config.repelExtra

        if (isMouseInside) {
          const dx = curCenterX - mouseX
          const dy = curCenterY - mouseY
          const dist = Math.hypot(dx, dy)

          if (dist < repelRange) {
            allOrbsFar = false
            const safeDist = dist || 0.001
            const nx = dx / safeDist
            const ny = dy / safeDist
            const overlap = (repelRange - dist) / repelRange
            // Stronger when closer (quadratic ramp)
            const push = overlap * overlap * config.forceMultiplier
            repelForceX = nx * push
            repelForceY = ny * push
          }
        }

        // Spring pulling back to origin (0, 0)
        const springX = -state.x * config.springK
        const springY = -state.y * config.springK

        // Velocity integration + damping
        state.vx = (state.vx + repelForceX + springX) * damping
        state.vy = (state.vy + repelForceY + springY) * damping

        // Position update
        state.x += state.vx
        state.y += state.vy

        // 1. Clamp max displacement
        const disp = Math.hypot(state.x, state.y)
        if (disp > config.maxDisplacement) {
          const ratio = config.maxDisplacement / disp
          state.x *= ratio
          state.y *= ratio
          const dot = state.vx * (state.x / config.maxDisplacement) + state.vy * (state.y / config.maxDisplacement)
          if (dot > 0) {
            state.vx -= (state.x / config.maxDisplacement) * dot
            state.vy -= (state.y / config.maxDisplacement) * dot
          }
        }

        // 2. Clamp viewport boundary (never leave screen)
        const minX = minMargin - state.baseCenterX
        const maxX = winW - minMargin - state.baseCenterX
        if (state.x < minX) {
          state.x = minX
          if (state.vx < 0) state.vx = 0
        } else if (state.x > maxX) {
          state.x = maxX
          if (state.vx > 0) state.vx = 0
        }

        const minY = minMargin - state.baseCenterY
        const maxY = winH - minMargin - state.baseCenterY
        if (state.y < minY) {
          state.y = minY
          if (state.vy < 0) state.vy = 0
        } else if (state.y > maxY) {
          state.y = maxY
          if (state.vy > 0) state.vy = 0
        }

        // Check if resting
        const isResting =
          Math.abs(state.x) < 0.05 &&
          Math.abs(state.y) < 0.05 &&
          Math.abs(state.vx) < 0.05 &&
          Math.abs(state.vy) < 0.05

        if (isResting) {
          state.x = 0
          state.y = 0
          state.vx = 0
          state.vy = 0
          if (outerEl.style.transform !== '') {
            outerEl.style.transform = ''
          }
        } else {
          allAtRest = false
          outerEl.style.transform = `translate3d(${state.x.toFixed(2)}px, ${state.y.toFixed(2)}px, 0)`
        }
      }

      // Stop loop when all orbs are at rest and the cursor is far
      if (allAtRest && allOrbsFar) {
        isRunning = false
        rafId = null
      } else {
        rafId = requestAnimationFrame(tick)
      }
    }

    const startLoopIfNeeded = () => {
      if (!isRunning) {
        isRunning = true
        rafId = requestAnimationFrame(tick)
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      mouseX = e.clientX
      mouseY = e.clientY
      isMouseInside = true
      startLoopIfNeeded()
    }

    const onMouseLeave = () => {
      isMouseInside = false
      mouseX = -9999
      mouseY = -9999
      // If any orb is displaced, keep loop running until they return to origin
      startLoopIfNeeded()
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        if (rafId) {
          cancelAnimationFrame(rafId)
          rafId = null
        }
        isRunning = false
      }
    }

    const onResize = () => {
      measureCenters()
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('mouseleave', onMouseLeave)
    window.addEventListener('resize', onResize, { passive: true })
    window.addEventListener('scroll', onResize, { passive: true })
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      orbRefs.forEach((ref) => {
        if (ref.current) ref.current.style.transform = ''
      })
    }
  }, [isBuyer])

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none absolute inset-0 overflow-hidden z-0 ${className}`}
    >
      {/* 1. Animated Multi-Stop Base Gradient */}
      <div
        style={baseGradientStyle}
        className="absolute inset-0 bg-[length:220%_220%] animate-toti-gradient"
      />

      {/* 2. Soft ambient blurs behind orbs for lush color diffusion */}
      <div
        className={`pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full blur-3xl ${
          isBuyer ? 'bg-[#E0A04E]/25' : 'bg-[#9B4A2F]/25'
        }`}
      />
      <div
        className={`pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full blur-3xl ${
          isBuyer ? 'bg-[#9B4A2F]/20' : 'bg-[#7E3A24]/20'
        }`}
      />

      {/* 3. Floating Organic Gradient Orbs with Mouse Repel Physics */}
      {/* Orb 1: Left-Mid, vivid medium organic orb */}
      <div
        ref={orb1Ref}
        className="pointer-events-none absolute top-[18%] -left-8 sm:left-[6%] will-change-transform"
      >
        <div
          style={orb1Gradient}
          className={`h-28 w-28 sm:h-40 sm:w-40 rounded-[44%_56%_60%_40%/46%_42%_58%_54%] shadow-lg ${
            isBuyer
              ? 'animate-toti-orb-1 opacity-80 shadow-[#9B4A2F]/20'
              : 'animate-toti-orb-seller-1 opacity-70 shadow-[#3A1F16]/30 border border-[#F6EFE6]/25'
          }`}
        />
      </div>

      {/* Orb 2: Bottom-Left, warm floating circle */}
      <div
        ref={orb2Ref}
        className="pointer-events-none absolute bottom-[14%] left-[5%] sm:left-[12%] will-change-transform"
      >
        <div
          style={orb2Gradient}
          className={`h-20 w-20 sm:h-28 sm:w-28 rounded-full shadow-md ${
            isBuyer
              ? 'animate-toti-orb-2 opacity-75 shadow-[#9B4A2F]/20'
              : 'animate-toti-orb-seller-2 opacity-65 shadow-[#3A1F16]/30 border border-[#F6EFE6]/25'
          }`}
        />
      </div>

      {/* Orb 3: Top-Right, soft medium-large gradient sphere */}
      <div
        ref={orb3Ref}
        className="pointer-events-none absolute top-[10%] right-[4%] sm:right-[10%] will-change-transform"
      >
        <div
          style={orb3Gradient}
          className={`h-24 w-24 sm:h-36 sm:w-36 rounded-full shadow-md ${
            isBuyer
              ? 'animate-toti-orb-3 opacity-65 shadow-[#C6A48F]/20'
              : 'animate-toti-orb-seller-3 opacity-55 shadow-[#9B4A2F]/25 border border-[#F6EFE6]/25'
          }`}
        />
      </div>

      {/* Orb 4: Small playful accent dot */}
      <div
        ref={orb4Ref}
        className="pointer-events-none absolute top-[44%] left-[2%] sm:left-[4%] will-change-transform"
      >
        <div
          style={orb4Gradient}
          className={`h-8 w-8 sm:h-12 sm:w-12 rounded-full shadow-sm [animation-delay:-4s] ${
            isBuyer
              ? 'animate-toti-orb-1 opacity-70 shadow-[#9B4A2F]/20'
              : 'animate-toti-orb-seller-1 opacity-60 shadow-[#3A1F16]/30 border border-[#F6EFE6]/25'
          }`}
        />
      </div>

      {/* 4. Flowing Organic Gradient Wave (Bottom-Right Corner) */}
      <div
        className={`absolute bottom-0 right-0 w-[65vw] max-w-[540px] h-auto pointer-events-none select-none ${
          isBuyer ? 'animate-toti-wave' : 'animate-toti-wave-seller'
        }`}
      >
        <svg
          viewBox="0 0 600 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-full h-auto ${isBuyer ? 'opacity-85' : 'opacity-80'}`}
        >
          <defs>
            <linearGradient
              id={waveGradientId}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              {isBuyer ? (
                <>
                  <stop offset="0%" stopColor="#C6A48F" />
                  <stop offset="100%" stopColor="#E0A04E" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#7E3A24" />
                  <stop offset="100%" stopColor="#9B4A2F" />
                </>
              )}
            </linearGradient>
          </defs>
          <path
            d="M0 400C110 370 170 290 280 305C390 320 440 210 600 160V400H0Z"
            fill={`url(#${waveGradientId})`}
          />
        </svg>
      </div>
    </div>
  )
}

export default AuthAnimatedBackdrop
