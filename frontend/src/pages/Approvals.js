import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Navigation from '../components/Navigation';

// API Base URL - Use environment variable with fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// ─── Inject Styles ────────────────────────────────────────────────────────────
const injectApprovalsStyles = () => {
    if (document.getElementById('approvals-styles')) return;
    const s = document.createElement('style');
    s.id = 'approvals-styles';
    s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

    :root {
        --bg-base: #080A12;
        --bg-card: #111520;
        --bg-card-2: #0D1017;
        --bg-card-hover: #161B28;
        --border: rgba(255,255,255,0.06);
        --border-bright: rgba(255,255,255,0.13);
        --gold: #E6B84A;
        --gold-dim: rgba(230,184,74,0.10);
        --gold-glow: rgba(230,184,74,0.22);
        --teal: #2DD4BF;
        --teal-dim: rgba(45,212,191,0.08);
        --red: #F87171;
        --red-dim: rgba(248,113,113,0.10);
        --blue: #60A5FA;
        --blue-dim: rgba(96,165,250,0.10);
        --green: #4ADE80;
        --green-dim: rgba(74,222,128,0.10);
        --amber: #FB923C;
        --amber-dim: rgba(251,146,60,0.10);
        --text-1: #F0F4FF;
        --text-2: rgba(240,244,255,0.55);
        --text-3: rgba(240,244,255,0.28);
        --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
        --font-display: 'Syne', sans-serif;
        --font-body: 'DM Sans', sans-serif;
        --font-mono: 'DM Mono', monospace;
    }

    .ap-root {
        min-height: 100vh;
        background: var(--bg-base);
        font-family: var(--font-body);
        color: var(--text-1);
        overflow-x: hidden;
    }

    /* ── Background ── */
    .ap-bg {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        overflow: hidden;
    }
    .ap-bg-orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(130px);
    }
    .ap-bg-orb-1 {
        width: 580px; height: 580px;
        background: radial-gradient(circle, #2DD4BF, transparent 70%);
        top: -180px; right: -120px;
        opacity: 0.09;
        animation: apOrb1 22s ease-in-out infinite alternate;
    }
    .ap-bg-orb-2 {
        width: 480px; height: 480px;
        background: radial-gradient(circle, #E6B84A, transparent 70%);
        bottom: 60px; left: -100px;
        opacity: 0.10;
        animation: apOrb2 18s ease-in-out infinite alternate;
    }
    .ap-bg-grid {
        position: absolute;
        inset: 0;
        background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
        background-size: 56px 56px;
        mask-image: radial-gradient(ellipse 80% 60% at 70% 10%, black 10%, transparent 100%);
    }
    @keyframes apOrb1 {
        from { transform: translate(0,0) scale(1); }
        to   { transform: translate(-60px,80px) scale(1.1); }
    }
    @keyframes apOrb2 {
        from { transform: translate(0,0) scale(1.05); }
        to   { transform: translate(70px,-50px) scale(0.92); }
    }

    /* ── Page ── */
    .ap-page {
        position: relative;
        z-index: 1;
        max-width: 1100px;
        margin: 0 auto;
        padding: 48px 40px 100px;
    }

    /* ── Header ── */
    .ap-header {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: end;
        gap: 24px;
        margin-bottom: 36px;
        padding-bottom: 32px;
        border-bottom: 1px solid var(--border);
        opacity: 0;
        transform: translateY(16px);
        animation: apFadeUp 0.65s var(--ease-out) 0.1s forwards;
    }
    .ap-eyebrow {
        font-family: var(--font-mono);
        font-size: 11px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--teal);
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
    }
    .ap-eyebrow::before {
        content: '';
        display: block;
        width: 22px; height: 1px;
        background: var(--teal);
    }
    .ap-title {
        font-family: var(--font-display);
        font-size: clamp(26px, 3vw, 42px);
        font-weight: 800;
        letter-spacing: -0.02em;
        line-height: 1.06;
        margin: 0;
        background: linear-gradient(135deg, #F0F4FF 0%, rgba(240,244,255,0.6) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .ap-header-right {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .ap-count-badge {
        font-family: var(--font-display);
        font-size: 40px;
        font-weight: 800;
        color: var(--teal);
        line-height: 1;
        letter-spacing: -0.03em;
    }
    .ap-count-label {
        font-family: var(--font-mono);
        font-size: 10px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--text-3);
        line-height: 1.4;
    }

    /* ── Error banner ── */
    .ap-error {
        background: var(--red-dim);
        border: 1px solid rgba(248,113,113,0.2);
        border-radius: 12px;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 24px;
        opacity: 0;
        animation: apFadeUp 0.5s var(--ease-out) 0.1s forwards;
    }
    .ap-error-icon {
        width: 32px; height: 32px;
        border-radius: 8px;
        background: rgba(248,113,113,0.15);
        border: 1px solid rgba(248,113,113,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        flex-shrink: 0;
    }
    .ap-error-text {
        font-size: 13px;
        color: var(--red);
        font-family: var(--font-mono);
        letter-spacing: 0.02em;
    }

    /* ── Filter bar ── */
    .ap-filter-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;
        opacity: 0;
        transform: translateY(14px);
        animation: apFadeUp 0.6s var(--ease-out) 0.2s forwards;
    }
    .ap-filter-label {
        font-family: var(--font-mono);
        font-size: 10px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--text-3);
        margin-right: 4px;
    }
    .ap-filter-btn {
        padding: 6px 14px;
        border-radius: 20px;
        border: 1px solid var(--border);
        background: transparent;
        font-family: var(--font-mono);
        font-size: 11px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-3);
        cursor: pointer;
        transition: all 0.2s var(--ease-out);
    }
    .ap-filter-btn:hover {
        background: var(--bg-card);
        color: var(--text-2);
        border-color: var(--border-bright);
    }
    .ap-filter-btn.active {
        background: var(--teal-dim);
        border-color: rgba(45,212,191,0.25);
        color: var(--teal);
    }

    /* ── Doc list ── */
    .ap-list {
        display: flex;
        flex-direction: column;
        gap: 14px;
    }

    /* ── Doc card ── */
    .ap-doc-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 16px;
        overflow: hidden;
        transition: border-color 0.25s, transform 0.3s var(--ease-out), box-shadow 0.3s;
        opacity: 0;
        transform: translateY(16px);
        position: relative;
    }
    .ap-doc-card.visible {
        animation: apFadeUp 0.55s var(--ease-out) forwards;
    }
    .ap-doc-card:hover {
        border-color: var(--border-bright);
        transform: translateY(-2px);
        box-shadow: 0 16px 48px rgba(0,0,0,0.4);
    }
    .ap-doc-card.processing {
        opacity: 0.55;
        pointer-events: none;
    }

    /* Stage indicator bar */
    .ap-stage-bar {
        height: 2px;
        width: 100%;
    }
    .ap-stage-bar.review  { background: linear-gradient(90deg, var(--gold), transparent 70%); }
    .ap-stage-bar.manager { background: linear-gradient(90deg, var(--blue), transparent 70%); }
    .ap-stage-bar.finance { background: linear-gradient(90deg, var(--green), transparent 70%); }

    .ap-doc-body {
        padding: 22px 24px;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 20px;
        align-items: start;
    }

    /* Left content */
    .ap-doc-top {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 16px;
    }
    .ap-doc-file-icon {
        width: 40px; height: 40px;
        border-radius: 10px;
        background: var(--bg-card-2);
        border: 1px solid var(--border);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        flex-shrink: 0;
    }
    .ap-doc-filename {
        font-family: var(--font-display);
        font-size: 15px;
        font-weight: 600;
        color: var(--text-1);
        letter-spacing: 0.005em;
        margin-bottom: 3px;
        word-break: break-all;
    }
    .ap-doc-id {
        font-family: var(--font-mono);
        font-size: 11px;
        color: var(--text-3);
        letter-spacing: 0.06em;
    }

    /* Meta fields */
    .ap-doc-meta {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
    }
    .ap-meta-field {
        background: rgba(255,255,255,0.02);
        border: 1px solid var(--border);
        border-radius: 9px;
        padding: 10px 14px;
    }
    .ap-meta-label {
        font-family: var(--font-mono);
        font-size: 9px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--text-3);
        margin-bottom: 5px;
    }
    .ap-meta-value {
        font-size: 13px;
        color: var(--text-1);
        font-weight: 500;
    }
    .ap-meta-value.amount {
        font-family: var(--font-display);
        font-size: 16px;
        font-weight: 700;
        color: var(--green);
    }

    /* Right: stage + actions */
    .ap-doc-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 16px;
        min-width: 160px;
    }
    .ap-stage-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        border-radius: 20px;
        font-family: var(--font-mono);
        font-size: 10px;
        font-weight: 500;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        white-space: nowrap;
    }
    .ap-stage-pill.review  { background: var(--gold-dim); color: var(--gold); border: 1px solid rgba(230,184,74,0.2); }
    .ap-stage-pill.manager { background: var(--blue-dim); color: var(--blue); border: 1px solid rgba(96,165,250,0.2); }
    .ap-stage-pill.finance { background: var(--green-dim); color: var(--green); border: 1px solid rgba(74,222,128,0.2); }
    .ap-pill-dot {
        width: 5px; height: 5px;
        border-radius: 50%;
        background: currentColor;
    }

    /* Action buttons */
    .ap-doc-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
    }
    .ap-btn {
        padding: 10px 18px;
        border-radius: 9px;
        font-family: var(--font-body);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        border: 1px solid transparent;
        transition: all 0.25s var(--ease-out);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        white-space: nowrap;
        letter-spacing: 0.01em;
    }
    .ap-btn-approve {
        background: var(--green-dim);
        border-color: rgba(74,222,128,0.2);
        color: var(--green);
    }
    .ap-btn-approve:hover:not(:disabled) {
        background: rgba(74,222,128,0.16);
        border-color: rgba(74,222,128,0.38);
        box-shadow: 0 6px 20px rgba(74,222,128,0.14);
        transform: translateY(-1px);
    }
    .ap-btn-reject {
        background: var(--red-dim);
        border-color: rgba(248,113,113,0.18);
        color: var(--red);
    }
    .ap-btn-reject:hover:not(:disabled) {
        background: rgba(248,113,113,0.16);
        border-color: rgba(248,113,113,0.35);
        box-shadow: 0 6px 20px rgba(248,113,113,0.12);
        transform: translateY(-1px);
    }
    .ap-btn:disabled {
        opacity: 0.45;
        cursor: wait;
    }

    /* Processing spinner inside btn */
    .ap-btn-spinner {
        width: 12px; height: 12px;
        border-radius: 50%;
        border: 2px solid transparent;
        border-top-color: currentColor;
        animation: apSpin 0.7s linear infinite;
        flex-shrink: 0;
    }

    /* ── Empty state ── */
    .ap-empty {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 18px;
        padding: 72px 40px;
        text-align: center;
        opacity: 0;
        animation: apFadeUp 0.6s var(--ease-out) 0.3s forwards;
    }
    .ap-empty-icon {
        width: 64px; height: 64px;
        border-radius: 18px;
        background: var(--teal-dim);
        border: 1px solid rgba(45,212,191,0.18);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 26px;
        margin: 0 auto 24px;
    }
    .ap-empty-title {
        font-family: var(--font-display);
        font-size: 22px;
        font-weight: 700;
        margin: 0 0 10px;
        color: var(--text-1);
    }
    .ap-empty-sub {
        font-size: 14px;
        color: var(--text-3);
        line-height: 1.6;
        max-width: 380px;
        margin: 0 auto;
        font-family: var(--font-mono);
        letter-spacing: 0.04em;
    }

    /* ── Loading skeleton ── */
    .ap-skeleton {
        display: flex;
        flex-direction: column;
        gap: 14px;
        opacity: 0;
        animation: apFadeUp 0.5s var(--ease-out) 0.15s forwards;
    }
    .ap-skeleton-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 22px 24px;
        overflow: hidden;
        position: relative;
    }
    .ap-skeleton-card::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg,
            transparent 0%,
            rgba(255,255,255,0.03) 40%,
            rgba(255,255,255,0.06) 50%,
            rgba(255,255,255,0.03) 60%,
            transparent 100%
        );
        background-size: 200% 100%;
        animation: apShimmer 1.6s ease-in-out infinite;
    }
    .ap-skel-line {
        height: 12px;
        border-radius: 6px;
        background: rgba(255,255,255,0.04);
        margin-bottom: 12px;
    }
    .ap-skel-line.short { width: 35%; }
    .ap-skel-line.mid   { width: 60%; }
    .ap-skel-line.full  { width: 100%; }

    /* ── Modal overlay ── */
    .ap-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.7);
        backdrop-filter: blur(6px);
        z-index: 9000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: apFadeIn 0.2s ease forwards;
    }
    .ap-modal {
        background: var(--bg-card);
        border: 1px solid var(--border-bright);
        border-radius: 18px;
        width: 100%;
        max-width: 480px;
        overflow: hidden;
        box-shadow: 0 40px 100px rgba(0,0,0,0.6);
        animation: apScaleIn 0.3s var(--ease-out) forwards;
    }
    .ap-modal-header {
        padding: 24px 28px 20px;
        border-bottom: 1px solid var(--border);
        display: flex;
        align-items: center;
        gap: 14px;
    }
    .ap-modal-icon {
        width: 40px; height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        flex-shrink: 0;
    }
    .ap-modal-icon.approve { background: var(--green-dim); border: 1px solid rgba(74,222,128,0.2); }
    .ap-modal-icon.reject  { background: var(--red-dim);   border: 1px solid rgba(248,113,113,0.18); }
    .ap-modal-title {
        font-family: var(--font-display);
        font-size: 17px;
        font-weight: 700;
        margin: 0 0 3px;
    }
    .ap-modal-sub {
        font-size: 12px;
        color: var(--text-3);
        font-family: var(--font-mono);
        margin: 0;
        letter-spacing: 0.04em;
    }
    .ap-modal-body {
        padding: 24px 28px;
    }
    .ap-modal-field-label {
        font-family: var(--font-mono);
        font-size: 10px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--text-3);
        margin-bottom: 8px;
    }
    .ap-modal-textarea {
        width: 100%;
        background: rgba(255,255,255,0.03);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 12px 14px;
        font-family: var(--font-body);
        font-size: 13.5px;
        color: var(--text-1);
        resize: vertical;
        min-height: 90px;
        box-sizing: border-box;
        outline: none;
        transition: border-color 0.2s;
        line-height: 1.6;
    }
    .ap-modal-textarea:focus { border-color: var(--border-bright); }
    .ap-modal-textarea::placeholder { color: var(--text-3); }
    .ap-modal-footer {
        padding: 16px 28px 24px;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
    }
    .ap-modal-btn-cancel {
        padding: 10px 20px;
        border-radius: 9px;
        border: 1px solid var(--border);
        background: transparent;
        color: var(--text-2);
        font-family: var(--font-body);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }
    .ap-modal-btn-cancel:hover {
        background: rgba(255,255,255,0.05);
        border-color: var(--border-bright);
        color: var(--text-1);
    }
    .ap-modal-btn-confirm {
        padding: 10px 24px;
        border-radius: 9px;
        border: 1px solid transparent;
        font-family: var(--font-body);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.25s var(--ease-out);
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .ap-modal-btn-confirm.approve {
        background: var(--green-dim);
        border-color: rgba(74,222,128,0.25);
        color: var(--green);
    }
    .ap-modal-btn-confirm.approve:hover {
        background: rgba(74,222,128,0.16);
        border-color: rgba(74,222,128,0.4);
        box-shadow: 0 6px 20px rgba(74,222,128,0.15);
    }
    .ap-modal-btn-confirm.reject {
        background: var(--red-dim);
        border-color: rgba(248,113,113,0.22);
        color: var(--red);
    }
    .ap-modal-btn-confirm.reject:hover {
        background: rgba(248,113,113,0.16);
        border-color: rgba(248,113,113,0.4);
        box-shadow: 0 6px 20px rgba(248,113,113,0.15);
    }
    .ap-modal-btn-confirm:disabled {
        opacity: 0.5;
        cursor: wait;
    }

    /* Toast notification */
    .ap-toast {
        position: fixed;
        bottom: 32px;
        right: 32px;
        z-index: 9999;
        background: var(--bg-card);
        border: 1px solid var(--border-bright);
        border-radius: 12px;
        padding: 14px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        font-size: 13.5px;
        font-weight: 500;
        max-width: 340px;
        animation: apToastIn 0.4s var(--ease-out) forwards;
    }
    .ap-toast.success { border-color: rgba(74,222,128,0.25); }
    .ap-toast.error   { border-color: rgba(248,113,113,0.25); }
    .ap-toast-dot {
        width: 8px; height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
    }
    .ap-toast.success .ap-toast-dot { background: var(--green); box-shadow: 0 0 8px rgba(74,222,128,0.5); }
    .ap-toast.error   .ap-toast-dot { background: var(--red);   box-shadow: 0 0 8px rgba(248,113,113,0.4); }
    .ap-toast.success { color: var(--text-1); }
    .ap-toast.error   { color: var(--red); }

    /* ── Keyframes ── */
    @keyframes apFadeUp  { to { opacity: 1; transform: translateY(0); } }
    @keyframes apFadeIn  { to { opacity: 1; } }
    @keyframes apSpin    { to { transform: rotate(360deg); } }
    @keyframes apShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    @keyframes apScaleIn {
        from { opacity: 0; transform: scale(0.95) translateY(10px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes apToastIn {
        from { opacity: 0; transform: translateY(16px) translateX(8px); }
        to   { opacity: 1; transform: translateY(0) translateX(0); }
    }

    @media (max-width: 760px) {
        .ap-page { padding: 24px 16px 60px; }
        .ap-doc-body { grid-template-columns: 1fr; }
        .ap-doc-right { align-items: flex-start; flex-direction: row; flex-wrap: wrap; }
        .ap-doc-meta { grid-template-columns: 1fr 1fr; }
        .ap-header { grid-template-columns: 1fr; }
    }
    `;
    document.head.appendChild(s);
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getStageInfo(status) {
    if (status === 'pending_review')  return { key: 'review',  label: 'Stage 1 · Review' };
    if (status === 'pending_manager') return { key: 'manager', label: 'Stage 2 · Manager' };
    if (status === 'pending_finance') return { key: 'finance', label: 'Stage 3 · Finance' };
    return { key: 'review', label: 'Pending' };
}

function getFileIcon(filename) {
    if (!filename) return '◈';
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '▣';
    if (['png','jpg','jpeg'].includes(ext)) return '◧';
    return '◈';
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onDone }) {
    useEffect(() => {
        const id = setTimeout(onDone, 3200);
        return () => clearTimeout(id);
    }, [onDone]);

    return React.createElement('div', { className: `ap-toast ${type}` },
        React.createElement('div', { className: 'ap-toast-dot' }),
        message
    );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function ActionModal({ mode, doc, onConfirm, onCancel }) {
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const isReject = mode === 'reject';

    const handleConfirm = async () => {
        if (isReject && !text.trim()) return;
        setBusy(true);
        await onConfirm(text.trim());
        setBusy(false);
    };

    return React.createElement('div', { className: 'ap-modal-overlay', onClick: (e) => { if (e.target === e.currentTarget) onCancel(); } },
        React.createElement('div', { className: 'ap-modal' },
            React.createElement('div', { className: 'ap-modal-header' },
                React.createElement('div', { className: `ap-modal-icon ${isReject ? 'reject' : 'approve'}` },
                    isReject ? '✕' : '✓'
                ),
                React.createElement('div', null,
                    React.createElement('div', { className: 'ap-modal-title', style: { color: isReject ? 'var(--red)' : 'var(--green)' } },
                        isReject ? 'Reject Document' : 'Approve Document'
                    ),
                    React.createElement('p', { className: 'ap-modal-sub' }, doc.filename)
                )
            ),
            React.createElement('div', { className: 'ap-modal-body' },
                React.createElement('div', { className: 'ap-modal-field-label' },
                    isReject ? 'Rejection Reason (required)' : 'Approval Comments (optional)'
                ),
                React.createElement('textarea', {
                    className: 'ap-modal-textarea',
                    placeholder: isReject
                        ? 'State the reason for rejection…'
                        : 'Add any notes for the next stage…',
                    value: text,
                    onChange: (e) => setText(e.target.value),
                    autoFocus: true
                })
            ),
            React.createElement('div', { className: 'ap-modal-footer' },
                React.createElement('button', { className: 'ap-modal-btn-cancel', onClick: onCancel }, 'Cancel'),
                React.createElement('button', {
                    className: `ap-modal-btn-confirm ${isReject ? 'reject' : 'approve'}`,
                    onClick: handleConfirm,
                    disabled: busy || (isReject && !text.trim())
                },
                    busy && React.createElement('div', { className: 'ap-btn-spinner' }),
                    isReject ? 'Confirm Rejection' : 'Confirm Approval'
                )
            )
        )
    );
}

// ─── Doc Card ─────────────────────────────────────────────────────────────────
function DocCard({ doc, processingId, onApprove, onReject, index }) {
    const stage = getStageInfo(doc.status);
    const isProcessing = processingId === doc.id;

    return React.createElement('div', {
        className: `ap-doc-card visible${isProcessing ? ' processing' : ''}`,
        style: { animationDelay: `${0.25 + index * 0.07}s` }
    },
        React.createElement('div', { className: `ap-stage-bar ${stage.key}` }),
        React.createElement('div', { className: 'ap-doc-body' },

            // Left
            React.createElement('div', null,
                React.createElement('div', { className: 'ap-doc-top' },
                    React.createElement('div', { className: 'ap-doc-file-icon' }, getFileIcon(doc.filename)),
                    React.createElement('div', null,
                        React.createElement('div', { className: 'ap-doc-filename' }, doc.filename || 'Unnamed Document'),
                        React.createElement('div', { className: 'ap-doc-id' }, `ID #${doc.id}`)
                    )
                ),
                React.createElement('div', { className: 'ap-doc-meta' },
                    React.createElement('div', { className: 'ap-meta-field' },
                        React.createElement('div', { className: 'ap-meta-label' }, 'Vendor'),
                        React.createElement('div', { className: 'ap-meta-value' }, doc.vendor || '—')
                    ),
                    React.createElement('div', { className: 'ap-meta-field' },
                        React.createElement('div', { className: 'ap-meta-label' }, 'Invoice #'),
                        React.createElement('div', { className: 'ap-meta-value' }, doc.invoice_number || 'N/A')
                    ),
                    React.createElement('div', { className: 'ap-meta-field' },
                        React.createElement('div', { className: 'ap-meta-label' }, 'Amount'),
                        React.createElement('div', { className: 'ap-meta-value amount' },
                            `R ${Number(doc.amount || 0).toFixed(2)}`
                        )
                    )
                )
            ),

            // Right
            React.createElement('div', { className: 'ap-doc-right' },
                React.createElement('div', { className: `ap-stage-pill ${stage.key}` },
                    React.createElement('div', { className: 'ap-pill-dot' }),
                    stage.label
                ),
                React.createElement('div', { className: 'ap-doc-actions' },
                    React.createElement('button', {
                        className: 'ap-btn ap-btn-approve',
                        onClick: () => onApprove(doc),
                        disabled: isProcessing
                    },
                        isProcessing
                            ? React.createElement('div', { className: 'ap-btn-spinner' })
                            : '✓',
                        isProcessing ? 'Processing…' : 'Approve'
                    ),
                    React.createElement('button', {
                        className: 'ap-btn ap-btn-reject',
                        onClick: () => onReject(doc),
                        disabled: isProcessing
                    },
                        isProcessing
                            ? React.createElement('div', { className: 'ap-btn-spinner' })
                            : '✕',
                        isProcessing ? 'Processing…' : 'Reject'
                    )
                )
            )
        )
    );
}

// ─── Approvals ────────────────────────────────────────────────────────────────
function Approvals() {
    const [docs, setDocs]               = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState('');
    const [processingId, setProcessingId] = useState(null);
    const [modal, setModal]             = useState(null); // { mode: 'approve'|'reject', doc }
    const [toast, setToast]             = useState(null); // { message, type }
    const [filter, setFilter]           = useState('all');

    useEffect(() => {
        injectApprovalsStyles();
        fetchApprovals();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

   const fetchApprovals = async () => {
    try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        console.log('🔍 Debug - Token:', token ? 'Present' : 'Missing');
        console.log('🔍 Debug - User ID:', userId);
        
        if (!userId) {
            setError('User ID not found. Please log out and log in again.');
            setLoading(false);
            return;
        }
        
        const response = await axios.get(`${API_BASE_URL}/pending-approvals?current_user=${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('✅ Approvals fetched:', response.data);
        setDocs(response.data);
        setLoading(false);
    } catch (err) {
        console.error('❌ Error fetching approvals:', err);
        console.error('❌ Error response:', err.response?.data);
        
        let msg = err.message;
        if (err.response?.data?.detail) {
            msg = typeof err.response.data.detail === 'string'
                ? err.response.data.detail
                : Array.isArray(err.response.data.detail)
                    ? err.response.data.detail.map(e => e.msg).join(', ')
                    : JSON.stringify(err.response.data.detail);
        }
        setError(msg);
        setLoading(false);
    }
};

    const handleApprove = async (commentText) => {
        const doc = modal.doc;
        setModal(null);
        setProcessingId(doc.id);
        try {
            const token = localStorage.getItem('token');
            let url = `${API_BASE_URL}/documents/${doc.id}/approve`;
            if (commentText) url += `?comments=${encodeURIComponent(commentText)}`;
            await axios.post(url, {}, { headers: { 'Authorization': `Bearer ${token}` } });
            setDocs(prev => prev.filter(d => d.id !== doc.id));
            showToast(`Document #${doc.id} approved successfully`, 'success');
        } catch (err) {
            let msg = 'Error approving document';
            if (err.response?.data?.detail) msg = typeof err.response.data.detail === 'string' ? err.response.data.detail : JSON.stringify(err.response.data.detail);
            showToast(msg, 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (reasonText) => {
        const doc = modal.doc;
        setModal(null);
        setProcessingId(doc.id);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_BASE_URL}/documents/${doc.id}/reject?reason=${encodeURIComponent(reasonText)}`,
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setDocs(prev => prev.filter(d => d.id !== doc.id));
            showToast(`Document #${doc.id} rejected`, 'error');
        } catch (err) {
            let msg = 'Error rejecting document';
            if (err.response?.data?.detail) msg = typeof err.response.data.detail === 'string' ? err.response.data.detail : JSON.stringify(err.response.data.detail);
            showToast(msg, 'error');
        } finally {
            setProcessingId(null);
        }
    };

    // Filter docs
    const filteredDocs = filter === 'all' ? docs : docs.filter(d => d.status === `pending_${filter}`);
    const counts = {
        review:  docs.filter(d => d.status === 'pending_review').length,
        manager: docs.filter(d => d.status === 'pending_manager').length,
        finance: docs.filter(d => d.status === 'pending_finance').length,
    };

    const skeletonCards = [1, 2, 3].map(i =>
        React.createElement('div', { key: i, className: 'ap-skeleton-card' },
            React.createElement('div', { className: 'ap-skel-line short' }),
            React.createElement('div', { className: 'ap-skel-line mid' }),
            React.createElement('div', { className: 'ap-skel-line full' }),
        )
    );

    return React.createElement('div', { className: 'ap-root' },
        // Background
        React.createElement('div', { className: 'ap-bg' },
            React.createElement('div', { className: 'ap-bg-orb ap-bg-orb-1' }),
            React.createElement('div', { className: 'ap-bg-orb ap-bg-orb-2' }),
            React.createElement('div', { className: 'ap-bg-grid' }),
        ),

        React.createElement(Navigation, null),

        React.createElement('main', { className: 'ap-page' },

            // Header
            React.createElement('header', { className: 'ap-header' },
                React.createElement('div', null,
                    React.createElement('div', { className: 'ap-eyebrow' }, 'Workflow Queue'),
                    React.createElement('h1', { className: 'ap-title' }, 'Pending Approvals')
                ),
                !loading && React.createElement('div', { className: 'ap-header-right' },
                    React.createElement('div', null,
                        React.createElement('div', { className: 'ap-count-badge' }, docs.length),
                        React.createElement('div', { className: 'ap-count-label' }, 'docs\nwaiting')
                    )
                )
            ),

            // Error
            error && React.createElement('div', { className: 'ap-error' },
                React.createElement('div', { className: 'ap-error-icon' }, '!'),
                React.createElement('div', { className: 'ap-error-text' }, error)
            ),

            // Filter bar
            !loading && docs.length > 0 && React.createElement('div', { className: 'ap-filter-bar' },
                React.createElement('div', { className: 'ap-filter-label' }, 'Filter'),
                React.createElement('button', {
                    className: `ap-filter-btn${filter === 'all' ? ' active' : ''}`,
                    onClick: () => setFilter('all')
                }, `All (${docs.length})`),
                counts.review > 0 && React.createElement('button', {
                    className: `ap-filter-btn${filter === 'review' ? ' active' : ''}`,
                    onClick: () => setFilter('review')
                }, `Stage 1 (${counts.review})`),
                counts.manager > 0 && React.createElement('button', {
                    className: `ap-filter-btn${filter === 'manager' ? ' active' : ''}`,
                    onClick: () => setFilter('manager')
                }, `Stage 2 (${counts.manager})`),
                counts.finance > 0 && React.createElement('button', {
                    className: `ap-filter-btn${filter === 'finance' ? ' active' : ''}`,
                    onClick: () => setFilter('finance')
                }, `Stage 3 (${counts.finance})`)
            ),

            // Content
            loading
                ? React.createElement('div', { className: 'ap-skeleton' }, ...skeletonCards)
                : filteredDocs.length === 0
                    ? React.createElement('div', { className: 'ap-empty' },
                        React.createElement('div', { className: 'ap-empty-icon' }, '◎'),
                        React.createElement('h2', { className: 'ap-empty-title' }, 'All clear'),
                        React.createElement('p', { className: 'ap-empty-sub' },
                            filter === 'all'
                                ? 'No documents are pending approval for your role right now.'
                                : `No documents at this stage.`
                        )
                    )
                    : React.createElement('div', { className: 'ap-list' },
                        filteredDocs.map((doc, i) =>
                            React.createElement(DocCard, {
                                key: doc.id,
                                doc,
                                processingId,
                                index: i,
                                onApprove: (d) => setModal({ mode: 'approve', doc: d }),
                                onReject:  (d) => setModal({ mode: 'reject',  doc: d })
                            })
                        )
                    )
        ),

        // Modal
        modal && React.createElement(ActionModal, {
            mode: modal.mode,
            doc: modal.doc,
            onConfirm: modal.mode === 'approve' ? handleApprove : handleReject,
            onCancel: () => setModal(null)
        }),

        // Toast
        toast && React.createElement(Toast, {
            message: toast.message,
            type: toast.type,
            onDone: () => setToast(null)
        })
    );
}

export default Approvals;