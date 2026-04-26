import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectRequirement } from '../entities/project-requirement.entity';
import { CreateRequirementDto } from './dto/requirement.dto';

@Injectable()
export class ProjectRequirementsService {
  constructor(
    @InjectRepository(ProjectRequirement)
    private readonly repo: Repository<ProjectRequirement>,
  ) {}

  findByProject(projectId: number) {
    return this.repo.find({
      where: { projectId },
      relations: ['inventory'],
    });
  }

  create(dto: CreateRequirementDto) {
    const req = this.repo.create(dto);
    return this.repo.save(req);
  }

  remove(id: number) {
    return this.repo.delete(id);
  }

  // Pré-remplit les ressources attendues pour une expérience (utilisé par l'Inventory Agent)
  async getPrefilledForExperiment(projectId: number) {
    const reqs = await this.findByProject(projectId);
    return reqs.map((r) => ({
      inventoryId: r.inventoryId,
      inventoryName: r.inventory?.name,
      unit: r.inventory?.unit,
      plannedQuantity: r.requiredQuantity,
      currentStock: r.inventory?.quantity,
      sufficient: r.inventory?.quantity >= r.requiredQuantity,
    }));
  }
}