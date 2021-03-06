import {randomId, addToListInMap} from "./utils.js";

function arraysEqual(a, b) {
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function isHashSame(hash, propsObjs, hash2, propsObjs2) {
    return hash === hash2 && arraysEqual(propsObjs, propsObjs2)
}

function mutationFilter(arr, cb) {
    for (let i = arr.length - 1; i >= 0; i -= 1) {
        if (!cb(arr[i])) {
            arr.splice(i, 1)
        }
    }
}

const ExpResultTypes = {
    PRIMITIVE: "primitive",
    ARRAY: "array",
    YOFFEE_TEMPLATE: "yoffee_template"
}

class Expression {
    constructor(expressionCb) {
        this._cb = expressionCb;
        this.id = randomId();
        this.lastResult = null;
        this.boundNode = null;
        this.boundProps = new Set()
        this.isEventHandler = false;
        this.isStatic = (typeof this._cb) !== "function";

        this.resultType = null;
        this.resultMetadata = null;
    }

    execute() {
        // Resetting cached state
        this.cached = false;

        if (this.isEventHandler || this.isStatic) {
            this.lastResult = this._cb;
        } else {
            let newResult = this._cb();

            // Checks if the output is a yoffee template
            if (newResult != null && newResult.createYoffeeTemplate) {
                this.handleYoffeeTemplate(newResult);
            } else if (Array.isArray(newResult)) {
                this.handleArray(newResult);
            // } else if (typeof newResult === "object" && newResult != null) {
            //     this.handleKeyedList(newResult)
            } else {
                // Primitive value - just setting it and destroying all children
                this.removeChildTemplateListeners();
                this.lastResult = newResult;
                this.resultType = ExpResultTypes.PRIMITIVE;
                this.resultMetadata = null;
            }
        }
    }

    handleYoffeeTemplate(deferredTemplate) {
        // In case we are recursive
        if (this.resultType === ExpResultTypes.YOFFEE_TEMPLATE &&
            this.resultMetadata.yoffeeTemplate == null) {
            return
        }

        // Check if new template is the same as the last
        if (this.resultType === ExpResultTypes.YOFFEE_TEMPLATE &&
            // !this.resultMetadata.yoffeeTemplate.__contentChanged &&
            // !this.resultMetadata.yoffeeTemplate.__weaklyBoundProps.has(TemplateStack.getCurrentlySetProp()) &&
            this.resultMetadata.cacheable &&
            isHashSame(this.resultMetadata.hash, this.resultMetadata.propsObjs, deferredTemplate.hash, deferredTemplate.propsObjs)
        ) {
            // Caching template
            console.log("Using cached template")
            this.cached = true;
            this.lastResult.__expressions.forEach((exp, index) => {
                exp._cb = deferredTemplate.expressionCbs[index];
            })
            this.lastResult.__updateExpressions();
        } else {
            // Destroy all past yoffee children
            this.removeChildTemplateListeners()

            this.resultType = ExpResultTypes.YOFFEE_TEMPLATE;
            this.resultMetadata = deferredTemplate
            this.lastResult = deferredTemplate.createYoffeeTemplate();
        }
    }

    handleArray(newResult) {
        // Check if last result was an array, and cache existing yoffees
        if (this.resultType === ExpResultTypes.ARRAY) {
            let oldHashToTemplates = this.resultMetadata;

            // // Filter out and remove watchers for yoffees with a changed content
            // for (let templateList of oldHashToTemplates.values()) {
            //     mutationFilter(templateList, t => {
            //         // if (t.yoffeeTemplate.__contentChanged) {
            //         if (t.yoffeeTemplate != null
            //             && t.yoffeeTemplate.__weaklyBoundProps.has(TemplateStack.getCurrentlySetProp())
            //         ) {
            //             t.yoffeeTemplate.__removeWatchers();
            //             return false
            //         }
            //         return true
            //     });
            // }

            // Populate array with new and old values
            this.lastResult = [];
            let newHashToTemplates = new Map();

            // Important to override resultMetadata here, because next code can call createYoffeeTemplate recursively
            this.resultMetadata = newHashToTemplates;

            for (let listItem of newResult) {
                if (listItem != null && listItem.createYoffeeTemplate) {
                    let cached = false;

                    // Find old template with same hash and props objects
                    let cachedTemplatesList = oldHashToTemplates.get(listItem.hash);
                    if (cachedTemplatesList != null && listItem.cacheable) {
                        // Finds templates with the same prop objects as the new one
                        let cachedTemplateIndex = cachedTemplatesList.findIndex(
                            t => arraysEqual(t.propsObjs, listItem.propsObjs)
                        );
                        if (cachedTemplateIndex !== -1) {
                            // We must splice because we can't reuse one old template for multiple new templates!
                            let cachedTemplate = cachedTemplatesList.splice(cachedTemplateIndex, 1)[0];
                            cached = true

                            // TODO: Do we need the if???
                            // if (cachedTemplate.yoffeeTemplate != null) {

                            console.log("Using cached template in list")
                            this.lastResult.push(cachedTemplate.yoffeeTemplate);
                            cachedTemplate.shouldntDelete = true

                            cachedTemplate.yoffeeTemplate.__expressions.forEach((exp, index) => {
                                exp._cb = listItem.expressionCbs[index];
                            })
                            cachedTemplate.yoffeeTemplate.__updateExpressions();
                            // }

                            addToListInMap(newHashToTemplates, cachedTemplate.hash, cachedTemplate);
                        }
                    }

                    // Old wasn't found, creating new
                    if (!cached) {
                        addToListInMap(newHashToTemplates, listItem.hash, listItem);
                        let yoffeeTemplate = listItem.createYoffeeTemplate()
                        this.lastResult.push(yoffeeTemplate);
                    }
                } else {
                    this.lastResult.push(listItem)
                }
            }

            // Delete old uncached yoffees
            for (let templateList of oldHashToTemplates.values()) {
                templateList.forEach(t => {
                    if (!t.shouldntDelete) {
                        t.yoffeeTemplate.__removeWatchers();
                    }
                });
            }
            for (let templateList of newHashToTemplates.values()) {
                templateList.forEach(t => {
                    if (t.shouldntDelete) {
                        t.shouldntDelete = undefined
                    }
                });
            }
        } else {
            // First array render: if last result wasn't array
            this.removeChildTemplateListeners();

            this.lastResult = [];
            let hashToTemplates = new Map();
            for (let item of newResult) {
                if (item != null && item.createYoffeeTemplate) {
                    let yoffeeTemplate = item.createYoffeeTemplate()
                    this.lastResult.push(yoffeeTemplate)
                    addToListInMap(hashToTemplates, item.hash, item);
                } else {
                    this.lastResult.push(item)
                }
            }

            this.resultMetadata = hashToTemplates;
        }
        this.resultType = ExpResultTypes.ARRAY;
    }

    removeChildTemplateListeners() {
        if (this.resultType == null) {
            return
        }

        if (this.resultType === ExpResultTypes.YOFFEE_TEMPLATE) {
            this.resultMetadata.yoffeeTemplate.__removeWatchers();
        } else if (this.resultType === ExpResultTypes.ARRAY) {
            this.lastResult.filter(item => item.__isYoffee).forEach(yoffeeTemplate => yoffeeTemplate.__removeWatchers());
        }
    }
}

export {Expression}