import {AuthenticationState, AuthorizationNeeds} from './types';
import {Route} from 'vue-router';

export function getAuthorizationFromRoute<UserAuthenticationState extends AuthenticationState>(route: Route):
    (AuthorizationNeeds<UserAuthenticationState> | undefined) {
    let ret = undefined as (AuthorizationNeeds<UserAuthenticationState> | undefined)

    route.matched.forEach(m => {
        if (m.meta && m.meta.authorization !== undefined) {
            if (ret === undefined) {
                ret = {
                    needsRequired: [],
                    ...m.meta.authorization
                }
            } else {
                ret.needsRequired.push(...(m.meta.authorization.needsRequired || []))
            }
        }
    })
    return ret
}
