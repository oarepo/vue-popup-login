import AuthModule from './store/auth_export';

import LoginPopupSupport from './services/login_popup_support';


const PopupAuthModule = {
    install(Vue, {
        store,
        app,
        authStateURL,
        authLoginURL,
        authLogoutURL,
    }) {

        Vue.use(LoginPopupSupport, { app, loginURL: authLoginURL });

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
