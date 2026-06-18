const canvas = document.getElementById("networkCanvas");
const ctx = canvas.getContext("2d");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let width = 0;
let height = 0;
let particles = [];
let animationFrame = 0;

const pointer = {
  x: 0,
  y: 0,
  active: false,
};

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  createParticles();
}

function createParticles() {
  const density = width < 720 ? 34 : 62;
  const total = Math.round((width * height) / 22000);
  const count = Math.max(24, Math.min(density, total));

  particles = Array.from({ length: count }, (_, index) => ({
    x: Math.random() * width,
    y: Math.random() * height,
    z: 0.35 + Math.random() * 0.95,
    vx: (Math.random() - 0.5) * 0.22,
    vy: (Math.random() - 0.5) * 0.22,
    pulse: Math.random() * Math.PI * 2,
    lane: index % 4,
  }));
}

function drawDataStreams(time) {
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = "rgba(255, 106, 0, 0.34)";
  ctx.lineWidth = 1;

  for (let i = 0; i < 6; i += 1) {
    const y = ((time * 0.018) + i * 142) % (height + 180) - 90;
    const offset = Math.sin(time * 0.001 + i) * 38;
    ctx.beginPath();
    ctx.moveTo(-80, y);
    ctx.bezierCurveTo(width * 0.26, y - 84 + offset, width * 0.62, y + 92 - offset, width + 90, y - 22);
    ctx.stroke();
  }

  ctx.restore();
}

function drawParticles(time) {
  const maxDistance = width < 720 ? 126 : 158;

  particles.forEach((particle) => {
    particle.x += particle.vx * particle.z;
    particle.y += particle.vy * particle.z;
    particle.pulse += 0.018;

    if (particle.x < -20) particle.x = width + 20;
    if (particle.x > width + 20) particle.x = -20;
    if (particle.y < -20) particle.y = height + 20;
    if (particle.y > height + 20) particle.y = -20;

    if (pointer.active) {
      const dx = particle.x - pointer.x;
      const dy = particle.y - pointer.y;
      const distance = Math.hypot(dx, dy);

      if (distance < 150) {
        particle.x += (dx / Math.max(distance, 1)) * 0.24;
        particle.y += (dy / Math.max(distance, 1)) * 0.24;
      }
    }
  });

  for (let i = 0; i < particles.length; i += 1) {
    for (let j = i + 1; j < particles.length; j += 1) {
      const a = particles[i];
      const b = particles[j];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);

      if (distance < maxDistance) {
        const alpha = (1 - distance / maxDistance) * 0.28;
        ctx.strokeStyle = `rgba(255, 106, 0, ${alpha})`;
        ctx.lineWidth = 0.6 + Math.min(a.z, b.z) * 0.45;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  particles.forEach((particle) => {
    const radius = 1.2 + particle.z * 1.7 + Math.sin(particle.pulse + time * 0.001) * 0.25;
    const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, radius * 4);
    gradient.addColorStop(0, "rgba(255, 138, 31, 0.95)");
    gradient.addColorStop(1, "rgba(255, 106, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, radius * 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 240, 226, 0.88)";
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function render(time = 0) {
  ctx.clearRect(0, 0, width, height);
  drawDataStreams(time);
  drawParticles(time);

  if (!prefersReducedMotion) {
    animationFrame = window.requestAnimationFrame(render);
  }
}

function setupRevealAnimations() {
  const elements = document.querySelectorAll(".section-reveal");

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });

  elements.forEach((element) => observer.observe(element));
}

document.querySelectorAll("[data-scroll-target]").forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));

    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

window.addEventListener("resize", resizeCanvas);
window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.active = true;
});
window.addEventListener("pointerleave", () => {
  pointer.active = false;
});

resizeCanvas();
setupRevealAnimations();
render();

if (prefersReducedMotion) {
  window.cancelAnimationFrame(animationFrame);
}
