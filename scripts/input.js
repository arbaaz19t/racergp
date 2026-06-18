/**
 * input.js — Keyboard and touch input with nitro, handbrake, and pause.
 */
window.RacingGame = window.RacingGame || {};

class InputManager {
    constructor() {
        this.keys = {};
        this.touchState = {
            up: false, down: false, left: false, right: false,
            nitro: false, handbrake: false
        };
        this.mobile = this._detectMobile();
        this.touchElements = null;
        this._handlers = {};
        this._bindKeyboard();
    }

    getState() {
        return {
            up:       !!(this.keys['KeyW'] || this.keys['ArrowUp'] || this.touchState.up),
            down:     !!(this.keys['KeyS'] || this.keys['ArrowDown'] || this.touchState.down),
            left:     !!(this.keys['KeyA'] || this.keys['ArrowLeft'] || this.touchState.left),
            right:    !!(this.keys['KeyD'] || this.keys['ArrowRight'] || this.touchState.right),
            nitro:    !!(this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.touchState.nitro),
            handbrake: !!(this.keys['Space'] || this.touchState.handbrake)
        };
    }

    isMobile() { return this.mobile; }

    createTouchControls(container, onPause) {
        if (this.touchElements) return;

        const root = document.createElement('div');
        root.id = 'touch-controls';

        const btnBase = `
            pointer-events: auto;
            border: 2px solid rgba(255,255,255,0.3);
            background: rgba(0,0,0,0.45);
            color: #fff;
            font-family: system-ui, sans-serif;
            font-weight: 700;
            border-radius: 12px;
            touch-action: manipulation;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
        `;

        const makeBtn = (id, label, extra, cls) => {
            const btn = document.createElement('button');
            btn.id = id;
            btn.className = 'touch-btn ' + (cls || '');
            btn.textContent = label;
            btn.style.cssText = btnBase + extra;
            btn.addEventListener('contextmenu', e => e.preventDefault());
            return btn;
        };

        const steering = document.createElement('div');
        steering.className = 'touch-steering';
        const btnLeft = makeBtn('touch-left', '\u25C4', 'width:64px;height:64px;font-size:26px;', '');
        const btnRight = makeBtn('touch-right', '\u25BA', 'width:64px;height:64px;font-size:26px;', '');
        steering.appendChild(btnLeft);
        steering.appendChild(btnRight);

        const pedals = document.createElement('div');
        pedals.className = 'touch-pedals';
        const btnBrake = makeBtn('touch-brake', 'BRAKE', 'width:58px;height:64px;font-size:11px;', 'brake-btn');
        const btnGas = makeBtn('touch-gas', 'GAS', 'width:58px;height:64px;font-size:11px;', 'gas-btn');
        const btnNitro = makeBtn('touch-nitro', 'NITRO', 'width:58px;height:48px;font-size:10px;color:#00e5ff;', 'nitro-btn');
        const btnHand = makeBtn('touch-hand', 'DRIFT', 'width:58px;height:48px;font-size:10px;color:#ffe500;', 'hand-btn');
        pedals.appendChild(btnHand);
        pedals.appendChild(btnBrake);
        pedals.appendChild(btnNitro);
        pedals.appendChild(btnGas);

        const btnPause = makeBtn('touch-pause', '\u23F8', '', '');
        btnPause.id = 'touch-pause';

        const bind = (el, key) => {
            const on = () => { this.touchState[key] = true; el.classList.add('active'); };
            const off = () => { this.touchState[key] = false; el.classList.remove('active'); };
            el.addEventListener('touchstart', e => { e.preventDefault(); on(); }, { passive: false });
            el.addEventListener('touchend', e => { e.preventDefault(); off(); }, { passive: false });
            el.addEventListener('touchcancel', off);
        };

        bind(btnLeft, 'left');
        bind(btnRight, 'right');
        bind(btnGas, 'up');
        bind(btnBrake, 'down');
        bind(btnNitro, 'nitro');
        bind(btnHand, 'handbrake');

        if (typeof onPause === 'function') {
            btnPause.addEventListener('touchstart', e => { e.preventDefault(); onPause(); }, { passive: false });
        }

        root.appendChild(steering);
        root.appendChild(pedals);
        root.appendChild(btnPause);
        container.appendChild(root);
        this.touchElements = root;
    }

    removeTouchControls() {
        if (this.touchElements) {
            this.touchElements.parentNode?.removeChild(this.touchElements);
            this.touchElements = null;
        }
        this.touchState = { up: false, down: false, left: false, right: false, nitro: false, handbrake: false };
    }

    _bindKeyboard() {
        const suppressed = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);
        this._handlers.keydown = (e) => {
            this.keys[e.code] = true;
            if (suppressed.has(e.code)) e.preventDefault();
            if (e.code === 'Space') e.preventDefault();
        };
        this._handlers.keyup = (e) => { this.keys[e.code] = false; };
        window.addEventListener('keydown', this._handlers.keydown);
        window.addEventListener('keyup', this._handlers.keyup);
    }

    _detectMobile() {
        const ua = /Android|iPhone|iPad|iPod|webOS|BlackBerry/i.test(navigator.userAgent);
        return ua || ('ontouchstart' in window && window.innerWidth < 1024);
    }

    destroy() {
        if (this._handlers.keydown) window.removeEventListener('keydown', this._handlers.keydown);
        if (this._handlers.keyup) window.removeEventListener('keyup', this._handlers.keyup);
        this.removeTouchControls();
        this.keys = {};
    }
}

window.RacingGame.InputManager = InputManager;
