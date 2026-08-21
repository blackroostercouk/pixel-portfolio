"use client";

import { useState, type FormEvent } from "react";
import type { useAuth } from "@/lib/auth/use-auth";

type Props = {
  onClose: (loggedIn?: boolean) => void;
  signIn: ReturnType<typeof useAuth>["signIn"];
};

export function LoginModal({ onClose, signIn }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const { error: authError } = await signIn(email, password);

    if (authError) {
      setError(authError.message);
      setIsPending(false);
      return;
    }

    onClose(true);
  };

  return (
    <div className="login-modal-backdrop" onClick={() => onClose()}>
      <div
        className="login-modal font-pixel"
        role="dialog"
        aria-modal="true"
        aria-label="Login"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="login-modal__title">Login</h2>

        <form className="login-modal__form" onSubmit={handleSubmit}>
          <label className="login-modal__field">
            <span className="login-modal__label">Email</span>
            <input
              className="login-modal__input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              autoFocus
            />
          </label>

          <label className="login-modal__field">
            <span className="login-modal__label">Password</span>
            <input
              className="login-modal__input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          {error ? <p className="login-modal__error">{error}</p> : null}

          <button
            type="submit"
            className="login-modal__submit"
            disabled={isPending}
          >
            {isPending ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
