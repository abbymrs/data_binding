class Cvue {
    constructor(options) {
        this.$options = options;
        this._data = options.data;
        this.observer(this._data);
        this.compile(options.el);
    }
    compile(el) {
        const element = document.querySelector(el);
        this.compileNode(element);
    }
    observer(data) {
        Object.keys(data).forEach(key => {
            let value = data[key];
            const dep = new Dep();
            Object.defineProperty(data, key, {
                configurable: true,
                enumerable: true,
                get() {
                    if (Dep.target) {
                        dep.addSub(Dep.target);
                    }
                    return value;
                },
                set(newValue) {
                    dep.notify(newValue);
                    value = newValue;
                }
            });
        });
    }
    compileNode(element) {
        const childNodes = element.childNodes;
        [...childNodes].forEach(node => {
            if (node.nodeType == 3) {
                let nodeContent = node.textContent;
                const reg = /(\{\{\s*(\S*?)\s*\}\})+/;
                let oldValue = {};
                while (reg.test(nodeContent)) {
                    nodeContent = nodeContent.replace(reg, (matched, p1, p2)=>{
                        oldValue[p2] = this._data[p2];
                        return this._data[p2];
                    });
                }
                node.textContent = nodeContent;
                new Watcher(this, RegExp.$2, newValue => {
                    for(let key in this._data){
                        setTimeout(_=>{
                            if(RegExp.$2 == key){
                                while(new RegExp(oldValue[key]).test(nodeContent)){
                                    nodeContent = nodeContent.replace(oldValue[key], newValue)
                                }
                                node.textContent = nodeContent;
                            }
                        })
                    }
                });
            } else if (node.nodeType == 1) {
                const attrs = node.attributes;
                [...attrs].forEach(attr => {
                    let attrName = attr.name;
                    const attrValue = attr.value;
                    if (attrName.indexOf("k-") === 0) {
                        attrName = attrName.substr(2);
                        if (attrName === "model") {
                            node.value = this._data[attrValue];
                        }
                        node.addEventListener("input", e => {
                            this._data[attrValue] = e.target.value;
                        });
                        new Watcher(this, attrValue, newValue => {
                            node.value = newValue;
                        });
                    }
                });
            }
            if (node.childNodes.length > 0) {
                this.compileNode(node);
            }
        });
    }
}
class Dep {
    constructor() {
        this.subs = [];
    }
    addSub(sub) {
        this.subs.push(sub);
    }
    notify(newValue) {
        this.subs.forEach(v => {
            v.update(newValue);
        });
    }
}
class Watcher {
    constructor(cv, exp, cb) {
        Dep.target = this;
        cv._data[exp];
        this.cb = cb;
        Dep.target = null;
    }
    update(newValue) {
        this.cb(newValue);
    }
}