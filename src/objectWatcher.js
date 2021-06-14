// TODO: Make library.

const NoWatchProperty = "__notWatchedProp"

/** @type {Map<Object, [{onGet: Function, onSet: Function}]>} */
const objToListeners = new Map();

/**
 * Calls `onGet` and `onSet` each time a property is accessed / set.
 * It does so by wrapping the object with property accessors and proxying.
 * @param {Object} object
 * @param {Function} onGet
 * @param {Function} onSet
 */
function watch(object, onGet, onSet) {
    let listeners = objToListeners.get(object);
    if (listeners == null) {
        listeners = [{onGet, onSet}];
        objToListeners.set(object, listeners);
        watchObject(
            object,
            prop => listeners.forEach(getset => getset.onGet(prop, object)),
            (prop, value) => listeners.forEach(getset => getset.onSet(prop, value, object))
        )
    } else {
        listeners.push({onGet, onSet})
    }
}

function removeWatcher(object, onGet, onSet) {
    let listeners = objToListeners.get(object);
    if (listeners != null) {
        let index = listeners.findIndex(listener => listener.onGet === onGet && listener.onSet === onSet);
        if (index !== -1) {
            listeners.splice(index, 1)
        }
    }
}

function watchObject(object, onGet, onSet) {
    const propsHolder = {};

    const wrapWithGetSet = propertyName => {
        Object.defineProperty(object, propertyName, {
            get() {
                onGet && onGet(propertyName);
                return propsHolder[propertyName]
            },
            set(value) {
                propsHolder[propertyName] = value;
                onSet && onSet(propertyName, value);
            }
        });
    };

    // Wrap existing properties with getters & setters
    const properties = Object.getOwnPropertyDescriptors(object);
    for (let propertyName of Object.keys(properties)) {
        if (propertyName === NoWatchProperty) {
            continue
        }
        propsHolder[propertyName] = object[propertyName];
        wrapWithGetSet(propertyName)
    }

    // Use proxy to intercept new properties
    Object.setPrototypeOf(object, new Proxy(propsHolder, {
        get(target, propertyName) {
            // This is only called when trying to get non existing props.
            wrapWithGetSet(propertyName);
            Reflect.get(object, propertyName)
        },
        set(target, propertyName, value) {
            wrapWithGetSet(propertyName);
            object[propertyName] = value;
            return true;
        }
    }));
}

export {watch, removeWatcher, NoWatchProperty}
