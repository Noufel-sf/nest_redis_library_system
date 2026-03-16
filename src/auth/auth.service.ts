import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

type TokenPayload = {
  sub: number;
  email: string;
  role: string;
};

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private getAccessTokenExpiresInSeconds(): number {
    const value = Number(
      this.configService.get<string>('JWT_EXPIRES_IN') ?? '3600',
    );
    return Number.isFinite(value) ? value : 3600;
  }

  private getRefreshTokenExpiresInSeconds(): number {
    const value = Number(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '604800',
    );
    return Number.isFinite(value) ? value : 604800;
  }

  private getRefreshSecret(): string {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      this.configService.getOrThrow<string>('JWT_SECRET')
    );
  }

  private async issueAndPersistTokens(payload: TokenPayload) {
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.getAccessTokenExpiresInSeconds(),
    });

    const refreshToken = await this.jwtService.signAsync(
      {
        ...payload,
        tokenType: 'refresh',
      },
      {
        secret: this.getRefreshSecret(),
        expiresIn: this.getRefreshTokenExpiresInSeconds(),
      },
    );

    const refreshTokenHash = await hash(refreshToken, 10);
    const refreshTokenExpiresAt = new Date(
      Date.now() + this.getRefreshTokenExpiresInSeconds() * 1000,
    );

    await this.prisma.user.update({
      where: { id: payload.sub },
      data: {
        refreshTokenHash,
        refreshTokenExpiresAt,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      select: {
        id: true,
        email: true,
        role: true,
        password: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.issueAndPersistTokens(payload);
  }

  async refresh(dto: RefreshTokenDto) {
    let decoded: TokenPayload & { tokenType?: string };

    try {
      decoded = await this.jwtService.verifyAsync(dto.refresh_token, {
        secret: this.getRefreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (decoded.tokenType !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        role: true,
        refreshTokenHash: true,
        refreshTokenExpiresAt: true,
      },
    });

    if (!user || !user.refreshTokenHash || !user.refreshTokenExpiresAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (user.refreshTokenExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const isRefreshTokenValid = await compare(
      dto.refresh_token,
      user.refreshTokenHash,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.issueAndPersistTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshTokenHash: null,
        refreshTokenExpiresAt: null,
      },
    });

    return { message: 'Logged out successfully' };
  }
}
