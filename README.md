# Popup Login in VueJS

A simple package adding generic log-in process in a popup window.
This allows for finishing any 3rd party login (such as oath) without
reloading the application.

Falls back to redirect-based login if popup windows are blocked. 

## Usage scenario

User fills in reservation form and then decides to log in. Normal oauth login scenario
would require to serialize the state of the form, redirect to authentication uri,
redirect back to the application and retrieve the saved state.

With this plugin, the login is performed on background.

*Javascript code:*

```javascript

import Vue from 'vue';
import Component from 'vue-class-component';

export default @Component({})
class Layout extends Vue {
    get auth() {
        return this.auth$.authInfo;
    }

    get loggedLocally() {
        return this.auth$.loggedLocally;
    }

    login() {
        this.auth$.login(this);
    }

    logout() {
        window.location = this.auth$.authLogoutURL;
    }

    mounted() {
        this.auth$.getLoginState();
    }
}

```

*HTML:*

```html

<div v-if="loggedLocally">
    <q-btn @click="logout"> logged in, auth info {{ auth }}</q-btn>
</div>
<div v-else>
    <q-btn @click="login"> Please log in</q-btn>
</div>


```


## Configuration

```javascript
import PopupAuthModule from '@CESNET/vue-popup-login';

let apiURL = "/api/1.0/";

Vue.use(PopupAuthModule, {
    // the module saves state to store, "auth" module
    store: store,
    
    // url on the backend that returns current auth state
    authStateURL: `${apiURL}auth/state`,
    
    // url on the backend that provides login
    authLoginURL: `${apiURL}auth/login`,
    
    // url on the backend that provides logout
    authLogoutURL: `${apiURL}auth/logout`,
    
    iframeCreator: undefined,
    
    // callback when popup is blocked. Can be used to
    // degrade gracefully to redirect-based authentication
    popupBlockedCallback: () => {},
});
```


## Backend Support

This plugin requires three URLs for functioning:

### authStateURL

This url should return json with at least:

```json

{
    "logged_in": true
}

```

This json is put to store as `authInfo` and can be accessed either via the store 
or as `this.auth$.authInfo`. Backend may add whatever other information is required -
such as profile, groups, roles, effective permissions, ...

### authLoginURL

This url is responsible for conducting the login process and sending back an information
when the login process has finished.

Flask example:

```python
@blueprint.route('/auth/login')
def perform_login():
    login_url = url_for('security.login')
    nextparam = urlencode({
        'next': url_for('my.login_complete')
    })
    login_url += '?' + nextparam
    resp = render_template('page_if_redirect_blocked.html', redir=login_url)
    return current_app.response_class(
        resp,
        status=302,
        mimetype='text/html',
        headers={
            'Location': login_url,
        }
    )
    
@blueprint.route('/auth/complete')
def login_complete():
    return render_template('login_complete.html')

```

`login_complete.html` is responsible for notifying the vue application that the login process has ended:

```html

<html>
<body>
    Login has been successful, redirecting back to the application.
</body>
<script>

  // notify the opener that the login has finished
  window.opener.postMessage('popup-login-finished');
  
  setTimeout(function() {
      // close the window if the vue application does not react, normally not necessary
      window.close();
  }, 1000);
  
</script>
</html>


```


## Support for iframes

If `iframeCreator` is set up it should be a function taking URL of the login page and returning
another function for closing the iframe. Example:

```javascript

iframeCreator(loginPageURL) 
{
    dialog = createDialogOverlay();
    iframe = dialog.createIFrame(loginPageURL);
    
    return function() {
        dialog.close()
    };
}

```

When the iframe creator is set, no popup is created and the login will be performed
via this iframe. Note that not all backends (such as shibboleth) support logging
in iframes by default.
