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

describe('template interactions', function () {
    it("static property of state object shouldn't bind to grand-parent template", function (done) {
        let outerRenders = 0;
        let state = {prop: 1}


        let check = YoffeeChecker(state, [
            {
                template: () => html()`${() => {
                    outerRenders += 1
                    return html(state)`${state.prop}`
                }}`,
                expected: () => 1 // It shouldn't update cause it's static!
            }
        ]);

        check();
        assert.equal(outerRenders, 1);
        state.prop += 1;
        check();
        assert.equal(outerRenders, 1);

        done();
    });
});
