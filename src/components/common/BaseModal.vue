<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-mask">
        <div class="modal-container">
          <div class="modal-header">
            <h3 v-if="title" class="modal-title">{{ title }}</h3>
          </div>
          
          <div class="modal-content">
            <div v-if="desc" class="modal-desc" v-html="desc"></div>
            <slot name="content"></slot>
          </div>

          <div class="modal-footer">
            <button
              v-if="showCancel"
              class="modal-button cancel-button"
              @click="handleCancel"
            >
              {{ cancelText }}
            </button>
            <button
              class="modal-button confirm-button"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  desc: {
    type: String,
    required: true
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  confirmText: {
    type: String,
    default: '确定'
  },
  showCancel: {
    type: Boolean,
    default: true
  },
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm', 'cancel', 'update:modelValue'])

const show = ref(false)

watch(() => props.modelValue, (val) => {
  show.value = val
})

const handleConfirm = () => {
  emit('confirm')
  closeModal()
}

const handleCancel = () => {
  emit('cancel')
  closeModal()
}

const closeModal = () => {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  transition: opacity 0.3s ease;
}

.modal-container {
  width: 90%;
  max-width: 500px;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.modal-header {
  margin-bottom: 20px;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.modal-content {
  margin-bottom: 24px;
}

.modal-desc {
  font-size: 0.95rem;
  color: #4b5563;
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-button {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
}

.cancel-button {
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.cancel-button:hover {
  background-color: #e5e7eb;
}

.confirm-button {
  background-color: var(--color-primary, #3b82f6);
  color: white;
  border: 1px solid var(--color-primary, #3b82f6);
}

.confirm-button:hover {
  opacity: 0.9;
}

/* 过渡动画 */
.modal-enter-from {
  opacity: 0;
}

.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
}
</style>