function fillStrWithExpressions(str, expressions) {
    for (let exp of expressions) {
        str = str.replace(exp.id, "${" + exp._cb.toString() + "}")
    }
    return str
}

function randomId() {
    return new Array(4).fill(0).map(
        () => Math.random().toString(36).substr(2, 9)).join("-");
}

function addToListInMap(map, key, item) {
    let list = map.get(key)
    if (list != null) {
        list.push(item)
    } else {
        map.set(key, [item])
    }
}

function addToSetInMap(map, key, item) {
    let list = map.get(key)
    if (list != null) {
        list.add(item)
    } else {
        map.set(key, new Set([item]))
    }
}

function getLongestSubsequence(unordered) {
    let rootNode = {
        value: -999999999,
        layer: 0,
        parent: null,
        index: null
    };
    let nodes = [rootNode];
    for (let i = 0; i < unordered.length; i++) {
        let orphan = unordered[i];
        let adoptingFather = nodes[0];
        for (let node of nodes) {
            if (orphan > node.value && node.layer > adoptingFather.layer) {
                adoptingFather = node;
            }
        }
        nodes.push({
            value: orphan,
            layer: adoptingFather.layer + 1,
            parent: adoptingFather,
            index: i
        });
    }

    let maxLayer = -1;
    let bestNode = null;
    for (let node of nodes) {
        if (node.layer > maxLayer) {
            bestNode = node;
            maxLayer = node.layer;
        }
    }

    let indices = [];
    while(bestNode.parent !== null) {
        indices.unshift(bestNode.index);
        bestNode = bestNode.parent
    }
    return indices
}

export {fillStrWithExpressions, randomId, addToListInMap, addToSetInMap, getLongestSubsequence}