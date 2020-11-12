import { reactive, ref } from '@vue/composition-api';
import axios from 'axios';
import { isMatch } from 'lodash';
import __vue_normalize__ from 'vue-runtime-helpers/dist/normalize-component.mjs';

function normalizeUrl(url) {
    return (new URL(url, window.location.href)).toString();
}

function getAuthorizationFromRoute(route) {
    let ret = undefined;
    route.matched.forEach(m => {
        if (m.meta && m.meta.authorization !== undefined) {
            if (ret === undefined) {
                ret = {
                    needsRequired: [],
                    ...m.meta.authorization
                };
            }
            else {
                ret.needsRequired.push(...(m.meta.authorization.needsRequired || []));
            }
        }
    });
    return ret;
}

//

var script = {
  name: 'authorized-link',
  props: ['component', 'to'],
  computed: {
    propsAndAttrs() {
      return {
        ...this.$props,
        ...this.$attrs
      }
    },
    resolved() {
      return this.$router.resolve(this.to)
    },
    authorized() {
      if (!this.resolved) {
        return false
      }
      const routeAuthorization = getAuthorizationFromRoute(this.resolved.route);
      if (!routeAuthorization) {
        return true
      }
      return this.$auth.hasAccess(
          routeAuthorization.needsRequired,
          {
            route: this.resolved.route
          }
      )
    }
  }
};

/* script */
const __vue_script__ = script;

/* template */
var __vue_render__ = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return (_vm.authorized)?_c(_vm.component,_vm._b({tag:"component"},'component',_vm.propsAndAttrs,false),[_vm._t("default")],2):(!_vm.resolved)?_c('div',[_vm._v("Error during resolving\n  "),_c('pre',[_vm._v(_vm._s(_vm.to))])]):_vm._e()};
var __vue_staticRenderFns__ = [];

  /* style */
  const __vue_inject_styles__ = undefined;
  /* scoped */
  const __vue_scope_id__ = undefined;
  /* module identifier */
  const __vue_module_identifier__ = undefined;
  /* functional template */
  const __vue_is_functional_template__ = false;
  /* style inject */
  
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  const __vue_component__ = /*#__PURE__*/__vue_normalize__(
    { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
    __vue_inject_styles__,
    __vue_script__,
    __vue_scope_id__,
    __vue_is_functional_template__,
    __vue_module_identifier__,
    false,
    undefined,
    undefined,
    undefined
  );

const DEFAULT_LOGIN_URL = '/auth/login';
const DEFAULT_COMPLETE_URL = '/auth/complete';
const DEFAULT_LOGOUT_URL = '/auth/logout';
const DEFAULT_STATE_URL = '/auth/state';
const DEFAULT_NEXT_QUERY_PARAM = 'next';
// @vue/composition-api must be initialized so can not have the reactive property here
// (as the file might be imported before Vue.use(CompositionApi) )
const pluginData = {
    loginOptions: null,
    loginData: null,
    loginState: null
};
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
 * @param popupFailedNotifier
 */
function usePopupLogin({ loginUrl, logoutUrl, completeUrl, redirectionCompleteUrl, stateUrl, nextQueryParam, loginStateTransformer, popupFailedNotifier, loginRequiredNotifier, noAccessNotifier }) {
    if (pluginData.loginOptions === null) {
        Object.assign(pluginData, {
            loginOptions: reactive({
                loginUrl: null,
                logoutUrl: null,
                completeUrl: null,
                redirectionCompleteUrl: null,
                stateUrl: null,
                nextQueryParam: null,
                loginStateTransformer: null,
                popupFailedNotifier: null,
                loginRequiredNotifier: null,
                noAccessNotifier: null
            }),
            loginData: reactive({
                channel: null,
                promises: [],
                popup: null
            }),
            loginState: ref({ loggedIn: false, needsProvided: [] })
        });
    }
    const loginOptions = pluginData.loginOptions;
    const loginState = pluginData.loginState; // eslint-disable-line
    const loginData = pluginData.loginData;
    if (!loginOptions.loginUrl) {
        loginOptions.loginUrl = loginUrl || DEFAULT_LOGIN_URL;
        loginOptions.logoutUrl = logoutUrl || DEFAULT_LOGOUT_URL;
        loginOptions.completeUrl = completeUrl || DEFAULT_COMPLETE_URL;
        loginOptions.redirectionCompleteUrl = redirectionCompleteUrl || null;
        loginOptions.stateUrl = stateUrl || DEFAULT_STATE_URL;
        loginOptions.nextQueryParam = nextQueryParam || DEFAULT_NEXT_QUERY_PARAM;
        loginOptions.loginStateTransformer = loginStateTransformer;
        loginOptions.loginRequiredNotifier = loginRequiredNotifier;
        loginOptions.popupFailedNotifier = popupFailedNotifier || (async () => {
            console.error('Could not create login popup window');
            return true;
        });
        loginOptions.noAccessNotifier = noAccessNotifier || (async () => {
            console.error('No access');
            return false;
        });
        loginData.channel = new BroadcastChannel('popup-login-channel');
        loginData.channel.onmessage = function (msg) {
            if (msg.data.type === 'login') {
                const promises = loginData.promises;
                loginData.promises = [];
                (async function notify() {
                    for (const p of promises) {
                        await p(msg.data);
                    }
                })();
                loginData.popup.close();
                loginData.popup = null;
            }
        };
    }
    function _handleFailedLoginPopup(reject) {
        loginOptions.popupFailedNotifier().then((redirectionOk) => {
            if (!redirectionOk) {
                reject('Could not open popup window and redirection has not been allowed. ' +
                    'The user might have though fixed the problem and invoked another login ' +
                    'so this message might in most cases be ignored.');
            }
            else {
                const finalRedirectionUrl = new URL(loginOptions.completeUrl, window.location.href);
                finalRedirectionUrl.searchParams.append(loginOptions.nextQueryParam, loginOptions.redirectionCompleteUrl
                    ? normalizeUrl(loginOptions.redirectionCompleteUrl)
                    : window.location.href);
                const redirectionUrl = new URL(loginOptions.loginUrl, window.location.href);
                redirectionUrl.searchParams.append(loginOptions.nextQueryParam, finalRedirectionUrl.toString());
                window.location.href = redirectionUrl.toString();
                // no need to finish the promise as we are leaving the page
            }
        });
    }
    async function check(localStateSufficient = false) {
        if (loginState.value.loggedIn && localStateSufficient) {
            return loginState.value;
        }
        const resp = await axios.get(loginOptions.stateUrl);
        loginState.value = loginOptions.loginStateTransformer
            ? loginOptions.loginStateTransformer(resp.data)
            : resp.data;
        return loginState.value;
    }
    function clearLoginState() {
        loginState.value = {
            loggedIn: false,
            needsProvided: []
        };
    }
    function login() {
        // popup the login as soon as possible - that's why the function is not async
        clearLoginState();
        const loginUrl = new URL(loginOptions.loginUrl, window.location.href);
        loginUrl.searchParams.append(loginOptions.nextQueryParam, normalizeUrl(loginOptions.completeUrl));
        const currentPopup = window.open(loginUrl.toString(), '_blank');
        loginData.popup = currentPopup;
        return new Promise((resolve, reject) => {
            if (!currentPopup) {
                return _handleFailedLoginPopup(reject);
            }
            loginData.promises.splice(0, 0, () => check());
            loginData.promises.push(( /*msg: LoginMessage*/) => {
                resolve(loginState.value.loggedIn);
            });
        });
    }
    function logout() {
        window.location.href = loginOptions.logoutUrl;
    }
    /**
     * Ask the loginRequiredNotifier to show login popup
     *
     * @param extra extra arguments for the notifier
     * @return true if user is logging in
     * @throws false to cancel the navigation
     * @throws {string} asking the caller to navigate to this url
     * @throws {Location} asking the caller to router-navigate to this location
     */
    function showLoginPopup(extra) {
        return new Promise((resolve, reject) => {
            loginOptions.loginRequiredNotifier(extra).then(resp => {
                if (resp === true) {
                    resolve(true);
                }
                else {
                    reject(resp);
                }
            });
        });
    }
    /**
     * Ask the noAccessNotifier to show login popup. The notifier should
     *
     * @param extra extra arguments for the notifier
     * @return true if user is logging in
     * @throws false to cancel the navigation
     * @throws {string} asking the caller to navigate to this url
     * @throws {Location} asking the caller to router-navigate to this location
     */
    function showNoAccessPopup(extra) {
        return new Promise((resolve, reject) => {
            loginOptions.noAccessNotifier(loginState.value, extra).then(resp => {
                if (resp === true) {
                    resolve(true);
                }
                else {
                    reject(resp);
                }
            });
        });
    }
    function isAuthorized(state, needsRequired, needsProvided, extra) {
        // sanity check
        needsProvided = needsProvided || [];
        needsRequired = needsRequired || [];
        if (!needsRequired.length && state.loggedIn) {
            return true;
        }
        // check if there is a requiredNeed that is contained in the provided needs
        // if there is at least one, the person is authorized
        for (const requiredNeed of needsRequired) {
            // if the required need is a string, look in all provided needs
            // if there is a string with the same value
            if (typeof requiredNeed === 'string') {
                if (needsProvided.indexOf(requiredNeed) >= 0) {
                    return true;
                }
                // if the required need is a function, apply it and if it returns true,
                // consider the need to be fulfilled
            }
            else if (typeof requiredNeed === 'function') {
                if (requiredNeed(state, needsProvided, extra)) {
                    return true;
                }
                // if the need is an object, it must be contained in at least
                // one of the provided needs to be marked as fulfilled
            }
            else {
                if (needsProvided.some(n => {
                    if (typeof n === 'string' || typeof n === 'function') {
                        return false;
                    }
                    return isMatch(n, requiredNeed);
                }))
                    return true;
            }
        }
        return false;
    }
    function hasAccess(needsRequired, extra) {
        if (!loginState.value.loggedIn) {
            return false;
        }
        return isAuthorized(loginState.value, needsRequired, loginState.value.needsProvided, extra);
    }
    /**
     * Makes sure the user is logged in and has the required needs
     *
     * @param needsRequired a list of needs that the user must provide
     * @param extra extra arguments for login and no access notifiers
     *
     * @return true if user is logged in and provides all the needs required
     *
     * @throws `false` if user does not want to login in - in this case navigation should be prevented
     * @throws {string} asking the caller to navigate to this url
     * @throws {Location} asking the caller to router-navigate to this location
     */
    async function loginAndAuthorize(needsRequired, extra) {
        const authState = await check(true);
        if (!authState.loggedIn) {
            // register on login finished
            await showLoginPopup(extra);
            await check(true);
            if (!loginState.value.loggedIn) {
                return false;
            }
        }
        const authorized = isAuthorized(loginState.value, needsRequired, loginState.value.needsProvided, extra);
        if (!authorized) {
            const loginInProgress = await showNoAccessPopup(extra);
            if (loginInProgress) {
                return new Promise((resolve, reject) => {
                    loginData.promises.push(() => {
                        // repeat the authorization when the login is finished
                        loginAndAuthorize(needsRequired, extra).then(resolve).catch(reject);
                    });
                });
            }
        }
        return authorized;
    }
    return {
        options: loginOptions,
        state: loginState,
        check,
        login,
        logout,
        isAuthorized,
        loginAndAuthorize,
        hasAccess
    };
}
/**
 * Vue plugin. Do not forget to call Vue.use(compositionApi) before
 * using this plugin.
 *
 * @param Vue           current Vue
 * @param options       login options
 */
function popupLoginPlugin(Vue, options) {
    const $auth = usePopupLogin(options);
    Vue.component('authorized-link', __vue_component__);
    Vue.prototype.$auth = $auth;
    if (options.router) {
        options.router.beforeEach(async (to, from, next) => {
            const authorization = getAuthorizationFromRoute(to);
            if (!authorization) {
                next();
            }
            else {
                for (const idx of Array(5).keys()) {
                    try {
                        const authorized = await $auth.loginAndAuthorize(authorization.needsRequired || [], {
                            route: to
                        });
                        if (authorized) {
                            next();
                            break;
                        }
                    }
                    catch (e) {
                        if (typeof e === 'string') {
                            window.location.href = e;
                        }
                        else if (e === false) {
                            next(false);
                        }
                        else {
                            // otherwise it is a router location, navigate to it
                            next(e);
                        }
                        break;
                    }
                }
                next(false);
            }
        });
    }
}

export default popupLoginPlugin;
export { usePopupLogin };
