import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `Hello World! :somthing from env: ${process.env.MONGODB_URI}`;
  }
}
