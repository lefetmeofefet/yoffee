import {YoffeeElement, createYoffeeElement} from "./YoffeeElement.js"
import {watch, removeWatcher, NoWatchProperty} from "./objectWatcher.js"
import {find, SearchLocations} from "./domNodeFinder.js"
import {randomId, fillStrWithExpressions} from "./utils.js";
import {BoundNode} from "./boundNode.js";
import {Expression} from "./expression.js";

// function _joinTemplateStrings(arr1, arr2) {
//     return arr2.reduce((accu, current, i) => accu + ((accu.trim().endsWith("<tbody>") || arr1[i + 1].trim().startsWith("</tbody>")) ? `<tr><td>${current}</td></tr>` : current) + arr1[i + 1], arr1[0])
// }

function _joinTemplateStrings(arr1, arr2) {
    return arr2.reduce((accu, current, i) => accu + current + arr1[i + 1], arr1[0])
}

/**
 * Creates an HTML element from html string.
 * We use template tag, because it doesn't render its content. The `content` property of the template element is a
 * DocumentFragment that contains all the elements under that template.
 * The reason we create an enclosing <yoffee-template-container> element and don't return the DocumentFragment directly,
 * is that document.evaluate can't run on a DocumentFragment, only on an element. So we enclose the template's content
 * with <yoffee-template-container>, and return that.
 * @param {String} html
 * @returns {Element}
 * @private
 */
function _createContainerElement(html) {
    let template = document.createElement("template");

    // yoffee-template-container doesn't exist, I made it up. It is an HTMLUnknownElement:
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLUnknownElement
    html = html.trim();
    let containerElement;

    if (html.startsWith("<tr") || html.startsWith("<td")) {
        template.innerHTML = html;

        let template2 = document.createElement("template");
        template2.innerHTML = "<yoffee-template-container></yoffee-template-container>"
        for (let child of template.content.children) {
            template2.content.firstElementChild.appendChild(child)
        }

        containerElement = template2.content.firstElementChild;
    } else {
        template.innerHTML = `<yoffee-template-container>${html}</yoffee-template-container>`;
        containerElement = template.content.firstElementChild;
    }

    // Firefox can't use document.evaluate on a node that's not under the document
    if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
        // TODO: Check if you can use XMLDocument.evaluate to evaluate instead of adding to the DOM
        return document.adoptNode(containerElement)
    }
    return containerElement
}

/**
 * Receives a textNode and divider (`textToMakeNode`), and breaks up the textNode into 3 textNodes: before, after and
 * middle, and returns the middle. The middle is the part that's equal to `textToMakeNode` and its value is changed to it.
 * the other parts are inserted into the DOM.
 * Example: node "123" with divider "2" will return insert "1" and "3" into the DOM, and return "2".
 * node "23" with divider "2" will insert "3" into DOM and return "2".
 * @param {Text} textNode
 * @param {String} textToMakeNode
 * @returns {Text}
 * @private
 */
function _breakUpTextNodeToSmallerNodes(textNode, textToMakeNode) {
    let wholeText = textNode.data.trim();
    let textStartIndex = wholeText.indexOf(textToMakeNode);
    let textEndIndex = textStartIndex + textToMakeNode.length;

    // Insert node before
    if (textStartIndex !== 0) {
        textNode.parentNode.insertBefore(
            document.createTextNode(wholeText.substring(0, textStartIndex)),
            textNode
        );
    }

    // Insert node after
    if (textEndIndex < wholeText.length) {
        textNode.parentNode.insertBefore(
            document.createTextNode(wholeText.substring(textEndIndex)),
            textNode.nextSibling
        );
    }

    textNode.data = wholeText.substring(textStartIndex, textEndIndex);
    return textNode;
}

/**
 * Creates BoundNodes from expressionIds inside `containerElement`.
 * Basically, we run over each expression and find it's ID inside the `containerElement`. It should be there somewhere.
 * For each ID we found we create a BoundNode, with the node that contains the ID and the expression.
 * Each BoundNode references a list of expressions, and each expression has a reference to its bound node.
 * @param {HTMLElement} containerElement
 * @param {[Expression]} expressions
 * @private
 */
function bindNodesToExpressions(containerElement, expressions) {
    /** @type {Map<Node, BoundNode>} */
    const domNodeToBoundNode = new Map();

    for (let expression of expressions) {
        let searchResult = null;
        searchResult = find(containerElement, expression.id);

        if (searchResult == null) {
            throw `YOFFEE: Expression location is not valid: ${"${" + expression._cb.toString() + "}"}`
        }
        let {domNode, searchLocation} = searchResult;

        // Break up textNode
        if (searchLocation === SearchLocations.TEXT_NODE) {
            domNode = _breakUpTextNodeToSmallerNodes(domNode, expression.id)
        }

        // If template is inside html tag name, throw exception
        if (searchLocation === SearchLocations.HTML_TAG) {
            let forbiddenTagText = fillStrWithExpressions(`<${domNode.localName}>`, [expression]);
            throw `YOFFEE: Calculating element name is not allowed: ${forbiddenTagText}`
        }

        // Expressions on attrs that start with "on" are event handlers
        if (searchLocation === SearchLocations.ATTR_VALUE && domNode.name.startsWith("on")) {
            expression.isEventHandler = true;
        }

        // Create BoundNodes, deduping nodes that are found multiple times because of multiple expressions (attr node)
        if (domNodeToBoundNode.has(domNode)) {
            let boundNode = domNodeToBoundNode.get(domNode);
            boundNode.expressions.push(expression);
            expression.boundNode = boundNode;
        } else {
            let boundNode = new BoundNode([expression], domNode, searchLocation);
            domNodeToBoundNode.set(domNode, boundNode);
            expression.boundNode = boundNode;
        }
    }

    // console.log("DomNodes + Expressions: ");
    // console.log([...domNodeToBoundNode.values()]);
}

function hashTemplate(strings, expressionCbs) {
    // Just zip two lists
    // TODO: concatenating may cause a false equality. for example, "<div>${()=>a}" will be the same as "<div>()=>${a}"
    let str = expressionCbs.reduce((accu, current, i) => accu + current + strings[i + 1], strings[0]);

    // Hash result
    return str.split("").reduce(function (a, b) {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a
    }, 0);
}


/** @type {Map<String, Set<Expression>>} */
let propsToExpressions = new Map();

// TODO: Remove this.?
let currentlySetProp = null;

/** @type {Boolean} */
let isInsideExpression = false;

/**
 * Contains a set of props that were accessed so far when executing chain of expressions. This is important, because
 * if parent expressions accessed prop A and then his child expression also accessed it, child shouldn't rerender;
 * only parent should, and parent will execute his children himself.
 * @type {Set<String>}
 */
let propsAlreadyAccessed = new Set();

/** @type {Expression} */
let currentlyExecutingExpression = null;


/**
 * Called when any property was accessed on any prop object.
 * Responsible for:
 *  - Linking props to expressions in which they were accessed
 *  - Accumulating props that were accessed in expression chain
 *  - Updating list of `boundProps` on the current executing expression
 * @param {String} key
 * @param {Object} obj
 */
let onGetListener = (key, obj) => {
    if (!isInsideExpression) {
        return
    }

    // We use the props object's ID as prefix because the same prop in different props objects has to be different
    let prop = `${obj[NoWatchProperty]}.${key}`;

    // We accumulate props that were already accessed when executing chain of expressions.
    // If prop wasn't accessed earlier, we count it in `propsAlreadyAccessed`, and add it to the list of boundProps
    // on the current executing expression.
    // If prop was accessed earlier in the expression chain, we don't attribute it to anything.
    if (!propsAlreadyAccessed.has(prop)) {
        propsAlreadyAccessed.add(prop);
        currentlyExecutingExpression.boundProps.add(prop);
        if (!propsToExpressions.has(prop)) {
            propsToExpressions.set(prop, new Set());
        }
        propsToExpressions.get(prop).add(currentlyExecutingExpression);
    }
}

/**
 * Called when any property is set on any props object.
 * Collects expressions which are linked to the updated property, and executes them. simple and stupid.
 * @param {String} key
 * @param value
 * @param {Object} obj
 */
let onSetListener = (key, value, obj) => {
    if (isInsideExpression) {
        throw `YOFFEE: Setting properties is not allowed inside an expression! (${key} = ${value})`
    }

    // TODO: Check if value is different than the current one, and spare expression evaluations
    // We use the props object's ID as prefix because the same prop in different props objects has to be different
    let prop = `${obj[NoWatchProperty]}.${key}`;

    // The currently set prop is for when setting prop INSIDE an expression!
    // TODO: Remove this. it doesnt do anything now
    let oldPropPlaceholder = currentlySetProp;
    currentlySetProp = prop;

    // Collect expressions to execute (expressions that have props that were modified)
    let expressionsToExecute = propsToExpressions.get(currentlySetProp);
    if (expressionsToExecute == null) {
        // TODO: Consider removing this warning. if one object has many yoffee elements it will happen annoyingly.
        console.warn(`A prop changed but no expression is linked to it: ${
            currentlySetProp.substr(currentlySetProp.indexOf(".") + 1)}`);
        return;
    }
    updateExpressions([...expressionsToExecute], true)

    currentlySetProp = oldPropPlaceholder;
}

/**
 * Receives a list of expressions, and executes them, updating the template afterwards.
 * This function is running in a recursive manner. It doesn't call itself, but expressions call it when they need to
 * execute child expressions. That's why we use 'old' parameters, like 'oldIsInsideExpression', to set back the global
 * value to what it was before function was called recursively.
 * @param {[Expression]} exs Expressions to execute
 * @param {Boolean?} startRenderMidTree If we're starting render mid-tree (when setting prop), we should remember
 * accessed props of ancestors
 */
const updateExpressions = (exs, startRenderMidTree) => {
    let oldIsInsideExpression = isInsideExpression;
    isInsideExpression = true;

    try {
        for (let expression of exs) {
            // Remove all bound props, prepare to populate updated ones
            expression.boundProps.forEach(boundProp => propsToExpressions.get(boundProp).delete(expression))

            let oldAlreadyAccessedProps = new Set(propsAlreadyAccessed);
            if (startRenderMidTree) {
                // When we're starting a render chain (expression renders child expressions and so on...) in the middle
                // of the tree of expressions, we need to remember which props were accessed by ancestors of the updated
                // expression, and not attribute those properties to the children when they access them.
                propsAlreadyAccessed = new Set(expression.__propsAccessedByFather || []);
            } else {
                expression.__propsAccessedByFather = new Set(propsAlreadyAccessed);
            }
            let oldCurrentlyExecutingExpression = currentlyExecutingExpression;
            currentlyExecutingExpression = expression;
            expression.execute();
            currentlyExecutingExpression = oldCurrentlyExecutingExpression;
            propsAlreadyAccessed = oldAlreadyAccessedProps;
        }
    } finally {
        isInsideExpression = oldIsInsideExpression;
    }

    // Update nodes with updated expression results
    for (let boundNode of new Set(exs.map(ex => ex.boundNode))) {
        boundNode.update()
    }
};

/**
 * Receives state objects, template strings and expression callbacks inside the template, and returns a template that's bound
 * to the props objects.
 *
 * Steps:
 * 1. Create a DocumentFragment that will represent the yoffee template (it will contain elements, reference listeners, etc.)
 * 2. Create HTML string from the template literal: generate an ID for each expression and replace the expressions in the template with those IDs.
 * 3. Create a HTMLUnknownElement element that contains the previously generated HTML string. It's not connected to the DOM.
 * 4. Bind nodes to expressions: find the DOM nodes that contain the expressions in the HTMLUnknownElement DOM using the previously generated IDs.
 *    We need the HTMLUnknownElement to search because xpath root has to be an Element (not DocumentFragment)
 * 5. Perform first render: execute each expression while collecting the state object's properties that were accesed inside, and insert the return value
 *    into the DOM Node where the expression ID was. When the state object's setter is invoked, we check whether the property is bound
 *    to any expression, and if so, the expression is executed and DOM Node is updated, and new properties are collected on the way again.
 * 6. Move all children of the container element into the DocumentFragment created earlier, and return the fragment.
 *
 *  When executing an expression, we know which props were used in the expression thanks to the watchers we set earlier.
 *
 * @param propsObjects
 * @param strings
 * @param expressionCbs
 * @returns {DocumentFragment}
 */
function createBoundDocumentFragment(propsObjects, strings, expressionCbs) {
    // Create the fragment that will be returned, which contains the template
    let yoffeeFragment = document.createDocumentFragment();

    yoffeeFragment.__isYoffee = true;

    // Create expressions and yoffee element
    const expressions = expressionCbs.map(cb => new Expression(cb));
    let htmlText = _joinTemplateStrings(strings, expressions.map(e => e.id));
    const containerElement = _createContainerElement(htmlText);

    // After this, each expression will reference a single BoundNode, which references multiple expressions.
    bindNodesToExpressions(containerElement, expressions);

    // This is called when the template is replaced with something else
    yoffeeFragment.__removeWatchers = () => {
        console.log("Deleting template");

        for (let expression of expressions) {
            expression.boundProps.forEach(boundProp => propsToExpressions.get(boundProp).delete(expression));
            expression.removeChildTemplateListeners();
        }
    }

    // Initial render
    updateExpressions(expressions);

    // Add nodes into yoffee fragment
    yoffeeFragment.__childNodes = [...containerElement.childNodes]
    yoffeeFragment.__expressions = expressions;
    yoffeeFragment.__updateExpressions = () => updateExpressions(expressions.filter(ex => !ex.isStatic && !ex.isEventHandler))
    yoffeeFragment.append(...containerElement.childNodes);
    return yoffeeFragment
}

/**
 * Returns a DocumentFragment that has a one-way binding to each of the objects.
 * @param {...Object} propsObjects Holds the state of this yoffee element
 * @returns {function(*=, ...[*]): DocumentFragment}
 */
function html(...propsObjects) {
    // Set ID for new props objects, and add watcher to prop object
    propsObjects.forEach(obj => {
        if (typeof obj !== "object") {
            throw `YOFFEE: Props object must be an object, got ${typeof propsObject}`
        }
        else if (obj == null) {
            throw `YOFFEE: Props object can't be null`
        }

        if (obj[NoWatchProperty] == null) {
            obj[NoWatchProperty] = randomId();
            watch(
                obj,
                onGetListener,
                onSetListener
            );
        }
    });

    // This is the tagged template literal function. It receives template strings and expressions in between.
    return (strings, ...expressionCbs) => {
        let createTemplate = () => createBoundDocumentFragment(propsObjects, strings, expressionCbs);

        // If we're inside another yoffee template, we don't create a new template because it's possible it should be cached.
        // Instead, we return callback to create the template, and info to determine if should be cached (hash, expressions, propsObjects)
        if (isInsideExpression) {
            let deferredTemplate = {
                propsObjs: propsObjects,
                expressionCbs: expressionCbs,
                hash: hashTemplate(strings, expressionCbs),
                cacheable: true,
            }
            deferredTemplate.createYoffeeTemplate = () => {
                let t = createTemplate();
                deferredTemplate.yoffeeTemplate = t;
                return t
            }
            return deferredTemplate
        }

        return createTemplate();
    }
}


export {html, createYoffeeElement, YoffeeElement}
