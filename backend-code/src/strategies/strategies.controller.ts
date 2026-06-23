import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtGuard } from '../auth/jwt.guard';
import { StrategiesService } from './strategies.service';
import { ImportStrategyDto } from './dto/import-strategy.dto';

const TEN_MB = 10 * 1024 * 1024;

type AuthRequest = Request & { user: { id: string } };

@Controller('strategies')
@UseGuards(JwtGuard)
export class StrategiesController {
  constructor(private readonly strategiesService: StrategiesService) {}

  @Get()
  async findAll(@Request() req: AuthRequest) {
    return this.strategiesService.findAllByUser(req.user.id);
  }

  @Post(':id/analyze')
  async analyze(
    @Param('id') id: string,
    @Request() req: AuthRequest,
  ) {
    return this.strategiesService.analyzeById(id, req.user.id);
  }

  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: TEN_MB },
    }),
  )
  async importStrategy(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: TEN_MB }),
          new FileTypeValidator({
            fileType: /(pdf|plain|markdown|x-markdown)/,
            skipMagicNumbersValidation: true,
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body() dto: ImportStrategyDto,
    @Request() req: AuthRequest,
  ) {
    return this.strategiesService.importFromDocument(file, dto, req.user.id);
  }
}
