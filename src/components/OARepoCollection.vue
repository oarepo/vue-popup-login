<template>
<div class="container" v-if="loaded">
    <slot name="title" v-bind:collection="collection" v-bind:items="items" v-bind:aggregations="aggregations">
        <h3>{{ collection.title[locale] || collection.title.en }}</h3>
    </slot>

    <slot name="content-before" v-bind:collection="collection" v-bind:items="items" v-bind:aggregations="aggregations">
    </slot>

    <slot name="raw-content" v-bind:collection="collection" v-bind:items="items" v-bind:aggregations="aggregations">
    </slot>

    <slot name="content-after" v-bind:collection="collection" v-bind:items="items" v-bind:aggregations="aggregations">
    </slot>

</div>
</template>

<script>
import Vue from 'vue';
import Component from 'vue-class-component';
import { Watch, Emit } from 'vue-property-decorator';
import OARepoFacetList from './OARepoFacetList.vue';

export default @Component({
    props: {
        collectionCode: String,
        collectionModule: Object,
        locale: String,
    },
    components: {
        'oarepo-facet-list': OARepoFacetList,
    },
    name: 'oarepo-collection',
})
class OARepoCollection extends Vue {
    // getters
    get loaded() {
        return this.collectionModule.collectionListModule.loaded;
    }

    get collection() {
        return this.collectionModule.collectionListModule.collections.find(
            value => value.code === this.collectionCode,
        );
    }

    get aggregations() {
        return this.collectionModule.aggregations;
    }

    get items() {
        return this.collectionModule.items;
    }

    @Emit('dataLoaded')
    reloadData() {
        return new Promise((resolve) => {
            this.collectionModule.collectionListModule.loadCollections().then(
                () => {
                    this.collectionModule.search({
                        collectionDefinition: this.collection,
                        params: this.$route.query,
                    }).then(({ append }) => {
                        resolve({
                            append,
                        });
                    });
                },
            );
        });
    }

    mounted() {
        this.reloadData();
    }

    @Watch('locale')
    onLocaleChanged(locale) {
        this.collectionModule.changeLocale(locale);
    }

    @Watch('$route')
    onQueryChanged() {
        this.reloadData();
    }
}
</script>

<style>
</style>
