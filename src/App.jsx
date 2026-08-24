import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  Upload,
  ClipboardPaste,
  Info,
  IndianRupee,
  Clock,
  Gift,
  Link2,
  Sparkles,
  RefreshCw,
  Layers,
  PlayCircle,
  Wifi,
  BatteryFull,
  Signal,
} from "lucide-react";

/* ---------------------------------------------------------------------
   ScamLens — "Check before you pay."
   Mobile-first cybersecurity prototype
--------------------------------------------------------------------- */

const CASES = {
  high: {
    id: "high",
    tag: "🔴 Suspicious",
    accent: "danger",
    message:
      "Congratulations! You have won ₹25,000. Pay ₹499 processing fee immediately to claim your prize.",
    level: "high",
    score: 91,
    headline: "Multiple suspicious indicators detected.",
    reasons: [
      { label: "Unexpected payment request", icon: "rupee" },
      { label: "Urgency / manipulation", icon: "clock" },
      { label: "Prize bait", icon: "gift" },
      { label: "Suspicious financial instruction", icon: "alert" },
    ],
    recommendation:
      "Verify the sender independently before making any payment.",
    explanation:
      "This message requests an unexpected processing fee while using urgency and prize language. These patterns can be associated with payment scams. Verify the sender independently before making a payment.",
  },

  gaming: {
    id: "gaming",
    tag: "🎮 Gaming Scam",
    accent: "danger",
    message:
      "Congratulations! You have been selected for a ₹15,000 BGMI tournament reward. Pay ₹299 verification fee immediately to claim your prize.",
    level: "high",
    score: 92,
    headline: "Gaming-related scam indicators detected.",
    reasons: [
      { label: "Unexpected payment request", icon: "rupee" },
      { label: "Urgency / manipulation", icon: "clock" },
      { label: "Prize bait", icon: "gift" },
      { label: "Gaming-related scam pattern", icon: "alert" },
    ],
    recommendation:
      "Do not pay the verification fee. Verify the tournament through its official channel.",
    explanation:
      "This message combines gaming-related content with an unexpected payment request and urgent language. These patterns can be associated with gaming-related scams.",
  },

  medium: {
    id: "medium",
    tag: "🟡 Needs Verification",
    accent: "warn",
    message:
      "Your refund of ₹1,200 is ready. Complete verification to receive it.",
    level: "medium",
    score: 58,
    headline: "Some signals require manual verification.",
    reasons: [
      { label: "Unexpected verification instruction", icon: "info" },
      {
        label: "Financial request requiring confirmation",
        icon: "rupee",
      },
    ],
    recommendation:
      "Verify the refund through the official merchant/app.",
    explanation:
      "This message asks you to complete a verification step in order to receive money — a pattern also seen in refund-related scams. Confirm the refund directly through the merchant's official app before taking any action.",
  },

  low: {
    id: "low",
    tag: "🟢 Legitimate",
    accent: "safe",
    message:
      "Payment of ₹799 to ABC Store completed successfully. Transaction ID: DEMO-12345.",
    level: "low",
    score: 6,
    headline:
      "No major suspicious payment indicators were detected.",
    reasons: [],
    recommendation:
      "No action needed — this reads as a standard transaction confirmation.",
    explanation:
      "This message follows the structure of a routine transaction confirmation: a completed payment, a specific amount, and a transaction ID. No urgency, prize, or unusual payment instructions were found.",
  },
};

const ICONS = {
  rupee: IndianRupee,
  clock: Clock,
  gift: Gift,
  alert: AlertTriangle,
  info: Info,
  link: Link2,
};

const ACCENT = {
  high: {
    fg: "var(--danger)",
    soft: "var(--danger-soft)",
    ring: "var(--danger)",
  },
  medium: {
    fg: "var(--warn)",
    soft: "var(--warn-soft)",
    ring: "var(--warn)",
  },
  low: {
    fg: "var(--safe)",
    soft: "var(--safe-soft)",
    ring: "var(--safe)",
  },
};

function levelMeta(level) {
  if (level === "high") return { label: "HIGH RISK", dot: "🔴" };
  if (level === "medium")
    return { label: "NEEDS VERIFICATION", dot: "🟡" };

  return { label: "LOW RISK", dot: "🟢" };
}

/* ---------------------------------------------------------------------
   Deterministic scam detection engine
--------------------------------------------------------------------- */

function analyzeCustomText(raw) {
  const text = raw.trim();
  const norm = text.toLowerCase();

  if (!text) {
    return CASES.low;
  }

  /* Canonical demo cases */
  for (const c of Object.values(CASES)) {
    if (norm === c.message.toLowerCase()) {
      return c;
    }
  }

  const signals = [];

  /* 1. Payment */
  if (
    /pay ₹|pay rs|processing fee|verification fee|registration fee|entry fee|advance payment|send money|transfer.*fee|payment.*pending|deposit|pay.*fee|fee.*pay/i.test(
      text
    )
  ) {
    signals.push({
      label: "Unexpected payment request",
      icon: "rupee",
      weight: 30,
    });
  }

  /* 2. Urgency */
  if (
    /immediately|urgent|within \d+ (hours?|days?)|do not delay|asap|act fast|right now|don't wait|hurry|unless you|today only|limited time/i.test(
      text
    )
  ) {
    signals.push({
      label: "Urgency / manipulation",
      icon: "clock",
      weight: 15,
    });
  }

  /* 3. Prize */
  if (
    /won|prize|congratulations|lucky draw|lottery|selected|claim.*reward|bonus|free.*money|reward|cash prize|tournament reward/i.test(
      text
    )
  ) {
    signals.push({
      label: "Prize / reward bait",
      icon: "gift",
      weight: 20,
    });
  }

  /* 4. Credentials */
  if (
    /otp|pin|cvv|password|passcode|security code|2fa|two-factor|confirm.*password|enter.*otp|provide.*pin|verification code/i.test(
      text
    )
  ) {
    signals.push({
      label: "Sensitive credential request",
      icon: "alert",
      weight: 25,
    });
  }

  /* 5. KYC */
  if (
    /kyc|know your customer|verify.*account|account.*verification|identity.*verification|complete.*verification|confirm.*identity/i.test(
      text
    )
  ) {
    signals.push({
      label: "KYC / account verification request",
      icon: "info",
      weight: 20,
    });
  }

  /* 6. Account threat */
  if (
    /will be (?:blocked|suspended|deactivat|closed)|account.*(?:block|suspend|lock|restrict)|access.*denied|unauthorized activity|unusual activity|suspicious activity|account.*expire/i.test(
      text
    )
  ) {
    signals.push({
      label: "Account blocking / security threat",
      icon: "alert",
      weight: 20,
    });
  }

  /* 7. Brand impersonation */
  const brandNames =
    /hdfc|icici|axis|sbi|state bank|american express|bank of america|chase|wellsfargo|paypal|amazon|apple|microsoft|google|facebook|linkedin|uber|flipkart|whatsapp|shiksha vertex|microsoft certified/i;

  const formalGreeting =
    /dear (?:customer|student|user|member|valued customer|sir|madam)/i;

  if (brandNames.test(text) && formalGreeting.test(text)) {
    signals.push({
      label: "Possible brand / organization impersonation",
      icon: "link",
      weight: 20,
    });
  }

  /* 8. Suspicious URL */
  if (
    /https?:\/\/[^\s]+|www\.[^\s]+|bit\.ly|tinyurl|short\.link|click here|click the link|tap here|visit link|open.*link|verify via/i.test(
      text
    )
  ) {
    signals.push({
      label: "Suspicious URL / link",
      icon: "link",
      weight: 25,
    });
  }

  /* 9. Delivery / refund */
  if (
    /refund|delivery.*failed|reschedul|redelivery|confirm.*delivery|retry.*delivery|pending.*refund|parcel|courier/i.test(
      text
    )
  ) {
    signals.push({
      label: "Delivery / refund scam pattern",
      icon: "info",
      weight: 15,
    });
  }

  /* 10. Financial instructions */
  if (
    /activation fee|security deposit|balance verification|update.*payment|verify.*payment|account.*fund|upi.*payment|upi id/i.test(
      text
    )
  ) {
    signals.push({
      label: "Suspicious financial instruction",
      icon: "rupee",
      weight: 15,
    });
  }

  /* 11. Gaming */
  const gamingDetected =
    /\bbgmi\b|\bfree\s*fire\b|\bgaming\b|\btournament\b|\besports\b|\buc\b|\bdiamonds\b|game\s+account|gaming\s+account|game reward|gaming reward/i.test(
      text
    );

  if (gamingDetected) {
    signals.push({
      label: "Gaming-related scam pattern",
      icon: "alert",
      weight: 18,
    });
  }

  /* Legitimate transaction */
  const legit =
    /completed successfully|transaction id|order confirmed|delivered|payment received|successfully paid|order delivered/i.test(
      text
    );

  /* Score */
  let score;

  if (signals.length === 0 && legit) {
    score = 6;
  } else if (signals.length === 0) {
    score = 24;
  } else {
    score = Math.min(
      98,
      signals.reduce((total, signal) => total + signal.weight, 0)
    );
  }

  let level = "low";

  if (score >= 70) {
    level = "high";
  } else if (score >= 30) {
    level = "medium";
  }

  /* Extra boost for combinations */
  const labels = signals.map((s) => s.label);

  const hasPayment = labels.some(
    (x) => x.includes("payment") || x.includes("financial")
  );

  const hasCredential = labels.some((x) =>
    x.includes("credential")
  );

  const hasVerification = labels.some(
    (x) => x.includes("verification") || x.includes("KYC")
  );

  const hasThreats = labels.some((x) =>
    x.includes("blocking")
  );

  const hasLink = labels.some(
    (x) => x.includes("URL") || x.includes("link")
  );

  const hasImpersonation = labels.some((x) =>
    x.includes("impersonation")
  );

  const hasUrgency = labels.some((x) =>
    x.includes("Urgency")
  );

  const hasDelivery = labels.some((x) =>
    x.includes("Delivery")
  );

  const hasPrize = labels.some(
    (x) => x.includes("Prize") || x.includes("reward")
  );

  const hasGaming = labels.some((x) =>
    x.includes("Gaming")
  );

  /*
     Combination boost:
     This helps gaming/payment/link combinations reach
     high risk instead of staying artificially low.
  */
  if (
    hasGaming &&
    (hasPayment ||
      hasPrize ||
      hasUrgency ||
      hasLink ||
      hasCredential)
  ) {
    score = Math.min(98, Math.max(score, 78));
    level = "high";
  }

  if (
    hasLink &&
    (hasVerification || hasThreats || hasImpersonation)
  ) {
    score = Math.min(98, Math.max(score, 75));
    level = "high";
  }

  if (
    hasCredential &&
    (hasThreats || hasUrgency || hasImpersonation)
  ) {
    score = Math.min(98, Math.max(score, 82));
    level = "high";
  }

  /* Headline */
  let headline;

  if (level === "high") {
    headline = "Multiple suspicious indicators detected.";
  } else if (level === "medium") {
    headline = "Some signals require manual verification.";
  } else {
    headline = "No major suspicious indicators were detected.";
  }

  /* Explanation */
  let explanation;

  if (signals.length === 0) {
    explanation =
      "No suspicious patterns were detected in this message. It appears to be a routine notification.";
  } else if (
    hasImpersonation &&
    hasThreats &&
    (hasVerification || hasCredential)
  ) {
    explanation =
      "This message may impersonate a legitimate organization and uses account-related pressure to encourage verification. These are common social-engineering patterns. Verify the sender independently before providing information.";
  } else if (
    hasImpersonation &&
    hasLink &&
    hasVerification
  ) {
    explanation =
      "This message combines organization impersonation, a suspicious link, and verification language. These patterns are commonly associated with phishing. Use the organization's official website or app instead of the provided link.";
  } else if (
    hasCredential &&
    (hasImpersonation || hasThreats || hasUrgency)
  ) {
    explanation =
      "This message requests sensitive credentials while using social-engineering signals such as urgency or account threats. Never share OTPs, PINs, passwords, or similar credentials through an unsolicited message.";
  } else if (
    hasThreats &&
    (hasUrgency || hasVerification)
  ) {
    explanation =
      "This message uses urgency and account-related threats to pressure the recipient into taking immediate action. Verify the situation independently through the organization's official channel.";
  } else if (
    hasGaming &&
    (hasPayment ||
      hasPrize ||
      hasUrgency ||
      hasLink ||
      hasCredential)
  ) {
    explanation =
      "This message combines gaming-related content with suspicious payment, reward, urgency, link, or credential signals. These patterns can be associated with gaming-related scams. Verify the tournament, reward, sender, or account request through the official channel.";
  } else if (hasPayment && hasUrgency) {
    explanation =
      "This message combines urgency with an unexpected payment or fee request. These patterns are commonly associated with financial scams. Verify the request independently before paying.";
  } else if (hasDelivery && hasLink) {
    explanation =
      "This message references a delivery or refund issue and directs the recipient toward a link. This combination can be used in phishing attempts. Verify the delivery directly through the official service.";
  } else if (hasPrize && hasUrgency) {
    explanation =
      "This message claims the recipient has won a reward and uses urgency to encourage immediate action. Prize scams commonly use these techniques to pressure people into paying or sharing information.";
  } else if (hasLink && (hasImpersonation || hasVerification)) {
    explanation =
      "This message contains a suspicious link together with organization or verification language. Do not use the supplied link. Verify through the official website or app.";
  } else if (hasLink) {
    explanation =
      "This message contains a link that requires caution. Avoid clicking unexpected links and verify the sender through an official channel.";
  } else {
    explanation =
      "This message contains multiple suspicious indicators. Verify the sender before clicking links, sharing sensitive information, or making payments.";
  }

  /* Recommendation */
  let recommendation;

  if (signals.length === 0) {
    recommendation =
      "No action needed — no major risk signals were found.";
  } else if (
    hasGaming &&
    (hasPayment ||
      hasPrize ||
      hasUrgency ||
      hasLink ||
      hasCredential)
  ) {
    recommendation =
      "Do not pay verification or reward fees. Verify the tournament, reward, sender, or account request through its official channel.";
  } else if (hasCredential || hasThreats) {
    recommendation =
      "Do NOT provide OTPs, PINs, passwords, or sensitive information. Contact the organization directly using official contact information.";
  } else if (hasLink) {
    recommendation =
      "Do NOT click links in this message. Visit the official website or app directly using a trusted route.";
  } else if (hasPayment) {
    recommendation =
      "Do NOT make any payment or transfer funds. Verify the request independently through official channels.";
  } else {
    recommendation =
      "Verify the sender independently using official contact information before taking action.";
  }

  return {
    id: "custom",
    accent: level,
    message: text,
    level,
    score,
    headline,
    reasons: signals.map((s) => ({
      label: s.label,
      icon: s.icon,
    })),
    recommendation,
    explanation,
  };
}

/* ---------------------------------------------------------------------
   UI components
--------------------------------------------------------------------- */

function LensMark({
  size = 28,
  spinning = false,
  accent = "var(--brand)",
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={spinning ? "sl-spin-slow" : ""}
    >
      <circle
        cx="24"
        cy="24"
        r="21"
        stroke={accent}
        strokeOpacity="0.25"
        strokeWidth="2"
      />

      <circle
        cx="24"
        cy="24"
        r="14.5"
        stroke={accent}
        strokeOpacity="0.55"
        strokeWidth="2"
      />

      <circle
        cx="24"
        cy="24"
        r="8"
        fill={accent}
        fillOpacity="0.16"
        stroke={accent}
        strokeWidth="2"
      />

      <circle
        cx="24"
        cy="24"
        r="2.4"
        fill={accent}
      />
    </svg>
  );
}

function StatusBar() {
  return (
    <div className="sl-statusbar">
      <span className="sl-statustime">9:41</span>

      <div className="sl-statusicons">
        <Signal size={13} strokeWidth={2.4} />
        <Wifi size={13} strokeWidth={2.4} />
        <BatteryFull size={15} strokeWidth={2.2} />
      </div>
    </div>
  );
}

function TopBar({ title, onBack, onHow }) {
  return (
    <div className="sl-topbar">
      <button
        className="sl-iconbtn"
        onClick={onBack}
        style={{
          visibility: onBack ? "visible" : "hidden",
        }}
        aria-label="Back"
      >
        <ChevronLeft size={19} />
      </button>

      <span className="sl-topbar-title">{title}</span>

      <button
        className="sl-iconbtn"
        onClick={onHow}
        style={{
          visibility: onHow ? "visible" : "hidden",
        }}
        aria-label="How it works"
      >
        <Layers size={17} />
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Home
--------------------------------------------------------------------- */

function HomeScreen({
  goInput,
  goDemo,
  goHow,
}) {
  return (
    <div className="sl-screen sl-home">
      <div className="sl-home-top">
        <button
          className="sl-iconbtn"
          onClick={goHow}
          aria-label="How it works"
        >
          <Layers size={17} />
        </button>
      </div>

      <div className="sl-home-hero">
        <LensMark size={64} accent="var(--brand)" />

        <h1 className="sl-wordmark">
          Scam<span style={{ color: "var(--brand)" }}>
            Lens
          </span>
        </h1>

        <p className="sl-tagline">
          "Check before you pay."
        </p>

        <p className="sl-home-desc">
          Analyze suspicious messages before you act.
        </p>

        <p className="sl-home-secondary">
          Built for mobile-first protection, with gaming
          and power-user scenarios in mind.
        </p>
      </div>

      <div className="sl-gaming-card">
        <div className="sl-gaming-card-icon">
          <PlayCircle size={17} />
        </div>

        <div>
          <div className="sl-gaming-card-title">
            Gaming Protection
          </div>

          <div className="sl-gaming-card-text">
            Detect fake tournament fees, gaming rewards,
            account scams and suspicious payment links.
          </div>
        </div>
      </div>

      <div className="sl-home-actions">
        <button
          className="sl-btn sl-btn-primary"
          onClick={goInput}
        >
          Check a message
          <ArrowRight size={18} />
        </button>

        <button
          className="sl-btn sl-btn-ghost"
          onClick={goDemo}
        >
          <PlayCircle size={17} />
          Try demo
        </button>
      </div>

      <div className="sl-home-footer">
        <span>Prototype · iQOO Hackathon 2026</span>
        <span className="sl-dot">·</span>
        <span>Gaming &amp; Digital Safety</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Demo
--------------------------------------------------------------------- */

function DemoPickerScreen({
  pick,
  goBack,
}) {
  const tiles = [
    {
      c: CASES.high,
      hue: "danger",
      desc: "Prize bait + urgent processing fee",
    },
    {
      c: CASES.gaming,
      hue: "danger",
      desc: "Gaming reward + verification fee",
    },
    {
      c: CASES.medium,
      hue: "warn",
      desc: "Refund pending manual verification",
    },
    {
      c: CASES.low,
      hue: "safe",
      desc: "Confirmed store payment receipt",
    },
  ];

  return (
    <div className="sl-screen">
      <TopBar
        title="Try demo"
        onBack={goBack}
      />

      <div className="sl-screen-body">
        <p className="sl-section-lead">
          Pick a scenario — ScamLens runs the full
          capture-to-action flow instantly.
        </p>

        <div className="sl-demo-list">
          {tiles.map(({ c, hue, desc }) => (
            <button
              key={c.id}
              className={`sl-demo-tile sl-tone-${hue}`}
              onClick={() => pick(c)}
            >
              <div className="sl-demo-tile-top">
                <span className="sl-demo-tile-tag">
                  {c.tag}
                </span>

                <ArrowRight size={16} />
              </div>

              <p className="sl-demo-tile-msg">
                "{c.message}"
              </p>

              <p className="sl-demo-tile-desc">
                {desc}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Input
--------------------------------------------------------------------- */

function InputScreen({
  goBack,
  goHow,
  runAnalysis,
}) {
  const [text, setText] = useState("");
  const [scanning, setScanning] = useState(false);

  const examples = [
    { c: CASES.high, hue: "danger" },
    { c: CASES.gaming, hue: "danger" },
    { c: CASES.medium, hue: "warn" },
    { c: CASES.low, hue: "safe" },
  ];

  const simulateUpload = () => {
    setScanning(true);

    setTimeout(() => {
      setText(CASES.gaming.message);
      setScanning(false);
    }, 900);
  };

  return (
    <div className="sl-screen">
      <TopBar
        title="Scan suspicious content"
        onBack={goBack}
        onHow={goHow}
      />

      <div className="sl-screen-body">
        <div className="sl-capture-row">
          <button
            className="sl-capture-btn"
            onClick={simulateUpload}
          >
            <Upload size={17} />
            Upload screenshot
          </button>

          <div className="sl-capture-btn sl-capture-btn-active">
            <ClipboardPaste size={17} />
            Paste message
          </div>
        </div>

        {scanning && (
          <div className="sl-inline-scan">
            <span className="sl-inline-scan-dot" />
            Reading screenshot text (prototype demo)…
          </div>
        )}

        <textarea
          className="sl-textarea"
          placeholder="Paste a suspicious message here…"
          value={text}
          onChange={(e) =>
            setText(e.target.value)
          }
          rows={5}
        />

        <div className="sl-check-info">
          <div className="sl-check-info-title">
            ScamLens checks for
          </div>

          <div className="sl-check-info-items">
            <span>💰 Payment</span>
            <span>🔗 Links</span>
            <span>⏰ Urgency</span>
            <span>🎁 Rewards</span>
            <span>🔐 Credentials</span>
            <span>🎮 Gaming</span>
          </div>
        </div>

        <p
          className="sl-section-lead"
          style={{ marginTop: 20 }}
        >
          Or try a ready-made example
        </p>

        <div className="sl-example-row">
          {examples.map(({ c, hue }) => (
            <button
              key={c.id}
              className={`sl-example-chip sl-tone-${hue}`}
              onClick={() =>
                setText(c.message)
              }
            >
              {c.tag}
            </button>
          ))}
        </div>

        <button
          className="sl-btn sl-btn-primary sl-btn-block"
          disabled={!text.trim()}
          onClick={() =>
            runAnalysis(text)
          }
          style={{ marginTop: 26 }}
        >
          Analyze message
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Analyzing
--------------------------------------------------------------------- */

function AnalyzingScreen({ onDone }) {
  const steps = [
    "Extracting message content…",
    "Checking payment signals…",
    "Checking suspicious URLs…",
    "Checking urgency & manipulation…",
    "Checking prize & reward patterns…",
    "Checking gaming scam patterns…",
    "Checking credential requests…",
    "Checking brand impersonation…",
    "Preparing risk assessment…",
  ];

  const [activeIdx, setActiveIdx] =
    useState(-1);

  useEffect(() => {
    let i = -1;
    const timers = [];

    const tick = () => {
      i += 1;
      setActiveIdx(i);

      if (i < steps.length - 1) {
        timers.push(
          setTimeout(tick, 350)
        );
      } else {
        timers.push(
          setTimeout(onDone, 550)
        );
      }
    };

    timers.push(
      setTimeout(tick, 250)
    );

    return () =>
      timers.forEach(clearTimeout);
  }, [onDone]);

  return (
    <div className="sl-screen sl-analyzing">
      <div className="sl-scan-ring-wrap">
        <div className="sl-scan-ring-outer sl-spin-slow" />
        <div className="sl-scan-ring-mid sl-spin-rev" />

        <LensMark
          size={40}
          accent="var(--brand)"
        />
      </div>

      <h2 className="sl-analyzing-title">
        Analyzing message…
      </h2>

      <p className="sl-analyzing-subtitle">
        Running explainable security checks
      </p>

      <div className="sl-checklist">
        {steps.map((step, idx) => {
          const state =
            idx < activeIdx
              ? "done"
              : idx === activeIdx
              ? "active"
              : "pending";

          return (
            <div
              key={step}
              className={`sl-check-row sl-check-${state}`}
            >
              <span className="sl-check-icon">
                {state === "done" ? (
                  <CheckCircle2 size={16} />
                ) : state === "active" ? (
                  <span className="sl-check-spinner" />
                ) : (
                  <span className="sl-check-empty" />
                )}
              </span>

              {step}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Counter
--------------------------------------------------------------------- */

function useCountUp(
  target,
  active,
  duration = 1100
) {
  const [val, setVal] = useState(0);
  const rafRef = useRef();

  useEffect(() => {
    if (!active) return;

    const start = performance.now();

    const ease = (t) =>
      1 - Math.pow(1 - t, 3);

    const step = (now) => {
      const progress = Math.min(
        1,
        (now - start) / duration
      );

      setVal(
        Math.round(
          target * ease(progress)
        )
      );

      if (progress < 1) {
        rafRef.current =
          requestAnimationFrame(step);
      }
    };

    rafRef.current =
      requestAnimationFrame(step);

    return () =>
      cancelAnimationFrame(
        rafRef.current
      );
  }, [target, active, duration]);

  return val;
}

/* ---------------------------------------------------------------------
   Risk gauge
--------------------------------------------------------------------- */

function RiskGauge({
  score,
  level,
}) {
  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    const timer = setTimeout(
      () => setMounted(true),
      60
    );

    return () =>
      clearTimeout(timer);
  }, []);

  const count = useCountUp(
    score,
    mounted,
    1100
  );

  const r = 66;
  const circ = 2 * Math.PI * r;

  const offset =
    circ -
    (Math.min(score, 100) / 100) *
      circ;

  const accent =
    ACCENT[level].ring;

  return (
    <div className="sl-gauge-wrap">
      <svg
        width="168"
        height="168"
        viewBox="0 0 168 168"
      >
        <circle
          cx="84"
          cy="84"
          r={r}
          className="sl-gauge-track"
        />

        <circle
          cx="84"
          cy="84"
          r={r}
          stroke={accent}
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          transform="rotate(-90 84 84)"
          style={{
            strokeDasharray: circ,
            strokeDashoffset: mounted
              ? offset
              : circ,
            transition:
              "stroke-dashoffset 1.1s cubic-bezier(.22,.9,.3,1)",
            filter: `drop-shadow(0 0 10px ${accent}66)`,
          }}
        />
      </svg>

      <div className="sl-gauge-center">
        <span
          className="sl-gauge-score"
          style={{
            color: accent,
          }}
        >
          {count}
        </span>

        <span className="sl-gauge-max">
          / 100
        </span>

        <span className="sl-gauge-label">
          Risk Score
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Results
--------------------------------------------------------------------- */

function ResultScreen({
  result,
  goCheckAnother,
  goBack,
  goHow,
}) {
  const meta = levelMeta(
    result.level
  );

  const accent =
    ACCENT[result.level];

  const [showReasons, setShowReasons] =
    useState(false);

  useEffect(() => {
    setShowReasons(false);

    const timer = setTimeout(
      () => setShowReasons(true),
      550
    );

    return () =>
      clearTimeout(timer);
  }, [result]);

  return (
    <div className="sl-screen">
      <TopBar
        title="Risk analysis"
        onBack={goBack}
        onHow={goHow}
      />

      <div className="sl-screen-body sl-result-body">
        <div
          className="sl-verdict-banner"
          style={{
            background:
              accent.soft,
            color: accent.fg,
            borderColor:
              `${accent.fg}33`,
          }}
        >
          {meta.dot} {meta.label}
        </div>

        <RiskGauge
          score={result.score}
          level={result.level}
        />

        <p className="sl-result-headline">
          {result.headline}
        </p>

        {result.reasons.length > 0 && (
          <div className="sl-reasons-block">
            <span className="sl-reasons-title">
              WHY?
            </span>

            <div className="sl-reasons-list">
              {result.reasons.map(
                (reason, index) => {
                  const Icon =
                    ICONS[
                      reason.icon
                    ] ||
                    AlertTriangle;

                  return (
                    <div
                      key={
                        reason.label
                      }
                      className={`sl-reason-row ${
                        showReasons
                          ? "sl-reason-in"
                          : ""
                      }`}
                      style={{
                        transitionDelay:
                          `${index * 90}ms`,
                      }}
                    >
                      <span
                        className="sl-reason-icon"
                        style={{
                          color:
                            accent.fg,
                          background:
                            accent.soft,
                        }}
                      >
                        <Icon size={14} />
                      </span>

                      {reason.label}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

        <div className="sl-ai-block">
          <div className="sl-ai-block-head">
            <Sparkles size={14} />
            ScamLens Intelligence —
            Explainable Analysis
          </div>

          <p className="sl-ai-block-text">
            {result.explanation}
          </p>
        </div>

        <div className="sl-action-block">
          <span className="sl-action-title">
            RECOMMENDED ACTION
          </span>

          <p className="sl-action-text">
            {result.recommendation}
          </p>
        </div>

        <button
          className="sl-btn sl-btn-primary sl-btn-block"
          onClick={goCheckAnother}
        >
          <RefreshCw size={16} />
          Check another
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   How it works
--------------------------------------------------------------------- */

function HowScreen({ goBack }) {
  const flow = [
    {
      t: "Capture",
      d: "Screenshot or message text is provided to ScamLens.",
    },
    {
      t: "Extract",
      d: "Message content is prepared for analysis.",
    },
    {
      t: "Signal detection",
      d: "Checks identify payment, urgency, prize, credential, URL, impersonation, gaming and other suspicious patterns.",
    },
    {
      t: "Explainable analysis",
      d: "Detected signals are converted into transparent reasons.",
    },
    {
      t: "0–100 risk score",
      d: "A deterministic score maps to low, medium, or high risk.",
    },
    {
      t: "Recommended action",
      d: "One concrete safety recommendation helps the user decide what to do next.",
    },
    {
      t: "Future AI + on-device intelligence",
      d: "Production versions can use AI-assisted analysis and supported on-device models for improved privacy and capability.",
    },
  ];

  return (
    <div className="sl-screen">
      <TopBar
        title="How it works"
        onBack={goBack}
      />

      <div className="sl-screen-body">
        <p className="sl-section-lead">
          Lightweight, explainable analysis —
          no bank integration or server-side ML
          in the current MVP.
        </p>

        <div className="sl-flow">
          {flow.map((item, index) => (
            <div
              className="sl-flow-row"
              key={item.t}
            >
              <div className="sl-flow-num">
                {String(index + 1).padStart(
                  2,
                  "0"
                )}
              </div>

              <div className="sl-flow-line" />

              <div>
                <div className="sl-flow-title">
                  {item.t}
                </div>

                <div className="sl-flow-desc">
                  {item.d}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   App
--------------------------------------------------------------------- */

export default function App() {
  const [screen, setScreen] =
    useState("home");

  const [pendingCase, setPendingCase] =
    useState(null);

  const [result, setResult] =
    useState(null);

  const startAnalysis =
    useCallback((source) => {
      const caseObj =
        typeof source === "string"
          ? analyzeCustomText(source)
          : source;

      setPendingCase(caseObj);
      setScreen("analyzing");
    }, []);

  const finishAnalysis =
    useCallback(() => {
      setResult(pendingCase);
      setScreen("result");
    }, [pendingCase]);

  return (
    <div className="sl-app-bg">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap');

        .sl-app-bg {
          --ink:#090D16;
          --surface:#111A2C;
          --surface-2:#16213A;
          --border:rgba(255,255,255,0.08);

          --text-1:#EEF2FA;
          --text-2:#93A0BC;
          --text-3:#5B6584;

          --brand:#5B8CFF;
          --brand-soft:rgba(91,140,255,0.14);

          --safe:#2FD9A6;
          --safe-soft:rgba(47,217,166,0.14);

          --warn:#F5B833;
          --warn-soft:rgba(245,184,51,0.14);

          --danger:#FF5D6C;
          --danger-soft:rgba(255,93,108,0.14);

          font-family:'Inter',sans-serif;

          min-height:680px;
          width:100%;

          display:flex;
          align-items:center;
          justify-content:center;

          padding:28px 12px;

          background:
            radial-gradient(
              circle at 18% 8%,
              rgba(91,140,255,0.16),
              transparent 42%
            ),
            radial-gradient(
              circle at 84% 92%,
              rgba(47,217,166,0.10),
              transparent 45%
            ),
            var(--ink);

          box-sizing:border-box;
        }

        .sl-app-bg * {
          box-sizing:border-box;
        }

        .sl-phone {
          width:100%;
          max-width:380px;
          height:780px;
          max-height:92vh;

          background:
            linear-gradient(
              180deg,
              var(--surface) 0%,
              var(--ink) 100%
            );

          border-radius:40px;
          border:1px solid var(--border);

          box-shadow:
            0 40px 90px -30px rgba(0,0,0,0.7),
            0 0 0 8px rgba(255,255,255,0.02);

          overflow:hidden;
          position:relative;

          display:flex;
          flex-direction:column;
        }

        .sl-statusbar {
          display:flex;
          align-items:center;
          justify-content:space-between;

          padding:
            14px 26px 4px;

          color:var(--text-1);

          font-family:'JetBrains Mono',monospace;
          font-size:12px;
        }

        .sl-statusicons {
          display:flex;
          align-items:center;
          gap:6px;
        }

        .sl-topbar {
          display:flex;
          align-items:center;
          justify-content:space-between;

          padding:6px 10px 2px;
        }

        .sl-topbar-title {
          font-family:'Space Grotesk',sans-serif;
          font-weight:600;
          font-size:14.5px;
          color:var(--text-1);
        }

        .sl-iconbtn {
          width:34px;
          height:34px;

          border-radius:11px;

          display:flex;
          align-items:center;
          justify-content:center;

          background:var(--surface-2);
          border:1px solid var(--border);

          color:var(--text-1);

          cursor:pointer;

          transition:
            background .15s ease,
            transform .15s ease;
        }

        .sl-iconbtn:hover {
          background:rgba(255,255,255,0.09);
          transform:translateY(-1px);
        }

        .sl-screen {
          flex:1;

          display:flex;
          flex-direction:column;

          overflow-y:auto;

          animation:
            sl-fade-in .32s ease both;
        }

        .sl-screen::-webkit-scrollbar {
          display:none;
        }

        @keyframes sl-fade-in {
          from {
            opacity:0;
            transform:translateY(6px);
          }

          to {
            opacity:1;
            transform:none;
          }
        }

        .sl-screen-body {
          padding:
            14px 22px 26px;

          display:flex;
          flex-direction:column;
          flex:1;
        }

        /* HOME */

        .sl-home {
          padding:
            0 26px 26px;

          justify-content:
            space-between;
        }

        .sl-home-top {
          display:flex;
          justify-content:flex-end;
          padding-top:8px;
        }

        .sl-home-hero {
          display:flex;
          flex-direction:column;
          align-items:center;
          text-align:center;

          gap:10px;

          margin-top:18px;
        }

        .sl-wordmark {
          font-family:'Space Grotesk',sans-serif;
          font-weight:700;
          font-size:30px;

          color:var(--text-1);

          margin:4px 0 0;
        }

        .sl-tagline {
          font-family:'Space Grotesk',sans-serif;
          font-weight:500;
          font-size:15px;

          color:var(--brand);

          margin:0;
        }

        .sl-home-desc {
          color:var(--text-2);

          font-size:13.5px;

          max-width:240px;

          line-height:1.5;

          margin:2px 0 0;
        }

        .sl-home-secondary {
          color:var(--text-3);

          font-size:11.5px;

          max-width:270px;

          line-height:1.45;

          margin:0;
        }

        .sl-gaming-card {
          display:flex;
          align-items:flex-start;
          gap:11px;

          margin:
            4px 0 8px;

          padding:13px 14px;

          border-radius:16px;

          background:var(--surface-2);

          border:
            1px solid
            rgba(91,140,255,0.22);
        }

        .sl-gaming-card-icon {
          width:30px;
          height:30px;

          flex-shrink:0;

          display:flex;
          align-items:center;
          justify-content:center;

          border-radius:10px;

          color:var(--brand);

          background:var(--brand-soft);

          border:
            1px solid
            rgba(91,140,255,0.25);
        }

        .sl-gaming-card-title {
          color:var(--text-1);

          font-family:'Space Grotesk',sans-serif;
          font-weight:700;
          font-size:12.5px;

          margin-bottom:3px;
        }

        .sl-gaming-card-text {
          color:var(--text-2);

          font-size:11px;

          line-height:1.45;
        }

        .sl-home-actions {
          display:flex;
          flex-direction:column;
          gap:12px;

          margin-bottom:6px;
        }

        .sl-home-footer {
          display:flex;
          align-items:center;
          justify-content:center;

          gap:6px;

          color:var(--text-3);

          font-size:11px;

          font-family:'JetBrains Mono',monospace;

          text-align:center;
        }

        .sl-dot {
          opacity:0.5;
        }

        /* BUTTONS */

        .sl-btn {
          display:flex;
          align-items:center;
          justify-content:center;

          gap:8px;

          font-family:'Space Grotesk',sans-serif;
          font-weight:600;

          font-size:14.5px;

          padding:
            15px 20px;

          border-radius:16px;

          border:1px solid transparent;

          cursor:pointer;

          transition:
            transform .15s ease,
            filter .15s ease;
        }

        .sl-btn:active {
          transform:scale(0.98);
        }

        .sl-btn-block {
          width:100%;
        }

        .sl-btn-primary {
          background:
            linear-gradient(
              135deg,
              var(--brand),
              #4169E1
            );

          color:#fff;

          box-shadow:
            0 12px 24px -10px
            rgba(91,140,255,0.55);
        }

        .sl-btn-primary:hover {
          filter:brightness(1.08);
        }

        .sl-btn-primary:disabled {
          opacity:0.35;
          cursor:not-allowed;
          box-shadow:none;
        }

        .sl-btn-ghost {
          background:var(--surface-2);

          color:var(--text-1);

          border-color:var(--border);
        }

        /* INPUT */

        .sl-capture-row {
          display:flex;
          gap:10px;
        }

        .sl-capture-btn {
          flex:1;

          display:flex;
          align-items:center;
          justify-content:center;

          gap:7px;

          padding:
            13px 10px;

          border-radius:14px;

          border:
            1px solid var(--border);

          background:var(--surface-2);

          color:var(--text-2);

          font-size:13px;
          font-weight:600;

          font-family:'Space Grotesk',sans-serif;

          cursor:pointer;
        }

        .sl-capture-btn-active {
          color:var(--brand);

          border-color:
            rgba(91,140,255,0.5);

          background:
            var(--brand-soft);

          cursor:default;
        }

        .sl-inline-scan {
          display:flex;
          align-items:center;

          gap:8px;

          margin-top:12px;

          font-size:12.5px;

          color:var(--brand);

          font-family:'JetBrains Mono',monospace;
        }

        .sl-inline-scan-dot {
          width:7px;
          height:7px;

          border-radius:50%;

          background:var(--brand);

          animation:
            sl-pulse .9s
            ease-in-out infinite;
        }

        @keyframes sl-pulse {
          0%,100% {
            opacity:.35;
          }

          50% {
            opacity:1;
          }
        }

        .sl-textarea {
          margin-top:16px;

          width:100%;

          resize:none;

          background:var(--surface-2);

          border:
            1px solid var(--border);

          border-radius:16px;

          padding:
            14px 16px;

          color:var(--text-1);

          font-size:13.5px;

          line-height:1.55;

          font-family:'Inter',sans-serif;

          outline:none;
        }

        .sl-textarea:focus {
          border-color:
            rgba(91,140,255,0.6);
        }

        .sl-textarea::placeholder {
          color:var(--text-3);
        }

        .sl-check-info {
          margin-top:14px;

          padding:12px 14px;

          border-radius:14px;

          background:
            rgba(255,255,255,0.025);

          border:
            1px solid var(--border);
        }

        .sl-check-info-title {
          color:var(--text-3);

          font-family:'Space Grotesk',sans-serif;

          font-size:10.5px;

          font-weight:700;

          letter-spacing:.08em;

          text-transform:uppercase;

          margin-bottom:9px;
        }

        .sl-check-info-items {
          display:flex;

          flex-wrap:wrap;

          gap:7px;
        }

        .sl-check-info-items span {
          color:var(--text-2);

          background:
            var(--surface-2);

          border:
            1px solid var(--border);

          border-radius:999px;

          padding:6px 9px;

          font-size:10.5px;
        }

        .sl-section-lead {
          color:var(--text-2);

          font-size:12.5px;

          margin:
            4px 0 12px;
        }

        .sl-example-row {
          display:flex;

          flex-wrap:wrap;

          gap:8px;
        }

        .sl-example-chip {
          font-family:'Space Grotesk',sans-serif;

          font-size:12px;

          font-weight:600;

          padding:9px 13px;

          border-radius:100px;

          border:1px solid;

          cursor:pointer;

          background:transparent;
        }

        .sl-tone-danger {
          color:var(--danger);

          border-color:
            rgba(255,93,108,0.4);

          background:
            var(--danger-soft);
        }

        .sl-tone-warn {
          color:var(--warn);

          border-color:
            rgba(245,184,51,0.4);

          background:
            var(--warn-soft);
        }

        .sl-tone-safe {
          color:var(--safe);

          border-color:
            rgba(47,217,166,0.4);

          background:
            var(--safe-soft);
        }

        /* DEMO */

        .sl-demo-list {
          display:flex;
          flex-direction:column;
          gap:12px;
        }

        .sl-demo-tile {
          text-align:left;

          border-radius:18px;

          border:1px solid;

          padding:16px;

          cursor:pointer;

          background:var(--surface-2);

          transition:
            transform .15s ease;
        }

        .sl-demo-tile:hover {
          transform:translateY(-2px);
        }

        .sl-demo-tile-top {
          display:flex;
          align-items:center;
          justify-content:space-between;

          color:var(--text-1);
        }

        .sl-demo-tile-tag {
          font-family:'Space Grotesk',sans-serif;

          font-weight:700;

          font-size:13px;
        }

        .sl-demo-tile-msg {
          color:var(--text-1);

          font-size:12.5px;

          margin:10px 0 4px;

          line-height:1.5;
        }

        .sl-demo-tile-desc {
          color:var(--text-3);

          font-size:11px;

          margin:0;
        }

        /* ANALYZING */

        .sl-analyzing {
          align-items:center;

          justify-content:center;

          padding:
            24px 30px;

          gap:15px;

          text-align:center;
        }

        .sl-scan-ring-wrap {
          position:relative;

          width:120px;
          height:120px;

          display:flex;

          align-items:center;
          justify-content:center;

          margin-bottom:3px;
        }

        .sl-scan-ring-outer,
        .sl-scan-ring-mid {
          position:absolute;

          border-radius:50%;

          border:
            1.5px dashed
            rgba(91,140,255,0.35);
        }

        .sl-scan-ring-outer {
          width:120px;
          height:120px;
        }

        .sl-scan-ring-mid {
          width:86px;
          height:86px;

          border-color:
            rgba(91,140,255,0.5);
        }

        .sl-spin-slow {
          animation:
            sl-spin 5s
            linear infinite;
        }

        .sl-spin-rev {
          animation:
            sl-spin 3.4s
            linear infinite reverse;
        }

        @keyframes sl-spin {
          to {
            transform:rotate(360deg);
          }
        }

        .sl-analyzing-title {
          font-family:'Space Grotesk',sans-serif;

          font-weight:600;

          font-size:17px;

          color:var(--text-1);

          margin:0;
        }

        .sl-analyzing-subtitle {
          color:var(--text-3);

          font-size:11px;

          margin:
            -6px 0 4px;
        }

        .sl-checklist {
          display:flex;

          flex-direction:column;

          gap:9px;

          width:100%;

          max-width:285px;
        }

        .sl-check-row {
          display:flex;

          align-items:center;

          gap:10px;

          font-size:11.5px;

          font-family:'JetBrains Mono',monospace;

          color:var(--text-3);

          transition:
            color .2s ease;

          text-align:left;
        }

        .sl-check-active {
          color:var(--text-1);
        }

        .sl-check-done {
          color:var(--safe);
        }

        .sl-check-icon {
          width:16px;
          height:16px;

          display:flex;

          align-items:center;
          justify-content:center;

          flex-shrink:0;
        }

        .sl-check-empty {
          width:7px;
          height:7px;

          border-radius:50%;

          background:var(--text-3);

          opacity:.5;
        }

        .sl-check-spinner {
          width:12px;
          height:12px;

          border-radius:50%;

          border:
            2px solid
            rgba(91,140,255,0.25);

          border-top-color:
            var(--brand);

          animation:
            sl-spin .7s
            linear infinite;
        }

        /* RESULT */

        .sl-result-body {
          align-items:center;
          text-align:center;
        }

        .sl-verdict-banner {
          font-family:'Space Grotesk',sans-serif;

          font-weight:700;

          font-size:13px;

          letter-spacing:.06em;

          padding:
            9px 18px;

          border-radius:100px;

          border:1px solid;

          margin-bottom:18px;
        }

        .sl-gauge-wrap {
          position:relative;

          width:168px;
          height:168px;

          display:flex;

          align-items:center;
          justify-content:center;

          margin-bottom:14px;
        }

        .sl-gauge-track {
          fill:none;

          stroke:
            rgba(255,255,255,0.07);

          stroke-width:10;
        }

        .sl-gauge-center {
          position:absolute;

          display:flex;

          flex-direction:column;

          align-items:center;
        }

        .sl-gauge-score {
          font-family:'JetBrains Mono',monospace;

          font-weight:700;

          font-size:38px;

          line-height:1;
        }

        .sl-gauge-max {
          font-family:'JetBrains Mono',monospace;

          font-size:12px;

          color:var(--text-3);

          margin-top:2px;
        }

        .sl-gauge-label {
          font-family:'Space Grotesk',sans-serif;

          font-size:11px;

          color:var(--text-2);

          margin-top:6px;

          letter-spacing:.04em;

          text-transform:uppercase;
        }

        .sl-result-headline {
          color:var(--text-1);

          font-size:14px;

          font-weight:500;

          max-width:260px;

          margin:
            2px 0 22px;

          line-height:1.5;
        }

        .sl-reasons-block {
          width:100%;

          text-align:left;

          margin-bottom:20px;
        }

        .sl-reasons-title {
          font-family:'Space Grotesk',sans-serif;

          font-size:11.5px;

          font-weight:700;

          letter-spacing:.1em;

          color:var(--text-3);
        }

        .sl-reasons-list {
          display:flex;

          flex-direction:column;

          gap:9px;

          margin-top:12px;
        }

        .sl-reason-row {
          display:flex;

          align-items:center;

          gap:10px;

          font-size:13px;

          color:var(--text-1);

          background:var(--surface-2);

          border:
            1px solid var(--border);

          border-radius:13px;

          padding:10px 12px;

          opacity:0;

          transform:
            translateX(-8px);

          transition:
            opacity .35s ease,
            transform .35s ease;
        }

        .sl-reason-in {
          opacity:1;

          transform:none;
        }

        .sl-reason-icon {
          width:26px;
          height:26px;

          border-radius:9px;

          display:flex;

          align-items:center;
          justify-content:center;

          flex-shrink:0;
        }

        .sl-ai-block {
          width:100%;

          text-align:left;

          background:
            var(--brand-soft);

          border:
            1px solid
            rgba(91,140,255,0.28);

          border-radius:16px;

          padding:
            14px 16px;

          margin-bottom:16px;
        }

        .sl-ai-block-head {
          display:flex;

          align-items:center;

          gap:6px;

          color:var(--brand);

          font-family:'Space Grotesk',sans-serif;

          font-weight:700;

          font-size:11.5px;

          letter-spacing:.06em;

          text-transform:uppercase;
        }

        .sl-ai-block-text {
          color:var(--text-1);

          font-size:12.5px;

          line-height:1.6;

          margin:
            8px 0 0;

          opacity:.92;
        }

        .sl-action-block {
          width:100%;

          text-align:left;

          background:var(--surface-2);

          border:
            1px solid var(--border);

          border-radius:16px;

          padding:
            14px 16px;

          margin-bottom:20px;
        }

        .sl-action-title {
          font-family:'Space Grotesk',sans-serif;

          font-size:11.5px;

          font-weight:700;

          letter-spacing:.08em;

          color:var(--text-3);
        }

        .sl-action-text {
          color:var(--text-1);

          font-size:13.5px;

          font-weight:500;

          margin:
            8px 0 0;

          line-height:1.5;
        }

        /* HOW */

        .sl-flow {
          display:flex;
          flex-direction:column;
        }

        .sl-flow-row {
          display:grid;

          grid-template-columns:
            30px 1fr;

          column-gap:14px;

          position:relative;

          padding-bottom:22px;
        }

        .sl-flow-row:last-child {
          padding-bottom:0;
        }

        .sl-flow-num {
          font-family:'JetBrains Mono',monospace;

          font-size:11px;

          font-weight:700;

          color:var(--brand);

          background:
            var(--brand-soft);

          border:
            1px solid
            rgba(91,140,255,0.35);

          border-radius:9px;

          width:30px;
          height:30px;

          display:flex;

          align-items:center;
          justify-content:center;

          z-index:1;
        }

        .sl-flow-line {
          position:absolute;

          left:14px;

          top:30px;

          bottom:0;

          width:1px;

          background:var(--border);
        }

        .sl-flow-row:last-child
        .sl-flow-line {
          display:none;
        }

        .sl-flow-title {
          font-family:'Space Grotesk',sans-serif;

          font-weight:600;

          font-size:13.5px;

          color:var(--text-1);

          margin-top:5px;
        }

        .sl-flow-desc {
          color:var(--text-3);

          font-size:11.5px;

          margin-top:3px;

          line-height:1.45;
        }
      `}</style>

      <div className="sl-phone">
        <StatusBar />

        {screen === "home" && (
          <HomeScreen
            goInput={() =>
              setScreen("input")
            }
            goDemo={() =>
              setScreen("demo")
            }
            goHow={() =>
              setScreen("how")
            }
          />
        )}

        {screen === "demo" && (
          <DemoPickerScreen
            goBack={() =>
              setScreen("home")
            }
            pick={(c) =>
              startAnalysis(c)
            }
          />
        )}

        {screen === "input" && (
          <InputScreen
            goBack={() =>
              setScreen("home")
            }
            goHow={() =>
              setScreen("how")
            }
            runAnalysis={(text) =>
              startAnalysis(text)
            }
          />
        )}

        {screen === "analyzing" && (
          <AnalyzingScreen
            onDone={finishAnalysis}
          />
        )}

        {screen === "result" &&
          result && (
            <ResultScreen
              result={result}
              goBack={() =>
                setScreen("input")
              }
              goHow={() =>
                setScreen("how")
              }
              goCheckAnother={() =>
                setScreen("input")
              }
            />
          )}

        {screen === "how" && (
          <HowScreen
            goBack={() =>
              setScreen(
                result
                  ? "result"
                  : "home"
              )
            }
          />
        )}
      </div>
    </div>
  );
}
