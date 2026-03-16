import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaExceptionFilter } from '../src/common/filters/prisma-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';

describe('AppController (e2e)', () => {
  type StoredUser = {
    id: number;
    name: string;
    email: string;
    password: string | null;
    role: string;
    refreshTokenHash: string | null;
    refreshTokenExpiresAt: Date | null;
  };

  type UserWhere = {
    id?: number;
    email?: string;
  };

  type UserSelect = Record<string, boolean> | undefined;

  class InMemoryPrismaServiceMock {
    private nextUserId = 1;
    readonly users: StoredUser[] = [];

    user = {
      create: async ({
        data,
        select,
      }: {
        data: Omit<
          StoredUser,
          'id' | 'refreshTokenHash' | 'refreshTokenExpiresAt'
        > & {
          refreshTokenHash?: string | null;
          refreshTokenExpiresAt?: Date | null;
        };
        select?: UserSelect;
      }) => {
        const user: StoredUser = {
          id: this.nextUserId++,
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
          refreshTokenHash: data.refreshTokenHash ?? null,
          refreshTokenExpiresAt: data.refreshTokenExpiresAt ?? null,
        };

        this.users.push(user);
        return this.applySelect(user, select);
      },

      findUnique: async ({
        where,
        select,
      }: {
        where: UserWhere;
        select?: UserSelect;
      }) => {
        const user = this.findUser(where);
        return user ? this.applySelect(user, select) : null;
      },

      update: async ({
        where,
        data,
        select,
      }: {
        where: UserWhere;
        data: Partial<StoredUser>;
        select?: UserSelect;
      }) => {
        const user = this.findUser(where);

        if (!user) {
          throw new Error('User not found');
        }

        Object.assign(user, data);
        return this.applySelect(user, select);
      },
    };

    getUserByEmail(email: string) {
      return this.users.find((user) => user.email === email);
    }

    private findUser(where: UserWhere) {
      if (where.id !== undefined) {
        return this.users.find((user) => user.id === where.id);
      }

      if (where.email !== undefined) {
        return this.users.find((user) => user.email === where.email);
      }

      return undefined;
    }

    private applySelect(user: StoredUser, select?: UserSelect) {
      if (!select) {
        return { ...user };
      }

      const selectedEntries = Object.entries(select)
        .filter(([, include]) => include)
        .map(([key]) => [key, user[key as keyof StoredUser]]);

      return Object.fromEntries(selectedEntries);
    }
  }

  const redisServiceMock = {
    onModuleInit: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
  };

  function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  describe('Auth flow (e2e)', () => {
    let app: INestApplication;
    let prismaMock: InMemoryPrismaServiceMock;
    let jwtService: JwtService;

    beforeEach(async () => {
      prismaMock = new InMemoryPrismaServiceMock();

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(PrismaService)
        .useValue(prismaMock)
        .overrideProvider(RedisService)
        .useValue(redisServiceMock)
        .compile();

      app = moduleFixture.createNestApplication();
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
        }),
      );
      app.useGlobalFilters(
        new HttpExceptionFilter(),
        new PrismaExceptionFilter(),
      );

      await app.init();
      jwtService = app.get(JwtService);
    });

    afterEach(async () => {
      await app.close();
      jest.clearAllMocks();
    });

    function createUser(input: {
      name: string;
      email: string;
      password: string;
      role: 'user' | 'admin';
    }) {
      return request(app.getHttpServer()).post('/users').send(input);
    }

    function login(email: string, password: string) {
      return request(app.getHttpServer()).post('/auth/login').send({
        email,
        password,
      });
    }

    it('returns the app hello world response', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });

    it('logs in and uses the access token on the profile route', async () => {
      await createUser({
        name: 'Regular User',
        email: 'user@example.com',
        password: 'StrongPass123',
        role: 'user',
      }).expect(201);

      const loginResponse = await login(
        'user@example.com',
        'StrongPass123',
      ).expect(201);

      expect(loginResponse.body.access_token).toEqual(expect.any(String));
      expect(loginResponse.body.refresh_token).toEqual(expect.any(String));

      const profileResponse = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${loginResponse.body.access_token}`)
        .expect(200);

      expect(profileResponse.body).toEqual({
        userId: 1,
        email: 'user@example.com',
        role: 'user',
      });
    });

    it('rejects invalid login credentials', async () => {
      await createUser({
        name: 'Regular User',
        email: 'user@example.com',
        password: 'StrongPass123',
        role: 'user',
      }).expect(201);

      const response = await login('user@example.com', 'WrongPass123').expect(
        401,
      );

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(401);
      expect(response.body.message.message).toBe('Invalid email or password');
    });

    it('validates login and refresh request payloads', async () => {
      const invalidLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'not-an-email',
          password: '123456',
          extra: 'should fail',
        })
        .expect(400);

      expect(invalidLoginResponse.body.success).toBe(false);
      expect(invalidLoginResponse.body.message.message).toEqual(
        expect.arrayContaining([
          'property extra should not exist',
          'email must be an email',
        ]),
      );

      const invalidRefreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: 'short' })
        .expect(400);

      expect(invalidRefreshResponse.body.success).toBe(false);
      expect(invalidRefreshResponse.body.message.message).toContain(
        'refresh_token must be longer than or equal to 10 characters',
      );
    });

    it('allows admins through the admin-only route and blocks normal users', async () => {
      await createUser({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'StrongPass123',
        role: 'admin',
      }).expect(201);

      await createUser({
        name: 'Regular User',
        email: 'user@example.com',
        password: 'StrongPass123',
        role: 'user',
      }).expect(201);

      const adminLoginResponse = await login(
        'admin@example.com',
        'StrongPass123',
      ).expect(201);
      const userLoginResponse = await login(
        'user@example.com',
        'StrongPass123',
      ).expect(201);

      await request(app.getHttpServer())
        .get('/auth/admin-only')
        .set('Authorization', `Bearer ${adminLoginResponse.body.access_token}`)
        .expect(200)
        .expect({ message: 'Welcome admin' });

      const forbiddenResponse = await request(app.getHttpServer())
        .get('/auth/admin-only')
        .set('Authorization', `Bearer ${userLoginResponse.body.access_token}`)
        .expect(403);

      expect(forbiddenResponse.body.success).toBe(false);
      expect(forbiddenResponse.body.message.message).toBe('Insufficient role');
    });
    //   await createUser({
    //     name: 'Regular User',
    //     email: 'user@example.com',
    //     password: 'StrongPass123',
    //     role: 'user',
    //   }).expect(201);

    //   const firstLoginResponse = await login(
    //     'user@example.com',
    //     'StrongPass123',
    //   ).expect(201);

    //   await wait(1100);

    //   const refreshResponse = await request(app.getHttpServer())
    //     .post('/auth/refresh')
    //     .send({ refresh_token: firstLoginResponse.body.refresh_token })
    //     .expect(201);

    //   expect(refreshResponse.body.access_token).toEqual(expect.any(String));
    //   expect(refreshResponse.body.refresh_token).toEqual(expect.any(String));
    //   expect(refreshResponse.body.refresh_token).not.toBe(
    //     firstLoginResponse.body.refresh_token,
    //   );

    //   const reusedOldRefreshTokenResponse = await request(app.getHttpServer())
    //     .post('/auth/refresh')
    //     .send({ refresh_token: firstLoginResponse.body.refresh_token })
    //     .expect(401);

    //   expect(reusedOldRefreshTokenResponse.body.success).toBe(false);
    //   expect(reusedOldRefreshTokenResponse.body.message.message).toBe(
    //     'Invalid refresh token',
    //   );
    // });

    it('rejects access tokens on the refresh endpoint', async () => {
      await createUser({
        name: 'Regular User',
        email: 'user@example.com',
        password: 'StrongPass123',
        role: 'user',
      }).expect(201);

      const loginResponse = await login(
        'user@example.com',
        'StrongPass123',
      ).expect(201);

      const refreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: loginResponse.body.access_token })
        .expect(401);

      expect(refreshResponse.body.success).toBe(false);
      expect(refreshResponse.body.message.message).toBe(
        'Invalid refresh token',
      );
    });

    it('revokes the refresh token on logout', async () => {
      await createUser({
        name: 'Regular User',
        email: 'user@example.com',
        password: 'StrongPass123',
        role: 'user',
      }).expect(201);

      const loginResponse = await login(
        'user@example.com',
        'StrongPass123',
      ).expect(201);

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${loginResponse.body.access_token}`)
        .expect(201)
        .expect({ message: 'Logged out successfully' });

      const refreshAfterLogoutResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: loginResponse.body.refresh_token })
        .expect(401);

      expect(refreshAfterLogoutResponse.body.success).toBe(false);
      expect(refreshAfterLogoutResponse.body.message.message).toBe(
        'Invalid refresh token',
      );
    });

    it('rejects expired access tokens on protected routes', async () => {
      await createUser({
        name: 'Regular User',
        email: 'user@example.com',
        password: 'StrongPass123',
        role: 'user',
      }).expect(201);

      await login('user@example.com', 'StrongPass123').expect(201);

      const user = prismaMock.getUserByEmail('user@example.com');

      expect(user).toBeDefined();

      const expiredAccessToken = await jwtService.signAsync(
        {
          sub: user!.id,
          email: user!.email,
          role: user!.role,
        },
        {
          expiresIn: -10,
        },
      );

      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${expiredAccessToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(401);
    });

    it('rejects refresh tokens when the stored refresh expiry has passed', async () => {
      await createUser({
        name: 'Regular User',
        email: 'user@example.com',
        password: 'StrongPass123',
        role: 'user',
      }).expect(201);

      const loginResponse = await login(
        'user@example.com',
        'StrongPass123',
      ).expect(201);

      const user = prismaMock.getUserByEmail('user@example.com');

      expect(user).toBeDefined();

      user!.refreshTokenExpiresAt = new Date(Date.now() - 1_000);

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: loginResponse.body.refresh_token })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message.message).toBe('Refresh token expired');
    });

    it('throttles repeated login attempts', async () => {
      await createUser({
        name: 'Regular User',
        email: 'user@example.com',
        password: 'StrongPass123',
        role: 'user',
      }).expect(201);

      for (let attempt = 0; attempt < 5; attempt += 1) {
        await login('user@example.com', 'StrongPass123').expect(201);
      }

      const throttledResponse = await login(
        'user@example.com',
        'StrongPass123',
      ).expect(429);

      expect(throttledResponse.body.statusCode).toBe(429);
    });
  });
});
