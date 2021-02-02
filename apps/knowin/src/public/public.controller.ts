import { Controller, Post, Query } from '@nestjs/common';
import { PublicService } from './public.service';
import { getCode } from 'knowin/status-codes';

@Controller('public')
export class PublicController {
  constructor(readonly publicService: PublicService) {}

  @Post('/contact')
  async contactForm(
    @Query('name') name: string,
    @Query('email') email: string,
    @Query('subject') subject: string,
    @Query('message') message: string,
    @Query('from') from: string,
  ) {
    await this.publicService.sendEmail({
      name,
      email,
      subject,
      message,
      from,
    });

    return {
      status: true,
      statusCode: getCode('M_PP'),
    };
  }
}
