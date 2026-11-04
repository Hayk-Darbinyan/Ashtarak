import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

gsap.defaults({ ease: 'power3.out', duration: 1 })

/** Shared easing vocabulary so every section moves with the same accent. */
export const EASE = {
  out: 'power3.out',
  inOut: 'power2.inOut',
  expo: 'expo.out',
  water: 'circ.out',
}

export { gsap, ScrollTrigger }
