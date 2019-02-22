export default class Query {
    constructor(queryDict) {
        this.query = Object.assign({}, queryDict || {});
    }

    set(key, value) {
        const stringValue = value.toString();
        const prev = this.query[key];

        if (prev === undefined) {
            this.query[key] = [];
        } else if (!Array.isArray(this.query[key])) {
            this.query[key] = [this.query[key]];
        } else {
            this.query[key] = this.query[key].slice();
        }

        this.query[key] = this.query[key].filter(x => x !== stringValue);
        this.query[key].push(stringValue);
    }

    remove(key, value) {
        const stringValue = value.toString();
        const prev = this.query[key];

        if (prev === undefined) {
            return;
        } if (!Array.isArray(this.query[key])) {
            this.query[key] = [this.query[key]];
        } else {
            this.query[key] = this.query[key].slice();
        }
        this.query[key] = this.query[key].filter(x => x !== stringValue);

        if (this.query[key].length === 0) {
            delete this.query[key];
        }
    }

    has(key, value) {
        const stringValue = value.toString();
        const prev = this.query[key];

        if (prev === undefined) {
            return false;
        } if (!Array.isArray(this.query[key])) {
            this.query[key] = [this.query[key]];
        }
        return this.query[key].filter(x => x === stringValue).length > 0;
    }
}
