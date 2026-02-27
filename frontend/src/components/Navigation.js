import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth';

// Inject global styles once
const injectStyles = () => {
    if (document.getElementById('nav-global-styles')) return;
    const style = document.createElement('style');
    style.id = 'nav-global-styles';
    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        :root {
            --nav-bg: rgba(8, 10, 18, 0.92);
            --nav-border: rgba(255, 255, 255, 0.06);
            --accent-gold: #E6B84A;
            --accent-gold-dim: rgba(230, 184, 74, 0.15);
            --accent-gold-glow: rgba(230, 184, 74, 0.35);
            --text-primary: #F0F2F8;
            --text-muted: rgba(240, 242, 248, 0.45);
            --glass-bg: rgba(255, 255, 255, 0.04);
            --glass-hover: rgba(255, 255, 255, 0.08);
            --glass-border: rgba(255, 255, 255, 0.08);
        }

        #app-nav {
            font-family: 'DM Sans', sans-serif;
            background: var(--nav-bg);
            backdrop-filter: blur(24px) saturate(180%);
            -webkit-backdrop-filter: blur(24px) saturate(180%);
            border-bottom: 1px solid var(--nav-border);
            padding: 0 32px;
            height: 64px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            z-index: 1000;
            box-shadow: 0 1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        #app-nav::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--accent-gold-glow), transparent);
            opacity: 0.6;
        }

        .nav-left {
            display: flex;
            align-items: center;
            gap: 36px;
        }

        .nav-brand {
            display: flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
            cursor: pointer;
            flex-shrink: 0;
        }

        .nav-brand-icon {
            width: 34px;
            height: 34px;
            background: linear-gradient(135deg, #E6B84A 0%, #C99A2E 100%);
            border-radius: 9px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            box-shadow: 0 2px 12px rgba(230, 184, 74, 0.3), inset 0 1px 0 rgba(255,255,255,0.2);
            flex-shrink: 0;
        }

        .nav-brand-text {
            font-family: 'Syne', sans-serif;
            font-size: 16px;
            font-weight: 700;
            color: var(--text-primary);
            letter-spacing: 0.01em;
            line-height: 1;
        }

        .nav-brand-sub {
            font-family: 'DM Sans', sans-serif;
            font-size: 10px;
            font-weight: 400;
            color: var(--text-muted);
            letter-spacing: 0.12em;
            text-transform: uppercase;
            line-height: 1;
            margin-top: 2px;
        }

        .nav-divider {
            width: 1px;
            height: 28px;
            background: var(--glass-border);
            flex-shrink: 0;
        }

        .nav-links {
            display: flex;
            align-items: center;
            gap: 2px;
        }

        .nav-item {
            position: relative;
            background: transparent;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            font-family: 'DM Sans', sans-serif;
            font-size: 13.5px;
            font-weight: 500;
            padding: 7px 14px;
            border-radius: 8px;
            transition: color 0.2s ease, background 0.2s ease;
            display: flex;
            align-items: center;
            gap: 7px;
            white-space: nowrap;
            letter-spacing: 0.01em;
        }

        .nav-item:hover {
            color: var(--text-primary);
            background: var(--glass-hover);
        }

        .nav-item.active {
            color: var(--accent-gold);
            background: var(--accent-gold-dim);
        }

        .nav-item.active::after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 50%;
            transform: translateX(-50%);
            width: 20px;
            height: 2px;
            background: var(--accent-gold);
            border-radius: 2px 2px 0 0;
        }

        .nav-item-icon {
            font-size: 14px;
            line-height: 1;
            opacity: 0.85;
        }

        .nav-right {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .nav-user {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 6px 12px 6px 8px;
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            border-radius: 40px;
            cursor: default;
            transition: background 0.2s;
        }

        .nav-avatar {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3a3f5c, #2a2d3e);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            color: var(--accent-gold);
            font-family: 'Syne', sans-serif;
            flex-shrink: 0;
            border: 1px solid rgba(230, 184, 74, 0.2);
        }

        .nav-username {
            font-size: 13px;
            font-weight: 500;
            color: var(--text-primary);
            letter-spacing: 0.01em;
        }

        .role-badge {
            padding: 2px 8px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            font-family: 'DM Sans', sans-serif;
        }

        .role-admin    { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
        .role-finance  { background: rgba(34,197,94,0.12); color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }
        .role-manager  { background: rgba(59,130,246,0.12); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2); }
        .role-reviewer { background: rgba(230,184,74,0.12); color: var(--accent-gold); border: 1px solid rgba(230,184,74,0.2); }
        .role-viewer   { background: rgba(148,163,184,0.1); color: #94a3b8; border: 1px solid rgba(148,163,184,0.15); }

        .logout-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 7px 16px;
            background: rgba(239, 68, 68, 0.08);
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: 8px;
            color: #f87171;
            font-family: 'DM Sans', sans-serif;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            letter-spacing: 0.01em;
        }

        .logout-btn:hover {
            background: rgba(239, 68, 68, 0.16);
            border-color: rgba(239, 68, 68, 0.4);
            color: #fca5a5;
        }

        .logout-icon {
            font-size: 13px;
            line-height: 1;
        }

        @media (max-width: 900px) {
            #app-nav { padding: 0 16px; }
            .nav-brand-sub { display: none; }
            .nav-links { gap: 0; }
            .nav-item { padding: 7px 10px; font-size: 13px; }
        }
    `;
    document.head.appendChild(style);
};

// Nav icon map (cleaner SVG-style emoji alternatives or keep emoji)
const NAV_ICONS = {
    '/dashboard': '◈',
    '/upload': '↑',
    '/approvals': '◎',
    '/insights': '⬡',
    '/reports': '≡',
};

function Navigation() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [currentPath, setCurrentPath] = useState(window.location.pathname);

    useEffect(() => {
        injectStyles();
        const handleNavChange = () => setCurrentPath(window.location.pathname);
        window.addEventListener('popstate', handleNavChange);
        return () => window.removeEventListener('popstate', handleNavChange);
    }, []);

    const handleLogout = () => {
        authService.logout();
        navigate('/');
    };

    const handleNav = (path) => {
        navigate(path);
        setCurrentPath(path);
    };

    const getMenuItems = () => {
        const items = [
            { label: 'Dashboard', path: '/dashboard', roles: ['admin', 'reviewer', 'manager', 'finance', 'viewer'] }
        ];

        if (['admin', 'reviewer'].includes(user?.role)) {
            items.push({ label: 'Upload', path: '/upload', roles: ['admin', 'reviewer'] });
        }

        if (['reviewer', 'manager', 'finance', 'admin'].includes(user?.role)) {
            items.push({ label: 'Approvals', path: '/approvals', roles: ['reviewer', 'manager', 'finance', 'admin'] });
        }

        items.push({ label: 'Insights', path: '/insights', roles: ['admin', 'reviewer', 'manager', 'finance', 'viewer'] });
        items.push({ label: 'Reports', path: '/reports', roles: ['admin', 'reviewer', 'manager', 'finance', 'viewer'] });

        return items;
    };

    const menuItems = getMenuItems();
    const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : '??';
    const roleClass = `role-${user?.role || 'viewer'}`;

    return React.createElement(
        'nav',
        { id: 'app-nav' },
        // LEFT
        React.createElement(
            'div',
            { className: 'nav-left' },
            // Brand
            React.createElement(
                'div',
                { className: 'nav-brand', onClick: () => handleNav('/dashboard') },
                React.createElement('div', { className: 'nav-brand-icon' }, '₿'),
                React.createElement(
                    'div',
                    null,
                    React.createElement('div', { className: 'nav-brand-text' }, 'InvoiceOS'),
                    React.createElement('div', { className: 'nav-brand-sub' }, 'Finance Suite')
                )
            ),
            React.createElement('div', { className: 'nav-divider' }),
            // Links
            React.createElement(
                'div',
                { className: 'nav-links' },
                menuItems.map(item =>
                    React.createElement(
                        'button',
                        {
                            key: item.path,
                            onClick: () => handleNav(item.path),
                            className: `nav-item${currentPath === item.path ? ' active' : ''}`
                        },
                        React.createElement('span', { className: 'nav-item-icon' }, NAV_ICONS[item.path] || '·'),
                        item.label
                    )
                )
            )
        ),
        // RIGHT
        React.createElement(
            'div',
            { className: 'nav-right' },
            React.createElement(
                'div',
                { className: 'nav-user' },
                React.createElement('div', { className: 'nav-avatar' }, initials),
                React.createElement('span', { className: 'nav-username' }, user?.username),
                React.createElement(
                    'span',
                    { className: `role-badge ${roleClass}` },
                    user?.role
                )
            ),
            React.createElement(
                'button',
                {
                    onClick: handleLogout,
                    className: 'logout-btn'
                },
                React.createElement('span', { className: 'logout-icon' }, '→'),
                'Sign out'
            )
        )
    );
}

export default Navigation;