import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import Navigation from '../components/Navigation';

// API Base URL - Use environment variable with fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

// ─── Inject Styles ────────────────────────────────────────────────────────────
const injectReportsStyles = () => {
    if (document.getElementById('reports-styles')) return;
    const s = document.createElement('style');
    s.id = 'reports-styles';
    s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

    :root {
        --bg-base:       #080A12;
        --bg-card:       #111520;
        --bg-card-2:     #0D1017;
        --bg-card-hover: #161B28;
        --border:        rgba(255,255,255,0.06);
        --border-bright: rgba(255,255,255,0.13);
        --gold:          #E6B84A;
        --gold-dim:      rgba(230,184,74,0.10);
        --gold-glow:     rgba(230,184,74,0.22);
        --teal:          #2DD4BF;
        --teal-dim:      rgba(45,212,191,0.08);
        --red:           #F87171;
        --red-dim:       rgba(248,113,113,0.10);
        --blue:          #60A5FA;
        --blue-dim:      rgba(96,165,250,0.10);
        --green:         #4ADE80;
        --green-dim:     rgba(74,222,128,0.10);
        --violet:        #A78BFA;
        --violet-dim:    rgba(167,139,250,0.10);
        --amber:         #FB923C;
        --amber-dim:     rgba(251,146,60,0.10);
        --text-1:        #F0F4FF;
        --text-2:        rgba(240,244,255,0.55);
        --text-3:        rgba(240,244,255,0.28);
        --ease-out:      cubic-bezier(0.22, 1, 0.36, 1);
        --font-display:  'Syne', sans-serif;
        --font-body:     'DM Sans', sans-serif;
        --font-mono:     'DM Mono', monospace;
    }

    .rp-root {
        min-height: 100vh;
        background: var(--bg-base);
        font-family: var(--font-body);
        color: var(--text-1);
        overflow-x: hidden;
    }

    /* ── Background ── */
    .rp-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
    .rp-bg-orb { position: absolute; border-radius: 50%; filter: blur(130px); }
    .rp-bg-orb-1 {
        width: 550px; height: 550px;
        background: radial-gradient(circle, #60A5FA, transparent 70%);
        top: -150px; right: -100px; opacity: 0.08;
        animation: rpOrb1 22s ease-in-out infinite alternate;
    }
    .rp-bg-orb-2 {
        width: 480px; height: 480px;
        background: radial-gradient(circle, #E6B84A, transparent 70%);
        bottom: -80px; left: -80px; opacity: 0.08;
        animation: rpOrb2 18s ease-in-out infinite alternate;
    }
    .rp-bg-grid {
        position: absolute; inset: 0;
        background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
        background-size: 56px 56px;
        mask-image: radial-gradient(ellipse 80% 60% at 80% 5%, black 10%, transparent 100%);
    }
    @keyframes rpOrb1 { from { transform: translate(0,0) scale(1); } to { transform: translate(-50px,80px) scale(1.1); } }
    @keyframes rpOrb2 { from { transform: translate(0,0) scale(1); } to { transform: translate(60px,-50px) scale(0.92); } }

    /* ── Page ── */
    .rp-page {
        position: relative; z-index: 1;
        max-width: 1380px;
        margin: 0 auto;
        padding: 48px 40px 100px;
    }

    /* ── Header ── */
    .rp-header {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: end; gap: 20px;
        margin-bottom: 36px;
        padding-bottom: 32px;
        border-bottom: 1px solid var(--border);
        opacity: 0; transform: translateY(16px);
        animation: rpFadeUp 0.65s var(--ease-out) 0.1s forwards;
    }
    .rp-eyebrow {
        font-family: var(--font-mono);
        font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
        color: var(--blue);
        display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
    }
    .rp-eyebrow::before { content: ''; display: block; width: 22px; height: 1px; background: var(--blue); }
    .rp-title {
        font-family: var(--font-display);
        font-size: clamp(26px, 3vw, 42px);
        font-weight: 800; letter-spacing: -0.02em; line-height: 1.06; margin: 0;
        background: linear-gradient(135deg, #F0F4FF 0%, rgba(240,244,255,0.6) 100%);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .rp-export-group { display: flex; gap: 10px; align-items: center; }
    .rp-export-btn {
        padding: 10px 20px;
        border-radius: 9px; border: 1px solid transparent;
        font-family: var(--font-body);
        font-size: 13px; font-weight: 500; cursor: pointer;
        display: flex; align-items: center; gap: 8px;
        transition: all 0.25s var(--ease-out);
        white-space: nowrap;
    }
    .rp-export-btn.pdf {
        background: var(--red-dim); border-color: rgba(248,113,113,0.2); color: var(--red);
    }
    .rp-export-btn.pdf:hover:not(:disabled) {
        background: rgba(248,113,113,0.16); border-color: rgba(248,113,113,0.38);
        box-shadow: 0 6px 20px rgba(248,113,113,0.14); transform: translateY(-1px);
    }
    .rp-export-btn.excel {
        background: var(--green-dim); border-color: rgba(74,222,128,0.2); color: var(--green);
    }
    .rp-export-btn.excel:hover:not(:disabled) {
        background: rgba(74,222,128,0.16); border-color: rgba(74,222,128,0.38);
        box-shadow: 0 6px 20px rgba(74,222,128,0.14); transform: translateY(-1px);
    }
    .rp-export-btn:disabled { opacity: 0.45; cursor: wait; transform: none; }
    .rp-btn-spinner {
        width: 12px; height: 12px; border-radius: 50%;
        border: 2px solid transparent; border-top-color: currentColor;
        animation: rpSpin 0.7s linear infinite;
    }

    /* ── Filter bar ── */
    .rp-filters {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 20px 24px;
        margin-bottom: 24px;
        opacity: 0; transform: translateY(14px);
        animation: rpFadeUp 0.6s var(--ease-out) 0.2s forwards;
        position: relative; overflow: hidden;
    }
    .rp-filters::before {
        content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
        background: linear-gradient(90deg, transparent, var(--blue-dim), transparent);
    }
    .rp-filters-header {
        display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
    }
    .rp-filters-title {
        font-family: var(--font-mono);
        font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-3);
        display: flex; align-items: center; gap: 8px;
    }
    .rp-filters-title-dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: var(--blue); box-shadow: 0 0 6px rgba(96,165,250,0.5);
    }
    .rp-clear-btn {
        padding: 5px 14px;
        border-radius: 20px; border: 1px solid var(--border);
        background: transparent;
        font-family: var(--font-mono);
        font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
        color: var(--text-3); cursor: pointer;
        transition: all 0.2s;
    }
    .rp-clear-btn:hover { background: var(--red-dim); border-color: rgba(248,113,113,0.25); color: var(--red); }
    .rp-filters-row {
        display: flex; gap: 10px; flex-wrap: wrap; align-items: center;
    }
    .rp-input, .rp-select {
        background: rgba(255,255,255,0.03);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 9px 13px;
        font-family: var(--font-body);
        font-size: 13px; color: var(--text-1);
        outline: none; transition: border-color 0.2s;
        color-scheme: dark;
    }
    .rp-input { width: 180px; }
    .rp-select { width: 150px; cursor: pointer; }
    .rp-date { width: 140px; }
    .rp-input:focus, .rp-select:focus { border-color: var(--border-bright); }
    .rp-input::placeholder { color: var(--text-3); }
    .rp-select option { background: #111520; }

    /* ── Stat cards ── */
    .rp-stats {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 12px;
        margin-bottom: 24px;
        opacity: 0; transform: translateY(14px);
        animation: rpFadeUp 0.65s var(--ease-out) 0.3s forwards;
    }
    .rp-stat-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 13px;
        padding: 18px 18px 16px;
        position: relative; overflow: hidden;
        transition: border-color 0.3s, transform 0.3s var(--ease-out), box-shadow 0.3s;
        cursor: default;
    }
    .rp-stat-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 16px 48px rgba(0,0,0,0.4);
        border-color: var(--sc);
    }
    .rp-stat-card::after {
        content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
        border-radius: 13px 13px 0 0;
        background: var(--sc); opacity: 0; transition: opacity 0.3s;
    }
    .rp-stat-card:hover::after { opacity: 1; }
    .rp-stat-label {
        font-family: var(--font-mono);
        font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
        color: var(--text-3); margin-bottom: 12px;
    }
    .rp-stat-value {
        font-family: var(--font-display);
        font-size: 24px; font-weight: 700; line-height: 1;
        letter-spacing: -0.02em; color: var(--sc);
    }

    /* ── Charts grid ── */
    .rp-charts {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 20px;
        opacity: 0; transform: translateY(14px);
        animation: rpFadeUp 0.65s var(--ease-out) 0.4s forwards;
    }
    .rp-chart-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 16px; overflow: hidden;
        transition: border-color 0.25s;
    }
    .rp-chart-card:hover { border-color: var(--border-bright); }
    .rp-chart-header {
        padding: 20px 24px 0;
        display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;
    }
    .rp-chart-title {
        font-family: var(--font-display);
        font-size: 14px; font-weight: 600; color: var(--text-1);
    }
    .rp-chart-badge {
        font-family: var(--font-mono);
        font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
        padding: 3px 10px; border-radius: 20px;
        background: var(--blue-dim); color: var(--blue); border: 1px solid rgba(96,165,250,0.2);
    }
    .rp-chart-badge.green { background: var(--green-dim); color: var(--green); border-color: rgba(74,222,128,0.2); }
    .rp-chart-sub {
        padding: 3px 24px 14px;
        font-family: var(--font-mono);
        font-size: 11px; color: var(--text-3); letter-spacing: 0.04em;
    }
    .rp-chart-body { padding: 0 18px 18px; }

    /* ── Table section ── */
    .rp-table-section {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 16px; overflow: hidden;
        opacity: 0; transform: translateY(14px);
        animation: rpFadeUp 0.65s var(--ease-out) 0.5s forwards;
    }
    .rp-table-header {
        padding: 20px 24px;
        border-bottom: 1px solid var(--border);
        display: flex; align-items: center; justify-content: space-between;
    }
    .rp-table-title {
        font-family: var(--font-display);
        font-size: 14px; font-weight: 600; color: var(--text-1);
    }
    .rp-table-count {
        font-family: var(--font-mono);
        font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
        padding: 3px 10px; border-radius: 20px;
        background: var(--gold-dim); color: var(--gold); border: 1px solid rgba(230,184,74,0.2);
    }
    .rp-table-wrap { overflow-x: auto; }
    .rp-table {
        width: 100%; border-collapse: collapse; font-size: 13px;
    }
    .rp-table thead tr { border-bottom: 1px solid var(--border); }
    .rp-table thead th {
        font-family: var(--font-mono);
        font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
        color: var(--text-3); padding: 10px 16px;
        text-align: left; font-weight: 400; white-space: nowrap;
    }
    .rp-table thead th.right { text-align: right; }
    .rp-table tbody tr {
        border-bottom: 1px solid var(--border);
        transition: background 0.15s;
    }
    .rp-table tbody tr:last-child { border-bottom: none; }
    .rp-table tbody tr:hover { background: rgba(255,255,255,0.02); }
    .rp-table tbody tr.dup-row { background: rgba(251,146,60,0.04); }
    .rp-table tbody tr.dup-row:hover { background: rgba(251,146,60,0.07); }
    .rp-table td {
        padding: 11px 16px;
        color: var(--text-2); font-size: 12.5px;
        white-space: nowrap;
    }
    .rp-table td.primary { color: var(--text-1); font-weight: 500; }
    .rp-table td.right { text-align: right; font-family: var(--font-mono); font-size: 12px; }
    .rp-table td.amount { color: var(--green); font-family: var(--font-mono); text-align: right; font-size: 12px; }
    .rp-table td.mono { font-family: var(--font-mono); font-size: 11px; color: var(--text-3); }

    /* Status pill */
    .rp-status-pill {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 3px 9px; border-radius: 20px;
        font-family: var(--font-mono); font-size: 10px;
        font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase;
        white-space: nowrap;
    }
    .rp-status-pill .dot { width: 4px; height: 4px; border-radius: 50%; background: currentColor; }
    .rp-status-pill.pending { background: var(--gold-dim); color: var(--gold); border: 1px solid rgba(230,184,74,0.2); }
    .rp-status-pill.approved { background: var(--green-dim); color: var(--green); border: 1px solid rgba(74,222,128,0.2); }
    .rp-status-pill.rejected { background: var(--red-dim); color: var(--red); border: 1px solid rgba(248,113,113,0.2); }
    .rp-status-pill.default { background: rgba(255,255,255,0.04); color: var(--text-3); border: 1px solid var(--border); }

    /* Dup badge */
    .rp-dup-badge {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 2px 8px; border-radius: 6px;
        font-family: var(--font-mono); font-size: 10px;
        background: var(--amber-dim); color: var(--amber); border: 1px solid rgba(251,146,60,0.2);
    }
    .rp-doc-type {
        display: inline-block;
        padding: 2px 8px; border-radius: 6px;
        font-family: var(--font-mono); font-size: 10px;
        background: rgba(255,255,255,0.04); color: var(--text-3); border: 1px solid var(--border);
        text-transform: uppercase; letter-spacing: 0.06em;
    }

    /* ── Empty ── */
    .rp-empty {
        padding: 64px 40px; text-align: center;
    }
    .rp-empty-icon {
        width: 56px; height: 56px; border-radius: 16px;
        background: var(--blue-dim); border: 1px solid rgba(96,165,250,0.2);
        display: flex; align-items: center; justify-content: center;
        font-size: 22px; margin: 0 auto 20px;
        font-family: var(--font-mono); color: var(--blue);
    }
    .rp-empty-title {
        font-family: var(--font-display);
        font-size: 18px; font-weight: 700; margin: 0 0 8px;
    }
    .rp-empty-sub {
        font-size: 13px; color: var(--text-3);
        font-family: var(--font-mono); letter-spacing: 0.04em;
    }

    /* ── Skeleton ── */
    .rp-skel-wrap {
        display: flex; flex-direction: column; gap: 14px;
        opacity: 0;
        animation: rpFadeUp 0.5s var(--ease-out) 0.15s forwards;
    }
    .rp-skel-card {
        background: var(--bg-card); border: 1px solid var(--border);
        border-radius: 14px; padding: 20px 24px;
        overflow: hidden; position: relative;
    }
    .rp-skel-card::after {
        content: ''; position: absolute; inset: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04) 50%, transparent);
        background-size: 200% 100%;
        animation: rpShimmer 1.6s ease-in-out infinite;
    }
    .rp-skel-line { height: 11px; border-radius: 6px; background: rgba(255,255,255,0.04); margin-bottom: 10px; }
    .rp-skel-line.s { width: 28%; }
    .rp-skel-line.m { width: 52%; }
    .rp-skel-line.l { width: 78%; }

    /* Toast */
    .rp-toast {
        position: fixed; bottom: 32px; right: 32px; z-index: 9999;
        background: var(--bg-card); border: 1px solid var(--border-bright);
        border-radius: 12px; padding: 14px 20px;
        display: flex; align-items: center; gap: 12px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        font-size: 13.5px; font-weight: 500; max-width: 340px;
        animation: rpToastIn 0.4s var(--ease-out) forwards;
    }
    .rp-toast.success { border-color: rgba(74,222,128,0.25); color: var(--text-1); }
    .rp-toast.error   { border-color: rgba(248,113,113,0.25); color: var(--red); }
    .rp-toast-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .rp-toast.success .rp-toast-dot { background: var(--green); box-shadow: 0 0 8px rgba(74,222,128,0.5); }
    .rp-toast.error   .rp-toast-dot { background: var(--red);   box-shadow: 0 0 8px rgba(248,113,113,0.4); }

    /* ── Keyframes ── */
    @keyframes rpFadeUp  { to { opacity: 1; transform: translateY(0); } }
    @keyframes rpSpin    { to { transform: rotate(360deg); } }
    @keyframes rpShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    @keyframes rpToastIn {
        from { opacity: 0; transform: translateY(16px); }
        to   { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 1100px) {
        .rp-stats { grid-template-columns: repeat(3, 1fr); }
        .rp-charts { grid-template-columns: 1fr; }
    }
    @media (max-width: 700px) {
        .rp-page { padding: 24px 16px 60px; }
        .rp-stats { grid-template-columns: repeat(2, 1fr); }
        .rp-header { grid-template-columns: 1fr; }
        .rp-export-group { flex-wrap: wrap; }
    }
    `;
    document.head.appendChild(s);
};

// ─── Chart theme ──────────────────────────────────────────────────────────────
const makeChartOptions = (yPrefix = 'R ') => ({
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: '#161B28',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            titleColor: '#F0F4FF',
            bodyColor: 'rgba(240,244,255,0.55)',
            titleFont: { family: 'Syne', size: 13, weight: '600' },
            bodyFont: { family: 'DM Mono', size: 11 },
            padding: 12, cornerRadius: 10,
            callbacks: {
                label: (ctx) => ` ${yPrefix}${Number(ctx.raw).toLocaleString('en-ZA')}`
            }
        }
    },
    scales: {
        x: {
            ticks: { color: 'rgba(240,244,255,0.28)', font: { family: 'DM Mono', size: 10 }, maxRotation: 30 },
            grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }
        },
        y: {
            ticks: {
                color: 'rgba(240,244,255,0.28)',
                font: { family: 'DM Mono', size: 10 },
                callback: (v) => `${yPrefix}${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`
            },
            grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }
        }
    }
});

// ─── Status helpers ───────────────────────────────────────────────────────────
function StatusPill({ status }) {
    const cls = status?.includes('pending') ? 'pending' : status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'default';
    const label = status?.replace(/_/g, ' ') || 'Unknown';
    return React.createElement('span', { className: `rp-status-pill ${cls}` },
        React.createElement('span', { className: 'dot' }),
        label
    );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onDone }) {
    useEffect(() => {
        const id = setTimeout(onDone, 3200);
        return () => clearTimeout(id);
    }, [onDone]);
    return React.createElement('div', { className: `rp-toast ${type}` },
        React.createElement('div', { className: 'rp-toast-dot' }),
        message
    );
}

// ─── Reports ──────────────────────────────────────────────────────────────────
function Reports() {
    const navigate = useNavigate();
    const [documents, setDocuments]     = useState([]);
    const [loading, setLoading]         = useState(true);
    const [exportLoading, setExportLoading] = useState({ pdf: false, excel: false });
    const [toast, setToast]             = useState(null);
    const [filters, setFilters]         = useState({
        startDate: '', endDate: '', vendor: '', status: '', docType: ''
    });

    useEffect(() => {
        injectReportsStyles();
        fetchDocuments();
    }, []);

    const showToast = (message, type = 'success') => setToast({ message, type });

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/documents`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            setDocuments(response.data);
        } catch (err) {
            showToast('Failed to load documents. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => setFilters({ startDate: '', endDate: '', vendor: '', status: '', docType: '' });

    const setFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

    // ── Filtered docs
    const filteredDocs = documents.filter(doc => {
        if (filters.vendor && !doc.vendor?.toLowerCase().includes(filters.vendor.toLowerCase())) return false;
        if (filters.status && doc.status !== filters.status) return false;
        if (filters.docType && doc.document_type !== filters.docType) return false;
        if (filters.startDate && doc.date && new Date(doc.date) < new Date(filters.startDate)) return false;
        if (filters.endDate && doc.date && new Date(doc.date) > new Date(filters.endDate)) return false;
        return true;
    });

    const totalAmount   = filteredDocs.reduce((s, d) => s + (d.amount || 0), 0);
    const totalVAT      = filteredDocs.reduce((s, d) => s + (d.vat_amount || 0), 0);
    const pendingCount  = filteredDocs.filter(d => d.status?.includes('pending')).length;
    const approvedCount = filteredDocs.filter(d => d.status === 'approved').length;
    const rejectedCount = filteredDocs.filter(d => d.status === 'rejected').length;
    const dupCount      = filteredDocs.filter(d => d.is_duplicate).length;

    const fmtAmount = (n) => `R ${Number(n || 0).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

    const statCards = [
        { label: 'Total Amount',    value: fmtAmount(totalAmount),   color: '--green'  },
        { label: 'Total VAT',       value: fmtAmount(totalVAT),      color: '--teal'   },
        { label: 'Pending',         value: pendingCount,              color: '--gold'   },
        { label: 'Approved',        value: approvedCount,             color: '--green'  },
        { label: 'Rejected',        value: rejectedCount,             color: '--red'    },
        { label: 'Duplicates',      value: dupCount,                  color: '--amber'  },
    ];

    // ── Chart data
    const topVendors = [...new Set(filteredDocs.map(d => d.vendor).filter(Boolean))].slice(0, 6);
    const vendorChartData = {
        labels: topVendors,
        datasets: [{
            label: 'Spend',
            data: topVendors.map(v => filteredDocs.filter(d => d.vendor === v).reduce((s, d) => s + (d.amount || 0), 0)),
            backgroundColor: 'rgba(96,165,250,0.2)',
            borderColor: 'rgba(96,165,250,0.9)',
            borderWidth: 2, borderRadius: 6, borderSkipped: false,
        }]
    };
    const statusChartData = {
        labels: ['Pending', 'Approved', 'Rejected'],
        datasets: [{
            label: 'Count',
            data: [pendingCount, approvedCount, rejectedCount],
            backgroundColor: ['rgba(230,184,74,0.2)', 'rgba(74,222,128,0.2)', 'rgba(248,113,113,0.2)'],
            borderColor: ['rgba(230,184,74,0.9)', 'rgba(74,222,128,0.9)', 'rgba(248,113,113,0.9)'],
            borderWidth: 2, borderRadius: 6, borderSkipped: false,
        }]
    };

    // ── Export
    const handleExport = async (format) => {
        try {
            setExportLoading(prev => ({ ...prev, [format]: true }));
            const token = localStorage.getItem('token');
            if (!token) { navigate('/'); return; }
            const params = new URLSearchParams();
            if (filters.vendor)    params.append('vendor', filters.vendor);
            if (filters.status)    params.append('status', filters.status);
            if (filters.docType)   params.append('doc_type', filters.docType);
            if (filters.startDate) params.append('start_date', filters.startDate);
            if (filters.endDate)   params.append('end_date', filters.endDate);
            const response = await axios({
                url: `${API_BASE_URL}/export/${format}?${params.toString()}`,
                method: 'GET', responseType: 'blob',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const blob = new Blob([response.data], {
                type: format === 'excel'
                    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    : 'application/pdf'
            });
            const url  = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `documents_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            showToast(`${format.toUpperCase()} exported successfully`, 'success');
        } catch (err) {
            let msg = `Failed to export ${format.toUpperCase()}.`;
            if (err.response?.status === 401) { msg = 'Authentication failed. Please login again.'; navigate('/'); }
            else if (err.response?.status === 404) msg = 'No documents found to export.';
            else if (!err.response) msg = 'No response from server.';
            showToast(msg, 'error');
        } finally {
            setExportLoading(prev => ({ ...prev, [format]: false }));
        }
    };

    const skels = [1, 2, 3].map(i =>
        React.createElement('div', { key: i, className: 'rp-skel-card' },
            React.createElement('div', { className: 'rp-skel-line s' }),
            React.createElement('div', { className: 'rp-skel-line m' }),
            React.createElement('div', { className: 'rp-skel-line l' }),
        )
    );

    return React.createElement('div', { className: 'rp-root' },

        // Background
        React.createElement('div', { className: 'rp-bg' },
            React.createElement('div', { className: 'rp-bg-orb rp-bg-orb-1' }),
            React.createElement('div', { className: 'rp-bg-orb rp-bg-orb-2' }),
            React.createElement('div', { className: 'rp-bg-grid' }),
        ),

        React.createElement(Navigation, null),

        React.createElement('main', { className: 'rp-page' },

            // Header
            React.createElement('header', { className: 'rp-header' },
                React.createElement('div', null,
                    React.createElement('div', { className: 'rp-eyebrow' }, 'Document Pipeline'),
                    React.createElement('h1', { className: 'rp-title' }, 'Reports & Analytics')
                ),
                React.createElement('div', { className: 'rp-export-group' },
                    React.createElement('button', {
                        className: 'rp-export-btn pdf',
                        onClick: () => handleExport('pdf'),
                        disabled: exportLoading.pdf
                    },
                        exportLoading.pdf
                            ? React.createElement('div', { className: 'rp-btn-spinner' })
                            : '▣',
                        exportLoading.pdf ? 'Exporting…' : 'Export PDF'
                    ),
                    React.createElement('button', {
                        className: 'rp-export-btn excel',
                        onClick: () => handleExport('excel'),
                        disabled: exportLoading.excel
                    },
                        exportLoading.excel
                            ? React.createElement('div', { className: 'rp-btn-spinner' })
                            : '≡',
                        exportLoading.excel ? 'Exporting…' : 'Export Excel'
                    )
                )
            ),

            // Filters
            React.createElement('div', { className: 'rp-filters' },
                React.createElement('div', { className: 'rp-filters-header' },
                    React.createElement('div', { className: 'rp-filters-title' },
                        React.createElement('div', { className: 'rp-filters-title-dot' }),
                        'Filter Documents'
                    ),
                    React.createElement('button', { className: 'rp-clear-btn', onClick: clearFilters }, 'Clear All')
                ),
                React.createElement('div', { className: 'rp-filters-row' },
                    React.createElement('input', {
                        className: 'rp-input', type: 'text',
                        placeholder: 'Vendor name…',
                        value: filters.vendor,
                        onChange: (e) => setFilter('vendor', e.target.value)
                    }),
                    React.createElement('select', {
                        className: 'rp-select',
                        value: filters.status,
                        onChange: (e) => setFilter('status', e.target.value)
                    },
                        React.createElement('option', { value: '' }, 'All Statuses'),
                        React.createElement('option', { value: 'pending_review' }, 'Pending Review'),
                        React.createElement('option', { value: 'pending_manager' }, 'Pending Manager'),
                        React.createElement('option', { value: 'pending_finance' }, 'Pending Finance'),
                        React.createElement('option', { value: 'approved' }, 'Approved'),
                        React.createElement('option', { value: 'rejected' }, 'Rejected')
                    ),
                    React.createElement('select', {
                        className: 'rp-select',
                        value: filters.docType,
                        onChange: (e) => setFilter('docType', e.target.value)
                    },
                        React.createElement('option', { value: '' }, 'All Types'),
                        React.createElement('option', { value: 'invoice' }, 'Invoice'),
                        React.createElement('option', { value: 'credit_note' }, 'Credit Note')
                    ),
                    React.createElement('input', {
                        className: 'rp-input rp-date', type: 'date',
                        value: filters.startDate,
                        onChange: (e) => setFilter('startDate', e.target.value)
                    }),
                    React.createElement('input', {
                        className: 'rp-input rp-date', type: 'date',
                        value: filters.endDate,
                        onChange: (e) => setFilter('endDate', e.target.value)
                    })
                )
            ),

            // Loading skeleton or content
            loading
                ? React.createElement('div', { className: 'rp-skel-wrap' }, ...skels)
                : React.createElement('div', null,

                    // Stat cards
                    React.createElement('div', { className: 'rp-stats' },
                        statCards.map((c) =>
                            React.createElement('div', {
                                key: c.label, className: 'rp-stat-card',
                                style: { '--sc': `var(${c.color})` }
                            },
                                React.createElement('div', { className: 'rp-stat-label' }, c.label),
                                React.createElement('div', { className: 'rp-stat-value' }, c.value)
                            )
                        )
                    ),

                    // Charts
                    filteredDocs.length > 0 && React.createElement('div', { className: 'rp-charts' },
                        topVendors.length > 0 && React.createElement('div', { className: 'rp-chart-card' },
                            React.createElement('div', { className: 'rp-chart-header' },
                                React.createElement('div', { className: 'rp-chart-title' }, 'Top Vendors by Spend'),
                                React.createElement('div', { className: 'rp-chart-badge' }, `${topVendors.length} vendors`)
                            ),
                            React.createElement('div', { className: 'rp-chart-sub' }, 'Total invoice value per vendor'),
                            React.createElement('div', { className: 'rp-chart-body' },
                                React.createElement(Bar, { data: vendorChartData, options: makeChartOptions('R ') })
                            )
                        ),
                        React.createElement('div', { className: 'rp-chart-card' },
                            React.createElement('div', { className: 'rp-chart-header' },
                                React.createElement('div', { className: 'rp-chart-title' }, 'Documents by Status'),
                                React.createElement('div', { className: 'rp-chart-badge green' },
                                    `${filteredDocs.length} total`
                                )
                            ),
                            React.createElement('div', { className: 'rp-chart-sub' }, 'Workflow stage distribution'),
                            React.createElement('div', { className: 'rp-chart-body' },
                                React.createElement(Bar, { data: statusChartData, options: makeChartOptions('') })
                            )
                        )
                    ),

                    // Table
                    React.createElement('div', { className: 'rp-table-section' },
                        React.createElement('div', { className: 'rp-table-header' },
                            React.createElement('div', { className: 'rp-table-title' }, 'Document Records'),
                            React.createElement('div', { className: 'rp-table-count' },
                                `${filteredDocs.length} ${filteredDocs.length === 1 ? 'record' : 'records'}`
                            )
                        ),
                        filteredDocs.length === 0
                            ? React.createElement('div', { className: 'rp-empty' },
                                React.createElement('div', { className: 'rp-empty-icon' }, '≡'),
                                React.createElement('h3', { className: 'rp-empty-title' }, 'No records found'),
                                React.createElement('p', { className: 'rp-empty-sub' }, 'Try adjusting your filters to see results.')
                            )
                            : React.createElement('div', { className: 'rp-table-wrap' },
                                React.createElement('table', { className: 'rp-table' },
                                    React.createElement('thead', null,
                                        React.createElement('tr', null,
                                            React.createElement('th', null, 'Filename'),
                                            React.createElement('th', null, 'Type'),
                                            React.createElement('th', null, 'Vendor'),
                                            React.createElement('th', null, 'Invoice #'),
                                            React.createElement('th', { className: 'right' }, 'Amount'),
                                            React.createElement('th', { className: 'right' }, 'VAT'),
                                            React.createElement('th', null, 'Date'),
                                            React.createElement('th', null, 'Status'),
                                            React.createElement('th', null, 'Dup')
                                        )
                                    ),
                                    React.createElement('tbody', null,
                                        filteredDocs.map(doc =>
                                            React.createElement('tr', {
                                                key: doc.id,
                                                className: doc.is_duplicate ? 'dup-row' : ''
                                            },
                                                React.createElement('td', { className: 'primary', title: doc.filename },
                                                    (doc.filename || 'Unnamed').substring(0, 28) + ((doc.filename?.length > 28) ? '…' : '')
                                                ),
                                                React.createElement('td', null,
                                                    React.createElement('span', { className: 'rp-doc-type' },
                                                        doc.document_type === 'credit_note' ? 'CR NOTE' : (doc.document_type || 'N/A').toUpperCase()
                                                    )
                                                ),
                                                React.createElement('td', null, doc.vendor || '—'),
                                                React.createElement('td', { className: 'mono' }, doc.invoice_number || '—'),
                                                React.createElement('td', { className: 'amount' }, fmtAmount(doc.amount)),
                                                React.createElement('td', { className: 'amount', style: { color: 'var(--teal)' } }, fmtAmount(doc.vat_amount)),
                                                React.createElement('td', { className: 'mono' },
                                                    doc.date ? new Date(doc.date).toLocaleDateString('en-ZA') : '—'
                                                ),
                                                React.createElement('td', null,
                                                    React.createElement(StatusPill, { status: doc.status })
                                                ),
                                                React.createElement('td', null,
                                                    doc.is_duplicate
                                                        ? React.createElement('span', { className: 'rp-dup-badge' }, '⚠ Dup')
                                                        : React.createElement('span', { style: { color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: '11px' } }, '—')
                                                )
                                            )
                                        )
                                    )
                                )
                            )
                    )
                )
        ),

        // Toast
        toast && React.createElement(Toast, {
            message: toast.message,
            type: toast.type,
            onDone: () => setToast(null)
        })
    );
}

export default Reports;