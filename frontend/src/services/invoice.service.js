import axios from 'axios'
import { handleError } from '@/utils/error-handler'

class InvoiceService {
  constructor() {
    this.api = axios.create({
      baseURL: `${process.env.VUE_APP_API_URL}/api/invoices`,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  // Add authentication header
  setAuthHeader(token) {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  // Generate invoice for order
  async generateInvoice(orderId) {
    try {
      const response = await this.api.post('/generate', {
        orderId
      })
      return response.data
    } catch (error) {
      throw handleError(error)
    }
  }

  // Get invoice by ID
  async getInvoice(invoiceId) {
    try {
      const response = await this.api.get(`/${invoiceId}`)
      return response.data
    } catch (error) {
      throw handleError(error)
    }
  }

  // Get invoice PDF
  async getInvoicePDF(invoiceId) {
    try {
      const response = await this.api.get(`/${invoiceId}/pdf`, {
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      throw handleError(error)
    }
  }

  // Send invoice by email
  async sendInvoiceEmail(invoiceId, email) {
    try {
      const response = await this.api.post(`/${invoiceId}/send`, {
        email
      })
      return response.data
    } catch (error) {
      throw handleError(error)
    }
  }

  // Get invoice history
  async getInvoiceHistory(params) {
    try {
      const response = await this.api.get('/history', {
        params
      })
      return response.data
    } catch (error) {
      throw handleError(error)
    }
  }

  // Generate refund invoice
  async generateRefundInvoice(refundData) {
    try {
      const response = await this.api.post('/refund', refundData)
      return response.data
    } catch (error) {
      throw handleError(error)
    }
  }

  // Send refund confirmation email
  async sendRefundEmail(refundData) {
    try {
      const response = await this.api.post('/refund/email', refundData)
      return response.data
    } catch (error) {
      throw handleError(error)
    }
  }

  // Download multiple invoices as ZIP
  async downloadInvoicesZip(invoiceIds) {
    try {
      const response = await this.api.post('/download-zip', {
        invoiceIds
      }, {
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      throw handleError(error)
    }
  }

  // Generate monthly statement
  async generateMonthlyStatement(month, year) {
    try {
      const response = await this.api.post('/monthly-statement', {
        month,
        year
      })
      return response.data
    } catch (error) {
      throw handleError(error)
    }
  }

  // Get invoice statistics
  async getInvoiceStats(params) {
    try {
      const response = await this.api.get('/stats', {
        params
      })
      return response.data
    } catch (error) {
      throw handleError(error)
    }
  }
}

export default new InvoiceService()