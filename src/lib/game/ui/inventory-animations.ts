import { gsap } from "gsap";

const DEFAULT_GSAP_EASE = "power2.out";

export function animateInventoryPanelIn(element: HTMLElement) {
  return gsap.fromTo(
    element,
    {
      autoAlpha: 0,
      y: 28,
      scale: 0.92,
      transformOrigin: "100% 100%",
    },
    {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: 0.4,
      ease: DEFAULT_GSAP_EASE,
    },
  );
}

export function animateInventoryPanelOut(
  element: HTMLElement,
  onComplete: () => void,
) {
  return gsap.to(element, {
    autoAlpha: 0,
    y: 18,
    scale: 0.96,
    duration: 0.26,
    ease: DEFAULT_GSAP_EASE,
    onComplete,
  });
}

export function animateInventoryItemIn(element: HTMLElement) {
  return gsap.fromTo(
    element,
    {
      autoAlpha: 0,
      scale: 0.4,
      y: 10,
      transformOrigin: "50% 50%",
    },
    {
      autoAlpha: 1,
      scale: 1,
      y: 0,
      duration: 0.34,
      ease: DEFAULT_GSAP_EASE,
    },
  );
}

export function animateItemInfoModalIn(element: HTMLElement) {
  return gsap.fromTo(
    element,
    {
      autoAlpha: 0,
      y: 24,
      scale: 0.96,
      transformOrigin: "50% 50%",
    },
    {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: 0.34,
      ease: DEFAULT_GSAP_EASE,
    },
  );
}

export function animateItemInfoModalOut(
  element: HTMLElement,
  onComplete: () => void,
) {
  return gsap.to(element, {
    autoAlpha: 0,
    y: 18,
    scale: 0.98,
    duration: 0.22,
    ease: DEFAULT_GSAP_EASE,
    onComplete,
  });
}
