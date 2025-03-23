<template>
  <div>
    <v-btn
      variant="text"
      color="warning"
      @click="showDialog = true"
    >
      <v-icon left>mdi-alert-circle</v-icon>
      Báo cáo vấn đề
    </v-btn>

    <v-dialog v-model="showDialog" max-width="600">
      <v-card>
        <v-card-title>Báo cáo vấn đề với đơn hàng</v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="isValid">
            <v-select
              v-model="issueType"
              :items="issueTypes"
              label="Loại vấn đề"
              :rules="[v => !!v || 'Vui lòng chọn loại vấn đề']"
              required
            ></v-select>

            <v-select
              v-if="issueType === 'item_issue'"
              v-model="selectedItems"
              :items="orderItems"
              item-title="name"
              item-value="id"
              label="Chọn món có vấn đề"
              multiple
              :rules="itemRules"
            ></v-select>

            <v-textarea
              v-model="description"
              label="Mô tả chi tiết vấn đề"
              :rules="[v => !!v || 'Vui lòng mô tả vấn đề',
                      v => v.length >= 10 || 'Mô tả phải có ít nhất 10 ký tự']"
              counter="1000"
              required
            ></v-textarea>

            <v-file-input
              v-model="images"
              label="Thêm hình ảnh (không bắt buộc)"
              accept="image/*"
              multiple
              :rules="imageRules"
              prepend-icon="mdi-camera"
              show-size
              counter
              max-files="5"
            ></v-file-input>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="showDialog = false"
          >
            Hủy
          </v-btn>
          <v-btn
            color="warning"
            :loading="isSubmitting"
            :disabled="!isValid"
            @click="submitReport"
          >
            Gửi báo cáo
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  name: 'ReportIssue',

  props: {
    orderId: {
      type: [String, Number],
      required: true
    },
    orderItems: {
      type: Array,
      required: true
    }
  },

  data() {
    return {
      showDialog: false,
      isValid: false,
      isSubmitting: false,
      issueType: '',
      selectedItems: [],
      description: '',
      images: [],
      issueTypes: [
        { title: 'Vấn đề với món ăn', value: 'item_issue' },
        { title: 'Vấn đề với giao hàng', value: 'delivery_issue' },
        { title: 'Vấn đề với thanh toán', value: 'payment_issue' },
        { title: 'Khác', value: 'other' }
      ],
      itemRules: [
        v => !this.issueType || this.issueType !== 'item_issue' || v.length > 0 || 'Vui lòng chọn món có vấn đề'
      ],
      imageRules: [
        files => !files || files.length <= 5 || 'Không được tải lên quá 5 ảnh',
        files => {
          if (!files) return true
          const maxSize = 5 * 1024 * 1024 // 5MB
          return !files.some(file => file.size > maxSize) || 'Mỗi ảnh không được quá 5MB'
        }
      ]
    }
  },

  methods: {
    async submitReport() {
      if (!this.$refs.form.validate()) return

      this.isSubmitting = true
      try {
        const formData = new FormData()
        formData.append('orderId', this.orderId)
        formData.append('issueType', this.issueType)
        formData.append('description', this.description)
        
        if (this.selectedItems.length) {
          formData.append('itemIds', JSON.stringify(this.selectedItems))
        }

        if (this.images) {
          this.images.forEach(image => {
            formData.append('images', image)
          })
        }

        await this.$store.dispatch('orders/reportIssue', formData)
        
        this.$emit('issue-reported')
        this.showDialog = false
        this.$toast.success('Báo cáo của bạn đã được ghi nhận')
        
        // Reset form
        this.$refs.form.reset()
      } catch (error) {
        console.error('Failed to submit report:', error)
        this.$toast.error('Không thể gửi báo cáo. Vui lòng thử lại sau.')
      } finally {
        this.isSubmitting = false
      }
    }
  }
}
</script>