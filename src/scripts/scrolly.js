import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

export function initScrolly() {
  if (window.__SCROLLY_INIT__) return;
  window.__SCROLLY_INIT__ = true;

  ScrollTrigger.config({ ignoreMobileResize: true });

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const SCRUB = prefersReduced ? false : 0.5;

  revealOnEnter("#actions .action-card");

  // ScrollyPinned
  document.querySelectorAll(".scrolly-pinned").forEach((section) => {
    setupScrollyPinned(section, { scrub: SCRUB, prefersReduced });
  });

  // Impact timeline
  setupImpactPath({ scrub: SCRUB, prefersReduced });

  window.addEventListener("orientationchange", () =>
    setTimeout(() => ScrollTrigger.refresh(), 300),
  );
  window.addEventListener("resize", () => ScrollTrigger.refresh());
  window.addEventListener("load", () => ScrollTrigger.refresh());
}

function killSectionTriggers(section) {
  ScrollTrigger.getAll().forEach((t) => {
    const trg = t.trigger || t.vars?.trigger;
    if (trg && section.contains(trg)) t.kill();
  });
}

function revealOnEnter(selector) {
  const els = gsap.utils.toArray(selector);
  if (!els.length) return;

  els.forEach((el) =>
    ScrollTrigger.getAll().forEach((t) => {
      const trg = t.trigger || t.vars?.trigger;
      if (trg === el) t.kill();
    }),
  );

  els.forEach((el) => gsap.set(el, { autoAlpha: 0, y: 24 }));
  els.forEach((el) =>
    ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      onEnter: () =>
        gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power2.out" }),
      onEnterBack: () =>
        gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out" }),
      onLeaveBack: () => gsap.set(el, { autoAlpha: 0, y: 24 }),
    }),
  );
}

/* -------- ScrollyPinned -------- */
function setupScrollyPinned(
  section,
  { scrub = 0.5, prefersReduced = false } = {},
) {
  killSectionTriggers(section);

  const wave1 = section.querySelector(".sp-wave1");
  const wave2 = section.querySelector(".sp-wave2");
  const wave3 = section.querySelector(".sp-wave3");
  const particles = gsap.utils.toArray(
    section.querySelectorAll(".sp-particles .p"),
  );
  const meter = section.querySelector(".sp-meter-fill");
  const grade = section.querySelector(".sp-grade");
  const statNum = section.querySelector(".sp-stat-num");
  const steps = gsap.utils.toArray(section.querySelectorAll(".step"));
  const total = Math.max(steps.length, 1);
  const MAX = Number(section.dataset.max) || 1000;

  if (statNum) statNum.textContent = "0";

  [wave1, wave2, wave3].forEach((w) => {
    if (!w) return;
    const len = w.getTotalLength();
    w.style.strokeDasharray = `${len}`;
    w.style.strokeDashoffset = "0";
  });

  ScrollTrigger.matchMedia({
    "(min-width: 768px)": () => {
      const getScrollLen = () => {
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const totalPx = steps.reduce(
          (sum, el) => sum + el.getBoundingClientRect().height,
          0,
        );
        return Math.max(1, Math.round(totalPx - vh));
      };

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => "+=" + getScrollLen(),
          scrub: prefersReduced ? false : scrub,
          onUpdate: (self) => {
            if (!statNum) return;
            const v = Math.min(MAX, Math.round(self.progress * MAX));
            statNum.textContent = v.toLocaleString("da-DK");
          },
          onLeave: () =>
            statNum && (statNum.textContent = MAX.toLocaleString("da-DK")),
          onEnterBack: () => statNum && (statNum.textContent = "0"),
        },
      });

      gsap.set(meter, { scaleY: 0, transformOrigin: "bottom center" });
      gsap.set(grade, { backgroundColor: "rgba(2,6,23,0.00)" });

      wave1 && tl.to(wave1, { strokeDashoffset: -200 }, 0.0);
      wave2 && tl.to(wave2, { strokeDashoffset: -300 }, 0.0);
      wave3 && tl.to(wave3, { strokeDashoffset: -400 }, 0.0);

      if (!prefersReduced) {
        particles.forEach((p, i) => {
          tl.to(
            p,
            { y: -20 - i * 4, repeat: 1, yoyo: true, duration: 1 },
            i * 0.05,
          );
        });
      }

      tl.to(grade, { backgroundColor: "rgba(2,6,23,0.25)" }, 0.1)
        .to(grade, { backgroundColor: "rgba(2,6,23,0.45)" }, 0.65)
        .to(meter, { scaleY: 0.33 }, 0.2)
        .to(meter, { scaleY: 0.66 }, 0.5)
        .to(meter, { scaleY: 1.0 }, 0.88);

      const ratios = steps.map((_, i) =>
        Math.min(0.999, (i + 1) / steps.length),
      );
      steps.forEach((step, idx) => {
        ScrollTrigger.create({
          trigger: step,
          start: "top center",
          onEnter: () =>
            tl.tweenTo(tl.duration() * ratios[idx], { duration: 0.35 }),
          onEnterBack: () =>
            tl.tweenTo(tl.duration() * (ratios[idx - 1] ?? 0), {
              duration: 0.35,
            }),
        });
      });
    },

    "(max-width: 767px)": () => {
      gsap.set(meter, { scaleY: 0, transformOrigin: "bottom center" });
      gsap.set(grade, { backgroundColor: "rgba(2,6,23,0.15)" });

      steps.forEach((step, i) => {
        ScrollTrigger.create({
          trigger: step,
          start: "top 75%",
          onEnter: () => {
            gsap.to(meter, {
              scaleY: (i + 1) / total,
              duration: 0.4,
              ease: "power2.out",
            });
            if (!prefersReduced) {
              particles.forEach((p, idx) =>
                gsap.to(p, {
                  y: -10 - idx * 3,
                  duration: 0.5,
                  yoyo: true,
                  repeat: 1,
                  ease: "sine.inOut",
                }),
              );
            }
            if (statNum) {
              const v = Math.round(((i + 1) / total) * MAX);
              statNum.textContent = v.toLocaleString("da-DK");
            }
          },
          onLeaveBack: () => {
            gsap.to(meter, { scaleY: i / total, duration: 0.3 });
            if (statNum) {
              const v = Math.round((i / total) * MAX);
              statNum.textContent = v.toLocaleString("da-DK");
            }
          },
        });
      });
    },
  });
}

/* -------- Impact path  -------- */
function setupImpactPath({ scrub = 0.5, prefersReduced = false } = {}) {
  const section = document.querySelector("#impact");
  if (!section) return;

  killSectionTriggers(section);

  const visual = section.querySelector(".visual");
  const svg = section.querySelector("#impact-svg");
  const path = section.querySelector("#impact-path");
  const puck = section.querySelector("#impact-puck");
  let nodesG = section.querySelector(".nodes");
  const steps = gsap.utils.toArray(section.querySelectorAll(".step"));
  if (!svg || !path || !puck || !steps.length) return;

  if (!nodesG) {
    nodesG = document.createElementNS(svg.namespaceURI, "g");
    nodesG.setAttribute("class", "nodes");
    svg.appendChild(nodesG);
  }

  svg.querySelectorAll(".node").forEach((n) => n.remove());

  const L = path.getTotalLength();
  nodesG.innerHTML = "";
  const nodes = steps.map((_, i) => {
    const pct = (i + 1) / (steps.length + 1);
    const pt = path.getPointAtLength(L * pct);

    const g = document.createElementNS(svg.namespaceURI, "g");
    g.setAttribute("class", "node");
    const outer = document.createElementNS(svg.namespaceURI, "circle");
    outer.setAttribute("cx", pt.x);
    outer.setAttribute("cy", pt.y);
    outer.setAttribute("r", "14");
    outer.setAttribute("fill", "#10b981");
    outer.setAttribute("opacity", "0.5");
    const inner = document.createElementNS(svg.namespaceURI, "circle");
    inner.setAttribute("cx", pt.x);
    inner.setAttribute("cy", pt.y);
    inner.setAttribute("r", "8");
    inner.setAttribute("fill", "#10b981");
    g.appendChild(outer);
    g.appendChild(inner);
    nodesG.appendChild(g);
    return g;
  });

  nodes.forEach((n) =>
    gsap.set(n, { transformOrigin: "center center", opacity: 0.85, scale: 1 }),
  );

  let tl;
  ScrollTrigger.matchMedia({
    "(min-width: 768px)": () => {
      visual &&
        ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: "+=250%",
          pin: visual,
          pinSpacing: true,
          anticipatePin: 1,
        });

      if (!prefersReduced) {
        tl = gsap
          .timeline({
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "+=250%",
              scrub,
            },
          })
          .to(puck, {
            duration: 1,
            ease: "none",
            motionPath: {
              path,
              align: path,
              alignOrigin: [0.5, 0.5],
              autoRotate: false,
            },
          });
      } else {
        const ptEnd = path.getPointAtLength(L);
        gsap.set(puck, { cx: ptEnd.x, cy: ptEnd.y, autoAlpha: 1 });
      }
    },
    "(max-width: 767px)": () => {
      gsap.fromTo(
        puck,
        { autoAlpha: 0, scale: 0.8 },
        {
          autoAlpha: 1,
          scale: 1,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: { trigger: section, start: "top 80%" },
        },
      );
    },
  });

  const pulse = (onIdx) => {
    nodes.forEach((n, i) =>
      gsap.to(n, {
        duration: 0.35,
        scale: i === onIdx ? 1.2 : 1,
        opacity: i === onIdx ? 1 : 0.85,
        overwrite: true,
      }),
    );
  };
  const ratios = steps.map((_, i) => (i + 1) / (steps.length + 1));

  steps.forEach((step, idx) => {
    ScrollTrigger.create({
      trigger: step,
      start: "top center",
      onEnter: () => {
        pulse(idx);
        if (tl) tl.tweenTo(tl.duration() * ratios[idx], { duration: 0.35 });
      },
      onEnterBack: () => {
        pulse(idx);
        if (tl) tl.tweenTo(tl.duration() * ratios[idx], { duration: 0.35 });
      },
    });
  });
}
