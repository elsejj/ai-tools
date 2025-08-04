<template>
  <div class="p-2 flex flex-col gap-2">
    <div class="w-full gap-2 p-2 bg-primary-700 rounded-md flex justify-end items-center">
      <Button label="返回" @click="$router.back()" link severity="help" class="text-surface-200" />
    </div>
    <div class="grid grid-cols-[4rem_1fr] items-center w-full gap-2 p-2 bg-gray-100 rounded-md">
      <div class="font-bold">地址</div>
      <InputText v-model="llm.baseUrl" class="w-full" placeholder="API地址" />
      <div class="font-bold">密钥</div>
      <Password v-model="llm.apiKey" inputClass="w-full" placeholder="API密钥" toggleMask />
      <div>代理</div>
      <InputText v-model="llm.proxy" class="w-full" placeholder="如果访问模型地址需要代理，请设置代理地址" />
      <div class="font-bold">模型</div>
      <InputText v-model="llm.model" class="w-full" placeholder="模型名称" />
      <div>思考力度</div>
      <div class="flex gap-2">
        <RadioButton v-model="llm.reasoningEffort" name="none" value="" class="" />
        <label for="none" class="">默认</label>
        <RadioButton v-model="llm.reasoningEffort" name="none" value="none" class="" />
        <label for="none" class="">无</label>
        <RadioButton v-model="llm.reasoningEffort" name="low" value="low" class="" />
        <label for="low" class="">低</label>
        <RadioButton v-model="llm.reasoningEffort" name="medium" value="medium" class="" />
        <label for="medium" class="">中</label>
        <RadioButton v-model="llm.reasoningEffort" name="high" value="high" class="" />
        <label for="high" class="">高</label>
        <RadioButton v-model="llm.reasoningEffort" name="auto" value="auto" class="" />
        <label for="auto" class="">自动</label>
      </div>
      <div>视觉模型</div>
      <InputText
        v-model="llm.visionModel"
        class="w-full"
        placeholder="视觉模型名称, 主模型不支持视觉的备选"
      />
      <div>思考力度</div>
      <div class="flex gap-2">
        <RadioButton v-model="llm.visionReasoningEffort" name="none" value="" class="" />
        <label for="none" class="">默认</label>
        <RadioButton v-model="llm.visionReasoningEffort" name="none" value="none" class="" />
        <label for="none" class="">无</label>
        <RadioButton v-model="llm.visionReasoningEffort" name="low" value="low" class="" />
        <label for="low" class="">低</label>
        <RadioButton v-model="llm.visionReasoningEffort" name="medium" value="medium" class="" />
        <label for="medium" class="">中</label>
        <RadioButton v-model="llm.visionReasoningEffort" name="high" value="high" class="" />
        <label for="high" class="">高</label>
        <RadioButton v-model="llm.visionReasoningEffort" name="auto" value="auto" class="" />
        <label for="auto" class="">自动</label>
      </div>
      <div>服务商</div>
      <InputText v-model="llm.provider" class="w-full" placeholder="服务商" />
    </div>
    <div class="flex justify-end items-center w-full gap-2 p-2">
      <div class="flex-auto"></div>
      <Button label="保存" @click="saveLlm" />
    </div>
    <div class="flex justify-end items-center w-full gap-2 p-2 text-red-400">
      {{ errMsg }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import { useSettings } from '@renderer/composables/settings'
import { useToast } from 'primevue/usetoast'

const errMsg = ref<string>('')
const { llm } = useSettings()
const toast = useToast()

async function saveLlm() {
  errMsg.value = ''
  if (!llm.baseUrl) {
    errMsg.value = '请填写API地址'
    return
  }
  if (!llm.model) {
    errMsg.value = '请填写模型名称'
    return
  }

  const { ipcRenderer } = window.electron
  ipcRenderer.postMessage("setProxy", llm.proxy)

  toast.add({
    severity: 'success',
    summary: '成功',
    detail: '模型配置已保存',
    life: 3000
  })
}
</script>
