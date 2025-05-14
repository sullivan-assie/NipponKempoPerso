<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <div class="auth-layout">
        <div class="auth-header">
          <h1>Nippon Kempo</h1>
        </div>

        <router-view />
      </div>
    </q-page-container>
  </q-layout>
</template>

<script>
export default {
  name: 'AuthLayout'
}
</script>

<style lang="scss" scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 5vh;
  background-color: #f5f5f5;
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;


  .app-logo {
    width: 100px;
    height: auto;
    margin-bottom: 1rem;
  }
}
</style>