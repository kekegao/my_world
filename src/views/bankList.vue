<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  addBankCard,
  BANK_OPTIONS,
  bankOption,
  loadBankCards,
  maskCardNo,
  removeBankCard,
  type BankCard,
} from '@/utils/bankCard'

const router = useRouter()

/** 单用户最多绑定的银行卡数量 */
const MAX_CARDS = 6

/** 已绑定的银行卡列表 */
const cards = ref<BankCard[]>(loadBankCards())

const cardsCount = computed(() => cards.value.length)

/** 返回上一页 */
function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/account')
  }
}

/* ===== 删除银行卡 ===== */
const deleteTarget = ref<BankCard | null>(null)

function askDelete(card: BankCard) {
  deleteTarget.value = card
}

function cancelDelete() {
  deleteTarget.value = null
}

function confirmDelete() {
  if (!deleteTarget.value) return
  cards.value = removeBankCard(deleteTarget.value.id)
  deleteTarget.value = null
}

/* ===== 添加银行卡 ===== */
const showAdd = ref(false)
const formBank = ref('')
const formCardNo = ref('')
const formHolder = ref('')
const formError = ref('')

/** 卡号输入：仅数字并自动四位分组 */
function onCardNoInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 23)
  formCardNo.value = raw.replace(/(.{4})/g, '$1 ').trim()
  formError.value = ''
}

/** 选择银行 */
function selectBank(bank: string) {
  formBank.value = bank
  formError.value = ''
}

/** 重置添加表单 */
function resetForm() {
  formBank.value = ''
  formCardNo.value = ''
  formHolder.value = ''
  formError.value = ''
}

function openAdd() {
  resetForm()
  showAdd.value = true
}

function closeAdd() {
  showAdd.value = false
}

/** 保存新增银行卡 */
function saveCard() {
  const digits = formCardNo.value.replace(/\s/g, '')
  if (!formBank.value) {
    formError.value = '请选择银行卡所属银行'
    return
  }
  if (digits.length < 15 || digits.length > 19) {
    formError.value = '请输入正确的银行卡号（15~19 位数字）'
    return
  }
  addBankCard({ bank: formBank.value, cardNo: digits, holder: formHolder.value })
  cards.value = loadBankCards()
  showAdd.value = false
  resetForm()
}
</script>

<template>
  <div class="banklist-app">
    <!-- 顶部导航 -->
    <header class="app-bar">
      <button type="button" class="back-btn" aria-label="返回" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <span class="app-title">银行卡管理</span>
      <span class="app-right"></span>
    </header>

    <main class="bank-body">
      <!-- 列表信息 -->
      <div class="list-head">
        <span>已绑定 {{ cardsCount }} 张银行卡</span>
        <span class="head-hint">最多可绑定 {{ MAX_CARDS }} 张</span>
      </div>

      <!-- 已绑定的银行卡 -->
      <section v-if="cards.length" class="bank-list">
        <article
          v-for="card in cards"
          :key="card.id"
          class="bank-card"
          :style="{ background: `linear-gradient(135deg, ${bankOption(card.bank).from} 0%, ${bankOption(card.bank).to} 100%)` }"
        >
          <div class="bank-top">
            <span class="bank-badge">{{ card.bank.charAt(0) }}</span>
            <span class="bank-name">
              <b>{{ card.bank }}</b>
              <i>{{ card.cardType }}</i>
            </span>
            <button type="button" class="del-btn" aria-label="删除银行卡" @click="askDelete(card)">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m3 0-1 12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M10 11v6m4-6v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              </svg>
            </button>
          </div>

          <p class="card-no">{{ maskCardNo(card.cardNo) }}</p>

          <div class="bank-bottom">
            <span class="card-holder">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.6" />
                <path d="M5 20c1-3 3.5-4.5 7-4.5s6 1.5 7 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              </svg>
              {{ card.holder }}
            </span>
            <span class="card-time">绑定于 {{ card.addTime }}</span>
          </div>
        </article>
      </section>

      <!-- 空状态 -->
      <section v-else class="empty-state">
        <span class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke="currentColor" stroke-width="1.6" />
            <path d="M2.5 10h19M6.5 15h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          </svg>
        </span>
        <p class="empty-title">暂未绑定银行卡</p>
        <p class="empty-tip">添加银行卡后可用于提现到账</p>
        <button type="button" class="empty-add-btn" @click="openAdd">立即添加</button>
      </section>

      <p class="bank-tip">银行卡信息仅用于演示，请放心绑定；解绑后不影响历史提现记录。</p>
    </main>

    <!-- 底部操作栏 -->
    <footer v-if="cards.length" class="action-bar">
      <button type="button" class="add-btn" :disabled="cardsCount >= MAX_CARDS" @click="openAdd">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
        </svg>
        {{ cardsCount >= MAX_CARDS ? '已达绑定上限' : '添加银行卡' }}
      </button>
    </footer>

    <!-- 添加银行卡（底部弹层） -->
    <Transition name="fade">
      <div v-if="showAdd" class="sheet-mask" @click.self="closeAdd">
        <Transition name="slide" appear>
          <div class="sheet">
            <div class="sheet-head">
              <b>添加银行卡</b>
              <button type="button" class="sheet-close" aria-label="关闭" @click="closeAdd">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
              </button>
            </div>

            <p class="field-label">选择银行</p>
            <div class="bank-options">
              <button
                v-for="opt in BANK_OPTIONS"
                :key="opt.name"
                type="button"
                class="bank-option"
                :class="{ active: formBank === opt.name }"
                @click="selectBank(opt.name)"
              >
                <span class="option-badge" :style="{ background: `linear-gradient(135deg, ${opt.from}, ${opt.to})` }">
                  {{ opt.name.charAt(0) }}
                </span>
                {{ opt.name }}
                <span v-if="formBank === opt.name" class="option-check">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 13l4 4 10-10" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
              </button>
            </div>

            <p class="field-label">银行卡号</p>
            <input
              class="form-input card-no-input"
              type="text"
              inputmode="numeric"
              placeholder="请输入银行卡号"
              :value="formCardNo"
              @input="onCardNoInput"
            />

            <p class="field-label">持卡人（选填）</p>
            <input
              v-model="formHolder"
              class="form-input"
              type="text"
              maxlength="20"
              placeholder="默认「本人」"
            />

            <p v-if="formError" class="form-error">{{ formError }}</p>

            <div class="sheet-actions">
              <button type="button" class="cancel-btn" @click="closeAdd">取消</button>
              <button type="button" class="save-btn" @click="saveCard">保存</button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- 删除确认弹层 -->
    <Transition name="fade">
      <div v-if="deleteTarget" class="confirm-mask">
        <div class="confirm-card">
          <span class="confirm-icon">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m3 0-1 12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <p class="confirm-title">删除银行卡</p>
          <p class="confirm-desc">
            确认删除 {{ deleteTarget.bank }}（尾号 {{ deleteTarget.cardNo.slice(-4) }}）吗？删除后如需要可重新添加。
          </p>
          <div class="confirm-actions">
            <button type="button" class="confirm-cancel" @click="cancelDelete">取消</button>
            <button type="button" class="confirm-ok" @click="confirmDelete">确认删除</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.banklist-app {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  background: $bg-page;
  box-shadow: 0 0 24px rgba(0, 0, 0, 0.06);
}

/* ===== 顶部导航 ===== */
.app-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 52px;
  padding: 0 $spacing-md;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: $bg-card;
  border-bottom: 1px solid $border-color;
}

.back-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: transparent;
  color: $text-primary;
  transition: $transition-base;

  svg {
    width: 22px;
    height: 22px;
  }

  &:active {
    background: $bg-page;
  }
}

.app-title {
  font-size: $font-size-lg;
  font-weight: 700;
  color: $text-primary;
}

.app-right {
  width: 36px;
}

/* ===== 主体 ===== */
.bank-body {
  padding: $spacing-md $spacing-md 120px;
}

.list-head {
  padding: 0 $spacing-xs $spacing-sm;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: $font-size-sm;
  color: $text-secondary;

  .head-hint {
    font-size: $font-size-xs;
    color: $text-muted;
  }
}

.bank-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

/* 银行卡卡片（模拟银行卡片视觉） */
.bank-card {
  position: relative;
  padding: $spacing-lg;
  border-radius: $radius-lg;
  color: #fff;
  box-shadow: $shadow-md;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    right: -40px;
    bottom: -60px;
    width: 160px;
    height: 160px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.12);
  }

  &::before {
    content: '';
    position: absolute;
    right: 30px;
    bottom: -30px;
    width: 90px;
    height: 90px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
  }
}

.bank-top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.bank-badge {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-md;
  background: rgba(255, 255, 255, 0.22);
  font-size: 20px;
  font-weight: 700;
  backdrop-filter: blur(2px);
}

.bank-name {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;

  b {
    font-size: $font-size-base;
    font-weight: 600;
    letter-spacing: 1px;
  }

  i {
    font-style: normal;
    font-size: $font-size-xs;
    opacity: 0.85;
  }
}

.del-btn {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  transition: $transition-base;

  svg {
    width: 17px;
    height: 17px;
  }

  &:active {
    background: rgba(255, 255, 255, 0.3);
  }
}

.card-no {
  position: relative;
  z-index: 1;
  margin-top: $spacing-lg;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 2px;
  font-variant-numeric: tabular-nums;
}

.bank-bottom {
  position: relative;
  z-index: 1;
  margin-top: $spacing-md;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: $font-size-xs;
  opacity: 0.92;
}

.card-holder {
  display: inline-flex;
  align-items: center;
  gap: 5px;

  svg {
    width: 15px;
    height: 15px;
  }
}

/* 空状态 */
.empty-state {
  padding: $spacing-xl $spacing-lg;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: $bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
}

.empty-icon {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba($color-primary, 0.08);
  color: $color-primary;

  svg {
    width: 40px;
    height: 40px;
  }
}

.empty-title {
  margin-top: $spacing-md;
  font-size: $font-size-base;
  font-weight: 600;
  color: $text-primary;
}

.empty-tip {
  margin-top: $spacing-xs;
  font-size: $font-size-sm;
  color: $text-muted;
}

.empty-add-btn {
  height: 38px;
  margin-top: $spacing-lg;
  padding: 0 30px;
  border: none;
  border-radius: $radius-full;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #fff;
  font-size: $font-size-sm;
  font-weight: 600;
  box-shadow: $shadow-sm;
  transition: $transition-base;

  &:active {
    opacity: 0.85;
  }
}

.bank-tip {
  margin-top: $spacing-lg;
  padding: 0 $spacing-xs;
  font-size: $font-size-xs;
  color: $text-muted;
  line-height: 1.7;
}

/* ===== 底部操作栏 ===== */
.action-bar {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 0;
  z-index: 30;
  width: min(480px, 100vw);
  padding: $spacing-sm $spacing-md;
  padding-bottom: calc(#{$spacing-sm} + env(safe-area-inset-bottom));
  background: rgba($bg-card, 0.94);
  backdrop-filter: blur(8px);
  border-top: 1px solid $border-color;
}

.add-btn {
  width: 100%;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  border-radius: $radius-full;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #fff;
  font-size: $font-size-base;
  font-weight: 600;
  letter-spacing: 2px;
  box-shadow: $shadow-md;
  transition: $transition-base;

  svg {
    width: 20px;
    height: 20px;
  }

  &:active {
    transform: translateY(1px);
    box-shadow: $shadow-sm;
  }

  &:disabled {
    opacity: 0.55;
    transform: none;
    box-shadow: none;
  }
}

/* ===== 添加银行卡弹层 ===== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateY(100%);
}

.sheet-mask {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(15, 23, 42, 0.5);
}

.sheet {
  width: min(480px, 100vw);
  max-height: 88vh;
  padding: $spacing-lg $spacing-lg calc(#{$spacing-lg} + env(safe-area-inset-bottom));
  overflow-y: auto;
  background: $bg-card;
  border-radius: $radius-lg $radius-lg 0 0;
}

.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;

  b {
    font-size: $font-size-lg;
    color: $text-primary;
  }
}

.sheet-close {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: $bg-page;
  color: $text-muted;
  transition: $transition-base;

  svg {
    width: 16px;
    height: 16px;
  }

  &:active {
    opacity: 0.7;
  }
}

.field-label {
  margin: $spacing-lg 0 $spacing-sm;
  font-size: $font-size-sm;
  font-weight: 600;
  color: $text-primary;
}

/* 银行选择 */
.bank-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-sm;
}

.bank-option {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px $spacing-sm;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  background: $bg-card;
  font-size: $font-size-xs;
  color: $text-primary;
  text-align: left;
  overflow: hidden;
  white-space: nowrap;
  transition: $transition-base;

  &.active {
    border-color: $color-primary;
    background: rgba($color-primary, 0.06);
    color: $color-primary;
    font-weight: 600;
  }
}

.option-badge {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}

.option-check {
  margin-left: auto;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 16px;
    height: 16px;
  }
}

/* 表单 */
.form-input {
  width: 100%;
  height: 46px;
  padding: 0 $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  outline: none;
  background: $bg-card;
  font-size: $font-size-base;
  color: $text-primary;
  transition: border-color $transition-base;

  &:focus {
    border-color: $color-primary;
  }

  &::placeholder {
    color: $text-muted;
  }
}

.card-no-input {
  letter-spacing: 1px;
  font-variant-numeric: tabular-nums;
}

.form-error {
  margin-top: $spacing-sm;
  font-size: $font-size-xs;
  color: $color-danger;
}

.sheet-actions {
  margin-top: $spacing-lg;
  display: flex;
  gap: $spacing-md;

  button {
    flex: 1;
    height: 44px;
    border-radius: $radius-full;
    font-size: $font-size-base;
    font-weight: 600;
    transition: $transition-base;

    &:active {
      opacity: 0.85;
    }
  }
}

.cancel-btn {
  border: 1px solid $border-color;
  background: $bg-card;
  color: $text-secondary;
}

.save-btn {
  border: none;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #fff;
}

/* ===== 删除确认弹层 ===== */
.confirm-mask {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.55);
}

.confirm-card {
  width: 300px;
  padding: $spacing-xl $spacing-lg $spacing-lg;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: $bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-lg;
}

.confirm-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba($color-danger, 0.1);
  color: $color-danger;

  svg {
    width: 32px;
    height: 32px;
  }
}

.confirm-title {
  margin-top: $spacing-md;
  font-size: $font-size-lg;
  font-weight: 700;
  color: $text-primary;
}

.confirm-desc {
  margin-top: $spacing-sm;
  font-size: $font-size-sm;
  color: $text-secondary;
  line-height: 1.7;
}

.confirm-actions {
  width: 100%;
  margin-top: $spacing-lg;
  display: flex;
  gap: $spacing-md;

  button {
    flex: 1;
    height: 42px;
    border-radius: $radius-full;
    font-size: $font-size-base;
    font-weight: 600;
    transition: $transition-base;

    &:active {
      opacity: 0.85;
    }
  }
}

.confirm-cancel {
  border: 1px solid $border-color;
  background: $bg-card;
  color: $text-secondary;
}

.confirm-ok {
  border: none;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #fff;
}
</style>
