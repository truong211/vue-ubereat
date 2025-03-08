<template>
  <v-form @submit.prevent="handleSubmit" v-model="isValid">
    <v-container>
      <v-row>
        <v-col cols="12" class="text-center">
          <v-avatar size="150" class="mb-3">
            <v-img :src="avatarPreview || user.avatar || '/default-avatar.png'" alt="Profile" />
          </v-avatar>
          <v-file-input
            v-model="avatarFile"
            accept="image/*"
            label="Upload Avatar"
            prepend-icon="mdi-camera"
            @change="handleAvatarChange"
            hide-details
            class="mt-3"
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.firstName"
            label="First Name"
            :rules="[v => !!v || 'First name is required']"
            required
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.lastName"
            label="Last Name"
            :rules="[v => !!v || 'Last name is required']"
            required
          />
        </v-col>

        <v-col cols="12">
          <v-text-field
            v-model="form.email"
            label="Email"
            type="email"
            :rules="[v => !!v || 'Email is required', v => /.+@.+\..+/.test(v) || 'Email must be valid']"
            required
          />
        </v-col>

        <v-col cols="12">
          <v-text-field
            v-model="form.phone"
            label="Phone Number"
            :rules="[v => !!v || 'Phone number is required']"
            required
          />
        </v-col>

        <v-col cols="12" class="text-center">
          <v-btn
            color="primary"
            type="submit"
            :loading="loading"
            :disabled="!isValid"
          >
            Save Changes
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const isValid = ref(false)
const loading = ref(false)
const avatarFile = ref(null)
const avatarPreview = ref(null)

const user = computed(() => store.state.user.profile)

const form = reactive({
  firstName: user.value?.firstName || '',
  lastName: user.value?.lastName || '',
  email: user.value?.email || '',
  phone: user.value?.phone || ''
})

const handleAvatarChange = (file) => {
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  } else {
    avatarPreview.value = null
  }
}

const handleSubmit = async () => {
  try {
    loading.value = true
    const formData = new FormData()
    formData.append('firstName', form.firstName)
    formData.append('lastName', form.lastName)
    formData.append('email', form.email)
    formData.append('phone', form.phone)
    
    if (avatarFile.value) {
      formData.append('avatar', avatarFile.value)
    }

    await store.dispatch('user/updateProfile', formData)
  } catch (error) {
    console.error('Error updating profile:', error)
  } finally {
    loading.value = false
  }
}
</script>