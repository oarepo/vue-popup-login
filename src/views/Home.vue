<template>
  <q-page>
    <div class="row">
      <div class="col">
        <div v-if="!loggedIn">
          <q-btn @click="auth.login" color="primary" icon="vpn_key" label="Log in ..."/>
          <pre class="mt-4">@click="auth.login"</pre>
          <br><br>
          <q-btn @click="longLogin" color="primary" label="Log in button with a large timeout"/>
          <div class="mt-4">Do not do this as this prevents login in firefox</div>
          <pre class="mt-4">@click="setTimeout(auth.login, 5000)"</pre>
        </div>
        <div v-else>
          <q-btn @click="auth.logout" color="primary" label="Log out ..."/>
          <pre>@click="auth.logout"</pre>
        </div>

        <br><br>
        <q-btn :to="{name: 'protected'}" color="primary" label="Protected page"/>
        <div class="mt-4">anyone logged in can access the page</div>
        <div>Authorized: {{ authorized([]) }}</div>

        <br><br>
        <q-btn :to="{name: 'editors'}" color="primary" label="Protected page just for editors"/>
        <div class="mt-4">Only editors (=people with needsProvided=['editors']) can access the page</div>
        <div>Authorized: {{ authorized(['editors']) }}</div>

        <br><br>
        <div class="mt-4">There is a button below visible only to editors (=people with needsProvided=['editors']):</div>
        <authorized-link :to="{name: 'editors'}" component="q-btn">
          This button is shown only to editors
        </authorized-link>

      </div>
      <div class="col">
        Auth state:<br><br>
        <pre>auth = </pre>
        <pre>{{ auth }}</pre>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts">
import {computed, defineComponent} from "vue";
import {usePopupLogin} from "@oarepo/vue-popup-login";

export default defineComponent({
  name: 'Home',
  setup() {
    const auth = usePopupLogin()
    const loggedIn = computed(() => auth.state.value.loggedIn)

    function longLogin () {
      setTimeout(auth.login, 5000)
    }

    function authorized(needsRequired) {
      return auth.isAuthorized(
          auth.state.value,
          needsRequired,
          auth.state.value.needsProvided
      )
    }

    return {
      auth, loggedIn, longLogin, authorized
    }
  }
})
</script>
