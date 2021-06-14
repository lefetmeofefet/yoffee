import htmel from "./htmel.js"

// 30 lines to achieve React-like behaviour, while using web standards:
// CustomElements, ShadowRoot, MutationObserver, Attributes.
class HTMElement extends HTMLElement {
    // TODO: Automatically define the custom DOM element
    // static _ = (() => {
    //     // Like static constructor
    //     console.log("WTF: ", this.name, this)
    //     customElements.define("x-" + this.name.toLowerCase(), this)
    // })()

    constructor(state) {
        super();
        // Props and state, like in React
        this.state = state || {};
        this.props = {};

        const updateProp = attr => {
            let attrValue = (this[attr] === undefined ? this.getAttribute(attr) : this[attr]);
            if (attrValue === "") {
                this.props[attr] = true
            } else {
                this.props[attr] = attrValue
            }
        };

        // Put current attributes into props
        [...this.attributes].forEach(attr => updateProp(attr.name));

        // Observe the custom element for attribute changes using MutationObserver, and update the props
        const addProp = mutationsList => mutationsList.forEach(mutation => {
            updateProp(mutation.attributeName);
            this.propUpdated && this.propUpdated(mutation.attributeName)
        });
        new MutationObserver(addProp).observe(this, {attributes: true});

        // Add shadow DOM
        this.attachShadow({mode: 'open'});

        // Create template and append to custom element
        this._htmelFragment = this.render();
        this.shadowRoot.appendChild(this._htmelFragment)
    }

    get html() {
        return htmel
    }

    disconnectedCallback() {
        this._htmelFragment.__removeWatchers()
    }
}

export default HTMElement;
