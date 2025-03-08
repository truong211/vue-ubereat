<template>
  <div>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4">Restaurant Verification</h1>
    </div>

    <v-tabs v-model="activeTab" class="mb-6">
      <v-tab value="documents">Required Documents</v-tab>
      <v-tab value="verification">Verification Process</v-tab>
      <v-tab value="analytics">Performance Analytics</v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <!-- Documents Tab -->
      <v-window-item value="documents">
        <v-card>
          <v-card-text>
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
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- Verification Process Tab -->
      <v-window-item value="verification">
        <v-card>
          <v-card-text>
            <v-stepper v-model="verificationStep">
              <v-stepper-header>
                <v-stepper-item value="1">
                  Document Review
                </v-stepper-item>

                <v-divider></v-divider>

                <v-stepper-item value="2">
                  Background Check
                </v-stepper-item>

                <v-divider></v-divider>

                <v-stepper-item value="3">
                  Site Inspection
                </v-stepper-item>

                <v-divider></v-divider>

                <v-stepper-item value="4">
                  Final Approval
                </v-stepper-item>
              </v-stepper-header>

              <v-stepper-window>
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

                <v-stepper-window-item value="4">
                  <v-card-text>
                    <div class="text-h6 mb-4">Final Approval</div>
                    <v-alert
                      v-if="!isReadyForApproval"
                      type="warning"
                      text="Please complete all previous steps before final approval."
                    ></v-alert>
                    <v-btn
                      v-else
                      color="success"
                      block
                      @click="approveRestaurant"
                    >
                      Approve Restaurant
                    </v-btn>
                  </v-card-text>
                </v-stepper-window-item>
              </v-stepper-window>
            </v-stepper>
          </v-card-text>
        </v-card>
      </v-window-item>

      <!-- Analytics Tab -->
      <v-window-item value="analytics">
        <v-row>
          <v-col cols="12" md="6">
            <v-card>
              <v-card-title>Order Completion Rate</v-card-title>
              <v-card-text>
                <div class="text-h4 text-center mb-4">{{ completionRate }}%</div>
                <v-progress-linear
                  :model-value="completionRate"
                  color="success"
                  height="20"
                ></v-progress-linear>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card>
              <v-card-title>Customer Ratings</v-card-title>
              <v-card-text>
                <div class="d-flex align-center justify-center mb-4">
                  <v-rating
                    :model-value="averageRating"
                    color="amber"
                    half-increments
                    readonly
                  ></v-rating>
                  <span class="text-h5 ml-2">{{ averageRating }}/5</span>
                </div>
                <v-list density="compact">
                  <v-list-item v-for="(count, stars) in ratingDistribution" :key="stars">
                    <template v-slot:prepend>
                      {{ stars }} stars
                    </template>
                    <v-progress-linear
                      :model-value="(count / totalReviews) * 100"
                      color="amber"
                      height="8"
                    ></v-progress-linear>
                    <template v-slot:append>
                      {{ count }}
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12">
            <v-card>
              <v-card-title>Revenue Trends</v-card-title>
              <v-card-text>
                <v-chart class="chart" :option="revenueChartOption"></v-chart>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>
    </v-window>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { VChart } from 'vue-echarts'

export default {
  name: 'RestaurantVerification',

  components: {
    VChart
  },

  setup() {
    const store = useStore()
    const activeTab = ref('documents')
    const verificationStep = ref('1')

    // Document verification data
    const requiredDocuments = ref([
      {
        id: 1,
        name: 'Business License',
        description: 'Valid business operating license',
        status: 'verified',
        file: 'license.pdf'
      },
      {
        id: 2,
        name: 'Food Safety Certificate',
        description: 'Current food safety certification',
        status: 'pending',
        file: null
      },
      {
        id: 3,
        name: 'Health Inspection Report',
        description: 'Latest health inspection report',
        status: 'verified',
        file: 'inspection.pdf'
      }
    ])

    // Verification process data
    const documentChecks = ref([
      { id: 1, label: 'Business license verified', completed: false },
      { id: 2, label: 'Food safety certification checked', completed: false },
      { id: 3, label: 'Health inspection report reviewed', completed: false }
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

    // Analytics data
    const completionRate = ref(95)
    const averageRating = ref(4.5)
    const totalReviews = ref(1250)
    const ratingDistribution = ref({
      5: 750,
      4: 300,
      3: 150,
      2: 40,
      1: 10
    })

    // Revenue chart configuration
    const revenueChartOption = {
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        data: [820, 932, 901, 934, 1290, 1330, 1320],
        type: 'line',
        smooth: true
      }]
    }

    // Computed properties
    const isReadyForApproval = computed(() => {
      return documentChecks.value.every(check => check.completed) &&
        backgroundCheck.value.reference &&
        inspection.value.findings
    })

    // Methods
    const viewDocument = (doc) => {
      // Implement document viewer logic
      console.log('Viewing document:', doc)
    }

    const requestDocument = (doc) => {
      // Implement document request logic
      console.log('Requesting document:', doc)
    }

    const approveRestaurant = async () => {
      try {
        // Implement approval logic
        await store.dispatch('admin/approveRestaurant', {
          // Add approval data
        })
      } catch (error) {
        console.error('Failed to approve restaurant:', error)
      }
    }

    return {
      activeTab,
      verificationStep,
      requiredDocuments,
      documentChecks,
      backgroundCheck,
      inspection,
      completionRate,
      averageRating,
      totalReviews,
      ratingDistribution,
      revenueChartOption,
      isReadyForApproval,
      viewDocument,
      requestDocument,
      approveRestaurant
    }
  }
}
</script>

<style scoped>
.chart {
  height: 400px;
}
</style>