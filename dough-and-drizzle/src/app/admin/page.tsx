"use client";

import { useState } from "react";
import Link from "next/link";
import AdminDashboard from "./AdminDashboard";
import styles from "./admin.module.css";

const ADMIN_PASSWORD = "doughanddrizzle2025";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  if (authed) return <AdminDashboard onLogout={() => setAuthed(false)} />;

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginBg} />
      <div className={`${styles.loginCard} ${shake ? styles.shake : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Dough & Drizzle" className={styles.loginLogo} />
        <h1 className={styles.loginTitle}>Admin Panel</h1>
        <p className={styles.loginSub}>Dough & Drizzle Kitchen 🍩</p>

        <div className={styles.loginForm}>
          <label className={styles.inputLabel}>Password</label>
          <input
            type="password"
            className={`${styles.passwordInput} ${error ? styles.inputError : ""}`}
            placeholder="Enter admin password..."
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            id="admin-password-input"
          />
          {error && <p className={styles.errorMsg}>❌ Incorrect password. Try again!</p>}
          <button className={styles.loginBtn} onClick={handleLogin} id="admin-login-btn">
            Enter Kitchen 🍪
          </button>
        </div>

        <Link href="/" className={styles.backLink}>← Back to Shop</Link>
      </div>
    </div>
  );
}
