declare module "yoffee" {

    /**
     * Returns a `DocumentFragment` that has a one-way binding to each of the objects.
     * @param {...Object} propsObjects Holds the state of this yoffee element
     * @return a document fragment
     */
    function html(...propsObjects: object[]): any; 

    /**
     * 
     * @param elementName a name for this html web component element
     * @param element an arbitrary `Function`, or a (child of) `YoffeeElement`
     * @throws an error if the second parameter isn't either a `YoffeeElement` subclass or a `Function`
     */
    function createYoffeeElement(elementName: string, element: Function | YoffeeElement): void;
    
    /**
     * @type {YoffeeElement}
     */
    class YoffeeElement {
        constructor(state: object);
        updateProp(attr: object): void;
        disconnectedCallback(): void
    
        /**
         * / This is here for when users call `super.connectedCallback()`. Prevent the crash :)
         */
        connectedCallback(): void
    
        /**
         * This is here for when users call `super.propUpdatedCallback()`. Prevent the crash. :(
         */
        propUpdatedCallback(): void;
    }
}
