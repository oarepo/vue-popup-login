/* eslint "import/prefer-default-export": "off" */

import {
    Action, Module, Mutation, VuexModule,
} from 'vuex-class-modules';
import axios from 'axios';
import Query from '../services/query';

const State = {
    INVALID: 0,
    LOADING: 1,
    LOADED: 2,
};

@Module
class CollectionListModule extends VuexModule {
    // state
    collections = [];

    // loading state
    state = State.INVALID;

    @Mutation
    setCollections(collections) {
        this.collections = collections;
    }

    @Mutation
    setState(state) {
        this.state = state;
    }

    get loaded() {
        return this.state === State.LOADED;
    }

    @Action
    async loadCollections(force = false) {
        if (this.loaded && !force) {
            return this.collections;
        }

        this.setState(State.LOADING);
        const response = await axios.get(`${process.env.VUE_APP_OAREPO_API_URL}collections`);
        this.setCollections(response.data);
        this.setState(State.LOADED);

        return response.data;
    }
}

@Module
class CollectionModule extends VuexModule {
    // state
    collectionDefinition = {};

    // translations
    valueTranslator = null;

    state = State.INVALID;

    aggregations = {};

    items = [];

    next = null;

    prev = null;

    queryParams = {};

    collectionListModule = null;

    @Mutation
    setState(state) {
        this.state = state;
    }

    @Mutation
    setCollectionListModule(collectionListModule) {
        this.collectionListModule = collectionListModule;
    }

    @Mutation
    setCollectionDefinition(collectionDefinition) {
        this.collectionDefinition = collectionDefinition;
    }

    @Mutation
    setValueTranslator(valueTranslator) {
        this.valueTranslator = valueTranslator;
    }

    @Mutation
    setQueryParams(queryParams) {
        // make duplicate
        this.queryParams = Object.assign({}, queryParams);
    }

    flatten(aggregations, queryParams) {
        const valueTranslator = this.valueTranslator || (x => x);
        const flattenedAggregations = {};
        Object.entries(aggregations).forEach(([key, val]) => {
            const value = val;

            if (key !== 'doc_count') {
                if (value.buckets !== undefined) {
                    value.label = valueTranslator(key, {
                        type: 'facet',
                    });
                    value.buckets.forEach((x) => {
                        const bucket = x;
                        bucket.facet = key;
                        bucket.label = valueTranslator(x.key, {
                            type: 'bucket',
                            facet: key,
                        });
                        bucket.selected = queryParams.has(key, bucket.key);
                    });
                    flattenedAggregations[key] = value;
                } else {
                    Object.assign(flattenedAggregations, this.flatten(value, queryParams));
                }
            }
        });
        return flattenedAggregations;
    }

    @Mutation
    setSearchResults(
        {
            aggregations,
            items,
            prev,
            next,
            append,
        },
    ) {
        const q = new Query(this.queryParams);
        this.aggregations = this.flatten(aggregations, q);
        if (append) {
            const ids = this.items.map(x => x.id);
            items = items.filter(x => !ids.includes(x.id));
            this.items.push(...items);
        } else {
            this.items = items;
        }
        this.prev = prev;
        this.next = next;
    }

    get restSearchUrl() {
        const col = this.collectionDefinition;
        if (col && col.rest) {
            return col.rest;
        }
        return undefined;
    }

    get loaded() {
        return this.state === State.LOADED;
    }

    @Action
    async search(
        {
            collectionDefinition,
            params,
            force,
            append,
        },
    ) {
        // duplicate params
        const queryParams = params || {};

        if (this.loaded
            && this.collectionDefinition.code === collectionDefinition.code
            && this.queryParams === queryParams && !force) {
            return undefined; // already loaded
        }
        this.setCollectionDefinition(collectionDefinition);
        this.setQueryParams(queryParams);
        this.setState(State.LOADING);

        // convert to http params
        const axiosParams = new URLSearchParams();
        Object.entries(queryParams).forEach(([pkey, pvalue]) => {
            if (Array.isArray(pvalue)) {
                pvalue.forEach((val) => {
                    axiosParams.append(pkey, val);
                });
            } else {
                axiosParams.append(pkey, pvalue);
            }
        });

        const response = await axios.get(`${this.restSearchUrl}`, {
            params: axiosParams,
        });
        const { aggregations, hits, links } = response.data;

        this.setSearchResults({
            aggregations,
            append,
            items: hits.hits,
            prev: links.prev,
            next: links.next,
        });
        this.setState(State.LOADED);
        return { response: response.data, append };
    }

    @Action
    changeLocale() {
        this.setSearchResults({
            aggregations: this.aggregations,
            items: this.items,
            prev: this.prev,
            next: this.next,
        });
    }

    @Action
    async loadNextPage() {
        return this.search({
            collectionDefinition: this.collectionDefinition,
            params: {
                ...this.queryParams,
                page: (this.queryParams.page || 0) + 1,
            },
            force: false,
            append: true,
        });
    }
}

@Module
class CollectionItemModule extends VuexModule {
    // state
    collectionDefinition = {};

    // translations
    valueTranslator = null;

    state = State.INVALID;

    item = {};

    itemId = null;

    collectionListModule = null;

    collectionModule = null;

    @Mutation
    setCollectionListModule(collectionListModule) {
        this.collectionListModule = collectionListModule;
    }

    @Mutation
    setCollectionModule(collectionModule) {
        this.collectionModule = collectionModule;
    }

    @Mutation
    setState(state) {
        this.state = state;
    }

    @Mutation
    setCollectionDefinition(collectionDefinition) {
        this.collectionDefinition = collectionDefinition;
    }

    @Mutation
    setValueTranslator(valueTranslator) {
        this.valueTranslator = valueTranslator;
    }

    @Mutation
    setItem(item) {
        this.item = item;
    }

    @Mutation
    setItemId(itemId) {
        this.itemId = itemId;
    }

    get restUrl() {
        const col = this.collectionDefinition;
        if (col && col.rest) {
            return col.rest;
        }
        return undefined;
    }

    get loaded() {
        return this.state === State.LOADED;
    }

    @Action
    async load(
        {
            collectionDefinition,
            itemId,
            force = false,
        },
    ) {
        if (this.loaded
            && this.collectionDefinition.code === collectionDefinition.code
            && this.itemId === itemId && !force) {
            return undefined; // already loaded
        }

        this.setCollectionDefinition(collectionDefinition);
        this.setItemId(itemId);
        this.setState(State.LOADING);

        const response = await axios.get(`${this.restUrl}/${this.itemId}`);
        const item = response.data;

        this.setItem(item);
        this.setState(State.LOADED);
        return { item: response.data };
    }
}

export {
    CollectionListModule,
    CollectionModule,
    CollectionItemModule,
    State,
};
