<template>
  <v-app>
    <v-app-bar
        app
        color="primary"
        dark
    >
      <div class="d-flex align-center">
        <v-img
            alt="Vuetify Logo"
            class="shrink mr-2"
            contain
            src="https://cdn.vuetifyjs.com/images/logos/vuetify-logo-dark.png"
            transition="scale-transition"
            width="40"
        />
        <h2>Popup Login Demo</h2>
      </div>

      <v-spacer></v-spacer>

      <v-btn
          href="https://github.com/oarepo/vue-composition-popup-login"
          target="_blank"
          text
      >
        <span class="mr-2">Latest Release</span>
        <v-icon>mdi-open-in-new</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-layout class="pa-8">
        <router-view></router-view>
      </v-layout>
    </v-main>
    <v-snackbar v-model="popupFailedSnackbar" multi-line :timeout="1e6" color="negative">
      Opening the popup for logging in has failed.
      You can either enable popups for this site and
      try again, or we can take you to login page -
      but you will loose any changes you might have performed
      on this page.

      <template v-slot:action="{ attrs }">
      <v-btn
          color="positive"
          v-bind="attrs"
          @click="retry()"
      >
        Try again
      </v-btn>
      <v-btn
          color="negative"
          v-bind="attrs"
          @click="redirect()"
      >
        Go to login page
      </v-btn>
      </template>
    </v-snackbar>
    <v-snackbar v-model="noAccessSnackbar" multi-line :timeout="1e6" color="negative">
      You do not have an access to this page. Please log in

      <template v-slot:action="{ attrs }">
      <v-btn
          color="positive"
          v-bind="attrs"
          @click="logInAgain()"
      >
        Log in
      </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script lang="ts">
import {defineComponent} from '@vue/composition-api';

export default defineComponent({
  name: 'App',
  mounted() {
    // check if the user is not logged in already
    this.$auth.check()

    // register notification handler on failed popups
    this.$auth.options.popupFailedNotifier = () => this.popupFailed()
    this.$auth.options.loginRequiredNotifier = () => this.noAccess()
  },
  data: function() {
    return {
      resolveFailedPopup: null as any,
      popupFailedSnackbar: false,

      resolveNoAccess: null as any,
      noAccessSnackbar: false
    }
  },
  methods: {
    popupFailed() {
      return new Promise((resolve: any) => {
        this.popupFailedSnackbar = true
        this.resolveFailedPopup = resolve
      })
    },
    retry() {
      if (this.resolveFailedPopup !== null) {
        this.popupFailedSnackbar = false
        this.$auth.login().then(() => {this.resolveFailedPopup(false)})
      }
    },
    redirect() {
      if (this.resolveFailedPopup !== null) {
        this.popupFailedSnackbar = false
        this.resolveFailedPopup(true)
      }
    },
    noAccess() {
      return new Promise((resolve: any) => {
        this.noAccessSnackbar = true
        this.resolveNoAccess = resolve
      })
    },
    logInAgain() {
      // log in as early as possible
      console.log('logInAgain called')
      this.$auth.login().then(() => {
        if (this.resolveNoAccess !== null) {
          this.noAccessSnackbar = false
          console.log('resolveNoAccess true')
          this.resolveNoAccess(true)
        }
      })

    },
  }
})
</script>
