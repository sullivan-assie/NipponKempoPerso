<template>
  <q-page class="github-page flex flex-center">
    <q-card class="github-auth-card q-pa-lg">
      <q-card-section class="text-center">
        <q-avatar size="60px" class="q-mb-md">
          <img src="/kempoimh.png" alt="Logo" />
        </q-avatar>
        
        <div class="text-h5 q-mt-sm q-mb-md text-white">Mot de passe oublié</div>
        <p class="text-body2 text-grey-4 q-mb-lg">
          Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>
        
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="email"
            label="Email"
            type="email"
            outlined
            dark
            color="grey-4"
            label-color="grey-4"
            class="github-input"
            :rules="[val => !!val || 'Ce champ est obligatoire', val => isValidEmail(val) || 'Email invalide']"
            lazy-rules
          >
            <template v-slot:prepend>
              <q-icon name="email" color="grey-4" />
            </template>
          </q-input>

          <div class="q-mt-lg">
            <q-btn 
              label="Envoyer le lien de réinitialisation" 
              type="submit" 
              color="positive"
              unelevated
              class="full-width github-btn-primary"
              :loading="loading"
            />
          </div>

          <div class="text-center q-mt-md">
            <q-btn 
              flat 
              color="grey-4"
              label="Retour à la connexion" 
              to="/"
              class="q-mt-sm github-btn-flat"
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
// Page background
.github-page {
  background: #0d1117;
  color: #f0f6fc;
  min-height: 100vh;
}

// GitHub auth card
.github-auth-card {
  width: 100%;
  max-width: 400px;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

// GitHub-style inputs
.github-input {
  :deep(.q-field__control) {
    background: #0d1117 !important;
    border: 1px solid #30363d !important;
    border-radius: 6px !important;
    
    &:hover {
      border-color: #58a6ff !important;
    }
    
    &:focus-within {
      border-color: #58a6ff !important;
      box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.3) !important;
    }
  }
  
  :deep(.q-field__native) {
    color: #f0f6fc !important;
    font-size: 14px !important;
  }
  
  :deep(.q-field__label) {
    color: #8b949e !important;
    font-size: 14px !important;
  }
  
  :deep(.q-field__prepend) {
    .q-icon {
      color: #8b949e !important;
    }
  }
  
  // Error states
  :deep(.q-field--error) {
    .q-field__control {
      border-color: #f85149 !important;
    }
    
    .q-field__bottom {
      color: #f85149 !important;
    }
  }
}

// GitHub-style buttons
.github-btn-primary {
  background: #238636 !important;
  border: 1px solid #238636 !important;
  border-radius: 6px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  color: white !important;
  height: 48px !important;
  
  &:hover {
    background: #2ea043 !important;
    border-color: #2ea043 !important;
  }
  
  &:disabled {
    background: #21262d !important;
    border-color: #30363d !important;
    color: #8b949e !important;
  }
}

.github-btn-flat {
  color: #8b949e !important;
  font-size: 14px !important;
  border-radius: 6px !important;
  
  &:hover {
    color: #58a6ff !important;
    background: rgba(88, 166, 255, 0.1) !important;
  }
}

// Avatar styling
.q-avatar {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  
  img {
    border-radius: 50%;
  }
}

// Responsive
@media (max-width: 599px) {
  .github-auth-card {
    max-width: 90vw;
    margin: 16px;
  }
}

// Loading state
:deep(.q-btn--loading) {
  .q-btn__content {
    opacity: 0.6;
  }
}

// Form spacing
.q-form {
  .q-gutter-md > * {
    margin-bottom: 16px;
  }
}
</style>