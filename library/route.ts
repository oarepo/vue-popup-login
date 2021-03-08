import {AuthenticationState, AuthorizationNeeds} from './types';
import {RouteLocation} from 'vue-router';

export function getAuthorizationFromRoute<UserAuthenticationState extends AuthenticationState>
(route: RouteLocation):
    (AuthorizationNeeds<UserAuthenticationState> | undefined) {

    let ret = undefined as (AuthorizationNeeds<UserAuthenticationState> | undefined)

    route.matched.forEach(m => {
        if (m.meta && m.meta.authorization !== undefined) {
            const auth = m.meta.authorization as AuthorizationNeeds<UserAuthenticationState>
            if (ret === undefined) {
                ret = {
                    ...auth
                }
                if (!ret.needsRequired) {
                    ret.needsRequired = []
                }
            } else {
                ret.needsRequired.push(...(auth.needsRequired || []))
            }
        }
    })
    return ret
}
