import { AuthenticationState, AuthorizationNeeds } from './types';
import { Route } from 'vue-router';
export declare function getAuthorizationFromRoute<UserAuthenticationState extends AuthenticationState>(route: Route): (AuthorizationNeeds<UserAuthenticationState> | undefined);
