import {getAuthorizationFromRoute} from '../route'
import {computed, defineComponent, h, Ref, resolveComponent} from 'vue';
import {RouteLocation, useRouter} from "vue-router";
import {usePopupLogin} from "@oarepo/vue-popup-login";

export default defineComponent({
    name: 'authorized-link',
    props: ['component', 'to'],
    setup(props, ctx) {
        const router = useRouter()
        const auth = usePopupLogin()
        const propsAndAttrs = computed(() => {
            return {
                ...props,
                ...ctx.attrs
            }
        })
        const resolved: Ref<RouteLocation> = computed(() => {
            return router.resolve(props.to)
        })
        const authorized = computed(() => {
            if (!resolved.value) {
                return false
            }
            const routeAuthorization = getAuthorizationFromRoute(
                resolved.value)
            if (!routeAuthorization) {
                return true
            }
            return auth.hasAccess(
                routeAuthorization.needsRequired,
                {
                    route: resolved.value
                }
            )
        })
        return {
            authorized,
            resolved,
            propsAndAttrs
        }
    },
    render() {
        if (this.authorized) {

            // return the rendered component
            return h(resolveComponent(this.component),
                this.propsAndAttrs,
                this.$slots.default)

        } else if (!this.resolved) {
            return h('div', [
                h('pre', JSON.stringify(this.to))
            ])
        }
        return null
    }
})
/*
  computed: {
    ,
})


*/
