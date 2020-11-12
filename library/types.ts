import Router, {Location} from 'vue-router';

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

/**
 * raised when login popup could not be created
 *
 * @returns  true if it is ok to perform redirection-based authentication
 */
export type PopupFailedNotifier = () => Promise<boolean>

/**
 * Called when user needs to access a protected resource (for example, in route navigation) and is not
 * logged in. The notifier should display a message and a button "login" that calls usePopupLogin().login()
 *
 * @param extra any extra parameters supplied by the called. In case of router transition, this parameter
 *        will contain 'oldRoute' and 'newRoute' values
 *
 * @return true if user clicked on login button, string to use it as window.location or Location to be used
 *        for router.push()
 */
export type LoginRequiredNotifier = (extra: { [key: string]: any }) => Promise<boolean | string | Location>

/**
 * Called when user needs to access a protected resource (for example, in route navigation) and has no
 * rights. The notifier should display a message and offer the user to log out and log in as a different user
 *
 * @param state the current login state
 * @param extra any extra parameters supplied by the called. In case of router transition, this parameter
 *        will contain 'oldRoute' and 'newRoute' values
 *
 * @return true if user clicked on login button, string to use it as window.location or Location to be used
 *        for router.push()
 */
export type NoAccessNotifier = (state: AuthenticationState, extra: { [key: string]: any }) => Promise<boolean | string | Location>

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
     * When pop-ups are blocked, this async notifier should create an in-page popup and direct user what to do -
     *  * either suggest user to enable popups, show a button calling usePopupLogin().login()
     *    function and return Promise resolving to false
     *  * or return Promise resolving to true. This will cause immediate redirection to the login url and
     *    data entered on the page will be lost
     */
    popupFailedNotifier: PopupFailedNotifier;
    /**
     * When an access is checked (for example, in routes), this async notifier will be called when user is not logged in.
     * The notifier should display a message and a button "login" that calls usePopupLogin().login()
     *
     * The notifier returns either a Promise resolving to true, meaning that user is logging in in the popup,
     * or a Route or URL to which the user should be navigated instead
     */
    loginRequiredNotifier: LoginRequiredNotifier;
    /**
     * When an access is checked (for example, in routes), this async notifier will be called when user has no rights.
     * The notifier should display a message and offer a logout/login.
     *
     * The notifier returns either a Promise resolving to true, meaning that user is logging in in the popup,
     * or a Route or URL to which the user should be navigated instead
     */
    noAccessNotifier: NoAccessNotifier;
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
