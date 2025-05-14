<template>
  <q-item
    clickable
    :tag="isExternalLink ? 'a' : 'div'"
    :target="isExternalLink ? '_blank' : undefined"
    :href="isExternalLink ? props.link : undefined"
    @click="!isExternalLink && navigateToRoute(props.link)"
  >
    <q-item-section
      v-if="props.icon"
      avatar
    >
      <q-icon :name="props.icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ props.title }}</q-item-label>
      <q-item-label caption>{{ props.caption }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps({
  title: {
    type: String,
    required: true
  },

  caption: {
    type: String,
    default: ''
  },

  link: {
    type: String,
    default: '#'
  },

  icon: {
    type: String,
    default: ''
  }
})

const isExternalLink = computed(() => {
  return props.link.startsWith('http://') || props.link.startsWith('https://');
});

const navigateToRoute = (path) => {
  if (path.startsWith('#/')) {
    // Remove the hash and navigate
    router.push(path.substring(1));
  } else {
    router.push(path);
  }
};
</script>
