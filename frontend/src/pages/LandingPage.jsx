import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import FaceGateLogo from "../components/FaceGateLogo.jsx";
import { FaceScanIcon, BrainIcon, GeofenceIcon, ChartIcon, LockIcon, ZapIcon } from "../components/ui/Icons.jsx";
import "../styles/landing.css";

gsap.registerPlugin(ScrollTrigger);

/* ─── Biometric Face Visual ───────────────────────────────────────────────── */
function BiometricFace() {
  return (
    <div className="fg-biometric" aria-hidden="true">
      <div className="fg-bio-ring fg-bio-ring--outer" />
      <div className="fg-bio-ring fg-bio-ring--inner" />
      <div className="fg-bio-face">
        <div className="fg-bio-bracket tl" />
        <div className="fg-bio-bracket tr" />
        <div className="fg-bio-bracket bl" />
        <div className="fg-bio-bracket br" />
        <div className="fg-bio-dot" style={{ top: "30%", left: "34%" }} />
        <div className="fg-bio-dot" style={{ top: "30%", left: "62%" }} />
        <div className="fg-bio-dot" style={{ top: "48%", left: "48%" }} />
        <div className="fg-bio-dot" style={{ top: "62%", left: "38%" }} />
        <div className="fg-bio-dot" style={{ top: "62%", left: "58%" }} />
        <div className="fg-bio-sweep" />
        <div className="fg-bio-chip">
          <span className="fg-bio-chip-dot" />
          IDENTITY VERIFIED
        </div>
      </div>
      <div className="fg-bio-readout fg-bio-readout--left">
        <span>EMBED</span>
        <span>128-D</span>
        <span>SFace</span>
      </div>
      <div className="fg-bio-readout fg-bio-readout--right">
        <span>97.3%</span>
        <span>CONF</span>
        <span>✓ GEO</span>
      </div>
    </div>
  );
}

/* ─── Tilt card ───────────────────────────────────────────────────────────── */
function TiltCard({ children, className = "" }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 12;
    const y = ((e.clientY - r.top) / r.height - 0.5) * -12;
    el.style.transform = `perspective(800px) rotateX(${y}deg) rotateY(${x}deg) scale(1.02)`;
  };
  const onLeave = () => {
    ref.current.style.transform = "perspective(800px) rotateX(0) rotateY(0) scale(1)";
  };
  return (
    <div ref={ref} className={`fg-bento-card ${className}`} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const navRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.create({
      start: "top -60px",
      onEnter: () => navRef.current?.classList.add("fg-nav--active"),
      onLeaveBack: () => navRef.current?.classList.remove("fg-nav--active"),
    });

    /* Biometric face entrance */
    gsap.fromTo(".fg-biometric",
      { scale: 0.7, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.4, ease: "power4.out", delay: 0.1 }
    );
    gsap.fromTo(".fg-hero-eyebrow",
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.7 }
    );
    gsap.fromTo(".fg-hero-h1",
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.9 }
    );
    gsap.fromTo(".fg-hero-desc",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", delay: 1.15 }
    );
    gsap.fromTo(".fg-hero-btns",
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 1.35 }
    );

    /* Stats */
    gsap.fromTo(".fg-stat",
      { y: 40, opacity: 0 },
      {
        y: 0, opacity: 1, stagger: 0.12, duration: 0.8, ease: "power2.out",
        scrollTrigger: { trigger: ".fg-stats", start: "top 88%" }
      }
    );

    /* Manifesto clip-path wipe */
    gsap.utils.toArray(".fg-manifesto-line").forEach((el, i) => {
      gsap.fromTo(el,
        { clipPath: i % 2 === 0 ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)", opacity: 0 },
        {
          clipPath: "inset(0 0% 0 0%)", opacity: 1, duration: 1.1, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 86%" }
        }
      );
    });

    /* Bento */
    gsap.fromTo(".fg-bento-card",
      { y: 60, opacity: 0 },
      {
        y: 0, opacity: 1, stagger: 0.09, duration: 0.9, ease: "power2.out",
        scrollTrigger: { trigger: ".fg-bento", start: "top 83%" }
      }
    );

    /* Timeline */
    gsap.fromTo(".fg-timeline-track",
      { scaleY: 0 },
      {
        scaleY: 1, duration: 1.5, ease: "none", transformOrigin: "top",
        scrollTrigger: { trigger: ".fg-timeline", start: "top 75%", end: "bottom 55%", scrub: true }
      }
    );
    gsap.utils.toArray(".fg-timeline-item").forEach((el) => {
      gsap.fromTo(el,
        { x: -50, opacity: 0 },
        {
          x: 0, opacity: 1, duration: 0.9, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 85%" }
        }
      );
    });

    gsap.utils.toArray(".fg-section-title").forEach((el) => {
      gsap.fromTo(el,
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" }
        }
      );
    });

    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div className="fg-root">

      {/* ── Nav ── */}
      <nav ref={navRef} className="fg-nav">
        <div className="fg-nav-inner">
          <div className="fg-nav-left">
            <a href="#features" className="fg-nav-link">Features</a>
            <a href="#how-it-works" className="fg-nav-link">How it works</a>
          </div>
          <Link to="/" style={{ textDecoration: "none" }}>
            <FaceGateLogo size={30} />
          </Link>
          <div className="fg-nav-right">
            <Link to="/login" className="fg-nav-link">Sign in</Link>
            <Link to="/signup" className="fg-cta-btn fg-cta-btn--sm">Get access</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="fg-hero">
        <div className="fg-hero-inner">
          <BiometricFace />
          <div className="fg-hero-text">
            <p className="fg-hero-eyebrow">Attendance · Reimagined</p>
            <h1 className="fg-hero-h1">
              The gate that<br />
              <em>knows your face.</em>
            </h1>
            <p className="fg-hero-desc">
              On-device face recognition + GPS geofencing. Check in under a second —
              no card, no PIN, no hardware.
            </p>
            <div className="fg-hero-btns">
              <Link to="/signup" className="fg-cta-btn">Start for free →</Link>
              <a href="#how-it-works" className="fg-outline-btn">See how it works</a>
            </div>
          </div>
        </div>
        <div className="fg-grid-lines" aria-hidden="true">
          <div /><div /><div /><div /><div />
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="fg-stats">
        <div className="fg-stats-inner">
          {[
            { num: "< 1s",  label: "Recognition time" },
            { num: "512",   label: "Embedding dimensions" },
            { num: "97%+",  label: "Webcam accuracy" },
            { num: "0",     label: "Hardware required" },
          ].map((s, i) => (
            <>
              <div key={s.num} className="fg-stat">
                <span className="fg-stat-num">{s.num}</span>
                <span className="fg-stat-label">{s.label}</span>
              </div>
              {i < 3 && <div key={`d${i}`} className="fg-stat-divider" />}
            </>
          ))}
        </div>
      </div>

      {/* ── Manifesto ── */}
      <section className="fg-manifesto">
        <div className="fg-manifesto-inner">
          <p className="fg-section-label">The problem</p>
          <div className="fg-manifesto-line">Buddy punching costs businesses</div>
          <div className="fg-manifesto-line fg-manifesto-line--accent">billions every year.</div>
          <div className="fg-manifesto-line">Lost cards. Forgotten PINs.</div>
          <div className="fg-manifesto-line">Manual spreadsheets.</div>
          <div className="fg-manifesto-line fg-manifesto-line--dim">We fixed all of it.</div>
        </div>
      </section>

      {/* ── Bento Features ── */}
      <section id="features" className="fg-section">
        <div className="fg-section-inner">
          <p className="fg-section-label">What's inside</p>
          <h2 className="fg-section-title">Built on real ML. Runs on your laptop.</h2>
          <div className="fg-bento">

            <TiltCard className="fg-bento-card--large">
              <div className="fg-bento-tag">Face Detection</div>
              <div className="fg-bento-icon-xl" style={{ display: "flex", alignItems: "center", color: "var(--accent)" }}>
                <FaceScanIcon size={36} />
              </div>
              <h3>YuNet CNN Detector</h3>
              <p>Sub-5ms detection with 5-point landmark alignment. Runs entirely on CPU — no GPU, no cloud API, no cost.</p>
              <div className="fg-bento-metric">
                <span>~3–5ms</span>
                <span className="fg-bento-metric-label">on CPU</span>
              </div>
            </TiltCard>

            <TiltCard>
              <div className="fg-bento-tag">Recognition</div>
              <div className="fg-bento-icon" style={{ display: "flex", alignItems: "center", color: "var(--accent)" }}>
                <BrainIcon size={24} />
              </div>
              <h3>SFace Recognizer</h3>
              <p>128-D unit vectors. Identity-bound — your face only matches your own enrollment, never searched against others.</p>
            </TiltCard>

            <TiltCard>
              <div className="fg-bento-tag">Geofencing</div>
              <div className="fg-bento-icon" style={{ display: "flex", alignItems: "center", color: "var(--accent)" }}>
                <GeofenceIcon size={24} />
              </div>
              <h3>Haversine Zones</h3>
              <p>Multiple named zones, each with a GPS center + radius. Check-in blocked if outside every active zone.</p>
            </TiltCard>

            <TiltCard className="fg-bento-card--wide">
              <div className="fg-bento-tag">Admin Panel</div>
              <div className="fg-bento-icon" style={{ display: "flex", alignItems: "center", color: "var(--accent)" }}>
                <ChartIcon size={24} />
              </div>
              <h3>Full attendance oversight</h3>
              <p>Manage employees, draw geofence zones on Google Maps, filter attendance records by employee and date range.</p>
              <div className="fg-bento-pills">
                <span>Employee management</span>
                <span>Map-based zones</span>
                <span>Date filtering</span>
                <span>JWT role auth</span>
              </div>
            </TiltCard>

            <TiltCard className="fg-bento-card--small">
              <div className="fg-bento-tag">Auth</div>
              <div className="fg-bento-icon" style={{ display: "flex", alignItems: "center", color: "var(--accent)" }}>
                <LockIcon size={24} />
              </div>
              <h3>JWT</h3>
              <p>Role-separated admin and employee sessions with bcrypt hashing.</p>
            </TiltCard>

            <TiltCard className="fg-bento-card--small">
              <div className="fg-bento-tag">Runtime</div>
              <div className="fg-bento-icon" style={{ display: "flex", alignItems: "center", color: "var(--accent)" }}>
                <ZapIcon size={24} />
              </div>
              <h3>ONNX</h3>
              <p>14 MB of models. Downloads once on first start.</p>
            </TiltCard>

          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section id="how-it-works" className="fg-section fg-section--alt">
        <div className="fg-section-inner">
          <p className="fg-section-label">How it works</p>
          <h2 className="fg-section-title">Three steps. Under a second.</h2>
          <div className="fg-timeline">
            <div className="fg-timeline-track" />
            {[
              {
                n: "01",
                title: "Enroll once",
                body: "Employee opens FaceGate, taps Enroll, looks at the webcam for 2 seconds. SFace generates a 128-D embedding — done once, stored against that account, used forever."
              },
              {
                n: "02",
                title: "Location verified",
                body: "On check-in, the browser sends GPS coordinates. The backend computes Haversine distance to every active geofence zone. Outside all of them — check-in is rejected."
              },
              {
                n: "03",
                title: "Face matched",
                body: "One frame through YuNet → landmark alignment → SFace. Cosine similarity checked against only your own embedding. Threshold passed — checked in."
              },
            ].map((step) => (
              <div key={step.n} className="fg-timeline-item">
                <div className="fg-timeline-node"><span>{step.n}</span></div>
                <div className="fg-timeline-body">
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech row ── */}
      <section className="fg-tech-row">
        <div className="fg-tech-row-inner">
          <p className="fg-tech-label">Powered by</p>
          <div className="fg-tech-chips">
            {["YuNet · OpenCV","SFace Recognizer","FastAPI","React + Vite","Haversine Formula","Leaflet / OSM","JWT / bcrypt"].map((t) => (
              <span key={t} className="fg-tech-chip">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA + Terminal ── */}
      <section className="fg-cta-section">
        <div className="fg-cta-section-inner">
          <div className="fg-cta-left">
            <p className="fg-section-label">Get started</p>
            <h2 className="fg-section-title" style={{ marginBottom: 16 }}>
              Your webcam<br />is the gate.
            </h2>
            <p className="fg-cta-body">No badge readers. No fingerprint scanners. No subscriptions. Open FaceGate in any browser and check in.</p>
            <div className="fg-hero-btns" style={{ marginTop: 32 }}>
              <Link to="/signup" className="fg-cta-btn">Create free account →</Link>
              <Link to="/login" className="fg-outline-btn">Sign in</Link>
            </div>
          </div>
          <div className="fg-cta-right">
            <div className="fg-cta-terminal">
              <div className="fg-terminal-bar">
                <span className="fg-t-dot r"/><span className="fg-t-dot y"/><span className="fg-t-dot g"/>
                <span className="fg-terminal-title">facegate — bash</span>
              </div>
              <div className="fg-terminal-body">
                <div className="fg-terminal-line"><span className="fg-t-prompt">$</span> uvicorn app:app --reload</div>
                <div className="fg-terminal-line fg-t-dim">✓ Models loaded (14 MB)</div>
                <div className="fg-terminal-line fg-t-dim">✓ Storage initialized</div>
                <div className="fg-terminal-line fg-t-dim">✓ Listening on :8000</div>
                <div className="fg-terminal-line" style={{marginTop: 12}}><span className="fg-t-prompt">$</span> npm run dev</div>
                <div className="fg-terminal-line fg-t-dim">✓ Vite v5 ready in 876ms</div>
                <div className="fg-terminal-line fg-t-green">➜  http://localhost:5173</div>
                <div className="fg-terminal-cursor" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="fg-footer">
        <div className="fg-footer-inner">
          <Link to="/" style={{ textDecoration: "none" }}>
            <FaceGateLogo size={24} />
          </Link>
          <p className="fg-footer-copy">Built with YuNet + SFace · FastAPI + React</p>
          <div className="fg-footer-links">
            <Link to="/login">Sign in</Link>
            <Link to="/signup">Sign up</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
