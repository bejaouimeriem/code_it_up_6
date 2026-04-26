import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Experiment } from './entities/experiment.entity';
import { CreateExperimentDto } from './dto/experiment.dto';
import { InventoryService } from '../inventory/inventory.service';   


@Injectable()
export class ExperimentsService {
  constructor(
    @InjectRepository(Experiment)
    private readonly repo: Repository<Experiment>,
    private readonly inventoryService: InventoryService,
  ) {}

  findAll() {
    return this.repo.find({
      relations: ['project'],
      order: { createdAt: 'DESC' },
    });
  }

  findByProject(projectId: number) {
    return this.repo.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const exp = await this.repo.findOne({ where: { id }, relations: ['project'] });
    if (!exp) throw new NotFoundException(`Experiment #${id} not found`);
    return exp;
  }

  // Enregistre l'expérience + les transactions d'inventaire en une seule opération
  async create(dto: CreateExperimentDto) {
    const { usedResources, ...experimentData } = dto;

    // 1. Sauvegarde de l'expérience
    const experiment = this.repo.create(experimentData);
    const saved = await this.repo.save(experiment);

    // 2. Enregistrement des ressources consommées (inventory_transactions)
    if (usedResources && usedResources.length > 0) {
      for (const resource of usedResources) {
        await this.inventoryService.addTransaction(resource.inventoryId, {
          changeAmount: -Math.abs(resource.quantity), // toujours négatif (consommation)
          reason: resource.reason || `Expérience #${saved.id}`,
          experimentId: saved.id,
        });
      }
    }

    return this.findOne(saved.id);
  }
}