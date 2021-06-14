import {SearchLocations} from "./domNodeFinder.js";
import {fillStrWithExpressions, getLongestSubsequence} from "./utils.js";

class BoundNode {
    /**
     * A single HTML node, containing all that's needed
     * @param {[Expression]} expressions
     * @param {HTMLElement} domNode
     * @param {String} expressionsLocation
     */
    constructor(expressions, domNode, expressionsLocation) {
        this.expressions = expressions;
        this.domNode = domNode;
        this.expressionsLocation = expressionsLocation;
        this._arrayDomNodes = [];

        /** @type String */
        this.initialValue = {
            // TextNode content
            [SearchLocations.TEXT_NODE]: () => domNode.data,
            // Attribute value
            [SearchLocations.ATTR_VALUE]: () => domNode.value,
            // Attribute name
            [SearchLocations.ATTR_NAME]: () => domNode.name,
        }[expressionsLocation]();
        this.ownerElement = this.domNode.ownerElement
    }

    update() {
        if (this.expressionsLocation === SearchLocations.TEXT_NODE) {
            this._updateTextNodeValue()
        } else if (this.expressionsLocation === SearchLocations.ATTR_VALUE) {
            this._updateAttributeNodeValue()
        } else if (this.expressionsLocation === SearchLocations.ATTR_NAME) {
            this._updateAttributeNodeName()
        }
    }

    _updateTextNodeValue() {
        // Text nodes will always have one expression only, because we break up text node into smaller ones
        let expression = this.expressions[0];

        // Do not modify node with cached expression
        if (expression.cached) {
            return;
        }

        let newValue = expression.lastResult;

        if (newValue == null || newValue === false) {
            newValue = ""
        }

        // Remove old array
        if (this._lastTextNodeValue instanceof Array && !(newValue instanceof Array)) {
            // TODO: Keyed logic for performance: dont delete all, only changed keys
            // Delete old array, make domNode the last remaining value
            for (let domNodeToRemove of this._arrayDomNodes) {
                this._removeDomNode(domNodeToRemove);
            }
            this._arrayDomNodes = [];
        }

        // Unpack documentFragment
        if (newValue instanceof DocumentFragment) {
            if (newValue.childNodes.length === 0) {
                newValue = "";
            } else if (newValue.childNodes.length === 1) {
                newValue = newValue.firstChild;
            } else {
                newValue = [...newValue.childNodes];
            }
        }

        // Insert new array
        if (newValue instanceof Array) {
            // Create location marker if there isn't
            if (!(this._lastTextNodeValue instanceof Array)) {
                let listLocationMarker = document.createElement("htmel-list-location-marker");
                this.domNode.replaceWith(listLocationMarker);
                this.domNode = listLocationMarker;
            }

            // We need to apply DOM diffing algorithm.

            // TODO: REVIVE SMART ALGORITHM...!
            // // Remember order of new elements
            // let elementToIndex = new Map();
            // for (let i = 0; i < newValue.length; i++) {
            //     let newArrayElement = typeof newValue[i] === "number" ? newValue[i].toString() : newValue[i];
            //     elementToIndex.set(newArrayElement, i)
            // }
            //
            // // Delete old elements which are not in new element list
            // let elementsOrder = [];
            // this._arrayDomNodes = this._arrayDomNodes.filter(existingDomNode => {
            //     // Text nodes should be checked by their content equality and not reference equality
            //     let elementToCheck = existingDomNode instanceof Text ? existingDomNode.data : existingDomNode;
            //
            //     // Checking if existingDomNode is also in the new list
            //     if (elementToIndex.has(elementToCheck)) {
            //         elementsOrder.push(elementToIndex.get(elementToCheck));
            //         return true;
            //     }
            //
            //     // If not, we destroy it.
            //     this._removeDomNode(existingDomNode);
            // });
            //
            // // Find longest subsequence of elements which we will keep in DOM for performance
            // let cachedIndicesInNewList = getLongestSubsequence(elementsOrder).map(index => elementsOrder[index]);
            // let cachedElementsInNewList = cachedIndicesInNewList.map(i => typeof newValue[i] === "number" ? newValue[i].toString() : newValue[i])
            //
            // // Remove old elements from dom which aren't ordered (later we insert them at the right index)
            // this._arrayDomNodes = this._arrayDomNodes.filter((existingDomNode, index) => {
            //     let elementToCheck = existingDomNode instanceof Text ? existingDomNode.data : existingDomNode;
            //     if (!cachedElementsInNewList.includes(elementToCheck)) {
            //         this._removeDomNode(existingDomNode);
            //         return false
            //     }
            //     return true
            // });
            //
            // // Now we insert all new elements except those that already exist in remainingOldIndices
            // let indexOfNextRemaining = 0;
            // let nextRemainingElement = this._arrayDomNodes[0];
            // let nextArrayDomNodes = [];
            // let insert = element => {
            //     if (nextRemainingElement == null) {
            //         this.domNode.parentNode.insertBefore(element, this.domNode)
            //     } else {
            //         this.domNode.parentNode.insertBefore(element, nextRemainingElement)
            //     }
            // }
            //
            // for (let i = 0; i < newValue.length; i++) {
            //     if (i === cachedIndicesInNewList[indexOfNextRemaining]) {
            //         nextArrayDomNodes.push(this._arrayDomNodes[indexOfNextRemaining]);
            //         if (indexOfNextRemaining < cachedIndicesInNewList.length) {
            //             indexOfNextRemaining += 1;
            //             nextRemainingElement = this._arrayDomNodes[indexOfNextRemaining];
            //         }
            //     } else {
            //         let arrayValue = newValue[i];
            //         arrayValue = typeof arrayValue === "object" ? arrayValue : document.createTextNode(arrayValue)
            //         nextArrayDomNodes.push(arrayValue);
            //
            //         if (arrayValue.__isHtmel) {
            //             for (let childNode of arrayValue.__childNodes) {
            //                 insert(childNode);
            //             }
            //         } else {
            //             insert(arrayValue);
            //         }
            //     }
            // }
            // this._arrayDomNodes = nextArrayDomNodes;

            let newArrayDomNodes = [];
            let currentElement = null;
            let insert = element => {
                // If the first element is inserted before cached elements, it should be inserted before the first old
                // element in the list. If there are none, it would be just inserted before the list marker
                if (currentElement == null) {
                    if (this._arrayDomNodes[0] == null) {
                        this.domNode.parentNode.insertBefore(element, this.domNode)
                    } else {
                        this.domNode.parentNode.insertBefore(
                            element,
                            (this._arrayDomNodes[0].__isHtmel ? this._arrayDomNodes[0].__childNodes[0] : this._arrayDomNodes[0])
                        )
                    }
                } else {
                    // Here we insert element in the middle of the list, after currentElement
                    this.domNode.parentNode.insertBefore(
                        element,
                        currentElement.nextSibling
                    )
                }
                currentElement = element.__isHtmel ? element.__childNodes[element.__childNodes.length - 1] : element;
            }

            for (let newElement of newValue) {
                if (newElement == null) {
                    continue
                }

                let oldElement = this._arrayDomNodes[0];
                if (oldElement != null &&
                    (oldElement instanceof Text ? oldElement.data : oldElement) ===
                    (typeof newElement === "number" ? newElement.toString() : newElement)
                ) {
                    newArrayDomNodes.push(oldElement);
                    currentElement = oldElement.__isHtmel ?
                        oldElement.__childNodes[oldElement.__childNodes.length - 1] : oldElement;
                    this._arrayDomNodes.shift();
                } else {
                    newElement = typeof newElement === "object" ? newElement : document.createTextNode(newElement)
                    newArrayDomNodes.push(newElement);

                    if (newElement.__isHtmel) {
                        // The reason we keep htmel documentFragments in _arrayDomNodes is because of caching
                        for (let childNode of newElement.__childNodes) {
                            insert(childNode);
                        }
                    } else if (newElement instanceof Array) {
                        // TODO: Why not, actually???????????????????????????????????
                        throw "YOFFEE: List item cannot be another list"
                    } else {
                        insert(newElement);
                    }
                }
            }

            for (let oldDomNode of this._arrayDomNodes) {
                if (newArrayDomNodes.indexOf(oldDomNode) === -1) {
                    this._removeDomNode(oldDomNode);
                }
            }

            this._arrayDomNodes = newArrayDomNodes;
        } else if (typeof newValue === "object") {
            // Either element or object. If object, wat do we do??
            // TODO: WAT DO WE DO?
            if (!(newValue instanceof Node)) {
                throw "YOFFEE: Expression value can't be a regular JS object!"
            }
            this.domNode.replaceWith(newValue);
            this.domNode = newValue;
        } else {
            // TODO: If value is same as last, don't replace. just let it beef
            if (typeof this._lastTextNodeValue === "object") {
                // Replace old object/list with string
                let newTextNode = document.createTextNode(newValue);
                this.domNode.replaceWith(newTextNode);
                this.domNode = newTextNode;
            } else {
                // If just string
                if (this.domNode.data !== newValue.toString()) {
                    this.domNode.data = newValue;
                }
            }
        }

        this._lastTextNodeValue = newValue;
    }

    _removeDomNode(domNode) {
        // If domNode is __isHtmel, kill all children because it's a DocumentFragment. Note: checking for
        // DocumentFragments would be wrong, because we never store DocumentFragments which aren't htmel
        // template in `this._arrayDomNodes`.
        if (domNode.__isHtmel) {
            for (let childNode of domNode.__childNodes) {
                childNode.remove();
            }
        } else {
            domNode.remove()
        }
    }

    _updateAttributeNodeValue() {
        // Checks if expression is an event handler, and adds an event listener if true.
        if (this.expressions[0].isEventHandler) {
            if (this.expressions.length > 1) {
                let forbiddenEventHandlerText = fillStrWithExpressions(this.initialValue, this.expressions);
                throw `YOFFEE: Cant have more than one expression as event handler: ${forbiddenEventHandlerText}`
            }
            this._setEventListener();
        } else {
            let lastResult = this.expressions[0].lastResult;
            let isJustExpression = this.expressions.length === 1 && this.initialValue.length === this.expressions[0].id.length;

            if (isJustExpression && (lastResult === false || lastResult == null)) {
                // If value is falsy, remove the attribute
                this.ownerElement[this.domNode.name] = undefined;
                this.ownerElement.removeAttribute(this.domNode.name);
            } else if (isJustExpression && ["function", "object"].includes(typeof lastResult)) {
                // if attr value is function or object, set it directly on the element instead of attribute because
                // attributes can only hold strings

                // Has to be done before setDomNode
                this.ownerElement[this.domNode.name] = lastResult;

                this._setDomNode("__obj_placeholder__");
            } else if (isJustExpression && lastResult === true) {
                // If we get true, just set the attribute with no value (<div a></div>)
                this.ownerElement[this.domNode.name] = undefined;
                this._setDomNode("");
            } else {

                // Has to be done before setDomNode
                this.ownerElement[this.domNode.name] = undefined;

                // If string, replaces ids with expression values
                let newValue = this.initialValue;
                for (let expression of this.expressions) {
                    newValue = newValue.replace(expression.id, expression.lastResult)
                }
                this._setDomNode(newValue);
            }
        }
    }

    _setDomNode(value) {
        this.domNode.value = value;
        if (this.domNode.ownerElement == null) {
            this.ownerElement.setAttributeNode(this.domNode)
        }
    }

    _updateAttributeNodeName() {
        let lastResult = this.expressions[0].lastResult;
        let isJustExpression = this.expressions.length === 1 && this.initialValue.length === this.expressions[0].id.length;

        if (this._lastAttributeMap) {
            // Removes last attribute mapping if there was
            // TODO: Dont remove all, replace only different ones...
            for (let [attrName, _] of this._lastAttributeMap) {
                this.ownerElement.removeAttribute(attrName);
                this.ownerElement[attrName] = undefined;
            }
            this._lastAttributeMap = null
        } else {
            // Removes last attribute
            // TODO: Dont remove if they're same
            this.ownerElement.removeAttribute(this.domNode.name)
        }

        if (isJustExpression && (lastResult === false || lastResult == null || lastResult === "")) {
            // Don't add any attribute if value is falsy
            return
        }

        if (isJustExpression && typeof lastResult === "object") {
            // If we get an object, insert it as key-value mapping of attributes
            this._lastAttributeMap = Object.entries(lastResult)
            for (let [attrName, value] of this._lastAttributeMap) {
                if (value !== false && value !== null) {
                    if (["function", "object"].includes(typeof value)) {
                        this.ownerElement.setAttribute(attrName, "__obj_placeholder__");
                        this.ownerElement[attrName] = value
                    } else {
                        if (value === true) {
                            value = ""
                        }
                        this.ownerElement.setAttribute(attrName, value);
                    }
                }
            }
        } else {
            // If string, replaces ids with expression values
            let newName = this.initialValue;
            for (let expression of this.expressions) {
                newName = newName.replace(expression.id, expression.lastResult)
            }

            this.ownerElement.setAttribute(newName, this.domNode.value);
            this.domNode = this.ownerElement.getAttributeNode(newName);
        }
    }

    /**
     * Replaces attribute node that starts with "on" with event listener.
     * This will never run twice on the same expression, because no props are linked, because event handler expressions
     * don't evaluate until the event is caught.
     * @private
     */
    _setEventListener() {
        let eventName = this.domNode.name.substring(2); // Remove the `on` from `onclick`

        this.domNode.ownerElement.addEventListener(eventName, (...args) => {
            const result = this.expressions[0].lastResult(...args);

            // In case expression returns another function (user wrote ${() => () => print("stuff)} for example)
            if (typeof result === "function") {
                return result(...args)
            }

            // TODO: If user returned a string (onclick="${() => state.wat ? "alert(1)" : "alert(2)}") we should eval that
            return result
        });
        this.domNode.ownerElement.removeAttributeNode(this.domNode);
    }
}

export {BoundNode}