<template>
  <div class="auth-examples">
    <h2 class="text-h5 mb-4">Authentication Examples</h2>

    <!-- Example 1: Basic Login -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Basic Login</h3>
      <v-card>
        <v-card-text>
          <auth-form
            mode="login"
            @auth-success="handleAuthSuccess"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ basicLoginExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 2: Registration with Verification -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Registration with Verification</h3>
      <v-card>
        <v-card-text>
          <v-row>
            <!-- Registration Form -->
            <v-col cols="12" md="8">
              <auth-form
                mode="register"
                @auth-success="handleAuthSuccess"
              />
            </v-col>

            <!-- Verification Preview -->
            <v-col cols="12" md="4">
              <v-card variant="outlined">
                <v-card-title>Verification Preview</v-card-title>
                <v-card-text>
                  <v-timeline density="compact">
                    <v-timeline-item
                      v-for="step in verificationSteps"
                      :key="step.id"
                      :dot-color="step.color"
                      :icon="step.icon"
                    >
                      <div class="text-subtitle-2">{{ step.title }}</div>
                      <div class="text-caption">{{ step.description }}</div>
                    </v-timeline-item>
                  </v-timeline>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ registrationExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 3: Social Authentication -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Social Authentication</h3>
      <v-card>
        <v-card-text>
          <v-row>
            <!-- Auth Form -->
            <v-col cols="12" md="6">
              <auth-form
                mode="login"
                @auth-success="handleAuthSuccess"
              />
            </v-col>

            <!-- Social Auth Info -->
            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title>Social Authentication Flow</v-card-title>
                <v-card-text>
                  <v-list>
                    <v-list-item
                      v-for="provider in socialProviders"
                      :key="provider.id"
                      :value="provider"
                    >
                      <template v-slot:prepend>
                        <v-icon :color="provider.color">
                          {{ provider.icon }}
                        </v-icon>
                      </template>

                      <v-list-item-title>{{ provider.name }}</v-list-item-title>
                      <v-list-item-subtitle>{{ provider.description }}</v-list-item-subtitle>

                      <template v-slot:append>
                        <v-chip
                          size="small"
                          :color="provider.color"
                        >
                          {{ provider.scope }}
                        </v-chip>
                      </template>
                    </v-list-item>
                  </v-list>

                  <v-alert
                    type="info"
                    variant="outlined"
                    class="mt-4"
                  >
                    Social login requires proper configuration of OAuth credentials in your application.
                  </v-alert>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ socialAuthExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Auth Success Dialog -->
    <v-dialog v-model="showSuccessDialog" max-width="400">
      <v-card>
        <v-card-text class="text-center pa-4">
          <v-icon
            color="success"
            size="64"
            class="mb-4"
          >
            mdi-check-circle
          </v-icon>
          <div class="text-h6">Authentication Successful!</div>
          <div class="text-body-1 mt-2">
            You have been successfully authenticated.
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="showSuccessDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue'
import AuthForm from '@/components/auth/AuthForm.vue'

export default {
  name: 'AuthFormExample',

  components: {
    AuthForm
  },

  setup() {
    // Dialog state
    const showSuccessDialog = ref(false)

    // Verification steps
    const verificationSteps = [
      {
        id: 1,
        title: 'Enter Credentials',
        description: 'Create your account with email and password',
        color: 'primary',
        icon: 'mdi-account'
      },
      {
        id: 2,
        title: 'Verify Identity',
        description: 'Verify your account via email or SMS',
        color: 'warning',
        icon: 'mdi-shield'
      },
      {
        id: 3,
        title: 'Complete Profile',
        description: 'Fill in your personal information',
        color: 'success',
        icon: 'mdi-check'
      }
    ]

    // Social providers
    const socialProviders = [
      {
        id: 'google',
        name: 'Google',
        description: 'Sign in with your Google account',
        icon: 'mdi-google',
        color: 'error',
        scope: 'email, profile'
      },
      {
        id: 'facebook',
        name: 'Facebook',
        description: 'Connect using Facebook',
        icon: 'mdi-facebook',
        color: 'primary',
        scope: 'email, public_profile'
      }
    ]

    // Event handlers
    const handleAuthSuccess = () => {
      showSuccessDialog.value = true
    }

    // Code examples
    const basicLoginExample = `<auth-form
  mode="login"
  @auth-success="handleAuthSuccess"
/>`

    const registrationExample = `<auth-form
  mode="register"
  @auth-success="handleAuthSuccess"
/>

<!-- Verification steps will be shown automatically -->`

    const socialAuthExample = `<!-- In your component -->
<auth-form
  mode="login"
  @auth-success="handleAuthSuccess"
/>

<!-- In your .env file -->
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_FACEBOOK_APP_ID=your-facebook-app-id`

    return {
      showSuccessDialog,
      verificationSteps,
      socialProviders,
      handleAuthSuccess,
      basicLoginExample,
      registrationExample,
      socialAuthExample
    }
  }
}
</script>

<style scoped>
.auth-examples {
  padding: 16px;
}

.code-example {
  font-family: monospace;
  white-space: pre-wrap;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow-x: auto;
}
</style>