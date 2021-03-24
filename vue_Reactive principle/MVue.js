/*
 * @Author: zwy007
 * @Date: 2021-03-24 11:03:04
 * @LastEditors: zwy007
 * @Description: 页面描述：响应式入口文件-MVue对象
 */

class MVue {
    constructor(options) {
        this.$options = options || {}
        this.$data = options.data() || {}
        this.$el = typeof options.el === 'string' ? document.querySelector(options.el) : options.el
        if (this.$el) {
            // 1.实现数据观察者-Observer 监听数据变化-必须放在Compile上面执行 因为必须先劫持数据才能实现数据响应式
            new Observer(this.$data, this)
            // 2.指令解析器Compile-解析指令属性初始化并绑定观察者
            new Compile(this.$el, this)
            // 3.实现this指向data代理-通过defindProperty劫持每个属性并指向this
            this._proxyData(this.$data)
        }
    }
    _proxyData(data) {
        // 遍历对象 将对象内的每个属性(为对象属性的则不会绑定)都进行数据劫持并绑定在MVue实例上
        Object.keys(data).forEach(key => {
            Object.defineProperty(this, key, {
                enumerable: true,   // 描述属性是否会出现在for in 或者 Object.keys()的遍历中
                configrable: true, // 描述属性是否配置，以及可否删除
                get: () => {
                    return data[key]
                },
                set: (newVal) => {
                    if (newVal === data[key]) {
                        return
                    }
                    data[key] = newVal
                }
            })
        })
        
    }
}