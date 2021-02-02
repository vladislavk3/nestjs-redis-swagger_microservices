import { Test, TestingModule } from '@nestjs/testing';
import { StatusCodesService } from './status-codes.service';
import { codes } from './code.map';

xdescribe('StatusCodesService', () => {
  let service: StatusCodesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StatusCodesService],
    }).compile();

    service = module.get<StatusCodesService>(StatusCodesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be equal', () => {
    expect(service.codes).toStrictEqual(codes);
  });

  it('should return status code and message in english', () => {
    const msg = service.sc('M_A1', 'en');
    expect(msg).toStrictEqual({
      code: 'M_A1',
      message: codes.M_A1.en,
    });
  });

  it('should return status code and message in trukish', () => {
    const msg = service.sc('M_A1', 'tr');
    expect(msg).toStrictEqual({
      code: 'M_A1',
      message: codes.M_A1.tr,
    });
  });
});
