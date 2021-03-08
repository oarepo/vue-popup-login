<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white" height-hint="98">
      <q-toolbar>
        <q-toolbar-title>
          <q-avatar>
            <img src="https://cdn.quasar.dev/logo/svg/quasar-logo.svg">
          </q-avatar>
          Popup Login Demo
        </q-toolbar-title>

        <q-btn flat
            href="https://github.com/oarepo/vue-popup-login"
            target="_blank"
        >
          <q-icon name="open_in_new" class="q-pr-sm" size="small"/>
          Latest Release
        </q-btn>

      </q-toolbar>
    </q-header>

    <q-page-container class="q-ma-xl">
      <router-view/>
    </q-page-container>

  </q-layout>
</template>

<script lang="ts">
import {defineComponent, ref} from 'vue';
import {
  REDIRECT_LOGIN, usePopupLogin,
} from '@oarepo/vue-popup-login';
import {useQuasar} from "quasar";

export default defineComponent({
  name: 'App',
  setup() {
    const auth = usePopupLogin()
    const quasar = useQuasar()

    auth.check()

    const resolveFailedPopup = ref<any>(null)
    const resolveNoAccess = ref<any>(null)

    function popupFailed() {
      return new Promise((resolve: any) => {
        resolveFailedPopup.value = resolve
        popupFailedDialog()
      })
    }

    function noAccess() {
      return new Promise((resolve: any) => {
        resolveNoAccess.value = resolve
        popupNoAccessDialog()
      })
    }


    function popupFailedDialog() {
      quasar.dialog({
        ok: 'Retry',
        cancel: 'Go to login page',
        title: 'Popup login failed',
        message: `Opening the popup for logging in has failed.
      You can either enable popups for this site and
      try again, or we can take you to login page -
      but you will loose any changes you might have performed
      on this page.`
      }).onOk(() => {
        // retry
        resolveFailedPopup.value(auth.login())
      }).onCancel(() => {
        // redirect
        resolveFailedPopup.value(REDIRECT_LOGIN)
      })
    }

    function popupNoAccessDialog() {
      quasar.dialog({
        ok: 'Log in',
        title: 'Access denied',
        message: `You do not have an access to this page. Please log in.`
      }).onOk(() => {
        // retry
        resolveNoAccess.value(auth.login())
      })
    }

    auth.options.popupFailedHandler = popupFailed as any
    auth.options.loginRequiredHandler = noAccess as any
  }
})
</script>
