function validateDom(nodes, correctDom) {
    let domContainer = document.createElement("test-dom-container");
    domContainer.append(...([...nodes].map(n => n.cloneNode(true))));
    domContainer.normalize();
    nodes = domContainer.childNodes;

    let correctDomContainer = document.createElement("div");
    correctDomContainer.innerHTML = correctDom;
    let expectedElements = correctDomContainer.childNodes;

    try {
        assertSame(expectedElements.length, nodes.length, "Number of root nodes doesn't match")
        compareListOfNodes(nodes, expectedElements)
    } catch(e) {
        let html = domContainer.innerHTML
        let errorMessage = `DOMs don't match.\nExpected:\n${correctDom}\nGot:\n${html}\nError: ${e}`
        throw new Error(errorMessage)
    }
}

function compareListOfNodes(nodes, expectedNodes) {
    for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        let expectedNode = expectedNodes[i];
        let isNodeText = node instanceof Text;
        let isExpectedNodeText = expectedNode instanceof Text;

        assertSame(isExpectedNodeText, isNodeText, `Node types are don't match at index ${i}. are they TextNodes?`);
        if (isNodeText) {
            assertSame(expectedNode.textContent.trim(), node.textContent.trim(), "Text content doesn't match");
        }
        else {
            compareElements(node, expectedNode)
        }
    }
}

function compareElements(element, expectedElement) {
    // Node name
    assertSame(expectedElement.nodeName, element.nodeName, "Node names don't match");

    // Attributes
    let attrsLength = element.attributes.length;
    assertSame(expectedElement.attributes.length, attrsLength, "Number of attributes doesn't match");

    let attrsMap = new Map();
    for (let attr of element.attributes) {
        attrsMap.set(attr.name, attr.value);
    }

    for (let expectedAttr of expectedElement.attributes) {
        let attrValue = attrsMap.get(expectedAttr.name);
        if (attrValue == null) {
            throw `Expected attribute ${expectedAttr.name} doesn't exist in given element`
        }
        assertSame(expectedAttr.value, attrValue, `Attribute value doesn't match on attribute ${expectedAttr.name}`);
    }

    // Children
    let children = element.childNodes;
    let expectedChildren = expectedElement.childNodes;
    assertSame(expectedChildren.length, children.length, "Number of children doesn't match");
    compareListOfNodes(children, expectedChildren);
}

function assertSame(expected, got, errMessage) {
    if (expected !== got) {
        throw `${errMessage}. ${expectedGot(expected, got)}`
    }
}

function expectedGot(expected, got) {
    return `expected "${expected}", got "${got}"`
}

export {validateDom}