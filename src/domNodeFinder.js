// TODO: make library

const SearchLocations = {
    TEXT_NODE: "Text/CSS node",
    ATTR_VALUE: "Attribute value",
    ATTR_NAME: "Attribute name",
    HTML_TAG: "HTML tag"
};

/**
 *
 * @param rootElement
 * @param searchValue
 * @returns {{domNode: Node, searchLocation: String} | null}
 */
function find(rootElement, searchValue) {
    const xpathSearchers = [
        {
            // Finds TextNode by text
            type: SearchLocations.TEXT_NODE,
            xpath: `.//text()[contains(., '${searchValue}')]`
        }, {
            // Finds Attribute by value
            type: SearchLocations.ATTR_VALUE,
            xpath: `.//@*[contains(., '${searchValue}')]`
        }, {
            // Finds Attribute by attribute's name
            type: SearchLocations.ATTR_NAME,
            xpath: `.//@*[contains(name(), '${searchValue}')]`
        }, {
            // Finds HTML elements by tag names
            type: SearchLocations.HTML_TAG,
            xpath: `.//*[contains(name(), '${searchValue}')]`
        }
    ];

    for (let searcher of xpathSearchers) {
        let result = document.evaluate(
            searcher.xpath,
            rootElement,
            null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
        ).singleNodeValue;

        if (result != null) {
            return {
                domNode: result,
                searchLocation: searcher.type
            }
        }
    }
}

export {find, SearchLocations}
