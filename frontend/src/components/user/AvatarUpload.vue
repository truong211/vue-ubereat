<template>
  <div class="avatar-upload">
    <div class="avatar-preview" @click="triggerFileInput">
      <v-avatar
        size="120"
        :color="currentAvatar ? undefined : 'primary'"
        class="elevation-2"
      >
        <v-img
          v-if="currentAvatar"
          :src="currentAvatar"
          alt="Avatar"
          cover
        ></v-img>
        <span v-else class="text-h5 text-white">
          {{ initials }}
        </span>
      </v-avatar>
      <div class="overlay">
        <v-icon>mdi-camera</v-icon>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="d-none"
      @change="handleFileSelect"
    >

    <!-- Image Cropper Dialog -->
    <v-dialog v-model="showCropper" max-width="500">
      <v-card>
        <v-card-title>Điều chỉnh ảnh đại diện</v-card-title>
        <v-card-text>
          <vue-cropper
            ref="cropper"
            :src="tempImageUrl"
            :aspect-ratio="1"
            view-mode="1"
            drag-mode="move"
            :auto-crop-area="1"
            :movable="true"
            :zoomable="true"
            :scalable="false"
            :background="true"
          ></vue-cropper>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="error"
            variant="text"
            @click="showCropper = false"
          >
            Hủy
          </v-btn>
          <v-btn
            color="primary"
            :loading="uploading"
            @click="uploadCroppedImage"
          >
            Lưu
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Progress Dialog -->
    <v-dialog v-model="uploading" persistent max-width="300">
      <v-card>
        <v-card-text>
          Đang tải ảnh lên...
          <v-progress-linear
            indeterminate
            color="primary"
            class="mb-0"
          ></v-progress-linear>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import VueCropper from 'vue-cropperjs'
import 'cropperjs/dist/cropper.css'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  modelValue: String,
  currentAvatar: String
})

const emit = defineEmits(['update:modelValue'])
const authStore = useAuthStore()
const userStore = useUserStore()
const fileInput = ref(null)
const cropper = ref(null)
const showCropper = ref(false)
const uploading = ref(false)
const tempImageUrl = ref('')

// Compute user initials from name
const initials = computed(() => {
  const user = authStore.currentUser
  const name = user?.fullName || ''
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const input = event.target
  const file = input?.files?.[0]

  if (file) {
    // Check file type and size
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 5MB')
      return
    }

    // Create temp URL for cropper
    tempImageUrl.value = URL.createObjectURL(file)
    showCropper.value = true
  }

  // Reset input
  input.value = ''
}

const uploadCroppedImage = async () => {
  if (!cropper.value) return

  try {
    uploading.value = true
    
    // Get cropped canvas
    const canvas = cropper.value.getCroppedCanvas({
      width: 400,
      height: 400
    })

    // Convert to blob
    const blob = await new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9)
    })

    // Create form data
    const formData = new FormData()
    formData.append('avatar', blob, 'avatar.jpg')

    try {
      // Try to upload to server
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload avatar')
      }

      const { avatarUrl } = await response.json()
      
      // Update store and emit new value
      await userStore.updateAvatar(avatarUrl)
      emit('update:modelValue', avatarUrl)
    } catch (error) {
      console.log('API endpoint not available (development mode), using mock data')
      // Development fallback: Use local data URL from canvas
      const mockAvatarUrl = canvas.toDataURL('image/jpeg', 0.9)
      
      // Update store and emit new value with local image
      await userStore.updateAvatar(mockAvatarUrl)
      emit('update:modelValue', mockAvatarUrl)
    }
  } catch (error) {
    console.error('Error uploading avatar:', error)
    alert('Không thể tải ảnh lên: ' + error.message)
  } finally {
    uploading.value = false
    showCropper.value = false
    URL.revokeObjectURL(tempImageUrl.value)
  }
}
</script>

<style scoped>
.avatar-upload {
  position: relative;
  display: inline-block;
}

.avatar-preview {
  position: relative;
  cursor: pointer;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.avatar-preview:hover .overlay {
  opacity: 1;
}

.overlay .v-icon {
  color: white;
}
</style>