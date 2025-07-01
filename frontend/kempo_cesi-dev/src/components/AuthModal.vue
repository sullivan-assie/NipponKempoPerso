<template>
  <q-dialog :model-value="isOpen" @update:model-value="closeModal" persistent>
    <q-card flat class="github-auth-card q-pa-lg">
      <q-card-section class="text-center q-pb-none">
        <div class="text-h5 q-mb-md text-white">{{ isRegister ? 'Inscription' : 'Connexion' }}</div>
        <q-avatar size="60px" class="q-mb-md">
          <img src="/kempoimh.png" alt="Logo" />
        </q-avatar>
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <template v-if="isRegister">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input
                  outlined
                  v-model="form.firstName"
                  label="Prénom"
                  dark
                  color="grey-4"
                  label-color="grey-4"
                  class="github-input"
                  lazy-rules
                  :rules="[val => val && val.length > 0 || 'Le prénom est requis']"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  outlined
                  v-model="form.lastName"
                  label="Nom"
                  dark
                  color="grey-4"
                  label-color="grey-4"
                  class="github-input"
                  lazy-rules
                  :rules="[val => val && val.length > 0 || 'Le nom est requis']"
                />
              </div>
            </div>
            
            <!-- Ajout du champ pour le numéro de combattant -->
            <q-input
              outlined
              v-model="form.fighterNumber"
              label="Numéro de combattant"
              hint="Exemple: NC12345"
              dark
              color="grey-4"
              label-color="grey-4"
              class="github-input"
              lazy-rules
              :rules="[
                val => val && val.length > 0 || 'Le numéro de combattant est requis',
                val => /^[A-Za-z0-9-]+$/.test(val) || 'Format de numéro invalide'
              ]"
            />
            
            <!-- Ajout du champ pour le nom du club -->
            <q-input
              outlined
              v-model="form.clubName"
              label="Nom du club"
              hint="Indiquez le nom de votre club (optionnel)"
              dark
              color="grey-4"
              label-color="grey-4"
              class="github-input"
            />
          </template>

          <q-input
            outlined
            v-model="form.email"
            label="Email"
            type="email"
            dark
            color="grey-4"
            label-color="grey-4"
            class="github-input"
            lazy-rules
            :rules="[
              val => val && val.length > 0 || 'L\'email est requis',
              val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Format d\'email invalide'
            ]"
          />

          <q-input
            outlined
            v-model="form.password"
            label="Mot de passe"
            :type="isPwd ? 'password' : 'text'"
            dark
            color="grey-4"
            label-color="grey-4"
            class="github-input"
            lazy-rules
            :rules="[
              val => val && val.length > 5 || 'Le mot de passe doit contenir au moins 6 caractères'
            ]"
          >
            <template v-slot:append>
              <q-icon
                :name="isPwd ? 'visibility_off' : 'visibility'"
                color="grey-4"
                class="cursor-pointer"
                @click="isPwd = !isPwd"
              />
            </template>
          </q-input>

          <!-- Lien de récupération de mot de passe -->
          <div v-if="!isRegister" class="text-right q-mb-sm">
            <q-btn 
              flat 
              dense 
              no-caps 
              color="primary" 
              label="Mot de passe oublié ?"
              class="github-link-btn"
              @click="goToForgotPassword"
            />
          </div>

          <template v-if="isRegister">
            <q-input
              outlined
              v-model="form.passwordConfirm"
              label="Confirmer le mot de passe"
              :type="isPwd ? 'password' : 'text'"
              dark
              color="grey-4"
              label-color="grey-4"
              class="github-input"
              lazy-rules
              :rules="[
                val => val && val === form.password || 'Les mots de passe ne correspondent pas'
              ]"
            >
              <template v-slot:append>
                <q-icon
                  :name="isPwd ? 'visibility_off' : 'visibility'"
                  color="grey-4"
                  class="cursor-pointer"
                  @click="isPwd = !isPwd"
                />
              </template>
            </q-input>

            <q-checkbox
              v-model="form.RGPDConsent"
              label="J'accepte les conditions d'utilisation et la politique de confidentialité"
              color="primary"
              class="github-checkbox text-grey-4"
              :rules="[val => val || 'Vous devez accepter les conditions d\'utilisation']"
            />
          </template>

          <div class="text-center q-mt-lg">
            <q-btn
              :label="isRegister ? 'S\'inscrire' : 'Se connecter'"
              type="submit"
              color="positive"
              :loading="loading"
              unelevated
              class="full-width github-btn-primary"
            />
          </div>
        </q-form>
      </q-card-section>

      <q-card-actions align="center" class="q-pa-none">
        <q-btn
          flat
          :label="isRegister ? 'Vous avez déjà un compte ? Connexion' : 'Pas de compte ? Inscription'"
          @click="toggleRegister"
          class="full-width q-mt-sm github-toggle-btn"
          color="grey-4"
        />
      </q-card-actions>
      
      <q-card-actions align="center" class="q-pt-md">
        <q-btn 
          flat 
          label="Fermer" 
          @click="closeModal" 
          color="grey-4"
          class="github-btn-flat"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { useRouter } from 'vue-router';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  initialMode: {
    type: String,
    default: 'login' // 'login' ou 'register'
  }
});

const emit = defineEmits(['update:isOpen', 'auth-success']);

const $q = useQuasar();
const router = useRouter();
const isPwd = ref(true);
const isRegister = ref(props.initialMode === 'register');
const loading = ref(false);
const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  passwordConfirm: '',
  fighterNumber: '', // Ajout du numéro de combattant
  clubName: '', // Ajout du nom du club
  RGPDConsent: false
});

// Surveiller les changements de mode depuis le parent
watch(() => props.initialMode, (newMode) => {
  isRegister.value = newMode === 'register';
});

const toggleRegister = () => {
  isRegister.value = !isRegister.value;
  // Reset form
  form.value = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    passwordConfirm: '',
    fighterNumber: '', // Réinitialisation du numéro de combattant
    clubName: '', // Réinitialisation du nom du club
    RGPDConsent: false
  };
};

const closeModal = () => {
  emit('update:isOpen', false);
};

// Fonction pour rediriger vers la page de récupération de mot de passe
const goToForgotPassword = () => {
  closeModal(); // Fermer le modal d'abord
  router.push('/forgot-password');
};

const onSubmit = async () => {
  loading.value = true;
  const endpoint = isRegister.value ? '/auth/register' : '/auth/login';
  const payload = isRegister.value 
    ? { 
        firstName: form.value.firstName,
        lastName: form.value.lastName,
        email: form.value.email,
        password: form.value.password,
        fighterNumber: form.value.fighterNumber, // Ajout du numéro de combattant
        clubName: form.value.clubName, // Ajout du nom du club
        RGPDConsent: form.value.RGPDConsent
      }
    : { 
        email: form.value.email,
        password: form.value.password
      };

  console.log('Début de soumission du formulaire', endpoint);
  try {
    console.log('Envoi de la requête à', endpoint, 'avec les données (mot de passe masqué):', 
      { ...payload, password: '******' });
    const response = await api.post(endpoint, payload);
    console.log('Réponse reçue du serveur:', response.data);
    console.log('Rôle de l\'utilisateur:', response.data.user.role);
    
    // Stocker le token et les informations utilisateur
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    console.log('Informations utilisateur et token stockés dans localStorage');

    $q.notify({
      color: 'positive',
      message: isRegister.value ? 'Inscription réussie !' : 'Connexion réussie !',
      icon: 'check_circle'
    });

    // Fermer le modal et émettre l'événement de succès
    emit('update:isOpen', false);
    emit('auth-success', response.data.user);
    console.log('Modal fermé et événement auth-success émis');
    
    // Redirection différente selon le rôle
    const targetRoute = response.data.user.role === 'admin' ? '/main-menu' : '/tournaments';
    console.log(`Tentative de redirection vers: ${targetRoute} pour le rôle: ${response.data.user.role}`);
    
    // Utiliser un délai court pour s'assurer que l'état est correctement mis à jour
    setTimeout(() => {
      console.log('Exécution de la redirection après délai');
      router.push(targetRoute).catch(err => {
        console.error('Erreur lors de la redirection:', err);
        // Solution alternative avec window.location
        console.log('Tentative de redirection avec window.location');
        window.location.href = `${window.location.origin}/#${targetRoute}`;
      });
    }, 100);
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    
    let errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
    
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
      console.error('Message d\'erreur du serveur:', errorMessage);
    }
    
    $q.notify({
      color: 'negative',
      message: errorMessage,
      icon: 'error'
    });
  } finally {
    loading.value = false;
    console.log('Fin de traitement du formulaire');
  }
};
</script>

<style lang="scss" scoped>
// GitHub auth card
.github-auth-card {
  width: 100%;
  max-width: 450px;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

// GitHub-style inputs (from previous artifacts)
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
  
  :deep(.q-field__bottom) {
    color: #8b949e !important;
    font-size: 12px !important;
  }
  
  :deep(.q-field__append) {
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

// GitHub-style checkbox
.github-checkbox {
  :deep(.q-checkbox__bg) {
    border: 2px solid #30363d !important;
    background: transparent !important;
    border-radius: 3px !important;
  }
  
  :deep(.q-checkbox__bg:hover) {
    border-color: #58a6ff !important;
  }
  
  :deep(.q-checkbox__bg .q-checkbox__svg) {
    color: #f0f6fc !important;
  }
  
  :deep(.q-checkbox__inner--active .q-checkbox__bg) {
    background: #1976d2 !important;
    border-color: #1976d2 !important;
  }
  
  :deep(.q-checkbox__inner--truthy .q-checkbox__bg) {
    background: #1976d2 !important;
    border-color: #1976d2 !important;
  }
  
  :deep(.q-checkbox__label) {
    color: #8b949e !important;
    font-size: 14px !important;
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
    color: #f0f6fc !important;
    background: rgba(177, 186, 196, 0.12) !important;
  }
}

.github-toggle-btn {
  color: #8b949e !important;
  font-size: 14px !important;
  border-radius: 6px !important;
  
  &:hover {
    color: #58a6ff !important;
    background: rgba(88, 166, 255, 0.1) !important;
  }
}

.github-link-btn {
  color: #58a6ff !important;
  font-size: 14px !important;
  
  &:hover {
    color: #79c0ff !important;
    text-decoration: underline;
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