import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly repo: Repository<Project>,
  ) {}

  findAll() {
    return this.repo.find({
      relations: ['requirements', 'requirements.inventory', 'experiments'],
      order: { priority: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const project = await this.repo.findOne({
      where: { id },
      relations: ['requirements', 'requirements.inventory', 'experiments'],
    });
    if (!project) throw new NotFoundException(`Project #${id} not found`);
    return project;
  }

  create(dto: CreateProjectDto) {
    const project = this.repo.create(dto);
    return this.repo.save(project);
  }

  async update(id: number, dto: UpdateProjectDto) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const project = await this.findOne(id);
    return this.repo.remove(project);
  }
}