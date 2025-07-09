import { describe, it } from 'node:test';
import { makeDependencyResolver } from './resolver.factory.js';
import assert from 'node:assert';

describe('dependency resolver', () => {
  const userServiceSymbol = Symbol('user service');
  const customerServiceSymbol = Symbol('customer service');
  const idServiceSymbol = Symbol('id service');

  it('repeated calls cause an error', () => {
    interface A { kind: typeof userServiceSymbol }
    interface B { kind: typeof idServiceSymbol }

    const createUserService = (): A => ({ kind: userServiceSymbol });
    const createIdService = (): B => ({ kind: idServiceSymbol });

    const resolve = makeDependencyResolver({
      idService: createIdService,
      userService: createUserService,
    });

    const fail = () => {
      resolve('userService');
      resolve('idService');
    }; // act

    assert.throws(fail);
  });

  it('circular dependencies cause an error', () => {
    interface UserService {
      kind: typeof userServiceSymbol;
      getIdService: () => IdService;
    }

    interface IdService {
      kind: typeof idServiceSymbol;
      getUserService: () => UserService;
    }

    const createUserService = ({ idService }: { idService: IdService }): UserService => ({
      kind: userServiceSymbol,
      getIdService: () => idService,
    });

    const createIdService = ({ userService }: { userService: UserService }): IdService => ({
      kind: idServiceSymbol,
      getUserService: () => userService,
    });

    const resolve = makeDependencyResolver({
      idService: createIdService,
      userService: createUserService,
    });

    const fail = () => {
      resolve('userService');
    };

    assert.throws(
      fail,
      err => err instanceof Error && err.message.includes('userService -> idService -> userService'),
    );
  });

  describe('returns requested single instance with resolved dependencies', () => {
    it('when resolver parameters contains only factories without aliases', () => {
      interface UserService {
        kind: typeof userServiceSymbol;
        getIdService: () => IdService;
      }

      interface IdService {
        kind: typeof idServiceSymbol;
      }

      const createUserService = ({ idService }: { idService: IdService }): UserService => ({
        kind: userServiceSymbol,
        getIdService: () => idService,
      });

      const createIdService = (): IdService => ({ kind: idServiceSymbol });

      const resolve = makeDependencyResolver({
        idService: createIdService,
        userService: createUserService,
      });

      const userService = resolve('userService'); // act

      assert.equal(userService.kind, userServiceSymbol);
      assert.equal(userService.getIdService().kind, idServiceSymbol);
    });

    it('when resolver params contains component instance', () => {
      interface UserService {
        kind: typeof userServiceSymbol;
        getIdService: () => IdService;
      }

      interface IdService {
        kind: typeof idServiceSymbol;
      }

      const createUserService = ({ idService }: { idService: IdService }): UserService => {
        return ({
          kind: userServiceSymbol,
          getIdService: () => idService,
        });
      };

      const idService: IdService = { kind: idServiceSymbol };

      const resolve = makeDependencyResolver({
        idService,
        userService: createUserService,
      });

      const userService = resolve('userService'); // act

      assert.equal(userService.kind, userServiceSymbol);
      assert.equal(userService.getIdService().kind, idServiceSymbol);
    });

    it('when resolver parameters contains factories with aliases', () => {
      interface UserService {
        kind: typeof userServiceSymbol;
        getIdService: () => IdService;
      }

      interface IdService { kind: typeof idServiceSymbol }

      interface UserServiceDeps { paramIdService: IdService }

      const createUserService = ({ paramIdService }: UserServiceDeps): UserService => ({
        kind: userServiceSymbol,
        getIdService: () => paramIdService,
      });

      const createIdService = (): IdService => ({ kind: idServiceSymbol });

      const resolve = makeDependencyResolver({
        idService: createIdService,
        userService: {
          factory: createUserService,
          aliases: {
            paramIdService: 'idService',
          },
        },
      });

      const userService = resolve('userService'); // act

      assert.equal(userService.kind, userServiceSymbol);
      assert.equal(userService.getIdService().kind, idServiceSymbol);
    });
  });

  it('returns dictionary of requested instances, when more than one instance requested to resolve', () => {
    interface UserService {
      kind: typeof userServiceSymbol;
      getIdService: () => IdService;
    }

    interface IdService {
      kind: typeof idServiceSymbol;
    }

    const createUserService = ({ idService }: { idService: IdService }): UserService => ({
      kind: userServiceSymbol,
      getIdService: () => idService,
    });

    const createIdService = (): IdService => ({ kind: idServiceSymbol });

    const resolve = makeDependencyResolver({
      idService: createIdService,
      userService: createUserService,
    });

    const { userService, idService } = resolve('userService', 'idService'); // act

    assert.equal(userService.kind, userServiceSymbol);
    assert.equal(idService.kind, idServiceSymbol);
  });

  it('all components have got the same instance of injected service', () => {
    interface UserService {
      kind: typeof userServiceSymbol;
      getIdService: () => IdService;
    }

    interface CustomerService {
      kind: typeof customerServiceSymbol;
      getIdService: () => IdService;
    }

    interface IdService {
      kind: typeof idServiceSymbol;
    }

    const createUserService = ({ idService }: { idService: IdService }): UserService => ({
      kind: userServiceSymbol,
      getIdService: () => idService,
    });

    const createCustomerService = ({ idService }: { idService: IdService }): CustomerService => ({
      kind: customerServiceSymbol,
      getIdService: () => idService,
    });

    const createIdService = (): IdService => ({ kind: idServiceSymbol });

    const resolve = makeDependencyResolver({
      idService: createIdService,
      userService: createUserService,
      customerService: createCustomerService,
    });

    const { userService, customerService } = resolve('userService', 'customerService'); // act

    assert.equal(userService.getIdService(), customerService.getIdService());
  });
});
