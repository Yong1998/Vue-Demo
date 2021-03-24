/*
 * @Author: zwy007
 * @Date: 2021-03-24 21:45:50
 * @LastEditors: zwy007
 * @Description: 页面描述：依赖收集器-存储watcher
 */

class Dep {
    constructor() {
        this.subs = []
    }

    addSub(watcher) {
        this.subs.push(watcher)
    }

    // 通知观察者去更新-调用观察者的更新函数
    notify() {
        this.subs.forEach(w => w.updata())
    }
}