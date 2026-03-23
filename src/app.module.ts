import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StorageService } from './storage.service';
import { VerifierService } from './verifier.service';
import { MppxService } from './mppx.service';
import { RelayerService } from './relayer.service';
import { DiscoveryController } from './discovery.controller';

@Module({
  imports: [],
  controllers: [AppController, DiscoveryController],
  providers: [
    AppService,
    StorageService,
    VerifierService,
    MppxService,
    RelayerService,
  ],
})
export class AppModule {}
