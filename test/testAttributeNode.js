import {HtmelChecker} from "./HtmelChecker.js";
// import htmel from "../src/htmel-tree/htmel.js";
import htmel from "../src/htmel.js";
// import htmel from "../dist/htmel.min.js"

import assert from 'assert';


describe('attribute node', function () {
    it('static rendering', function (done) {
        let check = HtmelChecker(null, [
            { // Static attribute value
                template: () => htmel()`<div dir=${"rtl"}></div>`,
                expected: () => `<div dir="rtl"></div>`
            }, { // Static attribute name
                template: () => htmel()`<div ${"attr"}></div>`,
                expected: () => `<div attr></div>`
            }, { // Static dict attribute
                template: () => htmel()`<div ${{a: 3, b: "asd"}}></div>`,
                expected: () => `<div a="3" b="asd"></div>`
            }, { // Static empty dict attribute
                template: () => htmel()`<div ${{}}></div>`,
                expected: () => `<div></div>`
            }, { // Static null attr name
                template: () => htmel()`<div ${null}></div>`,
                expected: () => `<div></div>`
            }
        ]);
        check();
        done()
    });
    it('basic updates', function (done) {
        let state = {
            a: "rtl"
        }
        let check = HtmelChecker(state, [
            { // Attribute
                template: () => htmel(state)`<div dir=${() => state.a}></div>`,
                expected: () => state.a ? `<div dir="${state.a === true ? "" : state.a}"></div>` : `<div></div>`
            }, { // Attribute with quotes
                template: () => htmel(state)`<div dir="${() => state.a}"></div>`,
                expected: () => state.a ? `<div dir="${state.a === true ? "" : state.a}"></div>` : `<div></div>`
            }, { // Part of attribute
                template: () => htmel(state)`<div dir=a${() => state.a}a></div>`,
                expected: () => `<div dir="a${state.a}a"></div>`
            }, { // Part of attribute with quotes
                template: () => htmel(state)`<div dir="a ${() => state.a} a"></div>`,
                expected: () => `<div dir="a ${state.a} a"></div>`
            }, { // Twice in the same attribute
                template: () => htmel(state)`<div dir="${() => state.a} a ${() => state.a}"></div>`,
                expected: () => `<div dir="${state.a} a ${state.a}"></div>`
            }, { // Two attributes with the same prop
                template: () => htmel(state)`<div a1=${() => state.a} a2=${() => state.a}></div>`,
                expected: () => state.a ? `<div a1="${state.a === true ? "" : state.a}" a2="${state.a === true ? "" : state.a}"></div>` : `<div></div>`
            }, { // Attr name
                template: () => htmel(state)`<div ${() => state.a}></div>`,
                expected: () => state.a ? `<div ${state.a}></div>` : `<div></div>`
            }, { // Part of attr name
                template: () => htmel(state)`<div a${() => state.a}a></div>`,
                expected: () => `<div a${state.a}a></div>`
            }, { // Attr dict
                template: () => htmel(state)`<div ${() => ({a: state.a, b: state.a})}></div>`,
                expected: () => state.a ? `<div a="${state.a === true ? "" : state.a}" b="${state.a === true ? "" : state.a}"></div>` : `<div></div>`
            }, { // Attr dict with static value
                template: () => htmel(state)`<div ${() => ({a: state.a, b: "smth"})}></div>`,
                expected: () => state.a ? `<div a=${state.a === true ? '""' : state.a} b="smth"></div>` : `<div b="smth"></div>`
            },
        ]);

        check();
        state.a = "ltr"
        check();
        state.a = null;
        check();
        state.a = false;
        check();
        state.a = true;
        check();
        state.a = "ltr"
        check();

        done()
    });

    describe('event handlers', function () {
        it('event firing', function (done) {
            let clicked = false;

            let check = HtmelChecker(null, [
                { // Static event handler
                    template: () => htmel()`<div onclick="${() => clicked = true}"></div>`,
                    expected: () => `<div></div>`,
                    validator: (_, e) => {
                        e.click();
                        assert.equal(clicked, true);
                        clicked = false;
                    }
                }, { // Static event handler that returns function
                    template: () => htmel()`<div onclick="${() => () => clicked = true}"></div>`,
                    expected: () => `<div></div>`,
                    validator: (_, e) => {
                        e.click();
                        assert.equal(clicked, true);
                        clicked = false;
                    }
                }
            ]);

            check();

            done()
        });
        it('changing handler', function (done) {
            let clicked = false;
            let superClick = false;
            let state = {
                func: () => clicked = true
            }
            let check = HtmelChecker(state, [
                { // Static event handler
                    template: () => htmel(state)`<div onclick="${() => state.func()}"></div>`,
                    expected: () => `<div></div>`,
                    validator: (_, e) => {
                        e.click();
                        assert.equal(clicked, true);
                        clicked = false;
                    }
                }
            ]);

            check();

            state.func = () => {
                clicked = true;
                superClick = true;
            }
            check()
            assert.equal(superClick, true);

            done()
        });
    });

    it('convert attributes to properties', function (done) {
        let state = {
            a: "asd",
            obj: {
                a: "asdf"
            },
            attrsDict: {
                prop: {
                    a: "nothing"
                }
            }
        }
        let isObj = o => ["function", "object"].includes(typeof o);

        let check = HtmelChecker(state, [
            { // Static obj attr
                template: () => htmel()`<div prop=${{a: "static"}}></div>`,
                expected: () => `<div prop="__obj_placeholder__"></div>`,
                validator: (_, e) => assert.equal(e.prop.a, "static")
            }, { // Obj attr
                template: () => htmel(state)`<div prop=${() => ({a: state.a})}></div>`,
                expected: () => `<div prop="__obj_placeholder__"></div>`,
                validator: (_, e) => assert.equal(e.prop.a, state.a)
            }, { // Obj attr
                template: () => htmel(state)`<div prop=${() => state.obj}></div>`,
                expected: () => state.obj == null ? `<div></div>` : (
                    isObj(state.obj) ? `<div prop="__obj_placeholder__"></div>` : `<div prop="${state.obj}"></div>`
                ),
                validator: (_, e) => state.obj == null ? assert.equal(e.prop, null) : (
                    isObj(state.obj) ? assert.equal(e.prop, state.obj) : assert.equal(e.prop, null)
                )
            }, {
                template: () => htmel(state)`<div ${() => state.attrsDict}></div>`,
                expected: () => (state.attrsDict == null || state.attrsDict.prop == null) ? `<div></div>` : (
                    isObj(state.attrsDict.prop) ? `<div prop="__obj_placeholder__"></div>`
                        : `<div prop="${state.attrsDict.prop}"></div>`
                ),
                validator: (_, e) => (state.attrsDict == null || state.attrsDict.prop == null) ?
                    assert.equal(e.prop, null)
                    :
                    (
                        isObj(state.attrsDict.prop) ? assert.equal(e.prop, state.attrsDict.prop) : assert.equal(e.prop, null)
                    )
            },
        ]);
        check();
        state.a = "asdf";
        state.obj = {
            a: "asdf2"
        }
        state.attrsDict = {
            prop: {
                a: "nothing 2"
            }
        }
        check();

        state.a = null;
        state.obj = null
        state.attrsDict = null
        check();

        state.obj = "sum string"
        state.attrsDict = {
            prop: "stuff"
        }
        check()

        state.obj = () => doStuff()
        state.attrsDict = {
            prop: () => doStuff()
        }
        check();

        state.attrsDict = {
            prop: null
        }
        check()

        done();
    })

    it('illegal attributes', function (done) {
        assert.throws(() => htmel()`<div ${"123"}></div>`,
            Error, "Numeric attr name should throw an error");
        assert.throws(() => htmel()`<div ${"123asd"}></div>`,
            Error, "Attr name that starts with numeric should throw an error");
        assert.throws(() => htmel()`<div ${{a: 2, b: 3, "123": "illegal"}}></div>`,
            Error, "Numeric attr name in dict should throw an error");

        done()
    });
});
