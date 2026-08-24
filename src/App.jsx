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

/* ================================================================
   ScamLens — Check before you pay.
   Deterministic, explainable scam-risk prototype.
================================================================ */

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
      "This message combines gaming-related content with an unexpected payment request and urgent language. These patterns can be associated with payment scams.",
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
      { label: "Financial request requiring confirmation", icon: "rupee" },
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

/* ================================================================
   ICONS
================================================================ */

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
  if (level === "high") {
    return { label: "HIGH RISK", dot: "🔴" };
  }

  if (level === "medium") {
    return { label: "NEEDS VERIFICATION", dot: "🟡" };
  }

  return { label: "LOW RISK", dot: "🟢" };
}

/* ================================================================
   MAIN DETECTION ENGINE
================================================================ */

function analyzeCustomText(raw) {
  const text = raw.trim();
  const norm = text.toLowerCase();

  /* Exact demo cases */
  for (const c of Object.values(CASES)) {
    if (norm === c.message.toLowerCase()) {
      return c;
    }
  }

  const signals = [];

  const addSignal = (label, icon, weight) => {
    if (!signals.some((s) => s.label === label)) {
      signals.push({
        label,
        icon,
        weight,
      });
    }
  };

  /* ------------------------------------------------------------
     1. Payment / fee requests
  ------------------------------------------------------------ */

  if (
    /pay\s*₹|pay\s*rs|processing fee|training fee|registration fee|application fee|admission fee|advance payment|send money|transfer.*fee|payment.*pending|deposit|fees are applicable|fee is applicable|fee applicable|base training fee/i.test(
      text
    )
  ) {
    addSignal(
      "Unexpected payment / fee request",
      "rupee",
      30
    );
  }

  /* ------------------------------------------------------------
     2. Urgency / scarcity
  ------------------------------------------------------------ */

  if (
    /immediately|urgent|within\s+\d+\s+(hours?|days?)|do not delay|asap|act fast|right now|don't wait|hurry|limited slots|limited registration|limited seats|stipulated timeline|last date|deadline|apply now|register now/i.test(
      text
    )
  ) {
    addSignal(
      "Urgency / scarcity pressure",
      "clock",
      18
    );
  }

  /* ------------------------------------------------------------
     3. Prize / scholarship / incentive
  ------------------------------------------------------------ */

  if (
    /won|prize|congratulations|lucky draw|lottery|selected|claim.*reward|bonus|free.*money|scholarship|concession|discount|50%.*concession|special offer|exclusive.*students/i.test(
      text
    )
  ) {
    addSignal(
      "Scholarship / incentive bait",
      "gift",
      18
    );
  }

  /* ------------------------------------------------------------
     4. Sensitive credentials
  ------------------------------------------------------------ */

  if (
    /otp|pin|cvv|password|passcode|security code|2fa|two-factor|confirm.*password|enter.*otp|provide.*pin/i.test(
      text
    )
  ) {
    addSignal(
      "Sensitive credential request",
      "alert",
      30
    );
  }

  /* ------------------------------------------------------------
     5. Verification / KYC
  ------------------------------------------------------------ */

  if (
    /kyc|know your customer|verify.*account|account.*verification|identity.*verification|complete.*verification|confirm.*identity|subject to verification/i.test(
      text
    )
  ) {
    addSignal(
      "Verification request",
      "info",
      18
    );
  }

  /* ------------------------------------------------------------
     6. Account threats
  ------------------------------------------------------------ */

  if (
    /will be (?:blocked|suspended|deactivat|closed)|account.*(?:block|suspend|lock|restrict)|access.*denied|unauthorized activity|unusual activity|suspicious activity/i.test(
      text
    )
  ) {
    addSignal(
      "Account blocking / security threat",
      "alert",
      22
    );
  }

  /* ------------------------------------------------------------
     7. Brand / organization impersonation
  ------------------------------------------------------------ */

  const brands =
    /microsoft|google|amazon|apple|paypal|linkedin|meta|facebook|whatsapp|sbi|hdfc|icici|axis|phonepe|paytm|flipkart/i;

  const institutionalLanguage =
    /dear (?:customer|user|member|student)|official|certified|collaboration|in collaboration with|authorized|partner|certified fundamentals|institutional outreach|hiring partners/i;

  if (
    brands.test(text) &&
    institutionalLanguage.test(text)
  ) {
    addSignal(
      "Brand / organization claim requiring verification",
      "link",
      22
    );
  }

  /* ------------------------------------------------------------
     8. Suspicious URL / CTA
  ------------------------------------------------------------ */

  if (
    /https?:\/\/[^\s]+|www\.[^\s]+|bit\.ly|tinyurl|short\.link|click here|click the link|tap here|visit link|open.*link|verify via|application form|registration form|apply here/i.test(
      text
    )
  ) {
    addSignal(
      "Suspicious link / call-to-action",
      "link",
      25
    );
  }

  /* ------------------------------------------------------------
     9. Internship / recruitment
  ------------------------------------------------------------ */

  if (
    /internship|training program|career opportunities|placement assistance|hiring partners|job opportunities|career readiness|registration|application form|apply|enrollment|admission/i.test(
      text
    )
  ) {
    addSignal(
      "Recruitment / enrollment solicitation",
      "info",
      12
    );
  }

  /* ------------------------------------------------------------
     10. Certificate promotion
  ------------------------------------------------------------ */

  if (
    /certificate|certification|letter of recommendation|excellence certificate|completion certificate|aicte|msme|iso certified/i.test(
      text
    )
  ) {
    addSignal(
      "Certificate / credential promotion",
      "gift",
      8
    );
  }

  /* ------------------------------------------------------------
     11. Financial instructions
  ------------------------------------------------------------ */

  if (
    /activation fee|security deposit|balance verification|update.*payment|verify.*payment|account.*fund|refund|payment required|fees applicable/i.test(
      text
    )
  ) {
    addSignal(
      "Financial instruction",
      "rupee",
      18
    );
  }

  /* ------------------------------------------------------------
     12. Gaming
  ------------------------------------------------------------ */

  if (
    /\bbgmi\b|\bfree\s*fire\b|\bgaming\b|\btournament\b|\besports\b|\buc\b|\bdiamonds\b|game\s+account|gaming\s+account/i.test(
      text
    )
  ) {
    addSignal(
      "Gaming-related scam pattern",
      "alert",
      18
    );
  }

  /* ------------------------------------------------------------
     13. Promotional / high-pressure language
  ------------------------------------------------------------ */

  if (
    /exclusive|nationwide|limited slots|special registration|career opportunities|performance-based|subject to verification|lifetime access|hiring partners/i.test(
      text
    )
  ) {
    addSignal(
      "Promotional / high-pressure solicitation",
      "alert",
      10
    );
  }

  /* ------------------------------------------------------------
     Legitimate transaction indicators
  ------------------------------------------------------------ */

  const legit =
    /completed successfully|transaction id|order confirmed|delivered|payment received|successfully paid/i.test(
      text
    );

  /* ------------------------------------------------------------
     Base score
  ------------------------------------------------------------ */

  let score;

  if (signals.length === 0 && legit) {
    score = 6;
  } else if (signals.length === 0) {
    score = 20;
  } else {
    score = Math.min(
      98,
      signals.reduce(
        (total, signal) => total + signal.weight,
        0
      )
    );
  }

  /* ------------------------------------------------------------
     Combination analysis
  ------------------------------------------------------------ */

  const hasPayment = signals.some(
    (s) =>
      s.label.includes("payment") ||
      s.label.includes("fee") ||
      s.label.includes("Financial")
  );

  const hasCredential = signals.some(
    (s) => s.label.includes("credential")
  );

  const hasVerification = signals.some(
    (s) =>
      s.label.includes("Verification") ||
      s.label.includes("verification")
  );

  const hasThreats = signals.some(
    (s) => s.label.includes("blocking")
  );

  const hasLink = signals.some(
    (s) =>
      s.label.includes("link") ||
      s.label.includes("Link")
  );

  const hasImpersonation = signals.some(
    (s) =>
      s.label.includes("Brand") ||
      s.label.includes("organization")
  );

  const hasUrgency = signals.some(
    (s) =>
      s.label.includes("Urgency") ||
      s.label.includes("scarcity")
  );

  const hasPrize = signals.some(
    (s) =>
      s.label.includes("Prize") ||
      s.label.includes("Scholarship") ||
      s.label.includes("incentive")
  );

  const hasGaming = signals.some(
    (s) => s.label.includes("Gaming")
  );

  const hasRecruitment = signals.some(
    (s) =>
      s.label.includes("Recruitment") ||
      s.label.includes("enrollment")
  );

  /* Combination boosts */

  if (hasPayment && hasRecruitment) {
    score += 12;
  }

  if (hasPayment && hasUrgency) {
    score += 10;
  }

  if (hasPayment && hasPrize) {
    score += 8;
  }

  if (hasImpersonation && hasLink) {
    score += 10;
  }

  if (hasVerification && hasLink) {
    score += 10;
  }

  if (hasCredential && hasLink) {
    score += 12;
  }

  score = Math.min(98, score);

  /* ------------------------------------------------------------
     Risk level
  ------------------------------------------------------------ */

  let level = "low";

  if (score >= 70) {
    level = "high";
  } else if (score >= 30) {
    level = "medium";
  }

  /* ------------------------------------------------------------
     Headline
  ------------------------------------------------------------ */

  let headline;

  if (level === "high") {
    headline =
      "Multiple suspicious indicators detected.";
  } else if (level === "medium") {
    headline =
      "Several signals require manual verification.";
  } else {
    headline =
      "No major suspicious indicators were detected.";
  }

  /* ------------------------------------------------------------
     Explanation
  ------------------------------------------------------------ */

  let explanation;

  if (signals.length === 0) {
    explanation =
      "No suspicious patterns were detected in this message. It appears to be a routine notification.";
  } else if (
    hasPayment &&
    hasRecruitment &&
    (hasUrgency || hasPrize)
  ) {
    explanation =
      "This message combines a training or internship solicitation with a fee request, promotional incentives, and pressure to register. These patterns can be associated with potentially fraudulent training or recruitment campaigns. Verify the organization, fees, certifications, and application link independently before paying or sharing personal information.";
  } else if (
    hasImpersonation &&
    hasLink &&
    hasVerification
  ) {
    explanation =
      "This message references a known organization while directing the recipient toward an online verification or application action. The organization and link should be independently verified before providing personal information or making payments.";
  } else if (
    hasCredential &&
    (hasImpersonation ||
      hasThreats ||
      hasUrgency)
  ) {
    explanation =
      "This message requests sensitive credentials while using social-engineering tactics. Do not provide OTPs, PINs, passwords, or other sensitive credentials through an unsolicited message.";
  } else if (
    hasThreats &&
    (hasUrgency || hasVerification)
  ) {
    explanation =
      "This message uses urgency and account-related threats to pressure the recipient into taking immediate action. This is a common phishing and social-engineering pattern.";
  } else if (
    hasGaming &&
    (hasPayment ||
      hasPrize ||
      hasUrgency ||
      hasLink ||
      hasCredential)
  ) {
    explanation =
      "This message combines gaming-related content with suspicious payment, reward, urgency, link, or credential signals. Verify the sender and offer through the official channel before taking action.";
  } else if (
    hasPayment &&
    hasUrgency
  ) {
    explanation =
      "This message combines urgency with an unexpected payment or fee request. These patterns are commonly associated with financial scams. Verify the request independently before paying.";
  } else if (
    hasLink &&
    hasRecruitment &&
    hasPayment
  ) {
    explanation =
      "This message combines an application or recruitment offer with a payment request and a call to action. Verify the organization and application process through an independently obtained official website before paying.";
  } else if (hasLink) {
    explanation =
      "This message contains a suspicious call-to-action or link. Avoid clicking it and verify the sender through an independently obtained official website or contact channel.";
  } else if (hasPayment) {
    explanation =
      "This message contains a payment or fee request. Do not make a payment until the organization and reason for the charge have been independently verified.";
  } else {
    explanation =
      "This message contains multiple signals that require caution. Verify the sender and organization through official channels before providing information, clicking links, or making payments.";
  }

  /* ------------------------------------------------------------
     Recommendation
  ------------------------------------------------------------ */

  let recommendation;

  if (
    hasPayment &&
    hasRecruitment
  ) {
    recommendation =
      "Do not pay training or registration fees until the organization, program, certifications, and payment request are independently verified.";
  } else if (
    hasCredential ||
    hasThreats
  ) {
    recommendation =
      "Do NOT provide OTPs, PINs, passwords, or other sensitive information. Verify the organization using independently obtained official contact information.";
  } else if (hasLink) {
    recommendation =
      "Do NOT click the link or application button in the message. Open the organization's official website independently and verify the program there.";
  } else if (hasPayment) {
    recommendation =
      "Do NOT make a payment yet. Verify the organization and fee through an official channel before proceeding.";
  } else {
    recommendation =
      "Verify the sender and organization independently before sharing personal information or proceeding with the request.";
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

/* ================================================================
   LENS MARK
================================================================ */

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

/* ================================================================
   STATUS BAR
================================================================ */

function StatusBar() {
  return (
    <div className="sl-statusbar">
      <span className="sl-statustime">
        9:41
      </span>

      <div className="sl-statusicons">
        <Signal size={13} strokeWidth={2.4} />
        <Wifi size={13} strokeWidth={2.4} />
        <BatteryFull size={15} strokeWidth={2.2} />
      </div>
    </div>
  );
}

/* ================================================================
   TOP BAR
================================================================ */

function TopBar({
  title,
  onBack,
  onHow,
}) {
  return (
    <div className="sl-topbar">
      <button
        className="sl-iconbtn"
        onClick={onBack}
        style={{
          visibility: onBack
            ? "visible"
            : "hidden",
        }}
        aria-label="Back"
      >
        <ChevronLeft size={19} />
      </button>

      <span className="sl-topbar-title">
        {title}
      </span>

      <button
        className="sl-iconbtn"
        onClick={onHow}
        style={{
          visibility: onHow
            ? "visible"
            : "hidden",
        }}
        aria-label="How it works"
      >
        <Layers size={17} />
      </button>
    </div>
  );
}

/* ================================================================
   HOME
================================================================ */

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
        <LensMark
          size={64}
          accent="var(--brand)"
        />

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
          Built for mobile-first protection, with
          gaming and power-user scenarios in mind.
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
            Detect fake tournament fees, gaming
            rewards, account scams and suspicious
            payment links.
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
        <span>
          Prototype · iQOO Hackathon 2026
        </span>

        <span className="sl-dot">
          ·
        </span>

        <span>
          FinTech &amp; Commerce
        </span>
      </div>
    </div>
  );
}

/* ================================================================
   DEMO PICKER
================================================================ */

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
          Pick a scenario — ScamLens runs the
          full capture-to-action flow instantly,
          no waiting on external services.
        </p>

        <div className="sl-demo-list">
          {tiles.map(
            ({ c, hue, desc }) => (
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
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   INPUT SCREEN
================================================================ */

function InputScreen({
  goBack,
  goHow,
  runAnalysis,
}) {
  const [text, setText] =
    useState("");

  const [scanning, setScanning] =
    useState(false);

  const fileRef = useRef(null);

  const examples = [
    {
      c: CASES.high,
      hue: "danger",
    },
    {
      c: CASES.gaming,
      hue: "danger",
    },
    {
      c: CASES.medium,
      hue: "warn",
    },
    {
      c: CASES.low,
      hue: "safe",
    },
  ];

  const simulateUpload = () => {
    setScanning(true);

    setTimeout(() => {
      setText(CASES.high.message);
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

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sl-hidden-input"
          />
        </div>

        {scanning && (
          <div className="sl-inline-scan">
            <span className="sl-inline-scan-dot" />
            Simulating screenshot scan
            (prototype demo)…
          </div>
        )}

        <textarea
          className="sl-textarea"
          placeholder="Paste a payment-related message here…"
          value={text}
          onChange={(e) =>
            setText(e.target.value)
          }
          rows={7}
        />

        <p
          className="sl-section-lead"
          style={{ marginTop: 22 }}
        >
          Or try a ready-made example
        </p>

        <div className="sl-example-row">
          {examples.map(
            ({ c, hue }) => (
              <button
                key={c.id}
                className={`sl-example-chip sl-tone-${hue}`}
                onClick={() =>
                  setText(c.message)
                }
              >
                {c.tag}
              </button>
            )
          )}
        </div>

        <button
          className="sl-btn sl-btn-primary sl-btn-block"
          disabled={!text.trim()}
          onClick={() =>
            runAnalysis(text)
          }
          style={{
            marginTop: 26,
          }}
        >
          Analyze message
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

/* ================================================================
   ANALYZING SCREEN
================================================================ */

function AnalyzingScreen({
  onDone,
}) {
  const steps = [
    "Checking payment signals…",
    "Checking urgency…",
    "Checking suspicious patterns…",
    "Checking links and organization claims…",
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
          setTimeout(tick, 380)
        );
      } else {
        timers.push(
          setTimeout(onDone, 520)
        );
      }
    };

    timers.push(
      setTimeout(tick, 260)
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

      <div className="sl-checklist">
        {steps.map((s, idx) => {
          const state =
            idx < activeIdx
              ? "done"
              : idx === activeIdx
              ? "active"
              : "pending";

          return (
            <div
              key={s}
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

              {s}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================
   COUNT UP
================================================================ */

function useCountUp(
  target,
  active,
  duration = 1100
) {
  const [val, setVal] =
    useState(0);

  const rafRef = useRef();

  useEffect(() => {
    if (!active) return;

    const start =
      performance.now();

    const ease = (t) =>
      1 - Math.pow(1 - t, 3);

    const step = (now) => {
      const p = Math.min(
        1,
        (now - start) / duration
      );

      setVal(
        Math.round(
          target * ease(p)
        )
      );

      if (p < 1) {
        rafRef.current =
          requestAnimationFrame(
            step
          );
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

/* ================================================================
   RISK GAUGE
================================================================ */

function RiskGauge({
  score,
  level,
}) {
  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    const t = setTimeout(
      () => setMounted(true),
      60
    );

    return () =>
      clearTimeout(t);
  }, []);

  const count = useCountUp(
    score,
    mounted,
    1100
  );

  const r = 66;

  const circ =
    2 * Math.PI * r;

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
            strokeDashoffset:
              mounted
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

/* ================================================================
   RESULT
================================================================ */

function ResultScreen({
  result,
  goCheckAnother,
  goBack,
  goHow,
}) {
  const meta =
    levelMeta(result.level);

  const accent =
    ACCENT[result.level];

  const [showReasons, setShowReasons] =
    useState(false);

  useEffect(() => {
    setShowReasons(false);

    const t = setTimeout(
      () => setShowReasons(true),
      550
    );

    return () =>
      clearTimeout(t);
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
            color:
              accent.fg,
            borderColor:
              `${accent.fg}33`,
          }}
        >
          {meta.dot}{" "}
          {meta.label}
        </div>

        <RiskGauge
          score={result.score}
          level={result.level}
        />

        <p className="sl-result-headline">
          {result.headline}
        </p>

        {result.reasons.length >
          0 && (
          <div className="sl-reasons-block">
            <span className="sl-reasons-title">
              WHY?
            </span>

            <div className="sl-reasons-list">
              {result.reasons.map(
                (r, idx) => {
                  const Icon =
                    ICONS[r.icon] ||
                    AlertTriangle;

                  return (
                    <div
                      key={r.label}
                      className={`sl-reason-row ${
                        showReasons
                          ? "sl-reason-in"
                          : ""
                      }`}
                      style={{
                        transitionDelay: `${idx * 90}ms`,
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

                      {r.label}
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
          onClick={
            goCheckAnother
          }
        >
          <RefreshCw size={16} />
          Check another
        </button>
      </div>
    </div>
  );
}

/* ================================================================
   HOW IT WORKS
================================================================ */

function HowScreen({
  goBack,
}) {
  const flow = [
    {
      t: "Capture",
      d: "Screenshot or message text is provided to ScamLens.",
    },
    {
      t: "Extract",
      d: "Text is prepared for deterministic analysis.",
    },
    {
      t: "Lightweight signal engine",
      d: "Heuristic checks identify payment, urgency, prize, credential, URL, impersonation, recruitment, gaming and other suspicious patterns.",
    },
    {
      t: "Explainable risk assessment",
      d: "Detected signals are converted into a transparent risk assessment.",
    },
    {
      t: "0–100 risk score",
      d: "A deterministic score maps the message to low, medium, or high risk.",
    },
    {
      t: "Recommended action",
      d: "One concrete next step helps the user decide safely.",
    },
    {
      t: "Future: AI + on-device intelligence",
      d: "Production versions can use AI-assisted analysis and supported on-device models for lower latency and improved privacy.",
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
          {flow.map(
            (f, idx) => (
              <div
                className="sl-flow-row"
                key={f.t}
              >
                <div className="sl-flow-num">
                  {String(
                    idx + 1
                  ).padStart(2, "0")}
                </div>

                <div className="sl-flow-line" />

                <div>
                  <div className="sl-flow-title">
                    {f.t}
                  </div>

                  <div className="sl-flow-desc">
                    {f.d}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   ROOT APP
================================================================ */

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
          ? analyzeCustomText(
              source
            )
          : source;

      setPendingCase(caseObj);
      setScreen("analyzing");
    }, []);

  const finishAnalysis =
    useCallback(() => {
      if (!pendingCase) return;

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
            14px
            26px
            4px;

          color:var(--text-1);

          font-family:
            'JetBrains Mono',
            monospace;

          font-size:12px;
        }

        .sl-statusicons {
          display:flex;
          align-items:center;
          gap:6px;
          color:var(--text-1);
        }

        .sl-topbar {
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:6px 10px 2px;
        }

        .sl-topbar-title {
          font-family:
            'Space Grotesk',
            sans-serif;

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
          background:
            rgba(255,255,255,0.09);

          transform:
            translateY(-1px);
        }

        .sl-screen {
          flex:1;
          display:flex;
          flex-direction:column;

          overflow-y:auto;

          animation:
            sl-fade-in
            .32s
            ease
            both;
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
            14px
            22px
            26px;

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
          font-family:
            'Space Grotesk',
            sans-serif;

          font-weight:700;
          font-size:30px;

          color:var(--text-1);

          margin:
            4px 0 0;

          letter-spacing:-0.02em;
        }

        .sl-tagline {
          font-family:
            'Space Grotesk',
            sans-serif;

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

          margin:
            2px 0 0;
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

          background:
            var(--brand-soft);

          border:
            1px solid
            rgba(91,140,255,0.25);
        }

        .sl-gaming-card-title {
          color:var(--text-1);

          font-family:
            'Space Grotesk',
            sans-serif;

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

          font-family:
            'JetBrains Mono',
            monospace;
        }

        .sl-dot {
          opacity:.5;
        }

        /* BUTTONS */

        .sl-btn {
          display:flex;
          align-items:center;
          justify-content:center;
          gap:8px;

          font-family:
            'Space Grotesk',
            sans-serif;

          font-weight:600;
          font-size:14.5px;

          padding:
            15px 20px;

          border-radius:16px;

          border:
            1px solid transparent;

          cursor:pointer;

          transition:
            transform .15s ease,
            filter .15s ease,
            background .15s ease;
        }

        .sl-btn:active {
          transform:scale(.98);
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
            rgba(91,140,255,.55);
        }

        .sl-btn-primary:hover {
          filter:brightness(1.08);
        }

        .sl-btn-primary:disabled {
          opacity:.35;
          cursor:not-allowed;
          box-shadow:none;
        }

        .sl-btn-ghost {
          background:var(--surface-2);
          color:var(--text-1);
          border-color:var(--border);
        }

        .sl-btn-ghost:hover {
          background:
            rgba(255,255,255,.08);
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
            1px solid
            var(--border);

          background:
            var(--surface-2);

          color:var(--text-2);

          font-size:13px;
          font-weight:600;

          font-family:
            'Space Grotesk',
            sans-serif;

          cursor:pointer;
        }

        .sl-capture-btn-active {
          color:var(--brand);

          border-color:
            rgba(91,140,255,.5);

          background:
            var(--brand-soft);

          cursor:default;
        }

        .sl-hidden-input {
          display:none;
        }

        .sl-inline-scan {
          display:flex;
          align-items:center;
          gap:8px;

          margin-top:12px;

          font-size:12.5px;

          color:var(--brand);

          font-family:
            'JetBrains Mono',
            monospace;
        }

        .sl-inline-scan-dot {
          width:7px;
          height:7px;
          border-radius:50%;

          background:var(--brand);

          animation:
            sl-pulse
            .9s
            ease-in-out
            infinite;
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

          background:
            var(--surface-2);

          border:
            1px solid
            var(--border);

          border-radius:16px;

          padding:
            14px 16px;

          color:var(--text-1);

          font-size:13.5px;

          line-height:1.55;

          font-family:
            'Inter',
            sans-serif;

          outline:none;

          transition:
            border-color .15s ease;
        }

        .sl-textarea:focus {
          border-color:
            rgba(91,140,255,.6);
        }

        .sl-textarea::placeholder {
          color:var(--text-3);
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
          font-family:
            'Space Grotesk',
            sans-serif;

          font-size:12px;
          font-weight:600;

          padding:
            9px 13px;

          border-radius:100px;

          border:1px solid;

          cursor:pointer;

          background:transparent;
        }

        .sl-tone-danger {
          color:var(--danger);

          border-color:
            rgba(255,93,108,.4);

          background:
            var(--danger-soft);
        }

        .sl-tone-warn {
          color:var(--warn);

          border-color:
            rgba(245,184,51,.4);

          background:
            var(--warn-soft);
        }

        .sl-tone-safe {
          color:var(--safe);

          border-color:
            rgba(47,217,166,.4);

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

          background:
            var(--surface-2);

          transition:
            transform .15s ease;
        }

        .sl-demo-tile:hover {
          transform:
            translateY(-2px);
        }

        .sl-demo-tile-top {
          display:flex;
          align-items:center;
          justify-content:space-between;

          color:var(--text-1);
        }

        .sl-demo-tile-tag {
          font-family:
            'Space Grotesk',
            sans-serif;

          font-weight:700;
          font-size:13px;
        }

        .sl-demo-tile-msg {
          color:var(--text-1);

          font-size:12.5px;

          margin:
            10px 0 4px;

          line-height:1.5;
          opacity:.9;
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
            30px;

          gap:26px;

          text-align:center;
        }

        .sl-scan-ring-wrap {
          position:relative;

          width:120px;
          height:120px;

          display:flex;
          align-items:center;
          justify-content:center;

          margin-bottom:6px;
        }

        .sl-scan-ring-outer,
        .sl-scan-ring-mid {
          position:absolute;

          border-radius:50%;

          border:
            1.5px
            dashed
            rgba(91,140,255,.35);
        }

        .sl-scan-ring-outer {
          width:120px;
          height:120px;
        }

        .sl-scan-ring-mid {
          width:86px;
          height:86px;

          border-color:
            rgba(91,140,255,.5);
        }

        .sl-spin-slow {
          animation:
            sl-spin
            5s
            linear
            infinite;
        }

        .sl-spin-rev {
          animation:
            sl-spin
            3.4s
            linear
            infinite
            reverse;
        }

        @keyframes sl-spin {
          to {
            transform:rotate(360deg);
          }
        }

        .sl-analyzing-title {
          font-family:
            'Space Grotesk',
            sans-serif;

          font-weight:600;
          font-size:17px;

          color:var(--text-1);

          margin:0;
        }

        .sl-checklist {
          display:flex;
          flex-direction:column;
          gap:11px;

          width:100%;
          max-width:280px;
        }

        .sl-check-row {
          display:flex;
          align-items:center;
          gap:10px;

          font-size:12.5px;

          font-family:
            'JetBrains Mono',
            monospace;

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

          background:
            var(--text-3);

          opacity:.5;
        }

        .sl-check-spinner {
          width:12px;
          height:12px;

          border-radius:50%;

          border:
            2px solid
            rgba(91,140,255,.25);

          border-top-color:
            var(--brand);

          animation:
            sl-spin
            .7s
            linear
            infinite;
        }

        /* RESULT */

        .sl-result-body {
          align-items:center;
          text-align:center;
        }

        .sl-verdict-banner {
          font-family:
            'Space Grotesk',
            sans-serif;

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
            rgba(255,255,255,.07);

          stroke-width:10;
        }

        .sl-gauge-center {
          position:absolute;

          display:flex;
          flex-direction:column;
          align-items:center;
        }

        .sl-gauge-score {
          font-family:
            'JetBrains Mono',
            monospace;

          font-weight:700;
          font-size:38px;

          line-height:1;
        }

        .sl-gauge-max {
          font-family:
            'JetBrains Mono',
            monospace;

          font-size:12px;

          color:var(--text-3);

          margin-top:2px;
        }

        .sl-gauge-label {
          font-family:
            'Space Grotesk',
            sans-serif;

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

          max-width:280px;

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
          font-family:
            'Space Grotesk',
            sans-serif;

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

          background:
            var(--surface-2);

          border:
            1px solid
            var(--border);

          border-radius:13px;

          padding:
            10px 12px;

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
            rgba(91,140,255,.28);

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

          font-family:
            'Space Grotesk',
            sans-serif;

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

          background:
            var(--surface-2);

          border:
            1px solid
            var(--border);

          border-radius:16px;

          padding:
            14px 16px;

          margin-bottom:20px;
        }

        .sl-action-title {
          font-family:
            'Space Grotesk',
            sans-serif;

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

        /* HOW IT WORKS */

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
          font-family:
            'JetBrains Mono',
            monospace;

          font-size:11px;
          font-weight:700;

          color:var(--brand);

          background:
            var(--brand-soft);

          border:
            1px solid
            rgba(91,140,255,.35);

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

          background:
            var(--border);
        }

        .sl-flow-row:last-child
        .sl-flow-line {
          display:none;
        }

        .sl-flow-title {
          font-family:
            'Space Grotesk',
            sans-serif;

          font-weight:600;
          font-size:13.5px;

          color:var(--text-1);

          margin-top:5px;
        }

        .sl-flow-desc {
          color:var(--text-3);

          font-size:11.5px;

          margin-top:3px;

          line-height:1.5;
        }

        @media (max-width:600px) {
          .sl-app-bg {
            padding:0;
          }

          .sl-phone {
            max-width:none;
            width:100%;
            height:100vh;
            max-height:none;
            border-radius:0;
            border:none;
          }
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
            onDone={
              finishAnalysis
            }
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
