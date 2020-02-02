import AuthModule from './store/auth_export'
import LoginPopupSupport from './services/login_popup_support'
import { Module } from 'vuex-class-modules'

const PopupAuthModule = {
    install (Vue, {
        store,
        authStateURL,
        authLoginURL,
        authLogoutURL,
        popupBlockedCallback,
        iframeCreator,
        storeModule = AuthModule,
        storeModuleOptions = {}
    }) {

        Vue.use(LoginPopupSupport, { popupBlockedCallback, iframeCreator, loginURL: authLoginURL })
        const module = Module(storeModule)
        // eslint-disable-next-line
        const authModule = new module({
            store,
            name: 'auth',
            ...storeModuleOptions
        })

        authModule.setAuthStateURL(authStateURL)
        authModule.setAuthLogoutURL(authLogoutURL)

        Vue.prototype.auth$ = authModule
        Vue.prototype.$auth = authModule

        Vue.prototype.loginPopup$.addListener(authModule.getLoginState, false)

        this.store = authModule
    }
}

export {
    LoginPopupSupport,
    AuthModule
}

export default PopupAuthModule
