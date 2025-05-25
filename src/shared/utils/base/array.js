function removeFromArray(array, item) {
    const { length } = array;
    for (let i = 0; i < length; ++i) {
        if (array[i] === item) {
            array.splice(i, 1);
            return true;
        }
    }
    return false;
}

function arraysMatch(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) {
        return false;
    }
    return (
        a.length === b.length &&
        a.every(
            (element, index) =>
                JSON.stringify(element) === JSON.stringify(b[index])
        )
    );
}

function moveArrayItem(array, fromIndex, toIndex) {
    if (!Array.isArray(array) || fromIndex === toIndex) {
        return;
    }
    if (fromIndex < 0 || fromIndex >= array.length) {
        return;
    }
    if (toIndex < 0 || toIndex >= array.length) {
        return;
    }
    const item = array[fromIndex];
    array.splice(fromIndex, 1);
    array.splice(toIndex, 0, item);
}

export { removeFromArray, arraysMatch, moveArrayItem };
