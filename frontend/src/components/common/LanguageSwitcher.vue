<template>
  <v-menu location="bottom end" transition="slide-y-transition">
    <template v-slot:activator="{ props }">
      <v-btn
        v-bind="props"
        variant="text"
        class="text-none"
      >
        <v-icon start>mdi-translate</v-icon>
        {{ currentLanguageLabel }}
      </v-btn>
    </template>

    <v-list>
      <v-list-item
        v-for="(language, code) in languages"
        :key="code"
        :value="code"
        @click="changeLanguage(code)"
      >
        <v-list-item-title>{{ language }}</v-list-item-title>
        <template v-slot:prepend>
          <v-icon v-if="currentLocale === code" color="primary">
            mdi-check
          </v-icon>
        </template>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/i18n'

export default {
  name: 'LanguageSwitcher',

  setup() {
    const { locale } = useI18n()

    const languages = {
      en: 'English',
      vi: 'Tiếng Việt'
    }

    const currentLocale = computed(() => locale.value)
    const currentLanguageLabel = computed(() => languages[currentLocale.value])

    const changeLanguage = (code) => {
      setLocale(code)
    }

    return {
      languages,
      currentLocale,
      currentLanguageLabel,
      changeLanguage
    }
  }
}
</script>

<style scoped>
.v-btn {
  text-transform: capitalize;
}
</style>