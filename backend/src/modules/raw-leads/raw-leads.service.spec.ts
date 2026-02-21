import { Test, TestingModule } from '@nestjs/testing';
import { RawLeadsService } from './raw-leads.service';

describe('RawLeadsService', () => {
  let service: RawLeadsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RawLeadsService],
    }).compile();

    service = module.get<RawLeadsService>(RawLeadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
