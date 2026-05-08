export const parseOrderBy = (sort?: string): string[] | undefined => {
  if (!sort) return undefined;

  const arrSort = sort.split(':');

  if (arrSort.length === 2) {
    const [sortValue, sortType] = arrSort;
    return [sortValue, sortType];
  }
  return undefined;
};
