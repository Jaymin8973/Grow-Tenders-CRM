import { PartialType } from '@nestjs/swagger';
import { CreateRawLeadDto } from './create-raw-lead.dto';

export class UpdateRawLeadDto extends PartialType(CreateRawLeadDto) { }
