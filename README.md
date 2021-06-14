# HTMEL
![npm bundle size](https://img.shields.io/github/size/lefetmeofefet/htmel/dist/htmel.min.js)

Simple, Efficient, Declarative HTML templates with one-way data binding.

_Why should I use this over the likes of react and vue?_
* Faster
* Simpler
* Lighter
* Unopinionated

`htmel` doesn't force you to use webpack or any other bundler - the code runs
 natively in the browser. Try the following time counter example:

```javascript
import htmel from "https://unpkg.com/htmel@latest/dist/htmel.min.js"

let state = {
    age: 1
};

let element = htmel(state)`
<div>
    My age is ${() => state.age} seconds
</div>
`;

document.body.appendChild(element);
setInterval(() => state.age += 1, 1000)
```
Try it live on [JSFiddle](https://jsfiddle.net/Numbnut/6c7ovnuk/2/)

## Installation
**From CDN:** Include the import statement in your script.

```javascript
import htmel from "https://unpkg.com/htmel@latest/dist/htmel.min.js"
```

**From NPM:** `npm install htmel`, Then include in your script:
```javascript
import htmel from "htmel"
```

## Overview
`htmel` lets you write [HTML templates](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) in JavaScript with [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals).
htmel stays as unopinionated as possible by sticking to HTML with no special syntax.

`htmel` provides a single export:
```javascript
let text = "World!"
let element = htmel()`
<div>
    Hello ${text}
</div>
`;
document.body.appendChild(element)
```

`element` is a regular HTML element (More accurately, a [DocumentFragment](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment)) 
that we can insert into the DOM using standard `appendChild`.

#### Data Binding
`htmel` provides a way to update an element by binding it to a state object. 
When a property on the state object changes, `htmel` automatically updates 
only the relevant part of the element:

```javascript
let state = {
    text: "World?"
}

let element = htmel(state)`
<div>
    Hello ${() => state.text}
</div>
`;
state.text = "World!"
```

In the above example, when `state.text` changed, `htmel` 
modified the div's content.

_Notice that we used an arrow function `() => state.text` instead of 
just `state.text`. When using state's properties, always use arrow
functions, otherwise `htmel` won't update the template._

#### Speed
`htmel` is extremely fast. `htmel` saves references to DOM elements, and 
when state changes, it updates only the relevant elements instead of the whole 
root element.

Consider the following code that contains two expressions and some static content:
```javascript
let element = htmel(state)`
<div class=${() => state.class}>
    ${() => state.content}
    <div>Some other irrelevant static content...</div>
</div>
`;
state.class = "classy";
state.content = "a content";
```
First `state.class` was set, and then `state.content`.

Instead of overwriting the whole div twice, `htmel` first updates the property 
`class`, then the textNode `content`. The other irrelevant text didn't change.

#### Faster than React
React revels in its speed by minimizing DOM updates. In order to minimize them, 
React generates a diff between virtual DOMs on each update.
In the above example, React would have created the whole div in memory,
compared the current and new divs, and only updated the diff in the DOM.
Htmel on the other hand keeps a reference to elements in the DOM, with no 
need for the diff process.

## Examples
Text
```javascript
`<div> 
    ${() => state.text} some text between, ${() => state.moreText}
</div>`
```

Conditionals:
```javascript
`
<div>
    ${() => state.a ? "a" : "b"}
    ${() => state.condition && "am i here?"}
</div>
`
```

CSS:
```javascript
`<style> 
    #my-element {
        color: ${() => state.color};
    }
</style>`
```

Events:
```javascript
`<button onclick=${() => state.a+=1}>
    ${() => state.a}
</button>`
```

Attributes:
```javascript
`<div dir=${() => state.dir}>what is my direction?</div>`
```

Attribute name:
```javascript
`<div ${() => state.attrName}>i have some attr</div>`
```

Attribute dict:
```javascript
let state = {
    inputAttrs: {
        dir: "left",
        placeholder: "i am placeholder"
    }
}
htmel()`<input ${() => state.inputAttrs}></input>`
```

Nesting template (HTML element) inside a template:
```javascript
let state = {
    someInsideData: {name: "old name"}
}

let element = htmel(state)`
<div>
    I have other elements inside of me
    ${() => htmel(state.someInsideData)`
        <div>${() => state.someInsideData.name}</div>
    `}
</div>
`;

// Modify prop of inner template
state.someInsideData.name = "new name"

// Modify whole inner template (prop of outer template)
state.someInsideData = {name: "new name"}
```

List of elements:
```javascript
let state = {
    items: [{
        name: "Mojojojo"
    }, {
        name: "harambe"
    }]
};

let element = htmel(state)`
<div>
${() => state.items.map(item => htmel(item)`
    <div>${() => item.name}</div>
`)}
</div>
`;

// Modify prop of specific item
state.items[0].name += "s";

// Modify the whole list
state.items = [{name: "new name"}, {name: "another"}]
```

A single expression can contain multiple properties:
```javascript
`<div>${() => state.a + state.b}</div>`
```

A single dom node can contain multiple expressions - here we see style attribute node:
```javascript
`<div style="color:${() => state.color}; width:${() => state.width}px;">`
```

Multiple states in single `htmel` template:
```javascript
htmel(state1, state2)`
<div>
    ${() => state1.text}
    ${() => state2.text}
</div>
`;
state1.text = "i am text"
state2.text = "i am some other unrelated text"
```

Multiple templates with one state (good for displaying global state):
```javascript
htmel(state)`
<div>text is ${() => state.text}</div>
`
htmel(state)`
<div>${() => state.text} is text</div>
`
;
state.text = "life"
```

Custom DOM Elements example:
```html
<body>
<script type="module">
    import htmel from "https://unpkg.com/htmel@latest/dist/htmel.min.js"

    // 30 lines to achieve React-like behaviour, while using web standards:
    // CustomElements, ShadowRoot, MutationObserver, Attributes.
    class HtmElement extends HTMLElement {
        constructor(state) {
            super();
            // Props and state, like in React
            this.state = state || {};
            this.props = {};

            const updateProp = attr => {
                this.props[attr] = (this[attr] === undefined ? this.getAttribute(attr) : this[attr])
            }

            // Put current attributes into props
            [...this.attributes].forEach(attr => updateProp(attr.name))

            // Observe the custom element for attribute changes using MutationObserver, and update the props
            const addProp = mutationsList => mutationsList.forEach(mutation => updateProp(mutation.attributeName));
            new MutationObserver(addProp).observe(this, {attributes: true});

            // Add shadow DOM
            this.attachShadow({mode: 'open'});

            // Create template and append to custom element
            this.shadowRoot.appendChild(this.render());
        }

        get html() {
            return htmel(this.props, this.state)
        }
    }

    // Define custom element
    customElements.define("my-list-item", class extends HtmElement {
        render() {
            return this.html`
            <button onclick=${() => this.props.clicked()}>
                click me for the ${() => this.props.clicks}th time.
            </button>
            `
        }
    })

    // Define another custom element
    customElements.define("my-custom-element", class extends HtmElement {
        constructor() {
            // Send state to parent
            super({
                items: [
                    {clicks: 0},
                    {clicks: 0}
                ],
                margin: 20
            })
        }

        render() {
            return this.html`
                <style>
                    :host {
                        display: block;
                        margin: ${() => this.state.margin}px;
                    }
                </style>
                <div>
                    ${() => this.state.items.map(item => htmel(item)`
                        <my-list-item
                            clicks=${() => item.clicks}
                            clicked=${() => () => item.clicks += 1}
                            data=${() => item.data}></my-list-item>
                    `)}
                </div>
                <button onclick=${() => this.state.items = [...this.state.items, {clicks: 0}]}>
                    add a button
                </button>
            `
        }
    });
</script>
<my-custom-element></my-custom-element>
</body>
```
Try it live on [JSFiddle](https://jsfiddle.net/Numbnut/cnb84v9h/10/)

Comprehensive features example:
```javascript
import htmel from "https://unpkg.com/htmel@latest/dist/htmel.min.js"

window.state = {
        name: "Inigo Montoystory",
        color: "red",
        age: 3,
        clicks: 1,
        placeholder: "this is hint",
        amAlive: true
    };
    window.innerState = {
        deathColor: "blue"
    };
    window.secondState = {
        age: 10
    }

    let element = htmel(state, secondState)`
<div>
    My name is <span style="color: ${() => state.color}">
        ${() => state.name}
    </span>

    <div>i will live ${() => state.age + 1}ever</div>
    <div>second state age is  ${() => secondState.age} yars</div>
    <div>i am ${"static"}</div>

    <button onclick=${() => state.clicks += 1}>
        click me baby ${() => state.clicks} more time
    </button>

    <style>
     #thing {
        color: ${() => state.color};
     }
    </style>
    <div id="thing">colorful things</div>

    <input placeholder=${() => state.placeholder}>

    <div>
        ${() => state.amAlive ? "yes" : htmel(innerState)`
            <span style="color: ${() => innerState.deathColor}; font-size: ${() => innerState.deathColor === "blue" ? "40px" : "13px"};">NO</span>`}
    </div>
</div>
`;

    // element is a regular html element
    document.body.appendChild(element);

    // modifying the state
    state.name = "John Cena!!!";

    // switching the color
    setInterval(() => state.color = state.color === "blue" ? "red" : "blue", 500);
```
Try it live on [JSFiddle](https://jsfiddle.net/Numbnut/90h36g1L/3/)

## How does it work?
Consider the following example:
```javascript
htmel(state)`
<div id="parent">
    <div id="child">${() => state.content}</div>
</div>
`;
state.content = "new content"
```

when the last line is called, `htmel` only updates `#child`'s content, by rerunning
the expression `() => state.content`.
`htmel` does several things to make that possible: 
* Wrap state object with setters and getters
    * Setters notify `htmel` that property has changed and should be rerendered. 
    (when `state.content = "new content"` is called)
    * Getters allow us to know which property corresponds to which expression in 
    the html: when `() => state.content` is called, the getter for `content` is 
    called, letting `htmel` know that `content` property corresponds to that 
    expression.
* Analyze the resulting HTML element to keep a reference to each of the nodes containing 
expressions. For example, `htmel` keeps a reference to the `#child`'s TextNode
which will be changed when `content`'s setter is called. It does so by inserting 
randomly generated IDs into the expressions, the then finding them.

In order to minimize the amount of DOM operations being done, `htmel` batches DOM
updates instead of immediately updating when setters are called.

### Why bound expression must be functions?
When an expression isn't a function, `htmel` can't rerun it when state's properties are 
changed - in fact, no property is linked to a static expression. Consider this expression:
```javascript
${state.a}
```
`htmel` can't possible know that the property `a` is linked to this expression, because only
the value of `a` is passed.

Its possible to use `eval` to convert expressions into callbacks (add `()=>` to the above code)
 but that would slow performance and be prone to errors and security problems.

## Contribution
Feel free to contact me about bugs, features and anything you'd like.

If you like this project and you feel like contributing, questions about the code and PRs are 
very welcome :)
