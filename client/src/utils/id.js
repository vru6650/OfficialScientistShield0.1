export const normalizeId = (value) => {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value);
};

export const normalizeIdList = (values) => {
    if (!Array.isArray(values)) {
        return [];
    }

    return values.map(normalizeId).filter(Boolean);
};

export const idsMatch = (left, right) => {
    const normalizedLeft = normalizeId(left);
    const normalizedRight = normalizeId(right);

    return Boolean(normalizedLeft) && normalizedLeft === normalizedRight;
};

export const includesId = (values, targetId) =>
    Array.isArray(values) && values.some((value) => idsMatch(value, targetId));

export const removeId = (values, targetId) => {
    if (!Array.isArray(values)) {
        return [];
    }

    return values.filter((value) => !idsMatch(value, targetId));
};
