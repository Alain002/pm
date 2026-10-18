"use client";

import { useState, type FormEvent } from "react";

type LoginFormProps = {
    onSuccess: () => void;
};

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            if (response.ok) {
                onSuccess();
            } else {
                setError("Invalid username or password");
            }
        } catch {
            setError("Unable to reach the server");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-[var(--surface)] px-6">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-sm rounded-3xl border border-[var(--stroke)] bg-white p-8 shadow-[var(--shadow)]"
            >
                <div className="h-1.5 w-12 rounded-full bg-[var(--accent-yellow)]" />
                <h1 className="mt-4 font-display text-2xl font-semibold text-[var(--navy-dark)]">
                    Sign in
                </h1>
                <p className="mt-2 text-sm text-[var(--gray-text)]">
                    Use your workspace credentials to open the board.
                </p>
                <label className="mt-6 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
                    Username
                    <input
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        autoComplete="username"
                        required
                        className="mt-2 w-full rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]"
                    />
                </label>
                <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
                    Password
                    <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="current-password"
                        required
                        className="mt-2 w-full rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]"
                    />
                </label>
                {error ? (
                    <p role="alert" className="mt-4 text-sm font-medium text-[var(--secondary-purple)]">
                        {error}
                    </p>
                ) : null}
                <button
                    type="submit"
                    disabled={submitting}
                    className="mt-6 w-full rounded-full bg-[var(--secondary-purple)] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110 disabled:opacity-60"
                >
                    {submitting ? "Signing in" : "Sign in"}
                </button>
            </form>
        </main>
    );
};
