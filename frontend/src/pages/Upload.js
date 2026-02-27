import React, { useState, useEffect } from 'react';
import FileUpload from '../components/FileUpload';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import authService from '../services/auth';

// ─── Inject Styles ────────────────────────────────────────────────────────────
const injectUploadStyles = () => {
    if (document.getElementById('upload-styles')) return;
    const s = document.createElement('style');
    s.id = 'upload-styles';
    s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

    :root {
        --bg-base: #080A12;
        --bg-card: #111520;
        --bg-card-2: #0D1017;
        --border: rgba(255,255,255,0.06);
        --border-bright: rgba(255,255,255,0.12);
        --gold: #E6B84A;
        --gold-dim: rgba(230,184,74,0.10);
        --gold-glow: rgba(230,184,74,0.22);
        --teal: #2DD4BF;
        --teal-dim: rgba(45,212,191,0.08);
        --red: #F87171;
        --red-dim: rgba(248,113,113,0.10);
        --amber: #FB923C;
        --amber-dim: rgba(251,146,60,0.10);
        --green: #4ADE80;
        --green-dim: rgba(74,222,128,0.10);
        --text-1: #F0F4FF;
        --text-2: rgba(240,244,255,0.55);
        --text-3: rgba(240,244,255,0.28);
        --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
        --font-display: 'Syne', sans-serif;
        --font-body: 'DM Sans', sans-serif;
        --font-mono: 'DM Mono', monospace;
    }

    .up-root {
        min-height: 100vh;
        background: var(--bg-base);
        font-family: var(--font-body);
        color: var(--text-1);
        overflow-x: hidden;
    }

    /* ── Background ── */
    .up-bg {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        overflow: hidden;
    }
    .up-bg-orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(130px);
    }
    .up-bg-orb-1 {
        width: 600px; height: 600px;
        background: radial-gradient(circle, #E6B84A, transparent 70%);
        top: -220px; left: -100px;
        opacity: 0.12;
        animation: upOrb1 20s ease-in-out infinite alternate;
    }
    .up-bg-orb-2 {
        width: 450px; height: 450px;
        background: radial-gradient(circle, #2DD4BF, transparent 70%);
        bottom: 0; right: -80px;
        opacity: 0.09;
        animation: upOrb2 25s ease-in-out infinite alternate;
    }
    .up-bg-grid {
        position: absolute;
        inset: 0;
        background-image:
            linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
        background-size: 56px 56px;
        mask-image: radial-gradient(ellipse 90% 70% at 30% 20%, black 10%, transparent 100%);
    }

    @keyframes upOrb1 {
        from { transform: translate(0,0) scale(1); }
        to   { transform: translate(60px, 100px) scale(1.12); }
    }
    @keyframes upOrb2 {
        from { transform: translate(0,0) scale(1.05); }
        to   { transform: translate(-80px,-60px) scale(0.9); }
    }

    /* ── Page ── */
    .up-page {
        position: relative;
        z-index: 1;
        max-width: 860px;
        margin: 0 auto;
        padding: 48px 40px 100px;
    }

    /* ── Header ── */
    .up-header {
        margin-bottom: 40px;
        opacity: 0;
        transform: translateY(18px);
        animation: upFadeUp 0.65s var(--ease-out) 0.1s forwards;
    }
    .up-eyebrow {
        font-family: var(--font-mono);
        font-size: 11px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--gold);
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
    }
    .up-eyebrow::before {
        content: '';
        display: block;
        width: 22px; height: 1px;
        background: var(--gold);
    }
    .up-title {
        font-family: var(--font-display);
        font-size: clamp(28px, 3.5vw, 44px);
        font-weight: 800;
        letter-spacing: -0.02em;
        line-height: 1.06;
        margin: 0 0 12px;
        background: linear-gradient(135deg, #F0F4FF 0%, rgba(240,244,255,0.6) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .up-subtitle {
        font-size: 14px;
        color: var(--text-3);
        font-family: var(--font-mono);
        letter-spacing: 0.06em;
        display: flex;
        align-items: center;
        gap: 16px;
    }
    .up-subtitle-dot {
        width: 3px; height: 3px;
        border-radius: 50%;
        background: var(--text-3);
        display: inline-block;
    }

    /* ── Info strip ── */
    .up-info-strip {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-bottom: 28px;
        opacity: 0;
        transform: translateY(16px);
        animation: upFadeUp 0.65s var(--ease-out) 0.2s forwards;
    }
    .up-info-item {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 14px 18px;
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .up-info-icon {
        font-size: 18px;
        line-height: 1;
        flex-shrink: 0;
    }
    .up-info-label {
        font-size: 11px;
        font-family: var(--font-mono);
        color: var(--text-3);
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin-bottom: 2px;
    }
    .up-info-val {
        font-size: 13px;
        color: var(--text-2);
        font-weight: 500;
    }

    /* ── Upload zone wrapper ── */
    .up-zone-wrap {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 18px;
        overflow: hidden;
        margin-bottom: 20px;
        opacity: 0;
        transform: translateY(16px);
        animation: upFadeUp 0.65s var(--ease-out) 0.3s forwards;
        position: relative;
    }
    .up-zone-wrap::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--gold-glow), transparent);
    }
    .up-zone-inner {
        padding: 32px;
    }
    .up-zone-label {
        font-family: var(--font-mono);
        font-size: 10px;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: var(--text-3);
        margin-bottom: 18px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .up-zone-label::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--border);
    }

    /* ── Processing overlay ── */
    .up-processing {
        padding: 56px 32px;
        text-align: center;
    }
    .up-proc-ring {
        width: 64px; height: 64px;
        margin: 0 auto 28px;
        position: relative;
    }
    .up-proc-ring::before,
    .up-proc-ring::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
    }
    .up-proc-ring::before {
        border: 2px solid var(--border);
    }
    .up-proc-ring::after {
        border: 2px solid transparent;
        border-top-color: var(--gold);
        border-right-color: var(--gold);
        animation: upSpin 0.9s linear infinite;
    }
    .up-proc-inner {
        position: absolute;
        inset: 10px;
        border-radius: 50%;
        border: 1px solid var(--border);
        border-top-color: var(--teal);
        animation: upSpin 1.4s linear infinite reverse;
    }
    .up-proc-title {
        font-family: var(--font-display);
        font-size: 20px;
        font-weight: 700;
        color: var(--text-1);
        margin-bottom: 8px;
    }
    .up-proc-sub {
        font-size: 13px;
        color: var(--text-3);
        font-family: var(--font-mono);
        letter-spacing: 0.06em;
    }
    .up-proc-steps {
        display: flex;
        justify-content: center;
        gap: 6px;
        margin-top: 24px;
    }
    .up-proc-step {
        width: 6px; height: 6px;
        border-radius: 50%;
        background: var(--border-bright);
    }
    .up-proc-step.active {
        background: var(--gold);
        box-shadow: 0 0 8px var(--gold-glow);
        animation: upPulse 1.2s ease-in-out infinite;
    }

    @keyframes upSpin {
        to { transform: rotate(360deg); }
    }
    @keyframes upPulse {
        0%,100% { opacity: 1; transform: scale(1); }
        50%      { opacity: 0.5; transform: scale(0.7); }
    }

    /* ── Result container ── */
    .up-result {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 18px;
        overflow: hidden;
        opacity: 0;
        animation: upFadeUp 0.6s var(--ease-out) 0.05s forwards;
    }

    /* Duplicate banner */
    .up-dup-banner {
        background: linear-gradient(135deg, rgba(251,146,60,0.08), rgba(251,146,60,0.04));
        border-bottom: 1px solid rgba(251,146,60,0.15);
        padding: 20px 28px;
        display: flex;
        align-items: flex-start;
        gap: 16px;
    }
    .up-dup-icon {
        width: 40px; height: 40px;
        border-radius: 10px;
        background: var(--amber-dim);
        border: 1px solid rgba(251,146,60,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        flex-shrink: 0;
        margin-top: 2px;
    }
    .up-dup-title {
        font-family: var(--font-display);
        font-size: 15px;
        font-weight: 600;
        color: var(--amber);
        margin: 0 0 5px;
    }
    .up-dup-msg {
        font-size: 13px;
        color: var(--text-2);
        margin: 0 0 4px;
        line-height: 1.5;
    }
    .up-dup-id {
        font-family: var(--font-mono);
        font-size: 11px;
        color: var(--text-3);
        margin: 0;
    }

    /* Success banner */
    .up-success-banner {
        padding: 22px 28px;
        display: flex;
        align-items: center;
        gap: 16px;
        border-bottom: 1px solid var(--border);
        background: linear-gradient(135deg, rgba(74,222,128,0.05), transparent);
    }
    .up-success-banner.warn {
        background: linear-gradient(135deg, rgba(251,146,60,0.05), transparent);
    }
    .up-success-icon {
        width: 44px; height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        flex-shrink: 0;
    }
    .up-success-icon.ok   { background: var(--green-dim); border: 1px solid rgba(74,222,128,0.2); }
    .up-success-icon.warn { background: var(--amber-dim); border: 1px solid rgba(251,146,60,0.2); }
    .up-success-title {
        font-family: var(--font-display);
        font-size: 18px;
        font-weight: 700;
        margin: 0 0 4px;
    }
    .up-success-id {
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--text-3);
        margin: 0;
        letter-spacing: 0.04em;
    }
    .up-success-id strong {
        color: var(--gold);
    }

    /* Sections */
    .up-section {
        padding: 24px 28px;
        border-bottom: 1px solid var(--border);
    }
    .up-section:last-of-type { border-bottom: none; }
    .up-section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 18px;
    }
    .up-section-title {
        font-family: var(--font-display);
        font-size: 14px;
        font-weight: 600;
        color: var(--text-1);
        letter-spacing: 0.01em;
    }
    .up-section-badge {
        font-family: var(--font-mono);
        font-size: 10px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        padding: 3px 10px;
        border-radius: 20px;
        background: var(--gold-dim);
        color: var(--gold);
        border: 1px solid rgba(230,184,74,0.2);
    }

    /* Data grid */
    .up-data-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
    }
    .up-data-field {
        background: rgba(255,255,255,0.02);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 13px 16px;
        transition: border-color 0.2s;
    }
    .up-data-field:hover { border-color: var(--border-bright); }
    .up-data-field.full { grid-column: 1 / -1; }
    .up-field-label {
        font-family: var(--font-mono);
        font-size: 10px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--text-3);
        margin-bottom: 6px;
    }
    .up-field-value {
        font-size: 14px;
        color: var(--text-1);
        font-weight: 500;
    }
    .up-field-value.amount {
        font-family: var(--font-display);
        font-size: 20px;
        font-weight: 700;
        color: var(--green);
    }
    .up-field-value.muted { color: var(--text-3); font-style: italic; font-size: 13px; }

    /* Status section */
    .up-status-row {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 14px 16px;
        background: rgba(255,255,255,0.02);
        border: 1px solid var(--border);
        border-radius: 10px;
        margin-bottom: 10px;
    }
    .up-status-row:last-child { margin-bottom: 0; }
    .up-status-key {
        font-family: var(--font-mono);
        font-size: 11px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--text-3);
        width: 130px;
        flex-shrink: 0;
    }
    .up-status-val {
        font-size: 13px;
        color: var(--text-1);
        font-weight: 500;
    }
    .up-status-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        border-radius: 20px;
        font-family: var(--font-mono);
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 0.06em;
        text-transform: uppercase;
    }
    .up-status-pill.pending  { background: rgba(230,184,74,0.12); color: var(--gold); border: 1px solid rgba(230,184,74,0.2); }
    .up-status-pill.approved { background: var(--green-dim); color: var(--green); border: 1px solid rgba(74,222,128,0.2); }
    .up-status-pill.rejected { background: var(--red-dim); color: var(--red); border: 1px solid rgba(248,113,113,0.2); }
    .up-status-pill.default  { background: rgba(255,255,255,0.05); color: var(--text-2); border: 1px solid var(--border); }
    .up-pill-dot {
        width: 5px; height: 5px;
        border-radius: 50%;
        background: currentColor;
    }

    /* Action buttons */
    .up-actions {
        padding: 24px 28px;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        background: var(--bg-card-2);
        border-top: 1px solid var(--border);
    }
    .up-action-btn {
        padding: 13px 20px;
        border-radius: 10px;
        font-family: var(--font-body);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        border: 1px solid var(--border);
        background: rgba(255,255,255,0.03);
        color: var(--text-2);
        transition: all 0.25s var(--ease-out);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        letter-spacing: 0.01em;
    }
    .up-action-btn:hover {
        background: rgba(255,255,255,0.07);
        border-color: var(--border-bright);
        color: var(--text-1);
        transform: translateY(-2px);
    }
    .up-action-btn.primary {
        background: var(--gold-dim);
        border-color: rgba(230,184,74,0.25);
        color: var(--gold);
    }
    .up-action-btn.primary:hover {
        background: rgba(230,184,74,0.18);
        border-color: rgba(230,184,74,0.4);
        box-shadow: 0 8px 24px rgba(230,184,74,0.15);
        color: var(--gold);
    }
    .up-action-btn.teal {
        background: var(--teal-dim);
        border-color: rgba(45,212,191,0.2);
        color: var(--teal);
    }
    .up-action-btn.teal:hover {
        background: rgba(45,212,191,0.14);
        border-color: rgba(45,212,191,0.35);
        box-shadow: 0 8px 24px rgba(45,212,191,0.12);
        color: var(--teal);
    }

    /* Debug */
    .up-debug {
        margin-top: 16px;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--border);
        opacity: 0;
        animation: upFadeUp 0.5s var(--ease-out) 0.3s forwards;
    }
    .up-debug summary {
        padding: 12px 18px;
        font-family: var(--font-mono);
        font-size: 11px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--text-3);
        cursor: pointer;
        background: var(--bg-card);
        border-bottom: 1px solid var(--border);
        list-style: none;
        user-select: none;
    }
    .up-debug summary:hover { color: var(--text-2); }
    .up-debug pre {
        margin: 0;
        padding: 16px 18px;
        font-family: var(--font-mono);
        font-size: 11px;
        color: var(--text-3);
        background: var(--bg-base);
        overflow: auto;
        line-height: 1.7;
    }

    /* Access denied */
    .up-denied {
        background: var(--bg-card);
        border: 1px solid rgba(248,113,113,0.12);
        border-radius: 18px;
        padding: 64px 40px;
        text-align: center;
        max-width: 500px;
        margin: 60px auto 0;
        opacity: 0;
        animation: upFadeUp 0.6s var(--ease-out) 0.1s forwards;
    }
    .up-denied-icon {
        width: 60px; height: 60px;
        border-radius: 16px;
        background: var(--red-dim);
        border: 1px solid rgba(248,113,113,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        margin: 0 auto 24px;
    }
    .up-denied-title {
        font-family: var(--font-display);
        font-size: 22px;
        font-weight: 700;
        margin: 0 0 10px;
        color: var(--red);
    }
    .up-denied-msg {
        font-size: 14px;
        color: var(--text-3);
        margin: 0 0 6px;
        line-height: 1.6;
    }
    .up-denied-role {
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--text-3);
        margin: 0 0 28px;
        letter-spacing: 0.06em;
    }
    .up-denied-btn {
        padding: 12px 28px;
        background: var(--red-dim);
        border: 1px solid rgba(248,113,113,0.2);
        border-radius: 10px;
        color: var(--red);
        font-family: var(--font-body);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.25s var(--ease-out);
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }
    .up-denied-btn:hover {
        background: rgba(248,113,113,0.16);
        border-color: rgba(248,113,113,0.35);
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(248,113,113,0.12);
    }

    /* Shared animations */
    @keyframes upFadeUp {
        to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 700px) {
        .up-page { padding: 24px 16px 60px; }
        .up-info-strip { grid-template-columns: 1fr; }
        .up-data-grid { grid-template-columns: 1fr; }
        .up-data-field.full { grid-column: auto; }
        .up-actions { grid-template-columns: 1fr; }
    }
    `;
    document.head.appendChild(s);
};

// ─── Status helpers ───────────────────────────────────────────────────────────
function getStatusPillClass(status) {
    if (status === 'pending_review' || status === 'pending_manager' || status === 'pending_finance') return 'pending';
    if (status === 'approved') return 'approved';
    if (status === 'rejected') return 'rejected';
    return 'default';
}

function getNextApprover(status) {
    if (status === 'pending_review')   return 'Reviewer';
    if (status === 'pending_manager')  return 'Manager';
    if (status === 'pending_finance')  return 'Finance Controller';
    return '—';
}

// ─── Processing Steps Indicator ───────────────────────────────────────────────
function ProcessingSteps({ step }) {
    return React.createElement('div', { className: 'up-proc-steps' },
        [0, 1, 2].map(i =>
            React.createElement('div', {
                key: i,
                className: `up-proc-step${i === step ? ' active' : ''}`
            })
        )
    );
}

// ─── Upload ───────────────────────────────────────────────────────────────────
function Upload() {
    const navigate = useNavigate();
    const [uploadResult, setUploadResult] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [procStep, setProcStep] = useState(0);

    useEffect(() => {
        injectUploadStyles();
    }, []);

    // Animate processing steps while uploading
    useEffect(() => {
        if (!uploading) return;
        const id = setInterval(() => setProcStep(s => (s + 1) % 3), 700);
        return () => clearInterval(id);
    }, [uploading]);

    const handleUploadComplete = (result) => {
        setUploadResult(result);
        setUploading(false);
    };

    const handleUploadStart = () => {
        setUploading(true);
        setUploadResult(null);
    };

    const resetUpload = () => {
        setUploadResult(null);
        setUploading(false);
    };

    const user = authService.getCurrentUser();
    const canUpload = ['admin', 'reviewer'].includes(user?.role);

    // ── Access Denied ──
    if (!canUpload) {
        return React.createElement('div', { className: 'up-root' },
            React.createElement('div', { className: 'up-bg' },
                React.createElement('div', { className: 'up-bg-orb up-bg-orb-1' }),
                React.createElement('div', { className: 'up-bg-orb up-bg-orb-2' }),
                React.createElement('div', { className: 'up-bg-grid' }),
            ),
            React.createElement(Navigation, null),
            React.createElement('div', { className: 'up-page' },
                React.createElement('div', { className: 'up-denied' },
                    React.createElement('div', { className: 'up-denied-icon' }, '⊘'),
                    React.createElement('h2', { className: 'up-denied-title' }, 'Access Restricted'),
                    React.createElement('p', { className: 'up-denied-msg' }, "You don't have permission to upload documents to the system."),
                    React.createElement('p', { className: 'up-denied-role' }, `Current role: ${user?.role?.toUpperCase()}`),
                    React.createElement('button', {
                        className: 'up-denied-btn',
                        onClick: () => navigate('/dashboard')
                    }, '← Return to Dashboard')
                )
            )
        );
    }

    const isDuplicate = uploadResult?.duplicate_check?.is_duplicate;
    const extracted   = uploadResult?.extracted_data || {};

    // ── Main Render ──
    return React.createElement('div', { className: 'up-root' },
        React.createElement('div', { className: 'up-bg' },
            React.createElement('div', { className: 'up-bg-orb up-bg-orb-1' }),
            React.createElement('div', { className: 'up-bg-orb up-bg-orb-2' }),
            React.createElement('div', { className: 'up-bg-grid' }),
        ),
        React.createElement(Navigation, null),

        React.createElement('main', { className: 'up-page' },

            // Header
            React.createElement('header', { className: 'up-header' },
                React.createElement('div', { className: 'up-eyebrow' }, 'Document Ingestion'),
                React.createElement('h1', { className: 'up-title' }, 'Upload Invoice\nor Credit Note'),
                React.createElement('p', { className: 'up-subtitle' },
                    'PDF',
                    React.createElement('span', { className: 'up-subtitle-dot' }),
                    'PNG',
                    React.createElement('span', { className: 'up-subtitle-dot' }),
                    'JPG',
                    React.createElement('span', { className: 'up-subtitle-dot' }),
                    'Max 10 MB',
                    React.createElement('span', { className: 'up-subtitle-dot' }),
                    'AI extraction enabled'
                )
            ),

            // Info strip
            !uploadResult && React.createElement('div', { className: 'up-info-strip' },
                React.createElement('div', { className: 'up-info-item' },
                    React.createElement('div', { className: 'up-info-icon' }, '◈'),
                    React.createElement('div', null,
                        React.createElement('div', { className: 'up-info-label' }, 'AI Processing'),
                        React.createElement('div', { className: 'up-info-val' }, 'Auto extraction')
                    )
                ),
                React.createElement('div', { className: 'up-info-item' },
                    React.createElement('div', { className: 'up-info-icon' }, '⬡'),
                    React.createElement('div', null,
                        React.createElement('div', { className: 'up-info-label' }, 'Duplicate Check'),
                        React.createElement('div', { className: 'up-info-val' }, 'Real-time scan')
                    )
                ),
                React.createElement('div', { className: 'up-info-item' },
                    React.createElement('div', { className: 'up-info-icon' }, '◎'),
                    React.createElement('div', null,
                        React.createElement('div', { className: 'up-info-label' }, 'Workflow'),
                        React.createElement('div', { className: 'up-info-val' }, '3-stage approval')
                    )
                )
            ),

            // Upload zone or processing or result
            !uploadResult
                ? React.createElement('div', { className: 'up-zone-wrap' },
                    React.createElement('div', { className: 'up-zone-inner' },
                        React.createElement('div', { className: 'up-zone-label' }, 'Drop zone'),
                        React.createElement(FileUpload, {
                            onUploadStart: handleUploadStart,
                            onUploadComplete: handleUploadComplete
                        }),
                        uploading && React.createElement('div', { className: 'up-processing' },
                            React.createElement('div', { className: 'up-proc-ring' },
                                React.createElement('div', { className: 'up-proc-inner' })
                            ),
                            React.createElement('div', { className: 'up-proc-title' }, 'Processing with AI'),
                            React.createElement('div', { className: 'up-proc-sub' }, 'Extracting fields & running duplicate scan…'),
                            React.createElement(ProcessingSteps, { step: procStep })
                        )
                    )
                )
                : React.createElement('div', { className: 'up-result' },

                    // Duplicate banner
                    isDuplicate && React.createElement('div', { className: 'up-dup-banner' },
                        React.createElement('div', { className: 'up-dup-icon' }, '⚠'),
                        React.createElement('div', null,
                            React.createElement('h3', { className: 'up-dup-title' }, 'Potential Duplicate Detected'),
                            React.createElement('p', { className: 'up-dup-msg' }, uploadResult.duplicate_check.reason),
                            uploadResult.duplicate_check.original_id &&
                                React.createElement('p', { className: 'up-dup-id' },
                                    `Original document: #${uploadResult.duplicate_check.original_id}`
                                )
                        )
                    ),

                    // Success banner
                    React.createElement('div', { className: `up-success-banner${isDuplicate ? ' warn' : ''}` },
                        React.createElement('div', { className: `up-success-icon ${isDuplicate ? 'warn' : 'ok'}` },
                            isDuplicate ? '△' : '✓'
                        ),
                        React.createElement('div', null,
                            React.createElement('h3', { className: 'up-success-title' },
                                isDuplicate ? 'Uploaded with Warning' : 'Document Uploaded'
                            ),
                            React.createElement('p', { className: 'up-success-id' },
                                'Document ID: ',
                                React.createElement('strong', null, `#${uploadResult.id}`)
                            )
                        )
                    ),

                    // AI extracted data
                    React.createElement('div', { className: 'up-section' },
                        React.createElement('div', { className: 'up-section-header' },
                            React.createElement('div', { className: 'up-section-title' }, 'AI Extracted Data'),
                            React.createElement('div', { className: 'up-section-badge' }, 'Auto-parsed')
                        ),
                        React.createElement('div', { className: 'up-data-grid' },
                            React.createElement('div', { className: 'up-data-field' },
                                React.createElement('div', { className: 'up-field-label' }, 'Vendor'),
                                React.createElement('div', {
                                    className: `up-field-value${extracted.vendor ? '' : ' muted'}`
                                }, extracted.vendor || 'Not detected')
                            ),
                            React.createElement('div', { className: 'up-data-field' },
                                React.createElement('div', { className: 'up-field-label' }, 'Invoice Number'),
                                React.createElement('div', {
                                    className: `up-field-value${extracted.invoice_number ? '' : ' muted'}`
                                }, extracted.invoice_number || 'Not detected')
                            ),
                            React.createElement('div', { className: 'up-data-field' },
                                React.createElement('div', { className: 'up-field-label' }, 'Invoice Date'),
                                React.createElement('div', {
                                    className: `up-field-value${extracted.date ? '' : ' muted'}`
                                }, extracted.date || 'Not detected')
                            ),
                            React.createElement('div', { className: 'up-data-field' },
                                React.createElement('div', { className: 'up-field-label' }, 'VAT Amount'),
                                React.createElement('div', {
                                    className: `up-field-value${extracted.vat_amount ? '' : ' muted'}`
                                }, extracted.vat_amount
                                    ? `R ${Number(extracted.vat_amount).toFixed(2)}`
                                    : 'Not detected'
                                )
                            ),
                            React.createElement('div', { className: 'up-data-field full' },
                                React.createElement('div', { className: 'up-field-label' }, 'Total Amount'),
                                React.createElement('div', { className: 'up-field-value amount' },
                                    extracted.amount
                                        ? `R ${Number(extracted.amount).toFixed(2)}`
                                        : 'R 0.00'
                                )
                            )
                        )
                    ),

                    // Status
                    React.createElement('div', { className: 'up-section' },
                        React.createElement('div', { className: 'up-section-header' },
                            React.createElement('div', { className: 'up-section-title' }, 'Workflow Status')
                        ),
                        React.createElement('div', { className: 'up-status-row' },
                            React.createElement('div', { className: 'up-status-key' }, 'Current Status'),
                            React.createElement('div', { className: 'up-status-val' },
                                React.createElement('div', {
                                    className: `up-status-pill ${getStatusPillClass(uploadResult.status)}`
                                },
                                    React.createElement('div', { className: 'up-pill-dot' }),
                                    uploadResult.status?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN'
                                )
                            )
                        ),
                        React.createElement('div', { className: 'up-status-row' },
                            React.createElement('div', { className: 'up-status-key' }, 'Next Approver'),
                            React.createElement('div', { className: 'up-status-val' },
                                getNextApprover(uploadResult.status)
                            )
                        )
                    ),

                    // Actions
                    React.createElement('div', { className: 'up-actions' },
                        React.createElement('button', {
                            className: 'up-action-btn teal',
                            onClick: () => navigate('/approvals')
                        }, '◎ Pending Approvals'),
                        React.createElement('button', {
                            className: 'up-action-btn primary',
                            onClick: resetUpload
                        }, '↑ Upload Another'),
                        React.createElement('button', {
                            className: 'up-action-btn',
                            onClick: () => navigate('/dashboard')
                        }, '← Dashboard')
                    ),

                    // Debug
                    process.env.NODE_ENV === 'development' &&
                        React.createElement('details', { className: 'up-debug' },
                            React.createElement('summary', null, 'Debug Payload'),
                            React.createElement('pre', null, JSON.stringify(uploadResult, null, 2))
                        )
                )
        )
    );
}

export default Upload;