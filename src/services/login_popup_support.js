class LoginPopupSupport {

    constructor(loginURL, popupBlockedCallback) {
        this._window = null;
        this._timeout = null;
        this._singleShotLoginFinishedListener = [];
        this._loginFinishedListener = [];
        this.loginURL = loginURL;
        this.popupBlockedCallback = popupBlockedCallback;

        // listen on window messages
        window.addEventListener('message', (ev) => {
            // if the message means finishing openid login in popup
            if (ev.data === 'popup-login-finished') {
                console.log('Login message received');
                this._loginFinished(true);
            }
        });
    }

    static install(Vue, { loginURL, popupBlockedCallback }) {
        const inst = new LoginPopupSupport(loginURL, popupBlockedCallback);
        Vue.prototype.loginPopup$ = inst;
    }

    addListener(listener, singleShot = true) {
        if (singleShot) {
            this._singleShotLoginFinishedListener.push(listener);
        } else {
            this._loginFinishedListener.push(listener);
        }
    }

    removeListener(listener) {
        this._singleShotLoginFinishedListener = this._singleShotLoginFinishedListener.filter(x => x !== listener);
        this._loginFinishedListener = this._loginFinishedListener.filter(x => x !== listener);
    }

    _loginFinished(receivedLoginMessage) {
        const _resolve = [
            ...this._loginFinishedListener,
            ...this._singleShotLoginFinishedListener,
        ];
        this._singleShotLoginFinishedListener = [];
        this._sendEvent(_resolve, { receivedLoginMessage });

        if (this._timeout) {
            clearTimeout(this._timeout);
            this._timeout = null;
        }

        console.log('login finished, window', this._window);
        if (this._window) {
            try {
                // if there is still the popup window, close it
                this._window.close();
            } catch (e) {
                console.error(e);
            }
            this._window = null;
        }
    }

    _sendEvent(listeners, status) {
        if (!listeners.length) {
            return;
        }
        const listener = listeners.shift();

        // if the result of the listener is a promise wait for it.
        // If not, calling resolve will fire the "then" immediately
        Promise.resolve(listener(status)).then(
            (result) => {
                // chain the result to the next listener if there is any; if not just use the previous
                // success status
                this._sendEvent(listeners, result !== undefined ? { ...result, ...status } : status);
            },
        );
    }

    _createLoginWindow() {
        // create the login popup
        this._window = window.open(this.loginURL, '_blank'); /* , 'width=500,height=500'); */
        if (!this._window) {
            console.log('Login popup blocked');
            if (this.popupBlockedCallback) {
                this.popupBlockedCallback();
            }
            this._loginFinished(false);
            return;
        }
        // listen for window being closed and when this happens finish the login process
        this._timeout = setInterval(() => {
            if (this._window.closed) {
                this._loginFinished(false);
            }
        }, 200);
    }

    async waitForLogin() {
        return new Promise((resolve) => { // , reject
            this._singleShotLoginFinishedListener.push(resolve);
            if (!this._window) {
                this._createLoginWindow();
            }
        });
    }

    startLogin() {
        this._createLoginWindow();
    }
}

export default LoginPopupSupport;
