<template>
<div>
    <slot v-bind:facets="facets">
    </slot>
</div>
</template>

<script>
import Vue from 'vue';
import Component from 'vue-class-component';
import Query from '../services/query';

export default @Component({
    name: 'oarepo-facet-list',
    props: {
        facets: Object,
    },
})
class OARepoFacetList extends Vue {
    facetSelected(bucketP, selected) {
        const bucket = bucketP;

        const q = new Query(this.$route.query);
        if (selected) {
            q.set(bucket.facet, bucket.key);
        } else {
            q.remove(bucket.facet, bucket.key);
        }
        this.$router.push({
            query: q.query,
        });
    }
}
</script>

<style>

</style>
