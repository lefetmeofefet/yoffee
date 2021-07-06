# Technical Explanation
Yoffee.js at its base, is a function that receives state objects and an HTML template, and creates a `DocumentFragment` that is automatically updated when the state object is being mutated.

It's wrapped nicely in a YoffeeElement class, a utility for creating Custom Web Components. YoffeeElement creates a ShadowDOM, maintains props by attributes, provides hooks, and most importantly, provides a concise way of creating yoffee.js elements for the users.

## Lifecycle
Yoffee.js doesn't really have a lifecycle.
It's more of a two stage process:
1. Yoffee template initialization
2. Updates to state, causing rerenders

### Initialization
Yoffee.js function `html` receives a list of state objects and a string template literal, which contains expression callbacks. The workflow: 

0. The state objects's properties are replaced with getters / setters. Yoffee now knows when a property is accessed / set on any state object.
0. We determine whether the yoffee template should be created right now or deferred for possible caching (later on that)
1. Create a DocumentFragment that will represent the yoffee template (it will contain elements, reference listeners, etc.)
2. Create HTML string from the template literal: generate an ID for each expression and replace the expressions in the template with those IDs.
3. Create a HTMLUnknownElement element that contains the previously generated HTML string. It's not connected to the DOM.
4. Bind nodes to expressions: find the DOM nodes that contain the expressions in the HTMLUnknownElement DOM using the previously generated IDs.
   We need the HTMLUnknownElement to search because xpath root has to be an Element (not DocumentFragment)
5. Perform first render: execute each expression while collecting the state object's properties that were accesed inside, and insert the return value
   into the DOM Node where the expression ID was. When the state object's setter is invoked, we check whether the property is bound
   to any expression, and if so, the expression is executed and DOM Node is updated, and new properties are collected on the way again.
6. Move all children of the container element into the DocumentFragment created earlier, and return the fragment.

When executing an expression, we know which props were used in the expression thanks to the watchers we set earlier.

### Updates
A template is created

### Rendering mid-tree
When updating expressions, yoffee keeps track globally of whether we are inside another expression.
oldAlreadyAccessedProps......?
__propsAccessedByFather........??

### Cached templates
....yes........

## YoffeeElement
YoffeeElement provides a way to create Custom Dom Elements with Yoffee.JS at their core.
Subclasses must implement one function: `render`.

### The `render` Function
The render function must return a yoffee template result. Simplest example would be

### Attributes into properties
YoffeeElement has a property `this.props` which contains all the attributes. On initialization
it's populated by all the attributes, and is kept updated by listening to attribute changes using MutationObserver.

Object attributes are converted to "__obj_placeholder__" by yoffee.js, and they are set as a property on the element. 
YoffeeElement reads updates them into `this.props` as well.

### Shadow DOM
YoffeeElement wraps its content with a shadowRoot so CSS doesn't leak and HTML is encapsulated.

### Hooks
* `propUpdatedCallback` Called when an attribute is changed, receives the name of the changed prop
* `connectedCallback` / `disconnectedCallback` Called when the element is attached to the DOM, as per [Custom Dom Elements documentation](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#using_the_lifecycle_callbacks)

### Stateless elements and `createYoffeeElement`
Yoffee has a shortened syntax for creating stateless elements:

```javascript
import {html, createYoffeeElement} from "./YoffeeElement";
createYoffeeElement(
    "element-name", 
    props => html(props)`I AM PROP A! ${() => props.a}`
)
```