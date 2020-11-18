# vue-popup-login

A library thant brings authentication and authorization to vuejs applications
via login in a popup window. This enables you not to interrupt whatever modifications
user has performed on a page. 

The library is compatible (with appropriate server support) with openid and
shibboleth authentication. 

The 1.x version and branch uses the plain old Vue 2.0 objects.

The 2.x version depends on vue composition API plugin for Vue 2.0.
the upcoming 3.x version will be compatible with Vue 3.

<!-- toc -->

- [Installation](#installation)
- [Demo](#demo)
- [Principle](#principle)
  * [Login button](#login-button)
  * [Login-required route guards](#login-required-route-guards)
  * [Unauthorized guards](#unauthorized-guards)
- [Configuration](#configuration)
  * [``loginUrl``](#loginurl)
  * [``nextQueryParam``](#nextqueryparam)
  * [``logoutUrl``](#logouturl)
  * [``completeUrl``](#completeurl)
  * [``redirectionCompleteUrl``](#redirectioncompleteurl)
  * [``stateUrl``](#stateurl)
  * [``loginStateTransformer``](#loginstatetransformer)
  * [``popupFailedHandler``](#popupfailedhandler)
  * [``loginRequiredHandler``](#loginrequiredhandler)
  * [``noAccessHandler``](#noaccesshandler)
- [Access rights](#access-rights)
- [Usage](#usage)
  * [Login/logout button and login state](#loginlogout-button-and-login-state)
  * [Routes](#routes)
  * [Hiding links with no access](#hiding-links-with-no-access)
  * [Programmatically checking if user has access rights](#programmatically-checking-if-user-has-access-rights)
  * [Implementing popup failed handler](#implementing-popup-failed-handler)
  * [Implementing login required handler](#implementing-login-required-handler)
  * [Implementing no access handler](#implementing-no-access-handler)

<!-- tocstop -->

## Installation
```
yarn add @oarepo/vue-popup-login@^2.0.0
```

## Demo

The demo is in the [src](src) directory. Installation of the plugin is at 
[main.ts](src/main.ts), usage examples of route guards 
in [route.ts](src/router/index.ts), application page with protected links
at [Home.vue](src/views/Home.vue), ui callbacks in [App.vue](src/App.vue).

See the sections below for details. To run the demo:

```
yarn install
yarn serve
```

## Principle

### Login button

The application might use the api in "option" style (that is, via ``this.$auth``)
or via composition style:

```javascript
{
    setup(props, ctx) {
        const api = usePopupLogin()
    }
}
```

When a user clicks on a "login" button, the application should call 
``this.$auth.login() / api.login()``. This call should be made
preferably in a synchronous method and not in setTimeout or delayed tasks
(doing so might prevent the popup in firefox and with some add blockers).

The process follows as:

  * User clicks 'login' button
  * App calls ``api.login()``. The result of the call is a boolean promise (true meaning logged in)
  * The library checks if the user is logged in on the server. If yes, the state is synchronized 
    and login finishes.
  * The library opens a popup window, passing it a `loginUrl?next=completeUrl`
  * `loginUrl`, in most cases implemented by the server, is responsible for the login process
  * When the login process is finished, `completeUrl` is called
  * The completion page is responsible for notifying the application that login has finished (see details below)
  * The library receives the information and closes the window
  * The library checks on the server that the user has indeed logged in  
  * finally the login promise is resolved and application continues  

What can go wrong:
  
  * The popup window could not be created - for example browser setting forbids the popup. 
    The default behaviour is to redirect the user to the login page, thus using the current 
    application state.
    
    Application might prevent this by defining an asynchronous 
    ``popupFailedHandler``. The popup handler might:
    
      * notify the user that this happened, give him guidance how to set the
        browser and display ``login`` button again, calling ``$auth.login()``
        and return its result 
      * or return ``REDIRECT_LOGIN`` to signalize that the library should
        perform redirection to the login page: 
          * The current window is redirected to `loginUrl?next=completeUrl` as 
            in the previous case
          * When the login process is finished, `completeUrl` is called. This is
            always in the form of `completeUrl?next=<vue page where the login started>`.
            If this argument is present, the page should not perform channel-based
            notification (as there is no opener to listen for the notification) but
            should redirect the browser to the target page
          * The vue page is loaded and should call (for example in App or route
            guard)  ``api.check()`` that synchronizes the logging state in Vue app
            with that on the server
      
  * User can not log in and sticks on the login page. Both pages are open
    and user must close them both. There is currently no timeout implemented
    for the login process.
    
  * User has logged in but the library failed to close the window (for example,
    add blocker or browser settings prevent it). The ``completeUrl`` page should
    inform the user (after a couple of seconds) that something is not right and 
    ask him to close the page. After returning to the app the user should be logged in.
    
### Login-required route guards

A guard might be configured in the router for pages that require authentication.
If a user clicks on a link protected by the guard and is not logged in,
the login must happen.

Unfortunately we can not initiate the popup login at this moment - too much 
time and javascript calls have passed between the time user clicked on 
the link and route guard was triggered and this would cause the popup be blocked.

Because of that application can register a ``loginRequiredHandler`` that should
display that login is required and provide a ``login`` button
on which the user would click. The click handler should call $auth.login and its
result should be returned as the result of loginRequiredHandler. A sample implementation
is in the sections below.

### Unauthorized guards

A guard might be configured that only a subset of users have access - for example,
only editors can get in. If a user does not have editor role, we should inform 
him and give him opportunity to log out / log in as someone else (or switch roles
if application allows that).

For a cases like this a ``noAccessHandler`` can be configured that is called
and decides whether to ask for login, continue with the navigation or prevent it. 

## Configuration

```typescript
import Vue from 'vue'
import router from './router'

import CompositionApi from '@vue/composition-api'
Vue.use(CompositionApi)

import PopupLogin from '@oarepo/vue-popup-login'
Vue.use(PopupLogin, {
    router,
    
    // Other options
    loginUrl?: string;
    logoutUrl?: string;
    logoutMethod?: 'GET' | 'POST';
    completeUrl?: string;
    redirectionCompleteUrl?: string;
    stateUrl?: string;
    nextQueryParam?: string;
    loginStateTransformer?: LoginStateTransformer<UserAuthenticationState>;
    popupFailedHandler?: PopupFailedHandler;
    loginRequiredHandler?: LoginRequiredHandler;
    noAccessHandler?: NoAccessHandler;    
})
```

### ``loginUrl``

Default: ``/auth/login``

An url to redirect the user when ``login`` button is clicked. Must accept
the ``?next`` (or the value of ``nextQueryParam``) argument with a url where
to redirect the user when login is completed.

In most cases this page is provided by the login backend.

### ``nextQueryParam``

Default: ``next``

Name of the query parameter that is used to pass the next page to 
``login``, ``logout``, ``complete`` urls.

### ``logoutUrl``

Default: ``/auth/logout``

An url to redirect the user when ``logout`` button is clicked. Must accept
the ``?next`` (or the value of ``nextQueryParam``) argument with a url where
to redirect the user when logout is completed.

In most cases this page is provided by the login backend.

### ``logoutMethod``

Default: ``'GET'``

HTTP method for logging out. If it is 'GET', browser is redirected to this url.
If it is ``POST``, browser performs POST request to this url and is redirected to
'/'.

### ``completeUrl``

Default: ``/auth/complete``

An url passed as `?next` to the login page. This url MUST be in the same
domain as the Vue application and must:

  * if it receives a `?next` parameter it should redirect to this url
  * Otherwise it should send a message to the frontend app via:
  
```html
<script>
if (window.location.query.next) {
   window.location.href = window.location.query.next
} else {
    const bc = new BroadcastChannel('popup-login-channel');
    bc.postMessage({
        type: "login",
        status: "success",  // "or error"
        message: "Sample ok/error message from the auth server"
    })
    // after this message vue frontend will close the window.
    // if it does not happen:
    setTimeout(() => {
        alert(`Could not send login data back to the application. 
               Please close this window manually and reload the application`)
    }, 5000)  
}
</script>
```

### ``redirectionCompleteUrl``

Default: same as ``completeUrl``

If set this url will be used as ``completeUrl`` in case when could not open
popup and login via same page redirection.

### ``stateUrl``

A url implemented by the server that provides login status. It should support
HTTP GET method and preferably return:

```json5
{
    "loggedIn": "true",
    "needsProvided": ["viewer", "editor", {
       "admin": {
         "departments": [110, 115]
       }
    }]
    // any other metadata that server wants to return (for example user name, etc) 
}
```    

See "Authorization" section below for the description of needs.

### ``loginStateTransformer``

Default: identity function

If ``stateUrl`` above does not return the representation required, this function
has to be provided to convert the response to the format above.

### ``popupFailedHandler``

``function (): Promise<boolean>``

When pop-ups are blocked, this async handler should create an in-page popup 
and direct user what to do. It promises to return ``true`` if redirection-based
login should be performed or ``false`` if it handled the situation and user is
being logged in.

The function should explain the situation and suggest the user:
  * to enable popups. It should show a button calling ``usePopupLogin().login()``
    function and return Promise resolving to false after the button is clicked 
  * to continue with redirection. On user selection it should return promise 
    resolving to true. This will cause immediate redirection to the login url 
    with the consequence that data entered on the page will be lost.

See the implementation details below for a sample implementation.

### ``loginRequiredHandler``

``function (extra: { [key: string]: any }) 
    => Promise<REDIRECT_LOGIN | boolean | CANCEL_NAVIGATION | CONTINUE_NAVIGATION | Location>``

This handler is called from route guard when login is required and user is not
logged in. 

The ``extra`` parameter contains prop ``route`` with the target route where
the user wants to navigate.

The handler should normally display a popup explaining the situation
and a button to "Log in". When the button is clicked, ``usePopupLogin().login()``
should be called as soon as possible and its return value returned.

Alternatively the handler may return:
 * ``REDIRECT_LOGIN`` constant to start redirection-based login
 * ``CANCEL_NAVIGATION`` to cancel the navigation and stay on the same page
 * ``CONTINUE_NAVIGATION`` to bypass the login process and allow non-authenticated user to continue to the target page
 * router ``Location`` to navigate to this page instead

### ``noAccessHandler``

``function (state: AuthenticationState, extra: { [key: string]: any }) 
     => Promise<REDIRECT_LOGIN | boolean | CANCEL_NAVIGATION | CONTINUE_NAVIGATION | Location>``

A route guard may perform permission checks. If these checks fail for a logged-in user, noAccessHandler is called.

The ``extra`` parameter contains prop ``route`` with the target route where
the user wants to navigate.

A sane implementation is to show the user that he has no rights to continue and:
  1. log the user out and initiate new login via ``usePopupLogin().login()``
    and returning its return value
  2. logout user and return``REDIRECT_LOGIN`` constant to start redirection-based login
  3. return ``CANCEL_NAVIGATION`` to cancel the navigation and stay on the same page
  4. return ``CONTINUE_NAVIGATION`` to bypass the authorization process and allow non-authorized
    user to continue to the target page
  5. return router ``Location`` to navigate to this page instead
 
For security reasons the first alternative is highly discouraged unless you really know what
you are doing. Your application might contain state dependent on logged-in user which in case
you forget to clear might bring inconsistencies and unexpected application crashes. 

Alternatives 2, 3, 5 or setting ``window.location.href`` directly are much safer alternatives.

## Access rights

Access rights are represented as application needs that must be fulfilled
by the user.

The application provides a ``needsRequired`` array and user has associated 
``needsProvided`` array.

To evaluate the rights, the library iterates ``needsRequired`` array and checks
if any of those match ``needsProvided``. If so, the access is allowed.

The matching process of the need:
   * if the need is a simple string, ``needsProvided`` are searched for the same
     string. If found, access allowed,
   * if the need is a function, it is executed with 
        ``(state: UserAuthenticationState, 
           needsProvided: Need[], 
           extra: any)`` and should return true if access allowed,
   * if the need is an object/array, it is checked if it is contained
   (overlaps) in any of the needsProvided. See ``lodash.isMatch`` for 
   details about the comparison.
 
## Usage

### Login/logout button and login state

```html
<button @click="$auth.logout" v-if="loggedIn">Log out</button>
<button @click="$auth.login" v-else>Log in</button>
```

```javascript
{
    computed: {
        loggedIn: () => this.$auth.state.value.loggedIn 
    }
}
```

Or, in composition api:

```html
<button @click="logout" v-if="loggedIn">Log out</button>
<button @click="login" v-else>Log in</button>
```

```javascript
setup(props, ctx) {
  const {state, login, logout} = usePopupLogin()
  return {
      login,
      logout,
      loggedIn: computed(() => state.value.loggedIn)
  }
}
```

### Routes

To mark that user must be logged in to access a route, add empty meta/authorization
object to the route:

```javascript
routes = [{
    path: '/protected',
    name: 'protected',
    component: () => import('../views/Protected.vue'),
    meta: {
      authorization: {}
    }
}]
```

You might specify the needs/permissions as well:
```javascript
routes=[{
    path: '/editors',
    name: 'editors',
    component: () => import('../views/Editors.vue'),
    meta: {
      authorization: {
        needsRequired: [
           'editors'
        ]
      }
    }
}]
```

### Hiding links with no access

If user is logged in but does not have an access to a page, the link
to the page should not be displayed at all. This library provides a helper
component to hide the link on no access:

```html
<authorized-link :to="{name: 'editors'}" component="v-btn" color="primary">
  This button is shown only to editors
</authorized-link>
```

This component evaluates ``:to`` prop and if user is allowed to navigate 
to this route, it creates a component passed in the ``component`` prop
and passes it all the extra attributes. In the case above it will generate:

```html
<v-btn :to="{name: 'editors'}" color="primary">
  This button is shown only to editors
</v-btn>
```

If user does not have an access, nothing is inserted to the html.

### Programmatically checking if user has access rights 

To check if the current user has access, call 

``` javascript
api.hasAccess(needsRequired, extra)

// or in options mode

this.$auth.hasAccess(needsRequired, extra)

```

### Implementing popup failed handler

The exact implementation of the popup failed
handler depends on the framework you are using.

For example, in quasar you can use ``BottomSheet`` plugin (set it inside App's setup to make sure everything is loaded):

```javascript
api.registerPopupFailedHandler(() => {
  return new Promise((resolve) => {
    BottomSheet.create({
      message: 'Could not log you in because your browser prevents popup windows',
      actions: [
        {
          label: 'Try again',
          icon: 'vpn_key',
          id: 'again'
        },
        {
          label: 'Leave this page and log in via your login server',
          icon: 'login',
          id: 'redirect'
        }]
    }).onOk(action => {
      if (action.id === 'again') {
        resolve(api.login())
      } else {
        resolve(REDIRECT_LOGIN)
      }
    })
  })
})
```

See [App.vue](src/App.vue) for Vuetify example.

### Implementing login required handler

Again depends on the framework. In quasar (set it inside App's setup to make sure everything is loaded):

```javascript
api.registerLoginRequiredHandler(() => {
  return new Promise((resolve) => {
    BottomSheet.create({
      message: 'Authentication required. Click on the button below to log in.',
      actions: [{
        label: 'Log in',
        icon: 'vpn_key',
        id: 'log in'
      }]
    }).onOk(() => {
      resolve(api.login())
    })
  })
})
```

See [App.vue](src/App.vue) for Vuetify example.

### Implementing no access handler

This handler should normally never be called because application should not 
show links to pages user has no access to. A simple alert with redirection
to the homepage might be enough to handle the case gracefully and has already
been implemented in the library.

If you like to use your own implementation, feel free to:

```javascript
api.registerNoAccessHandler(() => {
    // ...
})
```
