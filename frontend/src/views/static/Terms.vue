<template>
  <div class="terms">
    <h1>Terms and Conditions</h1>
    <div class="content">
      <h2>1. Introduction</h2>
      <p>Welcome to UberEat. By using our service, you agree to these terms and conditions.</p>

      <h2>2. Use of Service</h2>
      <p>Our services are available for personal, non-commercial use. You must be at least 18 years old to use our services.</p>

      <h2>3. Account Registration</h2>
      <p>You are responsible for maintaining the confidentiality of your account information and password.</p>

      <h2>4. Orders and Payment</h2>
      <p>All orders are subject to availability. Prices are subject to change without notice.</p>

      <h2>5. Delivery</h2>
      <p>Delivery times are estimates and may vary based on various factors including weather, traffic, and restaurant preparation time.</p>

      <h2>6. Cancellation Policy</h2>
      <p>Orders can be cancelled before the restaurant begins preparing your food. Cancellation fees may apply.</p>

      <h2>7. Privacy</h2>
      <p>Your privacy is important to us. Please review our Privacy Policy to understand how we collect and use your information.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Terms'
}
</script>

<style scoped>
.terms {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.content {
  margin-top: 2rem;
}

h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 2rem;
}

h2 {
  font-size: 1.5rem;
  color: #444;
  margin: 1.5rem 0 1rem;
}

p {
  line-height: 1.6;
  color: #666;
  margin-bottom: 1rem;
}
</style>
