import { Test, TestingModule } from '@nestjs/testing';
import { RawLeadsController } from './raw-leads.controller';

describe('RawLeadsController', () => {
  let controller: RawLeadsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RawLeadsController],
    }).compile();

    controller = module.get<RawLeadsController>(RawLeadsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
