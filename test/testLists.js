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

describe('lists', function () {
    it('static lists', function (done) {
        let check = YoffeeChecker(null, [
            {
                template: () => html()`
                <div>before</div>
                ${["item1", "item2"]}
                <div>after</div>
                `,
                expected: () => `
                <div>before</div>item1item2<yoffee-list-location-marker></yoffee-list-location-marker><div>after</div>
                `.trim()
            }, {
                template: () => html()`
                <div>before</div>${["item1", "item2"].map(item => html()`<div>${item}</div>`)}<div>after</div>
                `,
                expected: () => `
                <div>before</div><div>item1</div><div>item2</div><yoffee-list-location-marker></yoffee-list-location-marker><div>after</div>
                `.trim()
            }
        ]);
        check()
        done();
    });
});
