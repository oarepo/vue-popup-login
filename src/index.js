import OARepoCollectionList from './components/OARepoCollectionList.vue';
import OARepoCollection from './components/OARepoCollection.vue';
import OARepoCollectionItem from './components/OARepoCollectionItem.vue';
import OARepoFacetList from './components/OARepoFacetList.vue';

import Query from './services/query';
import { CollectionListModule, CollectionModule, CollectionItemModule } from './store/collections_export';

// Export components individually
export {
    OARepoCollection,
    OARepoCollectionItem,
    OARepoCollectionList,
    OARepoFacetList,
    Query,
    CollectionListModule,
    CollectionModule,
    CollectionItemModule,
};

// What should happen if the user installs the library as a plugin
function install(Vue) {
    Vue.component('oarepo-collection-list', OARepoCollectionList);
    Vue.component('oarepo-collection', OARepoCollection);
    Vue.component('oarepo-collection-item', OARepoCollectionItem);
    Vue.component('oarepo-facet-list', OARepoFacetList);
}

// Export the library as a plugin
export default install;
