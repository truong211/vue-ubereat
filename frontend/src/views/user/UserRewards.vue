<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-6">Your Rewards</h1>
        
        <loyalty-program></loyalty-program>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import LoyaltyProgram from '@/components/user/LoyaltyProgram.vue';

export default {
  name: 'UserRewards',
  
  components: {
    LoyaltyProgram
  }
};
</script> 