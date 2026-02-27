import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Navigation from '../components/Navigation';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// API Base URL - Use environment variable with fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

ChartJS.register(
    CategoryScale, LinearScale, BarElement,
    Title, Tooltip, Legend,
    ArcElement, PointElement, LineElement
);

// ─── Inject Styles ────────────────────────────────────────────────────────────
const injectInsightsStyles = () => {
    if (document.getElementById('insights-styles')) return;
    const s = document.createElement('style');
    s.id = 'insights-styles';
    s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

    :root {
        --bg-base:        #080A12;
        --bg-card:         #111520;
        --bg-card-2:       #0D1017;
        --bg-card-hover:   #161B28;
        --border:          rgba(255,255,255,0.06);
        --border-bright:   rgba(255,255,255,0.13);
        --gold:            #E6B84A;
        --gold-dim:        rgba(230,184,74,0.10);
        --gold-glow:       rgba(230,184,74,0.22);
        --teal:            #2DD4BF;
        --teal-dim:        rgba(45,212,191,0.08);
        --red:             #F87171;
        --red-dim:         rgba(248,113,113,0.10);
        --blue:            #60A5FA;
        --blue-dim:        rgba(96,165,250,0.10);
        --green:           #4ADE80;
        --green-dim:       rgba(74,222,128,0.10);
        --violet:          #A78BFA;
        --violet-dim:      rgba(167,139,250,0.10);
        --amber:           #FB923C;
        --amber-dim:       rgba(251,146,60,0.10);
        --text-1:          #F0F4FF;
        --text-2:          rgba(240,244,255,0.55);
        --text-3:          rgba(240,244,255,0.28);
        --ease-out:        cubic-bezier(0.22, 1, 0.36, 1);
        --font-display:    'Syne', sans-serif;
        --font-body:       'DM Sans', sans-serif;
        --font-mono:       'DM Mono', monospace;
    }

    .in-root {
        min-height: 100vh;
        background: var(--bg-base);
        font-family: var(--font-body);
        color: var(--text-1);
        overflow-x: hidden;
    }

    /* ── Background ── */
    .in-bg {
        position: fixed; inset: 0;
        pointer-events: none; z-index: 0; overflow: hidden;
    }
    .in-bg-orb {
        position: absolute; border-radius: 50%; filter: blur(130px);
    }
    .in-bg-orb-1 {
        width: 600px; height: 600px;
        background: radial-gradient(circle, #A78BFA, transparent 70%);
        top: -180px; right: -80px; opacity: 0.08;
        animation: inOrb1 20s ease-in-out infinite alternate;
    }
    .in-bg-orb-2 {
        width: 500px; height: 500px;
        background: radial-gradient(circle, #2DD4BF, transparent 70%);
        bottom: 0; left: -120px; opacity: 0.09;
        animation: inOrb2 24s ease-in-out infinite alternate;
    }
    .in-bg-orb-3 {
        width: 340px; height: 340px;
        background: radial-gradient(circle, #E6B84A, transparent 70%);
        top: 40%; left: 40%; opacity: 0.06;
        animation: inOrb3 18s ease-in-out infinite alternate;
    }
    .in-bg-grid {
        position: absolute; inset: 0;
        background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
        background-size: 56px 56px;
        mask-image: radial-gradient(ellipse 90% 70% at 60% 10%, black 10%, transparent 100%);
    }
    @keyframes inOrb1 { from { transform: translate(0,0) scale(1); } to { transform: translate(-50px,70px) scale(1.1); } }
    @keyframes inOrb2 { from { transform: translate(0,0) scale(1); } to { transform: translate(60px,-50px) scale(0.92); } }
    @keyframes inOrb3 { from { transform: translate(0,0); } to { transform: translate(-40px,40px); } }

    /* ── Page ── */
    .in-page {
        position: relative; z-index: 1;
        max-width: 1200px;
        margin: 0 auto;
        padding: 48px 40px 100px;
    }

    /* ── Header ── */
    .in-header {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: end;
        gap: 24px;
        margin-bottom: 36px;
        padding-bottom: 32px;
        border-bottom: 1px solid var(--border);
        opacity: 0; transform: translateY(16px);
        animation: inFadeUp 0.65s var(--ease-out) 0.1s forwards;
    }
    .in-eyebrow {
        font-family: var(--font-mono);
        font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
        color: var(--violet);
        display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
    }
    .in-eyebrow::before {
        content: ''; display: block;
        width: 22px; height: 1px; background: var(--violet);
    }
    .in-title {
        font-family: var(--font-display);
        font-size: clamp(26px, 3vw, 42px);
        font-weight: 800; letter-spacing: -0.02em; line-height: 1.06; margin: 0;
        background: linear-gradient(135deg, #F0F4FF 0%, rgba(240,244,255,0.6) 100%);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }

    /* ── Date Filter ── */
    .in-filter {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 20px 24px;
        display: flex;
        align-items: center;
        gap: 20px;
        flex-wrap: wrap;
        margin-bottom: 28px;
        opacity: 0; transform: translateY(14px);
        animation: inFadeUp 0.6s var(--ease-out) 0.2s forwards;
        position: relative;
        overflow: hidden;
    }
    .in-filter::before {
        content: '';
        position: absolute; top: 0; left: 0; right: 0; height: 1px;
        background: linear-gradient(90deg, transparent, var(--violet-dim), transparent);
    }
    .in-filter-label {
        font-family: var(--font-mono);
        font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase;
        color: var(--text-3); flex-shrink: 0;
    }
    .in-filter-group {
        display: flex; align-items: center; gap: 10px;
    }
    .in-date-label {
        font-family: var(--font-mono);
        font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
        color: var(--text-3); white-space: nowrap;
    }
    .in-date-input {
        background: rgba(255,255,255,0.04);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 8px 12px;
        font-family: var(--font-mono);
        font-size: 12px; color: var(--text-1);
        outline: none; transition: border-color 0.2s;
        color-scheme: dark;
    }
    .in-date-input:focus { border-color: var(--border-bright); }
    .in-filter-btn {
        padding: 9px 20px;
        background: var(--violet-dim);
        border: 1px solid rgba(167,139,250,0.22);
        border-radius: 8px;
        font-family: var(--font-body);
        font-size: 13px; font-weight: 500;
        color: var(--violet); cursor: pointer;
        transition: all 0.25s var(--ease-out);
        display: flex; align-items: center; gap: 7px;
        white-space: nowrap;
    }
    .in-filter-btn:hover {
        background: rgba(167,139,250,0.16);
        border-color: rgba(167,139,250,0.38);
        box-shadow: 0 6px 20px rgba(167,139,250,0.14);
        transform: translateY(-1px);
    }
    .in-filter-btn:disabled {
        opacity: 0.5; cursor: wait; transform: none;
    }
    .in-filter-spinner {
        width: 12px; height: 12px; border-radius: 50%;
        border: 2px solid transparent;
        border-top-color: currentColor;
        animation: inSpin 0.7s linear infinite;
    }

    /* ── Clear Filter Button ── */
    .in-clear-btn {
        padding: 9px 16px;
        background: transparent;
        border: 1px solid var(--border);
        border-radius: 8px;
        font-family: var(--font-body);
        font-size: 13px; font-weight: 500;
        color: var(--text-2);
        cursor: pointer;
        transition: all 0.2s var(--ease-out);
        margin-left: auto;
    }
    .in-clear-btn:hover {
        border-color: var(--border-bright);
        color: var(--text-1);
        background: rgba(255,255,255,0.02);
    }

    /* ── Error ── */
    .in-error {
        background: var(--red-dim);
        border: 1px solid rgba(248,113,113,0.2);
        border-radius: 12px;
        padding: 14px 20px;
        display: flex; align-items: center; gap: 12px;
        margin-bottom: 24px; font-size: 13px; color: var(--red);
        font-family: var(--font-mono); letter-spacing: 0.02em;
    }

    /* ── Stat grid ── */
    .in-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 14px;
        margin-bottom: 24px;
        opacity: 0; transform: translateY(14px);
        animation: inFadeUp 0.65s var(--ease-out) 0.3s forwards;
    }
    .in-stat-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 20px 22px;
        position: relative; overflow: hidden;
        transition: border-color 0.3s, transform 0.3s var(--ease-out), box-shadow 0.3s;
        cursor: default;
    }
    .in-stat-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 16px 48px rgba(0,0,0,0.4);
    }
    .in-stat-card::after {
        content: ''; position: absolute;
        top: 0; left: 0; right: 0; height: 2px;
        border-radius: 14px 14px 0 0;
        opacity: 0; transition: opacity 0.3s;
        background: var(--stat-color);
    }
    .in-stat-card:hover { border-color: var(--stat-color); }
    .in-stat-card:hover::after { opacity: 1; }

    .in-stat-label {
        font-family: var(--font-mono);
        font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase;
        color: var(--text-3); margin-bottom: 14px;
    }
    .in-stat-value {
        font-family: var(--font-display);
        font-size: 28px; font-weight: 700; line-height: 1;
        letter-spacing: -0.02em;
        color: var(--stat-color);
    }
    .in-stat-sub {
        margin-top: 8px;
        font-family: var(--font-mono);
        font-size: 10px; color: var(--text-3);
        letter-spacing: 0.04em;
    }
    .in-stat-icon {
        position: absolute; top: 18px; right: 18px;
        width: 32px; height: 32px; border-radius: 8px;
        background: rgba(255,255,255,0.03);
        border: 1px solid var(--border);
        display: flex; align-items: center; justify-content: center;
        font-size: 14px; color: var(--stat-color);
        font-family: var(--font-mono);
    }

    /* ── Chart grid ── */
    .in-charts-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 20px;
        opacity: 0; transform: translateY(14px);
        animation: inFadeUp 0.65s var(--ease-out) 0.4s forwards;
    }

    /* ── Chart card ── */
    .in-chart-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 16px;
        overflow: hidden;
        transition: border-color 0.25s;
    }
    .in-chart-card:hover { border-color: var(--border-bright); }
    .in-chart-card.full { grid-column: 1 / -1; }

    .in-card-header {
        padding: 20px 24px 0;
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: 4px;
    }
    .in-card-title {
        font-family: var(--font-display);
        font-size: 14px; font-weight: 600;
        color: var(--text-1); letter-spacing: 0.01em;
    }
    .in-card-badge {
        font-family: var(--font-mono);
        font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
        padding: 3px 10px; border-radius: 20px;
    }
    .in-card-badge.violet { background: var(--violet-dim); color: var(--violet); border: 1px solid rgba(167,139,250,0.2); }
    .in-card-badge.teal   { background: var(--teal-dim);   color: var(--teal);   border: 1px solid rgba(45,212,191,0.2); }
    .in-card-badge.amber  { background: var(--amber-dim);  color: var(--amber);  border: 1px solid rgba(251,146,60,0.2); }
    .in-card-badge.gold   { background: var(--gold-dim);   color: var(--gold);   border: 1px solid rgba(230,184,74,0.2); }

    .in-card-sub {
        padding: 4px 24px 16px;
        font-family: var(--font-mono);
        font-size: 11px; color: var(--text-3); letter-spacing: 0.04em;
    }
    .in-chart-wrap {
        padding: 0 20px 20px;
        position: relative;
    }

    /* ── Vendor table ── */
    .in-vendor-table-wrap {
        padding: 0 24px 24px;
    }
    .in-table {
        width: 100%; border-collapse: collapse;
    }
    .in-table thead tr {
        border-bottom: 1px solid var(--border);
    }
    .in-table thead th {
        font-family: var(--font-mono);
        font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
        color: var(--text-3);
        padding: 8px 10px; text-align: left;
        font-weight: 400;
    }
    .in-table thead th:not(:first-child) { text-align: right; }
    .in-table tbody tr {
        border-bottom: 1px solid var(--border);
        transition: background 0.15s;
    }
    .in-table tbody tr:last-child { border-bottom: none; }
    .in-table tbody tr:hover { background: rgba(255,255,255,0.02); }
    .in-table td {
        padding: 11px 10px;
        font-size: 13px; color: var(--text-2);
    }
    .in-table td:first-child { color: var(--text-1); font-weight: 500; }
    .in-table td:not(:first-child) { text-align: right; font-family: var(--font-mono); font-size: 12px; }
    .in-table td.amount { color: var(--green); font-weight: 500; }

    .in-table-rank {
        display: inline-flex;
        align-items: center; justify-content: center;
        width: 20px; height: 20px; border-radius: 6px;
        font-family: var(--font-mono);
        font-size: 10px; font-weight: 500;
        background: rgba(255,255,255,0.04);
        border: 1px solid var(--border);
        color: var(--text-3);
        margin-right: 10px;
    }
    .in-table-rank.top { background: var(--gold-dim); border-color: rgba(230,184,74,0.2); color: var(--gold); }

    .in-pct-bar-wrap { display: flex; align-items: center; gap: 10px; justify-content: flex-end; }
    .in-pct-bar-bg {
        width: 60px; height: 4px;
        background: rgba(255,255,255,0.05);
        border-radius: 4px; overflow: hidden; flex-shrink: 0;
    }
    .in-pct-bar-fill {
        height: 100%; border-radius: 4px;
        background: linear-gradient(90deg, var(--teal), var(--violet));
        transition: width 0.8s var(--ease-out);
    }

    /* ── Anomalies ── */
    .in-anomalies {
        background: var(--bg-card);
        border: 1px solid rgba(251,146,60,0.18);
        border-radius: 16px; overflow: hidden;
        margin-bottom: 16px;
        opacity: 0; transform: translateY(14px);
        animation: inFadeUp 0.65s var(--ease-out) 0.5s forwards;
    }
    .in-anomalies-header {
        padding: 18px 24px;
        border-bottom: 1px solid rgba(251,146,60,0.12);
        display: flex; align-items: center; gap: 12px;
        background: rgba(251,146,60,0.04);
    }
    .in-anomalies-icon {
        width: 36px; height: 36px; border-radius: 9px;
        background: var(--amber-dim);
        border: 1px solid rgba(251,146,60,0.2);
        display: flex; align-items: center; justify-content: center;
        font-size: 16px; flex-shrink: 0;
    }
    .in-anomalies-title {
        font-family: var(--font-display);
        font-size: 14px; font-weight: 600; color: var(--amber); margin: 0;
    }
    .in-anomalies-count {
        margin-left: auto;
        font-family: var(--font-mono);
        font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
        padding: 3px 10px; border-radius: 20px;
        background: var(--amber-dim); color: var(--amber);
        border: 1px solid rgba(251,146,60,0.2);
    }
    .in-anomaly-list { padding: 12px 24px 16px; display: flex; flex-direction: column; gap: 8px; }
    .in-anomaly-item {
        display: flex; align-items: flex-start; gap: 12px;
        padding: 11px 14px;
        background: rgba(255,255,255,0.02);
        border: 1px solid var(--border);
        border-radius: 9px;
        font-size: 13px; color: var(--text-2);
        line-height: 1.5;
        transition: background 0.2s;
    }
    .in-anomaly-item:hover { background: rgba(255,255,255,0.04); }
    .in-anomaly-bullet {
        width: 6px; height: 6px; border-radius: 50%;
        background: var(--amber);
        box-shadow: 0 0 6px rgba(251,146,60,0.5);
        flex-shrink: 0; margin-top: 5px;
    }

    /* ── Forecast ── */
    .in-forecast {
        background: var(--bg-card);
        border: 1px solid rgba(45,212,191,0.18);
        border-radius: 16px;
        padding: 22px 28px;
        display: flex; align-items: center; gap: 16px;
        opacity: 0; transform: translateY(14px);
        animation: inFadeUp 0.65s var(--ease-out) 0.55s forwards;
    }
    .in-forecast-icon {
        width: 44px; height: 44px; border-radius: 12px;
        background: var(--teal-dim);
        border: 1px solid rgba(45,212,191,0.2);
        display: flex; align-items: center; justify-content: center;
        font-size: 20px; flex-shrink: 0;
    }
    .in-forecast-label {
        font-family: var(--font-mono);
        font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
        color: var(--teal); margin-bottom: 5px;
    }
    .in-forecast-msg {
        font-size: 14px; color: var(--text-2); font-weight: 300; line-height: 1.5;
    }

    /* ── Empty / Loading ── */
    .in-empty {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 18px;
        padding: 72px 40px; text-align: center;
        opacity: 0;
        animation: inFadeUp 0.6s var(--ease-out) 0.3s forwards;
    }
    .in-empty-icon {
        width: 64px; height: 64px; border-radius: 18px;
        background: var(--violet-dim);
        border: 1px solid rgba(167,139,250,0.2);
        display: flex; align-items: center; justify-content: center;
        font-size: 26px; margin: 0 auto 24px;
    }
    .in-empty-title {
        font-family: var(--font-display);
        font-size: 20px; font-weight: 700; margin: 0 0 10px;
    }
    .in-empty-sub {
        font-size: 13px; color: var(--text-3);
        font-family: var(--font-mono); letter-spacing: 0.05em;
        max-width: 360px; margin: 0 auto; line-height: 1.6;
    }

    .in-loading {
        display: flex; flex-direction: column; gap: 14px;
        opacity: 0;
        animation: inFadeUp 0.5s var(--ease-out) 0.15s forwards;
    }
    .in-skel-card {
        background: var(--bg-card); border: 1px solid var(--border);
        border-radius: 16px; padding: 22px 24px;
        overflow: hidden; position: relative;
    }
    .in-skel-card::after {
        content: ''; position: absolute; inset: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04) 50%, transparent);
        background-size: 200% 100%;
        animation: inShimmer 1.6s ease-in-out infinite;
    }
    .in-skel-line {
        height: 11px; border-radius: 6px;
        background: rgba(255,255,255,0.04); margin-bottom: 12px;
    }
    .in-skel-line.s { width: 30%; }
    .in-skel-line.m { width: 55%; }
    .in-skel-line.l { width: 80%; }

    /* ── Animations ── */
    @keyframes inFadeUp  { to { opacity: 1; transform: translateY(0); } }
    @keyframes inSpin    { to { transform: rotate(360deg); } }
    @keyframes inShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

    @media (max-width: 900px) {
        .in-page { padding: 24px 16px 60px; }
        .in-stats { grid-template-columns: repeat(2, 1fr); }
        .in-charts-grid { grid-template-columns: 1fr; }
        .in-chart-card.full { grid-column: auto; }
        .in-header { grid-template-columns: 1fr; }
        .in-filter { flex-direction: column; align-items: flex-start; }
    }
    `;
    document.head.appendChild(s);
};

// ─── Chart theme ──────────────────────────────────────────────────────────────
const CHART_COLORS = [
    'rgba(230,184,74,0.75)',
    'rgba(45,212,191,0.75)',
    'rgba(167,139,250,0.75)',
    'rgba(96,165,250,0.75)',
    'rgba(251,146,60,0.75)',
];
const CHART_BORDERS = [
    'rgba(230,184,74,1)',
    'rgba(45,212,191,1)',
    'rgba(167,139,250,1)',
    'rgba(96,165,250,1)',
    'rgba(251,146,60,1)',
];

const baseChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
        legend: {
            labels: {
                color: 'rgba(240,244,255,0.45)',
                font: { family: 'DM Mono', size: 11 },
                boxWidth: 10, padding: 16,
            }
        },
        tooltip: {
            backgroundColor: '#161B28',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            titleColor: '#F0F4FF',
            bodyColor: 'rgba(240,244,255,0.55)',
            titleFont: { family: 'Syne', size: 13, weight: '600' },
            bodyFont: { family: 'DM Mono', size: 11 },
            padding: 12,
            cornerRadius: 10,
        }
    },
    scales: {
        x: {
            ticks: { color: 'rgba(240,244,255,0.28)', font: { family: 'DM Mono', size: 10 } },
            grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }
        },
        y: {
            ticks: {
                color: 'rgba(240,244,255,0.28)',
                font: { family: 'DM Mono', size: 10 },
                callback: (v) => `R ${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`
            },
            grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }
        }
    }
};

const pieOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                color: 'rgba(240,244,255,0.45)',
                font: { family: 'DM Mono', size: 11 },
                boxWidth: 10, padding: 14,
            }
        },
        tooltip: {
            backgroundColor: '#161B28',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            titleColor: '#F0F4FF',
            bodyColor: 'rgba(240,244,255,0.55)',
            titleFont: { family: 'Syne', size: 13, weight: '600' },
            bodyFont: { family: 'DM Mono', size: 11 },
            padding: 12, cornerRadius: 10,
        }
    }
};

// ─── Animated Stat Counter ────────────────────────────────────────────────────
function AnimCount({ target, prefix = '', suffix = '', decimals = 0, duration = 1100 }) {
    const [val, setVal] = useState(0);
    const raf = useRef(null);
    useEffect(() => {
        const num = parseFloat(String(target).replace(/[^0-9.]/g, '')) || 0;
        const start = performance.now();
        const tick = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 4);
            setVal(decimals ? (num * ease).toFixed(decimals) : Math.round(num * ease));
            if (p < 1) raf.current = requestAnimationFrame(tick);
        };
        raf.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf.current);
    }, [target, duration, decimals]);
    return `${prefix}${val}${suffix}`;
}

// ─── Insights ─────────────────────────────────────────────────────────────────
function Insights() {
    const [insights, setInsights]     = useState(null);
    const [loading, setLoading]       = useState(true);
    const [filtering, setFiltering]   = useState(false);
    const [error, setError]           = useState('');
    const [dateRange, setDateRange]   = useState({
        start_date: '',
        end_date: ''
    });
    const [activeFilter, setActiveFilter] = useState({ start: '', end: '' });

    useEffect(() => {
        injectInsightsStyles();
        fetchInsights(); // Load all data on mount (no filters)
    }, []);

    const fetchInsights = async (start = '', end = '', isFilter = false) => {
        try {
            isFilter ? setFiltering(true) : setLoading(true);
            
            // Build params object - ONLY include if values exist
            const params = {};
            if (start) params.start_date = start;
            if (end) params.end_date = end;
            
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/insights`, {
                params: params,  // Will be empty object if no dates
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            setInsights(response.data);
            setError('');
            
            // Update active filter state
            setActiveFilter({ start, end });
            
        } catch (err) {
            setError('Failed to load insights. Please try again.');
        } finally {
            setLoading(false);
            setFiltering(false);
        }
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({ ...prev, [name]: value }));
    };

    const applyFilter = () => {
        // Only apply if at least one date is filled
        if (dateRange.start_date || dateRange.end_date) {
            fetchInsights(dateRange.start_date, dateRange.end_date, true);
        } else {
            // If both empty, show error or just ignore
            setError('Please select at least one date or use Clear Filter for all data');
        }
    };

    const clearFilter = () => {
        setDateRange({ start_date: '', end_date: '' });
        fetchInsights('', '', true); // Fetch with no filters
    };

    // Check if filter is active
    const isFilterActive = activeFilter.start || activeFilter.end;

    // ── Chart data builders
    const monthlyData = () => {
        if (!insights?.trends?.monthly_trends?.length) return null;
        return {
            labels: insights.trends.monthly_trends.map(i => i.month),
            datasets: [{
                label: 'Monthly Spend',
                data: insights.trends.monthly_trends.map(i => i.total),
                backgroundColor: 'rgba(167,139,250,0.2)',
                borderColor: 'rgba(167,139,250,0.9)',
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            }]
        };
    };

    const vendorData = () => {
        if (!insights?.vendor_analysis?.top_vendors?.length) return null;
        return {
            labels: insights.vendor_analysis.top_vendors.map(v => v.name),
            datasets: [{
                data: insights.vendor_analysis.top_vendors.map(v => v.total_spend),
                backgroundColor: CHART_COLORS,
                borderColor: CHART_BORDERS,
                borderWidth: 2,
            }]
        };
    };

    const summary = insights?.summary || {};
    const vendors = insights?.vendor_analysis?.top_vendors || [];
    const anomalies = insights?.anomalies || [];
    const forecast = insights?.forecast;

    const statCards = [
        { label: 'Total Spend',       value: summary.total_spend,    prefix: 'R ', decimals: 0, icon: '₿', color: '--green' },
        { label: 'Invoice Count',     value: summary.document_count, prefix: '',   decimals: 0, icon: '◈', color: '--blue' },
        { label: 'Average Invoice',   value: summary.average_invoice,prefix: 'R ', decimals: 0, icon: '⬡', color: '--gold' },
        { label: 'Total VAT',         value: summary.total_vat,      prefix: 'R ', decimals: 0, icon: '%', color: '--violet' },
    ];

    const skels = [1, 2, 3].map(i =>
        React.createElement('div', { key: i, className: 'in-skel-card' },
            React.createElement('div', { className: 'in-skel-line s' }),
            React.createElement('div', { className: 'in-skel-line m' }),
            React.createElement('div', { className: 'in-skel-line l' }),
        )
    );

    return React.createElement('div', { className: 'in-root' },

        // Background
        React.createElement('div', { className: 'in-bg' },
            React.createElement('div', { className: 'in-bg-orb in-bg-orb-1' }),
            React.createElement('div', { className: 'in-bg-orb in-bg-orb-2' }),
            React.createElement('div', { className: 'in-bg-orb in-bg-orb-3' }),
            React.createElement('div', { className: 'in-bg-grid' }),
        ),

        React.createElement(Navigation, null),

        React.createElement('main', { className: 'in-page' },

            // Header
            React.createElement('header', { className: 'in-header' },
                React.createElement('div', null,
                    React.createElement('div', { className: 'in-eyebrow' }, 'Analytics Engine'),
                    React.createElement('h1', { className: 'in-title' }, 'AI-Powered Insights')
                ),
                isFilterActive && React.createElement('div', { className: 'in-card-badge teal' },
                    `Filtered: ${activeFilter.start || '∞'} → ${activeFilter.end || '∞'}`
                )
            ),

            // Date filter
            React.createElement('div', { className: 'in-filter' },
                React.createElement('div', { className: 'in-filter-label' }, 'Date Range'),
                React.createElement('div', { className: 'in-filter-group' },
                    React.createElement('span', { className: 'in-date-label' }, 'From'),
                    React.createElement('input', {
                        type: 'date', name: 'start_date',
                        value: dateRange.start_date,
                        onChange: handleDateChange,
                        className: 'in-date-input'
                    })
                ),
                React.createElement('div', { className: 'in-filter-group' },
                    React.createElement('span', { className: 'in-date-label' }, 'To'),
                    React.createElement('input', {
                        type: 'date', name: 'end_date',
                        value: dateRange.end_date,
                        onChange: handleDateChange,
                        className: 'in-date-input'
                    })
                ),
                React.createElement('button', {
                    className: 'in-filter-btn',
                    onClick: applyFilter,
                    disabled: filtering
                },
                    filtering
                        ? React.createElement('div', { className: 'in-filter-spinner' })
                        : '⬡',
                    filtering ? 'Applying…' : 'Apply Filter'
                ),
                React.createElement('button', {
                    className: 'in-clear-btn',
                    onClick: clearFilter,
                    disabled: filtering
                }, 'Clear Filter')
            ),

            // Error
            error && React.createElement('div', { className: 'in-error' }, '! ', error),

            // Loading
            loading
                ? React.createElement('div', { className: 'in-loading' }, ...skels)

                // No data
                : !insights || !summary.document_count
                    ? React.createElement('div', { className: 'in-empty' },
                        React.createElement('div', { className: 'in-empty-icon' }, '⬡'),
                        React.createElement('h2', { className: 'in-empty-title' }, 'No data yet'),
                        React.createElement('p', { className: 'in-empty-sub' },
                            isFilterActive 
                                ? 'No approved documents found for the selected date range.'
                                : 'Upload and approve invoices to begin generating AI-powered insights.'
                        )
                    )

                    // Content
                    : React.createElement('div', null,

                        // Stat cards
                        React.createElement('div', { className: 'in-stats' },
                            statCards.map((c, i) =>
                                React.createElement('div', {
                                    key: c.label,
                                    className: 'in-stat-card',
                                    style: { '--stat-color': `var(${c.color})` }
                                },
                                    React.createElement('div', { className: 'in-stat-icon' }, c.icon),
                                    React.createElement('div', { className: 'in-stat-label' }, c.label),
                                    React.createElement('div', { className: 'in-stat-value' },
                                        React.createElement(AnimCount, {
                                            target: c.value || 0,
                                            prefix: c.prefix,
                                            decimals: c.decimals,
                                            duration: 900 + i * 150
                                        })
                                    ),
                                    React.createElement('div', { className: 'in-stat-sub' },
                                        c.label === 'Invoice Count' ? 'documents total'
                                            : c.label === 'Total VAT' ? '15% standard rate'
                                            : 'ZAR this period'
                                    )
                                )
                            )
                        ),

                        // Charts grid
                        React.createElement('div', { className: 'in-charts-grid' },

                            // Monthly bar chart
                            monthlyData() && React.createElement('div', { className: 'in-chart-card full' },
                                React.createElement('div', { className: 'in-card-header' },
                                    React.createElement('div', { className: 'in-card-title' }, 'Monthly Spend Trend'),
                                    React.createElement('div', { className: 'in-card-badge violet' },
                                        insights.trends?.trend_direction || 'stable'
                                    )
                                ),
                                React.createElement('div', { className: 'in-card-sub' },
                                    'Invoice value over time — current period'
                                ),
                                React.createElement('div', { className: 'in-chart-wrap' },
                                    React.createElement(Bar, { data: monthlyData(), options: baseChartOptions })
                                )
                            ),

                            // Pie chart
                            vendorData() && React.createElement('div', { className: 'in-chart-card' },
                                React.createElement('div', { className: 'in-card-header' },
                                    React.createElement('div', { className: 'in-card-title' }, 'Vendor Distribution'),
                                    React.createElement('div', { className: 'in-card-badge teal' },
                                        insights.vendor_analysis?.concentration
                                            ? `${Number(insights.vendor_analysis.concentration).toFixed(0)}% top vendor`
                                            : 'by spend'
                                    )
                                ),
                                React.createElement('div', { className: 'in-card-sub' }, 'Relative spend share by vendor'),
                                React.createElement('div', { className: 'in-chart-wrap' },
                                    React.createElement(Pie, { data: vendorData(), options: pieOptions })
                                )
                            ),

                            // Vendor table
                            vendors.length > 0 && React.createElement('div', { className: 'in-chart-card' },
                                React.createElement('div', { className: 'in-card-header' },
                                    React.createElement('div', { className: 'in-card-title' }, 'Top Vendors'),
                                    React.createElement('div', { className: 'in-card-badge gold' },
                                        `${vendors.length} vendors`
                                    )
                                ),
                                React.createElement('div', { className: 'in-card-sub' },
                                    'Ranked by total spend in selected period'
                                ),
                                React.createElement('div', { className: 'in-vendor-table-wrap' },
                                    React.createElement('table', { className: 'in-table' },
                                        React.createElement('thead', null,
                                            React.createElement('tr', null,
                                                React.createElement('th', null, 'Vendor'),
                                                React.createElement('th', null, 'Total'),
                                                React.createElement('th', null, 'Invoices'),
                                                React.createElement('th', null, 'Avg'),
                                                React.createElement('th', null, '% Share')
                                            )
                                        ),
                                        React.createElement('tbody', null,
                                            vendors.map((v, i) =>
                                                React.createElement('tr', { key: i },
                                                    React.createElement('td', null,
                                                        React.createElement('span', {
                                                            className: `in-table-rank${i === 0 ? ' top' : ''}`
                                                        }, i + 1),
                                                        v.name
                                                    ),
                                                    React.createElement('td', { className: 'amount' },
                                                        `R ${Number(v.total_spend || 0).toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`
                                                    ),
                                                    React.createElement('td', null, v.transaction_count || 0),
                                                    React.createElement('td', null,
                                                        `R ${Number(v.average_transaction || 0).toFixed(0)}`
                                                    ),
                                                    React.createElement('td', null,
                                                        React.createElement('div', { className: 'in-pct-bar-wrap' },
                                                            `${Number(v.percentage_of_total || 0).toFixed(1)}%`,
                                                            React.createElement('div', { className: 'in-pct-bar-bg' },
                                                                React.createElement('div', {
                                                                    className: 'in-pct-bar-fill',
                                                                    style: { width: `${Math.min(v.percentage_of_total || 0, 100)}%` }
                                                                })
                                                            )
                                                        )
                                                    )
                                                )
                                            )
                                        )
                                    )
                                )
                            )
                        ),

                        // Anomalies
                        anomalies.length > 0 && React.createElement('div', { className: 'in-anomalies' },
                            React.createElement('div', { className: 'in-anomalies-header' },
                                React.createElement('div', { className: 'in-anomalies-icon' }, '⚠'),
                                React.createElement('h3', { className: 'in-anomalies-title' }, 'Anomalies Detected'),
                                React.createElement('div', { className: 'in-anomalies-count' },
                                    `${anomalies.length} flag${anomalies.length !== 1 ? 's' : ''}`
                                )
                            ),
                            React.createElement('div', { className: 'in-anomaly-list' },
                                anomalies.map((a, i) =>
                                    React.createElement('div', { key: i, className: 'in-anomaly-item' },
                                        React.createElement('div', { className: 'in-anomaly-bullet' }),
                                        typeof a === 'string' ? a : 
                                            `${a.vendor}: ${a.reason} (R ${a.amount?.toLocaleString()})`
                                    )
                                )
                            )
                        ),

                        // Forecast
                        forecast?.message && React.createElement('div', { className: 'in-forecast' },
                            React.createElement('div', { className: 'in-forecast-icon' }, '◎'),
                            React.createElement('div', null,
                                React.createElement('div', { className: 'in-forecast-label' }, 'AI Forecast'),
                                React.createElement('div', { className: 'in-forecast-msg' }, forecast.message)
                            )
                        ),
                        
                        // Next month forecast if available
                        forecast?.next_month_forecast > 0 && React.createElement('div', { className: 'in-forecast', style: { marginTop: '16px' } },
                            React.createElement('div', { className: 'in-forecast-icon' }, '📈'),
                            React.createElement('div', null,
                                React.createElement('div', { className: 'in-forecast-label' }, 'Next Month Projection'),
                                React.createElement('div', { className: 'in-forecast-msg' },
                                    `R ${Number(forecast.next_month_forecast).toLocaleString()} (${forecast.confidence} confidence)`
                                )
                            )
                        )
                    ) // end content
        ) // end main
    );
}

export default Insights;