<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">Quản Lý Hỗ Trợ Khách Hàng</h1>

    <!-- Stats Cards -->
    <ticket-stats :stats="ticketStats" />

    <!-- Ticket List -->
    <ticket-list ref="ticketListRef" @open-ticket="openTicket" />

    <!-- Ticket Detail Dialog -->
    <v-dialog
      v-model="ticketDialog.show"
      max-width="900px"
      scrollable
    >
      <ticket-detail
        v-if="activeTicket"
        :ticket="activeTicket"
        @close="ticketDialog.show = false"
        @updated="handleTicketUpdated"
      />
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useToast } from 'vue-toastification'
import TicketStats from '@/components/admin/support/TicketStats.vue'
import TicketList from '@/components/admin/support/TicketList.vue'
import TicketDetail from '@/components/admin/support/TicketDetail.vue'

const store = useStore()
const toast = useToast()
const ticketListRef = ref(null)

// Data
const ticketDialog = ref({
  show: false
})
const activeTicket = ref(null)
const loading = ref(false)

// Computed
const ticketStats = computed(() => store.state.support.ticketStats)

// Methods
const fetchTicketStats = async () => {
  try {
    await store.dispatch('support/fetchTicketStats')
  } catch (error) {
    console.error('Failed to fetch ticket stats:', error)
  }
}

const openTicket = async (ticket) => {
  try {
    loading.value = true

    // Fetch full ticket details
    const fullTicket = await store.dispatch('support/fetchTicketById', ticket.id)
    activeTicket.value = fullTicket

    ticketDialog.value.show = true
  } catch (error) {
    toast.error('Không thể tải thông tin yêu cầu hỗ trợ')
    console.error('Failed to open ticket:', error)
  } finally {
    loading.value = false
  }
}

const handleTicketUpdated = () => {
  // Refresh ticket list
  if (ticketListRef.value) {
    ticketListRef.value.fetchTickets()
  }

  // Refresh ticket stats
  fetchTicketStats()

  // Refresh active ticket details
  if (activeTicket.value) {
    store.dispatch('support/fetchTicketById', activeTicket.value.id)
      .then(updatedTicket => {
        activeTicket.value = updatedTicket
      })
      .catch(error => {
        console.error('Failed to refresh ticket details:', error)
      })
  }
}

// Lifecycle hooks
onMounted(async () => {
  await fetchTicketStats()
})
</script>


