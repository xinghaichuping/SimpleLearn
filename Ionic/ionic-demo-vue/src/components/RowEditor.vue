<template>
  <ion-modal :is-open="true" @didDismiss="close">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ isEdit ? '编辑' : '新增' }} · {{ meta.label }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="close">取消</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form @submit.prevent="save">
        <div v-for="col in formColumns" :key="col.name" class="field">
          <ion-label>
            {{ col.label }} <span v-if="col.required" class="req">*</span>
          </ion-label>

          <ion-input
            v-if="col.type === 'password' || col.type === 'text'"
            v-model="form[col.name]"
            :type="col.type === 'password' ? 'password' : 'text'"
            :placeholder="col.sensitive ? '留空表示不修改' : ''"
          />
          <ion-textarea
            v-else-if="col.type === 'textarea' || col.type === 'json'"
            v-model="form[col.name]"
            :rows="4"
          />
          <ion-input
            v-else-if="col.type === 'integer' || col.type === 'number'"
            v-model="form[col.name]"
            type="number"
          />
          <ion-toggle v-else-if="col.type === 'boolean'" v-model="form[col.name]" />
          <ion-select v-else-if="col.type === 'select'" v-model="form[col.name]" interface="action-sheet">
            <ion-select-option v-for="opt in col.options || []" :key="opt" :value="opt">
              {{ opt }}
            </ion-select-option>
          </ion-select>
          <ion-input v-else v-model="form[col.name]" />
        </div>

        <ion-button type="submit" expand="block" :disabled="saving">保存</ion-button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonLabel,
  IonInput,
  IonTextarea,
  IonToggle,
  IonSelect,
  IonSelectOption,
  toastController,
} from '@ionic/vue'
import { adminInsertRow, adminUpdateRow, type AdminTableMeta } from '@/services/api'

const props = defineProps<{ meta: AdminTableMeta; row: Record<string, any> | null }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>()

const isEdit = computed(() => props.row !== null)
const formColumns = computed(() =>
  props.meta.columns.filter((c) => (isEdit.value ? c.editable : c.insertable)),
)

const form = ref<Record<string, any>>({})
const saving = ref(false)
const error = ref('')

function initForm() {
  const f: Record<string, any> = {}
  for (const col of formColumns.value) {
    if (isEdit.value && props.row) {
      if (col.sensitive) {
        f[col.name] = ''
      } else if (col.type === 'boolean') {
        f[col.name] = !!props.row[col.name]
      } else {
        f[col.name] = props.row[col.name] ?? ''
      }
    } else {
      f[col.name] = col.type === 'boolean' ? false : ''
    }
  }
  form.value = f
}
initForm()

function pkOf(row: Record<string, any>): string {
  return props.meta.pk.map((p) => String(row[p])).join(',')
}

async function save() {
  saving.value = true
  error.value = ''
  const payload: Record<string, any> = {}
  for (const col of formColumns.value) {
    const v = form.value[col.name]
    if (col.type === 'boolean') {
      payload[col.name] = v ? 1 : 0
    } else if (col.type === 'integer' || col.type === 'number') {
      if (v === '' || v === null || v === undefined) continue
      payload[col.name] = Number(v)
    } else {
      if (v === null || v === undefined) continue
      payload[col.name] = v
    }
  }

  try {
    if (isEdit.value) {
      await adminUpdateRow(props.meta.name, pkOf(props.row!), payload)
    } else {
      await adminInsertRow(props.meta.name, payload)
    }
    const toast = await toastController.create({ message: '已保存', duration: 1500 })
    await toast.present()
    emit('saved')
    close()
  } catch (e: any) {
    error.value = e?.message || '保存失败'
  } finally {
    saving.value = false
  }
}

function close() {
  emit('close')
}
</script>

<style scoped>
.field {
  margin-bottom: 12px;
}
.req {
  color: var(--ion-color-danger);
}
.error {
  color: var(--ion-color-danger);
}
</style>
