<template>
<div class="container" v-if="loaded">
    <template v-if="item && item.metadata">
    <slot name="title" v-bind:collection="collection" v-bind:item="item">
        <h3>{{ item.metadata.title[locale] || item.metadata.title.en }}</h3>
    </slot>

    <slot name="content-before" v-bind:collection="collection" v-bind:item="item">
    </slot>

    <slot name="raw-content" v-bind:collection="collection" v-bind:item="item">
        {{ item }}
    </slot>

    <slot name="content-after" v-bind:collection="collection" v-bind:item="item">
    </slot>
    </template>
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
        collectionItemModule: Object,
        itemId: String,
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
        return this.collectionItemModule.loaded;
    }

    get collection() {
        return this.collectionItemModule.collectionListModule.collections.find(
            value => value.code === this.collectionCode,
        );
    }

    get item() {
        return this.collectionItemModule.item;
    }

    @Emit('dataLoaded')
    reloadData() {
        return new Promise((resolve) => {
            this.collectionItemModule.collectionListModule.loadCollections().then(
                () => {
                    this.collectionItemModule.load({
                        collectionDefinition: this.collection,
                        collectionCode: this.collectionCode,
                        itemId: this.itemId,
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
        this.collectionItemModule.collectionModule.changeLocale(locale);
    }

    @Watch('$route')
    onQueryChanged() {
        this.reloadData();
    }
}
</script>

<style>
</style>
