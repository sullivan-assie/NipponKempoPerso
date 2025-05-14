<template>
  <q-page class="flex flex-center bg-grey-2">
    <div class="column items-center">
      <div class="col-12 col-sm-6 col-md-4">
        <q-card flat bordered class="login-card q-pa-md">
          <q-card-section class="text-center q-pb-none">
            <div class="text-h5 q-mb-md">{{ isRegister ? 'Inscription' : 'Connexion' }}</div>
            <!-- <img src="~assets/kempoimh.png" style="width: 150px; height: auto;" /> -->
          </q-card-section>

          <q-card-section>
            <q-form @submit="onSubmit" class="q-gutter-md">
              <template v-if="isRegister">
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-sm-6">
                    <q-input
                      filled
                      v-model="form.firstName"
                      label="Prénom"
                      lazy-rules
                      :rules="[val => val && val.length > 0 || 'Le prénom est requis']"
                    />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input
                      filled
                      v-model="form.lastName"
                      label="Nom"
                      lazy-rules
                      :rules="[val => val && val.length > 0 || 'Le nom est requis']"
                    />
                  </div>
                </div>
              </template>

              <q-input
                filled
                v-model="form.email"
                label="Email"
                type="email"
                lazy-rules
                :rules="[
                  val => val && val.length > 0 || 'L\'email est requis',
                  val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Format d\'email invalide'
                ]"
              />

              <q-input
                filled
                v-model="form.password"
                label="Mot de passe"
                :type="isPwd ? 'password' : 'text'"
                lazy-rules
                :rules="[
                  val => val && val.length > 5 || 'Le mot de passe doit contenir au moins 6 caractères'
                ]"
              >
                <template v-slot:append>
                  <q-icon
                    :name="isPwd ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="isPwd = !isPwd"
                  />
                </template>
              </q-input>

              <!-- Lien de récupération de mot de passe -->
              <div v-if="!isRegister" class="text-right">
                <q-btn flat dense no-caps color="blue-7" label="Mot de passe oublié ?" to="/forgot-password" />
              </div>

              <template v-if="isRegister">
                <q-input
                  filled
                  v-model="form.passwordConfirm"
                  label="Confirmer le mot de passe"
                  :type="isPwd ? 'password' : 'text'"
                  lazy-rules
                  :rules="[
                    val => val && val === form.password || 'Les mots de passe ne correspondent pas'
                  ]"
                >
                  <template v-slot:append>
                    <q-icon
                      :name="isPwd ? 'visibility_off' : 'visibility'"
                      class="cursor-pointer"
                      @click="isPwd = !isPwd"
                    />
                  </template>
                </q-input>

                <q-checkbox
                  v-model="form.RGPDConsent"
                  label="J'accepte les conditions d'utilisation et la politique de confidentialité"
                  :rules="[val => val || 'Vous devez accepter les conditions d\'utilisation']"
                />
              </template>

              <div class="text-center q-mt-md">
                <q-btn
                  :label="isRegister ? 'S\'inscrire' : 'Se connecter'"
                  type="submit"
                  color="primary"
                  :loading="loading"
                  rounded
                  class="full-width"
                />
              </div>
            </q-form>
          </q-card-section>

          <q-card-actions align="center" class="q-pa-none">
            <q-btn
              flat
              :label="isRegister ? 'Vous avez déjà un compte ? Connexion' : 'Pas de compte ? Inscription'"
              @click="toggleRegister"
              class="full-width q-mt-sm"
              color="secondary"
            />
          </q-card-actions>
        </q-card>

        <div class="text-center q-pa-md">
          <q-btn
            flat
            label="Retourner à l'accueil"
            color="grey-7"
            icon="home"
            to="/"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const router = useRouter();
const isPwd = ref(true);
const isRegister = ref(false);
const loading = ref(false);
const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  passwordConfirm: '',
  RGPDConsent: false
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
    RGPDConsent: false
  };
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
        RGPDConsent: form.value.RGPDConsent
      }
    : { 
        email: form.value.email,
        password: form.value.password
      };

  console.log('=== LoginPage: Début de soumission du formulaire ===');
  console.log('Endpoint:', endpoint);
  try {
    console.log('Envoi de la requête avec les données (mot de passe masqué):', 
      { ...payload, password: '******' });
    const response = await api.post(endpoint, payload);
    console.log('Réponse du serveur:', response.data);
    console.log('Rôle utilisateur:', response.data.user.role);
    
    // Stocker le token et les informations utilisateur
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    console.log('Token et données utilisateur stockés dans localStorage');

    $q.notify({
      color: 'positive',
      message: isRegister.value ? 'Inscription réussie !' : 'Connexion réussie !',
      icon: 'check_circle'
    });

    // Redirection différente selon le rôle
    const targetRoute = response.data.user.role === 'admin' ? '/main-menu' : '/tournaments';
    console.log(`Rôle détecté: ${response.data.user.role}, tentative de redirection vers: ${targetRoute}`);
    
    // Utiliser un délai court et gérer les erreurs éventuelles
    setTimeout(() => {
      console.log(`Exécution de la redirection vers ${targetRoute} après délai`);
      router.push(targetRoute).catch(err => {
        console.error('Erreur lors de la redirection avec router.push:', err);
        // Solution alternative plus directe
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
    console.log('=== LoginPage: Fin de traitement du formulaire ===');
  }
};
</script>

<style lang="scss" scoped>
.login-card {
  width: 100%;
  max-width: 450px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

@media (max-width: 599px) {
  .login-card {
    max-width: 90vw;
  }
}
</style>