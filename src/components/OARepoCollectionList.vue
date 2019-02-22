<template>
<div>
    <template v-for="collection of collections">
    <slot v-bind:collection="collection">
    </slot>
    </template>
</div>
</template>

<script>

import Vue from 'vue';
import Component from 'vue-class-component';

export default @Component({
    props: {
        collectionListModule: Object,
    },
})
class OARepoCollectionList extends Vue {
    // getters
    get collections() {
        return this.collectionListModule.collections;
    }

    mounted() {
        this.collectionListModule.loadCollections();
    }
}
</script>
