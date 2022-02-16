declare module "yoffee" {
    /**
     * Returns a `DocumentFragment` that has a one-way binding to each of the objects.
     * @param {object} propsObjects Objects which are used in the expressions inside the html for updating the html.
     * @returns {(strings: string[], ...expressionCbs: Function[]) => DocumentFragment} html bound to `propsObjects` as a DocumentFragment.
     */
    function html(...propsObjects: object[]): (strings: TemplateStringsArray, ...expressionCbs: Function[]) => DocumentFragment;

    interface YoffeeElementWrapper extends YoffeeElement {
        /**
         * Called each time a property is updated. Attributes are converted to properties, so it is also called when an attribute changes.
         * @param {string} prop The property that changed. Value can be accessed with `props[prop]`
         */
        onPropUpdate: (prop: string) => void

        /**
         * Called when the element is connected to the DOM after the element is created
         */
        onConnect: Function

        /**
         * Called when the element is disconnected from the DOM.
         */
        onDisconnect: Function
    }

    /**
     * Creates a new Yoffee element, as a custom web component - a new html tag.
     * @param elementName The new elements' name. Must include comma.
     * @param element Declaration of the element: Either a callback function that returns the html, or a `YoffeeElement`
     */
    function createYoffeeElement(
        elementName: string,
        element: ((props: object, element: YoffeeElementWrapper) => DocumentFragment) | YoffeeElement
    ): void;

    /**
     * @type {YoffeeElement}
     */
    class YoffeeElement extends HTMLElement {
        /**
         * The shadow root of the element, containing all the html.
         * @type {ShadowRoot}
         */
        shadowRoot: ShadowRoot

        /**
         * Constructor of YoffeeElement. Receives initial `state`.
         * @param {object} state The initial state object of the element
         */
        constructor(state: object);

        updateProp(attr: object): void;

        /**
         * Called when the element is disconnected from the DOM.
         */
        disconnectedCallback(): void

        /**
         * Called when the element is connected to the DOM after the element is created
         */
        connectedCallback(): void

        /**
         * Called each time a property is updated. Attributes are converted to properties, so it is also called when an attribute changes.
         * @param {string} prop The property that changed. Value can be accessed with `props[prop]`
         */
        propUpdatedCallback(prop): void;
    }
}
