import { Test, TestingModule } from "@nestjs/testing";
import { CasperService } from "./casper.service";

describe("CasperService", () => {
  let service: CasperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CasperService],
    }).compile();

    service = module.get<CasperService>(CasperService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
