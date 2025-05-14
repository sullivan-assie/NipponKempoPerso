<template>
  <q-page class="flex flex-center">
    <q-card class="auth-card">
      <q-card-section class="text-center">
        <div class="text-h5 q-mt-sm q-mb-md">Mot de passe oublié</div>
        
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="email"
            label="Email"
            type="email"
            :rules="[val => !!val || 'Ce champ est obligatoire', val => isValidEmail(val) || 'Email invalide']"
            lazy-rules
            outlined
          />

          <div class="q-mt-md">
            <q-btn 
              label="Envoyer le lien de réinitialisation" 
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

export default {
  name: 'ForgotPasswordPage',
  
  setup() {
    const email = ref('')
    const loading = ref(false)
    const $q = useQuasar()

    const isValidEmail = (val) => {
      const emailPattern = /^(?=[a-zA-Z0-9@._%+-]{6,254}$)[a-zA-Z0-9._%+-]{1,64}@(?:[a-zA-Z0-9-]{1,63}\.){1,8}[a-zA-Z]{2,63}$/
      return emailPattern.test(val)
    }

    const onSubmit = async () => {
      loading.value = true
      
      try {
        const response = await api.post('/auth/forgot-password', {
          email: email.value
        })
        
        $q.notify({
          type: 'positive',
          message: response.data.message || 'Un email a été envoyé avec les instructions pour réinitialiser votre mot de passe',
          position: 'top',
          timeout: 5000
        })
        
        // Réinitialiser le formulaire après soumission
        email.value = ''
      } catch (error) {
        const message = error.response?.data?.message || 'Une erreur est survenue lors de la demande de réinitialisation de mot de passe'
        
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
      email,
      loading,
      isValidEmail,
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