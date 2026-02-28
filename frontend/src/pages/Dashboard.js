import React, { useEffect, useState, useRef } from 'react';
import Navigation from '../components/Navigation';
import authService from '../services/auth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// API Base URL - Use environment variable with fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// ─── Inject CSS ──────────────────────────────────────────────────────────────
const injectDashboardStyles = () => {
    if (document.getElementById('dashboard-styles')) return;
    const s = document.createElement('style');
    s.id = 'dashboard-styles';
    s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&family=Inter:wght@300;400;500;600;700;800&display=swap');

    :root {
        --bg-base: #080A12;
        --bg-surface: #0D1017;
        --bg-card: #111520;
        --bg-card-hover: #161B28;
        --border: rgba(255,255,255,0.06);
        --border-bright: rgba(255,255,255,0.12);
        --gold: #E6B84A;
        --gold-dim: rgba(230,184,74,0.12);
        --gold-glow: rgba(230,184,74,0.25);
        --teal: #2DD4BF;
        --teal-dim: rgba(45,212,191,0.1);
        --red: #F87171;
        --red-dim: rgba(248,113,113,0.1);
        --blue: #60A5FA;
        --blue-dim: rgba(96,165,250,0.1);
        --green: #4ADE80;
        --green-dim: rgba(74,222,128,0.1);
        --text-1: #F0F4FF;
        --text-2: rgba(240,244,255,0.55);
        --text-3: rgba(240,244,255,0.28);
        --font-display: 'Syne', sans-serif;
        --font-body: 'DM Sans', sans-serif;
        --font-mono: 'DM Mono', monospace;
        --font-welcome: 'Inter', sans-serif;
        --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
    }

    .db-root {
        min-height: 100vh;
        background: var(--bg-base);
        font-family: var(--font-body);
        color: var(--text-1);
        overflow-x: hidden;
    }

    /* ── Background ── */
    .db-canvas {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        overflow: hidden;
    }
    .db-canvas-orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(120px);
        opacity: 0.18;
    }
    .db-canvas-orb-1 {
        width: 700px; height: 700px;
        background: radial-gradient(circle, #E6B84A, transparent 70%);
        top: -200px; right: -150px;
        animation: orbFloat1 18s ease-in-out infinite alternate;
    }
    .db-canvas-orb-2 {
        width: 500px; height: 500px;
        background: radial-gradient(circle, #2DD4BF, transparent 70%);
        bottom: -100px; left: -100px;
        animation: orbFloat2 22s ease-in-out infinite alternate;
        opacity: 0.12;
    }
    .db-canvas-grid {
        position: absolute;
        inset: 0;
        background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
        background-size: 60px 60px;
        mask-image: radial-gradient(ellipse 80% 80% at 50% 0%, black 30%, transparent 100%);
    }

    @keyframes orbFloat1 {
        from { transform: translate(0, 0) scale(1); }
        to   { transform: translate(-60px, 80px) scale(1.1); }
    }
    @keyframes orbFloat2 {
        from { transform: translate(0, 0) scale(1.05); }
        to   { transform: translate(80px, -60px) scale(0.95); }
    }

    /* ── Page Layout ── */
    .db-page {
        position: relative;
        z-index: 1;
        padding: 40px 48px 80px;
        max-width: 1400px;
        margin: 0 auto;
    }

    /* ── Hero Header ── */
    .db-hero {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: end;
        gap: 40px;
        margin-bottom: 48px;
        padding-bottom: 36px;
        border-bottom: 1px solid var(--border);
        opacity: 0;
        transform: translateY(20px);
        animation: fadeUp 0.7s var(--ease-out) 0.1s forwards;
    }
    .db-hero-eyebrow {
        font-family: var(--font-mono);
        font-size: 11px;
        font-weight: 400;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--gold);
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .db-hero-eyebrow::before {
        content: '';
        display: block;
        width: 24px; height: 1px;
        background: var(--gold);
    }
.db-hero-title {
    font-family: var(--font-display);
    font-size: clamp(32px, 4vw, 52px);
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.02em;
    margin: 0 0 10px;
    background: linear-gradient(135deg, #F0F4FF 0%, rgba(240,244,255,0.65) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    white-space: pre-line;
}
    .db-hero-sub {
        font-size: 15px;
        color: var(--text-2);
        font-weight: 300;
        letter-spacing: 0.01em;
    }
    .db-hero-meta {
        text-align: right;
    }
    .db-hero-time {
        font-family: var(--font-mono);
        font-size: 28px;
        font-weight: 300;
        color: var(--text-1);
        letter-spacing: -0.02em;
        line-height: 1;
    }
    .db-hero-date {
        font-size: 12px;
        color: var(--text-3);
        font-family: var(--font-mono);
        margin-top: 6px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    /* ── Stat Row ── */
    .db-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 32px;
    }
    .db-stat-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 22px 24px;
        position: relative;
        overflow: hidden;
        cursor: default;
        transition: border-color 0.3s, transform 0.3s var(--ease-out), box-shadow 0.3s;
        opacity: 0;
        transform: translateY(24px);
    }
    .db-stat-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }
    .db-stat-card::after {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 2px;
        border-radius: 14px 14px 0 0;
        opacity: 0;
        transition: opacity 0.3s;
    }
    .db-stat-card:hover::after { opacity: 1; }
    .db-stat-card.gold  { --card-color: var(--gold);  --card-dim: var(--gold-dim); }
    .db-stat-card.teal  { --card-color: var(--teal);  --card-dim: var(--teal-dim); }
    .db-stat-card.blue  { --card-color: var(--blue);  --card-dim: var(--blue-dim); }
    .db-stat-card.green { --card-color: var(--green); --card-dim: var(--green-dim); }
    .db-stat-card:hover { border-color: var(--card-color, var(--border-bright)); }
    .db-stat-card::after { background: var(--card-color); }

    .db-stat-label {
        font-size: 11px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--text-3);
        font-family: var(--font-mono);
        margin-bottom: 16px;
    }
    .db-stat-value {
        font-family: var(--font-display);
        font-size: 36px;
        font-weight: 700;
        color: var(--card-color, var(--text-1));
        line-height: 1;
        letter-spacing: -0.02em;
    }
    .db-stat-delta {
        margin-top: 10px;
        font-size: 12px;
        color: var(--text-3);
        font-family: var(--font-mono);
    }
    .db-stat-icon {
        position: absolute;
        top: 20px; right: 20px;
        width: 36px; height: 36px;
        background: var(--card-dim, rgba(255,255,255,0.04));
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        border: 1px solid rgba(255,255,255,0.05);
    }

    /* ── Main Grid ── */
    .db-main-grid {
        display: grid;
        grid-template-columns: 1fr 340px;
        gap: 20px;
        margin-bottom: 20px;
    }

    /* ── Permissions Card ── */
    .db-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 28px 32px;
        opacity: 0;
        transform: translateY(20px);
    }
    .db-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
    }
    .db-card-title {
        font-family: var(--font-display);
        font-size: 15px;
        font-weight: 600;
        color: var(--text-1);
        letter-spacing: 0.01em;
    }
    .db-card-label {
        font-family: var(--font-mono);
        font-size: 10px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--text-3);
        padding: 4px 10px;
        border: 1px solid var(--border);
        border-radius: 20px;
    }

    /* Permission rows */
    .db-perm-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        list-style: none;
        padding: 0;
        margin: 0;
    }
    .db-perm-item {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 13px 16px;
        border-radius: 10px;
        background: rgba(255,255,255,0.02);
        border: 1px solid transparent;
        transition: background 0.2s, border-color 0.2s;
    }
    .db-perm-item:hover { background: rgba(255,255,255,0.04); border-color: var(--border); }
    .db-perm-dot {
        width: 7px; height: 7px;
        border-radius: 50%;
        flex-shrink: 0;
    }
    .db-perm-dot.yes { background: var(--green); box-shadow: 0 0 8px rgba(74,222,128,0.5); }
    .db-perm-dot.no  { background: var(--red-dim); border: 1px solid var(--red); }
    .db-perm-text {
        font-size: 13.5px;
        color: var(--text-2);
        font-weight: 400;
    }
    .db-perm-text.yes { color: var(--text-1); }
    .db-perm-badge-yes {
        margin-left: auto;
        font-family: var(--font-mono);
        font-size: 10px;
        padding: 2px 8px;
        border-radius: 4px;
        background: var(--green-dim);
        color: var(--green);
        border: 1px solid rgba(74,222,128,0.2);
        letter-spacing: 0.05em;
    }

    /* ── Role Profile Card ── */
    .db-role-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 28px;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .db-role-avatar {
        width: 72px; height: 72px;
        border-radius: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-display);
        font-size: 26px;
        font-weight: 800;
    }

    .db-role-name {
        font-family: var(--font-display);
        font-size: 22px;
        font-weight: 700;
        margin: 0 0 2px;
        letter-spacing: -0.01em;
    }
    .db-role-title {
        font-size: 13px;
        color: var(--text-3);
        font-weight: 300;
    }
    .db-role-divider {
        height: 1px;
        background: var(--border);
    }
    .db-role-access-label {
        font-family: var(--font-mono);
        font-size: 10px;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: var(--text-3);
        margin-bottom: 12px;
    }
    .db-access-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
    }
    .db-access-item {
        padding: 10px 12px;
        border-radius: 8px;
        font-size: 12px;
        font-family: var(--font-mono);
        border: 1px solid var(--border);
        text-align: center;
        letter-spacing: 0.03em;
    }
    .db-access-item.on {
        background: var(--gold-dim);
        border-color: rgba(230,184,74,0.2);
        color: var(--gold);
    }
    .db-access-item.off {
        background: transparent;
        color: var(--text-3);
        text-decoration: line-through;
    }

    /* ── Actions Row ── */
    .db-actions-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
    }

    .db-action-btn {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 24px 28px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 18px;
        transition: all 0.3s var(--ease-out);
        text-align: left;
        position: relative;
        overflow: hidden;
        opacity: 0;
        transform: translateY(20px);
    }
    .db-action-btn::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, var(--btn-color-dim, rgba(255,255,255,0.03)), transparent);
        opacity: 0;
        transition: opacity 0.3s;
    }
    .db-action-btn:hover {
        border-color: var(--btn-color, var(--border-bright));
        transform: translateY(-4px);
        box-shadow: 0 24px 64px rgba(0,0,0,0.5);
    }
    .db-action-btn:hover::before { opacity: 1; }

    .db-action-btn.gold  { --btn-color: var(--gold);  --btn-color-dim: var(--gold-dim); }
    .db-action-btn.teal  { --btn-color: var(--teal);  --btn-color-dim: var(--teal-dim); }
    .db-action-btn.blue  { --btn-color: var(--blue);  --btn-color-dim: var(--blue-dim); }

    .db-action-icon-wrap {
        width: 48px; height: 48px;
        border-radius: 12px;
        background: var(--btn-color-dim, rgba(255,255,255,0.04));
        border: 1px solid rgba(255,255,255,0.06);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        flex-shrink: 0;
        transition: transform 0.3s var(--ease-out);
    }
    .db-action-btn:hover .db-action-icon-wrap {
        transform: scale(1.1) rotate(-5deg);
    }
    .db-action-label {
        font-family: var(--font-display);
        font-size: 15px;
        font-weight: 600;
        color: var(--text-1);
        margin-bottom: 3px;
    }
    .db-action-sub {
        font-size: 12px;
        color: var(--text-3);
        font-weight: 300;
    }
    .db-action-arrow {
        margin-left: auto;
        color: var(--text-3);
        font-size: 18px;
        transition: transform 0.3s, color 0.3s;
        flex-shrink: 0;
    }
    .db-action-btn:hover .db-action-arrow {
        transform: translateX(4px);
        color: var(--btn-color);
    }

    /* ── Activity Feed with Animation ── */
    .db-activity-strip {
        margin-top: 20px;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 16px 24px;
        display: flex;
        align-items: center;
        gap: 20px;
        opacity: 0;
        overflow: hidden;
        position: relative;
    }
    .db-activity-label {
        font-family: var(--font-mono);
        font-size: 10px;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: var(--text-3);
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 2;
    }
    .db-pulse-dot {
        width: 6px; height: 6px;
        border-radius: 50%;
        background: var(--green);
        box-shadow: 0 0 0 0 rgba(74,222,128,0.4);
        animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.4); }
        50%       { box-shadow: 0 0 0 6px rgba(74,222,128,0); }
    }

    /* Live Animated Feed Container */
    .db-activity-feed-container {
        flex: 1;
        overflow: hidden;
        position: relative;
        height: 40px;
    }
    .db-activity-feed {
        display: flex;
        gap: 20px;
        position: absolute;
        white-space: nowrap;
        animation: scrollFeed 30s linear infinite;
    }
    .db-activity-feed:hover {
        animation-play-state: paused;
    }
    @keyframes scrollFeed {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
    }

    .db-activity-item {
        font-size: 12px;
        color: var(--text-3);
        font-family: var(--font-mono);
        padding: 8px 16px;
        border-radius: 30px;
        background: rgba(255,255,255,0.03);
        border: 1px solid var(--border);
        display: inline-flex;
        align-items: center;
        gap: 8px;
        backdrop-filter: blur(5px);
        transition: all 0.2s ease;
    }
    .db-activity-item:hover {
        border-color: var(--gold);
        background: var(--gold-dim);
        transform: translateY(-2px);
    }
    .db-activity-item span {
        color: var(--gold);
        font-weight: 500;
    }
    .db-activity-vendor {
        color: var(--text-2);
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .db-activity-amount {
        color: var(--green);
        font-weight: 500;
    }
    .db-activity-time {
        color: var(--text-3);
        font-size: 10px;
    }

    /* Gradient overlays for feed */
    .db-activity-strip::before,
    .db-activity-strip::after {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        width: 60px;
        pointer-events: none;
        z-index: 2;
    }
    .db-activity-strip::before {
        left: 120px;
        background: linear-gradient(90deg, var(--bg-card), transparent);
    }
    .db-activity-strip::after {
        right: 0;
        background: linear-gradient(-90deg, var(--bg-card), transparent);
    }

    /* ── Animations ── */
    @keyframes fadeUp {
        to { opacity: 1; transform: translateY(0); }
    }
    .anim-1 { animation: fadeUp 0.7s var(--ease-out) 0.15s forwards; }
    .anim-2 { animation: fadeUp 0.7s var(--ease-out) 0.25s forwards; }
    .anim-3 { animation: fadeUp 0.7s var(--ease-out) 0.35s forwards; }
    .anim-4 { animation: fadeUp 0.7s var(--ease-out) 0.45s forwards; }
    .anim-5 { animation: fadeUp 0.7s var(--ease-out) 0.55s forwards; }
    .anim-6 { animation: fadeUp 0.7s var(--ease-out) 0.65s forwards; }

    /* Loading */
    .db-loading {
        min-height: 100vh;
        background: var(--bg-base);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--text-3);
        letter-spacing: 0.2em;
    }

    @media (max-width: 1100px) {
        .db-main-grid { grid-template-columns: 1fr; }
        .db-stats { grid-template-columns: repeat(2, 1fr); }
        .db-actions-row { grid-template-columns: 1fr; }
        .db-page { padding: 24px 20px 60px; }
    }
    `;
    document.head.appendChild(s);
};

// ─── Role config (keep this as is - it's just for display) ───────────────────
const ROLE_CONFIG = {
    admin: {
        color: '#F87171', dim: 'rgba(248,113,113,0.12)', title: 'System Administrator',
        initials: 'AD', avatar_bg: 'linear-gradient(135deg, #7f1d1d, #dc2626)',
        permissions: [
            { text: 'Upload & manage documents', yes: true },
            { text: 'Full approval authority', yes: false },
            { text: 'Access all reports', yes: true },
            { text: 'User & system administration', yes: true },
            { text: 'AI insights & analytics', yes: true },
        ],
        access: ['Upload', 'Reports', 'Admin', 'Insights'],
        blocked: ['Final Approval'],
    },
    reviewer: {
        color: '#E6B84A', dim: 'rgba(230,184,74,0.12)', title: 'Document Reviewer',
        initials: 'RV', avatar_bg: 'linear-gradient(135deg, #78350f, #d97706)',
        permissions: [
            { text: 'Upload documents to system', yes: true },
            { text: 'Stage 1 approval authority', yes: true },
            { text: 'View all reports', yes: true },
            { text: 'AI insights & analytics', yes: true },
            { text: 'Final approval authority', yes: false },
        ],
        access: ['Upload', 'Stage 1', 'Reports', 'Insights'],
        blocked: ['Final Approval', 'Admin'],
    },
    manager: {
        color: '#60A5FA', dim: 'rgba(96,165,250,0.12)', title: 'Operations Manager',
        initials: 'MG', avatar_bg: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
        permissions: [
            { text: 'Stage 2 approval authority', yes: true },
            { text: 'View all reports', yes: true },
            { text: 'AI insights & analytics', yes: true },
            { text: 'Upload documents', yes: false },
            { text: 'Final financial approval', yes: false },
        ],
        access: ['Stage 2', 'Reports', 'Insights'],
        blocked: ['Upload', 'Final Approval', 'Admin'],
    },
    finance: {
        color: '#4ADE80', dim: 'rgba(74,222,128,0.12)', title: 'Finance Controller',
        initials: 'FC', avatar_bg: 'linear-gradient(135deg, #14532d, #16a34a)',
        permissions: [
            { text: 'Stage 3 approval authority', yes: true },
            { text: 'View all reports', yes: true },
            { text: 'AI insights & analytics', yes: true },
            { text: 'Upload documents', yes: false },
            { text: 'Final financial approval', yes: true },
        ],
        access: ['Stage 3', 'Final Approval', 'Reports', 'Insights'],
        blocked: ['Upload', 'Admin'],
    },
    viewer: {
        color: '#94A3B8', dim: 'rgba(148,163,184,0.12)', title: 'Read-Only Viewer',
        initials: 'VW', avatar_bg: 'linear-gradient(135deg, #1e293b, #475569)',
        permissions: [
            { text: 'View reports & dashboards', yes: true },
            { text: 'AI insights & analytics', yes: true },
            { text: 'Upload documents', yes: false },
            { text: 'Approve documents', yes: false },
            { text: 'Administrative access', yes: false },
        ],
        access: ['Reports', 'Insights'],
        blocked: ['Upload', 'Approvals', 'Admin'],
    },
};

// ─── REAL API SERVICE ─────────────────────────────────────────────────────────
const dashboardService = {
    // Get real stats from database
    getStats: async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/documents`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const docs = response.data;
            
            // Calculate real stats with proper rounding to 2 decimal places
            const totalInvoices = docs.length;
            const pendingReview = docs.filter(d => d.status === 'pending_review').length;
            const pendingManager = docs.filter(d => d.status === 'pending_manager').length;
            const pendingFinance = docs.filter(d => d.status === 'pending_finance').length;
            const approved = docs.filter(d => d.status === 'approved').length;
            const rejected = docs.filter(d => d.status === 'rejected').length;
            
            // Calculate total value with rounding to avoid floating point issues
            const totalValue = Math.round(docs.reduce((sum, d) => sum + (d.amount || 0), 0) * 100) / 100;
            const pendingValue = Math.round(docs.filter(d => ['pending_review', 'pending_manager', 'pending_finance'].includes(d.status))
                .reduce((sum, d) => sum + (d.amount || 0), 0) * 100) / 100;
            const approvedValue = Math.round(docs.filter(d => d.status === 'approved')
                .reduce((sum, d) => sum + (d.amount || 0), 0) * 100) / 100;
            
            // Format for display with proper rounding
            const formatCurrency = (val) => {
                // Round to 2 decimal places first
                const rounded = Math.round(val * 100) / 100;
                if (rounded >= 1000000) return `R${(rounded/1000000).toFixed(1)}M`;
                if (rounded >= 1000) return `R${(rounded/1000).toFixed(1)}K`;
                return `R${rounded.toFixed(2)}`;
            };
            
            return {
                totalInvoices,
                pendingReview: pendingReview + pendingManager + pendingFinance,
                approved,
                rejected,
                // Raw numbers for counters (now properly rounded)
                totalValue,
                pendingValue,
                approvedValue,
                // Formatted strings for display
                totalValueFormatted: formatCurrency(totalValue),
                pendingValueFormatted: formatCurrency(pendingValue),
                approvedValueFormatted: formatCurrency(approvedValue),
            };
        } catch (error) {
            console.error('Error fetching stats:', error);
            return {
                totalInvoices: 0,
                pendingReview: 0,
                approved: 0,
                rejected: 0,
                totalValue: 0,
                pendingValue: 0,
                approvedValue: 0,
                totalValueFormatted: 'R0',
                pendingValueFormatted: 'R0',
                approvedValueFormatted: 'R0',
            };
        }
    },

    // Get recent activity for animated feed
    getRecentActivity: async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/documents`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const docs = response.data;
            
            // Sort by upload date (newest first) and take last 15
            return docs
                .sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date))
                .slice(0, 15)
                .map(doc => ({
                    id: doc.invoice_number || doc.filename.substring(0, 8),
                    vendor: doc.vendor || 'Unknown',
                    amount: Math.round((doc.amount || 0) * 100) / 100, // Round amount
                    action: doc.status === 'approved' ? 'approved' : 
                           doc.status === 'rejected' ? 'rejected' : 
                           doc.status.includes('pending') ? 'pending' : 
                           'uploaded',
                    timestamp: new Date(doc.upload_date),
                    timeAgo: formatRelativeTime(new Date(doc.upload_date + 'Z')) 
                }));
        } catch (error) {
            console.error('Error fetching activity:', error);
            return [];
        }
    },

    // Get pending approvals count for the current user
    getPendingCount: async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/pending-approvals`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data.length;
        } catch (error) {
            console.error('Error fetching pending count:', error);
            return 0;
        }
    },

    // Poll for new activity (optional - can be used for real-time updates)
    pollForUpdates: (callback, interval = 10000) => {
        const poll = async () => {
            try {
                const activity = await dashboardService.getRecentActivity();
                callback(activity);
            } catch (error) {
                console.error('Polling error:', error);
            }
        };
        
        poll(); // Initial call
        const intervalId = setInterval(poll, interval);
        return () => clearInterval(intervalId);
    }
};

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimCounter({ target, duration = 1200, prefix = '', suffix = '', formatCurrency = false }) {
    const [val, setVal] = useState(0);
    const ref = useRef(null);
    
    useEffect(() => {
        // Ensure target is a number
        const numTarget = typeof target === 'string' ? parseFloat(target.replace(/[^0-9.]/g, '')) : target;
        // If it's NaN, use 0
        const safeTarget = isNaN(numTarget) ? 0 : numTarget;
        const start = performance.now();
        
        const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 4);
            const current = safeTarget * ease;
            
            if (formatCurrency) {
                if (current >= 1000000) {
                    setVal(`R${(current/1000000).toFixed(1)}M`);
                } else if (current >= 1000) {
                    setVal(`R${(current/1000).toFixed(1)}K`);
                } else {
                    setVal(`R${Math.round(current)}`);
                }
            } else {
                setVal(Math.round(current));
            }
            
            if (progress < 1) {
                ref.current = requestAnimationFrame(tick);
            }
        };
        
        ref.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(ref.current);
    }, [target, duration, formatCurrency]);
    
    if (formatCurrency) {
        return <>{val}{suffix}</>;
    }
    return <>{prefix}{val}{suffix}</>;
}

// ─── Live Clock ───────────────────────────────────────────────────────────────
function useLiveClock() {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const id = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(id);
    }, []);
    const h = String(time.getHours()).padStart(2,'0');
    const m = String(time.getMinutes()).padStart(2,'0');
    const s = String(time.getSeconds()).padStart(2,'0');
    const date = time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
    return { clock: `${h}:${m}:${s}`, date };
}

// ─── Format relative time ────────────────────────────────────────────────────
function formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

// ─── Helper to format numbers for display ────────────────────────────────────
const formatNumber = (num) => {
    if (typeof num !== 'number') return num;
    // If it has decimals, round to 2
    if (num.toString().includes('.')) {
        return num.toFixed(2);
    }
    return num.toString();
};

// ─── Dashboard Component ─────────────────────────────────────────────────────
export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { clock, date } = useLiveClock();

    useEffect(() => {
        injectDashboardStyles();
        const u = authService.getCurrentUser();
        setUser(u);
        
        if (!authService.isAuthenticated()) {
            navigate('/');
            return;
        }

        // Load REAL data from API
        const loadDashboardData = async () => {
            try {
                const [statsData, activityData, pending] = await Promise.all([
                    dashboardService.getStats(),
                    dashboardService.getRecentActivity(),
                    dashboardService.getPendingCount()
                ]);
                
                setStats(statsData);
                setActivity(activityData);
                setPendingCount(pending);
            } catch (error) {
                console.error('Error loading dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
        
        // Optional: Set up polling for real-time updates
        const cleanup = dashboardService.pollForUpdates((newActivity) => {
            setActivity(newActivity);
        }, 15000); // Poll every 15 seconds
        
        return cleanup;
    }, [navigate]);

    if (loading || !user || !stats) {
        return <div className="db-loading">LOADING DASHBOARD...</div>;
    }

    const role = ROLE_CONFIG[user.role] || ROLE_CONFIG.viewer;
    const canUpload = ['admin', 'reviewer'].includes(user.role);
    const canApprove = ['reviewer', 'manager', 'finance'].includes(user.role);

    // FIXED: Using formatted values for deltas to avoid floating point issues
    const statCards = [
        { 
            label: 'Total Invoices', 
            value: stats.totalInvoices, 
            delta: `${Math.round((stats.approved/stats.totalInvoices)*100) || 0}% approved`, 
            color: 'gold', 
            icon: '◈' 
        },
        { 
            label: 'Pending Review', 
            value: stats.pendingReview, 
            delta: `${stats.pendingValueFormatted} to process`, 
            color: 'teal', 
            icon: '◎' 
        },
        { 
            label: 'Approved', 
            value: stats.approved, 
            // FIXED: Using the formatted value instead of raw number
            delta: `${stats.approvedValueFormatted} approved`, 
            color: 'green', 
            icon: '✓' 
        },
        { 
            label: 'Total Value', 
            value: stats.totalValue, 
            delta: 'Total invoice value', 
            color: 'blue', 
            icon: 'R',
            formatCurrency: true 
        },
    ];

    const actionBtns = [
        canUpload && { 
            label: 'Upload Document', 
            sub: 'Submit a new invoice for review', 
            icon: '↑', 
            color: 'gold', 
            path: '/upload' 
        },
        canApprove && { 
            label: 'Pending Approvals', 
            sub: `${pendingCount} item${pendingCount !== 1 ? 's' : ''} awaiting action`, 
            icon: '◎', 
            color: 'teal', 
            path: '/approvals' 
        },
        { 
            label: 'View Reports', 
            sub: 'Analytics, exports & summaries', 
            icon: '≡', 
            color: 'blue', 
            path: '/reports' 
        },
    ].filter(Boolean);

    // Duplicate activity items for seamless infinite scroll
    const displayActivity = activity.length > 0 ? [...activity, ...activity] : [];

    return (
        <div className="db-root">
            {/* Background */}
            <div className="db-canvas">
                <div className="db-canvas-orb db-canvas-orb-1"></div>
                <div className="db-canvas-orb db-canvas-orb-2"></div>
                <div className="db-canvas-grid"></div>
            </div>

            <Navigation />

            <main className="db-page">
                {/* Hero */}
                <header className="db-hero">
                    <div>
                        <div className="db-hero-eyebrow">Session active — {user.role}</div>
                        <h1 className="db-hero-title">Welcome back,{'\n'}{user.username}.</h1>
                        <p className="db-hero-sub">Here's what's happening across your invoice pipeline today.</p>
                    </div>
                    <div className="db-hero-meta">
                        <div className="db-hero-time">{clock}</div>
                        <div className="db-hero-date">{date}</div>
                    </div>
                </header>

                {/* Stats */}
                <div className="db-stats">
                    {statCards.map((c, i) => (
                        <div
                            key={c.label}
                            className={`db-stat-card ${c.color} anim-${i + 1}`}
                        >
                            <div className="db-stat-icon">{c.icon}</div>
                            <div className="db-stat-label">{c.label}</div>
                            <div className="db-stat-value">
                                {c.formatCurrency ? (
                                    <AnimCounter 
                                        target={c.value} 
                                        duration={1000 + i * 200}
                                        formatCurrency={true} 
                                    />
                                ) : (
                                    <AnimCounter 
                                        target={c.value} 
                                        duration={1000 + i * 200} 
                                    />
                                )}
                            </div>
                            <div className="db-stat-delta">{c.delta}</div>
                        </div>
                    ))}
                </div>

                {/* Main Grid */}
                <div className="db-main-grid">
                    {/* Permissions */}
                    <div className="db-card anim-5">
                        <div className="db-card-header">
                            <div className="db-card-title">Access & Permissions</div>
                            <div className="db-card-label">Role: {user.role}</div>
                        </div>
                        <ul className="db-perm-list">
                            {role.permissions.map((p, i) => (
                                <li key={i} className="db-perm-item">
                                    <div className={`db-perm-dot ${p.yes ? 'yes' : 'no'}`}></div>
                                    <span className={`db-perm-text ${p.yes ? 'yes' : ''}`}>{p.text}</span>
                                    {p.yes && <span className="db-perm-badge-yes">GRANTED</span>}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Role Profile */}
                    <div className="db-role-card anim-5">
                        <div>
                            <div
                                className="db-role-avatar"
                                style={{
                                    background: role.avatar_bg,
                                    color: role.color,
                                    border: `1px solid ${role.dim}`,
                                    boxShadow: `0 0 32px ${role.dim}`,
                                }}
                            >
                                {role.initials}
                            </div>
                        </div>
                        <div>
                            <div className="db-role-name" style={{ color: role.color }}>{user.username}</div>
                            <div className="db-role-title">{role.title}</div>
                        </div>
                        <div className="db-role-divider"></div>
                        <div>
                            <div className="db-role-access-label">Module Access</div>
                            <div className="db-access-grid">
                                {role.access.map(a => (
                                    <div key={a} className="db-access-item on">{a}</div>
                                ))}
                                {role.blocked.map(a => (
                                    <div key={a} className="db-access-item off">{a}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="db-actions-row">
                    {actionBtns.map((btn, i) => (
                        <button
                            key={btn.label}
                            className={`db-action-btn ${btn.color} anim-${Math.min(i + 5, 6)}`}
                            onClick={() => navigate(btn.path)}
                        >
                            <div className="db-action-icon-wrap">{btn.icon}</div>
                            <div>
                                <div className="db-action-label">{btn.label}</div>
                                <div className="db-action-sub">{btn.sub}</div>
                            </div>
                            <span className="db-action-arrow">→</span>
                        </button>
                    ))}
                </div>

                {/* Live Animated Activity Feed */}
                <div className="db-activity-strip anim-6">
                    <div className="db-activity-label">
                        <div className="db-pulse-dot"></div>
                        LIVE FEED
                    </div>
                    <div className="db-activity-feed-container">
                        {displayActivity.length > 0 ? (
                            <div className="db-activity-feed">
                                {displayActivity.map((item, index) => (
                                    <div key={index} className="db-activity-item">
                                        <span>{item.id}</span>
                                        <span className="db-activity-vendor">{item.vendor}</span>
                                        <span className="db-activity-amount">
                                            R{item.amount >= 1000 
                                                ? `${(item.amount/1000).toFixed(1)}K` 
                                                : item.amount.toFixed(2)}
                                        </span>
                                        <span className="db-activity-time">{item.timeAgo}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="db-activity-item">
                                <span>SYSTEM</span> No recent activity
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}