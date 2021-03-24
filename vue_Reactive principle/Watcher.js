/*
 * @Author: zwy007
 * @Date: 2021-03-24 21:50:22
 * @LastEditors: zwy007
 * @Description: 页面描述：观察者--存储旧值 当订阅通知数据变化-根据旧值和新值比对更新视图
 */

class Watcher {
    constructor(vm, key, cb) {
        this.vm = vm
        this.key = key
        this.cb = cb
        this.oldValue = this.getOldVal()
    }

    getOldVal() {
        Dep.target = this // 将watcher实例绑定在赖收集器的target属性(以此将watcher和dep关联)
        const oldValue = compileUtil.getValue(this.key, this.vm)
        Dep.target = null // 获取初始值完成将target清除
    }

    /**
     * 更新函数-并通过回调将更新值传出
     */
    updata() {
        const newValue = compileUtil.getValue(this.key, this.vm)
        this.cb(newValue)
    }

}