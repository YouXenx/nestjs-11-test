import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './common/prisma/prisma.service';
import { BaseResponse } from './common/interface/base-response.interface';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-roles')
  async testRoles(): Promise<BaseResponse<any>> {
    const roles = await this.prisma.role.findMany();
    return {
      message: 'Roles retrieved successfully',
      data: roles,
    };
  }
}
