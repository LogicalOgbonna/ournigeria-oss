import { Global, Module, DynamicModule } from '@nestjs/common';
import { PrismaService, PrismaPoolOptions, PRISMA_POOL_OPTIONS } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {
  static forRoot(poolOptions: PrismaPoolOptions): DynamicModule {
    return {
      global: true,
      module: DatabaseModule,
      providers: [
        {
          provide: PRISMA_POOL_OPTIONS,
          useValue: poolOptions,
        },
        PrismaService,
      ],
      exports: [PrismaService],
    };
  }
}
