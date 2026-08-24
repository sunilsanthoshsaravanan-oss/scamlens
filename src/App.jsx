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
  Image as ImageIcon,
  X,
} from "lucide-react";

/* ============================================================
   ScamLens — Check before you pay.
   Mobile-first cybersecurity prototype
   ============================================================ */

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

/* ============================================================
   Icons
   ============================================================ */

const ICONS = {
  rupee: IndianRupee,
  clock: Clock,
  gift: Gift,
  alert: AlertTriangle,
  info: Info,
  link: Link2,
};

/* ============================================================
   Accent system
   ============================================================ */

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

/* ============================================================
   Scam detection engine
   ============================================================ */

function analyzeCustomText(raw) {
  const text = raw.trim();
  const norm = text.toLowerCase();

  if (!text) {
    return CASES.low;
  }

  for (const c of Object.values(CASES)) {
    if (norm === c.message.toLowerCase()) {
      return c;
    }
  }

  const signals = [];

  /* Payment */
  if (
    /pay\s*(₹|rs\.?|inr)?\s*\d+|processing fee|verification fee|advance payment|send money|transfer.*fee|payment.*pending|deposit|pay now|make a payment|upi payment|payment required|fee.*claim/i.test(
      text
    )
  ) {
    signals.push({
      label: "Unexpected payment request",
      icon: "rupee",
      weight: 30,
    });
  }

  /* Urgency */
  if (
    /immediately|urgent|within\s+\d+\s*(hours?|days?)|do not delay|asap|act fast|right now|don't wait|hurry|limited time|today only|expire|last chance/i.test(
      text
    )
  ) {
    signals.push({
      label: "Urgency / manipulation",
      icon: "clock",
      weight: 15,
    });
  }

  /* Prize */
  if (
    /won|winner|prize|congratulations|lucky draw|lottery|selected|claim.*reward|bonus|free.*money|reward|cashback|cash prize|tournament reward/i.test(
      text
    )
  ) {
    signals.push({
      label: "Prize / reward bait",
      icon: "gift",
      weight: 20,
    });
  }

  /* Credentials */
  if (
    /otp|one[-\s]?time password|pin|cvv|password|passcode|security code|2fa|two[-\s]?factor|confirm.*password|enter.*otp|provide.*pin|share.*otp|send.*otp/i.test(
      text
    )
  ) {
    signals.push({
      label: "Sensitive credential request",
      icon: "alert",
      weight: 30,
    });
  }

  /* KYC */
  if (
    /kyc|know your customer|verify.*account|account.*verification|identity.*verification|complete.*verification|confirm.*identity|kyc.*update|kyc.*expire/i.test(
      text
    )
  ) {
    signals.push({
      label: "KYC / account verification request",
      icon: "info",
      weight: 20,
    });
  }

  /* Threats */
  if (
    /will be blocked|will be suspended|will be deactivated|will be closed|account.*block|account.*suspend|account.*lock|account.*restrict|access.*denied|unauthorized activity|unusual activity|suspicious activity|legal action|police complaint/i.test(
      text
    )
  ) {
    signals.push({
      label: "Account blocking / security threat",
      icon: "alert",
      weight: 25,
    });
  }

  /* Brand impersonation */
  const brands =
    /hdfc|icici|axis|sbi|state bank|american express|bank of america|chase|wells fargo|paypal|amazon|apple|microsoft|google|facebook|linkedin|uber|flipkart|whatsapp|instagram|phonepe|paytm|gpay/i;

  const formalGreeting =
    /dear customer|dear user|dear member|valued customer|dear sir|dear madam|customer care|support team/i;

  if (brands.test(text) && formalGreeting.test(text)) {
    signals.push({
      label: "Possible brand impersonation",
      icon: "link",
      weight: 25,
    });
  }

  /* Suspicious URL */
  if (
    /https?:\/\/[^\s]+|www\.[^\s]+|bit\.ly|tinyurl|short\.link|t\.co|click here|click the link|tap here|visit link|open.*link|verify via|login here|secure link/i.test(
      text
    )
  ) {
    signals.push({
      label: "Suspicious URL / link",
      icon: "link",
      weight: 30,
    });
  }

  /* Delivery / refund */
  if (
    /refund|delivery.*failed|reschedul|redelivery|confirm.*delivery|retry.*delivery|pending.*refund|parcel|courier|package|shipment/i.test(
      text
    )
  ) {
    signals.push({
      label: "Delivery / refund scam pattern",
      icon: "info",
      weight: 15,
    });
  }

  /* Financial instruction */
  if (
    /activation fee|security deposit|balance verification|update.*payment|verify.*payment|account.*fund|bank details|upi id|account number|ifsc|beneficiary/i.test(
      text
    )
  ) {
    signals.push({
      label: "Suspicious financial instruction",
      icon: "rupee",
      weight: 20,
    });
  }

  /* Gaming */
  const gamingDetected =
    /\bbgmi\b|\bfree fire\b|\bgaming\b|\btournament\b|\besports\b|\buc\b|\bdiamonds\b|game account|gaming account|battle royale|clan|game reward|gaming reward/i.test(
      text
    );

  if (gamingDetected) {
    signals.push({
      label: "Gaming-related scam pattern",
      icon: "alert",
      weight: 18,
    });
  }

  /* Official-looking certificate / internship scam */
  if (
    /internship|training program|certificate|scholarship|placement assistance|registration fee|training fee|limited slots|application form|microsoft certified|aicte|msme/i.test(
      text
    )
  ) {
    signals.push({
      label: "Training / internship solicitation",
      icon: "info",
      weight: 18,
    });
  }

  /* Contact details / external registration */
  if (
    /phone:\s*\+?\d+|email:\s*[\w.+-]+@[\w.-]+\.\w+|application form|register now|registration link|click here/i.test(
      text
    )
  ) {
    signals.push({
      label: "External registration/contact request",
      icon: "link",
      weight: 15,
    });
  }

  const legit =
    /completed successfully|transaction id|order confirmed|delivered successfully|payment received|transaction successful/i.test(
      text
    );

  /* Extra risk for combinations */
  let score = 0;

  if (signals.length === 0 && legit) {
    score = 6;
  } else if (signals.length === 0) {
    score = 24;
  } else {
    score = signals.reduce((sum, signal) => sum + signal.weight, 0);

    /* Combination bonuses */
    const labels = signals.map((s) => s.label);

    const hasPayment = labels.some(
      (x) =>
        x.includes("payment") ||
        x.includes("financial") ||
        x.includes("registration")
    );

    const hasLink = labels.some(
      (x) => x.includes("URL") || x.includes("link")
    );

    const hasUrgency = labels.some((x) => x.includes("Urgency"));

    const hasCredential = labels.some((x) =>
      x.includes("credential")
    );

    const hasPrize = labels.some((x) =>
      x.includes("Prize") || x.includes("reward")
    );

    const hasGaming = labels.some((x) =>
      x.includes("Gaming")
    );

    const hasImpersonation = labels.some((x) =>
      x.includes("impersonation")
    );

    if (hasPayment && hasLink) score += 12;
    if (hasPayment && hasUrgency) score += 10;
    if (hasCredential && hasLink) score += 15;
    if (hasImpersonation && hasLink) score += 12;
    if (hasGaming && (hasPayment || hasPrize || hasLink)) score += 12;
  }

  score = Math.min(98, score);

  let level = "low";

  if (score >= 70) {
    level = "high";
  } else if (score >= 30) {
    level = "medium";
  }

  let headline;

  if (level === "high") {
    headline = "Multiple suspicious indicators detected.";
  } else if (level === "medium") {
    headline = "Some signals require manual verification.";
  } else {
    headline = "No major suspicious indicators were detected.";
  }

  const labels = signals.map((s) => s.label);

  const hasPayment = labels.some(
    (x) =>
      x.includes("payment") ||
      x.includes("financial") ||
      x.includes("registration")
  );

  const hasCredential = labels.some((x) =>
    x.includes("credential")
  );

  const hasVerification = labels.some(
    (x) =>
      x.includes("verification") ||
      x.includes("KYC")
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

  const hasPrize = labels.some((x) =>
    x.includes("Prize")
  );

  const hasGaming = labels.some((x) =>
    x.includes("Gaming")
  );

  const hasTraining = labels.some((x) =>
    x.includes("Training")
  );

  let explanation;

  if (signals.length === 0) {
    explanation =
      "No suspicious patterns were detected in this message. It appears to be a routine notification.";
  } else if (hasImpersonation && hasThreats) {
    explanation =
      "This message may be impersonating a legitimate institution and uses account-related pressure to influence the user. Verify the sender independently before sharing credentials or taking action.";
  } else if (hasCredential && hasLink) {
    explanation =
      "This message requests sensitive information and contains a suspicious link. These are common phishing indicators. Do not click the link or share OTPs, PINs, passwords, or other credentials.";
  } else if (hasGaming && (hasPayment || hasPrize || hasUrgency || hasLink)) {
    explanation =
      "This message combines gaming-related content with suspicious payment, reward, urgency, or link indicators. Verify the game, tournament, reward, or account request through the official channel.";
  } else if (hasTraining && (hasPayment || hasLink || hasUrgency)) {
    explanation =
      "This message promotes a training or internship opportunity while including registration, payment, external-link, or urgency indicators. Verify the organization, fee structure, certification claims, and registration page independently before paying.";
  } else if (hasPayment && hasUrgency) {
    explanation =
      "This message combines urgency with an unexpected payment or fee request. These patterns are commonly associated with financial scams. Verify the request independently.";
  } else if (hasDelivery && hasLink) {
    explanation =
      "This message references a delivery or refund issue and directs the user toward a link. This is a common phishing pattern. Verify the shipment through the official app or website.";
  } else if (hasPrize && hasUrgency) {
    explanation =
      "This message claims a prize or reward and uses urgency to influence the user. Prize scams frequently use payment or verification requests.";
  } else if (hasLink) {
    explanation =
      "This message contains a suspicious link or external action request. Avoid clicking it and verify the sender through an official channel.";
  } else {
    explanation =
      "This message contains multiple suspicious indicators. Verify the sender independently before making payments or sharing sensitive information.";
  }

  let recommendation;

  if (signals.length === 0) {
    recommendation =
      "No action needed — no major risk signals were found.";
  } else if (hasCredential || hasThreats) {
    recommendation =
      "Do NOT provide OTPs, PINs, passwords, or sensitive information. Contact the organization through official contact details.";
  } else if (hasGaming && (hasPayment || hasPrize || hasLink)) {
    recommendation =
      "Do not pay gaming verification or reward fees. Verify the tournament, reward, sender, or account request through its official channel.";
  } else if (hasLink) {
    recommendation =
      "Do NOT click the link. Open the official website or app directly and verify the request there.";
  } else if (hasPayment) {
    recommendation =
      "Do NOT make the requested payment until the sender and request have been independently verified.";
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

/* ============================================================
   Lens logo
   ============================================================ */

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

/* ============================================================
   Status bar
   ============================================================ */

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

/* ============================================================
   Top bar
   ============================================================ */

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

      <span className="sl-topbar-title">
        {title}
      </span>

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

/* ============================================================
   Home
   ============================================================ */

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
        <span>
          Prototype · iQOO Hackathon 2026
        </span>

        <span className="sl-dot">·</span>

        <span>
          Gaming &amp; Power User Protection
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   Demo
   ============================================================ */

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

/* ============================================================
   Input
   ============================================================ */

function InputScreen({
  goBack,
  goHow,
  runAnalysis,
}) {
  const [text, setText] = useState("");
  const [scanning, setScanning] =
    useState(false);
  const [imagePreview, setImagePreview] =
    useState(null);

  const fileRef = useRef(null);

  const examples = [
    { c: CASES.high, hue: "danger" },
    { c: CASES.gaming, hue: "danger" },
    { c: CASES.medium, hue: "warn" },
    { c: CASES.low, hue: "safe" },
  ];

  const handleScreenshot = () => {
    fileRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setImagePreview(reader.result);
    };

    reader.readAsDataURL(file);

    /*
      Prototype screenshot flow:
      We don't perform OCR here.
      Instead, selecting a screenshot demonstrates
      the capture stage and uses a safe demo message.
    */

    setScanning(true);

    setTimeout(() => {
      setText(
        "Congratulations! You have won ₹25,000. Pay ₹499 processing fee immediately to claim your prize."
      );

      setScanning(false);
    }, 900);
  };

  const removeImage = () => {
    setImagePreview(null);

    if (fileRef.current) {
      fileRef.current.value = "";
    }
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
            onClick={handleScreenshot}
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
            onChange={handleFileChange}
          />
        </div>

        {imagePreview && (
          <div className="sl-image-preview">
            <div className="sl-image-preview-head">
              <div className="sl-image-preview-title">
                <ImageIcon size={15} />
                Screenshot captured
              </div>

              <button
                className="sl-remove-image"
                onClick={removeImage}
                aria-label="Remove screenshot"
              >
                <X size={15} />
              </button>
            </div>

            <img
              src={imagePreview}
              alt="Uploaded screenshot preview"
              className="sl-preview-image"
            />
          </div>
        )}

        {scanning && (
          <div className="sl-inline-scan">
            <span className="sl-inline-scan-dot" />
            Extracting message content…
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
          style={{ marginTop: 26 }}
        >
          Analyze message
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Analyzing
   ============================================================ */

function AnalyzingScreen({
  onDone,
}) {
  const steps = [
    "Checking payment signals…",
    "Checking urgency…",
    "Checking suspicious patterns…",
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

/* ============================================================
   Counter
   ============================================================ */

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

/* ============================================================
   Risk Gauge
   ============================================================ */

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

    return () => clearTimeout(t);
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
    (Math.min(score, 100) /
      100) *
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

/* ============================================================
   Result
   ============================================================ */

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
            color: accent.fg,
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
                        transitionDelay:
                          `${idx * 90}ms`,
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

/* ============================================================
   How it works
   ============================================================ */

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
      t: "Signal detection",
      d: "Payment, urgency, prize, credential, URL, impersonation, gaming and other suspicious patterns are checked.",
    },
    {
      t: "Explainable risk assessment",
      d: "Detected signals are converted into a transparent risk assessment.",
    },
    {
      t: "0–100 risk score",
      d: "A deterministic score maps to low, medium, or high risk.",
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

/* ============================================================
   ROOT
   ============================================================ */

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
          padding:14px 26px 4px;
          color:var(--text-1);
          font-family:'JetBrains Mono',monospace;
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
          animation:sl-fade-in .32s ease both;
        }

        .sl-screen::-webkit-scrollbar {
          display:none;
        }

        .sl-screen-body {
          padding:14px 22px 26px;
          display:flex;
          flex-direction:column;
          flex:1;
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

        /* HOME */

        .sl-home {
          padding:0 26px 26px;
          justify-content:space-between;
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
          margin:4px 0 8px;
          padding:13px 14px;
          border-radius:16px;
          background:var(--surface-2);
          border:1px solid rgba(91,140,255,0.22);
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
          border:1px solid rgba(91,140,255,0.25);
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
          opacity:.5;
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
          padding:15px 20px;
          border-radius:16px;
          border:1px solid transparent;
          cursor:pointer;
          transition:
            transform .15s ease,
            filter .15s ease;
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
          padding:13px 10px;
          border-radius:14px;
          border:1px solid var(--border);
          background:var(--surface-2);
          color:var(--text-2);
          font-size:12px;
          font-weight:600;
          font-family:'Space Grotesk',sans-serif;
          cursor:pointer;
        }

        .sl-capture-btn-active {
          color:var(--brand);
          border-color:rgba(91,140,255,.5);
          background:var(--brand-soft);
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
          font-family:'JetBrains Mono',monospace;
        }

        .sl-inline-scan-dot {
          width:7px;
          height:7px;
          border-radius:50%;
          background:var(--brand);
          animation:sl-pulse .9s ease-in-out infinite;
        }

        @keyframes sl-pulse {
          0%,100% { opacity:.35; }
          50% { opacity:1; }
        }

        .sl-image-preview {
          margin-top:14px;
          border:1px solid var(--border);
          background:var(--surface-2);
          border-radius:16px;
          padding:10px;
        }

        .sl-image-preview-head {
          display:flex;
          align-items:center;
          justify-content:space-between;
          margin-bottom:8px;
        }

        .sl-image-preview-title {
          display:flex;
          align-items:center;
          gap:6px;
          color:var(--brand);
          font-size:11.5px;
          font-family:'Space Grotesk',sans-serif;
          font-weight:700;
        }

        .sl-remove-image {
          width:28px;
          height:28px;
          border-radius:9px;
          border:1px solid var(--border);
          background:rgba(255,255,255,.04);
          color:var(--text-2);
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
        }

        .sl-preview-image {
          display:block;
          width:100%;
          max-height:160px;
          object-fit:contain;
          border-radius:10px;
          background:#080B12;
        }

        .sl-textarea {
          margin-top:16px;
          width:100%;
          resize:none;
          background:var(--surface-2);
          border:1px solid var(--border);
          border-radius:16px;
          padding:14px 16px;
          color:var(--text-1);
          font-size:13.5px;
          line-height:1.55;
          font-family:'Inter',sans-serif;
          outline:none;
        }

        .sl-textarea:focus {
          border-color:rgba(91,140,255,.6);
        }

        .sl-textarea::placeholder {
          color:var(--text-3);
        }

        .sl-section-lead {
          color:var(--text-2);
          font-size:12.5px;
          margin:4px 0 12px;
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
          border-color:rgba(255,93,108,.4);
          background:var(--danger-soft);
        }

        .sl-tone-warn {
          color:var(--warn);
          border-color:rgba(245,184,51,.4);
          background:var(--warn-soft);
        }

        .sl-tone-safe {
          color:var(--safe);
          border-color:rgba(47,217,166,.4);
          background:var(--safe-soft);
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
          transition:transform .15s ease;
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
          padding:30px;
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
          border:1.5px dashed rgba(91,140,255,.35);
        }

        .sl-scan-ring-outer {
          width:120px;
          height:120px;
        }

        .sl-scan-ring-mid {
          width:86px;
          height:86px;
          border-color:rgba(91,140,255,.5);
        }

        .sl-spin-slow {
          animation:sl-spin 5s linear infinite;
        }

        .sl-spin-rev {
          animation:sl-spin 3.4s linear infinite reverse;
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

        .sl-checklist {
          display:flex;
          flex-direction:column;
          gap:11px;
          width:100%;
          max-width:260px;
        }

        .sl-check-row {
          display:flex;
          align-items:center;
          gap:10px;
          font-size:12.5px;
          font-family:'JetBrains Mono',monospace;
          color:var(--text-3);
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
          border:2px solid rgba(91,140,255,.25);
          border-top-color:var(--brand);
          animation:sl-spin .7s linear infinite;
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
          padding:9px 18px;
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
          stroke:rgba(255,255,255,.07);
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
          text-transform:uppercase;
        }

        .sl-result-headline {
          color:var(--text-1);
          font-size:14px;
          font-weight:500;
          max-width:260px;
          margin:2px 0 22px;
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
          border:1px solid var(--border);
          border-radius:13px;
          padding:10px 12px;
          opacity:0;
          transform:translateX(-8px);
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
          background:var(--brand-soft);
          border:1px solid rgba(91,140,255,.28);
          border-radius:16px;
          padding:14px 16px;
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
          margin:8px 0 0;
          opacity:.92;
        }

        .sl-action-block {
          width:100%;
          text-align:left;
          background:var(--surface-2);
          border:1px solid var(--border);
          border-radius:16px;
          padding:14px 16px;
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
          margin:8px 0 0;
          line-height:1.5;
        }

        /* HOW */

        .sl-flow {
          display:flex;
          flex-direction:column;
        }

        .sl-flow-row {
          display:grid;
          grid-template-columns:30px 1fr;
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
          background:var(--brand-soft);
          border:1px solid rgba(91,140,255,.35);
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

        .sl-flow-row:last-child .sl-flow-line {
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
