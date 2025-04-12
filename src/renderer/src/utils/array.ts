


type Comparer<T> = (a: T, b: T) => boolean;

/**
 * find the difference between two arrays 
 * @param a first array
 * @param b second array
 * @param keyComparer compare the elements by a key
 * @param fullComparer function to compare the elements are equal
 * @returns the added, removed and changed elements
 */
export function arrayDiff<T>(a: T[], b: T[], keyComparer: Comparer<T> | undefined, fullComparer: Comparer<T> | null): { added: T[]; removed: T[], changed: T[] } {
  if (keyComparer === undefined) {
    keyComparer = (a: T, b: T) => a === b;
  }
  if (fullComparer === null) {
    fullComparer = (a: T, b: T) => a === b;
  }

  const added = b.filter((bItem) => !a.some((aItem) => keyComparer(aItem, bItem)));
  const removed = a.filter((aItem) => !b.some((bItem) => keyComparer(aItem, bItem)));
  const changed = a.filter((aItem) => {
    const bItem = b.find((bItem) => keyComparer(aItem, bItem));
    return bItem !== undefined && !fullComparer!(aItem, bItem);
  });

  return { added, removed, changed };
}