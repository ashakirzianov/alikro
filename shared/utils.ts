export function findDuplicates<T>(arr: T[], comparator: (a: T, b: T) => boolean): T[] {
    const duplicates: T[] = [];
    const seen: T[] = [];

    arr.forEach((item) => {
        if (seen.some((seenItem) => comparator(item, seenItem))) {
            duplicates.push(item);
        } else {
            seen.push(item);
        }
    });

    return duplicates;
}

