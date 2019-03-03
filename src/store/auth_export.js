import {
    Action,
    Module,
    Mutation,
    VuexModule,
} from 'vuex-class-modules';
import axios from 'axios';

const State = {
    INVALID: 0,
    LOADING: 1,
    LOADED: 2,
};

@Module
class AuthModule extends VuexModule {
    // state
    authInfo = {};

    // loading state
    state = State.INVALID;

    authStateURL = null;

    authLogoutURL = null;

    @Mutation
    setAuthInfo(authInfo) {
        this.authInfo = authInfo;
    }

    @Mutation
    setState(state) {
        this.state = state;
    }

    @Mutation
    setAuthStateURL(authStateURL) {
        this.authStateURL = authStateURL;
    }

    @Mutation
    setAuthLogoutURL(authLogoutURL) {
        this.authLogoutURL = authLogoutURL;
    }

    get loaded() {
        return this.state === State.LOADED;
    }

    get loggedLocally() {
        return this.loaded && this.authInfo.logged_in;
    }

    @Action
    async loggedIn(force = false, ensureLoggedIn = false) {
        if (force || !this.loaded || (ensureLoggedIn && !this.loggedLocally)) {
            return this.login(ensureLoggedIn);
        }
        return this.authInfo.logged_in;
    }

    @Action
    async getLoginState() {
        // eslint-disable-next-line no-await-in-loop
        const response = await axios.get(this.authStateURL);

        // if logged in, just return login data to be set by mutation action
        if (response.data.logged_in) {
            this.setAuthInfo(response.data);
            this.setState(State.LOADED);
        }

        return this.loggedLocally;
    }

    @Action
    async performLogIn(vue) {
        // set state as loading
        this.setState(State.LOADING);

        // show the login popup and wait for the it (success or canceled)
        await vue.loginPopup$.waitForLogin();

        return this.loggedLocally;
    }

    @Action
    async login(vue, ensureLoggedIn = true) {

        this.setState(State.LOADING);
        const response = await axios.get(this.authStateURL);
        this.setAuthInfo(response.data);
        this.setState(State.LOADED);

        if (this.loggedLocally) {
            return true;
        }

        if (!ensureLoggedIn) {
            return null;
        }

        return this.performLogIn(vue);
    }
}

export default AuthModule;
