<template>
  <div class="advanced-search kempo-search">
    <q-input
      v-model="localSearchText"
      outlined
      dense
      clearable
      :placeholder="placeholder"
      class="full-width search-input"
      @keyup.enter="emitSearch"
      @clear="clearSearch"
    >
      <template v-slot:prepend>
        <q-icon name="search" color="primary" />
      </template>
      
      <template v-slot:append>
        <q-btn
          v-if="showFilter && searchFields.length > 0"
          round
          flat
          dense
          icon="filter_alt"
          size="sm"
          :color="selectedFields.length > 0 && selectedFields.length < searchFields.length ? 'primary' : 'grey-7'"
          class="q-mr-xs filter-btn"
        >
          <q-badge v-if="selectedFields.length > 0 && selectedFields.length < searchFields.length" 
            floating color="primary" text-color="white">
            {{ selectedFields.length }}
          </q-badge>
          
          <q-menu anchor="bottom right" self="top right" class="filter-menu">
            <q-card flat bordered class="no-shadow">
              <q-card-section class="q-pa-sm bg-grey-2">
                <div class="text-subtitle1 text-weight-medium">Filtrer par</div>
              </q-card-section>
              
              <q-card-section class="q-pa-none">
                <q-list padding>
                  <q-item tag="label" v-if="searchFields.length > 1" clickable v-ripple>
                    <q-item-section side>
                      <q-checkbox v-model="selectAllFields" @update:model-value="toggleAllFields" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-weight-medium">Tous les champs</q-item-label>
                    </q-item-section>
                  </q-item>
                  
                  <q-separator v-if="searchFields.length > 1" spaced />
                  
                  <q-item tag="label" v-for="field in searchFields" :key="field.value" clickable v-ripple>
                    <q-item-section side>
                      <q-checkbox v-model="selectedFields" :val="field.value" color="primary" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ field.label }}</q-item-label>
                      <q-item-label caption v-if="field.description">{{ field.description }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
              
              <q-separator />
              
              <q-card-actions align="right">
                <q-btn
                  flat
                  dense
                  color="grey-7"
                  label="Annuler"
                  no-caps
                  v-close-popup
                />
                <q-btn
                  color="primary"
                  flat
                  dense
                  label="Appliquer"
                  no-caps
                  @click="applyFiltersAndSearch"
                  v-close-popup
                />
              </q-card-actions>
            </q-card>
          </q-menu>
        </q-btn>
        
        <q-btn
          round
          flat
          dense
          icon="search"
          size="sm"
          color="primary"
          @click="emitSearch"
          class="search-btn"
        />
      </template>
    </q-input>
    
    <transition-group
      name="fade-tag"
      class="q-mt-xs search-tags"
      tag="div"
      appear
      v-if="showActiveTags && selectedFields.length > 0 && selectedFields.length < searchFields.length"
    >
      <q-chip
        v-for="field in activeSearchFields"
        :key="field.value"
        removable
        dense
        size="sm"
        outline
        color="primary"
        @remove="removeField(field.value)"
        class="search-tag"
      >
        {{ field.label }}
      </q-chip>
    </transition-group>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Rechercher...'
  },
  searchFields: {
    type: Array,
    default: () => []
  },
  showFilter: {
    type: Boolean,
    default: true
  },
  showActiveTags: {
    type: Boolean,
    default: true
  },
  autoApply: {
    type: Boolean,
    default: true
  },
});

const emit = defineEmits(['update:modelValue', 'search', 'clear']);

// État local
const localSearchText = ref(props.modelValue);
const selectedFields = ref([]);
const selectAllFields = ref(false);

// Surveiller les changements du modèle externe
watch(() => props.modelValue, (newValue) => {
  localSearchText.value = newValue;
}, { immediate: true });

// Émettre les changements de texte
watch(localSearchText, (newValue) => {
  emit('update:modelValue', newValue);
  
  if (props.autoApply && newValue === '') {
    // Si le texte est effacé et autoApply est activé, effectuer une recherche vide
    emit('clear');
  }
});

// Initialiser les champs sélectionnés par défaut
onMounted(() => {
  if (props.searchFields.length > 0) {
    // Sélectionner tous les champs par défaut
    selectedFields.value = props.searchFields.map(field => field.value);
    updateSelectAllState();
  }
});

// Obtenir les champs actifs (avec leurs labels)
const activeSearchFields = computed(() => {
  return props.searchFields.filter(field => selectedFields.value.includes(field.value));
});

// Mettre à jour l'état "tous sélectionnés"
const updateSelectAllState = () => {
  selectAllFields.value = selectedFields.value.length === props.searchFields.length;
};

// Basculer tous les champs
const toggleAllFields = (checked) => {
  if (checked) {
    selectedFields.value = props.searchFields.map(field => field.value);
  } else {
    selectedFields.value = [];
  }
};

// Surveiller les changements dans la sélection des champs
watch(selectedFields, () => {
  updateSelectAllState();
});

// Supprimer un champ de la sélection
const removeField = (fieldValue) => {
  selectedFields.value = selectedFields.value.filter(val => val !== fieldValue);
  emitSearch();
};

// Appliquer les filtres et effectuer la recherche
const applyFiltersAndSearch = () => {
  emitSearch();
};

// Émettre l'événement de recherche
const emitSearch = () => {
  if (selectedFields.value.length === 0 && localSearchText.value) {
    // Si aucun champ n'est sélectionné mais qu'il y a du texte, sélectionner tous les champs
    selectedFields.value = props.searchFields.map(field => field.value);
    updateSelectAllState();
  }
  
  emit('search', {
    text: localSearchText.value,
    fields: selectedFields.value
  });
};

// Effacer la recherche
const clearSearch = () => {
  localSearchText.value = '';
  emit('clear');
};
</script>

<style>
.advanced-search {
  margin-bottom: 8px;
}

.advanced-search .search-input {
  transition: all 0.3s ease;
}

.advanced-search .search-input:focus-within .q-field__control {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.advanced-search .search-input .q-field__control {
  border-radius: 8px;
}

.advanced-search .search-btn,
.advanced-search .filter-btn {
  transition: transform 0.2s ease, background-color 0.3s ease;
}

.advanced-search .search-btn:hover,
.advanced-search .filter-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

.advanced-search .search-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.advanced-search .search-tag {
  transition: all 0.3s ease;
}

.advanced-search .search-tag:hover {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Animations pour les tags */
.fade-tag-enter-active,
.fade-tag-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-tag-enter-from,
.fade-tag-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

.fade-tag-move {
  transition: transform 0.3s;
}

.filter-menu {
  min-width: 250px;
}

.filter-menu .q-card {
  border-radius: 8px;
}
</style>