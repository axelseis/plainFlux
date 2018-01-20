import { state, dispatch } from './store.js';
import { isDOMElement, isString } from './utils.js'
import Component from "./Component.js"

export default class StringTplComponent  extends Component{
    render() {
        return `${this.constructor.name} :( This is because I'm a StringTplComponent with no render()`;
    }

    renderTemplate($domElement, templateStr) {
        if(!$domElement || !isDOMElement($domElement)){
            throw new TypeError(`${this.type}: renderTemplate requires a DOMElement and you passed [${$domElement}]`)
        }
        if(!templateStr || !isString(templateStr)){
            throw new TypeError(`${this.type}: renderTemplate requires a string and you passed [${$domElement}]`)
        }
        if($domElement.innerHTML.toLowerCase() === templateStr){
            console.warn(
                `${this.type}: the updated DOM provided to renderTemplate is equal than 
                actual DOM, maybe your stateToProps function is not well optimized`
            )
            return false;
        }
        if(!$domElement.children.length){
            $domElement.innerHTML = templateStr;
        }
        else{
            const tempDom = document.createElement('div');
            tempDom.innerHTML = templateStr;

            this._mergeDomElements($domElement, tempDom);
        }
        this._setDomEvents($domElement);
    }

    _mergeDomElements(oldDom,newDom) {
        const newDomChildren = Array.from(newDom.children);
        const oldDomChildren = Array.from(oldDom.children);
        
        newDomChildren.forEach((element, index) => {
            const oldElement = oldDomChildren[index];
            if (!oldElement) {
                oldDom.appendChild(element.cloneNode(true));
            }
            else if (element.nodeName !== oldElement.nodeName) {
                oldElement.outerHTML = element.outerHTML
            }
            else if(element.outerHTML !== oldElement.outerHTML){
                if (element.value !== oldElement.value) {
                    oldElement.value = element.value;
                }
                if (element.children.length) {
                    this._mergeDomElements(oldElement,element)
                }
                if (element.innerHTML !== oldElement.innerHTML) {
                    oldElement.innerHTML = element.innerHTML;
                    
                }
                Array.from(element.attributes).forEach(attr => {
                    const oldAttr = oldElement.getAttribute(attr.name);
                    if (!oldAttr || oldAttr !== attr.value) {
                        oldElement.setAttribute(attr.name, attr.value);
                    }
                })
            }
        })
        for (let iD = oldDomChildren.length-1; iD >= newDomChildren.length; iD--) {
            oldDom.removeChild(oldDomChildren[iD]);
        }
    }
}

