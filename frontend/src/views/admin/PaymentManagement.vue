<template>
  <div class="payment-management">
    <h1 class="text-2xl font-bold mb-6">Payment Management</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <!-- Payment Overview Card -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-4">Payment Overview</h2>
        <div class="grid grid-cols-2 gap-4">
          <div class="stat-card">
            <p class="text-gray-600">Total Transactions</p>
            <p class="text-2xl font-bold">{{ totalTransactions }}</p>
          </div>
          <div class="stat-card">
            <p class="text-gray-600">Total Revenue</p>
            <p class="text-2xl font-bold">${{ totalRevenue.toFixed(2) }}</p>
          </div>
        </div>
      </div>

      <!-- Payment Settings Card -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-4">Payment Settings</h2>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span>Payment Gateway</span>
            <span class="text-green-600">Connected</span>
          </div>
          <div class="flex items-center justify-between">
            <span>Auto Payout</span>
            <label class="switch">
              <input type="checkbox" v-model="autoPayoutEnabled">
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Transactions -->
    <div class="bg-white p-6 rounded-lg shadow">
      <h2 class="text-lg font-semibold mb-4">Recent Transactions</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr class="bg-gray-50">
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="transaction in recentTransactions" :key="transaction.id">
              <td class="px-6 py-4 whitespace-nowrap">{{ transaction.id }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ transaction.date }}</td>
              <td class="px-6 py-4 whitespace-nowrap">${{ transaction.amount.toFixed(2) }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getStatusClass(transaction.status)">
                  {{ transaction.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <button @click="viewTransaction(transaction.id)" class="text-blue-600 hover:text-blue-800">
                  View Details
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PaymentManagement',
  data() {
    return {
      totalTransactions: 0,
      totalRevenue: 0,
      autoPayoutEnabled: false,
      recentTransactions: []
    }
  },
  methods: {
    async fetchPaymentData() {
      try {
        // Fetch payment data from API
        const response = await fetch('/api/admin/payments/overview')
        const data = await response.json()
        
        this.totalTransactions = data.totalTransactions
        this.totalRevenue = data.totalRevenue
        this.recentTransactions = data.recentTransactions
      } catch (error) {
        console.error('Error fetching payment data:', error)
      }
    },
    getStatusClass(status) {
      const classes = {
        completed: 'text-green-600 bg-green-100',
        pending: 'text-yellow-600 bg-yellow-100',
        failed: 'text-red-600 bg-red-100'
      }
      return `px-2 py-1 rounded-full text-sm ${classes[status.toLowerCase()]}`
    },
    viewTransaction(id) {
      // Navigate to transaction details
      this.$router.push(`/admin/payments/transactions/${id}`)
    }
  },
  created() {
    this.fetchPaymentData()
  }
}
</script>

<style scoped>
.payment-management {
  padding: 1.5rem;
}

.stat-card {
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 0.5rem;
}

.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:checked + .slider:before {
  transform: translateX(26px);
}
</style> 