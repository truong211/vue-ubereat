<template>
  <div class="restaurant-verification">
    <v-card>
      <v-tabs v-model="activeTab">
        <v-tab value="documents">Documents</v-tab>
        <v-tab value="verification">Verification Process</v-tab>
        <v-tab value="menu">Menu Review</v-tab>
      </v-tabs>

      <v-card-text>
        <v-window v-model="activeTab">
          <!-- Documents Tab -->
          <v-window-item value="documents">
            <v-list>
              <v-list-item v-for="doc in requiredDocuments" :key="doc.id">
                <template v-slot:prepend>
                  <v-icon :color="doc.status === 'verified' ? 'success' : 'warning'">
                    {{ doc.status === 'verified' ? 'mdi-check-circle' : 'mdi-clock-outline' }}
                  </v-icon>
                </template>

                <v-list-item-title>{{ doc.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ doc.description }}</v-list-item-subtitle>

                <template v-slot:append>
                  <v-btn
                    v-if="doc.file"
                    variant="text"
                    color="primary"
                    @click="viewDocument(doc)"
                  >
                    View
                  </v-btn>
                  <v-btn
                    v-else
                    variant="outlined"
                    color="primary"
                    @click="requestDocument(doc)"
                  >
                    Request
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-window-item>

          <!-- Verification Process Tab -->
          <v-window-item value="verification">
            <v-stepper v-model="verificationStep">
              <v-stepper-header>
                <v-stepper-item value="1">Document Review</v-stepper-item>
                <v-divider></v-divider>
                <v-stepper-item value="2">Background Check</v-stepper-item>
                <v-divider></v-divider>
                <v-stepper-item value="3">Site Inspection</v-stepper-item>
                <v-divider></v-divider>
                <v-stepper-item value="4">Final Approval</v-stepper-item>
              </v-stepper-header>

              <v-stepper-window>
                <!-- Document Review Step -->
                <v-stepper-window-item value="1">
                  <v-card-text>
                    <div class="text-h6 mb-4">Document Review</div>
                    <v-checkbox
                      v-for="check in documentChecks"
                      :key="check.id"
                      v-model="check.completed"
                      :label="check.label"
                    ></v-checkbox>
                  </v-card-text>
                </v-stepper-window-item>

                <!-- Background Check Step -->
                <v-stepper-window-item value="2">
                  <v-card-text>
                    <div class="text-h6 mb-4">Background Check</div>
                    <v-text-field
                      v-model="backgroundCheck.reference"
                      label="Background Check Reference"
                      variant="outlined"
                    ></v-text-field>
                    <v-textarea
                      v-model="backgroundCheck.notes"
                      label="Notes"
                      variant="outlined"
                      rows="3"
                    ></v-textarea>
                  </v-card-text>
                </v-stepper-window-item>

                <!-- Site Inspection Step -->
                <v-stepper-window-item value="3">
                  <v-card-text>
                    <div class="text-h6 mb-4">Site Inspection</div>
                    <v-text-field
                      v-model="inspection.inspector"
                      label="Inspector Name"
                      variant="outlined"
                    ></v-text-field>
                    <v-text-field
                      v-model="inspection.date"
                      label="Inspection Date"
                      type="date"
                      variant="outlined"
                    ></v-text-field>
                    <v-textarea
                      v-model="inspection.findings"
                      label="Inspection Findings"
                      variant="outlined"
                      rows="3"
                    ></v-textarea>
                  </v-card-text>
                </v-stepper-window-item>

                <!-- Final Approval Step -->
                <v-stepper-window-item value="4">
                  <v-card-text>
                    <div class="text-h6 mb-4">Final Approval</div>
                    <v-alert
                      v-if="!isReadyForApproval"
                      type="warning"
                      text="Please complete all previous steps before final approval."
                    ></v-alert>
                    <template v-else>
                      <p class="mb-4">All verification steps have been completed. You can now approve the restaurant.</p>
                      <v-textarea
                        v-model="finalApprovalNotes"
                        label="Final Approval Notes"
                        variant="outlined"
                        rows="3"
                      ></v-textarea>
                    </template>
                  </v-card-text>
                </v-stepper-window-item>
              </v-stepper-window>
            </v-stepper>

            <v-card-actions class="mt-4">
              <v-spacer></v-spacer>
              <v-btn
                v-if="verificationStep !== '1'"
                variant="text"
                @click="previousStep"
              >
                Previous
              </v-btn>
              <v-btn
                v-if="verificationStep !== '4'"
                color="primary"
                @click="nextStep"
              >
                Next
              </v-btn>
              <v-btn
                v-else
                color="success"
                :disabled="!isReadyForApproval"
                @click="approveRestaurant"
              >
                Approve Restaurant
              </v-btn>
            </v-card-actions>
          </v-window-item>

          <!-- Menu Review Tab -->
          <v-window-item value="menu">
            <restaurant-menu-verification
              v-if="activeTab === 'menu'"
              :restaurant-id="restaurantId"
            />
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>

    <!-- Document Viewer Dialog -->
    <v-dialog v-model="documentDialog.show" max-width="800">
      <v-card>
        <v-card-title>
          {{ documentDialog.document?.name }}
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="documentDialog.show = false"></v-btn>
        </v-card-title>
        <v-card-text>
          <v-img
            v-if="documentDialog.document?.type === 'image'"
            :src="documentDialog.document.url"
            max-height="600"
            contain
          ></v-img>
          <iframe
            v-else
            :src="documentDialog.document?.url"
            width="100%"
            height="600"
            frameborder="0"
          ></iframe>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useToast } from 'vue-toastification'
import RestaurantMenuVerification from './RestaurantMenuVerification.vue'

export default {
  name: 'RestaurantVerification',

  components: {
    RestaurantMenuVerification
  },

  props: {
    restaurantId: {
      type: [String, Number],
      required: true
    }
  },

  setup(props) {
    const store = useStore()
    const toast = useToast()

    // State
    const activeTab = ref('documents')
    const verificationStep = ref('1')
    const finalApprovalNotes = ref('')

    // Document verification data
    const requiredDocuments = ref([
      {
        id: 1,
        name: 'Business License',
        description: 'Valid business operating license',
        status: 'verified',
        type: 'pdf',
        file: 'license.pdf'
      },
      {
        id: 2,
        name: 'Food Safety Certificate',
        description: 'Current food safety certification',
        status: 'pending',
        type: 'pdf',
        file: null
      },
      {
        id: 3,
        name: 'Interior Photos',
        description: 'Photos of restaurant interior',
        status: 'verified',
        type: 'image',
        file: 'interior.jpg'
      },
      {
        id: 4,
        name: 'Menu Photos',
        description: 'Photos of physical menu',
        status: 'verified',
        type: 'image',
        file: 'menu.jpg'
      }
    ])

    // Verification process data
    const documentChecks = ref([
      { id: 1, label: 'Business license verified', completed: false },
      { id: 2, label: 'Food safety certification checked', completed: false },
      { id: 3, label: 'Photos reviewed', completed: false },
      { id: 4, label: 'Menu reviewed', completed: false }
    ])

    const backgroundCheck = ref({
      reference: '',
      notes: ''
    })

    const inspection = ref({
      inspector: '',
      date: '',
      findings: ''
    })

    // Document viewer dialog
    const documentDialog = ref({
      show: false,
      document: null
    })

    // Computed
    const isReadyForApproval = computed(() => {
      return documentChecks.value.every(check => check.completed) &&
        backgroundCheck.value.reference &&
        inspection.value.findings
    })

    // Methods
    const loadVerificationData = async () => {
      try {
        const data = await store.dispatch('admin/getRestaurantVerificationData', props.restaurantId)
        // Update local state with fetched data
      } catch (error) {
        toast.error('Failed to load verification data')
      }
    }

    const viewDocument = (document) => {
      documentDialog.value = {
        show: true,
        document
      }
    }

    const requestDocument = async (document) => {
      try {
        await store.dispatch('admin/requestDocument', {
          restaurantId: props.restaurantId,
          documentId: document.id
        })
        toast.success('Document request sent')
      } catch (error) {
        toast.error('Failed to send document request')
      }
    }

    const previousStep = () => {
      const currentStep = parseInt(verificationStep.value)
      if (currentStep > 1) {
        verificationStep.value = (currentStep - 1).toString()
      }
    }

    const nextStep = () => {
      const currentStep = parseInt(verificationStep.value)
      if (currentStep < 4) {
        verificationStep.value = (currentStep + 1).toString()
      }
    }

    const approveRestaurant = async () => {
      try {
        await store.dispatch('admin/approveRestaurant', {
          restaurantId: props.restaurantId,
          verificationData: {
            documentChecks: documentChecks.value,
            backgroundCheck: backgroundCheck.value,
            inspection: inspection.value,
            finalNotes: finalApprovalNotes.value
          }
        })
        toast.success('Restaurant approved successfully')
      } catch (error) {
        toast.error('Failed to approve restaurant')
      }
    }

    // Initialize
    onMounted(() => {
      loadVerificationData()
    })

    return {
      activeTab,
      verificationStep,
      requiredDocuments,
      documentChecks,
      backgroundCheck,
      inspection,
      documentDialog,
      finalApprovalNotes,
      isReadyForApproval,
      viewDocument,
      requestDocument,
      previousStep,
      nextStep,
      approveRestaurant
    }
  }
}
</script>

<style scoped>
.restaurant-verification {
  padding: 16px;
}
</style>