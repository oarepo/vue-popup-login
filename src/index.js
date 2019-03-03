import AuthModule from './store/auth_export';

import LoginPopupSupport from './services/login_popup_support';


const PopupAuthModule = {
    install(Vue, {
        store,
        authStateURL,
        authLoginURL,
        authLogoutURL,
        popupBlockedCallback,
    }) {

        Vue.use(LoginPopupSupport, { popupBlockedCallback, loginURL: authLoginURL });

        const authModule = new AuthModule({
            store,
            name: 'auth',
        });

        authModule.setAuthStateURL(authStateURL);
        authModule.setAuthLogoutURL(authLogoutURL);

        Vue.prototype.auth$ = authModule;

        Vue.prototype.loginPopup$.addListener(authModule.getLoginState, false);
    },
};

export {
    LoginPopupSupport,
};

export default PopupAuthModule;
