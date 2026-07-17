import { ConflictException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { CreateUserInput, UsersService } from '../users/users.service';

type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findByEmail: jest.Mock<Promise<User | null>, [string]>;
    create: jest.Mock<Promise<User>, [CreateUserInput]>;
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn<Promise<User | null>, [string]>(),
      create: jest.fn<Promise<User>, [CreateUserInput]>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('creates a user with an argon2 hash of the password, not the plaintext', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockImplementation((data) =>
        Promise.resolve({
          id: 'user-1',
          email: data.email,
          name: data.name,
          passwordHash: data.passwordHash,
          createdAt: new Date('2026-01-01'),
        }),
      );

      await service.register({
        email: 'a@example.com',
        password: 'correct-horse-battery',
        name: 'Ada',
      });

      const createdData: CreateUserInput = usersService.create.mock.calls[0][0];
      expect(createdData.email).toBe('a@example.com');
      expect(createdData.name).toBe('Ada');
      expect(createdData.passwordHash).not.toBe('correct-horse-battery');
      await expect(
        argon2.verify(createdData.passwordHash, 'correct-horse-battery'),
      ).resolves.toBe(true);
    });

    it('returns the created user without the password hash', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        id: 'user-1',
        email: 'a@example.com',
        name: 'Ada',
        passwordHash: 'hashed',
        createdAt: new Date('2026-01-01'),
      });

      const result = await service.register({
        email: 'a@example.com',
        password: 'correct-horse-battery',
        name: 'Ada',
      });

      expect(result).toEqual({
        id: 'user-1',
        email: 'a@example.com',
        name: 'Ada',
        createdAt: new Date('2026-01-01'),
      });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('rejects registration when the email is already taken', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 'existing-user',
        email: 'a@example.com',
        name: 'Existing',
        passwordHash: 'hash',
      });

      await expect(
        service.register({
          email: 'a@example.com',
          password: 'correct-horse-battery',
          name: 'Ada',
        }),
      ).rejects.toThrow(ConflictException);
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });
});
