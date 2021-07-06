import {YoffeeChecker} from "./YoffeeChecker.js";
// import html from "../src/html-tree/html.js";
import {html} from "../src/yoffee.js";
// import html from "../dist/html.min.js"

import assert from 'assert';


describe('attribute node', function () {
    it('static rendering', function (done) {
        let check = YoffeeChecker(null, [
            { // Static attribute value
                template: () => html()`<div dir=${"rtl"}></div>`,
                expected: () => `<div dir="rtl"></div>`
            }, { // Static attribute name
                template: () => html()`<div ${"attr"}></div>`,
                expected: () => `<div attr></div>`
            }, { // Static dict attribute
                template: () => html()`<div ${{a: 3, b: "asd"}}></div>`,
                expected: () => `<div a="3" b="asd"></div>`
            }, { // Static empty dict attribute
                template: () => html()`<div ${{}}></div>`,
                expected: () => `<div></div>`
            }, { // Static null attr name
                template: () => html()`<div ${null}></div>`,
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
        let check = YoffeeChecker(state, [
            { // Attribute
                template: () => html(state)`<div dir=${() => state.a}></div>`,
                expected: () => state.a ? `<div dir="${state.a === true ? "" : state.a}"></div>` : `<div></div>`
            }, { // Attribute with quotes
                template: () => html(state)`<div dir="${() => state.a}"></div>`,
                expected: () => state.a ? `<div dir="${state.a === true ? "" : state.a}"></div>` : `<div></div>`
            }, { // Part of attribute
                template: () => html(state)`<div dir=a${() => state.a}a></div>`,
                expected: () => `<div dir="a${state.a}a"></div>`
            }, { // Part of attribute with quotes
                template: () => html(state)`<div dir="a ${() => state.a} a"></div>`,
                expected: () => `<div dir="a ${state.a} a"></div>`
            }, { // Twice in the same attribute
                template: () => html(state)`<div dir="${() => state.a} a ${() => state.a}"></div>`,
                expected: () => `<div dir="${state.a} a ${state.a}"></div>`
            }, { // Two attributes with the same prop
                template: () => html(state)`<div a1=${() => state.a} a2=${() => state.a}></div>`,
                expected: () => state.a ? `<div a1="${state.a === true ? "" : state.a}" a2="${state.a === true ? "" : state.a}"></div>` : `<div></div>`
            }, { // Attr name
                template: () => html(state)`<div ${() => state.a}></div>`,
                expected: () => state.a ? `<div ${state.a}></div>` : `<div></div>`
            }, { // Part of attr name
                template: () => html(state)`<div a${() => state.a}a></div>`,
                expected: () => `<div a${state.a}a></div>`
            }, { // Attr dict
                template: () => html(state)`<div ${() => ({a: state.a, b: state.a})}></div>`,
                expected: () => state.a ? `<div a="${state.a === true ? "" : state.a}" b="${state.a === true ? "" : state.a}"></div>` : `<div></div>`
            }, { // Attr dict with static value
                template: () => html(state)`<div ${() => ({a: state.a, b: "smth"})}></div>`,
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

            let check = YoffeeChecker(null, [
                { // Static event handler
                    template: () => html()`<div onclick="${() => clicked = true}"></div>`,
                    expected: () => `<div></div>`,
                    validator: (_, e) => {
                        e.click();
                        assert.equal(clicked, true);
                        clicked = false;
                    }
                }, { // Static event handler that returns function
                    template: () => html()`<div onclick="${() => () => clicked = true}"></div>`,
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
            let check = YoffeeChecker(state, [
                { // Static event handler
                    template: () => html(state)`<div onclick="${() => state.func()}"></div>`,
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

        let check = YoffeeChecker(state, [
            { // Static obj attr
                template: () => html()`<div prop=${{a: "static"}}></div>`,
                expected: () => `<div></div>`,
                validator: (_, e) => assert.equal(e.prop.a, "static") && assert.equal(e.props.prop.a, "static")
            }, { // Obj attr
                template: () => html(state)`<div prop=${() => ({a: state.a})}></div>`,
                expected: () => `<div></div>`,
                validator: (_, e) => assert.equal(e.prop.a, state.a) && assert.equal(e.props.prop.a, state.a)
            }, { // Obj attr
                template: () => html(state)`<div prop=${() => state.obj}></div>`,
                expected: () => state.obj == null ? `<div></div>` : (
                    isObj(state.obj) ? `<div></div>` : `<div prop="${state.obj}"></div>`
                ),
                validator: (_, e) => state.obj == null ? assert.equal(e.prop, null) : (
                    isObj(state.obj) ? (assert.equal(e.prop, state.obj) && assert.equal(e.props.prop, state.obj))
                        : (assert.equal(e.prop, null) && assert.equal(e.props.prop, null))
                )
            }, {
                template: () => html(state)`<div ${() => state.attrsDict}></div>`,
                expected: () => (state.attrsDict == null || state.attrsDict.prop == null) ? `<div></div>` : (
                    isObj(state.attrsDict.prop) ? `<div></div>`
                        : `<div prop="${state.attrsDict.prop}"></div>`
                ),
                validator: (_, e) => (state.attrsDict == null || state.attrsDict.prop == null) ?
                    (assert.equal(e.prop, null) && assert.equal(e.props.prop, null))
                    :
                    (
                        isObj(state.attrsDict.prop) ?
                            (assert.equal(e.prop, state.attrsDict.prop) && assert.equal(e.props.prop, state.attrsDict.prop)) :
                            (assert.equal(e.prop, null) && assert.equal(e.props.prop, null))
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
        assert.throws(() => html()`<div ${"123"}></div>`,
            Error, "Numeric attr name should throw an error");
        assert.throws(() => html()`<div ${"123asd"}></div>`,
            Error, "Attr name that starts with numeric should throw an error");
        assert.throws(() => html()`<div ${{a: 2, b: 3, "123": "illegal"}}></div>`,
            Error, "Numeric attr name in dict should throw an error");

        done()
    });
});
