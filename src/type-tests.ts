import type {
  RequiredAliases,
  Select,
  ImpossibleAliases,
  ComponentTypes,
  Renamed,
  PickCommonKeys,
} from './types.js';

export type Factory<P, R = unknown> = (p: P) => R;

export type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
export type ExpectTrue<T extends true> = T;

export interface Source {
  a: 1;
  b: 2;
};

export type F = Factory<{ c: 1 }>;

export type Test1 = ExpectTrue<Equals<Select<{ a: 1; b: 2 }, 1>, { a: 1 }>>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Test2 = ExpectTrue<Equals<Select<{ a: 1; b: 2 }, 3>, {}>>;

export type Test3 = ExpectTrue<
  Equals<Select<{ a: { c: 1; d: 2 }; b: 2 }, { c: 1 }>, { a: { c: 1 } }>
>;

export type Test4 = ExpectTrue<Equals<
  RequiredAliases<{ a: 1; b: 2 }, { c: 1 }>,
  { c: 'a' }
>>;

export type Test5 = ExpectTrue<Equals<
  RequiredAliases<{ a: 1; b: 1 }, { c: 1 }>,
  { c: 'a' | 'b' }
>>;

export type Test6 = ExpectTrue<Equals<
  RequiredAliases<{ a: 1; b: 2 }, { a: 3 }>,
  ImpossibleAliases<'a'>
>>;

export type Test7 = ExpectTrue<Equals<
  RequiredAliases<{ a: 1; b: 2 }, { c: 3 }>,
  ImpossibleAliases<'c'>
>>;

export type Test8 = ExpectTrue<Equals<
  RequiredAliases<{ a: 1; b: 2 }, { c: 3; a: 4 }>,
  ImpossibleAliases<'c' | 'a'>
>>;

export type Test11 = ExpectTrue<Equals<
  ComponentTypes<{ a: () => 1; b: { factory: () => 2 }; c: 3 }>,
  { a: 1; b: 2; c: 3 }
>>;

export type Test12 = ExpectTrue<Equals<
  Renamed<{ a: 'c' }, { c: 1; b: 2 }>,
  { a: 1 }
>>;

export type Test13 = ExpectTrue<Equals<
  PickCommonKeys<{ a: 1; b: 2; c: 3 }, { a: 1; b: 3 }>,
  { a: 1; b: 2 }
>>;
