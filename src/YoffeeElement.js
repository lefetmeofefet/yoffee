// Simple class to achieve React-like behaviour, while using web standards and Yoffee.js.
// Technologies: CustomElements, ShadowRoot, MutationObserver, Attributes.
class YoffeeElement extends HTMLElement {
    updateProp (attr) {
        // There are two cases:
        // 1. We are updating a regular attribute (a=3)
        // 2. We are updating an object prop/attribute (a={something: 3}) that yoffee created. Attributes can't be
        //    objects, so when an attribute is set with an object, yoffee sets the attribute to "__obj_placeholder__"
        //    and sets a property on the element with the actual value.
        let attrValue = (this[attr] === undefined ? this.getAttribute(attr) : this[attr]);
        if (attrValue === "") {
            this.props[attr] = true // When attribute values are not specified, they're true. Example: <div hidden></div>
        } else {
            this.props[attr] = attrValue
        }
    };

    constructor(state) {
        super();
        // Yoffee can add 'props' property when element is not yet initialized, and we need to remember them.
        this.props = this.props || {};
        this.state = state || {};

        // Put current attributes into props
        [...this.attributes].forEach(attr => this.updateProp(attr.name));

        // Observe the custom element for attribute changes using MutationObserver, and update the props
        // Note: "attributeChangedCallback" is not good enough because it requires a static "observedAttributes", and
        // we don't ask the user to declare his props beforehand
        const addProp = mutationsList => mutationsList.forEach(mutation => {
            this.updateProp(mutation.attributeName);
            this.propUpdatedCallback && this.propUpdatedCallback(mutation.attributeName)
        });
        new MutationObserver(addProp).observe(this, {attributes: true});

        // Add shadow DOM
        this.attachShadow({mode: 'open'});

        // Create yoffee template and append to custom element
        this._yoffeeFragment = this.render();
        this.shadowRoot.appendChild(this._yoffeeFragment)
    }

    disconnectedCallback() {
        this._yoffeeFragment.__removeWatchers()
    }

    connectedCallback() {
        // This is here for when users call `super.connectedCallback()`. Prevent the crash :)
    }

    propUpdatedCallback(prop) {
        // This is here for when users call `super.propUpdatedCallback()`. Prevent the crash. :(
    }
}

function createYoffeeElement(elementName, element) {
    if (element.prototype instanceof YoffeeElement) {
        // If we get a YoffeeElement, we just define it
        customElements.define(elementName, element);
    } else if (element instanceof Function) {
        // If we get a cb, we wrap it with YoffeeElement
        customElements.define(elementName, class extends YoffeeElement {
            render() {
                return element(
                    this.props,
                    this
                )
            }

            propUpdatedCallback(prop) {
                super.propUpdatedCallback(prop)
                this.onPropUpdate && this.onPropUpdate(prop)
            }

            connectedCallback() {
                super.connectedCallback()
                this.onConnect && this.onConnect()
            }

            disconnectedCallback() {
                super.disconnectedCallback();
                this.onDisconnect && this.onDisconnect()
            }
        })
    } else {
        throw `YOFFEE: \`createYoffeeElement\` second parameter must be either a YoffeeElement subclass or a function, Got ${typeof renderCb}`
    }
}

export {YoffeeElement, createYoffeeElement};
