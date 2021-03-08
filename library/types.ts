import {RouteLocationRaw, Router} from 'vue-router';

/**
 * LoginMessage is passed from popup window back to the caller to notify
 * that the login process has been finished
 */
export interface LoginMessage {
    type: 'login';
    status: 'success' | 'error';
    message?: string;
}

/**
 * An authentication state returned from the server
 */
export interface AuthenticationState {
    /**
     * true if the user is logged in, false otherwise
     */
    loggedIn: boolean;
    /**
     * a list of needs that the user provides.
     */
    needsProvided: (string | { [key: string]: any })[];
}

export type Need<UserAuthenticationState extends AuthenticationState> = string | (
    (state: UserAuthenticationState, providedNeeds: Need<UserAuthenticationState>[], extra: any) => boolean
    ) | { [key: string]: any }

export interface AuthorizationNeeds<UserAuthenticationState extends AuthenticationState> {
    needsRequired: Need<UserAuthenticationState>[];
}

export interface RouteMeta<UserAuthenticationState extends AuthenticationState> {
    authorization?: AuthorizationNeeds<UserAuthenticationState>;
}

export const REDIRECT_LOGIN = Symbol('redirect-login')
export const CANCEL_NAVIGATION = Symbol('cancel-navigation')
export const CONTINUE_NAVIGATION = Symbol('continue-navigation')

export type LoginOutcome = typeof REDIRECT_LOGIN | boolean
export type NavigationOutcome = typeof CANCEL_NAVIGATION | typeof CONTINUE_NAVIGATION | RouteLocationRaw

/**
 * raised when login popup could not be created
 *
 * @returns  a response from this api.login() (user clicked on login button, api.login() has been called)
 * @returns  REPEAT_LOGIN if user clicked on the login button and a new popup login has started
 */
export type PopupFailedHandler = () => Promise<boolean | typeof REDIRECT_LOGIN>

/**
 * Called when user needs to access a protected resource (for example, in route navigation) and is not
 * logged in. The notifier should display a message and a button "login" that calls usePopupLogin().login()
 *
 * @param extra any extra parameters supplied by the called. In case of router transition, this parameter
 *        will contain 'oldRoute' and 'newRoute' values
 *
 * @returns  a response from this api.login() (user clicked on login button, api.login() has been called)
 * @returns  REDIRECT_LOGIN if user wants to log in via redirect
 * @returns  CANCEL_NAVIGATION do not allow the navigation, call next(false) in route guard
 * @returns  CONTINUE_NAVIGATION the login information has been acquired outside of the library, it is ok to continue
 * @returns  Location navigate router to this location
 */
export type LoginRequiredHandler = (extra: { [key: string]: any }) => Promise<LoginOutcome | NavigationOutcome >

/**
 * Called when user needs to access a protected resource (for example, in route navigation) and has no
 * rights. The notifier should display a message and offer the user to log out and log in as a different user
 *
 * @param state the current login state
 * @param extra any extra parameters supplied by the called. In case of router transition, this parameter
 *        will contain 'oldRoute' and 'newRoute' values
 *
 * @returns  a response from this api.login() (user was logged out, clicked on login button, api.login() has been called)
 * @returns  REDIRECT_LOGIN if user was logged out and wants to log in via redirect
 * @returns  CANCEL_NAVIGATION do not allow the navigation, call next(false) in route guard
 * @returns  CONTINUE_NAVIGATION a new login information has been acquired outside of the library, it is ok to continue
 * @returns  Location navigate router to this location
 */
export type NoAccessHandler = (state: AuthenticationState, extra: { [key: string]: any }) => Promise<
    LoginOutcome | NavigationOutcome>

/**
 * Transforms login state received from the server into a LoginState interface
 */
export type LoginStateTransformer<UserAuthenticationState extends AuthenticationState> = (state: any) => UserAuthenticationState

/**
 * Popup login options
 */
export interface UsePopupLoginOptions<UserAuthenticationState extends AuthenticationState> {
    /**
     * URL that initiates login. The page at that url must accept next= argument
     * that will contain a redirection when the login is finished (either successfully or unsuccessfully)
     */
    loginUrl?: string;
    /**
     * URL that initiates logout. The page at that url must accept next= argument
     * that will contain a redirection when the login is finished (either successfully or unsuccessfully)
     */
    logoutUrl?: string;
    /**
     * HTTP method for performing logout
     */
    logoutMethod?: 'GET' | 'POST';
    /**
     * A url passed to login as next when the popup opening has been successful. The page at this url
     * must create broadcast channel named 'popup-login-channel' and post LoginMessage
     */
    completeUrl?: string;
    /**
     * A url passed to login as next when popups are blocked and user want to continue.
     */
    redirectionCompleteUrl?: string;
    /**
     * A url which can be queried to get the current login state
     */
    stateUrl?: string;
    /**
     * Name of the "next" query parameter passed to loginUrl
     */
    nextQueryParam?: string;
    /**
     * A login state transformer function. Needed in case the server does not return top-level loggedIn boolean
     * property.
     */
    loginStateTransformer: LoginStateTransformer<UserAuthenticationState>;
    /**
     * When pop-ups are blocked, this async handler should create an in-page popup and direct user what to do -
     *  * either suggest user to enable popups, show a button calling usePopupLogin().login()
     *    function and return its result
     *  * return REDIRECT_LOGIN constant to log in via browser location redirection
     */
    popupFailedHandler: PopupFailedHandler;
    /**
     * When an access is checked (for example, in routes), this async handler will be called when user is not logged in.
     * The handler should display a message and a button "login" that calls usePopupLogin().login()
     *
     * The handler returns:
     *
     *  * a response from this api.login() (user clicked on login button, api.login() has been called)
     *  * REDIRECT_LOGIN if user wants to log in via redirect
     *  * CANCEL_NAVIGATION do not allow the navigation, call next(false) in route guard
     *  * CONTINUE_NAVIGATION the login information has been acquired outside of the library, it is ok to continue
     *  * Location navigate router to this location
     */
    loginRequiredHandler: LoginRequiredHandler;
    /**
     * When an access is checked (for example, in routes), this async handler will be called when user has no rights.
     * The handler should display a message and offer a logout/login.
     *
     * The handler returns:
     *
     *  * a response from this api.login() (user was logged out, clicked on login button, api.login() has been called)
     *  * REDIRECT_LOGIN if user was logged out and wants to log in via redirect
     *  * CANCEL_NAVIGATION do not allow the navigation, call next(false) in route guard
     *  * CONTINUE_NAVIGATION a new login information has been acquired outside of the library, it is ok to continue
     *  * Location navigate router to this location
     */
    noAccessHandler: NoAccessHandler;
}

/**
 * Plugin options
 */
export interface PopupLoginPluginOptions<UserAuthenticationState extends AuthenticationState>
    extends UsePopupLoginOptions<UserAuthenticationState> {
    /**
     * If router is passed, beforeEach function will be installed. See documentation
     * for route access control
     */
    router: Router;
}
