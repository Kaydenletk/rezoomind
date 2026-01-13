"use client";

import { useState, type FormEvent } from "react";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Home() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim();

    if (!emailRegex.test(trimmedEmail)) {
      setStatus("error");
      setMessage("Enter a valid email.");
      return;
    }

    try {
      setStatus("loading");
      setMessage("");
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        setStatus("error");
        setMessage(data?.error ?? "Something went wrong. Try again.");
        return;
      }

      setStatus("success");
      setMessage("You're in — watch your inbox.");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage("Network error. Try again.");
    }
  };

  return (
    <div className="landing">
      <div className="floater floater-1" aria-hidden="true" />
      <div className="floater floater-2" aria-hidden="true" />
      <div className="floater floater-3" aria-hidden="true" />
      <div className="floater floater-4" aria-hidden="true" />
      <div className="floater floater-5" aria-hidden="true" />

      <main className="frame">
        <div className="content">
          <span className="kicker fade-up delay-1">
            Verified internship alerts
          </span>
          <h1 className="title fade-up delay-2">Rezoomind®</h1>
          <p className="subtitle fade-up delay-3">
            Get internship alerts from verified, credited sources. We filter the
            noise so you only see real opportunities.
          </p>

          <form className="email-form fade-up delay-4" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="email">
              Email address
            </label>
            <div className="input-shell">
              <input
                id="email"
                type="email"
                name="email"
                placeholder="you@school.edu"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={status === "error"}
              />
              <button
                className="submit-button"
                type="submit"
                aria-label="Submit email"
                disabled={status === "loading"}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M5 12h14M13 5l6 7-6 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            {message ? (
              <p className={`form-message ${status}`} role="status">
                {message}
              </p>
            ) : null}
          </form>

          <div className="cta-row fade-up delay-5">
            <button className="cta-button" type="button">
              Join the verified list
            </button>
          </div>
        </div>
      </main>

      <div className="socials fade-up delay-6">
        <a
          className="social-button"
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 2C6.47 2 2 6.58 2 12.26c0 4.54 2.87 8.38 6.85 9.74.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.88-2.5.47-3.15-.62-3.35-1.18-.11-.29-.6-1.18-1.02-1.42-.35-.2-.85-.7-.01-.71.79-.01 1.35.74 1.54 1.05.9 1.53 2.34 1.1 2.91.84.09-.67.35-1.1.63-1.35-2.22-.26-4.55-1.13-4.55-5.02 0-1.11.39-2.02 1.03-2.73-.1-.26-.45-1.33.1-2.77 0 0 .84-.27 2.75 1.04.79-.22 1.64-.33 2.49-.33.85 0 1.7.11 2.49.33 1.91-1.31 2.75-1.04 2.75-1.04.55 1.44.2 2.51.1 2.77.64.71 1.03 1.61 1.03 2.73 0 3.9-2.34 4.76-4.57 5.02.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49 3.98-1.36 6.85-5.2 6.85-9.74C22 6.58 17.53 2 12 2z"
            />
          </svg>
        </a>
        <a
          className="social-button"
          href="https://x.com"
          target="_blank"
          rel="noreferrer"
          aria-label="X"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M4 4h4.3l4.37 6.1L17.7 4H21l-6.88 8.94L21 20h-4.3l-4.62-6.54L7.3 20H4l7.34-9.64L4 4z"
            />
          </svg>
        </a>
        <a
          className="social-button"
          href="https://linkedin.com"
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 8.98h3.96V21H3V8.98zM9.5 8.98H13v1.64h.05c.49-.93 1.69-1.92 3.49-1.92 3.74 0 4.43 2.46 4.43 5.66V21h-3.96v-4.96c0-1.18-.02-2.7-1.64-2.7-1.65 0-1.9 1.29-1.9 2.62V21H9.5V8.98z"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}
