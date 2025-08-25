# JavaScript 中的数据拷贝指南 🧭

> 发布时间：2025-08-24  
> 分类：前端开发 > JavaScript
> 标签：JavaScript, 数据拷贝, 前端开发

## 引言

在 JavaScript 编程中，数据的复制是一个基础而又至关重要的概念，尤其在处理复杂的数据结构时，正确地执行拷贝操作可以避免意料之外的数据修改问题

## 浅拷贝与深拷贝的区别

在 JavaScript 中，数据拷贝通常指的是对象或数组的复制。根据是否进行深层次的复制，可以分为浅拷贝和深拷贝。

### 浅拷贝

浅拷贝只会复制对象的第一层属性。如果属性值是基本数据类型（如数字、字符串、布尔值等），则复制的是值；如果属性值是对象或数组（即引用类型），则复制的是引用（即指针），而不是对象本身。

### 深拷贝

深拷贝会递归复制对象的所有层级，创建一个完全独立的副本。这意味着原始对象和拷贝对象没有任何共享的引用。

深拷贝确保对象的每个属性都是新创建的，修改拷贝对象不会影响原始对象

## 浅拷贝的常用方法

### Object.create

新对象的原型被设置为原对象

```javascript
const original = {
  name: 'John',
  age: 30,
  address: {
      city: 'New York',
      zip: '10001'
}
const newObj = Object.create(original)
console.log(newObj, 'newObj')
```

### Object.assign

```javascript
const original = {
  name: 'John',
  age: 30,
  address: {
      city: 'New York',
      zip: '10001'
},
const newObj = Object.assign({}, original)
console.log(newObj, 'newObjg')
```

### 展开运算符

```javascript
const original = {
  name: 'John',
  age: 30,
  address: {
      city: 'New York',
      zip: '10001'
},
const newObj = {...original}
console.log(newObj, 'newObjg')
```

## 深拷贝的常用方法

### **JSON.parse(JSON.stringify(obj))**

1：无法识别 BigInt 类型： 当对象中包含 BigInt 类型的值时，这个方法会将其转换为字符串，因为 JSON 标准不支持 BigInt 类型。因此，复制后的对象中的 BigInt 值不再是 BigInt，而是字符串。

2：无法拷贝 undefined、function、Symbol 属性：

（1）：undefined 的属性值会被忽略，因为它不是 JSON 格式的一部分。

（2）：函数（function）作为对象的属性不能被序列化，所以在解析后会丢失。

（3）：Symbol 作为键或值同样不会被处理，因为 JSON.stringify 会忽略 Symbol 类型的键，且 Symbol 值也不能被直接序列化。

3：无法处理循环引用： 如果对象结构中存在循环引用（即对象 A 的某个属性引用了对象 B，同时对象 B 的某个属性又引用了对象 A），JSON.stringify 会抛出错误，因为它无法正确地序列化这样的结构。

```javascript
let obj = {
    a: 3,
    b: { n: 2 },
    c: 'ccccc',
    d: true,
    e: undefined,
    f: null,
    g: function () {},
    h: Symbol(1)
}

let newObj = JSON.parse(JSON.stringify(obj))
console.log(newObj) //{ a: 3, b: { n: 2 }, c: 'ccccc', d: true, f: null }
obj.b.n = 1
console.log(newObj) //{ a: 3, b: { n: 2 }, c: 'ccccc', d: true, f: null }
//实现了深度拷贝，但是没有拷贝`undefined`、`function`、`Symbol`
```

**不能被 json 序列化的，都不支持**

### **structuredClone(obj)**

是一个较新的 API（在某些现代浏览器和 Node.js 中可用），它能完美地克隆大多数值，包括循环引用，但兼容性可能不是那么好。

```javascript
let obj = {
    a: 1,
    b: { n: 1 }
}

const newObj = structuredClone(obj)
obj.b.n = 3
console.log(newObj) //{ a: 1, b: { n: 1 } }
```

### 手写一个深拷贝方法

支持大部分场景

```javascript
const deepCopy = obj => {
    if (obj !== null || typeof obj !== 'object') {
        //排出这两类类型直接return
        return obj
    }
    //如果是数组
    if (obj instanceof Array) {
        const copy = []
        obj.forEach(item => copy.push(item))
        return copy
    }
    //如果是日期
    if (obj instanceof Date) {
        return new Date(obj)
    }
    //如果是对象
    if (obj instanceof Object) {
        const copy = {}
        Object.kyes(obj).forEach(key => {
            copy[key] = deepCopy(obj[key])
        })
        return copy
    }
    throw new Error('报错！！')
}
const obj = {
    name: '张三',
    age: 18,
    getInfo: () => {},
    info: {
        a: '1',
        b: { b: 2 },
        c: true
    },
    time: new Date(),
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
}
const newObj = deepCopy(obj)
console.log(newObj, 'obj-->>')
```

## 总结

-   **浅拷贝：复制对象的第一层属性，嵌套的对象或数组共享引用。**

-   **深拷贝：递归复制对象的所有层级，创建完全独立的副本。**
