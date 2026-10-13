/*!
 * TF Widgets — WhatsApp Chat v1
 * Встраивание: <script src=".../embed.js" data-id="CLIENT_ID"></script>
 * Конфиг клиента: configs/CLIENT_ID.json
 * Плавающая кнопка WhatsApp в углу страницы. По клику открывается окно в стиле чата:
 * фото и имя менеджера, приветствие, кнопка «Chat on WhatsApp» → wa.me с готовым текстом.
 * Окно может открываться само через N секунд. Ничего не отправляется на наши серверы.
 * Все стили ограничены классом .bhw-wa, чтобы не спорить с другими виджетами и темой сайта.
 */
(function () {
    'use strict';
    var VERSION = '1.0.0';
    var LOG = '[TFW WhatsApp]';
    // Где работает живое превью BHWWhatsAppChat.render() (конфигуратор на сайте)
    var PREVIEW_DOMAINS = ['tf-widgets.com', '*.tf-widgets.com', '9ac5za-h1.myshopify.com'];

    var ICONS = {
        wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.25-.12-1.47-.72-1.7-.8s-.39-.12-.56.12-.64.8-.78.97-.29.19-.54.06a6.7 6.7 0 0 1-3.3-2.9c-.25-.43.25-.4.71-1.33a.45.45 0 0 0-.02-.42c-.06-.12-.56-1.34-.76-1.84s-.4-.41-.56-.42h-.48a.92.92 0 0 0-.66.31 2.8 2.8 0 0 0-.87 2.07 4.9 4.9 0 0 0 1 2.58 11.1 11.1 0 0 0 4.3 3.8c1.6.7 2.2.75 3 .63a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .15-1.2c-.06-.1-.23-.17-.48-.29z"/></svg>',
        close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z"/></svg>',
        send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.2 5.2 11.8 6.6l4.4 4.4H4v2h12.2l-4.4 4.4 1.4 1.4L20 12z"/></svg>'
    };

    var inlineCSS = `
        .bhw-wa { font-family: var(--bhw-font, 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif); -webkit-font-smoothing: antialiased;
            position: fixed; z-index: 2147482990; bottom: 20px; right: 20px; left: auto; margin: 0; padding: 0; line-height: 1.4; font-size: 15px; }
        .bhw-wa.bhw-left { right: auto; left: 20px; }
        .bhw-wa.bhw-in-preview { position: absolute; bottom: 16px; right: 16px; }
        .bhw-wa.bhw-in-preview.bhw-left { right: auto; left: 16px; }
        .bhw-wa *, .bhw-wa *::before, .bhw-wa *::after { box-sizing: border-box; }

        /* плавающая кнопка */
        .bhw-wa .bhw-wa-launch { position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 10px; float: right;
            height: 60px; min-width: 60px; margin: 0; padding: 0; border: 0; border-radius: 999px; cursor: pointer;
            background: var(--bhw-acc, #25d366); color: var(--bhw-acc-text, #fff); box-shadow: 0 10px 28px -8px rgba(0,0,0,.35);
            font: inherit; font-weight: 700; font-size: 15px; transition: transform .2s, box-shadow .2s; }
        .bhw-wa.bhw-left .bhw-wa-launch { float: left; }
        .bhw-wa .bhw-wa-launch:hover { transform: translateY(-2px) scale(1.03); box-shadow: 0 14px 32px -8px rgba(0,0,0,.4); }
        .bhw-wa .bhw-wa-launch svg { width: 32px; height: 32px; flex: none; }
        .bhw-wa .bhw-wa-launch.bhw-has-text { padding: 0 22px 0 16px; }
        .bhw-wa .bhw-wa-launch.bhw-has-text svg { width: 28px; height: 28px; }
        .bhw-wa .bhw-wa-dot { position: absolute; top: 1px; right: 1px; width: 14px; height: 14px; border-radius: 50%; background: #ef4444; border: 2px solid #fff; }
        .bhw-wa .bhw-wa-launch.bhw-has-text .bhw-wa-dot { top: -2px; right: 6px; }
        .bhw-wa.bhw-seen .bhw-wa-dot, .bhw-wa.bhw-open .bhw-wa-dot { display: none; }
        .bhw-wa .bhw-wa-launch .bhw-wa-ico { display: inline-flex; }
        .bhw-wa .bhw-wa-launch .bhw-wa-ico-x { display: none; }
        .bhw-wa .bhw-wa-launch .bhw-wa-ico-x svg { width: 26px; height: 26px; }
        .bhw-wa.bhw-open .bhw-wa-launch:not(.bhw-has-text) .bhw-wa-ico-wa { display: none; }
        .bhw-wa.bhw-open .bhw-wa-launch:not(.bhw-has-text) .bhw-wa-ico-x { display: inline-flex; }
        .bhw-wa .bhw-wa-launch:focus-visible, .bhw-wa .bhw-wa-x:focus-visible, .bhw-wa .bhw-wa-go:focus-visible { outline: 3px solid var(--bhw-acc, #25d366); outline-offset: 3px; }

        /* окно чата */
        .bhw-wa .bhw-wa-win { position: absolute; bottom: 76px; right: 0; width: var(--bhw-w, 360px); max-width: calc(100vw - 32px);
            border-radius: var(--bhw-r, 16px); overflow: hidden; background: var(--bhw-chat, #efeae2);
            box-shadow: 0 24px 60px -16px rgba(0,0,0,.35), 0 2px 6px rgba(0,0,0,.08);
            transform-origin: bottom right; opacity: 0; visibility: hidden; transform: translateY(12px) scale(.96);
            transition: opacity .25s ease, transform .3s cubic-bezier(.2,.8,.2,1), visibility 0s .3s; }
        .bhw-wa.bhw-left .bhw-wa-win { right: auto; left: 0; transform-origin: bottom left; }
        .bhw-wa.bhw-open .bhw-wa-win { opacity: 1; visibility: visible; transform: none; transition: opacity .25s ease, transform .3s cubic-bezier(.2,.8,.2,1), visibility 0s; }
        .bhw-wa.bhw-in-preview .bhw-wa-win { max-width: none; }

        .bhw-wa .bhw-wa-head { position: relative; display: flex; align-items: center; gap: 14px; padding: 18px 48px 18px 18px;
            background: var(--bhw-head, #128c7e); color: var(--bhw-head-text, #fff); }
        .bhw-wa .bhw-wa-ava { position: relative; flex: none; width: 52px; height: 52px; border-radius: 50%;
            background: var(--bhw-ava-bg, rgba(255,255,255,.2)); display: grid; place-items: center; font-weight: 700; font-size: 20px; }
        .bhw-wa .bhw-wa-ava img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block; }
        .bhw-wa .bhw-wa-ava i { position: absolute; right: 1px; bottom: 1px; width: 13px; height: 13px; border-radius: 50%; background: #4ade80; border: 2px solid var(--bhw-head, #128c7e); }
        .bhw-wa .bhw-wa-who { min-width: 0; }
        .bhw-wa .bhw-wa-name { display: block; margin: 0; font-size: 17px; font-weight: 700; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bhw-wa .bhw-wa-status { display: block; margin: 2px 0 0; font-size: 13.5px; opacity: .85; line-height: 1.3; }
        .bhw-wa .bhw-wa-x { position: absolute; top: 10px; right: 10px; display: grid; place-items: center; width: 32px; height: 32px; margin: 0; padding: 0;
            border: 0; border-radius: 50%; background: transparent; color: inherit; cursor: pointer; opacity: .8; box-shadow: none; }
        .bhw-wa .bhw-wa-x:hover { opacity: 1; background: rgba(255,255,255,.14); }
        .bhw-wa .bhw-wa-x svg { width: 18px; height: 18px; }

        .bhw-wa .bhw-wa-body { position: relative; padding: 22px 18px 20px; min-height: 120px;
            background-image: radial-gradient(rgba(0,0,0,.045) 1px, transparent 1.4px); background-size: 14px 14px; }
        .bhw-wa .bhw-wa-msg { position: relative; display: inline-block; max-width: 88%; margin: 0; padding: 10px 14px 8px; border-radius: 0 12px 12px 12px;
            background: var(--bhw-bubble, #fff); color: var(--bhw-bubble-text, #111); box-shadow: 0 1px 1.5px rgba(0,0,0,.13);
            font-size: 15px; line-height: 1.45; white-space: pre-line; overflow-wrap: anywhere; }
        .bhw-wa .bhw-wa-msg::before { content: ''; position: absolute; top: 0; left: -8px; border: 8px solid transparent; border-top-color: var(--bhw-bubble, #fff); border-right-color: var(--bhw-bubble, #fff); border-width: 0 8px 10px 0; }
        .bhw-wa .bhw-wa-time { display: block; margin-top: 2px; text-align: right; font-size: 11.5px; opacity: .5; }
        .bhw-wa .bhw-wa-typing { display: none; gap: 4px; padding: 14px 16px; border-radius: 0 12px 12px 12px; background: var(--bhw-bubble, #fff); width: max-content; box-shadow: 0 1px 1.5px rgba(0,0,0,.13); }
        .bhw-wa .bhw-wa-typing b { width: 7px; height: 7px; border-radius: 50%; background: #9ca3af; animation: bhw-wa-dot 1s infinite ease-in-out; }
        .bhw-wa .bhw-wa-typing b:nth-child(2) { animation-delay: .15s; } .bhw-wa .bhw-wa-typing b:nth-child(3) { animation-delay: .3s; }
        .bhw-wa.bhw-typing .bhw-wa-typing { display: flex; }
        .bhw-wa.bhw-typing .bhw-wa-msg { display: none; }
        .bhw-wa .bhw-wa-msg.bhw-pop { animation: bhw-wa-pop .3s cubic-bezier(.2,.8,.2,1); }

        .bhw-wa .bhw-wa-foot { padding: 0 18px 20px; text-align: center; }
        .bhw-wa .bhw-wa-go { display: inline-flex; align-items: center; justify-content: center; gap: 10px; width: 100%; margin: 0; padding: 13px 20px;
            border: 0; border-radius: 999px; background: var(--bhw-acc, #25d366); color: var(--bhw-acc-text, #fff); text-decoration: none !important;
            font: inherit; font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 8px 18px -8px rgba(0,0,0,.35); transition: transform .2s, filter .2s; }
        .bhw-wa .bhw-wa-go:hover { transform: translateY(-1px); filter: brightness(1.05); }
        .bhw-wa .bhw-wa-go svg { width: 22px; height: 22px; flex: none; }
        .bhw-wa .bhw-wa-go.bhw-off { opacity: .55; pointer-events: none; }

        @keyframes bhw-wa-dot { 0%, 60%, 100% { transform: none; opacity: .5; } 30% { transform: translateY(-4px); opacity: 1; } }
        @keyframes bhw-wa-pop { from { opacity: 0; transform: translateY(6px) scale(.97); } to { opacity: 1; transform: none; } }
        @keyframes bhw-wa-in { from { opacity: 0; transform: scale(.6); } to { opacity: 1; transform: none; } }
        .bhw-wa.bhw-enter .bhw-wa-launch { animation: bhw-wa-in .4s cubic-bezier(.2,.8,.2,1); }

        @media (max-width: 480px) {
            .bhw-wa:not(.bhw-in-preview) { bottom: 14px; right: 14px; }
            .bhw-wa.bhw-left:not(.bhw-in-preview) { right: auto; left: 14px; }
            .bhw-wa:not(.bhw-in-preview) .bhw-wa-win { width: calc(100vw - 28px); bottom: 72px; }
        }
        @media (prefers-reduced-motion: reduce) { .bhw-wa, .bhw-wa * { animation: none !important; transition: none !important; } }

        /* защита от тем сайта, которые красят текст, кнопки и ссылки через !important */
        .bhw-wa .bhw-wa-head, .bhw-wa .bhw-wa-head :where(*) { color: var(--bhw-head-text, #fff) !important; }
        .bhw-wa .bhw-wa-msg, .bhw-wa .bhw-wa-msg :where(*) { color: var(--bhw-bubble-text, #111) !important; }
        .bhw-wa .bhw-wa-launch, .bhw-wa .bhw-wa-launch :where(*), .bhw-wa .bhw-wa-go, .bhw-wa .bhw-wa-go :where(*) { color: var(--bhw-acc-text, #fff) !important; }
        .bhw-wa .bhw-wa-launch, .bhw-wa .bhw-wa-go { background: var(--bhw-acc, #25d366) !important; border: 0 !important; }
        .bhw-wa .bhw-wa-x { background: transparent !important; border: 0 !important; box-shadow: none !important; }
        .bhw-wa .bhw-wa-x:hover { background: rgba(255,255,255,.14) !important; }
        .bhw-wa :where(p, span, b, a, button, strong) { font-family: inherit !important; letter-spacing: normal; text-transform: none; }
    `;

    /* =========================================================
       ПУБЛИЧНЫЕ API
       ========================================================= */
    window.BusinessHoursWidgets = window.BusinessHoursWidgets || {};
    window.BusinessHoursWidgets.whatsappChat = window.BusinessHoursWidgets.whatsappChat || {};

    // Живое превью для конфигуратора: BHWWhatsAppChat.render(container, config) -> { update, open, close, destroy }
    var api = window.BHWWhatsAppChat = window.BHWWhatsAppChat || {};
    api.version = VERSION;
    api.defaults = getDefaultConfig;
    api.checkAccess = bhwCheckAccess;
    api.render = function (container, config) {
        var noop = { destroy: function () {}, update: function () {}, open: function () {}, close: function () {}, el: null };
        if (!bhwCheckAccess({ domains: PREVIEW_DOMAINS }).ok) { console.warn(LOG, 'preview is only available on tf-widgets.com'); return noop; }
        injectBaseStyles();
        if (container._bhwWaDestroy) container._bhwWaDestroy();
        var cls = container.__bhwWaClass || (container.__bhwWaClass = 'bhw-wa-preview-' + Math.random().toString(36).slice(2, 8));
        var widget = null;
        var ctrl = {
            el: null,
            update: function (cfg) {
                var open = widget ? widget.isOpen() : true;
                if (widget) widget.destroy();
                widget = mountWidget(normalizeConfig(cfg || {}), cls, 'preview', { preview: container, open: open });
                ctrl.el = widget.root;
            },
            open: function () { if (widget) widget.open(); },
            close: function () { if (widget) widget.close(); },
            destroy: function () { if (widget) widget.destroy(); widget = null; ctrl.el = null; container._bhwWaDestroy = null; }
        };
        ctrl.update(config);
        container._bhwWaDestroy = ctrl.destroy;
        return ctrl;
    };

    /* =========================================================
       АВТОЗАПУСК ПО <script data-id="..."> (только свой тег)
       ========================================================= */
    try {
        var currentScript = document.currentScript || (function () {
            var scripts = document.getElementsByTagName('script');
            return scripts[scripts.length - 1];
        })();
        if (currentScript && currentScript.dataset && currentScript.dataset.id && currentScript.dataset.bhwMounted !== '1') {
            currentScript.dataset.bhwMounted = '1';
            var debug = currentScript.dataset.debug === '1';
            var clientId = normalizeId(currentScript.dataset.id);
            var baseUrl = getBasePath(currentScript.src);
            loadConfig(clientId, baseUrl)
                .then(function (fetched) {
                    var access = bhwCheckAccess(fetched);
                    if (!access.ok) {
                        console.warn(LOG, 'widget "' + clientId + '" is not active on ' + (location.hostname || 'this page') + ': ' + access.reason);
                        return;
                    }
                    var cfg = normalizeConfig(fetched);
                    if (debug) console.log(LOG, 'config "' + clientId + '":', cfg);
                    injectBaseStyles();
                    var mount = function () {
                        var w = mountWidget(cfg, 'bhw-wa-' + clientId.replace(/[^a-z0-9_-]/gi, '') + '-' + Date.now(), clientId, {});
                        window.BusinessHoursWidgets.whatsappChat[clientId] = w;
                    };
                    if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
                })
                .catch(function (error) {
                    console.warn(LOG, 'config "' + clientId + '" not loaded:', error.message);
                });
        }
    } catch (error) {
        console.error(LOG, 'critical error:', error);
    }

    /* =========================================================
       ФУНКЦИИ
       ========================================================= */
    function injectBaseStyles() {
        if (!document.getElementById('tfw-whatsapp-chat-styles')) {
            var style = document.createElement('style');
            style.id = 'tfw-whatsapp-chat-styles';
            style.textContent = inlineCSS;
            (document.head || document.documentElement).appendChild(style);
        }
    }

    /* ---------------------------------------------------------
       ДОСТУП (общий блок для всех виджетов TF Widgets — копировать без изменений)
       --------------------------------------------------------- */
    function bhwCheckAccess(config) {
        config = config || {};
        if (config.active === false) return { ok: false, reason: 'widget is switched off ("active": false)' };
        var host = String(location.hostname || '').toLowerCase().replace(/^www\./, '');
        if (!host || host === 'localhost' || host === '127.0.0.1' || location.protocol === 'file:') return { ok: true };
        var list = config.domains;
        if (typeof list === 'string') list = list.split(/[\s,]+/);
        if (!Array.isArray(list) || !list.length) return { ok: false, reason: 'no "domains" in config' };
        for (var i = 0; i < list.length; i++) {
            var d = String(list[i] || '').trim().toLowerCase()
                .replace(/^[a-z]+:\/\//, '').replace(/[\/:].*$/, '').replace(/^www\./, '');
            if (!d) continue;
            if (d.indexOf('*.') === 0) {
                var base = d.slice(2);
                if (host === base || host.slice(-(base.length + 1)) === '.' + base) return { ok: true };
            } else if (host === d) {
                return { ok: true };
            }
        }
        return { ok: false, reason: 'domain is not in "domains"' };
    }

    function normalizeId(id) { return String(id || 'demo').replace(/\.(json|js)$/i, ''); }
    function getBasePath(src) {
        if (!src) return './';
        try { var url = new URL(src, location.href); return url.origin + url.pathname.replace(/\/[^\/]*$/, '/'); }
        catch (error) { return './'; }
    }
    function loadConfig(clientId, baseUrl) {
        if (clientId === 'local') {
            var el = document.querySelector('#bhw-wa-local-config');
            if (!el) return Promise.reject(new Error('#bhw-wa-local-config not found'));
            try { return Promise.resolve(JSON.parse(el.textContent)); } catch (e) { return Promise.reject(e); }
        }
        var url = baseUrl + 'configs/' + encodeURIComponent(clientId) + '.json?v=' + Date.now();
        return fetch(url, { cache: 'no-store', headers: { 'Accept': 'application/json' } })
            .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
    }

    function getDefaultConfig() {
        return {
            phone: '',                      // номер в международном формате, только цифры: 15551234567
            message: '',                    // готовый текст, который подставится в WhatsApp
            agent: {
                name: 'Support',
                status: 'Typically replies within an hour',
                photo: '',                  // ссылка на фото (https://...); пусто — первая буква имени
                online: true                // зелёная точка у фото
            },
            greeting: 'Hi there 👋\nHow can I help you?',
            buttonText: 'Chat on WhatsApp',
            position: 'right',              // right | left
            launcher: { text: '', badge: true },   // text — надпись на кнопке (пусто — только иконка); badge — красная точка
            autoOpen: { enabled: false, delay: 10 }, // открыть окно само через delay секунд (один раз за визит)
            style: {
                fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
                colors: {
                    header: '#128c7e',
                    headerText: '#ffffff',
                    chat: '#efeae2',
                    accent: '#25d366',
                    accentText: '#ffffff'
                },
                sizes: { width: 360, radius: 16 }
            }
        };
    }

    function normalizeConfig(raw) {
        raw = raw || {};
        var cfg = mergeDeep(getDefaultConfig(), raw);
        cfg.position = cfg.position === 'left' ? 'left' : 'right';
        cfg.phone = String(cfg.phone || '').replace(/\D/g, '').slice(0, 16);
        cfg.autoOpen.delay = Math.min(120, Math.max(1, num(cfg.autoOpen.delay, 10)));
        cfg.style.sizes.width = Math.min(440, Math.max(280, num(cfg.style.sizes.width, 360)));
        cfg.style.sizes.radius = Math.min(28, Math.max(0, num(cfg.style.sizes.radius, 16)));
        return cfg;
    }

    function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
    function mergeDeep(base, over) {
        var out = {};
        Object.keys(base || {}).forEach(function (k) { out[k] = isObj(base[k]) ? mergeDeep(base[k], {}) : base[k]; });
        Object.keys(over || {}).forEach(function (k) {
            var v = over[k];
            if (isObj(v) && isObj(out[k])) out[k] = mergeDeep(out[k], v);
            else if (v !== undefined) out[k] = v;
        });
        return out;
    }
    function cssValue(v, fallback) { if (v === undefined || v === null || v === '') return fallback; return String(v).replace(/[;{}<>]/g, ''); }
    function num(v, fallback) { var n = Number(v); return isFinite(n) && v !== '' && v !== null ? n : fallback; }
    function escapeHtml(text) {
        return String(text == null ? '' : text).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function safePhoto(url) { var u = String(url || '').trim(); return /^https:\/\/[^\s"'<>]+$/i.test(u) ? u : ''; }
    function waLink(cfg) {
        if (!cfg.phone) return '';
        return 'https://wa.me/' + cfg.phone + (cfg.message ? '?text=' + encodeURIComponent(cfg.message) : '');
    }
    function nowTime() {
        try { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
        catch (e) { var d = new Date(); return d.getHours() + ':' + ('0' + d.getMinutes()).slice(-2); }
    }
    function hexToRgb(hex) {
        var h = String(hex || '').replace('#', '');
        if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
        if (!/^[0-9a-f]{6}$/i.test(h)) return null;
        var n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function isDark(hex) {
        var c = hexToRgb(hex); if (!c) return false;
        return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255 < 0.45;
    }

    /* что посетитель уже видел/закрыл — помним в его браузере */
    function store(kind, id, val) {
        var key = 'tfw_wa_' + kind + '_' + id;
        try {
            var s = kind === 'closed' ? sessionStorage : localStorage;
            if (val === undefined) return s.getItem(key);
            s.setItem(key, val);
        } catch (e) {}
        return null;
    }

    function applyCustomStyles(uniqueClass, style) {
        var id = 'bhw-wa-style-' + uniqueClass;
        var el = document.getElementById(id);
        if (!el) { el = document.createElement('style'); el.id = id; (document.head || document.documentElement).appendChild(el); }
        var s = style || {}, c = s.colors || {}, z = s.sizes || {};
        var chat = cssValue(c.chat, '#efeae2');
        var darkChat = isDark(chat);
        el.textContent = '.' + uniqueClass + '{' +
            '--bhw-font:' + cssValue(s.fontFamily, "'Inter', system-ui, sans-serif") + ';' +
            '--bhw-head:' + cssValue(c.header, '#128c7e') + ';' +
            '--bhw-head-text:' + cssValue(c.headerText, '#ffffff') + ';' +
            '--bhw-chat:' + chat + ';' +
            '--bhw-bubble:' + (darkChat ? '#202c33' : '#ffffff') + ';' +
            '--bhw-bubble-text:' + (darkChat ? '#e9edef' : '#111111') + ';' +
            '--bhw-acc:' + cssValue(c.accent, '#25d366') + ';' +
            '--bhw-acc-text:' + cssValue(c.accentText, '#ffffff') + ';' +
            '--bhw-w:' + Math.min(440, Math.max(280, num(z.width, 360))) + 'px;' +
            '--bhw-r:' + Math.min(28, Math.max(0, num(z.radius, 16))) + 'px;' +
            '}';
        return id;
    }

    function mountWidget(cfg, uniqueClass, id, opts) {
        opts = opts || {};
        var preview = opts.preview || null;
        var styleId = applyCustomStyles(uniqueClass, cfg.style);
        var link = waLink(cfg);
        var name = String(cfg.agent.name || '').trim();
        var photo = safePhoto(cfg.agent.photo);
        var initial = escapeHtml((name.charAt(0) || '?').toUpperCase());
        var launchText = String(cfg.launcher.text || '').trim();
        var seen = !preview && store('seen', id) === '1';

        var root = document.createElement('div');
        root.id = 'tfw-whatsapp-chat-' + id;
        root.className = 'bhw-wa ' + uniqueClass + (cfg.position === 'left' ? ' bhw-left' : '') +
            (preview ? ' bhw-in-preview' : ' bhw-enter') + (seen || !cfg.launcher.badge ? ' bhw-seen' : '');

        root.innerHTML =
            '<div class="bhw-wa-win" role="dialog" aria-label="' + escapeHtml(name ? 'Chat with ' + name : 'WhatsApp chat') + '">' +
                '<div class="bhw-wa-head">' +
                    '<span class="bhw-wa-ava">' + (photo ? '<img alt="" src="' + escapeHtml(photo) + '">' : initial) + (cfg.agent.online ? '<i></i>' : '') + '</span>' +
                    '<span class="bhw-wa-who">' +
                        (name ? '<strong class="bhw-wa-name">' + escapeHtml(name) + '</strong>' : '') +
                        (cfg.agent.status ? '<span class="bhw-wa-status">' + escapeHtml(cfg.agent.status) + '</span>' : '') +
                    '</span>' +
                    '<button class="bhw-wa-x" type="button" aria-label="Close chat">' + ICONS.close + '</button>' +
                '</div>' +
                '<div class="bhw-wa-body">' +
                    '<div class="bhw-wa-typing" aria-hidden="true"><b></b><b></b><b></b></div>' +
                    (cfg.greeting ? '<p class="bhw-wa-msg">' + escapeHtml(cfg.greeting) + '<span class="bhw-wa-time">' + escapeHtml(nowTime()) + '</span></p>' : '') +
                '</div>' +
                '<div class="bhw-wa-foot">' +
                    '<a class="bhw-wa-go' + (link ? '' : ' bhw-off') + '"' + (link ? ' href="' + escapeHtml(link) + '" target="_blank" rel="noopener noreferrer"' : ' aria-disabled="true"') + '>' +
                        ICONS.wa + '<span>' + escapeHtml(cfg.buttonText || 'Chat on WhatsApp') + '</span></a>' +
                '</div>' +
            '</div>' +
            '<button class="bhw-wa-launch' + (launchText ? ' bhw-has-text' : '') + '" type="button" aria-expanded="false" aria-label="' + escapeHtml(launchText || 'Chat on WhatsApp') + '">' +
                '<span class="bhw-wa-ico bhw-wa-ico-wa">' + ICONS.wa + '</span>' +
                '<span class="bhw-wa-ico bhw-wa-ico-x">' + ICONS.close + '</span>' +
                (launchText ? '<span>' + escapeHtml(launchText) + '</span>' : '') +
                '<span class="bhw-wa-dot" aria-hidden="true"></span>' +
            '</button>';

        (preview || document.body).appendChild(root);

        var launch = root.querySelector('.bhw-wa-launch');
        var img = root.querySelector('.bhw-wa-ava img');
        if (img) img.addEventListener('error', function () { var a = img.parentNode; img.remove(); a.insertAdjacentHTML('afterbegin', initial); });

        var cleanups = [], timers = [], greeted = !!preview;
        function on(t, e, h, o) { t.addEventListener(e, h, o); cleanups.push(function () { t.removeEventListener(e, h, o); }); }
        function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }

        function greet() {
            if (greeted) return;
            greeted = true;
            var msg = root.querySelector('.bhw-wa-msg');
            if (!msg) return;
            root.classList.add('bhw-typing');
            later(function () {
                root.classList.remove('bhw-typing');
                msg.classList.add('bhw-pop');
            }, 1100);
        }

        var widget = {
            root: root, config: cfg, id: id,
            isOpen: function () { return root.classList.contains('bhw-open'); },
            open: function () {
                if (widget.isOpen()) return;
                root.classList.add('bhw-open');
                launch.setAttribute('aria-expanded', 'true');
                if (!preview) { store('seen', id, '1'); root.classList.add('bhw-seen'); }
                greet();
            },
            close: function (byVisitor) {
                if (!widget.isOpen()) return;
                root.classList.remove('bhw-open');
                launch.setAttribute('aria-expanded', 'false');
                if (byVisitor && !preview) store('closed', id, '1');
            },
            toggle: function () { if (widget.isOpen()) widget.close(true); else widget.open(); },
            destroy: function () {
                cleanups.forEach(function (f) { try { f(); } catch (e) {} });
                timers.forEach(clearTimeout);
                root.remove();
                var s = document.getElementById(styleId); if (s) s.remove();
            }
        };

        on(launch, 'click', function () { widget.toggle(); });
        on(root.querySelector('.bhw-wa-x'), 'click', function () { widget.close(true); if (!preview) launch.focus(); });
        on(document, 'keydown', function (e) { if (e.key === 'Escape' && widget.isOpen() && !preview) widget.close(true); });
        on(root.querySelector('.bhw-wa-go'), 'click', function (e) { if (!link) e.preventDefault(); });

        if (preview) {
            if (opts.open !== false) widget.open();
        } else if (cfg.autoOpen.enabled && store('closed', id) !== '1') {
            later(function () { if (store('closed', id) !== '1') widget.open(); }, cfg.autoOpen.delay * 1000);
        }
        return widget;
    }
})();
