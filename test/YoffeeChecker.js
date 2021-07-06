import {validateDom} from "./DomValidator.js";

function YoffeeChecker(stateObj, checkers) {
    if (!Array.isArray(checkers)) {
        checkers = [checkers]
    }
    checkers.forEach(checker => {
        let docFragment = checker.template();
        checker.nodes = docFragment.childNodes
    });

    let stringifyState = () => {
        let stateClone = Object.assign({}, stateObj);
        delete stateClone.___gettersSettersProp
        return JSON.stringify(stateClone, null ,2);
    }
    let stringifyTemplate = checker => checker.template.toString().substring(6);

    return () => checkers.forEach(
        checker => {
            try {
                validateDom(checker.nodes, checker.expected());
            } catch(e) {
                e = `Template was different than expected.\n- Template: ${stringifyTemplate(checker)}\n- State: ${stringifyState()}\n\n${e}`
                throw new Error(e)
            }

            if (checker.validator != null) {
                try {
                    let result = checker.validator(checker.nodes, checker.nodes[0]);
                    if (result === false) {
                        throw "Validator returned false."
                    }
                } catch(e) {
                    let templateStr = stringifyTemplate(checker);
                    let stateStr = stringifyState();
                    let validatorStr = checker.validator.toString();
                    e = `Validator failed.\n- Template: ${templateStr}\n- State: ${stateStr}\n- Validator: ${validatorStr}\n\n${e}`
                    throw new Error(e)
                }
            }
        }
    )
}

export {YoffeeChecker}
