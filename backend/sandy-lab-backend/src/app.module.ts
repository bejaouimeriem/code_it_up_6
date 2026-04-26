import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjectsModule } from './modules/projects/projects.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ExperimentsModule } from './modules/experiments/experiments.module';
import { ProjectRequirementsModule } from './modules/project-requirements/project-requirements.module';
import { AiActionsModule } from './modules/ai-actions/ai-actions.module';
import { ResearchCacheModule } from './modules/research-cache/research-cache.module';
import { AgentTasksModule } from './modules/agent-tasks/agent-tasks.module';
import { InventoryTransactionModule } from './modules/inventory-transaction/inventory-transaction.module';

@Module({
  imports: [
    // Configuration des variables d'environnement
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Base de données PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // ⚠️ Désactiver en production (utiliser migrations)
      }),
      inject: [ConfigService],
    }),
    // Modules fonctionnels
    ProjectsModule,
    InventoryModule,
    ExperimentsModule,
    ProjectRequirementsModule,
    AiActionsModule,
    ResearchCacheModule,
    AgentTasksModule,
    InventoryTransactionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}