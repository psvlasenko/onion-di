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
const userServiceSymbol = Symbol('user service');
const nameServiceSymbol = Symbol('name service');
const idServiceSymbol = Symbol('id service');

interface UserService {
  kind: typeof userServiceSymbol;
  getIdService: () => IdService;
  getNameService: () => NameService;
}

interface NameService { kind: typeof nameServiceSymbol }
interface IdService { kind: typeof idServiceSymbol }

interface UserServiceParams {
  nameServiceAlias: NameService;
  idService: IdService;
}

const createUserService = ({ nameServiceAlias, idService }: UserServiceParams): UserService => ({
  kind: userServiceSymbol,
  getIdService: () => idService,
  getNameService: () => nameServiceAlias,
});

const createNameService = (): NameService => ({ kind: nameServiceSymbol });
const createIdService = (): IdService => ({ kind: idServiceSymbol });

const resolve = makeDependencyResolver({
  nameService: createNameService,
  idService: createIdService,
  userService: {
    factory: createUserService,
    aliases: {
      nameService: 'nameServiceAlias',
    },
  },
});

const userService = resolve('userService');
// const { userService, idService } = resolve('userService', 'idService'); resolve multiple instances at one point

assert.equal(userService.kind, userServiceSymbol);
assert.equal(userService.getIdService().kind, idServiceSymbol);
assert.equal(userService.getNameService().kind, nameServiceSymbol);
```
