# Overview
A simple, lightweight, and type-safe dependency injection library.

# Features
  * **Dependency Injection:** Implemented only via a factory function argument of the form: `({ deps1, deps2 }) => result`. Supports resolving multiple instances at one point.
  * **Aliases:** Allows the use of aliases for dependency injection.
  * **Singleton Instances:** Ensures that each dependency is instantiated only once.
  * **Type safety:** The consistency of incoming and outgoing types for component factories is checked.
  * **Circular dependencies are not allowed.**

# Usage example:
```typescript
const configSymbol = Symbol('config symbol');
const userServiceSymbol = Symbol('user service');
const nameServiceSymbol = Symbol('name service');
const idServiceSymbol = Symbol('id service');

interface Config = { kind: typeof config }
interface NameService { kind: typeof nameServiceSymbol }
interface IdService { kind: typeof idServiceSymbol }

interface UserService {
  kind: typeof userServiceSymbol;
  getConfig: () => Config;
  getIdService: () => IdService;
  getNameService: () => NameService;
}

interface UserServiceParams {
  config: Config;
  nameServiceParameterKey: NameService;
  idService: IdService;
}

const createUserService = ({ nameServiceParameterKey, idService, config }: UserServiceParams): UserService => ({
  kind: userServiceSymbol,
  getConfig: () => config,
  getIdService: () => idService,
  getNameService: () => nameServiceParameterKey,
});

const createNameService = (): NameService => ({ kind: nameServiceSymbol });
const createIdService = (): IdService => ({ kind: idServiceSymbol });

const resolve = makeDependencyResolver({
  config: { kind: configSymbol }, // value
  nameService: createNameService, // factory
  idService: createIdService, // factory
  userService: { // factory with aliases
    factory: createUserService,
    aliases: {
      nameServiceParameterKey: 'nameService',
    },
  },
});

const userService = resolve('userService');
// const { userService, idService } = resolve('userService', 'idService'); resolve multiple instances at one point

assert.equal(userService.kind, userServiceSymbol);
assert.equal(userService.getIdService().kind, idServiceSymbol);
assert.equal(userService.getNameService().kind, nameServiceSymbol);
assert.equal(userService.getConfig().kind, configSymbol);
```
