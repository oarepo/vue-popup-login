import _Vue from 'vue';
import { Ref } from '@vue/composition-api';
import { AuthenticationState, LoginRequiredNotifier, LoginStateTransformer, Need, NoAccessNotifier, PopupFailedNotifier, PopupLoginPluginOptions, UsePopupLoginOptions } from './types';
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
export declare function usePopupLogin<UserAuthenticationState extends AuthenticationState>({ loginUrl, logoutUrl, completeUrl, redirectionCompleteUrl, stateUrl, nextQueryParam, loginStateTransformer, popupFailedNotifier, loginRequiredNotifier, noAccessNotifier }: UsePopupLoginOptions<UserAuthenticationState>): {
    options: {
        loginUrl: string;
        logoutUrl: string;
        completeUrl: string;
        redirectionCompleteUrl: string | null;
        stateUrl: string;
        nextQueryParam: string;
        loginStateTransformer: LoginStateTransformer<UserAuthenticationState>;
        popupFailedNotifier: PopupFailedNotifier;
        loginRequiredNotifier: LoginRequiredNotifier;
        noAccessNotifier: NoAccessNotifier;
    };
    state: Ref<UserAuthenticationState>;
    check: (localStateSufficient?: boolean) => Promise<UserAuthenticationState>;
    login: () => Promise<boolean>;
    logout: () => void;
    isAuthorized: (state: UserAuthenticationState, needsRequired: Need<UserAuthenticationState>[], needsProvided: Need<UserAuthenticationState>[], extra: any) => boolean;
    loginAndAuthorize: (needsRequired: Need<UserAuthenticationState>[], extra: any) => Promise<boolean>;
    hasAccess: (needsRequired: Need<UserAuthenticationState>[], extra: any) => boolean;
};
/**
 * Vue plugin. Do not forget to call Vue.use(compositionApi) before
 * using this plugin.
 *
 * @param Vue           current Vue
 * @param options       login options
 */
export default function popupLoginPlugin<UserAuthenticationState extends AuthenticationState>(Vue: typeof _Vue, options: PopupLoginPluginOptions<UserAuthenticationState>): void;
