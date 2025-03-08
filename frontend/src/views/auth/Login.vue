<template>
  <auth-form mode="login" @auth-success="onAuthSuccess" />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import AuthForm from '@/components/auth/AuthForm.vue'

const router = useRouter()

const onAuthSuccess = () => {
  const redirect = router.currentRoute.value.query.redirect as string || '/'
  router.push(redirect)
}
</script>
