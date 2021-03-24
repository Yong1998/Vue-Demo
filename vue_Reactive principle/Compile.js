/*
 * @Author: zwy007
 * @Date: 2021-03-24 14:05:57
 * @LastEditors: zwy007
 * @Description: 页面描述：解析指令
 */


/**
 * 解析工具类
 */
const compileUtil = {

    /**
     * 获取key对应值再vm.$data中的值
     * @param {*} key -> msg person.name
     * @param {*} vm 
     */
    getValue(key, vm) {
        // 使用累加方法 -- 每次循环返回的值作为下一次循环的初始值，通过这样的方式获取最里层属性的值
        return key.trim().split('.').reduce((data, currentVal) => {
            //console.log(currentVal);
            return data[currentVal]
        }, vm.$data)
    },

    /**
     * 给对应数据设置相应的值
     * @param {*} key 
     * @param {*} vm 
     * @param {*} inputVal 
     */
     setValue(key, vm, inputVal) {
        return key.split('.').reduce((data, currnetVal) => {
            data[currnetVal] = inputVal
        }, vm.$data)
    },


    /**
     * 获取{{}}里面的值
     * @param {*} key 
     * @param {*} vm 
     * @returns 
     */
     getContentVal(key, vm) {
        return key.replace(/\{\{(.+?)\}\}/g, (...args) => {
            return this.getValue(args[1].trim(), vm)
        })
    },



    text(node, key, vm) {
        let value
        if (key.indexOf('{{') !== -1) {
            // 传入的key为差值表达式
            // 使用replace方法 参数1正则表达式, 参数2函数 -> (参数1, 参数2，...) => {}
            //                                              参数1->包含正则每次匹配的文本 {{person.name}}
            //                                              参数2->不包含正则每次匹配的文本 person.name
            //                                              参数3->开始匹配的索引
            //                                              .....
            value = key.replace(/\{\{(.+?)\}\}/g, (...args) => {
                new Watcher(vm, args[1], (newVal) => {
                    // 绑定观察者，将来数据发生变化，触发回调进行更新
                    this.updata.textUpdata(node, this.getContentVal(key, vm))
                })
                return this.getValue(args[1].trim(), vm)
            })
        } else {
            value = this.getValue(key, vm)     // 获取data上对应key的属性值
              // v-text 的情况
              new Watcher(vm, key, (newVal) => {
                this.updata.textUpdata(node, newVal)
            })
        }
        this.updata.textUpdata(node, value)
    },

    html(node, key, vm) {
        const value = this.getValue(key, vm)
        new Watcher(vm, key, (newVal) => {
            this.updata.htmlUpdata(node, newVal)
        })
        this.updata.htmlUpdata(node, value)
    },

    model(node, key, vm) {
        const value = this.getValue(key, vm)
        // 数据 => 视图
        new Watcher(vm, key, (newVal) => {
            this.updata.modelUpdata(node, newVal)
        })
        // 视图 => 数据 => 视图
        node.addEventListener('input', (e) => {
            this.setValue(key, vm, e.target.value)
        })
        this.updata.modelUpdata(node, value)
    },

    on(node, key, vm, eventName) {
        if(!key) return
        let fn = vm.$options.methods && vm.$options.methods[key]            // 获取methods上定义的函数
        node.addEventListener(eventName, fn.bind(vm))                       // 将函数指向vm实例
    },

    bind(node, key, vm, colonName) {
        const value = this.getValue(key, vm)
        node[colonName] = value
    },


    // 更新函数
    updata: {
        textUpdata(node, value) {
            node.textContent = value
        },
        htmlUpdata(node, value) {
            node.innerHTML = value
        },
        modelUpdata(node, value) {
            node.value = value
        }
    }

}

/**
 * 解析指令实例
 */
class Compile {
    constructor(el, vm) {
        this.vm = vm
        this.compile(el)
    }


    compile(node) {
        // 获取当前节点下所有子节点
        const childNodes = node.childNodes
        childNodes.forEach(child => {
            if (this.isElementNode(child)) {
                //console.log('当前是元素节点：', child)
                this.compileElement(child)
            } else if (this.isTextNode(child)) {
                //console.log('当前是文本节点：', child)
                this.compileText(child)
            }

            // 递归遍历-获取嵌套下的所有子节点
            if (child.childNodes && child.childNodes.length) {
                this.compile(child)
            }
        })
    }

    /**
     * 解析元素节点上的指令 v-text v-html v-model v-on:click
     * @param {*} node 
     */
    compileElement(node) {
        // 获取元素节点上的所有属性
        const attrs = Array.from(node.attributes)
        attrs.forEach(attr => {
            const attrValue = attr.nodeValue    // 属性值 -> v-text="msg" -> msg
            const attrName = attr.nodeName      // 属性名 -> v-text="msg" -> v-text
            if (this.isDirective(attrName)) {
                const [, directive] = attrName.split('-')           // 截取v-后面的属性名
                const [dirName, eventName] = directive.split(':')   // 如果存在:, 则截取dirName为属性名 eventName为事件名
                // 数据驱动更新视图
                compileUtil[dirName](node, attrValue, this.vm, eventName)
                // 删除:指令属性
                node.removeAttribute(attrName)
            } else if (this.isEventDirective(attrName)) {
                // @ 指令
                const [, eventName] = attrName.split('@')
                // 数据驱动更新视图
                compileUtil['on'](node, attrValue, this.vm, eventName)
                // 删除:指令属性
                node.removeAttribute(attrName)
            } else if (this.isColonName(attrName)) {
                // : 指令 或者 bind: 指令
                const [, colonName] = attrName.split(':')
                // 数据驱动更新视图
                compileUtil['bind'](node, attrValue, this.vm, colonName)
                // 删除:指令属性
                node.removeAttribute(attrName)
            }
        })
    }

    /**
     * 解析文本节点上差值表达式 {{ person.name }} {{ msg }}
     * @param {*} node 
     */
    compileText(node) {
        const content = node.textContent
        const reg = /\{\{(.+?)\}\}/g // 匹配{{}}
        if (reg.test(content)) {
            // 数据驱动更新视图
            compileUtil['text'](node, content, this.vm)
        }
        
    }

    /**
     * 判断是否是元素节点 -> == 1
     * @param {*} node 
     * @returns 
     */
    isElementNode(node) {
        return node.nodeType === 1
    }

    /**
     * 判断是否是文本节点 -> == 3
     * @param {*} node 
     * @returns 
     */
    isTextNode(node) {
        return node.nodeType === 3
    }

    /**
     * 判断是否是v-指令属性
     * @param {*} attrName 
     * @returns 
     */
    isDirective(attrName) {
        return attrName.startsWith('v-')
    }

    /**
     * 判断是否是 @ 指令
     * @param {*} attrName 
     */
    isEventDirective(attrName) {
        return attrName.startsWith('@')
    }

    /**
     * 判断是否是 : 指令 或者 bind: 指令
     * @param {*} attrName 
     * @returns 
     */
    isColonName(attrName) {
        return attrName.startsWith('bind') || attrName.startsWith(':')
    }
   

}
