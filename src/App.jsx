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
  GraduationCap,
  UserCheck,
  ExternalLink,
} from "lucide-react";

/* ================================================================
   ScamLens — Check before you pay.
   iQOO Hackathon 2026 Prototype
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
    score: 94,
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
      "This message combines gaming-related content with an unexpected payment request and urgent language. These patterns can be associated with gaming-related payment scams.",
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
      {
        label: "Unexpected verification instruction",
        icon: "info",
      },
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

/* ================================================================
   Additional demo case
   ================================================================ */

const TRAINING_CASE = {
  id: "training",
  tag: "🟠 Training / Fee Scam",
  accent: "danger",
  message:
    "Dear Student, Greetings from Shiksha Vertex in collaboration with Microsoft Certified Fundamentals. We are pleased to inform you about a Nationwide Internship & Training Program. Limited scholarship registrations available. CLICK HERE. Training fees are applicable. Eligible candidates may receive a 50% concession on the base training fee by applying the Scholarship Code: KIOT@26. Subject to verification. Submit your application to proceed with academic guidance and counselling.",
  level: "high",
  score: 86,
  headline:
    "Multiple financial, urgency and verification indicators detected.",
  reasons: [
    {
      label: "Training fee / payment request",
      icon: "rupee",
    },
    {
      label: "Limited-slot pressure",
      icon: "clock",
    },
    {
      label: "Scholarship / fee bait",
      icon: "gift",
    },
    {
      label: "Application / verification request",
      icon: "info",
    },
    {
      label: "External link instruction",
      icon: "link",
    },
  ],
  recommendation:
    "Do not pay training fees or submit sensitive information until the organization and program are independently verified.",
  explanation:
    "This message promotes an internship or training opportunity while mentioning fees, a limited number of registrations, scholarship concessions, application instructions and an external link. These combinations can be used in fee-based recruitment or impersonation scams. Verify the institution and program through independently found official channels before paying or submitting personal information.",
};

/* ================================================================
   Icons
   ================================================================ */

const ICONS = {
  rupee: IndianRupee,
  clock: Clock,
  gift: Gift,
  alert: AlertTriangle,
  info: Info,
  link: Link2,
  education: GraduationCap,
  user: UserCheck,
};

/* ================================================================
   Accent configuration
   ================================================================ */

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
    return {
      label: "HIGH RISK",
      dot: "🔴",
    };
  }

  if (level === "medium") {
    return {
      label: "NEEDS VERIFICATION",
      dot: "🟡",
    };
  }

  return {
    label: "LOW RISK",
    dot: "🟢",
  };
}

/* ================================================================
   Deterministic Scam Detection Engine
   ================================================================ */

function analyzeCustomText(raw) {
  const text = String(raw || "").trim();
  const norm = text.toLowerCase();

  if (!text) {
    return {
      id: "empty",
      tag: "🟢 No Content",
      accent: "low",
      message: "",
      level: "low",
      score: 0,
      headline: "No message was provided.",
      reasons: [],
      recommendation: "Paste a message and analyze it.",
      explanation: "There is no message content to analyze.",
    };
  }

  /* --------------------------------------------------------------
     Exact canonical cases
     -------------------------------------------------------------- */

  for (const c of Object.values(CASES)) {
    if (norm === c.message.toLowerCase()) {
      return c;
    }
  }

  /* --------------------------------------------------------------
     Signals
     -------------------------------------------------------------- */

  const signals = [];

  const addSignal = (label, icon, weight) => {
    signals.push({
      label,
      icon,
      weight,
    });
  };

  /* 1. Payment / fee */

  if (
    /pay\s*(₹|rs\.?|inr)?\s*[\d,]+/i.test(text) ||
    /processing fee/i.test(text) ||
    /registration fee/i.test(text) ||
    /training fee/i.test(text) ||
    /application fee/i.test(text) ||
    /verification fee/i.test(text) ||
    /security fee/i.test(text) ||
    /service fee/i.test(text) ||
    /joining fee/i.test(text) ||
    /deposit/i.test(text) ||
    /advance payment/i.test(text) ||
    /send money/i.test(text) ||
    /transfer.*money/i.test(text) ||
    /transfer.*fee/i.test(text) ||
    /payment.*pending/i.test(text) ||
    /pay.*fee/i.test(text) ||
    /fee.*applicable/i.test(text)
  ) {
    addSignal(
      "Unexpected payment / fee request",
      "rupee",
      30
    );
  }

  /* 2. Urgency */

  if (
    /immediately/i.test(text) ||
    /urgent/i.test(text) ||
    /within\s+\d+\s*(hours?|days?)/i.test(text) ||
    /do not delay/i.test(text) ||
    /\basap\b/i.test(text) ||
    /act fast/i.test(text) ||
    /right now/i.test(text) ||
    /don't wait/i.test(text) ||
    /hurry/i.test(text) ||
    /limited slots/i.test(text) ||
    /limited registration/i.test(text) ||
    /limited seats/i.test(text) ||
    /last date/i.test(text) ||
    /deadline/i.test(text)
  ) {
    addSignal(
      "Urgency / pressure tactic",
      "clock",
      18
    );
  }

  /* 3. Prize / reward */

  if (
    /won/i.test(text) ||
    /prize/i.test(text) ||
    /congratulations/i.test(text) ||
    /lucky draw/i.test(text) ||
    /lottery/i.test(text) ||
    /selected/i.test(text) ||
    /claim.*reward/i.test(text) ||
    /reward/i.test(text) ||
    /bonus/i.test(text) ||
    /free.*money/i.test(text) ||
    /cash prize/i.test(text) ||
    /scholarship/i.test(text) ||
    /50%\s*(concession|discount)/i.test(text) ||
    /fee concession/i.test(text)
  ) {
    addSignal(
      "Prize / scholarship / reward bait",
      "gift",
      20
    );
  }

  /* 4. Credentials */

  if (
    /\botp\b/i.test(text) ||
    /\bpin\b/i.test(text) ||
    /\bcvv\b/i.test(text) ||
    /password/i.test(text) ||
    /passcode/i.test(text) ||
    /security code/i.test(text) ||
    /\b2fa\b/i.test(text) ||
    /two-factor/i.test(text) ||
    /confirm.*password/i.test(text) ||
    /enter.*otp/i.test(text) ||
    /provide.*pin/i.test(text) ||
    /login credentials/i.test(text)
  ) {
    addSignal(
      "Sensitive credential request",
      "alert",
      28
    );
  }

  /* 5. KYC / verification */

  if (
    /\bkyc\b/i.test(text) ||
    /know your customer/i.test(text) ||
    /verify.*account/i.test(text) ||
    /account.*verification/i.test(text) ||
    /identity.*verification/i.test(text) ||
    /complete.*verification/i.test(text) ||
    /confirm.*identity/i.test(text) ||
    /subject to verification/i.test(text) ||
    /verification/i.test(text) ||
    /verify.*application/i.test(text)
  ) {
    addSignal(
      "Verification / identity request",
      "info",
      20
    );
  }

  /* 6. Account threat */

  if (
    /will be blocked/i.test(text) ||
    /will be suspended/i.test(text) ||
    /will be deactivated/i.test(text) ||
    /account.*block/i.test(text) ||
    /account.*suspend/i.test(text) ||
    /account.*lock/i.test(text) ||
    /account.*restrict/i.test(text) ||
    /access.*denied/i.test(text) ||
    /unauthorized activity/i.test(text) ||
    /unusual activity/i.test(text) ||
    /suspicious activity/i.test(text)
  ) {
    addSignal(
      "Account blocking / security threat",
      "alert",
      22
    );
  }

  /* 7. Brand impersonation */

  const brands =
    /hdfc|icici|axis|sbi|state bank|american express|bank of america|chase|wells fargo|paypal|amazon|apple|microsoft|google|facebook|linkedin|uber|flipkart|whatsapp|bgmi|krafton|free fire|garena/i;

  const formalGreeting =
    /dear\s+(customer|user|member|student|valued customer|sir|madam)/i;

  if (
    brands.test(text) &&
    formalGreeting.test(text)
  ) {
    addSignal(
      "Brand / organization impersonation",
      "link",
      20
    );
  }

  /* 8. URL / link */

  if (
    /https?:\/\/[^\s]+/i.test(text) ||
    /www\.[^\s]+/i.test(text) ||
    /\bbit\.ly\b/i.test(text) ||
    /\btinyurl\b/i.test(text) ||
    /\bshort\.link\b/i.test(text) ||
    /click here/i.test(text) ||
    /click the link/i.test(text) ||
    /tap here/i.test(text) ||
    /visit link/i.test(text) ||
    /open.*link/i.test(text) ||
    /verify via/i.test(text) ||
    /application form/i.test(text)
  ) {
    addSignal(
      "Suspicious URL / external link instruction",
      "link",
      25
    );
  }

  /* 9. Delivery / refund */

  if (
    /refund/i.test(text) ||
    /delivery.*failed/i.test(text) ||
    /reschedul/i.test(text) ||
    /redelivery/i.test(text) ||
    /confirm.*delivery/i.test(text) ||
    /retry.*delivery/i.test(text) ||
    /pending.*refund/i.test(text) ||
    /parcel/i.test(text)
  ) {
    addSignal(
      "Delivery / refund scam pattern",
      "info",
      15
    );
  }

  /* 10. Financial instruction */

  if (
    /activation fee/i.test(text) ||
    /security deposit/i.test(text) ||
    /balance verification/i.test(text) ||
    /update.*payment/i.test(text) ||
    /verify.*payment/i.test(text) ||
    /account.*fund/i.test(text) ||
    /bank details/i.test(text) ||
    /upi id/i.test(text) ||
    /upi payment/i.test(text)
  ) {
    addSignal(
      "Suspicious financial instruction",
      "rupee",
      20
    );
  }

  /* 11. Gaming */

  const gamingSignal =
    /\bbgmi\b/i.test(text) ||
    /\bfree\s*fire\b/i.test(text) ||
    /\bgaming\b/i.test(text) ||
    /\btournament\b/i.test(text) ||
    /\besports\b/i.test(text) ||
    /\buc\b/i.test(text) ||
    /\bdiamonds\b/i.test(text) ||
    /game account/i.test(text) ||
    /gaming account/i.test(text);

  if (gamingSignal) {
    addSignal(
      "Gaming-related scam pattern",
      "alert",
      18
    );
  }

  /* 12. Internship / training recruitment */

  const trainingSignal =
    /internship/i.test(text) ||
    /training program/i.test(text) ||
    /training/i.test(text) ||
    /career program/i.test(text) ||
    /placement assistance/i.test(text) ||
    /hiring partners/i.test(text) ||
    /course completion certificate/i.test(text) ||
    /internship completion certificate/i.test(text);

  if (trainingSignal) {
    addSignal(
      "Internship / training recruitment pattern",
      "education",
      14
    );
  }

  /* 13. Application / registration */

  if (
    /register/i.test(text) ||
    /registration/i.test(text) ||
    /application/i.test(text) ||
    /submit your application/i.test(text) ||
    /apply/i.test(text) ||
    /limited slots/i.test(text) ||
    /scholarship code/i.test(text)
  ) {
    addSignal(
      "Application / registration request",
      "user",
      12
    );
  }

  /* 14. Contact / external communication */

  if (
    /contact information/i.test(text) ||
    /phone:/i.test(text) ||
    /email:/i.test(text) ||
    /whatsapp/i.test(text) ||
    /contact us/i.test(text)
  ) {
    addSignal(
      "External contact / verification path",
      "link",
      8
    );
  }

  /* --------------------------------------------------------------
     Legitimate indicators
     -------------------------------------------------------------- */

  const legit =
    /completed successfully/i.test(text) ||
    /transaction id/i.test(text) ||
    /order confirmed/i.test(text) ||
    /delivered successfully/i.test(text) ||
    /payment received/i.test(text);

  /* --------------------------------------------------------------
     Special combinations
     -------------------------------------------------------------- */

  const hasPayment = signals.some(
    (s) =>
      s.label.includes("payment") ||
      s.label.includes("financial") ||
      s.label.includes("fee")
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
    (s) => s.label.includes("URL") ||
      s.label.includes("link")
  );

  const hasImpersonation = signals.some(
    (s) => s.label.includes("impersonation")
  );

  const hasUrgency = signals.some(
    (s) =>
      s.label.includes("Urgency") ||
      s.label.includes("pressure")
  );

  const hasPrize = signals.some(
    (s) =>
      s.label.includes("Prize") ||
      s.label.includes("reward") ||
      s.label.includes("scholarship")
  );

  const hasGaming = signals.some(
    (s) => s.label.includes("Gaming")
  );

  const hasTraining = signals.some(
    (s) =>
      s.label.includes("training") ||
      s.label.includes("Internship")
  );

  /* --------------------------------------------------------------
     Calculate score
     -------------------------------------------------------------- */

  let score;

  if (signals.length === 0 && legit) {
    score = 6;
  } else if (signals.length === 0) {
    score = 24;
  } else {
    score = Math.min(
      98,
      signals.reduce(
        (total, signal) => total + signal.weight,
        0
      )
    );
  }

  /*
     Combination boosts.
     This prevents a message with many weak individual signals
     from incorrectly appearing safe.
  */

  if (hasPayment && hasUrgency) {
    score += 12;
  }

  if (hasPayment && hasLink) {
    score += 12;
  }

  if (hasCredential && hasLink) {
    score += 15;
  }

  if (hasImpersonation && hasVerification) {
    score += 10;
  }

  if (hasTraining && hasPayment) {
    score += 12;
  }

  if (hasTraining && hasLink) {
    score += 10;
  }

  if (hasPrize && hasPayment) {
    score += 12;
  }

  if (hasGaming && hasPayment) {
    score += 12;
  }

  if (hasThreats && hasCredential) {
    score += 12;
  }

  score = Math.min(98, score);

  /* --------------------------------------------------------------
     Determine level
     -------------------------------------------------------------- */

  let level = "low";

  if (score >= 70) {
    level = "high";
  } else if (score >= 30) {
    level = "medium";
  }

  /* --------------------------------------------------------------
     Headline
     -------------------------------------------------------------- */

  let headline;

  if (level === "high") {
    headline =
      "Multiple suspicious indicators detected.";
  } else if (level === "medium") {
    headline =
      "Some signals require manual verification.";
  } else {
    headline =
      "No major suspicious indicators were detected.";
  }

  /* --------------------------------------------------------------
     Explanation
     -------------------------------------------------------------- */

  let explanation;

  if (signals.length === 0) {
    explanation =
      "No suspicious patterns were detected in this message. It appears to be a routine notification.";
  } else if (
    hasTraining &&
    (hasPayment || hasLink || hasUrgency)
  ) {
    explanation =
      "This message promotes an internship or training opportunity while combining registration instructions with fee-related information, promotional or scholarship language, and an external application path. These patterns can be associated with fee-based recruitment or impersonation scams. Verify the organization independently before paying or submitting personal information.";
  } else if (
    hasImpersonation &&
    hasThreats &&
    (hasVerification || hasCredential)
  ) {
    explanation =
      "This message impersonates a legitimate institution and uses account-related threats to pressure you into verifying sensitive information. This is a common phishing and social-engineering pattern. Do not click links or provide credentials.";
  } else if (
    hasImpersonation &&
    hasLink &&
    hasVerification
  ) {
    explanation =
      "This message appears to combine brand impersonation with an external link and a verification request. Verify the organization independently through its official website or app instead of using the supplied link.";
  } else if (
    hasCredential &&
    (hasImpersonation ||
      hasThreats ||
      hasUrgency)
  ) {
    explanation =
      "This message requests sensitive credentials such as an OTP, PIN or password while using social-engineering tactics. Legitimate organizations generally do not need these credentials through unsolicited messages.";
  } else if (
    hasThreats &&
    (hasUrgency || hasVerification)
  ) {
    explanation =
      "This message uses urgency and account-related threats to pressure you into immediate action. This is a common phishing and social-engineering pattern.";
  } else if (
    hasGaming &&
    (hasPayment ||
      hasPrize ||
      hasUrgency ||
      hasLink ||
      hasCredential)
  ) {
    explanation =
      "This message combines gaming-related content with suspicious payment, reward, urgency, link or credential signals. These patterns can be associated with gaming-related scams. Verify the sender and offer through official channels.";
  } else if (
    hasPayment &&
    hasUrgency
  ) {
    explanation =
      "This message combines urgency with an unexpected payment or fee request. These patterns are commonly associated with financial scams. Verify the request independently.";
  } else if (
    hasPrize &&
    hasPayment
  ) {
    explanation =
      "This message combines prize or reward language with a payment request. Prize scams frequently use small fees or verification payments to manipulate users.";
  } else if (
    hasLink &&
    (hasVerification || hasImpersonation)
  ) {
    explanation =
      "This message contains an external link together with verification or impersonation signals. Do not use the supplied link. Open the official website or app independently.";
  } else if (hasLink) {
    explanation =
      "This message contains an external link or click instruction that should be verified before opening. Avoid links from unexpected messages.";
  } else {
    explanation =
      "This message contains multiple suspicious indicators. Verify the sender independently before making payments, clicking links, or providing sensitive information.";
  }

  /* --------------------------------------------------------------
     Recommendation
     -------------------------------------------------------------- */

  let recommendation;

  if (signals.length === 0) {
    recommendation =
      "No action needed — no major risk signals were found.";
  } else if (
    hasTraining &&
    (hasPayment || hasLink)
  ) {
    recommendation =
      "Do not pay training or registration fees yet. Verify the organization, program and application link through independently found official channels.";
  } else if (
    hasGaming &&
    (hasPayment ||
      hasPrize ||
      hasUrgency ||
      hasLink ||
      hasCredential)
  ) {
    recommendation =
      "Do not pay gaming verification or reward fees. Verify the tournament, reward or account request through its official channel.";
  } else if (
    hasCredential ||
    hasThreats
  ) {
    recommendation =
      "Do NOT provide OTPs, PINs, passwords or other sensitive information. Contact the institution directly using independently verified official contact information.";
  } else if (hasLink) {
    recommendation =
      "Do NOT click the supplied link. Visit the official website or app directly and verify the request there.";
  } else if (hasPayment) {
    recommendation =
      "Do NOT make the payment or transfer funds yet. Verify the request independently through official channels.";
  } else {
    recommendation =
      "Verify the sender independently using official contact information before taking action.";
  }

  return {
    id: "custom",
    tag:
      level === "high"
        ? "🔴 Suspicious"
        : level === "medium"
        ? "🟡 Needs Verification"
        : "🟢 Low Risk",
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
   Lens Mark
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
      className={
        spinning ? "sl-spin-slow" : ""
      }
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
   Status Bar
   ================================================================ */

function StatusBar() {
  return (
    <div className="sl-statusbar">
      <span className="sl-statustime">
        9:41
      </span>

      <div className="sl-statusicons">
        <Signal
          size={13}
          strokeWidth={2.4}
        />

        <Wifi
          size={13}
          strokeWidth={2.4}
        />

        <BatteryFull
          size={15}
          strokeWidth={2.2}
        />
      </div>
    </div>
  );
}

/* ================================================================
   Top Bar
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
   Home Screen
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
          Scam
          <span
            style={{
              color: "var(--brand)",
            }}
          >
            Lens
          </span>
        </h1>

        <p className="sl-tagline">
          "Check before you pay."
        </p>

        <p className="sl-home-desc">
          Analyze suspicious messages
          before you act.
        </p>

        <p className="sl-home-secondary">
          Mobile-first scam protection for
          payments, phishing, gaming and
          digital messages.
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
            Detect fake tournament fees,
            gaming rewards, account scams
            and suspicious payment links.
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
          Gaming &amp; Digital Safety
        </span>
      </div>
    </div>
  );
}

/* ================================================================
   Demo Picker
   ================================================================ */

function DemoPickerScreen({
  pick,
  goBack,
}) {
  const tiles = [
    {
      c: CASES.high,
      hue: "danger",
      desc:
        "Prize bait + urgent processing fee",
    },
    {
      c: CASES.gaming,
      hue: "danger",
      desc:
        "Gaming reward + verification fee",
    },
    {
      c: TRAINING_CASE,
      hue: "danger",
      desc:
        "Training fee + scholarship + application link",
    },
    {
      c: CASES.medium,
      hue: "warn",
      desc:
        "Refund pending manual verification",
    },
    {
      c: CASES.low,
      hue: "safe",
      desc:
        "Confirmed store payment receipt",
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
          Pick a scenario — ScamLens runs
          the full analysis flow instantly.
        </p>

        <div className="sl-demo-list">
          {tiles.map(
            ({
              c,
              hue,
              desc,
            }) => (
              <button
                key={c.id}
                className={`sl-demo-tile sl-tone-${hue}`}
                onClick={() =>
                  pick(c)
                }
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
   Input Screen
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

  const fileRef =
    useRef(null);

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
      c: TRAINING_CASE,
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
          placeholder="Paste a suspicious message here…"
          value={text}
          onChange={(e) =>
            setText(e.target.value)
          }
          rows={6}
        />

        <p
          className="sl-section-lead"
          style={{
            marginTop: 22,
          }}
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
   UPDATED ANALYZING SCREEN
   ================================================================ */

function AnalyzingScreen({
  onDone,
}) {
  const steps = [
    "Capturing message content…",
    "Extracting suspicious signals…",
    "Checking payment & UPI patterns…",
    "Checking gaming & reward scams…",
    "Checking phishing links & impersonation…",
    "Evaluating urgency & social engineering…",
    "Generating explainable risk score…",
    "Preparing safety recommendation…",
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
          setTimeout(
            tick,
            300
          )
        );
      } else {
        timers.push(
          setTimeout(
            onDone,
            650
          )
        );
      }
    };

    timers.push(
      setTimeout(
        tick,
        250
      )
    );

    return () => {
      timers.forEach(
        clearTimeout
      );
    };
  }, [onDone]);

  return (
    <div className="sl-screen sl-analyzing">
      <div className="sl-scan-ring-wrap">
        <div className="sl-scan-ring-outer sl-spin-slow" />

        <div className="sl-scan-ring-mid sl-spin-rev" />

        <div className="sl-scan-core">
          <LensMark
            size={40}
            accent="var(--brand)"
          />
        </div>
      </div>

      <h2 className="sl-analyzing-title">
        ScamLens is analyzing…
      </h2>

      <p className="sl-analyzing-subtitle">
        Checking multiple scam indicators
      </p>

      <div className="sl-checklist">
        {steps.map(
          (step, idx) => {
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

                <span>
                  {step}
                </span>
              </div>
            );
          }
        )}
      </div>

      <div className="sl-analysis-note">
        <ShieldCheck size={14} />

        <span>
          Prototype analysis runs
          locally
        </span>
      </div>
    </div>
  );
}

/* ================================================================
   Count Up
   ================================================================ */

function useCountUp(
  target,
  active,
  duration = 1100
) {
  const [val, setVal] =
    useState(0);

  const rafRef =
    useRef();

  useEffect(() => {
    if (!active) return;

    const start =
      performance.now();

    const ease = (t) =>
      1 -
      Math.pow(
        1 - t,
        3
      );

    const step = (now) => {
      const p = Math.min(
        1,
        (now - start) /
          duration
      );

      setVal(
        Math.round(
          target *
            ease(p)
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
      requestAnimationFrame(
        step
      );

    return () =>
      cancelAnimationFrame(
        rafRef.current
      );
  }, [
    target,
    active,
    duration,
  ]);

  return val;
}

/* ================================================================
   Risk Gauge
   ================================================================ */

function RiskGauge({
  score,
  level,
}) {
  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    const t =
      setTimeout(
        () =>
          setMounted(true),
        60
      );

    return () =>
      clearTimeout(t);
  }, []);

  const count =
    useCountUp(
      score,
      mounted,
      1100
    );

  const r = 66;

  const circ =
    2 * Math.PI * r;

  const offset =
    circ -
    (Math.min(
      score,
      100
    ) /
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
            strokeDasharray:
              circ,
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
   Result Screen
   ================================================================ */

function ResultScreen({
  result,
  goCheckAnother,
  goBack,
  goHow,
}) {
  const meta =
    levelMeta(
      result.level
    );

  const accent =
    ACCENT[result.level];

  const [
    showReasons,
    setShowReasons,
  ] = useState(false);

  useEffect(() => {
    setShowReasons(false);

    const t =
      setTimeout(
        () =>
          setShowReasons(true),
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

        {result.reasons
          .length > 0 && (
          <div className="sl-reasons-block">
            <span className="sl-reasons-title">
              WHY?
            </span>

            <div className="sl-reasons-list">
              {result.reasons.map(
                (r, idx) => {
                  const Icon =
                    ICONS[
                      r.icon
                    ] ||
                    AlertTriangle;

                  return (
                    <div
                      key={`${r.label}-${idx}`}
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
                        <Icon
                          size={14}
                        />
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
   How Screen
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
      d: "Message content is prepared for analysis.",
    },
    {
      t: "Signal Detection",
      d: "ScamLens checks payment, urgency, prize, credential, URL, impersonation, gaming, recruitment and verification patterns.",
    },
    {
      t: "Explainable Assessment",
      d: "Detected signals are converted into a transparent risk assessment.",
    },
    {
      t: "0–100 Risk Score",
      d: "Signals are mapped to a deterministic risk score.",
    },
    {
      t: "Safety Recommendation",
      d: "The user receives one concrete next step before acting.",
    },
    {
      t: "Future AI + On-device Intelligence",
      d: "Production versions can use AI-assisted analysis and supported on-device models for improved accuracy, privacy and latency.",
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
          Lightweight, explainable analysis
          designed for the current MVP.
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
                  ).padStart(
                    2,
                    "0"
                  )}
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

  const [
    pendingCase,
    setPendingCase,
  ] = useState(null);

  const [result, setResult] =
    useState(null);

  const startAnalysis =
    useCallback(
      (source) => {
        const caseObj =
          typeof source ===
          "string"
            ? analyzeCustomText(
                source
              )
            : source;

        setPendingCase(
          caseObj
        );

        setScreen(
          "analyzing"
        );
      },
      []
    );

  const finishAnalysis =
    useCallback(() => {
      if (!pendingCase)
        return;

      setResult(
        pendingCase
      );

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
          letter-spacing:0.2px;
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

        .sl-screen-body {
          padding:
            14px 22px 26px;

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
          padding:
            0 26px 26px;

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

          letter-spacing:-0.02em;
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

          padding:15px 20px;

          border-radius:16px;

          border:
            1px solid
            transparent;

          cursor:pointer;

          transition:
            transform .15s ease,
            filter .15s ease,
            background .15s ease;
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

        .sl-btn-ghost:hover {
          background:
            rgba(255,255,255,0.08);
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

          border:
            1px solid
            var(--border);

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

          animation:
            sl-pulse .9s ease-in-out infinite;
        }

        @keyframes sl-pulse {
          0%,100% {
            opacity:0.35;
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
            1px solid
            var(--border);

          border-radius:16px;

          padding:14px 16px;

          color:var(--text-1);

          font-size:13.5px;

          line-height:1.55;

          font-family:'Inter',sans-serif;

          outline:none;

          transition:
            border-color .15s ease;
        }

        .sl-textarea:focus {
          border-color:
            rgba(91,140,255,0.6);
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

          background:var(--danger-soft);
        }

        .sl-tone-warn {
          color:var(--warn);

          border-color:
            rgba(245,184,51,0.4);

          background:var(--warn-soft);
        }

        .sl-tone-safe {
          color:var(--safe);

          border-color:
            rgba(47,217,166,0.4);

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

          opacity:0.9;
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
            30px 30px;

          gap:24px;

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

        .sl-scan-core {
          width:62px;
          height:62px;

          border-radius:50%;

          display:flex;

          align-items:center;
          justify-content:center;

          background:var(--brand-soft);

          border:
            1px solid
            rgba(91,140,255,0.3);

          box-shadow:
            0 0 25px
            rgba(91,140,255,0.18),
            inset 0 0 20px
            rgba(91,140,255,0.08);
        }

        .sl-spin-slow {
          animation:
            sl-spin 5s linear infinite;
        }

        .sl-spin-rev {
          animation:
            sl-spin 3.4s linear infinite reverse;
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
          color:var(--text-2);

          font-size:12px;

          margin:-14px 0 0;

          font-family:'Inter',sans-serif;
        }

        .sl-checklist {
          display:flex;

          flex-direction:column;

          gap:11px;

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

          opacity:0.5;
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
            sl-spin .7s linear infinite;
        }

        .sl-analysis-note {
          display:flex;

          align-items:center;
          justify-content:center;

          gap:7px;

          color:var(--text-3);

          font-size:10.5px;

          font-family:'JetBrains Mono',monospace;

          margin-top:0;
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

          letter-spacing:0.06em;

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

          letter-spacing:0.04em;

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

          letter-spacing:0.1em;

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
            1px solid
            var(--border);

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

          background:var(--brand-soft);

          border:
            1px solid
            rgba(91,140,255,0.28);

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

          letter-spacing:0.06em;

          text-transform:uppercase;
        }

        .sl-ai-block-text {
          color:var(--text-1);

          font-size:12.5px;

          line-height:1.6;

          margin:
            8px 0 0;

          opacity:0.92;
        }

        .sl-action-block {
          width:100%;

          text-align:left;

          background:var(--surface-2);

          border:
            1px solid
            var(--border);

          border-radius:16px;

          padding:14px 16px;

          margin-bottom:20px;
        }

        .sl-action-title {
          font-family:'Space Grotesk',sans-serif;

          font-size:11.5px;

          font-weight:700;

          letter-spacing:0.08em;

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

          background:var(--brand-soft);

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

        {screen ===
          "analyzing" && (
          <AnalyzingScreen
            onDone={
              finishAnalysis
            }
          />
        )}

        {screen ===
          "result" &&
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
