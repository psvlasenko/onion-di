export type Select<O, T> = {
  [K in keyof O as O[K] extends T ? K : never]: T;
};

export type KeysOf<T> = T extends never ? never : keyof T;

export type Split<T> = {
  [K in keyof T]: {
    [P in K]: T[P];
  };
}[keyof T];

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export type Remap<T> = T extends Function ? T : T extends object ? { [K in keyof T]: T[K] } : T;

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export type DeepRemap<T> = T extends Function
  ? T
  : T extends object ? { [K in keyof T]: DeepRemap<T[K]> } : T;

type NotExistentType = never;

export type ImpossibleAliases<T extends string> = Record<T, NotExistentType>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Alias<Source, ParamType> = {} extends Select<Source, ParamType>
  ? NotExistentType
  : KeysOf<Split<Select<Source, ParamType>>>;

export type RequiredAliases<Source, Params> = {
  [K in keyof Params as K extends keyof Source
    ? Source[K] extends Params[K] ? never : K
    : K
  ]: Alias<Source, Params[K]>
};

export type ComponentTypes<T> = {
  [K in keyof T]:
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T[K] extends (p: any) => infer V ? V :
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T[K] extends { factory: (p: any) => infer V } ? V
  : T[K];
};

export type Renamed<Aliases extends Record<string, string>, Source extends Record<string, unknown>> = {
  [K in keyof Aliases]: Source[Aliases[K]]
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Factory<P = any, R = any> = (p: P) => R;

export type FactoryWithAliasesParam<Source, Aliases extends Record<string, string>, K extends keyof Source> =
  Source[K] extends { factory: Factory<infer Params> }
    ? Renamed<Aliases, ComponentTypes<Omit<Source, K>>> & Omit<Params, keyof Aliases>
    : never;

export interface FactoryAliases<F extends Factory = Factory, A extends Record<string, string> = Record<string, string>> {
  factory: F;
  aliases: A;
}

export interface WrappedFactoryAliases<F extends Factory = Factory> {
  factory: F;
}

export type PickCommonKeys<T, U> = { [K in keyof T as K extends keyof U ? K : never]: T[K] };

export type Providers<T> = {
  [K in keyof T]: T[K] extends WrappedFactoryAliases<infer F>
    ? {
      factory: ((params: Remap<FactoryWithAliasesParam<T, RequiredAliases<ComponentTypes<T>, Parameters<F>[0]>, K>>) => ReturnType<F>);
      aliases: DeepRemap<RequiredAliases<ComponentTypes<T>, Parameters<F>[0]>>;
    }
    : T[K] extends Factory<infer P, infer R> ? (providers: Remap<ComponentTypes<PickCommonKeys<Omit<T, K>, P>>>) => R
    : T[K];
};
