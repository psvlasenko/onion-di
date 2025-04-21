type ToFactory = <T>(value: T) => () => T;

export const toFactory: ToFactory = value => () => value;

type FactoriesOf<T extends object> = {
  [K in keyof T]: () => T[K];
};

export const factoriesOf = <const T extends object>(dict: T): FactoriesOf<T> =>
  Object.fromEntries(Object.entries(dict).map(([key, value]) => [key, () => value])) as FactoriesOf<T>;
