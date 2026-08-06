const PARTICLE_COUNT = 14;

function random(min, max) {
  return Math.random() * (max - min) + min;
}

const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  left: random(0, 100),
  size: random(40, 140),
  duration: random(14, 30),
  delay: random(0, 20),
}));

export default function ParticleField() {
  return (
    <div className="bg-particles" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
