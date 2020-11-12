import { getAuthorizationFromRoute } from '../route'
import {defineComponent} from '@vue/composition-api';

export default defineComponent({
  name: 'authorized-link',
  props: ['component', 'to'],
  computed: {
    propsAndAttrs(): {[key: string]: any} {
      return {
        ...this.$props,
        ...this.$attrs
      }
    },
    resolved(): any {
      return this.$router.resolve(this.to as any)
    },
    authorized(): boolean {
      if (!this.resolved) {
        return false
      }
      const routeAuthorization = getAuthorizationFromRoute(this.resolved.route as any)
      if (!routeAuthorization) {
        return true
      }
      return (this as any).$auth.hasAccess(
          routeAuthorization.needsRequired,
          {
            route: this.resolved.route
          }
      )
    }
  },
  render(h): any{
    if (this.authorized) {
      // return the rendered component
      return h(this.component, {
        props: this.propsAndAttrs as any
      }, this.$slots.default)
    } else if (!this.resolved) {
      return h('div', [
          h('pre', JSON.stringify(this.to))
      ])
    }
    return null
  }
})
