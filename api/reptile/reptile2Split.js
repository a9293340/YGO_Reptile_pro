export const reptile2Split = str =>
    str
        .text()
        .split('　')
        .filter(el => el);
