<template>
  <q-page class="flex flex-center">
    <q-card class="auth-card">
      <q-card-section class="text-center">
        <div class="text-h5 q-mt-sm q-mb-md">Réinitialisation du mot de passe</div>
        
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="password"
            label="Nouveau mot de passe"
            type="password"
            :rules="[
              val => !!val || 'Ce champ est obligatoire',
              val => val.length >= 8 || 'Le mot de passe doit contenir au moins 8 caractères'
            ]"
            lazy-rules
            outlined
          />

          <q-input
            v-model="confirmPassword"
            label="Confirmer le mot de passe"
            type="password"
            :rules="[
              val => !!val || 'Ce champ est obligatoire',
              val => val === password || 'Les mots de passe ne correspondent pas'
            ]"
            lazy-rules
            outlined
          />

          <div class="q-mt-md">
            <q-btn 
              label="Réinitialiser mon mot de passe" 
              type="submit" 
              color="primary" 
              class="full-width"
              :loading="loading"
            />
          </div>

          <div class="text-center q-mt-md">
            <q-btn 
              flat 
              color="secondary" 
              label="Retour à la connexion" 
              to="/login" 
              class="q-mt-sm" 
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { ref } from 'vue'
import { api } from 'src/boot/axios'
import { useQuasar } from 'quasar'
import { useRouter, useRoute } from 'vue-router'

export default {
  name: 'ResetPasswordPage',
  
  setup() {
    const password = ref('')
    const confirmPassword = ref('')
    const loading = ref(false)
    const $q = useQuasar()
    const router = useRouter()
    const route = useRoute()

    const onSubmit = async () => {
      loading.value = true
      
      // Récupérer le token depuis les paramètres de l'URL
      const token = route.params.token
      
      try {
        const response = await api.post(`/auth/reset-password/${token}`, {
          password: password.value
        })
        
        $q.notify({
          type: 'positive',
          message: response.data.message || 'Votre mot de passe a été réinitialisé avec succès',
          position: 'top',
          timeout: 5000
        })
        
        // Rediriger vers la page de connexion après quelques secondes
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } catch (error) {
        const message = error.response?.data?.message || 'Une erreur est survenue lors de la réinitialisation du mot de passe'
        
        $q.notify({
          type: 'negative',
          message,
          position: 'top',
          timeout: 5000
        })
      } finally {
        loading.value = false
      }
    }

    return {
      password,
      confirmPassword,
      loading,
      onSubmit
    }
  }
}
</script>

<style lang="scss" scoped>
.auth-card {
  width: 100%;
  max-width: 400px;
  padding: 20px;
}
</style>