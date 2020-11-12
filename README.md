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
  * [``popupFailedNotifier``](#popupfailednotifier)
  * [``loginRequiredNotifier``](#loginrequirednotifier)
  * [noAccessNotifier](#noaccessnotifier)
- [Access rights](#access-rights)
- [Usage](#usage)
  * [Login/logout button](#loginlogout-button)
  * [Routes](#routes)
  * [Hiding links with no access](#hiding-links-with-no-access)
  * [Programmatically checking if user has access rights](#programmatically-checking-if-user-has-access-rights)
  * [Implementing popup failed notifier](#implementing-popup-failed-notifier)
  * [Implementing login required notifier](#implementing-login-required-notifier)
  * [Implementing no access notifier](#implementing-no-access-notifier)

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

When a user clicks on a "login" button, the application calls 
``this.$auth.login() / api.login()``. This call should be made
preferably in a synchronous method and not in setTimeout or delayed tasks
(doing so might prevent the popup in firefox and add blockers).

The process follows as:

  * User clicks 'login' button
  * App calls ``api.login()``. The result of the call is a promise for which
    the application might listen to
  * The library checks if the user is logged in on the server. If yes,
    the state is synchronized and login finishes.
  * The library opens a popup window, passing it a `loginUrl?next=completeUrl`
  * `loginUrl`, mostly implemented by a server is responsible for the login process
  * When the login process is finished, `completeUrl` is called
  * The completion page is responsible for passing the login state back (see details below)
  * The library receives the information, closes the window and resolves the promise 

What can go wrong:
  
  * Popup can not be created (for example an over-eager add-blocker) forbids the popup. 
    Application might define a ``popupFailedNotifier`` whose
    responsibility is to inform that this happened and give user
    the opportunity to either repeat the login (if the issue has been fixed)
    or log in via redirection. This works as follows:

      * The current window is redirected to  `loginUrl?next=completeUrl` as 
        in the previous case
      * When the login process is finished, `completeUrl` is called. This is
        always in the form of `completeUrl?next=<vue page where the login started>`.
        If this argument is present, the page should not perform channel-based
        notification (as there is no opener that should be notified) but
        should redirect browser to the target page
      * The vue page is loaded and should call (for example in App or route
        guard)  ``api.check()`` that synchronizes the logging state in Vue app
        with that on the server
      
  * User can not log in and sticks on the login page. Both pages are open
    and user must close them both. There is currently no timeout implemented
    for the login process.
    
  * User has logged in but the library failed to close the window (again, 
    add blocker or similar blocking library). The ``completeUrl`` page should
    inform the user that something is not right and ask him to close the page.
    After closing the user should be logged in.
    
### Login-required route guards

A guard might be configured in the router for pages that require authentication.
If a user clicks on a link protected by the guard and is not logged in,
the login must happen.

Unfortunately we can not initiate the popup login at this moment - too much 
time and javascript calls have passed between the time user clicked on 
the link and route guard was triggered and this would cause the popup be blocked.

Because of that application can register a ``loginRequiredNotifier`` that should
display that login is required and provide a ``login`` button
on which the user would click.

### Unauthorized guards

A guard might be configured that only a subset of users have access - for example,
only editors can get in. If a user does not have editor role, we should inform 
him and give him opportunity to log out / log in as someone else (or switch roles
if application allows that).

For a cases like this a ``noAccessNotifier`` can be configured that is called
and decides whether to ask for login, continue with the navigation or prevent it. 

## Configuration

```javascript
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
    completeUrl?: string;
    redirectionCompleteUrl?: string;
    stateUrl?: string;
    nextQueryParam?: string;
    loginStateTransformer?: LoginStateTransformer<UserAuthenticationState>;
    popupFailedNotifier?: PopupFailedNotifier;
    loginRequiredNotifier?: LoginRequiredNotifier;
    noAccessNotifier?: NoAccessNotifier;    
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

### ``completeUrl``

Default: ``/auth/complete``

An url passed as `?next` to the login page. This url MUST be in the same
domain as the Vue application and must:

  * if it receives a `?next` parameter it should redirect to this url
  * Otherwise it should send a message to the frontend app via:
  
```html
<script>
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
</script>
```

### ``redirectionCompleteUrl``

Default: same as ``completeUrl``

If set this url will be used as ``completeUrl`` in case when could not open
popup and login via same page redirection.

### ``stateUrl``

A url implemented by the server that provides login status. It should support
HTTP GET method and preferably return:

```json
{
    "loggedIn": "true",
    "needsProvided": ["viewer", "editor", {
       "admin": {
         "departments": [110, 115]
       }
    }]
}
```    

See "Authorization" section below for the description of needs.

### ``loginStateTransformer``

Default: identity function

If ``stateUrl`` above does not return the representation required, this function
has to be provided to convert the response to ``{"loggedIn", "needsProvided"}``
structure.

### ``popupFailedNotifier``

``function (): Promise<boolean>``

When pop-ups are blocked, this async notifier should create an in-page popup 
and direct user what to do. It promises to return ``true`` if redirection-based
login should be performed or ``false`` if it handled the situation and user is
being logged in.

The function should explain the situation and suggest the user:
  * to enable popups. It should show a button calling ``usePopupLogin().login()``
    function and return Promise resolving to false after the button is clicked 
  * to continue with redirection. On user selection it should return promise 
    resolving to true. This will cause immediate redirection to the login url 
    with the consequence that data entered on the page will be lost.

### ``loginRequiredNotifier``

``function (extra: { [key: string]: any }) 
    => Promise<boolean | string | Location>``

This notifier is called from route guard when login is required and user is not
logged in. The notifier should normally display a popup explaining the situation
and a button "Log in". When the button is clicked, ``usePopupLogin().login()``
should be called as soon as possible and Promise.resolve(true) returned.

Alternatively the notifier may return eiter a string and the browser will
be redirected to this url (bypassing the router) or it can return router
Location (that is, ``{name:'blah', ...}``) and router will be navigated to
this url instead. 

### noAccessNotifier

``function (state: AuthenticationState, extra: { [key: string]: any }) 
     => Promise<boolean | string | Location>``

A route guard may perform permission checks. If these checks fail and user
is logged in, noAccessNotifier is called.

The ``extra`` parameter contains prop ``route`` with the target route where
the user wants to navigate.

A sane implementation is to show the user that he has no rights to continue
and either Promise.reject(false) that will prevent the navigation or 
return a redirection url to log the user out.

Promise.resolve(true) might be returned as well - in this case the notifier
must clear any internal state of the application (as user is going 
to logout/login as someone else or select a different role), and initiate 
login via ``.login`` method on the api. 
 
For security reasons we do not suggest this as you risk that parts of the
internal state might not be cleared (in libraries etc). 

## Access rights

Access rights are represented as application needs that must be fulfilled
by the user.

The application provides a ``needsRequired`` array and user has associated 
``needsProvided`` array.

To evaluate the rights, the library iterates ``needsRequired`` array and checks
if any of those match ``needsProvided``. If so, the user is allowed the access.

The matching process of the need:
   * if the need is a simple string, ``needsProvided`` are searched for the same
     string. If found, access allowed
   * if the need is a function, it is executed with 
        ``(state: UserAuthenticationState, 
           providedNeeds: Need[], 
           extra: any)`` and should return true if access allowed
   * if the need is an object/array, it is checked if it is contained
   (overlaps) in any of the needsProvided. See ``lodash.isMatch`` for 
   details about the comparison.
 
## Usage

### Login/logout button

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

### Implementing popup failed notifier

The exact implementation of the popup failed
notifier depends on the framework you are using.

For example, in quasar you can use ``BottomSheet`` plugin:

```javascript
function popupFailedNotifier() {
     return new Promise((resolve) => {
         BottomSheet.create({ 
             message: 'Could not log you in because you have popup windows disabled for this site. ....',
             actions: [{
                 label: 'Try again',
                 img: '/img/login.png',
                 id: 'again'
             },{
                 label: 'Leave the page to log in',
                 img: '/img/login.png',
                 id: 'redirect'
             }]
          }).onOk(action => {
              resolve(action === 'redirect')
          })
     })
}
```

See [App.vue](src/App.vue) for Vuetify example.

### Implementing login required notifier

Again depends on the framework. In quasar:

```javascript
function loginRequiredNotifier() {
    const auth = usePopupLogin()
    return new Promise((resolve) => {
        BottomSheet.create({ 
            message: 'Authentication required. Click on the button below to log in.',
            actions: [{
                label: 'Log in',
                img: '/img/login.png',
                id: 'log in'
            }]
         }).onOk(() => {
             auth.login()
             resolve(true)
         })
    })
}
```

See [App.vue](src/App.vue) for Vuetify example.

### Implementing no access notifier

This notifier should normally never be called because application should not 
show links to pages user has no access to. A simple alert with redirection
to the homepage might be enough to handle the case gracefully.
