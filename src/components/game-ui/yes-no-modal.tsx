"use client";

import { useState } from "react";

type Props = {
  question: string;
  yesAction: "contact-form" | "go-to-scene";
  yesSceneLabel?: string;
  noMessage?: string;
  onYesGoToScene: () => void;
  onNo: (message: string) => void;
  onClose: () => void;
};

type Step = "question" | "contact" | "contact-sent" | "no-spoken";

export function YesNoModal({ question, yesAction, yesSceneLabel, noMessage, onYesGoToScene, onNo, onClose }: Props) {
  const [step, setStep] = useState<Step>("question");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleYes = () => {
    if (yesAction === "go-to-scene") {
      onYesGoToScene();
      onClose();
    } else {
      setStep("contact");
    }
  };

  const handleNo = () => {
    const msg = noMessage ?? "Maybe next time!";
    onNo(msg);
    setStep("no-spoken");
    setTimeout(onClose, 1800);
  };

  const handleSend = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      if (res.ok) {
        setStep("contact-sent");
      } else {
        const mailto = `mailto:?subject=Portfolio Contact from ${encodeURIComponent(name)}&body=${encodeURIComponent(message)}%0A%0AFrom: ${encodeURIComponent(email)}`;
        window.open(mailto);
        setStep("contact-sent");
      }
    } catch {
      const mailto = `mailto:?subject=Portfolio Contact from ${encodeURIComponent(name)}&body=${encodeURIComponent(message)}%0A%0AFrom: ${encodeURIComponent(email)}`;
      window.open(mailto);
      setStep("contact-sent");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="item-info-modal-backdrop" onClick={step === "question" ? onClose : undefined}>
      <div
        className="yes-no-modal font-pixel"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {step === "question" && (
          <>
            <p className="yes-no-modal__question">{question}</p>
            <div className="yes-no-modal__buttons">
              <button type="button" className="yes-no-modal__btn yes-no-modal__btn--yes" onClick={handleYes}>
                YES
              </button>
              <button type="button" className="yes-no-modal__btn yes-no-modal__btn--no" onClick={handleNo}>
                NO
              </button>
            </div>
            {yesAction === "go-to-scene" && yesSceneLabel && (
              <p className="yes-no-modal__hint">→ {yesSceneLabel}</p>
            )}
          </>
        )}

        {step === "contact" && (
          <>
            <p className="yes-no-modal__question">Let&apos;s connect!</p>
            <div className="yes-no-modal__form">
              <input
                className="yes-no-modal__input"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="yes-no-modal__input"
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <textarea
                className="yes-no-modal__input yes-no-modal__textarea"
                placeholder="Your message..."
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="yes-no-modal__buttons">
                <button
                  type="button"
                  className="yes-no-modal__btn yes-no-modal__btn--yes"
                  onClick={() => void handleSend()}
                  disabled={sending || !name.trim() || !email.trim() || !message.trim()}
                >
                  {sending ? "..." : "SEND"}
                </button>
                <button type="button" className="yes-no-modal__btn yes-no-modal__btn--no" onClick={onClose}>
                  CANCEL
                </button>
              </div>
            </div>
          </>
        )}

        {step === "contact-sent" && (
          <>
            <p className="yes-no-modal__question">Message sent! 🎉</p>
            <p className="yes-no-modal__hint">I&apos;ll get back to you soon.</p>
            <div className="yes-no-modal__buttons">
              <button type="button" className="yes-no-modal__btn yes-no-modal__btn--yes" onClick={onClose}>
                CLOSE
              </button>
            </div>
          </>
        )}

        {step === "no-spoken" && (
          <p className="yes-no-modal__question" style={{ textAlign: "center" }}>
            {noMessage ?? "Maybe next time!"}
          </p>
        )}
      </div>
    </div>
  );
}
