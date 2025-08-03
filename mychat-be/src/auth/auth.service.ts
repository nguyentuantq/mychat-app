import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  // Đăng ký
  async register(dto: RegisterDto): Promise<{ message: string }> {
    const userExists = await this.userModel.findOne({ email: dto.email });
    if (userExists) {
      throw new ConflictException('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = new this.userModel({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
    });

    await user.save();
    return { message: 'User registered successfully' };
  }

  // Đăng nhập
  async login(dto: LoginDto): Promise<{ token: string }> {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { sub: user._id, email: user.email, name: user.name };
    const token = this.jwtService.sign(payload, { expiresIn: '1h' });

    return { token };
  }
}
