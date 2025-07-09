import type { ComponentTypes, Providers, Factory, FactoryAliases } from './types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Resolver<C extends ComponentTypes<any>> {
  <K extends keyof C>(key: K): C[K];
  <K extends keyof C>(...keys: K[]): { [Key in K ]: C[Key] };
}

export const makeTypedProviders = <const T extends Providers<T>>(providers: T): T => providers;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Injector = Record<string, any>;
type Aliases = Record<string, string>;

type ComponentMaker = Factory | FactoryAliases;

type Component = object | number | string | boolean | symbol | bigint;
type Provider = Factory | FactoryAliases | Component;

export const makeDependencyResolver = <const T extends Providers<T>>(params: T): Resolver<ComponentTypes<T>> => {
  const injector = makeInjector(params);

  return makeResolver<T>(injector);
};

const makeInjector = <const T extends Providers<T>>(params: T): Injector => {
  const injector: Injector = {};
  const components = new Map<string, unknown>();

  const createProxy = (aliases: Aliases) => {
    const handler = makeInjectorProxyHandler(aliases);

    return new Proxy(injector, handler);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addComponent = (key: string, provider: Provider): any => {
    const component = isMaker(provider) ? makeComponent(provider) : provider;
    components.set(key, component);

    return component;
  };

  const addWithCircularDepsControl = makeCircularDepsControllingAdder(addComponent);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const makeComponentGetter = (key: string, provider: Provider): any => () =>
    components.has(key) ? components.get(key) : addWithCircularDepsControl(key, provider);

  const makeComponent = (maker: ComponentMaker) => {
    const { factory, params } = getCreationParams(maker);

    return factory(params);
  };

  const getCreationParams = (maker: ComponentMaker): { factory: Factory; params: unknown } =>
    typeof maker === 'function'
      ? { factory: maker, params: injector }
      : { factory: maker.factory, params: createProxy(maker.aliases) };

  for (const [key, provider] of Object.entries(params)) {
    Object.defineProperty(
      injector,
      key,
      {
        get: makeComponentGetter(key, provider as Provider),
        configurable: false,
        enumerable: false,
      },
    );
  }

  return injector;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeCircularDepsControllingAdder = (add: (key: string, provider: Provider) => any) => {
  const diKeysChain: string[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (key: string, provider: Provider): any => {
    if (diKeysChain.includes(key)) {
      throw new Error(`Circular dependency: ${diKeysChain.join(' -> ')} -> ${key}`);
    }

    diKeysChain.push(key);
    const component = add(key, provider);
    diKeysChain.pop();

    return component;
  };
};

const makeInjectorProxyHandler = (aliases: Aliases): ProxyHandler<Injector> => ({
  get: (target: Injector, key: string): unknown => Object.hasOwn(aliases, key)
    ? target[aliases[key]]
    : target[key],
});

const makeResolver = <T>(injector: Injector): Resolver<ComponentTypes<T>> => {
  const resolveComponent = (key: string) => injector[key as keyof typeof injector];

  const resolve = (keys: string[]) => keys.length === 1
    ? resolveComponent(keys.at(0) as string)
    : Object.fromEntries(keys.map(key => [key, resolveComponent(key)]));

  let wasResolved = false;

  return (...keys) => {
    if (wasResolved) {
      throw new Error('Repeated resolve calls are not allowed.');
    }

    const result = resolve(keys as string[]);

    wasResolved = true;
    injector = {};

    return result;
  };
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const isFunction = (value: unknown): value is Function => typeof value === 'function';

const isObject = (value: unknown): value is object => typeof value === 'object';

const isMaker = (value: unknown): value is ComponentMaker => isFunction(value)
  || (isObject(value) && isFunction((value as { factory?: unknown })?.factory));
