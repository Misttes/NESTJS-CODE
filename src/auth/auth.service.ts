import { HttpException, Injectable } from '@nestjs/common';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users, UsersDocument } from 'src/users/schema/users.schema';
import { compare, hash } from 'bcrypt';
import { LoginAuthDto } from './dto/login-auth.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Users.name) private readonly userModel: Model<UsersDocument>,
    private jwtService: JwtService  //! firmar
  ){}

  async register(userObject: RegisterAuthDto) {
    const { password } = userObject;
    const plainToHash = await hash(password, 10);  //hash the password
    userObject = { ...userObject, password: plainToHash };
    return this.userModel.create(userObject);
  }
  
  async login(userObjectLogin: LoginAuthDto){
    const { email, password } = userObjectLogin;
    const findUser = await this.userModel.findOne({ email });
    if(!findUser) throw new HttpException("User not found", 404);

    const checkPassword = await compare(password, findUser.password);

    if(!checkPassword) throw new HttpException("PASSWORD_INCORRECT", 403);

    //! Firma
    const payload = { id:findUser._id, name:findUser.name };
    const token = await this.jwtService.signAsync(payload);

    const data = {
      user: findUser,
      token,
    };

    return data;
  };
};
