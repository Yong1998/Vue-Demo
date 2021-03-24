/*
 * @Author: zwy007
 * @Date: 2021-03-24 11:30:57
 * @LastEditors: zwy007
 * @Description: 页面描述：劫持监听所有属性
 */

class Observer {
    constructor(data, vm) {
        // 劫持所有属性
        this.observe(data)
    }
    /**
     * 对象遍历时，每一次的遍历都调用一次defineReactive函数，形成多个独立函数作用域
     * 在每一个独立的函数作用域 set 和 get 的联动都是独立的value值
     */

    observe(data) {
        // 当前只遍历对象--数组后续再添加
        if (typeof data === 'object') {
            Object.keys(data).forEach(key => {
                this.defineReactive(data, key, data[key])
            })
        }
    }

    defineReactive(obj, key, value) {
        // 深度遍历-劫持对象下的属性
        this.observe(value)
        // 每个属性都实例化dep
        const dep = new Dep()
        // 劫持数据
        Object.defineProperty(obj, key, {
            enumerable: true,
            configurable: true,
            get: () => {
                // 往dep添加观察者实例 -- 此时每个dep都存在watcher
                Dep.target && dep.addSub(Dep.target)
                return value
            },
            set: (newVal) => { 
                // 判断是否是一致
                if (newVal === value) {
                    return
                }
                // 每次数据发生改变再次劫持属性
                this.observe(newVal)
                // 赋值
                value = newVal
                // 订阅者通知观察者发生变化 - 观察者调用更新函数
                dep.notify()
            }
        })
    }
}
