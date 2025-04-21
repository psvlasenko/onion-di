// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Factory = (p: any) => any;

type Select<O, T> = {
  [K in keyof O as (T | undefined) extends O[K] ? K : never]: O[K];
};

type Split<T> = {
  [K in keyof T]: {
    [P in K]: T[P];
  };
}[keyof T];

interface FactoryAliases<F extends Factory = Factory, A extends Record<string, string> = Record<string, string>> {
  factory: F;
  aliases: A;
}

type ExtractRenamed<Aliases extends Record<string, string>, Source extends Record<string, unknown>> = {
  [Renamed in (keyof Aliases & keyof Source) as Aliases[Renamed]]: Source[Renamed]
};

type ExtractRequiredAliases<
  Source extends Record<string, unknown>,
  F extends Factory,
> = {
  [K in keyof Parameters<F>[0] as K extends keyof Source
    ? Parameters<F>[0][K] extends Source[K] ? never
    : keyof Split<Select<Source, Parameters<F>[0][K]>>
    : keyof Split<Select<Source, Parameters<F>[0][K]>>
  ]: K
};

type Factories<T extends Factories<T>> = {
  [K in keyof T]: T[K] extends FactoryAliases<infer F, infer A>
    ? {
      factory: (
        params: ComponentTypes<Omit<T, K | keyof A>> & ExtractRenamed<A, ComponentTypes<Omit<T, K>>>
      ) => ReturnType<F>;
      aliases: (A[keyof A] & keyof Parameters<F>[0]) extends never
        ? never
        : ExtractRequiredAliases<ComponentTypes<Omit<T, K>>, F>;
    }
    : T[K] extends Factory ? (params: ComponentTypes<Omit<T, K>>) => ReturnType<T[K]>
    : T[K] extends () => unknown ? () => ReturnType<T[K]>
    : never;
};

type ComponentTypes<T extends object> = {
  [K in keyof T]:
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T[K] extends (p: any) => infer V ? V :
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T[K] extends { factory: (p: any) => infer V } ? V
  : never;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Resolver<C extends ComponentTypes<any>> {
  <K extends keyof C>(key: K): C[K];
  <K extends keyof C>(...keys: K[]): { [Key in K ]: C[Key] };
}

export const checkFactories = <const F extends Factories<F>>(factories: F) => factories;

export const makeDependencyResolver = <const F extends Factories<F>>(params: F): Resolver<ComponentTypes<F>> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const injected: Record<string, any> = {};
  const itemChain: string[] = [];
  const createdComponents = new Map<string, unknown>();
  let wasResolved = false;

  const revert = (dict: Record<string, string>): Map<string, string> =>
    new Map(Object.entries(dict).map(([key, value]) => [value, key]));

  const createProxy = (aliases: Record<string, string>) => {
    const revertedAliases = revert(aliases);

    const handler = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      get: (target: typeof injected, key: string): any => revertedAliases.has(key)
        ? target[revertedAliases.get(key) as keyof typeof injected]
        : Reflect.get(target, key),
    };

    return new Proxy(injected, handler);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getCreationParams = (value: Factory | FactoryAliases): { factory: Factory; params: any } =>
    typeof value === 'function'
      ? { factory: value, params: injected }
      : { factory: value.factory, params: createProxy(value.aliases) };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const makeGetter = (key: string, value: Factory | FactoryAliases): any => () => {
    if (createdComponents.has(key)) {
      return createdComponents.get(key);
    }

    if (itemChain.includes(key)) {
      throw new Error(`Circular dependency: ${itemChain.join(' -> ')} -> ${key}`);
    }

    itemChain.push(key);
    const { factory, params } = getCreationParams(value);
    const result = factory(params);
    createdComponents.set(key, result);
    itemChain.pop();

    return result;
  };

  for (const [key, value] of Object.entries(params)) {
    Object.defineProperty(
      injected,
      key,
      { get: makeGetter(key, value as (Factory | FactoryAliases)) },
    );
  }

  const resolveItem = (key: string) => injected[key as keyof typeof injected];

  const resolve = (keys: string[]) => keys.length === 1
    ? resolveItem(keys.at(0) as string)
    : Object.fromEntries(keys.map(key => [key, resolveItem(key)]));

  return (...key) => {
    if (wasResolved) {
      throw new Error('Repeated resolve calls are not allowed.');
    }

    const result = resolve(key as string[]);
    wasResolved = true;

    return result;
  };
};
