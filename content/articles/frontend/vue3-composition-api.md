# Vue3 组合式 API 深度解析

> 发布时间：2024-01-15  
> 分类：前端开发 > Vue  
> 标签：Vue3, Composition API, JavaScript

## 前言

Vue3 的组合式 API（Composition API）是 Vue.js 框架的一次重大革新，它为开发者提供了更灵活、更强大的代码组织方式。本文将深入探讨组合式 API 的核心概念和实际应用。

## 什么是组合式 API？

组合式 API 是一套基于函数的 API，允许我们更好地组织组件逻辑。相比于选项式 API，它提供了：

-   更好的类型推导
-   更灵活的代码复用
-   更清晰的逻辑组织

## 核心概念

### 1. setup() 函数

`setup()` 是组合式 API 的入口点：

```javascript
import { ref, reactive } from 'vue'

export default {
    setup() {
        // 响应式数据
        const count = ref(0)
        const state = reactive({
            name: 'Vue3',
            version: '3.x'
        })

        // 方法
        const increment = () => {
            count.value++
        }

        // 返回模板使用的数据和方法
        return {
            count,
            state,
            increment
        }
    }
}
```

### 2. ref() 和 reactive()

-   `ref()`: 创建基本类型的响应式引用
-   `reactive()`: 创建对象的响应式代理

```javascript
// ref 用于基本类型
const count = ref(0)
const message = ref('Hello Vue3')

// reactive 用于对象
const user = reactive({
    id: 1,
    name: 'John',
    email: 'john@example.com'
})
```

### 3. 计算属性和侦听器

```javascript
import { ref, computed, watch } from 'vue'

export default {
    setup() {
        const firstName = ref('John')
        const lastName = ref('Doe')

        // 计算属性
        const fullName = computed(() => {
            return `${firstName.value} ${lastName.value}`
        })

        // 侦听器
        watch(firstName, (newValue, oldValue) => {
            console.log(`名字从 ${oldValue} 变为 ${newValue}`)
        })

        return {
            firstName,
            lastName,
            fullName
        }
    }
}
```

## 生命周期钩子

在组合式 API 中，生命周期钩子需要显式导入：

```javascript
import { onMounted, onUpdated, onUnmounted } from 'vue'

export default {
    setup() {
        onMounted(() => {
            console.log('组件已挂载')
        })

        onUpdated(() => {
            console.log('组件已更新')
        })

        onUnmounted(() => {
            console.log('组件即将卸载')
        })
    }
}
```

## 代码复用

组合式 API 的一个重要优势是更好的代码复用。我们可以创建自定义的组合函数：

```javascript
// composables/useCounter.js
import { ref } from 'vue'

export function useCounter(initialValue = 0) {
    const count = ref(initialValue)

    const increment = () => count.value++
    const decrement = () => count.value--
    const reset = () => (count.value = initialValue)

    return {
        count,
        increment,
        decrement,
        reset
    }
}

// 在组件中使用
import { useCounter } from './composables/useCounter'

export default {
    setup() {
        const { count, increment, decrement, reset } = useCounter(10)

        return {
            count,
            increment,
            decrement,
            reset
        }
    }
}
```

## 与 TypeScript 的完美结合

组合式 API 天生对 TypeScript 友好：

```typescript
import { ref, Ref } from 'vue'

interface User {
    id: number
    name: string
    email: string
}

export default {
    setup() {
        const user: Ref<User | null> = ref(null)
        const loading = ref(false)

        const fetchUser = async (id: number): Promise<void> => {
            loading.value = true
            try {
                const response = await fetch(`/api/users/${id}`)
                user.value = await response.json()
            } finally {
                loading.value = false
            }
        }

        return {
            user,
            loading,
            fetchUser
        }
    }
}
```

## 最佳实践

1. **逻辑分组**: 将相关的响应式数据和方法放在一起
2. **提取复用逻辑**: 将可复用的逻辑提取为组合函数
3. **合理使用 ref 和 reactive**: 基本类型用 ref，对象用 reactive
4. **避免解构 reactive**: 直接解构会失去响应性

## 总结

Vue3 的组合式 API 为我们提供了更强大、更灵活的代码组织方式。它不仅解决了选项式 API 的一些限制，还为大型应用的开发提供了更好的支持。掌握组合式 API 是现代 Vue.js 开发的必备技能。

---

_更多 Vue3 相关内容，请关注我们的技术博客。_
