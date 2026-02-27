import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth';

// ─── Inject Styles ────────────────────────────────────────────────────────────
const injectLoginStyles = () => {
    if (document.getElementById('login-styles')) return;
    const s = document.createElement('style');
    s.id = 'login-styles';
    s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

    :root {
        --bg-base:       #080A12;
        --bg-card:       #111520;
        --bg-card-2:     #0D1017;
        --border:        rgba(255,255,255,0.06);
        --border-bright: rgba(255,255,255,0.13);
        --gold:          #E6B84A;
        --gold-dim:      rgba(230,184,74,0.10);
        --gold-glow:     rgba(230,184,74,0.25);
        --teal:          #2DD4BF;
        --teal-dim:      rgba(45,212,191,0.08);
        --red:           #F87171;
        --red-dim:       rgba(248,113,113,0.10);
        --text-1:        #F0F4FF;
        --text-2:        rgba(240,244,255,0.55);
        --text-3:        rgba(240,244,255,0.28);
        --ease-out:      cubic-bezier(0.22, 1, 0.36, 1);
        --font-display:  'Syne', sans-serif;
        --font-body:     'DM Sans', sans-serif;
        --font-mono:     'DM Mono', monospace;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .lg-root {
        min-height: 100vh;
        background: var(--bg-base);
        font-family: var(--font-body);
        color: var(--text-1);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
    }

    /* ── Background ── */
    .lg-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
    .lg-bg-orb { position: absolute; border-radius: 50%; filter: blur(120px); }
    .lg-bg-orb-1 {
        width: 700px; height: 700px;
        background: radial-gradient(circle, #E6B84A, transparent 70%);
        top: -280px; right: -180px; opacity: 0.13;
        animation: lgOrb1 20s ease-in-out infinite alternate;
    }
    .lg-bg-orb-2 {
        width: 580px; height: 580px;
        background: radial-gradient(circle, #2DD4BF, transparent 70%);
        bottom: -200px; left: -160px; opacity: 0.10;
        animation: lgOrb2 25s ease-in-out infinite alternate;
    }
    .lg-bg-orb-3 {
        width: 320px; height: 320px;
        background: radial-gradient(circle, #A78BFA, transparent 70%);
        top: 55%; left: 55%; opacity: 0.07;
        animation: lgOrb3 17s ease-in-out infinite alternate;
    }
    .lg-bg-grid {
        position: absolute; inset: 0;
        background-image:
            linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
        background-size: 56px 56px;
        mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 0%, transparent 100%);
    }

    @keyframes lgOrb1 { from { transform: translate(0,0) scale(1); } to { transform: translate(-60px,80px) scale(1.12); } }
    @keyframes lgOrb2 { from { transform: translate(0,0) scale(1); } to { transform: translate(80px,-60px) scale(0.9); } }
    @keyframes lgOrb3 { from { transform: translate(0,0); } to { transform: translate(-50px,50px); } }

    /* ── Layout ── */
    .lg-wrap {
        position: relative; z-index: 1;
        display: grid;
        grid-template-columns: 480px;
        gap: 0;
        width: 100%;
        max-width: 480px;
        padding: 24px;
    }

    /* ── Card ── */
    .lg-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 22px;
        overflow: hidden;
        box-shadow: 0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03);
        opacity: 0; transform: translateY(24px) scale(0.98);
        animation: lgCardIn 0.8s var(--ease-out) 0.1s forwards;
    }
    .lg-card::before {
        content: ''; position: absolute;
        top: 0; left: 0; right: 0; height: 1px;
        background: linear-gradient(90deg, transparent 0%, var(--gold-glow) 50%, transparent 100%);
    }

    /* ── Brand header ── */
    .lg-brand-area {
        padding: 40px 40px 32px;
        border-bottom: 1px solid var(--border);
        position: relative;
        overflow: hidden;
    }
    .lg-brand-area::after {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse 80% 100% at 50% 0%, rgba(230,184,74,0.05), transparent 70%);
        pointer-events: none;
    }
    .lg-brand-row {
        display: flex; align-items: center; gap: 14px; margin-bottom: 20px;
    }
    .lg-brand-icon {
        width: 44px; height: 44px;
        border-radius: 12px;
        background: linear-gradient(135deg, #E6B84A 0%, #C99A2E 100%);
        display: flex; align-items: center; justify-content: center;
        font-size: 20px;
        box-shadow: 0 4px 20px rgba(230,184,74,0.35), inset 0 1px 0 rgba(255,255,255,0.25);
        flex-shrink: 0;
        font-family: var(--font-display);
        font-weight: 800;
        color: #0D1017;
    }
    .lg-brand-name {
        font-family: var(--font-display);
        font-size: 18px; font-weight: 700;
        color: var(--text-1); letter-spacing: 0.01em;
        line-height: 1;
    }
    .lg-brand-sub {
        font-family: var(--font-mono);
        font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
        color: var(--text-3); margin-top: 3px;
    }
    .lg-welcome-title {
        font-family: var(--font-display);
        font-size: 28px; font-weight: 800;
        letter-spacing: -0.02em; line-height: 1.1; margin-bottom: 8px;
        background: linear-gradient(135deg, #F0F4FF 0%, rgba(240,244,255,0.65) 100%);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .lg-welcome-sub {
        font-size: 13.5px; color: var(--text-3);
        font-weight: 300; font-family: var(--font-mono);
        letter-spacing: 0.04em;
    }

    /* ── Form ── */
    .lg-form-area { padding: 32px 40px 36px; }

    /* Error */
    .lg-error {
        background: var(--red-dim);
        border: 1px solid rgba(248,113,113,0.2);
        border-radius: 10px;
        padding: 12px 16px;
        display: flex; align-items: center; gap: 10px;
        margin-bottom: 22px;
        font-size: 13px; color: var(--red);
        font-family: var(--font-mono); letter-spacing: 0.02em;
        animation: lgShake 0.4s var(--ease-out);
    }
    .lg-error-dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: var(--red); flex-shrink: 0;
        box-shadow: 0 0 6px rgba(248,113,113,0.5);
    }

    /* Field */
    .lg-field { margin-bottom: 20px; }
    .lg-field-label {
        font-family: var(--font-mono);
        font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
        color: var(--text-3); margin-bottom: 8px;
        display: flex; align-items: center; gap: 6px;
    }
    .lg-input-wrap { position: relative; }
    .lg-input-icon {
        position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
        font-size: 14px; color: var(--text-3);
        pointer-events: none; font-family: var(--font-mono);
        transition: color 0.2s;
        line-height: 1;
    }
    .lg-input {
        width: 100%;
        background: rgba(255,255,255,0.03);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 13px 14px 13px 42px;
        font-family: var(--font-body);
        font-size: 14px; color: var(--text-1);
        outline: none;
        transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
        letter-spacing: 0.01em;
    }
    .lg-input::placeholder { color: var(--text-3); }
    .lg-input:focus {
        border-color: var(--gold);
        background: rgba(230,184,74,0.04);
        box-shadow: 0 0 0 3px rgba(230,184,74,0.08);
    }
    .lg-input:focus + .lg-input-icon-after,
    .lg-input-wrap:focus-within .lg-input-icon { color: var(--gold); }
    .lg-input:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Password toggle */
    .lg-pw-toggle {
        position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
        background: none; border: none; cursor: pointer;
        font-family: var(--font-mono); font-size: 10px;
        color: var(--text-3); letter-spacing: 0.08em; text-transform: uppercase;
        transition: color 0.2s; padding: 4px;
    }
    .lg-pw-toggle:hover { color: var(--text-2); }

    /* Submit */
    .lg-submit {
        width: 100%; margin-top: 8px;
        padding: 14px;
        background: linear-gradient(135deg, #E6B84A 0%, #C99A2E 100%);
        border: none; border-radius: 11px;
        font-family: var(--font-display);
        font-size: 15px; font-weight: 700;
        color: #080A12;
        cursor: pointer; letter-spacing: 0.02em;
        transition: all 0.25s var(--ease-out);
        display: flex; align-items: center; justify-content: center; gap: 10px;
        box-shadow: 0 4px 24px rgba(230,184,74,0.25);
    }
    .lg-submit:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 36px rgba(230,184,74,0.38);
        filter: brightness(1.05);
    }
    .lg-submit:active:not(:disabled) { transform: translateY(0); }
    .lg-submit:disabled { opacity: 0.6; cursor: wait; transform: none; }
    .lg-submit-spinner {
        width: 16px; height: 16px; border-radius: 50%;
        border: 2px solid rgba(8,10,18,0.3);
        border-top-color: #080A12;
        animation: lgSpin 0.7s linear infinite;
    }

    /* ── Test users panel ── */
    .lg-test-panel {
        margin: 0 40px 32px;
        background: var(--bg-card-2, #0D1017);
        border: 1px solid var(--border);
        border-radius: 12px;
        overflow: hidden;
    }
    .lg-test-header {
        padding: 11px 16px;
        border-bottom: 1px solid var(--border);
        display: flex; align-items: center; gap: 8px;
        cursor: pointer; user-select: none;
        transition: background 0.2s;
    }
    .lg-test-header:hover { background: rgba(255,255,255,0.02); }
    .lg-test-header-label {
        font-family: var(--font-mono);
        font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
        color: var(--text-3); flex: 1;
    }
    .lg-test-chevron {
        font-size: 10px; color: var(--text-3);
        transition: transform 0.25s var(--ease-out);
    }
    .lg-test-chevron.open { transform: rotate(180deg); }
    .lg-test-body {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1px;
        background: var(--border);
        overflow: hidden;
        max-height: 0;
        transition: max-height 0.35s var(--ease-out);
    }
    .lg-test-body.open { max-height: 300px; }
    .lg-test-user {
        background: var(--bg-card);
        padding: 10px 14px;
        cursor: pointer;
        transition: background 0.15s;
        display: flex; flex-direction: column; gap: 2px;
    }
    .lg-test-user:hover { background: var(--bg-card-hover, #161B28); }
    .lg-test-username {
        font-family: var(--font-mono);
        font-size: 12px; color: var(--text-1); font-weight: 500;
    }
    .lg-test-role {
        font-family: var(--font-mono);
        font-size: 10px; color: var(--text-3);
        letter-spacing: 0.06em; text-transform: uppercase;
    }
    .lg-test-role.admin    { color: var(--red); }
    .lg-test-role.reviewer { color: var(--gold); }
    .lg-test-role.manager  { color: #60A5FA; }
    .lg-test-role.finance  { color: var(--green, #4ADE80); }
    .lg-test-role.viewer   { color: var(--text-3); }

    /* ── Footer line ── */
    .lg-footer {
        padding: 16px 40px 24px;
        border-top: 1px solid var(--border);
        display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .lg-footer-text {
        font-family: var(--font-mono);
        font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
        color: var(--text-3);
    }
    .lg-footer-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--text-3); }
    .lg-footer-secure {
        font-family: var(--font-mono);
        font-size: 10px; color: var(--gold);
        letter-spacing: 0.08em; text-transform: uppercase;
        display: flex; align-items: center; gap: 5px;
    }
    .lg-secure-dot {
        width: 5px; height: 5px; border-radius: 50%;
        background: var(--gold); box-shadow: 0 0 5px var(--gold-glow);
    }

    /* ── Keyframes ── */
    @keyframes lgCardIn {
        to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes lgSpin { to { transform: rotate(360deg); } }
    @keyframes lgShake {
        0%, 100% { transform: translateX(0); }
        20%       { transform: translateX(-6px); }
        40%       { transform: translateX(6px); }
        60%       { transform: translateX(-4px); }
        80%       { transform: translateX(4px); }
    }

    @media (max-width: 520px) {
        .lg-wrap { padding: 16px; }
        .lg-brand-area, .lg-form-area { padding-left: 24px; padding-right: 24px; }
        .lg-test-panel { margin-left: 24px; margin-right: 24px; }
        .lg-footer { padding-left: 24px; padding-right: 24px; }
        .lg-test-body { grid-template-columns: 1fr; }
    }
    `;
    document.head.appendChild(s);
};

// ─── Test users ───────────────────────────────────────────────────────────────
const TEST_USERS = [
    { username: 'admin',     password: 'admin123',    role: 'admin' },
    { username: 'reviewer1', password: 'reviewer123', role: 'reviewer' },
    { username: 'manager1',  password: 'manager123',  role: 'manager' },
    { username: 'finance1',  password: 'finance123',  role: 'finance' },
    { username: 'viewer1',   password: 'viewer123',   role: 'viewer' },
];

// ─── Login ────────────────────────────────────────────────────────────────────
function Login() {
    const [username, setUsername]   = useState('');
    const [password, setPassword]   = useState('');
    const [error, setError]         = useState('');
    const [loading, setLoading]     = useState(false);
    const [showPw, setShowPw]       = useState(false);
    const [testOpen, setTestOpen]   = useState(false);
    const navigate = useNavigate();

    useEffect(() => { injectLoginStyles(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await authService.login(username, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    const fillTestUser = (u) => {
        setUsername(u.username);
        setPassword(u.password);
        setTestOpen(false);
        setError('');
    };

    return React.createElement('div', { className: 'lg-root' },

        // Background
        React.createElement('div', { className: 'lg-bg' },
            React.createElement('div', { className: 'lg-bg-orb lg-bg-orb-1' }),
            React.createElement('div', { className: 'lg-bg-orb lg-bg-orb-2' }),
            React.createElement('div', { className: 'lg-bg-orb lg-bg-orb-3' }),
            React.createElement('div', { className: 'lg-bg-grid' }),
        ),

        React.createElement('div', { className: 'lg-wrap' },
            React.createElement('div', { className: 'lg-card' },

                // Brand header
                React.createElement('div', { className: 'lg-brand-area' },
                    React.createElement('div', { className: 'lg-brand-row' },
                        React.createElement('div', { className: 'lg-brand-icon' }, '₿'),
                        React.createElement('div', null,
                            React.createElement('div', { className: 'lg-brand-name' }, 'InvoiceOS'),
                            React.createElement('div', { className: 'lg-brand-sub' }, 'Finance Suite')
                        )
                    ),
                    React.createElement('h1', { className: 'lg-welcome-title' }, 'Welcome back'),
                    React.createElement('p', { className: 'lg-welcome-sub' }, 'Sign in to your account to continue')
                ),

                // Form
                React.createElement('div', { className: 'lg-form-area' },

                    // Error
                    error && React.createElement('div', { className: 'lg-error' },
                        React.createElement('div', { className: 'lg-error-dot' }),
                        error
                    ),

                    React.createElement('form', { onSubmit: handleSubmit },

                        // Username
                        React.createElement('div', { className: 'lg-field' },
                            React.createElement('div', { className: 'lg-field-label' }, 'Username'),
                            React.createElement('div', { className: 'lg-input-wrap' },
                                React.createElement('span', { className: 'lg-input-icon' }, '◈'),
                                React.createElement('input', {
                                    className: 'lg-input',
                                    type: 'text',
                                    placeholder: 'Enter your username',
                                    value: username,
                                    onChange: (e) => setUsername(e.target.value),
                                    required: true,
                                    disabled: loading,
                                    autoComplete: 'username',
                                    autoFocus: true
                                })
                            )
                        ),

                        // Password
                        React.createElement('div', { className: 'lg-field' },
                            React.createElement('div', { className: 'lg-field-label' }, 'Password'),
                            React.createElement('div', { className: 'lg-input-wrap' },
                                React.createElement('span', { className: 'lg-input-icon' }, '◎'),
                                React.createElement('input', {
                                    className: 'lg-input',
                                    type: showPw ? 'text' : 'password',
                                    placeholder: '••••••••',
                                    value: password,
                                    onChange: (e) => setPassword(e.target.value),
                                    required: true,
                                    disabled: loading,
                                    autoComplete: 'current-password'
                                }),
                                React.createElement('button', {
                                    type: 'button',
                                    className: 'lg-pw-toggle',
                                    onClick: () => setShowPw(v => !v),
                                    tabIndex: -1
                                }, showPw ? 'Hide' : 'Show')
                            )
                        ),

                        // Submit
                        React.createElement('button', {
                            type: 'submit',
                            className: 'lg-submit',
                            disabled: loading || !username || !password
                        },
                            loading && React.createElement('div', { className: 'lg-submit-spinner' }),
                            loading ? 'Authenticating…' : 'Sign In'
                        )
                    )
                ),

                // Test users panel
                React.createElement('div', { className: 'lg-test-panel' },
                    React.createElement('div', {
                        className: 'lg-test-header',
                        onClick: () => setTestOpen(v => !v)
                    },
                        React.createElement('span', { className: 'lg-test-header-label' }, 'Quick Access — Test Accounts'),
                        React.createElement('span', { className: `lg-test-chevron${testOpen ? ' open' : ''}` }, '▾')
                    ),
                    React.createElement('div', { className: `lg-test-body${testOpen ? ' open' : ''}` },
                        TEST_USERS.map(u =>
                            React.createElement('div', {
                                key: u.username,
                                className: 'lg-test-user',
                                onClick: () => fillTestUser(u)
                            },
                                React.createElement('span', { className: 'lg-test-username' }, u.username),
                                React.createElement('span', { className: `lg-test-role ${u.role}` }, u.role)
                            )
                        )
                    )
                ),

                // Footer
                React.createElement('div', { className: 'lg-footer' },
                    React.createElement('span', { className: 'lg-footer-text' }, 'InvoiceOS v2'),
                    React.createElement('div', { className: 'lg-footer-dot' }),
                    React.createElement('span', { className: 'lg-footer-secure' },
                        React.createElement('div', { className: 'lg-secure-dot' }),
                        'Secured'
                    ),
                    React.createElement('div', { className: 'lg-footer-dot' }),
                    React.createElement('span', { className: 'lg-footer-text' }, 'ZA Finance Suite')
                )
            )
        )
    );
}

export default Login;