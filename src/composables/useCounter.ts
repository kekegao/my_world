import { useCounterStore } from '@/stores/counter'
import { storeToRefs } from 'pinia'

export function useCounter() {
  const store = useCounterStore()
  const { count, doubleCount } = storeToRefs(store)

  return {
    count,
    doubleCount,
    increment: store.increment,
    decrement: store.decrement,
    reset: store.reset,
  }
}
