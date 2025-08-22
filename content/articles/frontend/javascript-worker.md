# React Hooks 完全指南

> 发布时间：2024-05-20  
> 分类：前端开发 > JavaScript  
> 标签：JavaScript, Worker, 前端开发

## 前言

JavaScript 语言采用的是单线程模型，也就是说，所有任务只能在一个线程上完成，一次只能做一件事。前面的任务没做完，后面的任务只能等着。随着电脑计算能力的增强，尤其是多核 CPU 的出现，单线程带来很大的不便，无法充分发挥计算机的计算能力

## worker 是什么

Web Worker 的作用，就是为 JavaScript 创造多线程环境，允许主线程创建 Worker 线程，将一些任务分配给后者运行。在主线程运行的同时，Worker 线程在后台运行，两者互不干扰。等到 Worker 线程完成计算任务，再把结果返回给主线程。这样的好处是，一些计算密集型或高延迟的任务，被 Worker 线程负担了，主线程（通常负责 UI 交互）就会很流畅，不会被阻塞或拖慢。

Worker 线程一旦新建成功，就会始终运行，不会被主线程上的活动（比如用户点击按钮、提交表单）打断。这样有利于随时响应主线程的通信。但是，这也造成了 Worker 比较耗费资源，不应该过度使用，而且一旦使用完毕，就应该关闭

## worker 的方法

```plain
var worker = new Worker('work.js');
```

1. **worker.postMessage() 子线程与主线程通信方式，可以向主线程推送消息**

1. **worker.onmessage()定监听函数，接收子线程发回来的消息**

1. **worker.terminate() 关闭线程方式， 线程用完或者，不需要 可以直接关闭线程，防止资源浪费**

1. **postMessage() 或 self.postMessage() 向主线程推送消息，主线程用 onmessage 接收**

## **worker 如何使用**

**下面是在 react 里面的用法，基本上别的也都大差不差**

1. **首先创建一个 worler.js， 内容为**

```plain
const workercode = () => {
  self.onmessage = (e)=>{
   
  }
};
// 把脚本代码转为string
let code = workercode.toString();
code = code.substring(code.indexOf("{")+1, code.lastIndexOf("}"));
 
const blob = new Blob([code], {type: "application/javascript"});
const worker_script = URL.createObjectURL(blob);
 
module.exports = worker_script;
```

**self.onmessage 方法里面可以写你自己想写的业务逻辑，比如你想把哪些代码新开一个线程，就写进来，也可以发起请求等, 通过 postMessage 想调用的主线程传参数**

**注意:**

**看代码里面出现了一个 self，有可能会很疑惑，我并没有定义这个 self，代码运行起来不会出现报错无法运行吗？**

**这里是不会出现报错或者代码运行不起来的，因为在 worker 里面，是没有 window 全局实例的，this 也没有，使用 this 在本地可以，打包之后就找不到 this 了(自己测试出现的情况);**

**所以在 worker 里面 self 才是他的全局对象**

**如果出现 self 报错，代码无法运行的情况或者出现一下情况**

![图片](/content/assets/images/javascript-worker-1-986f5371.png)
**这个时候代码是会报错的**

**解决办法：**

因为这个是 eslint 规则报的错误，本人目前也是直接先给禁用掉了，在代码前加上这句话

// eslint-disable-next-line no-restricted-globals

1. **在主线程使用 worker(主线程是指，你的业务代码，或者你那里需要用的时候)**

首先引入然后 new 实例化

import worker_script from './worker';

var myWorker = new Worker(worker_script);

![图片](/content/assets/images/javascript-worker-2-35ab7130.png)
我这里是在我 APP.js 里面使用 worker 的，就相当于主线程

然后通过

![图片](/content/assets/images/javascript-worker-3-b0dc285a.png)

通过 myWorker.postMessage()方法来调用子线程,可以传入你想传入的参数

这个时候子线程 worker.js 里就可以拿到你传入的值了

![图片](/content/assets/images/javascript-worker-4-5cbd840e.png)

然后做完你想做的处理通过 postMessage()在给主线程返回过去，这个返回不返回都行，看你自己的业务

主线程通过 onmessage 来实时获取到子线程那边返回过来的值

```plain
  myWorker.onmessage = (e) => {

  };
```

示例:

![图片](/content/assets/images/javascript-worker-5-4c4d0f16.png)
