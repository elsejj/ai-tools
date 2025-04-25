<template>
  <div
    class="grid grid-cols-4 md:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-12 gap-2 w-full p-2 bg-surface-100 rounded-md ">
    <div v-for="tool in settings.tools.enabled"
      class="flex items-center gap-2 p-1 h-8 bg-surface-50  shadow-gray-300 shadow-sm rounded-md hover:shadow-md  transition-shadow duration-300 transform "
      :key="tool">
      <RadioButton :value="tool" v-model="settings.tools.activated" name="tool" :inputId="tool" class="" />
      <label :for="tool" class="pointer-events-auto flex-auto block cursor-pointer ">{{ tool }}</label>
    </div>
    <div class="flex items-center">
      <Button label="工具" @click="$router.push({ path: '/tools' })" link class="text-primary-500 p-1" :dt="toolButton" />
      <Button label="模型" @click="$router.push({ path: '/llm' })" link class="text-primary-500 p-1" :dt="toolButton" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useSettings } from "../composables/settings";
import RadioButton from 'primevue/radiobutton';


const settings = useSettings();


const toolButton = ref({
  paddingY: '0px'
})


</script>