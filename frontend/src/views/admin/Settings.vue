<template>
  <div class="settings-container">
    <div class="card">
      <div class="card-header">
        <h4>Admin Settings</h4>
      </div>
      <div class="card-body">
        <form @submit.prevent="saveSettings">
          <div class="form-group mb-3">
            <label for="siteName">Site Name</label>
            <input
              type="text"
              class="form-control"
              id="siteName"
              v-model="settings.siteName"
              placeholder="Enter site name"
            >
          </div>
          <div class="form-group mb-3">
            <label for="contactEmail">Contact Email</label>
            <input
              type="email"
              class="form-control"
              id="contactEmail"
              v-model="settings.contactEmail"
              placeholder="Enter contact email"
            >
          </div>
          <div class="form-group mb-3">
            <label for="deliveryRadius">Delivery Radius (km)</label>
            <input
              type="number"
              class="form-control"
              id="deliveryRadius"
              v-model="settings.deliveryRadius"
              placeholder="Enter delivery radius"
            >
          </div>
          <div class="form-group mb-3">
            <label for="currency">Currency</label>
            <select class="form-control" id="currency" v-model="settings.currency">
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary">Save Settings</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useToast } from 'vue-toastification'

const toast = useToast()

const settings = ref({
  siteName: 'UberEat Clone',
  contactEmail: 'admin@example.com',
  deliveryRadius: 10,
  currency: 'USD'
})

const saveSettings = () => {
  // Here you would typically make an API call to save the settings
  toast.success('Settings saved successfully')
}
</script>

<style scoped>
.settings-container {
  padding: 20px;
}

.card {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.card-header {
  background-color: #f8f9fa;
}

.form-group label {
  font-weight: 500;
  margin-bottom: 0.5rem;
}
</style>