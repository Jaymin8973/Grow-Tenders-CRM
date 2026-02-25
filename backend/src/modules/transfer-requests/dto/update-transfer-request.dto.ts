import { PartialType } from '@nestjs/swagger';
import { CreateTransferRequestDto } from './create-transfer-request.dto';

export class UpdateTransferRequestDto extends PartialType(CreateTransferRequestDto) {}
