<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  document.body.classList.add('kempo-app');
});
</script>
