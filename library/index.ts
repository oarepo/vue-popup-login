import _Vue from 'vue';
import {normalizeUrl} from './url';
import {reactive, Ref, ref} from '@vue/composition-api';
import {
    AuthenticationState,
    CANCEL_NAVIGATION,
    CONTINUE_NAVIGATION,
    LoginMessage,
    LoginOutcome,
    LoginRequiredHandler,
    LoginStateTransformer,
    NavigationOutcome,
    Need,
    NoAccessHandler,
    PopupFailedHandler,
    PopupLoginPluginOptions,
    REDIRECT_LOGIN,
    UsePopupLoginOptions
} from './types';
import axios from 'axios'
import {isMatch} from 'lodash'
import AuthorizedLink from './components/authorized-link'
import {getAuthorizationFromRoute} from './route';

const DEFAULT_LOGIN_URL = '/auth/login';
const DEFAULT_COMPLETE_URL = '/auth/complete';
const DEFAULT_LOGOUT_URL = '/auth/logout';
const DEFAULT_STATE_URL = '/auth/state';
const DEFAULT_NEXT_QUERY_PARAM = 'next'


// @vue/composition-api must be initialized so can not have the reactive property here
// (as the file might be imported before Vue.use(CompositionApi) )
const pluginData = {
    loginOptions: null,
    loginData: null,
    loginState: null
}

/**
 * Provides access to the login state. The first time (in main.js or app's setup)
 * you call it, it will get initialized. Other times it will just return the initialized
 * copy.
 *
 * You can use it either the composition-style (that is, in setup() function call usePopupLogin
 * and use it there), or can use the provided Vue.use(popupLoginPlugin, {})
 *
 * @param loginUrl
 * @param logoutUrl
 * @param completeUrl
 * @param redirectionCompleteUrl
 * @param stateUrl
 * @param nextQueryParam
 * @param loginStateTransformer
 * @param popupFailedHandler
 */
export function usePopupLogin<UserAuthenticationState extends AuthenticationState>(
    options?: UsePopupLoginOptions<UserAuthenticationState>) {

    const {
        loginUrl,
        logoutUrl,
        completeUrl,
        redirectionCompleteUrl,
        stateUrl,
        nextQueryParam,
        loginStateTransformer,
        popupFailedHandler,
        loginRequiredHandler,
        noAccessHandler
    } = options || {}

    if (pluginData.loginOptions === null) {
        Object.assign(pluginData, {
            loginOptions: reactive({
                loginUrl: null as any as string,
                logoutUrl: null as any as string,
                completeUrl: null as any as string,
                redirectionCompleteUrl: null as (string | null),
                stateUrl: null as any as string,
                nextQueryParam: null as any as string,
                loginStateTransformer: null as (LoginStateTransformer<AuthenticationState> | null),
                popupFailedHandler: null as any as PopupFailedHandler,
                loginRequiredHandler: null as any as LoginRequiredHandler,
                noAccessHandler: null as any as NoAccessHandler
            }),

            loginData: reactive({
                channel: null as any,
                promises: [] as Array<(msg: LoginMessage) => void>,
                popup: null as any
            }),

            loginState: ref({loggedIn: false, needsProvided: []}) as Ref<UserAuthenticationState>
        })
    }
    const loginOptions = pluginData.loginOptions! as {  // eslint-disable-line
        loginUrl: string;
        logoutUrl: string;
        completeUrl: string;
        redirectionCompleteUrl: string | null;
        stateUrl: string;
        nextQueryParam: string;
        loginStateTransformer: LoginStateTransformer<UserAuthenticationState>;
        popupFailedHandler: PopupFailedHandler;
        loginRequiredHandler: LoginRequiredHandler;
        noAccessHandler: NoAccessHandler;
    }
    const loginState = pluginData.loginState! as Ref<UserAuthenticationState>  // eslint-disable-line
    const loginData = pluginData.loginData! as {  // eslint-disable-line
        channel: any;
        callback: ((msg: LoginMessage) => void) | undefined;
        popup: any | null;
    }

    function callCallback(msg: LoginMessage) {
        if (loginData.callback) {
            const callback = loginData.callback
            loginData.callback = undefined
            callback(msg)
        } else {
            setTimeout(() => callCallback(msg), 1000)
        }
    }

    if (!loginOptions.loginUrl) {
        // not yet initialized
        loginOptions.loginUrl = loginUrl || DEFAULT_LOGIN_URL
        loginOptions.logoutUrl = logoutUrl || DEFAULT_LOGOUT_URL
        loginOptions.completeUrl = completeUrl || DEFAULT_COMPLETE_URL
        loginOptions.redirectionCompleteUrl = redirectionCompleteUrl || null
        loginOptions.stateUrl = stateUrl || DEFAULT_STATE_URL
        loginOptions.nextQueryParam = nextQueryParam || DEFAULT_NEXT_QUERY_PARAM
        loginOptions.loginStateTransformer = loginStateTransformer as any as LoginStateTransformer<UserAuthenticationState>
        loginOptions.loginRequiredHandler = loginRequiredHandler || (
            async () => {
                alert('Redirecting you to log in')
                return REDIRECT_LOGIN
            }
        )
        loginOptions.popupFailedHandler = popupFailedHandler || (
            async () => {
                alert('Redirecting you to log in')
                return REDIRECT_LOGIN
            }
        )
        loginOptions.noAccessHandler = noAccessHandler || (
            async () => {
                alert('You have no access to the resource. Redirecting you to log in')
                window.location.href = loginOptions.logoutUrl
                return false    // just to make typescript happy
            }
        )
        loginData.channel = new BroadcastChannel('popup-login-channel');

        loginData.channel.onmessage = function(msg: any) {
            if (msg.data.type === 'login') {
                callCallback(msg.data)
                loginData.popup.close()
                loginData.popup = null
            }
        }
    }

    function redirectLogin() {
        const finalRedirectionUrl = new URL(loginOptions.completeUrl, window.location.href)
        finalRedirectionUrl.searchParams.append(
            loginOptions.nextQueryParam,
            loginOptions.redirectionCompleteUrl
                ? normalizeUrl(loginOptions.redirectionCompleteUrl)
                : window.location.href)

        const redirectionUrl = new URL(loginOptions.loginUrl, window.location.href)
        redirectionUrl.searchParams.append(
            loginOptions.nextQueryParam,
            finalRedirectionUrl.toString())
        window.location.href = redirectionUrl.toString()
    }

    function _handleFailedLoginPopup(resolve: (state: boolean) => void) {
        loginOptions.popupFailedHandler().then((state) => {
            if (state === REDIRECT_LOGIN) {
                redirectLogin()
                // no need to finish the promise as we are leaving the page
            } else {
                // got login, so resolve with it
                resolve(state)
            }
        })
    }

    async function check(localStateSufficient = false): Promise<UserAuthenticationState> {
        if (loginState.value.loggedIn && localStateSufficient) {
            return loginState.value
        }
        const resp = await axios.get(loginOptions.stateUrl)
        loginState.value = loginOptions.loginStateTransformer
            ? loginOptions.loginStateTransformer(resp.data)
            : resp.data
        return loginState.value
    }

    function clearLoginState() {
        loginState.value = {
            loggedIn: false,
            needsProvided: []
        } as any as UserAuthenticationState
    }

    function login(): Promise<boolean> {
        if (loginState.value.loggedIn) {
            return Promise.resolve(true)
        }

        // popup the login as soon as possible - that's why the function is not async
        const loginUrl = new URL(loginOptions.loginUrl, window.location.href)
        loginUrl.searchParams.append(loginOptions.nextQueryParam, normalizeUrl(loginOptions.completeUrl))
        const currentPopup = window.open(loginUrl.toString(), '_blank')
        loginData.popup = currentPopup
        return new Promise((resolve) => {
            if (!currentPopup) {
                return _handleFailedLoginPopup(resolve);
            }
            loginData.callback = (async () => {
                await check(false)
                resolve(loginState.value.loggedIn)
            })
        })
    }

    function logout() {
        window.location.href = loginOptions.logoutUrl
    }

    /**
     * Ask the loginRequiredHandler to show login popup
     *
     * @returns  REPEAT_LOGIN if user clicked on the login button and a new popup login has started
     * @returns  REDIRECT_LOGIN if user wants to log in via redirect
     * @returns  CANCEL_NAVIGATION do not allow the navigation, call next(false) in route guard
     * @returns  CONTINUE_NAVIGATION the login information has been acquired outside of the library, it is ok to continue
     * @returns  {string} navigate browser to this location via windows.location.href - this will reload the app
     * @returns  Location navigate router to this location
     */
    function showLoginPopup(extra: any): Promise<LoginOutcome | NavigationOutcome> {
        return loginOptions.loginRequiredHandler(extra)
    }

    /**
     * Ask the noAccessHandler to show login popup. The handler should
     *
     * @param extra extra arguments for the handler
     * @returns  REPEAT_LOGIN if user clicked on the login button and a new popup login has started
     * @returns  REDIRECT_LOGIN if user wants to log in via redirect
     * @returns  CANCEL_NAVIGATION do not allow the navigation, call next(false) in route guard
     * @returns  CONTINUE_NAVIGATION the login information has been acquired outside of the library, it is ok to continue
     * @returns  {string} navigate browser to this location via windows.location.href - this will reload the app
     * @returns  Location navigate router to this location
     */
    function showNoAccessPopup(extra: any): Promise<LoginOutcome | NavigationOutcome> {
        return loginOptions.noAccessHandler(loginState.value, extra)
    }

    function isAuthorized(
        state: UserAuthenticationState,
        needsRequired: Need<UserAuthenticationState>[],
        needsProvided: Need<UserAuthenticationState>[],
        extra: any): boolean {

        // sanity check
        needsProvided = needsProvided || []
        needsRequired = needsRequired || []

        if (!needsRequired.length && state.loggedIn) {
            return true
        }

        // check if there is a requiredNeed that is contained in the provided needs
        // if there is at least one, the person is authorized
        for (const requiredNeed of needsRequired) {
            // if the required need is a string, look in all provided needs
            // if there is a string with the same value
            if (typeof requiredNeed === 'string') {
                if (needsProvided.indexOf(requiredNeed) >= 0) {
                    return true
                }
                // if the required need is a function, apply it and if it returns true,
                // consider the need to be fulfilled
            } else if (typeof requiredNeed === 'function') {
                if (requiredNeed(state, needsProvided, extra)) {
                    return true
                }
                // if the need is an object, it must be contained in at least
                // one of the provided needs to be marked as fulfilled
            } else {
                if (needsProvided.some(n => {
                        if (typeof n === 'string' || typeof n === 'function') {
                            return false
                        }
                        return isMatch(n, requiredNeed)
                    }
                )) return true
            }
        }
        return false
    }

    function hasAccess(needsRequired: Need<UserAuthenticationState>[], extra: any): boolean {
        if (!loginState.value.loggedIn) {
            return false
        }
        return isAuthorized(loginState.value, needsRequired, loginState.value.needsProvided, extra)
    }

    /**
     * Makes sure the user is logged in and has the required needs
     *
     * @param needsRequired a list of needs that the user must provide
     * @param extra extra arguments for login and no access handlers
     *
     * @return true if user is logged in and provides all the needs required
     *
     * @throws CANCEL_NAVIGATION  user has no rights and does not want to continue
     * @throws CONTINUE_NAVIGATION handler wants to continue navigation even though user has no rights
     * @throws {Location} asking the caller to router-navigate to this location
     */
    async function loginAndAuthorize(needsRequired: Need<UserAuthenticationState>[], extra: any): Promise<boolean | NavigationOutcome> {
        let state = 'initial'
        while (true) { // eslint-disable-line
            switch (state) {
                case 'initial': {
                    const authState = await check(true)
                    if (authState.loggedIn) {
                        state = 'logged-in'
                    } else {
                        state = 'logged-out'
                    }
                    break
                }
                case 'logged-out': {
                    const loginPopupOutcome = await showLoginPopup(extra)
                    if (loginPopupOutcome === true) {
                        state = 'logged-in'
                    } else if (loginPopupOutcome === false) {
                        continue
                    } else if (loginPopupOutcome === REDIRECT_LOGIN) {
                        redirectLogin()
                    } else {
                        return loginPopupOutcome // navigation outcome
                    }
                    break
                }
                case 'logged-in': {
                    const authorized = isAuthorized(loginState.value, needsRequired, loginState.value.needsProvided, extra)
                    if (authorized) {
                        return true
                    }
                    state = 'not-authorized'
                    break
                }
                case 'not-authorized': {
                    const loginOutcome = await showNoAccessPopup(extra)
                    if (loginOutcome === true) {
                        state = 'logged-in'
                    } else if (loginOutcome === false) {
                        state = 'initial'
                    } else if (loginOutcome == REDIRECT_LOGIN) {
                        redirectLogin()
                    } else {
                        return loginOutcome
                    }
                    break
                }
            }
        }
    }

    return {
        options: loginOptions,
        state: loginState,
        clearLoginState,
        check,
        login,
        logout,
        isAuthorized,
        loginAndAuthorize,
        hasAccess
    }
}

/**
 * Vue plugin. Do not forget to call Vue.use(compositionApi) before
 * using this plugin.
 *
 * @param Vue           current Vue
 * @param options       login options
 */
export default function popupLoginPlugin<UserAuthenticationState extends AuthenticationState>(
    Vue: typeof _Vue, options: PopupLoginPluginOptions<UserAuthenticationState>
) {
    const $auth = usePopupLogin(options);
    Vue.component('authorized-link', AuthorizedLink)
    Vue.prototype.$auth = $auth
    if (options.router) {

        options.router.beforeEach(async (to, from, next) => {
            const authorization = getAuthorizationFromRoute(to)
            if (!authorization) {
                next()
            } else {
                const authorizedOrLocation = await $auth.loginAndAuthorize(
                    authorization.needsRequired || [],
                    {
                        route: to
                    })
                if (authorizedOrLocation === true || authorizedOrLocation === CONTINUE_NAVIGATION) {
                    next()
                } else if (authorizedOrLocation === CANCEL_NAVIGATION) {
                    next(false)
                } else {
                    // otherwise it is a location
                    next(authorizedOrLocation)
                }
            }
        })
    }
}

export {
    REDIRECT_LOGIN,
    CANCEL_NAVIGATION,
    CONTINUE_NAVIGATION
}
