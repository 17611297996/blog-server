# React Hooks 完全指南

> 发布时间：2024-01-20  
> 分类：前端开发 > React  
> 标签：React, Hooks, 前端开发

## 前言

React Hooks 是 React 16.8 引入的新特性，它允许你在不编写 class 的情况下使用 state 以及其他的 React 特性。本文将详细介绍 React Hooks 的使用方法和最佳实践。

## 什么是 Hooks？

Hooks 是一些可以让你在函数组件里"钩入" React state 及生命周期等特性的函数。Hook 不能在 class 组件中使用，但可以让你在不写 class 的情况下使用 React。

## 常用的 Hooks

### 1. useState

用于在函数组件中添加状态：

```jsx
import React, { useState } from 'react'

function Counter() {
    const [count, setCount] = useState(0)

    return (
        <div>
            <p>你点击了 {count} 次</p>
            <button onClick={() => setCount(count + 1)}>点击我</button>
        </div>
    )
}
```

### 2. useEffect

用于执行副作用操作：

```jsx
import React, { useState, useEffect } from 'react'

function Example() {
    const [count, setCount] = useState(0)

    useEffect(() => {
        document.title = `你点击了 ${count} 次`
    })

    return (
        <div>
            <p>你点击了 {count} 次</p>
            <button onClick={() => setCount(count + 1)}>点击我</button>
        </div>
    )
}
```

### 3. useContext

用于使用 Context：

```jsx
import React, { useContext } from 'react'

const ThemeContext = React.createContext()

function Button() {
    const theme = useContext(ThemeContext)
    return <button style={{ background: theme.background, color: theme.foreground }}>我是一个按钮</button>
}
```

## 自定义 Hooks

你可以创建自定义 Hooks 来复用状态逻辑：

```jsx
import { useState, useEffect } from 'react'

function useCounter(initialValue = 0) {
    const [count, setCount] = useState(initialValue)

    const increment = () => setCount(count + 1)
    const decrement = () => setCount(count - 1)
    const reset = () => setCount(initialValue)

    return { count, increment, decrement, reset }
}

// 使用自定义 Hook
function Counter() {
    const { count, increment, decrement, reset } = useCounter(10)

    return (
        <div>
            <p>计数: {count}</p>
            <button onClick={increment}>+</button>
            <button onClick={decrement}>-</button>
            <button onClick={reset}>重置</button>
        </div>
    )
}
```

## 最佳实践

1. **只在最顶层使用 Hook**：不要在循环、条件或嵌套函数中调用 Hook
2. **只在 React 函数中调用 Hook**：不要在普通的 JavaScript 函数中调用 Hook
3. **使用 eslint-plugin-react-hooks**：这个插件可以帮助你遵循 Hook 规则
4. **合理拆分 useEffect**：将不相关的逻辑分离到不同的 Effect 中

## 总结

React Hooks 为函数组件提供了强大的能力，让我们可以在不使用 class 的情况下使用 React 的各种特性。掌握 Hooks 是现代 React 开发的必备技能。

---

_更多 React 开发技巧，请关注我们的技术博客。_
