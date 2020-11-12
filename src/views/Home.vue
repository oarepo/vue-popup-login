<template>
  <v-container>
    <v-row>
      <v-col>
        <div v-if="!loggedIn">
          <v-btn @click="$auth.login">Log in ...</v-btn>
          <pre class="mt-4">@click="$auth.login"</pre>
          <br><br>
          <v-btn @click="longLogin">Log in button with a large timeout</v-btn>
          <div class="mt-4">Do not do this as this prevents login in firefox</div>
          <pre class="mt-4">@click="setTimeout($auth.login, 5000)"</pre>
        </div>
        <div v-else>
          <v-btn @click="$auth.logout">Log out ...</v-btn>
          <pre>@click="$auth.logout"</pre>
        </div>

        <br><br>
        <v-btn :to="{name: 'protected'}">Protected page</v-btn>
        <div class="mt-4">anyone logged in can access the page</div>
        <div>Authorized: {{ authorized([]) }}</div>

        <br><br>
        <v-btn :to="{name: 'editors'}">Protected page just for editors</v-btn>
        <div class="mt-4">Only editors (=people with needsProvided=['editors']) can access the page</div>
        <div>Authorized: {{ authorized(['editors']) }}</div>

        <br><br>
        <div class="mt-4">There is a button below visible only to editors (=people with needsProvided=['editors']):</div>
        <authorized-link :to="{name: 'editors'}" component="v-btn">
          This button is shown only to editors
        </authorized-link>

      </v-col>
      <v-col>
        Auth state:<br><br>
        <pre>$auth = </pre>
        <pre>{{ $auth }}</pre>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>

export default {
  name: 'Home',
  computed: {
    loggedIn () {
      return this.$auth.state.value.loggedIn
    }
  },
  methods: {
    longLogin() {
      setTimeout(this.$auth.login, 5000)
    },
    authorized(needsRequired) {
      return this.$auth.isAuthorized(
          this.$auth.state.value,
          needsRequired,
          this.$auth.state.value.needsProvided
      )
    }
  }
}
</script>
