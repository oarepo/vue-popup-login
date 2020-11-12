import Vue from 'vue'
import {AuthenticationState, UsePopupLoginOptions} from './types';

declare module 'vue/types/vue' {
    interface Vue {
        $auth: UsePopupLoginOptions<AuthenticationState>
    }
}
