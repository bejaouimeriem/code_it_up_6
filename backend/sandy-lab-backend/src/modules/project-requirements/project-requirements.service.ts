import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectRequirement } from './entities/project-requirement.entity';
import { CreateProjectRequirementDto } from './dto/requirement.dto';
import { UpdateProjectRequirementDto } from './dto/update-project-requirement.dto';

@Injectable()
export class ProjectRequirementsService {
  constructor(
    @InjectRepository(ProjectRequirement)
    private readonly projectRequirementRepository: Repository<ProjectRequirement>,
  ) {}

  async create(createProjectRequirementDto: CreateProjectRequirementDto): Promise<ProjectRequirement> {
    const { projectId, inventoryId } = createProjectRequirementDto;

    // Prevent duplicate requirement for the same project + inventory combo
    const existing = await this.projectRequirementRepository.findOne({
      where: { projectId, inventoryId },
    });

    if (existing) {
      throw new ConflictException(
        `A requirement for inventory #${inventoryId} already exists in project #${projectId}`,
      );
    }

    const requirement = this.projectRequirementRepository.create(createProjectRequirementDto);
    return this.projectRequirementRepository.save(requirement);
  }

  async findAll(): Promise<ProjectRequirement[]> {
    return this.projectRequirementRepository.find({
      relations: ['project', 'inventory'],
    });
  }

  async findOne(id: number): Promise<ProjectRequirement> {
    const requirement = await this.projectRequirementRepository.findOne({
      where: { id },
      relations: ['project', 'inventory'],
    });

    if (!requirement) {
      throw new NotFoundException(`Project requirement #${id} not found`);
    }

    return requirement;
  }

  async update(id: number, updateProjectRequirementDto: UpdateProjectRequirementDto): Promise<ProjectRequirement> {
    const requirement = await this.findOne(id);

    // If projectId or inventoryId is being changed, check for duplicates
    const newProjectId = updateProjectRequirementDto.projectId ?? requirement.projectId;
    const newInventoryId = updateProjectRequirementDto.inventoryId ?? requirement.inventoryId;

    if (
      newProjectId !== requirement.projectId ||
      newInventoryId !== requirement.inventoryId
    ) {
      const conflict = await this.projectRequirementRepository.findOne({
        where: { projectId: newProjectId, inventoryId: newInventoryId },
      });

      if (conflict && conflict.id !== id) {
        throw new ConflictException(
          `A requirement for inventory #${newInventoryId} already exists in project #${newProjectId}`,
        );
      }
    }

    Object.assign(requirement, updateProjectRequirementDto);
    return this.projectRequirementRepository.save(requirement);
  }

  async remove(id: number): Promise<void> {
    const requirement = await this.findOne(id);
    await this.projectRequirementRepository.remove(requirement);
  }
}