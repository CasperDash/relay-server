import { Test, TestingModule } from "@nestjs/testing";
import { SpeculativeService } from "./speculative.service";

describe("SpeculativeService", () => {
  let service: SpeculativeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpeculativeService],
    }).compile();

    service = module.get<SpeculativeService>(SpeculativeService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
