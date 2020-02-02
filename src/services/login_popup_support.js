class LoginPopupSupport {

    constructor (loginURL, popupBlockedCallback, iframeCreator) {
        this._windowCloser = null
        this._windowCheckInterval = null
        this._singleShotLoginFinishedListener = []
        this._loginFinishedListener = []
        this.loginURL = loginURL
        this.popupBlockedCallback = popupBlockedCallback
        this.iframeCreator = iframeCreator

        // listen on window messages
        window.addEventListener('message', (ev) => {
            // if the message means finishing openid login in popup
            if (ev.data === 'popup-login-finished') {
                this._loginFinished(true)
            }
        })
    }

    static install (Vue, { loginURL, popupBlockedCallback, iframeCreator }) {
        const inst = new LoginPopupSupport(loginURL, popupBlockedCallback, iframeCreator)
        Vue.prototype.loginPopup$ = inst
    }

    addListener (listener, singleShot = true) {
        if (singleShot) {
            this._singleShotLoginFinishedListener.push(listener)
        } else {
            this._loginFinishedListener.push(listener)
        }
    }

    removeListener (listener) {
        this._singleShotLoginFinishedListener = this._singleShotLoginFinishedListener.filter(x => x !== listener)
        this._loginFinishedListener = this._loginFinishedListener.filter(x => x !== listener)
    }

    _loginFinished (receivedLoginMessage) {
        const _resolve = [
            ...this._loginFinishedListener,
            ...this._singleShotLoginFinishedListener
        ]
        this._singleShotLoginFinishedListener = []
        this._sendEvent(_resolve, { receivedLoginMessage })

        if (this._windowCheckInterval) {
            clearTimeout(this._windowCheckInterval)
            this._windowCheckInterval = null
        }

        if (this._windowCloser) {
            try {
                // if there is still the popup window, close it
                this._windowCloser()
            } catch (e) {
                console.error(e)
            }
            this._windowCloser = null
            this._window = null
        }
    }

    _sendEvent (listeners, status) {
        if (!listeners.length) {
            return
        }
        const listener = listeners.shift()

        // if the result of the listener is a promise wait for it.
        // If not, calling resolve will fire the "then" immediately
        Promise.resolve(listener(status)).then(
            (result) => {
                // chain the result to the next listener if there is any; if not just use the previous
                // success status
                this._sendEvent(listeners, result !== undefined ? { ...result, ...status } : status)
            }
        )
    }

    _createLoginWindow () {
        if (this.iframeCreator) {
            this._windowCloser = this.iframeCreator(this.loginURL)
        } else {
            // create the login popup
            const _window = window.open(this.loginURL, '_blank') /* , 'width=500,height=500'); */

            if (!_window) {
                console.error('Login popup blocked')
                if (this.popupBlockedCallback) {
                    this.popupBlockedCallback()
                }
                this._loginFinished(false)
                return
            }
            this._windowCloser = () => {
                _window.close()
            }

            // listen for window being closed and when this happens finish the login process
            this._windowCheckInterval = setInterval(() => {
                if (_window.closed) {
                    this._loginFinished(false)
                }
            }, 200)
        }
    }

    async waitForLogin () {
        return new Promise((resolve) => { // , reject
            this._singleShotLoginFinishedListener.push(resolve)
            if (!this._windowCloser) {
                this._createLoginWindow()
            }
        })
    }

    startLogin () {
        this._createLoginWindow()
    }
}

export default LoginPopupSupport
