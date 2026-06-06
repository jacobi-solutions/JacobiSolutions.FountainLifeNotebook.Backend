import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      name: 'fountain-life-notebook-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
