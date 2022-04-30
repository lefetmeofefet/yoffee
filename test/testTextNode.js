/**
 * TODO:
 * write descriptions above tests, explaining the expected logic and what is the meaning of a failed test
 * test garbage collection of template even if state is still in use by other templates
 * test illegal template location throws exception (tag name, ...)
 */


import {YoffeeChecker} from "./YoffeeChecker.js";
// import html from "../src/html-tree/html.js";
import {html} from "../src/yoffee.js";
// import html from "../dist/html.min.js"

import assert from 'assert';

describe('text node', function () {
    it('static rendering', function (done) {
        let check = YoffeeChecker(null, [
            {
                template: () => html()`${"123"}`,
                expected: () => `123`
            }, {
                template: () => html()`0${"123"}4`,
                expected: () => `01234`
            }, {
                template: () => html()`  0 ${"123"} 4      `,
                expected: () => `0 123 4`
            }, {
                template: () => html()`${"123"}4${567}`,
                expected: () => `1234567`
            }, {
                template: () => html()`${1} 2 ${3}`,
                expected: () => `1 2 3`
            }, {
                template: () => html()`${1} 2 ${3} 4 ${5}`,
                expected: () => `1 2 3 4 5`
            }, {
                template: () => html()`<div>${"text"}</div>`,
                expected: () => `<div>text</div>`
            }
        ]);
        check()
        done();
    });

    it('basic updates', function (done) {
        let state = {
            a: "123"
        }

        let ELEMENT_CONST = "element";
        let elementStr = `<div>funshit</div>`;

        let calcA = () => state.a === ELEMENT_CONST ? html()`<div>funshit</div>` : state.a
        let expectA = () => state.a === ELEMENT_CONST ? elementStr : (state.a || "")

        let check = YoffeeChecker(state, [
            {
                template: () => html(state)`${() => calcA()}`,
                expected: () => `${expectA()}`
            }, {
                template: () => html(state)`0${() => calcA()}4`,
                expected: () => `0${expectA()}4`
            }, {
                template: () => html(state)`  0 ${() => calcA()} 4      `,
                expected: () => `0 ${expectA()} 4`
            }, {
                template: () => html(state)`${() => calcA()}4${() => calcA()}`,
                expected: () => `${expectA()}4${expectA()}`
            }, {
                template: () => html(state)`<div>${() => calcA()}</div>`,
                expected: () => `<div>${expectA()}</div>`
            }
        ]);
        check();
        state.a = 666;
        check();
        state.a = null;
        check();
        state.a = false;
        check();
        state.a = true;
        check();
        state.a = ELEMENT_CONST;
        check();
        state.a = "test_123";
        check();

        done();
    });

    it('list of documentFragments, each with multiple root nodes', function (done) {
        // TODO
        done()
    });

    it('multiple state objects', function (done) {
        // TODO: Same prop name, different objects
        done()
    });

    it('type transformations', function (done) {
        let state = {
            value: null
        }
        let LIST_MARKER = "<yoffee-list-location-marker></yoffee-list-location-marker>";
        let expected = "";

        let transformations = {
            STRING: () => {
                state.value = "string here";
                expected = "string here";
            },
            NULL: () => {
                state.value = null;
                expected = "";
            },
            ELEMENT: () => {
                let e = document.createElement("div");
                e.textContent = "asd"
                state.value = e;
                expected = "<div>asd</div>";
            },
            TEXT_NODE: () => {
                state.value = document.createTextNode("shitfuck");
                expected = "shitfuck";
            },
            DOCUMENT_FRAGMENT_NO_CHILDREN: () => {
                state.value = html()``;
                expected = "";
            },
            DOCUMENT_FRAGMENT_ONE_CHILD: () => {
                state.value = html()`<div>asd</div>`;
                expected = "<div>asd</div>";
            },
            DOCUMENT_FRAGMENT_MANY_CHILDREN: () => {
                state.value = html()`<div>asd</div> asd2 ${null}${"asd_node"}<div>asd3</div>`;
                expected = `<div>asd</div> asd2 asd_node<div>asd3</div>${LIST_MARKER}`;
            },
            DOCUMENT_FRAGMENT_TEXT_NODE_CHILD: () => {
                state.value = html()`asd`;
                expected = "asd";
            },
            EMPTY_ARRAY: () => {
                state.value = [];
                expected = LIST_MARKER;
            },
            STRING_ARRAY: () => {
                state.value = ["asd1", "asd2"];
                expected = `asd1asd2${LIST_MARKER}`;
            },
            NODE_ARRAY: () => {
                let e = document.createElement("div");
                e.textContent = "lefet"
                state.value = [e, document.createTextNode("beef")];
                expected = `<div>lefet</div>beef${LIST_MARKER}`;
            },
            DOCUMENT_FRAGMENT_ARRAY: () => {
                state.value = [html()`<div>asd</div>`, html()`asd2`, html()`<div>asd3</div>asd4`];
                expected = `<div>asd</div>asd2<div>asd3</div>asd4${LIST_MARKER}`;
            },
            MIXED_ARRAY: () => {
                let e = document.createElement("div");
                e.textContent = "element";

                state.value = [
                    html()`<div>asd</div>`,
                    document.createTextNode("textnode"),
                    html()`asd2`,
                    e,
                    "strstr",
                    null,
                    html()`<div>asd3</div>asd4`
                ];
                expected =
                    `<div>asd</div>`
                    + `textnode`
                    + `asd2`
                    + `<div>element</div>`
                    + `strstr`
                    + `<div>asd3</div>asd4`
                    + LIST_MARKER
            },
        }

        let check = YoffeeChecker(state, [
            {
                template: () => html(state)`${() => state.value}`,
                expected: () => expected
            }
        ]);
        check();

        for (let transformationName of Object.keys(transformations)) {
            let transformation = transformations[transformationName];
            transformation();
            try {
                check()
            } catch (e) {
                throw new Error(`Failed transformation: ${transformationName}\n${e}`)
            }
        }

        done();
    });

    describe('rerendering', function () {
        it("shouldn't rerender", function (done) {
            let outerRenders = 0;
            let innerRenders = 0;

            let state = {
                a: "some value"
            }

            let check = YoffeeChecker(state, [
                {
                    template: () => html(state)`
                    <div>
                    ${() => {
                        outerRenders += 1;
                        return html()`
                        ${() => {
                            innerRenders += 1;
                            return state.a
                        }}
                        `;
                    }}
                    </div>
                    `,
                    expected: () => `<div>${state.a}</div>`
                }
            ]);
            check();
            assert.equal(outerRenders, 1);
            assert.equal(innerRenders, 1);

            outerRenders = 0;
            innerRenders = 0;

            state.a = "new value";
            check();
            assert.equal(outerRenders, 0);
            assert.equal(innerRenders, 1);

            done();
        });

        it("shouldn't rerender nested", function (done) {
            let outerOuterRenders = 0;
            let outerRenders = 0;
            let innerRenders = 0;

            let state = {
                a: "some value"
            }

            let check = YoffeeChecker(state, [
                {
                    template: () => html(state)`
                    <div>
                    ${() => {
                        outerOuterRenders += 1;
                        return html()`
                        ${() => {
                            outerRenders += 1;
                            return html(state)`
                            ${() => {
                                innerRenders += 1;
                                return state.a
                            }}
                            `;
                        }}
                        `;
                    }}
                    </div>
                    `,
                    expected: () => `<div>${state.a}</div>`
                }
            ]);
            check();
            assert.equal(outerOuterRenders, 1);
            assert.equal(outerRenders, 1);
            assert.equal(innerRenders, 1);

            outerOuterRenders = 0;
            outerRenders = 0;
            innerRenders = 0;

            state.a = "new value";
            check();
            assert.equal(outerOuterRenders, 0);
            assert.equal(outerRenders, 0);
            assert.equal(innerRenders, 1);

            done();
        });

        it("should rerender with cache", function (done) {
            let outerRenders = 0;
            let innerRenders = 0;

            let state = {
                a: "some value"
            }

            let check = YoffeeChecker(state, [
                {
                    template: () => html(state)`
                    <div>
                    ${() => {
                        outerRenders += 1;
                        // Just to access state.a to trigger rerender
                        let b = state.a;
                        return html()`
                        ${() => {
                            innerRenders += 1;
                            return state.a
                            // return b
                        }}
                        `;
                    }}
                    </div>
                    `,
                    expected: () => `<div>${state.a}</div>`
                }
            ]);
            check();
            assert.equal(outerRenders, 1);
            assert.equal(innerRenders, 1);

            outerRenders = 0;
            innerRenders = 0;

            state.a = "new value";
            check();
            assert.equal(outerRenders, 1);
            assert.equal(innerRenders, 1);

            done();
        });

        it("shouldn't rerender with cache", function (done) {
            let outerRenders = 0;
            let innerRenders = 0;

            let state = {
                a: "some value"
            }

            let check = YoffeeChecker(state, [
                {
                    template: () => html(state)`
                    <div>
                    ${() => {
                        outerRenders += 1;
                        // Just to access state.a to trigger rerender
                        let b = state.a;
                        return html()`
                        ${() => {
                            innerRenders += 1;
                            return 1
                        }}
                        `;
                    }}
                    </div>
                    `,
                    expected: () => `<div>1</div>`
                }
            ]);
            check();
            assert.equal(outerRenders, 1);
            assert.equal(innerRenders, 1);

            outerRenders = 0;
            innerRenders = 0;

            state.a = "new value";
            check();
            assert.equal(outerRenders, 1);
            assert.equal(innerRenders, 1);

            done();
        });

        it("different states", function (done) {
            let outerRenders = 0;
            let innerRenders = 0;

            let outerState = {
                a: "outer value",
            }
            let innerState = {
                a: "inner value",
            }

            let check = YoffeeChecker(outerState, [
                {
                    template: () => html(outerState)`
                    <div>
                    ${() => {
                        outerRenders += 1;
                        return html(innerState)`
                        ${() => {
                            innerRenders += 1;
                            return outerState.a + innerState.a
                        }}
                        `;
                    }}
                    </div>
                    `,
                    expected: () => `<div>${outerState.a + innerState.a}</div>`
                }
            ]);
            check();
            assert.equal(outerRenders, 1);
            assert.equal(innerRenders, 1);

            outerRenders = 0;
            innerRenders = 0;

            outerState.a = "new outer value";
            check();
            assert.equal(outerRenders, 0);
            assert.equal(innerRenders, 1);

            outerRenders = 0;
            innerRenders = 0;

            innerState.a = "new inner value";
            check();
            assert.equal(outerRenders, 0);
            assert.equal(innerRenders, 1);

            done();
        });

        it("garbage collection", function (done) {
            let outerRenders = 0;
            let innerRenders = 0;

            let outerState = {
                a: "outer value",
            }
            let innerState = {
                a: "inner value",
            }

            let check = YoffeeChecker(outerState, [
                {
                    template: () => html(outerState)`
                    <div>
                    ${() => {
                        outerRenders += 1;
                        // Just to access state.a to trigger rerender
                        let b = outerState.a
                        return html(innerState)`
                        ${() => {
                            innerRenders += 1;
                            return innerState.a
                        }}
                        `;
                    }}
                    </div>
                    `,
                    expected: () => `<div>${innerState.a}</div>`
                }
            ]);
            check();
            assert.equal(outerRenders, 1);
            assert.equal(innerRenders, 1);

            outerRenders = 0;
            innerRenders = 0;

            outerState.a = "new outer value";
            check();
            assert.equal(outerRenders, 1);
            assert.equal(innerRenders, 1);

            outerRenders = 0;
            innerRenders = 0;

            innerState.a = "new inner value";
            check();
            assert.equal(outerRenders, 0);
            assert.equal(innerRenders, 1);

            done();
        });

        it("listener deletion", function (done) {
            // TODO: When template is replaced by primitive and then replaced by a different template, check if caching
            //  works when it should and if it doesn't cache if it shouldn't
            done()
        });

        it("nested listener deletion", function (done) {
            // TODO: c is under b is under a. a is destroyed. a has listeners. destroy the listeners!
            done()
        });

        it("same template but different state objects", function (done) {
            // TODO:
            done()
        });
    });
});
