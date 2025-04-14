<template>
  <div class="cookies">
    <h1>Cookie Policy</h1>
    <div class="content">
      <h2>1. What are Cookies?</h2>
      <p>Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience and enable certain features to work.</p>

      <h2>2. How We Use Cookies</h2>
      <p>We use cookies for various purposes including:</p>
      <ul>
        <li>Essential cookies for site functionality</li>
        <li>Analytics cookies to understand user behavior</li>
        <li>Preference cookies to remember your settings</li>
        <li>Authentication cookies to keep you signed in</li>
      </ul>

      <h2>3. Types of Cookies We Use</h2>
      <h3>Essential Cookies</h3>
      <p>These cookies are necessary for the website to function and cannot be switched off. They are usually set in response to actions you take such as logging in or filling in forms.</p>

      <h3>Performance Cookies</h3>
      <p>These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site.</p>

      <h3>Functional Cookies</h3>
      <p>These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings.</p>

      <h2>4. Managing Cookies</h2>
      <p>You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed.</p>

      <h2>5. Contact Us</h2>
      <p>If you have any questions about our Cookie Policy, please contact us through our support channels.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Cookies'
}
</script>

<style scoped>
.cookies {
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

h3 {
  font-size: 1.25rem;
  color: #555;
  margin: 1.2rem 0 0.8rem;
}

p {
  line-height: 1.6;
  color: #666;
  margin-bottom: 1rem;
}

ul {
  color: #666;
  margin: 1rem 0;
  padding-left: 1.5rem;
}

li {
  line-height: 1.6;
  margin-bottom: 0.5rem;
}
</style>
